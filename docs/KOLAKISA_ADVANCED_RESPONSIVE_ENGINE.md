# KOLAKISA — Moteur responsive avancé (programme 22.8)

## Principe
Pas de second moteur : le moteur natif (4 écrans — ordinateur, grand écran, tablette, mobile — avec héritage ordinateur → tablette → mobile, `nodes.pageCss`, seuils par site) est conservé. `src/responsive/` y ajoute ce qui manquait.

| Module | Rôle | État |
|---|---|---|
| `fluid.js` | Typographie fluide bornée (`fluid:min-max` → `clamp()` calculé) | Opérationnel, branché dans `nodes.js` (`fontSize`) |
| `breakpoints.js` | Breakpoint Manager : 7 profils de référence, écran natif selon les seuils DU SITE, vérification des seuils, largeurs d'arête | Opérationnel |
| `audit.js` | Validation statique : 11 règles sur l'arbre d'éléments, par écran, avec correction | Opérationnel |
| `browser.js` | Validation mesurée dans Chrome (débordement, éléments hors écran, texte coupé, cibles tactiles, texte minuscule, images cassées, colonnes étroites, zoom bloqué, meta viewport) | Opérationnel (utilisé par les tests ; pas encore d'écran d'administration qui lance Chrome) |
| `apply.js` | Assistant : analyse → proposition → application → annulation (cadre 21.9 réutilisé) | Opérationnel |
| `src/marketing/web/responsiveStudio.js` + vue + JS/CSS | Écran `/site-web/sites/:id/responsive` | Opérationnel |

Transformateur de mise en page (`src/layoutGen/responsive.js`, 22.3) : réutilisé tel quel, non dupliqué.

## Ce qui n'a PAS été fait
Voir `KOLAKISA_PROGRAMME22_8_REMAINING_ISSUES.md` (Container Queries, résolveur d'images dédié, aperçu comparatif côte à côte, etc.).
