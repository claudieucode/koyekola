#!/usr/bin/env node
// Choisit, parmi des milliers de combinaisons de la grammaire (v3/grammar.js), les 100 mises en page les PLUS DIFFÉRENTES entre elles (5 par univers) : sélection « le plus éloigné d'abord »
// sur la similarité de structure réelle (même mesure que scripts/audit-page-individuelle.js). Écrit src/themeBuilder/catalog/search_results/v3/specs.js. Usage : node scripts/choisir-structures-recherche.js [seuil]
const os = require("os"), fs = require("fs"), path = require("path");
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "choix-"));
const V3 = path.join(__dirname, "../src/themeBuilder/catalog/search_results/v3");
const { assemble } = require(path.join(V3, "grammar"));
const { UNIVERS } = require(path.join(V3, "universes"));
const { kit, withIds } = require(path.join(__dirname, "../src/themeBuilder/catalog/kit"));
const { ID2 } = require(path.join(V3, "h"));
const skin = ID2([1, "x", "L", "p", "#ffffff", "#101010", "#d9480f", "font.manrope", "font.inter"]);
const LAY = ["display", "flexDirection", "columns", "gridTemplate", "justifyContent", "alignItems", "position"];
function signature(list) { const set = new Map(), add = (k) => set.set(k, (set.get(k) || 0) + 1); const walk = (x, pth) => { if (Array.isArray(x)) return x.forEach((y) => walk(y, pth)); if (!x || typeof x !== "object") return; let here = pth; if (typeof x.type === "string") { const kids = Array.isArray(x.children) ? x.children.length : 0, d = (x.styles && x.styles.desktop) || {}; here = `${pth}/${x.type}[${kids}]{${LAY.filter((k) => d[k] !== undefined).map((k) => `${k}=${d[k]}`).join(",")}}`; add(here); } for (const k of ["children", "sections", "section"]) if (x[k]) walk(x[k], here); }; walk(list, ""); return set; }
const jac = (a, b) => { let i = 0, u = 0; for (const k of new Set([...a.keys(), ...b.keys()])) { const x = a.get(k) || 0, y = b.get(k) || 0; i += Math.min(x, y); u += Math.max(x, y); } return u ? i / u : 1; };
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const TOOLSETS = [[], ["count"], ["sort"], ["cats"], ["count", "sort"], ["cats", "sort"], ["count", "cats"], ["count", "sort", "cats"]];
const candidates = (u) => { const out = []; for (let n = 0; n < 160; n += 1) { const s = { head: Math.floor(rnd() * 6), pos: Math.floor(rnd() * 4), set: TOOLSETS[Math.floor(rnd() * 8)], body: Math.floor(rnd() * 13), aside: Math.floor(rnd() * 3), tail: Math.floor(rnd() * 4), more: u.sources.length > 1 && rnd() < 0.4 }; if (s.pos === 2 && !s.aside) s.pos = 1; if (s.pos === 3 && s.head !== 2) s.pos = 1; if (!s.set.length) s.pos = 0; if (s.pos === 0 && s.set.length) s.set = []; if (s.body === 12 && s.more) s.more = false; out.push(s); } return out; };
const sig = (u, s) => signature(withIds(assemble({ ...kit(skin), key: "x" }, u, s)));
const chosen = []; // { u, s, sig }
const THR = Number(process.argv[2]) || 0.62;
for (let round = 0; round < 5; round += 1) for (const u of UNIVERS) {
  let best = null, bestScore = -1;
  for (const s of candidates(u)) {
    const g = sig(u, s); let worst = 0;
    for (const c of chosen) { const j = jac(g, c.sig); if (j > worst) worst = j; }
    const score = 1 - worst; if (score > bestScore) { bestScore = score; best = { u, s, sig: g, worst }; }
  }
  chosen.push(best);
}
const max = Math.max(...chosen.map((c) => c.worst));
fs.writeFileSync(path.join(V3, "specs.js"), `// 100 structures choisies pour leur différence mesurée (scripts/choisir-structures-recherche.js) : 5 par univers, dans l'ordre des univers.\nmodule.exports = ${JSON.stringify(UNIVERS.map((u) => chosen.filter((c) => c.u === u).map((c) => c.s)))};\n`);
console.log(`100 structures choisies ; similarité la plus haute entre une structure et celles déjà retenues : ${max.toFixed(2)} (seuil visé ${THR})`);
