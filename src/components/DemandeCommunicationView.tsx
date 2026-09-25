import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  ShieldAlert,
  Send,
  Building2,
  X,
  Plus,
  Trash2,
  Paperclip,
  Calendar,
  Clock,
  User,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import type { DemandeCommunication, ElementDemande, UserAccount } from '../types';
import { useCleanUI } from '../hooks/useCleanUI';

interface DemandeCommunicationViewProps {
  initialDemande: DemandeCommunication;
  currentUser?: UserAccount;
  onGoToFeuilleObservation?: () => void;
}

export const DemandeCommunicationView: React.FC<DemandeCommunicationViewProps> = ({
  initialDemande,
  currentUser,
  onGoToFeuilleObservation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useCleanUI('DemandeCommunicationView', containerRef);

  // Container-based responsive state using ResizeObserver for precision ergonomics
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

  const isCompactScreen = containerWidth < 920;

  const getNowTimestamp = () => {
    const d = new Date();
    return `${d.toISOString().split('T')[0]} ${d.toTimeString().split(' ')[0]}`;
  };

  const defaultAuteur = currentUser
    ? `${currentUser.grade} ${currentUser.prenom} ${currentUser.nom}`
    : (initialDemande.auteur || initialDemande.redacteur || 'Inspecteur Marc Kabamba');

  // List of Demandes for the dossier
  const [demandes, setDemandes] = useState<DemandeCommunication[]>([
    initialDemande,
    {
      id: 'demande-043',
      reference: 'DGDA/DRK/ENQ/DC/2026/043',
      dossierId: initialDemande.dossierId,
      redacteur: defaultAuteur,
      auteur: defaultAuteur,
      horodatage: '2026-08-28 14:30:00',
      objet: 'Communication des manifestes maritimes et facturations de fret CIF Kasumbalesa',
      signataireHabilite: 'Salem Mukendi (Directeur Provincial)',
      gradeSignataire: 'Commandement de Division',
      destinataire: {
        nom: 'MAERSK CONGO RDC',
        qualite: 'Armateur et transporteur maritime',
        adresse: 'Boulevard du 30 Juin, Gombe, Kinshasa',
      },
      dateEmission: '2026-08-28',
      echeanceReponse: '2026-09-15',
      statut: 'REPONSE_COMPLETE',
      evaluationReponse: 'SATISFAISANTE',
      baseLegale: 'Code des douanes, Article 46 — Droit de communication sur le fret',
      elementsDemandes: [
        {
          id: 'EL-M1',
          libelle: 'Connaissements maritimes (Bill of Lading) originaux signés',
          periodeConcernee: 'Exercice 2025',
          motifExigence: 'Contrôle du montant réel du fret acquitté',
          statutRemise: 'FOURNI',
        },
        {
          id: 'EL-M2',
          libelle: 'Factures d’assurance maritime et surestaries portuaires',
          periodeConcernee: 'Exercice 2025',
          motifExigence: 'Intégration dans la valeur en douane CIF',
          statutRemise: 'FOURNI',
        },
      ],
      reponsesRecues: [],
      modaliteRemise: 'Voie électronique sécurisée',
      commentairesInternes: 'Pièces communiquées dans les délais légaux.',
      pdfSourceNom: 'Requisition_Fret_Maersk_2026.pdf',
      pdfSourceTaille: '980 Ko',
      pdfSourceDateUpload: '2026-08-29 10:00:00',
    },
  ]);

  // Modal: Nouvelle demande de communication
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for creating a new demande
  const [createForm, setCreateForm] = useState({
    auteur: defaultAuteur,
    horodatage: getNowTimestamp(),
    reference: `DGDA/DRK/ENQ/DC/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
    destinataireNom: '',
    destinataireQualite: '',
    destinataireAdresse: '',
    objet: '',
    baseLegale: 'Code des douanes, Article 46 — Droit de communication et réquisition de pièces comptables',
    echeanceReponse: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    elements: [
      {
        id: 'EL-01',
        libelle: 'Copies authentifiées des messages SWIFT MT103',
        periodeConcernee: 'Exercice 2025',
        motifExigence: 'Contrôle de la valeur transactionnelle réelle',
        statutRemise: 'EN_ATTENTE' as const,
      },
    ] as ElementDemande[],
    pdfFile: null as { name: string; size: string } | null,
  });

  const [newPieceLibelle, setNewPieceLibelle] = useState('');
  const [newPiecePeriode, setNewPiecePeriode] = useState('');
  const [newPieceMotif, setNewPieceMotif] = useState('');

  // Selected Demande for Detailed View Modal
  const [selectedDemande, setSelectedDemande] = useState<DemandeCommunication | null>(null);

  // Procedural Modals (PV de constat & Mission de contrôle)
  const [showPvConstatModal, setShowPvConstatModal] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);

  // Add piece to form
  const handleAddPieceToForm = () => {
    if (!newPieceLibelle.trim()) return;
    const newId = `EL-0${createForm.elements.length + 1}`;
    setCreateForm((prev) => ({
      ...prev,
      elements: [
        ...prev.elements,
        {
          id: newId,
          libelle: newPieceLibelle.trim(),
          periodeConcernee: newPiecePeriode.trim() || 'Exercice en cours',
          motifExigence: newPieceMotif.trim() || 'Vérification douanière',
          statutRemise: 'EN_ATTENTE',
        },
      ],
    }));
    setNewPieceLibelle('');
    setNewPiecePeriode('');
    setNewPieceMotif('');
  };

  const handleAddQuickSuggestion = (libelle: string, periode: string, motif: string) => {
    const newId = `EL-0${createForm.elements.length + 1}`;
    setCreateForm((prev) => ({
      ...prev,
      elements: [
        ...prev.elements,
        {
          id: newId,
          libelle,
          periodeConcernee: periode,
          motifExigence: motif,
          statutRemise: 'EN_ATTENTE',
        },
      ],
    }));
  };

  const handleRemovePieceFromForm = (id: string) => {
    setCreateForm((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
  };

  // Submit New Demande
  const handleCreateDemandeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newDemande: DemandeCommunication = {
      id: `demande-${Date.now().toString().slice(-4)}`,
      reference: createForm.reference,
      dossierId: initialDemande.dossierId,
      redacteur: createForm.auteur,
      auteur: createForm.auteur,
      horodatage: createForm.horodatage,
      objet: createForm.objet,
      baseLegale: createForm.baseLegale,
      echeanceReponse: createForm.echeanceReponse,
      signataireHabilite: 'Direction des Enquêtes Douanières',
      gradeSignataire: 'Commandement de Division',
      destinataire: {
        nom: createForm.destinataireNom,
        qualite: createForm.destinataireQualite || 'Assujetti contrôlé',
        adresse: createForm.destinataireAdresse || 'Lubumbashi, RDC',
      },
      elementsDemandes: createForm.elements,
      reponsesRecues: [],
      modaliteRemise: 'Dépôt physique ou transmission sécurisée',
      commentairesInternes: '',
      pdfSourceNom: createForm.pdfFile ? createForm.pdfFile.name : undefined,
      pdfSourceTaille: createForm.pdfFile ? createForm.pdfFile.size : undefined,
      pdfSourceDateUpload: createForm.pdfFile ? createForm.horodatage : undefined,
      statut: 'EMISE',
    };

    setDemandes((prev) => [newDemande, ...prev]);
    setShowCreateModal(false);
  };

  // Update evaluation for selected demande
  const handleUpdateEvaluation = (demandeId: string, evaluation: 'SATISFAISANTE' | 'NON_SATISFAISANTE') => {
    setDemandes((prev) =>
      prev.map((d) => {
        if (d.id === demandeId) {
          return {
            ...d,
            evaluationReponse: evaluation,
            statut: evaluation === 'SATISFAISANTE' ? 'REPONSE_COMPLETE' : 'REPONSE_PARTIELLE',
          };
        }
        return d;
      })
    );

    if (selectedDemande && selectedDemande.id === demandeId) {
      setSelectedDemande((prev) =>
        prev
          ? {
              ...prev,
              evaluationReponse: evaluation,
              statut: evaluation === 'SATISFAISANTE' ? 'REPONSE_COMPLETE' : 'REPONSE_PARTIELLE',
            }
          : null
      );
    }
  };

  // Update item status in selected demande
  const handleToggleItemStatus = (demandeId: string, itemId: string, newStatus: ElementDemande['statutRemise']) => {
    setDemandes((prev) =>
      prev.map((d) => {
        if (d.id === demandeId) {
          const updatedElements = d.elementsDemandes.map((el) =>
            el.id === itemId ? { ...el, statutRemise: newStatus } : el
          );
          return { ...d, elementsDemandes: updatedElements };
        }
        return d;
      })
    );

    if (selectedDemande && selectedDemande.id === demandeId) {
      setSelectedDemande((prev) =>
        prev
          ? {
              ...prev,
              elementsDemandes: prev.elementsDemandes.map((el) =>
                el.id === itemId ? { ...el, statutRemise: newStatus } : el
              ),
            }
          : null
      );
    }
  };

  const getStatusBadge = (d: DemandeCommunication) => {
    if (d.evaluationReponse === 'SATISFAISANTE') {
      return { label: 'Satisfaisante', color: 'var(--color-success)', bg: 'var(--color-success-surface)' };
    }
    if (d.evaluationReponse === 'NON_SATISFAISANTE') {
      return { label: 'Non satisfaisante', color: 'var(--color-danger)', bg: 'var(--color-danger-surface)' };
    }
    if (d.statut === 'REPONSE_PARTIELLE') {
      return { label: 'Réponse partielle', color: 'var(--color-warning)', bg: 'var(--color-warning-surface)' };
    }
    return { label: 'En attente', color: 'var(--color-text-secondary)', bg: 'var(--color-surface-elevated)' };
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* 1. Header Bar: Titre + Compteur + Bouton Nouvelle Demande de Communication */}
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
            Demandes de communication
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
            {demandes.length}
          </span>
        </div>

        {/* Bouton Nouvelle Demande de Communication */}
        <button
          onClick={() => {
            const freshTimestamp = getNowTimestamp();
            setCreateForm({
              auteur: defaultAuteur,
              horodatage: freshTimestamp,
              reference: `DGDA/DRK/ENQ/DC/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
              destinataireNom: initialDemande.destinataire?.nom || '',
              destinataireQualite: initialDemande.destinataire?.qualite || '',
              destinataireAdresse: initialDemande.destinataire?.adresse || '',
              objet: '',
              baseLegale: 'Code des douanes, Article 46 — Droit de communication et réquisition de pièces comptables',
              echeanceReponse: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
              elements: [
                {
                  id: 'EL-01',
                  libelle: 'Copies authentifiées des messages SWIFT MT103',
                  periodeConcernee: 'Exercice 2025',
                  motifExigence: 'Contrôle de la valeur transactionnelle réelle',
                  statutRemise: 'EN_ATTENTE',
                },
              ],
              pdfFile: null,
            });
            setShowCreateModal(true);
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
            transition: 'background var(--transition-fast)',
          }}
        >
          <Plus size={15} />
          <span>Nouvelle demande de communication</span>
        </button>
      </div>

      {/* 2. Responsive Presentation: Table on Large Screens, Responsive Card-Rows on Compact Screens */}
      {!isCompactScreen ? (
        /* Wide Desktop Table with strict column hierarchy and generous spacing */
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
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
                <th style={{ padding: '14px 18px', width: '22%', minWidth: '170px' }}>Référence & Date</th>
                <th style={{ padding: '14px 18px', width: '22%', minWidth: '180px' }}>Destinataire</th>
                <th style={{ padding: '14px 18px', width: '28%', minWidth: '220px' }}>Objet de la demande</th>
                <th style={{ padding: '14px 18px', width: '14%', minWidth: '130px' }}>Auteur & Échéance</th>
                <th style={{ padding: '14px 18px', width: '14%', minWidth: '140px', textAlign: 'right' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d) => {
                const badge = getStatusBadge(d);
                const fourniesCount = d.elementsDemandes.filter((e) => e.statutRemise === 'FOURNI').length;

                return (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedDemande(d)}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Col 1: Reference & Horodatage */}
                    <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                      <div className="font-sf" style={{ fontWeight: 800, color: 'var(--color-accent)', fontSize: '13px' }}>
                        {d.reference}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <Clock size={12} />
                        <span className="font-sf">{d.horodatage || d.dateEmission}</span>
                      </div>
                    </td>

                    {/* Col 2: Destinataire & Type */}
                    <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '13px' }}>
                        {d.destinataire.nom}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        <Building2 size={12} color="var(--color-text-muted)" />
                        <span>{d.destinataire.qualite}</span>
                      </div>
                    </td>

                    {/* Col 3: Objet & Pieces count */}
                    <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                      <div
                        style={{
                          color: 'var(--color-text-primary)',
                          lineHeight: 1.45,
                          fontSize: '12px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={d.objet}
                      >
                        {d.objet || 'Demande de communication de pièces'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--color-surface-elevated)',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border-subtle)',
                          }}
                        >
                          {d.elementsDemandes.length} pièces exigées
                        </span>
                        {fourniesCount > 0 && (
                          <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 600 }}>
                            {fourniesCount} fournie{fourniesCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {d.pdfSourceNom && (
                          <span style={{ fontSize: '10px', color: 'var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Paperclip size={10} /> PDF joint
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Col 4: Auteur & Echeance */}
                    <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                        <Calendar size={13} color="var(--color-danger)" />
                        <span className="font-sf">{d.echeanceReponse}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <User size={11} />
                        <span>{d.auteur || d.redacteur}</span>
                      </div>
                    </td>

                    {/* Col 5: Statut & Action */}
                    <td style={{ padding: '16px 18px', verticalAlign: 'top', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            fontWeight: 700,
                            fontSize: '11px',
                            border: `1px solid ${badge.color}35`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: badge.color,
                            }}
                          />
                          {badge.label}
                        </span>

                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Responsive Card-Rows for Medium / Tablet Screen Widths (< 920px container) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {demandes.map((d) => {
            const badge = getStatusBadge(d);
            const fourniesCount = d.elementsDemandes.filter((e) => e.statutRemise === 'FOURNI').length;

            return (
              <div
                key={d.id}
                onClick={() => setSelectedDemande(d)}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--color-border)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                {/* Top Row: Ref & Statut */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="font-sf" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-accent)' }}>
                      {d.reference}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      • {d.horodatage || d.dateEmission}
                    </span>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      fontWeight: 700,
                      fontSize: '11px',
                      border: `1px solid ${badge.color}35`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: badge.color,
                      }}
                    />
                    {badge.label}
                  </span>
                </div>

                {/* Destinataire & Objet */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {d.destinataire.nom}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={12} color="var(--color-text-muted)" />
                    <span>{d.destinataire.qualite}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginTop: '8px', lineHeight: 1.45 }}>
                    {d.objet}
                  </div>

                  {/* Badges pieces */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-surface-elevated)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      {d.elementsDemandes.length} pièces exigées
                    </span>
                    {fourniesCount > 0 && (
                      <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 600 }}>
                        {fourniesCount} fournie{fourniesCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {d.pdfSourceNom && (
                      <span style={{ fontSize: '10px', color: 'var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Paperclip size={10} /> PDF joint
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Row: Echeance, Auteur & Details button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} color="var(--color-danger)" />
                      <span>Échéance : <strong className="font-sf" style={{ color: 'var(--color-danger)' }}>{d.echeanceReponse}</strong></span>
                    </span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <User size={11} />
                      <span>Par : <strong style={{ color: 'var(--color-text-secondary)' }}>{d.auteur || d.redacteur}</strong></span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent)', fontWeight: 700, fontSize: '11px' }}>
                    <span>Consulter les détails</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL : NOUVELLE DEMANDE DE COMMUNICATION */}
      {/* ======================================================== */}
      {showCreateModal && (
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
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                Nouvelle Demande de Communication (Art. 46 CD)
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDemandeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row 1: Auteur & Horodatage */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Auteur de la demande *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.auteur}
                    onChange={(e) => setCreateForm({ ...createForm, auteur: e.target.value })}
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

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                      Horodatage *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, horodatage: getNowTimestamp() })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-accent)',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Actualiser
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={createForm.horodatage}
                    onChange={(e) => setCreateForm({ ...createForm, horodatage: e.target.value })}
                    className="font-sf"
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
              </div>

              {/* Row 2: Référence & Destinataire */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Référence *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.reference}
                    onChange={(e) => setCreateForm({ ...createForm, reference: e.target.value })}
                    className="font-sf"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-accent)',
                      fontWeight: 700,
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Destinataire *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nom de l'organisme ou assujetti"
                    value={createForm.destinataireNom}
                    onChange={(e) => setCreateForm({ ...createForm, destinataireNom: e.target.value })}
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
              </div>

              {/* Row 3: Objet de la demande */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                  Objet de la demande *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Objet et nature des pièces réquisitionnées..."
                  value={createForm.objet}
                  onChange={(e) => setCreateForm({ ...createForm, objet: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Row 4: Base Légale & Échéance */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Cadre légal
                  </label>
                  <input
                    type="text"
                    value={createForm.baseLegale}
                    onChange={(e) => setCreateForm({ ...createForm, baseLegale: e.target.value })}
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

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Échéance légale *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.echeanceReponse}
                    onChange={(e) => setCreateForm({ ...createForm, echeanceReponse: e.target.value })}
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
              </div>

              {/* Row 5: Pièces réquisitionnées */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px', backgroundColor: 'var(--color-surface-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Pièces réquisitionnées ({createForm.elements.length})
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleAddQuickSuggestion('Messages SWIFT MT103 authentifiés', 'Exercice 2025', 'Contrôle des règlements effectifs')}
                    style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                  >
                    + SWIFT MT103
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuickSuggestion('Relevés bancaires certifiés du compte USD', '6 derniers mois', 'Rapprochement comptable')}
                    style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                  >
                    + Relevés Bancaires
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuickSuggestion('Factures commerciales et fret maritime', 'Année 2025', 'Vérification valeur CIF')}
                    style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                  >
                    + Factures & Fret
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto', marginBottom: '10px' }}>
                  {createForm.elements.map((el) => (
                    <div
                      key={el.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border-subtle)',
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-sf" style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                          {el.id}
                        </span>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{el.libelle}</strong>
                        <span style={{ color: 'var(--color-text-muted)' }}>({el.periodeConcernee})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePieceFromForm(el.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) auto', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Libellé de la pièce..."
                    value={newPieceLibelle}
                    onChange={(e) => setNewPieceLibelle(e.target.value)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Période (ex: 2025)"
                    value={newPiecePeriode}
                    onChange={(e) => setNewPiecePeriode(e.target.value)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddPieceToForm}
                    disabled={!newPieceLibelle.trim()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      backgroundColor: newPieceLibelle.trim() ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: newPieceLibelle.trim() ? '#FFFFFF' : 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: newPieceLibelle.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Plus size={13} />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>

              {/* Row 6: Upload PDF (Optionnel) */}
              <div style={{ border: '1px dashed var(--color-border)', borderRadius: '10px', padding: '14px', backgroundColor: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={14} color="var(--color-accent)" />
                    Document PDF de la réquisition <em>(Optionnel)</em>
                  </label>
                  {createForm.pdfFile && (
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, pdfFile: null })}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Détacher
                    </button>
                  )}
                </div>

                {createForm.pdfFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: 'var(--color-surface-elevated)', borderRadius: '8px' }}>
                    <FileSpreadsheet size={18} color="var(--color-accent)" />
                    <div style={{ fontSize: '12px' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{createForm.pdfFile.name}</strong>
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px' }}>({createForm.pdfFile.size})</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateForm((prev) => ({
                          ...prev,
                          pdfFile: {
                            name: 'Demande_Communication_Art46_2026.pdf',
                            size: '1.2 Mo',
                          },
                        }));
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-accent)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Upload size={12} />
                      <span>Charger PDF scanné</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Send size={14} />
                  <span>Créer la demande de communication</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL : DÉTAIL D'UNE DEMANDE DE COMMUNICATION */}
      {/* ======================================================== */}
      {selectedDemande && (
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
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="font-sf" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-accent)' }}>
                  {selectedDemande.reference}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Destinataire : <strong>{selectedDemande.destinataire.nom}</strong>
                </div>
              </div>
              <button
                onClick={() => setSelectedDemande(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Metadata Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-surface-elevated)',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Auteur :</span>
                <strong>{selectedDemande.auteur || selectedDemande.redacteur}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Horodatage :</span>
                <span className="font-sf">{selectedDemande.horodatage || selectedDemande.dateEmission}</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Échéance légale :</span>
                <span className="font-sf" style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
                  {selectedDemande.echeanceReponse}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Statut :</span>
                <span style={{ color: getStatusBadge(selectedDemande).color, fontWeight: 700 }}>
                  {getStatusBadge(selectedDemande).label}
                </span>
              </div>
            </div>

            {/* Objet */}
            <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
              <strong>Objet :</strong> {selectedDemande.objet}
            </div>

            {/* Evaluation Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Évaluation de la conformité :
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleUpdateEvaluation(selectedDemande.id, 'SATISFAISANTE')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: selectedDemande.evaluationReponse === 'SATISFAISANTE' ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
                    backgroundColor: selectedDemande.evaluationReponse === 'SATISFAISANTE' ? 'var(--color-success-surface)' : 'transparent',
                    color: selectedDemande.evaluationReponse === 'SATISFAISANTE' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  🟢 Réponse satisfaisante
                </button>
                <button
                  onClick={() => handleUpdateEvaluation(selectedDemande.id, 'NON_SATISFAISANTE')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: selectedDemande.evaluationReponse === 'NON_SATISFAISANTE' ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                    backgroundColor: selectedDemande.evaluationReponse === 'NON_SATISFAISANTE' ? 'var(--color-danger-surface)' : 'transparent',
                    color: selectedDemande.evaluationReponse === 'NON_SATISFAISANTE' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  🔴 Réponse non satisfaisante
                </button>
              </div>
            </div>

            {/* Actions if Non Satisfaisante */}
            {selectedDemande.evaluationReponse === 'NON_SATISFAISANTE' && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-danger-surface)',
                  border: '1px solid rgba(212, 90, 86, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => setShowPvConstatModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-danger)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '11px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <ShieldAlert size={13} />
                  <span>Lancer un PV de constat</span>
                </button>

                <button
                  onClick={() => setShowMissionModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontWeight: 600,
                    fontSize: '11px',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                >
                  <Building2 size={13} />
                  <span>Lancer une mission sur place</span>
                </button>

                {onGoToFeuilleObservation && (
                  <button
                    onClick={() => {
                      setSelectedDemande(null);
                      onGoToFeuilleObservation();
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: 'var(--color-accent)',
                      fontWeight: 600,
                      fontSize: '11px',
                      border: '1px solid var(--color-accent)',
                      cursor: 'pointer',
                      marginLeft: 'auto',
                    }}
                  >
                    <span>Formaliser feuille d’observation</span>
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Pièces réquisitionnées Table */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                Pièces réquisitionnées ({selectedDemande.elementsDemandes.length})
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-surface-elevated)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                      <th style={{ padding: '8px 10px' }}>Réf.</th>
                      <th style={{ padding: '8px 10px' }}>Libellé</th>
                      <th style={{ padding: '8px 10px' }}>Période</th>
                      <th style={{ padding: '8px 10px' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDemande.elementsDemandes.map((el) => (
                      <tr key={el.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td className="font-sf" style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--color-accent)' }}>
                          {el.id}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--color-text-primary)' }}>
                          {el.libelle}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                          {el.periodeConcernee}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <select
                            value={el.statutRemise}
                            onChange={(e) =>
                              handleToggleItemStatus(
                                selectedDemande.id,
                                el.id,
                                e.target.value as ElementDemande['statutRemise']
                              )
                            }
                            style={{
                              padding: '3px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                              backgroundColor: 'var(--color-surface-elevated)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border)',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="FOURNI">Fourni</option>
                            <option value="EN_ATTENTE">En attente</option>
                            <option value="INCOMPLET">Incomplet</option>
                            <option value="MANQUANT">Manquant</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setSelectedDemande(null)}
                className="btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL : PROCÈS-VERBAL DE CONSTAT */}
      {/* ======================================================== */}
      {showPvConstatModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-danger)', margin: 0 }}>
                Procès-Verbal de Constat (Art. 46 CD)
              </h3>
              <button
                onClick={() => setShowPvConstatModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface-elevated)', padding: '12px', borderRadius: '8px', fontSize: '12px', lineHeight: 1.5 }}>
              <div><strong>Référence :</strong> <span className="font-sf">PV-CONST/2026/DRK/019</span></div>
              <div><strong>Infraction :</strong> Défaut de communication de pièces comptables obligatoires.</div>
              <div><strong>Amende légale :</strong> 5 000 USD</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setShowPvConstatModal(false)} className="btn-secondary">
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedDemande) {
                    handleUpdateEvaluation(selectedDemande.id, 'NON_SATISFAISANTE');
                  }
                  setShowPvConstatModal(false);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-btn)',
                  backgroundColor: 'var(--color-danger)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Certifier le PV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL : MISSION DE CONTRÔLE SUR PLACE */}
      {/* ======================================================== */}
      {showMissionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                Mission de Contrôle sur Place
              </h3>
              <button
                onClick={() => setShowMissionModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface-elevated)', padding: '12px', borderRadius: '8px', fontSize: '12px', lineHeight: 1.5 }}>
              <div><strong>Ordre de mission :</strong> <span className="font-sf">OM-2026/DRK/DIR-ENQ/084</span></div>
              <div><strong>Cible :</strong> {selectedDemande?.destinataire.nom}</div>
              <div><strong>Durée :</strong> 7 jours ouvrables</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setShowMissionModal(false)} className="btn-secondary">
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setShowMissionModal(false)}
                className="btn-primary"
              >
                Valider l'Ordre de Mission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
