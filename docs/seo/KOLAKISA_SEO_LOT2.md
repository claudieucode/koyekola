# SEO Intelligence — lot 2 (fonctions avancées)

Suite du lot 1 (`KOLAKISA_SEO_GAP_ANALYSIS.md`). Tout ce qui suit est accessible depuis l'espace d'un site : **Site Web → Sites → (site) → SEO**, onglets « Liens internes », « Positions », « Google », « Export / import ». Les redirections par préfixe ou expression se règlent dans le champ « Correspondance » des redirections (site et équipe).

## 1. Redirections par préfixe et par expression régulière
- Trois modes : **adresse exacte** (comportement historique), **préfixe** (`/ancien-blog` redirige `/ancien-blog` et tout ce qui est dessous, en gardant la suite : `/ancien-blog/x` → `/blog/x`), **expression régulière** (`^/archive/(\d{4})/([a-z-]+)$` → `/blog/$2-$1`).
- Priorité : adresse exacte du site → règle du site → adresse exacte commune → règle commune. Les règles s'appliquent dans l'ordre de création.
- Garde-fous : `/` refusé en préfixe ; espaces techniques et accueil jamais redirigés (aussi à l'exécution) ; destination dans la section redirigée refusée (boucle) ; expression obligatoirement ancrée par `^`, 200 caractères, sans référence arrière, sans assertion, sans quantificateurs imbriqués ; 200 règles par périmètre ; l'hôte d'une destination extérieure ne peut pas venir d'une capture ; une capture ne peut pas produire `//hôte`.
- 410 possible en préfixe (section supprimée).
- **Limite** : la protection contre les expressions lentes est une liste de motifs refusés, pas une preuve ; JavaScript n'a pas de délai d'exécution pour une expression. La longueur des chemins étant bornée à 300 caractères, le risque est faible mais non nul.
- Technique : la colonne `match_type` est ajoutée à la première utilisation (pas au chargement du module) car une migration du marketing reconstruit la table `seo_redirects` au démarrage.

## 2. Type de page
Pages du CMS : sélecteur « Type de page (données structurées) » : WebPage (défaut), AboutPage, ContactPage, CollectionPage, ProfilePage, ItemPage, CheckoutPage, SearchResultsPage. Liste fermée, validée côté serveur. Les types qui exigent des données propres (Event, Recipe…) ne sont pas proposés (voir l'analyse des écarts).

## 3. SEO local
Nouveaux réglages : horaires (`Lun-Ven 09:00-18:00`, un jour sans ligne est fermé), latitude/longitude, **autres établissements** (`Nom | Rue | CP | Ville | Pays | Téléphone | Horaires`, 10 au plus). Horaires et GPS ne sont publiés que si le type d'organisation est `LocalBusiness` ; chaque établissement devient un nœud `LocalBusiness` relié à l'organisation (`parentOrganization`). Format invalide : refusé à l'enregistrement.

## 4. Export / import
- Export JSON (`format: kolakisa-seo`, version 1) : réglages propres au site + redirections. Jamais de clé, de secret, d'identifiant de site ni de compteur.
- Import : **aperçu par défaut**, puis application cochée. Toujours appliqué au site de l'appelant (le fichier ne désigne aucun site) ; une clé de réglage global est ignorée ; mêmes validations que les formulaires ; redirections externes soumises à la permission `redirects.external`.
- Import **Rank Math / Yoast** : tableau CSV/JSON avec une colonne `url` et les clés de métadonnées WordPress (`rank_math_title`, `rank_math_description`, `rank_math_focus_keyword`, `rank_math_canonical_url`, `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw`, `_yoast_wpseo_canonical`) ou le format long `url, meta_key, meta_value`. Variables `%title%`, `%sitename%`, `%sep%` (et leurs formes Yoast `%%…%%`) remplacées par les valeurs réelles ; toute autre variable fait écarter le champ. Écrit dans le **brouillon** des pages (jamais publié). **Non éprouvé** sur un export réel de ces extensions : les noms de clés sont ceux qu'elles enregistrent dans WordPress, à confirmer sur un vrai fichier.
- Portée équipe centrale : `transfer.js` gère aussi le périmètre central (articles et formations) ; **aucun écran central** n'a été ajouté dans ce lot (fonction disponible côté code, testée seulement via les sites).

## 5. Liens internes
Pour chaque page publiée d'un site : les autres pages du **même site** dont le mot-clé principal (sinon le titre) apparaît dans son texte sans lien existant vers elles. Calcul local et déterministe, aucune insertion automatique, aucune IA. Limité à 500 pages. Pas encore dans l'éditeur lui-même.

## 6. Suivi de positionnement
Table `seo_rank_entries` (par site ou centrale). Sources : saisie manuelle ; import de l'export « Requêtes » de Search Console ; relevé via l'API Search Console du site (si connectée). Aucune position n'est inventée ni scrappée. La position de Search Console est une **moyenne** sur la période. Écart = dernière mesure − précédente (négatif = amélioration). 20 000 mesures au plus par site.

## 7. Search Console et GA4 par site
Configuration propre à chaque site (propriété + clé de compte de service) stockée sous le nom `search_console@site<id>` / `analytics@site<id>` ; clé chiffrée AES-256-GCM, le nom (donc le site) fait partie des données authentifiées. Jamais réaffichée. La connexion centrale n'est pas modifiée. Vérifié contre un faux serveur Google ; **jamais avec un vrai compte**. Les rapports Search Console/GA4 par site existent côté code (`searchConsoleReport({ siteId })`, `analyticsReport({ siteId })`) mais seul le relevé de positions les utilise dans l'interface.

## Tests
`tests/seo-redirections-regles.test.js` (8), `tests/seo-outils-avances.test.js` (11).
