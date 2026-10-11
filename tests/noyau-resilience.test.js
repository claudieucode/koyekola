// Noyau : un élément dont les données sont corrompues ne doit pas faire tomber toute la page (publiée ou aperçu).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";

describe("noyau : résilience du rendu (vrai serveur)", () => {
  let srv, boss, db, id, slug;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    id = Number((await boss.post("/marketing/pages", { name: "Resilience" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const ok = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "R", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
      { id: "head00000001", type: "heading", props: { text: "Titre intact", level: "2" } },
      { id: "btn000000001", type: "button", props: { label: "Premier", url: "/catalogue", variant: "primary" } },
      { id: "btn000000002", type: "button", props: { label: "Second", url: "/blog", variant: "primary" } },
      { id: "head00000002", type: "heading", props: { text: "Autre titre intact", level: "2" } },
    ] }] }] } } });
    assert.equal(ok.status, 200, ok.text);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    // Corruption directe en base (ce que ni l'éditeur ni le serveur ne produiraient, mais qu'une ancienne version ou une erreur de migration pourrait laisser)
    const sections = JSON.parse(db.prepare("SELECT sections FROM mk_landing_pages WHERE id = ?").get(id).sections);
    sections[0].children[0].children.splice(2, 0, { id: "gall00000001", type: "gallery", props: { images: null } });
    db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify(sections), id);
  });
  after(() => srv.stop());

  test("page publiée : les liens cliquables gardent leur numéro (le compteur n'est pas décalé par l'élément ignoré)", async () => {
    const r = await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } });
    const hrefs = [...r.text.matchAll(/href="(\/p\/[^"]*\/clic\/\d+)[^"]*"/g)].map((m) => m[1].split("/").pop());
    assert.deepEqual(hrefs.filter((v, i) => hrefs.indexOf(v) === i).slice(0, 2), ["0", "1"]);
    const go = await new Client(srv.base).get(`/p/${slug}/clic/1`, { headers: { "User-Agent": UA } });
    assert.match(String(go.location || ""), /blog/);
  });

  test("aperçu de l'éditeur : un repère sélectionnable remplace l'élément, les données restent intactes", async () => {
    const draft = JSON.parse(db.prepare("SELECT sections FROM mk_landing_pages WHERE id = ?").get(id).sections);
    db.prepare("UPDATE mk_landing_pages SET draft = ? WHERE id = ?").run(JSON.stringify({ title: "R", description: "", seo: {}, theme: {}, sections: draft }), id);
    const before = db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft;
    const r = await boss.request(`/marketing/pages/${id}/apercu`);
    assert.equal(r.status, 200, "l'aperçu complet ne doit pas échouer");
    assert.match(r.text, /Autre titre intact/);
    assert.equal(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft, before, "aucune donnée modifiée par le rendu");
  });

  test("page publiée : l'élément corrompu est remplacé par un repère discret, le reste s'affiche", async () => {
    const r = await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } });
    assert.equal(r.status, 200, "la page entière ne doit pas échouer");
    assert.match(r.text, /Titre intact/); assert.match(r.text, /Autre titre intact/);
    assert.ok(!/kw-gallery/.test(r.text.replace(/<style[\s\S]*?<\/style>/g, "")), "pas de galerie à moitié affichée");
  });
});
