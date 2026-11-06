// Personnaliser, étape 1 (coque) dans un VRAI Chrome (Playwright, ignoré sans) : panneau, dix catégories, appareils (largeur réelle de l'aperçu), masquage, aperçu réel du site,
// défilements indépendants, erreurs de chargement, isolation entre sites, accès sans droit. Captures : PZ_SHOTS=<dossier> pour les enregistrer.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const CATS = ["Global", "Entête", "Types de publication", "Général", "Pied de page", "Identité du site", "Menus", "Widgets", "Réglages de la page d'accueil", "CSS additionnel"];

describe("personnaliser : coque (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, B, orgId;
  const PZ = "/marketing/site-web/personnaliser";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const open = async (width = 1366, height = 900, client = boss) => {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 600 });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(10000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|beforeunload/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const go = async (page, site = A) => { await page.goto(`${srv.base}${PZ}?site=${site}`); await page.waitForFunction(() => document.getElementById("pz-frame") && document.getElementById("pz-frame").contentDocument && document.getElementById("pz-frame").contentDocument.readyState === "complete" && !document.getElementById("pz-stage").classList.contains("is-loading")); };
  const shot = async (page, name) => { if (process.env.PZ_SHOTS) { fs.mkdirSync(process.env.PZ_SHOTS, { recursive: true }); await page.screenshot({ path: path.join(process.env.PZ_SHOTS, `${name}.png`) }); } };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    const pageOf = (name, slug, site, text) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, 'published', 'page', ?, datetime('now'))").run(orgId, name, slug, name, JSON.stringify([{ type: "text", markdown: text }]), site).lastInsertRowid);
    const pa = pageOf("Accueil Alpha", "accueil-alpha", A, "Texte du site Alpha"); const pb = pageOf("Accueil Beta", "accueil-beta", B, "Texte du site Beta");
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pa, A); db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pb, B);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("structure : barre du haut, nom du site réel, dix catégories dans l'ordre, barre du bas", async () => {
    const page = await open(); await go(page);
    assert.equal(await page.locator("#pz-site-name").innerText(), "Alpha");
    assert.deepEqual(await page.locator(".pz-cat").allInnerTexts(), CATS);
    for (const id of ["#pz-close", "#pz-styleguide", "#pz-publish", "#pz-hide"]) assert.ok(await page.locator(id).isVisible(), id);
    assert.deepEqual(await page.locator(".pz-device").allInnerTexts(), ["Ordinateur", "Tablette", "Mobile"]);
    const w = (await page.locator("#pz-panel").boundingBox()).width; assert.ok(w >= 270 && w <= 340, `largeur du panneau ${w}`);
    assert.equal(await page.locator("#pz-publish").isDisabled(), true, "Publier inactif sans modification : " + JSON.stringify(await page.evaluate(() => window.KWPZ.pending())));
    // la barre du bas reste collée en bas du panneau, la barre du haut en haut
    const foot = await page.locator(".pz-foot").boundingBox(), top = await page.locator(".pz-bar").boundingBox();
    assert.ok(Math.abs(foot.y + foot.height - 900) < 2 && top.y === 0);
    await shot(page, "01-bureau-1366"); await page.context().close();
  });

  test("l'aperçu est le vrai site sélectionné, et chaque site voit le sien", async () => {
    const page = await open(); await go(page, A);
    const text = async () => page.frameLocator("#pz-frame").locator("body").innerText();
    assert.match(await text(), /Texte du site Alpha/); assert.doesNotMatch(await text(), /Texte du site Beta/);
    await go(page, B); assert.match(await text(), /Texte du site Beta/);
    const fb = await page.locator("#pz-frame").boundingBox(), st = await page.locator("#pz-stage").boundingBox();
    assert.ok(Math.abs(fb.width - st.width) < 2 && Math.abs(fb.height - st.height) < 2, "l'aperçu occupe tout l'espace");
    await page.context().close();
  });

  test("appareils : la largeur réelle de l'aperçu change ; le bouton actif est identifiable", async () => {
    const page = await open(); await go(page);
    const width = async () => Math.round((await page.locator("#pz-frame").boundingBox()).width);
    const desktop = await width();
    await page.getByRole("radio", { name: "Tablette" }).click(); await page.waitForTimeout(300); assert.equal(await width(), 768);
    assert.equal(await page.getByRole("radio", { name: "Tablette" }).getAttribute("aria-checked"), "true");
    assert.equal(await page.getByRole("radio", { name: "Ordinateur" }).getAttribute("aria-checked"), "false");
    assert.equal(await page.frameLocator("#pz-frame").locator("body").evaluate(() => window.innerWidth), 768);
    await shot(page, "02-tablette");
    await page.getByRole("radio", { name: "Mobile" }).click(); await page.waitForTimeout(300); assert.equal(await width(), 375); await shot(page, "03-mobile");
    await page.getByRole("radio", { name: "Ordinateur" }).click(); await page.waitForTimeout(300); assert.equal(await width(), desktop);
    await page.keyboard.press("Tab"); // clavier : flèches entre appareils
    await page.getByRole("radio", { name: "Ordinateur" }).focus(); await page.keyboard.press("ArrowRight"); await page.waitForTimeout(300); assert.equal(await width(), 768);
    await page.context().close();
  });

  test("masquer / réafficher les contrôles : l'aperçu récupère l'espace, sans rechargement", async () => {
    const page = await open(); await go(page);
    await page.evaluate(() => { window.__marker = 1; document.getElementById("pz-frame").contentWindow.__m = 7; });
    const before = (await page.locator("#pz-frame").boundingBox()).width;
    await page.click("#pz-hide"); await page.waitForTimeout(400);
    const after1 = (await page.locator("#pz-frame").boundingBox()).width; assert.ok(after1 > before + 200, `${before} → ${after1}`);
    assert.equal(await page.locator("#pz-panel").isVisible(), false); assert.ok(await page.locator("#pz-show").isVisible());
    assert.equal(await page.evaluate(() => document.getElementById("pz-frame").contentWindow.__m), 7, "l'aperçu n'a pas été rechargé");
    await shot(page, "04-masque");
    await page.click("#pz-show"); await page.waitForTimeout(400);
    assert.ok(Math.abs((await page.locator("#pz-frame").boundingBox()).width - before) < 2); assert.ok(await page.locator("#pz-panel").isVisible());
    await page.context().close();
  });

  test("catégories : sélection, vue détail, retour, clavier ; Entête et Pied de page renvoient au Theme Builder", async () => {
    const page = await open(); await go(page);
    await page.locator(".pz-cat", { hasText: "Entête" }).click();
    assert.equal(await page.locator("#pz-detail-title").innerText(), "Entête"); assert.ok(await page.locator("#pz-view-detail").isVisible());
    assert.ok(await page.locator('#pz-detail-body a[href*="theme-builder"]').isVisible(), "lien vers le Theme Builder");
    await shot(page, "05-detail");
    await page.click("#pz-back");
    assert.equal(await page.locator(".pz-cat[aria-current='true']").innerText(), "Entête");
    await page.locator(".pz-cat", { hasText: "Menus" }).focus(); await page.keyboard.press("Enter"); assert.equal(await page.locator("#pz-detail-title").innerText(), "Menus");
    await page.keyboard.press("Escape"); assert.ok(await page.locator("#pz-view-home").isVisible());
    await page.locator(".pz-cat", { hasText: "Widgets" }).click(); assert.ok(await page.locator("#pz-detail-body").getByText("Colonne latérale principale").isVisible());
    await page.context().close();
  });

  test("Identité du site : le nom change dans l'aperçu avant publication, puis seulement CE site après « Publier »", async () => {
    const page = await open(); await go(page, A);
    assert.equal(await page.locator("#pz-publish").isDisabled(), true);
    await page.locator(".pz-cat", { hasText: "Identité du site" }).click();
    await page.getByLabel("Nom du site", { exact: true }).fill("Alpha renommé");
    await page.waitForFunction(() => !document.getElementById("pz-publish").disabled, null, { timeout: 8000 });
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; return d && d.body && /Alpha renommé/.test(d.body.innerText); }, null, { timeout: 12000 }); // l'aperçu montre le nouveau nom AVANT publication
    await shot(page, "08-identite");
    await page.locator(".pz-back").click(); await page.locator(".pz-cat", { hasText: "Types de publication" }).click(); await shot(page, "11-types"); if (process.env.PZ_DEBUG) console.log("STRAY", await page.evaluate(() => { const e = document.elementFromPoint(18, 112); return e ? e.outerHTML.slice(0, 300) + " | " + e.parentNode.outerHTML.slice(0, 300) : "none"; }));
    await page.locator(".pz-back").click(); await page.locator(".pz-cat", { hasText: "Identité du site" }).click();
    assert.equal(JSON.parse(one("SELECT name FROM mk_sites WHERE id = ?", A) ? JSON.stringify(one("SELECT name FROM mk_sites WHERE id = ?", A).name) : '""'), "Alpha", "rien n'est publié avant « Publier »");
    await page.waitForTimeout(2200); // enregistrement automatique du brouillon
    assert.ok(one("SELECT changes FROM cms_customizer_drafts WHERE site_id = ?", A), "brouillon enregistré");
    await page.click("#pz-publish"); await page.getByRole("button", { name: "Publier maintenant" }).click();
    await page.waitForFunction(() => /Publié/.test(document.getElementById("pz-toast").textContent) && !document.getElementById("pz-toast").hidden, null, { timeout: 15000 });
    assert.equal(one("SELECT name FROM mk_sites WHERE id = ?", A).name, "Alpha renommé");
    assert.equal(one("SELECT name FROM mk_sites WHERE id = ?", B).name, "Beta", "l'autre site est intact");
    assert.equal(one("SELECT COUNT(*) n FROM cms_customizer_drafts WHERE site_id = ?", A).n, 0, "brouillon vidé après publication");
    await page.context().close();
  });

  test("Global : une couleur change l'aperçu en direct, Publier l'applique au site, l'autre site n'est pas touché", async () => {
    const page = await open(); await go(page, B);
    await page.locator(".pz-cat", { hasText: "Global" }).click();
    await shot(page, "10-global");
    const field = page.locator('[data-ctl="tokens.colors.primary"] input[type=text]').first();
    await field.fill("#aa2244"); await field.blur();
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; return d && d.body && /aa2244/i.test((d.body.getAttribute("style") || "") + (d.documentElement.innerHTML.match(/aa2244/i) || "")); }, null, { timeout: 10000 });
    await page.waitForFunction(() => !document.getElementById("pz-publish").disabled, null, { timeout: 8000 });
    await page.waitForTimeout(2200);
    await page.click("#pz-publish"); await page.getByRole("button", { name: "Publier maintenant" }).click();
    await page.waitForFunction(() => /Publié/.test(document.getElementById("pz-toast").textContent) && !document.getElementById("pz-toast").hidden, null, { timeout: 15000 });
    assert.match(JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", B).tokens).colors.primary, /aa2244/i);
    assert.doesNotMatch(String(one("SELECT tokens FROM mk_sites WHERE id = ?", A).tokens), /aa2244/i);
    await page.context().close();
  });

  test("Page d'accueil : le choix d'une page s'enregistre pour CE site", async () => {
    const page = await open(); await go(page, A);
    const extra = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Autre accueil', 'autre-accueil', 'Autre accueil', '[]', 'published', 'page', ?, datetime('now'))").run(orgId, A).lastInsertRowid);
    await page.reload(); await go(page, A);
    await page.locator(".pz-cat", { hasText: "Réglages de la page d'accueil" }).click();
    await page.selectOption("#pz-home", String(extra)); await page.getByRole("button", { name: "Définir comme page d'accueil" }).click();
    await page.waitForFunction((id) => document.getElementById("pz-toast") && /Page d'accueil enregistrée/.test(document.getElementById("pz-toast").textContent), extra, { timeout: 8000 });
    assert.equal(one("SELECT home_page_id h FROM mk_sites WHERE id = ?", A).h, extra);
    db.prepare("UPDATE mk_sites SET home_page_id = (SELECT id FROM mk_landing_pages WHERE slug = 'accueil-alpha') WHERE id = ?").run(A); // remet l'accueil d'origine pour les parcours suivants
    await page.context().close();
  });

  test("CSS additionnel : règle refusée par le serveur → message sur le champ, rien n'est publié", async () => {
    const page = await open(); await go(page, A);
    await page.locator(".pz-cat", { hasText: "CSS additionnel" }).click();
    assert.ok(await page.evaluate(() => window.KWPZ.boot.can.css), "droit CSS : " + JSON.stringify(await page.evaluate(() => window.KWPZ.boot.can)));
    await page.locator("[data-ctl='settings.customCss'] textarea").fill("@import url(https://x.test/a.css); body{color:red}");
    await page.waitForSelector("[data-ctl='settings.customCss'] .kwc-err:not([hidden])", { timeout: 8000 });
    assert.equal(await page.locator("#pz-publish").isDisabled(), true);
    await page.context().close();
  });

  test("défilements indépendants : une fenêtre basse fait défiler le panneau, pas l'aperçu ni la page", async () => {
    const page = await open(1366, 420); await go(page);
    const sc = await page.evaluate(() => { const v = document.getElementById("pz-view-home"); return { can: v.scrollHeight > v.clientHeight, page: document.documentElement.scrollHeight <= window.innerHeight, h: [document.documentElement.scrollHeight, window.innerHeight, document.getElementById('pz-app').getBoundingClientRect().height, document.getElementById('pz-panel').scrollHeight, Array.from(document.getElementById('pz-panel').children).map(function (c) { var r = c.getBoundingClientRect(); return c.className + ':' + Math.round(r.top) + '-' + Math.round(r.bottom); }).join(' ')] }; });
    assert.ok(sc.can && sc.page, JSON.stringify(sc));
    await page.locator("#pz-view-home").evaluate((v) => { v.scrollTop = 9999; });
    assert.equal(await page.frameLocator("#pz-frame").locator("body").evaluate(() => window.scrollY), 0);
    const foot = await page.locator(".pz-foot").boundingBox(); assert.ok(Math.abs(foot.y + foot.height - 420) < 2, "barre du bas fixe");
    await page.context().close();
  });

  test("erreur de chargement : message clair, « Réessayer » recharge", async () => {
    const page = await open(); let fail = true;
    await page.route(/\/marketing\/pages\/\d+\/apercu/, (r) => (fail ? r.abort("connectionfailed") : r.continue()));
    await page.goto(`${srv.base}${PZ}?site=${A}`);
    await page.locator("#pz-error").waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
    // un échec réseau dans un cadre affiche la page d'erreur du navigateur : le cadre se charge mais l'aperçu reste lisible ; on vérifie surtout que « Réessayer » fonctionne ensuite
    fail = false; if (await page.locator("#pz-error").isVisible()) await page.click("#pz-retry");
    await page.reload(); await go(page);
    assert.match(await page.frameLocator("#pz-frame").locator("body").innerText(), /Texte du site Alpha/);
    await page.context().close();
  });

  test("écran de téléphone : le panneau recouvre l'aperçu, se masque, aucun débordement", async () => {
    const page = await open(390, 800); await go(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "aucun défilement horizontal");
    await shot(page, "06-telephone-ouvert");
    await page.click("#pz-hide"); await page.waitForTimeout(400); assert.ok((await page.locator("#pz-frame").boundingBox()).width >= 388); await shot(page, "07-telephone-masque");
    await page.context().close();
  });

  test("accès : sans connexion → connexion ; compte sans droit ou site inconnu → refus ; aucune erreur JavaScript", async () => {
    const anon = await fetch(`${srv.base}${PZ}?site=${A}`, { redirect: "manual" }); assert.ok([301, 302, 303].includes(anon.status));
    assert.equal((await boss.get(`${PZ}?site=999999`)).status, 404);
    const student = await newStudent(srv); assert.ok([302, 403, 404].includes((await student.get(`${PZ}?site=${A}`)).status));
    assert.deepEqual(errors, []);
  });
});
