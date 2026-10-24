// Connecteur OpenAI — API officielle https://platform.openai.com/docs/api-reference . Authentification : clé d'API (Authorization: Bearer). Capacité : génération de texte (Chat Completions).
// Test non destructif et sans consommation : lecture du modèle choisi (vérifie l'authentification ET l'existence du modèle).
const { ConnectorError } = require("../errors");

const headers = (s) => ({ authorization: `Bearer ${s.apiKey}` });
module.exports = {
  id: "openai", name: "OpenAI", provider: "OpenAI", category: "ai", version: "1.0.0",
  description: "Génération de texte avec GPT.", longDescription: "Permet à Kolakisa de rédiger, reformuler et résumer du texte avec les modèles GPT d'OpenAI. La clé reste côté serveur, chiffrée.",
  baseUrl: "https://api.openai.com", docsUrl: "https://platform.openai.com/docs/api-reference/introduction", credentialsUrl: "https://platform.openai.com/api-keys",
  auth: { method: "api_key" }, mark: "O",
  requirements: ["Un compte OpenAI avec une clé d'API et du crédit (facturation chez OpenAI).", "La variable ENCRYPTION_KEY du serveur (chiffrement des secrets)."],
  costNote: "Chaque génération est facturée par OpenAI selon votre contrat.",
  privacyNote: "Les textes envoyés à une génération sont transmis à OpenAI (États-Unis) selon ses conditions ; Kolakisa n'en conserve pas le contenu.",
  fields: [
    { key: "apiKey", label: "Clé d'API", type: "secret", required: true, pattern: /^sk-[A-Za-z0-9_-]{16,}$/, patternHelp: "Une clé OpenAI commence par « sk- ».", help: "Créée sur platform.openai.com → Clés d'API. Elle n'est jamais réaffichée." },
    { key: "model", label: "Modèle", type: "text", required: true, default: "gpt-4o-mini", pattern: /^[A-Za-z0-9._:-]{3,80}$/, patternHelp: "Identifiant de modèle (lettres, chiffres, « . », « - »).", help: "Vérifié à chaque test de connexion." },
  ],
  capabilities: {
    "text.generate": async ({ http, config, secrets, input }) => {
      const messages = [...(input.system ? [{ role: "system", content: input.system }] : []), { role: "user", content: input.prompt }];
      const r = await http({ path: "/v1/chat/completions", method: "POST", headers: headers(secrets), json: { model: config.model, messages, max_completion_tokens: input.maxTokens } });
      const b = r.body || {}; const choice = (b.choices || [])[0] || {};
      if (choice.finish_reason === "content_filter") throw new ConnectorError("bad_request", "Le fournisseur a refusé de traiter ce texte.");
      return { text: (choice.message && choice.message.content) || "", model: b.model || config.model, usage: b.usage ? { inputTokens: b.usage.prompt_tokens, outputTokens: b.usage.completion_tokens } : null };
    },
  },
  async test({ http, config, secrets }) {
    await http({ path: `/v1/models/${encodeURIComponent(config.model)}`, headers: headers(secrets) }).catch((e) => { if (e.code === "model_not_found") throw new ConnectorError("model_not_found", `Le modèle « ${config.model} » n'existe pas ou n'est pas accessible avec cette clé.`, { status: 404 }); throw e; });
    return { message: `Connexion réussie : clé valide et modèle « ${config.model} » accessible.` };
  },
};
