// Motion Studio, lot 0 : schéma versionné `motion.studio`, auto-découverte et rendu des composants, runtime partagé (fonctions pures), module split-text.
// Navigateur réel : tests/manuel/motion-studio-chrome.js (hors suite, demande Chrome + playwright-core).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ejs = require("ejs");
const nodes = require("../src/marketing/pages/nodes");
const motion = require("../src/marketing/pages/motion");
const STUDIO = require("../src/marketing/pages/motionStudio");
const widgets = require("../src/marketing/pages/widgets");
const sections = require("../src/marketing/pages/sections");
const KWMS = require("../public/js/kw-motion-studio.js");
const SPLIT = require("../public/js/motion-studio/split-text.js");

const ROOT = path.join(__dirname, "..");
const H = { ctx: {}, imageUrl: sections.imageUrl, linkUrl: sections.linkUrl, iconNames: nodes.iconNames() };
const SPEC = nodes.CUSTOM_WIDGETS.motionsplittext.motion;
const node = (studio, extra = {}) => nodes.normalizeNode({ id: "mst000000001", type: "motionsplittext", props: nodes.PALETTE.motionsplittext.blank().props, motion: studio === undefined ? undefined : { studio }, ...extra }, "test", H, 1, { n: 0, ids: new Set() });
const head = (studio) => nodes.normalizeNode({ id: "head00000001", type: "heading", props: { text: "Titre", level: "2" }, motion: studio === undefined ? undefined : { studio } }, "test", H, 1, { n: 0, ids: new Set() });

describe("schéma motion.studio v1", () => {
  test("réglages valides conservés, valeurs par défaut non écrites, clés inconnues retirées", () => {
    const n = node({ v: 1, preset: "blur", trigger: "scroll", duration: 900, delay: 100, easing: "ease-out", stagger: 20, scrub: { start: 10, end: 80 }, off: ["mobile"], rm: "fade", alwaysMotion: true, params: { from: "center", inconnu: 1 }, junk: "x" });
    assert.deepEqual(n.motion.studio, { v: 1, preset: "blur", trigger: "scroll", duration: 900, delay: 100, easing: "ease-out", stagger: 20, scrub: { start: 10, end: 80 }, off: ["mobile"], rm: "fade", alwaysMotion: true, params: { from: "center" } });
    const d = node({ v: 1, preset: "fade-up", trigger: "viewport", duration: 700, stagger: 40, params: { from: "start" } });
    assert.deepEqual(d.motion.studio, { v: 1 }, "valeurs par défaut du composant : rien d'écrit");
  });
  test("bornes et listes fermées : valeur hors limite, inconnue ou mal typée retirée sans erreur", () => {
    const n = node({ v: 1, preset: "inexistant", trigger: "teleport", duration: 5, delay: 99999, stagger: 5000, easing: "url(x)", iterations: 50, direction: "sideways", off: ["desktop", "tablet", "mobile"], rm: "boom", params: { from: "nulle part" } });
    assert.deepEqual(n.motion.studio, { v: 1 });
    assert.equal(node({ v: 1, duration: 50 }).motion.studio.duration, 50);
    assert.equal(node({ v: 1, duration: 10000 }).motion.studio.duration, 10000);
    assert.equal(node({ v: 1, duration: 10001 }).motion.studio.duration, undefined);
    assert.equal(node({ v: 1, duration: 100.5 }).motion.studio.duration, undefined, "entier exigé");
    assert.equal(node({ v: 1, iterations: "infinite" }).motion.studio.iterations, "infinite");
    assert.equal(node({ v: 1, easing: "cubic-bezier(0.1, 0.2, 0.3, 1)" }).motion.studio.easing, "cubic-bezier(0.1, 0.2, 0.3, 1)");
    assert.equal(node({ v: 1, easing: "cubic-bezier(5, 0, 0, 1)" }).motion.studio.easing, undefined);
    assert.equal(node({ v: 1, scrub: { start: 80, end: 20 } }).motion.studio.scrub, undefined, "début avant fin");
  });
  test("version : absente = 1 ; future ou illisible ignorée ; non objet ignoré", () => {
    assert.equal(node({ duration: 900 }).motion.studio.duration, 900);
    for (const bad of [{ v: 2, duration: 900 }, { v: 0 }, { v: "x" }, "texte", 5, [1], null]) assert.equal(node(bad).motion, undefined, JSON.stringify(bad));
  });
  test("migration : un maillon MIGRATIONS[n] est appliqué en chaîne", () => {
    const real = STUDIO.CURRENT;
    assert.equal(real, 1);
    assert.deepEqual(STUDIO.MIGRATIONS, {}, "aucune migration tant qu'il n'y a qu'une version");
  });
  test("« selon le défilement » ne garde ni répétition ni boucle", () => {
    const s = node({ v: 1, trigger: "scroll", repeat: true, iterations: 3 }).motion.studio;
    assert.equal(s.repeat, undefined); assert.equal(s.iterations, undefined);
  });
  test("sur un élément ordinaire (sans fiche) : réglages communs gardés, préréglage et paramètres retirés ; coexiste avec l'animation d'entrée", () => {
    const n = nodes.normalizeNode({ id: "head00000001", type: "heading", props: { text: "T", level: "2" }, motion: { entrance: "fade-in-up", studio: { v: 1, preset: "x", duration: 400, params: { a: 1 } } } }, "t", H, 1, { n: 0, ids: new Set() });
    assert.equal(n.motion.entrance, "fade-in-up"); assert.deepEqual(n.motion.studio, { v: 1, duration: 400 });
  });
  test("idempotent : normaliser deux fois donne le même résultat", () => {
    const a = node({ v: 1, preset: "flip", trigger: "load", stagger: 10, params: { from: "random" }, off: ["tablet"] }).motion;
    assert.deepEqual(node(a.studio).motion, a);
  });
  test("pages existantes inchangées : sans studio, motion identique à avant ; élément ordinaire sans attribut data-kw-ms", () => {
    assert.equal(head(undefined).motion, undefined);
    const h = nodes.normalizeNode({ id: "head00000001", type: "heading", props: { text: "T", level: "2" }, motion: { entrance: "fade-in-up", duration: 800 } }, "t", H, 1, { n: 0, ids: new Set() });
    assert.deepEqual(h.motion, { entrance: "fade-in-up", duration: 800, delay: 0 });
    assert.ok(!nodes.motionAttrs(h).includes("data-kw-ms"));
  });
});

