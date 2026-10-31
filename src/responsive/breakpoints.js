// Breakpoint Manager (programme 22.8). Le modèle natif a quatre écrans (ordinateur, grand écran ≥ wide, tablette ≤ tablet, mobile ≤ mobile) dont les seuils sont réglés PAR SITE
// (siteSettings.layout.breakpoints, bornes validées). On ne crée pas un second jeu de seuils : les « profils » ci-dessous sont des largeurs de RÉFÉRENCE pour l'aperçu et l'audit,
// rattachées à l'écran natif qui s'applique réellement à cette largeur selon les seuils du site.
const DEFAULTS = Object.freeze({ tablet: 1023, mobile: 767, wide: 1920 });
const PROFILES = Object.freeze([
  { key: "mobile-small", label: "Mobile compact", width: 320, height: 640, touch: true },
  { key: "mobile", label: "Mobile", width: 390, height: 800, touch: true },
  { key: "mobile-large", label: "Grand mobile", width: 430, height: 900, touch: true },
  { key: "tablet", label: "Tablette", width: 820, height: 1100, touch: true },
  { key: "laptop", label: "Portable", width: 1280, height: 800, touch: false },
  { key: "desktop", label: "Ordinateur", width: 1440, height: 900, touch: false },
  { key: "wide", label: "Grand écran", width: 1920, height: 1080, touch: false },
]);
function normalize(bp) {
  const b = { ...DEFAULTS, ...(bp || {}) };
  for (const k of Object.keys(DEFAULTS)) if (!Number.isFinite(Number(b[k]))) b[k] = DEFAULTS[k];
  return { tablet: Number(b.tablet), mobile: Number(b.mobile), wide: Number(b.wide) };
}
// Écran natif appliqué à une largeur (même logique d'ordre que pageCss : le plus petit l'emporte)
function deviceAt(width, bp) {
  const b = normalize(bp);
  if (width <= b.mobile) return "mobile";
  if (width <= b.tablet) return "tablet";
  if (width >= b.wide) return "wide";
  return "desktop";
}
// Incohérences réelles d'un jeu de seuils (utile avant de les enregistrer)
function check(bp) {
  const b = normalize(bp), issues = [];
  if (b.mobile >= b.tablet) issues.push("Le seuil mobile doit être inférieur au seuil tablette.");
  if (b.tablet >= b.wide) issues.push("Le seuil grand écran doit dépasser le seuil tablette.");
  if (b.tablet - b.mobile < 100) issues.push("Moins de 100 px entre mobile et tablette : la plage tablette est trop étroite pour être utile.");
  return issues;
}
// Profils avec l'écran natif correspondant pour CE site : l'audit teste chaque profil et rattache les constats à l'écran où ils se corrigent
const profilesFor = (bp) => PROFILES.map((p) => ({ ...p, device: deviceAt(p.width, bp) }));
// Largeurs pile sur chaque seuil et un pixel au-dessus : c'est là que les conflits de media queries apparaissent
const edgeWidths = (bp) => { const b = normalize(bp); return [b.mobile, b.mobile + 1, b.tablet, b.tablet + 1, b.wide - 1, b.wide]; };
module.exports = { DEFAULTS, PROFILES, normalize, deviceAt, check, profilesFor, edgeWidths };
