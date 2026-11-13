// Paiement par carte avec Stripe Checkout, sans dépendance externe (fetch + crypto).
//  - le visiteur est envoyé sur la page de paiement hébergée par Stripe ; aucune donnée de carte ne passe par ce serveur ;
//  - les montants viennent TOUJOURS du serveur (prix du catalogue, code promo revérifié), jamais du navigateur ;
//  - la commande et les inscriptions ne sont créées qu'à la confirmation de Stripe (webhook signé, ou relecture directe
//    de la session auprès de Stripe au retour du client) : fulfillCheckout() est idempotent, les deux chemins peuvent coexister.
// Variables : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET. STRIPE_API_BASE ne sert qu'aux tests (faux serveur Stripe).
const crypto = require("node:crypto");
const { sendPurchaseWelcomeEmail } = require("../utils/mailer");
const notifications = require("./notifications");

const CURRENCY = "eur";
const MIN_AMOUNT_CENTS = 50; // minimum accepté par Stripe en euros
const SESSION_MINUTES = 30; // durée de validité d'une page de paiement (minimum de Stripe)
const SIGNATURE_TOLERANCE_SECONDS = 300;

const stripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);
const apiBase = () => String(process.env.STRIPE_API_BASE || "https://api.stripe.com").replace(/\/+$/, "");

// Format attendu par Stripe : application/x-www-form-urlencoded avec clés imbriquées « a[0][b]=… »
function encodeForm(value, prefix = "", out = []) {
  if (value === undefined || value === null) return out;
  if (typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) encodeForm(inner, prefix ? `${prefix}[${key}]` : key, out);
  } else {
    out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
  }
  return out;
}

