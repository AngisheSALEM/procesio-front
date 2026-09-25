import React from 'react';
import {
  Calendar,
  Clock
} from 'lucide-react';
import type { EcheanceDossier } from '../types';

interface DossierEcheancesTabProps {
  echeances: EcheanceDossier[];
}

export const DossierEcheancesTab: React.FC<DossierEcheancesTabProps> = ({
  echeances,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Échéances procédurales et délais légaux du dossier
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          Jalons réglementaires (Code des douanes   et Décision 2011/296) avec horodatage de notification.
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              <th style={{ padding: '12px 16px' }}>Jalon procédural</th>
              <th style={{ padding: '12px 16px', width: '180px' }}>Nature juridique</th>
              <th style={{ padding: '12px 16px', width: '180px' }}>Horodatage de fixation</th>
              <th style={{ padding: '12px 16px', width: '140px' }}>Date butoir</th>
              <th style={{ padding: '12px 16px', width: '130px' }}>État du délai</th>
            </tr>
          </thead>
          <tbody>
            {echeances.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucune date butoir enregistrée pour ce dossier.
                </td>
              </tr>
            ) : (
              echeances.map((ech) => {
                const isImminent = ech.statut === 'IMMINENT';

                return (
                  <tr
                    key={ech.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {ech.libelle}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {ech.typeEcheance}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        <Clock size={12} color="var(--color-accent)" />
                        <span className="  ">{ech.horodatageFixe}</span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Calendar size={12} color="var(--color-text-muted)" />
                        <span className="  " style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {ech.dateButoir}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '5px',
                          backgroundColor: isImminent ? 'var(--color-warning-surface)' : 'var(--color-surface-elevated)',
                          color: isImminent ? 'var(--color-warning)' : 'var(--color-info)',
                        }}
                      >
                        {isImminent ? 'Imminent' : 'Dans les délais'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
