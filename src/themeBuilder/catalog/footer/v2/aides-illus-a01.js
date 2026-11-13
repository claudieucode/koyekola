// Aides d'ILLUSTRATION (agent a01) : familles « Cloud et infrastructure » (ft2-278 à 283) et « Cybersécurité » (ft2-284 à 289).
// Chaque scène est un dessin vectoriel inline UNIQUE (formes seulement : jamais de script, d'événement ni d'image externe), décoratif (aria-hidden), à angles droits.
// Le CSS de la plateforme impose height:auto aux SVG : la hauteur suit la largeur ; les bandes pleine largeur ont une variante étroite pour le mobile.
const { compact } = require("../../kit");
const r1 = (n) => Math.round(n * 10) / 10;
const alea = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
// le widget HTML n'accepte que : svg g path circle rect line polyline polygon ellipse defs linearGradient radialGradient stop (et un jeu d'attributs réduit) : on retire le reste
const san = (x) => x.replace(/<(filter|pattern|clipPath|linearGradient|radialGradient)[\s\S]*?<\/\1>/g, "").replace(/ (filter|clip-path|stroke-dasharray|patternTransform)="[^"]*"/g, "").replace(/ (fill|stroke)-opacity="/g, ' opacity="');
const env = (W, H, defs, body, ratio = "xMidYMid slice") => san(`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="${ratio}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`);
// place une scène de taille locale sw×sh dans W×H (centrée, ou calée à droite)
const placer = (W, H, sw, sh, corps, o = {}) => { const s = Math.min(W / sw, H / sh) * (o.marge || 1); const x = o.droite ? W - sw * s - (o.pad || 0) : (W - sw * s) / 2; const y = (H - sh * s) / 2; return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s * 1000) / 1000})">${corps}</g>`; };
const noeud = (k, svg, st = {}) => k.W("html", { html: svg }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st }));
// bande pleine largeur : variante large (bureau, tablette) et variante étroite (mobile)
const bandeSvg = (k, fn, st = {}) => [
  { ...noeud(k, fn(1440, st.hL || 300), { ...st, hL: undefined, hE: undefined }), hideOn: ["mobile"] },
  { ...noeud(k, fn(420, st.hE || 220), { ...st, hL: undefined, hE: undefined }), hideOn: ["desktop", "tablet"] },
];
// halo SANS dégradé : ellipses translucides empilées (le nettoyeur du widget HTML supprime les dégradés et les filtres)
const halo = (cx, cy, rx, ry, c, n = 9, a = 0.07) => Array.from({ length: n }, (_, i) => `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx * (1 - i / n))}" ry="${r1(ry * (1 - i / n))}" fill="${c}" opacity="${a}"/>`).join("");
const vague = (W, y, amp, long, phase, couleur, op, bas) => { let d = `M0 ${bas}L0 ${y}`; for (let x = 0; x <= W; x += 20) d += `L${x} ${r1(y + amp * Math.sin((x / long) * 6.2832 + phase))}`; return `<path d="${d}L${W} ${bas}Z" fill="${couleur}" fill-opacity="${op}"/>`; };

// ── ft2-278 « Nuage monumental » : grand nuage monumental lumineux + trois baies reliées + vagues ──────────────────────────────────────────────────
const nuage = (W, H) => {
  const defs = `<radialGradient id="n278h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7fe0e6" stop-opacity="0.55"/><stop offset="1" stop-color="#7fe0e6" stop-opacity="0"/></radialGradient><linearGradient id="n278c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6fbfc"/><stop offset="1" stop-color="#5cc8d0"/></linearGradient><filter id="n278f"><feGaussianBlur stdDeviation="14"/></filter>`;
  let sc = `<ellipse cx="350" cy="140" rx="300" ry="120" fill="url(#n278h)" filter="url(#n278f)"/>`;
  sc += `<g fill="url(#n278c)"><circle cx="255" cy="165" r="62"/><circle cx="340" cy="120" r="84"/><circle cx="445" cy="150" r="70"/><circle cx="520" cy="180" r="48"/><rect x="205" y="170" width="365" height="58"/></g>`;
  sc += `<g stroke="#7fe0e6" stroke-width="2" stroke-dasharray="4 6" fill="none"><path d="M280 228V262H150V272"/><path d="M350 228V272"/><path d="M450 228V262H560V272"/></g>`;
  [[110, 0], [310, 1], [520, 2]].forEach(([x, i]) => { sc += `<rect x="${x}" y="272" width="80" height="22" fill="#12333a" stroke="#7fe0e6" stroke-width="2"/><rect x="${x + 8}" y="279" width="8" height="8" fill="${i === 1 ? "#ffffff" : "#7fe0e6"}"/><rect x="${x + 24}" y="281" width="48" height="4" fill="#7fe0e6" fill-opacity="0.5"/>`; });
  const fond = vague(W, H - 52, 10, 260, 0, "#0f4047", 0.6, H) + vague(W, H - 30, 8, 340, 2, "#14565e", 0.9, H) + vague(W, H - 12, 5, 200, 4, "#0b1a1e", 0.55, H);
  return env(W, H, defs, fond + placer(W, H - 4, 700, 300, sc));
};

