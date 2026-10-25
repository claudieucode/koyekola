// Journal d'activité (lecture) : modèle de lecture de `mk_audit_logs` — l'écriture reste dans ./audit.js (écriture seule, déclencheurs de la migration 001).
//  - Rien n'est inventé : le niveau, la catégorie et le libellé sont DÉDUITS du nom de l'action (règles ci-dessous, documentées dans docs/KOLAKISA_JOURNAL_ACTIVITE.md) ;
//    ils ne sont pas stockés. Un acteur inconnu est dit inconnu ; un compte supprimé est dit supprimé (jamais « Système » par défaut).
//  - Toute lecture passe par la politique de portée de ./audit.js (scopeSql) : un accès limité à un site ne lit que ce site, quelles que soient les valeurs d'adresse.
//  - Les métadonnées sont REMASQUÉES à la lecture (défense en profondeur pour d'anciennes lignes) et jamais affichées en JSON brut.
const { redact, scopeSql, validSite } = require("./audit");
const common = require("../services/gestion/common");

const PER_PAGE = 50;
const EXPORT_MAX = 5000;

// Libellés : « ressource » puis « verbe » (repli lisible pour toute action non listée)
const RESOURCE = {
  auth: "Connexion", user: "Compte", users: "Comptes", role: "Rôle", site: "Site", site_access: "Accès au site", site_module: "Extension du site", settings: "Réglages", profile: "Profil",
  landing: "Page", page: "Page", page_test: "Test de page", page_template: "Modèle de page", pattern: "Motif", saved_block: "Bloc enregistré", template: "Modèle d'e-mail", form: "Formulaire",
  campaign: "Campagne e-mail", sms_campaign: "Campagne SMS", sms: "SMS", sending: "Envoi d'e-mails", list: "Liste", segment: "Segment", contact: "Contact", contacts: "Contacts",
  automation: "Automatisation", webhook: "Webhook", api_key: "Clé d'API", media: "Média", menu: "Menu", widgets: "Widgets", theme: "Thème", font: "Police", comment: "Commentaire",
  course: "Formation", offer: "Offre", coupon: "Code promo", certificate: "Certificat", quiz: "Quiz", order: "Commande", category: "Catégorie", tag: "Étiquette", import: "Import",
  tools: "Outils", invitation: "Invitation", funnel: "Tunnel", survey: "Sondage", social: "Réseaux sociaux", rss: "Flux RSS", scoring: "Score", report: "Rapport", organization: "Organisation",
  audit: "Journal d'activité", content: "Contenu", suppression: "Liste de suppression", sms_suppression: "Liste de suppression SMS", property: "Propriété", preference_category: "Catégorie de préférences",
};
const VERB = {
  created: "créé", updated: "modifié", deleted: "supprimé", saved: "enregistré", restored: "restauré", archived: "archivé", enabled: "activé", disabled: "désactivé", published: "publié",
  unpublished: "dépublié", renamed: "renommé", duplicated: "dupliqué", imported: "importé", exported: "exporté", sent: "envoyé", test_sent: "envoi de test", paused: "mis en pause",
  resumed: "repris", started: "démarré", finished: "terminé", cancelled: "annulé", invited: "invité", removed: "retiré", revoked: "révoqué", granted: "accordé", added: "ajouté",
  trashed: "mis à la corbeille", purged: "supprimé définitivement", moved: "déplacé", scheduled: "planifié", installed: "installé", activated: "activé", reverted: "rétabli", uploaded: "téléversé",
  login: "connexion réussie", logout: "déconnexion", login_failed: "échec de connexion", login_refused: "connexion refusée (compte suspendu)", password_changed: "mot de passe modifié",
  role_changed: "rôle modifié", status_changed: "statut modifié", account_created: "compte créé", mode_changed: "mode modifié", out_of_scope: "accès refusé hors périmètre",
  sessions_revoked: "sessions fermées", email_requested: "changement d'e-mail demandé", price_changed: "prix modifié", secret_revealed: "secret affiché", privacy_download: "archive de données téléchargée",
  privacy_confirm: "effacement confirmé", exported_csv: "export CSV", accepted: "acceptée", failed: "échec", blocked: "bloqué", assigned: "affecté", shared: "partagé", merged: "fusionné", run: "exécuté",
};
const ACTION_LABEL = {
  "auth.login": "Connexion réussie", "auth.logout": "Déconnexion", "auth.login_failed": "Échec de connexion", "auth.login_refused": "Connexion refusée : compte suspendu",
  "audit.exported": "Export du journal d'activité", "api_key.out_of_scope": "Clé d'API : accès refusé hors de son périmètre", "user.role_changed": "Rôle d'un compte modifié",
  "user.removed": "Compte retiré de l'équipe", "user.account_created": "Compte créé", "profile.password_changed": "Mot de passe modifié", "profile.sessions_revoked": "Sessions fermées",
};
const humanize = (s) => String(s).replace(/_/g, " ");
const labelOf = (action) => {
  if (ACTION_LABEL[action]) return ACTION_LABEL[action];
  const [res, verb] = String(action).split(".");
  const noun = RESOURCE[res] || humanize(res), v = VERB[verb] || humanize(verb || "");
  return `${noun} : ${v}`;
};
const categoryOf = (action) => String(action).split(".")[0];
const categoryLabel = (key) => RESOURCE[key] || humanize(key);

