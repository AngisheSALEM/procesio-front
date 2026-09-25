import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  X,
  Scale,
  ShieldAlert,
  FileCheck,
  Check,
  FileText,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  ChevronRight,
  Printer,
  Paperclip,
  Building2,
  AlertTriangle
} from 'lucide-react';
import type { FeuilleObservation, ObservationItem, UserAccount } from '../types';
import type { DossierTabId } from './DossierHeader';
import { useCleanUI } from '../hooks/useCleanUI';

interface FeuilleObservationViewProps {
  initialFeuille: FeuilleObservation;
  currentUser?: UserAccount;
  onNavigateTab?: (tab: DossierTabId) => void;
}

export const FeuilleObservationView: React.FC<FeuilleObservationViewProps> = ({
  initialFeuille,
  currentUser,
  onNavigateTab,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useCleanUI('FeuilleObservationView', containerRef);

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

  const isCompactScreen = containerWidth < 920;

  const getNowTimestamp = () => {
    const d = new Date();
    return `${d.toISOString().split('T')[0]} ${d.toTimeString().split(' ')[0]}`;
  };

  const defaultAuteur = currentUser
    ? `${currentUser.grade} ${currentUser.prenom} ${currentUser.nom}`
    : (initialFeuille.inspecteurs?.[0] || 'Inspecteur Marc Kabamba');

  // List of Feuilles d'observation for the current dossier
  const [feuilles, setFeuilles] = useState<FeuilleObservation[]>([
    initialFeuille,
    {
      id: 'fo-2026-024',
      reference: 'DGDA/DRK/FO/2026/024',
      dossierId: initialFeuille.dossierId,
      dateRedaction: '2026-09-08',
      inspecteurs: [defaultAuteur, 'Mireille Kabamba (Inspecteur Adjoint)'],
      destinataire: initialFeuille.destinataire,
      objetControle: 'Contrôle des flux financiers et redevances sur licences chimiques importées',
      cadreLegal: 'Décision DG/DGDA/DG/2011/296 (Articles 44 à 49) — Contrôle a posteriori',
      statutFeuille: 'CLOTUREE',
      decisionFinale: 'CLASSE_SANS_SUITE',
      dateReunionCloturePrevue: '2026-09-22',
      pdfSourceNom: 'Feuille_Observation_Redevances_2026.pdf',
      pdfSourceDateUpload: '2026-09-08 11:30:00',
      observations: [
        {
          code: 'O1',
          titre: 'Justification des redevances d’exploitation sur formule brevetée',
          faitsConstates: 'Vérification de la conformité du contrat de licence et de l’intégration des droits dans la valeur imposable.',
          justificatifsAssocies: ['Contrat LIC-2023-BVI', 'Quittances fiscales DGI'],
          referencesJuridiques: 'Code des douanes, Article 38 — Ajustement de la valeur transactionnelle',
          questionsAssujetti: 'Fournir la preuve du paiement effectif de la retenue à la source sur royalties.',
          statutConstat: 'CLOS_REGULARISE',
          analyseMotivee: 'Quittances de paiement régulières produites auprès de la DGI. Aucun redressement exigible.',
          defenseRecue: {
            dateReception: '2026-09-18',
            arguments: 'Régularisation attestée par l’administration fiscale avec bordereaux de versement probants.',
            piecesJointes: ['Quittance_DGI_2026.pdf'],
          },
        },
      ],
    },
  ]);

  // Selected Feuille for Detailed Inspection Modal
  const [selectedFeuille, setSelectedFeuille] = useState<FeuilleObservation | null>(null);

  // Modal: Nouvelle Feuille d'Observation
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Accordion state inside inspection modal
  const [expandedObs, setExpandedObs] = useState<string>('O1');

  // PDF Upload & Extraction State
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // PV d'infraction GLEC Modal
  const [showGlecModal, setShowGlecModal] = useState(false);
  const [glecData, setGlecData] = useState({
    reference: `PV-INF/2026/DRK/044`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    infractions: [
      'Fausse déclaration de valeur sur réactifs miniers (Code des douanes, Art. 382)',
      'Minoration systématique de fret maritime et assurance CIF',
      'Défaut de déclaration de redevances et droits de licence conditionnant la vente',
    ],
    droitsEludesUSD: 95480,
    droitsEludesCDF: 267344000,
    amendeUSD: 190960,
    inspecteurs: ['Marc Kabamba (Inspecteur Vérificateur)', 'Mireille Kabamba (Inspecteur Adjoint)'],
    statutTransmission: 'TRANSMIS_GLEC' as const,
  });

  // Inline add observation state inside detailed modal
  const [showAddObsInline, setShowAddObsInline] = useState(false);
  const [newObsTitre, setNewObsTitre] = useState('');
  const [newObsFaits, setNewObsFaits] = useState('');
  const [newObsJuridique, setNewObsJuridique] = useState('');
  const [newObsQuestions, setNewObsQuestions] = useState('');

  // Form State for creating a new Feuille d'Observation
  const [createForm, setCreateForm] = useState({
    reference: `DGDA/DRK/FO/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
    dateRedaction: new Date().toISOString().split('T')[0],
    inspecteurs: defaultAuteur,
    destinataire: initialFeuille.destinataire || 'CONGO MINING & CHEMICAL LOGISTICS SAS',
    objetControle: '',
    cadreLegal: 'Décision DG/DGDA/DG/2011/296 (Articles 44 à 49) portant réglementation des contrôles a posteriori en RDC',
    dateReunionCloturePrevue: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
    observations: [
      {
        code: 'O1',
        titre: 'Écart de facturation sur fret maritime et assurance CIF',
        faitsConstates: 'Discordance constatée entre la déclaration SYDONIA et les connaissements maritimes originaux.',
        justificatifsAssocies: ['B/L maritime', 'Facture de fret MAERSK'],
        referencesJuridiques: 'Code des douanes, Art. 46 & 382 (Valeur en douane CIF)',
        questionsAssujetti: 'Veuillez justifier l’écart sur les frais de transport maritime effectifs.',
        statutConstat: 'OUVERT' as const,
        analyseMotivee: 'Faits en cours d’audition et de vérification contradictoire.',
      },
    ] as ObservationItem[],
    pdfFile: null as { name: string; size: string } | null,
  });

  const [newFormObsTitre, setNewFormObsTitre] = useState('');
  const [newFormObsFaits, setNewFormObsFaits] = useState('');
  const [newFormObsJuridique, setNewFormObsJuridique] = useState('');

  const toggleExpand = (code: string) => {
    setExpandedObs((prev) => (prev === code ? '' : code));
  };

  const getStatusBadge = (f: FeuilleObservation) => {
    if (f.decisionFinale === 'CLASSE_SANS_SUITE') {
      return {
        label: 'Conformité admise (Sans suite)',
        color: 'var(--color-success)',
        bg: 'var(--color-success-surface)',
      };
    }
    if (f.decisionFinale === 'PV_INFRACTION_GLEC' || f.decisionRelais?.relaisGelec) {
      return {
        label: 'Transmis Contentieux (GLEC)',
        color: 'var(--color-danger)',
        bg: 'var(--color-danger-surface)',
      };
    }
    if (f.statutFeuille === 'DEFENSE_RECUE') {
      return {
        label: 'Mémoire en défense reçu',
        color: 'var(--color-warning)',
        bg: 'var(--color-warning-surface)',
      };
    }
    if (f.statutFeuille === 'REUNION_CONTRADICTOIRE') {
      return {
        label: 'Audition contradictoire',
        color: 'var(--color-accent)',
        bg: 'var(--color-surface-elevated)',
      };
    }
    return {
      label: 'Phase contradictoire en cours',
      color: 'var(--color-text-secondary)',
      bg: 'var(--color-surface-elevated)',
    };
  };

  // Add observation to create form
  const handleAddObsToForm = () => {
    if (!newFormObsTitre.trim()) return;
    const newCode = `O${createForm.observations.length + 1}`;
    setCreateForm((prev) => ({
      ...prev,
      observations: [
        ...prev.observations,
        {
          code: newCode,
          titre: newFormObsTitre.trim(),
          faitsConstates: newFormObsFaits.trim() || 'Constatation issue des vérifications matérielles.',
          justificatifsAssocies: ['Pièces douanières', 'Rapprochement comptable'],
          referencesJuridiques: newFormObsJuridique.trim() || 'Code des douanes, Réglementation a posteriori',
          questionsAssujetti: 'Fournir tout élément explicatif ou rectificatif.',
          statutConstat: 'OUVERT',
          analyseMotivee: 'Examen en cours d’audition.',
        },
      ],
    }));
    setNewFormObsTitre('');
    setNewFormObsFaits('');
    setNewFormObsJuridique('');
  };

  const handleAddQuickSuggestion = (titre: string, faits: string, base: string) => {
    const newCode = `O${createForm.observations.length + 1}`;
    setCreateForm((prev) => ({
      ...prev,
      observations: [
        ...prev.observations,
        {
          code: newCode,
          titre,
          faitsConstates: faits,
          justificatifsAssocies: ['Pièces du dossier'],
          referencesJuridiques: base,
          questionsAssujetti: 'Justifier les discordances relevées dans les écritures.',
          statutConstat: 'OUVERT',
          analyseMotivee: 'En cours de débat contradictoire.',
        },
      ],
    }));
  };

  const handleRemoveObsFromForm = (code: string) => {
    setCreateForm((prev) => ({
      ...prev,
      observations: prev.observations.filter((obs) => obs.code !== code),
    }));
  };

  // Submit New Feuille
  const handleCreateFeuilleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newFeuille: FeuilleObservation = {
      id: `fo-${Date.now().toString().slice(-4)}`,
      reference: createForm.reference,
      dossierId: initialFeuille.dossierId,
      dateRedaction: createForm.dateRedaction,
      inspecteurs: [createForm.inspecteurs],
      destinataire: createForm.destinataire,
      objetControle: createForm.objetControle || 'Contrôle a posteriori de conformité douanière',
      cadreLegal: createForm.cadreLegal,
      dateReunionCloturePrevue: createForm.dateReunionCloturePrevue,
      observations: createForm.observations,
      statutFeuille: 'NOTIFIEE',
      pdfSourceNom: createForm.pdfFile ? createForm.pdfFile.name : undefined,
      pdfSourceDateUpload: createForm.pdfFile ? getNowTimestamp() : undefined,
    };

    setFeuilles((prev) => [newFeuille, ...prev]);
    setShowCreateModal(false);
  };

  // Update Decision on Selected Feuille
  const handleSetDecision = (feuilleId: string, decision: 'CLASSE_SANS_SUITE' | 'PV_INFRACTION_GLEC') => {
    setFeuilles((prev) =>
      prev.map((f) => {
        if (f.id === feuilleId) {
          return {
            ...f,
            decisionFinale: decision,
            statutFeuille: 'CLOTUREE',
          };
        }
        return f;
      })
    );

    if (selectedFeuille && selectedFeuille.id === feuilleId) {
      setSelectedFeuille((prev) =>
        prev
          ? {
              ...prev,
              decisionFinale: decision,
              statutFeuille: 'CLOTUREE',
            }
          : null
      );
    }

    if (decision === 'PV_INFRACTION_GLEC') {
      setShowGlecModal(true);
    }
  };

  // Toggle constat status (Clos vs Contentieux)
  const handleToggleConstatStatus = (feuilleId: string, code: string, newStatut: ObservationItem['statutConstat']) => {
    setFeuilles((prev) =>
      prev.map((f) => {
        if (f.id === feuilleId) {
          const updatedObs = f.observations.map((obs) =>
            obs.code === code ? { ...obs, statutConstat: newStatut } : obs
          );
          return { ...f, observations: updatedObs };
        }
        return f;
      })
    );

    if (selectedFeuille && selectedFeuille.id === feuilleId) {
      setSelectedFeuille((prev) =>
        prev
          ? {
              ...prev,
              observations: prev.observations.map((obs) =>
                obs.code === code ? { ...obs, statutConstat: newStatut } : obs
              ),
            }
          : null
      );
    }
  };

  // Add observation inline inside selected feuille
  const handleAddConstatInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeuille || !newObsTitre.trim()) return;

    const newCode = `O${selectedFeuille.observations.length + 1}`;
    const newConstat: ObservationItem = {
      code: newCode,
      titre: newObsTitre.trim(),
      faitsConstates: newObsFaits.trim() || 'Constat matériel relevé en cours de procédure.',
      justificatifsAssocies: ['Pièces vérifiées'],
      referencesJuridiques: newObsJuridique.trim() || 'Code des douanes RDC',
      questionsAssujetti: newObsQuestions.trim() || 'Préciser les éléments justificatifs.',
      statutConstat: 'OUVERT',
      analyseMotivee: 'Examen contradictoire ouvert.',
    };

    setFeuilles((prev) =>
      prev.map((f) => {
        if (f.id === selectedFeuille.id) {
          return { ...f, observations: [...f.observations, newConstat] };
        }
        return f;
      })
    );

    setSelectedFeuille((prev) =>
      prev
        ? {
            ...prev,
            observations: [...prev.observations, newConstat],
          }
        : null
    );

    setNewObsTitre('');
    setNewObsFaits('');
    setNewObsJuridique('');
    setNewObsQuestions('');
    setShowAddObsInline(false);
    setExpandedObs(newCode);
  };

  // Simulate PDF Extraction
  const handleSimulatePdfExtraction = (fileName: string) => {
    if (!selectedFeuille) return;
    setIsExtractingPdf(true);
    setExtractionProgress(25);

    setTimeout(() => setExtractionProgress(60), 300);
    setTimeout(() => setExtractionProgress(90), 650);
    setTimeout(() => {
      setExtractionProgress(100);
      setIsExtractingPdf(false);

      const timestamp = getNowTimestamp();
      setFeuilles((prev) =>
        prev.map((f) => {
          if (f.id === selectedFeuille.id) {
            return {
              ...f,
              pdfSourceNom: fileName,
              pdfSourceDateUpload: timestamp,
            };
          }
          return f;
        })
      );

      setSelectedFeuille((prev) =>
        prev
          ? {
              ...prev,
              pdfSourceNom: fileName,
              pdfSourceDateUpload: timestamp,
            }
          : null
      );

      setShowUploadModal(false);
    }, 1000);
  };

  // Confirm GLEC Submission
  const handleConfirmGlec = () => {
    const confirmedGlec = {
      ...glecData,
      date: getNowTimestamp(),
      statutTransmission: 'TRANSMIS_GLEC' as const,
    };
    setGlecData(confirmedGlec);

    if (selectedFeuille) {
      setFeuilles((prev) =>
        prev.map((f) => {
          if (f.id === selectedFeuille.id) {
            return {
              ...f,
              pvInfractionGlec: confirmedGlec,
              decisionFinale: 'PV_INFRACTION_GLEC',
              decisionRelais: {
                relaisGelec: true,
                referencePvInfraction: confirmedGlec.reference,
                motif: 'Infraction douanière persistante après clôture contradictoire de la Feuille d’Observation',
                dateTransmission: new Date().toISOString().split('T')[0],
              },
            };
          }
          return f;
        })
      );

      setSelectedFeuille((prev) =>
        prev
          ? {
              ...prev,
              pvInfractionGlec: confirmedGlec,
              decisionFinale: 'PV_INFRACTION_GLEC',
              decisionRelais: {
                relaisGelec: true,
                referencePvInfraction: confirmedGlec.reference,
                motif: 'Infraction douanière persistante après clôture contradictoire de la Feuille d’Observation',
                dateTransmission: new Date().toISOString().split('T')[0],
              },
            }
          : null
      );
    }
    setShowGlecModal(false);
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* 1. Header Bar: Titre + Compteur + Bouton Nouvelle Feuille d'Observation */}
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
            Feuilles d’observation contradictoires
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
            {feuilles.length}
          </span>
        </div>

        {/* Bouton Nouvelle Feuille d'Observation */}
        <button
          onClick={() => {
            setCreateForm({
              reference: `DGDA/DRK/FO/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
              dateRedaction: new Date().toISOString().split('T')[0],
              inspecteurs: defaultAuteur,
              destinataire: initialFeuille.destinataire || 'CONGO MINING & CHEMICAL LOGISTICS SAS',
              objetControle: '',
              cadreLegal: 'Décision DG/DGDA/DG/2011/296 (Articles 44 à 49) portant réglementation des contrôles a posteriori en RDC',
              dateReunionCloturePrevue: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
              observations: [
                {
                  code: 'O1',
                  titre: 'Écart de facturation sur fret maritime et assurance CIF',
                  faitsConstates: 'Discordance constatée entre la déclaration SYDONIA et les connaissements maritimes originaux.',
                  justificatifsAssocies: ['B/L maritime', 'Facture de fret MAERSK'],
                  referencesJuridiques: 'Code des douanes, Art. 46 & 382 (Valeur en douane CIF)',
                  questionsAssujetti: 'Veuillez justifier l’écart sur les frais de transport maritime effectifs.',
                  statutConstat: 'OUVERT',
                  analyseMotivee: 'Faits en cours d’audition et de vérification contradictoire.',
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
          <span>Nouvelle feuille d’observation</span>
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
                <th style={{ padding: '14px 18px', width: '28%', minWidth: '220px' }}>Objet du contrôle</th>
                <th style={{ padding: '14px 18px', width: '14%', minWidth: '140px' }}>Inspecteurs & Audition</th>
                <th style={{ padding: '14px 18px', width: '14%', minWidth: '140px', textAlign: 'right' }}>Statut & Issue</th>
              </tr>
            </thead>
            <tbody>
              {feuilles.map((f) => {
                const badge = getStatusBadge(f);
                const regularisesCount = f.observations.filter((o) => o.statutConstat === 'CLOS_REGULARISE').length;
                const contentieuxCount = f.observations.filter((o) => o.statutConstat === 'MAINTENU_CONTENTIEUX').length;

                return (
                  <tr
                    key={f.id}
                    onClick={() => {
                      setSelectedFeuille(f);
                      setExpandedObs(f.observations[0]?.code || 'O1');
                    }}
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
                    {/* Col 1: Reference & Date */}
                    <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                      <div className="font-sf" style={{ fontWeight: 800, color: 'var(--color-accent)', fontSize: '13px' }}>
                        {f.reference}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <Clock size={12} />
                        <span className="font-sf">{f.dateRedaction}</span>
                      </div>
                    </td>

                    {/* Col 2: Destinataire & Cadre légal */}
                    <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '13px' }}>
                        {f.destinataire.split(',')[1] || f.destinataire}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        <Building2 size={12} color="var(--color-text-muted)" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={f.destinataire}>
                          {f.destinataire.split(',')[0]}
                        </span>
                      </div>
                    </td>

                    {/* Col 3: Objet & Constats breakdown */}
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
                        title={f.objetControle}
                      >
                        {f.objetControle || 'Contrôle a posteriori de conformité'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
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
                          {f.observations.length} constats
                        </span>
                        {contentieuxCount > 0 && (
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
                            {contentieuxCount} contentieux
                          </span>
                        )}
                        {regularisesCount > 0 && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--color-success-surface)',
                              color: 'var(--color-success)',
                            }}
                          >
                            {regularisesCount} régularisé{regularisesCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Col 4: Inspecteurs & Réunion */}
                    <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                        <Calendar size={12} color="var(--color-accent)" />
                        <span className="font-sf">Audition : {f.dateReunionCloturePrevue || 'À programmer'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <User size={11} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={f.inspecteurs?.join(', ')}>
                          {f.inspecteurs?.[0] || 'Inspecteur vérificateur'}
                        </span>
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
          {feuilles.map((f) => {
            const badge = getStatusBadge(f);
            const contentieuxCount = f.observations.filter((o) => o.statutConstat === 'MAINTENU_CONTENTIEUX').length;

            return (
              <div
                key={f.id}
                onClick={() => {
                  setSelectedFeuille(f);
                  setExpandedObs(f.observations[0]?.code || 'O1');
                }}
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
                      {f.reference}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      • {f.dateRedaction}
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
                    {f.destinataire}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginTop: '8px', lineHeight: 1.45 }}>
                    {f.objetControle}
                  </div>

                  {/* Badges count */}
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
                      {f.observations.length} constats
                    </span>
                    {contentieuxCount > 0 && (
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
                        {contentieuxCount} contentieux
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Audition : <strong>{f.dateReunionCloturePrevue || 'N/A'}</strong></span>
                    <span>•</span>
                    <span>{f.inspecteurs?.[0]}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent)', fontWeight: 600 }}>
                    <span>Examiner</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL : NOUVELLE FEUILLE D'OBSERVATION */}
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
              maxWidth: '680px',
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
                  <Scale size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                    Nouvelle feuille d’observation contradictoire
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Notification des griefs et constats douaniers provisoires avant clôture.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateFeuilleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Row 1: Inspecteur & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Inspecteur vérificateur *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.inspecteurs}
                    onChange={(e) => setCreateForm({ ...createForm, inspecteurs: e.target.value })}
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
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Date de rédaction *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.dateRedaction}
                    onChange={(e) => setCreateForm({ ...createForm, dateRedaction: e.target.value })}
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
                    Référence F.O. *
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
                    Destinataire / Entreprise ciblée *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.destinataire}
                    onChange={(e) => setCreateForm({ ...createForm, destinataire: e.target.value })}
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

              {/* Row 3: Objet du contrôle */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                  Objet du contrôle contradictoire *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex : Communication des constatations provisoires sur l’assiette taxable et le fret..."
                  value={createForm.objetControle}
                  onChange={(e) => setCreateForm({ ...createForm, objetControle: e.target.value })}
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

              {/* Row 4: Cadre Légal & Date Réunion Prévue */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Cadre légal et réglementaire
                  </label>
                  <input
                    type="text"
                    value={createForm.cadreLegal}
                    onChange={(e) => setCreateForm({ ...createForm, cadreLegal: e.target.value })}
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
                    Audition contradictoire prévue *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.dateReunionCloturePrevue}
                    onChange={(e) => setCreateForm({ ...createForm, dateReunionCloturePrevue: e.target.value })}
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

              {/* Row 5: Constats d'observation provisoires */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px', backgroundColor: 'var(--color-surface-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Constats formulés ({createForm.observations.length})
                  </label>
                </div>

                {/* Quick suggestions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleAddQuickSuggestion('Écart de fret maritime CIF Kasumbalesa', 'Différentiel constaté entre le B/L MAERSK et la case 22 SYDONIA.', 'Code des douanes, Art. 46 (Fret maritime)')}
                    style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                  >
                    + Écart fret maritime
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuickSuggestion('Discordance SWIFT MT103 sur réactifs', 'Règlement effectif de 580 000 USD contre 485 000 USD déclarés.', 'Code des douanes, Art. 382 (Valeur transactionnelle)')}
                    style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                  >
                    + Rapprochement SWIFT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuickSuggestion('Redevances de brevet non déclarées', 'Paiement trimestriel de royalties de 5 % non réintégré dans la valeur.', 'Code des douanes, Art. 38 (Ajustement redevances)')}
                    style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                  >
                    + Royalties non déclarées
                  </button>
                </div>

                {/* List of current observations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {createForm.observations.map((obs) => (
                    <div
                      key={obs.code}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border-subtle)',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-sf" style={{ fontWeight: 800, color: 'var(--color-accent)' }}>
                          {obs.code}
                        </span>
                        <div>
                          <strong style={{ color: 'var(--color-text-primary)' }}>{obs.titre}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{obs.referencesJuridiques}</div>
                        </div>
                      </div>

                      {createForm.observations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveObsFromForm(obs.code)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Inline add constat to form */}
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--color-border)', paddingTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Titre du nouveau constat..."
                    value={newFormObsTitre}
                    onChange={(e) => setNewFormObsTitre(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Faits constatés..."
                      value={newFormObsFaits}
                      onChange={(e) => setNewFormObsFaits(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddObsToForm}
                      disabled={!newFormObsTitre.trim()}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-accent)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: newFormObsTitre.trim() ? 'pointer' : 'not-allowed',
                        opacity: newFormObsTitre.trim() ? 1 : 0.5,
                      }}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 6: Upload PDF Document F.O. (Optionnel) */}
              <div style={{ border: '1px dashed var(--color-border)', borderRadius: '10px', padding: '14px', backgroundColor: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={14} color="var(--color-accent)" />
                    Document officiel scanné de la F.O. <em>(Optionnel)</em>
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
                    <FileText size={18} color="var(--color-accent)" />
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
                            name: 'Feuille_Observation_Officielle_DGDA.pdf',
                            size: '1.4 Mo',
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
                      <span>Charger PDF signé</span>
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
                  <Scale size={14} />
                  <span>Enregistrer la feuille d’observation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL : INSPECTION DÉTAILLÉE D'UNE FEUILLE D'OBSERVATION */}
      {/* ======================================================== */}
      {selectedFeuille && (
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
              maxWidth: '820px',
              maxHeight: '92vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="font-sf" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-accent)' }}>
                    {selectedFeuille.reference}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: getStatusBadge(selectedFeuille).bg,
                      color: getStatusBadge(selectedFeuille).color,
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {getStatusBadge(selectedFeuille).label}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {selectedFeuille.destinataire} • Cadre légal : {selectedFeuille.cadreLegal}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                  }}
                  title="Imprimer la feuille d’observation"
                >
                  <Printer size={13} />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setSelectedFeuille(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Metadata Summary Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '10px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-surface-elevated)',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Date de rédaction :</span>
                <span className="font-sf" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {selectedFeuille.dateRedaction}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Audition contradictoire :</span>
                <span className="font-sf" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                  {selectedFeuille.dateReunionCloturePrevue || 'Non fixée'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Vérificateurs :</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  {selectedFeuille.inspecteurs?.join(', ') || 'Inspecteurs DGDA'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Constats :</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  {selectedFeuille.observations.length} constats ({selectedFeuille.observations.filter((o) => o.statutConstat === 'MAINTENU_CONTENTIEUX').length} contentieux)
                </strong>
              </div>
            </div>

            {/* Objet du contrôle */}
            <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', lineHeight: 1.45 }}>
              <strong>Objet du contrôle :</strong> {selectedFeuille.objetControle}
            </div>

            {/* Document PDF Source Banner */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={18} color="var(--color-accent)" />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    F.O. numérisée : <span className="font-sf">{selectedFeuille.pdfSourceNom || 'Feuille_Observation_DRK_2026.pdf'}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    Enregistré le {selectedFeuille.pdfSourceDateUpload || selectedFeuille.dateRedaction} • Constats vérifiés
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Upload size={12} />
                <span>Remplacer PDF</span>
              </button>
            </div>

            {/* Decision finale de clôture (Satisfait vs Non satisfait -> GLEC) */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Issue contradictoire et décision de clôture
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Statuer après examen des justifications de l'assujetti.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSetDecision(selectedFeuille.id, 'CLASSE_SANS_SUITE')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: selectedFeuille.decisionFinale === 'CLASSE_SANS_SUITE' ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
                      backgroundColor: selectedFeuille.decisionFinale === 'CLASSE_SANS_SUITE' ? 'var(--color-success-surface)' : 'var(--color-surface)',
                      color: selectedFeuille.decisionFinale === 'CLASSE_SANS_SUITE' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                      fontWeight: 600,
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Satisfait (Classé sans suite)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetDecision(selectedFeuille.id, 'PV_INFRACTION_GLEC')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: selectedFeuille.decisionFinale === 'PV_INFRACTION_GLEC' ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                      backgroundColor: selectedFeuille.decisionFinale === 'PV_INFRACTION_GLEC' ? 'var(--color-danger-surface)' : 'var(--color-surface)',
                      color: selectedFeuille.decisionFinale === 'PV_INFRACTION_GLEC' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                      fontWeight: 600,
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    <XCircle size={13} />
                    <span>Non satisfait (Transmettre GLEC)</span>
                  </button>
                </div>
              </div>

              {/* Confirmation Banners */}
              {selectedFeuille.decisionFinale === 'CLASSE_SANS_SUITE' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-success-surface)',
                    border: '1px solid rgba(111, 169, 130, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--color-success)',
                  }}
                >
                  <FileCheck size={16} />
                  <span>
                    <strong>Conformité admise :</strong> Les explications fournies par l'entreprise ont été validées. Clôture sans redressement douanier.
                  </span>
                </div>
              )}

              {selectedFeuille.decisionFinale === 'PV_INFRACTION_GLEC' && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-danger-surface)',
                    border: '1px solid rgba(212, 90, 86, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={18} color="var(--color-danger)" />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-danger)' }}>
                        Infraction douanière persistante — Procédure contentieuse requise
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        Le procès-verbal d'infraction doit être formalisé pour transmission à la Division Contentieuse (GLEC).
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowGlecModal(true)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-danger)',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Scale size={13} />
                    <span>Dresser / Voir le PV GLEC</span>
                  </button>
                </div>
              )}
            </div>

            {/* Active GLEC Summary if generated */}
            {selectedFeuille.pvInfractionGlec && (
              <div
                style={{
                  border: '1px solid var(--color-danger)',
                  borderRadius: '10px',
                  padding: '14px',
                  backgroundColor: 'var(--color-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-danger)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Scale size={14} /> Dossier transmis au Contentieux GLEC
                  </span>
                  <span className="font-sf" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Réf : {selectedFeuille.pvInfractionGlec.reference}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Droits et taxes éludés :</span>
                    <strong style={{ display: 'block', color: 'var(--color-danger)', fontSize: '13px' }}>
                      {selectedFeuille.pvInfractionGlec.droitsEludesUSD.toLocaleString()} USD
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Amendes légales :</span>
                    <strong style={{ display: 'block', color: 'var(--color-warning)', fontSize: '13px' }}>
                      {selectedFeuille.pvInfractionGlec.amendeUSD.toLocaleString()} USD
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Statut de poursuite :</span>
                    <strong style={{ display: 'block', color: 'var(--color-danger)', fontSize: '12px' }}>
                      Transmis pour recouvrement
                    </strong>
                  </div>
                </div>

                {onNavigateTab && (
                  <div style={{ marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab('documents');
                        setSelectedFeuille(null);
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-accent)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Consulter le PV dans Documents & PV →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Constats d'observation contradictoires List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Constats contradictoires ({selectedFeuille.observations.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddObsInline(!showAddObsInline)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-accent)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={13} />
                  <span>Ajouter un constat</span>
                </button>
              </div>

              {/* Inline form to add observation */}
              {showAddObsInline && (
                <form
                  onSubmit={handleAddConstatInline}
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                    Nouveau constat contradictoire (O{selectedFeuille.observations.length + 1})
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Titre de la discordance relevée..."
                    value={newObsTitre}
                    onChange={(e) => setNewObsTitre(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                    }}
                  />
                  <textarea
                    rows={2}
                    placeholder="Faits matériels et constatations sur pièces..."
                    value={newObsFaits}
                    onChange={(e) => setNewObsFaits(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Base légale (ex: Art. 382 CD)..."
                      value={newObsJuridique}
                      onChange={(e) => setNewObsJuridique(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Question posée à l'assujetti..."
                      value={newObsQuestions}
                      onChange={(e) => setNewObsQuestions(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddObsInline(false)}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-accent)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Enregistrer le constat
                    </button>
                  </div>
                </form>
              )}

              {/* Accordion List */}
              {selectedFeuille.observations.map((obs) => {
                const isExpanded = expandedObs === obs.code;
                return (
                  <div
                    key={obs.code}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    {/* Header */}
                    <div
                      onClick={() => toggleExpand(obs.code)}
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? 'var(--color-surface-elevated)' : 'transparent',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          className="font-sf"
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '5px',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          {obs.code}
                        </span>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {obs.titre}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            Base juridique : {obs.referencesJuridiques}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor:
                              obs.statutConstat === 'CLOS_REGULARISE'
                                ? 'var(--color-success-surface)'
                                : obs.statutConstat === 'MAINTENU_CONTENTIEUX'
                                ? 'var(--color-danger-surface)'
                                : 'var(--color-warning-surface)',
                            color:
                              obs.statutConstat === 'CLOS_REGULARISE'
                                ? 'var(--color-success)'
                                : obs.statutConstat === 'MAINTENU_CONTENTIEUX'
                                ? 'var(--color-danger)'
                                : 'var(--color-warning)',
                          }}
                        >
                          {obs.statutConstat === 'CLOS_REGULARISE' && 'Clos / Régularisé'}
                          {obs.statutConstat === 'MAINTENU_CONTENTIEUX' && 'Maintenu Contentieux'}
                          {obs.statutConstat === 'OUVERT' && 'En cours'}
                          {obs.statutConstat === 'EN_ATTENTE_REPONSE' && 'En attente'}
                          {obs.statutConstat === 'REPONSE_RECUE' && 'Réponse reçue'}
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Expanded Body */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: '14px',
                          borderTop: '1px solid var(--color-border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          fontSize: '12px',
                          backgroundColor: 'var(--color-surface)',
                        }}
                      >
                        {/* Faits constatés */}
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '3px' }}>
                            Faits constatés par les vérificateurs :
                          </div>
                          <div style={{ color: 'var(--color-text-primary)', lineHeight: 1.45, backgroundColor: 'var(--color-surface-elevated)', padding: '8px 10px', borderRadius: '6px' }}>
                            {obs.faitsConstates}
                          </div>
                        </div>

                        {/* Questions posées */}
                        {obs.questionsAssujetti && (
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '3px' }}>
                              Demande d’explications notifiée :
                            </div>
                            <div style={{ color: 'var(--color-text-primary)', lineHeight: 1.45, backgroundColor: 'var(--color-surface-elevated)', padding: '8px 10px', borderRadius: '6px' }}>
                              {obs.questionsAssujetti}
                            </div>
                          </div>
                        )}

                        {/* Mémoire en défense reçu */}
                        {obs.defenseRecue && (
                          <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '10px', backgroundColor: 'var(--color-surface-elevated)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)' }}>
                                Mémoire en défense de l’assujetti
                              </span>
                              <span className="font-sf" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                                Reçu le {obs.defenseRecue.dateReception}
                              </span>
                            </div>
                            <div style={{ color: 'var(--color-text-primary)', lineHeight: 1.45, fontSize: '11px' }}>
                              {obs.defenseRecue.arguments}
                            </div>
                            {obs.defenseRecue.piecesJointes && obs.defenseRecue.piecesJointes.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                {obs.defenseRecue.piecesJointes.map((pj, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: 'var(--color-surface)',
                                      border: '1px solid var(--color-border)',
                                      color: 'var(--color-text-secondary)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    <Paperclip size={10} />
                                    {pj}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Analyse motivée de l'inspecteur */}
                        {obs.analyseMotivee && (
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '3px' }}>
                              Analyse motivée de l’inspecteur :
                            </div>
                            <div style={{ color: 'var(--color-text-primary)', lineHeight: 1.45, backgroundColor: 'var(--color-surface-elevated)', padding: '8px 10px', borderRadius: '6px' }}>
                              {obs.analyseMotivee}
                            </div>
                          </div>
                        )}

                        {/* Actions d'arbitrage sur ce constat */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed var(--color-border-subtle)', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            Statut définitif du grief :
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleConstatStatus(selectedFeuille.id, obs.code, 'CLOS_REGULARISE')}
                              style={{
                                padding: '4px 9px',
                                borderRadius: '5px',
                                border: obs.statutConstat === 'CLOS_REGULARISE' ? '1.5px solid var(--color-success)' : '1px solid var(--color-border)',
                                backgroundColor: obs.statutConstat === 'CLOS_REGULARISE' ? 'var(--color-success-surface)' : 'transparent',
                                color: obs.statutConstat === 'CLOS_REGULARISE' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✓ Clos / Régularisé
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleConstatStatus(selectedFeuille.id, obs.code, 'MAINTENU_CONTENTIEUX')}
                              style={{
                                padding: '4px 9px',
                                borderRadius: '5px',
                                border: obs.statutConstat === 'MAINTENU_CONTENTIEUX' ? '1.5px solid var(--color-danger)' : '1px solid var(--color-border)',
                                backgroundColor: obs.statutConstat === 'MAINTENU_CONTENTIEUX' ? 'var(--color-danger-surface)' : 'transparent',
                                color: obs.statutConstat === 'MAINTENU_CONTENTIEUX' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✗ Maintenu au contentieux
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Dossier : <strong className="font-sf">{selectedFeuille.dossierId}</strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeuille(null)}
                className="btn-secondary"
                style={{ padding: '7px 16px', fontSize: '12px' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL : UPLOAD / REMPLACER LE PDF */}
      {/* ======================================================== */}
      {showUploadModal && selectedFeuille && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            backdropFilter: 'blur(3px)',
            padding: '20px',
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
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                Importer le document PDF officiel de la F.O.
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: '12px',
                padding: '30px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--color-surface-elevated)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <FileText size={32} color="var(--color-accent)" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Glissez-déposez le PDF officiel ici
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Format PDF accepté jusqu'à 25 Mo • Signature et cachet DGDA requis
                </div>
              </div>

              {isExtractingPdf ? (
                <div style={{ width: '100%', maxWidth: '280px', marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '6px' }}>
                    Analyse et indexation du document... {extractionProgress}%
                  </div>
                  <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${extractionProgress}%`, height: '100%', backgroundColor: 'var(--color-accent)', transition: 'width 0.2s' }} />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSimulatePdfExtraction('Feuille_Observation_DRK_2026_Signee.pdf')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginTop: '6px',
                  }}
                >
                  Sélectionner un fichier (Simulation)
                </button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '11px' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL : PV D'INFRACTION GLEC */}
      {/* ======================================================== */}
      {showGlecModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 130,
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
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={20} color="var(--color-danger)" />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-danger)', margin: 0 }}>
                    Procès-Verbal d’Infraction Douanière (GLEC)
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Transmission officielle à la Division du Contentieux Douanier (GLEC)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowGlecModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Référence PV GLEC
                  </label>
                  <input
                    type="text"
                    value={glecData.reference}
                    onChange={(e) => setGlecData({ ...glecData, reference: e.target.value })}
                    className="font-sf"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-danger)',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Droits et taxes éludés (USD)
                  </label>
                  <input
                    type="number"
                    value={glecData.droitsEludesUSD}
                    onChange={(e) => setGlecData({ ...glecData, droitsEludesUSD: Number(e.target.value) })}
                    className="font-sf"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-danger)',
                      fontWeight: 800,
                      fontSize: '12px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Amendes légales et pénalités applicables (USD)
                </label>
                <input
                  type="number"
                  value={glecData.amendeUSD}
                  onChange={(e) => setGlecData({ ...glecData, amendeUSD: Number(e.target.value) })}
                  className="font-sf"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-warning)',
                    fontWeight: 800,
                    fontSize: '12px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Qualifications infractionnelles retenues
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {glecData.infractions.map((inf, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '5px',
                        backgroundColor: 'var(--color-surface-elevated)',
                        fontSize: '11px',
                        color: 'var(--color-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={12} color="var(--color-danger)" />
                      <span>{inf}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowGlecModal(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmGlec}
                style={{
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-btn)',
                  backgroundColor: 'var(--color-danger)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Check size={14} />
                <span>Confirmer la transmission au Contentieux GLEC</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
