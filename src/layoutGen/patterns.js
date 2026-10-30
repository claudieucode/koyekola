// Layout Pattern Registry (programme 22.3) : 7 familles de compositions professionnelles. Un pattern = (constructeur, paramètres, contraintes) ; aucune entrée ne crée de widget.
// Les constructeurs (builders.js) n'emploient que des nœuds du Page Builder natif ; le registre ne dit « disponible » que ce que le moteur de rendu sait produire (vérifié par les tests, qui
// font passer CHAQUE pattern par le normaliseur natif). Un contenu qui ne satisfait pas les contraintes écarte le pattern (jamais de remplissage artificiel).
const { HERO, SEC } = require("./builders");

const FAMILIES = Object.freeze({
  editorial: "Éditorial", corporate: "Corporate", creative: "Créatif", commercial: "Commercial", immersive: "Immersif", minimalist: "Minimaliste", ecommerce: "E-commerce",
});
// Contraintes réutilisables : renvoient null si le contenu convient, sinon la raison
const needImage = (c) => (c.image && c.image.src ? null : "demande une image principale");
const needItems = (n) => (c) => ((c.items || []).length >= n ? null : `demande au moins ${n} éléments`);
const needImages = (n) => (c) => ((c.images || []).length >= n ? null : `demande au moins ${n} images`);
const needTitle = (c) => (c.title ? null : "demande un titre");
const needText = (c) => (c.text && c.text.length > 120 ? null : "demande un texte d'au moins 120 caractères");
const needPriced = (c) => ((c.items || []).filter((i) => i.title && i.price).length >= 2 ? null : "demande au moins 2 formules avec nom et prix réels");
const needNumbers = (c) => ((c.items || []).filter((i) => Number.isFinite(i.value)).length >= 2 ? null : "demande au moins 2 chiffres réels avec leur source");
const needQuotes = (c) => ((c.items || []).filter((i) => i.text && (i.author || i.title)).length >= 1 ? null : "demande des témoignages réels (texte et auteur)");
const needFaq = (c) => ((c.items || []).filter((i) => i.q && i.a).length >= 1 ? null : "demande des questions avec leur réponse");
const needTable = (c) => (Array.isArray(c.table) && c.table.length >= 2 ? null : "demande un tableau fourni (lignes de comparaison réelles)");
const needItemImages = (c) => ((c.items || []).filter((i) => i.image && i.image.src).length >= Math.max(2, (c.items || []).length) ? null : "demande une image pour chaque élément");
const all = (...fs) => (c) => { for (const f of fs) { const r = f(c); if (r) return r; } return null; };

const defs = [];
// P(id, famille, libellé, rôles, [groupe, constructeur], paramètres, { needs, ideal:[min,max], tags:{ tones:[], sectors:[] }, mode:'grid'|'flex'|'stack', summary })
const P = (id, family, label, roles, [group, fn], params, o = {}) => defs.push({ id, family, label, roles: [].concat(roles), group, fn, params, needs: o.needs || (() => null), ideal: o.ideal || null, tags: o.tags || {}, mode: o.mode || "grid", summary: o.summary || "" });

