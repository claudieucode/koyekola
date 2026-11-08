# 02 — Catalogue des widgets utiles dans un en-tête Elementor

Projet Kolakisa. Recherche documentaire (aucune copie de code). Date de recherche : 2026-11-07.
Légende : [NATIF] = Elementor gratuit ; [PRO] = Elementor Pro ; [EXPÉRIMENTAL] = fonctionnalité à activer dans Elementor > Réglages > Fonctionnalités ; [EXTENSION] = plugin tiers (WPML, Polylang, WooCommerce…). « NON VÉRIFIÉ » = non lu dans une source fiable.

## Sources (numérotées, réellement lues)
- S1 https://elementor.com/help/the-menu-widget/ (widget Menu, lu à l'offset 100000)
- S2 https://elementor.com/help/search-widget/ (widget Search)
- S3 https://elementor.com/help/off-canvas-widget/
- S4 https://elementor.com/help/nav-menu-widget-pro (widget « WordPress Menu »)
- S5 https://elementor.com/help/menu-cart-widget-pro
- S6 https://elementor.com/help/?p=47 (Site Logo)
- S7 https://elementor.com/help/site-title-widget-pro/
- S8 https://elementor.com/help/what-is-mega-menu
- S9 https://elementor.com/help/search-form-widget/
- S10 https://elementor.com/help/login-widget-pro/
- S11 https://elementor.com/help/woocommerce-my-account-widget/
- S12 https://elementor.com/help/button-widget/
- S13 https://elementor.com/help/icon-list-widget/
- S14 https://elementor.com/help/social-icons-widget/
- S15 https://elementor.com/help/lottie-widget/
- S16 https://elementor.com/help/heading-widget/
- S17 https://elementor.com/help/image-widget/
- S18 https://elementor.com/help/icon-widget/
- S19 https://elementor.com/help/divider-widget/
- S20 https://elementor.com/help/spacer-widget/
- S21 https://elementor.com/help/html-widget/
- S22 https://elementor.com/help/shortcode-widget/
- S23 https://elementor.com/help/video-widget/
- S24 https://elementor.com/help/advanced-tab/ (onglet Avancé commun)
- S25 https://elementor.com/help/?p=141 (popups : déclencheurs, règles avancées)
- W1 recherche web « Menu Cart » (résultat officiel https://elementor.com/help/menu-cart-widget-pro : cases Mini Cart, AJAX)
- W2 recherche web Site Identity https://elementor.com/help/site-identity/
- W3 recherche web langues (WPML / Polylang, pages tierces)

URLs devenues des redirections vers la page d'accueil (donc non exploitables) : /help/site-logo-widget/, /help/nav-menu-widget/, /help/menu-cart-widget/, /help/login-widget/, /help/countdown(-widget)/, /help/popup-triggers/, /help/sticky-header/, /help/sticky-effects/.

## Onglet Avancé commun à tous les widgets (S24, https://elementor.com/help/advanced-tab/)
Chaque chapitre ci-dessous renvoie à cette section pour l'onglet Avancé (les articles de widget ne l'énumèrent pas).
- Disposition : Marge, Remplissage (px/em/rem/%, 4 côtés, négatifs permis pour la marge), Largeur (Auto, Pleine largeur, En ligne (Auto), Personnalisée en px/%/vw), Aligner soi-même (début, centre, fin, base, étirer), Ordre (flex), Taille (Aucune, Grandir, Rétrécir, Personnalisée avec Flex Grow/Shrink), Position (Défaut, Absolue, Fixe + orientation horizontale/verticale début/fin et décalages), Z-index, ID CSS, Classes CSS, Conditions d'affichage.
- Effets de mouvement : Effets de défilement [PRO], Effets de souris, Sticky (fixation) [PRO], Animation d'entrée.
- Transformation : Rotation, Décalage, Échelle, Inclinaison, Retourner H/V.
- Arrière-plan (Normal/Survol : classique ou dégradé), Bordure (Normal/Survol : type, rayon, ombre), Masque (forme prédéfinie ou SVG, taille Ajuster/Remplir/Personnalisé, position, répétition).
- Visibilité responsive : Masquer sur Bureau / Tablette portrait / Mobile portrait.
- Attributs personnalisés [PRO] (format attribut=valeur) ; CSS personnalisé [PRO].
- Détails des paramètres Sticky (décalage, effets, rester dans la colonne) : NON VÉRIFIÉ (articles sticky inaccessibles).

