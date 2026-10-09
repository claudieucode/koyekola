/* KOLAKISA — générateur de palette de l'éditeur (calculs purs, sans accès à la page ; aussi utilisable par Node pour les tests).
   À partir de quelques couleurs choisies (accent, panneaux, fond, barre du haut, texte), il calcule TOUS les jetons --editor-* :
   survol, actif, bordures, textes secondaires, couleur lisible sur l'accent, anneau de focus… avec contrôle du contraste (WCAG 2) :
   la couleur choisie reste reconnaissable, mais jamais au prix de la lisibilité. Rien d'ici n'est enregistré dans les pages. */
(function (root) {
  "use strict";

  // ---------- Couleurs ----------
  function parseHex(v) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(v || "").trim());
    if (!m) return null;
    var s = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  function toHex(rgb) { return "#" + rgb.map(function (c) { return ("0" + Math.max(0, Math.min(255, Math.round(c))).toString(16)).slice(-2); }).join(""); }
  function rgbToHsl(rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min, hh = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      hh = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hh *= 60; if (hh < 0) hh += 360;
    }
    return [hh, s, l];
  }
  function hslToRgb(hsl) {
    var hh = ((hsl[0] % 360) + 360) % 360, s = Math.max(0, Math.min(1, hsl[1])), l = Math.max(0, Math.min(1, hsl[2]));
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((hh / 60) % 2) - 1)), m = l - c / 2, r = 0, g = 0, b = 0;
    if (hh < 60) { r = c; g = x; } else if (hh < 120) { r = x; g = c; } else if (hh < 180) { g = c; b = x; } else if (hh < 240) { g = x; b = c; } else if (hh < 300) { r = x; b = c; } else { r = c; b = x; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  function luminance(rgb) {
    var c = rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    var la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function isDark(rgb) { return luminance(rgb) < 0.4; }
  // Déplace la clarté de `fg` (teinte et saturation gardées) jusqu'à atteindre `min` de contraste contre `bg` (un ou plusieurs fonds)
  function ensureContrast(fg, bgs, min) {
    bgs = Array.isArray(bgs[0]) ? bgs : [bgs];
    var ok = function (c) { return bgs.every(function (b) { return contrast(c, b) >= min; }); };
    if (ok(fg)) return fg;
    var hsl = rgbToHsl(fg), light = bgs.reduce(function (s, b) { return s + luminance(b); }, 0) / bgs.length > 0.18;
    for (var i = 1; i <= 100; i++) {
      var c = hslToRgb([hsl[0], hsl[1], light ? hsl[2] - i / 100 * hsl[2] : hsl[2] + i / 100 * (1 - hsl[2])]);
      if (ok(c)) return c;
    }
    return light ? [0, 0, 0] : [255, 255, 255];
  }
  // Texte posé SUR une couleur : blanc ou presque noir, selon le meilleur contraste
  function onColor(bg) {
    var white = [255, 255, 255], ink = [8, 20, 30];
    return contrast(white, bg) >= contrast(ink, bg) ? white : ink;
  }
  var css = function (rgb, a) { return a === undefined ? toHex(rgb) : "rgba(" + rgb.map(Math.round).join(", ") + ", " + a + ")"; };
  function svgData(path, stroke, width) {
    return 'url("data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='" + stroke + "' stroke-width='" + width + "' stroke-linecap='round' stroke-linejoin='round'>" + path + "</svg>") + '")';
  }

  // ---------- Générateur de palette ----------
  // entrée : { accent, panel?, bg?, top?, text? } (hex) ; un champ absent est déduit. Sortie : { tokens, scheme, report }
  function derive(input) {
    input = input || {};
    var accentIn = parseHex(input.accent) || parseHex("#0277b6");
    var hue = rgbToHsl(accentIn)[0], sat = rgbToHsl(accentIn)[1];
    var tint = Math.min(0.22, 0.06 + sat * 0.12); // un soupçon de la teinte d'accent dans les neutres
    var panel = parseHex(input.panel) || hslToRgb([hue, tint * 0.4, 0.995]);
    var dark = isDark(panel);
    var bg = parseHex(input.bg) || (dark ? mix(panel, [0, 0, 0], 0.35) : mix(panel, hslToRgb([hue, tint, 0.6]), 0.17));
    var toward = dark ? [255, 255, 255] : [0, 0, 0];
    var secondary = mix(panel, toward, dark ? 0.03 : 0.025);
    var card = dark ? mix(panel, [255, 255, 255], 0.04) : mix(panel, [255, 255, 255], 0.6);
    var input_ = card;
    var border = mix(panel, toward, dark ? 0.12 : 0.1);
    var borderStrong = mix(panel, toward, dark ? 0.24 : 0.22);
    var surfaces = [panel, secondary, card];
    var text = ensureContrast(parseHex(input.text) || (dark ? hslToRgb([hue, 0.12, 0.92]) : hslToRgb([hue, 0.35, 0.11])), surfaces, 7);
    var textSecondary = ensureContrast(mix(text, panel, 0.2), surfaces, 5.5);
    var muted = ensureContrast(mix(text, panel, 0.38), surfaces, 4.5);
    var hover = mix(panel, accentIn, dark ? 0.1 : 0.06);
    if (contrast(hover, text) < 7) hover = mix(panel, toward, 0.06);
    // Accent : garde la couleur choisie ; l'éclaircit ou l'assombrit seulement si elle se voit à peine sur le panneau (≥ 3:1 pour les éléments graphiques)
    var accent = ensureContrast(accentIn, surfaces, 3);
    var onAccent = onColor(accent);
    var active = mix(panel, accent, dark ? 0.3 : 0.2);
    var accentText = ensureContrast(accent, [panel, secondary, card, active, hover], 4.5);
    // Barre du haut : toujours assez sombre pour que ses icônes claires (non dérivées) restent lisibles
    var top = parseHex(input.top) || hslToRgb([hue, Math.min(0.7, 0.25 + sat * 0.5), 0.15]);
    if (luminance(top) > 0.12) { var th = rgbToHsl(top); top = hslToRgb([th[0], th[1], Math.min(th[2], 0.2)]); for (var i = 0; luminance(top) > 0.12 && i < 40; i++) top = mix(top, [0, 0, 0], 0.08); }
    var topBorder = mix(top, [0, 0, 0], 0.35);
    var danger = dark ? [255, 138, 128] : [192, 18, 29], success = dark ? [111, 212, 138] : [30, 122, 52];
    var dangerBg = mix(panel, danger, dark ? 0.16 : 0.1), successBg = mix(panel, success, dark ? 0.16 : 0.1);
    var tokens = {
      "--editor-bg": css(bg), "--editor-panel": css(panel), "--editor-panel-secondary": css(secondary), "--editor-card": css(card), "--editor-input": css(input_),
      "--editor-border": css(border), "--editor-border-strong": css(borderStrong), "--editor-guide": css(mix(panel, toward, dark ? 0.16 : 0.15)),
      "--editor-text": css(text), "--editor-text-secondary": css(textSecondary), "--editor-muted": css(muted),
      "--editor-hover": css(hover), "--editor-active": css(active), "--editor-accent": css(accent), "--editor-accent-text": css(accentText), "--editor-on-accent": css(onAccent),
      "--editor-danger": css(ensureContrast(danger, surfaces, 4.5)), "--editor-danger-bg": css(dangerBg), "--editor-success": css(ensureContrast(success, surfaces, 4.5)), "--editor-success-bg": css(successBg),
      "--editor-shadow": dark ? "0 10px 28px rgba(0, 0, 0, 0.5)" : "0 8px 24px rgba(11, 42, 64, 0.16)",
      "--editor-focus": "0 0 0 2px " + css(accent, 0.45), "--editor-scheme": dark ? "dark" : "light",
      "--editor-select-arrow": svgData("<path d='m6 9 6 6 6-6'/>", css(muted), 2.5),
      "--editor-search-icon": svgData("<circle cx='11' cy='11' r='7'/><path d='m20 20-3.5-3.5'/>", css(muted), 2),
      "--editor-top": css(top), "--editor-top-border": css(topBorder),
    };
    var report = {
      text: contrast(text, panel), secondary: contrast(textSecondary, panel), muted: contrast(muted, panel), accentText: contrast(accentText, panel),
      onAccent: contrast(onAccent, accent), accent: contrast(accent, panel), accentAdjusted: toHex(accent) !== toHex(accentIn),
    };
    return { tokens: tokens, scheme: dark ? "dark" : "light", report: report };
  }

  // ---------- Présets (seulement l'accent : le reste en découle) ----------
  var PRESETS = [
    { key: "kolakisa", name: "Kolakisa Blue", accent: "#0277b6" },
    { key: "midnight", name: "Midnight", accent: "#3b6fd4", panel: "#111827", bg: "#0a0f1a", top: "#0b1220" },
    { key: "graphite", name: "Graphite", accent: "#5b6b7b", panel: "#1c1f23", bg: "#121417", top: "#15181b" },
    { key: "ocean", name: "Ocean", accent: "#0e8fa3" },
    { key: "emerald", name: "Emerald", accent: "#0f9d6b" },
    { key: "violet", name: "Violet", accent: "#6d4fd8" },
    { key: "burgundy", name: "Burgundy", accent: "#a3203f" },
    { key: "slate", name: "Slate", accent: "#52667a", panel: "#f4f6f8", bg: "#e3e8ed" },
  ];

  var api = { parseHex: parseHex, toHex: toHex, rgbToHsl: rgbToHsl, hslToRgb: hslToRgb, luminance: luminance, contrast: contrast, mix: mix, ensureContrast: ensureContrast, onColor: onColor, derive: derive, PRESETS: PRESETS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.KWTheme = api;
})(typeof window !== "undefined" ? window : this);
