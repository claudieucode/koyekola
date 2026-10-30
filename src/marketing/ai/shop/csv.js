// Import CSV → BROUILLONS de produits (le moteur n'a pas d'import natif : ce module lit, valide et prévisualise ; les produits sont ensuite créés un à un par le service natif).
// Séparateur détecté (virgule, point-virgule, tabulation) ; guillemets gérés ; 500 lignes au plus ; aucune ligne n'est créée ici.
const { MarketingError } = require("../../errors");
const products = require("./products");
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const ALIAS = { name: ["nom", "name", "titre", "produit", "libelle", "designation"], sku: ["sku", "reference", "ref", "code"], price: ["prix", "price", "prix_ttc", "prix_ht"], stock: ["stock", "quantite", "qty", "quantity"], category: ["categorie", "category", "rayon"], facts: ["caracteristiques", "caracteristique", "features", "faits", "details"], image: ["image", "image_url", "photo", "visuel"], type: ["type"], attributes: ["attributs", "attributes", "options"], style: ["style"] };
const MAX_ROWS = 500, MAX_BYTES = 1_000_000;
function splitRows(text) {
  const rows = []; let row = [], cell = "", q = false;
  const sep = (() => { const first = text.split(/\r?\n/, 1)[0]; const c = { ",": 0, ";": 0, "\t": 0 }; for (const ch of first) if (ch in c) c[ch] += 1; return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]; })();
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true; else if (ch === sep) { row.push(cell); cell = ""; } else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim()));
}
// → { rows: [{ line, draft | null, errors: [] }], ignoredColumns: [], total }
function parse(text, { currency = "EUR", categories = [] } = {}) {
  const t = String(text ?? "").replace(/^﻿/, "");
  if (!t.trim()) throw new MarketingError("invalid_field", "Fichier CSV vide.");
  if (Buffer.byteLength(t) > MAX_BYTES) throw new MarketingError("limit", "Fichier trop volumineux (1 Mo au plus).");
  const all = splitRows(t);
  if (all.length < 2) throw new MarketingError("invalid_field", "Le fichier doit contenir une ligne d'en-têtes et au moins une ligne de produit.");
  if (all.length - 1 > MAX_ROWS) throw new MarketingError("limit", `${all.length - 1} lignes : ${MAX_ROWS} au plus par import.`);
  const head = all[0].map(norm);
  const col = {}; const ignored = [];
  head.forEach((h, i) => { const k = Object.entries(ALIAS).find(([, a]) => a.includes(h)); if (k && col[k[0]] === undefined) col[k[0]] = i; else ignored.push(all[0][i]); });
  if (col.name === undefined) throw new MarketingError("invalid_field", "Colonne « nom » introuvable (colonnes reconnues : nom, sku, prix, stock, categorie, caracteristiques, image, type, attributs).");
  const rows = all.slice(1).map((r, i) => {
    const get = (k) => (col[k] === undefined ? undefined : r[col[k]]);
    const errors = []; let draft = null;
    try {
      draft = products.normalizeDraft({ name: get("name"), sku: get("sku"), price: get("price"), stock: get("stock"), category: get("category"), facts: get("facts"), image: get("image"), type: norm(get("type") || "") === "variable" ? "variable" : norm(get("type") || "") === "numerique" || norm(get("type") || "") === "digital" ? "digital" : "simple",
        attributes: String(get("attributes") || "").split(";").map((x) => { const [n, v] = x.split(":"); return { name: n, values: v }; }).filter((a) => a.name && a.values), style: get("style"), source: "csv" }, { currency, categories });
      if (get("category") && !draft.categoryKey) errors.push(`Catégorie « ${String(get("category")).slice(0, 40)} » absente de la structure : non rattachée.`);
    } catch (e) { errors.push(e.message); }
    return { line: i + 2, draft, errors };
  });
  return { rows, ignoredColumns: ignored, total: rows.length };
}
module.exports = { parse, MAX_ROWS, splitRows };
