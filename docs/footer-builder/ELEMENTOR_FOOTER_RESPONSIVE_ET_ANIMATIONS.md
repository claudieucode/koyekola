# Responsive, animations, effets — ce que fait (et ne fait pas) Elementor

Légende : **[C]** lu dans l'article officiel · **[O]** déduit · **[N]** non vérifiable · **[K]** recommandation Kolakisa.
Sources lues : `mobile-editing`, `responsive-editing`, `inherited-responsive-values`, `what-is-responsive-design`, `responsive-design-using-containers`, `show-or-hide-columns-per-device`, `motion-effects`, `entrance-animations`, `scrolling-effects-*` (vertical, horizontal, rotation, échelle, transparence, flou), `sticky-scrolling-effect-pro`, `mouse-effects-3d-tilt`, `mouse-effects-mouse-track`, `hover-animations`, `hover-effects`, `page-transitions`, `creating-a-footer-template-with-the-container`.

## 1. Points de rupture (breakpoints)

* **[C]** Par défaut, trois « appareils » : ordinateur (au-dessus de 1024 px), **tablette portrait** (entre 767 et 1024 px), **mobile portrait** (jusqu'à 767 px). Points de rupture par défaut : **1024 px** (tablette) et **767 px** (mobile).
* **[C]** Personnalisation : barre du haut > icône Site Settings > Settings > Layout > Breakpoints. On peut **modifier la valeur en px** des deux points par défaut, **ajouter** des points de rupture (« Active Breakpoints » > « + » > **six options** proposées, ex. Tablet Portrait), et **supprimer** les ajoutés. **Les deux par défaut ne se suppriment pas.** « Save Changes » enregistre.
* **[N]** Les noms exacts des six options (mobile large, tablette large, portable, écran large…) ne sont pas listés dans l'article lu. Ne pas les citer comme confirmés.
* **[C]** Barre du haut de l'éditeur : une icône par appareil actif ; hors mode ordinateur, des poignées gauche/droite/bas permettent de redimensionner l'aperçu.
* **[C]** Réglages qui portent une icône d'appareil = personnalisables par appareil (menu à côté du réglage).

## 2. Héritage entre appareils [C]

* Les valeurs sont **héritées du plus grand vers le plus petit** : « les changements se propagent vers le bas, pas dans l'autre sens ».
* La valeur héritée apparaît **grisée** (placeholder) ; un point gris indique d'où elle vient.
* Concerne marges, remplissages, tailles d'image, polices et « tout contrôle numérique ».
* **[K]** Modèle à reprendre : une valeur par appareil, vide = héritée de l'appareil supérieur ; test explicite de la cascade ordinateur → tablette → mobile.

## 3. Éléments adaptés par appareil

* **Direction du conteneur** (ligne/colonne) réglable par appareil → empilement facile sur mobile [C].
* **Largeur et hauteur** réglables par appareil [C].
* **Ordre personnalisé** par appareil (Avancé > Ordre : début / fin / personnalisé) — évite de créer des sections en double [C].
* **Wrap + largeur 100 %** : technique du tutoriel officiel pour empiler les colonnes d'un pied sur tablette/mobile [C].
* **Masquage** : v3 = Avancé > Responsive > « Hide on Desktop / Tablet / Mobile » (bascules) ; v4 = appareil choisi > Style > Layout > Display = None [C]. Un pied « absent sur mobile » vient souvent d'un masquage [C].
* **Taille de typographie** : réglable par appareil (exemple officiel : titre réduit sur mobile pour tenir sur une ligne) [C].
* **Image d'arrière-plan** différente par appareil (exemple officiel) [C].
* **Nav Menu** : point de rupture du menu déroulant (mobile / tablette / aucun) ; Form : point de rupture pour les étapes (valeurs « 767 » et « 1024 » citées) [C] (le texte de l'article Form semble copié du menu → prudence).
* **Image Box** : sur mobile l'image reste centrée [C].
* **Effets de défilement / mouvement** : option « Apply Effects On » = ordinateur / tablette / mobile [C]. **Animation d'entrée** réglable par appareil, y compris « None » [C].

## 4. Animations d'entrée (Entrance Animation) — gratuit [C]

* Avancé > Effets de mouvement > Animation d'entrée ; s'applique aux widgets, conteneurs, sections, colonnes ; l'élément apparaît **quand le visiteur défile jusqu'à lui**.
* **37 animations** : fondus (Fade In + haut/bas/gauche/droite), zooms, rebonds (Bounce In +4 directions), glissements (Slide In 4 directions), rotations (Rotate In + 4 diagonales), **attirer l'attention** (bounce, flash, pulse, rubber band, shake, head shake, swing, tada, wobble, jello), Light speed in, Roll in.
* Vitesse (Animation Speed) et délai : **présents dans l'éditeur** d'après le fonctionnement connu, mais **non listés dans l'article lu** → **[N]**.

## 5. Effets de défilement (Scrolling Effects) — Pro [C]

Avancé (ou Style > Arrière-plan) > Effets de mouvement > Scrolling Effects (bascule) :

| Effet | Réglages lus |
|---|---|
| Défilement vertical (parallaxe) | direction haut/bas, vitesse 0–10, fenêtre (Viewport, plage en % de la hauteur d'écran), Apply Effects On, Effects Relative To (défaut / fenêtre / page entière) |
| Défilement horizontal | direction vers la gauche/droite, vitesse, fenêtre |
| Rotation | direction gauche/droite, vitesse (échelle de 0 à une valeur tronquée dans l'extrait lu), fenêtre, ancres X/Y |
| Échelle | agrandir, réduire, réduire-agrandir, agrandir-réduire ; vitesse 0–10 ; fenêtre ; ancres X (gauche/centre/droite), Y (haut/centre/bas) |
| Transparence | fondu entrant / sortant / sortant-entrant / entrant-sortant ; niveau 0–10 |
| Flou | mêmes directions ; niveau ; fenêtre |

* « Effects Relative To » : base du calcul des effets ; ancres : uniquement Rotation et Échelle [C].
* Compatibilité navigateurs annoncée : Chrome, Firefox, Safari, Opera, Edge OK (Edge « réponse lente »), **Internet Explorer non pris en charge** [C].
* Safari : problème d'ancienne version de jQuery avec le suivi de souris (éléments qui disparaissent, erreur « maximum call stack size exceeded ») ; solutions : retirer les animations d'entrée des widgets avec effets de mouvement, retirer les effets souris des zones combinant défilement et souris [C].
* Effet de défilement sur un élément **dans un pied de page** : aucune restriction particulière documentée [O].

## 6. Effets souris (Mouse Effects) [C]
* **Mouse Track** (déplacement lié à la souris) et **3D Tilt** (inclinaison) : direction directe ou **opposée**, vitesse 0–10, Apply Effects On, Effects Relative To. Disponibilité gratuit/Pro : l'article de comparaison ne les liste pas séparément → **[N]**.

## 7. Sticky (collant) [C]
Voir fichier Conteneur §8. Pro. Réglage par appareil (« Sticky On »). **Aucune règle propre au pied** n'est décrite ; l'usage documenté est l'en-tête.

## 8. Interactions et transitions de page
* **Hover / Normal / Active / Focus** : voir fichier Conteneur §7.
* **Page Transitions** (Site Settings > Page Transitions) : effets entre deux pages + **préchargeur (preloader)** [C]. Contenu détaillé non relu → [N].
* **Interactions** (article `interactions`) : l'article existe dans le centre d'aide ; **non lu** → [N]. Voir `docs/ELEMENTOR_INTERACTIONS.md` du projet pour le point de vue interne.

## 9. Respect de « prefers-reduced-motion » (réduire les animations)

* **[C]** Elementor **respecte la préférence « réduire les animations »** du visiteur : si elle est active (Mac : Préférences Système > Accessibilité > Affichage > Réduire les animations ; iOS : Réglages > Accessibilité > Réduire les animations ; Windows 10 : Facilité d'accès > Affichage > Afficher les animations), **les effets de mouvement sont désactivés** pour ce visiteur. L'article cite cela pour les **animations d'entrée** et les **effets de mouvement**.
* **[N]** Ce que cela couvre exactement : effets de défilement, effets souris, sticky, animations au survol, compteurs, vidéo de fond, diaporama de fond, Lottie, transitions de page. L'article ne le précise pas. **Ne pas affirmer que tout est désactivé.**
* **[K]** Kolakisa devrait faire **au moins autant** : respecter `prefers-reduced-motion: reduce` pour toute animation (entrée, défilement, souris, survol animé, compteur, diaporama), vidéo de fond sans lecture auto, et tester chaque cas.

## 10. Recommandations pour un pied Kolakisa [K]
* Obligatoire : 3 appareils avec héritage, direction/largeur/ordre/masquage par appareil, typographie par appareil, animation d'entrée simple (fondu/glissement) avec réduction de mouvement.
* Souhaitable : points de rupture personnalisables (au moins la valeur de la tablette/mobile), animation au survol, compteur.
* Reporter : parallaxe et effets souris (coût performance, pas de besoin de pied), sticky de pied, transitions de page.