Gabarit par widget : utilité / comportement / contenu / style / avancé / interactions / responsive / animations / survol-clic / dépendances / limites / cas particuliers / tests nécessaires.

---

## 1. Site Logo [NATIF] (S6)
- Utilité : affiche le logo défini dans Identité du site (ou Personnaliser WordPress). Widget dynamique, le logo ne se change pas dans le widget.
- Comportement : bouton gris « Change Site Logo » renvoie vers les réglages d'identité.
- Contenu : Résolution d'image (miniature … Full ou personnalisée) ; Légende (Aucune / Légende de la pièce jointe) ; Lien (Aucun / Fichier média [lightbox Défaut/Oui/Non] / URL personnalisée [nouvelle fenêtre, nofollow, attributs personnalisés « clé|valeur,… »] / URL du site — S6).
- Style : Alignement (G/C/D) ; Largeur (px, em, rem, %, vw) ; Largeur max (%) ; Hauteur + Ajustement de l'objet (Remplir, Couvrir, Contenir) ; Normal : Opacité, Filtres CSS (flou, luminosité, contraste, saturation) ; Survol : Opacité, Filtres CSS, Durée de transition, Animation au survol ; Bordure (aucune, solide, double, pointillée, tirets, rainure), Rayon, Ombre.
- Avancé : voir S24.
- Interactions/survol-clic : lien ou lightbox ; animation survol.
- Responsive : valeurs par appareil (principe général Elementor ; détail par contrôle NON VÉRIFIÉ).
- Dépendances : un logo doit exister dans l'identité du site.
- Limites : pas de logo alternatif (mobile/sticky/transparent) mentionné dans la source : NON VÉRIFIÉ.
- Cas particuliers : logo absent = widget vide.
- Tests : logo SVG/PNG, retina, lien accueil, lightbox, hauteur fixe + object-fit, hover.

