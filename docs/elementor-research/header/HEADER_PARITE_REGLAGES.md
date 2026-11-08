# Parité des RÉGLAGES d'en-tête : Elementor ↔ KOLAKISA

Source Elementor : `04_HEADER_EDITOR_CONTROLS.md`, `03_HEADER_CONTAINER_SYSTEM.md`, `08_HEADER_MENUS_AND_MEGA_MENUS.md`. Source KOLAKISA : ce que le moteur accepte (`nodes.js`, `headerSettings.js`) et ce que l'éditeur propose.
Statuts : **OK-ici** = dans l'onglet « En-tête » · **OK-ailleurs** = existe mais dans le panneau de droite, pas dans l'onglet · **ABSENT** · **À VÉRIFIER** (existe dans le moteur, jamais contrôlé à l'écran).
Cible : tout réglage doit être atteignable depuis l'onglet « En-tête », dans l'ordre d'Elementor.

## A. Conteneur de l'en-tête — onglet « Layout / Mise en page »
| Réglage Elementor | KOLAKISA | Statut |
|---|---|---|
| Direction, justification, alignement, espacement (gap), retour à la ligne | `flexDirection`, `justifyContent`, `alignItems`, `gap`, `flexWrap` | OK-ailleurs |
| Largeur du contenu (encadrée / pleine) | « Largeur du contenu » du conteneur | OK-ailleurs |
| Hauteur minimale, largeur, hauteur max | `minHeight`, `width`, `maxWidth`… | OK-ailleurs |
| Débordement (overflow) | `overflow`, `overflowX/Y` | OK-ailleurs |
| Balise HTML (header, div, section, nav…) | « Balise » du conteneur (`boxTags`) | OK-ailleurs |
| Colonnes/ordre, align-self, order, grow/shrink | `alignSelf`, `order`, `flexGrow`, `flexShrink` | OK-ailleurs |

## B. Style du conteneur
| Réglage Elementor | KOLAKISA | Statut |
|---|---|---|
| Fond : couleur, dégradé, image, diaporama | `backgroundColor`, dégradé, image, `bgSlides` (diaporama + Ken Burns) | OK-ailleurs |
| Fond : vidéo | `bgVideo` (début, fin, image de repli, une seule lecture) | OK-ailleurs |
| Voile (overlay) | composé « overlay » | OK-ailleurs |
| Bordure : type, largeur par côté, couleur, rayon par coin | `border*` | OK-ailleurs |
| Ombre (box shadow) | `boxShadow` + ombre composée | OK-ailleurs |
| Séparateur de forme (shape divider) | `SHAPE_DIVIDERS` (7 formes, haut/bas, retourner, devant) | OK-ailleurs |
| Opacité, filtres, flou d'arrière-plan, mode de fusion | `opacity`, filtre, `backdropBlur`, `mixBlendMode` | OK-ailleurs |
| Transformations (déplacer, échelle, rotation, inclinaison) | composé « transform » | OK-ailleurs |
| Masque | composé « mask » | OK-ailleurs |
| Transition (durée/courbe) | `transitionDuration/Easing` | OK-ailleurs |

## C. Avancé
| Réglage Elementor | KOLAKISA | Statut |
|---|---|---|
| Marges / marges internes | `margin*`, `padding*` | OK-ailleurs |
| Position (par défaut, absolue, fixe) + décalages | `position`, `top/right/bottom/left` | OK-ailleurs |
| z-index | `zIndex` ; aussi dans l'onglet (niveau d'empilement) | OK-ici |
| ID CSS / ancre | « Ancre » | OK-ailleurs |
| Classes CSS | classes globales + classes du nœud | OK-ailleurs |
| Attributs HTML personnalisés | « Attributs » | OK-ailleurs |
| CSS personnalisé | « CSS personnalisé » | OK-ailleurs |
| Masquer sur ordinateur / tablette / mobile | `hideOn` (« Visibilité par écran ») | OK-ailleurs |
| Animation d'entrée | `motion` (catalogue d'animations) | À VÉRIFIER sur un en-tête |

