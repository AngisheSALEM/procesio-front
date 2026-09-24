import type { DossierEnquete, DemandeCommunication, FeuilleObservation, UserAccount } from '../types';

export const mockUsers: Record<'admin' | 'enqueteur', UserAccount> = {
  admin: {
    id: 'usr-admin-01',
    nom: 'Mukendi',
    prenom: 'Salem',
    email: 'admin@dgda.cd',
    matricule: 'DGDA-DIR-089',
    role: 'admin',
    grade: 'Directeur Provincial / Chef de Division',
    unite: 'DRK Lubumbashi',
    avatarInitials: 'SM',
  },
  enqueteur: {
    id: 'usr-enq-02',
    nom: 'Kabamba',
    prenom: 'Marc',
    email: 'enqueteur@dgda.cd',
    matricule: 'DGDA-INSP-2041',
    role: 'enqueteur',
    grade: 'Inspecteur Vérificateur',
    unite: 'DRK Lubumbashi',
    avatarInitials: 'MK',
  },
};

export const mockDossier: DossierEnquete = {
  id: 'dossier-0842',
  reference: 'DGDA/DRK/DIR-ENQ/2026/0842',
  objet: 'Contrôle a posteriori — Régularité de la valeur en douane déclarée sur minerais et intrants chimiques',
  perimetre: 'Importations et exportations réalisées via le poste de Kasumbalesa (Exercices 2024-2025)',
  motifOuverture: 'Rapprochement automatisé SYDONIA et signalement DRK sur écart d’assiette taxable de fret maritime',
  unite: 'Direction des Recherches et Enquêtes Douanières (DRK)',
  responsable: 'Inspecteur Principal Salem Mukendi',
  statut: 'EN_COURS',
  priorite: 'URGENTE',
  echeance: '2026-10-15',
  prochaineAction: 'Examiner les justificatifs bancaires reçus sur la demande DC-042 et statuer sur l’observation O2',
  dateCreation: '2026-08-12',
  entiteControlee: {
    nom: 'CONGO MINING & CHEMICAL LOGISTICS SAS',
    rccm: 'CD/KNG/RCCM/18-B-04921',
    nif: 'A0812904X',
    typeEntite: 'Société commerciale',
    roleDansDossier: 'Entreprise contrôlée',
    adresse: '04 Avenue des Métaux, Quartier Industriel, Lubumbashi, Haut-Katanga',
    contact: '+243 81 555 4920 — contact@cmc-logistics.cd'
  },
  equipe: [
    'Insp. Principal Salem Mukendi (Chef de mission)',
    'Insp. Adjoint Mireille Kabamba (Vérificateur)',
    'Contrôleur Éric Tshimanga (Exploitation SYDONIA)'
  ],
  operationsDouanieres: [
    {
      referenceSydonia: 'SYD-KAS-2025-IM4-01948',
      bureau: 'Kasumbalesa Frontière (Bureau 401)',
      dateDeclaration: '2025-04-18',
      regime: 'IM4 — Mise à la consommation directe',
      marchandise: 'Réactifs de flottation et floculants miniers',
      valeurDeclareeUSD: 485000
    },
    {
      referenceSydonia: 'SYD-KAS-2025-IM4-02311',
      bureau: 'Kasumbalesa Frontière (Bureau 401)',
      dateDeclaration: '2025-06-03',
      regime: 'IM4 — Mise à la consommation directe',
      marchandise: 'Sulfates de cuivre raffinés & réactifs',
      valeurDeclareeUSD: 620000
    },
    {
      referenceSydonia: 'SYD-KAS-2025-EX1-00892',
      bureau: 'Kasumbalesa Sortie (Bureau 402)',
      dateDeclaration: '2025-09-14',
      regime: 'EX1 — Exportation définitive concentrés',
      marchandise: 'Concentrés de cobalt et cuivre',
      valeurDeclareeUSD: 1450000
    }
  ],
  renseignementsLiesIds: ['RN-2026-0312', 'RN-2026-0419']
};

