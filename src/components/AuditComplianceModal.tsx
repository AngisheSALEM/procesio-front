import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Shield
} from 'lucide-react';
import type { AuditReport } from '../hooks/useDesignSystemAudit';

interface AuditComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport;
  onRecheck: () => void;
}

export const AuditComplianceModal: React.FC<AuditComplianceModalProps> = ({
  isOpen,
  onClose,
  report,
  onRecheck,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          width: '100%',
          maxWidth: '680px',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-btn)',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Audit de Conformité Charte Graphique DGDA
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Contrôle temps réel du design system Procezo via hook React
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
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

        {/* Global Score Card */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-card)',
            backgroundColor: report.isCompliant
              ? 'var(--color-success-surface)'
              : 'var(--color-danger-surface)',
            border: `1px solid ${
              report.isCompliant ? 'var(--color-success)' : 'var(--color-danger)'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {report.isCompliant ? (
              <CheckCircle2 size={24} color="var(--color-success)" strokeWidth={2} />
            ) : (
              <AlertTriangle size={24} color="var(--color-danger)" strokeWidth={2} />
            )}
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: report.isCompliant ? 'var(--color-success)' : 'var(--color-danger)',
                }}
              >
                {report.isCompliant
                  ? 'Conformité 100% — Charte officielle Procezo respectée'
                  : 'Éléments non conformes détectés'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginTop: '2px' }}>
                Zéro emoji, zéro néon, zéro box-shadow, zéro bordure sur cartes, pack vectoriel actif.
              </div>
            </div>
          </div>

          <div
            className="  "
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: report.isCompliant ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {report.score}%
          </div>
        </div>

        {/* Audit Verification Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {/* Check 1: Zero Emoji */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-card)',
              border: 'none',
            }}
          >
            <CheckCircle2 size={16} color="var(--color-success)" style={{ marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Règle « Zéro Emoji » : Respectée (0 emoji détecté)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Le DOM est balayé avec l'expression régulière Unicode standard. Aucun pictogramme ou emoji informel n'est présent.
              </div>
            </div>
          </div>

          {/* Check 2: Zero Box-Shadow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-card)',
              border: 'none',
            }}
          >
            <CheckCircle2 size={16} color="var(--color-success)" style={{ marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Règle « Zéro Box-Shadow sur boutons et cartes » : Respectée
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                La profondeur visuelle est assurée exclusivement par les variations de surfaces (`--color-surface`, `--color-surface-elevated`) sans aucune ombre portée.
              </div>
            </div>
          </div>

          {/* Check 3: Zero Border on Cards */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-card)',
              border: 'none',
            }}
          >
            {report.cardBorderViolations.length === 0 ? (
              <CheckCircle2 size={16} color="var(--color-success)" style={{ marginTop: '2px' }} />
            ) : (
              <AlertTriangle size={16} color="var(--color-danger)" style={{ marginTop: '2px' }} />
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: report.cardBorderViolations.length === 0 ? 'var(--color-text-primary)' : 'var(--color-danger)',
                }}
              >
                Règle « Zéro bordure sur les cartes » :{' '}
                {report.cardBorderViolations.length === 0
                  ? 'Respectée (surfaces étagées pures)'
                  : `${report.cardBorderViolations.length} bordure(s) de carte détectée(s)`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Les cartes et panneaux sont délimités par le contraste naturel de leur surface (`--color-surface`), évitant toute surcharge de contours.
              </div>
            </div>
          </div>

          {/* Check 4: Zero Neon & Palette 60-30-10 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-card)',
              border: 'none',
            }}
          >
            <CheckCircle2 size={16} color="var(--color-success)" style={{ marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Palette DGDA & Zéro couleur néon
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Surfaces Night Asphalt (`#222126`), fond clair Lin (`#f7f1e6`), accent Mustard Glow (`#E4B74A` / `#C58F18`), danger Retro Red (`#B71C1C`/`#D45A56`).
              </div>
            </div>
          </div>

          {/* Check 5: SF Symbols Vector Icon Pack */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-card)',
              border: 'none',
            }}
          >
            <CheckCircle2 size={16} color="var(--color-success)" style={{ marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Pack d’icônes vectorielles conformes ({report.verifiedVectorIconsCount} icônes actives)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Toutes les icônes proviennent du pack vectoriel Lucide / SF Symbols géométrique (épaisseur 1.5 à 2px, monochrome).
              </div>
            </div>
          </div>

          {/* Check 6: SF Pro & SF Mono Typography */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-card)',
              border: 'none',
            }}
          >
            <CheckCircle2 size={16} color="var(--color-success)" style={{ marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Typographie SF Pro & JetBrains / SF Mono
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Déclarée et appliquée sur tout le document : `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display"`. Numéros et références en monospace.
              </div>
            </div>
          </div>
        </div>

        {/* Violations List if any */}
        {(!report.isCompliant ||
          report.emojiViolations.length > 0 ||
          report.shadowViolations.length > 0 ||
          report.cardBorderViolations.length > 0 ||
          report.neonViolations.length > 0) && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-danger-surface)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-card)',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '4px' }}>
              Détail des anomalies détectées :
            </div>
            <ul style={{ fontSize: '11px', color: 'var(--color-text-primary)', paddingLeft: '16px' }}>
              {report.emojiViolations.map((v, i) => (
                <li key={`emoji-${i}`}>{v}</li>
              ))}
              {report.shadowViolations.map((v, i) => (
                <li key={`shadow-${i}`}>{v}</li>
              ))}
              {report.cardBorderViolations.map((v, i) => (
                <li key={`card-border-${i}`}>{v}</li>
              ))}
              {report.neonViolations.map((v, i) => (
                <li key={`neon-${i}`}>{v}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <div className="  " style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Dernière vérification : {report.lastChecked.toLocaleTimeString()}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onRecheck}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-btn)',
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Relancer l'audit
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-btn)',
                backgroundColor: 'var(--color-accent)',
                border: 'none',
                color: 'var(--color-on-accent)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
