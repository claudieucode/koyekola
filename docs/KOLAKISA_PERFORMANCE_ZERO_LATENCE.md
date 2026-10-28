# KOLAKISA — Campagne de performance « Zero-Latency » (TITAN XXXI)

Date : 2026-10-28. Machine de mesure : iMac 2015 (macOS 12, Node 24.20), **chargée par d'autres programmes pendant les mesures** (charge moyenne 4 à 13) ; disque lent pour les synchronisations (`fsync` p95 ≈ 136 ms). Les chiffres sont des **mesures de laboratoire locales** (serveur de test isolé, `NODE_ENV=test`, jeu de données synthétique) : ils comparent un avant et un après sur la même machine, ils ne prédisent pas la production. La production est derrière le CDN de l'hébergeur (`server: hcdn`, Brotli, HTTP/3) ; vue de l'extérieur, `/sante` répond en ≈ 270 ms (= la latence réseau jusqu'au serveur), les pages publiques en 255–325 ms.

## Outils de mesure ajoutés (reproductibles)

| Script | Mesure |
|---|---|
| `scripts/perf/sonde-sql.js` | préchargé dans le serveur : nombre, durée et plan (`EXPLAIN QUERY PLAN`) de chaque requête SQL, par requête HTTP (en-têtes `X-Q-*`, `X-Srv-Ms`). Jamais chargé en production. |
| `scripts/perf/mesure-latence-serveur.js` | p50/p95/p99, temps serveur, requêtes SQL et écritures, poids, pour 35 pages (public, élève, formateur, Marketing, SEO). |
| `scripts/perf/mesure-chargement-navigateur.js` | Chrome réel : FCP, LCP, CLS, tâches longues, requêtes, octets (JS/CSS/images), en local et réseau 4G simulé. |
| `scripts/perf/profil-chargement.js` | profil CPU d'un chargement de page (fichier, fonction). |
| `scripts/perf/mesure-echelle-blog.js` | mêmes pages avec 50, 500 et 2 000 articles. |

## État initial (baseline)

- **Serveur** : toutes les pages répondent en 4–27 ms (p50) avec 50–60 articles et 3 000 contacts ; 8–89 requêtes SQL par page. **Exception : la page d'un article, 171 ms (p95 343 ms)** — 156 ms de SQL pour une seule écriture.
- **Navigateur** (local, froid) : pages courantes 137–300 Ko compressés, 11–28 requêtes, FCP 190–800 ms, CLS 0, aucune ressource bloquant le rendu, JS exécuté ≈ 20 ms (profil). Éditeur d'articles : 462 Ko (JS 300 Ko), tâches longues 66 + 186 ms, TBT 317 ms. Le « temps natif » (≈ 1 s dans le profil) est du rendu/décodage du navigateur, pas du code de l'application.

## Problèmes, causes racines, corrections

### P1 — Compteurs d'audience écrits à chaque visite (article, formulaire, redirection, journal des 404)
- **Mesure** : page d'article 171 ms p50 / 343 ms p95 ; micro-banc `/tmp/wbench.js` : une écriture SQLite isolée = **p95 136 ms** (synchronisation disque du journal WAL), 100 écritures groupées = **4 ms**. SQLite est synchrone dans Node : chaque écriture bloquait **tout le serveur**, pas seulement la requête (un robot qui sonde des adresses inventées déclenchait cela à chaque 404).
- **Correction** : `src/utils/writeBehind.js` — file d'écritures sans conséquence, validées ensemble toutes les 2 s (ou à 500) dans une transaction ; vidée à l'arrêt normal. Appliquée à : lectures d'article (`blog.countView`), vues de formulaire (`forms.recordView`), accès aux redirections SEO, journal des 404.
- **Politique / risques** : perte possible des ≤ 2 dernières secondes de compteurs en cas d'arrêt brutal (coupure, `kill -9`) ; les compteurs mettent jusqu'à 2 s à apparaître dans le Centre de gestion. **La durabilité des données importantes (commandes, contenus, comptes, sessions) n'est pas touchée** : `synchronous` reste à `FULL`, ces écritures ne passent pas par la file. En `NODE_ENV=test` l'écriture reste immédiate (tests existants inchangés) sauf `KW_WRITE_BEHIND_MS`.
- **Après** (même banc, 20 passages) : page d'article **171 → 19 ms (p50), 343 → 65 ms (p95)** ; 0 écriture dans les pages publiques.
- **Tests** : `tests/write-behind.test.js` (8 : immédiat en test, une seule transaction, échec isolé, seuil de 500, pas d'imbrication, vidage à l'arrêt, parcours HTTP réel avec robots et formateur exclus).