## 2. Site Title [PRO] (S7)
- Utilité : titre du site, lien vers l'accueil.
- Contenu : Titre (auto depuis l'identité du site) avec option Avancé « Avant / Après / Texte de repli » ; Lien (auto, ⚙ nouvelle fenêtre / nofollow) ; Balise HTML (H1–H6, Div, Span, Paragraphe).
- Style : Alignement (gauche, droite, centre, justifié) ; Couleur ; Typographie ; Contour du texte ; Ombre du texte ; Mode de fusion.
- Avancé : S24. Dépendances : Pro (Theme Builder). Limites : survol de couleur non listé (NON VÉRIFIÉ).
- Cas particuliers : ne pas utiliser H1 dans l'en-tête si la page a déjà un H1 (bonne pratique, non issue de la source).
- Tests : lien, balise, texte avant/après, repli.

## 3. Site Tagline [PRO / NON VÉRIFIÉ]
- Aucune page officielle « Site Tagline » trouvée (W2 : le slogan se règle dans Identité du site ; un widget Tagline existe chez des extensions tierces comme HappyAddons [EXTENSION]). Pratique usuelle : widget Titre/Heading avec balise dynamique « Site Tagline » (Dynamic Tags, existence de cette balise : NON VÉRIFIÉ ici).
- Tests : à définir après vérification.

## 4. Menu (Mega Menu) [PRO] [EXPÉRIMENTAL] (S1, S8)
Détail complet dans `08_HEADER_MENUS_AND_MEGA_MENUS.md`. Résumé : éléments avec titre, lien, contenu déroulant (conteneur), icône, ID CSS ; disposition Horizontal/Liste déroulante ; ouverture au clic/survol ; point de rupture Mobile/Tablette/Aucun ; bouton bascule.
- Dépendances : activer les expériences Flexbox Containers, Nested Elements, Menu ; elles remplacent le widget Nav Menu par « WordPress Menu » + « Menu » (S1, S8).

## 5. WordPress Menu (ex-Nav Menu) [PRO] (S4)
Détail dans `08`. Contenu : Menu (Apparence > Menus), Disposition (Horizontal, Vertical, Liste déroulante), Alignement (Gauche, Centre, Droite, Justifié), Pointeur (Aucun, Souligné, Double ligne, Encadré, Arrière-plan, Texte), Animation (Fondu, Glisser, Agrandir, Chute, Remontée, Aucune), Indicateur de sous-menu (Aucun, Classique, Chevron, Angle, Plus) ; Menu mobile : Point de rupture, Pleine largeur, Alignement du texte (Latéral/Centre), Bouton bascule, Icône (états Normal/Survol/Actif, SVG si activé), Alignement du bouton.

## 6. Off-Canvas [PRO] (S3)
Détail dans `09`. Contenu : Mode édition ; Position horizontale (G/D/Centre) et verticale (Haut/Centre/Bas) ; Largeur ; Hauteur (Ajusté au contenu / Personnalisée) ; Animation d'entrée et de sortie (Fondu, Zoom, Rebond, Glissement, Rotation, Attirer l'attention, Light Speed, Roll In) ; Interactions (Empêcher la fermeture sur l'overlay, Empêcher la fermeture par Échap, Désactiver le défilement de la page) ; Balise HTML (H1–H6, Div, Span, P). Style : Conteneur (fond, bordure, rayon, ombre), Overlay (activé par défaut ; fond, couleur, image).
- Dépendances : Flexbox Containers + Nested Elements actifs. Limites : pas utilisable dans carrousels de boucle ni carrousels imbriqués (S3). Gestion du focus : NON DÉCRIT dans S3.

## 7. Search (nouveau) [PRO] (S2)
- Utilité : champ de recherche avec résultats en direct via Loop Item. Introduit en Elementor 3.24 (avant : Search Form).
- Prérequis : modèle « Résultats de recherche » ; pour Résultats en direct, un modèle Loop Item.
- Contenu : Champ (Placeholder ; Icône ; Autocomplétion afficher/masquer ; Effacer : icône ou aucune ; Envoi : Déclencheur Bouton / Touche Entrée / Les deux, Texte, Icône) ; Résultats (Résultats en direct afficher/masquer ; modèle ; Colonnes responsive) ; Requête (Source : Produits, Articles, Pages, Pages de destination, Boutons flottants ; Inclure/Exclure ; Inclure par/Exclure par ; Date ; Ordre par ; Ordre DESC/ASC ; Articles par page ; ID de requête) ; Pagination (Numéros avec « Raccourcir » et limite ; Précédent/Suivant avec libellés ; Numéros + Précédent/Suivant).
- Style : Champ (typo, couleur de placeholder, Normal/Focus, fond, couleur texte et icône, bordure type/couleur/largeur, ombre, rayon, remplissage, écart champ-bouton) ; Effacer (taille, Normal/Survol, couleur) ; Bouton d'envoi (typo, Normal/Survol, texte, fond, bordure, ombre, rayon, remplissage) ; Résultats (fond, bordure, ombre, rayon, remplissage, distance du champ, largeur du menu : champ ou widget, largeur perso, hauteur max, écarts colonnes/lignes) ; Pagination (alignement, position verticale, typo, couleurs Normal/Survol/Actif, espacement).
- Astuce hauteur : mettre le remplissage haut/bas du bouton à 0 puis régler celui du champ (S2).
- Skins du nouveau Search : article S2 « ne couvre pas les skins ».

## 8. Search Form [PRO] (S9)
- Skins : Classique (champ + bouton), Minimal (champ seul), Plein écran (bascule qui ouvre un formulaire pleine page).
- Contenu : Skin ; Placeholder ; Bouton (Classique : type icône/texte, taille) ; Bascule (Plein écran : alignement G/D/C, taille).
- Style : Classique/Champ : typo, Normal/Focus, fond, bordure, ombre, largeur et rayon de bordure ; Classique/Bouton : Normal/Survol, couleur texte, taille icône, largeur ; Minimal : taille icône, typo, couleur, fond, bordure, ombre, rayon ; Plein écran : couleur de l'overlay, typo, Normal/Focus, couleurs, bordure ; Bascule : Normal/Survol, couleur, fond, taille icône, bordure, rayon.
- Dépendance : [PRO] (statut Pro du widget : NON VÉRIFIÉ dans la source, classé Pro par usage). Remplacé par Search (S2) à partir de 3.24.

## 9. Menu Cart [PRO] + WooCommerce [EXTENSION] (S5)
Détail dans `09`. Contenu Icône : Panier / Corbeille / Sac en Léger / Moyen / Plein ; Indicateur d'articles (Aucun, Bulle, Texte) ; Masquer si vide ; Sous-total ; Alignement. Panier : Type (Panier latéral ou Mini panier), Ouvrir (clic/survol), Position (G/D), icône Fermer (afficher, position), icône Supprimer (position haut/centre/bas), Prix & Quantité (position haut/bas), Séparateurs, boutons Voir le panier / Paiement (position haut/bas). Options : Ouvrir automatiquement, Mettre à jour automatiquement (AJAX). Style complet : voir S5 (icône N/S, indicateur, overlay, fermer, supprimer, sous-total, produits, séparateurs, boutons, messages).
- Dépendances : WooCommerce actif ; AJAX activé (WooCommerce > Réglages > Produits) pour l'ouverture auto ; réglage Elementor > Réglages > Intégrations > WooCommerce « Mini Cart template » (activé automatiquement à la première utilisation).

## 10. WooCommerce My Account [PRO] + WooCommerce [EXTENSION] (S11)
- Contenu : Onglets (disposition verticale/horizontale, espacement, noms, alignement) ; Personnaliser le tableau de bord (modèle de zone de contenu, bascule, balises dynamiques).
- Style : Onglets (typo, fond Normal/Survol/Actif, image de fond, ombre, couleur, bordure, rayon, remplissage, séparateurs) ; Sections ; Typographie (titres, texte, messages de connexion, cases à cocher, liens N/S) ; Formulaires (écarts, étiquettes, champs, bouton) ; Détails de commande (titres/totaux, articles, lien produit, séparateurs, boutons).
- Cas d'en-tête : en pratique on met plutôt une icône avec lien vers la page Mon compte ; usage direct du widget dans un en-tête : NON VÉRIFIÉ.

## 11. Login [PRO] (S10)
- Contenu : champs (étiquette afficher/masquer, taille) ; bouton (texte avec Dynamic Tags, taille, alignement) ; options (Redirection après connexion, Mot de passe oublié, Se souvenir de moi, Message connecté, étiquettes personnalisées nom/mot de passe).
- Style : Formulaire (écart de lignes, couleur et survol des liens) ; Étiquette ; Champs (texte, typo, fond, bordure, rayon) ; Bouton Normal/Survol (texte, typo, fond, durée de transition, bordure, rayon, remplissage) ; Message connecté (couleur, typo).

## 12. Author / User info (balises dynamiques) [PRO]
- Widget « Author Box » : NON VÉRIFIÉ. Informations utilisateur via Dynamic Tags : NON VÉRIFIÉ (aucune page officielle lue). L'image du widget Image peut recevoir la photo de profil de l'auteur par balise dynamique (S17).

## 13. Button [NATIF] (S12)
- Contenu : Type (Défaut, Info, Succès, Avertissement, Danger) ; Texte ; Lien (nouvelle fenêtre, nofollow) ; Icône (bibliothèque ou SVG) ; Position de l'icône (avant/après) ; Espacement ; ID du bouton (suivi analytique).
- Style : Alignement (G/C/D/justifié) ; Typo ; Ombre du texte ; Normal : couleur texte, fond ; Survol : couleur texte, fond, Animation au survol, Durée de transition ; Bordure (type, largeur, couleur) ; Rayon ; Ombre ; Remplissage.
- Usage en-tête : CTA ; déclencheur de popup / off-canvas via lien dynamique (voir `09`).

## 14. Icon [NATIF] (S18)
- Contenu : Icône (Font Awesome, SVG pour Empilé/Encadré) ; Vue (Défaut, Empilé, Encadré) ; Forme (Cercle, Carré) ; Lien ; Alignement.
- Style : Normal : couleur primaire (et secondaire pour empilé/encadré), taille (+ « Fit to Size » pour SVG), rotation, remplissage, rayon ; Survol : couleurs, Animation au survol (Grow, Pulse, Skew…), taille, rotation, etc.

## 15. Icon List [NATIF] (S13)
- Contenu : Disposition (Défaut vertical / En ligne) ; éléments (texte, icône bibliothèque ou SVG, lien avec options, données dynamiques) ; Appliquer le lien sur (Pleine largeur / En ligne).
- Style : Espace entre éléments ; Alignement ; Séparateur (style solide/double/pointillé/tirets, épaisseur, largeur, couleur) ; Icône (couleur N/S, durée de transition, taille, écart, alignement H/V, ajustement vertical) ; Texte (typo, ombre, couleur N/S, durée).
- Usage en-tête : barre supérieure (téléphone, e-mail, adresse), liens utilitaires.

## 16. Heading [NATIF] (S16)
- Contenu : Titre, Lien, Balise HTML (H1–H6, Div, Span, P ; le changement de balise ne change pas le style par défaut).
- Style : Alignement ; Couleur ; Typo ; Contour ; Ombre ; Mode de fusion.

## 17. Image [NATIF] (S17)
- Contenu : Image (dynamique : image mise en avant, logo du site, photo de l'auteur) ; Résolution ; Alignement ; Légende ; Lien (Fichier média + lightbox, URL personnalisée).
- Style : Largeur, Largeur max, Hauteur + Object Fit ; Normal : opacité, filtres ; Survol : durée, animation ; Bordure, rayon, ombre.

## 18. Social Icons [NATIF] (S14)
- Contenu : répéteur (icône, lien dynamique possible, couleur : officielle ou personnalisée) ; Forme (Arrondi, Carré, Cercle) ; Colonnes (Auto, 1 à 6) ; Alignement.
- Style : Icône (couleur, taille, remplissage, espacement, écart des lignes, bordure, rayon) ; Survol (couleur primaire/secondaire, animation).

## 19. Divider [NATIF] (S19)
- Contenu : Style (solide, ondulé, etc., motifs), Largeur 0–100 %, Alignement, Ajouter élément (Aucun, Texte, Icône).
- Style : Couleur, Taille (1–100), Quantité, Écart (1–50) ; Texte (couleur, typo, position, espacement) ; Icône (vues Défaut/Empilé/Encadré avec taille, couleurs, position, espacement, rotation, bordure, rayon).

## 20. Spacer [NATIF] (S20)
- Contenu : espace vertical par curseur (px, em, rem, %, vw, vh). Avancé : S24.

## 21. HTML [NATIF] (S21)
- Contenu : zone de code (HTML, CSS, shortcodes, JavaScript), détection d'erreurs, panneau redimensionnable. Accès limité aux administrateurs par défaut (Role Manager pour changer). Aide IA (certaines fonctions Pro).
- Risque : exécution de code arbitraire ; prévoir assainissement dans Kolakisa.

## 22. Shortcode [NATIF] (S22)
- Contenu : une zone « shortcode » dont le rendu apparaît dans l'éditeur. Avancé : CSS personnalisé pour styler le rendu.

## 23. Lottie [PRO / NON VÉRIFIÉ] (S15)
- Contenu : Source (URL externe ou fichier .json) ; Alignement ; Légende ; Lien ; Déclencheur (Fenêtre d'affichage, Au clic, Au survol [zone : animation, colonne, section, conteneur ; sortie du survol], Défilement, Aucun) ; Boucle (Défaut, Pause, Inverse) ; Vitesse ; Points de début/fin ; Inverser ; Moteur de rendu (SVG, Canvas) ; Chargement différé.
- Style : Largeur, Largeur max, Normal/Survol (durée de transition), Opacité, Filtres CSS (flou, luminosité, contraste, saturation, teinte).
- Statut de licence : non indiqué dans l'extrait.

## 24. Video [NATIF] (S23)
- Contenu : Source (YouTube, Vimeo, Dailymotion, VideoPress, Auto-hébergée) avec options par source (début/fin, lecture auto [y compris mobile pour YouTube], muet, boucle, contrôles, sous-titres, mode confidentialité, chargement différé, vidéos suggérées, intro titre/portrait/signature, couleur des contrôles, bouton de téléchargement [Chrome], préchargement Meta/Auto/Aucun, affiche) ; Superposition d'image (image, résolution, icône de lecture, lightbox).
- Style : Format (1:1, 4:3, 16:9…), filtres CSS ; superposition (couleur, taille, ombre de l'icône).
- Usage en-tête : rare (vidéo d'arrière-plan = fonction du conteneur, NON VÉRIFIÉ ici).

## 25. Hamburger / Toggle menu
- N'existe pas comme widget autonome : c'est le « Bouton bascule » du WordPress Menu (S4) et le « Menu Toggle » du Menu (S1). Détails dans `08`.

## 26. Sélecteur de langue [EXTENSION]
- Pas de widget Elementor natif. Via WPML (widget « Language Switcher » dans l'éditeur, W3 https://wpml.org/forums/topic/problems-with-displaying-languages-in-the-header-custom-space) ou Polylang (extension « Connect Polylang for Elementor » : widget et sélecteur flottant, W3). Les modèles d'en-tête doivent être traduits (W3, https://wpml.org/documentation/plugins-compatibility/elementor/). Détails dans `09`.

## 27. Barre d'annonce [NON VÉRIFIÉ]
- Aucune source officielle trouvée sur un widget « Announcement bar ». Approche équivalente : conteneur en haut de l'en-tête (Heading/Icon List + bouton) ou popup en barre supérieure déclenchée par les règles de S25. À vérifier.

## 28. Popup triggers [PRO] (S25, https://elementor.com/help/?p=141 ; W4 https://elementor.com/help/popups/)
Voir `09`.

## 29. Countdown [PRO / NON VÉRIFIÉ]
- Page officielle non accessible (redirigée vers l'accueil). Aucun contrôle documenté ici : NON VÉRIFIÉ.

## 30. Loop
- Pertinent pour l'en-tête uniquement via le Search (résultats en direct avec Loop Item, S2) ; carrousels de boucle exclus pour Off-Canvas (S3).

## 31. Dynamic Tags utilisables dans un en-tête
- Confirmés par les sources : titre du site, logo du site (Image : S17), photo de l'auteur (S17), texte de bouton / étiquettes de Login via Dynamic Tags (S10), liens des Social Icons (S14), texte et lien d'Icon List (S13), Actions > Off Canvas (S3). Panier, infos utilisateur : NON VÉRIFIÉ (pas de page de balises lue).

## Synthèse des tests nécessaires pour Kolakisa
Chaque contrôle listé : valeur par défaut, rendu responsive (3 points de rupture Elementor : mobile 767 px, tablette 1024 px, selon S1), états normal/survol/focus/actif, clavier (Tab, Entrée, Échap), absence de dépendance manquante (WooCommerce, extension de langue), assainissement du HTML/shortcode.
