# KOLAKISA CMS — Apparence → Thèmes (palier THEMES-01)

Branche `apparence-themes-01`, issue de `pages-01-liste`. Référence : l'écran WordPress « Apparence → Thèmes » (grille de cartes, compteur, « Ajouter un thème », recherche, thème actif, notifications fermables). Ce document décrit l'état **réel**.

## 1. État initial (audit)

- **Il n'existait aucun écran « Thèmes »** ni notion de thème installable : « Apparence » contenait l'éditeur du site (styles, en-tête, pied de page, templates, patterns, menus). Le seul écran portant le mot « thème » (`/marketing/apparence`, `web/appearance.js`) règle la **couleur du menu de gauche de l'administration**, un choix personnel qui ne touche pas le site public ; il est conservé tel quel.
- **Deux moteurs de design déjà reliés au rendu public** :
  - site **principal** : `appearance_configs` (`services/appearance.js` : brouillon, publication, historique, feuille CSS compilée) lu par `res.locals.appearance()` ;
  - **site secondaire** : `mk_sites.tokens` (`pages.saveSiteDesign`, jetons `--kw-…`, schéma unique `pages/tokens.js`) lu par le gabarit public `marketing-public/landing.ejs`.
- Le site courant est établi par le serveur (`routeScopes.js`, `ctx.siteScope` / `ctx.siteFilter`, `siteContent.siteParam`) ; l'espace d'un site délègue les écrans partagés par l'adresse (`cmsNav.SITE_MODULES`, `siteSpace.attach`).

## 2. Architecture retenue (aucun second moteur de thèmes)

Un **thème est un paquet de données** : identifiant, nom, version, auteur, description, version de format (`api`) et **jetons du design system**. Il ne contient jamais de code, de script ni de ressource externe.

| Brique | Fichier |
|---|---|
| Catalogue Kolakisa (5 thèmes réels : Océan, Ardoise sombre, Savane, Forêt, Éditorial) + thème d'origine intégré ; validation stricte des manifestes | `src/marketing/themes/catalog.js` |
| Service : installés / catalogue / installer / activer / revenir / supprimer / aperçu | `src/services/themes.js` |
| Routes et vues (liste, ajout, fiche, aperçu, actions) | `src/marketing/web/themes.js`, `views/marketing/themes*.ejs`, `partials/theme-shot.ejs`, `public/js/cms-themes.js`, `.mk-th-*` dans `public/css/cms.css` |
| Aperçu réel (jetons remplacés en mémoire pour une réponse) | `src/middlewares/themePreview.js` (branché dans `locals.js`) |
| Données | migration `094_themes_par_site.sql` (table `cms_themes`) |
| Menu, délégation, portée | `cmsNav.js` (entrée « Thèmes », module délégué), `routeScopes.js` (`themes-du-site`, famille `themes-par-site`) |

