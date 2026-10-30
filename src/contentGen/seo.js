// SEO Content Engine : s'appuie sur le SEO EXISTANT (champ `seo` du brouillon d'une page : title ≤ 70, description ≤ 160, focusKeyword ; le moteur SEO du site lit ces valeurs). Aucun second système :
// ce module PRÉPARE ces champs et CONTRÔLE la structure éditoriale. Aucune donnée de volume, de difficulté ou de concurrence n'existe ici : `volume` vaut toujours null.
const { norm } = require("./facts");

const LIMITS = Object.freeze({ title: 60, titleHard: 70, descMin: 70, desc: 160, slug: 60, density: 0.03 });
const STOP = new Set("le la les un une des de du d l et ou en à au aux pour par sur dans avec sans votre vos notre nos que qui est sont the a an and or of to for in on with your our is are el los las y o del para con su sus um uma e do da dos das com seu".split(" "));
const words = (s) => norm(s).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
const content = (s) => words(s).filter((w) => w.length > 2 && !STOP.has(w));

// Mots-clés : 3 provenances distinctes, jamais mélangées ; aucune donnée de recherche
function keywordSet(kw = {}) {
  return { provided: kw.provided || [], suggested: kw.suggested || [], external: kw.external || [], externalSource: kw.source || "", volume: null, difficulty: null, competition: null,
    note: "Aucune donnée de volume, de difficulté ni de concurrence n'est disponible dans Kolakisa : ne pas en déduire." };
}
const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, LIMITS.slug);

