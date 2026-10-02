import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DemandeCommunication, DossierEnquete, FeuilleObservation, PvDetail, RenseignementItem } from '../types';
import type { DossierTabId } from '../components/DossierHeader';
import { apiGet, getSession, login, logout, type ApiCase, type ApiUser } from './client';
import { userAccount } from './mappers';
import { loadWorkspace, type WorkspaceData } from './workspace';
import {
  createCase, createIntelligence, createRequest, createSheet, proposeClassification,
  saveRequest, saveSheet, updateIntelligence,
} from './actions';

const STORAGE_THEME = 'procezo_theme';
const STORAGE_NAV = 'procezo_active_nav';
const STORAGE_TAB = 'procezo_dossier_tab';
const STORAGE_SELECTED_DOSSIER = 'procezo_selected_dossier';
const NAV_ROUTES = new Set([
  'dossiers-enquete', 'dossier-detail', 'mon-travail', 'renseignements',
  'documents-modeles', 'rapports-stats', 'parametres',
]);

function initialNav(): string {
  const route = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  if (route.startsWith('dossier/')) return 'dossier-detail';
  if (NAV_ROUTES.has(route)) return route === 'dossiers-enquete' ? 'dossier-detail' : route;
  const saved = localStorage.getItem(STORAGE_NAV);
  return saved && NAV_ROUTES.has(saved) ? saved : 'mon-travail';
}

