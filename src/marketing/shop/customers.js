// Programme 20.5 — Clients d'une boutique. DISTINCTS des utilisateurs de la plateforme (table users) : un client n'a aucun accès à l'administration,
// et le même e-mail peut être client de deux boutiques sans qu'elles se connaissent. Mot de passe : scrypt avec sel ; jetons : seule l'empreinte SHA-256 est stockée.
const crypto = require("node:crypto");
const { MarketingError } = require("../errors");

const SESSION_DAYS = 30;
const RESET_MINUTES = 60;
const siteCond = (s) => (s.siteId == null ? "site_id IS NULL" : "site_id = ?");
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const sha = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
const normEmail = (e) => String(e || "").trim().toLowerCase();
const inFuture = (ms) => new Date(Date.now() + ms).toISOString().slice(0, 19).replace("T", " ");
const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}
function verifyPassword(password, stored) {
  const [kind, saltHex, hashHex] = String(stored || "").split("$");
  if (kind !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const got = crypto.scryptSync(String(password), Buffer.from(saltHex, "hex"), expected.length);
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}
const checkPassword = (p) => { if (typeof p !== "string" || p.length < 10 || p.length > 200) throw new MarketingError("invalid_field", "Le mot de passe doit contenir au moins 10 caractères."); };
const checkEmail = (e) => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 200) throw new MarketingError("invalid_field", "Adresse e-mail invalide."); };

