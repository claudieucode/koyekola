// SEO d'un site — les neuf rubriques en vrai Chrome : affichage bureau et mobile (aucun débordement horizontal, aucune erreur de console),
// interactions réelles (compteurs, aperçu, confirmations, aperçu robots, analyse avec progression), animations (prefers-reduced-motion) et stabilité de la mise en page.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const SHOTS = process.env.SEO_SHOTS || "";

describe("SEO d'un site : neuf rubriques (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, siteId, base;
  const SP = "/marketing/site-web/sites";
  const open = async (width = 1400, height = 900, extra = {}) => {
    const context = await browser.newContext({ viewport: { width, height }, ...extra });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }); } };
  const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    siteId = Number(String((await boss.post(SP, { name: "Site Chrome" })).location).match(/sites\/(\d+)/)[1]);
    base = `${srv.base}${SP}/${siteId}`;
    const ins = db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, description, status, site_id, published_at, indexable) VALUES (?, ?, ?, ?, ?, 'published', ?, datetime('now'), ?)");
    const home = Number(ins.run(orgId, "Accueil", "accueil", "Accueil du site Chrome", "Bienvenue sur le site Chrome, une description assez longue pour être utile aux visiteurs.", siteId, 1).lastInsertRowid);
    ins.run(orgId, "Contact", "contact", "Contact", "", siteId, 1);
    ins.run(orgId, "Interne", "interne", "Page interne non indexée", "Page de travail.", siteId, 0);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, siteId);
    db.prepare("INSERT INTO seo_404 (path, site_id, hits_human, hits_bot, last_referrer) VALUES ('/vieille-page-chrome', ?, 4, 2, 'https://exemple.org/lien')").run(siteId);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  const SCREENS = [["", "SEO du site"], ["/analyse", "Analyse SEO"], ["/meta", "Meta"], ["/indexation", "Indexation"], ["/sitemap", "Sitemap"], ["/schema", "Schema"], ["/open-graph", "Open Graph"], ["/robots", "Robots"], ["/404", "Erreurs 404"]];

  test("bureau : les neuf rubriques s'affichent, l'onglet actif est identifiable, sans erreur de console ni débordement", async () => {
    const page = await open(1400, 900);
    for (const [p, title] of SCREENS) {
      await page.goto(`${base}/seo${p}`, { waitUntil: "load" });
      assert.match(await page.locator("h1").first().innerText(), new RegExp(title.split(" ")[0], "i"), p);
      assert.equal(await page.locator(".mk-seo-tabs .mk-tab").count(), 9, `neuf onglets (${p})`);
      assert.equal(await page.locator('.mk-seo-tabs .mk-tab[aria-current="page"]').count(), 1, `un seul onglet actif (${p})`);
      assert.ok((await overflow(page)) <= 1, `pas de défilement horizontal (${p || "vue générale"})`);
      await shot(page, `bureau${p.replace("/", "-") || "-vue-generale"}`);
    }
    assert.deepEqual(errors, [], errors.join("\n"));
    await page.context().close();
  });

  test("mobile (375 px) : les neuf rubriques restent lisibles, sans défilement horizontal de la page", async () => {
    const page = await open(375, 740);
    for (const [p] of SCREENS) {
      await page.goto(`${base}/seo${p}`, { waitUntil: "load" });
      assert.ok((await overflow(page)) <= 1, `pas de débordement mobile (${p || "vue générale"}) : ${await overflow(page)} px`);
      await shot(page, `mobile${p.replace("/", "-") || "-vue-generale"}`);
    }
    assert.deepEqual(errors, [], errors.join("\n"));
    await page.context().close();
  });

  test("meta : compteur indicatif, aperçu de l'extrait recalculé, mention « non enregistré », puis enregistrement relu en base", async () => {
    const page = await open();
    await page.goto(`${base}/seo/meta`, { waitUntil: "load" });
    const field = page.locator("#seo-default_description");
    await field.fill("Une description par défaut pour le site Chrome.");
    assert.match(await page.locator('[data-count-for="seo-default_description"]').innerText(), /\d+ \/ 160 caractères \(repère indicatif\)/);
    assert.match(await page.locator("[data-serp-desc]").innerText(), /description par défaut pour le site Chrome/);
    assert.equal(await page.locator("[data-dirty-note]").first().isVisible(), true, "modifications non enregistrées signalées");
    await page.locator("#seo-site_name").fill("Chrome Boutique");
    assert.match(await page.locator("[data-serp-title]").innerText(), /Chrome Boutique/);
    await page.click('form[action$="/seo/meta"] button[type="submit"]');
    await page.waitForURL(/\/seo\/meta/);
    const row = db.prepare("SELECT value FROM seo_site_settings WHERE site_id = ? AND key = 'default_description'").get(siteId);
    assert.equal(JSON.parse(row.value), "Une description par défaut pour le site Chrome.", "relu côté serveur");
    assert.match(await page.locator("body").innerText(), /Réglages enregistrés pour ce site/);
    await page.context().close();
  });

  test("indexation : la confirmation n'apparaît que pour fermer le site ; enregistrement relu en base", async () => {
    const page = await open();
    await page.goto(`${base}/seo/indexation`, { waitUntil: "load" });
    assert.equal(await page.locator("#ix-confirm").isVisible(), false);
    await page.check("#ix-noindex");
    assert.equal(await page.locator("#ix-confirm").isVisible(), true, "confirmation demandée");
    await shot(page, "indexation-confirmation");
    await page.uncheck("#ix-noindex");
    assert.equal(await page.locator("#ix-confirm").isVisible(), false);
    await page.check("#ix-noindex"); await page.check('#ix-confirm input[name="confirm"]');
    await page.click('form[data-confirm-field] button[type="submit"]');
    await page.waitForURL(/\/seo\/indexation/);
    assert.equal(JSON.parse(db.prepare("SELECT settings FROM mk_sites WHERE id = ?").get(siteId).settings).extras.noindex, true);
    assert.match(await page.locator("body").innerText(), /Tout le site est en noindex|le site entier est réglé en noindex/);
    // remise en état
    await page.uncheck("#ix-noindex"); await page.click('form[data-confirm-field] button[type="submit"]'); await page.waitForURL(/\/seo\/indexation/);
    assert.equal(JSON.parse(db.prepare("SELECT settings FROM mk_sites WHERE id = ?").get(siteId).settings).extras.noindex, false);
    await page.context().close();
  });

  test("robots : l'aperçu valide avant publication et exige une confirmation pour un blocage large", async () => {
    const page = await open();
    await page.goto(`${base}/seo/robots`, { waitUntil: "load" });
    await page.fill("#rb-text", "User-agent: *\nDisallow: /");
    assert.equal(await page.locator("[data-robots-confirm]").isVisible(), false);
    await page.click("[data-robots-preview]");
    await page.waitForSelector("[data-robots-live] .mk-seo-code", { timeout: 8000 });
    assert.match(await page.locator("[data-robots-live]").innerText(), /Disallow: \//);
    assert.equal(await page.locator("[data-robots-confirm]").isVisible(), true, "confirmation exigée");
    await shot(page, "robots-apercu");
    await page.fill("#rb-text", "Nimporte quoi");
    await page.click("[data-robots-preview]");
    await page.waitForFunction(() => /n'est pas une règle|invalide/i.test(document.querySelector("[data-robots-live]").textContent), null, { timeout: 8000 });
    await page.context().close();
  });

  test("analyse : lancement, progression réelle suivie, puis résultats du site affichés", async () => {
    const page = await open();
    await page.goto(`${base}/seo/analyse`, { waitUntil: "load" });
    assert.match(await page.locator("body").innerText(), /Aucune analyse pour ce site/);
    await page.click('form[action$="/seo/analyse"] button[type="submit"]');
    await page.waitForURL(/\/seo\/analyse\?analyse=\d+/);
    await page.waitForFunction(() => /Résultats du/.test(document.body.textContent), null, { timeout: 90000 });
    assert.match(await page.locator("body").innerText(), /Pages lues/);
    assert.doesNotMatch(await page.locator("body").innerText(), /seul-b/);
    await shot(page, "analyse-resultats");
    await page.context().close();
  });

  test("404 : actions visibles, formulaire de redirection replié, état de traitement", async () => {
    const page = await open();
    await page.goto(`${base}/seo/404`, { waitUntil: "load" });
    assert.match(await page.locator("#seo-404-table").innerText(), /vieille-page-chrome/);
    await page.locator("#seo-404-table summary").first().click();
    assert.equal(await page.locator('#seo-404-table input[name="target"]').first().isVisible(), true);
    await shot(page, "404-redirection");
    await page.click('#seo-404-table button[value="traitee"]');
    await page.waitForURL(/\/seo\/404/);
    assert.ok(db.prepare("SELECT handled_at FROM seo_404 WHERE site_id = ? AND path = '/vieille-page-chrome'").get(siteId).handled_at);
    await page.context().close();
  });

  test("animations : désactivées avec prefers-reduced-motion, et aucun décalage de mise en page au chargement", async () => {
    const reduced = await open(1400, 900, { reducedMotion: "reduce" });
    await reduced.goto(`${base}/seo`, { waitUntil: "load" });
    assert.equal(await reduced.evaluate(() => getComputedStyle(document.querySelector(".mk-seo-appear")).animationName), "none", "aucune animation en mouvement réduit");
    await reduced.context().close();
    const page = await open(1400, 900);
    await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
    for (const [p] of SCREENS) {
      await page.goto(`${base}/seo${p}`, { waitUntil: "load" }); await page.waitForTimeout(600);
      const cls = await page.evaluate(() => window.__cls || 0);
      assert.ok(cls < 0.1, `décalage de mise en page ${cls} < 0,1 (${p || "vue générale"})`);
    }
    assert.deepEqual(errors, [], errors.join("\n"));
    await page.context().close();
  });
});
