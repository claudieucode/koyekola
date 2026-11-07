// Programme 20.5 — Commandes : création depuis un panier (tout recalculé côté serveur), stock réservé, idempotence, cycle de vie, paiement confirmé.
// Une commande n'est JAMAIS « payée » à sa création : seul markPaid() (appelé après confirmation du fournisseur, ou par un administrateur autorisé pour le paiement manuel) la passe à « paid ».
const { MarketingError } = require("../errors");
const { transaction } = require("../db/tx");
const cartSvc = require("./cart");
const store = require("./store");
const giftLists = require("./giftLists");
const deliverySlots = require("./deliverySlots");
const age = require("./age");

// Transitions autorisées (statut → statuts suivants). « pending → paid » n'est pas accessible à l'interface : voir markPaid / changeStatus.
const TRANSITIONS = Object.freeze({
  pending: ["paid", "cancelled"],
  paid: ["processing", "shipped", "refunded"],
  processing: ["shipped", "refunded"],
  shipped: ["completed", "refunded"],
  completed: ["refunded"],
  cancelled: [],
  refunded: [],
});
const STATUS_LABELS = Object.freeze({ pending: "En attente de paiement", paid: "Payée", processing: "En préparation", shipped: "Expédiée", completed: "Terminée", cancelled: "Annulée", refunded: "Remboursée" });

