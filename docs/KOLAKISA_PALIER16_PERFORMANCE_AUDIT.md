# Palier 16 — Audit de performance et de stabilité

Base : `origin/main` 6c589dd5 (paliers 12 à 14 présents). Branche `feat/palier16-performance`. Date : 2026-10-29.

## 1. Ce qui existait déjà (vérifié dans le dépôt, non refait)
- Audits et corrections antérieurs de l'éditeur : `KOLAKISA_PERFORMANCE_AUDIT.md`, `…_BASELINE.md`, `performance-mesures-chrome/REPORT.md` (lectures groupées, aperçu immédiat, `content-visibility` sur la Structure, attente de rendu réduite).
- Bancs reproductibles dans `scripts/perf/` (latence serveur, chargement navigateur, latence du canevas, interactions, mémoire, sonde SQL).
- Pas de framework d'interface : pas de rendus de composants à mesurer (voir l'audit antérieur §2) ; l'équivalent est le nombre de mises en page et de recalculs de style.

## 2. Ce qui a été mesuré aujourd'hui (références « avant »)
Résultats bruts : `docs/performance-mesures-chrome/bench/palier16-*-avant.txt`. Détail et conditions : `KOLAKISA_PALIER16_BENCHMARKS.md`.

## 3. Constats
| # | Constat | Preuve | Verdict |
|---|---|---|---|
| 1 | Pages serveur : p50 de 3 à 32 ms, aucune page à plus de 110 ms au p95 (sauf flux/plan de site, voir 2) | banc serveur, 20 passes | Pas de problème démontré |
| 2 | `/sitemap.xml` (152 requêtes SQL, p95 74 ms) et `/blog/feed.xml` (p95 116 ms pour p50 9 ms) : écarts de queue | banc serveur | Les requêtes ne coûtent que 0,9 à 2,7 ms ; l'écart vient de la charge de la machine ou de la mise en forme, **non attribué**. Aucune optimisation SQL justifiée |
| 3 | `/blog` : 89 requêtes SQL, dont ~7 par article affiché (taxonomie, rattachement à un site) | sonde SQL | Borné par la taille de page (12), coût SQL total 3 ms sur 22 ms de temps serveur : **non traité** (micro-optimisation) |
| 4 | Éditeur de pages : 60 images/s sur survol, zoom, déplacement, défilement, redimensionnement à 100 et 400 éléments ; pointes isolées (sélection 217 ms, curseur 267 ms à 400 éléments) | banc d'interactions, charge machine 6 à 8 | Pointes **non reproduites de façon fiable** sous charge ; à re-mesurer au repos |
| 5 | Frappe → canevas : 37 ms (100 éléments), 95 ms (400) dont 65 ms d'attente du rendu serveur | banc canevas | Le rendu serveur reste le poste dominant (déjà documenté) ; non modifié |
| 6 | Éditeur d'articles : 462 Ko transférés dont 300 Ko de JavaScript, TBT 516 ms (local) | banc chargement | Réel mais déjà traité par Titan XX ; le découpage du paquet n'est pas démontré rentable ici : **non traité** |
| 7 | Sauvegarde du brouillon : écriture conditionnelle sur la révision (`UPDATE … AND revision = ?`), une seule requête en vol côté client, reprise avec délai croissant, copie locale, état « Non enregistré / Enregistrement… / Enregistré » | lecture de `page-builder.js` `save()` et `pages.saveDraft` | **Sain** : une ancienne requête ne peut pas écraser une révision plus récente (409) |
| 8 | Cache `variantCache` (`services/blog.js`) sans borne ni éviction | lecture du code | **Défaut corrigé** (voir implémentation) |
| 9 | Autres caches en mémoire (≈ 40 `Map` examinées) : tous bornés, expirants ou limités par des lignes de la base, sauf `connectors/index.js` `windows` | lecture du code | `windows` : une clé par connexion en base, quelques octets : **négligeable, non modifié** |

## 4. Non mesuré
Voir `KOLAKISA_PALIER16_LIMITATIONS.md`.
