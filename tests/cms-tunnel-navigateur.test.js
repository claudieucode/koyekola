// KOLAKISA CMS — palier 18 : tunnel et pages CMS en vrai Chrome (parcours visiteur, détacher / créer, droits, responsive, accessibilité).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("tunnel ↔ pages CMS (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, orgId, errors, funnelId, p1, p2, restricted;
  const M = () => `${srv.base}/marketing`;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const open = async (client, width = 1280) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    if (client) await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  async function livePage(name, sections) {
    const r = await boss.post(`/marketing/pages`, { name, template: "" });
    const id = Number(String(r.location).match(/pages\/(\d+)/)[1]);
    const rev = one("SELECT revision FROM mk_landing_pages WHERE id = ?", id).revision;
    await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: name, description: "", sections } } });
    db.prepare("UPDATE mk_landing_pages SET indexable = 1 WHERE id = ?").run(id);
    await boss.post(`/marketing/pages/${id}/publier.json`, {});
    return { id, slug: one("SELECT slug FROM mk_landing_pages WHERE id = ?", id).slug };
  }
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    p1 = await livePage("Page vente", [{ type: "text", markdown: "Bienvenue sur la vente." }, { type: "button", label: "Je continue", url: "/etape-suivante", align: "center" }]);
    p2 = await livePage("Page merci", [{ type: "text", markdown: "Merci pour votre achat." }]);
    funnelId = Number(String((await boss.post(`/marketing/tunnels`, { name: "Tunnel Chrome" })).location).match(/tunnels\/(\d+)/)[1]);
    await boss.post(`/marketing/tunnels/${funnelId}/etapes`, { type: "sales", name: "Vente", source: "existante", page_id: p1.id });
    await boss.post(`/marketing/tunnels/${funnelId}/etapes`, { type: "thankyou", name: "Merci", source: "existante", page_id: p2.id });
    const r = await boss.post(`/marketing/site-web/utilisateurs/roles`, { name: "Tunnels sans pages", description: "t", perm: ["funnels.read", "funnels.write", "forms.read"] });
    assert.ok([200, 302].includes(r.status));
    restricted = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", restricted.email).id, one("SELECT key FROM mk_roles WHERE name = 'Tunnels sans pages'").key);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("parcours visiteur : la page CMS s'affiche, le bouton mène à l'étape suivante (la page merci, non indexée)", async () => {
    const page = await open(null);
    await page.goto(`${srv.base}/p/${p1.slug}`);
    assert.match(await page.locator("main").innerText(), /Bienvenue sur la vente/);
    await Promise.all([page.waitForNavigation(), page.click('a:has-text("Je continue")')]);
    assert.match(page.url(), new RegExp(`/p/${p2.slug}$`));
    assert.match(await page.locator("main").innerText(), /Merci pour votre achat/);
    assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex/);
  });

  test("tunnel : « Modifier la page dans KOLAKISA CMS » mène à l'éditeur existant ; détacher puis créer une page depuis l'étape", async () => {
    const page = await open(boss);
    await page.goto(`${M()}/tunnels/${funnelId}`);
    const href = await page.locator('a:has-text("Modifier la page dans KOLAKISA CMS")').first().getAttribute("href");
    assert.equal(href, `/marketing/pages/${p1.id}/editeur`);
    const step2 = one("SELECT id FROM mk_funnel_steps WHERE page_id = ?", p2.id).id;
    const row = page.locator(`#etape-${step2}`);
    await row.locator("summary").click();
    // le bouton demande une confirmation du design système ; on vérifie qu'elle s'ouvre, puis on envoie le formulaire lui-même
    await row.locator('button:has-text("Détacher la page")').click();
    assert.ok(await page.locator("dialog[open]").count() >= 1, "confirmation affichée avant de détacher");
    await page.keyboard.press("Escape");
    await Promise.all([page.waitForNavigation(), row.locator('form[action$="/detacher"]').evaluate((f) => f.submit())]);
    assert.equal(one("SELECT page_id FROM mk_funnel_steps WHERE id = ?", step2).page_id, null);
    assert.ok(one("SELECT 1 FROM mk_landing_pages WHERE id = ?", p2.id), "la page détachée existe toujours");
    assert.match(await page.locator(`#etape-${step2}`).innerText(), /Aucune page n.est associée/);
    await page.locator(`#etape-${step2} summary`).click();
    await Promise.all([page.waitForNavigation(), page.locator(`#etape-${step2} button:has-text("Créer avec KOLAKISA CMS")`).click()]);
    assert.match(page.url(), /\/marketing\/pages\/\d+\/editeur$/);
    assert.ok(one("SELECT page_id FROM mk_funnel_steps WHERE id = ?", step2).page_id);
  });

  test("droits croisés : gérer le tunnel sans pouvoir modifier les pages → bouton désactivé et expliqué", async () => {
    const page = await open(restricted);
    await page.goto(`${M()}/tunnels/${funnelId}`);
    const btn = page.locator('button:has-text("Modifier la page")').first();
    assert.equal(await btn.isDisabled(), true);
    assert.match(await page.locator("body").innerText(), /pas modifier ses pages/);
  });

  test("responsive 1400 / 820 / 390 : aucun débordement ; champs étiquetés ; aucune erreur JavaScript", async () => {
    for (const w of [1400, 820, 390]) {
      const page = await open(boss, w);
      for (const path of ["/tunnels", `/tunnels/${funnelId}`, "/pages"]) {
        await page.goto(`${M()}${path}`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(over <= 1, `débordement ${over}px à ${w}px sur ${path}`);
      }
      await page.close();
    }
    const page = await open(boss);
    await page.goto(`${M()}/tunnels/${funnelId}`);
    const unlabeled = await page.evaluate(() => [...document.querySelectorAll("form input:not([type=hidden]):not([type=checkbox]), form select")].filter((el) => !(el.labels && el.labels.length) && !el.getAttribute("aria-label")).map((el) => el.name || el.id));
    assert.deepEqual(unlabeled, []);
    assert.deepEqual(errors, []);
  });
});
