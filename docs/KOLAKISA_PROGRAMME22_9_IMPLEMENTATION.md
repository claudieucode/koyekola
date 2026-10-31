# Programme 22.9 — Moteur de performance des sites publiés

Date : 2026-10-30. Branche `feat/programme-22-9-performance` (depuis `origin/main` 35603ee2).

## Audit initial (Phase 1) — ce qui existait déjà, réutilisé sans reconstruction
| Domaine | État constaté | Source |
|---|---|---|
| Compression | `compression` 1.8.2 ; la production répond en **brotli** (`content-encoding: br`, mesuré sur kolakisa.com) | `server.js:67`, curl |
| Cache statique | `?v=<hash>` + `immutable` 1 an (CSS/JS), polices 30 j, `/uploads/*` 30 j immutables | `server.js:92-120`, `src/utils/assets.js` |
| Pages HTML | `Cache-Control: private, no-cache` partout (pages personnalisées : connexion, panier, consentement, A/B) — **choix correct, conservé** | `server.js:137`, `/p/*` : `no-store` |
| Scripts publics | `landing.js`, `kw-effects.js`, `visitor.js` en **defer** ; aucun script bloquant | `landing.ejs` |
| Images | `loading="lazy" decoding="async"` partout ; `srcset/sizes` via le Media Manager (taille « adaptative ») ; variantes WebP | `variants.js`, `_node.ejs` |
| Polices | bibliothèque locale WOFF2 (`/fonts/library`), préchargement des polices critiques sur le LMS | `server.js:103` |
| Base | `mk_landing_pages.slug` UNIQUE (donc indexé) ; index site/liste/parent présents | migrations 027, 036, 047 |
| Éditeur | audits antérieurs détaillés (`KOLAKISA_PERFORMANCE_BASELINE.md`, `docs/performance*`) — hors périmètre de ce programme | docs |
| Programmes 22.7 / 22.8 | aucun document ni module correspondant dans le dépôt : **non consultés** | `ls docs`, `git log` |

## Écarts constatés (problèmes réels)
| # | Problème | Gravité | Origine | Impact | Traité |
|---|---|---|---|---|---|
| P1 | Le widget Image écrit toujours `loading="lazy"`, y compris pour l'image principale visible d'emblée | élevée | `_node.ejs:66` | LCP | **oui** |
| P2 | Aucune réserve d'espace (`width`/`height`) sur les images du widget | moyenne | `_node.ejs` | CLS | **oui** (médiathèque) |
| P3 | CSS/JS publics non minifiés : 127 Ko + 71 Ko bruts | moyenne | pas d'étape de build | poids | **oui** (à la volée, optionnel) |
| P4 | Aucun outil pour diagnostiquer une page publiée | moyenne | — | pilotage | **oui** |
| P5 | Aucune détection de régression | moyenne | — | pilotage | **oui** (statique) |
| P6 | Aucune donnée terrain (INP/LCP/CLS réels) | élevée | pas de collecte | pilotage | **non** (voir restes) |

## Livré
- `src/perfEngine/` : `vitals.js`, `htmlAnalyzer.js`, `recommend.js`, `regress.js`, `optimize.js`, `minify.js`, `index.js`.
- Route + écran : `/marketing/site-web/sites/:id/performance` (`src/marketing/web/performance.js`, `views/marketing/site-performance.ejs`, `public/js/performance.js`, `public/css/performance.css`).
- Rendu public : `landingPublic.js` applique la priorité de l'image principale ; `_node.ejs` + `variants.js` ajoutent `width`/`height` ; `server.js` branche la minification.
- Tables créées à la demande (aucune migration) : `mk_perf_reports`, `mk_perf_settings`, `mk_perf_log`.
- Aucun appel IA, aucune dépense, aucune dépendance ajoutée.

## Hors périmètre / non fait (voir `KOLAKISA_PROGRAMME22_9_REMAINING_ISSUES.md`)
Cache de pages publiques côté serveur, collecte terrain, CSS critique, code splitting, sous-ensembles de polices, assistant IA de performance.
