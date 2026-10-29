// En-tête du site dans un VRAI navigateur (Chrome piloté par Playwright) contre un vrai serveur : on crée l'en-tête depuis la
// fiche du site, on le modifie dans l'éditeur, on le retire d'une page (exception), on crée une variante, puis on contrôle
// l'effet sur les pages PUBLIÉES et la tenue de la fiche sur petit écran.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 15000, every = 150, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  let last = null;
  for (;;) {
    let v = null;
    try { v = await check(); } catch (error) { last = error; }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${what}${last ? ` (${String(last.message).split("\n")[0]})` : ""}`);
    await wait(every);
  }
}

describe("en-tête du site : fiche du site et éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, siteId, accueil, tunnel, headerId;
  const db = () => srv.db();
  const sitePage = () => `${srv.base}/marketing/site-web/sites/${siteId}/reglages/en-tete`;
  const slugOf = (id) => db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const publicHtml = async (id) => { const c = await browser.newContext({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" }); const p = await c.newPage(); await p.goto(`${srv.base}/p/${slugOf(id)}`); const h = await p.content(); await c.close(); return h; };
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
  const flash = () => page.locator(".mk-flash").first();

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    siteId = Number((await boss.post("/marketing/site-web/sites", { name: "Site navigateur" })).location.match(/(\d+)(#.*)?$/)[1]);
    for (const name of ["Accueil", "Tunnel"]) {
      const id = Number((await boss.post("/marketing/pages", { name, site_id: String(siteId) })).location.match(/(\d+)$/)[1]);
      await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } });
      if (name === "Accueil") accueil = id; else tunnel = id;
    }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("B1 fiche du site sans en-tête : état vide, puis « Créer un en-tête » donne un en-tête global sur toutes les pages", async () => {
    await page.goto(sitePage());
    assert.match(await page.locator("#entete").innerText(), /Ce site n'a pas encore d'en-tête/);
    await page.getByRole("button", { name: "Créer un en-tête" }).click();
    await flash().waitFor();
    assert.match(await flash().innerText(), /En-tête « En-tête principal » créé/);
    headerId = db().prepare("SELECT header_component_id h FROM mk_sites WHERE id = ?").get(siteId).h;
    assert.equal((await page.locator("[data-header-status]").innerText()).trim(), "Publié");
    assert.equal((await page.locator("[data-header-type]").innerText()).trim(), "Global");
    assert.match(await page.locator("[data-header-count]").innerText(), /2 pages sur 2/);
    for (const id of [accueil, tunnel]) assert.match(await publicHtml(id), /lp-site-part lp-site-header/);
  });

  test("B2 « Modifier l'en-tête » ouvre l'éditeur sur la source : rien à publier tant qu'il n'y a pas de brouillon, retour à la fiche, canevas = en-tête seul", async () => {
    await page.locator("[data-header-edit]").click();
    await page.waitForURL(new RegExp(`/composants/${headerId}/editeur`));
    await ready();
    assert.match(await page.locator("[data-pb-status]").innerText(), /En-tête : publié, à jour/);
    assert.equal(await page.locator("[data-pb-publish]").isVisible(), false, "rien à publier : aucun brouillon");
    assert.equal(await page.locator("#pb-tab-page").isVisible(), false, "pas d'onglet « Page » (SEO, adresse…)");
    assert.match(await page.locator(".pb-back").getAttribute("href"), new RegExp(`/sites/${siteId}/reglages/en-tete#entete`));
    const inFrame = await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; return { header: d.querySelectorAll(".lp-site-header").length, logo: d.querySelectorAll(".kw-sitelogo, .kw-sitetitle").length }; });
    assert.equal(inFrame.header, 0, "pas d'en-tête du site en double autour de la source");
    assert.ok(inFrame.logo >= 1, "la source (logo, nom du site) est affichée et modifiable");
  });

  test("B3 modifier l'en-tête dans l'éditeur : enregistrement automatique en brouillon, pages publiées inchangées jusqu'à « Mettre à jour »", async () => {
    await page.frameLocator("[data-pb-frame]").locator(".kw-container").first().click({ position: { x: 4, y: 4 } });
    await page.locator(".pb-pal-item", { hasText: /^Titre$/ }).first().click();
    const section = () => JSON.parse(db().prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(headerId).draft || "null") || { type: "none" };
    const find = (n, type, out = []) => { if (n.type === type) out.push(n); (n.children || []).forEach((c) => find(c, type, out)); return out; };
    const heading = await until(() => find(section(), "heading")[0], { what: "titre enregistré dans la source de l'en-tête" });
    await until(async () => /Enregistré/.test(await page.locator("[data-pb-save]").innerText()), { what: "enregistrement" });
    for (const id of [accueil, tunnel]) assert.ok(!(await publicHtml(id)).includes(heading.props.text), "page publiée inchangée : le brouillon n'est pas diffusé");
    await page.locator("[data-pb-publish]").click();
    await until(async () => /publié, à jour/.test(await page.locator("[data-pb-status]").innerText()), { what: "mise à jour confirmée" });
    for (const id of [accueil, tunnel]) assert.ok((await publicHtml(id)).includes(heading.props.text), "page publiée mise à jour après « Mettre à jour »");
    // menu principal réduit
    await page.locator("[data-pb-mainmenu]").click();
    const labels = await page.locator(".pb-menu-item").allInnerTexts();
    assert.ok(labels.some((l) => /Retour à la fiche du site/.test(l)));
    assert.ok(!labels.some((l) => /Versions|Exporter|Importer|modèle/i.test(l)), "aucune entrée propre aux pages");
    await page.locator(".pb-menu-item", { hasText: "Retour à la fiche du site" }).click();
    await page.waitForURL(new RegExp(`/sites/${siteId}/reglages/en-tete#entete`));
  });

  test("B4 exception depuis la fiche : « Aucun en-tête » pour une page (liste déroulante + Appliquer), visible dans « Exceptions »", async () => {
    await page.goto(sitePage());
    const row = page.locator("[data-header-using] tr", { hasText: "Tunnel" });
    await row.locator("select").selectOption("none");
    await row.getByRole("button", { name: "Appliquer" }).click();
    await flash().waitFor();
    assert.match(await flash().innerText(), /n'affiche plus d'en-tête/);
    assert.match(await page.locator("[data-header-exceptions]").innerText(), /Tunnel[\s\S]*Aucun en-tête/);
    assert.match(await page.locator("[data-header-count]").innerText(), /1 page sur 2/);
    assert.doesNotMatch(await publicHtml(tunnel), /lp-site-part lp-site-header/);
    assert.match(await publicHtml(accueil), /lp-site-part lp-site-header/);
  });

  test("B5 « Créer une variante » : copie listée, modifiable dans l'éditeur (rôle « variante »), affectable à une page", async () => {
    await page.getByRole("button", { name: "Créer une variante" }).click();
    await flash().waitFor();
    assert.match(await flash().innerText(), /Variante « En-tête principal — variante 1 » créée/);
    const list = page.locator("[data-header-variants]");
    assert.match(await list.innerText(), /En-tête principal — variante 1 — 0 page/);
    const variantId = db().prepare("SELECT id FROM mk_web_components WHERE variant_of = ?").get(headerId).id;
    // affecter la variante à la page « Tunnel »
    const row = page.locator("[data-header-exceptions] tr", { hasText: "Tunnel" });
    await row.locator("select").selectOption(`variant:${variantId}`);
    await row.getByRole("button", { name: "Appliquer" }).click();
    await flash().waitFor();
    assert.match(await page.locator("[data-header-exceptions]").innerText(), /Variante : En-tête principal — variante 1/);
    assert.match(await publicHtml(tunnel), /lp-site-part lp-site-header/, "la variante s'affiche sur la page");
    // la variante s'ouvre dans l'éditeur
    await page.locator("[data-header-variants] a", { hasText: "Modifier" }).click();
    await page.waitForURL(new RegExp(`/composants/${variantId}/editeur`));
    await ready();
    assert.match(await page.locator(".pb-title h1").innerText(), /variante 1/);
  });

  test("B6 la fiche du site tient sur mobile (390 px) : aucun défilement horizontal, contrôles accessibles", async () => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(sitePage());
    const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    assert.ok(w.sw <= w.cw + 1, `défilement horizontal (${w.sw} > ${w.cw})`);
    await page.locator("#entete").scrollIntoViewIfNeeded();
    assert.equal(await page.getByRole("button", { name: "Créer une variante" }).isVisible(), true);
    await page.setViewportSize({ width: 1500, height: 900 });
  });

  test("B7 aucune erreur JavaScript ni de console pendant tout le parcours", async () => {
    assert.deepEqual(errors, [], `erreurs navigateur : ${errors.join(" | ")}`);
  });
});
