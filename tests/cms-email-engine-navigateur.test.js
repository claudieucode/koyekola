// KOLAKISA CMS — palier 16 : écrans de l'Email Engine en vrai Chrome (site, abonnements par audience, identité d'expédition, responsive, accessibilité).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("Email Engine (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, orgId, errors, siteA, siteB, userA, listA;
  const M = () => `${srv.base}/marketing`;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const open = async (client, width = 1280) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
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
    siteB = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site Bravo" })).location).match(/sites\/(\d+)/)[1]);
    await boss.post("/marketing/listes", { name: "Audience Alpha", site: siteA });
    await boss.post("/marketing/listes", { name: "Audience Bravo", site: siteB });
    listA = one("SELECT id FROM mk_lists WHERE name = 'Audience Alpha'").id;
    const ins = db.prepare("INSERT INTO mk_contacts (organization_id, email, status) VALUES (?, ?, ?)");
    for (const [e, s] of [["a1@ex.fr", "subscribed"], ["a2@ex.fr", "unknown"], ["a3@ex.fr", "unsubscribed"]]) {
      const id = Number(ins.run(orgId, e, s).lastInsertRowid);
      if (s === "subscribed") db.prepare("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown) VALUES (?, ?, 'marketing', 'granted', 'form', 'J''accepte')").run(orgId, id);
      db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (?, ?, ?)").run(orgId, listA, id);
    }
    userA = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(siteA, one("SELECT id FROM users WHERE email = ?", userA.email).id);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("filtre par site : l'équipe choisit un site, la liste se réduit ; création avec le champ « Site »", async () => {
    const page = await open(boss);
    await page.goto(`${M()}/listes`);
    assert.equal(await page.locator("tbody tr").count() >= 2, true);
    await page.selectOption("#sf-site", String(siteB));
    await Promise.all([page.waitForNavigation(), page.click('button:has-text("Afficher")')]);
    assert.match(page.url(), new RegExp(`site=${siteB}`));
    const body = await page.locator("main, body").first().innerText();
    assert.match(body, /Audience Bravo/); assert.doesNotMatch(body, /Audience Alpha/);
    await page.goto(`${M()}/listes#nouvelle`); // la fenêtre de création s'ouvre par son ancre
    await page.waitForSelector("dialog[open] #l-name");
    await page.fill("#l-name", "Créée dans Chrome");
    await page.selectOption("#l-site", String(siteA));
    await Promise.all([page.waitForNavigation(), page.click('dialog button[type=submit]')]);
    assert.equal(one("SELECT site_id FROM mk_lists WHERE name = 'Créée dans Chrome'").site_id, siteA);
  });

  test("page d'audience : états d'abonnement, effectifs et filtre", async () => {
    const page = await open(boss);
    await page.goto(`${M()}/listes/${listA}`);
    const nav = await page.locator('nav[aria-label="Filtrer par état"]').innerText();
    assert.match(nav, /Abonné \(1\)/); assert.match(nav, /En attente de consentement \(1\)/); assert.match(nav, /Désabonné \(1\)/);
    await Promise.all([page.waitForNavigation(), page.click('nav[aria-label="Filtrer par état"] a:has-text("Désabonné")')]);
    assert.equal(await page.locator("tbody tr").count(), 1);
    assert.match(await page.locator("tbody").innerText(), /a3@ex\.fr/);
    assert.match(await page.locator("nav[aria-label='Filtrer par état'] [aria-current='page']").innerText(), /Désabonné/);
  });

  test("personne limitée au site Alpha : voit son audience, jamais celle de Bravo (adresse directe refusée)", async () => {
    const page = await open(userA);
    await page.goto(`${M()}/listes?site=${siteA}`);
    const body = await page.locator("body").innerText();
    assert.match(body, /Audience Alpha/); assert.doesNotMatch(body, /Audience Bravo/);
    assert.equal(await page.locator("#sf-site").count(), 0, "pas de sélecteur de site");
    const r = await page.goto(`${M()}/listes?site=${siteB}`);
    assert.equal(r.status(), 403);
  });

  test("Paramètres → Emailing : champs étiquetés, enregistrement réel de l'expéditeur", async () => {
    const page = await open(boss);
    await page.goto(`${M()}/site-web/parametres/emailing`);
    await page.fill("#st-email_from_address", "hello@kola.fr");
    await Promise.all([page.waitForNavigation(), page.click("[data-st-save]")]);
    assert.equal(await page.locator("#st-email_from_address").inputValue(), "hello@kola.fr");
    assert.match(one("SELECT value FROM mk_settings WHERE key = 'email.from'").value, /hello@kola\.fr/);
    const unlabeled = await page.evaluate(() => [...document.querySelectorAll("[data-st-form] input:not([type=hidden]), [data-st-form] select")].filter((el) => !(el.labels && el.labels.length)).map((el) => el.name));
    assert.deepEqual(unlabeled, []);
  });

  test("responsive 1400 / 820 / 390 : aucun débordement horizontal", async () => {
    for (const w of [1400, 820, 390]) {
      const page = await open(boss, w);
      for (const path of ["/listes", `/listes/${listA}`, "/campagnes", "/segments", "/modeles", "/site-web/parametres/emailing"]) {
        await page.goto(`${M()}${path}`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(over <= 1, `débordement ${over}px à ${w}px sur ${path}`);
      }
      await page.close();
    }
  });

  test("aucune erreur JavaScript pendant les parcours", () => { assert.deepEqual(errors, []); });
});
