// Aides communes aux adaptateurs de fournisseurs. Un adaptateur implémente le contrat :
//   { id, connectorId, baseUrl, label, supports: { text, structured_output, images, files, streaming }, complete({ http, credentials, model, request }) }
// et renvoie { content, finishReason ('stop'|'length'|'refused'|'other'), providerFinishReason, usage ({inputTokens, outputTokens} | null), providerRequestId, model }.
// Les capacités déclarées dans `supports` sont celles que le code implémente RÉELLEMENT (images, fichiers et flux ne le sont pour aucun fournisseur à ce stade).
const JSON_ONLY = "Réponds uniquement avec un objet JSON valide, sans texte autour ni balises de code.";
// Instructions système finales : celles du module, plus la consigne de format JSON si demandé
const systemOf = (request) => [request.system, request.responseFormat.type === "json" ? JSON_ONLY : ""].filter(Boolean).join("\n\n");
const count = (v) => (Number.isFinite(v) && v >= 0 ? Math.trunc(v) : null);
const usageOf = (input, output) => (count(input) !== null && count(output) !== null ? { inputTokens: count(input), outputTokens: count(output) } : null);
module.exports = { JSON_ONLY, systemOf, usageOf, SUPPORTS_TEXT: Object.freeze({ text: true, structured_output: true, images: false, files: false, streaming: false }) };