// Contrôle des métadonnées d'une page (sévérités : critical | important | improve | suggestion)
function checkMeta(meta, { bodyText = "", keyword = "", h1 = "" } = {}) {
  const out = [];
  const add = (severity, code, message, certain = true) => out.push({ severity, code, field: "seo", message, certain });
  const title = String(meta.title || ""), desc = String(meta.description || "");
  if (!title) add("important", "seo_title_missing", "Titre SEO absent.");
  else { if (title.length > LIMITS.titleHard) add("critical", "seo_title_too_long", `Titre SEO de ${title.length} caractères : le CMS le limite à ${LIMITS.titleHard}.`); else if (title.length > LIMITS.title) add("improve", "seo_title_long", `Titre SEO de ${title.length} caractères : au-delà de ${LIMITS.title}, il risque d'être tronqué dans les résultats (repère courant, non garanti).`, false); if (title.length < 15) add("suggestion", "seo_title_short", "Titre SEO très court.", false); }
  if (!desc) add("important", "seo_desc_missing", "Description SEO absente.");
  else { if (desc.length > LIMITS.desc) add("critical", "seo_desc_too_long", `Description de ${desc.length} caractères : le CMS la limite à ${LIMITS.desc}.`); else if (desc.length < LIMITS.descMin) add("suggestion", "seo_desc_short", `Description de ${desc.length} caractères : ${LIMITS.descMin} à ${LIMITS.desc} sont plus informatifs (repère courant).`, false); }
  if (title && desc && norm(title) === norm(desc)) add("improve", "seo_title_eq_desc", "Titre et description identiques.");
  if (meta.slug && meta.slug !== slugify(meta.slug)) add("important", "seo_slug_invalid", "Adresse (slug) non normalisée : minuscules, chiffres et tirets.");
  const k = norm(keyword).trim();
  if (k) {
    const kw = words(k);
    const has = (s) => { const w = words(s); return kw.every((x) => w.includes(x)); };
    if (title && !has(title)) add("suggestion", "seo_kw_not_in_title", "Le mot-clé principal n'apparaît pas dans le titre SEO.", false);
    if (h1 && !has(h1)) add("suggestion", "seo_kw_not_in_h1", "Le mot-clé principal n'apparaît pas dans le titre principal (H1).", false);
    const body = words(bodyText);
    if (body.length >= 60 && kw.length) {
      let n = 0; for (let i = 0; i + kw.length <= body.length; i++) if (kw.every((x, j) => body[i + j] === x)) n++;
      const density = (n * kw.length) / body.length;
      if (density > LIMITS.density) add("important", "seo_kw_stuffing", `Mot-clé répété ${n} fois dans ${body.length} mots (${(density * 100).toFixed(1)} %) : risque de bourrage ; reformulez.`);
    }
  }
  return out;
}
// Hiérarchie des titres déduite des sections natives : le titre du bandeau est le H1, les titres de section sont des H2 (convention du moteur de rendu, _sections.ejs) ; les titres Markdown d'un texte comptent à leur niveau
function outline(sections) {
  const heads = [];
  for (const s of sections) {
    if (s.type === "hero" && s.title) heads.push({ level: 1, text: s.title, section: s.id });
    else if (["features", "faq", "cta", "list", "testimonials"].includes(s.type) && s.title) heads.push({ level: 2, text: s.title, section: s.id });
    else if (s.type === "form" && s.heading) heads.push({ level: 2, text: s.heading, section: s.id });
    if (s.type === "text") for (const m of String(s.markdown || "").matchAll(/^(#{1,6})\s+(.+)$/gm)) heads.push({ level: m[1].length, text: m[2].trim(), section: s.id });
  }
  return heads;
}
function checkStructure(sections) {
  const out = [], h = outline(sections);
  const add = (severity, code, message, section) => out.push({ severity, code, field: section ? `${section}/` : "structure", message, certain: true });
  const h1 = h.filter((x) => x.level === 1);
  if (!h1.length) add("important", "seo_no_h1", "Aucun titre principal (H1) : ajoutez un bandeau avec un titre.");
  if (h1.length > 1) add("important", "seo_many_h1", `${h1.length} titres principaux (H1) : une page n'en a qu'un.`, h1[1].section);
  for (let i = 1; i < h.length; i++) if (h[i].level > h[i - 1].level + 1) add("improve", "seo_heading_skip", `Saut de niveau de titre (H${h[i - 1].level} puis H${h[i].level}).`, h[i].section);
  for (const s of sections) {
    if (s.type === "image" && !String(s.alt || "").trim()) add("important", "seo_alt_missing", "Image sans texte alternatif.", s.id);
    if (s.type === "hero" && s.image && !String(s.imageAlt || "").trim()) add("important", "seo_alt_missing", "Image du bandeau sans texte alternatif.", s.id);
  }
  return { issues: out, outline: h };
}
// Risque de cannibalisation : deux pages du site visant le même mot-clé ou ayant des titres quasi identiques
function cannibalization(pages) {
  const out = [];
  const jac = (a, b) => { const A = new Set(content(a)), B = new Set(content(b)); const inter = [...A].filter((x) => B.has(x)).length; const uni = new Set([...A, ...B]).size; return uni ? inter / uni : 0; };
  for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) {
    const a = pages[i], b = pages[j];
    if (a.focusKeyword && norm(a.focusKeyword) === norm(b.focusKeyword)) out.push({ severity: "important", code: "seo_cannibal_keyword", pages: [a.key, b.key], message: `Les pages « ${a.name} » et « ${b.name} » visent le même mot-clé principal : elles se feront concurrence.`, certain: true });
    else if (a.title && b.title && jac(a.title, b.title) >= 0.7) out.push({ severity: "improve", code: "seo_cannibal_title", pages: [a.key, b.key], message: `Les titres SEO de « ${a.name} » et « ${b.name} » sont très proches : différenciez-les.`, certain: false });
  }
  return out;
}
// Liens internes SUGGÉRÉS (jamais insérés) : une page du site dont le nom apparaît dans le texte
function internalLinks(text, siblings, selfKey) {
  const t = norm(text);
  return siblings.filter((p) => p.key !== selfKey && p.slug && p.name && norm(p.name).length >= 4 && t.includes(norm(p.name))).slice(0, 5).map((p) => ({ page: p.name, url: `/p/${p.slug}`, anchor: p.name }));
}
module.exports = { LIMITS, keywordSet, slugify, checkMeta, outline, checkStructure, cannibalization, internalLinks, words, content };
