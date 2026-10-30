// Layout Intent Analyzer + Content-to-Layout Mapper (programme 22.3). Analyse par RÈGLES (déterministe, aucune IA, aucun coût) : type de page, secteur, direction artistique, contenus.
// Le mapper mesure le contenu (longueur du titre, du texte, nombre d'éléments, orientation des images) et en déduit des paramètres de composition ; il ne modifie JAMAIS le contenu.
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Type de page → familles privilégiées (poids 0–3) et densité
const PAGE = {
  portfolio: { f: { creative: 3, immersive: 2, editorial: 1 }, density: "airy", goal: "montrer" },
  realisations: { f: { creative: 3, immersive: 2, editorial: 1 }, density: "airy", goal: "montrer" },
  galerie: { f: { creative: 2, editorial: 2, immersive: 1 }, density: "airy", goal: "montrer" },
  services: { f: { corporate: 3, commercial: 2, minimalist: 1 }, density: "normal", goal: "expliquer" },
  accueil: { f: { corporate: 2, immersive: 1, commercial: 1, editorial: 1 }, density: "normal", goal: "présenter" },
  apropos: { f: { corporate: 3, editorial: 2 }, density: "normal", goal: "raconter" },
  equipe: { f: { corporate: 3, minimalist: 1 }, density: "normal", goal: "rassurer" },
  tarifs: { f: { commercial: 3, corporate: 1 }, density: "normal", goal: "convertir" },
  contact: { f: { corporate: 2, minimalist: 2 }, density: "compact", goal: "contacter" },
  blog: { f: { editorial: 3, minimalist: 2 }, density: "airy", goal: "informer" },
  boutique: { f: { ecommerce: 3, commercial: 2 }, density: "normal", goal: "acheter" },
  catalogue: { f: { ecommerce: 3, commercial: 1 }, density: "normal", goal: "acheter" },
  "fiche-produit": { f: { ecommerce: 3, commercial: 2 }, density: "normal", goal: "acheter" },
  formation: { f: { commercial: 2, corporate: 2 }, density: "normal", goal: "convertir" },
  faq: { f: { corporate: 2, minimalist: 2 }, density: "compact", goal: "informer" },
};
// Mots de la direction artistique ou de la description → ton
const TONES = [
  ["luxe", /luxe|premium|haut de gamme|elegan|raffin/], ["minimal", /minimal|epur|sobre|simple|clair/], ["creatif", /creati|artist|original|audac|expériment|experiment|design/], ["dynamique", /dynamiq|energ|jeune|moderne|vibrant|sport/],
  ["corporate", /corporat|entreprise|institution|professionnel|serieux|conseil/], ["editorial", /editorial|magazine|journal|revue|lecture/], ["immersif", /immersi|plein ecran|cinema|voyage|experience/],
];
const SECTORS = [
  ["finance", /financ|banque|assurance|comptab/], ["droit", /avocat|juridi|notaire|droit/], ["conseil", /conseil|consult|cabinet/], ["sante", /sant|medic|clinique|therap|dentiste/], ["architecture", /architect|immobilier|amenagement/],
  ["design", /design|graphi|deco/], ["photo", /photo|video|film|studio/], ["agence", /agence|marketing|communication/], ["restaurant", /restaur|cuisine|traiteur|cafe|boulangerie/], ["voyage", /voyage|tourisme|safari|hotel|hebergement/],
  ["evenement", /evenement|mariage|festival|concert/], ["mode", /mode|vetement|bijou|cosmetiq|beaute/], ["education", /formation|ecole|cours|universite/], ["tech", /logiciel|saas|application|numerique|tech/],
];
const TONE_FAMILY = { luxe: { editorial: 2, immersive: 2, creative: 1 }, minimal: { minimalist: 3 }, creatif: { creative: 3 }, dynamique: { commercial: 2, creative: 1 }, corporate: { corporate: 3 }, editorial: { editorial: 3 }, immersif: { immersive: 3 } };
const SECTOR_TONE = { finance: "corporate", droit: "corporate", conseil: "corporate", sante: "corporate", architecture: "creatif", design: "creatif", photo: "creatif", agence: "creatif", restaurant: "immersif", voyage: "immersif", evenement: "dynamique", mode: "luxe", education: "corporate", tech: "dynamique" };

