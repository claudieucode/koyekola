// KOLAKISA CMS — palier 15 : Contact Core en vrai Chrome (filtres, fiche, archivage, doublons, fusion, masquage, responsive, accessibilité).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("contacts (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, orgId, errors, basic;
  const C = () => `${srv.base}/marketing/contacts`;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const open = async (client, width = 1280) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  // Sur grand écran le panneau « Plus de filtres » s'ouvre tout seul ; sur mobile il faut le déplier
  const openFilters = async (page) => { const open = await page.locator("details.mk-filter-more").evaluate((d) => d.open); if (!open) await page.locator("summary", { hasText: "Plus de filtres" }).click(); };
  const add = (email, extra = {}) => Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, last_name, company, phone, normalized_phone, lifecycle_stage, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(orgId, email, extra.first || "", extra.last || "", extra.company || "", extra.phone || "", extra.nphone || "", extra.lifecycle || "contact", extra.source || "manual").lastInsertRowid);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    for (let i = 1; i <= 30; i++) add(`liste${i}@ex.fr`, { first: `Prénom${i}`, last: "Dupont", lifecycle: i % 2 ? "lead" : "customer", source: i % 3 ? "form" : "import" });
    add("fa@ex.fr", { first: "Fanny", phone: "+243 81 234 5678", nphone: "+243812345678" });
    add("fb@ex.fr", { last: "Banza", company: "KOLA", phone: "+243 81 234 5678", nphone: "+243812345678" });
    // personne sans le droit « données sensibles »
    const r = await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Lecture contacts masquée", description: "test", perm: ["contacts.read"] });
    assert.ok([200, 302].includes(r.status));
    basic = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", basic.email).id, one("SELECT key FROM mk_roles WHERE name = 'Lecture contacts masquée'").key);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("liste : filtre cycle de vie + puce retirable, pagination, colonnes réelles", async () => {
    const page = await open(boss);
    await page.goto(C());
    await openFilters(page);
    await page.selectOption("#f-cycle", "customer");
    await Promise.all([page.waitForNavigation(), page.click('button:has-text("Filtrer")')]);
    assert.match(page.url(), /cycle=customer/);
    assert.match(await page.locator(".mk-filter-chips").innerText(), /Cycle de vie : Client/);
    assert.match(await page.locator(".mk-filter-count").innerText(), /^15 contacts correspondant/);
    const rows = await page.locator("tbody tr").count();
    assert.equal(rows, 15);
    assert.equal(await page.locator("tbody td[data-label='Cycle de vie']").evaluateAll((tds) => tds.every((t) => t.textContent.trim() === "Client")), true);
    await Promise.all([page.waitForNavigation(), page.click(".mk-chip-removable")]);
    assert.doesNotMatch(page.url(), /cycle=/);
    await page.goto(`${C()}?taille=25&page=2`);
    const total = one("SELECT COUNT(*) n FROM mk_contacts WHERE record_status IN ('active', 'inactive')").n;
    assert.match(await page.locator(".mk-pager").innerText(), new RegExp(`sur ${total}`));
  });

  test("fiche : changer l'étape, archiver puis rétablir — messages et état persistants", async () => {
    const id = one("SELECT id FROM mk_contacts WHERE email = 'liste1@ex.fr'").id;
    const page = await open(boss);
    await page.goto(`${C()}/${id}`);
    await page.selectOption("#cl-stage", "customer");
    await Promise.all([page.waitForNavigation(), page.click('button:has-text("Changer l\'étape")')]);
    assert.match(await page.locator(".mk-flash").innerText(), /Étape du cycle de vie enregistrée/);
    assert.equal(one("SELECT lifecycle_stage FROM mk_contacts WHERE id = ?", id).lifecycle_stage, "customer");
    await Promise.all([page.waitForNavigation(), page.click('button:has-text("Archiver")')]);
    assert.match(await page.locator("#coeur").innerText(), /Archivée/);
    await Promise.all([page.waitForNavigation(), page.click('button:has-text("Rétablir la fiche")')]);
    assert.match(await page.locator("#coeur").innerText(), /Active/);
  });

  test("doublons → comparaison → case de confirmation obligatoire → fusion", async () => {
    const page = await open(boss);
    await page.goto(`${C()}/doublons`);
    assert.match(await page.locator("main, body").first().innerText(), /Même numéro de téléphone/);
    await Promise.all([page.waitForNavigation(), page.click('a:has-text("Fusionner dans la fiche")')]);
    assert.match(await page.locator("body").innerText(), /Ce qui va se passer/);
    // la case est requise : sans elle, le navigateur bloque l'envoi
    await page.click('button:has-text("Fusionner")');
    assert.match(page.url(), /\/contacts\/fusion/);
    assert.equal(one("SELECT COUNT(*) n FROM mk_contact_merges").n, 0);
    await page.check('input[name="confirmer"]');
    await Promise.all([page.waitForNavigation(), page.click('button:has-text("Fusionner")')]);
    assert.equal(one("SELECT COUNT(*) n FROM mk_contact_merges").n, 1);
    assert.match(await page.locator(".mk-flash").innerText(), /rien n'a été supprimé/);
    assert.match(await page.locator("#coeur").innerText(), /conservées, archivées/);
  });

  test("sans le droit « données sensibles » : e-mail et téléphone masqués dans la liste et la fiche", async () => {
    const id = one("SELECT id FROM mk_contacts WHERE email = 'liste2@ex.fr'").id;
    db.prepare("UPDATE mk_contacts SET phone = '+33 6 11 22 33 44' WHERE id = ?").run(id);
    const page = await open(basic);
    await page.goto(`${C()}?q=Prénom2`);
    const html = await page.content();
    assert.doesNotMatch(html, /liste2@ex\.fr/); assert.match(html, /l•••@ex\.fr/);
    await page.goto(`${C()}/${id}`);
    const fiche = await page.content();
    assert.doesNotMatch(fiche, /liste2@ex\.fr|\+33 6 11 22 33 44/);
    assert.equal(await page.locator("#e-phone-m").inputValue(), "•••");
    assert.equal(await page.locator("#e-phone-m").isDisabled(), true);
  });

  test("responsive 1400 / 820 / 390 : aucun débordement horizontal ; champs étiquetés ; navigation clavier", async () => {
    const id = one("SELECT id FROM mk_contacts WHERE email = 'liste3@ex.fr'").id;
    for (const w of [1400, 820, 390]) {
      const page = await open(boss, w);
      for (const path of ["", `/${id}`, "/doublons", "/fusion?maitre=1&source=2", "/nouveau"]) {
        await page.goto(`${C()}${path}`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(over <= 1, `débordement ${over}px à ${w}px sur ${path || "/"}`);
      }
      await page.close();
    }
    const page = await open(boss);
    await page.goto(C());
    await openFilters(page);
    const unlabeled = await page.evaluate(() => [...document.querySelectorAll(".mk-filterbar input:not([type=hidden]), .mk-filterbar select")].filter((el) => !(el.labels && el.labels.length) && !el.getAttribute("aria-label")).map((el) => el.name || el.id));
    assert.deepEqual(unlabeled, []);
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => document.activeElement && document.activeElement !== document.body));
  });

  test("aucune erreur JavaScript pendant les parcours", () => { assert.deepEqual(errors, []); });
});