// ── A. ÉDITORIAL ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
P("editorial-split", "editorial", "Editorial Split", "hero", ["HERO", "split"], { ratio: "5:7", imageSide: "left", rounded: false, bg: "default" }, { needs: all(needTitle, needImage), tags: { tones: ["editorial", "luxe", "sobre"] }, summary: "Image large à gauche, texte à droite (5/7)." });
P("magazine", "editorial", "Magazine Layout", "hero", ["HERO", "editorial"], { huge: false }, { needs: needTitle, tags: { tones: ["editorial", "luxe"] }, summary: "Titre large, texte étroit, bandeau panoramique." });
P("asymmetric-editorial", "editorial", "Asymmetric Editorial", "hero", ["HERO", "asym"], {}, { needs: all(needTitle, needImage), tags: { tones: ["editorial", "creatif"] }, summary: "Grande image haute 5/12, texte 6/12 sur grille de 12 colonnes." });
P("large-type-editorial", "editorial", "Large Typography Editorial", "hero", ["HERO", "editorial"], { huge: true }, { needs: needTitle, tags: { tones: ["editorial", "luxe"] }, summary: "Titre en très grande taille, empattements." });
P("image-led-editorial", "editorial", "Image-led Editorial", "hero", ["HERO", "split"], { ratio: "13:7", imageSide: "right", rounded: true }, { needs: all(needTitle, needImage), tags: { tones: ["editorial", "dynamique"] }, summary: "Image dominante (65 %), texte 35 %." });
P("multi-column-editorial", "editorial", "Multi-column Editorial", ["text", "intro"], ["SEC", "article"], { columns: 2 }, { needs: all(needTitle, needText), tags: { tones: ["editorial"] }, summary: "Texte long en deux colonnes de lecture avec lettrine." });
P("long-form-article", "editorial", "Long-form Article Layout", ["text", "intro"], ["SEC", "article"], { columns: 1 }, { needs: all(needTitle, needText), mode: "stack", tags: { tones: ["editorial", "sobre"] }, summary: "Colonne de lecture unique." });

// ── B. CORPORATE ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
P("corporate-split", "corporate", "Corporate Split", "hero", ["HERO", "corporate"], {}, { needs: all(needTitle, needImage), tags: { tones: ["corporate", "sobre"], sectors: ["finance", "droit", "conseil", "sante"] }, summary: "Texte + points clés à gauche, image à droite." });
P("executive-overview", "corporate", "Executive Overview", "stats", ["SEC", "stats"], { bg: "primary" }, { needs: needNumbers, ideal: [3, 4], tags: { tones: ["corporate"] }, summary: "Chiffres clés en bande." });
P("structured-corporate-grid", "corporate", "Structured Corporate Grid", ["services", "benefits"], ["SEC", "cards"], { bg: "surface" }, { needs: needItems(2), ideal: [3, 6], tags: { tones: ["corporate", "sobre"] }, summary: "Cartes régulières 2 à 4 colonnes." });
P("company-profile", "corporate", "Company Profile Layout", ["intro", "benefits"], ["SEC", "split"], { ratio: "1:1", side: "left" }, { needs: needTitle, ideal: [0, 6], tags: { tones: ["corporate"] }, summary: "Présentation à gauche, points à droite." });
P("corporate-storytelling", "corporate", "Corporate Storytelling", ["intro"], ["SEC", "split"], { ratio: "1:2", side: "right", numbered: true }, { needs: all(needTitle, needItems(2)), tags: { tones: ["corporate", "editorial"] }, summary: "Jalons numérotés à gauche, récit à droite." });
P("corporate-services", "corporate", "Corporate Services Layout", "services", ["SEC", "list"], { ratio: "1:2", numbered: true }, { needs: needItems(2), ideal: [3, 6], tags: { tones: ["corporate", "editorial"] }, summary: "Liste éditoriale : titre / description, filets." });

