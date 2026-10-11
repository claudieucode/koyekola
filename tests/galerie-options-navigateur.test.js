// Galerie : colonnes, ratio d'aspect, disposition justifiée, légende au survol, barre de filtres (Chrome réel, vrai serveur) :
// enregistrement validé par le serveur, rendu de la page publiée, filtres qui fonctionnent, inspecteur qui écrit les bonnes valeurs.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

let chromium = null, sharp = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
try { sharp = require("sharp"); } catch { /* sharp absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME || !sharp ? "Playwright, Chrome ou sharp absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("galerie : options (navigateur)", { skip: SKIP }, () => {
  let srv, boss, anon, browser, page, errors, id, slug, imgs;
  const db = () => srv.db();
  const row = () => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const gallery = () => JSON.parse(row().draft).sections[0].children[0].children[0];
  const put = (props) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row().revision, content: { title: "Galerie", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ id: "gall00000001", type: "gallery", props }] }] }] } } });
  const base = (extra = {}) => ({ images: [{ src: imgs[0].path, alt: "A", tag: "Mer", caption: "Plage" }, { src: imgs[1].path, alt: "B", tag: "Montagne" }, { src: imgs[2].path, alt: "C", tag: "Mer" }], lightbox: true, ...extra });
  const publish = async () => { assert.equal((await boss.post(`/marketing/pages/${id}/publier.json`, {})).status, 200); return (await anon.get(`/p/${slug}`)).text; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); anon = new Client(srv.base);
    imgs = [];
    for (const [w, h] of [[900, 600], [800, 800], [1000, 500]]) {
      const buf = await sharp({ create: { width: w, height: h, channels: 3, background: { r: w % 255, g: 100, b: 150 } } }).jpeg().toBuffer();
      const fd = new FormData(); fd.append("file", new Blob([buf], { type: "image/jpeg" }), `g${w}.jpg`);
      const r = await boss.request("/marketing/site-web/mediatheque/televerser", { method: "POST", multipart: fd }); assert.equal(r.status, 201, r.text); imgs.push(JSON.parse(r.text).media);
    }
    const created = await boss.post("/marketing/pages", { name: "Galerie options", template: "", ouvrir: "editeur" });
    id = Number(created.location.match(/pages\/(\d+)/)[1]);
    slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("le serveur valide : valeurs par défaut non enregistrées, valeurs inconnues ignorées, filtres sans étiquette ignorés", async () => {
    let r = await put(base({ columns: 3, ratio: "1:1", rowHeight: "200" }));
    assert.equal(r.status, 200, r.text);
    let g = gallery().props;
    assert.equal(g.columns, undefined); assert.equal(g.ratio, undefined); assert.equal(g.rowHeight, undefined); assert.equal(g.layout, undefined);
    r = await put(base({ columns: 4, ratio: "16:9", overlay: true, filters: true }));
    g = gallery().props; assert.equal(g.columns, 4); assert.equal(g.ratio, "16:9"); assert.equal(g.overlay, true); assert.equal(g.filters, true);
    assert.deepEqual(g.images.map((i) => i.tag), ["Mer", "Montagne", "Mer"]);
    r = await put(base({ columns: 99, ratio: "7:5", layout: "spirale" }));
    g = gallery().props; assert.equal(g.columns, undefined); assert.equal(g.ratio, undefined); assert.equal(g.layout, undefined);
    r = await put({ ...base({ filters: true }), images: base().images.map((i) => ({ ...i, tag: undefined })) });
    assert.equal(gallery().props.filters, undefined, "filtres sans aucune étiquette : ignorés");
    r = await put(base({ layout: "justified", rowHeight: "260", masonry: true }));
    g = gallery().props; assert.equal(g.layout, undefined, "mosaïque et justifiée s'excluent : la mosaïque (réglage historique) l'emporte");
  });

  test("page publiée : classes de disposition, colonnes et ratio réellement appliqués", async () => {
    await put(base({ columns: 4, ratio: "16:9", overlay: true, filters: true }));
    const html = await publish();
    assert.match(html, /class="[^"]*kw-gallery[^"]*is-cols-4[^"]*is-ratio-16-9[^"]*has-overlay/);
    await page.goto(`${srv.base}/p/${slug}`);
    const m = await page.evaluate(() => { const g = document.querySelector(".kw-gallery"); const i = g.querySelector("img"); const r = i.getBoundingClientRect(); return { cols: getComputedStyle(g).gridTemplateColumns.split(" ").length, ratio: Math.round((r.width / r.height) * 100) / 100 }; });
    assert.equal(m.cols, 4); assert.equal(m.ratio, 1.78);
  });

  test("filtres : « Tous » + une touche par étiquette ; filtrer masque les autres images ; la visionneuse saute les images masquées", async () => {
    await page.goto(`${srv.base}/p/${slug}`);
    const labels = await page.locator(".kw-gal-filter").allInnerTexts();
    assert.deepEqual(labels, ["Tous", "Mer", "Montagne"]);
    await page.locator('.kw-gal-filter[data-tag="Mer"]').click();
    const hidden = () => page.evaluate(() => [...document.querySelectorAll(".kw-gallery-item")].map((f) => f.hidden));
    assert.deepEqual(await hidden(), [false, true, false]);
    assert.equal(await page.locator('.kw-gal-filter[data-tag="Mer"]').getAttribute("aria-pressed"), "true");
    await page.locator(".kw-gallery-item:not([hidden]) .kw-lb-open").first().click();
    await page.locator("dialog.kw-lightbox[open]").waitFor();
    await page.locator(".kw-lightbox-nav.is-next").click();
    const shown = await page.evaluate(() => document.querySelector("dialog.kw-lightbox img").getAttribute("src"));
    assert.equal(shown, imgs[2].path, "suivante : la 3e image (la 2e est masquée par le filtre)");
    await page.keyboard.press("Escape");
    await page.locator('.kw-gal-filter[data-tag=""]').click();
    assert.deepEqual(await hidden(), [false, false, false]);
  });

  test("disposition justifiée : lignes de même hauteur, ordre et largeur remplie", async () => {
    await put(base({ layout: "justified", rowHeight: "160", lightbox: false, filters: false }));
    await publish();
    await page.goto(`${srv.base}/p/${slug}`);
    const m = await page.evaluate(() => [...document.querySelectorAll(".kw-gallery-item")].map((f) => Math.round(f.getBoundingClientRect().height)));
    assert.deepEqual(m, [160, 160, 160]);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".kw-gallery")).display), "flex");
  });

  test("inspecteur : disposition, colonnes, ratio, légende au survol, filtres et étiquettes écrivent les bonnes valeurs", async () => {
    await put(base());
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await wait(500);
    await page.locator('[data-pb-layers] .pb-node[data-id="gall00000001"] > .pb-row-item').click();
    const field = (label) => page.locator(`[data-pb-inspector] .pb-field:has(label:text-is("${label}"))`).first();
    await field("Disposition").locator("select").selectOption("justified");
    await until(() => gallery().props.layout === "justified", { what: "disposition justifiée" });
    assert.equal(await page.locator('[data-pb-inspector] label:text-is("Ratio d\'aspect des images")').count(), 0, "ratio masqué en justifiée");
    await field("Hauteur des lignes").locator("select").selectOption("260");
    await until(() => gallery().props.rowHeight === "260", { what: "hauteur des lignes" });
    await field("Disposition").locator("select").selectOption("grid");
    await until(() => gallery().props.layout === undefined && gallery().props.rowHeight === undefined, { what: "retour en grille" });
    await field("Ratio d'aspect des images").locator("select").selectOption("4:3");
    await until(() => gallery().props.ratio === "4:3", { what: "ratio" });
    await page.locator('[data-pb-inspector] label:has-text("Légende au survol") input, [data-pb-inspector] input[aria-label*="Légende au survol"]').first().check();
    await until(() => gallery().props.overlay === true, { what: "légende au survol" });
    assert.deepEqual(errors, []);
  });
});
