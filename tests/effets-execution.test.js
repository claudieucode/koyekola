// Moteur d'exécution des effets (public/js/kw-effects.js) : calculs purs, puis le moteur complet dans un navigateur simulé (jsdom)
// avec des positions d'élément simulées (jsdom ne calcule aucune mise en page). Défilement et souris sont déclenchés comme dans un
// navigateur ; on lit ce qui est RÉELLEMENT posé sur l'élément. Ignoré si jsdom est absent (npm install --no-save jsdom).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fx = require("../public/js/kw-effects.js");

let JSDOM = null;
try { ({ JSDOM } = require("jsdom")); } catch { /* absent */ }
const SKIP = JSDOM ? false : "TEST NON EXÉCUTABLE — jsdom n'est pas installé (npm install --no-save jsdom)";

describe("calculs (sans navigateur)", () => {
  test("écran courant : ordinateur, tablette (≤ 1023 px), mobile (≤ 767 px)", () => {
    assert.deepEqual([1440, 1024, 1023, 768, 767, 360].map(fx.breakpointOf), ["desktop", "desktop", "tablet", "tablet", "mobile", "mobile"]);
  });
  test("progression : -1 quand l'élément entre par le bas, 0 au centre de la fenêtre, +1 quand il sort par le haut", () => {
    const vh = 800;
    assert.equal(fx.progressOf({ top: 800, height: 200 }, vh), 1, "juste sous la fenêtre");
    assert.equal(fx.progressOf({ top: 300, height: 200 }, vh), 0, "centré");
    assert.equal(fx.progressOf({ top: -200, height: 200 }, vh), -1, "juste au-dessus");
    assert.ok(fx.progressOf({ top: 600, height: 200 }, vh) > 0 && fx.progressOf({ top: 600, height: 200 }, vh) < 1);
    assert.equal(fx.progressOf({ top: 5000, height: 200 }, vh), 1, "borné");
    assert.equal(fx.progressOf({ top: 0, height: 0 }, 0), 0, "fenêtre vide : pas de division par zéro");
  });
  test("défilement : chaque effet suit la progression (décalage, échelle, rotation, transparence et flou aux bords)", () => {
    const fxs = { y: 80, x: -40, scale: 20, rotate: 30, opacity: 50, blur: 10 };
    assert.deepEqual(fx.scrollValues(fxs, 0), { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, blur: 0 }, "au centre : aucun effet");
    assert.deepEqual(fx.scrollValues(fxs, 1), { x: -40, y: 80, scale: 1.2, rotate: 30, opacity: 0.5, blur: 10 });
    assert.deepEqual(fx.scrollValues(fxs, -1), { x: 40, y: -80, scale: 0.8, rotate: -30, opacity: 0.5, blur: 10 }, "symétrique ; flou et transparence suivent |p|");
    assert.deepEqual(fx.scrollValues({ y: 10 }, 0.5), { x: 0, y: 5 }, "un effet absent n'est pas calculé");
  });
  test("souris : suit le curseur (déplacement) ou s'incline autour d'un axe perpendiculaire au déplacement", () => {
    assert.deepEqual(fx.mouseValues({ mode: "track", strength: 40 }, 1, -1), { x: -20, y: 20 }, "par défaut : s'éloigne du curseur");
    assert.deepEqual(fx.mouseValues({ mode: "track", strength: 40, invert: true }, 1, -1), { x: 20, y: -20 }, "inversé : suit le curseur");
    assert.deepEqual(fx.mouseValues({ mode: "tilt", strength: 50 }, 0, 0), { tilt: { ax: 0, ay: 0, angle: 0 } }, "au centre : à plat");
    const t = fx.mouseValues({ mode: "tilt", strength: 50 }, 1, 0).tilt;
    assert.deepEqual([t.ax, t.ay, t.angle], [0, -1, 10], "curseur à droite : axe vertical, 20 % de l'intensité en degrés");
  });
});

