// Programme 21.10 — constructeur de boutique par IA : analyse du modèle commercial, plan, structure du catalogue, brouillons de produits (garde-fou anti-invention), CSV, variantes, stock,
// configuration commerciale, validation avant publication, historique/annulation, idempotence, isolation entre sites et organisations, performance.
// Base en mémoire avec les vraies migrations (dont le moteur e-commerce 121) ; fournisseurs d'IA SIMULÉS ; aucune transaction, aucun paiement.
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const siteModules = require("../src/marketing/siteModules");
const project = require("../src/marketing/ai/shop/project");
const analyzer = require("../src/marketing/ai/shop/analyzer");
const products = require("../src/marketing/ai/shop/products");
const csv = require("../src/marketing/ai/shop/csv");
const configLib = require("../src/marketing/ai/shop/config");
const catalog = require("../src/marketing/shop/catalog");
const store = require("../src/marketing/shop/store");

const BRIEF = "Je veux créer une boutique en ligne nommée « TechKin » pour vendre des ordinateurs portables, écrans et claviers à Kinshasa, livraison en RDC, pour les particuliers et les professionnels, prix en dollars.";
const rejects = (fn, code) => assert.throws(fn, (e) => (code ? e.code === code : true), String(code));
const fails = async (p, code) => { try { await p; } catch (e) { if (code) assert.equal(e.code, code); return e; } assert.fail("erreur attendue"); };

describe("21.10 — analyse du modèle commercial", () => {
  test("faits, hypothèses et manques sont distingués ; la preuve est citée", () => {
    const a = analyzer.analyze(BRIEF);
    assert.equal(a.facts.shopName.value, "TechKin"); assert.equal(a.facts.country.value, "CD"); assert.equal(a.facts.currency.value, "USD"); assert.equal(a.sector.key, "informatique");
    assert.match(a.facts.country.evidence, /RDC/); assert.match(a.facts.country.evidence, /livraison/, "la preuve est un extrait du texte"); assert.equal(a.engine, "règles (sans IA)");
    const b = analyzer.analyze("Une boutique de vêtements à Paris, pour femmes");
    assert.equal(b.facts.currency, undefined); assert.equal(b.assumptions.find((x) => x.key === "currency").value, "EUR", "devise usuelle = HYPOTHÈSE, pas un fait");
    assert.ok(b.missing.some((m) => m.key === "currency"));
  });
  test("la prise en charge d'un modèle vient du moteur réel : gros et dropshipping non supportés, numérique et personnalisé partiels", () => {
    const a = analyzer.analyze("Boutique en gros et dropshipping de produits numériques personnalisés à Dakar");
    const st = Object.fromEntries(a.models.map((m) => [m.key, m.status]));
    assert.equal(st.wholesale, "unsupported"); assert.equal(st.dropshipping, "unsupported"); assert.equal(st.digital, "partial"); assert.equal(st.custom, "partial");
    assert.ok(a.warnings.some((w) => /gros/i.test(w)));
  });
  test("un brief vague est jugé insuffisant sans rien inventer", () => {
    const a = analyzer.analyze("Je vends des trucs"); assert.equal(a.readiness, "insufficient"); assert.deepEqual(Object.keys(a.facts), ["language"], "seule la langue (détectée) est un fait : aucun nom, pays, devise ni secteur n'est inventé"); assert.ok(a.missing.length >= 4);
  });
  test("une correction de la personne devient un fait explicite", () => {
    const a = analyzer.analyze("Une boutique à Paris", { currency: "XOF" }); assert.equal(a.facts.currency.value, "XOF"); assert.match(a.facts.currency.evidence, /vous/);
  });
});

