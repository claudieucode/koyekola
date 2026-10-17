#!/usr/bin/env node
// Reconstruction des tables d'adresses (unicité PAR SITE) — point d'exécution dédié (R6 lot 5). Application ARRÊTÉE. Aucun secret, uniquement des nombres.
//   node scripts/reconstruire.js --base <KOYEKOLA.db> --sauvegardes <dossier>                       (ESSAI : la base d'origine n'est jamais modifiée)
//   node scripts/reconstruire.js --base … --sauvegardes … --reel --app-arretee --confirmer RECONSTRUIRE   (réel : sauvegarde vérifiée, comparaison, restauration automatique si écart)
// Le mode réel sur la base de l'application exige en plus --autoriser-base-vivante (jamais par défaut). Voir src/services/reconstructionRun.js.
const path = require("node:path");
const args = process.argv.slice(2);
const get = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const has = (name) => args.includes(name);
const dbPath = get("--base") ? path.resolve(get("--base")) : "";
const backupDir = get("--sauvegardes") ? path.resolve(get("--sauvegardes")) : "";
if (!dbPath || !backupDir) { console.error("Usage : node scripts/reconstruire.js --base <fichier.db> --sauvegardes <dossier> [--reel --app-arretee --confirmer RECONSTRUIRE]"); process.exit(2); }
const { run } = require("../src/services/reconstructionRun");
const result = run({ dbPath, backupDir, mode: has("--reel") ? "reel" : "essai", appStopped: has("--app-arretee"), confirm: get("--confirmer") || "", allowLive: has("--autoriser-base-vivante"), marker: get("--marqueur") || "076", log: (e) => console.log(`[${e.step}] ${e.ok ? "ok" : "ÉCHEC"}${e.status ? ` : ${e.status}` : ""}`) });
console.log(`\nRésultat : ${result.status}${result.reason ? ` — ${result.reason}` : ""}\nJournal : ${result.journalFile}${result.backup ? `\nSauvegarde : ${result.backup}` : ""}`);
process.exit(["essai-conforme", "reconstruite", "rien-a-faire", "deja-executee"].includes(result.status) ? 0 : 1);
