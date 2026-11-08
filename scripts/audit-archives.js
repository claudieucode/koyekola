// Audit statique de la bibliothèque « Archive » (100 modèles) : nombre exact, unicité, diversité de structure, indépendance de l'identité (0 jeton du site, polices de la bibliothèque),
// contrastes WCAG AA, modes d'identité. Aucune base de données, aucun serveur. Sortie : un tableau de contrôles, code 1 au premier échec.
// Usage : node scripts/audit-archives.js
const Catalog = require("../src/themeBuilder/catalog");
const Archive = require("../src/themeBuilder/catalog/archive");
const concepts = require("../src/themeBuilder/catalog/archive-lib/concepts");

const all = Catalog.entries("archive");
const tree = (n) => `${n.type}${n.children ? `(${n.children.map(tree).join(",")})` : ""}`;
const doc = (k, identity) => Catalog.build("archive", k, identity ? { identity } : {});
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const checks = [];
const check = (label, ok, detail = "") => { checks.push({ label, ok, detail }); };

check("100 modèles exactement", all.length === 100, String(all.length));
check("clés uniques", new Set(all.map((e) => e.key)).size === 100);
check("noms uniques", new Set(all.map((e) => e.name)).size === 100);
check("25 familles de 4", new Set(all.map((e) => e.layoutKey)).size === 25);
check("100 documents différents", new Set(all.map((e) => JSON.stringify(doc(e.key), (k, v) => (k === "id" ? undefined : v)))).size === 100);
check("100 structures d'éléments différentes", new Set(all.map((e) => tree(doc(e.key).sections[0]))).size === 100);
check("100 signatures de réglages différentes", new Set(concepts.map((c) => [c.comp, c.cols, c.img, c.barre, c.tete, c.nav, c.filtre].join("|"))).size === 100);
const pairs1 = (() => { const ax = ["comp", "cols", "img", "barre", "tete", "nav", "filtre"]; let n = 0; for (let i = 0; i < concepts.length; i += 1) for (let j = i + 1; j < concepts.length; j += 1) if (ax.filter((a) => concepts[i][a] !== concepts[j][a]).length <= 1) n += 1; return n; })();
check("paires de concepts ne différant que d'un réglage (information)", true, String(pairs1));
const depth = (n) => 1 + Math.max(0, ...(n.children || []).map(depth)), count = (n) => 1 + (n.children || []).reduce((a, c) => a + count(c), 0);
check("limites du moteur : ≤ 400 éléments et ≤ 8 niveaux sur 100/100", all.every((e) => { const d = doc(e.key).sections[0]; return count(d) <= 400 && depth(d) <= 9; }));
const Sections = require("../src/marketing/pages/sections");
let refused = 0;
for (const e of all) for (const mode of ["own", "site", "hybrid"]) { try { Sections.normalizeSection({ db: null, siteId: null }, JSON.parse(JSON.stringify(doc(e.key, mode).sections[0])), "Section 1", { n: 0, ids: new Set() }); } catch { refused += 1; } }
check("validation par le moteur du Page Builder : 300/300 documents acceptés (100 modèles × 3 modes)", refused === 0, `${refused} refusés`);
let tokens = 0, fonts = 0, bad = 0;
for (const e of all) {
  const json = JSON.stringify(doc(e.key));
  if (/token:/.test(json)) tokens += 1;
  for (const f of json.matchAll(/"fontFamily":"([^"]+)"/g)) if (!/^font\./.test(f[1])) fonts += 1;
  const s = Archive.skins.find((x) => x.key === e.skinKey);
  if (!(ratio(s.fg, s.bg) >= 4.5 && ratio(s.mute, s.bg) >= 4.5 && ratio(s.mute, s.alt) >= 4.5 && ratio(s.onAccent, s.accent) >= 4.5 && ratio(s.accent, s.bg) >= 4.5)) bad += 1;
}
check("mode propre : 0 modèle avec jeton du site", tokens === 0, String(tokens));
check("mode propre : 0 police hors bibliothèque", fonts === 0, String(fonts));
check("contrastes AA sur les 100 identités", bad === 0, String(bad));
check("100 palettes différentes", new Set(Archive.skins.map((s) => [s.bg, s.fg, s.accent].join())).size === 100);
check("mode « site » : jetons du site présents sur 100/100", all.every((e) => /token:background/.test(JSON.stringify(doc(e.key, "site")))));
check("mode « hybride » : nom du site sur 100/100 et 0 jeton", all.every((e) => { const j = JSON.stringify(doc(e.key, "hybrid")); return /sitetitle/.test(j) && !/token:/.test(j); }));

let failed = 0;
for (const c of checks) { if (!c.ok) failed += 1; console.log(`${c.ok ? "OK  " : "ÉCHEC"}  ${c.label}${c.detail ? ` : ${c.detail}` : ""}`); }
process.exit(failed ? 1 : 0);
