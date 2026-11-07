// Abonnements récurrents (box mensuelle, réassort) — migration 139. Désactivé par défaut : sans formule d'abonnement sur un produit ET sans clés Stripe du serveur, rien ne change dans la boutique.
//  - Le vendeur définit des FORMULES par produit (récurrence, prix tout compris, remise explicite facultative). L'achat unique reste toujours possible à côté.
//  - Le client s'abonne par Stripe Checkout (mode « subscription ») : prix et récurrence sont affichés avant le paiement, aucune case précochée, aucun frais caché.
//  - Une commande de réassort n'est créée QUE lorsque Stripe confirme une facture payée (webhook signé), une seule fois par facture (idempotent).
//  - Pause, reprise, changement de formule et RÉSILIATION EN UN CLIC sont possibles à tout moment, par le compte client ou par un lien de gestion signé (invité).
// Les appels à Stripe passent par stripeClient.js (injectable : les tests utilisent un faux Stripe). Rien n'a été essayé contre le vrai Stripe.
const crypto = require("node:crypto");
const { MarketingError } = require("../errors");
const { transaction } = require("../db/tx");
const catalog = require("./catalog");
const store = require("./store");
const orders = require("./orders");
const access = require("./access");
const age = require("./age");
const personalization = require("./personalization");
const notify = require("./notify");
const stripe = require("./stripeClient");

