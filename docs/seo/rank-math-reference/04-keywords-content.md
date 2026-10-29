# 04 — Mots-clés et analyse de contenu

Consulté le 2026-10-29. Qualification : officiel / observation / hypothèse.

## 1. Mot-clé principal et mots-clés secondaires

Source : https://rankmath.com/kb/what-is-a-focus-keyword/, https://rankmath.com/kb/how-to-add-multiple-keywords/, https://rankmath.com/kb/general-tab/ (officiel).

- **Définition** : terme (ou expression) pour lequel on veut classer le contenu. Rank Math l'utilise en interne pour l'analyse ; les mots-clés ne sont pas envoyés à Google (officiel : `general-tab`).
- **Saisie** : champ « Focus Keyword » de l'onglet Général de la méta-boîte ; séparation par Entrée ou virgule.
- **Principal** : le premier mot-clé, marqué d'une étoile. Plusieurs tests ne portent que sur lui (titre, description, URL, début de contenu, alt d'image, unicité, début de titre). Les secondaires ne sont testés que sur certains tests (contenu, sous-titres, densité) — voir doc 03.
- **Nombre** : la version gratuite autorise 5 mots-clés par contenu, PRO illimité (officiel : `what-is-a-focus-keyword`, `keyword-research-with-rank-math`). La page `general-tab` indique 5 « avec un compte connecté ». Le plafond de 5 est ajustable par filtre développeur (10, 20, illimité) (officiel : `bulk-editing-in-rank-math`). L'article « multiple keywords » ne donne pas de maximum et recommande deux ou trois secondaires.
- **Ordre / changement de principal** : glisser-déposer **PRO** ; en gratuit, supprimer et rajouter.
- **Variantes** : l'article conseille des variantes de même sujet et des mots-clés de longue traîne. Plusieurs formes (singulier/pluriel) sont reconnues pour le test « mot-clé dans le contenu », **en anglais uniquement avec une liste limitée** (officiel : `score-100-in-tests`). La reconnaissance de variantes pour d'autres langues (dont le français) n'est pas documentée.
- **Unicité** : un test signale l'usage du même mot-clé principal sur un autre contenu (cannibalisation) et propose fusion, suppression avec redirection ou variante.
- **Variables liées** : `%focuskw%` (principal) et `%keywords%` (tous) pour les gabarits (voir doc 02).
- **Édition en masse** : l'édition rapide change le principal et ajoute des secondaires, sans modifier les secondaires existants ; avec la limite de 5, l'enregistrement remplace toute la liste (officiel). Édition avancée du mot-clé principal : **PRO**.

## 2. Suggestions de mots-clés

| Fonction | Niveau | Source de données | Notes |
|---|---|---|---|
| Suggestions Google (autocomplétion) pendant la saisie | Gratuit après connexion du site à un compte Rank Math | Google (service externe) | Aide à la recherche, pas une analyse de volume (officiel : `keyword-research-with-rank-math`) |
| Comparaison Google Trends | **PRO** | Google Trends (externe) | Compare les mots-clés pour choisir le principal |
| Détection de l'intention de recherche | **PRO** | Non documentée | Activation : Réglages généraux → Autres → « Search Intent » ; affichée à côté du mot-clé ; stockée en base ; action de masse « Determine Search Intent » ; sert aussi au regroupement de mots-clés (résultats de recherche, observation) |
| Suggestions Content AI (mots-clés, questions, liens) | Module Content AI, abonnement/limites mensuelles | Serveurs Rank Math, analyse des pages bien classées | Voir §3 |
| RankBot (idées de mots-clés par prompt) | Content AI ; la bibliothèque de prompts n'est pas disponible en gratuit | IA | Officiel |
| Rank Tracker (suivi de positions) | **PRO**, compte Google connecté | Search Console / Analytics | 1 000 / 20 000 / 75 000 mots-clés suivis selon plan (page Free vs PRO) ; ajout automatique des mots-clés principaux possible |

Rank Math précise lui-même qu'il n'est « pas vraiment un outil de recherche de mots-clés dédié » et ne cite pas de source de volumes (officiel : `keyword-research-with-rank-math`).

## 3. Analyse de contenu : local vs service externe

- **Local (dans le site/éditeur, sans IA)** : les 24 tests de contenu (voir doc 03) : présence du mot-clé, densité, longueur, liens, alt, URL, paragraphes, médias, nombre/sentiment/power word dans le titre. Fonctionnement « en temps réel » dans l'éditeur (officiel). Ils n'exigent pas d'IA ; la suggestion Google du champ mot-clé nécessite un compte connecté.
- **Service externe** : Content AI (recherche par mot-clé et pays), Fix with AI, génération de titres/descriptions/alt, SEO Analyzer (serveurs Rank Math), Google Trends, Rank Tracker (données Google).