function find(table, text) { const t = norm(text); return table.filter(([, re]) => re.test(t)).map(([k]) => k); }

// Intention de mise en page d'une page : { pageType, goal, tones, sectors, familyWeights, density, reasons }
function analyze(page = {}, site = {}) {
  const type = norm(page.type) || "autre";
  const base = PAGE[type] || { f: { corporate: 1, editorial: 1 }, density: "normal", goal: "présenter" };
  const text = [page.goal, site.description, site.direction, site.sector, page.name].filter(Boolean).join(" ");
  const sectors = find(SECTORS, text);
  const tones = [...new Set([...find(TONES, `${site.direction || ""} ${site.tone || ""} ${page.tone || ""}`), ...find(TONES, text), ...sectors.map((s) => SECTOR_TONE[s]).filter(Boolean)])];
  const weights = { ...base.f };
  const reasons = [`Type de page « ${type} » : familles ${Object.keys(base.f).join(", ")}.`];
  for (const t of tones) for (const [f, w] of Object.entries(TONE_FAMILY[t] || {})) { weights[f] = (weights[f] || 0) + w; }
  if (tones.length) reasons.push(`Direction détectée : ${tones.join(", ")}.`);
  if (sectors.length) reasons.push(`Secteur détecté : ${sectors.join(", ")}.`);
  const density = tones.includes("minimal") || tones.includes("luxe") ? "airy" : tones.includes("dynamique") && base.density !== "airy" ? "compact" : base.density;
  return { pageType: type, goal: base.goal, tones, sectors, familyWeights: weights, density, reasons };
}

// ── Content-to-Layout Mapper ───────────────────────────────────────────────────────────────────────────────────────────────────
const cls = (n, a, b) => (n <= a ? "short" : n <= b ? "medium" : "long");
function orient(im) { if (!im) return "none"; const w = Number(im.w || im.width), h = Number(im.h || im.height); if (w > 0 && h > 0) return w / h > 1.15 ? "landscape" : w / h < 0.87 ? "portrait" : "square"; return "unknown"; }
// Profil mesurable d'un contenu de section. Aucune valeur n'est inventée : « unknown » reste « unknown ».
function profile(c) {
  const title = (c.title || "").length, text = (c.text || "").length, items = (c.items || []).length;
  const itemChars = (c.items || []).map((i) => (i.title || "").length + (i.text || "").length + (i.a || "").length);
  const avg = items ? itemChars.reduce((a, b) => a + b, 0) / items : 0;
  const titleClass = cls(title, 24, 60);
  // Titre court → composition expressive (grande taille) ; long → taille réduite et largeur plus grande (jamais de troncature)
  const heroSize = titleClass === "short" ? "display" : titleClass === "medium" ? "xl" : title > 110 ? "md" : "lg";
  const cols = items <= 2 ? Math.max(items, 1) : items === 4 ? 2 : items <= 6 ? 3 : 4;
  return { title, titleClass, text, textClass: cls(text, 140, 600), items, avgItem: Math.round(avg), maxItem: Math.max(0, ...itemChars), imgs: (c.images || []).length + (c.image ? 1 : 0), orient: orient(c.image), heroSize, cols: Math.min(Math.max(cols, 1), 4), chars: title + text + itemChars.reduce((a, b) => a + b, 0) };
}
// Paramètres de composition déduits du profil (appliqués par-dessus les paramètres du pattern)
function adapt(def, pf, c) {
  const over = {};
  if (def.group === "HERO" && c.image && c.image.orient === "portrait" && def.fn === "split") over.ratio = def.params.imageSide === "left" ? "5:7" : "7:5";
  if (["cards", "team", "products"].includes(def.fn) && !(def.params && def.params.cols)) over.cols = pf.cols;
  if (def.fn === "cards" && pf.avgItem > 260) over.cols = Math.min(over.cols || pf.cols, 2);   // texte long par carte → colonnes plus larges, lisibilité préservée
  return over;
}
module.exports = { analyze, profile, adapt, norm, orient, PAGE };