const siteCond = (s, a = "") => (s.siteId == null ? `${a}site_id IS NULL` : `${a}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const secret = () => process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "kolakisa-dev";
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f<>]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const sqlFromUnix = (sec) => (Number.isFinite(Number(sec)) && Number(sec) > 0 ? new Date(Number(sec) * 1000).toISOString().slice(0, 19).replace("T", " ") : null);
const MAX_PLANS = 6;
const unavailable = () => new MarketingError("payment_unavailable", "Le service d'abonnement est momentanément indisponible. Rien n'a été modifié : vous pouvez réessayer.");

// ── Utilitaires de présentation ─────────────────────────────────────────────────────────────
const cadence = notify.cadenceOf;
const STATUS_LABELS = Object.freeze({ incomplete: "En cours de création", active: "Actif", paused: "En pause", past_due: "Paiement en échec", cancelled: "Résilié" });
const statusLabel = (sub) => (sub.status === "active" && sub.cancel_at_period_end ? "Résiliation programmée" : STATUS_LABELS[sub.status] || sub.status);

// Lien de gestion d'un abonnement (invité) : jeton lié à l'abonnement, jamais stocké.
function token(sub) { return crypto.createHmac("sha256", secret()).update(`shop-sub:${sub.id}:${sub.email}:${sub.created_at}`).digest("hex").slice(0, 32); }
function tokenOk(sub, given) { const a = Buffer.from(token(sub)); const b = Buffer.from(String(given || "")); return a.length === b.length && crypto.timingSafeEqual(a, b); }
const manageUrl = (sub) => `${sub.origin || ""}/boutique/abonnements/${sub.id}?k=${token(sub)}`;

// ── Formules ────────────────────────────────────────────────────────────────────────────────
function listPlans(s, productId) {
  return s.db.prepare(`SELECT * FROM mk_shop_sub_plans WHERE organization_id = ? AND ${siteCond(s)} AND product_id = ? ORDER BY position, id`).all(s.organizationId, ...siteArgs(s), Number(productId) || 0);
}
function getPlan(s, id) {
  return s.db.prepare(`SELECT * FROM mk_shop_sub_plans WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(id) || 0, s.organizationId, ...siteArgs(s)) || null;
}
// Remise AFFICHÉE : seulement celle que le vendeur a saisie ET qui reste exacte par rapport au prix actuel (à 1 point près) ; sinon aucune allégation.
function shownDiscount(plan, unitCents) {
  if (!plan.discount_percent || !unitCents || plan.price_cents >= unitCents) return 0;
  const real = Math.round((1 - plan.price_cents / unitCents) * 100);
  return Math.abs(real - plan.discount_percent) <= 1 ? plan.discount_percent : 0;
}
function savePlan(s, productId, input) {
  const product = catalog.getProduct(s, productId);
  if (!product) throw new MarketingError("not_found", "Produit introuvable.");
  if (product.type === "grouped") throw new MarketingError("invalid_field", "Un produit groupé ne peut pas être abonnable.");
  const label = clean(input.label, 60);
  if (!label) throw new MarketingError("invalid_field", "Donnez un nom à la formule (ex. « Chaque mois »).");
  const unit = String(input.interval_unit);
  if (!["week", "month"].includes(unit)) throw new MarketingError("invalid_field", "La récurrence doit être en semaines ou en mois.");
  const count = Number(input.interval_count);
  if (!Number.isInteger(count) || count < 1 || count > 12) throw new MarketingError("invalid_field", "La récurrence doit être un nombre entier entre 1 et 12.");
  const discount = input.discount_percent === undefined || input.discount_percent === "" ? 0 : Number(input.discount_percent);
  if (!Number.isInteger(discount) || discount < 0 || discount > 90) throw new MarketingError("invalid_field", "La remise est un pourcentage entier entre 0 et 90.");
  let price = input.price_cents === undefined || input.price_cents === "" || input.price_cents === null ? null : Number(input.price_cents);
  if (price === null) {
    if (!discount) throw new MarketingError("invalid_field", "Indiquez le prix de la formule (ou une remise sur le prix du produit).");
    price = Math.round(product.price_cents * (100 - discount) / 100);
  } else if (discount && Math.abs(Math.round((1 - price / product.price_cents) * 100) - discount) > 1) {
    throw new MarketingError("invalid_field", "La remise annoncée ne correspond pas au prix de la formule. Corrigez l'un des deux : aucune remise inexacte n'est publiée.");
  }
  if (!Number.isInteger(price) || price < stripe.MIN_AMOUNT_CENTS || price > 100000000) throw new MarketingError("invalid_field", `Le prix doit être d'au moins ${(stripe.MIN_AMOUNT_CENTS / 100).toFixed(2)} €.`);
  if (listPlans(s, productId).length >= MAX_PLANS) throw new MarketingError("invalid_field", `Six formules au plus par produit.`);
  const pos = s.db.prepare("SELECT COALESCE(MAX(position), 0) + 1 AS n FROM mk_shop_sub_plans WHERE product_id = ?").get(product.id).n;
  return Number(s.db.prepare("INSERT INTO mk_shop_sub_plans (organization_id, site_id, product_id, label, interval_unit, interval_count, price_cents, discount_percent, position) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(s.organizationId, s.siteId ?? null, product.id, label, unit, count, price, discount, pos).lastInsertRowid);
}
function removePlan(s, id) {
  const r = s.db.prepare(`DELETE FROM mk_shop_sub_plans WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(Number(id) || 0, s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Formule introuvable.");
}

// Offre affichée sur la fiche produit ; null = rien à montrer (aucune formule, Stripe non configuré, produit indisponible ou soumis à un contrôle d'âge/personnalisation).
function offerFor(s, product) {
  if (!product || !stripe.configured() || !product.inStock || product.status !== "published") return null;
  if (age.requiredForProduct(s.db, product.id) || personalization.get(s.db, product.id)) return null;
  const plans = listPlans(s, product.id);
  if (!plans.length) return null;
  const g = access.gate(s, product.id);
  if (!g.purchasable) return null;
  const unit = product.isVariable ? 0 : product.priceFromCents;
  return { plans: plans.map((p) => ({ ...p, cadence: cadence(p), shownDiscount: shownDiscount(p, unit) })), requiresShipping: product.requires_shipping === 1 };
}

// ── Stripe : produit et prix créés une fois, puis réutilisés ───────────────────────────────
async function ensureStripePrice(s, product, plan, currency) {
  let sp = s.db.prepare("SELECT stripe_product_id FROM mk_shop_sub_products WHERE product_id = ?").get(product.id);
  if (!sp) {
    const created = await stripe.request("POST", "/v1/products", { name: String(product.name).slice(0, 250), "metadata[kw_product]": product.id });
    if (!created || !created.id) throw new Error("produit Stripe non créé");
    s.db.prepare("INSERT OR IGNORE INTO mk_shop_sub_products (product_id, stripe_product_id) VALUES (?,?)").run(product.id, created.id);
    sp = s.db.prepare("SELECT stripe_product_id FROM mk_shop_sub_products WHERE product_id = ?").get(product.id);
  }
  const key = `${plan.price_cents}|${currency}|${plan.interval_unit}|${plan.interval_count}`;
  if (plan.stripe_price_id && plan.stripe_price_key === key) return plan.stripe_price_id;
  const price = await stripe.request("POST", "/v1/prices", { product: sp.stripe_product_id, currency, unit_amount: plan.price_cents, "recurring[interval]": plan.interval_unit, "recurring[interval_count]": plan.interval_count, "metadata[kw_plan]": plan.id });
  if (!price || !price.id) throw new Error("prix Stripe non créé");
  s.db.prepare("UPDATE mk_shop_sub_plans SET stripe_price_id = ?, stripe_price_key = ? WHERE id = ?").run(price.id, key, plan.id);
  return price.id;
}

// ── Souscription ────────────────────────────────────────────────────────────────────────────
function shippingCountries(s, settings) {
  const set = new Set();
  for (const z of store.listZones(s)) for (const c of z.countries) if (/^[A-Z]{2}$/.test(c)) set.add(c);
  if (!set.size && settings.default_country) set.add(settings.default_country);
  return [...set];
}

// → { url, subscription }. Rien n'est débité ici : le client est envoyé sur la page de paiement hébergée par Stripe, qui affiche prix et récurrence.
async function startCheckout(s, { productId, planId, variantId, email, customerId, origin }) {
  if (!stripe.configured()) throw new MarketingError("payment_unavailable", "L'abonnement n'est pas disponible pour le moment.");
  const settings = store.getSettings(s);
  const product = catalog.productById(s, productId);
  if (!product || product.status !== "published") throw new MarketingError("not_found", "Ce produit n'existe pas ou n'est plus en vente.");
  const offer = offerFor(s, product);
  if (!offer) throw new MarketingError("invalid_field", "Ce produit ne propose pas d'abonnement.");
  const plan = offer.plans.find((p) => p.id === Number(planId));
  if (!plan) throw new MarketingError("invalid_field", "Choisissez une formule d'abonnement.");
  let variant = null;
  if (product.isVariable) {
    variant = product.variants.find((v) => v.id === Number(variantId));
    if (!variant) throw new MarketingError("invalid_field", "Choisissez une variante.");
    if (variant.manage_stock && variant.stock_qty <= 0) throw new MarketingError("stock", "Cette variante est en rupture de stock.");
  } else if (variantId) throw new MarketingError("invalid_field", "Ce produit n'a pas de variante.");
  const mail = clean(email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw new MarketingError("invalid_field", "Une adresse e-mail valide est obligatoire.");
  let countries = [];
  if (product.requires_shipping === 1) {
    countries = shippingCountries(s, settings);
    if (!countries.length) throw new MarketingError("payment_unavailable", "La livraison de cette boutique n'est pas encore configurée.");
  }
  const id = Number(s.db.prepare(`INSERT INTO mk_shop_subscriptions (organization_id, site_id, product_id, variant_id, plan_id, customer_id, email, status, product_name, variant_label, plan_label, price_cents, currency, interval_unit, interval_count, origin)
    VALUES (?,?,?,?,?,?,?, 'incomplete', ?,?,?,?,?,?,?,?)`).run(s.organizationId, s.siteId ?? null, product.id, variant ? variant.id : null, plan.id, customerId || null, mail, product.name, variant ? Object.values(variant.options).join(" / ") : null, plan.label, plan.price_cents, settings.currency, plan.interval_unit, plan.interval_count, origin || null).lastInsertRowid);
  const sub = getAny(s.db, id);
  try {
    const priceId = await ensureStripePrice(s, product, plan, settings.currency);
    const params = {
      mode: "subscription", client_reference_id: `sub:${id}`, customer_email: mail,
      success_url: `${origin}/boutique/abonnements/merci?s=${id}&k=${token(sub)}`, cancel_url: `${origin}/boutique/produit/${encodeURIComponent(product.slug)}`,
      "line_items": [{ price: priceId, quantity: 1 }],
      "subscription_data": { metadata: { kw_sub: id } }, metadata: { kw_sub: id },
    };
    if (countries.length) params.shipping_address_collection = { allowed_countries: countries };
    const session = await stripe.request("POST", "/v1/checkout/sessions", params);
    if (!session || !session.id || !session.url) throw new Error("réponse sans adresse de paiement");
    s.db.prepare("UPDATE mk_shop_subscriptions SET stripe_session_id = ?, updated_at = datetime('now') WHERE id = ?").run(session.id, id);
    return { url: session.url, subscription: getAny(s.db, id) };
  } catch (error) {
    console.error(`[KOLAKISA] Abonnement ${id} : page de paiement non créée : ${error.message}`);
    s.db.prepare("UPDATE mk_shop_subscriptions SET status = 'cancelled', cancelled_at = datetime('now'), cancelled_by = 'system', updated_at = datetime('now') WHERE id = ?").run(id);
    throw unavailable();
  }
}

// ── Lecture ─────────────────────────────────────────────────────────────────────────────────
const getAny = (db, id) => db.prepare("SELECT * FROM mk_shop_subscriptions WHERE id = ?").get(Number(id) || 0) || null;
function get(s, id) {
  return s.db.prepare(`SELECT * FROM mk_shop_subscriptions WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(id) || 0, s.organizationId, ...siteArgs(s)) || null;
}
// Abonnements visibles du client (ceux jamais payés n'apparaissent pas).
function listForCustomer(s, customerId) {
  return s.db.prepare(`SELECT * FROM mk_shop_subscriptions WHERE organization_id = ? AND ${siteCond(s)} AND customer_id = ? AND status <> 'incomplete' AND NOT (status = 'cancelled' AND stripe_subscription_id IS NULL) ORDER BY id DESC`).all(s.organizationId, ...siteArgs(s), Number(customerId) || 0);
}
function listByEmail(s, email) {
  return s.db.prepare(`SELECT * FROM mk_shop_subscriptions WHERE organization_id = ? AND ${siteCond(s)} AND email = ? AND status NOT IN ('incomplete', 'cancelled') ORDER BY id DESC`).all(s.organizationId, ...siteArgs(s), String(email || "").trim().toLowerCase());
}
function hasAny(s) {
  return Boolean(s.db.prepare(`SELECT 1 FROM mk_shop_sub_plans WHERE organization_id = ? AND ${siteCond(s)} LIMIT 1`).get(s.organizationId, ...siteArgs(s))
    || s.db.prepare(`SELECT 1 FROM mk_shop_subscriptions WHERE organization_id = ? AND ${siteCond(s)} AND status <> 'incomplete' LIMIT 1`).get(s.organizationId, ...siteArgs(s)));
}
function ordersOf(s, subId) {
  return s.db.prepare(`SELECT o.id, o.number, o.status, o.total_cents, o.currency, o.created_at, so.kind, so.stripe_invoice_id FROM mk_shop_sub_orders so JOIN mk_shop_orders o ON o.id = so.order_id WHERE so.subscription_id = ? AND o.organization_id = ? AND ${siteCond(s, "o.")} ORDER BY so.id DESC`).all(Number(subId) || 0, s.organizationId, ...siteArgs(s));
}
function eventsOf(db, subId) { return db.prepare("SELECT * FROM mk_shop_sub_events WHERE subscription_id = ? ORDER BY id DESC LIMIT 50").all(Number(subId) || 0); }
function adminList(s, { status, page = 1, perPage = 25 } = {}) {
  const where = ["organization_id = ?", siteCond(s), "status <> 'incomplete'"]; const args = [s.organizationId, ...siteArgs(s)];
  if (status && Object.keys(STATUS_LABELS).includes(status) && status !== "incomplete") { where.push("status = ?"); args.push(status); }
  const pp = Math.min(100, Math.max(1, Number(perPage) || 25));
  const total = s.db.prepare(`SELECT COUNT(*) AS n FROM mk_shop_subscriptions WHERE ${where.join(" AND ")}`).get(...args).n;
  const items = s.db.prepare(`SELECT * FROM mk_shop_subscriptions WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, pp, (Math.max(1, Number(page) || 1) - 1) * pp);
  return { items: items.map((x) => ({ ...x, orders: ordersOf(s, x.id) })), total, pages: Math.ceil(total / pp) };
}

const logEvent = (db, subId, kind, actor, note) => db.prepare("INSERT INTO mk_shop_sub_events (subscription_id, kind, actor, note) VALUES (?,?,?,?)").run(subId, kind, actor, note ? String(note).slice(0, 300) : null);
const scopeOf = (sub) => ({ organizationId: sub.organization_id, siteId: sub.site_id });
const shopName = (db, sub) => { try { const r = db.prepare("SELECT name FROM mk_sites WHERE id = ?").get(sub.site_id); return r ? r.name : ""; } catch { return ""; } };
function mail(db, sub, event, extra = {}) {
  const s = { db, ...scopeOf(sub) };
  const fresh = getAny(db, sub.id) || sub;
  return notify.notifySubscription(s, fresh, event, { manageUrl: event === "cancelled" || event === "cancelled_by_seller" ? "" : manageUrl(fresh), shopName: shopName(db, sub), ...extra });
}

// ── État local ← objet « subscription » de Stripe (webhook ou réponse à nos appels) ────────
function stateFrom(obj) {
  if (obj.status === "canceled" || obj.status === "incomplete_expired") return "cancelled";
  if (obj.pause_collection) return "paused";
  if (obj.status === "past_due" || obj.status === "unpaid") return "past_due";
  if (obj.status === "incomplete") return "incomplete";
  return "active";
}
// → { before, after }. Idempotent : rejouer le même objet ne change rien.
function applySubscriptionObject(db, sub, obj, { actor = "provider:stripe" } = {}) {
  const item = obj.items && obj.items.data && obj.items.data[0] ? obj.items.data[0] : null;
  const status = stateFrom(obj);
  const end = sqlFromUnix(obj.current_period_end != null ? obj.current_period_end : item && item.current_period_end) || sub.current_period_end;
  const cancelAt = obj.cancel_at_period_end === undefined ? sub.cancel_at_period_end : (obj.cancel_at_period_end ? 1 : 0);
  // La formule suit le prix Stripe réellement appliqué (changement fait chez Stripe ou par nous)
  let plan = null;
  if (item && item.price && item.price.id) plan = db.prepare("SELECT * FROM mk_shop_sub_plans WHERE stripe_price_id = ? AND organization_id = ? AND (site_id IS ? )").get(item.price.id, sub.organization_id, sub.site_id);
  const keepIncomplete = sub.status !== "incomplete" && status === "incomplete" ? sub.status : status;
  db.prepare(`UPDATE mk_shop_subscriptions SET status = ?, cancel_at_period_end = ?, current_period_end = ?, stripe_subscription_id = COALESCE(stripe_subscription_id, ?), stripe_item_id = COALESCE(?, stripe_item_id), stripe_customer_id = COALESCE(stripe_customer_id, ?),
    cancelled_at = CASE WHEN ? = 'cancelled' AND cancelled_at IS NULL THEN datetime('now') ELSE cancelled_at END, cancelled_by = CASE WHEN ? = 'cancelled' AND cancelled_by IS NULL THEN ? ELSE cancelled_by END, updated_at = datetime('now') WHERE id = ?`)
    .run(keepIncomplete, cancelAt, end, obj.id || null, item ? item.id : null, typeof obj.customer === "string" ? obj.customer : null, keepIncomplete, keepIncomplete, actor, sub.id);
  if (plan && plan.id !== sub.plan_id) {
    db.prepare("UPDATE mk_shop_subscriptions SET plan_id = ?, plan_label = ?, price_cents = ?, interval_unit = ?, interval_count = ? WHERE id = ?").run(plan.id, plan.label, plan.price_cents, plan.interval_unit, plan.interval_count, sub.id);
    logEvent(db, sub.id, "plan_changed", actor, `Formule : ${plan.label}`);
  }
  if (sub.status !== keepIncomplete) logEvent(db, sub.id, "status", actor, `${sub.status} → ${keepIncomplete}`);
  return { before: sub, after: getAny(db, sub.id) };
}

// ── Webhooks Stripe ─────────────────────────────────────────────────────────────────────────
const metaOf = (o) => (o && ((o.subscription_details && o.subscription_details.metadata) || (o.parent && o.parent.subscription_details && o.parent.subscription_details.metadata) || (o.lines && o.lines.data && o.lines.data[0] && o.lines.data[0].metadata) || o.metadata)) || {};
const subIdOf = (o) => (typeof o.subscription === "string" ? o.subscription : (o.parent && o.parent.subscription_details && o.parent.subscription_details.subscription) || null);
function locate(db, event, obj) {
  const t = event.type;
  if (t.startsWith("checkout.session.")) {
    const m = /^sub:(\d+)$/.exec(String(obj.client_reference_id || ""));
    return m ? getAny(db, m[1]) : null;
  }
  const sid = t.startsWith("customer.subscription.") ? obj.id : subIdOf(obj);
  let sub = sid ? db.prepare("SELECT * FROM mk_shop_subscriptions WHERE stripe_subscription_id = ?").get(sid) : null;
  if (!sub) { const m = metaOf(obj).kw_sub; if (m && /^\d+$/.test(String(m))) sub = getAny(db, m); }
  return sub || null;
}
// Événements concernés : ceux d'un abonnement de boutique (client_reference_id « sub:<id> » ou jeton kw_sub). Les autres abonnements Stripe du compte sont ignorés.
function isSubscriptionEvent(event) {
  const t = String((event && event.type) || ""); const obj = event && event.data && event.data.object ? event.data.object : {};
  if (t.startsWith("checkout.session.")) return obj.mode === "subscription" || /^sub:\d+$/.test(String(obj.client_reference_id || ""));
  return t.startsWith("invoice.") || t.startsWith("customer.subscription.");
}

function onceEvent(db, event) {
  if (!event.id) return true;
  return Boolean(db.prepare("INSERT OR IGNORE INTO mk_shop_webhook_events (provider, event_id) VALUES ('stripe', ?)").run(String(event.id)).changes);
}
const shipFrom = (o) => {
  const sd = o.shipping_details || (o.collected_information && o.collected_information.shipping_details) || null;
  if (!sd || !sd.address) return null;
  const a = sd.address;
  return { name: clean(sd.name, 120), line1: clean(a.line1, 160), line2: clean(a.line2, 160), postal_code: clean(a.postal_code, 20), city: clean(a.city, 100), region: clean(a.state, 80), country: clean(a.country, 2).toUpperCase(), phone: "" };
};

// « Abonnement démarré » n'est noté (et l'e-mail de bienvenue envoyé) qu'UNE fois, que la facture ou la session arrive en premier.
function markStarted(db, subId) {
  if (db.prepare("SELECT 1 FROM mk_shop_sub_events WHERE subscription_id = ? AND kind = 'started'").get(subId)) return false;
  logEvent(db, subId, "started", "provider:stripe", "Première échéance payée");
  return true;
}

// Le client a payé la première échéance sur la page Stripe (ou le retour de page l'a constaté). Idempotent.
function applyCheckoutCompleted(db, session, sub) {
  return transaction(db, () => {
    const addr = shipFrom(session);
    db.prepare(`UPDATE mk_shop_subscriptions SET stripe_session_id = COALESCE(stripe_session_id, ?), stripe_customer_id = COALESCE(stripe_customer_id, ?), stripe_subscription_id = COALESCE(stripe_subscription_id, ?),
      shipping_address = CASE WHEN ? IS NOT NULL THEN ? ELSE shipping_address END,
      status = CASE WHEN status = 'incomplete' THEN 'active' ELSE status END, updated_at = datetime('now') WHERE id = ?`)
      .run(session.id || null, typeof session.customer === "string" ? session.customer : null, typeof session.subscription === "string" ? session.subscription : null, addr ? JSON.stringify(addr) : null, addr ? JSON.stringify(addr) : null, sub.id);
    if (addr) { // une facture arrivée avant la fin du paiement a pu créer la commande sans adresse
      for (const o of db.prepare("SELECT o.id FROM mk_shop_sub_orders so JOIN mk_shop_orders o ON o.id = so.order_id WHERE so.subscription_id = ? AND o.shipping_address = '{}'").all(sub.id))
        db.prepare("UPDATE mk_shop_orders SET shipping_address = ? WHERE id = ?").run(JSON.stringify(addr), o.id);
    }
    return { first: markStarted(db, sub.id), sub: getAny(db, sub.id) };
  });
}

// → { handled, duplicate?, retry? }. L'appelant a DÉJÀ vérifié la signature. Idempotent : l'identifiant d'événement est noté dans la même transaction que le traitement.
function handleStripeEvent(db, event) {
  const obj = event && event.data && event.data.object ? event.data.object : {};
  const sub = locate(db, event, obj);
  if (!sub) return { handled: false };
  const s = { db, ...scopeOf(sub) };
  const after = []; // e-mails à envoyer APRÈS validation de la transaction
  const result = transaction(db, () => {
    if (!onceEvent(db, event)) return { handled: true, duplicate: true };
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        if (obj.payment_status && obj.payment_status !== "paid" && obj.payment_status !== "no_payment_required") break;
        const r = applyCheckoutCompleted(db, obj, sub);
        if (r.first) after.push(["started"]);
        break;
      }
      case "checkout.session.expired":
        if (sub.status === "incomplete") db.prepare("UPDATE mk_shop_subscriptions SET status = 'cancelled', cancelled_at = datetime('now'), cancelled_by = 'system', updated_at = datetime('now') WHERE id = ?").run(sub.id);
        break;
      case "invoice.paid": {
        const invoiceId = String(obj.id || "");
        if (!invoiceId) break;
        if (db.prepare("SELECT 1 FROM mk_shop_sub_orders WHERE stripe_invoice_id = ?").get(invoiceId)) break; // facture déjà traitée : aucune seconde commande
        const stripeSubId = subIdOf(obj);
        if (stripeSubId) db.prepare("UPDATE mk_shop_subscriptions SET stripe_subscription_id = COALESCE(stripe_subscription_id, ?), stripe_customer_id = COALESCE(stripe_customer_id, ?) WHERE id = ?").run(stripeSubId, typeof obj.customer === "string" ? obj.customer : null, sub.id);
        const fresh = getAny(db, sub.id);
        const total = Number(obj.amount_paid);
        if (!Number.isInteger(total) || total < 0) throw new Error("montant de facture invalide");
        const product = fresh.product_id ? db.prepare("SELECT sku, weight_grams, requires_shipping FROM mk_shop_products WHERE id = ?").get(fresh.product_id) : null;
        const variant = fresh.variant_id ? db.prepare("SELECT sku, weight_grams FROM mk_shop_variants WHERE id = ?").get(fresh.variant_id) : null;
        let ship = {}; try { ship = JSON.parse(fresh.shipping_address || "{}"); } catch { ship = {}; }
        const prior = db.prepare("SELECT COUNT(*) AS n FROM mk_shop_sub_orders WHERE subscription_id = ?").get(sub.id).n;
        const order = orders.createSubscriptionOrder(s, {
          email: fresh.email, customerId: fresh.customer_id, currency: String(obj.currency || fresh.currency).toLowerCase(), totalCents: total, shippingAddress: ship, idempotencyKey: `sub-invoice:${invoiceId}`, providerRef: invoiceId,
          productId: fresh.product_id, variantId: fresh.variant_id, name: fresh.product_name, variantLabel: fresh.variant_label, sku: (variant && variant.sku) || (product && product.sku) || null,
          weightGrams: (variant && variant.weight_grams) || (product && product.weight_grams) || null, requiresShipping: product ? product.requires_shipping === 1 : true,
          note: `Réassort de l'abonnement n° ${fresh.id} (${fresh.plan_label})`,
        });
        db.prepare("INSERT INTO mk_shop_sub_orders (subscription_id, order_id, stripe_invoice_id, kind, amount_cents) VALUES (?,?,?,?,?)").run(sub.id, order.id, invoiceId, prior === 0 ? "first" : "renewal", total);
        const line = obj.lines && obj.lines.data && obj.lines.data[0];
        const end = sqlFromUnix(line && line.period && line.period.end);
        db.prepare("UPDATE mk_shop_subscriptions SET status = CASE WHEN status IN ('incomplete','past_due') THEN 'active' ELSE status END, current_period_end = COALESCE(?, current_period_end), updated_at = datetime('now') WHERE id = ?").run(end, sub.id);
        logEvent(db, sub.id, prior === 0 ? "first_order" : "renewal_order", "provider:stripe", `Commande ${order.number} (facture ${invoiceId})`);
        after.push(["order", order, markStarted(db, sub.id)]);
        break;
      }
      case "invoice.payment_failed": {
        if (sub.status === "cancelled" || sub.status === "past_due") break;
        db.prepare("UPDATE mk_shop_subscriptions SET status = 'past_due', updated_at = datetime('now') WHERE id = ?").run(sub.id);
        logEvent(db, sub.id, "payment_failed", "provider:stripe", `Facture ${String(obj.id || "").slice(0, 60)}`);
        after.push(["payment_failed", obj.hosted_invoice_url]);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const o = event.type === "customer.subscription.deleted" ? { ...obj, status: "canceled" } : obj;
        const { before, after: now } = applySubscriptionObject(db, sub, o);
        if (before.status !== "cancelled" && now.status === "cancelled") after.push(["cancelled"]);
        else if (before.status !== "past_due" && now.status === "past_due") after.push(["payment_failed"]);
        break;
      }
      default: break;
    }
    return { handled: true, subscriptionId: sub.id };
  });
  if (result.duplicate) return result;
  for (const [kind, a, b] of after) {
    try {
      if (kind === "order") {
        const extra = [`Prochaine échéance et gestion de l'abonnement : ${manageUrl(getAny(db, sub.id))}`, "Résiliation en un clic depuis ce lien."].join("\n");
        if (b) mail(db, sub, "started");
        notify.notify(s, a, "order_paid", { extra });
      } else mail(db, sub, kind, kind === "payment_failed" && a ? { extra: `Mettre à jour le moyen de paiement ou régler la facture : ${a}` } : {});
    } catch (error) { console.error(`[KOLAKISA] Abonnement ${sub.id} : e-mail ${kind} : ${error.message}`); }
  }
  return result;
}

