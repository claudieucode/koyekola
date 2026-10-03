# KOLAKISA SEO CORE

Suite SEO propriétaire de KOLAKISA : métadonnées, données structurées, robots.txt, plan du site, redirections,
journal des 404, audit du site, contrôle avant publication, intégrations Google, tâches programmées, surveillance,
rapports. Tout est dans `src/seo/` et s'administre dans **Mon espace → SEO** (`/formateur/seo`).

Règle de conception : **aucune donnée inventée**. Une donnée absente s'affiche « Non disponible », un service non
branché « Non connecté », un prérequis manquant « Configuration requise ». Aucune promesse de classement Google.

## 1. Architecture

```
Requête publique ─► notfound.middleware (journal 404) ─► redirects.middleware (301/302) ─► routes du site
                                                                                     │
                     pages.js (constructeurs par type de page) ─► resolver.js (moteur unique du <head>)
                                                                     ├─ settings.js (réglages centraux, modèles)
                                                                     ├─ meta.js (réglages propres à un contenu)
                                                                     ├─ templates.js (variables {title}, {site_name}…)
                                                                     ├─ images.js (existence + dimensions réelles)
                                                                     └─ schema.js (graphe JSON-LD relié par @id)
Administration (/formateur/seo, web.js) ─► audit.js · guard.js · integrations.js · jobs.js · monitor.js · reports.js
```

