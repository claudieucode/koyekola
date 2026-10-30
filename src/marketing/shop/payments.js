// Programme 20.5 — Passerelles de paiement de la boutique, derrière une interface unique (le moteur de commandes ne connaît aucun fournisseur).
//  - stripe : Stripe Checkout hébergé (aucune donnée de carte chez nous). Clés SERVEUR uniquement (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) : sans elles la méthode est « à configurer ».
//  - manual : virement / paiement à la livraison. La commande reste « en attente » jusqu'à confirmation par un administrateur autorisé (shop.payments).
// Une page de succès n'est JAMAIS une preuve de paiement : seuls un webhook signé ou la relecture de la session auprès du fournisseur confirment.
const gateway = require("../../services/payments");
const { MarketingError } = require("../errors");
const orders = require("./orders");
const { transaction } = require("../db/tx");

const PROVIDERS = Object.freeze({
  stripe: { label: "Carte bancaire (Stripe)", configured: () => gateway.stripeEnabled() && Boolean(process.env.STRIPE_WEBHOOK_SECRET) },
  manual: { label: "Paiement manuel (virement, à la livraison)", configured: () => true },
});
const available = (settings) => settings.payment_methods.filter((m) => PROVIDERS[m] && PROVIDERS[m].configured());
const status = (settings) => Object.entries(PROVIDERS).map(([key, p]) => ({ key, label: p.label, enabled: settings.payment_methods.includes(key), configured: p.configured() }));

// Démarre le paiement d'une commande déjà créée. → { kind: "paid" | "redirect" | "manual", url?, instructions? }
async function start(s, order, { settings, successUrl, cancelUrl }) {
  if (order.total_cents === 0) {
    orders.markPaid(s, order.id, { provider: "free", providerRef: null, amountCents: 0, currency: order.currency, actor: "system" });
    return { kind: "paid" };
  }
  if (order.payment_method === "manual") {
    orders.recordPaymentAttempt(s, order, "manual", null);
    return { kind: "manual", instructions: settings.manual_instructions || "Nous vous contacterons pour les modalités de paiement." };
  }
  if (order.payment_method !== "stripe" || !PROVIDERS.stripe.configured()) throw new MarketingError("payment_unavailable", "Ce moyen de paiement n'est pas disponible pour le moment.");
  if (order.total_cents < gateway.MIN_AMOUNT_CENTS) throw new MarketingError("payment_unavailable", "Le montant est inférieur au minimum payable par carte.");
  let session;
  try {
    session = await gateway.stripeRequest("POST", "/v1/checkout/sessions", {
      mode: "payment",
      client_reference_id: `shop:${order.id}`,
      customer_email: order.email,
      success_url: `${successUrl}`,
      cancel_url: `${cancelUrl}`,
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      line_items: [{ quantity: 1, price_data: { currency: order.currency, unit_amount: order.total_cents, product_data: { name: `Commande ${order.number}` } } }],
    });
    if (!session || !session.id || !session.url) throw new Error("réponse sans adresse de paiement");
  } catch (error) {
    console.error(`[KOLAKISA] Boutique : paiement ${order.number} non créé : ${error.message}`);
    orders.markPaymentFailed(s, order.id, { provider: "stripe", providerRef: null, reason: "page de paiement non créée" });
    throw new MarketingError("payment_unavailable", "Le paiement est momentanément indisponible. Vous n'avez pas été débité : vous pouvez réessayer.");
  }
  orders.recordPaymentAttempt(s, order, "stripe", session.id);
  return { kind: "redirect", url: session.url };
}

