// Organisations, membres et permissions. KOLAKISA est la première (et pour l'instant la seule) organisation ;
// toutes les données marketing portent pourtant un organization_id pour pouvoir en accueillir d'autres plus tard.

const ROLE_ORDER = { viewer: 1, editor: 2, admin: 3, owner: 4 };

// Permission → rôle minimal. Une permission absente de cette liste est REFUSÉE à tout le monde.
const PERMISSIONS = Object.freeze({
  "contacts.read": "viewer", "contacts.write": "editor", "contacts.delete": "admin", "contacts.import": "editor", "contacts.export": "admin",
  // Contact Core (palier 15) : archiver = éditeur ; fusionner deux fiches = administrateur ; gérer les champs personnalisés = éditeur ; voir téléphone, e-mail complet et preuves = lecteur (retirable à un rôle personnalisé) ; journal d'événements = lecteur
  "contacts.archive": "editor", "contacts.merge": "admin", "contacts.requests": "owner", "sites.modules": "admin", "sites.domains": "admin", "contacts.manage_fields": "editor", "contacts.view_sensitive": "viewer", "events.view": "viewer",
  "compliance.read": "viewer", "compliance.manage": "admin",
  "lists.read": "viewer", "lists.write": "editor",
  "segments.read": "viewer", "segments.write": "editor",
  "templates.read": "viewer", "templates.write": "editor",
  "campaigns.read": "viewer", "campaigns.write": "editor", "campaigns.send": "admin",
  "automations.read": "viewer", "automations.write": "editor", "automations.activate": "admin",
  "forms.read": "viewer", "forms.write": "editor",
  // Tunnels (palier 18) : voir = lecteur ; construire (étapes, pages associées, réglages) = éditeur. Modifier le CONTENU d'une page reste « forms.write », mettre en ligne « pages.publish » : on peut gérer un tunnel sans pouvoir éditer ses pages, et inversement.
  "funnels.read": "viewer", "funnels.write": "editor", "pages.code": "admin",
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
  // Historique, restauration et corbeille (palier 10) : voir l'historique et restaurer une ancienne version = éditeur ; supprimer des versions de l'historique = administrateur
  "revisions.view": "editor", "revisions.restore": "editor", "revisions.delete": "admin",
  // Référencement (palier 11) : voir l'analyse et l'aperçu SEO = éditeur ; modifier les réglages SEO (page, site) = éditeur (retirable à un rôle personnalisé)
  "seo.view": "editor", "seo.edit": "editor",
  // Adresses et redirections (palier 12) : voir, créer et modifier une redirection vers une adresse du site = éditeur ; supprimer et rediriger vers un site extérieur = administrateur
  // Outils (palier 13) : voir les outils et lancer l'analyse de santé = éditeur ; exporter, importer, mettre à jour l'existant, maintenance, outils de contenu et cache = administrateur
  "tools.view": "editor", "tools.health": "editor", "tools.export": "admin", "tools.import": "admin", "tools.overwrite": "admin", "tools.maintenance": "admin", "tools.content": "admin", "tools.cache": "admin",
  // Effacement de données personnelles : voir, demander et traiter = administrateur ; forcer sans confirmation de la personne = propriétaire
  "privacy.view": "admin", "privacy.request": "admin", "privacy.erase": "admin", "privacy.force": "owner",
  // Admin Notes (notes internes du site) : droits distincts, administrateur
  "notes.view": "admin", "notes.create": "admin", "notes.edit": "admin", "notes.delete": "admin",
  "redirects.view": "editor", "redirects.create": "editor", "redirects.edit": "editor", "redirects.delete": "admin", "redirects.external": "admin",
  "articles.read": "viewer", "articles.write": "editor", "articles.publish": "editor", "articles.delete": "admin",
  "media.read": "viewer", "media.upload": "editor", "media.write": "editor", "media.delete": "admin",
  "analytics.read": "viewer",
  "settings.read": "admin", "settings.write": "admin", "settings.sensitive": "admin", // réglages sensibles (domaine, indexation, page d'accueil, adresses) : retirables à un rôle personnalisé
 
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
