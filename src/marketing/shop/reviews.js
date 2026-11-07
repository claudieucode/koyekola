// Avis clients VÉRIFIÉS. Un avis n'existe que s'il vient d'une commande payée contenant le produit : le vendeur ne peut pas en saisir,
// et la note moyenne envoyée aux moteurs de recherche ne se calcule que sur les avis publiés (jamais de note inventée).
const { MarketingError } = require("../errors");

const siteCond = (s, a = "") => (s.siteId == null ? `${a}site_id IS NULL` : `${a}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, " ").replace(/<[^>]*>/g, "").trim().slice(0, max);
const COUNTED = ["paid", "processing", "shipped", "completed"];

// Commande payée de CETTE boutique qui contient ce produit ; sinon erreur claire.
function eligibleOrder(s, order, productId) {
  if (!order || order.organization_id !== s.organizationId || (order.site_id ?? null) !== (s.siteId ?? null)) throw new MarketingError("not_found", "Commande introuvable.");
  if (order.payment_status !== "paid" || !COUNTED.includes(order.status)) throw new MarketingError("forbidden", "Vous pourrez donner votre avis une fois la commande payée.");
  const has = s.db.prepare("SELECT 1 FROM mk_shop_order_items WHERE order_id = ? AND product_id = ?").get(order.id, Number(productId) || 0);
  if (!has) throw new MarketingError("not_found", "Ce produit ne fait pas partie de cette commande.");
  return order;
}

function submit(s, settings, order, productId, input) {
  if (!settings.reviews_enabled) throw new MarketingError("forbidden", "Les avis sont désactivés sur cette boutique.");
  eligibleOrder(s, order, productId);
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new MarketingError("invalid_field", "Choisissez une note de 1 à 5.");
  const body = clean(input.body, 2000);
  const title = clean(input.title, 120);
  if (!body && !title) throw new MarketingError("invalid_field", "Écrivez quelques mots pour accompagner votre note.");
  const addr = (() => { try { return JSON.parse(order.billing_address || "{}"); } catch { return {}; } })();
  const author = clean(input.author_name, 60) || clean(addr.name, 60).split(" ")[0] || "Client";
  if (s.db.prepare("SELECT 1 FROM mk_shop_reviews WHERE order_id = ? AND product_id = ?").get(order.id, Number(productId))) throw new MarketingError("conflict", "Vous avez déjà donné votre avis sur ce produit pour cette commande.");
  const status = settings.reviews_auto_publish ? "published" : "pending";
  const id = Number(s.db.prepare("INSERT INTO mk_shop_reviews (organization_id, site_id, product_id, order_id, customer_email, author_name, rating, title, body, status, moderated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .run(s.organizationId, s.siteId ?? null, Number(productId), order.id, order.email, author, rating, title || null, body || null, status, status === "published" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null).lastInsertRowid);
  return { id, status };
}

// Avis publiés d'un produit + synthèse (nombre, moyenne, répartition). Sans avis : count = 0, average = null.
function forProduct(s, productId, { limit = 20 } = {}) {
  const rows = s.db.prepare(`SELECT id, author_name, rating, title, body, created_at FROM mk_shop_reviews WHERE product_id = ? AND organization_id = ? AND ${siteCond(s)} AND status = 'published' ORDER BY id DESC LIMIT ?`).all(Number(productId), s.organizationId, ...siteArgs(s), Math.min(100, Math.max(1, limit)));
  const agg = s.db.prepare(`SELECT COUNT(*) AS n, AVG(rating) AS avg FROM mk_shop_reviews WHERE product_id = ? AND organization_id = ? AND ${siteCond(s)} AND status = 'published'`).get(Number(productId), s.organizationId, ...siteArgs(s));
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of s.db.prepare(`SELECT rating, COUNT(*) AS n FROM mk_shop_reviews WHERE product_id = ? AND organization_id = ? AND ${siteCond(s)} AND status = 'published' GROUP BY rating`).all(Number(productId), s.organizationId, ...siteArgs(s))) dist[r.rating] = r.n;
  return { items: rows, count: agg.n, average: agg.n ? Math.round(agg.avg * 10) / 10 : null, distribution: dist };
}

// Synthèse de plusieurs produits d'un coup (grilles de produits) : { [productId]: { count, average } }
function summaries(s, productIds) {
  const ids = [...new Set((productIds || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  if (!ids.length) return {};
  const out = {};
  for (const r of s.db.prepare(`SELECT product_id, COUNT(*) AS n, AVG(rating) AS avg FROM mk_shop_reviews WHERE product_id IN (${ids.map(() => "?").join(",")}) AND organization_id = ? AND ${siteCond(s)} AND status = 'published' GROUP BY product_id`).all(...ids, s.organizationId, ...siteArgs(s))) out[r.product_id] = { count: r.n, average: Math.round(r.avg * 10) / 10 };
  return out;
}

function adminList(s, { status, page = 1, perPage = 25 } = {}) {
  const where = ["r.organization_id = ?", siteCond(s, "r.")];
  const args = [s.organizationId, ...siteArgs(s)];
  if (["pending", "published", "rejected"].includes(status)) { where.push("r.status = ?"); args.push(status); }
  const total = s.db.prepare(`SELECT COUNT(*) AS n FROM mk_shop_reviews r WHERE ${where.join(" AND ")}`).get(...args).n;
  const pp = Math.min(100, Math.max(1, Number(perPage) || 25));
  const items = s.db.prepare(`SELECT r.*, p.name AS product_name, o.number AS order_number FROM mk_shop_reviews r JOIN mk_shop_products p ON p.id = r.product_id JOIN mk_shop_orders o ON o.id = r.order_id WHERE ${where.join(" AND ")} ORDER BY (r.status = 'pending') DESC, r.id DESC LIMIT ? OFFSET ?`)
    .all(...args, pp, (Math.max(1, Number(page) || 1) - 1) * pp);
  const pending = s.db.prepare(`SELECT COUNT(*) AS n FROM mk_shop_reviews WHERE organization_id = ? AND ${siteCond(s)} AND status = 'pending'`).get(s.organizationId, ...siteArgs(s)).n;
  return { items, total, pending, page: Math.max(1, Number(page) || 1), pages: Math.ceil(total / pp) };
}
function moderate(s, id, status) {
  if (!["published", "rejected", "pending"].includes(status)) throw new MarketingError("invalid_field", "Statut d'avis inconnu.");
  const r = s.db.prepare(`UPDATE mk_shop_reviews SET status = ?, moderated_at = datetime('now') WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(status, Number(id) || 0, s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Avis introuvable.");
}
function remove(s, id) {
  const r = s.db.prepare(`DELETE FROM mk_shop_reviews WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(Number(id) || 0, s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Avis introuvable.");
}

module.exports = { eligibleOrder, submit, forProduct, summaries, adminList, moderate, remove };
