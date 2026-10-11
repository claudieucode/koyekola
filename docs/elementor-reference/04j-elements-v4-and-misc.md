# 04j — Éléments V4, widgets d'articles et fonctions annexes

_Articles lus le 2026-10-10._

## Éléments V4 (atomiques)
- **Div Block / Flexbox** (/help/div-block-element/, /flexbox-element/) : balise (Div, Header, Section, Article, Aside, Footer), lien (+ nouvel onglet). Style : Layout, Spacing, Size, Position, Typography, Background, Border, Effects.
- **Heading** (/help/heading-element/) : titre, balise, lien, **ID**. **Image** (/help/image-element/) : image, **résolution** (« plus la résolution est haute, plus le fichier pèse »), lien, nouvel onglet ; pas de visionneuse. **Paragraph** : texte + lien. **Button** : texte, lien, ID. **SVG** : fichier SVG (remplissage noir pur, couleur via la typographie) ; l'article n'a pas de section sécurité. **Tabs** : onglets, onglet par défaut, ID, attributs, conditions d'affichage. **YouTube** : début / fin, lecture auto (+ mobile), muet, boucle, chargement différé, contrôles, sous-titres, mode confidentialité, vidéos suggérées, ouverture au clic / survol.
- **Style V4** : Layout (Block, Flex, Inline-block, None), Spacing, Size, Position (z-index, sticky), Typography, Background, Border, Effects — mêmes catégories que le panneau de KOLAKISA (voir `06`).

## Widgets d'articles (thème)
- **Éléments d'article** (/help/single-post-widgets/) : titre, infos (auteur, date, heure, commentaires), extrait, contenu, image mise en avant, boîte d'auteur, recherche, commentaires, navigation, fil d'Ariane (Yoast).
- **Titre de la page** (/help/page-title-widget-pro/) : titre automatique, lien, balise, contexte et titre d'accueil, texte avant / après / de repli ; contour, ombre, mode de fusion.
- **Archive d'articles** (/help/archive-posts-widget-pro/) : habillage Classique / Cartes, 1–6 colonnes, mosaïque, badge, avatar, pagination (aucune, numéros, précédent/suivant, charger au clic, défilement infini), message « rien trouvé » ; le nombre d'articles par page vient de WordPress.
- **Plan du site (Sitemap)** (/help/sitemap-widget-pro/) : type (article, taxonomie), source, titre, tri, masquer les vides, vue hiérarchique, profondeur 1–6, colonnes 1–6, nofollow, exclusions, articles protégés ; puces (disque, cercle, carré, aucune).
- **Modèle (Template)** (/help/template-widget-pro/) : insère un modèle enregistré ; « Modifier le modèle » ; un changement touche tous les usages.

## Intégrations tierces
- **Facebook** : Embed (publication, vidéo, commentaire), Commentaires (nécessite l'**identifiant d'application Facebook**), Flux de page (disposition Timeline / Événements / Messages). En Europe, le visiteur doit accepter les cookies et être connecté à Facebook.
- **Stripe** (/help/stripe-button/) : clés secrètes (réelle / test), produit, devise, prix, taxes (créées dans Stripe), redirection, test. **PayPal** (/help/paypal-button-widget-pro/) : achat, don, abonnement, bac à sable. Exigent un compte marchand.
- **Connexion** (/help/login-widget-pro/) : champs, bouton, redirection, « mot de passe oublié », « se souvenir de moi » ; identifiants WordPress.
- **Shortcode** (/help/shortcode-widget/) : « à n'utiliser qu'avec des sources de confiance » (pas de section sécurité).

## Contenu dynamique et liens
- **Liens intelligents (Contact URL)** (/help/dynamic-contact-url-pro/) : e-mail (destinataire, objet, message), Tel, SMS, WhatsApp (numéro international), Skype, Messenger, Viber, **Waze** (itinéraire), **agenda Google / Outlook / Yahoo** (titre, description, lieu, début, fin).
- **Visionneuse dynamique** (/help/dynamic-lightbox-pro/) : un lien qui ouvre une image ou une vidéo (YouTube, Vimeo, Dailymotion) en visionneuse.
- **Couleurs dynamiques** (/help/dynamic-colors/) : couleur lue dans un champ personnalisé (ACF).
- **Attributs de lien** (/help/custom-link-attributes/) : `clé|valeur` séparés par des virgules ; attributs JavaScript (onclick…) bloqués ; seulement les widgets qui ont un champ Lien.
- **Liens tel: / mailto:** (/help/clickable-phone-links/).
- **Éléments globaux** (/help/global-widget-pro/) : « Enregistrer comme global » (clic droit), onglet Globaux, modification = toutes les instances, « Dissocier ».
- **Imbrication** (/help/nested-elements/) : Accordéon, Onglets, Menu peuvent contenir d'autres éléments.
- **Hiérarchie des styles** (/help/how-elementors-theme-style-and-design-system-options-work-together/) : Theme Style (repli des balises) < couleurs et polices globales (variables CSS) < réglages propres à l'élément ; l'article ne tranche pas explicitement la priorité élément / global.
- **Bibliothèque d'icônes** (/help/icon-library/) : plus de 1 500 icônes Font Awesome 5 gratuites, recherche, familles (Regular, Solid, Brands), chargement de la seule famille utilisée ; **icônes personnalisées** (/help/custom-icons-pro/) : ensembles Fontello / IcoMoon / Fontastic en zip.
- **Classes CSS** (/help/css-classes-in-elementor/) : nom commençant par une lettre, tirets et soulignés, sans point ; la classe se pose sur l'enveloppe du widget. **ID CSS** : l'article ne donne pas de règles de caractères.
- **Recettes** : séparateur vertical (bordure de colonne ou espaceur étroit), bouton « haut de page » (ancre `#top`), suivi des clics (attribut `data-…` + script dans un widget HTML).
- **Unités** (/help/whats-the-difference-between-px-em-rem-vw-and-vh/) : px, em, rem, %, vw, vh, ch, fr (grilles) — pas toutes sur chaque champ. **Typographie** (/help/what-is-typography/) : famille, taille (px, em, rem, vw), graisse 100–900, casse, style, décoration, interligne, interlettrage, espacement des mots. **Marges** : valeurs liées par défaut, négatives permises. **Position** : statique / absolue / fixe, décalages X / Y avec référence début / fin, par appareil ; z-index.
- **Arrière-plans** (/help/create-background/, /gradient-background/, /positioning-background-images/) : classique (couleur / image), **dégradé** (linéaire avec angle, **radial**, position de chaque couleur), vidéo, diaporama ; position (9 + libre), répétition, taille (cover, contain, personnalisée) ; effets de défilement. **Bordures** (/help/border-type/) : pleine, **double**, pointillée, tirets, **gravée (groove)**, rayon par coin.
- **Alignement** (/help/section-column-vertical-and-horizontal-alignment/) : début, centre, fin, espace entre / autour / égal (sections et colonnes historiques). **Visibilité par appareil** : « Masquer sur ordinateur / tablette / mobile » (v3), Display None (V4).
