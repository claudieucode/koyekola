# Conteneurs, arrière-plans, bordures, ombres, transformations, filtres, positionnement

Légende : **[C]** lu dans l'article officiel · **[O]** déduit · **[N]** non vérifiable · **[K]** recommandation Kolakisa.
Sources lues : `container-layout-tab-settings`, `container-style-tab-settings`, `container-advanced-tab-settings`, `flexbox-element` (début), `how-do-flexbox-containers-work`, `set-flexbox-container-size-behavior`, `shape-divider`, `section-background-video-options`, `background-slideshow`, `gradient-background`, `shadow`, `style-tab-effects`, `css-transform`, `blend-mode-and-css-filters`, `hover-effects`, `hover-animations`, `element-states`, `how-to-use-z-index-in-elementor`, `sticky-headers`, `sticky-scrolling-effect-pro`, `advanced-tab`, `custom-css-in-elementor`, `add-custom-css-to-an-element`, `theme-style-global-settings`. **Éditeurs v3 et v4** coexistent : les menus diffèrent (v4 = « Atomic Editor », réglages dans l'onglet Style > Layout / Size / Position) [C].

## 1. Le conteneur d'un pied de page

* **[C]** Structure officielle : un **conteneur parent** pleine largeur (hauteur minimale, ex. 40 vh ; couleur de fond globale ; remplissage ex. 3 %) contenant des **conteneurs enfants = colonnes** (ex. 60 % en ligne + 40 % en colonne), plus un **conteneur de copyright** distinct (pleine largeur, centré, remplissage ex. 1 %). Garder le nombre d'éléments imbriqués minimal (performance).
* **[C]** Un conteneur peut recevoir une **balise HTML** choisie (`div`, `footer`, `section`, `a` = conteneur cliquable…), réglable par appareil.
* **[K]** Kolakisa : bande pleine largeur + zone centrée + colonnes en Flexbox avec retour à la ligne (déjà décidé).

## 2. Onglet Mise en page (Layout) du conteneur [C]

| Réglage | Valeurs / effet |
|---|---|
| Largeur du contenu (Content Width) | **Boxed** (le contenu a la largeur réglée, le conteneur reste pleine largeur) ou **Full Width** (la largeur règle le conteneur lui-même) |
| Largeur | px, %, vw — effet selon le mode ci-dessus |
| Hauteur minimale | px ou vh |
| Direction | ligne, colonne, ligne inversée, colonne inversée (réglable par appareil) |
| Justifier le contenu | début, centre, fin, espace entre, espace autour, espace égal |
| Aligner les éléments | début, centre, fin, étirer (étirer inactif si l'élément a une largeur définie) |
| Écart (Gap) | espace entre éléments |
| Retour à la ligne (Wrap) | autorise les éléments à largeur définie à passer sur plusieurs lignes |
| Aligner le contenu | n'apparaît que si Wrap est actif |
| Débordement (Overflow) | défaut (déborde), masqué (éléments inaccessibles), auto (barre de défilement, balayage possible sur mobile) |
| Balise HTML | voir §1 |

Blocs dans un conteneur Flexbox : réglage « Size behavior » (largeur de l'élément dans le conteneur) — détails dans `set-flexbox-container-size-behavior`, **non détaillés ici** [N]. Une grille (Grid Container) existe aussi (`grid-container-layout-options`) mais n'a pas été lue [N].

## 3. Onglet Style du conteneur [C]

### 3.1 Arrière-plan (Background)
* Types : **Classique** (couleur ou image), **Dégradé**, **Vidéo**, **Diaporama (Slideshow)**.
* **Dégradé** : couleur 1 + emplacement, couleur 2 + emplacement, type **linéaire ou radial**, angle.
* **Image** : choix médiathèque ; taille/position/répétition/fixe (« Background attachment fixed » connu pour un défaut Safari iOS → article de dépannage, non lu) [N].
* **Vidéo** : lien YouTube / Vimeo / auto-hébergée ; début, fin ; lire une fois ; **lire sur mobile** ; mode confidentialité (YouTube) ; **image de secours** (si la vidéo n'est pas disponible). Limites officielles : pas de lecture auto sur iOS en mode économie d'énergie, ni Android avec économiseur de données, ni selon la politique d'autoplay de Chrome ; YouTube affiche brièvement le titre ; Vimeo : seuls les comptes premium retirent commandes et titres.
* **Diaporama** : images (galerie), boucle infinie, durée de diapo (ms), transition (fondu, glissement droite/gauche/bas/haut), durée de transition, taille (défaut, auto, couvrir, contenir), position (9 positions), **effet Ken Burns** (zoom in/out). Avertissement de compatibilité sous Windows 11 (article de dépannage, non lu) [N].
* États **Normal / Survol** pour l'arrière-plan [C].
* **Superposition d'arrière-plan (Overlay)** : couleur/dégradé/image + opacité ; onglet Survol pour une superposition différente au survol [C].

### 3.2 Bordure
Type (aucune, solide, double, pointillée, tiretée, rainurée), largeur (px, em, %), couleur, **rayon** (px, em, %), états Normal/Survol [C].

### 3.3 Ombre portée (Box Shadow)
Couleur, horizontal, vertical, flou, étalement, position **extérieure (outset) / intérieure (inset)** ; plusieurs couches possibles en v4 (« ajouter des couches ») ; bouton « retour au défaut » pour supprimer [C].

### 3.4 Séparateur de forme (Shape Divider)
En **haut** et/ou en **bas**, type de forme, couleur, largeur, hauteur, retournement (flip), « Bring to front » (devant le contenu) [C]. Gratuit [C].

## 4. Onglet Avancé du conteneur [C]
Marge, remplissage (px, em, %, rem ; liens dissociables), alignement individuel (`align-self`), **ordre** (début / fin / personnalisé), **taille** (aucun / grandir / rétrécir / personnalisé), **position** (par défaut, absolue, fixe ; X/Y avec référence début/fin et décalage), **z-index**, ID CSS, classes CSS, masque, responsive (masquer), attributs, CSS personnalisé.
* **Note officielle** : le positionnement absolu « n'est pas la méthode recommandée pour bâtir une mise en page ». Absolue = relatif au premier parent positionné ; fixe = relatif à la fenêtre (ne bouge pas au défilement) ; sticky = relatif à sa section [C].
* **Z-index** : plus grand = devant ; v4 : Style > Position > Z-Index ; v3 : Avancé > Mise en page > Z-Index [C].
* Un widget recouvert par autre chose : article `my-widget-is-being-covered-up-by-something-else` listé, **non lu** [N].
* Largeur « Inline (auto) » n'existe pas pour les conteneurs (c'est la direction qui joue) [C].

## 5. Transformations (widgets) [C]
Rotation (3D optionnelle par axe), décalage X/Y, échelle (proportions verrouillables), inclinaison X/Y, retournement horizontal/vertical, points d'ancrage X (gauche/centre/droite) et Y (haut/centre/bas). Chaque réglage en **Normal et Survol**, durée de transition au survol réglable. **Limite [C]** : l'article dit que cela ne fonctionne qu'avec les widgets (pas sections/colonnes/sections internes) « à ce jour » ; la page est ancienne, le comportement actuel sur les conteneurs est **[N]**.

## 6. Opacité, filtres CSS, modes de fusion [C]
* **Opacité** (0–100 %).
* **Filtres CSS** : v4 = **huit filtres** (flou, luminosité, contraste, rotation de teinte… les quatre autres non listés dans l'extrait lu → [N]) ; widgets v3 : flou, luminosité, contraste, saturation, teinte, en Normal/Survol.
* **Modes de fusion** : 13 (Normal, Multiplier, Écran, Superposition, Assombrir, Éclaircir, Densité couleur −, Saturation, Couleur, Différence, Exclusion, Teinte, Luminosité) [C].

## 7. Survol, états, transitions
* **Animations au survol** : grossir, rétrécir, pulsation, pousser, sauter, rebondir, rotation, flottement, couler, osciller, suspendre, incliner… (liste partielle dans l'article) [C].
* **États (v4)** : Survol, **Focus**, **Actif** ; Tabs a en plus **Sélectionné** ; indicateur vert (classe globale) / rose (classe locale) [C].
* **Transition** : une durée (ms) est réglable pour les états de survol de chaque widget [C]. Fonction de temporisation (easing) : **[N]**.
* États **Visité/Désactivé** : **[N]**.

## 8. Position, sticky, superposition
* **Sticky v3 (Pro)** : Avancé > Effets de mouvement > Sticky = Haut ou Bas ; « Sticky On » = ordinateur / tablette / mobile ; Décalage (Offset) ; Décalage d'effet (pixels à défiler avant) ; « Stay in column » [C].
* **Sticky v4** : Style > Position = Sticky ; Haut/Bas (px, rem) ; z-index ; décalage d'ancre [C]. Pour un en-tête : conteneur externe statique de hauteur minimale + conteneur interne **Fixed**, Top 0, z-index 99 [C].
* **Pied collant (footer fixé en bas)** : **[N]** — l'article ne parle que d'en-têtes ; techniquement possible avec position fixe/sticky bottom [O].

## 9. CSS personnalisé [C]
Trois niveaux : site, page, élément. Le CSS d'élément doit utiliser `selector` ; l'élément écrase la page qui écrase le site. Pro, offre Advanced et plus. Elementor ne donne pas de support sur le CSS personnalisé écrit par l'utilisateur.

## 10. Couleurs et polices globales
* **[C]** Réglages du thème (Site Settings) : styles par défaut pour boutons, images, champs de formulaire, texte, liens (normal/survol)… ; pour que le style du thème s'applique aux éléments Elementor, il faut cocher **Disable Default Colors / Disable Default Fonts** (Elementor > Settings).
* **[N]** Détail des « Global Colors / Global Fonts » (création, couleur d'accentuation par défaut, héritage) : l'article spécifique n'a pas été lu. On sait seulement que le pointeur du Nav Menu utilise la couleur d'accentuation des Global Colors [C].

## 11. Visibilité par appareil
Voir fichier Responsive : « Hide on Desktop / Tablet / Mobile » (v3, Avancé > Responsive) ; v4 : Style > Layout > Display = None par appareil [C].

## 12. À reproduire dans Kolakisa [K]
Obligatoire : direction, justification, alignement, écart, wrap, largeur boxed/pleine, hauteur min, fond couleur/dégradé/image + superposition, bordure + rayon + ombre, marge/remplissage, ordre, masquer par appareil, ID/classes, balise HTML (dont `footer`). Souhaitable : séparateur de forme, vidéo de fond (avec image de secours), z-index, position absolue contrôlée. Reporter : diaporama de fond, masque, modes de fusion, transformations 3D, CSS personnalisé libre (risque de sécurité).
