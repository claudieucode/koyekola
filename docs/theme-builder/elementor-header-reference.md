# Référence Elementor — partie de site « En-tête » (Header)

Document de référence établi **avant** la reconstruction de la catégorie En-tête du Theme Builder de Kolakisa. Il complète
`ELEMENTOR_SITE_PARTS.md`, `ELEMENTOR_DISPLAY_CONDITIONS.md` et `ELEMENTOR_TEMPLATE_LIFECYCLE.md` (même dossier).

Légende : **[C]** confirmé par une page officielle lue pour ce document · **[O]** observé dans l'interface réelle · **[N]** non vérifiable ici · **[K]** choix propre à Kolakisa.

> Aucune interface Elementor réelle n'a pu être ouverte pendant ce travail : **aucun point n'est marqué [O]**. Tout ce qui suit vient des pages d'aide officielles
> (elementor.com/help) ; ce qui n'y figure pas est marqué [N] plutôt que supposé.

## 1. Sources lues

| Page | Adresse |
|---|---|
| Créer ou modifier un en-tête | https://elementor.com/help/header-site-part/ |
| Widget Nav Menu (Pro) | https://elementor.com/help/nav-menu-widget-pro/ |
| En-têtes collants (v3 et v4) | https://elementor.com/help/sticky-headers/ |
| En-tête collant transparent | https://elementor.com/help/sticky-transparent-header/ |
| Résultats de recherche (Theme Builder, conditions, dépannage) | https://elementor.com/help/design-your-theme/theme-builder/feed/ (via recherche) |

Lecture partielle : les pages d'aide contiennent surtout la navigation du centre d'aide ; le corps de l'article n'a été lu que lorsqu'il était accessible.

## 2. Cycle de vie d'un en-tête

* **[C]** Création : Elementor › Theme Builder › carte « Header » › « + » ouvre la bibliothèque de modèles ; on peut partir d'un modèle prêt à l'emploi ou de zéro.
* **[C]** Publication : « Publish » enregistre l'en-tête, puis demande **sur quelles pages il s'affiche** (conditions). Les conditions se modifient ensuite par « Edit Conditions » sur la carte.
* **[C]** Gestion : la carte propose Modifier, Exporter (`.json`), Corbeille (avec confirmation), Renommer.
* **[C]** Accessibilité : le réglage « HTML Tag » des réglages d'en-tête doit valoir `header` pour les lecteurs d'écran.
* **[C]** Dépannage cité : modèle non publié, mise en page de page « Canvas » (au lieu de « Default »), cache à vider.
* **[C]** Pastille verte = conditions affectées ; grise = brouillon sans conditions.
* **[N]** Détail de la hiérarchie des conditions (précision, exclusions) : voir `ELEMENTOR_DISPLAY_CONDITIONS.md` ; non relu ici.

## 3. Widgets d'un en-tête

Pages d'aide listées par Elementor pour la construction d'un en-tête : Site Logo, Menu / WordPress Menu (Nav Menu), Search, Menu Cart, Button.
**[C]** (titres uniquement) ; le contenu détaillé des widgets Logo, Search, Menu Cart et Button n'a pas été relu.

### Nav Menu — contrôles confirmés [C]

| Onglet | Groupe | Contrôles |
|---|---|---|
| Contenu | Layout | Menu (choisi dans Apparence › Menus) · Layout : Horizontal, Vertical, Dropdown · Alignement : gauche, centre, droite, justifié · Pointeur de survol : aucun, soulignement, double ligne, encadré, fond, texte · Animation du pointeur : fondu, glissement, agrandissement, entrée/sortie, aucune · Indicateur de sous-menu : aucun, classique, chevron, angle, plus |
| Contenu | Menu déroulant mobile | Point de rupture : mobile, tablette, aucun · Pleine largeur : oui/non · Alignement du texte : à côté / centré · Bouton de bascule (hamburger) : afficher/masquer · Icônes normal/survol/actif · Alignement du bouton |
| Style | Menu principal | Typographie · couleur du texte · couleur et épaisseur du pointeur · séparateur · remplissage horizontal et vertical · espace entre éléments |
| Style | Menu déroulant | Couleurs texte/fond · typographie · bordure · rayon · ombre · remplissage · séparateur · distance au bouton |
| Style | Bouton de bascule | Couleur de l'icône, fond, taille, bordure, rayon (états normal et survol) |
| Avancé | — | Position, espacements, code personnalisé |

