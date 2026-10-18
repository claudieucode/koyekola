// Transitions UNIQUES de données entre deux versions du modèle d'accès (hors migration SQL : elles ont besoin des droits réels des personnes).
//
// Transition « ai » (R7 lot 6.2, décision 2 option A du 17/10/2026) — préserver l'accès IA qui EXISTAIT avant l'activation par site.
// Avant R7-6.2, le studio de pages IA (`POST /marketing/pages/:id/ia/proposer`, permission `forms.write`) était utilisable par une personne limitée à un site sur les pages de CE site. Preuves dans le code :
//   - admission d'une personne limitée (web/index.js) : aucune appartenance à l'équipe, une ligne mk_site_members sur un site `status = 'active'` (cmsAccess.siteMemberships) ;
//   - droits (cmsAccess.effectivePermissions) : compte actif (users.status) + permissions du rôle SUR LE SITE ; le studio exige `forms.write` ;
//   - un site supprimé ou archivé n'est plus ouvert à ses membres.
// CRITÈRES D'ÉLIGIBILITÉ (tous obligatoires) pour qu'un site reçoive l'activation initiale du module « ai » :
//   1. le site existe, n'est pas supprimé (`deleted_at` nul) et est actif (`status = 'active'`) ;
//   2. il a au moins UNE personne qui n'est PAS de l'équipe de l'organisation (une personne de l'équipe n'est pas soumise à l'activation) ;
//   3. dont le compte est actif (`users.status` actif ou absent) ;
//   4. dont le rôle SUR CE SITE donne `forms.write` (rôle du système avec ce droit, ou rôle personnalisé de la MÊME organisation qui le contient).
// Ce qui n'est PAS une preuve : la seule présence d'un membre (lecteur, auteur, contributeur, compte suspendu, membre de l'équipe), une invitation non acceptée, un site archivé ou supprimé, un site sans membre.
// Limite assumée et documentée : l'historique de consommation n'a pas de site avant R7-6.2 → on établit la CAPACITÉ d'usage (droit réel), pas l'usage effectif ; on n'élargit jamais au-delà.
// Règles : une seule fois (repère dans schema_migrations, scope « transition ») ; INSERT OR IGNORE (ne réactive JAMAIS un module que l'équipe a désactivé, ne touche pas une ligne existante) ;
// jamais pour un site créé après ; aucune permission, aucun quota, aucun secret modifié ; aucune donnée supprimée.
const crypto = require("node:crypto");
const primarySite = require("../services/primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire

const SCOPE = "transition";
const AI = Object.freeze({ version: "086", name: "ia_acces_existants", permission: "forms.write", module: "ai" });
const CRITERIA = [
  "site existant, non supprimé, status = active",
  "au moins une personne hors équipe de l'organisation",
  "compte actif (users.status actif ou colonne absente)",
  `rôle sur le site donnant ${AI.permission} (rôle du système ou rôle personnalisé de la même organisation)`,
];
const checksum = () => crypto.createHash("sha256").update(CRITERIA.join("\n")).digest("hex");

const hasTable = (db, t) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(t));
const hasColumn = (db, t, c) => db.prepare(`PRAGMA table_info("${t}")`).all().some((r) => r.name === c);

// Rôles du système qui donnent la permission (lus dans la définition réelle des rôles, pas recopiés)
function systemRolesWith(permission) {
  const { SYSTEM_ROLES } = require("../services/cmsAccess");
  return new Set(SYSTEM_ROLES.filter((r) => Array.isArray(r.permissions) ? r.permissions.includes(permission) : r.permissions.has(permission)).map((r) => r.key));
}
function customRoleGrants(db, organizationId, key, permission) {
  const row = db.prepare("SELECT permissions FROM mk_roles WHERE organization_id = ? AND key = ?").get(organizationId, key);
  if (!row) return false;
  try { return JSON.parse(row.permissions || "[]").includes(permission); } catch { return false; }
}

// → { eligible: [{ siteId, organizationId, people }], ignored: { archive, supprime, sansMembre, aucunDroit } } (lecture seule)
function aiEligibility(db) {
  const system = systemRolesWith(AI.permission);
  const systemKeys = new Set(require("../services/cmsAccess").SYSTEM_ROLES.map((r) => r.key));
  const userActive = hasTable(db, "users")
    ? (hasColumn(db, "users", "status") ? db.prepare("SELECT 1 FROM users WHERE id = ? AND (status IS NULL OR status = 'active')") : db.prepare("SELECT 1 FROM users WHERE id = ?"))
    : null;
  const isTeam = db.prepare("SELECT 1 FROM mk_org_members WHERE organization_id = ? AND user_id = ?");
  const out = { eligible: [], ignored: { archive: 0, supprime: 0, sansMembre: 0, aucunDroit: 0 } };
  for (const s of db.prepare(`SELECT id, organization_id, status, deleted_at FROM mk_sites WHERE 1 = 1${primarySite.excludeSql(db)} ORDER BY id`).all()) {
    if (s.deleted_at) { out.ignored.supprime += 1; continue; }
    if (s.status !== "active") { out.ignored.archive += 1; continue; }
    const members = db.prepare("SELECT user_id, role FROM mk_site_members WHERE site_id = ?").all(s.id);
    if (!members.length) { out.ignored.sansMembre += 1; continue; }
    const people = members.filter((m) => !isTeam.get(s.organization_id, m.user_id) && (!userActive || userActive.get(m.user_id))
      && (systemKeys.has(m.role) ? system.has(m.role) : customRoleGrants(db, s.organization_id, m.role, AI.permission))).length;
    if (people) out.eligible.push({ siteId: s.id, organizationId: s.organization_id, people }); else out.ignored.aucunDroit += 1;
  }
  return out;
}

