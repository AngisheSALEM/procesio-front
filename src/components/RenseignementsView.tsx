import React, { useState } from 'react';
import {
  Search,
  Plus,
  ArrowLeft,
  ExternalLink,
  X,
  CheckCircle,
  Briefcase,
  Upload
} from 'lucide-react';
import type {
  RenseignementItem,
  UserAccount,
  Priorite,
  DossierEnquete,
  DemandeCommunication,
  FeuilleObservation,
  PvDetail
} from '../types';
import {
  mockRenseignements,
  mockDossiers,
  mockDemandesParDossier,
  mockFeuillesParDossier,
  mockPvsParDossier
} from '../data/mockData';

interface RenseignementsViewProps {
  renseignements?: RenseignementItem[];
  currentUser: UserAccount;
  onOpenDossier: (dossierId: string) => void;
  onCreateDossier: (dossierData: any, renseignementId?: string) => void;
  onAddRenseignement?: (item: RenseignementItem) => void;
  onUpdateRenseignement?: (item: RenseignementItem) => void;
  dossiers?: DossierEnquete[];
  demandesParDossier?: Record<string, any>;
  feuillesParDossier?: Record<string, any>;
  pvsParDossier?: Record<string, any>;
}

export const RenseignementsView: React.FC<RenseignementsViewProps> = ({
  renseignements = mockRenseignements,
  currentUser,
  onOpenDossier,
  onCreateDossier,
  onAddRenseignement,
  onUpdateRenseignement,
  dossiers = mockDossiers,
  demandesParDossier = mockDemandesParDossier,
  feuillesParDossier = mockFeuillesParDossier,
  pvsParDossier = mockPvsParDossier,
}) => {
  const [items, setItems] = useState<RenseignementItem[]>(renseignements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'TOUS' | 'DOUANE' | 'RAPPORT' | 'OPINION'>('TOUS');
  const [showCreateRenseignementModal, setShowCreateRenseignementModal] = useState(false);
  const [showCreateDossierModal, setShowCreateDossierModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync internal items if prop updates
  React.useEffect(() => {
    setItems(renseignements);
  }, [renseignements]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Inspecteurs disponibles pour affectation
  const inspecteursDisponibles = [
    'Inspecteur Marc Kabamba (Chef de brigade)',
    'Inspecteur Patrick Kalonji (Vérificateur)',
    'Inspecteur Sarah Mutombo (Vérificateur)',
    'Inspecteur Jean-Paul Ilunga (Enquêteur senior)',
    'Inspecteur Adjoint Mireille Kabamba (Vérificateur)',
    'Contrôleur David Mwamba (Section Exonérations)',
  ];

  // Formulaire de Nouveau Renseignement (source, objet, pièces disponibles avec upload, priorité, affectation à qui)
  const [formSource, setFormSource] = useState('Douane');
  const [formObjet, setFormObjet] = useState('');
  const [formPiecesDisponibles, setFormPiecesDisponibles] = useState('');
  const [formUploadedFiles, setFormUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [formPriorite, setFormPriorite] = useState<'NORMALE' | 'URGENTE' | 'SIGNALEE'>('NORMALE');
  const [formAffectation, setFormAffectation] = useState(inspecteursDisponibles[0]);
  const [formInstructions, setFormInstructions] = useState('');

  // Formulaire de Création de Dossier
  const [dossierNom, setDossierNom] = useState('');
  const [dossierNif, setDossierNif] = useState('A1099882Z');
  const [dossierRccm, setDossierRccm] = useState('CD/LSH/RCCM/24-B-00812');
  const [dossierTypeCible, setDossierTypeCible] = useState('Entreprise commerciale');
  const [dossierPourLeCompteDe, setDossierPourLeCompteDe] = useState('');
  const [dossierAdresse, setDossierAdresse] = useState('04 Avenue des Métaux, Quartier Industriel, Lubumbashi');
  const [dossierObjet, setDossierObjet] = useState('');
  const [dossierResponsable, setDossierResponsable] = useState('');
  const [dossierPriorite, setDossierPriorite] = useState<Priorite>('NORMALE');
  const [dossierEcheance, setDossierEcheance] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Filtrage selon le rôle : l'inspecteur ne voit que les renseignements qui lui sont affectés
  const visibleItems = items.filter((r) => {
    if (currentUser.role === 'admin') return true;
    const nom = currentUser.nom.toLowerCase();
    return r.coteA && r.coteA.toLowerCase().includes(nom);
  });

  // Filtrage par recherche et source
  const filteredItems = visibleItems.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.reference.toLowerCase().includes(q) ||
      r.objet.toLowerCase().includes(q) ||
      r.origine.toLowerCase().includes(q) ||
      (r.coteA && r.coteA.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (sourceFilter === 'DOUANE' && !r.origine.toLowerCase().includes('douane') && !r.origine.toLowerCase().includes('balisage')) {
      return false;
    }
    if (sourceFilter === 'RAPPORT' && !r.origine.toLowerCase().includes('rapport') && !r.origine.toLowerCase().includes('section')) {
      return false;
    }
    if (sourceFilter === 'OPINION' && !r.origine.toLowerCase().includes('signalement') && !r.origine.toLowerCase().includes('dénonciation') && !r.origine.toLowerCase().includes('opinion')) {
      return false;
    }

    return true;
  });

  // Renseignement actuellement sélectionné pour la page de détail
  const selectedRenseignement = selectedId
    ? items.find((r) => r.id === selectedId) || null
    : null;

  const handleUploadedFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const list: { name: string; size: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        list.push({
          name: f.name,
          size: `${Math.round(f.size / 1024)} Ko`,
        });
      }
      setFormUploadedFiles((prev) => [...prev, ...list]);
    }
  };

  // Création d'une nouvelle demande de renseignement
  const handleCreateRenseignementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formObjet.trim()) return;

    const todayDate = new Date().toISOString().split('T')[0];
    const newId = `RN-${new Date().getFullYear()}-0${Math.floor(100 + Math.random() * 900)}`;
    const newRef = `DGDA/DRK/REN/${new Date().getFullYear()}/${newId.split('-')[2]}`;

    const uploadedPieces = formUploadedFiles.map((f) => `${f.name} (${f.size})`);
    const textPieces = formPiecesDisponibles
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const piecesArray = [...uploadedPieces, ...textPieces];

    const newItem: RenseignementItem = {
      id: newId,
      reference: newRef,
      dateReception: todayDate,
      origine: formSource,
      objet: formObjet.trim(),
      resume: formObjet.trim(),
      piecesDisponibles: piecesArray,
      niveauAcces: 'Diffusion Restreinte',
      serviceDestinataire: 'Division des Recherches & Enquêtes Douanières',
      statut: 'Enregistré & Affecté',
      dossiersLies: [],
      cotePar: `${currentUser.grade} ${currentUser.prenom} ${currentUser.nom}`,
      coteA: formAffectation,
      dateCotation: todayDate,
      degreFiabilite: 'B2 — Source qualifiée, faits à vérifier',
      priorite: formPriorite,
      instructionCotation: formInstructions.trim() || 'Enregistrer, qualifier et procéder aux investigations préalables.',
      delaiPrescritJours: formPriorite === 'URGENTE' ? 7 : 15,
      effetProduit: 'EN_EVALUATION',
      effetDescription: 'Renseignement qualifié et affecté à l’agent désigné. Instruction en cours.',
      cycleEvolution: [
        {
          etape: '1. Enregistrement de la demande de renseignement',
          date: todayDate,
          acteur: `${currentUser.grade} ${currentUser.nom}`,
          statut: 'TERMINE',
          commentaire: `Renseignement enregistré depuis la source : ${formSource}.`,
        },
        {
          etape: '2. Qualification & Affectation à l’agent',
          date: todayDate,
          acteur: formAffectation,
          statut: 'TERMINE',
          commentaire: `Dossier et pièces orientés vers ${formAffectation}.`,
        },
        {
          etape: '3. Ouverture du dossier d’enquête',
          date: 'En attente',
          acteur: formAffectation,
          statut: 'A_VENIR',
          commentaire: 'Création du dossier d’enquête contradictoire.',
        },
      ],
    };

    setItems((prev) => [newItem, ...prev]);
    onAddRenseignement?.(newItem);
    setShowCreateRenseignementModal(false);

    // Réinitialiser le formulaire
    setFormObjet('');
    setFormPiecesDisponibles('');
    setFormUploadedFiles([]);
    setFormInstructions('');

    // Basculer directement sur la page de détail du nouveau renseignement
    setSelectedId(newItem.id);
    showToast(`Renseignement ${newItem.reference} enregistré et affecté.`);
  };

  // Ouverture du modal de création de dossier pré-rempli
  const handleOpenCreateDossierModal = () => {
    if (!selectedRenseignement) return;

    // Détection éventuelle du nom de l'entreprise dans l'objet
    let defaultNom = 'ENTREPRISE CONTRÔLÉE SAS';
    const mots = selectedRenseignement.objet.split(' ');
    if (mots.length > 2) {
      defaultNom = mots.slice(0, 3).join(' ').toUpperCase().replace(/[^A-Z\s]/g, '');
      if (defaultNom.length < 5) defaultNom = 'SOCIÉTÉ CONTRÔLÉE SARL';
    }

    setDossierNom(defaultNom);
    setDossierObjet(selectedRenseignement.objet);
    setDossierResponsable(selectedRenseignement.coteA || `${currentUser.grade} ${currentUser.nom}`);
    setDossierPriorite((selectedRenseignement.priorite as Priorite) || 'NORMALE');
    setShowCreateDossierModal(true);
  };

  // Soumission de la création de dossier depuis le renseignement
  const handleCreateDossierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRenseignement || !dossierNom.trim()) return;

    const newDossierData = {
      reference: `DGDA/DRK/DIR-ENQ/${new Date().getFullYear()}/08${Math.floor(50 + Math.random() * 49)}`,
      objet: dossierObjet.trim(),
      perimetre: `Contrôle contradictoire issu du renseignement ${selectedRenseignement.reference} (Origine : ${selectedRenseignement.origine})`,
      motifOuverture: `Ouverture consécutive à l’exploitation du renseignement qualifié ${selectedRenseignement.reference}`,
      unite: 'Direction des Recherches et Enquêtes Douanières (DRK)',
      responsable: dossierResponsable.trim() || selectedRenseignement.coteA || `${currentUser.grade} ${currentUser.nom}`,
      statut: 'EN_COURS' as const,
      priorite: dossierPriorite,
      echeance: dossierEcheance,
      prochaineAction: 'Émettre la réquisition de communication de pièces',
      dateCreation: new Date().toISOString().split('T')[0],
      entiteControlee: {
        nom: dossierNom.trim().toUpperCase(),
        rccm: dossierRccm.trim(),
        nif: dossierNif.trim().toUpperCase(),
        typeEntite: (dossierTypeCible as any) || ('Société commerciale' as const),
        typeCible: dossierTypeCible,
        pourLeCompteDe: dossierPourLeCompteDe.trim() || undefined,
        roleDansDossier: 'Entreprise contrôlée' as const,
        adresse: dossierAdresse.trim() || '04 Avenue des Métaux, Quartier Industriel, Lubumbashi',
        contact: 'direction@entreprise.cd',
      },
    };

    const updatedR: RenseignementItem = {
      ...selectedRenseignement,
      statut: 'Dossier d’enquête ouvert',
      effetProduit: 'ENQUETE_EN_COURS',
      dossiersLies: [...(selectedRenseignement.dossiersLies || []), newDossierData.reference],
    };

    setItems((prev) => prev.map((r) => (r.id === selectedRenseignement.id ? updatedR : r)));
    onUpdateRenseignement?.(updatedR);

    setShowCreateDossierModal(false);
    onCreateDossier(newDossierData, selectedRenseignement.id);
  };

  // =========================================================================
  // 1. PAGE DÉTAIL DÉDIÉE DU RENSEIGNEMENT (PAS DE MODAL)
  // =========================================================================
  if (selectedRenseignement) {
    const hasDossier = selectedRenseignement.dossiersLies && selectedRenseignement.dossiersLies.length > 0;
    const pieces = selectedRenseignement.piecesDisponibles || [];

    const linkedDossier = dossiers.find((d) =>
      selectedRenseignement.dossiersLies && (
        selectedRenseignement.dossiersLies.includes(d.id) ||
        selectedRenseignement.dossiersLies.includes(d.reference)
      )
    ) || null;

    const rawDemandes = linkedDossier ? demandesParDossier[linkedDossier.id] : [];
    const linkedDemandes: DemandeCommunication[] = Array.isArray(rawDemandes)
      ? rawDemandes
      : (rawDemandes ? [rawDemandes] : []);

    const rawFeuilles = linkedDossier ? feuillesParDossier[linkedDossier.id] : [];
    const linkedFeuilles: FeuilleObservation[] = Array.isArray(rawFeuilles)
      ? rawFeuilles
      : (rawFeuilles ? [rawFeuilles] : []);

    const rawPvs = linkedDossier ? pvsParDossier[linkedDossier.id] : [];
    const linkedPvs: PvDetail[] = Array.isArray(rawPvs)
      ? rawPvs
      : (rawPvs ? [rawPvs] : []);

    // Statut demande de communication
    let demandeStatusText = 'Non lancée';
    let demandeStatusDetail = 'Aucune réquisition de communication émise';
    if (linkedDemandes.length > 0) {
      const d = linkedDemandes[0];
      if (d.evaluationReponse === 'SATISFAISANTE') {
        demandeStatusText = 'Réponse satisfaisante';
        demandeStatusDetail = `Justificatifs conformes (${d.reference}) — Clôture sans suite`;
      } else if (d.evaluationReponse === 'NON_SATISFAISANTE') {
        demandeStatusText = 'Réponse non satisfaisante';
        demandeStatusDetail = `Défaut de justificatifs (${d.reference}) — Feuille d’observation requise`;
      } else if (d.statut === 'REPONSE_COMPLETE') {
        demandeStatusText = 'Réponse reçue';
        demandeStatusDetail = `Réponse enregistrée (${d.reference}) — En cours d’évaluation`;
      } else {
        demandeStatusText = 'Émise & Notifiée';
        demandeStatusDetail = `Réquisition notifiée (${d.reference}) — Réponse attendue`;
      }
    }

    // Statut feuille d'observation
    let feuilleStatusText = 'Non initiée';
    let feuilleStatusDetail = 'Aucune feuille d’observation contradictoire';
    if (linkedFeuilles.length > 0) {
      const f = linkedFeuilles[0];
      if (f.decisionFinale === 'CLASSE_SANS_SUITE') {
        feuilleStatusText = 'Satisfaite & Clôturée';
        feuilleStatusDetail = `Constats levés (${f.reference}) — Dossier classé sans suite`;
      } else if (f.decisionFinale === 'PV_INFRACTION_GLEC') {
        feuilleStatusText = 'Contradictoire clos — PV dressé';
        feuilleStatusDetail = `Infractions retenues (${f.reference})`;
      } else {
        feuilleStatusText = 'Notifiée — En cours';
        feuilleStatusDetail = `Feuille notifiée (${f.reference}) — Audition contradictoire`;
      }
    }

    // Statut procès-verbal
    let pvStatusText = 'Aucun PV dressé';
    let pvStatusDetail = 'Aucune infraction répressive actée';
    if (linkedPvs.length > 0) {
      pvStatusText = 'Dressé & Transmis';
      pvStatusDetail = `PV n° ${linkedPvs[0].reference} transmis au contentieux`;
    } else if (linkedDossier && linkedDossier.hasPv) {
      pvStatusText = 'Dressé & Transmis';
      pvStatusDetail = 'Procès-verbal d’infraction transmis au contentieux';
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              padding: '12px 18px',
              borderRadius: 'var(--radius-card)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 9999,
            }}
          >
            <CheckCircle size={16} color="var(--color-accent)" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Bouton Retour vers la liste */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            <ArrowLeft size={16} />
            <span>Retour aux renseignements</span>
          </button>
        </div>

        {/* Page Info Épurée : Renseignement Sélectionné */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border-subtle)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* En-tête de la Page Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              
              paddingBottom: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Fiche de Renseignement Douanier
                </span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px', margin: '4px 0 0 0' }}>
                {selectedRenseignement.objet}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                Reçu et enregistré le {selectedRenseignement.dateReception} • Statut : {selectedRenseignement.statut}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {hasDossier ? (
                <button
                  type="button"
                  onClick={() => onOpenDossier(selectedRenseignement.dossiersLies[0])}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>Consulter le dossier d’enquête rattaché</span>
                  <ExternalLink size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCreateDossierModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Briefcase size={14} />
                  <span>Création du dossier</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 1 : Origine & Affectation */}
          <div style={{ gap: '16px' }}>
            <div style={{ backgroundColor: 'none', border: 'none', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Source d’origine
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '6px' }}>
                {selectedRenseignement.origine}
              </div>
            
            </div>

            <div style={{ backgroundColor: 'none', border: 'none', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Agent désigné / Affecté à
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '6px' }}>
                {selectedRenseignement.coteA || 'En attente de cotation'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Coté par : {selectedRenseignement.cotePar || 'Direction Provinciale'}
              </div>
            </div>

            <div style={{ backgroundColor: 'none', border: 'none', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Niveau de priorité & Délai
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '6px' }}>
                {selectedRenseignement.priorite || 'NORMALE'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Délai d’instruction prescrit : {selectedRenseignement.delaiPrescritJours || 15} jours
              </div>
            </div>
          </div>

          

          {/* Section 2 : Objet & Qualification de l'information */}
          <div style={{ backgroundColor: 'none', border: 'none', padding: '20px' }}>
            {/* <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Objet & Faits Signalés
            </div> */}
            {/* <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 600, marginTop: '8px', lineHeight: 1.5 }}>
              {selectedRenseignement.objet}
            </div> */}

            {/* {selectedRenseignement.resume && selectedRenseignement.resume !== selectedRenseignement.objet && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '10px', lineHeight: 1.5 }}>
                {selectedRenseignement.resume}
              </div>
            )} */}

            {selectedRenseignement.instructionCotation && (
              <div style={{ marginTop: '14px', paddingTop: '14px', fontSize: '12px' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Instruction de commandement : </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{selectedRenseignement.instructionCotation}</span>
              </div>
            )}
          </div>

          {/* Section 3 : Pièces Disponibles */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-card)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Pièces Disponibles & Documents Justificatifs
            </div>

            {pieces.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Aucun fichier n'y est associé
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pieces.map((piece, idx) => (
                  <div key={idx} style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    • {piece}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4 : Suivi jusqu'à son issue & État du dossier lié */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-card)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Suivi Procédural & État du Dossier Lié
              </div>
            </div>

            {/* Suivi des actes du dossier lié */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Demande de communication :</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{demandeStatusText} — {demandeStatusDetail}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Feuille d'observation :</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{feuilleStatusText} — {feuilleStatusDetail}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Procès-verbal :</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{pvStatusText} — {pvStatusDetail}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(selectedRenseignement.cycleEvolution || [
                {
                  etape: '1. Réception & Enregistrement',
                  date: selectedRenseignement.dateReception,
                  acteur: selectedRenseignement.cotePar || 'Directeur Provincial',
                  statut: 'TERMINE' as const,
                  commentaire: 'Fiche enregistrée au registre DRK.',
                },
                {
                  etape: '2. Qualification & Affectation',
                  date: selectedRenseignement.dateCotation || selectedRenseignement.dateReception,
                  acteur: selectedRenseignement.coteA || 'Inspecteur vérificateur',
                  statut: 'TERMINE' as const,
                  commentaire: 'Information cotée et transmise à l’agent désigné.',
                },
                {
                  etape: hasDossier ? '3. Dossier d’enquête ouvert' : '3. Ouverture du dossier d’enquête',
                  date: hasDossier ? 'Effectué' : 'À venir',
                  acteur: selectedRenseignement.coteA || 'Inspecteur',
                  statut: hasDossier ? ('TERMINE' as const) : ('A_VENIR' as const),
                  commentaire: hasDossier ? 'Le dossier contradictoire a été initié.' : 'Attente du déclenchement du dossier.',
                },
              ]).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: item.statut === 'TERMINE' ? 'var(--color-surface-elevated)' : 'transparent',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {idx + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {item.etape}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {item.date}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Acteur : {item.acteur}
                    </div>
                    {item.commentaire && (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {item.commentaire}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Bas de page si pas encore de dossier */}
          {!hasDossier && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
         

           
            </div>
          )}
        </div>

        {/* Modal de Création de Dossier depuis le Renseignement */}
        {showCreateDossierModal && (
          <div
            className="modal-backdrop-responsive"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <div
              className="modal-card-responsive"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--color-border)',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                    Création du Dossier d’Enquête
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Ouverture consécutive au renseignement {selectedRenseignement.reference}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateDossierModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateDossierSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Opérateur ou entreprise assujettie au contrôle *
                  </label>
                  <input
                    type="text"
                    required
                    value={dossierNom}
                    onChange={(e) => setDossierNom(e.target.value)}
                    placeholder="Ex : CONGO MINING LOGISTICS SAS"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      NIF
                    </label>
                    <input
                      type="text"
                      value={dossierNif}
                      onChange={(e) => setDossierNif(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      RCCM
                    </label>
                    <input
                      type="text"
                      value={dossierRccm}
                      onChange={(e) => setDossierRccm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Type de cible & Pour le compte de */}
                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Type de cible
                    </label>
                    <select
                      value={dossierTypeCible}
                      onChange={(e) => setDossierTypeCible(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    >
                      <option value="Entreprise commerciale">Entreprise commerciale</option>
                      <option value="Commissionnaire en douane">Commissionnaire en douane</option>
                      <option value="Organisation non gouvernementale">Organisation non gouvernementale</option>
                      <option value="Autre catégorie validée">Autre catégorie validée</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Pour le compte de (optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Si commissionnaire ou déclarant..."
                      value={dossierPourLeCompteDe}
                      onChange={(e) => setDossierPourLeCompteDe(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Champ Adresse géographique */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Adresse géographique de l'entité *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : 04 Avenue des Métaux, Quartier Industriel, Lubumbashi"
                    value={dossierAdresse}
                    onChange={(e) => setDossierAdresse(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Objet de l’enquête contradictoire *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={dossierObjet}
                    onChange={(e) => setDossierObjet(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Responsable désigné
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={dossierResponsable}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-surface-muted)',
                        border: '1px solid var(--color-border-subtle)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Échéance légale initiale
                    </label>
                    <input
                      type="date"
                      required
                      value={dossierEcheance}
                      onChange={(e) => setDossierEcheance(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateDossierModal(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-accent)',
                      border: 'none',
                      color: 'var(--color-on-accent)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Créer et ouvrir le dossier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. VUE PRINCIPALE : TABLEAU DES RENSEIGNEMENTS
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-card)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
          }}
        >
          <CheckCircle size={16} color="var(--color-accent)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              Renseignements Douaniers
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-accent)',
                fontFamily: 'SF Mono, monospace',
              }}
            >
              {visibleItems.length} enregistrements
            </span>
          </div>
        </div>

        {/* Bouton Nouvelle Demande de Renseignement (Admin) */}
        {currentUser.role === 'admin' && (
          <button
            type="button"
            onClick={() => setShowCreateRenseignementModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-btn)',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-on-accent)',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            <span>Nouvelle demande de renseignement</span>
          </button>
        )}
      </div>

      {/* Barre de Filtres et Recherche */}
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
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        {/* Recherche */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={14} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Rechercher par référence, origine, objet, agent affecté..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        {/* Pilules de Filtrage par Source */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { id: 'TOUS', label: `Tous (${visibleItems.length})` },
            { id: 'DOUANE', label: 'Douane' },
            { id: 'RAPPORT', label: 'Rapports de service' },
            { id: 'OPINION', label: 'Informations de l’opinion' },
          ].map((tab) => {
            const isSelected = sourceFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSourceFilter(tab.id as any)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-surface-elevated)',
                  color: isSelected ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tableau des Renseignements */}
      <div
        className="responsive-table-container"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          overflowX: 'auto',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface)',
          
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              <th style={{ padding: '12px 16px' }}>Date</th>
              <th style={{ padding: '12px 16px' }}>Origine & Source</th>
              <th style={{ padding: '12px 16px' }}>Priorité</th>
              <th style={{ padding: '12px 16px' }}>Agent Affecté</th>
              <th style={{ padding: '12px 16px' }}>Statut </th>
              
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucun renseignement trouvé.
                </td>
              </tr>
            ) : (
              filteredItems.map((ren) => (
                <tr
                  key={ren.id}
                  onClick={() => setSelectedId(ren.id)}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background var(--transition-fast)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Date */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      {ren.dateReception}
                    </div>
                   
                  </td>

                  {/* Origine & Source */}
                  <td style={{ padding: '12px 16px', maxWidth: '220px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '12px' }}>
                      {ren.origine}
                    </div>
                  </td>

                  

                  {/* Priorité */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {ren.priorite || 'Normale'}
                    </span>
                  </td>

                  {/* Agent affecté */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {ren.coteA || 'Non coté'}
                    </div>

                  </td>

                  {/* Statut & Issue */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {ren.dossiersLies && ren.dossiersLies.length > 0
                        ? `Dossier ouvert `
                        : ren.effetProduit === 'CLASSE_SANS_SUITE'
                        ? 'Classé sans suite'
                        : 'En cours d’instruction'}
                    </span>
                  </td>

                  {/* Action */}
                
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal : Nouvelle Demande de Renseignement (Admin) */}
      {showCreateRenseignementModal && (
        <div
          className="modal-backdrop-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="modal-card-responsive"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              width: '100%',
              maxWidth: '580px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  Nouvelle Demande de Renseignement
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Enregistrement, qualification et affectation de l’information à l'agent
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateRenseignementModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRenseignementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Source / Origine */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Source d’origine du renseignement *
                </label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="Douane )">Douane </option>
                  <option value="Rapport de service administratif">Rapport de service administratif</option>
                  <option value="Informations de l’opinion">Informations de l’opinion </option>
                
                </select>
              </div>

              {/* Objet */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Objet du renseignement *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex : Signalement sur minoration de fret et sous-évaluation de valeur en douane sur importation de réactifs..."
                  value={formObjet}
                  onChange={(e) => setFormObjet(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Pièces disponibles & Documents justificatifs avec Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Pièces disponibles & Documents justificatifs
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    marginBottom: '6px',
                  }}
                >
                  <Upload size={14} color="var(--color-text-muted)" />
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                    onChange={handleUploadedFilesChange}
                    style={{ fontSize: '12px', color: 'var(--color-text-secondary)', flex: 1 }}
                  />
                </div>

                {formUploadedFiles.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '6px' }}>
                    {formUploadedFiles.map((f, i) => (
                      <div key={i} style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
                        • {f.name} ({f.size})
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '6px' }}>
                    Aucun fichier n'y est associé
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Désignation ou inventaire complémentaire (optionnel)..."
                  value={formPiecesDisponibles}
                  onChange={(e) => setFormPiecesDisponibles(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Niveau de priorité (Date prise automatiquement à la date du jour) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Niveau de priorité
                </label>
                <select
                  value={formPriorite}
                  onChange={(e) => setFormPriorite(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="NORMALE">Normale (15 jours)</option>
                  <option value="URGENTE">Urgente (7 jours)</option>
                  <option value="SIGNALEE">Signalée (20 jours)</option>
                </select>
              </div>

              {/* Affectation à qui (Agent désigné) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Affectation à qui (Inspecteur ou Agent désigné) *
                </label>
                <select
                  value={formAffectation}
                  onChange={(e) => setFormAffectation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  {inspecteursDisponibles.map((insp) => (
                    <option key={insp} value={insp}>
                      {insp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instructions de commandement */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Instruction de qualification préalable
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex : Vérifier les quittances d'apurement et préparer l'ouverture du dossier d'enquête contradictoire..."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateRenseignementModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    border: 'none',
                    color: 'var(--color-on-accent)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Enregistrer et affecter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenseignementsView;
