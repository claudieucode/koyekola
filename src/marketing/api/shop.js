// API publique de la boutique : /api/v1/shop/… (clé d'API, jamais de cookie). Mêmes services que l'administration (mêmes règles, mêmes contrôles).
//  · clé « site » : la boutique de CE site, sans autre choix possible ; clé « organisation » : boutique du site principal, ou d'un site de l'organisation via ?site_id=.
//  · le module « Commerce » doit être activé pour ce site ; lecture avec une clé « read », écriture avec « write ».
//  · AUCUN mouvement d'argent par l'API : confirmer un paiement manuel et rembourser restent des actes de l'administration (permission shop.payments) ou du fournisseur de paiement.
const catalog = require("../shop/catalog");
const orders = require("../shop/orders");
const customers = require("../shop/customers");
const store = require("../shop/store");
const reports = require("../shop/reports");
const siteModules = require("../siteModules");
const { MarketingError } = require("../errors");
const { isSiteKey } = require("./scope");

const STATUS_OF = { invalid_field: 400, invalid_transition: 409, conflict: 409, not_found: 404, forbidden: 403, stock: 409, invalid: 400 };
const intId = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const page = (q) => Math.max(1, Math.min(10000, Number(q.page) || 1));
const per = (q) => Math.max(1, Math.min(100, Number(q.per_page) || 25));

const productOut = (p) => ({ id: p.id, slug: p.slug, name: p.name, type: p.type, status: p.status, sku: p.sku, price_cents: p.price_cents, sale_price_cents: p.sale_price_cents, manage_stock: p.manage_stock === 1, stock_qty: p.manage_stock === 1 ? p.stock_qty : null, requires_shipping: p.requires_shipping === 1, categories: (p.categories || []).map((c) => ({ id: c.id, name: c.name })), variants: (p.variants || []).map((v) => ({ id: v.id, sku: v.sku, options: v.options, price_cents: v.price_cents, stock_qty: v.manage_stock === 1 ? v.stock_qty : null })), created_at: p.created_at });
const orderOut = (o) => ({ id: o.id, number: o.number, status: o.status, payment_status: o.payment_status, payment_method: o.payment_method, email: o.email, currency: o.currency, subtotal_cents: o.subtotal_cents, discount_cents: o.discount_cents, shipping_cents: o.shipping_cents, tax_cents: o.tax_cents, total_cents: o.total_cents, coupon_code: o.coupon_code, tracking_number: o.tracking_number, created_at: o.created_at, paid_at: o.paid_at });

