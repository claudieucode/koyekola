# Motion Studio : contrat des composants (lot 0)

Ce document est la référence pour ajouter un composant animé. Composant de référence : `motion-split-text` (texte animé). Plan d'ensemble : `MOTION_STUDIO_IMPLEMENTATION_MATRIX.md`. Moteur existant (entrées, défilement, souris) : `docs/MOTION-ENGINE.md`.

## Décision de technique (v1)

Pas de bibliothèque d'animation. Runtime maison sur **CSS + Web Animations API** (`element.animate`). Raisons : aucune licence à examiner (GSAP exclu en attendant un avis juridique), aucun poids ajouté (runtime ~9 ko, module split-text ~4 ko), aucune dépendance npm. Si un composant futur exige une bibliothèque (dotLottie, Rive, 3D), elle reste un module chargé à la demande, auto-hébergé (`public/js/vendor/`).

## Vue d'ensemble

```
widgets/motion-<nom>.js   fiche du widget + bloc `motion` (module, effets, réglages)      → src/marketing/pages/widgets/
motion-<nom>.ejs          gabarit : contenu final lisible SANS JavaScript                    → views/marketing-public/widgets/
<module>.js               module d'exécution (KWMS.register)                                  → public/js/motion-studio/
motion-studio.css         styles du composant (bloc kw-ms-<nom>)                              → public/css/ (un seul fichier partagé)
```

Auto-découverte : `widgets/index.js` charge tous les `*.js` du dossier `widgets/` (rien à enregistrer à la main). La page n'emporte `motion-studio.css`, `kw-motion-studio.js` et les modules **que si elle contient un composant ou un réglage Motion Studio** (`page.motionStudio`, calculé dans `landing/index.js`, lu par `landing.ejs`). Une page sans motion n'a aucun octet de plus.

## 1. Fiche du widget (`widgets/motion-<nom>.js`)

Comme tout widget personnalisé (`docs/widgets-personnalises.md`), avec ces règles :

* `type` : `motion` + nom en minuscules sans tiret (ex. `motionsplittext`) — la regex de `widgets/index.js` interdit les tirets dans `type`.
* `template` : `motion-<nom>` (tirets permis pour le gabarit) → `views/marketing-public/widgets/motion-<nom>.ejs`.
* `group: "advanced"` par défaut, `style: "text"` ou `"box"`.
* `schema` : **contenu et options statiques** (texte, balise, découpage…). Affichés dans la section « Contenu » du panneau.
* `motion` (nouveau, validé au démarrage par `motionStudio.checkSpec`) :

```js
motion: {
  module: "split-text",                       // fichier public/js/motion-studio/split-text.js (doit exister)
  presets: [["fade-up", "Fondu montant"], …], // effets proposés (liste fermée, 1 à 40) ; facultatif
  defaults: { preset: "fade-up", trigger: "viewport", duration: 700, delay: 0, easing: "smooth", stagger: 40 }, // facultatif
  controls: ["preset","trigger","duration","delay","easing","stagger","repeat","scrub"], // réglages COMMUNS affichés ; défaut : tous
  params: [{ key: "from", kind: "select", label: "…", options: [["start","…"]], default: "start" }], // réglages propres (select / number / bool), 12 au plus
}
```

Réglages communs possibles (`controls`) : `preset, trigger, duration, delay, easing, stagger, iterations, direction, repeat, scrub`. N'affichez que ceux qui ont un sens : le panneau n'en montre pas d'autres.

## 2. Schéma `node.motion.studio` (v1)

Rangé à côté de `motion.entrance/scroll/…`, validé dans `normalizeMotion` (`nodes.js`) par `motionStudio.normalize`.

```
studio: { v: 1, preset?, trigger?, duration?, delay?, easing?, stagger?, iterations?, direction?, repeat?, scrub?, off?, rm?, alwaysMotion?, params? }
```

