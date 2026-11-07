// Programme 20.5 — Panier serveur et tarification. Le navigateur ne fournit JAMAIS un prix, une remise, un total ou un stock :
// il envoie des identifiants et des quantités ; tout le reste est recalculé ici à partir des données de CETTE boutique.
const crypto = require("node:crypto");
const { MarketingError } = require("../errors");
const catalog = require("./catalog");
const store = require("./store");
const calc = require("./calc");
const personalization = require("./personalization");
const access = require("./access");
const age = require("./age");

const MAX_QTY = 99;
const MAX_LINES = 50;
const hash = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");
const siteCond = (s) => (s.siteId == null ? "site_id IS NULL" : "site_id = ?");
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);

function createCart(s, customerId = null) {
  const token = crypto.randomBytes(32).toString("hex");
  const id = Number(s.db.prepare("INSERT INTO mk_shop_carts (organization_id, site_id, token_hash, customer_id) VALUES (?,?,?,?)").run(s.organizationId, s.siteId ?? null, hash(token), customerId).lastInsertRowid);
  return { id, token };
}
// Panier ouvert correspondant au jeton, DANS cette boutique seulement (le jeton d'une autre boutique est inconnu ici).
function findCart(s, token) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) return null;
  return s.db.prepare(`SELECT * FROM mk_shop_carts WHERE token_hash = ? AND organization_id = ? AND ${siteCond(s)} AND status = 'open'`).get(hash(token), s.organizationId, ...siteArgs(s)) || null;
}
function touch(s, cart) {
  s.db.prepare("UPDATE mk_shop_carts SET version = version + 1, updated_at = datetime('now') WHERE id = ?").run(cart.id);
}
function checkVersion(cart, expected) {
  if (expected !== undefined && expected !== null && expected !== "" && Number(expected) !== cart.version) {
    throw new MarketingError("conflict", "Votre panier a été modifié ailleurs. Il vient d'être rechargé : vérifiez-le puis recommencez.");
  }
}
const qtyOf = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > MAX_QTY) throw new MarketingError("invalid_field", `La quantité doit être un entier entre 1 et ${MAX_QTY}.`);
  return n;
};

// Produit/variante achetables maintenant ; sinon erreur claire.
function resolveBuyable(s, productId, variantId) {
  const p = catalog.productById(s, productId);
  if (!p || p.status !== "published") throw new MarketingError("not_found", "Ce produit n'est plus disponible.");
  let v = null;
  if (p.type === "variable") {
    if (!variantId) throw new MarketingError("invalid_field", "Choisissez une variante (taille, couleur…).");
    v = p.variants.find((x) => x.id === Number(variantId));
    if (!v) throw new MarketingError("invalid_field", "Cette variante n'existe pas pour ce produit.");
  } else if (variantId) {
    throw new MarketingError("invalid_field", "Ce produit n'a pas de variantes.");
  }
  return { p, v };
}

