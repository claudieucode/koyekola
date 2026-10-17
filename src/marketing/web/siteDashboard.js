// R8 lot 3 — Indicateurs du tableau de bord d'UN site (ou du site principal) : chaque chiffre vient d'une source réelle, borné au site de l'espace (déterminé par le serveur), affiché seulement si
// la personne a le droit de lire ces données ; une source indisponible donne « — » (jamais un zéro présenté comme réel). Le site principal garde sa sémantique : SES contenus (sans rattachement à un site),
// jamais la somme des sites.
const siteContent = require("../../services/siteContent");
const { listAudit } = require("../audit");

// Exécute une lecture ; en cas d'erreur de source → null (affiché « — »)
const read = (fn) => { try { return fn(); } catch { return null; } };

function indicators(req, space) {
  const { ctx } = req.mk, db = ctx.db, org = ctx.organizationId, can = req.mk.can;
  const id = space.siteId;                                       // null = site principal
  const scope = { ...ctx, siteScope: undefined, siteFilter: id === null ? "principal" : id }; // réutilise les prédicats de portée des contenus (0 = principal)
  const stats = [];
  const base = space.base;

  if (can("articles.read")) {
    const p = siteContent.scopePredicate(scope, "post", "p.id");
    const row = read(() => db.prepare(`SELECT COUNT(*) total, COALESCE(SUM(p.status = 'published'), 0) publies, COALESCE(SUM(p.status = 'draft'), 0) brouillons, COALESCE(SUM(p.status = 'scheduled'), 0) programmes
      FROM posts p WHERE p.deleted_at IS NULL${p ? ` AND ${p.sql}` : ""}`).get(...(p ? p.params : [])));
    stats.push({ label: "Articles publiés", value: row ? row.publies : null, hint: row ? `${row.brouillons} brouillon${row.brouillons > 1 ? "s" : ""} · ${row.programmes} programmé${row.programmes > 1 ? "s" : ""}` : "données indisponibles", href: id === null ? "/marketing/site-web/articles" : `${base}/articles` });
  }
  if (can("comments.read")) {
    const c = siteContent.commentPredicate(scope, "c");
    const row = read(() => db.prepare(`SELECT COALESCE(SUM(c.status = 'pending'), 0) attente, COALESCE(SUM(c.status = 'approved'), 0) approuves FROM blog_comments c WHERE c.status <> 'trash'${c ? ` AND ${c.sql}` : ""}`).get(...(c ? c.params : [])));
    stats.push({ label: "Commentaires en attente", value: row ? row.attente : null, hint: row ? `${row.approuves} approuvé${row.approuves > 1 ? "s" : ""}` : "données indisponibles", href: id === null ? "/marketing/site-web/commentaires/en-attente" : `${base}/commentaires/en-attente` });
  }
  if (can("media.read")) {
    // Médias PROPRES au site (portée « site ») ; le principal : les médias communs (portée « partagée »)
    const n = read(() => (id === null
      ? db.prepare("SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND reach = 'shared'").get(org).n
      : db.prepare("SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND reach = 'site' AND site_id = ?").get(org, id).n));
    stats.push({ label: id === null ? "Médias communs" : "Médias du site", value: n, hint: n === null ? "données indisponibles" : id === null ? "partagés entre les sites" : "propres à ce site", href: id === null ? "/marketing/site-web/mediatheque" : `${base}/medias` });
  }
  if (can("contacts.read")) {
    const n = read(() => (id === null
      ? db.prepare("SELECT COUNT(*) n FROM mk_contacts c WHERE c.organization_id = ? AND NOT EXISTS (SELECT 1 FROM mk_contact_sites cs WHERE cs.contact_id = c.id)").get(org).n
      : db.prepare("SELECT COUNT(*) n FROM mk_contact_sites WHERE site_id = ? AND organization_id = ?").get(id, org).n));
    stats.push({ label: "Contacts", value: n, hint: n === null ? "données indisponibles" : id === null ? "sans rattachement à un site" : "rattachés à ce site", href: id === null ? "/marketing/contacts" : `${base}/contacts` });
  }
  if (can("forms.read")) {
    const n = read(() => db.prepare(`SELECT COUNT(*) n FROM mk_forms WHERE organization_id = ? AND ${id === null ? "site_id IS NULL" : "site_id = ?"}`).get(org, ...(id === null ? [] : [id])).n);
    stats.push({ label: "Formulaires", value: n, hint: n === null ? "données indisponibles" : undefined, href: id === null ? "/marketing/formulaires" : `${base}/formulaires` });
  }
  return stats;
}

// Activité récente d'UN site (journal d'audit filtré par ce site, R7 lot 4) — seulement avec le droit « audit.read » ; jamais pour le site principal (son journal mélange des événements d'organisation)
function activity(req, space) {
  if (space.siteId === null || !req.mk.can("audit.read")) return null;
  const { ctx } = req.mk;
  const rows = read(() => listAudit(ctx.db, ctx.organizationId, { limit: 8, scope: { ...ctx, siteScope: undefined, siteFilter: space.siteId } }));
  if (rows === null) return { unavailable: true, rows: [] };
  const names = new Map();
  const nameOf = (uid) => { if (!uid) return "Système"; if (!names.has(uid)) names.set(uid, read(() => ctx.db.prepare("SELECT username FROM users WHERE id = ?").get(uid)?.username) || "Utilisateur"); return names.get(uid); };
  return { rows: rows.map((r) => ({ at: String(r.created_at || "").slice(0, 16).replace("T", " "), who: nameOf(r.user_id), action: r.action })) };
}
module.exports = { indicators, activity };
