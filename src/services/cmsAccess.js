// KOLAKISA CMS → contrôle d'accès (palier 9) : UNE seule logique « que peut faire cette personne, ici ? ».
//
//   compte (users) ─► appartenance à l'équipe (mk_org_members : rôle global) ─┐
//                  └► accès à un site   (mk_site_members : rôle sur CE site)  ─┴► rôle ─► permissions ─► effectivePermissions(user, site)
//
// Réutilisation : le compte et la session sont ceux du LMS (users, express-session) ; l'équipe et les rôles de base viennent de
// organizations.js (viewer < editor < admin < owner et la table PERMISSIONS, déjà appliquées par toutes les routes du CMS via
// need()/req.mk.can()). Ce module AJOUTE : rôles du système supplémentaires (author, contributor), rôles personnalisés (mk_roles),
// accès par site, garde-fous (pas d'escalade, dernier propriétaire), invitations et journal d'audit (mk_audit_logs existant).
// (Ne pas confondre avec services/access.js : droits d'accès aux formations et aux leçons.)
const crypto = require("crypto");
const orgs = require("../marketing/organizations");
const { recordAudit } = require("../marketing/audit");
const { UserError } = require("../utils/errors");
const { transaction } = require("../marketing/db/tx");

const db = require("../config/database");

// ---------- Catalogue des permissions (groupes pour l'éditeur de rôles) ----------
// Les clés sont celles que les routes vérifient VRAIMENT (aucune permission décorative). « action » classe chaque permission pour la matrice.
const GROUPS = [
  { key: "users", label: "Utilisateurs et rôles", perms: [
    ["users.view", "Voir l'équipe", "view"], ["users.create", "Inviter des personnes", "create"], ["users.edit", "Modifier (statut, rôle)", "edit"],
    ["users.delete", "Retirer de l'équipe", "delete"], ["users.manage_roles", "Attribuer des rôles", "edit"], ["roles.manage", "Créer et modifier les rôles", "edit"], ["audit.read", "Lire le journal d'activité", "view"]] },
  { key: "pages", label: "Pages, sites et formulaires", perms: [
    ["forms.read", "Voir les pages, sites et formulaires", "view"], ["forms.write", "Créer et modifier pages, sites, formulaires", "edit"], ["pages.publish", "Publier une page", "publish"],
    ["pages.delete", "Supprimer définitivement une page", "delete"], ["pages.code", "Code personnalisé dans les pages", "edit"]] },
  { key: "articles", label: "Articles", perms: [
    ["articles.read", "Voir les articles", "view"], ["articles.edit_own", "Gérer ses propres articles", "edit"], ["articles.write", "Gérer tous les articles", "edit"],
    ["articles.publish", "Publier", "publish"], ["articles.delete", "Supprimer définitivement", "delete"]] },
  { key: "taxonomies", label: "Catégories et étiquettes", perms: [["taxonomies.read", "Voir", "view"], ["taxonomies.write", "Créer et modifier", "edit"], ["taxonomies.delete", "Supprimer et fusionner", "delete"]] },
  { key: "media", label: "Médias", perms: [["media.read", "Voir", "view"], ["media.upload", "Ajouter", "create"], ["media.write", "Modifier", "edit"], ["media.delete", "Supprimer définitivement", "delete"]] },
  { key: "comments", label: "Commentaires", perms: [["comments.read", "Voir", "view"], ["comments.moderate", "Modérer", "publish"], ["comments.delete", "Supprimer définitivement", "delete"], ["comments.email", "Voir les e-mails des invités", "view"]] },
  { key: "navigation", label: "Navigation", perms: [["navigation.read", "Voir", "view"], ["navigation.write", "Créer et modifier les menus", "edit"], ["navigation.publish", "Affecter à un emplacement", "publish"], ["navigation.delete", "Supprimer un menu", "delete"]] },
  { key: "appearance", label: "Apparence", perms: [["appearance.read", "Voir", "view"], ["appearance.styles", "Modifier les styles", "edit"], ["appearance.parts", "Modifier en-tête et pied de page", "edit"],
    ["appearance.templates", "Modifier les templates", "edit"], ["appearance.patterns", "Gérer les patterns", "edit"], ["appearance.publish", "Publier l'apparence", "publish"]] },
  { key: "settings", label: "Réglages du site", perms: [["settings.read", "Voir", "view"], ["settings.write", "Modifier", "edit"], ["domains.manage", "Domaines", "edit"], ["api_keys.manage", "Clés d'API", "edit"], ["webhooks.manage", "Webhooks", "edit"], ["queue.manage", "File d'envoi", "edit"]] },
  { key: "marketing", label: "Marketing (contacts, listes, campagnes, automatisations)", perms: [
    ["contacts.read", "Contacts : voir", "view"], ["contacts.write", "Contacts : modifier", "edit"], ["contacts.delete", "Contacts : supprimer", "delete"], ["contacts.import", "Contacts : importer", "create"], ["contacts.export", "Contacts : exporter", "view"],
    ["compliance.read", "Conformité : voir", "view"], ["compliance.manage", "Conformité : gérer", "edit"], ["lists.read", "Listes : voir", "view"], ["lists.write", "Listes : modifier", "edit"],
    ["segments.read", "Segments : voir", "view"], ["segments.write", "Segments : modifier", "edit"], ["templates.read", "Modèles d'e-mail : voir", "view"], ["templates.write", "Modèles d'e-mail : modifier", "edit"],
    ["campaigns.read", "Campagnes : voir", "view"], ["campaigns.write", "Campagnes : modifier", "edit"], ["campaigns.send", "Campagnes : envoyer", "publish"],
    ["automations.read", "Automatisations : voir", "view"], ["automations.write", "Automatisations : modifier", "edit"], ["automations.activate", "Automatisations : activer", "publish"], ["analytics.read", "Statistiques", "view"]] },
];
const LABELS = Object.fromEntries(GROUPS.flatMap((g) => g.perms.map(([k, label, action]) => [k, { label, action, group: g.key }])));
// Réservées au rôle de plus haut niveau : jamais attribuables à un rôle personnalisé
const OWNER_ONLY = Object.freeze(["members.manage", "organization.delete"]);
const ASSIGNABLE = Object.keys(LABELS);
const ACTIONS = [["view", "Voir"], ["create", "Créer"], ["edit", "Modifier"], ["publish", "Publier"], ["delete", "Supprimer"]];

