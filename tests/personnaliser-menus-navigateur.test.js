// Personnaliser › Menus : un menu se modifie directement dans le panneau (texte, adresse, ordre, retrait, ajout, emplacement) ; chaque action est écrite par le serveur
// (mêmes fonctions que l'écran Navigation) et le site vient de l'adresse vérifiée : un menu d'un AUTRE site est introuvable et reste intact. Ignoré sans Playwright / Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Personnaliser › Menus : modification directe", { skip: SKIP }, () => {
  let env, siteB, menuA, menuB;
  const items = (menu) => env.db.prepare("SELECT id, label, url, position FROM nav_items WHERE menu_id = ? ORDER BY position, id").all(menu);
  const makeMenu = async (site, name, labels) => {
    const c = await env.boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name });
    const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const rev = env.db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    const r = await env.boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: rev, status: "published", items: labels.map((l, i) => ({ type: "custom", label: l, url: `/${l.toLowerCase()}` })) }, headers: env.origin });
    assert.equal(r.status, 200, r.text.slice(0, 200));
    return mid;
  };
  before(async () => {
    env = await setup({ siteName: "Site A" });
    siteB = Number((await env.boss.post("/marketing/site-web/sites", { name: "Site B" })).location.match(/sites\/(\d+)/)[1]);
    menuA = await makeMenu(env.site, "Menu A", ["Alpha", "Beta", "Gamma"]);
    menuB = await makeMenu(siteB, "Menu B", ["Secret"]);
  });
  after(async () => { if (env) await env.close(); });

  const post = (path, siteId, json) => env.boss.request(`/marketing/site-web/personnaliser${path}?site=${siteId}`, { method: "POST", json: { site: String(siteId), ...json }, headers: env.origin });

  test("dans le panneau : renommer, monter, retirer et ajouter un lien ; les changements sont écrits et le menu relu est celui du serveur", async () => {
    const context = await env.browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    const page = await context.newPage();
    await page.goto(`${env.srv.base}/marketing/site-web/personnaliser?site=${env.site}`, { waitUntil: "load" });
    await page.waitForSelector("#pz-cats button, #pz-cats a");
    await page.locator("#pz-cats button, #pz-cats a", { hasText: /^Menus/ }).first().click();
    await page.locator("#pz-detail-body button", { hasText: "Modifier" }).first().click();
    await page.waitForSelector(".kwc-menuitem");
    // renommer « Beta » en « Bêta »
    const row = page.locator(".kwc-menuitem", { has: page.locator('input[value="Beta"]') });
    const done = () => page.waitForResponse((r) => /\/menus\/\d+\/element/.test(r.url()) && r.request().method() === "POST");
    let w = done();
    await row.locator('input[aria-label="Texte du lien"]').fill("Bêta"); await row.locator('input[aria-label="Texte du lien"]').blur(); assert.equal((await w).status(), 200);
    assert.deepEqual(items(menuA).map((i) => i.label), ["Alpha", "Bêta", "Gamma"]);
    // monter « Gamma »
    w = done(); await page.locator('button[aria-label^="Monter « Gamma"]').click(); assert.equal((await w).status(), 200);
    assert.deepEqual(items(menuA).map((i) => i.label), ["Alpha", "Gamma", "Bêta"]);
    // retirer « Alpha »
    w = done(); await page.locator('button[aria-label^="Retirer « Alpha"]').click(); assert.equal((await w).status(), 200);
    assert.deepEqual(items(menuA).map((i) => i.label), ["Gamma", "Bêta"]);
    // ajouter un lien
    await page.fill('input[aria-label="Texte du nouveau lien"]', "Contact"); await page.fill('input[aria-label="Adresse du nouveau lien"]', "/contact");
    w = done(); await page.locator("button", { hasText: "Ajouter au menu" }).click(); assert.equal((await w).status(), 200);
    assert.deepEqual(items(menuA).map((i) => [i.label, i.url]).pop(), ["Contact", "/contact"]);
    await context.close();
  });

  test("emplacement : cocher « En-tête du site » assigne ce menu à CE site seulement", async () => {
    const r = await post(`/menus/${menuA}/emplacement`, env.site, { key: "header", on: true });
    assert.equal(r.status, 200, r.text.slice(0, 200));
    assert.equal(env.db.prepare("SELECT menu_id FROM nav_locations WHERE site_id = ? AND location = 'header'").get(env.site).menu_id, menuA);
    assert.equal(env.db.prepare("SELECT COUNT(*) n FROM nav_locations WHERE site_id = ?").get(siteB).n, 0, "le site B n'a reçu aucun emplacement");
    const off = await post(`/menus/${menuA}/emplacement`, env.site, { key: "header", on: false });
    assert.equal(off.status, 200);
    assert.equal(env.db.prepare("SELECT COUNT(*) n FROM nav_locations WHERE site_id = ? AND location = 'header'").get(env.site).n, 0);
  });

  test("isolation : depuis le site A, le menu du site B est introuvable (lecture, modification, retrait, emplacement) et reste intact", async () => {
    const before = JSON.stringify(items(menuB));
    const get = await env.boss.get(`/marketing/site-web/personnaliser/menus/${menuB}?site=${env.site}`);
    assert.equal(get.status, 404);
    const idB = items(menuB)[0].id;
    for (const body of [{ action: "update", id: idB, label: "Piraté" }, { action: "remove", id: idB }, { action: "add", label: "X", url: "/x" }]) {
      const r = await post(`/menus/${menuB}/element`, env.site, body);
      assert.equal(r.status, 404, JSON.stringify(body));
    }
    assert.equal((await post(`/menus/${menuB}/emplacement`, env.site, { key: "header", on: true })).status, 404);
    assert.equal(JSON.stringify(items(menuB)), before, "le menu du site B n'a pas changé");
    // un élément du menu B désigné avec le menu A : refusé aussi
    const cross = await post(`/menus/${menuA}/element`, env.site, { action: "remove", id: idB });
    assert.equal(cross.status, 404);
    assert.equal(items(menuB).length, 1);
  });

  test("valeurs refusées par le serveur : lien sans texte, action inconnue, emplacement inconnu", async () => {
    const r1 = await post(`/menus/${menuA}/element`, env.site, { action: "add", label: "", url: "/x" }); assert.equal(r1.status, 400, r1.text.slice(0, 200)); assert.match(r1.text, /Donnez un texte/);
    assert.equal((await post(`/menus/${menuA}/element`, env.site, { action: "nimporte", id: items(menuA)[0].id })).status, 422);
    assert.equal((await post(`/menus/${menuA}/emplacement`, env.site, { key: "inconnu", on: true })).status, 422);
  });
});
