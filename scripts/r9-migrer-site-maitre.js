#!/usr/bin/env node
// R9-3 — ligne dédiée du site maître (option B, étape 1) sur une COPIE de base — jamais sur la base vivante.
//   node scripts/r9-migrer-site-maitre.js etat      <copie.db> --copie-confirmee    (lecture seule : appliquée ou non, cohérence, signature de structure)
//   node scripts/r9-migrer-site-maitre.js prerequis <copie.db> --copie-confirmee    (lecture seule : bloquants et avertissements)
//   node scripts/r9-migrer-site-maitre.js appliquer <copie.db> --copie-confirmee    (transaction unique, contrôles internes, tout ou rien)
//   node scripts/r9-migrer-site-maitre.js retour    <copie.db> --copie-confirmee    (refuse si des données référencent le principal ou si sa ligne a été modifiée)
// Mêmes garde-fous que scripts/recette-r8-copie.js : --copie-confirmee obligatoire ; refuse la base vivante de l'application, un nom de fichier qui ne dit pas copie/recette/jetable/essai, un -wal/-shm non vide, le dossier de données de l'application.
//   node scripts/r9-migrer-site-maitre.js appliquer-reel|retour-reel <base-reelle.db> --base-reelle-confirmee --application-arretee --sauvegarde <sauvegarde.db>
//     (PRODUCTION — réservé à l'étape de déploiement, après autorisation explicite : exige l'application ARRÊTÉE (aucun -wal actif), une sauvegarde RÉCENTE et saine de la même base (intégrité complète, mêmes comptes de lignes clés), les mêmes préconditions ; transaction unique, tout ou rien)
// Cette migration n'est PAS dans src/marketing/migrations : l'application ne l'applique jamais d'elle-même.
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const out = (t) => fs.writeSync(1, `${t}\n`), err = (t) => fs.writeSync(2, `${t}\n`);
const die = (m, c = 2) => { err(m); process.exit(c); };
const [cmd, fileArg] = process.argv.slice(2);
const REEL = cmd === "appliquer-reel" || cmd === "retour-reel";
if (REEL) realMode();
if (!["etat", "prerequis", "appliquer", "retour"].includes(cmd) || !fileArg) die("Usage : node scripts/r9-migrer-site-maitre.js <etat|prerequis|appliquer|retour> <copie.db> --copie-confirmee");
if (!process.argv.includes("--copie-confirmee")) die("Refus : ajoutez --copie-confirmee pour certifier que ce fichier est une COPIE jetable (jamais la base vivante).");
const file = path.resolve(fileArg);
if (!fs.existsSync(file)) die(`Fichier introuvable : ${file}`);
const live = require("../src/config/paths").dbFile;
if (path.resolve(live) === file) die("Refus : c'est la base vivante de l'application.");
if (!/(copie|recette|jetable|essai)/i.test(path.basename(file))) die(`Refus : le nom « ${path.basename(file)} » ne désigne pas une copie (attendu : copie, recette, jetable ou essai).`);
for (const ext of ["-wal", "-shm"]) { try { if (fs.statSync(file + ext).size > 0) die(`Refus : ${path.basename(file)}${ext} n'est pas vide — la base est ouverte par une application.`); } catch (e) { if (e.code !== "ENOENT") throw e; } }
const liveDir = path.resolve(path.dirname(live));
if (file === liveDir || file.startsWith(liveDir + path.sep)) die(`Refus : le fichier est dans le dossier de données de l'application (${liveDir}).`);

const m = require("./r9/site-maitre");
const db = new DatabaseSync(file, { readOnly: cmd === "etat" || cmd === "prerequis" });
db.exec("PRAGMA foreign_keys = ON");
try {
  if (cmd === "etat") { const e = m.etat(db); out(`Appliquée : ${e.appliquee ? "oui" : "non"} · cohérente : ${e.coherent ? "oui" : "NON"}${e.principal ? ` · site principal n° ${e.principal.id}` : ""}\nSignature de structure : ${e.signature.slice(0, 16)}…`); process.exit(e.coherent ? 0 : 1); }
  if (cmd === "prerequis") { const p = m.prerequis(db); out([...p.info.map((x) => `  · ${x}`), ...p.warnings.map((x) => `  ! ${x}`), ...p.blocking.map((x) => `  ✗ BLOQUANT : ${x}`)].join("\n")); out(p.ok ? "\nRÉSULTAT : préconditions satisfaites." : "\nRÉSULTAT : NE PAS APPLIQUER."); process.exit(p.ok ? 0 : 1); }
  if (cmd === "appliquer") { const r = m.appliquer(db); out(`Appliquée : site principal n° ${r.primaryId} créé · ${r.declencheursAjoutes} déclencheur(s) et ${r.ajoutes} index ajouté(s) · lignes des sites ordinaires inchangées · intégrité et clés étrangères ok.`); }
  if (cmd === "retour") { const r = m.retour(db); out(`Retour arrière effectué : site principal n° ${r.retire} retiré · lignes des sites ordinaires inchangées · intégrité et clés étrangères ok.`); }
} catch (e) { err(e.message); process.exit(1); }

