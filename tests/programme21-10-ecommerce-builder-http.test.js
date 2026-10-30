// Programme 21.10 — constructeur de boutique par IA : parcours HTTP RÉEL (serveur démarré) — création, brouillons, catalogue natif, configuration, vérifications, publication, droits, module par site,
// isolation entre sites, idempotence. Aucun paiement, aucun appel d'IA payant (l'analyse est à règles ; le contenu des produits utilise le gabarit sans IA).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

const BRIEF = "Je veux créer une boutique en ligne nommée « TechKin » pour vendre des ordinateurs portables, écrans et claviers à Kinshasa, livraison en RDC, pour les particuliers et les professionnels, prix en dollars.";
describe("Boutique IA (serveur réel)", () => {
  let srv, db, boss, A, B, editorA, readerA, adminB, shop, siteOfShop, other;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const U = (p = "") => `/marketing/ia/studio/boutique${p}`;
  const post = (c, path, body) => c.request(path, { method: "POST", json: body === undefined ? {} : body });
  const json = (r) => JSON.parse(r.text);
  const state = async (c = boss, id = shop, q = "") => json(await c.get(`${U(`/${id}/etat.json`)}${q}`)).state;
  const edit = async (operation) => post(boss, U(`/${shop}/modifier`), { operation, revision: (await state()).project.revision });

  before(async () => {
    delete process.env.STRIPE_SECRET_KEY; delete process.env.STRIPE_WEBHOOK_SECRET;
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    editorA = await member(A, "editor"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Contacts seuls", description: "t", perm: ["contacts.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Contacts seuls'").key);
    for (const s of [A, B]) for (const m of ["ai", "commerce"]) await boss.post(`${M(s)}/${m}`, { etat: "activer" });
  });
  after(async () => { db.close(); await srv.stop(); });

  describe("création et brouillons", () => {
    test("l'accueil propose « Nouvelle boutique en ligne » ; un visiteur anonyme n'y accède pas", async () => {
      const r = await boss.get("/marketing/ia/studio"); assert.equal(r.status, 200); assert.match(r.text, /Nouvelle boutique en ligne/);
      assert.notEqual((await new Client(srv.base).get(U("/projets.json"))).status, 200);
    });
    test("un brief trop court est refusé SANS créer de site ; un brief valide crée le projet et un site en brouillon", async () => {
      const sites = one("SELECT COUNT(*) n FROM mk_sites").n;
      const short = await post(boss, U("/projets"), { brief: "Boutique", newSiteName: "Boutique TechKin" }); assert.equal(short.status, 400); assert.equal(one("SELECT COUNT(*) n FROM mk_sites").n, sites);
      const r = await post(boss, U("/projets"), { brief: BRIEF, newSiteName: "Boutique TechKin" }); assert.equal(r.status, 200, r.text.slice(0, 300)); shop = json(r).id;
      siteOfShop = one("SELECT site_id FROM mk_ai_shops WHERE id = ?", shop).site_id; assert.equal(one("SELECT COUNT(*) n FROM mk_sites").n, sites + 1);
      for (const m of ["ai", "commerce"]) await boss.post(`${M(siteOfShop)}/${m}`, { etat: "activer" });
      assert.equal(one("SELECT COUNT(*) n FROM mk_shop_products WHERE site_id = ?", siteOfShop).n, 0, "rien n'est écrit dans le catalogue à la création");
    });
    test("l'état : 12 étapes réelles, faits avec preuve, modèle pris en charge, plan et structure ; aucun secret", async () => {
      const s = await state(); assert.equal(s.steps.length, 12); assert.equal(s.analysis.facts.shopName.value, "TechKin"); assert.equal(s.analysis.engine, "règles (sans IA)");
      assert.ok(s.analysis.models.some((m) => m.key === "physical" && m.status === "supported")); assert.ok(s.plan.pages.length >= 10); assert.ok(s.structure.categories.length >= 6);
      assert.doesNotMatch(JSON.stringify(s), /sk_(live|test)|whsec_|ANTHROPIC_API_KEY/); assert.equal(s.validation.readyToSell, false);
    });
    test("la page de l'espace de travail s'affiche, état embarqué échappé", async () => {
      const r = await boss.get(U(`/${shop}`)); assert.equal(r.status, 200); assert.match(r.text, /id="aib-steps"/);
      assert.doesNotMatch(r.text.split('id="aib-initial"')[1].split("</script>")[0], /<script|<\/?[a-z]/i);
    });
    test("modifier le plan : révision périmée refusée (409) ; annuler / rétablir", async () => {
      const s = await state(); const stale = await post(boss, U(`/${shop}/modifier`), { operation: { op: "plan_add_page", name: "X" }, revision: s.project.revision + 5 }); assert.equal(stale.status, 409);
      const ok = await edit({ op: "plan_add_page", name: "Nos engagements" }); assert.equal(ok.status, 200, ok.text.slice(0, 200));
      let t = json(ok).state; assert.ok(t.plan.pages.some((p) => p.name === "Nos engagements")); assert.equal(t.undo.canUndo, true);
      t = json(await post(boss, U(`/${shop}/annuler`), { revision: t.project.revision })).state; assert.ok(!t.plan.pages.some((p) => p.name === "Nos engagements"));
      t = json(await post(boss, U(`/${shop}/retablir`), { revision: t.project.revision })).state; assert.ok(t.plan.pages.some((p) => p.name === "Nos engagements"));
      assert.equal((await edit({ op: "plan_remove_page", key: "contact" })).status, 422, "une page nécessaire ne se retire pas");
    });
    test("assistant : une demande devient une PROPOSITION (rien ne change), « supprimer » et « mets le prix » sont refusés avec explication", async () => {
      const rev0 = (await state()).project.revision;
      const a = json(await post(boss, U(`/${shop}/assistant`), { message: "Ajoute une catégorie Imprimantes dans Ordinateurs" })); assert.equal(a.reply.kind, "proposal"); assert.equal((await state()).project.revision, rev0);
      const del = json(await post(boss, U(`/${shop}/assistant`), { message: "Supprime la catégorie Ordinateurs" })); assert.equal(del.reply.kind, "advice");
      const price = json(await post(boss, U(`/${shop}/assistant`), { message: "Mets le prix à 50 dollars" })); assert.equal(price.reply.kind, "advice"); assert.match(price.reply.text, /n'invente jamais/);
      const acc = await post(boss, U(`/${shop}/modifier`), { operation: a.reply.proposal.operation, revision: a.revision }); assert.equal(acc.status, 200); assert.ok(json(acc).state.structure.categories.some((c) => c.name === "Imprimantes"));
    });
  });

  describe("catalogue natif, produits, configuration, publication", () => {
    test("créer les catégories exige l'acceptation et le droit shop.write ; idempotent", async () => {
      assert.equal((await post(boss, U(`/${shop}/appliquer/structure`), {})).status, 409, "structure non acceptée");
      await edit({ op: "accept_structure" });
      const r1 = await post(boss, U(`/${shop}/appliquer/structure`), {}); assert.equal(r1.status, 200, r1.text.slice(0, 300)); const created = json(r1).result.created; assert.ok(created >= 7);
      const n = one("SELECT COUNT(*) n FROM mk_shop_categories WHERE site_id = ?", siteOfShop).n; assert.equal(n, created);
      assert.equal(json(await post(boss, U(`/${shop}/appliquer/structure`), {})).result.created, 0); assert.equal(one("SELECT COUNT(*) n FROM mk_shop_categories WHERE site_id = ?", siteOfShop).n, n);
    });
    test("produit : brouillon sans prix refusé à la création ; avec prix, créé EN BROUILLON, jamais publié ; 2e appel : aucun doublon", async () => {
      await edit({ op: "add_product", product: { name: "Clavier K1", facts: ["Disposition AZERTY", "Connexion USB-C"], price: "59,90", sku: "KB-K1", stock: 12, category: "Claviers et souris", description: "x" } });
      await edit({ op: "add_product", product: { name: "Souris sans prix", facts: ["Noire"] } });
      const key = (await state()).drafts.find((d) => d.name === "Clavier K1").key;
      const gen = await post(boss, U(`/${shop}/produits/${key}/generer`), { style: "technical" }); assert.equal(gen.status, 200, gen.text.slice(0, 300));
      const d = json(gen).state.drafts.find((x) => x.name === "Clavier K1"); assert.match(d.content.description, /AZERTY/); assert.equal(d.content.source, "template");
      const ap = json(await post(boss, U(`/${shop}/appliquer/produits`), {})); const by = Object.fromEntries(ap.result.results.map((x) => [x.name, x]));
      assert.equal(by["Clavier K1"].status, "created"); assert.equal(by["Souris sans prix"].status, "refused"); assert.match(by["Souris sans prix"].reasons.join(), /prix/);
      const row = one("SELECT status, price_cents, sku, stock_qty FROM mk_shop_products WHERE site_id = ? AND sku = 'KB-K1'", siteOfShop); assert.deepEqual({ ...row }, { status: "draft", price_cents: 5990, sku: "KB-K1", stock_qty: 12 });
      assert.equal(json(await post(boss, U(`/${shop}/appliquer/produits`), {})).result.created, 0); assert.equal(one("SELECT COUNT(*) n FROM mk_shop_products WHERE site_id = ? AND sku = 'KB-K1'", siteOfShop).n, 1);
    });
    test("CSV : l'aperçu n'écrit rien ; l'ajout écarte les doublons du catalogue", async () => {
      const text = "nom;prix;stock;caracteristiques\nCâble HDMI;9,50;40;2 m\nClavier K1;59,90;1;x";
      const rev = (await state()).project.revision; const pv = json(await post(boss, U(`/${shop}/csv/apercu`), { text })).preview; assert.equal(pv.wouldAdd, 2); assert.ok(pv.duplicates.some((x) => /catalogue/.test(x.reason))); assert.equal((await state()).project.revision, rev);
      const add = json(await post(boss, U(`/${shop}/csv/ajouter`), { text, revision: rev })).state; assert.ok(add.drafts.some((x) => x.name === "Câble HDMI")); assert.equal(add.drafts.filter((x) => x.name === "Clavier K1").length, 1);
    });
    test("configuration : droit « paiements » exigé ; la carte est refusée sans clés serveur ; un tarif absent est refusé ; rien d'inventé", async () => {
      assert.equal((await post(editorA, `${U(`/${shop}/appliquer/configuration`)}?site=${A}`, { items: { currency: "usd" } })).status, 403, "un éditeur n'a pas shop.payments");
      const r = json(await post(boss, U(`/${shop}/appliquer/configuration`), { items: { currency: "usd", defaultCountry: "CD", paymentMethods: ["stripe", "manual"], zones: [{ name: "RDC", countries: ["CD"], methods: [{ name: "Standard", kind: "flat", costCents: 1500 }, { name: "Sans tarif" }] }], taxRules: [{ name: "TVA", country: "CD" }] } })).result;
      assert.ok(r.refused.some((x) => /stripe/.test(x.item) && /clés manquantes/.test(x.reason))); assert.ok(r.refused.some((x) => /Sans tarif/.test(x.item))); assert.ok(r.refused.some((x) => /TVA/.test(x.item)));
      const st = one("SELECT currency, payment_methods FROM mk_shop_settings WHERE site_id = ?", siteOfShop); assert.equal(st.currency, "usd"); assert.deepEqual(JSON.parse(st.payment_methods), ["manual"]);
      assert.equal(one("SELECT COUNT(*) n FROM mk_shop_shipping_methods WHERE site_id = ?", siteOfShop).n, 1); assert.equal(one("SELECT COUNT(*) n FROM mk_shop_tax_rules WHERE site_id = ?", siteOfShop).n, 0);
    });
    test("vérifications : pas prête sans produit publié ; la publication refuse les produits incomplets, publie les autres, n'ouvre la boutique que si autorisé", async () => {
      assert.equal((await state()).validation.readyToSell, false);
      db.prepare("UPDATE mk_shop_products SET description = 'Clavier mécanique AZERTY, connexion USB-C.' WHERE site_id = ? AND sku = 'KB-K1'").run(siteOfShop);
      const noOpen = await post(editorA, `${U(`/${shop}/publier`)}?site=${A}`, {}); assert.ok([403, 404].includes(noOpen.status), "projet d'un autre site");
      const p1 = json(await post(boss, U(`/${shop}/publier`), { pages: false })).result; assert.ok(p1.products.includes("Clavier K1")); assert.equal(p1.opened, false);
      assert.equal(one("SELECT status FROM mk_shop_products WHERE site_id = ? AND sku = 'KB-K1'", siteOfShop).status, "published"); assert.equal(one("SELECT enabled FROM mk_shop_settings WHERE site_id = ?", siteOfShop).enabled, 0, "boutique toujours fermée");
      assert.equal((await state()).validation.readyToSell, true);
      const p2 = json(await post(boss, U(`/${shop}/publier`), { pages: false, open: true })).result; assert.equal(p2.opened, true); assert.equal(one("SELECT enabled FROM mk_shop_settings WHERE site_id = ?", siteOfShop).enabled, 1);
    });
    test("publication impossible si le paiement n'est pas utilisable : rien n'est publié", async () => {
      db.prepare("UPDATE mk_shop_settings SET payment_methods = '[]', enabled = 0 WHERE site_id = ?").run(siteOfShop); db.prepare("UPDATE mk_shop_products SET status = 'draft' WHERE site_id = ?").run(siteOfShop);
      const r = await post(boss, U(`/${shop}/publier`), {}); assert.equal(r.status, 422); assert.equal(one("SELECT COUNT(*) n FROM mk_shop_products WHERE site_id = ? AND status = 'published'", siteOfShop).n, 0);
      db.prepare("UPDATE mk_shop_settings SET payment_methods = '[\"manual\"]' WHERE site_id = ?").run(siteOfShop);
    });
  });

  describe("droits, module par site, isolation", () => {
    test("un lecteur sans droit sur les formulaires est refusé partout", async () => {
      for (const [m, path, body] of [["GET", `/projets.json?site=${A}`], ["GET", `/${shop}/etat.json?site=${A}`], ["POST", `/projets?site=${A}`, { brief: BRIEF, siteId: A }], ["POST", `/${shop}/modifier?site=${A}`, {}]]) {
        const r = m === "GET" ? await readerA.get(U(path)) : await post(readerA, U(path), body); assert.equal(r.status, 403, `${m} ${path}`);
      }
    });
    test("un éditeur limité au site A crée une boutique pour A seulement et ne voit pas celle du site B", async () => {
      const own = await post(editorA, `${U("/projets")}?site=${A}`, { brief: BRIEF, siteId: A }); assert.equal(own.status, 200, own.text.slice(0, 300)); other = json(own).id;
      assert.equal(one("SELECT site_id FROM mk_ai_shops WHERE id = ?", other).site_id, A);
      assert.equal((await post(editorA, `${U("/projets")}?site=${A}`, { brief: BRIEF, newSiteName: "Pirate" })).status, 403); assert.equal(one("SELECT COUNT(*) n FROM mk_sites WHERE name = 'Pirate'").n, 0);
      const list = json(await editorA.get(`${U("/projets.json")}?site=${A}`)).projects; assert.ok(list.every((p) => p.siteId === A)); assert.ok(!list.some((p) => p.id === shop));
      for (const [m, path, body] of [["GET", `/${shop}/etat.json`], ["POST", `/${shop}/modifier`, { operation: { op: "accept_plan" }, revision: 1 }], ["POST", `/${shop}/appliquer/produits`, {}], ["POST", `/${shop}/publier`, {}], ["POST", `/${shop}/assistant`, { message: "Ajoute une page X" }]]) {
        const r = m === "GET" ? await editorA.get(`${U(path)}?site=${A}`) : await post(editorA, `${U(path)}?site=${A}`, body); assert.ok([403, 404].includes(r.status), `${m} ${path} → ${r.status}`);
      }
      for (const q of [`?site=${B}`]) assert.notEqual((await editorA.get(`${U(`/${shop}/etat.json`)}${q}`)).status, 200, "viser un autre site dans l'adresse ne contourne rien");
    });
    test("module « ia » ou « commerce » désactivé : l'accès limité est refusé", async () => {
      await boss.post(`${M(B)}/ai`, { etat: "desactiver" });
      assert.equal((await adminB.get(`${U("/projets.json")}?site=${B}`)).status, 403);
      await boss.post(`${M(B)}/ai`, { etat: "activer" });
      const pb = await post(adminB, `${U("/projets")}?site=${B}`, { brief: BRIEF, siteId: B }); assert.equal(pb.status, 200); const bid = json(pb).id;
      await boss.post(`${M(B)}/commerce`, { etat: "desactiver" });
      assert.equal((await post(adminB, `${U(`/${bid}/appliquer/structure`)}?site=${B}`, {})).status, 403, "sans module Commerce on n'écrit pas dans le catalogue");
    });
    test("le catalogue d'un site n'apparaît pas dans la boutique d'un autre ; aucun secret dans les réponses", async () => {
      const s = json(await editorA.get(`${U(`/${other}/etat.json`)}?site=${A}`)).state; assert.equal(s.catalog.count, 0);
      assert.doesNotMatch(JSON.stringify(s), /sk_(live|test)|whsec_/);
    });
  });
});
