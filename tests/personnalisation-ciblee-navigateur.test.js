// Personnalisation ciblée (22.11) dans un VRAI Chrome (Playwright, ignoré sans) : le sélecteur d'élément du Personnaliser annonce la portée GLOBALE de son réglage,
// compte les éléments touchés, et propose « Modifier seulement cet élément » qui ouvre l'éditeur de pages avec CET élément sélectionné (modification locale).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const SECTIONS = [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
  { id: "head00000001", type: "heading", props: { text: "Premier titre", level: 2 } },
  { id: "head00000002", type: "heading", props: { text: "Second titre", level: 2 } },
] }] }];

describe("personnalisation ciblée (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, siteId, pageId;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    siteId = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(orgId).lastInsertRowid);
    pageId = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil', 'accueil-alpha', 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(orgId, JSON.stringify(SECTIONS), siteId).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageId, siteId);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  const open = async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(15000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    return page;
  };

  test("sélection d'un titre : portée globale annoncée avec le nombre d'éléments, lien local vers l'éditeur, élément sélectionné à l'arrivée", async () => {
    const page = await open();
    await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${siteId}`);
    await page.waitForFunction(() => { const d = document.getElementById("kwc-iframe").contentDocument; return d && d.readyState === "complete" && d.body && d.body.innerText.includes("Premier titre"); });
    assert.match(await page.locator(".kwc-scope-note").innerText(), /s'appliquent à tout le site/);

    await page.click("#kwc-pick");
    await page.frameLocator("#kwc-iframe").locator("h2").first().click();
    const bar = await page.locator("#kwc-selbar").innerText();
    assert.match(bar, /Portée : modification GLOBALE/);
    assert.match(bar, /tous les titres de niveau 2 du site « Alpha »/);
    assert.match(bar, /\(2 sur cette page\)/);
    const href = await page.locator(".kwc-scope-link").getAttribute("href");
    assert.equal(href, `/marketing/pages/${pageId}/editeur#element=head00000001`);

    // Le lien ouvre l'éditeur avec CET élément (et lui seul) sélectionné
    await page.goto(`${srv.base}${href}`);
    await page.waitForFunction(() => window.__pb && window.__pb.selection().join() === "head00000001");
    assert.deepEqual(await page.evaluate(() => window.__pb.selection()), ["head00000001"]);

    // Un identifiant inconnu ne sélectionne rien et ne casse rien
    const fresh = await open();
    await fresh.goto(`${srv.base}/marketing/pages/${pageId}/editeur#element=inconnu00000`);
    await fresh.waitForFunction(() => window.__pb);
    assert.deepEqual(await fresh.evaluate(() => window.__pb.selection()), []);
    assert.deepEqual(errors, []);
  });

  test("la publication rappelle la portée : toutes les pages du site, aucun autre site", async () => {
    const page = await open();
    await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${siteId}`);
    await page.waitForFunction(() => { const d = document.getElementById("kwc-iframe").contentDocument; return d && d.body && d.body.innerText.includes("Premier titre"); });
    await page.locator('[data-panel="couleurs"]').click();
    const hex = page.locator('input.kwc-hex').first();
    await hex.fill("#aa3300"); await hex.blur();
    await page.locator("#kwc-publish").click();
    assert.match(await page.locator("#kwc-modal").innerText(), /toutes les pages du site public « Alpha » \(modification globale, aucun autre site n'est touché\)/);
  });
});
