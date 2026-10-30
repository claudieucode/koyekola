// Marketing → Mailchimp : écran et API JSON interne (/marketing/mailchimp/api/…). Toute la logique est dans src/marketing/mailchimp. Ici : droits, contexte, forme des réponses.
//  - accès réservé aux administrateurs de l'ORGANISATION (« mailchimp.manage ») : la clé d'API donne accès à toute l'audience Mailchimp ; jamais ouvert à un accès limité à un site ;
//  - réponses toujours { ok: true, data } ou { ok: false, error: { code, message, detail?, fields? } } ; aucune réponse ne contient la clé d'API ni le jeton de webhook ;
//  - les routes des opérations Mailchimp sont GÉNÉRÉES depuis le catalogue (catalog.js) : une opération absente du catalogue n'existe pas.
const express = require("express");
const { MarketingError } = require("../errors");
const { safeJson } = require("./kit");
const connection = require("../mailchimp/connection");
const sync = require("../mailchimp/sync");
const inbound = require("../mailchimp/inbound");
const composite = require("../mailchimp/composite");
const transactional = require("../mailchimp/transactional");
const { OPS } = require("../mailchimp/catalog");
const operations = require("../mailchimp/operations");

const HTTP = { invalid_request: 400, invalid_field: 400, key_format: 400, too_large: 413, confirm_required: 409, not_connected: 409, already_linked: 409, not_found: 404, unknown_operation: 404, rate_limited: 429,
  auth_invalid: 422, forbidden: 422, member_exists: 422, compliance_state: 422, quota: 422, recipient_blocked: 422, webhook_url: 422, encryption_missing: 500, timeout: 504, network: 502, server_error: 502, unknown: 502 };

function fail(res, error) {
  if (!(error instanceof MarketingError)) { console.error("[KOLAKISA] Mailchimp :", error && error.stack || error); return res.status(500).set("Cache-Control", "no-store").json({ ok: false, error: { code: "internal", message: "Erreur interne. Réessayez ; si elle persiste, consultez le journal du serveur." } }); }
  return res.status(HTTP[error.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: { code: error.code, message: error.message, ...(error.detail ? { detail: String(error.detail).slice(0, 500) } : {}) } });
}