export function useAppController() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem(STORAGE_THEME) === 'light' ? 'light' : 'dark');
  const [me, setMe] = useState<ApiUser | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'authenticated' | 'error'>('loading');
  const [authError, setAuthError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [mutationInfo, setMutationInfo] = useState('');
  const [activeNav, setActiveNav] = useState(initialNav);
  const [selectedDossierId, setSelectedDossierId] = useState(() => localStorage.getItem(STORAGE_SELECTED_DOSSIER) || '');
  const [activeDossierTab, setActiveDossierTab] = useState<DossierTabId>(() => {
    const saved = localStorage.getItem(STORAGE_TAB) as DossierTabId;
    return ['vue-ensemble', 'actions-echanges', 'constats-defense', 'documents'].includes(saved) ? saved : 'vue-ensemble';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_TAB, activeDossierTab);
  }, [activeDossierTab]);

  useEffect(() => {
    let live = true;
    async function boot() {
      let authenticated = false;
      try {
        const session = await getSession();
        if (!live) return;
        if (!session.authenticated) {
          setAuthStatus('unauthenticated');
          return;
        }
        authenticated = true;
        const user = await apiGet<ApiUser>('/me/');
        if (live) setMe(user);
        const data = await loadWorkspace(user);
        if (!live) return;
        setMe(user);
        setWorkspace(data);
        setAuthError('');
        setAuthStatus('authenticated');
      } catch (error) {
        if (!live) return;
        setAuthError(error instanceof Error ? error.message : 'Connexion au serveur impossible.');
        setAuthStatus(authenticated ? 'error' : 'unauthenticated');
      }
    }
    void boot();
    return () => { live = false; };
  }, []);

  const refreshWorkspace = useCallback(async (user = me) => {
    if (!user) throw new Error('Session expirée. Reconnectez-vous.');
    const data = await loadWorkspace(user);
    setWorkspace(data);
    return data;
  }, [me]);

  const handleLogin = useCallback(async (username: string, password: string) => {
    setAuthError('');
    await login(username, password);
    const user = await apiGet<ApiUser>('/me/');
    setMe(user);
    setAuthStatus('loading');
    const data = await loadWorkspace(user);
    setMe(user);
    setWorkspace(data);
    setAuthError('');
    setAuthStatus('authenticated');
    setActiveNav(user.memberships.some((membership) => membership.role === 'manager') ? 'rapports-stats' : 'mon-travail');
  }, []);

  const retryWorkspace = useCallback(async () => {
    setAuthStatus('loading');
    setAuthError('');
    try {
      const user = me || await apiGet<ApiUser>('/me/');
      const data = await loadWorkspace(user);
      setMe(user);
      setWorkspace(data);
      setAuthStatus('authenticated');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Actualisation impossible.');
      setAuthStatus('error');
    }
  }, [me]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setMe(null);
      setWorkspace(null);
      setAuthStatus('unauthenticated');
      setMutationError('');
      window.location.hash = '';
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Déconnexion impossible.');
    }
  }, []);

  const currentUser = useMemo(() => me ? userAccount(me,
    me.memberships.some((membership) => membership.role === 'manager') ? 'manager' : 'investigator',
  ) : null, [me]);
  const agentAccounts = useMemo(() => (workspace?.users || []).filter((user) => workspace?.restrictedAgentIds.includes(user.id)).map((user) => userAccount(user, user.id === me?.id
    ? currentUser?.role === 'director' ? 'manager' : 'investigator' : 'investigator')),
  [workspace, me, currentUser]);
  const dossiers = workspace?.dossiers || [];
  const renseignements = workspace?.renseignements || [];
  const demandesParDossier = workspace?.demandesParDossier || {};
  const feuillesParDossier = workspace?.feuillesParDossier || {};
  const documentsParDossier = workspace?.documentsParDossier || {};
  const pvsParDossier: Record<string, PvDetail[]> = {};
  // The API already applies the user's unit, clearance and assignment policy.
  const visibleDossiers = dossiers;
  const visibleRenseignements = renseignements;

  const hashReference = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  const fromHash = hashReference.startsWith('dossier/') ? hashReference.slice('dossier/'.length) : '';
  const effectiveSelectedDossierId = visibleDossiers.find((item) => item.id === fromHash || item.reference === fromHash)?.id
    || visibleDossiers.find((item) => item.id === selectedDossierId || item.reference === selectedDossierId)?.id
    || visibleDossiers[0]?.id || '';

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    localStorage.setItem(STORAGE_NAV, activeNav);
    if (activeNav === 'dossier-detail' && effectiveSelectedDossierId) {
      localStorage.setItem(STORAGE_SELECTED_DOSSIER, effectiveSelectedDossierId);
      if (window.location.hash !== `#/dossier/${effectiveSelectedDossierId}`) window.location.hash = `#/dossier/${effectiveSelectedDossierId}`;
    } else if (activeNav !== 'dossier-detail') {
      if (window.location.hash !== `#/${activeNav}`) window.location.hash = `#/${activeNav}`;
    }
  }, [authStatus, activeNav, effectiveSelectedDossierId]);

  useEffect(() => {
    const onHash = () => {
      const route = window.location.hash.replace(/^#\/?/, '').split('?')[0];
      if (route.startsWith('dossier/')) {
        const id = route.slice('dossier/'.length);
        const target = visibleDossiers.find((item) => item.id === id || item.reference === id);
        if (target) {
          setSelectedDossierId(target.id);
          setActiveNav('dossier-detail');
        }
      } else if (NAV_ROUTES.has(route)) setActiveNav(route === 'dossiers-enquete' ? 'dossier-detail' : route);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [visibleDossiers]);

  const currentDossier = visibleDossiers.find((item) => item.id === effectiveSelectedDossierId) || null;
  const currentDemandes = currentDossier ? demandesParDossier[currentDossier.id] || [] : [];
  const currentFeuilles = currentDossier ? feuillesParDossier[currentDossier.id] || [] : [];
  const currentPvs: PvDetail[] = [];

  const mutate = useCallback(async (operation: () => Promise<unknown>, message?: string) => {
    setMutationError('');
    setMutationInfo('');
    let completed = false;
    try {
      await operation();
      completed = true;
      await refreshWorkspace();
      if (message) setMutationInfo(message);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'L’opération a échoué.';
      setMutationError(completed ? `Écriture enregistrée, mais actualisation impossible : ${detail}` : detail);
      if (!completed) await refreshWorkspace().catch(() => undefined);
      throw error;
    }
  }, [refreshWorkspace]);

  const unsupported = useCallback(async (message: string): Promise<void> => {
    setMutationInfo('');
    setMutationError(message);
    throw new Error(message);
  }, []);

  const handleOpenDossier = useCallback((id: string, tab?: DossierTabId) => {
    const target = visibleDossiers.find((item) => item.id === id || item.reference === id);
    if (!target) return;
    setSelectedDossierId(target.id);
    localStorage.setItem(STORAGE_SELECTED_DOSSIER, target.id);
    if (tab) setActiveDossierTab(tab);
    setActiveNav('dossier-detail');
    window.location.hash = `#/dossier/${target.id}`;
  }, [visibleDossiers]);

  const handleCreateDossier = useCallback(async (data: DossierEnquete, intelligenceId?: string, assigneeId?: number) => {
    if (!workspace || !me) throw new Error('Données de session indisponibles.');
    let created: ApiCase | null = null;
    await mutate(async () => { created = await createCase(workspace, me, data, intelligenceId, assigneeId || (data as DossierEnquete & { assigneeId?: number }).assigneeId); });
    if (created) {
      const id = (created as ApiCase).id;
      setSelectedDossierId(id);
      localStorage.setItem(STORAGE_SELECTED_DOSSIER, id);
      setActiveDossierTab('vue-ensemble');
      setActiveNav('dossier-detail');
      window.location.hash = `#/dossier/${id}`;
    }
  }, [workspace, me, mutate]);

  const handleAddRenseignement = useCallback(async (item: RenseignementItem, files?: File[], assigneeId?: number) => {
    if (!workspace || !me) throw new Error('Données de session indisponibles.');
    await mutate(() => createIntelligence(workspace, me, item, files, assigneeId));
  }, [workspace, me, mutate]);

  const handleUpdateRenseignement = useCallback(async (item: RenseignementItem) => {
    if (!workspace || !me) throw new Error('Données de session indisponibles.');
    await mutate(() => updateIntelligence(workspace, me, item));
  }, [workspace, me, mutate]);

  const handleAddDemande = useCallback(async (item: DemandeCommunication, file?: File) => {
    await mutate(() => createRequest(item, file));
  }, [mutate]);

  const handleSaveDemande = useCallback(async (item: DemandeCommunication, file?: File) => {
    if (!workspace) throw new Error('Données de session indisponibles.');
    await mutate(() => saveRequest(workspace, item, file));
  }, [workspace, mutate]);

  const handleAddFeuille = useCallback(async (item: FeuilleObservation, file?: File) => {
    await mutate(() => createSheet(item, file));
  }, [mutate]);

  const handleSaveFeuille = useCallback(async (item: FeuilleObservation, file?: File) => {
    if (!workspace) throw new Error('Données de session indisponibles.');
    await mutate(() => saveSheet(workspace, item, file));
  }, [workspace, mutate]);

  const handleCloturerSansSuite = useCallback(async (reason: string, caseId?: string) => {
    if (!workspace || (!caseId && !currentDossier)) throw new Error('Dossier indisponible.');
    await mutate(() => proposeClassification(workspace, caseId || currentDossier!.id, reason),
      'Proposition de classement enregistrée. Une validation hiérarchique reste nécessaire.');
  }, [workspace, currentDossier, mutate]);

  return {
    authStatus, authError, mutationError, mutationInfo, setMutationError, setMutationInfo,
    theme, toggleTheme: () => setTheme((value) => value === 'dark' ? 'light' : 'dark'),
    me, workspace, currentUser, agentAccounts, activeNav, setActiveNav,
    selectedDossierId, activeDossierTab, setActiveDossierTab,
    isSidebarCollapsed, setIsSidebarCollapsed, dossiers, renseignements,
    demandesParDossier, feuillesParDossier, pvsParDossier, documentsParDossier,
    visibleDossiers, visibleRenseignements, currentDossier, currentDemandes, currentFeuilles, currentPvs,
    handleLogin, handleLogout, retryWorkspace, handleOpenDossier, handleCreateDossier,
    handleAddRenseignement, handleUpdateRenseignement, handleAddDemande, handleSaveDemande,
    handleCancelDemande: () => unsupported('L’annulation d’une demande n’est pas disponible dans l’API.'),
    handleAddFeuille, handleSaveFeuille, handleCreateFeuilleFromDemande: handleAddFeuille,
    handleCloturerSansSuite,
    handleRevirementJugement: () => unsupported('Le revirement requiert une nouvelle appréciation et une décision sur le serveur.'),
    handleAddPv: (_pv: PvDetail) => unsupported('La création de PV officiel attend la procédure métier validée.'),
    handleUpdatePv: (_pv: PvDetail) => unsupported('La modification de PV officiel attend la procédure métier validée.'),
    handleLancerPv: () => unsupported('La création de PV officiel attend la procédure métier validée.'),
    handleBackToDashboard: () => setActiveNav('mon-travail'),
    handleSelectNav: setActiveNav,
    refreshWorkspace,
  };
}