// ---------- Rôles du système (définis dans le code : jamais modifiables, donc jamais cassés) ----------
const ALL_KEYS = Object.keys(orgs.PERMISSIONS);
const byMin = (min) => ALL_KEYS.filter((k) => orgs.roleAtLeast(min, orgs.PERMISSIONS[k]));
const VIEWER_KEYS = byMin("viewer");
const NOT_FOR_AUTHORS = ["contacts.read", "compliance.read", "lists.read", "segments.read", "templates.read", "campaigns.read", "automations.read", "analytics.read", "settings.read", "audit.read"];
const SYSTEM_ROLES = [
  { key: "owner", name: "Super administrateur", description: "Tous les droits, y compris la gestion de l'équipe et de l'organisation. Protégé : le dernier ne peut pas être retiré.", rank: 4, permissions: byMin("owner") },
  { key: "admin", name: "Administrateur", description: "Gère le site, le contenu, l'apparence et l'équipe (sans toucher aux Super administrateurs).", rank: 3, permissions: byMin("admin") },
  { key: "editor", name: "Éditeur", description: "Crée, modifie et publie tous les contenus ; modère les commentaires ; ne gère ni l'équipe ni les réglages.", rank: 2, permissions: byMin("editor") },
  { key: "author", name: "Auteur", description: "Voit le site, gère ses propres articles et ajoute des médias ; ne publie pas.", rank: 1.6, permissions: [...VIEWER_KEYS.filter((k) => !NOT_FOR_AUTHORS.includes(k)), "articles.edit_own", "media.upload"] },
  { key: "contributor", name: "Contributeur", description: "Voit les contenus et gère ses propres articles ; n'ajoute pas de médias et ne publie pas.", rank: 1.4, permissions: ["articles.read", "articles.edit_own", "taxonomies.read", "comments.read", "media.read", "navigation.read", "forms.read"] },
  { key: "viewer", name: "Lecteur", description: "Consulte tout en lecture seule.", rank: 1, permissions: VIEWER_KEYS.filter((k) => k !== "users.view") },
];
const SYSTEM = new Map(SYSTEM_ROLES.map((r) => [r.key, { ...r, system: true, permissions: new Set(r.permissions) }]));

