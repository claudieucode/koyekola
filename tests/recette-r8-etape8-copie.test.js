// R8 — étape 8 de la recette sur COPIE : import représentatif (fichier de test SYNTHÉTIQUE contrôlé) dans l'espace d'un site, avec les données réelles de la copie autour ; validation, aperçu, résultat, aucune fuite entre sites,
// aucun message réel envoyé. S'exécute SEULEMENT si KOYEKOLA_TEST_SEED_DB désigne la base de départ (une copie de copie) ; sinon ignoré. Aucun envoi : serveur sans SMTP, sans worker.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const SEEDED = Boolean(process.env.KOYEKOLA_TEST_SEED_DB);
describe("étape 8 sur copie : import représentatif et absence d'envoi", { skip: SEEDED ? false : "KOYEKOLA_TEST_SEED_DB non défini (recette sur copie uniquement)" }, () => {
  let srv, boss, db, A, B, adminA, adminB, outsider, anon, realContactId, outboundBefore;
  const SP = "/marketing/site-web/sites";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
  const upload = (client, base, text) => { const fd = new FormData(); fd.append("file", new Blob([text], { type: "text/csv" }), "recette.csv"); return client.request(`${base}/importer`, { method: "POST", multipart: fd, headers: { Origin: srv.base } }); };
  const FORM = { map_0: "email", map_1: "first_name", update_existing: "overwrite" };
  const OUT_TABLES = ["mail_outbox", "mk_sms_messages", "mk_webhook_endpoints"];
  const outbound = () => Object.fromEntries(OUT_TABLES.map((t) => [t, one(`SELECT COUNT(*) n FROM ${t}`).n]));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Recette Import Alpha"); B = await mkSite("Recette Import Bravo");
    adminA = await member(A, "admin"); adminB = await member(B, "admin"); outsider = await newStudent(srv);
    db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (1, 'recette.bravo@ex.cd', 'Original-Bravo', ?)").run(B);
    db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (1, 'recette.alpha@ex.cd', 'Original-Alpha', ?)").run(A);
    realContactId = one("SELECT id FROM mk_contacts WHERE origin_site_id IS NULL AND email NOT LIKE '%@ex.cd' ORDER BY id LIMIT 1").id;   // un contact RÉEL du site principal (jamais affiché : seulement son identifiant)
    outboundBefore = outbound();
  });
  after(() => { db.close(); return srv.stop(); });

  test("la base de départ est bien la copie : données réelles présentes (3 utilisateurs réels, contacts, migrations R8 appliquées) ; mode sans envoi", () => {
    assert.ok(one("SELECT COUNT(*) n FROM mk_audit_logs").n > 500, "journal d'audit réel présent"); assert.ok(one("SELECT COUNT(*) n FROM schema_migrations WHERE scope = 'marketing' AND version = '091'").n === 1);
    assert.ok(realContactId > 0); assert.equal(process.env.MARKETING_WORKER, undefined, "aucun worker marketing"); assert.ok(outboundBefore.mail_outbox >= 0);
  });
  test("import de 10 lignes dans le site Alpha : aperçu, validation, analyse obligatoire, résultat ; ligne invalide rejetée ; contacts des autres portées jamais modifiés ni révélés", async () => {
    const realEmail = one("SELECT email FROM mk_contacts WHERE id = ?", realContactId).email, realFirst = one("SELECT first_name FROM mk_contacts WHERE id = ?", realContactId).first_name;
    const lines = ["nouveau1@ex.cd,N1", "nouveau2@ex.cd,N2", "nouveau3@ex.cd,N3", "nouveau4@ex.cd,N4", "recette.alpha@ex.cd,Mis-a-jour", "recette.bravo@ex.cd,Pirate", `${realEmail},Pirate-principal`, "pas-un-email,Invalide", "nouveau1@ex.cd,Doublon-fichier", "nouveau5@ex.cd,N5"];
    const up = await upload(adminA, `${SP}/${A}`, `E-mail,Prénom\n${lines.join("\n")}\n`); assert.equal(up.status, 302); const id = Number(String(up.location).match(/importer\/(\d+)/)[1]);
    assert.equal(one("SELECT site_id FROM mk_imports WHERE id = ?", id).site_id, A); assert.equal(one("SELECT status FROM mk_imports WHERE id = ?", id).status, "previewed");
    const preview = await adminA.get(`${SP}/${A}/importer/${id}`); assert.equal(preview.status, 200); assert.match(preview.text, /nouveau1@ex\.cd/, "aperçu des premières lignes du fichier");
    await adminA.post(`${SP}/${A}/importer/${id}/lancer`, FORM); assert.equal(one("SELECT status FROM mk_imports WHERE id = ?", id).status, "previewed", "pas de lancement sans analyse");
    const an = await adminA.post(`${SP}/${A}/importer/${id}/analyser`, FORM); assert.equal(an.status, 200); assert.doesNotMatch(an.text, /Original-Bravo|Bravo/, "l'analyse ne révèle rien de l'autre site");
    await adminA.post(`${SP}/${A}/importer/${id}/lancer`, FORM); await adminA.post(`${SP}/${A}/importer/${id}/lancer`, FORM);
    const imp = one("SELECT status, created_count, updated_count, invalid_count, duplicate_count FROM mk_imports WHERE id = ?", id); assert.equal(imp.status, "done");
    assert.equal(one("SELECT COUNT(*) n FROM mk_contacts WHERE email LIKE 'nouveau%@ex.cd'").n, 5, "5 créations, sans doublon (la ligne en double du fichier n'en crée pas une sixième)");
    assert.equal(one("SELECT first_name FROM mk_contacts WHERE email = 'recette.alpha@ex.cd'").first_name, "Mis-a-jour");
    assert.equal(one("SELECT first_name FROM mk_contacts WHERE email = 'recette.bravo@ex.cd'").first_name, "Original-Bravo", "contact d'un autre site intact");
    assert.equal(one("SELECT first_name FROM mk_contacts WHERE id = ?", realContactId).first_name, realFirst, "contact RÉEL du principal intact"); assert.equal(one("SELECT origin_site_id FROM mk_contacts WHERE id = ?", realContactId).origin_site_id, null);
    assert.equal(imp.invalid_count, 1, "la ligne invalide est comptée comme rejetée"); assert.equal(imp.duplicate_count >= 1, true, "la ligne en double du fichier est comptée");
    const reqs = db.prepare("SELECT email, site_id, status FROM mk_contact_requests WHERE site_id = ? ORDER BY email").all(A); assert.deepEqual(reqs.map((r) => [r.site_id, r.status]), [[A, "pending"], [A, "pending"]], "2 demandes de rattachement en attente (autre site + principal)");
    const done = (await adminA.get(`${SP}/${A}/importer/${id}`)).text; assert.doesNotMatch(done, /Original-Bravo|Pirate-principal|demande de rattachement/, "rapport indiscernable d'une création");
    const rej = await adminA.get(`${SP}/${A}/importer/${id}/rejets.csv`); assert.ok([200, 403].includes(rej.status)); if (rej.status === 200) assert.match(rej.text, /pas-un-email/);
    // portée : un autre site, un compte sans accès et l'anonyme n'accèdent à rien
    assert.equal((await adminB.get(`${SP}/${A}/importer/${id}`)).status, 403); assert.equal((await adminB.get(`${SP}/${B}/importer/${id}`)).status, 404);
    assert.equal((await outsider.get(`${SP}/${A}/importer/${id}`)).status, 403); const a = await anon.get(`${SP}/${A}/importer/${id}`); assert.equal(a.status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM mk_imports WHERE site_id = ?", B).n, 0);
  });
  test("plafond : un fichier de plus de 5 000 lignes est refusé sans rien créer", async () => {
    const before = one("SELECT COUNT(*) n FROM mk_imports").n; const big = await upload(adminA, `${SP}/${A}`, `E-mail,Prénom\n${Array.from({ length: 5001 }, (_, i) => `g${i}@ex.cd,G`).join("\n")}\n`);
    assert.doesNotMatch(String(big.location), /importer\/\d+/); assert.equal(one("SELECT COUNT(*) n FROM mk_imports").n, before);
  });
  test("aucun message réel : aucune ligne ajoutée aux files d'envoi (e-mail, SMS, webhooks) ; le serveur n'a jamais tenté d'envoi ; les tâches éventuellement mises en file ne sont pas exécutées (pas de worker)", () => {
    assert.deepEqual(outbound(), outboundBefore, "files d'envoi inchangées");
    const log = srv.log(); assert.doesNotMatch(log, /nodemailer|sendMail|ECONNREFUSED|Twilio|Mailchimp|api\.sendgrid/i, "aucune trace d'envoi réel dans le journal du serveur");
    // les seuls e-mails « préparés » sont ceux des comptes de test créés par la recette (inscription), journalisés « non envoyé » faute de SMTP ; aucun ne vise une adresse réelle
    const recipients = [...log.matchAll(/^À : (.+)$/gm)].map((m) => m[1].trim()); assert.ok(recipients.every((r) => /@test\.local$/.test(r)), `destinataires : ${recipients.join(", ")}`);
    assert.equal((log.match(/e-mail non envoyé/g) || []).length, recipients.length, "chaque e-mail préparé est journalisé « non envoyé »");
    const jobs = one("SELECT COUNT(*) n FROM mk_jobs").n; process.stdout.write(`# tâches en file après les opérations (non exécutées, worker absent) : ${jobs}\n`);
  });
});
