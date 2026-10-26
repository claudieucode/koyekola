// Comptes → Profil : informations et préférences personnelles du compte connecté. UNE source d'authentification : la table users (identifiant, e-mail,
// mot de passe haché, biographie, photo) ; seuls les champs propres au profil (prénom, nom, pseudo, nom affiché, site web, préférences, adresse en attente)
// vivent dans mk_user_profiles. Chaque fonction ne touche QUE le compte qu'on lui passe : l'identifiant vient de la session, jamais de la requête.
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const sanitizeHtml = require("sanitize-html");
const db = require("../config/database");
const { UserError } = require("../utils/errors");
const { passwordStamp } = require("../middlewares/sessionUser");

const MAX_BIO = 1000;
const MAX_NAME = 80;
const MIN_PASSWORD = 8, MAX_PASSWORD = 200;
const THEMES = ["auto", "light", "dark"];
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
// Texte brut : toute balise est retirée (la biographie peut être affichée publiquement ; elle est de plus échappée à l'affichage)
const plain = (v, max) => sanitizeHtml(String(v ?? ""), { allowedTags: [], allowedAttributes: {} }).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);

function prefsOf(raw) {
  let p = {};
  try { p = JSON.parse(raw || "{}") || {}; } catch { p = {}; }
  return { theme: THEMES.includes(p.theme) ? p.theme : "auto" };
}

function profileOf(userId) {
  const u = db.prepare("SELECT id, username, email, role, bio, avatar_path, created_at, email_verified_at FROM users WHERE id = ? AND deleted_at IS NULL").get(userId);
  if (!u) return null;
  const p = db.prepare("SELECT * FROM mk_user_profiles WHERE user_id = ?").get(userId) || {};
  return {
    ...u, firstName: p.first_name || "", lastName: p.last_name || "", nickname: p.nickname || "", displayName: p.display_name || "", website: p.website || "",
    prefs: prefsOf(p.prefs), pendingEmail: p.pending_email || null, pendingEmailAt: p.pending_email_at || null,
  };
}
// Propositions de « nom à afficher » à partir des noms saisis (jamais une valeur libre : le choix est contrôlé côté serveur)
function displayOptions({ username, nickname, firstName, lastName }) {
  const out = [username];
  if (nickname) out.push(nickname);
  if (firstName) out.push(firstName);
  if (lastName) out.push(lastName);
  if (firstName && lastName) out.push(`${firstName} ${lastName}`, `${lastName} ${firstName}`);
  return [...new Set(out.filter(Boolean))];
}
const shownName = (p) => p.displayName || p.nickname || p.username;