| Clé | Valeurs | Remarque |
|---|---|---|
| `v` | 1 | absent = 1 ; supérieur à la version connue = tout le bloc ignoré |
| `preset` | un id de `motion.presets` du widget | retiré sinon |
| `trigger` | `viewport` (défaut), `load`, `click`, `hover`, `scroll` | `scroll` : la progression est celle du défilement, répétition ignorée |
| `duration` / `delay` / `stagger` | entiers ms : 50–10000 / 0–10000 / 0–1000 | |
| `easing` | noms de `motion.EASINGS` ou `cubic-bezier(a,b,c,d)` borné | |
| `iterations` / `direction` | 1–10 ou `"infinite"` / `normal, reverse, alternate, alternate-reverse` | |
| `repeat` | true | rejouer à chaque retour à l'écran |
| `scrub` | `{start 0–99, end 1–100}` (%) | plage de défilement (trigger `scroll`) |
| `off` | sous-ensemble de `desktop, tablet, mobile` (jamais les trois) | écrans où l'animation est coupée |
| `rm` | `fade` (défaut absent = aucune animation) | comportement si l'appareil demande moins de mouvement |
| `alwaysMotion` | true | ignore la préférence système (déconseillé) |
| `params` | clés de `motion.params` du widget | valeurs bornées / dans les options |

Règles : les valeurs égales au défaut ne sont pas écrites ; toute valeur invalide est retirée **sans erreur** (comme le reste de `normalizeMotion`) ; la normalisation est idempotente. **Migration** : ajouter `MIGRATIONS[1] = (v1) => v2` dans `motionStudio.js`, passer `CURRENT` à 2 ; `normalize` enchaîne. Aucune migration aujourd'hui.

Rendu serveur (`motionAttrs`) : pour un composant `motion`, **toujours** `data-kw-ms-module="<module>"` et `data-kw-ms='<JSON des réglages EFFECTIFS>'` (défauts du widget + réglages enregistrés : le runtime ne connaît pas les défauts du serveur). `data-kw-motion-always` si `alwaysMotion`.

## 3. Gabarit EJS

Variables : `p`, `cls`, `attrs` (à mettre sur la racine : contient `data-kw-ms-*`), `L`, `isBuilder`.

* Racine : `class="<%= cls %> kw-ms kw-ms-<nom>"` + `<%- attrs %>`.
* **Le contenu final complet est dans le HTML** (sans JavaScript, tout est lisible et visible). Le module le transforme ensuite ; `destroy()` le restitue.
* Jamais d'état « caché » écrit par le serveur. Pas de `style=""` libre. `<%= %>` pour tout texte.
* Toute classe `kw-ms-*` utilisée doit avoir une règle dans `motion-studio.css` (test automatique).

## 4. Module d'exécution (`public/js/motion-studio/<module>.js`)

Format UMD (testable sous Node) qui appelle `KWMS.register("<module>", init)` si `KWMS` existe. Chargé **à la demande** par le runtime, même origine, avec l'adresse à empreinte écrite par le serveur (`<script id="kw-ms-modules">`).

```js
function init(ctx) {
  // ctx.el, ctx.cfg (réglages effectifs), ctx.opts (data-kw-ms-opts), ctx.mode ("public" | "editor"), ctx.reduced, ctx.bp ("desktop"|"tablet"|"mobile"), ctx.doc, ctx.win
  // ctx.animate(cible, keyframes, { delay?, duration?, easing? })  → Animation créée EN PAUSE, état de départ tenu (fill both) ; durée, délai, courbe, répétition, sens viennent des réglages
  // ctx.stagger(i, n)       → retard de cascade (ms) selon stagger + params.from, plafonné à 4 s au total
  // ctx.onCleanup(fn)       → nettoyage à la destruction
  // ctx.onResize(fn)        → appelé (anti-rebond) quand la largeur de l'élément change ; ctx.rebuild() reconstruit en gardant l'état « déjà joué »
  if (ctx.reduced) return {};           // mouvement réduit : ne rien transformer
  …                                     // transformer le DOM, créer les animations avec ctx.animate
  return { destroy() { /* restituer le DOM d'origine */ } /*, play?, pause?, seek?(ms) */ };
}
```

