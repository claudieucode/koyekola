# KOLAKISA CMS — Apparence → Éditeur de fichiers des thèmes

Référence fonctionnelle : l'écran WordPress « Éditeur de fichiers des thèmes » (choix du thème, arborescence, code, enregistrement). Ce document décrit l'état **réel**.

## 1. Audit (état avant travaux)

- **Aucun éditeur de fichiers n'existait.** Le seul écran de thèmes était « Apparence → Thèmes » (liste, activation, aperçu).
- **Un thème Kolakisa n'est pas un dossier de fichiers** : c'est un paquet de DONNÉES (manifeste JSON : identifiant, nom, version, auteur, description, `api`, jetons du design system), stocké en base par site (`cms_themes`, migration 094) et validé strictement par `marketing/themes/catalog.js`. Il n'y a ni PHP, ni JavaScript, ni CSS écrits à la main, ni accès au système de fichiers : « aucun code, aucun script, aucune ressource externe n'est jamais exécuté ou chargé ».
- Activer un thème applique ses jetons au moteur de design existant (`mk_sites.tokens` pour un site, `appearance_configs` pour le principal) ; le rendu public les lit.
- Réutilisé : `services/themes.js` (stockage, activation vérifiée, retour arrière, audit), `catalog.validateManifest` (validation), `siteTarget` (site vérifié par le serveur), `routeScopes` (famille `themes-par-site` : la route est déjà gardée), `recordAudit`.
- Lacunes réelles : pas d'arborescence, pas d'édition du manifeste, pas d'historique, pas d'éditeur de code.

## 2. Décision d'architecture

Un éditeur « WordPress » (fichiers du disque) n'a **pas d'objet** ici et serait une régression de sécurité. L'éditeur présente donc des **fichiers virtuels** du manifeste d'un thème installé **sur le site courant** :

| Fichier | Contenu | Modifiable |
|---|---|---|
| `theme.json` | identité (key, name, version, author, description, api) ; `key` immuable | oui |
| `tokens/colors.json` | `colors`, `customColors` | oui |
| `tokens/typography.json` | `fonts`, `type`, `link`, `list` | oui |
| `tokens/components.json` | `buttons`, `images`, `forms` | oui |
| `tokens/layout.json` | `space`, `radius`, `shadow`, `border`, `sizes` | oui |
| `compiled/style.css` | feuille générée à partir des jetons | non (générée) |

Le thème d'origine de Kolakisa (intégré au moteur) se consulte mais ne se modifie pas.

Fichiers : `src/services/themeFiles.js` (service), `src/services/themes.js` (`manifestOf`, `saveManifest`), routes dans `src/marketing/web/themes.js`, vue `views/marketing/themes-files.ejs`, client `public/js/cms-theme-files.js`, éditeur de code `src/editor/theme-code-editor.js` → `public/js/theme-code-editor.js` (CodeMirror 6, MIT, construit avec `npm run build:editor`), migration `105_theme_revisions.sql`, entrée de menu « Éditeur de fichiers » (Apparence).

## 3. Sécurité

