// Moteur de mouvement — ce que le SERVEUR garantit : registre des animations (aucune animation fictive : chacune a ses images-clés et est
// rendue), validation stricte des paramètres (durée, délai, courbe, répétition, direction, déclencheur, écrans), CSS de page léger
// (seules les animations utilisées), attributs d'exécution lus par landing.js / kw-effects.js.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const nodes = require("../src/marketing/pages/nodes");
const motion = require("../src/marketing/pages/motion");

const sections = require("../src/marketing/pages/sections");
const H = { ctx: {}, imageUrl: sections.imageUrl, linkUrl: sections.linkUrl, iconNames: nodes.iconNames() };
const node = (m, extra = {}) => nodes.normalizeNode({ id: "head00000001", type: "heading", props: { text: "Titre", level: "2" }, motion: m, ...extra }, "test", H, 1, { n: 0, ids: new Set() });
const section = (children) => ({ id: "sect00000001", type: "layout", children });

// Les 46 animations demandées + les 10 historiques (les pages déjà enregistrées gardent la leur)
const REQUIRED = [
  "fade-in", "fade-in-down", "fade-in-left", "fade-in-right", "fade-in-up", "fade-in-down-left", "fade-in-down-right", "fade-in-up-left", "fade-in-up-right",
  "zoom-in", "zoom-in-down", "zoom-in-left", "zoom-in-right", "zoom-in-up",
  "bounce-in", "bounce-in-down", "bounce-in-left", "bounce-in-right", "bounce-in-up",
  "slide-in-down", "slide-in-left", "slide-in-right", "slide-in-up",
  "rotate-in", "rotate-in-down-left", "rotate-in-down-right", "rotate-in-up-left", "rotate-in-up-right",
  "attn-bounce", "flash", "pulse", "rubber-band", "shake", "head-shake", "swing", "tada", "wobble", "jello",
  "light-speed-in", "light-speed-in-right", "light-speed-in-left", "light-speed-out", "light-speed-out-right", "light-speed-out-left",
  "roll-in", "roll-out",
];
const LEGACY = ["fade", "slide-up", "slide-down", "slide-left", "slide-right", "zoom", "bounce", "rotate", "reveal", "flip"];

describe("registre des animations", () => {
  test("toutes les animations demandées existent, plus les identifiants historiques", () => {
    for (const id of [...REQUIRED, ...LEGACY]) assert.ok(motion.ANIMATIONS[id], `animation « ${id} » absente du registre`);
    assert.ok(Object.keys(motion.ANIMATIONS).length >= 60, "catalogue d'au moins 60 animations");
  });

  test("aucune animation fictive : chaque entrée a des images-clés réelles, une catégorie, un type et des valeurs conseillées valides", () => {
    for (const a of Object.values(motion.ANIMATIONS)) {
      assert.match(a.id, /^[a-z][a-z0-9-]*$/, a.id);
      assert.ok(a.label && a.category && ["in", "attn", "out"].includes(a.kind), a.id);
      assert.ok(motion.CATEGORY_ORDER.includes(a.category), `${a.id} : catégorie ${a.category}`);
      assert.match(motion.keyframesOf(a.id), new RegExp(`^@keyframes kw-a-${a.id}\\{.+\\}$`), a.id);
      // accolades équilibrées et propriétés autorisées seulement (transform, opacity, clip-path, transform-origin, timing)
      const css = a.keyframes;
      assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length, `${a.id} : accolades`);
      for (const m of css.matchAll(/([a-z-]+):/g)) assert.ok(["opacity", "transform", "transform-origin", "clip-path", "animation-timing-function"].includes(m[1]), `${a.id} : propriété ${m[1]}`);
      assert.ok(a.defaultDuration >= 100 && a.defaultDuration <= 10000, a.id);
      assert.ok(["fade", "none"].includes(a.reducedMotionBehavior), a.id);
      assert.equal(a.fill, a.kind === "out" ? "forwards" : a.kind === "attn" ? "none" : "backwards", a.id);
    }
  });

  test("l'éditeur reçoit le catalogue complet (liste, catégories, déclencheurs, courbes) et le CSS des images-clés pour l'aperçu", () => {
    const spec = nodes.editorSpec();
    assert.equal(spec.animations.length, Object.keys(motion.ANIMATIONS).length);
    assert.deepEqual(spec.animationCategories, motion.CATEGORY_ORDER);
    assert.ok(spec.motionTriggers.map(([k]) => k).join() === "viewport,load,click,hover");
    for (const a of spec.animations) assert.ok(spec.motionCss.includes(`@keyframes kw-a-${a.id}{`), a.id);
    assert.ok(spec.motionEasings.includes("ease") && spec.motionEasings.includes("spring"));
  });

  test("catégories : au moins les familles demandées", () => {
    for (const c of ["Fading", "Zooming", "Bouncing", "Sliding", "Rotating", "Attention Seekers", "Light Speed", "Specials"]) assert.ok(motion.CATEGORY_ORDER.includes(c), c);
  });
});

