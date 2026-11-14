# SEO du site principal : quatre entrées qui ouvraient la vue générale (14 novembre 2026)

**Cause exacte.** Le registre du menu (`src/marketing/web/cmsNav.js`) déclare 13 rubriques SEO, dont « Liens internes », « Positions », « Google » (`seo/connexions`) et « Export / import » (`seo/transfert`). Pour le **site principal** (équipe de l'organisation, adresse `/marketing/site-web/seo/<rubrique>`), ces adresses étaient servies par le routeur générique `cmsScreens.js` (`SCREENS.seo(req, ctx, sub)`), dont le `switch` ne connaissait que 9 rubriques (analyse, meta, indexation, sitemap, schema, open-graph, robots, 404). Les quatre autres tombaient dans `default` = la vue générale (« Espace SEO / Audit du site / Redirections »). Les vraies interfaces existaient, mais seulement pour les sites créés (`/sites/<id>/seo/...`, `siteSeo.js`, qui refuse le principal : `spaceOf` → `null`). Ce n'était ni un problème de menu, de fil d'Ariane, ni de route parente : un fallback silencieux.

**Correction (aucune interface recréée).**
* `src/marketing/web/siteSeo.js` : les routes de ces quatre rubriques (GET et POST : mesures, import, API Search Console, clé Google, test, déconnexion, export, import, WordPress) sont aussi servies à `/site-web/seo/<rubrique>`, avant le routeur générique, derrière `mainGate` (réservé à l'équipe de l'organisation : un accès limité à un site reçoit 403) ; l'espace est celui du principal (`siteId: null`).
* `src/seo/linkSuggestions.js` : lit aussi les pages du principal (`site_id IS NULL`) ; seul service qui n'acceptait pas encore le principal (rankings, intégrations, transfert le géraient déjà).
* Données : le principal utilise `site_id NULL` (positions), la configuration Google « centrale » (la même que `/formateur/seo/integrations`), un export de portée « central ». Aucun mélange avec les sites.
* Les 9 autres rubriques et les routes des sites ne sont pas modifiées.

**Tests.** `tests/seo-principal-quatre-pages.test.js` (9) : titre propre à chaque écran, entrée de menu seule active, pas de vue générale, mesure du principal invisible dans un site, clé jamais réaffichée, export central/site, autres rubriques inchangées. Avant correction : 0/9 ; après : 9/9.
**À noter.** « Positions », « Liens internes » du principal n'affichent des données que si le principal a des pages publiées / des mesures saisies ou importées : rien n'est inventé.
