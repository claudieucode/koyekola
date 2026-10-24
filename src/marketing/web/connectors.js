// KOLAKISA CMS → Réglages → Connecteurs : écran et API JSON. Toute la logique est dans services/connectors ; ici : le niveau (central ou UN site) vient de l'adresse vérifiée par le serveur (siteTarget),
// jamais d'un champ du navigateur ; les droits sont recalculés pour ce niveau (settings.read pour voir, settings.write pour agir, settings.sensitive pour enregistrer un secret) ;
// aucune réponse ne contient de valeur secrète ; les erreurs sont normalisées et sans secret.
const connectors = require("../../services/connectors");
const access = require("../../services/cmsAccess");
const target = require("./siteTarget");
const { UserError } = require("../../utils/errors");
const { safeJson } = require("./kit");

const intOrNull = (v) => (/^\d{1,9}$/.test(String(v ?? "")) ? Number(v) : null);

function open(req, res, { json = false } = {}) {
  const t = target(req, res, { json }); if (!t) return null;
  if (!t.siteId && req.mk.siteOnly) { const m = "Les connecteurs du niveau central sont réservés à l'équipe de l'organisation."; if (json) res.status(403).json({ ok: false, error: m }); else res.status(403).render("error", { message: m }); return null; }
  const org = req.mk.ctx.organizationId;
  const perms = access.effectivePermissions(req.session.user.id, { organizationId: org, siteId: t.siteId });
  const ctx = { ...req.mk.ctx, userId: req.session.user.id };
  return { t, scope: { siteId: t.siteId }, ctx, perms, can: (p) => perms.has(p), team: !req.mk.siteOnly };
}
const state = (c) => ({
  scope: { siteId: c.scope.siteId, name: c.t.name, central: !c.scope.siteId, readOnly: c.t.readOnly },
  can: { read: c.can("settings.read"), write: c.can("settings.write") && !c.t.readOnly, secrets: c.can("settings.write") && c.can("settings.sensitive") && !c.t.readOnly, share: !c.scope.siteId && c.team && c.can("settings.write") },
  catalog: connectors.catalog(c.ctx, c.scope),
  capabilities: Object.entries(connectors.CAPABILITIES).map(([key, cap]) => ({ key, label: cap.label, description: cap.description, providers: connectors.providersFor(c.ctx, c.scope, key), preferred: connectors.preferences(c.ctx, c.scope)[key] })),
  states: connectors.STATES, categories: connectors.CATEGORIES,
});

function render(req, res, t, extra = {}) {
  const c = open(req, res); if (!c) return;
  if (!c.can("settings.read")) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'ouvrir cet écran." });
  res.set("Cache-Control", "no-store");
  const q = c.scope.siteId ? `?site=${c.scope.siteId}` : "";
  const data = { ...state(c), api: `/marketing/site-web/parametres/api/connecteurs${q}` };
  res.render("marketing/connectors", { title: "Connecteurs", active: "parametres/connecteurs", T: c.t, C: data, bootJson: safeJson(data), connectorsJs: true, ...extra });
}

function apiRoutes(api) {
  const json = (res, status, body) => res.status(status).set("Cache-Control", "no-store").json(body);
  const guard = (req, res, perm, fn) => async () => {
    const c = open(req, res, { json: true }); if (!c) return;
    if (!c.can(perm)) return json(res, 403, { ok: false, error: perm === "settings.read" ? "Permission « settings.read » requise." : "Vous n'avez pas la permission de modifier les connecteurs." });
    if (perm !== "settings.read" && c.t.readOnly) return json(res, 403, { ok: false, error: "Ce site est archivé : ses connecteurs ne se modifient plus." });
    try { await fn(c); }
    catch (error) {
      if (error instanceof UserError) return json(res, 422, { ok: false, error: error.message });
      if (error && error.name === "ConnectorError") return json(res, 502, { ok: false, code: error.code, error: error.message });
      console.error("[KOLAKISA] Connecteurs :", error && error.message);
      return json(res, 500, { ok: false, error: "Erreur inattendue : rien n'a été modifié." });
    }
  };
  api.get("/connecteurs", (req, res) => guard(req, res, "settings.read", (c) => json(res, 200, { ok: true, ...state(c) }))());
  // Enregistrer la configuration d'un connecteur : { values: { champ: valeur } } ; un secret vide conserve l'ancien ; enregistrer un secret exige settings.sensitive
  api.put("/connecteurs/:connector([a-z0-9-]{2,40})", (req, res) => guard(req, res, "settings.write", (c) => {
    const values = req.body && typeof req.body.values === "object" && req.body.values && !Array.isArray(req.body.values) ? req.body.values : null;
    if (!values) return json(res, 422, { ok: false, error: "Corps invalide : { values: { champ: valeur } } attendu." });
    const a = connectors.get(req.params.connector);
    if (!a || a.kind === "external") return json(res, 404, { ok: false, error: "Connecteur inconnu ou géré dans son propre module." });
    const unknown = Object.keys(values).filter((k) => !a.fields.some((f) => f.key === k));
    if (unknown.length) return json(res, 422, { ok: false, error: `Champ inconnu : ${unknown.map((k) => String(k).slice(0, 30)).join(", ")}.` });
    const writesSecret = a.fields.some((f) => f.type === "secret" && typeof values[f.key] === "string" && values[f.key].trim());
    if (writesSecret && !c.can("settings.sensitive")) return json(res, 403, { ok: false, error: "Enregistrer un identifiant secret exige la permission « settings.sensitive »." });
    json(res, 200, { ok: true, connection: connectors.configure(c.ctx, c.scope, a.id, values), ...state(c) });
  })());
  const byId = (method, suffix, perm, run) => api[method](`/connecteurs/:id(\\d+)${suffix}`, (req, res) => guard(req, res, perm, async (c) => { const out = await run(c, Number(req.params.id), req); json(res, 200, { ok: true, ...out, ...state(c) }); })());
  byId("post", "/test", "settings.write", async (c, id) => { const r = await connectors.test(c.ctx, c.scope, id); return { test: { ok: r.ok, code: r.code, message: r.message }, connection: r.connection }; });
  byId("post", "/desactiver", "settings.write", async (c, id) => ({ connection: connectors.setDisabled(c.ctx, c.scope, id, true) }));
  byId("post", "/activer", "settings.write", async (c, id) => ({ connection: connectors.setDisabled(c.ctx, c.scope, id, false) }));
  byId("post", "/revoquer", "settings.sensitive", async (c, id) => ({ connection: connectors.revokeSecrets(c.ctx, c.scope, id) }));
  byId("post", "/partager", "settings.write", async (c, id, req) => { if (!c.team) throw new UserError("Réservé à l'équipe de l'organisation."); return { connection: connectors.setShared(c.ctx, c.scope, id, req.body && req.body.shared === true) }; });
  byId("delete", "", "settings.sensitive", async (c, id) => { connectors.remove(c.ctx, c.scope, id); return { removed: true }; });
  // Fournisseur d'une capacité : { capability, connector } (connector vide = aucune préférence) ; jamais de basculement automatique
  api.put("/connecteurs-preference", (req, res) => guard(req, res, "settings.write", (c) => {
    const b = req.body || {};
    connectors.setPreference(c.ctx, c.scope, String(b.capability || ""), b.connector ? String(b.connector) : "");
    json(res, 200, { ok: true, ...state(c) });
  })());
}

module.exports = { render, apiRoutes };
