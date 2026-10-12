#!/usr/bin/env node
// Essai de reconstruction des quatre tables (palier 3) sur une COPIE TEMPORAIRE d'une sauvegarde — la sauvegarde n'est jamais modifiée.
//   node scripts/essai-reconstruction.js <sauvegarde.db> [dossier-temporaire-vide]
// Sans dossier temporaire, un dossier privé est créé puis supprimé. Affiche un seul objet JSON (nombres et libellés fixes, aucun contenu).
// Code de sortie : 0 = conforme (ou inutile), 1 = bloqué ou erreur, 2 = arguments invalides.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { runEssai } = require("../src/services/essaiReconstructionCore");

const [src, workArg] = process.argv.slice(2);
if (!src) { console.error("Usage : node scripts/essai-reconstruction.js <sauvegarde.db> [dossier-temporaire-vide]"); process.exit(2); }
const source = path.resolve(src);
let work = workArg ? path.resolve(workArg) : null, own = false;
if (!work) { work = fs.mkdtempSync(path.join(os.tmpdir(), "essai-reconstruction-")); fs.chmodSync(work, 0o700); own = true; }
const cleanup = () => { if (own) { try { fs.rmSync(work, { recursive: true, force: true }); } catch { /* ignoré */ } } };
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { cleanup(); process.exit(1); });
let result;
try { result = runEssai(source, work); } finally { cleanup(); }
process.stdout.write(JSON.stringify(result));
process.exit(result.verdict === "conforme" || result.verdict === "inutile" ? 0 : 1);
