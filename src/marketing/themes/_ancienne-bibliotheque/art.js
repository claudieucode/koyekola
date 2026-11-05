// Visuels ORIGINAUX des thèmes Kolakisa : illustrations vectorielles (SVG) générées à partir de la palette du thème et d'une graine fixe.
// Aucune photographie ni image tierce n'est embarquée : ces visuels sont créés par Kolakisa (aucune licence externe, aucune attribution), identiques à chaque génération
// (déterministes), légers, nets à toutes les tailles, et remplaçables par les photos réelles du site (médiathèque). Servis par /themes-art/<thème>/<emplacement>.svg.
const crypto = require("node:crypto");

// ---- Aléatoire déterministe (même thème + même emplacement = même image)
const seedOf = (text) => crypto.createHash("sha256").update(String(text)).digest().readUInt32LE(0);
function rng(seed) {
  let a = seed >>> 0;
  const next = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { next, range: (lo, hi) => lo + next() * (hi - lo), int: (lo, hi) => Math.floor(lo + next() * (hi - lo + 1)), pick: (list) => list[Math.floor(next() * list.length)] };
}

// ---- Couleurs
const clamp = (n, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, n));
const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c) => `#${c.map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0")).join("")}`;
const mix = (a, b, t) => { const x = toRgb(a), y = toRgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
const lighten = (hex, t) => mix(hex, "#ffffff", t);
const darken = (hex, t) => mix(hex, "#000000", t);
const lum = (hex) => { const [r, g, b] = toRgb(hex).map((v) => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

// Palette de l'illustration : tirée des jetons du thème (jamais de couleur codée en dur)
function paletteOf(tokens) {
  const c = tokens.colors;
  const dark = lum(c.background) < 0.35;
  return {
    bg: c.background, surface: c.surface, ink: c.text, a: c.primary, b: c.secondary, c: c.accent, dark,
    soft: dark ? lighten(c.background, 0.12) : darken(c.background, 0.05), deep: dark ? darken(c.background, 0.35) : darken(c.secondary, 0.1),
  };
}

const f = (n) => Math.round(n * 10) / 10;
const ns = 'xmlns="http://www.w3.org/2000/svg"';
const grain = (id, w, h, strength = 0.07) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${strength} 0"/></filter>`;

// ---- Motifs : chacun reçoit (r, p, w, h) et renvoie du SVG intérieur (sans balise <svg>)
const MOTIFS = {
  // Collines superposées sous un soleil
  dunes(r, p, w, h) {
    const sun = `<circle cx="${f(w * r.range(0.55, 0.8))}" cy="${f(h * r.range(0.25, 0.4))}" r="${f(h * r.range(0.12, 0.2))}" fill="${p.c}" opacity=".92"/>`;
    const layers = [p.soft, mix(p.a, p.bg, 0.55), mix(p.a, p.b, 0.35), p.b, p.deep].map((col, i) => {
      const base = h * (0.52 + i * 0.1), amp = h * r.range(0.04, 0.1), ph = r.range(0, 6);
      let d = `M0 ${h} L0 ${f(base)}`;
      for (let x = 0; x <= w; x += w / 24) d += ` L${f(x)} ${f(base + Math.sin(x / w * 5 + ph) * amp + Math.sin(x / w * 11 + i) * amp * 0.4)}`;
      return `<path d="${d} L${w} ${h} Z" fill="${col}"/>`;
    });
    return `<rect width="${w}" height="${h}" fill="url(#sky)"/>${sun}${layers.join("")}`;
  },
  // Vagues
  waves(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="url(#sky)"/>`];
    for (let i = 0; i < 6; i++) {
      const base = h * (0.3 + i * 0.12), amp = h * r.range(0.03, 0.07), len = r.range(2, 5), ph = r.range(0, 6);
      let d = `M0 ${h} L0 ${f(base)}`;
      for (let x = 0; x <= w; x += w / 40) d += ` L${f(x)} ${f(base + Math.sin(x / w * len * Math.PI + ph) * amp)}`;
      out.push(`<path d="${d} L${w} ${h} Z" fill="${mix(p.a, p.deep, i / 6)}" opacity="${f(0.55 + i * 0.08)}"/>`);
    }
    return out.join("");
  },
  // Silhouette de ville
  skyline(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="url(#sky)"/>`, `<circle cx="${f(w * r.range(0.2, 0.8))}" cy="${f(h * 0.28)}" r="${f(h * 0.1)}" fill="${p.c}" opacity=".85"/>`];
    for (let layer = 0; layer < 3; layer++) {
      let x = -20;
      const col = [mix(p.a, p.bg, 0.5), mix(p.a, p.deep, 0.35), p.deep][layer];
      while (x < w) {
        const bw = r.range(w * 0.04, w * 0.1), bh = r.range(h * (0.25 - layer * 0.04), h * (0.6 - layer * 0.1));
        out.push(`<rect x="${f(x)}" y="${f(h - bh)}" width="${f(bw)}" height="${f(bh)}" fill="${col}"/>`);
        if (layer === 2) for (let wy = h - bh + 14; wy < h - 20; wy += 22) for (let wx = x + 8; wx < x + bw - 10; wx += 16) if (r.next() > 0.45) out.push(`<rect x="${f(wx)}" y="${f(wy)}" width="7" height="10" fill="${p.c}" opacity=".7"/>`);
        x += bw + r.range(2, 10);
      }
    }
    return out.join("");
  },
  // Montagnes
  mountains(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="url(#sky)"/>`, `<circle cx="${f(w * r.range(0.6, 0.85))}" cy="${f(h * 0.22)}" r="${f(h * 0.09)}" fill="${p.c}" opacity=".9"/>`];
    for (let i = 0; i < 4; i++) {
      const base = h * (0.55 + i * 0.1), col = mix(p.a, p.deep, i / 3.2);
      let d = `M0 ${h} L0 ${f(base)}`;
      let x = 0;
      while (x < w) { const pw = r.range(w * 0.12, w * 0.3); d += ` L${f(x + pw / 2)} ${f(base - r.range(h * 0.12, h * (0.38 - i * 0.05)))} L${f(x + pw)} ${f(base)}`; x += pw; }
      out.push(`<path d="${d} L${w} ${h} Z" fill="${col}" opacity="${f(0.65 + i * 0.1)}"/>`);
    }
    return out.join("");
  },
  // Cercles translucides (flou lumineux)
  bokeh(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="url(#sky)"/>`];
    for (let i = 0; i < 26; i++) out.push(`<circle cx="${f(r.range(0, w))}" cy="${f(r.range(0, h))}" r="${f(r.range(h * 0.04, h * 0.2))}" fill="${r.pick([p.a, p.b, p.c, p.surface])}" opacity="${f(r.range(0.1, 0.4))}"/>`);
    return out.join("");
  },
  // Blocs géométriques (grille)
  tiles(r, p, w, h) {
    const n = 6, tw = w / n, th = h / Math.round(h / tw), out = [`<rect width="${w}" height="${h}" fill="${p.bg}"/>`];
    for (let y = 0; y < h; y += th) for (let x = 0; x < w; x += tw) {
      const col = r.pick([p.a, p.b, p.c, p.soft, p.surface, mix(p.a, p.bg, 0.5)]), t = r.int(0, 3);
      if (t === 0) out.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(tw)}" height="${f(th)}" fill="${col}"/>`);
      else if (t === 1) out.push(`<circle cx="${f(x + tw / 2)}" cy="${f(y + th / 2)}" r="${f(Math.min(tw, th) / 2 - 2)}" fill="${col}"/>`);
      else if (t === 2) out.push(`<path d="M${f(x)} ${f(y + th)} A${f(tw)} ${f(th)} 0 0 1 ${f(x + tw)} ${f(y)} L${f(x + tw)} ${f(y + th)} Z" fill="${col}"/>`);
      else out.push(`<path d="M${f(x)} ${f(y)} L${f(x + tw)} ${f(y)} L${f(x)} ${f(y + th)} Z" fill="${col}"/>`);
    }
    return out.join("");
  },
  // Feuillage
  botanical(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="url(#sky)"/>`];
    for (let i = 0; i < 9; i++) {
      const x = r.range(0, w), y = h + 10, len = r.range(h * 0.45, h * 0.95), lean = r.range(-0.35, 0.35);
      out.push(`<path d="M${f(x)} ${f(y)} Q${f(x + lean * len)} ${f(y - len / 2)} ${f(x + lean * len * 1.4)} ${f(y - len)}" stroke="${mix(p.b, p.deep, 0.3)}" stroke-width="${f(r.range(2, 4))}" fill="none"/>`);
      for (let k = 1; k <= 9; k++) {
        const t = k / 10, lx = x + lean * len * 1.4 * t * t * 1.1, ly = y - len * t, side = k % 2 ? 1 : -1, s = r.range(h * 0.05, h * 0.13);
        out.push(`<path d="M${f(lx)} ${f(ly)} q${f(side * s)} ${f(-s * 0.9)} ${f(side * s * 1.8)} ${f(-s * 0.1)} q${f(-side * s * 0.8)} ${f(s * 0.7)} ${f(-side * s * 1.8)} ${f(s * 0.1)} Z" fill="${r.pick([p.a, p.b, mix(p.a, p.c, 0.35)])}" opacity="${f(r.range(0.7, 0.95))}"/>`);
      }
    }
    return out.join("");
  },
  // Rubans diagonaux
  ribbons(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="url(#sky)"/>`];
    for (let i = 0; i < 7; i++) {
      const y0 = r.range(-h * 0.2, h), th = r.range(h * 0.06, h * 0.22), sl = r.range(-0.5, 0.5) * h;
      out.push(`<path d="M-20 ${f(y0)} C${f(w * 0.3)} ${f(y0 + sl)} ${f(w * 0.7)} ${f(y0 - sl)} ${w + 20} ${f(y0 + sl * 0.4)} L${w + 20} ${f(y0 + sl * 0.4 + th)} C${f(w * 0.7)} ${f(y0 - sl + th)} ${f(w * 0.3)} ${f(y0 + sl + th)} -20 ${f(y0 + th)} Z" fill="${r.pick([p.a, p.b, p.c, p.surface])}" opacity="${f(r.range(0.5, 0.9))}"/>`);
    }
    return out.join("");
  },
  // Trame de points
  halftone(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="${p.bg}"/>`], step = Math.max(16, w / 44), cx = w * r.range(0.3, 0.7), cy = h * r.range(0.3, 0.7);
    for (let y = step / 2; y < h; y += step) for (let x = step / 2; x < w; x += step) {
      const d = Math.hypot(x - cx, y - cy) / Math.hypot(w, h), rad = Math.max(0.5, (1 - d * 1.6) * step * 0.48);
      out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${d < 0.28 ? p.c : d < 0.5 ? p.a : p.b}"/>`);
    }
    return out.join("");
  },
  // Arches d'architecture
  arches(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="url(#sky)"/>`];
    const n = r.int(3, 5), aw = w / (n + 0.6);
    for (let i = 0; i < n; i++) {
      const x = aw * 0.3 + i * aw, top = h * r.range(0.12, 0.3), col = [p.a, p.b, mix(p.a, p.bg, 0.35), p.surface][i % 4];
      out.push(`<path d="M${f(x)} ${h} L${f(x)} ${f(top + aw * 0.45)} A${f(aw * 0.45)} ${f(aw * 0.45)} 0 0 1 ${f(x + aw * 0.9)} ${f(top + aw * 0.45)} L${f(x + aw * 0.9)} ${h} Z" fill="${col}" opacity=".94"/>`);
      out.push(`<path d="M${f(x + aw * 0.18)} ${h} L${f(x + aw * 0.18)} ${f(top + aw * 0.5)} A${f(aw * 0.27)} ${f(aw * 0.27)} 0 0 1 ${f(x + aw * 0.72)} ${f(top + aw * 0.5)} L${f(x + aw * 0.72)} ${h} Z" fill="${p.deep}" opacity=".55"/>`);
    }
    return out.join("");
  },
  // Assiettes et formes gourmandes (vue de dessus)
  plates(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="${mix(p.deep, p.bg, 0.25)}"/>`];
    const n = r.int(2, 4);
    for (let i = 0; i < n; i++) {
      const rad = Math.min(w, h) * r.range(0.18, 0.3), cx = w * ((i + 0.5) / n) + r.range(-w * 0.04, w * 0.04), cy = h * r.range(0.35, 0.65);
      out.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad)}" fill="${p.surface}"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad * 0.78)}" fill="${mix(p.surface, p.bg, 0.5)}"/>`);
      for (let k = 0; k < r.int(5, 9); k++) out.push(`<circle cx="${f(cx + r.range(-rad * 0.5, rad * 0.5))}" cy="${f(cy + r.range(-rad * 0.5, rad * 0.5))}" r="${f(r.range(rad * 0.06, rad * 0.2))}" fill="${r.pick([p.a, p.b, p.c])}"/>`);
    }
    return out.join("");
  },
  // Courbes de niveau
  topo(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="${p.bg}"/>`];
    const cx = w * r.range(0.3, 0.7), cy = h * r.range(0.3, 0.7), wob = r.range(0.05, 0.14), ph = r.range(0, 6);
    for (let i = 1; i <= 16; i++) {
      let d = "";
      for (let a = 0; a <= 64; a++) { const t = (a / 64) * Math.PI * 2, rad = i * Math.min(w, h) * 0.045 * (1 + Math.sin(t * 3 + ph + i * 0.2) * wob + Math.sin(t * 5 + i * 0.3) * wob * 0.6); d += `${a ? "L" : "M"}${f(cx + Math.cos(t) * rad * 1.4)} ${f(cy + Math.sin(t) * rad)} `; }
      out.push(`<path d="${d}Z" fill="none" stroke="${i % 4 === 0 ? p.c : mix(p.a, p.bg, 0.2 + i / 24)}" stroke-width="${i % 4 === 0 ? 2.4 : 1.2}"/>`);
    }
    return out.join("");
  },
  // Rayons
  rays(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="url(#sky)"/>`], cx = w * r.range(0.4, 0.6), cy = h * r.range(0.55, 0.9), n = 28;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = a0 + Math.PI / n, R = Math.hypot(w, h);
      out.push(`<path d="M${f(cx)} ${f(cy)} L${f(cx + Math.cos(a0) * R)} ${f(cy + Math.sin(a0) * R)} L${f(cx + Math.cos(a1) * R)} ${f(cy + Math.sin(a1) * R)} Z" fill="${i % 2 ? p.a : p.b}" opacity="${f(0.16 + (i % 3) * 0.06)}"/>`);
    }
    out.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(h * 0.14)}" fill="${p.c}"/>`);
    return out.join("");
  },
  // Formes organiques
  blobs(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="url(#sky)"/>`];
    for (let i = 0; i < 5; i++) {
      const cx = r.range(0, w), cy = r.range(0, h), rad = Math.min(w, h) * r.range(0.18, 0.38);
      let d = "";
      for (let a = 0; a <= 12; a++) { const t = (a / 12) * Math.PI * 2, rr = rad * r.range(0.72, 1.18); d += `${a ? "L" : "M"}${f(cx + Math.cos(t) * rr)} ${f(cy + Math.sin(t) * rr)} `; }
      out.push(`<path d="${d}Z" fill="${[p.a, p.b, p.c, p.surface, mix(p.a, p.c, 0.5)][i]}" opacity="${f(r.range(0.55, 0.9))}" filter="url(#soft)"/>`);
    }
    return out.join("");
  },
  // Objet (flacon, sac, boîte) posé sur un fond uni
  objects(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="url(#sky)"/>`, `<ellipse cx="${f(w / 2)}" cy="${f(h * 0.86)}" rx="${f(w * 0.34)}" ry="${f(h * 0.045)}" fill="${p.deep}" opacity=".22"/>`];
    const kinds = ["bottle", "box", "bag", "cup"];
    const n = r.int(1, 3);
    for (let i = 0; i < n; i++) {
      const cx = w * ((i + 0.5) / n), k = r.pick(kinds), col = r.pick([p.a, p.b, p.c, p.surface]), s = Math.min(w / n, h) * r.range(0.46, 0.62);
      if (k === "bottle") out.push(`<rect x="${f(cx - s * 0.2)}" y="${f(h * 0.85 - s)}" width="${f(s * 0.4)}" height="${f(s)}" rx="${f(s * 0.1)}" fill="${col}"/><rect x="${f(cx - s * 0.09)}" y="${f(h * 0.85 - s * 1.18)}" width="${f(s * 0.18)}" height="${f(s * 0.2)}" fill="${p.deep}"/><rect x="${f(cx - s * 0.2)}" y="${f(h * 0.85 - s * 0.55)}" width="${f(s * 0.4)}" height="${f(s * 0.18)}" fill="${p.surface}" opacity=".85"/>`);
      else if (k === "box") out.push(`<rect x="${f(cx - s * 0.33)}" y="${f(h * 0.85 - s * 0.7)}" width="${f(s * 0.66)}" height="${f(s * 0.7)}" fill="${col}"/><path d="M${f(cx - s * 0.33)} ${f(h * 0.85 - s * 0.7)} L${f(cx)} ${f(h * 0.85 - s * 0.9)} L${f(cx + s * 0.33)} ${f(h * 0.85 - s * 0.7)} Z" fill="${lighten(col, 0.2)}"/>`);
      else if (k === "bag") out.push(`<path d="M${f(cx - s * 0.3)} ${f(h * 0.85)} L${f(cx - s * 0.25)} ${f(h * 0.85 - s * 0.7)} L${f(cx + s * 0.25)} ${f(h * 0.85 - s * 0.7)} L${f(cx + s * 0.3)} ${f(h * 0.85)} Z" fill="${col}"/><path d="M${f(cx - s * 0.12)} ${f(h * 0.85 - s * 0.7)} Q${f(cx)} ${f(h * 0.85 - s * 1.05)} ${f(cx + s * 0.12)} ${f(h * 0.85 - s * 0.7)}" stroke="${p.deep}" stroke-width="${f(s * 0.03)}" fill="none"/>`);
      else out.push(`<path d="M${f(cx - s * 0.26)} ${f(h * 0.85 - s * 0.5)} L${f(cx - s * 0.2)} ${f(h * 0.85)} L${f(cx + s * 0.2)} ${f(h * 0.85)} L${f(cx + s * 0.26)} ${f(h * 0.85 - s * 0.5)} Z" fill="${col}"/><ellipse cx="${f(cx)}" cy="${f(h * 0.85 - s * 0.5)}" rx="${f(s * 0.26)}" ry="${f(s * 0.06)}" fill="${lighten(col, 0.3)}"/>`);
    }
    return out.join("");
  },
  // Buste abstrait (portrait d'équipe, témoignage)
  person(r, p, w, h) {
    const skin = r.pick(["#f1c9a5", "#d9a074", "#a8704a", "#7b4a2e", "#e8b890"]);
    return `<rect width="${w}" height="${h}" fill="url(#sky)"/><path d="M${f(w * 0.12)} ${h} Q${f(w * 0.12)} ${f(h * 0.62)} ${f(w / 2)} ${f(h * 0.6)} Q${f(w * 0.88)} ${f(h * 0.62)} ${f(w * 0.88)} ${h} Z" fill="${r.pick([p.a, p.b, p.c])}"/><rect x="${f(w * 0.43)}" y="${f(h * 0.5)}" width="${f(w * 0.14)}" height="${f(h * 0.14)}" fill="${skin}"/><ellipse cx="${f(w / 2)}" cy="${f(h * 0.4)}" rx="${f(w * 0.17)}" ry="${f(h * 0.2)}" fill="${skin}"/><path d="M${f(w * 0.33)} ${f(h * 0.38)} Q${f(w / 2)} ${f(h * 0.1)} ${f(w * 0.67)} ${f(h * 0.38)} Q${f(w * 0.62)} ${f(h * 0.2)} ${f(w / 2)} ${f(h * 0.2)} Q${f(w * 0.38)} ${f(h * 0.2)} ${f(w * 0.33)} ${f(h * 0.38)} Z" fill="${r.pick([p.deep, "#2b1b12", "#6b4a2e", "#c8a46a", "#8b8b8b"])}"/>`;
  },
  // Maillage de dégradés (ambiance « photo floue »)
  mesh(r, p, w, h) {
    const out = [`<rect width="${w}" height="${h}" fill="${p.deep}"/>`];
    for (let i = 0; i < 6; i++) out.push(`<ellipse cx="${f(r.range(0, w))}" cy="${f(r.range(0, h))}" rx="${f(w * r.range(0.2, 0.5))}" ry="${f(h * r.range(0.2, 0.5))}" fill="${r.pick([p.a, p.b, p.c, p.surface])}" opacity="${f(r.range(0.4, 0.8))}" filter="url(#soft)"/>`);
    return out.join("");
  },
};
const MOTIF_KEYS = Object.freeze(Object.keys(MOTIFS));

