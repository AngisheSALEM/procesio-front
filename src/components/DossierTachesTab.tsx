import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Plus,
  Clock,
  Calendar,
  X,
  Send,
  Scale,
  ShieldAlert,
  FileText,
  CheckCircle2,
  ArrowRight,
  Layers,
  Search,
  Filter,
  Flame,
  Info
} from 'lucide-react';
import type { TacheDossier, UserAccount, TypeActionSysteme } from '../types';
import type { DossierTabId } from './DossierHeader';
import { useCleanUI } from '../hooks/useCleanUI';

interface DossierTachesTabProps {
  taches: TacheDossier[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (newTask: {
    titre: string;
    description: string;
    priorite: 'URGENTE' | 'NORMALE';
    dateEcheance: string;
    actionSysteme?: TypeActionSysteme;
    cibleTab?: DossierTabId;
    declencheur?: string;
  }) => void;
  onNavigateTab?: (tab: DossierTabId) => void;
  user?: UserAccount;
}

interface ActionCatalogItem {
  type: TypeActionSysteme;
  label: string;
  shortLabel: string;
  cibleTab: DossierTabId;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  bg: string;
  defaultDeclencheur: string;
  defaultTitre: string;
  defaultDescription: string;
}

const SYSTEM_ACTS_CATALOG: ActionCatalogItem[] = [
  {
    type: 'DEMANDE_COMMUNICATION',
    label: 'Demande de communication (Art. 46 CD)',
    shortLabel: 'Demande comm.',
    cibleTab: 'actions-echanges',
    icon: Send,
    color: 'var(--color-accent)',
    bg: 'var(--color-surface-elevated)',
    defaultDeclencheur: 'Ouverture du dossier et réquisition de pièces comptables ou bancaires',
    defaultTitre: 'Émettre une demande de communication de pièces',
    defaultDescription: 'Réquisitionner les pièces justificatives auprès du déclarant ou tiers détenteur.',
  },
  {
    type: 'EVALUATION_REPONSE',
    label: 'Évaluation conformité d’une réponse',
    shortLabel: 'Évaluation rép.',
    cibleTab: 'actions-echanges',
    icon: CheckCircle2,
    color: 'var(--color-success)',
    bg: 'var(--color-success-surface)',
    defaultDeclencheur: 'Réception des documents transmis en réponse à une demande de communication',
    defaultTitre: 'Évaluer la conformité des pièces reçues',
    defaultDescription: 'Examiner les éléments fournis et statuer sur le caractère satisfaisant ou non.',
  },
  {
    type: 'FEUILLE_OBSERVATION',
    label: 'Feuille d’observation contradictoire',
    shortLabel: 'Feuille obs.',
    cibleTab: 'constats-defense',
    icon: Scale,
    color: 'var(--color-warning)',
    bg: 'var(--color-warning-surface)',
    defaultDeclencheur: 'Discordances constatées lors du contrôle ou réponse non satisfaisante',
    defaultTitre: 'Formaliser la feuille d’observation',
    defaultDescription: 'Rédiger et notifier les constats douaniers pour audition et débat contradictoire.',
  },
  {
    type: 'PV_CONSTAT',
    label: 'PV de constat d’opérations',
    shortLabel: 'PV constat',
    cibleTab: 'documents',
    icon: FileText,
    color: 'var(--color-accent)',
    bg: 'var(--color-surface-elevated)',
    defaultDeclencheur: 'Constatation matérielle sur pièces ou refus d’obtempérer',
    defaultTitre: 'Dresser le procès-verbal de constat',
    defaultDescription: 'Établir le PV constatant les opérations matérielles ou l’opposition au contrôle.',
  },
  {
    type: 'PV_INFRACTION',
    label: 'PV d’infraction douanière (GLEC)',
    shortLabel: 'PV GLEC',
    cibleTab: 'documents',
    icon: ShieldAlert,
    color: 'var(--color-danger)',
    bg: 'var(--color-danger-surface)',
    defaultDeclencheur: 'Infraction douanière caractérisée suite à la clôture de la feuille d’observation',
    defaultTitre: 'Dresser le PV d’infraction douanière',
    defaultDescription: 'Rédiger et coter le PV d’infraction douanière pour transmission au GLEC.',
  },
  {
    type: 'CLOTURE_SANS_SUITE',
    label: 'Classement sans suite du dossier',
    shortLabel: 'Sans suite',
    cibleTab: 'vue-ensemble',
    icon: Check,
    color: 'var(--color-success)',
    bg: 'var(--color-success-surface)',
    defaultDeclencheur: 'Levée des suspicions et conformité intégrale établie après contrôle',
    defaultTitre: 'Prononcer le classement sans suite',
    defaultDescription: 'Clôturer la procédure sans redressement avec rapport motivé.',
  },
];

export const DossierTachesTab: React.FC<DossierTachesTabProps> = ({
  taches,
  onToggleTask,
  onAddTask,
  onNavigateTab,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useCleanUI('DossierTachesTab', containerRef);

  // Responsive state with ResizeObserver
  const [containerWidth, setContainerWidth] = useState<number>(1000);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isCompact = containerWidth < 880;

  // Filter state
  const [filterState, setFilterState] = useState<'TOUTES' | 'A_TRAITER' | 'URGENTES' | 'TERMINEES'>('TOUTES');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActFilter, setSelectedActFilter] = useState<string>('ALL');

  // Selected Task for Detail Modal
  const [selectedTask, setSelectedTask] = useState<TacheDossier | null>(null);

  // Modal: Planifier un acte de procédure
  const [showModal, setShowModal] = useState(false);
  const [selectedActType, setSelectedActType] = useState<TypeActionSysteme>('DEMANDE_COMMUNICATION');
  const [titre, setTitre] = useState('');
  const [declencheur, setDeclencheur] = useState('');
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState<'URGENTE' | 'NORMALE'>('NORMALE');
  const [dateEcheance, setDateEcheance] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const handleOpenModal = () => {
    const defaultCatalog = SYSTEM_ACTS_CATALOG[0];
    setSelectedActType(defaultCatalog.type);
    setTitre(defaultCatalog.defaultTitre);
    setDeclencheur(defaultCatalog.defaultDeclencheur);
    setDescription(defaultCatalog.defaultDescription);
    setPriorite('NORMALE');
    setShowModal(true);
  };

  const handleSelectActType = (type: TypeActionSysteme) => {
    setSelectedActType(type);
    const catalogItem = SYSTEM_ACTS_CATALOG.find((c) => c.type === type);
    if (catalogItem) {
      setTitre(catalogItem.defaultTitre);
      setDeclencheur(catalogItem.defaultDeclencheur);
      setDescription(catalogItem.defaultDescription);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;

    const catalogItem = SYSTEM_ACTS_CATALOG.find((c) => c.type === selectedActType);

    onAddTask({
      titre: titre.trim(),
      description: description.trim(),
      priorite,
      dateEcheance,
      actionSysteme: selectedActType,
      cibleTab: catalogItem?.cibleTab || 'vue-ensemble',
      declencheur: declencheur.trim() || catalogItem?.defaultDeclencheur,
    });

    setShowModal(false);
  };

  // Helper: Catalog meta
  const getActMeta = (actionSysteme?: TypeActionSysteme) => {
    if (!actionSysteme) {
      return {
        label: 'Acte de procédure',
        shortLabel: 'Procédure',
        cibleTab: 'vue-ensemble' as DossierTabId,
        icon: Layers,
        color: 'var(--color-text-secondary)',
        bg: 'var(--color-surface-elevated)',
      };
    }
    const found = SYSTEM_ACTS_CATALOG.find((c) => c.type === actionSysteme);
    if (found) return found;
    return {
      label: 'Procédure',
      shortLabel: 'Procédure',
      cibleTab: 'vue-ensemble' as DossierTabId,
      icon: Layers,
      color: 'var(--color-accent)',
      bg: 'var(--color-surface-elevated)',
    };
  };

  // Helper: Format date & deadline badge
  const formatDeadline = (dateStr: string) => {
    if (!dateStr) return { formatted: 'Non définie', badge: null, isOverdue: false };
    const target = new Date(dateStr);
    const now = new Date();
    // Reset hours for day difference
    target.setHours(0, 0, 0, 0);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Formatted date string (e.g. 02 oct. 2026)
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const formatted = `${target.getDate().toString().padStart(2, '0')} ${months[target.getMonth()]} ${target.getFullYear()}`;

    if (diffDays < 0) {
      return {
        formatted,
        badge: { text: `En retard (${Math.abs(diffDays)} j)`, color: 'var(--color-danger)', bg: 'var(--color-danger-surface)' },
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return {
        formatted,
        badge: { text: "Aujourd'hui", color: 'var(--color-warning)', bg: 'var(--color-warning-surface)' },
        isOverdue: false,
      };
    }
    if (diffDays <= 3) {
      return {
        formatted,
        badge: { text: `Dans ${diffDays} j`, color: 'var(--color-warning)', bg: 'var(--color-warning-surface)' },
        isOverdue: false,
      };
    }
    return {
      formatted,
      badge: { text: `Dans ${diffDays} j`, color: 'var(--color-text-muted)', bg: 'var(--color-surface-elevated)' },
      isOverdue: false,
    };
  };

  // Helper: Initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'DG';
    const clean = name.replace(/^Insp\.\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  // Metrics
  const totalCount = taches.length;
  const enAttenteCount = taches.filter((t) => t.statut !== 'TERMINEE').length;
  const urgentesCount = taches.filter((t) => t.priorite === 'URGENTE' && t.statut !== 'TERMINEE').length;
  const termineesCount = taches.filter((t) => t.statut === 'TERMINEE').length;

  // Filtered tasks
  const filteredTaches = taches.filter((t) => {
    // 1. Status Filter
    if (filterState === 'A_TRAITER' && t.statut === 'TERMINEE') return false;
    if (filterState === 'TERMINEES' && t.statut !== 'TERMINEE') return false;
    if (filterState === 'URGENTES' && (t.priorite !== 'URGENTE' || t.statut === 'TERMINEE')) return false;

    // 2. Act Filter
    if (selectedActFilter !== 'ALL' && t.actionSysteme !== selectedActFilter) return false;

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitre = t.titre.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q) || false;
      const matchAuteur = t.auteur?.toLowerCase().includes(q) || false;
      const matchDeclencheur = t.declencheur?.toLowerCase().includes(q) || false;
      if (!matchTitre && !matchDesc && !matchAuteur && !matchDeclencheur) return false;
    }

    return true;
  });

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* 1. Header Bar: Titre + Recherche + Bouton Planifier */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Tâches de procédure
          </h2>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {totalCount}
          </span>
        </div>

        {/* Action Button: Planifier un acte */}
        <button
          onClick={handleOpenModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-btn)',
            backgroundColor: 'var(--color-accent)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '12px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
        >
          <Plus size={15} />
          <span>Planifier un acte de procédure</span>
        </button>
      </div>

      {/* 2. KPI Summary Strip (Clickable chips to filter instantly) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
        }}
      >
        {/* Chip Toutes */}
        <div
          onClick={() => setFilterState('TOUTES')}
          style={{
            padding: '10px 14px',
            backgroundColor: filterState === 'TOUTES' ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
            border: filterState === 'TOUTES' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Toutes les tâches</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '2px' }}>
              {totalCount}
            </div>
          </div>
          <Layers size={18} color="var(--color-text-muted)" />
        </div>

        {/* Chip À traiter */}
        <div
          onClick={() => setFilterState('A_TRAITER')}
          style={{
            padding: '10px 14px',
            backgroundColor: filterState === 'A_TRAITER' ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
            border: filterState === 'A_TRAITER' ? '2px solid var(--color-warning)' : '1px solid var(--color-border)',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>À traiter</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-warning)', marginTop: '2px' }}>
              {enAttenteCount}
            </div>
          </div>
          <Clock size={18} color="var(--color-warning)" />
        </div>

        {/* Chip Urgentes */}
        <div
          onClick={() => setFilterState('URGENTES')}
          style={{
            padding: '10px 14px',
            backgroundColor: filterState === 'URGENTES' ? 'var(--color-danger-surface)' : 'var(--color-surface)',
            border: filterState === 'URGENTES' ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 700 }}>Priorité haute</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-danger)', marginTop: '2px' }}>
              {urgentesCount}
            </div>
          </div>
          <Flame size={18} color="var(--color-danger)" />
        </div>

        {/* Chip Terminées */}
        <div
          onClick={() => setFilterState('TERMINEES')}
          style={{
            padding: '10px 14px',
            backgroundColor: filterState === 'TERMINEES' ? 'var(--color-success-surface)' : 'var(--color-surface)',
            border: filterState === 'TERMINEES' ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Terminées</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-success)', marginTop: '2px' }}>
              {termineesCount}
            </div>
          </div>
          <CheckCircle2 size={18} color="var(--color-success)" />
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
          backgroundColor: 'var(--color-surface)',
          padding: '8px 12px',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: '1 1 240px',
            backgroundColor: 'var(--color-surface-elevated)',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <Search size={14} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Rechercher une tâche, un mot-clé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '12px',
              color: 'var(--color-text-primary)',
              width: '100%',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0 }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Act Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={13} color="var(--color-text-muted)" />
          <select
            value={selectedActFilter}
            onChange={(e) => setSelectedActFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">Tous les actes de procédure</option>
            {SYSTEM_ACTS_CATALOG.map((c) => (
              <option key={c.type} value={c.type}>
                {c.shortLabel} — {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Table on Desktop / Card List on Compact Screen */}
      {!isCompact ? (
        /* Wide Desktop Table: Crystal Clear Hierarchy */
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', minWidth: '880px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <th style={{ padding: '12px 14px', width: '44px', textAlign: 'center' }}>✓</th>
                <th style={{ padding: '12px 14px', width: '150px' }}>Acte procédural</th>
                <th style={{ padding: '12px 14px', width: '40%' }}>Tâche & Contexte</th>
                <th style={{ padding: '12px 14px', width: '100px' }}>Priorité</th>
                <th style={{ padding: '12px 14px', width: '150px' }}>Échéance</th>
                <th style={{ padding: '12px 14px', width: '130px' }}>Responsable</th>
                <th style={{ padding: '12px 14px', width: '100px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTaches.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px 18px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Aucune tâche ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredTaches.map((t) => {
                  const isDone = t.statut === 'TERMINEE';
                  const actMeta = getActMeta(t.actionSysteme);
                  const ActIcon = actMeta.icon;
                  const deadlineInfo = formatDeadline(t.dateEcheance);

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                        opacity: isDone ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Col 1: Checkbox */}
                      <td
                        style={{ padding: '14px 10px', textAlign: 'center', verticalAlign: 'middle' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(t.id);
                        }}
                      >
                        <button
                          type="button"
                          title={isDone ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '5px',
                            border: isDone ? 'none' : '1.5px solid var(--color-border)',
                            backgroundColor: isDone ? 'var(--color-success)' : 'transparent',
                            color: '#FFFFFF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          {isDone && <Check size={13} strokeWidth={3} />}
                        </button>
                      </td>

                      {/* Col 2: Acte Procédural Badge */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: actMeta.bg,
                            color: actMeta.color,
                            fontSize: '11px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                          title={actMeta.label}
                        >
                          <ActIcon size={12} strokeWidth={2} />
                          <span>{actMeta.shortLabel}</span>
                        </div>
                      </td>

                      {/* Col 3: Tâche & Contexte (Scannable, not cluttered) */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: isDone ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                            fontSize: '13px',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}
                        >
                          {t.titre}
                        </div>
                        {t.description && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--color-text-muted)',
                              marginTop: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '440px',
                            }}
                            title={t.description}
                          >
                            {t.description}
                          </div>
                        )}
                        {t.declencheur && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10px',
                              color: 'var(--color-text-secondary)',
                              marginTop: '4px',
                              backgroundColor: 'var(--color-surface-elevated)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            <Info size={10} color="var(--color-accent)" />
                            <span>{t.declencheur}</span>
                          </div>
                        )}
                      </td>

                      {/* Col 4: Priorité */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        {t.priorite === 'URGENTE' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--color-danger-surface)',
                              color: 'var(--color-danger)',
                            }}
                          >
                            <Flame size={11} />
                            <span>Urgente</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            Normale
                          </span>
                        )}
                      </td>

                      {/* Col 5: Échéance avec badge relatif */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="font-sf" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {deadlineInfo.formatted}
                          </span>
                          {deadlineInfo.badge && !isDone && (
                            <span
                              style={{
                                display: 'inline-block',
                                width: 'fit-content',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: deadlineInfo.badge.bg,
                                color: deadlineInfo.badge.color,
                              }}
                            >
                              {deadlineInfo.badge.text}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Col 6: Responsable avec Avatar initials */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-surface-elevated)',
                              border: '1px solid var(--color-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: 'var(--color-accent)',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(t.auteur)}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.auteur}>
                            {t.auteur ? t.auteur.replace(/^Insp\.\s*/i, '') : 'Inspecteur'}
                          </span>
                        </div>
                      </td>

                      {/* Col 7: Action */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetTab = t.cibleTab || actMeta.cibleTab;
                            if (onNavigateTab && targetTab) {
                              onNavigateTab(targetTab);
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-surface-elevated)',
                            color: 'var(--color-accent)',
                            fontWeight: 700,
                            fontSize: '11px',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all var(--transition-fast)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
                            e.currentTarget.style.color = 'var(--color-accent)';
                          }}
                        >
                          <span>Exécuter</span>
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
      ) : (
        /* Responsive Card-Rows for Compact Screens (< 880px) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTaches.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
              Aucune tâche ne correspond à vos filtres.
            </div>
          ) : (
            filteredTaches.map((t) => {
              const isDone = t.statut === 'TERMINEE';
              const actMeta = getActMeta(t.actionSysteme);
              const ActIcon = actMeta.icon;
              const deadlineInfo = formatDeadline(t.dateEcheance);

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--radius-card)',
                    border: '1px solid var(--color-border)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    cursor: 'pointer',
                    opacity: isDone ? 0.6 : 1,
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                >
                  {/* Top: Acte + Priority + Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(t.id);
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '5px',
                          border: isDone ? 'none' : '1.5px solid var(--color-border)',
                          backgroundColor: isDone ? 'var(--color-success)' : 'transparent',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        {isDone && <Check size={13} strokeWidth={3} />}
                      </button>

                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          backgroundColor: actMeta.bg,
                          color: actMeta.color,
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        <ActIcon size={12} strokeWidth={2} />
                        <span>{actMeta.label}</span>
                      </div>
                    </div>

                    {t.priorite === 'URGENTE' && !isDone && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-danger-surface)',
                          color: 'var(--color-danger)',
                        }}
                      >
                        <Flame size={10} />
                        <span>Urgente</span>
                      </span>
                    )}
                  </div>

                  {/* Mid: Titre + Desc */}
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '13px',
                        color: isDone ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}
                    >
                      {t.titre}
                    </div>
                    {t.description && (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                        {t.description}
                      </div>
                    )}
                  </div>

                  {/* Bottom: Echeance, Auteur & Action */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--color-border-subtle)',
                      fontSize: '11px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        <strong className="font-sf">{deadlineInfo.formatted}</strong>
                      </span>
                      <span>•</span>
                      <span>{t.auteur}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const targetTab = t.cibleTab || actMeta.cibleTab;
                        if (onNavigateTab && targetTab) {
                          onNavigateTab(targetTab);
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '5px',
                        backgroundColor: 'var(--color-accent)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '11px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span>Exécuter</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL : DÉTAIL COMPLET D'UNE TÂCHE */}
      {/* ======================================================== */}
      {selectedTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            backdropFilter: 'blur(4px)',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '580px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {(() => {
                    const actMeta = getActMeta(selectedTask.actionSysteme);
                    const ActIcon = actMeta.icon;
                    return (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: actMeta.bg,
                          color: actMeta.color,
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        <ActIcon size={12} strokeWidth={2} />
                        {actMeta.label}
                      </span>
                    );
                  })()}

                  {selectedTask.priorite === 'URGENTE' && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-danger-surface)',
                        color: 'var(--color-danger)',
                      }}
                    >
                      Priorité haute
                    </span>
                  )}

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: selectedTask.statut === 'TERMINEE' ? 'var(--color-success-surface)' : 'var(--color-surface-elevated)',
                      color: selectedTask.statut === 'TERMINEE' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {selectedTask.statut === 'TERMINEE' ? 'Terminée' : 'À traiter'}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  {selectedTask.titre}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTask(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Description de la mission
                </div>
                {selectedTask.description}
              </div>
            )}

            {/* Procedural Trigger Context (Déclencheur) */}
            {selectedTask.declencheur && (
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)' }}>
                  <Info size={13} />
                  <span>Contexte procédural déclencheur</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                  {selectedTask.declencheur}
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-surface-elevated)',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Échéance réglementaire :</span>
                <strong className="font-sf" style={{ color: 'var(--color-danger)' }}>
                  {selectedTask.dateEcheance}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Responsable désigné :</span>
                <strong>{selectedTask.auteur || 'Inspecteur'}</strong>
              </div>

              {selectedTask.horodatageCreation && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Enregistrée le :</span>
                  <span className="font-sf" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedTask.horodatageCreation}
                  </span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  onToggleTask(selectedTask.id);
                  setSelectedTask((prev) =>
                    prev
                      ? {
                          ...prev,
                          statut: prev.statut === 'TERMINEE' ? 'A_FAIRE' : 'TERMINEE',
                        }
                      : null
                  );
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: selectedTask.statut === 'TERMINEE' ? 'var(--color-warning)' : 'var(--color-success)',
                  fontWeight: 600,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <Check size={13} />
                <span>
                  {selectedTask.statut === 'TERMINEE' ? 'Rouvrir cette tâche' : 'Marquer comme terminée'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetTab = selectedTask.cibleTab || getActMeta(selectedTask.actionSysteme).cibleTab;
                  if (onNavigateTab && targetTab) {
                    onNavigateTab(targetTab);
                  }
                  setSelectedTask(null);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-btn)',
                  backgroundColor: 'var(--color-accent)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span>Accéder à l'écran de travail</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL : PLANIFIER UN NOUVEL ACTE */}
      {/* ======================================================== */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-accent)',
                  }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                    Planifier un acte de procédure
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Programmer une action d'enquête reliée aux modules de l'application.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Type d'acte */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Acte de procédure concerné *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px' }}>
                  {SYSTEM_ACTS_CATALOG.map((cat) => {
                    const isSelected = selectedActType === cat.type;
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.type}
                        onClick={() => handleSelectActType(cat.type)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${cat.color}` : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? cat.bg : 'var(--color-surface-elevated)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <Icon size={14} color={cat.color} />
                        <span style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 500, color: 'var(--color-text-primary)' }}>
                          {cat.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Titre */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                  Libellé de la tâche *
                </label>
                <input
                  type="text"
                  required
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Contexte déclencheur */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                  Contexte ou motif procédural
                </label>
                <input
                  type="text"
                  value={declencheur}
                  onChange={(e) => setDeclencheur(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                  Instructions ou précisions d'exécution
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Priorité & Échéance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Niveau de priorité
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setPriorite('NORMALE')}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: priorite === 'NORMALE' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                        backgroundColor: priorite === 'NORMALE' ? 'var(--color-surface-elevated)' : 'transparent',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Normale
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriorite('URGENTE')}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: priorite === 'URGENTE' ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                        backgroundColor: priorite === 'URGENTE' ? 'var(--color-danger-surface)' : 'transparent',
                        color: priorite === 'URGENTE' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Urgente
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Date d’échéance *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                    className="font-sf"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} />
                  <span>Enregistrer la tâche</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
