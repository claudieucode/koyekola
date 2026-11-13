// Rapports de la boutique d'UN site (lecture seule) : chiffres de la période, ventes par jour, meilleurs produits, statuts, moyens de paiement, coupons, stock bas, et exports CSV.
// Règle de comptage : une vente = une commande PAYÉE (payment_status = 'paid') et non annulée, datée de son paiement. Les remboursements réussis sont soustraits à leur date.
// Tout est en centimes entiers ; la portée (organisation + site) vient du serveur, jamais du navigateur.
const siteCond = (s, a = "") => (s.siteId == null ? `${a}site_id IS NULL` : `${a}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const DAY = 86400000;
const isoDay = (d) => d.toISOString().slice(0, 10);

// Période : « from » et « to » au format AAAA-MM-JJ (inclus). Défaut : 30 derniers jours. Maximum 366 jours.
function period(q = {}, now = new Date()) {
  const ok = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
  let to = ok(q.to) ? String(q.to) : isoDay(now);
  let from = ok(q.from) ? String(q.from) : isoDay(new Date(Date.parse(`${to}T00:00:00Z`) - 29 * DAY));
  if (from > to) [from, to] = [to, from];
  if (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`) > 365 * DAY) from = isoDay(new Date(Date.parse(`${to}T00:00:00Z`) - 365 * DAY));
  const end = isoDay(new Date(Date.parse(`${to}T00:00:00Z`) + DAY));
  return { from, to, startSql: `${from} 00:00:00`, endSql: `${end} 00:00:00` };
}

const PAID = "payment_status = 'paid' AND status <> 'cancelled' AND paid_at >= ? AND paid_at < ?";

