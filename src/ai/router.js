// MOTEUR DE ROUTAGE : choisit le modèle (et, si autorisé, les modèles de secours) pour une requête. Fonction pure : ne fait aucun appel réseau.
// Stratégies : explicit (le modèle demandé, sinon refus : jamais remplacé en silence), recommended (modèle de la tâche, sinon modèle par défaut), economy (le moins cher parmi les tarifs VÉRIFIÉS).
// Secours (basculement) : seulement si la requête ET la configuration centrale l'autorisent ; modèle de la liste de secours, fournisseur autorisé, tarif vérifié, coût estimé borné
// (plafond de la requête, sinon coût du principal × facteur) ; jamais un fournisseur hors liste. Le choix est expliqué dans `plan.explain`.
const { AiError } = require("./errors");

function plan({ request, effective, registry, providers }) {
  const need = ["text", ...(request.responseFormat.type === "json" ? ["structured_output"] : [])];
  const inTok = request.inputTokensEstimate, outTok = request.maxOutputTokens;
  const why = new Map();
  const compatible = (key) => {
    const m = registry.get(key);
    if (!m) return "modèle absent du registre";
    if (!effective.allowedProviders.includes(m.provider)) return "fournisseur non autorisé";
    if (!providers.get(m.provider)) return "adaptateur absent";
    if (m.availability === "unavailable" || m.availability === "deprecated") return `modèle ${m.availability === "unavailable" ? "indisponible" : "retiré"}`;
    for (const c of need) if (!m.capabilities.includes(c) || !providers.get(m.provider).supports[c]) return `capacité « ${c} » non déclarée`;
    if (m.contextTokens && inTok + outTok > m.contextTokens) return "limite de contexte dépassée";
    if (m.maxOutputTokens && outTok > m.maxOutputTokens) return "limite de sortie dépassée";
    return null;
  };
  const candidates = effective.models.filter((k) => { const r = compatible(k); if (r) why.set(k, r); return !r; });
  const cost = (key) => registry.estimateCost(registry.get(key), inTok, outTok);
  const verified = (key) => registry.priceStatus(registry.get(key)) === "verified";

  let primary = null, strategy = request.routing.strategy;
  if (strategy === "explicit") {
    if (!candidates.includes(request.model)) throw new AiError("model_unknown", `Le modèle « ${request.model} » n'est pas utilisable ici (${why.get(request.model) || "non activé pour ce site"}). Aucun autre modèle n'a été substitué.`);
    primary = request.model;
  } else if (strategy === "recommended") {
    const wanted = (request.task && effective.tasks[request.task]) || effective.defaultModel;
    if (wanted && candidates.includes(wanted)) primary = wanted;
    else throw new AiError("no_compatible_model", wanted ? `Le modèle recommandé « ${wanted} » n'est pas utilisable (${why.get(wanted) || "non activé pour ce site"}).` : "Aucun modèle recommandé ni par défaut n'est configuré.");
  } else {
    const priced = candidates.filter(verified).sort((a, b) => cost(a) - cost(b) || a.localeCompare(b));
    if (!priced.length) throw new AiError("no_compatible_model", "Aucun modèle compatible n'a de tarif vérifié : le moins cher ne peut pas être déterminé.");
    primary = priced[0];
  }
  const attempts = [{ model: primary, role: "primary", reason: strategy }];
  const skipped = [];
  if (request.routing.allowFallback && effective.fallback.enabled) {
    const base = verified(primary) ? cost(primary) : null;
    const cap = request.routing.maxFallbackCostMicroUsd !== null ? request.routing.maxFallbackCostMicroUsd : base !== null ? Math.ceil(base * effective.fallback.costFactor) : null;
    for (const key of effective.fallback.chain) {
      if (key === primary) continue;
      if (!candidates.includes(key)) { skipped.push({ model: key, reason: why.get(key) || "non activé pour ce site" }); continue; }
      if (!verified(key)) { skipped.push({ model: key, reason: "tarif non vérifié" }); continue; }
      if (cap === null) { skipped.push({ model: key, reason: "coût de référence inconnu : fixez un coût maximal de secours" }); continue; }
      if (cost(key) > cap) { skipped.push({ model: key, reason: "plus cher que le plafond de secours" }); continue; }
      attempts.push({ model: key, role: "fallback", reason: "secours autorisé" });
    }
  }
  return { strategy, attempts, skipped, inputTokensEstimate: inTok, requiredCapabilities: need };
}
module.exports = { plan };