// Relecture directe de la session auprès du fournisseur (retour du client) : confirme seulement si Stripe dit « paid ».
async function reconcile(s, order) {
  if (order.payment_status === "paid" || order.payment_method !== "stripe") return order;
  const pay = s.db.prepare("SELECT * FROM mk_shop_payments WHERE order_id = ? AND provider = 'stripe' AND provider_ref IS NOT NULL ORDER BY id DESC").get(order.id);
  if (!pay) return order;
  try {
    const session = await gateway.retrieveStripeSession(pay.provider_ref);
    if (session && session.payment_status === "paid") applySession(s, session, order.id);
  } catch (error) { console.error(`[KOLAKISA] Boutique : relecture ${order.number} : ${error.message}`); }
  return orders.getOrder(s, order.id);
}

function applySession(s, session, orderId) {
  if (typeof session.payment_intent === "string") s.db.prepare("UPDATE mk_shop_payments SET provider_intent = ? WHERE provider = 'stripe' AND provider_ref = ?").run(session.payment_intent, session.id);
  return orders.markPaid(s, orderId, { provider: "stripe", providerRef: session.id, amountCents: session.amount_total, currency: session.currency });
}

// Webhook Stripe pour une session de boutique (client_reference_id « shop:<id> »). L'appelant a DÉJÀ vérifié la signature.
// Idempotent : l'identifiant d'événement est enregistré dans la même transaction que le traitement. → { handled, duplicate?, result? }
function handleStripeEvent(db, event) {
  const obj = event && event.data && event.data.object ? event.data.object : {};
  let orderId = null;
  const ref = typeof obj.client_reference_id === "string" ? obj.client_reference_id : "";
  if (/^shop:\d+$/.test(ref)) orderId = Number(ref.slice(5));
  else if (event.type === "charge.refunded" && typeof obj.payment_intent === "string") {
    const pay = db.prepare("SELECT order_id FROM mk_shop_payments WHERE provider = 'stripe' AND provider_intent = ?").get(obj.payment_intent);
    if (pay) orderId = pay.order_id;
  }
  if (!orderId) return { handled: false };
  const row = db.prepare("SELECT id, organization_id, site_id FROM mk_shop_orders WHERE id = ?").get(orderId);
  if (!row) return { handled: false };
  const s = { db, organizationId: row.organization_id, siteId: row.site_id };
  return transaction(db, () => {
    if (event.id) {
      const ins = db.prepare("INSERT OR IGNORE INTO mk_shop_webhook_events (provider, event_id) VALUES ('stripe', ?)").run(String(event.id));
      if (!ins.changes) return { handled: true, duplicate: true };
    }
    let result = null;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        if (obj.payment_status === "paid") result = applySession(s, obj, orderId);
        break;
      case "checkout.session.expired":
        result = orders.markPaymentFailed(s, orderId, { provider: "stripe", providerRef: obj.id, reason: "session expirée", cancel: true });
        break;
      case "checkout.session.async_payment_failed":
        result = orders.markPaymentFailed(s, orderId, { provider: "stripe", providerRef: obj.id, reason: "paiement refusé" });
        break;
      case "charge.refunded": {
        const order = orders.getOrder(s, orderId);
        if (order && Number(obj.amount_refunded) >= order.total_cents && order.status !== "refunded" && order.status !== "cancelled") {
          db.prepare("UPDATE mk_shop_orders SET status = 'refunded', payment_status = 'refunded', updated_at = datetime('now') WHERE id = ?").run(orderId);
          db.prepare("UPDATE mk_shop_payments SET status = 'refunded', updated_at = datetime('now') WHERE order_id = ? AND status = 'succeeded'").run(orderId);
          orders.addEvent(db, orderId, { kind: "status", from: order.status, to: "refunded", actor: "provider:stripe", note: "Remboursement total annoncé par Stripe" });
          result = { status: "refunded" };
        } else if (order) orders.addEvent(db, orderId, { kind: "refund_partial", actor: "provider:stripe", note: `Remboursement partiel annoncé : ${obj.amount_refunded}` });
        break;
      }
      default: break;
    }
    return { handled: true, result, orderId, scope: s };
  });
}

module.exports = { PROVIDERS, available, status, start, reconcile, handleStripeEvent };