module.exports = ({ db }) => {
  const router = express.Router();
  const ctxOf = (req) => ({ ...req.mk.ctx, settings: req.mk.ctx.settings || req.mk.marketing.settings, bus: req.mk.ctx.bus || req.mk.marketing.bus, env: process.env });
  const allowed = (req) => req.mk.can("mailchimp.manage") && !req.mk.siteOnly;

  router.get("/mailchimp", (req, res) => {
    if (!allowed(req)) return res.status(403).render("error", { message: "Réservé aux administrateurs de l'organisation." });
    const ctx = ctxOf(req);
    const data = { status: connection.status(ctx), sync: sync.state(ctx), api: "/marketing/mailchimp/api", groups: [...new Set(OPS.map((o) => o.group))], transactional: Object.keys(transactional.OPS) };
    res.set("Cache-Control", "no-store").render("marketing/mailchimp", { title: "Mailchimp", active: "mailchimp", bootJson: safeJson(data), mailchimpJs: true });
  });

  // Enveloppe commune des routes JSON
  // Défense en profondeur contre les requêtes inter-sites (le cookie de session est déjà « SameSite=Lax ») : toute requête qui modifie quelque chose doit porter l'en-tête
  // X-Requested-With, qu'un formulaire HTML d'un autre site ne peut pas poser (il exigerait une autorisation préalable du navigateur).
  const sameOrigin = (req) => ["GET", "HEAD"].includes(req.method) || req.get("x-requested-with") === "fetch";
  const api = (handler) => async (req, res) => {
    if (!allowed(req)) return res.status(403).set("Cache-Control", "no-store").json({ ok: false, error: { code: "forbidden_local", message: "Réservé aux administrateurs de l'organisation." } });
    if (!sameOrigin(req)) return res.status(403).set("Cache-Control", "no-store").json({ ok: false, error: { code: "csrf", message: "Requête refusée : elle doit provenir de l'écran Mailchimp de Kolakisa." } });
    try { const data = await handler(req, ctxOf(req)); res.set("Cache-Control", "no-store").json({ ok: true, data: data === undefined ? null : data }); }
    catch (error) { fail(res, error); }
  };
  const P = "/mailchimp/api";
  const int = (v, d = 0) => (/^\d{1,9}$/.test(String(v ?? "")) ? Number(v) : d);

  // ----- Connexion et état -----
  router.get(`${P}/etat`, api((req, ctx) => ({ status: connection.status(ctx), sync: sync.state(ctx), webhookUrlAvailable: Boolean(connection.webhookUrl(ctx)) })));
  router.post(`${P}/connexion`, api(async (req, ctx) => ({ account: await connection.connect(ctx, req.body && req.body.apiKey), status: connection.status(ctx) })));
  router.delete(`${P}/connexion`, api((req, ctx) => { connection.disconnect(ctx); return { status: connection.status(ctx) }; }));
  router.post(`${P}/synchronisation/activer`, api((req, ctx) => { connection.setSyncEnabled(ctx, req.body && req.body.enabled !== false); return connection.status(ctx); }));
  router.post(`${P}/jeton-webhook/regenerer`, api((req, ctx) => { connection.rotateWebhookToken(ctx); return { webhookUrlAvailable: Boolean(connection.webhookUrl(ctx)) }; }));
  router.get(`${P}/journal-appels`, api((req, ctx) => connection.recentRequests(ctx, int(req.query.limit, 100))));

  // ----- Synchronisation (lancée en arrière-plan : la réponse est immédiate, l'état se lit par /etat) -----
  router.post(`${P}/sync`, api((req, ctx) => {
    if (sync.state(ctx).running) throw new MarketingError("already_running", "Une synchronisation est déjà en cours.");
    if (!connection.status(ctx).connected) throw new MarketingError("not_connected", "Mailchimp n'est pas connecté : enregistrez d'abord votre clé d'API.");
    sync.syncAll({ ...ctx, userId: null }, { full: Boolean(req.body && req.body.full) }).catch((e) => console.error("[KOLAKISA] Synchronisation Mailchimp :", e.message));
    return { started: true };
  }));
  router.get(`${P}/miroir/audiences`, api((req, ctx) => composite.dashboard(ctx, { live: false }).then((d) => d.audiences)));
  router.get(`${P}/miroir/campagnes`, api((req, ctx) => composite.dashboard(ctx, { live: false }).then((d) => d.recentCampaigns)));
  router.get(`${P}/tableau-de-bord`, api((req, ctx) => composite.dashboard(ctx, { live: req.query.live !== "0" })));

  // ----- Opérations composées -----
  router.post(`${P}/audiences/:listId/lier`, api((req, ctx) => sync.linkAudience(ctx, req.params.listId, { localListId: int(req.body && req.body.localListId, 0) || undefined, create: Boolean(req.body && req.body.create) })));
  router.post(`${P}/audiences/:listId/delier`, api((req, ctx) => sync.unlinkAudience(ctx, req.params.listId)));
  router.post(`${P}/audiences/:listId/import`, api((req, ctx) => composite.importMembers(ctx, req.params.listId, { rows: req.body && req.body.rows, attestConsent: req.body && req.body.attestConsent === true, updateExisting: Boolean(req.body && req.body.updateExisting), tags: Array.isArray(req.body && req.body.tags) ? req.body.tags : [] })));
  router.get(`${P}/audiences/:listId/export.csv`, async (req, res) => {
    if (!allowed(req)) return res.status(403).json({ ok: false, error: { code: "forbidden_local", message: "Réservé aux administrateurs de l'organisation." } });
    try {
      if (!/^[0-9a-f]{10}$/i.test(req.params.listId)) throw new MarketingError("invalid_request", "Identifiant d'audience invalide.");
      const out = await composite.exportMembers(ctxOf(req), req.params.listId, String(req.query.status || ""));
      res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="contacts-mailchimp-${req.params.listId}.csv"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }).send(out.csv);
    } catch (error) { fail(res, error); }
  });
  router.get(`${P}/audiences/:listId/membres/:hash/existe`, api((req, ctx) => composite.memberExists(ctx, req.params.listId, req.params.hash)));
  router.post(`${P}/audiences/:listId/webhooks/installer`, api((req, ctx) => inbound.install(ctx, req.params.listId)));
  router.post(`${P}/modeles/apercu`, api((req) => composite.renderTemplate(req.body && req.body.html, req.body && req.body.variables)));
  router.get(`${P}/rapports/:campaignId/rebonds`, api((req, ctx) => composite.bounces(ctx, req.params.campaignId)));
  router.post(`${P}/rapports/comparer`, api((req, ctx) => composite.compare(ctx, req.body && req.body.ids)));

  // ----- Centre de webhooks entrants -----
  router.get(`${P}/evenements`, api((req, ctx) => ({ events: inbound.list(ctx, { afterId: int(req.query.after), limit: int(req.query.limit, 50), type: String(req.query.type || ""), status: String(req.query.status || "") }), url: connection.webhookUrl(ctx) ? "configured" : null })));
  router.post(`${P}/evenements/:id/rejouer`, api((req, ctx) => inbound.replay(ctx, int(req.params.id))));
  router.get(`${P}/webhook-url`, api((req, ctx) => ({ url: connection.webhookUrl(ctx) })));

  // ----- Transactionnel (Mandrill) -----
  // La clé est vérifiée en direct (users/ping) avant d'être conservée ; une clé refusée ne remplace pas la précédente
  router.put(`${P}/transactionnel/cle`, api(async (req, ctx) => {
    const previous = connection.transactionalKey(ctx);
    const result = connection.saveTransactionalKey(ctx, req.body && req.body.key);
    if (!result.cleared) {
      try { await transactional.run(ctx, "users.ping", {}); }
      catch (error) { connection.saveTransactionalKey(ctx, previous || ""); throw error; }
    }
    return { ...result, status: connection.status(ctx) };
  }));
  router.post(`${P}/transactionnel/:op`, api((req, ctx) => transactional.run(ctx, req.params.op, req.body)));

  // ----- Opérations générées depuis le catalogue -----
  for (const op of OPS) {
    const route = `${P}${op.route}`;
    router[op.method.toLowerCase()](route, api((req, ctx) => operations.run(ctx, op.id, { params: req.params, query: req.query, body: req.body })));
  }
  router.get(`${P}/catalogue`, api(() => OPS.map(({ id, group, method, route, summary, priority, confirm }) => ({ id, group, method, route, summary, priority, confirm })) ));
  return router;
};
