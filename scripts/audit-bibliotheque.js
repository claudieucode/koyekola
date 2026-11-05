#!/usr/bin/env node
// Contrôle qualité de la bibliothèque officielle de modèles (packs, pages, sections, composants, parties).
//   node scripts/audit-bibliotheque.js              rapport complet (code de sortie 1 si une règle est violée)
//   node scripts/audit-bibliotheque.js --json       rapport JSON
//   node scripts/audit-bibliotheque.js --type=section --fix-report   détail des défauts d'un seul type
// Règles : exactement 100 modèles par type ; chaque modèle se construit et est accepté par le moteur de sections ; aucune image, script, lien externe ni chiffre / contact inventé ;
// aucune structure en double (deux modèles d'un même type ne peuvent pas avoir des arbres d'éléments quasi identiques : changer un titre, une couleur ou une icône n'en fait pas un autre modèle) ;
// chaque modèle est classé dans libraryMeta ; pas de position absolue ; profondeur et nombre d'éléments dans les limites du moteur ; grilles et colonnes adaptées au mobile.
// Utilise une base temporaire : aucune donnée du projet n'est lue ni écrite.
const os = require("os");
const fs = require("fs");
const path = require("path");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kola-audit-bib-"));
process.env.DATA_DIR = tmp;
const args = process.argv.slice(2), only = (args.find((a) => a.startsWith("--type=")) || "").slice(7), asJson = args.includes("--json");

const TARGET = 100, SIMILAR = 0.86;
const db = require("../src/config/database");
const pagesDir = "../src/marketing/pages/";
const { PACKS } = require(pagesDir + "sitePacks");
const templates = require(pagesDir + "templates");
const patterns = require(pagesDir + "patterns");
const components = require(pagesDir + "libraryComponents");
const parts = require(pagesDir + "libraryParts");
const { META } = require(pagesDir + "libraryMeta");
const sections = require(pagesDir + "sections");
const nodes = require(pagesDir + "nodes");

try { require("../src/marketing/migrate"); } catch { /* migrations facultatives : le moteur de sections n'en a besoin que pour résoudre des formulaires réels */ }
const ctx = { db, organizationId: 1, settings: { get: () => "[]", set() {} } };
const FAKE = /\b\d{2,}\s?%|\b\d{3,} (élèves|clients|inscrits)|@[a-z0-9-]+\.[a-z]{2,}|\+?\d[\d .]{8,}\d|lorem ipsum|"image":"[^"]+"|<script|javascript:|onerror=|https?:\/\//i;

// Signature structurelle : l'ensemble des chemins « parent/enfant:type[nombre d'enfants] » + réglages qui changent la composition (colonnes, flux, alignement, largeur).
const LAYOUT_KEYS = ["display", "flexDirection", "columns", "gridTemplate", "justifyContent", "alignItems", "position"];
function signature(list) {
  const set = new Map();
  const add = (k) => set.set(k, (set.get(k) || 0) + 1);
  const walk = (x, pathStr) => {
    if (Array.isArray(x)) { x.forEach((y) => walk(y, pathStr)); return; }
    if (!x || typeof x !== "object") return;
    let here = pathStr;
    if (typeof x.type === "string") {
      const kids = Array.isArray(x.children) ? x.children.length : 0;
      const lay = x.styles && x.styles.desktop ? LAYOUT_KEYS.filter((k) => x.styles.desktop[k] !== undefined).map((k) => `${k}=${x.styles.desktop[k]}`).join(",") : "";
      const own = ["columns", "items", "rows"].filter((k) => x[k] !== undefined || (x.props && x.props[k] !== undefined)).map((k) => { const v = x[k] ?? x.props[k]; return `${k}${Array.isArray(v) ? v.length : v}`; }).join(",");
      here = `${pathStr}/${x.type}[${kids}]{${lay}}(${own})`; add(here);
    }
    for (const k of ["children", "sections", "section"]) if (x[k]) walk(x[k], here);
    if (x.props && typeof x.props === "object") for (const v of Object.values(x.props)) if (v && typeof v === "object") walk(v, here);
  };
  walk(list, ""); return set;
}
const jaccard = (a, b) => { let inter = 0, uni = 0; const keys = new Set([...a.keys(), ...b.keys()]); for (const k of keys) { const x = a.get(k) || 0, y = b.get(k) || 0; inter += Math.min(x, y); uni += Math.max(x, y); } return uni ? inter / uni : 1; };
const stats = (list) => { let n = 0, depth = 0, abs = 0, grids = 0, gridsOk = 0; const walk = (x, d) => { if (Array.isArray(x)) { x.forEach((y) => walk(y, d)); return; } if (!x || typeof x !== "object") return; if (x.type) { n += 1; depth = Math.max(depth, d); const dk = x.styles && x.styles.desktop; if (dk && (dk.position === "absolute" || dk.position === "fixed")) abs += 1; if (x.type === "grid") { grids += 1; const mo = x.styles && x.styles.mobile; if (mo && Number(mo.columns) === 1) gridsOk += 1; } } for (const v of Object.values(x)) if (v && typeof v === "object") walk(v, x.type ? d + 1 : d); }; walk(list, 0); return { n, depth, abs, badGrids: grids - gridsOk }; };

