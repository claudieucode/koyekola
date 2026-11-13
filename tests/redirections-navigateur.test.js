// Redirections (navigateur) : les 8 écrans s'affichent sans erreur de script ni débordement horizontal (bureau et mobile) ; le fichier choisi remplit la zone d'import ; « Rediriger… » ouvre sa fenêtre.
// VRAI Chrome. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Redirections : écrans dans Chrome", { skip: SKIP }, () => {
  let env, context;
  const MAIN = "/marketing/site-web/redirections";
  before(async () => {
    env = await setup({ siteName: "Site redirections" });
    context = await env.browser.newContext({ viewport: { width: 1400, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    context.setDefaultTimeout(20000);
    env.db.prepare("INSERT OR IGNORE INTO seo_404 (path, hits_human, hits_bot) VALUES ('/page-perdue', 4, 0)").run();
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  test("chaque écran : aucune erreur de script, onglets visibles, pas de défilement horizontal (bureau puis mobile)", async () => {
    const errors = [];
    for (const [w, h] of [[1400, 900], [375, 800]]) {
      const page = await context.newPage(); await page.setViewportSize({ width: w, height: h });
      page.on("pageerror", (e) => errors.push(`${w}px : ${e.message}`));
      for (const s of ["tableau-de-bord", "groupes", "erreurs-404", "journaux", "adresses", "import-export", "outils", "parametres", ""]) {
        await page.goto(`${env.srv.base}${MAIN}${s ? `/${s}` : ""}`); await page.waitForSelector(".rd-tabs");
        assert.equal(await page.locator(".rd-tabs a").count(), 9, `${w}px ${s} : 9 onglets`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(over <= 1, `${w}px ${s} : débordement horizontal de ${over}px`);
      }
      await page.close();
    }
    assert.deepEqual(errors, []);
  });
  test("import : choisir un fichier remplit la zone de texte ; « Rediriger… » ouvre la fenêtre d'une adresse introuvable", async () => {
    const page = await context.newPage();
    await page.goto(`${env.srv.base}${MAIN}/import-export`);
    await page.setInputFiles("#rd-imp-file", { name: "r.csv", mimeType: "text/csv", buffer: Buffer.from("/a-lu,/b-lu,301\n") });
    await page.waitForFunction(() => document.querySelector("#rd-imp-text").value.includes("/a-lu"));
    await page.getByRole("button", { name: "Analyser et afficher l'aperçu" }).click();
    await page.waitForSelector("text=Aperçu de l'import"); assert.ok(await page.getByText("Prête").first().isVisible());
    await page.goto(`${env.srv.base}${MAIN}/erreurs-404?etat=all`);
    await page.getByRole("button", { name: "Rediriger…" }).first().click();
    assert.ok(await page.locator("#rd-redirect").evaluate((d) => d.open), "fenêtre ouverte");
    assert.match(await page.locator("#rd-redirect-show").innerText(), /\/page-perdue/);
    await page.close();
  });
  test("liste : la fenêtre d'ajout propose tous les types et les options avancées, et enregistre une règle « contient » avec priorité", async () => {
    const page = await context.newPage();
    await page.goto(`${env.srv.base}${MAIN}?nouvelle=1`);
    await page.waitForSelector("#ur-form[open]");
    assert.equal(await page.locator("#ur-status option").count(), 7); assert.equal(await page.locator("#ur-match option").count(), 5);
    await page.fill("#ur-source", "/ancien-dossier/"); await page.fill("#ur-target", "/nouveau"); await page.selectOption("#ur-match", "contains");
    await page.locator(".rd-adv > summary").click(); await page.fill("#ur-priority", "42");
    await page.locator("#ur-form button[type=submit]").click(); await page.waitForLoadState("load");
    const row = env.db.prepare("SELECT match_type, priority FROM seo_redirects WHERE source_path = '/ancien-dossier/'").get();
    assert.deepEqual({ ...row }, { match_type: "contains", priority: 42 });
    await page.close();
  });
});