// Emplacements d'image : nom → dimensions. Le nom suit « <emplacement>[-<n>] » ; n varie le dessin (même motif, composition différente).
const SLOTS = Object.freeze({ hero: [1600, 1000], wide: [1600, 700], card: [900, 675], square: [800, 800], portrait: [720, 960], avatar: [400, 400], banner: [1600, 480] });
const SLOT_RE = /^(hero|wide|card|square|portrait|avatar|banner)(?:-([1-9]|1[0-9]|2[0-4]))?$/;

// → { svg, width, height } ou null (emplacement inconnu). motifs : liste de motifs du thème (la photo « personne » est réservée aux avatars et portraits)
function render(slot, tokens, { seed = "kolakisa", motifs = ["dunes"] } = {}) {
  const m = SLOT_RE.exec(String(slot));
  if (!m) return null;
  const [w, h] = SLOTS[m[1]], n = Number(m[2] || 0);
  const r = rng(seedOf(`${seed}|${slot}`));
  const p = paletteOf(tokens);
  const list = motifs.filter((k) => Object.hasOwn(MOTIFS, k) && k !== "person");
  const motif = m[1] === "avatar" || m[1] === "portrait" && n % 2 === 1 ? "person" : (list.length ? list[(n + (m[1] === "hero" ? 0 : 1)) % list.length] : "dunes");
  const sky = [p.dark ? mix(p.bg, p.a, 0.22) : mix(p.bg, p.a, 0.16), p.dark ? p.deep : mix(p.bg, p.c, 0.42)];
  const defs = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient><filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(Math.min(w, h) * 0.018)}"/></filter>${grain("grain", w, h)}</defs>`;
  const body = MOTIFS[motif](r, p, w, h);
  const svg = `<svg ${ns} viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">${defs}${body}<rect width="${w}" height="${h}" filter="url(#grain)"/></svg>`;
  return { svg, width: w, height: h, motif };
}

module.exports = { render, MOTIF_KEYS, SLOTS, SLOT_RE, rng, seedOf, mix, lighten, darken, lum };