const siteCond = (s, a = "") => (s.siteId == null ? `${a}site_id IS NULL` : `${a}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);

function address(input, label, { required }) {
  const a = input && typeof input === "object" ? input : {};
  const out = { name: clean(a.name, 120), line1: clean(a.line1, 160), line2: clean(a.line2, 160), postal_code: clean(a.postal_code, 20), city: clean(a.city, 100), region: clean(a.region, 80), country: clean(a.country, 2).toUpperCase(), phone: clean(a.phone, 30) };
  if (required) {
    if (!out.name || !out.line1 || !out.city || !out.postal_code) throw new MarketingError("invalid_field", `${label} : nom, adresse, code postal et ville sont obligatoires.`);
    if (!/^[A-Z]{2}$/.test(out.country)) throw new MarketingError("invalid_field", `${label} : le pays est obligatoire.`);
  } else if (out.country && !/^[A-Z]{2}$/.test(out.country)) throw new MarketingError("invalid_field", `${label} : pays invalide.`);
  return out;
}

function addEvent(db, orderId, { kind, from = null, to = null, actor, note = null }) {
  db.prepare("INSERT INTO mk_shop_order_events (order_id, kind, from_status, to_status, actor, note) VALUES (?,?,?,?,?,?)").run(orderId, kind, from, to, actor, note ? String(note).slice(0, 500) : null);
}

function nextNumber(s, settings) {
  const n = settings.next_order_number;
  s.db.prepare("UPDATE mk_shop_settings SET next_order_number = next_order_number + 1 WHERE id = ?").run(settings.id);
  return `${settings.order_prefix}-${String(n).padStart(5, "0")}`;
}

// Réserve le stock d'une ligne : mise à jour conditionnelle (jamais sous zéro), mouvement journalisé.
function reserve(s, line, orderId) {
  const table = line.variantId ? "mk_shop_variants" : "mk_shop_products";
  const id = line.variantId || line.productId;
  if (line.stock === null) return;
  const r = s.db.prepare(`UPDATE ${table} SET stock_qty = stock_qty - ? WHERE id = ? AND manage_stock = 1 AND stock_qty >= ?`).run(line.quantity, id, line.quantity);
  if (!r.changes) throw new MarketingError("stock", `Stock insuffisant pour « ${line.name} ».`);
  s.db.prepare("INSERT INTO mk_shop_stock_movements (organization_id, site_id, product_id, variant_id, delta, reason, order_id) VALUES (?,?,?,?,?, 'order', ?)").run(s.organizationId, s.siteId ?? null, line.productId, line.variantId, -line.quantity, orderId);
}

// Rend le stock d'une commande (annulation, paiement échoué, expiration). Idempotent grâce à stock_released.
function releaseStock(s, order, { allowPartial = false } = {}) {
  if (order.stock_released) return;
  const items = s.db.prepare("SELECT * FROM mk_shop_order_items WHERE order_id = ?").all(order.id);
  for (const it of items) {
    if (!it.product_id) continue;
    const table = it.variant_id ? "mk_shop_variants" : "mk_shop_products";
    const id = it.variant_id || it.product_id;
    const r = s.db.prepare(`UPDATE ${table} SET stock_qty = stock_qty + ? WHERE id = ? AND manage_stock = 1`).run(it.quantity, id);
    if (r.changes) s.db.prepare("INSERT INTO mk_shop_stock_movements (organization_id, site_id, product_id, variant_id, delta, reason, order_id) VALUES (?,?,?,?,?, 'release', ?)").run(s.organizationId, s.siteId ?? null, it.product_id, it.variant_id, it.quantity, order.id);
  }
  void allowPartial;
  s.db.prepare("UPDATE mk_shop_orders SET stock_released = 1 WHERE id = ?").run(order.id);
}

// ── Création ────────────────────────────────────────────────────────────────────────────────
// input : { email, billing, shipping, shippingMethodId, paymentMethod, idempotencyKey, expectedTotalCents, customerId }
// → { order, duplicate }
function createFromCart(s, cart, input) {
  const clientKey = clean(input.idempotencyKey, 80);
  const key = `cart:${cart.id}:${clientKey}`;
  const existingFor = () => s.db.prepare(`SELECT * FROM mk_shop_orders WHERE organization_id = ? AND ${siteCond(s)} AND idempotency_key LIKE ?`).get(s.organizationId, ...siteArgs(s), `cart:${cart.id}:%`);
  const prior = existingFor();
  if (prior) return { order: prior, duplicate: true };

  const email = clean(input.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new MarketingError("invalid_field", "Une adresse e-mail valide est obligatoire.");
  const settings = store.getSettings(s);
  if (!settings.enabled) throw new MarketingError("shop_closed", "La boutique n'est pas ouverte.");
  const method = String(input.paymentMethod || "");
  if (!settings.payment_methods.includes(method)) throw new MarketingError("invalid_field", "Ce moyen de paiement n'est pas proposé par la boutique.");

  return transaction(s.db, () => {
    const fresh = s.db.prepare("SELECT * FROM mk_shop_carts WHERE id = ?").get(cart.id);
    if (!fresh || fresh.status !== "open") { const again = existingFor(); if (again) return { order: again, duplicate: true }; throw new MarketingError("conflict", "Ce panier n'est plus disponible."); }
    input = giftLists.prepareCheckout(s, fresh.id, input); // liste de cadeaux : plafond revérifié, livraison chez le bénéficiaire (adresse jamais montrée à l'invité)

    const billing = address(input.billing, "Adresse de facturation", { required: false });
    const priced0 = cartSvc.priceCart(s, fresh, { dest: {}, email });
    const needsShipping = priced0.shipping.required;
    const shippingAddr = address(needsShipping ? input.shipping : input.shipping || {}, "Adresse de livraison", { required: needsShipping });
    const dest = { country: (needsShipping ? shippingAddr.country : billing.country || shippingAddr.country) || settings.default_country, region: needsShipping ? shippingAddr.region : billing.region };
    const priced = cartSvc.priceCart(s, fresh, { dest, shippingMethodId: input.shippingMethodId, email });

    if (!priced.lines.length) throw new MarketingError("invalid_field", "Votre panier est vide.");
    if (priced.issues.length) throw new MarketingError("stock", priced.issues[0].message);
    if (fresh.coupon_code && priced.couponError) throw new MarketingError("invalid_field", priced.couponError);
    if (needsShipping && (priced.shipping.error || !priced.shipping.chosen)) throw new MarketingError("invalid_field", priced.shipping.error || "Choisissez une méthode de livraison.");
    if (settings.tax_enabled && !priced.taxRule && !dest.country) throw new MarketingError("invalid_field", "Indiquez le pays pour calculer les taxes.");
    // Le total affiché au client est celui qu'il accepte : s'il a changé entre-temps (prix, promotion, stock), il le revoit avant de payer.
    if (input.expectedTotalCents !== undefined && input.expectedTotalCents !== null && input.expectedTotalCents !== "" && Number(input.expectedTotalCents) !== priced.totals.total) {
      throw new MarketingError("price_changed", "Le total de votre commande a changé. Vérifiez le nouveau total avant de payer.");
    }
    if (priced.totals.total < 0) throw new MarketingError("invalid_field", "Total invalide.");
    // Contrôle d'âge : la case « J'ai au moins N ans » est exigée si le panier contient un produit soumis (déclaration sur l'honneur, enregistrée sur la commande)
    const ageNeeded = age.requiredForProducts(s.db, priced.lines.map((l) => l.productId));
    if (ageNeeded && !(input.ageConfirmed === true || input.ageConfirmed === "1" || input.ageConfirmed === 1)) throw new MarketingError("age_required", `Cochez la case « Je confirme avoir au moins ${ageNeeded} ans » pour commander : votre panier contient un produit réservé aux personnes de ${ageNeeded} ans et plus.`);

    // Créneau de livraison : exigé par certaines méthodes (ex. froid) ; revalidé ici, dans la transaction, avec la capacité réelle du moment.
    const slotChoice = priced.shipping.chosen && priced.shipping.chosen.requiresSlot ? deliverySlots.validateChoice(s, input.deliverySlot) : null;
    const number = nextNumber(s, settings);
    const info = s.db.prepare(`INSERT INTO mk_shop_orders (organization_id, site_id, number, customer_id, email, status, payment_status, payment_method, currency, prices_include_tax, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents,
      coupon_code, shipping_method_name, billing_address, shipping_address, tax_lines, idempotency_key) VALUES (?,?,?,?,?, 'pending','unpaid',?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(s.organizationId, s.siteId ?? null, number, input.customerId || null, email, method, priced.currency, settings.prices_include_tax, priced.totals.subtotal, priced.totals.discount, priced.totals.shipping, priced.totals.tax, priced.totals.total,
        priced.coupon ? priced.coupon.code : null, priced.shipping.chosen ? priced.shipping.chosen.name : null, JSON.stringify(billing), JSON.stringify(shippingAddr), JSON.stringify(priced.totals.taxLines), key);
    const orderId = Number(info.lastInsertRowid);
    if (slotChoice) deliverySlots.record(s, orderId, slotChoice);
    if (ageNeeded) s.db.prepare("UPDATE mk_shop_orders SET age_confirmed_at = datetime('now'), age_confirmed_min = ? WHERE id = ?").run(ageNeeded, orderId);
    const insItem = s.db.prepare("INSERT INTO mk_shop_order_items (order_id, product_id, variant_id, name, variant_label, sku, quantity, unit_price_cents, line_subtotal_cents, discount_cents, tax_cents, requires_shipping, weight_grams, custom_text, custom_label) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    priced.lines.forEach((l, i) => {
      const t = priced.totals.lines[i];
      const inserted = insItem.run(orderId, l.productId, l.variantId, l.name, l.variantLabel, l.sku, l.quantity, l.unitCents, t.subtotal, t.discount, t.tax, l.requiresShipping ? 1 : 0, l.weightGrams, l.customText || null, l.customText ? l.customLabel : null);
      giftLists.onOrderLine(s, l.itemId, Number(inserted.lastInsertRowid), l.quantity); // lien liste de cadeaux (compté seulement au paiement)
      reserve(s, l, orderId);
    });
    if (priced.coupon) {
      const up = s.db.prepare("UPDATE mk_shop_coupons SET used_count = used_count + 1 WHERE id = ? AND (max_uses IS NULL OR used_count < max_uses)").run(priced.coupon.id);
      if (!up.changes) throw new MarketingError("invalid_field", "Ce code a atteint sa limite d'utilisation.");
      s.db.prepare("INSERT INTO mk_shop_coupon_redemptions (coupon_id, order_id, customer_email) VALUES (?,?,?)").run(priced.coupon.id, orderId, email);
    }
    s.db.prepare("UPDATE mk_shop_carts SET status = 'converted', version = version + 1, updated_at = datetime('now') WHERE id = ?").run(cart.id);
    addEvent(s.db, orderId, { kind: "created", to: "pending", actor: input.customerId ? "customer" : "guest", note: `Paiement : ${method}` });
    return { order: s.db.prepare("SELECT * FROM mk_shop_orders WHERE id = ?").get(orderId), duplicate: false };
  });
}

