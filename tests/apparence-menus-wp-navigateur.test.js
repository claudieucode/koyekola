// KOLAKISA CMS — MENUS-03 dans un VRAI Chrome : le parcours WordPress complet. Créer le premier menu (nom, ajout automatique, emplacement), ajouter une page et
// un lien, créer un sous-menu, enregistrer, recharger (persistance), publier une nouvelle page (ajout automatique visible), téléphone.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("menus façon WordPress (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, A, pageId, errors, menuId;
  const APP = () => `${srv.base}/marketing/site-web/apparence/menus?site=${A}`;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(org).lastInsertRowid);
    pageId = Number((await boss.post("/marketing/pages", { name: "Services" })).location.match(/(\d+)$/)[1]);
    db.prepare("UPDATE mk_landing_pages SET kind = 'page', site_id = ?, sections = ?, draft = NULL, status = 'published', published_at = datetime('now') WHERE id = ?").run(A, JSON.stringify([{ type: "text", markdown: "Services" }]), pageId);
    browser = await chromium.launch({ executablePath: CHROME });
  });
  after(async () => { await browser.close(); db.close(); await srv.stop(); });
  const open = async (width = 1280) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    return page;
  };

  test("créer le premier menu, ajouter une page et un lien, sous-menu, enregistrer, recharger", async () => {
    const page = await open();
    await page.goto(APP());
    await page.getByText("Créez votre premier menu ci-dessous").waitFor();
    await page.getByLabel("Nom du menu").fill("Menu principal");
    await page.getByLabel("Ajouter automatiquement les pages de premier niveau à ce menu").check();
    await page.getByLabel("En-tête", { exact: false }).first().check();
    await Promise.all([page.waitForURL(/menu=\d+/), page.getByRole("button", { name: "Créer le menu" }).click()]);
    menuId = Number(/menu=(\d+)/.exec(page.url())[1]);
    await page.locator("[data-nm-layout]:not([hidden])").waitFor();
    assert.equal(await page.locator("[data-nm-autoadd]").isChecked(), true, "réglage conservé après création");
    assert.equal(await page.locator("#nm-loc-header").isChecked(), true, "emplacement En-tête affecté");
    // ajouter la page « Services » (section Pages, sélection, « Ajouter au menu »)
    assert.equal(await page.locator("details.mk-nm-section[data-type=page]").evaluate((d) => d.open), true, "Pages est ouverte par défaut (comme WordPress)");
    await page.locator("details.mk-nm-section[data-type=page] input[type=checkbox]").first().waitFor({ state: "attached" });
    await page.locator("details.mk-nm-section[data-type=page] input[type=checkbox]").first().check();
    await page.locator("details.mk-nm-section[data-type=page]").getByRole("button", { name: "Ajouter au menu" }).click();
    // lien personnalisé
    await page.locator("details.mk-nm-section summary", { hasText: "Liens personnalisés" }).click();
    await page.locator("#nm-cu-label").fill("Contact"); await page.locator("#nm-cu-url").fill("/contact");
    await page.locator("details.mk-nm-section", { hasText: "Texte du lien" }).getByRole("button", { name: "Ajouter au menu" }).click();
    assert.equal(await page.locator("[data-nm-tree] .mk-nm-item").count(), 2);
    // sous-menu : « Contact » devient enfant de « Services » (bouton →)
    await page.locator("[data-nm-tree] .mk-nm-item").nth(1).getByRole("button", { name: /Imbriquer|sous-menu|→/i }).first().click();
    assert.equal(await page.locator("[data-nm-tree] .mk-nm-item .mk-nm-item").count(), 1, "un sous-élément");
    await page.locator("[data-nm-save]").click();
    await page.getByText(/Menu enregistré/).first().waitFor();
    // persistance : rechargement
    await page.reload(); await page.locator("[data-nm-layout]:not([hidden])").waitFor();
    assert.equal(await page.locator("[data-nm-tree] .mk-nm-item").count(), 2);
    assert.equal(await page.locator("[data-nm-tree] .mk-nm-item .mk-nm-item").count(), 1, "la hiérarchie est restituée");
    const rows = db.prepare("SELECT type, parent_id, label FROM nav_items WHERE menu_id = ? ORDER BY id").all(menuId);
    assert.equal(rows.length, 2); assert.ok(rows.some((r) => r.parent_id !== null), "le parent est en base");
  });

  test("ajout automatique : une page publiée ensuite apparaît dans le menu à la réouverture", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Tarifs" })).location.match(/(\d+)$/)[1]);
    db.prepare("UPDATE mk_landing_pages SET kind = 'page', site_id = ?, sections = ?, draft = NULL WHERE id = ?").run(A, JSON.stringify([{ type: "text", markdown: "Tarifs" }]), id);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const page = await open(); await page.goto(APP()); await page.locator("[data-nm-layout]:not([hidden])").waitFor();
    assert.equal(await page.locator("[data-nm-tree] > .mk-nm-item").count(), 2, "Services (avec son sous-menu) + Tarifs");
    assert.match(await page.locator("[data-nm-tree]").innerText(), /Tarifs/);
  });

  test("sélecteur + « créer un nouveau menu » ; confirmation si modifications non enregistrées ; téléphone sans défilement horizontal ; aucune erreur JavaScript", async () => {
    const page = await open(390); await page.goto(APP()); await page.locator("[data-nm-layout]:not([hidden])").waitFor();
    assert.ok(await page.locator("[data-nm-pick]").isVisible()); assert.ok(await page.locator("[data-nm]").getByText("créer un nouveau menu").isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "pas de défilement horizontal");
    await page.locator("#nm-name").fill("Menu principal modifié");
    let asked = false; page.once("dialog", (d) => { asked = true; d.dismiss(); });
    await page.getByText("créer un nouveau menu").click();
    assert.ok(asked, "confirmation de sortie"); assert.match(page.url(), /apparence\/menus\?site=/); assert.doesNotMatch(page.url(), /nouveau/);
    const page2 = await open(); await page2.goto(`${APP()}&nouveau=1`);
    await page2.getByLabel("Nom du menu").fill("Pied de page");
    await Promise.all([page2.waitForURL(/menu=\d+/), page2.getByRole("button", { name: "Créer le menu" }).click()]);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM nav_menus WHERE site_id = ?").get(A).n, 2);
    assert.deepEqual(errors, []);
  });
});
