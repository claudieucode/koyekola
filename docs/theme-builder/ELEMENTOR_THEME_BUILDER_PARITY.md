# Registre de parité Elementor ↔ Kolakisa

Statuts : ABSENT · PARTIEL (existant, insuffisant) · PRÉVU (lot) · FAIT (testé) · NON PRIS EN CHARGE (raison). **Mis à jour à chaque lot ; aucune ligne n'est FAIT sans test exécuté.**

| # | Référence Elementor | État initial Kolakisa | Implémentation prévue | Fichiers | Tests | Statut |
|---|---|---|---|---|---|---|
| 1 | Tableau de bord « toutes les parties » avec miniatures | absent | lot 3 | `views/marketing/theme-builder*.ejs` | theme-builder-routes.test.js | FAIT (10 tests, lot 3) |
| 2 | Barre latérale par type + point vert/gris | absent | lot 3 | idem | theme-builder-routes.test.js | FAIT (10 tests, lot 3) |
| 3 | Header | PARTIEL (1 par site, sans conditions) | lot 2 (modèle + conditions), lot 5 (rendu) | `src/themeBuilder/*` | theme-builder-rendu.test.js | FAIT pour les sites du gestionnaire (rendu public, 8 tests, lot 5) ; site principal : ancien système |
| 4 | Footer | PARTIEL | idem | idem | theme-builder-rendu.test.js | FAIT pour les sites du gestionnaire (rendu public, 8 tests, lot 5) ; site principal : ancien système |
| 5 | Single page | ABSENT (seulement « À propos ») | lot 5 | `render` | — | PRÉVU |
| 6 | Single post | PARTIEL (11 familles par organisation) | lot 2 import + lot 5 | `render.js`, `themeRender.js` | theme-builder-couverture-rendu.test.js (test 3) | FAIT pour les sites à domaine propre (rendu public vérifié sur serveur réel, 02/11/2026) |
| 7 | Archives (catégorie/étiquette/auteur/blog) | PARTIEL | idem | idem | theme-builder-couverture-rendu.test.js (test 4) | FAIT pour les sites à domaine propre (le plus précis gagne, vérifié le 02/11/2026) |
| 8 | Archives par date | ABSENT (pas d'adresses de date) | NON PRIS EN CHARGE tant que le blog n'a pas d'archives de dates | — | — | NON PRIS EN CHARGE |
| 9 | Résultats de recherche | PARTIEL (blog seulement) | lot 5 | idem | theme-builder-couverture-rendu.test.js (test 4) | FAIT pour les sites à domaine propre (vérifié le 02/11/2026) |
| 10 | 404 | FAIT (existant) | importé | `server.js` → `renderRegion` | theme-builder-couverture-rendu.test.js (tests 1 et 4) | FAIT pour les sites à domaine propre (modèle « Page 404 » + en-tête/pied, vérifié le 02/11/2026) |
| 11 | Sidebar | ABSENT | lot 6 (type + zone si le moteur de rendu le permet) | `render.js` (`resolveExtras`), `themeRender.js`, `footer.ejs` | theme-builder-barre-laterale-personnalise.test.js (test 3) | FAIT (02/11/2026) : le modèle publié le plus précis s'affiche **sous le contenu, avant le pied de page** (pas en colonne latérale : la mise en page des pages n'a pas de colonne) |
| 12 | Single Product / Product Archive | PARTIEL (20.5) | lot 5 | — | — | FAIT par site (résolution catégorie/général, 1 test service ; rendu via renderRegion) ; pages panier/paiement/compte non couvertes |
| 13 | Panier / paiement / compte (Woo Pro) | ABSENT | lot 6 selon moteur boutique ; jamais de faux paiement | — | — | PRÉVU |
| 14 | Conditions Inclure/Exclure | PARTIEL (exclusions limitées) | lot 1 | `conditions.js`, `match.js` | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 15 | Entire Site, Front Page, All Singular, Posts, Pages, Direct child / Any child, By Author, 404 | PARTIEL | lot 1 | idem | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 16 | Archives : Author, Date, Search, Posts Archive, Categories (+ enfants), Tags | PARTIEL | lot 1 (Date : critère accepté, sans effet tant que pas d'archive de date) | idem | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 17 | WooCommerce : Shop, Product Category/Tags, Products, In Category/Tag, by Author | PARTIEL | lot 1 | idem | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 18 | Landing Pages, Floating buttons, Media (cibles Singular) | NON PRIS EN CHARGE (pas de ces types de contenu) | — | — | — | NON PRIS EN CHARGE |
| 19 | Avertissement de conflit | PARTIEL | lot 1 + 3 | `resolve.js` | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 20 | Instances (où le modèle est utilisé) | ABSENT | lot 2/3 | `store.js` | theme-builder-stockage.test.js | SERVICE FAIT (13 tests, lot 2) ; écran : lot 3 |
| 21 | Edit / Edit Conditions | PARTIEL | lot 3 | — | theme-builder-routes.test.js | FAIT (10 tests, lot 3) |
| 22 | Rename / Trash / Export | PARTIEL | lot 2 | `store.js`, `portable.js` | theme-builder-stockage.test.js | SERVICE FAIT (13 tests, lot 2) ; écran : lot 3 |
| 23 | Import `.json` | ABSENT | lot 2 | `portable.js` | theme-builder-stockage.test.js | SERVICE FAIT (13 tests, lot 2) ; écran : lot 3 |
| 24 | Import `.zip` | NON PRIS EN CHARGE (JSON seulement, pas d'exécutable) | — | — | — | NON PRIS EN CHARGE |
| 25 | Miniatures auto / image mise en avant | ABSENT | lot 4 | `thumb.js`, `GET …/miniature` | theme-builder-vignettes-retour.test.js, theme-builder-kolakisa-ui.test.js | FAIT pour les miniatures automatiques (vérifié le 02/11/2026 : affichées sur les cartes) ; image mise en avant : NON PRIS EN CHARGE |
| 26 | Raccourci clavier Ctrl+Maj+E | ABSENT | lot 3 (si sans conflit avec l'administration) | — | — | ABSENT (aucun gestionnaire `shiftKey` dans `public/js/theme-builder.js`, vérifié le 02/11/2026) ; la ligne indiquait « FAIT » à tort |
| 27 | Accès depuis l'éditeur (logo › Theme Builder) | NON PRIS EN CHARGE (modifierait l'éditeur — interdit) | lien depuis l'administration uniquement | — | — | NON PRIS EN CHARGE |
| 28 | Conditions personnalisées (API) | ABSENT | lot 1 : registre de conditions extensible côté serveur | `conditions.js` | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 29 | Sticky / transparent header | à vérifier dans le Page Builder (propriétés de position) | documenté, pas de développement dans l'éditeur | — | — | PRÉVU |
| 31 | Modèle personnalisé (Elementor Pro « Custom ») | PARTIEL (créable, sans effet public) | 02/11/2026 | `render.js` (`resolveExtras`), `pages/index.js` (`themeExtraSections`) | theme-builder-barre-laterale-personnalise.test.js (tests 1, 2, 4) | FAIT : tous les modèles publiés dont les conditions correspondent s'affichent sous le contenu, du plus précis au moins précis ; exclusions, brouillons, archivage et isolation entre sites testés |
| 30 | Duplication, archivage, restauration, versions | ABSENT | lot 2 | `store.js` | theme-builder-stockage.test.js | SERVICE FAIT (13 tests, lot 2) ; écran : lot 3 |


## Écart de navigation (lot 3)
L'entrée « Constructeur de thème » n'est PAS dans le registre du menu Apparence : cinq suites figent ce registre (le site principal doit exposer chaque entrée à son adresse historique) et le Theme Builder 23.1 est propre aux sites créés dans le gestionnaire. Accès actuel : raccourci du tableau de bord du site (`/site-web/sites/:id/tableau-de-bord`) et adresse directe `/site-web/sites/:id/constructeur-de-theme`. Décision produit à prendre pour une entrée de menu (tests du registre à étendre).

## Périmètre réellement branché au rendu public (mis à jour le 02/11/2026)
Vérifié par `theme-builder-couverture-rendu.test.js`, `theme-builder-rendu.test.js` et `theme-builder-barre-laterale-personnalise.test.js` (serveur réel, domaines réels).
| Type | Rendu public par le Theme Builder | Remarque |
|---|---|---|
| Header, Footer | OUI — pages du Page Builder ET pages du site (blog, article, recherche, 404, boutique du domaine) ; **pas** le canevas de l'éditeur | priorité/exclusion testées de bout en bout |
| Article, Archives, Recherche, 404 | OUI — sites à domaine propre (`req.kwSite`), le plus précis gagne | l'ancien système reste le repli quand aucun modèle ne s'applique |
| Page individuelle | PARTIEL — `static_page` (« À propos ») et pages du Page Builder ; pas de « contenu de la page » commun à toutes les pages | voir limite L4 |
| Produit individuel, Archives produits | OUI — via `themeRender.renderRegion` quand la boutique du site passe son `siteId` | repli sur l'ancien système si aucun modèle |
| Barre latérale, Modèle personnalisé | OUI (nouveau, 02/11/2026) — sous le contenu, avant le pied de page | une seule barre latérale (la plus précise) ; tous les modèles personnalisés qui correspondent |
| Panier, paiement, compte | NON (pas d'écran de modèle dans le moteur de rendu de la boutique) | jamais de faux paiement |
| Site principal | ANCIEN SYSTÈME inchangé (pas de ligne de site) | décision produit : créer sa ligne dédiée (migration R9-3) |
