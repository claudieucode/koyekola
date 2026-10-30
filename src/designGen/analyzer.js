// Design Analyzer + Brand Identity Planner : un brief libre (français, accents ignorés) + le contexte du site → une DIRECTION (choix énumérés et bornés).
// Règles locales et déterministes ; l'IA peut seulement RAFFINER ces choix (index.js) à l'intérieur des mêmes énumérations.
const bounds = (v, a, b, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(b, Math.max(a, Math.round(n))) : d; };
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const MOODS = ["corporate", "minimaliste", "luxe", "creatif", "editorial", "tech", "ecommerce", "institutionnel", "educatif"];
const DENSITY = ["compacte", "equilibree", "aeree"];
const ROUNDNESS = ["net", "doux", "arrondi"];
const FONT_PAIRS = ["moderne", "classique", "editorial", "neutre", "systeme"];
// Mots → intention
// [ambiance, mots forts (poids 2), mots faibles (poids 1)] — l'ambiance au meilleur score gagne ; égalité : l'ordre de la liste
const MOOD_WORDS = [
  ["minimaliste", ["minimal", "epure", "depouille"], ["sobre", "simple", "neutre"]],
  ["luxe", ["premium", "luxe", "haut de gamme", "prestige", "exclusif"], ["raffine", "elegant", "elegance", "sophistique"]],
  ["creatif", ["creatif", "audacieux", "artistique", "portfolio"], ["original", "colore", "dynamique", "fun", "agence"]],
  ["editorial", ["editorial", "magazine", "journal"], ["blog", "lecture", "revue"]],
  ["tech", ["technologique", "startup", "logiciel", "saas"], ["tech", "numerique", "digital", "innovant"]],
  ["ecommerce", ["e-commerce", "ecommerce", "vente en ligne"], ["boutique", "vetement", "pret-a-porter", "produits", "shop"]],
  ["educatif", ["educati", "formation", "apprentissage"], ["cours", "ecole", "enseign", "universite"]],
  ["institutionnel", ["institution", "administration", "fondation", "mairie"], ["association", "organisation", "ong"]],
  ["corporate", ["corporate", "consulting", "b2b"], ["entreprise", "professionnel", "serieux", "cabinet"]],
];
const SECTOR_MOOD = { vitrine: "corporate", entreprise: "corporate", portfolio: "creatif", agence: "creatif", blog: "editorial", magazine: "editorial", education: "educatif", formation: "educatif", boutique: "ecommerce", association: "institutionnel", organisation: "institutionnel", services: "corporate", evenement: "creatif", immobilier: "corporate", restaurant: "creatif", hotel: "luxe" };
// Couleur citée → teinte
const HUE_WORDS = [
  [["bleu marine", "marine", "navy"], 222], [["bleu nuit"], 228], [["bleu ciel", "azur", "turquoise"], 200], [["bleu"], 215], [["vert emeraude", "emeraude"], 155], [["vert"], 145], [["bordeaux", "grenat"], 345], [["rouge"], 358],
  [["orange", "terracotta", "terre cuite"], 22], [["jaune", "or ", "dore"], 42], [["violet", "pourpre", "mauve"], 268], [["rose"], 330], [["noir", "gris", "anthracite", "ardoise"], 215], [["marron", "brun", "beige", "sable"], 30],
];
const SECTOR_HUE = { immobilier: 222, restaurant: 22, hotel: 225, education: 205, formation: 210, boutique: 215, association: 150, blog: 215, portfolio: 262, agence: 262, evenement: 285, services: 215 };
const WORDS = {
  density: { aeree: ["espace", "aere", "respire", "genereux", "spacieux"], compacte: ["dense", "compact", "serre"] },
  roundness: { arrondi: ["arrondi", "rond", "ludique", "friendly", "doux"], net: ["angulaire", "net", "anguleux", "geometrique", "carre"] },
};
const has = (text, words) => words.some((w) => text.includes(w));

// brief : { text, category, siteType, sector, lang, country } ; renvoie la direction + ce qui a été compris (explications)
function analyze(brief = {}) {
  const t = norm(`${brief.text || ""} ${brief.sector || ""}`);
  const cat = norm(brief.category), why = [];
  let mood = null;
  let best = 0;
  for (const [m, strong, weak] of MOOD_WORDS) {
    const score = strong.filter((w) => t.includes(w)).length * 2 + weak.filter((w) => t.includes(w)).length;
    if (score > best) { best = score; mood = m; }
  }
  if (mood) why.push(`Ambiance « ${mood} » d'après le brief.`);
  if (!mood && SECTOR_MOOD[cat]) { mood = SECTOR_MOOD[cat]; why.push(`Ambiance « ${mood} » d'après le type de site (${cat}).`); }
  if (!mood) { mood = "corporate"; why.push("Ambiance « corporate » par défaut (brief et type de site peu précis)."); }
  let hue = null;
  for (const [words, h] of HUE_WORDS) if (has(t, words)) { hue = h; why.push(`Teinte ${h}° d'après la couleur citée.`); break; }
  if (hue === null && SECTOR_HUE[cat]) { hue = SECTOR_HUE[cat]; why.push(`Teinte ${hue}° d'après le secteur.`); }
  if (hue === null) { hue = 215; why.push("Teinte bleue (215°) par défaut."); }
  // Gris / noir demandé explicitement : palette quasi neutre (minimaliste), sauf si une autre ambiance est citée
  const neutral = has(t, ["noir", "gris", "anthracite", "monochrome"]) && !has(t, ["bleu", "vert", "rouge", "orange", "violet", "rose"]);
  const density = has(t, WORDS.density.aeree) || mood === "luxe" ? "aeree" : has(t, WORDS.density.compacte) || mood === "tech" ? "compacte" : "equilibree";
  const roundness = has(t, WORDS.roundness.arrondi) || mood === "creatif" || mood === "educatif" ? "arrondi" : has(t, WORDS.roundness.net) || mood === "luxe" || mood === "editorial" || mood === "minimaliste" ? "net" : "doux";
  const fontPair = mood === "luxe" || mood === "institutionnel" ? "classique" : mood === "editorial" ? "editorial" : mood === "minimaliste" || mood === "corporate" ? "neutre" : "moderne";
  const photos = has(t, ["photo", "photographie", "image", "visuel"]);
  return { mood: neutral ? "minimaliste" : mood, hue, neutral, density, roundness, fontPair, imagery: photos ? "forte" : "moderee", lang: brief.lang || "fr", why };
}
// Valide une direction proposée (par l'IA ou un humain) : valeurs hors énumération → écartées (la règle locale garde la main)
function sanitize(input, base) {
  const out = { ...base }; const notes = [];
  const pick = (key, list) => { if (input && input[key] !== undefined) { if (list.includes(input[key])) out[key] = input[key]; else notes.push(`« ${key} » refusé : valeur hors liste.`); } };
  pick("mood", MOODS); pick("density", DENSITY); pick("roundness", ROUNDNESS); pick("fontPair", FONT_PAIRS);
  if (input && input.hue !== undefined) { if (Number.isFinite(Number(input.hue))) out.hue = bounds(input.hue, 0, 359, base.hue); else notes.push("« hue » refusé : nombre attendu."); }
  return { direction: out, notes };
}
module.exports = { analyze, sanitize, MOODS, DENSITY, ROUNDNESS, FONT_PAIRS, norm };
