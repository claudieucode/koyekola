# 14 - Audit de site (Rank Math)

Date de consultation : 2026-10-29. Statuts : officiel / observation / hypothèse.

## 1. Constat préalable

Aucune page KB intitulée « Site Audit » n'a été trouvée : `https://rankmath.com/kb/site-audit/` renvoie 404 et une recherche ciblée rankmath.com ne retourne aucun article de ce nom (observation). L'outil documenté est le **SEO Analyzer** (« SEO Analysis »), plus les outils MCP `audit-site-seo` et `fix-site-seo`, plus l'audit de liens de Link Genius (voir 16). Ce document couvre ces trois éléments et ne présume pas l'existence d'un « Site Audit » crawler séparé.

## 2. SEO Analyzer (officiel, `kb/seo-analysis/`)

- Emplacement : menu Rank Math SEO. Analyse un site **en ligne** ; ne fonctionne pas sur localhost car le serveur de Rank Math doit récupérer la page (donc service externe).
- Sortie : score 0-100 et liste de contrôles.
- Gravités : **Passed** (rien à faire), **Warning** (moins grave), **Failed** (problèmes sérieux à traiter en premier ; « pas des problèmes cassant le site »).
- Nombre total de tests : non précisé par la KB. Free-vs-pro annonce « 30+ Detailed SEO Tests » ; un article de blog évoque 40 facteurs (observation de divergence, non tranchée).

### Catégories et contrôles listés (officiel)

| Catégorie | Contrôles cités |
|---|---|
| Priority | Mises à jour automatiques du plugin activées |
| Basic SEO | Mots-clés communs, méta description (50-160 caractères), H1/H2, alt des images, mots-clés dans titre et description, ratio liens internes/externes, longueur du titre SEO, slogan, visibilité moteurs, structure des permaliens, accessibilité de l'accueil, responsive ; contrôles de mot-clé principal à l'échelle du site |
| Advanced SEO | Aperçu mobile (informatif), canonical, noindex, canonicalisation www, Open Graph, robots.txt, schema, connexion Search Console, sitemaps, fraîcheur |
| Performance | En-têtes d'expiration des images, minification CSS/JS, requêtes de page (< 20), taille HTML (< 50 KB), temps de réponse serveur (< 0,2 s) |
| Security | Plugins visibles, thème visible, listage de répertoires, Google Safe Browsing, HTTPS |

Limites : dépendance à un focus keyword sur un site de plus de 200 000 lignes post meta (avertissement, filtre pour relever la limite). Analyse surtout de **la page d'accueil** pour les contrôles de base (officiel : « mostly homepage checks »). Ce n'est donc pas un crawl complet du site.

### Free vs PRO
- Gratuit : exécuter l'analyseur et voir les résultats. Un analyseur en ligne gratuit existe avec moins de tests (officiel, `kb/seo-report/`).
- PRO : impression/PDF, **Competitor Analyzer** (URL d'un concurrent ; mode Easy 17 tests, mode Advanced 25), comparaison côte à côte. Certains tests sont exclus car ils dépendent de données Rank Math installé sur le site cible.
- Free-vs-pro liste aussi « Competitor SEO Analysis » et « Side by Side SEO Comparison » (la lecture ne distingue pas les offres : observation).

## 3. Outils MCP d'audit (officiel, `kb/mcp-tools/`, `kb/optimize-site-using-rank-math-mcp/`)

- `audit-site-seo` : rapport groupé par gravité (problèmes critiques, avertissements), score global, nombre de tests, recommandations. Couvre vitesse, profil de liens, canonicalisation, existence de robots.txt, liens cassés, mot-clé dans le titre. Audit d'un site concurrent : PRO.
- `fix-site-seo` : corrige un sous-ensemble limité de tests en échec. L'exemple de la KB crée un robots.txt et met à jour un titre. La KB signale que l'outil peut activer des modules, modifier les permaliens et éditer robots.txt, et conseille de relire les changements proposés. Étape de confirmation : non décrite dans l'exemple (officiel/lacune).
- Liste exhaustive des tests : non fournie.

## 4. Audit de liens (Link Genius, PRO)
Voir 16-internal-linking.md : codes 4xx/5xx, redirections 3xx, nofollow interne, bloqués par robots.txt, orphelines. L'étape « Crawl » (statuts HTTP) est PRO.

## 5. Limites relevées

- Pas de crawl multi-pages documenté pour l'Analyzer ; pas de fréquence planifiée, pas de plafond de pages, pas de gravité à plus de trois niveaux, pas d'export hors impression/PDF.
- Pas d'historique d'audits documenté (**lacune**).

## 6. Pertinence pour Kolakisa

- Les contrôles on-page (titre, méta, H1, alt, canonical, noindex, robots.txt, sitemap, HTTPS, Open Graph, schema) sont faisables nativement car Kolakisa maîtrise le rendu : audit direct des données plutôt que crawl externe. Dépendance WordPress : seulement les contrôles propres à WP (auto-updates du plugin, plugins/thème visibles, permaliens).
- Performance (TTFB, taille HTML, requêtes) : mesurable côté serveur ; seuils de Rank Math cités à titre de référence, pas comme norme Google.
- Sécurité (Safe Browsing) : nécessite un service Google externe (non détaillé ici).
- Concurrent : exige de crawler un site tiers (hypothèse : fetch HTTP, respect robots.txt).
- Proposition de gravités : reprendre Passed/Warning/Failed (hypothèse de design) et ajouter l'historique par site.

## 7. Sources

| URL | Date | Statut |
|---|---|---|
| https://rankmath.com/kb/seo-analysis/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/seo-report/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/mcp-tools/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/optimize-site-using-rank-math-mcp/ | 2026-10-29 | officiel |
| https://rankmath.com/free-vs-pro/ | 2026-10-29 | officiel (icônes illisibles) |
| Recherche web restreinte à rankmath.com « Site Audit » | 2026-10-29 | observation (aucun résultat dédié) |

## 8. Lacunes

- `kb/site-audit/` : 404. Aucun module « Site Audit » à crawl complet n'est documenté dans les pages lues.
- Liste complète des tests, nombre exact (30+ vs 40), planification, plafond de pages, historique : non documentés.
