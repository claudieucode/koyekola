# Analyse des lacunes (hiérarchisée)

| P | Lacune | Impact | Décision |
|---|---|---|---|
| P2 | « Masquer sur Ordinateur » masque aussi le grand écran alors que l'interface affiche une case « Grand écran » indépendante | Surprise possible ; contenu absent ≥ 1920 px | **Non modifié** : choix de compatibilité testé. Option à décider avec l'utilisateur : libellé explicatif dans l'interface, ou rendre les deux indépendants et accepter que d'anciennes pages réapparaissent ≥ 1920 px |
| P2 | Points de rupture : seulement tablette / mobile / grand écran, pas de points supplémentaires | Parité Elementor (jusqu'à 6 points de rupture) | Écart connu : demande une évolution du modèle (`BREAKPOINTS`), de l'interface et de `pageCss` ; hors périmètre |
| P2 | Aucun état (survol…) propre à un appareil | Écart Elementor mineur | Écart connu |
| P2 | Aperçu immédiat absent pour ombres préréglées, polices, états, parties de widgets | 85–270 ms | Non traité (duplication de logique, risque de divergence) |
| P3 | Changement d'appareil = 1 rendu serveur (6–25 ms de largeur, mais rendu en plus) | Aucun enregistrement parasite ; coût serveur minime | Non traité ; à examiner si le rendu est nécessaire |
| P3 | Menus / widgets avec comportement mobile propre non audités | — | À traiter (mission suivante) |
| — | Test numérique intermittent | Fiabilité de la suite | Non reproduit ; cause inconnue |
