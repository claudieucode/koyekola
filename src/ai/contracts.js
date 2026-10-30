// CONTRATS de requête et de réponse du Kolakisa AI Core + validateur de schéma JSON minimal (types, required, properties, items, enum, additionalProperties).
// La réponse d'un fournisseur est TOUJOURS une donnée non fiable : elle est bornée, nettoyée et validée ici avant d'atteindre un module.
const { AiError } = require("./errors");

const LIMITS = Object.freeze({ messages: 50, messageChars: 100000, totalChars: 200000, systemChars: 20000, maxOutputTokens: 32000, defaultOutputTokens: 1024, minTimeoutMs: 1000, maxTimeoutMs: 300000, defaultTimeoutMs: 60000, outputChars: 400000, jsonDepth: 20, schemaChars: 20000 });
const bad = (m) => new AiError("invalid_request", m);
const clean = (v) => String(v).replace(/\u0000/g, "");

// Jetons estimés (≈ 1 jeton pour 3 caractères : volontairement prudent, servir seulement à réserver un coût)
const estimateTokens = (chars) => Math.ceil(chars / 3);

// Requête brute d'un module → requête validée. `actor` et la portée (organisation, site) sont ajoutés par le noyau, jamais lus de l'entrée.
function normalizeRequest(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw bad("La requête doit être un objet.");
  const module = String(raw.module || "");
  if (!/^[a-z][a-z0-9_-]{1,40}$/.test(module)) throw bad("Module demandeur invalide.");
  const task = raw.task === undefined ? "" : String(raw.task);
  if (task && !/^[a-z][a-z0-9_.-]{1,60}$/.test(task)) throw bad("Tâche invalide.");
  if (!Array.isArray(raw.messages) || !raw.messages.length) throw bad("Au moins un message est obligatoire.");
  if (raw.messages.length > LIMITS.messages) throw bad(`${LIMITS.messages} messages au plus.`);
  let total = 0;
  const messages = raw.messages.map((m, i) => {
    if (!m || typeof m !== "object" || (m.role !== "user" && m.role !== "assistant")) throw bad(`Message ${i + 1} : le rôle doit être « user » ou « assistant » (les instructions système passent par le champ « system » d'un module autorisé).`);
    if (typeof m.content !== "string" || !m.content.trim()) throw bad(`Message ${i + 1} : un texte non vide est attendu.`);
    if (m.content.length > LIMITS.messageChars) throw bad(`Message ${i + 1} : ${LIMITS.messageChars} caractères au plus.`);
    total += m.content.length;
    return { role: m.role, content: clean(m.content) };
  });
  if (messages[messages.length - 1].role !== "user") throw bad("Le dernier message doit venir de l'utilisateur.");
  let system = "";
  if (raw.system !== undefined && raw.system !== "") {
    if (typeof raw.system !== "string" || raw.system.length > LIMITS.systemChars) throw bad(`Instructions système : texte de ${LIMITS.systemChars} caractères au plus.`);
    system = clean(raw.system); total += system.length;
  }
  if (total > LIMITS.totalChars) throw bad(`Requête trop volumineuse (${LIMITS.totalChars} caractères au plus).`);
  const maxOutputTokens = raw.maxOutputTokens === undefined ? LIMITS.defaultOutputTokens : Number(raw.maxOutputTokens);
  if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > LIMITS.maxOutputTokens) throw bad(`Limite de sortie : un entier entre 1 et ${LIMITS.maxOutputTokens}.`);
  const timeoutMs = raw.timeoutMs === undefined ? LIMITS.defaultTimeoutMs : Number(raw.timeoutMs);
  if (!Number.isInteger(timeoutMs) || timeoutMs < LIMITS.minTimeoutMs || timeoutMs > LIMITS.maxTimeoutMs) throw bad("Délai maximal : entre 1 et 300 secondes.");
  let temperature = null;
  if (raw.temperature !== undefined && raw.temperature !== null) { temperature = Number(raw.temperature); if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) throw bad("Température : entre 0 et 2."); }
  const rf = raw.responseFormat === undefined ? { type: "text" } : raw.responseFormat;
  if (!rf || (rf.type !== "text" && rf.type !== "json")) throw bad("Format de réponse : « text » ou « json ».");
  let schema = null;
  if (rf.type === "json" && rf.schema !== undefined) {
    if (typeof rf.schema !== "object" || rf.schema === null || JSON.stringify(rf.schema).length > LIMITS.schemaChars) throw bad("Schéma JSON invalide ou trop volumineux.");
    schema = rf.schema;
  }
  let idempotencyKey = null;
  if (raw.idempotencyKey !== undefined && raw.idempotencyKey !== null) { if (!/^[A-Za-z0-9._:-]{8,100}$/.test(String(raw.idempotencyKey))) throw bad("Clé d'idempotence : 8 à 100 caractères (lettres, chiffres, . _ : -)."); idempotencyKey = String(raw.idempotencyKey); }
  const routing = raw.routing && typeof raw.routing === "object" ? raw.routing : {};
  const strategy = routing.strategy === undefined ? "recommended" : routing.strategy;
  if (!["explicit", "recommended", "economy"].includes(strategy)) throw bad("Stratégie de routage inconnue.");
  const model = raw.model === undefined || raw.model === null ? null : String(raw.model);
  if (strategy === "explicit" && !model) throw bad("La stratégie « explicit » demande un modèle (« fournisseur:modèle »).");
  if (model !== null && !/^[a-z][a-z0-9-]{1,30}:[A-Za-z0-9._:/-]{2,100}$/.test(model)) throw bad("Modèle : format « fournisseur:modèle » attendu.");
  const maxFallbackCostMicroUsd = routing.maxFallbackCostMicroUsd === undefined ? null : Number(routing.maxFallbackCostMicroUsd);
  if (maxFallbackCostMicroUsd !== null && (!Number.isFinite(maxFallbackCostMicroUsd) || maxFallbackCostMicroUsd < 0)) throw bad("Coût maximal de secours invalide.");
  return {
    module, task, system, messages, maxOutputTokens, timeoutMs, temperature, idempotencyKey, model,
    responseFormat: { type: rf.type, schema }, routing: { strategy, allowFallback: routing.allowFallback === true, maxFallbackCostMicroUsd },
    inputChars: total, inputTokensEstimate: estimateTokens(total),
  };
}

