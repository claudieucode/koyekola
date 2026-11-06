// Personnalisation par ligne (gravure, initiales, message) : le vendeur la configure sur le produit ; le texte du client est validé par le serveur,
// gardé sur la ligne de panier puis copié, avec son libellé, sur la ligne de commande (instantané).
const { MarketingError } = require("../errors");
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f<>]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

function get(db, productId) {
  const r = db.prepare("SELECT label, hint, max_length, required FROM mk_shop_product_personalization WHERE product_id = ?").get(Number(productId) || 0);
  return r ? { label: r.label, hint: r.hint || "", maxLength: r.max_length, required: r.required === 1 } : null;
}
function save(db, productId, input) {
  if (!input || input.enabled === false || input.enabled === "0" || input.enabled === 0 || input.enabled === "") {
    db.prepare("DELETE FROM mk_shop_product_personalization WHERE product_id = ?").run(Number(productId));
    return null;
  }
  const label = clean(input.label, 60);
  if (!label) throw new MarketingError("invalid_field", "Indiquez ce que le client peut personnaliser (ex. « Texte à graver »).");
  const max = Number(input.max_length ?? 20);
  if (!Number.isInteger(max) || max < 1 || max > 200) throw new MarketingError("invalid_field", "La longueur maximale doit être un nombre entier entre 1 et 200.");
  db.prepare("INSERT INTO mk_shop_product_personalization (product_id, label, hint, max_length, required) VALUES (?,?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET label=excluded.label, hint=excluded.hint, max_length=excluded.max_length, required=excluded.required")
    .run(Number(productId), label, clean(input.hint, 160) || null, max, input.required && input.required !== "0" ? 1 : 0);
  return get(db, productId);
}
// Texte final d'une ligne : null si le produit ne se personnalise pas ; erreur si obligatoire/trop long.
function validate(db, productId, text) {
  const conf = get(db, productId);
  const value = clean(text, 400);
  if (!conf) {
    if (value) throw new MarketingError("invalid_field", "Ce produit ne se personnalise pas.");
    return { text: null, conf: null };
  }
  if (!value) {
    if (conf.required) throw new MarketingError("invalid_field", `${conf.label} : ce champ est obligatoire pour ce produit.`);
    return { text: null, conf };
  }
  if (value.length > conf.maxLength) throw new MarketingError("invalid_field", `${conf.label} : ${conf.maxLength} caractères au maximum.`);
  return { text: value, conf };
}
module.exports = { get, save, validate };
