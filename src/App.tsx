import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DossierHeader, type DossierTabId } from './components/DossierHeader';
import { VueEnsembleTab } from './components/VueEnsembleTab';
import { DemandeCommunicationView } from './components/DemandeCommunicationView';
import { FeuilleObservationView } from './components/FeuilleObservationView';
import { DocumentsTab } from './components/DocumentsTab';
import { HistoriqueTab } from './components/HistoriqueTab';
import { MonTravailView } from './components/MonTravailView';
import { RenseignementsView } from './components/RenseignementsView';
import { DocumentsModelesView } from './components/DocumentsModelesView';
import { RapportsStatsView } from './components/RapportsStatsView';
import { ParametresView } from './components/ParametresView';
import { LoginPage } from './components/LoginPage';
import type { UserRole } from './types';
import { mockUsers, mockDossier, mockDemandeCommunication, mockFeuilleObservation } from './data/mockData';

// Storage keys for persistent state on refresh
const STORAGE_THEME = 'procezo_theme';
const STORAGE_AUTH = 'procezo_auth';
const STORAGE_ROLE = 'procezo_user_role';
const STORAGE_NAV = 'procezo_active_nav';
const STORAGE_TAB = 'procezo_dossier_tab';

export function App() {
  // 1. Theme persistence: restore saved theme or default to 'dark'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_THEME);
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  // 2. Authentication persistence: restore login status
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedAuth = localStorage.getItem(STORAGE_AUTH);
    return savedAuth !== null ? savedAuth === 'true' : true;
  });

  // 3. Role & User persistence: restore Admin or Enquêteur
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem(STORAGE_ROLE);
    return savedRole === 'enqueteur' || savedRole === 'admin' ? savedRole : 'admin';
  });

  // 4. Navigation route persistence: prioritize URL hash, then localStorage
  const getNavFromHash = useCallback((role: UserRole): string => {
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    const validRoutes = [
      'dossiers-enquete',
      'mon-travail',
      'renseignements',
      'documents-modeles',
      'rapports-stats',
      'parametres',
    ];
    if (hash && validRoutes.includes(hash)) {
      return hash;
    }
    const savedNav = localStorage.getItem(STORAGE_NAV);
    if (savedNav && validRoutes.includes(savedNav)) {
      return savedNav;
    }
    return role === 'enqueteur' ? 'mon-travail' : 'dossiers-enquete';
  }, []);

  const [activeNav, setActiveNav] = useState<string>(() => getNavFromHash(userRole));

  // 5. Dossier Tab persistence
  const [activeDossierTab, setActiveDossierTab] = useState<DossierTabId>(() => {
    const savedTab = localStorage.getItem(STORAGE_TAB) as DossierTabId;
    const validTabs: DossierTabId[] = [
      'vue-ensemble',
      'actions-echanges',
      'constats-defense',
      'documents',
      'historique',
    ];
    return validTabs.includes(savedTab) ? savedTab : 'actions-echanges';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sync theme with HTML attribute and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  // Sync activeNav with URL hash and localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_NAV, activeNav);
    if (window.location.hash !== `#/${activeNav}`) {
      window.location.hash = `#/${activeNav}`;
    }
  }, [activeNav]);

  // Sync activeDossierTab with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_TAB, activeDossierTab);
  }, [activeDossierTab]);

  // Listen to browser Back / Forward buttons (Hash change event)
  useEffect(() => {
    const handleHashChange = () => {
      const currentRoute = getNavFromHash(userRole);
      setActiveNav(currentRoute);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [getNavFromHash, userRole]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_AUTH, 'true');
    localStorage.setItem(STORAGE_ROLE, role);

    const defaultRoute = role === 'enqueteur' ? 'mon-travail' : 'dossiers-enquete';
    setActiveNav(defaultRoute);
    window.location.hash = `#/${defaultRoute}`;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_AUTH, 'false');
    window.location.hash = '';
  };

  const handleSelectNav = (id: string) => {
    setActiveNav(id);
  };

  const handleOpenDossierFromOtherView = () => {
    setActiveNav('dossiers-enquete');
  };

  const currentUser = mockUsers[userRole];

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Top Header: Fixed pinned at top */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Container: Fixed non-scrollable sidebar + Smoothly scrolling content area */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          height: 'calc(100vh - 61px)',
        }}
      >
        {/* Floating Translucent Sidebar (Fixed, does not scroll with main content) */}
        <Sidebar
          user={currentUser}
          activeNav={activeNav}
          onSelectNav={handleSelectNav}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onLogout={handleLogout}
        />

        {/* Central Workspace: Scrollable view area */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            minWidth: 0,
            height: '100%',
            padding: '8px 16px 24px 8px',
          }}
        >
          {/* Route: Dossiers d'enquête */}
          {activeNav === 'dossiers-enquete' && (
            <div>
              <DossierHeader
                dossier={mockDossier}
                activeTab={activeDossierTab}
                onSelectTab={setActiveDossierTab}
              />

              <div style={{ padding: '24px 20px' }}>
                {activeDossierTab === 'vue-ensemble' && (
                  <VueEnsembleTab
                    dossier={mockDossier}
                    onGoToDemandes={() => setActiveDossierTab('actions-echanges')}
                    onGoToObservations={() => setActiveDossierTab('constats-defense')}
                  />
                )}

                {activeDossierTab === 'actions-echanges' && (
                  <DemandeCommunicationView initialDemande={mockDemandeCommunication} />
                )}

                {activeDossierTab === 'constats-defense' && (
                  <FeuilleObservationView initialFeuille={mockFeuilleObservation} />
                )}

                {activeDossierTab === 'documents' && <DocumentsTab />}

                {activeDossierTab === 'historique' && <HistoriqueTab />}
              </div>
            </div>
          )}

          {/* Route: Mon travail */}
          {activeNav === 'mon-travail' && (
            <div style={{ padding: '20px' }}>
              <MonTravailView
                onOpenDossier={handleOpenDossierFromOtherView}
                dossier={mockDossier}
              />
            </div>
          )}

          {/* Route: Renseignements */}
          {activeNav === 'renseignements' && (
            <div style={{ padding: '20px' }}>
              <RenseignementsView onOpenDossier={handleOpenDossierFromOtherView} />
            </div>
          )}

          {/* Route: Documents et modèles */}
          {activeNav === 'documents-modeles' && (
            <div style={{ padding: '20px' }}>
              <DocumentsModelesView />
            </div>
          )}

          {/* Route: Rapports et statistiques (Admin) */}
          {activeNav === 'rapports-stats' && (
            <div style={{ padding: '20px' }}>
              <RapportsStatsView onOpenDossier={handleOpenDossierFromOtherView} />
            </div>
          )}

          {/* Route: Paramètres (Theme switch and profile) */}
          {activeNav === 'parametres' && (
            <div style={{ padding: '20px' }}>
              <ParametresView
                user={currentUser}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
