import React, { useState } from 'react';
import {
  Plus,
  Clock,
  X
} from 'lucide-react';
import type { AlerteDossier, UserAccount } from '../types';

interface DossierAlertesTabProps {
  alertes: AlerteDossier[];
  onAddAlerte: (newAlert: {
    titre: string;
    message: string;
    niveau: 'CRITIQUE' | 'AVERTISSEMENT' | 'INFO';
    actionRequise: string;
  }) => void;
  user: UserAccount;
}

export const DossierAlertesTab: React.FC<DossierAlertesTabProps> = ({
  alertes,
  onAddAlerte,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [niveau, setNiveau] = useState<'CRITIQUE' | 'AVERTISSEMENT' | 'INFO'>('AVERTISSEMENT');
  const [actionRequise, setActionRequise] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || !message.trim()) return;

    onAddAlerte({
      titre: titre.trim(),
      message: message.trim(),
      niveau,
      actionRequise: actionRequise.trim() || 'Examen requis par l’enquêteur',
    });

    setTitre('');
    setMessage('');
    setActionRequise('');
    setShowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Alertes et signalements d’irrégularité du dossier
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Notifications de délais échus, divergences SYDONIA et signalements douaniers horodatés.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            fontSize: '12px',
          }}
        >
          <Plus size={14} strokeWidth={2.2} />
          <span>Signaler une alerte</span>
        </button>
      </div>

      {/* Alert List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alertes.length === 0 ? (
          <div
            style={{
              padding: '30px',
              textAlign: 'center',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              color: 'var(--color-text-muted)',
              fontSize: '13px',
            }}
          >
            Aucune alerte active pour ce dossier. Toutes les échéances et procédures sont régulières.
          </div>
        ) : (
          alertes.map((alerte) => {
            const isCritique = alerte.niveau === 'CRITIQUE';
            const isAvertissement = alerte.niveau === 'AVERTISSEMENT';

            const badgeBg = isCritique
              ? 'var(--color-error-surface)'
              : isAvertissement
              ? 'var(--color-warning-surface)'
              : 'var(--color-info-surface)';

            const badgeColor = isCritique
              ? 'var(--color-error)'
              : isAvertissement
              ? 'var(--color-warning)'
              : 'var(--color-info)';

            return (
              <div
                key={alerte.id}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-card)',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '5px',
                        backgroundColor: badgeBg,
                        color: badgeColor,
                      }}
                    >
                      {alerte.niveau}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {alerte.titre}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <Clock size={12} color="var(--color-accent)" />
                    <span>Signalé le : <strong className="  " style={{ color: 'var(--color-text-secondary)' }}>{alerte.horodatage}</strong></span>
                    <span>•</span>
                    <span>Par : {alerte.auteur}</span>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                  {alerte.message}
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px',
                  }}
                >
                  <strong style={{ color: 'var(--color-accent)' }}>Action recommandée : </strong>
                  <span style={{ color: 'var(--color-text-primary)' }}>{alerte.actionRequise}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Signaler une alerte sur ce dossier
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Motif / Objet de l’alerte *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Discordance manifeste relevée sur déclaration SYDONIA"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Description circonstanciée *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Détaillez les éléments de risque ou le dépassement constaté..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Niveau de gravité
                  </label>
                  <select
                    value={niveau}
                    onChange={(e) => setNiveau(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="AVERTISSEMENT">Avertissement</option>
                    <option value="CRITIQUE">Critique</option>
                    <option value="INFO">Information</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Action recommandée
                  </label>
                  <input
                    type="text"
                    placeholder="Ex : Relance sous 48h"
                    value={actionRequise}
                    onChange={(e) => setActionRequise(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Enregistrer l’alerte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
