# Rapport d'intégration — widgets animables (5 novembre 2026)

## Constat de départ
L'audit (`KOLAKISA_EDITOR_ANIMATION_AUDIT.md`) montre que Kolakisa avait **déjà** un moteur d'animation complet et centralisé (`node.motion` : 63 animations d'entrée / sortie / attention, 4 déclencheurs, 16 survols, défilement, souris et inclinaison 3D, `prefers-reduced-motion` respecté partout) et la plupart des widgets animables (compteur, barre de progression, titre animé, Lottie, carrousels, boîte retournable, points d'intérêt, marquee…). L'écart avec Elementor se situait dans les **réglages propres à certains widgets**. Ce lot comble les plus utiles ; aucun second moteur n'a été créé.

## A. Widgets effectivement ajoutés
Aucun nouveau type de widget dans ce lot (le registre garde ses 102 types). Voir D.

## B. Widgets existants améliorés (réglages optionnels, anciennes pages inchangées à l'octet près)
| Widget | Nouveaux réglages (éditeur → page publiée) |
|---|---|
| Compteur | délai de départ, courbe du comptage (douce / régulière / rapide puis lente), valeur de départ |
| Barre de progression | durée du remplissage, courbe (si « remplir à l'apparition » est coché) |
| Titre animé | effets glissement, flou, zoom (en plus de fondu et machine à écrire) ; curseur clignotant désactivable |
| Boîte retournable | sens vertical, vitesse du retournement |
| Image à points d'intérêt | pulsation des points |

Tous : valeurs bornées, listes fermées ; une valeur invalide est ignorée sans bloquer l'enregistrement ; la valeur par défaut n'est jamais écrite (aucune donnée superflue, anciennes pages identiques).

## C. Fonctionnalités d'animation
Inchangées et déjà complètes : entrées/sorties/attention (63), survol (16), clic (déclencheur + action « Rejouer »), défilement, souris, Lottie (lecture réelle en public, encadré dans le canevas), `prefers-reduced-motion`. Ce lot : la pulsation des points est coupée en « mouvement réduit », le compteur reste statique en « mouvement réduit » et dans l'éditeur.

## D. Non intégré (honnêtement)
Widget « Reviews » (avis multiples), effets de transition des carrousels (fondu, cube) et plusieurs éléments visibles, marquee d'images, texte animé par lettre / surlignage animé, aperçu image de Lottie dans le canevas et fichiers `.lottie`, retournement par échelle négative, parallaxe de fond autre que `fixed`, « Progress Tracker » sur un conteneur, durée/courbe réglables du survol. Raison : lot volontairement limité aux réglages sûrs ; chacun demande un nouveau widget ou un changement de moteur (fixture à régénérer, tests navigateur). Détail et priorités : `ELEMENTOR_WIDGETS_TO_KOLAKISA_MAPPING.md`.

## E. Tests
- `tests/widgets-animes-reglages.test.js` : **15/15** (validation, rétro-compatibilité, CSS publié, scripts publics, éditeur, rendu par le vrai serveur).
- Avec lui, tous verts : `widgets-parts-regression` (sortie de tous les types inchangée), `widgets-parts-couverture`, `widgets-contrat`, `moteur-mouvement`, `widgets-parts`.
- Non faits : suite complète (~7 800 tests), tests navigateur Chrome (lecture réelle des animations), mesures de performance.

## F. Documentation
`docs/elementor-reference/` : `ELEMENTOR_OVERVIEW.md`, `ELEMENTOR_WIDGETS_CATALOG.md` (≈ 25 fiches détaillées sur 119 ; le reste en listes), `ELEMENTOR_ANIMATIONS_REFERENCE.md`, `ELEMENTOR_REFERENCE_SOURCES.md` (47 sources, points « non confirmés » signalés), `KOLAKISA_EDITOR_ANIMATION_AUDIT.md`, `ELEMENTOR_WIDGETS_TO_KOLAKISA_MAPPING.md`, et ce rapport.
