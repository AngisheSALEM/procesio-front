export interface EnqueteDataRow {
  id: string;
  reference: string;
  operateur: string;
  nif: string;
  bureau: string;
  regime: string;
  marchandise: string;
  valeurUSD: number;
  statut: 'CRITIQUE' | 'EN_COURS' | 'EN_ATTENTE' | 'CONFORME' | 'CONTENTIEUX';
  priorite: 'URGENTE' | 'NORMALE' | 'SURVEILLANCE';
  echeance: string;
  joursRestants: number;
  inspecteur: string;
  tauxRisque: number;
  anomalieDetectee: string;
  piecesFournies: number;
  piecesTotal: number;
  derniereAction: string;
  tags: string[];
}
