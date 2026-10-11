# 05 — Images, résolutions et médiathèque

_Vérifié le 2026-10-10._

## Le réglage « Résolution de l'image » — confirmé
- Présent dans les widgets **Image, Image Box, Galerie, Image mise en avant, Galerie de base, Image Carousel, Carrousel média** (articles d'aide ci-dessous). Le choix : miniature, taille complète ou taille personnalisée ; le Carrousel média propose « Thumbnail, Full, Custom ».
- Doc développeur « Image Size group control » (https://developers.elementor.com/docs/editor-controls/group-control-image-size/) : tailles par défaut = thumbnail, medium, medium_large, large, ou dimensions personnalisées.
- **Tailles WordPress** (blog officiel https://elementor.com/blog/wordpress-image-sizes-2/ — source de blog, pas d'aide) : Thumbnail 150 × 150 (recadrée carrée), Medium 300 × 300 max, Medium Large 768 de large max, Large 1024 × 1024 max, Full = original. Changer ces tailles ne s'applique qu'aux nouveaux envois (régénération nécessaire pour les anciens).
- Les tailles viennent donc de **WordPress** (générées à l'envoi), pas d'Elementor lui-même.

## Optimisation — partiellement confirmé
https://elementor.com/help/explore-the-image-optimizer-settings/ (non lu en détail) : d'après la recherche, redimensionnement maximal par défaut à 1920 px et optimisation des tailles Thumbnail/Medium/Full ; ces tailles comptent comme usages du forfait (offre payante : **à vérifier**).

## Autres points confirmés
- Lien d'image : fichier média, URL, aucun ; Lightbox (voir 04). Légende et texte alternatif issus de la médiathèque.
- Object-fit : Remplir/Couvrir/Contenir (widget Image).

## Non vérifié
Format WebP/AVIF servi, `srcset` généré par WordPress, import en masse, remplacement d'une image en conservant les liens, recadrage dans la médiathèque.

## Conséquence pour KOLAKISA
Implémenté (palier 2 de cette mission) : service commun `src/marketing/media/variants.js`. Voir `KOLAKISA_EDITOR_IMPLEMENTATION_REPORT.md`.
