// Apparence → Styles : palettes de départ proposées au gestionnaire de styles. Une palette n'est PAS un second stockage : elle remplit seulement les
// réglages de couleur du brouillon du site (mêmes identifiants « tokens.colors.* » que Personnaliser), validés ensuite par le moteur comme toute valeur.
// Chaque palette respecte les contrastes AA (4,5:1) du texte sur le fond et sur la surface, du texte discret sur le fond, et du texte des boutons sur la couleur principale
// (vérifié par tests/apparence-styles.test.js) : on ne propose jamais une palette illisible.
const PALETTES = Object.freeze([
  { key: "marine", label: "Marine Kolakisa", hint: "Bleu marine, sobre et professionnel.", colors: { primary: "#0b2a40", secondary: "#0277b6", accent: "#f59e0b", background: "#f3f8fc", surface: "#ffffff", text: "#10222f", muted: "#4a5b68" } },
  { key: "ocean", label: "Océan", hint: "Bleus clairs, tonique.", colors: { primary: "#0369a1", secondary: "#0b2a40", accent: "#f97316", background: "#f0f9ff", surface: "#ffffff", text: "#0c1a24", muted: "#475a68" } },
  { key: "foret", label: "Forêt", hint: "Verts profonds, naturel.", colors: { primary: "#1b5e3b", secondary: "#14352a", accent: "#d97706", background: "#f4f8f4", surface: "#ffffff", text: "#13251b", muted: "#4a5c50" } },
  { key: "bordeaux", label: "Bordeaux", hint: "Rouge profond, élégant.", colors: { primary: "#8a1c3a", secondary: "#3b1020", accent: "#c08a00", background: "#fbf5f6", surface: "#ffffff", text: "#241218", muted: "#5d4a50" } },
  { key: "ardoise", label: "Ardoise", hint: "Gris bleutés, neutre.", colors: { primary: "#334155", secondary: "#0f172a", accent: "#0e7490", background: "#f1f5f9", surface: "#ffffff", text: "#0f172a", muted: "#4b5a6d" } },
  { key: "sable", label: "Sable", hint: "Tons chauds, accueillant.", colors: { primary: "#92400e", secondary: "#451a03", accent: "#0f766e", background: "#fbf7f0", surface: "#ffffff", text: "#2a1a0c", muted: "#5f4e3f" } },
  { key: "violet", label: "Violet", hint: "Indigo, créatif.", colors: { primary: "#5b21b6", secondary: "#2e1065", accent: "#db2777", background: "#f7f5fc", surface: "#ffffff", text: "#1c1233", muted: "#54486b" } },
  { key: "contraste", label: "Contraste élevé", hint: "Noir et blanc, lisibilité maximale (AAA).", colors: { primary: "#000000", secondary: "#1a1a1a", accent: "#7a3e00", background: "#ffffff", surface: "#ffffff", text: "#000000", muted: "#333333" } },
]);
// « accent » n'existe que pour les sites du CMS : le site principal ne le propose pas (catalogue de Personnaliser)
function forScope(siteId) {
  return PALETTES.map((p) => ({ key: p.key, label: p.label, hint: p.hint, colors: Object.fromEntries(Object.entries(p.colors).filter(([k]) => siteId !== null || k !== "accent")) }));
}
// Réglages « chemin → valeur » qu'une palette écrit dans le brouillon
function changesFor(key, siteId) {
  const p = forScope(siteId).find((x) => x.key === key);
  return p ? Object.fromEntries(Object.entries(p.colors).map(([k, v]) => [`tokens.colors.${k}`, v])) : null;
}
module.exports = { PALETTES, forScope, changesFor };