- **Chemins** : un chemin n'est valable que s'il figure, caractère pour caractère, dans la liste fermée `FILES`. Rien n'est résolu sur le disque : traversée de répertoires, liens symboliques, `.env`, secrets, chemins système sont sans objet (testés : `../`, `\`, octet nul, casse, `/etc/passwd`, `.env`…). Les erreurs ne reprennent jamais le chemin demandé.
- **Droits** : lecture `appearance.read`, écriture et restauration `appearance.publish` (même droit que l'activation, qui change le rendu public), contrôlés côté serveur à chaque appel (`need`).
- **Isolation** : le site vient de l'adresse vérifiée (`siteTarget`) ; un accès limité à un site ne peut viser que le sien (403 sinon) ; le thème est cherché dans `cms_themes` pour CE site seulement.
- **Écriture** : contenu texte ≤ 64 Ko, sans octet nul ; JSON réellement analysé ; clés autorisées par fichier ; manifeste reconstruit puis validé par `validateManifest` (couleurs, tailles, polices, identifiant) ; transaction avec mise à jour optimiste (`checksum`) ; si le thème est actif, jetons appliqués et **rendu vérifié**, sinon retour à l'état précédent.
- **Conflits** : l'empreinte SHA-256 lue à l'ouverture doit correspondre au contenu courant, sinon 409 et le texte de l'utilisateur reste dans l'éditeur.
- **Pas de fichier exécutable** : aucun PHP/JS n'existe dans un thème ; il n'y a donc ni validation syntaxique PHP ni procédure « fichier exécutable » à prévoir. Une validation de syntaxe ne garantirait de toute façon pas l'absence de vulnérabilité ; ici la surface est réduite à des données validées.

## 4. Historique

`cms_theme_revisions` (par site, thème et fichier) : version d'origine conservée à la première modification, puis chaque enregistrement ; 50 versions au plus par fichier. Consultation et **restauration** (qui crée une nouvelle version : l'historique n'est jamais réécrit). Limité au site et aux droits de la requête.

## 5. Interface

Barre : thème (nom, état actif/inactif/incompatible, version), fichier ouvert, état du document (Enregistré / Modifications non enregistrées / Erreur : non enregistré — « Enregistré » n'apparaît qu'après la réponse du serveur), Enregistrer, Annuler les modifications, Historique, Aide et sécurité. Explorateur repliable avec recherche et largeur réglable (souris et clavier). Éditeur : coloration JSON/CSS, numéros de ligne, repli, recherche/remplacement, annulation, parenthèses, erreurs JSON en ligne, Ctrl/Cmd+S. Garde « modifications non enregistrées » (enregistrer / abandonner / annuler) à l'ouverture d'un autre fichier ou thème ; avertissement avant de quitter la page.

## 6. Vérifications

`tests/theme-files-editeur.test.js` (12 tests, vraies routes et vraie base) : ouverture, sélection, arbre, lecture, écriture, validation, conflit, historique/restauration, thème actif (rendu mis à jour), thème d'origine et `style.css` refusés, chemins hostiles, permissions, isolation entre sites, menu. Vérification navigateur (Chrome) : ouverture, changement de fichier, saisie, garde, enregistrement, relecture serveur, rendu public, 0 erreur console, axe-core 0 violation (clair) ; mobile sans débordement.

## 7. Limites

- Pas de création/suppression/renommage de fichiers (le jeu de fichiers est fixe) ni de téléversement.
- Pas de comparaison visuelle (diff) entre versions : consultation et restauration seulement.
- Pas de rétablissement automatique garanti hors du cas « thème actif non appliqué au rendu ».
- Les jetons sont normalisés par le moteur : le contenu enregistré peut différer légèrement du texte saisi (l'éditeur affiche alors la version canonique).

## 8. Avertissement avant l'éditeur

Audit : Kolakisa n'a **pas d'éditeur de fichiers d'extensions** (les extensions sont des modules activables par site, sans fichiers) ; l'avertissement a donc été branché sur le seul éditeur de fichiers existant, celui des thèmes.

- Chaque **entrée** dans l'éditeur affiche d'abord une boîte de dialogue (titre, risques, conseils de sécurité, « Retour en sécurité » / « Je comprends les risques, continuer »). Tant qu'elle n'est pas confirmée, la page n'envoie **ni contenu de fichier ni script d'édition**.
- La confirmation (`POST …/fichiers/acces`) est enregistrée **côté serveur, en session**, à usage unique, pendant 10 minutes, liée à la personne et au site. Elle n'est mémorisée ni dans le navigateur ni en base ; un rechargement ou une nouvelle entrée redemandent la confirmation ; cliquer dans l'éditeur ne la redemande pas.
- **Elle ne remplace aucun contrôle** : les routes de lecture et d'écriture gardent leurs droits (`appearance.read` / `appearance.publish`), l'isolation par site, la validation des chemins et la protection d'origine (CSRF) — testé : un lecteur ne peut pas écrire, un autre site reste fermé, même sans passer par la boîte.
- Accessibilité : `<dialog>` modal (focus piégé, arrière-plan inerte), focus initial sur l'action sûre, titre et description associés, Échap = « Retour en sécurité » (jamais une confirmation), bouton désactivé pendant l'envoi (pas de double ouverture). Sans JavaScript, la boîte reste affichée dans la page.
- Fichiers : `views/marketing/themes-files.ejs` (mode `gate`), `public/js/cms-theme-files-gate.js`, styles `.tf-warn*` de `kola-compose.css`, routes dans `src/marketing/web/themes.js`.
