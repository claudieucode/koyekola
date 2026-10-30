// Connecteur Mistral AI — API https://docs.mistral.ai/api/ . Authentification : clé d'API (Authorization: Bearer). Capacité : génération de texte (Chat Completions, format compatible OpenAI).
// Test non destructif et sans consommation : lecture du modèle choisi. NON VÉRIFIÉ contre un compte réel (aucune clé disponible lors de l'écriture) : voir docs/KOLAKISA_AI_PROVIDER_ADAPTERS.md.
const { ConnectorError } = require("../errors");

const headers = (s) => ({ authorization: `Bearer ${s.apiKey}` });
module.exports = {
  id: "mistral", name: "Mistral AI", provider: "Mistral AI", category: "ai", version: "1.0.0",
  description: "Génération de texte avec les modèles Mistral.", longDescription: "Permet à Kolakisa de rédiger, reformuler et résumer du texte avec les modèles de Mistral AI. La clé reste côté serveur, chiffrée.",
  baseUrl: "https://api.mistral.ai", docsUrl: "https://docs.mistral.ai/api/", credentialsUrl: "https://console.mistral.ai/api-keys",
  auth: { method: "api_key" }, mark: "M",
  requirements: ["Un compte Mistral AI avec une clé d'API (facturation chez Mistral).", "La variable ENCRYPTION_KEY du serveur (chiffrement des secrets)."],
  costNote: "Chaque génération est facturée par Mistral AI selon votre contrat.",
  privacyNote: "Les textes envoyés à une génération sont transmis à Mistral AI selon ses conditions ; Kolakisa n'en conserve pas le contenu.",
  fields: [
    { key: "apiKey", label: "Clé d'API", type: "secret", required: true, pattern: /^[A-Za-z0-9_-]{16,}$/, patternHelp: "Une clé Mistral : lettres et chiffres (16 caractères au moins).", help: "Créée sur console.mistral.ai → Clés d'API. Elle n'est jamais réaffichée." },
    { key: "model", label: "Modèle", type: "text", required: true, default: "mistral-small-latest", pattern: /^[A-Za-z0-9._:-]{3,80}$/, patternHelp: "Identifiant de modèle (lettres, chiffres, « . », « - »).", help: "Vérifié à chaque test de connexion." },
  ],
  capabilities: {
    "text.generate": async ({ http, config, secrets, input }) => {
      const messages = [...(input.system ? [{ role: "system", content: input.system }] : []), { role: "user", content: input.prompt }];
      const r = await http({ path: "/v1/chat/completions", method: "POST", headers: headers(secrets), json: { model: config.model, messages, max_tokens: input.maxTokens } });
      const b = r.body || {}; const choice = (b.choices || [])[0] || {};
      return { text: (choice.message && choice.message.content) || "", model: b.model || config.model, usage: b.usage ? { inputTokens: b.usage.prompt_tokens, outputTokens: b.usage.completion_tokens } : null };
    },
  },
  async test({ http, config, secrets }) {
    await http({ path: `/v1/models/${encodeURIComponent(config.model)}`, headers: headers(secrets) }).catch((e) => { if (e.code === "model_not_found") throw new ConnectorError("model_not_found", `Le modèle « ${config.model} » n'existe pas ou n'est pas accessible avec cette clé.`, { status: 404 }); throw e; });
    return { message: `Connexion réussie : clé valide et modèle « ${config.model} » accessible.` };
  },
};
