// Éditeur de scénarios — PALETTE D'ACTIONS dans un VRAI navigateur (Chrome piloté par Playwright) contre un vrai serveur :
// une action qui dépend d'une connexion non réglée est marquée « Connexion requise » (avec la raison), « Seulement les
// actions disponibles » masque réellement ces actions, la disponibilité suit les réglages, les actions récentes remontent.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe("palette d'actions des scénarios : disponibilité réelle, filtre, récentes (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, n = 0, autoId, org;
  const item = (type) => page.locator(`#au-palette .mk-pal-item[data-step-type="${type}"]`);
  const visible = (type) => item(type).evaluate((b) => !b.closest("li").hidden && b.offsetParent !== null);

  async function openEditor() {
    n += 1;
    if (context) await context.close();
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    const r = await boss.post("/marketing/automatisations", { name: `Palette ${n}`, kind: "marketing", trigger_event: "lms.user_registered" });
    autoId = Number(String(r.location).match(/(\d+)$/)[1]);
    org = srv.db().prepare("SELECT organization_id AS o FROM mk_automations WHERE id = ?").get(autoId).o;
    await page.goto(`${srv.base}/marketing/automatisations/${autoId}`);
    await page.waitForSelector("#au-palette .mk-pal-item", { timeout: 15000 });
  }
  const setting = (key, value) => srv.db().prepare("INSERT OR REPLACE INTO mk_settings (organization_id, key, value) VALUES (?, ?, ?)").run(org, key, value);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    errors = [];
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("par défaut : e-mail et SMS sont marqués « Connexion requise » avec la raison ; les autres actions ne le sont pas", async () => {
    await openEditor();
    for (const type of ["email", "sms"]) {
      assert.equal(await item(type).locator(".mk-pal-badge").innerText(), "Connexion requise", `${type} : badge`);
      assert.match(await item(type).getAttribute("class"), /is-needs-connection/);
      assert.match(await item(type).getAttribute("data-tip"), /connexion requise/i);
      assert.match(await item(type).getAttribute("aria-label"), /Connexion requise/, `${type} : annoncé aux lecteurs d'écran`);
    }
    assert.match(await item("sms").getAttribute("data-tip"), /Fournisseur SMS/);
    assert.match(await item("email").getAttribute("data-tip"), /Fournisseur d'e-mails/);
    for (const type of ["wait", "condition", "split", "update_field", "add_tag", "end"]) assert.equal(await item(type).locator(".mk-pal-badge").count(), 0, `${type} : aucune connexion requise`);
  });

  test("« Seulement les actions disponibles » masque réellement les actions à connecter, et le choix survit au rechargement", async () => {
    await openEditor();
    assert.ok(await visible("sms") && await visible("email"), "affichées par défaut (jamais cachées sans qu'on le demande)");
    await page.locator("[data-pal-only]").check();
    assert.equal(await visible("sms"), false); assert.equal(await visible("email"), false);
    assert.ok(await visible("wait") && await visible("condition"), "les actions disponibles restent");
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item");
    assert.equal(await page.locator("[data-pal-only]").isChecked(), true, "choix mémorisé");
    assert.equal(await visible("sms"), false, "filtre toujours appliqué après rechargement");
    await page.locator("[data-pal-only]").uncheck();
    assert.ok(await visible("sms"), "décoché : de retour");
  });

  test("la recherche trouve les actions qui demandent une connexion (« connexion »)", async () => {
    await openEditor();
    await page.fill("#au-pal-search", "connexion");
    assert.ok(await visible("sms") && await visible("email"));
    assert.equal(await visible("wait"), false);
  });

  test("une fois les fournisseurs réglés, les badges et le filtre disparaissent (rien de décoratif)", async () => {
    await openEditor();
    setting("email.provider", "smtp"); setting("email.from", "KOLAKISA <contact@exemple.fr>");
    setting("sms.provider", "twilio"); setting("sms.sender", "KOLAKISA"); setting("sms.account_sid", "AC00000000000000000000000000000000"); setting("sms.auth_token", "jeton");
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item");
    assert.equal(await page.locator("#au-palette .mk-pal-badge").count(), 0, "plus aucun badge");
    assert.equal(await page.locator("[data-pal-only]").count(), 0, "plus de filtre : il n'y a rien à filtrer");
    assert.ok(await visible("sms") && await visible("email"));
  });

  test("les actions récemment utilisées remontent en tête à la prochaine ouverture (4 au plus, la plus récente d'abord)", async () => {
    await openEditor();
    for (const type of ["wait", "split", "add_tag"]) { await item(type).click(); await wait(250); }
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item");
    const first = page.locator("#au-palette .mk-pal-group").first();
    assert.match(await first.locator(".mk-pal-cat").innerText(), /récemment utilisées/i);
    const types = await first.locator(".mk-pal-item").evaluateAll((bs) => bs.map((b) => b.dataset.stepType));
    assert.deepEqual(types, ["add_tag", "split", "wait"]);
    // Cliquer sur une récente l'insère vraiment (une étape de plus sur le canevas)
    const before = await page.locator(".drawflow-node").count();
    await first.locator('.mk-pal-item[data-step-type="split"]').click(); await wait(400);
    assert.equal(await page.locator(".drawflow-node").count(), before + 1, "l'action récente est insérée");
  });

  test("aucune erreur de script ni de console", () => { assert.deepEqual(errors, []); });
});
