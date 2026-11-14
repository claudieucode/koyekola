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
    const pid = env.db.prepare("SELECT id FROM mk_shop_products ORDER BY id LIMIT 1").get().id;
    await env.boss.post(`${B}/commandes`, { line_1: `${pid}:`, qty_1: "2", email: "awa@exemple.fr", name: "Awa", line1: "12 rue des Lilas", postal_code: "75011", city: "Paris", country: "FR" });
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

  test("mobile (390 px) : pas de débordement, sélecteur de rubrique compact, tableau en fiches étiquetées, formulaires sur une colonne", async () => {
    for (const path of ["", "/reglages", "/classes", "/categories", "/commandes/nouvelle"]) {
      const { context, page } = await open(path, 390);
      try {
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, `${path} : débordement horizontal à 390 px`);
        const nav = await page.evaluate(() => { const side = document.querySelector("[data-bq-side]"); const t = side.querySelector("[data-bq-toggle]"); const list = side.querySelector(".bq-side-nav"); return { toggle: getComputedStyle(t).display !== "none", closed: getComputedStyle(list).display === "none", label: t.textContent.trim(), h: Math.round(side.getBoundingClientRect().height) }; });
        assert.equal(nav.toggle, true, `${path} : sélecteur compact visible`); assert.equal(nav.closed, true, `${path} : liste repliée par défaut`); assert.match(nav.label, /^Boutique · /); assert.ok(nav.h < 80, `${path} : barre compacte (${nav.h}px)`);
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
    const { context, page } = await open("/reglages", 1440);
    try {
      const m = await page.evaluate(() => { const w = (s) => Math.round(document.querySelector(s).getBoundingClientRect().width); const lefts = ["#r-cur", "#r-cty", "#r-pre", "#r-low"].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().left)); return { cur: w("#r-cur"), panel: w("#general"), cols: new Set(lefts).size }; });
      assert.ok(m.cur < m.panel * 0.55, `devise trop large : ${m.cur} / ${m.panel}`); assert.equal(m.cols, 2, `champs courts sur ${m.cols} colonnes (2 attendues : paires équilibrées, sans ligne orpheline)`);
    } finally { await context.close(); }
  });

  test("trois colonnes sur bureau : menu du CMS · barre de la boutique · contenu ; aucune navigation horizontale", async () => {
    const { context, page } = await open("/commandes", 1440);
    try {
      const g = await page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const side = r(".bq-side"), main = r(".mk-content > .mk-head"), cms = document.querySelector("#mk-sidebar, .mk-sidebar, nav.mk-nav") ? (document.querySelector("#mk-sidebar") || document.querySelector(".mk-sidebar") || document.querySelector("nav.mk-nav")).getBoundingClientRect() : null; return { sideL: side.left, sideR: side.right, sideW: side.width, mainL: main.left, cmsR: cms ? cms.right : null, horiz: document.querySelectorAll("nav.bq-tabs, .mk-content > nav.mk-tabs").length }; });
      assert.ok(g.sideW >= 200 && g.sideW <= 280, `largeur de la barre : ${g.sideW}`); assert.ok(g.mainL >= g.sideR, "le contenu est à droite de la barre");
      if (g.cmsR != null) assert.ok(g.sideL >= g.cmsR - 1, "la barre vient après le menu principal du CMS");
      assert.equal(g.horiz, 0, "plus de navigation horizontale");
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".bq-link")).textDecorationLine), "none");
    } finally { await context.close(); }
  });

  test("les 14 rubriques : clic réel, bonne adresse, rubrique active, rechargement et retour du navigateur", async () => {
    const ROUTES = [["Produits", ""], ["Catégories", "/categories"], ["Avis", "/avis"], ["Commandes", "/commandes"], ["Clients", "/clients"], ["Abonnements", "/abonnements"], ["Rendez-vous", "/rendez-vous"], ["Listes cadeaux", "/listes-cadeaux"], ["Rapports", "/rapports"], ["Factures", "/factures"], ["Accès membre", "/acces"], ["Taxes et expédition", "/classes"], ["Paiements", "/paiements"], ["Réglages", "/reglages"]];
    const { context, page } = await open("", 1440);
    try {
      const visited = [];
      for (const [label, path] of ROUTES) {
        await Promise.all([page.waitForNavigation(), page.click(`.bq-side-nav a.bq-link:has(.bq-label:text-is("${label}"))`)]);
        assert.equal(new URL(page.url()).pathname, `${B}${path}`, `${label} : adresse`);
        assert.equal(await page.textContent('.bq-link[aria-current="page"] .bq-label'), label, `${label} : rubrique active`);
        assert.equal(await page.locator(".bq-link").count(), 14, `${label} : barre complète`);
        assert.ok((await page.textContent(".mk-head h1")).length > 2, `${label} : titre`);
        visited.push(label);
      }
      assert.equal(visited.length, 14);
      // rechargement : on retrouve la rubrique de l'adresse
      await page.reload(); await page.waitForLoadState("networkidle");
      assert.equal(await page.textContent('.bq-link[aria-current="page"] .bq-label'), "Réglages");
      // retour puis avance du navigateur
      await page.goBack(); await page.waitForLoadState("networkidle");
      assert.equal(await page.textContent('.bq-link[aria-current="page"] .bq-label'), "Paiements");
      await page.goBack(); await page.waitForLoadState("networkidle");
      assert.equal(await page.textContent('.bq-link[aria-current="page"] .bq-label'), "Taxes et expédition");
      await page.goForward(); await page.waitForLoadState("networkidle");
      assert.equal(await page.textContent('.bq-link[aria-current="page"] .bq-label'), "Paiements");
    } finally { await context.close(); }
  });

  test("mobile : le sélecteur s'ouvre, liste les 14 rubriques, se ferme avec Échap et mène à la rubrique choisie", async () => {
    const { context, page } = await open("/reglages", 390);
    try {
      const toggle = page.locator("[data-bq-toggle]");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      await toggle.click();
      assert.equal(await toggle.getAttribute("aria-expanded"), "true");
      assert.equal(await page.locator(".bq-side-nav .bq-link:visible").count(), 14);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false);
      await page.keyboard.press("Escape");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      await toggle.click();
      await Promise.all([page.waitForNavigation(), page.click('.bq-side-nav a.bq-link:has(.bq-label:text-is("Clients"))')]);
      assert.equal(new URL(page.url()).pathname, `${B}/clients`);
      assert.match(await page.textContent("[data-bq-toggle]"), /Boutique · Clients/);
    } finally { await context.close(); }
  });

  test("espacements : même écart entre cartes (24 px), même padding (24 px), étiquette à 6 px de son champ — sur plusieurs écrans", async () => {
    for (const path of ["/rapports", "/reglages", "/classes", "/commandes/1", "/produits/1", "/paiements"]) {
      const { context, page } = await open(path, 1440);
      try {
        const m = await page.evaluate(() => {
          const panels = [...document.querySelectorAll(".mk-content > .mk-panel, .mk-content > form > .mk-panel")].filter((e) => e.offsetParent);
          const gaps = []; for (let i = 1; i < panels.length; i++) { const a = panels[i - 1].getBoundingClientRect(), b = panels[i].getBoundingClientRect(); if (panels[i - 1].nextElementSibling === panels[i]) gaps.push(Math.round(b.top - a.bottom)); }
          const pads = panels.map((e) => parseFloat(getComputedStyle(e).paddingLeft));
          const lab = [...document.querySelectorAll(".mk-panel .field-group > label")].filter((l) => l.nextElementSibling && /^(INPUT|SELECT|TEXTAREA)$/.test(l.nextElementSibling.tagName) && !l.querySelector("input")).slice(0, 12).map((l) => Math.round(l.nextElementSibling.getBoundingClientRect().top - l.getBoundingClientRect().bottom));
          return { n: panels.length, gaps, pads, lab };
        });
        assert.ok(m.n >= 1, `${path} : cartes trouvées`);
        for (const g of m.gaps) assert.ok(g >= 23 && g <= 25, `${path} : écart entre cartes ${g}px`);
        for (const x of m.pads) assert.equal(x, 24, `${path} : padding de carte`);
        for (const g of m.lab) assert.ok(g >= 4 && g <= 8, `${path} : étiquette → champ ${g}px`);
      } finally { await context.close(); }
    }
  });

  test("indicateurs : une carte chacune, hauteurs égales, aucune carte orpheline à 1440, 1024 et 390 px", async () => {
    for (const width of [1440, 1024, 390]) {
      const { context, page } = await open("/rapports", width);
      try {
        const g = await page.evaluate(() => [...document.querySelectorAll(".bq-stat-group")].map((grp) => {
          const cards = [...grp.querySelectorAll(".bq-stat")].map((c) => { const r = c.getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), bg: getComputedStyle(c).backgroundColor }; });
          return { cards, container: getComputedStyle(grp.querySelector(".bq-stats")).backgroundColor };
        }));
        assert.equal(g.length, 3);
        assert.deepEqual(g.map((x) => x.cards.length), [4, 4, 3]);
        for (const grp of g) {
          assert.ok(grp.cards.every((c) => c.h === grp.cards[0].h), `${width}px : hauteurs égales`);
          assert.equal(grp.container, "rgba(0, 0, 0, 0)", "pas de fond englobant");
          const rows = {}; for (const c of grp.cards) (rows[c.top] = rows[c.top] || []).push(c);
          const sizes = Object.values(rows).map((r) => r.length);
          // une ligne plus courte que les autres n'est admise que si sa carte occupe toute la largeur (3 cartes sur 2 colonnes)
          if (new Set(sizes).size > 1) { const short = Object.values(rows).find((r) => r.length < Math.max(...sizes)); const full = Math.max(...grp.cards.map((c) => c.w)); assert.ok(short.length === 1 && short[0].w >= full - 1 && sizes.length > 1 && short === Object.values(rows).slice(-1)[0], `${width}px : carte orpheline ${JSON.stringify(sizes)}`); }
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false);
      } finally { await context.close(); }
    }
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
