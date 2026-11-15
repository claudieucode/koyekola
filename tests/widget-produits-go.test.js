// Widget « Produits GO » : produits du Sourcing produit (GO d'abord) proposés dans l'éditeur, verdict GO identique à l'application (critères stricts),
// fiche publique seulement (aucune donnée interne : coût, marge, fournisseurs), rendu d'une page publiée, design par parties.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), os = require("os"), path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const nodes = require("../src/marketing/pages/nodes");
const parts = require("../src/marketing/pages/parts");
const sourcing = require("../src/marketing/sourcing/catalog");
const { startServer, loginInstructor } = require("./helpers");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pgo-")); // dossier vide : l'instantané livré avec le code est lu
process.env.NAKEWENZE_DATA_DIR = dir;
const firstGo = () => sourcing.productOptions().find((o) => o[1].startsWith("GO "))[0];

describe("sans serveur", () => {
  test("fiche de bibliothèque, parties stylables, choix des produits relus à chaque ouverture (GO d'abord)", () => {
    const t = nodes.editorSpec().types.find((x) => x.type === "produitsgo");
    assert.equal(t.label, "Produits GO");
    assert.equal(t.group, "commerce");
    for (const k of ["card", "image", "name", "text", "price", "badge", "button", "thumb"]) assert.ok(parts.PARTS.produitsgo[k], k);
    const opts = JSON.parse(JSON.stringify(t.schema)).find((f) => f.key === "products").fields.find((f) => f.key === "product").options;
    assert.deepEqual(opts[0], ["", "— Choisir un produit GO —"]);
    assert.match(opts[1][1], /^GO /);
    const firstOther = opts.findIndex((o) => o[1].startsWith("Hors GO"));
    assert.ok(firstOther === -1 || opts.slice(1, firstOther).every((o) => o[1].startsWith("GO ")), "les produits GO passent avant les autres");
  });
  test("le verdict GO suit les critères stricts de l'application (nombre de produits GO par pays)", () => {
    const m = sourcing.goMap(), count = (k) => Object.values(m).filter((a) => a.includes(k)).length;
    assert.deepEqual(Object.fromEntries(["US", "CA", "GB", "AU", "FR", "BE", "CH", "DE", "NL", "ES", "IT"].map((k) => [k, count(k)])), { US: 16, CA: 16, GB: 9, AU: 13, FR: 7, BE: 4, CH: 9, DE: 7, NL: 5, ES: 5, IT: 5 });
  });
  test("fiche publique : nom, textes, photos et prix du pays seulement", () => {
    const x = sourcing.publicProduct(firstGo(), "FR");
    assert.deepEqual(Object.keys(x).sort(), ["category", "gallery", "go", "goCountries", "id", "image", "nameEn", "nameFr", "pain", "price", "promise"].sort());
    assert.match(x.price, /€$/);
    assert.match(x.image, /^https:\/\/ae-pic-a1\.aliexpress-media\.com\/kf\//);
    assert.equal(sourcing.publicProduct("p999999", "FR"), null);
  });
});

describe("vrai serveur", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", NAKEWENZE_DATA_DIR: dir }); boss = await loginInstructor(srv); db = srv.db(); });
  after(async () => { await srv.stop(); fs.rmSync(dir, { recursive: true, force: true }); });
  test("page publiée : produit choisi, textes remplacés, lien compté, aucune donnée interne ; un produit vide n'empêche pas l'affichage", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Vitrine GO" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const pid = firstGo();
    const props = { title: "Nos coups de cœur", country: "FR", layout: "grid", showGallery: true, buttonLabel: "Je le veux",
      products: [{ product: pid, name: "", text: "", price: "", badge: "Nouveau <b>", image: "", link: "/boutique" }, { product: "", name: "", text: "", price: "", badge: "", image: "", link: "" }] };
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "pgo000000001", type: "produitsgo", props }] }] } } });
    assert.equal(put.status, 200, put.text);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await boss.get(`/p/${slug}`)).text;
    const x = sourcing.publicProduct(pid, "FR");
    assert.match(html, /class="kw-node kw-produitsgo kw-n-pgo000000001 kw-pgo kw-pgo--grid"/);
    assert.ok(html.includes(`<h2 class="kw-pgo-title">Nos coups de cœur</h2>`));
    assert.ok(html.includes(x.nameFr.replace(/'/g, "&#39;")), "nom du produit");
    assert.ok(html.includes(x.price), "prix conseillé en euros");
    assert.ok(html.includes("Nouveau &lt;b&gt;"), "pastille échappée");
    assert.match(html, new RegExp(`class="kw-button kw-pgo-btn" href="/p/${slug}/clic/0">Je le veux</a>`));
    assert.match(html, /class="kw-pgo-thumb"/);
    assert.match(html, /\/js\/produits-go\.js/);
    for (const secret of ["aliexpress.com/item", "facebook.com/ads", "COGS", "marge", "cLo", "advSample"]) assert.ok(!html.includes(secret), secret);
    assert.equal((await boss.get(`/p/${slug}/clic/0`)).location, "/boutique");
  });
  test("publication refusée sans aucun produit choisi", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Vide GO" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const t = nodes.editorSpec().types.find((x) => x.type === "produitsgo");
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "pgo000000002", type: "produitsgo", ...t.blank }] }] } } })).status, 200);
    const r = await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} });
    assert.notEqual(r.status, 200);
    assert.match(r.text, /choisissez au moins un produit/);
  });
});
