// Aides « illustration » des familles Fitness/bien-être et Outdoor/aventure (pieds inspirés des captures 34, 35 et 36). Angles droits CSS partout ; dessins en SVG inline (widget html).
// Deux mises en page : piedsVagues (captures 34/35 : marque dessinée + phrase + pastilles de réseaux, colonnes à titre ondulé, chevrons, journal, contact à icônes, bande ondulée en bas)
// et piedsMonument (capture 36 : mot monumental, équerres de coin, ombres portées, grande marque géométrique au centre, blocs adresse / réseaux, barre de mentions).
const { G: GK, Moteur } = require("./kit-v2");
const { compact } = require("../../kit");

const DOUX = 360;
const PH = ["48px", "32px", "20px"];
const RESEAUX = [{ network: "facebook", url: "https://www.facebook.com/" }, { network: "instagram", url: "https://www.instagram.com/" }, { network: "youtube", url: "https://www.youtube.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }];

// ── Aides de composition ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(html.startsWith("<") ? html : `<p>${html}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.largeur, textAlign: o.align, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, compact({ color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align })));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: "stack" }, compact({ color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align })));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: o.h || "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
const bandePleine = (G, k, enfants, o = {}) => G.bande(k, enfants, { padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", gap: "0px", aligne: "stretch", ...o });
const listeLiens = (k, liste, o = {}) => liste.map(([t, u]) => lien(k, (o.puce ? `${o.puce}\u00a0\u00a0` : "") + t, u, { taille: o.taille || 16, poids: o.poids || "500", couleur: o.couleur, police: o.police, survol: o.survol || { color: k.S.accent, transform: { x: 4 } }, focus: o.focus, h: o.h }));

// pastilles de réseaux (widget social) : angles droits, couleurs du modèle
function sociaux(k, o, st = {}) {
  const r = k.social(RESEAUX, { gap: "10px", ...st }); r.props.shape = "square"; r.props.size = "48";
  Moteur.finishNode(k.S, r);
  Moteur.mergePart(r, "link", { styles: { desktop: { color: o.iconeCouleur, backgroundColor: o.iconeFond, borderRadius: "0px" } } });
  return r;
}
// ── SVG ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const svg = (w, h, corps, defs = "") => `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${defs ? `<defs>${defs}</defs>` : ""}${corps}</svg>`;
const H = (k, s, st = {}) => k.W("html", { html: s }, compact({ display: "block", fontSize: "0px", lineHeight: 1, width: "100%", ...st }));
// variante bureau / mobile du même dessin : deux widgets, un seul visible (identifiants distincts)
const H2 = (k, gen, w1, w2, st = {}) => [{ ...H(k, gen(...w1, "d"), st), hideOn: ["mobile"] }, { ...H(k, gen(...w2, "m"), st), hideOn: ["desktop", "tablet"] }];
const r1 = (n) => Math.round(n * 10) / 10;
const alea = (g) => { let a = g >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// bande ondulée (3 couches), la dernière = couleur de la bande de mentions
function vagues(W, h, c, seed = 1, crete = 0) {
  const R = alea(seed), pas = Math.max(W / 90, 4);
  const couches = c.map((col, i) => {
    const base = h * (0.3 + 0.22 * i), amp = h * (0.16 - 0.03 * i), ph = R() * 6, fr = (crete ? 2.2 : 1.1) + i * 0.7 + R() * 0.5 + (W < 600 ? 0.9 : 0) * 1;
    let d = `M0 ${h}`;
    for (let x = 0; x <= W + 0.1; x += pas) {
      const y = crete ? base + amp * 1.4 * (1 - Math.abs(Math.sin((x / W) * Math.PI * fr * 2 + ph))) * 1.4 - amp : base + amp * Math.sin((x / W) * Math.PI * 2 * fr + ph);
      d += ` L${r1(x)} ${r1(y)}`;
    }
    return `<path d="${d} L${W} ${h} Z" fill="${col}"${i < c.length - 1 ? ' opacity="0.9"' : ""}/>`;
  }).join("");
  return svg(W, h, couches);
}
const halo = (cx, cy, r, col, op = 0.14) => [1, 0.8, 0.6, 0.4].map((f) => `<circle cx="${cx}" cy="${cy}" r="${r1(r * f)}" fill="${col}" opacity="${op}"/>`).join("");
const onde = (col, w = 44) => svg(w, 8, `<path d="M0 4 q3 -4 6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0" fill="none" stroke="${col}" stroke-width="1.6"/>`);
const equerre = (col, haut, gauche) => svg(40, 40, `<path d="${gauche ? "M3.5 40 V3.5 H40" : "M36.5 40 V3.5 H0"}" fill="none" stroke="${col}" stroke-width="7"/>`);
// ligne pointillée par petits carrés (le nettoyeur du HTML retire stroke-dasharray)
const pointille = (pts, t, col) => pts.map(([x, y]) => `<rect x="${r1(x - t / 2)}" y="${r1(y - t / 2)}" width="${t}" height="${t}" fill="${col}"/>`).join("");
const suite = (x0, y0, x1, y1, n) => Array.from({ length: n + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
// ombres portées floues sous un mot monumental (capture 36)
function ombres(W, h, col, op, u, n = 6) {
  const els = Array.from({ length: n }, (_, i) => [1, 0.75, 0.5].map((f, q) => `<ellipse cx="${r1(((i + 0.5) / n) * W)}" cy="${r1(h * 0.2)}" rx="${r1((W / n / 2.3) * f)}" ry="${r1(h * 0.3 * f)}" fill="${col}" opacity="${r1(op * (0.35 + q * 0.2))}"/>`).join("")).join("");
  return svg(W, h, els);
}

// ── Marques dessinées (une par modèle) ───────────────────────────────────────────────────────────────────────────────────────────────────────
const dessins = {
  // 398 : lotus à cinq pétales sur un soleil bas et des vagues d'eau
  lotus: (c, u = "d") => svg(240, 200, `${halo(120, 92, 74, c.halo, 0.3)}<path d="M120 168 C86 150 82 106 120 62 C158 106 154 150 120 168Z" fill="${c.p1}"/><path d="M120 168 C70 160 46 126 52 84 C96 96 118 126 120 168Z" fill="${c.p2}"/><path d="M120 168 C170 160 194 126 188 84 C144 96 122 126 120 168Z" fill="${c.p2}"/><path d="M120 168 C62 172 22 148 14 112 C60 112 100 132 120 168Z" fill="${c.p3}"/><path d="M120 168 C178 172 218 148 226 112 C180 112 140 132 120 168Z" fill="${c.p3}"/><path d="M20 184 q25 -10 50 0 t50 0 t50 0 t50 0" fill="none" stroke="${c.eau}" stroke-width="3"/><path d="M50 196 q20 -8 40 0 t40 0 t40 0" fill="none" stroke="${c.eau}" stroke-width="3" opacity="0.6"/>`),
  // 399 : haltère sur parallélogrammes (marque monumentale) + carré
  haltere: (c, u = "d") => svg(360, 200, `<polygon points="70,40 130,40 100,160 40,160" fill="${c.p1}"/><polygon points="130,60 170,60 150,140 110,140" fill="${c.p1}" opacity="0.75"/><rect x="170" y="94" width="110" height="12" fill="${c.p1}"/><polygon points="230,60 270,60 250,140 210,140" fill="${c.p1}" opacity="0.75"/><polygon points="270,40 330,40 300,160 240,160" fill="${c.p1}"/><rect x="302" y="132" width="44" height="44" fill="${c.p2}"/>`),
  // 400 : anneaux de pilates et ballon, cercles qui se recouvrent
  anneaux: (c, u = "d") => svg(260, 200, `<circle cx="96" cy="100" r="76" fill="none" stroke="${c.p1}" stroke-width="16"/><circle cx="164" cy="100" r="76" fill="none" stroke="${c.p2}" stroke-width="16"/><path d="M130 36 A76 76 0 0 1 130 164 A76 76 0 0 1 130 36Z" fill="${c.p3}" opacity="0.85"/><circle cx="130" cy="100" r="22" fill="${c.p4}"/>`),
  // 401 : quatre vignettes d'aliments (pomme, avocat, citron, carotte)
  vignettes: (c, u = "d") => svg(360, 180, `<rect x="0" y="0" width="84" height="84" fill="${c.f1}"/><circle cx="42" cy="48" r="24" fill="${c.o1}"/><path d="M42 24 q2 -12 14 -14" fill="none" stroke="${c.v}" stroke-width="4"/><rect x="92" y="0" width="84" height="84" fill="${c.f2}"/><ellipse cx="134" cy="44" rx="20" ry="30" fill="${c.v}"/><ellipse cx="134" cy="50" rx="9" ry="12" fill="${c.o2}"/><rect x="184" y="0" width="84" height="84" fill="${c.f3}"/><circle cx="226" cy="42" r="30" fill="${c.o3}"/><path d="M226 42 V12 M226 42 L252 27 M226 42 L252 57 M226 42 V72 M226 42 L200 57 M226 42 L200 27" stroke="${c.f3}" stroke-width="3"/><rect x="276" y="0" width="84" height="84" fill="${c.f4}"/><polygon points="296,70 342,26 346,34" fill="${c.o4}"/><path d="M340 24 l8 -12 M346 28 l12 -6" stroke="${c.v}" stroke-width="4"/><rect x="0" y="96" width="360" height="84" fill="${c.f1}" opacity="0.35"/><path d="M0 150 q30 -40 60 0 t60 0 t60 0 t60 0 t60 0 t60 0" fill="none" stroke="${c.o1}" stroke-width="4"/><circle cx="60" cy="126" r="8" fill="${c.o3}"/><circle cx="180" cy="126" r="8" fill="${c.v}"/><circle cx="300" cy="126" r="8" fill="${c.o1}"/>`),
  // 402 : halo lumineux, pierres empilées, vapeur et rides
  pierres: (c, u = "d") => svg(300, 240, `${halo(150, 110, 108, c.halo, 0.2)}<ellipse cx="150" cy="190" rx="66" ry="20" fill="${c.p1}"/><ellipse cx="150" cy="156" rx="48" ry="17" fill="${c.p2}"/><ellipse cx="150" cy="126" rx="32" ry="14" fill="${c.p3}"/><ellipse cx="150" cy="102" rx="19" ry="11" fill="${c.p1}"/><path d="M60 214 q45 -14 90 0 t90 0" fill="none" stroke="${c.eau}" stroke-width="3"/><path d="M30 228 q60 -14 120 0 t120 0" fill="none" stroke="${c.eau}" stroke-width="3" opacity="0.55"/><path d="M130 82 q-14 -20 0 -38 t0 -34 M170 82 q-14 -20 0 -38 t0 -34" fill="none" stroke="${c.vap}" stroke-width="3" opacity="0.7"/>`),
  // 403 : gant de boxe sur un éclat de rayons
  gant: (c, u = "d") => { const R = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<polygon points="150,150 ${r1(150 + 150 * Math.cos(a - 0.07))},${r1(150 + 150 * Math.sin(a - 0.07))} ${r1(150 + 150 * Math.cos(a + 0.07))},${r1(150 + 150 * Math.sin(a + 0.07))}" fill="${c.ray}" opacity="0.35"/>`; }).join(""); return svg(300, 300, `${R}<path d="M92 168 C86 108 120 70 168 74 C214 78 232 116 216 160 L214 206 L110 214Z" fill="${c.p1}"/><path d="M110 214 L214 206 L216 250 L112 258Z" fill="${c.p2}"/><path d="M128 110 C150 96 188 100 200 124" fill="none" stroke="${c.p3}" stroke-width="7"/><path d="M92 168 C70 160 64 190 84 202 L110 206Z" fill="${c.p1}"/><rect x="116" y="226" width="96" height="8" fill="${c.p3}"/>`); },
  // 404 : écusson de montagne en couches, soleil ocre (logo à colonne de gauche)
  massif: (c, u = "d") => svg(260, 220, `<circle cx="130" cy="110" r="102" fill="${c.f}"/><circle cx="168" cy="72" r="22" fill="${c.sol}"/><polygon points="28,170 92,76 130,126 170,60 232,170" fill="${c.m1}"/><polygon points="92,76 106,98 92,92 80,102" fill="${c.n}"/><polygon points="170,60 184,84 170,78 156,90" fill="${c.n}"/><polygon points="20,176 74,116 128,176" fill="${c.m2}"/><polygon points="100,176 160,110 240,176" fill="${c.m2}"/><path d="M18 180 H242 V196 H18Z" fill="${c.m3}"/><polygon points="112,176 130,150 148,176" fill="${c.m3}"/>${pointille([[130,172],[126,164],[124,156],[128,148],[132,140],[130,132]], 4, c.sol)}`),
  // 405 : sommet géométrique, drapeau carré (marque monumentale)
  sommet: (c, u = "d") => svg(360, 200, `<polygon points="30,170 150,30 200,92 250,50 330,170" fill="${c.p1}"/><polygon points="150,30 178,64 150,56 124,72" fill="${c.n}"/><polygon points="250,50 268,76 250,70 234,80" fill="${c.n}"/><polygon points="120,170 190,90 260,170" fill="${c.p2}"/><rect x="150" y="6" width="3" height="40" fill="${c.p1}"/><rect x="153" y="6" width="26" height="18" fill="${c.p3}"/><path d="M40 184 H322" stroke="${c.p1}" stroke-width="3"/>`),
  // 406 : tente, feu de camp, lune et étoiles
  camp: (c, u = "d") => svg(260, 220, `<circle cx="130" cy="110" r="102" fill="${c.f}"/><circle cx="190" cy="56" r="22" fill="${c.lune}"/><circle cx="200" cy="50" r="19" fill="${c.f}"/><path d="M40 60 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3Z M80 38 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2Z" fill="${c.lune}"/><polygon points="40,176 110,76 180,176" fill="${c.t1}"/><polygon points="110,76 140,176 110,176" fill="${c.t2}"/><polygon points="95,176 110,134 125,176" fill="${c.f}"/><path d="M196 176 q-14 -20 0 -38 q6 14 14 6 q10 12 0 32Z" fill="${c.feu}"/><path d="M200 176 q-6 -12 0 -22 q8 8 4 22Z" fill="${c.lune}"/><rect x="26" y="176" width="190" height="8" fill="${c.sol}"/>`),
  // 407 : sceau des guides (cercle à filets, sommets, piolets croisés, lauriers)
  sceau: (c, u = "d") => svg(240, 240, `<circle cx="120" cy="120" r="112" fill="none" stroke="${c.p1}" stroke-width="5"/><circle cx="120" cy="120" r="100" fill="none" stroke="${c.p1}" stroke-width="1.5"/><circle cx="120" cy="120" r="70" fill="${c.f}"/><polygon points="62,150 100,84 120,112 142,70 180,150" fill="${c.p1}"/><polygon points="142,70 152,88 142,84 134,92" fill="${c.f}"/><path d="M70 188 L170 138 M170 188 L70 138" stroke="${c.p2}" stroke-width="6"/><path d="M62 134 l-14 -6 M178 134 l14 -6" stroke="${c.p2}" stroke-width="6"/>${pointille([[40,150],[36,132],[38,114],[44,98],[54,82],[66,68],[80,56],[200,150],[204,132],[202,114],[196,98],[186,82],[174,68],[160,56]], 5, c.p2)}<circle cx="120" cy="20" r="6" fill="${c.p2}"/><circle cx="120" cy="220" r="6" fill="${c.p2}"/>`),
  // 408 : carte topographique : courbes de niveau, tracé GPS et repère
  carte: (c, u = "d") => { const R = alea(408); const lignes = Array.from({ length: 9 }, (_, i) => { const rx = 26 + i * 15, ry = 16 + i * 9, p = Array.from({ length: 28 }, (_, j) => { const a = (j / 28) * Math.PI * 2, b = 1 + 0.16 * Math.sin(a * 3 + i) + 0.1 * Math.sin(a * 5 + R() * 0.4); return `${r1(150 + rx * 1.55 * b * Math.cos(a))},${r1(105 + ry * 1.5 * b * Math.sin(a))}`; }); return `<polygon points="${p.join(" ")}" fill="none" stroke="${c.l}" opacity="${r1(0.9 - i * 0.07)}" stroke-width="1.4"/>`; }).join(""); return svg(300, 210, `<rect width="300" height="210" fill="${c.f}"/>${lignes}${pointille([[18,186],[34,170],[52,160],[72,162],[92,160],[108,146],[124,132],[146,126],[170,124],[192,118],[206,100],[216,84],[238,72],[256,52],[272,36],[284,22]], 6, c.t)}<rect x="14" y="182" width="10" height="10" fill="${c.t}"/><path d="M284 6 a11 11 0 0 1 11 11 c0 9 -11 20 -11 20 s-11 -11 -11 -20 a11 11 0 0 1 11 -11Z" fill="${c.pin}"/><circle cx="284" cy="17" r="4" fill="${c.f}"/>`); },
  // 409 : roue de vélo sur parallélogramme (marque monumentale) + profil d'altitude
  roue: (c, u = "d") => { const ray = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<line x1="${r1(250 + 6 * Math.cos(a))}" y1="${r1(100 + 6 * Math.sin(a))}" x2="${r1(250 + 54 * Math.cos(a))}" y2="${r1(100 + 54 * Math.sin(a))}" stroke="${c.p2}" stroke-width="2"/>`; }).join(""); return svg(360, 200, `<polygon points="60,30 190,30 130,170 0,170" fill="${c.p1}"/><circle cx="250" cy="100" r="60" fill="none" stroke="${c.p2}" stroke-width="9"/>${ray}<circle cx="250" cy="100" r="9" fill="${c.p2}"/><rect x="300" y="132" width="52" height="52" fill="${c.p3}"/>`); },
};
// profil d'altitude (409) : aire pleine, repères
function profil(W, h, c, u) {
  const R = alea(409), pts = [];
  for (let x = 0; x <= W; x += W / 40) { const t = x / W; pts.push([x, h * (0.78 - 0.5 * Math.sin(t * Math.PI * 1.2) * (0.7 + 0.3 * Math.sin(t * 17)) - 0.08 * R())]); }
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${r1(x)} ${r1(y)}`).join(" ");
  return svg(W, h, `<path d="${d} L${W} ${h} L0 ${h}Z" fill="${c.a}" opacity="0.55"/><path d="${d}" fill="none" stroke="${c.l}" stroke-width="3"/>${[8, 20, 31].map((i) => `<rect x="${r1(pts[i][0]) - 4}" y="${r1(pts[i][1]) - 4}" width="8" height="8" fill="${c.l}"/>`).join("")}`);
}

// ── Mise en page « vagues » (captures 34 et 35) ──────────────────────────────────────────────────────────────────────────────────────────────
// o : fond, fg, mute, accent, titre, vagues [c1,c2,c3], seed, crete, marque (nœud illustration), nom, phrase, iconeFond, iconeCouleur, ordre ["marque","liens","journal","contact","horaires","abo"], liens, articles, puce
function piedsVagues(k, env, G, o) {
  const S = k.S, ti = (t) => k.col([k.T(`<p>${t}</p>`, { fontFamily: S.head, fontSize: "19px", fontWeight: "600", color: o.titre || o.fg, lineHeight: 1.2 }), H(k, onde(o.accent), { width: "44px" })], { gap: "8px" });
  const res = sociaux(k, o);
  const marque = GK.colonne(k, [...(Array.isArray(o.marque) ? o.marque : [o.marque]), ...(o.nom ? [k.T(`<p>${o.nom}</p>`, { fontFamily: S.head, fontSize: "26px", color: o.titre || o.fg, lineHeight: 1.1 })] : []), texte(k, o.phrase, { couleur: o.fg, taille: 16, largeur: "340px" }), res], { poids: o.poidsMarque || 3, min: "280px", gap: "18px" });
  const liens = GK.colonne(k, [ti(o.titreLiens || "Liens rapides"), ...listeLiens(k, o.liens, { puce: "›", couleur: o.fg, survol: { color: o.accent, transform: { x: 4 } }, focus: o.accent })], { poids: 2, min: "180px", gap: "6px" });
  const journal = GK.colonne(k, [ti("Journal"), ...o.articles.map(([t, u, rub]) => k.col([lien(k, t, u, { taille: 16, poids: "600", couleur: o.fg, survol: { color: o.accent }, focus: o.accent, h: "44px", lh: 1.35 }), caps(k, rub, { couleur: o.mute, suivi: "0.12em", taille: "11px" })], { gap: "0px" }))], { poids: 2.6, min: "220px", gap: "12px" });
  const contact = GK.colonne(k, [ti("Nous trouver"), coordonnees(k, { couleur: o.fg, lien: o.fg, survol: o.accent, focus: o.accent, icones: true, taille: 15 })], { poids: 3, min: "230px", gap: "12px" });
  const hor = GK.colonne(k, [ti("Horaires"), horaires(k, { couleur: o.fg, taille: 15 })], { poids: 2.4, min: "200px", gap: "12px" });
  const abo = GK.colonne(k, [ti("Lettre"), (() => { const n = GK.abonnement({ titre: "", intro: o.introAbo || "Conseils et nouveautés, de temps en temps.", bouton: "Je m'abonne", largeur: "340px", accent: o.accent, texte: o.fg, rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px" })(k, env); n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.fg }; n.parts.button.styles.desktop = { ...n.parts.button.styles.desktop, color: o.surAccent || o.fond }; n.parts.intro.styles.desktop = { ...n.parts.intro.styles.desktop, color: o.mute }; return n; })()], { poids: 3, min: "250px", gap: "12px" });
  const par = { marque, liens, journal, contact, horaires: hor, abo };
  const nomT = o.nom ? k.T(`<p>${o.nom}</p>`, { fontFamily: S.head, fontSize: "28px", color: o.titre || o.fg, lineHeight: 1.1, textAlign: ["centre","bandeau","papier"].includes(o.mode) ? "center" : undefined }) : null;
  const ill = Array.isArray(o.marque) ? o.marque : [o.marque];
  const phr = (al) => texte(k, o.phrase, { couleur: o.fg, taille: 16, largeur: "420px", align: al });
  const navLiens = (al) => k.row(o.liens.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: o.fg, survol: { color: o.accent, transform: { y: -2 } }, focus: o.accent, padH: "10px" })), { gap: "0px 8px", flexWrap: "wrap", justifyContent: al, alignItems: "center", width: "100%" });
  const resC = () => sociaux(k, o, { justifyContent: "center" });
  let haut;
  if (o.mode === "centre") {
    haut = G.bande(k, [...ill, ...(nomT ? [nomT] : []), phr("center"), navLiens("center"), resC(), trait(k, o.fg + "33"), G.ligne(k, [contact, o.ordre.includes("horaires") ? hor : abo], { gap: "28px 56px", aligne: "flex-start", justifie: "center", largeur: "100%" })], { fond: o.fond, colonne: true, aligne: "center", gap: "22px", max: "880px", padV: o.padV || ["64px", "52px", "40px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Centre" });
  } else if (o.mode === "bandeau") {
    const hautB = G.bande(k, [...ill, ...(nomT ? [nomT] : [])], { fond: o.fond2 || o.fond, colonne: true, aligne: "center", gap: "10px", padV: ["40px", "32px", "28px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Bandeau" });
    const sous = G.bande(k, [GK.colonne(k, [phr(), resC()], { poids: 3, min: "260px", gap: "16px", aligne: "flex-start" }), ...o.ordre.filter((c) => c !== "marque").map((c) => par[c])], { fond: o.fond, gap: "36px 48px", aligne: "flex-start", padV: ["36px", "30px", "28px"], padB: ["32px", "24px", "20px"], padH: PH, nom: "Colonnes" });
    haut = [hautB, sous];
  } else if (o.mode === "frise") {
    const carre = (c) => k.col([], { width: "16px", height: "16px", backgroundColor: c, flexShrink: 0, borderRadius: "0px" });
    const fil = k.row(o.etapes.map((_, i) => k.row([i === 0 ? souffle(carre(o.accent), 2800) : carre(o.accent), ...(i === o.etapes.length - 1 ? [] : [k.divider({ width: "100%", borderColor: o.accent, borderTopWidth: "2px", marginTop: "0px", marginBottom: "0px", flexGrow: 1 })])], { gap: "10px", alignItems: "center", flexWrap: "nowrap", flexGrow: 1, flexBasis: "170px", minWidth: "150px", paddingRight: "18px" })), { gap: "0px", flexWrap: "wrap", width: "100%" });
    const textes = k.row(o.etapes.map(([t, u, r], i) => k.col([caps(k, `Étape ${i + 1}`, { couleur: o.accent }), lien(k, t, u, { taille: 24, poids: "400", police: S.head, couleur: o.fg, survol: { color: o.accent, transform: { x: 5 } }, focus: o.accent }), texte(k, r, { taille: 15, couleur: o.mute, largeur: "220px" })], { gap: "8px", flexGrow: 1, flexBasis: "170px", minWidth: "150px", paddingRight: "18px" })), { gap: "16px 0px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" });
    const tete = G.ligne(k, [k.col(ill, { flexShrink: 0 }), GK.colonne(k, [...(nomT ? [nomT] : []), phr(), res], { poids: 1, min: "260px", gap: "14px", aligne: "flex-start" })], { gap: "24px 56px", aligne: "center", largeur: "100%" });
    haut = [G.bande(k, [tete, fil, textes], { fond: o.fond, colonne: true, gap: "30px", padV: o.padV || ["64px", "52px", "40px"], padB: ["30px", "26px", "22px"], padH: PH, nom: "Frise" }), G.bande(k, [par.contact], { fond: o.fond, padV: ["0px", "0px", "0px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Contact" })];
  } else if (o.mode === "terminal") {
    const sq = (c) => k.col([], { width: "12px", height: "12px", backgroundColor: c, flexShrink: 0, borderRadius: "0px" });
    const barre = k.row([sq("#ff6b6b"), sq("#f2b84b"), sq(o.accent), k.T(`<p>${o.nom} — terminal</p>`, { fontFamily: S.font, fontSize: "12px", color: o.mute, marginLeft: "12px" })], { gap: "8px", alignItems: "center", flexWrap: "nowrap", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px", backgroundColor: o.fond2, width: "100%" });
    const inv = (c) => k.T(`<p><span style="color:${o.accent}">$</span> ${c}</p>`, { fontFamily: S.font, fontSize: "14px", color: o.fg, fontWeight: "600", lineHeight: 1.5 });
    const cols = G.ligne(k, [GK.colonne(k, [inv("view carte --hors-ligne"), ...ill], { poids: 1.2, min: "260px", gap: "12px" }), GK.colonne(k, [inv("ls ./rubriques"), ...o.liens.map(([t, u]) => lien(k, "› " + t, u, { taille: 15, couleur: o.fg, survol: { color: o.accent, transform: { x: 6 } }, focus: o.accent }))], { poids: 1, min: "220px", gap: "4px" }), GK.colonne(k, [inv("cat contact.txt"), contact.children ? contact.children[1] : contact, inv("open reseaux"), resC()], { poids: 1, min: "240px", gap: "12px" }), GK.colonne(k, [inv("subscribe --mensuel"), par.abo.children[1]], { poids: 1, min: "240px", gap: "12px" })], { gap: "28px 36px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    cols.styles.desktop = { ...cols.styles.desktop, paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px" };
    const fen = k.col([barre, cols], { borderStyle: "solid", borderWidth: "1px", borderColor: o.accent, backgroundColor: o.fond, borderRadius: "0px", gap: "0px", width: "100%" });
    haut = G.bande(k, [fen], { fond: o.fond, colonne: true, padV: o.padV || ["56px", "44px", "32px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Fenêtre" });
  } else if (o.mode === "papier") {
    const dbl = () => k.col([trait(k, o.fg, "3px"), trait(k, o.fg, "1px")], { gap: "4px", width: "100%" });
    const sqs = (cs) => k.row(cs.map((c) => k.col([], { width: "10px", height: "10px", backgroundColor: c, borderRadius: "0px" })), { gap: "8px", justifyContent: "center", alignItems: "center" });
    const items = o.liens.flatMap(([t, u], i) => [...(i ? [k.col([], { width: "7px", height: "7px", backgroundColor: o.accent, borderRadius: "0px" })] : []), lien(k, t, u, { taille: 17, couleur: o.fg, survol: { color: o.accent, textDecoration: "underline", transform: { y: -2 } }, focus: o.accent })]);
    haut = G.bande(k, [dbl(), ...ill, k.T(`<p>${o.mention}</p>`, { fontFamily: S.font, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.34em", color: o.accent, textAlign: "center" }), nomT, sqs([o.accent, o.fg, o.accent]), G.ligne(k, [hor, contact], { gap: "24px 56px", aligne: "flex-start", justifie: "center", largeur: "100%" }), k.row(items, { gap: "4px 16px", alignItems: "center", justifyContent: "center", flexWrap: "wrap", width: "100%" }), resC(), dbl()], { fond: o.fond, colonne: true, aligne: "center", gap: "26px", max: "960px", padV: o.padV || ["48px", "40px", "32px"], padB: ["24px", "22px", "20px"], padH: PH, nom: "Papier" });
  } else if (o.mode === "lateral") {
    const g = GK.colonne(k, [...ill, ...(nomT ? [nomT] : []), phr(), res], { poids: 3, min: "300px", gap: "18px", extra: { backgroundColor: o.fond2, paddingTop: "64px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "40px" }, mobile: { paddingTop: "40px", paddingBottom: "36px", paddingLeft: "20px", paddingRight: "20px" } });
    const d = GK.colonne(k, [G.ligne(k, [par.liens, par.journal, par.contact], { gap: "36px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" })], { poids: 8, min: "300px", extra: { paddingTop: "72px", paddingBottom: "48px", paddingLeft: "56px", paddingRight: "48px" }, mobile: { paddingTop: "36px", paddingBottom: "32px", paddingLeft: "20px", paddingRight: "20px" } });
    haut = bandePleine(G, k, [g, d], { fond: o.fond, nom: "Colonne latérale" });
  } else if (o.mode === "cartes") {
    const carte = (enf, p) => k.col(enf, { backgroundColor: o.fond2, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", flexGrow: p || 1, flexBasis: "220px", minWidth: "220px", gap: "12px", borderRadius: "0px" });
    const sansMarque = o.ordre.filter((c) => c !== "marque");
    const cartes = k.row(sansMarque.map((c) => carte(par[c].children || [par[c]])), { gap: "20px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const entete = G.ligne(k, [k.col(ill, { flexShrink: 0 }), GK.colonne(k, [...(nomT ? [nomT] : []), phr(), res], { poids: 1, min: "260px", gap: "14px", aligne: "flex-start" })], { gap: "28px 48px", aligne: "center", largeur: "100%" });
    haut = G.bande(k, [entete, cartes], { fond: o.fond, colonne: true, gap: "36px", padV: o.padV || ["64px", "52px", "40px"], padB: ["36px", "28px", "24px"], padH: PH, nom: "Cartes" });
  } else if (o.mode === "deux") {
    const g = GK.colonne(k, [...ill, ...(nomT ? [nomT] : []), phr(), res, par[o.ordre.includes("abo") ? "abo" : "horaires"]], { poids: 1, min: "300px", gap: "18px", extra: { backgroundColor: o.fond2, paddingTop: "56px", paddingBottom: "48px", paddingLeft: "48px", paddingRight: "40px" }, mobile: { paddingTop: "36px", paddingBottom: "32px", paddingLeft: "20px", paddingRight: "20px" } });
    const d = GK.colonne(k, [par.liens, par.contact, ...(o.ordre.includes("journal") ? [par.journal] : [])], { poids: 1, min: "300px", gap: "30px", extra: { paddingTop: "56px", paddingBottom: "48px", paddingLeft: "48px", paddingRight: "48px" }, mobile: { paddingTop: "36px", paddingBottom: "32px", paddingLeft: "20px", paddingRight: "20px" } });
    haut = bandePleine(G, k, [g, d], { fond: o.fond, nom: "Deux moitiés" });
  } else {
    haut = G.bande(k, o.ordre.map((c) => par[c]), { fond: o.fond, gap: "40px 48px", aligne: "flex-start", padV: o.padV || ["72px", "56px", "44px"], padB: ["36px", "28px", "24px"], padH: PH, nom: "Colonnes" });
  }
  const bandeVague = bandePleine(G, k, [...H2(k, (W, h, u) => vagues(W, h, o.vagues, o.seed || 1, o.crete), [1440, 96], [390, 56], { backgroundColor: o.fond })], { fond: o.fond, colonne: true, nom: "Ondulation" });
  const mentions = G.ligneLegale({ taille: 13, couleur: o.mentions, liens: o.mentionsLiens, sansCookies: true })(k, env, true);
  const bas = G.bande(k, [mentions], { fond: o.vagues[o.vagues.length - 1], colonne: true, aligne: "center", padV: ["8px", "8px", "6px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
  return [G.racine(k, [...[].concat(haut), bandeVague, bas])];
}

// ── Mise en page « monument » (capture 36) ───────────────────────────────────────────────────────────────────────────────────────────────────
// o : fond, fg, mute, accent, titre, mot, taille, police, poids, motCouleur, equerre (couleur|null), ombre {col, op}, marque (nœud), centre ("milieu"|"droite"), liens, reseauxTitre, lignes
function piedsMonument(k, env, G, o) {
  const S = k.S;
  const coins = o.equerre && !o.sansEquerre ? k.row([H(k, equerre(o.equerre, true, true), { width: "30px" }), H(k, equerre(o.equerre, true, false), { width: "30px" })], { justifyContent: "space-between", width: "100%", alignItems: "flex-start" }) : null;
  const mot = o.rogne === false
    ? G.geant(`<p>${o.mot}</p>`, { taille: o.taille || [96, 200], lh: 0.95, suivi: o.suivi || "-0.02em", poids: o.poids || "800", police: S.head, couleur: o.motCouleur || o.fg })(k, env)
    : G.nomRogne(o.mot, { taille: o.taille || [120, 200], visible: o.visible || 0.78, police: S.head, poids: o.poids || "800", suivi: o.suivi || "-0.03em", couleur: o.motCouleur || o.fg })(k);
  const ombre = H2(k, o.ombreFn || ((W, h, u) => ombres(W, h, o.ombre.col, o.ombre.op, u)), [1440, 90], [390, 60], { backgroundColor: o.fond });
  const hautBande = G.bande(k, [...(coins ? [coins] : []), mot], { fond: o.fond, colonne: true, gap: "12px", padV: ["28px", "24px", "20px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Mot" });
  const ombreBande = o.sansOmbre ? null : bandePleine(G, k, ombre, { fond: o.fond, colonne: true, nom: "Ombres" });
  const bloc = (titre, enfants, align) => k.col([k.T(`<p>${titre}</p>`, { fontFamily: S.head, fontSize: "22px", fontWeight: "600", color: o.titre || o.fg, lineHeight: 1.2, textAlign: align }), ...enfants], { gap: "6px", alignItems: align === "right" ? "flex-end" : "flex-start" });
  const res = sociaux(k, o, o.alignDroite === false ? {} : { justifyContent: "flex-end" });
  const gauche = GK.colonne(k, o.gauche(k, bloc, { coordonnees, horaires, texte, caps }), { poids: 1, min: "230px", gap: "26px" });
  const marque = GK.colonne(k, [o.marque], { poids: 1.1, min: "240px", aligne: "center", soi: "center" });
  const liensDroite = o.liens.map(([t, u]) => lien(k, t, u, { taille: 17, poids: "500", couleur: o.mute, survol: { color: o.accent, transform: { x: -4 } }, focus: o.accent, h: "40px", extra: { justifyContent: "flex-end" } }));
  const droite = GK.colonne(k, [bloc(o.reseauxTitre || "Réseaux", [res], "right"), ...(o.sansLiens ? [] : [bloc(o.liensTitre || "Liens utiles", liensDroite, "right")])], { poids: 1, min: "230px", gap: "26px", aligne: "flex-end" });
  droite.styles.mobile = { ...(droite.styles.mobile || {}), alignItems: "flex-start" };
  let corps, blocsTop;
  const ctaBande = o.cta ? G.bande(k, [texte(k, o.cta[3], { couleur: o.fg, taille: 20, largeur: "560px", poids: "600" }), souffle(bouton(k, o.cta[0], o.cta[1], { texte: o.cta[2], fond: o.fg, taille: 20, h: "72px", survol: { backgroundColor: o.accent, borderColor: o.accent, color: o.fg, transform: { y: -4 } }, focus: o.accent, extra: { minWidth: "300px" } }), 3600)], { fond: o.fond2 || o.fond, gap: "20px 48px", aligne: "center", padV: ["32px", "28px", "24px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Appel" }) : null;
  if (o.variante === "marque-bande") {
    // la marque dessinée occupe sa propre bande centrée entre le mot et les infos ; infos sur deux colonnes
    const bm = G.bande(k, [o.marque], { fond: o.fond2 || o.fond, colonne: true, aligne: "center", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Marque" });
    const infos2 = G.bande(k, [gauche, droite], { fond: o.fond, gap: "36px 64px", aligne: "flex-start", padV: ["44px", "36px", "28px"], padB: ["36px", "28px", "24px"], padH: PH, nom: "Infos" });
    corps = [bm, infos2];
  } else if (o.variante === "empile") {
    const resM = sociaux(k, o, { justifyContent: "center" });
    const bm = G.bande(k, [o.marque, resM], { fond: o.fond, colonne: true, aligne: "center", gap: "18px", padV: ["32px", "24px", "20px"], padB: ["8px", "8px", "8px"], padH: PH, nom: "Marque" });
    const rang = G.bande(k, [gauche, bloc(o.liensTitre || "Liens utiles", o.liens.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "500", couleur: o.mute, survol: { color: o.accent, transform: { x: 4 } }, focus: o.accent, h: "40px" })), "left")], { fond: o.fond, gap: "36px 48px", aligne: "flex-start", padV: ["32px", "28px", "24px"], padB: ["36px", "28px", "24px"], padH: PH, nom: "Infos" });
    corps = [bm, rang];
  } else if (o.variante === "cote") {
    // mot et marque côte à côte, en tête ; infos en une seule rangée de quatre blocs
    const mots = G.bande(k, [GK.colonne(k, [mot], { poids: 5, min: "300px" }), GK.colonne(k, [o.marque], { poids: 2, min: "220px", aligne: "center", soi: "center" })], { fond: o.fond, gap: "20px 40px", aligne: "center", padV: ["36px", "28px", "20px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Mot et marque" });
    const rang = G.bande(k, [gauche, bloc(o.liensTitre || "Liens utiles", o.liens.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "500", couleur: o.mute, survol: { color: o.accent, transform: { x: 4 } }, focus: o.accent, h: "40px" })), "left"), bloc(o.reseauxTitre || "Réseaux", [res], "left")], { fond: o.fond, gap: "36px 48px", aligne: "flex-start", padV: ["40px", "32px", "28px"], padB: ["36px", "28px", "24px"], padH: PH, nom: "Infos" });
    corps = [rang];
    blocsTop = mots;
  } else {
    corps = [G.bande(k, o.centre === "droite" ? [gauche, droite, marque] : [gauche, marque, droite], { fond: o.fond, gap: "36px 48px", aligne: "flex-start", padV: ["48px", "40px", "32px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Infos" })];
  }
  const haut2 = lien(k, "Retour à l'accueil", "/", { taille: 13, poids: "600", couleur: o.mute, survol: { color: o.accent }, focus: o.accent, h: "44px" });
  const mentions = G.ligneLegale({ taille: 13, couleur: o.mute, liens: o.fg, sansCookies: true })(k, env);
  const bas = G.bande(k, [trait(k, o.ligne), (o.sansRetour ? mentions : k.row([mentions, haut2], { justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px 24px", width: "100%" }))], { fond: o.fond, colonne: true, gap: "6px", padV: ["0px", "0px", "0px"], padB: ["12px", "12px", "10px"], padH: PH, nom: "Mentions" });
  if (o.variante === "cote") return [G.racine(k, [blocsTop, ombreBande, ...corps, bas].filter(Boolean))];
  if (o.ordre === "mot-bas") return [G.racine(k, [...corps, hautBande, ombreBande, bas].filter(Boolean))];
  return [G.racine(k, [hautBande, ombreBande, ctaBande, ...corps, bas].filter(Boolean))];
}

module.exports = { DOUX, PH, RESEAUX, racineDe, lien, caps, texte, trait, souffle, partie, horaires, coordonnees, bouton, bandePleine, listeLiens, svg, H, H2, vagues, onde, equerre, ombres, dessins, profil, piedsVagues, piedsMonument, GK, Moteur, compact };
