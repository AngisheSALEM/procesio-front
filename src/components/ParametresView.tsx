import React from 'react';
import { Sun, Moon, User, Bell, Check, Shield, Briefcase } from 'lucide-react';
import type { UserAccount } from '../types';
import { apiPatch } from '../api/client';

interface ParametresViewProps {
  user: UserAccount;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onRefreshProfile?: () => Promise<unknown>;
}

export const ParametresView: React.FC<ParametresViewProps> = ({
  user,
  theme,
  onToggleTheme,
  onRefreshProfile,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [grade, setGrade] = React.useState(user.grade);
  const [matricule, setMatricule] = React.useState(user.matricule);
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ error?: string; success?: string }>({});

  React.useEffect(() => {
    setGrade(user.grade);
    setMatricule(user.matricule);
  }, [user.grade, user.matricule]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setFeedback({});
    try {
      await apiPatch('/me/', { grade, matricule });
      if (onRefreshProfile) await onRefreshProfile();
      setFeedback({ success: 'Profil métier mis à jour avec succès.' });
      setIsEditing(false);
    } catch (err) {
      setFeedback({ error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour.' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Paramètres du système
        </h1>
    
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={18} color="var(--color-accent)" />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Profil de l'agent connecté
            </h2>
          </div>
          <button
            type="button"
            onClick={() => { setIsEditing(!isEditing); setFeedback({}); }}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-btn)',
              border: '1px solid var(--color-border)',
              backgroundColor: isEditing ? 'var(--color-surface-muted)' : 'var(--color-surface-elevated)',
              color: 'var(--color-text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isEditing ? 'Annuler' : 'Modifier grade / matricule'}
          </button>
        </div>

        {feedback.success && (
          <div style={{ padding: '8px 12px', marginBottom: '12px', borderRadius: 'var(--radius-btn)', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '12px', fontWeight: 500 }}>
            {feedback.success}
          </div>
        )}
        {feedback.error && (
          <div style={{ padding: '8px 12px', marginBottom: '12px', borderRadius: 'var(--radius-btn)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '12px', fontWeight: 500 }}>
            {feedback.error}
          </div>
        )}

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
            {isEditing ? (
              <input
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="ex. DGDA-DIR-089"
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-btn)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                }}
              />
            ) : (
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)', marginTop: '4px' }}>
                {user.matricule || 'Non renseigné'}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
              Grade & Fonction
            </label>
            {isEditing ? (
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="ex. Inspecteur Principal"
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-btn)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                }}
              />
            ) : (
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {user.grade || 'Non renseigné'}
              </div>
            )}
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
              <span>{user.role === 'director' ? "Directeur / Responsable d'unité" : 'Enquêteur / Vérificateur'}</span>
            </div>
          </div>
        </div>

        {isEditing && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => { setIsEditing(false); setGrade(user.grade); setMatricule(user.matricule); setFeedback({}); }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-btn)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-muted)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveProfile}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-btn)',
                border: 'none',
                backgroundColor: 'var(--color-accent)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer le profil métier'}
            </button>
          </div>
        )}
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
