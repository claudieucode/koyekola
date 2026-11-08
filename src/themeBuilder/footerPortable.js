// Export / import / duplication des PIEDS DE PAGE (chantier G). Formats fermés et versionnés :
//   kolakisa-footer-template@1  un pied      kolakisa-footer-bundle@1  plusieurs pieds (lot)
// Règles : jamais d'identifiant du site d'origine, jamais de fichier embarqué (médias = références listées), aucune donnée d'entreprise
// (les étiquettes dynamiques {{business.…}} restent des étiquettes), tout est REVALIDÉ à l'import par les normaliseurs natifs, import toujours en BROUILLON.
const crypto = require("crypto");
const { MarketingError } = require("../marketing/errors");
const { transaction } = require("../marketing/db/tx");
const Cond = require("./conditions");
const store = require("./store");

const FORMAT = "kolakisa-footer-template@1", BUNDLE_FORMAT = "kolakisa-footer-bundle@1", VERSION = 1;
const MAX_BYTES = 2_000_000, MAX_BUNDLE = 50, MAX_NODES = 1500, MAX_DEPTH = 24, MAX_MEDIA = 200;
const P = () => require("../marketing/pages");
const S = () => require("../marketing/pages/sections");
const bad = (m, code = "invalid_field") => new MarketingError(code, m);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const BAD_SCHEME = /^[\s\u0000-\u001f]*(?:javascript|data|vbscript|file):/i;
const LINK_KEY = /(?:href|url|link|src|image|action|poster|target)$/i;
const MEDIA_KEY = /(?:src|image|poster|logo|avatar|photo|background)/i;
const UPLOAD_RE = /\/uploads\/marketing\/(\d+)\/[A-Za-z0-9._\/-]*/g;
const newId = () => crypto.randomBytes(6).toString("hex");
const cleanName = (n, fallback) => String(n == null ? "" : n).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) || fallback;
const shortType = (t) => String(t == null ? "?" : t).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || "?";

// ---------- EXPORT ----------
function collectMedia(value, key, out) {
  if (typeof value === "string") {
    for (const m of value.match(UPLOAD_RE) || []) out.set(m, { url: m, origin: "mediatheque" });
    if (MEDIA_KEY.test(key || "") && /^https:\/\/\S+$/i.test(value) && !out.has(value)) out.set(value, { url: value, origin: "externe" });
  } else if (Array.isArray(value)) value.forEach((v) => collectMedia(v, key, out));
  else if (isObj(value)) for (const k of Object.keys(value)) collectMedia(value[k], k, out);
}
// Copie du document pour l'export : le numéro de formulaire (propre au site) est retiré, rien d'autre n'est modifié
function stripSite(node, notes, depth = 0) {
  if (Array.isArray(node)) return node.map((x) => stripSite(x, notes, depth + 1));
  if (!isObj(node)) return node;
  const out = {};
  for (const k of Object.keys(node)) {
    if (FORBIDDEN_KEYS.has(k)) continue;
    if (k === "formId" && node[k] !== undefined) { notes.formId = (notes.formId || 0) + 1; continue; }
    out[k] = stripSite(node[k], notes, depth + 1);
  }
  return out;
}
function stats(section) {
  const types = {}; let nodes = 0;
  const walk = (list) => (list || []).forEach((n) => { if (!isObj(n)) return; nodes += 1; const t = shortType(n.type); types[t] = (types[t] || 0) + 1; walk(n.children); });
  walk(section && section.children);
  return { nodes, types };
}
function conditionsForExport(c) {
  let stripped = 0;
  const side = (list) => (list || []).map((x) => { const y = { ...x }; for (const k of ["ids", "author", "parent"]) if (y[k] !== undefined) { delete y[k]; stripped += 1; } return y; }).filter((x) => !(x.kind === "child_of" && !x.parent));
  return { conditions: { include: side(c.include), exclude: side(c.exclude) }, stripped };
}
function exportFooter(ctx, siteId, id, { conditions = false } = {}) {
  const t = store.get(ctx, siteId, id);
  if (t.type !== "footer") throw bad("Ce modèle n'est pas un pied de page.");
  const c = P().getComponent(ctx, t.sourceId);
  if (!c) throw bad("Le document de ce pied de page n'existe plus.", "not_found");
  const working = c.draft || c.section; // ce que l'éditeur montre (copie de travail), pas seulement la version diffusée
  const notes = {}, media = new Map();
  const section = stripSite(JSON.parse(JSON.stringify(working)), notes);
  collectMedia(section, "", media);
  const list = [];
  const template = { type: "footer", name: t.name };
  if (conditions) { const r = conditionsForExport(t.conditions); template.conditions = r.conditions; if (r.stripped) list.push(`${r.stripped} critère(s) propre(s) au site (identifiants) retiré(s) des conditions.`); }
  else list.push("Les conditions d'affichage ne sont pas incluses : le pied sera importé en brouillon, sans condition.");
  if (notes.formId) list.push(`${notes.formId} numéro(s) de formulaire retiré(s) : à reconfigurer dans le site d'arrivée.`);
  const mediaList = [...media.values()].slice(0, MAX_MEDIA);
  if (mediaList.length) list.push(`${mediaList.length} image(s) ou média(s) référencé(s) par adresse, SANS être embarqué(s) : ils doivent exister dans le site d'arrivée.`);
  const s = stats(section);
  return { format: FORMAT, formatVersion: VERSION, exportedAt: new Date().toISOString(), generator: "Kolakisa Footer Builder", template, document: { kind: "component", section }, media: mediaList, summary: { elements: s.nodes, types: s.types }, notes: list };
}
function exportFooters(ctx, siteId, ids, opts = {}) {
  store.site(ctx, siteId);
  let list;
  if (Array.isArray(ids) && ids.length) list = [...new Set(ids.map(Number))].filter((n) => Number.isInteger(n) && n > 0);
  else list = store.list(ctx, siteId, { type: "footer" }).map((t) => t.id);
  if (!list.length) throw bad("Aucun pied de page à exporter.", "not_found");
  if (list.length > MAX_BUNDLE) throw bad(`${MAX_BUNDLE} pieds au plus par archive.`);
  const templates = list.map((id) => exportFooter(ctx, siteId, id, opts));
  return { format: BUNDLE_FORMAT, formatVersion: VERSION, exportedAt: new Date().toISOString(), generator: "Kolakisa Footer Builder", count: templates.length, templates };
}

