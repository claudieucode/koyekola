// Écran supplémentaire « Grand écran » (≥ 1920 px par défaut, réglable) : styles propres, héritage de l'ordinateur (jamais de la tablette),
// masquage par écran, aperçu dans l'éditeur, réglage du seuil (Chrome réel, vrai serveur).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("grand écran (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, id, slug;
  const db = () => srv.db();
  const row = () => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const put = (children) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row().revision, content: { title: "Grand écran", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] }] } } });
  const publish = async () => assert.equal((await boss.post(`/marketing/pages/${id}/publier.json`, {})).status, 200);
  const colorAt = async (w, sel) => { await page.setViewportSize({ width: w, height: 900 }); await wait(150); return page.evaluate((s) => getComputedStyle(document.querySelector(s)).color, sel); };
  const shownAt = async (w, sel) => { await page.setViewportSize({ width: w, height: 900 }); await wait(150); return page.evaluate((s) => getComputedStyle(document.querySelector(s)).display !== "none", sel); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const created = await boss.post("/marketing/pages", { name: "Grand écran", template: "", ouvrir: "editeur" });
    id = Number(created.location.match(/pages\/(\d+)/)[1]);
    slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("styles propres au grand écran : appliqués à 1920 px et plus, jamais en dessous ; l'ordinateur, la tablette et le mobile gardent les leurs", async () => {
    const r = await put([{ type: "text", id: "text00000001", props: { html: "<p>Titre</p>" }, styles: { desktop: { color: "#111111" }, wide: { color: "#aa0000" }, tablet: { color: "#00aa00" }, mobile: { color: "#0000aa" } } }]);
    assert.equal(r.status, 200, r.text);
    assert.deepEqual(Object.keys(JSON.parse(row().draft).sections[0].children[0].children[0].styles).sort(), ["desktop", "mobile", "tablet", "wide"]);
    await publish(); await page.goto(`${srv.base}/p/${slug}`);
    assert.equal(await colorAt(2200, ".kw-text"), "rgb(170, 0, 0)", "grand écran");
    assert.equal(await colorAt(1920, ".kw-text"), "rgb(170, 0, 0)", "limite incluse");
    assert.equal(await colorAt(1919, ".kw-text"), "rgb(17, 17, 17)", "juste en dessous : ordinateur");
    assert.equal(await colorAt(1300, ".kw-text"), "rgb(17, 17, 17)");
    assert.equal(await colorAt(900, ".kw-text"), "rgb(0, 170, 0)", "tablette");
    assert.equal(await colorAt(500, ".kw-text"), "rgb(0, 0, 170)", "mobile");
  });

  test("sans réglage propre, le grand écran garde le style de l'ordinateur (et pas celui de la tablette)", async () => {
    await put([{ type: "text", props: { html: "<p>x</p>" }, styles: { desktop: { color: "#111111" }, tablet: { color: "#00aa00" } } }]);
    await publish(); await page.goto(`${srv.base}/p/${slug}`);
    assert.equal(await colorAt(2400, ".kw-text"), "rgb(17, 17, 17)");
  });

  test("« Masquer sur grand écran » : masqué à 1920 px et plus seulement ; « ordinateur » masque aussi le grand écran (compatibilité) ; jamais masqué partout", async () => {
    await put([{ type: "text", props: { html: "<p>x</p>" }, hideOn: ["wide"] }]);
    await publish(); await page.goto(`${srv.base}/p/${slug}`);
    assert.equal(await shownAt(2000, ".kw-text"), false); assert.equal(await shownAt(1500, ".kw-text"), true); assert.equal(await shownAt(600, ".kw-text"), true);
    await put([{ type: "text", props: { html: "<p>x</p>" }, hideOn: ["desktop"] }]);
    await publish(); await page.goto(`${srv.base}/p/${slug}`);
    assert.equal(await shownAt(1500, ".kw-text"), false); assert.equal(await shownAt(2200, ".kw-text"), false, "comme avant l'existence du grand écran : « ordinateur » couvre tous les grands écrans");
    assert.equal((await put([{ type: "text", props: { html: "<p>x</p>" }, hideOn: ["desktop", "tablet", "mobile"] }])).status, 422, "jamais masqué partout");
    assert.equal((await put([{ type: "text", props: { html: "<p>x</p>" }, hideOn: ["wide", "tablet", "mobile"] }])).status, 200, "visible sur ordinateur : accepté");
  });

  test("seuil réglable : 1600 px enregistré dans les réglages du site, appliqué à la page publiée de ce site ; hors bornes refusé", async () => {
    const siteId = Number((await boss.post("/marketing/site-web/sites", { name: "Seuil" })).location.match(/(\d+)\D*$/)[1]);
    const pageId = Number((await boss.post("/marketing/pages", { name: "Seuil page", site_id: String(siteId) })).location.match(/pages\/(\d+)/)[1]);
    const url = `/marketing/site-web/sites/${siteId}/reglages.json`;
    const save = async (wide) => { const cur = JSON.parse((await boss.get(url)).text); cur.settings.layout = { ...cur.settings.layout, breakpoints: { tablet: 1023, mobile: 767, wide } }; return boss.request(url, { method: "PUT", json: { tokens: cur.tokens, settings: cur.settings, revision: cur.revision } }); };
    assert.equal((await save(900)).status, 422, "seuil trop bas refusé");
    const ok = await save(1600); assert.equal(ok.status, 200, ok.text);
    assert.equal(JSON.parse((await boss.get(url)).text).settings.layout.breakpoints.wide, 1600, "relu");
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "S", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ type: "text", props: { html: "<p>x</p>" }, styles: { desktop: { color: "#111111" }, wide: { color: "#aa0000" } } }] }] }] } }, headers: { Origin: srv.base } })).status, 200);
    assert.equal((await boss.post(`/marketing/pages/${pageId}/publier.json`, {})).status, 200);
    const sl = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    await page.goto(`${srv.base}/p/${sl}`);
    assert.equal(await colorAt(1700, ".kw-text"), "rgb(170, 0, 0)", "dès 1600 px");
    assert.equal(await colorAt(1500, ".kw-text"), "rgb(17, 17, 17)");
  });

  test("normalisation du seuil (unitaire) : défaut 1920, bornes 1400–3000, tolérance aux anciens réglages", () => {
    const s = require("../src/marketing/pages/siteSettings");
    assert.equal(s.normalizeSettings({}).layout.breakpoints.wide, 1920);
    assert.equal(s.normalizeSettings({ layout: { breakpoints: { wide: 2200 } } }).layout.breakpoints.wide, 2200);
    assert.equal(s.normalizeSettings({ layout: { breakpoints: { tablet: 1023, mobile: 767 } } }).layout.breakpoints.wide, 1920, "anciens réglages sans seuil");
    assert.throws(() => s.normalizeSettings({ layout: { breakpoints: { wide: 900 } } }, { strict: true }));
  });

  test("éditeur : bouton « Grand écran », cadre à 1920 px, styles du grand écran visibles seulement là ; l'ordinateur reste sous le seuil", async () => {
    await put([{ type: "text", id: "text00000001", props: { html: "<p>Titre</p>" }, styles: { desktop: { color: "#111111" }, wide: { color: "#aa0000" } } }]);
    await context.pages()[0].setViewportSize({ width: 2300, height: 1000 });
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await wait(600);
    const colorIn = () => page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); const e = f.contentDocument.querySelector('[data-node-id="text00000001"]'); return { color: getComputedStyle(e).color, w: f.contentDocument.documentElement.clientWidth }; });
    let c = await colorIn();
    assert.equal(c.color, "rgb(17, 17, 17)"); assert.ok(c.w <= 1919, `cadre ordinateur sous le seuil : ${c.w}`);
    await page.locator('.pb-devices button[data-device="wide"]').click();
    await until(async () => (await colorIn()).color === "rgb(170, 0, 0)", { what: "style grand écran dans le canevas" });
    c = await colorIn(); assert.equal(c.w, 1920);
    // l'inspecteur : le réglage propre au grand écran est signalé ; l'ordinateur reste inchangé
    await page.locator('.pb-devices button[data-device="desktop"]').click();
    await until(async () => (await colorIn()).color === "rgb(17, 17, 17)", { what: "retour ordinateur" });
    await page.locator('.pb-devices button[data-device="tablet"]').click();
    await until(async () => (await colorIn()).w === 820, { what: "tablette" });
    assert.equal((await colorIn()).color, "rgb(17, 17, 17)", "la tablette n'hérite pas du grand écran");
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
