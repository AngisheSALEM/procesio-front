import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DossierHeader, type DossierTabId } from './components/DossierHeader';
import { VueEnsembleTab } from './components/VueEnsembleTab';
import { DossierTachesTab } from './components/DossierTachesTab';
import { DemandeCommunicationView } from './components/DemandeCommunicationView';
import { FeuilleObservationView } from './components/FeuilleObservationView';
import { DocumentsTab } from './components/DocumentsTab';
import { MonTravailView } from './components/MonTravailView';
import { RenseignementsView } from './components/RenseignementsView';
import { DocumentsModelesView } from './components/DocumentsModelesView';
import { RapportsStatsView } from './components/RapportsStatsView';
import { ParametresView } from './components/ParametresView';
import { LoginPage } from './components/LoginPage';
import type {
  UserRole,
  DossierEnquete,
  TacheDossier,
  TypeActionSysteme
} from './types';
import {
  mockUsers,
  mockDossiers,
  mockDemandesParDossier,
  mockFeuillesParDossier,
  mockDocumentsParDossier
} from './data/mockData';

// Storage keys for persistent state on refresh
const STORAGE_THEME = 'procezo_theme';
const STORAGE_AUTH = 'procezo_auth';
const STORAGE_ROLE = 'procezo_user_role';
const STORAGE_NAV = 'procezo_active_nav';
const STORAGE_TAB = 'procezo_dossier_tab';
const STORAGE_SELECTED_DOSSIER = 'procezo_selected_dossier';

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

  // 3. Role & User persistence: defaults to 'enqueteur' (Agent de terrain)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem(STORAGE_ROLE);
    return savedRole === 'enqueteur' || savedRole === 'admin' ? savedRole : 'enqueteur';
  });

  // 4. Dossiers state (with creation support)
  const [dossiers, setDossiers] = useState<DossierEnquete[]>(mockDossiers);

  // 5. Selected Dossier persistence
  const [selectedDossierId, setSelectedDossierId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_SELECTED_DOSSIER);
    return saved && mockDossiers.some((d) => d.id === saved) ? saved : mockDossiers[0].id;
  });

  // 6. Navigation route persistence: prioritize URL hash, then localStorage
  const getNavFromHash = useCallback((role: UserRole): string => {
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    if (hash.startsWith('dossier/')) {
      const dId = hash.replace('dossier/', '');
      if (mockDossiers.some((d) => d.id === dId)) {
        setSelectedDossierId(dId);
        localStorage.setItem(STORAGE_SELECTED_DOSSIER, dId);
      }
      return 'dossier-detail';
    }
    const validRoutes = [
      'dossiers-enquete',
      'dossier-detail',
      'mon-travail',
      'renseignements',
      'documents-modeles',
      'rapports-stats',
      'parametres',
    ];
    if (hash && validRoutes.includes(hash)) {
      return hash === 'dossiers-enquete' ? 'dossier-detail' : hash;
    }
    const savedNav = localStorage.getItem(STORAGE_NAV);
    if (savedNav && validRoutes.includes(savedNav)) {
      return savedNav === 'dossiers-enquete' ? 'dossier-detail' : savedNav;
    }
    return role === 'enqueteur' ? 'mon-travail' : 'mon-travail';
  }, []);

  const [activeNav, setActiveNav] = useState<string>(() => getNavFromHash(userRole));

  // 7. Dossier Tab persistence
  const [activeDossierTab, setActiveDossierTab] = useState<DossierTabId>(() => {
    const savedTab = localStorage.getItem(STORAGE_TAB) as DossierTabId;
    const validTabs: DossierTabId[] = [
      'vue-ensemble',
      'taches',
      'actions-echanges',
      'constats-defense',
      'documents',
    ];
    return validTabs.includes(savedTab) ? savedTab : 'vue-ensemble';
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
    if (activeNav === 'dossier-detail') {
      const targetHash = `#/dossier/${selectedDossierId}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    } else {
      const targetHash = `#/${activeNav}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  }, [activeNav, selectedDossierId]);

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

    const defaultRoute = 'mon-travail';
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

  const handleOpenDossier = (dossierId: string) => {
    setSelectedDossierId(dossierId);
    localStorage.setItem(STORAGE_SELECTED_DOSSIER, dossierId);
    setActiveNav('dossier-detail');
    window.location.hash = `#/dossier/${dossierId}`;
  };

  const handleBackToDashboard = () => {
    setActiveNav('mon-travail');
    window.location.hash = '#/mon-travail';
  };

  const currentUser = mockUsers[userRole];

  // Resolve current dossier and its associated data
  const currentDossier = dossiers.find((d) => d.id === selectedDossierId) || dossiers[0] || mockDossiers[0];
  const currentDemande = mockDemandesParDossier[currentDossier.id] || mockDemandesParDossier['dossier-0842'];
  const currentFeuille = mockFeuillesParDossier[currentDossier.id] || mockFeuillesParDossier['dossier-0842'];
  const currentDocs = mockDocumentsParDossier[currentDossier.id] || [];

  // Handle creating a new dossier with precise timestamp
  const handleCreateDossier = (data: any) => {
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
    const newId = `dossier-${Date.now().toString().slice(-4)}`;

    const newDossier: DossierEnquete = {
      ...data,
      id: newId,
      horodatageCreation: timestamp,
      equipe: [`${currentUser.grade} ${currentUser.prenom} ${currentUser.nom} (Chef de mission)`],
      operationsDouanieres: [],
      renseignementsLiesIds: [],
      taches: [
        {
          id: `TACH-${Date.now().toString().slice(-4)}`,
          titre: 'Formaliser l’avis préalable d’ouverture de contrôle  ',
          description: 'Rédiger et notifier l’avis officiel d’audit à l’opérateur.',
          statut: 'A_FAIRE',
          priorite: 'URGENTE',
          dateEcheance: data.echeance,
          horodatageCreation: timestamp,
          auteur: `${currentUser.grade} ${currentUser.nom}`,
        }
      ],
      alertes: [
        {
          id: `ALT-${Date.now().toString().slice(-4)}`,
          titre: 'Nouveau dossier ouvert — Notification requise',
          message: `Dossier ouvert le ${timestamp} pour contrôle douanier de ${data.entiteControlee.nom}.`,
          niveau: 'INFO',
          actionRequise: 'Émettre la réquisition de pièces initiale sous 8 jours.',
          horodatage: timestamp,
          auteur: 'Système PROCEZO',
        }
      ],
      echeances: [
        {
          id: `ECH-${Date.now().toString().slice(-4)}`,
          libelle: 'Échéance légale de clôture du contrôle',
          dateButoir: data.echeance,
          typeEcheance: 'Instruction d’enquête',
          horodatageFixe: timestamp,
          statut: 'DANS_LES_DELAIS',
        }
      ],
    };

    setDossiers((prev) => [newDossier, ...prev]);
    handleOpenDossier(newId);
  };

  // Handle adding task to the selected dossier with timestamp
  const handleAddTaskToDossier = (newTask: {
    titre: string;
    description: string;
    priorite: 'URGENTE' | 'NORMALE';
    dateEcheance: string;
    actionSysteme?: TypeActionSysteme;
    cibleTab?: DossierTabId;
    declencheur?: string;
  }) => {
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === selectedDossierId) {
          const item: TacheDossier = {
            id: `TACH-${Date.now().toString().slice(-4)}`,
            titre: newTask.titre,
            description: newTask.description,
            statut: 'A_FAIRE',
            priorite: newTask.priorite,
            dateEcheance: newTask.dateEcheance,
            horodatageCreation: timestamp,
            auteur: `${currentUser.grade} ${currentUser.nom}`,
            actionSysteme: newTask.actionSysteme,
            cibleTab: newTask.cibleTab,
            declencheur: newTask.declencheur,
          };
          return {
            ...d,
            taches: [item, ...(d.taches || [])],
          };
        }
        return d;
      })
    );
  };

  // Handle toggling task status
  const handleToggleTaskInDossier = (taskId: string) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === selectedDossierId) {
          return {
            ...d,
            taches: (d.taches || []).map((t) => {
              if (t.id === taskId) {
                const nextStatut =
                  t.statut === 'TERMINEE'
                    ? 'A_FAIRE'
                    : t.statut === 'A_FAIRE'
                    ? 'EN_COURS'
                    : 'TERMINEE';
                return { ...t, statut: nextStatut };
              }
              return t;
            }),
          };
        }
        return d;
      })
    );
  };



  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Full-height Left Sidebar */}
      <Sidebar
        user={currentUser}
        activeNav={activeNav}
        onSelectNav={handleSelectNav}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Column (Header at top, then scrolling view area) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Header: Search and theme toggle without bottom border */}
        {/* <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          theme={theme}
          onToggleTheme={toggleTheme}
        /> */}

        {/* Central Workspace: Scrollable view area */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            minWidth: 0,
            padding: '4px 24px 24px 24px',
          }}
        > 
          {/* Route: Dossier Detail (Page de détail d'un dossier accédée depuis le tableau) */}
          {(activeNav === 'dossier-detail' || activeNav === 'dossiers-enquete') && (
            <div> <br /><br />
              <DossierHeader
                dossier={currentDossier}
                activeTab={activeDossierTab}
                onSelectTab={setActiveDossierTab}
                onBack={handleBackToDashboard}
              />

              <div style={{ padding: '24px 20px' }}>
                {activeDossierTab === 'vue-ensemble' && (
                  <VueEnsembleTab
                    key={currentDossier.id}
                    dossier={currentDossier}
                    onGoToDemandes={() => setActiveDossierTab('actions-echanges')}
                    onGoToObservations={() => setActiveDossierTab('constats-defense')}
                  />
                )}

                {activeDossierTab === 'taches' && (
                  <DossierTachesTab
                    key={currentDossier.id}
                    taches={currentDossier.taches || []}
                    onToggleTask={handleToggleTaskInDossier}
                    onAddTask={handleAddTaskToDossier}
                    onNavigateTab={(tab) => setActiveDossierTab(tab)}
                    user={currentUser}
                  />
                )}

                {activeDossierTab === 'actions-echanges' && (
                  <DemandeCommunicationView
                    key={currentDossier.id}
                    initialDemande={currentDemande}
                    currentUser={currentUser}
                    onGoToFeuilleObservation={() => setActiveDossierTab('constats-defense')}
                  />
                )}

                {activeDossierTab === 'constats-defense' && (
                  <FeuilleObservationView
                    key={currentDossier.id}
                    initialFeuille={currentFeuille}
                    currentUser={currentUser}
                    onNavigateTab={(tab) => setActiveDossierTab(tab)}
                  />
                )}

                {activeDossierTab === 'documents' && (
                  <DocumentsTab key={currentDossier.id} documents={currentDocs} />
                )}
              </div>
            </div>
          )}

          {/* Route: Mon travail (Tableau minimaliste des dossiers de l'agent) */}
          {activeNav === 'mon-travail' && (
            <div style={{ padding: '20px' }}>
              <MonTravailView
                dossiers={dossiers}
                onOpenDossier={handleOpenDossier}
                onCreateDossier={handleCreateDossier}
                user={currentUser}
              />
            </div>
          )}

          {/* Route: Renseignements */}
          {activeNav === 'renseignements' && (
            <div style={{ padding: '20px' }}>
              <RenseignementsView onOpenDossier={() => handleOpenDossier('dossier-0842')} />
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
              <RapportsStatsView onOpenDossier={() => handleOpenDossier('dossier-0842')} />
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
