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
| Schéma | Type de page choisi par l'éditeur | **Implémenté (lot 2), testé** pour les pages du CMS : liste fermée de sous-types de `WebPage` (À propos, Contact, Collection, Profil, Fiche, Commande, Résultats) | `marketing/pages/index.js`, `webPages.js`, `tests/seo-outils-avances.test.js` | — | — | — |
| Schéma | Types à données propres (Event, VideoObject, Recipe, JobPosting, Review…) | **Volontairement absent** : ces types exigent des champs réels (dates, durée, ingrédients…) qu'aucun formulaire de page ne collecte ; les publier vides serait du balisage trompeur | — | Un formulaire par type, quand un besoin réel existe | P4 | JSON-LD valide, contenu visible correspondant |
| Schéma | Product / Offer | **Partiel** : les formations sont publiées en `Course` ; pas de `Product`/`Offer` | `schema.js` | Offer sur Course (prix, devise, disponibilité) si prix public | P3 | Offre = prix affiché |
| SEO local | Coordonnées, adresse, type LocalBusiness | **Implémenté (lots 1 et 2), testé** : téléphone, e-mail, adresse postale, `LocalBusiness`, horaires d'ouverture, coordonnées GPS (LocalBusiness uniquement), jusqu'à 10 établissements supplémentaires | `settings.js`, `local.js`, `schema.js`, `tests/seo-local.test.js`, `tests/seo-outils-avances.test.js` | Avis, zone de service, menus : non faits | P4 | — |
| Analyse on-page | Analyse du contenu, mot-clé principal, lisibilité | **Implémenté** (éditeur : mot-clé, structure, lisibilité en conseils non bloquants) | `guard.js`, `text.js`, `seo-editor.test.js` | Score par mot-clé secondaire, variantes | P1 | Tests unitaires |
| Analyse on-page | Mots-clés secondaires | **Partiel** (champ stocké, pas analysé) | `meta.js:26` | Analyser densité / présence | P1 | Test par règle |
| Aperçu | Aperçu du résultat Google / réseaux | **Partiel** : à vérifier dans l'éditeur (`cms-seo-site.js`) | `public/js/cms-seo-site.js` | Audit visuel navigateur | P1 | Capture |
| Audit de site | 41 règles, exploration réelle, historique, comparaison, corrections automatiques | **Implémenté, testé** | `rules.js`, `audit.js`, `jobs.js`, `seo-audit.test.js`, `seo-jobs.test.js` | — | — | — |
| Sitemap | XML, index, lastmod, exclusions, images | **Implémenté, testé** | `sitemap.js`, `seo-technical.test.js` | Sitemaps vidéo / actualités : non pertinents sans contenu vidéo public | P3 | — |
| Robots | robots.txt par site, règles personnalisées, aperçu | **Implémenté, testé** | `robots.js` | — | — | — |
| Redirections | 301, 302, CSV import/export, boucles, chaînes, compteur | **Implémenté, testé** | `redirects.js`, `seo-technical.test.js` | — | — | — |
| Redirections | 307, 308, 410 | **Implémenté dans cette mission, testé** | `redirects.js`, `tests/seo-redirections-statuts.test.js` | — | — | — |
| Redirections | Règles par préfixe / expression régulière | **Implémenté (lot 2), testé** : adresse exacte > règle du site > règle commune ; expression ancrée, bornée, sans référence arrière ni quantificateurs imbriqués | `redirects.js`, `tests/seo-redirections-regles.test.js` | — | — | — |
| 404 | Journal, suggestions, redirection depuis le journal | **Implémenté, testé** | `notfound.js`, `siteTools.js` | — | — | — |
| Liens internes | Pages orphelines, liens cassés, liens vers redirections | **Implémenté** (audit) | `audit.js` | — | — | — |
| Liens internes | Suggestions de liens entre pages d'un site | **Implémenté (lot 2), testé** : écran « Liens internes » de chaque site ; calcul local, aucune insertion automatique ; suggestions **dans l'éditeur** : non faites | `linkSuggestions.js`, `tests/seo-outils-avances.test.js` | Intégration à l'éditeur | P3 | — |
| Images | Alt manquant, image lourde, introuvable | **Implémenté** (audit) | `images.js`, `rules.js` | Édition en masse des textes alternatifs : **absente** | P1 | Test d'isolation par site |
| Analytics | Search Console, GA4, PageSpeed (équipe centrale) | **Bloqué par dépendance externe** : « Non connecté » sans clé ; testé contre faux serveur Google | `integrations.js`, `seo-integrations.test.js` | Connexion réelle à vérifier avec un vrai compte | P4 | Connexion réelle vérifiée |
| Analytics | Search Console et GA4 **par site** | **Implémenté (lot 2), testé contre un faux serveur Google** : propriété et clé de compte de service propres à chaque site, chiffrées sous un nom propre au site ; **jamais éprouvé avec un vrai compte Google** | `integrations.js` (`scoped`), `siteSeo.js`, `tests/seo-outils-avances.test.js` | Vérification réelle | P4 | — |
| Suivi de positions | Suivi de positionnement | **Implémenté (lot 2), testé** sans scraping : saisie manuelle, import de l'export « Requêtes » de Search Console, relevé via l'API Search Console du site si connectée ; historique et écart. **Pas de relevé automatique des rangs exacts** (exigerait un fournisseur payant et autorisé) | `rankings.js`, `tests/seo-outils-avances.test.js` | Fournisseur de rangs (non choisi) | P5 | — |
| IA | Content AI | **Absent** | — | Interface fournisseur IA interchangeable, validation humaine | P5 | — |
| Administration | Rôles, permissions par site | **Implémenté, testé** (`seo.view`, `seo.edit`, `redirects.*`) | `siteSeo.js`, `seo-par-site-espace.test.js` | — | — | — |
| Administration | Export / import des réglages SEO | **Implémenté (lot 2), testé** : JSON par site (réglages + redirections, sans secret), aperçu avant import, import toujours appliqué au site de l'appelant | `transfer.js`, `tests/seo-outils-avances.test.js` | Export des métadonnées par page : non fait | P4 | — |
| Migration | Import Rank Math / Yoast | **Implémenté (lot 2), testé sur des données fabriquées** : tableau « adresse + clés de métadonnées » (titre, description, mot-clé principal, canonique), écrit dans les **brouillons** de pages ; **non éprouvé sur un vrai export de ces extensions** ; redirections de ces extensions : à passer par l'import CSV existant | `transfer.js` | Essai sur un export réel | P4 | — |
| Multi-sites | Isolation des réglages, redirections, audit, 404 | **Implémenté, testé** | `seo-par-site-*.test.js`, `siteScope` | — | — | — |
| Fil d'Ariane | BreadcrumbList | **Implémenté** | `schema.js:61` | — | — | — |
| WooCommerce | Spécifique WordPress | **Non pertinent** (boutique propre à Kolakisa) | — | — | — | — |

## Point d'attention : FAQ et HowTo
Le document `rank-math-reference/07-schema.md` rapporte, d'après le journal Google Search Central, que les résultats enrichis FAQ et HowTo ont été retirés ou dépréciés en 2026. Kolakisa génère toujours ces types (`schema.js`) : ils restent du balisage valide mais **ne doivent pas être présentés comme garantissant un résultat enrichi**. Décision produit à prendre (conserver ou retirer).

## Limites de cette analyse
- Les lignes « Partiel / À vérifier » (aperçu Google, mots-clés secondaires) n'ont pas été éprouvées dans un navigateur dans cette mission.
- La comparaison avec Rank Math reprend la structure de ses modules ; le détail de chaque fonction est dans `rank-math-reference/`.
