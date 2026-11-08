// ISOLATION DES FILTRES D'UN CONTENEUR : un filtre (flou, luminosité, contraste…) posé sur une section libre ou un conteneur n'agit QUE sur son fond propre
// (couleur, image, dégradé, voile), jamais sur ses contenus (titre, texte, bouton, image). Voir docs/page-builder/ISOLATION_CONTENEUR_FILTRES.md.
// Niveaux de preuve : CSS produit par le serveur (sans navigateur), puis vrai Chrome sur la page publiée (styles calculés + pixels), puis vrai éditeur piloté par clics.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("node:zlib");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const cdp = require("./helpers-chrome-cdp");
const nodes = require("../src/marketing/pages/nodes");
const { SAMPLES, ID, kid, bg } = require("./fixtures/isolation-conteneur-echantillons");
const AVANT = require("./fixtures/isolation-conteneur-avant.json");

const SKIP = cdp.SKIP;
const wait = cdp.wait;
const TYPES = ["container", "group", "stack", "grid", "columns", "column"];
const rulesOf = (css, id) => css.split("\n").filter((l) => l.includes(`kw-n-${id}`));
// Vrai si une règle SUR LE NOEUD LUI-MÊME (pas sur ::before) pose « filter: »
const beforeRules = (css, id) => [...css.matchAll(new RegExp(`[^{}]*\\.kw-n-${id}[^{}]*::before\\{([^}]*)\\}`, "g"))].map((m) => m[0]);
const nodeRulesBody = (css, id) => [...css.matchAll(new RegExp(`(?:^|[}\\n])\\s*(?:\\.lp-site-header[^{]* )?\\.kw-n-${id}(?::[a-z-]+)?\\{([^}]*)\\}`, "g"))].map((m) => m[1]).join(";");
const sectionOf = (children, styles, states) => [{ id: ID("sect1"), type: "layout", ...(styles ? { styles } : {}), ...(states ? { states } : {}), children }];

