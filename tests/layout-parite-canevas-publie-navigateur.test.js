// Parité de mise en page canevas ↔ page publiée dans un VRAI navigateur : pour une page riche (flex qui retourne à la ligne, grille avec
// placements, position absolue, débordements, conteneurs imbriqués, contenus longs, image, valeurs propres à la tablette et au mobile),
// le style calculé de CHAQUE propriété de STYLE_PROPS et la taille réelle de CHAQUE élément sont comparés entre l'iframe de l'éditeur et la
// page publiée ouverte à la même largeur. Seules les différences propres à l'édition sont admises, et listées ici :
//   * curseur, décalage/épaisseur/style/couleur du contour, transitions : surcouche de sélection de l'éditeur ;
//   * conteneur vide : zone d'édition (hauteur minimale, fond, contour pointillé) ;
//   * élément masqué : visible en transparence dans l'éditeur, donc il OCCUPE sa place dans la mise en page de l'éditeur (mesuré : +35 px de hauteur
//     pour une colonne) alors qu'il est absent de la page publiée ; la page d'essai n'en contient donc pas (écart documenté, voir les limites).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { STYLE_PROPS } = require("../src/marketing/pages/nodes");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parité canevas / publié non exécutée sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const EDITOR_ONLY = /^(cursor|outline-.*|transition.*|transform-origin|perspective-origin)$/;
const T = (id, text, styles) => ({ id, type: "text", props: { html: `<p>${text}</p>` }, ...(styles ? { styles } : {}) });
const LONG = "Un contenu très long ".repeat(30);
const content = (withHidden) => ({ title: "Parité", sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "flx000000001", type: "container", props: {}, styles: { desktop: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "12px", rowGap: "20px", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", paddingLeft: "16px", maxWidth: "900px", marginLeft: "auto", marginRight: "auto" }, tablet: { flexDirection: "column", gap: "8px" }, mobile: { alignItems: "stretch" } }, children: [
    T("a0000000001", "Court", { desktop: { flexGrow: 1, flexBasis: "120px", order: 2 } }),
    T("a0000000002", LONG, { desktop: { flexShrink: 0, width: "40%", minWidth: "100px", order: 1, alignSelf: "flex-end" } }),
    { id: "img000000001", type: "image", props: { src: "https://example.com/a.jpg", alt: "a" }, styles: { desktop: { width: "200px", height: "80px", objectFit: "cover", marginTop: "-5px" } } },
    ...(withHidden ? [{ ...T("a0000000003", "Masqué"), hidden: true }] : []),
  ] },
  { id: "grd000000001", type: "container", props: {}, styles: { desktop: { display: "grid", columns: 3, gridRows: 2, gap: "10px", justifyItems: "center", minHeight: "200px", overflow: "hidden" }, mobile: { columns: 1 } }, children: [
    T("g0000000001", "G1", { desktop: { gridColumnSpan: 2 } }), T("g0000000002", "G2"),
    T("g0000000003", LONG, { desktop: { gridColumnStart: 2, gridRowStart: 2, justifySelf: "end" } }),
  ] },
  { id: "pos000000001", type: "container", props: {}, styles: { desktop: { position: "relative", height: "150px", width: "50%", overflowY: "auto", zIndex: 2, borderStyle: "solid", borderWidth: "3px" } }, children: [
    T("p0000000001", "Absolu", { desktop: { position: "absolute", top: "10px", right: "5%", zIndex: 5, width: "30%" } }),
    { id: "nst000000001", type: "container", props: {}, styles: { desktop: { display: "flex", flexDirection: "column", gap: "4px", paddingTop: "8px" } }, children: [
      T("n0000000001", "Imbriqué 1"), T("n0000000002", LONG, { desktop: { maxHeight: "60px", overflow: "hidden" } }) ] },
  ] },
  { id: "emp000000001", type: "container", props: {}, styles: { desktop: { display: "flex" } }, children: [] },
] }] });

describe("parité de mise en page canevas / page publiée (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, ed, id, slug;
  const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const CSS = [...new Set(Object.values(STYLE_PROPS).map((p) => p.css))];
  const measure = (css) => {
    const out = {};
    const read = (el, key, win) => { const cs = win.getComputedStyle(el), r = el.getBoundingClientRect(); const v = { _w: Math.round(r.width * 10) / 10, _h: Math.round(r.height * 10) / 10 }; for (const p of css) v[p] = cs.getPropertyValue(p); out[key] = v; };
    const f = document.querySelector("[data-pb-frame]");
    if (f) { for (const el of f.contentDocument.querySelectorAll("[data-node-id]")) read(el, el.getAttribute("data-node-id"), f.contentWindow); return out; }
    for (const el of document.querySelectorAll("[class*='kw-n-']")) { const c = [...el.classList].find((x) => /^kw-n-[a-z0-9]+$/.test(x)); if (c) read(el, c.slice(5), window); }
    return out;
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Parité", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: row().revision, content: content(false) } });
    assert.equal(r.status, 200, r.text);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    slug = row().slug;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    ed = await ctx.newPage();
    await ed.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await ed.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
    await wait(1500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  for (const device of ["desktop", "tablet", "mobile"]) {
    test(`${device} : chaque propriété calculée et chaque dimension réelle sont identiques dans le canevas et sur la page publiée à la même largeur`, async () => {
      await ed.locator(`[role="radio"][data-device="${device}"]`).first().click();
      await wait(1200);
      const width = await ed.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.documentElement.clientWidth);
      const canvas = await ed.evaluate(measure, CSS);
      const pub = await ctx.newPage();
      try {
        await pub.setViewportSize({ width, height: 1000 });
        await pub.goto(`${srv.base}/p/${slug}`); await wait(700);
        const published = await pub.evaluate(measure, CSS);
        const diffs = [];
        for (const key of Object.keys(canvas)) {
          if (!published[key]) { diffs.push(`${key} : absent de la page publiée`); continue; }
          const empty = key === "emp000000001"; // zone d'édition d'un conteneur vide
          for (const [prop, val] of Object.entries(canvas[key])) {
            if (EDITOR_ONLY.test(prop)) continue;
            if (empty && /^(_h|height|min-height|background-color|border-.*)$/.test(prop)) continue;
            if (String(val) !== String(published[key][prop])) diffs.push(`${key} ${prop} : canevas « ${val} » ≠ publié « ${published[key][prop]} »`);
          }
        }
        assert.deepEqual(diffs, [], `${device} (${width} px)`);
        assert.ok(Object.keys(published).length >= 13, "tous les éléments publiés ont été mesurés");
      } finally { await pub.close(); }
    });
  }
});
