// Palier 17 — non-régression des vulnérabilités confirmées par l'audit (vraies routes, vrai serveur, vraie base de test).
// Chaque test décrit l'attaque, puis vérifie le refus ET que l'accès légitime fonctionne toujours.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, INSTRUCTOR } = require("./helpers");

let srv, boss, db, orgId, A, B, memA, listA;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const uid = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const ORIGIN = () => ({ Origin: srv.base });
const mkSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-")).lastInsertRowid);
const members = (list) => db.prepare("SELECT c.email FROM mk_list_members m JOIN mk_contacts c ON c.id = m.contact_id WHERE m.list_id = ? ORDER BY c.email").all(list).map((r) => r.email);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  A = mkSite("Site A17"); B = mkSite("Site B17");
  memA = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, uid(memA));
  listA = Number(db.prepare("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (?, 'Liste A17', ?)").run(orgId, A).lastInsertRowid);
  // contact du site A (origine A) et contact du site B uniquement
  const ca = db.prepare("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (?, 'membre-a@exemple.fr', ?)").run(orgId, A).lastInsertRowid;
  const cb = db.prepare("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (?, 'client-b@exemple.fr', ?)").run(orgId, B).lastInsertRowid;
  for (const [c, s] of [[ca, A], [cb, B]]) db.prepare("INSERT OR IGNORE INTO mk_contact_sites (contact_id, site_id, organization_id, link) VALUES (?, ?, ?, 'origin')").run(c, s, orgId);
});
after(() => srv.stop());

describe("F1 — liste d'un site : ajout d'un contact d'un autre site", () => {
  test("un membre limité au site A ne peut pas ajouter à sa liste un contact du site B (traité comme introuvable, aucune ligne écrite)", async () => {
    const r = await memA.post(`/marketing/listes/${listA}/ajouter?site=${A}`, { emails: "client-b@exemple.fr" }, { headers: ORIGIN() });
    assert.ok([200, 302].includes(r.status), `statut ${r.status}`);
    assert.deepEqual(members(listA), [], "le contact du site B n'est pas entré dans la liste du site A");
  });
  test("le message est identique pour un contact d'un autre site et pour une adresse qui n'existe pas (aucun oracle d'existence)", async () => {
    const flash = async (email) => { const c = memA; await c.post(`/marketing/listes/${listA}/ajouter?site=${A}`, { emails: email }, { headers: ORIGIN() }); const page = await c.get(`/marketing/listes/${listA}?site=${A}`); const m = page.text.match(/Introuvables[^<]*/); return m ? m[0].replace(email, "<adresse>") : null; };
    assert.equal(await flash("client-b@exemple.fr"), await flash("inconnu-17@exemple.fr"));
  });
  test("accès légitime conservé : le même membre ajoute un contact de SON site", async () => {
    await memA.post(`/marketing/listes/${listA}/ajouter?site=${A}`, { emails: "membre-a@exemple.fr" }, { headers: ORIGIN() });
    assert.deepEqual(members(listA), ["membre-a@exemple.fr"]);
  });
  test("l'équipe de l'organisation peut toujours ajouter n'importe quel contact", async () => {
    await boss.post(`/marketing/listes/${listA}/ajouter`, { emails: "client-b@exemple.fr" }, { headers: ORIGIN() });
    assert.ok(members(listA).includes("client-b@exemple.fr"));
  });
});

