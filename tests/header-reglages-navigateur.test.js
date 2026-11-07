// Header Builder, lot L0 — dans un VRAI Chrome : le panneau « En-tête » de l'éditeur lit l'état réel d'un en-tête (ancien format compris), écrit le bloc `header`,
// l'enregistre, et le site publié applique la position, l'effet et le seuil. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : réglages d'en-tête non exécutés sur cette machine" : false;
const sect = (id, text) => ({ id, type: "layout", children: [{ id: `${id}h`.slice(0, 20), type: "heading", props: { text, level: "2" } }] });

describe("Header Builder L0 : panneau « En-tête » (navigateur)", { skip: SKIP }, () => {
  let srv, boss, db, browser, site, pageId, errors = [];
  const origin = { Origin: "" };
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  const slug = () => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
  const adopt = async (key, publish = true) => {
    const used = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: origin });
    assert.equal(used.status, 200, used.text.slice(0, 200));
    const t = JSON.parse(used.text).template;
    if (publish) { const pub = await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { replace: true }, headers: origin }); assert.equal(pub.status, 200, pub.text.slice(0, 300)); }
    return t;
  };
  const open = async (viewport = { width: 1440, height: 900 }, authed = true) => {
    const context = await browser.newContext({ viewport });
    if (authed) await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage(); context.setDefaultTimeout(20000);
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return { context, page };
  };
  const openEditor = async (page, t) => { await page.goto(srv.base + t.editUrl); await page.waitForSelector("#pb-tab-page", { state: "attached" }); await page.waitForFunction(() => !!document.querySelector("[data-pb-status]") && document.querySelector("[data-pb-status]").textContent.length > 0); await page.click("#pb-tab-page"); await page.waitForSelector("[data-pb-header-summary]"); };
  const field = (page, label) => page.locator("[data-pb-page-settings]").getByLabel(label, { exact: true });
  const save = async (page) => { await page.click("[data-pb-save-now]"); await page.waitForFunction(() => /Enregistré|Tout est enregistré/.test(document.body.innerText)); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    origin.Origin = srv.base; boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site en-tête" })).location.match(/sites\/(\d+)/)[1]);
    pageId = Number((await boss.post("/marketing/pages", { name: "Accueil", site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: origin, json: { revision: rev, content: { title: "Accueil", sections: [sect("sect00000001", "CORPS")] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {}, headers: origin })).status, 200);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("un en-tête ancien (collant du catalogue) : le panneau affiche son état réel, sans rien écrire tant qu'on ne change rien", async () => {
    const t = await adopt("saas-verre-depoli.clair", false);
    const { context, page } = await open(); await openEditor(page, t);
    assert.match(await page.locator("[data-pb-header-summary]").innerText(), /Collé/);
    assert.equal(await field(page, "Position").inputValue(), "sticky");
    assert.notEqual(await field(page, "Effet au défilement").inputValue(), undefined);
    const comp = db.prepare("SELECT draft, section FROM mk_web_components WHERE id = ?").get(t.sourceId || t.source_id || t.documentId);
    if (comp) assert.ok(!/"header":/.test(comp.draft || comp.section || ""), "ouvrir le panneau n'écrit rien");
    await context.close();
  });

  test("régler la position, l'effet et le seuil : enregistré, retrouvé au rechargement, appliqué sur le site publié, seuil respecté au défilement", async () => {
    const t = await adopt("classique-logo-menu-bouton.clair");
    const { context, page } = await open(); await openEditor(page, t);
    assert.equal(await field(page, "Position").inputValue(), "static");
    assert.equal(await field(page, "Effet au défilement").count(), 0, "un en-tête ordinaire n'a pas d'effet : le réglage n'est pas proposé");
    await field(page, "Position").selectOption("sticky");
    await field(page, "Effet au défilement").selectOption("both");
    const thr = field(page, "Seuil de défilement (px)"); await thr.fill("40"); await thr.press("Enter");
    assert.match(await page.locator("[data-pb-header-summary]").innerText(), /Collé[\s\S]*40 px/);
    await save(page);
    await page.reload(); await page.waitForSelector("#pb-tab-page", { state: "attached" }); await page.waitForTimeout(800); await page.click("#pb-tab-page"); await page.waitForSelector("[data-pb-header-summary]");
    assert.equal(await field(page, "Position").inputValue(), "sticky"); assert.equal(await field(page, "Effet au défilement").inputValue(), "both"); assert.equal(await field(page, "Seuil de défilement (px)").inputValue(), "40");
    await page.click("[data-pb-publish]"); await page.waitForFunction(() => /publié, à jour|À jour/.test(document.querySelector("[data-pb-status]").textContent));
    await context.close();
    const pub = await open({ width: 1280, height: 800 }, false);
    await pub.page.goto(`${srv.base}/p/${slug()}`);
    const head = await pub.page.evaluate(() => { const h = document.querySelector(".lp-site-header"); return h ? { cls: h.className, scroll: h.getAttribute("data-kw-scroll"), thr: h.getAttribute("data-kw-threshold") } : null; });
    assert.ok(head, "l'en-tête publié est présent");
    assert.match(head.cls, /kw-theme-sticky/); assert.match(head.cls, /kw-theme-fx-both/); assert.equal(head.scroll, "both"); assert.equal(head.thr, "40");
    await pub.page.addStyleTag({ content: "body{min-height:3000px}" });
    const scrolled = async (y) => { await pub.page.evaluate((v) => window.scrollTo(0, v), y); await pub.page.waitForTimeout(200); return pub.page.evaluate(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); };
    assert.equal(await scrolled(20), false, "sous le seuil : pas d'effet"); assert.equal(await scrolled(80), true, "au-delà du seuil : effet"); assert.equal(await scrolled(0), false, "retour en haut : effet retiré");
    await pub.context.close();
  });

  test("passer un en-tête collant en « Ordinaire » le rend ordinaire sur le site, même si sa première bande garde son ancien style", async () => {
    const t = await adopt("saas-verre-depoli.clair");
    const { context, page } = await open(); await openEditor(page, t);
    await field(page, "Position").selectOption("static"); await save(page);
    await page.click("[data-pb-publish]"); await page.waitForFunction(() => /publié, à jour|À jour/.test(document.querySelector("[data-pb-status]").textContent));
    await context.close();
    const pub = await open({ width: 1280, height: 800 }, false); await pub.page.goto(`${srv.base}/p/${slug()}`);
    const cls = await pub.page.evaluate(() => document.querySelector(".lp-site-header").className);
    assert.ok(!/kw-theme-sticky|kw-theme-overlay/.test(cls), `en-tête ordinaire : ${cls}`);
    await pub.context.close();
  });

  test("annuler (Ctrl+Z) rétablit le réglage précédent ; lecture seule impossible à modifier n'est pas testée ici (droits : voir tests de l'éditeur)", async () => {
    const t = await adopt("classique-logo-menu-bouton.clair", false);
    const { context, page } = await open(); await openEditor(page, t);
    await field(page, "Position").selectOption("overlay");
    assert.match(await page.locator("[data-pb-header-summary]").innerText(), /Superposé/);
    await page.locator("body").click({ position: { x: 5, y: 5 } }); await page.keyboard.press("Control+z"); await page.waitForTimeout(400);
    await page.click("#pb-tab-page"); await page.waitForSelector("[data-pb-header-summary]");
    assert.equal(await field(page, "Position").inputValue(), "static");
    await context.close();
  });

  test("réglages complets : fixé, coller sur certains appareils (jamais zéro), décalage, masquage — enregistrés et appliqués sur le site publié", async () => {
    const t = await adopt("classique-logo-menu-bouton.clair");
    const { context, page } = await open(); await openEditor(page, t);
    await field(page, "Position").selectOption("fixed");
    const dev = (n) => page.locator("[data-pb-page-settings]").getByLabel(n, { exact: true });
    assert.equal(await dev("Ordinateur").isChecked(), true);
    await dev("Mobile").uncheck(); await dev("Tablette").uncheck();
    assert.match(await page.locator("[data-pb-header-summary]").innerText(), /Actif sur : ordinateur/);
    await dev("Ordinateur").click(); // dernier appareil coché : refusé, la case revient
    assert.equal(await dev("Ordinateur").isChecked(), true, "au moins un appareil reste coché");
    const off = field(page, "Décalage depuis le haut (px)"); await off.fill("20"); await off.press("Enter");
    await field(page, "Effet au défilement").selectOption("shrink");
    assert.equal(await field(page, "Hauteur du logo réduit (px)").isVisible(), true, "visible avec l'effet « réduire »");
    await page.locator("[data-pb-page-settings]").getByLabel("Masquer en descendant, réapparaître en remontant").check();
    assert.equal(await field(page, "Tolérance (px)").isVisible(), true);
    await save(page);
    await page.reload(); await page.waitForSelector("#pb-tab-page", { state: "attached" }); await page.waitForTimeout(800); await page.click("#pb-tab-page"); await page.waitForSelector("[data-pb-header-summary]");
    assert.equal(await field(page, "Position").inputValue(), "fixed"); assert.equal(await field(page, "Décalage depuis le haut (px)").inputValue(), "20");
    assert.equal(await dev("Mobile").isChecked(), false); assert.equal(await dev("Ordinateur").isChecked(), true);
    assert.equal(await page.locator("[data-pb-page-settings]").getByLabel("Masquer en descendant, réapparaître en remontant").isChecked(), true);
    await page.click("[data-pb-publish]"); await page.waitForFunction(() => /publié, à jour|À jour/.test(document.querySelector("[data-pb-status]").textContent));
    await context.close();
    const pub = await open({ width: 1280, height: 800 }, false); await pub.page.goto(`${srv.base}/p/${slug()}`);
    const h = await pub.page.evaluate(() => { const e = document.querySelector(".lp-site-header"); return { cls: e.className, hide: e.getAttribute("data-kw-hide"), style: e.getAttribute("style") || "" }; });
    assert.match(h.cls, /kw-theme-fixed/); assert.match(h.cls, /kw-hdr-no-tablet/); assert.match(h.cls, /kw-hdr-no-mobile/); assert.doesNotMatch(h.cls, /kw-hdr-no-desktop/);
    assert.equal(h.hide, "1"); assert.match(h.style, /--kw-hdr-top:20px/);
    await pub.context.close();
  });

  test("état « Après défilement » : proposé en dernier pour un élément d'un en-tête (onglet Style) avec son explication ; l'écriture et l'application sont prouvées par header-etats-navigateur et header-reglages", async () => {
    const t = await adopt("classique-logo-menu-bouton.clair", false);
    const { context, page } = await open(); await openEditor(page, t);
    await field(page, "Position").selectOption("sticky");
    await page.locator("[data-pb-layers] li.pb-node > .pb-row-item").first().click();
    await page.getByRole("tab", { name: "Style" }).first().click();
    const states = page.locator('[aria-label="État de l\'élément"]');
    await states.waitFor();
    const labels = (await states.locator("button").allInnerTexts()).map((x) => x.trim()); assert.equal(labels[0], "Normal"); assert.deepEqual(labels.slice(-2), ["Après défilement", "Menu ouvert"], "les deux états propres aux en-têtes sont proposés en dernier");
    await states.getByRole("radio", { name: "Après défilement" }).click();
    assert.match(await page.locator(".pb-insp-note").first().innerText(), /défilé au-delà du seuil/);
    await context.close();
  });

  test("menu de l'en-tête : « Ouverture du menu sur mobile » (déplié / tiroir, côté) réglable dans l'éditeur, enregistré, appliqué sur le site publié", async () => {
    // Un menu du site est affecté à l'emplacement « en-tête » (sans menu, le widget n'affiche rien)
    const m = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Menu réglages', 'menu-reglages', 'published')").run(site).lastInsertRowid);
    db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, NULL, 0, 'custom', '/a', 'Page A', 'published')").run(m);
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, m);
    const t = await adopt("classique-logo-menu-bouton.clair");
    const { context, page } = await open({ width: 1500, height: 950 }); await openEditor(page, t);
    await page.locator("[data-pb-layers] li.pb-node > .pb-row-item", { hasText: /Menu de navigati/ }).first().click();
    const sel = page.getByLabel("Ouverture du menu sur mobile"); await sel.waitFor();
    assert.equal(await sel.inputValue(), "inline", "déplié par défaut");
    await sel.selectOption("drawer");
    const side = page.getByLabel("Côté du tiroir"); await side.waitFor(); await side.selectOption("left");
    await save(page);
    await page.click("[data-pb-publish]"); await page.waitForFunction(() => /publié, à jour|À jour/.test(document.querySelector("[data-pb-status]").textContent));
    await context.close();
    const pub = await open({ width: 390, height: 800 }, false); await pub.page.goto(`${srv.base}/p/${slug()}`);
    assert.equal(await pub.page.locator(".lp-site-header nav[data-kw-menu-drawer=left]").count(), 1, "le menu publié porte le réglage tiroir à gauche");
    await pub.page.locator(".lp-site-header .kw-menu-burger").click(); await pub.page.locator(".kw-menu-panel.is-left").waitFor();
    await pub.context.close();
  });

  test("méga-menu dans l'éditeur : rubriques du menu listées, « Créer un panneau » crée un composant du site et l'associe, enregistré, publié, visible au survol ; « Retirer » le détache", async () => {
    let loc = db.prepare("SELECT menu_id FROM nav_locations WHERE site_id = ? AND location = 'header'").get(site);
    if (!loc) { const m = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Menu méga', 'menu-mega', 'published')").run(site).lastInsertRowid); db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, NULL, 0, 'custom', '/a', 'Page A', 'published')").run(m); db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, m); loc = { menu_id: m }; }
    const label = db.prepare("SELECT label FROM nav_items WHERE menu_id = ? AND parent_id IS NULL ORDER BY position LIMIT 1").get(loc.menu_id).label;
    const t = await adopt("classique-logo-menu-bouton.clair");
    const { context, page } = await open({ width: 1500, height: 950 }); await openEditor(page, t);
    await page.locator("[data-pb-layers] li.pb-node > .pb-row-item", { hasText: /Menu de navigati/ }).first().click();
    const item = page.locator("[data-pb-mega-item]").first(); await item.waitFor();
    assert.match(await item.innerText(), new RegExp(label));
    const [popup] = await Promise.all([context.waitForEvent("page"), item.locator("[data-pb-mega-create]").click()]);
    assert.match(popup.url(), /\/composants\/\d+\/editeur/, "l'éditeur du panneau s'ouvre dans un nouvel onglet"); await popup.close();
    await item.locator("[data-pb-mega-edit]").waitFor();
    const comp = db.prepare("SELECT id, site_id, name FROM mk_web_components WHERE name LIKE 'Méga-menu · %' AND site_id = ? ORDER BY id DESC LIMIT 1").get(site);
    assert.ok(comp, "composant créé dans CE site"); assert.equal(comp.name, `Méga-menu · ${label}`);
    await page.locator("[data-pb-page-settings]").waitFor({ state: "attached" });
    await save(page);
    await page.click("[data-pb-publish]"); await page.waitForFunction(() => /publié, à jour|À jour/.test(document.querySelector("[data-pb-status]").textContent));
    const pub = await open({ width: 1280, height: 800 }, false); await pub.page.goto(`${srv.base}/p/${slug()}`);
    await pub.page.locator(".lp-site-header .kw-menu-item.has-mega").first().hover();
    assert.match(await pub.page.locator(".lp-site-header .kw-mega").innerText(), /Première colonne[\s\S]*Deuxième colonne[\s\S]*Troisième colonne/, "le panneau de départ est affiché");
    await pub.context.close();
    await item.locator("[data-pb-mega-remove]").click(); await item.locator("[data-pb-mega-create]").waitFor();
    assert.equal(db.prepare("SELECT 1 FROM mk_web_components WHERE id = ?").get(comp.id) !== undefined, true, "le composant est conservé");
    await context.close();
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
