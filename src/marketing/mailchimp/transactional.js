// Mailchimp Transactional (Mandrill) — API DISTINCTE de l'API Marketing : autre hôte (mandrillapp.com), autre clé, autre facturation (module complémentaire payant de Mailchimp).
// Toutes les requêtes sont des POST JSON contenant la clé. Un envoi (messages/send…) n'est JAMAIS réessayé automatiquement (risque de doublon) ; les lectures le sont.
const { createTransport, MailchimpError } = require("./client");
const { MarketingError } = require("../errors");
const { validateEmail } = require("../audience/email");
const { transactionalKey, logger } = require("./connection");
const { audit } = require("../audience/shared");

const BASE = "https://mandrillapp.com/api/1.0";
const NAME = /^[A-Za-z0-9_-]{1,60}$/;

// Mandrill répond HTTP 500 + { status: "error", name, message } pour presque toutes les erreurs : on classe par le NOM de l'erreur.
function classify(status, json) {
  if (status >= 200 && status < 300 && !(json && json.status === "error")) return null;
  const name = String(json && json.name || ""), detail = String(json && json.message || "").slice(0, 300);
  if (name === "Invalid_Key") return new MailchimpError("auth_invalid", "La clé Mailchimp Transactional (Mandrill) est refusée. Générez-en une nouvelle dans Mailchimp → Transactional → Settings → SMTP & API Info.", { status, detail });
  if (name === "PaymentRequired" || /Payment|credits|quota|Usage_Limit/i.test(name)) return new MailchimpError("quota", "Votre compte Mailchimp Transactional n'a plus de crédits ou n'est pas payant. Ajoutez des crédits dans Mailchimp.", { status, detail });
  if (/^Unknown_|NoSuch/i.test(name)) return new MailchimpError("not_found", "Élément Mandrill introuvable (modèle, expéditeur, message…).", { status, detail });
  if (name === "ValidationError" || name === "Invalid_Reject" || name === "Invalid_Template") return new MailchimpError("invalid_request", `Mandrill a refusé la demande : ${detail || name}`, { status, detail });
  if (status === 429) return new MailchimpError("rate_limited", "Mandrill limite le débit : l'opération sera réessayée.", { status, detail, retryable: true });
  if (status >= 500 && !name) return new MailchimpError("server_error", "Mandrill est momentanément indisponible. Réessayez dans quelques minutes.", { status, detail, retryable: true });
  return new MailchimpError("unknown", `Réponse inattendue de Mandrill${name ? ` (${name})` : ""}.`, { status, detail });
}

const MESSAGE_KEYS = ["html", "text", "subject", "from_email", "from_name", "to", "headers", "important", "track_opens", "track_clicks", "auto_text", "auto_html", "inline_css", "url_strip_qs", "preserve_recipients", "view_content_link",
  "bcc_address", "tracking_domain", "signing_domain", "return_path_domain", "merge", "merge_language", "global_merge_vars", "merge_vars", "tags", "subaccount", "google_analytics_domains", "google_analytics_campaign", "metadata", "recipient_metadata"];