// ── Lecture ─────────────────────────────────────────────────────────────────────────────────
function getOrder(s, id) {
  const o = s.db.prepare(`SELECT * FROM mk_shop_orders WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(id) || 0, s.organizationId, ...siteArgs(s));
  return o || null;
}
function orderByNumber(s, number) {
  return s.db.prepare(`SELECT * FROM mk_shop_orders WHERE number = ? AND organization_id = ? AND ${siteCond(s)}`).get(String(number || ""), s.organizationId, ...siteArgs(s)) || null;
}
function orderDetail(s, order) {
  const parse = (v, f) => { try { return JSON.parse(v); } catch { return f; } };
  return {
    ...order, billing: parse(order.billing_address, {}), shippingAddress: parse(order.shipping_address, {}), taxLines: parse(order.tax_lines, []),
    items: s.db.prepare("SELECT * FROM mk_shop_order_items WHERE order_id = ? ORDER BY id").all(order.id),
    events: s.db.prepare("SELECT * FROM mk_shop_order_events WHERE order_id = ? ORDER BY id").all(order.id),
    payments: s.db.prepare("SELECT id, provider, provider_ref, amount_cents, currency, status, failure_reason, created_at FROM mk_shop_payments WHERE order_id = ? ORDER BY id").all(order.id),
  };
}
function listOrders(s, { status, q, customerId, page = 1, perPage = 25 } = {}) {
  const where = ["organization_id = ?", siteCond(s)]; const args = [s.organizationId, ...siteArgs(s)];
  if (status && TRANSITIONS[status]) { where.push("status = ?"); args.push(status); }
  if (customerId) { where.push("customer_id = ?"); args.push(Number(customerId)); }
  if (q) { const like = `%${String(q).slice(0, 80).replace(/[\\%_]/g, (m) => `\\${m}`)}%`; where.push("(number LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')"); args.push(like, like); }
  const pp = Math.min(100, Math.max(1, Number(perPage) || 25));
  const total = s.db.prepare(`SELECT COUNT(*) AS n FROM mk_shop_orders WHERE ${where.join(" AND ")}`).get(...args).n;
  const items = s.db.prepare(`SELECT * FROM mk_shop_orders WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, pp, (Math.max(1, Number(page) || 1) - 1) * pp);
  return { items, total, pages: Math.ceil(total / pp) };
}

