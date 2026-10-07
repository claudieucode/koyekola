// E-mails du site : file d'envoi (jamais bloquante, réessais, journal), mot de passe oublié, accusé de contact,
// bienvenue, double confirmation de la newsletter, e-mail de test des réglages. Serveur SMTP simulé : aucun vrai e-mail.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const outbox = require("../src/utils/outbox");
const { startServer, loginInstructor, Client } = require("./helpers");
const { freshMarketing, TEST_KEY, quiet } = require("./marketing-helpers");
const forms = require("../src/marketing/forms");

const fakeSmtp = (fail = () => null) => {
  const sent = [];
  return { sent, async sendMail(m) { const e = fail(m, sent.length); if (e) throw e; sent.push(m); return { messageId: `<${sent.length}@test>` }; } };
};
const smtpError = (code) => Object.assign(new Error(`535 Authentication failed for user secret-user pass hunter2`), { code });

describe("file d'envoi des e-mails du site", () => {
  const fresh = () => new DatabaseSync(":memory:");
  test("queueMail rend la main sans attendre et refuse une adresse invalide", () => {
    const db = fresh();
    assert.equal(outbox.queueMail(db, { kind: "x", to: "a@b.fr", subject: "S", text: "T" }, { autoSend: false }).queued, true);
    assert.deepEqual(outbox.queueMail(db, { kind: "x", to: "pas-une-adresse", subject: "S", text: "T" }, { autoSend: false }), { queued: false, reason: "invalid_recipient" });
    assert.equal(outbox.queueMail(db, { kind: "x", to: "a@b.fr\r\nBcc: x@y.fr", subject: "S", text: "T" }, { autoSend: false }).queued, false);
  });
  test("envoi réussi : statut « envoyé » ; le texte d'un e-mail sensible est effacé", async () => {
    const db = fresh();
    outbox.queueMail(db, { kind: "password_reset", to: "a@b.fr", subject: "S", text: "lien secret", sensitive: true }, { autoSend: false });
    outbox.queueMail(db, { kind: "purchase", to: "c@d.fr", subject: "S2", text: "merci", replyTo: "r@e.fr" }, { autoSend: false });
    const smtp = fakeSmtp();
    assert.equal((await outbox.processOutbox(db, { transport: smtp, log: quiet })).sent, 2);
    assert.equal(smtp.sent[1].replyTo, "r@e.fr");
    const rows = db.prepare("SELECT kind, status, body FROM mail_outbox ORDER BY id").all().map((r) => ({ ...r }));
    assert.deepEqual(rows, [{ kind: "password_reset", status: "sent", body: "" }, { kind: "purchase", status: "sent", body: "merci" }]);
  });
  test("échec : réessayé avec attente croissante, puis échec définitif après 5 essais ; erreur sans donnée sensible", async () => {
    const db = fresh();
    outbox.queueMail(db, { kind: "x", to: "a@b.fr", subject: "S", text: "T" }, { autoSend: false });
    const smtp = fakeSmtp(() => smtpError("EAUTH"));
    let t = 1_000_000;
    for (let i = 1; i <= 5; i++) {
      await outbox.processOutbox(db, { transport: smtp, now: () => t, log: quiet });
      const row = db.prepare("SELECT status, attempts, next_attempt_at, last_error FROM mail_outbox").get();
      assert.equal(row.attempts, i);
      assert.equal(row.last_error, "identifiants SMTP refusés (EAUTH)");
      assert.doesNotMatch(row.last_error, /hunter2|secret-user/);
      if (i < 5) { assert.equal(row.status, "pending"); assert.equal(row.next_attempt_at, t + 60000 * 2 ** (i - 1)); t = row.next_attempt_at; }
      else assert.equal(row.status, "failed");
    }
  });
  test("pas encore l'heure du nouvel essai : rien n'est renvoyé", async () => {
    const db = fresh();
    outbox.queueMail(db, { kind: "x", to: "a@b.fr", subject: "S", text: "T" }, { autoSend: false, now: 0 });
    await outbox.processOutbox(db, { transport: fakeSmtp(() => smtpError("ETIMEDOUT")), now: () => 10, log: quiet });
    const smtp = fakeSmtp();
    await outbox.processOutbox(db, { transport: smtp, now: () => 20, log: quiet });
    assert.equal(smtp.sent.length, 0);
  });
  test("sans SMTP : « non envoyé », contenu gardé (journal en local seulement)", async () => {
    const db = fresh();
    outbox.queueMail(db, { kind: "x", to: "a@b.fr", subject: "S", text: "T" }, { autoSend: false });
    const logs = [];
    await outbox.processOutbox(db, { transport: null, log: { log: (m) => logs.push(m), warn: (m) => logs.push(m) } });
    assert.equal(db.prepare("SELECT status FROM mail_outbox").get().status, "skipped");
    assert.match(logs.join(""), /SMTP non configuré/);
  });
  test("journal des réglages : jamais le contenu", () => {
    const db = fresh();
    outbox.queueMail(db, { kind: "x", to: "a@b.fr", subject: "S", text: "contenu privé" }, { autoSend: false });
    const o = outbox.outboxOverview(db);
    assert.equal(o.rows.length, 1);
    assert.equal("body" in o.rows[0], false);
    assert.equal(o.counts.pending, 1);
  });
  test("délais maximum du transport SMTP", () => {
    const { TIMEOUTS } = require("../src/utils/mailer");
    assert.ok(TIMEOUTS.connectionTimeout <= 10000 && TIMEOUTS.greetingTimeout <= 10000 && TIMEOUTS.socketTimeout <= 20000);
  });
});

