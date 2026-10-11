// Palier 23 — recalcul du score après les corrections effectuées (mêmes règles que generer.js ; seules les lignes réellement corrigées et testées changent).
const R = JSON.parse(JSON.stringify(require("./matrice-donnees.js")));
const O = { "PG-15": "V", "PG-14": "V", "AR-16": "V", "AR-10": "V", "UX-05": "V", "CM-05": "V", "US-07": "V", "SC-12": "V" };
const before = require("./matrice-donnees.js");
const W = { A: 3, B: 2, C: 2, D: 3 }, PTS = { V: 1, P: 0.5, NV: 0.5, DB: 0.5, B: 0.25, D: 0, A: 0 };
const FUNC = ["Pages", "Page Builder", "Articles", "Taxonomies", "Médiathèque", "Commentaires", "Navigation", "Apparence", "Utilisateurs", "Révisions", "SEO", "URL", "Outils", "Paramètres", "API et extensibilité"];
const sc = (rows) => { const ap = rows.filter((r) => r.st !== "NA" && W[r.cat]); return Math.round(100 * ap.reduce((s, r) => s + W[r.cat] * PTS[r.st], 0) / ap.reduce((s, r) => s + W[r.cat], 0)); };
const apply = (rows, o) => rows.map((r) => ({ ...r, st: o[r.id] || r.st }));
const dims = { "Parité fonctionnelle": (x) => x.filter((r) => FUNC.includes(r.dom) && r.cat !== "D"), "Sécurité et données": (x) => x.filter((r) => r.cat === "D"), "Expérience utilisateur": (x) => x.filter((r) => r.dom === "UX") };
for (const [k, f] of Object.entries(dims)) console.log(k.padEnd(26), "avant", sc(f(before)), "% → après", sc(f(apply(before, O))), "%");
