// Marketing M2e — e-mail de test : uniquement vers l'équipe, objet [TEST], liens factices, pannes gérées.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const templates = require("../src/marketing/templates");
const { sendTestEmail, teamRecipients } = require("../src/marketing/templates/testSend");

let m, A, B, tpl;
const code = async (fn) => { try { await fn(); } catch (e) { return e.code; } return null; };
const fakeTransport = () => { const sent = []; return { sent, sendMail: async (msg) => { sent.push(msg); return { messageId: "x" }; } }; };
const addMember = (org, email, role = "editor") => {
  const id = Number(m.db.prepare("INSERT INTO users (username, email) VALUES (?, ?)").run(email.split("@")[0], email).lastInsertRowid);
  m.db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(org, id, role);
  return id;
};

beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B;
  addMember(1, "Equipe@Exemple.fr");
  addMember(2, "autre@orga-b.fr");
  tpl = templates.createTemplate(A, { name: "Test", subject: "Bonjour {{contact.first_name}}", blocks: [{ type: "text", markdown: "Salut {{contact.first_name}}" }] });
});

describe("destinataires autorisés", () => {
  test("seuls les membres de l'organisation, adresses en minuscules", () => {
    assert.deepEqual(teamRecipients(A), ["equipe@exemple.fr"]);
    assert.deepEqual(teamRecipients(B), ["autre@orga-b.fr"]);
  });
  test("envoi à un membre : HTML + texte, objet préfixé [TEST], expéditeur configuré, en-tête de test", async () => {
    const transport = fakeTransport();
    const r = await sendTestEmail(A, tpl.id, { to: "EQUIPE@exemple.fr", transport, from: "KOLAKISA <no-reply@k.test>" });
    assert.deepEqual([r.sent, r.reason], [true, undefined]);
    const [msg] = transport.sent;
    assert.equal(msg.to, "equipe@exemple.fr");
    assert.equal(msg.from, "KOLAKISA <no-reply@k.test>");
    assert.equal(msg.subject, "[TEST] Bonjour Awa");
    assert.match(msg.html, /^<!DOCTYPE html>/);
    assert.match(msg.text, /Salut Awa/);
    assert.equal(msg.headers["X-KOYEKOLA-Test"], "1");
    assert.match(msg.html, /exemple\.invalid/, "liens factices : jamais un vrai lien de désinscription");
  });
  test("adresse hors équipe, d'une autre organisation, invalide, multiple ou avec retour à la ligne : refusée, rien n'est envoyé", async () => {
    const transport = fakeTransport();
    for (const to of ["inconnu@ex.fr", "autre@orga-b.fr", "pas-un-email", "equipe@exemple.fr,inconnu@ex.fr", "equipe@exemple.fr\r\nBcc: x@y.fr", "", undefined, null, 42]) {
      assert.equal(await code(() => sendTestEmail(A, tpl.id, { to, transport })), "invalid_recipient", String(to));
    }
    assert.equal(transport.sent.length, 0);
  });
  test("modèle d'une autre organisation : introuvable", async () => {
    assert.equal(await code(() => sendTestEmail(B, tpl.id, { to: "autre@orga-b.fr", transport: fakeTransport() })), "not_found");
  });
  test("contact d'aperçu facultatif : personnalisation avec ses données", async () => {
    const audience = require("../src/marketing/audience");
    const { contact } = audience.upsertContact(A, { email: "zoe@ex.fr", first_name: "Zoé" });
    const transport = fakeTransport();
    await sendTestEmail(A, tpl.id, { to: "equipe@exemple.fr", transport, contactId: contact.id });
    assert.equal(transport.sent[0].subject, "[TEST] Bonjour Zoé");
    assert.equal(await code(() => sendTestEmail(A, tpl.id, { to: "equipe@exemple.fr", transport, contactId: 99999 })), "not_found");
  });
});

describe("pannes et configuration", () => {
  test("SMTP non configuré : réponse claire, sans erreur", async () => {
    const r = await sendTestEmail(A, tpl.id, { to: "equipe@exemple.fr", transport: null });
    assert.deepEqual([r.sent, r.reason], [false, "smtp_not_configured"]);
  });
  test("panne du serveur de messagerie : journalisée, jamais de secret dans la réponse ni dans l'exception", async () => {
    const logs = [];
    const transport = { sendMail: async () => { throw new Error("connexion refusée pour user:MOTDEPASSE@smtp.ex"); } };
    const r = await sendTestEmail(A, tpl.id, { to: "equipe@exemple.fr", transport, log: { error: (...a) => logs.push(a.join(" ")) } });
    assert.deepEqual([r.sent, r.reason], [false, "send_error"]);
    assert.ok(!JSON.stringify(r).includes("MOTDEPASSE"));
    assert.equal(logs.length, 1);
  });
  test("modèle invalide au moment de l'envoi : erreur claire, rien n'est envoyé", async () => {
    m.db.prepare("UPDATE mk_templates SET blocks = ? WHERE id = ?").run(JSON.stringify([{ id: "b1", type: "text", markdown: "{{secret.cle}}" }]), tpl.id);
    const transport = fakeTransport();
    assert.equal(await code(() => sendTestEmail(A, tpl.id, { to: "equipe@exemple.fr", transport })), "invalid_template");
    assert.equal(transport.sent.length, 0);
  });
  test("audit : l'envoi de test est journalisé sans adresse ni contenu", async () => {
    await sendTestEmail(A, tpl.id, { to: "equipe@exemple.fr", transport: fakeTransport() });
    const rows = m.db.prepare("SELECT action, metadata FROM mk_audit_logs WHERE action = 'template.test_sent'").all();
    assert.equal(rows.length, 1);
    assert.ok(!/@|Bonjour|Salut/.test(rows[0].metadata));
  });
});
