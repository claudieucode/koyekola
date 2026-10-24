// Bibliothèque de thèmes complets de Kolakisa : catégories, fiches (specs/*.js), manifestes (jetons) pour le catalogue, pages de démonstration compilées à la demande.
// Un thème de la bibliothèque est un paquet de DONNÉES : jetons de design (colonne vertébrale du moteur existant : themes service, catalog.js) + un site de démonstration
// (pages composées de vrais éléments du Page Builder, compose.js) + des visuels originaux (art.js). Rien n'est exécuté : tout passe par la grammaire fermée du moteur.
const fs = require("node:fs");
const path = require("node:path");
const tokensLib = require("../../pages/tokens");
const compose = require("./compose");
const art = require("./art");

// Répartition imposée par la mission (total 160)
const CATEGORIES = Object.freeze([
  { key: "entreprise", label: "Entreprises et services professionnels", count: 12 },
  { key: "agence", label: "Agences créatives, marketing et communication", count: 10 },
  { key: "portfolio", label: "Portfolios, photographie et arts", count: 10 },
  { key: "boutique", label: "Boutiques e-commerce et marques", count: 14 },
  { key: "restaurant", label: "Restaurants, cafés et gastronomie", count: 8 },
  { key: "tourisme", label: "Hôtels, tourisme et voyages", count: 8 },
  { key: "immobilier", label: "Immobilier et architecture", count: 8 },
  { key: "education", label: "Éducation, formation et e-learning", count: 10 },
  { key: "sante", label: "Santé, bien-être et cabinets professionnels", count: 8 },
  { key: "tech", label: "Technologie, SaaS et startups", count: 10 },
  { key: "finance", label: "Finance, comptabilité et conseil", count: 6 },
  { key: "mode", label: "Mode, beauté et cosmétiques", count: 8 },
  { key: "association", label: "Associations, ONG et organisations communautaires", count: 6 },
  { key: "magazine", label: "Blogs, magazines et publications", count: 8 },
  { key: "evenement", label: "Événementiel, mariage et divertissement", count: 6 },
  { key: "industrie", label: "Industrie, construction et artisanat", count: 6 },
  { key: "auto", label: "Automobile et mobilité", count: 4 },
  { key: "agriculture", label: "Agriculture et alimentation", count: 4 },
  { key: "sport", label: "Sport, fitness et coaching", count: 4 },
  { key: "createur", label: "Sites personnels et créateurs de contenu", count: 4 },
  { key: "local", label: "Services locaux et petites entreprises", count: 6 },
]);
const CATEGORY_KEYS = new Set(CATEGORIES.map((c) => c.key));
const TARGET_TOTAL = CATEGORIES.reduce((n, c) => n + c.count, 0);
const KEY = /^[a-z][a-z0-9-]{1,39}$/;
const PAGE_KEY = /^[a-z][a-z0-9-]{1,29}$/;
const STYLES = new Set(["minimaliste", "editorial", "audacieux", "chaleureux", "sombre", "luxe", "ludique", "technique", "naturel", "classique", "moderne", "geometrique"]);
const VERSION = "1.0.0";
const AUTHOR = "Équipe Kolakisa";

let cache = null;
// Un fichier ou une fiche invalide n'empêche JAMAIS le reste de la bibliothèque de se charger : il est écarté et listé dans problems() (les tests exigent que la liste soit vide)
function specsOnDisk(problems) {
  const dir = path.join(__dirname, "specs");
  const list = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort()) {
    let arr;
    try { arr = require(path.join(dir, file)); } catch (e) { problems.push({ file, message: `fichier illisible : ${String(e.message).slice(0, 200)}` }); continue; }
    if (!Array.isArray(arr)) { problems.push({ file, message: "le fichier doit exporter un tableau de fiches" }); continue; }
    for (const spec of arr) list.push({ ...spec, file });
  }
  return list;
}

