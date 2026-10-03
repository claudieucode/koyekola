// Tâches SEO programmées : audit du site, vitesse de la page d'accueil, actualisation Search Console / Analytics,
// nettoyage des journaux. Chaque tâche a un état réel (dernier passage, résultat, erreur, prochain passage) et un
// historique. Une tâche dont le service n'est pas configuré est « ignorée » avec la raison, jamais simulée.
// Heures en temps universel (UTC). Plusieurs exemplaires du serveur peuvent tourner : une tâche est « réservée »
// par une mise à jour atomique avant d'être exécutée, elle ne tourne donc qu'une fois.
const { db } = require("./store");
const audit = require("./audit");
const integrations = require("./integrations");
const monitor = require("./monitor");

db.exec(`
  CREATE TABLE IF NOT EXISTS seo_jobs (
    name TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    frequency TEXT NOT NULL DEFAULT 'weekly',
    hour INTEGER NOT NULL DEFAULT 3,
    next_run_at TEXT,
    running_since TEXT,
    last_run_at TEXT,
    last_status TEXT,
    last_message TEXT
  );
  CREATE TABLE IF NOT EXISTS seo_job_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job TEXT NOT NULL,
    trigger TEXT NOT NULL DEFAULT 'auto',
    status TEXT NOT NULL,
    message TEXT,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_seo_job_runs ON seo_job_runs(job, id);
`);

class Skip extends Error {}
const siteUrl = () => String(process.env.SITE_URL || "").trim().replace(/\/+$/, "");

// Requête minimale pour les modules qui construisent des adresses (robots.txt, audit) hors d'une visite réelle
function pseudoRequest() {
  const base = siteUrl();
  const host = base ? new URL(base).host : `localhost:${process.env.PORT || 3002}`;
  return { protocol: base.startsWith("https") ? "https" : "http", headers: { host }, get: (h) => (String(h).toLowerCase() === "host" ? host : undefined) };
}

const JOBS = {
  audit: {
    label: "Audit complet du site", frequency: "weekly", hour: 3,
    description: "Explore toutes les pages publiques et applique les règles SEO ; le résultat apparaît dans l'onglet Audit.",
    async run() {
      const r = await audit.runAudit({ kind: "full", req: pseudoRequest(), source: "scheduled" });
      if (!r.ok) throw new Skip(r.error);
      await r.done;
      const a = audit.get(r.id);
      if (a.status !== "done") throw new Error(a.error || "Audit en échec.");
      return `Audit n° ${a.id} : ${a.pages} pages lues, ${a.issues} problème(s)${a.scores && a.scores.overall ? `, note globale ${a.scores.overall.score} / 100` : ""}.`;
    },
  },
  monitor: {
    label: "Surveillance du site", frequency: "daily", hour: 6,
    description: "Compare l'état du site à celui du passage précédent (pages principales, noindex, canonical, robots.txt, plan du site, nouvelles 404) et crée une alerte pour chaque changement constaté.",
    async run() {
      const r = await monitor.run(pseudoRequest());
      return r.baseline ? "Référence enregistrée : les changements seront signalés à partir du prochain passage." : r.alerts.length ? `${r.alerts.length} changement(s) signalé(s) dans la vue d'ensemble.` : "Aucun changement constaté.";
    },
  },
  pagespeed: {
    label: "Vitesse de la page d'accueil (PageSpeed, mobile)", frequency: "weekly", hour: 4,
    description: "Demande à Google PageSpeed Insights une mesure de la page d'accueil ; l'historique apparaît dans l'onglet Intégrations.",
    async run() {
      if (!/^https:\/\//.test(siteUrl())) throw new Skip("Configuration requise : SITE_URL en https.");
      const r = await integrations.runPageSpeed(`${siteUrl()}/`, "mobile");
      if (!r.ok) throw new Error(r.error);
      return `Performance mobile : ${r.result.performance === null ? "Non disponible" : `${r.result.performance} / 100`}.`;
    },
  },
  search_console: {
    label: "Actualisation Search Console (28 jours)", frequency: "daily", hour: 5,
    description: "Récupère les clics, impressions et positions des 28 derniers jours disponibles.",
    async run() {
      if (integrations.status("search_console").state !== "connected") throw new Skip("Non connecté : configurez Search Console dans l'onglet Intégrations.");
      const r = await integrations.searchConsoleReport(28, { refresh: true });
      return `${r.totals.current.clicks} clic(s), ${r.totals.current.impressions} impression(s) du ${r.period.current.start} au ${r.period.current.end}.`;
    },
  },
  analytics: {
    label: "Actualisation Google Analytics 4 (28 jours)", frequency: "daily", hour: 5,
    description: "Récupère les utilisateurs, sessions et pages vues des 28 derniers jours.",
    async run() {
      if (integrations.status("analytics").state !== "connected") throw new Skip("Non connecté : configurez Google Analytics dans l'onglet Intégrations.");
      const r = await integrations.analyticsReport(28, { refresh: true });
      return `${r.totals.activeUsers ?? "Non disponible"} utilisateur(s) actif(s), ${r.totals.sessions ?? "Non disponible"} session(s).`;
    },
  },
  cleanup: {
    label: "Nettoyage des journaux", frequency: "weekly", hour: 2,
    description: "Retire les erreurs 404 non revues depuis 180 jours (sauf celles marquées ignorées), les mesures PageSpeed et l'historique des tâches de plus d'un an.",
    async run() {
      const a = db.prepare("DELETE FROM seo_404 WHERE ignored = 0 AND last_seen < datetime('now', '-180 days')").run().changes;
      const b = db.prepare("DELETE FROM seo_pagespeed WHERE fetched_at < datetime('now', '-365 days')").run().changes;
      const c = db.prepare("DELETE FROM seo_job_runs WHERE finished_at < datetime('now', '-365 days')").run().changes;
      return `${a} adresse(s) 404, ${b} mesure(s) PageSpeed et ${c} ligne(s) d'historique retirées.`;
    },
  },
};
const FREQUENCIES = { daily: "Chaque jour", weekly: "Chaque semaine (lundi)", off: "Désactivée" };

const sqlTime = (d) => d.toISOString().slice(0, 19).replace("T", " ");
// Prochain passage : à l'heure choisie (UTC), le jour même si elle n'est pas passée ; le lundi pour « chaque semaine »
function nextRun(frequency, hour, from = new Date()) {
  if (frequency === "off") return null;
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), hour, 0, 0));
  if (d <= from) d.setUTCDate(d.getUTCDate() + 1);
  if (frequency === "weekly") while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1);
  return sqlTime(d);
}

