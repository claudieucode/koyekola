// CONFIGURATION de l'IA : réglage central de l'organisation (fournisseurs et modèles autorisés, modèle par défaut, routage, secours) et réglages par site.
// Stockée dans les réglages de l'organisation (mk_settings, clé « ai_core.config ») : aucun secret ici. Par défaut TOUT EST DÉSACTIVÉ (aucun fournisseur, aucun modèle, aucun site autorisé).
// Hiérarchie : l'administration centrale (`ai.admin`, accès non limité à un site) décide ; un administrateur de site (`ai.site_admin`) peut seulement activer l'IA pour SON site et restreindre ses modèles
// à l'intérieur de ce que le niveau central autorise. Les quotas ne sont réglables que par l'administration centrale.
const { AiError } = require("./errors");

const KEY = "ai_core.config";
const DEFAULTS = Object.freeze({ enabled: false, allowedProviders: [], enabledModels: [], defaultModel: null, tasks: {}, fallback: { enabled: false, chain: [], costFactor: 1.5 }, sites: {} });
const bad = (m) => new AiError("invalid_request", m);

function createConfig({ settings, security, registry, providers }) {
  const read = (orgId) => {
    try {
      const raw = JSON.parse(settings.get(orgId, KEY, "{}"));
      return { ...DEFAULTS, ...raw, fallback: { ...DEFAULTS.fallback, ...(raw.fallback || {}) }, sites: raw.sites && typeof raw.sites === "object" ? raw.sites : {} };
    } catch { return { ...DEFAULTS, fallback: { ...DEFAULTS.fallback }, sites: {} }; }
  };
  const write = (orgId, cfg) => settings.set(orgId, KEY, JSON.stringify(cfg));
  const modelKeys = (list, label, allowed) => {
    if (!Array.isArray(list)) throw bad(`${label} : une liste est attendue.`);
    const out = [...new Set(list.map(String))];
    for (const k of out) { if (!registry.get(k)) throw bad(`${label} : modèle inconnu (${k.slice(0, 60)}).`); if (allowed && !allowed.includes(k)) throw bad(`${label} : « ${k} » n'est pas autorisé par l'administration centrale.`); }
    return out;
  };
  const api = {
    read,
    updateGlobal(actor, patch = {}) {
      security.assertGlobalAdmin(actor);
      const cfg = read(actor.organizationId);
      if (patch.enabled !== undefined) cfg.enabled = patch.enabled === true;
      if (patch.allowedProviders !== undefined) {
        if (!Array.isArray(patch.allowedProviders)) throw bad("Fournisseurs autorisés : une liste est attendue.");
        for (const p of patch.allowedProviders) if (!providers.get(p)) throw bad(`Fournisseur inconnu : ${String(p).slice(0, 40)}.`);
        cfg.allowedProviders = [...new Set(patch.allowedProviders)];
      }
      if (patch.enabledModels !== undefined) cfg.enabledModels = modelKeys(patch.enabledModels, "Modèles activés");
      if (patch.defaultModel !== undefined) { if (patch.defaultModel !== null) modelKeys([patch.defaultModel], "Modèle par défaut"); cfg.defaultModel = patch.defaultModel; }
      if (patch.tasks !== undefined) {
        if (!patch.tasks || typeof patch.tasks !== "object") throw bad("Modèles par tâche : un objet est attendu.");
        for (const [t, m] of Object.entries(patch.tasks)) { if (!/^[a-z][a-z0-9_.-]{1,60}$/.test(t)) throw bad("Nom de tâche invalide."); modelKeys([m], `Tâche ${t}`); }
        cfg.tasks = { ...patch.tasks };
      }
      if (patch.fallback !== undefined) {
        const f = patch.fallback || {};
        const factor = f.costFactor === undefined ? cfg.fallback.costFactor : Number(f.costFactor);
        if (!Number.isFinite(factor) || factor < 1 || factor > 5) throw bad("Facteur de coût du secours : entre 1 et 5.");
        cfg.fallback = { enabled: f.enabled === undefined ? cfg.fallback.enabled : f.enabled === true, chain: f.chain === undefined ? cfg.fallback.chain : modelKeys(f.chain, "Modèles de secours"), costFactor: factor };
      }
      // Cohérence : les modèles de secours, par défaut et par tâche doivent rester dans les modèles activés
      const enabled = new Set(cfg.enabledModels);
      cfg.fallback.chain = cfg.fallback.chain.filter((k) => enabled.has(k));
      if (cfg.defaultModel && !enabled.has(cfg.defaultModel)) cfg.defaultModel = null;
      cfg.tasks = Object.fromEntries(Object.entries(cfg.tasks).filter(([, m]) => enabled.has(m)));
      write(actor.organizationId, cfg);
      return cfg;
    },
    updateSite(actor, siteId, patch = {}) {
      security.assertSiteAdmin(actor, siteId);
      const cfg = read(actor.organizationId);
      const site = { enabled: false, allowedModels: null, preferences: {}, ...(cfg.sites[siteId] || {}) };
      if (patch.enabled !== undefined) site.enabled = patch.enabled === true;
      if (patch.allowedModels !== undefined) site.allowedModels = patch.allowedModels === null ? null : modelKeys(patch.allowedModels, "Modèles du site", cfg.enabledModels);
      if (patch.preferences !== undefined) {
        const p = patch.preferences;
        if (!p || typeof p !== "object" || Array.isArray(p) || Object.keys(p).length > 10) throw bad("Préférences : un objet de 10 entrées au plus.");
        for (const [k, v] of Object.entries(p)) if (!/^[a-z][a-zA-Z0-9_]{0,30}$/.test(k) || !["string", "number", "boolean"].includes(typeof v) || String(v).length > 200) throw bad("Préférence invalide.");
        site.preferences = { ...p };
      }
      cfg.sites[siteId] = site;
      write(actor.organizationId, cfg);
      return site;
    },
    // Ce qui s'applique réellement à un site (null = site principal / niveau organisation)
    effective(orgId, siteId) {
      const cfg = read(orgId);
      const site = siteId === null || siteId === undefined ? null : cfg.sites[siteId] || { enabled: false, allowedModels: null };
      const enabled = cfg.enabled && (site === null || site.enabled === true);
      const models = cfg.enabledModels.filter((k) => !site || !site.allowedModels || site.allowedModels.includes(k));
      return { enabled, allowedProviders: cfg.allowedProviders, models, defaultModel: cfg.defaultModel && models.includes(cfg.defaultModel) ? cfg.defaultModel : null, tasks: cfg.tasks, fallback: cfg.fallback, preferences: site ? site.preferences || {} : {} };
    },
  };
  return api;
}
module.exports = { createConfig, KEY };