function addItem(s, cart, { productId, variantId = null, quantity = 1, expectedVersion, customText = "", ageConfirmed = 0 }) {
  checkVersion(cart, expectedVersion);
  const qty = qtyOf(quantity);
  const { p, v } = resolveBuyable(s, Number(productId), variantId);
  access.assertPurchasable(s, p.id); // réservé aux membres / vente privée fermée : refusé par le serveur
  age.assertAllowed(s.db, p.id, ageConfirmed); // contrôle d'âge : refus côté serveur sans déclaration de majorité
  const custom = personalization.validate(s.db, p.id, customText).text;
  const line = s.db.prepare("SELECT * FROM mk_shop_cart_items WHERE cart_id = ? AND product_id = ? AND COALESCE(variant_id, 0) = ? AND COALESCE(custom_text, '') = ?").get(cart.id, p.id, v ? v.id : 0, custom || "");
  const next = (line ? line.quantity : 0) + qty;
  if (next > MAX_QTY) throw new MarketingError("invalid_field", `Quantité maximale par article : ${MAX_QTY}.`);
  const stock = catalog.stockOf(p, v);
  if (stock !== null && next > stock) throw new MarketingError("stock", stock > 0 ? `Stock insuffisant : ${stock} disponible(s).` : "Ce produit est en rupture de stock.");
  if (line) s.db.prepare("UPDATE mk_shop_cart_items SET quantity = ? WHERE id = ?").run(next, line.id);
  else {
    if (s.db.prepare("SELECT COUNT(*) AS n FROM mk_shop_cart_items WHERE cart_id = ?").get(cart.id).n >= MAX_LINES) throw new MarketingError("invalid_field", "Le panier contient trop d'articles différents.");
    s.db.prepare("INSERT INTO mk_shop_cart_items (cart_id, product_id, variant_id, quantity, custom_text) VALUES (?,?,?,?,?)").run(cart.id, p.id, v ? v.id : null, qty, custom);
  }
  touch(s, cart);
}
function setQuantity(s, cart, itemId, quantity, expectedVersion) {
  checkVersion(cart, expectedVersion);
  const line = s.db.prepare("SELECT * FROM mk_shop_cart_items WHERE id = ? AND cart_id = ?").get(Number(itemId) || 0, cart.id);
  if (!line) throw new MarketingError("not_found", "Article introuvable dans le panier.");
  if (Number(quantity) === 0) return removeItem(s, cart, itemId);
  const qty = qtyOf(quantity);
  const { p, v } = resolveBuyable(s, line.product_id, line.variant_id);
  const stock = catalog.stockOf(p, v);
  if (stock !== null && qty > stock) throw new MarketingError("stock", stock > 0 ? `Stock insuffisant : ${stock} disponible(s).` : "Ce produit est en rupture de stock.");
  s.db.prepare("UPDATE mk_shop_cart_items SET quantity = ? WHERE id = ?").run(qty, line.id);
  touch(s, cart);
}
function removeItem(s, cart, itemId, expectedVersion) {
  checkVersion(cart, expectedVersion);
  const r = s.db.prepare("DELETE FROM mk_shop_cart_items WHERE id = ? AND cart_id = ?").run(Number(itemId) || 0, cart.id);
  if (!r.changes) throw new MarketingError("not_found", "Article introuvable dans le panier.");
  touch(s, cart);
}
function setCoupon(s, cart, code) {
  s.db.prepare("UPDATE mk_shop_carts SET coupon_code = ? WHERE id = ?").run(code ? store.normCode(code) : null, cart.id);
  touch(s, cart);
}

// Coupon : toutes les règles sont revérifiées à chaque calcul. → { coupon, eligibleKeys, amountCents } ou { error }
function evaluateCoupon(s, code, lines, email) {
  const c = store.couponByCode(s, code);
  if (!c || !c.active) return { error: "Ce code promotionnel n'est pas valide." };
  const t = catalog.nowSql();
  if (c.starts_at && c.starts_at > t) return { error: "Ce code n'est pas encore valable." };
  if (c.ends_at && c.ends_at < t) return { error: "Ce code a expiré." };
  if (c.max_uses != null && c.used_count >= c.max_uses) return { error: "Ce code a atteint sa limite d'utilisation." };
  if (c.per_customer_limit != null && email) {
    const n = s.db.prepare("SELECT COUNT(*) AS n FROM mk_shop_coupon_redemptions WHERE coupon_id = ? AND customer_email = ?").get(c.id, email).n;
    if (n >= c.per_customer_limit) return { error: "Vous avez déjà utilisé ce code le nombre de fois autorisé." };
  }
  const restricted = c.product_ids.length || c.category_ids.length;
  const eligible = lines.filter((l) => !restricted || c.product_ids.includes(l.productId) || l.categoryIds.some((id) => c.category_ids.includes(id)));
  const base = eligible.reduce((a, l) => a + l.unitCents * l.quantity, 0);
  if (!eligible.length) return { error: "Ce code ne s'applique à aucun article du panier." };
  if (c.min_subtotal_cents != null && base < c.min_subtotal_cents) return { error: `Ce code exige un panier d'au moins ${(c.min_subtotal_cents / 100).toFixed(2)}.` };
  return { coupon: c, eligibleKeys: new Set(eligible.map((l) => l.key)), amountCents: calc.couponAmount(c, base) };
}