describe("attributs, utilisation et éditeur", () => {
  test("le composant porte toujours module + réglages effectifs, même sans réglage enregistré", () => {
    const a = nodes.motionAttrs(node(undefined));
    assert.match(a, /data-kw-ms-module="split-text"/);
    const cfg = JSON.parse(a.match(/data-kw-ms="([^"]*)"/)[1].replace(/&quot;/g, '"'));
    assert.deepEqual([cfg.preset, cfg.trigger, cfg.duration, cfg.stagger, cfg.params.from], ["fade-up", "viewport", 700, 40, "start"]);
    assert.ok(!a.includes("data-kw-motion-always"));
    const al = nodes.motionAttrs(node({ v: 1, alwaysMotion: true, preset: "blur" }));
    assert.equal(al.split("data-kw-motion-always").length, 2, "attribut écrit une seule fois");
  });
  test("usage : null sans composant ; css et module quand la page en contient", () => {
    const spec = (t) => (nodes.CUSTOM_WIDGETS[t] && nodes.CUSTOM_WIDGETS[t].motion) || null;
    const sec = (...c) => [{ id: "sect00000001", type: "layout", children: c }];
    assert.equal(STUDIO.usage(sec(head(undefined)), nodes.walk, spec), null);
    assert.deepEqual(STUDIO.usage(sec(node(undefined)), nodes.walk, spec), { css: true, modules: ["split-text"] });
    assert.deepEqual(STUDIO.usage(sec(head({ v: 1, duration: 400 })), nodes.walk, spec), { css: false, modules: [] });
  });
  test("l'éditeur reçoit le schéma, les triggers, et la fiche du composant", () => {
    const spec = nodes.editorSpec();
    assert.equal(spec.motionStudio.v, 1);
    assert.deepEqual(spec.motionStudio.triggers.map((t) => t[0]), ["viewport", "load", "click", "hover", "scroll"]);
    const t = spec.types.find((x) => x.type === "motionsplittext");
    assert.equal(t.motion.module, "split-text"); assert.equal(t.motion.presets.length, 6); assert.equal(t.motion.defaults.preset, "fade-up");
    assert.ok(t.motion.controls.includes("stagger"));
    assert.equal(spec.types.find((x) => x.type === "heading").motion, undefined);
  });
});

