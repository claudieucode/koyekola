// KOLAKISA CMS — Apparence → Templates dans un VRAI Chrome (Playwright, ignoré sans) : bibliothèque, vignettes réelles, recherche, aperçu par page et par appareil, importation d'un pack
// (pages, menu, brouillon de styles), double clic, réponse perdue puis nouvelle tentative (aucun doublon), gabarit de page, « Mes modèles », clavier, téléphone, lecture seule. Aucune erreur JavaScript.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { PACKS } = require("../src/marketing/pages/sitePacks");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("templates (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, B, orgId;
  const TP = "/marketing/site-web/templates";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const open = async (width = 1280, client = boss) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const edit = async (page, site = A) => { await page.goto(`${srv.base}${TP}?site=${site}`); await page.locator("[data-tp-main]:not([hidden])").waitFor(); };
  // La liste est paginée côté serveur (12 par page) : pour atteindre un modèle précis, on le cherche (la recherche interroge le serveur)
  const find = async (page, text) => { await page.fill("[data-tp-search]", text); await page.waitForFunction(() => document.querySelector("[data-tp-grid]").getAttribute("aria-busy") === "false"); await page.waitForTimeout(450); await page.waitForFunction(() => document.querySelector("[data-tp-grid]").getAttribute("aria-busy") === "false"); };
  // Changer d'onglet interroge le serveur : on attend la fin du chargement avant de lire la liste
  const tab = async (page, source) => { await page.click(`[data-tp-source="${source}"]`); await page.waitForFunction((k) => document.querySelector(`[data-tp-source="${k}"]`).getAttribute("aria-selected") === "true" && document.querySelector("[data-tp-grid]").getAttribute("aria-busy") === "false", source); };
  const card = (page, name) => page.locator(".mk-pt-card", { has: page.getByRole("heading", { name, exact: true }) });
  const pagesA = () => one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", A).n;
  const imports = () => one("SELECT COUNT(*) n FROM cms_template_imports WHERE site_id = ?", A).n;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, ?)").run(orgId, n, n.toLowerCase(), JSON.stringify({ colors: { primary: "#8a1c3a" } })).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    db.prepare("INSERT INTO mk_page_templates (organization_id, site_id, shared, name, category, description, content) VALUES (?, ?, 0, 'Modèle de A', 'Mes modèles', 'Privé', ?)").run(orgId, A, JSON.stringify({ sections: [{ type: "text", markdown: "Contenu du modèle de A" }], theme: {} }));
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("la bibliothèque s'ouvre : packs avec vignettes réelles (styles du site), recherche, catégories, onglets ; « Mes modèles » ne montre que ceux de ce site ; imports vides au départ", async () => {
    const page = await open(); await edit(page);
    assert.equal(await page.locator(".mk-pt-card").count(), Math.min(12, PACKS.length)); // 12 par page (pagination côté serveur)
    await page.waitForFunction(() => { const f = document.querySelector(".mk-pt-thumb iframe"); try { return f.contentDocument && f.contentDocument.body && /lp-main/.test(f.contentDocument.body.innerHTML); } catch { return false; } });
    assert.match(await page.locator(".mk-pt-thumb iframe").first().evaluate((f) => f.contentDocument.body.getAttribute("style")), /--kw-primary:#8a1c3a/, "vignette rendue avec les styles du site");
    await find(page, "Formation en ligne"); assert.match(await card(page, "Formation en ligne").innerText(), /6 pages/);
    // La recherche et les filtres interrogent le serveur (catalogue.json) : on attend le résultat au lieu de compter tout de suite
    const cards = (n) => page.waitForFunction((k) => document.querySelectorAll(".mk-pt-card").length === k && document.querySelector("[data-tp-grid]").getAttribute("aria-busy") === "false", n);
    await page.fill("[data-tp-search]", "Cycle de webinaires"); await cards(1); await page.fill("[data-tp-search]", ""); await cards(Math.min(12, PACKS.length));
    await page.selectOption("[data-tp-cat]", "Produit"); await cards(1); await page.selectOption("[data-tp-cat]", "");  await cards(Math.min(12, PACKS.length));
    await tab(page, "page"); await cards(12); await page.click("[data-tp-more]"); await page.waitForFunction(() => document.querySelectorAll(".mk-pt-card").length >= 24); assert.ok((await page.locator(".mk-pt-card").count()) >= 20);
    await tab(page, "mine"); assert.deepEqual(await page.locator(".mk-pt-card h3").allTextContents(), ["Modèle de A"]);
    await tab(page, "hist"); assert.match(await page.locator("[data-tp-empty]").innerText(), /Aucun import/);
  });

  test("aperçu d'un pack : une page à la fois (onglets), contenu réel du modèle, appareils ; Échap ferme ; rien n'est créé", async () => {
    const before = pagesA(), page = await open(); await edit(page);
    await find(page, "Formation en ligne"); await card(page, "Formation en ligne").getByRole("button", { name: /Aperçu de/ }).click();
    const dlg = page.locator("[data-tp-dlg-preview]"); await dlg.waitFor();
    assert.equal(await page.locator("[data-tp-prev-tabs] button").count(), 6);
    await page.waitForFunction(() => { const f = document.querySelector("[data-tp-prev-frame]"); try { return f.contentDocument.body.innerText.length > 50; } catch { return false; } });
    const home = await page.locator("[data-tp-prev-frame]").evaluate((f) => f.contentDocument.body.innerText);
    await page.getByRole("tab", { name: "Tarifs" }).click();
    await page.waitForFunction((t) => { const f = document.querySelector("[data-tp-prev-frame]"); try { return f.contentDocument.body.innerText !== t && /Nos tarifs/.test(f.contentDocument.body.innerText); } catch { return false; } }, home);
    await page.click('[data-tp-device="mobile"]'); assert.equal(await page.locator("[data-tp-prev-frame]").evaluate((f) => f.style.width), "390px");
    await page.keyboard.press("Escape"); await dlg.waitFor({ state: "hidden" }); assert.equal(pagesA(), before);
  });

  test("importer un pack avec menu et brouillon de styles : fenêtre explicite, résultat réel (pages, menu, styles) avec liens ; DOUBLE CLIC : un seul import ; rien n'est publié", async () => {
    const page = await open(); await edit(page);
    await find(page, "Formation en ligne"); await card(page, "Formation en ligne").getByRole("button", { name: /Utiliser ce modèle : Formation en ligne/ }).click();
    const dlg = page.locator("[data-tp-dlg-import]"); await dlg.waitFor();
    assert.equal(await page.locator("[data-tp-imp-list] li").count(), 6); assert.equal(await page.locator("[data-tp-imp-warn]").isHidden(), true);
    await page.locator("[data-tp-imp-menu]").check(); await page.locator("[data-tp-imp-styles]").check();
    const before = pagesA();
    await page.locator("[data-tp-imp-ok]").dblclick();
    await page.locator("[data-tp-imp-result]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-tp-imp-result]").innerText(), /Importé : 6 pages \+ le menu « Formation en ligne — menu » \+ un brouillon de styles\. Rien n'est publié/);
    assert.equal(pagesA(), before + 6, "6 pages, une seule série malgré le double clic"); assert.equal(imports(), 1);
    assert.equal(await page.locator("[data-tp-imp-result] a[href$='/editeur']").count(), 6);
    assert.equal(one("SELECT COUNT(*) n FROM nav_menus WHERE site_id = ? AND name = 'Formation en ligne — menu'", A).n, 1);
    assert.equal(JSON.parse(one("SELECT changes FROM cms_customizer_drafts WHERE site_id = ?", A).changes)["tokens.colors.primary"], "#0b2a40");
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND published_at IS NOT NULL", A).n, 0, "rien n'est publié");
    await page.keyboard.press("Escape"); await dlg.waitFor({ state: "hidden" });
    await find(page, "Formation en ligne"); assert.match(await card(page, "Formation en ligne").innerText(), /Déjà importé le/);
    await tab(page, "hist"); assert.match(await page.locator("[data-tp-history-list]").innerText(), /Formation en ligne — 6 pages \+ menu \+ brouillon de styles/);
  });

  test("réimporter le même pack : avertissement clair « de NOUVELLES pages », pages numérotées, anciennes pages intactes", async () => {
    const page = await open(); await edit(page);
    const firstIds = db.prepare("SELECT id FROM mk_landing_pages WHERE site_id = ?").all(A).map((r) => r.id), snap = JSON.stringify(db.prepare("SELECT * FROM mk_landing_pages WHERE site_id = ?").all(A));
    await find(page, "Formation en ligne"); await card(page, "Formation en ligne").getByRole("button", { name: /Utiliser ce modèle : Formation en ligne/ }).click();
    assert.match(await page.locator("[data-tp-imp-warn]").innerText(), /déjà été importé.*NOUVELLES pages/);
    await page.locator("[data-tp-imp-ok]").click(); await page.locator("[data-tp-imp-result]:not([hidden])").waitFor();
    const names = await page.locator("[data-tp-imp-result] a[href$='/editeur']").allTextContents(); assert.ok(names.every((n) => /\(\d+\)/.test(n)), names.join(" | "));
    assert.equal(JSON.stringify(db.prepare("SELECT * FROM mk_landing_pages WHERE site_id = ? AND id IN (" + firstIds.join(",") + ")").all(A)), snap, "les pages du premier import n'ont pas changé");
    await page.keyboard.press("Escape");
  });

  test("RÉPONSE PERDUE : le serveur a importé mais le navigateur n'a pas reçu la réponse ; « Réessayer » ne crée AUCUNE page de plus (même jeton)", async () => {
    const page = await open(); await edit(page);
    const before = pagesA(), importsBefore = imports();
    await find(page, "Site d'entreprise"); await card(page, "Site d'entreprise").getByRole("button", { name: /Utiliser ce modèle : Site d'entreprise/ }).click(); await page.locator("[data-tp-dlg-import]").waitFor();
    await page.route("**/templates/importer*", async (route) => { await route.fetch(); await route.abort("connectionreset"); });
    await page.locator("[data-tp-imp-ok]").click(); await page.locator("[data-tp-imp-err]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-tp-imp-err]").innerText(), /Connexion impossible/); assert.equal(await page.locator("[data-tp-imp-ok]").innerText(), "Réessayer");
    assert.equal(pagesA(), before + 4, "le serveur avait bien importé"); assert.equal(imports(), importsBefore + 1);
    await page.unroute("**/templates/importer*");
    await page.locator("[data-tp-imp-ok]").click(); await page.locator("[data-tp-imp-result]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-tp-imp-result]").innerText(), /Déjà importé : 4 pages/); assert.equal(pagesA(), before + 4, "aucune page de plus"); assert.equal(imports(), importsBefore + 1);
    await page.keyboard.press("Escape");
  });

  test("gabarit de page : nom modifiable ; « Mes modèles » ; erreur serveur affichée dans la fenêtre sans rien créer", async () => {
    const page = await open(); await edit(page); await tab(page, "page"); await find(page, "Contact");
    await card(page, "Contact").getByRole("button", { name: /Utiliser ce modèle : Contact/ }).click();
    assert.equal(await page.locator("[data-tp-imp-options]").isHidden(), true); assert.equal(await page.locator("[data-tp-imp-single]").isVisible(), true);
    await page.fill("[data-tp-imp-name]", "Nous écrire"); await page.locator("[data-tp-imp-ok]").click(); await page.locator("[data-tp-imp-result]:not([hidden])").waitFor();
    assert.equal(one("SELECT name FROM mk_landing_pages WHERE site_id = ? AND name = 'Nous écrire'", A).name, "Nous écrire"); await page.keyboard.press("Escape");
    await page.fill("[data-tp-search]", ""); await tab(page, "mine"); await find(page, ""); await card(page, "Modèle de A").getByRole("button", { name: /Utiliser ce modèle : Modèle de A/ }).click(); await page.locator("[data-tp-imp-ok]").click(); await page.locator("[data-tp-imp-result]:not([hidden])").waitFor();
    assert.match(one("SELECT sections FROM mk_landing_pages WHERE site_id = ? AND name = 'Modèle de A'", A).sections, /Contenu du modèle de A/); await page.keyboard.press("Escape");
    await tab(page, "page"); await find(page, "Questions fréquentes"); await card(page, "FAQ").or(card(page, "Questions fréquentes")).first().getByRole("button", { name: /Utiliser ce modèle/ }).click();
    const before = pagesA();
    await page.route("**/templates/importer*", (r) => r.fulfill({ status: 500, contentType: "application/json", body: "{}" }));
    await page.locator("[data-tp-imp-ok]").click(); await page.locator("[data-tp-imp-err]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-tp-imp-err]").innerText(), /erreur 500.*Rien n'a été créé/); assert.equal(pagesA(), before);
    await page.unroute("**/templates/importer*"); await page.keyboard.press("Escape");
  });

  test("clavier, téléphone (390 px) et lecture seule : filtres en onglets, boutons nommés ; aucun défilement horizontal ; le lecteur du site peut voir mais pas importer ; autre site refusé ; aucune erreur JavaScript", async () => {
    const page = await open(); await edit(page);
    assert.equal(await page.locator('[data-tp-source="pack"]').getAttribute("role"), "tab");
    const unnamed = await page.evaluate(() => [...document.querySelectorAll("[data-tp-root] button, [data-tp-root] input, [data-tp-root] select")].filter((el) => !el.closest("dialog") && !(el.getAttribute("aria-label") || el.textContent.trim() || (el.labels && el.labels.length) || el.getAttribute("placeholder"))).map((el) => el.outerHTML.slice(0, 80)));
    assert.deepEqual(unnamed, []);
    const m = await open(390); await edit(m);
    assert.ok((await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1);
    assert.equal(await m.evaluate(() => getComputedStyle(document.querySelector("[data-tp-grid]")).gridTemplateColumns.split(" ").length), 1);
    const viewer = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'viewer')").run(A, viewer.email);
    const v = await open(1280, viewer); await edit(v);
    await find(v, "Site d'entreprise"); assert.equal(await card(v, "Site d'entreprise").getByRole("button", { name: /Utiliser ce modèle/ }).isDisabled(), true); assert.equal(await card(v, "Site d'entreprise").getByRole("button", { name: /Aperçu de/ }).isEnabled(), true);
    const r = await v.goto(`${srv.base}${TP}?site=${B}`); assert.notEqual(r.status(), 200);
    assert.deepEqual(errors, [], "aucune erreur JavaScript sur tout le parcours");
  });
});
