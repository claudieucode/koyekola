#!/usr/bin/env node
// Assigne à chacun des 100 concepts « Article individuel » v3 une VARIANTE STRUCTURELLE (ouverture, fin d'article, corps) qui rend son arbre d'éléments réellement différent de tous les précédents
// (similarité de structure < SEUIL). Écrit src/themeBuilder/catalog/single_post/v3/variantes.json ; à relancer si un archétype ou un concept change. Usage : node scripts/assigner-variantes-article.js [--seuil=0.74]
const fs = require("fs"), path = require("path");
const SEUIL = Number((process.argv.find((a) => a.startsWith("--seuil=")) || "").slice(8)) || 0.74;
const { kit } = require("../src/themeBuilder/catalog/kit");
const catalog = require("../src/themeBuilder/catalog/single_post");
const LAYOUT_KEYS = ["display", "flexDirection", "columns", "gridTemplate", "justifyContent", "alignItems", "position", "columnCount"];
function signature(list) {
  const set = new Map(), add = (k) => set.set(k, (set.get(k) || 0) + 1);
  const walk = (x, p) => {
    if (Array.isArray(x)) { x.forEach((y) => walk(y, p)); return; }
    if (!x || typeof x !== "object") return;
    let here = p;
    if (typeof x.type === "string") {
      const kids = Array.isArray(x.children) ? x.children.length : 0;
      const lay = x.styles && x.styles.desktop ? LAYOUT_KEYS.filter((k) => x.styles.desktop[k] !== undefined).map((k) => `${k}=${x.styles.desktop[k]}`).join(",") : "";
      here = `${p}/${x.type}[${kids}]{${lay}}`; add(here);
    }
    for (const k of ["children", "sections", "section"]) if (x[k]) walk(x[k], here);
  };
  walk(list, ""); return set;
}
const jaccard = (a, b) => { let i = 0, u = 0; for (const k of new Set([...a.keys(), ...b.keys()])) { const x = a.get(k) || 0, y = b.get(k) || 0; i += Math.min(x, y); u += Math.max(x, y); } return u ? i / u : 1; };
const combos = []; for (let h = 0; h < 4; h += 1) for (let t = 0; t < 3; t += 1) for (let b = 0; b < 3; b += 1) combos.push([h, t, b]);
const sigs = [], out = []; let worst = 0, forced = 0;
catalog.layouts.forEach((l, i) => {
  const S = catalog.skins[i]; let best = null;
  for (let n = 0; n < combos.length; n += 1) {
    const v = combos[(n + i * 7) % combos.length]; l.concept.v = v;
    const sig = signature(l.build(kit(S)));
    const sim = sigs.reduce((m, s) => Math.max(m, jaccard(sig, s)), 0);
    if (!best || sim < best.sim) best = { v, sig, sim };
    if (sim < SEUIL) break;
  }
  if (best.sim >= SEUIL) { forced += 1; console.log(`  au-dessus du seuil : ${l.concept.id} ${l.label} (${l.concept.arch}) similarité ${best.sim.toFixed(2)}`); }
  worst = Math.max(worst, best.sim); sigs.push(best.sig); out.push(best.v);
});
fs.writeFileSync(path.join(__dirname, "../src/themeBuilder/catalog/single_post/v3/variantes.json"), JSON.stringify(out));
console.log(`variantes écrites pour ${out.length} concepts ; similarité maximale ${worst.toFixed(2)} ; ${forced} concept(s) au-dessus du seuil ${SEUIL}`);
