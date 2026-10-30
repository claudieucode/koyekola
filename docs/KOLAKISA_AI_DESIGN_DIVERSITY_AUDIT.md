# Audit de la diversité des designs (22.1)

**Palier 22.1 · 2026-10-30 · Données : `docs/quality-lab/results.json`.**

Comparaison des 15 sites générés à partir de 15 briefs différents (socle déterministe, sans IA).

## Structure
| Mesure | Résultat |
|---|---|
| Structures d'accueil distinctes | **1 sur 15** (hero > texte > cartes > témoignages) — 105 paires de sites sur 105 ont un accueil identique |
| Ensembles de pages distincts | **10 groupes** pour 15 sites ; trois secteurs (construction, services, santé) ont exactement les mêmes pages ; photographie = portfolio ; les trois boutiques = trois fois « Accueil, Catalogue, FAQ, Contact » |
| Enchaînements de sections sur 72 pages | 11 variantes ; 15 pages ont l'enchaînement « hero > texte > cartes > témoignages » |
| Similarité moyenne des accueils (Jaccard) | **1,00** |

## Couleurs et typographie
| Mesure | Résultat |
|---|---|
| Couleurs principales distinctes (direction A) | 13 valeurs, mais **4 familles de teinte** (bleu 215°–223°, orange 22°, vert 145°, violet 262°) ; **11 sites sur 15 en bleu ≈ 215°** |
| Diversité entre les 3 directions d'un même brief | écart de teinte **0 à 3°** — variantes de luminosité et de saturation |
| Polices | 4 paires disponibles ; 8 briefs sur 15 proposent la même paire pour 2 directions sur 3 |
| Respect d'une couleur demandée | oui (orange, vert, violet) ; une couleur secondaire demandée (jaune) n'est pas reprise |

## Diagnostic
Les sites de secteurs différents **ne reçoivent pas la même architecture** (10 groupes), mais ils reçoivent **le même accueil** et, hors couleurs citées, **la même couleur**. L'impression « un seul modèle » vient de l'accueil et de la teinte, pas du nombre de pages.
Les trois « directions artistiques » d'un brief sont des variantes d'une seule direction ; ce n'est pas une vraie alternative.

**Attention à ne pas confondre diversité et incohérence** : une teinte bleue par défaut est cohérente et lisible ; le problème est l'absence de choix réel, pas la couleur.

## Causes racines
- Accueil : `RECIPES.accueil` fixe (Page Generator) ; mapper identique quel que soit le secteur.
- Teinte : `analyzer.analyze` retombe sur une teinte par défaut sans couleur citée ; `design.proposals` ne déplace pas la teinte.
- Catalogue de 18 catégories pour des secteurs plus nombreux.

## Mesure de suivi
Après correction : accueils distincts ≥ 8/15, similarité moyenne < 0,6, écart de teinte entre directions ≥ 30° pour au moins 2 propositions sur 3, sans baisse du taux de contrastes conformes (45/45). Le laboratoire calcule déjà ces indicateurs.