// ── C. CRÉATIF ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
P("creative-asymmetric-grid", "creative", "Creative Asymmetric Grid", ["services", "benefits"], ["SEC", "asymCards"], {}, { needs: needItems(3), ideal: [4, 5], tags: { tones: ["creatif", "dynamique"] }, summary: "Une carte héroïne sur 2×2, les autres autour." });
P("portfolio-mosaic", "creative", "Portfolio Mosaic", ["gallery", "portfolio"], ["SEC", "mosaic"], {}, { needs: needImages(4), ideal: [5, 8], tags: { tones: ["creatif", "dynamique"], sectors: ["architecture", "design", "photo", "agence"] }, summary: "Mosaïque 4 colonnes (tuiles 2×2, 1×2, 2×1)." });
P("experimental-grid", "creative", "Experimental Grid", ["services", "portfolio"], ["SEC", "tiles"], { lead: true }, { needs: all(needItems(3), needItemImages), ideal: [3, 6], tags: { tones: ["creatif"] }, summary: "Tuiles image avec une tuile dominante." });
P("overlapping-composition", "creative", "Overlapping Composition", "hero", ["HERO", "layered"], {}, { needs: all(needTitle, needImage), tags: { tones: ["creatif", "luxe"] }, summary: "Carte de texte superposée à l'image (placement de grille)." });
P("layered-visual", "creative", "Layered Visual Composition", "hero", ["HERO", "asym"], { mirror: true }, { needs: all(needTitle, needImage, needImages(2)), tags: { tones: ["creatif"] }, summary: "Grande image + vignette secondaire décalée." });
P("fullscreen-creative", "creative", "Fullscreen Creative Layout", "hero", ["HERO", "full"], { height: "100vh", align: "left" }, { needs: all(needTitle, needImage), tags: { tones: ["creatif", "dynamique"] }, summary: "Image plein écran, contenu à gauche." });

// ── D. COMMERCIAL ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
P("product-focused", "commercial", "Product-focused Layout", "hero", ["HERO", "product"], {}, { needs: all(needTitle, needImage), tags: { tones: ["dynamique", "sobre"] }, summary: "Visuel produit à gauche, argumentaire et boutons à droite." });
P("conversion-focused", "commercial", "Conversion-focused Layout", "cta", ["SEC", "cta"], { split: true }, { needs: needTitle, tags: { tones: ["dynamique", "corporate"] }, summary: "Message à gauche, bouton à droite, fond primaire." });
P("cta-centered", "commercial", "Centered Call to Action", "cta", ["SEC", "cta"], { split: false }, { needs: needTitle, mode: "stack", summary: "Appel à l'action centré." });
P("promotional-grid", "commercial", "Promotional Grid", ["services", "benefits"], ["SEC", "cards"], { numbered: false, bg: "default" }, { needs: needItems(2), ideal: [3, 4], tags: { tones: ["dynamique"] }, summary: "Cartes avec prix éventuel." });
P("pricing-comparison", "commercial", "Pricing Comparison Layout", "pricing", ["SEC", "pricing"], { highlightMiddle: true }, { needs: needPriced, ideal: [2, 4], summary: "Formules côte à côte, formule centrale mise en avant." });
P("service-showcase", "commercial", "Service Showcase", "services", ["SEC", "cards"], { showcase: true, bg: "default" }, { needs: all(needItems(2), needItemImages), ideal: [3, 4], tags: { tones: ["dynamique", "luxe"] }, summary: "Cartes illustrées (une image par service)." });
P("feature-comparison", "commercial", "Feature Comparison", "compare", ["SEC", "compare"], {}, { needs: needTable, mode: "stack", summary: "Tableau comparatif natif." });

// ── E. IMMERSIF ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
P("fullscreen-hero", "immersive", "Fullscreen Hero", "hero", ["HERO", "full"], { height: "100vh", align: "center" }, { needs: all(needTitle, needImage), tags: { tones: ["luxe", "dynamique", "immersif"], sectors: ["restaurant", "voyage", "hotel", "evenement"] }, summary: "Image plein écran, voile, contenu centré." });
P("full-bleed-image", "immersive", "Full-bleed Image Layout", "hero", ["HERO", "full"], { height: "80vh", align: "left" }, { needs: all(needTitle, needImage), tags: { tones: ["immersif", "luxe"] }, summary: "Image pleine largeur à 80 % de la hauteur d'écran." });
P("immersive-storytelling", "immersive", "Immersive Storytelling", ["steps", "intro"], ["SEC", "steps"], { vertical: true }, { needs: needItems(2), ideal: [3, 5], mode: "stack", tags: { tones: ["immersif", "editorial"] }, summary: "Chapitres numérotés empilés." });
P("layered-hero", "immersive", "Layered Hero", "hero", ["HERO", "layered"], { mirror: true }, { needs: all(needTitle, needImage), tags: { tones: ["immersif", "luxe"] }, summary: "Texte en carte superposée sur l'image." });
P("visual-narrative", "immersive", "Visual Narrative Layout", ["intro", "benefits"], ["SEC", "split"], { ratio: "1:1", side: "right", numbered: true }, { needs: all(needTitle, needImage), tags: { tones: ["immersif"] }, summary: "Visuel + récit numéroté." });

