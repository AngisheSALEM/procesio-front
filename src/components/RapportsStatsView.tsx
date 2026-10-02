import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Building2,
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type {
  DossierEnquete,
  DemandeCommunication,
  FeuilleObservation,
  PvDetail,
  RenseignementItem,
} from '../types';
import type { DossierTabId } from './DossierHeader';
import { fetchStatistics, type ApiStatistics, type ApiUser } from '../api/client';
import { SupervisionOverviewTab } from './supervision/SupervisionOverviewTab';
import { SupervisionDossiersView } from './supervision/SupervisionDossiersView';
import { SupervisionDemandesView } from './supervision/SupervisionDemandesView';
import { SupervisionFeuillesView } from './supervision/SupervisionFeuillesView';
import { SupervisionClassementsView } from './supervision/SupervisionClassementsView';
import { SupervisionPvView } from './supervision/SupervisionPvView';
import { SupervisionRenseignementsView } from './supervision/SupervisionRenseignementsView';

export type SupervisionTabId =
  | 'overview'
  | 'dossiers'
  | 'demandes'
  | 'feuilles'
  | 'classements'
  | 'pv'
  | 'renseignements';

interface RapportsStatsViewProps {
  onOpenDossier: (dossierId?: string, tab?: DossierTabId) => void;
  dossiers?: DossierEnquete[];
  demandesParDossier?: Record<string, DemandeCommunication[]>;
  feuillesParDossier?: Record<string, FeuilleObservation[]>;
  pvsParDossier?: Record<string, PvDetail[]>;
  renseignements?: RenseignementItem[];
  statistics?: ApiStatistics | null;
  me?: ApiUser | null;
}