// Retour du client sur le site : si le webhook n'est pas encore arrivé, on relit la session auprès de Stripe (sans jamais se fier à l'adresse de retour seule).
async function reconcile(s, sub) {
  if (sub.status !== "incomplete" || !sub.stripe_session_id) return get(s, sub.id);
  try {
    const session = await stripe.request("GET", `/v1/checkout/sessions/${encodeURIComponent(sub.stripe_session_id)}`);
    if (session && session.status === "complete" && (session.payment_status === "paid" || session.payment_status === "no_payment_required")) {
      const r = applyCheckoutCompleted(s.db, { ...session, client_reference_id: `sub:${sub.id}` }, sub);
      if (r.first) mail(s.db, sub, "started");
    }
  } catch (error) { console.error(`[KOLAKISA] Abonnement ${sub.id} : relecture de session : ${error.message}`); }
  return get(s, sub.id);
}

// ── Actions du client / du vendeur ──────────────────────────────────────────────────────────
async function call(method, path, params) { try { return await stripe.request(method, path, params); } catch (error) { console.error(`[KOLAKISA] Abonnement : Stripe ${method} ${path} : ${error.message}`); throw unavailable(); } }
function needStripeSub(sub) { if (!sub.stripe_subscription_id) throw new MarketingError("invalid_transition", "Cet abonnement n'est pas encore actif."); }