// Niveaux déduits (voir la doc) : « alert » = échec, refus ou tentative hors périmètre ; « sensitive » = droits, accès, secrets, sites, connexions de comptes ; sinon « normal »
const ALERT = /^(auth\.login_failed|auth\.login_refused|api_key\.out_of_scope|.+\.(failed|blocked|schedule_failed))$/;
const SENSITIVE = /^(role\.|user\.(role_changed|removed|status_changed|account_created)|site_access\.|site\.(deleted|archived|undeleted|restored)|site_module\.|webhook\.|api_key\.|profile\.(password_changed|email_requested|sessions_revoked)|settings\.|theme\.(activated|installed|removed|file_saved)|tools\.privacy_|invitation\.|auth\.login$|audit\.exported)/;
const LEVELS = { alert: { label: "Alerte", hint: "Échec, refus ou tentative hors périmètre", icon: "alertTriangle" }, sensitive: { label: "Sensible", hint: "Droits, accès, secrets ou configuration", icon: "shield" }, normal: { label: "Courant", hint: "Opération ordinaire", icon: "check" } };
const levelOf = (action) => (ALERT.test(action) ? "alert" : SENSITIVE.test(action) ? "sensitive" : "normal");

// Métadonnées → lignes « libellé : valeur » lisibles (jamais d'objet imbriqué brut, valeurs tronquées)
const META_LABEL = { ip: "Empreinte réseau (non réversible)", account: "Empreinte du compte saisi (non réversible)", status: "Statut du compte", name: "Nom", title: "Titre", slug: "Adresse", role: "Rôle", reason: "Motif", count: "Nombre", rows: "Lignes", filters: "Filtres" };
function metaLines(raw) {
  let m; try { m = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return [{ k: "Métadonnées", v: "illisibles" }]; }
  const safe = redact(m && typeof m === "object" ? m : {});
  const flat = (v) => (v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v).slice(0, 300) : String(v).slice(0, 300));
  return Object.entries(safe).slice(0, 40).map(([k, v]) => ({ k: META_LABEL[k] || humanize(k), v: flat(v), masked: v === "[masqué]" }));
}

// Filtres validés : tout ce qui n'est pas reconnu est ignoré (jamais concaténé en SQL)
function normalize(query = {}) {
  const q = String(query.q || "").replace(/\s+/g, " ").trim().slice(0, 80);
  const level = LEVELS[query.niveau] ? query.niveau : "";
  const category = /^[a-z_]{1,30}$/.test(String(query.categorie || "")) ? String(query.categorie) : "";
  const actor = /^\d{1,12}$/.test(String(query.acteur || "")) ? Number(query.acteur) : null;
  const site = query.site === "principal" ? "principal" : /^\d{1,12}$/.test(String(query.site || "")) ? Number(query.site) : null;
  const du = common.isYmd(query.du) ? query.du : "", au = common.isYmd(query.au) ? query.au : "";
  const page = common.page(query);
  const size = [25, 50, 100].includes(Number(query.taille)) ? Number(query.taille) : PER_PAGE;
  return { q, level, category, actor, site, du, au, page, size };
}
// Chaîne d'adresse des filtres (conservée vers le détail et au retour)
function toQuery(f, extra = {}) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q); if (f.level) p.set("niveau", f.level); if (f.category) p.set("categorie", f.category); if (f.actor) p.set("acteur", f.actor);
  if (f.site !== null && f.site !== undefined && f.site !== "") p.set("site", f.site); if (f.du) p.set("du", f.du); if (f.au) p.set("au", f.au);
  if (f.size && f.size !== PER_PAGE) p.set("taille", f.size);
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
  return p.toString();
}