Le **runtime** (`kw-motion-studio.js`) fait tout le reste : déclencheurs (`viewport` via IntersectionObserver, `load`, `click`, `hover`, `scroll` avec progression), mouvement réduit (`prefers-reduced-motion` sauf `alwaysMotion` / `data-kw-motion-always` ; `rm: "fade"` = fondu de 160 ms), écrans coupés (`off`) et changement de point de rupture (767 / 1023 px, réactivation sans rechargement), nettoyage, erreurs (module introuvable ou en échec : `data-kw-ms-state="error"`, le contenu reste affiché). États : `ready`, `reduced`, `off`, `error`.

Règles d'animation : animer **des éléments internes** avec `opacity`, `transform`, `filter` (jamais `transform` sur la racine du nœud : `--kw-tf` et les propriétés `translate/scale/rotate` de `kw-effects.js` y vivent ; jamais width / height / top / left / margin / padding). Boucle > 5 s : proposer une pause. Pas plus de 3 flashs par seconde.

## 5. Éditeur

* **Panneau** `public/js/page-builder-motion-studio.js` : pour tout widget qui a `motion`, `nodeContentFields` délègue au panneau (six sections repliables : Contenu = champs du `schema`, Style = renvoi vers l'onglet Style, Animation, Interactions, Responsive, Avancé). Les sections n'affichent que ce que `motion.controls` / `motion.params` déclarent. Toute modification passe par `change()` avec `key` (annuler / rétablir). **Un nouveau composant n'écrit aucun JavaScript d'éditeur.**
* **Canevas** : le canevas rend la page avec le même gabarit ; le runtime y démarre en **mode éditeur** (`ctx.mode === "editor"`) : aucun déclencheur, état final visible, et un `MutationObserver` initialise les éléments remplacés par `patchCanvas`. Le panneau pilote `iframe.contentWindow.kwMotionStudio` : `play(id)`, `pause(id)`, `resume(id)`, `seek(id, ms)`, `stop(id)`, `duration(id)`, `state(id)`.
* L'éditeur reçoit la fiche du composant dans `SPEC.types[].motion` et les listes communes dans `SPEC.motionStudio` (`editorSpec`).

## 6. Tests à écrire pour un composant

1. `tests/motion-studio.test.js` (modèle, rendu, auto-découverte) : la boucle « contrat des composants » couvre déjà tout `widgets/motion-*.js` (enregistrement, gabarit, module, classes stylées). Ajouter : valeurs par défaut de la fiche, rendu EJS (contenu complet, échappement), fonctions pures du module.
2. `tests/motion-studio-navigateur.test.js` (Chrome réel, ignoré sans Playwright : `NODE_PATH=<dossier>/node_modules`) : texte/contenu accessible, animation exécutée, déclencheurs, écrans, mouvement réduit, sans JavaScript, 320 / 768 / 1920 sans débordement, insertion + panneau + annuler + canevas.
3. Lancer aussi : `tests/moteur-mouvement.test.js`, `tests/editeur-conformite-widgets.test.js`, `tests/editeur-widgets-personnalises.test.js`, `tests/widgets-contrat.test.js`.

## 7. Limites connues du lot 0

* Pas de minification des nouveaux fichiers (`perfEngine/minify.js` : liste blanche de 4 fichiers, figée par `tests/programme22-9-minify.test.js`).
* Les composants dans l'en-tête / le pied du Theme Builder (`themeRender.js`) ne reçoivent pas encore la feuille `motion-studio.css` ni le runtime.
* Les points de rupture du runtime sont ceux par défaut (767 / 1023), pas ceux réglés par le site.
* Avant JavaScript, un composant en `viewport` est visible puis passe à l'état de départ au démarrage du script (léger clignotement possible).
* Pas de type de champ JSON/timeline pour le schéma des widgets (lot 3, `motionScenes`).

## Lot 3 : scènes (timeline), transitions de page et de sections, défilement fluide

Réglages **de la page** (pas d'un élément), rangés dans `theme.motionScenes` : colonne JSON `theme` déjà existante (comme `layout` et `scrollSnap`), donc **aucune migration SQL** ; brouillon, publication, historique des versions, restauration, copie de page et annulation de l'éditeur le transportent déjà. Validation : `src/marketing/pages/motionScenes.js` (appelée par `normalizeContent`).

```
motionScenes: { v: 1, scenes?: [scène], pageTransition?: { type: fade|slide|zoom|off, duration? 100-1500 },
                sectionTransition?: { type: fade-in|wipe-up|wipe-right, duration? 200-1500 }, smoothScroll?: { on: true, strength? 1-10, anchors?: false } }
scène : { id, name?, trigger?: viewport|load|click|scroll, anchor?, repeat?, scrub?: {start,end}, off?: [écrans], steps: [pas] }   (12 scènes, 40 pas au plus)
pas   : { id, target, effect?, at? 0-30000, duration? 50-10000, delay? 0-10000, easing?, sync?: idPas, after?: idPas }
```

* Début d'un pas = base + `delay`, base = début du pas `sync`, fin du pas `after`, sinon `at` ; un lien inconnu ou en boucle est retiré. Calcul commun serveur / éditeur / page : `public/js/motion-studio/scenes-core.js`.
* `target` / `anchor` = identifiant d'élément de la page. Élément absent : le pas est retiré et le serveur renvoie `{ kind: "scene_target", sceneId, target, message }` dans `warnings` ; l'éditeur nettoie son document (`pbMotionTimeline.heal`).
* Effets : liste fermée (`scenes-core.js`, `EFFECTS`), `transform` en composition `add` (ne remplace jamais `--kw-tf` ni les propriétés de `kw-effects.js`). Transitions de sections : effets sans `transform` ni `filter` (un bloc de référence casserait les éléments `fixed` / `sticky` d'une section).
* Page publique : `<script id="kw-ms-scenes">` (scènes, transition de sections, défilement fluide) + modules `scenes-core` et `smooth-scroll` chargés à la demande ; une page sans réglage n'a aucun octet de plus. Déclencheurs : visible, chargement, clic, défilement. Mouvement réduit : états finaux sans animation (une sortie est appliquée, une entrée reste à l'état naturel), pas de transition de sections, pas de défilement fluide.
* Transition de page : CSS `@view-transition` (API View Transitions entre documents) émis par la page, **après** celui du site, jamais dans l'éditeur ni en mouvement réduit ; `off` coupe la transition pour cette page. Réglage du site : `siteSettings.transitions` (existant). Désactivée par défaut.
* Défilement fluide : `smooth-scroll.js`, seule la molette est lissée (vrai `scrollTo`), jamais en mouvement réduit ni avec `scroll-snap`, non appliqué dans l'éditeur ; les liens `#ancre` sont animés (désactivable) en tenant compte de `scroll-padding-top`.
* Éditeur : `public/js/page-builder-motion-timeline.js`, onglet « Page » → « Scènes et mouvement ». Lecture sur le canevas : `iframe.contentWindow.kwMotionStudio.scenes` (`set`, `play`, `pause`, `resume`, `seek`, `stop`, `time`, `state`).
* Limites : les éléments d'un composant partagé ne sont pas ciblables ; une scène « au clic » montre d'abord le contenu puis rejoue l'état de départ.

## Lot S : storytelling et sections (12 composants)

Hero animé, Cartes empilées, Histoire collante, Section épinglée à scènes, Galerie à défilement horizontal, Séquence d'images (canvas), Chronologie animée, Étapes de processus, Menu plein écran, Témoignages animés, Bande de logos, Portfolio filtrable. Fiches `widgets/motion-*.js`, modules `hero, card-stack, sticky-story, pin-scenes, h-gallery, scroll-sequence, steps (chronologie + processus), fullscreen-menu, testimonials, logo-marquee, portfolio-grid`, bloc `/* ms:s */` de `motion-studio.css`.

* Patron « statique d'abord » : sans JavaScript, en mouvement réduit ou écran coupé, le composant est une mise en page statique lisible. Le module ajoute `kw-ms-live` ; seul ce sélecteur active `position: sticky` / `fixed` (test automatique).
* Fiche : `motion.preview: false` masque Lire / Pause du panneau pour les composants pilotés par le défilement ou par un clic (rien à lire dans l'éditeur).
* Déclencheur « viewport » : seuil abaissé pour un élément plus haut que 5 fenêtres (`viewportThreshold`).
* Éditeur : les listes d'éléments proposent aussi « Dupliquer l'élément ».
* Limites : 24 images au plus par séquence (plafond des listes) ; le menu plein écran n'est pas actif dans le canevas (liste affichée) ; un ancêtre avec `transform` casserait `position: fixed` du menu ; `overflow` sur un ancêtre casse `sticky`.

<!-- ms:v début -->
## Ajouts du lot « v » (visuels et médias)

* `validate(p, at, h)` reçoit maintenant le contexte d'enregistrement `h` (`h.ctx` : organisation, base, site de la page `pageSiteId`). Un composant qui cite un fichier de la médiathèque appelle `motionVisual.checkMediaPath(src, h, at, { type })` : le chemin doit appartenir à l'organisation ET au site de la page (le fichier doit exister dans `mk_media` et être du bon type).
* `data(ctx, p)` sert aussi à **reconstruire** une donnée sûre au rendu (SVG nettoyé, couleurs validées) : le gabarit ne reçoit jamais le texte brut enregistré (variable `d`).
* Réglages propres au composant qui ne sont pas des réglages d'animation (ex. fichier Lottie, réglages du curseur) : le gabarit les écrit dans `data-kw-ms-opts` (JSON échappé) ; le module les lit dans `ctx.opts`.
* Variantes de style sans JavaScript : le CSS peut lire l'effet effectif dans l'attribut `data-kw-ms` (ex. `[data-kw-ms*='"preset":"fill-slide"']`), ce qui évite d'écrire un état côté serveur.
* Composants **souris seulement** (carte inclinée, bouton magnétique, curseur) : le module sort tout de suite (`return {}`) en tactile (`(hover: hover) and (pointer: fine)` faux), en mouvement réduit et dans l'éditeur.
* Composants sans animation lisible dans l'éditeur : `motion.preview: false` (pas de boutons Lire / Pause factices). Composant piloté par le défilement : `defaults.trigger: "scroll"` et `controls` sans `trigger` (la plage `scrub` reste réglable).
* Déclencheur « défilement » pour un module sans animation Web Animations (Lottie) : créer une animation de repère `ctx.animate(el, [{opacity:1},{opacity:1}], { duration: 1000, noBaseDelay: true })` et traduire `seek(ms)` en progression `ms / 1000`.
<!-- ms:v fin -->

<!-- ms:t begin -->
## Lot T : textes et cascade (12 composants)

Fiches `widgets/motion-*.js` : Titre à mot souligné, Révélation de texte, Texte cinétique, Machine à écrire, Texte rotatif, Texte dégradé animé, Texte masqué par image, Brouillage de texte, Compteur animé, Bande liée au défilement, Texte circulaire, Liste ou grille animée. Modules : `split-text` (étendu : effets de révélation en plus des 6 d'origine), `text-fx` (huit effets choisis par `data-kw-ms-fx`), `kinetic`, `cascade`, `marquee-velocity`.

* **Animation « horloge »** (machine à écrire, brouillage, compteur) : le texte dépend de la progression. Le module crée une animation invisible avec `ctx.animate` (élément `.kw-ms-tclock`) et lit sa progression à chaque image (arrêt hors écran) ; déclencheur, défilement, répétition, lecture / pause / position de l'éditeur sont ceux du runtime, sans second moteur. Annulée (éditeur, clic avant le premier jeu) : le texte final est affiché.
* **Boucles sans fin** : bouton « Mettre en pause » (`.kw-ms-tpause`) ajouté après le composant sur la page publiée (jamais dans l'éditeur).
* **Valeur par défaut `iterations: "infinite"`** : `motionStudio.normalize` compare `iterations` et `direction` au défaut du composant (et non plus à 1 / normal) pour que « une fois » reste choisissable.
* **Composant continu sans lecture** (`preview: false`, `controls: []`) : bande liée au défilement, qui démarre seule (page et éditeur).
* Variables CSS posées par les gabarits (`--kw-gt-*`, `--kw-tm-*`, `--kw-ah-c`, `--kw-kn-accent`, `--kw-ct-size`) : couleurs du site ou `#rrggbb` validées, adresses d'image encodées (`src/marketing/pages/motionText.js`).
<!-- ms:t end -->
