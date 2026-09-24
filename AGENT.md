# Procezo — Guide de l’Agent (AGENT.md)

## 1. Identité & Rôle
L’agent opère en tant que **Lead Developer & Cloud Architect** spécialisé dans les systèmes d’information douaniers et les applications régaliennes hautement sécurisées pour la **Direction Générale des Douanes et Accises (DGDA - RDC)**.

Sa mission prioritaire est de concevoir, développer et maintenir **Procezo**, l’application officielle d’accompagnement des enquêtes douanières, de gestion du renseignement et de préparation du relais contentieux vers **GELEC**.

---

## 2. Cadre Réglementaire & Juridique Métier (DGDA)

Tout développement ou évolution de Procezo doit s'adosser scrupuleusement aux textes légaux suivants :

1. **Loi n° 10/002 portant Code des douanes :**
   - **Article 46 (Droit de communication) :** Les demandes de communication de pièces, relevés bancaires (SWIFT, extraits de compte) ou contrats auprès des banques, transporteurs et commissionnaires doivent impérativement être visées et signées par un agent revêtu d’un **grade de commandement** (Chef de Division ou Directeur Provincial).
   - **Article 44 (PV d’opérations) :** Constate les opérations matérielles d’audit ou de vérification documentaire. **À ne jamais confondre avec le PV d’infraction.**
   - **Articles 356 & 357 (Constatation des infractions douanières) :** Encadrent la rédaction formelle du Procès-verbal d’infraction destiné au parquet ou à la Direction du Contentieux (GELEC).
2. **Décision DG/DGDA/DG/2011/296 (Contrôles a posteriori) :**
   - **Articles 44–45 :** Avis préalable écrit précisant l’objet, la durée et le début du contrôle.
   - **Article 46 :** Recherche documentaire douanière, commerciale, comptable et financière.
   - **Articles 48–49 :** Notification de la feuille d'observation des constatations provisoires et organisation de la **réunion contradictoire de clôture** pour entendre les moyens de défense de l’opérateur.
   - **Articles 50–52 :** Rapport final transmis à la hiérarchie et attestation de fin de contrôle.
3. **Écosystème informatique connexe :**
   - **SYDONIA (SydoniaWorld) :** Gère le dédouanement et les déclarations en douane (IM4, EX1, transit). Procezo n’a pas vocation à dupliquer SYDONIA mais à relier les déclarations ciblées à l’enquête.
   - **GELEC :** Système du contentieux douanier. Procezo prépare le dossier de transmission complet et conserve la traçabilité du relais.

---

## 3. Principes d’Architecture & Règles Produit

### A. Séparation Renseignement vs Dossier d'Enquête
- Le **Renseignement** est une information reçue (aviseur, alerte SYDONIA, constat frontière). Il peut être partagé en **diffusion interne multi-bureaux** sans forcer l’ouverture d’un dossier ni inventer une cible suspecte.
- Un renseignement peut alimenter plusieurs dossiers ; plusieurs renseignements peuvent être rattachés à un même dossier.
- Le **Dossier d’enquête unique** centralise l’ensemble des investigations, correspondances, constats, défenses et décisions.

### B. Les Deux Personas Métier (DGDA)
Procezo est conçu exclusivement pour les agents de la DGDA et structure l'instruction autour de deux personas clés :
1. **Administrateur (Direction & Supervision)** : Responsable d'unité (Chef de Division, Directeur Provincial). Il supervise le portefeuille global des dossiers, procède aux affectations, valide les actes et procès-verbaux, et analyse les statistiques de dénouement.
2. **Enquêteur (Terrain & Instruction)** : Inspecteur ou vérificateur. Il instruit au quotidien les dossiers d'enquête qui lui sont affectés, prépare les demandes de communication de pièces, consigne les constats d'observation, examine les réponses fournies et propose les conclusions.

### C. Structure de Navigation & Authentification
1. `Page de Connexion (Login)` : Authentification sécurisée avec sélection rapide du rôle (Administrateur ou Enquêteur).
2. `Dossiers d’enquête` : Espace d'investigation par affaire (constats, échanges, pièces, historique).
3. `Mon travail` : Priorités opérationnelles, échéances immédiates et réponses reçues.
4. `Renseignements` : Réception, qualification et signalements.
5. `Documents et modèles` : Canevas officiels et procès-verbaux types.
6. `Rapports et statistiques` : Métriques d'activité et tableaux de bord (profil Administrateur).
7. `Paramètres` : Gestion du profil agent et sélecteur de thème d'affichage (Thème Sombre / Thème Clair). Le nom et l'identité de l'agent sont logés dans la barre de navigation latérale.

