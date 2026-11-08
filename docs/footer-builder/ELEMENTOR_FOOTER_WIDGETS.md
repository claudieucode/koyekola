# Widgets Elementor utilisables dans un footer — inventaire

Légende : **[C]** lu dans l'article officiel du widget · **[O]** déduit / usage typique de pied de page · **[N]** non vérifiable (article non lu ou silencieux) · **[K]** recommandation Kolakisa.
Chaque widget a trois onglets : **Contenu**, **Style**, **Avancé** (l'onglet Avancé est commun, décrit en §0).
Gratuit/Pro : voir ARCHITECTURE §8 (tableau de comparaison officiel [C]).

## 0. Onglet Avancé commun à (presque) tous les widgets [C]
Article `advanced-tab` + `container-advanced-tab-settings`.
* **Mise en page** : marges, remplissage (px, em, rem, %), largeur (pleine / en ligne auto / personnalisée en px, %, vw), alignement individuel (`align-self` : début, centre, fin, étirer), **ordre** (début, fin, personnalisé), **taille flex** (aucun, grandir, rétrécir, personnalisé), **position** (par défaut, absolue, fixe) avec orientation horizontale/verticale + décalage, **z-index**, ID CSS (sans « # »), classes CSS (sans « . »).
* **Display Conditions** (par élément), voir fichier Conditions.
* **Effets de mouvement** : défilement (Pro), souris (suivi, inclinaison 3D), sticky (Pro), animation d'entrée.
* **Transformation** : rotation, décalage, échelle, inclinaison, retournement H/V, état Normal/Survol avec durée. [C] « ne fonctionne que sur les widgets, pas sur sections/colonnes » (article `css-transform`, ancien).
* **Arrière-plan** (Classique ou Dégradé) et **Bordure** (type, rayon, ombre), états Normal/Survol.
* **Masque** : forme prédéfinie ou SVG personnalisé, taille (ajuster/remplir/personnalisé), position, répétition.
* **Responsive** : Masquer sur ordinateur / tablette / mobile.
* **Attributs personnalisés** (Pro, Advanced+) : `attribut|valeur`. **CSS personnalisé** (Pro, Advanced+) avec mot-clé `selector`.
* Ancre : mettre un « ID CSS » puis lien `#id`.

## 1. Identité

### 1.1 Image (gratuit) [C]
* **Contenu** : choisir l'image (médiathèque, ou étiquette dynamique : image mise en avant, logo du site, photo d'auteur) ; résolution (miniature, pleine, personnalisée) ; alignement (G/C/D) ; légende (aucune, de la médiathèque, personnalisée) ; lien (aucun, fichier média avec lightbox oui/non, URL personnalisée avec nouvelle fenêtre et nofollow) ; attributs personnalisés du lien (`clé|valeur`, virgule entre paires).
* **Style** : largeur, largeur max, hauteur + ajustement (remplir / couvrir / contenir) ; Normal : opacité, filtres CSS (flou, luminosité, contraste, saturation) ; Survol : opacité, filtres, durée de transition, animation au survol ; bordure (aucune, solide, double, pointillée, tiretée, rainurée), rayon, ombre.
* **États** : Normal / Survol. **Accessibilité** : texte alternatif pris de la médiathèque (conseillé pour le SEO et l'accessibilité) [C]. **Cas pied** : logo secondaire, badges de paiement, labels, image de partenaire.

### 1.2 Site Logo (Pro) [C]
* **Contenu** : image **tirée automatiquement** de l'Identité du site / Personnalisateur WordPress ; résolution ; légende (aucune / pièce jointe) ; lien (aucun, fichier média + lightbox, personnalisé ; URL du site = accueil).
* **Style** : alignement ; largeur (px, em, rem, %, vw) ; largeur max ; hauteur + ajustement ; Normal : opacité + filtres CSS ; Survol : opacité, filtres, durée, animation ; bordure, rayon, ombre.
* **Cas pied** : même logo que l'en-tête, version claire via filtre (luminosité/inversion) [O].

### 1.3 Site Title (Pro) [C]
* **Contenu** : titre (repris des réglages WordPress), lien (accueil), **balise HTML** (H1–H6, div, span, p).
* **Style** : alignement (G/D/C/justifié), couleur, typographie, contour du texte, ombre du texte, mode de fusion.
* **Cas pied** : nom du site si pas de logo. **Attention** : choisir `p`/`div`, jamais H1 dans un pied [O].

### 1.4 Heading / Titre (gratuit) [C]
* **Contenu** : titre, lien, balise (H1–H6, div, span, p) ; changer la balise ne change pas le style sauf si le thème/les réglages du site le définissent.
* **Style** : alignement (G/D/C/justifié), couleur, typographie, contour du texte, ombre du texte, mode de fusion.
* **Cas pied** : titres de colonnes (H3), ligne de copyright (balise `p` + étiquette dynamique) [C tutoriel].

### 1.5 Text Editor / Éditeur de texte (gratuit) [C]
* **Contenu** : texte riche (peut contenir images et **shortcodes WordPress**), lettrine (Drop Cap), colonnes (nombre), écart entre colonnes (n'apparaît qu'avec plusieurs colonnes).
* **Style** : alignement, couleur, typographie, ombre du texte ; si lettrine : vue (par défaut / empilée / encadrée), couleur, ombre, espace, rayon, typographie.
* **Cas pied** : liens (le tutoriel officiel utilise ce widget pour les listes de liens), mission, adresse, mentions légales.

## 2. Navigation

### 2.1 Nav Menu / WordPress Menu (Pro) [C]
* **Contenu** : menu choisi (Apparence > Menus) ; mise en page : **horizontale, verticale, déroulante** ; alignement (G/C/D/justifié) ; pointeur (aucun, souligné, double ligne, encadré, fond, texte) ; animation du pointeur (fondu, glissement, grossir, entrée/sortie, aucune) ; indicateur de sous-menu (aucun, classique, chevron, angle, plus) ; **point de rupture** du menu déroulant mobile (mobile, tablette, aucun) ; pleine largeur ; alignement du texte (côté/centre) ; bouton de bascule (icône normal/survol/actif, alignement G/C/D).
* **Style (menu principal)** : typographie, couleur du texte, couleur du pointeur (survol/actif), séparateur (style, largeur, hauteur, couleur), largeur du pointeur, remplissage H/V, espace entre éléments. **Déroulant** : couleurs (texte, fond), typographie, bordure, rayon, ombre, remplissage, séparateur, distance. **Bouton de bascule** : couleur, fond, taille, bordure, rayon, normal/survol.
* **États** : normal, survol, actif [C]. **Cas pied** : liens rapides ; verticale sur mobile.
* **Accessibilité** : [N] (rôle ARIA, navigation clavier non décrits).
* **Note** : un nouveau widget « Menu » (menus complexes / méga-menu) est une fonction **expérimentale** nécessitant Conteneurs + Éléments imbriqués + Menu actifs, et il *remplace* alors Nav Menu par « WordPress Menu » + « Menu » [C].

### 2.2 Icon List / Liste d'icônes (gratuit) [C]
* **Contenu** : mise en page par défaut (verticale) ou en ligne ; éléments (texte, icône, lien avec nouvelle fenêtre / nofollow) ; appliquer le lien en pleine largeur ou en ligne.
* **Style** : liste (espace entre éléments, alignement, séparateur : style plein/double/pointillé/tireté, épaisseur, largeur, couleur) ; icône (couleur normal/survol, durée, taille, écart, alignement H/V, position verticale) ; texte (typographie, ombre, couleur normal/survol, durée).
* **Cas pied** : coordonnées avec icônes (adresse, téléphone, e-mail), liens légaux.

### 2.3 Menu Anchor / Ancre de menu (gratuit) [C]
* **Contenu** : nom de l'ancre (`contact-us`) ; lien avec `#contact-us`. Le widget n'occupe pas d'espace. **Limite [C]** : ne fonctionne que sur la **même page** (pas d'une page à l'autre). Pas de style propre.
* **Cas pied** : retour en haut de page (lien `#haut`) [O] ; l'article « bouton retour en haut » existe mais son corps était vide ici → [N].

### 2.4 Search Form / Recherche (Pro) [C]
* **Contenu** : habillage **Classique** (champ + bouton), **Minimal** (champ), **Plein écran** (bascule qui ouvre une recherche plein écran) ; texte indicatif (placeholder) ; bouton : icône ou texte, taille ; bascule : alignement, taille.
* **Style** : champ (typographie, normal/focus, fond, couleur de bordure, ombre, largeur de bordure, rayon) ; bouton (couleur, taille d'icône, largeur, normal/survol) ; plein écran : couleur de recouvrement, bascule normal/survol (couleur, fond, taille, bordure, rayon).
* **États** : normal, survol, **focus** [C]. **Cas pied** : recherche dans le pied (tutoriel officiel) ; peut être remplacée par un formulaire d'abonnement [C].

### 2.5 Post Navigation (Pro) [C]
* **Contenu** : afficher les libellés précédent/suivant (texte ou étiquette dynamique), flèches (type), titre de l'article, bordures, « dans le même terme ».
* **Cas pied** : rare ; surtout dans une page article. [O] hors périmètre d'un pied.

## 3. Contenus

### 3.1 Button / Bouton (gratuit) [C]
* **Contenu** : type (défaut, info, succès, avertissement, danger), texte, lien (nouvelle fenêtre, nofollow), icône (bibliothèque ou SVG), position de l'icône, espace icône/texte, ID du bouton (suivi analytique).
* **Style** : alignement (G/C/D/justifié), typographie, ombre du texte ; Normal : couleur du texte, fond ; Survol : couleur, fond, **animation au survol**, durée de transition ; bordure (type, épaisseur, couleur), rayon, ombre, remplissage (donne la taille).
* **Cas pied** : appel à l'action (S'inscrire, Nous contacter), PDF [C : article « bouton de téléchargement PDF » existe, non lu en détail → [N]].

### 3.2 Divider / Séparateur (gratuit) [C]
* **Contenu** : style (plein, ondulé, motifs tribaux, flèches, plus…), largeur 0–100 %, alignement, élément ajouté (aucun, texte, icône).
* **Style** : trait (couleur, taille, quantité de motifs, écart au-dessus/dessous 1–50) ; texte (couleur, typographie, position G/C/D, espacement) ; icône (3 vues : défaut, empilée, encadrée ; taille, remplissage, couleurs primaire/secondaire, position, espacement, rotation 0–360, bordure, rayon).
* **Cas pied** : ligne au-dessus de la bande de copyright.

### 3.3 Spacer / Espaceur (gratuit) [C]
Espace vide réglable ; peut recevoir un **masque** (formes). **Cas pied** : écarts verticaux (préférer les « écarts » du conteneur) [O].

### 3.4 Image Box / Boîte d'image (gratuit) [C]
* **Contenu** : image, résolution, titre, description, lien (nouvelle fenêtre, nofollow), balise du titre.
* **Style** : position de l'image (gauche, haut, droite ; centrée sur mobile), alignement, espace image/contenu, espace titre/description, largeur 0–100 %, bordure, rayon ; image Normal/Survol : filtres CSS, opacité, durée ; titre (couleur, typographie, contour, ombre) ; description (couleur, typographie, ombre).
* **Cas pied** : fiches « partenaires », moyens de paiement avec légende.

### 3.5 Icon (gratuit) [C]
Icône (Font Awesome ou SVG), vue (défaut, empilée, encadrée), forme (cercle, carré), lien (nouvelle fenêtre, nofollow), alignement. Style : couleurs primaire/secondaire (normal/survol), taille, rotation, remplissage, rayon, **animation au survol** (grossir, pulsation, inclinaison…). SVG non carré : activer « Fit to size ».

### 3.6 Icon Box / Boîte d'icône (gratuit) [C]
Contenu : icône, vue (défaut/empilée/encadrée), titre, description, lien, balise du titre. Style : position de l'icône (gauche/haut/droite), alignement, espaces, couleur primaire, taille, rotation, survol (couleur, animation), titre et description (couleur, typographie, ombre, contour).
**Cas pied** : trois arguments « Livraison / Paiement sécurisé / Support ».

### 3.7 Testimonial / Témoignage (gratuit) [C]
Contenu : texte, image, résolution, nom, titre/fonction, lien, position de l'image, alignement. Style : texte (couleur, typographie, ombre), image (taille, bordure type/largeur/couleur, rayon), nom et titre (couleur, typographie, ombre). **Cas pied** : citation courte.

### 3.8 Counter / Compteur (gratuit) [C]
Contenu : nombre de départ, de fin, préfixe, suffixe, **durée de l'animation (ms)**, séparateur de milliers (défaut, point, espace), titre, balise du titre. Style : position du titre (dessus, dessous, droite, gauche), alignement, écart, position du nombre (G/C/D/étirer), couleur, typographie, contour, ombre. **Cas pied** : chiffres clés. **Animation** : le comptage se déclenche au défilement [O].

### 3.9 Progress Bar (gratuit) [C]
Titre, balise, pourcentage, afficher le pourcentage, texte interne. Style : couleur de barre, fond, couleur du texte interne, titre. **Cas pied** : rare.

### 3.10 Tabs / Onglets (gratuit) [C]
Contenu : éléments (titre, contenu), position horizontale/verticale, alignement (début, centre, fin, étirer). Style : bordure, fond, titres (couleur, **couleur active**, typographie, contour, ombre), contenu. **État** « sélectionné » [C : element-states]. Version avec éléments imbriqués : `tabs-with-nested-containers` [N].

### 3.11 Accordion / Accordéon (gratuit) [C]
Contenu : éléments, icône d'ouverture, icône active, balise du titre (H1–H6, DIV), **schéma FAQ** (balisage structuré). Style : bordure, titre (fond, couleur, couleur active, typographie, remplissage), icône (alignement, couleurs, espacement), contenu. **Cas pied** : mentions légales repliables, listes de liens sur mobile [O]. **Accessibilité** : [N] (clavier/ARIA non décrits).

### 3.12 Toggle / Bascule (gratuit) [C]
Comme l'accordéon (plusieurs éléments ouvrables ensemble [O]) avec en plus : espace entre éléments, ombre de boîte. Contenu : icône/active/balise/schéma FAQ.

### 3.13 Alert / Alerte (gratuit) [C]
Type (info, succès, avertissement, danger), titre, contenu, bouton de fermeture. Style : fond, bordure gauche, titre, description, icône de fermeture. **Cas pied** : bandeau de cookies [O] (mais un vrai système de consentement existe séparément chez Elementor — hors lecture).

### 3.14 Lottie (Pro) [C]
Animations Lottie (.json). Détail des réglages non relu → [N].

### 3.15 Video (gratuit) [C]
Source : YouTube, Vimeo, Dailymotion, VideoPress, auto-hébergée ; lien ; début/fin ; lecture auto (+ lecture sur mobile) ; muet ; boucle ; commandes ; branding discret ; sous-titres ; **mode confidentialité** ; **chargement différé (lazy load)** ; vidéos suggérées ; image de recouvrement. Style : [N]. **Cas pied** : peu fréquent.

## 4. Réseaux sociaux

### 4.1 Social Icons / Icônes sociales (gratuit) [C]
* **Contenu** : éléments (réseau/icône de la bibliothèque ou SVG, **URL du profil** — ou étiquette dynamique, couleur *officielle* ou personnalisée), forme (arrondie, carrée, cercle), colonnes (auto, 1–6), alignement (G/C/D).
* **Style** : icône (couleur officielle/personnalisée avec primaire/secondaire, taille, remplissage, espacement, écart entre lignes, bordure type/largeur/couleur, rayon) ; survol (couleur primaire, secondaire, **animation**).
* **Cas pied** : icônes de réseaux (tutoriel officiel : taille d'exemple 16 px, alignées à gauche). **Accessibilité** : [N] (étiquette accessible de chaque icône non décrite).

### 4.2 Share Buttons (Pro) [C]
Réseau, libellé personnalisé (ou dynamique), vue (icône+texte / icône / texte), afficher libellé, habillage, forme, colonnes, alignement, **URL cible** (page courante ou URL personnalisée / dynamique). Style : écarts colonnes/lignes, taille du bouton, taille de l'icône, hauteur, couleur (officielle ou personnalisée). **Cas pied** : « Partager le site » (rare).

### 4.3 Autres embeds sociaux
Facebook (commentaires, intégration, bouton J'aime) existent (Pro, d'après les adresses `-pro`) ; SoundCloud (gratuit) ; contenu non lu → [N].

## 5. Communication / conversion

### 5.1 Form / Formulaire (Pro) [C]
* **Champs** : texte, e-mail, zone de texte, URL, téléphone, radio, sélection, cases, nombre, date, heure, mot de passe, caché, HTML, acceptation, étapes [C, doc projet `04b`]. Par champ : type, libellé, placeholder, obligatoire, **largeur de colonne**, valeur par défaut, ID, shortcode.
* **Boutons** : taille (XS à XL), largeur de colonne, alignement, libellés Suivant/Précédent, bouton d'envoi, ID.
* **Actions après envoi** : e-mail (à, objet, message `[all-fields]`, de, répondre à, cc, bcc, métadonnées, HTML/texte), redirection, popup, service tiers ; **soumissions** enregistrées dans l'administration (Advanced+).
* **Multi-étapes** : indicateur (aucun, texte, icône, nombre, barre de progression, combinaisons).
* **Validation** : navigateur par défaut ou personnalisée ; messages d'erreur personnalisables ; ID du formulaire ; anti-spam reCAPTCHA [doc projet].
* **Cas pied** : **abonnement newsletter** (le tutoriel officiel transforme la recherche en abonnement) [C]. Intégrations Mailchimp, etc. (Advanced+) [C].
* **Accessibilité** : libellés visibles ou masqués (réglage « Label »), marque d'obligation [C] ; lecteurs d'écran [N].

### 5.2 Contact / Floating Button (modèle) [C partiel]
« Floating Buttons » sont des **modèles ajoutés depuis l'administration WordPress**, pas des widgets d'éditeur [C]. Réglages non relus → [N]. Hors pied.

### 5.3 Call to Action (Pro) [C doc projet]
Image/icône, titre, description, bouton, lien sur tout le bloc ou le bouton, bandeau. Cas pied : bandeau d'appel.

### 5.4 Off Canvas (gratuit) [C]
Conteneur masqué au chargement, ouvert par un déclencheur (lien/bouton). **Limite** : nécessite Conteneurs Flexbox + Éléments imbriqués ; inutilisable dans un carrousel de boucle. Cas pied : panneau « Contact » rétractable [O].

## 6. Infos pratiques / pro

### 6.1 HTML (gratuit) [C]
HTML, CSS, scripts JS, shortcodes. **Avertissement officiel** : le code peut contenir un logiciel malveillant, l'accès est **restreint aux administrateurs** (modifiable dans le gestionnaire de rôles). [K] En Kolakisa : désactiver par défaut ou assainir.

### 6.2 Shortcode (gratuit) [C]
Champ de saisie d'un shortcode, rendu direct dans l'éditeur ; style via le CSS personnalisé de l'onglet Avancé. [K] Hors périmètre sans moteur de shortcodes.

### 6.3 Google Maps (gratuit) [C]
Emplacement (toute adresse reconnue par Google Maps), zoom, hauteur ; Normal/Survol : filtres CSS (flou, luminosité, contraste, saturation, teinte), durée de transition. Clé API : [N]. Cas pied : adresse du siège.

### 6.4 Coordonnées / horaires
Pas de widget dédié « horaires » dans les articles lus. Moyens : Icon List, Icon Box ou Text Editor [O].

## 7. Dynamique (Pro, Essential+) [C]
Article `dynamic-tags-pro` :
* **Post** : champ personnalisé, extrait, ID, termes, heure, titre, URL.
* **Archive** : description, méta, titre, URL.
* **Site** : titre de page, **slogan du site**, **titre du site**, **date et heure actuelles**, paramètre de requête, shortcode, infos utilisateur (ID, nom, prénom, e-mail, site, bio, méta), **URL du site**, URL interne (contenu, taxonomie, média, auteur).
* **Actions** : lightbox, URL de contact (lien intelligent), popup.
* **Média** : données de l'image mise en avant. **Auteur** : infos, méta, nom, URL. **Commentaires** : nombre, URL. **WooCommerce** : titre, prix, image, UGS, stock, note… (article `dynamic-woocommerce-tags`).
* **Copyright** : pas d'étiquette « copyright » dédiée. Méthode officielle : étiquette **Current Date and Time**, format personnalisé « Y », avec « © » dans le champ « Avant » et le texte dans « Après » [C]. Sans Pro : texte saisi à la main [C].
* **Limites [C]** : toutes les étiquettes ne sont pas proposées dans tous les champs (seules celles applicables) ; « Post Time » peut être faussé par le cache. **Site Logo** n'est pas une étiquette dans cette liste : c'est un widget [C].
* Valeur de repli (fallback), « avant/après » : réglages avancés de l'étiquette [C].

## 8. E-commerce (WooCommerce) — Pro, Advanced+ [C]
* **Menu Cart** : icône (panier/cabas/sac, 3 graisses), indicateur (aucun/bulle/simple), masquer si vide, sous-total, alignement ; type **Side Cart** ou **Mini Cart** ; ouverture au clic/survol ; position du panier ; icônes de fermeture/suppression ; prix/quantité ; séparateurs ; boutons Voir panier / Paiement ; ouverture auto à l'ajout et mise à jour Ajax (nécessite Ajax activé dans WooCommerce) ; style complet normal/survol.
* **My Account** : onglets (disposition verticale/horizontale, espacement, noms, alignement), tableau de bord remplaçable par un modèle enregistré ; style normal/survol/actif (fond, couleur, bordure, ombre).
* **Product Categories** : colonnes, nombre, source (toutes / manuelle / par parent / sous-catégories courantes), masquer vides, ordre (nom, slug, description, nombre).
* **Autres** : Cart, Checkout, Notices, Purchase Summary, Products, Archive Products, etc. (pages boutique : hors pied).
* **Cas pied** : mini-panier, lien « Mon compte », liste de catégories. Disponibles seulement si WooCommerce actif [O].

## 9. Boucles et articles (Pro)
* **Loop Grid / Posts / Archive Posts** : liste de contenus (derniers articles dans le pied). Réglages détaillés non relus ici → **[N]** (le fichier source a été récupéré mais pas étudié ligne à ligne). [K] couvert par les « listes dynamiques » du catalogue Kolakisa.

## 10. Tableau récapitulatif widget × onglets

| Widget | Offre | Contenu | Style | Avancé | États | Fiabilité |
|---|---|---|---|---|---|---|
| Image | Gratuit | oui | oui | oui | N/Survol | [C] |
| Site Logo | Pro | oui | oui | oui | N/Survol | [C] |
| Site Title | Pro | oui | oui | oui | — | [C] |
| Heading | Gratuit | oui | oui | oui | — | [C] |
| Text Editor | Gratuit | oui | oui | oui | — | [C] |
| Nav Menu | Pro | oui | oui | oui | N/Survol/Actif | [C] |
| Icon List | Gratuit | oui | oui | oui | N/Survol | [C] |
| Menu Anchor | Gratuit | oui | non | oui | — | [C] |
| Search Form | Pro | oui | oui | oui | N/Survol/Focus | [C] |
| Post Navigation | Pro | oui | oui (partiel) | oui | N/Survol | [C] |
| Button | Gratuit | oui | oui | oui | N/Survol | [C] |
| Divider | Gratuit | oui | oui | oui | — | [C] |
| Spacer | Gratuit | oui | non/masque | oui | — | [C partiel] |
| Image Box | Gratuit | oui | oui | oui | N/Survol | [C] |
| Icon | Gratuit | oui | oui | oui | N/Survol | [C] |
| Icon Box | Gratuit | oui | oui | oui | N/Survol | [C] |
| Testimonial | Gratuit | oui | oui | oui | — | [C] |
| Counter | Gratuit | oui | oui | oui | — | [C] |
| Progress Bar | Gratuit | oui | oui | oui | — | [C] |
| Tabs | Gratuit | oui | oui | oui | Actif/Sélectionné | [C] |
| Accordion | Gratuit | oui | oui | oui | Actif | [C] |
| Toggle | Gratuit | oui | oui | oui | Actif | [C] |
| Alert | Gratuit | oui | oui | oui | Survol (fermeture) | [C doc projet] |
| Lottie | Pro | [N] | [N] | oui | — | [N] |
| Video | Gratuit | oui | [N] | oui | — | [C contenu] |
| Social Icons | Gratuit | oui | oui | oui | N/Survol | [C] |
| Share Buttons | Pro | oui | oui | oui | — | [C] |
| Form | Pro | oui | oui | oui | N/Focus | [C contenu] |
| Off Canvas | Gratuit | oui | [N] | oui | — | [C partiel] |
| HTML | Gratuit | oui | non | oui | — | [C] |
| Shortcode | Gratuit | oui | non | oui | — | [C] |
| Google Maps | Gratuit | oui | oui (filtres) | oui | N/Survol | [C] |
| Menu Cart | Advanced+ | oui | oui | oui | N/Survol | [C] |
| My Account | Advanced+ | oui | oui | oui | N/Survol/Actif | [C] |
| Product Categories | Advanced+ | oui | [N] | oui | — | [C contenu] |
| Loop Grid / Posts | Pro | [N] | [N] | oui | — | [N] |
| Étiquettes dynamiques | Essential+ | — | — | — | — | [C] |