describe("double confirmation (service)", () => {
  let m, A, form;
  before(() => {
    m = freshMarketing(); A = m.A;
    form = forms.createForm(A, { name: "Lettre", fields: ["first_name"], consentText: "Oui, envoyez-moi la lettre.", doubleOptin: true });
    forms.setStatus(A, form.id, "published");
  });
  test("inscription : aucun consentement tant que le lien n'est pas confirmé", () => {
    const r = forms.submitForm(A, form.id, { email: "lea@x.fr", first_name: "Léa", ip: "41.1.2.3" });
    assert.equal(r.pending, true);
    assert.match(r.token, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(r.contact.status, "unknown");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_consents").get().n, 0);
    assert.notEqual(m.db.prepare("SELECT token_hash FROM mk_pending_confirmations").get().token_hash, r.token); // empreinte seulement
  });
  test("confirmation : consentement prouvé (mention double opt-in), usage unique", () => {
    const r = forms.submitForm(A, form.id, { email: "jean@x.fr", ip: "41.1.2.3" });
    const c = forms.confirmSubscription(A, r.token);
    assert.equal(c.ok, true);
    const k = m.db.prepare("SELECT text_shown, source, ip FROM mk_consents WHERE contact_id = ?").get(r.contact.id);
    assert.match(k.text_shown, /double opt-in/);
    assert.equal(k.ip, "41.1.2.0");
    assert.equal(m.db.prepare("SELECT status FROM mk_contacts WHERE id = ?").get(r.contact.id).status, "subscribed");
    assert.equal(forms.confirmSubscription(A, r.token).ok, false);
  });
  test("lien expiré (7 jours) ou faux : refusé", () => {
    const r = forms.submitForm(A, form.id, { email: "tard@x.fr" });
    assert.equal(forms.confirmSubscription(A, r.token, { now: A.now() + forms.CONFIRM_TTL_MS + 1 }).ok, false);
    assert.equal(forms.confirmSubscription(A, "x".repeat(43)).ok, false);
    assert.equal(forms.findPendingConfirmation(m.db, "court"), null);
  });
  test("nouvelle demande : l'ancien lien ne marche plus ; adresse bloquée : refus", () => {
    const r1 = forms.submitForm(A, form.id, { email: "deux@x.fr" });
    const r2 = forms.submitForm(A, form.id, { email: "deux@x.fr" });
    assert.equal(forms.confirmSubscription(A, r1.token).ok, false);
    assert.equal(forms.confirmSubscription(A, r2.token).ok, true);
    m.db.prepare("INSERT INTO mk_suppressions (organization_id, email, reason) VALUES (1, 'bloque@x.fr', 'manual')").run();
    assert.equal(forms.submitForm(A, form.id, { email: "bloque@x.fr" }).reason, "suppressed");
  });
  test("formulaire sans double confirmation : comportement inchangé (inscription immédiate)", () => {
    const f = forms.createForm(A, { name: "Direct", fields: [], consentText: "Oui." });
    forms.setStatus(A, f.id, "published");
    const r = forms.submitForm(A, f.id, { email: "direct@x.fr" });
    assert.equal(r.pending, undefined);
    assert.equal(r.contact.status, "subscribed");
  });
});

describe("e-mails du site : pages web", () => {
  let srv, boss;
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).get(...a); db.close(); return r; };
  const all = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const waitFor = async (check) => { for (let i = 0; i < 50; i++) { const v = check(); if (v) return v; await new Promise((r) => setTimeout(r, 40)); } return check(); };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", CONTACT_EMAIL: "prof@test.local" });
    boss = await loginInstructor(srv);
  });
  after(() => srv.stop());

  test("connexion : lien « Mot de passe oublié ? »", async () => {
    assert.match((await new Client(srv.base).get("/connexion")).text, /href="\/mot-de-passe-oublie"/);
  });
  test("mot de passe oublié : même réponse pour une adresse inconnue ; e-mail en file seulement si le compte existe", async () => {
    const visitor = new Client(srv.base);
    const unknown = await visitor.post("/mot-de-passe-oublie", { email: "personne@nulle-part.fr" });
    const known = await visitor.post("/mot-de-passe-oublie", { email: "PROF@test.local" });
    const neutral = /Si un compte existe pour cette adresse/;
    assert.match(unknown.text, neutral);
    assert.match(known.text, neutral);
    const mails = await waitFor(() => all("SELECT * FROM mail_outbox WHERE kind = 'password_reset'"));
    assert.equal(mails.length, 1);
    assert.equal(mails[0].to_email, "prof@test.local");
    assert.equal(q("SELECT COUNT(*) n FROM password_resets").n, 1);
  });
  let link;
  test("le lien permet de changer le mot de passe une seule fois ; mots de passe trop courts / différents refusés", async () => {
    const body = (await waitFor(() => q("SELECT body FROM mail_outbox WHERE kind = 'password_reset'"))).body;
    link = body.match(/https:\/\/k\.test(\/reinitialiser-mot-de-passe\/[A-Za-z0-9_-]{43})/)[1];
    const v = new Client(srv.base);
    assert.equal((await v.get(link)).status, 200);
    assert.match((await v.post(link, { password: "court", password_confirm: "court" })).text, /au moins 8 caractères/);
    assert.match((await v.post(link, { password: "NouveauMdp2026", password_confirm: "Autre12345" })).text, /pas identiques/);
    const ok = await v.post(link, { password: "NouveauMdp2026", password_confirm: "NouveauMdp2026" });
    assert.deepEqual([ok.status, ok.location], [302, "/connexion?reinitialise=1"]);
    assert.equal((await v.get(link)).status, 410);
    assert.equal((await v.post(link, { password: "EncoreUnAutre1", password_confirm: "EncoreUnAutre1" })).status, 410);
    assert.equal((await new Client(srv.base).post("/connexion", { email: "prof@test.local", password: "NouveauMdp2026" })).status, 302);
    assert.equal((await new Client(srv.base).post("/connexion", { email: "prof@test.local", password: "MotDePasseProf123" })).status, 400);
    assert.match((await v.get("/connexion?reinitialise=1")).text, /Votre mot de passe a été changé/);
    // Les sessions ouvertes avec l'ancien mot de passe sont fermées : le formateur se reconnecte avec le nouveau
    assert.equal((await boss.get("/formateur")).status, 302);
    await boss.login("prof@test.local", "NouveauMdp2026");
    assert.equal((await boss.get("/formateur")).status, 200);
  });
  test("lien expiré (plus d'une heure) ou inventé : refusé", async () => {
    await new Client(srv.base).post("/mot-de-passe-oublie", { email: "prof@test.local" });
    const db = srv.db(); db.prepare("UPDATE password_resets SET expires_at = 1").run(); db.close();
    const body = (await waitFor(() => q("SELECT body FROM mail_outbox WHERE kind = 'password_reset' ORDER BY id DESC LIMIT 1"))).body;
    const fresh = body.match(/(\/reinitialiser-mot-de-passe\/[A-Za-z0-9_-]{43})/)[1];
    assert.equal((await new Client(srv.base).get(fresh)).status, 410);
    assert.equal((await new Client(srv.base).get("/reinitialiser-mot-de-passe/" + "a".repeat(43))).status, 410);
  });
  test("contact : message enregistré, alerte au formateur + accusé de réception (texte fixe), page immédiate", async () => {
    const v = new Client(srv.base);
    const res = await v.post("/contact", { name: "Awa", email: "awa@exemple.cd", subject: "Question", message: "Bonjour, quand commence la formation ?" });
    assert.deepEqual([res.status, res.location], [302, "/contact?envoye=1"]);
    const mails = await waitFor(() => { const r = all("SELECT kind, to_email, reply_to, body FROM mail_outbox WHERE kind LIKE 'contact%' ORDER BY id"); return r.length === 2 && r; });
    assert.deepEqual(mails.map((m) => [m.kind, m.to_email]), [["contact_notification", "prof@test.local"], ["contact_ack", "awa@exemple.cd"]]);
    assert.equal(mails[0].reply_to, "awa@exemple.cd");
    assert.doesNotMatch(mails[1].body, /quand commence|Awa/); // l'accusé ne recopie rien de ce qu'a écrit la personne
  });
  test("contact : validation côté serveur (champs vides, adresse invalide, message trop court) et champ piège", async () => {
    const v = new Client(srv.base);
    assert.match((await v.post("/contact", { name: "", email: "a@b.fr", message: "assez long message" })).text, /Indiquez votre nom/);
    assert.match((await v.post("/contact", { name: "A", email: "pas-une-adresse", message: "assez long message" })).text, /pas valide/);
    assert.match((await v.post("/contact", { name: "A", email: "a@b.fr", message: "court" })).text, /entre 10 et 5/);
    const before = q("SELECT COUNT(*) n FROM contact_messages").n;
    await v.post("/contact", { name: "Robot", email: "r@b.fr", message: "spam spam spam spam", website: "http://spam" });
    assert.equal(q("SELECT COUNT(*) n FROM contact_messages").n, before);
  });
  test("inscription au site : e-mail de bienvenue en file", async () => {
    const v = new Client(srv.base);
    await v.post("/inscription", { username: "nouvel_eleve", email: "eleve@exemple.cg", password: "MotDePasse123" });
    const m = await waitFor(() => q("SELECT to_email FROM mail_outbox WHERE kind = 'signup_welcome'"));
    assert.equal(m.to_email, "eleve@exemple.cg");
  });
  test("newsletter en double confirmation : e-mail de confirmation, page « vérifiez votre boîte », bouton obligatoire", async () => {
    await boss.post("/marketing/formulaires", { name: "Lettre KOLAKISA", consentText: "Oui, je veux la lettre." });
    const f = q("SELECT id, slug, double_optin FROM mk_forms WHERE name = 'Lettre KOLAKISA'");
    assert.equal(f.double_optin, 1); // activée par défaut pour un nouveau formulaire
    await boss.post(`/marketing/formulaires/${f.id}/publier`);
    const v = new Client(srv.base);
    const res = await v.post(`/f/${f.slug}`, { ft: srv.formToken(), email: "abonne@exemple.fr", consent: "on" });
    assert.equal(res.location, `/f/${f.slug}?envoye=1&confirmer=1`);
    assert.match((await v.get(res.location)).text, /Vérifiez votre boîte e-mail/);
    const mail = await waitFor(() => q("SELECT body FROM mail_outbox WHERE kind = 'newsletter_confirm'"));
    const path = mail.body.match(/https:\/\/k\.test(\/f\/confirmer\/[A-Za-z0-9_-]{43})/)[1];
    assert.equal(q("SELECT status FROM mk_contacts WHERE email = 'abonne@exemple.fr'").status, "unknown");
    assert.match((await v.get(path)).text, /Oui, je confirme/);
    assert.equal(q("SELECT status FROM mk_contacts WHERE email = 'abonne@exemple.fr'").status, "unknown"); // un GET ne confirme pas
    assert.match((await v.post(path, {}, { headers: { origin: srv.base } })).text, /Inscription confirmée/);
    assert.equal(q("SELECT status FROM mk_contacts WHERE email = 'abonne@exemple.fr'").status, "subscribed");
    assert.equal((await v.get(path)).status, 410);
  });
  test("réglage de la double confirmation dans l'éditeur du formulaire : décochable", async () => {
    const f = q("SELECT id FROM mk_forms WHERE name = 'Lettre KOLAKISA'");
    await boss.post(`/marketing/formulaires/${f.id}`, { name: "Lettre KOLAKISA", consentText: "Oui, je veux la lettre.", doubleOptinShown: "1" });
    assert.equal(q("SELECT double_optin FROM mk_forms WHERE id = ?", f.id).double_optin, 0);
  });
  test("Réglages d'envoi : e-mail de test (SMTP absent → message clair) et journal des e-mails du site", async () => {
    await boss.post("/marketing/envoi/test", { to: "prof@test.local", channel: "site" });
    let html = (await boss.get("/marketing/envoi")).text;
    assert.match(html, /SMTP non configuré : renseignez SMTP_HOST/);
    assert.match(html, /E-mails du site : derniers envois/);
    assert.match(html, /Mot de passe oublié/);
    await boss.post("/marketing/envoi/test", { to: "pas-une-adresse", channel: "site" });
    html = (await boss.get("/marketing/envoi")).text;
    assert.match(html, /Adresse e-mail invalide/);
  });
});
