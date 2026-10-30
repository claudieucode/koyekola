# AI Design Generator — architecture (les 10 responsabilités)

| Responsabilité | Module |
|---|---|
| A. Design Analyzer, B. Brand Identity Planner | `analyzer.js` : brief + type de site → direction `{ambiance, teinte, densité, arrondi, polices, imagerie}` avec explications |
| C. Color Palette Generator | `color.js` |
| D. Typography Planner | `typography.js` |
| E. Layout Planner, F. Spacing and Sizing | `design.js` (`sectionStyles`, `layout`, `spacing`, `radius`) |
| G. Component Style Mapper | `design.js` (`components` → boutons, cartes, formulaires, images, liens) |
| H. Responsive Design Planner | `design.js` (`responsive` tablette / mobile) |
| I. Design Validation Engine | `design.validate` + normaliseurs stricts du moteur + revalidation à l'application |
| J. Design Token Adapter | `design.toChanges` → chemins du personnalisateur |
| Orchestration | `index.js` : runs, comparaison, protection, application, annulation |

**IA** : port injectable `call` (par défaut l'IA centrale en production, `ai.call` : module IA du site, plafond quotidien, journal). L'IA ne reçoit que le brief (donnée, pas instruction) et ne peut répondre que par des **choix énumérés** (ambiance, teinte 0-359, densité, arrondi, polices) ; toute valeur hors liste est ignorée avec une note ; aucune couleur, valeur CSS ni propriété libre n'est acceptée. Le nouveau AI Core (`src/ai`) pourra être branché derrière le même port quand il sera activé en production.
**Variantes** : A (la plus proche du brief), B (alternative sobre voisine), C (contraste premium ou corporate) ; mêmes réglages modifiés, jamais trois sites.
**Protection** : voir `KOLAKISA_AI_DESIGN_TOKENS.md`.
**Intégration Page Generator** : `appliedLayout()` renvoie la composition de la dernière direction appliquée ; le Page Generator l'utilise pour les attributs de section des pages générées.
