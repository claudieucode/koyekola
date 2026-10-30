// Typography Planner : associations de polices (uniquement celles que le moteur sait charger : tokens.FONTS), échelle modulaire, interlignes, graisses.
// Polices de secours : chaque police du moteur a déjà sa pile de repli (tokens.FONTS[x].stack). Les polices téléversées d'un site ne sont pas utilisées (voir REMAINING_ISSUES).
const tokens = require("../marketing/pages/tokens");

const PAIRS = Object.freeze({
  moderne: { label: "Moderne", heading: "bricolage", body: "figtree", why: "Titres expressifs, texte très lisible." },
  classique: { label: "Classique", heading: "georgia", body: "figtree", why: "Titres à empattements, texte sans empattement : élégance et lisibilité." },
  editorial: { label: "Éditorial", heading: "georgia", body: "georgia", why: "Lecture longue, ton de presse." },
  neutre: { label: "Neutre", heading: "figtree", body: "figtree", why: "Sobre, une seule famille." },
  systeme: { label: "Système", heading: "system", body: "system", why: "Aucun chargement de police : le plus rapide." },
});
// Rapport de l'échelle selon l'ambiance (plus le rapport est grand, plus la hiérarchie est marquée)
const RATIO = { minimaliste: 1.2, corporate: 1.25, institutionnel: 1.25, educatif: 1.25, ecommerce: 1.25, tech: 1.25, luxe: 1.3, editorial: 1.3, creatif: 1.333 };
const BODY = { compacte: 16, equilibree: 17, aeree: 18 };

function plan(direction) {
  const pair = PAIRS[direction.fontPair] || PAIRS.neutre;
  const base = BODY[direction.density] || 17, r = RATIO[direction.mood] || 1.25;
  const px = (k) => Math.max(10, Math.min(96, Math.round(base * r ** k)));
  const premium = direction.mood === "luxe" || direction.mood === "editorial";
  const hw = premium ? 600 : direction.mood === "minimaliste" ? 600 : 800, sw = premium ? 600 : 700;
  const sizes = { h1: px(4), h2: px(3), h3: px(2), h4: px(1), h5: base, h6: Math.round(base * 0.9), body: base, caption: Math.round(base * 0.82), button: Math.max(14, base - 1) };
  // Sécurité d'échelle : strictement décroissante, h1 ≤ 64 (lisible sur ordinateur sans déborder)
  sizes.h1 = Math.min(sizes.h1, 64); sizes.h2 = Math.min(sizes.h2, sizes.h1 - 4); sizes.h3 = Math.min(sizes.h3, sizes.h2 - 3);
  const lh = { h1: 1.1, h2: 1.15, h3: 1.2, h4: 1.3, h5: 1.35, h6: 1.4, body: direction.density === "aeree" ? 1.7 : 1.6, caption: 1.4, button: 1.2 };
  const weights = { h1: hw, h2: hw, h3: sw, h4: sw, h5: sw, h6: sw, body: 400, caption: 400, button: 700 };
  const letterSpacing = { h1: premium ? 0.01 : direction.mood === "creatif" || direction.mood === "tech" ? -0.02 : -0.01, body: 0 };
  return { pair: direction.fontPair, label: pair.label, why: pair.why, fonts: { heading: pair.heading, body: pair.body, button: pair.body, link: pair.body }, sizes, lineHeights: lh, weights, letterSpacing, ratio: r };
}
// Contrôles : polices présentes dans le moteur, échelle décroissante, valeurs dans les bornes des tokens
function check(t) {
  const errors = [];
  for (const [role, key] of Object.entries(t.fonts)) if (!Object.hasOwn(tokens.FONTS, key)) errors.push(`Police « ${key} » (${role}) indisponible dans Kolakisa.`);
  const order = ["h1", "h2", "h3", "h4", "h5", "h6"];
  for (let i = 0; i < order.length - 1; i += 1) if (t.sizes[order[i]] < t.sizes[order[i + 1]]) errors.push(`Hiérarchie inversée entre ${order[i]} et ${order[i + 1]}.`);
  for (const [k, v] of Object.entries(t.sizes)) if (!(v >= 10 && v <= 96)) errors.push(`Taille ${k} hors limites (${v}).`);
  if (t.sizes.body < 16) errors.push("Texte courant inférieur à 16 px.");
  for (const [k, v] of Object.entries(t.lineHeights)) if (!(v >= 1 && v <= 2)) errors.push(`Interligne ${k} hors limites.`);
  for (const [k, v] of Object.entries(t.weights)) if (![400, 500, 600, 700, 800].includes(v)) errors.push(`Graisse ${k} non prise en charge (${v}).`);
  return errors;
}
module.exports = { PAIRS, plan, check, RATIO };