async function pause(s, sub, actor = "customer") {
  if (sub.status === "paused") return sub;
  if (sub.status !== "active" || sub.cancel_at_period_end) throw new MarketingError("invalid_transition", "Seul un abonnement actif, non résilié, peut être mis en pause.");
  needStripeSub(sub);
  const obj = await call("POST", `/v1/subscriptions/${encodeURIComponent(sub.stripe_subscription_id)}`, { "pause_collection[behavior]": "void" });
  applySubscriptionObject(s.db, sub, { ...obj, pause_collection: obj.pause_collection || { behavior: "void" } }, { actor });
  logEvent(s.db, sub.id, "paused", actor);
  mail(s.db, sub, "paused");
  return get(s, sub.id);
}
async function resume(s, sub, actor = "customer") {
  if (sub.status === "active" && !sub.cancel_at_period_end) return sub;
  if (sub.status !== "paused") throw new MarketingError("invalid_transition", "Seul un abonnement en pause peut être repris.");
  needStripeSub(sub);
  const obj = await call("POST", `/v1/subscriptions/${encodeURIComponent(sub.stripe_subscription_id)}`, { pause_collection: "" });
  applySubscriptionObject(s.db, sub, { ...obj, pause_collection: null }, { actor });
  logEvent(s.db, sub.id, "resumed", actor);
  mail(s.db, sub, "resumed");
  return get(s, sub.id);
}
async function changePlan(s, sub, planId, actor = "customer") {
  if (!["active", "paused"].includes(sub.status) || sub.cancel_at_period_end) throw new MarketingError("invalid_transition", "Vous ne pouvez changer de formule que sur un abonnement actif ou en pause, non résilié.");
  needStripeSub(sub);
  const plan = getPlan(s, planId);
  if (!plan || plan.product_id !== sub.product_id) throw new MarketingError("invalid_field", "Cette formule n'existe pas pour ce produit.");
  if (plan.id === sub.plan_id) return sub;
  const product = catalog.getProduct(s, sub.product_id);
  const currency = store.getSettings(s).currency;
  const priceId = await ensureStripePriceSafe(s, product, plan, currency);
  let itemId = sub.stripe_item_id;
  if (!itemId) {
    const cur = await call("GET", `/v1/subscriptions/${encodeURIComponent(sub.stripe_subscription_id)}`);
    itemId = cur && cur.items && cur.items.data && cur.items.data[0] ? cur.items.data[0].id : null;
    if (!itemId) throw unavailable();
  }
  // Pas de rattrapage ni de frais : le nouveau prix s'applique à la prochaine échéance, la date d'échéance ne bouge pas.
  const obj = await call("POST", `/v1/subscriptions/${encodeURIComponent(sub.stripe_subscription_id)}`, { "items[0][id]": itemId, "items[0][price]": priceId, proration_behavior: "none", billing_cycle_anchor: "unchanged" });
  applySubscriptionObject(s.db, sub, obj, { actor });
  s.db.prepare("UPDATE mk_shop_subscriptions SET plan_id = ?, plan_label = ?, price_cents = ?, interval_unit = ?, interval_count = ?, currency = ?, updated_at = datetime('now') WHERE id = ?").run(plan.id, plan.label, plan.price_cents, plan.interval_unit, plan.interval_count, currency, sub.id);
  logEvent(s.db, sub.id, "plan_changed", actor, `Formule : ${plan.label}`);
  mail(s.db, sub, "plan_changed");
  return get(s, sub.id);
}
async function ensureStripePriceSafe(s, product, plan, currency) { try { return await ensureStripePrice(s, product, plan, currency); } catch (error) { console.error(`[KOLAKISA] Abonnement : prix Stripe : ${error.message}`); throw unavailable(); } }

