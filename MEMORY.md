# Procezo — Mémoire Projet (MEMORY.md)

## 1. Contexte & Périmètre du Projet
- **Client / Organisme :** Direction Générale des Douanes et Accises (DGDA - RDC).
- **Application :** Procezo Front-End.
- **Objectif :** Accompagner l'instruction des enquêtes douanières et contrôles a posteriori, de la réception du renseignement jusqu'à la transmission contentieuse vers GELEC.
- **Référence Design System :** `C:\Users\Salem\Downloads\procezo-design-system.md`.
- **Typographie & Iconographie :** Apple SF Pro, SF Mono, et pack vectoriel SF Symbols / Lucide (traits de 1.5 à 2px, zéro emoji).

---

## 2. Décisions d’Architecture & Implémentation

### A. Données Métier & Schéma
- **`DossierEnquete` :** Référence unique, objet, périmètre, motif d’ouverture, unité de rattachement (ex: DRK Lubumbashi), responsable, échéance légale, équipe de vérification, déclaration(s) SYDONIA liées.
- **`DemandeCommunication` :** Adossée à l’Article 46 du Code des douanes. Exige un signataire ayant un grade de commandement. Découpe chaque pièce requise avec un état unitaire (*Fourni*, *Manquant*, *Incomplet*). Enregistre les courriers reçus avec examen motivé de l’enquêteur et décision de relance.
- **`FeuilleObservation` :** Adossée aux Articles 44 à 49 de la Décision DG/DGDA/DG/2011/296. Articulée autour de constats individuels numérotés (**O1, O2, O3...**). Chaque constat intègre les faits, justifications, questions, éléments de défense reçus et l’appréciation motivée de l'enquêteur (*Point expliqué*, *Complément requis*, *Constat confirmé pour contentieux*).
- **`Renseignement` :** Objet distinct du dossier, pouvant faire l’objet d'une alerte multi-bureaux sans créer d'entreprise artificielle.
- **`Documents & Relais GELEC` :** Séparation formelle entre PV d’opérations (Art. 44) et PV d’infraction (Art. 356-357). Bordereau de transmission vers GELEC avec filtrage automatique des sources confidentielles.

### B. Architecture Bipersonna & Authentification (DGDA)
- **Les 2 personas officiels :**
  1. **Administrateur** : Chef d'unité / Directeur. Accès à la supervision des missions, gestion globale des dossiers, rapports & statistiques, et paramètres.
  2. **Enquêteur** : Inspecteur vérificateur de terrain. Accès à son travail direct, instruction détaillée des dossiers, renseignements, et canevas types.
- **Page de Connexion (`LoginPage.tsx`) :** Portail d'authentification avec sélection rapide du profil Admin ou Enquêteur, et déconnexion sécurisée.
- **Identité de l'agent dans la barre de navigation (`Sidebar.tsx`) :** Le nom, matricule et fonction sont affichés en pied de navigation avec bouton de déconnexion (retirés du header).
- **Thème visuel dans la page Paramètres (`ParametresView.tsx`) :** Le sélecteur clair/sombre a été déplacé du header vers les paramètres du compte.
- **Barre de recherche flottante en pilule (`Header.tsx`) :** Plaquée en haut à droite, translucide et épurée.
- **Suppression intégrale de la dette technique & citations légales artificielles :** Textes rédigés de manière naturelle, humaine et professionnelle.

### C. Composants Principaux
| Composant | Rôle & Fonctionnalités |
|---|---|
| `LoginPage.tsx` | Écran de connexion officiel DGDA avec choix de persona (Admin ou Enquêteur). |
| `Header.tsx` | En-tête épuré avec logo officiel DGDA et barre de recherche flottante en pilule. |
| `Sidebar.tsx` | Navbar latérale flottante dépolie (frosted glass), repliable, avec identité de l'agent et déconnexion. |
| `ParametresView.tsx` | Page de paramètres avec sélecteur de thème clair/sombre, profil agent et préférences d'alertes. |
| `DossierHeader.tsx` | En-tête répondant aux 5 questions clés + 5 onglets régaliens sans badges polluants. |
| `DemandeCommunicationView.tsx` | Suivi et analyse des pièces demandées et des réponses reçues. |
| `FeuilleObservationView.tsx` | Constats individuels d'observation, arguments contradictoires et appréciation motivée. |
| `VueEnsembleTab.tsx` | Fiche opérateur, déclarations SydoniaWorld rattachées et équipe de vérificateurs. |
| `DocumentsTab.tsx` | Actes de procédure et bordereau de transmission du contentieux. |
| `HistoriqueTab.tsx` | Journal d'audit horodaté inaltérable. |
| `MonTravailView.tsx` | Espace de travail avec dossiers prioritaires et échéances. |
| `RenseignementsView.tsx` | Qualification et partage du renseignement douanier. |
| `DocumentsModelesView.tsx` | Gestionnaire de canevas types et modèles de documents. |
| `RapportsStatsView.tsx` | Indicateurs d'activité et tableaux de bord de pilotage. |

### C. Hook de Conformité Charte (`useDesignSystemAudit.ts`)
- Détecte en temps réel toute présence d'emoji via regex Unicode `/\p{Extended_Pictographic}|\p{Emoji_Presentation}/u`.
- Audite les styles calculés pour interdire tout `box-shadow` sur cartes, boutons et formulaires.
- Audite et interdit formellement les bordures sur les cartes (surfaces étagées pures sans contour).
- Vérifie l'absence totale de couleurs fluorescentes ou néon non autorisées.
- Comptabilise les icônes vectorielles conformes (traits Lucide / SF Symbols).

---

## 3. Conformité aux Règles Strictes Demandées
- [x] **Zéro box-shadow & Zéro bordure sur les cartes :** profondeur assurée exclusivement par les surfaces étagées (`#222126`, `#353333`, `#403D3D` en sombre, `#FFFFFF` sur `#f7f1e6` en clair).
- [x] **Zéro couleur néon :** Palette 60–30–10 respectée (Night Asphalt, Lin Clair `#f7f1e6`, Mustard Glow, Retro Red, Denim Blue).
- [x] **Zéro emoji :** Aucun emoji dans l'ensemble du code, interfaces et libellés.
- [x] **Typographie SF Pro :** Déclarée en tête de pile de polices système Apple / standard.
- [x] **Interfaces Demande de communication & Feuille d'observation :** Développées avec tous leurs détails réglementaires et interactions complètes.
- [x] **Ergonomie & théorie des couleurs appliquée :** Hiérarchie stricte des boutons (1 seul CTA primaire `.btn-primary` par zone), capsules de statut à surfaces teintées douces (`.badge-status`), et micro-interactions tactiles fluides (`.card-interactive`).
- [x] **Fichiers AGENT.md et MEMORY.md :** Rédigés et versionnés à la racine du projet.
