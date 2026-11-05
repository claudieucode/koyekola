// Bibliothèque de thèmes de Kolakisa — v2 : chaque thème est un PAQUET AUTONOME (themes/packs/<clé>/ : fiche, CSS confiné, animations, pages de démonstration).
// Ce registre expose les paquets à la galerie, au catalogue et à l'aperçu avec la même interface qu'avant (meta, manifests, pageSections…), sans aucun moteur de composition commun :
// les pages d'un thème sont écrites par le thème (kit.js → blocs « HTML sécurisé » et formulaires du Page Builder). L'ancienne bibliothèque de 360 thèmes est archivée dans
// themes/_ancienne-bibliotheque (non chargée) ; les sites qui en avaient activé un conservent leur apparence (leurs jetons sont enregistrés dans leur propre configuration).
const tokensLib = require("../../pages/tokens");
const packs = require("../packs");

// Domaines d'application (catégories de la galerie). « anciens » regroupe les thèmes précédents encore installés sur un site.
const CATEGORIES = Object.freeze([
  { key: "sport", label: "Sport, fitness et compétition" },
  { key: "gastronomie", label: "Restaurants et gastronomie" },
  { key: "science", label: "Science, recherche et données" },
  { key: "tech", label: "Technologie et SaaS" },
  { key: "architecture", label: "Architecture et design d'espace" },
  { key: "mode", label: "Mode, luxe et beauté" },
  { key: "education", label: "Éducation et formation" },
  { key: "sante", label: "Santé et bien-être" },
  { key: "immobilier", label: "Immobilier" },
  { key: "agence", label: "Agences créatives et portfolios" },
  { key: "divertissement", label: "Musique, jeux et médias audio" },
  { key: "voyage", label: "Voyage et hôtellerie" },
  { key: "beaute", label: "Beauté et bien-être" },
  { key: "services", label: "Entreprises et services" },
  { key: "association", label: "Associations et communautés" },
  { key: "evenement", label: "Mariage et événements" },
  { key: "edition", label: "Presse, édition et culture" },
  { key: "auto", label: "Automobile et mobilité" },
  { key: "nature", label: "Nature, agriculture et énergie" },
  { key: "anciens", label: "Thèmes précédents (conservés)" },
]);
const CATEGORY_KEYS = new Set(CATEGORIES.map((c) => c.key));
const STYLES = new Set(["minimaliste", "editorial", "audacieux", "chaleureux", "sombre", "luxe", "ludique", "technique", "naturel", "classique", "moderne", "geometrique", "experimental"]);
const PAGE_KEY = /^[a-z][a-z0-9-]{1,29}$/;
const VERSION = "2.0.0";
const AUTHOR = "Équipe Kolakisa";

