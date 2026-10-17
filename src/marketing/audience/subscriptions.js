// Abonnements par AUDIENCE (liste) — palier 16. Contact ≠ abonnement : un même contact peut être « abonné » à une audience et « désabonné » d'une autre.
// Aucune table de plus : l'état est DÉRIVÉ des sources de vérité existantes (Contact Core : fiche, consentements ; conformité : désinscriptions,
// liste de suppression ; appartenance à la liste), donc jamais contradictoire. Règle unique d'envoi : compliance/sendable.js — un test vérifie que
// « abonné » ⇔ « joignable pour cette audience ».
//   suppressed   : adresse protégée (rebond permanent, plainte, blocage manuel, effacement) ou fiche archivée/inactive/fusionnée → jamais de marketing
//   unsubscribed : désinscrit de toutes les communications ou de cette audience
//   subscribed   : consentement prouvé et actif
//   pending      : membre sans consentement prouvé (ex. importé, ajouté à la main, double confirmation non faite)
//   not_member   : pas dans l'audience
const { checkCtx, siteSql, MarketingError } = require("./shared");
const { getList } = require("./lists");

const STATES = Object.freeze({ subscribed: "Abonné", pending: "En attente de consentement", unsubscribed: "Désabonné", suppressed: "Protégé (aucun envoi)" });

// Expression SQL de l'état d'un membre (alias c = fiche du contact, m = ligne d'appartenance à la liste)
const STATE_SQL = `CASE
  WHEN c.record_status <> 'active' OR c.status IN ('bounced', 'complained', 'suppressed')
    OR EXISTS (SELECT 1 FROM mk_suppressions s WHERE s.organization_id = c.organization_id AND s.email = c.email) THEN 'suppressed'
  WHEN c.status = 'unsubscribed'
    OR EXISTS (SELECT 1 FROM mk_unsubscribes u WHERE u.contact_id = c.id AND u.organization_id = c.organization_id AND (u.scope = 'all' OR (u.scope = 'list' AND u.list_id = m.list_id))) THEN 'unsubscribed'
  WHEN c.status = 'subscribed'
    AND (SELECT k.action FROM mk_consents k WHERE k.contact_id = c.id AND k.organization_id = c.organization_id AND k.purpose = 'marketing' ORDER BY k.id DESC LIMIT 1) = 'granted' THEN 'subscribed'
  ELSE 'pending' END`;

function requireAudience(ctx, listId) {
  checkCtx(ctx);
  const list = Number.isInteger(listId) ? getList(ctx, listId) : null;
  if (!list) throw new MarketingError("not_found", "Audience introuvable.");
  return list;
}

function subscriptionState(ctx, listId, contactId) {
  requireAudience(ctx, listId);
  const row = ctx.db
    .prepare(`SELECT ${STATE_SQL} AS state FROM mk_list_members m JOIN mk_contacts c ON c.id = m.contact_id WHERE m.list_id = ? AND m.contact_id = ? AND m.organization_id = ?`)
    .get(listId, contactId, ctx.organizationId);
  return row ? row.state : "not_member";
}

// Effectif de chaque état (une seule requête, sans charger les membres)
function stateCounts(ctx, listId) {
  requireAudience(ctx, listId);
  const counts = { subscribed: 0, pending: 0, unsubscribed: 0, suppressed: 0, total: 0 };
  for (const r of ctx.db.prepare(`SELECT ${STATE_SQL} AS state, COUNT(*) n FROM mk_list_members m JOIN mk_contacts c ON c.id = m.contact_id WHERE m.list_id = ? AND m.organization_id = ? GROUP BY state`).all(listId, ctx.organizationId)) {
    counts[r.state] = r.n;
    counts.total += r.n;
  }
  return counts;
}

// Membres d'une audience avec leur état, paginés par curseur ; `state` filtre (valeur inconnue → erreur nette)
function listSubscribers(ctx, listId, { state, limit = 50, afterId } = {}) {
  requireAudience(ctx, listId);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw new MarketingError("invalid_field", "Limite invalide (entre 1 et 200).");
  if (state !== undefined && state !== "" && !Object.hasOwn(STATES, state)) throw new MarketingError("invalid_field", "État d'abonnement inconnu.");
  const filter = state ? ` AND (${STATE_SQL}) = ?` : "";
  const rows = ctx.db
    .prepare(`SELECT c.*, (${STATE_SQL}) AS subscription_state FROM mk_list_members m JOIN mk_contacts c ON c.id = m.contact_id WHERE m.list_id = ? AND m.organization_id = ? AND c.id > ?${filter} ORDER BY c.id LIMIT ?`)
    .all(listId, ctx.organizationId, afterId ? Number(afterId) : 0, ...(state ? [state] : []), limit + 1);
  const more = rows.length > limit;
  const page = more ? rows.slice(0, limit) : rows;
  return { rows: page, nextAfterId: more ? page[page.length - 1].id : null };
}

// Toutes les audiences d'un contact avec son état dans chacune (fiche contact)
function subscriptionsOf(ctx, contactId) {
  checkCtx(ctx);
  const site = siteSql({ ...ctx, siteFilter: undefined }, "l"); // accès limité à un site : seulement les audiences de CE site
  return ctx.db
    .prepare(`SELECT l.id AS list_id, l.name, l.site_id, ${STATE_SQL} AS state FROM mk_list_members m JOIN mk_lists l ON l.id = m.list_id JOIN mk_contacts c ON c.id = m.contact_id
              WHERE m.contact_id = ? AND m.organization_id = ? AND ${site.sql} ORDER BY l.name COLLATE NOCASE`)
    .all(contactId, ctx.organizationId, ...site.params);
}

module.exports = { STATES, subscriptionState, stateCounts, listSubscribers, subscriptionsOf };