describe("validation des paramètres (rien d'arbitraire n'atteint la page)", () => {
  test("animation, durée, délai, courbe, répétition, direction, déclencheur : valeurs valides conservées", () => {
    const n = node({ entrance: "fade-in-up", duration: 800, delay: 200, easing: "ease-out", iterations: 2, direction: "alternate", trigger: "load", repeat: true, screens: { tablet: "fade-in", mobile: "none" } });
    assert.deepEqual(n.motion, { entrance: "fade-in-up", duration: 800, delay: 200, easing: "ease-out", repeat: true, iterations: 2, direction: "alternate", trigger: "load", screens: { tablet: "fade-in", mobile: "none" } });
  });
  test("valeurs par défaut : jamais d'animation infinie ni de répétition sans demande ; déclencheur « visible » implicite", () => {
    const n = node({ entrance: "zoom-in" });
    assert.equal(n.motion.iterations, undefined); assert.equal(n.motion.direction, undefined); assert.equal(n.motion.trigger, undefined);
    assert.equal(n.motion.duration, 600); assert.equal(n.motion.delay, 0);
    assert.equal(node({ entrance: "zoom-in", iterations: 1 }).motion.iterations, undefined);
    assert.equal(node({ entrance: "zoom-in", iterations: "infinite" }).motion.iterations, "infinite");
  });
  test("valeurs hors bornes ou inconnues : ignorées, jamais écrites", () => {
    assert.equal(node({ entrance: "n'existe-pas" }).motion, undefined);
    assert.equal(node({ entrance: "fade-in", duration: 99999 }).motion.duration, 600);
    assert.equal(node({ entrance: "fade-in", delay: -5 }).motion.delay, 0);
    assert.equal(node({ entrance: "fade-in", iterations: 50 }).motion.iterations, undefined);
    assert.equal(node({ entrance: "fade-in", direction: "sideways" }).motion.direction, undefined);
    assert.equal(node({ entrance: "fade-in", trigger: "javascript:alert(1)" }).motion.trigger, undefined);
    assert.equal(node({ entrance: "fade-in", screens: { tablet: "x;y", mobile: "inconnue" } }).motion.screens, undefined);
  });
  test("courbe : noms connus ou cubic-bezier à valeurs bornées ; tout autre texte est refusé (pas de CSS injecté)", () => {
    assert.equal(node({ entrance: "fade-in", easing: "cubic-bezier(0.25, 0.1, 0.25, 1)" }).motion.easing, "cubic-bezier(0.25, 0.1, 0.25, 1)");
    assert.equal(node({ entrance: "fade-in", easing: "ease" }).motion.easing, "ease");
    for (const bad of ["cubic-bezier(2,0,0,1)", "cubic-bezier(0,9,0,1)", "ease; background:url(x)", "url(javascript:x)", "cubic-bezier(0,0,0,1);}</style>"]) assert.equal(node({ entrance: "fade-in", easing: bad }).motion.easing, undefined, bad);
  });
  test("mouvement réduit : « toujours animer » n'existe que s'il y a un mouvement à respecter", () => {
    assert.equal(node({ entrance: "fade-in", alwaysMotion: true }).motion.alwaysMotion, true);
    assert.equal(node({ alwaysMotion: true }).motion, undefined);
    assert.equal(node({ entrance: "fade-in" }).motion.alwaysMotion, undefined);
  });
});

