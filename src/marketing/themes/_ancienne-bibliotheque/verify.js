// Contrôles de la bibliothèque de thèmes (utilisés par scripts/themes-check.js et par les tests) : répartition par catégorie, unicité, validité de CHAQUE page par le moteur
// du Page Builder, contraste des couleurs (WCAG AA), et diversité (aucun thème ne ressemble trop à un autre : mises en page, polices, teinte, enchaînement de l'accueil).
const library = require("./index");
const art = require("./art");
const sections = require("../../pages/sections");

const hue = (hex) => { const [r, g, b] = art.mix(hex, hex, 0) && [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return { h: 0, s: 0 }; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: ((h * 60) + 360) % 360, s: d / (1 - Math.abs(mx + mn - 1) || 1) }; };
// Luminance relative WCAG (avec correction gamma) et rapport de contraste
const wlum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [wlum(a), wlum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); let inter = 0; for (const v of A) if (B.has(v)) inter += 1; return inter / (A.size + B.size - inter || 1); };

function similarity(a, b) {
  const sa = library.signature(a), sb = library.signature(b);
  const ha = hue(a.tokens.colors.primary), hb = hue(b.tokens.colors.primary);
  const dh = Math.min(Math.abs(ha.h - hb.h), 360 - Math.abs(ha.h - hb.h));
  const sameColor = dh < 18 && Math.abs(art.lum(a.tokens.colors.background) - art.lum(b.tokens.colors.background)) < 0.2 ? 1 : 0;
  return 0.4 * jaccard(sa.variants, sb.variants) + 0.2 * (sa.heading === sb.heading && sa.body === sb.body ? 1 : 0) + 0.2 * sameColor + 0.2 * (sa.home === sb.home ? 1 : 0);
}

// ctx : contexte du moteur (db, organizationId…) pour valider les pages ; options.maxSimilarity : seuil de ressemblance accepté
function verify(ctx, { maxSimilarity = 0.72, onlyKeys = null } = {}) {
  const specs = library.load().specs.filter((s) => !onlyKeys || onlyKeys.includes(s.key));
  const issues = [], perTheme = [];
  const pairKey = new Set(), fonts = new Map();
  for (const s of specs) {
    const own = { key: s.key, category: s.category, pages: s.pages.length, invalidPages: [], contrast: [] };
    for (const p of s.pages) {
      try { const sec = library.pageSections(s.key, p.key); sections.normalizeSections(ctx, sec.map((x, i) => ({ ...x, id: `s${String(i).padStart(7, "0")}` }))); } catch (e) { own.invalidPages.push(`${p.key} : ${String(e.message).slice(0, 160)}`); }
    }
    const c = s.tokens.colors;
    const bg = c.background || "#ffffff", tx = c.text || "#000000", mu = c.muted || tx;
    if (ratio(tx, bg) < 4.5) own.contrast.push(`texte/fond ${ratio(tx, bg).toFixed(2)}`);
    if (ratio(mu, bg) < 4.5) own.contrast.push(`texte discret/fond ${ratio(mu, bg).toFixed(2)}`);
    if (c.surface && ratio(tx, c.surface) < 4.5) own.contrast.push(`texte/surface ${ratio(tx, c.surface).toFixed(2)}`);
    if (c.surface && ratio(mu, c.surface) < 4.5) own.contrast.push(`texte discret/surface ${ratio(mu, c.surface).toFixed(2)}`);
    if (ratio(c.primary, bg) < 3) own.contrast.push(`couleur principale/fond ${ratio(c.primary, bg).toFixed(2)}`);
    const pair = `${s.tokens.fonts.heading}|${s.tokens.fonts.body}`;
    if (pairKey.has(pair)) own.fontPairDuplicate = pair; pairKey.add(pair);
    fonts.set(s.tokens.fonts.heading, (fonts.get(s.tokens.fonts.heading) || 0) + 1);
    perTheme.push(own);
  }
  const counts = Object.fromEntries(library.CATEGORIES.map((c) => [c.key, specs.filter((s) => s.category === c.key).length]));
  const similar = [];
  for (let i = 0; i < specs.length; i += 1) for (let j = i + 1; j < specs.length; j += 1) { const v = similarity(specs[i], specs[j]); if (v > maxSimilarity) similar.push({ a: specs[i].key, b: specs[j].key, similarity: Number(v.toFixed(2)) }); }
  return { total: specs.length, target: library.TARGET_TOTAL, counts, perTheme, similar, overusedFonts: [...fonts].filter(([, n]) => n > 16).map(([f, n]) => `${f} (${n})`), invalid: perTheme.filter((t) => t.invalidPages.length), lowContrast: perTheme.filter((t) => t.contrast.length), fontPairDuplicates: perTheme.filter((t) => t.fontPairDuplicate) };
}
module.exports = { verify, similarity, ratio };
