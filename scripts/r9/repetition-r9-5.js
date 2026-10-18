#!/usr/bin/env node
// R9-5 — répétition de la migration « ligne dédiée du site maître » (R9-3) et du gestionnaire (R9-4) sur une COPIE DE TRAVAIL de la copie de production (jamais la production, jamais la copie A/B d'origine).
//   node scripts/r9/repetition-r9-5.js <dossier RECETTE-R8-…> --recette-autorisee --principal <domaine> [--node-modules <dossier>]
// Part de la dernière copie « copie-B.db » migrée par la recette R8 (travail-*/copie-B.db), la clone dans <dossier>/r9-<date>/ et enchaîne, en s'arrêtant au premier écart :
// analyse d'impact (volumes réels) → préconditions → photographie du gestionnaire AVANT (code R9, sans ligne dédiée) → application R9-3 sur un clone → photographie APRÈS → retour arrière sur un clone → nouvelle application (reproductibilité) → photographies publiques avant/après → fichiers sources intacts.
// Les instances locales (127.0.0.1) tournent sans worker, e-mail ni tâches SEO ; un compte formateur de recette est ajouté aux COPIES seulement. Rien n'est supprimé. La production n'est jamais contactée.
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
const R = args[0] && !args[0].startsWith("--") ? path.resolve(args[0]) : "";
let journal = null;
const fail = (m, c = 1) => { out(`\n✗ ARRÊT : ${m}`); if (journal) fs.appendFileSync(journal, `ARRÊT : ${m}\n`); process.exit(c); };
if (!R) { out("Usage : node scripts/r9/repetition-r9-5.js <dossier RECETTE-R8-…> --recette-autorisee --principal <domaine>"); process.exit(2); }
if (!args.includes("--recette-autorisee")) fail("exige --recette-autorisee (autorisation distincte du propriétaire).", 2);
const principal = String(opt("--principal", "")).toLowerCase(); if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(principal)) fail("--principal <domaine> obligatoire.", 2);
if (!/(recette|copie)/i.test(path.basename(R))) fail("le dossier doit avoir « recette » ou « copie » dans son nom.", 2);
const NM = path.resolve(opt("--node-modules", process.env.NODE_PATH || path.join(ROOT, "node_modules")));
if (!fs.existsSync(path.join(NM, "express"))) fail(`node_modules introuvable (${NM}).`, 2);
const A0 = path.join(R, "copie-A.db"); if (!fs.existsSync(A0)) fail("copie-A.db introuvable.", 2);
const works = fs.readdirSync(R).filter((x) => /^travail-/.test(x) && fs.existsSync(path.join(R, x, "verdict.json")) && fs.existsSync(path.join(R, x, "copie-B.db"))).sort();
if (!works.length) fail("aucune recette R8 réussie (travail-*/verdict.json) dans ce dossier : la répétition R9-5 exige que la recette R8 ait réussi.", 2);
const W8 = path.join(R, works[works.length - 1]), B = path.join(W8, "copie-B.db");
const verdict = JSON.parse(fs.readFileSync(path.join(W8, "verdict.json"), "utf8")); if (!verdict.etapes || !verdict.etapes.every((e) => e.ok)) fail("le verdict de la recette R8 n'est pas entièrement réussi.", 2);
const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
const W = path.join(R, `r9-${stamp}`); if (fs.existsSync(W)) fail(`${W} existe déjà.`);
fs.mkdirSync(path.join(W, "journaux"), { recursive: true, mode: 0o700 }); journal = path.join(W, "RAPPORT-R9-5.txt");
const log = (t) => { out(t); fs.appendFileSync(journal, `${t}\n`); };
const steps = []; const ok = (n, d = "") => { steps.push({ name: n, ok: true, detail: d }); log(`✓ ${n}${d ? ` — ${d}` : ""}`); };
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const M = require("./site-maitre");
const node = (script, a) => spawnSync(process.execPath, [script, ...a], { encoding: "utf8", env: { ...process.env, NODE_PATH: NM, DATA_DIR: path.join(W, "outil-donnees") } });
const need = (r, what) => { fs.appendFileSync(journal, `--- ${what}\n${r.stdout}${r.stderr}\n`); if (r.status !== 0) fail(`${what} a échoué :\n${(r.stdout + r.stderr).trim().split("\n").slice(-10).join("\n")}`); return r.stdout; };
const normalise = (f) => { const d = new DatabaseSync(f); try { d.exec("PRAGMA wal_checkpoint(TRUNCATE)"); d.exec("PRAGMA journal_mode = DELETE"); } finally { d.close(); } };
const open = (f, ro = true) => new DatabaseSync(f, { readOnly: ro });
log(`Répétition R9-5 sur copie de travail — ${new Date().toISOString()}\nDossier : ${R}\nSource : ${path.relative(R, B)} (recette R8 réussie : ${works[works.length - 1]})\nCode R9 : ${spawnSync("git", ["-C", ROOT, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).stdout.trim()} · principal : ${principal}`);
const shaA0 = sha(A0), shaB0 = sha(B);

