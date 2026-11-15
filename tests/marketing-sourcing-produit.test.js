// Menu Marketing : « Sourcing produit » (entre Analytics et Intégrations), page vide servie par sa propre adresse, droits et site courant respectés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");
const nav = require("../src/marketing/web/nav");

let srv, boss;
before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
after(() => srv.stop());

describe("Sourcing produit", () => {
  test("registre : placé juste après Analytics et avant Intégrations, lien direct", () => {
    const keys = nav.SECTIONS.map((s) => s.key);
    assert.equal(keys.indexOf("sourcing"), keys.indexOf("analytics") + 1);
    assert.equal(keys.indexOf("integrations"), keys.indexOf("sourcing") + 1);
    const r = nav.buildNav({ can: () => true, active: "sourcing" });
    const s = r.sections.find((x) => x.key === "sourcing");
    assert.equal(s.flat, true);
    assert.equal(s.items[0].current, true);
    assert.equal(s.items[0].href, "/marketing/sourcing-produit");
    assert.deepEqual(r.sections.map((x) => x.key).filter((k) => ["analytics", "sourcing", "integrations"].includes(k)), ["analytics", "sourcing", "integrations"]);
  });
  test("sans droit de lecture, l'entrée n'apparaît pas", () => {
    const r = nav.buildNav({ can: (p) => p !== "campaigns.read", active: "dashboard" });
    assert.ok(!r.sections.some((x) => x.key === "sourcing"));
  });
  test("la page répond, affiche le titre et l'entrée active, et le point de montage est vide", async () => {
    const res = await boss.get("/marketing/sourcing-produit");
    assert.equal(res.status, 200);
    assert.match(res.text, /<h1>Sourcing produit<\/h1>/);
    assert.match(res.text, /id="sourcing-app"[^>]*>\s*<iframe class="mk-sourcing-frame" src="\/marketing\/sourcing-produit\/app\?embed=1"/);
    assert.match(res.text, /href="\/marketing\/sourcing-produit"[^>]*aria-current|aria-current[^>]*href="\/marketing\/sourcing-produit"/);
    assert.equal((await boss.get("/marketing/sourcing-produit")).status, 200, "après actualisation");
  });
  test("l'application et ses données sont servies derrière la même permission, non indexées", async () => {
    const app = await boss.get("/marketing/sourcing-produit/app?embed=1");
    assert.equal(app.status, 200);
    assert.match(app.headers.get("content-type"), /text\/html/);
    assert.match(app.headers.get("x-robots-tag"), /noindex/);
    assert.match(app.text, /kx-embed/);
    const data = await boss.get("/marketing/sourcing-produit/products.json");
    assert.equal(data.status, 200);
    assert.ok(Array.isArray(JSON.parse(data.text).products));
  });
  test("données : le fichier persistant l'emporte, un fichier illisible retombe sur l'instantané livré", () => {
    const fs = require("fs"), os = require("os"), path = require("path");
    const { readProducts } = require("../src/marketing/web/sourcing");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nkw-")), before = process.env.NAKEWENZE_DATA_DIR;
    process.env.NAKEWENZE_DATA_DIR = dir;
    try {
      fs.writeFileSync(path.join(dir, "products.json"), JSON.stringify({ updated: "t", products: [{ id: "x" }] }));
      assert.equal(JSON.parse(readProducts()).products[0].id, "x");
      fs.writeFileSync(path.join(dir, "products.json"), "{ coupé");
      assert.ok(JSON.parse(readProducts()).products.length > 1);
    } finally { if (before === undefined) delete process.env.NAKEWENZE_DATA_DIR; else process.env.NAKEWENZE_DATA_DIR = before; fs.rmSync(dir, { recursive: true, force: true }); }
  });
  test("sans droit de lecture, ni l'application ni les données ne sont servies", async () => {
    const st = await newStudent(srv);
    assert.notEqual((await st.get("/marketing/sourcing-produit/app")).status, 200);
    assert.notEqual((await st.get("/marketing/sourcing-produit/products.json")).status, 200);
  });
  test("les autres menus restent présents", async () => {
    const html = (await boss.get("/marketing/sourcing-produit")).text;
    for (const l of ["Campagnes", "Analytics", "Intégrations", "Paramètres"]) assert.ok(html.includes(l), l);
  });
});
