// Anthropic — Messages API (https://docs.anthropic.com/en/api/messages). Authentification : en-tête x-api-key + anthropic-version.
// Sortie structurée : consigne « JSON seulement » + validation locale (le paramètre output_config du module historique aiCore.js n'est pas repris ici : non vérifié pour tous les modèles).
const { systemOf, usageOf, SUPPORTS_TEXT } = require("./shared");
const FINISH = { end_turn: "stop", stop_sequence: "stop", max_tokens: "length", refusal: "refused" };
module.exports = {
  id: "anthropic", connectorId: "anthropic", baseUrl: "https://api.anthropic.com", label: "Anthropic", supports: SUPPORTS_TEXT,
  authHeaders: (s) => ({ "x-api-key": s.apiKey, "anthropic-version": "2023-06-01" }),
  async complete({ http, model, request }) {
    const system = systemOf(request);
    const body = { model, max_tokens: request.maxOutputTokens, messages: request.messages, ...(system ? { system } : {}) };
    if (request.temperature !== null) body.temperature = Math.min(1, request.temperature);
    const r = await http({ path: "/v1/messages", method: "POST", json: body });
    const b = r.body || {};
    const text = Array.isArray(b.content) ? b.content.filter((x) => x && x.type === "text").map((x) => x.text || "").join("") : undefined;
    return { content: text, finishReason: FINISH[b.stop_reason] || "other", providerFinishReason: String(b.stop_reason || ""), usage: b.usage ? usageOf(b.usage.input_tokens, b.usage.output_tokens) : null, providerRequestId: String(b.id || ""), model: b.model || model };
  },
};