// Aperçu DÉTAILLÉ (lecture seule) : une ligne par site avec la décision et la raison, et le compte des motifs d'exclusion des membres. Mêmes critères que aiEligibility (testé : mêmes sites retenus).
function aiEligibilityDetail(db) {
  const system = systemRolesWith(AI.permission);
  const systemKeys = new Set(require("../services/cmsAccess").SYSTEM_ROLES.map((r) => r.key));
  const userActive = hasTable(db, "users")
    ? (hasColumn(db, "users", "status") ? db.prepare("SELECT 1 FROM users WHERE id = ? AND (status IS NULL OR status = 'active')") : db.prepare("SELECT 1 FROM users WHERE id = ?"))
    : null;
  const isTeam = db.prepare("SELECT 1 FROM mk_org_members WHERE organization_id = ? AND user_id = ?");
  const already = db.prepare("SELECT enabled FROM mk_site_modules WHERE site_id = ? AND module = ?");
  return db.prepare(`SELECT id, organization_id, name, status, deleted_at FROM mk_sites WHERE 1 = 1${primarySite.excludeSql(db)} ORDER BY id`).all().map((s) => {
    const base = { siteId: s.id, organizationId: s.organization_id, name: s.name, people: 0, memberReasons: {} };
    const row = already.get(s.id, AI.module);
    if (s.deleted_at) return { ...base, decision: "exclu", reason: "site supprimé" };
    if (s.status !== "active") return { ...base, decision: "exclu", reason: `site non actif (${s.status})` };
    const members = db.prepare("SELECT user_id, role FROM mk_site_members WHERE site_id = ?").all(s.id);
    if (!members.length) return { ...base, decision: "exclu", reason: "aucun membre" };
    const why = {};
    let people = 0;
    for (const m of members) {
      let motif = null;
      if (isTeam.get(s.organization_id, m.user_id)) motif = "membre de l'équipe (non soumis à l'activation)";
      else if (userActive && !userActive.get(m.user_id)) motif = "compte non actif";
      else if (!(systemKeys.has(m.role) ? system.has(m.role) : customRoleGrants(db, s.organization_id, m.role, AI.permission))) motif = `rôle « ${m.role} » sans ${AI.permission}`;
      if (motif) why[motif] = (why[motif] || 0) + 1; else people += 1;
    }
    if (!people) return { ...base, decision: "exclu", reason: "aucun membre avec accès réel au studio IA", memberReasons: why };
    return { ...base, people, memberReasons: why, decision: "inclus", reason: `${people} personne(s) hors équipe, compte actif, ${AI.permission}`, alreadyRow: row ? (row.enabled ? "déjà activé" : "désactivé volontairement : ne sera pas réactivé") : null };
  });
}

// Exécute la transition « ai » UNE fois. → { done: true, enabled: n } ou { done: false, reason }
function runAiOnce(db, { log = console } = {}) {
  if (!hasTable(db, "schema_migrations") || !hasTable(db, "mk_site_modules") || !hasTable(db, "mk_sites")) return { done: false, reason: "schéma incomplet" };
  if (db.prepare("SELECT 1 FROM schema_migrations WHERE scope = ? AND version = ?").get(SCOPE, AI.version)) return { done: false, reason: "déjà exécutée" };
  db.exec("BEGIN IMMEDIATE");
  try {
    if (db.prepare("SELECT 1 FROM schema_migrations WHERE scope = ? AND version = ?").get(SCOPE, AI.version)) { db.exec("ROLLBACK"); return { done: false, reason: "déjà exécutée" }; }
    const { eligible } = aiEligibility(db);
    const ins = db.prepare("INSERT OR IGNORE INTO mk_site_modules (site_id, organization_id, module, enabled) VALUES (?, ?, ?, 1)");
    let enabled = 0;
    for (const s of eligible) enabled += ins.run(s.siteId, s.organizationId, AI.module).changes;
    db.prepare("INSERT INTO schema_migrations (scope, version, name, checksum) VALUES (?, ?, ?, ?)").run(SCOPE, AI.version, AI.name, checksum());
    db.exec("COMMIT");
    log.info?.(`[KOLAKISA] Transition IA : module « ai » conservé pour ${enabled} site(s) qui utilisaient déjà le studio de pages IA.`);
    return { done: true, enabled };
  } catch (error) { try { db.exec("ROLLBACK"); } catch { /* déjà annulé */ } throw error; }
}
module.exports = { SCOPE, AI, CRITERIA, aiEligibility, aiEligibilityDetail, runAiOnce };
