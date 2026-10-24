// OUTILS → ADMIN NOTES en vrai Chrome : parcours complet (créer, persister, modifier, annuler, supprimer), validation, deux sites, clair / sombre, mobile.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const SHOTS = process.env.NOTES_SHOTS || "";

describe("Admin Notes (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, siteA, siteB;
  const O = "/marketing/site-web/outils/notes";
  const open = async (width = 1300, height = 900, { dark = false } = {}) => {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: dark ? "dark" : "light" });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    if (dark) await context.addInitScript(() => { try { localStorage.setItem("kolaTheme", "dark"); } catch (e) { /* noop */ } });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    page.on("response", (r) => { if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url()}`); });
    return page;
  };
  const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }); };
  const rows = (site) => db.prepare("SELECT * FROM mk_admin_notes WHERE site_id IS ? ORDER BY id").all(site);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const mk = async (name) => Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
    siteA = await mk("Notes navigateur A"); siteB = await mk("Notes navigateur B");
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("parcours complet : créer → actualiser → modifier → annuler une suppression → supprimer ; validation ; compteur ; anti double clic", async () => {
    const page = await open();
    await page.goto(`${srv.base}${O}?site=${siteA}`);
    await page.waitForSelector("#nt-title");
    assert.match(await page.locator("main").innerText(), /Aucune note pour ce site/);
    await shot(page, "notes-vide");

    // validation : titre vide bloqué avant l'envoi (côté client) puis côté serveur
    await page.fill("#nt-body", "Contenu sans titre");
    await page.click("[data-nt-submit]");
    assert.equal(rows(siteA).length, 0);
    assert.equal(await page.locator("#nt-title").getAttribute("aria-invalid"), "true");
    await page.fill("#nt-title", "x".repeat(50));
    assert.equal(await page.locator('[data-nt-count="nt-title"]').innerText(), "50", "compteur de caractères en direct");

    // création : plusieurs paragraphes
    await page.fill("#nt-title", "Consignes de déploiement");
    await page.fill("#nt-body", "Étape 1 : vérifier la branche.\n\nÉtape 2 : lancer les tests.\n\nÉtape 3 : déployer — accents é è ç, 日本語.");
    await page.click("[data-nt-submit]");
    await page.waitForSelector("text=Note ajoutée.");
    assert.equal(rows(siteA).length, 1, "enregistrée en base");
    assert.equal(await page.locator("#nt-title").inputValue(), "", "champs vidés");
    assert.equal(await page.locator("#nt-body").inputValue(), "");
    await shot(page, "notes-une");

    // persistance après actualisation, paragraphes conservés (pre-wrap)
    await page.reload();
    const body = page.locator(".mk-nt-note .mk-nt-body").first();
    assert.match(await body.innerText(), /Étape 1[\s\S]*\n\n[\s\S]*Étape 2[\s\S]*\n\n[\s\S]*Étape 3/);
    assert.equal(await body.evaluate((e) => getComputedStyle(e).whiteSpace), "pre-wrap");

    // modification
    await page.click('a:has-text("Modifier")');
    await page.waitForSelector("#nt-e-title");
    await shot(page, "notes-edition");
    await page.fill("#nt-e-title", "Consignes de déploiement (v2)");
    await page.fill("#nt-e-body", "Nouvelle version du contenu.");
    await page.click('button:has-text("Enregistrer les modifications")');
    await page.waitForSelector("text=Note modifiée.");
    await page.reload();
    assert.match(await page.locator(".mk-nt-head h3").first().innerText(), /\(v2\)/);
    assert.match(await page.locator(".mk-nt-meta").first().innerText(), /modifiée le/);
    assert.equal(rows(siteA)[0].body, "Nouvelle version du contenu.");

    // annulation de modification : la version enregistrée n'est pas touchée
    await page.click('a:has-text("Modifier")');
    await page.fill("#nt-e-title", "BROUILLON ABANDONNÉ");
    await page.click('a:has-text("Annuler")');
    assert.equal(rows(siteA)[0].title, "Consignes de déploiement (v2)");

    // suppression : confirmation nommant la note, annulation, puis suppression
    await page.click('a:has-text("Supprimer")');
    await page.waitForSelector("#nt-del");
    assert.match(await page.locator(".mk-nt-confirm").innerText(), /Consignes de déploiement \(v2\)/);
    await shot(page, "notes-confirmation");
    await page.click('.mk-nt-confirm a:has-text("Annuler")');
    assert.equal(rows(siteA).length, 1, "annulée : la note reste");
    await page.click('a:has-text("Supprimer")');
    await page.click('button:has-text("Supprimer définitivement")');
    await page.waitForSelector("text=Note supprimée.");
    assert.equal(rows(siteA).length, 0);
    assert.match(await page.locator("main").innerText(), /Aucune note pour ce site/);
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("double clic sur « Ajouter la note » : une seule note ; isolation entre deux sites dans l'interface", async () => {
    const page = await open();
    await page.goto(`${srv.base}${O}?site=${siteA}`);
    await page.fill("#nt-title", "Double clic");
    await page.fill("#nt-body", "contenu");
    await page.locator("[data-nt-submit]").dblclick();
    await page.waitForSelector("text=Note ajoutée.");
    assert.equal(rows(siteA).length, 1);
    await page.goto(`${srv.base}${O}?site=${siteB}`);
    assert.match(await page.locator("main").innerText(), /Aucune note pour ce site/);
    assert.ok(!(await page.content()).includes("Double clic") || (await page.locator(".mk-nt-note").count()) === 0);
    await page.goto(`${srv.base}/marketing/site-web/sites/${siteB}/outils/notes`);
    assert.equal(await page.locator(".mk-nt-note").count(), 0);
    assert.ok((await page.locator('a[href$="/outils/notes"]').count()) > 0, "l'entrée « Admin Notes » est dans le menu du site");
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("note très longue repliée avec « Afficher toute la note » ; mode sombre ; téléphone sans débordement", async () => {
    const long = Array.from({ length: 80 }, (_, i) => `Ligne ${i + 1} : ${"texte ".repeat(12)}`).join("\n");
    db.prepare("INSERT INTO mk_admin_notes (organization_id, site_id, title, body, author_id) VALUES (1, ?, 'Note très longue', ?, 1)").run(siteB, long);
    const page = await open();
    await page.goto(`${srv.base}${O}?site=${siteB}`);
    const more = page.locator(".mk-nt-more");
    await more.waitFor();
    const clamped = await page.locator("[data-nt-body]").first().evaluate((e) => e.clientHeight);
    await more.click();
    const full = await page.locator("[data-nt-body]").first().evaluate((e) => e.clientHeight);
    assert.ok(full > clamped * 3, `repli ${clamped}px, complet ${full}px`);
    assert.match(await page.locator("[data-nt-body]").first().innerText(), /Ligne 80/);
    await shot(page, "notes-longue-clair");
    await page.context().close();

    const dark = await open(1300, 900, { dark: true });
    await dark.goto(`${srv.base}${O}?site=${siteB}`);
    assert.equal(await dark.locator("html").getAttribute("data-kola-theme"), "dark");
    await shot(dark, "notes-longue-sombre");
    await dark.context().close();

    const mobile = await open(390, 844);
    await mobile.goto(`${srv.base}${O}?site=${siteB}`);
    assert.ok((await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1, "pas de défilement horizontal sur mobile");
    await shot(mobile, "notes-mobile");
    await mobile.context().close();
    assert.deepEqual(errors, []);
  });
});
