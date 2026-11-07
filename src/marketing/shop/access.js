// Accès membre et ventes privées d'UNE boutique.
// - « Membre » = client inscrit de cette boutique, approuvé par le vendeur ou entré avec un code d'invitation valide.
// - Règle « réservé aux membres » sur un produit ou une catégorie (sous-catégories comprises) : masqué ou verrouillé (cadenas) pour les non-membres.
// - Vente privée = fenêtre réelle (début, fin, en UTC) rattachée à des produits/catégories : hors fenêtre, ces produits ne s'achètent pas.
// Toutes les dates viennent de la base ; le serveur refuse l'ajout au panier et la commande hors fenêtre. Le visiteur est lu dans s.viewerCustomerId (posé par la boutique publique).
const crypto = require("node:crypto");
const { MarketingError } = require("../errors");
const { transaction } = require("../db/tx");

const siteCond = (s, a = "") => (s.siteId == null ? `${a}site_id IS NULL` : `${a}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const nowSql = (d = new Date()) => d.toISOString().slice(0, 19).replace("T", " ");
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I/L : lisible au téléphone

// Date saisie (« 2026-12-01T09:00 » ou « 2026-12-01 09:00[:00] »), lue comme UTC → « AAAA-MM-JJ HH:MM:SS ».
function parseWhen(value, label) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(value || "").trim());
  const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)));
  if (!d || Number.isNaN(d.getTime()) || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3] || +m[4] > 23 || +m[5] > 59) throw new MarketingError("invalid_field", `${label} : date invalide (format AAAA-MM-JJ HH:MM).`);
  return nowSql(d);
}
// Affichage lisible d'une date de la base : « 07/11/2026 14:30 UTC ».
function fmt(sql) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(String(sql || ""));
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]} UTC` : "";
}
const inputValue = (sql) => String(sql || "").slice(0, 16).replace(" ", "T");

// ── Membres ──
function memberRow(s, customerId) {
  if (!Number.isInteger(customerId)) return null;
  return s.db.prepare(`SELECT * FROM mk_shop_members WHERE customer_id = ? AND organization_id = ? AND ${siteCond(s)}`).get(customerId, s.organizationId, ...siteArgs(s)) || null;
}
function isMember(s, customerId) {
  const m = memberRow(s, customerId);
  if (!m || m.status !== "approved") return false;
  const c = s.db.prepare(`SELECT status FROM mk_shop_customers WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(customerId, s.organizationId, ...siteArgs(s));
  return Boolean(c && c.status === "active");
}
const viewerIsMember = (s) => isMember(s, s.viewerCustomerId);

function setMember(s, customerId, status, source = "admin", invitationId = null) {
  if (!["pending", "approved", "revoked"].includes(status)) throw new MarketingError("invalid_field", "État inconnu.");
  const c = s.db.prepare(`SELECT id, password_hash FROM mk_shop_customers WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(customerId) || 0, s.organizationId, ...siteArgs(s));
  if (!c) throw new MarketingError("not_found", "Client introuvable dans cette boutique.");
  if (!c.password_hash) throw new MarketingError("invalid_field", "Ce client n'a pas de compte (commande en invité) : il doit d'abord créer son compte.");
  s.db.prepare(`INSERT INTO mk_shop_members (customer_id, organization_id, site_id, status, source, invitation_id) VALUES (?,?,?,?,?,?)
    ON CONFLICT(customer_id) DO UPDATE SET status = excluded.status, source = excluded.source, invitation_id = COALESCE(excluded.invitation_id, invitation_id), updated_at = datetime('now')`)
    .run(c.id, s.organizationId, s.siteId ?? null, status, source, invitationId);
}
function addByEmail(s, email) {
  const c = s.db.prepare(`SELECT id FROM mk_shop_customers WHERE email = ? AND organization_id = ? AND ${siteCond(s)}`).get(String(email || "").trim().toLowerCase(), s.organizationId, ...siteArgs(s));
  if (!c) throw new MarketingError("not_found", "Aucun client inscrit avec cette adresse dans cette boutique.");
  setMember(s, c.id, "approved", "admin");
}
// Demande d'accès faite par un client connecté. Un accès retiré par le vendeur ne se redemande pas.
function requestAccess(s, customerId) {
  const cur = memberRow(s, customerId);
  if (cur && cur.status === "approved") return cur.status;
  if (cur && cur.status === "revoked") throw new MarketingError("forbidden", "Le vendeur a retiré votre accès. Contactez la boutique.");
  setMember(s, customerId, "pending", "request");
  return "pending";
}
function listMembers(s, { status } = {}) {
  const where = ["m.organization_id = ?", siteCond(s, "m.")]; const args = [s.organizationId, ...siteArgs(s)];
  if (["pending", "approved", "revoked"].includes(status)) { where.push("m.status = ?"); args.push(status); }
  return s.db.prepare(`SELECT m.customer_id, m.status, m.source, m.created_at, m.updated_at, c.email, c.name FROM mk_shop_members m JOIN mk_shop_customers c ON c.id = m.customer_id
    WHERE ${where.join(" AND ")} ORDER BY CASE m.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, m.updated_at DESC LIMIT 200`).all(...args);
}

