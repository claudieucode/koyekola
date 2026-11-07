// Comparateur : jusqu'à 4 produits d'une même boutique. La liste est un simple cookie d'identifiants ; chaque lecture la revalide
// (produit publié, de CETTE boutique), donc un identifiant d'une autre boutique ou d'un produit retiré est ignoré.
// Les caractéristiques (libellé / valeur) sont un réglage du produit, éditable dans l'admin.
const { MarketingError } = require("../errors");
const catalog = require("./catalog");
const { transaction } = require("../db/tx");

const MAX_PRODUCTS = 4;
const MAX_SPECS = 20;
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f<>]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

// ── Caractéristiques d'un produit ──
function getSpecs(db, productId) {
  return db.prepare("SELECT label, value FROM mk_shop_product_specs WHERE product_id = ? ORDER BY position, id").all(Number(productId) || 0);
}
// Saisie : une caractéristique par ligne, « Libellé: valeur » (ou tableau de { label, value }). Remplace la liste entière.
function parseSpecs(input) {
  let pairs;
  if (Array.isArray(input)) pairs = input.map((x) => ({ label: x && x.label, value: x && x.value }));
  else {
    pairs = [];
    for (const raw of String(input == null ? "" : input).split(/\r?\n/)) {
      if (!raw.trim()) continue;
      const i = raw.indexOf(":");
      if (i < 1) throw new MarketingError("invalid_field", `Ligne « ${clean(raw, 40)} » : écrivez « Libellé: valeur » (par exemple « Poids: 250 g »).`);
      pairs.push({ label: raw.slice(0, i), value: raw.slice(i + 1) });
    }
  }
  const out = []; const seen = new Set();
  for (const p of pairs) {
    const label = clean(p.label, 60); const value = clean(p.value, 200);
    if (!label || !value) throw new MarketingError("invalid_field", "Chaque caractéristique a besoin d'un libellé et d'une valeur.");
    if (seen.has(label.toLowerCase())) throw new MarketingError("invalid_field", `La caractéristique « ${label} » est écrite deux fois.`);
    seen.add(label.toLowerCase());
    out.push({ label, value });
  }
  if (out.length > MAX_SPECS) throw new MarketingError("invalid_field", `${MAX_SPECS} caractéristiques au maximum par produit.`);
  return out;
}
function saveSpecs(db, productId, input) {
  const specs = parseSpecs(input);
  const id = Number(productId);
  transaction(db, () => {
    db.prepare("DELETE FROM mk_shop_product_specs WHERE product_id = ?").run(id);
    const ins = db.prepare("INSERT INTO mk_shop_product_specs (product_id, position, label, value) VALUES (?,?,?,?)");
    specs.forEach((x, i) => ins.run(id, i, x.label, x.value));
  });
  return specs;
}
const specsToText = (specs) => (specs || []).map((x) => `${x.label}: ${x.value}`).join("\n");

// ── Liste de comparaison (cookie « 12.15.20 ») ──
function parseCookie(raw) {
  const ids = [];
  for (const part of String(raw || "").split(".")) {
    const n = Number(part);
    if (/^\d{1,9}$/.test(part) && n > 0 && !ids.includes(n)) ids.push(n);
    if (ids.length >= MAX_PRODUCTS) break;
  }
  return ids;
}
const toCookie = (ids) => ids.join(".");
function isPublishedHere(s, id) {
  const p = catalog.productById(s, id);
  return p && p.status === "published" && !p.deleted_at ? p : null;
}
// Produits encore comparables, dans l'ordre d'ajout
function products(s, ids) {
  return ids.map((id) => isPublishedHere(s, id)).filter(Boolean);
}
function add(s, ids, productId) {
  const p = isPublishedHere(s, Number(productId) || 0);
  if (!p) throw new MarketingError("not_found", "Ce produit n'est plus disponible.");
  const valid = products(s, ids).map((x) => x.id);
  if (valid.includes(p.id)) return valid;
  if (valid.length >= MAX_PRODUCTS) throw new MarketingError("invalid_field", `Vous pouvez comparer ${MAX_PRODUCTS} produits au maximum. Retirez-en un pour en ajouter un autre.`);
  return [...valid, p.id];
}
const remove = (ids, productId) => ids.filter((id) => id !== Number(productId));

// ── Tableau comparatif ──
function table(s, ids, { money }) {
  const list = products(s, ids);
  const specsOf = list.map((p) => getSpecs(s.db, p.id));
  const fmt = money || ((c) => String(c / 100));
  const price = (p) => `${p.isVariable ? "À partir de " : ""}${fmt(p.priceFromCents)}`;
  const rows = [
    { key: "price", label: "Prix", cells: list.map((p) => ({ text: price(p), old: p.onSale ? fmt(p.regularFromCents) : "", sig: String(p.priceFromCents) })) },
    { key: "stock", label: "Disponibilité", cells: list.map((p) => ({ text: p.inStock ? "En stock" : "Rupture de stock" })) },
    { key: "category", label: "Catégorie", cells: list.map((p) => ({ text: p.categories.map((c) => c.name).join(", ") })) },
    { key: "tags", label: "Étiquettes", cells: list.map((p) => ({ text: p.tags.join(", ") })) },
    { key: "options", label: "Variantes", cells: list.map((p) => ({ text: p.attributes.map((a) => `${a.name} : ${a.values.join(", ")}`).join(" ; ") })) },
    { key: "summary", label: "Description courte", cells: list.map((p) => ({ text: p.short_description || "" })) },
  ];
  const labels = [];
  specsOf.forEach((sp) => sp.forEach((x) => { if (!labels.some((l) => l.toLowerCase() === x.label.toLowerCase())) labels.push(x.label); }));
  for (const label of labels) {
    rows.push({ key: "spec", label, spec: true, cells: specsOf.map((sp) => { const f = sp.find((x) => x.label.toLowerCase() === label.toLowerCase()); return { text: f ? f.value : "" }; }) });
  }
  // Une ligne « diffère » si deux produits ont des valeurs différentes (une valeur absente compte comme différente d'une valeur renseignée)
  const shown = rows.filter((r) => r.cells.some((c) => c.text));
  for (const r of shown) {
    const sigs = r.cells.map((c) => String(c.sig != null ? c.sig : c.text).trim().toLowerCase());
    r.differs = list.length > 1 && new Set(sigs).size > 1;
  }
  return { products: list, rows: shown, max: MAX_PRODUCTS };
}
module.exports = { MAX_PRODUCTS, MAX_SPECS, getSpecs, saveSpecs, parseSpecs, specsToText, parseCookie, toCookie, products, add, remove, table };
