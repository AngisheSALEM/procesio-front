import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import type { FeuilleObservation, AppreciationObservation } from '../types';

interface FeuilleObservationViewProps {
  initialFeuille: FeuilleObservation;
}

export const FeuilleObservationView: React.FC<FeuilleObservationViewProps> = ({
  initialFeuille,
}) => {
  const [feuille, setFeuille] = useState<FeuilleObservation>(initialFeuille);
  const [expandedObs, setExpandedObs] = useState<string>('O2'); // O2 opened by default
  const [showAddDefenseModal, setShowAddDefenseModal] = useState<string | null>(null);
  const [showNewObsModal, setShowNewObsModal] = useState(false);

  // Form for adding defense or updating appreciation
  const [defenseForm, setDefenseForm] = useState({
    arguments: '',
    piecesJointes: '',
    appreciation: 'POINT_EXPLIQUE' as AppreciationObservation,
    analyseMotivee: '',
  });

  const toggleExpand = (code: string) => {
    setExpandedObs((prev) => (prev === code ? '' : code));
  };

  const handleSaveDefense = (code: string) => {
    if (!defenseForm.arguments && !defenseForm.analyseMotivee) return;

    setFeuille((prev) => ({
      ...prev,
      observations: prev.observations.map((obs) => {
        if (obs.code === code) {
          let updatedStatut = obs.statutConstat;
          if (defenseForm.appreciation === 'POINT_EXPLIQUE') {
            updatedStatut = 'CLOS_REGULARISE';
          } else if (defenseForm.appreciation === 'COMPLEMENT_REQUIS') {
            updatedStatut = 'EN_ATTENTE_REPONSE';
          } else if (defenseForm.appreciation === 'CONSTAT_CONFIRME') {
            updatedStatut = 'MAINTENU_CONTENTIEUX';
          }

          return {
            ...obs,
            defenseRecue: {
              dateReception: new Date().toISOString().split('T')[0],
              arguments: defenseForm.arguments || (obs.defenseRecue?.arguments ?? ''),
              piecesJointes: defenseForm.piecesJointes
                ? defenseForm.piecesJointes.split(',').map((s) => s.trim())
                : (obs.defenseRecue?.piecesJointes ?? []),
            },
            appreciationEnqueteur: defenseForm.appreciation,
            statutConstat: updatedStatut,
            analyseMotivee: defenseForm.analyseMotivee || obs.analyseMotivee,
          };
        }
        return obs;
      }),
    }));

    setShowAddDefenseModal(null);
    setDefenseForm({
      arguments: '',
      piecesJointes: '',
      appreciation: 'POINT_EXPLIQUE',
      analyseMotivee: '',
    });
  };

  // Counts
  const totalObs = feuille.observations.length;
  const closCount = feuille.observations.filter((o) => o.statutConstat === 'CLOS_REGULARISE').length;
  const attenteCount = feuille.observations.filter((o) => o.statutConstat === 'EN_ATTENTE_REPONSE').length;
  const contentieuxCount = feuille.observations.filter((o) => o.statutConstat === 'MAINTENU_CONTENTIEUX').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Compact Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-surface)',
          padding: '14px 20px',
          borderRadius: 'var(--radius-card)',
          border: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)' }}>
              {feuille.reference}
            </span>
            <span style={{ color: 'var(--color-border)' }}>•</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Feuille d'observation contradictoire
            </span>
          </div>

          <span style={{ color: 'var(--color-border)' }}>•</span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-warning)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-warning)',
              }}
            />
            Défenses reçues — En cours d'appréciation
          </span>

          {feuille.dateReunionCloturePrevue && (
            <>
              <span style={{ color: 'var(--color-border)' }}>•</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <Calendar size={13} color="var(--color-accent)" strokeWidth={2} />
                <span>
                  Réunion de clôture : <strong className="font-mono">{feuille.dateReunionCloturePrevue}</strong>
                </span>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowNewObsModal(true)}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <Plus size={15} strokeWidth={2} />
            <span>Ajouter une observation (O{totalObs + 1})</span>
          </button>
        </div>
      </div>

      {/* Observation Summary Metrics */}
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
            border: 'none',
            padding: '14px',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Constats émis</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
            {totalObs}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            padding: '14px',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--color-success)' }}>Points expliqués / régularisés</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
            {closCount}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            padding: '14px',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--color-warning)' }}>Compléments demandés</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>
            {attenteCount}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            padding: '14px',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--color-danger)' }}>Maintenus (relais contentieux)</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-danger)', marginTop: '4px' }}>
            {contentieuxCount}
          </div>
        </div>
      </div>

      {/* Observations List: O1, O2, O3... */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {feuille.observations.map((obs) => {
          const isExpanded = expandedObs === obs.code;
          const isClos = obs.statutConstat === 'CLOS_REGULARISE';
          const isAttente = obs.statutConstat === 'EN_ATTENTE_REPONSE';
          const isContentieux = obs.statutConstat === 'MAINTENU_CONTENTIEUX';

          return (
            <div
              key={obs.code}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: 'none',
                borderRadius: 'var(--radius-card)',
                overflow: 'hidden',
              }}
            >
              {/* Observation Header Line */}
              <div
                onClick={() => toggleExpand(obs.code)}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: isExpanded ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
                  borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div
                    className="font-mono"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {obs.code}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {obs.titre}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {obs.referencesJuridiques}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Status Indicator */}
                  {isClos && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-success)' }}>
                      <CheckCircle2 size={14} strokeWidth={2} /> Point expliqué (Régularisé)
                    </span>
                  )}
                  {isAttente && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-warning)' }}>
                      <Clock size={14} strokeWidth={2} /> Complément à demander
                    </span>
                  )}
                  {isContentieux && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-danger)' }}>
                      <AlertTriangle size={14} strokeWidth={2} /> Constat maintenu (Contentieux)
                    </span>
                  )}

                  {isExpanded ? (
                    <ChevronUp size={18} color="var(--color-text-muted)" />
                  ) : (
                    <ChevronDown size={18} color="var(--color-text-muted)" />
                  )}
                </div>
              </div>

              {/* Observation Expanded Details: Faits / Défense / Appréciation */}
              {isExpanded && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Grid 3 Colonnes: Faits constatés | Éléments de défense | Appréciation motivée */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.1fr 1.1fr 1.2fr',
                      gap: '16px',
                    }}
                  >
                    {/* Colonne 1: Faits & Justificatifs */}
                    <div
                      style={{
                        backgroundColor: 'var(--color-bg)',
                        border: 'none',
                        borderRadius: 'var(--radius-card)',
                        padding: '14px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: 'var(--color-text-secondary)',
                          marginBottom: '8px',
                        }}
                      >
                        1. Faits constatés & pièces probantes
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.45 }}>
                        {obs.faitsConstates}
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                          Justificatifs rattachés :
                        </div>
                        <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {obs.justificatifsAssocies.map((j, idx) => (
                            <li key={idx} style={{ marginBottom: '2px' }}>
                              <span className="font-mono">{j}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-accent)' }}>
                          Question notifiée à l'assujetti :
                        </div>
                        <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--color-text-primary)', marginTop: '2px' }}>
                          "{obs.questionsAssujetti}"
                        </div>
                      </div>
                    </div>

                    {/* Colonne 2: Éléments de défense reçus */}
                    <div
                      style={{
                        backgroundColor: 'var(--color-bg)',
                        border: 'none',
                        borderRadius: 'var(--radius-card)',
                        padding: '14px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: 'var(--color-text-secondary)',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>2. Éléments de défense reçus</span>
                        {obs.defenseRecue && (
                          <span className="font-mono" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            Reçu le {obs.defenseRecue.dateReception}
                          </span>
                        )}
                      </div>

                      {obs.defenseRecue ? (
                        <>
                          <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.45 }}>
                            {obs.defenseRecue.arguments}
                          </div>

                          {obs.defenseRecue.piecesJointes.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                Pièces produites par la défense :
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {obs.defenseRecue.piecesJointes.map((pj, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      fontSize: '11px',
                                      padding: '3px 6px',
                                      backgroundColor: 'var(--color-surface)',
                                      borderRadius: 'var(--radius-sm)',
                                      border: '1px solid var(--color-border-subtle)',
                                      color: 'var(--color-text-secondary)',
                                    }}
                                  >
                                    <span className="font-mono">{pj}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
                          Aucun mémoire ni élément de défense enregistré pour ce point.
                        </div>
                      )}

                      <div style={{ marginTop: '14px' }}>
                        <button
                          onClick={() => {
                            setDefenseForm({
                              arguments: obs.defenseRecue?.arguments || '',
                              piecesJointes: obs.defenseRecue?.piecesJointes.join(', ') || '',
                              appreciation: obs.appreciationEnqueteur || 'POINT_EXPLIQUE',
                              analyseMotivee: obs.analyseMotivee || '',
                            });
                            setShowAddDefenseModal(obs.code);
                          }}
                          className="btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                          }}
                        >
                          Mettre à jour les moyens de défense
                        </button>
                      </div>
                    </div>

                    {/* Colonne 3: Appréciation motivée de l'enquêteur */}
                    <div
                      style={{
                        backgroundColor: 'var(--color-bg)',
                        border: 'none',
                        borderRadius: 'var(--radius-card)',
                        padding: '14px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: 'var(--color-accent)',
                          marginBottom: '8px',
                        }}
                      >
                        3. Appréciation motivée de l'enquêteur
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.45 }}>
                        {obs.analyseMotivee}
                      </div>

                      <div
                        style={{
                          marginTop: '14px',
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isContentieux
                            ? 'var(--color-danger-surface)'
                            : isClos
                            ? 'var(--color-success-surface)'
                            : 'var(--color-warning-surface)',
                          border: `1px solid ${
                            isContentieux
                              ? 'var(--color-danger)'
                              : isClos
                              ? 'var(--color-success)'
                              : 'var(--color-warning)'
                          }`,
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          Orientation pour le rapport final :
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--color-text-primary)' }}>
                          {isClos && 'Régularisation financière opérée. Aucun relais contentieux requis sur ce chef.'}
                          {isAttente && 'Délai supplémentaire accordé jusqu’à la réunion de clôture pour justifier.'}
                          {isContentieux && 'Proposition de procès-verbal d’infraction et transmission contentieuse vers GELEC.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Mise à jour des moyens de défense & appréciation motivée */}
      {showAddDefenseModal && (
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
              maxWidth: '620px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                  Instruction contradictoire — Constat {showAddDefenseModal}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Enregistrement des moyens de défense et appréciation motivée
                </div>
              </div>
              <button
                onClick={() => setShowAddDefenseModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Arguments présentés par la défense
                </label>
                <textarea
                  rows={3}
                  value={defenseForm.arguments}
                  onChange={(e) => setDefenseForm({ ...defenseForm, arguments: e.target.value })}
                  placeholder="Expliquez la thèse ou les justificatifs soutenus par l'opérateur économique..."
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
                  Pièces justificatives produites (séparées par une virgule)
                </label>
                <input
                  type="text"
                  value={defenseForm.piecesJointes}
                  onChange={(e) => setDefenseForm({ ...defenseForm, piecesJointes: e.target.value })}
                  placeholder="Ex: Facture_Transport_Maersk.pdf, Releve_Bancaire.pdf"
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
                  Appréciation motivée de l'enquêteur *
                </label>
                <select
                  value={defenseForm.appreciation}
                  onChange={(e) =>
                    setDefenseForm({
                      ...defenseForm,
                      appreciation: e.target.value as AppreciationObservation,
                    })
                  }
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
                  <option value="POINT_EXPLIQUE">Point expliqué — Justificatif probant fourni (Régularisation)</option>
                  <option value="COMPLEMENT_REQUIS">Complément requis — Réponse partielle / Justificatif incomplet</option>
                  <option value="ANALYSE_EN_COURS">Analyse en cours — Vérification technique ou expertise requise</option>
                  <option value="CONSTAT_CONFIRME">Constat confirmé — Infraction douanière caractérisée (Contentieux)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Motivation écrite de l'appréciation
                </label>
                <textarea
                  rows={3}
                  value={defenseForm.analyseMotivee}
                  onChange={(e) => setDefenseForm({ ...defenseForm, analyseMotivee: e.target.value })}
                  placeholder="Détaillez l'appréciation motivée et l'analyse de l'enquêteur..."
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddDefenseModal(null)}
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
                  type="button"
                  onClick={() => handleSaveDefense(showAddDefenseModal)}
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
                  Valider l'appréciation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajouter une observation O4 */}
      {showNewObsModal && (
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
              maxWidth: '620px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                Nouvelle observation — O{totalObs + 1}
              </h3>
              <button
                onClick={() => setShowNewObsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Titre du constat
                </label>
                <input
                  type="text"
                  placeholder="Ex: Minoration de la valeur transactionnelle sur commission d'achat"
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
                  Faits constatés et justificatifs
                </label>
                <textarea
                  rows={3}
                  placeholder="Détaillez les constatations factuelles..."
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
                  Base réglementaire ou motif
                </label>
                <input
                  type="text"
                  placeholder="Ex: Qualification de la valeur transactionnelle"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => setShowNewObsModal(false)}
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
                  onClick={() => {
                    alert(`Observation O${totalObs + 1} ajoutée au projet de feuille.`);
                    setShowNewObsModal(false);
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
                  Enregistrer l'observation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
