#!/usr/bin/env node
// Aperçu (LECTURE SEULE sur l'original) de la transition IA de la migration 086 : quels sites garderaient l'accès à l'assistant IA, et pourquoi.
// Usage : node scripts/previsualiser-transition-ia.js <fichier-de-base.db> [--json]
// Sécurité : le fichier donné n'est JAMAIS ouvert en écriture. Il est copié dans un dossier temporaire ; les migrations marketing sont appliquées à la COPIE (si elles ne le sont pas déjà),
// l'éligibilité est calculée, puis la copie est supprimée. Aucune transition n'est exécutée (aucun module n'est activé), même sur la copie.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const source = process.argv[2];
const asJson = process.argv.includes("--json");
if (!source || !fs.existsSync(source)) { console.error("Usage : node scripts/previsualiser-transition-ia.js <fichier-de-base.db> [--json]"); process.exit(2); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "apercu-ia-"));
const copy = path.join(dir, "copie.db");
try {
  fs.copyFileSync(source, copy);
  for (const ext of ["-wal", "-shm"]) if (fs.existsSync(source + ext)) fs.copyFileSync(source + ext, copy + ext);
  const db = new DatabaseSync(copy);
  const { migrate } = require("../src/marketing/db/migrate");
  const quiet = { log() {}, warn() {}, error() {} };
  const applied = migrate(db, { dir: path.join(__dirname, "..", "src", "marketing", "migrations"), dbPath: copy, backupDir: path.join(dir, "sauvegarde"), log: quiet }).applied;
  const detail = require("../src/marketing/transitions").aiEligibilityDetail(db);
  const inc = detail.filter((d) => d.decision === "inclus"), exc = detail.filter((d) => d.decision === "exclu");
  const byReason = {}; for (const d of exc) byReason[d.reason] = (byReason[d.reason] || 0) + 1;
  const report = { sitesTotal: detail.length, inclus: inc.length, exclus: exc.length, exclusParRaison: byReason, migrationsAppliqueesALaCopie: applied, sites: detail.map(({ siteId, organizationId, decision, reason, people, memberReasons, alreadyRow }) => ({ siteId, organizationId, decision, reason, people, memberReasons, alreadyRow })) };
  if (asJson) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`Aperçu de la transition IA (copie jetable, original intact)\nSites : ${report.sitesTotal} — retenus : ${report.inclus} — exclus : ${report.exclus}`);
    for (const [r, n] of Object.entries(byReason)) console.log(`  exclus (${n}) : ${r}`);
    for (const d of report.sites) console.log(`  site ${d.siteId} [org ${d.organizationId}] ${d.decision.toUpperCase()} — ${d.reason}${Object.keys(d.memberReasons).length ? ` ; membres écartés : ${JSON.stringify(d.memberReasons)}` : ""}${d.alreadyRow ? ` ; ${d.alreadyRow}` : ""}`);
    if (!report.sitesTotal) console.log("  (aucun site dans cette base : rien à préserver)");
  }
  db.close();
} finally { fs.rmSync(dir, { recursive: true, force: true }); }
