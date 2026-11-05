// Theme Builder v2 — miniatures RÉELLES (rendu du moteur public pour CE modèle), isolation par site, bouton Retour sûr.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

describe("miniatures réelles et retour", () => {
  let srv, boss, db, A, B;
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: { Origin: srv.base } });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (n) => Number((await boss.post("/marketing/site-web/sites", { name: n })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site A"); B = await mk("Site B");
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("bibliothèque : la vignette de chaque type est le rendu du bon modèle, sans bloc de remplissage, et se met en cache", async () => {
    const types = JSON.parse((await boss.get(U(A, "/api/bibliotheque"))).text).types.filter((t) => t.available);
    assert.ok(types.length >= 6);
    for (const t of types) {
      const keys = JSON.parse((await boss.get(U(A, `/api/bibliotheque?type=${t.type}&limite=2`))).text).items.map((i) => i.key);
      const seen = [];
      for (const key of keys) {
        const r = await boss.get(U(A, `/api/bibliotheque/${t.type}/${key}/vignette`));
        assert.equal(r.status, 200, `${t.type}/${key}`); assert.match(r.text, /kw-theme-(part|template)/); assert.doesNotMatch(r.text, /Contenu de la page \(aperçu\)/, "pas de remplissage dans une miniature");
        assert.match(String(r.headers.get("cache-control")), /max-age=120/); seen.push(r.text);
      }
      if (seen.length === 2) assert.notEqual(seen[0], seen[1], `${t.type} : deux modèles distincts n'ont pas la même miniature`);
    }
    assert.equal((await boss.get(U(A, "/api/bibliotheque/header/inconnu.inconnu/vignette"))).status, 404);
  });
  test("modèle du site : la vignette montre son document enregistré ; un autre site ne peut pas la lire", async () => {
    const used = await post(U(A, "/api/bibliotheque/utiliser"), { type: "footer", key: "ligne-copyright-menu.clair" });
    const id = JSON.parse(used.text).template.id;
    const v = await boss.get(U(A, `/api/modeles/${id}/vignette`)); assert.equal(v.status, 200); assert.match(v.text, /kw-theme-footer/); assert.match(v.text, /Tous droits/);
    assert.equal((await boss.get(U(B, `/api/modeles/${id}/vignette`))).status, 404, "isolation entre sites");
    assert.equal((await boss.get(U(A, "/api/modeles/999999/vignette"))).status, 404);
    const anon = await fetch(`${srv.base}${U(A, `/api/modeles/${id}/vignette`)}`, { redirect: "manual" }); assert.ok([301, 302, 401, 403].includes(anon.status));
  });
  test("Retour : par défaut le tableau de bord du site ; une adresse interne fournie est reprise ; jamais une adresse externe", async () => {
    const href = (html) => (html.match(/id="tb-exit" href="([^"]*)"/) || [])[1];
    assert.equal(href((await boss.get(U(A))).text), `/marketing/site-web/sites/${A}/tableau-de-bord`);
    assert.equal(href((await boss.get(`${U(A)}?retour=${encodeURIComponent("/marketing/pages/12/editeur?site=" + A)}`)).text), `/marketing/pages/12/editeur?site=${A}`.replace(/&/g, "&amp;"));
    for (const bad of ["https://evil.test/x", "//evil.test/x", "/a/../../etc", "javascript:alert(1)"]) assert.equal(href((await boss.get(`${U(A)}?retour=${encodeURIComponent(bad)}`)).text), `/marketing/site-web/sites/${A}/tableau-de-bord`, bad);
  });
});
