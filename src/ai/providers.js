// PROVIDER MANAGER : adaptateurs enregistrés, accès aux clés, appels réseau, disjoncteur.
//  - Les clés viennent du centre de connecteurs (Réglages → Connecteurs) : chiffrées en base, par site, jamais renvoyées à l'interface ; ce module ne les lit que côté serveur, pour un appel.
//  - Tous les appels passent par la couche réseau commune des connecteurs (HTTPS, nom d'hôte déclaré, refus des adresses internes, pas de redirection, délai et taille bornés).
//  - Ajouter un fournisseur = un fichier d'adaptateur (voir adapters/) + `register` ; rien d'autre ne change.
const connectors = require("../services/connectors");
const httpLayer = require("../services/connectors/http");
const { AiError, fromConnector } = require("./errors");

const BREAKER = { threshold: 5, openMs: 30000 };

function createProviders({ now = Date.now, credentials = null } = {}) {
  const adapters = new Map();
  const breakers = new Map();
  const defaultCredentials = (ctx, scope, adapter) => {
    if (!adapter.connectorId) return null;
    return connectors.credentialsFor({ organizationId: ctx.organizationId, userId: ctx.userId ?? null, settings: ctx.settings }, { siteId: scope.siteId ?? null }, adapter.connectorId);
  };
  const resolve = credentials || defaultCredentials;

  const api = {
    register(adapter) {
      if (!adapter || !/^[a-z][a-z0-9-]{1,30}$/.test(adapter.id || "")) throw new Error("Adaptateur IA invalide : identifiant.");
      if (adapters.has(adapter.id)) throw new Error(`Adaptateur IA déjà enregistré : ${adapter.id}`);
      for (const fn of ["complete", "authHeaders"]) if (typeof adapter[fn] !== "function") throw new Error(`Adaptateur IA « ${adapter.id} » : « ${fn} » manquant.`);
      if (!adapter.supports || typeof adapter.supports !== "object") throw new Error(`Adaptateur IA « ${adapter.id} » : capacités non déclarées.`);
      adapters.set(adapter.id, adapter);
    },
    get: (id) => adapters.get(String(id)) || null,
    list: () => [...adapters.values()].map((a) => ({ id: a.id, label: a.label || a.id, supports: { ...a.supports } })),
    // Un fournisseur est « configuré » pour un site si une clé utilisable existe pour lui (propre au site, ou partagée par le niveau central). Ne révèle aucune valeur.
    status(ctx, scope, id) {
      const a = adapters.get(id); if (!a) return { configured: false, source: null, circuit: "n/a" };
      let c = null; try { c = resolve(ctx, scope, a); } catch { c = null; }
      return { configured: Boolean(c && c.secrets && c.secrets.apiKey), source: c ? c.source || null : null, circuit: api.circuit(id) };
    },
    circuit(id) { const b = breakers.get(id); if (!b || b.failures < BREAKER.threshold) return "closed"; return now() - b.openedAt >= BREAKER.openMs ? "half-open" : "open"; },
    // Un appel : résout la clé, vérifie le disjoncteur, appelle l'adaptateur. Renvoie la sortie brute normalisée de l'adaptateur ; lève AiError.
    async call(ctx, scope, providerId, model, request) {
      const a = adapters.get(providerId);
      if (!a) throw new AiError("provider_unknown", "Fournisseur inconnu.");
      if (api.circuit(providerId) === "open") throw new AiError("circuit_open", `Le fournisseur « ${a.label || a.id} » est mis en pause après des échecs répétés : réessayez dans un instant.`);
      let c; try { c = resolve(ctx, scope, a); } catch { c = null; }
      if (!c || !c.secrets || !c.secrets.apiKey) throw new AiError("provider_not_configured", `Le fournisseur « ${a.label || a.id} » n'a pas de clé utilisable pour ce site.`);
      const secrets = c.secrets;
      const descriptor = { id: a.connectorId || a.id, baseUrl: a.baseUrl, timeoutMs: request.timeoutMs };
      const http = (opts) => httpLayer.request(descriptor, { ...opts, headers: { ...a.authHeaders(secrets), ...(opts.headers || {}) }, secrets: Object.values(secrets), timeoutMs: request.timeoutMs });
      try {
        const out = await a.complete({ http, credentials: { config: c.config || {}, secrets }, model, request });
        breakers.set(providerId, { failures: 0, openedAt: 0 });
        return out;
      } catch (error) {
        const e = fromConnector(error, Object.values(secrets));
        if (["provider_unavailable", "network", "timeout", "provider_overloaded"].includes(e.code)) {
          const b = breakers.get(providerId) || { failures: 0, openedAt: 0 };
          breakers.set(providerId, { failures: b.failures + 1, openedAt: now() });
        }
        throw e;
      }
    },
    resetCircuit(id) { breakers.delete(id); },
  };
  return api;
}
function defaultProviders(options) {
  const p = createProviders(options);
  for (const f of ["openai", "anthropic", "gemini", "mistral"]) p.register(require(`./adapters/${f}`));
  return p;
}
module.exports = { createProviders, defaultProviders, BREAKER };