// ---------- IMPORT : nettoyage ----------
function cleanString(s, key, st) {
  let v = s;
  const stripped = v.replace(/<\s*(script|style)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "").replace(/<\s*\/?\s*(?:script|style|iframe|object|embed)\b[^>]*>/gi, "");
  if (stripped !== v) { st.flags.add("Du code actif (script, iframe…) a été retiré d'un texte."); v = stripped; }
  if (LINK_KEY.test(key || "") && !/\s/.test(v.trim()) && BAD_SCHEME.test(v)) { st.flags.add("Un lien dangereux (javascript:, data:…) a été supprimé."); return ""; }
  let blocked = false, foreign = false;
  v.replace(UPLOAD_RE, (m, org) => { if (Number(org) !== st.orgId) blocked = true; else if (!m.startsWith(`/uploads/marketing/${org}/site-${st.siteId}/`) && /\/site-\d+\//.test(m)) foreign = true; return m; });
  if (blocked) { st.flags.add("Une image d'une autre organisation n'a pas été reprise (elle a été vidée)."); return ""; }
  if (foreign) st.flags.add("Une image vient d'un autre site de votre organisation : elle reste liée à ce fichier d'origine.");
  return v;
}
function cleanValue(v, key, st, depth = 0) {
  if (depth > MAX_DEPTH) throw bad("Le fichier est trop profondément imbriqué.");
  if (typeof v === "string") return cleanString(v, key, st);
  if (Array.isArray(v)) return v.map((x) => cleanValue(x, key, st, depth + 1));
  if (isObj(v)) { const o = {}; for (const k of Object.keys(v)) { if (FORBIDDEN_KEYS.has(k)) continue; o[k] = cleanValue(v[k], k, st, depth + 1); } return o; }
  return v;
}
function trial(ctx, node) {
  S().normalizeSection(ctx, { type: "layout", children: [node] }, 0, { n: 0, ids: new Set() });
}
function walkNodes(ctx, list, st, depth) {
  if (!Array.isArray(list)) return [];
  if (depth > MAX_DEPTH) throw bad("Le pied est trop profondément imbriqué.");
  const out = [];
  for (const raw of list) {
    if (!isObj(raw)) { st.warnings.push("Un élément illisible a été ignoré."); continue; }
    if (++st.count > MAX_NODES) throw bad(`Le pied contient trop d'éléments (${MAX_NODES} au plus).`);
    const { children, ...rest } = raw;
    const flat = cleanValue(rest, "", st);
    const kids = Array.isArray(children) ? walkNodes(ctx, children, st, depth + 1) : null;
    try { trial(ctx, kids ? { ...flat, children: [] } : flat); }
    catch (e) {
      if (!(e instanceof MarketingError)) throw e;
      const type = shortType(raw.type);
      if (/inconnu/.test(e.message)) { st.unknown.push(type); st.warnings.push(`Le widget « ${type} » n'existe pas dans cette version : il a été retiré.`); }
      else st.warnings.push(`Le widget « ${type} » a été retiré : ${e.message.replace(/^[^:]*:\s*/, "").slice(0, 200)}`);
      continue;
    }
    out.push(kids ? { ...flat, children: kids } : flat);
  }
  return out;
}
function regenerateIds(nodes) {
  const map = new Map();
  const assign = (list) => (list || []).forEach((n) => { if (n.id !== undefined) { const id = newId(); map.set(String(n.id), id); n.id = id; } assign(n.children); });
  const remap = (list) => (list || []).forEach((n) => { if (Array.isArray(n.interactions)) for (const x of n.interactions) if (isObj(x) && map.has(String(x.target))) x.target = map.get(String(x.target)); remap(n.children); });
  assign(nodes); remap(nodes);
}
function sanitizeSection(ctx, siteId, raw) {
  if (!isObj(raw) || raw.type !== "layout") throw bad("Le document du pied est absent ou n'est pas une mise en page valide.");
  const st = { flags: new Set(), warnings: [], unknown: [], count: 0, orgId: ctx.organizationId, siteId };
  const { children, ...rest } = raw;
  const root = { ...cleanValue(rest, "", st), type: "layout", children: walkNodes(ctx, children, st, 0) };
  delete root.id;
  regenerateIds(root.children);
  try { S().normalizeSection(ctx, root, 0, { n: 0, ids: new Set() }); } catch (e) { if (e instanceof MarketingError) throw bad(`Le pied n'a pas pu être validé : ${e.message}`); throw e; }
  const s = stats(root);
  return { section: root, warnings: [...st.flags, ...st.warnings], unknown: [...new Set(st.unknown)], nodes: s.nodes, types: s.types };
}

// ---------- IMPORT : lecture du fichier ----------
function readFile(payload) {
  let p = payload;
  if (typeof p === "string") {
    if (Buffer.byteLength(p) > MAX_BYTES) throw bad("Fichier trop volumineux (2 Mo au plus).");
    try { p = JSON.parse(p); } catch { throw bad("Ce fichier n'est pas un JSON valide."); }
  }
  if (!isObj(p)) throw bad("Fichier non reconnu : exportez un pied de page depuis le Theme Builder.");
  let size; try { size = Buffer.byteLength(JSON.stringify(p)); } catch { throw bad("Fichier illisible."); }
  if (size > MAX_BYTES) throw bad("Fichier trop volumineux (2 Mo au plus).");
  const f = String(p.format || "");
  const m = /^kolakisa-footer-(template|bundle)@(\d+)$/.exec(f);
  if (m) {
    if (Number(m[2]) !== VERSION) throw bad(`Version ${m[2]} du fichier non prise en charge (cette version de Kolakisa lit la version ${VERSION}). Mettez Kolakisa à jour ou ré-exportez le pied.`);
    if (m[1] === "template") return [p];
    if (!Array.isArray(p.templates) || !p.templates.length) throw bad("L'archive ne contient aucun pied.");
    if (p.templates.length > MAX_BUNDLE) throw bad(`${MAX_BUNDLE} pieds au plus par archive.`);
    return p.templates.map((t) => { if (!isObj(t) || t.format !== FORMAT) throw bad("L'archive contient un élément qui n'est pas un pied de page."); return t; });
  }
  if (f === "kolakisa-theme-template@1" && isObj(p.template) && p.template.type === "footer") return [p]; // ancien format
  throw bad("Fichier non reconnu : ce n'est pas un pied de page exporté par Kolakisa.");
}
function importName(ctx, siteId, wanted, taken) {
  const exists = (n) => taken.has(n.toLowerCase()) || store.list(ctx, siteId).some((t) => t.name.toLowerCase() === n.toLowerCase());
  let n = wanted;
  if (exists(n)) { n = `Copie de ${wanted}`.slice(0, 100); let i = 2; while (exists(n)) n = `Copie de ${wanted} (${i++})`.slice(0, 100); }
  taken.add(n.toLowerCase());
  return n;
}
function plan(ctx, siteId, payload) {
  store.site(ctx, siteId);
  const files = readFile(payload), taken = new Set(), items = [];
  for (const f of files) {
    const tpl = isObj(f.template) ? f.template : {}, doc = isObj(f.document) ? f.document : {};
    if (tpl.type !== "footer") throw bad("Le fichier ne contient pas un pied de page.");
    if (doc.kind !== "component") throw bad("Le document du pied est absent ou d'un mauvais type.");
    const r = sanitizeSection(ctx, siteId, doc.section);
    let conditions = { include: [], exclude: [] }; const warnings = [...r.warnings];
    if (tpl.conditions !== undefined && tpl.conditions !== null) {
      try { conditions = Cond.normalize(tpl.conditions, "footer"); } catch (e) { throw bad(`Conditions invalides dans le fichier : ${e.message}`); }
    }
    const name = cleanName(tpl.name, "Pied importé");
    const finalName = importName(ctx, siteId, name, taken);
    if (finalName !== name) warnings.push(`Un modèle porte déjà ce nom : il sera importé sous « ${finalName} ».`);
    const mm = new Map(); collectMedia(r.section, "", mm);
    items.push({ name, finalName, section: r.section, conditions, warnings, unknown: r.unknown, elements: r.nodes, types: r.types, media: [...mm.values()].slice(0, MAX_MEDIA) });
  }
  return { bundle: files.length > 1 || String(payload && payload.format || "").includes("bundle"), items };
}
function preview(ctx, siteId, payload) {
  const p = plan(ctx, siteId, payload);
  return { bundle: p.bundle, items: p.items.map(({ section, ...x }) => ({ ...x, status: "draft" })), warnings: p.items.flatMap((i) => i.warnings.map((w) => (p.items.length > 1 ? `${i.finalName} : ${w}` : w))) };
}
function importFooters(ctx, siteId, payload) {
  const p = plan(ctx, siteId, payload);
  const templates = transaction(ctx.db, () => p.items.map((it) => {
    const comp = P().createComponent(ctx, { name: store.docName(ctx, siteId, "component", it.finalName), section: it.section, siteId, kind: "standard" });
    return store.create(ctx, siteId, { type: "footer", name: it.finalName, conditions: it.conditions, sourceKind: "component", sourceId: comp.id });
  }));
  return { templates, warnings: p.items.flatMap((i) => i.warnings.map((w) => (p.items.length > 1 ? `${i.finalName} : ${w}` : w))), items: p.items.map(({ section, ...x }) => x) };
}

// ---------- DUPLICATION (même site) ----------
function duplicateFooter(ctx, siteId, id) {
  const t = store.get(ctx, siteId, id);
  if (t.type !== "footer") return store.duplicate(ctx, siteId, id);
  const c = P().getComponent(ctx, t.sourceId);
  if (!c) throw bad("Le document de ce pied de page n'existe plus.", "not_found");
  const name = importName(ctx, siteId, cleanName(t.name, "Pied"), new Set());
  return transaction(ctx.db, () => {
    const comp = P().createComponent(ctx, { name: store.docName(ctx, siteId, "component", name), section: c.draft || c.section, siteId, kind: "standard" });
    return store.create(ctx, siteId, { type: "footer", name, conditions: {}, sourceKind: "component", sourceId: comp.id });
  });
}
module.exports = { FORMAT, BUNDLE_FORMAT, VERSION, MAX_BYTES, exportFooter, exportFooters, preview, importFooters, duplicateFooter, sanitizeSection };
