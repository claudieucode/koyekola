# Patterns d'interaction professionnels — Kolakisa Motion Studio

_Rédigé le 2026-11-05. Les patterns sont des recettes de composition construites à partir des composants (IDs T/V/S/U/D/L/G/X de `WEB_MOTION_COMPONENTS_CATALOG.md`) et des effets (IDs E de `WEB_MOTION_EFFECTS_CATALOG.md`). Les références techniques citées sont celles de la section « Sources consultées ». Les usages « sites d'agence / Awwwards » sont des tendances générales : la source ouverte (liste Awwwards « animations ») donne des étiquettes (parallax, scroll horizontal, microinteractions, WebGL, GSAP…) mais pas de description site par site._

**Règles communes à tous les patterns**
1. Le contenu est lisible et complet sans animation (mouvement réduit, JS coupé, lecteur d'écran).
2. Une seule intention de mouvement par écran : un élément principal anime, les autres soutiennent.
3. Durées de la charte Kolakisa 120 / 180 / 260 ms pour l'interface ; jusqu'à ~800 ms–1,2 s pour les révélations éditoriales (hors interface), une seule famille de courbes.
4. Mobile : on simplifie (pas de survol, épinglages remplacés par empilement, particules/3D coupés ou statiques).
5. Chaque pattern expose 3 réglages à l'utilisateur : **Intensité** (douce / normale / forte), **Vitesse**, **Désactiver sur** (mobile / tablette / bureau) — ce dernier existe déjà (`data-kw-fx-off`).

---

## P1. Hero animé
- **Composition** : titre (T01/T03), sous-titre, 1 ou 2 boutons (U01), média (image masquée V12, vidéo V19 ou Lottie V05), indicateur de défilement (U25).
- **Mouvement** : séquence d'entrée en cascade ≤ 1 s (E10/E11) : média d'abord (masque qui s'ouvre), titre par ligne (E23), sous-titre et boutons en fondu-glisse. Parallaxe souris douce sur 2 couches (E54) en option.
- **Contrôles** : style d'entrée (3 à 5 presets), délai de départ, durée totale, activer la parallaxe, média de repli mobile.
- **Responsive** : mobile = entrée simple (fondu + glisse 12–16 px), pas de parallaxe souris, vidéo remplacée par image si économie de données.
- **Usages** : page d'accueil, page de lancement, page d'offre.
- **Kolakisa** : briques existantes (`animatedheading`, entrées `motion.js`, effet souris, masque, `video`) ; manque la cascade et la séquence (E10/E11) et le découpage de texte (T03).

## P2. Texte cinétique
- **Composition** : un grand titre ou une phrase-manifeste.
- **Mouvement** : (a) lignes qui montent d'un masque ; (b) mots qui se colorent au défilement (T24/E27) ; (c) texte qui s'étire ou s'incline selon la vitesse de scroll (E35, plafonné) ; (d) mots qui tournent (T09).
- **Contrôles** : mode, couleur de départ/fin, vitesse, intensité du skew (max faible).
- **Responsive** : réduire la taille des lettres et le stagger ; couper le skew sur mobile.
- **Précaution** : accessibilité — copie lisible par lecteur d'écran (le découpage de type SplitText ajoute `aria-label` et masque les enfants, source S9 du fichier d'effets) ; pas de clignotement.
- **Usages** : manifeste d'agence, intro de portfolio.

## P3. Révélation au scroll
- **Composition** : tout bloc (texte, image, carte, groupe).
- **Mouvement** : fondu + glisse 20–28 px (comme `slide-up` actuel), ou masque `inset` pour images (E36). Déclenchement à ~20 % de visibilité avec marge basse (IntersectionObserver `threshold`, `rootMargin`), une seule fois.
- **Contrôles** : preset, direction, délai, « rejouer à chaque passage ».
- **Responsive** : distances divisées par deux sur mobile.
- **Usages** : défaut de tout le site ; la cascade (E10) pour les groupes.
- **Kolakisa** : couvert par les entrées existantes ; ajouter « cascade des enfants » (L17).

## P4. Produit en séquence (scroll sequence)
- **Composition** : zone épinglée plein écran (sticky), canvas avec N images (rotation d'un produit), 3 à 5 textes qui apparaissent aux jalons.
- **Mouvement** : l'avancement du scroll sélectionne l'image ; textes en fondu à des plages données.
- **Contrôles** : dossier d'images, nombre, longueur de scène (en écrans), jalons de texte, couleur de fond.
- **Responsive** : mobile = moins d'images (1 sur 2), longueur réduite, ou carrousel de 4 vues.
- **Précautions** : poids (centaines de Ko × N) → pré-chargement progressif, formats modernes ; `position: sticky` casse si un ancêtre a `overflow` (voir MDN `position`).
- **Usages** : lancement produit, objets physiques.
- **Kolakisa** : **Absent** (S04). Briques proches : sticky, effets de défilement.

## P5. Storytelling (récit en chapitres)
- **Composition** : colonne de texte qui défile + visuel collant (S03), ou fonds qui changent par chapitre (E62), sommaire latéral (S21).
- **Mouvement** : changement de visuel en fondu/masque à chaque chapitre ; barre de progression.
- **Contrôles** : chapitres (titre, texte, média), côté du visuel, couleur par chapitre.
- **Responsive** : visuel au-dessus du texte, non collant ; chapitres empilés.
- **Usages** : histoire de marque, étude de cas, page « comment ça marche ».

## P6. Galerie et portfolio
- **Composition** : grille filtrable (S17), lightbox plein écran (S16), image au survol sur liste de projets (X07), image trail en option (X02).
- **Mouvement** : survol = zoom 1,03–1,06 + légende qui monte ; filtre = réarrangement FLIP (E106) ; ouverture = transition partagée.
- **Contrôles** : colonnes (1–12 existant), ratio, filtres, effet de survol, légende.
- **Responsive** : survol remplacé par toucher → ouverture ; 1–2 colonnes sur mobile.
- **Précaution** : lazy-loading, tailles d'images, focus clavier dans la lightbox.
- **Kolakisa** : `gallery` (dispositions, filtres, légendes, visionneuse) **Existant** ; manque l'image au survol et la transition de filtre.

## P7. Carrousel
- **Composition** : piste de slides, flèches, puces, option auto.
- **Mouvement** : défilement natif avec calage (`scroll-snap-type: x mandatory`, `scroll-snap-align`, `scroll-snap-stop: always` pour ne pas sauter plusieurs vues — source MDN scroll snap) ; inertie au glisser.
- **Contrôles** : slides par vue (par largeur d'écran), boucle, lecture auto + pause visible, indicateurs.
- **Responsive** : 1,2 slide visible sur mobile (indice de continuité) ; zones tactiles ≥ 44 px.
- **Précaution** : lecture auto = toujours mettable en pause ; `prefers-reduced-motion` coupe l'auto.
- **Kolakisa** : **Existant** (`carousel`, `mediacarousel`, `slides`, `testimonialcarousel`). Possible ajout : coverflow 3D (D07).

## P8. Menu plein écran
- **Composition** : bouton (burger → croix), overlay plein écran, grands liens, infos de contact, réseaux sociaux.
- **Mouvement** : ouverture par rideau (`clip-path` ou translate) ≤ 260–400 ms, liens en cascade (E10), roll de texte au survol (E31). Fermeture Échap.
- **Contrôles** : sens du rideau, fond, taille des liens, afficher un visuel d'aperçu au survol d'un lien.
- **Responsive** : c'est le menu par défaut sur mobile ; sur grand écran, option.
- **Précautions** : focus piégé, `aria-expanded`, scroll de page verrouillé, fermeture à la navigation.
- **Kolakisa** : **Incomplet** (`menu`, `modal`). Priorité P0.

## P9. Navigation (barre du haut)
- **Composition** : logo, liens, CTA.
- **Mouvement** : rétrécit au scroll descendant, se masque en descendant et réapparaît en remontant, soulignement actif qui glisse entre liens.
- **Contrôles** : mode de comportement, seuil, fond au scroll (transparent → plein).
- **Responsive** : barre compacte sur mobile ; ne jamais recouvrir les ancres (décalage d'ancre).
- **Kolakisa** : `headerFx` (rétrécir, plein au défilement) **Existant** ; « masquer en descendant / montrer en remontant » et indicateur glissant à vérifier/ajouter.

## P10. Cartes
- **Composition** : image, titre, texte, lien.
- **Mouvement** : élévation + ombre au survol ; tilt 3D avec reflet (D05) ; bordure lumineuse suiveuse (X06) ; les autres cartes s'estompent (E112) ; pile de cartes collante (S14).
- **Contrôles** : type d'effet, intensité, angle max.
- **Responsive** : au tactile : état « pressé » seulement ; pas de tilt.
- **Kolakisa** : survols et inclinaison souris **Existants** ; reflet, bordure lumineuse, pile **Absents**.

## P11. Boutons et liens
- **Composition** : texte + icône.
- **Mouvement** : remplissage qui entre depuis le côté, flèche qui glisse, soulignement dessiné (U04), aimant (U02), curseur « Voir » (U03).
- **Contrôles** : effet, couleur de remplissage, durée (≤ 180 ms pour l'interface), force de l'aimant.
- **Responsive** : cible 44 px ; aimant et curseur uniquement avec pointeur fin.
- **Précaution** : focus visible aussi net que le survol.

## P12. Infographies
- **Composition** : schéma SVG, chiffres, légendes.
- **Mouvement** : tracés qui se dessinent (V03), chiffres qui montent (G01), éléments révélés dans l'ordre de lecture ; survol pour détails.
- **Contrôles** : ordre, durée, couleurs depuis les jetons.
- **Responsive** : version verticale simplifiée sur mobile ; textes jamais dans l'image seule.
- **Précaution** : alternative texte complète.
- **Kolakisa** : **Absent** (S09) ; briques `counter`, `progress`.

## P13. Diagrammes
- **Composition** : nœuds, flèches, étapes numérotées.
- **Mouvement** : flèches qui se tracent d'étape en étape au scroll (ou clic « suivant »), étape active mise en évidence.
- **Contrôles** : étapes, mode (auto / au clic / au scroll).
- **Responsive** : défilement horizontal du diagramme ou version en liste.
- **Kolakisa** : **Absent** (S10) ; `timeline` couvre le cas linéaire.

## P14. 3D
- **Composition** : modèle .glb ou séquence 360°, boutons de variantes, repli image.
- **Mouvement** : rotation lente auto, glisser pour tourner, changement de couleur animé.
- **Contrôles** : modèle, éclairage préréglé, rotation auto, zoom autorisé.
- **Responsive** : résolution plafonnée, repli image si appareil modeste/économie de données (signaux déjà lus par `kb-motion.js`), chargement uniquement à l'approche.
- **Précaution** : poids (>1 Mo à annoncer), le chargement ne doit pas bloquer la page ; page Three.js non lue (404) → points techniques **non vérifiés**.
- **Kolakisa** : **Absent** ; plan conseillé : d'abord CSS 3D (tilt, flip, coverflow) puis séquence d'images, 3D réelle en dernier.

## P15. Pages de lancement produit
- **Composition** : hero, bénéfices (bento animé S24), démonstration (séquence P4), preuve sociale (marquee de logos, avis), compte à rebours + liste d'attente, FAQ (accordéon).
- **Mouvement** : cascade à l'entrée, scènes épinglées pour la démo, compteur de chiffres clés, bouton d'inscription collant en bas sur mobile.
- **Contrôles** : date de lancement, formulaire, message de fin.
- **Responsive** : parcours linéaire, un seul CTA répété.
- **Kolakisa** : `countdown`, `signupform`, `accordion`, `marquee`, `testimonialcarousel` **Existants** ; assembler en modèle de page « Lancement ».

## P16. Éditorial et portfolio
- **Composition** : grands titres, images pleine largeur, légendes, citations.
- **Mouvement** : lignes qui montent, images qui se dévoilent par masque, parallaxe d'image douce (V14), scroll horizontal pour une série (S15), pied de page révélé (X16), curseur contextuel (X03).
- **Contrôles** : rythme (calme / énergique), parallaxe on/off, type de transition de page.
- **Responsive** : tout en une colonne, images en ratio fixe, pas de scroll horizontal piloté.
- **Usages** : magazines, studios, photographes, architectes.

---

## Tableau de synthèse des manques à combler (par pattern)

| Pattern | Manque principal | Composants/effets à créer | Priorité |
|---|---|---|---|
| Hero | cascade/séquence | L17, E10/E11, S01 | P0 |
| Texte cinétique | découpage de texte | T03–T06 | P0 |
| Révélation | cascade enfants | L17, L04, L05 | P0 |
| Produit séquence | scroll sequence | S04, E137 | P1 |
| Storytelling | scène épinglée | S02, S03, E69 | P0/P1 |
| Galerie | image au survol, FLIP | X07, E106 | P1 |
| Menu plein écran | rideau + cascade | U06 | P0 |
| Cartes | reflet, pile | D05, S14 | P0 |
| Boutons | aimant, curseur | U02, U03 | P1 |
| Infographie/diagramme | tracé SVG | V03, S09, S10 | P0/P2 |
| 3D | tout | D03 puis D02 | P1/P2 |
| Lancement | modèle de page | assemblage | P1 |

## Sources consultées

Ouvertes avec WebFetch le 2026-11-05 et utilisées ici :
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap (carrousel, galerie)
- https://developer.mozilla.org/en-US/docs/Web/CSS/position (sticky, limites)
- https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver (révélation)
- https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path (rideaux, masques)
- https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API (transitions de pages)
- https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline/view (animations liées au scroll)
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion (accessibilité)
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/ (pin, scrub, snap)
- https://gsap.com/docs/v3/Plugins/SplitText/ (découpage et accessibilité)
- https://lenis.dev/ (inertie, synchronisation WebGL/DOM)
- https://rive.app/docs/runtimes/web/web-js (animations interactives)
- https://www.awwwards.com/websites/animations/ (étiquettes seulement)
- https://web.dev/articles/animations-guide (performance)

Échecs : https://threejs.org/manual/en/fundamentals.html (404), https://tympanus.net/codrops/ (403) : rien n'en est cité comme vérifié.
Sources internes : voir les deux autres fichiers de ce dossier.
