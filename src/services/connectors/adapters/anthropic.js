// Connecteur Anthropic (Claude) — API officielle https://docs.anthropic.com/en/api . Authentification : clé d'API (en-tête x-api-key). Capacité : génération de texte.
// Test de connexion NON destructif et sans consommation : liste des modèles (authentification) puis lecture du modèle choisi (existence). Aucun message n'est généré.
const { ConnectorError } = require("../errors");

const headers = (s) => ({ "x-api-key": s.apiKey, "anthropic-version": "2023-06-01" });
module.exports = {
  id: "anthropic", name: "Anthropic", provider: "Anthropic", category: "ai", version: "1.0.0",
  description: "Génération de texte avec Claude.", longDescription: "Permet à Kolakisa de rédiger, reformuler et résumer du texte avec les modèles Claude. La clé reste côté serveur, chiffrée ; chaque site peut utiliser la sienne.",
  baseUrl: "https://api.anthropic.com", docsUrl: "https://docs.anthropic.com/en/api/getting-started", credentialsUrl: "https://console.anthropic.com/settings/keys",
  auth: { method: "api_key" }, mark: "A",
  requirements: ["Un compte Anthropic avec une clé d'API et du crédit (facturation chez Anthropic).", "La variable ENCRYPTION_KEY du serveur (chiffrement des secrets)."],
  costNote: "Chaque génération est facturée par Anthropic selon votre contrat.",
  privacyNote: "Les textes envoyés à une génération sont transmis à Anthropic (États-Unis) selon ses conditions ; Kolakisa n'en conserve pas le contenu.",
  fields: [
    { key: "apiKey", label: "Clé d'API", type: "secret", required: true, pattern: /^sk-ant-[A-Za-z0-9_-]{16,}$/, patternHelp: "Une clé Anthropic commence par « sk-ant- ».", help: "Créée sur console.anthropic.com → Clés d'API. Elle n'est jamais réaffichée." },
    { key: "model", label: "Modèle", type: "text", required: true, default: "claude-sonnet-5-5", pattern: /^[A-Za-z0-9._-]{3,80}$/, patternHelp: "Identifiant de modèle (lettres, chiffres, « . », « - »).", help: "Vérifié à chaque test de connexion." },
  ],
  capabilities: {
    "text.generate": async ({ http, config, secrets, input }) => {
      const r = await http({ path: "/v1/messages", method: "POST", headers: headers(secrets), json: { model: config.model, max_tokens: input.maxTokens, ...(input.system ? { system: input.system } : {}), messages: [{ role: "user", content: input.prompt }] } });
      const b = r.body || {}; const t = (b.content || []).filter((x) => x && x.type === "text").map((x) => x.text).join("");
      if (b.stop_reason === "refusal") throw new ConnectorError("bad_request", "Le fournisseur a refusé de traiter ce texte.");
      return { text: t, model: b.model || config.model, usage: b.usage ? { inputTokens: b.usage.input_tokens, outputTokens: b.usage.output_tokens } : null };
    },
  },
  async test({ http, config, secrets }) {
    await http({ path: "/v1/models?limit=1", headers: headers(secrets) });
    await http({ path: `/v1/models/${encodeURIComponent(config.model)}`, headers: headers(secrets) }).catch((e) => { if (e.code === "model_not_found") throw new ConnectorError("model_not_found", `Clé valide, mais le modèle « ${config.model} » n'existe pas ou n'est pas accessible avec cette clé.`, { status: 404 }); throw e; });
    return { message: `Connexion réussie : clé valide et modèle « ${config.model} » accessible.` };
  },
};