// ---------- Registre des rôles (système + personnalisés), mémorisé et invalidé à chaque modification ----------
let roleCache = null;
const invalidate = () => { roleCache = null; };
function customRoles() {
  if (!roleCache) {
    roleCache = new Map();
    for (const r of db.prepare("SELECT * FROM mk_roles").all()) {
      let perms = [];
      try { perms = JSON.parse(r.permissions); } catch { perms = []; }
      roleCache.set(r.key, { id: r.id, key: r.key, name: r.name, description: r.description, system: false, rank: 0, permissions: new Set(perms.filter((p) => ASSIGNABLE.includes(p))), createdAt: r.created_at, organizationId: r.organization_id });
    }
  }
  return roleCache;
}
const getRole = (key) => SYSTEM.get(key) || customRoles().get(key) || null;
const allRoles = () => [...SYSTEM.values(), ...[...customRoles().values()].sort((a, b) => a.name.localeCompare(b.name, "fr"))];
// Rôle inconnu (rôle personnalisé supprimé à la main…) : aucune permission, jamais plus
const permissionsOf = (key) => (getRole(key) ? getRole(key).permissions : new Set());

// ---------- Permissions effectives : la seule porte d'entrée ----------
function membershipOf(userId, organizationId) {
  return db.prepare("SELECT role FROM mk_org_members WHERE organization_id = ? AND user_id = ?").get(organizationId, userId) || null;
}
function siteRoleOf(userId, siteId) {
  return Number.isInteger(siteId) ? db.prepare("SELECT role FROM mk_site_members WHERE site_id = ? AND user_id = ?").get(siteId, userId) || null : null;
}
const siteMemberships = (userId) => db.prepare("SELECT sm.site_id, sm.role, s.name AS site_name FROM mk_site_members sm JOIN mk_sites s ON s.id = sm.site_id WHERE sm.user_id = ? AND s.status = 'active' ORDER BY s.name").all(userId);
// Union des permissions du rôle d'équipe (global) et du rôle sur le site demandé ; un compte suspendu n'a aucune permission
function effectivePermissions(userId, { organizationId, siteId = null } = {}) {
  const user = db.prepare("SELECT status FROM users WHERE id = ?").get(userId);
  if (!user || (user.status && user.status !== "active")) return new Set();
  const out = new Set();
  const org = membershipOf(userId, organizationId);
  if (org) permissionsOf(org.role).forEach((p) => out.add(p));
  const site = siteRoleOf(userId, siteId);
  if (site) permissionsOf(site.role).forEach((p) => out.add(p));
  return out;
}
const can = (userId, permission, scope) => effectivePermissions(userId, scope).has(permission);