// ---- Réponse : nettoyage et validation ----
function validateSchema(value, schema, path = "$", depth = 0) {
  if (depth > LIMITS.jsonDepth) return [`${path} : trop profond`];
  const errs = [];
  if (!schema || typeof schema !== "object") return errs;
  const t = schema.type;
  const typeOf = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer" : typeof v);
  if (t) {
    const ok = (Array.isArray(t) ? t : [t]).some((x) => x === typeOf(value) || (x === "number" && typeof value === "number"));
    if (!ok) return [`${path} : type ${typeOf(value)} au lieu de ${[].concat(t).join("|")}`];
  }
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) errs.push(`${path} : valeur hors liste`);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const k of schema.required || []) if (!Object.hasOwn(value, k)) errs.push(`${path}.${k} : manquant`);
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(value)) {
      if (Object.hasOwn(props, k)) errs.push(...validateSchema(v, props[k], `${path}.${k}`, depth + 1));
      else if (schema.additionalProperties === false) errs.push(`${path}.${k} : propriété non prévue`);
    }
  }
  if (Array.isArray(value) && schema.items) value.forEach((v, i) => errs.push(...validateSchema(v, schema.items, `${path}[${i}]`, depth + 1)));
  return errs.slice(0, 10);
}
function depthOf(v, d = 0) { if (d > LIMITS.jsonDepth) return d; if (v && typeof v === "object") return Math.max(d, ...Object.values(v).map((x) => depthOf(x, d + 1))); return d; }

// Contenu brut d'un fournisseur → contenu sûr à rendre (texte nettoyé, JSON analysé et validé). Lève malformed_response / empty_response.
function checkOutput(content, request) {
  if (typeof content !== "string") throw new AiError("malformed_response", "Le fournisseur n'a pas renvoyé de texte.");
  const text = content.replace(/\u0000/g, "").slice(0, LIMITS.outputChars);
  if (!text.trim()) throw new AiError("empty_response", "Le fournisseur a renvoyé une réponse vide.");
  if (request.responseFormat.type !== "json") return { content: text, contentFormat: "text", data: null };
  let data;
  try { data = JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "")); } catch { throw new AiError("malformed_response", "La réponse n'est pas un JSON valide."); }
  if (depthOf(data) > LIMITS.jsonDepth) throw new AiError("malformed_response", "La réponse JSON est trop profonde.");
  if (request.responseFormat.schema) {
    const errs = validateSchema(data, request.responseFormat.schema);
    if (errs.length) throw new AiError("malformed_response", `La réponse ne respecte pas le schéma : ${errs.slice(0, 3).join(" ; ")}`);
  }
  return { content: text, contentFormat: "json", data };
}
module.exports = { LIMITS, normalizeRequest, checkOutput, validateSchema, estimateTokens };
