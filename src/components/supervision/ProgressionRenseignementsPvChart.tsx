import React, { useState, useMemo } from 'react';
import type { RenseignementItem, DossierEnquete, PvDetail, DemandeCommunication, FeuilleObservation } from '../../types';

interface ProgressionRenseignementsPvChartProps {
  renseignements: RenseignementItem[];
  dossiers: DossierEnquete[];
  pvs: Record<string, PvDetail[]>;
  demandes?: Record<string, DemandeCommunication[]>;
  feuilles?: Record<string, FeuilleObservation[]>;
}

type Period = '7j' | '30j' | '90j' | '1an';
type MetricType = 'renseignements' | 'demandes' | 'feuilles' | 'pvs';

interface DataPoint {
  label: string;
  fullDate: string;
  renseignements: number;
  demandes: number;
  feuilles: number;
  pvs: number;
}

export const ProgressionRenseignementsPvChart: React.FC<ProgressionRenseignementsPvChartProps> = ({
  renseignements,
  dossiers: _dossiers,
  pvs,
  demandes = {},
  feuilles = {},
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30j');
  const [activeMetric, setActiveMetric] = useState<MetricType>('renseignements');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const allPvs = useMemo(() => Object.values(pvs).flat(), [pvs]);
  const allDemandes = useMemo(() => Object.values(demandes).flat(), [demandes]);
  const allFeuilles = useMemo(() => Object.values(feuilles).flat(), [feuilles]);

  const totalR = renseignements.length;
  const totalD = allDemandes.length;
  const totalF = allFeuilles.length;
  const totalP = allPvs.length;

  // Les points reflètent les dates présentes dans les ressources, sans chiffres de démonstration.
  const dataPoints: DataPoint[] = useMemo(() => {
    const days = selectedPeriod === '7j' ? 7 : selectedPeriod === '30j' ? 30 : selectedPeriod === '90j' ? 90 : 365;
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    const pointCount = selectedPeriod === '7j' ? 7 : 5;
    const dates = Array.from({ length: pointCount }, (_, index) => {
      const point = new Date(start);
      point.setTime(start.getTime() + (today.getTime() - start.getTime()) * (index / (pointCount - 1)));
      return point;
    });
    const countUntil = (values: string[], point: Date) =>
      values.filter((raw) => {
        const date = new Date(raw);
        return !Number.isNaN(date.getTime()) && date >= start && date <= point;
      }).length;
    const renseignementsDates = renseignements.map((item) => item.dateReception);
    const demandesDates = allDemandes.map((item) => item.dateEmission || item.horodatage || '');
    const feuillesDates = allFeuilles.map((item) => item.dateRedaction);
    const pvsDates = allPvs.map((item) => item.datePv);
    return dates.map((date) => ({
      label: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      fullDate: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      renseignements: countUntil(renseignementsDates, date),
      demandes: countUntil(demandesDates, date),
      feuilles: countUntil(feuillesDates, date),
      pvs: countUntil(pvsDates, date),
    }));
  }, [selectedPeriod, renseignements, allDemandes, allFeuilles, allPvs]);

  // Dimensions
  const svgWidth = 800;
  const svgHeight = 150;
  const paddingX = 40;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Max value selon la métrique active
  const maxY = useMemo(() => {
    const maxVal = Math.max(...dataPoints.map((d) => d[activeMetric]), 1);
    return Math.max(maxVal * 1.25, 4);
  }, [dataPoints, activeMetric]);

  // Points calculés
  const points = useMemo(() => {
    const n = dataPoints.length;
    return dataPoints.map((d, index) => {
      const val = d[activeMetric];
      const x = paddingX + (index / (n - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - (val / maxY) * chartHeight;
      return { x, y, data: d, value: val };
    });
  }, [dataPoints, chartWidth, chartHeight, maxY, activeMetric]);

  // Courbe lissée Bézier pure SANS AUCUN DÉGRADÉ
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let pD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX1 = current.x + (next.x - current.x) * 0.45;
      const controlY1 = current.y;
      const controlX2 = current.x + (next.x - current.x) * 0.55;
      const controlY2 = next.y;
      pD += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
    }
    return pD;
  }, [points]);

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-card)',
        padding: '20px 24px',
        border: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* En-tête : Titre & Période */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Évolution des actes procéduraux
        </div>

        {/* Filtre de période discret (7j, 30j, 90j, 1an) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'var(--color-surface-muted)',
            padding: '3px',
            borderRadius: 'var(--radius-btn)',
          }}
        >
          {(['7j', '30j', '90j', '1an'] as Period[]).map((period) => {
            const isActive = selectedPeriod === period;
            return (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                style={{
                  background: isActive ? 'var(--color-surface-elevated)' : 'transparent',
                  border: 'none',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                }}
              >
                {period}
              </button>
            );
          })}
        </div>
      </div>

      {/* Boutons sobres sans couleur ni bordure, très discrets et très petits pour naviguer entre les métriques */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          flexWrap: 'wrap',
          paddingBottom: '2px',
        }}
      >
        {[
          { id: 'renseignements' as MetricType, label: 'Renseignements', count: totalR },
          { id: 'demandes' as MetricType, label: 'Demandes de communication', count: totalD },
          { id: 'feuilles' as MetricType, label: 'Feuilles d’observation', count: totalF },
          { id: 'pvs' as MetricType, label: 'Procès-verbaux', count: totalP },
        ].map((m) => {
          const isSelected = activeMetric === m.id;
          return (
            <button
              key={m.id}
              type="button"
                disabled={m.id === 'pvs'}
                title={m.id === 'pvs' ? 'Indicateur PV indisponible dans le backend' : undefined}
              onClick={() => {
                setActiveMetric(m.id);
                setHoveredIndex(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)',
                fontWeight: isSelected ? 600 : 400,
                borderBottom: isSelected ? '1.5px solid var(--color-accent)' : '1.5px solid transparent',
                transition: 'color var(--transition-fast), border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
            >
              <span>{m.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  color: isSelected ? 'var(--color-text-accent)' : 'var(--color-text-muted)',
                  fontWeight: 500,
                }}
              >
                ({m.id === 'pvs' ? '—' : m.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Zone Graphique SVG sans dégradé */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        {/* Info-bulle discrète au survol */}
        <div style={{ minHeight: '18px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {activePoint ? (
            <span>
              {activePoint.data.fullDate} :{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>
                {activePoint.value}{' '}
                {activeMetric === 'renseignements'
                  ? 'renseignements'
                  : activeMetric === 'demandes'
                  ? 'demandes enregistrées'
                  : activeMetric === 'feuilles'
                  ? 'feuilles rédigées'
                  : 'PV établis'}
              </strong>
            </span>
          ) : (
            <span></span>
          )}
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: '135px', display: 'block', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          {/* Lignes de repère horizontales discrètes */}
          <line
            x1={paddingX}
            y1={paddingTop + chartHeight * 0.25}
            x2={svgWidth - paddingX}
            y2={paddingTop + chartHeight * 0.25}
            stroke="var(--color-border-subtle)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={paddingTop + chartHeight * 0.65}
            x2={svgWidth - paddingX}
            y2={paddingTop + chartHeight * 0.65}
            stroke="var(--color-border-subtle)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={svgHeight - paddingBottom}
            x2={svgWidth - paddingX}
            y2={svgHeight - paddingBottom}
            stroke="var(--color-border-subtle)"
            strokeWidth="1"
          />

          {/* Courbe lissée pure SANS AUCUN DÉGRADÉ */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-text-secondary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points interactifs */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Zone de survol invisible */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {/* Trait vertical au survol */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={svgHeight - paddingBottom}
                    stroke="var(--color-text-muted)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                )}

                {/* Point discret */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 4.5 : 3}
                  fill="var(--color-surface)"
                  stroke="var(--color-text-primary)"
                  strokeWidth="2"
                  style={{ transition: 'r var(--transition-fast)' }}
                />
              </g>
            );
          })}
        </svg>

        {/* Libellés de l'axe X */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingLeft: '32px',
            paddingRight: '32px',
            marginTop: '6px',
          }}
        >
          {dataPoints.map((pt, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '11px',
                fontWeight: hoveredIndex === idx ? 700 : 500,
                color: hoveredIndex === idx ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                transition: 'color var(--transition-fast)',
              }}
            >
              {pt.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
