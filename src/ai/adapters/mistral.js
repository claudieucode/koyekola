// Mistral AI — Chat Completions (https://docs.mistral.ai/api/), format proche d'OpenAI. Authentification : Authorization: Bearer.
// NON VÉRIFIÉ contre un compte réel. Sortie structurée : mode « json_object » + validation locale.
const { systemOf, usageOf, SUPPORTS_TEXT } = require("./shared");
const FINISH = { stop: "stop", length: "length", model_length: "length" };
module.exports = {
  id: "mistral", connectorId: "mistral", baseUrl: "https://api.mistral.ai", label: "Mistral AI", supports: SUPPORTS_TEXT,
  authHeaders: (s) => ({ authorization: `Bearer ${s.apiKey}` }),
  async complete({ http, model, request }) {
    const system = systemOf(request);
    const body = { model, messages: [...(system ? [{ role: "system", content: system }] : []), ...request.messages], max_tokens: request.maxOutputTokens };
    if (request.temperature !== null) body.temperature = Math.min(1.5, request.temperature);
    if (request.responseFormat.type === "json") body.response_format = { type: "json_object" };
    const r = await http({ path: "/v1/chat/completions", method: "POST", json: body });
    const b = r.body || {}, choice = (b.choices || [])[0] || {};
    return { content: choice.message ? choice.message.content : undefined, finishReason: FINISH[choice.finish_reason] || "other", providerFinishReason: String(choice.finish_reason || ""), usage: b.usage ? usageOf(b.usage.prompt_tokens, b.usage.completion_tokens) : null, providerRequestId: String(b.id || ""), model: b.model || model };
  },
};
