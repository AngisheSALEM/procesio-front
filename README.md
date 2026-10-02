# Procezo — interface

Cette interface React utilise l’API Django de `C:\dev\procezo_backend`. Le navigateur échange avec `/api/v1/` ; seul le backend accède à la base de données. En développement, Vite relaie ces requêtes vers `http://127.0.0.1:8000`.

## Démarrage local

Dans un premier terminal :

```powershell
cd C:\dev\procezo_backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
$env:PROCEZO_DEMO_PASSWORD = "une-phrase-secrete-de-demo"
python manage.py seed_front_demo
python manage.py runserver 127.0.0.1:8000
```

`seed_front_demo` crée des comptes et parcours **fictifs**, uniquement avec `DEBUG=True`. Connexion possible avec `demo_manager`, `demo_agent_1` ou `demo_agent_2` et la phrase définie dans `PROCEZO_DEMO_PASSWORD`. Sur une base déjà amorcée, `seed_demo` ne réinitialise pas les mots de passe existants.

Dans un second terminal :

```powershell
cd C:\dev\procezofront
npm ci
npm run dev
```

Ouvrir l’adresse Vite affichée dans le terminal. Si Django écoute ailleurs, définir `VITE_API_PROXY_TARGET` avant `npm run dev`. Pour un déploiement, servir `/api/v1/` et l’interface sous la même origine afin de conserver les cookies de session et la protection CSRF.

## Vérification

```powershell
npm test
npm run build
npm run lint
```

Les données opérationnelles sont lues et écrites via l’API. Les actes officiels, les PV et les pièces en quarantaine suivent les droits et étapes de validation du backend ; les jeux fictifs ne remplacent pas ces étapes.


## Parcours documents et demandes

Dans **Documents**, déposer un PDF, PNG ou JPEG, consulter son état antivirus, réanalyser une pièce en quarantaine ou manquante, puis télécharger uniquement les pièces acceptées. Si ClamAV est absent ou en erreur, la pièce reste en quarantaine. Pour vérifier le scanner dans le terminal du backend : `python manage.py check_document_scanner`.

Dans **Demande de communication**, ouvrir une demande, modifier son brouillon, préparer un PDF généré ou sélectionner un PDF déjà déposé et accepté, puis soumettre. Le responsable disposant des délégations peut valider ou retourner avec un motif. Les constats de signature et d’émission exigent des preuves PDF acceptées et des dates réelles ; les preuves de signature et d’envoi sont distinctes. Les actions proposées viennent du serveur et chaque transition transmet la version courante. Les anciens PDF et l’historique des preuves restent consultables.

Une réponse peut utiliser un nouveau fichier ou un courrier déjà déposé. Après un dépôt en quarantaine, reprendre avec la pièce existante une fois sa réanalyse réussie.

Le panneau **Réponses et appréciations individuelles** conserve chaque courrier, ses annexes et ses éléments associés. Un complément désigne son courrier précédent. La rectification des liens exige un motif et conserve l'historique. Chaque élément reçoit une appréciation motivée indépendante ; **Non satisfait** n'apprécie aucun autre élément et ne classe pas le dossier.

Dans **Feuille d’observation**, enregistrer une mission réalisée avec ses participants et justificatifs, puis choisir cette mission à la création d'une feuille. Modifier les constats et leurs justificatifs, préparer et télécharger les projets PDF par version, enregistrer les défenses avec leurs annexes et uniquement les constats concernés. Chaque constat possède son appréciation motivée et son historique. Les données enregistrées sont rechargées depuis l'API ; les modifications conservent les UUID et associations existants. Un constat lié ne peut pas être retiré.

Pour reproduire le contrôle de deux réponses partielles et d'une défense d'O1 sans effet sur O2, lancer le serveur isolé avec `python scripts/browser_document_fixture.py --workflow --port 8011 --front-port 5181`, puis Vite avec `VITE_API_PROXY_TARGET=http://127.0.0.1:8011` sur le port 5181. Les pièces fictives initiales seules utilisent un scanner simulé ; la base et les fichiers sont temporaires.

Tests : `npm test`, `npm run build`, `npm run lint`. Le backend fournit `scripts/browser_document_fixture.py` pour une vérification navigateur sur une base temporaire isolée, avec deux preuves fictives contrôlées par un scanner simulé uniquement pendant la création des fixtures. Les dépôts du navigateur utilisent ensuite le scanner normal. Lancer Vite sur le port 5174 avec `VITE_API_PROXY_TARGET=http://127.0.0.1:8001`. Cette fixture ne doit pas servir de scanner ni de données de production.

## Décisions et relais GELEC

Dans la **Vue d’ensemble** du dossier, le panneau **Décisions et relais GELEC** permet de choisir une appréciation de fond actuelle d’un élément de demande ou d’une observation, une orientation et un motif. Un autre responsable disposant de la délégation valide ou retourne la proposition avec son motif. Une proposition suivante désigne la décision précédente ; les décisions, leurs sources, auteurs, validateurs et événements restent consultables. La dernière décision validée reste courante pendant un retour ou une nouvelle proposition. Le dossier, les listes de classement et les statistiques suivent cette décision, y compris lorsque le remplacement passe par une proposition retournée.

Pour une orientation GELEC validée courante, préparer le relais, puis choisir un PDF accepté du dossier et la date réelle pour enregistrer la transmission. La réception exige sa propre confirmation et sa preuve. La référence est facultative ; les dates réelles restent distinctes des dates d’enregistrement. Une même tentative conserve sa clé d’idempotence lors d’un réessai après une erreur réseau. Une préparation remplacée ne peut plus être transmise, mais la réception tardive d’un envoi déjà effectué reste enregistrable.

Ces étapes conservent les limites **prototype** : relais manuel, aucune connexion réseau à GELEC, aucun PV officiel créé, aucune signature officielle et aucune règle DGDA définitive implicite. SQLite et les habilitations de démonstration ne constituent pas une validation de mise en production.

Vérification navigateur isolée : dans le backend, `python scripts/browser_decision_fixture.py` démarre une base temporaire sur le port 8002. Dans le front, définir `VITE_API_PROXY_TARGET=http://127.0.0.1:8002` et lancer Vite sur le port 5175. Comptes fictifs : `qa_author`, `qa_reviewer`, `qa_undelegated` ; mot de passe de test `procezo-local-ui-test-only`. Les PDF de fixture sont simulés uniquement lors de leur création ; la base applicative reste intacte.