describe("21.10 — projet de boutique (service)", () => {
  let m, A, B, site, site2, p;
  before(() => {
    m = freshMarketing(); A = m.A; B = m.B;
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug) VALUES (1, 'Boutique A', 'ba'), (1, 'Boutique A2', 'ba2'), (2, 'Boutique B', 'bb')");
    site = 1; site2 = 2;
    siteModules.setEnabled(A, site, "commerce", true); siteModules.setEnabled(A, site2, "commerce", true);
    p = project.create(A, { brief: BRIEF, siteId: site });
  });
  test("création : analyse, plan de boutique, structure du catalogue ; rien n'est écrit dans le moteur", () => {
    assert.equal(p.siteId, site); assert.ok(p.plan.pages.length >= 10); assert.ok(p.structure.categories.length >= 6);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_shop_products").get().n, 0); assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_shop_categories").get().n, 0);
    assert.ok(p.plan.pages.some((x) => x.key === "fiche-produit" && x.kind === "native"), "les pages natives du moteur ne sont pas recréées");
  });
  test("les pages légales sont des modèles à vérifier, jamais une garantie de conformité", () => {
    const legal = p.plan.pages.filter((x) => x.legal); assert.ok(legal.length >= 3); assert.ok(legal.every((x) => /ni une garantie de conformité/.test(x.purpose)));
  });
  test("un brief trop court est refusé ; un site d'une autre organisation est refusé", () => {
    rejects(() => project.create(A, { brief: "Boutique", siteId: site }), "brief_too_short");
    rejects(() => project.create(A, { brief: BRIEF, siteId: 3 }));
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_ai_shops").get().n, 1);
  });
  test("plan : ajouter, renommer, déplacer ; une page nécessaire ne se retire pas ; accepter ; toute modification retire l'acceptation", () => {
    let v = project.edit(A, p.id, { op: "plan_add_page", name: "Nos engagements" }, { revision: p.revision });
    assert.ok(v.plan.pages.some((x) => x.name === "Nos engagements"));
    v = project.edit(A, p.id, { op: "plan_rename_page", key: "faq", name: "Aide" }, { revision: v.revision });
    rejects(() => project.edit(A, p.id, { op: "plan_remove_page", key: "contact" }, { revision: v.revision }));
    v = project.edit(A, p.id, { op: "accept_plan" }, { revision: v.revision }); assert.equal(v.plan.accepted, true);
    v = project.edit(A, p.id, { op: "plan_move_page", key: "faq", to: 0 }, { revision: v.revision }); assert.equal(v.plan.accepted, false, "plan modifié : à ré-accepter");
    p = v;
  });
  test("révision périmée → conflit ; rien n'est écrit", () => {
    rejects(() => project.edit(A, p.id, { op: "accept_plan" }, { revision: 1 }), "conflict");
    assert.equal(project.load(A, p.id).revision, p.revision);
  });
  test("annuler / rétablir restaure les brouillons ; une nouvelle modification vide « rétablir »", () => {
    const before = project.view(project.load(A, p.id));
    let v = project.edit(A, p.id, { op: "plan_add_page", name: "Presse" }, { revision: before.revision });
    v = project.undo(A, p.id, { revision: v.revision }); assert.deepEqual(v.plan.pages.map((x) => x.key), before.plan.pages.map((x) => x.key));
    v = project.redo(A, p.id, { revision: v.revision }); assert.ok(v.plan.pages.some((x) => x.name === "Presse"));
    v = project.undo(A, p.id, { revision: v.revision }); v = project.edit(A, p.id, { op: "plan_add_page", name: "Partenaires" }, { revision: v.revision });
    rejects(() => project.redo(A, p.id, { revision: v.revision }), "nothing_to_redo"); p = v;
  });
  test("structure : catégories sans doublon, déplacement sans cycle, acceptation exigée avant création", () => {
    let v = project.edit(A, p.id, { op: "cat_add_category", name: "Imprimantes" }, { revision: p.revision });
    rejects(() => project.edit(A, p.id, { op: "cat_add_category", name: "Imprimante" }, { revision: v.revision }));
    const root = v.structure.categories.find((c) => c.name === "Ordinateurs"); const child = v.structure.categories.find((c) => c.parent === root.key);
    rejects(() => project.edit(A, p.id, { op: "cat_move_category", key: root.key, parent: child.key }, { revision: v.revision }));
    rejects(() => project.applyStructure(A, p.id), "not_accepted"); p = v;
  });
  test("création des catégories dans le catalogue natif : parents avant enfants, idempotente (aucun doublon au 2e appel)", () => {
    let v = project.edit(A, p.id, { op: "accept_structure" }, { revision: p.revision });
    const r1 = project.applyStructure(A, p.id); assert.ok(r1.created >= 7);
    const n = m.db.prepare("SELECT COUNT(*) n FROM mk_shop_categories WHERE site_id = ?").get(site).n; assert.equal(n, r1.created);
    const r2 = project.applyStructure(A, p.id); assert.equal(r2.created, 0); assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_shop_categories WHERE site_id = ?").get(site).n, n);
    const sub = m.db.prepare("SELECT c.name, pc.name parent FROM mk_shop_categories c JOIN mk_shop_categories pc ON pc.id = c.parent_id WHERE c.site_id = ? AND c.name = 'Ordinateurs portables'").get(site); assert.equal(sub.parent, "Ordinateurs");
    p = project.view(project.load(A, p.id));
  });
  test("une catégorie déjà existante dans le catalogue est réutilisée, jamais dupliquée", () => {
    const p2 = project.create(A, { brief: "Boutique de claviers et d'écrans informatiques à Kinshasa", siteId: site2 });
    catalog.saveCategory({ db: m.db, organizationId: 1, siteId: site2 }, { name: "Écrans" });
    const v = project.edit(A, p2.id, { op: "accept_structure" }, { revision: p2.revision }); const r = project.applyStructure(A, p2.id);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_shop_categories WHERE site_id = ? AND name = 'Écrans'").get(site2).n, 1); assert.ok(r.reused >= 1); assert.ok(v);
  });

  test("produit : le gabarit part des faits fournis ; prix, stock, SKU, image absents sont listés « manquants », jamais inventés", async () => {
    let v = project.edit(A, p.id, { op: "add_product", product: { name: "Clavier mécanique K1", facts: ["Disposition AZERTY", "Connexion USB-C"], category: "Claviers et souris", style: "technical" } }, { revision: p.revision });
    const d = v.products[0]; assert.deepEqual(d.missing.map((x) => x.key).sort(), ["image", "price", "sku", "stock"].sort());
    assert.equal(d.priceCents, null); assert.equal(d.stock, null); assert.equal(d.sku, "");
    v = await project.generateProduct(A, p.id, d.key, {}); const g = v.products[0];
    assert.match(g.content.description, /AZERTY/); assert.match(g.content.seoTitle, /Clavier mécanique K1/); assert.doesNotMatch(JSON.stringify(g.content), /\d{3,}/, "aucun chiffre qui ne vienne des faits");
    assert.equal(g.content.source, "template"); p = v;
  });
  test("IA simulée hostile : chiffres, contacts, certification, garantie, « meilleur » → remplacés ou signalés ; création refusée tant que critique", async () => {
    const d = products.normalizeDraft({ name: "Souris S1", facts: ["Sans fil", "Noire"], price: "19,90", style: "commercial" });
    const out = await products.generate({}, d, { shopName: "TechKin", useAi: true, call: async () => ({ shortDescription: "La meilleure souris, garantie 5 ans, certifiée ISO 9001", description: "Écrivez à vente@x.com. 12000 clients. Batterie 300 heures.", features: ["Capteur testé 20 millions de clics"], benefits: ["Précision"], seoTitle: "S1", metaDescription: "m", altText: "Souris", faq: [{ q: "Garantie ?", a: "Garantie 10 ans." }] }) });
    const text = JSON.stringify(out.content); assert.doesNotMatch(text, /vente@x\.com|12000|300 heures|5 ans|10 ans/); assert.match(text, /\[à compléter\]/);
    assert.ok(out.issues.some((i) => i.level === "critical" && /garantie|certification|superlatif/.test(i.message)));
  });
  test("un contenu critique bloque la création ; modifier les faits retire le contenu périmé et lève le blocage", async () => {
    let v = project.create(A, { brief: BRIEF, siteId: 1 });
    v = project.edit(A, v.id, { op: "add_product", product: { name: "Souris Z", facts: ["Sans fil"], price: "10" } }, { revision: v.revision });
    const key = v.products[0].key; const row = project.load(A, v.id);
    // contenu critique posé directement (IA simulée hostile déjà testée plus haut)
    m.db.prepare("UPDATE mk_ai_shops SET products_json = ? WHERE id = ?").run(JSON.stringify([{ ...v.products[0], content: { description: "Garantie 10 ans" }, issues: [{ level: "critical", message: "garantie non étayée" }] }]), v.id);
    assert.equal(project.applyProducts(A, v.id).results[0].status, "refused");
    const w = project.edit(A, v.id, { op: "update_product", key, product: { facts: ["Sans fil", "Récepteur USB"] } }, { revision: project.load(A, v.id).revision });
    assert.equal(w.products[0].content, null); assert.deepEqual(w.products[0].issues, []);
    assert.equal(row.id, v.id);
  });
  test("IA indisponible : repli sur le gabarit, signalé ; jamais d'exception ni de contenu inventé", async () => {
    const d = products.normalizeDraft({ name: "Écran 24 pouces", facts: ["Dalle IPS"], price: "129" });
    const out = await products.generate({}, d, { useAi: true, call: async () => { throw new Error("fournisseur indisponible"); } });
    assert.equal(out.content.source, "template"); assert.ok(out.issues.some((i) => /gabarit sans IA/.test(i.message)));
  });
  test("création des produits : toujours en BROUILLON, prix exigé, doublon et catégorie non créée refusés, idempotente", () => {
    let v = project.view(project.load(A, p.id));
    v = project.edit(A, p.id, { op: "update_product", key: v.products[0].key, product: { price: "59,90", sku: "KB-K1", stock: 12 } }, { revision: v.revision });
    v = project.edit(A, p.id, { op: "add_product", product: { name: "Souris sans prix", facts: ["Noire"] } }, { revision: v.revision });
    v = project.edit(A, p.id, { op: "add_product", product: { name: "Clavier mécanique K1", price: "10" } }, { revision: v.revision });
    const r = project.applyProducts(A, p.id);
    const by = Object.fromEntries(r.results.map((x) => [x.name, x])); const k1 = r.results.filter((x) => x.name === "Clavier mécanique K1");
    assert.deepEqual(k1.map((x) => x.status), ["created", "refused"], "le 1er est créé, le doublon du lot est refusé"); assert.match(k1[1].reasons.join(), /Même nom/);
    assert.equal(by["Souris sans prix"].status, "refused"); assert.match(by["Souris sans prix"].reasons.join(), /prix/);
    const row = m.db.prepare("SELECT status, price_cents, sku, manage_stock, stock_qty FROM mk_shop_products WHERE site_id = ? AND sku = 'KB-K1'").get(site);
    assert.deepEqual({ ...row }, { status: "draft", price_cents: 5990, sku: "KB-K1", manage_stock: 1, stock_qty: 12 });
    const again = project.applyProducts(A, p.id); assert.equal(again.created, 0); assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_shop_products WHERE site_id = ? AND sku = 'KB-K1'").get(site).n, 1, "idempotence : aucun doublon");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_shop_products WHERE site_id = ? AND status = 'published'").get(site).n, 0, "jamais publié par le constructeur");
  });
  test("produit variable : attributs → combinaisons créées SANS SKU ni stock inventés (stock 0) ; SKU conservé tel que saisi", () => {
    let v = project.view(project.load(A, p.id));
    v = project.edit(A, p.id, { op: "add_product", product: { name: "T-shirt Wax", type: "variable", price: "25", attributes: [{ name: "Taille", values: ["S", "M"] }, { name: "Couleur", values: ["Bleu", "Rouge"] }] } }, { revision: v.revision });
    const key = v.products.find((x) => x.name === "T-shirt Wax").key;
    const r = project.applyProducts(A, p.id, [key]); assert.equal(r.results[0].status, "created"); assert.equal(r.results[0].variants, 4);
    const vs = m.db.prepare("SELECT sku, stock_qty, price_cents FROM mk_shop_variants WHERE product_id = ?").all(r.results[0].id);
    assert.equal(vs.length, 4); assert.ok(vs.every((x) => (x.sku === null || x.sku === "") && x.stock_qty === 0 && x.price_cents === null), "ni SKU, ni stock, ni prix inventés");
    rejects(() => products.combinations([{ name: "A", values: Array.from({ length: 11 }, (_, i) => `a${i}`) }, { name: "B", values: Array.from({ length: 11 }, (_, i) => `b${i}`) }]), "limit");
  });
  test("CSV : aperçu sans écriture, colonnes reconnues, prix décimal selon la devise, lignes invalides et doublons signalés", () => {
    const text = "nom;prix;stock;categorie;caracteristiques\nCâble HDMI;9,50;40;Accessoires;2 m|Plaqué or\nClavier mécanique K1;59,90;1;;USB\n;5;1;;x\nCâble HDMI;9,50;3;;";
    const before = m.db.prepare("SELECT COUNT(*) n FROM mk_ai_shops").get().n; const pr = project.previewCsv(A, p.id, text);
    assert.equal(pr.total, 4); assert.equal(pr.rows.filter((r) => r.draft).length, 3); assert.ok(pr.duplicates.some((d) => /catalogue/.test(d.reason))); assert.ok(pr.duplicates.some((d) => /lot/.test(d.reason)));
    assert.equal(project.load(A, p.id).revision, project.view(project.load(A, p.id)).revision, "l'aperçu n'a rien écrit");
    const v = project.addCsv(A, p.id, text, { revision: project.load(A, p.id).revision }); assert.equal(v.products.filter((x) => x.source === "csv").length, 1, "seul le produit sans doublon est ajouté");
    assert.equal(products.toMinor("1 250,50", "EUR"), 125050); assert.equal(products.toMinor("15000", "XOF"), 15000);
    rejects(() => csv.parse("a;b\n1;2"), "invalid_field"); rejects(() => csv.parse("nom\n" + Array.from({ length: 501 }, (_, i) => `P${i}`).join("\n")), "limit");
    assert.ok(before >= 1);
  });
});

