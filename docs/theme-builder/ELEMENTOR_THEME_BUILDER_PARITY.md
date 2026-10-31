# Registre de parité Elementor ↔ Kolakisa

Statuts : ABSENT · PARTIEL (existant, insuffisant) · PRÉVU (lot) · FAIT (testé) · NON PRIS EN CHARGE (raison). **Mis à jour à chaque lot ; aucune ligne n'est FAIT sans test exécuté.**

| # | Référence Elementor | État initial Kolakisa | Implémentation prévue | Fichiers | Tests | Statut |
|---|---|---|---|---|---|---|
| 1 | Tableau de bord « toutes les parties » avec miniatures | absent | lot 3 | `views/marketing/theme-builder*.ejs` | — | PRÉVU |
| 2 | Barre latérale par type + point vert/gris | absent | lot 3 | idem | — | PRÉVU |
| 3 | Header | PARTIEL (1 par site, sans conditions) | lot 2 (modèle + conditions), lot 5 (rendu) | `src/themeBuilder/*` | — | PRÉVU |
| 4 | Footer | PARTIEL | idem | idem | — | PRÉVU |
| 5 | Single page | ABSENT (seulement « À propos ») | lot 5 | `render` | — | PRÉVU |
| 6 | Single post | PARTIEL (11 familles par organisation) | lot 2 import + lot 5 | `legacy.js` | — | PRÉVU |
| 7 | Archives (catégorie/étiquette/auteur/blog) | PARTIEL | idem | idem | — | PRÉVU |
| 8 | Archives par date | ABSENT (pas d'adresses de date) | NON PRIS EN CHARGE tant que le blog n'a pas d'archives de dates | — | — | NON PRIS EN CHARGE |
| 9 | Résultats de recherche | PARTIEL (blog seulement) | lot 5 | — | — | PRÉVU |
| 10 | 404 | FAIT (existant) | importé | — | existant | PARTIEL |
| 11 | Sidebar | ABSENT | lot 6 (type + zone si le moteur de rendu le permet) | — | — | PRÉVU |
| 12 | Single Product / Product Archive | PARTIEL (20.5) | lot 5 | — | — | PRÉVU |
| 13 | Panier / paiement / compte (Woo Pro) | ABSENT | lot 6 selon moteur boutique ; jamais de faux paiement | — | — | PRÉVU |
| 14 | Conditions Inclure/Exclure | PARTIEL (exclusions limitées) | lot 1 | `conditions.js`, `match.js` | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 15 | Entire Site, Front Page, All Singular, Posts, Pages, Direct child / Any child, By Author, 404 | PARTIEL | lot 1 | idem | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 16 | Archives : Author, Date, Search, Posts Archive, Categories (+ enfants), Tags | PARTIEL | lot 1 (Date : critère accepté, sans effet tant que pas d'archive de date) | idem | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 17 | WooCommerce : Shop, Product Category/Tags, Products, In Category/Tag, by Author | PARTIEL | lot 1 | idem | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 18 | Landing Pages, Floating buttons, Media (cibles Singular) | NON PRIS EN CHARGE (pas de ces types de contenu) | — | — | — | NON PRIS EN CHARGE |
| 19 | Avertissement de conflit | PARTIEL | lot 1 + 3 | `resolve.js` | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 20 | Instances (où le modèle est utilisé) | ABSENT | lot 2/3 | `store.js` | theme-builder-stockage.test.js | SERVICE FAIT (13 tests, lot 2) ; écran : lot 3 |
| 21 | Edit / Edit Conditions | PARTIEL | lot 3 | — | — | PRÉVU |
| 22 | Rename / Trash / Export | PARTIEL | lot 2 | `store.js`, `portable.js` | theme-builder-stockage.test.js | SERVICE FAIT (13 tests, lot 2) ; écran : lot 3 |
| 23 | Import `.json` | ABSENT | lot 2 | `portable.js` | theme-builder-stockage.test.js | SERVICE FAIT (13 tests, lot 2) ; écran : lot 3 |
| 24 | Import `.zip` | NON PRIS EN CHARGE (JSON seulement, pas d'exécutable) | — | — | — | NON PRIS EN CHARGE |
| 25 | Miniatures auto / image mise en avant | ABSENT | lot 4 | `thumb.js` | — | PRÉVU |
| 26 | Raccourci clavier Ctrl+Maj+E | ABSENT | lot 3 (si sans conflit avec l'administration) | — | — | PRÉVU |
| 27 | Accès depuis l'éditeur (logo › Theme Builder) | NON PRIS EN CHARGE (modifierait l'éditeur — interdit) | lien depuis l'administration uniquement | — | — | NON PRIS EN CHARGE |
| 28 | Conditions personnalisées (API) | ABSENT | lot 1 : registre de conditions extensible côté serveur | `conditions.js` | theme-builder-noyau.test.js | NOYAU FAIT (14 tests purs, lot 1) ; branchement au rendu : lot 5 |
| 29 | Sticky / transparent header | à vérifier dans le Page Builder (propriétés de position) | documenté, pas de développement dans l'éditeur | — | — | PRÉVU |
| 30 | Duplication, archivage, restauration, versions | ABSENT | lot 2 | `store.js` | theme-builder-stockage.test.js | SERVICE FAIT (13 tests, lot 2) ; écran : lot 3 |
