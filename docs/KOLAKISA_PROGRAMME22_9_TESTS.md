# Programme 22.9 — tests et mesures

## Tests automatiques ajoutés
| Fichier | Tests | Couvre |
|---|---|---|
| `tests/programme22-9-perf.test.js` | 25 | seuils CWV et étiquetage, analyse statique (DOM, images, scripts, polices, poids réels, chemins hostiles), recommandations, régressions (double seuil, bruit, conditions différentes, rapport illisible), optimisation LCP |
| `tests/programme22-9-perf-http.test.js` | 12 | serveur réel : rendu public, écran, analyse, option réversible et journal, isolation entre sites, droits, brouillon refusé, historique/comparaison, dimensions réservées, anti-rafale, historique borné, 5 Mo max |
| `tests/programme22-9-minify.test.js` | 8 | minification : liste blanche, validité, cache, activation, ETag/304, repli |

Résultats : 25 + 12 + 8 = **45/45**.

## Régression
- Lot ciblé (19 fichiers : médias, pages CMS, rendu public, widgets, SEO, menus, portée des routes, 21.9, 22.3) : tous réussis ; `editeur-widgets` avait échoué (balisage exact attendu) → `fetchpriority` déplacé en fin de balise, réussi ensuite.
- Balayage de **226 fichiers non-navigateur** (cms, marketing, pages, éditeur, layout, médias, SEO, widgets, site, apparence, landing, thèmes) : **225 réussis**. Seul échec : `admin-multisite` « aucune route… modifiée » = garde sur `git diff HEAD` qui échoue tant que les modifications ne sont pas commitées ; relancé après commit (résultat dans le rapport final).
- **Non exécutés** : suite complète (704 fichiers), tests navigateur, Firefox/Safari, lecteur d'écran, appareils réels. Lint/typecheck/build : inexistants.

## Mesures de laboratoire (non terrain)
Chrome 150.0.7871.125 (Playwright), Intel i5-6500 × 4, macOS Darwin 21.6.0, **charge moyenne 7,4 (machine partagée)**, build `package.json` 1.0.0, 2026-10-31. Cache navigateur désactivé. 1 relevé de chauffe + 5 relevés, médiane et étendue. Même page, même serveur, option basculée entre les séries.

| Profil | Série | LCP médiane | Étendue | CLS | 
|---|---|---|---|---|
| Ordinateur (local, CPU ×1, 1350 px) | désactivée | 148 ms | 172 | 0,086 |
| | activée | 140 ms | 40 | 0,031 |
| Mobile lent (1,6 Mbit/s, RTT 150 ms, CPU ×4, 390 px) | désactivée | **3 376 ms** | 16 | 0 |
| | activée | **2 852 ms** | 60 | 0 |

- Mobile lent : −524 ms, très au-dessus de l'étendue → significatif **dans ces conditions**.
- Ordinateur : LCP dans le bruit. CLS 0,086 → 0,031 observé mais **5 relevés sur une page** : indicatif, non concluant, et non comparable au profil mobile.
- Minification : transfert CSS+JS 53 711 → 37 867 o (−29,5 %), captures bureau/mobile identiques (SHA-1), 0 erreur JS (`tests/manuel/perf-minify-parity.js`).
- Production (kolakisa.com, un seul relevé depuis cette machine) : accueil TTFB 0,43 s, 4 466 o, brotli.

Scripts : `NODE_PATH=<playwright>/node_modules node tests/manuel/perf-lab.js <sortie> 5` et `perf-minify-parity.js <sortie>`.
