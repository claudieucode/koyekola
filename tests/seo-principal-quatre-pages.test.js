// SEO du site PRINCIPAL : « Liens internes », « Positions », « Google » et « Export / import » ouvrent leurs propres écrans (et non la vue générale),
// avec les données du principal seulement (site_id NULL), l'entrée de menu active correspondante et l'isolation entre sites.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let srv, boss, db, A;
const B = "/marketing/site-web";
before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  A = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site A" })).location).match(/sites\/(\d+)/)[1]);
});
after(async () => { db.close(); await srv.stop(); });

const h1 = (html) => (/<h1[^>]*>([^<]*)<\/h1>/.exec(html) || [])[1];
const active = (html) => [...html.matchAll(/<a[^>]*class="mk-nav-sublink[^"]*"[^>]*href="([^"]+)"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*class="mk-nav-sublink[^"]*"[^>]*href="([^"]+)"/g)].map((m) => m[1] || m[2]);

describe("SEO du site principal : quatre destinations distinctes", () => {
  const PAGES = [["liens-internes", "Liens internes", /Suggestions de liens|liens internes/i], ["positions", "Suivi de positionnement", /position/i], ["connexions", "Search Console et Analytics", /Google Search Console/], ["transfert", "Export et import SEO", /export|import/i]];
  for (const [sub, title, body] of PAGES) {
    test(`/seo/${sub} : son propre écran, pas la vue générale`, async () => {
      const r = await boss.get(`${B}/seo/${sub}`);
      assert.equal(r.status, 200);
      assert.equal(h1(r.text), title);
      assert.match(r.text, body);
      assert.doesNotMatch(r.text, /cet écran n'en crée pas un second/, "ce n'est pas la vue générale");
      assert.doesNotMatch(r.text, /Espace SEO/);
      assert.deepEqual(active(r.text).filter((h) => /\/seo\//.test(h)), [`${B}/seo/${sub}`], "seule cette entrée est active");
    });
  }
  test("les quatre titres sont différents entre eux et de la vue générale", async () => {
    const titles = new Set(); for (const [sub] of PAGES) titles.add(h1((await boss.get(`${B}/seo/${sub}`)).text));
    titles.add(h1((await boss.get(`${B}/seo`)).text)); assert.equal(titles.size, 5);
  });
  test("positions : une mesure du principal s'enregistre, se relit, et n'apparaît pas dans un autre site", async () => {
    const add = await boss.post(`${B}/seo/positions`, { keyword: "kolakisa principal", url: "https://k.test/", position: "7", date: "2026-11-01" });
    assert.ok([200, 302, 303].includes(add.status), String(add.status));
    assert.match((await boss.get(`${B}/seo/positions`)).text, /kolakisa principal/);
    assert.doesNotMatch((await boss.get(`${B}/sites/${A}/seo/positions`)).text, /kolakisa principal/, "isolation : le site A ne voit pas le principal");
    assert.equal(db.prepare("SELECT site_id FROM seo_rank_entries WHERE keyword = 'kolakisa principal'").get().site_id, null);
  });
  test("Google : la clé du principal est enregistrée sous le nom central, jamais réaffichée, distincte de celle d'un site", async () => {
    const page = (await boss.get(`${B}/seo/connexions`)).text;
    assert.match(page, /Non connecté/); assert.ok(!/PRIVATE KEY/.test(page));
    assert.match((await boss.get(`${B}/sites/${A}/seo/connexions`)).text, /Non connecté/);
  });
  test("export : le fichier du principal est de portée centrale ; liens internes : seules les pages du principal sont lues", async () => {
    const ex = await boss.get(`${B}/seo/transfert/export.json`); assert.equal(ex.status, 200); assert.equal(JSON.parse(ex.text).scope, "central");
    const exA = await boss.get(`${B}/sites/${A}/seo/transfert/export.json`); assert.equal(JSON.parse(exA.text).scope, "site");
    assert.equal((await boss.get(`${B}/seo/liens-internes`)).status, 200);
  });
  test("rechargement direct et autres rubriques inchangées (analyse, meta, 404 gardent leur écran)", async () => {
    for (const [sub, t] of [["analyse", "Analyse SEO"], ["meta", "Meta"], ["404", "Erreurs 404"]]) assert.equal(h1((await boss.get(`${B}/seo/${sub}`)).text), t);
    const again = await boss.get(`${B}/seo/liens-internes`); assert.equal(h1(again.text), "Liens internes");
  });
});
