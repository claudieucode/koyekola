# Limites

## Volontaires
* `calc()`, `clamp()` toujours refusés (aucune analyse de sécurité nouvelle).
* Jetons et classes appartiennent à **un site** ; une page hors site n'a que les valeurs d'origine du système.
* Une valeur locale et une référence sont deux choses distinctes : aucune conversion automatique.

## Techniques
* Couleur personnalisée (`c-…`) : pas de repli ; si le site disparaît (page déplacée hors site), la couleur est ignorée (fond transparent).
* Une classe supprimée laisse son nom sur les éléments (sans effet).
* Le compteur d'usage d'une couleur ne tient pas compte des réglages du site.
* Mesures : une machine de 2015, Chrome seulement.

## À développer
Typographies globales nommées ; inventaire et garde de suppression des classes ; couleurs / styles partagés entre sites ; aperçu local du changement d'un jeton ; modèles de site (mission 9).