function byEmail(s, email) {
  return s.db.prepare(`SELECT * FROM mk_shop_customers WHERE organization_id = ? AND ${siteCond(s)} AND email = ?`).get(s.organizationId, ...siteArgs(s), normEmail(email)) || null;
}
function byId(s, id) {
  return s.db.prepare(`SELECT * FROM mk_shop_customers WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(id) || 0, s.organizationId, ...siteArgs(s)) || null;
}

function register(s, { email, password, name }) {
  const e = normEmail(email); checkEmail(e); checkPassword(password);
  const existing = byEmail(s, e);
  // Un client « invité » (créé par une commande) peut activer son compte ; un compte existant n'est jamais écrasé.
  if (existing && existing.password_hash) throw new MarketingError("conflict", "Un compte existe déjà avec cette adresse. Connectez-vous.");
  if (existing) { s.db.prepare("UPDATE mk_shop_customers SET password_hash = ?, name = COALESCE(?, name), updated_at = datetime('now') WHERE id = ?").run(hashPassword(password), name ? String(name).slice(0, 120) : null, existing.id); return existing.id; }
  return Number(s.db.prepare("INSERT INTO mk_shop_customers (organization_id, site_id, email, password_hash, name) VALUES (?,?,?,?,?)").run(s.organizationId, s.siteId ?? null, e, hashPassword(password), name ? String(name).slice(0, 120) : null).lastInsertRowid);
}
// Client « invité » : créé ou retrouvé au passage de la commande (sans mot de passe).
function ensureGuest(s, email, name) {
  const e = normEmail(email);
  const c = byEmail(s, e);
  if (c) return c.id;
  return Number(s.db.prepare("INSERT INTO mk_shop_customers (organization_id, site_id, email, name) VALUES (?,?,?,?)").run(s.organizationId, s.siteId ?? null, e, name ? String(name).slice(0, 120) : null).lastInsertRowid);
}

// → jeton de session (à placer dans un cookie HttpOnly) ; message identique pour « inconnu » et « mauvais mot de passe ».
function login(s, email, password) {
  const c = byEmail(s, email);
  const ok = c && c.password_hash && c.status === "active" && verifyPassword(password, c.password_hash);
  if (!c || !c.password_hash) verifyPassword(password, "scrypt$00$00"); // temps comparable
  if (!ok) throw new MarketingError("auth", "Adresse e-mail ou mot de passe incorrect.");
  const token = crypto.randomBytes(32).toString("hex");
  s.db.prepare("INSERT INTO mk_shop_customer_tokens (customer_id, site_id, kind, token_hash, expires_at) VALUES (?,?, 'session', ?, ?)").run(c.id, s.siteId ?? null, sha(token), inFuture(SESSION_DAYS * 86400000));
  return { token, customerId: c.id };
}
// Client d'une session DANS cette boutique seulement (jeton d'une autre boutique → null).
function fromSession(s, token) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) return null;
  const row = s.db.prepare("SELECT customer_id FROM mk_shop_customer_tokens WHERE token_hash = ? AND kind = 'session' AND expires_at > ?").get(sha(token), nowSql());
  if (!row) return null;
  const c = byId(s, row.customer_id);
  return c && c.status === "active" ? c : null;
}
function logout(s, token) {
  if (typeof token === "string") s.db.prepare("DELETE FROM mk_shop_customer_tokens WHERE token_hash = ? AND kind = 'session'").run(sha(token));
}

// Réinitialisation : renvoie le jeton (à envoyer par e-mail) ou null si le compte n'existe pas (l'appelant répond pareil dans les deux cas).
function requestReset(s, email) {
  const c = byEmail(s, email);
  if (!c || !c.password_hash || c.status !== "active") return null;
  const token = crypto.randomBytes(32).toString("hex");
  s.db.prepare("DELETE FROM mk_shop_customer_tokens WHERE customer_id = ? AND kind = 'reset'").run(c.id);
  s.db.prepare("INSERT INTO mk_shop_customer_tokens (customer_id, site_id, kind, token_hash, expires_at) VALUES (?,?, 'reset', ?, ?)").run(c.id, s.siteId ?? null, sha(token), inFuture(RESET_MINUTES * 60000));
  return { token, customer: c };
}
function resetPassword(s, token, password) {
  checkPassword(password);
  const row = typeof token === "string" ? s.db.prepare("SELECT * FROM mk_shop_customer_tokens WHERE token_hash = ? AND kind = 'reset' AND used_at IS NULL AND expires_at > ?").get(sha(token), nowSql()) : null;
  const c = row && byId(s, row.customer_id);
  if (!c) throw new MarketingError("invalid_token", "Ce lien n'est plus valable. Demandez-en un nouveau.");
  s.db.prepare("UPDATE mk_shop_customers SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hashPassword(password), c.id);
  s.db.prepare("UPDATE mk_shop_customer_tokens SET used_at = datetime('now') WHERE id = ?").run(row.id);
  s.db.prepare("DELETE FROM mk_shop_customer_tokens WHERE customer_id = ? AND kind = 'session'").run(c.id); // toutes les sessions sont fermées
  return c.id;
}

function updateProfile(s, id, { name, phone, addresses }) {
  const c = byId(s, id);
  if (!c) throw new MarketingError("not_found", "Client introuvable.");
  const list = Array.isArray(addresses) ? addresses.slice(0, 10).map((a) => ({ name: String(a.name || "").slice(0, 120), line1: String(a.line1 || "").slice(0, 160), line2: String(a.line2 || "").slice(0, 160), postal_code: String(a.postal_code || "").slice(0, 20), city: String(a.city || "").slice(0, 100), country: String(a.country || "").slice(0, 2).toUpperCase() })) : JSON.parse(c.addresses);
  s.db.prepare("UPDATE mk_shop_customers SET name = ?, phone = ?, addresses = ?, updated_at = datetime('now') WHERE id = ?").run(name != null ? String(name).slice(0, 120) : c.name, phone != null ? String(phone).slice(0, 30) : c.phone, JSON.stringify(list), c.id);
}

function listCustomers(s, { q, page = 1, perPage = 25 } = {}) {
  const where = ["c.organization_id = ?", s.siteId == null ? "c.site_id IS NULL" : "c.site_id = ?"]; const args = [s.organizationId, ...siteArgs(s)];
  if (q) { const like = `%${String(q).slice(0, 80).replace(/[\\%_]/g, (m) => `\\${m}`)}%`; where.push("(c.email LIKE ? ESCAPE '\\' OR c.name LIKE ? ESCAPE '\\')"); args.push(like, like); }
  const pp = Math.min(100, Math.max(1, Number(perPage) || 25));
  const total = s.db.prepare(`SELECT COUNT(*) AS n FROM mk_shop_customers c WHERE ${where.join(" AND ")}`).get(...args).n;
  const items = s.db.prepare(`SELECT c.id, c.email, c.name, c.status, c.created_at, (c.password_hash IS NOT NULL) AS has_account,
      (SELECT COUNT(*) FROM mk_shop_orders o WHERE o.customer_id = c.id) AS orders, (SELECT COALESCE(SUM(total_cents),0) FROM mk_shop_orders o WHERE o.customer_id = c.id AND o.payment_status = 'paid') AS spent_cents
    FROM mk_shop_customers c WHERE ${where.join(" AND ")} ORDER BY c.id DESC LIMIT ? OFFSET ?`).all(...args, pp, (Math.max(1, Number(page) || 1) - 1) * pp);
  return { items, total, pages: Math.ceil(total / pp) };
}
function setStatus(s, id, status) {
  if (!["active", "disabled"].includes(status)) throw new MarketingError("invalid_field", "Statut inconnu.");
  if (!byId(s, id)) throw new MarketingError("not_found", "Client introuvable.");
  s.db.prepare("UPDATE mk_shop_customers SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  if (status === "disabled") s.db.prepare("DELETE FROM mk_shop_customer_tokens WHERE customer_id = ? AND kind = 'session'").run(id);
}

module.exports = { hashPassword, verifyPassword, byEmail, byId, register, ensureGuest, login, fromSession, logout, requestReset, resetPassword, updateProfile, listCustomers, setStatus };
