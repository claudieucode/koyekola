// Audit LECTURE SEULE d'une copie de base (R6 lot 6) : résultats AGRÉGÉS (nombres, codes, gravités) — jamais un titre, un nom, un e-mail ni un contenu.
// Ouvre le fichier en lecture seule, refuse la base vivante de l'application, n'écrit rien (ni sauvegarde, ni verrou, ni journal dans la base).
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const checks = require("./reconstructionChecks");
const tables = require("./reconstructionTables");

function audit(dbPath, { allowLive = false } = {}) {
  const file = path.resolve(dbPath);
  if (!fs.existsSync(file)) return { status: "refus", reason: "Fichier introuvable." };
  const live = require("../config/paths").dbFile;
  if (!allowLive && path.resolve(live) === file) return { status: "refus", reason: "Ceci est la base de l'application : l'audit se fait sur une COPIE." };
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const integrity = db.prepare("PRAGMA integrity_check").all().map((r) => r.integrity_check);
    const fk = db.prepare("PRAGMA foreign_key_check").all().length;
    const found = checks.run(db);
    const counts = {};
    for (const t of tables.PLAN_TABLES) { try { counts[t] = db.prepare(`SELECT COUNT(*) n FROM "${t}"`).get().n; } catch { counts[t] = null; } }
    return {
      status: found.blocking ? "bloquant" : "conforme",
      integrite: integrity.length === 1 && integrity[0] === "ok",
      violations_cles_etrangeres: fk,
      tables_a_reconstruire: tables.pending(db),
      lignes_par_table: counts,
      constats: found.findings.map((f) => ({ code: f.code, gravite: f.severity, nombre: f.count })),
      cas_exclus: found.exclusions.length,
    };
  } finally { db.close(); }
}
module.exports = { audit };
