import { useMemo, useCallback } from 'react';
import type {
  DemandeCommunication, DocumentItem, DossierEnquete, FeuilleObservation, UserAccount,
} from '../types';
import type { WorkspaceData } from '../api/workspace';

export type TechnicalDebtSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type TechnicalDebtCategory =
  | 'BACKEND_CONNECTIVITY'
  | 'IDENTITY_PERMISSIONS'
  | 'UUID_COMPLIANCE'
  | 'CONTRACT_VALIDATION'
  | 'DATA_PERSISTENCE'
  | 'SILENT_ERROR_MASKING';

export interface TechnicalDebtIssue {
  id: string;
  category: TechnicalDebtCategory;
  severity: TechnicalDebtSeverity;
  title: string;
  detail: string;
  recommendation: string;
  affectedEntity?: string;
  contractEndpoint?: string;
}

export interface TechnicalDebtSummary {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  healthScore: number; // 0 to 100
  canPersistDemande: boolean;
  canPersistFeuille: boolean;
  demandeBlockers: string[];
  feuilleBlockers: string[];
  unsyncedDemandesCount: number;
  unsyncedFeuillesCount: number;
  totalLocalEntities: number;
}

export interface TechnicalDebtReport {
  timestamp: string;
  summary: TechnicalDebtSummary;
  issues: TechnicalDebtIssue[];
}

export interface UseTechnicalDebtProps {
  workspace: WorkspaceData | null;
  currentDossier: DossierEnquete | null;
  currentUser: UserAccount;
  demandesParDossier: Record<string, DemandeCommunication[]>;
  feuillesParDossier: Record<string, FeuilleObservation[]>;
  documentsParDossier?: Record<string, DocumentItem[]>;
}

export const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4_REGEX.test(value);
}

/**
 * useTechnicalDebt
 *
 * Hook de diagnostic en temps réel de la dette technique Frontend / Backend.
 * Analyse les ruptures de contrats DRF, les écarts d'identifiants (UUID vs chaînes temporaires),
 * l'absence d'habilitations RBAC ('case.update'), la non-conformité des charges utiles
 * (champs obligatoires, tableaux non vides) et le masquage silencieux d'erreurs par fallback local.
 */
