import type {
  DemandeCommunication, DocumentItem, DossierEnquete, FeuilleObservation,
  RenseignementItem, UserAccount,
} from '../types';
import type {
  ApiAssessment, ApiCase, ApiDocument, ApiIntelligence, ApiRequest, ApiResponse, ApiSheet, ApiUser,
} from './client';

export function userAccount(user: ApiUser, role = user.memberships[0]?.role): UserAccount {
  const prenom = user.first_name || '';
  const nom = user.last_name || user.username;
  return {
    id: String(user.id), prenom, nom, email: user.email || '', matricule: '',
    role: role === 'manager' ? 'director' : 'enqueteur', grade: '',
    unite: user.memberships[0]?.unit.name || '',
    avatarInitials: `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase(),
  };
}

function agentName(id: number, agents: ApiUser[], fallback = ''): string {
  const agent = agents.find((user) => user.id === id);
  return agent ? `${agent.first_name} ${agent.last_name}`.trim() || agent.username : fallback;
}

export function dossierFromApi(item: ApiCase, agents: ApiUser[], unitNames: Map<string, string>): DossierEnquete {
  const entity = item.controlled_entity || {};
  const dateCreation = item.created_at.slice(0, 10);
  return {
    id: item.id, reference: item.reference,
    objet: item.object || '', perimetre: item.perimeter || '', motifOuverture: item.opening_reason || '',
    unite: unitNames.get(item.unit) || item.unit_code,
    responsable: agentName(item.assignee, agents, item.assignee_username),
    statut: 'EN_COURS',
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
  };
}

export function renseignementFromApi(item: ApiIntelligence, agents: ApiUser[], unitNames: Map<string, string>): RenseignementItem {
  return {
    id: item.id, reference: item.reference || item.id, dateReception: item.occurred_on,
    origine: item.provenance, objet: item.subject, resume: item.summary,
    niveauAcces: item.classification === 1 ? 'Restreint' : 'Interne',
    serviceDestinataire: unitNames.get(item.unit) || '', statut: 'Enregistré', dossiersLies: [],
    piecesDisponibles: item.available_pieces ? [item.available_pieces] : [],
    assigneeId: item.assignee,
    coteA: agentName(item.assignee, agents), cotePar: item.rated_by ? agentName(item.rated_by, agents) : undefined,
    dateCotation: item.rated_at?.slice(0, 10), degreFiabilite: item.reliability || undefined,
    priorite: item.priority === 'urgent' ? 'URGENTE' : item.priority === 'flagged' ? 'SIGNALEE' : 'NORMALE',
    instructionCotation: item.rating_instruction || undefined, delaiPrescritJours: item.rating_deadline_days || undefined,
  };
}

export function demandeFromApi(item: ApiRequest, responses: ApiResponse[], agents: ApiUser[], assessments: Record<string, ApiAssessment[]>): DemandeCommunication {
  const received = responses.filter((row) => row.request === item.id);
  const latestAssessments = item.items.map((element) => assessments[element.id]?.at(-1)).filter((row): row is ApiAssessment => Boolean(row));
  const unsatisfactory = latestAssessments.find((row) => row.substance === 'unsatisfactory');
  const satisfactory = latestAssessments.find((row) => row.substance === 'satisfactory');
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
    statut: item.state === 'issued' ? received.length ? 'REPONSE_PARTIELLE' : 'EMISE'
      : item.state === 'draft' ? 'BROUILLON' : 'A_VALIDER',
    baseLegale: item.legal_basis || '',
    elementsDemandes: item.items.map((element) => ({
      id: element.id, libelle: element.label, periodeConcernee: element.period || '',
      motifExigence: element.reason || '',
      statutRemise: received.some((response) => response.item_links.some((link) => link.item === element.id && !link.voided_at)) ? 'FOURNI' : 'EN_ATTENTE',
    })),
    reponsesRecues: received.map((response) => ({
      id: response.id, dateReception: response.received_on, referenceCourrier: response.external_reference || '',
      auteur: response.sender_name || '',
      elementsFournisIds: response.item_links.filter((link) => !link.voided_at).map((link) => link.item),
      elementsManquantsIds: [], piecesJointes: [], analyseEnqueteur: response.note || '',
      prochaineAction: '',
    })),
    modaliteRemise: item.delivery_method || '', commentairesInternes: item.internal_comments || '',
    evaluationReponse: unsatisfactory ? 'NON_SATISFAISANTE' : satisfactory ? 'SATISFAISANTE' : undefined,
    motifSatisfaction: unsatisfactory?.reason || satisfactory?.reason,
  };
}

export function feuilleFromApi(item: ApiSheet, agents: ApiUser[]): FeuilleObservation {
  return {
    id: item.id, reference: item.reference || item.id, dossierId: item.case,
    dateRedaction: item.created_at.slice(0, 10), inspecteurs: [agentName(item.author, agents)].filter(Boolean),
    destinataire: item.concerned_party, adresse: item.recipient_address,
    objetControle: item.subject || item.facts, cadreLegal: item.legal_basis || '',
    observations: item.observations.map((observation) => ({
      code: `O${observation.number}`, titre: observation.title || '',
      faitsConstates: observation.facts, justificatifsAssocies: [],
      referencesJuridiques: observation.legal_references || '',
      questionsAssujetti: observation.questions || '', analyseMotivee: observation.analysis || '',
      statutConstat: 'OUVERT',
    })),
    statutFeuille: 'BROUILLON', dateReunionCloturePrevue: item.meeting_on || undefined,
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