## D. Effets de mouvement et Sticky
| Réglage Elementor | KOLAKISA | Statut |
|---|---|---|
| Sticky haut / bas | « Bord de l'écran » : haut ou bas, avec hauteur réservée | **FAIT, testé** |
| Sticky sur : ordinateur / tablette / mobile | `stickOn` | OK-ici |
| Décalage (offset) | `offset` | OK-ici |
| Décalage des effets (effects offset) | `threshold` (seuil de défilement) | OK-ici |
| Rester dans la colonne | sans objet (pas de colonnes) | EXCLU |
| Transparence au défilement | via style « Après défilement » | OK-ailleurs |
| Réduction de hauteur au défilement | `fx` shrink + `shrink.height` | OK-ici |
| Fond plein au défilement | `fx` solid | OK-ici |
| Masquer en descendant / réafficher | `hideOnScroll` + tolérance | OK-ici |
| Effets de défilement (parallaxe, flou, rotation, échelle) | `scrollFx` | OK-ailleurs |
| Effets de souris (suivi, inclinaison 3D) | `mouseFx` | OK-ailleurs |
| Respect de « réduire les animations » | oui | OK |

## E. Responsive
| Réglage Elementor | KOLAKISA | Statut |
|---|---|---|
| Réglages par écran (ordinateur / tablette / mobile) | sélecteur d'écran du panneau de droite | OK-ailleurs |
| Points de rupture personnalisés | Responsive Studio du site (tablette / mobile réglables) ; lien depuis l'onglet | OK-ailleurs + lien |
| Menu mobile : bouton, tiroir, côté, plein écran | `mobileToggle`, `mobileMode`, `drawerSide` | OK-ailleurs |
| Point de rupture du menu (quand passer en burger) | `menuBreakpoint` 320–1920 px | **FAIT, testé** |
| En-tête différent selon l'écran | masquer par écran + variantes | OK-ailleurs |

## F. États
| Réglage Elementor | KOLAKISA | Statut |
|---|---|---|
| Survol / focus / actif | états hover, focus, active | OK-ailleurs |
| Après défilement (sticky effects) | état `scrolled` | OK-ailleurs |
| Menu ouvert | état `menuOpen` | OK-ailleurs |
| Aperçu de l'état sur le canevas | l'état choisi est montré sur l'en-tête dans l'éditeur | **FAIT, testé** |

## G. Widgets d'en-tête
| Widget / réglage | KOLAKISA | Statut |
|---|---|---|
| Logo du site : image, taille, lien, variante au défilement | `sitelogo` + logo alternatif | OK-ailleurs |
| Menu : mise en page horizontale / verticale / déroulante | horizontale, verticale (`vertical`), repli en bouton / tiroir | OK-ailleurs |
| Menu : alignement, indicateur de sous-menu, animation du pointeur | alignement + indicateur + pointeur (trait dessous/dessus, double, cadre, fond ; 4 animations ; couleur) | **FAIT** (pointeur testé en attribut) |
| Menu : 3 niveaux, icônes, descriptions, classes | oui | OK-ailleurs |
| Menu : pastille / icône / description par élément | champs dans l'éditeur de menus + rendu | **FAIT, testé** (image par élément : non) |
| Méga-menu (panneau composé) | `mega` | OK-ailleurs |
| Recherche : formulaire, plein écran, suggestions | oui | OK-ailleurs |
| Compte / connexion | oui | OK-ailleurs |
| Panier / mini-panier | formations seulement | PARTIEL |
| Bouton, icône, titre, séparateur, réseaux sociaux, HTML | widgets standards | OK-ailleurs |
| Titre du site / slogan / date | titre du site oui ; slogan à vérifier | À VÉRIFIER |

## H. Rangées
| Coller une seule rangée de l'en-tête (autres rangées qui défilent) | « Rangées de l'en-tête » : case par rangée + distance | **FAIT, testé** |

## I. Hors périmètre, assumé
« Rester dans la colonne » (pas de colonnes), image personnalisée par élément de menu.

---
## Synthèse (mise à jour)
Les lignes « ABSENT » du premier état sont traitées : balise HTML, fond vidéo et diaporama, séparateur de forme et points de rupture du site existaient déjà (le tableau était incomplet) ; ont été construits : bord de l'écran (haut / bas), point de rupture du menu, pointeur du menu, pastille / icône / description des éléments de menu, aperçu des états sur le canevas, rangée collée seule, et l'onglet « En-tête » qui rend maintenant lui-même les réglages du conteneur (écran, état, groupes) en plus de l'accès aux éléments.
Reste : image par élément de menu ; test réel au toucher / lecteur d'écran / Safari / Firefox.

