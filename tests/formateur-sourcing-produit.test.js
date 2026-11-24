// Sourcing produit dans « Mon espace » (rubrique Croissance, /formateur/sourcing-produit) : entrée de navigation, page, application et données servies
// derrière la connexion formateur, non indexées ; l'ancienne adresse du menu Marketing redirige ; le menu Marketing ne la montre plus.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), os = require("os"), path = require("path");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");
const nav = require("../src/marketing/web/nav");
const dashboard = require("../src/services/dashboard");

let srv, boss;
before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
after(() => srv.stop());

describe("Sourcing produit (Mon espace)", () => {
  test("navigation : dans Croissance après SEO ; plus dans le menu Marketing", () => {
    const g = dashboard.NAV.find((x) => x.group === "Croissance");
    assert.deepEqual(g.items.map((i) => i.key), ["marketing", "seo", "sourcing"]);
    assert.equal(g.items[2].href, "/formateur/sourcing-produit");
    assert.ok(!nav.SECTIONS.some((s) => s.key === "sourcing"));
    assert.ok(!nav.buildNav({ can: () => true, active: "dashboard" }).sections.some((x) => x.key === "sourcing"));
  });
  test("la page répond, titre unique, cadre de l'application, entrée active et fil d'Ariane", async () => {
    const res = await boss.get("/formateur/sourcing-produit");
    assert.equal(res.status, 200);
    assert.equal((res.text.match(/<h1[\s>]/g) || []).length, 1);
    assert.match(res.text, /<h1>Sourcing produit<\/h1>/);
    assert.match(res.text, /id="sourcing-app"[^>]*>\s*<iframe class="dash-sourcing-frame" src="\/formateur\/sourcing-produit\/app\?embed=1"/);
    assert.match(res.text, /href="\/formateur\/sourcing-produit"[^>]*aria-current|aria-current[^>]*href="\/formateur\/sourcing-produit"/);
  });
  test("l'ancienne adresse Marketing redirige définitivement", async () => {
    const r = await boss.get("/marketing/sourcing-produit");
    assert.equal(r.status, 301);
    assert.equal(r.location, "/formateur/sourcing-produit");
  });
  test("application et données servies, non indexées, sans cache public", async () => {
    const app = await boss.get("/formateur/sourcing-produit/app?embed=1");
    assert.equal(app.status, 200);
    assert.match(app.headers.get("content-type"), /text\/html/);
    assert.match(app.headers.get("x-robots-tag"), /noindex/);
    assert.match(app.text, /kx-embed/);
    assert.match(app.text, /dashDark/, "suit le thème de l'espace de travail");
    const data = await boss.get("/formateur/sourcing-produit/products.json");
    assert.equal(data.status, 200);
    assert.match(data.headers.get("cache-control"), /private, no-store/);
    assert.ok(Array.isArray(JSON.parse(data.text).products));
  });
  test("données : le fichier persistant l'emporte, un fichier illisible retombe sur l'instantané livré", () => {
    const catalog = require("../src/marketing/sourcing/catalog");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nkw-")), before = process.env.NAKEWENZE_DATA_DIR;
    process.env.NAKEWENZE_DATA_DIR = dir;
    try {
      fs.writeFileSync(path.join(dir, "products.json"), JSON.stringify({ updated: "t", products: [{ id: "x" }] }));
      assert.equal(catalog.load().products[0].id, "x");
      fs.writeFileSync(path.join(dir, "products.json"), "{ coupé");
      assert.ok(catalog.load().products.length > 1);
    } finally { if (before === undefined) delete process.env.NAKEWENZE_DATA_DIR; else process.env.NAKEWENZE_DATA_DIR = before; fs.rmSync(dir, { recursive: true, force: true }); }
  });
  test("un élève n'accède ni à la page, ni à l'application, ni aux données", async () => {
    const st = await newStudent(srv);
    for (const u of ["/formateur/sourcing-produit", "/formateur/sourcing-produit/app", "/formateur/sourcing-produit/products.json"]) assert.notEqual((await st.get(u)).status, 200, u);
  });
});
