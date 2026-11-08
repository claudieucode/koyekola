#!/usr/bin/env node
// Remplit prudemment l'origine (identifiant + version du modèle de la bibliothèque) des anciens pieds de page. Voir src/themeBuilder/originBackfill.js.
// Usage : node scripts/pieds-remplir-origine.js <chemin-de-la-base.sqlite> [--ecrire]   (sans --ecrire : simple comptage, rien n'est écrit)
// Faites une sauvegarde de la base avant d'utiliser --ecrire.
const { DatabaseSync } = require("node:sqlite");
const { fillOrigins } = require("../src/themeBuilder/originBackfill");
const file = process.argv[2], write = process.argv.includes("--ecrire");
if (!file) { console.error("Indiquez le chemin de la base de données."); process.exit(1); }
const db = new DatabaseSync(file);
const r = fillOrigins(db, { dryRun: !write });
console.log(write ? "Remplissage effectué :" : "Simulation (rien n'est écrit) :", JSON.stringify(r));
db.close();
