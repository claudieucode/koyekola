// Contrôle de la bibliothèque de thèmes : node scripts/themes-check.js [clé …] — valide chaque page avec le moteur du Page Builder (base temporaire), la répartition par catégorie,
// les contrastes et la diversité. Code de sortie 1 s'il reste un problème (sauf répartition incomplète, signalée seulement tant que la bibliothèque est en construction : --strict l'exige).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "kola-check-")); process.env.NODE_ENV = "test";
const ROOT = path.join(__dirname, "..");
const db = require(path.join(ROOT, "src", "config", "database"));
const { migrate } = require(path.join(ROOT, "src", "marketing", "db", "migrate"));
migrate(db, { dir: path.join(ROOT, "src", "marketing", "migrations"), dbPath: ":memory:", log: { log() {}, warn() {}, error() {} } });
db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')");
const library = require(path.join(ROOT, "src", "marketing", "themes", "library"));
const { verify } = require(path.join(ROOT, "src", "marketing", "themes", "library", "verify"));
const args = process.argv.slice(2), strict = args.includes("--strict"), keys = args.filter((a) => !a.startsWith("--"));
const r = verify({ db, organizationId: 1, userId: 1, can: () => true }, { onlyKeys: keys.length ? keys : null });
console.log(`Thèmes : ${r.total} / ${r.target}`);
for (const c of library.CATEGORIES) if (!keys.length) console.log(`  ${String(r.counts[c.key]).padStart(2)} / ${String(c.count).padStart(2)}  ${c.label}`);
let bad = 0;
for (const t of r.invalid) { bad += 1; console.log(`PAGES INVALIDES ${t.key} :`); t.invalidPages.forEach((p) => console.log(`   ${p}`)); }
for (const t of r.lowContrast) { bad += 1; console.log(`CONTRASTE ${t.key} : ${t.contrast.join(" ; ")}`); }
for (const t of r.fontPairDuplicates) { bad += 1; console.log(`POLICES EN DOUBLE ${t.key} : ${t.fontPairDuplicate}`); }
for (const s of r.similar) { bad += 1; console.log(`TROP SIMILAIRES ${s.a} ~ ${s.b} (${s.similarity})`); }
if (r.overusedFonts.length) console.log(`Polices de titre très répétées : ${r.overusedFonts.join(", ")}`);
const incomplete = library.CATEGORIES.filter((c) => !keys.length && r.counts[c.key] !== c.count);
if (strict && (incomplete.length || r.total !== r.target)) { bad += 1; console.log(`RÉPARTITION INCOMPLÈTE : ${incomplete.map((c) => `${c.key} ${r.counts[c.key]}/${c.count}`).join(", ")}`); }
console.log(bad ? `${bad} problème(s).` : "Aucun problème.");
process.exit(bad ? 1 : 0);
