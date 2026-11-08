// Choisit, pour chaque modèle de la bibliothèque « Page 404 », 0 à 2 compléments de récupération (parmi une liste cohérente avec sa famille) et, s'il n'en a pas, un traitement du numéro 404,
// de façon que TOUTES les paires de modèles respectent les portes de diversité (≥ 5 axes sur 8, ≥ 3 structurels sur 6, similarité d'arbre ≤ 85 %).
// Usage : node scripts/optimiser-complements-404.js [sortie.json] [graine]   (sortie par défaut : src/themeBuilder/catalog/not_found2/extras.json) — durée : une dizaine de minutes.
const path = require("path"); const R = path.join(__dirname, ".."), OUT = process.argv[2] || path.join(R, "src/themeBuilder/catalog/not_found2/extras.json");
const cat = require(R + "/src/themeBuilder/catalog/not_found2.js"); const { kit } = require(R + "/src/themeBuilder/catalog/kit"); const { NAMES, NUM_NAMES, NUMERALS } = require(R + "/src/themeBuilder/catalog/not_found2/addons");
const L = cat.all; const AX = ["C", "N", "M", "A", "R", "P", "T", "D"], ST = [0, 1, 2, 3, 4, 7];
const ALLOW = { minimalistes: ["liens", "contact", "bascule", "recents", "aide", "machine", "dessin", "icones"], premium: ["liens", "contact", "aide", "bascule", "menu", "degrade", "dessin"], interactives: NAMES.filter((n) => !["faq", "bascule", "aide"].includes(n)) };
const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const bagOf = (children) => { const m = new Map(); walk({ type: "layout", children }, (x) => { const d = (x.styles && x.styles.desktop) || {}; const t = `${x.type}|${d.flexDirection || ""}|${d.columns || ""}|${d.alignItems || ""}|${d.justifyContent || ""}`; m.set(t, (m.get(t) || 0) + 1); }); return m; };
const jac = (a, b) => { let i = 0, u = 0; for (const k of new Set([...a.keys(), ...b.keys()])) { const x = a.get(k) || 0, y = b.get(k) || 0; i += Math.min(x, y); u += Math.max(x, y); } return u ? i / u : 1; };
// candidats par modèle : (0 à 2 compléments) × (traitement du numéro, seulement pour les modèles sans numéro)
const subsets = (arr) => { const out = [[]]; arr.forEach((a) => out.push([a])); for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) out.push([arr[i], arr[j]]); return out; };
const cands = L.map((l) => { const allow = ALLOW[l.family] || NAMES; const nums = l.decl.N === 6 ? [null, ...NUM_NAMES] : [null]; const out = [];
  for (const names of subsets(allow)) for (const n of nums) { const ch = l.build(kit(l.skin), {}, { a: names, n }); out.push({ names, n, ax: cat.derive(ch, { ...l.decl, N: n ? NUMERALS[n].N : l.decl.N }), bag: bagOf(ch) }); }
  return out; });
console.error("candidats:", cands.reduce((n, c) => n + c.length, 0));
const bad = (a, b) => { let t = 0, s = 0; AX.forEach((x, k) => { if (a.ax[x] !== b.ax[x]) { t++; if (ST.includes(k)) s++; } }); return t < 5 || s < 3 || jac(a.bag, b.bag) > 0.85; };
// Départ : la sélection déjà enregistrée (extras.json) si elle existe, sinon aucun complément — l'optimiseur la répare au lieu de repartir de zéro
let saved = {}; try { saved = JSON.parse(require("fs").readFileSync(require("path").join(R, "src/themeBuilder/catalog/not_found2/extras.json"), "utf8")); } catch { saved = {}; }
const same = (c, ex) => JSON.stringify([...c.names].sort()) === JSON.stringify([...((ex && ex.a) || [])].sort()) && (c.n || null) === ((ex && ex.n) || null);
let pick = L.map((l, i) => { const idx = cands[i].findIndex((c) => same(c, saved[l.key])); return idx >= 0 ? idx : 0; });
const costOf = (i, ci) => { let c = 0; for (let j = 0; j < L.length; j++) if (j !== i && bad(cands[i][ci], cands[j][pick[j]])) c++; return c; };
let total = 0; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (bad(cands[i][pick[i]], cands[j][pick[j]])) total++;
console.error("paires hors seuil au départ:", total);
let seed = Number(process.argv[3] || 12345); const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
for (let it = 0; it < 150000 && total > 0; it++) {
  // on vise d'abord un modèle impliqué dans une paire hors seuil
  let i = Math.floor(rnd() * L.length);
  if (it % 2 === 0) { const involved = []; for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) if (bad(cands[a][pick[a]], cands[b][pick[b]])) { involved.push(a, b); } if (involved.length) i = involved[Math.floor(rnd() * involved.length)]; }
  const ci = Math.floor(rnd() * cands[i].length);
  const before = costOf(i, pick[i]) + 0.01 * (cands[i][pick[i]].names.length + (cands[i][pick[i]].n ? 1 : 0)), after = costOf(i, ci) + 0.01 * (cands[i][ci].names.length + (cands[i][ci].n ? 1 : 0));
  if (after <= before) { total += Math.round((costOf(i, ci) - costOf(i, pick[i]))); pick[i] = ci; }
}
let final = 0; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (bad(cands[i][pick[i]], cands[j][pick[j]])) final++;
console.error("paires hors seuil à l'arrivée:", final);
const out = {}; L.forEach((l, i) => { const c = cands[i][pick[i]]; if (c.names.length || c.n) out[l.key] = { a: c.names, ...(c.n ? { n: c.n } : {}) }; });
require("fs").writeFileSync(OUT, JSON.stringify(out, null, 1)); console.error("modèles avec compléments:", Object.keys(out).length);
