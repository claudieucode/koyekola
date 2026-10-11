# Rapport de tests — 10 octobre 2026

## Nouveaux tests (tous réussis)
- `tests/images-resolutions.test.js` : **13/13** (vrai serveur, vraies routes, vrai `sharp`) — version fabriquée à la demande (vrai WebP, largeur, ratio, original octet pour octet intact, 2e accès servi) ; **version manquante refabriquée** ; repli sur l'original (image plus petite) ; largeur ou nom inventés → 404 (dont `..%2F`) ; tailles proposées (original, lot, image externe) ; widget Image enregistré / relu / **page publiée** / « original » non enregistré / valeur inconnue ignorée ; image ancienne et image externe inchangées ; adaptative (`srcset`) ; Galerie, Carrousel, Boîte d'image ; **image de fond** ; **photo de témoignage** ; **visionneuse du widget Image** ; suppression définitive retire les versions.
- `tests/images-resolutions-sans-sharp.test.js` : **1/1** — `sharp` rendu introuvable dans un processus à part : original partout, aucune taille proposée, aucune adresse de version écrite.
- `tests/images-resolutions-navigateur.test.js` : **4/4** (Chrome réel) — contrôle et tailles ; « Moyenne » charge la version 640 dans le canevas, enregistré, **même iframe** ; rechargement : choix restauré ; retour à l'original ; aucune erreur de script.
- `tests/galerie-options-navigateur.test.js` : **5/5** (Chrome réel) — validation serveur (défauts non enregistrés, valeurs inconnues ignorées, exclusions) ; page publiée (4 colonnes réelles, ratio 1,78 mesuré) ; filtres (« Tous » + étiquettes, éléments masqués, `aria-pressed`, visionneuse qui saute les images masquées) ; disposition justifiée (lignes de 160 px mesurées) ; inspecteur (disposition, hauteur, ratio, légende au survol). A révélé un défaut corrigé (la légende bloquait le clic).
- `tests/editeur-canvas-proprietes-restantes-navigateur.test.js` : 2 cas ajoutés (contour du texte : épaisseur et couleur, valeurs CSS calculées) — fichier **4/4**.

## Régression élargie : **382 tests, 381 réussis, 1 échec** puis réussi au rejeu
46 fichiers (médias, pages, widgets, inspecteur, contrôles, accordéons, formats, styles, composants, canevas vide, propriétés…), lancés après la fusion avec `origin/main` (commit `7a6f804`, Style Studio). Le seul échec : `styles-studio-navigateur` « E5 renommer et dupliquer… » (délai de 33 s dépassé, machine chargée : charge système ≈ 10) ; **le fichier passe 5/5 relancé seul**. Fichier d'une autre session, non modifié ici.

## Non exécuté / non vérifié
- **Suite complète** (≈ 4 500 tests) : non lancée (plusieurs heures sur cette machine) ; seuls les 46 fichiers voisins l'ont été.
- Galerie : responsive vérifié par le CSS (colonnes plafonnées à 2 sur téléphone) mais **pas mesuré en navigateur à 390 px**.
- Contour du texte : rendu calculé vérifié ; pas de test visuel dans l'éditeur avec jeton de couleur.
- Safari / Firefox : non testés (`pointer-events`, `aspect-ratio`, `:focus-within` sont standards mais non essayés).
- Installation de `sharp` sur Hostinger : vérifiée seulement après déploiement (voir rapport final).