async function stripeRequest(method, path, params, extraHeaders, key) {
  const response = await fetch(`${apiBase()}${path}`, {
    method,
    headers: { authorization: `Bearer ${key || process.env.STRIPE_SECRET_KEY}`, ...(params ? { "content-type": "application/x-www-form-urlencoded" } : {}), ...(extraHeaders || {}) },
    body: params ? encodeForm(params).join("&") : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Le message de Stripe est journalisé côté serveur ; il n'est jamais montré au visiteur (ni la clé, jamais écrite)
    throw new Error(`Stripe ${response.status} : ${(data.error && data.error.message) || "réponse inattendue"}`);
  }
  return data;
}

// Crée la page de paiement. `lines` : [{ title, amountCents }] (lignes à payer uniquement, montants > 0).
async function createStripeSession({ ref, email, lines, successUrl, cancelUrl }) {
  return stripeRequest("POST", "/v1/checkout/sessions", {
    mode: "payment",
    client_reference_id: ref,
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60 + 60,
    line_items: lines.map((l) => ({ quantity: 1, price_data: { currency: CURRENCY, unit_amount: l.amountCents, product_data: { name: l.title } } })),
  });
}

const retrieveStripeSession = (id, key) => stripeRequest("GET", `/v1/checkout/sessions/${encodeURIComponent(id)}`, undefined, undefined, key);

// Signature d'un webhook : en-tête « t=<horodatage>,v1=<HMAC-SHA256 de "t.corps">,… » (corps BRUT, octets exacts).
function verifyWebhookSignature(rawBody, header, secret, now = Date.now()) {
  if (!secret || !header || !Buffer.isBuffer(rawBody)) return false;
  const parts = String(header).split(",").map((p) => p.trim().split("="));
  const timestamp = Number((parts.find(([k]) => k === "t") || [])[1]);
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!Number.isFinite(timestamp) || !signatures.length) return false;
  if (Math.abs(now / 1000 - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false; // rejeu d'un ancien message
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest();
  return signatures.some((sig) => {
    const given = Buffer.from(sig, "hex");
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

// Enregistre le paiement d'une session : commande + lignes + inscriptions, en une seule transaction.
// `stripeSession` : l'objet session de Stripe (déjà authentifié : webhook signé ou lecture directe via l'API).
// → { status: "paid" | "already" | "unknown" | "unpaid" | "mismatch" | "failed", orderId? }
function fulfillCheckout(db, stripeSession) {
  const ref = stripeSession.client_reference_id;
  const cs = ref && db.prepare("SELECT * FROM checkout_sessions WHERE ref = ?").get(ref);
  if (!cs) return { status: "unknown" };
  if (cs.status === "paid") return { status: "already", orderId: cs.order_id };
  if (stripeSession.payment_status !== "paid") return { status: "unpaid" };

  // Le montant réellement encaissé doit être celui calculé par le serveur : sinon rien n'est accordé
  if (stripeSession.amount_total !== cs.total_cents || String(stripeSession.currency).toLowerCase() !== cs.currency) {
    console.error(`[KOLAKISA] Paiement ${ref} : montant inattendu (${stripeSession.amount_total} ${stripeSession.currency}, attendu ${cs.total_cents} ${cs.currency}). Accès NON accordé, vérifiez dans Stripe.`);
    db.prepare("UPDATE checkout_sessions SET status = 'failed', failure_reason = 'montant inattendu' WHERE id = ? AND status = 'pending'").run(cs.id);
    return { status: "mismatch" };
  }

  const items = JSON.parse(cs.items_json);
  let orderId;
  db.exec("BEGIN IMMEDIATE");
  try {
    // Relue DANS la transaction : un webhook rejoué ou simultané au retour du client ne crée jamais deux commandes
    const fresh = db.prepare("SELECT status, order_id FROM checkout_sessions WHERE id = ?").get(cs.id);
    if (fresh.status === "paid") { db.exec("COMMIT"); return { status: "already", orderId: fresh.order_id }; }

    const courseIds = items.map((i) => i.course_id);
    const existing = new Set(db.prepare(`SELECT id FROM courses WHERE id IN (${courseIds.map(() => "?").join(",")})`).all(...courseIds).map((c) => c.id));
    if (!courseIds.every((id) => existing.has(id))) {
      db.exec("ROLLBACK");
      console.error(`[KOLAKISA] Paiement ${ref} encaissé mais une formation n'existe plus : à rembourser dans Stripe.`);
      db.prepare("UPDATE checkout_sessions SET status = 'failed', failure_reason = 'formation supprimée' WHERE id = ?").run(cs.id);
      return { status: "failed" };
    }
    // Un code promo supprimé depuis ne doit pas faire échouer une commande déjà payée (le code et la remise restent notés)
    const couponId = cs.coupon_id && db.prepare("SELECT id FROM coupons WHERE id = ?").get(cs.coupon_id) ? cs.coupon_id : null;

    const info = db.prepare("INSERT INTO orders (user_id, total_cents, coupon_id, coupon_code, discount_cents) VALUES (?, ?, ?, ?, ?)")
      .run(cs.user_id, cs.total_cents, couponId, cs.coupon_code, cs.discount_cents);
    orderId = Number(info.lastInsertRowid);
    const insertItem = db.prepare("INSERT INTO order_items (order_id, course_id, price_cents, list_price_cents, offer_id, offer_name) VALUES (?, ?, ?, ?, ?, ?)");
    const offerExists = db.prepare("SELECT id FROM offers WHERE id = ?");
    const insertEnrollment = db.prepare("INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)");
    for (const item of items) {
      // Sessions créées avant les offres : pas d'offer_id (undefined → vide). Offre supprimée depuis : le nom reste, l'id non.
      const offerId = item.offer_id && offerExists.get(item.offer_id) ? item.offer_id : null;
      insertItem.run(orderId, item.course_id, item.price_cents, item.list_price_cents, offerId, item.offer_name ?? null);
      insertEnrollment.run(cs.user_id, item.course_id);
    }
    db.prepare("UPDATE checkout_sessions SET status = 'paid', order_id = ?, paid_at = datetime('now'), stripe_session_id = COALESCE(stripe_session_id, ?), stripe_payment_intent = ? WHERE id = ?")
      .run(orderId, stripeSession.id || null, typeof stripeSession.payment_intent === "string" ? stripeSession.payment_intent : null, cs.id);
    db.exec("COMMIT");
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch { /* déjà annulée */ }
    throw error; // le webhook répond 500 : Stripe réessaie plus tard
  }

  // E-mail mis en file APRÈS l'enregistrement : son échec ne peut pas annuler l'achat
  const user = db.prepare("SELECT email, username FROM users WHERE id = ?").get(cs.user_id);
  const titles = db.prepare(`SELECT title FROM courses WHERE id IN (${items.map(() => "?").join(",")})`).all(...items.map((i) => i.course_id)).map((c) => c.title);
  if (user) sendPurchaseWelcomeEmail(db, { to: user.email, username: user.username, courseTitles: titles });
  notifications.notify(cs.user_id, { kind: "order", title: `Commande n° ${orderId} confirmée`, body: titles.join(", "), url: "/mes-cours" });
  return { status: "paid", orderId };
}

// Session abandonnée ou expirée côté Stripe : rien n'a été débité, rien n'a été accordé.
function markCheckoutEnded(db, stripeSession, status) {
  const ref = stripeSession.client_reference_id;
  if (!ref) return;
  db.prepare("UPDATE checkout_sessions SET status = ? WHERE ref = ? AND status = 'pending'").run(status, ref);
}

// Remboursement annoncé par Stripe (webhook signé « charge.refunded ») : un enregistrement par remboursement, rattaché à la commande payée par ce paiement.
// Idempotent (identifiant Stripe UNIQUE). Ne touche NI à la commande NI aux accès : décision de l'équipe, pas d'un webhook.
// → { status: "recorded" | "already" | "unknown", recorded: nombre de remboursements nouveaux }
function recordRefunds(db, charge) {
  const intent = charge && typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  const cs = intent && db.prepare("SELECT order_id FROM checkout_sessions WHERE stripe_payment_intent = ? AND order_id IS NOT NULL").get(intent);
  if (!cs) return { status: "unknown", recorded: 0 };
  const list = charge.refunds && Array.isArray(charge.refunds.data) && charge.refunds.data.length
    ? charge.refunds.data
    : [{ id: `${charge.id}:${charge.amount_refunded}`, amount: charge.amount_refunded, currency: charge.currency }]; // sans détail : un enregistrement par montant cumulé
  const insert = db.prepare("INSERT OR IGNORE INTO order_refunds (order_id, stripe_refund_id, amount_cents, currency) VALUES (?, ?, ?, ?)");
  let recorded = 0;
  for (const r of list) {
    if (!r || typeof r.id !== "string" || !Number.isInteger(r.amount) || r.amount <= 0 || (r.status && r.status !== "succeeded")) continue;
    recorded += insert.run(cs.order_id, r.id, r.amount, String(r.currency || charge.currency || CURRENCY).toLowerCase()).changes;
  }
  return { status: recorded ? "recorded" : "already", recorded };
}

module.exports = {
  recordRefunds, CURRENCY, MIN_AMOUNT_CENTS, stripeEnabled, createStripeSession, retrieveStripeSession,
  verifyWebhookSignature, fulfillCheckout, markCheckoutEnded, encodeForm, stripeRequest,
};