// ── Paiement ────────────────────────────────────────────────────────────────────────────────
function recordPaymentAttempt(s, order, provider, providerRef) {
  const id = Number(s.db.prepare("INSERT INTO mk_shop_payments (organization_id, site_id, order_id, provider, provider_ref, amount_cents, currency, status) VALUES (?,?,?,?,?,?,?, 'pending')").run(s.organizationId, s.siteId ?? null, order.id, provider, providerRef || null, order.total_cents, order.currency).lastInsertRowid);
  s.db.prepare("UPDATE mk_shop_orders SET payment_status = 'pending', updated_at = datetime('now') WHERE id = ? AND payment_status IN ('unpaid','failed')").run(order.id);
  return id;
}

// Confirmation d'un paiement par une source AUTHENTIFIÉE (webhook signé, relecture auprès du fournisseur). Idempotent.
// → { status: "paid" | "already" | "mismatch" | "unknown" }
function markPaid(s, orderId, { provider, providerRef, amountCents, currency, actor }) {
  return transaction(s.db, () => {
    const order = getOrder(s, orderId);
    if (!order) return { status: "unknown" };
    if (order.payment_status === "paid") return { status: "already", order };
    if (Number(amountCents) !== order.total_cents || String(currency || "").toLowerCase() !== order.currency) {
      s.db.prepare("UPDATE mk_shop_orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(order.id);
      addEvent(s.db, order.id, { kind: "payment_mismatch", actor: actor || `provider:${provider}`, note: `Montant reçu ${amountCents} ${currency}, attendu ${order.total_cents} ${order.currency}` });
      return { status: "mismatch", order };
    }
    const late = order.status === "cancelled";
    s.db.prepare("UPDATE mk_shop_orders SET status = 'paid', payment_status = 'paid', paid_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(order.id);
    if (providerRef) s.db.prepare("UPDATE mk_shop_payments SET status = 'succeeded', updated_at = datetime('now') WHERE provider = ? AND provider_ref = ?").run(provider, providerRef);
    else s.db.prepare("UPDATE mk_shop_payments SET status = 'succeeded', updated_at = datetime('now') WHERE order_id = ? AND provider = ? AND status = 'pending'").run(order.id, provider);
    if (late && order.stock_released) {
      // Confirmation tardive d'une commande déjà annulée : l'argent est reçu, la commande est rétablie ; le stock est repris dans la limite du disponible.
      const items = s.db.prepare("SELECT * FROM mk_shop_order_items WHERE order_id = ?").all(order.id);
      for (const it of items) {
        if (!it.product_id) continue;
        const table = it.variant_id ? "mk_shop_variants" : "mk_shop_products";
        s.db.prepare(`UPDATE ${table} SET stock_qty = MAX(0, stock_qty - ?) WHERE id = ? AND manage_stock = 1`).run(it.quantity, it.variant_id || it.product_id);
      }
      s.db.prepare("UPDATE mk_shop_orders SET stock_released = 0 WHERE id = ?").run(order.id);
    }
    giftLists.onPaid(s, order.id); // liste de cadeaux : « offert » n'augmente qu'ici, à la commande payée
    addEvent(s.db, order.id, { kind: "paid", from: order.status, to: "paid", actor: actor || `provider:${provider}`, note: late ? "Confirmation tardive après annulation : commande rétablie, stock à vérifier." : null });
    return { status: "paid", order: getOrder(s, order.id), late };
  });
}

function markPaymentFailed(s, orderId, { provider, providerRef, reason, cancel = false }) {
  return transaction(s.db, () => {
    const order = getOrder(s, orderId);
    if (!order || order.payment_status === "paid") return { status: order ? "already" : "unknown" };
    if (providerRef) s.db.prepare("UPDATE mk_shop_payments SET status = 'failed', failure_reason = ?, updated_at = datetime('now') WHERE provider = ? AND provider_ref = ?").run(String(reason || "").slice(0, 200) || null, provider, providerRef);
    s.db.prepare("UPDATE mk_shop_orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(order.id);
    addEvent(s.db, order.id, { kind: "payment_failed", actor: `provider:${provider}`, note: reason });
    if (cancel) cancelOrder(s, order.id, { actor: `provider:${provider}`, note: "Paiement non abouti" });
    return { status: "failed" };
  });
}

// ── Cycle de vie ────────────────────────────────────────────────────────────────────────────
function cancelOrder(s, orderId, { actor, note }) {
  const order = getOrder(s, orderId);
  if (!order) throw new MarketingError("not_found", "Commande introuvable.");
  if (order.status !== "pending") throw new MarketingError("invalid_transition", "Seule une commande en attente de paiement peut être annulée ; une commande payée se rembourse.");
  transaction(s.db, () => {
    s.db.prepare("UPDATE mk_shop_orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(order.id);
    releaseStock(s, order);
    s.db.prepare("UPDATE mk_shop_payments SET status = 'cancelled', updated_at = datetime('now') WHERE order_id = ? AND status = 'pending'").run(order.id);
    const red = s.db.prepare("SELECT coupon_id FROM mk_shop_coupon_redemptions WHERE order_id = ?").get(order.id);
    if (red) { s.db.prepare("UPDATE mk_shop_coupons SET used_count = MAX(0, used_count - 1) WHERE id = ?").run(red.coupon_id); s.db.prepare("DELETE FROM mk_shop_coupon_redemptions WHERE order_id = ?").run(order.id); }
    addEvent(s.db, order.id, { kind: "status", from: "pending", to: "cancelled", actor, note });
  });
  return getOrder(s, order.id);
}

// Changement de statut par un administrateur. `canMarkPaid` : droit « shop.payments » (déjà vérifié par l'appelant côté serveur).
function changeStatus(s, orderId, to, { actor, note, canMarkPaid = false, tracking = null }) {
  const order = getOrder(s, orderId);
  if (!order) throw new MarketingError("not_found", "Commande introuvable.");
  if (!TRANSITIONS[order.status] || !TRANSITIONS[order.status].includes(to)) throw new MarketingError("invalid_transition", `Passage de « ${STATUS_LABELS[order.status]} » à « ${STATUS_LABELS[to] || to} » impossible.`);
  if (to === "cancelled") return cancelOrder(s, orderId, { actor, note });
  if (to === "paid") {
    if (!canMarkPaid) throw new MarketingError("forbidden", "Vous n'avez pas le droit de confirmer un paiement.");
    if (order.payment_method !== "manual") throw new MarketingError("invalid_transition", "Seul un paiement manuel peut être confirmé à la main : un paiement par carte se confirme par le fournisseur.");
    return markPaid(s, orderId, { provider: "manual", providerRef: null, amountCents: order.total_cents, currency: order.currency, actor }).order;
  }
  if (to === "refunded") {
    if (!canMarkPaid) throw new MarketingError("forbidden", "Vous n'avez pas le droit d'enregistrer un remboursement.");
    return transaction(s.db, () => {
      s.db.prepare("UPDATE mk_shop_orders SET status = 'refunded', payment_status = 'refunded', updated_at = datetime('now') WHERE id = ?").run(order.id);
      s.db.prepare("UPDATE mk_shop_payments SET status = 'refunded', updated_at = datetime('now') WHERE order_id = ? AND status = 'succeeded'").run(order.id);
      giftLists.onRefunded(s, order.id); // liste de cadeaux : les unités remboursées redeviennent disponibles
      addEvent(s.db, order.id, { kind: "status", from: order.status, to, actor, note: note || "Remboursement enregistré (à effectuer chez le fournisseur de paiement)." });
      return getOrder(s, order.id);
    });
  }
  return transaction(s.db, () => {
    const trk = to === "shipped" && tracking ? clean(tracking, 80) : null;
    s.db.prepare("UPDATE mk_shop_orders SET status = ?, tracking_number = COALESCE(?, tracking_number), updated_at = datetime('now') WHERE id = ?").run(to, trk, order.id);
    addEvent(s.db, order.id, { kind: "status", from: order.status, to, actor, note });
    return getOrder(s, order.id);
  });
}

// Commandes en attente de paiement depuis trop longtemps : annulées, stock rendu. Appelée au passage en caisse (aucune tâche de fond requise).
function expireStale(s, minutes = 60) {
  const cutoff = new Date(Date.now() - minutes * 60000).toISOString().slice(0, 19).replace("T", " ");
  const rows = s.db.prepare(`SELECT id FROM mk_shop_orders WHERE organization_id = ? AND ${siteCond(s)} AND status = 'pending' AND payment_method <> 'manual' AND created_at < ?`).all(s.organizationId, ...siteArgs(s), cutoff);
  for (const r of rows) { try { cancelOrder(s, r.id, { actor: "system", note: "Délai de paiement dépassé" }); } catch { /* déjà traitée */ } }
  return rows.length;
}

// Commande de réassort d'un abonnement : créée DIRECTEMENT « payée » quand le fournisseur confirme une facture payée (jamais avant).
// À appeler dans une transaction. La clé d'idempotence (une par facture) et l'unicité du paiement empêchent tout doublon.
// Le stock est décompté s'il est géré ; s'il manque, la commande est quand même créée (l'argent est encaissé) avec une note « stock insuffisant ».
function createSubscriptionOrder(s, d) {
  const settings = store.getSettings(s);
  const number = nextNumber(s, settings);
  const ship = JSON.stringify(d.shippingAddress || {});
  const info = s.db.prepare(`INSERT INTO mk_shop_orders (organization_id, site_id, number, customer_id, email, status, payment_status, payment_method, currency, prices_include_tax, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents,
    shipping_method_name, billing_address, shipping_address, tax_lines, idempotency_key, paid_at) VALUES (?,?,?,?,?, 'paid','paid','stripe',?,?,?,0,0,0,?,?, '{}', ?, '[]', ?, datetime('now'))`)
    .run(s.organizationId, s.siteId ?? null, number, d.customerId || null, d.email, d.currency, settings.prices_include_tax, d.totalCents, d.totalCents, "Abonnement (livraison incluse)", ship, d.idempotencyKey);
  const orderId = Number(info.lastInsertRowid);
  s.db.prepare("INSERT INTO mk_shop_order_items (order_id, product_id, variant_id, name, variant_label, sku, quantity, unit_price_cents, line_subtotal_cents, discount_cents, tax_cents, requires_shipping, weight_grams) VALUES (?,?,?,?,?,?,1,?,?,0,0,?,?)")
    .run(orderId, d.productId || null, d.variantId || null, d.name, d.variantLabel || null, d.sku || null, d.totalCents, d.totalCents, d.requiresShipping ? 1 : 0, d.weightGrams || null);
  s.db.prepare("INSERT INTO mk_shop_payments (organization_id, site_id, order_id, provider, provider_ref, amount_cents, currency, status) VALUES (?,?,?,?,?,?,?, 'succeeded')").run(s.organizationId, s.siteId ?? null, orderId, "stripe", d.providerRef, d.totalCents, d.currency);
  addEvent(s.db, orderId, { kind: "created", to: "paid", actor: "provider:stripe", note: d.note || "Commande de réassort d'abonnement" });
  addEvent(s.db, orderId, { kind: "paid", from: "pending", to: "paid", actor: "provider:stripe", note: `Facture ${d.providerRef}` });
  if (d.productId) {
    const table = d.variantId ? "mk_shop_variants" : "mk_shop_products";
    const id = d.variantId || d.productId;
    const row = s.db.prepare(`SELECT manage_stock FROM ${table} WHERE id = ?`).get(id);
    if (row && row.manage_stock === 1) {
      const r = s.db.prepare(`UPDATE ${table} SET stock_qty = stock_qty - 1 WHERE id = ? AND stock_qty >= 1`).run(id);
      if (r.changes) s.db.prepare("INSERT INTO mk_shop_stock_movements (organization_id, site_id, product_id, variant_id, delta, reason, order_id) VALUES (?,?,?,?,?, 'order', ?)").run(s.organizationId, s.siteId ?? null, d.productId, d.variantId || null, -1, orderId);
      else addEvent(s.db, orderId, { kind: "stock_short", actor: "system", note: "Stock insuffisant pour ce réassort déjà payé : à traiter à la main (expédier plus tard ou rembourser)." });
    }
  }
  return getOrder(s, orderId);
}

module.exports = { createSubscriptionOrder, TRANSITIONS, STATUS_LABELS, createFromCart, getOrder, orderByNumber, orderDetail, listOrders, recordPaymentAttempt, markPaid, markPaymentFailed, cancelOrder, changeStatus, expireStale, addEvent };
