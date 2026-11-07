// Motion Studio, lot « v » (visuels et médias) : schémas, rendu serveur, contrat, modules (fonctions pures), nettoyage du SVG collé, contrôle de contenu des animations Lottie,
// médiathèque (type lu dans le contenu, .json et .lottie), liaison du chemin à l'organisation et au site. Navigateur réel : tests/motion-studio-v-navigateur.test.js.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-msv-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, after } = require("node:test");
const assert = require("node:assert/strict");
const ejs = require("ejs");
const { DatabaseSync } = require("node:sqlite");
const nodes = require("../src/marketing/pages/nodes");
const sections = require("../src/marketing/pages/sections");
const STUDIO = require("../src/marketing/pages/motionStudio");
const V = require("../src/marketing/pages/motionVisual");
const LOTTIE = require("../src/marketing/media/lottie");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
const KWMS = require("../public/js/kw-motion-studio.js");
const MOD = Object.fromEntries(["image-reveal", "image-parallax", "svg-draw", "tilt-card", "button", "magnetic-button", "animated-bg", "cursor", "lottie-player"].map((m) => [m, require(`../public/js/motion-studio/${m}.js`)]));
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

const ROOT = path.join(__dirname, "..");
const CSS = fs.readFileSync(path.join(ROOT, "public/css/motion-studio.css"), "utf8");
const TYPES = { motionimagereveal: "motion-image-reveal", motionimageparallax: "motion-image-parallax", motionsvgdraw: "motion-svg-draw", motiontiltcard: "motion-tilt-card", motionbutton: "motion-button", motionmagneticbutton: "motion-magnetic-button", motionanimatedbg: "motion-animated-bg", motioncursor: "motion-cursor", motionlottie: "motion-lottie-player" };
const H = (ctx = {}) => ({ ctx, imageUrl: sections.imageUrl, linkUrl: sections.linkUrl, iconNames: nodes.iconNames() });
const make = (type, props, studio, h = H()) => nodes.normalizeNode({ id: "msv000000001", type, props: props || nodes.PALETTE[type].blank().props, ...(studio ? { motion: { studio } } : {}) }, "test", h, 1, { n: 0, ids: new Set() });
const render = (type, props, { attrs = "", L = {}, d = null, isBuilder = false } = {}) => ejs.render(fs.readFileSync(path.join(ROOT, "views/marketing-public/widgets", `${TYPES[type]}.ejs`), "utf8"), { p: props, cls: `kw-node kw-${type} kw-n-x`, attrs, L, d, isBuilder, n: { id: "x" } }).trim();
const specOf = (type) => nodes.CUSTOM_WIDGETS[type].motion;
const dataOf = (type, p) => { const w = nodes.CUSTOM_WIDGETS[type]; return w.data ? w.data({}, p) : null; };
const fullView = (type, p, extra) => render(type, p, { d: dataOf(type, p), ...extra });

