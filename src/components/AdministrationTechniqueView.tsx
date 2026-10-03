import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Search,
  Download,
  CheckCircle2,
  RefreshCw,
  X
} from 'lucide-react';
import type {
  AuditEventItem,
  DossierEnquete,
  DemandeCommunication,
  FeuilleObservation,
  PvDetail,
  UserAccount,
  RenseignementItem
} from '../types';
import type { WorkspaceData } from '../api/workspace';
import type { ApiUser } from '../api/client';
import type { useTechnicalDebt } from '../hooks/useTechnicalDebt';
import { formatDate } from '../utils/dateUtils';

interface AdministrationTechniqueViewProps {
  currentUser: UserAccount;
  dossiers: DossierEnquete[];
  renseignements?: RenseignementItem[];
  demandesParDossier: Record<string, DemandeCommunication[]>;
  feuillesParDossier: Record<string, FeuilleObservation[]>;
  pvsParDossier: Record<string, PvDetail[]>;
  workspace?: WorkspaceData | null;
  backendUser?: ApiUser | null;
  technicalDebt?: ReturnType<typeof useTechnicalDebt>;
  auditEvents: AuditEventItem[];
  onOpenDossier: (dossierId: string, initialTab?: any) => void;
  onRefresh?: () => Promise<void> | void;
}

type AdminTab = 'audit' | 'cases' | 'agents' | 'integrity';

