// Programme 21.10 — l'interface « Boutique IA » dans un VRAI Chrome : 12 étapes, structure stable, ajout d'une catégorie et d'un produit, contenu sans invention, création dans le catalogue natif,
// vérifications bloquantes, assistant (proposition acceptée), perte de connexion, responsive, focus. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const BRIEF = "Je veux créer une boutique en ligne nommée « TechKin » pour vendre des ordinateurs portables, écrans et claviers à Kinshasa, livraison en RDC, pour les particuliers et les professionnels, prix en dollars.";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 15000, every = 120, what = "condition" } = {}) { const end = Date.now() + timeout; for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); } }

describe("Boutique IA (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, shop, site;
  const post = (path, body) => boss.request(path, { method: "POST", json: body === undefined ? {} : body });
  const stepBtn = (label) => page.locator(".aib-step").filter({ has: page.locator("strong", { hasText: new RegExp(`^${label}$`) }) });
  const box = (sel) => page.locator(sel).first().boundingBox();

  before(async () => {
    delete process.env.STRIPE_SECRET_KEY; delete process.env.STRIPE_WEBHOOK_SECRET;
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const r = JSON.parse((await post("/marketing/ia/studio/boutique/projets", { brief: BRIEF, newSiteName: "Boutique navigateur" })).text); shop = r.id;
    site = srv.db().prepare("SELECT site_id FROM mk_ai_shops WHERE id = ?").get(shop).site_id;
    for (const m of ["ai", "commerce"]) await boss.post(`/marketing/site-web/sites/${site}/modules/${m}`, { etat: "activer" });
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("dialog", (d) => { errors.push(`dialogue inattendu : ${d.message()}`); d.dismiss(); });
    await page.goto(`${srv.base}/marketing/ia/studio/boutique/${shop}?site=${site}`); await page.waitForSelector(".aib-step");
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("12 étapes avec leur état réel ; aucun script en erreur ; ce qui est retenu du brief est cité avec sa preuve", async () => {
    assert.equal(await page.locator(".aib-step").count(), 12);
    await stepBtn("Projet commercial").click();
    assert.match(await page.locator(".aib-table").first().innerText(), /TechKin/); assert.match(await page.locator(".aib-table").first().innerText(), /Kinshasa|RDC/);
    assert.match(await page.locator("#aib-progress-t").innerText(), /\/12/); assert.deepEqual(errors, []);
  });
  test("la structure reste stable d'une étape à l'autre (barre, navigation, assistant)", async () => {
    const before = { top: await box(".aib-top"), nav: await box(".aib-steps"), assist: await box(".aib-assist") };
    for (const label of ["Modèle économique", "Architecture de la boutique", "Organisation du catalogue", "Préparation des produits", "Design de la boutique", "Images et médias", "Configuration commerciale", "SEO", "Prévisualisation", "Vérifications", "Publication", "Projet commercial"]) {
      await stepBtn(label).click(); await until(async () => (await page.locator(".aib-pane h1").first().innerText()) === label, { what: `titre de l'étape « ${label} »` });
      assert.deepEqual({ top: await box(".aib-top"), nav: await box(".aib-steps"), assist: await box(".aib-assist") }, before, `mise en page modifiée à « ${label} »`);
    }
    assert.deepEqual(errors, [], "aucune étape ne lève d'erreur de script");
  });
  test("modèle économique : le dropshipping/gros ne sont pas présentés comme pris en charge (ici : produits physiques pris en charge)", async () => {
    await stepBtn("Modèle économique").click(); await page.waitForSelector(".aib-card");
    assert.match(await page.locator(".aib-card").first().innerText(), /Pris en charge/);
  });
  test("catalogue : ajouter une catégorie, accepter la structure, créer dans le catalogue natif (visible en base)", async () => {
    await stepBtn("Organisation du catalogue").click();
    await page.getByRole("button", { name: "Ajouter une catégorie" }).click(); await page.locator("dialog input[name=name]").fill("Imprimantes"); await page.locator("dialog").getByRole("button", { name: "Ajouter" }).click();
    await until(async () => (await page.locator(".aib-feat li", { hasText: "Imprimantes" }).count()) === 1, { what: "catégorie ajoutée" });
    await page.getByRole("button", { name: "Accepter la structure" }).click(); await page.getByText("Structure acceptée").first().waitFor();
    await page.getByRole("button", { name: "Créer les catégories dans le catalogue" }).click(); await page.getByText(/Catégories : \d+ créée/).waitFor();
    assert.ok(srv.db().prepare("SELECT COUNT(*) n FROM mk_shop_categories WHERE site_id = ?").get(site).n >= 8);
  });
  test("produit : brouillon, contenu généré SANS invention, création en brouillon dans le catalogue", async () => {
    await stepBtn("Préparation des produits").click();
    await page.getByRole("button", { name: "Nouveau produit" }).click();
    await page.locator("dialog input[name=name]").fill("Clavier mécanique K1"); await page.locator("dialog textarea[name=facts]").fill("Disposition AZERTY\nConnexion USB-C");
    await page.locator("dialog input[name=price]").fill("59,90"); await page.locator("dialog input[name=sku]").fill("KB-K1"); await page.locator("dialog").getByRole("button", { name: "Enregistrer" }).click();
    await page.getByRole("row", { name: /Clavier mécanique K1/ }).waitFor();
    assert.match(await page.getByRole("row", { name: /Clavier mécanique K1/ }).innerText(), /manque : .*image/);
    await page.getByRole("button", { name: "Générer le contenu" }).click(); await page.locator("dialog").getByRole("button", { name: "Générer" }).click();
    await page.getByRole("button", { name: "Voir le contenu" }).waitFor(); await page.getByRole("button", { name: "Voir le contenu" }).click();
    const txt = await page.locator("dialog").innerText(); assert.match(txt, /AZERTY/); assert.doesNotMatch(txt, /\b\d{3,}\b/, "aucun chiffre inventé"); await page.locator("dialog").getByRole("button", { name: "Fermer" }).click();
    await page.getByRole("button", { name: "Créer les brouillons dans le catalogue" }).click(); await page.getByText(/Clavier mécanique K1 : créé en brouillon/).waitFor();
    assert.deepEqual({ ...srv.db().prepare("SELECT status, price_cents FROM mk_shop_products WHERE site_id = ? AND sku = 'KB-K1'").get(site) }, { status: "draft", price_cents: 5990 });
  });
  test("vérifications : « pas prête à vendre » tant qu'aucun produit n'est publié ; les erreurs sont expliquées", async () => {
    await stepBtn("Vérifications").click(); await page.waitForSelector(".aib-check li");
    assert.match(await page.locator(".aib-msg").first().innerText(), /Pas prête à vendre/);
    assert.match(await page.locator(".aib-check li").filter({ has: page.locator("strong", { hasText: /^Livraison$/ }) }).innerText(), /bloquant/, "produit physique sans zone de livraison : bloquant");
    assert.match(await page.locator(".aib-check li").filter({ has: page.locator("strong", { hasText: /^Paiement$/ }) }).innerText(), /manuel|Paiement manuel|utilisable/i);
    assert.match(await page.locator(".aib-check li").filter({ has: page.locator("strong", { hasText: /^Version mobile$/ }) }).innerText(), /Non vérifiable automatiquement/);
  });
  test("configuration : aucune valeur n'est proposée ; le paiement par carte est signalé non configuré", async () => {
    await stepBtn("Configuration commerciale").click(); await page.waitForSelector(".aib-pane h2");
    assert.match(await page.locator(".aib-pane").innerText(), /non configuré sur le serveur/);
    assert.match(await page.locator(".aib-pane").innerText(), /aucune valeur|AUCUNE valeur|Kolakisa ne propose/i);
  });
  test("assistant : une demande devient une proposition, acceptée → la catégorie apparaît ; « supprime » est refusé", async () => {
    await stepBtn("Organisation du catalogue").click();
    await page.locator("#aib-chat-in").fill("Ajoute une catégorie Routeurs"); await page.getByRole("button", { name: "Envoyer" }).click(); await page.waitForSelector(".aib-msgbox.is-proposal");
    assert.equal(await page.locator(".aib-feat li", { hasText: "Routeurs" }).count(), 0);
    await page.locator(".aib-msgbox.is-proposal").getByRole("button", { name: "Accepter" }).click(); await until(async () => (await page.locator(".aib-feat li", { hasText: "Routeurs" }).count()) === 1, { what: "catégorie ajoutée par l'assistant" });
    await page.locator("#aib-chat-in").fill("Supprime la catégorie Écrans"); await page.getByRole("button", { name: "Envoyer" }).click();
    await until(async () => /ne supprime jamais/.test(await page.locator("#aib-chat").innerText()), { what: "refus de suppression" });
    assert.deepEqual(errors, []);
  });
  test("perte de connexion : l'échec est annoncé et rien n'est affiché comme enregistré ; la reprise fonctionne", async () => {
    await stepBtn("Architecture de la boutique").click(); await context.setOffline(true);
    await page.getByRole("button", { name: "Ajouter une page" }).click(); await page.locator("dialog input[name=name]").fill("Hors ligne"); await page.locator("dialog").getByRole("button", { name: "Ajouter" }).click();
    await until(async () => /Connexion perdue/.test(await page.locator("#aib-banner").innerText()), { what: "bannière" });
    assert.equal(await page.locator("tbody tr", { hasText: "Hors ligne" }).count(), 0); assert.match(await page.locator("#aib-save-t").innerText(), /Échec|Hors connexion/);
    await context.setOffline(false); await page.locator("#aib-banner").getByRole("button", { name: "Réessayer" }).click();
    await until(async () => (await page.locator("tbody tr", { hasText: "Hors ligne" }).count()) === 1, { what: "reprise" });
  });
  test("clavier : le focus reste sur l'étape après navigation ; responsive sans débordement", async () => {
    await stepBtn("Projet commercial").focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Enter");
    const f = await page.evaluate(() => { const e = document.activeElement; return { tag: e.tagName, key: e.dataset.key || "", w: parseFloat(getComputedStyle(e).outlineWidth), st: getComputedStyle(e).outlineStyle }; });
    assert.equal(f.tag, "BUTTON"); assert.equal(f.key, "modele"); assert.notEqual(f.st, "none"); assert.ok(f.w <= 2);
    for (const [w, h] of [[1440, 900], [1024, 768], [390, 800]]) {
      await page.setViewportSize({ width: w, height: h }); await page.reload(); await page.waitForSelector(".aib-step");
      for (const label of ["Architecture de la boutique", "Préparation des produits", "Vérifications"]) { await stepBtn(label).scrollIntoViewIfNeeded(); await stepBtn(label).click(); await wait(120); assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, `débordement à ${w}px (${label})`); }
      const nav = await box(".aib-steps"), main = await box("#aib-main");
      if (w <= 760) assert.ok(main.y >= nav.y + nav.height - 1); else assert.ok(main.x >= nav.x + nav.width - 1);
    }
  });
});