const get = (port, host, p, cookie = "") => new Promise((resolve) => { const r = http.request({ host: "127.0.0.1", port, path: p, headers: { Host: host, Cookie: cookie }, timeout: 15000 }, (res) => { let t = ""; res.on("data", (d) => (t += d)); res.on("end", () => resolve({ status: res.statusCode, text: t, cookies: (res.headers["set-cookie"] || []).map((c) => c.split(";")[0]) })); }); r.on("error", () => resolve({ status: 0, text: "" })); r.on("timeout", () => { r.destroy(); resolve({ status: 0, text: "" }); }); r.end(); });
const post = (port, host, p, form) => new Promise((resolve) => { const body = new URLSearchParams(form).toString(); const r = http.request({ host: "127.0.0.1", port, path: p, method: "POST", headers: { Host: host, "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 }, (res) => { res.resume(); res.on("end", () => resolve({ status: res.statusCode, cookies: (res.headers["set-cookie"] || []).map((c) => c.split(";")[0]) })); }); r.on("error", () => resolve({ status: 0, cookies: [] })); r.write(body); r.end(); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function startApp(dataDir, port, label) {
  fs.mkdirSync(path.join(dataDir, "uploads"), { recursive: true });
  const logFile = fs.openSync(path.join(W, "journaux", `${label}.log`), "a");
  const env = { PATH: process.env.PATH, HOME: os.tmpdir(), NODE_PATH: NM, DATA_DIR: dataDir, UPLOADS_DIR: path.join(dataDir, "uploads"), SITE_URL: `https://${principal}`, PORT: String(port), SMTP_HOST: "", SEO_JOBS: "off",
    ENCRYPTION_KEY: crypto.randomBytes(32).toString("hex"), SESSION_SECRET: crypto.randomBytes(24).toString("hex"), ALLOW_INDEXING: "1" };
  const child = spawn(process.execPath, ["server.js"], { cwd: ROOT, env, stdio: ["ignore", logFile, logFile] });
  let exited = false; child.on("exit", () => { exited = true; });
  for (let i = 0; i < 90 && !exited; i++) { const r = await get(port, principal, "/"); if (r.status && r.status < 500) return { stop: async () => { child.kill("SIGTERM"); for (let k = 0; k < 40 && !exited; k++) await sleep(250); if (!exited) child.kill("SIGKILL"); } }; await sleep(1000); }
  child.kill("SIGKILL"); fail(`l'instance « ${label} » n'a pas démarré (voir journaux/${label}.log).`);
}
const PASSWORD = crypto.randomBytes(12).toString("hex"), EMAIL = "recette-r9@recette.local";
function addRecetteAccount(file) { // compte formateur de recette dans la COPIE de travail seulement
  const bcrypt = require(path.join(NM, "bcryptjs")); const d = new DatabaseSync(file);
  try { d.prepare("INSERT INTO users (username, email, password_hash, role) VALUES ('recette-r9', ?, ?, 'formateur')").run(EMAIL, bcrypt.hashSync(PASSWORD, 10)); } finally { d.close(); }
}
const URLS = ["/marketing/site-web/sites", "/marketing/site-web/principal/tableau-de-bord", "/marketing/contacts", "/marketing/listes", "/marketing/campagnes", "/marketing/site-web/mediatheque", "/marketing/site-web/navigation", "/marketing/automatisations",
  "/marketing/tunnels", "/marketing/modeles", "/marketing/segments", "/marketing/site-web/tests-ab", "/marketing/importer", "/marketing"];
async function snapshot(dataDir, port, label) {
  addRecetteAccount(path.join(dataDir, "KOYEKOLA.db")); const app = await startApp(dataDir, port, label);
  try {
    const login = await post(port, principal, "/connexion", { email: EMAIL, password: PASSWORD }); if (login.status !== 302) fail(`connexion de recette refusée (${login.status}).`);
    const cookie = login.cookies.join("; "); const o = { pages: {}, gestionnaire: null };
    for (const u of URLS) { const r = await get(port, principal, u, cookie); o.pages[u] = [r.status, (r.text.match(/Site principal/g) || []).length]; if (u === "/marketing/site-web/sites") { const rows = [...r.text.matchAll(/<tr data-site="([^"]+)"/g)].map((m) => m[1]); o.gestionnaire = { lignes: rows, stats: (r.text.match(/<span class="mk-stat-value">[^<]*<\/span>/g) || []).join("") }; } }
    const sitesIds = o.gestionnaire.lignes.filter((x) => x !== "principal");
    for (const id of sitesIds) { const r = await get(port, principal, `/marketing/site-web/sites/${id}/tableau-de-bord`, cookie); o.pages[`site ${id}`] = [r.status, (r.text.match(/Site principal/g) || []).length]; }
    return o;
  } finally { await app.stop(); }
}
const photos = async (dataDir, port, label, file, hosts, paths) => {
  const app = await startApp(dataDir, port, label);
  try { need(node(path.join(ROOT, "scripts", "recette-r8-captures.js"), ["capture", `http://127.0.0.1:${port}`, file, ...hosts.flatMap((h) => ["--host", h]), ...paths.flatMap((p) => ["--path", p])]), `photographies ${path.basename(file)}`); } finally { await app.stop(); }
};

(async () => {
  // 0. clone de travail
  const base = path.join(W, "copie-R9-base.db"); fs.copyFileSync(B, base); normalise(base);
  ok("Copie de travail créée à partir de la copie B migrée par la recette R8", `sha256 B ${shaB0.slice(0, 16)}…`);
  // 1. analyse d'impact (volumes réels)
  const aJson = path.join(W, "analyse-avant.json"); const an = need(node(path.join(ROOT, "scripts", "r9-analyse-site-maitre.js"), [base, "--json", aJson]), "analyse d'impact"); const A1 = JSON.parse(fs.readFileSync(aJson, "utf8"));
  ok("Analyse d'impact sur les volumes réels", `${A1.resume.tablesAvecSiteId} tables avec site_id, ${A1.resume.lignesSiteMaitre} ligne(s) « site maître » (NULL) dans ${A1.resume.tablesAvecLignesSiteMaitre} table(s), ${A1.resume.indexCoalesce} index COALESCE, ${A1.resume.declencheurs} déclencheurs`);
  fs.appendFileSync(journal, an + "\n");
  // 2. préconditions R9-3
  const pre = node(path.join(ROOT, "scripts", "r9-migrer-site-maitre.js"), ["prerequis", base, "--copie-confirmee"]); fs.appendFileSync(journal, pre.stdout + pre.stderr);
  if (pre.status !== 0) fail(`préconditions R9-3 non satisfaites sur la copie réelle :\n${pre.stdout.trim()}`);
  ok("Préconditions R9-3 satisfaites sur les données réelles", pre.stdout.split("\n").filter((l) => /sites existants/.test(l)).join(" ").trim());
  // 3. photographie AVANT (code R9, sans ligne dédiée)
  const dAv = path.join(W, "dataAvant"); fs.mkdirSync(dAv); fs.copyFileSync(base, path.join(dAv, "KOYEKOLA.db")); const sAvant = await snapshot(dAv, 3131, "r9-avant");
  if (sAvant.gestionnaire.lignes.filter((x) => x === "principal").length !== 1) fail("sans ligne dédiée : le gestionnaire n'affiche pas une seule entrée « principal ».");
  ok("Gestionnaire AVANT (code R9, sans ligne dédiée)", `entrées : ${sAvant.gestionnaire.lignes.join(", ")}`);
  // 4. application R9-3 sur un clone
  const applied = path.join(W, "copie-R9-appliquee.db"); fs.copyFileSync(base, applied);
  const ap = need(node(path.join(ROOT, "scripts", "r9-migrer-site-maitre.js"), ["appliquer", applied, "--copie-confirmee"]), "application R9-3"); ok("Migration R9-3 appliquée sur la copie de travail", ap.trim().split("\n").pop());
  const aJson2 = path.join(W, "analyse-apres.json"); need(node(path.join(ROOT, "scripts", "r9-analyse-site-maitre.js"), [applied, "--json", aJson2]), "analyse après"); const A2 = JSON.parse(fs.readFileSync(aJson2, "utf8"));
  const diffs = A1.tables.filter((t) => { const u = A2.tables.find((x) => x.table === t.table); return !u || u.lignes !== t.lignes || u.siteMaitre !== t.siteMaitre; });
  if (diffs.length) fail(`lignes ou lignes « site maître » modifiées par la migration dans : ${diffs.map((t) => t.table).join(", ")}`);
  const d0 = open(base), d1 = open(applied);
  const prim = d1.prepare("SELECT id FROM mk_sites WHERE is_primary = 1").get().id; let refs = 0; for (const [t, c] of M.siteColumns(d1)) refs += d1.prepare(`SELECT COUNT(*) n FROM "${t}" WHERE "${c}" = ?`).get(prim).n;
  const sec0 = JSON.stringify(M.secondaries(d0)), sec1 = JSON.stringify(M.secondaries(d1)); d0.close(); d1.close();
  if (refs) fail(`${refs} ligne(s) référencent la ligne dédiée (attendu 0).`); if (sec0 !== sec1) fail("les lignes des sites ordinaires ont changé.");
  ok("Données : aucune ligne modifiée, contenus historiques à NULL conservés, sites ordinaires identiques, rien ne référence la ligne dédiée", `${A2.tables.length} tables comparées`);
  // 5. photographie APRÈS
  const dAp = path.join(W, "dataApres"); fs.mkdirSync(dAp); fs.copyFileSync(applied, path.join(dAp, "KOYEKOLA.db")); const sApres = await snapshot(dAp, 3132, "r9-apres");
  if (JSON.stringify(sApres.gestionnaire.lignes) !== JSON.stringify(sAvant.gestionnaire.lignes)) fail(`entrées du gestionnaire différentes : ${sAvant.gestionnaire.lignes} → ${sApres.gestionnaire.lignes}`);
  if (sApres.gestionnaire.stats !== sAvant.gestionnaire.stats) fail("chiffres du gestionnaire différents après migration.");
  const pd = Object.keys(sAvant.pages).filter((u) => JSON.stringify(sAvant.pages[u]) !== JSON.stringify(sApres.pages[u])); if (pd.length) fail(`écrans différents avant/après : ${pd.join(", ")}`);
  ok("Gestionnaire APRÈS : une seule entrée du principal, mêmes sites, mêmes chiffres, mêmes statuts sur " + Object.keys(sAvant.pages).length + " écrans", `entrées : ${sApres.gestionnaire.lignes.join(", ")}`);
  // 6. photographies publiques avant / après sur le domaine principal
  const avant8 = JSON.parse(fs.readFileSync(path.join(W8, "avant.json"), "utf8")); const hosts = Object.keys(avant8); const paths = Object.keys(avant8[hosts[0]]);
  const f1 = path.join(W, "publiques-avant.json"), f2 = path.join(W, "publiques-apres.json");
  await photos(dAv, 3133, "r9-photos-avant", f1, hosts, paths); await photos(dAp, 3134, "r9-photos-apres", f2, hosts, paths);
  const cmp = node(path.join(ROOT, "scripts", "recette-r8-captures.js"), ["comparer", f1, f2, "--hote-principal", principal]); fs.appendFileSync(journal, cmp.stdout);
  if (cmp.status !== 0) fail(`différences sur les pages publiques après la migration R9-3 :\n${cmp.stdout.slice(0, 800)}`);
  ok("Pages publiques identiques avant / après la migration R9-3", `${hosts.length} hôte(s) × ${paths.length} chemin(s)`);
  // 7. retour arrière puis nouvelle application
  const back = path.join(W, "copie-R9-retour.db"); fs.copyFileSync(applied, back);
  need(node(path.join(ROOT, "scripts", "r9-migrer-site-maitre.js"), ["retour", back, "--copie-confirmee"]), "retour arrière R9-3");
  const sigBase = (() => { const d = open(base); try { return M.signature(d); } finally { d.close(); } })(), dBack = open(back), sigBack = M.signature(dBack), cBack = M.tableCounts(dBack); dBack.close();
  const dB = open(base), cBase = M.tableCounts(dB); dB.close();
  if (sigBack !== sigBase) fail("structure après retour arrière différente de l'état initial."); if (JSON.stringify(cBack) !== JSON.stringify(cBase)) fail("comptes de lignes après retour arrière différents de l'état initial.");
  ok("Retour arrière : structure (colonnes, index, déclencheurs) et comptes de toutes les tables identiques à l'état initial", `${Object.keys(cBase).length} tables`);
  const again = path.join(W, "copie-R9-reapplication.db"); fs.copyFileSync(back, again);
  need(node(path.join(ROOT, "scripts", "r9-migrer-site-maitre.js"), ["appliquer", again, "--copie-confirmee"]), "nouvelle application R9-3");
  const dA = open(applied), dR = open(again); const sigA = M.signature(dA), sigR = M.signature(dR), idA = dA.prepare("SELECT id FROM mk_sites WHERE is_primary = 1").get().id, idR = dR.prepare("SELECT id FROM mk_sites WHERE is_primary = 1").get().id; dA.close(); dR.close();
  if (sigA !== sigR || idA !== idR) fail("la nouvelle application après retour arrière ne reproduit pas l'état migré (structure ou identifiant).");
  ok("Nouvelle application après retour arrière : état identique à la première application", `ligne dédiée n° ${idR} les deux fois`);
  // 8. sources intactes
  if (sha(A0) !== shaA0 || sha(B) !== shaB0) fail("copie A ou copie B modifiée pendant la répétition.");
  ok("Copies A et B d'origine intactes (empreintes identiques)");
  log("\nVERDICT AUTOMATIQUE : RÉPÉTITION R9-5 RÉUSSIE sur la copie de production (copies de travail isolées).\nNON couvert : décisions D1/D2, parcours avec rôles multiples, retour arrière APRÈS usage de la ligne dédiée par des données (refus testé sur bases synthétiques). Pas de push, fusion, déploiement ni migration de production.");
  fs.writeFileSync(path.join(W, "verdict-R9-5.json"), JSON.stringify({ date: new Date().toISOString(), source: path.relative(R, B), etapes: steps, gestionnaire: sApres.gestionnaire.lignes, volumes: A1.resume }, null, 1));
  process.exit(0);
})().catch((e) => fail(`erreur inattendue : ${e.stack || e.message}`));
