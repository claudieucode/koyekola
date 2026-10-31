// Exécution d'une opération du catalogue : validation stricte des identifiants, des paramètres de requête et du corps, confirmation des actions irréversibles, appel de l'API,
// journal d'audit. Aucune chaîne venue du navigateur n'est insérée telle quelle dans un chemin d'API : chaque jeton {x} est validé par une règle, puis encodé.
const crypto = require("node:crypto");
const { BY_ID, OPS } = require("./catalog");
const { clientFor } = require("./connection");
const { MarketingError } = require("../errors");
const { audit } = require("../audience/shared");
const { MailchimpError } = require("./client");

const SAFE_ID = /^[A-Za-z0-9_.-]{1,80}$/;
const RULES = {
  listId: /^[0-9a-f]{10}$/i, segmentId: /^\d{1,12}$/, mergeId: /^\d{1,12}$/, domain: /^[A-Za-z0-9.-]{1,253}$/,
};
const md5 = (text) => crypto.createHash("md5").update(text.trim().toLowerCase()).digest("hex");

const bad = (message) => new MarketingError("invalid_request", message);

// Empreinte d'un membre : accepte l'adresse e-mail (convertie en MD5 de l'adresse en minuscules) ou l'empreinte elle-même
function subscriberHash(value) {
  const text = String(value ?? "").trim();
  if (/^[0-9a-f]{32}$/i.test(text)) return text.toLowerCase();
  if (/^[^\s@]{1,64}@[^\s@]{1,255}$/.test(text)) return md5(text);
  throw bad("Contact invalide : une adresse e-mail ou une empreinte de 32 caractères est attendue.");
}

function pathFor(op, params = {}) {
  return op.mc.replace(/\{([A-Za-z]+)\}/g, (_, name) => {
    const raw = params[name];
    if (raw === undefined || raw === null || raw === "") throw bad(`Paramètre « ${name} » obligatoire.`);
    if (name === "hash") return subscriberHash(raw);
    const rule = RULES[name] || SAFE_ID;
    if (!rule.test(String(raw)) || /^\.+$/.test(String(raw))) throw bad(`Paramètre « ${name} » invalide.`);
    return encodeURIComponent(String(raw));
  });
}

function cleanQuery(op, query = {}) {
  const out = {};
  for (const [key, value] of Object.entries(query)) {
    if (key === "confirm") continue;
    if (!op.query.includes(key)) throw bad(`Paramètre de requête « ${key} » non pris en charge par cette opération.`);
    const list = Array.isArray(value) ? value : [value];
    if (list.some((v) => typeof v !== "string" && typeof v !== "number" && typeof v !== "boolean")) throw bad(`Paramètre « ${key} » invalide.`);
    const text = list.map(String).join(",");
    if (text.length > 500 || /[\u0000-\u001f]/.test(text)) throw bad(`Paramètre « ${key} » invalide.`);
    out[key] = text;
  }
  if (out.count !== undefined) {
    const n = Number(out.count);
    if (!Number.isInteger(n) || n < 1 || n > 1000) throw bad("count : un entier entre 1 et 1000 est attendu.");
  }
  if (out.offset !== undefined && !(Number.isInteger(Number(out.offset)) && Number(out.offset) >= 0)) throw bad("offset : un entier positif est attendu.");
  return out;
}

const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);
function checkBody(value, depth = 0) {
  if (depth > 10) throw bad("Corps de la demande trop profond.");
  if (Array.isArray(value)) { if (value.length > 5000) throw bad("Trop d'éléments dans une liste."); value.forEach((v) => checkBody(v, depth + 1)); }
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) { if (FORBIDDEN.has(k)) throw bad("Clé interdite dans le corps de la demande."); checkBody(v, depth + 1); }
  } else if (typeof value === "string" && value.length > 1_000_000) throw bad("Texte trop long (1 Mo au plus).");
}
function cleanBody(op, body) {
  if (op.method === "GET" || op.method === "DELETE") return undefined;
  const source = body === undefined || body === null ? {} : body;
  if (typeof source !== "object" || Array.isArray(source)) throw bad("Le corps de la demande doit être un objet JSON.");
  const { confirm, ...rest } = source;
  checkBody(rest);
  const missing = op.required.filter((k) => rest[k] === undefined || rest[k] === null || rest[k] === "");
  if (missing.length) throw bad(`Champ(s) obligatoire(s) manquant(s) : ${missing.join(", ")}.`);
  return rest;
}
const confirmed = (body, query) => (body && body.confirm === true) || ["1", "true", "oui"].includes(String(query && query.confirm));