// Contrôle d'une fiche : toute erreur nomme le thème (jamais de thème à moitié valide dans le registre)
function check(spec) {
  const at = `Thème « ${spec.key || "?"} » (${spec.file})`;
  const bad = (m) => { throw new Error(`${at} : ${m}`); };
  if (!KEY.test(String(spec.key || ""))) bad("identifiant invalide");
  if (!spec.name || String(spec.name).length > 60) bad("nom manquant ou trop long");
  if (!CATEGORY_KEYS.has(spec.category)) bad(`catégorie inconnue (${spec.category})`);
  if (!spec.description || spec.description.length > 280) bad("description manquante ou trop longue (280 caractères au plus)");
  if (!Array.isArray(spec.tags) || !spec.tags.length || spec.tags.some((t) => !STYLES.has(t))) bad(`styles : au moins un parmi ${[...STYLES].join(", ")}`);
  if (!spec.siteType) bad("type de site manquant");
  if (!spec.tokens || !spec.tokens.colors || !spec.tokens.fonts) bad("jetons (couleurs et polices) manquants");
  if (!Array.isArray(spec.pages) || spec.pages.length < 3) bad("au moins trois pages");
  if (spec.pages[0].key !== "accueil") bad("la première page doit être « accueil »");
  const keys = new Set();
  for (const p of spec.pages) { if (!PAGE_KEY.test(String(p.key)) || keys.has(p.key)) bad(`page « ${p.key} » invalide ou en double`); keys.add(p.key); if (!p.name || !Array.isArray(p.blocks) || !p.blocks.length) bad(`page « ${p.key} » sans nom ou sans bloc`); }
  if (!Array.isArray(spec.menu) || !spec.menu.length) bad("menu manquant");
  for (const [label, url] of spec.menu) { if (!label) bad("entrée de menu sans libellé"); const slug = String(url).replace(/^\//, ""); if (url !== "/" && !keys.has(slug) && slug !== "recherche" && slug !== "introuvable") bad(`le menu pointe vers « ${url} » qui n'est pas une page du thème`); }
  // Toutes les variantes et tous les identifiants de police doivent exister (jamais de bloc inconnu au moment du rendu)
  const fontLib = require("../../../utils/fontLibrary");
  for (const role of ["heading", "body", "button", "link"]) { const f = spec.tokens.fonts[role]; if (f !== undefined && !(Object.hasOwn(tokensLib.FONTS, f) || fontLib.isId(f))) bad(`police « ${f} » inconnue (${role})`); }
  for (const p of spec.pages) for (const b of p.blocks) { const name = Array.isArray(b) ? b[0] : b; if (!Object.hasOwn(compose.BLOCKS, name)) bad(`variante inconnue « ${name} » (page ${p.key})`); }
  for (const part of [spec.head, spec.foot]) if (part && !Object.hasOwn(compose.BLOCKS, part[0])) bad(`variante inconnue « ${part[0]} »`);
  return spec;
}

// Pages communes à tous les thèmes (états de recherche et d'erreur, correctement conçus) : ajoutées si la fiche ne les définit pas
function withStandardPages(spec) {
  const have = new Set(spec.pages.map((p) => p.key));
  const extra = [];
  if (!have.has("recherche")) extra.push({ key: "recherche", name: "Recherche", blocks: [["misc:pagehead", { title: "Recherche", sub: "Retrouvez une page ou un article du site." }], ["misc:search", { title: "Que cherchez-vous ?" }], ["misc:empty", { title: "Aucun résultat pour le moment", sub: "Saisissez un mot-clé : les résultats apparaîtront ici. Sans résultat, essayez un terme plus général." }]] });
  if (!have.has("introuvable")) extra.push({ key: "introuvable", name: "Page introuvable", blocks: [["misc:notfound", {}]] });
  return { ...spec, pages: [...spec.pages, ...extra] };
}

function load() {
  if (cache) return cache;
  const problems = [];
  const specs = [], seen = new Set();
  for (const raw of specsOnDisk(problems)) {
    try {
      const s = withStandardPages(check(raw));
      if (seen.has(s.key)) throw new Error(`Thème « ${s.key} » (${raw.file}) : identifiant déjà déclaré dans un autre fichier`);
      seen.add(s.key); specs.push(s);
    } catch (e) { problems.push({ file: raw.file, key: raw.key, message: String(e.message) }); }
  }
  const byKey = new Map(specs.map((s) => [s.key, s]));
  const manifests = specs.map((s) => ({
    key: s.key, name: s.name, version: VERSION, author: AUTHOR, description: s.description,
    tokens: tokensLib.normalizeTokens(s.tokens, { strict: false }),
  }));
  cache = { specs, byKey, manifests, problems };
  return cache;
}
const reload = () => { cache = null; return load(); };

const specOf = (key) => load().byKey.get(String(key)) || null;
const manifests = () => load().manifests;
const has = (key) => load().byKey.has(String(key));

// Métadonnées d'affichage (sans les sections : légères, pour la galerie)
function meta(key) {
  const s = specOf(key);
  if (!s) return null;
  const cat = CATEGORIES.find((c) => c.key === s.category);
  return {
    key: s.key, name: s.name, category: s.category, categoryLabel: cat.label, tags: s.tags, siteType: s.siteType, description: s.description, featured: Boolean(s.featured), isNew: Boolean(s.isNew), order: s.order || 0,
    modules: s.modules || [], pages: s.pages.map((p) => ({ key: p.key, name: p.name })), palette: ["primary", "secondary", "accent", "background"].map((k) => (s.tokens.colors || {})[k]).filter(Boolean),
    fonts: { heading: s.tokens.fonts.heading, body: s.tokens.fonts.body }, dark: art.lum((s.tokens.colors || {}).background || "#ffffff") < 0.35,
    previews: { home: `/img/theme-previews/${s.key}-home.webp`, inner: `/img/theme-previews/${s.key}-inner.webp`, mobile: `/img/theme-previews/${s.key}-mobile.webp` },
  };
}
const allMeta = () => load().specs.map((s) => meta(s.key));

// Sections d'une page de démonstration (en-tête et pied de page du thème inclus)
function pageSections(key, pageKey) {
  const s = specOf(key);
  if (!s) return null;
  const page = s.pages.find((p) => p.key === pageKey);
  if (!page) return null;
  const c = compose.makeContext({ ...s, menu: s.menu });
  const head = s.head || ["head:bar", {}], foot = s.foot || ["foot:simple", {}];
  return compose.buildPage(c, [head, ...page.blocks, foot]);
}
const demoPageTokens = (key) => { const m = load().manifests.find((x) => x.key === key); return m ? m.tokens : null; };

// Visuel d'un emplacement (SVG) pour le thème, depuis ses jetons et sa graine
function artFor(key, slot) {
  const s = specOf(key);
  if (!s) return null;
  const tokens = tokensLib.normalizeTokens(s.tokens, { strict: false });
  return art.render(slot, tokens, { seed: (s.art && s.art.seed) || s.key, motifs: (s.art && s.art.motifs) || ["dunes"] });
}

// Indice de ressemblance entre deux thèmes (0 = identiques, 1 = très différents) : variantes de mise en page, polices, teinte principale, dispositions ; sert au contrôle de diversité
function signature(spec) {
  const variants = spec.pages.flatMap((p) => p.blocks.map((b) => (Array.isArray(b) ? b[0] : b)));
  return { variants: [...new Set([...(spec.head ? [spec.head[0]] : ["head:bar"]), ...(spec.foot ? [spec.foot[0]] : ["foot:simple"]), ...variants])], heading: spec.tokens.fonts.heading, body: spec.tokens.fonts.body, primary: spec.tokens.colors.primary, home: (spec.pages[0].blocks || []).map((b) => (Array.isArray(b) ? b[0] : b)).join(">"), dna: JSON.stringify(spec.dna || {}) };
}

const problems = () => load().problems;
module.exports = { problems, CATEGORIES, TARGET_TOTAL, STYLES, load, reload, specOf, has, manifests, meta, allMeta, pageSections, demoPageTokens, artFor, signature, VERSION, AUTHOR };
