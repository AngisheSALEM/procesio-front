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

export interface TacheDossier {
  id: string;
  titre: string;
  description: string;
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINEE';
  priorite: 'URGENTE' | 'NORMALE';
  dateEcheance: string;
  horodatageCreation: string;
  auteur: string;
}

export interface AlerteDossier {
  id: string;
  titre: string;
  message: string;
  niveau: 'CRITIQUE' | 'AVERTISSEMENT' | 'INFO';
  actionRequise: string;
  horodatage: string;
  auteur: string;
}

export interface EcheanceDossier {
  id: string;
  libelle: string;
  dateButoir: string;
  typeEcheance: string;
  horodatageFixe: string;
  statut: 'DANS_LES_DELAIS' | 'IMMINENT' | 'DEPASSE';
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
  horodatageCreation: string;
  entiteControlee: EntiteControlee;
  equipe: string[];
  operationsDouanieres: OperationDouaniere[];
  renseignementsLiesIds: string[];
  taches: TacheDossier[];
  alertes: AlerteDossier[];
  echeances: EcheanceDossier[];
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

export type StatutTache = 'A_FAIRE' | 'EN_COURS' | 'TERMINEE';
export type PrioriteTache = 'URGENTE' | 'NORMALE' | 'FAIBLE';

export interface TacheAgent {
  id: string;
  titre: string;
  description: string;
  dossierId: string;
  dossierRef: string;
  entrepriseNom: string;
  echeance: string;
  statut: StatutTache;
  priorite: PrioriteTache;
  assigneA: string;
  categorie: 'VERIFICATION' | 'COMMUNICATION' | 'OBSERVATION' | 'AUDIT' | 'REDIGE_PV';
}

export type TypeAlerte = 'RETARD_REPONSE' | 'ECHEANCE_PROCHE' | 'INCOHERENCE_SYDONIA' | 'REUNION_CONTRADICTOIRE' | 'SIGNALEMENT';

export interface AlerteOperationnelle {
  id: string;
  titre: string;
  message: string;
  date: string;
  type: TypeAlerte;
  niveau: 'CRITIQUE' | 'AVERTISSEMENT' | 'INFO';
  dossierId: string;
  dossierRef: string;
  actionRequise: string;
  resolue?: boolean;
}

export interface EcheanceItem {
  id: string;
  titre: string;
  dateButoir: string;
  joursRestants: number;
  dossierId: string;
  dossierRef: string;
  entrepriseNom: string;
  typeEcheance: 'REPONSE_ART_46' | 'MOYENS_DEFENSE' | 'REUNION_CLOTURE' | 'RAPPORT_FINAL';
  statut: 'DANS_LES_DELAIS' | 'IMMINENT' | 'EN_RETARD';
}

export interface DocumentItem {
  id: string;
  reference: string;
  titre: string;
  type: 'PV_OPERATIONS' | 'PV_INFRACTION' | 'DEMANDE_COMMUNICATION' | 'FEUILLE_OBSERVATION' | 'BORDEREAU_GELEC';
  format: 'PDF' | 'DOCX' | 'SCAN_SIGNE' | 'XLSX';
  statutValidation: 'BROUILLON' | 'VALIDE_INTERNE' | 'SIGNE_OFFICIEL' | 'TRANSMIS';
  dateCreation: string;
  auteur: string;
  signataire?: string;
  relaisGelec: boolean;
}

export interface AuditLogEntry {
  id: string;
  date: string;
  heure: string;
  auteur: string;
  action: string;
  details: string;
  categorie: 'PROCEDURE' | 'DOCUMENT' | 'DECISION' | 'SECURITE';
}

