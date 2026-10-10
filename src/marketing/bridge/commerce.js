// Commerce d'UN contact (palier 20) — LECTURE SEULE des commandes réelles du compte relié au contact (orders, order_items, order_refunds, tenus par la boutique).
// Le Contact Core ne copie rien : il référence. Pas de compte relié (contact sans compte) → null, jamais une valeur inventée.
// Les commandes ne portent pas de site : cette vue n'est donc pas proposée à une personne limitée à un site (voir web/admin.js).
function commerceOf(ctx, contact, { limit = 10 } = {}) {
  if (!contact || !Number.isInteger(contact.lms_user_id)) return null;
  const has = (t) => ctx.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(t);
  if (!has("orders")) return null;
  // Le compte doit toujours porter l'adresse du contact (les identifiants sont réutilisés après un « npm run seed »)
  const user = ctx.db.prepare("SELECT id, email FROM users WHERE id = ?").get(contact.lms_user_id);
  if (!user || String(user.email).trim().toLowerCase() !== contact.email) return null;
  const refunds = has("order_refunds");
  const orders = ctx.db.prepare(`SELECT o.id, o.total_cents, o.coupon_code, o.created_at${refunds ? ", (SELECT COALESCE(SUM(r.amount_cents), 0) FROM order_refunds r WHERE r.order_id = o.id)" : ", 0"} AS refunded_cents
    FROM orders o WHERE o.user_id = ? ORDER BY o.id DESC`).all(user.id);
  const titles = (id) => ctx.db.prepare("SELECT c.id, c.title FROM order_items i JOIN courses c ON c.id = i.course_id WHERE i.order_id = ? ORDER BY i.id LIMIT 10").all(id);
  const spent = orders.reduce((n, o) => n + o.total_cents, 0);
  const refunded = orders.reduce((n, o) => n + o.refunded_cents, 0);
  const abandoned = ctx.db.prepare("SELECT COUNT(*) n FROM mk_events WHERE organization_id = ? AND contact_id = ? AND name IN ('cart.abandoned', 'checkout.abandoned')").get(ctx.organizationId, contact.id).n;
  return {
    count: orders.length, spentCents: spent, refundedCents: refunded, netCents: spent - refunded, abandoned,
    first: orders.length ? orders[orders.length - 1].created_at : null, last: orders.length ? orders[0].created_at : null,
    recent: orders.slice(0, limit).map((o) => ({ ...o, products: titles(o.id) })),
  };
}

module.exports = { commerceOf };