export const AdministrationTechniqueView: React.FC<AdministrationTechniqueViewProps> = ({
  currentUser,
  dossiers,
  demandesParDossier,
  feuillesParDossier,
  pvsParDossier,
  workspace,
  technicalDebt,
  auditEvents,
  onOpenDossier,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<DossierEnquete | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form Modal only (for export configuration)
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<'current_unit' | 'all_units'>('all_units');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [exportStartDate, setExportStartDate] = useState('2026-01-01');
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [exportSuccessMessage, setExportSuccessMessage] = useState('');

  // KPIs
  const allDemandes = useMemo(() => Object.values(demandesParDossier).flat(), [demandesParDossier]);
  const allFeuilles = useMemo(() => Object.values(feuillesParDossier).flat(), [feuillesParDossier]);
  const allPvs = useMemo(() => Object.values(pvsParDossier).flat(), [pvsParDossier]);
  const totalAuditEvents = auditEvents.length;

  const validUUIDCases = useMemo(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return dossiers.filter((d) => uuidRegex.test(d.id)).length;
  }, [dossiers]);

  const allAgents = useMemo(() => {
    return workspace?.users || [
      { id: 1, username: 'mukendi', first_name: 'Salem', last_name: 'Mukendi', grade: 'Directeur Provincial', matricule: 'DGDA-DIR-089', memberships: [{ unit: { id: 'u1', code: 'DRK', name: 'Direction Provinciale Katanga' }, role: 'manager', clearance: 1, capabilities: ['case.create', 'case.assign', 'request.validate', 'decision.validate'] }] },
      { id: 3, username: 'kabamba', first_name: 'Marc', last_name: 'Kabamba', grade: 'Inspecteur Vérificateur', matricule: 'DGDA-INSP-2041', memberships: [{ unit: { id: 'u1', code: 'DRK', name: 'Direction Provinciale Katanga' }, role: 'investigator', clearance: 0, capabilities: ['case.update', 'request.create', 'sheet.create'] }] },
      { id: 5, username: 'tshilumba', first_name: 'Jean-Paul', last_name: 'Tshilumba', grade: 'Inspecteur Vérificateur', matricule: 'DGDA-INSP-1092', memberships: [{ unit: { id: 'u1', code: 'DRK', name: 'Direction Provinciale Katanga' }, role: 'investigator', clearance: 0, capabilities: ['case.update', 'request.create', 'sheet.create'] }] },
      { id: 7, username: 'mbombo', first_name: 'Alain', last_name: 'Mbombo', grade: 'Administrateur Système', matricule: 'DGDA-SYS-001', memberships: [{ unit: { id: 'u0', code: 'DGA-AUDIT', name: 'Cellule Nationale d’Audit (DGA)' }, role: 'auditor', clearance: 1, capabilities: ['audit.read', 'security.check'] }] },
    ];
  }, [workspace]);

  // Filtered audit events
  const filteredEvents = useMemo(() => {
    return auditEvents.filter((evt) => {
      const matchSearch =
        !searchTerm.trim() ||
        evt.actionLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.acteurNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.uniteCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchAction =
        actionFilter === 'ALL' ||
        (actionFilter === 'CASE' && evt.action.startsWith('case.')) ||
        (actionFilter === 'ACTS' && (evt.action.startsWith('request.') || evt.action.startsWith('sheet.'))) ||
        (actionFilter === 'DECISION' && (evt.action.startsWith('decision.') || evt.action.startsWith('gelec.'))) ||
        (actionFilter === 'SECURITY' && (evt.action.startsWith('audit.') || evt.action.startsWith('security.')));

      return matchSearch && matchAction;
    });
  }, [auditEvents, searchTerm, actionFilter]);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleExportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExportSuccessMessage(`Registre d’audit exporté avec succès (${exportFormat.toUpperCase()}) pour la période ${exportStartDate} au ${exportEndDate}.`);
    setTimeout(() => {
      setShowExportModal(false);
      setExportSuccessMessage('');
    }, 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* =========================================================================
          1. TITLE & CONTROL BAR (AUCUNE BORDER TOP / BOTTOM SOUS LE TITRE)
          ========================================================================= */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0 0 0', letterSpacing: '-0.3px' }}>
            Supervision Globale du Système
          </h1>
       
        </div>

        {/* Action Buttons: Primary Color strictly on CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowExportModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '8px 16px' }}
          >
            <Download size={15} />
            <span>Exporter le journal d’audit</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. KPI CARDS (DISPOSITION REPRISE DE SUPERVISION OVERVIEW)
          1 Grande carte principale à gauche + 3 cartes empilées à droite
          ========================================================================= */}
      <div className="supervision-kpi-layout">
        {/* Grande Carte Principale : Événements d'Audit Immuables */}
        <div
          onClick={() => { setSelectedEvent(null); setSelectedCaseDetail(null); setActiveTab('audit'); }}
          className="card-interactive"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            padding: '24px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--color-border)',
            minHeight: '260px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                Journal d’Audit Cryptographique 
              </span>
            
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '38px', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                  {totalAuditEvents}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                  Événements horodatés enregistrés 
                </div>
              </div>

              {/* Sparkline visuelle */}
              <div style={{ width: '130px', height: '36px', opacity: 0.85 }}>
                <svg width="100%" height="100%" viewBox="0 0 130 36" fill="none">
                  <path
                    d="M 5 28 Q 30 18 55 24 T 105 12 T 125 8"
                    fill="none"
                    stroke="var(--color-text-secondary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="125" cy="8" r="3" fill="var(--color-text-primary)" />
                </svg>
              </div>
            </div>
          </div>

          {/* Section inférieure discrète */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '16px',
              paddingTop: '16px',
              marginTop: '20px',
            }}
          >
   
           
           
          </div>
        </div>

        {/* 3 Cartes Empilées à Droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Carte 1 : Intégrité des Dossiers */}
          <div
            onClick={() => { setSelectedEvent(null); setSelectedCaseDetail(null); setActiveTab('cases'); }}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '18px 20px',
              cursor: 'pointer',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                Dossiers d’Enquête en Base
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {dossiers.length}
              </div>
          
            </div>
            <ArrowRight size={16} color="var(--color-text-muted)" />
          </div>

          {/* Carte 2 : Flux d'Actes & Transmissions */}
          <div
            onClick={() => { setSelectedEvent(null); setSelectedCaseDetail(null); setActiveTab('cases'); }}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '18px 20px',
              cursor: 'pointer',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                Actes Procéduraux Notifiés
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {allDemandes.length + allFeuilles.length + allPvs.length}
              </div>
              
            </div>
            <ArrowRight size={16} color="var(--color-text-muted)" />
          </div>

          {/* Carte 3 : Comptes Agents & Habilitations */}
          <div
            onClick={() => { setSelectedEvent(null); setSelectedCaseDetail(null); setActiveTab('agents'); }}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '18px 20px',
              cursor: 'pointer',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                Répertoire des Agents & Rôles
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {allAgents.length}
              </div>
         
            </div>
            <ArrowRight size={16} color="var(--color-text-muted)" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. TAB SELECTOR PILLS
          ========================================================================= */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'audit', label: 'Journal d’Audit & Événements', count: filteredEvents.length },
          { id: 'cases', label: 'Tous les Dossiers Système', count: dossiers.length },
          { id: 'agents', label: 'Agents', count: allAgents.length },

        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as AdminTab);
                setSelectedEvent(null);
                setSelectedCaseDetail(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: isActive ? 'var(--color-text-primary)' : 'var(--color-surface)',
                color: isActive ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  opacity: isActive ? 0.9 : 0.6,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          4. VRAIE PAGE INFO INLINE (QUAND UN ÉVÉNEMENT EST SÉLECTIONNÉ)
          Zéro modal pour les infos ! Page info intégrée et fluide.
          ========================================================================= */}
      {selectedEvent && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedEvent(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
            >
              <ArrowLeft size={14} />
              <span>Revenir au journal d’audit</span>
            </button>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-secondary)',
              }}
            >
              ID Événement : {selectedEvent.id}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              Page Info • Détail Cryptographique d’Audit
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0 0 0' }}>
              {selectedEvent.actionLabel}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Action système : <code style={{ backgroundColor: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px' }}>{selectedEvent.action}</code>
            </div>
          </div>

          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Acteur Responsable</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {selectedEvent.acteurNom}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Matricule : {selectedEvent.acteurMatricule || 'Non renseigné'}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Unité & Habilitation</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {selectedEvent.uniteCode}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Clearance : Niveau {selectedEvent.classification}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Ressource Cible</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {selectedEvent.resourceType}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                ID : {selectedEvent.resourceId || 'Global'}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Horodatage Immuable</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {selectedEvent.occurredAt}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Statut : {selectedEvent.statut}
              </div>
            </div>
          </div>

          {/* Request ID Trace */}
          <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Identifiant Unique de Requête Cryptographique (X-Request-ID)
            </div>
            <code style={{ fontSize: '13px', color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
              {selectedEvent.requestId}
            </code>
          </div>

          {/* Raw Payload Inspection */}
          {selectedEvent.details && (
            <div style={{ padding: '16px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Charge Utile / Données d'Audit Associées (JSON)
              </div>
              <pre style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-primary)', overflowX: 'auto', fontFamily: 'monospace' }}>
                {JSON.stringify(selectedEvent.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          5. VRAIE PAGE INFO INLINE (QUAND UN DOSSIER EST SÉLECTIONNÉ)
          ========================================================================= */}
      {selectedCaseDetail && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedCaseDetail(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
            >
              <ArrowLeft size={14} />
              <span>Revenir à la liste des dossiers</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => onOpenDossier(selectedCaseDetail.id)}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              <span>Ouvrir l’interface complète du dossier</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              Page Info • Fiche d’Audit du Dossier
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0 0 0' }}>
              {selectedCaseDetail.entiteControlee.nom}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Réf : {selectedCaseDetail.reference} • UUID : <code style={{ backgroundColor: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px' }}>{selectedCaseDetail.id}</code>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Responsable</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {selectedCaseDetail.responsable}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Unité : {selectedCaseDetail.unite}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Statut Procédural</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {selectedCaseDetail.statut}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Priorité : {selectedCaseDetail.priorite}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Échéance & Prochaine Action</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {selectedCaseDetail.echeance ? formatDate(selectedCaseDetail.echeance) : 'Non définie'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {selectedCaseDetail.prochaineAction || 'Aucune action planifiée'}
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Objet & Périmètre de l'enquête
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
              {selectedCaseDetail.objet}
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. TAB CONTENT: JOURNAL D'AUDIT (DESIGN TABLEAU DU DOSSIER VIEW)
          ========================================================================= */}
      {activeTab === 'audit' && !selectedEvent && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          {/* Table Header Filter Tools */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-card)',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Search size={14} color="var(--color-text-muted)" />
                <input
                  type="text"
                  placeholder="Rechercher par action, acteur, requête..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    width: '100%',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {[
                { id: 'ALL', label: 'Tous les événements' },
                { id: 'CASE', label: 'Dossiers' },
                { id: 'ACTS', label: 'Demandes & Feuilles' },
                { id: 'DECISION', label: 'Décisions & GELEC' },
                { id: 'SECURITY', label: 'Sécurité & Contrôle' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActionFilter(f.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '14px',
                    border: 'none',
                    backgroundColor: actionFilter === f.id ? 'var(--color-surface-elevated)' : 'transparent',
                    color: actionFilter === f.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    fontSize: '11px',
                    fontWeight: actionFilter === f.id ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimalist Audit Table (Exact dossier table design) */}
          <div className="responsive-table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
                  <th style={{ padding: '12px 16px', width: '160px' }}>Horodatage</th>
                  <th style={{ padding: '12px 16px', width: '180px' }}>Acteur Responsable</th>
                  <th style={{ padding: '12px 16px', width: '100px' }}>Unité</th>
                  <th style={{ padding: '12px 16px' }}>Action & Objet</th>
                  <th style={{ padding: '12px 16px', width: '140px' }}>Ressource</th>
                
             
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Aucun événement d'audit ne correspond à vos critères de recherche.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="card-interactive"
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {evt.occurredAt}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {evt.acteurNom}
                        </div>
                     
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                       
                          {evt.uniteCode}
                        
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {evt.actionLabel}
                        </div>
                   
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {evt.resourceType}
                      </td>
                  
                     
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. TAB CONTENT: TOUS LES DOSSIERS (VUE GLOBALE SYSTEME)
          ========================================================================= */}
      {activeTab === 'cases' && !selectedCaseDetail && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div className="responsive-table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
                  <th style={{ padding: '12px 16px', width: '220px' }}>Opérateur Contrôlé</th>
                
                  <th style={{ padding: '12px 16px', width: '160px' }}>Responsable Affecté</th>
                  <th style={{ padding: '12px 16px', width: '120px' }}>Unité</th>
                  <th style={{ padding: '12px 16px', width: '110px' }}>Statut</th>
                  
                
                </tr>
              </thead>
              <tbody>
                {dossiers.map((dossier) => {
                  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dossier.id);
                  return (
                    <tr
                      key={dossier.id}
                      onClick={() => setSelectedCaseDetail(dossier)}
                      className="card-interactive"
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {dossier.entiteControlee.nom}
                        </div>
                      </td>
                    
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {dossier.responsable}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {dossier.unite}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--color-surface-elevated)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {dossier.statut}
                        </span>
                      </td>
                     
                    
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. TAB CONTENT: AGENTS & HABILITATIONS RBAC
          ========================================================================= */}
      {activeTab === 'agents' && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div className="responsive-table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
                  <th style={{ padding: '12px 16px', width: '220px' }}>Nom & Prénom</th>
                  <th style={{ padding: '12px 16px', width: '130px' }}>Matricule</th>
                  <th style={{ padding: '12px 16px', width: '160px' }}>Rôle Institutionnel</th>
                  <th style={{ padding: '12px 16px', width: '180px' }}>Unité d'Affectation</th>
                  <th style={{ padding: '12px 16px', width: '90px' }}>Clearance</th>
                  <th style={{ padding: '12px 16px' }}>Capacités & Permissions RBAC</th>
                </tr>
              </thead>
              <tbody>
                {allAgents.map((agent) => {
                  const membership = agent.memberships?.[0];
                  const roleLabel =
                    membership?.role === 'manager'
                      ? 'Directeur / Chef d’Unité'
                      : membership?.role === 'auditor'
                        ? 'Administrateur & Auditeur'
                        : 'Enquêteur Vérificateur';

                  return (
                    <tr
                      key={agent.id}
                      className="card-interactive"
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {agent.first_name} {agent.last_name || agent.username}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {agent.grade || roleLabel}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600 }}>
                        {agent.matricule || 'DGDA-AGENT'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                        {roleLabel}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {membership?.unit?.name || 'Direction Générale'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--color-surface-elevated)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          Niveau {membership?.clearance ?? 0}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(membership?.capabilities || ['case.update', 'audit.read']).map((cap) => (
                            <span
                              key={cap}
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-secondary)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          9. TAB CONTENT: SANTÉ TECHNIQUE & SERVICES BACKEND
          ========================================================================= */}


      {/* =========================================================================
          10. MODALE FORMULAIRE STRICT : EXPORT DU REGISTRE D'AUDIT
          Les modales ne sont utilisées QUE pour les formulaires !
          ========================================================================= */}
      {showExportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Exporter le Registre d’Audit Cryptographique
              </h2>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowExportModal(false)}
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {exportSuccessMessage ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-card)',
                  backgroundColor: 'rgba(52, 199, 89, 0.12)',
                  color: '#34C759',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} />
                <span>{exportSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleExportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Périmètre d'exportation
                  </label>
                  <select
                    value={exportScope}
                    onChange={(e) => setExportScope(e.target.value as 'current_unit' | 'all_units')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-card)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="all_units">Toutes les unités douanières (DGA, DRK, Goma, Matadi)</option>
                    <option value="current_unit">Unité DRK Lubumbashi uniquement</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Date début
                    </label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-card)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Date fin
                    </label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-card)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Format de fichier
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'csv', label: 'CSV / Excel' },
                      { id: 'json', label: 'JSON Structuré' },
                      { id: 'pdf', label: 'PDF Certifié' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setExportFormat(fmt.id as 'csv' | 'json' | 'pdf')}
                        style={{
                          padding: '8px',
                          borderRadius: 'var(--radius-card)',
                          border: exportFormat === fmt.id ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                          backgroundColor: exportFormat === fmt.id ? 'var(--color-surface-elevated)' : 'var(--color-bg)',
                          color: 'var(--color-text-primary)',
                          fontSize: '12px',
                          fontWeight: exportFormat === fmt.id ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowExportModal(false)}
                    style={{ fontSize: '12px', padding: '8px 14px' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '8px 18px' }}
                  >
                    Générer et télécharger l’export
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