describe("contrat des 9 composants du lot v", () => {
  for (const [type, tpl] of Object.entries(TYPES)) {
    test(`${type} : enregistré, gabarit, module, classes stylées, contenu de départ valide et idempotent`, () => {
      const w = nodes.CUSTOM_WIDGETS[type];
      assert.ok(w, "enregistré"); assert.equal(w.template, tpl); assert.match(tpl, /^motion-/);
      assert.ok(fs.existsSync(path.join(ROOT, "public/js/motion-studio", `${w.motion.module}.js`)), "module");
      const src = fs.readFileSync(path.join(ROOT, "views/marketing-public/widgets", `${tpl}.ejs`), "utf8").replace(/<%#[\s\S]*?%>/g, "");
      for (const cls of new Set([...src.matchAll(/(?<![\w-])kw-ms[a-z0-9-]*/g)].map((m) => m[0]))) assert.ok(CSS.includes(`.${cls}`), `classe ${cls} sans style`);
      const once = make(type), twice = nodes.normalizeNode(JSON.parse(JSON.stringify(once)), "test", H(), 1, { n: 0, ids: new Set() });
      assert.deepEqual(twice, once);
      const a = nodes.motionAttrs(once);
      assert.match(a, new RegExp(`data-kw-ms-module="${w.motion.module}"`));
      assert.ok(JSON.parse(a.match(/data-kw-ms="([^"]*)"/)[1].replace(/&quot;/g, '"')).duration >= 50);
      assert.equal(typeof KWMS.registered, "function");
    });
  }
  test("l'éditeur reçoit les neuf fiches (réglages communs limités à ce qui a un effet)", () => {
    const spec = nodes.editorSpec();
    for (const type of Object.keys(TYPES)) { const t = spec.types.find((x) => x.type === type); assert.ok(t && t.motion, type); assert.equal(t.group, "advanced"); }
    const by = (type) => spec.types.find((x) => x.type === type).motion;
    assert.deepEqual(by("motionimageparallax").controls, ["scrub"]); assert.equal(by("motionimageparallax").defaults.trigger, "scroll");
    assert.equal(by("motiontiltcard").preview, false); assert.equal(by("motioncursor").preview, false); assert.deepEqual(by("motioncursor").controls, []);
    assert.equal(by("motionimagereveal").presets.length, 8);
  });
  test("le CSS du lot n'utilise ni #fff ni #000 en dur et ne fait jamais transition: all", () => {
    const block = CSS.slice(CSS.indexOf("/* ms:v début"), CSS.indexOf("/* ms:v fin"));
    assert.ok(block.length > 2000);
    assert.ok(!/#(?:f{3}|f{6}|0{3}|0{6})\b/i.test(block)); assert.ok(!/transition:\s*all/.test(block));
  });
});

describe("Révélation d'image", () => {
  test("8 effets, tous des masques interpolables (même fonction au départ et à l'arrivée)", () => {
    assert.deepEqual(Object.keys(MOD["image-reveal"].MASKS).sort(), specOf("motionimagereveal").presets.map((p) => p[0]).sort());
    for (const [k, [a, b]] of Object.entries(MOD["image-reveal"].MASKS)) assert.equal(a.split("(")[0], b.split("(")[0], k);
    for (const k of Object.keys(MOD["image-reveal"].MASKS)) assert.deepEqual(Object.keys(MOD["image-reveal"].frames(k)[0]), ["clipPath"]);
    assert.equal(MOD["image-reveal"].frames("inconnu")[0].clipPath, "inset(0 100% 0 0)", "effet inconnu : balayage par défaut");
  });
  test("rendu : image entière sans JavaScript, texte échappé, lien réel, format de repli, vide public = rien", () => {
    const p = { image: "/uploads/marketing/1/a.png", alt: 'Un "joli" <b>', ratio: "9-9", caption: "Légende <i>", link: "" };
    const html = render("motionimagereveal", p);
    assert.match(html, /^<figure class="kw-node kw-motionimagereveal kw-n-x kw-ms kw-ms-ir"/);
    assert.ok(html.includes('alt="Un &#34;joli&#34; &lt;b&gt;"')); assert.ok(html.includes("kw-ms-vr-16-9") && html.includes("Légende &lt;i&gt;"));
    assert.ok(!/ clip-path|style=/.test(html), "aucun masque ni style écrit par le serveur");
    assert.match(render("motionimagereveal", p, { L: { link: "/offre" } }), /<a class="kw-ms-ir-link" href="\/offre">/);
    assert.equal(render("motionimagereveal", { ...p, image: "" }).replace(/\s+/g, ""), '<figureclass="kw-nodekw-motionimagerevealkw-n-xkw-ms kw-ms-ir"></figure>'.replace(/\s+/g, ""));
    assert.match(render("motionimagereveal", { ...p, image: "" }, { isBuilder: true }), /Choisissez une image/);
  });
  test("image : médiathèque ou https:// seulement (javascript: refusé)", () => {
    assert.throws(() => make("motionimagereveal", { image: "javascript:alert(1)", alt: "", ratio: "16-9", caption: "" }), /image/i);
    assert.equal(make("motionimagereveal", { image: "https://exemple.test/a.jpg", alt: "", ratio: "16-9", caption: "" }).props.image, "https://exemple.test/a.jpg");
  });
  test("module : mouvement réduit ou sans cadre = aucune transformation ; sinon masque + zoom (clip-path / transform seulement)", () => {
    const calls = [];
    const el = { querySelector: (s) => (s === ".kw-ms-ir-frame" ? { n: "frame" } : { n: "img" }) };
    const ctx = (reduced, zoom) => ({ el, reduced, cfg: { preset: "iris", params: zoom === undefined ? {} : { zoom } }, animate: (t, k) => calls.push([t.n, Object.keys(k[0]).join()]) });
    MOD["image-reveal"].init(ctx(true)); assert.equal(calls.length, 0);
    MOD["image-reveal"].init({ el: { querySelector: () => null }, reduced: false, cfg: { params: {} }, animate() { calls.push("x"); } }); assert.equal(calls.length, 0);
    MOD["image-reveal"].init(ctx(false)); assert.deepEqual(calls, [["frame", "clipPath"], ["img", "transform"]]);
    calls.length = 0; MOD["image-reveal"].init(ctx(false, false)); assert.deepEqual(calls, [["frame", "clipPath"]]);
  });
});

describe("Parallaxe d'image", () => {
  test("géométrie : débordement borné, décalage proportionnel, sens inversé, courbe linéaire", () => {
    const G = MOD["image-parallax"];
    assert.deepEqual(G.geometry(20), { depth: 20, height: 140, top: -20, shift: 14.29 });
    assert.equal(G.geometry(1).depth, 3); assert.equal(G.geometry(99).depth, 40); assert.equal(G.geometry("x").depth, 15);
    assert.deepEqual(G.frames(10, false), [{ transform: "translate3d(0,-10%,0)" }, { transform: "translate3d(0,10%,0)" }]);
    assert.deepEqual(G.frames(10, true), [{ transform: "translate3d(0,10%,0)" }, { transform: "translate3d(0,-10%,0)" }]);
  });
  test("module : repli (réduit / sans image) = rien ; sinon animation linéaire et destroy() restitue l'image", () => {
    const img = { style: {} }, seen = [];
    const ctx = (reduced) => ({ el: { querySelector: () => img }, reduced, cfg: { params: { depth: 20, reverse: false } }, animate: (t, k, o) => seen.push([k.length, o.easing]) });
    assert.deepEqual(MOD["image-parallax"].init(ctx(true)), {}); assert.equal(seen.length, 0);
    const inst = MOD["image-parallax"].init(ctx(false));
    assert.deepEqual([img.style.height, img.style.top, seen[0]], ["140%", "-20%", [2, "linear"]]);
    inst.destroy(); assert.deepEqual([img.style.height, img.style.top], ["", ""]);
  });
  test("la fiche impose le défilement : pas de déclencheur à régler, plage (scrub) seulement", () => {
    const s = specOf("motionimageparallax");
    assert.equal(s.defaults.trigger, "scroll"); assert.ok(!s.controls.includes("trigger")); assert.ok(s.controls.includes("scrub"));
    assert.equal(make("motionimageparallax", undefined, { v: 1, scrub: { start: 10, end: 90 } }).motion.studio.scrub.end, 90);
    assert.match(render("motionimageparallax", { image: "/uploads/marketing/1/a.png", alt: "", ratio: "21-9", caption: "" }), /kw-ms-pp-frame kw-ms-vr-21-9"><img class="kw-ms-pp-img"/);
  });
});

describe("Tracé SVG : nettoyage du SVG collé", () => {
  const EVIL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" onload="alert(1)"><script>alert(2)</script><style>*{x:y}</style><foreignObject><div>x</div></foreignObject><use href="#a"/><image href="https://evil/x.png"/>' +
    '<g onclick="alert(3)" transform="translate(1 2)"><path id="a" class="c" style="stroke-dasharray:5" stroke-dasharray="5" d="M0 0 L10 10" stroke="#ff0000" stroke-width="2" onmouseover="x()"/><circle cx="5" cy="5" r="3" fill="url(#g)" stroke="javascript:alert(1)"/></g><a href="javascript:alert(1)"><rect x="1" y="1" width="5" height="5"/></a></svg>';
  test("balises et attributs hors liste blanche retirés ; formes valides reconstruites ; stroke-dasharray retiré", () => {
    const r = V.sanitizeSvg(EVIL);
    assert.equal(r.ok, true); assert.equal(r.viewBox, "0 0 100 50");
    for (const bad of ["script", "style", "foreignObject", "<use", "<image", "onload", "onclick", "onmouseover", "javascript", "dasharray", "href", "id=", "class=", "url("]) assert.ok(!r.markup.includes(bad), `reste : ${bad} dans ${r.markup}`);
    assert.match(r.markup, /<g transform="translate\(1 2\)"><path data-kw-sd d="M0 0 L10 10" stroke="#ff0000" stroke-width="2"><\/path>/);
    assert.ok(r.markup.includes("<circle data-kw-sd"), "cercle conservé (fill url() et stroke javascript: retirés)");
    assert.ok(r.dropped.includes("script") && r.dropped.includes("style") && r.dropped.includes("foreignObject") && r.dropped.includes("onload"));
  });
  test("refus clairs : vide, trop long, pas de SVG, aucune forme, pas de zone de dessin ; zone déduite de width / height", () => {
    assert.match(V.sanitizeSvg("").error, /Collez/); assert.match(V.sanitizeSvg("x".repeat(13000)).error, /trop long/);
    assert.match(V.sanitizeSvg("<div>pas un svg</div>").error, /<svg/);
    assert.match(V.sanitizeSvg('<svg viewBox="0 0 10 10"><script>1</script></svg>').error, /Aucune forme/);
    assert.match(V.sanitizeSvg('<svg><path d="M0 0 L5 5"/></svg>').error, /viewBox/);
    assert.equal(V.sanitizeSvg('<svg width="30px" height="20"><path d="M0 0 L5 5"/></svg>').viewBox, "0 0 30 20");
    assert.equal(V.sanitizeSvg('<svg viewBox="0 0 10 10"><path d="M0 0 evil(1)"/></svg>').ok, false, "chemin avec caractères hors grammaire : forme retirée");
  });
  test("les 10 formes prédéfinies sont valides, tracées (aucun remplissage) et décrites par des chemins de grammaire stricte", () => {
    assert.equal(Object.keys(V.SHAPES).length, 10);
    for (const [k, s] of Object.entries(V.SHAPES)) { const r = V.presetSvg(k); assert.equal(r.ok, true, k); assert.ok(r.shapes >= 1); assert.match(s.vb, /^0 0 \d+ \d+$/); for (const d of s.paths) assert.match(d, /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/); assert.equal(V.sanitizeSvg(`<svg viewBox="${s.vb}">${s.paths.map((d) => `<path d="${d}"/>`).join("")}</svg>`).shapes, s.paths.length); }
    assert.equal(V.presetSvg("inconnue").preset, "wave", "forme inconnue : vague");
  });
  test("enregistrement : un SVG collé inutilisable est refusé avec un message ; rendu : TOUJOURS le SVG reconstruit, jamais le texte enregistré", () => {
    assert.throws(() => make("motionsvgdraw", { ...nodes.PALETTE.motionsvgdraw.blank().props, source: "custom", svg: "<svg viewBox='0 0 1 1'><script>1</script></svg>" }), /Aucune forme/);
    const p = make("motionsvgdraw", { ...nodes.PALETTE.motionsvgdraw.blank().props, source: "custom", svg: EVIL, alt: "Mon tracé" }).props;
    const html = fullView("motionsvgdraw", p, { attrs: ' data-kw-ms-module="svg-draw"' });
    assert.ok(!/script|onload|onclick|javascript|dasharray|foreignObject/i.test(html), html);
    assert.match(html, /<svg class="kw-ms-sd-svg" viewBox="0 0 100 50"[^>]*role="img" aria-label="Mon tracé"/);
    const deco = fullView("motionsvgdraw", { ...p, alt: "" }); assert.match(deco, /aria-hidden="true"/);
    assert.match(fullView("motionsvgdraw", nodes.PALETTE.motionsvgdraw.blank().props), /<path data-kw-sd d="M10 50 C40 5/);
  });
  test("module : getTotalLength → stroke-dasharray posé par le script ; fin→début, remplissage, forme sans trait, mouvement réduit, destroy()", () => {
    const S = MOD["svg-draw"];
    assert.deepEqual(S.strokeFrames(100, "draw"), [{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }]);
    assert.deepEqual(S.strokeFrames(100, "draw-reverse"), [{ strokeDashoffset: -100 }, { strokeDashoffset: 0 }]);
    assert.equal(S.lengthOf({ getTotalLength() { throw new Error("x"); } }), 0);
    const mkShape = (len, stroke) => ({ style: {}, getTotalLength: () => len, stroke });
    const run = (preset, shapes, reduced = false) => {
      const log = [];
      const ctx = { reduced, cfg: { preset, duration: 1000 }, win: { getComputedStyle: (s) => ({ stroke: s.stroke }) }, stagger: (i) => i * 10, animate: (t, k, o) => log.push([Object.keys(k[0])[0], o && o.delay]),
        el: { querySelector: () => ({ querySelectorAll: () => shapes }) } };
      return { inst: S.init(ctx), log };
    };
    const a = mkShape(250, "rgb(0, 0, 0)"), b = mkShape(80, "none");
    const r = run("draw", [a, b]);
    assert.equal(a.style.strokeDasharray, "250 250"); assert.deepEqual(r.log, [["strokeDashoffset", 0], ["opacity", 10]], "forme sans trait : fondu");
    assert.equal(b.style.strokeDasharray, undefined);
    r.inst.destroy(); assert.equal(a.style.strokeDasharray, "");
    assert.deepEqual(run("draw-fill", [mkShape(10, "rgb(1, 1, 1)")]).log, [["strokeDashoffset", 0], ["fill", 700]]);
    const c = mkShape(50, "rgb(0, 0, 0)"); assert.deepEqual(run("draw", [c], true).inst, {}); assert.equal(c.style.strokeDasharray, undefined, "mouvement réduit : rien posé");
  });
});

describe("Carte inclinée 3D", () => {
  test("angles : centre = à plat, coins = inclinaison maximale, sens inversable ; réglages bornés", () => {
    const T = MOD["tilt-card"];
    assert.deepEqual(T.angles(0.5, 0.5, 10, false), { rx: 0, ry: 0 });
    assert.deepEqual(T.angles(1, 0, 10, false), { rx: 10, ry: 10 }); assert.deepEqual(T.angles(1, 0, 10, true), { rx: -10, ry: -10 });
    assert.equal(T.transform({ rx: 3, ry: -4 }, 900, 1.03), "perspective(900px) rotateX(3deg) rotateY(-4deg) scale(1.03)");
    assert.deepEqual(T.settings({ maxTilt: 99, scale: 5, perspective: 1, glareStrength: 500, glare: false }), { max: 25, scale: 1.15, perspective: 400, glare: false, strength: 0.8, invert: false });
  });
  test("tactile, éditeur ou mouvement réduit : la carte reste à plat (aucun écouteur) ; souris : écouteurs posés puis retirés", () => {
    const listeners = [], el = { querySelector: () => ({ style: { setProperty() {}, removeProperty() {} } }), addEventListener: (t) => listeners.push(t), removeEventListener() {} };
    const win = (fine) => ({ matchMedia: () => ({ matches: fine }), requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
    const ctx = (o) => ({ el, win: win(o.fine), reduced: o.reduced, mode: o.mode || "public", cfg: { params: {}, duration: 400, easing: "smooth" }, onCleanup() {} });
    for (const o of [{ fine: false }, { fine: true, reduced: true }, { fine: true, mode: "editor" }]) assert.deepEqual(MOD["tilt-card"].init(ctx(o)), {});
    assert.equal(listeners.length, 0);
    MOD["tilt-card"].init(ctx({ fine: true })); assert.deepEqual(listeners, ["pointerenter", "pointermove", "pointerleave"]);
  });
  test("rendu : contenu complet, lien seulement avec adresse, titre échappé", () => {
    const p = { image: "", imageAlt: "", title: "Carte <b>", titleTag: "h9", text: "Texte", linkLabel: "Voir", link: "/x" };
    const html = render("motiontiltcard", p, { L: { link: "/x" } });
    assert.ok(html.includes("Carte &lt;b&gt;") && html.includes("<h3 ") && html.includes('<a class="kw-ms-tc-link" href="/x">Voir</a>') && html.includes("kw-ms-tc-glare"));
    assert.ok(!render("motiontiltcard", p, { L: {} }).includes("<a "));
    assert.throws(() => make("motiontiltcard", { ...nodes.PALETTE.motiontiltcard.blank().props, linkLabel: "Voir" }), /lien demande une adresse/);
  });
});

describe("Boutons animé et magnétique", () => {
  const p = { label: 'Go <b> "x"', link: "/offre", newTab: true, arrow: "right", size: "lg", block: true, align: "center" };
  test("VRAI lien <a href> : adresse comptée, échappement, nouvel onglet avec rel, flèche décorative, tailles en repli", () => {
    const html = render("motionbutton", p, { L: { link: "/offre" } });
    assert.match(html, /<a class="kw-ms-bt is-lg is-block" href="\/offre" target="_blank" rel="noopener noreferrer">/);
    assert.ok(html.includes("Go &lt;b&gt; &#34;x&#34;") && /<svg class="kw-ms-bt-arrow"[^>]*aria-hidden="true"/.test(html));
    const m = render("motionmagneticbutton", { ...p, size: "zzz" }, { L: { link: "/offre" } });
    assert.ok(m.includes("kw-ms-mb kw-ms-bw") && m.includes('class="kw-ms-bt is-lg" href="/offre"'));
    assert.ok(!render("motionbutton", { ...p, arrow: "none" }, { L: { link: "/o" } }).includes("<svg"));
    assert.ok(!render("motionbutton", p, { L: {} }).includes("<a "), "sans adresse : pas de faux lien");
    assert.throws(() => make("motionbutton", { ...p, link: "javascript:alert(1)" }), /adresse|lien/i);
  });
  test("les 6 variantes de survol ont chacune leur règle CSS (aussi au clavier) pour les deux composants", () => {
    for (const type of ["motionbutton", "motionmagneticbutton"]) for (const [k] of specOf(type).presets) {
      assert.ok(CSS.includes(`[data-kw-ms*='"preset":"${k}"']`), `${type} : ${k}`);
      assert.ok(new RegExp(`preset":"${k}"'\\][^{]*:focus-visible`).test(CSS), `${k} : focus clavier`);
    }
    const a = nodes.motionAttrs(make("motionbutton", undefined, { v: 1, preset: "shine" })), json = a.match(/data-kw-ms="([^"]*)"/)[1];
    assert.ok(json.includes("&quot;preset&quot;:&quot;shine&quot;"), "l'attribut porte l'effet effectif que le CSS lit");
    assert.ok(nodes.motionAttrs(make("motionmagneticbutton")).includes("fill-circle"));
  });
  test("module bouton : origine du pointeur bornée ; durée et courbe posées, puis retirées", () => {
    assert.deepEqual(MOD.button.origin({ left: 10, top: 10, width: 100, height: 40 }, 60, 30), { x: 50, y: 50 });
    assert.deepEqual(MOD.button.origin({ left: 0, top: 0, width: 100, height: 40 }, -50, 900), { x: 0, y: 100 });
    const props = {}, el = { querySelector: () => ({ addEventListener() {}, removeEventListener() {}, style: { setProperty() {}, removeProperty() {} }, getBoundingClientRect: () => ({}) }), style: { setProperty: (k, v) => { props[k] = v; }, removeProperty: (k) => { delete props[k]; } } };
    const inst = MOD.button.init({ el, win: { KWMS }, cfg: { duration: 500, easing: "linear", preset: "fill-circle" } });
    assert.deepEqual(props, { "--kw-ms-dur": "500ms", "--kw-ms-ease": "linear" }); inst.destroy(); assert.deepEqual(props, {});
  });
  test("module magnétique : zone d'attraction, force, plafond ; tactile / réduit / éditeur = bouton en place", () => {
    const M = MOD["magnetic-button"];
    assert.equal(M.pull(100, 100, 80, 40, 400, 100, 35, 120), null, "trop loin");
    assert.deepEqual(M.pull(100, 100, 80, 40, 100, 100, 35, 120), { x: 0, y: 0 });
    assert.deepEqual(M.pull(100, 100, 80, 40, 160, 100, 50, 120), { x: 30, y: 0 });
    assert.equal(M.pull(100, 100, 80, 40, 250, 100, 70, 120).x, 60, "plafond = rayon / 2");
    assert.deepEqual(M.settings({ strength: 1, radius: 999, labelShift: false }), { strength: 5, radius: 300, labelShift: false });
    const a = {}, ctx = (fine, reduced, mode) => ({ el: { querySelector: () => a, style: {} }, win: { matchMedia: () => ({ matches: fine }) }, reduced, mode: mode || "public", cfg: { params: {} } });
    for (const c of [ctx(false, false), ctx(true, true), ctx(true, false, "editor")]) assert.deepEqual(M.init(c), {});
  });
});

describe("Fonds animés", () => {
  test("couleurs du site validées (jamais de texte libre dans le CSS) ; repli sûr", () => {
    assert.equal(V.cssColor("#AbC"), "#abc"); assert.equal(V.cssColor("token:primary").startsWith("var(--kw-primary"), true);
    for (const bad of ["red", "javascript:1", "url(x)", "token:evil;x", "#12", "expression(1)", "var(--x)"]) assert.equal(V.cssColor(bad), "", bad);
    const w = nodes.CUSTOM_WIDGETS.motionanimatedbg;
    assert.equal(w.data({}, { color1: "#ff0000", color2: "nope", color3: "token:accent" }).c1, "#ff0000"); assert.match(w.data({}, { color2: "nope" }).c2, /--kw-secondary/);
  });
  test("rendu : fond fixe + texte lisible sans JavaScript, bouton seulement avec adresse, style = variables validées", () => {
    const props = { ...nodes.PALETTE.motionanimatedbg.blank().props, title: "Titre <x>", buttonLabel: "Go", link: "/y" };
    const html = fullView("motionanimatedbg", props, { L: { link: "/y" } });
    assert.ok(html.includes("Titre &lt;x&gt;") && html.includes('<a class="kw-ms-bg-btn" href="/y">Go</a>') && html.includes("kw-ms-bg-grain"));
    assert.match(html, /style="--kw-ms-c1: var\(--kw-primary[^"]*; --kw-ms-c2: [^"]*; --kw-ms-c3: [^"]*; --kw-ms-min: 360px"/);
    assert.ok(!fullView("motionanimatedbg", props, { L: {} }).includes("<a "));
    assert.throws(() => make("motionanimatedbg", { ...props, link: "" }), /adresse/);
  });
  test("3 effets animés par transform seulement ; boucle sans fin et alternée par défaut ; bouton Pause réglable", () => {
    const B = MOD["animated-bg"], s = specOf("motionanimatedbg");
    assert.deepEqual(Object.keys(B.PLANS).sort(), s.presets.map((x) => x[0]).sort());
    for (const rows of Object.values(B.PLANS)) for (const [layer, a, b, f] of rows) { assert.match(layer, /^(l[123]|grain)$/); assert.ok(/^(rotate|translate3d)/.test(a) && /^(rotate|translate3d)/.test(b)); assert.ok(f >= 1); }
    assert.equal(B.plan("zz"), B.PLANS.gradient);
    assert.equal(s.defaults.iterations, "infinite"); assert.equal(s.defaults.direction, "alternate"); assert.ok(s.params.some((q) => q.key === "pausable" && q.default === true));
    const rm = B.init({ el: { querySelector: () => ({}), style: { setProperty() {}, removeProperty() {} } }, reduced: true, cfg: { params: { grain: 20 } }, doc: {}, win: {}, animate() { throw new Error("aucune animation en mouvement réduit"); } });
    assert.equal(typeof rm.destroy, "function"); assert.equal(rm.play, undefined);
  });
});

describe("Curseur personnalisé", () => {
  test("réglages bornés, inertie → vitesse de rattrapage, pas de curseur en mode tactile / réduit / éditeur / en double", () => {
    const C = MOD.cursor;
    assert.deepEqual(C.settings({ look: "x", size: 500, grow: 0, inertia: 999, blend: 1 }), { look: "dot-ring", size: 96, grow: 1, inertia: 90, blend: false, hideNative: false });
    assert.equal(C.follow(0), 1); assert.ok(Math.abs(C.follow(90) - 0.1) < 1e-9); assert.ok(C.follow(100) >= 0.06);
    const doc = { body: { appended: 0, appendChild() { this.appended++; } }, createElement: () => ({ classList: { add() {}, remove() {}, toggle() {} }, style: { setProperty() {} }, setAttribute() {}, appendChild() {} }), documentElement: { classList: { add() {}, remove() {} }, addEventListener() {}, removeEventListener() {} } };
    const win = (fine, extra = {}) => ({ matchMedia: () => ({ matches: fine }), addEventListener() {}, removeEventListener() {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, ...extra });
    for (const c of [{ win: win(false), reduced: false, mode: "public" }, { win: win(true), reduced: true, mode: "public" }, { win: win(true), reduced: false, mode: "editor" }, { win: win(true, { __kwMsCursor: true }), reduced: false, mode: "public" }]) assert.deepEqual(C.init({ doc, opts: {}, ...c }), {});
    assert.equal(doc.body.appended, 0);
    const w = win(true); let clean = null; C.init({ doc, win: w, opts: {}, reduced: false, mode: "public", onCleanup: (f) => { clean = f; } });
    assert.equal(doc.body.appended, 1); assert.equal(w.__kwMsCursor, true); clean(); assert.equal(w.__kwMsCursor, false);
  });
  test("rendu : rien d'affiché sur la page publiée, repère dans l'éditeur, réglages dans data-kw-ms-opts", () => {
    const p = nodes.PALETTE.motioncursor.blank().props;
    const pub = render("motioncursor", p, { attrs: ' data-kw-ms-module="cursor"' });
    assert.match(pub, /^<span class="[^"]*kw-ms kw-ms-cur" hidden data-kw-ms-module="cursor" data-kw-ms-opts="\{&#34;look&#34;:&#34;dot-ring&#34;,&#34;size&#34;:36,/);
    assert.match(render("motioncursor", p, { isBuilder: true }), /kw-ms-cur is-builder[\s\S]*Curseur personnalisé/);
    assert.equal(make("motioncursor", { ...p, size: 5000 }).props.size, 36, "taille hors limite : valeur par défaut");
  });
});

// ---------------------------------------------------------------- Lottie
const LOT = (extra = {}) => ({ v: "5.7.1", fr: 30, ip: 0, op: 60, w: 100, h: 100, nm: "t", ddd: 0, assets: [], layers: [{ ddd: 0, ind: 1, ty: 4, nm: "calque", ks: { o: { a: 0, k: 100 }, p: { a: 0, k: [50, 50, 0] } }, shapes: [], ip: 0, op: 60, st: 0 }], ...extra });
const buf = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o));
const PNG1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
function zip(files, { method = 8, flags = 0 } = {}) { // fabrique une archive ZIP (méthode 8 = deflate)
  const locals = [], central = []; let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const raw = Buffer.isBuffer(content) ? content : Buffer.from(content), data = method === 8 ? zlib.deflateRawSync(raw) : raw, nm = Buffer.from(name);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(flags, 6); lh.writeUInt16LE(method, 8); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nm.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(flags, 8); ch.writeUInt16LE(method, 10); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(offset, 42);
    locals.push(lh, nm, data); central.push(ch, nm); offset += 30 + nm.length + data.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}
const dotLottie = (anim = LOT(), extra = {}) => zip({ "manifest.json": JSON.stringify({ version: "1", generator: "test", animations: [{ id: "a1" }] }), "animations/a1.json": JSON.stringify(anim), ...extra });

describe("Lottie : contrôle de contenu strict (.json)", () => {
  test("une animation valide est acceptée (BOM et espaces tolérés)", () => {
    assert.equal(LOTTIE.checkJson(buf(LOT())).ok, true);
    assert.equal(LOTTIE.checkJson(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), buf("  \n" + JSON.stringify(LOT()))])).ok, true);
    assert.equal(LOTTIE.checkJson(buf(LOT({ assets: [{ id: "i", w: 1, h: 1, u: "", p: `data:image/png;base64,${PNG1.toString("base64")}`, e: 1 }] }))).ok, true, "image intégrée");
  });
  test("refus : expressions, adresses externes, scripts, balises, gestionnaires, images non intégrées, polices, clés dangereuses", () => {
    const refused = (o, re) => { const r = LOTTIE.checkJson(buf(o)); assert.equal(r.ok, false, JSON.stringify(o).slice(0, 80)); assert.match(r.reason, re); };
    refused(LOT({ layers: [{ ty: 4, ks: { r: { a: 0, k: 0, x: "var $bm_rt = thisComp.layer(1).transform;" } } }] }), /expression/);
    refused(LOT({ assets: [{ id: "i", w: 1, h: 1, u: "https://evil.test/", p: "a.png", e: 0 }] }), /externe/);
    refused(LOT({ nm: "http://evil.test/x" }), /externe/); refused(LOT({ nm: "//evil.test/x" }), /externe/);
    refused(LOT({ nm: "javascript:alert(1)" }), /actif/); refused(LOT({ nm: "<script>alert(1)</script>" }), /actif/); refused(LOT({ nm: "<svg onload=x>" }), /actif/);
    refused(LOT({ nm: 'a" onmouseover=alert(1) b' }), /actif/); refused(LOT({ nm: "data:text/html;base64,AAAA" }), /actif/);
    refused(LOT({ assets: [{ id: "i", w: 1, h: 1, u: "", p: "image.png", e: 0 }] }), /non intégrée/);
    refused(LOT({ fonts: { list: [{ fFamily: "X", fPath: "x.woff" }] } }), /police/);
    refused(JSON.parse('{"v":"5","fr":30,"ip":0,"op":60,"w":10,"h":10,"layers":[],"__proto__":{"y":1}}'), /interdite/);
  });
  test("refus : champs absents, dimensions / cadence / durée hors limites, trop de calques, trop profond, trop gros, pas du JSON, autre JSON", () => {
    const base = LOT();
    for (const k of ["v", "fr", "ip", "op", "w", "h", "layers"]) { const o = { ...base }; delete o[k]; assert.equal(LOTTIE.checkJson(buf(o)).ok, false, k); }
    assert.equal(LOTTIE.checkJson(buf(LOT({ w: 5000 }))).ok, false); assert.equal(LOTTIE.checkJson(buf(LOT({ fr: 0 }))).ok, false); assert.equal(LOTTIE.checkJson(buf(LOT({ op: 0 }))).ok, false); assert.equal(LOTTIE.checkJson(buf(LOT({ op: 99999 }))).ok, false);
    assert.equal(LOTTIE.checkJson(buf(LOT({ layers: Array.from({ length: 501 }, () => ({ ty: 4 })) }))).ok, false);
    let deep = {}; for (let i = 0; i < 60; i++) deep = { k: deep };
    assert.match(LOTTIE.checkJson(buf(LOT({ deep }))).reason, /imbriquée/);
    assert.match(LOTTIE.checkJson(Buffer.alloc(2 * 1024 * 1024 + 10, " ").fill("{", 0, 1)).reason, /lourd/);
    assert.equal(LOTTIE.checkJson(buf("pas du json")).reason, null);
    assert.equal(LOTTIE.checkJson(buf("{ cassé")).ok, false);
    assert.equal(LOTTIE.checkJson(buf({ name: "package", version: "1" })).ok, false, "un JSON quelconque n'est pas une animation");
    assert.equal(LOTTIE.checkJson(buf("[1,2]")).reason, null);
  });
});

describe("Lottie : dotLottie (.lottie)", () => {
  test("archive valide acceptée (deflate et stockée), images vérifiées par signature", () => {
    assert.deepEqual(LOTTIE.checkLottieZip(dotLottie()), { ok: true, animations: 1 });
    assert.equal(LOTTIE.checkLottieZip(zip({ "manifest.json": JSON.stringify({ animations: [{ id: "a1" }] }), "animations/a1.json": JSON.stringify(LOT()) }, { method: 0 })).ok, true);
    const withImg = dotLottie(LOT({ assets: [{ id: "i", w: 1, h: 1, u: "images/", p: "p.png", e: 0 }] }), { "images/p.png": PNG1 });
    assert.equal(LOTTIE.checkLottieZip(withImg).ok, true);
  });
  test("refus : manifest absent / incohérent, fichier non autorisé, image absente ou fausse, chemin dangereux, contenu actif, chiffrement, méthode inconnue, bombe de décompression, archive tronquée", () => {
    const why = (b) => { const r = LOTTIE.checkLottieZip(b); assert.equal(r.ok, false); return r.reason; };
    assert.match(why(zip({ "animations/a1.json": JSON.stringify(LOT()) })), /manifest/);
    assert.match(why(zip({ "manifest.json": JSON.stringify({ animations: [{ id: "zz" }] }), "animations/a1.json": JSON.stringify(LOT()) })), /absente/);
    assert.match(why(dotLottie(LOT(), { "script.js": "alert(1)" })), /non autorisé/); assert.match(why(dotLottie(LOT(), { "../evil.json": "{}" })), /non autorisé/);
    assert.match(why(dotLottie(LOT(), { "images/x.png": "pas une image" })), /image invalide/);
    assert.match(why(dotLottie(LOT({ assets: [{ id: "i", w: 1, h: 1, u: "images/", p: "absente.png", e: 0 }] }))), /absente du fichier/);
    assert.match(why(dotLottie(LOT({ nm: "<script>1</script>" }))), /actif/); assert.match(why(dotLottie(LOT({ layers: [{ ks: { x: "code" } }] }))), /expression/);
    assert.match(why(zip({ "manifest.json": "{}" }, { flags: 1 })), /chiffrée/);
    const odd = zip({ "manifest.json": "{}" }); odd.writeUInt16LE(14, odd.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02])) + 10);
    assert.match(why(odd), /méthode/);
    const bomb = zip({ "manifest.json": JSON.stringify({ animations: [{ id: "a1" }] }), "animations/a1.json": " ".repeat(20 * 1024 * 1024) });
    assert.ok(bomb.length < 100000, "la bombe est toute petite compressée"); assert.match(why(bomb), /volumineux|décompression/);
    assert.match(why(dotLottie().subarray(0, 40)), /archive/); assert.equal(LOTTIE.checkLottieZip(Buffer.from("PK\x03\x04 pas une archive")).ok, false);
    assert.match(why(zip(Object.fromEntries(Array.from({ length: 61 }, (_, i) => [`images/i${i}.png`, PNG1])))), /trop de fichiers/);
  });
  test("le lecteur du navigateur relit la même archive (annuaire ZIP + décompression) et convertit les images", async () => {
    const P = MOD["lottie-player"];
    const b = dotLottie(LOT({ assets: [{ id: "i", w: 1, h: 1, u: "images/", p: "p.png", e: 0 }] }), { "images/p.png": PNG1 });
    assert.deepEqual(P.readZip(new Uint8Array(b)).map((e) => e.name).sort(), ["animations/a1.json", "images/p.png", "manifest.json"]);
    const data = await P.unzipLottie(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
    assert.equal(data.v, "5.7.1"); assert.equal(data.assets[0].e, 1); assert.equal(data.assets[0].u, ""); assert.ok(data.assets[0].p.startsWith("data:image/png;base64,iVBOR"));
    await assert.rejects(P.unzipLottie(zip({ "animations/a1.json": "{}" })), /manifest/);
  });
  test("segment et position : bornes, fin 0 = jusqu'à la fin, début ≥ fin = tout", () => {
    const P = MOD["lottie-player"];
    assert.deepEqual(P.segment({}, 90), [0, 90]); assert.deepEqual(P.segment({ segStart: 10, segEnd: 40 }, 90), [10, 40]); assert.deepEqual(P.segment({ segStart: 50, segEnd: 20 }, 90), [0, 90]);
    assert.deepEqual(P.segment({ segStart: 5, segEnd: 500 }, 90), [5, 90]); assert.deepEqual(P.segment({ segStart: 9999 }, 90), [89, 90]);
    assert.deepEqual([P.frameAt(0, [10, 40]), P.frameAt(1, [10, 40]), P.frameAt(0.5, [0, 91]), P.frameAt(-3, [10, 40]), P.frameAt(9, [10, 40])], [10, 39, 45, 10, 39]);
  });
});

describe("Médiathèque : type lu dans le contenu, .json et .lottie", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'actif', created_at TEXT DEFAULT CURRENT_TIMESTAMP)");
  migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
  db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Alpha', 'alpha', '{}'), (1, 'Beta', 'beta', '{}'), (2, 'Autre', 'autre', '{}')");
  // Les réglages du site (Paramètres → Médias) ouvrent la base principale du programme (plus de 2 minutes sur cette machine) : ils sont remplacés par leurs valeurs par défaut, comme le prévoit
  // le code (« réglage indisponible : dossier unique, plafond du serveur »). Le contrôle de contenu, lui, est testé en vrai.
  for (const [name, exports] of [["mediaSettings", { get: () => ({ organize: false }) }], ["settings", { main: () => ({ mediaLimits: {} }) }]]) { const f = require.resolve(`../src/services/${name}`); if (!require.cache[f]) require.cache[f] = { id: f, filename: f, loaded: true, exports, children: [], paths: [] }; }
  const media = require("../src/marketing/media");
  const team = { db, organizationId: 1, userId: null }, other = { db, organizationId: 2, userId: null };
  const up = (ctx, buffer, name, siteId, declared) => media.saveUpload(ctx, { buffer, originalName: name, declaredType: declared || "application/octet-stream", siteId });
  test("sniff : JSON Lottie → type lottie (.json) ; dotLottie → lottie (.lottie) ; le nom ne décide de rien", () => {
    assert.deepEqual(media.sniff(buf(LOT()), "x.png"), { kind: "document", type: "lottie", mime: "application/json", ext: ".json" });
    assert.deepEqual(media.sniff(dotLottie(), "x.lottie"), { kind: "document", type: "lottie", mime: "application/zip", ext: ".lottie" });
    assert.equal(media.sniff(dotLottie(), "x.zip"), null, "une archive qui ne s'appelle pas .lottie n'est pas acceptée"); assert.equal(media.sniff(dotLottie(), "x.docx"), null);
    assert.equal(media.sniff(buf({ hello: 1 }), "x.json"), null); assert.equal(media.sniff(buf(LOT({ nm: "<script>" })), "x.json"), null);
    assert.equal(media.sniff(buf("<html><script>alert(1)</script>"), "x.json"), null);
    assert.equal(media.sniff(Buffer.from("%PDF-1.4\n"), "x.json").type, "pdf", "le contenu prime sur l'extension");
  });
  test("envoi : enregistré dans la médiathèque du site avec son type, adresse fabriquée ; formats, limites et libellés connus", () => {
    const j = up(team, buf(LOT()), "ma-animation.json", 1);
    assert.deepEqual([j.type, j.kind, j.mime, j.reach, j.siteId], ["lottie", "document", "application/json", "site", 1]);
    assert.match(j.path, /^\/uploads\/marketing\/1\/site-1\/\d+-[0-9a-f]{12}\.json$/); assert.equal(j.name, "ma-animation.json");
    assert.ok(fs.existsSync(path.join(SCRATCH, j.path.replace(/^\/uploads\//, "uploads/"))));
    const d = up(team, dotLottie(), "dot.lottie", 1); assert.match(d.path, /\.lottie$/); assert.equal(d.mime, "application/zip");
    assert.equal(media.listMedia(media.forSite(team, 1), { type: "lottie" }).total, 2); assert.equal(media.mediaCounts(media.forSite(team, 1)).lottie, 2);
    assert.equal(media.listMedia(media.forSite(team, 1), { kind: "document" }).total, 0, "pas dans les documents des e-mails");
    assert.ok(media.ACCEPT.includes(".json") && media.ACCEPT.includes(".lottie")); assert.equal(media.uploadConfig().limits.lottie, 2); assert.match(media.FORMATS, /Lottie/);
  });
  test("refus avec message précis ; trop lourd ; e-mails (liste restreinte) ; aucune ligne ni fichier créé", () => {
    const before = db.prepare("SELECT COUNT(*) n FROM mk_media").get().n;
    assert.throws(() => up(team, buf(LOT({ layers: [{ ks: { x: "expr" } }] })), "x.json", 1), /Animation Lottie refusée : expression/);
    assert.throws(() => up(team, buf({ a: 1 }), "x.json", 1), /n'est pas une animation Lottie/);
    assert.throws(() => up(team, dotLottie(LOT({ nm: "http://evil.test/" })), "x.lottie", 1), /Animation Lottie refusée : adresse externe/);
    assert.throws(() => up(team, Buffer.from("PK\x03\x04junk"), "x.lottie", 1), /dotLottie valide|refusée/);
    assert.throws(() => up(team, buf(LOT({ pad: "x".repeat(2.2 * 1024 * 1024) })), "gros.json", 1), /trop lourd|lourd/);
    assert.throws(() => media.saveUpload(team, { buffer: buf(LOT()), originalName: "a.json", declaredType: "application/json", allow: ["image", "pdf"], siteId: 1 }), /animation Lottie/i);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_media").get().n, before);
  });
  test("liaison du chemin à l'organisation et au site (correctif de sécurité)", () => {
    const mine = up(team, buf(LOT()), "a.json", 1), common = up(team, buf(LOT({ nm: "commun" })), "c.json"), theirs = up(other, buf(LOT({ nm: "autre org" })), "o.json", 3);
    const pdf = up(team, Buffer.from("%PDF-1.4\n%x\n"), "x.pdf", 1);
    const h = (o) => H({ db, organizationId: 1, ...o }), ok = (src, o) => V.checkMediaPath(src, h(o), "t", { type: "lottie" });
    assert.equal(ok(mine.path, { pageSiteId: 1 }), mine.path); assert.equal(ok(mine.path, { siteScope: 1 }), mine.path);
    assert.equal(ok(common.path, { pageSiteId: 2 }), common.path, "média commun : utilisable par un site");
    assert.throws(() => ok(theirs.path, { pageSiteId: 1 }), /organisation/);
    assert.throws(() => ok("/uploads/marketing/2/site-3/zzz.json", {}), /organisation/);
    assert.throws(() => ok(mine.path, { pageSiteId: 2 }), /autre site/); assert.throws(() => ok(mine.path, { siteScope: 2 }), /autre site/); assert.throws(() => ok(mine.path, { pageSiteId: null }), /site principal/);
    assert.throws(() => ok(common.path, { siteScope: 1 }), /commune/);
    assert.throws(() => ok("/uploads/marketing/1/site-1/inconnu.json", { pageSiteId: 1 }), /n'existe pas/);
    assert.throws(() => V.checkMediaPath(pdf.path, h({ pageSiteId: 1 }), "t", { type: "lottie" }), /animation Lottie/);
    assert.throws(() => V.checkMediaPath(mine.path, { ctx: {} }, "t", { type: "lottie" }), /vérifier/); assert.throws(() => V.checkMediaPath(mine.path, {}, "t"), /vérifier/);
    for (const bad of ["../../etc/passwd", "/uploads/marketing/1/../2/a.json", "https://evil.test/a.json", "/uploads/marketing/1/site-1/%2e%2e/a.json", "/uploads/blog/a.json"]) assert.throws(() => ok(bad, {}), /médiathèque/, bad);
    // via l'enregistrement d'un élément : les deux lecteurs refusent le fichier d'une autre organisation ; le nouveau lecteur exige aussi un fichier de la médiathèque
    const props = (src) => ({ ...nodes.PALETTE.motionlottie.blank().props, src });
    assert.equal(make("motionlottie", props(mine.path), undefined, h({ pageSiteId: 1 })).props.src, mine.path);
    assert.throws(() => make("motionlottie", props(theirs.path), undefined, h({ pageSiteId: 1 })), /organisation/);
    assert.throws(() => make("motionlottie", props("https://anim.exemple.test/a.json")), /médiathèque/);
    assert.throws(() => make("lottie", { src: theirs.path, alt: "x", trigger: "viewport", loop: true, speed: 1, height: 100, align: "center" }, undefined, h({ pageSiteId: 1 })), /organisation/);
    assert.equal(make("lottie", { src: "https://anim.exemple.test/a.json", alt: "x", trigger: "viewport", loop: true, speed: 1, height: 100, align: "center" }).props.src, "https://anim.exemple.test/a.json", "l'ancien lecteur garde ses adresses https");
    assert.equal(make("motionlottie", props("")).props.src, "", "brouillon sans fichier accepté (la publication l'exige)");
    assert.match(nodes.CUSTOM_WIDGETS.motionlottie.complete(make("motionlottie", props("")).props), /fichier/);
  });
});

describe("Lecteur Lottie : rendu et fiche", () => {
  test("rendu : image d'attente, aucun lien externe, réglages dans data-kw-ms-opts, descriptif lu par les lecteurs d'écran", () => {
    const p = { ...nodes.PALETTE.motionlottie.blank().props, src: "/uploads/marketing/1/site-1/a.json", alt: 'Une "animation"', poster: "/uploads/marketing/1/p.png", caption: "Légende" };
    const html = render("motionlottie", p, { attrs: ' data-kw-ms-module="lottie-player"' });
    assert.match(html, /<figure class="[^"]*kw-ms kw-ms-lt is-center" data-kw-ms-module="lottie-player" data-kw-ms-opts="\{&#34;src&#34;:&#34;\/uploads\/marketing\/1\/site-1\/a.json&#34;/);
    assert.ok(html.includes('role="img" aria-label="Une &#34;animation&#34;"') && html.includes('<img class="kw-ms-lt-poster"') && html.includes("--kw-ms-lt-h: 280px") && !/https?:\/\//.test(html));
    assert.match(render("motionlottie", { ...p, alt: "" }), /aria-hidden="true"/);
  });
  test("fiche : vitesse, boucle, sens, segment, bouton Pause ; tous les déclencheurs du runtime ; module = lottie_light déjà hébergé", () => {
    const s = specOf("motionlottie");
    assert.deepEqual(s.params.map((q) => q.key), ["speed", "loop", "reverse", "segStart", "segEnd", "pausable"]);
    assert.deepEqual(s.controls, ["trigger", "delay", "repeat", "scrub"]);
    assert.ok(fs.existsSync(path.join(ROOT, "public/js/vendor/lottie_light.min.js")));
    assert.ok(/vendor\/lottie_light\.min\.js/.test(fs.readFileSync(path.join(ROOT, "public/js/motion-studio/lottie-player.js"), "utf8")));
    const n = make("motionlottie", undefined, { v: 1, trigger: "scroll", params: { speed: 2, loop: true, segStart: 10, segEnd: 50, reverse: true } });
    assert.deepEqual(n.motion.studio.params, { speed: 2, loop: true, reverse: true, segStart: 10, segEnd: 50 });
    assert.deepEqual(make("motionlottie", undefined, { v: 1, params: { speed: 99, segStart: -4 } }).motion.studio, { v: 1 }, "valeurs hors bornes retirées");
  });
  test("module : sans fichier de la médiathèque, rien n'est chargé", () => {
    const el = (src) => ({ querySelector: () => ({}) }), ctx = (src) => ({ el: el(), opts: { src }, cfg: { params: {} }, win: {}, doc: {}, reduced: false });
    for (const src of ["", "https://evil.test/a.json", "/autre/a.json"]) assert.deepEqual(MOD["lottie-player"].init(ctx(src)), {});
  });
});
