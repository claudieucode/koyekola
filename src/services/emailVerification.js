// Confirmation de l'adresse e-mail d'un compte (audit M1). Elle ne bloque rien : un compte non confirmé fonctionne
// normalement (une panne d'envoi d'e-mails ne doit jamais empêcher un élève d'accéder à ses formations). Elle prouve
// que la personne reçoit bien les e-mails à cette adresse.
// Lien signé (HMAC avec SESSION_SECRET), valable 7 jours, lié à l'adresse : il ne vaut plus rien si l'adresse change.
const crypto = require("crypto");
const db = require("../config/database");

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const secret = () => process.env.SESSION_SECRET || "dev-secret";
const mac = (body) => crypto.createHmac("sha256", secret()).update(`verify-email:${body}`).digest("base64url");

function tokenFor(user, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ u: user.id, e: String(user.email).toLowerCase(), x: now + TTL_MS })).toString("base64url");
  return `${body}.${mac(body)}`;
}

// Jeton → { userId, email } s'il est authentique et non expiré, sinon null
function readToken(token, now = Date.now()) {
  if (typeof token !== "string" || token.length > 512) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(mac(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!Number.isInteger(p.u) || typeof p.e !== "string" || !(p.x > now)) return null;
    return { userId: p.u, email: p.e };
  } catch {
    return null;
  }
}

// "ok" (confirmée maintenant) | "deja" (déjà confirmée) | null (lien invalide, expiré, ou adresse changée depuis)
function confirm(token) {
  const t = readToken(token);
  if (!t) return null;
  const user = db.prepare("SELECT id, email, email_verified_at FROM users WHERE id = ? AND deleted_at IS NULL").get(t.userId);
  if (!user || String(user.email).toLowerCase() !== t.email) return null;
  if (user.email_verified_at) return "deja";
  db.prepare("UPDATE users SET email_verified_at = datetime('now') WHERE id = ? AND email_verified_at IS NULL").run(user.id);
  return "ok";
}

module.exports = { tokenFor, readToken, confirm, TTL_MS };
