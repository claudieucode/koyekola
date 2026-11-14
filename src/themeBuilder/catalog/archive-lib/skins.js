// Identités PROPRES des 100 modèles d'archive : couleurs en valeurs FIXES (jamais les jetons du site) et polices de la bibliothèque locale (`font.<id>`).
// Une identité est dérivée de trois couleurs choisies à la main (fond · encre · accent) et d'une paire de polices ; le reste (texte discret, fond alterné, filet, texte d'accent)
// est calculé pour garantir la lisibilité. La « forme » (arrondis, filets, casse, densité) vient d'un jeu de 8 réglages répartis selon la famille et le numéro du concept.
const FONT_ALIAS = { "libre-caslon": "libre-caslon-text", "source-sans": "source-sans-3", "source-serif": "source-serif-4", recoleta: "fraunces" };
const fontId = (name) => { const s = String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); return `font.${FONT_ALIAS[s] || s}`; };

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (a) => `#${a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
const lum = (h) => { const v = rgb(h).map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const readable = (bg) => (ratio("#111111", bg) >= ratio("#ffffff", bg) ? "#111111" : "#ffffff");
// Accent lisible : rapproché de l'encre (ou du blanc sur fond sombre) par petits pas jusqu'à 4,5:1 sur le fond ET entre le texte de bouton et l'accent (WCAG AA)
function safeAccent(accent, bg, ink) {
  const toward = lum(bg) < 0.25 ? "#ffffff" : ink;
  for (let t = 0; t <= 0.85; t += 0.05) { const a = t ? mix(accent, toward, t) : accent; if (ratio(a, bg) >= 4.5 && ratio(readable(a), a) >= 4.5) return a; }
  return toward;
}
function safeMute(ink, bg, alt, dark) {
  for (let f = dark ? 0.35 : 0.42; f >= 0; f -= 0.04) { const m = mix(ink, bg, f); if (ratio(m, bg) >= 4.5 && ratio(m, alt) >= 4.5) return m; }
  return ink;
}

// Huit « formes » : arrondis, bordures, relief, casse, densité. Elles changent la structure visuelle, pas seulement les couleurs.
const SHAPES = [
  { radius: "0px", btnRadius: "0px", shadow: "none", weight: "700", caps: "uppercase", track: "1.5px", bw: "2px", pad: "20px", gap: "32px", btn: "solid", rule: "double" },
  { radius: "4px", btnRadius: "2px", shadow: "none", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "outline", rule: "single" },
  { radius: "10px", btnRadius: "8px", shadow: "none", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single" },
  { radius: "16px", btnRadius: "999px", shadow: "md", weight: "700", caps: "none", track: "0px", bw: "0px", pad: "20px", gap: "26px", btn: "solid", rule: "none" },
  { radius: "28px", btnRadius: "999px", shadow: "md", weight: "600", caps: "none", track: "0px", bw: "0px", pad: "24px", gap: "20px", btn: "solid", rule: "none" },
  { radius: "0px", btnRadius: "0px", shadow: "none", weight: "800", caps: "uppercase", track: "0.8px", bw: "1px", pad: "14px", gap: "20px", btn: "solid", rule: "single" },
  { radius: "6px", btnRadius: "6px", shadow: "lg", weight: "700", caps: "none", track: "0px", bw: "0px", pad: "18px", gap: "28px", btn: "solid", rule: "none" },
  { radius: "2px", btnRadius: "2px", shadow: "none", weight: "600", caps: "uppercase", track: "2px", bw: "1px", pad: "22px", gap: "36px", btn: "outline", rule: "single" },
];

function skinOf(c) {
  const [headName, bodyName] = c.fonts.split(" + ");
  const t = c.t || {}, dark = lum(c.bg) < 0.25, accent = safeAccent(c.acc, c.bg, c.ink);
  // « Second » de la maison = fond des cartes si le texte y reste lisible (AA), sinon fond calculé
  const alt = c.second && ratio(c.ink, c.second) >= 4.5 ? c.second : (dark ? mix(c.bg, "#ffffff", 0.08) : mix(c.bg, c.ink, 0.06));
  const sharp = t.rad === "0px";
  const shape = { radius: t.rad || "8px", btnRadius: sharp ? "0px" : t.rad === "28px" || t.rad === "24px" ? "999px" : t.rad || "8px", shadow: t.card === "ombre" ? "md" : "none", weight: "700", caps: "none", track: "0px",
    bw: t.card === "cadre" || t.card === "plat" ? "1px" : "0px", pad: t.card === "plat" ? "14px" : "18px", gap: t.head === "typo" || t.head === "marge" ? "36px" : t.card === "aplat" || t.card === "ombre" ? "24px" : "28px", btn: t.card === "cadre" || sharp ? "outline" : "solid", rule: t.card === "plat" ? "single" : "none" };
  return {
    key: c.key, label: c.nom, mood: dark ? "dark" : "light",
    bg: c.bg, fg: c.ink, accent, onAccent: readable(accent),
    mute: safeMute(c.ink, c.bg, alt, dark), alt, line: mix(c.bg, c.ink, dark ? 0.28 : 0.2),
    ink: c.ink, onInk: c.bg,
    font: fontId(bodyName), head: fontId(headName),
    ...shape,
  };
}
module.exports = { skinOf, fontId, mix, lum, SHAPES };
