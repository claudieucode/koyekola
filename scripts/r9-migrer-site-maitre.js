#!/usr/bin/env node
// R9-3 — ligne dédiée du site maître (option B, étape 1) sur une COPIE de base — jamais sur la base vivante.
//   node scripts/r9-migrer-site-maitre.js etat      <copie.db> --copie-confirmee    (lecture seule : appliquée ou non, cohérence, signature de structure)
//   node scripts/r9-migrer-site-maitre.js prerequis <copie.db> --copie-confirmee    (lecture seule : bloquants et avertissements)
//   node scripts/r9-migrer-site-maitre.js appliquer <copie.db> --copie-confirmee    (transaction unique, contrôles internes, tout ou rien)
//   node scripts/r9-migrer-site-maitre.js retour    <copie.db> --copie-confirmee    (refuse si des données référencent le principal ou si sa ligne a été modifiée)
// Mêmes garde-fous que scripts/recette-r8-copie.js : --copie-confirmee obligatoire ; refuse la base vivante de l'application, un nom de fichier qui ne dit pas copie/recette/jetable/essai, un -wal/-shm non vide, le dossier de données de l'application.
// Cette migration n'est PAS dans src/marketing/migrations : l'application ne l'applique jamais d'elle-même.
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const out = (t) => fs.writeSync(1, `${t}\n`), err = (t) => fs.writeSync(2, `${t}\n`);
const die = (m, c = 2) => { err(m); process.exit(c); };
const [cmd, fileArg] = process.argv.slice(2);
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