// id → { endpoint, résumé, usage, priorité, champs autorisés, lecture seule, confirmation, obligatoires }
const T = (endpoint, summary, usage, priority, o = {}) => ({ endpoint, summary, usage, priority, keys: [], required: [], read: false, confirm: false, ...o });
const OPS = {
  "users.ping": T("users/ping2", "Test de santé de l'API Transactional", "Valider la clé en direct.", "CRITIQUE", { read: true }),
  "users.info": T("users/info", "Informations du compte (réputation, quota, envois)", "Écran Transactionnel : réputation et envois restants.", "CRITIQUE", { read: true }),
  "messages.send": T("messages/send", "Envoyer un e-mail transactionnel", "Reçu, réinitialisation de mot de passe, confirmation de commande.", "CRITIQUE", { keys: ["message", "async", "ip_pool", "send_at"], required: ["message"], confirm: true,
    example: { request: { message: { subject: "Votre reçu", from_email: "contact@exemple.fr", from_name: "Ma société", to: [{ email: "client@exemple.fr", type: "to" }], html: "<p>Merci pour votre achat.</p>", tags: ["recu"] }, confirm: true }, response: [{ email: "client@exemple.fr", status: "sent", _id: "abc123", reject_reason: null }] } }),
  "messages.sendTemplate": T("messages/send-template", "Envoyer avec un modèle transactionnel", "Reçu mis en forme par un modèle Mandrill (template_content / merge_vars).", "CRITIQUE", { keys: ["template_name", "template_content", "message", "async", "ip_pool", "send_at"], required: ["template_name", "message"], confirm: true }),
  "messages.search": T("messages/search", "Rechercher des messages envoyés", "Suivi des messages : par destinataire, tag, dates, statut.", "CRITIQUE", { keys: ["query", "date_from", "date_to", "tags", "senders", "api_keys", "limit"], read: true, required: ["query"] }),
  "messages.info": T("messages/info", "Détail d'un message envoyé", "Statut de livraison, ouvertures, clics d'un message.", "IMPORTANT", { keys: ["id"], required: ["id"], read: true }),
  "messages.content": T("messages/content", "Contenu d'un message envoyé", "Réafficher un reçu envoyé (si conservé).", "OPTIONNEL", { keys: ["id"], required: ["id"], read: true }),
  "messages.listScheduled": T("messages/list-scheduled", "Messages programmés", "Voir les envois différés.", "OPTIONNEL", { keys: ["to"], read: true }),
  "messages.cancelScheduled": T("messages/cancel-scheduled", "Annuler un message programmé", "Annuler un envoi différé.", "OPTIONNEL", { keys: ["id"], required: ["id"], confirm: true }),
  "senders.list": T("senders/list", "Expéditeurs vérifiés", "Choisir une adresse d'expédition autorisée.", "CRITIQUE", { read: true }),
  "senders.domains": T("senders/domains", "Domaines d'expédition", "Statut SPF / DKIM de chaque domaine.", "CRITIQUE", { read: true }),
  "senders.addDomain": T("senders/add-domain", "Ajouter un domaine d'expédition", "Déclarer un domaine à vérifier.", "IMPORTANT", { keys: ["domain"], required: ["domain"] }),
  "senders.checkDomain": T("senders/check-domain", "Vérifier les enregistrements DNS d'un domaine", "Contrôler SPF/DKIM après configuration DNS.", "IMPORTANT", { keys: ["domain"], required: ["domain"], read: true }),
  "senders.verifyDomain": T("senders/verify-domain", "Vérifier un domaine par e-mail", "Terminer la vérification (mailbox + code).", "IMPORTANT", { keys: ["domain", "mailbox"], required: ["domain", "mailbox"] }),
  "templates.list": T("templates/list", "Modèles transactionnels", "Galerie des modèles Mandrill.", "IMPORTANT", { keys: ["label"], read: true }),
  "templates.info": T("templates/info", "Détail d'un modèle", "Code HTML publié et brouillon.", "IMPORTANT", { keys: ["name"], required: ["name"], read: true }),
  "templates.add": T("templates/add", "Créer un modèle", "Publier un modèle HTML de reçu.", "IMPORTANT", { keys: ["name", "from_email", "from_name", "subject", "code", "text", "publish", "labels"], required: ["name"] }),
  "templates.update": T("templates/update", "Modifier un modèle", "Mettre à jour le HTML.", "IMPORTANT", { keys: ["name", "from_email", "from_name", "subject", "code", "text", "publish", "labels"], required: ["name"] }),
  "templates.publish": T("templates/publish", "Publier le brouillon d'un modèle", "Mettre le brouillon en production.", "IMPORTANT", { keys: ["name"], required: ["name"], confirm: true }),
  "templates.render": T("templates/render", "Rendre un modèle avec des variables", "Aperçu d'un modèle avec merge_vars réels.", "IMPORTANT", { keys: ["template_name", "template_content", "merge_vars"], required: ["template_name"], read: true,
    example: { request: { template_name: "recu", template_content: [], merge_vars: [{ name: "NOM", content: "Camille" }] }, response: { html: "<p>Bonjour Camille</p>" } } }),
  "templates.delete": T("templates/delete", "Supprimer un modèle", "Retirer un modèle.", "OPTIONNEL", { keys: ["name"], required: ["name"], confirm: true }),
  "webhooks.list": T("webhooks/list", "Webhooks transactionnels", "Centre de webhooks transactionnels.", "IMPORTANT", { read: true }),
  "webhooks.add": T("webhooks/add", "Créer un webhook transactionnel", "Recevoir send, hard_bounce, soft_bounce, open, click, spam, unsub, reject.", "IMPORTANT", { keys: ["url", "description", "events"], required: ["url"] }),
  "webhooks.update": T("webhooks/update", "Modifier un webhook", "Changer les événements.", "OPTIONNEL", { keys: ["id", "url", "description", "events"], required: ["id", "url"] }),
  "webhooks.delete": T("webhooks/delete", "Supprimer un webhook", "Retirer.", "OPTIONNEL", { keys: ["id"], required: ["id"], confirm: true }),
  "rejects.list": T("rejects/list", "Liste de rejet (blacklist)", "Adresses que Mandrill ne livrera plus (rebonds, plaintes, manuel).", "IMPORTANT", { keys: ["email", "include_expired", "subaccount"], read: true }),
  "rejects.add": T("rejects/add", "Ajouter une adresse à la liste de rejet", "Bloquer manuellement une adresse.", "IMPORTANT", { keys: ["email", "comment", "subaccount"], required: ["email"] }),
  "rejects.delete": T("rejects/delete", "Retirer une adresse de la liste de rejet", "Débloquer une adresse (uniquement un rejet manuel).", "IMPORTANT", { keys: ["email", "subaccount"], required: ["email"], confirm: true }),
  "allowlists.list": T("allowlists/list", "Liste d'autorisation (whitelist)", "Adresses jamais rejetées automatiquement.", "OPTIONNEL", { keys: ["email"], read: true }),
  "allowlists.add": T("allowlists/add", "Ajouter à la liste d'autorisation", "Forcer la livraison pour une adresse.", "OPTIONNEL", { keys: ["email", "comment"], required: ["email"] }),
  "allowlists.delete": T("allowlists/delete", "Retirer de la liste d'autorisation", "Retirer.", "OPTIONNEL", { keys: ["email"], required: ["email"], confirm: true }),
};
const bad = (message) => new MarketingError("invalid_request", message);