function mount(router, { db, fail, needWrite }) {
  // Boutique visée par la requête (jamais déduite d'autre chose que de la clé et, pour une clé d'organisation, de ?site_id= vérifié)
  const shopOf = (req, res) => {
    const org = req.mkApi.organizationId;
    let siteId = null;
    if (isSiteKey(req.mkApi)) siteId = req.mkApi.siteId;
    else if (req.query.site_id !== undefined) {
      const id = intId(req.query.site_id);
      if (!id || !db.prepare("SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ? AND deleted_at IS NULL").get(id, org)) { fail(res, 404, "not_found", "Site introuvable."); return null; }
      siteId = id;
    }
    if (!siteModules.isEnabled(db, org, siteId, "commerce")) { fail(res, 403, "module_disabled", "Le module « Commerce » n'est pas activé pour ce site."); return null; }
    return { db, organizationId: org, siteId };
  };
  const guard = (fn) => (req, res, next) => {
    try { const s = shopOf(req, res); if (!s) return undefined; return fn(req, res, s); } catch (error) {
      if (error instanceof MarketingError) return fail(res, STATUS_OF[error.code] || 400, error.code, error.message);
      return next(error);
    }
  };

  router.get("/shop/products", guard((req, res, s) => {
    const r = catalog.adminList(s, { q: req.query.q, status: req.query.status, page: page(req.query), perPage: per(req.query) });
    res.json({ data: r.items.map(productOut), page: r.page, pages: r.pages, total: r.total });
  }));
  router.get("/shop/products/:id", guard((req, res, s) => {
    const p = intId(req.params.id) ? catalog.productById(s, intId(req.params.id)) : null;
    if (!p) return fail(res, 404, "not_found", "Produit introuvable.");
    res.json({ data: productOut(p) });
  }));
  router.post("/shop/products", needWrite, guard((req, res, s) => {
    const id = catalog.createProduct(s, req.body || {});
    res.status(201).json({ data: productOut(catalog.productById(s, id)) });
  }));
  router.patch("/shop/products/:id", needWrite, guard((req, res, s) => {
    const id = intId(req.params.id);
    if (!id || !catalog.getProduct(s, id)) return fail(res, 404, "not_found", "Produit introuvable.");
    catalog.updateProduct(s, id, req.body || {});
    res.json({ data: productOut(catalog.productById(s, id)) });
  }));
  router.post("/shop/products/:id/stock", needWrite, guard((req, res, s) => {
    const id = intId(req.params.id);
    if (!id || !catalog.getProduct(s, id)) return fail(res, 404, "not_found", "Produit introuvable.");
    catalog.adjustStock(s, id, intId(req.body && req.body.variant_id), Number(req.body && req.body.delta), null);
    res.json({ data: productOut(catalog.productById(s, id)) });
  }));

  router.get("/shop/orders", guard((req, res, s) => {
    const r = orders.listOrders(s, { status: req.query.status, q: req.query.q, page: page(req.query), perPage: per(req.query) });
    res.json({ data: r.items.map(orderOut), pages: r.pages, total: r.total });
  }));
  router.get("/shop/orders/:id", guard((req, res, s) => {
    const o = intId(req.params.id) ? orders.getOrder(s, intId(req.params.id)) : null;
    if (!o) return fail(res, 404, "not_found", "Commande introuvable.");
    const d = orders.orderDetail(s, o);
    res.json({ data: { ...orderOut(o), billing: d.billing, shipping_address: d.shippingAddress, tax_lines: d.taxLines, items: d.items.map((i) => ({ id: i.id, product_id: i.product_id, name: i.name, variant_label: i.variant_label, sku: i.sku, quantity: i.quantity, unit_price_cents: i.unit_price_cents, line_subtotal_cents: i.line_subtotal_cents, discount_cents: i.discount_cents, tax_cents: i.tax_cents })), refunds: d.refunds.map((r) => ({ id: r.id, amount_cents: r.amount_cents, status: r.status, reason: r.reason, created_at: r.created_at })) } });
  }));
  // Statuts de traitement uniquement (préparation, expédition, clôture, annulation d'une commande non payée) ; payer / rembourser ne passent JAMAIS par l'API
  router.post("/shop/orders/:id/status", needWrite, guard((req, res, s) => {
    const id = intId(req.params.id);
    if (!id || !orders.getOrder(s, id)) return fail(res, 404, "not_found", "Commande introuvable.");
    const to = String((req.body && req.body.status) || "");
    if (to === "paid" || to === "refunded") return fail(res, 403, "forbidden", "Confirmer un paiement ou rembourser ne se fait pas par l'API : utilisez l'administration.");
    const o = orders.changeStatus(s, id, to, { actor: `api:${req.mkApi.keyId}`, note: req.body && req.body.note, canMarkPaid: false, tracking: req.body && req.body.tracking });
    res.json({ data: orderOut(o) });
  }));

  router.get("/shop/customers", guard((req, res, s) => {
    const r = customers.listCustomers(s, { q: req.query.q, page: page(req.query), perPage: per(req.query) });
    res.json({ data: r.items.map((c) => ({ id: c.id, email: c.email, name: c.name, status: c.status, has_account: Boolean(c.has_account), orders: c.orders, spent_cents: c.spent_cents, created_at: c.created_at })), pages: r.pages, total: r.total });
  }));
  router.get("/shop/reports/summary", guard((req, res, s) => {
    const r = reports.report(s, req.query, store.getSettings(s));
    res.json({ data: { from: r.period.from, to: r.period.to, ...r.summary, top_products: r.top, by_status: r.statuses } });
  }));
}
module.exports = { mount };
