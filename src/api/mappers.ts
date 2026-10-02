import type {
  DemandeCommunication, DocumentItem, DossierEnquete, FeuilleObservation,
  RenseignementItem, UserAccount,
} from '../types';
import type {
  ApiAssessment, ApiDefense, ApiObservationAssessment, ApiDecision, ApiCase, ApiDocument, ApiIntelligence, ApiRequest, ApiResponse, ApiSheet, ApiUser,
} from './client';

export function userAccount(user: ApiUser, role = user.memberships[0]?.role): UserAccount {
  const prenom = user.first_name || '';
  const nom = user.last_name || user.username;
  return {
    capabilities: [...new Set(user.memberships.flatMap((membership) => membership.capabilities || []))],
    id: String(user.id), prenom, nom, email: user.email || '', matricule: user.matricule || '',
    role: role === 'manager' ? 'director' : 'enqueteur', grade: user.grade || (role === 'manager' ? 'Directeur / Chef de Division' : 'Inspecteur Vérificateur'),
    unite: user.memberships[0]?.unit.name || '',
    avatarInitials: `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase(),
  };
}

export function latestVersion<T extends { version: number }>(rows: T[]): T | undefined {
  return rows.reduce<T | undefined>((latest, row) => !latest || row.version > latest.version ? row : latest, undefined);
}

function agentName(id: number, agents: ApiUser[], fallback = ''): string {
  const agent = agents.find((user) => user.id === id);
  return agent ? `${agent.first_name} ${agent.last_name}`.trim() || agent.username : fallback;
}

export function dossierFromApi(item: ApiCase, agents: ApiUser[], unitNames: Map<string, string>, decisions: ApiDecision[] = []): DossierEnquete {
  const entity = item.controlled_entity || {};
  const dateCreation = item.created_at.slice(0, 10);
  const current = [...decisions].sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id)).find((decision) => decision.state === 'validated') || item.current_decision || undefined;
  const classification = current?.kind === 'classification' ? current : undefined;
  return {
    id: item.id, reference: item.reference,
    objet: item.object || '', perimetre: item.perimeter || '', motifOuverture: item.opening_reason || '',
    unite: unitNames.get(item.unit) || item.unit_code,
    responsable: agentName(item.assignee, agents, item.assignee_username),
    capabilities: item.capabilities || [],
    statut: item.status === 'open' ? 'OUVERT' : 'EN_COURS',
    decisionCloture: classification ? 'CLASSE_SANS_SUITE' : undefined,
    decisionCourante: current ? { id: current.id, kind: current.kind, reason: current.reason } : undefined,
    motifClassement: classification?.reason, dateCloture: classification?.validated_at?.slice(0, 10),
    decisions: [...decisions].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((decision) => ({
      id: decision.id, kind: decision.kind, state: decision.state, reason: decision.reason,
      date: decision.validated_at || decision.created_at,
    })),
    priorite: item.priority === 'urgent' ? 'URGENTE' : item.priority === 'flagged' ? 'SIGNALEE' : 'NORMALE',
    echeance: item.deadline || '', prochaineAction: item.next_action,
    dateCreation, horodatageCreation: item.created_at,
    entiteControlee: {
      nom: entity.nom || '', rccm: entity.rccm || '', nif: entity.nif || '',
      typeEntite: entity.type_entite || '', roleDansDossier: (entity.role_dans_dossier || 'Entreprise contrôlée') as DossierEnquete['entiteControlee']['roleDansDossier'],
      adresse: entity.adresse || '', contact: entity.contact || '',
      typeCible: entity.type_cible || '', pourLeCompteDe: entity.pour_le_compte_de || '',
    },
    equipe: (item.team?.length ? item.team : [item.assignee]).map((id) => agentName(id, agents, id === item.assignee ? item.assignee_username : '')).filter(Boolean),
    operationsDouanieres: (item.customs_operations || []).map((operation) => ({
      referenceSydonia: String(operation.reference_sydonia || ''), bureau: String(operation.bureau || ''),
      dateDeclaration: String(operation.date_declaration || ''), regime: String(operation.regime || ''),
      marchandise: String(operation.marchandise || ''), valeurDeclareeUSD: Number(operation.valeur_declaree_usd || 0),
    })),
    renseignementsLiesIds: [], taches: [], alertes: [], echeances: [],
    version: item.version,
    assigneeId: item.assignee,
    unitId: item.unit,
    teamIds: item.team || [],
  };
}

export function renseignementFromApi(item: ApiIntelligence, agents: ApiUser[], unitNames: Map<string, string>): RenseignementItem {
  return {
    id: item.id, reference: item.reference || item.id, dateReception: item.occurred_on,
    origine: item.provenance, objet: item.subject, resume: item.summary,
    niveauAcces: item.classification === 1 ? 'Restreint' : 'Interne',
    serviceDestinataire: unitNames.get(item.unit) || '', statut: 'Enregistré', dossiersLies: [],
    piecesDisponibles: item.available_pieces ? [item.available_pieces] : [],
    capabilities: item.capabilities || [],
    assigneeId: item.assignee,
    unitId: item.unit, classification: item.classification,
    version: item.version,
    coteA: agentName(item.assignee, agents), cotePar: item.rated_by ? agentName(item.rated_by, agents) : undefined,
    dateCotation: item.rated_at?.slice(0, 10), degreFiabilite: item.reliability || undefined,
    priorite: item.priority === 'urgent' ? 'URGENTE' : item.priority === 'flagged' ? 'SIGNALEE' : 'NORMALE',
    instructionCotation: item.rating_instruction || undefined, delaiPrescritJours: item.rating_deadline_days || undefined,
  };
}

export function demandeFromApi(item: ApiRequest, responses: ApiResponse[], agents: ApiUser[], assessments: Record<string, ApiAssessment[]>): DemandeCommunication {
  const received = responses.filter((row) => row.request === item.id);
  const latest = (id: string) => latestVersion(assessments[id] || []);
  const linked = (id: string) => received.some((response) => response.item_links.some((link) => link.item === id && !link.voided_at));
  const elements = item.items.map((element) => {
    const assessment = latest(element.id);
    const hasResponse = linked(element.id);
    const present = hasResponse && assessment?.receipt !== 'not_received';
    return {
      id: element.id, libelle: element.label, periodeConcernee: element.period || '', motifExigence: element.reason || '',
      statutRemise: (assessment?.receipt === 'not_received' || (assessment && !hasResponse) ? 'MANQUANT'
        : assessment?.completeness === 'insufficient' ? 'INCOMPLET'
        : present ? 'FOURNI' : 'EN_ATTENTE') as DemandeCommunication['elementsDemandes'][number]['statutRemise'],
      appreciation: assessment?.substance as 'pending' | 'satisfactory' | 'unsatisfactory' | undefined,
      motifAppreciation: assessment?.reason,
    };
  });
  const latestAssessments = item.items.map((element) => latest(element.id));
  const unsatisfactory = latestAssessments.find((row) => row?.substance === 'unsatisfactory');
  const complete = elements.length > 0 && elements.every((element) => element.statutRemise === 'FOURNI');
  const allSatisfactory = complete && latestAssessments.every((row) =>
    row?.receipt === 'received' && row.completeness === 'complete' && row.substance === 'satisfactory');
  return {
    id: item.id, reference: item.reference || item.id, dossierId: item.case,
    redacteur: agentName(item.author, agents), auteur: agentName(item.author, agents),
    horodatage: item.created_at, objet: item.subject,
    signataireHabilite: '', gradeSignataire: '',
    destinataire: {
      nom: item.target_name, qualite: item.target_type === 'broker' ? 'Commissionnaire en douane' : 'Entreprise contrôlée',
      adresse: item.target_address || '', representant: item.represented_name,
    },
    dateEmission: item.issuance?.issued_at?.slice(0, 10), echeanceReponse: item.due_on || '',
    statut: item.state === 'issued' ? complete ? 'REPONSE_COMPLETE' : received.length ? 'REPONSE_PARTIELLE' : 'EMISE'
      : item.state === 'draft' ? 'BROUILLON' : item.state === 'validated' ? 'VALIDEE' : item.state === 'signed' ? 'SIGNEE' : 'A_VALIDER',
    baseLegale: item.legal_basis || '',
    elementsDemandes: elements,
    reponsesRecues: received.map((response) => ({
      id: response.id, dateReception: response.received_on, referenceCourrier: response.external_reference || '',
      auteur: response.sender_name || '',
      elementsFournisIds: response.item_links.filter((link) => !link.voided_at).map((link) => link.item),
      elementsManquantsIds: item.items.filter((element) => !response.item_links.some((link) => link.item === element.id && !link.voided_at)).map((element) => element.id),
      piecesJointes: [response.letter, ...response.annexes], analyseEnqueteur: response.note || '',
      prochaineAction: '',
    })),
    modaliteRemise: item.delivery_method || '', commentairesInternes: item.internal_comments || '',
    evaluationReponse: unsatisfactory ? 'NON_SATISFAISANTE' : allSatisfactory ? 'SATISFAISANTE' : undefined,
    motifSatisfaction: unsatisfactory?.reason || (allSatisfactory ? latestAssessments.map((row) => row?.reason).filter(Boolean).join(' · ') : undefined),
  };
}

export function feuilleFromApi(item: ApiSheet, agents: ApiUser[], defenses: ApiDefense[] = [], assessments: Record<string, ApiObservationAssessment[]> = {}): FeuilleObservation {
  return {
    missionId: item.mission || undefined,
    id: item.id, reference: item.reference || item.id, dossierId: item.case,
    dateRedaction: item.created_at.slice(0, 10), inspecteurs: [agentName(item.author, agents)].filter(Boolean),
    destinataire: item.concerned_party, adresse: item.recipient_address,
    objetControle: item.subject || item.facts, cadreLegal: item.legal_basis || '',
    observations: item.observations.map((observation) => {
      const assessment = latestVersion(assessments[observation.id] || []);
      const defense = [...defenses].filter((row) => row.observations.includes(observation.id))
        .sort((a, b) => a.received_on.localeCompare(b.received_on) || a.recorded_at.localeCompare(b.recorded_at)).at(-1);
      return {
        id: observation.id,
        code: `O${observation.number}`, titre: observation.title || '',
        faitsConstates: observation.facts, justificatifsAssocies: observation.documents,
        referencesJuridiques: observation.legal_references || '',
        questionsAssujetti: observation.questions || '', analyseMotivee: assessment?.reason || observation.analysis || '',
        defenseRecue: defense ? { dateReception: defense.received_on, arguments: '', piecesJointes: [defense.letter, ...defense.annexes] } : undefined,
        appreciationEnqueteur: assessment?.conclusion === 'satisfactory' ? 'POINT_EXPLIQUE'
          : assessment?.conclusion === 'unsatisfactory' ? 'COMPLEMENT_REQUIS' : assessment ? 'ANALYSE_EN_COURS' : undefined,
        statutConstat: defense ? 'REPONSE_RECUE' : 'OUVERT',
      };
    }),
    statutFeuille: defenses.length ? 'DEFENSE_RECUE' : 'BROUILLON', dateReunionCloturePrevue: item.meeting_on || undefined,
  };
}

export function documentFromApi(item: ApiDocument): DocumentItem {
  const format = item.content_type === 'image/png' ? 'PNG' : item.content_type === 'image/jpeg' ? 'JPEG' : 'PDF';
  return {
    id: item.id, reference: item.id, titre: item.original_name, type: 'PIECE_JOINTE',
    format, statutValidation: item.state === 'accepted' ? 'VALIDE_INTERNE' : 'BROUILLON',
    dateCreation: item.uploaded_at.slice(0, 10), auteur: '', relaisGelec: false,
  };
}
