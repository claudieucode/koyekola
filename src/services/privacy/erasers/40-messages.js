// Messages envoyés par le formulaire de contact du site principal (nom, e-mail, texte) et e-mails en file ou envoyés à cette adresse.
const { count } = require("./_kit");
const email = (s) => s.email || "";
module.exports = {
  id: "messages", order: 40, scope: "main",
  title: "Messages et e-mails",
  description: "Messages du formulaire de contact et e-mails de la file d'envoi adressés à la personne.",
  categories: ["Messages de contact", "E-mails envoyés par le site"],
  preview(env, s) {
    return { erase: count(env.db, "SELECT COUNT(*) n FROM contact_messages WHERE lower(email) = ?", email(s)) + count(env.db, "SELECT COUNT(*) n FROM mail_outbox WHERE lower(to_email) = ? AND status <> 'sending'", email(s)), anonymize: 0, retained: [], manual: [] };
  },
  run(env, s, state, { limit }) {
    const a = Number(env.db.prepare("DELETE FROM contact_messages WHERE id IN (SELECT id FROM contact_messages WHERE lower(email) = ? LIMIT ?)").run(email(s), limit).changes) || 0;
    const b = a < limit ? Number(env.db.prepare("DELETE FROM mail_outbox WHERE id IN (SELECT id FROM mail_outbox WHERE lower(to_email) = ? AND status <> 'sending' LIMIT ?)").run(email(s), limit - a).changes) || 0 : 0;
    return { done: a + b < limit, erased: a + b, anonymized: 0 };
  },
};
