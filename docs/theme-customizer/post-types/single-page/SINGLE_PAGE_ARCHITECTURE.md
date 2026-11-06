# Page individuelle : architecture

## Place dans Kolakisa
Rubrique **Apparence → Personnaliser → Types de publication → Page individuelle** (panneau `type-page`). Aucun second moteur : le panneau ajoute des réglages au **catalogue fermé** du personnalisateur ; les valeurs vivent dans les réglages du site et sont rendues par le moteur de pages existant. Voir `SINGLE_PAGE_REVERSE_ENGINEERING.md` pour l'état de l'existant.

## Données
| Niveau | Stockage | Écrit par |
|---|---|---|
| Global du site | `mk_sites.settings.pageSingle` | personnalisateur (brouillon `cms_customizer_drafts`, publication, versions) |
| Exception d'une page | `mk_landing_pages.theme.single` | enregistrement de la page (`normalizeTheme`) |
Aucune migration SQL. Le site principal n'a pas de bloc `settings` : **hors périmètre** (affiché dans « Non disponible pour ce site »).

## Modules
- `src/marketing/pages/pageSingle.js` : constantes, `normalize` (strict ou tolérant, global ou partiel), `merge` (priorité), `resolveFor`, `hasH1`, `css`.
- `src/marketing/pages/siteSettings.js` : `DEFAULT_SETTINGS.pageSingle`, `normalizeSettings`, `layoutCss` (feuille globale, donc aperçu direct).
- `src/marketing/pages/index.js` (`normalizeTheme`) et `src/marketing/landing/index.js` (`nodeCss`) : exception de page, écrite **après** le global.
- `views/marketing-public/landing.ejs` : classe `kw-kind-page` sur `<body>`, zone de titre, grille de colonne latérale. Aides `pageSingleFor` / `pageHasH1` dans `src/middlewares/locals.js`.
- `src/services/customizerPageSingle.js` (déclaration des 70 réglages) et `src/services/customizer.js` (panneau, `ALWAYS`, `UNSUPPORTED.principal`).
- `public/js/customizer.js`, `public/css/customizer.css`, `views/marketing/customizer.ejs` (icône) : groupes, onglets, vignettes, boutons à choix, marges à quatre côtés.

## Priorité (documentée et testée)
exception de la page > global « Page individuelle » > réglages du site (largeur, gouttière) > défauts du moteur (`landing.css`). Un champ absent hérite du niveau supérieur ; supprimer l'exception ramène au global. Mécanisme : ordre CSS (feuille du site, puis `nodeCss` de la page), spécificité identique, aucun `!important`.

## Portée
Seules les pages `kind = 'page'` d'un **site** reçoivent `kw-kind-page` : landing pages, étapes de tunnel, blog et modèles Theme Builder ne sont jamais affectés. L'accueil du site (une page `kind='page'`) est inclus.

## Colonne latérale
Réutilise la zone de widgets existante **« sidebar »** (Apparence → Widgets), partagée avec le blog. Si la zone est vide, **aucune colonne** n'est rendue (pas de `kw-ps-sb`, pas de `<aside>`), seul l'état d'aide reste dans le personnalisateur.
