// Événements de la boutique vers le bus du module marketing : automatisations, webhooks sortants, journal d'événements.
// Une seule source : l'historique des commandes (addEvent) — chaque ligne d'historique pertinente émet son événement, avec une clé d'idempotence (pas de doublon si le même fait est rejoué).
// Aucun appel n'est bloquant : sans bus (tests unitaires) ou en cas d'erreur, rien n'est émis et la commande n'est jamais affectée.
// Noms (déclarés dans webhooks/catalog.js) : shop.order_created, shop.order_paid, shop.order_status_changed, shop.order_shipped, shop.order_cancelled, shop.refund_created, shop.customer_registered, shop.stock_low.
let bus = null;
const attach = (b) => { bus = b; };

const NAME_OF = { created: "shop.order_created", paid: "shop.order_paid" };
function emitSafe(args) {
  if (!bus) return;
  try { bus.emit({ source: "shop", objectType: "shop_order", ...args }); } catch (error) { console.error(`[KOLAKISA] Boutique : événement ${args.name} non émis : ${error.message}`); }
}

// Appelée par orders.addEvent (db = base, orderId, ev = ligne d'historique)
function fromOrderEvent(db, orderId, ev) {
  if (!bus) return;
  const o = db.prepare("SELECT id, organization_id, site_id, number, email, status, payment_status, payment_method, currency, total_cents, tax_cents, shipping_cents, discount_cents, coupon_code FROM mk_shop_orders WHERE id = ?").get(orderId);
  if (!o) return;
  const base = { organizationId: o.organization_id, siteId: o.site_id ?? null, email: o.email, objectId: o.id };
  const meta = { orderId: o.id, number: o.number, status: o.status, paymentStatus: o.payment_status, paymentMethod: o.payment_method, currency: o.currency, totalCents: o.total_cents, taxCents: o.tax_cents, shippingCents: o.shipping_cents, discountCents: o.discount_cents, coupon: o.coupon_code || null };
  const names = [];
  if (NAME_OF[ev.kind]) names.push([NAME_OF[ev.kind], ev.kind]);
  else if (ev.kind === "status" && ev.to) {
    names.push(["shop.order_status_changed", `status:${ev.to}`]);
    if (ev.to === "shipped") names.push(["shop.order_shipped", "shipped"]);
    if (ev.to === "cancelled") names.push(["shop.order_cancelled", "cancelled"]);
    if (ev.to === "refunded") names.push(["shop.refund_created", "refunded"]);
  } else if (ev.kind === "refund_partial") names.push(["shop.refund_created", `partial:${Date.now()}`]);
  for (const [name, key] of names) emitSafe({ ...base, name, metadata: { ...meta, from: ev.from || null, to: ev.to || null }, idempotencyKey: `shop:${o.id}:${key}` });
}

function customerRegistered(s, customerId, email) {
  if (!bus) return;
  emitSafe({ organizationId: s.organizationId, siteId: s.siteId ?? null, name: "shop.customer_registered", email, objectType: "shop_customer", objectId: customerId, metadata: { customerId }, idempotencyKey: `shop:customer:${customerId}` });
}
function stockLow(s, productId, name, qty, threshold) {
  if (!bus) return;
  emitSafe({ organizationId: s.organizationId, siteId: s.siteId ?? null, name: "shop.stock_low", objectType: "shop_product", objectId: productId, metadata: { productId, name, stock: qty, threshold }, idempotencyKey: `shop:stock_low:${productId}:${qty}` });
}
function cartAbandoned(s, cartId, email, info) {
  if (!bus) return;
  emitSafe({ organizationId: s.organizationId, siteId: s.siteId ?? null, name: "shop.cart_abandoned", email: email || undefined, objectType: "shop_cart", objectId: cartId, metadata: { cartId, items: info.items, products: info.names }, idempotencyKey: `shop:cart:${cartId}:${Date.now() > 0 ? Math.floor(Date.now() / 86400000) : 0}` });
}
module.exports = { attach, fromOrderEvent, customerRegistered, stockLow, cartAbandoned };
