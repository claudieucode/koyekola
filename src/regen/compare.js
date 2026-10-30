// Version Comparison Engine : différences entre deux états du MÊME niveau, par identifiant stable (section, élément) et non par position. Catégories : contenu, style, média, structure.
// Deux états identiques → `identical: true` et aucune différence fabriquée.
const { fp, norm } = require("./util");
const MEDIA = /(^|\.)(image|src|poster|media|logo|icon|imageAlt|alt)(\.|$)/i, STYLE = /(^|\.)(style|styles|theme|hideOn|columns|align|width|padding|background)(\.|$)/i;
const category = (path) => (MEDIA.test(path) ? "media" : STYLE.test(path) ? "style" : "content");
function flat(v, prefix = "", out = {}, depth = 0) {
  if (v === null || typeof v !== "object" || depth > 12) { out[prefix || "(valeur)"] = v; return out; }
  if (Array.isArray(v)) { if (!v.length) out[prefix] = []; v.forEach((x, i) => flat(x, `${prefix}[${i}]`, out, depth + 1)); return out; }
  const keys = Object.keys(v); if (!keys.length) out[prefix] = {};
  for (const k of keys) flat(v[k], prefix ? `${prefix}.${k}` : k, out, depth + 1);
  return out;
}
const short = (v) => { const s = typeof v === "string" ? v : JSON.stringify(v); return s === undefined ? "" : s.length > 300 ? `${s.slice(0, 300)}…` : s; };
function diffValue(a, b, base = "") {
  const fa = flat(a, base), fb = flat(b, base), out = [];
  for (const k of new Set([...Object.keys(fa), ...Object.keys(fb)])) {
    const inA = Object.hasOwn(fa, k), inB = Object.hasOwn(fb, k);
    if (inA && inB) { if (JSON.stringify(fa[k]) !== JSON.stringify(fb[k])) out.push({ path: k, kind: "changed", category: category(k), before: short(fa[k]), after: short(fb[k]) }); }
    else if (inA) out.push({ path: k, kind: "removed", category: category(k), before: short(fa[k]), after: "" });
    else out.push({ path: k, kind: "added", category: category(k), before: "", after: short(fb[k]) });
  }
  return out;
}
const sections = (d) => (((d.content || {}).sections) || []);
function diffSections(listA, listB) {
  const out = [], byA = new Map(listA.map((s, i) => [s.id, { s, i }])), byB = new Map(listB.map((s, i) => [s.id, { s, i }]));
  for (const [id, { s, i }] of byB) {
    if (!byA.has(id)) { out.push({ path: `section:${id}`, kind: "added", category: "structure", before: "", after: `${s.type}${s.title ? ` « ${s.title} »` : ""}`, section: id }); continue; }
    const a = byA.get(id);
    if (a.i !== i) out.push({ path: `section:${id}`, kind: "moved", category: "structure", before: `position ${a.i + 1}`, after: `position ${i + 1}`, section: id });
    for (const d of diffValue(a.s, s, `section:${id}`)) out.push({ ...d, section: id });
  }
  for (const [id, { s }] of byA) if (!byB.has(id)) out.push({ path: `section:${id}`, kind: "removed", category: "structure", before: `${s.type}${s.title ? ` « ${s.title} »` : ""}`, after: "", section: id });
  return out;
}
function compareData(level, a, b) {
  if (level === "page") { const ch = [...diffSections(sections(a), sections(b))]; for (const k of ["title", "description"]) if (((a.content || {})[k] || "") !== ((b.content || {})[k] || "")) ch.push({ path: k, kind: "changed", category: "content", before: short((a.content || {})[k]), after: short((b.content || {})[k]) }); ch.push(...diffValue((a.content || {}).seo || {}, (b.content || {}).seo || {}, "seo").map((x) => ({ ...x, category: "content" }))); ch.push(...diffValue((a.content || {}).theme || {}, (b.content || {}).theme || {}, "theme").map((x) => ({ ...x, category: "style" }))); return ch; }
  if (level === "section") return diffValue(a.section, b.section, "section");
  if (level === "node") return diffValue(a.node, b.node, "element");
  if (level === "design") return diffValue(a.changes, b.changes, "design").map((x) => ({ ...x, category: "style" }));
  return [];
}
// Comparaison de deux snapshots (même niveau). Un snapshot de site est comparé page par page.
function compare(snapA, snapB, { resolve = null } = {}) {
  if (snapA.level !== snapB.level) { const e = new Error("Deux versions de niveaux différents ne se comparent pas."); e.code = "invalid_field"; throw e; }
  const identical = snapA.fp === snapB.fp;
  const base = { level: snapA.level, a: { id: snapA.id, at: snapA.createdAt, label: snapA.label }, b: { id: snapB.id, at: snapB.createdAt, label: snapB.label }, identical };
  if (identical) return { ...base, changes: [], summary: { total: 0 } };
  let changes;
  if (snapA.level === "site" && resolve) {
    changes = [];
    const pa = new Map(snapA.data.pages.map((p) => [p.pageId, p.snapId])), pb = new Map(snapB.data.pages.map((p) => [p.pageId, p.snapId]));
    for (const id of new Set([...pa.keys(), ...pb.keys()])) {
      if (!pa.has(id)) { changes.push({ path: `page:${id}`, kind: "added", category: "structure", before: "", after: "page ajoutée", page: id }); continue; }
      if (!pb.has(id)) { changes.push({ path: `page:${id}`, kind: "removed", category: "structure", before: "page retirée", after: "", page: id }); continue; }
      if (pa.get(id) !== pb.get(id)) for (const c of compareData("page", resolve(pa.get(id)).data, resolve(pb.get(id)).data)) changes.push({ ...c, page: id });
    }
    if (snapA.data.design !== snapB.data.design) for (const c of compareData("design", resolve(snapA.data.design).data, resolve(snapB.data.design).data)) changes.push({ ...c, page: null });
  } else changes = compareData(snapA.level, snapA.data, snapB.data);
  const count = (k) => changes.filter((c) => c.kind === k).length, cat = (k) => changes.filter((c) => c.category === k).length;
  return { ...base, changes, summary: { total: changes.length, added: count("added"), removed: count("removed"), changed: count("changed"), moved: count("moved"), content: cat("content"), style: cat("style"), media: cat("media"), structure: cat("structure") } };
}
module.exports = { compare, diffValue, diffSections, category, fp, norm };
