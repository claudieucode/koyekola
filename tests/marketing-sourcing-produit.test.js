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
    assert.match(res.text, /id="sourcing-app"[^>]*><\/section>/);
    assert.match(res.text, /href="\/marketing\/sourcing-produit"[^>]*aria-current|aria-current[^>]*href="\/marketing\/sourcing-produit"/);
    assert.equal((await boss.get("/marketing/sourcing-produit")).status, 200, "après actualisation");
  });
  test("les autres menus restent présents", async () => {
    const html = (await boss.get("/marketing/sourcing-produit")).text;
    for (const l of ["Campagnes", "Analytics", "Intégrations", "Paramètres"]) assert.ok(html.includes(l), l);
  });
});
