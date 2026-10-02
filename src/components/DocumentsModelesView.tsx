import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye
} from 'lucide-react';
import {
  fetchDocumentTemplates,
  approveDocumentTemplate,
  downloadDocumentTemplate,
  type ApiDocumentTemplate
} from '../api/client';

export const DocumentsModelesView: React.FC = () => {
  const [templates, setTemplates] = useState<ApiDocumentTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filterState, setFilterState] = useState<'all' | 'approved' | 'fictif'>('all');
  const [search, setSearch] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string>('');

  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDocumentTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger le référentiel des modèles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const handleApprove = async (templateId: string) => {
    setActionLoading(templateId);
    setError('');
    setSuccessInfo('');
    try {
      const updated = await approveDocumentTemplate(templateId);
      setTemplates((prev) => prev.map((t) => (t.id === templateId ? updated : t)));
      setSuccessInfo(`Le modèle ${updated.code} (${updated.version}) a été officiellement approuvé.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'approbation du modèle.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (template: ApiDocumentTemplate) => {
    setActionLoading(`dl-${template.id}`);
    setError('');
    try {
      const filename = template.file_name || `${template.code}_${template.version}.pdf`;
      await downloadDocumentTemplate(template.id, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléchargement du fichier modèle.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (filterState === 'approved' && t.state !== 'approved') return false;
      if (filterState === 'fictif' && t.state !== 'fictif') return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          t.code.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [templates, filterState, search]);

  const approvedCount = useMemo(() => templates.filter((t) => t.state === 'approved').length, [templates]);
  const fictifCount = useMemo(() => templates.filter((t) => t.state === 'fictif').length, [templates]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Header */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          border: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={22} color="var(--color-accent)" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                Référentiel des Modèles Documentaires et Actes Types
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>
              Gestion des versions, homologation officielle DGDA et téléchargement des matrices d’actes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadTemplates()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-btn)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* 3 Metric Cards distinguishing approved and fictitious models */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '4px' }}>
          <div
            onClick={() => setFilterState('all')}
            style={{
              backgroundColor: filterState === 'all' ? 'var(--color-surface-elevated)' : 'var(--color-bg)',
              borderRadius: 'var(--radius-card)',
              padding: '16px',
              border: filterState === 'all' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
              Tous les Modèles
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {templates.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Référencés au catalogue DGDA
            </div>
          </div>

          <div
            onClick={() => setFilterState('approved')}
            style={{
              backgroundColor: filterState === 'approved' ? 'var(--color-surface-elevated)' : 'var(--color-bg)',
              borderRadius: 'var(--radius-card)',
              padding: '16px',
              border: filterState === 'approved' ? '2px solid #22c55e' : '1px solid var(--color-border)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#22c55e', letterSpacing: '0.5px' }}>
                Modèles Approuvés
              </span>
              <CheckCircle2 size={15} color="#22c55e" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>
              {approvedCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Normes officielles en vigueur
            </div>
          </div>

          <div
            onClick={() => setFilterState('fictif')}
            style={{
              backgroundColor: filterState === 'fictif' ? 'var(--color-surface-elevated)' : 'var(--color-bg)',
              borderRadius: 'var(--radius-card)',
              padding: '16px',
              border: filterState === 'fictif' ? '2px solid #f59e0b' : '1px solid var(--color-border)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '0.5px' }}>
                Modèles Fictifs / Maquettes
              </span>
              <AlertTriangle size={15} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
              {fictifCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Exercice & maquettes sans valeur légale
            </div>
          </div>
        </div>

        {/* Search bar & filter pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-bg)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-btn)',
              border: '1px solid var(--color-border)',
              flex: 1,
              minWidth: '240px',
            }}
          >
            <Search size={14} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Rechercher par code, intitulé, périmètre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setFilterState('all')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-btn)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                backgroundColor: filterState === 'all' ? 'var(--color-accent)' : 'transparent',
                color: filterState === 'all' ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              Tous ({templates.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterState('approved')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-btn)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                backgroundColor: filterState === 'approved' ? '#22c55e' : 'transparent',
                color: filterState === 'approved' ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              Approuvés ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterState('fictif')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-btn)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                backgroundColor: filterState === 'fictif' ? '#f59e0b' : 'transparent',
                color: filterState === 'fictif' ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              Fictifs / Maquettes ({fictifCount})
            </button>
          </div>
        </div>

        {successInfo && (
          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-btn)', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '12px', fontWeight: 600 }}>
            {successInfo}
          </div>
        )}
        {error && (
          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-btn)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>

      {/* Templates Table List */}
      <div className="responsive-table-container" style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '12px 16px', width: '140px' }}>Code Modèle</th>
              <th style={{ padding: '12px 16px' }}>Intitulé & Périmètre</th>
              <th style={{ padding: '12px 16px', width: '90px' }}>Version</th>
              <th style={{ padding: '12px 16px', width: '150px' }}>Statut Métier</th>
              <th style={{ padding: '12px 16px', width: '180px' }}>Homologation</th>
              <th style={{ padding: '12px 16px', width: '180px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Chargement du référentiel des modèles documentaires...
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucun modèle documentaire ne correspond aux critères sélectionnés.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((item) => {
                const isExpanded = expandedId === item.id;
                const isApproved = item.state === 'approved';
                return (
                  <React.Fragment key={item.id}>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: isExpanded ? 'var(--color-surface-elevated)' : 'transparent',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{item.code}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Périmètre : <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{item.category}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'var(--color-surface-muted)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          v{item.version}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isApproved ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: 'rgba(34, 197, 94, 0.12)',
                              color: '#22c55e',
                            }}
                          >
                            <CheckCircle2 size={12} />
                            Approuvé DGDA
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              color: '#f59e0b',
                            }}
                          >
                            <AlertTriangle size={12} />
                            Modèle Fictif
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                        {isApproved ? (
                          <div>
                            <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                              {item.effective_date ? `En vigueur le ${item.effective_date}` : 'Approuvé'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              {item.approved_by_name ? `Validé par ${item.approved_by_name}` : 'Validation DGDA'}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            Non homologué
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            title="Voir la structure et les mentions"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-btn)',
                              border: '1px solid var(--color-border)',
                              backgroundColor: 'transparent',
                              color: 'var(--color-text-secondary)',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={13} />
                            <span>{isExpanded ? 'Fermer' : 'Aperçu'}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>

                          {!isApproved && (
                            <button
                              type="button"
                              disabled={actionLoading === item.id}
                              onClick={() => void handleApprove(item.id)}
                              title="Approuver officiellement ce modèle"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-btn)',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: actionLoading === item.id ? 'wait' : 'pointer',
                              }}
                            >
                              <Check size={12} />
                              <span>{actionLoading === item.id ? '...' : 'Approuver'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionLoading === `dl-${item.id}`}
                            onClick={() => void handleDownload(item)}
                            title="Télécharger le modèle au format PDF"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-btn)',
                              border: 'none',
                              backgroundColor: 'var(--color-accent)',
                              color: '#fff',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: actionLoading === `dl-${item.id}` ? 'wait' : 'pointer',
                            }}
                          >
                            <Download size={13} />
                            <span>{actionLoading === `dl-${item.id}` ? '...' : 'Télécharger'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Preview Section */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: 'var(--color-surface-elevated)', borderBottom: '1px solid var(--color-border)' }}>
                        <td colSpan={6} style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                Description et objectif du modèle :
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                Fichier généré : {item.file_name || `${item.code}_${item.version}.pdf`}
                              </span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                              {item.description || "Aucune description n'a été spécifiée."}
                            </p>

                            <div style={{ marginTop: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Structure & Mentions types :
                              </span>
                              <pre
                                style={{
                                  marginTop: '6px',
                                  padding: '12px',
                                  borderRadius: 'var(--radius-card)',
                                  backgroundColor: 'var(--color-bg)',
                                  color: 'var(--color-text-primary)',
                                  fontSize: '11px',
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  border: '1px solid var(--color-border)',
                                }}
                              >
                                {item.content || 'Modèle conforme aux ordonnances douanières DGDA.'}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentsModelesView;
