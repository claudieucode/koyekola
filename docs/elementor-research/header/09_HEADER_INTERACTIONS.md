# 09 — Interactions de l'en-tête (recherche, compte, panier, popups, off-canvas, langues)

Sources : S2 https://elementor.com/help/search-widget/ ; S9 https://elementor.com/help/search-form-widget/ ; S3 https://elementor.com/help/off-canvas-widget/ ; S5 https://elementor.com/help/menu-cart-widget-pro ; S10 https://elementor.com/help/login-widget-pro/ ; S11 https://elementor.com/help/woocommerce-my-account-widget/ ; S25 https://elementor.com/help/?p=141 ; W4 https://elementor.com/help/popups/ (résultat de recherche, non lu en entier) ; W3 pages WPML/Polylang. Légendes : [NATIF] [PRO] [EXPÉRIMENTAL] [EXTENSION] ; NON VÉRIFIÉ.

## 1. Recherche
### 1.1 Search Form (ancien) [PRO] (S9)
- Trois skins : Classique (champ + bouton), Minimal (champ seul avec icône), Plein écran (bascule ouvrant une recherche pleine page avec overlay coloré).
- Contrôles : voir `02_HEADER_WIDGET_CATALOG.md` §8.
- États : Normal/Focus (champ), Normal/Survol (bouton, bascule).
- Résultats en direct : non mentionnés pour ce widget.
### 1.2 Search (nouveau, depuis Elementor 3.24) [PRO] (S2)
- Résultats en direct : bascule « Résultats en direct » ; modèle Loop Item créé dans le Theme Builder, sélectionné via « Choisir un modèle » ; colonnes responsive.
- Un modèle « Résultats de recherche » est requis ; sans lui, les résultats ne s'affichent pas (S2).
- Champ : placeholder, icône, autocomplétion, bouton Effacer, déclencheur d'envoi (bouton, Entrée ou les deux).
- Requête : sources Produits / Articles / Pages / Pages de destination / Boutons flottants ; filtres inclure-exclure, date, tri, nombre par page.
- Pagination des résultats : numéros, précédent/suivant, ou les deux.
- Liste des résultats : largeur = champ ou widget ou personnalisée, hauteur max, écarts.
- Délai de frappe (debounce), nombre minimal de caractères, clavier dans la liste : NON VÉRIFIÉ.
- Skins du nouveau widget : NON VÉRIFIÉ (S2 n'en parle pas).

## 2. Connexion / compte
- Widget Login [PRO] (S10) : formulaire nom d'utilisateur + mot de passe, option Se souvenir de moi, lien Mot de passe oublié, redirection après connexion, message pour utilisateur déjà connecté ; étiquettes personnalisables avec Dynamic Tags. Se connecte avec les identifiants WordPress normaux.
- Widget WooCommerce My Account [PRO + WooCommerce] (S11) : onglets du compte (verticaux ou horizontaux), tableau de bord remplaçable par un modèle.
- Usage en-tête (icône « compte » qui ouvre un panneau/popup contenant Login) : combinaison plausible avec popup ou off-canvas, non décrite dans les sources → NON VÉRIFIÉ.
- Affichage différent connecté/déconnecté : le widget Login a un « message de connexion » (S10) ; les Conditions d'affichage de l'onglet Avancé existent (S24) mais leurs paramètres exacts → NON VÉRIFIÉ.

## 3. Panier (Menu Cart) [PRO] + WooCommerce [EXTENSION] (S5 ; W1)
- Icône : Panier / Corbeille / Sac × Léger / Moyen / Plein ; indicateur Bulle ou Texte ; masquer si vide ; sous-total.
- Type : Panier latéral ou Mini panier ; ouverture au Clic ou au Survol ; position G/D.
- Contenu du panneau : icône Fermer (G/D), icône Supprimer (haut/centre/bas), Prix & Quantité (haut/bas), séparateurs, boutons Voir le panier et Paiement (haut/bas).
- Ouvrir automatiquement à l'ajout d'un produit ; mise à jour automatique via AJAX (supprimer un article sans recharger). Dépend de l'AJAX activé dans WooCommerce > Réglages > Produits.
- Réglage Elementor > Réglages > Intégrations > WooCommerce « Mini Cart template » : remplace le gabarit du thème/WooCommerce ; s'active automatiquement dès l'usage du widget ; à désactiver en cas de conflit.
- Styles : voir S5 (liste complète dans `02` §9).
- Messages : style du message de panier vide (typo, couleur, alignement).
- Compteur mis à jour en direct (fragments AJAX WooCommerce) : le fonctionnement précis n'est pas décrit → NON VÉRIFIÉ.

## 4. Off-Canvas [PRO] (S3)
- Définition : conteneur caché au chargement, affiché après une action (clic sur bouton ou image).
- Déclencheur : dans un autre élément, lien « URL personnalisée » + balise dynamique « Actions > Off Canvas », puis choix de la cible (« Off Canvas 1 », numérotés du haut vers le bas de la page).
- Position : horizontale G/D/Centre, verticale Haut/Centre/Bas ; largeur par curseur ; hauteur Ajustée au contenu ou Personnalisée.
- Animations : entrée et sortie séparées (Fondu, Zoom, Rebond, Glissement, Rotation, Attirer l'attention, Light Speed, Roll In).
- Fermeture : par défaut clic hors du widget (overlay) et touche Échap ; désactivables séparément (Empêcher la fermeture sur l'overlay / par Échap). Défilement de la page bloqué par défaut tant qu'il est ouvert, option « Désactiver le défilement de la page ».
- Overlay : activé par défaut ; fond (classique/dégradé), couleur, image.
- Mode édition : à désactiver pour fermer le widget dans l'éditeur.
- Balise HTML configurable (H1–H6, Div, Span, P).
- Prérequis : Flexbox Containers et Nested Elements. Incompatible avec les carrousels de boucle ou imbriqués.
- Focus (déplacement du focus, piège de focus, retour à l'élément déclencheur) : NON DÉCRIT → NON VÉRIFIÉ.
- Usage typique (menu mobile dans off-canvas) : non détaillé dans S3.

## 5. Popups et déclencheurs [PRO] (S25 ; W4)
- Déclencheurs (« quand », actions de l'utilisateur) : Défilement, Clic, Intention de sortie, Inactivité (S25). Détails W4 (page résultat de recherche) : Au chargement (délai en secondes), Défilement bas (en %) / haut (en pixels), Vers un élément (ID CSS requis dans l'onglet Avancé de l'élément cible), Intention de sortie (usage souris). Valeurs précises par déclencheur : seulement W4 par recherche → NON VÉRIFIÉ à la source.
- Règles avancées (conditions non liées à l'utilisateur) : nombre de visites, URL de provenance, appareil (S25). Selon W4, l'option « URL de provenance » désactive les déclencheurs et règles avancées (à confirmer).
- Conditions (« où ») : page d'accueil, tout le site, catégorie ou étiquette (S25).
- Ouverture manuelle depuis un bouton : lien du bouton (Actions > Popup) mentionné par W4, détail NON VÉRIFIÉ.
- Cas en-tête : popup de recherche, de connexion, barre d'annonce supérieure (voir §8) .

## 6. Sélecteur de langue [EXTENSION]
- Aucun widget natif Elementor. WPML : widget « Language Switcher » ajouté dans l'éditeur (W3 https://wpml.org/forums/topic/problems-with-displaying-languages-in-the-header-custom-space). Il faut traduire le modèle d'en-tête ; si l'en-tête ne change pas de langue, ouvrir le modèle, faire une petite modification, enregistrer puis compléter la traduction (W3 https://wpml.org/forums/topic/changed-the-elementor-header-style-but-not-shown-in-translations). Réglage WPML > Réglages > Traduction des types de contenu pour les modèles d'en-tête (W3).
- Polylang : extension « Connect Polylang for Elementor » (widget Language Switcher listant les langues Polylang + sélecteur flottant) (W3, https://hi.wordpress.org/plugins/?p=233315). Autres : modules tiers (The Plus Addons, TranslatePress).
- Contrôles du sélecteur (drapeaux, noms, liste/déroulant) : propres à chaque extension → NON VÉRIFIÉ.

## 7. États ouvert / fermé (récapitulatif)
- Menu : Normal / Survol / Actif (bascule et indicateurs) ; ouverture clic ou survol (S1) ; rotation de l'indicateur réglable (S1).
- Off-Canvas : ouvert/fermé, animations entrée-sortie, overlay (S3).
- Menu Cart : ouvert au clic/survol, ouverture auto (S5).
- Recherche : Normal/Focus (champ), plein écran ouvert/fermé (S9), liste de résultats en direct (S2).
- Popup : déclenché ou non, règles (S25).

## 8. Barre d'annonce (Announcement bar)
- Aucune source officielle lue. Modélisation possible : conteneur supérieur masquable (Visibilité responsive, S24) + option de fermeture mémorisée (cookie) — le mécanisme de mémorisation d'Elementor : NON VÉRIFIÉ.

## 9. Tests nécessaires pour Kolakisa
Ouverture/fermeture au clic, survol, Échap, clic extérieur ; défilement bloqué ; retour du focus au déclencheur ; plein écran de recherche (focus automatique du champ) ; résultats en direct avec 0 résultat ; panier vide/plein, ajout AJAX ; langue active et traduction du modèle ; popup avec cookie de fréquence ; tactile (pas de survol) ; lecteurs d'écran.
