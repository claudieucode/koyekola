#!/usr/bin/env node
// Démonstration LOCALE du gestionnaire central de sites KOLAKISA (vrai code de l'application, base de démonstration FICTIVE, aucune connexion à la production).
//   node scripts/demo-gestionnaire.js [--port 3210] [--dossier <nouveau dossier>] [--node-modules <dossier>] [--avec-ligne-principale]
// --avec-ligne-principale : applique, sur la base de démonstration fictive SEULEMENT, la migration R9-3 (ligne dédiée du site principal) pour montrer le gestionnaire tel qu'il sera après R9.
// Crée un dossier de données NEUF (refuse un dossier qui existe déjà et n'est pas vide ; ne supprime rien), y prépare un compte formateur de démonstration, un site principal avec quelques pages
// et trois sites fictifs, puis lance l'application sur http://127.0.0.1:<port>. Sans worker, sans e-mail, sans tâches SEO. Arrêt : Ctrl+C.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const out = (t = "") => fs.writeSync(1, `${t}\n`);
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(opt("--port", 3210));
const DIR = path.resolve(opt("--dossier", path.join(os.homedir(), "KOLAKISA-demo-gestionnaire")));
const NM = path.resolve(opt("--node-modules", process.env.NODE_PATH || path.join(ROOT, "node_modules")));
const EMAIL = "demo@kolakisa.local", PASSWORD = "Demo-Kolakisa-2026";   // compte FICTIF, valable uniquement dans cette démonstration locale
if (!fs.existsSync(path.join(NM, "express"))) { out(`node_modules introuvable (${NM}) : indiquez --node-modules <dossier>.`); process.exit(2); }
if (fs.existsSync(DIR) && fs.readdirSync(DIR).length) { out(`Refus : ${DIR} existe déjà et n'est pas vide (rien n'est supprimé). Choisissez un autre dossier avec --dossier.`); process.exit(2); }
fs.mkdirSync(path.join(DIR, "donnees", "uploads"), { recursive: true, mode: 0o700 });
const base = `http://127.0.0.1:${PORT}`;

const request = (method, p, { form = null, cookie = "" } = {}) => new Promise((resolve, reject) => {
  const body = form ? new URLSearchParams(form).toString() : "";
  const r = http.request({ host: "127.0.0.1", port: PORT, path: p, method, headers: { Cookie: cookie, ...(form ? { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) } : {}) } }, (res) => {
    let t = ""; res.on("data", (d) => (t += d)); res.on("end", () => resolve({ status: res.statusCode, text: t, location: res.headers.location || "", cookies: (res.headers["set-cookie"] || []).map((c) => c.split(";")[0]) }));
  });
  r.on("error", reject); if (body) r.write(body); r.end();
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const env = { PATH: process.env.PATH, HOME: os.tmpdir(), NODE_PATH: NM, DATA_DIR: path.join(DIR, "donnees"), UPLOADS_DIR: path.join(DIR, "donnees", "uploads"), PORT: String(PORT), SITE_URL: base,
    SMTP_HOST: "", SEO_JOBS: "off", ENCRYPTION_KEY: crypto.randomBytes(32).toString("hex"), SESSION_SECRET: crypto.randomBytes(24).toString("hex"), FORMATEUR_EMAIL: EMAIL, FORMATEUR_USERNAME: "demo", FORMATEUR_PASSWORD: PASSWORD };
  const logFile = fs.openSync(path.join(DIR, "serveur.log"), "a");
  const child = spawn(process.execPath, ["server.js"], { cwd: ROOT, env, stdio: ["ignore", logFile, logFile] });
  process.on("SIGINT", () => { child.kill("SIGTERM"); setTimeout(() => process.exit(0), 500); }); process.on("SIGTERM", () => { child.kill("SIGTERM"); setTimeout(() => process.exit(0), 500); });
  child.on("exit", (c) => { out(`Le serveur s'est arrêté (code ${c}). Journal : ${path.join(DIR, "serveur.log")}`); process.exit(c || 0); });
  let up = false; for (let i = 0; i < 90 && !up; i++) { const r = await request("GET", "/connexion").catch(() => null); up = Boolean(r && r.status < 500); if (!up) await sleep(1000); }
  if (!up) { out("Le serveur n'a pas démarré (voir serveur.log)."); child.kill("SIGTERM"); process.exit(1); }
  // connexion du compte de démonstration, création des trois sites par l'interface réelle
  const login = await request("POST", "/connexion", { form: { email: EMAIL, password: PASSWORD } });
  const cookie = login.cookies.join("; ");
  if (login.status !== 302) { out(`Connexion de démonstration refusée (${login.status}).`); child.kill("SIGTERM"); process.exit(1); }
  const ids = {};
  for (const name of ["Boutique Lumière", "Académie Horizon", "Studio Nord"]) { const r = await request("POST", "/marketing/site-web/sites", { form: { name }, cookie }); const m = String(r.location).match(/sites\/(\d+)/); if (!m) { out(`Création du site « ${name} » refusée (${r.status}).`); child.kill("SIGTERM"); process.exit(1); } ids[name] = Number(m[1]); }
  const db = new DatabaseSync(path.join(DIR, "donnees", "KOYEKOLA.db"));
  db.exec("PRAGMA busy_timeout = 5000");
  const org = db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get().id;
  const page = (site, slug, title, status = "published") => db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, indexable, seo) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 1, '{}')").run(org, title, slug, title, status, site);
  for (const [slug, title, st] of [["accueil-principal", "Accueil KOLAKISA", "published"], ["offres", "Nos offres", "published"], ["a-propos-demo", "À propos", "published"], ["brouillon-principal", "Brouillon", "draft"]]) page(null, slug, title, st);
  for (const [slug, title] of [["boutique-accueil", "Accueil Boutique"], ["boutique-nouveautes", "Nouveautés"]]) page(ids["Boutique Lumière"], slug, title);
  for (const [slug, title] of [["academie-accueil", "Accueil Académie"], ["academie-programme", "Programme"], ["academie-contact", "Contact"]]) page(ids["Académie Horizon"], slug, title);
  page(ids["Studio Nord"], "studio-accueil", "Accueil Studio");
  const contact = (email, site) => db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (?, ?, 'Démo', ?)").run(org, email, site);
  ["a", "b", "c", "d", "e"].forEach((x) => contact(`principal-${x}@demo.local`, null)); ["a", "b", "c"].forEach((x) => contact(`boutique-${x}@demo.local`, ids["Boutique Lumière"])); ["a", "b"].forEach((x) => contact(`academie-${x}@demo.local`, ids["Académie Horizon"]));
  if (args.includes("--avec-ligne-principale")) { db.exec("PRAGMA foreign_keys = ON"); const r = require("./r9/site-maitre").appliquer(db); out(`Ligne dédiée du site principal créée (n° ${r.primaryId}) — base de démonstration uniquement.`); }
  db.close();
  out(`\nDÉMONSTRATION PRÊTE (base fictive, aucune connexion à la production)\n  Adresse : ${base}/marketing/site-web/sites\n  Connexion : ${base}/connexion\n  Compte    : ${EMAIL}\n  Mot de passe : ${PASSWORD}   (compte fictif de démonstration)\n  Dossier de données : ${DIR}\n  Arrêt : Ctrl+C`);
})().catch((e) => { out(`Erreur : ${e.message}`); process.exit(1); });
