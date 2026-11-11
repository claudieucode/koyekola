#!/usr/bin/env node
// Audit du catalogue « Fiche produit » (100 modèles). Usage : node scripts/audit-fiche-produit.js [--json]
// Contrôles : 100 entrées, clés et noms uniques, quadruplets d'axes uniques, aucun jeton `token:` dans les documents construits, polices de la bibliothèque locale (≤ 2 par modèle, poids présent),
// contrastes (texte/fond, texte secondaire, bouton, accent), identités toutes distinctes (palette + polices + forme), construction sans exception, nœuds valides vis-à-vis de la grammaire du Page Builder,
// widgets boutique avec leurs parties colorées, aucune donnée inventée (prix, pourcentage, image externe), aucun `!important`, similarité de structure entre modèles (Jaccard) ≤ 0,70.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const Catalog = require("../src/themeBuilder/catalog");
const CONCEPTS = require("../src/themeBuilder/catalog/single_product/concepts");
const { SKINS } = require("../src/themeBuilder/catalog/single_product/skins");
const TYPE = "single_product", MAX_JACCARD = 0.70;

const lum = (hex) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const walk = (n, f, parent) => { f(n, parent); (n.children || []).forEach((c) => walk(c, f, n)); };
const fontDir = (id) => path.join(ROOT, "public/fonts/library", id.replace(/^font\./, ""));
function fontOk(id, weight) {
  const dir = fontDir(id); if (!fs.existsSync(dir)) return `police absente : ${id}`;
  const files = fs.readdirSync(dir), variable = files.includes("latin-wght-normal.woff2");
  if (variable) return null;
  if (!files.includes("latin-400-normal.woff2")) return `${id} : latin-400 manquant`;
  if (weight && !files.includes(`latin-${weight}-normal.woff2`)) return `${id} : graisse ${weight} manquante`;
  return null;
}
// textes visibles d'un document (props des éléments, hors styles)
const texts = (doc) => { const t = []; doc.sections.forEach((s) => walk(s, (n) => t.push(JSON.stringify(n.props || {})))); return t.join(" "); };
// signature de structure d'un nœud : type + gabarit (galerie, colonnes, bande, position collante)
const sig = (n) => { const d = (n.styles && n.styles.desktop) || {}, p = n.props || {}; return `${n.type}${p.layout && n.type === "shopgallery" ? ":" + p.layout : ""}${p.full ? "F" : ""}${p.band ? "B" : ""}${d.columns ? "#" + d.columns : ""}${d.gridTemplate ? "[" + d.gridTemplate + "]" : ""}${d.position && d.position !== "static" ? "^" + d.position : ""}${p.source ? ":" + p.source : ""}`; };
function shingles(doc) {
  const seq = []; doc.sections.forEach((s) => walk(s, (n) => seq.push(sig(n))));
  const set = new Set(); for (let i = 0; i + 2 < seq.length; i++) set.add(seq.slice(i, i + 3).join(">"));
  const edges = []; doc.sections.forEach((s) => walk(s, (n, parent) => { if (parent) edges.push(`${sig(parent)}/${sig(n)}`); }));
  edges.forEach((e) => set.add("E:" + e));
  return set;
}
const jaccard = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); };

