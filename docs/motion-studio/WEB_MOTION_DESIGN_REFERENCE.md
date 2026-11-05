# Motion design web : référence pour Kolakisa Motion Studio

Date de recherche : 2026-11-05. Toutes les sources sont listées dans `MOTION_STUDIO_SOURCES.md` (numéros [S..]).
Règle : un fait sans source consultée est marqué **non vérifié**. Les passages "recommandation Kolakisa" sont des choix de conception, pas des faits sourcés.

## 1. Définition

Le motion design web est l'usage du mouvement (position, taille, opacité, forme, couleur, tracé) dans une page ou une application pour guider l'attention, donner du retour à l'utilisateur et raconter. Il s'appuie sur les principes de l'animation classique, notamment les 12 principes de Disney exposés par Ollie Johnston et Frank Thomas dans *The Illusion of Life* (1981) [S19].

Définition de travail : non vérifiée comme citation, c'est une synthèse (aucune source unique ne définit "motion design web").

## 2. Vidéo ou interactif

| Critère | Vidéo (MP4/WebM, GIF animé) | Interactif (CSS, JS, SVG, Lottie, Rive, WebGL) |
|---|---|---|
| Réaction à l'utilisateur | Non | Oui (survol, scroll, clic) |
| Poids | Souvent élevé, dépend de la durée | Faible pour CSS/SVG ; plus lourd pour wasm/3D (voir technologies) |
| Netteté | Pixels, dépend de la résolution | Vectoriel (SVG, Lottie, Rive) donc net à toute taille |
| Accessibilité | Lecteur à contrôles ; pause nécessaire si > 5 s auto | Contrôle fin possible (prefers-reduced-motion) |
| Rendu cinématographique | Total (After Effects, 3D) | Limité par ce que le navigateur peut calculer |

Recommandation Kolakisa : vidéo pour les scènes cinématographiques complexes (fond de héros), interactif pour tout ce qui répond à l'utilisateur. Le choix est une décision de conception, non sourcée.

Un point sourcé : Lottie ne gère pas vidéo, séquences d'images ni audio [S28]. Pour ces contenus il faut donc une vidéo.

## 3. Principes