### D. En-Tête du Dossier Unique (Les 5 Questions Clés)
À l’ouverture d'un dossier, l’en-tête doit répondre immédiatement à :
1. *De quoi s’agit-il ?* (Objet, périmètre, motif d’ouverture)
2. *Qui est concerné ?* (Nom de l'entité, RCCM, NIF, adresse, rôle d'opération)
3. *Qui s’en occupe ?* (Chef de mission, équipe de vérification, unité DRK)
4. *Où en est-on ?* (Statut d'avancement, phase contradictoire, date butoir)
5. *Quelle est la prochaine action ?* (Action immédiate prioritaire)

### E. Décomposition de la Feuille d'Observation
- Conçue autour de constats individuels numérotés (**O1, O2, O3...**).
- Chaque constat possède ses faits, ses justificatifs, ses questions, les arguments de défense reçus, et l’appréciation motivée de l’enquêteur (*Point expliqué*, *Complément requis*, *Analyse requise*, *Constat confirmé pour contentieux*).
- La résolution de O1 ne ferme jamais automatiquement O2 ni O3.

### F. Traitement des Demandes de Communication (Art. 46)
- Liste détaillée des pièces demandées avec statut unitaire (*Fourni*, *Manquant*, *Incomplet*, *En attente*).
- Distinction claire entre la réception d'un courrier et son appréciation au fond.
- Gestion du cycle de réponse : *Brouillon*, *À valider*, *Émise*, *Réponse partielle*, *Réponse complète*, *Terminée*.

---

## 4. Charte Graphique & UI Standards (Directives Impératives)

1. **ZÉRO BADGE POLLUANT :** Élimination totale des badges artificiels, compteurs encombrants ou pilules multicolores. L'information est véhiculée par une typographie épurée, des séparateurs clairs et des statuts textuels sobres.
2. **NAVBAR ET BARRE DE RECHERCHE FLOTTANTES (Style iPadOS / Translucide) :**
   - Barre latérale de navigation flottante à coins adoucis, effet verre dépoli (`backdrop-filter: blur(20px)`), avec bouton de basculement.
   - Barre de recherche flottante en pilule translucide en en-tête supérieur droit pour filtrer instantanément dossiers, PV et opérateurs.
   - Disponible de façon homogène sur les deux pages/personas (Admin Initiateur PV et Entreprise).
3. **ZÉRO ÉMOJI :** Strictement aucun emoji dans le code, les labels, badges ou messages d'alerte. Utiliser le pack d'icônes vectorielles institutionnelles (Lucide / SF Symbols 1.5–2px).
4. **ZÉRO NÉON, ZÉRO BOX-SHADOW & ZÉRO BORDURE SUR LES CARTES :** Aucune couleur fluorescente. Aucune ombre portée. Aucune bordure sur les cartes ; profondeur assurée exclusivement par le contraste des surfaces étagées.
5. **Palette 60–30–10 officielle DGDA :**
   - **Thème Sombre (défaut) :** Surface principale *Midnight Slate* (`#222126`), texte *Lin Clair* (`#f7f1e6`), accent *Mustard Glow* (`#E4B74A`).
   - **Thème Clair :** Surface *Lin Clair* (`#f7f1e6`), texte *Night Asphalt* (`#262525`), accent dérivé (`#C58F18`).
6. **Typographie :**
   - Corps : Apple SF Pro (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display"`).
   - Données chiffrées & identifiants : SF Mono / JetBrains Mono.
7. **Hiérarchie Ergonomique des Boutons & Statuts :**
   - **Boutons :** 1 seul CTA primaire (`.btn-primary`, accent 10 %) par zone d'action. Actions secondaires en surfaces neutres (`.btn-secondary`), actions tertiaires en ghost (`.btn-ghost`).
   - **Statuts Teintés :** Capsules de statut sobres (`.badge-status`) à fond désaturé (`--color-*-surface`) et texte/icône dans la couleur d'état, sans pollution visuelle.
   - **Micro-interactions :** Cartes cliquables enrichies (`.card-interactive`) avec transition tactile fluide (150ms) sans ombres.
8. **Contrôle Temps Réel :**
   - Utilisation continue du hook React `useDesignSystemAudit` pour inspecter le DOM et garantir un score de conformité de 100%.