// ---------- Garde-fous : jamais d'escalade de privilèges ----------
const subset = (a, b) => [...a].every((p) => b.has(p));
// L'acteur peut attribuer ce rôle s'il possède toutes ses permissions (donc jamais plus que lui)
function assertCanGrantRole(actorPerms, roleKey) {
  const role = getRole(roleKey);
  if (!role) throw new UserError("Rôle inconnu.");
  if (!subset(role.permissions, actorPerms)) throw new UserError(`Vous ne pouvez pas attribuer le rôle « ${role.name} » : il contient des droits que vous n'avez pas vous-même.`);
  return role;
}
const activeOwners = (organizationId) => db.prepare("SELECT m.user_id FROM mk_org_members m JOIN users u ON u.id = m.user_id WHERE m.organization_id = ? AND m.role = 'owner' AND u.status = 'active'").all(organizationId).map((r) => r.user_id);
function assertNotLastOwner(organizationId, userId, why) {
  const owners = activeOwners(organizationId);
  if (owners.length <= 1 && owners.includes(userId)) throw new UserError(`Impossible : c'est le dernier Super administrateur actif. ${why}`);
}
// Modifier un compte (rôle, statut, retrait) : jamais soi-même, jamais un niveau supérieur ou égal sans en avoir tous les droits
function assertCanManage(actorId, actorPerms, organizationId, targetId, { self = "vous-même" } = {}) {
  if (actorId === targetId) throw new UserError(`Vous ne pouvez pas modifier ${self} : demandez à un autre administrateur.`);
  const target = membershipOf(targetId, organizationId);
  if (target && getRole(target.role) && !subset(getRole(target.role).permissions, actorPerms)) throw new UserError("Cette personne a des droits que vous n'avez pas vous-même : vous ne pouvez pas la modifier.");
}
const audit = (organizationId, actorId, action, resourceType, resourceId, metadata) => {
  try { recordAudit(db, { organizationId, userId: actorId, action, resourceType, resourceId, metadata }); } catch { /* la journalisation ne casse jamais l'action */ }
};

