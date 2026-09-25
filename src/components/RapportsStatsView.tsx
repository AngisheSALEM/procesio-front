import React from 'react';
import { BarChart3, ExternalLink } from 'lucide-react';

interface RapportsStatsViewProps {
  onOpenDossier: () => void;
}

export const RapportsStatsView: React.FC<RapportsStatsViewProps> = ({ onOpenDossier }) => {

  const kpis = [
    {
      id: 'kpi-renseignements',
      label: 'Renseignements reçus & exploités',
      valeur: '24 / 19',
      sousTitre: '19 exploités en ouverture d’enquête (79%)',
      detail: 'Distingue réception et exploitation effective sans doublon.',
      hasAction: true,
    },
    {
      id: 'kpi-dossiers',
      label: 'Dossiers en cours & retards',
      valeur: '12 / 1',
      sousTitre: '1 seul dossier en retard d’échéance légale',
      detail: 'Rattaché à une date butoir de contrôle a posteriori stricte.',
      hasAction: true,
    },
    {
      id: 'kpi-demandes',
      label: 'Demandes de communication',
      valeur: '38',
      sousTitre: '14 complètes • 18 partielles • 6 en attente',
      detail: 'Traçabilité des réponses bancaires et transporteurs déclarés.',
      hasAction: true,
    },
    {
      id: 'kpi-delai',
      label: 'Délai moyen de première réponse',
      valeur: '11 jours',
      sousTitre: 'Contre 15 jours légaux impartis',
      detail: 'Point de départ : date de notification au destinataire.',
      hasAction: false,
    },
    {
      id: 'kpi-observations',
      label: 'Feuilles d’observation & constats',
      valeur: '29 constats',
      sousTitre: '16 régularisés • 8 en cours • 5 confirmés pour contentieux',
      detail: 'Comptabilisation atomique O1, O2, O3 par chef de redressement.',
      hasAction: true,
    },
    {
      id: 'kpi-pv-gelec',
      label: 'Dossiers transmis à GELEC',
      valeur: '5 affaires',
      sousTitre: 'Assorties de 7 procès-verbaux d’infraction qualifiés',
      detail: 'Exige une référence de PV formelle et confirmation de prise en charge.',
      hasAction: true,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} color="var(--color-accent)" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Rapports d’Activité et Statistiques Opérationnelles
          </h2>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Principe fondamental Procezo : Chaque chiffre affiché est auditable et cliquable pour ouvrir la liste
          des dossiers et justificatifs qui l’expliquent, éliminant les comptages manuels parallèles.
        </div>
      </div>

      {/* KPI Interactive Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            onClick={() => {
              if (kpi.hasAction) {
                onOpenDossier();
              }
            }}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: 'none',
              borderRadius: 'var(--radius-card)',
              padding: '18px',
              cursor: kpi.hasAction ? 'pointer' : 'default',
              transition: 'background var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                {kpi.label}
              </div>
              {kpi.hasAction && (
                <ExternalLink size={13} color="var(--color-accent)" />
              )}
            </div>

            <div className="  " style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '6px' }}>
              {kpi.valeur}
            </div>

            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)', marginTop: '2px' }}>
              {kpi.sousTitre}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: 1.3 }}>
              {kpi.detail}
            </div>

            {kpi.hasAction && (
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)', fontSize: '11px', color: 'var(--color-accent)', fontWeight: 600 }}>
                Cliquer pour ouvrir les dossiers justificatifs →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