// Résiliation EN UN CLIC (une seule requête, aucune étape dissuasive). Abonnement actif : arrêt à la fin de la période déjà payée.
// En pause, impayé ou non finalisé : arrêt immédiat (rien n'est dû). `immediate` : arrêt immédiat demandé (vendeur).
async function cancel(s, sub, { actor = "customer", immediate = false } = {}) {
  if (sub.status === "cancelled" || (sub.cancel_at_period_end && !immediate)) return { sub: get(s, sub.id), already: true };
  const now = immediate || sub.status !== "active" || !sub.current_period_end;
  if (!sub.stripe_subscription_id) {
    s.db.prepare("UPDATE mk_shop_subscriptions SET status = 'cancelled', cancelled_at = datetime('now'), cancelled_by = ?, updated_at = datetime('now') WHERE id = ?").run(actor, sub.id);
  } else if (now) {
    await call("DELETE", `/v1/subscriptions/${encodeURIComponent(sub.stripe_subscription_id)}`);
    s.db.prepare("UPDATE mk_shop_subscriptions SET status = 'cancelled', cancel_at_period_end = 0, cancelled_at = datetime('now'), cancelled_by = ?, updated_at = datetime('now') WHERE id = ?").run(actor, sub.id);
  } else {
    const obj = await call("POST", `/v1/subscriptions/${encodeURIComponent(sub.stripe_subscription_id)}`, { cancel_at_period_end: "true" });
    applySubscriptionObject(s.db, sub, { ...obj, cancel_at_period_end: true }, { actor });
    s.db.prepare("UPDATE mk_shop_subscriptions SET cancel_at_period_end = 1 WHERE id = ?").run(sub.id);
  }
  logEvent(s.db, sub.id, now ? "cancelled" : "cancel_scheduled", actor);
  const fresh = get(s, sub.id);
  mail(s.db, sub, actor.startsWith("user:") ? "cancelled_by_seller" : "cancel_requested");
  return { sub: fresh, already: false };
}

// Lien de gestion renvoyé par e-mail (invité qui l'a perdu) : même réponse que l'adresse soit connue ou non (aucune fuite).
function sendManageLinks(s, email, { origin, name }) {
  const subs = listByEmail(s, email);
  let n = 0;
  for (const sub of subs) { const r = notify.notifySubscription(s, { ...sub, origin }, "manage_link", { manageUrl: `${origin}/boutique/abonnements/${sub.id}?k=${token(sub)}`, shopName: name }); if (r.queued) n += 1; }
  return n;
}

module.exports = {
  MAX_PLANS, STATUS_LABELS, statusLabel, cadence, token, tokenOk, manageUrl, listPlans, getPlan, savePlan, removePlan, shownDiscount, offerFor, startCheckout, get, listForCustomer, listByEmail, hasAny, ordersOf, eventsOf, adminList,
  isSubscriptionEvent, handleStripeEvent, applySubscriptionObject, reconcile, pause, resume, changePlan, cancel, sendManageLinks,
};
