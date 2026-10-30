// AI Image Provider Adapter : registre des fournisseurs de génération d'images, derrière une interface commune. AUCUN appel n'est fait depuis le navigateur ; tous passent par le serveur.
// Réseau : la couche des connecteurs de l'AI Core (services/connectors/http) — HTTPS, hôte déclaré, adresses privées refusées, pas de redirection, délai et taille bornés, secrets masqués.
// Clés : centre de connecteurs (chiffrées, par site), jamais renvoyées à l'interface.
// Statut d'intégration (honnête) :
//   demo   — visuels d'attente déterministes produits localement ; aucune IA, aucun coût ; toujours identifiés « démonstration ».
//   openai — adaptateur ÉCRIT d'après la documentation publique de l'API Images ; testé uniquement contre un faux serveur local ; JAMAIS appelé en réel (aucune clé disponible). Non vérifié.
//   autres fournisseurs d'images (Gemini/Imagen, Stability, Black Forest Labs…) : NON intégrés.
const png = require("./png");

class MediaError extends Error {
  constructor(code, message, { retryable = false, billed = false } = {}) { super(message); this.name = "MediaError"; this.code = code; this.retryable = retryable; this.possiblyBilled = billed; }
}
// Formats proposés (ratio → pixels) : ceux de l'API Images d'OpenAI ; le fournisseur de démonstration les respecte en miniature
const RATIOS = Object.freeze({ "1:1": { width: 1024, height: 1024 }, "3:2": { width: 1536, height: 1024 }, "2:3": { width: 1024, height: 1536 } });

const demo = {
  id: "demo", label: "Démonstration (sans IA)", kind: "demo", integration: "Local, testé. Produit des visuels d'attente, pas des images d'IA.",
  models: [{ id: "placeholder-1", label: "Visuel d'attente", ratios: Object.keys(RATIOS), maxVariants: 4, price: { microUsd: 0, status: "verified" } }],
  configured: () => true,
  async generate({ prompt, ratio, n = 1, seed = "" }) {
    const r = RATIOS[ratio]; if (!r) throw new MediaError("invalid_request", "Format non pris en charge par ce fournisseur.");
    const w = Math.round(r.width / 8), h = Math.round(r.height / 8); // miniature : rapide et légère
    return { images: Array.from({ length: n }, (_, i) => ({ buffer: png.placeholder(w, h, `${seed}|${prompt}|${i}`), mime: "image/png" })), providerRequestId: null, billed: false };
  },
};

const openai = {
  id: "openai", label: "OpenAI Images", kind: "real", connectorId: "openai", baseUrl: "https://api.openai.com", timeoutMs: 120000, maxBytes: 24 * 1024 * 1024,
  integration: "Adaptateur écrit d'après la documentation publique ; testé contre un faux serveur seulement ; jamais appelé en réel. NON VÉRIFIÉ.",
  models: [{ id: "gpt-image-1", label: "gpt-image-1", ratios: Object.keys(RATIOS), maxVariants: 4, price: { microUsd: null, status: "unverified" } }],
  configured(ctx, scope, resolve) { try { const c = resolve(ctx, scope, this); return Boolean(c && c.secrets && c.secrets.apiKey); } catch { return false; } },
  async generate({ prompt, ratio, n = 1, model }, { http, credentials }) {
    const size = RATIOS[ratio]; if (!size) throw new MediaError("invalid_request", "Format non pris en charge par ce fournisseur.");
    if (!credentials || !credentials.secrets || !credentials.secrets.apiKey) throw new MediaError("not_configured", "Aucune clé OpenAI utilisable pour ce site (Réglages → Connecteurs).");
    const adapter = { id: this.id, baseUrl: this.baseUrl, timeoutMs: this.timeoutMs, maxBytes: this.maxBytes };
    let r;
    try {
      r = await http.request(adapter, { path: "/v1/images/generations", method: "POST", json: { model, prompt, size: `${size.width}x${size.height}`, n }, headers: { authorization: `Bearer ${credentials.secrets.apiKey}` }, secrets: [credentials.secrets.apiKey], timeoutMs: this.timeoutMs, maxBytes: this.maxBytes });
    } catch (e) {
      const map = { auth_invalid: "auth", permission_denied: "auth", quota_exceeded: "quota", rate_limited: "rate_limited", timeout: "timeout", unavailable: "provider_error", model_not_found: "model_unavailable", bad_request: "content_policy", response_too_large: "invalid_response", invalid_response: "invalid_response", blocked_destination: "network" };
      throw new MediaError(map[e.code] || "provider_error", e.message || "Erreur du fournisseur.", { retryable: Boolean(e.retryable), billed: e.code === "timeout" });
    }
    const data = r && r.body && Array.isArray(r.body.data) ? r.body.data : null;
    if (!data || !data.length) throw new MediaError("invalid_response", "Réponse du fournisseur sans image.", { billed: true });
    const images = data.map((d) => {
      if (!d || typeof d.b64_json !== "string" || !/^[A-Za-z0-9+/=\s]+$/.test(d.b64_json)) throw new MediaError("invalid_response", "Image illisible dans la réponse du fournisseur.", { billed: true });
      return { buffer: Buffer.from(d.b64_json, "base64"), mime: "image/png" };
    });
    return { images, providerRequestId: (r.headers && (r.headers["x-request-id"] || r.headers.get && r.headers.get("x-request-id"))) || null, billed: true };
  },
};
// Fournisseurs connus mais NON intégrés : listés pour que l'interface ne les présente jamais comme disponibles
const NOT_INTEGRATED = Object.freeze([
  { id: "gemini-imagen", label: "Google Imagen", reason: "Non intégré." }, { id: "stability", label: "Stability AI", reason: "Non intégré." }, { id: "bfl-flux", label: "Black Forest Labs (Flux)", reason: "Non intégré." },
]);
const REGISTRY = new Map([[demo.id, demo], [openai.id, openai]]);
const get = (id) => REGISTRY.get(String(id)) || null;
const list = () => [...REGISTRY.values()];
// Résolution de clé par défaut (centre de connecteurs) : chargée à la demande (touche la base de l'application)
function defaultCredentials(ctx, scope, adapter) {
  const connectors = require("../services/connectors");
  return connectors.credentialsFor({ organizationId: ctx.organizationId, userId: ctx.userId ?? null, settings: ctx.settings }, { siteId: scope.siteId ?? null }, adapter.connectorId);
}
module.exports = { MediaError, RATIOS, get, list, NOT_INTEGRATED, defaultCredentials, demo, openai };
