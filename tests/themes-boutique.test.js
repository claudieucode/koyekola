// Thèmes de BOUTIQUE (Luxe / Boutiques en ligne) sur un VRAI serveur : le thème s'applique aux pages réelles /boutique/* (catalogue, fiche, panier, commande),
// le parcours d'achat va de l'accueil à la confirmation (paiement manuel, réel), aucun compteur trompeur n'est écrit par un thème, aucune fuite vers un autre site.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");
const library = require("../src/marketing/themes/library");
const audit = require("../src/marketing/themes/packs/audit");
const shopkit = require("../src/marketing/themes/packs/shopkit");

const KEYS = ["maille", "flamme", "verdure", "pointure", "cuir", "dentelle", "plume-or", "lumiere-objet", "carre-soie", "salon-vivant", "sommeil-doux", "museau", "boucles-fieres", "pagne-vif", "monture-claire", "percale-fine", "corde-et-bois", "deuxieme-vie", "produit-unique", "ambre-rare", "perle-noire", "cercle-prive", "atelier-botte", "petit-nid", "cabine-haute", "cuisine-claire", "objectif-noir", "service-dresse"].filter((k) => fs.existsSync(path.join(__dirname, "..", "src", "marketing", "themes", "packs", k, "pack.js")));
const HOST = "www.themes-shop.example";
const site = { headers: { "x-forwarded-host": HOST, "User-Agent": "Mozilla/5.0 (test)" } };
let srv, boss, db, siteId, orgId;
const one = (sql, ...a) => db.prepare(sql).get(...a);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  orgId = one("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").id;
  siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Boutique Thèmes" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  const r = await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HOST}` } } } });
  assert.equal(r.status, 200);
  const SA = `/marketing/site-web/sites/${siteId}/boutique`;
  assert.equal((await boss.post(`${SA}/livraison/zones`, { name: "France", countries: "FR" })).status, 302);
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", siteId).id;
  assert.equal((await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" })).status, 302);
  assert.equal((await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "THM", manual_instructions: "Virement de test" })).status, 302);
  assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" })).status, 302);
});
after(async () => { db.close(); await srv.stop(); });

const setPack = (key) => {
  const row = one("SELECT tokens FROM mk_sites WHERE id = ?", siteId); const t = JSON.parse(row.tokens);
  t.pack = { key, options: {} };
  db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify(t), siteId);
};

describe("fiches des thèmes de boutique", () => {
  for (const key of KEYS) {
    test(`${key} : fiche valide, pages sans lien mort ni balise supprimée, catalogue de démonstration de 24 produits`, () => {
      const r = library.reload();
      assert.deepEqual(r.problems.filter((p) => p.key === key), []);
      const spec = r.byKey.get(key);
      assert.ok(spec, "thème absent du registre");
      assert.ok(["luxe", "ecommerce"].includes(spec.category));
      assert.deepEqual(audit.auditPack(spec), []);
      const demo = require(`../src/marketing/themes/packs/${key}/demo.js`);
      assert.ok(demo.products.length >= 24, "au moins 24 produits de démonstration");
      assert.ok(demo.products.some((p) => p[3]), "au moins une promotion");
      assert.ok(demo.products.some((p) => p[5] === "rupture"), "au moins une rupture");
      assert.ok(demo.products.some((p) => p[4]), "au moins un produit à variantes");
    });
    test(`${key} : aucune pratique trompeuse écrite dans le thème (stock, affluence, compte à rebours, cases précochées)`, () => {
      const dir = path.join(__dirname, "..", "src", "marketing", "themes", "packs", key);
      const src = fs.readdirSync(dir).map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
      assert.doesNotMatch(src, /plus que \d+|il en reste|personnes? (regardent|consultent)|Math\.random|setInterval|countdown|checked/i);
    });
  }
});

describe("parcours d'achat avec le thème appliqué aux pages réelles", () => {
  for (const key of KEYS) {
    test(`${key} : catalogue, fiche, panier, commande invité et confirmation portent l'identité du thème`, async () => {
      setPack(key);
      const demo = require(`../src/marketing/themes/packs/${key}/demo.js`);
      if (!one("SELECT 1 AS x FROM mk_shop_products WHERE site_id = ? LIMIT 1", siteId)) shopkit.seed({ db, organizationId: orgId, siteId }, demo);
      const cli = new Client(srv.base);
      const cat = await cli.get("/boutique", site);
      assert.equal(cat.status, 200);
      assert.match(cat.text, new RegExp(`data-kw-pack="${key}"`));
      assert.match(cat.text, new RegExp(`/theme-packs/${key}/style.css`));
      assert.doesNotMatch(cat.text, /Plus que \d|personnes regardent/i);
      const first = one("SELECT slug, id, type FROM mk_shop_products WHERE site_id = ? AND type = 'simple' AND stock_qty > 0 ORDER BY id LIMIT 1", siteId);
      const fiche = await cli.get(`/boutique/produit/${first.slug}`, site);
      assert.equal(fiche.status, 200); assert.match(fiche.text, new RegExp(`data-kw-pack="${key}"`));
      const css = await cli.get(`/theme-packs/${key}/style.css`, site);
      assert.equal(css.status, 200);
      assert.equal((await cli.post("/boutique/panier/ajouter", { product_id: first.id, quantity: "2" }, site)).status, 303);
      const panier = await cli.get("/boutique/panier", site);
      assert.equal(panier.status, 200); assert.match(panier.text, new RegExp(`data-kw-pack="${key}"`));
      const page = await cli.get("/boutique/commande?pays=FR", site);
      assert.equal(page.status, 200); assert.match(page.text, new RegExp(`data-kw-pack="${key}"`));
      const idem = String(page.text.match(/name="idempotency_key" value="([0-9a-f]+)"/)[1]);
      const method = String(page.text.match(/name="shipping_method" value="(\d+)"/)[1]);
      const expected = String(page.text.match(/name="expected_total" value="(\d+)"/)[1]);
      const r = await cli.post("/boutique/commande", { email: "acheteur@example.test", ship_name: "Ada Lovelace", ship_line1: "1 rue des Tests", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", idempotency_key: idem, shipping_method: method, expected_total: expected, payment_method: "manual" }, site);
      assert.equal(r.status, 303, String(r.text).slice(0, 300));
      const done = await cli.get(r.location.replace(/^https?:\/\/[^/]+/, ""), site);
      assert.equal(done.status, 200); assert.match(done.text, new RegExp(`data-kw-pack="${key}"`));
      assert.ok(one("SELECT 1 AS x FROM mk_shop_orders WHERE site_id = ? AND email = 'acheteur@example.test'", siteId));
    });
  }
  test("un autre site n'hérite pas du thème (isolation)", async () => {
    const other = await new Client(srv.base).get("/boutique", { headers: { "User-Agent": "Mozilla/5.0 (test)" } });
    assert.doesNotMatch(other.text, /data-kw-pack="maille"/);
  });
});