// « Le plus restrictif gagne » aussi pour les opérations génériques : on n'abonne jamais chez Mailchimp une adresse que Kolakisa tient pour désinscrite, rebondie, plaignante ou supprimée.
const SUBSCRIBING = new Set(["members.add", "members.upsert", "members.update", "audiences.batchSubscribe"]);
function refuseBlockedSubscriptions(ctx, op, params, body) {
  if (!SUBSCRIBING.has(op.id) || !body) return;
  const { blockedLocally } = require("./composite");
  const wants = (m) => ["subscribed", "pending"].includes(m && m.status) || ["subscribed", "pending"].includes(m && m.status_if_new);
  const blocked = [];
  const check = (email, m) => { if (email && wants(m) && blockedLocally(ctx, String(email).toLowerCase())) blocked.push(email); };
  if (op.id === "audiences.batchSubscribe") for (const m of Array.isArray(body.members) ? body.members : []) check(m && m.email_address, m);
  else {
    let email = body.email_address;
    if (!email && params.hash && !/^[0-9a-f]{32}$/i.test(String(params.hash))) email = params.hash;
    if (!email && /^[0-9a-f]{32}$/i.test(String(params.hash || ""))) { const row = ctx.db.prepare("SELECT email FROM mk_mc_members m JOIN mk_contacts c ON c.id = m.contact_id WHERE m.organization_id = ? AND m.subscriber_hash = ?").get(ctx.organizationId, String(params.hash).toLowerCase()); email = row && row.email; }
    check(email, body);
  }
  if (blocked.length) throw new MarketingError("consent_blocked", `Abonnement refusé : ${blocked.length === 1 ? "cette adresse est" : `${blocked.length} adresses sont`} désinscrite(s), en rebond, en plainte ou supprimée(s) chez Kolakisa (« le plus restrictif gagne »). Seule la personne elle-même peut se réabonner (formulaire).`);
}

// Exécute une opération. ctx : contexte marketing de l'organisation. Renvoie le JSON de Mailchimp (sans _links) ; lève MarketingError (code et message français).
async function run(ctx, opId, { params = {}, query = {}, body } = {}) {
  const op = BY_ID.get(opId);
  if (!op) throw new MarketingError("unknown_operation", "Opération inconnue.");
  const path = pathFor(op, params);
  const q = cleanQuery(op, query);
  if (op.confirm && !confirmed(body, query)) throw new MarketingError("confirm_required", `Confirmation requise : « ${op.summary} » est une action à effet immédiat ou irréversible. Confirmez explicitement pour continuer.`);
  const payload = cleanBody(op, body);
  refuseBlockedSubscriptions(ctx, op, params, payload);
  const client = ctx.mcClient || clientFor(ctx);
  try {
    const data = await client.request(op.method, path, { query: q, body: payload, timeout: op.id === "audiences.batchSubscribe" ? 120000 : (op.id === "campaigns.contentSet" || op.id === "templates.create" || op.id === "templates.update") ? 60000 : undefined });
    if (op.method !== "GET") audit(ctx, "mailchimp.operation", "mailchimp", null, { op: op.id });
    afterHooks(ctx, op, params, data, payload);
    return data;
  } catch (error) {
    if (error instanceof MailchimpError) throw new MarketingError(error.code, error.message, error.detail || undefined);
    throw error;
  }
}

// Garde les miroirs locaux cohérents sans appel réseau supplémentaire
function afterHooks(ctx, op, params, data, payload) {
  try {
    if (op.id === "audiences.delete") ctx.db.prepare("DELETE FROM mk_mc_audiences WHERE organization_id = ? AND remote_id = ?").run(ctx.organizationId, params.listId);
    if ((op.id === "templates.create" || op.id === "templates.update") && payload && typeof payload.html === "string") {
      const id = op.id === "templates.create" ? data && data.id : params.templateId;
      if (id !== undefined && id !== null) ctx.db.prepare(`INSERT INTO mk_mc_template_html (organization_id, template_id, html) VALUES (?, ?, ?) ON CONFLICT (organization_id, template_id) DO UPDATE SET html = excluded.html, updated_at = datetime('now')`).run(ctx.organizationId, String(id), payload.html);
    }
    if (op.id === "templates.delete") ctx.db.prepare("DELETE FROM mk_mc_template_html WHERE organization_id = ? AND template_id = ?").run(ctx.organizationId, String(params.templateId));
    if (op.id === "campaigns.delete") ctx.db.prepare("DELETE FROM mk_mc_campaigns WHERE organization_id = ? AND remote_id = ?").run(ctx.organizationId, params.campaignId);
    if (["campaigns.send", "campaigns.schedule", "campaigns.unschedule", "campaigns.pause", "campaigns.resume", "campaigns.cancelSend"].includes(op.id)) {
      ctx.db.prepare("UPDATE mk_mc_campaigns SET synced_at = NULL WHERE organization_id = ? AND remote_id = ?").run(ctx.organizationId, params.campaignId);
    }
  } catch { /* les miroirs se rafraîchissent à la prochaine synchronisation */ }
  return data;
}

module.exports = { run, subscriberHash, pathFor, cleanQuery, cleanBody, OPS, md5 };
