import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  error?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await onLogin(username.trim(), password);
    } catch (failure) {
      setFormError(failure instanceof Error ? failure.message : 'Connexion impossible.');
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
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Direction Générale des Douanes et Accises — RDC
          </p>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              marginTop: '6px',
              fontWeight: 500,
            }}
          >
            Portail de gestion des enquêtes et du renseignement
          </div>
        </div>

        {/* Access information card */}
        <div
          style={{
            backgroundColor: 'var(--glass-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              color: 'var(--color-accent)',
            }}
          >
            <UserCheck size={17} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Accès réservé aux agents habilités
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Votre profil et votre unité sont définis par votre compte.
            </div>
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
              Identifiant professionnel
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

          {(formError || error) && <div role="alert" style={{ fontSize: '12px', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)' }}>{formError || error}</div>}

          <button
            type="submit"
            disabled={submitting}
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
              cursor: submitting ? 'wait' : 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <span>{submitting ? 'Connexion en cours…' : 'Se connecter'}</span>
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          Accès réservé aux agents habilités DGDA
        </div>
      </div>
    </div>
  );
};
