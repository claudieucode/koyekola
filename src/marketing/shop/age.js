// Contrôle d'âge légal : âge minimum par produit et/ou par catégorie (le plus élevé s'applique). Simple DÉCLARATION sur l'honneur, pas une vérification d'identité.
// La déclaration du visiteur est mémorisée dans un cookie signé propre à la boutique (organisation + site) ; le serveur la revérifie à chaque ajout au panier.
const crypto = require("node:crypto");
const { MarketingError } = require("../errors");

const LEVELS = Object.freeze([16, 18, 21]);
const COOKIE_DAYS = 30;
const secret = () => process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "kolakisa-dev";

// "0", "", null → 0 (aucun contrôle) ; sinon 16, 18 ou 21.
function parseLevel(v) {
  const n = Number(v === "" || v == null ? 0 : v);
  if (n === 0) return 0;
  if (!LEVELS.includes(n)) throw new MarketingError("invalid_field", "L'âge minimum doit être 0 (aucun), 16, 18 ou 21.");
  return n;
}
function saveProduct(db, productId, level) {
  const n = parseLevel(level);
  if (!n) db.prepare("DELETE FROM mk_shop_product_age WHERE product_id = ?").run(Number(productId));
  else db.prepare("INSERT INTO mk_shop_product_age (product_id, min_age) VALUES (?,?) ON CONFLICT(product_id) DO UPDATE SET min_age = excluded.min_age").run(Number(productId), n);
  return n;
}
function saveCategory(db, categoryId, level) {
  const n = parseLevel(level);
  if (!n) db.prepare("DELETE FROM mk_shop_category_age WHERE category_id = ?").run(Number(categoryId));
  else db.prepare("INSERT INTO mk_shop_category_age (category_id, min_age) VALUES (?,?) ON CONFLICT(category_id) DO UPDATE SET min_age = excluded.min_age").run(Number(categoryId), n);
  return n;
}
function productLevel(db, productId) {
  const r = db.prepare("SELECT min_age FROM mk_shop_product_age WHERE product_id = ?").get(Number(productId) || 0);
  return r ? r.min_age : 0;
}
function categoryLevels(db) {
  return new Map(db.prepare("SELECT category_id, min_age FROM mk_shop_category_age").all().map((r) => [r.category_id, r.min_age]));
}
// Âge minimum exigé pour un ensemble de produits (le plus élevé entre le réglage du produit et celui de ses catégories). 0 = aucun.
function requiredForProducts(db, productIds) {
  const ids = [...new Set((productIds || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  if (!ids.length) return 0;
  const marks = ids.map(() => "?").join(",");
  const a = db.prepare(`SELECT MAX(min_age) AS m FROM mk_shop_product_age WHERE product_id IN (${marks})`).get(...ids).m || 0;
  const b = db.prepare(`SELECT MAX(ca.min_age) AS m FROM mk_shop_category_age ca JOIN mk_shop_product_categories pc ON pc.category_id = ca.category_id WHERE pc.product_id IN (${marks})`).get(...ids).m || 0;
  return Math.max(a, b);
}
const requiredForProduct = (db, productId) => requiredForProducts(db, [productId]);

// ── Cookie signé : "<âge>.<expiration>.<signature>" lié à la boutique (organisation + site) ──
const scopeOf = (s) => `${s.organizationId}:${s.siteId == null ? 0 : s.siteId}`;
const sign = (s, age, exp) => crypto.createHmac("sha256", secret()).update(`shop-age:${scopeOf(s)}:${age}:${exp}`).digest("hex").slice(0, 32);
function makeCookie(s, age, now = Date.now()) {
  const exp = Math.floor(now / 1000) + COOKIE_DAYS * 86400;
  return `${age}.${exp}.${sign(s, age, exp)}`;
}
// → âge confirmé (0 si cookie absent, falsifié, périmé ou d'une autre boutique)
function confirmedAge(s, cookie, now = Date.now()) {
  const m = /^(16|18|21)\.(\d{1,12})\.([0-9a-f]{32})$/.exec(String(cookie || ""));
  if (!m) return 0;
  const age = Number(m[1]); const exp = Number(m[2]);
  if (exp * 1000 < now) return 0;
  const a = Buffer.from(sign(s, age, exp)); const b = Buffer.from(m[3]);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? age : 0;
}
// Refuse si le produit exige un âge supérieur à celui déclaré.
function assertAllowed(db, productId, confirmed) {
  const need = requiredForProduct(db, productId);
  if (need > (Number(confirmed) || 0)) throw new MarketingError("age_required", `Ce produit est réservé aux personnes de ${need} ans et plus : confirmez votre âge avant de l'ajouter au panier.`);
  return need;
}
module.exports = { LEVELS, COOKIE_DAYS, parseLevel, saveProduct, saveCategory, productLevel, categoryLevels, requiredForProducts, requiredForProduct, makeCookie, confirmedAge, assertAllowed };
