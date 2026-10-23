// KOLAKISA CMS — Utilisateurs → Invitations : cycle de vie sécurisé. Jeton stocké sous forme d'empreinte, usage unique (même en requêtes simultanées), expiration, révocation, renvoi qui annule l'ancien lien,
// limites (par heure, délai et nombre de renvois), état d'envoi RÉEL lu dans la file d'envoi (jamais supposé), acceptation atomique et revalidée (rôle supprimé, inviteur rétrogradé), filtres de la liste.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId, bossId;
const U = "/marketing/site-web/utilisateurs";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const q = (sql, ...a) => db.prepare(sql).all(...a);
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
const tokenIn = (html) => (flashOf(html).match(/\/invitation\/([A-Za-z0-9_-]+)/) || [])[1];
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
let n = 0;
const mail = () => `invite${++n}@exemple.test`;
const invite = async (extra = {}) => { const email = extra.email || mail(); await boss.post(`${U}/inviter`, { email, role: "viewer", ...extra }); return { email, row: one("SELECT * FROM mk_invitations WHERE email = ? ORDER BY id DESC", email) }; };
const settle = async (mailId) => { for (let i = 0; i < 50 && one("SELECT status FROM mail_outbox WHERE id = ?", mailId).status === "pending"; i++) await new Promise((r) => setTimeout(r, 40)); }; // la file s'envoie en tâche de fond : on attend qu'elle ait fini avant de forcer un état
const wait = (id) => db.prepare("UPDATE mk_invitations SET last_sent_at = datetime('now', '-2 minutes') WHERE id = ?").run(id);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id; bossId = one("SELECT id FROM users WHERE role = 'formateur'").id;
});
after(() => { db.close(); return srv.stop(); });

describe("invitation : création", () => {
  test("nom, message et validité enregistrés ; le jeton n'est JAMAIS stocké (empreinte seulement) ; e-mail mis en file avec le message ; audit sans secret", async () => {
    const { email, row } = await invite({ name: "Alice Martin", message: "Bienvenue dans l'équipe !", days: "3" });
    assert.equal(row.invited_name, "Alice Martin"); assert.equal(row.message, "Bienvenue dans l'équipe !");
    const page = await boss.get(`${U}/invitations`); const token = tokenIn(page.text);
    assert.ok(token, "sans serveur d'e-mail, le lien personnel est montré à l'inviteur");
    assert.notEqual(row.token_hash, token); assert.equal(row.token_hash.length, 64); assert.ok(!JSON.stringify(q("SELECT * FROM mk_invitations")).includes(token), "jeton absent de la base");
    const days = one("SELECT (julianday(expires_at) - julianday(created_at)) AS d FROM mk_invitations WHERE id = ?", row.id).d; assert.ok(Math.abs(days - 3) < 0.01, `validité 3 jours : ${days}`);
    const out = one("SELECT * FROM mail_outbox WHERE id = ?", row.mail_id); assert.equal(out.kind, "team_invitation"); assert.equal(out.to_email, email);
    assert.ok(out.body.includes("Bonjour Alice Martin") && out.body.includes("Bienvenue dans l'équipe !"));
    assert.ok(!JSON.stringify(q("SELECT metadata FROM mk_audit_logs WHERE action = 'user.invited'")).includes(token), "le journal ne contient pas le jeton");
    assert.ok(!JSON.stringify(q("SELECT metadata FROM mk_audit_logs WHERE action = 'user.invited'")).includes("Bienvenue"), "ni le message");
  });

  test("validations : adresse invalide, rôle inconnu, validité hors bornes (ramenée à 7 jours), doublon en attente, message tronqué à 500", async () => {
    const bad = await boss.post(`${U}/inviter`, { email: "pas-une-adresse", role: "viewer" }); assert.match(flashOf((await boss.get(`${U}/invitations`)).text), /adresse e-mail valide/); void bad;
    await boss.post(`${U}/inviter`, { email: mail(), role: "inconnu" }); assert.match(flashOf((await boss.get(`${U}/invitations`)).text), /Rôle inconnu/);
    const { email, row } = await invite({ days: "999", message: "x".repeat(900) });
    assert.equal(row.message.length, 500); assert.ok(Math.abs(one("SELECT (julianday(expires_at) - julianday(created_at)) AS d FROM mk_invitations WHERE id = ?", row.id).d - 7) < 0.01, "validité invalide = 7 jours");
    await boss.post(`${U}/inviter`, { email, role: "viewer" }); assert.match(flashOf((await boss.get(`${U}/invitations`)).text), /déjà en attente/);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_invitations WHERE email = ?", email).n, 1, "pas de doublon");
  });

  test("limite : 30 invitations par heure et par inviteur ; la 31e est refusée sans rien écrire", async () => {
    const ins = db.prepare("INSERT INTO mk_invitations (organization_id, email, role, token_hash, invited_by, expires_at) VALUES (?, ?, 'viewer', ?, ?, datetime('now', '+7 days'))");
    const before = one("SELECT COUNT(*) AS n FROM mk_invitations WHERE invited_by = ? AND created_at > datetime('now', '-1 hour')", bossId).n;
    for (let i = before; i < 30; i++) ins.run(orgId, `rafale${i}@exemple.test`, `hash-rafale-${i}`, bossId);
    const total = one("SELECT COUNT(*) AS n FROM mk_invitations").n;
    await boss.post(`${U}/inviter`, { email: mail(), role: "viewer" });
    assert.match(flashOf((await boss.get(`${U}/invitations`)).text), /Limite atteinte/); assert.equal(one("SELECT COUNT(*) AS n FROM mk_invitations").n, total, "rien créé");
    db.prepare("UPDATE mk_invitations SET created_at = datetime('now', '-3 hours') WHERE email LIKE 'rafale%'").run(); // les suivants dans ce fichier repartent d'un compteur libre
  });
});

