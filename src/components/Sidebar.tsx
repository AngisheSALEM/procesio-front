import React from 'react';
import {
  Briefcase,
  Radio,
  FolderLock,
  FileCheck,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut
} from 'lucide-react';
import type { UserAccount } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  user: UserAccount;
  activeNav: string;
  onSelectNav: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeNav,
  onSelectNav,
  isCollapsed,
  onToggleCollapse,
  onLogout,
}) => {
  const adminNavItems: NavItem[] = [
    {
      id: 'dossiers-enquete',
      label: 'Dossiers d’enquête',
      icon: <FolderLock size={18} strokeWidth={1.8} />,
    },
    {
      id: 'mon-travail',
      label: 'Supervision',
      icon: <Briefcase size={18} strokeWidth={1.8} />,
    },
    {
      id: 'renseignements',
      label: 'Renseignements',
      icon: <Radio size={18} strokeWidth={1.8} />,
    },
    {
      id: 'documents-modeles',
      label: 'Modèles d’actes',
      icon: <FileCheck size={18} strokeWidth={1.8} />,
    },
    {
      id: 'rapports-stats',
      label: 'Rapports & Stats',
      icon: <BarChart3 size={18} strokeWidth={1.8} />,
    },
    {
      id: 'parametres',
      label: 'Paramètres',
      icon: <Settings size={18} strokeWidth={1.8} />,
    },
  ];

  const enqueteurNavItems: NavItem[] = [
    {
      id: 'mon-travail',
      label: 'Mon travail',
      icon: <Briefcase size={18} strokeWidth={1.8} />,
    },
    {
      id: 'dossiers-enquete',
      label: 'Dossiers d’enquête',
      icon: <FolderLock size={18} strokeWidth={1.8} />,
    },
    {
      id: 'renseignements',
      label: 'Renseignements',
      icon: <Radio size={18} strokeWidth={1.8} />,
    },
    {
      id: 'documents-modeles',
      label: 'Modèles d’actes',
      icon: <FileCheck size={18} strokeWidth={1.8} />,
    },
    {
      id: 'parametres',
      label: 'Paramètres',
      icon: <Settings size={18} strokeWidth={1.8} />,
    },
  ];

  const items = user.role === 'admin' ? adminNavItems : enqueteurNavItems;

  return (
    <aside
      style={{
        width: isCollapsed ? '64px' : '240px',
        margin: '16px 0 16px 16px',
        height: 'calc(100% - 32px)',
        maxHeight: 'calc(100vh - 92px)',
        position: 'sticky',
        top: '16px',
        flexShrink: 0,
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isCollapsed ? '16px 8px' : '16px 12px',
        userSelect: 'none',
        transition: 'width var(--transition-normal), padding var(--transition-normal)',
        zIndex: 20,
      }}
    >
      <div>
        {/* Top Header of the floating nav bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0 0 14px 0' : '2px 8px 14px 8px',
            borderBottom: '1px solid var(--glass-border)',
            marginBottom: '10px',
          }}
        >
          {!isCollapsed && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: 'var(--color-text-muted)',
              }}
            >
              {user.role === 'admin' ? 'Espace Direction' : 'Espace Enquêteur'}
            </span>
          )}

          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Développer le menu' : 'Réduire le menu'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: 'var(--radius-btn)',
              outline: 'none',
            }}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={17} strokeWidth={1.8} />
            ) : (
              <PanelLeftClose size={17} strokeWidth={1.8} />
            )}
          </button>
        </div>

        {/* Nav Items List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {items.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectNav(item.id)}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: '12px',
                  padding: isCollapsed ? '10px 0' : '10px 14px',
                  backgroundColor: isActive ? 'var(--glass-surface)' : 'transparent',
                  border: isActive ? '1px solid var(--glass-border-focus)' : '1px solid transparent',
                  borderRadius: '12px',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                  outline: 'none',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </div>

                {!isCollapsed && (
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--color-text-primary)' : 'inherit',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Identity in Navbar (as requested: name is in nav bar and not in header) */}
      <div
        style={{
          borderTop: '1px solid var(--glass-border)',
          paddingTop: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '8px',
            padding: isCollapsed ? '4px 0' : '6px 8px',
            borderRadius: '12px',
            backgroundColor: 'var(--glass-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                color: 'var(--color-accent)',
                flexShrink: 0,
              }}
            >
              {user.avatarInitials}
            </div>

            {!isCollapsed && (
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.prenom} {user.nom}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.role === 'admin' ? 'Administrateur' : 'Enquêteur'}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogout}
              title="Se déconnecter"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
