export type UserRole = 'admin' | 'enqueteur';

export interface UserAccount {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  matricule: string;
  role: UserRole;
  grade: string;
  unite: string;
  avatarInitials: string;
}

export type StatutDossier =
  | 'A_AFFECTER'
  | 'EN_COURS'
  | 'EN_ATTENTE'
  | 'A_VALIDER'
  | 'CLOTURE'
  | 'RELAIS_CONTENTIEUX';

export type Priorite = 'NORMALE' | 'URGENTE' | 'SIGNALEE';

export interface EntiteControlee {
  nom: string;
  rccm: string;
  nif: string;
  typeEntite: 'Société commerciale' | 'Commissionnaire en douane' | 'Banque' | 'Particulier' | 'ONG';
  roleDansDossier: 'Entreprise contrôlée' | 'Déclarant / Transitaire' | 'Détenteur de pièces' | 'Bénéficiaire';
  adresse: string;
  contact: string;
}

export interface OperationDouaniere {
  referenceSydonia: string;
  bureau: string;
  dateDeclaration: string;
  regime: string;
  marchandise: string;
  valeurDeclareeUSD: number;
}

export interface DossierEnquete {
  id: string;
  reference: string;
  objet: string;
  perimetre: string;
  motifOuverture: string;
  unite: string;
  responsable: string;
  statut: StatutDossier;
  priorite: Priorite;
  echeance: string;
  prochaineAction: string;
  dateCreation: string;
  entiteControlee: EntiteControlee;
  equipe: string[];
  operationsDouanieres: OperationDouaniere[];
  renseignementsLiesIds: string[];
}

export type StatutDemandeCommunication =
  | 'BROUILLON'
  | 'A_VALIDER'
  | 'EMISE'
  | 'REPONSE_PARTIELLE'
  | 'REPONSE_COMPLETE'
  | 'TERMINEE';

export interface ElementDemande {
  id: string;
  libelle: string;
  periodeConcernee: string;
  motifExigence: string;
  statutRemise: 'EN_ATTENTE' | 'FOURNI' | 'MANQUANT' | 'INCOMPLET';
}

export interface ReponseRecue {
  id: string;
  dateReception: string;
  referenceCourrier: string;
  auteur: string;
  elementsFournisIds: string[];
  elementsManquantsIds: string[];
  piecesJointes: string[];
  analyseEnqueteur: string;
  appreciation: 'SATISFAISANTE' | 'INCOMPLETE_EXPLICATIVE' | 'NON_CONVAINCANTE' | 'CONTRADICTOIRE';
  prochaineAction: string;
}

export interface DemandeCommunication {
  id: string;
  reference: string;
  dossierId: string;
  redacteur: string;
  signataireHabilite: string;
  gradeSignataire: string;
  destinataire: {
    nom: string;
    qualite: string;
    adresse: string;
    representant?: string;
  };
  dateEmission?: string;
  echeanceReponse: string;
  statut: StatutDemandeCommunication;
  baseLegale: string;
  elementsDemandes: ElementDemande[];
  reponsesRecues: ReponseRecue[];
  modaliteRemise: string;
  commentairesInternes: string;
}

export type AppreciationObservation =
  | 'POINT_EXPLIQUE'
  | 'COMPLEMENT_REQUIS'
  | 'ANALYSE_EN_COURS'
  | 'CONSTAT_CONFIRME';

export type StatutConstat =
  | 'OUVERT'
  | 'EN_ATTENTE_REPONSE'
  | 'REPONSE_RECUE'
  | 'CLOS_REGULARISE'
  | 'MAINTENU_CONTENTIEUX';

export interface ObservationItem {
  code: string; // Ex: O1, O2, O3
  titre: string;
  faitsConstates: string;
  justificatifsAssocies: string[];
  referencesJuridiques: string;
  questionsAssujetti: string;
  defenseRecue?: {
    dateReception: string;
    arguments: string;
    piecesJointes: string[];
  };
  appreciationEnqueteur?: AppreciationObservation;
  statutConstat: StatutConstat;
  analyseMotivee: string;
}

export interface FeuilleObservation {
  id: string;
  reference: string;
  dossierId: string;
  dateRedaction: string;
  inspecteurs: string[];
  destinataire: string;
  objetControle: string;
  cadreLegal: string; // ex: Décision DG/DGDA/DG/2011/296 Articles 44-49
  observations: ObservationItem[];
  statutFeuille: 'BROUILLON' | 'NOTIFIEE' | 'DEFENSE_RECUE' | 'REUNION_CONTRADICTOIRE' | 'CLOTUREE';
  dateReunionCloturePrevue?: string;
  decisionRelais?: {
    relaisGelec: boolean;
    referencePvInfraction?: string;
    motif: string;
    dateTransmission?: string;
  };
}
