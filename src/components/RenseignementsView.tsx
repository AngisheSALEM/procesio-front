import React, { useState } from 'react';
import {
  Radio,
  Share2,
  X
} from 'lucide-react';
import { mockRenseignements } from '../data/mockData';

interface RenseignementsViewProps {
  onOpenDossier: () => void;
}

export const RenseignementsView: React.FC<RenseignementsViewProps> = ({ onOpenDossier }) => {
  const [renseignements] = useState(mockRenseignements);
  const [showDiffusionModal, setShowDiffusionModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Distinction Renseignement vs Dossier */}
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} color="var(--color-accent)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Gestion du Renseignement Douanier
            </h2>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', maxWidth: '720px' }}>
            Un renseignement est une information brute ou qualifiée. Il peut alimenter plusieurs dossiers, faire l’objet
            d'une diffusion interne multi-bureaux, ou être classé sans ouverture d’enquête artificielle.
          </div>
        </div>

        <button
          onClick={() => setShowDiffusionModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-btn)',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-on-accent)',
            border: 'none',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Share2 size={14} strokeWidth={2} />
          <span>Créer une diffusion interne multi-bureaux</span>
        </button>
      </div>

      {/* Renseignements Table */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
            Renseignements enregistrés et état d'exploitation
          </h3>
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
              <th style={{ padding: '10px 16px', width: '160px' }}>Référence</th>
              <th style={{ padding: '10px 16px', width: '110px' }}>Date</th>
              <th style={{ padding: '10px 16px' }}>Origine & Objet</th>
              <th style={{ padding: '10px 16px', width: '180px' }}>Niveau d'accès</th>
              <th style={{ padding: '10px 16px', width: '160px' }}>Statut d'exploitation</th>
              <th style={{ padding: '10px 16px', width: '140px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {renseignements.map((ren) => (
              <tr key={ren.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 700 }} className="  ">
                  {ren.reference}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }} className="  ">
                  {ren.dateReception}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{ren.objet}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Origine : {ren.origine} • {ren.resume}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-accent)',
                      fontWeight: 600,
                    }}
                  >
                    {ren.niveauAcces}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-success)',
                      fontWeight: 600,
                    }}
                  >
                    {ren.statut}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button
                    onClick={onOpenDossier}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Voir le dossier lié
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Diffusion interne multi-bureaux */}
      {showDiffusionModal && (
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
                  Diffusion Interne de Renseignement (Alerte Multi-Bureaux)
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Alerte diffusée sans création artificielle de dossier d'enquête
                </div>
              </div>
              <button
                onClick={() => setShowDiffusionModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Objet de l'alerte
                </label>
                <input
                  type="text"
                  placeholder="Ex: Signalement sur minoration fret conteneurs au départ de Durban"
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
                  Services et bureaux destinataires
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked /> Bureau de Kasumbalesa Frontière (Poste 401)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked /> Bureau de Lubumbashi Gare & Ville (Poste 402)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked /> Bureau de Sakania Rail
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Action attendue des bureaux récepteurs
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
                  <option>Pour information et veille documentaire ciblée</option>
                  <option>Surveillance renforcée avec retour systématique au greffe DRK</option>
                  <option>Blocage en douane sous réserve d'avis DRK</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={() => setShowDiffusionModal(false)}
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
                    alert('Alerte diffusée avec accusé de réception automatique généré.');
                    setShowDiffusionModal(false);
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
                  Diffuser l'alerte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