// ── F. MINIMALISTE ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
P("minimal-grid", "minimalist", "Minimal Grid", ["services", "benefits"], ["SEC", "cards"], { flat: true, bg: "default", rhythm: "airy" }, { needs: needItems(2), ideal: [2, 4], tags: { tones: ["minimal", "sobre"] }, summary: "Cartes sans fond ni ombre, grand espace." });
P("open-space", "minimalist", "Open Space Layout", "hero", ["HERO", "minimal"], {}, { needs: needTitle, mode: "stack", tags: { tones: ["minimal", "sobre"] }, summary: "Titre centré, texte étroit, beaucoup d'air." });
P("typography-led", "minimalist", "Typography-led Layout", "hero", ["HERO", "type"], { rule: true }, { needs: needTitle, mode: "stack", tags: { tones: ["minimal", "editorial"] }, summary: "Typographie seule, filet d'accent." });
P("minimal-split", "minimalist", "Minimal Split", ["intro", "benefits"], ["SEC", "split"], { ratio: "1:2", side: "right", rhythm: "airy" }, { needs: needTitle, tags: { tones: ["minimal"] }, summary: "Titre à gauche, points à droite, espace." });
P("focused-content", "minimalist", "Focused Content Layout", ["text", "intro"], ["SEC", "article"], { columns: 1 }, { needs: all(needTitle, needText), mode: "stack", tags: { tones: ["minimal", "sobre"] }, summary: "Une seule colonne de lecture." });

// ── G. E-COMMERCE ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
P("product-gallery", "ecommerce", "Product Gallery Layout", ["gallery", "products"], ["SEC", "gallery"], { cols: 3, ratio: "4:3" }, { needs: needImages(2), ideal: [3, 12], summary: "Galerie native carrée avec agrandissement." });
P("product-detail", "ecommerce", "Product Detail Layout", "detail", ["SEC", "detail"], {}, { needs: all(needTitle, needImages(1)), summary: "Galerie 7/12, informations 5/12." });
P("category-showcase", "ecommerce", "Category Showcase", ["categories", "services"], ["SEC", "tiles"], { lead: false }, { needs: all(needItems(2), needItemImages), ideal: [3, 6], summary: "Tuiles de catégories avec titre en surimpression." });
P("collection-grid", "ecommerce", "Collection Grid", ["products", "services"], ["SEC", "products"], {}, { needs: needItems(2), ideal: [3, 8], summary: "Grille de produits : image, nom, prix, bouton." });
P("editorial-commerce", "ecommerce", "Editorial Commerce Layout", ["categories", "products"], ["SEC", "tiles"], { lead: true }, { needs: all(needItems(3), needItemImages), ideal: [3, 5], tags: { tones: ["editorial", "luxe"] }, summary: "Tuile dominante + tuiles secondaires." });
P("promotional-commerce", "ecommerce", "Promotional Commerce Layout", "cta", ["SEC", "cta"], { split: true }, { needs: needTitle, tags: { tones: ["dynamique"] }, summary: "Bandeau promotionnel." });

