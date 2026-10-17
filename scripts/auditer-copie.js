#!/usr/bin/env node
// Audit en LECTURE SEULE d'une COPIE de base (R6 lot 6) : affiche uniquement des nombres agrégés. Voir src/services/auditCopie.js.
//   node scripts/auditer-copie.js --base <copie.db>
const i = process.argv.indexOf("--base");
if (i < 0 || !process.argv[i + 1]) { console.error("Usage : node scripts/auditer-copie.js --base <copie.db>"); process.exit(2); }
const r = require("../src/services/auditCopie").audit(process.argv[i + 1]);
console.log(JSON.stringify(r, null, 2));
process.exit(r.status === "conforme" ? 0 : 1);
