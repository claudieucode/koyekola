// R7 (lot 5) — File de demandes de rattachement de contacts entre sites (décision produit du 17/10/2026, option 1).
// Un membre limité à un site (web) ou une clé d'API de site qui « crée » une adresse déjà connue d'un AUTRE site n'obtient ni fiche, ni confirmation, ni indice : la réponse visible est
// celle d'une création. Une demande est mise en file ; l'équipe (permission dédiée `contacts.requests`) l'accepte — rattachement en LECTURE SEULE du site demandeur — ou la refuse.
// Le demandeur ne voit que « en attente » ou « traitée » (jamais l'identité, le site d'origine, les propriétés ni le consentement du contact). Aucune fusion ici.
const { MarketingError } = require("../errors");
const { transaction } = require("../db/tx");
const { recordAudit } = require("../audit");
const { createRateLimiter } = require("../../middlewares/security");
const siteAccess = require("./siteAccess");
const contacts = require("../audience/contacts");
const { validateEmail } = require("../audience/email");

const PER_HOUR = Math.max(1, Number(process.env.CONTACT_REQUESTS_PER_HOUR) || 60); // tentatives de création par site et par heure (nouvelles adresses COMPRISES : la limite ne trahit rien)
const PENDING_CAP = 100; // demandes en attente par site : au-delà, la demande n'est plus mise en file (même réponse visible), la tentative est journalisée pour l'équipe
let limiter = createRateLimiter(PER_HOUR, 60 * 60 * 1000);
const key = (ctx) => `${ctx.organizationId}:${ctx.siteScope}`;

// Limite de débit par site : appelée AVANT toute création par un accès limité. Même refus quel que soit le résultat de la création (aucune information).
function guard(ctx) {
  if (!Number.isInteger(ctx.siteScope)) return;
  if (limiter.isLimited(key(ctx))) throw new MarketingError("rate_limited", "Trop de tentatives pour ce site : réessayez dans un moment.");
  limiter.hit(key(ctx));
}
const _resetLimiterForTests = (max = PER_HOUR) => { limiter = createRateLimiter(max, 60 * 60 * 1000); };

// Journal : événements d'ORGANISATION (sans site) — le demandeur, même administrateur de son site, ne lit pas la décision (seulement « en attente » / « traitée »)
const trace = (ctx, action, id, metadata) => { try { recordAudit(ctx.db, { organizationId: ctx.organizationId, userId: ctx.userId ?? null, action, resourceType: "contact_request", resourceId: id, metadata }); } catch { /* la trace ne bloque jamais */ } };

// Met en file la demande d'une adresse connue hors du périmètre du site. Ne fait rien pour une adresse inconnue (déjà créée) ou déjà lisible par le site.
function enqueue(ctx, { email, source = "admin", keyId = null } = {}) {
  if (!Number.isInteger(ctx.siteScope)) return { queued: false };
  const check = validateEmail(email);
  if (!check.ok) return { queued: false };
  const contact = contacts.findByEmail(ctx, check.email);
  if (!contact || siteAccess.canRead(ctx, contact)) return { queued: false };
  if (!["admin", "api"].includes(source)) source = "admin";
  const pending = ctx.db.prepare("SELECT COUNT(*) n FROM mk_contact_requests WHERE organization_id = ? AND site_id = ? AND status = 'pending'").get(ctx.organizationId, ctx.siteScope).n;
  if (pending >= PENDING_CAP) { trace(ctx, "contact_request.dropped", null, { siteId: ctx.siteScope, reason: "file pleine" }); return { queued: false, dropped: true }; }
  const info = ctx.db.prepare("INSERT OR IGNORE INTO mk_contact_requests (organization_id, site_id, email, source, requested_by) VALUES (?, ?, ?, ?, ?)")
    .run(ctx.organizationId, ctx.siteScope, check.email, source, source === "admin" ? ctx.userId ?? null : null);
  if (info.changes) trace(ctx, "contact_request.created", Number(info.lastInsertRowid), { siteId: ctx.siteScope, source, ...(keyId ? { keyId } : {}) });
  return { queued: Boolean(info.changes) };
}

