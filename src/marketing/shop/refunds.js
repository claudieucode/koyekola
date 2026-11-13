// Remboursements de la boutique : réels (appel au fournisseur de paiement), totaux ou partiels, avec remise en stock facultative.
//  - Le montant remboursable est réservé EN TRANSACTION avant tout appel externe : deux demandes simultanées ne peuvent jamais dépasser le total encaissé.
//  - Une clé d'idempotence (une par demande) évite un double remboursement si l'administrateur clique deux fois ou si la requête est rejouée ; elle est aussi transmise à Stripe.
//  - Paiement manuel (virement…) : le remboursement est enregistré (l'argent est rendu hors plateforme), sans appel externe.
//  - Si le fournisseur refuse, la ligne passe « failed » : le montant redevient remboursable et la commande n'est pas modifiée.
const crypto = require("node:crypto");
const gateway = require("../../services/payments");
const { MarketingError } = require("../errors");
const { transaction } = require("../db/tx");
const orders = require("./orders");
const giftLists = require("./giftLists");

const REFUNDABLE = ["paid", "processing", "shipped", "completed"];
const siteCond = (s) => (s.siteId == null ? "site_id IS NULL" : "site_id = ?");
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);

// Somme déjà remboursée ou en cours de remboursement
function committedCents(db, orderId) {
  return db.prepare("SELECT COALESCE(SUM(amount_cents), 0) AS n FROM mk_shop_refunds WHERE order_id = ? AND status IN ('pending','succeeded')").get(orderId).n;
}
function listRefunds(s, orderId) {
  return s.db.prepare("SELECT * FROM mk_shop_refunds WHERE order_id = ? AND organization_id = ? AND " + siteCond(s) + " ORDER BY id").all(orderId, s.organizationId, ...siteArgs(s));
}
// Montant d'une sélection d'articles : prix de la ligne, remise et taxe, au prorata des unités remboursées (arrondi au centime, jamais au-delà de la ligne)
function itemsAmount(db, orderId, selection) {
  const lines = db.prepare("SELECT * FROM mk_shop_order_items WHERE order_id = ?").all(orderId);
  const byId = new Map(lines.map((l) => [l.id, l]));
  const alreadyQty = new Map();
  for (const r of db.prepare("SELECT items FROM mk_shop_refunds WHERE order_id = ? AND status IN ('pending','succeeded')").all(orderId)) {
    try { for (const it of JSON.parse(r.items)) alreadyQty.set(it.order_item_id, (alreadyQty.get(it.order_item_id) || 0) + it.quantity); } catch { /* ligne ancienne */ }
  }
  let total = 0; const clear = [];
  for (const sel of selection) {
    const l = byId.get(Number(sel.order_item_id));
    const q = Math.floor(Number(sel.quantity));
    if (!l || !(q >= 1)) continue;
    const left = l.quantity - (alreadyQty.get(l.id) || 0);
    if (q > left) throw new MarketingError("invalid_field", `« ${l.name} » : seules ${left} unité(s) restent remboursables.`);
    const lineTotal = l.line_subtotal_cents - l.discount_cents + l.tax_cents;
    total += Math.round((lineTotal * q) / l.quantity);
    clear.push({ order_item_id: l.id, quantity: q });
  }
  return { total, items: clear };
}
function restockItems(s, order, items) {
  for (const it of items) {
    const l = s.db.prepare("SELECT * FROM mk_shop_order_items WHERE id = ? AND order_id = ?").get(it.order_item_id, order.id);
    if (!l || !l.product_id) continue;
    const table = l.variant_id ? "mk_shop_variants" : "mk_shop_products";
    const id = l.variant_id || l.product_id;
    const r = s.db.prepare(`UPDATE ${table} SET stock_qty = stock_qty + ? WHERE id = ? AND manage_stock = 1`).run(it.quantity, id);
    if (r.changes) s.db.prepare("INSERT INTO mk_shop_stock_movements (organization_id, site_id, product_id, variant_id, delta, reason, order_id) VALUES (?,?,?,?,?, 'refund', ?)").run(s.organizationId, s.siteId ?? null, l.product_id, l.variant_id || null, it.quantity, order.id);
  }
}