**Activer un thème = appliquer ses jetons avec le moteur existant**, pas écrire une étiquette :
- site secondaire → `pages.saveSiteDesign` (validation, révision, audit, invalidation des caches de sites) ;
- site principal → `appearance.setDraft` + `appearance.publish` (historique conservé) puis `appearance.bump()`. Si un brouillon d'apparence est en cours, l'activation est **refusée** avec un message (rien n'est écrasé).
Les couleurs personnalisées du site sont conservées (des pages peuvent les utiliser).

## 3. Modèle de données et multisite

`cms_themes` : une ligne par thème **installé sur un site** (`site_id` NULL = principal), clé unique `(COALESCE(site_id,0), theme_key)`, index unique partiel « un seul thème actif par site ». Colonnes : manifeste JSON, empreinte SHA-256, source (`catalogue` | `import`), installateur, `active`, `activated_by/at`, `previous_key` et `previous_tokens` (jetons du site **avant** l'activation, pour le retour).
Le thème « Kolakisa — d'origine » est intégré au moteur (jamais en base) : un site sans ligne active l'utilise. Migration additive, réversible par `DROP TABLE cms_themes` (aucune table existante modifiée).

Isolation :
- Les thèmes installés, le thème actif et les jetons sont **par site** : installer/activer/supprimer sur A ne change ni la liste, ni le thème actif, ni les jetons, ni le rendu de B, de C ou du principal.
- Le site vient de l'adresse vérifiée (`/sites/<id>/themes` → `?site=<id>`, ou champ `site` des formulaires) ; sans site, le principal (équipe seulement). Un accès limité à un site agit sur le sien uniquement : tout autre site, ou une valeur forgée, est refusé côté serveur (`target()` dans `web/themes.js` + garde de portée `routeScopes`). Aucun état global, cookie ou session ne choisit le site.
- Tous les liens et formulaires de la liste, de l'ajout, de la fiche et de l'aperçu portent `site=<id>` (testé).

## 4. Fonctions

- **Liste** : titre, compteur réel, grille responsive, carte avec aperçu, « Actif : … », actions selon l'état (inactif : Détails / Prévisualiser / Activer ; actif : Détails, « Revenir au thème précédent » si disponible ; incompatible : étiquette, aucune activation), carte « Ajouter un thème », recherche serveur **et** instantanée, liste vide, notifications fermables (mémorisées pour la session), aide, état « en cours » et anti double envoi sur les formulaires.
- **Aperçu des cartes** : miniature **générée à partir des jetons réels** du thème (couleurs, polices, rayons) ; elle est présentée comme telle (`aria-label`), ce n'est pas une capture trompeuse.
- **Ajouter un thème** : catalogue Kolakisa (réel, tous installables, « Installé » si déjà là, recherche) + **import d'un paquet JSON** (fichier ou collage, 64 Ko au plus) validé champ par champ : champs inconnus refusés, identifiant réservé `kolakisa` refusé, usurpation d'un thème du catalogue avec un contenu différent refusée, jetons revalidés par le moteur de design, format plus récent refusé. Rien n'est écrit si la validation échoue.
- **Prévisualiser** : la **vraie page du site** (page d'accueil du site, sinon sa première page ; `/` pour le principal) est affichée dans un cadre avec `?kwtheme=<identifiant>` ; le moteur de rendu normal est utilisé, seuls les jetons sont remplacés en mémoire pour cette réponse (`no-store`, `noindex`). Réservé aux personnes ayant `appearance.read` sur **ce** site ; un visiteur ou un accès limité à un autre site n'obtient aucun effet. Rien n'est enregistré ni publié. Un site sans page affiche une explication claire.
- **Activer** : droits (`appearance.publish`), site actif, thème installé et compatible, confirmation, écriture dans le moteur de design en transaction (SAVEPOINT), un seul thème actif (index unique), **vérification que le rendu lit bien les nouveaux jetons**, sinon retour automatique à l'état précédent et message d'erreur ; journal `theme.activated` (avec le site).
- **Revenir au thème précédent** : restaure les jetons et le thème d'avant (même vérification).
- **Supprimer** : refusé pour le thème actif et pour le thème d'origine ; supprime **uniquement la ligne de ce site** (aucun fichier, pages/médias/réglages intacts) ; journal `theme.removed`.
- **Fiche** : version, auteur, source, compatibilité, état, date d'installation, description, palette, actions.

## 5. Permissions (côté serveur)

| Action | Permission | Rôle minimal |
|---|---|---|
| Voir liste, ajout, fiche, aperçu | `appearance.read` | lecteur |
| Installer (catalogue / paquet) | `appearance.styles` | éditeur |
| Activer, revenir, supprimer | `appearance.publish` | administrateur |

Les boutons sont aussi masqués dans l'interface, mais le contrôle est refait par les routes.

## 6. Validation

`tests/apparence-themes.test.js` — 28 tests sur de vraies routes, une vraie base et de vrais comptes (3 sites + principal, administrateur/éditeur/lecteur d'un site) : liste et compteur, catalogue, recherche, installation (catalogue, paquet valide, 13 paquets invalides), permissions par rôle, accès limité refusé sur B/principal avec valeurs forgées, activation + rendu de la page du site + persistance + journal, isolation A/B/C/principal, thème incompatible, retour, couleurs personnalisées conservées, principal (publication, rendu public, brouillon en cours refusé), aperçu réel (aucun enregistrement, aucun effet pour un visiteur ou un autre site), détails, suppression (actif/origine refusés, inactif supprimé sans toucher aux autres données, même identifiant sur un autre site intact), site archivé, site inconnu, conservation du site dans tous les liens et formulaires, entrée de menu.

## 7. Limites connues (non faites, pas simulées)

- **Pas de catalogue distant ni de paquets .zip / code** : un thème n'est que des jetons de design. Aucune source externe n'est interrogée ; c'est le flux sûr compatible avec l'architecture actuelle. Les thèmes de blocs (templates, en-tête/pied de page) ne font pas partie du paquet : ils restent gérés par Apparence → Templates / En-tête / Pied de page.
- **Thème d'origine = jetons par défaut** : un site dont les styles ont été personnalisés à la main est affiché comme ayant le thème d'origine actif (le suivi « personnalisé » n'existe pas) ; activer un thème remplace les jetons du site (les couleurs ajoutées sont conservées, les autres réglages de design sont remplacés) — d'où la confirmation et le retour au thème précédent.
- **Retour au thème précédent** : un seul niveau (l'état d'avant la dernière activation) ; l'historique fin du principal reste dans Apparence → Éditeur du site (versions publiées).
- **Mise à jour d'un thème** (« Nouvelle version disponible ») : non implémentée ; réinstaller une nouvelle version exige de supprimer l'ancienne.
- **Personnaliser** (bouton WordPress du thème actif) : l'équivalent est Apparence → Styles / Éditeur du site, déjà présents ; il n'y a pas de bouton dupliqué.
- **Aperçu** : couvre la page d'accueil du site (ou sa première page) ; le blog, les modèles et les pages d'erreur du principal ne sont pas encadrés (le paramètre `?kwtheme=` fonctionne sur toute page rendue par le gabarit public d'un site et sur le CSS d'apparence du principal).
- **Contrôle visuel en navigateur réel** (alignements, survol, responsive) : non exécuté ; les tests vérifient le rendu serveur et la logique.
