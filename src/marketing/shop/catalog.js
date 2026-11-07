// Programme 20.5 — Catalogue : produits, variantes, catégories, requêtes de catalogue.
// Toutes les fonctions reçoivent une PORTÉE serveur `s = { db, organizationId, siteId }` (siteId null = site principal) : aucune requête n'est faite sans elle,
// jamais à partir d'un identifiant de site fourni par le navigateur. Les prix sont des entiers (centimes).
const { MarketingError } = require("../errors");
const { transaction } = require("../db/tx");
const access = require("./access");

const OPERATIONAL_TYPES = Object.freeze(["simple", "variable", "digital"]); // « downloadable » et « grouped » : réservés, pas encore traités
const STATUSES = ["draft", "published", "archived"];
const SORTS = Object.freeze({
  newest: "p.id DESC", featured: "p.is_featured DESC, p.id DESC", name: "p.name COLLATE NOCASE ASC, p.id ASC",
  price_asc: "eff_price ASC, p.id ASC", price_desc: "eff_price DESC, p.id ASC",
});

const siteCond = (s, alias = "") => (s.siteId == null ? `${alias}site_id IS NULL` : `${alias}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const nowSql = (d = new Date()) => d.toISOString().slice(0, 19).replace("T", " ");

const slugify = (text) => String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const json = (value, fallback) => { try { const v = JSON.parse(value); return v == null ? fallback : v; } catch { return fallback; } };
const text = (v, max, field, { required = false } = {}) => {
  const t = v == null ? "" : String(v).trim();
  if (required && !t) throw new MarketingError("invalid_field", `${field} est obligatoire.`);
  if (t.length > max) throw new MarketingError("invalid_field", `${field} est trop long (${max} caractères au maximum).`);
  return t || null;
};
const money = (v, field, { nullable = false } = {}) => {
  if (v === undefined || v === null || v === "") { if (nullable) return null; throw new MarketingError("invalid_field", `${field} est obligatoire.`); }
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 100000000) throw new MarketingError("invalid_field", `${field} doit être un montant entier positif en centimes.`);
  return n;
};
const intOrNull = (v, field, max = 1000000000) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > max) throw new MarketingError("invalid_field", `${field} doit être un entier positif.`);
  return n;
};
const urlOrNull = (v, field) => {
  const t = text(v, 2000, field);
  if (!t) return null;
  if (!/^(\/[^\s]*|https?:\/\/[^\s]+)$/i.test(t) || /^\/\//.test(t)) throw new MarketingError("invalid_field", `${field} doit être une adresse relative ou http(s).`);
  return t;
};
const dateOrNull = (v, field) => {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(String(v).replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(v)) ? "" : "Z"));
  if (Number.isNaN(d.getTime())) throw new MarketingError("invalid_field", `${field} n'est pas une date valide.`);
  return nowSql(d);
};

// ── Prix ────────────────────────────────────────────────────────────────────────────────────
function saleActive(product, now = new Date()) {
  const t = nowSql(now);
  return (!product.sale_starts_at || product.sale_starts_at <= t) && (!product.sale_ends_at || product.sale_ends_at >= t);
}
// Prix de vente d'une ligne : promotion seulement si elle BAISSE le prix et si sa période est en cours. → { unitCents, regularCents, onSale }
function priceOf(product, variant, now = new Date()) {
  const regular = variant && variant.price_cents != null ? variant.price_cents : product.price_cents;
  // Promotion d'une variante : la sienne ; à défaut celle du produit, seulement si la variante n'a pas son propre prix.
  let sale = product.sale_price_cents;
  if (variant) sale = variant.sale_price_cents != null ? variant.sale_price_cents : (variant.price_cents == null ? product.sale_price_cents : null);
  const useSale = sale != null && sale < regular && saleActive(product, now);
  return { unitCents: useSale ? sale : regular, regularCents: regular, onSale: useSale };
}
// Stock disponible pour une ligne (null = illimité).
function stockOf(product, variant) {
  const holder = variant || product;
  if (!holder.manage_stock) return null;
  return holder.stock_qty;
}

