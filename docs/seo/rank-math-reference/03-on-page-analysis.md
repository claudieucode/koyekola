# 03 — Analyse on-page (méta-boîte) et analyseur de site

Consulté le 2026-10-29. Qualification : officiel / observation / hypothèse. Le score exact n'est **pas** documenté : aucune formule de pondération n'est affirmée ici.

## 1. Deux systèmes distincts

1. **Tests de contenu (méta-boîte, temps réel, côté éditeur)** : analysent un article/page pour un mot-clé. Source : https://rankmath.com/kb/score-100-in-tests/ (officiel).
2. **SEO Analyzer (site entier, côté serveur Rank Math)** : audit de la page d'accueil et d'éléments globaux. Source : https://rankmath.com/kb/seo-analysis/ (officiel).
3. **Score Content AI** (distinct, voir doc 04/15) : compare le contenu à des cibles issues des résultats de recherche. Source : https://rankmath.com/kb/seo-score-vs-content-ai-score/.

Nombre de tests : l'article `score-100-in-tests` numérote 24 tests ; l'article `seo-score-vs-content-ai-score` et un extrait de recherche parlent de 21 ; l'article de désactivation évoque « environ 24 » clés. Incohérence **officielle** entre pages ; la liste ci-dessous suit la page la plus détaillée (24).

## 2. Mécanique de score (ce qui est dit)

- Icônes par test : coche verte = réussi, jaune = non optimisé, croix rouge = mauvais ; trois tests (longueur, densité, médias) ont une icône partielle qui reflète un pourcentage.
- Couleurs du score global : vert 81 et plus, jaune 51–80, rouge moins de 50 (officiel). Le score est sur 100 (officiel).
- Pour atteindre 100/100 : réussir tous les tests, à 100 % chacun, et tous les tests de base pour chaque mot-clé (officiel).
- Mots-clés secondaires : la page dit à la fois que leur score n'affecte pas le score global et que leur optimisation l'améliore — **non résolu par la source**.
- Constructeurs de pages : le score peut différer de l'éditeur WordPress (shortcodes rendus différemment) ; se fier au score affiché dans le constructeur.
- Les scores sont décrits comme des guides issus de recherche et d'expérience, pas des garanties.
- **Non documenté** : pondération par test, formule d'agrégation, arrondis.

## 3. Tests de contenu : détail

Légende : « Principal » = mot-clé principal seul ; « Tous » = tous les mots-clés. Tout est issu de `score-100-in-tests` sauf mention.

### 3.1 Basic SEO
| # | Test | Objectif / données | Règle documentée | Conseils / limites |
|---|---|---|---|---|
| 1 | Mot-clé dans le titre SEO (Principal) | Titre SEO | Présence ; Google afficherait ~50 car. mobile / 60 bureau, d'où « dans les 50 premiers » | Correction via éditeur d'extrait ; « Fix with AI » possible |
| 2 | Mot-clé dans la meta description (Principal) | Description SEO (auto-générée si vide) | Présence dans 120–160 premiers caractères ; modèle par défaut = extrait | `%excerpt_only%` n'utilise que l'extrait réel |
| 3 | Mot-clé dans l'URL (Principal) | Permalien | Présence | Désactivé avec permaliens simples/numériques |
| 4 | Mot-clé au début du contenu (Principal) | Premiers 10 % ; si moins de 300 mots, les 300 premiers mots | Présence | « Fix with AI » |
| 5 | Mot-clé dans le contenu (Tous) | Corps | Présence de chaque mot-clé, formes singulier/pluriel | Pluriel : anglais uniquement, liste de mots limitée |
| 6 | Longueur du contenu | Nombre de mots | Paliers : plus de 2 500 = 100 % ; 2 000–2 500 = 70 % ; 1 500–2 000 = 60 % ; 1 000–1 500 = 40 % ; 600–1 000 = 20 % ; moins de 600 = 0 % | Produits exclus ; avec Content AI, cibles issues des pages concurrentes ; WooCommerce PRO : 200 mots |
| 7 | Schéma Produit (PRO) | Produits WooCommerce/EDD | Réussi si schéma produit configuré | PRO |