// ── ft2-279 « Index des services » : pile isométrique de six plaques, gravure d'encre et vermillon ────────────────────────────────────────────────
const plaques = (W, H) => {
  const defs = `<pattern id="p279" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#f6f2ea"/><rect width="2" height="14" fill="#17140f" fill-opacity="0.12"/></pattern>`;
  let sc = "";
  for (let i = 5; i >= 0; i--) {
    const cx = 280, cy = 50 + i * 34, vm = i === 0;
    sc += `<polygon points="${cx - 120},${cy} ${cx},${cy + 30} ${cx},${cy + 48} ${cx - 120},${cy + 18}" fill="${vm ? "#8f2312" : "#17140f"}"/>`;
    sc += `<polygon points="${cx},${cy + 30} ${cx + 120},${cy} ${cx + 120},${cy + 18} ${cx},${cy + 48}" fill="${vm ? "#c8321a" : "#3a352b"}"/>`;
    sc += `<polygon points="${cx},${cy - 30} ${cx + 120},${cy} ${cx},${cy + 30} ${cx - 120},${cy}" fill="${vm ? "#c8321a" : "#f6f2ea"}" stroke="#17140f" stroke-width="2"/>`;
    sc += `<rect x="${cx - 96}" y="${cy + 4}" width="8" height="8" fill="${vm ? "#f6f2ea" : "#c8321a"}" transform="skewY(26) translate(0 ${r1(-(cx - 96) * 0.4877 + 0)})"/>`;
  }
  sc += `<g stroke="#17140f" stroke-width="2" stroke-dasharray="3 6"><line x1="280" y1="12" x2="280" y2="44"/></g><rect x="274" y="2" width="12" height="12" fill="#c8321a"/>`;
  const lignes = [60, 110, 160, 210].map((y) => `<line x1="0" y1="${y}" x2="${W * 0.27}" y2="${y}" stroke="#17140f" stroke-width="2"/><line x1="${W * 0.73}" y1="${y + 20}" x2="${W}" y2="${y + 20}" stroke="#17140f" stroke-width="2"/>`).join("");
  return env(W, H, defs, `<rect width="${W}" height="${H}" fill="url(#p279)"/>` + (W > 800 ? lignes : "") + placer(W, H, 560, 300, sc));
};

// ── ft2-280 « Console de déploiement » : globe filaire vert et arcs de réseau, trame de points ────────────────────────────────────────────────────
const globe = (W, H) => {
  const defs = `<pattern id="g280" width="22" height="22" patternUnits="userSpaceOnUse"><rect x="10" y="10" width="2" height="2" fill="#4ade80" fill-opacity="0.22"/></pattern><radialGradient id="g280r" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#1b3a2a"/><stop offset="1" stop-color="#070b09"/></radialGradient>`;
  const cx = 260, cy = 150, r = 130;
  let sc = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0f1a14" stroke="#4ade80" stroke-width="2"/><g fill="none" stroke="#4ade80" stroke-opacity="0.55" stroke-width="1.2">`;
  [-60, -30, 0, 30, 60].forEach((a) => { const rad = (a * Math.PI) / 180, rx = r * Math.cos(rad); sc += `<ellipse cx="${cx}" cy="${r1(cy - r * Math.sin(rad))}" rx="${r1(rx)}" ry="${r1(rx * 0.2)}"/>`; });
  [0, 30, 60, 90, 120, 150].forEach((a) => { sc += `<ellipse cx="${cx}" cy="${cy}" rx="${r1(r * Math.abs(Math.cos((a * Math.PI) / 180)))}" ry="${r}"/>`; });
  sc += `</g><g fill="none" stroke="#d7f5e0" stroke-width="2" stroke-dasharray="5 5"><path d="M175 120Q260 20 345 105"/><path d="M345 105Q380 200 270 235"/><path d="M175 120Q170 210 270 235"/></g>`;
  [[175, 120], [345, 105], [270, 235], [230, 85]].forEach(([x, y], i) => { sc += `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="${i === 3 ? "#fbbf24" : "#4ade80"}"/>`; });
  sc += `<g fill="#4ade80"><rect x="30" y="140" width="40" height="3"/><rect x="30" y="150" width="24" height="3"/><rect x="450" y="140" width="40" height="3"/><rect x="466" y="150" width="24" height="3"/></g>`;
  return env(W, H, defs, `<rect width="${W}" height="${H}" fill="url(#g280)"/>` + placer(W, H, 520, 300, sc, { marge: 0.96 }));
};

