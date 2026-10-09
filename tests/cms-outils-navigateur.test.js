// KOLAKISA CMS — palier 13 : les outils en vrai Chrome — analyse de santé (progression réelle), export, import (analyse → confirmation → rapport),
// maintenance, caches, clavier et lecteurs d'écran, responsive.
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

describe("outils du CMS (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, tmp, siteId;
  const O = "/marketing/site-web/outils";
  const open = async (width = 1400, height = 900) => {
    const context = await browser.newContext({ viewport: { width, height }, acceptDownloads: true });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kw-outils-"));
    siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site navigateur" })).location).match(/sites\/(\d+)/)[1]);
    for (const name of ["Page un", "Page deux"]) {
      const id = Number(String((await boss.post("/marketing/pages", { name, site_id: String(siteId) })).location).match(/pages\/(\d+)/)[1]);
      const r = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id);
      await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: r.revision, content: { sections: [{ type: "text", markdown: `Contenu de ${name}` }], title: name, description: "" } } });
      await boss.post(`/marketing/pages/${id}/publier.json`, {});
    }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("santé : « Analyser maintenant » lance une vraie analyse, la progression avance, le rapport apparaît avec statuts, impact et recommandations", async () => {
    const page = await open();
    await page.goto(`${srv.base}${O}`);
    await page.click('button:has-text("Analyser maintenant")');
    await page.waitForSelector(".mk-tl-checks", { timeout: 90000 });
    assert.match(await page.locator("main").innerText(), /Résultat :/);
    const checks = await page.locator(".mk-tl-check").count();
    assert.ok(checks >= 20, `${checks} contrôles réels affichés`);
    assert.ok(await page.locator(".mk-tl-check .mk-status").first().isVisible());
    assert.equal(db.prepare("SELECT status FROM cms_tool_runs WHERE kind = 'health' ORDER BY id DESC").get().status, "done");
    await page.context().close();
  });

  test("export : cases par type, lancement, téléchargement d'un vrai fichier JSON sans secret", async () => {
    const page = await open();
    await page.goto(`${srv.base}${O}/exporter?site=${siteId}`);
    await page.uncheck("#tl-t-articles"); await page.uncheck("#tl-t-comments");
    await page.click('button:has-text("Lancer l\'export")');
    await page.waitForSelector('a:has-text("Télécharger le fichier")', { timeout: 60000 });
    const [download] = await Promise.all([page.waitForEvent("download"), page.click('a:has-text("Télécharger le fichier")')]);
    const file = path.join(tmp, "export.json");
    await download.saveAs(file);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.equal(data.format, "kolakisa-site@1");
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /\$2[aby]\$|MotDePasseProf123|prof@test\.local/);
    await page.context().close();
  });

  test("import : choisir le fichier → rapport d'analyse (rien d'écrit) → case de confirmation obligatoire → résultat → annuler l'import", async () => {
    const target = Number(String((await boss.post("/marketing/site-web/sites", { name: "Destination navigateur" })).location).match(/sites\/(\d+)/)[1]);
    const pages0 = db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n;
    const page = await open();
    await page.goto(`${srv.base}${O}/importer?site=${target}`);
    await page.setInputFiles("#tl-file", path.join(tmp, "export.json"));
    await page.uncheck("#tl-t-site");
    await page.selectOption("#tl-strategy", "duplicate");
    await page.click('button:has-text("Analyser le fichier")');
    await page.waitForSelector("text=Rapport d'analyse", { timeout: 60000 });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n, pages0, "analyse : aucune écriture");
    // la confirmation est obligatoire (case requise)
    const required = await page.locator("#tl-confirm").evaluate((el) => el.required);
    assert.equal(required, true);
    await page.check("#tl-confirm");
    await page.click('button:has-text("Lancer l\'import")');
    await page.waitForSelector("text=Résultat de l'import", { timeout: 60000 });
    assert.ok(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n > pages0);
    // annuler l'import
    await page.check("#tl-undo");
    await page.click('button:has-text("Annuler l\'import")');
    await page.waitForSelector("text=Cet import a été annulé", { timeout: 60000 });
    await page.context().close();
  });

  test("maintenance : confirmation requise, état affiché, désactivation", async () => {
    const page = await open();
    await page.goto(`${srv.base}${O}/maintenance`);
    assert.equal(await page.locator("#tl-m-ok").evaluate((el) => el.required), true);
    await page.check("#tl-m-ok");
    await page.fill("#tl-msg", "Retour très bientôt");
    await page.click('button:has-text("Activer la maintenance")');
    await page.waitForSelector("text=Maintenance activée");
    const visitor = await fetch(`${srv.base}/blog`);
    await new Promise((r) => setTimeout(r, 3200));
    const again = await fetch(`${srv.base}/blog`);
    assert.ok([200, 503].includes(visitor.status) && again.status === 503, "visiteur : 503");
    await page.click('button:has-text("Désactiver la maintenance")');
    await page.waitForSelector("text=En ligne");
    await page.context().close();
  });

  test("accessibilité : onglets au clavier, barre de progression annoncée, champs étiquetés", async () => {
    const page = await open();
    await page.goto(`${srv.base}${O}/importer`);
    // tous les champs ont un nom accessible
    const unnamed = await page.evaluate(() => [...document.querySelectorAll("main input:not([type=hidden]), main select, main textarea")].filter((el) => !(el.labels && el.labels.length) && !el.getAttribute("aria-label")).map((el) => el.name || el.id));
    assert.deepEqual(unnamed, []);
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => document.activeElement && document.activeElement !== document.body), "le focus clavier fonctionne");
    // la zone de progression d'une opération annonce son état
    const siteRun = db.prepare("SELECT id FROM cms_tool_runs WHERE kind = 'import' ORDER BY id DESC").get();
    await page.goto(`${srv.base}${O}/importer/${siteRun.id}?site=${db.prepare("SELECT site_id FROM cms_tool_runs WHERE id = ?").get(siteRun.id).site_id || ""}`);
    assert.equal(await page.locator('[role="progressbar"]').count(), 1);
    assert.ok(await page.locator('[role="progressbar"]').getAttribute("aria-valuenow") !== null);
    assert.equal(await page.locator('[data-tools-message][aria-live="polite"]').count(), 1);
    await page.context().close();
  });

  test("responsive : aucun débordement sur ordinateur, tablette et mobile (santé, export, import, diagnostic, système, maintenance, caches, contenu)", async () => {
    for (const w of [1400, 820, 390]) {
      const page = await open(w, 900);
      for (const p of ["", "/exporter", "/importer", "/diagnostic", "/systeme", "/maintenance", "/cache", "/contenu"]) {
        await page.goto(`${srv.base}${O}${p}`);
        await page.waitForSelector("main h1");
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(over <= 1, `${p || "/"} à ${w}px : défilement horizontal de ${over}px`);
      }
      await page.context().close();
    }
  });

  test("aucune erreur de script ni de console", () => { assert.deepEqual(errors, []); });
});
