// Programme 20.5 — Passerelles de paiement de la boutique, derrière une interface unique (le moteur de commandes ne connaît aucun fournisseur).
//  - stripe : Stripe Checkout hébergé (aucune donnée de carte chez nous). Clés SERVEUR uniquement (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) : sans elles la méthode est « à configurer ».
//  - manual : virement / paiement à la livraison. La commande reste « en attente » jusqu'à confirmation par un administrateur autorisé (shop.payments).
// Une page de succès n'est JAMAIS une preuve de paiement : seuls un webhook signé ou la relecture de la session auprès du fournisseur confirment.
const gateway = require("../../services/payments");
const { MarketingError } = require("../errors");
const orders = require("./orders");
const { transaction } = require("../db/tx");

const gateways = require("./gateways");
// `configured(s)` : la passerelle est-elle utilisable pour CETTE boutique ? (Stripe : clés du site, sinon clés du serveur ; PayPal et Flutterwave : identifiants du site.)
const PROVIDERS = Object.freeze({
  stripe: { label: "Carte bancaire (Stripe)", configured: (s) => Boolean(s ? gateways.stripeKeyFor(s) && gateways.stripeWebhookSecretFor(s) : gateway.stripeEnabled() && process.env.STRIPE_WEBHOOK_SECRET) },
  paypal: { label: gateways.LABELS.paypal, configured: (s) => Boolean(s && gateways.configuredFor(s, "paypal")) },
  flutterwave: { label: gateways.LABELS.flutterwave, configured: (s) => Boolean(s && gateways.configuredFor(s, "flutterwave")) },
  manual: { label: "Paiement manuel (virement, à la livraison)", configured: () => true },
});
const available = (settings, s) => settings.payment_methods.filter((m) => PROVIDERS[m] && PROVIDERS[m].configured(s));
const status = (settings, s) => Object.entries(PROVIDERS).map(([key, p]) => ({ key, label: p.label, enabled: settings.payment_methods.includes(key), configured: p.configured(s) }));

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
  const adapter = gateways.adapterFor(order.payment_method);
  if (adapter) return startWithAdapter(s, order, adapter, { successUrl, cancelUrl });
  if (order.payment_method !== "stripe" || !PROVIDERS.stripe.configured(s)) throw new MarketingError("payment_unavailable", "Ce moyen de paiement n'est pas disponible pour le moment.");
  const stripeKey = gateways.stripeKeyFor(s);
  if (order.total_cents < gateway.MIN_AMOUNT_CENTS) throw new MarketingError("payment_unavailable", "Le montant est inférieur au minimum payable par carte.");
  // Nouvelle tentative : jamais de seconde session si la précédente est encore ouverte (la réutiliser) ou déjà payée (la constater).
  const previous = s.db.prepare("SELECT provider_ref FROM mk_shop_payments WHERE order_id = ? AND provider = 'stripe' AND provider_ref IS NOT NULL ORDER BY id DESC").get(order.id);
  if (previous) {
    try {
      const old = await gateway.retrieveStripeSession(previous.provider_ref, stripeKey);
      if (old && old.payment_status === "paid") { applySession(s, old, order.id); return { kind: "paid" }; }
      if (old && old.status === "open" && old.url) return { kind: "redirect", url: old.url };
    } catch (error) { console.error(`[KOLAKISA] Boutique : relecture de la session précédente ${order.number} : ${error.message}`); }
  }
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
    }, undefined, stripeKey);
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
  if (order.payment_status === "paid") return order;
  const adapter = gateways.adapterFor(order.payment_method);
  if (adapter) return reconcileWithAdapter(s, order, adapter);
  if (order.payment_method !== "stripe") return order;
  const pay = s.db.prepare("SELECT * FROM mk_shop_payments WHERE order_id = ? AND provider = 'stripe' AND provider_ref IS NOT NULL ORDER BY id DESC").get(order.id);
  if (!pay) return order;
  try {
    const session = await gateway.retrieveStripeSession(pay.provider_ref, gateways.stripeKeyFor(s));
    if (session && session.payment_status === "paid") applySession(s, session, order.id);
  } catch (error) { console.error(`[KOLAKISA] Boutique : relecture ${order.number} : ${error.message}`); }
  return orders.getOrder(s, order.id);
}

