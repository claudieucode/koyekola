# Elementor : inventaire des widgets utilisables dans un footer

Accès : 9 nov. 2026. Statut gratuit/Pro = tableau officiel (S10, mis à jour 5 nov. 2026) et page officielle des widgets (S11). Si les deux se contredisent, c'est écrit. « Tiers » = extension d'un autre éditeur : **aucun widget ci-dessous n'est tiers**, sauf mention explicite en dernière section.
Colonne « Équivalent Kolakisa » : *à rechercher dans la partie audit* (pas d'invention ici ; indication de piste seulement). Aucun widget n'a été testé dans une interface (niveau max = CONFIRMÉE par doc).

| Widget | Offre | Utilité dans un footer | Équivalent Kolakisa à rechercher | Source / niveau |
|---|---|---|---|---|
| Container (Flexbox) | Gratuit | Structure du footer, colonnes, bande copyright | bloc de mise en page / section | S11, S14 CONFIRMÉE |
| Grid (container) | Gratuit | Colonnes de liens en grille | idem, grille | S11 CONFIRMÉE (existence) |
| Heading | Gratuit | Titres de colonnes (tutoriel : balise H3), ligne copyright (balise p) | titre | S10, S29 CONFIRMÉE |
| Text Editor | Gratuit | Mission, adresse, liens en texte | texte riche | S10, S29 CONFIRMÉE |
| Image | Gratuit | Logo fixe, badges de paiement | image | S10 CONFIRMÉE |
| Icon | Gratuit | Pictos (téléphone, mail) | icône | S10 CONFIRMÉE |
| Icon List | Gratuit | Liste de liens/coordonnées avec icônes | liste d'icônes | S10, S11 CONFIRMÉE |
| Social Icons | Gratuit | Réseaux sociaux : « + Add Item », réseau, URL, couleur officielle/perso, forme Rounded/Square/Circle, colonnes | icônes sociales | S10 CONFIRMÉE ; réglages T1 EXTRAIT |
| Button | Gratuit | Appel à l'action | bouton | S10 CONFIRMÉE |
| Divider | Gratuit | Ligne au-dessus de la bande copyright | séparateur | S10 CONFIRMÉE |
| Spacer | Gratuit | Espaces | espaceur | S10 CONFIRMÉE |
| HTML | Gratuit | Code libre (à encadrer : risque) | HTML libre | S10 CONFIRMÉE |
| Shortcode | Gratuit | Insérer un module WordPress (formulaire d'un plugin) | shortcode | S10 CONFIRMÉE |
| Menu Anchor | Gratuit | Ancre « retour en haut » | ancre | S10 CONFIRMÉE |
| Sidebar | Gratuit | Zone de widgets WordPress (rare en footer) | — | S10 CONFIRMÉE |
| Counter, Progress Bar, Tabs, Accordion, Toggle, Alert, Google Maps, Image Box, Icon Box, Testimonial, Image Carousel | Gratuit | Compteur chiffres, **accordéon de liens repliables sur mobile**, carte d'agence, etc. | compteur, accordéon, carte | S10, S11 CONFIRMÉE |
| Site Logo | **Pro** | Logo du site (vient du réglage Identité du site ; ne se change que là) | logo du site | S10 (Pro), S11 (Essential Pro), S32 CONFIRMÉE |
| Site Title | **Pro** | Nom du site ; balise H1–H6/div/span/p | titre du site | S10, S11 CONFIRMÉE ; balises T1 EXTRAIT |
| Nav Menu → « WordPress Menu » | **Pro** | Menus du footer (créés dans Apparence > Menus) ; mises en page Horizontal/Vertical/Dropdown ; bascule mobile (point de rupture Mobile/Tablet/None, hamburger) | menu | S10, S11, S12 CONFIRMÉE |
| « Menu » (nouveau widget) | **Pro** | Menu sans passer par les menus WordPress, mega menu | menu / méga-menu | S11, S12 CONFIRMÉE (existence) |
| WordPress Menu (natif WordPress) | Natif WP, pas Elementor | Widget « Menu de navigation » de WordPress dans une zone de widgets (Sidebar) | — | NON VÉRIFIÉ ici (aucune page WP consultée) |
| Search | **Pro** | Recherche dans le footer | recherche | S11 CONFIRMÉE (existence) ; page d'aide dédiée non trouvée |
| Form | **Pro** | Abonnement newsletter, contact | formulaire | S10, S11 CONFIRMÉE |
| Login | **Pro** | Lien/connexion membre | connexion | S10, S11 CONFIRMÉE |
| Sitemap | **Pro** | Plan du site hiérarchique : Type (Post Type ou Taxonomy), tri, profondeur, colonnes, nofollow. **Non natif gratuit.** | plan du site | S10, S11, S33 CONFIRMÉE |
| Breadcrumbs | **Pro** + **plugin tiers Yoast SEO requis** | Fil d'Ariane (rare en footer) | fil d'Ariane | S10, S11 CONFIRMÉE ; dépendance Yoast : T1 EXTRAIT |
| Posts / Loop Grid / Loop Carousel | **Pro** | « Derniers articles » en footer | derniers articles | S11 CONFIRMÉE |
| Post Info, Post Title, Post Excerpt… | **Pro** | Peu utiles dans un footer global (contenu d'article) | — | S10, S11 CONFIRMÉE |
| Share Buttons | **Pro** | Partage (plutôt article) | partage | S10, S11 CONFIRMÉE |
| Countdown | **Pro** | Compte à rebours promo | compteur à rebours | S10, S11 CONFIRMÉE |
| Template | **Pro** | Insérer un modèle enregistré dans le footer | modèle/section réutilisable | S10, S11 CONFIRMÉE |
| Global Widget | **Pro** | Même widget réutilisé partout (ancien système) | bloc partagé | S10 CONFIRMÉE (nommé « Global Widget » ; S11 ne le liste pas : écart non résolu) |
| Off-Canvas | **Contradiction** : « gratuit » (S10) vs « Essential Pro » (S11) | Panneau latéral (menu mobile) | menu mobile | NON VÉRIFIABLE |
| Lottie, Flip Box, Call to Action, Price Table, Hotspot, Video Playlist | **Pro** | Hors besoin d'un footer | — | S10, S11 CONFIRMÉE |
| Menu Cart | **Pro**, paliers Advanced+ (WooCommerce) | Mini-panier | mini-panier | S10, S11 CONFIRMÉE |
| Product Categories, Cart, My Account, Checkout | **Pro**, paliers Advanced+ | Liens boutique, compte | catégories produits, mon compte | S11 CONFIRMÉE |
| Copyright | **N'existe pas comme widget** | Se fait avec un Heading + étiquette dynamique « Current Date and Time » (format `Y`), © dans « Before », texte dans « After » ; sans Pro : texte tapé | copyright à année automatique | S29, S34 CONFIRMÉE |
| Étiquettes dynamiques (Dynamic Tags) | **Pro** (fonction) | Groupe **Site** : Page Title, Site Tagline, Site Title, Current Date Time, Request Parameter, Shortcode, User Info, Site URL, Internal URL. Aussi Post, Archive, Author, Comments, WooCommerce | champs dynamiques | S34 CONFIRMÉE (liste) ; « Pro » : tableau gratuit/Pro du site, S17 dit seulement que certaines fonctions sont Pro (2.7) → niveau partiel |
| Hamburger / Mega Menu | **Pro** (widget « Menu ») | Menu mobile du footer (peu courant) | — | S11 |
| Social share, Facebook widgets | **Pro** | Hors besoin | — | S11 |

## Réglages à connaître par widget (documentés)
* **Site Logo** : Content = logo (via Identité du site), résolution d'image, légende, lien (média / URL perso / URL du site / aucun). Style = alignement, largeur, largeur max, hauteur + Object Fit, opacité et filtres CSS (normal/survol), bordure, rayon, ombre. (S32 CONFIRMÉE)
* **WordPress Menu** : Menu, Layout, Alignment, Pointer, Animation, Submenu Indicator ; sous-section **Mobile Dropdown** : Breakpoint (Mobile/Tablet/None), Full Width, Text Align, Toggle Button, Toggle Align. (S12 CONFIRMÉE)
* **Sitemap** : deux entrées par défaut (Pages, Catégories), exclure des articles, masquer les articles protégés. (S33 CONFIRMÉE)

## Extensions tierces
Aucune page d'extension tierce (Essential Addons, Premium Addons, Happy Addons, JetElements/Crocoblock, ElementsKit, Ultimate Addons…) n'a été lue comme preuve. Des résultats de recherche ont montré que de telles extensions proposent leurs propres menus, panier, etc., mais **je ne m'en sers pour aucune affirmation**. Pour Kolakisa : les widgets « Menu Cart » ou « Search » existent aussi côté tiers ; seul le statut Elementor/Pro ci-dessus est établi.

## Ce que ça change pour Kolakisa (utilité footer)
* Le noyau gratuit d'Elementor couvre déjà le texte, les images, les listes d'icônes, les réseaux sociaux, les boutons, le HTML. **Logo, titre du site, menu, recherche, formulaire et plan du site sont Pro.**
* Il n'y a pas de widget « copyright » : c'est une astuce (texte + étiquette de date). Un widget copyright à année automatique serait un vrai avantage pour Kolakisa.
