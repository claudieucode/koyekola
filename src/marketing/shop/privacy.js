// Données personnelles d'un client de la boutique : export (droit d'accès / portabilité) et effacement (droit à l'effacement).
//  · Export : tout ce que la boutique de CE site détient sur ce client, en JSON (jamais le mot de passe ni les jetons).
//  · Effacement : le compte est anonymisé de façon irréversible ; les listes, paniers, avis et rendez-vous perdent leurs données personnelles.
//    Les COMMANDES et FACTURES sont CONSERVÉES telles quelles : une obligation légale de conservation comptable s'applique (en France : 10 ans) ; elles ne sont plus rattachées à un compte.
//  · Refusé tant que des commandes sont en cours ou qu'un abonnement est actif (il faut d'abord les terminer ou les annuler).
const { transaction } = require("../db/tx");
const { MarketingError } = require("../errors");
const siteCond = (s, a = "") => (s.siteId == null ? `${a}site_id IS NULL` : `${a}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const parse = (v, f) => { try { return JSON.parse(v); } catch { return f; } };

function customerOf(s, id) {
  return s.db.prepare(`SELECT * FROM mk_shop_customers WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(id), s.organizationId, ...siteArgs(s)) || null;
}
const has = (s, t) => Boolean(s.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(t));

function exportData(s, customerId) {
  const c = customerOf(s, customerId);
  if (!c) throw new MarketingError("not_found", "Client introuvable.");
  const orders = s.db.prepare("SELECT * FROM mk_shop_orders WHERE customer_id = ? ORDER BY id").all(c.id).map((o) => ({
    number: o.number, created_at: o.created_at, status: o.status, payment_status: o.payment_status, payment_method: o.payment_method, currency: o.currency, subtotal_cents: o.subtotal_cents, discount_cents: o.discount_cents, shipping_cents: o.shipping_cents, tax_cents: o.tax_cents, total_cents: o.total_cents,
    email: o.email, billing_address: parse(o.billing_address, {}), shipping_address: parse(o.shipping_address, {}), tracking_number: o.tracking_number,
    items: s.db.prepare("SELECT name, variant_label, sku, quantity, unit_price_cents FROM mk_shop_order_items WHERE order_id = ?").all(o.id),
  }));
  const out = {
    exported_at: new Date().toISOString(), scope: "Boutique de ce site uniquement",
    customer: { email: c.email, name: c.name, phone: c.phone, status: c.status, created_at: c.created_at, marketing_opt_in: c.marketing_opt_in === 1, has_account: Boolean(c.password_hash), addresses: parse(c.addresses, []) },
    orders,
    reviews: has(s, "mk_shop_reviews") ? s.db.prepare(`SELECT product_id, rating, title, body, status, created_at FROM mk_shop_reviews WHERE customer_email = ? AND organization_id = ? AND ${siteCond(s)}`).all(c.email, s.organizationId, ...siteArgs(s)) : [],
    appointments: has(s, "mk_shop_appointments") ? s.db.prepare(`SELECT start_at, end_at, customer_name, customer_phone, note, status FROM mk_shop_appointments WHERE customer_email = ? AND organization_id = ? AND ${siteCond(s)}`).all(c.email, s.organizationId, ...siteArgs(s)) : [],
    gift_lists: has(s, "mk_shop_gift_lists") ? s.db.prepare("SELECT title, message, event_date, status, created_at FROM mk_shop_gift_lists WHERE customer_id = ?").all(c.id) : [],
    subscriptions: has(s, "mk_shop_subscriptions") ? s.db.prepare("SELECT status, created_at FROM mk_shop_subscriptions WHERE customer_id = ?").all(c.id) : [],
    notifications: s.db.prepare("SELECT event, status, created_at FROM mk_shop_notifications WHERE recipient = ? AND organization_id = ?").all(c.email, s.organizationId),
  };
  return out;
}

function erase(s, customerId, { actor = "customer" } = {}) {
  const c = customerOf(s, customerId);
  if (!c) throw new MarketingError("not_found", "Client introuvable.");
  if (/^effac[ée]-\d+@/.test(c.email)) return { already: true };
  const open = s.db.prepare("SELECT COUNT(*) n FROM mk_shop_orders WHERE customer_id = ? AND status IN ('pending','paid','processing','shipped')").get(c.id).n;
  if (open) throw new MarketingError("invalid_state", "Des commandes sont encore en cours : l'effacement sera possible une fois qu'elles seront terminées ou annulées.");
  if (has(s, "mk_shop_subscriptions")) {
    const sub = s.db.prepare("SELECT COUNT(*) n FROM mk_shop_subscriptions WHERE customer_id = ? AND status IN ('active','trialing','past_due','pending')").get(c.id).n;
    if (sub) throw new MarketingError("invalid_state", "Un abonnement est encore actif : annulez-le d'abord.");
  }
  const anon = `effacé-${c.id}@invalide.local`;
  transaction(s.db, () => {
    const oldEmail = c.email;
    if (has(s, "mk_shop_reviews")) s.db.prepare(`UPDATE mk_shop_reviews SET customer_email = ?, author_name = 'Client supprimé' WHERE customer_email = ? AND organization_id = ? AND ${siteCond(s)}`).run(anon, oldEmail, s.organizationId, ...siteArgs(s));
    if (has(s, "mk_shop_appointments")) s.db.prepare(`UPDATE mk_shop_appointments SET customer_email = ?, customer_name = 'Client supprimé', customer_phone = NULL, note = NULL WHERE customer_email = ? AND organization_id = ? AND ${siteCond(s)}`).run(anon, oldEmail, s.organizationId, ...siteArgs(s));
    if (has(s, "mk_shop_gift_lists")) s.db.prepare("UPDATE mk_shop_gift_lists SET owner_name = NULL, owner_email = NULL, customer_id = NULL, status = 'closed' WHERE customer_id = ?").run(c.id);
    if (has(s, "mk_shop_wishlists")) s.db.prepare("DELETE FROM mk_shop_wishlists WHERE customer_id = ?").run(c.id);
    s.db.prepare("DELETE FROM mk_shop_carts WHERE customer_id = ?").run(c.id);
    s.db.prepare("DELETE FROM mk_shop_customer_tokens WHERE customer_id = ?").run(c.id);
    s.db.prepare("UPDATE mk_shop_notifications SET recipient = ? WHERE recipient = ? AND organization_id = ?").run(anon, oldEmail, s.organizationId);
    s.db.prepare("UPDATE mk_shop_customers SET email = ?, name = NULL, phone = NULL, addresses = '[]', password_hash = NULL, status = 'disabled', marketing_opt_in = 0, tax_exempt = 0, updated_at = datetime('now') WHERE id = ?").run(anon, c.id);
    s.db.prepare("INSERT INTO mk_shop_order_events (order_id, kind, actor, note) SELECT id, 'privacy_erased', ?, 'Compte client effacé à la demande de la personne (commande conservée : obligation comptable)' FROM mk_shop_orders WHERE customer_id = ?").run(actor, c.id);
  });
  return { erased: true };
}
module.exports = { exportData, erase };
