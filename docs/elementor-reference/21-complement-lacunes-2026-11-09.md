# Complément Elementor (lecture du 9 nov. 2026)

Légende : **lu** = corps de l'article récupéré via WebFetch (décalage 100 000 caractères quand utile) ; **recherche** = extrait de résultat WebSearch seulement ; **non vérifié** = rien trouvé.
Version constatée : changelog Pro https://elementor.com/pro/changelog/ (lu, 100 000 premiers caractères) : dernière ligne **4.4.0 du 2026-11-09**, puis 4.3.6 (11-02), 4.3.5 (10-13), 4.3.4 (10-05), 4.3.3 (09-30). Version du noyau gratuit : non constatée.

## 1. Navigator (« Structure »)  — lu
Source : https://elementor.com/help/navigator/ (titre « Use page structure to navigate your page », màj 30 nov. 2025).
- Utilité : arbre de la page ; utile pour pages longues, éléments cachés derrière d'autres (z-index, marges négatives, position absolue).
- Interface : clic droit > Structure, icône Structure de la barre du haut, Ctrl/Cmd+I. Clic sur un élément = ouvre son panneau. Glisser-déposer pour réordonner. Flèches pour déplier/replier un élément ou tout. Double-clic sur le nom = renommer. Fenêtre flottante ou ancrée sur le côté. Œil = masquer/afficher **dans l'éditeur seulement** (pas sur le site publié). Clic droit = menu contextuel habituel (modifier, dupliquer, copier, coller...).
- Repère : barre noire à droite des éléments ayant conditions d'affichage, effets de mouvement, position absolue ou CSS personnalisé.
- IA : les utilisateurs d'Elementor AI peuvent nommer les éléments par IA.
- Verrouillage : l'article n'en parle pas. Gratuit/Pro : non indiqué.

## 2. Finder — lu
Source : https://elementor.com/help/the-finder/
- Barre de recherche : Cmd/Ctrl+E, ou menu hamburger. Trouve pages, articles, modèles (autocomplétion) et zones : Modèles, Gestionnaire de rôles, Base de connaissances, Réglages généraux/avancés, Intégrations, Outils, Contrôle de version, Mode maintenance, Tableau de bord WP, accueil.
- Création : taper « Post », « Page », « Template », « Product » propose d'en créer un. Extensible par développeurs (https://developers.elementor.com/docs/finder/ : recherche seulement). Pro/version : non indiqué. Rôles non-admin : un fil de forum ancien (3.3.1) dit réservé aux administrateurs (recherche, à revérifier).

## 3. Responsive Mode / breakpoints personnalisés — lu
Source : https://elementor.com/help/mobile-editing/
- Trois vues par défaut : ordinateur > 1024 px, tablette 767-1024, mobile < 767. Sélecteur d'appareil en barre du haut (les points de rupture ajoutés y apparaissent) ; poignées gauche/droite/bas pour redimensionner la vue hors ordinateur.
- Réglages avec petite icône d'appareil ; recommandation : choisir l'appareil dans la barre avant d'éditer. Édition « descendante » : une valeur d'un écran large se propage aux plus étroits sauf surcharge.
- Points de rupture personnalisés : Réglages du site > Réglages > Mise en page > Points de rupture ; « + » sous Points actifs, **six options** proposées (ex. tablette portrait) ; modifier le px puis Enregistrer ; suppression par X ; les deux par défaut ne se suppriment pas. Autres appareils cités : écran large, tablette paysage, mobile paysage.
- Non indiqué par l'article : Pro ou gratuit, plafond du nombre, mobile-first/desktop-first nommés. Éditeur V4 : icône « Responsive Mode » dans la barre du haut (recherche seulement, non lu).

