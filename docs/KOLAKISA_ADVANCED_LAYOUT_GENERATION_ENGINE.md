# Advanced Layout Generation Engine

Flux : **intention** (`intent.analyze`) → **profil du contenu** (`intent.profile`) → **sélection** (`select`) → **construction** (`patterns.build` → `builders`) → **transformation responsive** (`responsive.transform`) → **validation native** (`validate.validate` = `sections.normalizeSection`) → **équilibre** (`balance.analyze`, une correction automatique ciblée) → **proposition** (`apply.propose`).

| Composant demandé | Réalisation |
|---|---|
| Layout Intent Analyzer | `intent.analyze` (règles : type de page, secteur, ton, densité) |
| Layout Pattern Registry | `patterns.js` |
| Layout Selection Engine | `index.select` : famille × 3, ton/secteur × 2, plage d'éléments, pénalité de répétition, départage stable par site |
| Advanced Composition / Grid / Container Planning / Section Structure Generator | `builders.js` (une structure paramétrable par constructeur) |
| Content-to-Layout Mapper | `intent.profile` + `intent.adapt` |
| Visual Balance Analyzer | `balance.js` |
| Responsive Layout Transformer | `responsive.js` |
| Layout Validation Engine | `validate.js` (normaliseur natif + préservation du contenu + métriques) |

Garanties : la sortie est une section `type: "layout"` (nœuds du registre `NODE_TYPES`) ; aucun CSS libre (`css`, `html`, `embed` jamais émis) ; identifiants déterministes ; contenu jamais tronqué ni inventé ; profondeur ≤ 6 et ≤ 90 nœuds par section (tests).

Intégration au Page Generator : le Page Generator (21.4) n'est pas modifié. Les structures de ce moteur sont des sections natives que `pages.saveDraft` accepte directement ; elles ne passent pas par `pageGen/mapper.js`, qui ne connaît que 14 types simples. Un branchement du Plan de site vers `layoutGen.composePage` reste à faire (voir REMAINING_ISSUES).
