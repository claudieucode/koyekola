#!/usr/bin/env node
// Contrôle qualité STATIQUE de la bibliothèque « Page individuelle » v2 : identité propre en valeurs fixes (aucun jeton du site), polices de la bibliothèque locale (2 au plus), contraste lisible,
// un H1 {{post.title}} et un postcontent, aucun élément d'article, aucune donnée inventée, grilles repliées, aucun positionnement absolu, grammaire du Page Builder, diversité (similarité de structure ≤ 0,70).
// Usage : KW_SINGLE_PAGE_V2=1 node scripts/audit-page-individuelle.js [--all] [--target=100] ; sans KW_SINGLE_PAGE_V2, contrôle le catalogue en service.
const os = require("os"), fs = require("fs"), path = require("path");
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "kola-audit-page-"));
const args = process.argv.slice(2), all = args.includes("--all");
const TARGET = Number((args.find((a) => a.startsWith("--target=")) || "").slice(9)) || 100, SIMILAR = 0.70;
const db = require("../src/config/database");
try { require("../src/marketing/migrate"); } catch { /* facultatif */ }
const sections = require("../src/marketing/pages/sections"), nodes = require("../src/marketing/pages/nodes");
const Catalog = require("../src/themeBuilder/catalog"), fonts = require("../src/utils/fontLibrary");
const ctx = { db, organizationId: 1, settings: { get: () => "[]", set() {} } };
const entries = Catalog.entries("single_page"), issues = [];
const bad = (e, m) => issues.push({ ref: e.key, problem: m });
const lum = (hex) => { const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const walkAll = (x, fn) => { if (Array.isArray(x)) return x.forEach((y) => walkAll(y, fn)); if (!x || typeof x !== "object") return; if (x.type) fn(x); for (const v of Object.values(x)) if (v && typeof v === "object") walkAll(v, fn); };
const LAYOUT_KEYS = ["display", "flexDirection", "columns", "gridTemplate", "justifyContent", "alignItems", "position"];
function signature(list) {
  const set = new Map(), add = (k) => set.set(k, (set.get(k) || 0) + 1);
  const walk = (x, pth) => {
    if (Array.isArray(x)) return x.forEach((y) => walk(y, pth));
    if (!x || typeof x !== "object") return;
    let here = pth;
    if (typeof x.type === "string") {
      const kids = Array.isArray(x.children) ? x.children.length : 0, d = (x.styles && x.styles.desktop) || {};
      here = `${pth}/${x.type}[${kids}]{${LAYOUT_KEYS.filter((k) => d[k] !== undefined).map((k) => `${k}=${d[k]}`).join(",")}}`; add(here);
    }
    for (const k of ["children", "sections", "section"]) if (x[k]) walk(x[k], here);
  };
  walk(list, ""); return set;
}
const jaccard = (a, b) => { let i = 0, u = 0; for (const k of new Set([...a.keys(), ...b.keys()])) { const x = a.get(k) || 0, y = b.get(k) || 0; i += Math.min(x, y); u += Math.max(x, y); } return u ? i / u : 1; };
if (entries.length !== TARGET) issues.push({ ref: "single_page:*", problem: `${entries.length} modèles au lieu de ${TARGET}` });
const names = new Set(), keys = new Set(), sigs = new Map(), skinsSeen = new Map();
const ARTICLE = ["posts", "postmeta", "postnav", "postcomments", "archiveinfo", "authorbox", "shopbuy"];
const FAKE = /€|\$\d|\d{2}\s?%|@[a-z0-9-]+\.[a-z]{2,}|\+33|https?:\/\/(?!www\.(facebook|linkedin)\.com\/)|lorem ipsum|<script|javascript:/i;
for (const e of entries) {
  if (keys.has(e.key)) bad(e, "clé en double"); keys.add(e.key);
  if (names.has(e.name)) bad(e, "nom en double"); names.add(e.name);
  if (!e.desc || e.desc.length < 30) bad(e, "description trop courte");
  let doc; try { doc = Catalog.build("single_page", e.key, {}); } catch (err) { bad(e, `construction impossible : ${err.message}`); continue; }
  const list = doc.sections, json = JSON.stringify(list);
  try { const norm = sections.normalizeSections(ctx, JSON.parse(json).map((s) => ({ ...s, id: s.id || sections.newSectionId() }))); if (!norm.length) bad(e, "rejeté par le moteur"); } catch (err) { bad(e, `rejeté par le moteur : ${String(err.message).slice(0, 140)}`); }
  // identité : aucune référence au site
  if (/"token:/.test(json)) bad(e, "dépend des jetons du site (token:…)");
  const fams = new Set(); for (const m of json.matchAll(/"fontFamily":"([^"]+)"/g)) fams.add(m[1]);
  for (const f of fams) { if (!/^font\./.test(f)) bad(e, `police du site ou système « ${f} »`); else if (!fonts.byId(f)) bad(e, `police absente de la bibliothèque : ${f}`); }
  if (fams.size > 2) bad(e, `${fams.size} polices (2 au plus)`);
  const S = (Catalog.SKINS && null) || null;
  let h1 = 0, content = 0, n = 0, abs = 0, grids = 0, badGrids = 0;
  walkAll(list, (x) => {
    n += 1; if (x.type === "heading" && x.props && x.props.level === "1") { h1 += 1; if (x.props.text !== "{{post.title}}") bad(e, "H1 qui n'est pas le titre de la page"); }
    if (x.type === "postcontent") content += 1; if (ARTICLE.includes(x.type)) bad(e, `élément d'article « ${x.type} »`);
    const d = (x.styles && x.styles.desktop) || {}; if (/absolute|fixed/.test(String(d.position || ""))) abs += 1;
    if (x.type === "grid") { grids += 1; const t = (x.styles && x.styles.tablet) || {}, m = (x.styles && x.styles.mobile) || {}; if (Number(t.columns) > 2 || Number(m.columns) !== 1) badGrids += 1; }
    if (x.type === "image" && !/^\{\{post\.image\}\}$/.test(String((x.props || {}).src))) bad(e, "image factice");
  });
  const props = []; walkAll(list, (x) => { if (x.props) props.push(JSON.stringify(x.props)); });
  if (FAKE.test(props.join("\n"))) bad(e, "contenu inventé (prix, e-mail, téléphone, lien externe, chiffre)");
  if (h1 !== 1) bad(e, `${h1} H1 (attendu : 1)`); if (content !== 1) bad(e, `${content} postcontent (attendu : 1)`);
  if (n > nodes.MAX_NODES) bad(e, `trop d'éléments (${n})`); if (abs) bad(e, "position absolue ou fixe"); if (badGrids) bad(e, `${badGrids} grille(s) mal repliée(s)`);
  // contraste de l'identité (texte/fond, texte discret/fond, texte sur accent/accent)
  const skin = Catalog.entries("single_page") && require("../src/themeBuilder/catalog/single_page").skins ? require("../src/themeBuilder/catalog/single_page").skins.find((s) => s.key === e.skinKey) : null;
  if (skin) {
    if (ratio(skin.fg, skin.bg) < 7) bad(e, `contraste texte/fond ${ratio(skin.fg, skin.bg).toFixed(1)} (7 au moins)`);
    if (ratio(skin.mute, skin.bg) < 4.5) bad(e, `contraste texte discret/fond ${ratio(skin.mute, skin.bg).toFixed(1)} (4,5 au moins)`);
    if (ratio(skin.onAccent, skin.accent) < 4.5) bad(e, `contraste texte sur accent ${ratio(skin.onAccent, skin.accent).toFixed(1)} (4,5 au moins)`);
    if (ratio(skin.accent, skin.bg) < 3 && ratio(skin.accent, skin.alt) < 3) bad(e, `accent peu visible sur le fond (${ratio(skin.accent, skin.bg).toFixed(1)})`);
    const k = `${skin.bg}|${skin.fg}|${skin.accent}|${skin.head}|${skin.font}`; if (skinsSeen.has(k)) bad(e, `même identité que ${skinsSeen.get(k)}`); skinsSeen.set(k, e.key);
  } else bad(e, "identité propre introuvable (ownSkins)");
  sigs.set(e.key, signature(list));
}
const refs = [...sigs.keys()];
for (let i = 0; i < refs.length; i += 1) for (let j = i + 1; j < refs.length; j += 1) { const s = jaccard(sigs.get(refs[i]), sigs.get(refs[j])); if (s >= SIMILAR) issues.push({ ref: refs[j], problem: `quasi-doublon de ${refs[i]} (similarité ${s.toFixed(2)})` }); }
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
console.log(`${entries.length === TARGET ? "OK " : "KO "} Page individuelle ${entries.length} / ${TARGET}   défauts : ${issues.length}`);
for (const i of issues.slice(0, all ? 9999 : 15)) console.log(`      ${i.ref} — ${i.problem}`);
console.log(issues.length ? `\n${issues.length} défaut(s).` : "\nCatégorie conforme.");
process.exit(issues.length ? 1 : 0);
