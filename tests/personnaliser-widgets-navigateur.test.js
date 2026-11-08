// Personnaliser › Widgets : les zones se composent directement dans le panneau (ajout, réglages, ordre, retrait) ; l'enregistrement est tout-ou-rien avec contrôle de version
// (même route et même validation que l'écran Widgets) ; chaque site garde SES widgets. Ignoré sans Playwright / Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Personnaliser › Widgets : composition directe", { skip: SKIP }, () => {
  let env, siteB;
  const layoutOf = (siteId) => { const r = env.db.prepare("SELECT layout, revision FROM cms_widget_layouts WHERE site_id = ?").get(siteId); return r ? { layout: JSON.parse(r.layout), revision: r.revision } : null; };
  before(async () => {
    env = await setup({ siteName: "Site A" });
    siteB = Number((await env.boss.post("/marketing/site-web/sites", { name: "Site B" })).location.match(/sites\/(\d+)/)[1]);
    const rev = 0, secret = { zones: { sidebar: [], "footer-1": [{ id: "secretb00001", type: "heading", settings: { text: "Titre du site B", level: 3 } }], "footer-2": [] }, inactive: [] };
    const r = await env.boss.request(`/marketing/site-web/widgets/enregistrer?site=${siteB}`, { method: "POST", json: { site: String(siteB), layout: secret, revision: rev }, headers: env.origin });
    assert.equal(r.status, 200, r.text.slice(0, 200));
  });
  after(async () => { if (env) await env.close(); });

  test("dans le panneau : ajouter un titre au pied de page, le régler, ajouter un second widget, le monter, puis retirer le premier ; le tout est enregistré", async () => {
    const context = await env.browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    const page = await context.newPage();
    await page.goto(`${env.srv.base}/marketing/site-web/personnaliser?site=${env.site}`, { waitUntil: "load" });
    await page.waitForSelector("#pz-cats button, #pz-cats a");
    await page.locator("#pz-cats button, #pz-cats a", { hasText: /^Widgets/ }).first().click();
    await page.waitForSelector("#pz-detail-body select[aria-label='Zone']");
    const add = async (zone, type) => { await page.selectOption("#pz-detail-body select[aria-label='Zone']", zone); await page.selectOption("#pz-detail-body select[aria-label='Type de widget']", type); await page.locator("#pz-detail-body button", { hasText: "Ajouter à la zone" }).click(); };
    await add("footer-1", "heading");
    await page.waitForSelector("#pz-detail-body input[type=text]");
    await page.locator("#pz-detail-body li.kwc-menuitem input[type=text]").first().fill("Nos horaires");
    await add("footer-1", "paragraph");
    // monter le paragraphe (2e bloc de la zone 1)
    await page.locator('button[aria-label^="Monter « Paragraphe"]').click();
    const saved = () => page.waitForResponse((r) => /widgets\/enregistrer/.test(r.url()) && r.request().method() === "POST");
    let w = saved(); await page.locator("#pz-detail-body button", { hasText: "Enregistrer et publier les widgets" }).click(); assert.equal((await w).status(), 200);
    let a = layoutOf(env.site); assert.deepEqual(a.layout.zones["footer-1"].map((b) => b.type), ["paragraph", "heading"]);
    assert.equal(a.layout.zones["footer-1"][1].settings.text, "Nos horaires");
    // retirer le paragraphe puis enregistrer
    await page.locator('button[aria-label^="Retirer « Paragraphe"]').click();
    w = saved(); await page.locator("#pz-detail-body button", { hasText: "Enregistrer et publier les widgets" }).click(); assert.equal((await w).status(), 200);
    a = layoutOf(env.site); assert.deepEqual(a.layout.zones["footer-1"].map((b) => b.type), ["heading"]);
    await context.close();
  });

  test("isolation : le site B garde ses widgets ; la lecture depuis le site A ne montre jamais ceux du site B", async () => {
    const b = layoutOf(siteB); assert.equal(b.layout.zones["footer-1"][0].settings.text, "Titre du site B");
    const read = await env.boss.get(`/marketing/site-web/personnaliser/widgets?site=${env.site}`);
    assert.equal(read.status, 200);
    assert.doesNotMatch(read.text, /Titre du site B/);
    const readB = await env.boss.get(`/marketing/site-web/personnaliser/widgets?site=${siteB}`);
    assert.match(readB.text, /Titre du site B/);
  });

  test("version périmée : refus 409, rien n'est écrit ; bloc invalide : refusé, rien n'est écrit", async () => {
    const cur = layoutOf(env.site), before = JSON.stringify(cur.layout);
    const stale = await env.boss.request(`/marketing/site-web/widgets/enregistrer?site=${env.site}`, { method: "POST", json: { site: String(env.site), layout: cur.layout, revision: cur.revision - 1 }, headers: env.origin });
    assert.equal(stale.status, 409, stale.text.slice(0, 200));
    const bad = JSON.parse(before); bad.zones["footer-2"] = [{ id: "badblock0001", type: "nexistepas", settings: {} }];
    const refused = await env.boss.request(`/marketing/site-web/widgets/enregistrer?site=${env.site}`, { method: "POST", json: { site: String(env.site), layout: bad, revision: cur.revision }, headers: env.origin });
    assert.equal(refused.status, 400, refused.text.slice(0, 200));
    assert.equal(JSON.stringify(layoutOf(env.site).layout), before, "rien n'a changé");
  });
});