function summary(s, p) {
  const base = [s.organizationId, ...siteArgs(s)];
  const o = s.db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(total_cents),0) gross, COALESCE(SUM(tax_cents),0) tax, COALESCE(SUM(shipping_cents),0) shipping, COALESCE(SUM(discount_cents),0) discount
    FROM mk_shop_orders WHERE organization_id = ? AND ${siteCond(s)} AND ${PAID}`).get(...base, p.startSql, p.endSql);
  const r = s.db.prepare(`SELECT COALESCE(SUM(amount_cents),0) n FROM mk_shop_refunds WHERE organization_id = ? AND ${siteCond(s)} AND status = 'succeeded' AND created_at >= ? AND created_at < ?`).get(...base, p.startSql, p.endSql).n;
  const units = s.db.prepare(`SELECT COALESCE(SUM(i.quantity),0) n FROM mk_shop_order_items i JOIN mk_shop_orders o ON o.id = i.order_id WHERE o.organization_id = ? AND ${siteCond(s, "o.")} AND o.payment_status = 'paid' AND o.status <> 'cancelled' AND o.paid_at >= ? AND o.paid_at < ?`).get(...base, p.startSql, p.endSql).n;
  const customers = s.db.prepare(`SELECT COUNT(*) n FROM mk_shop_customers WHERE organization_id = ? AND ${siteCond(s)} AND created_at >= ? AND created_at < ?`).get(...base, p.startSql, p.endSql).n;
  const pending = s.db.prepare(`SELECT COUNT(*) n FROM mk_shop_orders WHERE organization_id = ? AND ${siteCond(s)} AND status IN ('pending','paid','processing')`).get(...base).n;
  return { orders: o.n, grossCents: o.gross, refundedCents: r, netCents: o.gross - r, taxCents: o.tax, shippingCents: o.shipping, discountCents: o.discount, unitsSold: units, averageCents: o.n ? Math.round(o.gross / o.n) : 0, newCustomers: customers, toProcess: pending };
}

function byDay(s, p) {
  const rows = s.db.prepare(`SELECT substr(paid_at,1,10) d, COUNT(*) n, SUM(total_cents) cents FROM mk_shop_orders WHERE organization_id = ? AND ${siteCond(s)} AND ${PAID} GROUP BY d`).all(s.organizationId, ...siteArgs(s), p.startSql, p.endSql);
  const map = new Map(rows.map((r) => [r.d, r]));
  const out = [];
  for (let t = Date.parse(`${p.from}T00:00:00Z`); t <= Date.parse(`${p.to}T00:00:00Z`); t += DAY) { const d = isoDay(new Date(t)); const r = map.get(d); out.push({ day: d, orders: r ? r.n : 0, cents: r ? r.cents : 0 }); }
  return out;
}

function topProducts(s, p, limit = 10) {
  return s.db.prepare(`SELECT COALESCE(i.product_id, 0) product_id, i.name, SUM(i.quantity) qty, SUM(i.line_subtotal_cents - i.discount_cents) cents
    FROM mk_shop_order_items i JOIN mk_shop_orders o ON o.id = i.order_id
    WHERE o.organization_id = ? AND ${siteCond(s, "o.")} AND o.payment_status = 'paid' AND o.status <> 'cancelled' AND o.paid_at >= ? AND o.paid_at < ?
    GROUP BY COALESCE(i.product_id, 0), i.name ORDER BY cents DESC, qty DESC LIMIT ?`).all(s.organizationId, ...siteArgs(s), p.startSql, p.endSql, limit);
}
const byStatus = (s, p) => s.db.prepare(`SELECT status, COUNT(*) n, COALESCE(SUM(total_cents),0) cents FROM mk_shop_orders WHERE organization_id = ? AND ${siteCond(s)} AND created_at >= ? AND created_at < ? GROUP BY status ORDER BY n DESC`).all(s.organizationId, ...siteArgs(s), p.startSql, p.endSql);
const byMethod = (s, p) => s.db.prepare(`SELECT COALESCE(payment_method,'—') method, COUNT(*) n, SUM(total_cents) cents FROM mk_shop_orders WHERE organization_id = ? AND ${siteCond(s)} AND ${PAID} GROUP BY method ORDER BY cents DESC`).all(s.organizationId, ...siteArgs(s), p.startSql, p.endSql);
const couponUse = (s, p) => s.db.prepare(`SELECT coupon_code code, COUNT(*) n, SUM(discount_cents) cents FROM mk_shop_orders WHERE organization_id = ? AND ${siteCond(s)} AND coupon_code IS NOT NULL AND ${PAID} GROUP BY coupon_code ORDER BY n DESC LIMIT 10`).all(s.organizationId, ...siteArgs(s), p.startSql, p.endSql);
function lowStock(s, threshold) {
  const lim = Number.isInteger(threshold) ? threshold : 5;
  const a = [s.organizationId, ...siteArgs(s), lim];
  const prods = s.db.prepare(`SELECT id, name, sku, stock_qty FROM mk_shop_products WHERE organization_id = ? AND ${siteCond(s)} AND status = 'published' AND type <> 'variable' AND manage_stock = 1 AND stock_qty <= ? ORDER BY stock_qty ASC, name LIMIT 50`).all(...a);
  return prods;
}

function report(s, q, settings = {}) {
  const p = period(q);
  return { period: p, summary: summary(s, p), days: byDay(s, p), top: topProducts(s, p), statuses: byStatus(s, p), methods: byMethod(s, p), coupons: couponUse(s, p), low: lowStock(s, settings.low_stock_threshold) };
}

// ── CSV ──
// Protection contre l'injection de formule dans un tableur : une cellule qui commence par = + - @ (ou tabulation/retour) est préfixée d'une apostrophe.
function cell(v) {
  let t = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[";\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}
const money = (c) => (Number(c || 0) / 100).toFixed(2).replace(".", ","); // format français : 12,50
const toCsv = (head, rows) => "﻿" + [head, ...rows].map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n"; // BOM + « ; » : s'ouvre correctement dans Excel en français

function exportOrders(s, p) {
  const rows = s.db.prepare(`SELECT number, created_at, paid_at, status, payment_status, payment_method, email, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, coupon_code, shipping_method_name, tracking_number, shipping_address,
      (SELECT COALESCE(SUM(amount_cents),0) FROM mk_shop_refunds r WHERE r.order_id = mk_shop_orders.id AND r.status = 'succeeded') refunded
    FROM mk_shop_orders WHERE organization_id = ? AND ${siteCond(s)} AND created_at >= ? AND created_at < ? ORDER BY id`).all(s.organizationId, ...siteArgs(s), p.startSql, p.endSql);
  const addr = (j) => { try { const a = JSON.parse(j); return [a.name, a.line1, a.postal_code, a.city, a.country].filter(Boolean).join(", "); } catch { return ""; } };
  return toCsv(["Numéro", "Créée le", "Payée le", "Statut", "Paiement", "Moyen", "E-mail", "Sous-total", "Remise", "Livraison", "Taxes", "Total", "Remboursé", "Coupon", "Mode de livraison", "Suivi", "Adresse de livraison"],
    rows.map((r) => [r.number, r.created_at, r.paid_at, r.status, r.payment_status, r.payment_method, r.email, money(r.subtotal_cents), money(r.discount_cents), money(r.shipping_cents), money(r.tax_cents), money(r.total_cents), money(r.refunded), r.coupon_code, r.shipping_method_name, r.tracking_number, addr(r.shipping_address)]));
}
function exportLines(s, p) {
  const rows = s.db.prepare(`SELECT o.number, o.created_at, o.status, i.name, i.variant_label, i.sku, i.quantity, i.unit_price_cents, i.line_subtotal_cents, i.discount_cents, i.tax_cents
    FROM mk_shop_order_items i JOIN mk_shop_orders o ON o.id = i.order_id WHERE o.organization_id = ? AND ${siteCond(s, "o.")} AND o.created_at >= ? AND o.created_at < ? ORDER BY o.id, i.id`).all(s.organizationId, ...siteArgs(s), p.startSql, p.endSql);
  return toCsv(["Commande", "Date", "Statut", "Produit", "Variante", "SKU", "Quantité", "Prix unitaire", "Sous-total ligne", "Remise", "Taxes"], rows.map((r) => [r.number, r.created_at, r.status, r.name, r.variant_label, r.sku, r.quantity, money(r.unit_price_cents), money(r.line_subtotal_cents), money(r.discount_cents), money(r.tax_cents)]));
}
function exportCustomers(s) {
  const rows = s.db.prepare(`SELECT c.email, c.name, c.phone, c.status, c.marketing_opt_in, c.created_at, (c.password_hash IS NOT NULL) has_account,
      (SELECT COUNT(*) FROM mk_shop_orders o WHERE o.customer_id = c.id AND o.payment_status = 'paid') orders,
      (SELECT COALESCE(SUM(total_cents),0) FROM mk_shop_orders o WHERE o.customer_id = c.id AND o.payment_status = 'paid' AND o.status <> 'cancelled') spent
    FROM mk_shop_customers c WHERE c.organization_id = ? AND ${siteCond(s, "c.")} ORDER BY c.id`).all(s.organizationId, ...siteArgs(s));
  return toCsv(["E-mail", "Nom", "Téléphone", "Statut", "Accepte les e-mails marketing", "Créé le", "Compte", "Commandes payées", "Total dépensé"], rows.map((r) => [r.email, r.name, r.phone, r.status, r.marketing_opt_in ? "oui" : "non", r.created_at, r.has_account ? "oui" : "invité", r.orders, money(r.spent)]));
}
function exportProducts(s) {
  const rows = s.db.prepare(`SELECT name, slug, type, status, sku, price_cents, sale_price_cents, manage_stock, stock_qty, created_at FROM mk_shop_products WHERE organization_id = ? AND ${siteCond(s)} ORDER BY id`).all(s.organizationId, ...siteArgs(s));
  return toCsv(["Nom", "Adresse (slug)", "Type", "Statut", "SKU", "Prix", "Prix promo", "Stock géré", "Stock", "Créé le"], rows.map((r) => [r.name, r.slug, r.type, r.status, r.sku, money(r.price_cents), r.sale_price_cents == null ? "" : money(r.sale_price_cents), r.manage_stock ? "oui" : "non", r.manage_stock ? r.stock_qty : "", r.created_at]));
}
const EXPORTS = { commandes: (s, p) => exportOrders(s, p), lignes: (s, p) => exportLines(s, p), clients: (s) => exportCustomers(s), produits: (s) => exportProducts(s) };

module.exports = { period, summary, byDay, topProducts, report, cell, toCsv, EXPORTS };