Le widget est de la formule Pro **[C]**.

## 4. En-tête collant (sticky) et transparent

* **[C]** Elementor v3 (sections) — Avancé › Effets de mouvement : **Sticky** = Top/Bottom · **Sticky On** = Bureau / Tablette portrait / Mobile portrait · **Offset** (décalage en px) · **Effects Offset** (distance de défilement avant l'activation du style « collant ») · **Stay In Column** (laisser sur « Non » pour un en-tête principal).
* **[C]** Elementor v4 (Atomic) — le « sticky » natif est limité à son conteneur ; pour un en-tête sur tout le site : conteneur externe statique (cale de hauteur, ex. min 80 px, largeur 100 %) + conteneur interne en position **Fixed**, top 0, **z-index 99**.
* **[C]** Transparence : en v3, « Scrolling Effects › Transparency » ou CSS ciblant `.elementor-sticky--effects` (fond rgba, transition, hauteur réduite) ; l'Effects Offset ne sert que si ce CSS existe ; la méthode CSS ne vaut que pour sections/colonnes (conteneurs : autre guide).
* **[C]** Un en-tête qui flotte derrière du texte ou des images doit avoir un z-index élevé (99).
* **[N]** Le rétrécissement au défilement (« shrinking ») n'est pas décrit par la page lue ; il apparaît seulement dans un article de blog tiers cité par la recherche. Non retenu comme comportement confirmé.
* **[N]** Le comportement exact du « superposé sur le héros » (position absolue) : la page lue ne couvre pas le héros ; c'est une déduction des réglages généraux.

## 5. Différences et choix Kolakisa

| Sujet | Elementor | Kolakisa |
|---|---|---|
| Source de la navigation | Menu WordPress choisi dans le widget | **[K]** Menu **affecté à l'emplacement « En-tête »** (Apparence › Menus) ; aucun lien inventé dans un modèle |
| Sous-menus | Plusieurs niveaux, indicateur au choix | **[K]** Un niveau de liste déroulante (grammaire `menu`, `nodes.js`) ; indicateur unique |
| Menu mobile | Point de rupture, pleine largeur, icônes | **[K]** `mobileToggle` : le menu se replie derrière un bouton sur petit écran |
| Pointeur de survol (soulignement, fond…) | Réglage du widget | **[K]** Animations de survol de la grammaire (`hover`) et couleurs d'état ; pas de réglage « pointeur » dédié |
| Collant | Effets de mouvement | **[K]** `position: sticky` + `top`/`z-index` sur la première bande de l'en-tête (`partMode`, `themeRender.js`) ; pas d'« Effects Offset » ni de rétrécissement |
| Superposé / transparent | CSS ou position absolue | **[K]** `position: absolute` sur la première bande, fond transparent ; le contenu de la page passe dessous |
| Visibilité par appareil | « Sticky On », masquage responsive | **[K]** `hideOn: ["tablet" \| "mobile"]` par élément |
| Étiquette HTML | Réglage « HTML Tag » | **[K]** L'en-tête du Theme Builder est rendu dans un `<div class="kw-theme-part kw-theme-header">` ; l'élément sémantique `header` n'est pas posé par le modèle (voir limites) |
| Bibliothèque | Modèles Elementor propriétaires | **[K]** Catalogue en code (`catalog/header.js`) ; copie indépendante à l'utilisation ; aucune ressource Elementor reprise |

## 6. Ce que cela impose à la bibliothèque

1. Un modèle d'en-tête ne contient que ce que Kolakisa sait réellement afficher : logo du site, titre du site, menu affecté, recherche, compte/panier, mini-panier, boutons, liens, réseaux, texte, date.
2. « Collant » et « transparent » se déclarent sur la **première bande** (seule lue par `partMode`) ; toute autre bande n'est pas collante.
3. Les fonctions Elementor non reproduites (effets de défilement, rétrécissement, pointeurs configurables) **ne sont pas affichées** dans l'interface : pas de contrôle décoratif.