### 3.1 Content AI — recherche (officiel : `kb/how-to-use-content-ai/`)
- Entrée : mot-clé de 3 mots ou moins, pays (par défaut « Worldwide »), clic sur « Research ». Plus de 80 pays annoncés ; la FAQ parle de plus de 30 langues (chiffres non conciliés par la page).
- Sortie : cibles de nombre de mots, liens internes/externes, titres (headings), médias ; mots-clés recommandés par emplacement (contenu, titres, titre SEO, description SEO) avec infobulle concurrence publicitaire, CPC, volume ; questions à traiter en titres ou bloc FAQ (bloc FAQ nécessite le module Schema) ; liens externes suggérés (balisage About/Mentions : **PRO**).
- Score Content AI sur 100 (vert au-dessus de 80 selon `seo-score-vs-content-ai-score`). Couleurs des cibles : vert, orange, rouge, rouge foncé (suremploi).
- Quotas : chaque nouvelle recherche de mot-clé consomme un usage ; réutiliser des données déjà stockées pour le même mot-clé n'en consomme pas ; rafraîchir en consomme un autre. Limites mensuelles de recherches : Starter 10, Creator 30, Expert 100 ; gratuit : « un à cinq usages par mois » (flou). Business/Agency peuvent répartir un pourcentage par site.
- Écriture : consignes ≤ 600 caractères, mot-clé ≤ 200 caractères, longueur courte/moyenne/longue ; plus de 40 outils IA ; RankBot (prompts < 2 000 caractères, bibliothèque de 125+ prompts) ; « Generate Alt » (anglais uniquement à ce jour).
- Synchronisation : si le mot-clé correspond, les recommandations Content AI remplacent les seuils fixes de plusieurs tests (longueur, densité, liens, médias).
- Prérequis : module activé, abonnement/plan, Role Manager pour l'accès.
- Une page de la catégorie évoque une migration « Crédits → limites mensuelles par fonctionnalité » ; son contenu n'a pas été lu.

### 3.2 Aucun algorithme publié
Ni la méthode d'extraction des mots-clés suggérés, ni l'échantillon de pages concurrentes, ni le calcul du score Content AI ne sont documentés. Aucune affirmation n'est faite ici à ce sujet.

## 4. Règles des moteurs pertinentes
- Google (officiel, https://developers.google.com/search/docs/essentials/spam-policies) : le bourrage de mots-clés (remplir une page de mots-clés ou de nombres pour manipuler le classement, listes de villes, répétitions artificielles) est une pratique de spam ; cela justifie le garde-fou de Rank Math (avertissement au-delà de 2,5 % de densité).
- Les seuils 1–1,5 % de densité, 10 % initiaux, 50 % du titre, 600+ mots sont des **conventions Rank Math**, pas des règles Google.
- Google ne s'appuie pas uniquement sur la balise title (officiel, voir doc 02).

## 5. Dépendance WordPress et pertinence Kolakisa
- Champ mot-clé multiple avec principal, variables `%focuskw%`, test d'unicité, suggestion autocomplétion : transposables (hypothèse : l'unicité est une requête SQL sur la colonne mot-clé de SQLite).
- Content AI, Trends, Rank Tracker, intention de recherche : dépendent de services/IA propriétaires ou de Google ; pour Kolakisa, alternatives possibles : API Search Console (rank tracking), LLM tiers (hypothèse, hors périmètre source).
- Limite française : pluriels/variantes seulement en anglais chez Rank Math ; un CMS francophone aurait à définir ses propres règles de lemmatisation (hypothèse).

## 6. Sources
| URL | Consultée | Nature |
|---|---|---|
| https://rankmath.com/kb/what-is-a-focus-keyword/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/how-to-add-multiple-keywords/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/keyword-research-with-rank-math/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/general-tab/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/how-to-use-content-ai/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/seo-score-vs-content-ai-score/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/rank-tracker/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/bulk-editing-in-rank-math/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/wordpress/content-ai/ | 2026-10-29 | officiel (liste d'articles, page 1 sur 2) |
| https://rankmath.com/free-vs-pro/ | 2026-10-29 | officiel |
| https://developers.google.com/search/docs/essentials/spam-policies | 2026-10-29 | officiel (Google) |
| Recherche web restreinte à rankmath.com (intention de recherche) | 2026-10-29 | observation (extrait de moteur) |

## 7. Lacunes
- Aucune documentation de l'algorithme de détection d'intention, de suggestion Content AI, du score Content AI.
- Niveau gratuit exact de la détection d'intention au-delà de « PRO » : texte d'un seul extrait de recherche ; la page dédiée n'a pas été lue.
- Plafond de mots-clés : valeurs divergentes selon les pages (5 gratuit / illimité PRO vs 5 avec compte connecté).
- Nombre de langues Content AI : 30+ ou 80+ pays, non concilié.
- Page `kb/content-ai-credits-migration/`, `kb/content-ai-setup/` et page 2 de la catégorie Content AI : non lues.
- Pas de documentation sur la gestion des mots-clés en langues autres que l'anglais.