### 3.2 Additional SEO
| # | Test | Règle | Limites |
|---|---|---|---|
| 8 | Mot-clé dans un sous-titre (Principal + secondaires) | H2, H3, etc. | Non applicable aux produits PRO |
| 9 | Mot-clé dans l'attribut alt d'une image (Principal) | Singulier ou pluriel dans un alt | — |
| 10 | Densité du mot-clé (Principal + secondaires) | Cible 1–1,5 % ; avertissement au-dessus de 2,5 % | Avec Content AI, aligné sur le premier mot-clé suggéré |
| 11 | Longueur de l'URL | 75 caractères maximum, protocole et domaine compris | Un long domaine peut faire échouer |
| 12 | Liens vers sources externes | Au moins un lien sortant | Non applicable aux produits PRO ; masquable via Content AI |
| 13 | Lien externe « followed » | Requiert que le test 12 passe ; au moins un lien externe non nofollow | Dépend des réglages nofollow globaux |
| 14 | Liens internes | Au moins un lien interne (articles, sous-domaines, domaine principal) | Idem |
| 15 | Unicité du mot-clé (Principal) | Échec si un autre contenu utilise le même mot-clé principal | Lien vers les conflits ; fusion, suppression avec redirection ou variante |
| 16 | Utiliser Content AI | Réussi si Content AI utilisé pour ce mot-clé | Service externe |
| 17 | Autoriser les avis (PRO) | Produits WooCommerce/EDD | PRO |

### 3.3 Title Readability
| # | Test | Règle | Limite |
|---|---|---|---|
| 18 | Mot-clé au début du titre SEO (Principal) | Dans les premiers 50 % du titre | — |
| 19 | Sentiment dans le titre | Mot positif ou négatif présent | Liste de mots non publiée ; non applicable aux produits PRO |
| 20 | Mot « puissant » (power word) | Présence dans une liste interne régulièrement mise à jour | Liste non publiée |
| 21 | Nombre dans le titre | Tout chiffre | Non applicable aux produits PRO |

### 3.4 Content Readability
| # | Test | Règle | Limite |
|---|---|---|---|
| 22 | Table des matières | Détecte le bloc TOC de Rank Math ou des plugins compatibles | Filtres pour étendre/désactiver ; spécifique WordPress |
| 23 | Paragraphes courts | Échec si un paragraphe dépasse 120 mots | Icône œil pour localiser ; « Shorten with AI » |
| 24 | Médias | 1 média = réussite ; 4 ou plus pour le score complet | Masquable avec Content AI |

### 3.5 Tests pour pages produit (https://rankmath.com/kb/content-analysis-tests-for-product-pages/, officiel)
Description : 200 mots minimum ; mot-clé dans les 10 % initiaux et densité 1–1,5 % ; URL ≤ 75 car. ; alt des images ; au moins 4 images/vidéos ; avis activés ; schéma produit réussi automatiquement. La page ne dit pas quels tests sont ajoutés ou retirés ; elle indique que PRO offre des tests dédiés WooCommerce sans lister lesquels.

### 3.6 Autres éléments liés
- « Fix with AI » : disponible pour les tests de mot-clé (titre, description, URL, début, corps), longueur (600+), sous-titre, densité, mot-clé début de titre, sentiment, power word, nombre. Éditeurs pris en charge : Gutenberg, éditeur classique, Elementor. Usage plafonné, service externe (officiel : `kb/fix-seo-tests-with-content-ai/`).
- Désactivation des tests : filtre PHP `rank_math/researches/tests` avec retrait de clés (exemples de clés citées : `titleHasNumber`, `contentHasTOC`, `keywordDensity`, `lengthContent`, `linksHasExternals`, `isReviewEnabled`, `hasProductSchema`) ; filtre séparé pour les tests de recherche Content AI (`wordCount`, `linkCount`, `headingCount`, `mediaCount`). L'effet sur le score n'est pas documenté (officiel : `kb/disable-seo-content-tests/`).
- Édition en masse : filtre par score (Bon/Moyen/Mauvais), « Focus Keyword Not Set », « Article Noindexed » (gratuits) ; filtres titre/description personnalisés, orphelins, redirigés, type de schéma (**PRO**) (officiel : `kb/bulk-editing-in-rank-math/`).

