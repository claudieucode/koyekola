// R8 lot 4 — Utilisateurs, rôles et permissions : séparation ÉQUIPE CENTRALE / ADMINISTRATEURS ET MEMBRES D'UN SITE, sur un vrai serveur, avec les mécanismes existants (aucun système parallèle).
// Règle démontrée : seule l'équipe de l'organisation gère les comptes, les invitations, les rôles (d'équipe et de site) et les accès aux sites ; un administrateur de site LIT l'équipe de SON site (sans l'administrer) ;
// toute tentative sur un autre site, depuis un site ou sans droit est refusée sans AUCUN effet en base.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("utilisateurs et rôles : équipe centrale / site", () => {
  let srv, boss, db, A, B, clients = {}, target, targetB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const U = "/marketing/site-web/utilisateurs";
  const SP = "/marketing/site-web/sites";
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const state = () => JSON.stringify({ m: db.prepare("SELECT organization_id, user_id, role FROM mk_org_members ORDER BY user_id").all().map((r) => ({ ...r })), s: db.prepare("SELECT site_id, user_id, role, mode FROM mk_site_members ORDER BY site_id, user_id").all().map((r) => ({ ...r })), i: one("SELECT COUNT(*) n FROM mk_invitations").n, u: db.prepare("SELECT id, status FROM users ORDER BY id").all().map((r) => ({ ...r })), r: one("SELECT COUNT(*) n FROM mk_roles").n });
  const person = async (siteId, role, orgRole) => { const c = await newStudent(srv); if (orgRole) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, ?, ?)").run(idOf(c), orgRole); if (siteId) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = await mkSite("Alpha Droits"); B = await mkSite("Bravo Droits");
    clients = { equipe: boss, equipeLecteur: await person(null, null, "viewer"), adminSite: await person(A, "admin"), editeurSite: await person(A, "editor"), lecteurSite: await person(A, "viewer"), autreSite: await person(B, "admin"), sansAcces: await newStudent(srv), anonyme: new Client(srv.base) };
    target = await person(A, "viewer"); targetB = await person(B, "viewer");
  });
  after(() => { db.close(); return srv.stop(); });

  test("un administrateur ou un membre d'un site ne peut NI inviter, NI changer un rôle (équipe ou site), NI accorder/retirer un accès à un site, NI suspendre/retirer un compte, NI créer de rôle — même pour SON site ; aucun effet en base", async () => {
    const tid = idOf(target), tb = idOf(targetB);
    const attempts = [
      ["inviter", `${U}/inviter`, { email: "nouveau@ex.cd", role: "editor", site_id: A }], ["inviter dans un autre site", `${U}/inviter`, { email: "nouveau2@ex.cd", role: "admin", site_id: B }],
      ["rôle d'équipe", `${U}/${tid}/role`, { role: "admin" }], ["accès au site", `${U}/${tb}/sites`, { site_id: A, role: "admin" }], ["rôle de site", `${U}/${tid}/sites`, { site_id: A, role: "admin" }],
      ["mode plafond", `${U}/${tid}/sites/${A}/mode`, { mode: "limit" }], ["retirer l'accès", `${U}/${tid}/sites/${A}/retirer`, {}], ["suspendre", `${U}/${tid}/statut`, { status: "suspended" }],
      ["retirer de l'équipe", `${U}/${tid}/retirer`, {}], ["créer un rôle", `${U}/roles`, { name: "Rôle pirate", description: "x", perm: ["users.manage_roles"] }],
    ];
    for (const who of ["adminSite", "editeurSite", "lecteurSite", "autreSite", "equipeLecteur", "sansAcces"]) {
      const before = state();
      for (const [label, url, body] of attempts) { for (const q of ["", `?site=${A}`]) { const r = await clients[who].post(`${url}${q}`, { ...body, site: A }); assert.ok([302, 403, 404].includes(r.status), `${who} ${label} ${r.status}`); } }
      assert.equal(state(), before, `${who} : aucune modification`);
    }
    const anon = await clients.anonyme.post(`${U}/inviter`, { email: "x@ex.cd", role: "editor" }); assert.ok([302, 401, 403].includes(anon.status));
  });
  test("l'équipe centrale garde la main : inviter dans un site, attribuer un rôle de site, retirer l'accès — effets constatés en base", async () => {
    const tid = idOf(target);
    const inv = await boss.post(`${U}/inviter`, { email: "invite.alpha@ex.cd", role: "viewer", site_id: A }); assert.equal(inv.status, 302);
    assert.equal(one("SELECT site_id s FROM mk_invitations WHERE email = 'invite.alpha@ex.cd'").s, A, "invitation liée au site choisi par l'équipe");
    await boss.post(`${U}/${tid}/sites`, { site_id: A, role: "editor" }); assert.equal(one("SELECT role r FROM mk_site_members WHERE site_id = ? AND user_id = ?", A, tid).r, "editor");
    await boss.post(`${U}/${tid}/sites/${A}/retirer`, {}); assert.equal(one("SELECT COUNT(*) n FROM mk_site_members WHERE site_id = ? AND user_id = ?", A, tid).n, 0);
  });
  test("écrans d'équipe : les listes d'utilisateurs, rôles, invitations et permissions de l'organisation sont fermées aux comptes limités à un site (renvoi vers Mes sites) ; l'équipe y accède", async () => {
    for (const p of ["", "/roles", "/invitations", "/permissions", "/ajouter"]) {
      for (const who of ["adminSite", "editeurSite", "lecteurSite", "autreSite"]) { const r = await clients[who].get(`${U}${p}`); assert.ok([302, 403].includes(r.status), `${who} ${p} ${r.status}`); assert.doesNotMatch(r.text, /invite\.alpha|Rôles et permissions/i); }
      assert.equal((await boss.get(`${U}${p}`)).status, 200, p);
    }
  });
  test("« Équipe du site » : un membre lit les personnes de SON site seulement (jamais celles d'un autre site, ni l'équipe de l'organisation) ; un autre site est refusé", async () => {
    const mine = idOf(clients.adminSite);
    const access = require("../src/services/cmsAccess");
    const roleOf = { adminSite: "admin", editeurSite: "editor", lecteurSite: "viewer" };
    for (const who of ["lecteurSite"]) { const r = await clients[who].get(`${SP}/${A}/equipe`); assert.equal(r.status, access.permissionsOf(roleOf[who]).has("users.view") ? 200 : 403, `${who} : « Équipe du site » suit le droit users.view du rôle`); }
    for (const who of ["adminSite", "editeurSite", "equipe"]) {
      if (roleOf[who] && !access.permissionsOf(roleOf[who]).has("users.view")) continue;
      const r = await clients[who].get(`${SP}/${A}/equipe`); assert.equal(r.status, 200, who);
      const name = (c) => one("SELECT username FROM users WHERE email = ?", c.email).username;
      assert.ok(r.text.includes(name(clients.adminSite)), `${who} : voit son site`); assert.ok(!r.text.includes(name(clients.autreSite)) && !r.text.includes(name(targetB)), `${who} : aucun membre d'un autre site`);
      assert.doesNotMatch(r.text, /<form[^>]*action="[^"]*\/utilisateurs\//, `${who} : aucune action de gestion dans la liste du site`);
    }
    assert.equal((await clients.autreSite.get(`${SP}/${A}/equipe`)).status, 403);
    assert.ok(mine > 0);
  });
});
