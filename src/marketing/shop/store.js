// Programme 20.5 — Paramètres de boutique, livraison, taxes et coupons (tout par site, jamais de valeur fiscale par défaut).
const { MarketingError } = require("../errors");
const catalog = require("./catalog");

const METHODS = Object.freeze(["stripe", "manual"]);
const siteCond = (s, alias = "") => (s.siteId == null ? `${alias}site_id IS NULL` : `${alias}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const json = (v, f) => { try { const x = JSON.parse(v); return x == null ? f : x; } catch { return f; } };
const country = (v, field = "Le pays") => {
  const c = String(v || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) throw new MarketingError("invalid_field", `${field} doit être un code ISO à deux lettres (ex. FR).`);
  return c;
};

// ── Paramètres ──────────────────────────────────────────────────────────────────────────────
function getSettings(s) {
  let row = s.db.prepare(`SELECT * FROM mk_shop_settings WHERE organization_id = ? AND ${siteCond(s)}`).get(s.organizationId, ...siteArgs(s));
  if (!row) {
    s.db.prepare("INSERT INTO mk_shop_settings (organization_id, site_id) VALUES (?, ?)").run(s.organizationId, s.siteId ?? null);
    row = s.db.prepare(`SELECT * FROM mk_shop_settings WHERE organization_id = ? AND ${siteCond(s)}`).get(s.organizationId, ...siteArgs(s));
  }
  return { ...row, payment_methods: json(row.payment_methods, []).filter((m) => METHODS.includes(m)) };
}
function saveSettings(s, input) {
  const cur = getSettings(s);
  const cur2 = String(input.currency ?? cur.currency).toLowerCase();
  if (!/^[a-z]{3}$/.test(cur2)) throw new MarketingError("invalid_field", "La devise doit être un code à trois lettres (ex. eur).");
  const methods = input.payment_methods !== undefined ? [...new Set([].concat(input.payment_methods).filter((m) => METHODS.includes(m)))] : cur.payment_methods;
  const bool = (k) => (input[k] !== undefined ? (Number(input[k]) ? 1 : 0) : cur[k]);
  const dc = input.default_country !== undefined && input.default_country !== "" ? country(input.default_country, "Le pays par défaut") : (input.default_country === "" ? null : cur.default_country);
  const email = input.notify_email !== undefined ? String(input.notify_email).trim() : cur.notify_email;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new MarketingError("invalid_field", "L'adresse de notification est invalide.");
  const prefix = String(input.order_prefix ?? cur.order_prefix).trim().toUpperCase();
  if (!/^[A-Z0-9]{1,8}$/.test(prefix)) throw new MarketingError("invalid_field", "Le préfixe de commande : 1 à 8 lettres ou chiffres.");
  const threshold = Number(input.low_stock_threshold ?? cur.low_stock_threshold);
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100000) throw new MarketingError("invalid_field", "Seuil de stock bas invalide.");
  const manual = input.manual_instructions !== undefined ? String(input.manual_instructions).slice(0, 2000) : cur.manual_instructions;
  s.db.prepare(`UPDATE mk_shop_settings SET enabled=?, currency=?, prices_include_tax=?, tax_enabled=?, default_country=?, guest_checkout=?, low_stock_threshold=?, payment_methods=?, manual_instructions=?, notify_email=?, order_prefix=?, reviews_enabled=?, reviews_auto_publish=?, updated_at=datetime('now') WHERE id = ?`)
    .run(bool("enabled"), cur2, bool("prices_include_tax"), bool("tax_enabled"), dc, bool("guest_checkout"), threshold, JSON.stringify(methods), manual || null, email || null, prefix, bool("reviews_enabled"), bool("reviews_auto_publish"), cur.id);
  return getSettings(s);
}

// ── Livraison ───────────────────────────────────────────────────────────────────────────────
// Motifs de code postal : 75*, 13000-13999, 1000 (séparés par des virgules) ; seuls lettres, chiffres, *, - et , sont gardés
function cleanPostcodes(v) {
  const list = String(v == null ? "" : v).split(/[,;\n]+/).map((x) => x.trim().toUpperCase().replace(/\s+/g, "")).filter(Boolean);
  for (const x of list) if (!/^[A-Z0-9*-]{1,20}$/.test(x)) throw new MarketingError("invalid_field", `Motif de code postal invalide : « ${x} ». Exemples : 75*, 13000-13999, 1000.`);
  return list.slice(0, 200).join(", ");
}
function listZones(s) {
  const zones = s.db.prepare(`SELECT * FROM mk_shop_shipping_zones WHERE organization_id = ? AND ${siteCond(s)} ORDER BY position, id`).all(s.organizationId, ...siteArgs(s)).map((z) => ({ ...z, countries: json(z.countries, []) }));
  const methods = zones.length ? s.db.prepare(`SELECT * FROM mk_shop_shipping_methods WHERE zone_id IN (${zones.map(() => "?").join(",")}) ORDER BY position, id`).all(...zones.map((z) => z.id)) : [];
  const costs = methods.length ? s.db.prepare(`SELECT method_id, class_id, cost_cents FROM mk_shop_shipping_class_costs WHERE method_id IN (${methods.map(() => "?").join(",")})`).all(...methods.map((m) => m.id)) : [];
  const withCosts = methods.map((m) => ({ ...m, class_costs: Object.fromEntries(costs.filter((c) => c.method_id === m.id).map((c) => [c.class_id, c.cost_cents])) }));
  return zones.map((z) => ({ ...z, methods: withCosts.filter((m) => m.zone_id === z.id) }));
}
function saveZone(s, input, id = null) {
  const name = String(input.name || "").trim();
  if (!name || name.length > 80) throw new MarketingError("invalid_field", "Le nom de la zone est obligatoire (80 caractères au maximum).");
  const list = (Array.isArray(input.countries) ? input.countries : String(input.countries || "").split(/[\s,;]+/)).filter(Boolean).map((c) => country(c));
  const countries = JSON.stringify([...new Set(list)]);
  const postcodes = cleanPostcodes(input.postcodes);
  if (id) {
    if (!s.db.prepare(`SELECT 1 FROM mk_shop_shipping_zones WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(id, s.organizationId, ...siteArgs(s))) throw new MarketingError("not_found", "Zone introuvable.");
    s.db.prepare("UPDATE mk_shop_shipping_zones SET name = ?, countries = ?, postcodes = ? WHERE id = ?").run(name, countries, postcodes, id);
    return id;
  }
  return Number(s.db.prepare("INSERT INTO mk_shop_shipping_zones (organization_id, site_id, name, countries, postcodes) VALUES (?,?,?,?,?)").run(s.organizationId, s.siteId ?? null, name, countries, postcodes).lastInsertRowid);
}
function deleteZone(s, id) {
  const r = s.db.prepare(`DELETE FROM mk_shop_shipping_zones WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(id, s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Zone introuvable.");
}
function saveMethod(s, zoneId, input) {
  if (!s.db.prepare(`SELECT 1 FROM mk_shop_shipping_zones WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(zoneId, s.organizationId, ...siteArgs(s))) throw new MarketingError("not_found", "Zone introuvable.");
  const name = String(input.name || "").trim();
  if (!name || name.length > 80) throw new MarketingError("invalid_field", "Le nom de la méthode est obligatoire.");
  if (!["flat", "free_over", "weight"].includes(input.kind)) throw new MarketingError("invalid_field", "Type de méthode inconnu.");
  const n = (v, f) => { if (v === undefined || v === null || v === "") return null; const x = Number(v); if (!Number.isInteger(x) || x < 0 || x > 1e9) throw new MarketingError("invalid_field", `${f} invalide.`); return x; };
  const cost = n(input.cost_cents, "Le coût") ?? 0;
  const minSub = n(input.min_subtotal_cents, "Le montant minimal");
  if (input.kind === "free_over" && minSub == null) throw new MarketingError("invalid_field", "Une livraison gratuite dès un montant exige ce montant.");
  const minW = n(input.min_weight_grams, "Le poids minimal"); const maxW = n(input.max_weight_grams, "Le poids maximal");
  if (minW != null && maxW != null && maxW < minW) throw new MarketingError("invalid_field", "Plage de poids incohérente.");
  return Number(s.db.prepare("INSERT INTO mk_shop_shipping_methods (organization_id, site_id, zone_id, name, kind, cost_cents, min_subtotal_cents, min_weight_grams, max_weight_grams) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(s.organizationId, s.siteId ?? null, zoneId, name, input.kind, cost, minSub, minW, maxW).lastInsertRowid);
}
function deleteMethod(s, id) {
  const r = s.db.prepare(`DELETE FROM mk_shop_shipping_methods WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(id, s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Méthode introuvable.");
}

// ── Taxes ───────────────────────────────────────────────────────────────────────────────────
function listTaxRules(s) {
  return s.db.prepare(`SELECT * FROM mk_shop_tax_rules WHERE organization_id = ? AND ${siteCond(s)} ORDER BY priority DESC, id`).all(s.organizationId, ...siteArgs(s));
}
function saveTaxRule(s, input) {
  const name = String(input.name || "").trim();
  if (!name || name.length > 60) throw new MarketingError("invalid_field", "Le nom de la taxe est obligatoire.");
  const c = String(input.country || "").trim() === "*" ? "*" : country(input.country);
  const rate = Number(input.rate_bp);
  if (!Number.isInteger(rate) || rate < 0 || rate > 10000) throw new MarketingError("invalid_field", "Le taux est exprimé en points de base (2000 = 20 %), entre 0 et 10000.");
  let classId = null;
  if (input.tax_class_id !== undefined && input.tax_class_id !== null && input.tax_class_id !== "" && Number(input.tax_class_id) !== 0) {
    classId = Number(input.tax_class_id);
    if (!s.db.prepare(`SELECT 1 FROM mk_shop_tax_classes WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(classId, s.organizationId, ...siteArgs(s))) throw new MarketingError("not_found", "Classe de taxe introuvable.");
  }
  return Number(s.db.prepare("INSERT INTO mk_shop_tax_rules (organization_id, site_id, name, country, region, rate_bp, applies_to_shipping, priority, tax_class_id, postcode) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .run(s.organizationId, s.siteId ?? null, name, c, String(input.region || "").trim().slice(0, 60) || null, rate, Number(input.applies_to_shipping) ? 1 : 0, Number(input.priority) || 0, classId, cleanPostcodes(input.postcode) || null).lastInsertRowid);
}
function deleteTaxRule(s, id) {
  const r = s.db.prepare(`DELETE FROM mk_shop_tax_rules WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(id, s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Règle introuvable.");
}

// ── Classes de taxe et d'expédition ─────────────────────────────────────────────────────────
const CLASS_TABLES = { tax: "mk_shop_tax_classes", shipping: "mk_shop_shipping_classes" };
function listClasses(s, kind) {
  return s.db.prepare(`SELECT * FROM ${CLASS_TABLES[kind]} WHERE organization_id = ? AND ${siteCond(s)} ORDER BY name`).all(s.organizationId, ...siteArgs(s));
}
function saveClass(s, kind, name) {
  const n = String(name || "").replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, 60);
  if (!n) throw new MarketingError("invalid_field", "Le nom de la classe est obligatoire (60 caractères au maximum).");
  if (s.db.prepare(`SELECT 1 FROM ${CLASS_TABLES[kind]} WHERE organization_id = ? AND ${siteCond(s)} AND name = ?`).get(s.organizationId, ...siteArgs(s), n)) throw new MarketingError("conflict", "Cette classe existe déjà.");
  return Number(s.db.prepare(`INSERT INTO ${CLASS_TABLES[kind]} (organization_id, site_id, name) VALUES (?,?,?)`).run(s.organizationId, s.siteId ?? null, n).lastInsertRowid);
}
function deleteClass(s, kind, id) {
  const r = s.db.prepare(`DELETE FROM ${CLASS_TABLES[kind]} WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(Number(id), s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Classe introuvable.");
  // Les produits et règles qui y étaient rattachés retombent sur la classe standard (aucune suppression de produit)
  if (kind === "tax") { s.db.prepare("UPDATE mk_shop_products SET tax_class_id = NULL WHERE tax_class_id = ? AND organization_id = ?").run(Number(id), s.organizationId); s.db.prepare("DELETE FROM mk_shop_tax_rules WHERE tax_class_id = ? AND organization_id = ?").run(Number(id), s.organizationId); }
  else s.db.prepare("UPDATE mk_shop_products SET shipping_class_id = NULL WHERE shipping_class_id = ? AND organization_id = ?").run(Number(id), s.organizationId);
}
// Classes d'un produit (NULL = standard / aucune)
function setProductClasses(s, productId, { taxClassId, shippingClassId }) {
  if (!s.db.prepare(`SELECT 1 FROM mk_shop_products WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(productId), s.organizationId, ...siteArgs(s))) throw new MarketingError("not_found", "Produit introuvable.");
  const check = (kind, v) => { if (v === undefined || v === null || v === "" || Number(v) === 0) return null; if (!s.db.prepare(`SELECT 1 FROM ${CLASS_TABLES[kind]} WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(v), s.organizationId, ...siteArgs(s))) throw new MarketingError("not_found", "Classe introuvable."); return Number(v); };
  s.db.prepare("UPDATE mk_shop_products SET tax_class_id = ?, shipping_class_id = ? WHERE id = ?").run(check("tax", taxClassId), check("shipping", shippingClassId), Number(productId));
}
// Supplément d'une méthode de livraison pour une classe (0 ou vide = aucun supplément)
function setClassCost(s, methodId, classId, cents) {
  if (!s.db.prepare(`SELECT 1 FROM mk_shop_shipping_methods WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(methodId), s.organizationId, ...siteArgs(s))) throw new MarketingError("not_found", "Méthode introuvable.");
  if (!s.db.prepare(`SELECT 1 FROM mk_shop_shipping_classes WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(classId), s.organizationId, ...siteArgs(s))) throw new MarketingError("not_found", "Classe introuvable.");
  const c = Number(cents);
  if (cents === "" || cents == null || c === 0) { s.db.prepare("DELETE FROM mk_shop_shipping_class_costs WHERE method_id = ? AND class_id = ?").run(Number(methodId), Number(classId)); return; }
  if (!Number.isInteger(c) || c < 0 || c > 1e9) throw new MarketingError("invalid_field", "Montant invalide.");
  s.db.prepare("INSERT INTO mk_shop_shipping_class_costs (method_id, class_id, cost_cents) VALUES (?,?,?) ON CONFLICT(method_id, class_id) DO UPDATE SET cost_cents = excluded.cost_cents").run(Number(methodId), Number(classId), c);
}

// ── Coupons ─────────────────────────────────────────────────────────────────────────────────
const normCode = (c) => String(c || "").trim().toUpperCase().slice(0, 40);
function listCoupons(s) {
  return s.db.prepare(`SELECT * FROM mk_shop_coupons WHERE organization_id = ? AND ${siteCond(s)} ORDER BY id DESC`).all(s.organizationId, ...siteArgs(s)).map((c) => ({ ...c, product_ids: json(c.product_ids, []), category_ids: json(c.category_ids, []) }));
}
function saveCoupon(s, input) {
  const code = normCode(input.code);
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw new MarketingError("invalid_field", "Le code : 3 à 40 lettres, chiffres, tirets.");
  if (!["percent", "fixed"].includes(input.kind)) throw new MarketingError("invalid_field", "Type de réduction inconnu.");
  const value = Number(input.value);
  if (!Number.isInteger(value) || value < 1 || (input.kind === "percent" && value > 100)) throw new MarketingError("invalid_field", "Valeur invalide (pourcentage entre 1 et 100, ou montant en centimes).");
  const opt = (v, f) => { if (v === undefined || v === null || v === "") return null; const x = Number(v); if (!Number.isInteger(x) || x < 0) throw new MarketingError("invalid_field", `${f} invalide.`); return x; };
  const ids = (v) => [...new Set([].concat(v || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  const pids = ids(input.product_ids); const cids = ids(input.category_ids);
  for (const p of pids) if (!catalog.getProduct(s, p)) throw new MarketingError("not_found", "Produit de restriction introuvable.");
  for (const c of cids) if (!catalog.categoryById(s, c)) throw new MarketingError("not_found", "Catégorie de restriction introuvable.");
  const d = (v) => { if (!v) return null; const t = new Date(String(v).replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(v)) ? "" : "Z")); if (Number.isNaN(t.getTime())) throw new MarketingError("invalid_field", "Date invalide."); return catalog.nowSql(t); };
  if (s.db.prepare(`SELECT 1 FROM mk_shop_coupons WHERE organization_id = ? AND ${siteCond(s)} AND code = ?`).get(s.organizationId, ...siteArgs(s), code)) throw new MarketingError("conflict", "Ce code existe déjà.");
  return Number(s.db.prepare("INSERT INTO mk_shop_coupons (organization_id, site_id, code, kind, value, min_subtotal_cents, starts_at, ends_at, max_uses, per_customer_limit, product_ids, category_ids) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(s.organizationId, s.siteId ?? null, code, input.kind, value, opt(input.min_subtotal_cents, "Le minimum"), d(input.starts_at), d(input.ends_at), opt(input.max_uses, "La limite"), opt(input.per_customer_limit, "La limite par client"), JSON.stringify(pids), JSON.stringify(cids)).lastInsertRowid);
}
function setCouponActive(s, id, active) {
  const r = s.db.prepare(`UPDATE mk_shop_coupons SET active = ? WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(active ? 1 : 0, id, s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Coupon introuvable.");
}
function couponByCode(s, code) {
  const c = s.db.prepare(`SELECT * FROM mk_shop_coupons WHERE organization_id = ? AND ${siteCond(s)} AND code = ?`).get(s.organizationId, ...siteArgs(s), normCode(code));
  return c ? { ...c, product_ids: json(c.product_ids, []), category_ids: json(c.category_ids, []) } : null;
}

module.exports = {
  METHODS, normCode, listClasses, saveClass, deleteClass, setProductClasses, setClassCost, cleanPostcodes, getSettings, saveSettings, listZones, saveZone, deleteZone, saveMethod, deleteMethod,
  listTaxRules, saveTaxRule, deleteTaxRule, listCoupons, saveCoupon, setCouponActive, couponByCode,
};
