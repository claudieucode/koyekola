// Refonte de l'administration de la boutique, dans un vrai Chrome : champs à hauteur normale (plus de champs de 180 px), aucun débordement de page,
// navigation secondaire qui défile sur mobile avec l'onglet actif visible, tableaux en fiches sur mobile, formulaire réellement envoyé depuis l'interface, focus visible.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("boutique : interface dans le navigateur", { skip: SKIP }, () => {
  let env, B, ctx;
  const open = async (path, width = 1280) => {
    const context = await env.browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    const page = await context.newPage(); context.setDefaultTimeout(15000);
    page.on("pageerror", (e) => env.errors.push(`pageerror : ${e.message}`));
    await page.goto(`${env.srv.base}${B}${path}`); await page.waitForLoadState("networkidle");
    return { context, page };
  };
  before(async () => {
    env = await setup({ siteName: "Atelier navigateur" });
    B = `/marketing/site-web/sites/${env.site}/boutique`;
    env.db.prepare("INSERT OR REPLACE INTO mk_site_modules (organization_id, site_id, module, enabled) VALUES (1, ?, 'commerce', 1)").run(env.site);
    await env.boss.post(`${B}/reglages`, { enabled: "1", currency: "eur", default_country: "FR", order_prefix: "CMD", low_stock_threshold: "3", payment_methods: ["manual"] });
    for (const n of ["Tasse en grès", "Plaid en lin"]) await env.boss.post(`${B}/produits`, { name: n, price: "18,00", status: "published", type: "simple" });
    await env.boss.post(`${B}/livraison/zones`, { name: "France", countries: "FR" });
  });
  after(async () => { if (env) await env.close(); });

  test("aucun champ à hauteur disproportionnée, aucun débordement de page, sur les écrans signalés (produits, commandes, clients, réglages, taxes)", async () => {
    for (const path of ["", "/commandes", "/clients", "/reglages", "/classes", "/paiements", "/commandes/nouvelle"]) {
      const { context, page } = await open(path);
      try {
        const bad = await page.evaluate(() => [...document.querySelectorAll(".mk-content input:not([type=hidden]):not([type=checkbox]):not([type=radio]), .mk-content select:not([multiple])")]
          .filter((e) => e.offsetParent !== null).map((e) => ({ id: e.id || e.name, h: Math.round(e.getBoundingClientRect().height) })).filter((x) => x.h > 60 || x.h < 28));
        assert.deepEqual(bad, [], `${path} : champs de hauteur anormale`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, `${path} : débordement horizontal`);
      } finally { await context.close(); }
    }
  });

  test("mobile (390 px) : pas de débordement, navigation défilante avec l'onglet actif visible, tableau en fiches étiquetées, formulaires sur une colonne", async () => {
    for (const path of ["", "/reglages", "/classes", "/categories", "/commandes/nouvelle"]) {
      const { context, page } = await open(path, 390);
      try {
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, `${path} : débordement horizontal à 390 px`);
        const nav = await page.evaluate(() => { const n = document.querySelector("[data-bq-tabs]"); const a = n.querySelector('[aria-current="page"]'); const nb = n.getBoundingClientRect(), ab = a.getBoundingClientRect(); return { scroll: n.scrollWidth > n.clientWidth, visible: ab.left >= nb.left - 1 && ab.right <= nb.right + 1 }; });
        assert.equal(nav.scroll, true, `${path} : la navigation défile`); assert.equal(nav.visible, true, `${path} : onglet actif visible`);
      } finally { await context.close(); }
    }
    const { context, page } = await open("", 390);
    try {
      const card = await page.evaluate(() => { const td = document.querySelector(".mk-shop table.mk-table tbody td[data-label]"); const th = document.querySelector(".mk-shop table.mk-table thead"); return { label: td && td.getAttribute("data-label"), display: td && getComputedStyle(td).display, headHidden: th && th.getBoundingClientRect().height <= 1 }; });
      assert.ok(card.label, "étiquette de cellule posée"); assert.equal(card.display, "flex"); assert.equal(card.headHidden, true);
    } finally { await context.close(); }
    const r = await open("/reglages", 390);
    try {
      const cols = await r.page.evaluate(() => new Set([...document.querySelectorAll("#general input[type=text]")].map((e) => Math.round(e.getBoundingClientRect().left))).size);
      assert.equal(cols, 1, "une seule colonne de champs sur mobile");
    } finally { await r.context.close(); }
  });

  test("bureau : les champs courts se rangent en grille (Réglages), sans s'étirer sur toute la largeur", async () => {
    const { context, page } = await open("/reglages");
    try {
      const m = await page.evaluate(() => { const w = (s) => Math.round(document.querySelector(s).getBoundingClientRect().width); const lefts = ["#r-cur", "#r-cty", "#r-pre", "#r-low"].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().left)); return { cur: w("#r-cur"), panel: w("#general"), cols: new Set(lefts).size }; });
      assert.ok(m.cur < m.panel / 2, `devise trop large : ${m.cur} / ${m.panel}`); assert.ok(m.cols >= 3, `champs courts sur ${m.cols} colonnes`);
    } finally { await context.close(); }
  });

  test("un formulaire envoie vraiment ses données depuis l'interface (nouvelle catégorie), la liste se met à jour", async () => {
    const { context, page } = await open("/categories");
    try {
      await page.fill("#c-n", "Linge de maison");
      await Promise.all([page.waitForNavigation(), page.click('form[action$="/categories"] button[type=submit]')]);
      assert.match(await page.textContent(".mk-content"), /Linge de maison/);
      assert.equal(env.db.prepare("SELECT COUNT(*) n FROM mk_shop_categories WHERE name = 'Linge de maison'").get().n, 1);
    } finally { await context.close(); }
  });

  test("filtre et recherche réels depuis l'interface ; focus clavier visible", async () => {
    const { context, page } = await open("");
    try {
      await page.fill("#p-q", "plaid");
      await Promise.all([page.waitForNavigation(), page.press("#p-q", "Enter")]);
      const txt = await page.textContent(".mk-content table");
      assert.match(txt, /Plaid en lin/); assert.doesNotMatch(txt, /Tasse en grès/);
      await page.focus("#p-q");
      assert.notEqual(await page.evaluate(() => getComputedStyle(document.querySelector("#p-q")).boxShadow), "none", "anneau de focus");
    } finally { await context.close(); }
    assert.deepEqual(env.errors, []);
  });
});