// Calcule le panier COMPLET depuis la base. `dest` : { country, region } de livraison/facturation ; `shippingMethodId` facultatif.
// → { lines, issues, canCheckout, settings, totals, coupon, couponError, shipping:{ required, options, chosen, error }, currency, weightGrams }
function priceCart(s, cart, { dest = {}, shippingMethodId = null, email = null, now = new Date() } = {}) {
  const settings = store.getSettings(s);
  const items = s.db.prepare("SELECT * FROM mk_shop_cart_items WHERE cart_id = ? ORDER BY id").all(cart.id);
  const issues = [];
  const lines = [];
  for (const it of items) {
    const p = catalog.productById(s, it.product_id, now);
    const v = p && it.variant_id ? p.variants.find((x) => x.id === it.variant_id) : null;
    if (!p || p.status !== "published" || (it.variant_id && !v) || (p.type === "variable" && !v)) {
      issues.push({ itemId: it.id, kind: "unavailable", message: `« ${p ? p.name : "Un article"} » n'est plus disponible.` });
      continue;
    }
    const gate = access.gate(s, p.id, { now });
    if (!gate.purchasable) {
      issues.push({ itemId: it.id, kind: "access", message: `« ${p.name} » : ${gate.message}` });
      continue;
    }
    const price = catalog.priceOf(p, v, now);
    const stock = catalog.stockOf(p, v);
    const label = v ? Object.values(v.options).join(" / ") : null;
    const perso = personalization.get(s.db, p.id);
    if (stock !== null && it.quantity > stock) issues.push({ itemId: it.id, kind: "stock", available: stock, message: stock > 0 ? `« ${p.name} » : seulement ${stock} en stock.` : `« ${p.name} » est en rupture de stock.` });
    lines.push({
      key: `${it.id}`, itemId: it.id, productId: p.id, variantId: v ? v.id : null, name: p.name, variantLabel: label, sku: (v && v.sku) || p.sku, slug: p.slug, image: (v && v.image_url) || p.image_url,
      customText: perso && it.custom_text ? it.custom_text : null, customLabel: perso ? perso.label : null,
      quantity: it.quantity, unitCents: price.unitCents, regularCents: price.regularCents, onSale: price.onSale, requiresShipping: p.requires_shipping === 1,
      weightGrams: (v && v.weight_grams != null ? v.weight_grams : p.weight_grams) || 0, categoryIds: p.categories.map((c) => c.id), stock,
    });
  }

  let coupon = null; let couponError = null; let discount = null;
  if (cart.coupon_code && lines.length) {
    const r = evaluateCoupon(s, cart.coupon_code, lines, email);
    if (r.error) couponError = r.error; else { coupon = r.coupon; discount = { amountCents: r.amountCents, eligibleKeys: r.eligibleKeys }; }
  }

  // Livraison : seulement si au moins une ligne est physique.
  const physical = lines.filter((l) => l.requiresShipping);
  const weightGrams = physical.reduce((a, l) => a + l.weightGrams * l.quantity, 0);
  const country = String(dest.country || settings.default_country || "").toUpperCase();
  const subtotal = lines.reduce((a, l) => a + l.unitCents * l.quantity, 0);
  const afterDiscount = subtotal - (discount ? Math.min(discount.amountCents, subtotal) : 0);
  const shipping = { required: physical.length > 0, options: [], chosen: null, error: null, zone: null };
  let shippingCents = 0;
  if (shipping.required) {
    const zone = country ? calc.pickZone(store.listZones(s), country) : null;
    shipping.zone = zone ? zone.name : null;
    if (!country) shipping.error = "Indiquez le pays de livraison.";
    else if (!zone) shipping.error = "Nous ne livrons pas dans ce pays.";
    else {
      shipping.options = calc.shippingOptions(zone.methods, { subtotalCents: afterDiscount, weightGrams });
      if (!shipping.options.length) shipping.error = "Aucune méthode de livraison ne correspond à ce panier.";
      else if (shippingMethodId != null) {
        shipping.chosen = shipping.options.find((o) => o.id === Number(shippingMethodId)) || null;
        if (!shipping.chosen) shipping.error = "La méthode de livraison choisie n'est pas disponible pour ce panier.";
      } else if (shipping.options.length === 1) shipping.chosen = shipping.options[0];
      if (shipping.chosen) shippingCents = shipping.chosen.costCents;
    }
  }

  // Taxes : règle choisie selon la destination ; sans destination ou sans règle, aucune taxe n'est inventée.
  const taxCountry = country;
  const rule = settings.tax_enabled && taxCountry ? calc.pickTaxRule(store.listTaxRules(s), taxCountry, dest.region) : null;
  const tax = {
    enabled: Boolean(settings.tax_enabled && rule), includesTax: settings.prices_include_tax === 1,
    lineRuleBp: rule ? rule.rate_bp : 0, shippingRuleBp: rule && rule.applies_to_shipping ? rule.rate_bp : 0, ruleName: rule ? rule.name : "Taxe",
  };
  const totals = calc.computeTotals({ lines, discount, shippingCents, tax });
  return {
    lines, issues, settings, totals, coupon, couponError, shipping, currency: settings.currency, weightGrams, country, version: cart.version,
    taxRule: rule, canCheckout: lines.length > 0 && issues.length === 0,
  };
}

module.exports = { MAX_QTY, createCart, findCart, addItem, setQuantity, removeItem, setCoupon, priceCart, evaluateCoupon, resolveBuyable };