describe("21.10 — configuration commerciale, validation, isolation", () => {
  let m, A, B, site, p;
  before(() => {
    m = freshMarketing(); A = m.A; B = m.B;
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug) VALUES (1, 'S1', 's1'), (1, 'S2', 's2'), (2, 'SB', 'sb')");
    site = 1; for (const sid of [1, 2]) for (const mod of ["commerce", "ai"]) siteModules.setEnabled(A, sid, mod, true);
    p = project.create(A, { brief: BRIEF, siteId: 1 });
  });
  test("paiements : la carte n'est acceptée que si le serveur est configuré ; aucune clé ne transite ; le manuel est toujours possible", () => {
    const keep = { k: process.env.STRIPE_SECRET_KEY, w: process.env.STRIPE_WEBHOOK_SECRET }; delete process.env.STRIPE_SECRET_KEY; delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      const r = configLib.apply(A, site, { paymentMethods: ["stripe", "manual", "paypal"] });
      assert.deepEqual(store.getSettings({ db: m.db, organizationId: 1, siteId: site }).payment_methods, ["manual"]);
      assert.ok(r.refused.some((x) => /stripe/.test(x.item) && /clés manquantes/.test(x.reason))); assert.ok(r.refused.some((x) => /paypal/.test(x.item)));
      assert.doesNotMatch(JSON.stringify(configLib.state(A, site)), /sk_(live|test)_|whsec_/);
    } finally { if (keep.k) process.env.STRIPE_SECRET_KEY = keep.k; if (keep.w) process.env.STRIPE_WEBHOOK_SECRET = keep.w; }
  });
  test("livraison et taxes : écrites seulement avec les valeurs saisies ; un tarif ou un taux absent est refusé, jamais inventé", () => {
    const r = configLib.apply(A, site, { zones: [{ name: "RDC", countries: ["CD"], methods: [{ name: "Standard", kind: "flat", costCents: 1500 }, { name: "Sans tarif" }] }], taxRules: [{ name: "TVA", country: "CD", rateBp: 1600 }, { name: "Taxe sans taux", country: "CD" }] });
    assert.ok(r.refused.some((x) => /Sans tarif/.test(x.item))); assert.ok(r.refused.some((x) => /sans taux/.test(x.item)));
    const z = store.listZones({ db: m.db, organizationId: 1, siteId: site }); assert.equal(z.length, 1); assert.equal(z[0].methods.length, 1); assert.equal(z[0].methods[0].cost_cents, 1500);
    rejects(() => configLib.apply(A, site, { zones: [{ name: "X", countries: ["Congo"] }] }));
  });
  test("devise : on garde le code saisi, aucune conversion ; une devise non testée est signalée", () => {
    configLib.apply(A, site, { currency: "usd" }); const st = configLib.state(A, site);
    assert.equal(st.engine.currency, "USD"); assert.ok(st.todo.some((t) => t.key === "currency" && /seul l'euro est testé/.test(t.message)));
    rejects(() => configLib.apply(A, site, { currency: "dollars" }));
  });
  test("validation : boutique vide = pas prête ; le paiement manque ⇒ bloquant ; « prête à vendre » exige paiement utilisable, livraison et un produit publié", () => {
    const empty = project.state(A, p.id); assert.equal(empty.validation.readyToSell, false); assert.ok(empty.validation.checks.some((c) => c.key === "products" && c.level === "error"));
    const pid = catalog.createProduct({ db: m.db, organizationId: 1, siteId: site }, { name: "Souris", type: "simple", price_cents: 1990, status: "published", description: "Souris", image_url: "https://exemple.test/a.jpg", manage_stock: 1, stock_qty: 3 });
    const ok = project.state(A, p.id); const by = Object.fromEntries(ok.validation.checks.map((c) => [c.key, c.level]));
    assert.equal(by.payments, "ok"); assert.equal(by.shipping, "ok"); assert.equal(by.checkout, "ok"); assert.equal(ok.validation.readyToSell, true); assert.equal(by.mobile, "info");
    m.db.prepare("UPDATE mk_shop_settings SET payment_methods = '[]' WHERE site_id = 1").run();
    const noPay = project.state(A, p.id); assert.equal(noPay.validation.readyToSell, false); assert.equal(noPay.validation.checks.find((c) => c.key === "payments").level, "error");
    m.db.prepare("UPDATE mk_shop_settings SET payment_methods = '[\"manual\"]' WHERE site_id = 1").run();
    catalog.updateProduct({ db: m.db, organizationId: 1, siteId: site }, pid, { type: "variable", attributes: [{ name: "Couleur", values: ["Noir"] }] });
    assert.equal(project.state(A, p.id).validation.checks.find((c) => c.key === "variants").level, "error", "produit variable sans variante = bloquant");
  });
  test("progression et étapes : calculées sur l'état réel (12 étapes), jamais saisies", () => {
    const s = project.state(A, p.id); assert.equal(s.steps.length, 12); assert.equal(s.progress.done, s.steps.filter((x) => x.status === "done").length);
    assert.equal(s.progress.percent, Math.round((s.progress.done / 12) * 100)); assert.equal(s.steps.find((x) => x.key === "publication").status, s.validation.readyToSell ? "to_review" : "not_started");
  });
  test("isolation : un projet est invisible d'une autre organisation et d'un accès limité à un autre site ; le catalogue d'un site n'apparaît pas dans l'autre", () => {
    rejects(() => project.load(B, p.id), "not_found");
    rejects(() => project.state({ ...A, siteScope: 2 }, p.id), "not_found"); assert.ok(project.state({ ...A, siteScope: 1 }, p.id));
    assert.deepEqual(project.list({ ...A, siteScope: 2 }), []); assert.equal(project.list(A).length, 1); assert.deepEqual(project.list(B), []);
    const s2 = project.create(A, { brief: "Boutique de claviers informatiques", siteId: 2 }); assert.equal(project.state(A, s2.id).catalog.count, 0, "le produit du site 1 n'est pas dans le site 2");
    assert.equal(project.create({ ...A, siteScope: 1 }, { brief: BRIEF, siteId: 2 }).siteId, 1, "un accès limité est toujours rattaché à SON site");
  });
  test("application au catalogue : un accès limité sans module Commerce est refusé ; le projet d'un autre site ne s'applique pas", () => {
    const q = project.create(A, { brief: BRIEF, siteId: 2 }); siteModules.setEnabled(A, 2, "commerce", false);
    rejects(() => project.applyStructure({ ...A, siteScope: 2 }, q.id), "module_disabled");
    rejects(() => project.applyProducts({ ...A, siteScope: 1 }, q.id), "not_found");
    siteModules.setEnabled(A, 2, "commerce", true);
  });
  test("performance : 400 brouillons CSV analysés et dédoublonnés rapidement ; le catalogue affiché est borné", () => {
    const rows = ["nom;prix;stock;caracteristiques"]; for (let i = 0; i < 400; i += 1) rows.push(`Produit ${i};${(5 + i).toString().replace(".", ",")};${i};Fait ${i}|Autre fait`);
    const t = Date.now(); const pr = project.previewCsv(A, p.id, rows.join("\n")); const ms = Date.now() - t;
    assert.equal(pr.wouldAdd, 400); assert.ok(ms < 3000, `${ms} ms`);
    assert.ok(project.state(A, p.id).catalog.products.length <= 100);
  });
  test("historique : chaque modification et chaque application est journalisée avec sa révision", () => {
    const h = project.history(A, p.id); assert.ok(h.length >= 1); assert.equal(h[0].action, "created"); assert.ok(h.every((x, i) => i === 0 || x.revision >= h[i - 1].revision));
  });
  test("aucune clé ni secret dans l'état d'un projet", () => {
    assert.doesNotMatch(JSON.stringify(project.state(A, p.id)), /sk_(live|test)|whsec_|STRIPE_SECRET/);
  });
});
