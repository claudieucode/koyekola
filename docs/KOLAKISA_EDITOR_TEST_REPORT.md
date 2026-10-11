# Rapport de tests — 10 octobre 2026

## Nouveaux tests (tous réussis)
- `tests/images-resolutions.test.js` : **8/8** (vrai serveur, vraies routes, vrai `sharp`) — version fabriquée à la demande (vrai WebP, largeur, ratio, original octet pour octet intact, 2e accès servi) ; repli sur l'original (image plus petite) ; largeur ou nom inventés → 404 (dont tentative `..%2F`) ; tailles proposées (original, lot, image externe) ; widget Image : enregistré / relu / appliqué à la page **publiée** / « original » non enregistré / valeur inconnue ignorée ; image ancienne et image externe inchangées ; adaptative (`srcset`, pas de version plus grande que l'original) ; Galerie, Carrousel, Boîte d'image (la visionneuse garde l'original) ; suppression définitive retire les versions.
- `tests/images-resolutions-navigateur.test.js` : **4/4** (Chrome réel) — contrôle et tailles proposées ; choix « Moyenne » : le canevas charge la version 640 immédiatement, enregistré, **même iframe** (pas de remontage) ; rechargement : choix restauré ; retour à l'original le retire ; aucune erreur de script.

## Régression (22 fichiers, `--test-concurrency=1`) : **252/252 réussis**
cms-media, marketing-medias, medias-persistance, editeur-medias-variantes, blog-medias-protection, cms-pages, etape3-pages, marketing-pages-atterrissage, editeur-widgets, widgets-contrat, widgets-nouveaux, widgets-parts, editeur-conformite-widgets, marketing-inspecteur, inspecteur-conteneur, editeur-mediatheque-navigateur, inspecteur-navigateur, widgets-nouveaux-navigateur, editeur-controles-complets-navigateur, accordeons-navigateur, widgets-imbriques, format-mise-en-page.

## Non exécuté / non vérifié
- **Suite complète** : non lancée (≈ plusieurs heures sur cette machine).
- Responsive du rendu avec une version réduite : le `<img>` garde les mêmes règles CSS (largeur/hauteur de l'élément inchangées) ; aucun test visuel dédié.
- Image **ancienne** vs **nouvellement importée** : les deux sont des fichiers de la médiathèque au même format de nom ; testé avec des images importées pendant le test seulement.
- Variante manquante : le cas « fichier de version supprimé du disque » se régénère à la visite suivante (même route) ; non testé séparément.
- Galerie, Carrousel, Points d'intérêt en navigateur : testés au rendu serveur, pas dans l'inspecteur.
- Sans `sharp` : le repli est codé (`available()`), **non testé automatiquement** (le test est ignoré si `sharp` est absent).
- Safari / Firefox : non testés.