describe("invitation : état d'envoi réel", () => {
  test("la liste lit l'état dans la file d'envoi : en file → envoyé → échec ; « envoyé » n'est pas « acceptée »", async () => {
    const { email, row } = await invite({ name: "Bob" });
    const html = async () => (await boss.get(`${U}/invitations?q=${encodeURIComponent(email)}`)).text;
    await settle(row.mail_id);
    db.prepare("UPDATE mail_outbox SET status = 'pending' WHERE id = ?").run(row.mail_id); assert.match(await html(), /E-mail en file d(?:'|&#39;)envoi/);
    db.prepare("UPDATE mail_outbox SET status = 'sent' WHERE id = ?").run(row.mail_id); let page = await html(); assert.match(page, /E-mail envoyé/); assert.match(page, /En attente/); assert.ok(!/Acceptée<\/span>/.test(page), "envoyé ≠ acceptée");
    db.prepare("UPDATE mail_outbox SET status = 'failed', last_error = 'serveur SMTP injoignable (ECONNECTION)' WHERE id = ?").run(row.mail_id); page = await html(); assert.match(page, /Échec d(?:'|&#39;)envoi/); assert.match(page, /serveur SMTP injoignable/);
  });

  test("sans serveur d'e-mail ni file : le message le dit (« aucun message ne partira ») et donne le lien ; adresse refusée par la file = échec enregistré", async () => {
    await boss.post(`${U}/inviter`, { email: mail(), role: "viewer" });
    const flash = flashOf((await boss.get(`${U}/invitations`)).text); assert.match(flash, /aucun serveur d(?:'|&#39;)e-mail n(?:'|&#39;)est configuré/); assert.match(flash, /Lien personnel à transmettre vous-même/); assert.ok(!/est en file d(?:'|&#39;)envoi/.test(flash), "jamais « envoyé » à tort");
  });
});

describe("invitation : acceptation", () => {
  const accept = (token, body = {}) => new Client(srv.base).request(`/invitation/${token}`, { method: "POST", form: { username: `user${++n}`, password: "motdepasse1", ...body } });
  const tokenOf = async (email) => tokenIn((await boss.get(`${U}/invitations?q=${encodeURIComponent(email)}`)).text);

  test("acceptation réelle : compte créé, rôle appliqué, invitation « acceptée » ; second usage du même lien : refusé", async () => {
    const { email, row } = await invite({ role: "editor" }); const token = await tokenOf(email);
    const r = await accept(token); assert.ok([302, 303].includes(r.status), `${r.status}`);
    const user = one("SELECT id FROM users WHERE email = ?", email); assert.ok(user);
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", user.id).role, "editor");
    const inv = one("SELECT accepted_at, accepted_user_id FROM mk_invitations WHERE id = ?", row.id); assert.ok(inv.accepted_at); assert.equal(inv.accepted_user_id, user.id);
    assert.equal((await accept(token)).status, 404, "usage unique");
    assert.match((await boss.get(`${U}/invitations?etat=accepted`)).text, /Acceptée/);
  });

  test("deux envois SIMULTANÉS du même lien : un seul compte et un seul accès", async () => {
    const { email } = await invite({ role: "viewer" }); const token = await tokenOf(email);
    const [a, b] = await Promise.all([accept(token), accept(token, { username: `autre${++n}` })]);
    assert.equal(one("SELECT COUNT(*) AS n FROM users WHERE email = ?", email).n, 1, "un seul compte");
    assert.equal([a, b].filter((r) => [302, 303].includes(r.status)).length, 1, `un seul succès : ${a.status}/${b.status}`);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_org_members WHERE user_id = (SELECT id FROM users WHERE email = ?)", email).n, 1);
  });

  test("révoquée, expirée, renvoyée : les anciens liens ne permettent plus de rejoindre l'équipe", async () => {
    const { email, row } = await invite(); const t1 = await tokenOf(email);
    await boss.post(`${U}/invitations/${row.id}/revoquer`, {}); assert.equal((await accept(t1)).status, 404, "révoquée");
    assert.equal(one("SELECT COUNT(*) AS n FROM users WHERE email = ?", email).n, 0);
    const b = await invite(); const old = await tokenOf(b.email); wait(b.row.id);
    await boss.post(`${U}/invitations/${b.row.id}/renvoyer`, {}); const fresh = await tokenOf(b.email); assert.notEqual(old, fresh);
    assert.equal((await accept(old)).status, 404, "ancien lien invalidé par le renvoi"); db.prepare("UPDATE mk_invitations SET expires_at = datetime('now', '-1 hour') WHERE id = ?").run(b.row.id);
    assert.equal((await accept(fresh)).status, 404, "expirée"); wait(b.row.id);
    await boss.post(`${U}/invitations/${b.row.id}/renvoyer`, {}); const renewed = await tokenOf(b.email); assert.equal((await new Client(srv.base).get(`/invitation/${renewed}`)).status, 200, "une expirée se renouvelle");
  });

  test("revalidation à l'acceptation : inviteur rétrogradé = rien n'est accordé, AUCUN compte orphelin créé", async () => {
    // un rôle encore cité par une invitation ne peut pas être supprimé (protection du service)
    await boss.post(`${U}/roles`, { name: "Rôle éphémère", description: "t", perm: ["forms.read"] }); const key = one("SELECT key FROM mk_roles WHERE name = 'Rôle éphémère'").key;
    const a = await invite({ role: key }); await boss.post(`${U}/roles/${key}/supprimer`, {});
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_roles WHERE key = ?", key).n, 1, "rôle conservé tant qu'une invitation l'utilise");
    // inviteur : un administrateur invite un éditeur, puis est rétrogradé en lecteur
    const adm = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, 'admin')").run(orgId, idOf(adm));
    const email = mail(); await adm.post(`${U}/inviter`, { email, role: "editor" }); const row = one("SELECT * FROM mk_invitations WHERE email = ?", email); assert.equal(row.invited_by, idOf(adm));
    const tb = tokenIn((await adm.get(`${U}/invitations`)).text);
    db.prepare("UPDATE mk_org_members SET role = 'viewer' WHERE user_id = ?").run(idOf(adm));
    const rb = await accept(tb); assert.equal(rb.status, 410); assert.match(rb.text, /ne peut plus accorder ce rôle/); assert.equal(one("SELECT COUNT(*) AS n FROM users WHERE email = ?", email).n, 0);
  });
});

describe("invitation : renvoi, filtres, périmètre", () => {
  test("renvoi : délai minimal de 60 s et 6 envois au plus", async () => {
    const { row } = await invite();
    await boss.post(`${U}/invitations/${row.id}/renvoyer`, {}); assert.match(flashOf((await boss.get(`${U}/invitations`)).text), /Patientez 60 secondes/);
    db.prepare("UPDATE mk_invitations SET last_sent_at = datetime('now', '-2 minutes'), send_count = 6 WHERE id = ?").run(row.id);
    await boss.post(`${U}/invitations/${row.id}/renvoyer`, {}); assert.match(flashOf((await boss.get(`${U}/invitations`)).text), /déjà été envoyée 6 fois/);
  });

  test("liste : recherche (e-mail, nom), état, rôle, pagination ; états vides explicites", async () => {
    db.prepare("DELETE FROM mk_invitations WHERE email LIKE 'rafale%'").run();
    const a = await invite({ email: "recherche.unique@exemple.test", name: "Zoé Dupont", role: "editor" });
    const html = async (qs) => (await boss.get(`${U}/invitations?${qs}`)).text;
    assert.match(await html("q=recherche.unique"), /recherche\.unique@exemple\.test/); assert.match(await html("q=Zo%C3%A9"), /recherche\.unique@exemple\.test/, "recherche par nom");
    assert.doesNotMatch(await html("q=recherche.unique&role=viewer"), /recherche\.unique@exemple\.test/, "filtre de rôle"); assert.match(await html("q=recherche.unique&role=editor"), /recherche\.unique@exemple\.test/);
    assert.match(await html("q=introuvable-xyz"), /Aucune invitation ne correspond/); assert.match(await html("etat=revoked&q=recherche.unique"), /Aucune invitation ne correspond/);
    db.prepare("UPDATE mk_invitations SET revoked_at = datetime('now') WHERE id = ?").run(a.row.id); assert.match(await html("etat=revoked&q=recherche.unique"), /Révoquée/);
    const fill = db.prepare("INSERT INTO mk_invitations (organization_id, email, role, token_hash, invited_by, expires_at) VALUES (?, ?, 'viewer', ?, ?, datetime('now', '+7 days'))"); for (let i = 0; i < 30; i++) fill.run(orgId, `page${i}@exemple.test`, `hash-page-${i}`, bossId);
    assert.ok(one("SELECT COUNT(*) AS n FROM mk_invitations").n > 25, "assez de lignes pour paginer"); assert.match(await html(""), /Page 1 sur/); assert.match(await html("page=2"), /Page 2 sur/);
  });
});
