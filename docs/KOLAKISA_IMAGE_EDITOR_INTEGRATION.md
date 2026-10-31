# Éditeur d'images

**Non développé dans ce palier.** Aucun éditeur d'images (rotation, retournement, luminosité, contraste, saturation, température, netteté) n'existe dans le code ; rien n'est présenté comme disponible.

Ce qui prépare la suite : `optimize.derive` (dérivation non destructive en mémoire), `crop.plan` (région de recadrage), `analyzer` (luminosité/contraste pour proposer des corrections). Une première version raisonnable serait : recadrage + rotation + export WebP, enregistré comme **nouveau média** lié à l'original, via la médiathèque (`saveUpload`). Voir la feuille de route (`REMAINING_ISSUES`, I-6).
