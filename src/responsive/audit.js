// Responsive Validation Engine — volet STATIQUE (programme 22.8). Lit l'arbre d'éléments d'une section libre, résout l'héritage natif (ordinateur → tablette → mobile) et signale
// ce qui posera problème AVANT rendu. Chaque constat : page, section, élément, écran, gravité, preuve (valeur résolue), correction proposée (réglage d'écran, jamais de
// modification de l'ordinateur). Les constats vérifiés dans un vrai navigateur (débordement mesuré, cibles tactiles) sont produits par browser.js ; les deux se complètent.
const Fluid = require("./fluid");

const SEV = { blocking: 3, warning: 2, suggestion: 1 };
const px = (v) => { const m = /^(-?\d+(?:\.\d+)?)px$/.exec(String(v ?? "")); return m ? Number(m[1]) : null; };
const remPx = (v) => { const m = /^(\d+(?:\.\d+)?)rem$/.exec(String(v ?? "")); return m ? Number(m[1]) * 16 : null; };
const lenPx = (v) => px(v) ?? remPx(v);
const tracks = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;
const ORDER = { desktop: ["desktop"], wide: ["desktop", "wide"], tablet: ["desktop", "tablet"], mobile: ["desktop", "tablet", "mobile"] };
// Valeur résolue d'un élément pour un écran (même ordre de cascade que pageCss)
function resolved(n, device) {
  const out = {};
  for (const d of ORDER[device]) Object.assign(out, (n.styles && n.styles[d]) || {});
  return out;
}
const own = (n, device, key) => Boolean(n.styles && n.styles[device] && n.styles[device][key] !== undefined);
const ESSENTIAL = new Set(["heading", "button", "form"]);
const hasEssential = (n) => ESSENTIAL.has(n.type) || (n.children || []).some(hasEssential);
function walk(list, fn, parent = null) { for (const n of list || []) { fn(n, parent); walk(n.children, fn, n); } }
const label = (n) => (n.name || (n.props && (n.props.text || n.props.label || n.props.alt)) || n.type || "").toString().replace(/<[^>]*>/g, "").slice(0, 40);

