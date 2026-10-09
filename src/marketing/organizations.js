// Organisations, membres et permissions. KOLAKISA est la première (et pour l'instant la seule) organisation ;
// toutes les données marketing portent pourtant un organization_id pour pouvoir en accueillir d'autres plus tard.

const ROLE_ORDER = { viewer: 1, editor: 2, admin: 3, owner: 4 };

// Permission → rôle minimal. Une permission absente de cette liste est REFUSÉE à tout le monde.
const PERMISSIONS = Object.freeze({
  "contacts.read": "viewer", "contacts.write": "editor", "contacts.delete": "admin", "contacts.import": "editor", "contacts.export": "admin",
  "compliance.read": "viewer", "compliance.manage": "admin",
  "lists.read": "viewer", "lists.write": "editor",
  "segments.read": "viewer", "segments.write": "editor",
  "templates.read": "viewer", "templates.write": "editor",
  "campaigns.read": "viewer", "campaigns.write": "editor", "campaigns.send": "admin",
  "automations.read": "viewer", "automations.write": "editor", "automations.activate": "admin",
  "forms.read": "viewer", "forms.write": "editor", "pages.code": "admin",
  // Pages du CMS : publier = éditeur (comme avant) ; suppression DÉFINITIVE (depuis la corbeille) = administrateur
  "pages.publish": "editor", "pages.delete": "admin",
  // Médias du CMS : voir = lecteur ; envoyer, modifier, mettre à la corbeille = éditeur ; supprimer définitivement = administrateur
  "taxonomies.read": "viewer", "taxonomies.write": "editor", "taxonomies.delete": "admin",
  // Commentaires : voir = lecteur ; modérer (approuver, indésirable, corbeille, répondre) = éditeur ; suppression définitive et e-mails des invités = administrateur
  "comments.read": "viewer", "comments.moderate": "editor", "comments.delete": "admin", "comments.email": "admin",
  // Navigation : voir = lecteur ; créer/modifier menus et éléments = éditeur ; affecter un menu à un emplacement (publier) et supprimer un menu = administrateur
  "navigation.read": "viewer", "navigation.write": "editor", "navigation.publish": "admin", "navigation.delete": "admin",
  // Apparence : voir = lecteur ; styles, en-tête/pied de page, modèles, patterns = éditeur ; publier l'apparence sur le site = administrateur
  "appearance.read": "viewer", "appearance.styles": "editor", "appearance.parts": "editor", "appearance.templates": "editor", "appearance.patterns": "editor", "appearance.publish": "admin",
  // Utilisateurs et rôles (palier 9) : voir l'équipe = éditeur ; inviter, modifier, retirer, attribuer des rôles, créer des rôles = administrateur (garde-fous : jamais plus de droits que soi)
  "users.view": "editor", "users.create": "admin", "users.edit": "admin", "users.delete": "admin", "users.manage_roles": "admin", "roles.manage": "admin",
  // Gérer ses propres articles (rôles Auteur / Contributeur) ; « articles.write » reste le droit sur TOUS les articles
  "articles.edit_own": "editor",
  "articles.read": "viewer", "articles.write": "editor", "articles.publish": "editor", "articles.delete": "admin",
  "media.read": "viewer", "media.upload": "editor", "media.write": "editor", "media.delete": "admin",
  "analytics.read": "viewer",
  "settings.read": "admin", "settings.write": "admin",
  "api_keys.manage": "admin", "webhooks.manage": "admin", "domains.manage": "admin",
  "audit.read": "admin", "queue.manage": "admin",
  "members.manage": "owner", "organization.delete": "owner",
});

const roleAtLeast = (role, minimum) => Boolean(ROLE_ORDER[role] && ROLE_ORDER[minimum] && ROLE_ORDER[role] >= ROLE_ORDER[minimum]);
const can = (role, permission) => Object.hasOwn(PERMISSIONS, permission) && roleAtLeast(role, PERMISSIONS[permission]);

function ensureDefaultOrganization(db, { name = "KOLAKISA", slug = "koyekola" } = {}) {
  const existing = db.prepare("SELECT id, name, slug FROM mk_organizations WHERE slug = ?").get(slug);
  // Le site s'appelle désormais KOLAKISA : l'ancien nom par défaut est renommé (un nom choisi à la main n'est jamais touché)
  if (existing && existing.name === "KOYE" + "KOLA" && name !== existing.name) {
    db.prepare("UPDATE mk_organizations SET name = ? WHERE id = ?").run(name, existing.id);
    return { ...existing, name };
  }
  if (existing) return existing;
  const info = db.prepare("INSERT INTO mk_organizations (name, slug) VALUES (?, ?)").run(name, slug);
  return { id: Number(info.lastInsertRowid), name, slug };
}

// Les formateurs du LMS deviennent propriétaires de l'organisation. Un rôle déjà attribué n'est jamais modifié.
function syncInstructorMembers(db, organizationId) {
  db.prepare("INSERT OR IGNORE INTO mk_org_members (organization_id, user_id, role) SELECT ?, id, 'owner' FROM users WHERE role = 'formateur'").run(organizationId);
}

function membershipsOf(db, userId) {
  return db
    .prepare(
      `SELECT m.organization_id, m.role, o.name, o.slug FROM mk_org_members m
       JOIN mk_organizations o ON o.id = m.organization_id
       WHERE m.user_id = ? AND o.status = 'active' ORDER BY m.organization_id`
    )
    .all(userId);
}

module.exports = { ROLE_ORDER, PERMISSIONS, roleAtLeast, can, ensureDefaultOrganization, syncInstructorMembers, membershipsOf };
