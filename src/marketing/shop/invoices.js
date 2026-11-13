// Factures et avoirs numérotés de la boutique. Une facture est émise à l'encaissement d'une commande ; un avoir à chaque remboursement réussi.
// Émission idempotente (un seul document par commande / par remboursement), numérotation continue par site, contenu figé à l'émission.
const { transaction } = require("../db/tx");
const siteCond = (s) => (s.siteId == null ? "site_id IS NULL" : "site_id = ?");
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);
const cleanMulti = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000b-\u001f\u007f]+/g, " ").trim().slice(0, max);
const parse = (v, f) => { try { return JSON.parse(v); } catch { return f; } };

const getCompany = (s) => s.db.prepare(`SELECT * FROM mk_shop_company WHERE organization_id = ? AND ${siteCond(s)}`).get(s.organizationId, ...siteArgs(s)) || { legal_name: "", address: "", vat_number: "", registration_number: "", email: "", phone: "", invoice_prefix: "", footer: "" };
function saveCompany(s, b) {
  const v = { legal_name: clean(b.legal_name, 150), address: cleanMulti(b.address, 500), vat_number: clean(b.vat_number, 40), registration_number: clean(b.registration_number, 40), email: clean(b.email, 150), phone: clean(b.phone, 40), invoice_prefix: clean(b.invoice_prefix, 8).replace(/[^A-Za-z0-9]/g, "").toUpperCase(), footer: cleanMulti(b.footer, 500) };
  const cur = s.db.prepare(`SELECT id FROM mk_shop_company WHERE organization_id = ? AND ${siteCond(s)}`).get(s.organizationId, ...siteArgs(s));
  if (cur) s.db.prepare("UPDATE mk_shop_company SET legal_name=?, address=?, vat_number=?, registration_number=?, email=?, phone=?, invoice_prefix=?, footer=?, updated_at=datetime('now') WHERE id=?").run(v.legal_name, v.address, v.vat_number, v.registration_number, v.email, v.phone, v.invoice_prefix, v.footer, cur.id);
  else s.db.prepare("INSERT INTO mk_shop_company (organization_id, site_id, legal_name, address, vat_number, registration_number, email, phone, invoice_prefix, footer) VALUES (?,?,?,?,?,?,?,?,?,?)").run(s.organizationId, s.siteId ?? null, v.legal_name, v.address, v.vat_number, v.registration_number, v.email, v.phone, v.invoice_prefix, v.footer);
  return getCompany(s);
}

// Prochain numéro : <préfixe>-<année>-<séquence sur 6 chiffres> ; la séquence ne repart jamais à zéro (continue, sans trou).
function allocate(s, kind) {
  const co = getCompany(s);
  const last = s.db.prepare(`SELECT COALESCE(MAX(seq),0) n FROM mk_shop_invoices WHERE organization_id = ? AND ${siteCond(s)} AND kind = ?`).get(s.organizationId, ...siteArgs(s), kind).n;
  const seq = last + 1;
  const prefix = (kind === "invoice" ? co.invoice_prefix || "F" : `AV${co.invoice_prefix || ""}`);
  return { seq, number: `${prefix}-${new Date().getUTCFullYear()}-${String(seq).padStart(6, "0")}` };
}

function snapshotOf(s, order, extra = {}) {
  const co = getCompany(s);
  const items = s.db.prepare("SELECT name, variant_label, sku, quantity, unit_price_cents, line_subtotal_cents, discount_cents, tax_cents FROM mk_shop_order_items WHERE order_id = ? ORDER BY id").all(order.id);
  return {
    seller: { name: co.legal_name, address: co.address, vat: co.vat_number, registration: co.registration_number, email: co.email, phone: co.phone, footer: co.footer },
    buyer: { email: order.email, billing: parse(order.billing_address, {}), shipping: parse(order.shipping_address, {}) },
    orderNumber: order.number, orderDate: order.created_at, paidAt: order.paid_at, paymentMethod: order.payment_method, pricesIncludeTax: order.prices_include_tax === 1,
    items, subtotalCents: order.subtotal_cents, discountCents: order.discount_cents, couponCode: order.coupon_code, shippingCents: order.shipping_cents, shippingMethod: order.shipping_method_name, taxCents: order.tax_cents, taxLines: parse(order.tax_lines, []), totalCents: order.total_cents,
    ...extra,
  };
}

