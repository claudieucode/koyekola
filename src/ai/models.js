// REGISTRE DES MODÈLES. Une fiche par modèle : fournisseur, identifiant officiel, capacités DÉCLARÉES, limites, tarifs et date de vérification.
// Règles :
//  - les modèles livrés par défaut sont ceux que le dépôt utilisait déjà ; leurs capacités, limites et tarifs sont INCONNUS (null) tant qu'un administrateur ne les a pas vérifiés ;
//  - un tarif n'est jamais éternel : il porte une date de vérification et une source ; passé PRICE_MAX_AGE_DAYS il est « périmé » ;
//  - la disponibilité n'est « available » qu'après un test réel de connexion (markVerified) ; sinon « unverified ».
const { AiError } = require("./errors");

const PRICE_MAX_AGE_DAYS = 90;
const DAY = 86400000;
const AVAILABILITY = ["unverified", "available", "unavailable", "deprecated"];
const TIERS = ["economy", "standard", "premium"];
// Capacités reconnues. Un modèle ne peut déclarer que celles-ci ; un adaptateur ne les honore que s'il les implémente réellement.
const CAPABILITIES = ["text", "structured_output", "images", "files", "streaming"];

const id = (v, label) => { if (!/^[A-Za-z0-9._:/-]{2,100}$/.test(String(v || ""))) throw new AiError("invalid_request", `${label} invalide.`); return String(v); };

function normalizeModel(input) {
  const provider = id(input.provider, "Fournisseur");
  const modelId = id(input.id, "Identifiant de modèle");
  if (!/^[a-z][a-z0-9-]{1,30}$/.test(provider)) throw new AiError("invalid_request", "Fournisseur invalide.");
  const caps = [...new Set(input.capabilities || ["text"])];
  for (const c of caps) if (!CAPABILITIES.includes(c)) throw new AiError("invalid_request", `Capacité inconnue : ${String(c).slice(0, 40)}.`);
  const availability = input.availability || "unverified";
  if (!AVAILABILITY.includes(availability)) throw new AiError("invalid_request", "Disponibilité inconnue.");
  const tier = input.tier || "standard";
  if (!TIERS.includes(tier)) throw new AiError("invalid_request", "Niveau inconnu.");
  const pos = (v, label) => { if (v === null || v === undefined) return null; const n = Number(v); if (!Number.isFinite(n) || n < 0) throw new AiError("invalid_request", `${label} invalide.`); return n; };
  let pricing = null;
  if (input.pricing) {
    pricing = { inputPerMillionUsd: pos(input.pricing.inputPerMillionUsd, "Tarif d'entrée"), outputPerMillionUsd: pos(input.pricing.outputPerMillionUsd, "Tarif de sortie"), verifiedAt: Number(input.pricing.verifiedAt) || null, source: String(input.pricing.source || "").slice(0, 200) };
    if (pricing.inputPerMillionUsd === null || pricing.outputPerMillionUsd === null) pricing = null;
  }
  return {
    key: `${provider}:${modelId}`, provider, id: modelId, displayName: String(input.displayName || modelId).slice(0, 80),
    availability, capabilities: caps, tier,
    contextTokens: pos(input.contextTokens, "Limite de contexte"), maxOutputTokens: pos(input.maxOutputTokens, "Limite de sortie"),
    pricing, restrictions: String(input.restrictions || "").slice(0, 300), lastVerifiedAt: Number(input.lastVerifiedAt) || null,
  };
}

// Modèles déjà référencés par le dépôt (aiCore.js, connecteurs). Rien d'autre n'est affirmé sur eux.
const SEED = [
  { provider: "anthropic", id: "claude-opus-5-5", displayName: "Claude Opus 5.5", tier: "premium", capabilities: ["text", "structured_output"] },
  { provider: "openai", id: "gpt-4o-mini", displayName: "GPT-4o mini", tier: "economy", capabilities: ["text", "structured_output"] },
  { provider: "gemini", id: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash", tier: "economy", capabilities: ["text", "structured_output"] },
];

function createRegistry({ now = Date.now, seed = SEED } = {}) {
  const map = new Map();
  const api = {
    register(input) { const m = normalizeModel(input); map.set(m.key, m); return m; },
    unregister(key) { return map.delete(key); },
    get(key) { return map.get(String(key)) || null; },
    list({ provider, capability, tier } = {}) {
      return [...map.values()].filter((m) => (!provider || m.provider === provider) && (!capability || m.capabilities.includes(capability)) && (!tier || m.tier === tier)).map((m) => ({ ...m, priceStatus: api.priceStatus(m) }));
    },
    // Mise à jour d'un tarif : date et source obligatoires (un prix sans origine n'est pas « vérifié »)
    setPricing(key, { inputPerMillionUsd, outputPerMillionUsd, source }, at = now()) {
      const m = map.get(key); if (!m) throw new AiError("model_unknown", "Modèle inconnu.");
      if (!source || !String(source).trim()) throw new AiError("invalid_request", "Tarif : la source (page officielle du fournisseur) est obligatoire.");
      map.set(key, normalizeModel({ ...m, pricing: { inputPerMillionUsd, outputPerMillionUsd, verifiedAt: at, source } }));
      return map.get(key);
    },
    // À appeler après un test RÉEL de connexion réussi (ou échoué) : seul moyen de passer à « available » / « unavailable »
    markVerified(key, available, at = now()) {
      const m = map.get(key); if (!m) throw new AiError("model_unknown", "Modèle inconnu.");
      map.set(key, { ...m, availability: available ? "available" : "unavailable", lastVerifiedAt: at });
      return map.get(key);
    },
    // verified : tarif daté de moins de 90 jours ; stale : plus ancien ; unknown : absent
    priceStatus(m) {
      if (!m.pricing || !m.pricing.verifiedAt) return "unknown";
      return now() - m.pricing.verifiedAt > PRICE_MAX_AGE_DAYS * DAY ? "stale" : "verified";
    },
    // Coût estimé en micro-dollars (1 000 000 = 1 USD) ; null si le tarif est inconnu. Un tarif périmé donne une estimation signalée.
    estimateCost(m, inputTokens, outputTokens) {
      if (!m.pricing) return null;
      return Math.ceil(inputTokens * m.pricing.inputPerMillionUsd + outputTokens * m.pricing.outputPerMillionUsd);
    },
  };
  for (const s of seed) api.register(s);
  return api;
}
module.exports = { createRegistry, normalizeModel, PRICE_MAX_AGE_DAYS, CAPABILITIES, AVAILABILITY, TIERS, SEED };
