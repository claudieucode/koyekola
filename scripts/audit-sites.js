#!/usr/bin/env node
// Contrôle d'isolation des sites (palier 2) — LECTURE SEULE. À lancer avant et après une migration, et sur une copie de la production :
//   node scripts/audit-sites.js [chemin/vers/KOYEKOLA.db]
// (La même analyse est disponible dans l'interface : Centre de gestion → Sauvegardes → « Audit des sites ».)
// Affiche des nombres uniquement. Code de sortie 1 s'il y a une anomalie, 2 si la base est illisible.
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { run } = require("../src/services/auditSites");

const file = path.resolve(process.argv[2] || path.join(__dirname, "..", "data", "KOYEKOLA.db"));
let db;
try { db = new DatabaseSync(file, { readOnly: true }); } catch (e) { console.error(`Impossible d'ouvrir la base ${file} : ${e.message}`); process.exit(2); }
const r = run(db);
const line = (...a) => console.log(...a);
line(`Base : ${file}`);
if (!r.hasSites) { line("Aucune table mk_sites : base sans module Site Web."); process.exit(0); }
line(`Sites : ${r.sites.total} (supprimés : ${r.sites.deleted === null ? "n/a" : r.sites.deleted})`);
line("\nTable                     total  principal(NULL)  rattachées  orphelines");
for (const t of r.tables) {
  if (t.absent) { line(`${t.table.padEnd(25)} (absente)`); continue; }
  line(`${t.table.padEnd(25)} ${String(t.total).padStart(5)}  ${String(t.principal).padStart(15)}  ${String(t.rattachees).padStart(10)}  ${String(t.orphelines).padStart(10)}${t.orphelines ? "  ← ANOMALIE" : ""}`);
}
line("\nAssociations entre sites différents :");
const names = { step: "étapes de tunnel → page d'un autre site", parent: "pages dont le parent est d'un autre site", home: "sites dont la page d'accueil est d'un autre site", component: "pages contenant un composant propre à un autre site", archived: "pages en ligne dans un site archivé ou supprimé" };
for (const c of r.checks) line(c.unavailable ? `  ${names[c.key]} : (non vérifiable)` : `  ${names[c.key]} : ${c.n}${c.n ? "  ← ANOMALIE" : ""}`);
if (r.palier3) {
  const p = r.palier3;
  line("\nPréparation du palier 3 (informatif, pas des anomalies) :");
  for (const v of p.volumes) line(`  ${v.label.padEnd(40)} ${v.n === null ? "non vérifiable" : v.n}`);
  for (const [label, u] of [["Médias du CMS", p.medias], ["Formulaires", p.formulaires]]) if (u) line(`  ${label} : ${u.total} · inutilisés ${u.inutilises} · site principal seulement ${u.principal} · un seul autre site ${u.un_site} · PLUSIEURS SITES (à décider) ${u.plusieurs}`);
  if (p.contacts) line(`  Contacts : ${p.contacts.total} · origine principal ${p.contacts.origine_principal} · origine autre site ${p.contacts.origine_site}${p.contacts.listes_plusieurs_sites === undefined ? "" : ` · listes de plusieurs sites ${p.contacts.listes_plusieurs_sites} · liste d'un autre site que l'origine ${p.contacts.liste_autre_que_origine}`}`);
  if (p.taxonomies) line(`  Catégories : liens sans catégorie ${p.taxonomies.liens_sans_terme} · liens sans article ${p.taxonomies.liens_article_sans_article}`);
}
line(`\n${r.anomalies ? `${r.anomalies} anomalie(s) à examiner (rien n'a été modifié).` : "Aucune anomalie d'isolation détectée."}`);
process.exit(r.anomalies ? 1 : 0);
