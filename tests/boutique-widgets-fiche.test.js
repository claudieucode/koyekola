// Éléments de fiche produit (titre, prix, note, description, disponibilité, références, fil d'Ariane, mini-panier) : définitions complètes, rendu réel dans un modèle publié, aucune donnée inventée.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const TYPES = ["shoptitle", "shopprice", "shoprating", "shopdescription", "shopstock", "shopmeta", "shopbreadcrumb", "shopminicart", "shopcartpage", "shopcheckoutpage", "shoporderpage", "shopaccountpage"];
test("définitions : chaque élément a un libellé, un schéma valide, une description, des mots-clés, un gabarit EJS et le style « box » (réglages Style et Avancé communs)", () => {
  const fs = require("node:fs"); const path = require("node:path");
  const defs = require("../src/marketing/pages/widgets/shop.js");
  for (const t of TYPES) {
    const d = defs.find((x) => x.type === t); assert.ok(d, t);
    assert.ok(d.label && d.description && d.keywords, t); assert.equal(d.style, "box"); assert.equal(d.group, "commerce"); assert.equal(typeof d.data, "function"); assert.ok(Array.isArray(d.schema));
    assert.ok(fs.existsSync(path.join(__dirname, "..", "views", "marketing-public", "widgets", `${t}.ejs`)), `${t}.ejs`);
    const keys = d.schema.map((f) => f.key); assert.equal(new Set(keys).size, keys.length, `${t} : clés dupliquées`);
  }
});

const UA = "Mozilla/5.0 (test)"; const H = "www.wf-un.example"; const hh = { headers: { "x-forwarded-host": H, "User-Agent": UA } };
describe("rendu public", () => {
  let srv, boss, db, site; const one = (sql, ...a) => db.prepare(sql).get(...a);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number(String((await boss.post("/marketing/site-web/sites", { name: "WF" })).location).match(/sites\/(\d+)/)[1]);
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    await boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${H}` } } } });
    const base = `/marketing/site-web/sites/${site}/boutique`;
    await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "W" });
    await boss.post(`/marketing/site-web/sites/${site}/modules/commerce`, { etat: "activer" });
    await boss.post(`${base}/produits`, { name: "Vase <b>bleu</b>", type: "simple", status: "published", price: "30,00", sale_price: "24,00", sku: "VASE-1", short_description: "Court & joli", description: "Ligne 1\n\nLigne <script>2</script>", requires_shipping: "0" });
  });
  after(async () => { db.close(); await srv.stop(); });
  const origin = () => ({ Origin: srv.base });
  test("un modèle de fiche produit contenant les éléments affiche les VRAIES données, échappées", async () => {
    const Catalog = require("../src/themeBuilder/catalog");
    const e = Catalog.entries("single_product")[0];
    const used = JSON.parse((await boss.request(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/utiliser`, { method: "POST", json: { type: "single_product", key: e.key }, headers: origin() })).text).template;
    // On remplace le contenu de la copie par les nouveaux éléments (Page Builder : brouillon puis publication)
    const pageId = used.sourceId; const rev = one("SELECT revision FROM mk_landing_pages WHERE id = ?", pageId).revision;
    const hex = () => require("node:crypto").randomBytes(6).toString("hex");
    const W = (type, props = {}) => ({ type, props, id: hex() });
    const section = { type: "layout", id: hex(), children: [W("shopbreadcrumb", { separator: "›", showHome: true }), W("shoptitle", { tag: "h1" }), W("shoprating", { showCount: true, noneLabel: "Aucun avis" }), W("shopprice", { showRegular: true, fromLabel: "À partir de", taxNote: "TTC" }), W("shopstock", { inLabel: "En stock", outLabel: "Rupture" }), W("shopdescription", { which: "short" }), W("shopdescription", { which: "long" }), W("shopmeta", { showSku: true, showCategories: true, showTags: true }), W("shopminicart", { label: "Panier", showTotal: true, checkoutLabel: "Commander" })] };
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: origin(), json: { revision: rev, content: { title: "Fiche", sections: [section] } } });
    assert.equal(put.status, 200, put.text.slice(0, 400));
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {}, headers: origin() })).status, 200);
    const pub = await boss.request(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/modeles/${used.id}/publier`, { method: "POST", json: { strict: true, scope: "site" }, headers: origin() });
    assert.equal(pub.status, 200, pub.text.slice(0, 300));
    const slug = one("SELECT slug FROM mk_shop_products WHERE site_id = ?", site).slug;
    const r = await new Client(srv.base).get(`/boutique/produit/${slug}`, hh);
    assert.equal(r.status, 200);
    assert.match(r.text, /<h1 class="[^"]*kw-shtitle">Vase &lt;b&gt;bleu&lt;\/b&gt;<\/h1>/, "titre échappé");
    assert.match(r.text, /kw-shprice-old">30,00/); assert.match(r.text, /kw-shprice-now">24,00/); assert.match(r.text, /TTC/);
    assert.match(r.text, /kw-shrating-none/); assert.doesNotMatch(r.text, /kw-shrating-stars/, "aucune étoile inventée sans avis");
    assert.match(r.text, /kw-shstock-in/); assert.match(r.text, /Court &amp; joli/); assert.match(r.text, /Ligne &lt;script&gt;2&lt;\/script&gt;/); assert.doesNotMatch(r.text, /<script>2<\/script>/);
    assert.match(r.text, /Référence : <strong>VASE-1/); assert.match(r.text, /kw-shcrumb/); assert.match(r.text, /data-sh-cart-total/); assert.match(r.text, /href="\/boutique\/commande"/);
  });
});
