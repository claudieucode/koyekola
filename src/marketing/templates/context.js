// Contexte de rendu : le SEUL ensemble de données qu'un modèle peut lire. Liste blanche explicite : aucun statut, identifiant,
// date interne ni donnée d'une autre organisation n'est jamais accessible depuis un gabarit.
const { getContactProperties, listProperties } = require("../audience/properties");
const { checkCtx, cleanText, audit, MarketingError } = require("../audience/shared");

const CORE = [
  ["contact.first_name", "Prénom", "Awa"], ["contact.last_name", "Nom", "Koffi"], ["contact.full_name", "Nom complet", "Awa Koffi"],
  ["contact.email", "Adresse e-mail", "awa@exemple.fr"], ["contact.company", "Société", "Acme"], ["contact.country", "Pays", "TG"],
  ["contact.language", "Langue", "fr"], ["contact.phone", "Téléphone", "+228 90 00 00 00"], ["contact.job_title", "Fonction", "Directrice"],
];
const SYSTEM = [["unsubscribe_url", "Lien de désinscription"], ["preferences_url", "Lien du centre de préférences"], ["view_url", "Lien « voir dans le navigateur »"], ["event.course_url", "Lien de la formation (automatisation)"], ["event.learn_url", "Lien « Mes formations » (automatisation)"]];
// Données de l'événement qui a déclenché une automatisation (vides dans une campagne)
const EVENT_FIELDS = [["event.course_title", "Titre de la formation", "Final Cut Pro"], ["event.order_total", "Montant de la commande", "49,00 €"], ["event.order_id", "Numéro de commande", "1024"], ["event.lesson_title", "Titre de la leçon", "Interface"], ["event.refund_amount", "Montant remboursé", "49,00 €"], ["event.funnel_name", "Nom du tunnel", "Lancement"], ["event.funnel_step", "Étape du tunnel", "Inscription"]];
const EVENT_KEYS = ["course_title", "course_url", "learn_url", "lesson_title", "order_id", "order_total", "funnel_name", "funnel_step", "refund_amount"];
const SAMPLE_URLS = { unsubscribe_url: "https://exemple.invalid/desinscription", preferences_url: "https://exemple.invalid/preferences", view_url: "https://exemple.invalid/voir" };
// https, ou http vers la machine locale (développement avec le fournisseur « console ») : jamais d'autre http
const SAFE_URL = /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?\/)[^\s<>"'`\\]{1,2000}$/i;
const ADDRESS_KEY = "org.address";

function variableCatalog(ctx) {
  checkCtx(ctx);
  return [
    ...CORE.map(([path, label, example]) => ({ path, label, example, group: "Contact" })),
    ...listProperties(ctx).map((p) => ({ path: `contact.props.${p.key}`, label: p.label, example: "", group: "Propriétés" })),
    ...EVENT_FIELDS.map(([path, label, example]) => ({ path, label, example, group: "Événement (automatisation)" })),
    { path: "org.name", label: "Nom de l'organisation", example: "KOLAKISA", group: "Organisation" },
    { path: "org.address", label: "Adresse postale", example: "12 rue des Écoles, 75005 Paris", group: "Organisation" },
    ...SYSTEM.map(([path, label]) => ({ path, label, example: "", group: path.startsWith("event.") ? "Événement (automatisation)" : "Liens système", system: true })),
  ];
}

function allowedFor(ctx) {
  const paths = new Set(variableCatalog(ctx).map((v) => v.path));
  return (path) => paths.has(path);
}

function getOrgProfile(ctx) {
  checkCtx(ctx);
  const org = ctx.db.prepare("SELECT name FROM mk_organizations WHERE id = ?").get(ctx.organizationId);
  const row = ctx.db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = ? AND is_secret = 0").get(ctx.organizationId, ADDRESS_KEY);
  return { name: org ? org.name : "", address: row ? row.value : "" };
}

// Adresse postale du pied de page (exigée par plusieurs législations). L'audit n'en garde pas le contenu.
function setOrgAddress(ctx, value) {
  checkCtx(ctx);
  const lines = String(value ?? "").replace(/\r\n?/g, "\n").split("\n").map((l) => cleanText(l, { max: 1000, field: "address" }));
  const address = lines.join("\n").trim();
  if (address.length > 300) throw new MarketingError("invalid_field", "L'adresse est trop longue (300 caractères au plus) : elle n'a pas été enregistrée.");
  if (!address) ctx.db.prepare("DELETE FROM mk_settings WHERE organization_id = ? AND key = ?").run(ctx.organizationId, ADDRESS_KEY);
  else {
    ctx.db
      .prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (?, ?, ?, 0) ON CONFLICT (organization_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')")
      .run(ctx.organizationId, ADDRESS_KEY, address);
  }
  audit(ctx, "organization.updated", "organization", ctx.organizationId, { field: "address", cleared: !address });
  return address;
}

const text = (v) => (typeof v === "string" ? v : "");

// Contexte d'un vrai contact (déjà lu dans la base de l'organisation par l'appelant)
function buildContext(ctx, contact, { urls = {}, event = {} } = {}) {
  checkCtx(ctx);
  const org = getOrgProfile(ctx);
  const link = (key) => (typeof urls[key] === "string" && SAFE_URL.test(urls[key]) ? urls[key] : "");
  return {
    contact: {
      first_name: text(contact.first_name), last_name: text(contact.last_name), full_name: [contact.first_name, contact.last_name].filter(Boolean).join(" "),
      email: text(contact.email), company: text(contact.company), country: text(contact.country), language: text(contact.language), phone: text(contact.phone), job_title: text(contact.job_title),
      props: getContactProperties(ctx, contact.id),
    },
    org: { name: org.name, address: org.address },
    event: Object.fromEntries(EVENT_KEYS.map((k) => [k, k.endsWith("_url") ? (typeof event[k] === "string" && SAFE_URL.test(event[k]) ? event[k] : "") : event[k] === undefined || event[k] === null ? "" : String(event[k]).slice(0, 300)])),
    unsubscribe_url: link("unsubscribe_url"), preferences_url: link("preferences_url"), view_url: link("view_url"),
  };
}

// Données fictives pour l'aperçu (l'adresse et le nom de l'organisation sont les vrais)
function sampleContext(ctx) {
  checkCtx(ctx);
  const org = getOrgProfile(ctx);
  const props = {};
  for (const p of listProperties(ctx)) {
    props[p.key] = p.type === "number" ? 42 : p.type === "date" ? "2027-01-15" : p.type === "boolean" ? true : p.type === "select" ? JSON.parse(p.options)[0] : "exemple";
  }
  return {
    contact: { first_name: "Awa", last_name: "Koffi", full_name: "Awa Koffi", email: "awa@exemple.fr", company: "Acme", country: "TG", language: "fr", phone: "+228 90 00 00 00", job_title: "Directrice", props },
    org: { name: org.name, address: org.address },
    event: { course_title: "Final Cut Pro", course_url: "https://exemple.invalid/formation", learn_url: "https://exemple.invalid/mes-cours", lesson_title: "Interface", order_id: "1024", order_total: "49,00 €", funnel_name: "Lancement", funnel_step: "Inscription", refund_amount: "49,00 €" },
    ...SAMPLE_URLS,
    survey_token: "", // aperçu : lien anonyme (le vrai jeton personnel est ajouté à l'envoi)
  };
}

module.exports = { SAMPLE_URLS, variableCatalog, allowedFor, getOrgProfile, setOrgAddress, buildContext, sampleContext };
