# Programme 21.6 — Limites et restant à faire

## Non livré par rapport à la demande
1. **Aucune interface** (point 15) : seule l'API JSON existe. La saisie du contexte, la comparaison avant/après, les variantes et la validation se font par appels d'API. Prévu au palier 21.8.
2. **Aucun test avec un vrai modèle** : la qualité rédactionnelle, le respect réel de la voix et la pertinence des questions ne sont pas évalués. Un essai réel borné (autorisation, budget, clé) est nécessaire.
3. **Création de contenu structurel** : pas de nouvelles cartes/questions/sections ; seuls les champs d'éléments **existants** sont remplis. Le Page Generator (21.4) doit fournir la structure (avec ses textes d'exemple entre crochets).
4. **Pages de blog, articles de démonstration, FAQ commerciales longues, descriptions de catégories** : non générés (le CMS n'offre pas ces champs dans les sections ; articles = autre module).
5. **Messages de formulaire** (confirmation, erreurs, libellés de champs) : non natifs des sections, non couverts.
6. **Éléments du Page Builder** (94 types) : non couverts ; seules les 13 sections natives du tableau `sections`.
7. **Pages multilingues** : le CMS n'en a pas ; une version linguistique est un ensemble relié, appliquée à une page choisie. Pas de sélecteur de langue ni de `hreflang`.
8. **SEO** : pas de recherche de mots-clés, pas de données de volume/concurrence, pas de données structurées ni de maillage automatique ; hiérarchie H1/H2 déduite de la convention du rendu (non vérifiée visuellement).
9. **Correction orthographique/grammaticale** : absente (contrôles mécaniques seulement).

## Prérequis non remplis
- **21.2 AI Core** : présent mais **non branché en production** (aucun appelant, permission `ai.use` inexistante). Le défaut utilise donc `ai.call` (plafond d'organisation, module « ia » du site). Le branchement Core (`gateway.viaCore`) est testé mais inactif en production.
- **21.3 Brief Analyzer / Site Planner** : non fusionné dans `main` (branche à part). L'adaptateur `facts.fromBriefAnalysis` lit sa forme v1 mais n'est testé que sur un exemple ; **conflit de numéro de migration (116) à résoudre** : la migration du 21.3 doit passer à 118 ou plus avant fusion.
- **21.5 AI Design Generator** : inexistant ; ce palier ne touche à aucun style.

## Risques et points d'attention
- Les textes générés d'un site (faits fournis compris : e-mail, téléphone) sont conservés dans `mk_content_sets` pour l'historique, sans durée de conservation ni purge ; non branché sur « Effacer les données ».
- La garde anti-invention est **mécanique** : elle retire chiffres, années, contacts et URL non fournis et signale une liste fermée d'affirmations (certification, garantie, récompense, classement, leadership…). Elle ne détecte pas une invention formulée autrement (une ville, un nom de client, une qualité). La relecture humaine reste obligatoire.
- Un nombre écrit en lettres (« trois cents clients ») n'est pas détecté.
- Le plafond de quota est celui de `ai.call` (par organisation, par jour) tant que le Core n'est pas branché ; pas de plafond par site en production.
- Un ensemble « reused » (empreinte identique) renvoie le dernier résultat sans appel ; `force: true` régénère.
- CI GitHub inutilisable ; tests serveur lents sous charge ; suite complète non exécutée.

## Déploiement
Voir le rapport final : **non déployé**.

## Conditions pour le programme 21.7 (médias et ressources)
Fusionner 21.3 (après renumérotation de sa migration) ; décider du branchement du Core en production ; un essai réel borné sur ce palier ; une interface (21.8) ou au minimum un écran de revue des ensembles ; décider de la durée de conservation des textes et faits.
