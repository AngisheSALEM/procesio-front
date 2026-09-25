import React, { useState } from 'react';
import {
  FileText,
  Plus,
  AlertCircle,
  Download,
  Paperclip,
  Check,
  X
} from 'lucide-react';
import type { DemandeCommunication, ElementDemande, ReponseRecue } from '../types';

interface DemandeCommunicationViewProps {
  initialDemande: DemandeCommunication;
}

export const DemandeCommunicationView: React.FC<DemandeCommunicationViewProps> = ({
  initialDemande,
}) => {
  const [demande, setDemande] = useState<DemandeCommunication>(initialDemande);
  const [showNewResponseModal, setShowNewResponseModal] = useState(false);
  const [showNewDemandeModal, setShowNewDemandeModal] = useState(false);

  // Form states for new response recording
  const [responseForm, setResponseForm] = useState({
    referenceCourrier: '',
    auteur: '',
    dateReception: new Date().toISOString().split('T')[0],
    piecesFournies: [] as string[],
    analyseEnqueteur: '',
    appreciation: 'INCOMPLETE_EXPLICATIVE' as ReponseRecue['appreciation'],
    prochaineAction: '',
  });

  // Calculate statistics
  const totalElements = demande.elementsDemandes.length;
  const fournisCount = demande.elementsDemandes.filter((e) => e.statutRemise === 'FOURNI').length;
  const manquantsCount = demande.elementsDemandes.filter((e) => e.statutRemise === 'MANQUANT').length;
  const incompletsCount = demande.elementsDemandes.filter((e) => e.statutRemise === 'INCOMPLET').length;

  const handleTogglePiece = (elementId: string) => {
    setResponseForm((prev) => {
      const exists = prev.piecesFournies.includes(elementId);
      return {
        ...prev,
        piecesFournies: exists
          ? prev.piecesFournies.filter((id) => id !== elementId)
          : [...prev.piecesFournies, elementId],
      };
    });
  };

  const handleSaveResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseForm.referenceCourrier || !responseForm.auteur) return;

    const missingIds = demande.elementsDemandes
      .map((e) => e.id)
      .filter((id) => !responseForm.piecesFournies.includes(id));

    const newResponse: ReponseRecue = {
      id: `REP-00${demande.reponsesRecues.length + 1}`,
      dateReception: responseForm.dateReception,
      referenceCourrier: responseForm.referenceCourrier,
      auteur: responseForm.auteur,
      elementsFournisIds: responseForm.piecesFournies,
      elementsManquantsIds: missingIds,
      piecesJointes: ['Bordereau_Reception_Certifie.pdf'],
      analyseEnqueteur: responseForm.analyseEnqueteur,
      appreciation: responseForm.appreciation,
      prochaineAction: responseForm.prochaineAction,
    };

    // Update statuses of individual demanded elements
    const updatedElements: ElementDemande[] = demande.elementsDemandes.map((el) => {
      if (responseForm.piecesFournies.includes(el.id)) {
        return { ...el, statutRemise: 'FOURNI' };
      }
      return el;
    });

    const isAllSupplied = updatedElements.every((el) => el.statutRemise === 'FOURNI');

    setDemande((prev) => ({
      ...prev,
      statut: isAllSupplied ? 'REPONSE_COMPLETE' : 'REPONSE_PARTIELLE',
      elementsDemandes: updatedElements,
      reponsesRecues: [newResponse, ...prev.reponsesRecues],
    }));

    setShowNewResponseModal(false);
    setResponseForm({
      referenceCourrier: '',
      auteur: '',
      dateReception: new Date().toISOString().split('T')[0],
      piecesFournies: [],
      analyseEnqueteur: '',
      appreciation: 'INCOMPLETE_EXPLICATIVE',
      prochaineAction: '',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Compact Action Bar & Context */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="  "
              style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)' }}
            >
              {demande.reference}
            </span>
            <span style={{ color: 'var(--color-border)' }}>•</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: demande.statut === 'REPONSE_COMPLETE' ? 'var(--color-success)' : 'var(--color-warning)',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: demande.statut === 'REPONSE_COMPLETE' ? 'var(--color-success)' : 'var(--color-warning)',
                }}
              />
              {demande.statut === 'REPONSE_PARTIELLE' && 'Réponse partielle reçue'}
              {demande.statut === 'REPONSE_COMPLETE' && 'Réponse complète'}
              {demande.statut === 'EMISE' && 'Émise — En attente'}
              {demande.statut === 'A_VALIDER' && 'À valider par la hiérarchie'}
              {demande.statut === 'BROUILLON' && 'Brouillon'}
            </span>
            <span style={{ color: 'var(--color-border)' }}>•</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Destinataire : <strong>{demande.destinataire.nom}</strong> ({demande.destinataire.qualite})
            </span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Signataire : {demande.signataireHabilite} ({demande.gradeSignataire}) • Rédacteur : {demande.redacteur}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowNewDemandeModal(true)}
            className="btn-secondary"
          >
            <FileText size={15} strokeWidth={1.8} />
            <span>Nouvelle demande</span>
          </button>

          <button
            onClick={() => setShowNewResponseModal(true)}
            className="btn-primary"
          >
            <Plus size={15} strokeWidth={2} />
            <span>Enregistrer réponse</span>
          </button>
        </div>
      </div>

      {/* Ergonomic Metric Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total demandé</span>
          <span className="  " style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {totalElements}
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--color-success)' }}>Pièces obtenues</span>
          <span className="  " style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-success)' }}>
            {fournisCount}
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--color-warning)' }}>Pièces manquantes</span>
          <span className="  " style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-warning)' }}>
            {manquantsCount}
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--color-info)' }}>À compléter</span>
          <span className="  " style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-info)' }}>
            {incompletsCount}
          </span>
        </div>
      </div>

      {/* Main Elements Table */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: '14px', fontWeight: 700 }}>
            Inventaire des pièces et justifications requises
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Échéance de réponse initiale : <span className="  ">{demande.echeanceReponse}</span>
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface-muted)',
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <th style={{ padding: '10px 16px', width: '80px' }}>Réf.</th>
              <th style={{ padding: '10px 16px' }}>Libellé précis de la pièce requise</th>
              <th style={{ padding: '10px 16px', width: '180px' }}>Période visée</th>
              <th style={{ padding: '10px 16px', width: '220px' }}>Motif légal d'exigence</th>
              <th style={{ padding: '10px 16px', width: '140px', textAlign: 'center' }}>État de remise</th>
            </tr>
          </thead>
          <tbody>
            {demande.elementsDemandes.map((element) => {
              const isFourni = element.statutRemise === 'FOURNI';
              const isManquant = element.statutRemise === 'MANQUANT';
              const isIncomplet = element.statutRemise === 'INCOMPLET';

              return (
                <tr
                  key={element.id}
                  style={{
                    borderBottom: '1px solid var(--color-border-subtle)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 700 }} className="  ">
                    {element.id}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {element.libelle}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                    {element.periodeConcernee}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                    {element.motifExigence}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {isFourni && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--color-success)' }}>
                        <Check size={13} strokeWidth={2.5} /> Fourni
                      </span>
                    )}
                    {isManquant && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--color-danger)' }}>
                        <X size={13} strokeWidth={2.5} /> Manquant
                      </span>
                    )}
                    {isIncomplet && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--color-warning)' }}>
                        <AlertCircle size={13} strokeWidth={2} /> Incomplet
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Responses Received Section (Courriers & Analyse motivée) */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700 }}>
              Courriers de réponse reçus et examen motivé
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Distinction entre la réception matérielle et l'appréciation d'enquête
            </div>
          </div>
          <span className="  " style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {demande.reponsesRecues.length} réponse(s) enregistrée(s)
          </span>
        </div>

        {demande.reponsesRecues.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '13px',
              border: 'none',
              borderRadius: 'var(--radius-card)',
            }}
          >
            Aucune réponse enregistrée à ce jour. En attente du retour de l'assujetti.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {demande.reponsesRecues.map((rep) => (
              <div
                key={rep.id}
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: 'none',
                  borderRadius: 'var(--radius-card)',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    paddingBottom: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="  " style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)' }}>
                      Courrier réf. {rep.referenceCourrier}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Reçu le <strong className="  ">{rep.dateReception}</strong>
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Par {rep.auteur}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-warning)',
                      fontWeight: 600,
                    }}
                  >
                    Appréciation : Réponse explicative mais incomplète
                  </span>
                </div>

                {/* Analysis Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Analyse motivée de l'enquêteur
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                      {rep.analyseEnqueteur}
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '2px' }}>
                        Prochaine action requise
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {rep.prochaineAction}
                      </div>
                    </div>
                  </div>

                  {/* Attached verified pieces */}
                  <div
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: 'none',
                      borderRadius: 'var(--radius-card)',
                      padding: '12px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      Pièces jointes authentifiées
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {rep.piecesJointes.map((pj, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 8px',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border-subtle)',
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Paperclip size={12} strokeWidth={2} color="var(--color-accent)" />
                            <span className="  ">{pj}</span>
                          </div>
                          <Download size={12} strokeWidth={2} style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Enregistrer une réponse reçue */}
      {showNewResponseModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Enregistrement d'un courrier de réponse
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Demande {demande.reference} — Rapprochement pièces fournies vs manquantes
                </div>
              </div>
              <button
                onClick={() => setShowNewResponseModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResponse} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Référence du courrier reçu *
                  </label>
                  <input
                    type="text"
                    required
                    value={responseForm.referenceCourrier}
                    onChange={(e) => setResponseForm({ ...responseForm, referenceCourrier: e.target.value })}
                    placeholder="Ex: TMB/JUR/CONF/2026/N°812"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Date de réception effective *
                  </label>
                  <input
                    type="date"
                    required
                    value={responseForm.dateReception}
                    onChange={(e) => setResponseForm({ ...responseForm, dateReception: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Auteur / Signataire de la réponse *
                </label>
                <input
                  type="text"
                  required
                  value={responseForm.auteur}
                  onChange={(e) => setResponseForm({ ...responseForm, auteur: e.target.value })}
                  placeholder="Ex: Me Alain Kalenga, Directeur des Affaires Juridiques TMB"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Checklist des pièces fournies */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Cocher les pièces effectivement remises dans ce pli :
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                  {demande.elementsDemandes.map((el) => {
                    const isChecked = responseForm.piecesFournies.includes(el.id);
                    return (
                      <label
                        key={el.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          backgroundColor: 'var(--color-bg)',
                          border: `1px solid ${isChecked ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePiece(el.id)}
                          style={{ accentColor: 'var(--color-accent)' }}
                        />
                        <span className="  " style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                          {el.id}
                        </span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{el.libelle}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Analyse de l'enquêteur */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Analyse motivée de l'enquêteur sur le contenu *
                </label>
                <textarea
                  required
                  rows={3}
                  value={responseForm.analyseEnqueteur}
                  onChange={(e) => setResponseForm({ ...responseForm, analyseEnqueteur: e.target.value })}
                  placeholder="Décrivez les constatations opérées sur les pièces reçues, les incohérences ou concordances constatées..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Prochaine action opérationnelle
                </label>
                <input
                  type="text"
                  value={responseForm.prochaineAction}
                  onChange={(e) => setResponseForm({ ...responseForm, prochaineAction: e.target.value })}
                  placeholder="Ex: Émettre mise en demeure de 8 jours pour pièces manquantes..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewResponseModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    border: 'none',
                    color: 'var(--color-on-accent)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Enregistrer et actualiser le suivi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nouvelle demande de communication */}
      {showNewDemandeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '640px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                Créer une nouvelle demande de communication
              </h3>
              <button
                onClick={() => setShowNewDemandeModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
              Les demandes de communication de pièces doivent être validées et signées par l'autorité hiérarchique compétente (Chef de Division ou Direction Provinciale).
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Destinataire (Organisme / Banque / Transitaire)
                </label>
                <input
                  type="text"
                  placeholder="Ex: RAWBANK SA — Direction de la Conformité"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Signataire habilité proposé
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <option>Jean-Paul Tshilombo — Directeur Provincial des Douanes (Katanga)</option>
                  <option>Albert Mwamba — Chef de Division Recherches & Enquêtes</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Délai de remise imparti
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <option>15 jours ouvrés (Délai légal standard)</option>
                  <option>8 jours francs (Procédure d'urgence motivée)</option>
                  <option>30 jours francs (Banque centrale ou correspondants extérieurs)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={() => setShowNewDemandeModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    alert('Brouillon de demande enregistré avec succès.');
                    setShowNewDemandeModal(false);
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    border: 'none',
                    color: 'var(--color-on-accent)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Enregistrer en brouillon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
