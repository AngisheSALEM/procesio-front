import { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
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
  PvDetail,
  RenseignementItem
} from './types';
import {
  mockUsers,
  mockDossiers,
  mockDemandesParDossier,
  mockFeuillesParDossier,
  mockDocumentsParDossier,
  mockPvsParDossier,
  mockRenseignements
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

  // Renseignements state
  const [renseignements, setRenseignements] = useState<RenseignementItem[]>(mockRenseignements);

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
    'dossier-0844': [mockDemandesParDossier['dossier-0844']],
    'dossier-0845': [mockDemandesParDossier['dossier-0845']],
    'dossier-0846': [mockDemandesParDossier['dossier-0846']],
    'dossier-0847': [mockDemandesParDossier['dossier-0847']],
  });

  // Feuilles d'observation (par dossier) : Tableau de feuilles
  const [feuillesParDossier, setFeuillesParDossier] = useState<Record<string, FeuilleObservation[]>>({
    'dossier-0842': [mockFeuillesParDossier['dossier-0842']],
    'dossier-0843': [mockFeuillesParDossier['dossier-0843']],
    'dossier-0844': [mockFeuillesParDossier['dossier-0844']],
    'dossier-0845': [mockFeuillesParDossier['dossier-0845']],
    'dossier-0846': [mockFeuillesParDossier['dossier-0846']],
    'dossier-0847': [mockFeuillesParDossier['dossier-0847']],
  });

  // Procès-Verbaux dressés (par dossier) : Tableau de PVs
  const [pvsParDossier, setPvsParDossier] = useState<Record<string, PvDetail[]>>(mockPvsParDossier);


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
    return role === 'admin' ? 'rapports-stats' : 'mon-travail';
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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });

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

    const defaultRoute = role === 'admin' ? 'rapports-stats' : 'mon-travail';
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

  const handleOpenDossier = (dossierId: string, initialTab?: DossierTabId) => {
    setSelectedDossierId(dossierId);
    localStorage.setItem(STORAGE_SELECTED_DOSSIER, dossierId);
    if (initialTab) {
      setActiveDossierTab(initialTab);
      localStorage.setItem(STORAGE_TAB, initialTab);
    }
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

  // Handle classifying without further action (Clôture sans suite)
  const handleCloturerSansSuite = (motif: string, dId?: string) => {
    const targetId = dId || currentDossier.id;
    const today = new Date().toISOString().split('T')[0];
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === targetId) {
          return {
            ...d,
            statut: 'CLOTURE',
            decisionCloture: 'CLASSE_SANS_SUITE',
            motifClassement: motif,
            dateCloture: today,
            prochaineAction: `Dossier classé sans suite — ${motif}`,
          };
        }
        return d;
      })
    );
  };

  // Handle reversing a judgment upon new justification / revirement
  const handleRevirementJugement = (motif: string, docNom?: string, dId?: string) => {
    const targetId = dId || currentDossier.id;
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === targetId) {
          return {
            ...d,
            statut: 'EN_COURS',
            decisionCloture: undefined,
            motifClassement: undefined,
            dateCloture: undefined,
            prochaineAction: `Jugement révisé suite à revirement (${docNom || 'Nouvelle pièce'}) — ${motif}`,
          };
        }
        return d;
      })
    );
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

    if (updatedDemande.evaluationReponse === 'SATISFAISANTE' && updatedDemande.motifSatisfaction) {
      handleCloturerSansSuite(updatedDemande.motifSatisfaction, dId);
    }
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

    if (updatedFeuille.decisionFinale === 'CLASSE_SANS_SUITE' && updatedFeuille.motifSatisfaction) {
      handleCloturerSansSuite(updatedFeuille.motifSatisfaction, dId);
    }
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

  // Handle creating a new dossier with precise timestamp (and optional intelligence link)
  const handleCreateDossier = (data: any, renseignementId?: string) => {
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
    const newId = `dossier-${Date.now().toString().slice(-4)}`;

    const newDossier: DossierEnquete = {
      ...data,
      id: newId,
      horodatageCreation: timestamp,
      equipe: data.equipe && data.equipe.length > 0 ? data.equipe : [`${currentUser.grade} ${currentUser.prenom} ${currentUser.nom} (Chef de mission)`],
      operationsDouanieres: [],
      renseignementsLiesIds: renseignementId ? [renseignementId] : [],
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

    if (renseignementId) {
      setRenseignements((prev) =>
        prev.map((r) =>
          r.id === renseignementId
            ? {
                ...r,
                statut: 'Dossier d’enquête ouvert',
                effetProduit: 'ENQUETE_EN_COURS',
                dossiersLies: [...(r.dossiersLies || []), newId],
              }
            : r
        )
      );
    }

    if (currentUser.role !== 'admin') {
      handleOpenDossier(newId);
    }
  };

  const handleAddRenseignement = (newR: RenseignementItem) => {
    setRenseignements((prev) => [newR, ...prev]);
  };

  const handleUpdateRenseignement = (updatedR: RenseignementItem) => {
    setRenseignements((prev) => prev.map((r) => (r.id === updatedR.id ? updatedR : r)));
  };



  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div
      className="app-layout"
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
        className="app-main"
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
        {/* Mobile topbar: only visible on screens <= 768px */}
        <header className="mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
              }}
              title="Menu de navigation"
              aria-label="Menu de navigation"
            >
              <Menu size={20} />
            </button>
            <img
              src="/Logo-dgda.png"
              alt="Logo DGDA"
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.6px' }}>PROCEZO</span>
          </div>
        </header>

        {/* Central Workspace: Scrollable view area */}
        <main
          className="app-scroll-area"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            minWidth: 0,
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

              <div className="view-container">
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
                    onCloturerSansSuite={handleCloturerSansSuite}
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
                    onCloturerSansSuite={handleCloturerSansSuite}
                    onRevirementJugement={handleRevirementJugement}
                    hasFeuille={hasFeuille}
                    hasPv={hasPv}
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
                    onCloturerSansSuite={handleCloturerSansSuite}
                    onRevirementJugement={handleRevirementJugement}
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
            <div className="view-container">
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
            <div className="view-container">
              <RenseignementsView
                renseignements={renseignements}
                currentUser={currentUser}
                onOpenDossier={handleOpenDossier}
                onCreateDossier={handleCreateDossier}
                onAddRenseignement={handleAddRenseignement}
                onUpdateRenseignement={handleUpdateRenseignement}
                dossiers={dossiers}
                demandesParDossier={demandesParDossier}
                feuillesParDossier={feuillesParDossier}
                pvsParDossier={pvsParDossier}
              />
            </div>
          )}

          {/* Route: Documents et modèles */}
          {activeNav === 'documents-modeles' && (
            <div className="view-container">
              <DocumentsModelesView />
            </div>
          )}

          {/* Route: Rapports et statistiques (Admin) */}
          {activeNav === 'rapports-stats' && (
            <div className="view-container">
              <RapportsStatsView
                onOpenDossier={(dId, tab) => handleOpenDossier(dId || 'dossier-0842', tab)}
                dossiers={dossiers}
                renseignements={renseignements}
                demandesParDossier={demandesParDossier}
                feuillesParDossier={feuillesParDossier}
                pvsParDossier={pvsParDossier}
              />
            </div>
          )}

          {/* Route: Lab Tableaux UX / Components */}
          {activeNav === 'components' && (
            <div className="view-container">
              <ComponentsView onOpenDossier={handleOpenDossier} />
            </div>
          )}

          {/* Route: Paramètres (Theme switch and profile) */}
          {activeNav === 'parametres' && (
            <div className="view-container">
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
