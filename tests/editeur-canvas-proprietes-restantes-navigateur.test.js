// Éditeur de pages — suite de « réglages effectifs » : TOUTES les propriétés de style qui n'ont pas été vérifiées par
// editeur-canvas-proprietes-effectives-navigateur.test.js (typographie, couleurs, bordures par côté et par coin, ombres, grille, placement dans la
// grille, position, fond, médias) et les réglages composés (dégradé, voile, ombre libre, filtres, transformation, masque, image de fond).
// Chaque valeur enregistrée doit produire le CSS calculé attendu dans la page publiée (vrai Chrome). Un garde-fou échoue si une propriété de
// STYLE_PROPS n'est vérifiée dans aucun des deux fichiers : un contrôle d'Inspecteur ne doit jamais être décoratif.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const nodes = require("../src/marketing/pages/nodes");
const zlib = require("zlib");
// PNG uni de la taille demandée (envoyé à la médiathèque comme le fait l'interface)
const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const png = (w, h, rgb) => { const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3); return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]); };

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

// Propriétés déjà vérifiées par le premier fichier (conteneurs et widgets)
const COVERED_BEFORE = ["width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "marginTop", "marginRight", "marginBottom", "marginLeft", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignContent", "gap", "rowGap", "columnGap", "alignSelf", "order", "flexGrow", "flexShrink", "flexBasis", "position", "zIndex", "overflow", "opacity", "backgroundColor", "borderStyle", "borderWidth", "borderRadius", "color", "fontSize"];
// [type de l'élément, propriété, valeur, propriété CSS calculée, attendu (texte exact, RegExp, ou fonction) , réglages associés, parent grille ?]
const CASES = [
  ["text", "fontFamily", "font.lobster", "font-family", /Lobster/], ["text", "fontWeight", "700", "font-weight", "700"], ["text", "fontStyle", "italic", "font-style", "italic"],
  ["text", "lineClamp", 2, "-webkit-line-clamp", "2"], ["text", "lineHeight", 2, "line-height", "40px", { fontSize: "20px" }], ["text", "letterSpacing", "3px", "letter-spacing", "3px"], ["text", "wordSpacing", "5px", "word-spacing", "5px"],
  ["text", "textStrokeWidth", "2px", "-webkit-text-stroke-width", "2px"], ["text", "textStrokeColor", "#ff0000", "-webkit-text-stroke-color", "rgb(255, 0, 0)"],
  ["text", "textIndent", "20px", "text-indent", "20px"], ["text", "textTransform", "uppercase", "text-transform", "uppercase"], ["text", "textAlign", "center", "text-align", "center"],
  ["text", "textDecoration", "underline", "text-decoration-line", "underline"], ["text", "textShadow", "md", "text-shadow", /rgba?\(15, 23, 42/],
  // Propriétés ajoutées (retour à la ligne, curseur, fusion, contour, débordement par axe, pistes de grille automatiques)
  ["text", "whiteSpace", "nowrap", "white-space", "nowrap"], ["text", "textWrap", "balance", "text-wrap-style", "balance"], ["text", "overflowWrap", "anywhere", "overflow-wrap", "anywhere"], ["text", "textOverflow", "ellipsis", "text-overflow", "ellipsis"],
  ["text", "visibility", "hidden", "visibility", "hidden"], ["text", "cursor", "pointer", "cursor", "pointer"], ["text", "pointerEvents", "none", "pointer-events", "none"], ["text", "mixBlendMode", "multiply", "mix-blend-mode", "multiply"],
  ["container", "overflowX", "auto", "overflow-x", "auto"], ["container", "overflowY", "hidden", "overflow-y", "hidden"],
  ["text", "outlineStyle", "dashed", "outline-style", "dashed"], ["text", "outlineWidth", "2px", "outline-width", "2px", { outlineStyle: "solid" }], ["text", "outlineColor", "#336699", "outline-color", "rgb(51, 102, 153)", { outlineStyle: "solid" }], ["text", "outlineOffset", "4px", "outline-offset", "4px"],
  ["container", "gridAutoRows", "120px", "grid-auto-rows", "120px", { display: "grid" }], ["container", "gridAutoColumns", "1fr", "grid-auto-columns", /1fr|\d+px/, { display: "grid" }],
  ["container", "borderTopWidth", "4px", "border-top-width", "4px", { borderStyle: "solid" }], ["container", "borderRightWidth", "5px", "border-right-width", "5px", { borderStyle: "solid" }],
  ["container", "borderBottomWidth", "6px", "border-bottom-width", "6px", { borderStyle: "solid" }], ["container", "borderLeftWidth", "7px", "border-left-width", "7px", { borderStyle: "solid" }],
  ["container", "borderColor", "#ff0000", "border-top-color", "rgb(255, 0, 0)", { borderStyle: "solid", borderWidth: "2px" }],
  ["container", "borderTopLeftRadius", "11px", "border-top-left-radius", "11px"], ["container", "borderTopRightRadius", "12px", "border-top-right-radius", "12px"],
  ["container", "borderBottomRightRadius", "13px", "border-bottom-right-radius", "13px"], ["container", "borderBottomLeftRadius", "14px", "border-bottom-left-radius", "14px"],
  ["container", "boxShadow", "lg", "box-shadow", (v) => v !== "none"], ["container", "backdropBlur", 8, "backdrop-filter", "blur(8px)"],
  ["container", "transformOrigin", "top left", "transform-origin", "0px 0px"], ["container", "transitionDuration", 300, "transition", /0\.3s/], ["container", "transitionEasing", "linear", "transition-timing-function", /linear/],
  ["container", "top", "12px", "top", "12px", { position: "relative" }], ["container", "right", "13px", "right", "13px", { position: "relative" }],
  ["container", "bottom", "14px", "bottom", "14px", { position: "relative" }], ["container", "left", "15px", "left", "15px", { position: "relative" }],
  ["container", "aspectRatio", "16/9", "aspect-ratio", "16 / 9"],
  ["container", "backgroundSize", "contain", "background-size", "contain"], ["container", "backgroundPosition", "top", "background-position", "50% 0%"],
  ["container", "backgroundRepeat", "repeat-x", "background-repeat", "repeat-x"], ["container", "backgroundAttachment", "fixed", "background-attachment", "fixed"],
  ["image", "objectFit", "contain", "object-fit", "contain"], ["image", "objectPosition", "top", "object-position", "50% 0%"],
  // Grille : propriétés du PARENT
  ["container", "columns", 3, "grid-template-columns", (v) => v.split(" ").length === 3, { display: "grid" }], ["container", "gridTemplate", "2fr 1fr", "grid-template-columns", (v) => v.split(" ").length === 2, { display: "grid" }],
  ["container", "gridRows", 2, "grid-template-rows", (v) => v.split(" ").length === 2, { display: "grid", columns: 1 }], ["container", "gridRowsTemplate", "50px 80px", "grid-template-rows", "50px 80px", { display: "grid", columns: 1 }],
  ["container", "gridAutoFlow", "column", "grid-auto-flow", "column", { display: "grid" }], ["container", "justifyItems", "center", "justify-items", "center", { display: "grid" }],
  // Grille : propriétés de l'ENFANT (le premier enfant d'un parent en grille)
  ["child", "justifySelf", "end", "justify-self", "end"], ["child", "gridColumnSpan", 2, "grid-column-start", "span 2"], ["child", "gridRowSpan", 2, "grid-row-start", "span 2"],
  ["child", "gridColumnStart", 2, "grid-column-start", "2"], ["child", "gridColumnEnd", 3, "grid-column-end", "3"], ["child", "gridRowStart", 2, "grid-row-start", "2"], ["child", "gridRowEnd", 3, "grid-row-end", "3"],
];
const COMPOSED = [
  ["gradient", { from: "#ff0000", to: "#0000ff", angle: 90 }, "background-image", /linear-gradient\(90deg/], ["overlay", { color: "#000000", opacity: 0.4 }, "background-image", /linear-gradient/],
  ["backgroundImage", { src: "https://127.0.0.1:1/fond.jpg" }, "background-image", /url\(/], ["shadow", { x: 2, y: 3, blur: 4, spread: 1, color: "#000000", inset: false }, "box-shadow", (v) => v !== "none"],
  ["filter", { blur: 2, brightness: 120 }, "filter", /blur\(2px\) brightness\(1\.2\)/], ["transform", { x: "10px", y: "5px", rotate: 15, scale: 1.1 }, "transform", (v) => v.startsWith("matrix")],
  ["mask", { shape: "circle" }, "clip-path", /circle\(/],
];
const ID = (s) => (s + "x").padEnd(12, "0");

describe("réglages restants effectifs (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, slug;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const leaf = (id, type) => (type === "text" ? { id, type: "text", props: { html: "<p>Texte</p>" } } : type === "image" ? { id, type: "image", props: { src: "https://127.0.0.1:1/p.jpg", alt: "x" } } : null);
    const sections = [];
    const kids = [];
    CASES.forEach((c, i) => {
      const [type, prop, value, , , extra] = c;
      const id = ID(`a${i.toString(36)}`);
      if (type === "child") {
        kids.push({ id: ID(`g${i.toString(36)}`), type: "container", props: { full: true }, styles: { desktop: { display: "grid", columns: 4 } }, children: [{ id, type: "container", styles: { desktop: { [prop]: value, ...(extra || {}) } }, children: [{ id: ID(`k${i.toString(36)}`), type: "text", props: { html: "<p>x</p>" } }] }, { id: ID(`h${i.toString(36)}`), type: "container", children: [{ id: ID(`j${i.toString(36)}`), type: "text", props: { html: "<p>y</p>" } }] }] });
        return;
      }
      const styles = { desktop: { [prop]: value, ...(extra || {}) } };
      kids.push(type === "container" ? { id, type, props: { full: true }, styles, children: [{ id: ID(`k${i.toString(36)}`), type: "text", props: { html: "<p>x</p><p>y</p>" } }, { id: ID(`j${i.toString(36)}`), type: "text", props: { html: "<p>z</p>" } }] } : { ...leaf(id, type), styles });
    });
    COMPOSED.forEach(([prop, value], i) => kids.push({ id: ID(`z${i.toString(36)}`), type: "container", props: { full: true }, styles: { desktop: { [prop]: value, width: "200px", minHeight: "40px" } }, children: [{ id: ID(`y${i.toString(36)}`), type: "text", props: { html: "<p>x</p>" } }] }));
    for (let i = 0; i < kids.length; i += 12) sections.push({ id: `sect${(i / 12).toString(36)}`.padEnd(11, "0"), type: "layout", children: kids.slice(i, i + 12) });
    const pageId = Number((await boss.post("/marketing/pages", { name: "Propriétés restantes" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 400));
    slug = srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const verdict = (got, expected) => (typeof expected === "function" ? expected(got) : expected instanceof RegExp ? expected.test(got) : got === expected);
  test("chaque propriété de style restante produit son CSS (typographie, bordures, ombres, position, fond, médias, grille et placement)", async () => {
    const p = await ctx.newPage(); await p.goto(`${srv.base}/p/${slug}`); await p.waitForTimeout(400);
    const raw = await p.evaluate((cases) => cases.map(([type, , , cssProp], i) => {
      const id = (type === "child" ? `a${i.toString(36)}x` : `a${i.toString(36)}x`).padEnd(12, "0");
      let e = document.querySelector(`.kw-n-${id}`); if (!e) return null;
      if (type === "image") e = e.matches("img") ? e : e.querySelector("img") || e;
      return getComputedStyle(e).getPropertyValue(cssProp);
    }), CASES.map((c) => [c[0], c[1], c[2], c[3]]));
    await p.close();
    const bad = [];
    CASES.forEach((c, i) => { if (raw[i] === null) bad.push(`${c[1]} : élément absent`); else if (!verdict(raw[i], c[4])) bad.push(`${c[1]}=${JSON.stringify(c[2])} → ${c[3]} : « ${raw[i]} »`); });
    assert.deepEqual(bad, [], bad.join(" | "));
  });
  test("chaque réglage composé (dégradé, voile, image de fond, ombre libre, filtres, transformation, masque) produit son CSS", async () => {
    const p = await ctx.newPage(); await p.goto(`${srv.base}/p/${slug}`); await p.waitForTimeout(400);
    const raw = await p.evaluate((cases) => cases.map(([, , cssProp], i) => { const e = document.querySelector(`.kw-n-${`zx`.replace("z", "z" + i.toString(36)).padEnd(12, "0")}`); return e ? getComputedStyle(e).getPropertyValue(cssProp) : null; }), COMPOSED.map((c) => [c[0], c[1], c[2]]));
    await p.close();
    const bad = [];
    COMPOSED.forEach((c, i) => { if (raw[i] === null) bad.push(`${c[0]} : élément absent`); else if (!verdict(raw[i], c[3])) bad.push(`${c[0]} → ${c[2]} : « ${raw[i]} »`); });
    assert.deepEqual(bad, [], bad.join(" | "));
  });
  test("image : « Hauteur » et « Proportions » de l'élément sont vraiment visibles sur l'image, « Cadrage » et « Point focal » aussi ; une image sans réglage garde sa taille naturelle", async () => {
    const fd = new FormData(); fd.append("file", new Blob([png(400, 100, [200, 30, 30])], { type: "image/png" }), "large.png");
    const up = await boss.request("/marketing/site-web/mediatheque/televerser", { method: "POST", multipart: fd });
    assert.equal(up.status, 201, up.text);
    const media = JSON.parse(up.text).media;
    const img = (k, st) => ({ id: ID(k), type: "image", props: { src: media.path, alt: "x" }, styles: { desktop: st, ...(k === "tab" ? { tablet: { height: "auto" } } : {}) } });
    const pageId = Number((await boss.post("/marketing/pages", { name: "Images réelles" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [{ id: "sect0000001", type: "layout", children: [
      img("natural", { width: "300px" }), img("fixed", { width: "300px", height: "300px", objectFit: "cover", objectPosition: "top" }), img("ratio", { width: "300px", aspectRatio: "1/1", objectFit: "contain" }),
    ] }] } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text);
    const slug2 = srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
    const p = await ctx.newPage(); await p.goto(`${srv.base}/p/${slug2}`); await p.waitForTimeout(900);
    const m = await p.evaluate(() => Object.fromEntries(["natural", "fixed", "ratio"].map((k) => { const f = document.querySelector(`.kw-n-${(k + "x").padEnd(12, "0")}`); const i = f.querySelector("img"); const a = f.getBoundingClientRect(), c = i.getBoundingClientRect(), cs = getComputedStyle(i); return [k, { figure: [Math.round(a.width), Math.round(a.height)], img: [Math.round(c.width), Math.round(c.height)], fit: cs.objectFit, pos: cs.objectPosition }]; })));
    await p.close();
    assert.deepEqual(m.natural.img, [300, 75], "sans hauteur ni proportions : taille naturelle conservée");
    assert.deepEqual(m.fixed.img, m.fixed.figure, "hauteur 300 px : l'image remplit sa boîte");
    assert.equal(m.fixed.fit, "cover"); assert.equal(m.fixed.pos, "50% 0%");
    assert.deepEqual(m.ratio.img, [300, 300], "proportions 1/1 : l'image remplit la boîte carrée");
    assert.equal(m.ratio.fit, "contain");
  });
  test("garde-fou : toute propriété de STYLE_PROPS et tout réglage composé est vérifié quelque part (ajouter un réglage = ajouter son test)", () => {
    const seen = new Set([...COVERED_BEFORE, ...CASES.map((c) => c[1]), ...COMPOSED.map((c) => c[0])]);
    const missing = Object.keys(nodes.STYLE_PROPS).filter((k) => !seen.has(k));
    assert.deepEqual(missing, [], `propriétés sans test d'effet réel : ${missing.join(", ")}`);
  });
});
