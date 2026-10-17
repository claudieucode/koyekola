#!/usr/bin/env node
// Audit en LECTURE SEULE (copie de base) des références page × formulaire entre sites — nombres agrégés uniquement. Voir src/services/auditFormulairesPages.js.
//   node scripts/auditer-pages-formulaires.js --base <copie.db>
const i = process.argv.indexOf("--base");
if (i < 0 || !process.argv[i + 1]) { console.error("Usage : node scripts/auditer-pages-formulaires.js --base <copie.db>"); process.exit(2); }
const r = require("../src/services/auditFormulairesPages").audit(process.argv[i + 1]);
console.log(JSON.stringify(r, null, 2));
process.exit(r.status === "ok" ? 0 : 1);