function ensureRows() {
  const insert = db.prepare("INSERT OR IGNORE INTO seo_jobs (name, frequency, hour, next_run_at) VALUES (?, ?, ?, ?)");
  for (const [name, j] of Object.entries(JOBS)) insert.run(name, j.frequency, j.hour, nextRun(j.frequency, j.hour));
}
ensureRows();

function list() {
  const rows = Object.fromEntries(db.prepare("SELECT * FROM seo_jobs").all().map((r) => [r.name, r]));
  return Object.entries(JOBS).map(([name, j]) => ({ name, label: j.label, description: j.description, ...rows[name], runs: db.prepare("SELECT * FROM seo_job_runs WHERE job = ? ORDER BY id DESC LIMIT 5").all(name) }));
}

function configure(name, { frequency, hour }) {
  if (!JOBS[name]) return { ok: false, error: "Tâche inconnue." };
  if (!FREQUENCIES[frequency]) return { ok: false, error: "Fréquence invalide." };
  const h = Number(hour);
  if (!Number.isInteger(h) || h < 0 || h > 23) return { ok: false, error: "Heure invalide (0 à 23)." };
  db.prepare("UPDATE seo_jobs SET frequency = ?, hour = ?, enabled = ?, next_run_at = ? WHERE name = ?").run(frequency, h, frequency === "off" ? 0 : 1, nextRun(frequency, h), name);
  return { ok: true };
}

// Réservation atomique : une seule exécution à la fois, même avec plusieurs serveurs (verrou périmé après 2 h)
function claim(name, { due }) {
  const r = db.prepare(`UPDATE seo_jobs SET running_since = datetime('now') WHERE name = ? AND (running_since IS NULL OR running_since < datetime('now', '-2 hours'))${due ? " AND enabled = 1 AND next_run_at IS NOT NULL AND next_run_at <= datetime('now')" : ""}`).run(name);
  return r.changes === 1;
}

async function execute(name, { trigger = "auto" } = {}) {
  const job = JOBS[name];
  if (!job) return { ok: false, status: "error", message: "Tâche inconnue." };
  if (!claim(name, { due: trigger === "auto" })) return { ok: false, status: "busy", message: "Cette tâche est déjà en cours." };
  const started = sqlTime(new Date());
  let status = "ok";
  let message;
  try {
    message = await job.run();
  } catch (e) {
    status = e instanceof Skip ? "skipped" : "error";
    message = String((e && e.message) || "Erreur inconnue").slice(0, 400);
    if (status === "error") console.error(`[KOLAKISA] Tâche SEO « ${name} » en échec :`, message);
  }
  const row = db.prepare("SELECT frequency, hour FROM seo_jobs WHERE name = ?").get(name);
  db.prepare("UPDATE seo_jobs SET running_since = NULL, last_run_at = ?, last_status = ?, last_message = ?, next_run_at = ? WHERE name = ?").run(started, status, message, nextRun(row.frequency, row.hour), name);
  db.prepare("INSERT INTO seo_job_runs (job, trigger, status, message, started_at) VALUES (?, ?, ?, ?, ?)").run(name, trigger, status, message, started);
  return { ok: status === "ok", status, message };
}

// Passage régulier : exécute, l'une après l'autre, les tâches dont l'heure est venue
let ticking = false;
async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const due = db.prepare("SELECT name FROM seo_jobs WHERE enabled = 1 AND next_run_at IS NOT NULL AND next_run_at <= datetime('now') AND running_since IS NULL").all();
    for (const { name } of due) await execute(name, { trigger: "auto" });
  } catch (e) {
    console.error("[KOLAKISA] Tâches SEO :", e && e.message);
  } finally { ticking = false; }
}
function start({ everyMs = Number(process.env.SEO_JOBS_TICK_MS) || 60000 } = {}) {
  const timer = setInterval(tick, everyMs);
  timer.unref?.();
  return timer;
}

module.exports = { monitor, JOBS, FREQUENCIES, list, configure, execute, tick, start, nextRun, pseudoRequest };