| Module | Rôle |
|---|---|
| `store.js` | Tables `seo_settings`, `seo_meta`, `seo_changes` ; `logChange()` journalise chaque champ réellement modifié |
| `settings.js` | Réglages centraux validés (nom du site, modèles de titre, organisation, profils sociaux, robots.txt, contrôle de publication) |
| `meta.js` | Réglages SEO par contenu : accueil, pages, formations, catégories de formations et d'articles, étiquettes, auteurs |
| `templates.js` | Modèles à variables ; variable inconnue signalée à l'enregistrement |
| `resolver.js` | Calcule `<title>`, description, robots, canonical, Open Graph, X/Twitter, JSON-LD pour toutes les pages publiques |
| `pages.js` | Constructeurs par type : accueil, catalogue, catégorie, formation, pages statiques, FAQ, listes du blog |
| `schema.js` | `@graph` : Organization, WebSite, WebPage (et variantes), BreadcrumbList, Course, BlogPosting, Person, ItemList, FAQPage, HowTo ; `validate()` |
| `images.js` | Lit réellement le fichier (PNG, GIF, WebP, JPEG) : existence, largeur, hauteur, poids |
| `inspect.js` | Charge une page du site par la boucle locale (repli sur `SITE_URL`) et en extrait les balises SEO |
| `entities.js` | Inventaire des contenus publics |
| `redirects.js` | Redirections gérées, chaînes et boucles, import / export CSV, absorption des historiques d'adresses |
| `notfound.js` | Journal des 404 (personnes / robots, sans adresse IP), 5 000 adresses au plus |
| `robots.js` | robots.txt (espaces privés + règles supplémentaires), règle de Google (la plus longue l'emporte), conflits |
| `sitemap.js` | Plan du site avec images ; adresses exclues avec la raison |
| `rules.js` | 41 règles documentées (catégorie, gravité, recommandation) |
| `audit.js` | Exploration réelle (400 pages max), évaluation, notes, corrections automatiques |
| `text.js` | Similarité de textes (bardeaux de 5 mots, indice de Jaccard) |
| `guard.js` | Contrôle avant publication d'un article (serveur) |
| `integrations.js` | PageSpeed Insights, Search Console, Google Analytics 4 |
| `jobs.js` | Tâches programmées et leur historique |
| `monitor.js` | Surveillance : comparaison de deux photographies du site → alertes |
| `reports.js` | Exports CSV / JSON |
| `web.js` | Pages d'administration |

## 2. Base de données (SQLite, `KOYEKOLA.db`)

Toutes les tables sont créées automatiquement au démarrage (`CREATE TABLE IF NOT EXISTS`) : **aucune table existante
n'est supprimée, renommée ni modifiée** par le SEO CORE. Les colonnes SEO qui existaient déjà (`courses.seo_title`,
`courses.seo_description`, colonnes SEO de `posts`) restent la source de vérité (`meta.js` écrit dans celles des formations, l'éditeur dans celles des articles).

| Table | Contenu |
|---|---|
| `seo_settings` | Réglages centraux (clé / valeur) |
| `seo_meta` | Réglages propres à un contenu (type, clé, champ, valeur) |
| `seo_changes` | Journal : élément, champ, avant, après, auteur, origine (`admin`, `autofix`, `import`…), date |
| `seo_redirects` | Source, destination, 301/302, active, utilisations, dernière utilisation |
| `seo_404` | Adresse, visites humaines / robots, première et dernière fois, page d'origine, navigateur, ignorée |
| `seo_audits` / `seo_issues` | Audits (type, origine, pages, notes) et problèmes (règle, gravité, adresse, détail, correction) |
| `seo_integrations` | Configuration par service ; la clé est **chiffrée** (AES-256-GCM, `ENCRYPTION_KEY`) |
| `seo_integration_cache` | Réponses de Google gardées 6 h |
| `seo_pagespeed` | Historique des mesures PageSpeed (ou de l'erreur) |
| `seo_jobs` / `seo_job_runs` | Tâches programmées (fréquence, heure, prochain passage, dernier état) et historique |
| `seo_monitor_snapshots` / `seo_alerts` | Photographies de surveillance (30 dernières) et alertes |
| `post_slug_history`, `course_slug_history` | Anciennes adresses → redirection 301 automatique |

## 3. Métadonnées publiques

Pour chaque page publique : `<title>` (modèle + séparateur), meta description, meta robots (`index/noindex`,
`follow/nofollow`), `<link rel="canonical">`, Open Graph (`og:title`, `og:description`, `og:url`, `og:type`,
`og:site_name`, `og:locale`, `og:image` **seulement si le fichier existe**, avec `og:image:width/height`), carte X
(`twitter:card`, titre, description, image), JSON-LD `@graph` relié par `@id` (`#organization`, `#website`,
`#webpage`, `#breadcrumb`). Étiquettes et auteurs du blog : `noindex, follow` par défaut (réglable). Pages de
liste paginées (`?page=2`…) : canonical vers elles-mêmes et titre « (page N) ». Pas de `hreflang` : le site n'existe
qu'en français (le moteur gère `og:locale` par article).

## 4. Règles et notes de l'audit

- Catégories : indexabilité, métadonnées, contenu, liens, images, données structurées, technique.
- Gravité et poids : critique 10, élevée 5, moyenne 3, faible 1, info 0.
- Note d'une catégorie = poids des contrôles réussis ÷ poids des contrôles effectués × 100. Aucune catégorie
  contrôlée → « Non disponible ». Note globale = même calcul sur toutes les catégories. C'est une note **interne**
  de conformité aux règles, pas une prédiction de classement.
- La liste complète des règles est consultable dans l'onglet **Règles** (`/formateur/seo/regles`).
- Liens externes vérifiés réellement (HEAD puis GET, 8 s, 150 au plus) ; « injoignable » n'est jamais compté comme cassé.
- Corrections automatiques réelles : remplacement des liens qui passent par une redirection dans l'article,
  raccourcissement des chaînes de redirections. Chaque correction est journalisée.

## 5. robots.txt, plan du site, redirections

- `/robots.txt` : `User-agent: *`, interdiction des espaces privés (connexion, administration, fichiers…), règles
  supplémentaires vérifiées, ligne `Sitemap:`.
- `/sitemap.xml` : contenus publiés et indexables, `lastmod`, images (`image:image`). Les exclusions sont listées avec
  leur raison dans **Robots et sitemap**.
- Redirections : exécutées avant toute page, paramètres d'adresse conservés ; espaces privés non redirigeables ; boucles
  refusées ; chaînes détectées (y compris via les changements d'adresse) et raccourcies en un clic.

## 6. Contrôle avant publication

À la publication d'un article, le serveur vérifie : titre, contenu, canonical, images présentes, adresse autorisée par
robots.txt (**critique**), liens internes, H1 dans le contenu, noindex, textes alternatifs, description
(**avertissements**), analyse éditoriale (**recommandations**). Réglage « Bloquer en cas d'erreur critique » : la
publication est refusée par le serveur (le brouillon reste possible). Par défaut : avertir seulement.

## 7. Intégrations Google

| Service | Ce qu'il faut | Données |
|---|---|---|
| PageSpeed Insights | Rien (clé d'API facultative, chiffrée) ; `SITE_URL` en https | Performance, LCP, CLS, TBT, FCP, SI, TTFB (labo) ; LCP, INP, CLS, FCP, TTFB réels (CrUX) si Google en a ; pistes d'amélioration |
| Search Console | Compte de service Google (clé JSON) ajouté comme utilisateur de la propriété ; `ENCRYPTION_KEY` | Clics, impressions, CTR, position ; pages en progression / recul ; requêtes à faible CTR ; « presque en 1re page » ; nouvelles requêtes |
| Google Analytics 4 | Même compte de service, rôle « Lecteur » sur la propriété ; identifiant numérique de propriété | Utilisateurs actifs, sessions, pages vues, événements clés, canaux, pages les plus vues |

Authentification : jeton OAuth 2.0 obtenu par une assertion JWT signée RS256 (module `crypto` de Node), gardé en mémoire
jusqu'à son expiration. La clé n'est jamais renvoyée au navigateur ni écrite dans le journal. « Connecté » n'est
affiché qu'après une vérification réelle réussie auprès de Google.

## 8. Tâches programmées et surveillance

| Tâche | Par défaut (UTC) | Action |
|---|---|---|
| Audit complet du site | lundi 03 h | Audit réel ; résultat dans **Audit** |
| Surveillance du site | chaque jour 06 h | Photographie (pages principales, noindex, canonical, titres, robots.txt, plan du site, 404) comparée à la précédente → alertes dans la **Vue d'ensemble** |
| Vitesse de la page d'accueil | lundi 04 h | PageSpeed mobile (ignorée sans `SITE_URL` en https) |
| Actualisation Search Console / Analytics | chaque jour 05 h | Ignorée tant que le service n'est pas connecté |
| Nettoyage des journaux | lundi 02 h | 404 non revues depuis 180 jours (hors ignorées), mesures et historique de plus d'un an |

Chaque tâche affiche : état (Réussie / Échec / Ignorée / En cours / Jamais exécutée), dernier passage, résultat ou
erreur, prochain passage, 5 derniers passages ; bouton « Exécuter maintenant ». Le minuteur passe toutes les minutes ;
une tâche est réservée par une mise à jour atomique (une seule exécution même avec plusieurs serveurs ; verrou périmé
après 2 h).

## 9. Rapports

Onglet **Rapports** : synthèse (JSON), audit complet ou d'une seule catégorie (CSV / JSON), redirections, erreurs 404,
journal des modifications, mesures PageSpeed (CSV, encodage UTF-8 avec BOM pour Excel). Aucun secret exporté.

## 10. Routes

Toutes réservées aux formateurs (`canManage()` dans `web.js`, contrôle unique). Formulaires classiques (POST) : il n'y a
pas d'API JSON publique, volontairement (rien ne l'utiliserait).

| Méthode | Adresse | Rôle |
|---|---|---|
| GET | `/formateur/seo` | Vue d'ensemble (dernier audit, surveillance, contenus, configuration, journal récent) |
| GET/POST | `/formateur/seo/reglages` | Réglages centraux |
| GET | `/formateur/seo/contenus` | Liste des contenus publics |
| GET/POST | `/formateur/seo/contenus/:type/:key` | Réglages d'un contenu + contrôle du HTML publié + aperçu Google |
| GET | `/formateur/seo/journal` | Journal des modifications |
| GET/POST | `/formateur/seo/redirections` (+ `/:id`, `/:id/supprimer`, `/:id/raccourcir`, `/import`, `.csv`) | Redirections |
| GET/POST | `/formateur/seo/erreurs-404` (+ `/action`) | Journal des 404 |
| GET | `/formateur/seo/technique` | robots.txt, plan du site, exclusions, conflits |
| GET/POST | `/formateur/seo/audit` (+ `/corriger/:id`) | Audits, problèmes, corrections |
| GET | `/formateur/seo/analyse?path=` | Analyse d'une seule page |
| GET | `/formateur/seo/regles` | Règles |
| GET/POST | `/formateur/seo/integrations` (+ `/:service`, `/:service/tester`, `/pagespeed/analyser`) | Intégrations Google |
| GET/POST | `/formateur/seo/taches` (+ `/:nom`, `/:nom/executer`) | Tâches programmées |
| POST | `/formateur/seo/alertes/vues` | Marquer les alertes comme vues |
| GET | `/formateur/seo/rapports` (+ `/audit-:id.csv|json`, `/erreurs-404.csv`, `/journal.csv`, `/pagespeed.csv`, `/synthese.json`) | Rapports |
| POST | `/formateur/blog/api/seo-check` | Contrôle avant publication (éditeur d'articles) |
| GET | `/formateur/blog/:id/seo-historique` | Historique SEO d'un article (éditeur) |
| GET | `/robots.txt`, `/sitemap.xml` | Publics |

## 11. Variables d'environnement

| Variable | Rôle |
|---|---|
| `SITE_URL` | Adresse publique (https). Indispensable en ligne : canonical, Open Graph, sitemap, PageSpeed |
| `ENCRYPTION_KEY` | Chiffrement des clés Google (partagée avec le module marketing). Sans elle : « Configuration requise » |
| `SEO_JOBS` | `on` (défaut, sauf en test) / `off` : minuteur des tâches programmées |
| `SEO_JOBS_TICK_MS` | Intervalle du minuteur (défaut 60 000 ms) — utile aux tests |
| `SEO_GOOGLE_TOKEN_URL`, `SEO_GSC_URL`, `SEO_GA4_URL`, `SEO_PSI_URL` | **Tests uniquement** : remplacent les adresses de Google par un faux serveur |

## 12. Tests

`npm test` lance toute la suite (node:test). Fichiers SEO : `seo-core` (socle, métadonnées, schéma), `seo-technical`
(redirections, 404, robots, sitemap), `seo-audit` (site de test truffé de problèmes connus), `seo-guard` (contrôle avant
publication, journal), `seo-integrations` (faux serveur Google qui vérifie la signature du JWT), `seo-jobs` (tâches,
exécution automatique, surveillance, rapports), plus les tests SEO historiques (`etape3-seo`…). Les intégrations Google
ne sont testées que contre ce faux serveur : la première connexion réelle se vérifie avec le bouton « Tester la connexion ».

## 13. Espace de travail SEO de l'éditeur d'articles

Onglet SEO de l'éditeur transformé en espace de travail modulaire (permanent, indépendant du Mode Fun).

```
Panneau (affichage seul)
   ↓ lit
Couche de données partagée (navigateur, src/editor/blog/seoPanels.js#createSeoData : cache + requêtes regroupées)
   ↓
Moteur SEO : analyse de l'éditeur (src/utils/seoAnalyzer.js, la même que le contrôle serveur) + serveur
   (src/seo/workspace.js#articleData : inspect, robots, sitemap, audit, intégrations)
   ↓
Base de données / API Google
```

- **Panneaux (17)** : Note SEO, Recommandations, Exploration du site (audit), Mots-clés, Apparence dans Google, Analyse du
  contenu, Aperçu social, Sommaire et données structurées, Liens internes, Indexation et lecture, Historique SEO,
  Opportunités, SEO technique, Images, Performance, Search Console, Données externes. Les panneaux sont **déplacés** dans
  la page (jamais recopiés) : leurs champs restent dans le formulaire de l'article.
- **Disposition** (`src/editor/blog/workspace.js`) : zones droite (barre latérale), gauche, basse, fenêtres flottantes
  (déplacer, redimensionner, rester dans la zone de travail) ; onglets (glisser sur l'en-tête d'un autre panneau) ;
  réduire / agrandir / fermer / rouvrir ; menu contextuel (⋮ ou clic droit) ; redimensionnement des zones à la souris
  et au clavier (flèches). Sur écran ≤ 1100 px : panneaux en accordéon dans la barre latérale.
- **Dispositions** : Rédaction, Technique, Analyse, SEO complet, Par défaut ; dispositions nommées (20 au plus).
  Dernière disposition enregistrée automatiquement sur le compte (`seo_workspace_prefs`), restaurée à l'ouverture.
- **Mode Focus SEO** : note, recommandations, analyse du contenu ; temporaire ; Échap pour quitter.
- **Palette de commandes** : **Cmd/Ctrl + Maj + K** (Cmd+K reste « insérer un lien ») ; uniquement de vraies actions.
- **Non implémenté (affiché tel quel)** : variantes / synonymes des mots-clés, statut d'indexation chez Google
  (inspection d'URL). Semrush, Ahrefs, DataForSEO : non intégrés (aucun faux fournisseur affiché).

Routes (formateur) : `GET /formateur/blog/:id/espace-seo?parties=page,audit,gsc,psi,external,opportunities,site`,
`POST /formateur/blog/:id/espace-seo/pagespeed`, `POST /formateur/blog/api/espace-seo/images`,
`PUT /formateur/blog/api/espace-seo/disposition`, `POST|GET|DELETE /formateur/blog/api/espace-seo/dispositions[/:nom]`,
`PUT /formateur/blog/api/espace-seo/fun`. Tables : `seo_workspace_prefs`, `seo_workspaces`.

## 14. Mode Fun (couche ludique facultative)

- Fichier séparé `public/js/seo-fun.js` (source `src/editor/seo-fun.js`), **chargé seulement si le Mode Fun est
  activé** (désactivé par défaut). Pont `window.KolakisaSEO` en lecture seule (copies des données) : la couche peut
  lire l'analyse et les parties de données, ouvrir un panneau, ajouter des commandes ludiques à la palette, et écrire
  **uniquement** sa progression (points, badges) — le serveur refuse toute autre clé.
- Contenu : boss SEO (= nombre réel de points à corriger), points d'expérience et badges décoratifs, docteur / police /
  pompiers / détective (déclenchés par de vrais problèmes ou de vraies opportunités), cimetière des liens cassés (audit
  réel), robot, terminal ludique (`seo status` = vraies données ; aucune commande système), « Surprends-moi », code
  Konami, pause café. Personnalité : Professionnel (défaut), Fun, Chaotique.
- Anti-agacement : délai minimal entre deux messages (5 min / 2 min / 45 s selon la personnalité), maximum par session,
  jamais pendant la frappe ni pendant un glisser, jamais deux fois le même message, fermeture immédiate, aucun son.
- Si la couche plante, est supprimée ou désactivée : l'éditeur et l'espace de travail fonctionnent à 100 %.