export function useTechnicalDebt({
  workspace,
  currentDossier,
  currentUser,
  demandesParDossier,
  feuillesParDossier,
}: UseTechnicalDebtProps) {

  // Validation d'une charge utile Demande de communication par rapport au contrat DRF POST /api/v1/demandes/
  const validateDemandePayload = useCallback((demande: Partial<DemandeCommunication>, caseId?: string) => {
    const targetCaseId = caseId || demande.dossierId || currentDossier?.id || '';
    const errors: string[] = [];

    if (!isValidUUID(targetCaseId)) {
      errors.push(`Identifiant de dossier invalide (non-UUID): '${targetCaseId}'. Django exige un UUIDv4 existant.`);
    }

    const targetName = demande.destinataire?.nom?.trim();
    if (!targetName) {
      errors.push("Le nom du destinataire ('target_name') est obligatoire.");
    }

    const subject = demande.objet?.trim();
    if (!subject) {
      errors.push("L'objet de la demande ('subject') est obligatoire.");
    }

    const items = demande.elementsDemandes || [];
    if (!items.length) {
      errors.push("Au moins un élément demandé ('items') est exigé par le contrat DRF (allow_empty=False).");
    } else if (items.length > 20) {
      errors.push("Vingt éléments demandés au maximum ('items' <= 20).");
    } else {
      items.forEach((item, idx) => {
        if (!item.libelle?.trim()) {
          errors.push(`L'élément n°${idx + 1} n'a pas de libellé valide ('label').`);
        }
      });
    }

    // Le backend exige qu'une demande naisse obligatoirement à l'état DRAFT ('BROUILLON')
    if (demande.statut && demande.statut !== 'BROUILLON') {
      errors.push("Une nouvelle demande doit obligatoirement être créée avec le statut 'BROUILLON'. La validation et la signature requièrent des actes et transitions d'état distincts.");
    }

    const isBroker = demande.destinataire?.qualite?.toLowerCase().includes('commissionnaire') ||
                     demande.destinataire?.typeCible?.toLowerCase().includes('commissionnaire');

    const drfPayload = {
      case: targetCaseId,
      target_type: isBroker ? 'broker' : 'organization',
      target_name: targetName || '',
      represented_name: demande.destinataire?.representant || demande.destinataire?.pourLeCompteDe || '',
      target_address: demande.destinataire?.adresse || '',
      subject: subject || '',
      legal_basis: demande.baseLegale || 'Code des douanes, Article 46',
      delivery_method: demande.modaliteRemise || 'Transmission électronique et dépôt physique',
      internal_comments: demande.commentairesInternes || '',
      mode: 'generated',
      due_on: demande.echeanceReponse || null,
      items: items.map((el, i) => ({
        label: el.libelle?.trim() || `Élément ${i + 1}`,
        period: el.periodeConcernee || '',
        reason: el.motifExigence || '',
      })),
    };

    return {
      isValid: errors.length === 0,
      errors,
      drfPayload,
    };
  }, [currentDossier]);

  // Validation d'une charge utile Feuille d'observation par rapport au contrat DRF POST /api/v1/feuilles/
  const validateFeuillePayload = useCallback((feuille: Partial<FeuilleObservation>, caseId?: string) => {
    const targetCaseId = caseId || feuille.dossierId || currentDossier?.id || '';
    const errors: string[] = [];

    if (!isValidUUID(targetCaseId)) {
      errors.push(`Identifiant de dossier invalide (non-UUID): '${targetCaseId}'. Django exige un UUIDv4 existant.`);
    }

    const recipient = feuille.destinataire?.trim();
    if (!recipient) {
      errors.push("L'entreprise destinataire ('concerned_party') est obligatoire.");
    }

    const address = feuille.adresse?.trim();
    if (!address) {
      errors.push("L'adresse de notification ('recipient_address') est obligatoire et ne peut être vide.");
    }

    const observations = feuille.observations || [];
    if (!observations.length) {
      errors.push("Au moins une observation ('observations') avec faits constatés est exigée par le contrat DRF (allow_empty=False).");
    } else if (observations.length > 20) {
      errors.push("Vingt observations au maximum autorisées.");
    } else {
      observations.forEach((obs, idx) => {
        const facts = obs.faitsConstates?.trim();
        if (!facts) {
          errors.push(`L'observation n°${idx + 1} n'a pas de faits constatés ('facts').`);
        }
      });
    }

    const origin = feuille.missionId ? 'mission' : 'field';

    const drfPayload = {
      case: targetCaseId,
      origin,
      ...(feuille.missionId ? { mission: feuille.missionId } : {}),
      recipient_address: address || '',
      concerned_party: recipient || '',
      subject: feuille.objetControle || 'Constatations du contrôle a posteriori',
      legal_basis: feuille.cadreLegal || 'Code des douanes - Contrôle différé et a posteriori',
      meeting_on: feuille.dateReunionCloturePrevue || null,
      facts: observations.map((o) => o.faitsConstates || '').join('\n').slice(0, 4000) || 'Constatations relevées lors des vérifications.',
      observations: observations.map((o, idx) => ({
        number: idx + 1,
        facts: (o.faitsConstates || 'Faits constatés').trim(),
        title: (o.titre || '').trim(),
        legal_references: (o.referencesJuridiques || '').trim(),
        questions: (o.questionsAssujetti || '').trim(),
        analysis: (o.analyseMotivee || '').trim(),
        documents: (o.justificatifsAssocies || []).filter((id: string) => isValidUUID(id)),
      })),
    };

    return {
      isValid: errors.length === 0,
      errors,
      drfPayload,
    };
  }, [currentDossier]);

  // Audit global calculé en temps réel
  const report: TechnicalDebtReport = useMemo(() => {
    const issues: TechnicalDebtIssue[] = [];
    const demandeBlockers: string[] = [];
    const feuilleBlockers: string[] = [];

    // 1. Diagnostic Connectivité & Session
    const isConnected = !!workspace;
    if (!isConnected) {
      issues.push({
        id: 'conn-offline',
        category: 'BACKEND_CONNECTIVITY',
        severity: 'CRITICAL',
        title: 'Backend déconnecté ou session non initialisée',
        detail: 'L’espace de travail opère en mode local de secours (fallback). Aucune écriture ne peut atteindre la base PostgreSQL / SQLite.',
        recommendation: 'Authentifiez-vous via l’écran de connexion avec un compte DGDA actif (ex: mukendi, kabamba, tshilumba).',
        contractEndpoint: '/api/v1/session/',
      });
      demandeBlockers.push('Session backend non active');
      feuilleBlockers.push('Session backend non active');
    }

    // 2. Diagnostic Dossier Actif & Format UUID
    const activeCaseId = currentDossier?.id || '';
    const hasActiveCase = !!activeCaseId;
    const isCaseUUID = isValidUUID(activeCaseId);

    if (!hasActiveCase) {
      issues.push({
        id: 'case-none',
        category: 'UUID_COMPLIANCE',
        severity: 'CRITICAL',
        title: 'Aucun dossier actif sélectionné',
        detail: 'Aucun dossier n’est actuellement ciblé dans le contexte d’enquête.',
        recommendation: 'Sélectionnez un dossier dans la liste avant d’émettre des actes.',
      });
      demandeBlockers.push('Aucun dossier sélectionné');
      feuilleBlockers.push('Aucun dossier sélectionné');
    } else if (!isCaseUUID) {
      issues.push({
        id: 'case-invalid-id',
        category: 'UUID_COMPLIANCE',
        severity: 'CRITICAL',
        title: `Identifiant de dossier non conforme (non-UUID): '${activeCaseId}'`,
        detail: `Le dossier sélectionné possède l'identifiant '${activeCaseId}'. Django DRF rejette immédiatement tout POST vers /demandes/ ou /feuilles/ car le modèle Case exige un UUIDv4 strict.`,
        recommendation: 'Basculez sur un dossier réel chargé depuis le backend.',
        affectedEntity: activeCaseId,
        contractEndpoint: '/api/v1/dossiers/',
      });
      demandeBlockers.push(`Dossier courant avec identifiant non-UUID ('${activeCaseId}')`);
      feuilleBlockers.push(`Dossier courant avec identifiant non-UUID ('${activeCaseId}')`);
    } else if (workspace) {
      const caseExistsInBackend = workspace.cases.some((c) => c.id === activeCaseId);
      if (!caseExistsInBackend) {
        issues.push({
          id: 'case-not-in-scope',
          category: 'IDENTITY_PERMISSIONS',
          severity: 'CRITICAL',
          title: `Dossier '${activeCaseId}' absent du périmètre de l’agent`,
          detail: 'L’identifiant est un UUID valide mais ce dossier ne fait pas partie des visible_cases de l’utilisateur authentifié. Les appels API répondront en 404 (Resource not found).',
          recommendation: 'Connectez-vous avec l’agent affecté ou le directeur de l’unité, ou réassignez le dossier.',
          affectedEntity: activeCaseId,
          contractEndpoint: '/api/v1/dossiers/',
        });
        demandeBlockers.push('Dossier hors périmètre utilisateur');
        feuilleBlockers.push('Dossier hors périmètre utilisateur');
      }
    }

    // 3. Diagnostic Habilitations & Permissions RBAC
    const hasCaseUpdate = currentUser.capabilities?.includes('case.update') ||
                          currentUser.role === 'director' ||
                          currentUser.role === 'enqueteur' ||
                          currentUser.role === 'admin';

    if (!hasCaseUpdate) {
      issues.push({
        id: 'rbac-no-case-update',
        category: 'IDENTITY_PERMISSIONS',
        severity: 'CRITICAL',
        title: 'Habilitation requise manquante : case.update',
        detail: `L'utilisateur '${currentUser.prenom} ${currentUser.nom}' (${currentUser.matricule}) n'a pas la permission 'case.update'. Django refusera la création avec HTTP 403 Forbidden.`,
        recommendation: 'Attribuez le rôle d’enquêteur vérificateur ou de directeur dans l’unité du dossier.',
        contractEndpoint: '/api/v1/demandes/ & /api/v1/feuilles/',
      });
      demandeBlockers.push("Habilitation 'case.update' absente");
      feuilleBlockers.push("Habilitation 'case.update' absente");
    }

    // 4. Diagnostic Demandes par dossier
    const currentDemandes = demandesParDossier[activeCaseId] || [];
    let unsyncedDemandes = 0;

    currentDemandes.forEach((demande) => {
      const isDraftDemande = !isValidUUID(demande.id) || demande.id.startsWith('demande-');
      if (isDraftDemande) {
        unsyncedDemandes++;
      }

      if (!demande.elementsDemandes || demande.elementsDemandes.length === 0) {
        issues.push({
          id: `demande-empty-items-${demande.id}`,
          category: 'CONTRACT_VALIDATION',
          severity: 'CRITICAL',
          title: `Demande '${demande.reference || demande.id}' sans éléments demandés`,
          detail: 'Le contrat DRF RequestCreateSerializer impose au moins 1 élément (allow_empty=False).',
          recommendation: 'Ajouter au moins un élément avec libellé.',
          affectedEntity: demande.id,
          contractEndpoint: '/api/v1/demandes/',
        });
      }

      if (demande.statut === 'EMISE' && isDraftDemande) {
        issues.push({
          id: `demande-invalid-status-${demande.id}`,
          category: 'CONTRACT_VALIDATION',
          severity: 'WARNING',
          title: `Demande locale '${demande.id}' marquée EMISE sans cycle de vie officiel`,
          detail: 'Dans le backend, une demande ne peut être créée directement à l’état émis sans passer par les transitions : DRAFT -> SUBMITTED -> VALIDATED -> SIGNED -> ISSUED.',
          recommendation: 'Créer la demande en BROUILLON puis suivre le workflow de visa et constatation.',
          affectedEntity: demande.id,
          contractEndpoint: '/api/v1/demandes/',
        });
      }
    });

    if (unsyncedDemandes > 0) {
      issues.push({
        id: 'demandes-unsynced-drift',
        category: 'DATA_PERSISTENCE',
        severity: 'WARNING',
        title: `${unsyncedDemandes} demande(s) de communication non persistée(s) en base`,
        detail: 'Ces demandes n’existent que dans le state React mémoire ou localStorage et disparaîtront au prochain rechargement complet.',
        recommendation: 'Déclencher la création API sur un dossier backend avec les paramètres conformes.',
      });
    }

    // 5. Diagnostic Feuilles d'observation par dossier
    const currentFeuilles = feuillesParDossier[activeCaseId] || [];
    let unsyncedFeuilles = 0;

    currentFeuilles.forEach((feuille) => {
      const isDraftFeuille = !isValidUUID(feuille.id) || feuille.id.startsWith('fo-');
      if (isDraftFeuille) {
        unsyncedFeuilles++;
      }

      const obsCount = (feuille.observations || []).length;
      if (obsCount === 0) {
        issues.push({
          id: `feuille-empty-obs-${feuille.id}`,
          category: 'CONTRACT_VALIDATION',
          severity: 'CRITICAL',
          title: `Feuille '${feuille.reference || feuille.id}' sans observations`,
          detail: 'Le contrat DRF SheetInputSerializer exige au minimum une observation avec faits constatés non vides (allow_empty=False).',
          recommendation: 'Renseigner au moins un constat précis avant soumission.',
          affectedEntity: feuille.id,
          contractEndpoint: '/api/v1/feuilles/',
        });
      }

      const address = feuille.adresse?.trim();
      if (!address) {
        issues.push({
          id: `feuille-blank-addr-${feuille.id}`,
          category: 'CONTRACT_VALIDATION',
          severity: 'WARNING',
          title: `Feuille '${feuille.reference || feuille.id}' avec adresse vide`,
          detail: "Le champ 'recipient_address' est obligatoire dans le modèle Django ObservationSheet.",
          recommendation: 'Fournir l’adresse physique ou légale de l’assujetti.',
          affectedEntity: feuille.id,
          contractEndpoint: '/api/v1/feuilles/',
        });
      }
    });

    if (unsyncedFeuilles > 0) {
      issues.push({
        id: 'feuilles-unsynced-drift',
        category: 'DATA_PERSISTENCE',
        severity: 'WARNING',
        title: `${unsyncedFeuilles} feuille(s) d’observation non persistée(s) en base`,
        detail: 'Ces feuilles ont un identifiant local et n’ont pas été enregistrées dans la base PostgreSQL / SQLite.',
        recommendation: 'Créer la feuille via le contrat POST /api/v1/feuilles/ sur un dossier réel.',
      });
    }

    // 6. Diagnostic Masquage Silencieux d'erreurs
    issues.push({
      id: 'silent-catch-alert',
      category: 'SILENT_ERROR_MASKING',
      severity: 'INFO',
      title: 'Sécurité de persistance : interception explicite des erreurs requise',
      detail: 'Les blocs try/catch doivent afficher les messages d’erreur réels retournés par DRF au lieu de simplement consigner un console.warn et simuler un succès local.',
      recommendation: 'Lever une notification d’erreur utilisateur avec le motif exact retourné par le serveur Django.',
    });

    // Synthèse et calcul du score de santé (Health Score)
    const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
    const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
    const infoCount = issues.filter((i) => i.severity === 'INFO').length;

    // Déduction des points : critique -25pts, warning -10pts, info -2pts
    const calculatedScore = Math.max(0, 100 - criticalCount * 25 - warningCount * 10 - infoCount * 2);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        criticalCount,
        warningCount,
        infoCount,
        healthScore: calculatedScore,
        canPersistDemande: demandeBlockers.length === 0,
        canPersistFeuille: feuilleBlockers.length === 0,
        demandeBlockers,
        feuilleBlockers,
        unsyncedDemandesCount: unsyncedDemandes,
        unsyncedFeuillesCount: unsyncedFeuilles,
        totalLocalEntities: unsyncedDemandes + unsyncedFeuilles,
      },
      issues,
    };
  }, [workspace, currentDossier, currentUser, demandesParDossier, feuillesParDossier]);

  return {
    report,
    summary: report.summary,
    issues: report.issues,
    validateDemandePayload,
    validateFeuillePayload,
    isValidUUID,
  };
}
