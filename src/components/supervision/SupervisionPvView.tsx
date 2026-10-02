import React from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Lock,
  FileText,
  Building,
  CheckCircle2
} from 'lucide-react';
import type { DossierEnquete, PvDetail } from '../../types';
import type { DossierTabId } from '../DossierHeader';

interface SupervisionPvViewProps {
  pvs?: Record<string, PvDetail[]>;
  dossiers?: DossierEnquete[];
  onOpenDossier?: (dossierId: string, tab?: DossierTabId) => void;
  onBack?: () => void;
  unit?: string;
  start?: string;
  end?: string;
}

export const SupervisionPvView: React.FC<SupervisionPvViewProps> = ({
  onBack,
  unit: _unit,
  start: _start,
  end: _end,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          padding: '20px 24px',
          border: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                title="Retour à la synthèse"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-surface-muted)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                Indicateur PV : Dossiers Ayant Conduit à un Procès-Verbal
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Famille "pv" · Indicateur "cases.pv_proven" · Statut réglementaire
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-btn)',
              fontSize: '12px',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
            }}
          >
            <Lock size={14} color="var(--color-warning, #eab308)" />
            <span>Indicateur Masqué (DEC-04)</span>
          </div>
        </div>
      </div>

      {/* Main Institutional Clarification Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border-subtle)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            backgroundColor: 'rgba(234, 179, 8, 0.07)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={22} color="var(--color-warning, #eab308)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Décision institutionnelle DGDA — Règle DEC-04
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              La preuve et la référence officielle d'un procès-verbal restent à définir par la DGDA (DEC-04).
              Une orientation contentieuse ou une transmission GELEC ne constitue pas un procès-verbal au sens légal.
              Conformément à la politique d'intégrité statistique du système, aucun chiffre non certifié ni enregistrement fictif n’est comptabilisé.
            </div>
          </div>
        </div>

        {/* 3 Explanation Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div
            style={{
              backgroundColor: 'var(--color-surface-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '13px' }}>
              <Building size={16} color="var(--color-accent)" />
              <span>Cadre Réglementaire Douanier</span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              L'établissement d'un PV douanier d'infraction requiert la constatation matérielle d'une infraction,
              le respect du formalisme légal et la signature des officiers verbalisateurs habilités.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-surface-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '13px' }}>
              <AlertTriangle size={16} color="var(--color-warning, #eab308)" />
              <span>Distinction GELEC vs PV</span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Un transfert ou une transmission GELEC est un relais de dossier administratif ou judiciaire.
              Il ne préjuge pas de la rédaction effective d’un PV certifié d’infraction.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-surface-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '13px' }}>
              <CheckCircle2 size={16} color="var(--color-accent)" />
              <span>Intégrité & Piste d’Audit</span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Les statistiques retournent <code>null</code> pour l’indicateur <code>cases.pv_proven</code> sans générer
              de faux totaux afin d’assurer la conformité stricte lors des audits de gouvernance.
            </p>
          </div>
        </div>

        {/* Action Link to Models */}
        <div
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            paddingTop: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Le modèle documentaire préliminaire (DGDA-PV-CONST) est classifié fictif dans le référentiel jusqu'à validation formelle.
          </div>
          <a
            href="#/documents-modeles"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-accent)',
              textDecoration: 'none',
            }}
          >
            <FileText size={14} />
            <span>Consulter le référentiel des modèles documentaires</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupervisionPvView;
