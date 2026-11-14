# SEO du site principal : quatre entrées qui ouvraient la vue générale (14 novembre 2026)

**Cause exacte.** Le registre du menu (`src/marketing/web/cmsNav.js`) déclare 13 rubriques SEO, dont « Liens internes », « Positions », « Google » (`seo/connexions`) et « Export / import » (`seo/transfert`). Pour le **site principal** (équipe de l'organisation, adresse `/marketing/site-web/seo/<rubrique>`), ces adresses étaient servies par le routeur générique `cmsScreens.js` (`SCREENS.seo(req, ctx, sub)`), dont le `switch` ne connaissait que 9 rubriques (analyse, meta, indexation, sitemap, schema, open-graph, robots, 404). Les quatre autres tombaient dans `default` = la vue générale (« Espace SEO / Audit du site / Redirections »). Les vraies interfaces existaient, mais seulement pour les sites créés (`/sites/<id>/seo/...`, `siteSeo.js`, qui refuse le principal : `spaceOf` → `null`). Ce n'était ni un problème de menu, de fil d'Ariane, ni de route parente : un fallback silencieux.

**Correction (aucune interface recréée).**
* `src/marketing/web/siteSeo.js` : les routes de ces quatre rubriques (GET et POST : mesures, import, API Search Console, clé Google, test, déconnexion, export, import, WordPress) sont aussi servies à `/site-web/seo/<rubrique>`, avant le routeur générique, derrière `mainGate` (réservé à l'équipe de l'organisation : un accès limité à un site reçoit 403) ; l'espace est celui du principal (`siteId: null`).
* `src/seo/linkSuggestions.js` : lit aussi les pages du principal (`site_id IS NULL`) ; seul service qui n'acceptait pas encore le principal (rankings, intégrations, transfert le géraient déjà).
* Données : le principal utilise `site_id NULL` (positions), la configuration Google « centrale » (la même que `/formateur/seo/integrations`), un export de portée « central ». Aucun mélange avec les sites.
* Les 9 autres rubriques et les routes des sites ne sont pas modifiées.

**Tests.** `tests/seo-principal-quatre-pages.test.js` (9) : titre propre à chaque écran, entrée de menu seule active, pas de vue générale, mesure du principal invisible dans un site, clé jamais réaffichée, export central/site, autres rubriques inchangées. Avant correction : 0/9 ; après : 9/9.
**À noter.** « Positions », « Liens internes » du principal n'affichent des données que si le principal a des pages publiées / des mesures saisies ou importées : rien n'est inventé.

## Refonte UI des écrans Google, Positions, Export / import (14 novembre 2026)
* Feuille dédiée `public/css/seo-tools.css` (chargée par `views/marketing/site-seo/_head.ejs`) : cartes compactes, grille de formulaire à 12 colonnes (champs de 38 px), badges d'état, zone de dépôt de fichier, interrupteurs, tableau compact. **Elle remplace le bloc `gx-*` de `cms.css`, qui avait été écrasé deux fois par la fusion d'autres branches** : un fichier dédié évite cette collision.
* Google : deux cartes empilées ; zone JSON de 5 lignes redimensionnable avec choix du fichier .json (lu dans le navigateur, validé avant envoi) ; instructions Google dans un bloc latéral discret ; état venu du serveur.
* Positions : formulaire en grille ; tableau compact avec écart (seulement s'il existe), badge de source, suppression ; indicateurs = comptages réels ; import CSV par fichier ou collage, confirmé par le serveur.
* Export / import : exportation et importations séparées en cartes ; interrupteur « Enregistrer réellement » (désactivé = aperçu).
* Aucune route, API, validation ni règle d'isolation modifiée ; mêmes noms de champs. Test Chrome : `tests/seo-google-cartes-navigateur.test.js` (7).