let cache = null;
function check(spec) {
  const at = `Thème « ${spec.key || "?"} »`;
  const bad = (m) => { throw new Error(`${at} : ${m}`); };
  if (!spec.name || String(spec.name).length > 60) bad("nom manquant ou trop long");
  if (!CATEGORY_KEYS.has(spec.category) || spec.category === "anciens") bad(`catégorie inconnue (${spec.category})`);
  if (!spec.description || spec.description.length > 280) bad("description manquante ou trop longue (280 caractères au plus)");
  if (!Array.isArray(spec.tags) || !spec.tags.length || spec.tags.some((t) => !STYLES.has(t))) bad(`styles : au moins un parmi ${[...STYLES].join(", ")}`);
  if (!spec.siteType || !spec.concept) bad("type de site ou concept créatif manquant");
  if (!spec.tokens || !spec.tokens.colors || !spec.tokens.fonts) bad("jetons (couleurs et polices) manquants");
  if (!spec.dna || !spec.dna.header || !spec.dna.hero || !spec.dna.grid || !spec.dna.motion || !spec.dna.shapes || !spec.dna.rhythm || !spec.dna.signature) bad("empreinte de structure à 8 axes (dna.header, hero, grid, motion, shapes, rhythm, signature + paire typographique) incomplète");
  if (!Array.isArray(spec.pages) || spec.pages.length < 4) bad("au moins quatre pages");
  if (spec.pages[0].key !== "accueil") bad("la première page doit être « accueil »");
  const keys = new Set();
  for (const p of spec.pages) { if (!PAGE_KEY.test(String(p.key)) || keys.has(p.key)) bad(`page « ${p.key} » invalide ou en double`); keys.add(p.key); if (!p.name || typeof p.render !== "function") bad(`page « ${p.key} » sans nom ou sans fonction de rendu`); }
  for (const need of ["contact", "recherche", "introuvable"]) if (!keys.has(need)) bad(`page « ${need} » manquante`);
  if (!Array.isArray(spec.menu) || !spec.menu.length) bad("menu manquant");
  for (const [label, url] of spec.menu) { if (!label) bad("entrée de menu sans libellé"); const slug = String(url).replace(/^\//, ""); if (url !== "/" && !keys.has(slug)) bad(`le menu pointe vers « ${url} » qui n'est pas une page du thème`); }
  const fontLib = require("../../../utils/fontLibrary");
  for (const role of ["heading", "body", "button", "link"]) { const f = spec.tokens.fonts[role]; if (f !== undefined && !(Object.hasOwn(tokensLib.FONTS, f) || fontLib.isId(f))) bad(`police « ${f} » inconnue (${role})`); }
  for (const o of spec.options || []) { if (!/^[a-z][a-z0-9-]{0,24}$/.test(o.key) || !o.label || !["color", "choice", "range"].includes(o.type)) bad(`option « ${o.key} » invalide`); }
  return spec;
}

function load() {
  if (cache) return cache;
  const problems = packs.problems().map((p) => ({ file: p.key, key: p.key, message: p.message }));
  const specs = [];
  for (const raw of packs.all()) {
    try { specs.push(check(raw)); } catch (e) { problems.push({ file: raw.key, key: raw.key, message: String(e.message) }); }
  }
  const byKey = new Map(specs.map((s) => [s.key, s]));
  const manifests = specs.map((s) => ({
    key: s.key, name: s.name, version: s.version || VERSION, author: AUTHOR, description: s.description,
    tokens: tokensLib.normalizeTokens({ ...s.tokens, pack: { key: s.key, options: {} } }, { strict: false }),
  }));
  cache = { specs, byKey, manifests, problems };
  return cache;
}
const reload = () => { packs.reload(); cache = null; return load(); };

const specOf = (key) => load().byKey.get(String(key)) || null;
const manifests = () => load().manifests;
const has = (key) => load().byKey.has(String(key));

const lum = (hex) => { const v = [1, 3, 5].map((i) => parseInt(String(hex).slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };

function meta(key) {
  const s = specOf(key);
  if (!s) return null;
  const cat = CATEGORIES.find((c) => c.key === s.category);
  const bg = (s.tokens.colors || {}).background || "#ffffff";
  return {
    key: s.key, name: s.name, category: s.category, categoryLabel: cat.label, tags: s.tags, siteType: s.siteType, description: s.description, concept: s.concept, featured: Boolean(s.featured), isNew: true, order: s.order || 0,
    modules: s.modules || [], pages: s.pages.map((p) => ({ key: p.key, name: p.name })), palette: ["primary", "secondary", "accent", "background"].map((k) => (s.tokens.colors || {})[k]).filter(Boolean),
    fonts: { heading: s.tokens.fonts.heading, body: s.tokens.fonts.body }, dark: lum(bg) < 0.35, pack: true, dna: s.dna, options: s.options || [],
    previews: { home: `/img/theme-previews/${s.key}-home.webp`, inner: `/img/theme-previews/${s.key}-inner.webp`, mobile: `/img/theme-previews/${s.key}-mobile.webp`, card: `/img/theme-previews/${s.key}-card.webp`, card2: `/img/theme-previews/${s.key}-card2.webp`, phone: `/img/theme-previews/${s.key}-phone.webp` },
  };
}
const allMeta = () => load().specs.map((s) => meta(s.key));

// Sections d'une page de démonstration : produites par le thème lui-même
function pageSections(key, pageKey) {
  const s = specOf(key);
  if (!s) return null;
  const page = s.pages.find((p) => p.key === pageKey);
  if (!page) return null;
  return page.render({ key: s.key, name: s.name, brand: s.brand || s.name, menu: s.menu.map(([label, url]) => ({ label, url })), cta: s.cta || null, contact: s.contact || {}, options: packs.resolveOptions(s, {}) });
}
const demoPageTokens = (key) => { const m = load().manifests.find((x) => x.key === key); return m ? m.tokens : null; };
// Plus de générateur de visuels commun : chaque thème dessine ses propres illustrations (SVG en ligne dans ses sections ou fichiers de son dossier)
const artFor = () => null;

// Empreinte de structure d'un thème (pour le contrôle de diversité) : composition d'en-tête, de hero, de grille et de mouvement + polices + teinte
function signature(spec) {
  return { ...spec.dna, heading: spec.tokens.fonts.heading, body: spec.tokens.fonts.body, primary: spec.tokens.colors.primary, background: spec.tokens.colors.background };
}

const problems = () => load().problems;
module.exports = { problems, CATEGORIES, STYLES, load, reload, specOf, has, manifests, meta, allMeta, pageSections, demoPageTokens, artFor, signature, VERSION, AUTHOR, TARGET_TOTAL: 0 };
