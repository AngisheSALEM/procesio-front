import React from 'react';
import { Sun, Moon, User, Bell, Check, Shield, Briefcase, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { UserAccount } from '../types';
import type { useTechnicalDebt } from '../hooks/useTechnicalDebt';

interface ParametresViewProps {
  user: UserAccount;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  technicalDebt?: ReturnType<typeof useTechnicalDebt>;
}

export const ParametresView: React.FC<ParametresViewProps> = ({
  user,
  theme,
  onToggleTheme,
  technicalDebt,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Paramètres du système
        </h1>
      </div>

      {/* Intégration Backend & Audit Dette Technique */}
      {technicalDebt && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            borderRadius: 'var(--radius-card)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 122, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-accent)',
                }}
              >
                <Activity size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Intégration Backend & Audit Technique
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Supervision en direct de la conformité DRF, persistance base et habilitations RBAC
                </p>
              </div>
            </div>

            {/* Health Score Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: technicalDebt.summary.healthScore >= 90 ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 149, 0, 0.12)',
                color: technicalDebt.summary.healthScore >= 90 ? '#34C759' : '#FF9500',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {technicalDebt.summary.healthScore >= 90 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>Score de santé : {technicalDebt.summary.healthScore}/100</span>
            </div>
          </div>

          {/* Grid Metrics */}
          <div className="kpi-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Liaison Serveur</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: technicalDebt.summary.canPersistDemande ? '#34C759' : '#FF9500' }} />
                {technicalDebt.summary.canPersistDemande ? 'Django 5.2 Actif' : 'Vérification Requise'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>API v1 sur port 8000</div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contrat Demandes</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: technicalDebt.summary.canPersistDemande ? '#34C759' : '#FF3B30', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {technicalDebt.summary.canPersistDemande ? <Check size={14} strokeWidth={3} /> : <AlertTriangle size={14} />}
                {technicalDebt.summary.canPersistDemande ? 'Conforme DRF' : 'Bloqué'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>RequestCreateSerializer</div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contrat Feuilles</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: technicalDebt.summary.canPersistFeuille ? '#34C759' : '#FF3B30', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {technicalDebt.summary.canPersistFeuille ? <Check size={14} strokeWidth={3} /> : <AlertTriangle size={14} />}
                {technicalDebt.summary.canPersistFeuille ? 'Conforme DRF' : 'Bloqué'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>SheetInputSerializer</div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dette Critique</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: technicalDebt.summary.criticalCount === 0 ? '#34C759' : '#FF3B30', marginTop: '4px' }}>
                {technicalDebt.summary.criticalCount === 0 ? '0 anomalie bloquante' : `${technicalDebt.summary.criticalCount} bloquant(s)`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Zéro catch silencieux</div>
            </div>
          </div>

          {/* Active Diagnostic Status Details */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Statut des garanties d’intégration appliquées :
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <Check size={14} color="#34C759" strokeWidth={2.5} />
                <span>Gestion des erreurs : notifications explicites sans mutation factice</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <Check size={14} color="#34C759" strokeWidth={2.5} />
                <span>Concordance UUIDv4 : compatibilité stricte base de données SQLite</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <Check size={14} color="#34C759" strokeWidth={2.5} />
                <span>Contrôles RBAC : respect des permissions case.update et manager</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <Check size={14} color="#34C759" strokeWidth={2.5} />
                <span>Cycle de vie des actes : statut initial BROUILLON et workflow officiel</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Preference Card (as requested: theme switcher in settings) */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Apparence & Thème visuel
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Basculez entre le thème sombre et  le thème clair haute lisibilité.
          </p>
        </div>

        <div className="kpi-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {/* Dark Theme Option */}
          <button
            type="button"
            onClick={() => {
              if (theme !== 'dark') onToggleTheme();
            }}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-card)',
              border: theme === 'dark' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              backgroundColor: theme === 'dark' ? 'var(--color-surface-elevated)' : 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'none',
                  border: '1px solid #3D3C44',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#535251',
                }}
              >
                <Moon size={20} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Thème Sombre (Midnight Slate)</div>
               
              </div>
            </div>
            {theme === 'dark' && <Check size={18} color="var(--color-accent)" strokeWidth={2.5} />}
          </button>

          {/* Light Theme Option */}
          <button
            type="button"
            onClick={() => {
              if (theme !== 'light') onToggleTheme();
            }}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-card)',
              border: theme === 'light' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              backgroundColor: theme === 'light' ? 'var(--color-surface-elevated)' : 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#F7FFFF',
                  border: '1px solid #B8C7C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#839292',
                }}
              >
                <Sun size={20} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Thème Clair (Monochrome Glacier)</div>
                
              </div>
            </div>
            {theme === 'light' && <Check size={18} color="var(--color-accent)" strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* User Profile Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <User size={18} color="var(--color-accent)" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Profil de l'agent connecté
          </h2>
        </div>

        <div className="kpi-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
              Nom & Prénom
            </label>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {user.prenom} {user.nom}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
              Matricule DGDA
            </label>
            <div className=" " style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)', marginTop: '4px' }}>
              {user.matricule}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
              Grade & Fonction
            </label>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {user.grade}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
              Unité d'affectation
            </label>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {user.unite}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
              Email institutionnel
            </label>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {user.email}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
              Rôle attribué
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {user.role === 'director' ? (
                <Shield size={14} color="var(--color-accent)" />
              ) : (
                <Briefcase size={14} color="var(--color-accent)" />
              )}
              <span>{user.role === 'director' ? "directeur / Responsable d'unité" : 'Enquêteur / Vérificateur'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Preferences */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Bell size={18} color="var(--color-accent)" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Notifications & Alertes
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-accent)' }} />
            <span>Recevoir une alerte lors de la réception d’une réponse aux demandes de communication</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-accent)' }} />
            <span>Avertissement 5 jours avant l’échéance légale d'un dossier d'enquête</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-accent)' }} />
            <span>Notification lors de la validation hiérarchique d'un acte ou PV</span>
          </label>
        </div>
      </div>
    </div>
  );
};
