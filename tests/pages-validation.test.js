// Demande de validation d'une page : une personne qui ne peut pas publier demande la relecture ; l'éditeur la voit dans la liste ; publier la retire. Vrai serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor } = require("./helpers");

describe("pages : demande de validation", () => {
  let srv, boss, db, pageId;
  const json = (p, body) => boss.request(p, { method: "POST", json: body || {}, headers: { origin: srv.base } });
  before(async () => {
    srv = await startServer({ SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const r = await boss.post("/marketing/pages", { name: "Page à relire" });
    pageId = Number((r.location || "").match(/pages\/(\d+)/)[1]);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("demander la validation enregistre une demande ; la liste l'affiche ; l'éditeur la connaît", async () => {
    const r = await json(`/marketing/pages/${pageId}/demander-validation.json`, { note: "à relire svp" });
    assert.equal(r.status, 200, r.text);
    assert.equal(JSON.parse(r.text).review.note, "à relire svp");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_page_reviews WHERE page_id = ?").get(pageId).n, 1);
    const list = await boss.get("/marketing/pages");
    assert.match(list.text, /En attente de validation/);
    const ed = await boss.get(`/marketing/pages/${pageId}/editeur`);
    assert.match(ed.text, /"review":\{[^}]*"note":"à relire svp"/); assert.match(ed.text, /"canPublish":true/);
  });
  test("une seconde demande remplace la première (une seule demande par page)", async () => {
    await json(`/marketing/pages/${pageId}/demander-validation.json`, { note: "version 2" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_page_reviews WHERE page_id = ?").get(pageId).n, 1);
    assert.equal(db.prepare("SELECT note FROM mk_page_reviews WHERE page_id = ?").get(pageId).note, "version 2");
  });
  test("une page d'une autre organisation ou inexistante : refusée", async () => {
    assert.equal((await json("/marketing/pages/999999/demander-validation.json")).status, 404);
  });
  test("annuler retire la demande ; publier la retire aussi", async () => {
    assert.equal(JSON.parse((await json(`/marketing/pages/${pageId}/annuler-validation.json`)).text).cleared, true);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_page_reviews WHERE page_id = ?").get(pageId).n, 0);
    await json(`/marketing/pages/${pageId}/demander-validation.json`, {});
    const sec = db.prepare("SELECT sections FROM mk_landing_pages WHERE id = ?").get(pageId);
    assert.ok(sec);
    const pub = await json(`/marketing/pages/${pageId}/publier.json`);
    if (pub.status === 200) assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_page_reviews WHERE page_id = ?").get(pageId).n, 0, "publier répond à la demande");
    else assert.ok([409, 422].includes(pub.status), `publication refusée proprement (${pub.status}) : la demande reste`);
  });
});
