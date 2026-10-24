// KOLAKISA CMS → création d'un compte par un administrateur (Utilisateurs → Ajouter un compte). Étend le contrôle d'accès existant (services/cmsAccess) : AUCUN second système.
//   compte (users)  — toujours un compte ordinaire du site (rôle global « etudiant ») : jamais administrateur global, quel que soit le rôle CMS demandé ;
//   accès CMS       — rôle d'équipe (organisation) ou rôle d'UN site, attribué par cmsAccess avec ses garde-fous (jamais plus de droits que soi, jamais « Super administrateur »
//                     pour un seul site) ; sans rôle : compte ordinaire sans accès à l'administration (valeur par défaut = le moins privilégié) ;
//   mot de passe    — haché (bcrypt, comme l'inscription) ; jamais journalisé, jamais renvoyé, jamais envoyé par e-mail ;
//   activation      — lien de définition du mot de passe (table password_resets existante, usage unique, durée limitée) + confirmation d'adresse (services/emailVerification) ;
//   e-mail          — mis en file par le moteur d'envoi existant ; l'état annoncé est exact (accepté, refusé, serveur absent).
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const access = require("./cmsAccess");
const primarySite = require("./primarySite");
const emailVerification = require("./emailVerification");
const mailer = require("../utils/mailer");
const { LANGUAGES } = require("../utils/format");
const { recordAudit } = require("../marketing/audit");
const { UserError } = require("../utils/errors");
const { transaction } = require("../marketing/db/tx");