export const mockDemandeCommunication: DemandeCommunication = {
  id: 'demande-042',
  reference: 'DGDA/DRK/ENQ/DC/2026/042',
  dossierId: 'dossier-0842',
  redacteur: 'Inspecteur Principal Salem Mukendi',
  signataireHabilite: 'Jean-Paul Tshilombo (Directeur Provincial des Douanes)',
  gradeSignataire: 'Commandement de Division (Direction Provinciale)',
  destinataire: {
    nom: 'TRUST MERCHANT BANK (TMB) SA',
    qualite: 'Établissement bancaire teneur des comptes de règlement',
    adresse: 'Succursale Principale, Chaussée Laurent Désiré Kabila, Lubumbashi',
    representant: 'Direction des Opérations Internationales & Conformité'
  },
  dateEmission: '2026-08-20',
  echeanceReponse: '2026-09-05',
  statut: 'REPONSE_PARTIELLE',
  baseLegale: 'Droit de communication sur pièces comptables et financières',
  modaliteRemise: 'Transmission sous pli scellé confidentiel avec bordereau d’émargement ou dépôt sécurisé au greffe DRK',
  commentairesInternes: 'Demande visant à vérifier l’effectivité des flux de paiement bancaire et à recouper les montants déclarés dans SYDONIA avec les SWIFT MT103 réels.',
  elementsDemandes: [
    {
      id: 'EL-01',
      libelle: 'Copies authentifiées des messages SWIFT MT103 et ordres de virement émis au profit du fournisseur étranger CHEMPRO CORP',
      periodeConcernee: 'Du 01/01/2025 au 30/06/2025',
      motifExigence: 'Vérification du paiement effectif de la valeur transactionnelle déclarée',
      statutRemise: 'FOURNI'
    },
    {
      id: 'EL-02',
      libelle: 'Relevés bancaires certifiés du compte USD n° 00018-200491-01 traçant les débits correspondants aux factures n° 2025-04-18 et 2025-06-03',
      periodeConcernee: 'Avril 2025 à Juillet 2025',
      motifExigence: 'Contrôle des décaissements et identification d’éventuelles commissions ou rétrocessions non déclarées',
      statutRemise: 'FOURNI'
    },
    {
      id: 'EL-03',
      libelle: 'Contrats d’ouverture de crédits documentaires (Credoc) et attestations d’engagement d’importation série modèle IB validées par la Banque Centrale',
      periodeConcernee: 'Année 2025',
      motifExigence: 'Rapprochement réglementaire des engagements d’importation et domiciliation',
      statutRemise: 'MANQUANT'
    },
    {
      id: 'EL-04',
      libelle: 'Factures de commissions bancaires de négociation et frais financiers accessoires facturés à la société',
      periodeConcernee: 'Semestre 1 - 2025',
      motifExigence: 'Éléments constitutifs éventuels à réintégrer dans la valeur en douane',
      statutRemise: 'INCOMPLET'
    }
  ],
  reponsesRecues: [
    {
      id: 'REP-001',
      dateReception: '2026-09-02',
      referenceCourrier: 'TMB/JUR/CONF/2026/N°789',
      auteur: 'Me Alain Kalenga, Directeur des Affaires Juridiques TMB',
      elementsFournisIds: ['EL-01', 'EL-02'],
      elementsManquantsIds: ['EL-03', 'EL-04'],
      piecesJointes: [
        'Bordereau_SWIFT_MT103_Certifies.pdf',
        'Extraits_Compte_USD_CMCL.pdf'
      ],
      analyseEnqueteur: 'Les messages SWIFT confirment des transferts de 580 000 USD, révélant un différentiel de 95 000 USD par rapport à la déclaration SYD-KAS-2025-IM4-01948. Les modèles IB de la BCC manquent toujours.',
      appreciation: 'INCOMPLETE_EXPLICATIVE',
      prochaineAction: 'Émettre une lettre de relance pour les contrats de Credoc et modèles IB sous astreinte de 8 jours.'
    }
  ]
};

