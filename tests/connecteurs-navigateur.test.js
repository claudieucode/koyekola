// KOLAKISA CMS — Réglages → Connecteurs dans un VRAI Chrome (Playwright, ignoré sans) : catalogue, recherche et filtres sur les données réelles, fiche repliable (clavier), formulaire (modifications non
// enregistrées, double clic), enregistrement et test de connexion réels (faux fournisseur local), états, secret jamais réaffiché, confirmation avant révocation, téléphone, mouvement réduit.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("connecteurs (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, fake, errors, mode = {}, hits = 0, A;
  const KEY = "sk-ant-" + "ChromeKey0123456789abcdefg";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const open = async ({ width = 1280, reducedMotion = "no-preference", url = "/marketing/site-web/parametres/connecteurs" } = {}) => {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: width < 600, reducedMotion });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    await page.goto(srv.base + url); await page.locator("[data-cn-root] .mk-cn-card").first().waitFor();
    return page;
  };
  before(async () => {
    fake = http.createServer((req, res) => { hits++; if (mode.status) { res.writeHead(mode.status, { "content-type": "application/json" }); return res.end(JSON.stringify({ error: { message: "refusé" } })); } res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ id: "ok" })); });
    await new Promise((r) => fake.listen(0, "127.0.0.1", r));
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", CONNECTOR_API_BASE_ANTHROPIC: `http://127.0.0.1:${fake.address().port}` });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES ((SELECT id FROM mk_organizations LIMIT 1), 'Alpha', 'alpha', '{}')").run().lastInsertRowid);
    browser = await chromium.launch({ executablePath: CHROME });
  });
  after(async () => { await browser.close(); db.close(); await srv.stop(); fake.close(); });

  test("catalogue : cartes réelles, recherche (nom, capacité), filtres avec décomptes, aucun bouton « Installer » ; intégrations existantes avec leur état réel", async () => {
    const page = await open();
    const names = await page.locator(".mk-cn-name").allInnerTexts(); for (const n of ["Anthropic", "OpenAI", "Google", "E-mail (envoi)", "SMS (Twilio)", "Stripe"]) assert.ok(names.includes(n), n);
    assert.equal(await page.locator("body").innerText().then((t) => /Installer/.test(t)), false);
    await page.fill("[data-cn-search]", "gemini"); assert.deepEqual(await page.locator(".mk-cn-name").allInnerTexts(), ["Google"], "recherche dans la description"); await page.fill("[data-cn-search]", "introuvable-xyz"); assert.deepEqual(await page.locator(".mk-cn-name").allInnerTexts(), []); assert.equal(await page.locator("[data-cn-empty]").isVisible(), true); await page.fill("[data-cn-search]", "génération de texte"); assert.equal(await page.locator(".mk-cn-card").count(), 3, "recherche par capacité");
    await page.fill("[data-cn-search]", "stripe"); assert.deepEqual(await page.locator(".mk-cn-name").allInnerTexts(), ["Stripe"]); assert.match(await page.locator(".mk-cn-state").innerText(), /Non configuré/); await page.fill("[data-cn-search]", "");
    await page.click('.mk-cn-filter:has-text("Connectés")'); assert.equal(await page.locator(".mk-cn-card").count(), 0); assert.equal(await page.locator('.mk-cn-filter[aria-pressed="true"]').innerText(), "Connectés 0");
    await page.click('.mk-cn-filter:has-text("Disponibles")'); assert.equal(await page.locator(".mk-cn-card").count(), 3); await page.click('.mk-cn-filter:has-text("Tous")');
    assert.equal(errors.length, 0, errors.join("\n")); await page.context().close();
  });

  test("fiche au clavier + configuration réelle : modifications non enregistrées signalées, double clic = un seul enregistrement, clé jamais réaffichée, test de connexion → « Connecté »", async () => {
    const page = await open();
    const head = page.locator('[data-cn-open="anthropic"]'); await head.focus(); await page.keyboard.press("Enter");
    assert.equal(await head.getAttribute("aria-expanded"), "true"); await page.locator("#cn-f-anthropic-apiKey").waitFor({ state: "visible" });
    assert.equal(await page.locator("#cn-f-anthropic-apiKey").getAttribute("type"), "password"); assert.equal(await page.locator('.mk-cn-form button[type="submit"]').isDisabled(), true, "rien à enregistrer");
    await page.fill("#cn-f-anthropic-apiKey", "mauvaise"); assert.match(await page.locator(".mk-cn-msg").innerText(), /non enregistrées/);
    await page.click('.mk-cn-form button[type="submit"]'); await page.locator(".mk-cn-msg.is-error").waitFor(); assert.match(await page.locator(".mk-cn-msg").innerText(), /sk-ant-/); assert.equal(await page.inputValue("#cn-f-anthropic-apiKey"), "mauvaise", "saisie conservée après refus"); assert.equal(one("SELECT COUNT(*) AS n FROM mk_connections").n, 0);
    await page.fill("#cn-f-anthropic-apiKey", KEY); await page.dblclick('.mk-cn-form button[type="submit"]');
    await page.waitForFunction(() => /Configuration enregistrée/.test(document.querySelector("[data-cn-flash]").textContent));
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_connections").n, 1, "un seul enregistrement"); assert.match(await page.locator(".mk-cn-state").first().innerText(), /Configuré, non testé/);
    assert.ok(!(await page.content()).includes(KEY), "la clé n'est jamais renvoyée à la page"); assert.equal(await page.inputValue("#cn-f-anthropic-apiKey"), ""); assert.match(await page.getAttribute("#cn-f-anthropic-apiKey", "placeholder"), /enregistrée/);
    const before = hits; await page.click('.mk-cn-actions button:has-text("Tester la connexion")'); await page.waitForFunction(() => /Connexion réussie/.test(document.querySelector("[data-cn-flash]").textContent));
    assert.ok(hits > before, "vrai appel au fournisseur"); assert.match(await page.locator(".mk-cn-state").first().innerText(), /^Connecté/); assert.match(await page.locator(".mk-cn-dl").innerText(), /Réussi/);
    mode = { status: 401 }; await page.click('.mk-cn-actions button:has-text("Tester la connexion")'); await page.waitForFunction(() => /Échec du test/.test(document.querySelector("[data-cn-flash]").textContent));
    assert.match(await page.locator("[data-cn-flash]").innerText(), /Identifiants refusés/); assert.match(await page.locator(".mk-cn-state").first().innerText(), /En erreur/); assert.equal(await page.locator("[data-cn-flash]").getAttribute("class").then((c) => /is-error/.test(c)), true); mode = {};
    assert.equal(errors.length, 0, errors.join("\n")); await page.context().close();
  });

  // Attend un message du serveur dans la bannière ; en cas d'échec, montre le message RÉEL (au lieu d'un simple délai dépassé)
  const flashHas = async (page, re) => { try { await page.waitForFunction((src) => new RegExp(src).test(document.querySelector("[data-cn-flash]").textContent), re.source); } catch (e) { throw new Error(`message attendu ${re} ; reçu : « ${await page.locator("[data-cn-flash]").innerText()} » ; état : ${await page.locator(".mk-cn-msg").allInnerTexts()}`); } };
  test("révocation avec confirmation (refus = rien ne change) ; désactivation ; réactivation ; partage central", async () => {
    // Départ propre : une connexion centrale enregistrée par l'API (le test précédent a laissé la sienne dans un état d'erreur)
    const page = await open(); let answer = false; page.on("dialog", (d) => (answer ? d.accept() : d.dismiss()));
    await page.click('[data-cn-open="anthropic"]');
    await page.click('.mk-cn-actions button:has-text("Révoquer les identifiants")'); await page.waitForTimeout(300); assert.ok(one("SELECT 1 FROM mk_settings WHERE key LIKE 'connector.%'"), "refusé : secret conservé");
    await page.click('.mk-cn-actions button:has-text("Désactiver")'); await flashHas(page, /désactivé/); assert.match(await page.locator(".mk-cn-state").first().innerText(), /Désactivé/); assert.equal(one("SELECT state FROM mk_connections").state, "disabled");
    await page.click('.mk-cn-actions button:has-text("Réactiver")'); await flashHas(page, /réactivé/); assert.notEqual(one("SELECT state FROM mk_connections").state, "disabled");
    await page.locator('.mk-cn-share input[type="checkbox"]').check(); await flashHas(page, /partagée/); assert.equal(one("SELECT shared FROM mk_connections").shared, 1);
    answer = true; await page.click('.mk-cn-actions button:has-text("Révoquer les identifiants")'); await flashHas(page, /Identifiants révoqués/);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_settings WHERE key LIKE 'connector.%'").n, 0, "secret supprimé du serveur"); assert.equal(one("SELECT state FROM mk_connections").state, "configured");
    assert.equal(errors.length, 0, errors.join("\n")); await page.context().close();
  });

  test("espace d'un site : niveau annoncé, fiche sans partage central, aucune clé d'un autre niveau ; téléphone sans défilement horizontal ; mouvement réduit coupe les animations", async () => {
    const site = await open({ url: `/marketing/site-web/sites/${A}/parametres-connecteurs` });
    assert.match(await site.locator("[data-cn-scope]").innerText(), /Site « Alpha »/); await site.click('[data-cn-open="anthropic"]'); assert.equal(await site.locator(".mk-cn-share").count(), 0, "le partage est réservé au niveau central");
    assert.equal(await site.locator(".mk-cn-name").allInnerTexts().then((n) => n.includes("Stripe")), false, "intégrations de l'organisation non montrées à un site"); await site.context().close();
    const phone = await open({ width: 390 }); await phone.click('[data-cn-open="openai"]'); assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "pas de défilement horizontal"); await phone.context().close();
    const calm = await open({ reducedMotion: "reduce" }); assert.equal(await calm.evaluate(() => getComputedStyle(document.querySelector(".mk-cn-card")).animationName), "none"); await calm.context().close();
    const live = await open(); assert.equal(await live.evaluate(() => getComputedStyle(document.querySelector(".mk-cn-card")).animationName), "mk-st-in"); await live.context().close();
    assert.equal(errors.length, 0, errors.join("\n"));
  });
});
