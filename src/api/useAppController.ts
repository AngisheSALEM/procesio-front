import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DemandeCommunication, DossierEnquete, FeuilleObservation, PvDetail, RenseignementItem } from '../types';
import type { DossierTabId } from '../components/DossierHeader';
import { apiAll, apiGet, cancelSessionRequests, getSession, isSessionExpired, onSessionExpired, login, logout, type ApiCase, type ApiUser, type ApiWorkItem, type ApiValidationItem } from './client';
import { userAccount } from './mappers';
import { loadWorkspace, loadSingleCaseDetails, type WorkspaceData } from './workspace';
import {
  createCase, createIntelligence, createRequest, createSheet, proposeClassification,
  saveRequest, saveSheet, updateIntelligence, updateCase, assignCase, linkIntelligenceToCase,
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
  const generation = useRef(0);
  const mutationPending = useRef(false);
  const loadingCasesRef = useRef<Set<string>>(new Set());
  const [loggingOut, setLoggingOut] = useState(false);
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
    if (authStatus === 'authenticated') localStorage.setItem(STORAGE_TAB, activeDossierTab);
  }, [authStatus, activeDossierTab]);

  const clearSession = useCallback((message = '') => {
    cancelSessionRequests();
    generation.current += 1;
    setMe(null);
    setWorkspace(null);
    setAuthError(message);
    setMutationError('');
    setMutationInfo('');
    setSelectedDossierId('');
    setActiveNav('mon-travail');
    setActiveDossierTab('vue-ensemble');
    for (const key of [STORAGE_NAV, STORAGE_TAB, STORAGE_SELECTED_DOSSIER]) localStorage.removeItem(key);
    window.location.hash = '';
    setAuthStatus('unauthenticated');
  }, []);

  const expireSession = useCallback(() => clearSession('Votre session a expiré. Reconnectez-vous.'), [clearSession]);

  const loadSession = useCallback(async (ticket: number) => {
    try {
      const session = await getSession();
      if (ticket !== generation.current) return;
      if (!session.authenticated) { clearSession(); return; }
      const user = await apiGet<ApiUser>('/me/');
      if (ticket !== generation.current) return;
      const savedDossier = localStorage.getItem(STORAGE_SELECTED_DOSSIER) || '';
      const hashRef = window.location.hash.replace(/^#\/?/, '').split('?')[0];
      const fromHash = hashRef.startsWith('dossier/') ? hashRef.slice('dossier/'.length) : '';
      const data = await loadWorkspace(user, fromHash || savedDossier || undefined);
      if (ticket !== generation.current) return;
      setMe(user);
      setWorkspace(data);
      setAuthError('');
      setAuthStatus('authenticated');
    } catch (error) {
      if (ticket !== generation.current) return;
      if (isSessionExpired(error)) { expireSession(); return; }
      setAuthError(error instanceof Error ? error.message : 'Connexion au serveur impossible.');
      setAuthStatus('error');
    }
  }, [clearSession, expireSession]);

  useEffect(() => {
    const unsubscribe = onSessionExpired(expireSession);
    const ticket = ++generation.current;
    void loadSession(ticket);
    return () => { generation.current += 1; cancelSessionRequests(); unsubscribe(); };
  }, [loadSession, expireSession]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    let checking = false;
    let live = true;
    const checkSession = async () => {
      if (checking || document.visibilityState === 'hidden') return;
      checking = true;
      const ticket = generation.current;
      try {
        const session = await getSession();
        if (live && ticket === generation.current && !session.authenticated) expireSession();
      } catch {
        // A temporary network failure does not establish that the session expired.
      } finally { checking = false; }
    };
    const interval = window.setInterval(() => void checkSession(), 60_000);
    window.addEventListener('focus', checkSession);
    document.addEventListener('visibilitychange', checkSession);
    return () => {
      live = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', checkSession);
      document.removeEventListener('visibilitychange', checkSession);
    };
  }, [authStatus, expireSession]);

  const refreshWorkspace = useCallback(async (targetCaseId?: string) => {
    const ticket = generation.current;
    if (targetCaseId && workspace && me) {
      try {
        const caseItem = await apiGet<ApiCase>(`/dossiers/${encodeURIComponent(targetCaseId)}/`);
        if (ticket !== generation.current) return;
        const updated = await loadSingleCaseDetails(targetCaseId, workspace, me);
        if (ticket !== generation.current) return;
        const memberships = me.memberships.filter((m) => m.role === 'manager' || m.role === 'investigator');
        const workItems = (await Promise.all(['cases', 'requests', 'decisions'].map((kind) =>
          apiAll<ApiWorkItem>(`/mon-travail/?kind=${kind}&page_size=100`).catch(() => [])
        ))).flat();
        const validationItems: ApiValidationItem[] = [];
        if (memberships.some((m) => m.role === 'manager')) {
          const valResults = await Promise.all(['requests', 'decisions'].map((kind) =>
            apiAll<ApiValidationItem>(`/a-valider/?kind=${kind}&page_size=100`).catch(() => [])
          ));
          validationItems.push(...valResults.flat());
        }
        if (ticket !== generation.current) return;
        const resultWorkspace: WorkspaceData = {
          ...updated,
          cases: updated.cases.map((c) => c.id === targetCaseId ? caseItem : c),
          workItems,
          validationItems,
        };
        setWorkspace(resultWorkspace);
        return resultWorkspace;
      } catch (err) {
        if (isSessionExpired(err)) throw err;
        // Fall back to full load if targeted single-case refresh fails
      }
    }
    // Delegations may have expired or been revoked since login.
    try {
      const user = await apiGet<ApiUser>('/me/');
      if (ticket !== generation.current) return;
      const data = await loadWorkspace(user, targetCaseId || undefined);
      if (ticket !== generation.current) return;
      setMe(user);
      setWorkspace(data);
      return data;
    } catch (error) {
      if (ticket === generation.current && !isSessionExpired(error)) {
        setAuthError(error instanceof Error ? error.message : 'Actualisation impossible.');
        setAuthStatus('error');
      }
      throw error;
    }
  }, [workspace, me]);

  const handleLogin = useCallback(async (username: string, password: string) => {
    cancelSessionRequests();
    const ticket = ++generation.current;
    setAuthError('');
    try {
      await login(username, password);
    } catch (error) {
      if (ticket !== generation.current) return;
      setAuthError(error instanceof Error ? error.message : 'Connexion impossible.');
      setAuthStatus('unauthenticated');
      return;
    }
    if (ticket !== generation.current) return;
    setAuthStatus('loading');
    await loadSession(ticket);
  }, [loadSession]);

  const retryWorkspace = useCallback(async () => {
    cancelSessionRequests();
    setAuthStatus('loading');
    setAuthError('');
    await loadSession(++generation.current);
  }, [loadSession]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    // Invalidate refreshes already in flight so they cannot restore the old account.
    generation.current += 1;
    cancelSessionRequests();
    setLoggingOut(true);
    setMutationError('');
    try {
      await getSession();
      await logout();
      clearSession();
    } catch (error) {
      if (isSessionExpired(error)) clearSession();
      else setMutationError(error instanceof Error ? error.message : 'Déconnexion impossible. Réessayez.');
    } finally {
      setLoggingOut(false);
    }
  }, [clearSession, loggingOut]);

  const currentUser = useMemo(() => me ? userAccount(me,
    me.memberships.some((membership) => membership.role === 'manager') ? 'manager' : 'investigator',
  ) : null, [me]);
  const agentAccounts = useMemo(() => (workspace?.users || []).filter((user) => workspace?.assignableAgentIds.includes(user.id)).map((user) => userAccount(user, user.id === me?.id
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

  useEffect(() => {
    if (authStatus !== 'authenticated' || !effectiveSelectedDossierId || !me || !workspace) return;
    if (workspace.loadedCaseIds?.has(effectiveSelectedDossierId)) return;
    if (loadingCasesRef.current.has(effectiveSelectedDossierId)) return;
    loadingCasesRef.current.add(effectiveSelectedDossierId);
    void (async () => {
      try {
        const updated = await loadSingleCaseDetails(effectiveSelectedDossierId, workspace, me);
        setWorkspace((prev) => prev ? {
          ...updated,
          loadedCaseIds: new Set([...(prev.loadedCaseIds || []), effectiveSelectedDossierId]),
        } : null);
      } catch (error) {
        if (!isSessionExpired(error)) {
          console.error(`Erreur de chargement du dossier ${effectiveSelectedDossierId}:`, error);
        }
      } finally {
        loadingCasesRef.current.delete(effectiveSelectedDossierId);
      }
    })();
  }, [authStatus, effectiveSelectedDossierId, me, workspace]);

  const currentDossier = visibleDossiers.find((item) => item.id === effectiveSelectedDossierId) || null;
  const currentDemandes = currentDossier ? demandesParDossier[currentDossier.id] || [] : [];
  const currentFeuilles = currentDossier ? feuillesParDossier[currentDossier.id] || [] : [];
  const currentPvs: PvDetail[] = [];

  const mutate = useCallback(async (operation: () => Promise<unknown>, message?: string, targetCaseId?: string) => {
    if (mutationPending.current || loggingOut) throw new Error('Une opération est déjà en cours.');
    mutationPending.current = true;
    const ticket = generation.current;
    setMutationError('');
    setMutationInfo('');
    let completed = false;
    try {
      await operation();
      completed = true;
      if (ticket !== generation.current) return;
      await refreshWorkspace(targetCaseId);
      if (ticket !== generation.current) return;
      if (message) setMutationInfo(message);
    } catch (error) {
      if (ticket !== generation.current || isSessionExpired(error)) throw error;
      const detail = error instanceof Error ? error.message : 'L’opération a échoué.';
      setMutationError(completed ? `Écriture enregistrée, mais actualisation impossible : ${detail}` : detail);
      if (completed) { setAuthError(detail); setAuthStatus('error'); }
      else await refreshWorkspace(targetCaseId).catch(() => undefined);
      throw error;
    } finally {
      mutationPending.current = false;
    }
  }, [refreshWorkspace, loggingOut]);

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
    const ticket = generation.current;
    let created: ApiCase | null = null;
    await mutate(async () => { created = await createCase(workspace, me, data, intelligenceId, assigneeId || (data as DossierEnquete & { assigneeId?: number }).assigneeId); });
    if (ticket !== generation.current) return;
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
    await mutate(() => createRequest(item, file), 'Brouillon enregistré. Ouvrez la demande pour préparer son PDF ; retrouvez les pièces jointes dans Documents.', item.dossierId);
  }, [mutate]);

  const handleSaveDemande = useCallback(async (item: DemandeCommunication, file?: File) => {
    if (!workspace) throw new Error('Données de session indisponibles.');
    await mutate(() => saveRequest(workspace, item, file), undefined, item.dossierId);
  }, [workspace, mutate]);

  const handleAddFeuille = useCallback(async (item: FeuilleObservation, file?: File) => {
    await mutate(() => createSheet(item, file), undefined, item.dossierId);
  }, [mutate]);

  const handleSaveFeuille = useCallback(async (item: FeuilleObservation, file?: File) => {
    if (!workspace) throw new Error('Données de session indisponibles.');
    await mutate(() => saveSheet(workspace, item, file), undefined, item.dossierId);
  }, [workspace, mutate]);

  const handleCloturerSansSuite = useCallback(async (reason: string, caseId?: string) => {
    const targetId = caseId || currentDossier?.id;
    if (!workspace || !targetId) throw new Error('Dossier indisponible.');
    await mutate(() => proposeClassification(workspace, targetId, reason),
      'Proposition de classement enregistrée. Une validation hiérarchique reste nécessaire.', targetId);
  }, [workspace, currentDossier, mutate]);

  const handleUpdateCase = useCallback(async (caseId: string, data: Parameters<typeof updateCase>[3]) => {
    if (!workspace || !me) throw new Error('Données de session indisponibles.');
    await mutate(() => updateCase(workspace, me, caseId, data), 'Dossier mis à jour avec succès.', caseId);
  }, [workspace, me, mutate]);

  const handleAssignCase = useCallback(async (caseId: string, newAssigneeId: number, reason: string, version: number) => {
    if (!workspace || !me) throw new Error('Données de session indisponibles.');
    await mutate(() => assignCase(workspace, me, caseId, newAssigneeId, reason, version), 'Dossier réaffecté avec succès.', caseId);
  }, [workspace, me, mutate]);

  const handleLinkIntelligence = useCallback(async (intelligenceId: string, caseId: string, version?: number) => {
    if (!workspace) throw new Error('Données de session indisponibles.');
    await mutate(() => linkIntelligenceToCase(workspace, intelligenceId, caseId, version), 'Renseignement lié au dossier avec succès.', caseId);
  }, [workspace, mutate]);

  return {
    authStatus, authError, loggingOut, mutationError, mutationInfo, setMutationError, setMutationInfo,
    theme, toggleTheme: () => setTheme((value) => value === 'dark' ? 'light' : 'dark'),
    me, workspace, currentUser, agentAccounts, activeNav, setActiveNav,
    selectedDossierId, activeDossierTab, setActiveDossierTab,
    isSidebarCollapsed, setIsSidebarCollapsed, dossiers, renseignements,
    demandesParDossier, feuillesParDossier, pvsParDossier, documentsParDossier,
    visibleDossiers, visibleRenseignements, currentDossier, currentDemandes, currentFeuilles, currentPvs,
    handleLogin, handleLogout, retryWorkspace, handleOpenDossier, handleCreateDossier,
    handleUpdateCase, handleAssignCase, handleLinkIntelligence,
    handleAddRenseignement, handleUpdateRenseignement, handleAddDemande, handleSaveDemande,
    handleCancelDemande: () => unsupported('L’annulation d’une demande n’est pas disponible dans l’API.'),
    handleAddFeuille, handleSaveFeuille, handleCreateFeuilleFromDemande: handleAddFeuille,
    handleCloturerSansSuite,
    handleRevirementJugement: async () => {
      setActiveDossierTab('vue-ensemble');
      setMutationInfo('Dans Décisions et relais GELEC, choisissez une appréciation actuelle puis proposez un remplacement motivé.');
    },
    handleAddPv: (_pv: PvDetail) => unsupported('La création de PV officiel attend la procédure métier validée.'),
    handleUpdatePv: (_pv: PvDetail) => unsupported('La modification de PV officiel attend la procédure métier validée.'),
    handleLancerPv: () => unsupported('La création de PV officiel attend la procédure métier validée.'),
    handleBackToDashboard: () => setActiveNav('mon-travail'),
    handleSelectNav: setActiveNav,
    refreshWorkspace,
  };
}