// → { refund, order, full }. amountCents facultatif : sinon le montant de la sélection d'articles ; sinon (aucun des deux) tout le reste remboursable.
async function create(s, orderId, { amountCents = null, items = [], restock = false, reason = "", actor = "admin", idempotencyKey = null, shippingToo = false } = {}) {
  const order = orders.getOrder(s, orderId);
  if (!order) throw new MarketingError("not_found", "Commande introuvable.");
  if (!REFUNDABLE.includes(order.status) || order.payment_status !== "paid") throw new MarketingError("invalid_transition", "Seule une commande payée peut être remboursée.");
  const key = clean(idempotencyKey, 80) || crypto.randomBytes(12).toString("hex");
  const dup = s.db.prepare("SELECT * FROM mk_shop_refunds WHERE order_id = ? AND idempotency_key = ?").get(order.id, key);
  if (dup) return { refund: dup, order: orders.getOrder(s, order.id), full: order.status === "refunded", duplicate: true };

  const reserved = transaction(s.db, () => {
    const committed = committedCents(s.db, order.id);
    const left = order.total_cents - committed;
    const sel = Array.isArray(items) && items.length ? itemsAmount(s.db, order.id, items) : { total: 0, items: [] };
    let amount = amountCents != null && amountCents !== "" ? Math.round(Number(amountCents)) : sel.total + (shippingToo ? order.shipping_cents : 0);
    if (!Number.isFinite(amount) || amountCents == null && !sel.items.length && !shippingToo) amount = left; // « tout rembourser »
    if (!(amount > 0)) throw new MarketingError("invalid_field", "Indiquez un montant ou des articles à rembourser.");
    if (amount > left) throw new MarketingError("invalid_field", `Montant trop élevé : il reste ${(left / 100).toFixed(2)} ${order.currency.toUpperCase()} remboursable(s).`);
    const provider = order.payment_method === "stripe" ? "stripe" : require("./gateways").adapterFor(order.payment_method) ? order.payment_method : "manual";
    const info = s.db.prepare("INSERT INTO mk_shop_refunds (organization_id, site_id, order_id, amount_cents, currency, reason, restock, items, provider, status, idempotency_key, actor) VALUES (?,?,?,?,?,?,?,?,?, 'pending', ?, ?)")
      .run(s.organizationId, s.siteId ?? null, order.id, amount, order.currency, clean(reason, 300) || null, restock ? 1 : 0, JSON.stringify(sel.items), provider, key, clean(actor, 80));
    return { id: Number(info.lastInsertRowid), amount, provider, items: sel.items };
  });

  let providerRef = null;
  if (reserved.provider === "stripe") {
    try {
      const pay = s.db.prepare("SELECT * FROM mk_shop_payments WHERE order_id = ? AND provider = 'stripe' AND status = 'succeeded' AND provider_ref IS NOT NULL ORDER BY id DESC").get(order.id);
      if (!pay) throw new Error("aucun paiement Stripe confirmé pour cette commande");
      const stripeKey = require("./gateways").stripeKeyFor(s);
      const session = await gateway.retrieveStripeSession(pay.provider_ref, stripeKey);
      const intent = session && (typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent && session.payment_intent.id);
      if (!intent) throw new Error("paiement introuvable chez Stripe");
      const r = await gateway.stripeRequest("POST", "/v1/refunds", { payment_intent: intent, amount: reserved.amount, "metadata[order]": order.number, "metadata[refund]": String(reserved.id) }, { "Idempotency-Key": `kw-refund-${s.organizationId}-${reserved.id}` }, stripeKey);
      providerRef = r && r.id;
      if (!providerRef) throw new Error("réponse sans identifiant de remboursement");
    } catch (error) {
      console.error(`[KOLAKISA] Boutique : remboursement ${order.number} refusé : ${error.message}`);
      s.db.prepare("UPDATE mk_shop_refunds SET status = 'failed', failure_reason = ?, updated_at = datetime('now') WHERE id = ?").run(clean(error.message, 300), reserved.id);
      orders.addEvent(s.db, order.id, { kind: "refund_failed", actor, note: "Remboursement refusé par le fournisseur de paiement : rien n'a été rendu." });
      throw new MarketingError("payment_unavailable", "Le fournisseur de paiement n'a pas pu effectuer le remboursement. Rien n'a été remboursé : vous pouvez réessayer.");
    }
  }
  if (reserved.provider !== "stripe" && reserved.provider !== "manual") {
    // PayPal, Flutterwave : remboursement par l'API du fournisseur ; refus → rien n'est rendu et la commande reste intacte
    try {
      const gw = require("./gateways"); const adapter = gw.adapterFor(reserved.provider); const creds = gw.getCreds(s, reserved.provider);
      const pay = s.db.prepare("SELECT * FROM mk_shop_payments WHERE order_id = ? AND provider = ? AND status = 'succeeded' ORDER BY id DESC").get(order.id, reserved.provider);
      if (!adapter || !creds || !pay || !pay.provider_intent) throw new Error("paiement introuvable pour ce fournisseur");
      const r = await adapter.refund(order, pay, reserved.amount, creds, `kw-refund-${s.organizationId}-${reserved.id}`);
      providerRef = r && r.ref;
      if (!providerRef) throw new Error("réponse sans identifiant de remboursement");
    } catch (error) {
      console.error(`[KOLAKISA] Boutique : remboursement ${order.number} refusé : ${error.message}`);
      s.db.prepare("UPDATE mk_shop_refunds SET status = 'failed', failure_reason = ?, updated_at = datetime('now') WHERE id = ?").run(clean(error.message, 300), reserved.id);
      orders.addEvent(s.db, order.id, { kind: "refund_failed", actor, note: "Remboursement refusé par le fournisseur de paiement : rien n'a été rendu." });
      throw new MarketingError("payment_unavailable", "Le fournisseur de paiement n'a pas pu effectuer le remboursement. Rien n'a été remboursé : vous pouvez réessayer.");
    }
  }
  return transaction(s.db, () => {
    s.db.prepare("UPDATE mk_shop_refunds SET status = 'succeeded', provider_ref = ?, updated_at = datetime('now') WHERE id = ?").run(providerRef, reserved.id);
    const fullNow = committedCents(s.db, order.id) >= order.total_cents;
    // Remboursement qui solde la commande sans choix d'articles : on remet en stock ce qui ne l'a pas déjà été par un remboursement précédent
    let allItems = reserved.items;
    if (restock && !reserved.items.length && fullNow) {
      const done = new Map();
      for (const r of s.db.prepare("SELECT items FROM mk_shop_refunds WHERE order_id = ? AND status = 'succeeded' AND restock = 1 AND id <> ?").all(order.id, reserved.id)) {
        try { for (const it of JSON.parse(r.items)) done.set(it.order_item_id, (done.get(it.order_item_id) || 0) + it.quantity); } catch { /* ancienne ligne */ }
      }
      allItems = s.db.prepare("SELECT id AS order_item_id, quantity FROM mk_shop_order_items WHERE order_id = ?").all(order.id)
        .map((l) => ({ order_item_id: l.order_item_id, quantity: l.quantity - (done.get(l.order_item_id) || 0) })).filter((l) => l.quantity > 0);
    }
    if (restock) restockItems(s, order, allItems);
    if (fullNow) {
      s.db.prepare("UPDATE mk_shop_orders SET status = 'refunded', payment_status = 'refunded', updated_at = datetime('now') WHERE id = ?").run(order.id);
      s.db.prepare("UPDATE mk_shop_payments SET status = 'refunded', updated_at = datetime('now') WHERE order_id = ? AND status = 'succeeded'").run(order.id);
      giftLists.onRefunded(s, order.id);
      require("./downloads").revokeForOrder(s.db, order.id); // remboursement total : plus de téléchargement
    }
    orders.addEvent(s.db, order.id, { kind: fullNow ? "status" : "refund_partial", from: fullNow ? order.status : null, to: fullNow ? "refunded" : null, actor, note: `Remboursement de ${(reserved.amount / 100).toFixed(2)} ${order.currency.toUpperCase()}${reserved.provider === "stripe" ? " effectué par Stripe" : " enregistré (à rendre au client hors plateforme)"}${restock ? ", articles remis en stock" : ""}${reason ? " — " + clean(reason, 200) : ""}.` });
    require("./invoices").sync(s, order.id); // avoir numéroté pour ce remboursement (ne lève jamais)
    return { refund: s.db.prepare("SELECT * FROM mk_shop_refunds WHERE id = ?").get(reserved.id), order: orders.getOrder(s, order.id), full: fullNow };
  });
}

module.exports = { create, listRefunds, committedCents, itemsAmount, REFUNDABLE };
