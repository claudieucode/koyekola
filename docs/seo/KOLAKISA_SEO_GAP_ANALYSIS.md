# Kolakisa SEO — analyse des écarts avec Rank Math (29/10/2026)

Méthode : lecture du code de `src/seo/` (24 fichiers), des routes (`src/marketing/web/siteSeo.js`, `src/seo/web.js`), des vues et des tests (`tests/seo-*.test.js`, `cms-seo*.test.js`). Rank Math : voir `rank-math-reference/` (état des sources dans chaque document). « Testé » = un test automatisé existant couvre la fonction ; sinon « vérifié par lecture du code » est indiqué.

Le module n'est pas à reconstruire : un moteur unique (`resolver.js`) produit le `<head>`, par site, avec audit, redirections, 404, sitemap, robots, schéma, intégrations et historique. Les écarts réels sont listés ci-dessous.

| Domaine | Fonctionnalité Rank Math | État dans Kolakisa | Fichiers / preuve | Travail | Priorité | Critère de validation |
|---|---|---|---|---|---|---|
| Métadonnées | Titre, description, modèles, variables, séparateur | **Implémenté, testé** (réglages centraux + par site + par contenu) | `settings.js`, `templates.js`, `meta.js`, `seo-core.test.js`, `seo-par-site-unitaire.test.js` | — | — | — |
| Métadonnées | Canonical, robots meta, noindex des recherches/pages privées | **Implémenté, testé** | `resolver.js`, `seo-technical.test.js` | — | — | — |
| Rendu public | Un seul calcul du `<head>`, pas de doublon | **Implémenté, testé** | `resolver.js`, `SEO_CORE.md` | — | — | — |
| Réseaux sociaux | Open Graph, cartes Twitter, image par défaut | **Implémenté, testé** | `resolver.js`, `open-graph.ejs` | — | — | — |
| Schéma | Organization, WebSite, WebPage, BreadcrumbList, Course, Article/BlogPosting, FAQPage, HowTo, ImageObject, Person | **Implémenté** (validation des champs obligatoires) | `schema.js`, `seo-technical.test.js` | — | — | — |
| Schéma | Types choisis librement par page (Event, VideoObject, Recipe, JobPosting, Review…) | **Absent** (types générés selon le contenu, pas un choix éditeur) | `schema.js`, `pages.js` | Sélecteur de type + champs par type, validation | P3 | JSON-LD valide, contenu visible correspondant |
| Schéma | Product / Offer | **Partiel** : les formations sont publiées en `Course` ; pas de `Product`/`Offer` | `schema.js` | Offer sur Course (prix, devise, disponibilité) si prix public | P3 | Offre = prix affiché |
| SEO local | Coordonnées, adresse, type LocalBusiness | **Implémenté dans cette mission** (téléphone, e-mail, adresse postale, `LocalBusiness`) ; **absents** : horaires, géolocalisation, plusieurs établissements | `settings.js`, `schema.js`, `tests/seo-local.test.js` | Horaires, geo, multi-établissements | P3 | JSON-LD LocalBusiness complet |
| Analyse on-page | Analyse du contenu, mot-clé principal, lisibilité | **Implémenté** (éditeur : mot-clé, structure, lisibilité en conseils non bloquants) | `guard.js`, `text.js`, `seo-editor.test.js` | Score par mot-clé secondaire, variantes | P1 | Tests unitaires |
| Analyse on-page | Mots-clés secondaires | **Partiel** (champ stocké, pas analysé) | `meta.js:26` | Analyser densité / présence | P1 | Test par règle |
| Aperçu | Aperçu du résultat Google / réseaux | **Partiel** : à vérifier dans l'éditeur (`cms-seo-site.js`) | `public/js/cms-seo-site.js` | Audit visuel navigateur | P1 | Capture |
| Audit de site | 41 règles, exploration réelle, historique, comparaison, corrections automatiques | **Implémenté, testé** | `rules.js`, `audit.js`, `jobs.js`, `seo-audit.test.js`, `seo-jobs.test.js` | — | — | — |
| Sitemap | XML, index, lastmod, exclusions, images | **Implémenté, testé** | `sitemap.js`, `seo-technical.test.js` | Sitemaps vidéo / actualités : non pertinents sans contenu vidéo public | P3 | — |
| Robots | robots.txt par site, règles personnalisées, aperçu | **Implémenté, testé** | `robots.js` | — | — | — |
| Redirections | 301, 302, CSV import/export, boucles, chaînes, compteur | **Implémenté, testé** | `redirects.js`, `seo-technical.test.js` | — | — | — |
| Redirections | 307, 308, 410 | **Implémenté dans cette mission, testé** | `redirects.js`, `tests/seo-redirections-statuts.test.js` | — | — | — |
| Redirections | Règles par préfixe / expression régulière | **Absent** | `redirects.js` | Correspondance par préfixe, puis regex bornée (risque ReDoS) | P2 | Boucles détectées, temps borné |
| 404 | Journal, suggestions, redirection depuis le journal | **Implémenté, testé** | `notfound.js`, `siteTools.js` | — | — | — |
| Liens internes | Pages orphelines, liens cassés, liens vers redirections | **Implémenté** (audit) | `audit.js` | Suggestions de liens dans l'éditeur : **absent** | P2 | Suggestions pertinentes, aucune insertion automatique |
| Images | Alt manquant, image lourde, introuvable | **Implémenté** (audit) | `images.js`, `rules.js` | Édition en masse des textes alternatifs : **absente** | P1 | Test d'isolation par site |
| Analytics | Search Console, GA4, PageSpeed | **Bloqué par dépendance externe** : « Non connecté » sans clé ; testé contre faux serveur Google | `integrations.js`, `seo-integrations.test.js` | Autorisations par site à décider | P4 | Connexion réelle vérifiée |
| Suivi de positions | Rank tracker | **Absent** : exige un fournisseur autorisé | — | Aucun scraping | P4 | — |
| IA | Content AI | **Absent** | — | Interface fournisseur IA interchangeable, validation humaine | P5 | — |
| Administration | Rôles, permissions par site | **Implémenté, testé** (`seo.view`, `seo.edit`, `redirects.*`) | `siteSeo.js`, `seo-par-site-espace.test.js` | — | — | — |
| Administration | Export / import des réglages SEO | **Absent** (redirections CSV seulement) | — | Export JSON par site, import validé | P3 | Aller-retour identique, isolation |
| Migration | Import Rank Math / Yoast | **Absent** | — | Lire les métadonnées d'un export WordPress existant (`importers/wordpress.js`) | P3 | — |
| Multi-sites | Isolation des réglages, redirections, audit, 404 | **Implémenté, testé** | `seo-par-site-*.test.js`, `siteScope` | — | — | — |
| Fil d'Ariane | BreadcrumbList | **Implémenté** | `schema.js:61` | — | — | — |
| WooCommerce | Spécifique WordPress | **Non pertinent** (boutique propre à Kolakisa) | — | — | — | — |

## Point d'attention : FAQ et HowTo
Le document `rank-math-reference/07-schema.md` rapporte, d'après le journal Google Search Central, que les résultats enrichis FAQ et HowTo ont été retirés ou dépréciés en 2026. Kolakisa génère toujours ces types (`schema.js`) : ils restent du balisage valide mais **ne doivent pas être présentés comme garantissant un résultat enrichi**. Décision produit à prendre (conserver ou retirer).

## Limites de cette analyse
- Les lignes « Partiel / À vérifier » (aperçu Google, mots-clés secondaires) n'ont pas été éprouvées dans un navigateur dans cette mission.
- La comparaison avec Rank Math reprend la structure de ses modules ; le détail de chaque fonction est dans `rank-math-reference/`.