// ---------- Rôles personnalisés ----------
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
const cleanPerms = (list) => [...new Set([].concat(list || []).map(String).filter((p) => ASSIGNABLE.includes(p)))];
function createRole(organizationId, actor, { name, description = "", permissions = [] }) {
  const nm = String(name || "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!nm) throw new UserError("Donnez un nom au rôle.");
  if (allRoles().some((r) => r.name.toLowerCase() === nm.toLowerCase())) throw new UserError(`Un rôle « ${nm} » existe déjà.`);
  const perms = cleanPerms(permissions);
  if (!subset(new Set(perms), actor.perms)) throw new UserError("Vous ne pouvez pas donner à un rôle des droits que vous n'avez pas vous-même.");
  let key = `custom-${slug(nm) || "role"}`;
  for (let n = 2; getRole(key); n += 1) key = `custom-${slug(nm) || "role"}-${n}`;
  db.prepare("INSERT INTO mk_roles (organization_id, key, name, description, permissions, created_by) VALUES (?, ?, ?, ?, ?, ?)").run(organizationId, key, nm, String(description).trim().slice(0, 200), JSON.stringify(perms), actor.id);
  invalidate();
  audit(organizationId, actor.id, "role.created", "role", key, { name: nm, permissions: perms.length });
  return getRole(key);
}
function updateRole(organizationId, actor, key, { name, description, permissions }) {
  const role = customRoles().get(key);
  if (!role) throw new UserError("Seuls les rôles personnalisés se modifient (les rôles du système sont fixes).");
  const mine = membershipOf(actor.id, organizationId);
  const bySite = siteMemberships(actor.id).some((s) => s.role === key);
  if ((mine && mine.role === key) || bySite) throw new UserError("Vous ne pouvez pas modifier le rôle qui vous est attribué : demandez à un autre administrateur.");
  const nm = name === undefined ? role.name : String(name).replace(/\s+/g, " ").trim().slice(0, 60);
  if (!nm) throw new UserError("Le nom du rôle est obligatoire.");
  if (allRoles().some((r) => r.key !== key && r.name.toLowerCase() === nm.toLowerCase())) throw new UserError(`Un rôle « ${nm} » existe déjà.`);
  const perms = permissions === undefined ? [...role.permissions] : cleanPerms(permissions);
  const added = perms.filter((p) => !role.permissions.has(p));
  if (!subset(new Set(added), actor.perms)) throw new UserError("Vous ne pouvez pas ajouter à un rôle des droits que vous n'avez pas vous-même.");
  db.prepare("UPDATE mk_roles SET name = ?, description = ?, permissions = ?, updated_at = datetime('now') WHERE key = ? AND organization_id = ?").run(nm, description === undefined ? role.description : String(description).trim().slice(0, 200), JSON.stringify(perms), key, organizationId);
  invalidate();
  audit(organizationId, actor.id, "role.updated", "role", key, { name: nm, permissions: perms.length, added: added.length });
  return getRole(key);
}
const roleUsage = (key) => ({
  org: db.prepare("SELECT COUNT(*) n FROM mk_org_members WHERE role = ?").get(key).n,
  sites: db.prepare("SELECT COUNT(*) n FROM mk_site_members WHERE role = ?").get(key).n,
  invitations: db.prepare("SELECT COUNT(*) n FROM mk_invitations WHERE role = ? AND accepted_at IS NULL AND revoked_at IS NULL").get(key).n,
});
function deleteRole(organizationId, actor, key) {
  const role = customRoles().get(key);
  if (!role) throw new UserError("Seuls les rôles personnalisés se suppriment.");
  const u = roleUsage(key);
  if (u.org || u.sites || u.invitations) throw new UserError(`Ce rôle est encore attribué (${u.org + u.sites} personne${u.org + u.sites > 1 ? "s" : ""}${u.invitations ? `, ${u.invitations} invitation${u.invitations > 1 ? "s" : ""}` : ""}) : changez d'abord leur rôle.`);
  db.prepare("DELETE FROM mk_roles WHERE key = ? AND organization_id = ?").run(key, organizationId);
  invalidate();
  audit(organizationId, actor.id, "role.deleted", "role", key, { name: role.name });
  return role;
}

// ---------- Équipe : liste, fiche, changements ----------
const like = (s) => `%${String(s).replace(/[\\%_]/g, "\\$&")}%`;
const SORTS = { nom: "u.username COLLATE NOCASE ASC", recent: "u.created_at DESC, u.id DESC", activite: "COALESCE(u.last_seen_at, '') DESC, u.username COLLATE NOCASE" };
function listMembers(organizationId, { q = "", status = "", role = "", siteId = null, sort = "nom", page = 1, perPage = 25 } = {}) {
  const where = [], args = [organizationId];
  // « Équipe » = membres de l'organisation ET personnes qui n'ont qu'un accès de site
  const base = "FROM users u LEFT JOIN mk_org_members m ON m.user_id = u.id AND m.organization_id = ? WHERE (m.user_id IS NOT NULL OR EXISTS (SELECT 1 FROM mk_site_members sm0 WHERE sm0.user_id = u.id))";
  if (q) { where.push("(u.username LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')"); args.push(like(q), like(q)); }
  if (["active", "suspended", "disabled"].includes(status)) { where.push("u.status = ?"); args.push(status); }
  if (role) { where.push("(m.role = ? OR EXISTS (SELECT 1 FROM mk_site_members sm1 WHERE sm1.user_id = u.id AND sm1.role = ?))"); args.push(role, role); }
  if (Number.isInteger(siteId)) { where.push("EXISTS (SELECT 1 FROM mk_site_members sm2 WHERE sm2.user_id = u.id AND sm2.site_id = ?)"); args.push(siteId); }
  const clause = where.length ? ` AND ${where.join(" AND ")}` : "";
  const total = db.prepare(`SELECT COUNT(*) n ${base}${clause}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), pages);
  const rows = db.prepare(`SELECT u.id, u.username, u.email, u.status, u.created_at AS joined_at, u.last_login_at, u.last_seen_at, u.role AS account_role, m.role AS org_role, m.created_at AS member_since ${base}${clause} ORDER BY ${SORTS[sort] || SORTS.nom} LIMIT ? OFFSET ?`).all(...args, perPage, (current - 1) * perPage);
  const ids = rows.map((r) => r.id);
  const sitesOf = ids.length ? db.prepare(`SELECT sm.user_id, sm.role, s.id AS site_id, s.name FROM mk_site_members sm JOIN mk_sites s ON s.id = sm.site_id WHERE sm.user_id IN (${ids.map(() => "?").join(",")}) ORDER BY s.name`).all(...ids) : [];
  for (const r of rows) r.sites = sitesOf.filter((s) => s.user_id === r.id);
  return { rows, total, page: current, pages };
}
function statusCounts(organizationId) {
  const rows = db.prepare("SELECT u.status, COUNT(*) n FROM users u WHERE EXISTS (SELECT 1 FROM mk_org_members m WHERE m.user_id = u.id AND m.organization_id = ?) OR EXISTS (SELECT 1 FROM mk_site_members sm WHERE sm.user_id = u.id) GROUP BY u.status").all(organizationId);
  const out = { active: 0, suspended: 0, disabled: 0 };
  for (const r of rows) out[r.status] = r.n;
  out.pending = db.prepare("SELECT COUNT(*) n FROM mk_invitations WHERE organization_id = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > datetime('now')").get(organizationId).n;
  out.all = out.active + out.suspended + out.disabled;
  return out;
}
function memberDetail(organizationId, userId) {
  const u = db.prepare("SELECT id, username, email, status, role AS account_role, bio, avatar_path, created_at, last_login_at, last_seen_at FROM users WHERE id = ?").get(userId);
  if (!u) return null;
  const org = membershipOf(userId, organizationId);
  const sites = siteMemberships(userId);
  if (!org && !sites.length) return null;
  return { ...u, org_role: org ? org.role : null, sites, permissions: effectivePermissions(userId, { organizationId }) };
}
function setOrgRole(organizationId, actor, targetId, roleKey) {
  const target = db.prepare("SELECT id, username FROM users WHERE id = ?").get(targetId);
  if (!target) throw new UserError("Compte introuvable.");
  assertCanManage(actor.id, actor.perms, organizationId, targetId, { self: "votre propre rôle" });
  const role = assertCanGrantRole(actor.perms, roleKey);
  const current = membershipOf(targetId, organizationId);
  if (current && current.role === "owner" && roleKey !== "owner") assertNotLastOwner(organizationId, targetId, "Nommez d'abord un autre Super administrateur.");
  if (current) db.prepare("UPDATE mk_org_members SET role = ? WHERE organization_id = ? AND user_id = ?").run(roleKey, organizationId, targetId);
  else db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(organizationId, targetId, roleKey);
  audit(organizationId, actor.id, "user.role_changed", "user", targetId, { from: current ? current.role : null, to: roleKey });
  return { target, role };
}
function setStatus(organizationId, actor, targetId, status) {
  if (!["active", "suspended", "disabled"].includes(status)) throw new UserError("Statut inconnu.");
  assertCanManage(actor.id, actor.perms, organizationId, targetId, { self: "votre propre statut" });
  const t = db.prepare("SELECT id, status FROM users WHERE id = ?").get(targetId);
  if (!t) throw new UserError("Compte introuvable.");
  if (status !== "active") { const m = membershipOf(targetId, organizationId); if (m && m.role === "owner") assertNotLastOwner(organizationId, targetId, "Nommez d'abord un autre Super administrateur."); }
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, targetId);
  audit(organizationId, actor.id, "user.status_changed", "user", targetId, { from: t.status, to: status });
  return t;
}
function removeFromTeam(organizationId, actor, targetId) {
  assertCanManage(actor.id, actor.perms, organizationId, targetId, { self: "votre propre accès" });
  const m = membershipOf(targetId, organizationId);
  if (m && m.role === "owner") assertNotLastOwner(organizationId, targetId, "Nommez d'abord un autre Super administrateur.");
  transaction(db, () => {
    db.prepare("DELETE FROM mk_org_members WHERE organization_id = ? AND user_id = ?").run(organizationId, targetId);
    db.prepare("DELETE FROM mk_site_members WHERE user_id = ?").run(targetId);
  });
  audit(organizationId, actor.id, "user.removed", "user", targetId, { role: m ? m.role : null });
}
// Accès à un site : rôle propre à ce site
function setSiteRole(organizationId, actor, targetId, siteId, roleKey) {
  const site = db.prepare("SELECT id, name FROM mk_sites WHERE id = ? AND organization_id = ?").get(siteId, organizationId);
  if (!site) throw new UserError("Site introuvable.");
  assertCanManage(actor.id, actor.perms, organizationId, targetId, { self: "votre propre accès" });
  assertCanGrantRole(actor.perms, roleKey);
  if (roleKey === "owner") throw new UserError("Le rôle Super administrateur ne s'attribue pas à un seul site.");
  if (!db.prepare("SELECT 1 FROM users WHERE id = ?").get(targetId)) throw new UserError("Compte introuvable.");
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role, created_by) VALUES (?, ?, ?, ?) ON CONFLICT (site_id, user_id) DO UPDATE SET role = excluded.role").run(siteId, targetId, roleKey, actor.id);
  audit(organizationId, actor.id, "site_access.granted", "user", targetId, { site: site.name, role: roleKey });
  return site;
}
function removeSiteRole(organizationId, actor, targetId, siteId) {
  assertCanManage(actor.id, actor.perms, organizationId, targetId, { self: "votre propre accès" });
  const info = db.prepare("DELETE FROM mk_site_members WHERE site_id = ? AND user_id = ?").run(siteId, targetId);
  if (!info.changes) throw new UserError("Aucun accès à retirer.");
  audit(organizationId, actor.id, "site_access.revoked", "user", targetId, { siteId });
}

// ---------- Invitations ----------
const INVITE_DAYS = 7;
const tokenHash = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
const EMAIL_RE = /^[^\s@<>]{1,64}@[^\s@<>]+\.[^\s@<>]{2,}$/;
function invite(organizationId, actor, { email, role, siteId = null }) {
  const mail = String(email || "").trim().toLowerCase().slice(0, 120);
  if (!EMAIL_RE.test(mail)) throw new UserError("Indiquez une adresse e-mail valide.");
  assertCanGrantRole(actor.perms, role);
  if (siteId !== null) {
    if (!db.prepare("SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ?").get(siteId, organizationId)) throw new UserError("Site introuvable.");
    if (role === "owner") throw new UserError("Le rôle Super administrateur ne s'attribue pas à un seul site.");
  }
  const existing = db.prepare("SELECT id, username FROM users WHERE email = ?").get(mail);
  // Compte déjà existant : l'accès est donné tout de suite (pas d'invitation à accepter pour quelqu'un qu'on connaît déjà)
  if (existing) {
    if (siteId !== null) setSiteRole(organizationId, actor, existing.id, siteId, role);
    else {
      if (membershipOf(existing.id, organizationId)) throw new UserError("Cette personne fait déjà partie de l'équipe : changez son rôle depuis sa fiche.");
      setOrgRole(organizationId, actor, existing.id, role);
    }
    return { added: true, user: existing };
  }
  if (db.prepare("SELECT 1 FROM mk_invitations WHERE organization_id = ? AND email = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > datetime('now')").get(organizationId, mail)) throw new UserError("Une invitation est déjà en attente pour cette adresse : renvoyez-la ou révoquez-la.");
  const token = crypto.randomBytes(24).toString("base64url");
  const id = Number(db.prepare("INSERT INTO mk_invitations (organization_id, email, role, site_id, token_hash, invited_by, expires_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))").run(organizationId, mail, role, siteId, tokenHash(token), actor.id, `+${INVITE_DAYS} days`).lastInsertRowid);
  audit(organizationId, actor.id, "user.invited", "invitation", id, { email: mail, role, siteId });
  return { added: false, token, email: mail, id };
}
// Nouveau lien pour une invitation (l'ancien cesse de fonctionner)
function reissue(organizationId, actor, invitationId) {
  const inv = db.prepare("SELECT * FROM mk_invitations WHERE id = ? AND organization_id = ? AND accepted_at IS NULL AND revoked_at IS NULL").get(invitationId, organizationId);
  if (!inv) throw new UserError("Invitation introuvable ou déjà utilisée.");
  assertCanGrantRole(actor.perms, inv.role);
  const token = crypto.randomBytes(24).toString("base64url");
  db.prepare("UPDATE mk_invitations SET token_hash = ?, expires_at = datetime('now', ?) WHERE id = ?").run(tokenHash(token), `+${INVITE_DAYS} days`, invitationId);
  audit(organizationId, actor.id, "user.invited", "invitation", invitationId, { email: inv.email, role: inv.role, resent: true });
  return { token, email: inv.email, id: invitationId };
}
function revoke(organizationId, actor, invitationId) {
  const info = db.prepare("UPDATE mk_invitations SET revoked_at = datetime('now') WHERE id = ? AND organization_id = ? AND accepted_at IS NULL AND revoked_at IS NULL").run(invitationId, organizationId);
  if (!info.changes) throw new UserError("Invitation introuvable ou déjà utilisée.");
  audit(organizationId, actor.id, "invitation.revoked", "invitation", invitationId, {});
}
function listInvitations(organizationId) {
  return db.prepare(`SELECT i.id, i.email, i.role, i.site_id, s.name AS site_name, i.created_at, i.expires_at, i.accepted_at, i.revoked_at, u.username AS invited_by_name,
      CASE WHEN i.accepted_at IS NOT NULL THEN 'accepted' WHEN i.revoked_at IS NOT NULL THEN 'revoked' WHEN i.expires_at <= datetime('now') THEN 'expired' ELSE 'pending' END AS state
    FROM mk_invitations i LEFT JOIN mk_sites s ON s.id = i.site_id LEFT JOIN users u ON u.id = i.invited_by WHERE i.organization_id = ? ORDER BY i.id DESC LIMIT 200`).all(organizationId);
}
function invitationByToken(token) {
  return db.prepare("SELECT * FROM mk_invitations WHERE token_hash = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > datetime('now')").get(tokenHash(token)) || null;
}
// Acceptation : le compte est créé par l'appelant (mêmes règles d'inscription que le site), l'accès est donné ici
function acceptInvitation(inv, userId) {
  transaction(db, () => {
    if (inv.site_id) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role, created_by) VALUES (?, ?, ?, ?) ON CONFLICT (site_id, user_id) DO UPDATE SET role = excluded.role").run(inv.site_id, userId, inv.role, inv.invited_by);
    else db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?) ON CONFLICT (organization_id, user_id) DO UPDATE SET role = excluded.role").run(inv.organization_id, userId, inv.role);
    db.prepare("UPDATE mk_invitations SET accepted_at = datetime('now'), accepted_user_id = ? WHERE id = ?").run(userId, inv.id);
  });
  audit(inv.organization_id, userId, "invitation.accepted", "invitation", inv.id, { role: inv.role, siteId: inv.site_id });
}

// ---------- Matrice : domaine × action, alimentée par les permissions réelles du rôle ----------
function matrix(roleKey) {
  const role = getRole(roleKey);
  const perms = role ? role.permissions : new Set();
  return GROUPS.filter((g) => g.key !== "marketing").map((g) => ({
    key: g.key, label: g.label,
    cells: Object.fromEntries(ACTIONS.map(([a]) => {
      const keys = g.perms.filter((p) => p[2] === a).map((p) => p[0]);
      return [a, keys.length ? { has: keys.some((k) => perms.has(k)), all: keys.every((k) => perms.has(k)), keys } : null];
    })),
  }));
}

module.exports = {
  GROUPS, LABELS, ACTIONS, OWNER_ONLY, ASSIGNABLE, SYSTEM_ROLES, INVITE_DAYS,
  getRole, allRoles, customRoles, invalidate, permissionsOf, membershipOf, siteRoleOf, siteMemberships, effectivePermissions, can, subset,
  assertCanGrantRole, assertNotLastOwner, assertCanManage, createRole, updateRole, deleteRole, roleUsage, listMembers, statusCounts, memberDetail,
  setOrgRole, setStatus, removeFromTeam, setSiteRole, removeSiteRole, invite, reissue, revoke, listInvitations, invitationByToken, acceptInvitation, matrix, activeOwners,
};