// ── ft2-281 « Damier d'infrastructure » : baie de serveurs noire sur jaune signal (dans la case) ─────────────────────────────────────────────────
const baie = () => {
  const defs = `<pattern id="b281" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="3" fill="#0a0a0a"/></pattern>`;
  let c = `<rect width="400" height="340" fill="#ffd400"/><rect x="70" y="20" width="260" height="300" fill="#0a0a0a"/><rect x="82" y="32" width="236" height="276" fill="#2a2a2a"/>`;
  for (let i = 0; i < 6; i++) { const y = 40 + i * 44, ton = i % 2 ? "#ffffff" : "#ffd400"; c += `<rect x="90" y="${y}" width="220" height="36" fill="#0a0a0a"/><rect x="98" y="${y + 8}" width="14" height="14" fill="${ton}"/><rect x="120" y="${y + 8}" width="14" height="14" fill="${i === 2 ? "#ffd400" : "#555555"}"/><rect x="160" y="${y + 6}" width="140" height="24" fill="url(#b281)"/>`; }
  c += `<g fill="none" stroke="#0a0a0a" stroke-width="5"><path d="M50 320V250H20"/><path d="M350 320V280H385"/></g><rect x="0" y="322" width="400" height="18" fill="#0a0a0a"/>`;
  return env(400, 340, defs, c, "xMidYMid meet");
};

