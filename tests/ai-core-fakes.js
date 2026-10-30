// Outils de test du Kolakisa AI Core : fournisseurs SIMULÉS et déterministes, base en mémoire avec les vraies migrations. Aucun appel réseau, aucune clé réelle.
const { freshMarketing } = require("./marketing-helpers");
const { createAiCore } = require("../src/ai");
const { createProviders } = require("../src/ai/providers");
const { createRegistry } = require("../src/ai/models");
const { createLogger } = require("../src/ai/logging");
const { AiError } = require("../src/ai/errors");

const KEY = "sk-test-FAKEKEY-do-not-use-123456";
const SUPPORTS = { text: true, structured_output: true, images: false, files: false, streaming: false };
// script : liste d'étapes consommées une par une (une étape = objet de réponse ou Error à lever). Dernière étape répétée.
function fakeAdapter(id, script = [{ content: "Bonjour" }]) {
  const calls = [];
  return {
    id, label: id, baseUrl: `https://${id}.invalid`, supports: SUPPORTS, authHeaders: () => ({}), calls,
    async complete({ request, model }) {
      calls.push({ model, request });
      const step = script.length > 1 ? script.shift() : script[0];
      if (step instanceof Error) throw step;
      return { finishReason: "stop", providerFinishReason: "stop", usage: { inputTokens: 100, outputTokens: 20 }, providerRequestId: `req-${calls.length}`, model, ...step };
    },
  };
}
const ADMIN = (extra = {}) => ({ userId: 1, organizationId: 1, siteScope: null, can: () => true, ...extra });
const USER = (can = ["ai.use"], extra = {}) => ({ userId: 2, organizationId: 1, siteScope: null, can: (p) => can.includes(p), ...extra });

function setup({ adapters = { alpha: fakeAdapter("alpha"), beta: fakeAdapter("beta") }, models = null, clock = { t: 1_800_000_000_000 }, retries = 1 } = {}) {
  const m = freshMarketing();
  const now = () => clock.t;
  const sleeps = [];
  const providers = createProviders({ now, credentials: (ctx, scope, adapter) => (adapter.id === "nocreds" ? null : { secrets: { apiKey: KEY }, config: {}, source: "central" }) });
  for (const a of Object.values(adapters)) providers.register(a);
  const registry = createRegistry({ now, seed: [] });
  for (const mod of models || [
    { provider: "alpha", id: "a-small", tier: "economy", capabilities: ["text", "structured_output"] },
    { provider: "alpha", id: "a-big", tier: "premium", capabilities: ["text", "structured_output"] },
    { provider: "beta", id: "b-mid", tier: "standard", capabilities: ["text", "structured_output"] },
  ]) registry.register(mod);
  const lines = [];
  const logger = createLogger({ sink: (l) => lines.push(l) });
  const core = createAiCore({ db: m.db, settings: m.A.settings, providers, registry, now, sleep: async (ms) => { sleeps.push(ms); }, logger, retries });
  core.registerModule("tests");
  core.registerModule("tests-system", { allowSystem: true });
  m.db.exec("INSERT INTO mk_sites (organization_id, name, slug) VALUES (1, 'Site 1', 's1'), (1, 'Site 2', 's2'), (2, 'Site autre org', 's3')");
  return { ...m, core, providers, registry, adapters, clock, sleeps, lines, logger, now };
}
// Configuration centrale « tout activé » avec prix vérifiés (tarifs de TEST, fictifs)
function enableAll(s, extra = {}) {
  const admin = ADMIN();
  s.core.config.updateGlobal(admin, { enabled: true, allowedProviders: ["alpha", "beta"], enabledModels: ["alpha:a-small", "alpha:a-big", "beta:b-mid"], defaultModel: "alpha:a-small", ...extra });
  s.core.config.updateSite(admin, 1, { enabled: true });
  s.core.config.updateSite(admin, 2, { enabled: true });
  s.core.admin.setPricing(admin, "alpha:a-small", { inputPerMillionUsd: 1, outputPerMillionUsd: 2, source: "test" });
  s.core.admin.setPricing(admin, "alpha:a-big", { inputPerMillionUsd: 10, outputPerMillionUsd: 20, source: "test" });
  s.core.admin.setPricing(admin, "beta:b-mid", { inputPerMillionUsd: 2, outputPerMillionUsd: 4, source: "test" });
}
const req = (extra = {}) => ({ module: "tests", task: "demo", siteId: 1, messages: [{ role: "user", content: "Dis bonjour" }], ...extra });
const fail = async (p, code) => { try { await p; } catch (e) { if (code) require("node:assert/strict").equal(e.code, code, `code attendu ${code}, reçu ${e.code} : ${e.message}`); return e; } throw new Error(`Une erreur ${code || ""} était attendue.`); };
module.exports = { setup, enableAll, fakeAdapter, ADMIN, USER, req, fail, KEY, AiError };
