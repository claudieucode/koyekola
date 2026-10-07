// Confirmation de l'adresse e-mail (audit M1) : lien signé dans l'e-mail de bienvenue, bouton obligatoire, renvoi
// depuis « Mon compte ». Elle ne bloque jamais l'accès au compte.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client } = require("./helpers");

describe("confirmation de l'adresse e-mail", () => {
  let srv;
  before(async () => { srv = await startServer({ SITE_URL: "https://k.test" }); });
  after(() => srv.stop());
  const q = (sql, ...p) => { const db = srv.db(); try { return db.prepare(sql).all(...p); } finally { db.close(); } };
  const waitMail = async (kind, to) => {
    for (let i = 0; i < 50; i++) { const r = q("SELECT body FROM mail_outbox WHERE kind = ? AND to_email = ? ORDER BY id DESC LIMIT 1", kind, to)[0]; if (r && r.body) return r.body; await new Promise((res) => setTimeout(res, 100)); }
    throw new Error(`e-mail ${kind} absent`);
  };
  const signup = async (name) => {
    const c = new Client(srv.base);
    const email = `${name}@exemple.fr`;
    assert.equal((await c.post("/inscription", { username: name, email, password: "MotDePasse123" })).status, 302);
    return Object.assign(c, { email });
  };

  test("inscription : lien de confirmation dans l'e-mail de bienvenue ; compte utilisable sans confirmer", async () => {
    const s = await signup("awa");
    const body = await waitMail("signup_welcome", s.email);
    assert.match(body, /Confirmez votre adresse e-mail/);
    assert.match(body, /https:\/\/k\.test\/confirmer-email\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    assert.equal((await s.get("/mes-cours")).status, 200, "accès normal sans confirmation");
    assert.match((await s.get("/mon-compte")).text, /Non confirmée/);
  });

  test("ouvrir le lien ne confirme rien ; le bouton confirme ; un second clic dit « déjà confirmée »", async () => {
    const s = await signup("binta");
    const link = (await waitMail("signup_welcome", s.email)).match(/\/confirmer-email\/[A-Za-z0-9_.-]+/)[0];
    const anon = new Client(srv.base);
    const page = await anon.get(link);
    assert.equal(page.status, 200);
    assert.match(page.text, /Confirmer mon adresse/);
    assert.equal(q("SELECT email_verified_at v FROM users WHERE email = ?", s.email)[0].v, null, "simple ouverture : rien de confirmé");
    const done = await anon.post(link, {});
    assert.match(done.text, /Adresse e-mail confirmée/);
    assert.ok(q("SELECT email_verified_at v FROM users WHERE email = ?", s.email)[0].v);
    assert.match((await anon.post(link, {})).text, /déjà confirmée/);
    assert.match((await s.get("/mon-compte")).text, /badge-success">Confirmée/);
  });

  test("lien falsifié, abîmé ou adresse changée depuis : refusé (410)", async () => {
    const s = await signup("chloe");
    const link = (await waitMail("signup_welcome", s.email)).match(/\/confirmer-email\/[A-Za-z0-9_.-]+/)[0];
    const [body, sig] = link.split("/").pop().split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url")), u: 1 })).toString("base64url");
    for (const bad of [`/confirmer-email/${forged}.${sig}`, `/confirmer-email/${body}.xx`, "/confirmer-email/n-importe-quoi"]) {
      assert.equal((await new Client(srv.base).post(bad, {})).status, 410, bad);
    }
    const db = srv.db();
    db.prepare("UPDATE users SET email = 'nouvelle@exemple.fr' WHERE email = ?").run(s.email);
    db.close();
    assert.equal((await new Client(srv.base).post(link, {})).status, 410, "adresse changée : l'ancien lien ne vaut plus rien");
  });

  test("« Recevoir un nouveau lien » : envoyé, puis limité à 3 par heure", async () => {
    const s = await signup("dede");
    for (let i = 0; i < 3; i++) assert.match((await s.post("/mon-compte/confirmer-email", {})).text, /Un lien de confirmation vient d(&#39;|')être envoyé/);
    assert.match(await waitMail("email_verification", s.email), /\/confirmer-email\//);
    const r = await s.post("/mon-compte/confirmer-email", {});
    assert.equal(r.status, 429);
  });
});
