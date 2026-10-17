// Visibilité des éléments par site (R4) : UN mécanisme central pour que les écrans de liste, les réponses JSON et les exports d'une personne de l'équipe
// ne montrent pas les éléments d'un site dont son rôle sur ce site ne lui accorde pas la LECTURE (par exemple un plafond de droits, R3).
//
//   hiddenSites(...)  → liste des sites dont la personne ne peut pas lire les éléments de cet écran (permission de lecture de la famille de l'écran) ;
//   attach(req, permission) → pose `ctx.hiddenSites` sur le contexte de la requête (appelé par need(), donc pour chaque route protégée par une permission).
//
// Les modules appliquent ensuite `ctx.hiddenSites` par les mêmes fonctions qu'ils utilisent déjà pour la portée de site (siteSql, dépôt de données, requêtes de pages,
// analytics) : aucune seconde mécanique. Les droits sont ceux de `cmsAccess.effectivePermissions` (la seule porte d'entrée des droits) : ce module ne décide
// donc de rien par lui-même et suit automatiquement tout changement du calcul des droits (plafond de R3 compris).
//
// Comportement historique PRÉSERVÉ : sans affectation de site, ou quand les droits sur le site égalent ou dépassent ceux de l'équipe (union historique), la liste
// des sites cachés est VIDE et rien ne change. Un accès limité à un site (siteScope) est déjà restreint à son site : il n'est pas concerné.

// Famille de permission → permission de LECTURE qui décide de la visibilité des éléments (liste fermée : seules les familles dont R4 filtre les listes).
// « lists.write » et « lists.read » relèvent de « lists » → « lists.read » ; une famille inconnue n'est PAS filtrée (comportement historique).
const READ_OF = Object.freeze({
  lists: "lists.read", segments: "segments.read", templates: "templates.read", campaigns: "campaigns.read", automations: "automations.read",
  analytics: "analytics.read", funnels: "funnels.read", forms: "forms.read", pages: "forms.read", tools: "tools.view",
});
function readPermissionOf(permission) {
  if (typeof permission !== "string") return null;
  const family = permission.split(".")[0];
  return Object.hasOwn(READ_OF, family) ? READ_OF[family] : null;
}

// → number[] (identifiants de sites). `effective` est injectable pour les tests ; par défaut, cmsAccess.effectivePermissions.
function hiddenSites({ db, organizationId, userId, permission, effective } = {}) {
  const read = readPermissionOf(permission);
  if (!read || !Number.isInteger(userId) || !Number.isInteger(organizationId)) return [];
  // Chemin rapide : sans aucune affectation de site, les droits sur un site sont ceux de l'équipe (déjà vérifiés par la route) : rien n'est caché
  const hasSiteRows = db.prepare("SELECT 1 FROM mk_site_members WHERE user_id = ? LIMIT 1").get(userId);
  if (!hasSiteRows) return [];
  const perms = effective || require("../services/cmsAccess").effectivePermissions;
  const hidden = [];
  for (const { id } of db.prepare("SELECT id FROM mk_sites WHERE organization_id = ? ORDER BY id").all(organizationId)) {
    if (!perms(userId, { organizationId, siteId: id }).has(read)) hidden.push(id);
  }
  return hidden;
}

// Pose la liste sur le contexte de la requête (équipe de l'organisation seulement : un accès limité à un site est déjà restreint par siteScope)
function attach(req, permission, { effective } = {}) {
  const mk = req.mk;
  if (!mk || !mk.ctx || mk.siteOnly) return;
  const ctx = mk.ctx;
  const hidden = hiddenSites({ db: ctx.db, organizationId: ctx.organizationId, userId: ctx.userId, permission, effective });
  if (hidden.length) ctx.hiddenSites = hidden; else delete ctx.hiddenSites;
}

// Fragment SQL « l'élément (colonne `expr`) n'est pas dans un site caché » ; `expr` est une expression écrite par le code appelant, jamais une valeur de la requête
function notHiddenSql(hidden, expr) {
  if (!Array.isArray(hidden) || !hidden.length) return { sql: "1 = 1", params: [] };
  const ids = hidden.filter((n) => Number.isInteger(n));
  if (!ids.length) return { sql: "1 = 1", params: [] };
  return { sql: `(${expr} IS NULL OR ${expr} NOT IN (${ids.map(() => "?").join(",")}))`, params: ids };
}

module.exports = { readPermissionOf, hiddenSites, attach, notHiddenSql };
