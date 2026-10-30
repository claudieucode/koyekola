// AI Design Generator — calcul des couleurs (pur, sans base). Contrastes WCAG 2.x, conversions HSL, palettes par intention.
// Tout est déterministe : la même direction produit toujours la même palette. Chaque paire texte/fond est vérifiée (AA : 4,5 pour le texte, 3 pour les grands textes et éléments d'interface).
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const HEX = /^#[0-9a-f]{6}$/i;

function hexToRgb(hex) { const h = String(hex).replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function rgbToHex(r, g, b) { return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`; }
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255), max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0; const l = (max + min) / 2, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, s * 100, l * 100];
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }
// Texte lisible sur un fond (même règle que le moteur : tokens.onColor) : noir ou blanc, le plus contrasté
const onColor = (bg) => (ratio("#ffffff", bg) >= ratio("#0b1620", bg) ? "#ffffff" : "#0b1620");
// Assombrit (ou éclaircit) `hex` par pas jusqu'à atteindre `min` contre `against`
function ensure(hex, against, min, dir = "darken") {
  let [h, s, l] = hexToHsl(hex), out = hex, n = 0;
  while (ratio(out, against) < min && n < 80) { l += dir === "darken" ? -1 : 1; if (l < 0 || l > 100) break; out = hslToHex(h, s, l); n += 1; }
  return out;
}
const shade = (hex, dl) => { const [h, s, l] = hexToHsl(hex); return hslToHex(h, s, clamp(l + dl, 0, 100)); };

// Intentions de palette. h : teinte, s : saturation du primaire, l : clarté du primaire ; bg/surface/text : neutres teintés ; accent : décalage de teinte et saturation
const MOODS = Object.freeze({
  corporate: { label: "Corporate", s: 62, l: 30, sec: { s: 55, l: 13 }, accent: { dh: 150, s: 85, l: 48 }, bg: { s: 35, l: 97 }, text: { s: 40, l: 11 }, border: { s: 25, l: 87 } },
  minimaliste: { label: "Minimaliste", s: 14, l: 18, sec: { s: 12, l: 32 }, accent: { dh: 0, s: 8, l: 46 }, bg: { s: 0, l: 100 }, text: { s: 10, l: 9 }, border: { s: 6, l: 89 } },
  luxe: { label: "Luxe", s: 52, l: 17, sec: { s: 45, l: 10 }, accent: { dh: 0, s: 62, l: 38, h: 38 }, bg: { s: 22, l: 97, h: 40 }, text: { s: 25, l: 9 }, border: { s: 20, l: 85, h: 40 } },
  creatif: { label: "Créatif", s: 68, l: 38, sec: { s: 60, l: 16 }, accent: { dh: 150, s: 90, l: 45 }, bg: { s: 40, l: 97 }, text: { s: 35, l: 12 }, border: { s: 30, l: 88 } },
  editorial: { label: "Éditorial", s: 34, l: 24, sec: { s: 30, l: 12 }, accent: { dh: 180, s: 55, l: 36 }, bg: { s: 28, l: 96, h: 42 }, text: { s: 18, l: 10 }, border: { s: 18, l: 84, h: 42 } },
  tech: { label: "Technologique", s: 78, l: 36, sec: { s: 60, l: 12 }, accent: { dh: 40, s: 90, l: 46 }, bg: { s: 40, l: 97 }, text: { s: 45, l: 10 }, border: { s: 30, l: 88 } },
  ecommerce: { label: "E-commerce", s: 62, l: 33, sec: { s: 40, l: 14 }, accent: { dh: 170, s: 92, l: 46 }, bg: { s: 22, l: 98 }, text: { s: 28, l: 11 }, border: { s: 18, l: 88 } },
  institutionnel: { label: "Institutionnel", s: 48, l: 28, sec: { s: 45, l: 14 }, accent: { dh: 30, s: 70, l: 40 }, bg: { s: 22, l: 97 }, text: { s: 32, l: 12 }, border: { s: 20, l: 87 } },
  educatif: { label: "Éducatif", s: 62, l: 34, sec: { s: 55, l: 15 }, accent: { dh: 175, s: 80, l: 40 }, bg: { s: 40, l: 97 }, text: { s: 36, l: 12 }, border: { s: 26, l: 88 } },
});
// États (succès, avertissement, erreur) : valeurs sobres vérifiées contre la surface
const STATES = Object.freeze({ success: "#1e7e34", warning: "#8a5a00", error: "#c62828" });

// Palette complète pour une teinte et une intention. Renvoie les 10 couleurs du système + bordure + liens + boutons (états), toutes vérifiées.
function palette(hue, moodKey) {
  const m = MOODS[moodKey] || MOODS.corporate;
  const bgH = m.bg.h ?? hue, textH = hue;
  const background = hslToHex(bgH, m.bg.s, m.bg.l);
  const surface = m.bg.l >= 99 ? "#ffffff" : hslToHex(bgH, Math.min(m.bg.s, 25), 99.5);
  const text = ensure(hslToHex(textH, m.text.s, m.text.l), background, 7, "darken");
  let primary = hslToHex(hue, m.s, m.l);
  // Le primaire sert de fond de bouton et de couleur de liens : le texte du bouton (noir/blanc) doit avoir ≥ 4,5 et le primaire doit être lisible sur le fond (≥ 4,5)
  primary = ensure(primary, background, 4.5, "darken");
  if (ratio(onColor(primary), primary) < 4.5) primary = ensure(primary, "#ffffff", 4.5, "darken");
  const secondary = ensure(hslToHex(hue, m.sec.s, m.sec.l), background, 7, "darken");
  const accHue = m.accent.h ?? hue + m.accent.dh;
  const accent = ensure(hslToHex(accHue, m.accent.s, m.accent.l), background, 3, "darken");
  const muted = ensure(hslToHex(hue, Math.min(m.text.s, 18), 38), background, 4.5, "darken");
  const border = hslToHex(m.border.h ?? hue, m.border.s, m.border.l);
  const link = ensure(primary, background, 4.5, "darken");
  const linkHover = ensure(shade(link, -8), background, 4.5, "darken");
  const states = {};
  for (const [k, v] of Object.entries(STATES)) states[k] = ensure(v, surface, 4.5, "darken");
  const hover = ensure(shade(primary, -7), background, 4.5, "darken");
  const active = shade(hover, -5);
  return { primary, secondary, accent, background, surface, text, muted, border, link, linkHover, ...states, buttonText: onColor(primary), buttonHover: hover, buttonActive: active, buttonHoverText: onColor(hover), buttonActiveText: onColor(active), accentText: onColor(accent), mood: moodKey, hue };
}
// Vérifie les paires utiles ; renvoie [{pair, ratio, min, ok}]
function audit(p) {
  const pairs = [
    ["Texte sur arrière-plan", p.text, p.background, 4.5], ["Texte sur surface", p.text, p.surface, 4.5], ["Texte secondaire sur arrière-plan", p.muted, p.background, 4.5],
    ["Titres (secondaire) sur arrière-plan", p.secondary, p.background, 4.5], ["Liens sur arrière-plan", p.link, p.background, 4.5], ["Texte de bouton sur primaire", p.buttonText, p.primary, 4.5],
    ["Texte de bouton au survol", p.buttonHoverText, p.buttonHover, 4.5], ["Texte de bouton actif", p.buttonActiveText, p.buttonActive, 4.5], ["Texte sur accent", p.accentText, p.accent, 3],
    ["Succès sur surface", p.success, p.surface, 4.5], ["Avertissement sur surface", p.warning, p.surface, 4.5], ["Erreur sur surface", p.error, p.surface, 4.5],
  ];
  return pairs.map(([pair, a, b, min]) => { const r = Math.round(ratio(a, b) * 100) / 100; return { pair, ratio: r, min, ok: r >= min }; });
}
module.exports = { HEX, MOODS, STATES, hexToRgb, hexToHsl, hslToHex, luminance, ratio, onColor, ensure, shade, palette, audit, clamp };