function clientFor(ctx, options = {}) {
  const key = transactionalKey(ctx);
  if (!key) throw new MarketingError("not_connected", "Mailchimp Transactional n'est pas connecté : enregistrez votre clé Mandrill dans Marketing → Mailchimp → Transactionnel.");
  const transport = createTransport({ onLog: logger(ctx), limiterKey: `md:${ctx.organizationId}`, ...(ctx.mailchimp || {}), ...options });
  return { key, transport };
}

// Destinataires bloqués localement : rebond dur ou plainte (un message transactionnel peut viser quelqu'un de désinscrit du marketing, jamais une adresse morte ou plaignante)
function checkRecipients(ctx, message) {
  const to = Array.isArray(message.to) ? message.to : [];
  if (!to.length) throw bad("Au moins un destinataire est obligatoire (message.to).");
  if (to.length > 50) throw bad("50 destinataires au plus par envoi.");
  for (const r of to) {
    const c = validateEmail(r && r.email);
    if (!c.ok) throw bad(`Destinataire invalide : ${c.reason}`);
    if (!["to", "cc", "bcc"].includes(r.type || "to")) throw bad("Type de destinataire invalide (to, cc ou bcc).");
    const hit = ctx.db.prepare("SELECT reason FROM mk_suppressions WHERE organization_id = ? AND email = ? AND reason IN ('bounced', 'complained')").get(ctx.organizationId, c.email);
    if (hit) throw new MarketingError("recipient_blocked", "Un destinataire a une adresse en rebond dur ou une plainte enregistrée : l'envoi est refusé pour protéger votre réputation d'expéditeur.");
  }
  if (typeof message.from_email !== "string" || !validateEmail(message.from_email).ok) throw bad("Adresse d'expédition invalide (message.from_email).");
  if (!message.html && !message.text && !message.merge_language) throw bad("Le message est vide : fournissez html ou text.");
}

async function run(ctx, opId, body = {}) {
  const op = Object.hasOwn(OPS, opId) ? OPS[opId] : null;
  if (!op) throw new MarketingError("unknown_operation", "Opération inconnue.");
  const source = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const { confirm, ...rest } = source;
  if (op.confirm && confirm !== true) throw new MarketingError("confirm_required", `Confirmation requise : « ${op.summary} ».`);
  const payload = {};
  for (const [k, v] of Object.entries(rest)) { if (!op.keys.includes(k)) throw bad(`Champ « ${k} » non pris en charge par cette opération.`); payload[k] = v; }
  const missing = op.required.filter((k) => payload[k] === undefined || payload[k] === null || payload[k] === "");
  if (missing.length) throw bad(`Champ(s) obligatoire(s) manquant(s) : ${missing.join(", ")}.`);
  if (JSON.stringify(payload).length > 1_500_000) throw bad("Demande trop volumineuse.");
  if (payload.message) {
    if (typeof payload.message !== "object" || Array.isArray(payload.message)) throw bad("message : un objet est attendu.");
    for (const k of Object.keys(payload.message)) if (!MESSAGE_KEYS.includes(k)) throw bad(`Champ « message.${k} » non pris en charge.`);
    if (opId.startsWith("messages.send")) checkRecipients(ctx, payload.message);
  }
  if (payload.email !== undefined && !validateEmail(payload.email).ok) throw bad("Adresse e-mail invalide.");
  if (payload.name !== undefined && !NAME.test(String(payload.name))) throw bad("Nom de modèle invalide (lettres, chiffres, « - » et « _ », 60 caractères au plus).");
  if (payload.template_name !== undefined && !NAME.test(String(payload.template_name))) throw bad("Nom de modèle invalide (lettres, chiffres, « - » et « _ », 60 caractères au plus).");
  const { key, transport } = ctx.mdClient || clientFor(ctx);
  try {
    const res = await transport.send({
      method: "POST", path: `/${op.endpoint}`, url: `${ctx.env && ctx.env.MANDRILL_API_BASE || process.env.MANDRILL_API_BASE || BASE}/${op.endpoint}.json`, headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ key, ...payload }), classify, retryUnsafe: op.read,
    });
    if (!op.read) audit(ctx, "mailchimp.transactional", "mailchimp", null, { op: opId });
    return res.json;
  } catch (error) { if (error instanceof MailchimpError) throw new MarketingError(error.code, error.message, error.detail || undefined); throw error; }
}

module.exports = { OPS, run, classify, MESSAGE_KEYS, BASE };
