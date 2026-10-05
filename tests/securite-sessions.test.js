// Sécurité des connexions (corrections de l'audit) :
// - S1 : la connexion de l'app mobile est limitée comme celle du site ;
// - S2 : le compte est relu à chaque requête (mot de passe changé, rôle retiré, compte supprimé) ;
// - S4 : un nouvel identifiant de session est créé à chaque connexion (fixation de session).
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { startServer, Client, loginInstructor, newStudent, INSTRUCTOR } = require("./helpers");

const sid = (c) => c.cookies.get("connect.sid");

describe("sessions revérifiées et régénérées", () => {
  let srv;
  before(async () => { srv = await startServer(); });
  after(() => srv.stop());

  test("S4 : chaque connexion ouvre une nouvelle session, l'ancienne ne vaut plus rien", async () => {
    const c = await loginInstructor(srv);
    const first = sid(c);
    assert.ok(first);
    await c.login(INSTRUCTOR.email, INSTRUCTOR.password);
    assert.notEqual(sid(c), first, "identifiant de session renouvelé");
    assert.equal((await c.get("/formateur")).status, 200);
    const old = new Client(srv.base);
    old.cookies.set("connect.sid", first);
    assert.equal((await old.get("/formateur")).status, 302, "l'ancien identifiant ne donne plus accès");
  });

  test("S4 : l'inscription ouvre aussi une session neuve", async () => {
    const s = await newStudent(srv);
    assert.ok(sid(s));
    assert.equal((await s.get("/mes-cours")).status, 200);
  });

  test("S2 : un mot de passe changé ferme les autres sessions du compte", async () => {
    const s = await newStudent(srv);
    const other = new Client(srv.base);
    await other.login(s.email, "MotDePasseEleve123");
    assert.equal((await s.get("/mes-cours")).status, 200);
    const db = srv.db();
    db.prepare("UPDATE users SET password_hash = ? WHERE email = ?").run(bcrypt.hashSync("NouveauMotDePasse456", 4), s.email);
    db.close();
    for (const c of [s, other]) {
      const r = await c.get("/mes-cours");
      assert.equal(r.status, 302, "session fermée");
      assert.match(r.location, /\/connexion/);
    }
    const fresh = new Client(srv.base);
    await fresh.login(s.email, "NouveauMotDePasse456");
    assert.equal((await fresh.get("/mes-cours")).status, 200, "le nouveau mot de passe fonctionne");
  });

  test("S2 : un rôle retiré n'est plus actif, un nom modifié s'affiche tout de suite", async () => {
    const s = await newStudent(srv);
    const db = srv.db();
    const { id } = db.prepare("SELECT id FROM users WHERE email = ?").get(s.email);
    db.prepare("UPDATE users SET role = 'formateur' WHERE id = ?").run(id);
    assert.equal((await s.get("/formateur")).status, 200, "rôle donné : pris en compte sans reconnexion");
    db.prepare("UPDATE users SET role = 'etudiant', username = 'NomChangé' WHERE id = ?").run(id);
    db.close();
    assert.notEqual((await s.get("/formateur")).status, 200, "rôle retiré : plus d'accès");
    assert.match((await s.get("/mes-cours")).text, /NomChangé/);
  });

  test("S2 : un compte supprimé est déconnecté", async () => {
    const s = await newStudent(srv);
    const db = srv.db();
    db.exec("PRAGMA foreign_keys = ON");
    db.prepare("DELETE FROM users WHERE email = ?").run(s.email);
    db.close();
    const r = await s.get("/mes-cours");
    assert.equal(r.status, 302);
    assert.match(r.location, /\/connexion/);
  });

  test("le hachage du mot de passe n'apparaît jamais dans les pages", async () => {
    const c = await loginInstructor(srv);
    const db = srv.db();
    const { password_hash } = db.prepare("SELECT password_hash FROM users WHERE email = ?").get(INSTRUCTOR.email);
    db.close();
    assert.ok(!(await c.get("/formateur")).text.includes(password_hash));
  });
});

describe("S1 : connexion de l'app mobile limitée", () => {
  let srv;
  before(async () => { srv = await startServer(); });
  after(() => srv.stop());
  const login = (password) => fetch(`${srv.base}/api/mobile/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: INSTRUCTOR.email, password }) });

  test("10 échecs puis blocage, même avec le bon mot de passe", async () => {
    for (let i = 0; i < 10; i++) assert.equal((await login("mauvais-" + i)).status, 401);
    const blocked = await login(INSTRUCTOR.password);
    assert.equal(blocked.status, 429);
    assert.equal((await blocked.json()).error.code, "rate_limited");
    // Compteur partagé avec la connexion du site : le site est bloqué lui aussi pour cette adresse
    const r = await new Client(srv.base).post("/connexion", { email: INSTRUCTOR.email, password: INSTRUCTOR.password });
    assert.equal(r.status, 429);
  });
});

describe("S1 : une connexion mobile réussie remet le compteur à zéro", () => {
  let srv;
  before(async () => { srv = await startServer(); });
  after(() => srv.stop());

  test("9 échecs, une réussite, puis de nouveau des essais possibles", async () => {
    const login = (password) => fetch(`${srv.base}/api/mobile/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: INSTRUCTOR.email, password }) });
    for (let i = 0; i < 9; i++) assert.equal((await login("mauvais")).status, 401);
    assert.notEqual((await login(INSTRUCTOR.password)).status, 429);
    for (let i = 0; i < 9; i++) assert.equal((await login("mauvais")).status, 401);
  });
});