describe("moteur complet (navigateur simulé)", { skip: SKIP }, () => {
  // Page simulée : un élément avec effets, des positions simulées, et des préférences d'appareil réglables
  function page({ html, width = 1280, height = 800, reduce = false, hover = true, rect = { top: 0, height: 200 } } = {}) {
    const dom = new JSDOM(`<!doctype html><body><div id="parent">${html}</div></body>`, { pretendToBeVisual: true });
    const w = dom.window;
    w.innerWidth = width; w.innerHeight = height;
    const q = { "(prefers-reduced-motion: reduce)": reduce, "(hover: hover) and (pointer: fine)": hover };
    const listeners = [];
    w.matchMedia = (query) => ({ matches: Boolean(q[query]), addEventListener: (t, fn) => listeners.push(fn), removeEventListener() {} });
    const state = { rect: { ...rect } };
    w.Element.prototype.getBoundingClientRect = function () { return { top: state.rect.top, height: state.rect.height, bottom: state.rect.top + state.rect.height, left: 0, right: 100, width: 100 }; };
    // Images d'animation exécutées à la demande (rAF contrôlé)
    let queue = [];
    w.requestAnimationFrame = (fn) => { queue.push(fn); return queue.length; };
    w.cancelAnimationFrame = () => { queue = []; };
    const flush = (n = 40) => { for (let i = 0; i < n && queue.length; i++) { const run = queue; queue = []; run.forEach((fn) => fn(0)); } };
    const counts = { add: 0, remove: 0 };
    for (const target of [w, w.document, w.document.documentElement]) {
      const add = target.addEventListener.bind(target), rem = target.removeEventListener.bind(target);
      // On ne compte que les événements que le moteur utilise (jsdom pose lui-même des écouteurs de clavier, de focus, de clic…)
      const mine = (type) => ["scroll", "resize", "pointermove", "mouseleave"].includes(type);
      target.addEventListener = (type, ...a) => { if (mine(type)) counts.add++; return add(type, ...a); };
      target.removeEventListener = (type, ...a) => { if (mine(type)) counts.remove++; return rem(type, ...a); };
    }
    w.IntersectionObserver = class { constructor(cb) { this.cb = cb; this.els = []; } observe(el) { this.els.push(el); this.cb([{ target: el, isIntersecting: true }]); } disconnect() { this.els = []; } };
    return { w, doc: w.document, el: w.document.getElementById("t"), state, flush, counts, queued: () => queue.length };
  }
  const scrollAttr = (o) => `data-kw-scroll='${JSON.stringify(o)}'`;
  const mouseAttr = (o) => `data-kw-mouse='${JSON.stringify(o)}'`;

  test("défilement : à chaque position réelle de l'élément, translate / scale / rotate / opacité sont posés ; au centre, rien ne reste", () => {
    const p = page({ html: `<div id="t" ${scrollAttr({ y: 100, scale: 10, rotate: 20, opacity: 40 })}>x</div>`, rect: { top: 300, height: 200 } });
    const eng = fx.create(p.w);
    p.flush();
    assert.equal(p.el.style.translate, "", "centré : décalage nul → rien posé");
    p.state.rect.top = 800; p.w.dispatchEvent(new p.w.Event("scroll")); p.flush(); // l'élément arrive par le bas
    assert.equal(p.el.style.translate, "0px 100px");
    assert.equal(p.el.style.scale, "1.1");
    assert.equal(p.el.style.rotate, "20deg");
    assert.equal(p.el.style.opacity, "0.6");
    p.state.rect.top = -200; p.w.dispatchEvent(new p.w.Event("scroll")); p.flush(); // il sort par le haut
    assert.equal(p.el.style.translate, "0px -100px");
    assert.equal(p.el.style.rotate, "-20deg");
    eng.destroy();
  });

  test("flou : ajouté au filtre existant de l'élément, puis le filtre d'origine est restauré", () => {
    const p = page({ html: `<div id="t" style="filter: grayscale(50%)" ${scrollAttr({ blur: 8 })}>x</div>`, rect: { top: 800, height: 200 } });
    const eng = fx.create(p.w);
    p.flush();
    assert.equal(p.el.style.filter, "grayscale(50%) blur(8px)");
    eng.destroy();
    assert.equal(p.el.style.filter, "grayscale(50%)");
  });

  test("« réduire les animations » : AUCUN effet n'est appliqué", () => {
    const p = page({ html: `<div id="t" ${scrollAttr({ y: 100 })} ${mouseAttr({ mode: "track", strength: 50 })}>x</div>`, reduce: true, rect: { top: 800, height: 200 } });
    const eng = fx.create(p.w);
    p.flush();
    p.doc.dispatchEvent(Object.assign(new p.w.Event("pointermove"), { clientX: 1280, clientY: 800 })); p.flush();
    assert.equal(p.el.style.translate, "");
    assert.equal(p.el.getAttribute("style"), null);
    eng.destroy();
  });

  test("écrans coupés (data-kw-fx-off) : l'effet est appliqué sur ordinateur, absent sur mobile, et retiré si l'on change d'écran", () => {
    const html = `<div id="t" ${scrollAttr({ y: 100 })} data-kw-fx-off="mobile">x</div>`;
    const desk = page({ html, width: 1280, rect: { top: 800, height: 200 } });
    const e1 = fx.create(desk.w); desk.flush();
    assert.equal(desk.el.style.translate, "0px 100px");
    desk.w.innerWidth = 400; desk.w.dispatchEvent(new desk.w.Event("resize")); desk.flush();
    assert.equal(desk.el.style.translate, "", "passage en largeur mobile : effet retiré");
    e1.destroy();
    const mob = page({ html, width: 400, rect: { top: 800, height: 200 } });
    const e2 = fx.create(mob.w); mob.flush();
    assert.equal(mob.el.style.translate, "", "mobile : jamais appliqué");
    e2.destroy();
  });

  test("souris (suivi) : l'élément se déplace selon la position du curseur, rejoint sa cible puis la boucle S'ARRÊTE", () => {
    const p = page({ html: `<div id="t" ${mouseAttr({ mode: "track", strength: 40, invert: true })}>x</div>` });
    const eng = fx.create(p.w);
    p.doc.dispatchEvent(Object.assign(new p.w.Event("pointermove"), { clientX: 1280, clientY: 400 })); // bord droit, milieu
    assert.ok(p.queued() > 0, "une image est demandée au mouvement");
    p.flush(200);
    assert.equal(p.el.style.translate, "20px 0px", "curseur à droite : décalage de 20 px vers la droite (suivi)");
    assert.equal(p.queued(), 0, "plus aucune image en attente une fois la cible atteinte : pas de boucle inutile");
    p.doc.documentElement.dispatchEvent(new p.w.Event("mouseleave")); p.flush(200);
    assert.equal(p.el.style.translate, "", "curseur sorti : retour au repos");
    eng.destroy();
  });

  test("souris (inclinaison 3D) : rotation autour d'un axe, perspective posée sur le parent puis restituée", () => {
    const p = page({ html: `<div id="t" ${mouseAttr({ mode: "tilt", strength: 50 })}>x</div>` });
    const eng = fx.create(p.w);
    p.doc.dispatchEvent(Object.assign(new p.w.Event("pointermove"), { clientX: 1280, clientY: 400 })); p.flush(300);
    assert.match(p.el.style.rotate, /^0 -1 0 10deg$/);
    assert.equal(p.doc.getElementById("parent").style.perspective, "900px");
    eng.destroy();
    assert.equal(p.doc.getElementById("parent").style.perspective, "");
    assert.equal(p.el.style.rotate, "");
  });

  test("appareil sans survol (tactile) : l'effet de souris n'est jamais appliqué, celui de défilement oui", () => {
    const p = page({ html: `<div id="t" ${mouseAttr({ mode: "track", strength: 50 })} ${scrollAttr({ y: 50 })}>x</div>`, hover: false, rect: { top: 800, height: 200 } });
    const eng = fx.create(p.w); p.flush();
    p.doc.dispatchEvent(Object.assign(new p.w.Event("pointermove"), { clientX: 1280, clientY: 400 })); p.flush(100);
    assert.equal(p.el.style.translate, "0px 50px", "seulement le décalage du défilement");
    eng.destroy();
  });

  test("défilement + suivi de la souris sur le même élément : les décalages s'ADDITIONNENT (aucun n'écrase l'autre)", () => {
    const p = page({ html: `<div id="t" ${scrollAttr({ y: 100 })} ${mouseAttr({ mode: "track", strength: 40, invert: true })}>x</div>`, rect: { top: 800, height: 200 } });
    const eng = fx.create(p.w); p.flush();
    p.doc.dispatchEvent(Object.assign(new p.w.Event("pointermove"), { clientX: 1280, clientY: 400 })); p.flush(300);
    assert.equal(p.el.style.translate, "20px 100px");
    eng.destroy();
  });

  test("un élément qui attend son animation d'entrée ne bouge pas encore ; il suit les effets dès qu'elle a eu lieu", () => {
    const p = page({ html: `<div id="t" data-kw-anim="fade" ${scrollAttr({ y: 100 })}>x</div>`, rect: { top: 800, height: 200 } });
    const eng = fx.create(p.w); p.flush();
    assert.equal(p.el.style.translate, "", "pas encore apparu");
    p.el.classList.add("is-in"); eng.update(); p.flush();
    assert.equal(p.el.style.translate, "0px 100px");
    eng.destroy();
  });

  test("nettoyage : destroy retire TOUS les écouteurs posés, annule les images en attente et rend l'élément intact", () => {
    const p = page({ html: `<div id="t" ${scrollAttr({ y: 100 })} ${mouseAttr({ mode: "track", strength: 30 })}>x</div>`, rect: { top: 800, height: 200 } });
    const base = { ...p.counts };
    const eng = fx.create(p.w); p.flush();
    const added = p.counts.add - base.add;
    assert.ok(added >= 4, "écouteurs défilement, redimensionnement, souris et sortie de la souris");
    p.doc.dispatchEvent(Object.assign(new p.w.Event("pointermove"), { clientX: 100, clientY: 100 }));
    eng.destroy();
    assert.equal(p.queued(), 0, "plus aucune image en attente");
    assert.equal(p.counts.remove - base.remove, added, "autant d'écouteurs retirés que posés");
    assert.equal(p.el.getAttribute("style") || "", "", "styles posés retirés");
    p.w.dispatchEvent(new p.w.Event("scroll")); p.flush();
    assert.equal(p.el.style.translate, "", "après destroy, un défilement ne réapplique rien");
  });

  test("page sans effet : aucun écouteur n'est posé (zéro coût)", () => {
    const p = page({ html: `<div id="t">rien</div>` });
    const base = p.counts.add;
    const eng = fx.create(p.w);
    assert.equal(p.counts.add - base, 0);
    eng.destroy();
  });

  test("démarrage automatique : jamais dans le canevas de l'éditeur (data-kw-builder), toujours sur la page publiée", async () => {
    const run = async (bodyAttr) => {
      const dom = new JSDOM(`<!doctype html><body ${bodyAttr}><div data-kw-scroll='{"y":10}'></div></body>`, { pretendToBeVisual: true });
      await new Promise((r) => (dom.window.document.readyState === "complete" ? r() : dom.window.addEventListener("load", r)));
      dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      fx.autostart(dom.window);
      const started = Boolean(dom.window.kwEffectsInstance);
      if (started) dom.window.kwEffectsInstance.destroy();
      return started;
    };
    assert.equal(await run("data-kw-builder"), false);
    assert.equal(await run(""), true);
  });
});