// ── Catégories ──────────────────────────────────────────────────────────────────────────────
function listCategories(s) {
  return s.db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM mk_shop_product_categories pc JOIN mk_shop_products p ON p.id = pc.product_id WHERE pc.category_id = c.id AND p.deleted_at IS NULL AND p.status = 'published') AS product_count
    FROM mk_shop_categories c WHERE c.organization_id = ? AND ${siteCond(s, "c.")} ORDER BY c.position, c.name COLLATE NOCASE`).all(s.organizationId, ...siteArgs(s));
}
function categoryBySlug(s, slug) {
  return s.db.prepare(`SELECT * FROM mk_shop_categories WHERE organization_id = ? AND ${siteCond(s)} AND slug = ?`).get(s.organizationId, ...siteArgs(s), String(slug || ""));
}
function categoryById(s, id) {
  return s.db.prepare(`SELECT * FROM mk_shop_categories WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(id) || 0, s.organizationId, ...siteArgs(s));
}
function descendantIds(s, id) {
  const all = s.db.prepare(`SELECT id, parent_id FROM mk_shop_categories WHERE organization_id = ? AND ${siteCond(s)}`).all(s.organizationId, ...siteArgs(s));
  const out = new Set([id]);
  let grew = true;
  while (grew) { grew = false; for (const c of all) if (c.parent_id && out.has(c.parent_id) && !out.has(c.id)) { out.add(c.id); grew = true; } }
  return [...out];
}
function saveCategory(s, input, id = null) {
  const name = text(input.name, 120, "Le nom", { required: true });
  const slug = slugify(input.slug || name);
  if (!slug) throw new MarketingError("invalid_field", "Le nom doit contenir au moins une lettre ou un chiffre.");
  let parentId = null;
  if (input.parent_id) {
    const parent = categoryById(s, input.parent_id);
    if (!parent) throw new MarketingError("not_found", "Catégorie parente introuvable.");
    if (id && descendantIds(s, id).includes(parent.id)) throw new MarketingError("invalid_field", "Une catégorie ne peut pas être son propre parent.");
    parentId = parent.id;
  }
  const dup = s.db.prepare(`SELECT id FROM mk_shop_categories WHERE organization_id = ? AND ${siteCond(s)} AND slug = ? AND id <> ?`).get(s.organizationId, ...siteArgs(s), slug, id || 0);
  if (dup) throw new MarketingError("conflict", "Une catégorie porte déjà cette adresse.");
  const vals = [name, slug, parentId, text(input.description, 2000, "La description"), urlOrNull(input.image_url, "L'image"), intOrNull(input.position, "La position") ?? 0];
  if (id) {
    if (!categoryById(s, id)) throw new MarketingError("not_found", "Catégorie introuvable.");
    s.db.prepare("UPDATE mk_shop_categories SET name = ?, slug = ?, parent_id = ?, description = ?, image_url = ?, position = ? WHERE id = ?").run(...vals, id);
    return id;
  }
  return Number(s.db.prepare("INSERT INTO mk_shop_categories (name, slug, parent_id, description, image_url, position, organization_id, site_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(...vals, s.organizationId, s.siteId ?? null).lastInsertRowid);
}
function deleteCategory(s, id) {
  if (!categoryById(s, id)) throw new MarketingError("not_found", "Catégorie introuvable.");
  s.db.prepare("DELETE FROM mk_shop_categories WHERE id = ?").run(id);
}

// ── Produits ────────────────────────────────────────────────────────────────────────────────
function uniqueSlug(s, base, exceptId = 0) {
  let slug = base || "produit";
  for (let n = 2; s.db.prepare(`SELECT 1 FROM mk_shop_products WHERE organization_id = ? AND ${siteCond(s)} AND slug = ? AND id <> ? AND deleted_at IS NULL`).get(s.organizationId, ...siteArgs(s), slug, exceptId); n += 1) slug = `${base}-${n}`;
  return slug;
}
function cleanList(v, max, item) {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[\n,]/) : [];
  return [...new Set(arr.map((x) => String(x).trim()).filter(Boolean))].slice(0, max).map((x) => { if (x.length > item) throw new MarketingError("invalid_field", "Un élément de liste est trop long."); return x; });
}
function cleanAttributes(v) {
  const arr = Array.isArray(v) ? v : [];
  return arr.slice(0, 5).map((a) => ({ name: text(a && a.name, 60, "Le nom d'attribut", { required: true }), values: cleanList(a && a.values, 30, 60) })).filter((a) => a.values.length);
}

function productFields(s, input, existing = null) {
  const type = input.type ?? (existing && existing.type) ?? "simple";
  if (!OPERATIONAL_TYPES.includes(type)) throw new MarketingError("invalid_field", `Le type « ${type} » n'est pas encore pris en charge (types disponibles : simple, variable, numérique).`);
  const status = input.status ?? (existing && existing.status) ?? "draft";
  if (!STATUSES.includes(status)) throw new MarketingError("invalid_field", "Statut inconnu.");
  const name = text(input.name ?? (existing && existing.name), 200, "Le nom", { required: true });
  const price = money(input.price_cents ?? (existing ? existing.price_cents : undefined), "Le prix");
  const sale = money(input.sale_price_cents !== undefined ? input.sale_price_cents : existing && existing.sale_price_cents, "Le prix promotionnel", { nullable: true });
  if (sale != null && sale >= price) throw new MarketingError("invalid_field", "Le prix promotionnel doit être inférieur au prix normal.");
  const startsAt = dateOrNull(input.sale_starts_at !== undefined ? input.sale_starts_at : existing && existing.sale_starts_at, "Le début de promotion");
  const endsAt = dateOrNull(input.sale_ends_at !== undefined ? input.sale_ends_at : existing && existing.sale_ends_at, "La fin de promotion");
  if (startsAt && endsAt && endsAt < startsAt) throw new MarketingError("invalid_field", "La fin de promotion précède son début.");
  const manage = (input.manage_stock !== undefined ? Boolean(Number(input.manage_stock)) : Boolean(existing && existing.manage_stock)) ? 1 : 0;
  const requiresShipping = type === "digital" ? 0 : (input.requires_shipping !== undefined ? (Number(input.requires_shipping) ? 1 : 0) : existing ? existing.requires_shipping : 1);
  const sku = text(input.sku !== undefined ? input.sku : existing && existing.sku, 80, "Le SKU");
  return {
    type, status, name, price, sale, startsAt, endsAt, manage, requiresShipping, sku,
    stock: intOrNull(input.stock_qty !== undefined ? input.stock_qty : existing && existing.stock_qty, "Le stock") ?? 0,
    short: text(input.short_description !== undefined ? input.short_description : existing && existing.short_description, 600, "La description courte"),
    description: text(input.description !== undefined ? input.description : existing && existing.description, 20000, "La description"),
    weight: intOrNull(input.weight_grams !== undefined ? input.weight_grams : existing && existing.weight_grams, "Le poids"),
    length: intOrNull(input.length_mm !== undefined ? input.length_mm : existing && existing.length_mm, "La longueur"),
    width: intOrNull(input.width_mm !== undefined ? input.width_mm : existing && existing.width_mm, "La largeur"),
    height: intOrNull(input.height_mm !== undefined ? input.height_mm : existing && existing.height_mm, "La hauteur"),
    image: urlOrNull(input.image_url !== undefined ? input.image_url : existing && existing.image_url, "L'image"),
    gallery: JSON.stringify(input.gallery !== undefined ? cleanList(input.gallery, 12, 2000).map((u) => urlOrNull(u, "Une image de galerie")) : json(existing && existing.gallery, [])),
    tags: JSON.stringify(input.tags !== undefined ? cleanList(input.tags, 20, 40) : json(existing && existing.tags, [])),
    attributes: JSON.stringify(type === "variable" ? cleanAttributes(input.attributes !== undefined ? input.attributes : json(existing && existing.attributes, [])) : []),
    featured: (input.is_featured !== undefined ? Boolean(Number(input.is_featured)) : Boolean(existing && existing.is_featured)) ? 1 : 0,
    seoTitle: text(input.seo_title !== undefined ? input.seo_title : existing && existing.seo_title, 160, "Le titre SEO"),
    seoDescription: text(input.seo_description !== undefined ? input.seo_description : existing && existing.seo_description, 320, "La description SEO"),
    position: intOrNull(input.position !== undefined ? input.position : existing && existing.position, "La position") ?? 0,
  };
}

function setProductCategories(s, productId, ids) {
  const wanted = [...new Set((ids || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  for (const cid of wanted) if (!categoryById(s, cid)) throw new MarketingError("not_found", "Catégorie introuvable.");
  s.db.prepare("DELETE FROM mk_shop_product_categories WHERE product_id = ?").run(productId);
  const ins = s.db.prepare("INSERT INTO mk_shop_product_categories (product_id, category_id) VALUES (?, ?)");
  for (const cid of wanted) ins.run(productId, cid);
}

function getProduct(s, id) {
  return s.db.prepare(`SELECT * FROM mk_shop_products WHERE id = ? AND organization_id = ? AND ${siteCond(s)} AND deleted_at IS NULL`).get(Number(id) || 0, s.organizationId, ...siteArgs(s)) || null;
}

function createProduct(s, input, userId = null) {
  return transaction(s.db, () => {
    const f = productFields(s, input);
    const slug = uniqueSlug(s, slugify(input.slug || f.name));
    if (f.sku && s.db.prepare(`SELECT 1 FROM mk_shop_products WHERE organization_id = ? AND ${siteCond(s)} AND sku = ? AND deleted_at IS NULL`).get(s.organizationId, ...siteArgs(s), f.sku)) throw new MarketingError("conflict", "Ce SKU est déjà utilisé.");
    const id = Number(s.db.prepare(`INSERT INTO mk_shop_products (organization_id, site_id, type, status, name, slug, short_description, description, sku, price_cents, sale_price_cents, sale_starts_at, sale_ends_at,
      manage_stock, stock_qty, weight_grams, length_mm, width_mm, height_mm, requires_shipping, image_url, gallery, tags, attributes, is_featured, seo_title, seo_description, position, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(s.organizationId, s.siteId ?? null, f.type, f.status, f.name, slug, f.short, f.description, f.sku, f.price, f.sale, f.startsAt, f.endsAt,
      f.manage, f.stock, f.weight, f.length, f.width, f.height, f.requiresShipping, f.image, f.gallery, f.tags, f.attributes, f.featured, f.seoTitle, f.seoDescription, f.position, userId).lastInsertRowid);
    if (input.category_ids) setProductCategories(s, id, input.category_ids);
    return id;
  });
}

function updateProduct(s, id, input) {
  return transaction(s.db, () => {
    const existing = getProduct(s, id);
    if (!existing) throw new MarketingError("not_found", "Produit introuvable.");
    if (input.type && input.type !== existing.type) {
      const hasVariants = s.db.prepare("SELECT 1 FROM mk_shop_variants WHERE product_id = ?").get(id);
      if (hasVariants && input.type !== "variable") throw new MarketingError("invalid_field", "Supprimez d'abord les variantes pour changer le type du produit.");
    }
    const f = productFields(s, input, existing);
    const slug = input.slug ? uniqueSlug(s, slugify(input.slug), id) : existing.slug;
    if (f.sku && s.db.prepare(`SELECT 1 FROM mk_shop_products WHERE organization_id = ? AND ${siteCond(s)} AND sku = ? AND id <> ? AND deleted_at IS NULL`).get(s.organizationId, ...siteArgs(s), f.sku, id)) throw new MarketingError("conflict", "Ce SKU est déjà utilisé.");
    s.db.prepare(`UPDATE mk_shop_products SET type=?, status=?, name=?, slug=?, short_description=?, description=?, sku=?, price_cents=?, sale_price_cents=?, sale_starts_at=?, sale_ends_at=?,
      manage_stock=?, stock_qty=?, weight_grams=?, length_mm=?, width_mm=?, height_mm=?, requires_shipping=?, image_url=?, gallery=?, tags=?, attributes=?, is_featured=?, seo_title=?, seo_description=?, position=?, updated_at=datetime('now') WHERE id = ?`)
      .run(f.type, f.status, f.name, slug, f.short, f.description, f.sku, f.price, f.sale, f.startsAt, f.endsAt, f.manage, f.stock, f.weight, f.length, f.width, f.height, f.requiresShipping, f.image, f.gallery, f.tags, f.attributes, f.featured, f.seoTitle, f.seoDescription, f.position, id);
    if (input.category_ids) setProductCategories(s, id, input.category_ids);
    return id;
  });
}

function deleteProduct(s, id) {
  if (!getProduct(s, id)) throw new MarketingError("not_found", "Produit introuvable.");
  // Suppression douce : les commandes passées gardent leur instantané ; le produit disparaît du catalogue et des paniers.
  s.db.prepare("UPDATE mk_shop_products SET deleted_at = datetime('now'), status = 'archived', sku = NULL WHERE id = ?").run(id);
  s.db.prepare("DELETE FROM mk_shop_cart_items WHERE product_id = ?").run(id);
}

// ── Variantes ───────────────────────────────────────────────────────────────────────────────
const optionsKey = (options) => JSON.stringify(Object.keys(options).sort().map((k) => [k, options[k]]));
function listVariants(s, productId) {
  const p = getProduct(s, productId);
  if (!p) return [];
  return s.db.prepare("SELECT * FROM mk_shop_variants WHERE product_id = ? ORDER BY id").all(productId).map((v) => ({ ...v, options: json(v.options, {}) }));
}
function saveVariant(s, productId, input, variantId = null) {
  const p = getProduct(s, productId);
  if (!p) throw new MarketingError("not_found", "Produit introuvable.");
  if (p.type !== "variable") throw new MarketingError("invalid_field", "Seul un produit variable possède des variantes.");
  const attrs = json(p.attributes, []);
  const raw = input.options && typeof input.options === "object" ? input.options : {};
  const options = {};
  for (const a of attrs) {
    const value = raw[a.name];
    if (value === undefined || value === null || value === "") throw new MarketingError("invalid_field", `L'option « ${a.name} » est obligatoire.`);
    if (!a.values.includes(String(value))) throw new MarketingError("invalid_field", `La valeur « ${value} » n'existe pas pour « ${a.name} ».`);
    options[a.name] = String(value);
  }
  if (!attrs.length) throw new MarketingError("invalid_field", "Définissez d'abord les attributs du produit (ex. Taille : S, M, L).");
  const key = optionsKey(options);
  const dup = s.db.prepare("SELECT id FROM mk_shop_variants WHERE product_id = ? AND options_key = ? AND id <> ?").get(productId, key, variantId || 0);
  if (dup) throw new MarketingError("conflict", "Cette combinaison existe déjà.");
  const price = money(input.price_cents, "Le prix", { nullable: true });
  const sale = money(input.sale_price_cents, "Le prix promotionnel", { nullable: true });
  if (sale != null && sale >= (price != null ? price : p.price_cents)) throw new MarketingError("invalid_field", "Le prix promotionnel doit être inférieur au prix normal.");
  const sku = text(input.sku, 80, "Le SKU");
  if (sku && s.db.prepare(`SELECT 1 FROM mk_shop_variants WHERE organization_id = ? AND ${siteCond(s)} AND sku = ? AND id <> ?`).get(s.organizationId, ...siteArgs(s), sku, variantId || 0)) throw new MarketingError("conflict", "Ce SKU est déjà utilisé.");
  const vals = [sku, JSON.stringify(options), key, price, sale, Number(input.manage_stock ?? 1) ? 1 : 0, intOrNull(input.stock_qty, "Le stock") ?? 0, intOrNull(input.weight_grams, "Le poids"), urlOrNull(input.image_url, "L'image"), Number(input.active ?? 1) ? 1 : 0];
  if (variantId) {
    if (!s.db.prepare("SELECT 1 FROM mk_shop_variants WHERE id = ? AND product_id = ?").get(variantId, productId)) throw new MarketingError("not_found", "Variante introuvable.");
    s.db.prepare("UPDATE mk_shop_variants SET sku=?, options=?, options_key=?, price_cents=?, sale_price_cents=?, manage_stock=?, stock_qty=?, weight_grams=?, image_url=?, active=?, updated_at=datetime('now') WHERE id = ?").run(...vals, variantId);
    return variantId;
  }
  return Number(s.db.prepare("INSERT INTO mk_shop_variants (sku, options, options_key, price_cents, sale_price_cents, manage_stock, stock_qty, weight_grams, image_url, active, organization_id, site_id, product_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").run(...vals, s.organizationId, s.siteId ?? null, productId).lastInsertRowid);
}
function deleteVariant(s, productId, variantId) {
  if (!getProduct(s, productId)) throw new MarketingError("not_found", "Produit introuvable.");
  const r = s.db.prepare("DELETE FROM mk_shop_variants WHERE id = ? AND product_id = ?").run(variantId, productId);
  if (!r.changes) throw new MarketingError("not_found", "Variante introuvable.");
}

// Ajustement manuel du stock (journalisé). `delta` positif ou négatif ; le stock ne descend jamais sous zéro.
function adjustStock(s, productId, variantId, delta, userId = null) {
  return transaction(s.db, () => {
    const p = getProduct(s, productId);
    if (!p) throw new MarketingError("not_found", "Produit introuvable.");
    const n = Number(delta);
    if (!Number.isInteger(n) || n === 0 || Math.abs(n) > 1000000) throw new MarketingError("invalid_field", "L'ajustement doit être un entier non nul.");
    const table = variantId ? "mk_shop_variants" : "mk_shop_products";
    const id = variantId || productId;
    if (variantId && !s.db.prepare("SELECT 1 FROM mk_shop_variants WHERE id = ? AND product_id = ?").get(variantId, productId)) throw new MarketingError("not_found", "Variante introuvable.");
    const r = s.db.prepare(`UPDATE ${table} SET stock_qty = stock_qty + ? WHERE id = ? AND stock_qty + ? >= 0`).run(n, id, n);
    if (!r.changes) throw new MarketingError("invalid_field", "Le stock ne peut pas devenir négatif.");
    s.db.prepare("INSERT INTO mk_shop_stock_movements (organization_id, site_id, product_id, variant_id, delta, reason, user_id) VALUES (?,?,?,?,?, 'adjustment', ?)").run(s.organizationId, s.siteId ?? null, productId, variantId || null, n, userId);
  });
}

// ── Lecture ─────────────────────────────────────────────────────────────────────────────────
const saleOk = "(p.sale_starts_at IS NULL OR p.sale_starts_at <= ?) AND (p.sale_ends_at IS NULL OR p.sale_ends_at >= ?)";
const effSql = "CASE WHEN {sale} IS NOT NULL AND {sale} < {price} AND " + saleOk + " THEN {sale} ELSE {price} END";
const VAR_SALE = "COALESCE(v.sale_price_cents, CASE WHEN v.price_cents IS NULL THEN p.sale_price_cents END)";
const effExpr = (price, sale) => effSql.replaceAll("{sale}", sale).replaceAll("{price}", price);

function hydrate(s, rows, now = new Date()) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const marks = ids.map(() => "?").join(",");
  const variants = s.db.prepare(`SELECT * FROM mk_shop_variants WHERE product_id IN (${marks}) AND active = 1 ORDER BY id`).all(...ids);
  const cats = s.db.prepare(`SELECT pc.product_id, c.id, c.name, c.slug FROM mk_shop_product_categories pc JOIN mk_shop_categories c ON c.id = pc.category_id WHERE pc.product_id IN (${marks}) ORDER BY c.name COLLATE NOCASE`).all(...ids);
  return rows.map((p) => {
    const vs = variants.filter((v) => v.product_id === p.id).map((v) => ({ ...v, options: json(v.options, {}) }));
    const prices = p.type === "variable" ? vs.map((v) => priceOf(p, v, now)) : [priceOf(p, null, now)];
    const unit = prices.length ? Math.min(...prices.map((x) => x.unitCents)) : p.price_cents;
    const regular = prices.length ? Math.min(...prices.map((x) => x.regularCents)) : p.price_cents;
    const inStock = p.type === "variable" ? vs.some((v) => !v.manage_stock || v.stock_qty > 0) : (!p.manage_stock || p.stock_qty > 0);
    return {
      ...p, gallery: json(p.gallery, []), tags: json(p.tags, []), attributes: json(p.attributes, []), variants: vs,
      categories: cats.filter((c) => c.product_id === p.id).map(({ id, name, slug }) => ({ id, name, slug })),
      priceFromCents: unit, regularFromCents: regular, onSale: prices.some((x) => x.onSale), inStock, isVariable: p.type === "variable",
    };
  });
}

// Catalogue public (produits publiés de CETTE boutique). Filtres, tri et pagination sont exécutés par la base (jamais en mémoire sur tout le catalogue).
function catalogQuery(s, q = {}, now = new Date()) {
  const t = nowSql(now);
  const where = [`p.organization_id = ?`, siteCond(s, "p."), "p.deleted_at IS NULL", "p.status = 'published'"];
  const args = [s.organizationId, ...siteArgs(s)];
  const varPrice = effExpr("COALESCE(v.price_cents, p.price_cents)", VAR_SALE);
  const effPrice = `CASE WHEN p.type = 'variable' THEN COALESCE((SELECT MIN(${varPrice}) FROM mk_shop_variants v WHERE v.product_id = p.id AND v.active = 1), p.price_cents) ELSE ${effExpr("p.price_cents", "p.sale_price_cents")} END`;
  // Les paramètres de l'expression de prix (4 occurrences de la date par appel) sont ajoutés dans l'ordre d'apparition.
  const effArgs = [t, t, t, t];
  const where2 = [];
  const args2 = [];
  // Accès membre : les produits « masqués » ne sortent jamais pour un visiteur non-membre (aucun appelant n'a à s'en souvenir).
  const hid = access.hiddenIds(s);
  if (hid.length) { where.push("p.id NOT IN (SELECT value FROM json_each(?))"); args.push(JSON.stringify(hid)); }

  if (q.q) {
    const like = `%${String(q.q).slice(0, 80).replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    where2.push("(p.name LIKE ? ESCAPE '\\' OR p.sku LIKE ? ESCAPE '\\' OR p.short_description LIKE ? ESCAPE '\\' OR p.tags LIKE ? ESCAPE '\\' OR EXISTS (SELECT 1 FROM mk_shop_variants v WHERE v.product_id = p.id AND v.sku LIKE ? ESCAPE '\\'))");
    args2.push(like, like, like, like, like);
  }
  if (q.category) {
    const cat = categoryBySlug(s, q.category);
    if (!cat) return { items: [], total: 0, page: 1, pages: 0, perPage: 1 };
    const ids = descendantIds(s, cat.id);
    where2.push(`EXISTS (SELECT 1 FROM mk_shop_product_categories pc WHERE pc.product_id = p.id AND pc.category_id IN (${ids.map(() => "?").join(",")}))`);
    args2.push(...ids);
  }
  if (q.tag) { where2.push("p.tags LIKE ? ESCAPE '\\'"); args2.push(`%"${String(q.tag).slice(0, 40).replace(/[\\%_"]/g, (m) => `\\${m}`)}"%`); }
  if (q.featured) where2.push("p.is_featured = 1");
  if (q.inStock) where2.push("(CASE WHEN p.type = 'variable' THEN EXISTS (SELECT 1 FROM mk_shop_variants v WHERE v.product_id = p.id AND v.active = 1 AND (v.manage_stock = 0 OR v.stock_qty > 0)) ELSE (p.manage_stock = 0 OR p.stock_qty > 0) END)");
  if (q.onSale) {
    where2.push(`(CASE WHEN p.type = 'variable' THEN EXISTS (SELECT 1 FROM mk_shop_variants v WHERE v.product_id = p.id AND v.active = 1 AND ${effExpr("COALESCE(v.price_cents, p.price_cents)", VAR_SALE)} < COALESCE(v.price_cents, p.price_cents)) ELSE ${effExpr("p.price_cents", "p.sale_price_cents")} < p.price_cents END)`);
    args2.push(t, t, t, t);
  }
  const minP = intOrNull(q.minPrice, "Le prix minimum"); const maxP = intOrNull(q.maxPrice, "Le prix maximum");
  const sortKey = SORTS[q.sort] ? q.sort : "newest";
  const perPage = Math.min(48, Math.max(1, Number(q.perPage) || 12));
  const page = Math.max(1, Number(q.page) || 1);

  const base = `FROM (SELECT p.*, (${effPrice}) AS eff_price FROM mk_shop_products p WHERE ${where.join(" AND ")}${where2.length ? ` AND ${where2.join(" AND ")}` : ""}) p WHERE 1=1${minP != null ? " AND p.eff_price >= ?" : ""}${maxP != null ? " AND p.eff_price <= ?" : ""}`;
  // L'ordre des paramètres suit l'ordre d'apparition des « ? » : prix effectif (SELECT), puis conditions internes, puis bornes de prix.
  const allArgs = [...effArgs, ...args, ...args2, ...(minP != null ? [minP] : []), ...(maxP != null ? [maxP] : [])];
  const total = s.db.prepare(`SELECT COUNT(*) AS n ${base}`).get(...allArgs).n;
  const rows = s.db.prepare(`SELECT p.* ${base} ORDER BY ${SORTS[sortKey]} LIMIT ? OFFSET ?`).all(...allArgs, perPage, (page - 1) * perPage);
  return { items: hydrate(s, rows, now), total, page, pages: Math.ceil(total / perPage), perPage, sort: sortKey };
}

function publicProduct(s, slug, now = new Date()) {
  const row = s.db.prepare(`SELECT * FROM mk_shop_products WHERE organization_id = ? AND ${siteCond(s)} AND slug = ? AND status = 'published' AND deleted_at IS NULL`).get(s.organizationId, ...siteArgs(s), String(slug || ""));
  if (row && access.isHidden(s, row.id)) return null; // produit masqué aux non-membres : même réponse qu'un produit inexistant
  return row ? hydrate(s, [row], now)[0] : null;
}
function productById(s, id, now = new Date()) {
  const row = getProduct(s, id);
  return row ? hydrate(s, [row], now)[0] : null;
}
function relatedProducts(s, product, limit = 4, now = new Date()) {
  const ids = product.categories.map((c) => c.id);
  if (!ids.length) return [];
  const rows = s.db.prepare(`SELECT DISTINCT p.* FROM mk_shop_products p JOIN mk_shop_product_categories pc ON pc.product_id = p.id WHERE pc.category_id IN (${ids.map(() => "?").join(",")}) AND p.id <> ? AND p.organization_id = ? AND ${siteCond(s, "p.")} AND p.status = 'published' AND p.deleted_at IS NULL ORDER BY p.is_featured DESC, p.id DESC LIMIT ?`)
    .all(...ids, product.id, s.organizationId, ...siteArgs(s), Math.min(12, Math.max(1, limit)));
  const hidden = access.hiddenIds(s);
  return hydrate(s, rows, now).filter((p) => !hidden.includes(p.id));
}

function adminList(s, { q, status, page = 1, perPage = 25 } = {}) {
  const where = ["organization_id = ?", siteCond(s), "deleted_at IS NULL"];
  const args = [s.organizationId, ...siteArgs(s)];
  if (status && STATUSES.includes(status)) { where.push("status = ?"); args.push(status); }
  if (q) { const like = `%${String(q).slice(0, 80).replace(/[\\%_]/g, (m) => `\\${m}`)}%`; where.push("(name LIKE ? ESCAPE '\\' OR sku LIKE ? ESCAPE '\\')"); args.push(like, like); }
  const total = s.db.prepare(`SELECT COUNT(*) AS n FROM mk_shop_products WHERE ${where.join(" AND ")}`).get(...args).n;
  const pp = Math.min(100, Math.max(1, Number(perPage) || 25));
  const rows = s.db.prepare(`SELECT * FROM mk_shop_products WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, pp, (Math.max(1, Number(page) || 1) - 1) * pp);
  return { items: hydrate(s, rows), total, page: Math.max(1, Number(page) || 1), pages: Math.ceil(total / pp) };
}

module.exports = {
  OPERATIONAL_TYPES, STATUSES, slugify, priceOf, stockOf, saleActive, nowSql,
  listCategories, categoryBySlug, categoryById, saveCategory, deleteCategory, descendantIds,
  createProduct, updateProduct, deleteProduct, getProduct, productById, publicProduct, relatedProducts, adminList, hydrate, setProductCategories,
  listVariants, saveVariant, deleteVariant, adjustStock, catalogQuery,
};