describe("F2 — /api/mobile/login : compte suspendu", () => {
  const login = async (email, password) => { const r = await fetch(`${srv.base}/api/mobile/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) }); return { status: r.status, body: await r.json() }; };
  test("un formateur suspendu ne reçoit aucune clé d'API ; réactivé, il en reçoit une", async () => {
    db.prepare("UPDATE users SET status = 'suspended' WHERE email = ?").run(INSTRUCTOR.email);
    const refused = await login(INSTRUCTOR.email, INSTRUCTOR.password);
    assert.equal(refused.status, 403, JSON.stringify(refused.body));
    assert.equal(refused.body.data?.token, undefined);
    db.prepare("UPDATE users SET status = 'active' WHERE email = ?").run(INSTRUCTOR.email);
    const ok = await login(INSTRUCTOR.email, INSTRUCTOR.password);
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
  });
});

describe("S1 contenus — composants : le site cible vient du serveur", () => {
  const post = (c, json) => c.request("/marketing/site-web/composants", { method: "POST", json, headers: ORIGIN() });
  const sec = { type: "text", markdown: "Bonjour" };
  test("un membre limité au site A ne crée pas de composant global ni dans le site B", async () => {
    await post(memA, { site_id: A, name: "Comp17-global", section: sec, global: true });
    await post(memA, { site_id: A, name: "Comp17-chez-b", section: sec, siteId: B });
    assert.equal(one("SELECT COUNT(*) n FROM mk_web_components WHERE site_id IS NULL AND name IN ('Comp17-global','Comp17-chez-b')").n, 0, "aucun composant global");
    assert.equal(one("SELECT COUNT(*) n FROM mk_web_components WHERE site_id = ?", B).n, 0, "aucun composant dans B");
  });
  test("accès légitime : il crée un composant dans son site, et ne peut pas le rendre global ensuite", async () => {
    const r = await post(memA, { site_id: A, name: "Comp17-ok", section: sec, siteId: A });
    assert.equal(r.status, 201, r.text);
    const id = one("SELECT id FROM mk_web_components WHERE name = 'Comp17-ok'").id;
    assert.equal(one("SELECT site_id FROM mk_web_components WHERE id = ?", id).site_id, A);
    await memA.request(`/marketing/site-web/composants/${id}`, { method: "POST", json: { global: true }, headers: ORIGIN() });
    assert.equal(one("SELECT site_id FROM mk_web_components WHERE id = ?", id).site_id, A, "reste dans son site");
  });
  test("l'équipe peut toujours créer un composant global", async () => {
    const r = await post(boss, { name: "Comp17-equipe", section: sec, global: true });
    assert.equal(r.status, 201, r.text);
    assert.equal(one("SELECT site_id FROM mk_web_components WHERE name = 'Comp17-equipe'").site_id, null);
  });
});

describe("S2 contenus — import de redirections : destination extérieure sans permission", () => {
  const imp = (c, csv) => c.post(`/marketing/site-web/sites/${A}/redirections/import`, { csv }, { headers: ORIGIN() });
  test("séparateur « ; » dans la source : la destination extérieure est refusée", async () => {
    await imp(memA, "/a;b,https://evil17.example/x,301");
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE target LIKE '%evil17.example%'").n, 0);
  });
  test("accès légitime : une redirection interne est importée", async () => {
    await imp(memA, "/ancien17,/nouveau17,301");
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE target LIKE '%nouveau17%'").n, 1);
  });
});

describe("S3 administration — journal, statut des comptes, cycle de vie des sites, clés d'API", () => {
  let teamEd, student;
  before(async () => {
    teamEd = await newStudent(srv); student = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, 'editor')").run(orgId, uid(teamEd));
  });
  test("le journal d'activité exige « audit.read » : refusé à un éditeur d'équipe, ouvert au propriétaire", async () => {
    assert.equal((await teamEd.get("/marketing/site-web/outils/logs")).status, 403);
    assert.equal((await boss.get("/marketing/site-web/outils/logs")).status, 200);
  });
  test("le statut d'un compte sans appartenance (élève) ne peut pas être changé par l'administration marketing", async () => {
    await boss.post(`/marketing/site-web/utilisateurs/${uid(student)}/statut`, { status: "disabled" }, { headers: ORIGIN() });
    assert.equal(one("SELECT status FROM users WHERE id = ?", uid(student)).status, "active");
  });
  test("accès légitime : le statut d'un membre d'un site se change, puis se rétablit", async () => {
    await boss.post(`/marketing/site-web/utilisateurs/${uid(memA)}/statut`, { status: "suspended" }, { headers: ORIGIN() });
    assert.equal(one("SELECT status FROM users WHERE id = ?", uid(memA)).status, "suspended");
    await boss.post(`/marketing/site-web/utilisateurs/${uid(memA)}/statut`, { status: "active" }, { headers: ORIGIN() });
    assert.equal(one("SELECT status FROM users WHERE id = ?", uid(memA)).status, "active");
  });
  test("un accès limité à un site ne peut pas dupliquer un site", async () => {
    const before = one("SELECT COUNT(*) n FROM mk_sites").n;
    const r = await memA.post(`/marketing/site-web/sites/${A}/dupliquer`, {}, { headers: ORIGIN() });
    assert.equal(r.status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM mk_sites").n, before);
  });
  test("une clé d'API cesse de fonctionner quand son créateur est suspendu, et revient à la réactivation", async () => {
    const login = await fetch(`${srv.base}/api/mobile/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: INSTRUCTOR.email, password: INSTRUCTOR.password }) });
    const token = (await login.json()).data.token;
    const me = () => fetch(`${srv.base}/api/mobile/me`, { headers: { authorization: `Bearer ${token}` } }).then((r) => r.status);
    assert.equal(await me(), 200);
    db.prepare("UPDATE users SET status = 'suspended' WHERE email = ?").run(INSTRUCTOR.email);
    assert.equal(await me(), 401);
    db.prepare("UPDATE users SET status = 'active' WHERE email = ?").run(INSTRUCTOR.email);
    assert.equal(await me(), 200);
  });
});