function run() {
  const out = [], fail = (m) => out.push(m);
  const entries = Catalog.entries(TYPE);
  if (entries.length !== 100) fail(`attendu 100 entrées, trouvé ${entries.length}`);
  if (new Set(entries.map((e) => e.key)).size !== entries.length) fail("clés non uniques");
  if (new Set(entries.map((e) => e.name)).size !== entries.length) fail("noms non uniques");
  if (CONCEPTS.length !== 100 || new Set(CONCEPTS.map((c) => c.id)).size !== 100) fail("concepts : 100 identifiants uniques attendus");
  const quad = new Map(); for (const c of CONCEPTS) { const q = [c.gal, c.inf, c.cont, c.ach].join("/"); if (quad.has(q)) fail(`quadruplet d'axes en double : ${c.id} = ${quad.get(q)} (${q})`); quad.set(q, c.id); }

  // identités
  const ident = new Set(), palettes = new Set();
  for (const s of SKINS) {
    for (const f of ["bg", "fg", "mute", "alt", "accent", "onAccent", "line"]) if (!/^#[0-9a-f]{6}$/i.test(s[f])) fail(`${s.key} : ${f} n'est pas une couleur fixe (${s[f]})`);
    if (JSON.stringify(s).includes("token:")) fail(`${s.key} : jeton du site dans l'identité`);
    const fonts = [...new Set([s.font, s.head])]; if (fonts.length > 2) fail(`${s.key} : plus de 2 polices`);
    for (const e of [fontOk(s.font, "400"), fontOk(s.head, s.weight)]) if (e) fail(`${s.key} : ${e}`);
    const checks = [["texte/fond", s.fg, s.bg], ["texte/fond alterné", s.fg, s.alt], ["secondaire/fond", s.mute, s.bg], ["secondaire/fond alterné", s.mute, s.alt], ["bouton (texte d'accent/accent)", s.onAccent, s.accent], ["accent/fond", s.accent, s.bg], ["accent/fond alterné", s.accent, s.alt]];
    for (const [n, a, b] of checks) { const r = ratio(a, b); if (r < 4.5) fail(`${s.key} contraste ${n} = ${r.toFixed(2)} < 4,5`); }
    const id = [s.bg, s.fg, s.accent, s.font, s.head, s.form].join("|"); if (ident.has(id)) fail(`${s.key} : identité (palette + polices + forme) en double`); ident.add(id);
    const pal = [s.bg, s.fg, s.alt, s.accent].join("|"); if (palettes.has(pal)) fail(`${s.key} : palette en double`); palettes.add(pal);
  }
  const forms = new Set(SKINS.map((s) => s.form)), fontPairs = new Set(SKINS.map((s) => s.font + "+" + s.head));

  // documents
  const { normalizeSections, newSectionId } = require("../src/marketing/pages/sections");
  const ctx = { organizationId: 1, db: { prepare: () => ({ get: () => null, all: () => [] }) } };
  const docs = [], sh = new Map(); let widgets = 0, partsOk = 0;
  for (const e of entries) {
    let doc; try { doc = Catalog.build(TYPE, e.key, {}); } catch (err) { fail(`${e.key} : construction impossible (${err.message})`); continue; }
    if (!doc) { fail(`${e.key} : build() renvoie null`); continue; }
    const json = JSON.stringify(doc);
    if (json.includes("token:")) fail(`${e.key} : jeton « token: » dans le document construit`);
    if (/!important/.test(json)) fail(`${e.key} : !important`);
    if (/https?:\/\//i.test(json.replace(/"url":"https?:\/\/[^"]*"/g, ""))) fail(`${e.key} : adresse externe ou image factice`);
    if (/\d\s?(€|\$|£|%|\s?EUR)/.test(texts(doc).replace(/\{\{[^}]*\}\}/g, ""))) fail(`${e.key} : prix ou pourcentage écrit en dur`);
    try { normalizeSections(ctx, [{ id: newSectionId(), type: "layout", children: JSON.parse(JSON.stringify(doc.sections[0].children)) }]); } catch (err) { fail(`${e.key} : grammaire refusée : ${err.message}`); }
    const S = SKINS.find((s) => s.key === e.skinKey);
    doc.sections.forEach((s) => walk(s, (n) => {
      if (n.type === "grid" && n.styles && n.styles.desktop && n.styles.desktop.columns > 1) { const t = n.styles.tablet || {}; if (!(t.columns === 1 || t.columns === 2)) fail(`${e.key} : grille sans repli tablette`); if (!(n.styles.mobile && n.styles.mobile.columns === 1)) fail(`${e.key} : grille sans repli mobile`); }
      const d = n.styles && n.styles.desktop; if (d && typeof d.width === "string" && /px$/.test(d.width) && parseInt(d.width, 10) > 100) fail(`${e.key} : largeur fixe en px (${d.width})`);
      if (/^shop(buy|grid|gallery|reviews|specs)$/.test(n.type)) {
        widgets++;
        const pd = (n.parts && n.parts.button && n.parts.button.styles && n.parts.button.styles.desktop) || {};
        if (n.type === "shopbuy") { if (pd.backgroundColor && pd.color && !/token:|var\(/.test(JSON.stringify(n.parts))) partsOk++; else fail(`${e.key} : shopbuy sans partie bouton colorée`); }
        else if (n.parts && Object.keys(n.parts).length) partsOk++; else fail(`${e.key} : ${n.type} sans parties`);
      }
    }));
    docs.push([e, doc]); sh.set(e.key, shingles(doc));
  }
  // similarité
  const keys = [...sh.keys()], vals = [], pairs = [];
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) { const v = jaccard(sh.get(keys[i]), sh.get(keys[j])); vals.push(v); pairs.push([v, keys[i], keys[j]]); }
  pairs.sort((a, b) => b[0] - a[0]); vals.sort((a, b) => a - b);
  const q = (p) => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
  const bins = [0.3, 0.4, 0.5, 0.6, 0.7, 1.01].map((hi, i, a) => [i ? a[i - 1] : 0, hi, vals.filter((v) => v >= (i ? a[i - 1] : 0) && v < hi).length]);
  if (pairs.length && pairs[0][0] > MAX_JACCARD) fail(`similarité max ${pairs[0][0].toFixed(3)} > ${MAX_JACCARD} (${pairs[0][1]} / ${pairs[0][2]})`);
  const sizes = [...sh.values()].map((s) => s.size);
  const lines = [
    `Entrées : ${entries.length} · identités : ${SKINS.length} · formes : ${forms.size} · couples de polices : ${fontPairs.size} · quadruplets uniques : ${quad.size}`,
    `Widgets boutique : ${widgets} (${partsOk} avec parties colorées)`,
    `Éléments par modèle : min ${Math.min(...docs.map(([, d]) => { let n = 0; d.sections.forEach((s) => walk(s, () => n++)); return n; }))}, motifs de structure par modèle : ${Math.min(...sizes)}–${Math.max(...sizes)}`,
    `Similarité (Jaccard des triplets d'éléments et des liens parent/enfant), ${pairs.length} paires : max ${pairs[0][0].toFixed(3)} · p99 ${q(0.99).toFixed(3)} · p90 ${q(0.9).toFixed(3)} · médiane ${q(0.5).toFixed(3)} · min ${vals[0].toFixed(3)}`,
    "Distribution : " + bins.map(([lo, hi, n]) => `[${lo.toFixed(1)}–${Math.min(hi, 1).toFixed(1)}[ ${n}`).join(" · "),
    "Paires les plus proches : " + pairs.slice(0, 5).map((p) => `${p[1].split(".")[0]}~${p[2].split(".")[0]} ${p[0].toFixed(2)}`).join(", "),
  ];
  return { fails: out, lines, max: pairs[0][0], widgets, partsOk, entries, docs };
}
function main() {
  const r = run();
  r.lines.forEach((l) => console.log(l));
  if (r.fails.length) { console.log(`\nÉCHECS (${r.fails.length}) :`); r.fails.slice(0, 80).forEach((m) => console.log(" - " + m)); process.exit(1); }
  console.log("\nAUDIT OK : aucun échec.");
}
if (require.main === module) main(); else module.exports = { run, lum, ratio, MAX_JACCARD };
