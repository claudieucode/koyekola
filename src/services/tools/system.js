// Informations système (palier 13) : seulement des faits mesurés ou lus ; jamais de secret (mots de passe, clés, jetons, adresses de base distantes).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const db = require("../../config/database");

const pkg = require("../../../package.json");
const count = (sql) => { try { return db.prepare(sql).get().n; } catch { return null; } };
const mb = (bytes) => `${(bytes / 1048576).toFixed(bytes > 10485760 ? 0 : 1)} Mo`;
const configured = (name) => Boolean(process.env[name]);

function info({ siteId = null, req = null } = {}) {
  const paths = require("../../config/paths");
  const { storageInfo } = require("../../config/mediaAudit");
  const { indexingAllowed } = require("../../middlewares/siteHost");
  const urls = require("../urls");
  const env = process.env.NODE_ENV === "production" ? "Production" : process.env.NODE_ENV === "test" ? "Test" : "Développement";
  const site = siteId ? urls.siteInfo(siteId) : null;
  const dbFile = (() => { try { return fs.statSync(path.join(paths.dataDir, "KOYEKOLA.db")).size; } catch { return null; } })();
  let migrations = null;
  try { migrations = db.prepare("SELECT COUNT(*) n, MAX(version) v FROM schema_migrations").get(); } catch { migrations = null; }
  const st = storageInfo();
  const mem = process.memoryUsage();
  const sections = [
    { title: "Application", rows: [
      ["Version de KOLAKISA", pkg.version], ["Environnement", env], ["Node.js", process.version], ["Framework", `Express ${require("express/package.json").version}`],
      ["Démarré depuis", `${Math.floor(process.uptime() / 3600)} h ${Math.floor((process.uptime() % 3600) / 60)} min`],
      ["Indexation par les moteurs", indexingAllowed(req || { hostname: "" }) ? "Autorisée" : "Fermée (adresse locale ou ALLOW_INDEXING=0)"],
    ] },
    { title: "Adresses", rows: [
      ["Adresse publique du site principal", process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : "Non définie (SITE_URL)"],
      ...(siteId ? [["Site", site ? site.name : `n° ${siteId}`], ["Identifiant du site", String(siteId)], ["Domaine du site", site && site.host ? site.host : "Aucun (pages sous /p/ du site principal)"]] : []),
    ] },
    { title: "Base de données", rows: [
      ["Type", "SQLite (node:sqlite)"], ["Taille du fichier", dbFile === null ? "Non mesurée" : mb(dbFile)], ["Migrations appliquées", migrations && migrations.n !== null ? `${migrations.n} (dernière : ${migrations.v})` : "Non mesurées"],
      ["Pages", count("SELECT COUNT(*) n FROM mk_landing_pages WHERE archived_at IS NULL")], ["Articles", count("SELECT COUNT(*) n FROM posts WHERE deleted_at IS NULL")],
      ["Catégories et étiquettes", count("SELECT COUNT(*) n FROM taxonomy_terms")], ["Médias", count("SELECT COUNT(*) n FROM mk_media WHERE deleted_at IS NULL")], ["Sites", count(`SELECT COUNT(*) n FROM mk_sites WHERE status = 'active'${require("../primarySite").excludeSql(db)}`)],
    ] },
    { title: "Stockage", rows: [
      ["Fichiers envoyés", st.uploadsInsideApp ? "Dans le dossier de l'application (perdus à un redéploiement)" : "Dossier conservé, hors de l'application"],
      ["Base de données", st.dataInsideApp ? "Dans le dossier de l'application" : "Dossier conservé, hors de l'application"],
    ] },
    { title: "Serveur", rows: [
      ["Système", `${os.type()} ${os.arch()}`], ["Processeurs", String(os.cpus().length)], ["Mémoire du processus", mb(mem.rss)], ["Mémoire libre du système", mb(os.freemem())],
    ] },
    { title: "Configuration (présence seulement — jamais la valeur)", rows: [
      ["Clé de chiffrement (ENCRYPTION_KEY)", configured("ENCRYPTION_KEY") ? "Définie" : "Absente"], ["Secret de session (SESSION_SECRET)", configured("SESSION_SECRET") ? "Défini" : "Absent"],
      ["Envoi d'e-mails (SMTP)", configured("SMTP_HOST") ? "Configuré" : "Non configuré"], ["Traitement en arrière-plan (MARKETING_WORKER)", process.env.MARKETING_WORKER === "on" ? "Actif" : "Inactif"],
      ["Paiement (Stripe)", configured("STRIPE_SECRET_KEY") ? "Configuré" : "Non configuré"],
    ] },
  ];
  return { sections, at: new Date().toISOString() };
}

// Diagnostic de la file de travaux : états, échecs récents (message tronqué, sans donnée personnelle)
function jobsDiagnostic() {
  const states = db.prepare("SELECT state, COUNT(*) n FROM mk_jobs GROUP BY state").all();
  const dead = db.prepare("SELECT id, type, attempts, max_attempts, last_error, finished_at FROM mk_jobs WHERE state = 'dead' ORDER BY id DESC LIMIT 15").all().map((j) => ({ ...j, last_error: String(j.last_error || "").replace(/[\u0000-\u001f]+/g, " ").replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "[e-mail]").slice(0, 160) }));
  const types = db.prepare("SELECT type, COUNT(*) n FROM mk_jobs WHERE state IN ('pending','running') GROUP BY type ORDER BY n DESC LIMIT 10").all();
  return { states: Object.fromEntries(states.map((s) => [s.state, s.n])), dead, pendingTypes: types };
}

module.exports = { info, jobsDiagnostic };