export const mockFeuilleObservation: FeuilleObservation = {
  id: 'fo-2026-018',
  reference: 'DGDA/DRK/FO/2026/018',
  dossierId: 'dossier-0842',
  dateRedaction: '2026-08-28',
  inspecteurs: [
    'Salem Mukendi (Inspecteur Principal)',
    'Mireille Kabamba (Inspecteur Adjoint)'
  ],
  destinataire: 'Monsieur le Directeur Général, CONGO MINING & CHEMICAL LOGISTICS SAS',
  objetControle: 'Communication des constatations provisoires — Régularité de la valeur transactionnelle et du fret sur réactifs',
  cadreLegal: 'Décision DG/DGDA/DG/2011/296 (Articles 44 à 49) portant réglementation des contrôles a posteriori en RDC',
  statutFeuille: 'DEFENSE_RECUE',
  dateReunionCloturePrevue: '2026-10-08',
  observations: [
    {
      code: 'O1',
      titre: 'Écart de facturation sur frais d’assurance et fret maritime (Incoterm CIF Kasumbalesa)',
      faitsConstates: 'La déclaration SYD-KAS-2025-IM4-01948 fait état d’un fret maritime forfaitaire de 12 500 USD. Les connaissements maritimes et factures du transporteur MAERSK transmis établissent un montant réel de transport de 24 800 USD, soit une minoration d’assiette de 12 300 USD.',
      justificatifsAssocies: [
        'Déclaration SYD-KAS-2025-IM4-01948',
        'B/L n° MSK94821034',
        'Facture de fret MAERSK n° 884021'
      ],
      referencesJuridiques: 'Éléments à incorporer dans la valeur en douane CIF (Fret maritime)',
      questionsAssujetti: 'Veuillez justifier l’écart entre la facture de fret maritime finale et le montant renseigné en case 22 de la déclaration en douane.',
      defenseRecue: {
        dateReception: '2026-09-10',
        arguments: 'L’opérateur allègue une régularisation tardive par note de débit de l’armateur, n’ayant pu être intégrée avant le dédouanement frontière. Il reconnaît l’écart et sollicite l’émission d’un avis de mise en recouvrement sans pénalité de mauvaise foi.',
        piecesJointes: ['Note_Debit_Maersk_Rectificative.pdf', 'Lettre_Explications_CMCL_10_09.pdf']
      },
      appreciationEnqueteur: 'POINT_EXPLIQUE',
      statutConstat: 'CLOS_REGULARISE',
      analyseMotivee: 'Faits établis et reconnus. Minoration sans intention frauduleuse avérée. Redressement de droits et taxes chiffré à 4 182 USD à intégrer au rapport final.'
    },
    {
      code: 'O2',
      titre: 'Différentiel non justifié entre paiements bancaires SWIFT et valeur déclarée sur réactifs',
      faitsConstates: 'L’exploitation des messages SWIFT MT103 obtenus auprès de la TMB montre un règlement effectif de 580 000 USD le 25/04/2025 au bénéfice de CHEMPRO CORP, alors que la facture commerciale n° 2025-04-18 jointe à la déclaration n’indique que 485 000 USD.',
      justificatifsAssocies: [
        'Swift MT103 n° TMB-SW-250425',
        'Facture déclarée n° 2025-04-18',
        'Relevé de compte devise n° 00018-200491-01'
      ],
      referencesJuridiques: 'Sincérité de la valeur transactionnelle déclarée',
      questionsAssujetti: 'Expliquer la nature des 95 000 USD supplémentaires virés au fournisseur le jour même du dédouanement et fournir les contrats afférents.',
      defenseRecue: {
        dateReception: '2026-09-18',
        arguments: 'L’entreprise prétend que les 95 000 USD constituent une avance sur une commande ultérieure de broyeurs à boulets non encore expédiés.',
        piecesJointes: ['Bon_Commande_Broyeurs_NonSigne.pdf']
      },
      appreciationEnqueteur: 'COMPLEMENT_REQUIS',
      statutConstat: 'EN_ATTENTE_REPONSE',
      analyseMotivee: 'Le bon de commande fourni est non signé et sans numéro proforma concordant avec le libellé du virement SWIFT ("Payment for chemical batch #1948"). Explication jugée fragile, justificatif probant exigé sous 5 jours.'
    },
    {
      code: 'O3',
      titre: 'Défaut de déclaration de redevances et droits de licence brevetés liés à la formule chimique',
      faitsConstates: 'L’audit du grand livre comptable classe 6 montre des paiements trimestriels de royalties de 5 % sur le volume de minerai traité à une holding aux Îles Vierges Britanniques, condition préalable à la livraison des réactifs brevetés.',
      justificatifsAssocies: [
        'Contrat de licence de procédé n° LIC-2023-BVI',
        'Écritures comptables compte 651'
      ],
      referencesJuridiques: 'Ajustement obligatoire de la valeur en douane pour redevances et droits de licence',
      questionsAssujetti: 'Préciser pourquoi les redevances versées, conditionnant directement la vente des marchandises pour l’exportation à destination de la RDC, ont été omises de la valeur imposable.',
      defenseRecue: {
        dateReception: '2026-09-18',
        arguments: 'La société conteste l’applicabilité, affirmant que le brevet porte sur le procédé d’extraction métallurgique et non sur la marchandise importée.',
        piecesJointes: ['Note_Technique_Avocat_Conseil.pdf']
      },
      appreciationEnqueteur: 'CONSTAT_CONFIRME',
      statutConstat: 'MAINTENU_CONTENTIEUX',
      analyseMotivee: 'La clause 4.2 du contrat de vente lie expressément la livraison des réactifs à la licence d’exploitation. L’omission caractérise une minoration intentionnelle d’assiette taxable. Constat maintenu pour transmission contentieuse vers GELEC.'
    }
  ]
};

export const mockRenseignements = [
  {
    id: 'RN-2026-0312',
    reference: 'DGDA/DRK/REN/2026/0312',
    dateReception: '2026-08-04',
    origine: 'Rapprochement automatisé SYDONIA ++ / DRK',
    objet: 'Incohérence récurrente sur le ratio fret/valeur déclarée - réactifs miniers',
    resume: 'Écarts significatifs constatés entre les connaissements maritimes Dar-es-Salaam / Durban et les déclarations souscrites à Kasumbalesa.',
    niveauAcces: 'Diffusion Restreinte',
    serviceDestinataire: 'Division des Enquêtes Douanières',
    statut: 'Exploité en enquête',
    dossiersLies: ['dossier-0842']
  },
  {
    id: 'RN-2026-0419',
    reference: 'DGDA/DRK/REN/2026/0419',
    dateReception: '2026-08-10',
    origine: 'Avis de fraude interne Bureau 401',
    objet: 'Signalement sur transferts financiers triangulaires et redevances offshore',
    resume: 'Renseignements concordants sur contrats de licence non déclarés lors de la mise à la consommation d’intrants chimiques miniers.',
    niveauAcces: 'Confidentiel Défense Douanière',
    serviceDestinataire: 'Section Contrôle A Posteriori',
    statut: 'Exploité en enquête',
    dossiersLies: ['dossier-0842']
  }
];
