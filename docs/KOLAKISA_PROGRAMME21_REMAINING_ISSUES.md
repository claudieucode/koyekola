# Programme 21 — problèmes restants (priorisés)

## P0 — critique
Aucun ouvert. Aucune fuite entre sites, aucune faille d'écriture, aucun paiement non sécurisé n'a été trouvé (les deux défauts de droits/publication ont été corrigés : F1, F2).

## P1 — important (empêchent de déclarer le programme 21 complet)
| # | Problème | Action |
|---|---|---|
| 1 | **21.9 absent** : pas de Context Resolver, Dependency/Impact Analyzer, snapshots, comparaison globale, restauration globale, pile annuler/rétablir unifiée. Existent seulement : annuler/rétablir du plan, annulation des générations de pages et de design, versions de champs de contenu, versions natives des pages, régénération par section | développer 21.9 |
| 2 | **21.10 absent** et **dépendance manquante** : aucun catalogue de produits, variantes, stocks, livraison, taxes ; panier et Stripe = formations seulement | développer d'abord un socle commercial natif, puis 21.10 |
| 3 | **Aucun fournisseur d'IA vérifié en réel** (texte et images) ; qualité des générations non évaluée ; OpenAI Images non vérifié | essai réel supervisé avec clés, budget et relecture |

## P2 — moyen
4. Aucun test dans un **navigateur réel** (194 suites non exécutées, Playwright/Chrome absents) : responsive, accessibilité, interactions.
5. **AI Core non branché** pour le texte : deux socles IA coexistent ; pas de modèle d'image dans son registre ; `ai.use` sans rôle.
6. Assistant du studio à **règles locales** (5 intentions) ; pas de contexte « composant sélectionné » ; régénération par section, pas par intention globale.
7. Pas de **dépublication** dans le studio (existe dans le moteur de pages) ; pas d'environnement de test distinct de la production (la « publication de test » est une publication de pages en base d'essai).
8. Textes alternatifs sans analyse d'image ; pas d'AVIF ; pas d'antivirus ; EXIF des originaux conservés.
9. Formats régionaux non propagés au rendu public ; interface en français seulement.
10. Performance non mesurée à grande échelle ni en navigateur.

## P3 — mineur
11. `public/js/automation-flow.js` versionné diffère d'une construction fraîche d'une ligne.
12. Échecs préexistants hors programme 21 : `refonte-design` (4), `r9-lancer-recette-prod` (4, branche `r8-recette-outil` absente), `editeur-blocs-firefox` (Firefox absent).
13. Une réalisation alternative de 21.8 (branches `feat/ai-builder-interface-mine`, `alt/programme-21-8-createur-ia`) non fusionnée : à archiver ou supprimer.
