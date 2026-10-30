# Palier 15 — Audit de la qualité du rendu

Périmètre : lisibilité et stabilité du rendu liées à l'accessibilité. Le responsive général est celui du Palier 14 (matrice 30 pages × 8 tailles × Chrome + Firefox : 0 défilement horizontal après correction) et n'est pas refait.

| Sujet | Méthode | Résultat |
|---|---|---|
| Réflexion à 320 px (équivalent d'un zoom 400 %) | Matrice du Palier 14 | 0 débordement de page |
| Mouvement réduit | `reducedMotion: reduce` sur `/`, `/catalogue`, `/blog` : animations infinies actives | 0 |
| Contraste en thème sombre | Sonde, 25 pages | Mêmes constats qu'en clair (aucun propre au sombre) |
| Texte sur dégradé/image | Non évaluable par la sonde | Non vérifié (10–12 textes par page publique) |
| Lisibilité des états vides | Rendu du titre : même taille (20 px) et même graisse (700) avant/après passage h3 → h2 | Inchangé (calculé) |
| Pied de page h4 → h2 | Comparaison des styles calculés | Taille 15,2 px, couleur, marges identiques ; graisse 700 conservée explicitement (h2 global = 800) |
| Décalage du bas de page avec le bandeau de consentement | Espace réservé = hauteur du bandeau + 32 px, retiré dès le choix | Mesuré (le pied de page n'est plus recouvert) |
| Pastilles et cibles | Voir Palier 14 | 24 px minimum |

Changements visibles : le bas des pages publiques gagne de l'espace tant que le bandeau est affiché (voulu) ; aucun autre changement visuel.
