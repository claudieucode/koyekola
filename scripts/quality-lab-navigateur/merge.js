// Programme 22.1 — Fusionne les lots du laboratoire (docs/quality-lab-navigateur/parts/*.json), applique la grille de notation et écrit generation.json, audit.json, scores.json.
//   node scripts/quality-lab-navigateur/merge.js [--out dossier]
const fs = require("node:fs");
const path = require("node:path");
const { SCENARIOS } = require("./scenarios");
const { scoreSite } = require("./score");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg("out", path.join(__dirname, "..", "..", "docs", "quality-lab-navigateur")));
const rows = fs.readdirSync(path.join(OUT, "parts")).filter((f) => f.endsWith(".json")).flatMap((f) => JSON.parse(fs.readFileSync(path.join(OUT, "parts", f), "utf8")));
const byId = new Map(rows.map((r) => [r.id, r]));
const ordered = SCENARIOS.map((sc) => ({ sc, row: byId.get(sc.id) })).filter((x) => x.row);
const scored = ordered.map(({ sc, row }) => ({ id: sc.id, label: sc.label, score: row.gen.error ? { error: row.gen.error, total: null, status: "NON GÉNÉRÉ" } : scoreSite({ sc, gen: row.gen, audit: row.audit }) }));
fs.writeFileSync(path.join(OUT, "generation.json"), JSON.stringify(ordered.map(({ row }) => ({ id: row.id, label: row.label, brief: row.brief, gen: row.gen })), null, 1));
fs.writeFileSync(path.join(OUT, "audit.json"), JSON.stringify(ordered.map(({ row }) => ({ id: row.id, audit: row.audit })), null, 1));
fs.writeFileSync(path.join(OUT, "scores.json"), JSON.stringify(scored, null, 1));
for (const s of scored) console.log(`${s.id.padEnd(13)} ${String(s.score.total).padStart(4)}  couverture ${s.score.coverage || "-"}  ${s.score.status}${s.score.critical && s.score.critical.length ? "  ⚠ " + s.score.critical.join(", ") : ""}`);
