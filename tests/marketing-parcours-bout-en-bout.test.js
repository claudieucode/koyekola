// Bout en bout, sans aucune simulation : vrai serveur, vrai worker marketing, vraie inscription d'un élève par la page
// publique. Le parcours « Confirmation de création de compte » est créé depuis la bibliothèque, activé par la vraie route, puis
// l'inscription d'un élève doit, SEULE, produire : un événement KOLAKISA, un contact, un passage dans le parcours et un
// e-mail enregistré. (Le fournisseur d'envoi est « console » : rien ne part sur Internet, mais tout le reste est réel.)
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 90000, every = 1000 } = {}) {
  const end = Date.now() + timeout;
  for (;;) {
    const v = check();
    if (v) return v;
    if (Date.now() > end) return null;
    await wait(every);
  }
}

describe("parcours : bout en bout (serveur, pont, worker, e-mail)", () => {
  let srv, boss;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", MARKETING_WORKER: "on" });
    boss = await loginInstructor(srv);
  });
  after(() => srv.stop());

  test("une inscription d'élève déclenche le parcours de la bibliothèque et envoie l'e-mail", { timeout: 240000 }, async () => {
    const created = await boss.post("/marketing/automatisations/parcours/bienvenue-creation-compte", {});
    assert.equal(created.status, 302);
    const id = Number(/\/(\d+)$/.exec(created.location)[1]);
    const activated = await boss.post(`/marketing/automatisations/${id}/activer`, {});
    assert.equal(activated.status, 302);
    const db = srv.db();
    assert.equal(db.prepare("SELECT status FROM mk_automations WHERE id = ?").get(id).status, "active", "parcours activé par la vraie route");

    // Le pont lit d'abord les comptes existants SANS rien déclencher (l'historique ne reçoit jamais un « bienvenue »)
    const ready = await until(() => db.prepare("SELECT COUNT(*) n FROM mk_bridge_cursors WHERE source = 'users'").get().n > 0);
    assert.ok(ready, "le pont a initialisé ses curseurs");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_automation_runs").get().n, 0, "l'historique ne déclenche rien");

    const student = await newStudent(srv);
    const run = await until(() => db.prepare("SELECT r.id, r.status FROM mk_automation_runs r JOIN mk_contacts c ON c.id = r.contact_id WHERE c.email = ? AND r.automation_id = ?").get(student.email, id));
    assert.ok(run, "l'inscription a fait entrer l'élève dans le parcours (événement → contact → passage)");
    const message = await until(() => db.prepare("SELECT m.id, m.status, json_extract(c.snapshot, '$.subject') AS subject FROM mk_messages m JOIN mk_contacts t ON t.id = m.contact_id LEFT JOIN mk_campaigns c ON c.id = m.campaign_id WHERE t.email = ?").get(student.email));
    assert.ok(message, "l'e-mail du parcours est enregistré pour cet élève");
    assert.match(message.subject || "", /Votre compte est prêt/);
    const finished = await until(() => ["completed", "exited"].includes(db.prepare("SELECT status FROM mk_automation_runs WHERE id = ?").get(run.id).status));
    assert.ok(finished, "le passage va jusqu'au bout");
    const log = srv.log();
    assert.doesNotMatch(log, /Error|ERREUR critique|Unhandled/i, "aucune erreur dans les journaux du serveur");
    const names = db.prepare("SELECT name FROM mk_events WHERE email = ?").all(student.email).map((e) => e.name);
    assert.ok(names.includes("lms.user_registered"), `événement émis par le pont : ${names.join(", ")}`);
  });
});
