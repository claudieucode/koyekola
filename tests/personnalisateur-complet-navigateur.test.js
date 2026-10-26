// KOLAKISA CMS — Personnaliser (TITAN XVIII, suite) dans un VRAI Chrome : sélection directe, palette, mode sombre, planification, partage, MESURES (Playwright, ignoré sans) : palettes, couleurs, contrastes, typographie, formes, boutons, guide de style en direct,
// aperçu de la vraie page, appareils, brouillon / publication / annulation / retour arrière, erreurs, protection à la fermeture, clavier, téléphone, lecture seule, isolation.
const { test, describe, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("personnaliser complet (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, orgId, pageA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const SHOTS = process.env.SHOTS || "/tmp";
  const metrics = {};
  const open = async (width = 1440) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(10000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const menu = async (page, act) => { await page.click("#kwc-more"); await page.locator(`[data-act="${act}"]`).click(); };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(orgId).lastInsertRowid);
    pageA = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil', 'accueil-alpha', 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(orgId, JSON.stringify([{ type: "text", markdown: "# Bonjour\n\nUn paragraphe de texte." }]), A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageA, A);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); console.log("MESURES " + JSON.stringify(metrics)); db.close(); await srv.stop(); });

  test("ouverture, aperçu, sélection directe d'un élément, palette, mode sombre : mesures et comportement", async () => {
    const page = await open();
    let requests = 0; page.on("request", () => { requests++; });
    await page.addInitScript(() => { window.__long = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(e.duration))).observe({ entryTypes: ["longtask"] }); } catch (e) { /* non pris en charge */ } });
    const t0 = Date.now();
    await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${A}`);
    await page.waitForFunction(() => { const d = document.getElementById("kwc-iframe").contentDocument; return d && d.readyState === "complete" && d.body && d.body.innerText.includes("Bonjour"); });
    metrics.ouvertureMs = Date.now() - t0; metrics.requetesOuverture = requests;

    // Sélection directe : clic sur un paragraphe → réglage « Taille du texte courant » ouvert et sélectionné
    await page.click("#kwc-pick");
    assert.equal(await page.getAttribute("#kwc-pick", "aria-pressed"), "true");
    await page.frameLocator("#kwc-iframe").locator("p").first().click();
    assert.match(await page.locator(".kwc-panel-head h2").innerText(), /Typographie/);
    await page.waitForFunction(() => document.activeElement && document.activeElement.id === "kwc-f-tokens-type-body-size");
    assert.match(await page.locator("#kwc-selbar").innerText(), /Texte/);
    await page.click("#kwc-pick"); // sortie du mode : un clic redevient un clic
    assert.equal(await page.getAttribute("#kwc-pick", "aria-pressed"), "false");

    // Délai modification → aperçu
    await page.locator('.kwc-panel-head button').first().click();
    await page.locator('[data-panel="couleurs"]').click();
    const hex = page.locator('[data-ctl="tokens.colors.background"] input[type=text]');
    const t1 = Date.now();
    await hex.fill("#abcdef");
    await page.waitForFunction(() => { const d = document.getElementById("kwc-iframe").contentDocument; return d && d.body && d.body.getAttribute("style").toLowerCase().includes("#abcdef"); });
    metrics.delaiApercuMs = Date.now() - t1;

    // 60 changements successifs : mémoire et tâches longues
    const heap0 = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
    for (let i = 0; i < 60; i++) await hex.fill("#" + (0x100000 + i * 997).toString(16).padStart(6, "0"));
    await page.waitForTimeout(800);
    const heap1 = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
    metrics.memoireAvantMo = Math.round(heap0 / 1e5) / 10; metrics.memoireApresMo = Math.round(heap1 / 1e5) / 10;
    metrics.tachesLongues = await page.evaluate(() => ({ n: window.__long.length, maxMs: Math.round(Math.max(0, ...window.__long)) }));

    // Palette nommée : ajout d'une couleur, puis pastilles dans les sélecteurs de couleur
    await page.locator('.kwc-panel-head button').first().click();
    await page.locator('[data-panel="palette"]').click();
    await page.getByRole("button", { name: "Ajouter une couleur" }).click();
    await page.locator(".kwc-palname").first().fill("Corail");
    await page.locator('.kwc-panel-head button').first().click();
    await page.locator('[data-panel="couleurs"]').click();
    assert.ok(await page.locator(".kwc-chip").count() >= 1, "pastille de la palette dans les couleurs");
    await page.screenshot({ path: `${SHOTS}/perso2-palette-1440.png` });

    // Mode sombre en aperçu
    await menu(page, "preview-dark");
    assert.equal(await page.evaluate(() => document.getElementById("kwc-iframe").contentDocument.documentElement.hasAttribute("data-kw-force-dark")), true);
    assert.deepEqual(errors, []);
  });

  test("enregistrement, planification et lien partageable depuis l'interface ; mesure d'enregistrement et de publication", async () => {
    const page = await open();
    await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${A}`);
    await page.locator('[data-panel="couleurs"]').click();
    await page.locator('[data-ctl="tokens.colors.primary"] input[type=text]').fill("#7733aa");
    const t0 = Date.now();
    await page.click("#kwc-save");
    await page.waitForFunction(() => /Brouillon enregistré/.test(document.getElementById("kwc-status-text").textContent));
    metrics.enregistrementMs = Date.now() - t0;
    await menu(page, "plan");
    await page.locator("#kwc-sched").waitFor();
    await page.screenshot({ path: `${SHOTS}/perso2-planifier-1440.png` });
    await page.getByRole("button", { name: "Planifier", exact: true }).click();
    await page.locator("#kwc-schedban").waitFor();
    assert.match(await page.locator("#kwc-schedban").innerText(), /Publication planifiée le/);
    assert.ok(one("SELECT publish_at p FROM cms_customizer_drafts WHERE site_id = ?", A).p);
    await page.getByRole("button", { name: "Annuler la planification" }).click();
    await page.waitForFunction(() => !document.getElementById("kwc-schedban"));
    assert.equal(one("SELECT publish_at p FROM cms_customizer_drafts WHERE site_id = ?", A).p, null);
    await menu(page, "share");
    await page.getByRole("button", { name: "Créer le lien" }).click();
    const link = await page.locator(".kwc-sharelink").inputValue();
    assert.match(link, /\/p\/accueil-alpha\?kwshare=[a-f0-9]{48}$/);
    await page.screenshot({ path: `${SHOTS}/perso2-partage-1440.png` });
    await page.getByRole("button", { name: "Fermer" }).click();
    const t1 = Date.now();
    await page.click("#kwc-publish");
    await page.getByRole("button", { name: /^Publier/ }).last().click().catch(() => {});
    await page.waitForFunction(() => /Publié/.test(document.getElementById("kwc-status-text").textContent));
    metrics.publicationMs = Date.now() - t1;
    assert.equal(JSON.parse(one("SELECT tokens t FROM mk_sites WHERE id = ?", A).t).colors.primary, "#7733aa");
    assert.deepEqual(errors, []);
  });

  test("mobile 390 px : panneaux, palette et boutons restent utilisables, sans débordement", async () => {
    const page = await open(390);
    await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${A}`);
    for (const p of ["palette", "mode-sombre", "appareils"]) { await page.locator(`[data-panel="${p}"]`).click(); assert.ok(await page.locator("[data-ctl]").count() >= 1, p); await page.locator(".kwc-panel-head button").first().click(); }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 1);
    await page.screenshot({ path: `${SHOTS}/perso2-mobile-390.png` });
    assert.deepEqual(errors, []);
  });
});
