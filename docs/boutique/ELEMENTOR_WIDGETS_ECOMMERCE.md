# Widgets e-commerce d'Elementor / Elementor Pro et traduction pour Kolakisa

Sources : https://elementor.com/help/ (rubrique WooCommerce et Theme Builder), https://elementor.com/ecommerce/ , https://elementor.com/help/?p=1954 (widgets des modèles produits WooCommerce).
Statut de lecture : la page d'accueil de l'aide n'a pas listé les widgets et la recherche n'a confirmé que Woo Products, Add to Cart et Categories. L'inventaire ci-dessous vient de ma connaissance de l'éditeur (versions 3.x) : à revérifier dans l'éditeur Elementor Pro avant de figer un cahier des charges. Les noms de contrôles sont indicatifs.

Légende : [WC] requiert WooCommerce ; [Pro] Elementor Pro (payant). Aucun de ces widgets n'est dans Elementor gratuit (seul le Loop Grid dépend de Pro aussi). Les tiers (Woolentor, Plus Addons, Unlimited Elements) sont hors périmètre.

Contrôles transversaux (tous widgets) : onglet Avancé = marges, padding, largeur, position (absolue/fixe), z-index, ID CSS, classes CSS, effets de mouvement (scroll, souris), effets d'entrée (animation), arrière-plan, bordure, masque, responsive (masquer par appareil), attributs personnalisés, conditions d'affichage (Pro : rôle, connexion, date, URL, langue…), CSS personnalisé (Pro). Onglets Contenu / Style spécifiques ci-dessous.

## A. Widgets de catalogue (boutique, accueil, archives)

### 1. Products (Woo Products) [WC][Pro]
- Contenu : Mise en page (colonnes, lignes, pagination, nombre par page), Requête (source : Tous, Ventes, En vedette, Meilleures ventes, Mieux notés, Nouveautés, Sélection manuelle ; inclure/exclure par catégorie, étiquette, auteur, marque ; ordre, direction ; masquer en rupture ; décalage), Éléments (afficher image, titre, note, prix, bouton, étiquette promo).
- Style : espacement des colonnes/lignes, alignement, boîte (bordure, rayon, ombre, hover), image (ratio, espacement), titre (typo, couleur), note (étoiles), prix (typo, ancien prix barré), bouton (typo, états), pastille « Promo ! », pagination.
- Source de données : requête produits du site. Conditions : aucune propre ; usable dans n'importe quel modèle.
- Kolakisa : widget « Grille de produits » avec requête configurable (source, catégories, tri, nombre, pagination), choix d'éléments affichés, jetons de design.

### 2. Archive Products [WC][Pro]
- Contenu : identique à Products + « Utiliser la requête de l'archive » (suit la catégorie / étiquette / recherche en cours), message « aucun produit » personnalisé, pagination (numérotée, précédent/suivant, chargement progressif).
- Style : comme Products + message vide.
- Disponible uniquement dans les modèles Archive / Boutique (Theme Builder).
- Kolakisa : widget « Liste de produits de l'archive » + paramètre « contexte courant » ; filtres (voir F).

### 3. Product Categories (Categories) [WC][Pro]
- Contenu : source (toutes, manuelle), parent, inclure/exclure, masquer vides, ordre, colonnes, nombre ; affichage image, titre, nombre de produits.
- Style : image (taille, ratio, overlay), titre, compteur, boîte, hover.
- Kolakisa : widget « Grille de catégories » (image, titre, compteur, lien).

### 4. Loop Grid [Pro] (utilisable pour produits via Loop Item)
- Contenu : modèle de boucle (Loop Item), source (Articles, Produits, Pages, Personnalisé, Taxonomies, Relations ACF), requête (inclure/exclure, ordre), colonnes, « Équilibrer la hauteur », masonry, pagination, message vide, requête personnalisée par ID.
- Style : espacement, carte, alignement.
- Loop Item = modèle Theme Builder composé de widgets dynamiques (titre, image, prix, bouton…).
- Kolakisa : le plus important : « Grille de modèle » où l'utilisateur dessine UNE carte produit (modèle) répétée par la requête. Priorité P0 car donne la liberté de design des cartes.

### 5. Loop Carousel [Pro]
- Comme Loop Grid, plus : diapositives visibles/défilantes, flèches, points, boucle infinie, lecture automatique, vitesse, pause au survol, direction, effets.
- Kolakisa : option « Carrousel » de la grille de modèle.

