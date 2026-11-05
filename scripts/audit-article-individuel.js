#!/usr/bin/env node
// Contrôle qualité de la catégorie « Article individuel » du Theme Builder : exactement 100 modèles, tous construits et acceptés par la grammaire du Page Builder, tous réellement différents
// (signature structurelle : deux modèles dont l'arbre d'éléments se ressemble à plus de 80 % sont refusés), tous liés à l'article courant ({{post.title}} + un seul contenu d'article), sans image ni lien inventé,
// sans position absolue, avec des grilles qui passent à 1 colonne sur mobile. Utilise une base temporaire. Options : --json, --all (tous les défauts).
const os = require("os"), fs = require("fs"), path = require("path");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kola-audit-art-"));
process.env.DATA_DIR = tmp;
const args = process.argv.slice(2), asJson = args.includes("--json"), all = args.includes("--all");
const TARGET = 100, SIMILAR = Number((args.find((a) => a.startsWith("--similar=")) || "").slice(10)) || 0.80;
const db = require("../src/config/database");
try { require("../src/marketing/migrate"); } catch { /* facultatif */ }
const sections = require("../src/marketing/pages/sections");
const nodes = require("../src/marketing/pages/nodes");
const Catalog = require("../src/themeBuilder/catalog");
const ctx = { db, organizationId: 1, settings: { get: () => "[]", set() {} } };
const FAKE = /\b\d{2,}\s?%|@[a-z0-9-]+\.[a-z]{2,}|\+?\d[\d .]{8,}\d|lorem ipsum|"src":"(?!\{\{)[^"]+"|<script|javascript:|onerror=|https?:\/\//i;
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


const entries = Catalog.entries("single_post"), issues = [], sigs = new Map(), widgets = new Map();
const bad = (e, m) => issues.push({ ref: e.key, problem: m });
if (entries.length !== TARGET) issues.push({ ref: "single_post:*", problem: `${entries.length} modèles au lieu de ${TARGET}` });
const walkAll = (x, fn) => { if (Array.isArray(x)) return x.forEach((y) => walkAll(y, fn)); if (!x || typeof x !== "object") return; if (x.type) fn(x); for (const v of Object.values(x)) if (v && typeof v === "object") walkAll(v, fn); };
const names = new Set(), keys = new Set();
for (const e of entries) {
  if (keys.has(e.key)) bad(e, "clé en double"); keys.add(e.key);
  if (names.has(e.name)) bad(e, "nom en double"); names.add(e.name);
  if (!e.name || e.name.length < 4 || /variante|modèle \d|^\d/i.test(e.name)) bad(e, "nom creux ou numéroté");
  if (!e.desc || e.desc.length < 20) bad(e, "description trop courte");
  let doc; try { doc = Catalog.build("single_post", e.key, {}); } catch (err) { bad(e, `construction impossible : ${err.message}`); continue; }
  if (!doc || doc.kind !== "page") { bad(e, "document absent ou ni page"); continue; }
  const list = doc.sections;
  try { const norm = sections.normalizeSections(ctx, JSON.parse(JSON.stringify(list)).map((s) => ({ ...s, id: s.id || sections.newSectionId() }))); if (!norm.length) bad(e, "rejeté par le moteur"); else if (JSON.stringify(walkCount(norm)) !== JSON.stringify(walkCount(list))) bad(e, "le moteur a supprimé des éléments (propriétés non comprises)"); } catch (err) { bad(e, `rejeté par le moteur : ${err.message}`); continue; }
  // le pourcentage n'est suspect que dans un TEXTE (props) : « 100 % » en largeur de style est normal
  const propsOnly = []; walkAll(list, (x) => { if (x.props) propsOnly.push(JSON.stringify(x.props)); });
  if (FAKE.test(propsOnly.join("\n")) || /https?:\/\/|<script|javascript:/i.test(JSON.stringify(list))) bad(e, "contenu inventé (image, lien externe, chiffre, contact)");
  const types = {}; let n = 0, depth = 0, titles = 0, contents = 0, grids = 0, badGrids = 0, abs = 0;
  const dive = (x, d) => { if (Array.isArray(x)) return x.forEach((y) => dive(y, d)); if (!x || typeof x !== "object") return; if (x.type) { n += 1; depth = Math.max(depth, d); types[x.type] = (types[x.type] || 0) + 1; const dk = x.styles && x.styles.desktop; if (dk && (dk.position === "absolute" || dk.position === "fixed")) abs += 1; if (x.type === "heading" && /\{\{post\.title\}\}/.test(JSON.stringify(x.props))) titles += 1; if (x.type === "postcontent") contents += 1; if (x.type === "grid") { grids += 1; if (!(x.styles && x.styles.mobile && Number(x.styles.mobile.columns) === 1)) badGrids += 1; } } for (const v of Object.values(x)) if (v && typeof v === "object") dive(v, x.type ? d + 1 : d); };
  dive(list, 0);
  if (titles !== 1) bad(e, `${titles} titre(s) {{post.title}} (attendu : 1)`);
  if (contents !== 1) bad(e, `${contents} contenu(s) d'article (attendu : 1)`);
  if (n > nodes.MAX_NODES) bad(e, `trop d'éléments (${n})`);
  if (depth > nodes.MAX_DEPTH) bad(e, `profondeur ${depth}`);
  if (abs) bad(e, "position absolue ou fixe");
  if (badGrids) bad(e, `${badGrids} grille(s) sans passage à 1 colonne sur mobile`);
  widgets.set(e.key, types);
  sigs.set(e.key, signature(list));
}
function walkCount(x) { let c = 0; walkAll(x, () => { c += 1; }); return c; }
const refs = [...sigs.keys()], dup = [];
for (let i = 0; i < refs.length; i += 1) for (let j = i + 1; j < refs.length; j += 1) { const sim = jaccard(sigs.get(refs[i]), sigs.get(refs[j])); if (sim >= SIMILAR) dup.push({ a: refs[i], b: refs[j], similarity: Number(sim.toFixed(2)) }); }
for (const d of dup) issues.push({ ref: d.b, problem: `quasi-doublon de ${d.a} (similarité ${d.similarity})` });
const skins = {}; for (const e of entries) skins[e.skinKey] = (skins[e.skinKey] || 0) + 1;
const used = {}; for (const t of widgets.values()) for (const k of Object.keys(t)) used[k] = (used[k] || 0) + 1;
fs.rmSync(tmp, { recursive: true, force: true });
if (asJson) console.log(JSON.stringify({ count: entries.length, target: TARGET, skins, widgetsUsedByModels: used, issues }, null, 1));
else {
  console.log(`${entries.length === TARGET ? "OK " : "KO "} Article individuel ${entries.length} / ${TARGET}   défauts : ${issues.length}   identités : ${JSON.stringify(skins)}`);
  for (const i of issues.slice(0, all ? 9999 : 15)) console.log(`      ${i.ref} — ${i.problem}`);
  if (!asJson && process.env.AUDIT_WIDGETS) console.log(JSON.stringify(used));
  console.log(issues.length ? `\n${issues.length} défaut(s).` : "\nCatégorie conforme.");
}
process.exit(issues.length ? 1 : 0);