### P1 — Listes du blog : contenu complet de TOUS les articles lu à chaque visite
- **Mesure** (insertion directe de 50 / 500 / 2 000 articles de 7 Ko, `mesure-echelle-blog.js`) : `SELECT *` = **132 ms pour 2 000 articles** ; `blog.textOf` (assainissement HTML complet) = **1,4 ms par article** ; la recherche `/blog?q=` le refaisait pour chaque article à chaque requête.
- **Correction** : `src/utils/postColumns.js` (lecture sans `content`, avec `octet_length(content)`, contenu chargé à la demande par propriété paresseuse non énumérable) pour `/blog`, la recherche, le plan du site, les articles liés ; cache mémoire du texte brut dans `blog.textOf` (clé = article + date de modification + taille en octets ; borné à ≈ 40 Mo de texte).
- **Politique du cache** : clé liée au contenu (toute modification change `updated_at` et/ou la taille) ; aucune donnée utilisateur ni de permission (texte public publié ou brouillon lu par le code appelant, qui garde ses propres contrôles d'accès) ; aucun partage entre sites car la portée de site reste dans la requête SQL ; vidé au redémarrage ; `blog.clearPlainCache()` disponible.
- **Avant → après** (p50, `mesure-echelle-blog.js`) :

| 2 000 articles | avant | après |
|---|---|---|
| `/blog` | 95 ms | 70 ms |
| `/blog?q=…` (recherche) | **1 583 ms** | **145 ms** |
| `/blog?page=2` | 89 ms | 66 ms |
| `/formateur/blog` | 57 ms | 51 ms |
| 500 articles, recherche | 476 ms | 55 ms |

### P2 — Plan du site : une requête de rattachement par article
- **Mesure** : `/sitemap.xml` 259 ms à 2 000 articles, 4 000 requêtes (`attachedSite` par article, deux fois).
- **Correction** : `urls.withBatchCache(fn)` — lecture groupée des rattachements le temps de l'appel synchrone, cache détruit à la sortie (jamais de donnée d'une requête à l'autre ; isolation multi-sites inchangée car les valeurs sont celles de la table). **Après : 161 ms** (p50, même banc).

### P2 — Conversion des anciens textes catégorie/étiquettes (taxonomie) : une validation disque par écriture
- **Mesure** : `taxonomy.reconcile()` (articles écrits hors éditeur : import, SQL) traite 200 articles par passage ≈ 8 000 écritures isolées : **11,5 s** par passage sur la machine de mesure (et recommence à chaque page du blog jusqu'à épuisement).
- **Correction** : le passage est une seule transaction (savepoint imbriqué existant). **Après : 0,78 s** par passage (15×). Travail unique : sans effet pour du contenu créé dans l'éditeur.

### P2 — Notifications du Centre de gestion : parcours complet des comptes et messages à chaque page d'administration
- **Mesure** : `activity.unreadCount` : **14,6 ms par appel avec 30 000 comptes élèves** (`SCAN users`), exécuté à chaque page du formateur.
- **Correction** : index `idx_users_role_created (role, created_at)` et `idx_contact_messages_created (created_at)` (`CREATE INDEX IF NOT EXISTS`, non destructif, sans retour arrière nécessaire). **Après : 3,6 ms.** Garde-fou : `tests/performance-index.test.js`.

## Examiné, non modifié (justification)

- **Compression Brotli / pré-compression des fichiers statiques** : la production passe par le CDN de l'hébergeur qui sert déjà en Brotli (`content-encoding: br`) ; gain mesuré en local ≈ 12 % de transfert, mais sans effet en production → non fait.
- **Minification du CSS** (−25 % gzip mesuré avec esbuild) : esbuild est une dépendance de développement et le déploiement n'a pas de commande de build (`DEPLOIEMENT-HOSTINGER.md`) ; un gain non garanti en production et un risque de régression visuelle → non fait.
- **Découpage du fichier de l'éditeur d'articles (921 Ko, 300 Ko compressés, 178 ms de JS à l'ouverture)** : 56 % est notre code, un découpage exige un chargement en modules et une refonte du fichier de 4 161 lignes ; risque de régression élevé pour un gain de l'ordre de 100–200 ms à l'ouverture d'un outil de travail → reporté (P3).
- **Image d'accueil** (LCP 2,2 s en 4G simulé, 239 Ko JPEG déjà en `srcset`, `fetchpriority=high`) : gain possible en WebP, mais l'outil de conversion (`sharp`) n'est pas installé sur cette machine → non fait.
- **Éditeur de pages (Page Builder)** : déjà audité et mesuré par les missions précédentes (`docs/KOLAKISA_PERFORMANCE_AUDIT.md`, `KOLAKISA_CORE_PERFORMANCE_BASELINE.md`) ; non re-mesuré ici.
- **`synchronous = NORMAL`** : aurait supprimé l'attente d'écriture partout, mais change les garanties de durabilité (perte possible de transactions validées après une coupure) → **refusé** (consigne : ne pas modifier les garanties transactionnelles pour aller plus vite).

## Limites et non vérifié
- Pas de mesure de charge concurrente (outil de charge, préproduction non disponible) ; pas de données de production (p75/p95/p99 réels) ; pas de profil mémoire sur sessions longues ; Safari/Edge/lecteurs d'écran non testés.
- Les mesures du Marketing (campagnes, contacts) n'ont pas été refaites à grande échelle (3 000 contacts seulement).
- La machine de mesure était chargée : les écarts inférieurs à ≈ 20 % ne sont pas significatifs ; les gains cités ci-dessus (×9, ×11, ×15, ×4) le sont.