// ── Codes d'invitation ──
const normCode = (c) => String(c || "").toUpperCase().replace(/[\s]+/g, "").slice(0, 40);
function generateCode() {
  const pick = () => Array.from(crypto.randomBytes(5), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${pick()}-${pick()}`;
}
function createInvitation(s, { code, note, maxUses, expiresAt }, userId = null) {
  const max = Number(maxUses ?? 1);
  if (!Number.isInteger(max) || max < 1 || max > 100000) throw new MarketingError("invalid_field", "Le nombre d'utilisations doit être un entier entre 1 et 100000.");
  const exp = expiresAt ? parseWhen(expiresAt, "Expiration") : null;
  if (exp && exp <= nowSql()) throw new MarketingError("invalid_field", "L'expiration doit être dans le futur.");
  let value = normCode(code);
  if (value && !/^[A-Z0-9-]{4,32}$/.test(value)) throw new MarketingError("invalid_field", "Le code doit faire 4 à 32 caractères (lettres, chiffres, tiret).");
  for (let i = 0; i < 5; i++) {
    const c = value || generateCode();
    try {
      const id = Number(s.db.prepare("INSERT INTO mk_shop_invitations (organization_id, site_id, code, note, max_uses, expires_at, created_by) VALUES (?,?,?,?,?,?,?)")
        .run(s.organizationId, s.siteId ?? null, c, note ? String(note).replace(/[<>\u0000-\u001f]+/g, " ").trim().slice(0, 120) || null : null, max, exp, userId).lastInsertRowid);
      return { id, code: c };
    } catch (e) {
      if (!/UNIQUE/i.test(String(e.message))) throw e;
      if (value) throw new MarketingError("conflict", "Ce code existe déjà.");
    }
  }
  throw new MarketingError("conflict", "Impossible de générer un code unique, réessayez.");
}
function listInvitations(s) {
  const t = nowSql();
  return s.db.prepare(`SELECT *, CASE WHEN active = 0 THEN 'disabled' WHEN expires_at IS NOT NULL AND expires_at <= ? THEN 'expired' WHEN used_count >= max_uses THEN 'used_up' ELSE 'valid' END AS state
    FROM mk_shop_invitations WHERE organization_id = ? AND ${siteCond(s)} ORDER BY id DESC LIMIT 200`).all(t, s.organizationId, ...siteArgs(s));
}
function setInvitationActive(s, id, active) {
  const r = s.db.prepare(`UPDATE mk_shop_invitations SET active = ? WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(active ? 1 : 0, Number(id) || 0, s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Code introuvable.");
}
// Utilise un code : le client doit être connecté. Une seule transaction vérifie état, expiration et plafond puis consomme l'usage.
function redeem(s, customerId, code) {
  if (!Number.isInteger(customerId)) throw new MarketingError("auth", "Connectez-vous à votre compte pour utiliser un code d'invitation.");
  const value = normCode(code);
  if (!value) throw new MarketingError("invalid_field", "Saisissez votre code d'invitation.");
  return transaction(s.db, () => {
    const cur = memberRow(s, customerId);
    if (cur && cur.status === "revoked") throw new MarketingError("forbidden", "Le vendeur a retiré votre accès. Contactez la boutique.");
    const inv = s.db.prepare(`SELECT * FROM mk_shop_invitations WHERE code = ? AND organization_id = ? AND ${siteCond(s)}`).get(value, s.organizationId, ...siteArgs(s));
    // Même message pour « inconnu » et « désactivé » : on ne révèle pas quels codes existent.
    if (!inv || !inv.active) throw new MarketingError("invalid_field", "Ce code d'invitation n'est pas valable.");
    if (inv.expires_at && inv.expires_at <= nowSql()) throw new MarketingError("invalid_field", "Ce code d'invitation a expiré.");
    if (cur && cur.status === "approved") return { already: true };
    if (inv.used_count >= inv.max_uses) throw new MarketingError("invalid_field", "Ce code d'invitation a déjà été utilisé le nombre de fois autorisé.");
    const upd = s.db.prepare("UPDATE mk_shop_invitations SET used_count = used_count + 1 WHERE id = ? AND used_count < max_uses").run(inv.id);
    if (!upd.changes) throw new MarketingError("invalid_field", "Ce code d'invitation a déjà été utilisé le nombre de fois autorisé.");
    setMember(s, customerId, "approved", "invitation", inv.id);
    return { already: false };
  });
}

// ── Règles « réservé aux membres » ──
function ownedProduct(s, id) { return s.db.prepare(`SELECT id, name FROM mk_shop_products WHERE id = ? AND organization_id = ? AND ${siteCond(s)} AND deleted_at IS NULL`).get(Number(id) || 0, s.organizationId, ...siteArgs(s)); }
function ownedCategory(s, id) { return s.db.prepare(`SELECT id, name FROM mk_shop_categories WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(id) || 0, s.organizationId, ...siteArgs(s)); }
function checkTarget(s, kind, id) {
  if (kind === "product") { const p = ownedProduct(s, id); if (!p) throw new MarketingError("not_found", "Produit introuvable."); return p; }
  if (kind === "category") { const c = ownedCategory(s, id); if (!c) throw new MarketingError("not_found", "Catégorie introuvable."); return c; }
  throw new MarketingError("invalid_field", "Type de cible inconnu.");
}
function saveRule(s, { kind, targetId, mode }) {
  checkTarget(s, kind, targetId);
  if (!["hide", "lock"].includes(mode)) throw new MarketingError("invalid_field", "Choisissez « masqué » ou « verrouillé ».");
  s.db.prepare(`INSERT INTO mk_shop_access_rules (organization_id, site_id, kind, target_id, mode) VALUES (?,?,?,?,?) ON CONFLICT(kind, target_id) DO UPDATE SET mode = excluded.mode`).run(s.organizationId, s.siteId ?? null, kind, Number(targetId), mode);
}
function deleteRule(s, id) {
  const r = s.db.prepare(`DELETE FROM mk_shop_access_rules WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(Number(id) || 0, s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Règle introuvable.");
}
function listRules(s) {
  return s.db.prepare(`SELECT r.*, CASE r.kind WHEN 'product' THEN (SELECT name FROM mk_shop_products WHERE id = r.target_id) ELSE (SELECT name FROM mk_shop_categories WHERE id = r.target_id) END AS target_name
    FROM mk_shop_access_rules r WHERE r.organization_id = ? AND ${siteCond(s, "r.")} ORDER BY r.id DESC`).all(s.organizationId, ...siteArgs(s));
}

// Catégories d'un produit + leurs parents (une règle sur « Collection privée » vaut pour ses sous-catégories).
function categoryChain(s, productId) {
  const all = s.db.prepare(`SELECT id, parent_id FROM mk_shop_categories WHERE organization_id = ? AND ${siteCond(s)}`).all(s.organizationId, ...siteArgs(s));
  const parent = new Map(all.map((c) => [c.id, c.parent_id]));
  const out = new Set();
  for (const r of s.db.prepare("SELECT category_id FROM mk_shop_product_categories WHERE product_id = ?").all(productId)) {
    let id = r.category_id; let guard = 0;
    while (id && !out.has(id) && guard++ < 20) { out.add(id); id = parent.get(id); }
  }
  return [...out];
}
function descendants(s, ids) {
  const all = s.db.prepare(`SELECT id, parent_id FROM mk_shop_categories WHERE organization_id = ? AND ${siteCond(s)}`).all(s.organizationId, ...siteArgs(s));
  const out = new Set(ids);
  let grew = true;
  while (grew) { grew = false; for (const c of all) if (c.parent_id && out.has(c.parent_id) && !out.has(c.id)) { out.add(c.id); grew = true; } }
  return [...out];
}
const marks = (a) => a.map(() => "?").join(",");

// Règle applicable à un produit : { restricted, mode }. Si deux règles se contredisent, « masqué » l'emporte.
function ruleOf(s, productId) {
  const chain = categoryChain(s, productId);
  const rows = s.db.prepare(`SELECT mode FROM mk_shop_access_rules WHERE organization_id = ? AND ${siteCond(s)} AND ((kind = 'product' AND target_id = ?)${chain.length ? ` OR (kind = 'category' AND target_id IN (${marks(chain)}))` : ""})`)
    .all(s.organizationId, ...siteArgs(s), productId, ...chain);
  if (!rows.length) return { restricted: false, mode: null };
  return { restricted: true, mode: rows.some((r) => r.mode === "hide") ? "hide" : "lock" };
}

// Ventes liées à un produit (directement ou par catégorie) → état à l'instant `t`.
function saleOf(s, productId, t = nowSql()) {
  const chain = categoryChain(s, productId);
  const sales = s.db.prepare(`SELECT DISTINCT sa.* FROM mk_shop_sales sa JOIN mk_shop_sale_targets st ON st.sale_id = sa.id
    WHERE sa.organization_id = ? AND ${siteCond(s, "sa.")} AND ((st.kind = 'product' AND st.target_id = ?)${chain.length ? ` OR (st.kind = 'category' AND st.target_id IN (${marks(chain)}))` : ""})`)
    .all(s.organizationId, ...siteArgs(s), productId, ...chain);
  if (!sales.length) return null;
  const open = sales.filter((x) => x.starts_at <= t && x.ends_at > t).sort((a, b) => (a.ends_at < b.ends_at ? -1 : 1));
  if (open.length) return { state: "open", sale: open[0] };
  const next = sales.filter((x) => x.starts_at > t).sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1));
  if (next.length) return { state: "upcoming", sale: next[0] };
  return { state: "ended", sale: sales.sort((a, b) => (a.ends_at > b.ends_at ? -1 : 1))[0] };
}

// Décision pour un produit et le visiteur courant. → { visible, purchasable, reason, message, sale, locked }
function gate(s, productId, { now = new Date(), customerId } = {}) {
  const t = nowSql(now);
  const viewer = customerId !== undefined ? customerId : s.viewerCustomerId;
  const rule = ruleOf(s, productId);
  if (rule.restricted && !isMember(s, viewer)) {
    const hidden = rule.mode === "hide";
    return { visible: !hidden, purchasable: false, locked: !hidden, reason: "members", sale: null,
      message: "Ce produit est réservé aux membres. Utilisez votre code d'invitation ou demandez l'accès." };
  }
  const sale = saleOf(s, productId, t);
  if (sale && sale.state !== "open") {
    const x = sale.sale;
    const message = sale.state === "upcoming" ? `Vente privée « ${x.name} » : ouverture le ${fmt(x.starts_at)} (fermeture le ${fmt(x.ends_at)}).` : `La vente privée « ${x.name} » est terminée depuis le ${fmt(x.ends_at)}.`;
    return { visible: true, purchasable: false, locked: false, reason: sale.state === "upcoming" ? "sale_before" : "sale_ended", sale: { name: x.name, startsAt: x.starts_at, endsAt: x.ends_at, startsLabel: fmt(x.starts_at), endsLabel: fmt(x.ends_at) }, message };
  }
  return { visible: true, purchasable: true, locked: false, reason: null, message: null,
    sale: sale ? { name: sale.sale.name, startsAt: sale.sale.starts_at, endsAt: sale.sale.ends_at, startsLabel: fmt(sale.sale.starts_at), endsLabel: fmt(sale.sale.ends_at), open: true } : null };
}
function assertPurchasable(s, productId, opts) {
  const g = gate(s, productId, opts);
  if (!g.purchasable) throw new MarketingError(g.reason === "members" ? "forbidden" : "sale_closed", g.message);
  return g;
}
// Pour l'affichage d'une liste : { [productId]: gate } seulement quand quelque chose s'applique.
function gates(s, productIds, opts) {
  const out = {};
  for (const id of productIds) { const g = gate(s, id, opts); if (!g.purchasable || g.sale) out[id] = g; }
  return out;
}
// Identifiants des produits À MASQUER pour le visiteur courant (règle « masqué » et visiteur non-membre). Vide pour un membre.
function hiddenIds(s) {
  if (s.noAccessFilter) return [];
  const rules = s.db.prepare(`SELECT kind, target_id FROM mk_shop_access_rules WHERE organization_id = ? AND ${siteCond(s)} AND mode = 'hide'`).all(s.organizationId, ...siteArgs(s));
  if (!rules.length || viewerIsMember(s)) return [];
  const ids = new Set(rules.filter((r) => r.kind === "product").map((r) => r.target_id));
  const cats = descendants(s, rules.filter((r) => r.kind === "category").map((r) => r.target_id));
  if (cats.length) for (const r of s.db.prepare(`SELECT DISTINCT product_id FROM mk_shop_product_categories WHERE category_id IN (${marks(cats)})`).all(...cats)) ids.add(r.product_id);
  return [...ids];
}
const isHidden = (s, productId) => hiddenIds(s).includes(productId);

// ── Ventes privées (admin) ──
function saleInput(s, input) {
  const name = String(input.name || "").replace(/[<>\u0000-\u001f]+/g, " ").trim().slice(0, 80);
  if (!name) throw new MarketingError("invalid_field", "Donnez un nom à la vente.");
  const starts = parseWhen(input.starts_at, "Début"); const ends = parseWhen(input.ends_at, "Fin");
  if (ends <= starts) throw new MarketingError("invalid_field", "La fin doit être après le début.");
  const targets = [];
  for (const id of [].concat(input.product_ids || [])) { if (id === "" || id == null) continue; checkTarget(s, "product", id); targets.push(["product", Number(id)]); }
  for (const id of [].concat(input.category_ids || [])) { if (id === "" || id == null) continue; checkTarget(s, "category", id); targets.push(["category", Number(id)]); }
  if (!targets.length) throw new MarketingError("invalid_field", "Choisissez au moins un produit ou une catégorie.");
  if (targets.length > 200) throw new MarketingError("invalid_field", "Trop de cibles (200 au maximum).");
  return { name, starts, ends, targets };
}
function createSale(s, input) {
  const v = saleInput(s, input);
  return transaction(s.db, () => {
    const id = Number(s.db.prepare("INSERT INTO mk_shop_sales (organization_id, site_id, name, starts_at, ends_at) VALUES (?,?,?,?,?)").run(s.organizationId, s.siteId ?? null, v.name, v.starts, v.ends).lastInsertRowid);
    for (const [k, t] of v.targets) s.db.prepare("INSERT OR IGNORE INTO mk_shop_sale_targets (sale_id, kind, target_id) VALUES (?,?,?)").run(id, k, t);
    return id;
  });
}
function updateSaleWindow(s, id, input) {
  const sale = s.db.prepare(`SELECT * FROM mk_shop_sales WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(id) || 0, s.organizationId, ...siteArgs(s));
  if (!sale) throw new MarketingError("not_found", "Vente introuvable.");
  const starts = parseWhen(input.starts_at, "Début"); const ends = parseWhen(input.ends_at, "Fin");
  if (ends <= starts) throw new MarketingError("invalid_field", "La fin doit être après le début.");
  const name = input.name ? String(input.name).replace(/[<>\u0000-\u001f]+/g, " ").trim().slice(0, 80) : sale.name;
  s.db.prepare("UPDATE mk_shop_sales SET name = ?, starts_at = ?, ends_at = ? WHERE id = ?").run(name || sale.name, starts, ends, sale.id);
}
function deleteSale(s, id) {
  const r = s.db.prepare(`DELETE FROM mk_shop_sales WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(Number(id) || 0, s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Vente introuvable.");
}
function listSales(s) {
  const t = nowSql();
  const rows = s.db.prepare(`SELECT * FROM mk_shop_sales WHERE organization_id = ? AND ${siteCond(s)} ORDER BY starts_at DESC LIMIT 100`).all(s.organizationId, ...siteArgs(s));
  return rows.map((x) => ({
    ...x, state: x.starts_at > t ? "upcoming" : x.ends_at > t ? "open" : "ended",
    targets: s.db.prepare(`SELECT st.kind, st.target_id, CASE st.kind WHEN 'product' THEN (SELECT name FROM mk_shop_products WHERE id = st.target_id) ELSE (SELECT name FROM mk_shop_categories WHERE id = st.target_id) END AS name FROM mk_shop_sale_targets st WHERE st.sale_id = ?`).all(x.id),
  }));
}

module.exports = {
  parseWhen, fmt, inputValue, isMember, viewerIsMember, memberRow, setMember, addByEmail, requestAccess, listMembers,
  createInvitation, listInvitations, setInvitationActive, redeem, normCode,
  saveRule, deleteRule, listRules, ruleOf, saleOf, gate, assertPurchasable, gates, hiddenIds, isHidden,
  createSale, updateSaleWindow, deleteSale, listSales,
};