// ── PayPal, Flutterwave : même schéma — page hébergée, puis vérification AUPRÈS du fournisseur (retour du client ou webhook) ──
async function startWithAdapter(s, order, adapter, urls) {
  const creds = gateways.getCreds(s, adapter.key);
  if (!adapter.configured(creds)) throw new MarketingError("payment_unavailable", "Ce moyen de paiement n'est pas disponible pour le moment.");
  if (order.total_cents < gateway.MIN_AMOUNT_CENTS && !gateways.ZERO_DECIMAL.has(String(order.currency).toLowerCase())) throw new MarketingError("payment_unavailable", "Le montant est inférieur au minimum payable.");
  let started;
  try { started = await adapter.start(order, creds, urls, {}); if (!started || !started.url || !started.ref) throw new Error("réponse sans adresse de paiement"); } catch (error) {
    console.error(`[KOLAKISA] Boutique : paiement ${order.number} (${adapter.key}) non créé : ${error.message}`);
    orders.markPaymentFailed(s, order.id, { provider: adapter.key, providerRef: null, reason: "page de paiement non créée" });
    throw new MarketingError("payment_unavailable", "Le paiement est momentanément indisponible. Vous n'avez pas été débité : vous pouvez réessayer.");
  }
  // Même tentative déjà enregistrée (nouvelle tentative avec la même référence) : on ne duplique pas la ligne
  if (!s.db.prepare("SELECT 1 FROM mk_shop_payments WHERE provider = ? AND provider_ref = ?").get(adapter.key, started.ref)) orders.recordPaymentAttempt(s, order, adapter.key, started.ref);
  return { kind: "redirect", url: started.url };
}
async function reconcileWithAdapter(s, order, adapter) {
  const pay = s.db.prepare("SELECT * FROM mk_shop_payments WHERE order_id = ? AND provider = ? AND provider_ref IS NOT NULL ORDER BY id DESC").get(order.id, adapter.key);
  const creds = gateways.getCreds(s, adapter.key);
  if (!pay || !adapter.configured(creds)) return order;
  try {
    const v = await adapter.verify(order, pay.provider_ref, creds);
    if (v && v.paid) {
      if (v.intent) s.db.prepare("UPDATE mk_shop_payments SET provider_intent = ? WHERE id = ?").run(String(v.intent), pay.id);
      orders.markPaid(s, order.id, { provider: adapter.key, providerRef: pay.provider_ref, amountCents: v.amountCents, currency: v.currency });
    }
  } catch (error) { console.error(`[KOLAKISA] Boutique : relecture ${order.number} (${adapter.key}) : ${error.message}`); }
  return orders.getOrder(s, order.id);
}
// Webhook d'une passerelle : le message n'est qu'un SIGNAL (référence extraite, authentifiée si le fournisseur le permet) ; l'état réel est relu auprès du fournisseur. → { handled, order? }
async function handleProviderWebhook(s, provider, body, headers) {
  const adapter = gateways.adapterFor(provider);
  const creds = adapter && gateways.getCreds(s, provider);
  if (!adapter || !adapter.configured(creds)) return { handled: false };
  const ref = adapter.identify(body, headers, creds);
  if (!ref) return { handled: false };
  const pay = s.db.prepare(`SELECT p.order_id FROM mk_shop_payments p WHERE p.provider = ? AND p.provider_ref = ? AND p.organization_id = ? AND ${s.siteId == null ? "p.site_id IS NULL" : "p.site_id = ?"}`).get(provider, ref, s.organizationId, ...(s.siteId == null ? [] : [s.siteId]));
  if (!pay) return { handled: false };
  const before = orders.getOrder(s, pay.order_id);
  const after = await reconcile(s, before);
  return { handled: true, order: after, becamePaid: before.payment_status !== "paid" && after.payment_status === "paid" };
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
        if (!order || order.status === "cancelled") break;
        const refunds = require("./refunds");
        const announced = Number(obj.amount_refunded) || 0;
        const committed = refunds.committedCents(db, orderId);
        // Remboursement fait directement chez Stripe (hors Kolakisa) : on l'inscrit pour que les comptes restent justes. Un remboursement déjà inscrit par Kolakisa n'est jamais compté deux fois.
        if (announced > committed) {
          db.prepare("INSERT OR IGNORE INTO mk_shop_refunds (organization_id, site_id, order_id, amount_cents, currency, reason, restock, items, provider, provider_ref, status, idempotency_key, actor) VALUES (?,?,?,?,?,?,0,'[]','stripe',?, 'succeeded', ?, 'provider:stripe')")
            .run(order.organization_id, order.site_id ?? null, orderId, announced - committed, order.currency, "Remboursement effectué chez Stripe", `ext:${obj.id}`, `ext:${obj.id}:${announced}`);
        }
        if (refunds.committedCents(db, orderId) >= order.total_cents && order.status !== "refunded") {
          db.prepare("UPDATE mk_shop_orders SET status = 'refunded', payment_status = 'refunded', updated_at = datetime('now') WHERE id = ?").run(orderId);
          db.prepare("UPDATE mk_shop_payments SET status = 'refunded', updated_at = datetime('now') WHERE order_id = ? AND status = 'succeeded'").run(orderId);
          orders.addEvent(db, orderId, { kind: "status", from: order.status, to: "refunded", actor: "provider:stripe", note: "Remboursement total annoncé par Stripe" });
          result = { status: "refunded" };
        } else if (announced > committed) orders.addEvent(db, orderId, { kind: "refund_partial", actor: "provider:stripe", note: `Remboursement partiel annoncé par Stripe : ${announced}` });
        break;
      }
      default: break;
    }
    return { handled: true, result, orderId, scope: s };
  });
}

module.exports = { PROVIDERS, available, status, start, reconcile, handleStripeEvent, handleProviderWebhook };
