import React, { useState } from 'react';
import { Shield, Briefcase, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import type { UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('enqueteur');
  const [email, setEmail] = useState('enqueteur@dgda.cd');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(mockUsers[role].email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedRole);
  };

  const activeUser = mockUsers[selectedRole];

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

        {/* Persona / Role Selector Buttons */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--color-text-muted)',
              marginBottom: '10px',
            }}
          >
            Sélectionnez votre profil de connexion :
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleSelectRole('admin')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 10px',
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
              <Shield size={20} strokeWidth={selectedRole === 'admin' ? 2.2 : 1.8} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Administrateur
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Supervision & Décision
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
                padding: '14px 10px',
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
              <Briefcase size={20} strokeWidth={selectedRole === 'enqueteur' ? 2.2 : 1.8} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Enquêteur
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Terrain & Instruction
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Selected Account Info Card */}
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
              fontWeight: 700,
              fontSize: '13px',
              color: 'var(--color-accent)',
            }}
          >
            {activeUser.avatarInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {activeUser.prenom} {activeUser.nom}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {activeUser.grade} • {activeUser.unite}
            </div>
          </div>
          <UserCheck size={16} color="var(--color-accent)" />
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
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="remember" style={{ fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
              Rester connecté sur ce poste
            </label>
          </div>

          <button
            type="submit"
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
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <span>Se connecter en tant que {selectedRole === 'admin' ? 'Administrateur' : 'Enquêteur'}</span>
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          Système officiel sécurisé — Accès réservé aux agents habilités DGDA
        </div>
      </div>
    </div>
  );
};
