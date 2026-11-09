#!/usr/bin/env node
// Contrôle rapide avant d'envoyer du code (chantier « surveillance de la qualité »). Dure quelques minutes, tourne sur cette machine : il ne dépend ni de GitHub Actions
// (arrêté tant que la facturation GitHub est en échec) ni d'un navigateur. Il attrape les erreurs qui ont déjà cassé le site : fichier JavaScript invalide, vue EJS qui ne compile
// plus, enveloppe de l'en-tête perdue, état d'en-tête supprimé, collision de conditions.
//   node scripts/controle-rapide.js            vérifications de fichiers + tests ciblés (sans navigateur)
//   node scripts/controle-rapide.js --navigateur   ajoute quelques parcours Chrome (plus long)
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const root = path.join(__dirname, "..");
const args = new Set(process.argv.slice(2));
const problemes = [];
const ok = (m) => console.log(`  ✔ ${m}`);
const ko = (m) => { problemes.push(m); console.log(`  ✖ ${m}`); };

const walk = (dir, ext, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "tests", ".claude"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out); else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
};

console.log("1. Fichiers JavaScript valides");
{
  const files = [...walk(path.join(root, "src"), ".js").filter((f) => !f.includes(`${path.sep}src${path.sep}editor${path.sep}`)), ...walk(path.join(root, "public/js"), ".js"), ...walk(path.join(root, "scripts"), ".js"), path.join(root, "server.js")].filter((f) => fs.existsSync(f) && !/\.min\.js$/.test(f) && !/public\/js\/(blog-editor|course-editor|theme-code-editor|seo-fun)\.js$/.test(f));
  // Compilation en mémoire (sans lancer un processus par fichier) : rapide même sur une machine chargée
  const vm = require("vm");
  let bad = 0;
  for (const f of files) {
    let code = fs.readFileSync(f, "utf8"); if (code.startsWith("#!")) code = "//" + code;
    try { new vm.Script(`(function (exports, require, module, __filename, __dirname) {${code}\n})`, { filename: f }); }
    catch (e) { bad++; ko(`${path.relative(root, f)} : ${String(e.message).slice(0, 140)}`); }
  }
  if (!bad) ok(`${files.length} fichiers`);
}

console.log("2. Vues EJS qui compilent");
{
  const ejs = require("ejs");
  const files = walk(path.join(root, "views"), ".ejs");
  let bad = 0;
  for (const f of files) { try { ejs.compile(fs.readFileSync(f, "utf8"), { filename: f }); } catch (e) { bad++; ko(`${path.relative(root, f)} : ${String(e.message).split("\n")[0].slice(0, 160)}`); } }
  if (!bad) ok(`${files.length} vues`);
}

console.log("3. Moteur de styles : les états d'en-tête existent toujours");
{
  const n = require(path.join(root, "src/marketing/pages/nodes.js"));
  const keys = n.editorSpec().states.map((s) => s.key);
  for (const k of ["hover", "focus", "active", "scrolled", "menuOpen"]) if (!keys.includes(k)) ko(`état « ${k} » absent du moteur de styles`);
  if (["scrolled", "menuOpen"].every((k) => keys.includes(k))) ok("survol, focus, clic, après défilement, menu ouvert");
  const hs = require(path.join(root, "src/marketing/pages/headerSettings.js"));
  const cls = hs.classes({ header: { mode: "sticky" } });
  if (/kw-theme-sticky/.test(cls)) ok("réglages d'en-tête lus (collé)"); else ko("réglages d'en-tête : la classe « collé » n'est plus produite");
}

const tests = ["header-reglages", "header-widgets", "header-visiteur", "footer-conditions", "isolation-conteneur", "theme-builder-en-tete-collant-public"];
const navigateur = ["header-etats-navigateur", "header-panneau-navigateur", "footer-panneau-navigateur"];
console.log(`4. Tests ciblés (${tests.length}${args.has("--navigateur") ? ` + ${navigateur.length} parcours Chrome` : ""})`);
for (const t of [...tests, ...(args.has("--navigateur") ? navigateur : [])]) {
  const f = path.join(root, "tests", `${t}.test.js`);
  if (!fs.existsSync(f)) { console.log(`  - ${t} : absent (ignoré)`); continue; }
  const r = spawnSync(process.execPath, ["--test", "--test-timeout=280000", f], { encoding: "utf8", env: { ...process.env, TEST_START_TIMEOUT_MS: process.env.TEST_START_TIMEOUT_MS || "300000" } });
  const out = `${r.stdout}\n${r.stderr}`;
  const pass = (out.match(/^ℹ pass (\d+)/m) || [])[1], fail = (out.match(/^ℹ fail (\d+)/m) || [])[1];
  const annules = (out.match(/^ℹ cancelled (\d+)/m) || [])[1];
  if (fail === "0" && pass && pass !== "0" && (!annules || annules === "0")) ok(`${t} : ${pass} réussis`);
  else ko(`${t} : ${fail === undefined || !pass || pass === "0" ? "aucun test n'a pu s'exécuter (machine surchargée ? relancer)" : fail !== "0" ? fail + " en échec" : annules + " annulé(s)"}`);
}

console.log(problemes.length ? `\nÀ CORRIGER AVANT D'ENVOYER (${problemes.length}) :\n- ${problemes.join("\n- ")}` : "\nTout est au vert : vous pouvez envoyer.");
process.exit(problemes.length ? 1 : 0);
