import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Layers,
  Send,
  Scale,
  FolderOpen,
  ArrowLeft,
  Building,
  ChevronRight
} from 'lucide-react';
import type {
  DossierEnquete,
  DemandeCommunication,
  FeuilleObservation,
  PvDetail
} from '../types';
import { formatDate } from '../utils/dateUtils';

export type DossierTabId =
  | 'vue-ensemble'
  | 'actions-echanges'
  | 'constats-defense'
  | 'documents';

interface DossierHeaderProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  dossier: DossierEnquete;
  allDossiers?: DossierEnquete[];
  demandes?: DemandeCommunication[];
  feuilles?: FeuilleObservation[];
  pvs?: PvDetail[];
  hasDemande?: boolean;
  hasFeuille?: boolean;
  hasPv?: boolean;
  activeTab: DossierTabId;
  onSelectTab: (tab: DossierTabId) => void;
  onSelectDossier?: (dossierId: string) => void;
  onBack?: () => void;
}

export const DossierHeader: React.FC<DossierHeaderProps> = ({
  searchQuery = '',
  onSearchChange,
  dossier,
  allDossiers = [],
  demandes = [],
  feuilles = [],
  pvs = [],
  activeTab,
  onSelectTab,
  onSelectDossier,
  onBack,
}) => {
  const [internalQuery, setInternalQuery] = useState(searchQuery);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const query = searchQuery !== undefined && onSearchChange ? searchQuery : internalQuery;

  const handleQueryChange = (val: string) => {
    setInternalQuery(val);
    onSearchChange?.(val);
  };

  // Close search popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search popover on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Les deux onglets de création restent accessibles sur un dossier vide.
  const canShowDemande = true;
  const canShowFeuille = true;
  const canShowDocuments = true;

  // Redirection automatique si l'onglet actif n'est plus accessible
  React.useEffect(() => {
    if (activeTab === 'actions-echanges' && !canShowDemande) {
      onSelectTab('vue-ensemble');
    } else if (activeTab === 'constats-defense' && !canShowFeuille) {
      onSelectTab('vue-ensemble');
    } else if (activeTab === 'documents' && !canShowDocuments) {
      onSelectTab('vue-ensemble');
    }
  }, [activeTab, canShowDemande, canShowFeuille, canShowDocuments, onSelectTab]);

  const tabs = [
    {
      id: 'vue-ensemble' as DossierTabId,
      label: "Vue d'ensemble",
      icon: <Layers size={14} strokeWidth={1.8} />,
      visible: true,
    },
    {
      id: 'actions-echanges' as DossierTabId,
      label: 'Demande de communication',
      icon: <Send size={14} strokeWidth={1.8} />,
      visible: canShowDemande,
    },
    {
      id: 'constats-defense' as DossierTabId,
      label: 'Feuille d’observation',
      icon: <Scale size={14} strokeWidth={1.8} />,
      visible: canShowFeuille,
    },
    {
      id: 'documents' as DossierTabId,
      label: 'Documents',
      icon: <FolderOpen size={14} strokeWidth={1.8} />,
      visible: canShowDocuments,
    },
  ];

  // =========================================================================
  // RECHERCHE DANS LE DOSSIER & TRANSVERSALE
  // =========================================================================
  const qClean = query.trim().toLowerCase();

  // 1. Demandes de communication du dossier
  const matchingDemandes = demandes.filter((d) => {
    if (!qClean) return false;
    return (
      (d.objet && d.objet.toLowerCase().includes(qClean)) ||
      d.reference.toLowerCase().includes(qClean) ||
      d.destinataire.nom.toLowerCase().includes(qClean) ||
      (d.auteur && d.auteur.toLowerCase().includes(qClean)) ||
      (d.redacteur && d.redacteur.toLowerCase().includes(qClean)) ||
      (d.reponsePdfNom && d.reponsePdfNom.toLowerCase().includes(qClean)) ||
      (d.elementsDemandes && d.elementsDemandes.some((el) => el.libelle.toLowerCase().includes(qClean)))
    );
  });

  // 2. Feuilles d'observation & Constats du dossier
  const matchingFeuilles = feuilles.filter((f) => {
    if (!qClean) return false;
    return (
      f.objetControle.toLowerCase().includes(qClean) ||
      f.reference.toLowerCase().includes(qClean) ||
      f.destinataire.toLowerCase().includes(qClean) ||
      (f.inspecteurs && f.inspecteurs.some((insp) => insp.toLowerCase().includes(qClean))) ||
      (f.observations && f.observations.some((obs) =>
        obs.titre.toLowerCase().includes(qClean) ||
        obs.faitsConstates.toLowerCase().includes(qClean) ||
        (obs.referencesJuridiques && obs.referencesJuridiques.toLowerCase().includes(qClean))
      ))
    );
  });

  // 3. Procès-verbaux & Infractions du dossier
  const matchingPvs = pvs.filter((pv) => {
    if (!qClean) return false;
    return (
      pv.reference.toLowerCase().includes(qClean) ||
      pv.objet.toLowerCase().includes(qClean) ||
      pv.destinataire.toLowerCase().includes(qClean) ||
      (pv.destinationContentieuse && pv.destinationContentieuse.toLowerCase().includes(qClean)) ||
      (pv.inspecteurs && pv.inspecteurs.some((insp) => insp.toLowerCase().includes(qClean))) ||
      (pv.infractions && pv.infractions.some((inf) => inf.toLowerCase().includes(qClean))) ||
      pv.droitsEludesUSD.toString().includes(qClean) ||
      pv.amendeUSD.toString().includes(qClean)
    );
  });

  // 4. Autres dossiers d'enquête (recherche transversale)
  const matchingOtherDossiers = allDossiers.filter((other) => {
    if (!qClean || other.id === dossier.id) return false;
    return (
      other.entiteControlee.nom.toLowerCase().includes(qClean) ||
      other.reference.toLowerCase().includes(qClean) ||
      other.objet.toLowerCase().includes(qClean) ||
      (other.entiteControlee.nif && other.entiteControlee.nif.toLowerCase().includes(qClean))
    );
  });

  const totalResults =
    matchingDemandes.length +
    matchingFeuilles.length +
    matchingPvs.length +
    matchingOtherDossiers.length;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg)',
        border: 'none',
        paddingTop: '16px',
        paddingLeft: '24px',
        paddingRight: '24px',
        borderRadius: '16px 16px 0 0',
      }}
    >
      {/* Top Row: Back button, Title, Status badge & Smart Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 'min(100%, 260px)', flexWrap: 'wrap' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all var(--transition-fast)',
              }}
              title="Retour aux dossiers"
            >
              <ArrowLeft size={16} strokeWidth={2} />
            </button>
          )}

          <h1
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            {dossier.entiteControlee.nom || dossier.objet || dossier.reference}
          </h1>

          {/* Badge statut sobre et monochromatique selon la règle 60-30-10 */}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            {dossier.decisionCloture === 'CLASSE_SANS_SUITE'
              ? 'Classé sans suite'
              : dossier.statut === 'OUVERT'
              ? 'Ouvert'
              : dossier.statut === 'A_AFFECTER'
              ? 'À affecter'
              : dossier.statut === 'EN_COURS'
              ? 'En cours'
              : dossier.statut === 'A_VALIDER'
              ? 'À valider'
              : dossier.statut === 'EN_ATTENTE'
              ? 'En attente'
              : dossier.statut === 'RELAIS_CONTENTIEUX'
              ? 'Relais contentieux'
              : 'Clôturé'}
          </span>

          {/* BARRE DE RECHERCHE INTELLIGENTE SUR CE QUI SE PASSE DANS LE DOSSIER */}
          <div
            ref={searchContainerRef}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--color-surface)',
                border: isSearchOpen ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: '9999px',
                padding: '7px 16px',
                gap: '10px',
                width: '100%',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Search size={15} color={isSearchOpen ? 'var(--color-accent)' : 'var(--color-text-muted)'} />
              <input
                type="text"
                value={query}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Rechercher ce qui se passe sur les dossiers..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px',
                  width: '100%',
                  fontFamily: 'inherit',
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => handleQueryChange('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  title="Effacer la recherche"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* PANNEAU DÉROULANT : ÉVÉNEMENTS DU DOSSIER & RÉSULTATS DE RECHERCHE */}
            {isSearchOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: 'min(480px, calc(100vw - 32px))',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
                  zIndex: 1000,
                  padding: '8px 0',
                }}
              >
                {/* En-tête du popover */}
                <div
                  style={{
                    padding: '8px 16px 6px',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {qClean === '' ? 'Ce qui se passe sur ce dossier (Activité)' : 'Résultats de recherche'}
                  </span>
                  {qClean !== '' && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {totalResults} résultat{totalResults > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* SCÉNARIO 1 : RECHERCHE VIDE -> FIL D'ACTIVITÉ EN COURS SUR LE DOSSIER */}
                {qClean === '' && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* 1. Dernier PV si dressé */}
                    {pvs.length > 0 && (
                      <div
                        onClick={() => {
                          onSelectTab('documents');
                          setIsSearchOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          transition: 'background var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-accent)',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          <FolderOpen size={14} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              Procès-verbal d'infraction dressé
                            </span>
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                              PV ({pvs.length})
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pvs[pvs.length - 1].infractions[0]}
                          </p>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Verbalisé le {formatDate(pvs[pvs.length - 1].datePv)} • {pvs[pvs.length - 1].droitsEludesUSD.toLocaleString()} USD de droits éludés
                          </div>
                        </div>
                        <ChevronRight size={14} color="var(--color-text-muted)" style={{ marginTop: '4px' }} />
                      </div>
                    )}

                    {/* 2. Dernière Feuille d'observation si existante */}
                    {feuilles.length > 0 && (
                      <div
                        onClick={() => {
                          onSelectTab('constats-defense');
                          setIsSearchOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          transition: 'background var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-accent)',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          <Scale size={14} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              Feuille d'observation contradictoire
                            </span>
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                              Feuille ({feuilles.length})
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {feuilles[feuilles.length - 1].objetControle}
                          </p>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Audition prévue le {formatDate(feuilles[feuilles.length - 1].dateReunionCloturePrevue)} • {feuilles[feuilles.length - 1].observations?.length || 0} constats
                          </div>
                        </div>
                        <ChevronRight size={14} color="var(--color-text-muted)" style={{ marginTop: '4px' }} />
                      </div>
                    )}

                    {/* 3. Dernière Demande de communication si existante */}
                    {demandes.length > 0 && (
                      <div
                        onClick={() => {
                          onSelectTab('actions-echanges');
                          setIsSearchOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          transition: 'background var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-accent)',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          <Send size={14} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {demandes[demandes.length - 1].reponsePdfNom ? 'Réponse de l’opérateur reçue' : 'Demande de communication émise'}
                            </span>
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                              Demande ({demandes.length})
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {demandes[demandes.length - 1].objet || 'Demande de communication de pièces'}
                          </p>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Échéance : {formatDate(demandes[demandes.length - 1].echeanceReponse)} • {demandes[demandes.length - 1].auteur}
                          </div>
                        </div>
                        <ChevronRight size={14} color="var(--color-text-muted)" style={{ marginTop: '4px' }} />
                      </div>
                    )}

                    {/* 4. Statut global du dossier */}
                    <div
                      onClick={() => {
                        onSelectTab('vue-ensemble');
                        setIsSearchOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-accent)',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <Building size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            Objet de l'enquête douanière
                          </span>
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                            Vue d'ensemble
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dossier.objet}
                        </p>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          Prochaine action : {dossier.prochaineAction || 'Instruction en cours'}
                        </div>
                      </div>
                      <ChevronRight size={14} color="var(--color-text-muted)" style={{ marginTop: '4px' }} />
                    </div>
                  </div>
                )}

                {/* SCÉNARIO 2 : RECHERCHE PAR MOT-CLÉ */}
                {qClean !== '' && (
                  <div>
                    {totalResults === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <p style={{ fontSize: '13px', margin: 0, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                          Aucun résultat pour « {query} »
                        </p>
                        <p style={{ fontSize: '11px', margin: '6px 0 0 0' }}>
                          Essayez avec un mot-clé comme : <em>fret, PV, facture, audition, amende, constat...</em>
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Groupe A : Demandes de communication */}
                        {matchingDemandes.length > 0 && (
                          <div>
                            <div style={{ padding: '6px 16px', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Demandes de communication ({matchingDemandes.length})
                            </div>
                            {matchingDemandes.map((d) => (
                              <div
                                key={d.id}
                                onClick={() => {
                                  onSelectTab('actions-echanges');
                                  setIsSearchOpen(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '12px',
                                  padding: '10px 16px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--color-border-subtle)',
                                  transition: 'background var(--transition-fast)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-accent)', flexShrink: 0 }}>
                                  <Send size={14} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    {d.objet || 'Demande de communication de pièces'}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                    {d.reponsePdfNom ? `Réponse reçue : ${d.reponsePdfNom}` : 'En attente des pièces justificatives'}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                                    Échéance : {formatDate(d.echeanceReponse)} • Auteur : {d.auteur || d.redacteur}
                                  </div>
                                </div>
                                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                  Demande
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Groupe B : Feuilles d'observation & Constats */}
                        {matchingFeuilles.length > 0 && (
                          <div>
                            <div style={{ padding: '6px 16px', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Feuilles d'observation & Constats ({matchingFeuilles.length})
                            </div>
                            {matchingFeuilles.map((f) => (
                              <div
                                key={f.id}
                                onClick={() => {
                                  onSelectTab('constats-defense');
                                  setIsSearchOpen(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '12px',
                                  padding: '10px 16px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--color-border-subtle)',
                                  transition: 'background var(--transition-fast)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-accent)', flexShrink: 0 }}>
                                  <Scale size={14} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    {f.objetControle}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                    {f.observations?.length ? `${f.observations.length} constats formulés (${f.observations[0].titre})` : 'Procédure contradictoire en cours'}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                                    Audition contradictoire : {formatDate(f.dateReunionCloturePrevue)}
                                  </div>
                                </div>
                                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                  Observation
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Groupe C : Procès-verbaux & Infractions */}
                        {matchingPvs.length > 0 && (
                          <div>
                            <div style={{ padding: '6px 16px', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Procès-verbaux & Infractions ({matchingPvs.length})
                            </div>
                            {matchingPvs.map((pv) => (
                              <div
                                key={pv.id}
                                onClick={() => {
                                  onSelectTab('documents');
                                  setIsSearchOpen(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '12px',
                                  padding: '10px 16px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--color-border-subtle)',
                                  transition: 'background var(--transition-fast)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-accent)', flexShrink: 0 }}>
                                  <FolderOpen size={14} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    {pv.infractions[0] || pv.objet}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                    Droits éludés : {pv.droitsEludesUSD.toLocaleString()} USD • Amende légale : {pv.amendeUSD.toLocaleString()} USD
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                                    Verbalisé le {formatDate(pv.datePv)} • {pv.destinationContentieuse || 'Relais GLEC'}
                                  </div>
                                </div>
                                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                  PV
                                </span>
                              </div>
                            ))}
                          </div>
                        )}



                        {/* Groupe E : Autres dossiers d'enquête */}
                        {matchingOtherDossiers.length > 0 && (
                          <div>
                            <div style={{ padding: '6px 16px', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Autres dossiers d'enquête ({matchingOtherDossiers.length})
                            </div>
                            {matchingOtherDossiers.map((other) => (
                              <div
                                key={other.id}
                                onClick={() => {
                                  onSelectDossier?.(other.id);
                                  setIsSearchOpen(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '12px',
                                  padding: '10px 16px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--color-border-subtle)',
                                  transition: 'background var(--transition-fast)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-accent)', flexShrink: 0 }}>
                                  <Building size={14} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    {other.entiteControlee.nom}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                    {other.objet}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                                    Réf : {other.reference} • NIF : {other.entiteControlee.nif}
                                  </div>
                                </div>
                                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                  Ouvrir
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Date d'ouverture et date d'échéance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, flexWrap: 'wrap', margin: '8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
          <span>Ouvert le : <strong style={{ color: 'var(--color-text-secondary)' }}>{formatDate(dossier.horodatageCreation || dossier.dateCreation, true)}</strong></span>
        </div>
        <span style={{ color: 'var(--color-border)' }}>•</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
          <span>Échéance : <strong style={{ color: 'var(--color-text-secondary)' }}>{formatDate(dossier.echeance)}</strong></span>
        </div>
      </div>
      {/* Ergonomic Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          maxWidth: '100%',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          whiteSpace: 'nowrap',
        }}
      >
        {tabs.map((tab) => {
          if (!tab.visible) {
            return null;
          }
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: tab.visible ? 'flex' : 'none',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: isActive ? 'var(--color-bg)' : 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? '3px solid var(--color-accent)'
                  : '3px solid transparent',
                borderRadius: '8px 8px 0 0',
                color: isActive
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '10px',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all var(--transition-fast)',
              }}
            >
              {/* <span
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {tab.icon}
              </span> */}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