// Mode PRODUCTION : garde-fous propres (les commandes ci-dessus refusent toujours la base vivante)
function realMode() {
  const flag = (n) => process.argv.includes(n); const opt = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };
  if (!fileArg) die("Usage : appliquer-reel|retour-reel <base-reelle.db> --base-reelle-confirmee --application-arretee --sauvegarde <sauvegarde.db>");
  if (!flag("--base-reelle-confirmee")) die("Refus : ajoutez --base-reelle-confirmee (vous confirmez que c'est bien la base de PRODUCTION et que le déploiement est autorisé).");
  if (!flag("--application-arretee")) die("Refus : ajoutez --application-arretee (vous confirmez que l'application est ARRÊTÉE : aucun processus ne doit écrire dans la base pendant la migration).");
  const db_ = path.resolve(fileArg); if (!fs.existsSync(db_)) die(`Base introuvable : ${db_}`);
  for (const ext of ["-wal", "-journal"]) { try { if (fs.statSync(db_ + ext).size > 0) die(`Refus : ${path.basename(db_)}${ext} n'est pas vide — la base est encore utilisée (application non arrêtée ?).`); } catch (e) { if (e.code !== "ENOENT") throw e; } }
  const bk = opt("--sauvegarde"); if (!bk) die("Refus : --sauvegarde <fichier.db> obligatoire (copie saine et récente de CETTE base, faite application arrêtée ou par VACUUM INTO).");
  const bkp = path.resolve(bk); if (bkp === db_) die("Refus : la sauvegarde doit être un AUTRE fichier que la base."); if (!fs.existsSync(bkp)) die(`Sauvegarde introuvable : ${bkp}`);
  const st = fs.statSync(bkp); if (st.size === 0) die("Refus : la sauvegarde fait 0 octet."); if (Date.now() - st.mtimeMs > 6 * 3600 * 1000) die("Refus : la sauvegarde date de plus de 6 heures ; refaites-la juste avant la migration.");
  const fd = fs.openSync(bkp, "r"); const head = Buffer.alloc(16); fs.readSync(fd, head, 0, 16, 0); fs.closeSync(fd); if (head.toString("latin1") !== "SQLite format 3\0") die("Refus : la sauvegarde n'est pas une base SQLite.");
  const live = new DatabaseSync(db_), save = new DatabaseSync(bkp, { readOnly: true });
  try {
    const integ = Object.values(save.prepare("PRAGMA integrity_check").get())[0]; if (integ !== "ok") die(`Refus : la sauvegarde échoue à integrity_check (${String(integ).slice(0, 80)}).`);
    const tables = (d) => d.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((t) => t.name);
    const tl = tables(live), ts = tables(save); if (JSON.stringify(tl) !== JSON.stringify(ts)) die(`Refus : la sauvegarde n'a pas les mêmes tables que la base (${tl.length} ≠ ${ts.length}).`);
    for (const t of ["users", "mk_sites", "mk_contacts", "mk_landing_pages", "schema_migrations"]) if (tl.includes(t)) { const a = live.prepare(`SELECT COUNT(*) n FROM "${t}"`).get().n, b = save.prepare(`SELECT COUNT(*) n FROM "${t}"`).get().n; if (a !== b) die(`Refus : la sauvegarde ne correspond pas à la base (${t} : ${b} lignes ≠ ${a}). Refaites-la application arrêtée.`); }
    const sha = require("node:crypto").createHash("sha256").update(fs.readFileSync(bkp)).digest("hex"); out(`Sauvegarde contrôlée : ${path.basename(bkp)} · ${tl.length} tables · intégrité ok · sha256 ${sha.slice(0, 16)}…`);
    live.exec("PRAGMA foreign_keys = ON"); live.exec("PRAGMA busy_timeout = 5000");
    const m = require("./r9/site-maitre");
    if (cmd === "appliquer-reel") { const r = m.appliquer(live); out(`PRODUCTION — migration R9-3 appliquée : site principal n° ${r.primaryId} créé · sites ordinaires et données inchangés · intégrité et clés étrangères ok.\nÉtape suivante : redémarrer l'application, puis les contrôles post-déploiement.`); }
    else { const r = m.retour(live); out(`PRODUCTION — retour arrière R9-3 effectué : site principal n° ${r.retire} retiré · intégrité ok.`); }
  } catch (e) { err(e.message); process.exit(1); } finally { try { live.close(); save.close(); } catch { /* déjà fermées */ } }
  process.exit(0);
}
