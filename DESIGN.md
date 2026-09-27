# PROCEZO — Charte d'Ergonomie & Système de Design (DESIGN.md)

Ce document acte les principes ergonomiques et visuels fondamentaux de l'application Procezo pour la Direction Générale des Douanes et Accises (DGDA).

---

## 1. Principe Directeur : "Trop d'information tue l'ergonomie"

Une interface d'instruction douanière ne doit jamais ressembler à un mur de données indigeste. 
L'application privilégie un **design minimaliste et aéré** :
* **Interdiction de la prolifération de cartes (*cards*) :** Ne pas enfermer chaque parcelle d'information dans une boîte bordée. L'information respire sur des surfaces plates étagées.
* **Suppression du bruit visuel et des icônes parasites :**
  - **Zéro icône à côté du nom de l'enquêteur** (retrait des icônes `User`, `Shield`, etc.).
  - **Zéro icône à côté de l'établissement ou de la description de l'entreprise** (retrait des icônes `Building`, `Building2`, etc.).
  - Les icônes ne sont conservées que pour les actions concrètes (télécharger, fermer, valider) ou les alertes réglementaires critiques.

---

## 2. Hiérarchie Visuelle & Règle d'Or Typographique

L'œil de l'utilisateur doit savoir immédiatement où se poser :
1. **La seule chose en gras sur un dossier/tableau est le nom de l'entreprise :**
   - Nom de l'entreprise / opérateur : `font-weight: 700` (Gras). C'est le repère d'ancrage visuel n°1.
2. **Les références administratives (`DGDA/DRK/ENQ/DC/...`) ne sont JAMAIS en couleur ni en gras :**
   - Typographie : `font-weight: 400` (Graisse normale).
   - Couleur : `var(--color-text-muted)` (Couleur neutre atténuée / ardoise discrète).
   - Jamais de bleu ou d'accent criard sur une référence de procédure.
3. **Poids visuel équilibré pour les métadonnées :**
   - Échéances, montants, régimes et inspecteurs sont présentés en graisse normale ou semi-neutre sans voler la vedette à l'entité contrôlée.

---

## 3. Ergonomie des Écrans : Pages Info vs Modales

* **Pas de modales de consultation / détail :**
  - L'affichage des détails d'une *Demande de communication* ou d'une *Feuille d'observation* se fait dans une **page info intégrée**, sobre et directe.
  - Les modales ne sont tolérées **que pour les formulaires de création / saisie**, afin de ne pas perturber la navigation en cours.
* **Sobriété des pages infos :**
  - Pas de cascade de widgets secondaires inutiles.
  - Résumé clair de l'affaire, statut opérationnel, échéance et accès direct au document PDF source.

---

## 4. Règle des Formulaires Épurés (Minimum Viable Fields)

Pour éviter la fatigue administrative et les formulaires à 15 champs, chaque formulaire est réduit au strict nécessaire opérationnel :

### A. Formulaire de Création d'une Demande de Communication
Seuls **5 champs essentiels** sont autorisés :
1. **Auteur de la demande** (Inspecteur / Rédacteur)
2. **Destinataire** (Entreprise ou banque sollicitée)
3. **Objet de la demande**
4. **Échéance légale de réponse**
5. **Fichier PDF joint** (Réquisition scannée signée)

### B. Formulaire de Création d'une Feuille d'Observation
Seuls **5 champs essentiels** sont autorisés :
1. **Nom de l'inspecteur vérificateur**
2. **Destinataire ou entreprise cible**
3. **Objet du contrôle**
4. **Audition contradictoire prévue** (Date / Heure / Lieu)
5. **Fichier PDF joint** (Observations notifiées)

---

## 5. Palette & Contraste 60-30-10 (DGDA)

* **60% Surfaces neutres :** Canvas sombre `#13191E` / lin minéral `#f7f1e6`.
* **30% Structure & Typographie :** Textes haut contraste WCAG 2.1 AA, police système Apple SF Pro / Inter.
* **10% Accents & Statuts :** Bleu d'action sobre, brique pour urgence/contentieux, vert sauge pour conformité, jaune ambré pour délai.
* **Règle absolue :** Zéro `box-shadow` et zéro bordure artificielle sur les cartes.

---

## 6. Modèle de Tableau Officiel Retenu : Zen Minimaliste & Filtres Intelligents (Tableau 05)

Le modèle ergonomique sélectionné pour l'ensemble de la refonte du site est le **Tableau 05 (Zen Minimaliste & Filtres Intelligents)**.

### Principes Clés d'Implémentation :
1. **Vues rapides par pilules (*Smart Chips*) :** 
   - Remplacement des dropdowns complexes par une barre de filtres directs en pilules cliquables (*Toutes*, *Urgences J-5*, *Valeur > 1M$*, etc.) avec compteurs intégrés.
2. **Colonnes configurables à la volée :**
   - L'utilisateur peut afficher ou masquer les colonnes secondaires (Régime, Poste frontalier, Marchandise, Risque, Inspecteur) selon son besoin immédiat, éliminant ainsi toute colonne superflue.
3. **Respiration et espacement (*Spacious Density*) :**
   - Padding vertical confortable (14px à 16px) évitant l'entassement des données et facilitant le scannage oculaire prolongé.
4. **Zéro bordure verticale abrasive :**
   - La distinction des colonnes repose sur un alignement rigoureux et des contrastes typographiques mesurés, sans grille grillagée agressive.
5. **Alignement strict des métadonnées financières :**
   - Les montants CAF sont alignés à droite avec la police tabulaire `font-sf` (propriété `tnum`), permettant une lecture verticale instantanée.
6. **Application stricte de la règle d'ancrage visuel :**
   - Seul le **nom de l'entreprise** est en gras (`font-weight: 700`).
   - La référence `DGDA/...` est affichée sous l'entreprise en graisse normale (`font-weight: 400`) et couleur atténuée neutre (`var(--color-text-muted)`).

