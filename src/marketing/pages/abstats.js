// Statistiques du moteur d'A/B testing (palier 22) — fonctions pures, sans base de données.
// Méthode : comparaison de deux proportions (taux de conversion), test bilatéral du Z avec variance commune (« pooled »).
//  H0 : les deux versions ont le même taux de conversion. On rejette H0 si la valeur p est inférieure à alpha = 1 − confiance.
//  Hypothèses : visiteurs indépendants, une seule observation par visiteur, test à horizon fixe (taille d'échantillon décidée avant de regarder).
//  Limites : l'approximation normale n'est valable qu'avec assez de conversions ET de non-conversions dans chaque version (≥ 5, contrôlé) ;
//  consulter les résultats plusieurs fois avant la fin augmente le risque de faux positif (voir docs/cms-ab-testing.md) ; aucun test sur le revenu
//  (distribution très asymétrique) : le chiffre d'affaires est décrit, pas « prouvé ».
const CONFIDENCES = [90, 95, 99];
const Z_TWO_SIDED = { 90: 1.6448536, 95: 1.9599640, 99: 2.5758293 };
const Z_POWER_80 = 0.8416212;

// Fonction de répartition de la loi normale (Abramowitz et Stegun 7.1.26, erreur < 1,5e-7)
function normalCdf(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
// Comparaison de A (témoin) et B : z, valeur p bilatérale, écart absolu (points) et son intervalle de confiance, écart relatif
function compare(a, b, confidence = 95) {
  const conf = CONFIDENCES.includes(confidence) ? confidence : 95;
  const na = a.views || 0, nb = b.views || 0;
  const pa = na ? a.conversions / na : 0, pb = nb ? b.conversions / nb : 0;
  const pooled = (a.conversions + b.conversions) / ((na + nb) || 1);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / (na || 1) + 1 / (nb || 1)));
  const z = se ? (pb - pa) / se : 0;
  const p = se ? 2 * (1 - normalCdf(Math.abs(z))) : 1;
  // Intervalle de l'écart (variance non commune, méthode de Wald) — au même niveau de confiance que le test
  const seDiff = Math.sqrt((na ? pa * (1 - pa) / na : 0) + (nb ? pb * (1 - pb) / nb : 0));
  const diff = pb - pa;
  const zc = Z_TWO_SIDED[conf];
  return {
    z, p, alpha: (100 - conf) / 100, confidence: conf, significant: p < (100 - conf) / 100,
    rateA: pa, rateB: pb, diff, diffLow: diff - zc * seDiff, diffHigh: diff + zc * seDiff,
    relative: pa > 0 ? diff / pa : null,
  };
}
// Conditions de validité de l'approximation normale : au moins 5 conversions et 5 non-conversions dans CHAQUE version
function approximationValid(a, b) {
  return [a, b].every((v) => v.conversions >= 5 && v.views - v.conversions >= 5);
}
// Taille d'échantillon par version pour détecter un écart RELATIF donné (puissance 80 %), à partir du taux de départ observé
function requiredSample(baselineRate, relativeEffect = 0.2, confidence = 95) {
  if (!(baselineRate > 0 && baselineRate < 1) || !(relativeEffect > 0)) return null;
  const p1 = baselineRate, p2 = Math.min(0.999, baselineRate * (1 + relativeEffect));
  const pbar = (p1 + p2) / 2, za = Z_TWO_SIDED[CONFIDENCES.includes(confidence) ? confidence : 95];
  const n = Math.pow(za * Math.sqrt(2 * pbar * (1 - pbar)) + Z_POWER_80 * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2) / Math.pow(p2 - p1, 2);
  return Math.ceil(n);
}
// Contrôle du rapport d'échantillonnage (« sample ratio mismatch ») : la répartition observée correspond-elle à celle réglée ?
// Khi-deux à 1 degré de liberté ; un écart avec p < 0,001 signale un problème de mesure (robots, cache, redirection), pas un hasard.
function allocationCheck(viewsA, viewsB, shareB) {
  const n = viewsA + viewsB;
  if (n < 50) return { checked: false };
  const expB = n * shareB, expA = n - expB;
  const chi = Math.pow(viewsA - expA, 2) / expA + Math.pow(viewsB - expB, 2) / expB;
  const p = 2 * (1 - normalCdf(Math.sqrt(chi)));
  return { checked: true, chi, p, mismatch: p < 0.001, expectedA: Math.round(expA), expectedB: Math.round(expB) };
}
module.exports = { CONFIDENCES, normalCdf, compare, approximationValid, requiredSample, allocationCheck };
