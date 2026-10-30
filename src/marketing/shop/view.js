// Programme 20.5 — Aides de présentation et d'accès de la boutique publique (formats, jeton de consultation d'une commande, cookies).
const crypto = require("node:crypto");

function money(cents, currency = "eur") {
  try { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: String(currency).toUpperCase() }).format((Number(cents) || 0) / 100); } catch { return `${((Number(cents) || 0) / 100).toFixed(2)} ${String(currency).toUpperCase()}`; }
}
const secret = () => process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "kolakisa-dev";

// Jeton de consultation d'une commande par son acheteur (invité ou non) : lié à la commande, impossible à deviner, jamais stocké.
function orderToken(order) {
  return crypto.createHmac("sha256", secret()).update(`shop-order:${order.id}:${order.number}:${order.created_at}`).digest("hex").slice(0, 32);
}
function orderTokenOk(order, given) {
  const a = Buffer.from(orderToken(order)); const b = Buffer.from(String(given || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function readCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return "";
}
function setCookie(req, res, name, value, { days = 30 } = {}) {
  res.cookie(name, value, { httpOnly: true, sameSite: "lax", secure: Boolean(req.secure), maxAge: days * 86400000, path: "/" });
}
const clearCookie = (res, name) => res.clearCookie(name, { path: "/" });

// Données d'un produit pour les étiquettes {{product.…}} des modèles de thème (même forme que scope.course pour le reste du moteur)
function productScope(p, { base = "/boutique", currency = "eur" } = {}) {
  return {
    id: p.id, title: p.name, subtitle: p.short_description || "", shortDescription: p.short_description || "", description: String(p.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400),
    priceCents: p.priceFromCents, priceLabel: money(p.priceFromCents, currency), regularCents: p.regularFromCents, regularLabel: p.onSale ? money(p.regularFromCents, currency) : "",
    url: `${base}/produit/${encodeURIComponent(p.slug)}`, image: p.image_url || "", category: p.categories[0] ? p.categories[0].name : "", sku: p.sku || "",
    availability: p.inStock ? "En stock" : "Rupture de stock", cartUrl: `${base}/panier`, instructor: "",
  };
}

module.exports = { money, orderToken, orderTokenOk, readCookie, setCookie, clearCookie, productScope };
