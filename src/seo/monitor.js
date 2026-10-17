// Surveillance SEO : à chaque passage (tâche programmée « Surveillance »), une photographie de l'état réel du site
// est comparée à la précédente. Seuls les changements constatés deviennent des alertes ; le premier passage
// enregistre la référence, sans alerte. Aucune surveillance n'est affichée tant que la tâche n'a jamais tourné.
const { db } = require("./store");
const robots = require("./robots");
const sitemap = require("./sitemap");
const { inspect } = require("./inspect");

db.exec(`
  CREATE TABLE IF NOT EXISTS seo_monitor_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS seo_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    severity TEXT NOT NULL,
    kind TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    seen_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_seo_alerts_open ON seo_alerts(seen_at, id);
`);

// Pages surveillées : les entrées principales du site
const KEY_PAGES = ["/", "/catalogue", "/blog"];

async function snapshot(req) {
  const host = req.get("host");
  const pages = {};
  for (const path of KEY_PAGES) {
    const r = await inspect(path, { host });
    pages[path] = { status: r.status, error: r.error || null, title: r.page ? r.page.title : null, robots: r.page ? r.page.robots : null, xRobots: r.xRobots || null, canonical: r.page ? r.page.canonical : null };
  }
  const map = sitemap.entries();
  const included = map.included.map((e) => e.path);
  return {
    robots: robots.text(req),
    blocked: robots.conflicts(req, included),
    sitemap: included,
    pages,
    notFound: Object.fromEntries(db.prepare(`SELECT path, hits_human FROM seo_404 WHERE ignored = 0 AND hits_human > 0${require("./store").siteSchemaReady() ? " AND site_id IS NULL" : ""}`).all().map((r) => [r.path, r.hits_human])),
  };
}

const list = (items, n = 10) => `${items.slice(0, n).join(", ")}${items.length > n ? ` (+${items.length - n})` : ""}`;

// Différences entre deux photographies → alertes [{ severity, kind, message }]
function compare(before, now) {
  const alerts = [];
  const add = (severity, kind, message) => alerts.push({ severity, kind, message });
  for (const [path, p] of Object.entries(now.pages)) {
    const b = before.pages[path] || {};
    const noindex = /noindex/i.test(`${p.robots || ""} ${p.xRobots || ""}`);
    if (p.status !== 200 && b.status === 200) add("critical", "page", `La page ${path} ne répond plus correctement (${p.status || p.error || "aucune réponse"}).`);
    if (p.status === 200 && b.status && b.status !== 200) add("info", "page", `La page ${path} répond de nouveau (200).`);
    if (noindex && !/noindex/i.test(`${b.robots || ""} ${b.xRobots || ""}`)) add("critical", "indexability", `La page ${path} est désormais en noindex : Google va la retirer de ses résultats.`);
    if (b.title !== undefined && p.status === 200 && b.status === 200 && p.title !== b.title) add("info", "metadata", `Titre de ${path} modifié : « ${b.title || "(vide)"} » → « ${p.title || "(vide)"} ».`);
    if (b.canonical !== undefined && p.status === 200 && b.status === 200 && p.canonical !== b.canonical) add("medium", "metadata", `Adresse canonique de ${path} modifiée : ${b.canonical || "(aucune)"} → ${p.canonical || "(aucune)"}.`);
  }
  if (now.robots !== before.robots) add("medium", "robots", "Le fichier robots.txt a changé.");
  const newlyBlocked = now.blocked.filter((p) => !before.blocked.includes(p));
  if (newlyBlocked.length) add("high", "robots", `${newlyBlocked.length} adresse(s) du plan du site désormais interdite(s) à Google par robots.txt : ${list(newlyBlocked)}.`);
  const removed = before.sitemap.filter((p) => !now.sitemap.includes(p));
  const added = now.sitemap.filter((p) => !before.sitemap.includes(p));
  if (removed.length) add("medium", "sitemap", `${removed.length} adresse(s) retirée(s) du plan du site : ${list(removed)}.`);
  if (added.length) add("info", "sitemap", `${added.length} adresse(s) ajoutée(s) au plan du site : ${list(added)}.`);
  const new404 = Object.entries(now.notFound).filter(([p, n]) => n > (before.notFound[p] || 0)).map(([p, n]) => `${p} (${n - (before.notFound[p] || 0)})`);
  if (new404.length) add("medium", "404", `${new404.length} adresse(s) introuvable(s) visitée(s) par des personnes depuis le dernier passage : ${list(new404)}.`);
  return alerts;
}

async function run(req) {
  const now = await snapshot(req);
  const prev = db.prepare("SELECT data FROM seo_monitor_snapshots ORDER BY id DESC LIMIT 1").get();
  db.prepare("INSERT INTO seo_monitor_snapshots (data) VALUES (?)").run(JSON.stringify(now));
  db.prepare("DELETE FROM seo_monitor_snapshots WHERE id NOT IN (SELECT id FROM seo_monitor_snapshots ORDER BY id DESC LIMIT 30)").run();
  if (!prev) return { baseline: true, alerts: [] };
  const alerts = compare(JSON.parse(prev.data), now);
  const insert = db.prepare("INSERT INTO seo_alerts (severity, kind, message) VALUES (?, ?, ?)");
  for (const a of alerts) insert.run(a.severity, a.kind, a.message);
  return { baseline: false, alerts };
}

const openAlerts = (limit = 50) => db.prepare("SELECT * FROM seo_alerts WHERE seen_at IS NULL ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END, id DESC LIMIT ?").all(limit);
const markSeen = (id) => db.prepare(`UPDATE seo_alerts SET seen_at = datetime('now') WHERE seen_at IS NULL${id ? " AND id = ?" : ""}`).run(...(id ? [id] : [])).changes;
const lastSnapshotAt = () => (db.prepare("SELECT created_at FROM seo_monitor_snapshots ORDER BY id DESC LIMIT 1").get() || {}).created_at || null;

module.exports = { run, compare, snapshot, openAlerts, markSeen, lastSnapshotAt, KEY_PAGES };
