// Paniers abandonnés : repérage périodique, événement « shop.cart_abandoned », relance e-mail facultative (clients AVEC compte seulement, option désactivée par défaut), reprise par lien signé.
// Un panier est « abandonné » s'il contient au moins un article et n'a pas bougé depuis `abandoned_minutes`. Le panier n'est jamais supprimé ni fermé : le visiteur le retrouve.
const crypto = require("node:crypto");
const { queueMail } = require("../../utils/outbox");
const events = require("./events");
const secret = () => process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "kolakisa-dev";
const sign = (id) => crypto.createHmac("sha256", secret()).update(`shop-cart-restore:${id}`).digest("hex").slice(0, 32);
const restoreToken = (id) => `${id}-${sign(id)}`;
function parseRestore(t) {
  const m = /^(\d{1,12})-([0-9a-f]{32})$/.exec(String(t || ""));
  if (!m) return null;
  const a = Buffer.from(sign(m[1])), b = Buffer.from(m[2]);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? Number(m[1]) : null;
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Mémorise l'adresse saisie à la caisse (format vérifié ; jamais écrasée par une valeur invalide)
function rememberEmail(s, cartId, email) {
  const e = String(email || "").trim().toLowerCase();
  if (!EMAIL.test(e) || e.length > 200) return;
  s.db.prepare("UPDATE mk_shop_carts SET email = ? WHERE id = ? AND organization_id = ? AND status = 'open'").run(e, cartId, s.organizationId);
}

function originOf(siteId) {
  const info = Number.isInteger(siteId) ? require("../../services/urls").siteInfo(siteId) : null;
  return (info && info.base) || (process.env.SITE_URL ? String(process.env.SITE_URL).replace(/\/+$/, "") : "");
}

// Passage périodique sur toutes les boutiques (au plus toutes les 10 min par processus) ; ne lève jamais.
let last = 0;
function sweep(db, { force = false } = {}) {
  const every = process.env.SHOP_SWEEP_INTERVAL_MS !== undefined && process.env.SHOP_SWEEP_INTERVAL_MS !== "" && Number.isFinite(Number(process.env.SHOP_SWEEP_INTERVAL_MS)) ? Number(process.env.SHOP_SWEEP_INTERVAL_MS) : 600000;
  if (!force && Date.now() - last < every) return 0;
  last = Date.now();
  let marked = 0;
  try {
    const rows = db.prepare(`SELECT c.id, c.organization_id, c.site_id, c.customer_id, c.email, c.updated_at, COALESCE(st.abandoned_minutes, 60) AS minutes, COALESCE(st.abandoned_reminder, 0) AS reminder,
        (SELECT COUNT(*) FROM mk_shop_cart_items i WHERE i.cart_id = c.id) AS items, (SELECT GROUP_CONCAT(p.name, ', ') FROM mk_shop_cart_items i JOIN mk_shop_products p ON p.id = i.product_id WHERE i.cart_id = c.id) AS names
      FROM mk_shop_carts c LEFT JOIN mk_shop_settings st ON st.organization_id = c.organization_id AND COALESCE(st.site_id, 0) = COALESCE(c.site_id, 0)
      WHERE c.status = 'open' AND c.abandoned_at IS NULL AND c.updated_at < datetime('now', '-' || COALESCE(st.abandoned_minutes, 60) || ' minutes') AND c.updated_at > datetime('now', '-30 days') LIMIT 500`).all();
    for (const c of rows) {
      if (!c.items) continue;
      const email = c.email || (c.customer_id ? (db.prepare("SELECT email FROM mk_shop_customers WHERE id = ?").get(c.customer_id) || {}).email : null) || null;
      db.prepare("UPDATE mk_shop_carts SET abandoned_at = datetime('now'), email = COALESCE(email, ?) WHERE id = ?").run(email, c.id);
      marked += 1;
      const s = { db, organizationId: c.organization_id, siteId: c.site_id ?? null };
      events.cartAbandoned(s, c.id, email, { items: c.items, names: String(c.names || "").slice(0, 300) });
      // Relance : seulement si la boutique l'a activée ET si le client a un compte (pas d'envoi à une adresse saisie par un invité)
      if (c.reminder && c.customer_id && email && !c.reminder_sent_at) {
        const acct = db.prepare("SELECT 1 FROM mk_shop_customers WHERE id = ? AND password_hash IS NOT NULL AND status = 'active'").get(c.customer_id);
        const origin = originOf(c.site_id);
        if (acct && origin) {
          const r = queueMail(db, { kind: "shop_cart", to: email, subject: "Vous avez laissé des articles dans votre panier", text: `Bonjour,\n\nVotre panier vous attend : ${String(c.names || "").slice(0, 200)}.\n\nRetrouvez-le ici : ${origin}/boutique/panier/reprendre/${restoreToken(c.id)}\n\nSi vous ne souhaitez plus recevoir ce rappel, ignorez simplement ce message ou désactivez-le en nous le demandant.` });
          if (r && r.queued) db.prepare("UPDATE mk_shop_carts SET reminder_sent_at = datetime('now') WHERE id = ?").run(c.id);
        }
      }
    }
  } catch (error) { console.error(`[KOLAKISA] Boutique : paniers abandonnés : ${error.message}`); }
  return marked;
}

// Un panier modifié de nouveau n'est plus « abandonné » (appelé quand le panier change)
const clearMark = (s, cartId) => s.db.prepare("UPDATE mk_shop_carts SET abandoned_at = NULL, reminder_sent_at = NULL WHERE id = ? AND abandoned_at IS NOT NULL").run(cartId);

function list(s, limit = 50) {
  const w = s.siteId == null ? "c.site_id IS NULL" : "c.site_id = ?";
  const rows = s.db.prepare(`SELECT c.id, c.email, c.abandoned_at, c.updated_at, c.reminder_sent_at, (SELECT SUM(i.quantity) FROM mk_shop_cart_items i WHERE i.cart_id = c.id) AS quantity,
      (SELECT GROUP_CONCAT(p.name, ', ') FROM mk_shop_cart_items i JOIN mk_shop_products p ON p.id = i.product_id WHERE i.cart_id = c.id) AS names
    FROM mk_shop_carts c WHERE c.organization_id = ? AND ${w} AND c.status = 'open' AND c.abandoned_at IS NOT NULL ORDER BY c.abandoned_at DESC LIMIT ?`).all(s.organizationId, ...(s.siteId == null ? [] : [s.siteId]), limit);
  const converted = s.db.prepare(`SELECT COUNT(*) n FROM mk_shop_carts c WHERE c.organization_id = ? AND ${w} AND c.status = 'converted'`).get(s.organizationId, ...(s.siteId == null ? [] : [s.siteId])).n;
  const total = s.db.prepare(`SELECT COUNT(*) n FROM mk_shop_carts c WHERE c.organization_id = ? AND ${w} AND c.abandoned_at IS NOT NULL AND c.status = 'open'`).get(s.organizationId, ...(s.siteId == null ? [] : [s.siteId])).n;
  return { items: rows, abandoned: total, converted };
}
module.exports = { sweep, rememberEmail, clearMark, list, restoreToken, parseRestore };
