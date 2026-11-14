// Refonte de l'interface d'administration de la boutique : chaque écran répond, porte le socle commun (feuille de styles, navigation secondaire, états vides),
// aucun champ sans attribut type (ils échappaient au style du CMS), filtres et pagination réels, menu latéral du site pour tous les écrans.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

describe("boutique : socle visuel de l'administration", () => {
  let srv, boss, db, site, B;
  const post = (p, body) => boss.post(`${B}${p}`, body);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Atelier" })).location.match(/sites\/(\d+)/)[1]);
    B = `/marketing/site-web/sites/${site}/boutique`;
    db.prepare("INSERT OR REPLACE INTO mk_site_modules (organization_id, site_id, module, enabled) VALUES (1, ?, 'commerce', 1)").run(site);
    assert.equal((await post("/reglages", { enabled: "1", currency: "eur", default_country: "FR", order_prefix: "CMD", low_stock_threshold: "3", payment_methods: ["manual"] })).status, 302);
    for (const n of ["Tasse en grès", "Plaid en lin", "Bougie ambrée"]) assert.equal((await post("/produits", { name: n, price: "12,00", status: "published", type: "simple" })).status, 302);
    await post("/livraison/zones", { name: "France", countries: "FR" });
    await post("/coupons", { code: "BIENVENUE", kind: "percent", value: "10" });
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  const ROUTES = ["", "/categories", "/avis", "/rendez-vous", "/rendez-vous/reglages", "/listes-cadeaux", "/abonnements", "/commandes", "/commandes/nouvelle", "/rapports", "/factures", "/acces", "/clients", "/classes", "/paiements", "/reglages", "/produits/nouveau"];

  test("chaque écran répond, porte le socle (feuille, script, barre latérale verticale) et marque une seule rubrique active", async () => {
    for (const path of ROUTES) {
      const r = await boss.get(`${B}${path}`);
      assert.equal(r.status, 200, `${path} : ${r.status}`);
      assert.match(r.text, /<body class="mk-body[^"]*\bmk-shop\b/, `${path} : classe mk-shop`);
      assert.match(r.text, /\/css\/shop-admin\.css/, `${path} : feuille de styles de la boutique`);
      assert.match(r.text, /\/js\/shop-admin\.js/, `${path} : script`);
      const nav = r.text.match(/<nav class="bq-side-nav"[^]*?<\/nav>/);
      assert.ok(nav, `${path} : barre latérale de la boutique`);
      assert.equal((nav[0].match(/class="bq-link"/g) || []).length, 14, `${path} : 14 rubriques conservées`);
      assert.equal((nav[0].match(/aria-current="page"/g) || []).length, 1, `${path} : une seule rubrique active`);
      assert.doesNotMatch(r.text, /class="mk-tabs bq-tabs"/, `${path} : plus de navigation horizontale`);
    }
  });

  test("toutes les rubriques d'origine restent atteignables", async () => {
    const nav = (await boss.get(`${B}`)).text.match(/<nav class="bq-side-nav"[^]*?<\/nav>/)[0];
    const order = [...nav.matchAll(/<span class="bq-label">([^<]+)<\/span>/g)].map((m) => m[1]);
    assert.deepEqual(order, ["Produits", "Catégories", "Avis", "Commandes", "Clients", "Abonnements", "Rendez-vous", "Listes cadeaux", "Rapports", "Factures", "Accès membre", "Taxes et expédition", "Paiements", "Réglages"], "ordre et libellés d'origine");
    for (const label of ["Produits", "Catégories", "Avis", "Rendez-vous", "Listes cadeaux", "Abonnements", "Commandes", "Rapports", "Factures", "Accès membre", "Clients", "Taxes et expédition", "Paiements", "Réglages"]) assert.match(nav, new RegExp(`<span class="bq-label">${label}</span>`), label);
    for (const path of ["/categories", "/avis", "/rendez-vous", "/listes-cadeaux", "/abonnements", "/commandes", "/rapports", "/factures", "/acces", "/clients", "/classes", "/paiements", "/reglages"]) assert.ok(nav.includes(`href="${B}${path}"`), path);
  });

  test("onglet actif exact : Catégories, Taxes et expédition, Paiements", async () => {
    const active = async (path) => (await boss.get(`${B}${path}`)).text.match(/<a class="bq-link" href="[^"]*" aria-current="page"><span class="bq-ico"[^]*?<span class="bq-label">([^<]+)<\/span>/)[1];
    assert.equal(await active(""), "Produits"); assert.equal(await active("/categories"), "Catégories");
    assert.equal(await active("/classes"), "Taxes et expédition"); assert.equal(await active("/paiements"), "Paiements"); assert.equal(await active("/reglages"), "Réglages");
  });

  test("aucun champ sans attribut type (ils échappaient aux styles du CMS) sur les écrans de la boutique", async () => {
    for (const path of [...ROUTES, "/produits/1", "/coupons/1"]) {
      const html = (await boss.get(`${B}${path}`)).text;
      const main = html.slice(html.indexOf('class="mk-content'));
      const bare = (main.match(/<input(?![^>]*\stype=)[^>]*>/g) || []);
      assert.deepEqual(bare, [], `${path} : champs sans type`);
    }
  });

  test("les écrans rattachés au menu du site gardent le menu latéral du site (Boutique) et non celui du Marketing", async () => {
    for (const path of ["/classes", "/paiements", "/factures", "/rapports", "/avis", "/acces", "/abonnements", "/rendez-vous", "/listes-cadeaux"]) {
      const html = (await boss.get(`${B}${path}`)).text;
      assert.match(html, /Réglages de la boutique/, `${path} : menu du site`);
      assert.match(html, /Vous êtes dans le site/, `${path} : bandeau du site`);
    }
  });

  test("états vides : titre et aide ; filtres et recherche réels ; pagination conserve la recherche", async () => {
    const orders = (await boss.get(`${B}/commandes`)).text;
    assert.match(orders, /class="mk-empty bq-empty"/); assert.match(orders, /<h3>Aucune commande<\/h3>/);
    const filtered = (await boss.get(`${B}/commandes?q=zzz`)).text;
    assert.match(filtered, /Aucune commande ne correspond/); assert.match(filtered, /Voir toutes les commandes/);
    const all = (await boss.get(`${B}`)).text;
    for (const n of ["Tasse en grès", "Plaid en lin", "Bougie ambrée"]) assert.match(all, new RegExp(n));
    const q = (await boss.get(`${B}?q=plaid`)).text;
    assert.match(q, /Plaid en lin/); assert.doesNotMatch(q, /Tasse en grès/);
    const none = (await boss.get(`${B}?q=introuvable`)).text;
    assert.match(none, /Aucun produit ne correspond/);
    const draft = (await boss.get(`${B}?statut=draft`)).text;
    assert.match(draft, /Aucun produit ne correspond/);
  });

  test("pagination : au-delà d'une page, les liens conservent la recherche et marquent la page courante", async () => {
    for (let i = 1; i <= 27; i++) await post("/produits", { name: `Lot ${String(i).padStart(2, "0")}`, price: "5,00", status: "published", type: "simple" });
    const p1 = (await boss.get(`${B}?q=lot`)).text;
    assert.match(p1, /class="mk-pager bq-pager"/); assert.match(p1, /href="\?q=lot&amp;page=2"/); assert.match(p1, /aria-current="page">1</);
    const p2 = (await boss.get(`${B}?q=lot&page=2`)).text;
    assert.match(p2, /aria-current="page">2</); assert.match(p2, /rel="prev"/);
    assert.match(p2, /Lot 01/); assert.doesNotMatch(p2, /Lot 27/); /* tri : les plus récents d'abord */
  });

  test("Rapports : une carte par indicateur (11), regroupées en 3 groupes équilibrés, valeurs issues des vraies données", async () => {
    await post("/commandes", { line_1: `${db.prepare("SELECT id FROM mk_shop_products WHERE name = 'Tasse en grès'").get().id}:`, qty_1: "2", email: "stat@exemple.fr", name: "Stat", line1: "1 rue", postal_code: "75001", city: "Paris", country: "FR" });
    const html = (await boss.get(`${B}/rapports`)).text;
    const section = html.match(/<section class="bq-stats-section"[^]*?<\/section>/)[0];
    assert.equal((section.match(/class="bq-stat"/g) || []).length, 11, "11 indicateurs");
    assert.deepEqual([...section.matchAll(/class="bq-stat-group-title">([^<]+)</g)].map((m) => m[1]), ["Ventes", "Activité", "Frais et remises"]);
    const counts = [...section.matchAll(/<dl class="bq-stats">([^]*?)<\/dl>/g)].map((m) => (m[1].match(/class="bq-stat"/g) || []).length);
    assert.deepEqual(counts, [4, 4, 3]);
    for (const label of ["Ventes brutes", "Remboursé", "Ventes nettes", "Panier moyen", "Commandes payées", "Articles vendus", "Nouveaux clients", "Commandes à traiter", "Taxes", "Livraison facturée", "Remises accordées"]) assert.match(section, new RegExp(`<dt>${label}</dt><dd>`), label);
    assert.doesNotMatch(html, /<dl class="mk-stats"/, "plus de conteneur englobant");
    // les chiffres viennent de la base : la commande créée ci-dessus compte parmi « Commandes à traiter » / « Nouveaux clients »
    assert.match(section, /<dt>Nouveaux clients<\/dt><dd>1<\/dd>/);
  });

  test("Paniers abandonnés : champ court, case sur sa ligne, bouton sous les champs ; la sauvegarde fonctionne", async () => {
    const html = (await boss.get(`${B}/rapports`)).text;
    assert.match(html, /<form class="mk-form bq-cart-form"/);
    assert.equal((await post("/rapports/paniers", { minutes: "45", reminder: "1" })).status, 302);
    const after = (await boss.get(`${B}/rapports`)).text;
    assert.match(after, /name="minutes" inputmode="numeric" value="45"/); assert.match(after, /name="reminder" value="1" checked/);
  });

  test("fiche commande : résumé en faits, totaux, actions de statut et historique en colonnes (mêmes données, mêmes formulaires)", async () => {
    const id = db.prepare("SELECT id FROM mk_shop_orders ORDER BY id DESC LIMIT 1").get().id;
    const html = (await boss.get(`${B}/commandes/${id}`)).text;
    assert.match(html, /class="bq-facts"/); assert.match(html, /class="bq-totals"/); assert.match(html, /class="bq-total"/);
    assert.match(html, /class="mk-form bq-action" method="post" action="[^"]*\/commandes\/\d+\/statut"/);
    assert.match(html, /class="mk-list bq-timeline"/);
  });

  test("tableaux : classe de repli mobile et colonnes d'actions séparées (clients)", async () => {
    const html = (await boss.get(`${B}`)).text;
    assert.match(html, /<table class="mk-table">/);
    const cl = (await boss.get(`${B}/clients`)).text; assert.match(cl, /<th scope="col">Actions<\/th>/); assert.match(cl, /stat@exemple\.fr/);
  });

  test("Réglages : une seule action d'enregistrement ; les groupes sont des cartes ; les données enregistrées sont restituées", async () => {
    const html = (await boss.get(`${B}/reglages`)).text;
    for (const id of ["general", "commandes-avis", "taxes-reglage", "moyens-paiement"]) assert.match(html, new RegExp(`id="${id}"`), id);
    assert.equal((html.match(/action="[^"]*\/reglages"/g) || []).length, 1);
    assert.equal((await post("/reglages", { enabled: "1", currency: "xof", default_country: "CI", order_prefix: "KOL", low_stock_threshold: "7", notify_email: "ventes@exemple.fr", guest_checkout: "1", payment_methods: ["manual"], manual_instructions: "Virement." })).status, 302);
    const after = (await boss.get(`${B}/reglages`)).text;
    assert.match(after, /name="currency" value="xof"/); assert.match(after, /name="default_country" value="CI"/); assert.match(after, /name="order_prefix" value="KOL"/);
    assert.match(after, /name="notify_email" type="email" value="ventes@exemple\.fr"/); assert.match(after, /name="low_stock_threshold" type="number" min="0" value="7"/);
  });

  test("Taxes et expédition : création et suppression réelles d'une classe et d'une règle de taxe", async () => {
    assert.equal((await post("/classes/tax", { name: "Taux réduit" })).status, 302);
    assert.match((await boss.get(`${B}/classes`)).text, /Taux réduit/);
    assert.equal((await post("/taxes", { name: "TVA 5,5", country: "FR", rate: "5,5", back: "classes" })).status, 302);
    const page = (await boss.get(`${B}/classes`)).text;
    assert.match(page, /TVA 5,5/); assert.match(page, /5\.50 %/);
    const id = db.prepare("SELECT id FROM mk_shop_tax_rules WHERE name = 'TVA 5,5'").get().id;
    assert.equal((await post(`/taxes/${id}/supprimer`, {})).status, 302);
    assert.doesNotMatch((await boss.get(`${B}/classes`)).text, /TVA 5,5/);
  });
});
