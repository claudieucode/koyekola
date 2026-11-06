// Motion Studio, lot « t » (textes et cascade) : fiches, valeurs par défaut, validation, rendu serveur (contenu complet sans JavaScript, échappement),
// fonctions pures des modules (machine à écrire, brouillage, compteur, texte rotatif, bande liée au défilement) et contrat des 12 composants.
// Navigateur réel : tests/motion-studio-t-navigateur.test.js.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ejs = require("ejs");
const nodes = require("../src/marketing/pages/nodes");
const STUDIO = require("../src/marketing/pages/motionStudio");
const sections = require("../src/marketing/pages/sections");
const TEXT = require("../public/js/motion-studio/text-fx.js");
const SPLIT = require("../public/js/motion-studio/split-text.js");
const KIN = require("../public/js/motion-studio/kinetic.js");
const CAS = require("../public/js/motion-studio/cascade.js");
const MV = require("../public/js/motion-studio/marquee-velocity.js");
const { cssColor, cssUrl } = require("../src/marketing/pages/motionText");

const ROOT = path.join(__dirname, "..");
const H = { ctx: {}, imageUrl: sections.imageUrl, linkUrl: sections.linkUrl, iconNames: nodes.iconNames() };
const T = {
  motionanimatedheading: { fx: "heading", module: "text-fx" },
  motionrevealtext: { module: "split-text" },
  motionkinetictext: { module: "kinetic" },
  motiontypewriter: { fx: "typewriter", module: "text-fx" },
  motionrotatingtext: { fx: "rotating", module: "text-fx" },
  motiongradienttext: { fx: "gradient", module: "text-fx" },
  motiontextmask: { fx: "mask", module: "text-fx" },
  motiontextscramble: { fx: "scramble", module: "text-fx" },
  motionnumberticker: { fx: "ticker", module: "text-fx" },
  motionmarqueevelocity: { module: "marquee-velocity" },
  motioncirculartext: { fx: "circular", module: "text-fx" },
  motioncascade: { module: "cascade" },
};
const TYPES = Object.keys(T);
const norm = (type, props, extra = {}) => nodes.normalizeNode({ id: "tst000000001", type, props: props || nodes.PALETTE[type].blank().props, ...extra }, "test", H, 1, { n: 0, ids: new Set() });
const render = (n) => {
  const cw = nodes.CUSTOM_WIDGETS[n.type];
  const d = cw.data ? cw.data({}, n.props, {}) : null;
  const L = {};
  for (const f of cw.schema) if (f.kind === "items") L[f.key] = (n.props[f.key] || []).map((it) => { const o = {}; for (const sf of f.fields) if (sf.kind === "link" && it[sf.key]) o[sf.key] = it[sf.key]; return o; });
  const tpl = fs.readFileSync(path.join(ROOT, "views/marketing-public/widgets", `${cw.template}.ejs`), "utf8");
  return ejs.render(tpl, { n, p: n.props, cls: `kw-node kw-${n.type} kw-n-${n.id}`, attrs: nodes.motionAttrs(n), L, d, isBuilder: false }).trim();
};
const visibleText = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#34;|&quot;/g, '"').replace(/\s+/g, " ").trim();

