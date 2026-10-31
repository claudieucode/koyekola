# SEO, contenu et accessibilité — audit 22.10

*Programme 22.10 — 2026-10-30. Légende : ✅ vérifié par un test ou une mesure exécutés ici · 🟡 vérifié par lecture/tests antérieurs (non rejoué) · ⛔ défaut constaté · ⚪ non évalué.*

## Mesuré sur les 74 pages publiées du labo (21 sites)
| Contrôle | Résultat |
|---|---|
| Un seul H1 | voir `docs/quality-lab/results.json` (champ `h1` par page) |
| Méta description | **21/74** après correctif P1 (une par site, page d'accueil) : description tirée du but du plan ou d'une phrase réelle du brief, jamais d'un texte d'exemple, jamais dupliquée dans un lot ; **53 pages restent sans description** |
| Images | **0/74** avec image (⛔ Q4) → ALT non évaluable |
| Textes d'exemple publiés | 59/74 avec crochets, 29/74 « Remplacez par… » (⛔ Q2) |
| hreflang | calculé, validé et **émis dans le `<head>`** pour les pages reliées (22.6, test `hreflang-head`) ; `x-default` et blog non faits |
| Canonical, sitemap, robots, données structurées | moteur `src/seo` (41 règles, tests) 🟡 non rejoué page par page |

## Accessibilité
Contrastes des 3 directions artistiques vérifiés par le générateur (21.5) ✅. Navigation clavier, lecteur d'écran, ordre de lecture : ⚪ non évalués dans ce programme (pas d'essai lecteur d'écran).

## Rappel
Un site aux métadonnées remplies n'est pas « optimisé SEO » : aucune donnée de positionnement réel n'existe ici.