## 4. SEO Analyzer (audit de site)

Officiel : https://rankmath.com/kb/seo-analysis/. Fonctionne via les serveurs de Rank Math (site public nécessaire, localhost impossible). Deux onglets : SEO Analyzer et Competitor Analyzer. Les tests Basic et Advanced portent sur la **page d'accueil** ; les tests Focus Keyword et Post Titles sont sur tout le site (contenus avec méta-boîte).

Score global de 0 à 100 ; résultats Réussi / Avertissement / Échec ; pondération non expliquée.

Tests listés (le total fourni par la page n'est pas indiqué ; Advanced Mode annonce 32 tests contre 24 en mode facile ; un autre passage cite 17 en mode facile et 25 en mode avancé ; la liste ci-dessous en compte 36 hors capture mobile — incohérence officielle) :
- **Priorité** : mises à jour automatiques.
- **Basic SEO** : mots-clés communs ; description SEO (50–160 car.) ; H1 ; H2 ; alt des images ; mots-clés dans titre et description ; ratio de liens (au moins 10 liens internes et deux fois plus d'internes que d'externes) ; longueur du titre SEO ; slogan par défaut ; blog public (contre « décourager les moteurs ») ; structure de permaliens ; mots-clés principaux définis partout (limite 200 000 lignes de méta, ajustable) ; mot-clé dans les titres d'articles ; site adaptatif (présence de media queries) ; accueil accessible (2xx ok, 3xx suivi, 4xx/5xx échec).
- **Advanced SEO** : capture mobile (information) ; balise canonical ; meta noindex ; canonicalisation www ; OpenGraph ; robots.txt (existence, avertissement sur Disallow) ; données structurées ; Search Console connecté ; sitemaps ; fraîcheur (date de dernière modification dans le sitemap ou `og:updated_time`).
- **Performance** : en-têtes d'expiration d'images ; CSS minifié ; JS minifié (avertissement ignorable) ; moins de 20 requêtes ; HTML sous 50 Ko ; réponse en moins de 0,2 s.
- **Sécurité** : plugins visibles ; thème visible ; listage de répertoire ; Google Safe Browsing ; HTTPS.

Concurrents : 25 tests, car 7 reposent sur des données du plugin installé. Impression des résultats, analyse concurrentielle et comparaison côte à côte : **PRO** ; analyse de son propre site : gratuit.

## 5. Dépendance WordPress et pertinence Kolakisa

- Règles simples et déterministes (présence, seuils 75/120/300/600 mots, 1–1,5 % de densité, 50 %/10 %) : **transposables** (hypothèse : implémentables en JS dans l'éditeur Kolakisa).
- Non transposables ou non reproductibles : listes de power words/sentiment (non publiées), pluriels anglais, détection de plugins TOC, tests WooCommerce/EDD, dépendance à Content AI.
- Analyseur de site : plusieurs tests (H1, alt, canonical, noindex, OG, robots.txt, sitemap, HTTPS, www) sont réalisables localement sans service externe ; les tests de performance/sécurité reposent sur des seuils arbitraires de Rank Math (200 ms, 50 Ko, 20 requêtes) et ne sont pas des règles Google.

## 6. Sources
| URL | Consultée | Nature |
|---|---|---|
| https://rankmath.com/kb/score-100-in-tests/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/seo-analysis/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/content-analysis-tests-for-product-pages/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/disable-seo-content-tests/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/fix-seo-tests-with-content-ai/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/seo-score-vs-content-ai-score/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/advanced-mode/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/bulk-editing-in-rank-math/ | 2026-10-29 | officiel |

## 7. Lacunes
- Formule du score, poids des tests, règle d'arrondi : non documentés.
- Listes de power words et de mots de sentiment : non publiées.
- Détection précise de « liens internes » (sous-domaines) : seule la description générale est fournie.
- Nombre exact de tests (21/24/32/36) : contradictions officielles non résolues.
- Détail de la logique des tests PRO WooCommerce : non listé.
- Page de la méta-boîte `kb/meta-box-general-tab/` : 404.
