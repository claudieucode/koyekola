// Liste de naissance / de cadeaux partageable.
// - Le lien public est un jeton long et non devinable ; la gestion exige un second secret (jamais stocké en clair) ou le compte du client propriétaire.
// - « Offert » n'augmente QU'À LA COMMANDE PAYÉE (onPaid) et redescend au remboursement (onRefunded) ; jamais à l'ajout au panier ni à la création de la commande.
// - Le plafond (souhaité) est vérifié au panier, à la commande (en tenant compte des commandes en attente de paiement) et, par sécurité, au paiement.
// - L'adresse du bénéficiaire n'est jamais affichée : elle ne sert qu'à remplir l'adresse de livraison de la commande, que seul le vendeur voit.
const crypto = require("node:crypto");
const { MarketingError } = require("../errors");
const cart = require("./cart");
const catalog = require("./catalog");
const personalization = require("./personalization");

const MAX_ITEMS = 100;
const MAX_WANTED = 99;
const hash = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
const siteCond = (s, a = "") => (s.siteId == null ? `${a}site_id IS NULL` : `${a}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, " ").replace(/<[^>]*>/g, "").trim().slice(0, max);
const cleanLine = (v, max) => clean(v, max).replace(/\s+/g, " ");
const TOKEN_RE = /^[0-9a-f]{40}$/;
const MANAGE_RE = /^[0-9a-f]{48}$/;

function address(input) {
  const a = input && typeof input === "object" ? input : {};
  const out = { name: cleanLine(a.name, 120), line1: cleanLine(a.line1, 160), line2: cleanLine(a.line2, 160), postal_code: cleanLine(a.postal_code, 20), city: cleanLine(a.city, 100), region: cleanLine(a.region, 80), country: cleanLine(a.country, 2).toUpperCase(), phone: cleanLine(a.phone, 30) };
  const any = out.name || out.line1 || out.postal_code || out.city;
  if (!any) return null;
  if (!out.name || !out.line1 || !out.city || !out.postal_code) throw new MarketingError("invalid_field", "Adresse de livraison : nom, adresse, code postal et ville sont obligatoires.");
  if (!/^[A-Z]{2}$/.test(out.country)) throw new MarketingError("invalid_field", "Adresse de livraison : le pays est obligatoire (code à 2 lettres, ex. FR).");
  return out;
}
function eventDate(v) {
  const t = clean(v, 10);
  if (!t) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t) || Number.isNaN(Date.parse(t))) throw new MarketingError("invalid_field", "La date doit avoir la forme AAAA-MM-JJ.");
  return t;
}

// ── Listes ──────────────────────────────────────────────────────────────────────────────────
function create(s, input, customer = null) {
  const title = cleanLine(input.title, 120);
  if (!title) throw new MarketingError("invalid_field", "Donnez un titre à votre liste (ex. « Naissance de Léa »).");
  const email = cleanLine(input.owner_email, 200).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new MarketingError("invalid_field", "Adresse e-mail invalide.");
  const addr = address({ name: input.ship_name, line1: input.ship_line1, line2: input.ship_line2, postal_code: input.ship_postal_code, city: input.ship_city, region: input.ship_region, country: input.ship_country, phone: input.ship_phone });
  const allow = addr && input.allow_recipient_delivery && input.allow_recipient_delivery !== "0" ? 1 : 0;
  if (allow && !addr) throw new MarketingError("invalid_field", "Pour proposer la livraison chez vous, renseignez votre adresse.");
  const publicToken = crypto.randomBytes(20).toString("hex");
  const manageToken = crypto.randomBytes(24).toString("hex");
  const id = Number(s.db.prepare("INSERT INTO mk_shop_gift_lists (organization_id, site_id, public_token, manage_token_hash, customer_id, owner_name, owner_email, title, message, event_date, allow_recipient_delivery, recipient_address) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(s.organizationId, s.siteId ?? null, publicToken, hash(manageToken), customer ? customer.id : null, cleanLine(input.owner_name, 80) || (customer && customer.name) || null, email || (customer && customer.email) || null, title, clean(input.message, 1000) || null, eventDate(input.event_date), allow, addr ? JSON.stringify(addr) : null).lastInsertRowid);
  return { id, publicToken, manageToken };
}
function findByToken(s, token) {
  if (typeof token !== "string" || !TOKEN_RE.test(token)) return null;
  return s.db.prepare(`SELECT * FROM mk_shop_gift_lists WHERE public_token = ? AND organization_id = ? AND ${siteCond(s)}`).get(token, s.organizationId, ...siteArgs(s)) || null;
}
function canManage(list, { manageToken, customer } = {}) {
  if (!list) return false;
  if (customer && list.customer_id && list.customer_id === customer.id) return true;
  if (typeof manageToken !== "string" || !MANAGE_RE.test(manageToken)) return false;
  const a = Buffer.from(hash(manageToken)); const b = Buffer.from(list.manage_token_hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function listsOfCustomer(s, customerId) {
  return s.db.prepare(`SELECT * FROM mk_shop_gift_lists WHERE customer_id = ? AND organization_id = ? AND ${siteCond(s)} ORDER BY id DESC`).all(customerId, s.organizationId, ...siteArgs(s));
}
function update(s, list, input) {
  const title = cleanLine(input.title, 120);
  if (!title) throw new MarketingError("invalid_field", "Le titre est obligatoire.");
  const addr = input.ship_line1 || input.ship_name || input.ship_city || input.ship_postal_code
    ? address({ name: input.ship_name, line1: input.ship_line1, line2: input.ship_line2, postal_code: input.ship_postal_code, city: input.ship_city, region: input.ship_region, country: input.ship_country, phone: input.ship_phone })
    : (list.recipient_address ? JSON.parse(list.recipient_address) : null);
  const allow = input.allow_recipient_delivery && input.allow_recipient_delivery !== "0" ? 1 : 0;
  if (allow && !addr) throw new MarketingError("invalid_field", "Pour proposer la livraison chez vous, renseignez votre adresse.");
  s.db.prepare("UPDATE mk_shop_gift_lists SET title = ?, message = ?, event_date = ?, allow_recipient_delivery = ?, recipient_address = ?, updated_at = datetime('now') WHERE id = ?")
    .run(title, clean(input.message, 1000) || null, eventDate(input.event_date), allow, addr ? JSON.stringify(addr) : null, list.id);
}
function setStatus(s, list, status) {
  if (!["active", "closed"].includes(status)) throw new MarketingError("invalid_field", "Statut inconnu.");
  s.db.prepare("UPDATE mk_shop_gift_lists SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, list.id);
}

// ── Articles ────────────────────────────────────────────────────────────────────────────────
// Unités déjà engagées dans des commandes en attente de paiement (réservées, mais pas encore « offertes »).
function reservedFor(s, giftItemId, exceptOrderId = 0) {
  return s.db.prepare(`SELECT COALESCE(SUM(l.quantity), 0) AS n FROM mk_shop_gift_order_lines l JOIN mk_shop_order_items oi ON oi.id = l.order_item_id JOIN mk_shop_orders o ON o.id = oi.order_id
    WHERE l.gift_item_id = ? AND l.counted_at IS NULL AND o.status = 'pending' AND o.payment_status <> 'paid' AND o.id <> ?`).get(giftItemId, exceptOrderId).n;
}
function getItem(s, list, itemId) {
  return list ? s.db.prepare("SELECT * FROM mk_shop_gift_items WHERE id = ? AND list_id = ?").get(Number(itemId) || 0, list.id) || null : null;
}

function setItem(s, list, { productId, variantId = null, wanted }) {
  const w = Number(wanted);
  if (!Number.isInteger(w) || w < 1 || w > MAX_WANTED) throw new MarketingError("invalid_field", `La quantité souhaitée doit être un entier entre 1 et ${MAX_WANTED}.`);
  const { p, v } = cart.resolveBuyable(s, Number(productId), variantId);
  if (personalization.get(s.db, p.id)) throw new MarketingError("invalid_field", "Un produit personnalisable (gravure, initiales) ne peut pas figurer dans une liste.");
  const row = s.db.prepare("SELECT * FROM mk_shop_gift_items WHERE list_id = ? AND product_id = ? AND COALESCE(variant_id, 0) = ?").get(list.id, p.id, v ? v.id : 0);
  if (row) {
    if (w < row.offered) throw new MarketingError("invalid_field", `${row.offered} unité(s) ont déjà été offertes : la quantité souhaitée ne peut pas descendre en dessous.`);
    s.db.prepare("UPDATE mk_shop_gift_items SET wanted = ? WHERE id = ?").run(w, row.id);
    return row.id;
  }
  if (s.db.prepare("SELECT COUNT(*) AS n FROM mk_shop_gift_items WHERE list_id = ?").get(list.id).n >= MAX_ITEMS) throw new MarketingError("invalid_field", `Votre liste est pleine (${MAX_ITEMS} articles).`);
  return Number(s.db.prepare("INSERT INTO mk_shop_gift_items (list_id, product_id, variant_id, wanted) VALUES (?,?,?,?)").run(list.id, p.id, v ? v.id : null, w).lastInsertRowid);
}
function removeItem(s, list, itemId) {
  const it = getItem(s, list, itemId);
  if (!it) throw new MarketingError("not_found", "Article introuvable dans la liste.");
  if (it.offered > 0 || reservedFor(s, it.id) > 0) throw new MarketingError("conflict", "Cet article a déjà été offert (ou une commande est en cours) : il ne peut plus être retiré.");
  s.db.prepare("DELETE FROM mk_shop_gift_items WHERE id = ?").run(it.id);
}

// Vue de la liste : chiffres RÉELS lus en base. restants = souhaités − offerts (payés) ; offrable = restants − unités engagées par des commandes en attente.
function itemsView(s, list) {
  const rows = s.db.prepare("SELECT * FROM mk_shop_gift_items WHERE list_id = ? ORDER BY id").all(list.id);
  const out = [];
  for (const r of rows) {
    const p = catalog.productById(s, r.product_id);
    const v = p && r.variant_id ? p.variants.find((x) => x.id === r.variant_id) : null;
    const available = Boolean(p && p.status === "published" && (!r.variant_id || v));
    const reserved = reservedFor(s, r.id);
    const remaining = r.wanted - r.offered;
    const price = available ? catalog.priceOf(p, v) : null;
    const stock = available ? catalog.stockOf(p, v) : 0;
    out.push({
      id: r.id, productId: r.product_id, variantId: r.variant_id, name: p ? p.name : "Produit retiré", slug: p ? p.slug : null, image: p ? ((v && v.image_url) || p.image_url) : null,
      variantLabel: v ? Object.values(v.options).join(" / ") : null, unitCents: price ? price.unitCents : null, available,
      wanted: r.wanted, offered: r.offered, remaining, reserved, offerable: Math.max(0, Math.min(remaining - reserved, stock === null ? MAX_WANTED : stock)),
    });
  }
  return out;
}
// Ce que le bénéficiaire peut voir : les cadeaux PAYÉS (nom et mot laissés volontairement par le donateur), jamais l'e-mail ni l'adresse de l'acheteur.
function contributions(s, list) {
  return s.db.prepare(`SELECT l.counted AS quantity, l.from_name, l.note, l.counted_at, oi.name AS product_name, oi.variant_label
    FROM mk_shop_gift_order_lines l JOIN mk_shop_gift_items gi ON gi.id = l.gift_item_id JOIN mk_shop_order_items oi ON oi.id = l.order_item_id
    WHERE gi.list_id = ? AND l.counted > 0 AND l.refunded_at IS NULL ORDER BY l.counted_at DESC, l.order_item_id DESC`).all(list.id);
}

// ── Offrir : ajoute la ligne au panier (rien n'est compté ici) ─────────────────────────────
function cartGiftLines(s, cartId) {
  return s.db.prepare(`SELECT k.cart_item_id, k.gift_item_id, k.from_name, k.note, ci.quantity, ci.product_id, ci.variant_id, gi.wanted, gi.offered, gi.list_id, gl.status, gl.title, gl.allow_recipient_delivery, gl.recipient_address
    FROM mk_shop_gift_cart_links k JOIN mk_shop_cart_items ci ON ci.id = k.cart_item_id JOIN mk_shop_gift_items gi ON gi.id = k.gift_item_id JOIN mk_shop_gift_lists gl ON gl.id = gi.list_id
    WHERE ci.cart_id = ?`).all(cartId);
}
function offer(s, list, k, { itemId, quantity = 1, fromName = "", note = "", expectedVersion }) {
  if (list.status !== "active") throw new MarketingError("forbidden", "Cette liste est fermée.");
  const it = getItem(s, list, itemId);
  if (!it) throw new MarketingError("not_found", "Cet article ne fait pas partie de la liste.");
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_WANTED) throw new MarketingError("invalid_field", `La quantité doit être un entier entre 1 et ${MAX_WANTED}.`);
  const line = s.db.prepare("SELECT ci.*, k.gift_item_id FROM mk_shop_cart_items ci LEFT JOIN mk_shop_gift_cart_links k ON k.cart_item_id = ci.id WHERE ci.cart_id = ? AND ci.product_id = ? AND COALESCE(ci.variant_id, 0) = ? AND COALESCE(ci.custom_text, '') = ''")
    .get(k.id, it.product_id, it.variant_id || 0);
  if (line && line.gift_item_id !== it.id) throw new MarketingError("conflict", "Cet article est déjà dans votre panier comme achat personnel ou pour une autre liste : retirez-le d'abord du panier.");
  const free = it.wanted - it.offered - reservedFor(s, it.id);
  const inCart = line ? line.quantity : 0;
  if (inCart + qty > free) throw new MarketingError("stock", free > 0 ? `Il ne reste que ${Math.max(0, free - inCart)} unité(s) à offrir pour cet article.` : "Cet article a déjà été entièrement offert.");
  cart.addItem(s, k, { productId: it.product_id, variantId: it.variant_id, quantity: qty, expectedVersion });
  const added = s.db.prepare("SELECT id FROM mk_shop_cart_items WHERE cart_id = ? AND product_id = ? AND COALESCE(variant_id, 0) = ? AND COALESCE(custom_text, '') = ''").get(k.id, it.product_id, it.variant_id || 0);
  s.db.prepare("INSERT INTO mk_shop_gift_cart_links (cart_item_id, gift_item_id, from_name, note) VALUES (?,?,?,?) ON CONFLICT(cart_item_id) DO UPDATE SET from_name = COALESCE(NULLIF(excluded.from_name, ''), from_name), note = COALESCE(NULLIF(excluded.note, ''), note)")
    .run(added.id, it.id, cleanLine(fromName, 60) || null, clean(note, 500) || null);
}

// ── Branchements sur la commande ───────────────────────────────────────────────────────────
// Appelé au passage en caisse : revérifie plafond et état de la liste, et applique la livraison choisie.
// Retourne l'entrée éventuellement modifiée (adresse du bénéficiaire) — l'adresse n'est jamais renvoyée au navigateur.
function prepareCheckout(s, cartId, input) {
  const lines = cartGiftLines(s, cartId);
  if (!lines.length) {
    if (input && input.giftDelivery === "recipient") throw new MarketingError("invalid_field", "Aucun cadeau de liste dans ce panier : livraison au bénéficiaire impossible.");
    return input;
  }
  for (const l of lines) {
    if (l.status !== "active") throw new MarketingError("forbidden", `La liste « ${l.title} » est fermée : retirez ce cadeau du panier.`);
    const free = l.wanted - l.offered - reservedFor(s, l.gift_item_id);
    if (l.quantity > free) throw new MarketingError("stock", free > 0 ? `Il ne reste que ${free} unité(s) à offrir pour un article de la liste « ${l.title} » : réduisez la quantité.` : `Un article de la liste « ${l.title} » a déjà été entièrement offert : retirez-le du panier.`);
  }
  if (!input || input.giftDelivery !== "recipient") return input;
  const total = s.db.prepare("SELECT COUNT(*) AS n FROM mk_shop_cart_items WHERE cart_id = ?").get(cartId).n;
  const lists = new Set(lines.map((l) => l.list_id));
  if (lists.size !== 1 || lines.length !== total) throw new MarketingError("invalid_field", "La livraison au bénéficiaire n'est possible que si le panier ne contient que des cadeaux d'une seule liste.");
  const l = lines[0];
  if (!l.allow_recipient_delivery || !l.recipient_address) throw new MarketingError("invalid_field", "Cette liste ne propose pas la livraison chez le bénéficiaire.");
  return { ...input, shipping: JSON.parse(l.recipient_address) };
}
function onOrderLine(s, cartItemId, orderItemId, quantity) {
  const k = s.db.prepare("SELECT * FROM mk_shop_gift_cart_links WHERE cart_item_id = ?").get(cartItemId);
  if (!k) return;
  s.db.prepare("INSERT INTO mk_shop_gift_order_lines (order_item_id, gift_item_id, quantity, from_name, note) VALUES (?,?,?,?,?)").run(orderItemId, k.gift_item_id, quantity, k.from_name, k.note);
}
function addOrderEvent(s, orderId, note) {
  s.db.prepare("INSERT INTO mk_shop_order_events (order_id, kind, actor, note) VALUES (?, 'gift_list', 'system', ?)").run(orderId, String(note).slice(0, 500));
}
// Commande PAYÉE : seul moment où « offert » augmente. Jamais au-delà du souhaité ; le surplus éventuel est signalé au vendeur.
function onPaid(s, orderId) {
  const rows = s.db.prepare(`SELECT l.* FROM mk_shop_gift_order_lines l JOIN mk_shop_order_items oi ON oi.id = l.order_item_id WHERE oi.order_id = ? AND l.counted_at IS NULL`).all(orderId);
  for (const l of rows) {
    const gi = s.db.prepare("SELECT wanted, offered FROM mk_shop_gift_items WHERE id = ?").get(l.gift_item_id);
    const actual = Math.max(0, Math.min(l.quantity, gi.wanted - gi.offered));
    if (actual > 0) s.db.prepare("UPDATE mk_shop_gift_items SET offered = offered + ? WHERE id = ? AND offered + ? <= wanted").run(actual, l.gift_item_id, actual);
    s.db.prepare("UPDATE mk_shop_gift_order_lines SET counted = ?, counted_at = datetime('now') WHERE order_item_id = ?").run(actual, l.order_item_id);
    if (actual < l.quantity) addOrderEvent(s, orderId, `Liste cadeaux : ${l.quantity - actual} unité(s) au-delà de la quantité souhaitée (déjà offerte par ailleurs) — à traiter avec le client.`);
  }
}
// Remboursement : les unités comptées sont rendues à la liste.
function onRefunded(s, orderId) {
  const rows = s.db.prepare(`SELECT l.* FROM mk_shop_gift_order_lines l JOIN mk_shop_order_items oi ON oi.id = l.order_item_id WHERE oi.order_id = ? AND l.counted_at IS NOT NULL AND l.refunded_at IS NULL`).all(orderId);
  for (const l of rows) {
    if (l.counted > 0) s.db.prepare("UPDATE mk_shop_gift_items SET offered = MAX(0, offered - ?) WHERE id = ?").run(l.counted, l.gift_item_id);
    s.db.prepare("UPDATE mk_shop_gift_order_lines SET refunded_at = datetime('now') WHERE order_item_id = ?").run(l.order_item_id);
  }
}

// ── Administration ─────────────────────────────────────────────────────────────────────────
function adminList(s, { page = 1, perPage = 25 } = {}) {
  const pp = Math.min(100, Math.max(1, Number(perPage) || 25));
  const total = s.db.prepare(`SELECT COUNT(*) AS n FROM mk_shop_gift_lists WHERE organization_id = ? AND ${siteCond(s)}`).get(s.organizationId, ...siteArgs(s)).n;
  const items = s.db.prepare(`SELECT gl.id, gl.title, gl.owner_name, gl.owner_email, gl.event_date, gl.status, gl.allow_recipient_delivery, gl.recipient_address IS NOT NULL AS has_address, gl.created_at,
      (SELECT COUNT(*) FROM mk_shop_gift_items WHERE list_id = gl.id) AS articles, (SELECT COALESCE(SUM(wanted), 0) FROM mk_shop_gift_items WHERE list_id = gl.id) AS wanted, (SELECT COALESCE(SUM(offered), 0) FROM mk_shop_gift_items WHERE list_id = gl.id) AS offered
    FROM mk_shop_gift_lists gl WHERE gl.organization_id = ? AND ${siteCond(s, "gl.")} ORDER BY gl.id DESC LIMIT ? OFFSET ?`).all(s.organizationId, ...siteArgs(s), pp, (Math.max(1, Number(page) || 1) - 1) * pp);
  return { items, total, pages: Math.ceil(total / pp) };
}

module.exports = { MAX_ITEMS, create, findByToken, canManage, listsOfCustomer, update, setStatus, setItem, removeItem, getItem, itemsView, contributions, cartGiftLines, offer, prepareCheckout, onOrderLine, onPaid, onRefunded, adminList, reservedFor };
