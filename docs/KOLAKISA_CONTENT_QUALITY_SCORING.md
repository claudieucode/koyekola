# Score de qualité éditoriale

`quality.evaluate(document, contexte)` → 14 critères.

| # | Critère | Mesure réelle | Non évaluable quand |
|---|---|---|---|
| 1 | Pertinence par rapport à l'objectif | sections requises du genre de page + volume de repère | genre indéterminé |
| 2 | Correspondance avec l'intention | écart entre structure attendue et structure réelle | pas de mot-clé / intention indéterminée |
| 3 | Qualité rédactionnelle | formules creuses (liste fr/en), mots répétés > 4 %, débuts de phrase répétés | moins de 5 mots |
| 4 | Clarté | longueur des phrases, part de phrases > 30 mots | moins de 30 mots |
| 5 | Structure | H1, sauts de niveau, texte long sans intertitre | — |
| 6 | Cohérence éditoriale | tu/vous, longueur de phrases vs voix | moins de 5 mots |
| 7 | Originalité | similarité (bardeaux de 5 mots, Jaccard) avec les **autres pages du même site** | aucune autre page, ou texte < 40 mots |
| 8 | Complétude | espaces réservés, texte provisoire, longueur de repère | contenu vide |
| 9 | Qualité des informations | affirmations et chiffres absents des faits fournis | moins de 5 mots |
| 10 | Optimisation SEO | `checkMeta` + images sans alt | — |
| 11 | Lisibilité | indice Kandel-Moles (fr) / Flesch (en) | moins de 30 mots ; autres langues : mesures sans indice |
| 12 | Appels à l'action | présence selon le genre, libellés génériques | genre indéterminé ou CTA facultatif |
| 13 | Adaptation à la cible | lisibilité vs cible déclarée et vocabulaire de la voix | aucune cible déclarée |
| 14 | Cohérence avec la marque | termes à éviter, nom de l'entreprise | moins de 5 mots |

**Score global** = moyenne des critères *évaluables* ; la réponse indique `evaluable/14`. Un contenu vide n'a **pas de note**.

## Problèmes
Chacun porte : `criterion`, `id`, `severity` (**blocking** | important | optional), `priority` (1 à 3), `explanation`, `recommendation`, `correction` et `blocking`.
- **Bloquants** : espaces réservés restants, texte provisoire, contenu vide, quasi-doublon ≥ 60 %, titre SEO trop long pour le CMS.
- **Corrections proposées** (jamais appliquées) uniquement quand elles se dérivent du contenu : description à partir des deux premières phrases, titre depuis le H1, coupe d'un titre/description trop long, libellé de bouton neutre « Nous contacter ». Pour reformuler : renvoi à l'assistant avant/après. Pour un fait non étayé : demande de confirmation.

## Avertissement
« Repère éditorial calculé par Kolakisa sur ce contenu. Ce n'est pas une prédiction de classement ni une note de Google. » (dans chaque résultat et sur l'écran)

## Limites
Heuristiques à règles, calibrées pour le français ; les listes de formules creuses sont courtes. Aucune mesure d'originalité face au reste du web. Aucun jugement sémantique de fond (justesse, pertinence réelle) : c'est le rôle d'une relecture humaine.
