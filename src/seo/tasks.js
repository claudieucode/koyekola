// Tâches SEO « à faire » : construites à partir des données réelles (configuration du site + problèmes ouverts du
// dernier audit, regroupés par règle). Rien n'est inventé : sans audit, seules les tâches de configuration existent.
// « Marquer comme terminé » est mémorisé (table seo_tasks_done) ; une tâche d'audit est liée à l'audit qui l'a
// relevée : si l'audit suivant retrouve le même problème, la tâche réapparaît.
const { db } = require("./store");
const settings = require("./settings");
const images = require("./images");
const { BY_ID, CATEGORIES } = require("./rules");

db.exec(`
  CREATE TABLE IF NOT EXISTS seo_tasks_done (
    key TEXT PRIMARY KEY,
    done_at TEXT NOT NULL DEFAULT (datetime('now')),
    user_id INTEGER
  );
`);

// Trois niveaux de priorité affichés (la gravité « info » est un constat, pas une tâche)
const PRIORITIES = { critical: { label: "Critique", rank: 0 }, important: { label: "Important", rank: 1 }, recommended: { label: "Recommandé", rank: 2 } };
const PRIORITY_OF = { critical: "critical", high: "important", medium: "recommended", low: "recommended" };

function configTasks() {
  const st = settings.all();
  const out = [];
  const logo = st.org_logo ? images.probe(st.org_logo) : null;
  if (!logo || !logo.exists) out.push({ key: "config:org_logo", priority: "important", title: st.org_logo ? "Logo de l'organisation introuvable" : "Logo de l'organisation manquant", status: "Configuration requise", detail: "Utilisé par Google dans les données structurées de l'organisation.", href: "/formateur/seo/reglages#seo-org_logo", action: "Corriger" });
  if (!st.social_profiles.length) out.push({ key: "config:social_profiles", priority: "important", title: "Profils sociaux non configurés", status: "Configuration requise", detail: "Relient vos comptes officiels (Facebook, Instagram, LinkedIn…) à votre site.", href: "/formateur/seo/reglages#seo-social_profiles", action: "Corriger" });
  const share = st.default_social_image ? images.probe(st.default_social_image) : null;
  if (!share || !share.exists) out.push({ key: "config:default_social_image", priority: "recommended", title: st.default_social_image ? "Image de partage introuvable" : "Image de partage non renseignée", status: "Recommandation", detail: "Affichée quand une page partagée n'a pas d'image (idéalement 1200 × 630 px).", href: "/formateur/seo/reglages#seo-default_social_image", action: "Corriger" });
  if (!process.env.SITE_URL) out.push({ key: "config:site_url", priority: "important", title: "Adresse publique du site non définie", status: "Configuration requise", detail: "Variable SITE_URL à définir chez l'hébergeur (hPanel → Node.js → Variables d'environnement).", href: null, action: null });
  return out.map((t) => ({ ...t, source: "config" }));
}

function auditTasks() {
  const a = db.prepare("SELECT id, finished_at FROM seo_audits WHERE status = 'done' ORDER BY id DESC LIMIT 1").get();
  if (!a) return [];
  const rows = db.prepare("SELECT rule_id, category, severity, COUNT(*) n, MIN(path) path FROM seo_issues WHERE audit_id = ? AND fixed_at IS NULL AND severity <> 'info' GROUP BY rule_id, category, severity").all(a.id);
  return rows.map((r) => {
    const rule = BY_ID[r.rule_id];
    return {
      key: `rule:${r.rule_id}:${a.id}`, source: "audit", priority: PRIORITY_OF[r.severity] || "recommended", severity: r.severity,
      title: rule ? rule.title : r.rule_id, status: CATEGORIES[r.category] || r.category, pages: r.n,
      detail: r.n > 1 ? `${r.n} pages concernées` : r.path, recommendation: rule ? rule.recommendation : "",
      href: `/formateur/seo/audit?id=${a.id}&regle=${encodeURIComponent(r.rule_id)}`, action: rule && rule.fix ? "Corriger" : "Voir",
    };
  });
}

// Toutes les tâches, triées par priorité puis par nombre de pages ; done = marquée terminée
function list() {
  const done = new Map(db.prepare("SELECT key, done_at FROM seo_tasks_done").all().map((r) => [r.key, r.done_at]));
  return [...configTasks(), ...auditTasks()]
    .map((t) => ({ ...t, done: done.has(t.key), doneAt: done.get(t.key) || null }))
    .sort((x, y) => PRIORITIES[x.priority].rank - PRIORITIES[y.priority].rank || (y.pages || 0) - (x.pages || 0));
}
const open = () => list().filter((t) => !t.done);
const openCount = () => { try { return open().length; } catch { return 0; } };

const KEY = /^(config:[a-z_]{1,40}|rule:[a-z0-9_]{1,60}:\d{1,10})$/;
function setDone(key, done, userId) {
  if (!KEY.test(String(key || ""))) return false;
  if (done) db.prepare("INSERT INTO seo_tasks_done (key, user_id) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET done_at = datetime('now'), user_id = excluded.user_id").run(key, userId || null);
  else db.prepare("DELETE FROM seo_tasks_done WHERE key = ?").run(key);
  return true;
}

module.exports = { list, open, openCount, setDone, PRIORITIES, PRIORITY_OF };
