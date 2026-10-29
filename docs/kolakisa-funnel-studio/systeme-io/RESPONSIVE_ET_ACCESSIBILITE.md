# Responsive et accessibilité

Préfixe `H` = https://help.systeme.io/article/

## Constat

Les sources publiques lues sont quasi muettes sur ces deux sujets pour l'éditeur de pages de tunnel.

## Responsive

- L'article de présentation de l'éditeur ne traite pas de l'affichage mobile (H168-create-a-custom-page-how-systeme-io-editor-works).
- Aucune source lue ne décrit un sélecteur d'aperçu mobile/tablette dans l'éditeur de pages. À VÉRIFIER (compte gratuit : ouvrir l'éditeur, chercher les icônes d'aperçu, tester la visibilité par appareil).
- E-mails : l'éditeur visuel a une icône téléphone d'optimisation mobile et une visibilité par élément « Desktop » / « Mobile » (H367-how-to-set-up-an-email-campaign ; H1335-how-to-use-the-email-editor). Cela vaut pour les e-mails, pas pour les pages.
- Points de rupture, colonnes empilées sur mobile : non documentés. À VÉRIFIER.

## Accessibilité

- Texte alternatif des images : non documenté (H341-how-to-add-an-image-on-a-page). À VÉRIFIER.
- Navigation clavier, ordre de focus, contrastes, ARIA, lecteurs d'écran : non documentés.
- Champ « Placeholder » seul décrit pour les formulaires ; pas de réglage de libellé distinct (H1662-how-to-add-a-form-input). Cela peut poser un souci d'accessibilité des labels. À VÉRIFIER.
- SEO : titre, description, mots-clés, image sociale (H510-what-is-the-search-engine-optimisation-seo-part-for) ; sitemap (article 11336 non lu).
- Langue de page (attribut lang) : non documenté. À VÉRIFIER.
- Dans l'e-mail : mode sombre non contrôlé par systeme.io (H1335).
- Vidéo : article 624 non lu (sous-titres ?). À VÉRIFIER.

## Performance (information voisine)

- Case « Optimize uploaded images » : compression automatique (H341).
- Poids des e-mails : un e-mail lourd peut nuire à la délivrabilité (H367).