---
## Widgets d'en-tête, réglage par réglage (comparaison avec `02_HEADER_WIDGET_CATALOG.md`)
Statuts : **OK** présent · **FAIT** ajouté dans cette étape (testé) · **Style** disponible dans l'onglet Style, partie indiquée · **Non fait**.

### Logo du site (Elementor : Site Logo)
| Réglage Elementor | KOLAKISA | Statut |
|---|---|---|
| Lien : aucun / accueil / adresse personnalisée / nouvel onglet | « Le logo est un lien », adresse, nouvel onglet (https) | **FAIT** |
| Largeur, largeur max, hauteur, ajustement de l'objet | hauteur libre 20–160 px (contenu) ; largeur, hauteur max, ajustement : Style › partie « Image » | **FAIT** / Style |
| Opacité, filtres | Style › Image › effets (opacité, filtre) | Style |
| Bordure, rayon, ombre | Style › Image › bordure, ombre | **FAIT** |
| Survol : opacité, filtre, durée de transition | état « survol » de la partie Image + durée de transition | **FAIT** |
| Alignement | Style › disposition | Style |
| Légende, résolution d'image, lightbox | non | Non fait (sans objet pour un logo) |
| Logos par état (haut de page, défilement, mobile) | variantes du logo | OK (au-delà d'Elementor) |

### Menu (Elementor : WordPress Menu / Menu)
| Réglage Elementor | KOLAKISA | Statut |
|---|---|---|
| Disposition horizontale / verticale / déroulante | « Liens les uns sous les autres » + bouton mobile | OK |
| Pointeur (souligné, double, encadré, fond) et animation | pointeur + 4 animations + couleur | OK |
| Indicateur de sous-menu (chevron, angle, plus, aucun) | « Indicateur de sous-menu » | **FAIT** |
| Animation des sous-menus | fondu / glissement | **FAIT** |
| Point de rupture, bouton mobile, modèles | menu hamburger : 9 modèles, aperçu réel, taille d'écran | OK |
| Méga-menu | panneaux composés | OK |
| Typographie, couleurs, survol, focus des liens | Style › partie « Liens » (survol, focus) | Style |
| Élément actif (page courante) | non | Non fait |
| Image / badge d'un élément | pastille, icône, description ; image non | OK (image : Non fait) |

### Recherche (Elementor : Search / Search Form)
| Réglage Elementor | KOLAKISA | Statut |
|---|---|---|
| Skins classique / minimal / plein écran | champ + bouton ; loupe dans le champ ; loupe qui ouvre le plein écran | **FAIT** (minimal) |
| Bouton texte ou icône | « Bouton de recherche » : texte, loupe seule, loupe dans le champ | **FAIT** |
| Placeholder, résultats en direct | texte d'exemple, suggestions pendant la frappe | OK |
| Style du champ et du bouton (fond, bordure, rayon, ombre, survol, focus) | Style › parties « Champ » et « Bouton » | Style |
| Requête (sources, tri, pagination) | cible catalogue / blog / site | OK (sans pagination) |

### Compte (Elementor : Login / My Account)
| Réglage Elementor | KOLAKISA | Statut |
|---|---|---|
| Textes des liens connecté / non connecté | OK | OK |
| Icône | « Présentation du lien » : texte, icône et texte, icône seule | **FAIT** |
| Menu déroulant (mon compte, panier, déconnexion) | affichage « menu » | OK |
| Style des liens, du panier, de la pastille | Style › parties | Style |
| Formulaire de connexion complet dans l'en-tête, redirection après connexion | non | Non fait |

### Panier (Elementor : Menu Cart)
| Réglage Elementor | KOLAKISA | Statut |
|---|---|---|
| Icône chariot / sac / panier | « Icône » | **FAIT** |
| Indicateur : pastille / texte / aucun | pastille, entre parenthèses, masqué | **FAIT** |
| Sous-total à côté de l'icône | « Afficher le total » | **FAIT** |
| Masquer si vide | OK | OK |
| Panier latéral gauche / droite | « Côté du tiroir » | **FAIT** |
| Style icône, libellé, pastille, survol | Style › parties, états survol / focus | **FAIT** |
| Ouverture au survol, ouverture automatique, boutons voir panier / paiement placés | non | Non fait |

**Présentation** : dans l'éditeur, les réglages du logo, du menu, de la recherche et du compte d'un en-tête sont rangés en groupes repliables (un seul ouvert à la fois), comme l'onglet « En-tête ».
