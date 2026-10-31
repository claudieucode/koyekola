# KOLAKISA — Images et médias responsives (22.8)

État réel vérifié (aucun développement nouveau dans ce palier) :
* `src/marketing/media/variants.js` : variantes redimensionnées, taille « auto » → `srcset` + `sizes` pour les images locales ; recadrage conservé séparément.
* `objectFit`, `objectPosition`, `aspectRatio` disponibles par écran.
* Le moteur 22.7 d'intelligence visuelle n'est pas dans la branche `main` examinée : aucune intégration n'a été tentée.
* L'audit navigateur de 22.8 détecte les images cassées et les débordements ; il ne juge pas le cadrage ni le poids.
Non fait : `<picture>` avec composition mobile distincte, point focal, recommandations de version plus légère, vidéos.