// URL de site web : http(s) uniquement (jamais javascript: ni data:), normalisée
function normalizeWebsite(value) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  if (v.length > 300) throw new UserError("Le site web est trop long (300 caractères au plus).");
  let url;
  try { url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`); } catch { throw new UserError("Le site web n'est pas une adresse valide."); }
  if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) throw new UserError("Le site web doit être une adresse http:// ou https:// valide.");
  return url.toString();
}

// Enregistre l'identité et les préférences. Renvoie { errors } sans rien écrire si une valeur est invalide (la saisie est gardée par la vue).
function saveProfile(userId, input) {
  const cur = profileOf(userId);
  if (!cur) throw new UserError("Compte introuvable.");
  const errors = {};
  const firstName = clean(input.first_name, MAX_NAME), lastName = clean(input.last_name, MAX_NAME);
  let nickname = clean(input.nickname, MAX_NAME);
  if (!nickname) errors.nickname = "Le pseudo est nécessaire.";
  let website = "";
  try { website = normalizeWebsite(input.website); } catch (e) { errors.website = e.message; }
  const bio = plain(input.bio, MAX_BIO);
  if (String(input.bio ?? "").length > MAX_BIO * 4) errors.bio = `La biographie est trop longue (${MAX_BIO} caractères au plus).`;
  const options = displayOptions({ username: cur.username, nickname, firstName, lastName });
  const asked = clean(input.display_name, 120);
  const displayName = options.includes(asked) ? asked : (asked ? null : nickname);
  if (displayName === null) errors.display_name = "Choisissez un nom parmi la liste proposée.";
  const theme = THEMES.includes(input.theme) ? input.theme : null;
  if (!theme) errors.theme = "Choisissez un thème : clair, sombre ou automatique.";
  if (Object.keys(errors).length) return { ok: false, errors };
  db.prepare(`INSERT INTO mk_user_profiles (user_id, first_name, last_name, nickname, display_name, website, prefs, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET first_name = excluded.first_name, last_name = excluded.last_name, nickname = excluded.nickname, display_name = excluded.display_name,
      website = excluded.website, prefs = excluded.prefs, updated_at = excluded.updated_at`).run(userId, firstName, lastName, nickname, displayName, website, JSON.stringify({ theme }));
  db.prepare("UPDATE users SET bio = ? WHERE id = ?").run(bio, userId);
  return { ok: true };
}

// ----- Photo de profil : le type est vérifié sur le CONTENU du fichier (signature), jamais sur son nom ni sur l'en-tête envoyé par le navigateur -----
const SIGNATURES = [
  ["image/jpeg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ["image/png", (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  ["image/gif", (b) => /^GIF8[79]a/.test(b.subarray(0, 6).toString("latin1"))],
  ["image/webp", (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP"],
  ["image/avif", (b) => b.subarray(4, 8).toString("latin1") === "ftyp" && /avif|avis/.test(b.subarray(8, 16).toString("latin1"))],
];
const MAX_AVATAR = 2 * 1024 * 1024;
function checkImageFile(file) {
  if (file.size > MAX_AVATAR) throw new UserError("La photo est trop lourde (2 Mo au plus).");
  const head = Buffer.alloc(16);
  const fd = fs.openSync(file.path, "r");
  try { fs.readSync(fd, head, 0, 16, 0); } finally { fs.closeSync(fd); }
  if (!SIGNATURES.some(([, test]) => test(head))) throw new UserError("Ce fichier n'est pas une image JPEG, PNG, GIF, WebP ou AVIF.");
}

// Applique une photo envoyée (fichier déjà validé par checkImageFile) ou sa suppression : la base est mise à jour d'abord, l'ancien fichier n'est effacé qu'ensuite.
// Renvoie true si la photo a changé. Ne touche que le compte passé en paramètre.
function applyAvatar(userId, { file = null, remove = false } = {}) {
  const row = db.prepare("SELECT avatar_path FROM users WHERE id = ?").get(userId);
  if (!row) throw new UserError("Compte introuvable.");
  let avatar = row.avatar_path;
  if (file) avatar = `/uploads/thumbnails/${file.filename}`;
  else if (remove) avatar = null;
  if (avatar === row.avatar_path) return false;
  db.prepare("UPDATE users SET avatar_path = ? WHERE id = ?").run(avatar, userId);
  if (row.avatar_path) require("../utils/uploads").removeUploadedFile(row.avatar_path);
  return true;
}

// ----- Adresse e-mail : l'adresse vérifiée n'est remplacée qu'après ouverture du lien envoyé à la NOUVELLE adresse -----
const EMAIL_TTL_MS = 24 * 60 * 60 * 1000;
const secret = () => process.env.SESSION_SECRET || "dev-secret";
const mac = (body) => crypto.createHmac("sha256", secret()).update(`change-email:${body}`).digest("base64url");
const emailTaken = (email, exceptUserId) => Boolean(db.prepare("SELECT 1 FROM users WHERE lower(email) = lower(?) AND id <> ?").get(email, exceptUserId) || db.prepare("SELECT 1 FROM mk_user_profiles WHERE lower(pending_email) = lower(?) AND user_id <> ?").get(email, exceptUserId));
function emailToken(userId, email, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ u: userId, e: String(email).toLowerCase(), x: now + EMAIL_TTL_MS })).toString("base64url");
  return `${body}.${mac(body)}`;
}
function readEmailToken(token, now = Date.now()) {
  if (typeof token !== "string" || token.length > 600) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(mac(body)), b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return Number.isInteger(p.u) && typeof p.e === "string" && p.x > now ? { userId: p.u, email: p.e } : null;
  } catch { return null; }
}
// Demande de changement : valide, mémorise l'adresse EN ATTENTE et renvoie le jeton à envoyer à la nouvelle adresse
function requestEmailChange(userId, email) {
  const cur = profileOf(userId);
  const next = clean(email, 254);
  if (!EMAIL.test(next)) throw new UserError("Cette adresse e-mail n'est pas valide.");
  if (next.toLowerCase() === String(cur.email).toLowerCase()) throw new UserError("C'est déjà l'adresse de votre compte.");
  if (emailTaken(next, userId)) throw new UserError("Cette adresse e-mail ne peut pas être utilisée.");
  db.prepare(`INSERT INTO mk_user_profiles (user_id, nickname, pending_email, pending_email_at) VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET pending_email = excluded.pending_email, pending_email_at = excluded.pending_email_at`).run(userId, cur.username, next);
  return { to: next, token: emailToken(userId, next), username: cur.username };
}
function cancelEmailChange(userId) { db.prepare("UPDATE mk_user_profiles SET pending_email = NULL, pending_email_at = NULL WHERE user_id = ?").run(userId); }
// Lien ouvert : "ok" | "invalide" (jeton faux, expiré, demande annulée ou remplacée) | "pris" (adresse devenue indisponible)
function confirmEmailChange(token) {
  const t = readEmailToken(token);
  if (!t) return "invalide";
  const p = db.prepare("SELECT pending_email FROM mk_user_profiles WHERE user_id = ?").get(t.userId);
  if (!p || !p.pending_email || p.pending_email.toLowerCase() !== t.email) return "invalide";
  if (emailTaken(p.pending_email, t.userId)) return "pris";
  db.prepare("UPDATE users SET email = ?, email_verified_at = datetime('now') WHERE id = ? AND deleted_at IS NULL").run(p.pending_email, t.userId);
  cancelEmailChange(t.userId);
  return "ok";
}

// ----- Mot de passe -----
async function changePassword(userId, { current, next, confirm }) {
  const row = db.prepare("SELECT id, password_hash FROM users WHERE id = ? AND deleted_at IS NULL").get(userId);
  if (!row) throw new UserError("Compte introuvable.");
  const errors = {};
  if (typeof current !== "string" || !current || !(await bcrypt.compare(current, row.password_hash))) errors.current = "Le mot de passe actuel est incorrect.";
  next = String(next ?? "");
  if (next.length < MIN_PASSWORD) errors.next = `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`;
  else if (next.length > MAX_PASSWORD) errors.next = `Le nouveau mot de passe est trop long (${MAX_PASSWORD} caractères au plus).`;
  else if (current && next === current) errors.next = "Le nouveau mot de passe doit être différent de l'actuel.";
  if (!errors.next && next !== String(confirm ?? "")) errors.confirm = "Les deux mots de passe ne sont pas identiques.";
  if (Object.keys(errors).length) return { ok: false, errors, wrongCurrent: Boolean(errors.current) };
  const hash = bcrypt.hashSync(next, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, userId);
  return { ok: true, stamp: passwordStamp(hash) };
}

// ----- Sessions du compte (table sessions, voir config/sessionStore) -----
const sidKey = (sid) => crypto.createHash("sha256").update(`session:${sid}`).digest("hex").slice(0, 16); // l'identifiant de session lui-même n'est jamais affiché
function sessionsOf(userId, currentSid) {
  const now = Date.now();
  const rows = db.prepare("SELECT sid, data, expires_at FROM sessions WHERE expires_at > ? AND data LIKE ?").all(now, `%"id":${Number(userId)},%`);
  const out = [];
  for (const r of rows) {
    let d; try { d = JSON.parse(r.data); } catch { continue; }
    if (!d.user || d.user.id !== userId) continue;
    out.push({ key: sidKey(r.sid), current: r.sid === currentSid, expiresAt: r.expires_at, device: d.device || null, sid: r.sid });
  }
  return out.sort((a, b) => Number(b.current) - Number(a.current) || b.expiresAt - a.expiresAt);
}
function revokeSessions(userId, currentSid, key = null) {
  let n = 0;
  for (const s of sessionsOf(userId, currentSid)) {
    if (s.current || (key && s.key !== key)) continue;
    n += db.prepare("DELETE FROM sessions WHERE sid = ?").run(s.sid).changes;
  }
  return n;
}
// Résumé court et non sensible de l'appareil (navigateur et système), mémorisé à l'ouverture de la session
function deviceOf(userAgent) {
  const ua = String(userAgent || "");
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navigateur";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return { label: os ? `${browser} sur ${os}` : browser, at: new Date().toISOString() };
}

// Thème enregistré (préférence « auto » = suit l'appareil) : lu à chaque page de l'administration
function themeOf(userId) {
  const row = db.prepare("SELECT prefs FROM mk_user_profiles WHERE user_id = ?").get(userId);
  return row ? prefsOf(row.prefs).theme : "auto";
}

module.exports = { profileOf, displayOptions, shownName, saveProfile, checkImageFile, applyAvatar, requestEmailChange, cancelEmailChange, confirmEmailChange, readEmailToken, changePassword, sessionsOf, revokeSessions, deviceOf, themeOf, THEMES, MAX_BIO, MAX_AVATAR, MIN_PASSWORD };
