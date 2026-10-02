import type { StatutDemandeCommunication, FeuilleObservation } from '../types';

export const requestStatusLabel = (status: StatutDemandeCommunication): string => ({
  BROUILLON: 'Brouillon', A_VALIDER: 'À valider', VALIDEE: 'Validée', SIGNEE: 'Signature constatée',
  EMISE: 'Émise', REPONSE_PARTIELLE: 'Réponse partielle', REPONSE_COMPLETE: 'Réponse complète',
  TERMINEE: 'Terminée', ANNULEE: 'Annulée',
})[status];

export const sheetStatusLabel = (status: FeuilleObservation['statutFeuille']): string => ({
  BROUILLON: 'Brouillon', NOTIFIEE: 'Notifiée', DEFENSE_RECUE: 'Défense reçue',
  REUNION_CONTRADICTOIRE: 'Réunion contradictoire', CLOTUREE: 'Clôturée',
})[status];