// Le demandeur : les demandes de SON site, états « pending » / « treated » seulement
function listMine(ctx, { limit = 100 } = {}) {
  if (!Number.isInteger(ctx.siteScope)) return [];
  return ctx.db.prepare("SELECT id, email, status, created_at FROM mk_contact_requests WHERE organization_id = ? AND site_id = ? ORDER BY id DESC LIMIT ?")
    .all(ctx.organizationId, ctx.siteScope, Math.min(Math.max(Number(limit) || 100, 1), 200))
    .map((r) => ({ id: r.id, email: r.email, state: r.status === "pending" ? "pending" : "treated", createdAt: r.created_at }));
}

// L'équipe : demandes en attente avec un résumé du contact existant et de son origine (réservé à l'équipe de l'organisation)
function listPending(ctx, { limit = 100 } = {}) {
  siteAccess.assertTeam(ctx, "Le traitement des demandes de rattachement");
  return ctx.db.prepare(`SELECT r.id, r.email, r.created_at, r.source, s.name AS site_name, c.id AS contact_id, c.first_name, c.last_name, c.company, o.name AS origin_name
      FROM mk_contact_requests r JOIN mk_sites s ON s.id = r.site_id
      LEFT JOIN mk_contacts c ON c.organization_id = r.organization_id AND c.email = r.email
      LEFT JOIN mk_sites o ON o.id = c.origin_site_id
      WHERE r.organization_id = ? AND r.status = 'pending' ORDER BY r.id LIMIT ?`).all(ctx.organizationId, Math.min(Math.max(Number(limit) || 100, 1), 200));
}

// Décision de l'équipe. Une seule décision par demande (transition atomique depuis « en attente ») ; accepter = lien de LECTURE SEULE (« activity ») pour le site demandeur,
// jamais d'écriture ni de modification du contact, de ses données ou de ses consentements ; refuser ne touche pas le contact.
function decide(ctx, id, decision, { note = "" } = {}) {
  siteAccess.assertTeam(ctx, "Le traitement des demandes de rattachement");
  if (!["accept", "refuse"].includes(decision)) throw new MarketingError("invalid_field", "Décision inconnue.");
  const cleanNote = String(note || "").slice(0, 300);
  return transaction(ctx.db, () => {
    const req = ctx.db.prepare("SELECT * FROM mk_contact_requests WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);
    if (!req) throw new MarketingError("not_found", "Demande introuvable.");
    if (req.status !== "pending") throw new MarketingError("invalid_state", "Cette demande a déjà été traitée.");
    const contact = contacts.findByEmail(ctx, req.email);
    let status = decision === "accept" ? "accepted" : "refused", reason = cleanNote;
    if (status === "accepted" && !contact) { status = "refused"; reason = reason || "contact introuvable au moment de la décision"; }
    const claimed = ctx.db.prepare("UPDATE mk_contact_requests SET status = ?, contact_id = ?, decided_by = ?, decided_at = datetime('now'), note = ? WHERE id = ? AND status = 'pending'")
      .run(status, contact ? contact.id : null, ctx.userId ?? null, reason, id).changes;
    if (!claimed) throw new MarketingError("invalid_state", "Cette demande a déjà été traitée.");
    if (status === "accepted") {
      ctx.db.prepare("INSERT OR IGNORE INTO mk_contact_sites (contact_id, site_id, organization_id, link) VALUES (?, ?, ?, 'activity')").run(contact.id, req.site_id, ctx.organizationId);
      trace(ctx, "contact_request.accepted", id, { siteId: req.site_id, contactId: contact.id, readOnly: true });
    } else trace(ctx, "contact_request.refused", id, { siteId: req.site_id, contactId: contact ? contact.id : null, note: reason });
    return { status };
  });
}
module.exports = { guard, enqueue, listMine, listPending, decide, PER_HOUR, PENDING_CAP, _resetLimiterForTests };
