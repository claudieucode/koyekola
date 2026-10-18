// Palier 3, B1 — espace d'un site dans un VRAI Chrome (Playwright) : « Ouvrir », bandeau, menu, changement de site, module « Bientôt »,
// création de page, accès limité à un site, site principal, téléphone. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
// SHOT_DIR (facultatif) : dossier où enregistrer des captures d'écran.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const SHOTS = process.env.SHOT_DIR || "";

describe("espace d'un site dans un navigateur réel", { skip: SKIP }, () => {
  let srv, boss, memA, browser, errors, db, orgId, A, B;
  const SP = "/marketing/site-web/sites";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const mkSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-")).lastInsertRowid);
  const mkPage = (site, name) => db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, ?, ?, ?, 'draft', ?)").run(orgId, name, `nav-${name.toLowerCase().replace(/\W+/g, "-")}`, name, site);
  const open = async (client = boss, viewport = { width: 1280, height: 900 }) => {
    const context = await browser.newContext({ viewport });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return { context, page };
  };
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + ".png"), fullPage: true }); } };
  const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  const openGroup = async (page, label) => { const head = page.locator(".mk-cms-nav .mk-nav-head", { hasText: label }).first(); if (await head.count() && (await head.getAttribute("aria-expanded")) === "false") await head.click(); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db(); orgId = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Site Alpha"); B = mkSite("Site Beta");
    mkPage(A, "Page Alpha"); mkPage(B, "Page Beta"); mkPage(null, "Page Principale");
    memA = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, one("SELECT id FROM users WHERE email = ?", memA.email).id);
    errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("« Ouvrir » depuis Mes sites mène à l'espace du site : bandeau, menu complet, titre", async () => {
    const { context, page } = await open();
    await page.goto(srv.base + SP);
    await page.locator(`a[href="${SP}/${A}/tableau-de-bord"]`, { hasText: "Ouvrir" }).click();
    await page.waitForURL(`**${SP}/${A}/tableau-de-bord`);
    assert.ok(await page.locator(".mk-site-banner-name", { hasText: "Site Alpha" }).isVisible());
    assert.match(await page.title(), /Site Alpha/);
    for (const label of ["Tableau de bord", "Pages", "Articles", "Médias", "Marketing du site", "SEO", "Redirections", "Utilisateurs", "Outils", "Paramètres"]) assert.ok(await page.locator(".mk-cms-nav", { hasText: label }).count(), `menu : ${label}`);
    await shot(page, "b1-01-tableau-de-bord-bureau");
    await context.close();
  });

  test("menu → Pages : uniquement les pages du site ; création d'une page rattachée au site", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}${SP}/${A}/tableau-de-bord`);
    await openGroup(page, "Pages");
    await page.locator(`.mk-cms-nav a[href="${SP}/${A}/pages"]`).first().click();
    await page.waitForURL(`**${SP}/${A}/pages`);
    const main = await page.locator("main").innerText();
    assert.match(main, /Page Alpha/); assert.doesNotMatch(main, /Page Beta|Page Principale/);
    await shot(page, "b1-02-pages-bureau");
    // La même boîte « Nouvelle page » que la liste centrale (page vierge, modèles, mise en page) ; elle ouvre l'éditeur sur la page créée
    await page.getByRole("button", { name: "Nouvelle page" }).first().click();
    const dlg = page.locator("dialog#nouvelle");
    assert.ok(await dlg.isVisible(), "la boîte Nouvelle page s'ouvre");
    assert.ok(await dlg.getByText("Page vierge").isVisible() && await dlg.getByText("Conception libre").isVisible() && await dlg.getByText("Guidée par un format").isVisible(), "choix : page vierge, modèles, mise en page");
    await shot(page, "nouvelle-page-boite-site");
    await dlg.locator("#lp-name").fill("Ma nouvelle page");
    await Promise.all([page.waitForURL(/\/marketing\/pages\/\d+\/editeur/), dlg.getByRole("button", { name: /Créer et ouvrir l/ }).click()]);
    assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE name = 'Ma nouvelle page'").site_id, A);
    // Incident « création de page renvoyée vers le principal » : la page créée s'ouvre DANS le cadre du site (bandeau, menu, retour), s'enregistre et revient à la liste du site
    const id = one("SELECT id FROM mk_landing_pages WHERE name = 'Ma nouvelle page'").id;
    assert.match(page.url(), new RegExp(`/marketing/pages/${id}/editeur`), "l'éditeur s'ouvre sur la page créée");
    await page.goto(`${srv.base}/marketing/pages/${id}`);
    assert.ok(await page.locator(".mk-site-banner-name", { hasText: "Site Alpha" }).isVisible(), "bandeau du site après création");
    assert.ok(await page.locator(`.mk-cms-nav a[href="${SP}/${A}/tableau-de-bord"]`).count() > 0, "le menu pointe vers le tableau de bord DU SITE");
    assert.equal(await page.locator('.mk-cms-nav a[href="/marketing/site-web/principal/tableau-de-bord"]').count(), 0, "aucun lien vers le tableau de bord du principal");
    await shot(page, "incident-page-creee-dans-le-site");
    await page.locator("input[name=slug]").first().fill("ma-nouvelle-page-v2");
    const formSel = `form[action$="/marketing/pages/${id}"]`;
    await Promise.all([page.waitForNavigation(), page.locator(`${formSel} button[type=submit], ${formSel} button:not([type])`).first().click()]);
    assert.equal(one("SELECT slug FROM mk_landing_pages WHERE id = ?", id).slug, "ma-nouvelle-page-v2", "enregistrement effectué");
    assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE id = ?", id).site_id, A, "toujours dans le site après enregistrement");
    assert.ok(await page.locator(".mk-site-banner-name", { hasText: "Site Alpha" }).isVisible(), "bandeau du site après enregistrement");
    await Promise.all([page.waitForURL(`**${SP}/${A}/pages`), page.locator(".mk-back a").first().click()]);
    await context.close();
  });

  test("changement de site sécurisé par le sélecteur : Alpha → Beta, le contenu change entièrement", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}${SP}/${A}/pages`);
    await page.locator(".mk-cms-site-btn").click();
    const items = await page.locator("#mk-site-menu a").allInnerTexts();
    assert.ok(items.includes("Site Alpha") && items.includes("Site Beta") && items.includes("Site principal"));
    await shot(page, "b1-03-selecteur-de-site");
    await page.locator("#mk-site-menu a", { hasText: "Site Beta" }).click();
    await page.waitForURL(`**${SP}/${B}/tableau-de-bord`);
    assert.ok(await page.locator(".mk-site-banner-name", { hasText: "Site Beta" }).isVisible());
    await page.goto(`${srv.base}${SP}/${B}/pages`);
    const main = await page.locator("main").innerText();
    assert.match(main, /Page Beta/); assert.doesNotMatch(main, /Page Alpha|Ma nouvelle page|Page Principale/);
    await context.close();
  });

  test("module « Bientôt » : visible et grisé dans le menu, sans lien ; son explication reste lisible par son adresse, sans donnée ni action", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}${SP}/${A}/tableau-de-bord`);
    await openGroup(page, "SEO");
    const soon = page.locator(".mk-cms-nav .mk-nav-sublink.is-soon", { hasText: "Meta" }).first();
    assert.ok(await soon.isVisible(), "l'entrée grisée est visible");
    assert.equal(await soon.getAttribute("aria-disabled"), "true");
    assert.equal(await page.locator(`.mk-cms-nav a[href="${SP}/${A}/modeles"]`).count(), 0, "aucun lien vers un module pas prêt"); // R8 lot 6C : « seo » est ouvert ; « Meta » et « modeles » restent fermés
    assert.ok(await page.locator(".mk-cms-nav .mk-cms-tag", { hasText: "Bientôt" }).count() >= 1, "badges « Bientôt » présents pour les entrées fermées");
    await soon.click({ force: true });
    assert.equal(new URL(page.url()).pathname, `${SP}/${A}/tableau-de-bord`, "cliquer sur une entrée grisée ne change pas de page");
    await page.goto(`${srv.base}${SP}/${A}/modeles`);
    assert.ok(await page.locator(".mk-cms-soon", { hasText: "Prochain palier" }).isVisible());
    assert.equal(await page.locator("main table, main form").count(), 0);
    await shot(page, "b1-04-module-bientot");
    await context.close();
  });

  test("personne limitée au site Alpha : son espace seulement ; l'adresse de Beta et le site principal sont refusés", async () => {
    const { context, page } = await open(memA);
    await page.goto(`${srv.base}${SP}/${A}/tableau-de-bord`);
    assert.ok(await page.locator(".mk-site-banner-name", { hasText: "Site Alpha" }).isVisible());
    await page.locator(".mk-cms-site-btn").click();
    const items = await page.locator("#mk-site-menu a").allInnerTexts();
    assert.deepEqual(items.map((t) => t.trim()), ["Site Alpha"], "le sélecteur ne propose que son site");
    const denied = await page.goto(`${srv.base}${SP}/${B}/pages`);
    assert.equal(denied.status(), 403);
    assert.doesNotMatch(await page.content(), /Page Beta/);
    assert.equal((await page.goto(`${srv.base}/marketing/site-web/principal/pages`)).status(), 403);
    await shot(page, "b1-05-acces-refuse");
    await context.close();
  });

  test("site principal : même espace, adresses historiques toujours valides", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}/marketing/site-web/principal/tableau-de-bord`);
    assert.ok(await page.locator(".mk-site-banner-name", { hasText: "Site principal" }).isVisible());
    await page.goto(`${srv.base}/marketing/site-web/principal/pages`);
    const main = await page.locator("main").innerText();
    assert.match(main, /Page Principale/); assert.doesNotMatch(main, /Page Alpha|Page Beta/);
    await shot(page, "b1-06-site-principal");
    for (const old of ["/marketing/site-web", "/marketing/pages", "/marketing/site-web/sites"]) assert.equal((await page.goto(srv.base + old)).status(), 200, old);
    await context.close();
  });

  test("téléphone (375 px) : bandeau lisible, pas de défilement horizontal, menu accessible", async () => {
    const { context, page } = await open(boss, { width: 375, height: 800 });
    for (const m of ["tableau-de-bord", "pages", "articles", "composants"]) {
      await page.goto(`${srv.base}${SP}/${A}/${m}`);
      assert.ok(await noHScroll(page), `${m} : pas de défilement horizontal`);
      assert.ok(await page.locator(".mk-site-banner-name").isVisible(), `${m} : bandeau visible`);
    }
    await page.goto(`${srv.base}${SP}/${A}/tableau-de-bord`);
    await shot(page, "b1-07-telephone");
    await context.close();
  });

  test("aucune erreur JavaScript ou console pendant tous ces parcours", () => {
    assert.deepEqual(errors, []);
  });
});