// Les mêmes règles que ALERT / SENSITIVE ci-dessus, en SQL (le filtre agit sur toute la base, pas sur la page affichée)
const ALERT_SQL = "(l.action IN ('auth.login_failed','auth.login_refused','api_key.out_of_scope') OR l.action LIKE '%.failed' OR l.action LIKE '%.blocked' OR l.action LIKE '%.schedule_failed')";
const SENSITIVE_SQL = "l.action LIKE 'role.%' OR l.action IN ('user.role_changed','user.removed','user.status_changed','user.account_created','site.deleted','site.archived','site.undeleted','site.restored','profile.password_changed','profile.email_requested','profile.sessions_revoked','auth.login','audit.exported','theme.activated','theme.installed','theme.removed','theme.file_saved') OR l.action LIKE 'site_access.%' OR l.action LIKE 'site_module.%' OR l.action LIKE 'webhook.%' OR l.action LIKE 'api_key.%' OR l.action LIKE 'settings.%' OR l.action LIKE 'tools.privacy_%' OR l.action LIKE 'invitation.%'";
function whereOf(ctx, f) {
  const where = ["l.organization_id = ?"], args = [ctx.organizationId];
  const s = scopeSql({ siteScope: ctx.siteScope }, "l"); // portée imposée par le serveur ; le filtre de site de l'URL ne s'applique qu'à l'équipe, ci-dessous
  where.push(s.sql); args.push(...s.params);
  const limited = ctx.siteScope !== undefined && ctx.siteScope !== null;
  if (!limited && f.site === "principal") where.push("l.site_id IS NULL");
  else if (!limited && Number.isInteger(f.site) && validSite(ctx.db, ctx.organizationId, f.site)) { where.push("l.site_id = ?"); args.push(f.site); }
  if (f.category) { where.push("l.action LIKE ? ESCAPE '\\'"); args.push(`${f.category}.%`); }
  if (f.actor) { where.push("l.user_id = ?"); args.push(f.actor); }
  if (f.du) { where.push("l.created_at >= ?"); args.push(common.sqlUtc(common.parisDayStart(f.du))); }
  if (f.au) { where.push("l.created_at < ?"); args.push(common.sqlUtc(common.parisDayStart(common.addDays(f.au, 1)))); }
  if (f.level === "alert") where.push(ALERT_SQL);
  else if (f.level === "sensitive") where.push(`(${SENSITIVE_SQL}) AND NOT (${ALERT_SQL})`);
  else if (f.level === "normal") where.push(`NOT (${SENSITIVE_SQL}) AND NOT (${ALERT_SQL})`);
  const text = f.q.replace(/^#/, "");
  if (f.q) {
    const like = `%${f.q.replace(/[\\%_]/g, "\\$&")}%`;
    where.push("(l.action LIKE ? ESCAPE '\\' OR l.resource_type LIKE ? ESCAPE '\\' OR l.resource_id = ? OR u.username LIKE ? ESCAPE '\\' OR CAST(l.id AS TEXT) = ?)");
    args.push(like, like, text, like, text);
  }
  return { sql: where.join(" AND "), args };
}

const SELECT = `SELECT l.id, l.created_at, l.action, l.resource_type, l.resource_id, l.metadata, l.site_id, l.user_id, u.username AS username, s.name AS site_name
  FROM mk_audit_logs l LEFT JOIN users u ON u.id = l.user_id LEFT JOIN mk_sites s ON s.id = l.site_id AND s.organization_id = l.organization_id`;

function present(r) {
  const level = levelOf(r.action);
  return { ...r, label: labelOf(r.action), category: categoryOf(r.action), categoryLabel: categoryLabel(categoryOf(r.action)), level, levelInfo: LEVELS[level],
    actor: r.user_id ? (r.username || `Compte supprimé (n° ${r.user_id})`) : "Aucun compte associé (système, visiteur ou action automatique)", actorKnown: Boolean(r.user_id && r.username),
    siteLabel: r.site_id ? (r.site_name || `Site n° ${r.site_id}`) : "Organisation / site principal", element: `${r.resource_type}${r.resource_id ? ` n° ${r.resource_id}` : ""}` };
}

function list(ctx, query = {}) {
  const f = normalize(query), w = whereOf(ctx, f);
  const base = `FROM mk_audit_logs l LEFT JOIN users u ON u.id = l.user_id WHERE ${w.sql}`;
  const total = ctx.db.prepare(`SELECT COUNT(*) n ${base}`).get(...w.args).n;
  const pg = common.paginate(total, f.page, f.size);
  const rows = ctx.db.prepare(`${SELECT} WHERE ${w.sql} ORDER BY l.id DESC LIMIT ? OFFSET ?`).all(...w.args, pg.limit, pg.offset).map(present);
  return { filters: f, rows, total, ...pg };
}
// Valeurs proposées par les filtres : uniquement celles qui existent dans la portée lisible
function choices(ctx) {
  const s = scopeSql({ siteScope: ctx.siteScope }, "l");
  const base = `FROM mk_audit_logs l WHERE l.organization_id = ? AND ${s.sql}`;
  const args = [ctx.organizationId, ...s.params];
  const cats = ctx.db.prepare(`SELECT DISTINCT substr(l.action, 1, instr(l.action, '.') - 1) c ${base} ORDER BY c`).all(...args).map((r) => ({ key: r.c, label: categoryLabel(r.c) }));
  const actors = ctx.db.prepare(`SELECT DISTINCT l.user_id id, u.username name FROM mk_audit_logs l LEFT JOIN users u ON u.id = l.user_id WHERE l.organization_id = ? AND ${s.sql} AND l.user_id IS NOT NULL ORDER BY name COLLATE NOCASE LIMIT 200`).all(...args).map((r) => ({ id: r.id, name: r.name || `Compte supprimé (n° ${r.id})` }));
  return { categories: cats, actors };
}
function get(ctx, id) {
  if (!/^\d{1,12}$/.test(String(id))) return null;
  const s = scopeSql({ siteScope: ctx.siteScope }, "l");
  const row = ctx.db.prepare(`${SELECT} WHERE l.id = ? AND l.organization_id = ? AND ${s.sql}`).get(Number(id), ctx.organizationId, ...s.params);
  if (!row) return null;
  const e = present(row);
  e.meta = metaLines(row.metadata);
  // Événements liés : même élément (type + identifiant), dans la même portée — il n'existe pas d'identifiant de corrélation enregistré
  e.related = row.resource_id ? ctx.db.prepare(`${SELECT} WHERE l.organization_id = ? AND l.resource_type = ? AND l.resource_id = ? AND l.id <> ? AND ${s.sql} ORDER BY l.id DESC LIMIT 10`).all(ctx.organizationId, row.resource_type, row.resource_id, row.id, ...s.params).map(present) : [];
  return e;
}

// CSV : mêmes filtres et même portée que l'écran ; au plus EXPORT_MAX lignes ; cellules neutralisées contre l'injection de formules (=, +, -, @) ; métadonnées remasquées
const cell = (v) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
function csv(ctx, query = {}) {
  const f = normalize(query), w = whereOf(ctx, f);
  const rows = ctx.db.prepare(`${SELECT} WHERE ${w.sql} ORDER BY l.id DESC LIMIT ?`).all(...w.args, EXPORT_MAX + 1).map(present);
  const truncated = rows.length > EXPORT_MAX;
  const out = ["Identifiant,Date (UTC),Niveau,Événement,Action,Acteur,Site,Élément,Détails"];
  for (const r of rows.slice(0, EXPORT_MAX)) out.push([r.id, r.created_at, r.levelInfo.label, r.label, r.action, r.actor, r.siteLabel, r.element, metaLines(r.metadata).map((m) => `${m.k}: ${m.v}`).join(" ; ")].map(cell).join(","));
  return { text: `﻿${out.join("\r\n")}\r\n`, count: Math.min(rows.length, EXPORT_MAX), truncated, filters: f };
}

module.exports = { PER_PAGE, EXPORT_MAX, LEVELS, labelOf, categoryOf, levelOf, normalize, toQuery, list, choices, get, csv, metaLines };