### 6. Product Archive / Shop (Theme Builder) : voir section D.

## B. Widgets de fiche produit (Single Product) [WC][Pro]
Tous lisent le produit courant du modèle « Produit unique » ; en édition, un aperçu « produit d'exemple » s'affiche.

| Widget | Contenu (principaux) | Style (principaux) |
|---|---|---|
| Product Title | balise HTML (h1..p), lien | typo, couleur, ombre, mélange |
| Product Images | galerie, zoom, lightbox, miniatures (position, nombre) | bordure, rayon, espacement miniatures, pastille promo |
| Product Price | (texte alignement) | typo prix, couleur, prix barré |
| Product Rating | afficher compteur d'avis, lien vers avis, étoiles | taille étoiles, couleurs pleine/vide, texte |
| Stock Status | (aucune requête propre) | typo, couleur « en stock / rupture » |
| Product Meta | UGS (SKU), catégories, étiquettes, mise en page (empilée/en ligne), séparateur, libellés | typo libellé/valeur, couleur liens, espacement |
| Short Description | (texte) | typo, couleur, alignement |
| Product Content | contenu long (éditeur) | typo, couleur |
| Product Data Tabs | onglets (Description, Informations complémentaires, Avis) ; ordre pilotable via le modèle | style des onglets (actif/inactif), panneau, titres |
| Additional Information | table des attributs/poids/dimensions | typo, lignes zébrées, bordures |
| Add To Cart (bouton) | produit : courant ou choisi par ID, afficher quantité, texte, icône, variation (champs natifs), bouton collant | typo, couleurs, ombres, quantité, variations (sélecteurs) |
| Related Products | colonnes, nombre, ordre, titre, éléments | comme Products |
| Upsells | colonnes, nombre, ordre | comme Products |
| Product Breadcrumb (Breadcrumbs / WooCommerce Breadcrumbs) | séparateur, accueil | typo, couleur, survol |
| Product Notices (Notices) | (message) | typo notice succès/erreur/info |
| Product Navigation / Post Navigation | produit précédent/suivant | typo |

Données : produit courant (titre, galerie, prix actuel et barré, note, stock, UGS, catégories, étiquettes, description courte/longue, attributs, produits liés par catégories/étiquettes, ventes additionnelles manuelles).
Conditions d'affichage : par type de produit (variable, externe...), catégorie, étiquette, stock, promo : fonction « Conditions d'affichage » du widget Pro (Avancé) et conditions du modèle.
Kolakisa : un widget par ligne ci-dessus ; les regrouper si possible (ex. « Résumé produit » avec bascules par élément) mais garder des widgets séparés pour le placement libre.

## C. Panier, paiement, compte [WC][Pro]

