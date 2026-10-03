import React, { useState } from 'react';
import {
  Search,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { DossierEnquete, UserAccount } from '../types';
import { TablePagination } from './common/TablePagination';
import { isAssignedToUser } from '../utils/userUtils';
import { formatDate } from '../utils/dateUtils';
import type { ApiWorkItem, ApiValidationItem } from '../api/client';
import type { WorkspaceData } from '../api/workspace';

interface MonTravailViewProps {
  dossiers: DossierEnquete[];
  onOpenDossier: (dossierId: string, tab?: any) => void;
  onCreateDossier?: (newDossier: any) => void;
  user: UserAccount;
  workspace?: WorkspaceData;
  workItems?: ApiWorkItem[];
  validationItems?: ApiValidationItem[];
}

export const MonTravailView: React.FC<MonTravailViewProps> = ({
  dossiers,
  onOpenDossier,
  user,
  workspace,
  workItems,
  validationItems,
}) => {
  const [mainTab, setMainTab] = useState<'dossiers' | 'workItems' | 'validations'>('dossiers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<'TOUS' | 'EN_COURS' | 'EN_ATTENTE' | 'A_VALIDER'>('TOUS');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const actualWorkItems = workItems || workspace?.workItems || [];
  const actualValidationItems = validationItems || workspace?.validationItems || [];

  // Filtrage strict : l'enquêteur ne voit que les dossiers qui lui sont personnellement assignés
  const visibleDossiers = dossiers.filter((d) => isAssignedToUser(d.responsable, d.equipe, user));

  // Filter dossiers
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. Header Minimaliste */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Mon Travail
            </h1>
          </div>
        </div>

        {/* Vues de suivi par pilules */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={mainTab === 'dossiers' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMainTab('dossiers')}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            <span>Dossiers d’Enquête</span>
            <span style={{ fontSize: '10px', fontWeight: 700, marginLeft: '6px', opacity: 0.9 }}>
              {visibleDossiers.length}
            </span>
          </button>

          <button
            type="button"
            className={mainTab === 'workItems' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMainTab('workItems')}
            style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Actions & Tâches requises</span>
            <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.9 }}>
              {actualWorkItems.length}
            </span>
          </button>

          <button
            type="button"
            className={mainTab === 'validations' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMainTab('validations')}
            style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Validations hiérarchiques</span>
            <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.9 }}>
              {actualValidationItems.length}
            </span>
          </button>
        </div>
      </div>

      {/* VUE 1 : DOSSIERS D'ENQUÊTE */}
      {mainTab === 'dossiers' && (
        <>
          {/* Controls: Search input & Status Filter Buttons */}
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
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
              <Search size={15} color="var(--color-text-muted)" />
              <input
                type="text"
                placeholder="Filtrer par référence, opérateur, NIF, objet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

            {/* Zen Smart Chips (Vues rapides par pilules) */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {(['TOUS', 'EN_COURS', 'EN_ATTENTE', 'A_VALIDER'] as const).map((s) => {
                const isActive = statutFilter === s;
                const labels: Record<string, string> = {
                  TOUS: 'Tous les dossiers',
                  EN_COURS: 'En cours',
                  EN_ATTENTE: 'En attente',
                  A_VALIDER: 'À valider',
                };
                const count = s === 'TOUS' ? visibleDossiers.length : visibleDossiers.filter((d) => d.statut === s).length;

                return (
                  <button
                    key={s}
                    onClick={() => setStatutFilter(s)}
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
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        opacity: isActive ? 0.9 : 0.6,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimalist Dossier Table */}
          <div
            className="responsive-table-container"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
                  <th style={{ padding: '12px 16px', width: '250px' }}>Opérateur </th>
                  <th style={{ padding: '12px 16px', width: '110px' }}>Statut</th>
                  <th style={{ padding: '12px 16px', width: '220px' }}>Date</th>
                  <th style={{ padding: '12px 16px', width: '110px' }}>Échéance</th>
                </tr>
              </thead>
              <tbody>
                {filteredDossiers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Aucun dossier ne correspond à votre filtre.
                    </td>
                  </tr>
                ) : (
                  filteredDossiers
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((dossier) => {
                      return (
                        <tr
                          key={dossier.id}
                          onClick={() => onOpenDossier(dossier.id)}
                          className="card-interactive"
                          style={{
                            borderBottom: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            transition: 'background var(--transition-fast)',
                          }}
                        >
                          {/* Operator Name*/}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                              {dossier.entiteControlee.nom}
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              {dossier.statut === 'EN_COURS'
                                ? 'En cours'
                                : dossier.statut === 'A_VALIDER'
                                ? 'À valider'
                                : dossier.statut === 'EN_ATTENTE'
                                ? 'En attente'
                                : 'Clôturé'}
                            </span>
                          </td>

                          {/* Ref & Horodatage */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              <Clock size={11} />
                              <span className="font-sf">{dossier.horodatageCreation || dossier.dateCreation}</span>
                            </div>
                          </td>

                          {/* Deadline */}
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                              {dossier.echeance}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>

            {/* Pagination discrète */}
            <TablePagination
              currentPage={currentPage}
              totalItems={filteredDossiers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="dossiers"
            />
          </div>
        </>
      )}

      {/* VUE 2 : ACTIONS & TÂCHES REQUISES (WORK ITEMS) */}
      {mainTab === 'workItems' && (
        <div
          className="responsive-table-container"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
                <th style={{ padding: '12px 16px' }}>Dossier concerné</th>
                <th style={{ padding: '12px 16px' }}>Action requise</th>
                <th style={{ padding: '12px 16px', width: '130px' }}>Statut</th>
                <th style={{ padding: '12px 16px', width: '130px' }}>Échéance</th>
                <th style={{ padding: '12px 16px', width: '140px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {actualWorkItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Aucune action urgente en attente. Tout est à jour dans votre file de travail.
                  </td>
                </tr>
              ) : (
                actualWorkItems.map((item) => {
                  const targetDossier = dossiers.find((d) => d.id === item.case);
                  return (
                    <tr
                      key={item.id}
                      className="card-interactive"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {targetDossier ? targetDossier.entiteControlee.nom : item.reference || item.case}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Réf. {item.reference || item.case}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                          {item.next_action || item.kind}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: item.overdue ? 'var(--color-surface-elevated)' : 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            color: item.overdue ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                          }}
                        >
                          {item.overdue ? 'En retard' : item.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {item.due_on ? formatDate(item.due_on) : 'Immédiat'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => onOpenDossier(item.case)}
                          style={{ fontSize: '11px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <span>Traiter</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VUE 3 : VALIDATIONS HIÉRARCHIQUES */}
      {mainTab === 'validations' && (
        <div
          className="responsive-table-container"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
                <th style={{ padding: '12px 16px' }}>Dossier soumis pour validation</th>
                <th style={{ padding: '12px 16px', width: '160px' }}>Statut de validation</th>
                <th style={{ padding: '12px 16px', width: '140px' }}>Échéance légale</th>
                <th style={{ padding: '12px 16px', width: '160px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {actualValidationItems.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Aucun acte en attente de visa hiérarchique.
                  </td>
                </tr>
              ) : (
                actualValidationItems.map((val) => {
                  const targetDossier = dossiers.find((d) => d.id === val.case);
                  return (
                    <tr
                      key={val.id}
                      className="card-interactive"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {targetDossier ? targetDossier.entiteControlee.nom : val.case}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Dossier Réf : {targetDossier?.reference || val.case}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--color-surface-elevated)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {val.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {val.due_on ? formatDate(val.due_on) : 'Non fixé'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => onOpenDossier(val.case)}
                          style={{ fontSize: '11px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <span>Examiner</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
