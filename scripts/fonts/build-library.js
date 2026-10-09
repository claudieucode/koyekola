#!/usr/bin/env node
// Construit la bibliothèque typographique de Kolakisa (Font Manager) : récupère les familles les plus utilisées de Google Fonts
// (licences ouvertes OFL / Apache / Ubuntu) via les métadonnées de Google Fonts et les paquets Fontsource, télécharge les fichiers
// WOFF2 (sous-ensemble latin : lettres accentuées du français comprises), les vérifie et écrit le manifeste.
//   node scripts/fonts/build-library.js            → construit (reprend ce qui est déjà téléchargé)
//   node scripts/fonts/build-library.js --count=420 → nombre de familles visées (défaut : 420, pour en valider au moins 360)
// Le résultat (public/fonts/library/) est versionné : aucune opération manuelle ni réseau n'est nécessaire au déploiement.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const OUT = path.join(__dirname, "../../public/fonts/library");
const COUNT = Number((process.argv.find((a) => a.startsWith("--count=")) || "--count=420").split("=")[1]);
const ALLOWED_LICENSES = new Set(["OFL-1.1", "Apache-2.0", "Ubuntu-font-1.0", "UFL-1.0"]);
const CDN = "https://cdn.jsdelivr.net/fontsource/fonts";