### Menu Cart
- Contenu : icône (panier, sac, cabas, trait), « Afficher le total » (nombre d'articles, sous-total), mini-panier (fenêtre latérale, déroulant, aucun), « Aller au panier » ; comportement au clic (ouvrir mini-panier ou page panier), ouverture automatique à l'ajout, ajout en AJAX.
- Style : icône (taille, couleur), badge (compteur : position, couleur, fond), mini-panier (largeur, fond, boutons Voir le panier / Paiement, lignes, miniatures, séparateurs), overlay.
- Données : panier en session ; rafraîchi par fragments. Kolakisa : widget « Mini-panier » (icône + compteur + tiroir) ; nécessite API panier (voir NOYAU §20).

### Cart (page panier)
- Contenu : mise en page (colonnes tableau + totaux, collé), « Mettre à jour le panier » auto ou bouton, coupon, ventes croisées, estimation livraison.
- Style : tableau (en-tête, ligne, quantité, supprimer, miniature), coupon, totaux, boutons, ventes croisées.
- Kolakisa : widget « Panier » (lignes, quantité, coupon, livraison, totaux, ventes croisées).

### Checkout
- Contenu : mise en page (une ou deux colonnes), étapes en accordéon, ajouter un coupon, titre de sections (facturation, livraison, notes, commande, paiement), textes de champs, « Passer commande ».
- Style : formulaires (champ, libellé, erreur), récapitulatif commande, méthodes de paiement, bouton, collant.
- Kolakisa : widget « Paiement » configurable (champs affichés/obligatoires, étapes).

### My Account
- Contenu : onglets du compte (Tableau de bord, Commandes, Téléchargements, Adresses, Détails du compte, Déconnexion) : renommer, masquer, ajouter des onglets personnalisés (contenu Elementor ou modèle), mise en page (verticale/horizontale).
- Style : navigation, contenu, tableaux, formulaires.
- Kolakisa : widget « Mon compte » avec sections activables et sections personnalisées.

### Purchase Summary (Résumé d'achat / « Order received »)
- Contenu : récapitulatif commande après paiement (numéro, date, e-mail, total, méthode ; produits ; adresses), message de remerciement.
- Style : typo, tableau, titres. Utilisé dans le modèle « Page de remerciement ».
- Kolakisa : widget « Récapitulatif de commande » + modèle « Merci ».

### Notices
- Messages WooCommerce (ajout au panier, coupon invalide) : style et position personnalisables. Kolakisa : zone de notifications commune (toasts) stylée par jetons.

## D. Modèles du Theme Builder [Pro]
Source : https://elementor.com/help/ (section Theme Builder), pages « Product », « Product Archive ».
Types de modèles e-commerce : Produit unique, Archive de produits (boutique, catégorie, étiquette, recherche), Boucle (Loop Item), Page de remerciement (« Purchase Summary »), Panier, Paiement, Mon compte, Panier vide (« Empty cart »), pages d'erreur 404 non spécifiques, Fenêtre surgissante (Popup) pour mini-panier, En-tête, Pied de page.
Conditions (règle Inclure/Exclure) : Produit unique -> Tous les produits, Produits de catégorie X, Produits avec étiquette Y, Produit précis, Produits par type (via requêtes), Par auteur ; Archive -> Page boutique, Toutes les archives de produits, Catégorie de produits (arbre), Étiquette, Recherche de produits, Marques ; Panier/Paiement/Compte -> Entièrement liés à la page assignée dans WooCommerce. Plusieurs modèles : priorité au plus spécifique ; ordre des conditions ; aperçu « produit de démonstration ».
Kolakisa : le repo possède déjà un Theme Builder (`src/themeBuilder/conditions.js`, `match.js`, `resolve.js` d'après le CLAUDE.md) : ajouter les types « produit », « archive boutique », « carte produit (boucle) », « panier », « paiement », « compte », « merci », avec conditions : tout / catégorie / étiquette / produit / type / marque. Ne pas dupliquer la logique des conditions, l'étendre.

## E. Autres éléments utiles
- Archive Description / Archive Title / Term description [Pro] : titre et description de la catégorie ou archive courante ; contrôles typo/couleur. Kolakisa : widgets « Titre d'archive » et « Description d'archive ».
- Product Search / Search Form [Pro] : champ avec boutons et résultats en direct (Search avancé). Kolakisa : « Recherche produits » avec suggestions.
- Product Filter (non natif Elementor dans Pro ; fourni via filtres WooCommerce blocs ou tiers) : filtres par prix, attribut, stock. Kolakisa : « Filtres de produits » P0.
- Sorting / Result count (liste « Showing 1–12 of 40 results », tri) : dans Archive Products. Kolakisa : « Compteur + tri ».
- Add to Wishlist, Compare, Quick View : tiers ; Kolakisa : modules.
- Pop-up « Added to cart », sticky add to cart : widget bouton collant.
- Dynamic Tags WooCommerce [Pro] : étiquettes dynamiques utilisables dans n'importe quel widget (prix, titre, UGS, catégorie, URL ajout au panier, image, stock, total panier). Kolakisa : « liaisons de données » produit pour tous les widgets (texte, image, lien).
- Display Conditions [Pro] : afficher selon contenu du panier, total du panier, produit... (en pratique via tags). Kolakisa : conditions « panier non vide » / « total > X » / « client connecté ».

## F. Traduction en widgets pour Kolakisa (synthèse)
P0 : grille produits (requête), carte produit (modèle de boucle), catégories, fiche produit (titre, galerie, prix, note, stock, méta, descriptions, onglets, attributs, ajout au panier avec variations, produits liés, ventes additionnelles), mini-panier, page panier, paiement, compte, résumé de commande, fil d'Ariane, notifications, titre/description d'archive, recherche, filtres, tri + compteur.
P1 : carrousel de produits, bouton collant d'ajout, mise en avant de promotion (compte à rebours), avis (liste + formulaire), liste de souhaits, vus récemment.
P2 : comparateur, aperçu rapide, constructeur de bundle, sélecteur de devise.
Chaque widget : onglets Contenu / Style / Avancé identiques au reste de Kolakisa, jetons de la charte (pas de couleur dure), conditions d'affichage réutilisant le moteur existant.
