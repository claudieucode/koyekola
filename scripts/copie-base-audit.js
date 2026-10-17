#!/usr/bin/env node
// Copie fidèle et cohérente d'une base SQLite pour l'auditer SANS jamais toucher à l'originale (palier 2).
//   node scripts/copie-base-audit.js <base-source.db> <copie.db>
// La source n'est ouverte qu'en LECTURE SEULE ; la copie est faite par VACUUM INTO (cohérente même si la base est en cours d'utilisation),
// refuse d'écraser un fichier existant et est vérifiée (PRAGMA integrity_check + même nombre de lignes dans chaque table).
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const [src, dst] = process.argv.slice(2).map((p) => (p ? path.resolve(p) : ""));
if (!src || !dst) { console.error("Usage : node scripts/copie-base-audit.js <base-source.db> <copie.db>"); process.exit(2); }
if (src === dst) { console.error("La copie doit être un AUTRE fichier que la source."); process.exit(2); }
if (!fs.existsSync(src)) { console.error(`Source introuvable : ${src}`); process.exit(2); }
if (fs.existsSync(dst)) { console.error(`Refus d'écraser : ${dst} existe déjà.`); process.exit(2); }

const source = new DatabaseSync(src, { readOnly: true });
source.exec(`VACUUM INTO '${dst.replace(/'/g, "''")}'`);
source.close();

const a = new DatabaseSync(src, { readOnly: true });
const b = new DatabaseSync(dst, { readOnly: true });
const check = b.prepare("PRAGMA integrity_check").get();
const tables = a.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((t) => t.name);
let diff = 0;
for (const t of tables) {
  const n1 = a.prepare(`SELECT COUNT(*) n FROM "${t}"`).get().n;
  const n2 = b.prepare(`SELECT COUNT(*) n FROM "${t}"`).get().n;
  if (n1 !== n2) { diff++; console.log(`  ÉCART ${t} : ${n1} → ${n2}`); }
}
console.log(`Copie : ${dst}\nIntégrité : ${Object.values(check)[0]} · tables : ${tables.length} · écarts de lignes : ${diff}`);
process.exit(Object.values(check)[0] === "ok" && !diff ? 0 : 1);