async function json(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); if (r.status === 404) return null; } catch { /* nouvel essai */ }
    await new Promise((res) => setTimeout(res, 400 * (i + 1)));
  }
  return null;
}
async function binary(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return Buffer.from(await r.arrayBuffer()); if (r.status === 404) return null; } catch { /* nouvel essai */ }
    await new Promise((res) => setTimeout(res, 400 * (i + 1)));
  }
  return null;
}
const isWoff2 = (b) => b && b.length > 800 && b.subarray(0, 4).toString("latin1") === "wOF2";
async function pool(items, size, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

const CATEGORY = { "Sans Serif": "sans-serif", Serif: "serif", Display: "display", Handwriting: "cursive", Monospace: "monospace" };
const FALLBACK = { "sans-serif": "sans-serif", serif: "serif", display: "sans-serif", cursive: "cursive", monospace: "monospace" };

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log("Métadonnées…");
  const gfRaw = await (await fetch("https://fonts.google.com/metadata/fonts")).text();
  const gf = JSON.parse(gfRaw.slice(gfRaw.indexOf("{"))).familyMetadataList.filter((f) => f.isOpenSource && !f.isNoto && !(f.colorCapabilities || []).length);
  const fsList = await json("https://api.fontsource.org/v1/fonts?type=google");
  const fsById = new Map(fsList.map((f) => [f.family, f]));
  const vf = await json("https://api.fontsource.org/v1/variable") || {};
  const ranked = gf.filter((g) => fsById.has(g.family)).sort((a, b) => a.popularity - b.popularity)
    .filter((g) => { const f = fsById.get(g.family); return f.subsets.includes("latin") && ALLOWED_LICENSES.has(f.license) && CATEGORY[g.category]; });
  const wanted = ranked.slice(0, COUNT + 40);
  console.log(`${wanted.length} candidates sur ${gf.length} familles Google Fonts ouvertes.`);

  const families = [];
  await pool(wanted, 6, async (g) => {
    const f = fsById.get(g.family);
    const dir = path.join(OUT, f.id);
    const detail = await json(`https://api.fontsource.org/v1/fonts/${f.id}`);
    if (!detail) { console.log("  sans détail :", f.family); return; }
    fs.mkdirSync(dir, { recursive: true });
    const axes = vf[f.id] && vf[f.id].axes && vf[f.id].axes.wght ? vf[f.id].axes.wght : null;
    const files = { normal: {}, italic: {} };
    let variable = false;
    const save = async (name, url) => {
      const file = path.join(dir, name);
      if (fs.existsSync(file) && isWoff2(fs.readFileSync(file))) return true;
      const buf = await binary(url);
      if (!isWoff2(buf)) return false;
      fs.writeFileSync(file, buf); return true;
    };
    // Police variable (un fichier par style couvre toutes les graisses), sinon un fichier par graisse
    for (const style of ["normal", "italic"]) {
      if (!detail.styles.includes(style)) continue;
      if (axes) {
        const name = `latin-wght-${style}.woff2`;
        if (await save(name, `${CDN}/${f.id}:vf@latest/${name}`)) { files[style].variable = name; variable = true; continue; }
      }
      for (const w of detail.weights) {
        const name = `latin-${w}-${style}.woff2`;
        if (await save(name, `${CDN}/${f.id}@latest/${name}`)) files[style][w] = name;
      }
    }
    const has = (s) => Object.keys(files[s]).length > 0;
    if (!has("normal")) { fs.rmSync(dir, { recursive: true, force: true }); console.log("  échec :", f.family); return; }
    const weightsOf = (s) => (files[s].variable ? Array.from(new Set(detail.weights)).filter((w) => !axes || (w >= Number(axes.min) && w <= Number(axes.max))) : Object.keys(files[s]).filter((k) => k !== "variable").map(Number)).sort((a, b) => a - b);
    const normalW = weightsOf("normal");
    const cats = new Set([CATEGORY[g.category]]);
    if (/slab/i.test(g.stroke || "") || (g.classifications || []).some((c) => /slab/i.test(c))) cats.add("slab-serif");
    if (variable) cats.add("variable");
    const size = fs.readdirSync(dir).reduce((n, x) => n + fs.statSync(path.join(dir, x)).size, 0);
    families.push({
      id: `font.${f.id}`, slug: f.id, family: f.family, category: CATEGORY[g.category], categories: [...cats], popularity: g.popularity,
      weights: normalW, styles: has("italic") ? ["normal", "italic"] : ["normal"], italicWeights: has("italic") ? weightsOf("italic") : [],
      variable, ...(axes && variable ? { axes: { wght: { min: Number(axes.min), max: Number(axes.max) } } } : {}),
      source: "google-fonts", sourceUrl: `https://fonts.google.com/specimen/${encodeURIComponent(f.family).replace(/%20/g, "+")}`, license: f.license,
      subset: "latin", files, fallback: FALLBACK[CATEGORY[g.category]], email: "limited", bytes: size,
    });
    if (families.length % 25 === 0) console.log(`  ${families.length} familles prêtes…`);
  });

  families.sort((a, b) => a.popularity - b.popularity);
  const kept = families.slice(0, Math.max(COUNT, 360));
  // Nettoyage des dossiers des familles écartées
  const keptSlugs = new Set(kept.map((x) => x.slug));
  for (const d of fs.readdirSync(OUT)) if (fs.statSync(path.join(OUT, d)).isDirectory() && !keptSlugs.has(d)) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });
  const manifest = { version: 1, generated: new Date().toISOString().slice(0, 10), source: "Google Fonts (métadonnées) via Fontsource (fichiers WOFF2, sous-ensemble latin)", count: kept.length, families: kept };
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
  const lic = {};
  for (const x of kept) (lic[x.license] = lic[x.license] || []).push(x.family);
  fs.writeFileSync(path.join(OUT, "LICENCES.md"), `# Bibliothèque typographique Kolakisa — licences

Toutes les familles viennent de Google Fonts (dépôt https://github.com/google/fonts) et sont redistribuées sous leur licence ouverte d'origine :
SIL Open Font License 1.1 (https://openfontlicense.org), Apache 2.0 ou Ubuntu Font Licence. Ces licences autorisent l'utilisation, l'intégration
dans un site web et la redistribution des fichiers (la vente de la police seule étant exclue). Fichiers WOFF2 fournis par Fontsource (https://fontsource.org).
Chaque entrée de manifest.json indique la licence et la page source de la famille. Aucun fichier propriétaire ou commercial n'est inclus.

${Object.entries(lic).map(([k, v]) => `## ${k} (${v.length} familles)\n\n${v.join(", ")}\n`).join("\n")}`);
  const total = kept.reduce((n, x) => n + x.bytes, 0);
  console.log(`Terminé : ${kept.length} familles, ${(total / 1048576).toFixed(1)} Mo.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
