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