const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
const USERNAME_RE = /^[\p{L}\p{N}](?:[\p{L}\p{N} ._'-]*[\p{L}\p{N}])?$/u;
const ACTIVATION_DAYS = 7;
const MAX_PER_HOUR = 30;
const PASSWORD_MIN = 8, PASSWORD_MAX = 200;
const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

// Robustesse indicative (longueur, variété, répétitions) — un repère visuel, JAMAIS une garantie de sécurité ; la règle appliquée est la longueur minimale
function strength(password) {
  const p = String(password || "");
  if (!p) return { score: 0, label: "" };
  let pool = 0;
  if (/[a-z]/.test(p)) pool += 26; if (/[A-Z]/.test(p)) pool += 26; if (/\d/.test(p)) pool += 10; if (/[^A-Za-z0-9]/.test(p)) pool += 32;
  const distinct = new Set(p).size;
  const bits = Math.log2(Math.max(2, pool)) * Math.min(p.length, distinct * 2);
  const score = p.length < PASSWORD_MIN ? 1 : bits >= 90 ? 4 : bits >= 60 ? 3 : bits >= 40 ? 2 : 1;
  return { score, label: ["", "Faible", "Moyenne", "Forte", "Très forte"][score], bits: Math.round(bits) };
}

// Validation pure : { ok, value, errors: { champ: message } } — rien n'est corrigé en silence
function validate(input, { requirePassword = true } = {}) {
  const errors = {};
  const v = {
    username: String(input.username ?? "").trim(), email: String(input.email ?? "").trim().toLowerCase(),
    first_name: clean(input.first_name, 60), last_name: clean(input.last_name, 60), website: String(input.website ?? "").trim(), language: String(input.language ?? "").trim(),
    password: String(input.password ?? ""), notify: input.notify === true || input.notify === "1" || input.notify === "on", role: String(input.role ?? "").trim(),
  };
  if (!v.username) errors.username = "L'identifiant est obligatoire.";
  else if (v.username.length < 3 || v.username.length > 30) errors.username = "L'identifiant doit contenir entre 3 et 30 caractères.";
  else if (!USERNAME_RE.test(v.username) || /  /.test(v.username)) errors.username = "Lettres, chiffres, espace simple, point, tiret, tiret bas et apostrophe seulement ; il commence et finit par une lettre ou un chiffre.";
  if (!v.email) errors.email = "L'adresse e-mail est obligatoire.";
  else if (v.email.length > 120 || !EMAIL_RE.test(v.email)) errors.email = "Cette adresse e-mail n'est pas valide (exemple : prenom@exemple.fr).";
  if (v.website) {
    let u = null;
    try { u = new URL(v.website); } catch { /* invalide */ }
    if (!u || !/^https?:$/.test(u.protocol) || u.username || u.password || v.website.length > 200 || !/\./.test(u.hostname)) errors.website = "Indiquez une adresse complète en http:// ou https:// (exemple : https://www.exemple.fr).";
    else v.website = u.href;
  }
  if (v.language && !Object.hasOwn(LANGUAGES, v.language)) errors.language = "Cette langue n'est pas prise en charge.";
  if (v.password) {
    if (v.password.length < PASSWORD_MIN) errors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`;
    else if (v.password.length > PASSWORD_MAX) errors.password = `Le mot de passe est trop long (${PASSWORD_MAX} caractères au plus).`;
    else if (!v.password.trim()) errors.password = "Le mot de passe ne peut pas être fait uniquement d'espaces.";
    else if (v.username && v.password.toLowerCase() === v.username.toLowerCase()) errors.password = "Le mot de passe ne doit pas être identique à l'identifiant.";
    else if (v.email && v.password.toLowerCase() === v.email) errors.password = "Le mot de passe ne doit pas être identique à l'adresse e-mail.";
  } else if (requirePassword && !v.notify) errors.password = "Saisissez un mot de passe ou générez-en un (ou cochez l'envoi d'un e-mail : la personne choisira le sien).";
  return { ok: !Object.keys(errors).length, value: v, errors };
}

// Quota : jamais de création en rafale (abus de la messagerie et de la base) ; l'administrateur est identifié par son compte
function assertQuota(organizationId, actorId) {
  let n = 0;
  try { n = db.prepare("SELECT COUNT(*) n FROM mk_audit_logs WHERE organization_id = ? AND user_id = ? AND action = 'user.account_created' AND created_at > datetime('now', '-1 hour')").get(organizationId, actorId).n; } catch { n = 0; }
  if (n >= MAX_PER_HOUR) throw new UserError(`Limite atteinte : ${MAX_PER_HOUR} comptes par heure. Réessayez plus tard.`);
}

// Lien de définition du mot de passe : jeton aléatoire, seule son empreinte est conservée, valable ACTIVATION_DAYS jours, à usage unique (page « réinitialiser-mot-de-passe » existante)
function issueActivation(userId, days = ACTIVATION_DAYS) {
  const token = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const now = Date.now();
  db.prepare("INSERT INTO password_resets (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)").run(userId, hash, now + days * 86400e3, now);
  return token;
}

// Crée le compte. actor = { id, perms } ; scopeSiteId : un administrateur LOCAL ne crée que pour SON site (imposé par le serveur, jamais par le navigateur).
// Renvoie { user, role, siteId, siteName, notification, activationUrl? } — la notification est exécutée APRÈS la validation de la transaction.
function create(organizationId, actor, input, { scopeSiteId = null } = {}) {
  const v = validate(input);
  if (!v.ok) throw Object.assign(new UserError("Corrigez les champs signalés."), { fields: v.errors });
  const val = v.value;
  const siteId = scopeSiteId !== null ? scopeSiteId : /^\d{1,9}$/.test(String(input.site_id ?? "")) ? Number(input.site_id) : null;
  if (scopeSiteId !== null && input.site_id !== undefined && String(input.site_id) !== "" && Number(input.site_id) !== scopeSiteId) throw new UserError("Vous ne pouvez créer un compte que pour ce site.");
  let site = null;
  if (siteId !== null) {
    site = db.prepare(`SELECT id, name FROM mk_sites WHERE id = ? AND organization_id = ? AND status = 'active'${primarySite.excludeSql(db)}`).get(siteId, organizationId);
    if (!site) throw new UserError("Site introuvable ou archivé.");
  }
  // Rôle : « aucun » (compte ordinaire sans accès à l'administration) ou un rôle que l'acteur possède lui-même ; jamais attribué d'office
  if (val.role) {
    access.assertCanGrantRole(actor.perms, val.role);
    if (siteId !== null && val.role === "owner") throw new UserError("Le rôle Super administrateur ne s'attribue pas à un seul site.");
  }
  assertQuota(organizationId, actor.id);
  const exists = (col, value) => db.prepare(`SELECT 1 FROM users WHERE lower(${col}) = lower(?)`).get(value);
  if (exists("username", val.username)) throw Object.assign(new UserError("Corrigez les champs signalés."), { fields: { username: "Cet identifiant est déjà utilisé : choisissez-en un autre." } });
  if (exists("email", val.email)) throw Object.assign(new UserError("Corrigez les champs signalés."), { fields: { email: "Cette adresse e-mail est déjà associée à un compte." } });
  const hash = bcrypt.hashSync(val.password || crypto.randomBytes(32).toString("base64url"), 10); // sans mot de passe saisi : valeur aléatoire inutilisable, la personne choisit le sien par le lien
  let user, token = null;
  try {
    transaction(db, () => {
      const id = Number(db.prepare("INSERT INTO users (username, email, password_hash, role, first_name, last_name, website, language) VALUES (?, ?, ?, 'etudiant', ?, ?, ?, ?)").run(val.username, val.email, hash, val.first_name, val.last_name, val.website, val.language).lastInsertRowid);
      user = { id, username: val.username, email: val.email };
      if (val.role) {
        if (siteId !== null) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role, created_by) VALUES (?, ?, ?, ?)").run(siteId, id, val.role, actor.id);
        else db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(organizationId, id, val.role);
      }
      if (val.notify) token = issueActivation(id);
      // Jamais le mot de passe, le jeton ni le lien dans le journal
      recordAudit(db, { organizationId, userId: actor.id, action: "user.account_created", resourceType: "user", resourceId: id, metadata: { username: val.username, role: val.role || null, siteId, notify: val.notify, language: val.language || null }, siteId });
    });
  } catch (error) {
    // Course entre deux envois : la base refuse le doublon (UNIQUE) — message de champ, jamais une erreur serveur
    if (/UNIQUE/i.test(String(error && error.message))) throw Object.assign(new UserError("Corrigez les champs signalés."), { fields: /email/i.test(error.message) ? { email: "Cette adresse e-mail est déjà associée à un compte." } : { username: "Cet identifiant est déjà utilisé : choisissez-en un autre." } });
    throw error;
  }
  const out = { user, role: val.role || null, siteId, siteName: site ? site.name : "", notification: { requested: val.notify } };
  if (val.notify) {
    const url = `${mailer.siteUrl()}/reinitialiser-mot-de-passe/${token}`;
    const verifyUrl = `${mailer.siteUrl()}/confirmer-email/${emailVerification.tokenFor(user)}`;
    const queued = mailer.sendAccountCreatedEmail(db, { to: user.email, username: user.username, creator: actor.name || "Un administrateur", siteName: out.siteName, activateUrl: url, verifyUrl, days: ACTIVATION_DAYS, choosePassword: !val.password });
    const configured = Boolean(process.env.SMTP_HOST);
    out.notification = { requested: true, queued: Boolean(queued.queued), configured, days: ACTIVATION_DAYS, choosePassword: !val.password };
    // Le lien n'est montré à l'administrateur que si aucun e-mail ne peut partir (il le transmet lui-même) : jamais autrement
    if (!queued.queued || !configured) out.activationUrl = url;
  }
  return out;
}

// Message affiché à l'administrateur : exact — « envoyé » n'est jamais écrit avant l'acceptation par le serveur d'envoi
function summary(r) {
  const who = `Compte « ${r.user.username} » créé${r.siteName ? ` sur ${r.siteName}` : ""}`;
  const n = r.notification;
  const lead = r.role ? ` avec le rôle « ${(access.getRole(r.role) || { name: r.role }).name} »` : " sans accès à l'administration";
  if (!n.requested) return { type: "ok", text: `${who}${lead}.`, detail: "Aucun e-mail n'a été envoyé : communiquez vous-même son mot de passe à la personne." };
  if (!n.queued) return { type: "error", text: `${who}${lead}, mais l'e-mail n'a pas pu être mis en file d'envoi (adresse refusée). Aucun message n'est parti.`, detail: `Lien personnel à transmettre vous-même (valable ${n.days} jours) : ${r.activationUrl}` };
  if (!n.configured) return { type: "error", text: `${who}${lead}, mais aucun serveur d'e-mail n'est configuré : aucun message ne partira.`, detail: `Lien personnel à transmettre vous-même (valable ${n.days} jours) : ${r.activationUrl}` };
  return { type: "ok", text: `${who}${lead} : l'e-mail est en file d'envoi.`, detail: "« En file d'envoi » veut dire accepté par le serveur d'envoi, pas lu par la personne. Le lien contenu dans le message est valable " + n.days + " jours." };
}

module.exports = { create, validate, strength, summary, issueActivation, ACTIVATION_DAYS, MAX_PER_HOUR, PASSWORD_MIN, PASSWORD_MAX, USERNAME_RE, EMAIL_RE };