### 3.1 Timing et durée
- NN/g : la plupart des animations d'interface durent 100 à 500 ms, typiquement 100 à 400 ms. Retour simple (case à cocher) environ 100 ms ; changement important (fenêtre modale) 200 à 300 ms ; 400 ms réservés aux grands déplacements. Règle : "le temps le plus court qui ne soit pas brusque". Les animations sont plus souvent trop longues que trop courtes [S20].
- Les éléments qui entrent sont un peu plus longs que ceux qui sortent (exemple NN/g : 300 ms à l'apparition, 200 à 250 ms à la disparition) [S20].
- Les animations fréquentes doivent être plus courtes et plus discrètes [S20].

### 3.2 Easing (courbes d'accélération)
- Le mouvement linéaire paraît peu naturel [S20].
- ease-out : le plus courant pour les éléments qui entrent (réactif, l'oeil se pose). ease-in pour les sorties, ease-in-out possible [S20].
- Disney : "Slow in and slow out" et "Arc" (trajectoires courbes) [S19].
- La page Material Design 3 "Easing and duration" a été ouverte, mais le contenu extrait ne donnait pas les valeurs précises : **valeurs Material non vérifiées**, non reprises ici [S21].

### 3.3 Anticipation
Mouvement préparatoire (le recul avant un saut) qui prépare le spectateur à l'action [S19]. Usage web : léger recul d'un bouton avant son action, léger déplacement inverse avant un panneau qui s'ouvre.

### 3.4 Rythme (timing et spacing, enchaînement)
Le "timing" fixe la vitesse et exprime poids, humeur, personnalité [S19]. "Follow through / overlapping action" : les parties moins lourdes continuent après l'arrêt du corps principal, avec des timings décalés [S19]. Sur le web cela se traduit par des décalages (stagger) entre éléments d'une liste. La bibliothèque Motion fournit `stagger()` [S3].

### 3.5 Hiérarchie
"Staging" : présenter l'idée clairement, garder l'attention sur l'essentiel [S19]. "Secondary action" : les mouvements secondaires soutiennent sans voler l'attention [S19]. Recommandation Kolakisa : un seul élément principal animé à la fois par zone visible, le reste en second plan plus discret (non sourcé).

### 3.6 Spécifier une animation
NN/g : définir le déclencheur, les propriétés qui changent, la durée et l'easing ; transmettre une chronologie en ms avec les courbes, pas seulement une vidéo [S20]. Cette règle est adoptée pour le format de données de Motion Studio.

## 4. Animation décorative, fonctionnelle, narrative

Classification de travail Kolakisa (synthèse, non issue d'une source unique) :

| Type | But | Exemples | Règle |
|---|---|---|---|
| Fonctionnelle | Retour, orientation, état | survol de bouton, chargement, transition de page (View Transitions), indicateur de progression de lecture | courte (100 à 300 ms), toujours conservée en version réduite |
| Narrative | Raconter au rythme du défilement | révélation de sections, tracé de ligne, séquence produit | désactivable, remplacée par un état final statique en mouvement réduit |
| Décorative | Ambiance | fonds animés, particules, flottements | première à supprimer en mouvement réduit ; pause obligatoire si auto > 5 s (2.2.2) |

Le web.dev/Chrome cite des cas d'usage de scroll-driven animations : indicateurs de lecture, parallaxe, apparition à l'entrée dans l'écran, révélations par clip-path, cartes empilées en sticky [S17].

## 5. Pratiques des sites haut de gamme

Limite : je n'ai pas ouvert d'étude d'un échantillon de sites primés (Awwwards, etc.). Les points ci-dessous sont donc soit sourcés par des documents techniques, soit **non vérifiés** comme "pratiques du secteur".

Sourcé :
- Défilement fluide avec Lenis : bibliothèque qui enveloppe le défilement natif (sticky, ancres, accessibilité conservés), synchronisable avec GSAP ScrollTrigger et WebGL, respecte `prefers-reduced-motion` par défaut [S13].
- Texte découpé en lignes/mots/caractères pour des révélations : GSAP SplitText, avec `aria-label` automatique et masques pour les révélations [S15].
- Épinglage et "scrub" liés au défilement : ScrollTrigger [S14].
- Transitions entre pages : View Transition API (même document et entre documents) [S8].
- Animations liées au scroll natives, hors thread principal : CSS scroll-driven animations [S17].
- Mises en garde NN/g : prudence avec parallaxe et scroll-jacking (vertiges, migraines) [S20].

Non vérifié : "les sites haut de gamme utilisent surtout GSAP + Lenis + WebGL", tendance affirmée sans source ouverte.

## 6. Accessibilité

### 6.1 WCAG 2.2
- **2.2.2 Pause, Stop, Hide (niveau A)** : un contenu en mouvement, clignotant ou défilant qui démarre automatiquement, dure plus de 5 secondes et est présenté avec d'autres contenus doit pouvoir être mis en pause, arrêté ou masqué (sauf si essentiel). Pour les contenus qui se mettent à jour automatiquement, pas de seuil de 5 s [S24].
- **2.3.1 Three Flashes or Below Threshold (niveau A)** : pas plus de 3 flashs par seconde, ou sous les seuils généraux et rouge [S25]. Vaut pour la page entière.
- **2.3.3 Animation from Interactions (niveau AAA)** : une animation de mouvement déclenchée par une interaction peut être désactivée, sauf si essentielle. Techniques suffisantes citées : C39 (CSS `prefers-reduced-motion`) et SCR40 (même requête en JavaScript). La parallaxe et le mouvement dû au scroll sont cités en exemple [S23].
- Le critère 2.3.2 (Three Flashes, AAA) n'a pas été ouvert : **non vérifié**.

### 6.2 prefers-reduced-motion
- Valeurs `no-preference` et `reduce`. Disponible dans tous les navigateurs depuis janvier 2020 (Baseline "Widely available") selon MDN. L'équivalence `@media (prefers-reduced-motion)` = `reduce` [S11].
- Réglages OS : macOS, Windows, iOS, Android, GNOME, KDE (liste complète dans [S11]).
- MDN recommande de supprimer, réduire ou remplacer le mouvement (par exemple un fondu au lieu d'un zoom) [S11].
- La Web Animations API et SMIL : MDN conseille d'offrir une pause/désactivation et de respecter `prefers-reduced-motion` [S9][S10].

Exemple CSS tiré de MDN, adapté : `@media (prefers-reduced-motion: reduce) { .x { animation: none; } }` [S11][S12].

### 6.3 Règles Kolakisa proposées (recommandation)
1. Chaque animation du studio a une variante "mouvement réduit" (état final ou fondu court).
2. Toute animation automatique de plus de 5 s ou en boucle propose un bouton pause (2.2.2).
3. Aucun flash : plafond de 3 par seconde (2.3.1).
4. Pas de scroll-jacking par défaut ; le défilement fluide est une option.
5. Le texte découpé garde un `aria-label` (comportement natif de SplitText [S15] ; à reproduire si on code soi-même).
6. View Transitions : MDN signale des risques d'orientation et de focus si ancien et nouveau contenu coexistent ; l'API est conçue pour les limiter [S8].

## 7. Performance

- Animer de préférence `transform` et `opacity` : restent au niveau compositeur, évitent layout et paint. Éviter `top`/`left`. Utiliser `will-change` avec parcimonie, ajouté juste avant le changement puis retiré [S16].
- MDN : CSS et JS sont à peu près équivalents sur le thread principal, mais CSS gagne quand l'animation peut être échantillonnée hors du thread principal (transform sur calque dédié, GPU) ; utiliser `requestAnimationFrame` pour le JS complexe [S18].
- Les timelines de scroll-driven animations permettent de faire tourner ces animations hors du thread principal, contrairement aux écouteurs `scroll` [S17].
- Dans les animations CSS, éviter les propriétés qui affectent le modèle de boîte (exemple MDN : `scale` plutôt que `font-size`) [S12].
- `animation-fill-mode: forwards` se comporte comme `will-change`, peut laisser un contexte d'empilement [S12].
- Outil de mesure cité : compteur FPS de Chrome DevTools [S16].
- Poids des bibliothèques : voir `WEB_MOTION_TECHNOLOGIES.md` (mesures du 2026-11-05).
- Chargement à la demande, auto-hébergement, budget par page : recommandations Kolakisa (voir stack retenue).
