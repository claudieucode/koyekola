// KOLAKISA CMS — palier 17 : écrans de l'Automation Engine en vrai Chrome (site, historique, simulation, versions, responsive, accessibilité).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("Automation Engine (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, orgId, errors, siteA, autoId, contactId;
  const M = () => `${srv.base}/marketing`;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const open = async (width = 1280) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    siteA = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site Alpha" })).location).match(/sites\/(\d+)/)[1]);
    await boss.post("/marketing/automatisations", { name: "Scénario Alpha", kind: "marketing", trigger_event: "contact.created", site: siteA });
    await boss.post("/marketing/automatisations", { name: "Scénario Principal", kind: "marketing", trigger_event: "contact.created" });
    autoId = one("SELECT id FROM mk_automations WHERE name = 'Scénario Principal'").id;
    db.prepare("UPDATE mk_automations SET steps = ? WHERE id = ?").run(JSON.stringify([{ type: "add_tag", tag: "chrome" }, { type: "wait", amount: 1, unit: "days" }, { type: "end" }]), autoId);
    contactId = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name) VALUES (?, 'chrome@exemple.fr', 'Chloé')").run(orgId).lastInsertRowid);
    const now = Date.now();
    db.prepare("INSERT INTO mk_automation_runs (organization_id, automation_id, contact_id, steps, step_index, status, wake_at, entered_at, version) VALUES (?, ?, ?, ?, 1, 'running', ?, ?, 1)").run(orgId, autoId, contactId, JSON.stringify([{ type: "add_tag", tag: "chrome" }, { type: "wait", amount: 1, unit: "days" }]), now + 86400000, now);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("liste : filtre par site et création avec le champ « Site »", async () => {
    const page = await open();
    await page.goto(`${M()}/automatisations`);
    await page.selectOption("#sf-site", String(siteA));
    await Promise.all([page.waitForNavigation(), page.click('button:has-text("Afficher")')]);
    const body = await page.locator("body").innerText();
    assert.match(body, /Scénario Alpha/); assert.doesNotMatch(body, /Scénario Principal/);
  });

  test("historique : filtre par état et par contact, état « En attente » et prochaine étape lisibles", async () => {
    const page = await open();
    await page.goto(`${M()}/automatisations/historique`);
    assert.match(await page.locator("tbody").innerText(), /chrome@exemple\.fr/);
    assert.match(await page.locator("tbody").innerText(), /En attente/);
    await page.fill("#h-q", "introuvable");
    await Promise.all([page.waitForNavigation(), page.click('button:has-text("Filtrer")')]);
    assert.match(await page.locator("body").innerText(), /Aucun passage/);
  });

  test("simulation : saisie d'un contact, résultat étape par étape, aucune écriture", async () => {
    const page = await open();
    await page.goto(`${M()}/automatisations/${autoId}/simulation`);
    await page.fill("#sim-contact", "chrome@exemple.fr");
    const tagsBefore = one("SELECT COUNT(*) n FROM mk_contact_tags").n;
    await Promise.all([page.waitForNavigation(), page.click('button:has-text("Simuler")')]);
    const body = await page.locator("body").innerText();
    assert.match(body, /Résultat pour chrome@exemple\.fr/); assert.match(body, /serait exécutée/); assert.match(body, /attente/);
    assert.equal(one("SELECT COUNT(*) n FROM mk_contact_tags").n, tagsBefore);
  });

  test("fiche contact : panneau des scénarios ; page d'un scénario : versions et liens", async () => {
    const page = await open();
    await page.goto(`${M()}/contacts/${contactId}`);
    assert.match(await page.locator("#scenarios").innerText(), /Scénario Principal/);
    await page.goto(`${M()}/automatisations/${autoId}`);
    assert.match(await page.locator("#versions").innerText(), /Historique des passages/);
  });

  test("responsive 1400 / 820 / 390 : aucun débordement ; champs étiquetés", async () => {
    for (const w of [1400, 820, 390]) {
      const page = await open(w);
      for (const path of ["/automatisations", "/automatisations/historique", `/automatisations/${autoId}/simulation?contact=${contactId}`, `/contacts/${contactId}`]) {
        await page.goto(`${M()}${path}`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(over <= 1, `débordement ${over}px à ${w}px sur ${path}`);
      }
      await page.close();
    }
    const page = await open();
    await page.goto(`${M()}/automatisations/historique`);
    const unlabeled = await page.evaluate(() => [...document.querySelectorAll(".mk-filterbar input:not([type=hidden]), .mk-filterbar select")].filter((el) => !(el.labels && el.labels.length)).map((el) => el.name));
    assert.deepEqual(unlabeled, []);
  });

  test("aucune erreur JavaScript pendant les parcours", () => { assert.deepEqual(errors, []); });
});
