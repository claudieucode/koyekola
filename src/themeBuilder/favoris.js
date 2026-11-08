// Favoris de la bibliothèque de modèles (aujourd'hui : Pied de page). Un favori appartient à UN utilisateur ET à UN site (site_id vide = site principal) :
// il n'est jamais visible depuis un autre site ni par un autre utilisateur. La clé stockée est toujours l'identifiant ACTUEL du modèle (un ancien identifiant est suivi par les alias).
// Les favoris ne modifient ni le catalogue ni les modèles du site.
const { MarketingError } = require("../marketing/errors");
const store = require("./store");
const Catalog = require("./catalog");

const TYPES = ["footer"]; // types dont l'interface propose les favoris ; les autres types de la bibliothèque ne changent pas
const bad = (m, code = "invalid_field") => new MarketingError(code, m);
const who = (ctx) => { if (!Number.isInteger(ctx.userId) || ctx.userId < 1) throw bad("Les favoris demandent un utilisateur connecté.", "forbidden"); return ctx.userId; };
const typeOk = (type) => { if (!TYPES.includes(String(type))) throw bad("Les favoris ne sont pas disponibles pour ce type de modèle."); return String(type); };
const keyOk = (k) => { const s = String(k || ""); if (!/^[a-z0-9.-]{3,80}$/.test(s)) throw bad("Modèle du catalogue introuvable.", "not_found"); return s; };
const siteCond = (siteId) => (siteId === null ? "site_id IS NULL" : "site_id = ?");
const args = (ctx, siteId, type) => [ctx.organizationId, ...(siteId === null ? [] : [siteId]), who(ctx), type];

// Clés actuelles des favoris de l'utilisateur sur CE site (anciennes clés ramenées à leur remplaçant ; un modèle qui n'est plus listé n'apparaît pas)
function keys(ctx, siteId, type) {
  type = typeOk(type); store.site(ctx, siteId);
  const rows = ctx.db.prepare(`SELECT modele_id FROM mk_tb_favoris WHERE organization_id = ? AND ${siteCond(siteId)} AND user_id = ? AND type = ? ORDER BY id`).all(...args(ctx, siteId, type));
  const listed = new Set(Catalog.entries(type).map((e) => e.key)), out = new Set();
  for (const r of rows) { const m = Catalog.find(type, r.modele_id); if (m && listed.has(m.key)) out.add(m.key); }
  return out;
}
// Ajoute un favori (idempotent). Un identifiant inconnu, ou qui n'est plus listé dans la bibliothèque, est refusé.
function add(ctx, siteId, type, key) {
  type = typeOk(type); store.site(ctx, siteId); keyOk(key);
  const m = Catalog.find(type, String(key)), listed = m && Catalog.entries(type).some((e) => e.key === m.key);
  if (!listed) throw bad("Modèle du catalogue introuvable.", "not_found");
  ctx.db.prepare("INSERT OR IGNORE INTO mk_tb_favoris (organization_id, site_id, user_id, type, modele_id) VALUES (?, ?, ?, ?, ?)").run(ctx.organizationId, siteId, who(ctx), type, m.key);
  return { key: m.key, favorite: true };
}
// Retire un favori (idempotent). La clé reçue et son remplaçant éventuel sont retirés ; une clé jamais mise en favori ne renvoie pas d'erreur.
function remove(ctx, siteId, type, key) {
  type = typeOk(type); store.site(ctx, siteId); keyOk(key);
  const m = Catalog.find(type, String(key)), ids = [...new Set([String(key), ...(m ? [m.key] : [])])];
  const n = ctx.db.prepare(`DELETE FROM mk_tb_favoris WHERE organization_id = ? AND ${siteCond(siteId)} AND user_id = ? AND type = ? AND modele_id IN (${ids.map(() => "?").join(",")})`).run(...args(ctx, siteId, type), ...ids).changes;
  return { key: m ? m.key : String(key), favorite: false, removed: Number(n) };
}
module.exports = { TYPES, keys, add, remove };
