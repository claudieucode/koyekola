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
const primarySite = require("./primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
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
    ["funnels.read", "Tunnels : voir", "view"], ["funnels.write", "Tunnels : construire (étapes, pages associées, réglages)", "edit"],
    ["pages.delete", "Supprimer définitivement une page", "delete"], ["pages.code", "Code personnalisé dans les pages", "edit"]] },
  { key: "articles", label: "Articles", perms: [
    ["articles.read", "Voir les articles", "view"], ["articles.edit_own", "Gérer ses propres articles", "edit"], ["articles.write", "Gérer tous les articles", "edit"],
    ["articles.publish", "Publier", "publish"], ["articles.delete", "Supprimer définitivement", "delete"]] },
  { key: "revisions", label: "Historique et corbeille", perms: [["revisions.view", "Voir l'historique des modifications", "view"], ["revisions.restore", "Restaurer une ancienne version", "edit"], ["revisions.delete", "Supprimer des versions de l'historique", "delete"]] },
  { key: "seo", label: "Référencement (SEO)", perms: [["seo.view", "Voir l'analyse et l'aperçu SEO", "view"], ["seo.edit", "Modifier les réglages SEO (pages, site)", "edit"]] },
  { key: "tools", label: "Outils (import, export, santé, maintenance)", perms: [["tools.view", "Voir les outils et les informations système", "view"], ["tools.health", "Lancer l'analyse de santé et les contrôles d'intégrité", "view"],
    ["tools.export", "Exporter le contenu", "view"], ["tools.import", "Importer du contenu (nouveaux éléments)", "create"], ["tools.overwrite", "Mettre à jour par import des éléments existants", "edit"],
    ["tools.content", "Outils de contenu (rechercher / remplacer, régénérations, nettoyages)", "edit"], ["tools.cache", "Inspecter et vider les caches", "edit"], ["tools.maintenance", "Activer le mode maintenance d'un site", "publish"]] },
  { key: "privacy", label: "Données personnelles (effacement)", perms: [["privacy.view", "Voir les demandes d'effacement de données", "view"], ["privacy.request", "Ajouter une demande d'effacement et renvoyer les confirmations", "create"],
    ["privacy.erase", "Lancer l'effacement des données d'une demande confirmée, marquer terminée, supprimer de la liste", "delete"], ["privacy.force", "Forcer un effacement sans confirmation de la personne", "delete"]] },
  { key: "notes", label: "Admin Notes (notes internes d'administration)", perms: [["notes.view", "Voir les notes internes du site", "view"], ["notes.create", "Ajouter une note", "create"], ["notes.edit", "Modifier une note", "edit"], ["notes.delete", "Supprimer une note", "delete"]] },
  { key: "redirects", label: "Adresses et redirections", perms: [["redirects.view", "Voir les redirections, les liens cassés et les adresses", "view"], ["redirects.create", "Créer une redirection", "create"], ["redirects.edit", "Modifier, activer, désactiver une redirection", "edit"],
    ["redirects.delete", "Supprimer une redirection", "delete"], ["redirects.external", "Rediriger vers un site extérieur", "edit"]] },
  { key: "taxonomies", label: "Catégories et étiquettes", perms: [["taxonomies.read", "Voir", "view"], ["taxonomies.write", "Créer et modifier", "edit"], ["taxonomies.delete", "Supprimer et fusionner", "delete"]] },
  { key: "media", label: "Médias", perms: [["media.read", "Voir", "view"], ["media.upload", "Ajouter", "create"], ["media.write", "Modifier", "edit"], ["media.delete", "Supprimer définitivement", "delete"]] },
  { key: "comments", label: "Commentaires", perms: [["comments.read", "Voir", "view"], ["comments.moderate", "Modérer", "publish"], ["comments.delete", "Supprimer définitivement", "delete"], ["comments.email", "Voir les e-mails des invités", "view"]] },
  { key: "navigation", label: "Navigation", perms: [["navigation.read", "Voir", "view"], ["navigation.write", "Créer et modifier les menus", "edit"], ["navigation.publish", "Affecter à un emplacement", "publish"], ["navigation.delete", "Supprimer un menu", "delete"]] },
  { key: "appearance", label: "Apparence", perms: [["appearance.read", "Voir", "view"], ["appearance.styles", "Modifier les styles", "edit"], ["appearance.parts", "Modifier en-tête et pied de page", "edit"],
    ["appearance.templates", "Modifier les templates", "edit"], ["appearance.patterns", "Gérer les patterns", "edit"], ["appearance.publish", "Publier l'apparence", "publish"]] },
  { key: "settings", label: "Réglages du site", perms: [["settings.read", "Voir", "view"], ["settings.write", "Modifier", "edit"], ["settings.sensitive", "Modifier les réglages sensibles (domaine, indexation, page d'accueil, adresses)", "edit"], ["domains.manage", "Domaines", "edit"], ["api_keys.manage", "Clés d'API", "edit"], ["webhooks.manage", "Webhooks", "edit"], ["queue.manage", "File d'envoi", "edit"]] },
  { key: "marketing", label: "Marketing (contacts, listes, campagnes, automatisations)", perms: [
    ["contacts.read", "Contacts : voir", "view"], ["contacts.write", "Contacts : modifier", "edit"], ["contacts.delete", "Contacts : supprimer", "delete"], ["contacts.import", "Contacts : importer", "create"], ["contacts.export", "Contacts : exporter", "view"],
    ["contacts.archive", "Contacts : archiver et rétablir", "edit"], ["contacts.merge", "Contacts : fusionner deux fiches", "edit"], ["contacts.requests", "Contacts : traiter les demandes de rattachement entre sites", "edit"], ["sites.modules", "Sites : activer ou désactiver les modules d'un site", "edit"], ["contacts.manage_fields", "Contacts : gérer les champs personnalisés", "edit"],
    ["contacts.view_sensitive", "Contacts : voir téléphone, e-mail complet et preuves de consentement", "view"], ["events.view", "Journal d'événements des contacts : voir", "view"],
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
const NOT_FOR_AUTHORS = ["contacts.read", "contacts.view_sensitive", "events.view", "compliance.read", "lists.read", "segments.read", "templates.read", "campaigns.read", "automations.read", "analytics.read", "settings.read", "audit.read"];
const SYSTEM_ROLES = [
  { key: "owner", name: "Super administrateur", description: "Tous les droits, y compris la gestion de l'équipe et de l'organisation. Protégé : le dernier ne peut pas être retiré.", rank: 4, permissions: byMin("owner") },
  { key: "admin", name: "Administrateur", description: "Gère le site, le contenu, l'apparence et l'équipe (sans toucher aux Super administrateurs).", rank: 3, permissions: byMin("admin") },
  { key: "editor", name: "Éditeur", description: "Crée, modifie et publie tous les contenus ; modère les commentaires ; ne gère ni l'équipe ni les réglages.", rank: 2, permissions: byMin("editor") },
  { key: "author", name: "Auteur", description: "Voit le site, gère ses propres articles et ajoute des médias ; ne publie pas.", rank: 1.6, permissions: [...VIEWER_KEYS.filter((k) => !NOT_FOR_AUTHORS.includes(k)), "articles.edit_own", "media.upload", "revisions.view", "revisions.restore"] },
  { key: "contributor", name: "Contributeur", description: "Voit les contenus et gère ses propres articles ; n'ajoute pas de médias et ne publie pas.", rank: 1.4, permissions: ["articles.read", "articles.edit_own", "taxonomies.read", "comments.read", "media.read", "navigation.read", "forms.read"] },
  { key: "viewer", name: "Lecteur", description: "Consulte tout en lecture seule.", rank: 1, permissions: VIEWER_KEYS.filter((k) => k !== "users.view") },
];
const SYSTEM = new Map(SYSTEM_ROLES.map((r) => [r.key, { ...r, system: true, permissions: new Set(r.permissions) }]));

// ---------- Registre des rôles (système + personnalisés), mémorisé et invalidé à chaque modification ----------
let roleCache = null;
const invalidate = () => { roleCache = null; };
const cacheInfo = () => ({ entries: roleCache ? (roleCache.size ?? Object.keys(roleCache).length) : 0, loaded: roleCache !== null });
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
// → { role, mode } ou null. mode : 'add' (les droits du site s'ajoutent à ceux de l'équipe, comportement historique) ou 'limit' (plafond : intersection)
function siteRoleOf(userId, siteId) {
  return Number.isInteger(siteId) ? db.prepare("SELECT role, mode FROM mk_site_members WHERE site_id = ? AND user_id = ?").get(siteId, userId) || null : null;
}
const siteMemberships = (userId) => db.prepare("SELECT sm.site_id, sm.role, sm.mode, s.name AS site_name FROM mk_site_members sm JOIN mk_sites s ON s.id = sm.site_id WHERE sm.user_id = ? AND s.status = 'active' ORDER BY s.name").all(userId);
// Union des permissions du rôle d'équipe (global) et du rôle sur le site demandé ; un compte suspendu n'a aucune permission.
// R3 (plafond par site) : si l'affectation à CE site est en mode 'limit' ET que la personne est membre de l'équipe, ses droits sur ce site sont
// l'INTERSECTION du rôle d'équipe et du rôle de site (jamais plus que l'un ou l'autre). Sans affectation, ou en mode 'add' (valeur par défaut de toutes
// les lignes existantes), c'est l'union historique, inchangée. Un accès limité à un site (sans rôle d'équipe) n'est pas concerné : son plafond est son rôle de site.
function effectivePermissions(userId, { organizationId, siteId = null } = {}) {
  const user = db.prepare("SELECT status FROM users WHERE id = ?").get(userId);
  if (!user || (user.status && user.status !== "active")) return new Set();
  const out = new Set();
  const org = membershipOf(userId, organizationId);
  const site = siteRoleOf(userId, siteId);
  const teamPerms = org ? permissionsOf(org.role) : null;
  if (org && site && site.mode === "limit") {
    const sitePerms = permissionsOf(site.role);
    teamPerms.forEach((p) => { if (sitePerms.has(p)) out.add(p); });
    return out;
  }
  if (teamPerms) teamPerms.forEach((p) => out.add(p));
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
// `siteId` : quand on agit sur l'accès à UN site, le rôle que la cible y possède déjà compte aussi (sinon une personne peu dotée rétrograderait ou retirerait un administrateur du site)
function assertCanManage(actorId, actorPerms, organizationId, targetId, { self = "vous-même", siteId = null } = {}) {
  if (actorId === targetId) throw new UserError(`Vous ne pouvez pas modifier ${self} : demandez à un autre administrateur.`);
  const target = membershipOf(targetId, organizationId);
  if (target && getRole(target.role) && !subset(getRole(target.role).permissions, actorPerms)) throw new UserError("Cette personne a des droits que vous n'avez pas vous-même : vous ne pouvez pas la modifier.");
  const onSite = Number.isInteger(siteId) ? siteRoleOf(targetId, siteId) : null;
  if (onSite && getRole(onSite.role) && !subset(getRole(onSite.role).permissions, actorPerms)) throw new UserError("Cette personne a, sur ce site, des droits que vous n'avez pas vous-même : vous ne pouvez pas la modifier.");
}
const audit = (organizationId, actorId, action, resourceType, resourceId, metadata, siteId) => {
  try { recordAudit(db, { organizationId, userId: actorId, action, resourceType, resourceId, metadata, siteId }); } catch { /* la journalisation ne casse jamais l'action */ }
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
const SITE_MODES = Object.freeze(["add", "limit"]);
function setSiteRole(organizationId, actor, targetId, siteId, roleKey, { mode } = {}) {
  const site = db.prepare(`SELECT id, name FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(db)}`).get(siteId, organizationId);
  if (!site) throw new UserError("Site introuvable.");
  assertCanManage(actor.id, actor.perms, organizationId, targetId, { self: "votre propre accès", siteId });
  assertCanGrantRole(actor.perms, roleKey);
  if (roleKey === "owner") throw new UserError("Le rôle Super administrateur ne s'attribue pas à un seul site.");
  if (!db.prepare("SELECT 1 FROM users WHERE id = ?").get(targetId)) throw new UserError("Compte introuvable.");
  if (mode !== undefined && !SITE_MODES.includes(mode)) throw new UserError("Mode d'accès inconnu.");
  const before = siteRoleOf(targetId, siteId);
  const newMode = mode ?? (before ? before.mode : "add"); // sans mode demandé : le mode existant est conservé, jamais remis à « add » en silence
  if (newMode === "limit") assertCanLimit(organizationId, targetId);
  // Repasser de « limit » à « add » ÉLARGIT les droits de la personne sur ce site : on ne peut le faire que si l'on possède tous ces droits soi-même
  if (before && before.mode === "limit" && newMode === "add") assertCanGrantRole(actor.perms, before.role);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role, mode, created_by) VALUES (?, ?, ?, ?, ?) ON CONFLICT (site_id, user_id) DO UPDATE SET role = excluded.role, mode = excluded.mode").run(siteId, targetId, roleKey, newMode, actor.id);
  audit(organizationId, actor.id, "site_access.granted", "user", targetId, { site: site.name, role: roleKey, mode: newMode }, site.id);
  return site;
}
// Un plafond n'a de sens que pour un membre de l'équipe, et jamais pour un Super administrateur (qui doit garder la maîtrise de l'organisation)
function assertCanLimit(organizationId, targetId) {
  const m = membershipOf(targetId, organizationId);
  if (m && m.role === "owner") throw new UserError("Un Super administrateur ne peut pas être plafonné sur un site.");
}
// Change seulement le mode d'une affectation existante (plafond ou comportement historique)
function setSiteMode(organizationId, actor, targetId, siteId, mode) {
  if (!SITE_MODES.includes(mode)) throw new UserError("Mode d'accès inconnu.");
  const row = siteRoleOf(targetId, siteId);
  if (!row) throw new UserError("Cette personne n'a pas d'accès propre à ce site.");
  const site = db.prepare(`SELECT id, name FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(db)}`).get(siteId, organizationId);
  if (!site) throw new UserError("Site introuvable.");
  assertCanManage(actor.id, actor.perms, organizationId, targetId, { self: "votre propre accès", siteId });
  if (mode === "limit") assertCanLimit(organizationId, targetId);
  else if (row.mode === "limit") assertCanGrantRole(actor.perms, row.role); // retirer un plafond élargit les droits : même règle anti-escalade qu'un octroi
  db.prepare("UPDATE mk_site_members SET mode = ? WHERE site_id = ? AND user_id = ?").run(mode, siteId, targetId);
  audit(organizationId, actor.id, "site_access.mode_changed", "user", targetId, { site: site.name, role: row.role, from: row.mode, to: mode }, siteId);
  return site;
}
function removeSiteRole(organizationId, actor, targetId, siteId) {
  assertCanManage(actor.id, actor.perms, organizationId, targetId, { self: "votre propre accès", siteId });
  const info = db.prepare("DELETE FROM mk_site_members WHERE site_id = ? AND user_id = ?").run(siteId, targetId);
  if (!info.changes) throw new UserError("Aucun accès à retirer.");
  audit(organizationId, actor.id, "site_access.revoked", "user", targetId, { siteId }, siteId);
}


// ---------- Administration LOCALE d'un site : personnes qui ont un rôle propre à CE site (jamais celles d'un autre site, jamais le détail de l'équipe centrale) ----------
function listSiteMembers(organizationId, siteId, { q = "", role = "", status = "", sort = "nom", page = 1, perPage = 25 } = {}) {
  const where = ["sm.site_id = ?"], args = [organizationId, siteId];
  if (q) { where.push("(u.username LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')"); args.push(like(q), like(q)); }
  if (role) { where.push("sm.role = ?"); args.push(role); }
  if (["active", "suspended", "disabled"].includes(status)) { where.push("u.status = ?"); args.push(status); }
  const base = `FROM mk_site_members sm JOIN users u ON u.id = sm.user_id JOIN mk_sites s ON s.id = sm.site_id AND s.organization_id = ? WHERE ${where.join(" AND ")}`;
  const total = db.prepare(`SELECT COUNT(*) n ${base}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), pages);
  const order = { nom: "u.username COLLATE NOCASE ASC", recent: "sm.created_at DESC, u.id DESC", activite: "COALESCE(u.last_seen_at, '') DESC, u.username COLLATE NOCASE" }[sort] || "u.username COLLATE NOCASE ASC";
  const rows = db.prepare(`SELECT u.id, u.username, u.email, u.status, sm.role, sm.mode, sm.created_at AS since, u.last_seen_at ${base} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...args, perPage, (current - 1) * perPage);
  return { rows, total, page: current, pages };
}
const siteStatusCounts = (siteId) => { const out = { all: 0, active: 0, suspended: 0, disabled: 0 }; for (const r of db.prepare("SELECT u.status, COUNT(*) n FROM mk_site_members sm JOIN users u ON u.id = sm.user_id WHERE sm.site_id = ? GROUP BY u.status").all(siteId)) { out[r.status] = r.n; out.all += r.n; } return out; };
const siteRoleCounts = (siteId) => Object.fromEntries(db.prepare("SELECT role, COUNT(*) n FROM mk_site_members WHERE site_id = ? GROUP BY role").all(siteId).map((r) => [r.role, r.n]));
// Fiche d'une personne DU SITE : null si elle n'y a pas de rôle propre (on ne révèle jamais l'existence d'un compte hors du site)
function siteMemberDetail(organizationId, siteId, userId) {
  const row = db.prepare("SELECT sm.role, sm.mode, sm.created_at AS since, sm.created_by FROM mk_site_members sm JOIN mk_sites s ON s.id = sm.site_id AND s.organization_id = ? WHERE sm.site_id = ? AND sm.user_id = ?").get(organizationId, siteId, userId);
  if (!row) return null;
  const u = db.prepare("SELECT id, username, email, status, bio, created_at, last_login_at, last_seen_at FROM users WHERE id = ?").get(userId);
  if (!u) return null;
  const by = row.created_by ? db.prepare("SELECT username FROM users WHERE id = ?").get(row.created_by) : null;
  const team = membershipOf(userId, organizationId);
  const history = db.prepare("SELECT l.action, l.created_at, l.metadata, a.username AS actor FROM mk_audit_logs l LEFT JOIN users a ON a.id = l.user_id WHERE l.organization_id = ? AND l.site_id = ? AND l.resource_type = 'user' AND l.resource_id = ? ORDER BY l.id DESC LIMIT 15").all(organizationId, siteId, String(userId))
    .map((h) => { let m = {}; try { m = JSON.parse(h.metadata); } catch { /* métadonnées illisibles : ignorées */ } return { action: h.action, at: h.created_at, actor: h.actor || "—", role: m.role || null, mode: m.mode || null }; });
  return { ...u, site_role: row.role, mode: row.mode, since: row.since, added_by: by ? by.username : null, in_team: Boolean(team), permissions: effectivePermissions(userId, { organizationId, siteId }), history };
}

// ---------- Invitations ----------
const INVITE_DAYS = 7;
const tokenHash = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
const EMAIL_RE = /^[^\s@<>]{1,64}@[^\s@<>]+\.[^\s@<>]{2,}$/;
// Limites : jamais d'envoi en rafale (abus de la messagerie du CMS) ; l'inviteur est identifié par son compte, pas par une adresse IP
const INVITE_MAX_PER_HOUR = 30, RESEND_COOLDOWN_SECONDS = 60, MAX_SENDS = 6;
function assertInviteQuota(organizationId, actorId) {
  const n = db.prepare("SELECT COUNT(*) n FROM mk_invitations WHERE organization_id = ? AND invited_by = ? AND created_at > datetime('now', '-1 hour')").get(organizationId, actorId).n;
  if (n >= INVITE_MAX_PER_HOUR) throw new UserError(`Limite atteinte : ${INVITE_MAX_PER_HOUR} invitations par heure. Réessayez plus tard.`);
}
// scopeSiteId : un administrateur LOCAL n'invite que pour SON site (le serveur l'impose ; le navigateur n'en décide jamais)
function invite(organizationId, actor, { email, role, siteId = null, name = "", message = "", days = INVITE_DAYS, scopeSiteId = null }) {
  const mail = String(email || "").trim().toLowerCase().slice(0, 120);
  if (!EMAIL_RE.test(mail)) throw new UserError("Indiquez une adresse e-mail valide.");
  if (scopeSiteId !== null && siteId !== scopeSiteId) throw new UserError("Vous ne pouvez inviter que sur ce site.");
  const invitedName = String(name || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, 80);
  const note = String(message || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, 500);
  const lifetime = Number.isInteger(Number(days)) && Number(days) >= 1 && Number(days) <= 30 ? Number(days) : INVITE_DAYS;
  assertCanGrantRole(actor.perms, role);
  assertInviteQuota(organizationId, actor.id);
  if (siteId !== null) {
    if (!db.prepare(`SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(db)}`).get(siteId, organizationId)) throw new UserError("Site introuvable.");
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
  const id = Number(db.prepare("INSERT INTO mk_invitations (organization_id, email, role, site_id, token_hash, invited_by, expires_at, invited_name, message) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?), ?, ?)").run(organizationId, mail, role, siteId, tokenHash(token), actor.id, `+${lifetime} days`, invitedName, note).lastInsertRowid);
  audit(organizationId, actor.id, "user.invited", "invitation", id, { email: mail, role, siteId, days: lifetime }, siteId); // jamais le jeton ni le message
  return { added: false, token, email: mail, id, days: lifetime, name: invitedName, message: note };
}
// Nouveau lien pour une invitation (l'ancien cesse de fonctionner)
// scopeSiteId (administrateur local) : seules les invitations de CE site sont visibles et modifiables ; une autre (ou celle de l'équipe) est « introuvable »
const scopeSql = (scopeSiteId) => (scopeSiteId === null || scopeSiteId === undefined ? "" : " AND site_id = ?");
function reissue(organizationId, actor, invitationId, { scopeSiteId = null } = {}) {
  const inv = db.prepare(`SELECT * FROM mk_invitations WHERE id = ? AND organization_id = ? AND accepted_at IS NULL AND revoked_at IS NULL${scopeSql(scopeSiteId)}`).get(...[invitationId, organizationId, ...(scopeSql(scopeSiteId) ? [scopeSiteId] : [])]);
  if (!inv) throw new UserError("Invitation introuvable ou déjà utilisée.");
  assertCanGrantRole(actor.perms, inv.role);
  if (inv.send_count >= MAX_SENDS) throw new UserError(`Cette invitation a déjà été envoyée ${MAX_SENDS} fois : révoquez-la et créez-en une nouvelle si la personne ne l'a pas reçue.`);
  if (inv.last_sent_at && db.prepare("SELECT (julianday('now') - julianday(?)) * 86400 AS s").get(inv.last_sent_at).s < RESEND_COOLDOWN_SECONDS) throw new UserError(`Patientez ${RESEND_COOLDOWN_SECONDS} secondes entre deux envois.`);
  assertInviteQuota(organizationId, actor.id);
  const token = crypto.randomBytes(24).toString("base64url");
  // Nouveau jeton = l'ancien lien cesse de fonctionner (même s'il n'était pas encore expiré) ; l'invitation expirée est ainsi renouvelée
  db.prepare("UPDATE mk_invitations SET token_hash = ?, expires_at = datetime('now', ?) WHERE id = ?").run(tokenHash(token), `+${INVITE_DAYS} days`, invitationId);
  audit(organizationId, actor.id, "user.invited", "invitation", invitationId, { email: inv.email, role: inv.role, resent: true }, inv.site_id);
  return { token, email: inv.email, id: invitationId, name: inv.invited_name, message: inv.message };
}
function revoke(organizationId, actor, invitationId, { scopeSiteId = null } = {}) {
  const info = db.prepare(`UPDATE mk_invitations SET revoked_at = datetime('now') WHERE id = ? AND organization_id = ? AND accepted_at IS NULL AND revoked_at IS NULL${scopeSql(scopeSiteId)}`).run(...[invitationId, organizationId, ...(scopeSql(scopeSiteId) ? [scopeSiteId] : [])]);
  if (!info.changes) throw new UserError("Invitation introuvable ou déjà utilisée.");
  audit(organizationId, actor.id, "invitation.revoked", "invitation", invitationId, {}, scopeSiteId);
}
// État RÉEL de l'envoi du dernier e-mail : queued (en file ou en cours) · sent (remis au serveur d'envoi) · failed (refusé ou en échec) · none (jamais envoyé)
// « sent » veut dire que le serveur d'envoi a accepté le message — jamais que la personne l'a lu ni reçu dans sa boîte.
function recordDelivery(invitationId, queued) {
  if (queued && queued.queued) db.prepare("UPDATE mk_invitations SET mail_id = ?, send_error = '', send_count = send_count + 1, last_sent_at = datetime('now') WHERE id = ?").run(queued.id, invitationId);
  else db.prepare("UPDATE mk_invitations SET mail_id = NULL, send_error = ?, send_count = send_count + 1, last_sent_at = datetime('now') WHERE id = ?").run(queued && queued.reason === "invalid_recipient" ? "adresse refusée" : "e-mail non mis en file", invitationId);
}
// Liste filtrée : recherche (e-mail, nom), état de l'invitation, rôle, site ; pagination. scopeSiteId = administrateur local (CE site seulement).
const DELIVERY_SQL = `CASE WHEN i.mail_id IS NULL THEN (CASE WHEN i.send_error <> '' THEN 'failed' ELSE 'none' END) WHEN o.status IN ('pending', 'sending') THEN 'queued' WHEN o.status = 'sent' THEN 'sent' WHEN o.id IS NULL THEN 'none' ELSE 'failed' END`;
const STATE_SQL = "CASE WHEN i.accepted_at IS NOT NULL THEN 'accepted' WHEN i.revoked_at IS NOT NULL THEN 'revoked' WHEN i.expires_at <= datetime('now') THEN 'expired' ELSE 'pending' END";
function listInvitations(organizationId, { scopeSiteId = null, q = "", state = "", role = "", siteId = null, page = 1, perPage = 25 } = {}) {
  require("../utils/outbox").ensureTable(db);
  const where = ["i.organization_id = ?"], args = [organizationId];
  if (scopeSiteId !== null) { where.push("i.site_id = ?"); args.push(scopeSiteId); }
  else if (Number.isInteger(siteId)) { where.push("i.site_id = ?"); args.push(siteId); }
  if (q) { where.push("(i.email LIKE ? ESCAPE '\\' OR i.invited_name LIKE ? ESCAPE '\\')"); args.push(like(q), like(q)); }
  if (role) { where.push("i.role = ?"); args.push(role); }
  const base = `FROM mk_invitations i LEFT JOIN mk_sites s ON s.id = i.site_id LEFT JOIN users u ON u.id = i.invited_by LEFT JOIN mail_outbox o ON o.id = i.mail_id WHERE ${where.join(" AND ")}`;
  const counts = Object.fromEntries(["pending", "accepted", "expired", "revoked"].map((k) => [k, 0]));
  for (const r of db.prepare(`SELECT ${STATE_SQL} AS state, COUNT(*) n ${base} GROUP BY 1`).all(...args)) counts[r.state] = r.n;
  const filter = ["pending", "accepted", "expired", "revoked"].includes(state) ? ` AND ${STATE_SQL} = '${state}'` : "";
  const total = db.prepare(`SELECT COUNT(*) n ${base}${filter}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), pages);
  const rows = db.prepare(`SELECT i.id, i.email, i.invited_name, i.message, i.role, i.site_id, s.name AS site_name, i.created_at, i.expires_at, i.accepted_at, i.revoked_at, i.send_count, i.last_sent_at, i.send_error, u.username AS invited_by_name,
      ${STATE_SQL} AS state, ${DELIVERY_SQL} AS delivery, COALESCE(NULLIF(o.last_error, ''), i.send_error) AS delivery_error
    ${base}${filter} ORDER BY i.id DESC LIMIT ? OFFSET ?`).all(...args, perPage, (current - 1) * perPage);
  return { rows, total, page: current, pages, counts };
}
function invitationByToken(token) {
  return db.prepare("SELECT * FROM mk_invitations WHERE token_hash = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > datetime('now')").get(tokenHash(token)) || null;
}
// Acceptation ATOMIQUE : (création du compte,) accès accordé et état « acceptée » sont écrits ensemble ou pas du tout. Le jeton se « consomme » par une écriture conditionnelle
// (deux envois simultanés du même lien : un seul réussit). À l'acceptation on revérifie ce qui a pu changer depuis l'envoi : l'invitation est toujours valable, le rôle existe encore
// et la personne qui l'a envoyée a encore tous les droits de ce rôle (jamais plus que ce qui a été approuvé) ; sinon rien n'est accordé.
// `account` : identifiant d'un compte existant, OU fonction qui crée le compte et renvoie son identifiant (exécutée dans la même transaction).
function acceptInvitation(inv, account) {
  let userId = null;
  transaction(db, () => {
    const live = db.prepare("SELECT * FROM mk_invitations WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > datetime('now')").get(inv.id);
    if (!live) throw new UserError("Cette invitation n'est plus valable (expirée, déjà utilisée ou révoquée). Demandez-en une nouvelle.");
    const role = getRole(live.role);
    if (!role) throw new UserError("Le rôle de cette invitation n'existe plus : demandez-en une nouvelle.");
    if (live.invited_by) {
      const inviter = effectivePermissions(live.invited_by, { organizationId: live.organization_id, siteId: live.site_id });
      if (!subset(role.permissions, inviter)) throw new UserError("Cette invitation n'est plus valable : la personne qui l'a envoyée ne peut plus accorder ce rôle. Demandez-en une nouvelle.");
    }
    if (live.site_id && !db.prepare(`SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ? AND status = 'active'${primarySite.excludeSql(db)}`).get(live.site_id, live.organization_id)) throw new UserError("Le site de cette invitation n'est plus disponible.");
    userId = typeof account === "function" ? account() : account;
    const claim = db.prepare("UPDATE mk_invitations SET accepted_at = datetime('now'), accepted_user_id = ? WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL").run(userId, live.id);
    if (claim.changes !== 1) throw new UserError("Cette invitation vient d'être utilisée.");
    if (live.site_id) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role, created_by) VALUES (?, ?, ?, ?) ON CONFLICT (site_id, user_id) DO UPDATE SET role = excluded.role").run(live.site_id, userId, live.role, live.invited_by);
    else db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?) ON CONFLICT (organization_id, user_id) DO UPDATE SET role = excluded.role").run(live.organization_id, userId, live.role);
  });
  audit(inv.organization_id, userId, "invitation.accepted", "invitation", inv.id, { role: inv.role, siteId: inv.site_id }, inv.site_id);
  return userId;
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
  GROUPS, LABELS, ACTIONS, OWNER_ONLY, ASSIGNABLE, SYSTEM_ROLES, INVITE_DAYS, INVITE_MAX_PER_HOUR, RESEND_COOLDOWN_SECONDS, MAX_SENDS, recordDelivery,
  getRole, allRoles, customRoles, invalidate, cacheInfo, permissionsOf, membershipOf, siteRoleOf, siteMemberships, effectivePermissions, can, subset,
  assertCanGrantRole, assertNotLastOwner, assertCanManage, createRole, updateRole, deleteRole, roleUsage, listMembers, statusCounts, memberDetail,
  listSiteMembers, siteStatusCounts, siteRoleCounts, siteMemberDetail, setOrgRole, setStatus, removeFromTeam, setSiteRole, setSiteMode, SITE_MODES, removeSiteRole, invite, reissue, revoke, listInvitations, invitationByToken, acceptInvitation, matrix, activeOwners,
};
