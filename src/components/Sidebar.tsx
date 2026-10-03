import React from 'react';
import {
  Briefcase,
  Radio,
  LayoutDashboard,
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
  const directorNavItems: NavItem[] = [
    {
      id: 'rapports-stats',
      label: 'Supervision',
      icon: <LayoutDashboard size={25} strokeWidth={1.8} />,
    },
    {
      id: 'renseignements',
      label: 'Renseignements',
      icon: <Radio size={25} strokeWidth={1.8} />,
    },
    {
      id: 'mon-travail',
      label: 'Tous les Dossiers',
      icon: <Briefcase size={25} strokeWidth={1.8} />,
    },
    {
      id: 'parametres',
      label: 'Paramètres',
      icon: <Settings size={25} strokeWidth={1.8} />,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      id: 'admin-supervision',
      label: 'Administration Système',
      icon: <LayoutDashboard size={25} strokeWidth={1.8} />,
    },
   
    {
      id: 'parametres',
      label: 'Paramètres',
      icon: <Settings size={25} strokeWidth={1.8} />,
    },
  ];

  const enqueteurNavItems: NavItem[] = [
    {
      id: 'mon-travail',
      label: "Dossiers d'enquetes",
      icon: <Briefcase size={25} strokeWidth={1.8} />,
    },
    {
      id: 'renseignements',
      label: 'Renseignements',
      icon: <Radio size={25} strokeWidth={1.8} />,
    },
    {
      id: 'parametres',
      label: 'Paramètres',
      icon: <Settings size={25} strokeWidth={1.8} />,
    },
  ];

  const items = user.role === 'admin' ? adminNavItems : user.role === 'director' ? directorNavItems : enqueteurNavItems;

  const handleItemClick = (itemId: string) => {
    onSelectNav(itemId);
    // On mobile screens, auto-close sidebar drawer after selecting a view
    if (window.innerWidth <= 768 && !isCollapsed) {
      onToggleCollapse();
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {!isCollapsed && (
        <div
          className="sidebar-backdrop"
          onClick={onToggleCollapse}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar-drawer ${isCollapsed ? 'sidebar-collapsed-mobile' : 'sidebar-open-mobile'}`}
        style={{
          width: isCollapsed ? '68px' : '250px',
          marginRight: '10px',
          marginTop: '5px',
          marginBottom: '10px',
          height: '100vh',
          maxHeight: '100vh',
          position: 'relative',
          top: 0,
          left: 0,
          flexShrink: 0,
          backgroundColor: 'var(--color-bg-deep)',
          border: '1px solid var(--color-border-subtle)',
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: 'none',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isCollapsed ? '16px 8px' : '16px 14px',
          userSelect: 'none',
          transition: 'width var(--transition-normal), padding var(--transition-normal)',
          zIndex: 20,
        }}
      >
        <div>
        {/* Top Header of the sidebar with Logo & PROCEZO */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0 0 16px 0' : '0 4px 18px 4px',
            borderBottom: 'none',
            marginBottom: '16px',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/Logo-dgda.png"
              alt="Logo DGDA"
              style={{
                width: '34px',
                height: '34px',
                objectFit: 'contain',
                borderRadius: '6px',
                flexShrink: 0,
              }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            {!isCollapsed && (
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  letterSpacing: '0.8px',
                  color: 'var(--color-text-primary)',
                }}
              >
                PROCEZO
              </span>
            )}
          </div>

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
              padding: '6px',
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
                onClick={() => handleItemClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: '12px',
                  padding: isCollapsed ? '10px 0' : '10px 14px',
                  backgroundColor: isActive ? 'var(--glass-surface)' : 'transparent',
                  border: 'none',
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
          borderTop: 'none',
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
                backgroundColor: 'var(--color-surface)',
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
                  {user.role === 'admin' ? 'Administrateur' : user.role === 'director' ? 'Directeur' : 'Enquêteur'}
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
    </>
  );
};