// ── ft2-282 « Tableau de statut » : silhouette d'un centre de données marine aux fenêtres orange, sous un nuage fil de fer ────────────────────────
const centreDonnees = () => {
  const defs = `<linearGradient id="d282" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a6b" stop-opacity="0.35"/><stop offset="1" stop-color="#ff9a6b" stop-opacity="0"/></linearGradient>`;
  let c = `<path d="M70 70a26 26 0 0 1 50-6a32 32 0 0 1 62 8a22 22 0 0 1 0 44H80a22 22 0 0 1-10-46z" fill="none" stroke="#ff9a6b" stroke-width="2.5"/><rect x="0" y="150" width="400" height="30" fill="#ff9a6b" opacity="0.08"/><rect x="0" y="180" width="400" height="30" fill="#ff9a6b" opacity="0.08"/><rect x="0" y="210" width="400" height="30" fill="#ff9a6b" opacity="0.1"/>`;
  const bat = [[10, 120, 70, 120, "#1a4272"], [92, 90, 90, 150, "#235590"], [194, 140, 60, 100, "#1a4272"], [266, 105, 80, 135, "#2d68ab"], [356, 150, 44, 90, "#1a4272"]];
  const r = alea(278);
  bat.forEach(([x, y, w, h, f]) => { c += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`; for (let yy = y + 12; yy < y + h - 14; yy += 20) for (let xx = x + 10; xx < x + w - 10; xx += 18) c += `<rect x="${xx}" y="${yy}" width="8" height="8" fill="${r() > 0.55 ? "#ff9a6b" : "#0d2a4a"}"/>`; });
  c += `<rect x="228" y="64" width="3" height="76" fill="#ff9a6b"/><rect x="223" y="56" width="13" height="13" fill="#ff9a6b"/><rect x="0" y="238" width="400" height="2" fill="#ff9a6b"/>`;
  return env(400, 240, defs, c, "xMidYMax meet");
};

// ── ft2-283 « Chaîne de mise en ligne » : quatre vignettes dessinées (connecter, configurer, déployer, superviser) ────────────────────────────────
const VG = (c) => env(240, 130, "", `<rect width="240" height="130" fill="#f1e1ea"/>` + c, "xMidYMid slice");
const vignettes = [
  () => VG(`<rect x="24" y="40" width="54" height="50" fill="#7a1f5c"/><rect x="162" y="40" width="54" height="50" fill="none" stroke="#2a1020" stroke-width="4"/><rect x="78" y="62" width="84" height="6" fill="#2a1020"/><rect x="100" y="52" width="14" height="26" fill="#2fbf9a"/><rect x="126" y="52" width="14" height="26" fill="#2fbf9a"/><rect x="34" y="52" width="10" height="10" fill="#fbf3f6"/>`),
  () => VG(`<g fill="#2a1020"><rect x="28" y="30" width="184" height="5"/><rect x="28" y="62" width="184" height="5"/><rect x="28" y="94" width="184" height="5"/></g><g fill="#7a1f5c"><rect x="60" y="20" width="18" height="25"/><rect x="150" y="52" width="18" height="25"/><rect x="100" y="84" width="18" height="25"/></g><rect x="28" y="62" width="122" height="5" fill="#2fbf9a"/>`),
  () => VG(`<rect x="40" y="86" width="50" height="22" fill="#2a1020"/><rect x="100" y="86" width="50" height="22" fill="#7a1f5c"/><rect x="160" y="86" width="40" height="22" fill="#2a1020"/><polygon points="120,14 148,50 92,50" fill="#2fbf9a"/><rect x="113" y="50" width="14" height="28" fill="#2fbf9a"/><g stroke="#7a1f5c" stroke-width="3" stroke-dasharray="4 5"><line x1="104" y1="56" x2="104" y2="80"/><line x1="136" y1="56" x2="136" y2="80"/></g>`),
  () => VG(`<rect x="30" y="18" width="180" height="94" fill="#2a1020"/><rect x="38" y="26" width="164" height="78" fill="#fbf3f6"/><polyline points="44,80 76,80 88,48 104,92 120,60 136,60 150,40 164,72 196,72" fill="none" stroke="#7a1f5c" stroke-width="4"/><rect x="144" y="34" width="12" height="12" fill="#2fbf9a"/>`),
];

// ── ft2-284 « Ligne de défense » : bouclier monumental en filets acides + bande de chantier ────────────────────────────────────────────────────────
const bouclier = () => {
  const defs = `<pattern id="s284" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="13" height="26" fill="#c8ff00"/><rect x="13" width="13" height="26" fill="#0a0a0a"/></pattern><clipPath id="c284"><path d="M200 60L330 108V212C330 288 272 340 200 366C128 340 70 288 70 212V108Z"/></clipPath>`;
  const sh = "M200 20L370 80V210C370 310 290 380 200 410C110 380 30 310 30 210V80Z";
  let c = "";
  [[1, 1, 3], [0.86, 0.86, 2], [0.72, 0.72, 1.5]].forEach(([sx, sy, w], i) => { c += `<path d="${sh}" transform="translate(${r1(200 * (1 - sx))} ${r1(215 * (1 - sy))}) scale(${sx} ${sy})" fill="none" stroke="#c8ff00" stroke-opacity="${i ? 0.6 : 1}" stroke-width="${w}"/>`; });
  c += `<g fill="none" stroke="#c8ff00" stroke-width="10" stroke-linejoin="miter"><path d="M90 150L200 196L310 150"/><path d="M90 200L200 246L310 200" opacity="0.7"/><path d="M110 250L200 290L290 250" opacity="0.45"/></g><path d="M200 60L330 108V212C330 288 272 340 200 366C128 340 70 288 70 212V108Z" fill="none" stroke="#0a0a0a" stroke-width="4"/>`;
  c += `<rect x="168" y="160" width="64" height="64" fill="#0a0a0a"/><rect x="192" y="178" width="16" height="16" fill="#c8ff00"/><rect x="196" y="194" width="8" height="22" fill="#c8ff00"/>`;
  return env(400, 420, defs, c, "xMidYMid meet");
};
const chantier = (W, H) => env(W, H, `<pattern id="h284" width="${H * 2}" height="${H * 2}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${H}" height="${H * 2}" fill="#0a0a0a"/><rect x="${H}" width="${H}" height="${H * 2}" fill="#c8ff00"/></pattern>`, `<rect width="${W}" height="${H}" fill="url(#h284)"/>`);

// ── ft2-285 « Alerte rouge » : radar à balayage, ondes blanches sur rouge sirène ─────────────────────────────────────────────────────────────────────
const radar = () => {
  const defs = `<linearGradient id="r285" x1="0" y1="1" x2="0.8" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.55"/></linearGradient><radialGradient id="r285h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff6b73" stop-opacity="0.7"/><stop offset="1" stop-color="#ff6b73" stop-opacity="0"/></radialGradient>`;
  let c = halo(210, 210, 208, 208, "#ff6b73", 8, 0.06);
  [190, 140, 90, 40].forEach((r, i) => { c += `<circle cx="210" cy="210" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="${i ? 0.7 : 1}" stroke-width="${i ? 1.5 : 3}"/>`; });
  c += `<g stroke="#ffffff" stroke-opacity="0.7" stroke-width="1.5"><line x1="10" y1="210" x2="410" y2="210"/><line x1="210" y1="10" x2="210" y2="410"/></g><path d="M210 210L210 20A190 190 0 0 1 345 75Z" fill="#ffffff" opacity="0.28"/><line x1="210" y1="210" x2="210" y2="20" stroke="#ffffff" stroke-width="3"/>`;
  for (let i = 0; i < 36; i++) { const a = (i * 10 * Math.PI) / 180, l = i % 3 ? 8 : 16; c += `<line x1="${r1(210 + 190 * Math.sin(a))}" y1="${r1(210 - 190 * Math.cos(a))}" x2="${r1(210 + (190 + l) * Math.sin(a))}" y2="${r1(210 - (190 + l) * Math.cos(a))}" stroke="#ffffff" stroke-width="2"/>`; }
  [[290, 120, 14], [150, 260, 10], [250, 290, 8]].forEach(([x, y, s]) => { c += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#ffffff"/>`; });
  return env(420, 420, defs, c, "xMidYMid meet");
};

// ── ft2-286 « Salle des opérations » : maillage de nœuds cyan sur grille, dans la grande case ────────────────────────────────────────────────────
const maillage = () => {
  const defs = `<pattern id="m286" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#38d5e8" stroke-opacity="0.16" stroke-width="1"/></pattern><radialGradient id="m286h" cx="62%" cy="50%" r="55%"><stop offset="0" stop-color="#38d5e8" stop-opacity="0.35"/><stop offset="1" stop-color="#38d5e8" stop-opacity="0"/></radialGradient>`;
  const r = alea(286), pts = [];
  for (let i = 0; i < 26; i++) pts.push([r1(24 + (i % 13) * 46 + r() * 22), r1(24 + Math.floor(i / 13) * 100 + r() * 50)]);
  let c = `<rect width="640" height="200" fill="#10173a"/>${halo(400, 100, 260, 110, "#38d5e8", 7, 0.05)}<g stroke="#38d5e8" stroke-width="1.3" stroke-opacity="0.65">`;
  pts.forEach((p, i) => pts.forEach((q, j) => { if (j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 92) c += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`; }));
  c += `</g>`;
  pts.forEach(([x, y], i) => { const g = i % 7 === 3; c += `<rect x="${x - (g ? 7 : 4)}" y="${y - (g ? 7 : 4)}" width="${g ? 14 : 8}" height="${g ? 14 : 8}" fill="${g ? "#ffffff" : "#38d5e8"}"/>`; });
  return env(640, 200, defs, c, "xMidYMid slice");
};

// ── ft2-287 « Cabinet de sécurité » : sceau guilloché, bouclier et clé, marine et bordeaux ─────────────────────────────────────────────────────────
const sceau = () => {
  let c = `<circle cx="110" cy="110" r="106" fill="#f5f0e6" stroke="#1a2540" stroke-width="3"/><circle cx="110" cy="110" r="99" fill="none" stroke="#8b1a1a" stroke-width="1.2"/>`;
  for (let i = 0; i < 24; i++) c += `<ellipse cx="110" cy="110" rx="92" ry="30" transform="rotate(${i * 7.5} 110 110)" fill="none" stroke="${i % 2 ? "#8b1a1a" : "#1a2540"}" stroke-width="0.9"/>`;
  c += `<circle cx="110" cy="110" r="56" fill="#f5f0e6" stroke="#1a2540" stroke-width="3"/><path d="M110 70L146 84V112C146 134 130 148 110 156C90 148 74 134 74 112V84Z" fill="#1a2540"/><path d="M110 78L138 89V111C138 128 126 139 110 146C94 139 82 128 82 111V89Z" fill="none" stroke="#f5f0e6" stroke-width="2"/><rect x="100" y="98" width="20" height="20" fill="#8b1a1a"/><rect x="107" y="116" width="6" height="16" fill="#8b1a1a"/>`;
  return env(220, 220, "", c, "xMidYMid meet");
};

// ── ft2-288 « Veille permanente » : oscilloscope, tracé ambre lumineux sur grille (bande ondulée) ──────────────────────────────────────────────────
const oscillo = (W, H) => {
  const defs = `<pattern id="o288" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1"/></pattern><linearGradient id="o288f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb000" stop-opacity="0.32"/><stop offset="1" stop-color="#ffb000" stop-opacity="0"/></linearGradient><filter id="o288b"><feGaussianBlur stdDeviation="5"/></filter>`;
  const mid = H * 0.58, pas = W > 800 ? 360 : 210, pts = [];
  for (let x = 0; x <= W; x += 6) { const m = (x % pas) / pas; let y = mid + Math.sin(x / 38) * 5; if (m > 0.46 && m < 0.5) y = mid + (m - 0.46) * 1100 * 0.18; else if (m >= 0.5 && m < 0.56) y = mid - Math.sin(((m - 0.5) / 0.06) * Math.PI) * H * 0.44; else if (m >= 0.56 && m < 0.6) y = mid + 10; pts.push([x, r1(y)]); }
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("");
  return env(W, H, defs, `<rect width="${W}" height="${H}" fill="#0b0d10"/><rect width="${W}" height="${H}" fill="url(#o288)"/><line x1="0" y1="${mid}" x2="${W}" y2="${mid}" stroke="#ffffff" stroke-opacity="0.14" stroke-dasharray="6 8"/><path d="${d}L${W} ${H}L0 ${H}Z" fill="#ffb000" opacity="0.14"/><path d="${d}" fill="none" stroke="#ffb000" stroke-width="6" stroke-opacity="0.7" filter="url(#o288b)"/><path d="${d}" fill="none" stroke="#ffc940" stroke-width="2.5"/><rect x="${W - 30}" y="${mid - 6}" width="12" height="12" fill="#ffffff"/>`);
};

// ── ft2-289 « Paliers de confinement » : cellules emboîtées en gradins, acier et orange ──────────────────────────────────────────────────────────
const cellules = (W, H) => {
  const defs = `<pattern id="e289" width="18" height="18" patternUnits="userSpaceOnUse"><rect x="8" y="8" width="2" height="2" fill="#8fa9c0" fill-opacity="0.35"/></pattern>`;
  let c = `<rect width="${W}" height="${H}" fill="#14202c"/><rect width="${W}" height="${H}" fill="url(#e289)"/>`;
  const n = W > 800 ? 6 : 4, cols = ["#1d3144", "#27415a", "#34546f", "#47708f", "#6f93b0", "#a63d00"], unit = (W - 80) / n;
  for (let i = 0; i < n; i++) { const h = (H - 40) * (1 - i * (0.7 / n)), x = 40 + i * unit; c += `<rect x="${r1(x)}" y="${r1(H - 20 - h)}" width="${r1(unit - 10)}" height="${r1(h)}" fill="${cols[i % 6]}" ${i === n - 1 ? 'stroke="#ff8a3d" stroke-width="3"' : ""}/><rect x="${r1(x + 12)}" y="${r1(H - 20 - h + 12)}" width="${r1(unit - 34)}" height="${r1(h - 24)}" fill="none" stroke="${i === n - 1 ? "#ffd2b0" : "#ffffff"}" stroke-opacity="${i === n - 1 ? 0.9 : 0.25}" stroke-width="2" stroke-dasharray="${i === n - 1 ? "0" : "6 6"}"/>`; }
  c += `<rect x="40" y="${H - 20}" width="${W - 80}" height="4" fill="#ff8a3d"/>`;
  return env(W, H, defs, c);
};

// ═══ Refonte « captures » : (04) nom monumental fondu dans un halo lumineux ; (05/06) quatre colonnes avec rangée de vignettes dessinées ═══════════
const fam = (f) => String(f || "sans-serif").replace(/"/g, "'");
// motSvg : halo lumineux + NOM géant dessiné en traits épais à angles droits (le widget n'accepte ni texte SVG ni flou) ; trait en dégradé qui naît du fond et devient vif ;
// le « flou » lumineux est obtenu par des couches de traits plus larges et très transparentes + un halo radial
const LETTRES = { A: ["M8 92V8H52V92M8 50H52", 60], C: ["M52 8H8V92H52", 60], D: ["M8 8H34L52 26V74L34 92H8Z", 60], E: ["M52 8H8V92H52M8 50H44", 60], G: ["M52 8H8V92H52V54H30", 60], I: ["M20 8V92", 40], L: ["M8 8V92H52", 60], M: ["M8 92V8L30 50L52 8V92", 60], O: ["M8 8H52V92H8Z", 60], P: ["M8 92V8H52V50H8", 60], R: ["M8 92V8H52V50H8M26 50L52 92", 60], T: ["M8 8H52M30 8V92", 60], U: ["M8 8V92H52V8", 60], V: ["M8 8L30 92L52 8", 60] };
function motSvg(W, H, o) {
  const mots = String(o.nom).toUpperCase().split(""), gap = 26, t = o.trait || 17;
  const total = mots.reduce((a, c) => a + LETTRES[c][1], 0) + gap * (mots.length - 1);
  const s = Math.min((W * (o.large || 0.94)) / total, (H * 0.9) / 100), x0 = (W - total * s) / 2, y0 = H - 100 * s - H * 0.05;
  let x = 0, ch = "";
  for (const c of mots) { ch += `<path d="${LETTRES[c][0]}" transform="translate(${r1(x0 + x * s)} ${r1(y0)}) scale(${r1(s * 1000) / 1000})" @@/>`; x += LETTRES[c][1] + gap; }
  const couche = (w, c, op) => ch.replace(/@@/g, `fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="miter" opacity="${op}"`);
  // fondu : lettres vives, puis voile de la couleur du fond en bandes de plus en plus transparentes vers le bas
  let voile = ""; const nb = 12, zone = 100 * s * 0.75;
  for (let i = 0; i < nb; i++) voile += `<rect x="0" y="${r1(y0 - 8 * s)}" width="${W}" height="${r1(zone * (1 - i / nb) + 8 * s)}" fill="${o.haut}" opacity="0.14"/>`;
  const corps = halo(W / 2, H * 0.98, W * 0.5, H * 0.75, o.halo, 10, 0.075) + (o.scene ? o.scene(W, H) : "") + couche(t + 20, o.bas, 0.07) + couche(t + 9, o.bas, 0.14) + couche(t, o.bas, 1) + voile;
  return env(W, H, "", corps, "xMidYMax meet");
}
// un seul dessin (sans variante mobile) : la hauteur suit la largeur ; la toile s'adapte au nombre de lettres
const motBande = (k, o) => { const n = String(o.nom).length, total = String(o.nom).toUpperCase().split("").reduce((a, c) => a + LETTRES[c][1], 0) + 26 * (n - 1), W = 720, H = Math.ceil(((W * 0.94) / total) * 100 / 0.9 / 0.95); return [noeud(k, motSvg(W, H, { ...o, u: o.u }), { marginTop: o.mt })]; };

// ── Vignettes carrées 160×160 : 8 peintres, chacun donne 4 variantes (i = 0..3) ; palette P = { bg, a, b, c, d } ─────────────────────────────────
const sv = (id, P, corps, defs = "") => san(`<svg viewBox="0 0 160 160" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs><rect width="160" height="160" fill="${P.bg}"/>${corps}</svg>`);
const PEINTRES = {
  dunes: (i, P, id) => sv(id, P, `<circle cx="${40 + i * 26}" cy="${52 + (i % 2) * 14}" r="${20 + (i % 3) * 4}" fill="${P.d}"/>` + vague(160, 96 - i * 6, 7 + i, 70 + i * 12, i, P.a, 1, 160) + vague(160, 116 - i * 4, 6, 54, i + 2, P.b, 1, 160) + vague(160, 138, 4, 40, i, P.c, 1, 160)),
  ville: (i, P, id) => { const r = alea(100 + i + id.length); let c = `<rect x="${24 + i * 30}" y="20" width="14" height="14" fill="${P.d}"/>`; for (let b = 0; b < 7; b++) { const h = 40 + r() * 70, x = 6 + b * 22; c += `<rect x="${x}" y="${r1(150 - h)}" width="20" height="${r1(h)}" fill="${b % 2 ? P.a : P.b}"/>`; for (let y = 150 - h + 8; y < 142; y += 14) if (r() > 0.45) c += `<rect x="${x + 6}" y="${r1(y)}" width="6" height="6" fill="${P.d}"/>`; } return sv(id, P, c + `<rect y="150" width="160" height="10" fill="${P.c}"/>`); },
  baie: (i, P, id) => { let c = `<rect x="34" y="14" width="92" height="136" fill="${P.a}"/>`; for (let n = 0; n < 5; n++) c += `<rect x="40" y="${20 + n * 26}" width="80" height="20" fill="${P.b}"/><rect x="46" y="${26 + n * 26}" width="8" height="8" fill="${(n + i) % 3 === 0 ? P.d : P.c}"/><rect x="${64 + ((n * 7 + i * 13) % 20)}" y="${28 + n * 26}" width="${30 - (n % 3) * 6}" height="4" fill="${P.c}"/>`; return sv(id, P, c + `<rect x="14" y="150" width="132" height="6" fill="${P.d}"/>`); },
  anneaux: (i, P, id) => { let c = ""; for (let n = 0; n < 5; n++) c += `<circle cx="80" cy="80" r="${66 - n * 12}" fill="none" stroke="${n % 2 ? P.b : P.a}" stroke-width="${n === i ? 6 : 2}" ${n === (i + 2) % 5 ? 'stroke-dasharray="5 6"' : ""}/>`; return sv(id, P, c + `<rect x="${70 - i * 2}" y="70" width="${20 + i * 4}" height="${20 + i * 4}" fill="${P.d}" transform="rotate(${i * 15} 80 80)"/>`); },
  points: (i, P, id) => { let c = ""; for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) { const d = Math.hypot(x - 4.5 - (i - 1.5), y - 4.5 + (i % 2)), s = Math.max(0, 6 - d * 1.2); if (s > 0.6) c += `<rect x="${r1(15 + x * 14 - s / 2)}" y="${r1(15 + y * 14 - s / 2)}" width="${r1(s)}" height="${r1(s)}" fill="${s > 4 ? P.d : P.a}"/>`; } return sv(id, P, c + `<rect x="${20 + i * 30}" y="${24 + ((i * 37) % 90)}" width="12" height="12" fill="${P.c}"/>`); },
  trace: (i, P, id) => { let g = ""; for (let n = 1; n < 8; n++) g += `<path d="M${n * 20} 0V160M0 ${n * 20}H160" stroke="${P.b}" stroke-opacity="0.3"/>`; let p = ""; for (let x = 0; x <= 160; x += 4) { const y = i === 0 ? 80 + Math.sin(x / 9) * 40 : i === 1 ? (x % 40 < 20 ? 110 : 50) : i === 2 ? 130 - (x % 50) * 1.6 : 80 - ((x * 7) % 31) + (x > 80 ? 30 : 0); p += `${x ? "L" : "M"}${x} ${r1(y)}`; } return sv(id, P, g + `<path d="${p}" fill="none" stroke="${P.a}" stroke-width="4"/><rect x="132" y="16" width="14" height="14" fill="${P.d}"/>`); },
  blocs: (i, P, id) => { let c = ""; for (let n = 0; n < 4; n++) { const h = 30 + ((n + i) % 4) * 26; c += `<rect x="${14 + n * 36}" y="${150 - h}" width="30" height="${h}" fill="${[P.a, P.b, P.c, P.d][(n + i) % 4]}"/>`; } return sv(id, P, c + `<rect x="10" y="150" width="140" height="4" fill="${P.d}"/>`); },
  filaires: (i, P, id) => { const t = `fill="none" stroke="${P.a}" stroke-width="3"`; const f = [`<polygon points="80,24 128,50 128,106 80,132 32,106 32,50" ${t}/><path d="M80 78L32 50M80 78L128 50M80 78V132" ${t}/>`, `<circle cx="80" cy="80" r="52" ${t}/><ellipse cx="80" cy="80" rx="52" ry="16" ${t}/><ellipse cx="80" cy="80" rx="22" ry="52" ${t}/>`, `<polygon points="80,22 134,126 26,126" ${t}/><path d="M80 22L80 126M80 22L26 126M134 126L80 96" ${t}/>`, `<ellipse cx="80" cy="44" rx="46" ry="14" ${t}/><path d="M34 44V112M126 44V112" ${t}/><path d="M34 112A46 14 0 0 0 126 112" ${t}/>`][i]; return sv(id, P, f + `<rect x="${24 + i * 34}" y="${140 - (i % 2) * 6}" width="12" height="12" fill="${P.d}"/>`); },
};
const VIGNETTES = (k, peintre, P, o = {}) => [0, 1, 2, 3].map((i) => k.W("html", { html: PEINTRES[peintre](i, P, peintre + i) }, compact({ width: o.t || "64px", flexShrink: 0, display: "block", fontSize: "0px", lineHeight: 0.8, borderStyle: "solid", borderWidth: o.bord ? "2px" : undefined, borderColor: o.bord })));

module.exports = { halo, noeud, bandeSvg, nuage, plaques, globe, baie, centreDonnees, vignettes, bouclier, chantier, radar, maillage, sceau, oscillo, cellules, motSvg, motBande, PEINTRES, VIGNETTES, vague, env, placer, alea, r1 };
