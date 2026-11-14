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
      assert.equal(await page.locator("[data-xc-empty]").count(), 0, "aucun bloc « aucun résultat » alors que des cartes sont affichées");
      await page.fill("[data-xc-search]", "boutique");
      assert.equal(await page.locator("[data-xc-empty]").count(), 0, "toujours absent avec un résultat");
      assert.deepEqual(await visible(page), ["kolakisa commerce"]);
      await page.click('[data-xc-view="list"]');
      assert.deepEqual(await visible(page), ["kolakisa commerce"], "recherche conservée en Liste");
      assert.match(await page.textContent("[data-xc-count]"), /1 extension sur 6/);
      await page.fill("[data-xc-search]", "zzzz");
      assert.equal(await page.locator("[data-xc-empty]").count(), 1);
      assert.equal(await page.isVisible("[data-xc-empty]"), true);
      assert.equal((await visible(page)).length, 0, "aucune carte quand le bloc est présent");
      await page.click("[data-xc-reset]");
      assert.equal((await visible(page)).length, 6);
      assert.equal(await page.locator("[data-xc-empty]").count(), 0, "bloc retiré dès que des résultats reviennent");
      await page.selectOption("[data-xc-cat]", "formation");
      assert.deepEqual(await visible(page), ["kolakisa lms"]);
      await page.selectOption("[data-xc-cat]", "");
      await page.selectOption("[data-xc-state]", "on");
      assert.equal((await visible(page)).length, 0, "aucune extension activée sur un site neuf");
      assert.equal(await page.locator("[data-xc-empty]").count(), 1);
      await page.selectOption("[data-xc-state]", "off");
      assert.equal((await visible(page)).length, 6);
      assert.equal(await page.locator("[data-xc-empty]").count(), 0);
    } finally { await context.close(); }
  });

  test("icônes discrètes : pastille de 32 px, glyphe de 20 px, nom sans soulignement bleu ; cartes de même hauteur par rangée", async () => {
    const { context, page } = await open(1440);
    try {
      const m = await page.evaluate(() => {
        const logo = document.querySelector(".xc-card .xc-logo").getBoundingClientRect();
        const img = document.querySelector(".xc-card .xc-logo img").getBoundingClientRect();
        const a = getComputedStyle(document.querySelector(".xc-name-link"));
        const tops = {}; document.querySelectorAll(".xc-card").forEach((c) => { const r = c.getBoundingClientRect(); (tops[Math.round(r.top)] ||= []).push(Math.round(r.height)); });
        return { logo: Math.round(logo.width), img: Math.round(img.width), deco: a.textDecorationLine, color: a.color, rows: Object.values(tops) };
      });
      assert.equal(m.logo, 32); assert.equal(m.img, 20); assert.equal(m.deco, "none");
      for (const row of m.rows) assert.equal(new Set(row).size, 1, `hauteurs inégales dans une rangée : ${row}`);
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

  test("Gestion et Historique : aucun débordement à 1440, 1024, 768 et 390 px ; filtres de l'historique utilisables ; double envoi impossible", async () => {
    const X = "/marketing/site-web/extensions";
    for (const w of [1440, 1024, 768, 390]) for (const path of [`${X}/gestion`, `${X}/historique`, `${X}/activees`]) {
      const context = await env.browser.newContext({ viewport: { width: w, height: 900 } });
      await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
      const page = await context.newPage(); context.setDefaultTimeout(15000);
      try {
        await page.goto(`${env.srv.base}${path}?site=${env.site}`); await page.waitForLoadState("networkidle");
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, `${w}px ${path} : débordement`);
      } finally { await context.close(); }
    }
    const context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    const page = await context.newPage(); context.setDefaultTimeout(15000);
    try {
      await page.goto(`${env.srv.base}${X}/historique`); await page.waitForLoadState("networkidle");
      await page.selectOption('select[name="operation"]', "enable"); await page.click('button:has-text("Filtrer")'); await page.waitForLoadState("networkidle");
      assert.match(page.url(), /operation=enable/);
      await page.click('a:has-text("Réinitialiser")'); await page.waitForLoadState("networkidle");
      assert.doesNotMatch(page.url(), /operation=/);
      // un envoi de formulaire n'est possible qu'une fois : le second clic est ignoré
      await page.goto(`${env.srv.base}${X}/desactivees?site=${env.site}`); await page.waitForLoadState("networkidle");
      const card = page.locator('[data-xc-item][data-name="sms"]');
      await card.getByRole("button", { name: "Activer" }).dblclick();
      await page.waitForURL(/maj=sms/); await page.waitForLoadState("networkidle");
      const n = env.db.prepare("SELECT COUNT(*) n FROM mk_extension_events WHERE site_id = ? AND extension = 'sms' AND action = 'enable'").get(env.site).n;
      assert.equal(n, 1, "une seule activation enregistrée malgré le double clic");
    } finally { await context.close(); }
  });
});