describe("contrat des composants (auto-découverte)", () => {
  const files = fs.readdirSync(path.join(ROOT, "src/marketing/pages/widgets")).filter((f) => /^motion-.+\.js$/.test(f));
  test("chaque widgets/motion-*.js est chargé automatiquement, a son gabarit, son module et ses classes stylées dans motion-studio.css", () => {
    assert.ok(files.length >= 1);
    const css = fs.readFileSync(path.join(ROOT, "public/css/motion-studio.css"), "utf8");
    for (const f of files) {
      const def = require(path.join(ROOT, "src/marketing/pages/widgets", f));
      assert.ok(nodes.CUSTOM_WIDGETS[def.type], `${f} non enregistré`);
      assert.match(def.template, /^motion-/, `${f} : gabarit motion-<nom>`);
      const tpl = path.join(ROOT, "views/marketing-public/widgets", `${def.template}.ejs`);
      assert.ok(fs.existsSync(tpl), tpl);
      assert.ok(def.motion && fs.existsSync(path.join(ROOT, "public/js/motion-studio", `${def.motion.module}.js`)), `${f} : module d'exécution`);
      for (const cls of new Set([...fs.readFileSync(tpl, "utf8").replace(/<%#[\s\S]*?%>/g, "").matchAll(/(?<![\w-])kw-ms[a-z0-9-]*/g)].map((m) => m[0]))) assert.ok(css.includes(`.${cls}`), `classe ${cls} sans style`);
    }
  });
  test("fiche motion invalide refusée avec un message clair", () => {
    const base = { type: "motionfoo", label: "x", group: "advanced", icon: "play", keywords: "x", version: 1, schema: [{ key: "a", kind: "text", label: "A" }] };
    assert.throws(() => widgets.check({ ...base, motion: { module: "introuvable-xyz" } }, "t"), /introuvable/);
    assert.throws(() => widgets.check({ ...base, motion: { module: "split-text", controls: ["preset"] } }, "t"), /presets/);
    assert.throws(() => widgets.check({ ...base, motion: { module: "split-text", params: [{ key: "n", kind: "number", label: "N" }] } }, "t"), /min, max/);
    assert.throws(() => widgets.check({ ...base, motion: { module: "split-text", defaults: { duration: 5 } } }, "t"), /defaults\.duration/);
    assert.doesNotThrow(() => widgets.check({ ...base, motion: { module: "split-text", defaults: { duration: 500 } } }, "t"));
  });
  test("composant inséré : contenu valide d'office et sauvegarde idempotente", () => {
    const b = nodes.PALETTE.motionsplittext.blank();
    const once = node(undefined, { props: b.props }), twice = nodes.normalizeNode(JSON.parse(JSON.stringify(once)), "test", H, 1, { n: 0, ids: new Set() });
    assert.deepEqual(twice, once);
  });
  test("champs du composant : balise et découpage en listes fermées, texte borné", () => {
    const tryNode = (props) => { try { return node(undefined, { props }).props; } catch { return null; } };
    for (const p of [tryNode({ text: "x", tag: "script", split: "words" }), tryNode({ text: "x", tag: "h2", split: "paragraphes" })]) assert.ok(p === null || (["h1", "h2", "h3", "h4", "p", "div"].includes(p.tag) && ["chars", "words", "lines"].includes(p.split)));
    const long = tryNode({ text: "x".repeat(401), tag: "h2", split: "words" });
    assert.ok(long === null || long.text.length <= 400);
  });
});

describe("rendu serveur du texte animé", () => {
  const render = (props, attrs = "") => ejs.render(fs.readFileSync(path.join(ROOT, "views/marketing-public/widgets/motion-split-text.ejs"), "utf8"), { p: props, cls: "kw-node kw-motionsplittext kw-n-x", attrs, isBuilder: false }).trim();
  test("texte complet lisible sans JavaScript, échappé, retours à la ligne en <br>", () => {
    const html = render({ text: "Bonjour <b>&\nle monde", tag: "h1", split: "chars" }, ' data-kw-ms-module="split-text"');
    assert.match(html, /^<h1 class="kw-node kw-motionsplittext kw-n-x kw-ms kw-ms-st" data-kw-ms-split="chars"/);
    assert.ok(html.includes("Bonjour &lt;b&gt;&amp;<br>le monde"));
    assert.ok(!/<b>/.test(html));
  });
  test("balise ou découpage inconnu : repli sûr", () => {
    const html = render({ text: "x", tag: "iframe", split: "zzz" });
    assert.match(html, /^<h2 /); assert.ok(html.includes('data-kw-ms-split="words"'));
  });
});

describe("runtime partagé (fonctions pures)", () => {
  test("registre : register / registered, init non fonction ignoré", () => {
    KWMS.register("zz-test", () => ({})); KWMS.register("zz-bad", 5);
    assert.ok(KWMS.registered().includes("zz-test")); assert.ok(!KWMS.registered().includes("zz-bad"));
  });
  test("courbes identiques à celles du serveur ; courbe personnalisée acceptée, texte libre refusé", () => {
    for (const [k, v] of Object.entries(motion.EASINGS)) assert.equal(KWMS.easingCss(k), v, k);
    assert.equal(KWMS.easingCss("cubic-bezier(0.1, 0.2, 0.3, 1)"), "cubic-bezier(0.1, 0.2, 0.3, 1)");
    assert.equal(KWMS.easingCss("javascript:alert(1)"), motion.EASINGS.smooth);
  });
  test("valeurs communes identiques à celles du serveur", () => {
    for (const k of Object.keys(KWMS.DEFAULTS)) assert.equal(KWMS.DEFAULTS[k], STUDIO.BASE_DEFAULTS[k], k);
    assert.deepEqual([...KWMS.TRIGGERS], Object.keys(STUDIO.TRIGGERS));
  });
  test("points de rupture", () => {
    assert.deepEqual([320, 767, 768, 1023, 1024, 1920].map(KWMS.breakpointOf), ["mobile", "mobile", "tablet", "tablet", "desktop", "desktop"]);
  });
  test("cascade : ordre selon le sens, plafond de 4 s, un seul élément sans retard", () => {
    const d = (from, n = 5) => Array.from({ length: n }, (_, i) => KWMS.staggerDelay(i, n, 100, from));
    assert.deepEqual(d("start"), [0, 100, 200, 300, 400]); assert.deepEqual(d("end"), [400, 300, 200, 100, 0]); assert.deepEqual(d("center"), [200, 100, 0, 100, 200]);
    assert.equal(Math.max(...Array.from({ length: 400 }, (_, i) => KWMS.staggerDelay(i, 400, 100, "start"))), 4000);
    assert.equal(KWMS.staggerDelay(0, 1, 100, "start"), 0); assert.equal(KWMS.staggerDelay(3, 8, 0, "start"), 0);
    assert.ok(Array.from({ length: 8 }, (_, i) => KWMS.staggerDelay(i, 8, 50, "random", () => 0.5)).every((x) => x >= 0 && x <= 350));
  });
  test("progression du défilement : bornes, plage, début avant fin", () => {
    const r = (top) => ({ top, height: 200 }), vh = 800;
    assert.equal(KWMS.scrollProgress(r(800), vh), 0); assert.equal(KWMS.scrollProgress(r(-200), vh), 1);
    assert.equal(KWMS.scrollProgress(r(300), vh), 0.5);
    assert.equal(KWMS.scrollProgress(r(300), vh, 50, 100), 0); assert.equal(KWMS.scrollProgress(r(300), vh, 0, 50), 1);
    assert.ok(KWMS.scrollProgress(r(300), vh, 60, 10) >= 0);
  });
  test("configuration : défauts, JSON illisible, valeurs bornées, scroll sans répétition, écrans coupés", () => {
    const el = (json, extra = false) => ({ getAttribute: (k) => (k === "data-kw-ms" ? json : null), hasAttribute: () => extra });
    assert.equal(KWMS.parseConfig(el("pas du json")).duration, 700);
    const c = KWMS.parseConfig(el(JSON.stringify({ trigger: "scroll", iterations: 4, duration: 999999, stagger: -5, off: ["mobile"] })));
    assert.deepEqual([c.trigger, c.iterations, c.duration, c.stagger, c.off], ["scroll", 1, 10000, 0, ["mobile"]]);
    assert.equal(KWMS.parseConfig(el(JSON.stringify({ trigger: "x" }))).trigger, "viewport");
    assert.equal(KWMS.parseConfig(el("{}", true)).always, true);
  });
});

describe("module split-text", () => {
  test("mots et lettres : espaces conservés, caractères composés et émojis entiers", () => {
    assert.deepEqual(SPLIT.splitWords("Salut  le monde").map((p) => p.w || "_"), ["Salut", "_", "le", "_", "monde"]);
    assert.deepEqual(SPLIT.charsOf("é👍a"), ["é", "👍", "a"]);
  });
  test("6 effets, images-clés sans propriété de mise en page", () => {
    assert.deepEqual(Object.keys(SPLIT.PRESETS).sort(), SPEC.presets.map((p) => p[0]).sort());
    for (const frames of Object.values(SPLIT.PRESETS)) for (const f of frames) for (const k of Object.keys(f)) assert.ok(["opacity", "transform", "filter"].includes(k), k);
  });
  test("mouvement réduit ou texte absent : aucun découpage (le contenu reste intact)", () => {
    const el = { querySelector: () => null };
    assert.deepEqual(SPLIT.init({ el, reduced: false, cfg: {}, doc: {} }), {});
    const src = {}; assert.deepEqual(SPLIT.init({ el: { querySelector: () => src }, reduced: true, cfg: {}, doc: {} }), {});
  });
  test("le CSS n'utilise ni #fff ni #000 en dur ni propriété de mise en page animée", () => {
    const css = fs.readFileSync(path.join(ROOT, "public/css/motion-studio.css"), "utf8");
    assert.ok(!/#(?:f{3}|f{6}|0{3}|0{6})\b/i.test(css));
    assert.ok(!/transition:\s*all/.test(css));
    assert.ok(css.includes("prefers-reduced-motion"));
  });
});
