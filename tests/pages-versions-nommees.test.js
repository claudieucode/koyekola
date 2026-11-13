// Versions nommées : on nomme une version publiée, le nom s'affiche, il se retire, il est nettoyé (texte simple) ; une version nommée n'est jamais effacée par le nettoyage de l'historique.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor } = require("./helpers");

const SECT = (t) => ({ id: "sect0000000001", type: "layout", children: [{ id: "head0000000001", type: "heading", props: { text: t, level: "2" } }] });
describe("pages : versions nommées", () => {
  let srv, boss, db, pageId;
  const post = (p, body) => boss.request(p, { method: "POST", json: body || {}, headers: { origin: srv.base } });
  before(async () => {
    srv = await startServer({ SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    pageId = Number(((await boss.post("/marketing/pages", { name: "Page versions" })).location || "").match(/pages\/(\d+)/)[1]);
    for (const title of ["Titre un", "Titre deux"]) {
      const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
            assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: { origin: srv.base }, json: { revision: rev, content: { title, sections: [SECT(title)] } } })).status, 200);
      const pub = await post(`/marketing/pages/${pageId}/publier.json`); assert.equal(pub.status, 200, pub.text.slice(0, 300));
    }
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("nommer une version : le nom s'affiche dans la page, le texte est nettoyé", async () => {
    const r = await boss.post(`/marketing/pages/${pageId}/versions/1/nom`, { nom: "  Avant <b>refonte</b>\n client  " });
    assert.equal(r.status, 302);
    assert.equal(db.prepare("SELECT label FROM mk_page_versions WHERE page_id = ? AND number = 1").get(pageId).label, "Avant b refonte /b client");
    const page = await boss.get(`/marketing/pages/${pageId}`);
    assert.match(page.text, /« Avant b refonte \/b client »/);
    assert.doesNotMatch(page.text, /<b>refonte/);
  });
  test("un nom vide retire le nom ; une version inconnue est refusée proprement", async () => {
    await boss.post(`/marketing/pages/${pageId}/versions/1/nom`, { nom: "" });
    assert.equal(db.prepare("SELECT label FROM mk_page_versions WHERE page_id = ? AND number = 1").get(pageId).label, null);
    const bad = await boss.post(`/marketing/pages/${pageId}/versions/99/nom`, { nom: "x" });
    assert.ok([302, 404].includes(bad.status));
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_page_versions WHERE page_id = ? AND label IS NOT NULL").get(pageId).n, 0);
  });
  test("une version nommée survit au nettoyage de l'historique (au-delà de 100 versions)", async () => {
    await boss.post(`/marketing/pages/${pageId}/versions/1/nom`, { nom: "À garder" });
    const ins = db.prepare("INSERT INTO mk_page_versions (organization_id, page_id, number, content, reason) SELECT organization_id, page_id, ?, content, 'publish' FROM mk_page_versions WHERE page_id = ? AND number = 2");
    for (let n = 3; n <= 104; n++) ins.run(n, pageId);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const sections = [SECT("Titre trois")];
    await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: { origin: srv.base }, json: { revision: rev, content: { title: "Titre trois", sections } } });
    assert.equal((await post(`/marketing/pages/${pageId}/publier.json`)).status, 200);
    assert.ok(db.prepare("SELECT 1 FROM mk_page_versions WHERE page_id = ? AND number = 1").get(pageId), "version nommée conservée");
    assert.equal(db.prepare("SELECT 1 FROM mk_page_versions WHERE page_id = ? AND number = 2").get(pageId), undefined, "version non nommée trop ancienne effacée");
  });
});
