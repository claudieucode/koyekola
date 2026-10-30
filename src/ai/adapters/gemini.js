// Google Gemini — generateContent (https://ai.google.dev/api/generate-content). Authentification : en-tête x-goog-api-key (jamais dans l'adresse).
// Les rôles de Gemini sont « user » et « model ». Sortie structurée : responseMimeType application/json + validation locale.
const { systemOf, usageOf, SUPPORTS_TEXT } = require("./shared");
const FINISH = { STOP: "stop", MAX_TOKENS: "length", SAFETY: "refused", RECITATION: "refused", PROHIBITED_CONTENT: "refused", BLOCKLIST: "refused" };
module.exports = {
  id: "gemini", connectorId: "google-ai", baseUrl: "https://generativelanguage.googleapis.com", label: "Google Gemini", supports: SUPPORTS_TEXT,
  authHeaders: (s) => ({ "x-goog-api-key": s.apiKey }),
  async complete({ http, model, request }) {
    const system = systemOf(request);
    const generationConfig = { maxOutputTokens: request.maxOutputTokens, ...(request.temperature !== null ? { temperature: request.temperature } : {}), ...(request.responseFormat.type === "json" ? { responseMimeType: "application/json" } : {}) };
    const body = { contents: request.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })), generationConfig, ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}) };
    const r = await http({ path: `/v1beta/models/${encodeURIComponent(model)}:generateContent`, method: "POST", json: body });
    const b = r.body || {}, cand = (b.candidates || [])[0] || {};
    const text = cand.content && Array.isArray(cand.content.parts) ? cand.content.parts.map((p) => p.text || "").join("") : undefined;
    const reason = String(cand.finishReason || (b.promptFeedback && b.promptFeedback.blockReason ? "SAFETY" : ""));
    return { content: text, finishReason: FINISH[reason] || "other", providerFinishReason: reason, usage: b.usageMetadata ? usageOf(b.usageMetadata.promptTokenCount, b.usageMetadata.candidatesTokenCount) : null, providerRequestId: String(b.responseId || ""), model: b.modelVersion || model };
  },
};
