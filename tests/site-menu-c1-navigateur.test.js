// Correction de parité, lot C1 dans un VRAI Chrome (Playwright) : le menu d'un site a la structure du principal (groupes, sous-entrées, entrées grisées),
// en bureau et sur téléphone, sans erreur de console. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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

describe("menu d'un site (C1) dans un navigateur réel", { skip: SKIP }, () => {
  let srv, boss, memA, browser, errors, db, orgId, A, B;
  const SP = "/marketing/site-web/sites";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const mkSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-")).lastInsertRowid);
  const mkList = (site, name) => Number(db.prepare("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (?, ?, ?)").run(orgId, name, site).lastInsertRowid);
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
  const banner = (page, name) => page.locator(".mk-site-banner-name", { hasText: name }).isVisible();
  const openGroup = async (page, label) => { const head = page.locator(".mk-cms-nav .mk-nav-head", { hasText: label }).first(); if (await head.count() && (await head.getAttribute("aria-expanded")) === "false") await head.click(); };
  const go = async (page, group, href) => { if (group) await openGroup(page, group); await page.locator(`.mk-cms-nav a[href="${href}"]`).first().click(); await page.waitForLoadState("load"); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db(); orgId = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Site Alpha"); B = mkSite("Site Beta");
    mkList(A, "Liste Alpha"); mkList(B, "Liste Beta"); mkList(null, "Liste Principale");
    memA = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, one("SELECT id FROM users WHERE email = ?", memA.email).id);
    errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const groupTitles = (page) => page.evaluate(() => [...document.querySelectorAll(".mk-cms-nav > .mk-nav-group > .mk-nav-head .mk-nav-label, .mk-cms-nav > a.mk-nav-link > .mk-nav-label:first-of-type, .mk-cms-nav > span.mk-nav-link > .mk-nav-label:first-of-type")].map((e) => e.textContent.trim()));
  const subs = (page, group) => page.evaluate((g) => [...document.querySelectorAll(`.mk-cms-nav .mk-nav-group[data-mk-group="${g}"] .mk-nav-sublink`)].map((e) => ({ t: e.firstElementChild ? e.firstElementChild.textContent.trim() : e.textContent.trim(), soon: e.classList.contains("is-soon"), link: e.tagName === "A" })), group);

  test("bureau : les titres de groupe d'un site sont ceux du principal (hors fonctions centrales), dans le même ordre", async () => {
    const a = await open(); await a.page.goto(`${srv.base}${SP}/${A}/tableau-de-bord`);
    const b = await open(); await b.page.goto(`${srv.base}/marketing/site-web/principal/tableau-de-bord`);
    const site = await groupTitles(a.page), main = await groupTitles(b.page);
    const norm = (l) => l.filter((t) => t !== "Marketing du site").map((t) => (t === "Tableau de bord du site principal" ? "Tableau de bord" : t));
    assert.deepEqual(norm(site), norm(main));
    for (const t of ["Utilisateurs", "Outils", "Paramètres", "Apparence", "Articles"]) assert.ok(site.includes(t), `titre de groupe : ${t}`);
    for (const t of ["Équipe du site", "Réglages du site", "Santé du site"]) assert.ok(!site.includes(t), `plus de titre de groupe « ${t} »`);
    await shot(a.page, "c1-menu-site-bureau"); await shot(b.page, "c1-menu-principal-bureau");
    await a.context.close(); await b.context.close();
  });

  test("bureau : Utilisateurs, Outils et Paramètres se déplient avec leurs sous-entrées ; les non-prêtes sont grisées et ne bougent pas, les prêtes ouvrent le site", async () => {
    const { context, page } = await open(); await page.goto(`${srv.base}${SP}/${A}/tableau-de-bord`);
    for (const [g, label, n] of [["utilisateurs", "Utilisateurs", 5], ["outils", "Outils", 8], ["parametres", "Paramètres", 11]]) {
      await openGroup(page, label);
      const s = await subs(page, g);
      assert.equal(s.length, n, `${label} : ${n} sous-entrées`);
      assert.ok(s.some((x) => x.soon && !x.link), `${label} : au moins une entrée grisée sans lien`);
      assert.ok(s.every((x) => x.soon === !x.link), `${label} : grisé = sans lien`);
    }
    const roles = page.locator(".mk-cms-nav .mk-nav-sublink.is-soon", { hasText: "Rôles" }).first();
    assert.ok(await roles.isVisible()); await roles.click({ force: true });
    assert.equal(new URL(page.url()).pathname, `${SP}/${A}/tableau-de-bord`, "l'entrée grisée n'ouvre rien");
    await go(page, "Outils", `${SP}/${A}/outils`);
    assert.ok(await banner(page, "Site Alpha")); assert.equal(new URL(page.url()).pathname, `${SP}/${A}/outils`);
    assert.ok(await page.locator(".mk-cms-nav a[aria-current=page]", { hasText: "Santé du site" }).first().isVisible());
    await go(page, "Paramètres", `${SP}/${A}/reglages`);
    assert.ok(await banner(page, "Site Alpha")); assert.ok(await page.locator(".mk-cms-nav a[aria-current=page]", { hasText: "Général" }).first().isVisible());
    await go(page, "Utilisateurs", `${SP}/${A}/equipe`);
    assert.ok(await banner(page, "Site Alpha")); assert.ok(await page.locator(".mk-cms-nav a[aria-current=page]", { hasText: "Tous les utilisateurs" }).first().isVisible());
    await shot(page, "c1-utilisateurs-deplie");
    await context.close();
  });

  test("bureau : aucune des entrées ouvertes du menu ne renvoie au CMS principal (bandeau du site conservé à chaque clic)", async () => {
    const { context, page } = await open(); await page.goto(`${srv.base}${SP}/${A}/tableau-de-bord`);
    const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll(".mk-cms-nav a[href]")].map((a) => a.getAttribute("href")))]);
    const own = hrefs.filter((h) => h.startsWith(`${SP}/${A}/`));
    assert.ok(own.length >= 15, `liens du site : ${own.length}`);
    assert.ok(hrefs.every((h) => h === SP || h.startsWith(`${SP}/${A}/`)), "aucun lien hors du site");
    for (const h of own) { await page.goto(`${srv.base}${h}`); assert.ok(await banner(page, "Site Alpha"), h); assert.ok(await page.locator(".mk-cms-nav").isVisible(), h); }
    await context.close();
  });

  test("téléphone 375 px : le menu du site s'ouvre avec ses groupes et ses entrées grisées, sans défilement horizontal", async () => {
    const { context, page } = await open(boss, { width: 375, height: 800 });
    await page.goto(`${srv.base}${SP}/${A}/tableau-de-bord`);
    assert.ok(await noHScroll(page));
    await page.locator("[data-mk-sidebar-toggle]").first().click(); await page.waitForTimeout(400);
    await openGroup(page, "Utilisateurs");
    assert.ok(await page.locator(".mk-cms-nav .mk-nav-sublink.is-soon", { hasText: "Rôles" }).first().isVisible());
    assert.ok(await page.locator(".mk-cms-nav .mk-nav-head", { hasText: "Paramètres" }).first().isVisible());
    await shot(page, "c1-menu-site-mobile");
    await context.close();
  });

  test("membre limité au site A : même structure de menu, jamais de lien vers le site B", async () => {
    const { context, page } = await open(memA); await page.goto(`${srv.base}${SP}/${A}/tableau-de-bord`);
    assert.ok(await banner(page, "Site Alpha"));
    const hrefs = await page.evaluate(() => [...document.querySelectorAll(".mk-cms-nav a[href]")].map((a) => a.getAttribute("href")));
    assert.ok(hrefs.every((h) => !h.includes(`/sites/${B}/`)));
    const titles = await groupTitles(page);
    assert.ok(titles.includes("Pages") && titles.includes("Articles"), "groupes du registre présents");
    await context.close();
  });

  test("aucune erreur de script ni de console pendant ces parcours", () => { assert.deepEqual(errors, []); });
});
