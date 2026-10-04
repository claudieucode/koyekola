// Apparence de l'éditeur d'articles (toute l'interface sauf la feuille d'écriture) : choix PERSONNEL de chaque formateur (table user_prefs). Ne change rien au site public.
const THEMES = [
  { key: "clair", label: "Clair", color: "#ffffff" },
  { key: "nuit", label: "Bleu foncé", color: "#0c1d2b" },
  { key: "gris-clair", label: "Gris clair", color: "#eceef1" },
  { key: "gris-moyen", label: "Gris moyen", color: "#474c53" },
  { key: "gris-fonce", label: "Gris foncé", color: "#27292d" },
  { key: "noir", label: "Noir", color: "#0f1215" },
  { key: "perso", label: "Couleur personnalisée", color: null },
];
const KEYS = new Set(THEMES.map((t) => t.key));
const HEX = /^#[0-9a-f]{6}$/i;

// Luminance relative (WCAG) d'une couleur #rrggbb
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
// Texte clair ou foncé : celui qui contraste le plus avec le fond
const contrastOf = (hex) => ((1.05) / (luminance(hex) + 0.05) > (luminance(hex) + 0.05) / 0.05 ? "light" : "dark");

function normalize(theme, color) {
  const key = KEYS.has(theme) ? theme : "clair";
  if (key === "perso") {
    const c = HEX.test(String(color || "")) ? String(color).toLowerCase() : null;
    return c ? { key, color: c } : { key: "clair", color: null };
  }
  return { key, color: null };
}

// Pour la vue : thème, couleur de fond, texte clair/foncé
function describe(user) {
  const { key, color } = normalize(user && user.editor_theme, user && user.editor_color);
  const bg = key === "perso" ? color : THEMES.find((t) => t.key === key).color;
  return { key, color: bg, contrast: contrastOf(bg) };
}

module.exports = { THEMES, normalize, describe, contrastOf };
