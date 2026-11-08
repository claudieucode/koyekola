// Identités PROPRES de la bibliothèque « Article individuel » : couleurs en valeurs fixes (jamais un jeton du site) et polices de la bibliothèque locale.
// Un modèle d'article garde ainsi son aspect quelle que soit la charte du site qui l'accueille (voir docs/theme-builder/single-post/IDENTITE_GRAPHIQUE_INDEPENDANTE.md).
// Chaque mise en page est écrite pour une « ambiance » (clair, marque, nuit, éditorial, doux : ancien nom de son identité) ; elle reçoit ici une identité fixe de la MÊME ambiance, à tour de rôle,
// de sorte que deux mises en page voisines n'aient jamais la même palette. Les clés de modèle (« page-blanche.clair »…) ne changent pas : aucun lien d'aperçu existant ne casse.
const { IDENT2, MOODS, D } = require("../identities");

// [clé, libellé, ambiance, fond, texte, texte secondaire, fond alterné, accent, texte d'accent, filet, police du texte, police des titres, encre]
const OWN = [
  D(["sable-voyage", "Sable et lagon", "light", "#fbf7f0", "#2b2a26", "#6a655a", "#f1e9d9", "#0f6b6e", "#ffffff", "#e6dcc6", "font.source-sans-3", "font.playfair-display"]),
  D(["ardoise-pro", "Ardoise professionnelle", "light", "#fcfcfd", "#1f2937", "#586274", "#eef1f5", "#1d4ed8", "#ffffff", "#dfe4ec", "font.inter-tight", "font.manrope"]),
  D(["lin-gourmand", "Lin gourmand", "light", "#fffaf2", "#3b2417", "#85644f", "#f8ead6", "#a8431a", "#fffaf2", "#ecd9bd", "font.lora", "font.cormorant-garamond"]),
  D(["ocean", "Océan profond", "brand", "#0b4a6f", "#ffffff", "#d6ecf8", "#0a3b59", "#ffd166", "#10222f", "#ffffff55", "font.nunito-sans", "font.montserrat"]),
  D(["aubergine", "Aubergine", "brand", "#4a1d5c", "#ffffff", "#ecd9f5", "#3a1548", "#7ee0c3", "#10222f", "#ffffff55", "font.work-sans", "font.outfit"]),
  D(["nuit-cuivre", "Nuit et cuivre", "dark", "#14110f", "#f6efe6", "#bfae9a", "#201b17", "#d98a4e", "#14110f", "#3a322b", "font.source-sans-3", "font.playfair-display"]),
  D(["encre-cyan", "Encre et cyan", "dark", "#0a1628", "#eaf2ff", "#92a6c6", "#122240", "#38d0f0", "#06121f", "#233657", "font.ibm-plex-sans", "font.space-grotesk"]),
  D(["presse-creme", "Presse crème", "edit", "#f7f1e3", "#1c1b19", "#5b574d", "#ece3cf", "#1e3a8a", "#f7f1e3", "#1c1b19", "font.source-sans-3", "font.playfair-display"]),
  D(["encyclopedie", "Encyclopédie", "edit", "#fcfbf8", "#222222", "#5c5c5c", "#f1efe8", "#7a1f1f", "#fcfbf8", "#222222", "font.pt-serif", "font.libre-baskerville"]),
  D(["peche", "Pêche douce", "soft", "#fff5ef", "#4a2a1f", "#8c6354", "#ffe3d3", "#c2410c", "#ffffff", "#f6cdb8", "font.nunito-sans", "font.fredoka"]),
  D(["sauge-douce", "Sauge douce", "soft", "#f3f8f2", "#233a2c", "#5d7767", "#e0eddc", "#2f7a4d", "#ffffff", "#cde0c9", "font.mulish", "font.lora"]),
];
const ALL = [...IDENT2.map(({ mood: _m, ...x }) => x), ...OWN.map(({ mood: _m, ...x }) => x)];
const POOL = {};
for (const [old, mood] of Object.entries(MOODS)) POOL[old] = [...IDENT2, ...OWN].filter((x) => x.mood === mood);

// Distribue à tour de rôle les identités de l'ambiance de chaque mise en page (ordre du catalogue) ; renvoie { skin: clé d'identité, keySkin: ancienne clé conservée dans la clé du modèle }
function assigner() {
  const next = {};
  return (oldSkin) => { const pool = POOL[oldSkin]; next[oldSkin] = (next[oldSkin] || 0); const pick = pool[next[oldSkin] % pool.length]; next[oldSkin] += 1; return { skin: pick.key, keySkin: oldSkin }; };
}
module.exports = { ALL, POOL, assigner };
