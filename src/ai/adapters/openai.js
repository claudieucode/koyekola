// OpenAI — Chat Completions (https://platform.openai.com/docs/api-reference/chat). Authentification : Authorization: Bearer.
// Sortie structurée : mode « json_object » + validation locale (pas de schéma strict côté fournisseur). Température transmise seulement si demandée.
const { systemOf, usageOf, SUPPORTS_TEXT } = require("./shared");
const FINISH = { stop: "stop", length: "length", content_filter: "refused" };
module.exports = {
  id: "openai", connectorId: "openai", baseUrl: "https://api.openai.com", label: "OpenAI", supports: SUPPORTS_TEXT,
  authHeaders: (s) => ({ authorization: `Bearer ${s.apiKey}` }),
  async complete({ http, model, request }) {
    const system = systemOf(request);
    const body = { model, messages: [...(system ? [{ role: "system", content: system }] : []), ...request.messages], max_completion_tokens: request.maxOutputTokens };
    if (request.temperature !== null) body.temperature = request.temperature;
    if (request.responseFormat.type === "json") body.response_format = { type: "json_object" };
    const r = await http({ path: "/v1/chat/completions", method: "POST", json: body });
    const b = r.body || {}, choice = (b.choices || [])[0] || {};
    return { content: choice.message ? choice.message.content : undefined, finishReason: FINISH[choice.finish_reason] || "other", providerFinishReason: String(choice.finish_reason || ""), usage: b.usage ? usageOf(b.usage.prompt_tokens, b.usage.completion_tokens) : null, providerRequestId: String(b.id || ""), model: b.model || model };
  },
};