// Règles : chacune renvoie { rule, severity, message, evidence, fix? } ; fix = { device, set: {clé: valeur} } — appliqué seulement là où l'écran n'a pas déjà sa propre valeur.
const RULES = [
  { id: "fixed-width", devices: ["mobile"], run(n, r) {
    const w = lenPx(r.width) ?? lenPx(r.minWidth);
    if (w && w > 380 && !own(n, "mobile", "width") && !own(n, "mobile", "minWidth")) return { severity: "blocking", message: `Largeur fixe de ${w} px : dépasse un téléphone de 360–390 px (défilement horizontal).`, evidence: `width=${r.width || r.minWidth}`, fix: { device: "mobile", set: lenPx(r.width) ? { width: "100%", maxWidth: "100%" } : { minWidth: "0" } } };
  } },
  { id: "grid-narrow", devices: ["mobile"], run(n, r) {
    const c = r.display === "grid" ? (r.columns ? Number(r.columns) : tracks(r.gridTemplate)) : 0;
    if (c >= 3 && !own(n, "mobile", "gridTemplate") && !own(n, "mobile", "columns") && Number(r.columns) !== 12) return { severity: c >= 4 ? "blocking" : "warning", message: `${c} colonnes sur téléphone : colonnes d'environ ${Math.floor(340 / c)} px, texte illisible.`, evidence: `colonnes=${c}`, fix: { device: "mobile", set: { gridTemplate: "1fr" } } };
  } },
  { id: "flex-row-crowded", devices: ["mobile"], run(n, r) {
    if (r.display === "flex" && (r.flexDirection === "row" || r.flexDirection === undefined) && (n.children || []).length >= 3 && r.flexWrap !== "wrap" && !own(n, "mobile", "flexDirection") && !own(n, "mobile", "flexWrap") && (n.children || []).some((c) => c.type !== "icon" && c.type !== "badge"))
      return { severity: "warning", message: `${n.children.length} éléments sur une seule ligne sans retour : serrés ou débordants sur téléphone.`, evidence: "flex row sans wrap", fix: { device: "mobile", set: { flexWrap: "wrap" } } };
  } },
  { id: "heading-too-large", devices: ["mobile"], run(n, r) {
    if (n.type !== "heading") return;
    const s = lenPx(r.fontSize); if (!s || Fluid.isFluid(r.fontSize) || own(n, "mobile", "fontSize")) return;
    if (s > 40) { const f = Fluid.forHeading(s, Number(n.props && n.props.level) || 2); return { severity: s > 56 ? "warning" : "suggestion", message: `Titre de ${s} px sur téléphone : retours à la ligne en cascade, mots coupés.`, evidence: `font-size=${r.fontSize}`, fix: f ? { device: "mobile", set: { fontSize: f } } : null }; }
  } },
  { id: "text-too-small", devices: ["mobile"], run(n, r) {
    if (!["text", "richtext", "list", "quote", "accordion"].includes(n.type)) return;
    const s = lenPx(r.fontSize);
    if (s && s < 14 && !own(n, "mobile", "fontSize")) return { severity: "warning", message: `Texte de ${s} px : sous le minimum lisible sur téléphone (14 px ; 16 px conseillé pour le texte courant).`, evidence: `font-size=${r.fontSize}`, fix: { device: "mobile", set: { fontSize: "16px" } } };
  } },
  { id: "negative-margin", devices: ["mobile"], run(n, r) {
    for (const k of ["marginLeft", "marginRight"]) if (typeof r[k] === "string" && r[k].startsWith("-") && !own(n, "mobile", k)) return { severity: "warning", message: "Marge négative : l'élément sort de l'écran sur un viewport étroit.", evidence: `${k}=${r[k]}`, fix: { device: "mobile", set: { [k]: "0" } } };
  } },
  { id: "tall-hero", devices: ["mobile"], run(n, r) {
    const m = /^(\d+)vh$/.exec(String(r.minHeight || ""));
    if (m && Number(m[1]) > 70 && !own(n, "mobile", "minHeight")) return { severity: "suggestion", message: `Hauteur minimale ${r.minHeight} : le contenu suivant est repoussé sous le pli (barres du navigateur mobile comprises).`, evidence: `min-height=${r.minHeight}`, fix: { device: "mobile", set: { minHeight: "60vh" } } };
  } },
  { id: "spacing-excess", devices: ["mobile"], run(n, r) {
    for (const k of ["paddingTop", "paddingBottom", "gap", "rowGap"]) { const v = lenPx(r[k]); if (v && v > 72 && !own(n, "mobile", k)) return { severity: "suggestion", message: `Espacement de ${v} px : consomme une grande part d'un écran de 800 px de haut.`, evidence: `${k}=${r[k]}`, fix: { device: "mobile", set: { [k]: "40px" } } }; }
  } },
  { id: "tablet-columns", devices: ["tablet"], run(n, r) {
    const c = r.display === "grid" ? (r.columns ? Number(r.columns) : tracks(r.gridTemplate)) : 0;
    if (c >= 4 && Number(r.columns) !== 12 && !own(n, "tablet", "gridTemplate") && !own(n, "tablet", "columns")) return { severity: "suggestion", message: `${c} colonnes à 820 px : cartes d'environ ${Math.floor(780 / c)} px.`, evidence: `colonnes=${c}`, fix: { device: "tablet", set: { gridTemplate: "1fr 1fr" } } };
  } },
  { id: "image-alt", devices: ["mobile"], run(n) {
    if (n.type === "image" && !(n.props && String(n.props.alt || "").trim()) && !(n.props && n.props.decorative)) return { severity: "suggestion", message: "Image sans texte alternatif : rien n'est annoncé par un lecteur d'écran (à renseigner, jamais inventé).", evidence: "alt vide", fix: null };
  } },
  { id: "hidden-essential", devices: ["mobile"], run(n) {
    if (Array.isArray(n.hideOn) && n.hideOn.includes("mobile") && hasEssential(n)) return { severity: "warning", message: "Contenu essentiel (titre, bouton ou formulaire) masqué sur mobile : à réserver à du contenu redondant, pas à contourner un mauvais responsive.", evidence: `hideOn=${n.hideOn.join(",")}`, fix: null };
  } },
];

// Audite une liste de sections (celles d'une page). Renvoie { issues, summary }.
function auditSections(sections, { pageId = null, pageName = "" } = {}) {
  const issues = [];
  for (const sec of sections || []) {
    if (!sec || sec.type !== "layout") continue;
    walk(sec.children, (n) => {
      for (const rule of RULES) for (const device of rule.devices) {
        const found = rule.run(n, resolved(n, device), device);
        if (found) issues.push({ rule: rule.id, severity: found.severity, page: pageId, pageName, section: sec.id, node: n.id, element: `${n.type}${label(n) ? ` « ${label(n)} »` : ""}`, device, message: found.message, evidence: found.evidence, fix: found.fix || null, source: "static" });
      }
    });
  }
  issues.sort((a, b) => SEV[b.severity] - SEV[a.severity]);
  return { issues, summary: summarize(issues) };
}
function summarize(issues) {
  const s = { blocking: 0, warning: 0, suggestion: 0, fixable: 0, total: issues.length };
  for (const i of issues) { s[i.severity] += 1; if (i.fix) s.fixable += 1; }
  return s;
}
module.exports = { auditSections, summarize, resolved, RULES, SEV };
