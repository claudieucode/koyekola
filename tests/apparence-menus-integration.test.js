// KOLAKISA CMS — Apparence → Menus est LA seule entrée de gestion des menus : plus d'entrée autonome « Navigation » dans le menu latéral (site principal comme site),
// l'ancienne adresse /navigation continue de s'ouvrir (affichée sous Apparence → Menus), et le sélecteur de menu de l'éditeur ne propose que les menus DU site.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

describe("Apparence → Menus : seule entrée, ancienne adresse conservée, sélecteur", () => {
  let srv, boss, db, A, B, mA1, mA2, mB;
  const R = "/marketing/site-web";
  // éléments du menu latéral (liens de la barre de gauche), sans le contenu de la page
  const sidebar = (html) => (/<aside[\s\S]*?<\/aside>/.exec(html) || [html])[0];
  const labels = (html) => [...sidebar(html).matchAll(/<a [^>]*>([\s\S]*?)<\/a>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()).filter(Boolean);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const menu = (name, siteId) => Number(db.prepare("INSERT INTO nav_menus (name, slug, site_id, status) VALUES (?, ?, ?, 'published')").run(name, slug(name), siteId).lastInsertRowid);
    mA1 = menu("Principal Alpha", A); mA2 = menu("Pied Alpha", A); mB = menu("Secret Beta", B);
  });
  after(() => { db.close(); return srv.stop(); });

  test("le menu latéral n'a plus d'entrée « Navigation » : ni dans l'espace d'un site, ni dans celui du principal ; « Menus » est sous Apparence", async () => {
    for (const url of [`${R}/sites/${A}/apparence/menus`, `${R}/sites/${A}/navigation`, `${R}/navigation`, `${R}/apparence/menus`]) {
      const r = await boss.get(url);
      if (r.status === 404) continue; // adresse non servie : couverte par la suivante
      assert.equal(r.status, 200, url);
      const l = labels(r.text);
      assert.ok(!l.includes("Navigation"), `${url} : plus d'entrée Navigation (${l.filter((x) => /navig/i.test(x))})`);
      assert.ok(l.includes("Menus"), `${url} : Apparence → Menus présent`);
      assert.ok(l.indexOf("Menus") > l.indexOf("Widgets") && l.includes("Widgets"), `${url} : « Menus » est dans le groupe Apparence (après Widgets)`);
    }
  });

  test("l'ancienne adresse /navigation (site et principal) s'ouvre toujours, et l'entrée active du menu est « Menus »", async () => {
    for (const url of [`${R}/sites/${A}/navigation`, `${R}/navigation`, `${R}/navigation?site=${A}`]) {
      const r = await boss.get(url); assert.equal(r.status, 200, url);
      assert.match(r.text, /aria-current="page"[^>]*>\s*(?:<[^>]+>\s*)*Menus/, `${url} : « Menus » est l'entrée active`);
    }
  });

  test("l'éditeur d'un menu propose un sélecteur des menus DU site (jamais ceux d'un autre site) ; un menu d'un autre site reste introuvable", async () => {
    const r = await boss.get(`${R}/navigation/menus/${mA1}?site=${A}`); assert.equal(r.status, 200);
    const sel = /<select id="nm-pick"[\s\S]*?<\/select>/.exec(r.text); assert.ok(sel, "sélecteur présent");
    assert.match(sel[0], /Principal Alpha/); assert.match(sel[0], /Pied Alpha/); assert.doesNotMatch(sel[0], /Secret Beta/);
    assert.match(sel[0], new RegExp(`menus/${mA2}\\?site=${A}`));
    assert.equal((await boss.get(`${R}/sites/${A}/navigation/menus/${mB}`)).status, 404, "dans l'espace de A, le menu de B est introuvable");
  });

  test("un site qui n'a qu'un menu n'affiche pas de sélecteur inutile", async () => {
    const r = await boss.get(`${R}/navigation/menus/${mB}?site=${B}`); assert.equal(r.status, 200);
    assert.ok(!r.text.includes('id="nm-pick"'));
  });
});