// Émet ce qui manque pour la commande : sa facture (si elle a été payée) puis les avoirs des remboursements réussis. Idempotent ; ne lève jamais (n'interrompt jamais un paiement).
function sync(s, orderId) {
  try {
    return transaction(s.db, () => {
      const order = s.db.prepare("SELECT * FROM mk_shop_orders WHERE id = ? AND organization_id = ?").get(orderId, s.organizationId);
      if (!order || !order.paid_at) return [];
      const made = [];
      let inv = s.db.prepare("SELECT * FROM mk_shop_invoices WHERE order_id = ? AND kind = 'invoice'").get(order.id);
      if (!inv) {
        const { seq, number } = allocate(s, "invoice");
        const snap = snapshotOf(s, order);
        const id = Number(s.db.prepare("INSERT INTO mk_shop_invoices (organization_id, site_id, order_id, kind, seq, number, total_cents, currency, snapshot, issued_at) VALUES (?,?,?,'invoice',?,?,?,?,?, COALESCE(?, datetime('now')))").run(s.organizationId, s.siteId ?? null, order.id, seq, number, order.total_cents, order.currency, JSON.stringify(snap), order.paid_at).lastInsertRowid);
        inv = s.db.prepare("SELECT * FROM mk_shop_invoices WHERE id = ?").get(id); made.push(inv);
      }
      const refs = s.db.prepare("SELECT * FROM mk_shop_refunds WHERE order_id = ? AND status = 'succeeded' AND id NOT IN (SELECT refund_id FROM mk_shop_invoices WHERE refund_id IS NOT NULL) ORDER BY id").all(order.id);
      for (const r of refs) {
        const { seq, number } = allocate(s, "credit_note");
        const snap = snapshotOf(s, order, { creditNote: { refundId: r.id, amountCents: r.amount_cents, reason: r.reason, invoiceNumber: inv.number, items: parse(r.items, []) } });
        s.db.prepare("INSERT INTO mk_shop_invoices (organization_id, site_id, order_id, refund_id, kind, seq, number, total_cents, currency, snapshot) VALUES (?,?,?,?,'credit_note',?,?,?,?,?)").run(s.organizationId, s.siteId ?? null, order.id, r.id, seq, number, r.amount_cents, r.currency, JSON.stringify(snap));
        made.push(s.db.prepare("SELECT * FROM mk_shop_invoices WHERE refund_id = ?").get(r.id));
      }
      return made;
    });
  } catch (error) { console.error(`[KOLAKISA] Boutique : émission de facture (commande ${orderId}) : ${error.message}`); return []; }
}

const forOrder = (s, orderId) => { sync(s, orderId); return s.db.prepare("SELECT id, kind, number, total_cents, currency, issued_at FROM mk_shop_invoices WHERE order_id = ? AND organization_id = ? ORDER BY kind DESC, id").all(orderId, s.organizationId); };
function get(s, orderId, invoiceId) {
  const row = s.db.prepare(`SELECT * FROM mk_shop_invoices WHERE id = ? AND order_id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(invoiceId), orderId, s.organizationId, ...siteArgs(s));
  return row ? { ...row, data: parse(row.snapshot, {}) } : null;
}
function list(s, { page = 1, perPage = 25 } = {}) {
  const total = s.db.prepare(`SELECT COUNT(*) n FROM mk_shop_invoices WHERE organization_id = ? AND ${siteCond(s)}`).get(s.organizationId, ...siteArgs(s)).n;
  const items = s.db.prepare(`SELECT i.id, i.order_id, i.kind, i.number, i.total_cents, i.currency, i.issued_at, o.number order_number, o.email FROM mk_shop_invoices i JOIN mk_shop_orders o ON o.id = i.order_id WHERE i.organization_id = ? AND ${siteCond(s).replace("site_id", "i.site_id")} ORDER BY i.id DESC LIMIT ? OFFSET ?`).all(s.organizationId, ...siteArgs(s), perPage, (Math.max(1, Number(page) || 1) - 1) * perPage);
  return { total, items };
}
module.exports = { getCompany, saveCompany, sync, forOrder, get, list };
