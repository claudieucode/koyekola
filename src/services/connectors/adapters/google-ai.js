// Connecteur Google AI (Gemini) — API officielle https://ai.google.dev/api . Authentification : clé d'API envoyée dans l'EN-TÊTE x-goog-api-key (jamais dans l'adresse). Capacité : génération de texte.
// Test non destructif et sans consommation : lecture du modèle choisi.
const { ConnectorError } = require("../errors");

const headers = (s) => ({ "x-goog-api-key": s.apiKey });
// Google répond 400 (et non 401) pour une clé invalide : on le ramène au code normalisé « identifiants refusés »
const keyRefused = (e) => (e && e.code === "bad_request" && /API key not valid|API_KEY_INVALID|API key expired/i.test(e.message) ? new ConnectorError("auth_invalid", "Identifiants refusés par le fournisseur (clé d'API invalide ou expirée).", { status: e.status }) : e);
module.exports = {
  id: "google-ai", name: "Google", provider: "Google", category: "ai", version: "1.0.0",
  description: "Génération de texte avec Gemini.", longDescription: "Permet à Kolakisa de rédiger, reformuler et résumer du texte avec les modèles Gemini de Google AI Studio. La clé reste côté serveur, chiffrée.",
  baseUrl: "https://generativelanguage.googleapis.com", docsUrl: "https://ai.google.dev/gemini-api/docs", credentialsUrl: "https://aistudio.google.com/app/apikey",
  auth: { method: "api_key" }, mark: "G",
  requirements: ["Une clé d'API Google AI Studio (offre gratuite limitée ou facturation Google).", "La variable ENCRYPTION_KEY du serveur (chiffrement des secrets)."],
  costNote: "Selon votre offre Google AI : un quota gratuit limité peut s'appliquer, au-delà la facturation est chez Google.",
  privacyNote: "Les textes envoyés à une génération sont transmis à Google selon les conditions de l'offre choisie ; Kolakisa n'en conserve pas le contenu.",
  fields: [
    { key: "apiKey", label: "Clé d'API", type: "secret", required: true, pattern: /^AIza[A-Za-z0-9_-]{20,}$/, patternHelp: "Une clé Google AI commence par « AIza ».", help: "Créée sur aistudio.google.com → Clés d'API. Elle n'est jamais réaffichée." },
    { key: "model", label: "Modèle", type: "text", required: true, default: "gemini-2.0-flash", pattern: /^[A-Za-z0-9._-]{3,80}$/, patternHelp: "Identifiant de modèle (lettres, chiffres, « . », « - »).", help: "Vérifié à chaque test de connexion." },
  ],
  capabilities: {
    "text.generate": async ({ http, config, secrets, input }) => {
      const r = await http({ path: `/v1beta/models/${encodeURIComponent(config.model)}:generateContent`, method: "POST", headers: headers(secrets), json: { contents: [{ role: "user", parts: [{ text: input.prompt }] }], ...(input.system ? { systemInstruction: { parts: [{ text: input.system }] } } : {}), generationConfig: { maxOutputTokens: input.maxTokens } } }).catch((e) => { throw keyRefused(e); });
      const b = r.body || {}; const cand = (b.candidates || [])[0];
      if (!cand && b.promptFeedback && b.promptFeedback.blockReason) throw new ConnectorError("bad_request", "Le fournisseur a refusé de traiter ce texte.");
      const t = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts.map((p) => p.text || "").join("") : "";
      return { text: t, model: config.model, usage: b.usageMetadata ? { inputTokens: b.usageMetadata.promptTokenCount || 0, outputTokens: b.usageMetadata.candidatesTokenCount || 0 } : null };
    },
  },
  async test({ http, config, secrets }) {
    await http({ path: `/v1beta/models/${encodeURIComponent(config.model)}`, headers: headers(secrets) }).catch((e) => { e = keyRefused(e); if (e.code === "model_not_found") throw new ConnectorError("model_not_found", `Le modèle « ${config.model} » n'existe pas ou n'est pas accessible avec cette clé.`, { status: 404 }); throw e; });
    return { message: `Connexion réussie : clé valide et modèle « ${config.model} » accessible.` };
  },
};
