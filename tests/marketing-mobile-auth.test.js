// Non-régression de l'audit (B3) : connexion mobile répétable, clés isolées par utilisateur, rôle contrôlé.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, newStudent, INSTRUCTOR } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("API mobile : /api/mobile/login", () => {
  let srv;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); });
  after(() => srv.stop());
  const login = async (email, password) => {
    const r = await fetch(`${srv.base}/api/mobile/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    return { status: r.status, body: await r.json() };
  };

  test("trois connexions de suite : jamais d'erreur 500, seule la dernière clé fonctionne", async () => {
    const tokens = [];
    for (let i = 0; i < 3; i++) {
      const r = await login(INSTRUCTOR.email, INSTRUCTOR.password);
      assert.equal(r.status, 200, JSON.stringify(r.body));
      tokens.push(r.body.data.token);
    }
    const me = (t) => fetch(`${srv.base}/api/mobile/me`, { headers: { authorization: `Bearer ${t}` } }).then((r) => r.status);
    assert.equal(await me(tokens[0]), 401);
    assert.equal(await me(tokens[1]), 401);
    assert.equal(await me(tokens[2]), 200);
  });

  test("la connexion d'un utilisateur ne révoque pas la clé d'un autre", async () => {
    const db = srv.db();
    const boss = db.prepare("SELECT id FROM users WHERE email = ?").get(INSTRUCTOR.email).id;
    const other = (await newStudent(srv)).email;
    db.prepare("UPDATE users SET role = 'formateur' WHERE email = ?").run(other);
    db.prepare("INSERT OR IGNORE INTO mk_org_members (organization_id, user_id, role) SELECT 1, id, 'owner' FROM users WHERE email = ?").run(other);
    db.close();
    const a = await login(INSTRUCTOR.email, INSTRUCTOR.password);
    const b = await login(other, "MotDePasseEleve123");
    assert.equal(b.status, 200, JSON.stringify(b.body));
    const me = (t) => fetch(`${srv.base}/api/mobile/me`, { headers: { authorization: `Bearer ${t}` } }).then((r) => r.status);
    assert.equal(await me(a.body.data.token), 200, "la clé du premier compte est intacte");
    assert.ok(boss);
  });

  test("un membre sans droit d'administrer les clés reçoit 403 et aucune clé", async () => {
    const lecteur = (await newStudent(srv)).email;
    const db = srv.db();
    db.prepare("UPDATE users SET role = 'formateur' WHERE email = ?").run(lecteur);
    db.prepare("INSERT OR REPLACE INTO mk_org_members (organization_id, user_id, role) SELECT 1, id, 'viewer' FROM users WHERE email = ?").run(lecteur);
    const before = db.prepare("SELECT COUNT(*) n FROM mk_api_keys").get().n;
    db.close();
    const r = await login(lecteur, "MotDePasseEleve123");
    assert.equal(r.status, 403);
    const db2 = srv.db(); assert.equal(db2.prepare("SELECT COUNT(*) n FROM mk_api_keys").get().n, before); db2.close();
  });
});
