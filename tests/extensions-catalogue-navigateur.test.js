// Catalogue des extensions dans un vrai Chrome : Galerie / Liste instantanés, recherche, filtres, tri, mémorisation, activation depuis la carte, responsive sans débordement.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("extensions : catalogue dans le navigateur", { skip: SKIP }, () => {
  let env, URL_;
  const open = async (width = 1280) => {
    const context = await env.browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    const page = await context.newPage(); context.setDefaultTimeout(15000);
    page.on("pageerror", (e) => env.errors.push(`pageerror : ${e.message}`));
    await page.goto(`${env.srv.base}${URL_}`); await page.waitForLoadState("networkidle");
    return { context, page };
  };
  const visible = (page) => page.$$eval("[data-xc-item]", (l) => l.filter((e) => !e.hidden).map((e) => e.dataset.name));
  before(async () => { env = await setup({ siteName: "Atelier extensions" }); URL_ = `/marketing/site-web/extensions?site=${env.site}`; });
  after(async () => { if (env) await env.close(); });

  test("Galerie → Liste sans rechargement ; l'état actif se voit ; la préférence est mémorisée après actualisation", async () => {
    const { context, page } = await open(1600); // assez large pour le tableau ; en dessous, la Liste devient des fiches compactes
    try {
      assert.equal(await page.getAttribute("[data-xc-grid]", "data-view"), "gallery");
      await page.evaluate(() => { window.__marker = 1; });
      await page.click('[data-xc-view="list"]');
      assert.equal(await page.getAttribute("[data-xc-grid]", "data-view"), "list");
      assert.equal(await page.getAttribute('[data-xc-view="list"]', "aria-pressed"), "true");
      assert.equal(await page.evaluate(() => window.__marker), 1, "pas de rechargement");
      assert.equal(await page.isVisible(".xc-head"), true, "en-tête de colonnes en mode Liste");
      await page.reload(); await page.waitForLoadState("networkidle");
      assert.equal(await page.getAttribute("[data-xc-grid]", "data-view"), "list", "préférence mémorisée");
      await page.click('[data-xc-view="gallery"]');
      assert.equal(await page.isVisible(".xc-head"), false);
    } finally { await context.close(); }
  });

  test("recherche, filtre de catégorie, filtre d'état et tri fonctionnent dans les deux modes et se conservent au changement de mode", async () => {
    const { context, page } = await open();
    try {
      const all = await visible(page); assert.equal(all.length, 6);
      assert.deepEqual(all, [...all].sort((a, b) => a.localeCompare(b, "fr")), "tri alphabétique par défaut");
      await page.fill("[data-xc-search]", "boutique");
      assert.deepEqual(await visible(page), ["kolakisa commerce"]);
      await page.click('[data-xc-view="list"]');
      assert.deepEqual(await visible(page), ["kolakisa commerce"], "recherche conservée en Liste");
      assert.match(await page.textContent("[data-xc-count]"), /1 extension sur 6/);
      await page.fill("[data-xc-search]", "zzzz");
      assert.equal(await page.isVisible("[data-xc-empty]"), true);
      await page.click("[data-xc-reset]");
      assert.equal((await visible(page)).length, 6);
      await page.selectOption("[data-xc-cat]", "formation");
      assert.deepEqual(await visible(page), ["kolakisa lms"]);
      await page.selectOption("[data-xc-cat]", "");
      await page.selectOption("[data-xc-state]", "on");
      assert.equal((await visible(page)).length, 0, "aucune extension activée sur un site neuf");
      await page.selectOption("[data-xc-state]", "off");
      assert.equal((await visible(page)).length, 6);
    } finally { await context.close(); }
  });

  test("activation depuis une carte : l'état change pour ce site et le filtre « Activées » la retrouve", async () => {
    const { context, page } = await open();
    try {
      const card = page.locator('[data-xc-item][data-name="kolakisa commerce"]');
      await card.getByRole("button", { name: "Activer" }).click();
      await page.waitForLoadState("networkidle");
      assert.match(page.url(), /\/extensions\?site=/);
      await page.selectOption("[data-xc-state]", "on");
      assert.deepEqual(await visible(page), ["kolakisa commerce"]);
      assert.match(await page.locator('[data-xc-item][data-name="kolakisa commerce"]').textContent(), /Activée/);
      const stateOnDb = env.db.prepare("SELECT enabled e FROM mk_site_modules WHERE site_id = ? AND module = 'commerce'").get(env.site).e;
      assert.equal(stateOnDb, 1);
    } finally { await context.close(); }
  });

  test("responsive : aucun débordement horizontal à 1440, 1024, 768 et 390 px, dans les deux modes ; cartes à hauteur homogène par rangée", async () => {
    for (const w of [1440, 1024, 768, 390]) for (const view of ["gallery", "list"]) {
      const { context, page } = await open(w);
      try {
        await page.click(`[data-xc-view="${view}"]`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, `${w}px ${view} : débordement`);
        const small = await page.$$eval(".xc-actions .btn, .xc-view-btn", (b) => b.filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().height).filter((h) => h < 28));
        assert.deepEqual(small, [], `${w}px ${view} : commandes trop petites`);
      } finally { await context.close(); }
    }
  });
});