// ── Rôles transverses sans variantes dédiées (autres constructeurs) ───────────────────────────────────────────────────────────────
P("numbered-services", "corporate", "Numbered Services", "services", ["SEC", "steps"], { vertical: false }, { needs: needItems(2), ideal: [3, 4], tags: { tones: ["corporate", "editorial"] }, summary: "Services numérotés en colonnes, filet d'accent." });
P("steps-columns", "corporate", "Process Columns", "steps", ["SEC", "steps"], { vertical: false }, { needs: needItems(2), ideal: [3, 4], summary: "Étapes en colonnes numérotées." });
P("steps-vertical", "minimalist", "Process Vertical", "steps", ["SEC", "steps"], { vertical: true }, { needs: needItems(2), mode: "stack", summary: "Étapes empilées." });
P("faq-stacked", "corporate", "FAQ Stacked", "faq", ["SEC", "faq"], { split: false }, { needs: needFaq, mode: "stack", summary: "Accordéon centré." });
P("faq-split", "editorial", "FAQ Split", "faq", ["SEC", "faq"], { split: true }, { needs: needFaq, summary: "Titre collant à gauche, accordéon à droite." });
P("testimonials-grid", "corporate", "Testimonials Grid", "testimonials", ["SEC", "testimonials"], {}, { needs: needQuotes, ideal: [2, 3], summary: "Témoignages en colonnes égales." });
P("testimonials-featured", "editorial", "Testimonials Featured", "testimonials", ["SEC", "testimonials"], { featured: true }, { needs: all(needQuotes, needItems(2)), ideal: [2, 4], tags: { tones: ["luxe", "editorial"] }, summary: "Un grand témoignage + les suivants." });
P("team-grid", "corporate", "Team Grid", "team", ["SEC", "team"], { round: false }, { needs: needItems(2), ideal: [2, 8], summary: "Portraits carrés." });
P("team-round", "minimalist", "Team Round", "team", ["SEC", "team"], { round: true }, { needs: needItems(2), ideal: [2, 8], tags: { tones: ["minimal", "dynamique"] }, summary: "Portraits ronds centrés." });
P("gallery-grid", "editorial", "Gallery Grid", "gallery", ["SEC", "gallery"], { cols: 3, ratio: "3:2" }, { needs: needImages(2), summary: "Galerie régulière (ratio 3:2)." });
P("gallery-masonry", "editorial", "Gallery Masonry", "gallery", ["SEC", "gallery"], { masonry: true, cols: 3 }, { needs: needImages(3), tags: { tones: ["editorial", "creatif"] }, summary: "Maçonnerie à hauteurs naturelles (galerie éditoriale)." });
P("logos-row", "corporate", "Partner Logos", "logos", ["SEC", "logos"], {}, { needs: needImages(2), mode: "flex", summary: "Bande de logos." });
P("contact-split", "corporate", "Contact Split", "contact", ["SEC", "contact"], {}, { needs: needTitle, summary: "Coordonnées à gauche, visuel et bouton à droite." });

const REG = Object.freeze(defs.map((d) => Object.freeze(d)));
const byId = new Map(REG.map((d) => [d.id, d]));
if (byId.size !== REG.length) throw new Error("layoutGen/patterns : identifiants en double");
const BUILDERS = { HERO, SEC };
const get = (id) => byId.get(id) || null;
const list = ({ family, role } = {}) => REG.filter((d) => (!family || d.family === family) && (!role || d.roles.includes(role)));
const roles = () => [...new Set(REG.flatMap((d) => d.roles))];
// Construit un pattern : renvoie les nœuds natifs (la racine est un conteneur « bande »). Une contrainte non satisfaite lève une erreur AVANT la construction.
function build(def, x, c, pf, over = {}) {
  const why = def.needs(c);
  if (why) { const e = new Error(`Le layout « ${def.label} » ${why}.`); e.code = "needs"; throw e; }
  return BUILDERS[def.group][def.fn](x, c, { ...def.params, ...over }, pf);
}
module.exports = { FAMILIES, REG, get, list, roles, BUILDERS, build };
