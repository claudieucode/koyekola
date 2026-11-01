// Theme Builder : identité EXPLICITE du modèle ouvert. Le canevas montre le même en-tête que le site publié, chaque partie globale porte le composant ET le modèle exacts,
// l'éditeur du composant affiche site/type/modèle/statut, un modèle qui n'ouvre pas ce composant est REFUSÉ (jamais un autre ouvert en silence), isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const CONTENT = (t) => ({ title: t, sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: `Corps ${t}`, level: "1" } }] }] });

describe("Theme Builder : identité du modèle ouvert", () => {
  let srv, boss, db, A, B, pageA, hdrA, hdrA2, hdrB;
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const tpl = async (site, type, name, conditions = {}) => { const r = await post(U(site, "/api/modeles"), { type, name, conditions }); assert.equal(r.status, 200, r.text.slice(0, 300)); return json(r).template; };
  const publish = async (site, t) => { const r = await post(U(site, `/api/modeles/${t.id}/publier`)); assert.equal(r.status, 200, r.text.slice(0, 300)); return json(r).template; };
  const canvas = async (id) => boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", headers: { Origin: srv.base }, json: { content: CONTENT("X") } });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (n) => Number((await boss.post("/marketing/site-web/sites", { name: n })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    pageA = Number((await boss.post("/marketing/pages", { name: "Accueil A", site_id: A, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    hdrA = await tpl(A, "header", "HEADERALPHA"); await publish(A, hdrA);
    hdrA2 = await tpl(A, "header", "HEADERALPHABROUILLON", { include: [{ kind: "page", ids: [pageA] }] }); // brouillon : ne s'applique jamais
    hdrB = await tpl(B, "header", "HEADERBRAVO"); await publish(B, hdrB);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("le canevas montre l'en-tête du modèle publié, avec le composant et le modèle exacts + bouton « Modifier l'en-tête »", async () => {
    const r = await canvas(pageA); assert.equal(r.status, 200, r.text.slice(0, 200));
    const m = /data-part-edit="(\d+)" data-part-kind="header" data-part-template="(\d+)"/.exec(r.text);
    assert.ok(m, "bouton Modifier présent avec identifiants");
    assert.equal(Number(m[2]), hdrA.id, "le modèle publié (pas le brouillon)");
    assert.equal(Number(m[1]), hdrA.sourceId, "le composant de CE modèle");
    assert.match(r.text, /Modifier l(?:'|&#39;)en-tête/);
  });

  test("l'éditeur du composant affiche site, type, modèle et statut ; retour au Theme Builder", async () => {
    const r = await boss.get(`/marketing/site-web/composants/${hdrA.sourceId}/editeur?modele=${hdrA.id}&retour=tb`);
    assert.equal(r.status, 200);
    assert.match(r.text, /data-pb-identity/);
    assert.match(r.text, /Site Alpha/);
    assert.match(r.text, /HEADERALPHA/);
    assert.match(r.text, /publié/);
    assert.ok(r.text.includes(`/marketing/site-web/sites/${A}/constructeur-de-theme`), "lien de retour");
  });

  test("un modèle qui n'ouvre pas ce composant, ou d'un autre site, est refusé (jamais un autre ouvert en silence)", async () => {
    const wrong = await boss.get(`/marketing/site-web/composants/${hdrA.sourceId}/editeur?modele=${hdrA2.id}`);
    assert.equal(wrong.status, 404);
    const other = await boss.get(`/marketing/site-web/composants/${hdrA.sourceId}/editeur?modele=${hdrB.id}`);
    assert.equal(other.status, 404);
    const unknown = await boss.get(`/marketing/site-web/composants/${hdrA.sourceId}/editeur?modele=999999`);
    assert.equal(unknown.status, 404);
  });

  test("le lien d'édition d'une carte du Theme Builder porte l'identifiant du modèle", async () => {
    const r = await boss.get(U(A, "/api/modeles"));
    const card = json(r).templates.find((t) => t.id === hdrA.id);
    assert.ok(card.editUrl.includes(`modele=${hdrA.id}`), card.editUrl);
  });

  test("sans modèle demandé : l'identité est retrouvée par la source (un seul modèle l'utilise)", async () => {
    const r = await boss.get(`/marketing/site-web/composants/${hdrB.sourceId}/editeur`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Site Bravo/);
    assert.match(r.text, /HEADERBRAVO/);
  });
});