describe("isolation des filtres d'un conteneur (CSS serveur, sans navigateur)", () => {
  for (const type of TYPES) {
    test(`(a) ${type} avec flou : le fond et le filtre vont sur ::before, rien sur le conteneur`, () => {
      const id = ID("c1");
      const css = nodes.pageCss(sectionOf([kid("c1", type, {}, { styles: { desktop: { ...bg, filter: { blur: 7 }, borderRadius: "12px", opacity: 0.9, paddingTop: "20px" } } })]));
      const before = beforeRules(css, id).join("\n");
      assert.match(before, /filter:blur\(7px\)/);
      assert.match(before, /background-color:#102030/);
      assert.match(before, /background-image:linear-gradient\(rgba\(0,0,0,\.4\), rgba\(0,0,0,\.4\)\), url\(/);
      assert.match(before, /background-size:cover/);
      assert.match(before, /content:"";position:absolute;inset:-14px;z-index:-1;pointer-events:none;border-radius:inherit/);
      assert.match(before, /clip-path:inset\(14px round 12px\)/);
      const body = nodeRulesBody(css, id);
      assert.doesNotMatch(body, /(^|;)filter:/, "aucun filtre sur le conteneur");
      assert.doesNotMatch(body, /background/, "aucun fond sur le conteneur");
      assert.match(body, /border-radius:12px/);
      assert.match(body, /opacity:0.9/);
      assert.match(body, /padding-top:20px/);
      assert.match(css, new RegExp(`:where\\(\\.kw-n-${id}\\)\\{position:relative;isolation:isolate\\}`));
    });
  }
  test("(a) section libre (layout) avec flou : même répartition", () => {
    const css = nodes.pageCss(sectionOf([kid("t1", "heading", { text: "x", level: 2 })], { desktop: { ...bg, filter: { blur: 3 } } }));
    const id = ID("sect1");
    assert.match(beforeRules(css, id).join(""), /filter:blur\(3px\)/);
    assert.match(beforeRules(css, id).join(""), /inset:-6px/);
    assert.doesNotMatch(nodeRulesBody(css, id), /filter|background/);
  });
  test("(a) sans filtre (ou filtre neutre, ou « Flou arrière » seul, ou fond dans les lettres) : CSS strictement identique à celui d'avant la correction", () => {
    for (const [name, secs] of Object.entries(SAMPLES)) assert.equal(nodes.pageCss(secs), AVANT[name], `échantillon « ${name} » changé`);
    assert.doesNotMatch(Object.values(AVANT).join("\n"), /::before\{content/);
  });
  test("(b) chacun des 8 filtres reste sur le fond, jamais sur le conteneur", () => {
    const cases = { blur: ["blur(5px)", 5], brightness: ["brightness(130%)", 130], contrast: ["contrast(80%)", 80], grayscale: ["grayscale(60%)", 60], saturate: ["saturate(200%)", 200], sepia: ["sepia(40%)", 40], hueRotate: ["hue-rotate(90deg)", 90], invert: ["invert(100%)", 100] };
    for (const [k, [out, v]] of Object.entries(cases)) {
      const css = nodes.pageCss(sectionOf([kid("c1", "container", {}, { styles: { desktop: { backgroundColor: "#336699", filter: { [k]: v } } } })]));
      assert.ok(beforeRules(css, ID("c1")).join("").includes(`filter:${out}`), `${k} sur ::before`);
      assert.doesNotMatch(nodeRulesBody(css, ID("c1")), /filter/, `${k} ne doit pas rester sur le conteneur`);
      if (k !== "blur") assert.doesNotMatch(beforeRules(css, ID("c1")).join(""), /clip-path/, "sans flou, aucun recadrage");
    }
  });
  test("(c) écrans et états : filtre seulement sur mobile, fond ordinateur, survol (l'état « après défilement » a été retiré du moteur)", () => {
    const css = nodes.pageCss(sectionOf([kid("c1", "container", {}, {
      styles: { desktop: { backgroundColor: "#111111", borderRadius: "8px" }, tablet: { backgroundColor: "#222222" }, mobile: { filter: { blur: 4 }, borderRadius: "0px" } },
      states: { hover: { backgroundColor: "#333333", filter: { blur: 1 } } },
    })]));
    const id = ID("c1");
    assert.match(css, new RegExp(`\\.kw-n-${id}::before\\{background-color:#111111;clip-path:inset\\(8px round 8px\\)\\}`), "le fond ordinateur est déjà sur ::before");
    assert.match(css, new RegExp(`@media \\(max-width: 1023px\\)\\{\\.kw-n-${id}::before\\{background-color:#222222\\}\\}`));
    assert.match(css, new RegExp(`@media \\(max-width: 767px\\)\\{[^]*\\.kw-n-${id}::before\\{filter:blur\\(4px\\);clip-path:inset\\(8px round 0px\\)\\}`));
    assert.match(css, new RegExp(`\\.kw-n-${id}:hover::before\\{background-color:#333333;filter:blur\\(1px\\)\\}`));
    assert.doesNotMatch(css, new RegExp(`\\.kw-n-${id}::before:hover`));
    assert.doesNotMatch(nodeRulesBody(css, id), /filter|background/);
  });
  test("(d) conteneurs imbriqués : le filtre du parent ne touche pas l'enfant ; celui de l'enfant ne touche pas le parent", () => {
    const child = kid("ch", "container", {}, { styles: { desktop: { backgroundColor: "#ff0000" } } });
    const parent = kid("pa", "container", {}, { styles: { desktop: { backgroundColor: "#00ff00", filter: { blur: 9 } } }, children: [child] });
    let css = nodes.pageCss(sectionOf([parent]));
    assert.equal(beforeRules(css, ID("ch")).length, 0, "l'enfant n'a pas de ::before");
    assert.match(rulesOf(css, ID("ch")).join("\n"), /\.kw-n-ch0000000000\{background-color:#ff0000\}/, "l'enfant garde son propre fond, sans filtre");
    const parent2 = kid("pa", "container", {}, { styles: { desktop: { backgroundColor: "#00ff00" } }, children: [kid("ch", "container", {}, { styles: { desktop: { backgroundColor: "#ff0000", filter: { blur: 9 } } } })] });
    css = nodes.pageCss(sectionOf([parent2]));
    assert.equal(beforeRules(css, ID("pa")).length, 0);
    assert.match(rulesOf(css, ID("pa")).join("\n"), /\.kw-n-pa0000000000\{background-color:#00ff00\}/);
    assert.match(beforeRules(css, ID("ch")).join(""), /filter:blur\(9px\)/);
  });
  test("(f) un élément qui n'est pas un conteneur (image, titre, bouton) garde son filtre sur lui-même", () => {
    const css = nodes.pageCss(sectionOf([kid("im", "image", { src: "https://example.com/a.jpg", alt: "x" }, { styles: { desktop: { filter: { blur: 7 }, backgroundColor: "#fff" } } }), kid("hd", "heading", { text: "T", level: 2 }, { styles: { desktop: { filter: { sepia: 50 } } } })]));
    assert.match(css, /\.kw-n-im0000000000\{background-color:#fff;filter:blur\(7px\)\}/);
    assert.match(css, /\.kw-n-hd0000000000\{filter:sepia\(50%\)\}/);
    assert.doesNotMatch(css, /::before/);
  });
  test("(g) bande pleine largeur : le remplissage reste dans les variables, le fond passe sur ::before", () => {
    const css = nodes.pageCss(sectionOf([kid("bd", "container", { band: true }, { styles: { desktop: { paddingLeft: "20px", paddingRight: "30px", backgroundColor: "#abcdef", filter: { blur: 2 } } } })]));
    assert.match(css, /\.kw-n-bd0000000000\{--kw-pl:20px;--kw-pr:30px\}/);
    assert.match(beforeRules(css, ID("bd")).join(""), /background-color:#abcdef;filter:blur\(2px\)/);
  });
  test("(g) fond « dans les lettres » : le fond ne peut pas quitter le texte, comportement d'origine conservé", () => {
    const css = nodes.pageCss(sectionOf([kid("tx", "container", {}, { styles: { desktop: { gradient: { from: "#f00", to: "#00f", angle: 90 }, backgroundClip: "text", filter: { blur: 3 } } } })]));
    assert.doesNotMatch(css, /::before/);
    assert.match(css, /\.kw-n-tx0000000000\{[^}]*filter:blur\(3px\)/);
  });
  test("copies de boucle à identifiants partagés : les règles ne sont écrites qu'une fois", () => {
    const c = () => kid("lp", "container", {}, { styles: { desktop: { backgroundColor: "#123456", filter: { blur: 3 } } } });
    const css = nodes.pageCss(sectionOf([c(), c()]));
    assert.equal((css.match(/::before\{content/g) || []).length, 1);
  });
  test("le CSS personnalisé de l'auteur reste écrit après et peut surcharger (échappatoire : un filtre « tout le conteneur » par CSS libre)", () => {
    const css = nodes.pageCss(sectionOf([kid("cu", "container", {}, { styles: { desktop: { backgroundColor: "#123456", filter: { blur: 3 } } }, css: "filter:blur(1px)" })]));
    assert.ok(css.lastIndexOf(".kw-node.kw-n-cu0000000000{filter:blur(1px)}") > css.lastIndexOf("::before{"));
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------
// Décodage PNG minimal (8 bits, sans entrelacement) pour comparer des pixels de captures d'écran
function png(buf) {
  let off = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (off < buf.length) { const len = buf.readUInt32BE(off), type = buf.toString("ascii", off + 4, off + 8); const data = buf.subarray(off + 8, off + 8 + len); if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; } else if (type === "IDAT") idat.push(data); off += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x], a = x >= bpp ? out[y * stride + x - bpp] : 0, b = y ? out[(y - 1) * stride + x] : 0, c = x >= bpp && y ? out[(y - 1) * stride + x - bpp] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      out[y * stride + x] = (v + (f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
    }
  }
  return { w, h, bpp, px: (x, y) => [out[y * stride + x * bpp], out[y * stride + x * bpp + 1], out[y * stride + x * bpp + 2]] };
}
const same = (a, b) => a.w === b.w && a.h === b.h && (() => { for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) { const p = a.px(x, y), q = b.px(x, y); if (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2]) return false; } return true; })();
const dist = (p, q) => Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]), Math.abs(p[2] - q[2]));

const HARD = { from: "#000000", to: "#cc3333", angle: 90, extra: [{ color: "#000000", at: 50 }, { color: "#cc3333", at: 50 }] }; // bord franc au milieu : le flou l'adoucit
const WHITE = { color: "#ffffff" };
const scene = (blur, extra = {}) => ({ sections: [{ id: ID("sect1"), type: "layout", children: [{
  id: ID("cont1"), type: "container", props: {}, children: [
    kid("hd1", "heading", { text: "Titre net", level: 2 }, { styles: { desktop: { color: "#ffffff" } } }), kid("tx1", "text", { html: "<p>Un paragraphe bien net</p>" }, { styles: { desktop: { color: "#ffffff" } } }),
    kid("bt1", "button", { label: "Bouton net", url: "https://kolakisa.com/" }), kid("im1", "image", { src: "https://example.com/a.jpg", alt: "Photo" }),
  ],
  styles: { desktop: { gradient: HARD, width: "800px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "40px", paddingRight: "40px", marginTop: "30px", ...(blur ? { filter: { blur } } : {}), ...extra } },
}] }] });

describe("isolation des filtres d'un conteneur (vrai Chrome, page publiée)", { skip: SKIP }, () => {
  let srv, boss, ch, cookies, counter = 0;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    ch = await cdp.launch();
    cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
  });
  after(async () => { if (ch) await ch.close(); if (srv) await srv.stop(); });
  async function publish(content) {
    const id = Number((await boss.post("/marketing/pages", { name: "IsoCont " + ++counter })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    return `${srv.base}/p/${srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`;
  }
  const MEASURE = `(() => {
    const el = (id) => document.querySelector(".kw-n-" + id.padEnd(12, "0"));
    const rect = (e) => { const b = e.getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: b.height }; };
    const c = el("cont1"), cs = getComputedStyle(c), bs = getComputedStyle(c, "::before");
    const out = { cont: rect(c), contFilter: cs.filter, contBg: cs.backgroundImage, contPos: cs.position, contIso: cs.isolation, before: { filter: bs.filter, pos: bs.position, z: bs.zIndex, pe: bs.pointerEvents, content: bs.content, bgImage: bs.backgroundImage, bgColor: bs.backgroundColor, clip: bs.clipPath }, kids: {} };
    for (const id of ["hd1", "tx1", "bt1", "im1"]) { const e = el(id); out.kids[id] = { filter: getComputedStyle(e).filter, rect: rect(e) }; }
    const b = rect(el("bt1")); const hit = document.elementFromPoint(b.x + b.w / 2 - scrollX, b.y + b.h / 2 - scrollY);
    out.hitButton = Boolean(hit && hit.closest(".kw-n-" + "bt1".padEnd(12, "0")));
    return out;
  })()`;
  async function look(content, { width = 1000, shot = false } = {}) {
    const page = await ch.newPage({ width, height: 1500, cookies });
    try {
      await page.goto(await publish(content));
      await wait(250);
      const m = await page.evaluate(MEASURE);
      if (shot) m.shot = png(await page.screenshot({ x: 0, y: 0, width, height: 1100 }));
      return m;
    } finally { await page.close(); }
  }

  test("(e) flou 7 sur un conteneur avec fond + titre, texte, bouton, image : contenus NETS (pixels identiques à « sans flou »), fond FLOU, bords pleins, bouton cliquable", async () => {
    const sharp = await look(scene(0), { shot: true });
    const blurred = await look(scene(7), { shot: true });
    // styles calculés : le filtre est sur ::before, nulle part ailleurs
    assert.equal(blurred.contFilter, "none");
    assert.equal(blurred.contBg, "none");
    assert.equal(blurred.before.filter, "blur(7px)");
    assert.equal(blurred.before.pos, "absolute");
    assert.equal(blurred.before.z, "-1");
    assert.equal(blurred.before.pe, "none");
    assert.match(blurred.before.bgImage, /linear-gradient/);
    for (const [k, v] of Object.entries(blurred.kids)) assert.equal(v.filter, "none", `${k} ne doit pas être flou`);
    assert.equal(blurred.contPos, "relative");
    assert.equal(blurred.contIso, "isolate");
    // mise en page strictement identique
    assert.deepEqual(blurred.cont, sharp.cont);
    for (const k of Object.keys(sharp.kids)) assert.deepEqual(blurred.kids[k].rect, sharp.kids[k].rect, `${k} : même place`);
    assert.equal(blurred.hitButton, true, "le bouton reste cliquable (au-dessus du fond)");
    // pixels : titre, texte et bouton (moitié gauche, loin du bord franc du fond) rigoureusement identiques avec et sans flou
    const c = blurred.cont, top = Math.floor(blurred.kids.hd1.rect.y) - 6, bottom = Math.ceil(blurred.kids.bt1.rect.y + blurred.kids.bt1.rect.h) + 6;
    const crop = (shot) => { const px = (x, y) => shot.px(x, y); return { w: 300, h: bottom - top, px: (x, y) => px(Math.floor(c.x) + 45 + x, top + y) }; };
    // (repère : la zone décalée de 45 px reste dans la moitié gauche du fond, à plus de 25 px du bord franc)
    assert.ok(same(crop(sharp.shot), crop(blurred.shot)), "le texte et le bouton sont rendus à l'identique avec flou 7 et sans flou");
    // fond : un bord franc devient un dégradé doux
    const row = (shot) => { const y = Math.floor(c.y + c.h / 2), mid = Math.floor(c.x + c.w / 2); const set = new Set(); for (let x = mid - 20; x <= mid + 20; x++) set.add(shot.px(x, y)[0]); return set.size; };
    assert.ok(row(sharp.shot) <= 2, "sans flou : seulement 2 teintes autour du bord");
    assert.ok(row(blurred.shot) >= 8, "avec flou : le bord franc est adouci (dégradé de teintes)");
    // bords sans bande transparente : les pixels à 1 px de chaque côté ont la même couleur que sans flou (fond plein, pas de fondu vers le blanc de la page)
    const edges = [[c.x + 1, c.y + c.h / 2], [c.x + c.w - 2, c.y + c.h / 2], [c.x + c.w / 4, c.y + 1], [c.x + (3 * c.w) / 4, c.y + c.h - 2], [c.x + c.w - 2, c.y + 1], [c.x + 1, c.y + c.h - 2]];
    for (const [x, y] of edges) assert.ok(dist(sharp.shot.px(Math.floor(x), Math.floor(y)), blurred.shot.px(Math.floor(x), Math.floor(y))) <= 12, `bord (${Math.floor(x)},${Math.floor(y)}) plein`);
    // et rien ne déborde du conteneur : un pixel juste à l'extérieur reste le blanc de la page
    for (const [x, y] of [[c.x - 3, c.y + c.h / 2], [c.x + c.w + 3, c.y + c.h / 2], [c.x + c.w / 2, c.y - 3], [c.x + c.w / 2, c.y + c.h + 3]]) assert.ok(dist(blurred.shot.px(Math.floor(x), Math.floor(y)), sharp.shot.px(Math.floor(x), Math.floor(y))) <= 2, "aucun débord du flou hors du conteneur");
  });

  test("(f) un filtre sur une IMAGE seule la floute toujours (non-régression)", async () => {
    const content = { sections: [{ id: ID("sect1"), type: "layout", children: [kid("hd1", "heading", { text: "T", level: 2 }), kid("im1", "image", { src: "https://example.com/a.jpg", alt: "x" }, { styles: { desktop: { filter: { blur: 8 } } } })] }] };
    const page = await ch.newPage({ width: 1000, height: 800, cookies });
    try {
      await page.goto(await publish(content));
      const r = await page.evaluate(() => [".kw-n-im1" + "0".repeat(9), ".kw-n-hd1" + "0".repeat(9)].map((s) => { const e = document.querySelector(s); return [getComputedStyle(e).filter, getComputedStyle(e, "::before").content]; }));
      assert.equal(r[0][0], "blur(8px)");
      assert.equal(r[1][0], "none");
    } finally { await page.close(); }
  });

  test("(c) mobile : le fond de l'écran étroit et le filtre restent sur ::before ; le contenu reste net", async () => {
    const content = { sections: [{ id: ID("sect1"), type: "layout", children: [kid("cont1", "container", {}, { styles: { desktop: { backgroundColor: "#112233", filter: { blur: 5 } }, mobile: { backgroundColor: "#445566", paddingTop: "13px" } }, children: [kid("hd1", "heading", { text: "T", level: 2 })] })] }] };
    const url = await publish(content);
    for (const [width, expectBg, expectPad] of [[1200, "rgb(17, 34, 51)", "0px"], [390, "rgb(68, 85, 102)", "13px"]]) {
      const page = await ch.newPage({ width, height: 800, cookies });
      try {
        await page.goto(url);
        const r = await page.evaluate(() => { const c = document.querySelector(".kw-n-cont1" + "0".repeat(7)), h = document.querySelector(".kw-n-hd1" + "0".repeat(9)); return { bg: getComputedStyle(c, "::before").backgroundColor, f: getComputedStyle(c, "::before").filter, cf: getComputedStyle(c).filter, cbg: getComputedStyle(c).backgroundColor, hf: getComputedStyle(h).filter, pad: getComputedStyle(c).paddingTop }; });
        assert.equal(r.bg, expectBg); assert.equal(r.f, "blur(5px)"); assert.equal(r.cf, "none"); assert.equal(r.cbg, "rgba(0, 0, 0, 0)"); assert.equal(r.hf, "none"); assert.equal(r.pad, expectPad);
      } finally { await page.close(); }
    }
  });

  test("(c) survol : au passage de la souris le fond change sur ::before, le texte reste net", async () => {
    const content = { sections: [{ id: ID("sect1"), type: "layout", children: [kid("cont1", "container", {}, { styles: { desktop: { backgroundColor: "#112233", filter: { blur: 2 }, paddingTop: "30px", paddingBottom: "30px" } }, states: { hover: { backgroundColor: "#aa0000", filter: { blur: 6 } } }, children: [kid("hd1", "heading", { text: "T", level: 2 })] })] }] };
    const page = await ch.newPage({ width: 1000, height: 800, cookies });
    try {
      await page.goto(await publish(content));
      const r = await page.evaluate(() => { const b = document.querySelector(".kw-n-cont1" + "0".repeat(7)).getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height - 6 }; });
      await page.mouseMove(r.x, r.y); await wait(400);
      const s = await page.evaluate(() => { const c = document.querySelector(".kw-n-cont1" + "0".repeat(7)), h = document.querySelector(".kw-n-hd1" + "0".repeat(9)); return { bg: getComputedStyle(c, "::before").backgroundColor, f: getComputedStyle(c, "::before").filter, hf: getComputedStyle(h).filter, cf: getComputedStyle(c).filter }; });
      assert.equal(s.bg, "rgb(170, 0, 0)"); assert.equal(s.f, "blur(6px)"); assert.equal(s.hf, "none"); assert.equal(s.cf, "none");
    } finally { await page.close(); }
  });

  test("(g) conteneur LIEN, bande pleine largeur, conteneur imbriqué, et fond dans les lettres, dans Chrome", async () => {
    const content = { sections: [{ id: ID("sect1"), type: "layout", children: [
      kid("lk1", "container", { link: "https://kolakisa.com/" }, { styles: { desktop: { backgroundColor: "#334455", filter: { sepia: 80 } } }, children: [kid("hd1", "heading", { text: "Lien", level: 2 })] }),
      kid("bd1", "container", { band: true }, { styles: { desktop: { backgroundColor: "#554433", paddingLeft: "50px", filter: { blur: 3 } } }, children: [kid("hd2", "heading", { text: "Bande", level: 2 })] }),
      kid("pa1", "container", {}, { styles: { desktop: { backgroundColor: "#00aa00", filter: { blur: 6 } } }, children: [kid("ch1", "container", {}, { styles: { desktop: { backgroundColor: "#aa0000" } }, children: [kid("hd3", "heading", { text: "Fils", level: 2 })] })] }),
      kid("tx1", "container", {}, { styles: { desktop: { gradient: { from: "#f00", to: "#00f", angle: 90 }, backgroundClip: "text", filter: { blur: 1 } } }, children: [kid("hd4", "heading", { text: "Lettres", level: 2 })] }),
    ] }] };
    const page = await ch.newPage({ width: 1000, height: 1200, cookies });
    try {
      await page.goto(await publish(content));
      const r = await page.evaluate(() => { const g = (id, p) => { const e = document.querySelector(".kw-n-" + id.padEnd(12, "0")); const c = getComputedStyle(e, p || null); return { tag: e.tagName, link: Boolean(e.closest("a[href]")), f: c.filter, bg: c.backgroundColor, pl: getComputedStyle(e).paddingLeft }; }; return { lk: g("lk1"), lkb: g("lk1", "::before"), lkh: g("hd1"), bd: g("bd1"), bdb: g("bd1", "::before"), pa: g("pa1"), pab: g("pa1", "::before"), ch: g("ch1"), chb: g("ch1", "::before"), chh: g("hd3"), tx: g("tx1"), txb: g("tx1", "::before") }; });
      assert.equal(r.lk.link, true, "le conteneur est bien dans un lien"); assert.equal(r.lk.f, "none"); assert.equal(r.lkb.f, "sepia(0.8)"); assert.equal(r.lkb.bg, "rgb(51, 68, 85)"); assert.equal(r.lkh.f, "none");
      assert.equal(r.bd.f, "none"); assert.equal(r.bdb.f, "blur(3px)"); assert.equal(r.bdb.bg, "rgb(85, 68, 51)"); assert.equal(r.bd.pl, "50px");
      assert.equal(r.pab.f, "blur(6px)"); assert.equal(r.pab.bg, "rgb(0, 170, 0)"); assert.equal(r.ch.f, "none"); assert.equal(r.ch.bg, "rgb(170, 0, 0)"); assert.equal(r.chb.f, "none"); assert.equal(r.chh.f, "none");
      assert.equal(r.tx.f, "blur(1px)", "fond dans les lettres : comportement d'origine, le filtre reste sur le conteneur");
    } finally { await page.close(); }
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------
describe("isolation des filtres d'un conteneur (vrai éditeur piloté dans Chrome)", { skip: SKIP }, () => {
  let srv, boss, ch, page, id;
  const C = ID("cont1"), HD = ID("hd1"), TX = ID("tx1"), BT = ID("bt1");
  const draftSections = () => JSON.parse((srv.db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft) || "{}").sections;
  const flat = (list, out = []) => { for (const x of list || []) { out.push(x); flat(x.children, out); } return out; };
  const open = async () => { await page.goto(`${srv.base}/marketing/pages/${id}/editeur`); await page.waitFor(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, "canevas", 60000); await wait(900); };
  const savedWhen = async (check, what) => { const end = Date.now() + 15000; for (;;) { let ok = false; try { ok = check(); } catch { /* pas encore */ } if (ok) return; if (Date.now() > end) throw new Error("Pas enregistré : " + what); await wait(150); } };
  const probe = () => page.evaluate(([c, ids]) => {
    const f = document.querySelector("[data-pb-frame]"), fr = f.getBoundingClientRect(), d = f.contentDocument, el = (n) => d.querySelector(`[data-node-id="${n}"]`);
    const e = el(c), cs = getComputedStyle(e), bs = d.defaultView.getComputedStyle(e, "::before");
    const rect = (n) => { const b = el(n).getBoundingClientRect(); return { x: Math.round(fr.x + b.x), y: Math.round(fr.y + b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
    const bt = el(ids[2]).getBoundingClientRect(), hit = d.elementFromPoint(bt.x + bt.width / 2, bt.y + bt.height / 2);
    return { contFilter: cs.filter, beforeFilter: bs.filter, beforeBg: bs.backgroundColor, beforeContent: bs.content, kids: ids.map((n) => d.defaultView.getComputedStyle(el(n)).filter), rects: ids.map(rect), hit: Boolean(hit && hit.closest(`[data-node-id="${ids[2]}"]`)) };
  }, [C, [HD, TX, BT]]);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    ch = await cdp.launch();
    id = Number((await boss.post("/marketing/pages", { name: "Iso conteneur éditeur" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { sections: [{ id: ID("sect1"), type: "layout", children: [{ id: C, type: "container", props: {}, styles: { desktop: { backgroundColor: "#cc3333", paddingTop: "50px", paddingBottom: "50px", paddingLeft: "50px", paddingRight: "50px" } }, children: [
      kid("hd1", "heading", { text: "Titre net", level: 2 }, { styles: { desktop: { color: "#ffffff" } } }), kid("tx1", "text", { html: "<p>Paragraphe net</p>" }, { styles: { desktop: { color: "#ffffff" } } }), kid("bt1", "button", { label: "Bouton", url: "https://kolakisa.com/" }),
    ] }] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    page = await ch.newPage({ width: 1700, height: 1000, cookies: [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })) });
    await open();
  });
  after(async () => { if (ch) await ch.close(); if (srv) await srv.stop(); });

  test("(e) éditeur réel : flou 7 réglé dans le panneau sur le CONTENEUR : le fond est flou, titre/texte/bouton restent nets et cliquables", async () => {
    const r = await page.evaluate((n) => { const f = document.querySelector("[data-pb-frame]"); const fr = f.getBoundingClientRect(); const e = f.contentDocument.querySelector(`[data-node-id="${n}"]`); e.scrollIntoView({ block: "start" }); const b = e.getBoundingClientRect(); return { x: fr.x + b.x + 10, y: fr.y + b.y + 10 }; }, C);
    await page.mouseClick(r.x, r.y); await wait(400);
    const sel = await page.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-row-item.is-selected")].map((e) => e.parentElement.dataset.id));
    assert.deepEqual(sel, [C], "le clic dans la marge du conteneur sélectionne le conteneur");
    await page.evaluate(() => { const b = [...document.querySelectorAll(".pb-right button")].find((x) => /^Style$/.test(x.textContent.trim())); if (b) b.click(); }); await wait(300);
    const before = await probe();
    assert.equal(before.contFilter, "none"); assert.equal(before.beforeContent, "none");
    const shotOf = async (rects) => { const h = rects[0], b = rects[2]; return png(await page.screenshot({ x: h.x, y: h.y - 4, width: 250, height: b.y + b.h - h.y + 8 })); };
    const shotBefore = await shotOf(before.rects);
    await page.evaluate(() => { const d = document.querySelector(`.pb-inspector details.pb-acc:has([data-prop="filter-blur"])`); if (d) d.open = true; const i = document.querySelector(`.pb-inspector [data-prop="filter-blur"] input`); i.scrollIntoView({ block: "center" }); i.focus(); i.value = "7"; i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); }); await wait(1500);
    const after = await probe();
    assert.equal(after.contFilter, "none", "le conteneur du canevas n'a pas de filtre");
    assert.equal(after.beforeFilter, "blur(7px)", "le fond (::before) est flou");
    assert.equal(after.beforeBg, "rgb(204, 51, 51)", "le fond de couleur est passé sur ::before");
    assert.deepEqual(after.kids, ["none", "none", "none"], "titre, texte et bouton ne sont pas floutés");
    assert.deepEqual(after.rects, before.rects, "même mise en page");
    assert.equal(after.hit, true, "le bouton reste cliquable");
    assert.ok(same(shotBefore, await shotOf(after.rects)), "pixels du titre, du texte et du bouton identiques avant/après le flou");
    await savedWhen(() => { const n = flat(draftSections()).find((x) => x.id === C); return n.styles.desktop.filter && n.styles.desktop.filter.blur === 7; }, "flou du conteneur");
    for (const k of [HD, TX, BT]) assert.ok(!JSON.stringify(flat(draftSections()).find((x) => x.id === k).styles || {}).includes("blur"), "aucun flou enregistré sur les contenus");
    await open(); // rechargement
    const reloaded = await probe();
    assert.equal(reloaded.beforeFilter, "blur(7px)"); assert.equal(reloaded.contFilter, "none"); assert.deepEqual(reloaded.kids, ["none", "none", "none"]);
  });
});
