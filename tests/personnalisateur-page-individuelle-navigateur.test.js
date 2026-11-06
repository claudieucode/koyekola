// Personnaliser → Types de publication → Page individuelle dans un VRAI Chrome (Playwright, ignoré sans) : liste groupée, onglets Général / Design, vignettes de mise en page,
// boutons à choix, largeur personnalisée, marges à quatre côtés (liaison, appareils), aperçu en direct de la vraie page, publication, rendu public, aucun débordement horizontal.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("Page individuelle (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, pageA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const settingsOf = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");
  const open = async (width = 1440) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(30000); context.setDefaultNavigationTimeout(120000); // machine chargée : premier chargement lent
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    return page;
  };
  const frameHtml = (page) => page.evaluate(() => { const d = document.getElementById("kwc-iframe").contentDocument; return d ? d.documentElement.innerHTML : ""; });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const org = one("SELECT id FROM mk_organizations").id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(org).lastInsertRowid);
    pageA = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil', 'accueil-alpha', 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(org, JSON.stringify([{ type: "text", markdown: "Bonjour" }]), A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageA, A);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("rubrique groupée, onglets, vignettes, boutons à choix, marges liées ; l'aperçu de la vraie page suit ; la publication est servie", async () => {
    const page = await open();
    await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${A}`);
    assert.equal(await page.locator(".kwc-group-title", { hasText: "Types de publication" }).count(), 1, "groupe « Types de publication »");
    await page.locator('[data-panel="type-page"]').click();
    assert.equal(await page.locator(".kwc-tab").count(), 2);
    assert.equal(await page.locator(".kwc-tab.is-on").innerText(), "GÉNÉRAL");
    assert.equal(await page.locator(".kwc-thumbs .kwc-thumb-btn").count() >= 9, true, "vignettes : 5 de conteneur + 4 de colonne");
    // Vignette « Étroit » : l'aperçu reçoit la vraie largeur
    await page.locator('.kwc-thumb-btn[title="Étroit (lecture)"]').click();
    await page.waitForFunction(() => document.getElementById("kwc-iframe").contentDocument.documentElement.innerHTML.includes("min(640px,100%)"), null, { timeout: 30000 });
    assert.equal(await page.locator('.kwc-thumb-btn[title="Étroit (lecture)"]').getAttribute("aria-checked"), "true");
    // Style « Encadré - Tout » : cadre réel dans la page
    await page.locator('[data-ctl="settings.pageSingle.container.style"] .kwc-seg-btn', { hasText: "Encadré - Tout" }).click();
    await page.waitForFunction(() => document.getElementById("kwc-iframe").contentDocument.documentElement.innerHTML.includes("var(--kw-radius-card"), null, { timeout: 30000 });
    // Largeur personnalisée : champs masqués tant que « Par défaut », visibles ensuite
    assert.equal(await page.locator('[data-ctl="settings.pageSingle.content.width"]').isVisible(), false);
    await page.locator('[data-ctl="settings.pageSingle.content.widthMode"] .kwc-seg-btn', { hasText: "Personnalisé" }).click();
    await page.locator('[data-ctl="settings.pageSingle.content.width"] input.kwc-num').fill("900");
    await page.waitForFunction(() => document.getElementById("kwc-iframe").contentDocument.documentElement.innerHTML.includes("min(900px,100%)"), null, { timeout: 30000 });
    // Design : marge interne, quatre côtés liés
    await page.locator('.kwc-tab[data-tab="design"]').click();
    const quad = page.locator('[data-spacing="padding"] .kwc-quad-in');
    assert.equal(await quad.count(), 4);
    await quad.first().fill("24");
    for (let i = 0; i < 4; i += 1) assert.equal(await quad.nth(i).inputValue(), "24", "les quatre côtés sont liés");
    await page.waitForFunction(() => document.getElementById("kwc-iframe").contentDocument.documentElement.innerHTML.includes("padding-left:24px"), null, { timeout: 30000 });
    // Déliaison : la valeur d'un seul côté
    await page.locator('[data-spacing="padding"] .kwc-quad-link').click();
    await quad.nth(1).fill("5");
    assert.equal(await quad.nth(0).inputValue(), "24"); assert.equal(await quad.nth(1).inputValue(), "5");
    // Valeurs par appareil : l'appareil Mobile affiche des champs indépendants (vides)
    await page.locator('[data-device="mobile"]').click();
    await page.waitForFunction(() => document.querySelector('[data-spacing="padding"] .kwc-quad-in') && document.querySelector('[data-spacing="padding"] .kwc-quad-in').value === "");
    await page.locator('[data-device="desktop"]').click();
    assert.equal(await page.locator('[data-spacing="padding"] .kwc-quad-in').first().inputValue(), "24", "les réglages ordinateur sont intacts");
    // Rien n'est publié avant « Publier »
    assert.equal(settingsOf(A).pageSingle, undefined);
    await page.click("#kwc-publish");
    await page.getByRole("button", { name: /^Publier/ }).last().click().catch(() => {});
    await page.waitForFunction(() => /Publié/.test(document.getElementById("kwc-status-text").textContent), null, { timeout: 30000 });
    const saved = settingsOf(A).pageSingle;
    assert.equal(saved.container.layout, "narrow"); assert.equal(saved.container.style, "boxed-all"); assert.equal(saved.content.width, 900);
    assert.equal(saved.padding.desktop.top, 24); assert.equal(saved.padding.desktop.right, 5);
    const pub = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text;
    assert.match(pub, /min\(900px,100%\)/); assert.match(pub, /padding-right:5px/);
    assert.deepEqual(errors, []);
  });

  test("aucun débordement horizontal du panneau ni de la page publiée aux largeurs 1440, 820 et 390", async () => {
    for (const w of [1440, 820, 390]) {
      const page = await open(w);
      await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${A}`);
      await page.locator('[data-panel="type-page"]').click();
      await page.locator('.kwc-tab[data-tab="design"]').click();
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 1, `panneau : défilement horizontal de ${over}px à ${w}px`);
      const pub = await open(w);
      await pub.goto(`${srv.base}/marketing/pages/${pageA}/apercu`);
      const overPub = await pub.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overPub <= 1, `page publiée : défilement horizontal de ${overPub}px à ${w}px`);
    }
    assert.deepEqual(errors, []);
  });
});
