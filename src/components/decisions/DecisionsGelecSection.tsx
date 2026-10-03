import React, { useState, useRef } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Eye,
  FileCheck
} from 'lucide-react';
import type { WorkspaceData } from '../../api/workspace';
import {
  proposeDecision,
  reviewDecision,
  prepareTransfer,
  recordTransfer,
  orderedDecisions,
  currentDecision,
  decisionSources,
  decisionKindLabels,
  decisionStateLabels,
  transferStateLabels,
} from '../../api/decisions';
import type { ApiDecision, ApiGelecTransfer } from '../../api/client';
import { PdfPreviewModal } from '../common/PdfPreviewModal';

interface DecisionsGelecSectionProps {
  caseId: string;
  workspace: WorkspaceData | null;
  onRefresh?: () => Promise<unknown>;
  canUpdate?: boolean;
}

export const DecisionsGelecSection: React.FC<DecisionsGelecSectionProps> = ({
  caseId,
  workspace,
  onRefresh,
  canUpdate = true,
}) => {
  // États de saisie de proposition
  const [kind, setKind] = useState<ApiDecision['kind']>('classification');
  const [sourceId, setSourceId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // État de retour motivé
  const [returnComment, setReturnComment] = useState('');
  const [showReturnInputFor, setShowReturnInputFor] = useState<string | null>(null);

  // État de transfert GELEC
  const [transferProof, setTransferProof] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 16));
  const [transferRef, setTransferRef] = useState('');
  const transferKeys = useRef(new Map<string, string>());

  // Vue d'information détaillée (Vraie page info au lieu d'une modale)
  const [detailedViewDecision, setDetailedViewDecision] = useState<ApiDecision | null>(null);

  // Prévisualisation PDF
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');

  if (!workspace) return null;

  const decisions = orderedDecisions(workspace.decisions[caseId] || []);
  const current = currentDecision(decisions);
  const latest = decisions[0];
  const sources = decisionSources(workspace, caseId);
  const selectedSource = sources.find((s) => s.id === sourceId);
  const transfers = workspace.transfers?.[caseId] || [];
  const caseDocuments = (workspace.documents[caseId] || []).filter(
    (d) => d.state === 'accepted' && d.content_type === 'application/pdf'
  );

  const canPropose = canUpdate && latest?.state !== 'proposed';

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 6000);
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !sourceId) {
      showFeedback('Veuillez sélectionner une appréciation et saisir un motif.', 'error');
      return;
    }
    setBusy(true);
    try {
      await proposeDecision(workspace, caseId, kind, reason, sourceId);
      setReason('');
      setSourceId('');
      if (onRefresh) await onRefresh();
      showFeedback('Proposition de décision administrative enregistrée avec succès. Un responsable habilité doit la valider.', 'success');
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : 'Erreur lors de la proposition.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReview = async (decision: ApiDecision, action: 'validate' | 'return') => {
    if (action === 'return' && !returnComment.trim()) {
      showFeedback('Un motif circonstancié est requis pour retourner une décision.', 'error');
      return;
    }
    setBusy(true);
    try {
      await reviewDecision(decision, action, returnComment);
      setReturnComment('');
      setShowReturnInputFor(null);
      if (onRefresh) await onRefresh();
      showFeedback(
        action === 'validate'
          ? 'Décision administrative validée avec succès. Les indicateurs du dossier ont été actualisés.'
          : 'Décision retournée à l’instructeur avec motif de complément.',
        'success'
      );
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : 'Action impossible.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePrepareTransfer = async (decision: ApiDecision) => {
    setBusy(true);
    try {
      await prepareTransfer(decision);
      if (onRefresh) await onRefresh();
      showFeedback('Bordereau de relais GELEC préparé. Veuillez maintenant enregistrer la preuve de transmission.', 'success');
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : 'Échec de la préparation du relais GELEC.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRecordTransfer = async (transfer: ApiGelecTransfer, action: 'transmit' | 'confirm') => {
    if (!transferProof || !transferDate) {
      showFeedback('Veuillez sélectionner une preuve PDF et renseigner la date réelle.', 'error');
      return;
    }
    setBusy(true);
    try {
      await recordTransfer(transfer, action, transferProof, transferDate, transferRef, workspace.documents[caseId] || [], transferKeys.current);
      setTransferProof('');
      if (onRefresh) await onRefresh();
      showFeedback(
        action === 'transmit'
          ? 'Transmission GELEC enregistrée. En attente de confirmation de réception par la Direction Contentieuse.'
          : 'Réception par le Contentieux GELEC confirmée avec sa preuve horodatée.',
        'success'
      );
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement du transfert GELEC.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // --- VRAIE PAGE INFO : Détail exhaustif d'une décision au lieu d'une modale ---
  if (detailedViewDecision) {
    const historyEvents: any[] = ((workspace as any).decisionEvents?.[detailedViewDecision.id] || []);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDetailedViewDecision(null)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          >
            <ArrowLeft size={15} />
            <span>Revenir au dossier</span>
          </button>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Identifiant officiel : {detailedViewDecision.id}
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card, 16px)',
            border: '1px solid var(--color-border)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
                Fiche d'instruction & Décision administrative
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0 0 0' }}>
                {decisionKindLabels[detailedViewDecision.kind]} · Version {detailedViewDecision.version}
              </h2>
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: detailedViewDecision.state === 'validated' ? 'rgba(16, 185, 129, 0.15)' : detailedViewDecision.state === 'proposed' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: detailedViewDecision.state === 'validated' ? 'var(--color-success)' : detailedViewDecision.state === 'proposed' ? 'var(--color-accent)' : 'var(--color-danger, #ef4444)',
              }}
            >
              {decisionStateLabels[detailedViewDecision.state]}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--color-surface-elevated)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Auteur de la proposition</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {workspace.users.find((u) => u.id === detailedViewDecision.author)?.username || `Agent #${detailedViewDecision.author}`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Le {new Date(detailedViewDecision.created_at).toLocaleString('fr-FR')}
              </div>
            </div>

            {detailedViewDecision.validator && (
              <div style={{ padding: '14px', backgroundColor: 'var(--color-surface-elevated)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Responsable validateur (visa)</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                  {workspace.users.find((u) => u.id === detailedViewDecision.validator)?.username || `Agent #${detailedViewDecision.validator}`}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Le {detailedViewDecision.validated_at ? new Date(detailedViewDecision.validated_at).toLocaleString('fr-FR') : 'Date non renseignée'}
                </div>
              </div>
            )}

            <div style={{ padding: '14px', backgroundColor: 'var(--color-surface-elevated)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Source probante liée</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {detailedViewDecision.request_assessment ? 'Appréciation de demande de communication' : 'Appréciation sur feuille d’observation'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Réf : {detailedViewDecision.request_assessment || detailedViewDecision.observation_assessment}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Motif circonstancié de la décision
            </h4>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '10px', fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
              {detailedViewDecision.reason}
            </div>
          </div>

          {detailedViewDecision.return_comment && (
            <div style={{ marginBottom: '24px', padding: '14px 18px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-danger, #ef4444)', marginBottom: '4px' }}>
                Motif du retour formulé par la hiérarchie :
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                {detailedViewDecision.return_comment}
              </div>
            </div>
          )}

          {/* Timeline historique des visas et actions */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
              Journal des événements et traçabilité ({historyEvents.length})
            </h4>
            {historyEvents.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Aucun événement historisé.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {historyEvents.map((ev: any) => (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-surface-elevated)', borderRadius: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} color="var(--color-accent)" />
                      <span>{ev.kind === 'created' ? 'Proposition soumise' : ev.kind === 'validated' ? 'Visa de validation apposé' : ev.kind === 'returned' ? 'Dossier retourné pour complément' : ev.kind}</span>
                      {ev.comment && <span style={{ color: 'var(--color-text-muted)' }}>— {ev.comment}</span>}
                    </div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
                      {new Date(ev.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- VUE NORMALE INTÉGRÉE DANS LE DOSSIER ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Feedback */}
      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-btn, 8px)',
            backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger, #ef4444)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Carte d'état de la décision courante */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card, 16px)',
          border: '1px solid var(--color-border)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Orientation & Décisions Administratives du Dossier
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Classement sans suite, mission complémentaire ou relais vers la Direction du Contentieux (GELEC).
            </div>
          </div>

          {current ? (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--color-success)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={13} />
              {decisionKindLabels[current.kind]} (Validée · Courante)
            </span>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'var(--color-surface-elevated)' }}>
              Aucune décision validée courante
            </span>
          )}
        </div>

        {/* Liste des décisions enregistrées */}
        {decisions.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', backgroundColor: 'var(--color-bg)', borderRadius: '10px' }}>
            Aucune orientation n’a encore été proposée pour ce dossier d’enquête.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {decisions.map((dec) => {
              const isCurrentVal = dec.id === current?.id;
              const authorUser = workspace.users.find((u) => u.id === dec.author);
              const validatorUser = dec.validator ? workspace.users.find((u) => u.id === dec.validator) : null;

              return (
                <div
                  key={dec.id}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: isCurrentVal ? '1px solid var(--color-accent)' : '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        {decisionKindLabels[dec.kind]}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: dec.state === 'validated' ? 'rgba(16, 185, 129, 0.15)' : dec.state === 'proposed' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: dec.state === 'validated' ? 'var(--color-success)' : dec.state === 'proposed' ? 'var(--color-accent)' : 'var(--color-danger, #ef4444)',
                        }}
                      >
                        {decisionStateLabels[dec.state]} · v{dec.version}
                      </span>
                      {isCurrentVal && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)' }}>
                          ★ Orientation en vigueur
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Vraie page info pour consulter le détail */}
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setDetailedViewDecision(dec)}
                        style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Eye size={12} />
                        <span>Fiche détaillée & Historique</span>
                      </button>

                      {/* Actions habilitées par le serveur */}
                      {dec.allowed_actions?.includes('validate') && (
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={busy}
                          onClick={() => void handleReview(dec, 'validate')}
                          style={{ fontSize: '11px', padding: '5px 12px' }}
                        >
                          Valider la décision
                        </button>
                      )}

                      {dec.allowed_actions?.includes('return') && (
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={busy}
                          onClick={() => setShowReturnInputFor(showReturnInputFor === dec.id ? null : dec.id)}
                          style={{ fontSize: '11px', padding: '5px 10px', color: 'var(--color-danger, #ef4444)' }}
                        >
                          Retourner avec motif
                        </button>
                      )}

                      {dec.allowed_actions?.includes('prepare_transfer') && !transfers.some((t: ApiGelecTransfer) => t.decision === dec.id) && (
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={busy}
                          onClick={() => void handlePrepareTransfer(dec)}
                          style={{ fontSize: '11px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Send size={12} />
                          <span>Préparer le relais GELEC</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Motif */}
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {dec.reason}
                  </div>

                  {/* Métadonnées auteur et date */}
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>Proposée par : <strong>{authorUser?.username || `Agent #${dec.author}`}</strong> le {new Date(dec.created_at).toLocaleDateString('fr-FR')}</span>
                    {validatorUser && <span>Validée par : <strong>{validatorUser.username}</strong></span>}
                    {dec.replaces && <span>Remplace la décision #{dec.replaces.slice(0, 8)}</span>}
                  </div>

                  {/* Zone de saisie pour retourner la décision */}
                  {showReturnInputFor === dec.id && (
                    <div style={{ marginTop: '10px', padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', marginBottom: '6px' }}>
                        Motif circonstancié du retour hiérarchique :
                      </label>
                      <textarea
                        value={returnComment}
                        onChange={(e) => setReturnComment(e.target.value)}
                        placeholder="Ex : Éléments justificatifs contradictoires insuffisants sur le constat O2. Veuillez instruire un complément..."
                        rows={2}
                        maxLength={500}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '12px',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text-primary)',
                          outline: 'none',
                          marginBottom: '8px',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowReturnInputFor(null)} style={{ fontSize: '11px' }}>
                          Annuler
                        </button>
                        <button type="button" className="btn-primary" disabled={busy || !returnComment.trim()} onClick={() => void handleReview(dec, 'return')} style={{ fontSize: '11px' }}>
                          Confirmer le retour
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Relais GELEC : Panneau de transmission et accusés de réception */}
      {transfers.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card, 16px)',
            border: '1px solid var(--color-border)',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Send size={16} color="var(--color-accent)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Transmission & Relais Contentieux GELEC
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {transfers.map((t: ApiGelecTransfer) => {
              const action = t.allowed_actions?.includes('transmit')
                ? 'transmit'
                : t.allowed_actions?.includes('confirm')
                ? 'confirm'
                : null;

              return (
                <div
                  key={t.id}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                        Relais GELEC · {transferStateLabels[t.state]} · Version {t.version}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Réf. d’envoi : <strong>{t.transmission_reference || t.reference || 'En cours de transmission'}</strong>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        backgroundColor: t.state === 'confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: t.state === 'confirmed' ? 'var(--color-success)' : 'var(--color-accent)',
                      }}
                    >
                      {t.state === 'confirmed' ? 'Dossier réceptionné par GELEC' : 'En transit contentieux'}
                    </span>
                  </div>

                  {/* Preuves jointes */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {t.transmission_proof && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          const doc = (workspace.documents[caseId] || []).find((d) => d.id === t.transmission_proof);
                          setPreviewPdfTitle(doc?.original_name || 'Preuve_Transmission_GELEC.pdf');
                          setPreviewPdfUrl(`/api/v1/documents/${t.transmission_proof}/telecharger/`);
                        }}
                        style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FileCheck size={13} />
                        <span>Preuve d’envoi GELEC</span>
                      </button>
                    )}
                    {t.receipt_proof && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          const doc = (workspace.documents[caseId] || []).find((d) => d.id === t.receipt_proof);
                          setPreviewPdfTitle(doc?.original_name || 'Accuse_Reception_GELEC.pdf');
                          setPreviewPdfUrl(`/api/v1/documents/${t.receipt_proof}/telecharger/`);
                        }}
                        style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <ShieldCheck size={13} color="var(--color-success)" />
                        <span>Preuve de réception GELEC</span>
                      </button>
                    )}
                  </div>

                  {/* Formulaire d'étape : Transmettre ou Confirmer */}
                  {action && (
                    <div style={{ marginTop: '6px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '10px' }}>
                        {action === 'transmit' ? 'Enregistrer la transmission effective vers GELEC' : 'Confirmer la réception officielle par le Contentieux'}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                            {action === 'transmit' ? 'Preuve PDF de transmission' : 'Preuve PDF de réception'}
                          </label>
                          <select
                            value={transferProof}
                            onChange={(e) => setTransferProof(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              fontSize: '12px',
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '6px',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            <option value="">Sélectionner un PDF accepté du dossier</option>
                            {caseDocuments.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.original_name} ({Math.ceil(doc.size / 1024)} Ko)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                            Date & heure réelles constatées
                          </label>
                          <input
                            type="datetime-local"
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              fontSize: '12px',
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '6px',
                              color: 'var(--color-text-primary)',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                            Référence du bordereau / bordereau GELEC
                          </label>
                          <input
                            type="text"
                            value={transferRef}
                            onChange={(e) => setTransferRef(e.target.value)}
                            placeholder="Ex : TR-GELEC-2026-0842"
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              fontSize: '12px',
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '6px',
                              color: 'var(--color-text-primary)',
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={busy || !transferProof || !transferDate}
                          onClick={() => void handleRecordTransfer(t, action)}
                          style={{ fontSize: '12px', padding: '7px 16px' }}
                        >
                          {action === 'transmit' ? 'Consigner la transmission' : 'Valider la réception définitive'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulaire de proposition d'orientation (visible si l'agent a l'autorisation) */}
      {canPropose && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card, 16px)',
            border: '1px solid var(--color-border)',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <FileText size={16} color="var(--color-accent)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {latest ? 'Proposer une nouvelle orientation ou un remplacement' : 'Proposer une orientation pour ce dossier'}
            </h3>
          </div>

          <form onSubmit={handlePropose} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Nature de l’orientation proposée
                </label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as ApiDecision['kind'])}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="classification">Classement sans suite (conformité justifiée)</option>
                  <option value="gelec">Transmission contentieuse GELEC (infraction caractérisée)</option>
                  <option value="mission">Mission d’enquête complémentaire de terrain</option>
                  <option value="complement">Demande de communication de pièces complémentaires</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Appréciation probante de référence
                </label>
                <select
                  required
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="">Sélectionner une appréciation de fond actuelle</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.conclusion === 'satisfactory' ? 'Satisfaisante' : 'Non satisfaisante'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSource && (
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                <strong>Motif de l’appréciation source :</strong> {selectedSource.reason}
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', marginBottom: '6px' }}>
                Motif circonstancié de la décision proposée
              </label>
              <textarea
                required
                rows={3}
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Rédigez l’analyse juridique et factuelle motivant l’orientation proposée..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '13px',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={busy || !sourceId || !reason.trim()}
                style={{ fontSize: '13px', padding: '8px 18px' }}
              >
                {busy ? 'Enregistrement…' : 'Enregistrer la proposition'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Visionneuse PDF connectée */}
      {previewPdfUrl && (
        <PdfPreviewModal
          isOpen={Boolean(previewPdfUrl)}
          onClose={() => setPreviewPdfUrl(null)}
          title={previewPdfTitle}
          fileUrl={previewPdfUrl}
        />
      )}
    </div>
  );
};
