// Liste de souhaits d'une boutique : rattachée à un jeton de navigateur (cookie) et, si le client est connecté, à son compte.
// Aucune donnée d'une autre boutique n'est jamais lue : le jeton ne vaut que dans la boutique où il a été créé.
const crypto = require("node:crypto");
const { MarketingError } = require("../errors");

const hash = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
const siteCond = (s, a = "") => (s.siteId == null ? `${a}site_id IS NULL` : `${a}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const MAX_ITEMS = 100;

function find(s, token) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) return null;
  return s.db.prepare(`SELECT * FROM mk_shop_wishlists WHERE token_hash = ? AND organization_id = ? AND ${siteCond(s)}`).get(hash(token), s.organizationId, ...siteArgs(s)) || null;
}
function create(s, customerId = null) {
  const token = crypto.randomBytes(32).toString("hex");
  const id = Number(s.db.prepare("INSERT INTO mk_shop_wishlists (organization_id, site_id, token_hash, customer_id) VALUES (?,?,?,?)").run(s.organizationId, s.siteId ?? null, hash(token), customerId).lastInsertRowid);
  return { id, token };
}
function add(s, list, productId) {
  const p = s.db.prepare(`SELECT id FROM mk_shop_products WHERE id = ? AND organization_id = ? AND ${siteCond(s)} AND status = 'published' AND deleted_at IS NULL`).get(Number(productId) || 0, s.organizationId, ...siteArgs(s));
  if (!p) throw new MarketingError("not_found", "Ce produit n'est plus disponible.");
  if (s.db.prepare("SELECT COUNT(*) AS n FROM mk_shop_wishlist_items WHERE wishlist_id = ?").get(list.id).n >= MAX_ITEMS) throw new MarketingError("invalid_field", `Votre liste est pleine (${MAX_ITEMS} produits).`);
  s.db.prepare("INSERT OR IGNORE INTO mk_shop_wishlist_items (wishlist_id, product_id) VALUES (?,?)").run(list.id, p.id);
}
function remove(s, list, productId) {
  s.db.prepare("DELETE FROM mk_shop_wishlist_items WHERE wishlist_id = ? AND product_id = ?").run(list.id, Number(productId) || 0);
}
function productIds(s, list) {
  if (!list) return [];
  return s.db.prepare("SELECT product_id FROM mk_shop_wishlist_items WHERE wishlist_id = ? ORDER BY created_at DESC, rowid DESC").all(list.id).map((r) => r.product_id);
}
// À la connexion : la liste du navigateur rejoint celle du compte (fusion, sans doublon)
function attachCustomer(s, list, customerId) {
  if (!list || !customerId) return list;
  const mine = s.db.prepare(`SELECT * FROM mk_shop_wishlists WHERE customer_id = ? AND organization_id = ? AND ${siteCond(s)} AND id <> ? ORDER BY id LIMIT 1`).get(customerId, s.organizationId, ...siteArgs(s), list.id);
  if (mine) {
    s.db.prepare("INSERT OR IGNORE INTO mk_shop_wishlist_items (wishlist_id, product_id) SELECT ?, product_id FROM mk_shop_wishlist_items WHERE wishlist_id = ?").run(list.id, mine.id);
    s.db.prepare("DELETE FROM mk_shop_wishlists WHERE id = ?").run(mine.id);
  }
  s.db.prepare("UPDATE mk_shop_wishlists SET customer_id = ? WHERE id = ?").run(customerId, list.id);
  return { ...list, customer_id: customerId };
}
module.exports = { find, create, add, remove, productIds, attachCustomer, MAX_ITEMS };
