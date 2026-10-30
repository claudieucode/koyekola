# Programme 21.9 — Limites et restant à faire

## Non couvert par rapport à la demande
1. **Analyse en langage naturel limitée à des règles** (formulations courantes) ; pas de compréhension libre. Une phrase non reconnue donne des exemples.
2. **Non pris en charge** (dit à la personne) : taille du titre d'une section native (suit le design), adaptation mobile automatique, restyle d'une page entière, régénération de la **structure** d'une page par le Page Generator (seuls ses textes sont régénérés).
3. **Image** : la génération est lancée ; l'association et le remplacement restent l'action explicite du 21.7. Pas de réversion d'association propre ici.
4. **Interface** : pas de sélecteur de **deux versions quelconques** (comparaison avec l'état actuel seulement ; l'API sait comparer deux versions) ; pas de comparaison visuelle côte à côte ; pas de lien depuis l'interface 21.8 de `main` ; historique « contextuel » = filtres de l'API (page, section) sans panneau dédié dans l'éditeur.
5. **Undo / Redo** : opérations de CE moteur seulement. L'historique d'actions de l'éditeur (navigateur), la pile du plan 21.8 et les annulations des autres moteurs restent séparés (pas de pile unifiée).
6. **Protections** : appliquées par ce moteur et par le Content Generator (`apply`). Le Page Generator, le Design Generator et l'AI Media **ne consultent pas** ces verrous quand ils sont appelés directement.
7. **Coûts** : `ai.call` ne communique pas le coût ; seul le nombre d'appels est suivi. Pas de coût par fournisseur/modèle tant que l'AI Core n'est pas branché en production.
8. **Conservation** : aucune suppression automatique ; `prune` manuel (simulation par défaut) ; pas de planification ni de stockage différentiel.
9. **Médias** : les snapshots conservent des chemins ; un fichier supprimé de la médiathèque n'est pas récupérable par restauration.
10. **Concurrence** : pas de verrou « une génération à la fois » ; deux onglets peuvent proposer ; l'application détecte le conflit par empreinte.

## Dette
- Tables créées à la demande (cinq) : inventaire d'isolation des tables à mettre à jour si elles passent un jour en migration.
- Suite complète, Firefox/Safari, lecteur d'écran, charge : non exécutés. Qualité d'un vrai modèle non évaluée.
- Le chemin de dépendance « couleur de design » est une estimation (références `token:` et fonds de section).

## Conditions pour la suite
Brancher l'AI Core (coûts réels, quotas par site) ; lien depuis l'interface 21.8 ; sélecteur de deux versions et rendu côte à côte ; panneau d'historique contextuel dans l'éditeur ; faire consulter les verrous par pagegen / designgen / aiMedia.
