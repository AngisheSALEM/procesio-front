import React from 'react';
import { Sun, Moon, User, Bell, Check, Shield, Briefcase } from 'lucide-react';
import type { UserAccount } from '../types';

interface ParametresViewProps {
  user: UserAccount;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const ParametresView: React.FC<ParametresViewProps> = ({
  user,
  theme,
  onToggleTheme,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Paramètres du système
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Gérez l’apparence visuelle de l’application, vos préférences et votre profil utilisateur.
        </p>
      </div>

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
            Basculez entre le thème sombre officiel DGDA et le thème clair haute lisibilité.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
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
                  backgroundColor: '#242323',
                  border: '1px solid #514D4D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E4B74A',
                }}
              >
                <Moon size={20} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Thème Sombre (Night Asphalt)</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Recommandé pour un confort prolongé
                </div>
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
                  backgroundColor: '#E6D5B8',
                  border: '1px solid #CDBFA9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B88922',
                }}
              >
                <Sun size={20} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Thème Clair (Cream Beige)</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Contraste élevé pour impression ou forte luminosité
                </div>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
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
            <div className="font-mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)', marginTop: '4px' }}>
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
              {user.role === 'admin' ? <Shield size={14} color="var(--color-accent)" /> : <Briefcase size={14} color="var(--color-accent)" />}
              <span>{user.role === 'admin' ? 'Administrateur / Responsable d’unité' : 'Enquêteur / Vérificateur'}</span>
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
