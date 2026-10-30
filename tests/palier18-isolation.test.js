// Palier 18 — isolation entre sites par ACCÈS DIRECT aux routes (sans passer par les boutons) :
// l'identifiant de site envoyé par le navigateur n'est qu'une demande, jamais une preuve d'autorisation.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("Palier 18 : isolation par accès direct", () => {
  let srv, boss, db, orgId, A, B, editorA, pageA, pageB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    editorA = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, idOf(editorA));
    const page = (name, s) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, '[]', 'published', 'page', ?, datetime('now'))").run(orgId, name, name.toLowerCase(), name, s).lastInsertRowid);
    pageA = page("PageAlpha", A); pageB = page("PageBeta", B);
  });
  after(() => { db.close(); return srv.stop(); });

  test("anonyme : aucune route d'administration n'est servie", async () => {
    const anon = new Client(srv.base);
    for (const p of ["/marketing", "/marketing/site-web/mes-sites", `/marketing/pages/${pageB}/editeur`, "/marketing/site-web/medias.json", "/marketing/site-web/equipe-site", "/formateur"]) {
      const r = await anon.get(p);
      assert.ok([301, 302, 303, 401, 403].includes(r.status), `${p} → ${r.status}`);
      assert.doesNotMatch(r.text, /PageBeta|PageAlpha/);
    }
  });

  test("personne limitée au site A : le contenu du site B reste inaccessible, quelle que soit la façon de le demander", async () => {
    for (const p of [`/marketing/pages/${pageB}/editeur?site=${B}`, `/marketing/pages/${pageB}/editeur?site=${A}`, `/marketing/pages/${pageB}/editeur`, `/marketing/pages/${pageB}/apercu?site=${B}`, `/marketing/pages/${pageB}/exporter?site=${B}`, `/marketing/site-web/medias.json?site=${B}`, `/marketing/site-web/equipe-site?site=${B}`]) {
      const r = await editorA.get(p);
      assert.doesNotMatch(r.text, /PageBeta/, `${p} révèle le contenu de B (statut ${r.status})`);
      assert.notEqual(r.status, 500, p);
      assert.ok(r.status !== 200 || !r.text.includes("PageBeta"), p);
    }
  });

  test("contrôle positif : la même personne ouvre normalement la page de SON site", async () => {
    const r = await editorA.get(`/marketing/pages/${pageA}/editeur?site=${A}`);
    assert.equal(r.status, 200, "l'éditeur du site A doit s'ouvrir");
    const denied = await editorA.get(`/marketing/pages/${pageB}/editeur?site=${B}`);
    assert.notEqual(denied.status, 200, "la page du site B ne doit pas s'ouvrir");
  });

  test("personne limitée au site A : le site principal et les identifiants falsifiés sont refusés", async () => {
    for (const s of ["principal", "", "999999", "0", "-1", "1 OR 1=1", "../../etc", "%00"]) {
      const r = await editorA.get(`/marketing/site-web/mes-sites?site=${encodeURIComponent(s)}`);
      assert.notEqual(r.status, 500, `site=${s}`);
      assert.doesNotMatch(r.text, /PageBeta/);
    }
    const principal = await editorA.get("/marketing/site-web/mes-sites?site=principal");
    assert.ok(principal.status !== 200 || !/data-site="principal"[\s\S]{0,400}Ouvrir/.test(principal.text) || /Vous n'avez pas accès|introuvable/i.test(principal.text) || principal.status !== 200, "le principal reste réservé à l'équipe");
  });

  test("écriture directe dans le site B refusée, même avec ?site=A ou un champ de formulaire falsifié ; aucune donnée modifiée", async () => {
    const before = one("SELECT name, title, status, sections FROM mk_landing_pages WHERE id = ?", pageB);
    for (const [path, body] of [
      [`/marketing/pages/${pageB}/supprimer?site=${B}`, {}], [`/marketing/pages/${pageB}/supprimer?site=${A}`, { site: String(A) }],
      [`/marketing/pages/${pageB}?site=${A}`, { name: "PIRATÉ", title: "PIRATÉ", site: String(B) }],
      [`/marketing/pages/${pageB}/dupliquer?site=${B}`, {}], [`/marketing/pages/${pageB}/publier?site=${B}`, {}],
    ]) {
      const r = await editorA.post(path, body);
      assert.notEqual(r.status, 500, path);
    }
    assert.deepEqual(one("SELECT name, title, status, sections FROM mk_landing_pages WHERE id = ?", pageB), before, "la page du site B est intacte");
    assert.ok(one("SELECT id FROM mk_landing_pages WHERE id = ?", pageB), "la page B existe toujours");
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", B).n, 1, "aucune copie dans B");
  });

  test("le compte d'administration voit bien les deux sites (le refus n'est pas un défaut d'installation)", async () => {
    const r = await boss.get(`/marketing/site-web/mes-sites?vue=tous`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Alpha/); assert.match(r.text, /Beta/);
  });

  test("pages publiques : un brouillon du site B n'est pas servi, une page inconnue répond 404 sans trace", async () => {
    db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE id = ?").run(pageB);
    const r = await new Client(srv.base).get("/p/pagebeta");
    assert.ok([404, 302, 301, 410].includes(r.status) || !r.text.includes("PageBeta"), `brouillon servi : ${r.status}`);
    const miss = await new Client(srv.base).get("/p/n-existe-pas-" + Date.now());
    assert.equal(miss.status, 404);
    assert.doesNotMatch(miss.text, /at .*\.js:\d+|SQLITE|Error:/);
  });
});
