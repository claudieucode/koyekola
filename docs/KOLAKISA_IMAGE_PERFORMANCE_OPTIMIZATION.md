# Images

**Programme 22.7** : aucun document ni module dans le dépôt → non consulté. S'appuie sur le Media Manager existant (`src/marketing/media/variants.js`).

## Existant réutilisé
Variantes WebP générées (`sharp`, optionnel), `srcset`/`sizes` pour la taille « adaptative », lecture des dimensions dans l'en-tête des fichiers, nettoyage des variantes.

## Ajouté
| Sujet | Résultat |
|---|---|
| Image principale | pas de `loading="lazy"`, `fetchpriority="high"` (voir HTML) |
| Dimensions | `width`/`height` sur le widget Image (médiathèque, sans recadrage) via `dimensionAttrs` |
| Détection | image sans dimensions, sans `alt`, sans `srcset` (> 6 images), iframes et vidéos non différées |

## Mesure de laboratoire (profil mobile lent)
LCP médiane 3 376 → 2 852 ms (détail dans `KOLAKISA_PROGRAMME22_9_TESTS.md`). Image de test : JPEG 238 751 o servie par l'application.

## Non fait
AVIF, recompression, galeries/arrière-plans CSS (`background-image` ne peut pas être différé ni priorisé par attribut ; non traité), préchargement des images de fond (aucune détection fiable du candidat LCP en CSS), `width/height` sur les galeries et blocs « image + texte ». Les images externes (`https://…`) n'ont pas de dimensions connues.
