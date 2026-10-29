// Palier 12 — isolation des composants et du Theme Builder par les vraies routes : un membre du site A ne lit, n'enregistre, ne met à jour, n'abandonne,
// ne supprime et n'aperçoit AUCUN composant propre au site B ; il ne modifie pas non plus un composant global (partagé par tous les sites) ;
// un lecteur (forms.read) ne peut rien écrire. Les accès légitimes (composant de son site) continuent de fonctionner.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let srv, db, orgId, memA, viewerA, A, B, compA, compB, compGlobal, pageA;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const uid = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const ORIGIN = () => ({ Origin: srv.base });
const mkSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-")).lastInsertRowid);
const mkComp = (site, name) => Number(db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section) VALUES (?, ?, ?, ?)").run(orgId, site, name, JSON.stringify({ type: "text", markdown: name })).lastInsertRowid);
const comp = (id) => one("SELECT * FROM mk_web_components WHERE id = ?", id);
const section = (t) => ({ type: "text", markdown: t });

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  A = mkSite("Site A"); B = mkSite("Site B");
  compA = mkComp(A, "Comp A"); compB = mkComp(B, "Comp B"); compGlobal = mkComp(null, "Comp Global");
  pageA = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, 'Page A', 'p12-page-a', 'T', 'draft', ?)").run(orgId, A).lastInsertRowid);
  memA = await newStudent(srv); viewerA = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, uid(memA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(A, uid(viewerA));
});
after(() => srv.stop());

const put = (c, id, rev, title = "Pirate") => c.request(`/marketing/site-web/composants/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [section(title)], title: "x" } }, headers: ORIGIN() });

describe("composants d'un autre site : toutes les routes refusent côté serveur", () => {
  test("lecture : éditeur, rendu, aperçu, instances du composant de B → 403/404, rien d'exposé", async () => {
    for (const u of [`/marketing/site-web/composants/${compB}/editeur`, `/marketing/site-web/composants/${compB}/apercu`, `/marketing/site-web/composants/${compB}/instances.json`]) {
      const r = await memA.get(u);
      assert.ok([403, 404].includes(r.status), `${u} → ${r.status}`);
      assert.doesNotMatch(r.text, /Comp B/, `${u} ne révèle pas le contenu`);
    }
    const rendu = await memA.request(`/marketing/site-web/composants/${compB}/rendu`, { method: "POST", json: { content: { sections: [section("x")], title: "x" } }, headers: ORIGIN() });
    assert.ok([403, 404].includes(rendu.status), `rendu → ${rendu.status}`);
  });
  test("écriture : brouillon, mise à jour, abandon, modification, suppression du composant de B → refusés, la base ne change pas", async () => {
    const before = JSON.stringify(comp(compB));
    const r1 = await put(memA, compB, comp(compB).revision);
    assert.ok([403, 404].includes(r1.status), `brouillon → ${r1.status}`);
    for (const [u, body] of [[`/marketing/site-web/composants/${compB}/mettre-a-jour`, {}], [`/marketing/site-web/composants/${compB}/abandonner`, {}],
      [`/marketing/site-web/composants/${compB}`, { name: "Pirate" }], [`/marketing/site-web/composants/${compB}/supprimer`, {}]]) {
      const r = await memA.request(u, { method: "POST", json: body, headers: ORIGIN() });
      assert.ok([403, 404].includes(r.status), `${u} → ${r.status}`);
    }
    assert.equal(JSON.stringify(comp(compB)), before, "composant de B intact");
  });
});

describe("composant global : partagé par tous les sites, donc non modifiable par un membre d'un seul site", () => {
  test("un membre de A ne modifie ni ne publie ni ne supprime un composant global (il peut le lire pour l'utiliser)", async () => {
    const before = JSON.stringify(comp(compGlobal));
    const r1 = await put(memA, compGlobal, comp(compGlobal).revision);
    assert.ok([403, 404].includes(r1.status), `brouillon global → ${r1.status}`);
    for (const u of [`/marketing/site-web/composants/${compGlobal}/mettre-a-jour`, `/marketing/site-web/composants/${compGlobal}/supprimer`, `/marketing/site-web/composants/${compGlobal}/abandonner`]) {
      const r = await memA.request(u, { method: "POST", json: {}, headers: ORIGIN() });
      assert.ok([403, 404].includes(r.status), `${u} → ${r.status}`);
    }
    assert.equal(JSON.stringify(comp(compGlobal)), before, "composant global intact");
  });
});

describe("témoins : le composant de son propre site fonctionne ; un lecteur ne peut rien écrire", () => {
  test("le membre de A lit, enregistre le brouillon et met à jour son composant", async () => {
    assert.equal((await memA.get(`/marketing/site-web/composants/${compA}/editeur`)).status, 200);
    const r = await put(memA, compA, comp(compA).revision, "Modifié");
    assert.equal(r.status, 200, r.text);
    assert.match(comp(compA).draft, /Modifié/);
    const m = await memA.request(`/marketing/site-web/composants/${compA}/mettre-a-jour`, { method: "POST", json: { revision: comp(compA).revision }, headers: ORIGIN() });
    assert.equal(m.status, 200, m.text);
    assert.match(comp(compA).section, /Modifié/);
  });
  test("le lecteur du site A lit son composant mais ne peut ni enregistrer ni mettre à jour", async () => {
    assert.equal((await viewerA.get(`/marketing/site-web/composants/${compA}/editeur`)).status, 200);
    const before = JSON.stringify(comp(compA));
    const r = await put(viewerA, compA, comp(compA).revision);
    assert.equal(r.status, 403);
    const m = await viewerA.request(`/marketing/site-web/composants/${compA}/mettre-a-jour`, { method: "POST", json: {}, headers: ORIGIN() });
    assert.equal(m.status, 403);
    assert.equal(JSON.stringify(comp(compA)), before);
  });
});

describe("conflit d'enregistrement : une copie périmée n'écrase pas une modification plus récente", () => {
  test("brouillon de composant avec une révision périmée → 409 ; sans révision → refusé (comme les pages)", async () => {
    const r0 = comp(compA).revision;
    assert.equal((await put(memA, compA, r0, "Première")).status, 200);
    const stale = await put(memA, compA, r0, "Périmée");
    assert.equal(stale.status, 409, stale.text);
    assert.match(comp(compA).draft, /Première/);
    const none = await memA.request(`/marketing/site-web/composants/${compA}/brouillon`, { method: "PUT", json: { content: { sections: [section("Sans révision")], title: "x" } }, headers: ORIGIN() });
    assert.ok([400, 409, 422].includes(none.status), `sans révision → ${none.status}`);
    assert.match(comp(compA).draft, /Première/, "l'écriture sans révision n'a rien écrasé");
  });
});
