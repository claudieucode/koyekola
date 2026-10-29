# Rank Math SEO — Vue d'ensemble et index central

Statut : documentation de référence rédigée le 2026-10-29 à partir des sources officielles uniquement (base de connaissances Rank Math, documentation Google Search Central, sitemaps.org). Objectif côté Kolakisa : cartographier Rank Math pour identifier les écarts SEO de notre CMS Node/Express (SQLite).

Convention de qualification des sources utilisée dans tous les documents :
- **officiel** : l'information est écrite telle quelle dans la page citée (Rank Math ou moteur de recherche).
- **observation** : déduction directe de ce que la page décrit (comportement visible dans l'interface décrite), sans énoncé explicite.
- **hypothèse** : inférence de l'auteur, à vérifier ; jamais présentée comme un fait.

Convention de niveau : **Gratuit** / **PRO** / **Service externe** (serveurs Rank Math ou Google nécessaires) — indiqué uniquement quand la source le dit. Sinon : « non précisé ».

## 1. Index des documents (00 à 19)

| N° | Fichier | Sujet | État |
|---|---|---|---|
| 00 | `00-overview.md` | Rank Math SEO — Vue d'ensemble et index central | Rédigé (voir « Lacunes » du document) |
| 01 | `01-setup-and-configuration.md` | 01 — Configuration initiale, modules, importation, permissions, réglages | Rédigé (voir « Lacunes » du document) |
| 02 | `02-titles-meta-robots.md` | 02 — Titres, méta-descriptions, variables, modèles, canonical, robots | Rédigé (voir « Lacunes » du document) |
| 03 | `03-on-page-analysis.md` | 03 — Analyse on-page (méta-boîte) et analyseur de site | Rédigé (voir « Lacunes » du document) |
| 04 | `04-keywords-content.md` | 04 — Mots-clés et analyse de contenu | Rédigé (voir « Lacunes » du document) |
| 05 | `05-sitemaps.md` | 05 — Sitemaps (XML, index, images, vidéos, actualités, HTML, KML) | Rédigé (voir « Lacunes » du document) |
| 06 | `06-technical-seo.md` | 06 - SEO technique selon Rank Math (robots.txt, indexation, canonical, pagination, duplication) | Rédigé (voir « Lacunes » du document) |
| 07 | `07-schema.md` | 07 - Données structurées (Schema / JSON-LD) selon Rank Math et Google | Rédigé (voir « Lacunes » du document) |
| 08 | `08-local-seo.md` | 08 - SEO local (module Local SEO de Rank Math) | Rédigé (voir « Lacunes » du document) |
| 09 | `09-ecommerce.md` | 09 - SEO e-commerce (WooCommerce, EDD, autres) selon Rank Math et Google | Rédigé (voir « Lacunes » du document) |
| 10 | `10-image-seo.md` | 10 - SEO des images (module Image SEO de Rank Math et règles Google) | Rédigé (voir « Lacunes » du document) |
| 11 | `11-social-metadata.md` | 11 - Métadonnées sociales (Open Graph, cartes X/Twitter) selon Rank Math | Rédigé (voir « Lacunes » du document) |
| 12 | `12-redirects-404.md` | 12 - Redirections et moniteur 404 (Rank Math) | Rédigé (voir « Lacunes » du document) |
| 13 | `13-analytics-rank-tracking.md` | 13 - Analytics, Search Console et suivi de positions (Rank Math) | Rédigé (voir « Lacunes » du document) |
| 14 | `14-site-audit.md` | 14 - Audit de site (Rank Math) | Rédigé (voir « Lacunes » du document) |
| 15 | `15-content-ai.md` | 15 - Content AI / Rank Math AI et outils MCP | Rédigé (voir « Lacunes » du document) |
| 16 | `16-internal-linking.md` | 16 - Liens internes (Rank Math) | Rédigé (voir « Lacunes » du document) |
| 17 | `17-admin-permissions-import-export.md` | 17 - Administration, permissions, import/export, sauvegardes, multisite | Rédigé (voir « Lacunes » du document) |
| 18 | `18-additional-modules.md` | 18 - Modules additionnels | Rédigé (voir « Lacunes » du document) |
| 19 | `19-feature-matrix.md` | 19 - Matrice des fonctionnalités Rank Math | Rédigé (voir « Lacunes » du document) |

Les documents 06 à 19 sont des emplacements réservés : leur contenu n'a pas été rédigé dans cette livraison (voir « Lacunes »). Les informations déjà recueillies à leur sujet apparaissent de façon partielle dans les documents 01 à 05.

## 2. Finalité de Rank Math

Rank Math est une extension WordPress de SEO « tout-en-un » (officiel : pages KB et comparatif Free vs PRO). Elle regroupe en modules : réglages de titres/méta, analyse de contenu en temps réel dans l'éditeur, sitemaps, données structurées, redirections et moniteur 404, SEO d'images, SEO local, intégration Google (Search Console, Analytics), suivi de mots-clés, outils IA (Content AI) et liens internes. Elle intègre aussi un analyseur de site externe et des importateurs depuis d'autres extensions SEO.

## 3. Modules et fonctions (cartographie)

Les modules s'activent depuis Rank Math SEO → Tableau de bord → Modules (officiel : KB Role Manager, Advanced Mode). Certains n'apparaissent qu'en « Mode avancé » (officiel : `kb/advanced-mode/`) : 404 Monitor, ACF, bbPress, BuddyPress, Image SEO, Redirections, Role Manager.

Modules ou blocs cités dans les pages consultées : Sitemap, Schema, Analytics (inclut le suivi de mots-clés), Content AI, 404 Monitor, Redirections, Image SEO, Local SEO & Knowledge Graph, Role Manager, ACF, bbPress, BuddyPress, Podcast, LLMS Txt, WooCommerce, Link Genius, Instant Indexing (officiel : pages General Settings, Advanced Mode, Sitemaps). La liste complète et à jour des modules n'a pas pu être lue (la page `kb/modules/` renvoie 404) : voir Lacunes.

## 4. Parcours type (officiel : `kb/how-to-setup/`)

1. Connexion d'un compte Rank Math (facultatif en apparence : bouton « Passer »).
2. Assistant : choix du mode (Facile / Avancé / Personnalisé PRO), test de compatibilité, importation depuis une autre extension SEO.
3. Identité du site (personne ou organisation, nom, logo, image de partage par défaut).
4. Connexion Google (Search Console, Analytics, AdSense).
5. Sitemaps, optimisation (noindex des archives vides, nofollow des liens externes, ouverture en nouvel onglet).
6. Réglages avancés : rôles, 404/redirections, schéma par défaut.
7. Usage quotidien : méta-boîte dans l'éditeur (onglets Général, Avancé, Schéma, Social), Tableau de bord, analyseur SEO.

## 5. Gratuit / PRO / service externe — ce que disent les sources

- La page « Free vs PRO » liste les mêmes noms de fonctionnalités sous Free, PRO, Business, Agency sans cocher l'inclusion ; elle ne permet donc pas à elle seule de distinguer gratuit et PRO. Elle donne seulement des limites par plan (officiel, consulté 2026-10-29).
- Limites par plan : mots-clés suivis 1 000 (PRO) / 20 000 (Business) / 75 000 (Agency), Free non indiqué ; rafraîchissement Analytics 3 jours (Free) vs quotidien ; conservation des données Google 90 jours (Free), 180 jours (PRO), illimitée (Business/Agency) ; rapports e-mail 30 jours (Free), 15 ou 30 (PRO), 7/15/30 (Business/Agency) ; essai IA gratuit nommé Starter (PRO), Creator (Business), Expert (Agency).
- Contradictions internes à la page Free vs PRO (officiel, signalées telles quelles) : la FAQ cite 500 mots-clés (PRO) et 10 000 (Business) contre 1 000 et 20 000 dans les tableaux ; la FAQ parle d'un rafraîchissement Analytics tous les trois jours pour les payants contre « quotidien » dans le tableau ; la FAQ parle de 200 sites « clients et personnels » pour Business.
- Le niveau précis (gratuit/PRO) de chaque fonction est donc relevé dans les articles de détail, qui portent des mentions « PRO » (voir documents 01 à 05).
- Services externes explicites : Rank Math Content AI (requêtes envoyées aux serveurs d'IA de Rank Math, abonnement/limites mensuelles), SEO Analyzer (les serveurs de Rank Math récupèrent les pages ; site public obligatoire), suggestions Google dans le champ mot-clé (compte Rank Math connecté requis), Search Console / Analytics / AdSense (compte Google), Google Trends (PRO), vérificateur robots.txt externe pour la version gratuite.

## 6. Dépendance à WordPress et pertinence pour un CMS non-WordPress

Presque toute l'interface de Rank Math s'appuie sur des concepts WordPress : types de contenu, taxonomies, méta-boîtes, rôles/capacités, hooks (`rank_math/...`), shortcodes, blocs Gutenberg, réécriture d'URL, `wp-config.php`, fichier `.htaccess`, robots.txt virtuel. Ce qui est **transposable** à Kolakisa (logique, pas le code) :
- Modèles de titres/descriptions avec variables, surcharge par contenu, héritage global → type → contenu.
- Robots meta global/par contenu, directives avancées, canonical par défaut auto-référent.
- Sitemaps XML (index + sous-sitemaps par type), images, vidéos, actualités, exclusions, HTML sitemap.
- Analyse de contenu côté éditeur (tests règles simples), analyse de site.
- Redirection automatique au changement de slug, moniteur 404.

Ce qui est **spécifique WordPress / non transposable tel quel** : hooks PHP, Role Manager basé sur les capacités WP, meta box, détection des plugins de sommaire (TOC), intégrations ACF/bbPress/BuddyPress/WooCommerce, importateurs depuis d'autres plugins WP, correctifs `rank-math.php`. Pertinence par fonction : voir chaque document.
- **Hypothèse** : Kolakisa peut reproduire les règles documentées (seuils, structure XML) mais pas les listes internes non publiées (mots « puissants », mots de sentiment, calcul exact du score).

## 7. Limites générales de Rank Math (telles que documentées)

- Les scores sont des guides, pas des garanties de classement (officiel : `score-100-in-tests`).
- Plusieurs options n'apparaissent qu'en mode avancé ou si un module associé est actif (officiel).
- Les chiffres varient entre articles de la KB (nombre de tests : 21, 24, 32, 36 selon la page ; voir doc 03).
- Cache : les sitemaps mis en cache peuvent masquer les changements (officiel).
- Un robots.txt physique, un fichier `sitemap_index.xml` physique ou un `.htaccess` invalide peuvent contredire le comportement attendu (officiel).

## 8. Sources

| URL | Consultée | Nature |
|---|---|---|
| https://rankmath.com/kb/ | 2026-10-29 | officiel (index des catégories) |
| https://rankmath.com/free-vs-pro/ | 2026-10-29 | officiel (limites par plan ; incohérences internes) |
| https://rankmath.com/pricing/ | 2026-10-29 | officiel (lu sur les 100 000 premiers caractères sur 130 138 ; crédits Content AI non listés dans la partie lue) |
| https://rankmath.com/kb/how-to-setup/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/advanced-mode/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/general-settings/ | 2026-10-29 | officiel (lu partiellement : 100 000 sur 105 082 caractères) |
| https://rankmath.com/kb/role-manager/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/score-100-in-tests/ | 2026-10-29 | officiel |

## 9. Lacunes

- `https://rankmath.com/kb/wordpress/rankmath-seo/` et `https://rankmath.com/kb/modules/` : HTTP 404 ; liste officielle des modules non lue.
- Page Pricing : 30 138 derniers caractères non lus (crédits Content AI par plan non confirmés).
- Page Free vs PRO : ne distingue pas gratuit/PRO par fonction ; recouper avec les articles de détail.
- Documents 06 à 19 non rédigés dans cette livraison.
- Aucun accès au code source ni à une instance de Rank Math : aucune « observation » d'exécution réelle n'a été faite.