const TYPES = {
  pack: { label: "Packs de site", items: () => PACKS.map((p) => ({ key: p.key, ref: `pack:${p.key}`, name: p.name, pack: p })) },
  page: { label: "Pages", items: () => templates.TEMPLATES.map((t) => ({ key: t.key, ref: `page:${t.key}`, name: t.name, build: () => templates.buildTemplate(ctx, t.key) })) },
  section: { label: "Sections", items: () => patterns.PATTERNS.map((p) => ({ key: p.key, ref: `section:${p.key}`, name: p.label, build: () => p.requires ? null : p.build(ctx), live: Boolean(p.requires) })) },
  component: { label: "Composants", items: () => components.COMPONENTS.map((c) => ({ key: c.key, ref: `component:${c.key}`, name: c.name, build: () => [components.buildComponent(c.key)] })) },
  part: { label: "Modèles de thème", items: () => parts.PARTS.map((p) => ({ key: p.key, ref: `part:${p.key}`, name: p.name, build: () => parts.buildPart(p.key) })) },
};

// Secteurs officiels (migration 123) : un slug inconnu fait échouer les tests du catalogue.
const SECTORS = new Set([...fs.readFileSync(path.join(__dirname, "../src/marketing/migrations/123_bibliotheque_modeles.sql"), "utf8").matchAll(/\(NULL, '([a-z0-9-]+)',/g)].map((m) => m[1]));
const report = {}; let failures = 0; const identities = [];
for (const [type, def] of Object.entries(TYPES)) {
  if (only && only !== type) continue;
  const items = def.items(), issues = [], sigs = new Map();
  const bad = (it, msg) => issues.push({ ref: it.ref, problem: msg });
  if (items.length !== TARGET) issues.push({ ref: `${type}:*`, problem: `${items.length} modèles au lieu de ${TARGET}` });
  const keys = new Set();
  for (const it of items) {
    if (keys.has(it.key)) bad(it, "clé en double"); keys.add(it.key);
    const mt = META[it.ref];
    if (!mt) bad(it, "non classé dans libraryMeta");
    else {
      if (!mt.keywords || mt.keywords.length < 1) bad(it, "aucun mot-clé");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(mt.since || "")) bad(it, "date d'ajout invalide");
      if (!["", "vitrine", "blog", "boutique", "formation", "autre"].includes(mt.siteType)) bad(it, `type de site inconnu « ${mt.siteType} »`);
      for (const sec of mt.sectors || []) if (!SECTORS.has(sec)) bad(it, `secteur inconnu « ${sec} »`);
    }
    if (!it.name || it.name.length < 4) bad(it, "nom trop court");
    if (type === "pack") {
      const p = it.pack;
      if (p.pages.length < 4) bad(it, "moins de 4 pages");
      for (const pg of p.pages) if (!templates.TEMPLATES.some((t) => t.key === pg.template)) bad(it, `page inconnue ${pg.template}`);
      for (const m of p.menu) if (!p.pages.some((pg) => pg.key === m)) bad(it, `menu : ${m} absent`);
      if (!require("../src/services/stylePalettes").PALETTES.some((x) => x.key === p.palette)) bad(it, `palette inconnue ${p.palette}`);
      // Identité visuelle propre au pack : couleurs lisibles (AA), polices de la bibliothèque, illustrations originales
      const idy = require("../src/services/packBrand").idOf(p.key), PI = require("../src/services/packIdentity");
      if (!idy) bad(it, "aucune identité visuelle");
      else {
        const c = idy.colors;
        for (const [n, v] of [["texte/fond", PI.contrast(c.text, c.background)], ["texte/surface", PI.contrast(c.text, c.surface)], ["discret/fond", PI.contrast(c.muted, c.background)], ["discret/surface", PI.contrast(c.muted, c.surface)], ["bouton/principale", PI.contrast(c.primary, PI.onColor(c.primary))], ["accent/fond", PI.contrast(c.accent, c.background)], ["principale/fond", PI.contrast(c.primary, c.background)]]) if (v < 4.5) bad(it, `contraste insuffisant (${n} : ${v.toFixed(2)})`);
        for (const f of [idy.fonts.heading, idy.fonts.body]) if (!require("../src/utils/fontLibrary").byId(f)) bad(it, `police inconnue ${f}`);
        for (const slot of ["hero", "card-3", "portrait-2"]) { const tk = require("../src/marketing/pages/tokens").normalizeTokens({ colors: c }, { strict: false }); const r = require("../src/services/packArt").render(slot, tk, idy.art); if (!r || !/^<svg/.test(r.svg)) bad(it, `illustration ${slot} impossible`); }
        identities.push(idy);
      }
      sigs.set(it.ref, new Map(p.pages.map((pg) => [pg.template, 1]))); continue;
    }
    let built;
    try { built = it.build(); } catch (e) { bad(it, `construction impossible : ${e.message}`); continue; }
    if (!built) { if (!it.live) bad(it, "construction vide"); continue; }
    try { const norm = sections.normalizeSections(ctx, built.map((s) => ({ ...s, id: sections.newSectionId() }))); if (!norm.length) bad(it, "rejeté par le moteur de sections"); } catch (e) { bad(it, `rejeté par le moteur : ${e.message}`); continue; }
    if (FAKE.test(JSON.stringify(built))) bad(it, "contenu inventé ou dangereux (image, lien externe, chiffre, contact)");
    const s = stats(built);
    if (s.n > nodes.MAX_NODES) bad(it, `trop d'éléments (${s.n})`); if (s.depth > nodes.MAX_DEPTH) bad(it, `profondeur ${s.depth}`);
    if (s.abs) bad(it, "position absolue ou fixe");
    if (s.badGrids) bad(it, `${s.badGrids} grille(s) sans passage à 1 colonne sur mobile`);
    sigs.set(it.ref, signature(built));
  }
  const refs = [...sigs.keys()], dup = [];
  for (let i = 0; i < refs.length; i += 1) for (let j = i + 1; j < refs.length; j += 1) {
    const sim = jaccard(sigs.get(refs[i]), sigs.get(refs[j]));
    const limit = type === "pack" ? 0.67 : SIMILAR;
    if (sim >= limit) dup.push({ a: refs[i], b: refs[j], similarity: Number(sim.toFixed(2)) });
  }
  for (const d of dup) issues.push({ ref: d.b, problem: `quasi-doublon de ${d.a} (similarité ${d.similarity})` });
  if (type === "pack" && identities.length) {
    // identités réellement différentes : couleurs principales distinctes, directions de même famille éloignées, assez de couples de polices
    const dist = (a, b) => Math.hypot(...[1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)));
    if (new Set(identities.map((x) => x.colors.primary)).size !== identities.length) issues.push({ ref: "pack:*", problem: "deux packs ont la même couleur principale" });
    for (let i = 0; i < identities.length; i += 1) for (let j = i + 1; j < identities.length; j += 1) if (identities[i].direction === identities[j].direction && dist(identities[i].colors.primary, identities[j].colors.primary) < 40) issues.push({ ref: `pack:${identities[j].key}`, problem: `couleur principale trop proche de celle de ${identities[i].key} (même direction « ${identities[i].directionLabel} »)` });
    const pairs = new Set(identities.map((x) => `${x.fonts.heading}/${x.fonts.body}`)).size;
    if (pairs < 40) issues.push({ ref: "pack:*", problem: `seulement ${pairs} couples de polices différents (40 au moins attendus)` });
    if (new Set(identities.map((x) => x.direction)).size < 20) issues.push({ ref: "pack:*", problem: "moins de 20 directions artistiques différentes" });
  }
  report[type] = { label: def.label, count: items.length, target: TARGET, issues };
  failures += issues.length;
}
fs.rmSync(tmp, { recursive: true, force: true });
if (asJson) console.log(JSON.stringify(report, null, 1));
else {
  for (const [t, r] of Object.entries(report)) {
    console.log(`${r.count === r.target ? "OK " : "KO "} ${r.label.padEnd(18)} ${String(r.count).padStart(3)} / ${r.target}   défauts : ${r.issues.length}`);
    for (const i of r.issues.slice(0, args.includes("--all") ? 9999 : 12)) console.log(`      ${i.ref} — ${i.problem}`);
    if (r.issues.length > 12 && !args.includes("--all")) console.log(`      … ${r.issues.length - 12} autres (option --all)`);
  }
  console.log(failures ? `\n${failures} défaut(s).` : "\nBibliothèque conforme.");
}
process.exit(failures ? 1 : 0);
