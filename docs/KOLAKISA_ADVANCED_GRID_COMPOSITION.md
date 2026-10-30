# Grilles avancées

Moteur : nœud natif `grid` / `display: grid` (CSS Grid), propriétés réelles : `gridTemplate` (pistes `Nfr`/`px`/`%`/`auto`, 12 au plus), `columns` (1–12), `gridRows`, `gridAutoRows`, `gridAutoFlow` (`row dense`), `gridColumnSpan/RowSpan`, `gridColumnStart/End`, `gridRowStart/End`, `gap`.

| Besoin | Réalisation |
|---|---|
| Grille régulière | cartes, équipe, produits, tarifs, chiffres : `1fr` × N (N = 2 à 4 selon le nombre d'éléments) |
| Asymétrique | `Creative Asymmetric Grid` : 3 colonnes, première carte sur 2×2 |
| Éditoriale | listes à deux colonnes `1fr 2fr` avec filets |
| Mosaïque | `Portfolio Mosaic` : 4 colonnes, lignes de 180 px, tuiles 2×2, 1×2, 2×1, `row dense` |
| Colonnes variables | ratios fermés (1:1, 7:5, 5:7, 2:1, 1:2, 13:7, 3:1…) |
| Zones qui se chevauchent | placement sur la même zone de la grille (`Overlapping Composition`, 12 colonnes) |
| Points de rupture | `responsive.js` (natifs) |

Éditabilité : tout est écrit avec des propriétés que l'inspecteur du Page Builder expose ; aucun CSS arbitraire (test : zéro nœud `css`/`html`/`embed`).
