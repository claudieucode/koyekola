// Palier 3, lot P1a dans un VRAI Chrome (Playwright) : on parcourt les écrans partagés par le menu du site, on lance une action, on vérifie le cadre,
// l'isolation visible, le membre limité à un site, le site principal et le téléphone. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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

describe("menu d'un site (P1a) dans un navigateur réel", { skip: SKIP }, () => {
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

  test("par le menu du site : chacun des 9 écrans partagés garde le bandeau et le menu, et n'affiche que les données de CE site", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}${SP}/${A}/tableau-de-bord`);
    const screens = [["Marketing du site", "listes", "Listes"], ["Marketing du site", "segments", "Segments"], ["Marketing du site", "modeles-email", "Modèles d'e-mail"], ["Marketing du site", "campagnes", "Campagnes"],
      ["Marketing du site", "automatisations", "Automatisations"], ["Marketing du site", "tunnels", "Tunnels"], ["Marketing du site", "analytics", "Analytics"], [null, "tests-ab", "Tests A/B"], ["Outils", "outils", "Santé du site"]];
    for (const [group, mod, label] of screens) {
      await go(page, group, `${SP}/${A}/${mod}`);
      assert.ok(await banner(page, "Site Alpha"), `${mod} : bandeau`);
      assert.ok(await page.locator(".mk-cms-nav").isVisible(), `${mod} : menu du site`);
      assert.ok(await page.locator(".mk-cms-nav a[aria-current=page]", { hasText: label }).first().isVisible(), `${mod} : entrée active « ${label} »`);
      assert.ok(await page.locator(".kab-site-name", { hasText: "Site Alpha" }).first().isVisible(), `${mod} : sélecteur de site sur Alpha`);
      assert.equal(await page.locator("body", { hasText: "Liste Beta" }).count() + await page.locator("body", { hasText: "Liste Principale" }).count(), 0, `${mod} : rien d'un autre site`);
      if (["listes", "campagnes", "tests-ab", "outils"].includes(mod)) await shot(page, `p1a-${mod}-bureau`);
    }
    await context.close();
  });

  test("une action (créer une liste) depuis le cadre du site revient dans le cadre du site, avec la nouvelle liste", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}${SP}/${A}/listes#nouvelle`);
    const form = page.locator('form[action="/marketing/listes"][method="post"]').first();
    await form.locator('input[name="name"]').waitFor({ state: "visible", timeout: 5000 }).catch(async () => { await page.locator('a[href="#nouvelle"], button[data-mk-open], [data-mk-dialog-open]').first().click().catch(() => {}); });
    await form.locator('input[name="name"]').fill("Liste créée dans Alpha");
    if (await form.locator('select[name="site"]').count()) await form.locator('select[name="site"]').selectOption(String(A));
    await Promise.all([page.waitForURL(/\/marketing\/listes\?site=\d+/), form.locator('button[type="submit"], button:not([type])').first().click()]);
    assert.match(page.url(), new RegExp(`site=${A}$`));
    assert.ok(await banner(page, "Site Alpha"), "bandeau après l'action");
    assert.ok(await page.locator("main", { hasText: "Liste créée dans Alpha" }).first().isVisible());
    assert.equal(await page.locator("main", { hasText: "Liste Beta" }).count(), 0);
    await shot(page, "p1a-listes-apres-action");
    await context.close();
  });

  test("changer de site depuis un écran partagé : le cadre et les données suivent", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}${SP}/${A}/campagnes`);
    await page.locator(".kab-site, .kab-site-name").first().click().catch(() => {});
    await page.locator(`a[href="${SP}/${B}/tableau-de-bord"]`).first().click();
    await page.waitForLoadState("load");
    assert.ok(await banner(page, "Site Beta"));
    await go(page, "Marketing du site", `${SP}/${B}/listes`);
    assert.ok(await page.locator("main", { hasText: "Liste Beta" }).first().isVisible());
    assert.equal(await page.locator("main", { hasText: "Liste Alpha" }).count(), 0);
    await context.close();
  });

  test("membre limité au site A : parcourt ses écrans par le menu, l'adresse du site B est refusée", async () => {
    const { context, page } = await open(memA);
    await page.goto(`${srv.base}${SP}/${A}/tableau-de-bord`);
    assert.ok(await banner(page, "Site Alpha"));
    const reachable = [];
    for (const m of ["listes", "tests-ab", "outils"]) { const l = page.locator(`.mk-cms-nav a[href="${SP}/${A}/${m}"]`); if (await l.count()) reachable.push(m); }
    assert.ok(reachable.length >= 1, "au moins un écran partagé est proposé à l'éditeur");
    for (const m of reachable) { await go(page, m === "outils" ? "Outils" : "Marketing du site", `${SP}/${A}/${m}`); assert.ok(await banner(page, "Site Alpha"), m); }
    const r = await page.goto(`${srv.base}${SP}/${B}/listes`);
    assert.equal(r.status(), 403);
    assert.equal(await page.locator("body", { hasText: "Liste Beta" }).count(), 0);
    await context.close();
  });

  test("site principal : son espace garde le menu complet et mène aux écrans historiques, sans cadre de site", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}/marketing/site-web/principal/tableau-de-bord`);
    assert.ok(await banner(page, "Site principal"));
    for (const label of ["Articles", "Médias", "Apparence", "Comptes", "SEO", "Redirections", "Outils", "Paramètres", "Marketing du site"]) assert.ok(await page.locator(".mk-cms-nav", { hasText: label }).count(), `menu principal : ${label}`);
    await go(page, "Marketing du site", "/marketing/listes");
    assert.equal(await page.locator(".mk-site-banner").count(), 0);
    assert.ok(await page.locator("main", { hasText: "Liste Principale" }).first().isVisible());
    await shot(page, "p1a-principal-espace");
    await context.close();
  });

  test("téléphone 375 px : le menu du site s'ouvre, les écrans partagés gardent le cadre", async () => {
    const { context, page } = await open(boss, { width: 375, height: 800 });
    await page.goto(`${srv.base}${SP}/${A}/listes`);
    assert.ok(await banner(page, "Site Alpha"), "bandeau visible sur téléphone");
    await page.locator("[data-mk-sidebar-toggle]").first().click();
    await page.waitForTimeout(400);
    assert.ok(await page.locator(".mk-cms-nav a", { hasText: "Listes" }).first().isVisible(), "le menu du site s'ouvre et montre Listes");
    await shot(page, "p1a-listes-mobile");
    await context.close();
    const mobile = [];
    for (const m of ["tableau-de-bord", "listes", "campagnes", "tests-ab", "outils"]) {
      const c = await open(boss, { width: 375, height: 800 });
      await c.page.goto(`${srv.base}${SP}/${A}/${m}`);
      mobile.push([m, await noHScroll(c.page)]);
      await c.context.close();
    }
    const bad = mobile.filter(([, ok]) => !ok).map(([m]) => m);
    assert.deepEqual(bad, [], `défilement horizontal sur téléphone : ${bad.join(", ")}`);
  });

  test("aucune erreur de script ni de console pendant tous ces parcours", () => { assert.deepEqual(errors, []); });
});