export const RapportsStatsView: React.FC<RapportsStatsViewProps> = ({
  onOpenDossier,
  dossiers = [],
  demandesParDossier = {},
  feuillesParDossier = {},
  pvsParDossier = {},
  renseignements = [],
  statistics: initialStatistics,
  me,
}) => {
  const [activeTab, setActiveTab] = useState<SupervisionTabId>('overview');

  // Extract units from active memberships
  const availableUnits = useMemo(() => {
    const list = (me?.memberships || [])
      .filter((m) => m.role === 'manager' || m.role === 'investigator')
      .map((m) => m.unit);
    const seen = new Set<string>();
    return list.filter((u) => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }, [me]);

  const [selectedUnit, setSelectedUnit] = useState<string>(() => {
    return initialStatistics?.unit || availableUnits[0]?.id || '';
  });

  // Keep selectedUnit synchronized if memberships load after initial mount
  useEffect(() => {
    if (!selectedUnit && availableUnits.length > 0) {
      setSelectedUnit(availableUnits[0].id);
    }
  }, [availableUnits, selectedUnit]);

  // Period management
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [periodPreset, setPeriodPreset] = useState<'year' | '30d' | '90d' | 'custom'>('year');
  const [customStart, setCustomStart] = useState<string>(`${new Date().getFullYear()}-01-01`);
  const [customEnd, setCustomEnd] = useState<string>(todayIso);

  const { startDate, endDate } = useMemo(() => {
    if (periodPreset === 'custom') {
      return { startDate: customStart, endDate: customEnd };
    }
    const end = todayIso;
    const now = new Date();
    if (periodPreset === '30d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { startDate: d.toISOString().slice(0, 10), endDate: end };
    }
    if (periodPreset === '90d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return { startDate: d.toISOString().slice(0, 10), endDate: end };
    }
    // Default: Exercice annuel en cours
    return { startDate: `${now.getFullYear()}-01-01`, endDate: end };
  }, [periodPreset, customStart, customEnd, todayIso]);

  const [currentStatistics, setCurrentStatistics] = useState<ApiStatistics | null>(initialStatistics || null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>('');

  const loadStats = useCallback(async () => {
    if (!selectedUnit || !startDate || !endDate) return;
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchStatistics(selectedUnit, startDate, endDate);
      setCurrentStatistics(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erreur de chargement des statistiques.');
    } finally {
      setLoading(false);
    }
  }, [selectedUnit, startDate, endDate]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const currentUnitObj = availableUnits.find((u) => u.id === selectedUnit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner with Selectors */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          padding: '18px 24px',
          border: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  Statistiques & Supervision DGDA
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Définitions officielles, synchronisation backend et traçabilité auditée
                </div>
              </div>
            </div>
          </div>

          {/* Selectors Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Unit Selector */}
            {availableUnits.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--color-surface-muted)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-btn)',
                  fontSize: '12px',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <Building2 size={14} color="var(--color-text-muted)" />
                <label htmlFor="unit-select" style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Unité :
                </label>
                <select
                  id="unit-select"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Period Preset Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--color-surface-muted)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-btn)',
                fontSize: '12px',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <Calendar size={14} color="var(--color-text-muted)" />
              <label htmlFor="period-select" style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Période :
              </label>
              <select
                id="period-select"
                value={periodPreset}
                onChange={(e) => setPeriodPreset(e.target.value as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="year">Exercice {new Date().getFullYear()} (Annuel)</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">90 derniers jours</option>
                <option value="custom">Période personnalisée...</option>
              </select>
            </div>

            {/* Custom Date Inputs if custom period */}
            {periodPreset === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-btn)',
                    padding: '5px 10px',
                    fontSize: '12px',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                  aria-label="Date de début"
                />
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>au</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={todayIso}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-btn)',
                    padding: '5px 10px',
                    fontSize: '12px',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                  aria-label="Date de fin"
                />
              </div>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => void loadStats()}
              disabled={loading}
              title="Actualiser les indicateurs"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-btn)',
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>{loading ? 'Chargement...' : 'Actualiser'}</span>
            </button>
          </div>
        </div>

        {/* Status / Scope metadata ribbon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
          }}
        >
          <div>
            Périmètre d'observation : <strong style={{ color: 'var(--color-text-primary)' }}>{currentUnitObj?.name || 'Toutes unités'}</strong> · Du{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{startDate}</strong> au{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{endDate}</strong>
          </div>
          <div>
            Règles de décompte : <strong>Prototype DGDA ({currentStatistics?.definition_version || 'prototype-1'})</strong>
          </div>
        </div>

        {loadError && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-danger, #ef4444)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{loadError}</span>
          </div>
        )}
      </div>

      {/* Active Tab View Rendering */}
      <div key={activeTab} className="view-transition">
        {activeTab === 'overview' && (
          <SupervisionOverviewTab
            onNavigateSubView={(viewId) => setActiveTab(viewId)}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            dossiers={dossiers}
            renseignements={renseignements}
            demandes={demandesParDossier}
            feuilles={feuillesParDossier}
            pvs={pvsParDossier}
            statistics={currentStatistics}
          />
        )}

        {activeTab === 'dossiers' && (
          <SupervisionDossiersView
            dossiers={dossiers}
            demandes={demandesParDossier}
            feuilles={feuillesParDossier}
            pvs={pvsParDossier}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'demandes' && (
          <SupervisionDemandesView
            demandes={demandesParDossier}
            dossiers={dossiers}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
            unit={selectedUnit}
            start={startDate}
            end={endDate}
          />
        )}

        {activeTab === 'feuilles' && (
          <SupervisionFeuillesView
            feuilles={feuillesParDossier}
            dossiers={dossiers}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
            unit={selectedUnit}
            start={startDate}
            end={endDate}
          />
        )}

        {activeTab === 'classements' && (
          <SupervisionClassementsView
            dossiers={dossiers}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
            unit={selectedUnit}
            start={startDate}
            end={endDate}
          />
        )}

        {activeTab === 'pv' && (
          <SupervisionPvView
            pvs={pvsParDossier}
            dossiers={dossiers}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
            unit={selectedUnit}
            start={startDate}
            end={endDate}
          />
        )}

        {activeTab === 'renseignements' && (
          <SupervisionRenseignementsView
            renseignements={renseignements}
            dossiers={dossiers}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
            unit={selectedUnit}
            start={startDate}
            end={endDate}
          />
        )}
      </div>
    </div>
  );
};

export default RapportsStatsView;
