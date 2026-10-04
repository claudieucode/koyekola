// Rapport complet des médias (lecture seule) : npm run audit:medias
// Emplacement des fichiers, références VALID / MISSING / TEMPORARY_URL / EXTERNAL, médiathèques, fichiers sans fiche.
// Ne modifie ni ne supprime rien : une stratégie de nettoyage se décide APRÈS lecture de ce rapport.
require("dotenv").config();
const db = require("../src/config/database");
const { auditMedia, storageInfo } = require("../src/config/mediaAudit");

const s = storageInfo();
console.log("Stockage :", s.uploadsRoot, s.uploadsInsideApp ? "→ DANS le dossier de l'application (perdu à chaque déploiement Hostinger)" : "→ dossier conservé");
console.log("Base :", s.dataDir, s.dataInsideApp ? "→ dans le dossier de l'application" : "→ dossier conservé");
const a = auditMedia(db, { siteHost: (process.env.SITE_URL || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "") });
console.log("\nRéférences :", a.refs);
console.log("Médiathèque blog :", a.library.blog, "· marketing :", a.library.marketing, "· fichiers sans fiche (orphelins, conservés) :", a.orphanFiles);
if (a.missing.length) { console.log(`\nMISSING (${a.missing.length}) :`); for (const m of a.missing) console.log(`  ${m.path}  ←  ${m.where}`); }
if (a.temporary.length) { console.log(`\nTEMPORARY_URL (${a.temporary.length}) :`); for (const t of a.temporary) console.log(`  ${t.url}  ←  ${t.where}`); }