describe("CSS et attributs publiés", () => {
  const css = (ms) => nodes.pageCss([section(ms.map((m, i) => node(m, { id: `head0000000${i + 1}` })))]);
  test("seules les animations utilisées sont écrites dans le CSS de la page (page légère)", () => {
    const c = css([{ entrance: "fade-in-up" }, { entrance: "tada" }, { entrance: "fade-in-up" }]);
    assert.equal((c.match(/@keyframes kw-a-fade-in-up\{/g) || []).length, 1, "une seule fois même si utilisée deux fois");
    assert.match(c, /@keyframes kw-a-tada\{/);
    assert.doesNotMatch(c, /@keyframes kw-a-zoom-in\{|@keyframes kw-a-bounce-in\{/);
    assert.doesNotMatch(css([{}]), /@keyframes/);
  });
  test("règles de l'élément : nom, répétition, direction, remplissage selon le type ; durée, délai et courbe en variables", () => {
    const c = css([{ entrance: "tada", duration: 1200, delay: 300, easing: "ease-in", iterations: "infinite", direction: "alternate" }]);
    assert.match(c, /\.kw-n-head00000001\{--kw-anim-dur:1200ms;--kw-anim-delay:300ms;--kw-anim-ease:ease-in\}/);
    assert.match(c, /\.kw-n-head00000001\.is-in,\.kw-n-head00000001\.kw-ix-replay,\.kw-n-head00000001\.pb-anim-replay\{animation-name:kw-a-tada;animation-iteration-count:infinite;animation-direction:alternate;animation-fill-mode:none\}/);
    assert.match(css([{ entrance: "roll-out" }]), /animation-fill-mode:forwards/);
    assert.match(css([{ entrance: "fade-in" }]), /animation-iteration-count:1;animation-direction:normal;animation-fill-mode:backwards/);
  });
  test("écrans : tablette et mobile remplacent ou coupent l'animation dans leur requête média, sans toucher aux autres écrans", () => {
    const c = css([{ entrance: "fade-in-up", screens: { tablet: "fade-in", mobile: "none" } }]);
    const tablet = c.match(/@media \(max-width: 1023px\)\{([^@]*)\}/)[1];
    assert.match(tablet, /animation-name:kw-a-fade-in;/);
    assert.match(c, /@media \(max-width: 767px\)\{[^@]*animation:none\}/);
    assert.match(c, /@keyframes kw-a-fade-in\{/, "l'animation de l'écran est aussi livrée");
    assert.match(c.split("@media")[0], /animation-name:kw-a-fade-in-up/, "ordinateur : animation de base intacte");
  });
  test("attributs d'exécution : déclencheur, visible avant déclenchement (attention, sortie, clic, survol), réduit en fondu, toujours animer", () => {
    const a = (m) => nodes.motionAttrs(node(m));
    assert.equal(a({ entrance: "fade-in" }), ' data-kw-anim="fade-in" data-kw-anim-rm="fade"');
    assert.match(a({ entrance: "tada" }), /data-kw-anim="tada" data-kw-anim-vis/);
    assert.doesNotMatch(a({ entrance: "tada" }), /data-kw-anim-rm/);
    assert.match(a({ entrance: "light-speed-out" }), /data-kw-anim-vis/);
    assert.match(a({ entrance: "fade-in", trigger: "click" }), /data-kw-anim-vis data-kw-anim-trigger="click"/);
    assert.match(a({ entrance: "fade-in", repeat: true }), /data-kw-anim-repeat/);
    assert.match(a({ entrance: "fade-in", alwaysMotion: true }), /data-kw-motion-always/);
    assert.equal(nodes.motionAttrs({ id: "x" }), "");
  });
});

describe("défilement « de → à » et souris « amplitudes » : validation et rendu", () => {
  const fxLib = require("../public/js/kw-effects.js");
  test("valeurs valides conservées ; effet sans variation, valeur hors bornes ou inconnue : ignorés", () => {
    const n = node({ scrollFx: { translateY: { from: 0, to: 100 }, translateX: { from: 5, to: 5 }, rotate: { from: -90, to: 90 }, scale: { from: 1, to: 9 }, opacity: { from: 0, to: 1 }, blur: { from: 10, to: 0 }, inconnu: { from: 0, to: 1 }, start: 10, end: 80, dir: "down", invert: true } });
    assert.deepEqual(n.motion.scrollFx, { translateY: { from: 0, to: 100 }, rotate: { from: -90, to: 90 }, opacity: { from: 0, to: 1 }, blur: { from: 10, to: 0 }, start: 10, end: 80, dir: "down", invert: true });
    assert.equal(node({ scrollFx: { translateY: { from: 3, to: 3 } } }).motion, undefined, "from = to : aucun effet");
    assert.equal(node({ scrollFx: { translateY: { from: 0, to: 99999 } } }).motion, undefined);
    const w = node({ scrollFx: { translateY: { from: 0, to: 10 }, start: 80, end: 20, dir: "sideways", perspective: 99999 } }).motion.scrollFx;
    assert.deepEqual(w, { translateY: { from: 0, to: 10 } }, "zone inversée, sens et perspective invalides : valeurs par défaut");
    assert.equal(node({ scrollFx: { rotateX: { from: 45, to: 0 }, perspective: 600 } }).motion.scrollFx.perspective, 600);
    assert.equal(node({ scrollFx: { translateY: { from: 0, to: 10 }, perspective: 600 } }).motion.scrollFx.perspective, undefined, "perspective seulement avec une rotation 3D");
  });
  test("souris : amplitudes bornées, perspective seulement avec une rotation X / Y, réactivité par défaut non écrite", () => {
    const m = node({ mouseFx: { translateX: 40, translateY: -9999, rotateY: 20, scale: 30, perspective: 800, speed: 18 } }).motion.mouseFx;
    assert.deepEqual(m, { translateX: 40, rotateY: 20, scale: 30, perspective: 800 });
    assert.equal(node({ mouseFx: { translateX: 1, speed: 50 } }).motion.mouseFx.speed, 50);
    assert.equal(node({ mouseFx: {} }).motion, undefined);
  });
  test("types sans capacité de défilement ou de souris : ignoré sans erreur", () => {
    const sp = nodes.normalizeNode({ id: "spac00000001", type: "spacer", props: { size: "32" }, motion: { scrollFx: { translateY: { from: 0, to: 9 } }, mouseFx: { translateX: 3 } } }, "t", H, 1, { n: 0, ids: new Set() });
    assert.equal(sp.motion, undefined);
  });
  test("attributs : data-kw-sfx / data-kw-mfx / écrans coupés", () => {
    const a = nodes.motionAttrs(node({ scrollFx: { translateY: { from: 0, to: 100 } }, mouseFx: { translateX: 20 }, off: ["mobile"] }));
    assert.match(a, /data-kw-sfx="\{&quot;translateY&quot;:\{&quot;from&quot;:0,&quot;to&quot;:100\}\}"/);
    assert.match(a, /data-kw-mfx="\{&quot;translateX&quot;:20\}"/);
    assert.match(a, /data-kw-fx-off="mobile"/);
  });
  test("calculs purs : progression par zone, inversion, valeurs de → à, amplitudes de souris, rotations composées", () => {
    const vh = 1000, rect = (top) => ({ top, height: 200 });
    assert.equal(fxLib.fxProgress(rect(1000), vh, {}), 0); assert.equal(fxLib.fxProgress(rect(-200), vh, {}), 1);
    assert.equal(fxLib.fxProgress(rect(400), vh, {}), 0.5);
    assert.equal(fxLib.fxProgress(rect(400), vh, { start: 25, end: 75 }), 0.5);
    assert.equal(fxLib.fxProgress(rect(900), vh, { start: 25, end: 75 }), 0, "avant la zone");
    assert.equal(fxLib.fxProgress(rect(0), vh, { start: 25, end: 75 }), 1, "après la zone");
    assert.equal(fxLib.fxProgress(rect(1000), vh, { invert: true }), 1);
    assert.equal(fxLib.fxProgress({ top: 0, height: 0 }, 0, {}), 0, "fenêtre vide");
    assert.deepEqual(fxLib.sfxValues({ translateY: { from: 0, to: 100 }, opacity: { from: 0, to: 1 }, scale: { from: 1, to: 2 } }, 0.25), { y: 25, opacity: 0.25, scale: 1.25 });
    assert.deepEqual(fxLib.mfxValues({ translateX: 40, rotateY: 20, scale: 50 }, 0.5, 0), { x: 20, rotateY: 10, scale: 1.25 });
    assert.equal(fxLib.composeRotations([[0, 0, 1, 90]]), "0 0 1 90deg");
    assert.equal(fxLib.composeRotations([[0, 0, 1, 30], [0, 0, 1, 40]]), "0 0 1 70deg", "deux rotations autour du même axe s'additionnent");
    assert.equal(fxLib.composeRotations([]), "0deg");
    assert.match(fxLib.composeRotations([[1, 0, 0, 45], [0, 1, 0, 45]]), /^[\d.-]+ [\d.-]+ [\d.-]+ [\d.]+deg$/);
  });
});
