import React, { useState } from 'react';
import {
  Search,
  Clock,
  FileText,
  AlertCircle,
  ExternalLink,
  Inbox,
  CheckSquare,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import type { DossierEnquete, UserAccount } from '../types';
import type { DossierTabId } from './DossierHeader';
import { TablePagination } from './common/TablePagination';
import type { ApiWorkItem, ApiValidationItem } from '../api/client';

interface MonTravailViewProps {
  dossiers: DossierEnquete[];
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  onCreateDossier?: (newDossier: any) => void;
  user: UserAccount;
  workItems?: ApiWorkItem[];
  validationItems?: ApiValidationItem[];
}

type MainTab = 'dossiers' | 'demandes' | 'decisions' | 'a-valider';

export const MonTravailView: React.FC<MonTravailViewProps> = ({
  dossiers,
  onOpenDossier,
  user,
  workItems = [],
  validationItems = [],
}) => {
  const [activeTab, setActiveTab] = useState<MainTab>('dossiers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<'TOUS' | 'OUVERT' | 'EN_COURS' | 'EN_ATTENTE' | 'A_VALIDER'>('TOUS');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Le serveur applique déjà les droits et renvoie les dossiers nécessitant une action.
  const workCaseIds = new Set(workItems.map((item) => item.case));
  const visibleDossiers = user.role === 'director' ? dossiers : dossiers.filter((d) => workCaseIds.has(d.id));

  // Partition des workItems
  const requestWorkItems = workItems.filter((i) => i.kind === 'request');
  const decisionWorkItems = workItems.filter((i) => i.kind === 'decision');

  // Résolution d'un dossier par son ID
  const getDossier = (caseId: string): DossierEnquete | undefined => {
    return dossiers.find((d) => d.id === caseId || d.reference === caseId);
  };

  // Filtrage des dossiers
  const filteredDossiers = visibleDossiers.filter((d) => {
    const matchesSearch =
      d.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.entiteControlee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.entiteControlee.nif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.objet.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statutFilter === 'TOUS') return true;
    return d.statut === statutFilter;
  });

  // Filtrage des demandes à traiter
  const filteredRequests = requestWorkItems.filter((item) => {
    const dossier = getDossier(item.case);
    const text = `${dossier?.reference || ''} ${dossier?.entiteControlee.nom || ''} ${item.status || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  // Filtrage des décisions en cours
  const filteredDecisions = decisionWorkItems.filter((item) => {
    const dossier = getDossier(item.case);
    const text = `${dossier?.reference || ''} ${dossier?.entiteControlee.nom || ''} ${item.status || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  // Filtrage de la file à valider
  const filteredValidations = validationItems.filter((item) => {
    const dossier = getDossier(item.case);
    const text = `${dossier?.reference || ''} ${dossier?.entiteControlee.nom || ''} ${item.status || ''} ${item.action_url || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const getValidationTypeLabel = (actionUrl: string): { label: string; tab: DossierTabId } => {
    if (actionUrl.includes('demandes')) return { label: 'Demande de communication', tab: 'actions-echanges' };
    if (actionUrl.includes('feuilles')) return { label: 'Feuille d’observation', tab: 'constats-defense' };
    if (actionUrl.includes('decisions')) return { label: 'Décision de clôture', tab: 'vue-ensemble' };
    return { label: 'Acte procédural', tab: 'vue-ensemble' };
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('DRAFT') || s.includes('BROUILLON')) return { label: 'Brouillon', bg: 'var(--color-bg)', color: 'var(--color-text-secondary)' };
    if (s.includes('SUBMITTED') || s.includes('VALIDER') || s.includes('PROPOSED')) return { label: 'À valider', bg: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04' };
    if (s.includes('ISSUED') || s.includes('EMISE')) return { label: 'Émise', bg: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' };
    if (s.includes('RETURNED') || s.includes('RETOUR')) return { label: 'Retournée', bg: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' };
    if (s.includes('CONFIRMED') || s.includes('TERMINE') || s.includes('VALIDATED')) return { label: 'Validée', bg: 'rgba(34, 197, 94, 0.15)', color: '#16a34a' };
    return { label: status, bg: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. Header Minimaliste */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              Mon Travail Quotidien
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            Accédez directement à vos dossiers en cours, actes à instruire et actes soumis à validation hiérarchique.
          </p>
        </div>
      </div>

      {/* 2. Onglets principaux : Dossiers, Demandes, Décisions, À valider */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('dossiers'); setCurrentPage(1); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-btn)',
            backgroundColor: activeTab === 'dossiers' ? 'var(--color-accent)' : 'transparent',
            color: activeTab === 'dossiers' ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'dossiers' ? 700 : 500,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <FolderOpen size={16} />
          <span>Mes dossiers d’enquête</span>
          <span style={{ fontSize: '11px', opacity: 0.8, backgroundColor: 'rgba(0,0,0,0.15)', padding: '1px 6px', borderRadius: '10px' }}>
            {visibleDossiers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('demandes'); setCurrentPage(1); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-btn)',
            backgroundColor: activeTab === 'demandes' ? 'var(--color-accent)' : 'transparent',
            color: activeTab === 'demandes' ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'demandes' ? 700 : 500,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <FileText size={16} />
          <span>Demandes à traiter</span>
          <span style={{ fontSize: '11px', opacity: 0.8, backgroundColor: 'rgba(0,0,0,0.15)', padding: '1px 6px', borderRadius: '10px' }}>
            {requestWorkItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('decisions'); setCurrentPage(1); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-btn)',
            backgroundColor: activeTab === 'decisions' ? 'var(--color-accent)' : 'transparent',
            color: activeTab === 'decisions' ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'decisions' ? 700 : 500,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <CheckSquare size={16} />
          <span>Décisions en cours</span>
          <span style={{ fontSize: '11px', opacity: 0.8, backgroundColor: 'rgba(0,0,0,0.15)', padding: '1px 6px', borderRadius: '10px' }}>
            {decisionWorkItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('a-valider'); setCurrentPage(1); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-btn)',
            backgroundColor: activeTab === 'a-valider' ? 'var(--color-accent)' : 'transparent',
            color: activeTab === 'a-valider' ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'a-valider' ? 700 : 500,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Inbox size={16} />
          <span>File « À valider »</span>
          {validationItems.length > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              backgroundColor: activeTab === 'a-valider' ? '#fff' : '#ef4444',
              color: activeTab === 'a-valider' ? '#b91c1c' : '#fff',
              padding: '1px 7px',
              borderRadius: '10px',
            }}>
              {validationItems.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. Contrôles de recherche et filtres */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--color-surface)',
          padding: '10px 14px',
          borderRadius: '12px',
        }}
      >
        {/* Champ de recherche */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={15} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder={
              activeTab === 'dossiers'
                ? "Filtrer par référence, opérateur, NIF, objet..."
                : "Filtrer les actes de travail..."
            }
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Pilules de statut spécifiques au premier onglet (Dossiers) */}
        {activeTab === 'dossiers' && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            {(['TOUS', 'OUVERT', 'EN_COURS', 'EN_ATTENTE', 'A_VALIDER'] as const).map((s) => {
              const isActive = statutFilter === s;
              const labels: Record<string, string> = {
                TOUS: 'Tous les dossiers',
                OUVERT: 'Ouvert',
                EN_COURS: 'En cours',
                EN_ATTENTE: 'En attente',
                A_VALIDER: 'À valider',
              };
              const count = s === 'TOUS' ? visibleDossiers.length : visibleDossiers.filter((d) => d.statut === s).length;

              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setStatutFilter(s); setCurrentPage(1); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-surface-elevated)',
                    color: isActive ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
                    fontSize: '11px',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span>{labels[s]}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, opacity: isActive ? 0.9 : 0.6 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Tableaux interactifs selon l'onglet actif */}

      {/* --- ONGLET 1 : DOSSIERS D'ENQUÊTE --- */}
      {activeTab === 'dossiers' && (
        <div
          className="responsive-table-container"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                }}
              >
                <th style={{ padding: '12px 16px', width: '220px' }}>Opérateur & Réf.</th>
                <th style={{ padding: '12px 16px', width: '110px' }}>Statut</th>
                <th style={{ padding: '12px 16px' }}>Prochaine action attendue</th>
                <th style={{ padding: '12px 16px', width: '140px' }}>Date</th>
                <th style={{ padding: '12px 16px', width: '110px' }}>Échéance</th>
              </tr>
            </thead>
            <tbody>
              {filteredDossiers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Aucun dossier ne correspond à votre filtre.
                  </td>
                </tr>
              ) : (
                filteredDossiers
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((dossier) => {
                    const badge = getStatusBadge(dossier.statut);
                    return (
                      <tr
                        key={dossier.id}
                        onClick={() => onOpenDossier(dossier.id, 'vue-ensemble')}
                        className="card-interactive"
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {dossier.entiteControlee.nom || dossier.objet || dossier.reference}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {dossier.reference} • NIF : {dossier.entiteControlee.nif || 'Non renseigné'}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}>
                            {dossier.decisionCloture === 'CLASSE_SANS_SUITE' ? 'Classé sans suite' : badge.label}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            {dossier.prochaineAction || 'Aucune action planifiée'}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            <Clock size={11} />
                            <span className="font-sf">{dossier.horodatageCreation || dossier.dateCreation}</span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            {dossier.echeance || '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredDossiers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="dossiers"
          />
        </div>
      )}

      {/* --- ONGLET 2 : DEMANDES À TRAITER --- */}
      {activeTab === 'demandes' && (
        <div
          className="responsive-table-container"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                }}
              >
                <th style={{ padding: '12px 16px', width: '260px' }}>Dossier & Opérateur</th>
                <th style={{ padding: '12px 16px', width: '130px' }}>Statut de la demande</th>
                <th style={{ padding: '12px 16px', width: '140px' }}>Échéance & Alertes</th>
                <th style={{ padding: '12px 16px' }}>Action directe</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Aucune demande de communication en attente d’action.
                  </td>
                </tr>
              ) : (
                filteredRequests
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => {
                    const dossier = getDossier(item.case);
                    const badge = getStatusBadge(item.status);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => onOpenDossier(item.case, 'actions-echanges')}
                        className="card-interactive"
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {dossier ? dossier.entiteControlee.nom : `Dossier ${item.case.slice(0, 8)}`}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            Réf : {dossier?.reference || item.case}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}>
                            {badge.label}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                              {item.due_on || 'Non précisée'}
                            </span>
                            {item.overdue && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>
                                <AlertTriangle size={12} /> En retard
                              </span>
                            )}
                            {item.returned && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#ca8a04', fontWeight: 600 }}>
                                <AlertCircle size={12} /> Retournée pour correction
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDossier(item.case, 'actions-echanges');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-btn)',
                              backgroundColor: 'var(--color-surface-elevated)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-primary)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <span>Ouvrir la demande</span>
                            <ExternalLink size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredRequests.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="demandes"
          />
        </div>
      )}

      {/* --- ONGLET 3 : DÉCISIONS EN COURS --- */}
      {activeTab === 'decisions' && (
        <div
          className="responsive-table-container"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                }}
              >
                <th style={{ padding: '12px 16px', width: '260px' }}>Dossier & Opérateur</th>
                <th style={{ padding: '12px 16px', width: '140px' }}>Statut de la décision</th>
                <th style={{ padding: '12px 16px', width: '160px' }}>Remarques procédurales</th>
                <th style={{ padding: '12px 16px' }}>Action directe</th>
              </tr>
            </thead>
            <tbody>
              {filteredDecisions.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Aucune décision d’enquête nécessitant votre suivi.
                  </td>
                </tr>
              ) : (
                filteredDecisions
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => {
                    const dossier = getDossier(item.case);
                    const badge = getStatusBadge(item.status);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => onOpenDossier(item.case, 'vue-ensemble')}
                        className="card-interactive"
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {dossier ? dossier.entiteControlee.nom : `Dossier ${item.case.slice(0, 8)}`}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            Réf : {dossier?.reference || item.case}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}>
                            {badge.label}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          {item.returned ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>
                              <AlertCircle size={13} /> Retournée par la hiérarchie
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              En cours d’évaluation
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDossier(item.case, 'vue-ensemble');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-btn)',
                              backgroundColor: 'var(--color-surface-elevated)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-primary)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <span>Consulter la décision</span>
                            <ExternalLink size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredDecisions.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="décisions"
          />
        </div>
      )}

      {/* --- ONGLET 4 : FILE « À VALIDER » --- */}
      {activeTab === 'a-valider' && (
        <div
          className="responsive-table-container"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            overflowX: 'auto',
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              File d’attente des actes soumis à validation hiérarchique
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              En tant que responsable habilité, chaque acte ci-dessous requiert votre examen juridique et procédural avant émission ou notification.
            </div>
          </div>

          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                }}
              >
                <th style={{ padding: '12px 16px', width: '240px' }}>Dossier & Opérateur</th>
                <th style={{ padding: '12px 16px', width: '180px' }}>Type d’acte</th>
                <th style={{ padding: '12px 16px', width: '120px' }}>Statut</th>
                <th style={{ padding: '12px 16px', width: '130px' }}>Délai & Alerte</th>
                <th style={{ padding: '12px 16px' }}>Action requise</th>
              </tr>
            </thead>
            <tbody>
              {filteredValidations.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Aucun acte en attente de votre validation hiérarchique.
                  </td>
                </tr>
              ) : (
                filteredValidations
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => {
                    const dossier = getDossier(item.case);
                    const { label, tab } = getValidationTypeLabel(item.action_url);
                    const badge = getStatusBadge(item.status);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => onOpenDossier(item.case, tab)}
                        className="card-interactive"
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {dossier ? dossier.entiteControlee.nom : `Dossier ${item.case.slice(0, 8)}`}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            Réf : {dossier?.reference || item.case}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {label}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}>
                            {badge.label}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              {item.due_on || 'Sans échéance'}
                            </span>
                            {item.overdue && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>
                                <AlertTriangle size={12} /> Échéance dépassée
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDossier(item.case, tab);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              borderRadius: 'var(--radius-btn)',
                              backgroundColor: 'var(--color-accent)',
                              border: 'none',
                              color: 'var(--color-on-accent)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <span>Examiner & Valider</span>
                            <ExternalLink size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredValidations.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="validations"
          />
        </div>
      )}
    </div>
  );
};

export default MonTravailView;
