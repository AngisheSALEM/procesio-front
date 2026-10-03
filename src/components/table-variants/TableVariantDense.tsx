import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  AlertOctagon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Scale
} from 'lucide-react';
import type { EnqueteDataRow } from './types';
import type { TableDensity, TableSortConfig } from '../table-system/types';
import {
  TableContainer,
  TableToolbar,
  TableHeadCell,
  TableRow,
  TableCell,
  TableBadge,
  TableEmptyState,
  TablePaginationBar
} from '../table-system/TablePrimitives';

interface TableVariantDenseProps {
  data: EnqueteDataRow[];
  onSelectDossier?: (dossierId: string) => void;
}

export const TableVariantDense: React.FC<TableVariantDenseProps> = ({
  data,
  onSelectDossier,
}) => {
  const [density, setDensity] = useState<TableDensity>('compact');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<TableSortConfig>({
    key: 'valeurUSD',
    direction: 'desc',
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Sorting handler
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: '', direction: null };
    });
  };

  // Filtered and Sorted rows
  const processedRows = useMemo(() => {
    let result = data.filter((row) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        row.reference.toLowerCase().includes(q) ||
        row.operateur.toLowerCase().includes(q) ||
        row.nif.toLowerCase().includes(q) ||
        row.bureau.toLowerCase().includes(q) ||
        row.regime.toLowerCase().includes(q) ||
        row.inspecteur.toLowerCase().includes(q)
      );
    });

    if (sortConfig.key && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        const valA = (a as unknown as Record<string, unknown>)[sortConfig.key];
        const valB = (b as unknown as Record<string, unknown>)[sortConfig.key];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        return sortConfig.direction === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [data, search, sortConfig]);

  // Pagination slice
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedRows.slice(start, start + itemsPerPage);
  }, [processedRows, currentPage]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedRows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRows.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCopyRef = (ref: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ref);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getStatusBadge = (statut: EnqueteDataRow['statut']) => {
    switch (statut) {
      case 'CRITIQUE':
        return <TableBadge label="Critique" type="danger" icon={<AlertOctagon size={11} />} />;
      case 'CONTENTIEUX':
        return <TableBadge label="Contentieux" type="danger" icon={<Scale size={11} />} />;
      case 'EN_ATTENTE':
        return <TableBadge label="En attente" type="warning" icon={<Clock size={11} />} />;
      case 'EN_COURS':
        return <TableBadge label="En cours" type="info" icon={<AlertTriangle size={11} />} />;
      case 'CONFORME':
        return <TableBadge label="Conforme" type="success" icon={<CheckCircle2 size={11} />} />;
    }
  };

  return (
    <TableContainer>
      {/* 1. Header Toolbar */}
      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par référence, opérateur, NIF, bureau..."
        density={density}
        onDensityChange={setDensity}
        selectedCount={selectedIds.length}
        bulkActions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              onClick={() => alert(`Exportation de ${selectedIds.length} dossiers sélectionné(s)`)}
            >
              Exporter la sélection
            </button>
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: '11px' }}
              onClick={() => setSelectedIds([])}
            >
              Désélectionner
            </button>
          </div>
        }
      />

      {/* 2. Dense Grid Body */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                <input
                  type="checkbox"
                  checked={paginatedRows.length > 0 && selectedIds.length === paginatedRows.length}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                  aria-label="Tout sélectionner"
                />
              </th>
              <TableHeadCell
                sortable
                sortDirection={sortConfig.key === 'reference' ? sortConfig.direction : null}
                onSort={() => handleSort('reference')}
                width="20%"
              >
                Référence DGDA
              </TableHeadCell>
              <TableHeadCell
                sortable
                sortDirection={sortConfig.key === 'operateur' ? sortConfig.direction : null}
                onSort={() => handleSort('operateur')}
                width="24%"
              >
                Opérateur économique
              </TableHeadCell>
              <TableHeadCell
                sortable
                sortDirection={sortConfig.key === 'regime' ? sortConfig.direction : null}
                onSort={() => handleSort('regime')}
                width="14%"
              >
                Régime & Bureau
              </TableHeadCell>
              <TableHeadCell
                align="right"
                sortable
                sortDirection={sortConfig.key === 'valeurUSD' ? sortConfig.direction : null}
                onSort={() => handleSort('valeurUSD')}
                width="14%"
              >
                Valeur CIF (USD)
              </TableHeadCell>
              <TableHeadCell
                align="center"
                sortable
                sortDirection={sortConfig.key === 'tauxRisque' ? sortConfig.direction : null}
                onSort={() => handleSort('tauxRisque')}
                width="10%"
              >
                Score Risque
              </TableHeadCell>
              <TableHeadCell
                align="right"
                sortable
                sortDirection={sortConfig.key === 'statut' ? sortConfig.direction : null}
                onSort={() => handleSort('statut')}
                width="18%"
              >
                Statut & Échéance
              </TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <TableEmptyState onReset={() => setSearch('')} />
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const isSelected = selectedIds.includes(row.id);

                return (
                  <TableRow
                    key={row.id}
                    isSelected={isSelected}
                    onClick={() => onSelectDossier?.(row.id)}
                  >
                    {/* Checkbox */}
                    <TableCell density={density} style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectOne(row.id, e as unknown as React.MouseEvent)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                        aria-label={`Sélectionner ${row.reference}`}
                      />
                    </TableCell>

                    {/* Référence avec bouton copier : PAS DE COULEUR, PAS DE GRAS */}
                    <TableCell density={density}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="font-sf" style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '11px' }}>
                          {row.reference.replace('DGDA/DRK/DIR-ENQ/2026/', '.../')}
                        </span>
                        <button
                          type="button"
                          className="btn-ghost"
                          title="Copier la référence complète"
                          style={{ padding: '2px 4px', opacity: 0.7 }}
                          onClick={(e) => handleCopyRef(row.reference, row.id, e)}
                        >
                          {copiedId === row.id ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {row.inspecteur.replace('Insp. ', '')}
                      </div>
                    </TableCell>

                    {/* Opérateur : SEULE CHOSE EN GRAS */}
                    <TableCell density={density}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '13px',
                          color: 'var(--color-text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '280px',
                        }}
                        title={row.operateur}
                      >
                        {row.operateur}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        <span className="font-sf">NIF: {row.nif}</span>
                        <span>•</span>
                        <span>{row.marchandise}</span>
                      </div>
                    </TableCell>

                    {/* Régime & Bureau */}
                    <TableCell density={density}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {row.regime.split('—')[0]}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {row.bureau.split('(')[0]}
                      </div>
                    </TableCell>

                    {/* Valeur CIF (Tabular Numbers aligné à droite) */}
                    <TableCell density={density} align="right" isNumeric>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                        {row.valeurUSD.toLocaleString('fr-FR')} $
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        Fret inclus CIF
                      </div>
                    </TableCell>

                    {/* Risque */}
                    <TableCell density={density} align="center">
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor:
                            row.tauxRisque >= 80
                              ? 'var(--color-danger-surface)'
                              : row.tauxRisque >= 50
                              ? 'var(--color-warning-surface)'
                              : 'var(--color-success-surface)',
                          color:
                            row.tauxRisque >= 80
                              ? 'var(--color-danger)'
                              : row.tauxRisque >= 50
                              ? 'var(--color-warning)'
                              : 'var(--color-success)',
                        }}
                      >
                        {row.tauxRisque}%
                      </div>
                    </TableCell>

                    {/* Statut & Échéance */}
                    <TableCell density={density} align="right">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        {getStatusBadge(row.statut)}
                        <span
                          className="font-sf"
                          style={{
                            fontSize: '11px',
                            color: row.joursRestants <= 3 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                            fontWeight: row.joursRestants <= 3 ? 700 : 400,
                          }}
                        >
                          {row.joursRestants <= 0 ? 'Délai expiré' : `J-${row.joursRestants} (${row.echeance})`}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination & Metric Summary */}
      <TablePaginationBar
        totalItems={processedRows.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </TableContainer>
  );
};
