#!/usr/bin/env node
// Audit des roses : repère toute couleur (hex, rgb[a], hsl[a], mots-clés) dont la teinte tombe dans la plage rose/magenta,
// sans se limiter au mot « pink ». Usage : node scripts/design/audit-rose.js [--detail] [dossiers…]
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const args = process.argv.slice(2);
const detail = args.includes("--detail");
const dirs = args.filter((a) => !a.startsWith("--"));
const SCAN = dirs.length ? dirs : ["public/css", "views", "src", "public/js"];
const EXT = new Set([".css", ".ejs", ".js", ".html", ".svg"]);
const SKIP = /(node_modules|\.git|[\\/]tests[\\/]|public[\\/]js[\\/](blog-editor|course-editor|vendor)|\.min\.)/;
// plage rose : teinte 295°–350° (violet-rose → magenta → rose), saturation ≥ 18 %, luminosité 25-97 %.
const inPink = (h, s, l) =>
  (h >= 295 && h <= 350 && s >= 0.18 && l >= 0.25 && l <= 0.97) ||
  // rosé pâle : un « rouge » très clair penchant vers le rose (fonds d'alerte mal teintés) – le rouge franc (teinte ≈ 0-8°) reste permis
  ((h > 350 || h < 3) && l >= 0.9 && s >= 0.5 && h > 350);
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
const WORDS = /\b(pink|hotpink|deeppink|lightpink|fuchsia|magenta|orchid|violet-?red|palevioletred|mediumvioletred|plum)\b/i;
// Exceptions documentées (docs/KOLAKISA_TITAN_XXXV_ZERO_ROSE.md) : couleurs qui ne relèvent pas de l'interface Kolakisa.
//  - contenu des sites des clients : bibliothèque de thèmes, palettes de style, préréglages de couleur du constructeur
//  - surligneurs de texte « Rose » des éditeurs (choix d'auteur dans le contenu ; des articles enregistrés l'utilisent)
//  - marques externes : couleur officielle des réseaux sociaux
const EXCEPTIONS = [
  /^src[\\/]marketing[\\/]themes[\\/]/, /^src[\\/]services[\\/]stylePalettes\.js$/, /^public[\\/]js[\\/]page-builder-theme\.js$/,
  /^src[\\/]marketing[\\/]templates[\\/]blocks\.js$/, /^public[\\/]js[\\/]site-settings\.js$/,
  /^src[\\/]editor[\\/](blog[\\/]documentMode|blog-editor|course-editor)\.js$/,
  /^views[\\/]marketing-public[\\/]_node\.ejs$/, /^public[\\/]js[\\/]theme-code-editor\.js$/,
];
const out = [];
function walk(p) {
  const st = fs.statSync(p);
  if (st.isDirectory()) { for (const f of fs.readdirSync(p)) if (!SKIP.test(path.join(p, f))) walk(path.join(p, f)); return; }
  if (!EXT.has(path.extname(p)) || SKIP.test(p)) return;
  const lines = fs.readFileSync(p, "utf8").split("\n");
  lines.forEach((ln, i) => {
    const hits = [];
    for (const m of ln.matchAll(/#([0-9a-f]{3,8})\b/gi)) {
      let h = m[1]; if (![3, 4, 6, 8].includes(h.length)) continue;
      if (h.length <= 4) h = [...h].map((c) => c + c).join("");
      const [H, S, L] = rgb2hsl(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
      if (inPink(H, S, L)) hits.push(m[0]);
    }
    for (const m of ln.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/gi)) {
      const [H, S, L] = rgb2hsl(+m[1], +m[2], +m[3]);
      if (inPink(H, S, L)) hits.push(m[0] + ")");
    }
    for (const m of ln.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/gi)) {
      if (inPink(+m[1], +m[2] / 100, +m[3] / 100)) hits.push(m[0] + ")");
    }
    const w = ln.match(WORDS); if (w) hits.push(w[0]);
    if (/--v-magn|data-tone="magn"|g-orchidee/.test(ln)) hits.push("jeton:magn/orchidée");
    if (hits.length && !EXCEPTIONS.some((r) => r.test(path.relative(ROOT, p)))) out.push({ file: path.relative(ROOT, p), line: i + 1, hits, text: ln.trim().slice(0, 160) });
  });
}
for (const d of SCAN) { const p = path.join(ROOT, d); if (fs.existsSync(p)) walk(p); }
const byFile = {};
for (const o of out) (byFile[o.file] ||= []).push(o);
for (const [f, l] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${String(l.length).padStart(4)}  ${f}`);
  if (detail) for (const o of l) console.log(`        ${o.line}: [${o.hits.join(" ")}] ${o.text}`);
}
console.log(`\nTotal : ${out.length} occurrence(s) dans ${Object.keys(byFile).length} fichier(s)`);
process.exitCode = out.length ? 1 : 0;
