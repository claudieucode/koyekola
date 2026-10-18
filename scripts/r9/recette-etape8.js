#!/usr/bin/env node
// R8 — ÉTAPE 8 de la recette sur une COPIE de travail distincte : rejoue, avec les DONNÉES RÉELLES de la copie autour, les suites qui vérifient comptes et rôles, redirections, 404, réglages SEO par site, import, matrice des droits,
// états « Bientôt » et parcours navigateur, plus l'import représentatif et le contrôle d'absence d'envoi.
//   node scripts/r9/recette-etape8.js <dossier RECETTE-R8-…> --recette-autorisee [--node-modules <dossier>] [--sans-navigateur]
// Part de travail-*/copie-B.db (migrée R8) → <dossier>/etape8-<date>/seed.db (copie, + compte formateur de test) ; chaque suite lance son propre serveur local sur une copie jetable de seed.db
// (KOYEKOLA_TEST_SEED_DB) : copie-A, copie-B d'origine et la production ne sont jamais ouvertes en écriture. Sans SMTP, sans worker. Rien n'est supprimé par ce script.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const out = (t = "") => fs.writeSync(1, `${t}\n`);
const ROOT = path.resolve(__dirname, "..", "..");
const R = args[0] && !args[0].startsWith("--") ? path.resolve(args[0]) : "";
const fail = (m, c = 1) => { out(`\n✗ ARRÊT : ${m}`); process.exit(c); };
if (!R) fail("Usage : node scripts/r9/recette-etape8.js <dossier RECETTE-R8-…> --recette-autorisee", 2);
if (!args.includes("--recette-autorisee")) fail("exige --recette-autorisee.", 2);
if (!/(recette|copie)/i.test(path.basename(R))) fail("le dossier doit avoir « recette » ou « copie » dans son nom.", 2);
const NM = path.resolve(opt("--node-modules", process.env.NODE_PATH || path.join(ROOT, "node_modules"))); if (!fs.existsSync(path.join(NM, "express"))) fail(`node_modules introuvable (${NM}).`, 2);
const works = fs.readdirSync(R).filter((x) => /^travail-/.test(x) && fs.existsSync(path.join(R, x, "verdict.json"))).sort(); if (!works.length) fail("aucune recette R8 réussie dans ce dossier.", 2);
const B = path.join(R, works[works.length - 1], "copie-B.db"), A0 = path.join(R, "copie-A.db");
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"); const shaA = sha(A0), shaB = sha(B);
const W = path.join(R, `etape8-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}`); fs.mkdirSync(path.join(W, "tmp"), { recursive: true, mode: 0o700 });
const seed = path.join(W, "seed.db"); fs.copyFileSync(B, seed);
{ const d = new DatabaseSync(seed); try { d.exec("PRAGMA wal_checkpoint(TRUNCATE)"); d.exec("PRAGMA journal_mode = DELETE");
  const bcrypt = require(path.join(NM, "bcryptjs")); d.prepare("INSERT INTO users (username, email, password_hash, role) VALUES ('Prof', 'prof@test.local', ?, 'formateur')").run(bcrypt.hashSync("MotDePasseProf123", 10)); } finally { d.close(); } }
const SUITES = ["recette-r8-etape8-copie", "seo-par-site-espace", "import-par-site", "matrice-droits-espace", "site-espace", "site-manager-central", "menu-site-inventaire", "entrees-fermees-preuves", "isolation-des-sites", "navigation-par-site", "contenus-par-site-b2"];
const BROWSER = ["seo-import-par-site-navigateur", "espace-site-recette-navigateur", "site-espace-navigateur", "site-menu-c1-navigateur"];
const only = opt("--seulement", ""); const list = (only ? only.split(",") : [...SUITES, ...(args.includes("--sans-navigateur") ? [] : BROWSER)]).filter((s) => fs.existsSync(path.join(ROOT, "tests", `${s}.test.js`)));
const report = path.join(W, "RAPPORT-etape8.txt"); const log = (t) => { out(t); fs.appendFileSync(report, `${t}\n`); };
log(`Étape 8 de la recette R8 sur copie de travail — ${new Date().toISOString()}\nSource : ${path.relative(R, B)} · code : ${spawnSync("git", ["-C", ROOT, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).stdout.trim()}\nSuites : ${list.length}`);
const results = [];
for (const s of list) {
  const r = spawnSync(process.execPath, ["--test", "--test-concurrency=1", "--test-reporter=tap", path.join("tests", `${s}.test.js`)], { cwd: ROOT, encoding: "utf8", timeout: 1800000,
    env: { PATH: process.env.PATH, HOME: path.join(W, "tmp"), TMPDIR: path.join(W, "tmp"), NODE_PATH: NM, DATA_DIR: path.join(W, "outil-donnees"), UPLOADS_DIR: path.join(W, "outil-donnees", "uploads"), KOYEKOLA_TEST_SEED_DB: seed, CHROME_PATH: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } });
  fs.writeFileSync(path.join(W, `${s}.tap`), r.stdout + r.stderr);
  const n = (k) => Number((new RegExp(`^# ${k} (\\d+)`, "m").exec(r.stdout) || [0, 0])[1]); const fails = (r.stdout.match(/^\s*not ok [^\n]*/gm) || []).filter((l) => !/^not ok \d+ - /.test(l.trim()) || true);
  results.push({ suite: s, tests: n("tests"), pass: n("pass"), fail: n("fail"), cancelled: n("cancelled"), skipped: n("skipped"), code: r.status, echecs: fails.slice(0, 8).map((l) => l.trim().slice(0, 180)) });
  const x = results[results.length - 1]; log(`${x.fail || x.cancelled || x.code ? "✗" : "✓"} ${s} : ${x.pass}/${x.tests} réussis, ${x.fail} échec(s), ${x.cancelled} annulé(s), ${x.skipped} ignoré(s)${x.echecs.length ? "\n    " + x.echecs.join("\n    ") : ""}`);
}
const tot = results.reduce((a, x) => ({ tests: a.tests + x.tests, pass: a.pass + x.pass, fail: a.fail + x.fail, cancelled: a.cancelled + x.cancelled, skipped: a.skipped + x.skipped }), { tests: 0, pass: 0, fail: 0, cancelled: 0, skipped: 0 });
log(`\nTOTAL : ${tot.tests} tests, ${tot.pass} réussis, ${tot.fail} échec(s), ${tot.cancelled} annulé(s), ${tot.skipped} ignoré(s)`);
if (sha(A0) !== shaA || sha(B) !== shaB) fail("copie A ou copie B modifiée pendant l'étape 8.");
log("Copies A et B d'origine intactes (empreintes identiques).");
fs.writeFileSync(path.join(W, "verdict-etape8.json"), JSON.stringify({ date: new Date().toISOString(), source: path.relative(R, B), suites: results, total: tot }, null, 1));
process.exit(tot.fail || tot.cancelled || results.some((x) => x.code) ? 1 : 0);
