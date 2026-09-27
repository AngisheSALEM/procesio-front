import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { DossierHeader, type DossierTabId } from './components/DossierHeader';
import { VueEnsembleTab } from './components/VueEnsembleTab';
import { DemandeCommunicationView } from './components/DemandeCommunicationView';
import { FeuilleObservationView } from './components/FeuilleObservationView';
import { PvView } from './components/PvView';
import { MonTravailView } from './components/MonTravailView';
import { RenseignementsView } from './components/RenseignementsView';
import { DocumentsModelesView } from './components/DocumentsModelesView';
import { RapportsStatsView } from './components/RapportsStatsView';
import { ParametresView } from './components/ParametresView';
import { ComponentsView } from './components/ComponentsView';
import { LoginPage } from './components/LoginPage';
import type {
  UserRole,
  DossierEnquete,
  StatutDossier,
  DemandeCommunication,
  FeuilleObservation,
  DocumentItem,
  PvDetail
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

  // Demandes de communication (par dossier) : Tableau de demandes
  const [demandesParDossier, setDemandesParDossier] = useState<Record<string, DemandeCommunication[]>>({
    'dossier-0842': [
      mockDemandesParDossier['dossier-0842'],
      {
        id: 'demande-043',
        reference: 'DGDA/DRK/ENQ/DC/2026/043',
        dossierId: 'dossier-0842',
        redacteur: 'Inspecteur Marc Kabamba',
        auteur: 'Inspecteur Marc Kabamba',
        dateEmission: '2026-09-08',
        echeanceReponse: '2026-09-22',
        statut: 'REPONSE_COMPLETE',
        objet: 'Communication complémentaire des factures de surestaries et fret maritime Kasumbalesa',
        baseLegale: 'Code des douanes, Article 46',
        destinataire: {
          nom: 'CONGO MINING & CHEMICAL LOGISTICS SAS',
          qualite: 'Entreprise contrôlée',
          adresse: '04 Avenue des Métaux, Quartier Industriel, Lubumbashi',
        },
        elementsDemandes: [
          {
            id: 'EL-05',
            libelle: 'Factures de transport ferroviaire et maritime',
            periodeConcernee: 'Exercice 2025',
            motifExigence: 'Contrôle du fret CIF',
            statutRemise: 'FOURNI',
          },
        ],
        reponsesRecues: [
          {
            id: 'REP-002',
            dateReception: '2026-09-18',
            referenceCourrier: 'CMCL/DG/2026/112',
            auteur: 'Direction Financière CMCL',
            elementsFournisIds: ['EL-05'],
            elementsManquantsIds: [],
            piecesJointes: ['Factures_Fret_Maritime_CMCL.pdf'],
            analyseEnqueteur: 'Factures reçues et vérifiées',
            appreciation: 'SATISFAISANTE',
            prochaineAction: 'Clôture de la demande',
          },
        ],
        reponsePdfNom: 'Factures_Fret_Maritime_CMCL.pdf',
        reponsePdfDate: '2026-09-18',
        reponsePdfRef: 'CMCL/DG/2026/112',
        reponsePdfAuteur: 'Direction Financière CMCL',
        signataireHabilite: 'Salem Mukendi (Directeur Provincial)',
        gradeSignataire: 'Commandement de Division',
        modaliteRemise: 'Transmission électronique et dépôt physique',
        commentairesInternes: 'Demande complémentaire de vérification',
      },
    ],
    'dossier-0843': [mockDemandesParDossier['dossier-0843']],
  });

  // Feuilles d'observation (par dossier) : Tableau de feuilles
  const [feuillesParDossier, setFeuillesParDossier] = useState<Record<string, FeuilleObservation[]>>({
    'dossier-0842': [mockFeuillesParDossier['dossier-0842']],
  });

  // Procès-Verbaux dressés (par dossier) : Tableau de PVs
  const [pvsParDossier, setPvsParDossier] = useState<Record<string, PvDetail[]>>({
    'dossier-0842': [
      {
        id: 'pv-0842-1',
        reference: 'DGDA/DRK/PV-INF/2026/089',
        dossierId: 'dossier-0842',
        datePv: '2026-10-24',
        inspecteurs: ['Inspecteur Marc Kabamba', 'Inspecteur Jean-Paul Kasongo'],
        destinataire: 'CONGO MINING & CHEMICAL LOGISTICS SAS',
        objet: 'Minoration de la valeur transactionnelle et déduction indue de charges de transport',
        cadreLegal: 'Articles 356, 357, 398 et 402 du Code des douanes (Loi n° 10/002)',
        infractions: [
          'Minoration de la valeur en douane taxable et carence de justificatifs probants (Articles 356 et 357 du Code des douanes)',
          'Défaut de communication d’actes comptables et manifestes requis après mise en demeure (Article 46 et Article 49)',
        ],
        droitsEludesUSD: 45000,
        droitsEludesCDF: 125000000,
        amendeUSD: 90000,
        auditionDate: '2026-10-20',
        destinationContentieuse: 'Transmission à la Division Contentieuse DRK Lubumbashi & Parquet près le Tribunal de Grande Instance',
        statutPv: 'TRANSMIS_CONTENTIEUX',
        pdfNom: 'PV_Infraction_Douaniere_Officiel.pdf',
        pdfTaille: '1.2 Mo',
      },
    ],
  });

  // Documents et PV du dossier
  const [documentsParDossier, setDocumentsParDossier] = useState<Record<string, DocumentItem[]>>(mockDocumentsParDossier);

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
      'components',
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
      'actions-echanges',
      'constats-defense',
      'documents',
    ];
    return validTabs.includes(savedTab) ? savedTab : 'vue-ensemble';
  });

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
  const currentDemandes = demandesParDossier[currentDossier.id] || [];
  const currentFeuilles = feuillesParDossier[currentDossier.id] || [];
  const currentPvs = pvsParDossier[currentDossier.id] || [];

  const hasDemande = currentDemandes.length > 0;
  const hasFeuille = hasDemande && currentFeuilles.length > 0;
  const hasPv = currentPvs.length > 0;

  // Handle adding a new Demande de communication
  const handleAddDemande = (newDemande: DemandeCommunication) => {
    const dId = newDemande.dossierId || currentDossier.id;
    setDemandesParDossier((prev) => ({
      ...prev,
      [dId]: [...(prev[dId] || []), newDemande],
    }));
  };

  // Handle saving/updating a Demande de communication
  const handleSaveDemande = (updatedDemande: DemandeCommunication) => {
    const dId = updatedDemande.dossierId || currentDossier.id;
    setDemandesParDossier((prev) => {
      const list = prev[dId] || [];
      const exists = list.some((d) => d.id === updatedDemande.id);
      return {
        ...prev,
        [dId]: exists
          ? list.map((d) => (d.id === updatedDemande.id ? updatedDemande : d))
          : [...list, updatedDemande],
      };
    });
  };

  // Handle cancelling a Demande de communication
  const handleCancelDemande = (demandeId: string) => {
    const dId = currentDossier.id;
    setDemandesParDossier((prev) => {
      const list = (prev[dId] || []).filter((d) => d.id !== demandeId);
      return { ...prev, [dId]: list };
    });
    // If no more demandes, remove feuilles and pvs as well
    const remaining = (demandesParDossier[dId] || []).filter((d) => d.id !== demandeId);
    if (remaining.length === 0) {
      setFeuillesParDossier((prev) => {
        const next = { ...prev };
        delete next[dId];
        return next;
      });
      setPvsParDossier((prev) => {
        const next = { ...prev };
        delete next[dId];
        return next;
      });
      setActiveDossierTab('vue-ensemble');
    }
  };

  // Handle adding a new Feuille d'observation
  const handleAddFeuille = (newFeuille: FeuilleObservation) => {
    const dId = newFeuille.dossierId || currentDossier.id;
    setFeuillesParDossier((prev) => ({
      ...prev,
      [dId]: [...(prev[dId] || []), newFeuille],
    }));
  };

  // Handle saving/updating a Feuille d'observation
  const handleSaveFeuille = (updatedFeuille: FeuilleObservation) => {
    const dId = updatedFeuille.dossierId || currentDossier.id;
    setFeuillesParDossier((prev) => {
      const list = prev[dId] || [];
      const exists = list.some((f) => f.id === updatedFeuille.id);
      return {
        ...prev,
        [dId]: exists
          ? list.map((f) => (f.id === updatedFeuille.id ? updatedFeuille : f))
          : [...list, updatedFeuille],
      };
    });
  };

  // Handle creating Feuille d'observation when user completes the creation form in Demande
  const handleCreateFeuilleFromDemande = (newFeuille: FeuilleObservation) => {
    const dId = newFeuille.dossierId || currentDossier.id;
    const targetDossier = dossiers.find((d) => d.id === dId) || currentDossier;

    setFeuillesParDossier((prev) => ({
      ...prev,
      [dId]: [...(prev[dId] || []), newFeuille],
    }));

    // Modifier le statut de l'enquête (dossier)
    const nextStatut: StatutDossier = targetDossier.statut === 'A_VALIDER' ? 'RELAIS_CONTENTIEUX' : 'A_VALIDER';

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dId) {
          return {
            ...d,
            statut: nextStatut,
            prochaineAction: 'Feuille d’observation notifiée suite à réponse non satisfaisante — Phase contradictoire',
          };
        }
        return d;
      })
    );
  };

  // Handle adding a new PV
  const handleAddPv = (newPv: PvDetail) => {
    const dId = newPv.dossierId || currentDossier.id;
    setPvsParDossier((prev) => ({
      ...prev,
      [dId]: [...(prev[dId] || []), newPv],
    }));

    // Ajouter la pièce officielle PV dans la liste des documents du dossier
    const newDoc: DocumentItem = {
      id: `DOC-${Date.now().toString().slice(-4)}`,
      reference: newPv.reference,
      titre: `Procès-verbal d’infraction douanière — ${currentDossier.entiteControlee.nom}`,
      type: 'PV_INFRACTION',
      format: 'PDF',
      statutValidation: 'VALIDE_INTERNE',
      dateCreation: newPv.datePv,
      auteur: newPv.inspecteurs[0] || `${currentUser.grade} ${currentUser.nom}`,
      signataire: `${currentUser.grade} ${currentUser.nom}`,
      relaisGelec: true,
    };

    setDocumentsParDossier((prev) => ({
      ...prev,
      [dId]: [newDoc, ...(prev[dId] || mockDocumentsParDossier[dId] || [])],
    }));

    // Mettre à jour le statut du dossier d'enquête
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dId) {
          return {
            ...d,
            statut: 'RELAIS_CONTENTIEUX',
            prochaineAction: 'Procès-verbal d’infraction dressé — Consignation et transmission contentieuse GELEC',
          };
        }
        return d;
      })
    );
  };

  // Handle updating a PV
  const handleUpdatePv = (updatedPv: PvDetail) => {
    const dId = updatedPv.dossierId || currentDossier.id;
    setPvsParDossier((prev) => {
      const list = prev[dId] || [];
      const exists = list.some((p) => p.id === updatedPv.id);
      return {
        ...prev,
        [dId]: exists
          ? list.map((p) => (p.id === updatedPv.id ? updatedPv : p))
          : [...list, updatedPv],
      };
    });
  };

  // Handle launching / drawing up a PV from Feuille d'observation
  const handleLancerPv = (pvData: { reference: string; date: string; motif: string; infractions: string[] }) => {
    const dId = currentDossier.id;

    const newPv: PvDetail = {
      id: `pv-${Date.now()}`,
      reference: pvData.reference,
      dossierId: dId,
      datePv: pvData.date,
      inspecteurs: [`${currentUser.grade} ${currentUser.prenom} ${currentUser.nom}`],
      destinataire: currentDossier.entiteControlee.nom,
      objet: pvData.motif,
      cadreLegal: 'Articles 356, 357, 398 et 402 du Code des douanes (Loi n° 10/002)',
      infractions: pvData.infractions,
      droitsEludesUSD: 45000,
      droitsEludesCDF: 125000000,
      amendeUSD: 90000,
      destinationContentieuse: pvData.motif,
      statutPv: 'TRANSMIS_CONTENTIEUX',
      pdfNom: 'PV_Infraction_Douaniere_Officiel.pdf',
      pdfTaille: '1.2 Mo',
    };

    handleAddPv(newPv);

    // Mettre à jour la dernière feuille d'observation avec la décision
    const activeFeuilles = feuillesParDossier[dId] || [];
    if (activeFeuilles.length > 0) {
      const lastIndex = activeFeuilles.length - 1;
      const updatedList = [...activeFeuilles];
      updatedList[lastIndex] = {
        ...updatedList[lastIndex],
        statutFeuille: 'CLOTUREE',
        decisionFinale: 'PV_INFRACTION_GLEC',
        pvInfractionGlec: {
          reference: pvData.reference,
          date: pvData.date,
          infractions: pvData.infractions,
          droitsEludesUSD: 45000,
          droitsEludesCDF: 125000000,
          amendeUSD: 90000,
          inspecteurs: updatedList[lastIndex].inspecteurs,
          statutTransmission: 'TRANSMIS_GLEC',
        },
      };
      setFeuillesParDossier((prev) => ({
        ...prev,
        [dId]: updatedList,
      }));
    }
  };

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
      taches: [],
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
            <div> <br />
              <DossierHeader
                dossier={currentDossier}
                allDossiers={dossiers}
                demandes={currentDemandes}
                feuilles={currentFeuilles}
                pvs={currentPvs}
                hasDemande={hasDemande}
                hasFeuille={hasFeuille}
                hasPv={hasPv}
                activeTab={activeDossierTab}
                onSelectTab={setActiveDossierTab}
                onSelectDossier={handleOpenDossier}
                onBack={handleBackToDashboard}
              />

              <div style={{ padding: '24px 20px' }}>
                {activeDossierTab === 'vue-ensemble' && (
                  <VueEnsembleTab
                    key={currentDossier.id}
                    dossier={currentDossier}
                    demandes={currentDemandes}
                    feuilles={currentFeuilles}
                    pvs={currentPvs}
                    onGoToDemandes={() => setActiveDossierTab('actions-echanges')}
                    onGoToObservations={() => setActiveDossierTab('constats-defense')}
                    onGoToPvs={() => setActiveDossierTab('documents')}
                    onSaveDemande={handleSaveDemande}
                    onSaveFeuille={handleSaveFeuille}
                    currentUser={currentUser}
                  />
                )}


                {activeDossierTab === 'actions-echanges' && (
                  <DemandeCommunicationView
                    key={currentDossier.id}
                    demandes={currentDemandes}
                    initialDemande={currentDemandes[0] || null}
                    currentUser={currentUser}
                    dossierNom={currentDossier.entiteControlee.nom}
                    onGoToFeuilleObservation={() => setActiveDossierTab('constats-defense')}
                    onUpdateDemande={handleSaveDemande}
                    onAddDemande={handleAddDemande}
                    onCancelDemande={handleCancelDemande}
                    onCreateFeuille={handleCreateFeuilleFromDemande}
                    hasFeuille={hasFeuille}
                  />
                )}

                {activeDossierTab === 'constats-defense' && (
                  <FeuilleObservationView
                    key={currentDossier.id}
                    feuilles={currentFeuilles}
                    initialFeuille={currentFeuilles[0] || null}
                    currentUser={currentUser}
                    dossierNom={currentDossier.entiteControlee.nom}
                    onNavigateTab={(tab) => setActiveDossierTab(tab)}
                    onSaveFeuille={handleSaveFeuille}
                    onAddFeuille={handleAddFeuille}
                    onLancerPv={handleLancerPv}
                    hasPv={hasPv}
                  />
                )}

                {activeDossierTab === 'documents' && (
                  <PvView
                    key={currentDossier.id}
                    dossier={currentDossier}
                    pvs={currentPvs}
                    initialPv={currentPvs[0] || null}
                    feuille={currentFeuilles[currentFeuilles.length - 1] || null}
                    documents={documentsParDossier[currentDossier.id] || []}
                    currentUser={currentUser}
                    onNavigateTab={(tab) => setActiveDossierTab(tab)}
                    onUpdatePv={handleUpdatePv}
                    onAddPv={handleAddPv}
                  />
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

          {/* Route: Lab Tableaux UX / Components */}
          {activeNav === 'components' && (
            <div style={{ padding: '20px' }}>
              <ComponentsView onOpenDossier={handleOpenDossier} />
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
