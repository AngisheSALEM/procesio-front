import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DossierHeader } from './components/DossierHeader';
import { VueEnsembleTab } from './components/VueEnsembleTab';
import { DemandeCommunicationView } from './components/DemandeCommunicationView';
import { FeuilleObservationView } from './components/FeuilleObservationView';
import { DocumentsTab } from './components/DocumentsTab';
import { MonTravailView } from './components/MonTravailView';
import { RenseignementsView } from './components/RenseignementsView';
import { DocumentsModelesView } from './components/DocumentsModelesView';
import { RapportsStatsView } from './components/RapportsStatsView';
import { ParametresView } from './components/ParametresView';
import { LoginPage } from './components/LoginPage';
import { useAppController } from './api/useAppController';

export function App() {
  const controller = useAppController();

  if (controller.authStatus === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
        Chargement de la session…
      </div>
    );
  }
  if (controller.authStatus === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', padding: '20px' }}>
        <div role="alert" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '24px', maxWidth: '480px' }}>
          <p>Les données du serveur n’ont pas pu être chargées : {controller.authError}</p>
          <button type="button" className="btn-primary" onClick={() => void controller.retryWorkspace()}>Réessayer</button>
        </div>
      </div>
    );
  }
  if (controller.authStatus === 'unauthenticated' || !controller.currentUser || !controller.workspace) {
    return <LoginPage onLogin={controller.handleLogin} error={controller.authError} />;
  }

  const {
    theme, toggleTheme, currentUser, workspace, agentAccounts,
    activeNav, activeDossierTab, setActiveDossierTab,
    isSidebarCollapsed, setIsSidebarCollapsed,
    dossiers, renseignements, demandesParDossier, feuillesParDossier, pvsParDossier, documentsParDossier,
    visibleDossiers, visibleRenseignements, currentDemandes, currentFeuilles, currentPvs,
    mutationError, mutationInfo, setMutationError, setMutationInfo,
    handleLogout, handleOpenDossier, handleCreateDossier,
    handleAddRenseignement, handleUpdateRenseignement, handleAddDemande, handleSaveDemande,
    handleCancelDemande, handleAddFeuille, handleSaveFeuille, handleCreateFeuilleFromDemande,
    handleCloturerSansSuite, handleRevirementJugement, handleLancerPv,
    handleBackToDashboard, handleSelectNav,
  } = controller;
  const currentDossier = controller.currentDossier!;
  const hasDemande = currentDemandes.length > 0;
  const hasFeuille = currentFeuilles.length > 0;
  const hasPv = currentPvs.length > 0;

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
          {(mutationError || mutationInfo || workspace.warnings.length > 0) && (
            <div role={mutationError ? 'alert' : 'status'} style={{ padding: '12px 18px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
              {mutationError || mutationInfo || workspace.warnings.join(' · ')}
              <button type="button" onClick={() => { setMutationError(''); setMutationInfo(''); }} style={{ marginLeft: '12px', background: 'transparent', border: 'none', color: 'var(--color-accent)', cursor: 'pointer' }}>Fermer</button>
            </div>
          )}
          {(activeNav === 'dossier-detail' || activeNav === 'dossiers-enquete') && !currentDossier && (
            <div className="view-container" style={{ padding: '28px', color: 'var(--color-text-secondary)' }}>
              Aucun dossier accessible pour votre compte.
            </div>
          )}
          {/* Route: Dossier Detail (Page de détail d'un dossier accédée depuis le tableau) */}
          {(activeNav === 'dossier-detail' || activeNav === 'dossiers-enquete') && currentDossier && (
            <div key={`dossier-wrapper-${currentDossier.id}`} className="view-transition"> <br />
              <DossierHeader
                dossier={currentDossier}
                allDossiers={visibleDossiers}
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

              <div key={activeDossierTab} className="view-container view-transition">
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
                    dossierId={currentDossier.id}
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
                    dossierId={currentDossier.id}
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
                  <DocumentsTab
                    documents={documentsParDossier[currentDossier.id] || []}
                  />
                )}
              </div>
            </div>
          )}

          {/* Route: Mon travail (Tableau minimaliste des dossiers de l'agent) */}
          {activeNav === 'mon-travail' && (
            <div key="mon-travail" className="view-container view-transition">
              <MonTravailView
                dossiers={visibleDossiers}
                workItems={workspace.workItems}
                onOpenDossier={handleOpenDossier}
                onCreateDossier={handleCreateDossier}
                user={currentUser}
              />
            </div>
          )}

          {/* Route: Renseignements */}
          {activeNav === 'renseignements' && (
            <div key="renseignements" className="view-container view-transition">
              <RenseignementsView
                renseignements={visibleRenseignements}
                agents={agentAccounts}
                currentUser={currentUser}
                onOpenDossier={handleOpenDossier}
                onCreateDossier={handleCreateDossier}
                onAddRenseignement={handleAddRenseignement}
                onUpdateRenseignement={handleUpdateRenseignement}
                dossiers={visibleDossiers}
                demandesParDossier={demandesParDossier}
                feuillesParDossier={feuillesParDossier}
                pvsParDossier={pvsParDossier}
              />
            </div>
          )}

          {/* Route: Documents et modèles */}
          {activeNav === 'documents-modeles' && (
            <div key="documents-modeles" className="view-container view-transition">
              <DocumentsModelesView />
            </div>
          )}

          {/* Route: Rapports et statistiques (director) */}
          {activeNav === 'rapports-stats' && (
            <div key="rapports-stats" className="view-container view-transition">
              <RapportsStatsView
                onOpenDossier={(dId, tab) => { if (dId) handleOpenDossier(dId, tab); }}
                statistics={workspace.statistics}
                dossiers={dossiers}
                renseignements={renseignements}
                demandesParDossier={demandesParDossier}
                feuillesParDossier={feuillesParDossier}
                pvsParDossier={pvsParDossier}
              />
            </div>
          )}

          {/* Route: Paramètres (Theme switch and profile) */}
          {activeNav === 'parametres' && (
            <div key="parametres" className="view-container view-transition">
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
