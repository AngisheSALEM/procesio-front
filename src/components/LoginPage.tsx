import { useState } from 'react';
import { Shield, Briefcase, ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import type { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void> | void;
  onOfflineDemo?: () => void;
  error?: string;
  loading?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onOfflineDemo,
  error: externalError,
  loading: externalLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('director');
  const [username, setUsername] = useState('mukendi');
  const [password, setPassword] = useState('dgda-procezo-2026');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setFormError('');
    if (role === 'director') {
      setUsername('mukendi');
      setPassword('dgda-procezo-2026');
    } else if (role === 'admin') {
      setUsername('mbombo');
      setPassword('dgda-procezo-2026');
    } else {
      setUsername('kabamba');
      setPassword('dgda-procezo-2026');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || externalLoading) return;
    setSubmitting(true);
    setFormError('');
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Échec de la connexion. Vérifiez vos identifiants.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
        padding: '20px',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header / Brand */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 14px auto',
              borderRadius: '16px',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img
              src="/Logo-dgda.png"
              alt="Logo DGDA"
              style={{ width: '52px', height: '52px', objectFit: 'contain' }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              color: 'var(--color-text-primary)',
            }}
          >
            PROCEZO
          </h1>
         
          
        </div>

        {/* Persona / Role Selector Buttons */}
        <div>
         
          <div className="form-grid-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleSelectRole('director')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 6px',
                borderRadius: '16px',
                border: selectedRole === 'director'
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--glass-border)',
                backgroundColor: selectedRole === 'director'
                  ? 'var(--glass-surface)'
                  : 'transparent',
                color: selectedRole === 'director'
                  ? 'var(--color-accent)'
                  : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Shield size={18} strokeWidth={selectedRole === 'director' ? 2.2 : 1.8} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Directeur
                </div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Supervision
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('enqueteur')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 6px',
                borderRadius: '16px',
                border: selectedRole === 'enqueteur'
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--glass-border)',
                backgroundColor: selectedRole === 'enqueteur'
                  ? 'var(--glass-surface)'
                  : 'transparent',
                color: selectedRole === 'enqueteur'
                  ? 'var(--color-accent)'
                  : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Briefcase size={18} strokeWidth={selectedRole === 'enqueteur' ? 2.2 : 1.8} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Enquêteur
                </div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Instruction
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('admin')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 6px',
                borderRadius: '16px',
                border: selectedRole === 'admin'
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--glass-border)',
                backgroundColor: selectedRole === 'admin'
                  ? 'var(--glass-surface)'
                  : 'transparent',
                color: selectedRole === 'admin'
                  ? 'var(--color-accent)'
                  : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <ShieldCheck size={18} strokeWidth={selectedRole === 'admin' ? 2.2 : 1.8} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Admin Tech
                </div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Audit & Système
                </div>
              </div>
            </button>
          </div>
        </div>



        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: '6px',
              }}
            >
              Identifiant / Email professionnel
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '10px 14px',
                gap: '10px',
              }}
            >
              <Mail size={16} color="var(--color-text-muted)" />
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="ex. mukendi, kabamba..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                  width: '100%',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                }}
              >
                Mot de passe
              </label>
              <span style={{ fontSize: '11px', color: 'var(--color-accent)', cursor: 'pointer' }}>
                Mot de passe oublié ?
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '10px 14px',
                gap: '10px',
              }}
            >
              <Lock size={16} color="var(--color-text-muted)" />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                  width: '100%',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {(formError || externalError) && (
            <div
              role="alert"
              style={{
                fontSize: '12px',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                lineHeight: 1.4,
              }}
            >
              {formError || externalError}
            </div>
          )}

          
          <button
            type="submit"
            disabled={submitting || externalLoading}
            style={{
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-accent)',
              border: 'none',
              color: 'var(--color-on-accent)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: submitting || externalLoading ? 'wait' : 'pointer',
              opacity: submitting || externalLoading ? 0.75 : 1,
              transition: 'all var(--transition-fast)',
            }}
          >
            <span>
              {submitting || externalLoading
                ? 'Connexion sécurisée en cours…'
                : `Se connecter en tant que ${selectedRole === 'director' ? 'directeur' : 'Enquêteur'}`}
            </span>
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>

          {onOfflineDemo && (
            <button
              type="button"
              onClick={onOfflineDemo}
              className="btn-ghost"
              style={{
                fontSize: '12px',
                padding: '6px 10px',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Accéder en mode démonstration locale (hors-ligne)
            </button>
          )}
        </form>


      </div>
    </div>
  );
};
