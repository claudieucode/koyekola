#!/usr/bin/env node
// Essai de RESTAURATION d'une sauvegarde de déploiement (dossier produit par lancer-recette-prod.sh : copie-A.db, RAPPORT-copie.json, uploads.tgz facultatif) — sur une machine de recette, JAMAIS sur la production.
//   node scripts/r9/essai-restauration.js <dossier-sauvegarde> [--code <commit ou branche du code EN PRODUCTION>] [--node-modules <dossier>]
// Restaure la base (et uploads/) dans <dossier>/restauration-<date>/ (dossier neuf), vérifie l'empreinte, l'intégrité complète et les comptes du rapport, extrait le code de production (par défaut origin/main : ce que Hostinger déploie),
// DÉMARRE l'application dessus (sans SMTP, sans worker, sans tâches SEO) et contrôle /sante et la page d'accueil. Une sauvegarde n'est déclarée « RESTAURÉE AVEC SUCCÈS » (fichier RESTAURATION-REUSSIE.txt) que si TOUT réussit.
// Rien n'est supprimé ; la sauvegarde n'est jamais modifiée (empreinte relue à la fin).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
const { spawn, spawnSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const out = (t = "") => fs.writeSync(1, `${t}\n`);
const ROOT = path.resolve(__dirname, "..", "..");
const SRC = args[0] && !args[0].startsWith("--") ? path.resolve(args[0]) : "";
let W = null;
const fail = (m, c = 1) => { out(`\n✗ ARRÊT : ${m}`); if (W) fs.appendFileSync(path.join(W, "RAPPORT-restauration.txt"), `ARRÊT : ${m}\n`); process.exit(c); };
if (!SRC) fail("Usage : node scripts/r9/essai-restauration.js <dossier-sauvegarde> [--code <commit>] [--node-modules <dossier>]", 2);
const DB = path.join(SRC, "copie-A.db"), REP = path.join(SRC, "RAPPORT-copie.json"), UP = path.join(SRC, "uploads.tgz");
if (!fs.existsSync(DB) || !fs.existsSync(REP)) fail("copie-A.db et RAPPORT-copie.json sont obligatoires dans le dossier de sauvegarde.", 2);
const NM = path.resolve(opt("--node-modules", process.env.NODE_PATH || path.join(ROOT, "node_modules"))); if (!fs.existsSync(path.join(NM, "express"))) fail(`node_modules introuvable (${NM}).`, 2);
const CODE = opt("--code", "origin/main");
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const report = JSON.parse(fs.readFileSync(REP, "utf8")); const sha0 = sha(DB), shaUp0 = fs.existsSync(UP) ? sha(UP) : null;
W = path.join(SRC, `restauration-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}`); fs.mkdirSync(path.join(W, "data"), { recursive: true, mode: 0o700 }); fs.mkdirSync(path.join(W, "journaux"));
const log = (t) => { out(t); fs.appendFileSync(path.join(W, "RAPPORT-restauration.txt"), `${t}\n`); }; const ok = (t) => log(`✓ ${t}`);
log(`Essai de restauration — ${new Date().toISOString()}\nSauvegarde : ${SRC}\nCode de production : ${CODE} · Node ${process.version} (SQLite ${process.versions.sqlite})`);

const get = (port, p) => new Promise((resolve) => { const r = http.request({ host: "127.0.0.1", port, path: p, timeout: 15000, headers: { "x-forwarded-proto": "https" } }, (res) => { let t = ""; res.on("data", (d) => (t += d)); res.on("end", () => resolve({ status: res.statusCode, text: t })); }); r.on("error", () => resolve({ status: 0, text: "" })); r.on("timeout", () => { r.destroy(); resolve({ status: 0, text: "" }); }); r.end(); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  if (sha0 !== report.sha256) fail(`l'empreinte de copie-A.db (${sha0.slice(0, 12)}…) ne correspond pas au rapport (${String(report.sha256).slice(0, 12)}…).`); ok("Empreinte de la sauvegarde conforme à son rapport");
  fs.copyFileSync(DB, path.join(W, "data", "KOYEKOLA.db"));
  const d = new DatabaseSync(path.join(W, "data", "KOYEKOLA.db"), { readOnly: true });
  const integ = Object.values(d.prepare("PRAGMA integrity_check").get())[0]; if (integ !== "ok") fail(`integrity_check de la base restaurée : ${integ}`);
  const tables = d.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map((t) => t.name); let rows = 0; for (const t of tables) rows += d.prepare(`SELECT COUNT(*) n FROM "${t}"`).get().n; d.close();
  if (tables.length !== report.tables || rows !== report.lignes) fail(`comptes différents du rapport : ${tables.length} tables / ${rows} lignes (attendu ${report.tables} / ${report.lignes}).`);
  ok(`Base restaurée : intégrité complète ok · ${tables.length} tables · ${rows} lignes (conformes au rapport)`);
  let upn = 0;
  if (fs.existsSync(UP)) {
    const t = spawnSync("tar", ["-xzf", UP, "-C", path.join(W, "data")], { encoding: "utf8" }); if (t.status !== 0) fail(`extraction de uploads.tgz impossible : ${t.stderr}`);
    const list = spawnSync("tar", ["-tzf", UP], { encoding: "utf8" }).stdout.split("\n").filter((l) => l && !l.endsWith("/")); upn = list.length;
    const missing = list.filter((f) => !fs.existsSync(path.join(W, "data", f))); if (missing.length) fail(`${missing.length} fichier(s) de l'archive absents après extraction (ex. ${missing[0]}).`);
    ok(`uploads/ restauré : ${upn} fichier(s) extraits et présents`);
  } else log("· uploads : aucune archive dans ce dossier — la restauration des fichiers envoyés n'est PAS prouvée.");
  // code de production
  const codeDir = path.join(W, "code-production"); fs.mkdirSync(codeDir);
  const ex = spawnSync("sh", ["-c", `git -C "${ROOT}" archive ${CODE} | tar -x -C "${codeDir}"`], { encoding: "utf8" }); if (ex.status !== 0) fail(`extraction du code ${CODE} impossible : ${ex.stderr}`);
  fs.symlinkSync(NM, path.join(codeDir, "node_modules")); ok(`Code de production extrait (${CODE})`);
  const port = 3140; const logFile = fs.openSync(path.join(W, "journaux", "application.log"), "a");
  const env = { PATH: process.env.PATH, HOME: os.tmpdir(), NODE_PATH: NM, DATA_DIR: path.join(W, "data"), UPLOADS_DIR: path.join(W, "data", "uploads"), SITE_URL: "https://restauration.invalid", PORT: String(port), SMTP_HOST: "", SEO_JOBS: "off", ENCRYPTION_KEY: crypto.randomBytes(32).toString("hex"), SESSION_SECRET: crypto.randomBytes(24).toString("hex") };
  fs.mkdirSync(env.UPLOADS_DIR, { recursive: true });
  const child = spawn(process.execPath, ["server.js"], { cwd: codeDir, env, stdio: ["ignore", logFile, logFile] }); let exited = false; child.on("exit", () => { exited = true; });
  let healthy = null; for (let i = 0; i < 90 && !exited && !healthy; i++) { const r = await get(port, "/sante"); if (r.status === 200) healthy = r; else await sleep(1000); }
  try {
    if (!healthy) fail("l'application n'a pas démarré sur la base restaurée (voir journaux/application.log).");
    let j = null; try { j = JSON.parse(healthy.text); } catch { /* texte */ } if (j && j.statut && j.statut !== "ok") fail(`/sante signale : ${healthy.text.slice(0, 160)}`);
    ok(`Application démarrée sur la base restaurée : /sante = 200${j && j.statut ? ` (${j.statut})` : ""}`);
    const home = await get(port, "/"); if (!(home.status && home.status < 500)) fail(`la page d'accueil répond ${home.status}.`); ok(`Page d'accueil servie (${home.status})`);
  } finally { child.kill("SIGTERM"); for (let k = 0; k < 40 && !exited; k++) await sleep(250); if (!exited) child.kill("SIGKILL"); }
  if (sha(DB) !== sha0 || (shaUp0 && sha(UP) !== shaUp0)) fail("la sauvegarde d'origine a été modifiée pendant l'essai (ne devrait jamais arriver).");
  ok("Sauvegarde d'origine intacte (empreintes relues)");
  fs.writeFileSync(path.join(SRC, "RESTAURATION-REUSSIE.txt"), `Sauvegarde RESTAURÉE AVEC SUCCÈS — ${new Date().toISOString()}\nbase sha256 ${sha0}\n${shaUp0 ? `uploads sha256 ${shaUp0} (${upn} fichiers)` : "uploads : non inclus"}\ncode de production testé : ${CODE} · Node ${process.version}\n`);
  log("\nRÉSULTAT : RESTAURATION RÉUSSIE (RESTAURATION-REUSSIE.txt écrit)." + (shaUp0 ? "" : " Réserve : uploads/ non inclus dans cette sauvegarde."));
  process.exit(0);
})().catch((e) => fail(`erreur inattendue : ${e.stack || e.message}`));