## 4. Ordre responsive (Order) — lu
Source : https://elementor.com/help/advanced-widget-settings-order/
- Onglet Avancé de tout conteneur/widget : Début, Fin ou Personnalisé (nombre). Utile avec les points de rupture (ex. recentrer un logo, inverser menu et panier sans doublon caché). Astuce : définir l'ordre des autres éléments aussi, commencer par le dernier.
- Non indiqué : comportement par appareil, flex requis, Pro/gratuit. Recherche (non lue) : pour inverser des colonnes sur mobile, passer en mode responsive et utiliser la direction « inversée » du conteneur parent (https://elementor.com/help/how-to-resolve-common-mobile-layout-issues-in-elementor/).

## 5. Copier / coller des éléments et des styles — lu (partiel)
Source : https://elementor.com/help/right-click/
- Copier (conteneur, widget, section, colonne ; « Copier tout le contenu » pour la page). **Coller le style** : applique l'apparence seulement, sans changer le contenu. **Coller depuis un autre site** (recherche, blog 3.11 : exige 3.11+ des deux côtés, images/vidéos locales non transférées). Raccourci Ctrl/Cmd+Maj+V (déjà dans 01). Pro/gratuit : non indiqué. Verrouillage : l'article n'en parle pas.

## 6. Verrouillage / masquage d'éléments
- Masquage dans l'éditeur : lu (Navigator, § 1).
- Masquage par appareil : déjà couvert (07 / Avancé > Responsive).
- **Verrouillage d'élément : non vérifié** (aucune page lue ne l'évoque ; le Navigator et le menu contextuel n'en parlent pas).

## 7. Conteneur Grid (éditeur classique) — lu
Sources : https://elementor.com/help/grid-container-layout-options/ (étiquette Version 3.13, màj 19 janv. 2025) ; https://elementor.com/help/create-a-grid-container/ (màj 31 août 2025).
- Création : « + » sur le canevas > Grid, ou Type de conteneur Grid dans l'onglet Mise en page (défaut Flexbox ; passage Flexbox > Grid donne 3x2).
- Réglages : largeur du contenu (encadré/pleine), hauteur min ; **Éléments** : contour de grille (afficher par défaut/masquer), Colonnes et Lignes (curseur ; unité FR par défaut ; mode personnalisé PX/EM/REM ou propriétés CSS, ex. « 200PX 1FR 400PX »), Écarts, Flux automatique (Ligne : gauche à droite puis ligne suivante / Colonne : haut en bas), Justifier/Aligner les éléments, Justifier le contenu (visible seulement si colonnes personnalisées plus étroites que le conteneur), Aligner le contenu (idem pour lignes).
- Limites : une seule cellule = un seul élément (mettre un conteneur dedans pour plus) ; les cellules s'ajustent aux images. Étendue colonnes/lignes ajoutée en 3.27 (résultat de recherche, blog non lu).
- Responsive : non décrit par l'article. Gratuit/Pro : non indiqué.

## 8. Éditeur V4 atomique — Grille CSS — lu
Source : https://elementor.com/help/how-to-use-css-grid-in-the-atomic-editor/ : activer l'éditeur atomique (Elementor > Éditeur > Réglages, carte Atomic Editor) ; pistes explicites avec n'importe quelle unité dont fr ; colonnes, lignes, écarts, flux auto, contour de grille (éditeur seulement) ; enfants : Grid Column/Row (étendue), Align Self, Order ; placement dense ; compatible Classes et Variables ; conversion d'un Flex atomique en Grid possible. L'article dit disponible en version gratuite.
Contradiction à noter : la FAQ V4 (ci-dessous) dit encore « Grid et Loop pas encore atomiques » alors que cette page de grille atomique existe : la FAQ est en retard sur ce point.

## 9. Position absolue / fixe / sticky, z-index, débordement
- V3 absolue : https://elementor.com/help/how-to-set-absolute-position-for-an-element/ (lu) : Avancé > Positionnement personnalisé > crayon > Absolu ; glisser ou saisir Décalage horizontal/vertical ; orientation Début/Fin par axe ; relatif au premier parent positionné, sinon la page ; réglable par appareil ; « pas la méthode recommandée » pour la mise en page.
- V3 conteneur : https://elementor.com/help/container-advanced-tab-settings/ (lu, extrait) : Position Défaut / Absolu (parent positionné) / Fixe (fenêtre), décalages H/V ; Z-Index ; ID et classes CSS (sans # ni .) ; marge latérale d'un conteneur de premier niveau = barre de défilement horizontale ; Align Self ; Order ; Size (grow/shrink). Marqueur noir dans Structure.
- V4 : https://elementor.com/help/style-tab-position/ (lu) : Static (défaut), Relative, Absolute (relatif au plus proche parent Relative, sinon la page), Fixed, Sticky (reste dans son parent ; remplace l'ancien sticky JavaScript par le CSS sticky, qui **échoue si le parent a Overflow hidden**). Décalages haut/bas/gauche/droite, au moins un renseigné (0 valide) ; pour l'absolu utiliser top/left, pas les marges. « Décalage d'ancre » (ex. 120) pour liens d'ancre sous un en-tête collant. Z-index cité en conseil : Absolute + Z-index >= 1.
- Z-index : https://elementor.com/help/my-widget-is-being-covered-up-by-something-else/ (lu) : V3 Avancé > Mise en page > Z-Index ; V4 Style > Position > Z-Index ; si sans effet, régler le parent (contexte d'empilement) ; vérifier marges négatives, effets de mouvement (V3 Avancé > Effets de mouvement ; V4 onglet Interactions), CSS perso.
- Débordement : V3 conteneur Défaut / Caché / Auto (déjà dans 02, article container-layout-tab-settings). V4 : options renvoyées à « Style tab – Size » : **non lu**. Pro/gratuit : non indiqué.

## 10. Nav Menu (« WordPress Menu ») — lu
Source : https://elementor.com/help/nav-menu-widget-pro/ (titre « Nav Menu Widget (Pro) », étiqueté Pro dans la métadonnée ; le texte ne le confirme pas explicitement).
- Affiche un menu créé dans Apparence > Menus. Contenu : Menu, Disposition (Horizontal/Vertical/Dropdown), Alignement (gauche/centre/droite/justifié), Pointeur (aucun, soulignement, double ligne, encadré, fond, texte), Animation (fondu, glissement, grandissement, drop in/out, aucune), Indicateur de sous-menu (aucun, classique, chevron, angle, plus). Menu déroulant mobile : point de rupture (mobile/tablette/aucun), pleine largeur, alignement du texte, bouton bascule (icônes Normal/Survol/Actif, SVG), alignement du bouton.
- Style : typo, couleurs, pointeur, séparateurs, paddings, espacement ; menu déroulant (texte, fond, bordure, ombre, séparateur) ; bouton bascule (couleur, fond, taille, bordure).
- Quand l'expérience Menu est active, le Nav Menu est remplacé par deux widgets : WordPress Menu et Menu (voir § 11).

## 11. Mega Menu (widget Menu) — lu
Sources : https://elementor.com/help/the-menu-widget/ ; https://elementor.com/help/create-mega-menu/.
- Exige les expériences **Conteneurs flexbox, Éléments imbriqués, Menu** (article : « fonction expérimentale » ; l'article ne dit pas si ces pages ont changé depuis).
- Contenu : éléments (titre, lien, contenu déroulant, icône, ID CSS), largeur du contenu (pleine largeur / ajustée), disposition (horizontal / dropdown), position, effet (clic ou survol, durée), bouton bascule, défilement horizontal, point de rupture du menu compact (aucun, mobile portrait, tablette portrait).
- Mega menu : interrupteur « Contenu déroulant » sur un élément, puis déposer des widgets dans la zone ; liens via étiquette dynamique Site > URL interne. Aperçu seulement en prévisualisation.
- Limites : pas de Menu dans un Menu ; largeur du contenu commune à tout le menu ; position du dropdown gauche/centre/droite ; seul l'horizontal peut s'étirer en pleine largeur. Pro/gratuit : **non tranché** (métadonnées Pro/Essential/Advanced...).

## 12. Loop Grid / Loop Carousel — lu
Sources : https://elementor.com/help/loop-grid/ (màj 19 juin 2026) ; https://elementor.com/help/loop-carousel/ (étiqueté Version 3.15, màj 15 sept. 2026).
- Loop Grid : modèle d'élément obligatoire de bon type (Articles, Taxonomie d'articles, Produits, Taxonomie de produits). Mise en page : colonnes, éléments par page, maçonnerie, hauteur égale, modèle alterné. Requête : source (articles, pages, pages d'atterrissage, sélection manuelle, requête courante, éléments liés), inclure/exclure, date, masquer vides, profondeur, tri, articles épinglés, ID de requête. Pagination : numéros, précédent/suivant, les deux, charger au clic, défilement infini ; limite de pages ; rechargement ou AJAX ; pagination individuelle. Message « rien trouvé ». Style : pagination, écarts colonnes/lignes.
- Loop Carousel : mêmes modèle/requête ; nombre de diapositives, visibles, pas par flèche, hauteur égale ; autoplay (vitesse, pause survol/interaction), défilement infini, durée de transition ; flèches (icônes, SVG, position) ; pagination points / fraction / barre ; écart.
- Pro/gratuit : métadonnées Pro ; le corps ne le dit pas.

## 13. Popups — lu
Sources : https://elementor.com/help/conditions-triggers-and-advanced-rules/ ; https://elementor.com/help/popups/.
- Accès : Elementor > Éditeur > Modèles > Popups ; Publier > Conditions d'affichage. Règle de l'article « conditions-triggers » : **Pro, offre Advanced ou supérieure** avec licence active. Trois couches : Conditions (où), Déclencheurs (action utilisateur), Règles avancées (autres exigences).
- Déclencheurs (page « popups », lu) : délai au chargement, profondeur de défilement, clics, inactivité, défilement vers un élément, intention de sortie ; manuels : lien (Dynamique > Actions > Popup > Ouvrir/Fermer), action de formulaire, sélecteur CSS (ID/classe) — alors déclencheurs et règles sont ignorés. Détail des règles avancées (pages vues, sessions, plafond d'affichages, URL d'origine, connecté/rôles, appareil, éviter plusieurs popups) : **résumé de recherche** de https://elementor.com/help/conditions-triggers-and-advanced-rules/, le texte lu n'en donnait que des exemples.
- Réglages : animations d'entrée/sortie (durée en ms), voile (couleur/image/dégradé, fermeture au clic), bouton de fermeture (affichage différé, position, couleurs).
- Dépannage (recherche) : toutes les conditions/déclencheurs/règles doivent être vraies ensemble ; « masquer aux connectés » peut mal marcher avec un cache.

## 14. WooCommerce — lu (partiel)
- Fiche produit (single) : https://elementor.com/help/woocommerce-widgets-pro/ (lu) : 12 widgets — Titre, Images, Prix, Ajouter au panier, Produits liés, Stock, Méta, Description courte, Contenu, Onglets de données, Informations complémentaires, Upsell. Aucun marqué Pro individuellement ; WooCommerce Builder exige Elementor Pro 2.1+ et WooCommerce 3.4+ (article ancien). Détail de réglages par widget : non lu.
- Panier : https://elementor.com/help/woocommerce-cart-widget/ (lu) : 1 ou 2 colonnes, colonne droite collante avec décalage px, texte du bouton « Mettre à jour », coupon (masquer, texte, alignement), totaux (titre, bouton expédition, bouton paiement), mise à jour AJAX auto, modèle Theme Builder pour panier vide ; styles par section + « Personnaliser » section par section ; définir comme page panier par défaut à la publication. Article : n'indique pas explicitement Pro.
- Paiement : https://elementor.com/help/woocommerce-checkout-widget/ (lu) : 1 ou 2 colonnes (+ collante), facturation/livraison (titres, étiquettes, textes d'exemple, valeurs par défaut de chaque champ), informations complémentaires, ma commande, coupon, paiement (message CGV, alignement du bouton) ; styles sections/typo/formulaires/récapitulatif/bouton d'achat/« Personnaliser » ; fonctionne mieux avec le thème Hello. Recherche (blog https://elementor.com/blog/customize-woocommerce-checkout-page/, lu) : « fait partie d'Elementor Pro » ; remplacer le shortcode ; CGV dans Réglages du site > WooCommerce ; section « Client existant » seulement si commande invité activée.
- Mon compte : https://elementor.com/help/woocommerce-my-account-widget/ (lu) : onglets verticaux/horizontaux, espacement, renommage, alignement ; tableau de bord remplaçable par un modèle (région de contenu) ; styles onglets (normal/survol/actif), sections, typo, formulaires, détails de commande.
- Plans (recherche, non lu) : table de comparaison indiquant Menu Cart, WC Add to Cart, WC Checkout, WC My Account absents de Core/Essential. Toutes ces pages : WooCommerce doit être installé. Page-liste https://elementor.com/help/elementor-editor/online-commerce/woocommerce-widgets/ : **non lue** (retourne le menu seul).

## 15. Variables globales — lu
Sources : https://elementor.com/help/variables-manager/ (màj 12 août 2026) ; https://elementor.com/help/how-to-sync-variables-and-global-elements/.
- Types : Couleur, Police, Taille. Gestionnaire : barre du haut > trois points > Design System, ou icône variable du panneau. Créer, double-clic = modifier, menu = supprimer, appliquer via l'icône variable.
- Synchronisation : menu « … » d'une variable > Synchroniser avec Couleurs globales / Polices globales > Enregistrer ; seule la **typographie** (famille) se synchronise, pas taille/graisse/couleur ; arrêter la synchro peut changer l'apparence des widgets v3.
- Permissions/Pro : la page ne les donne pas ; résumé de recherche (index de résultats) : admins créent/modifient, autres rôles appliquent ; Tailles variables = Pro (3.32, déjà dans 15).

## 16. Classes globales — lu
Source : https://elementor.com/help/classes-in-elementor-2/
- Chaque élément a une classe locale (priorité maximale). Créer : saisir un nom dans le champ Classes > « Créer une nouvelle classe » ; convertir la locale en globale (« … » > Convertir en classe globale) ; dupliquer ; retirer. Nom rose = locale, vert = autre. Survol : menu de la locale > Survol (États : article Element States, non relu ici). Priorité entre classes non locales : Class Manager. Limites/Pro : non indiqués.

## 17. Import / export de kit — lu
Sources : https://elementor.com/help/import-and-export-elementor-website-templates/ ; https://elementor.com/help/how-to-export-and-import-variables-and-classes/ (màj 26 avr. 2026).
- Chemin : Elementor > Éditeur > Accueil > Outils > onglet « Modèles de site » > Exporter / Importer. Contenu exportable : contenu (pages, articles, CPT, menus, taxonomies, médias), modèles (en-têtes, pieds, Theme Builder, widgets globaux), réglages (polices/couleurs globales, style du thème, mise en page, lightbox, arrière-plan, expériences actives), fichiers et code personnalisés + thèmes publics, plugins au choix. Sortie : zip ou bibliothèque cloud.
- Import : cloud ou zip ; choisir plugins puis Modèles / Contenu / Réglages. Avertissement SVG et zip. « Sauvegardez avant d'importer ». Tous les plugins du kit doivent être présents.
- Offres : bibliothèque cloud = Advanced+ ; médias dans le cloud = Advanced+ ; sélection fine du contenu = Expert+ ; fichiers/code/thèmes personnalisés = Pro+.
- Classes et variables seuls : Réglages & configurations > Modifier > tout désactiver sauf Classes et Variables. Conflits : non traité (le blog développeur 4.0 évoque une « résolution de conflits », lu).
- WP-CLI (https://developers.elementor.com/docs/cli/kit-export) : seulement dans les résultats de recherche, non lu.

## 18. Éditeur V4 atomique — lu
Sources : https://elementor.com/products/website-builder/v4-faq/ (publiée 31 mars 2026, modifiée 23 août 2026) ; https://developers.elementor.com/elementor-editor-4-0-developers-update/ (19 mars 2026).
- FAQ : fonctions atomiques « stables, sûres pour la production » ; nouveaux sites en v4 par défaut depuis avril 2026 ; sites existants : activation manuelle (WP Admin > Elementor > Éditeur > Réglages > Atomic Editor) ; mélange v3 + atomique sur une page ; le noyau reste gratuit, Pro ajoute des capacités ; classes/variables natives atomiques seulement ; export/import des classes depuis 4.0 ; synchro couleurs/typographie vers les globaux v3 ; interactions et composants pris en charge ; (FAQ) Grid et Loop « pas encore atomiques » — contredit par la page grille atomique (§ 8) et par « atomic-loop » (Pro) déjà dans 04k.
- Article développeur 4.0 : Formulaires atomiques (Pro, première phase, logique conditionnelle prévue plus tard), Interactions Pro (chargement, entrée dans la vue, survol, clic ; effet personnalisé échelle/déplacement/rotation/inclinaison ; départ/fin pour défilement ; réglage par point de rupture), élément Vidéo auto-hébergée, Composants avec « Détacher », bouton à édition en ligne. L'article parle d'une **bêta** de 4.0 (mars 2026) alors que la FAQ la dit stable : formulation datée, à croiser avec le changelog.

## Resté non vérifié après cette passe
Verrouillage d'éléments ; panneau d'éléments (recherche de widgets/favoris, détaillé ailleurs seulement par favoris) ; Responsive Mode V4 (texte non lu) ; débordement V4 (Style > Size) ; liste détaillée des règles avancées de popups ; réglages détaillés des 12 widgets de fiche produit ; page-liste WooCommerce ; Pro/gratuit de Grid, Loop, Menu, Nav Menu (étiquettes de métadonnées seulement) ; commande WP-CLI kit ; version exacte du noyau gratuit.
