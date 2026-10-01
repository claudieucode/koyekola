// Organisations, membres et permissions. KOYEKOLA est la première (et pour l'instant la seule) organisation ;
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
  "forms.read": "viewer", "forms.write": "editor",
  "analytics.read": "viewer",
  "settings.read": "admin", "settings.write": "admin",
  "api_keys.manage": "admin", "webhooks.manage": "admin", "domains.manage": "admin",
  "audit.read": "admin", "queue.manage": "admin",
  "members.manage": "owner", "organization.delete": "owner",
});

const roleAtLeast = (role, minimum) => Boolean(ROLE_ORDER[role] && ROLE_ORDER[minimum] && ROLE_ORDER[role] >= ROLE_ORDER[minimum]);
const can = (role, permission) => Object.hasOwn(PERMISSIONS, permission) && roleAtLeast(role, PERMISSIONS[permission]);

function ensureDefaultOrganization(db, { name = "KOYEKOLA", slug = "koyekola" } = {}) {
  const existing = db.prepare("SELECT id, name, slug FROM mk_organizations WHERE slug = ?").get(slug);
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