describe("lot t : les 12 composants sont enregistrés et conformes au contrat", () => {
  test("enregistrés, groupe, module existant, gabarit existant, attribut d'effet cohérent avec le module text-fx", () => {
    for (const type of TYPES) {
      const cw = nodes.CUSTOM_WIDGETS[type];
      assert.ok(cw, `${type} non enregistré`);
      assert.equal(cw.motion.module, T[type].module, type);
      assert.ok(fs.existsSync(path.join(ROOT, "public/js/motion-studio", `${cw.motion.module}.js`)), type);
      assert.match(cw.template, /^motion-/);
      const html = render(norm(type));
      if (T[type].fx) { assert.ok(html.includes(`data-kw-ms-fx="${T[type].fx}"`), `${type} : effet`); assert.ok(TEXT.FX.includes(T[type].fx), `${type} : effet inconnu du module`); }
      assert.match(html, /data-kw-ms-module="/, `${type} : attributs du runtime`);
    }
    assert.deepEqual([...TEXT.FX].sort(), Object.values(T).filter((x) => x.fx).map((x) => x.fx).sort());
  });
  test("le composant inséré est valide d'office et sa sauvegarde est idempotente", () => {
    for (const type of TYPES) {
      const once = norm(type), twice = nodes.normalizeNode(JSON.parse(JSON.stringify(once)), "test", H, 1, { n: 0, ids: new Set() });
      assert.deepEqual(twice, once, type);
    }
  });
  test("l'éditeur reçoit la fiche (réglages communs, réglages propres, préréglages)", () => {
    const spec = nodes.editorSpec();
    for (const type of TYPES) {
      const t = spec.types.find((x) => x.type === type);
      assert.ok(t && t.motion, type);
      assert.ok(Array.isArray(t.motion.controls) && Array.isArray(t.motion.params), type);
      if (nodes.CUSTOM_WIDGETS[type].motion.presets) assert.ok(t.motion.presets.length >= 2, type);
    }
    assert.equal(spec.types.find((x) => x.type === "motionmarqueevelocity").motion.preview, false, "composant continu : pas de lecture dans le panneau");
  });
  test("chaque réglage commun affiché a un sens pour le composant (pas de contrôle sans effet)", () => {
    for (const type of TYPES) {
      const { controls = [] } = nodes.CUSTOM_WIDGETS[type].motion;
      if (["motiontypewriter", "motiontextscramble", "motionrotatingtext", "motioncirculartext", "motiongradienttext"].includes(type) === false) continue;
      assert.ok(!controls.includes("stagger"), `${type} : pas de décalage entre éléments`);
    }
    assert.deepEqual(nodes.CUSTOM_WIDGETS.motionmarqueevelocity.motion.controls, []);
    assert.ok(!nodes.CUSTOM_WIDGETS.motiontypewriter.motion.controls.includes("duration"), "la durée vient de la vitesse d'écriture");
    assert.ok(!nodes.CUSTOM_WIDGETS.motiontypewriter.motion.controls.includes("easing"));
  });
  test("classes kw-ms-* des gabarits stylées dans motion-studio.css (bloc ms:t)", () => {
    const css = fs.readFileSync(path.join(ROOT, "public/css/motion-studio.css"), "utf8");
    const block = css.slice(css.indexOf("/* ms:t begin"), css.indexOf("/* ms:t end */"));
    assert.ok(block.length > 3000);
    for (const type of TYPES) {
      const cw = nodes.CUSTOM_WIDGETS[type];
      const tpl = fs.readFileSync(path.join(ROOT, "views/marketing-public/widgets", `${cw.template}.ejs`), "utf8").replace(/<%#[\s\S]*?%>/g, "");
      for (const cls of new Set([...tpl.matchAll(/(?<![\w-])kw-ms-[a-z0-9-]+/g)].map((m) => m[0]))) if (!/-$/.test(cls)) assert.ok(css.includes(`.${cls}`), `${type} : classe ${cls} sans style`);
    }
    // classes posées par les modules
    for (const f of ["text-fx", "kinetic", "cascade", "marquee-velocity"]) {
      const js = fs.readFileSync(path.join(ROOT, "public/js/motion-studio", `${f}.js`), "utf8");
      for (const cls of new Set([...js.matchAll(/"(kw-ms-[a-z0-9-]+)"/g)].map((m) => m[1]))) if (!/-$/.test(cls)) assert.ok(css.includes(`.${cls}`), `${f} : classe ${cls} sans style`);
    }
  });
  test("aucune couleur en dur, aucune transition « all », mouvement réduit et pas de bibliothèque d'animation dans le bloc ms:t et les modules", () => {
    const css = fs.readFileSync(path.join(ROOT, "public/css/motion-studio.css"), "utf8");
    const block = css.slice(css.indexOf("/* ms:t begin"), css.indexOf("/* ms:t end */"));
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(block), "couleur en dur");
    assert.ok(!/transition:\s*all/.test(block));
    assert.ok(!/@import|url\(http/.test(block));
    for (const f of ["text-fx", "kinetic", "cascade", "marquee-velocity"]) {
      const js = fs.readFileSync(path.join(ROOT, "public/js/motion-studio", `${f}.js`), "utf8");
      assert.ok(!/gsap|anime\(|framer|from ["']motion|https?:\/\//i.test(js.replace(/\/\/.*$/gm, "")), `${f} : dépendance externe`);
      assert.ok(js.includes("ctx.reduced"), `${f} : mouvement réduit`);
    }
  });
});

describe("rendu serveur : contenu complet lisible sans JavaScript, texte échappé", () => {
  const EVIL = '<script>alert(1)</script>"&';
  test("machine à écrire : préfixe, première phrase et suffixe visibles, autres phrases lisibles (sr-only)", () => {
    const html = render(norm("motiontypewriter", { prefix: "Avant", phrases: [{ text: "un" }, { text: "deux" }, { text: "trois" }], suffix: "après", tag: "h1", cursor: "block" }));
    assert.match(html, /^<h1 class="kw-node kw-motiontypewriter kw-n-tst000000001 kw-ms kw-ms-tpw is-cursor-block"/);
    assert.equal(visibleText(html), "Avant un , deux , trois après");
    assert.equal((html.match(/kw-ms-tpw-p"/g) || []).length, 3);
    assert.ok(html.indexOf("kw-ms-tpw-alt") > html.indexOf('class="kw-ms-tpw-p"'), "la première phrase n'est pas masquée");
  });
  test("texte rotatif : tous les mots dans la page, seul le premier visible, balise sûre", () => {
    const html = render(norm("motionrotatingtext", { before: "Pour", words: [{ text: "A" }, { text: "B" }], after: "ici", tag: "h2" }));
    assert.equal((html.match(/kw-ms-rot-w/g) || []).length, 2); assert.equal((html.match(/kw-ms-rot-alt/g) || []).length, 1);
    assert.equal(visibleText(html), "Pour A B ici");
  });
  test("compteur : valeur FINALE mise en forme dans la page, réglages pour le module en JSON échappé", () => {
    const html = render(norm("motionnumberticker", { from: 0, to: 1234567.891, decimals: 2, prefix: "€", suffix: "k", gap: true, thousands: "space", decimal: "comma", label: "Mon <b>libellé</b>" }));
    assert.ok(html.includes("€1 234 567,89 k"), html);
    assert.ok(html.includes("Mon &lt;b&gt;libellé&lt;/b&gt;"));
    const opts = JSON.parse(html.match(/data-kw-ms-opts="([^"]*)"/)[1].replace(/&#34;/g, '"').replace(/&quot;/g, '"'));
    assert.deepEqual([opts.from, opts.to, opts.decimals, opts.thousands], [0, 1234567.891, 2, "space"]);
  });
  test("échappement : un texte hostile ne produit jamais de balise ni de script, dans les 12 composants", () => {
    const inject = {
      motionanimatedheading: { before: EVIL, highlight: EVIL, after: EVIL },
      motionrevealtext: { text: EVIL },
      motionkinetictext: { lines: [{ text: EVIL, look: "solid" }] },
      motiontypewriter: { prefix: EVIL, phrases: [{ text: EVIL }], suffix: EVIL },
      motionrotatingtext: { before: EVIL, words: [{ text: EVIL }, { text: EVIL }], after: EVIL },
      motiongradienttext: { text: EVIL },
      motiontextmask: { text: EVIL },
      motiontextscramble: { phrases: [{ text: EVIL }] },
      motionnumberticker: { prefix: EVIL, suffix: EVIL, label: EVIL },
      motionmarqueevelocity: { items: [{ text: EVIL }], separator: "<", label: EVIL },
      motioncirculartext: { text: EVIL, center: "<>" },
      motioncascade: { items: [{ title: EVIL, text: EVIL, image: "", alt: EVIL, link: "" }] },
    };
    for (const type of TYPES) {
      const base = nodes.PALETTE[type].blank().props, html = render(norm(type, { ...base, ...inject[type] }));
      assert.ok(!html.includes("<script"), `${type} : balise script`);
      assert.ok(!/<(img|svg|iframe)[^>]*on\w+=/i.test(html), type);
      assert.ok(!html.includes('alert(1)</'), type);
    }
  });
  test("balise inconnue : repli sûr (jamais une balise libre)", () => {
    for (const type of ["motiontypewriter", "motionrotatingtext", "motiongradienttext", "motiontextscramble", "motionkinetictext"]) {
      const n = norm(type); n.props.tag = "iframe";
      assert.match(render(n), /^<h2 /, type);
    }
  });
  test("titre à mot souligné : tracé écrit dans la page, forme selon l'effet choisi, surligneur sans SVG", () => {
    const shapeOf = (preset) => render(norm("motionanimatedheading", null, preset ? { motion: { studio: { v: 1, preset } } } : {}));
    assert.match(shapeOf(), /is-underline/); assert.match(shapeOf(), /<svg class="kw-ms-ahd-deco"/);
    assert.match(shapeOf("circle"), /viewBox="0 0 100 40"/);
    assert.equal((shapeOf("double").match(/<path /g) || []).length, 2);
    assert.ok(!shapeOf("marker").includes("<svg") && shapeOf("marker").includes("kw-ms-ahd-mark"));
    const c = render(norm("motionanimatedheading", { ...nodes.PALETTE.motionanimatedheading.blank().props, color: "token:accent" }));
    assert.match(c, /--kw-ah-c: var\(--kw-accent, #/);
  });
  test("texte dégradé : dégradés composés avec les couleurs du site, boucle fermée sur la première couleur", () => {
    const html = render(norm("motiongradienttext", { ...nodes.PALETTE.motiongradienttext.blank().props, colors: [{ color: "#112233" }, { color: "token:primary" }] }));
    assert.match(html, /--kw-gt-flow: linear-gradient\(90deg, #112233, var\(--kw-primary, #[0-9a-f]+\), #112233\)/i);
    assert.match(html, /--kw-gt-base: linear-gradient\(90deg, #112233, var\(--kw-primary/i);
    assert.equal(visibleText(html), "Un texte plein de couleurs");
  });
  test("texte masqué : couleur de repli toujours sous l'image ; pas d'image = couleur", () => {
    const base = nodes.PALETTE.motiontextmask.blank().props;
    const c = render(norm("motiontextmask", base));
    assert.match(c, /data-kw-ms-fill="color"/); assert.ok(!c.includes("url("));
    const i = render(norm("motiontextmask", { ...base, fill: "image", image: "https://exemple.test/a(1).jpg" }));
    assert.match(i, /data-kw-ms-fill="image"/); assert.ok(i.includes('url(&#34;https://exemple.test/a%281%29.jpg&#34;), linear-gradient('), i);
    assert.equal(nodes.CUSTOM_WIDGETS.motiontextmask.complete({ fill: "image", image: "" }) !== "", true, "publication refusée sans image");
    assert.equal(nodes.CUSTOM_WIDGETS.motiontextmask.complete({ fill: "color", image: "" }), "");
  });
  test("texte circulaire : SVG <textPath> avec vrai texte, remplit le cercle, taille réduite si trop long", () => {
    const short = render(norm("motioncirculartext", { ...nodes.PALETTE.motioncirculartext.blank().props, text: "Hop" }));
    assert.match(short, /<textPath href="#kw-ct-tst000000001"/); assert.match(short, /role="img" aria-label="Hop"/);
    const reps = (short.match(/Hop/g) || []).length; assert.ok(reps >= 4, `répété ${reps} fois`);
    const long = nodes.CUSTOM_WIDGETS.motioncirculartext.data({}, { text: "x".repeat(60), fontSize: 28 });
    assert.ok(long.fs < 28 && long.reps === 1, JSON.stringify(long));
  });
  test("liste animée : liste sémantique, tous les éléments, titre en lien compté, image et alt, colonnes", () => {
    const n = norm("motioncascade", { ...nodes.PALETTE.motioncascade.blank().props, columns: "4", layout: "grid", look: "line", titleTag: "h4", items: [{ title: "A", text: "ta", image: "https://exemple.test/i.jpg", alt: "une image", link: "/page" }, { title: "B", text: "", image: "", alt: "", link: "" }] });
    const html = render(n);
    assert.match(html, /^<ul class="[^"]*kw-ms-casc is-grid is-cols-4 is-look-line"/);
    assert.equal((html.match(/<li class="kw-ms-casc-item"/g) || []).length, 2);
    assert.ok(html.includes('<a class="kw-ms-casc-link" href="/page">A</a>') && html.includes('alt="une image"') && html.includes("<h4 "));
    assert.ok(nodes.CUSTOM_WIDGETS.motioncascade.schema.find((f) => f.key === "items").fields.some((f) => f.kind === "link"), "liens comptés par le moteur");
  });
  test("bande liée au défilement : liste lisible, région nommée, séparateur décoratif", () => {
    const html = render(norm("motionmarqueevelocity"));
    assert.match(html, /role="region" aria-label="Bandeau défilant"/); assert.equal((html.match(/<li /g) || []).length, 4); assert.ok(html.includes('aria-hidden="true">•'));
  });
  test("texte cinétique : chaque ligne en clair, aspect par ligne, couleur d'accent du site", () => {
    const html = render(norm("motionkinetictext"));
    assert.equal((html.match(/kw-ms-kin-line/g) || []).length, 3); assert.ok(html.includes("is-outline") && html.includes("is-accent"));
    assert.match(html, /--kw-kn-accent: var\(--kw-primary/);
    assert.equal(visibleText(html), "Le mouvement donne du caractère");
  });
  test("révélation de texte : même gabarit de découpage que « Texte animé », texte complet, retours à la ligne", () => {
    const html = render(norm("motionrevealtext", { text: "a\nb", tag: "p", split: "lines" }));
    assert.ok(html.includes('data-kw-ms-split="lines"') && html.includes("a<br>b"));
  });
});

describe("validation des champs", () => {
  test("listes bornées : phrases 1 à 8, mots 2 à 8, couleurs 2 à 5, lignes 1 à 8, éléments 1 à 12", () => {
    const tryNode = (type, patch) => { try { return norm(type, { ...nodes.PALETTE[type].blank().props, ...patch }); } catch (e) { return e; } };
    const many = (k, n) => Array.from({ length: n }, (_, i) => ({ text: `t${i}`, color: "#112233", title: `T${i}`, look: "solid", image: "", alt: "", link: "", ...k }));
    assert.ok(tryNode("motiontypewriter", { phrases: [] }) instanceof Error); assert.ok(tryNode("motiontypewriter", { phrases: many({}, 9) }) instanceof Error); assert.ok(!(tryNode("motiontypewriter", { phrases: many({}, 8) }) instanceof Error));
    assert.ok(tryNode("motionrotatingtext", { words: many({}, 1) }) instanceof Error); assert.ok(!(tryNode("motionrotatingtext", { words: many({}, 2) }) instanceof Error));
    assert.ok(tryNode("motiongradienttext", { colors: many({}, 1) }) instanceof Error); assert.ok(tryNode("motiongradienttext", { colors: many({}, 6) }) instanceof Error);
    assert.ok(tryNode("motionkinetictext", { lines: many({}, 9) }) instanceof Error);
    assert.ok(tryNode("motioncascade", { items: [] }) instanceof Error); assert.ok(tryNode("motioncascade", { items: many({}, 13) }) instanceof Error);
  });
  test("compteur : séparateurs identiques refusés, bornes, valeurs hors bornes ramenées au défaut", () => {
    const base = nodes.PALETTE.motionnumberticker.blank().props;
    assert.throws(() => norm("motionnumberticker", { ...base, thousands: "comma", decimal: "comma" }), /différents/);
    assert.throws(() => norm("motionnumberticker", { ...base, thousands: "dot", decimal: "dot" }), /différents/);
    assert.equal(norm("motionnumberticker", { ...base, decimals: 9 }).props.decimals, 0);
    assert.equal(norm("motionnumberticker", { ...base, to: 1e12 }).props.to, 1250);
    assert.equal(norm("motionnumberticker", { ...base, thousands: "x" }).props.thousands, "space");
  });
  test("couleurs et images : valeurs libres refusées (CSS injecté, javascript:)", () => {
    const g = norm("motiongradienttext", { ...nodes.PALETTE.motiongradienttext.blank().props, highlight: "red; background:url(x)" });
    assert.equal(g.props.highlight, "");
    assert.throws(() => norm("motiontextmask", { ...nodes.PALETTE.motiontextmask.blank().props, fill: "image", image: "javascript:alert(1)" }), /image/);
    assert.equal(cssColor("token:primary").startsWith("var(--kw-primary, #"), true); assert.equal(cssColor("#abc"), "#abc"); assert.equal(cssColor(""), "");
    assert.equal(cssUrl('https://a.test/x") ;color:red;("'), 'url("https://a.test/x%22%29%20;color:red;%28%22")');
  });
  test("réglages Motion Studio propres au composant : paramètres bornés, préréglage dans la liste fermée", () => {
    const s = (type, studio) => norm(type, null, { motion: { studio } }).motion;
    assert.deepEqual(s("motiontypewriter", { v: 1, params: { speed: 120, hold: 99999, deleteSpeed: 1, junk: 1 } }).studio.params, { speed: 120 });
    assert.equal(s("motionrotatingtext", { v: 1, preset: "flip" }).studio.preset, "flip");
    assert.deepEqual(s("motionrotatingtext", { v: 1, preset: "inconnu" }), { studio: { v: 1 } }, "préréglage inconnu retiré");
    assert.equal(s("motionrevealtext", { v: 1, preset: "dim" }).studio.preset, "dim");
    assert.equal(s("motiontextscramble", { v: 1, params: { charset: "binary" } }).studio.params.charset, "binary");
    assert.deepEqual(s("motionkinetictext", { v: 1, params: { distance: 500 } }), { studio: { v: 1 } });
  });
  test("boucle par défaut : « une fois » reste choisissable quand le composant boucle par défaut ; la valeur par défaut n'est pas écrite", () => {
    const it = (type, v) => (norm(type, null, { motion: { studio: { v: 1, iterations: v } } }).motion || {}).studio;
    assert.deepEqual(it("motiontypewriter", "infinite"), { v: 1 }, "valeur par défaut = rien d'écrit");
    assert.deepEqual(it("motiontypewriter", 1), { v: 1, iterations: 1 }, "« une fois » est enregistrable");
    assert.equal(it("motiontypewriter", 3).iterations, 3);
    assert.equal(STUDIO.effective(null, nodes.CUSTOM_WIDGETS.motionrotatingtext.motion).iterations, "infinite");
    assert.equal(STUDIO.effective({ iterations: 1 }, nodes.CUSTOM_WIDGETS.motionrotatingtext.motion).iterations, 1);
    // composants sans boucle par défaut : comportement inchangé
    assert.deepEqual(norm("motionrevealtext", null, { motion: { studio: { v: 1, iterations: 1 } } }).motion, { studio: { v: 1 } });
    assert.equal(norm("motionrevealtext", null, { motion: { studio: { v: 1, iterations: 2 } } }).motion.studio.iterations, 2);
  });
  test("« Texte animé » (lot 0) est resté intact : 6 effets, mêmes valeurs par défaut", () => {
    const cw = nodes.CUSTOM_WIDGETS.motionsplittext;
    assert.deepEqual(cw.motion.presets.map((p) => p[0]), ["fade-up", "fade", "blur", "mask-up", "scale", "flip"]);
    assert.deepEqual(Object.keys(SPLIT.PRESETS), ["fade-up", "fade", "blur", "mask-up", "scale", "flip"]);
  });
});

describe("module split-text étendu (Révélation de texte)", () => {
  test("chaque effet de la fiche existe dans le module, images-clés sans propriété de mise en page", () => {
    const all = { ...SPLIT.PRESETS, ...SPLIT.REVEAL };
    for (const [id] of nodes.CUSTOM_WIDGETS.motionrevealtext.motion.presets) assert.ok(all[id], id);
    for (const frames of Object.values(SPLIT.REVEAL)) for (const f of frames) for (const k of Object.keys(f)) assert.ok(["opacity", "transform", "filter", "clipPath"].includes(k), k);
    assert.deepEqual(Object.keys(SPLIT.REVEAL).sort(), ["blur-in", "dim", "rotate", "slide-left", "slide-right", "wipe"]);
  });
});

describe("machine à écrire : plan et position (fonctions pures)", () => {
  const plan = TEXT.twPlan(["ab", "cde"], { speed: 100, del: 50, hold: 1000, loop: true });
  test("écriture, pause, effacement, silence ; durée totale exacte", () => {
    // ab : 200 + 1000 + 100 + 200 ; cde : 300 + 1000 + 150 + 200
    assert.equal(plan.total, 200 + 1000 + 100 + 200 + 300 + 1000 + 150 + 200);
    assert.deepEqual(TEXT.twAt(plan, 0), { i: 0, n: 0 });
    assert.deepEqual(TEXT.twAt(plan, 100), { i: 0, n: 1 });
    assert.deepEqual(TEXT.twAt(plan, 199), { i: 0, n: 1 });
    assert.deepEqual(TEXT.twAt(plan, 200), { i: 0, n: 2 });
    assert.deepEqual(TEXT.twAt(plan, 1100), { i: 0, n: 2 }, "pause");
    assert.deepEqual(TEXT.twAt(plan, 1250), { i: 0, n: 1 }, "effacement à moitié");
    assert.deepEqual(TEXT.twAt(plan, 1350), { i: 0, n: 0 });
    assert.deepEqual(TEXT.twAt(plan, 1500 + 150), { i: 1, n: 1 });
    assert.deepEqual(TEXT.twAt(plan, plan.total), { i: 1, n: 0 }, "fin de boucle : vide, prêt à recommencer");
  });
  test("sans boucle : la dernière phrase reste écrite", () => {
    const p = TEXT.twPlan(["ab", "cde"], { speed: 100, del: 50, hold: 1000, loop: false });
    assert.deepEqual(TEXT.twAt(p, p.total), { i: 1, n: 3 });
    assert.deepEqual(TEXT.twAt(p, p.total + 5000), { i: 1, n: 3 }, "au-delà : borné");
  });
  test("lettres comptées en points de code (émoji, accents combinés)", () => {
    const p = TEXT.twPlan(["a👍é"], { speed: 100, del: 50, hold: 10, loop: false });
    assert.equal(p.segs[0].n, 3); assert.equal(p.total, 310);
  });
});

describe("brouillage : plan et texte (fonctions pures)", () => {
  test("p = 1 : texte final ; p = 0 : tout brouillé sauf les espaces ; même entrée = même sortie", () => {
    const chars = Array.from("Salut le monde");
    assert.equal(TEXT.scrambleText(chars, 1, { set: TEXT.CHARSETS.letters }), "Salut le monde");
    const a = TEXT.scrambleText(chars, 0, { set: TEXT.CHARSETS.caps, bucket: 3 });
    assert.equal(a.length, chars.length); assert.equal(a[5], " "); assert.equal(a[8], " ");
    assert.ok(/^[A-Z]{5} [A-Z]{2} [A-Z]{5}$/.test(a), a);
    assert.equal(a, TEXT.scrambleText(chars, 0, { set: TEXT.CHARSETS.caps, bucket: 3 }));
    assert.notEqual(a, TEXT.scrambleText(chars, 0, { set: TEXT.CHARSETS.caps, bucket: 4 }), "le brouillage évolue d'un instant à l'autre");
  });
  test("de gauche à droite : les premières lettres se fixent d'abord ; dans le désordre : tout est fixé à p = 1", () => {
    const chars = Array.from("ABCDEFGH");
    const mid = TEXT.scrambleText(chars, 0.5, { set: "z", order: "ltr" });
    assert.equal(mid, "ABCDzzzz");
    for (const p of [0.2, 0.6, 0.99]) assert.equal(TEXT.scrambleText(chars, p, { set: "z", order: "random" }).length, 8);
    assert.equal(TEXT.scrambleText(chars, 1, { set: "z", order: "random" }), "ABCDEFGH");
    assert.equal(TEXT.scrambleText(Array.from("1 0"), 0, { set: TEXT.CHARSETS.binary }).replace(/[01]/g, "x"), "x x");
  });
  test("plan de plusieurs textes : pause seulement s'il y a plusieurs textes ou une boucle", () => {
    const one = TEXT.scPlan(1, 1000, 500, false), two = TEXT.scPlan(2, 1000, 500, false);
    assert.equal(one.total, 1000); assert.equal(two.total, 3000); assert.equal(TEXT.scPlan(1, 1000, 500, true).total, 1500);
    assert.deepEqual(TEXT.scAt(two, 0), { i: 0, p: 0 }); assert.deepEqual(TEXT.scAt(two, 500), { i: 0, p: 0.5 });
    assert.deepEqual(TEXT.scAt(two, 1200), { i: 0, p: 1 }); assert.deepEqual(TEXT.scAt(two, 1500), { i: 1, p: 0 });
    assert.deepEqual(TEXT.scAt(two, 99999), { i: 1, p: 1 });
  });
  test("hasard stable dans [0, 1[", () => { for (let i = 0; i < 500; i++) { const h = TEXT.hash(i, i * 7); assert.ok(h >= 0 && h < 1); } });
});

describe("compteur : mise en forme (serveur et navigateur identiques)", () => {
  const f = (v, o) => TEXT.formatNumber(v, o);
  test("séparateurs, décimales, préfixe, suffixe, signe moins", () => {
    assert.equal(f(1234567.891, { decimals: 2, thousands: "space", decimal: "comma" }), "1 234 567,89");
    assert.equal(f(1234567.891, { decimals: 2, thousands: "comma", decimal: "dot" }), "1,234,567.89");
    assert.equal(f(1234567, { thousands: "dot" }), "1.234.567"); assert.equal(f(1234567, { thousands: "apos" }), "1’234’567"); assert.equal(f(1234567, { thousands: "none" }), "1234567");
    assert.equal(f(42, { prefix: "€", suffix: " %", decimals: 1, decimal: "dot" }), "€42.0 %");
    assert.equal(f(-1500, { thousands: "space", prefix: "$" }), "−$1 500");
    assert.equal(f(-0.001, { decimals: 1 }), "0,0", "pas de « −0 »");
    assert.equal(f(999, { thousands: "space" }), "999"); assert.equal(f(1000, { thousands: "space" }), "1 000");
  });
  test("séparateurs identiques ou valeurs absurdes : jamais deux séparateurs égaux, jamais NaN", () => {
    assert.equal(f(1234.5, { decimals: 1, thousands: "comma", decimal: "comma" }), "1 234,5");
    assert.equal(f(NaN, {}), "0"); assert.equal(f(Infinity, {}), "0"); assert.equal(f(5, { decimals: 99 }), "5,0000");
  });
});

describe("texte rotatif : images-clés (fonctions pures)", () => {
  test("chaque mot : caché, entre, reste, sort ; offsets croissants entre 0 et 1 ; un seul mot visible à la fois", () => {
    const n = 3, x = 500, hold = 1500, T = x + hold + x;
    for (const loop of [true, false]) {
      const all = Array.from({ length: n }, (_, i) => TEXT.rotFrames(i, n, x, hold, loop, "fade-up", "ease"));
      all.forEach((kf, i) => {
        let prev = 0;
        for (const f of kf) { assert.ok(f.offset >= prev && f.offset <= 1, `mot ${i} offsets`); prev = f.offset; }
        assert.equal(kf[0].offset, 0); assert.equal(kf[kf.length - 1].offset, 1);
      });
      // opacité d'un mot à un instant (interpolation linéaire entre images-clés)
      const op = (kf, t) => { const o = t / (n * T); for (let k = 1; k < kf.length; k++) if (o <= kf[k].offset) { const a = kf[k - 1], b = kf[k], r = b.offset === a.offset ? 1 : (o - a.offset) / (b.offset - a.offset); return a.opacity + (b.opacity - a.opacity) * r; } return kf[kf.length - 1].opacity; };
      for (let t = 0; t <= n * T; t += 50) { const sum = all.reduce((s, kf) => s + op(kf, t), 0); assert.ok(sum <= 1.0001, `t=${t} somme d'opacités ${sum}`); }
      const last = all[n - 1], end = last[last.length - 1];
      assert.equal(end.opacity, loop ? 0 : 1, "sans boucle le dernier mot reste affiché");
    }
  });
  test("6 transitions, propriétés autorisées seulement", () => {
    assert.deepEqual(Object.keys(TEXT.ROT).sort(), nodes.CUSTOM_WIDGETS.motionrotatingtext.motion.presets.map((p) => p[0]).sort());
    for (const P of Object.values(TEXT.ROT)) for (const k of ["inn", "out"]) for (const p of Object.keys(P[k])) assert.ok(["opacity", "transform", "filter"].includes(p), p);
  });
});

describe("texte cinétique et liste animée : effets", () => {
  test("effets de la fiche = effets du module ; images-clés sans propriété de mise en page", () => {
    assert.deepEqual(Object.keys(KIN.PRESETS).sort(), nodes.CUSTOM_WIDGETS.motionkinetictext.motion.presets.map((p) => p[0]).sort());
    assert.deepEqual(Object.keys(CAS.PRESETS).sort(), nodes.CUSTOM_WIDGETS.motioncascade.motion.presets.map((p) => p[0]).sort());
    for (const make of Object.values(KIN.PRESETS)) for (const i of [0, 1]) for (const f of make(i, 30)) for (const k of Object.keys(f)) assert.ok(["opacity", "transform", "filter"].includes(k), k);
    for (const frames of Object.values(CAS.PRESETS)) for (const f of frames) for (const k of Object.keys(f)) assert.ok(["opacity", "transform", "filter"].includes(k), k);
  });
  test("glissement alterné : les lignes paires et impaires partent de côtés opposés", () => {
    assert.match(KIN.PRESETS.slide(0, 30)[0].transform, /-30%/); assert.match(KIN.PRESETS.slide(1, 30)[0].transform, /translateX\(30%/);
    assert.match(KIN.PRESETS.drift(0, 20)[0].transform, /-20%/); assert.match(KIN.PRESETS.drift(0, 20)[1].transform, /translateX\(20%/);
  });
});

describe("bande liée au défilement : vitesse, sens, boucle (fonctions pures)", () => {
  test("vitesse = base + vitesse de défilement × facteur / 10, plafonnée", () => {
    assert.equal(MV.speedOf(60, 0, 3), 60); assert.equal(MV.speedOf(60, 1000, 3), 360); assert.equal(MV.speedOf(60, -1000, 3), 360);
    assert.equal(MV.speedOf(60, 99999, 10), 60 + 3000); assert.equal(MV.speedOf(60, 1000, 0), 60); assert.equal(MV.speedOf(60, 1000, -5), 60);
  });
  test("sens inversé en remontant la page seulement si demandé", () => {
    assert.equal(MV.directionOf(-1, 500, true), -1); assert.equal(MV.directionOf(-1, -500, true), 1); assert.equal(MV.directionOf(-1, -500, false), -1); assert.equal(MV.directionOf(-1, -10, true), -1);
  });
  test("position bouclée dans ]-largeur, 0] ; inclinaison bornée", () => {
    assert.equal(MV.wrap(-250, 100), -50); assert.equal(MV.wrap(30, 100), -70); assert.equal(MV.wrap(-100, 100), 0 - 0); assert.equal(MV.wrap(5, 0), 0);
    for (let x = -1000; x < 1000; x += 37) { const w = MV.wrap(x, 100); assert.ok(w <= 0 && w > -100, `${x} -> ${w}`); }
    assert.equal(MV.skewOf(1e6), 8); assert.equal(MV.skewOf(-1e6), -8); assert.equal(MV.skewOf(0), 0);
  });
});
