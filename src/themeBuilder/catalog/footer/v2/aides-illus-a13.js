// Aides « illustration » de l'agent a13 : dessins vectoriels (SVG inline) et gestes communs des familles Aéronautique et spatial / Luxe et hôtellerie. Angles droits CSS partout.
const { identite, G: GK, Moteur } = require("./kit-v2");
const { compact } = require("../../kit");
const DOUX = 360; // ms : durée des transitions de survol / focus

// ── Aides LOCALES à la famille (toutes à angles droits) ──────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, /* le point rond « ouvert / fermé » du widget a un arrondi de 50 % imposé : écarté */ groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: o.layout || "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align, ...(o.align === "center" ? { display: "flex", justifyContent: "center" } : {}) }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg }; // message « non configuré » lisible sur le fond de SA bande
  return n;
};
// Bouton plein ou à contour, angles droits, qui se soulève et change de couleur au survol
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
// Bande de couleur franche (barre pleine largeur de hauteur fixe)
const barre = (G, k, couleur, h = ["12px", "10px", "8px"]) => G.bande(k, [], { fond: couleur, padV: h, padB: h, padH: ["0px", "0px", "0px"], nom: "Barre" });
// Lettre d'information habillée aux couleurs de la bande (titre, intro, bouton plein à angles droits)
const lettre = (k, env, o) => {
  const abo = abonnement(k, env, { titre: o.titre, intro: o.intro, bouton: o.bouton || "Je m'abonne", largeur: o.largeur || "340px", accent: o.accent, texte: o.texte });
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre || o.accent, lineHeight: 1.4 };
  abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.couleurIntro || o.texte };
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: o.surBouton };
  abo.parts.button.states = { hover: { backgroundColor: o.survolBouton || o.texte, color: o.surSurvol || o.surBouton }, focus: GK.focus(o.focus || o.texte) };
  return abo;
};
const MARGES = ["48px", "32px", "20px"];
// Texte courant simple
const para = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.max, textAlign: o.align, fontWeight: o.poids }));
// Ligne-index : grand libellé, flèche, filet bas (pleine largeur)
const indexLigne = (k, label, url, o) => k.row([lien(k, label, url, { taille: o.taille || 44, poids: o.poids || "400", police: o.police, couleur: o.couleur, h: o.h || "72px", survol: { color: o.survol, paddingLeft: "16px" }, focus: o.survol, extra: { flexGrow: 1 } }), k.T("<p>→</p>", { fontSize: "28px", color: o.survol, fontFamily: k.S.font, flexShrink: 0 })], { width: "100%", alignItems: "center", flexWrap: "nowrap", gap: "12px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.filet });
const filetC = (k, couleur, l = "28px", e = "3px") => k.divider({ width: l, borderColor: couleur, borderTopWidth: e, marginTop: "0px", marginBottom: "0px" });
const reseauxEx = [["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"]];
// Colonne de liens : titre en capitales, petit filet d'accent, liens qui s'indentent au survol
const colLiens = (k, titre, items, o) => k.col([caps(k, titre, { couleur: o.titre, suivi: "0.16em", taille: "13px", police: o.policeTitre }), filetC(k, o.filet || o.titre), ...items.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "500", couleur: o.lien, survol: { color: o.survol, paddingLeft: "6px" }, focus: o.survol }))], { flexGrow: 1, flexBasis: o.base || "160px", minWidth: o.min || "140px", gap: "6px" });

// ═══ Dessins ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const f = (n) => Math.round(n * 10) / 10;
const alea = (g) => { let a = g >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const enveloppe = (W, H, inner) => `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
// widget html (SVG décoratif) : la hauteur suit la largeur ; `st` = styles du widget
const dessin = (k, W, H, inner, st = {}) => k.W("html", { html: enveloppe(W, H, inner) }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st }));
// variante large + variante étroite (mobile) d'un même dessin : art(W,H) → inner
const duo = (k, art, big, small, st = {}) => [
  { ...dessin(k, big[0], big[1], art(big[0], big[1]), st), hideOn: ["mobile"] },
  { ...dessin(k, small[0], small[1], art(small[0], small[1]), st), hideOn: ["desktop", "tablet"] },
];
const mixe = (a, b, t) => { const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const x = h(a), y = h(b); return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
// dégradé SANS <defs> (le moteur retire gradients et filtres) : n bandes horizontales de couleurs intermédiaires
const bandesV = (W, y0, y1, c1, c2, n) => { let s = ""; const h = (y1 - y0) / n; for (let i = 0; i < n; i++) s += `<rect x="0" y="${f(y0 + i * h)}" width="${W}" height="${f(h + 1)}" fill="${mixe(c1, c2, n > 1 ? i / (n - 1) : 0)}"/>`; return s; };
// halo lumineux SANS filtre : cercles concentriques translucides
const halo = (cx, cy, r, c, n, op) => { let s = ""; for (let i = 0; i < n; i++) s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * (1 - i / n))}" fill="${c}" opacity="${op}"/>`; return s; };
// pointillés SANS stroke-dasharray (retiré par le moteur) : petits carrés posés le long d'un segment ou d'une courbe de Bézier cubique
const pointsLigne = (x1, y1, x2, y2, n, c, t = 3) => { let s = ""; for (let i = 0; i <= n; i++) s += `<rect x="${f(x1 + ((x2 - x1) * i) / n - t / 2)}" y="${f(y1 + ((y2 - y1) * i) / n - t / 2)}" width="${t}" height="${t}" fill="${c}"/>`; return s; };
const pointsBezier = (P, n, c, t = 3) => { let s = ""; for (let i = 0; i <= n; i++) { const u = i / n, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, d = 3 * u * u * (1 - u), e = u ** 3; s += `<rect x="${f(a * P[0] + b * P[2] + d * P[4] + e * P[6] - t / 2)}" y="${f(a * P[1] + b * P[3] + d * P[5] + e * P[7] - t / 2)}" width="${t}" height="${t}" fill="${c}"/>`; } return s; };
const vague = (W, y, amp, per, ph = 0, bas = null) => { let d = `M0 ${f(y)}`; for (let x = 0; x <= W; x += 10) d += ` L${x} ${f(y + amp * Math.sin((x / per) * 6.2832 + ph))}`; return bas === null ? d : `${d} L${W} ${bas} L0 ${bas} Z`; };
const etoiles = (W, H, n, g, c, rmax = 1.6) => { const r = alea(g); let s = ""; for (let i = 0; i < n; i++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(0.5 + r() * rmax)}" fill="${c}" opacity="${f(0.35 + r() * 0.6)}"/>`; return s; };

// 422 — horizon d'aérodrome : piste en perspective, radar à balayage, tour (aplats seuls : pas de dégradé ni de filtre)
const horizonRadar = (W, H) => {
  const m = W / 2, hz = H * 0.58; let s = bandesV(W, 0, hz, "#0b1430", "#2a2a3d", 9);
  s += `<rect x="0" y="${f(hz - 6)}" width="${W}" height="6" fill="#f5b301" opacity="0.18"/><rect x="0" y="${f(hz)}" width="${W}" height="${f(H - hz)}" fill="#0e1a3d"/>`;
  s += `<path d="M0 ${f(hz)} L${f(W * 0.12)} ${f(hz - 22)} L${f(W * 0.24)} ${f(hz - 8)} L${f(W * 0.36)} ${f(hz - 30)} L${f(W * 0.46)} ${f(hz)} Z" fill="#14224d"/><path d="M${f(W * 0.58)} ${f(hz)} L${f(W * 0.68)} ${f(hz - 26)} L${f(W * 0.78)} ${f(hz - 10)} L${f(W * 0.9)} ${f(hz - 34)} L${W} ${f(hz - 12)} L${W} ${f(hz)} Z" fill="#14224d"/><path d="M0 ${f(hz)} L${W} ${f(hz)}" stroke="#f5b301" stroke-width="2"/>`;
  s += `<polygon points="${m - 90},${H} ${m + 90},${H} ${m + 8},${f(hz)} ${m - 8},${f(hz)}" fill="#1b2c63" stroke="#f5b301" stroke-width="2"/>`;
  for (let i = 0; i < 7; i++) { const t = i / 7, y = hz + (H - hz) * (t * t + 0.05), w = 2 + 8 * t; s += `<rect x="${f(m - w / 2)}" y="${f(y)}" width="${f(w)}" height="${f(3 + 9 * t)}" fill="#eef2fb"/>`; }
  for (let i = 0; i < 9; i++) { const t = (i + 1) / 10, y = hz + (H - hz) * t * t, off = 8 + 82 * t * t; s += `<rect x="${f(m - off - 3)}" y="${f(y)}" width="6" height="4" fill="#f5b301"/><rect x="${f(m + off - 3)}" y="${f(y)}" width="6" height="4" fill="#f5b301"/>`; }
  const rx = W * 0.14, ry = H;
  [40, 80, 120, 160].forEach((r) => { s += `<path d="M${f(rx - r)} ${ry} A${r} ${r} 0 0 1 ${f(rx + r)} ${ry}" fill="none" stroke="#f5b301" opacity="0.55" stroke-width="1.5"/>`; });
  s += `<path d="M${rx} ${ry} L${f(rx + 138)} ${f(ry - 80)} A160 160 0 0 0 ${f(rx + 80)} ${f(ry - 139)} Z" fill="#f5b301" opacity="0.22"/><line x1="${rx}" y1="${ry}" x2="${f(rx + 138)}" y2="${f(ry - 80)}" stroke="#f5b301" stroke-width="2.5"/>`;
  s += `<rect x="${f(rx + 40)}" y="${f(ry - 52)}" width="8" height="8" fill="#eef2fb"/><rect x="${f(rx - 60)}" y="${f(ry - 78)}" width="8" height="8" fill="#f5b301"/><rect x="${f(rx + 96)}" y="${f(ry - 90)}" width="8" height="8" fill="#f5b301"/>`;
  const tx = W * 0.82;
  s += `<rect x="${f(tx)}" y="${f(hz - 70)}" width="14" height="70" fill="#eef2fb"/><polygon points="${f(tx - 22)},${f(hz - 70)} ${f(tx + 36)},${f(hz - 70)} ${f(tx + 28)},${f(hz - 98)} ${f(tx - 14)},${f(hz - 98)}" fill="#f5b301"/><rect x="${f(tx - 10)}" y="${f(hz - 92)}" width="36" height="10" fill="#0e1a3d"/><rect x="${f(tx - 40)}" y="${f(hz - 24)}" width="94" height="24" fill="#1b2c63" stroke="#f5b301" stroke-width="1.5"/>`;
  s += `${pointsLigne(W * 0.3, hz * 0.5, W * 0.5, hz * 0.3, 22, "#eef2fb", 2.5)}<polygon points="${f(W * 0.5)},${f(hz * 0.3)} ${f(W * 0.5 - 20)},${f(hz * 0.3 + 3)} ${f(W * 0.5 - 14)},${f(hz * 0.3 - 8)}" fill="#eef2fb"/>`;
  return s + etoiles(W, hz - 30, 24, 422, "#eef2fb");
};
// 423 — planète au limbe incandescent (halo en cercles concentriques : pas de filtre)
const planete = (W, H) => {
  const cx = W / 2, cy = H * 0.54, r = Math.min(W, H) * 0.3; let s = etoiles(W, H, 80, 423, "#f1efe8", 1.3);
  s += halo(cx, cy, r * 1.6, "#ff5a1f", 14, 0.08) + halo(cx, cy, r * 1.25, "#ff8a3d", 8, 0.09);
  s += `<circle cx="${cx}" cy="${cy}" r="${f(r * 1.06)}" fill="#ff5a1f"/><circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="#0a0a0e"/>`;
  s += `<path d="M${f(cx - r * 0.82)} ${f(cy - r * 0.55)} A${f(r)} ${f(r)} 0 0 1 ${f(cx + r * 0.55)} ${f(cy - r * 0.82)}" fill="none" stroke="#ffb184" stroke-width="3"/>`;
  [0.55, 0.3].forEach((q, i) => { s += `<path d="M${f(cx - r * 0.9)} ${f(cy + r * q * 0.5)} Q${cx} ${f(cy + r * q * 1.1)} ${f(cx + r * 0.9)} ${f(cy + r * q * 0.5)}" fill="none" stroke="#ff5a1f" opacity="${0.5 - i * 0.2}" stroke-width="2"/>`; });
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${f(r * 1.55)}" ry="${f(r * 0.3)}" transform="rotate(-18 ${cx} ${cy})" fill="none" stroke="#f1efe8" opacity="0.6" stroke-width="1.6"/>`;
  s += `<rect x="${f(cx + r * 1.38)}" y="${f(cy - r * 0.62)}" width="12" height="12" fill="#f1efe8"/><rect x="${f(cx - r * 1.5)}" y="${f(cy + r * 0.4)}" width="8" height="8" fill="#ff5a1f"/>`;
  return s;
};
// 424 — piste vue du ciel avec avion en silhouette
const pisteAvion = (W, H) => {
  let s = `<rect width="${W}" height="${H}" fill="#1d3b5c"/><rect y="${f(H * 0.08)}" width="${W}" height="3" fill="#eef1f4" opacity="0.7"/><rect y="${f(H * 0.92 - 3)}" width="${W}" height="3" fill="#eef1f4" opacity="0.7"/>`;
  for (let x = 0; x < W; x += 54) s += `<rect x="${x}" y="${f(H / 2 - 3)}" width="30" height="6" fill="#eef1f4"/>`;
  for (let i = 0; i < 8; i++) s += `<rect x="${12 + i * 7}" y="${f(H * 0.2)}" width="4" height="${f(H * 0.6)}" fill="#eef1f4" opacity="0.9"/>`;
  const px = W * 0.62, py = H / 2, u = H / 120;
  s += `<g transform="translate(${f(px)} ${f(py)}) scale(${f(u)})"><path d="M-70 -5 L60 -5 L74 0 L60 5 L-70 5 Z" fill="#eef1f4"/><polygon points="-10,-4 -34,-48 -22,-48 20,-4" fill="#eef1f4"/><polygon points="-10,4 -34,48 -22,48 20,4" fill="#eef1f4"/><polygon points="-62,-4 -76,-22 -68,-22 -50,-4" fill="#eef1f4"/><polygon points="-62,4 -76,22 -68,22 -50,4" fill="#eef1f4"/><rect x="-30" y="-43" width="6" height="8" fill="#c8321c"/><rect x="-30" y="35" width="6" height="8" fill="#c8321c"/><rect x="50" y="-2" width="12" height="4" fill="#1d3b5c"/></g>`;
  const r = alea(424); for (let i = 0; i < 4; i++) s += `<rect x="${f(W * (0.2 + 0.18 * i))}" y="${f(H * 0.86)}" width="14" height="5" fill="#c8321c"/>`;
  return s + `<rect x="${f(W * 0.88)}" y="${f(H * 0.18)}" width="8" height="${f(H * 0.64)}" fill="#c8321c"/>`;
};
// 425 — nappes de nuages ondulées et route aérienne pointillée
const nuagesRoute = (W, H) => {
  let s = `<rect width="${W}" height="${H}" fill="#1b3fd8"/>`;
  s += `<path d="${vague(W, H * 0.62, 10, W / 3, 0, H)}" fill="#1432ad"/><path d="${vague(W, H * 0.76, 9, W / 2.4, 1.6, H)}" fill="#102a8a"/><path d="${vague(W, H * 0.88, 7, W / 3.5, 3, H)}" fill="#0b1f6b"/>`;
  s += `${pointsBezier([W * 0.04, H * 0.72, W * 0.3, H * 0.05, W * 0.62, H * 0.05, W * 0.94, H * 0.5], 70, "#ffe14d", 4)}`;
  [[0.04, 0.72], [0.34, 0.2], [0.66, 0.2], [0.94, 0.5]].forEach(([a, b]) => { s += `<rect x="${f(W * a - 6)}" y="${f(H * b - 6)}" width="12" height="12" fill="#1b3fd8" stroke="#ffe14d" stroke-width="2.5"/>`; });
  s += `<polygon points="${f(W * 0.5 - 12)},${f(H * 0.12 + 8)} ${f(W * 0.5 + 14)},${f(H * 0.12)} ${f(W * 0.5 - 4)},${f(H * 0.12 - 10)}" fill="#ffffff"/>`;
  return s + etoiles(W, H * 0.4, 20, 425, "#dbe2ff", 1.2);
};
// 426 — paysage de crête, soleil vermillon et traînée (ciel en bandes : pas de dégradé)
const crete = (W, H) => {
  let s = bandesV(W, 0, H, "#0a1128", "#34487f", 12) + etoiles(W, H * 0.5, 46, 426, "#eaf1fa", 1.2);
  s += halo(W * 0.7, H * 0.58, H * 0.62, "#ff6a3d", 14, 0.06) + `<circle cx="${f(W * 0.7)}" cy="${f(H * 0.58)}" r="${f(H * 0.17)}" fill="#ff6a3d"/>`;
  s += `${pointsLigne(W * 0.08, H * 0.3, W * 0.5, H * 0.12, 36, "#eaf1fa", 3)}<polygon points="${f(W * 0.5)},${f(H * 0.12)} ${f(W * 0.5 - 18)},${f(H * 0.12 + 4)} ${f(W * 0.5 - 14)},${f(H * 0.12 - 6)}" fill="#eaf1fa"/>`;
  const pic = (x0, x1, h, c) => { let d = `M${x0} ${H}`; const n = 6; for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; d += ` L${f(x)} ${f(H - h * (i % 2 ? 0.45 : 1) * (1 - Math.abs(i - n / 2) / (n * 0.9)))}`; } return `<path d="${d} L${x1} ${H} Z" fill="${c}"/>`; };
  s += pic(-20, W * 0.55, H * 0.62, "#16224a") + pic(W * 0.3, W * 1.05, H * 0.5, "#0f1a3b") + pic(-40, W * 0.9, H * 0.28, "#080e22");
  for (let i = 0; i < 9; i++) s += `<rect x="${f(W * (0.05 + i * 0.11))}" y="${f(H * 0.94)}" width="6" height="6" fill="#ffb184" opacity="0.8"/>`;
  return s;
};
// 427 — fusée au décollage dans un halo (cercles concentriques et flamme en couches)
const fusee = (W, H) => {
  const cx = W / 2; let s = etoiles(W, H, 46, 427, "#f3eeff", 1.4);
  s += halo(cx, H * 0.62, W * 0.4, "#6a3bd1", 12, 0.09) + halo(cx, H * 0.78, W * 0.2, "#c8ff3d", 8, 0.08);
  s += `<polygon points="${cx - 30},${H * 0.62} ${cx + 30},${H * 0.62} ${cx},${H * 0.99}" fill="#c8ff3d" opacity="0.25"/><polygon points="${cx - 22},${H * 0.62} ${cx + 22},${H * 0.62} ${cx},${H * 0.94}" fill="#c8ff3d" opacity="0.5"/><polygon points="${cx - 14},${H * 0.62} ${cx + 14},${H * 0.62} ${cx},${H * 0.86}" fill="#ffffff"/>`;
  s += `<path d="M${cx - 34} ${H * 0.62} L${cx - 34} ${H * 0.3} Q${cx} ${H * 0.04} ${cx + 34} ${H * 0.3} L${cx + 34} ${H * 0.62} Z" fill="#f3eeff"/><path d="M${cx + 8} ${H * 0.62} L${cx + 8} ${H * 0.1} Q${cx + 34} ${H * 0.3} ${cx + 34} ${H * 0.3} L${cx + 34} ${H * 0.62} Z" fill="#d3c7f5"/>`;
  s += `<polygon points="${cx - 34},${H * 0.62} ${cx - 64},${H * 0.72} ${cx - 34},${H * 0.5}" fill="#c8ff3d"/><polygon points="${cx + 34},${H * 0.62} ${cx + 64},${H * 0.72} ${cx + 34},${H * 0.5}" fill="#c8ff3d"/>`;
  s += `<rect x="${cx - 12}" y="${H * 0.3}" width="24" height="24" fill="#2a1166"/><rect x="${cx - 8}" y="${H * 0.3 + 4}" width="16" height="16" fill="#6a3bd1"/><rect x="${cx - 34}" y="${H * 0.5}" width="68" height="8" fill="#2a1166"/>`;
  s += `<path d="M${f(W * 0.06)} ${f(H * 0.8)} A${f(W * 0.46)} ${f(H * 0.16)} 0 0 0 ${f(W * 0.94)} ${f(H * 0.8)}" fill="none" stroke="#f3eeff" opacity="0.5" stroke-width="1.6"/><rect x="0" y="${H - 14}" width="${W}" height="14" fill="#0f0526"/><rect x="${cx - 70}" y="${H - 28}" width="140" height="14" fill="#2a1166"/><rect x="${cx - 70}" y="${H - 34}" width="10" height="20" fill="#c8ff3d"/><rect x="${cx + 60}" y="${H - 34}" width="10" height="20" fill="#c8ff3d"/>`;
  return s;
};
// 428 — blason or : éventail de rayons, monogramme A, lauriers
const blason = (W, H) => {
  const cx = W / 2, cy = H * 0.52; let s = `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="#8d6b2a" stroke-width="3"/><rect x="16" y="16" width="${W - 32}" height="${H - 32}" fill="none" stroke="#8d6b2a" stroke-width="1"/>`;
  for (let i = 0; i < 17; i++) { const a = Math.PI + (Math.PI * i) / 16, x = cx + Math.cos(a) * W * 0.46, y = H - 22 + Math.sin(a) * H * 0.9; s += `<line x1="${cx}" y1="${H - 22}" x2="${f(x)}" y2="${f(y)}" stroke="#8d6b2a" stroke-width="${i % 2 ? 1 : 2}" opacity="0.7"/>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="${f(W * 0.27)}" fill="#f7f2e8" stroke="#8d6b2a" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${f(W * 0.235)}" fill="none" stroke="#8d6b2a" stroke-width="1"/>`;
  s += `<path d="M${f(cx - W * 0.13)} ${f(cy + W * 0.14)} L${cx} ${f(cy - W * 0.15)} L${f(cx + W * 0.13)} ${f(cy + W * 0.14)}" fill="none" stroke="#1c1a17" stroke-width="9" stroke-linejoin="miter"/><line x1="${f(cx - W * 0.07)}" y1="${f(cy + W * 0.05)}" x2="${f(cx + W * 0.07)}" y2="${f(cy + W * 0.05)}" stroke="#8d6b2a" stroke-width="6"/>`;
  for (let i = 0; i < 7; i++) { const a = 2.2 - i * 0.22, x = cx - Math.cos(a) * W * 0.3 - 0, y = cy + Math.sin(a) * W * 0.3; s += `<ellipse cx="${f(cx - W * 0.31 + i * 3)}" cy="${f(cy + W * 0.12 - i * 22)}" rx="14" ry="6" transform="rotate(${-40 + i * 8} ${f(cx - W * 0.31 + i * 3)} ${f(cy + W * 0.12 - i * 22)})" fill="#8d6b2a"/><ellipse cx="${f(cx + W * 0.31 - i * 3)}" cy="${f(cy + W * 0.12 - i * 22)}" rx="14" ry="6" transform="rotate(${40 - i * 8} ${f(cx + W * 0.31 - i * 3)} ${f(cy + W * 0.12 - i * 22)})" fill="#8d6b2a"/>`; }
  return s + `<rect x="${f(cx - 8)}" y="${f(cy - W * 0.38)}" width="16" height="16" fill="#8d6b2a" transform="rotate(45 ${cx} ${f(cy - W * 0.38 + 8)})"/>`;
};
// 429 — quatre vignettes dessinées : suite, cave, bien-être, façade
const vignettes = (W, H) => {
  const deux = W < 700, pw = deux ? (W - 6) / 2 : (W - 18) / 4, ph = deux ? (H - 6) / 2 : H;
  const pos = (i) => deux ? [(i % 2) * (pw + 6), Math.floor(i / 2) * (ph + 6)] : [i * (pw + 6), 0];
  let s = `<rect width="${W}" height="${H}" fill="#062e24"/>`;
  const P = [
    (x, y) => `<rect x="${x}" y="${y}" width="${f(pw)}" height="${f(ph)}" fill="#e9d9b4"/><path d="M${f(x + pw * 0.58)} ${f(y + ph * 0.7)} V${f(y + ph * 0.25)} A${f(pw * 0.15)} ${f(pw * 0.15)} 0 0 1 ${f(x + pw * 0.88)} ${f(y + ph * 0.25)} V${f(y + ph * 0.7)} Z" fill="#8fb6c4"/><rect x="${f(x + pw * 0.1)}" y="${f(y + ph * 0.6)}" width="${f(pw * 0.8)}" height="${f(ph * 0.14)}" fill="#7a1f2b"/><rect x="${f(x + pw * 0.1)}" y="${f(y + ph * 0.5)}" width="${f(pw * 0.3)}" height="${f(ph * 0.12)}" fill="#fffdf8"/><rect x="${f(x + pw * 0.1)}" y="${f(y + ph * 0.74)}" width="6" height="${f(ph * 0.16)}" fill="#062e24"/><rect x="${f(x + pw * 0.86)}" y="${f(y + ph * 0.74)}" width="6" height="${f(ph * 0.16)}" fill="#062e24"/>`,
    (x, y) => `<rect x="${x}" y="${y}" width="${f(pw)}" height="${f(ph)}" fill="#7a1f2b"/><path d="M${f(x + pw * 0.5 - 22)} ${f(y + ph * 0.18)} H${f(x + pw * 0.5 + 22)} L${f(x + pw * 0.5 + 14)} ${f(y + ph * 0.52)} Q${f(x + pw * 0.5)} ${f(y + ph * 0.62)} ${f(x + pw * 0.5 - 14)} ${f(y + ph * 0.52)} Z" fill="#e9d9b4" opacity="0.9"/><rect x="${f(x + pw * 0.5 - 2)}" y="${f(y + ph * 0.58)}" width="4" height="${f(ph * 0.26)}" fill="#e9d9b4"/><rect x="${f(x + pw * 0.5 - 24)}" y="${f(y + ph * 0.84)}" width="48" height="4" fill="#e9d9b4"/><rect x="${f(x + pw * 0.5 - 18)}" y="${f(y + ph * 0.3)}" width="36" height="${f(ph * 0.12)}" fill="#b0222f"/>`,
    (x, y) => `<rect x="${x}" y="${y}" width="${f(pw)}" height="${f(ph)}" fill="#bfd9d4"/><circle cx="${f(x + pw * 0.5)}" cy="${f(y + ph * 0.7)}" r="${f(pw * 0.17)}" fill="#3d5a52"/><circle cx="${f(x + pw * 0.5)}" cy="${f(y + ph * 0.5)}" r="${f(pw * 0.12)}" fill="#587a70"/><circle cx="${f(x + pw * 0.5)}" cy="${f(y + ph * 0.34)}" r="${f(pw * 0.08)}" fill="#7d9c92"/><path d="${vague(pw, ph * 0.86, 4, pw / 3, 0, ph).replace(/M0 /, `M0 `)}" transform="translate(${f(x)} ${f(y)})" fill="#e9d9b4" opacity="0.8"/>`,
    (x, y) => `<rect x="${x}" y="${y}" width="${f(pw)}" height="${f(ph)}" fill="#062e24" stroke="#e9d9b4" stroke-width="2"/><polygon points="${f(x + pw * 0.14)},${f(y + ph * 0.34)} ${f(x + pw * 0.5)},${f(y + ph * 0.14)} ${f(x + pw * 0.86)},${f(y + ph * 0.34)}" fill="#e9d9b4"/>` + [0.2, 0.36, 0.52, 0.68].map((q) => `<rect x="${f(x + pw * q)}" y="${f(y + ph * 0.38)}" width="${f(pw * 0.08)}" height="${f(ph * 0.46)}" fill="#e9d9b4"/>`).join("") + `<rect x="${f(x + pw * 0.14)}" y="${f(y + ph * 0.84)}" width="${f(pw * 0.72)}" height="${f(ph * 0.06)}" fill="#e9d9b4"/><rect x="${f(x + pw * 0.46)}" y="${f(y + ph * 0.06)}" width="8" height="8" fill="#e9d9b4"/>`,
  ];
  P.forEach((p, i) => { const [x, y] = pos(i); s += p(f(x), f(y)); });
  return s;
};
// 430 — vagues dorées et soleil bas
const vaguesOr = (W, H) => {
  let s = `<rect width="${W}" height="${H}" fill="#3a0f1c"/><circle cx="${f(W * 0.5)}" cy="${f(H * 0.72)}" r="${f(H * 0.5)}" fill="#c9a24a" opacity="0.9"/><rect y="${f(H * 0.72)}" width="${W}" height="${f(H * 0.3)}" fill="#3a0f1c"/>`;
  for (let i = 0; i < 6; i++) s += `<path d="${vague(W, H * (0.52 + i * 0.09), 7 + i, W / (2.4 + i * 0.35), i * 1.1)}" fill="none" stroke="${i % 2 ? "#e6c473" : "#c9a24a"}" stroke-width="${i === 0 ? 3 : 2}"/>`;
  return s + `<path d="${vague(W, H * 0.98, 5, W / 4, 0.5, H)}" fill="#6b1d33"/>`;
};
// 431 — emblème gravé (cercles, V, étoiles en losange, lauriers)
const emblemeGrave = (W, H) => {
  const c = W / 2; let s = `<circle cx="${c}" cy="${c}" r="${f(c - 6)}" fill="none" stroke="#b07d2a" stroke-width="3"/><circle cx="${c}" cy="${c}" r="${f(c - 16)}" fill="none" stroke="#1e2a4a" stroke-width="1.2"/><circle cx="${c}" cy="${c}" r="${f(c * 0.55)}" fill="#1e2a4a"/>`;
  s += `<path d="M${f(c - c * 0.26)} ${f(c - c * 0.24)} L${c} ${f(c + c * 0.28)} L${f(c + c * 0.26)} ${f(c - c * 0.24)}" fill="none" stroke="#f1e6c9" stroke-width="${f(c * 0.07)}"/><line x1="${f(c - c * 0.3)}" y1="${f(c - c * 0.24)}" x2="${f(c + c * 0.3)}" y2="${f(c - c * 0.24)}" stroke="#b07d2a" stroke-width="${f(c * 0.04)}"/>`;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.2832, x = c + Math.cos(a) * (c - 26), y = c + Math.sin(a) * (c - 26); s += `<rect x="${f(x - 4)}" y="${f(y - 4)}" width="8" height="8" fill="#b07d2a" transform="rotate(45 ${f(x)} ${f(y)})"/>`; }
  for (let i = 0; i < 6; i++) { const a = 2.4 + i * 0.22; s += `<ellipse cx="${f(c - Math.cos(a - 1.2) * c * 0.7)}" cy="${f(c + Math.sin(a - 1.2) * c * 0.7 + 4)}" rx="11" ry="4.5" fill="#b07d2a" transform="rotate(${50 - i * 18} ${f(c - Math.cos(a - 1.2) * c * 0.7)} ${f(c + Math.sin(a - 1.2) * c * 0.7 + 4)})"/>`; }
  return s;
};
// 431 — bandeau guilloché (cercles entrelacés)
const guilloche = (W, H) => {
  let s = `<rect width="${W}" height="${H}" fill="#1e2a4a"/>`; const n = Math.ceil(W / 28);
  for (let i = 0; i <= n; i++) for (let j = 0; j < 3; j++) s += `<circle cx="${i * 28}" cy="${f(H / 2)}" r="${14 + j * 8}" fill="none" stroke="${j === 1 ? "#d6a24a" : "#7a86a8"}" stroke-width="1" opacity="0.75"/>`;
  return s;
};
// 432 — cloche de comptoir et clés, trait rose doré
const clocheCles = (W, H) => {
  const R = "#e8b89c", c = W / 2; let s = `<rect x="${f(W * 0.16)}" y="${f(H * 0.86)}" width="${f(W * 0.68)}" height="8" fill="${R}"/><path d="M${f(W * 0.2)} ${f(H * 0.86)} A${f(W * 0.3)} ${f(W * 0.3)} 0 0 1 ${f(W * 0.8)} ${f(H * 0.86)} Z" fill="none" stroke="${R}" stroke-width="5"/><path d="M${f(W * 0.28)} ${f(H * 0.78)} A${f(W * 0.22)} ${f(W * 0.22)} 0 0 1 ${f(W * 0.46)} ${f(H * 0.52)}" fill="none" stroke="${R}" stroke-width="3" opacity="0.6"/>`;
  s += `<rect x="${f(c - 5)}" y="${f(H * 0.3)}" width="10" height="${f(H * 0.1)}" fill="${R}"/><rect x="${f(c - 18)}" y="${f(H * 0.24)}" width="36" height="9" fill="${R}"/><rect x="${f(c + 14)}" y="${f(H * 0.5)}" width="10" height="10" fill="#e7e5e0"/>`;
  s += `<g transform="translate(${f(W * 0.7)} ${f(H * 0.1)}) rotate(28)"><circle cx="0" cy="0" r="16" fill="none" stroke="${R}" stroke-width="5"/><rect x="-2.5" y="14" width="5" height="64" fill="${R}"/><rect x="2.5" y="52" width="14" height="5" fill="${R}"/><rect x="2.5" y="64" width="10" height="5" fill="${R}"/></g>`;
  for (let i = 0; i < 6; i++) s += `<rect x="${f(W * 0.08 + i * (W * 0.84) / 5)}" y="${f(H * 0.94)}" width="${f(W * 0.05)}" height="4" fill="${R}" opacity="0.5"/>`;
  return s;
};
// 433 — lune, arcades et marches (halo en cercles concentriques)
const arcades = (W, H) => {
  let s = bandesV(W, 0, H * 0.7, "#26092f", "#5e2a6a", 10) + etoiles(W, H * 0.6, 30, 433, "#f6ead2", 1.3);
  s += halo(W * 0.5, H * 0.3, H * 0.46, "#f3d79a", 14, 0.07) + `<circle cx="${f(W * 0.5)}" cy="${f(H * 0.3)}" r="${f(H * 0.13)}" fill="#f3d79a"/><circle cx="${f(W * 0.5 + H * 0.06)}" cy="${f(H * 0.3 - H * 0.03)}" r="${f(H * 0.115)}" fill="#3b1245"/>`;
  const n = W < 700 ? 3 : 5, aw = W / n;
  s += `<rect y="${f(H * 0.52)}" width="${W}" height="${f(H * 0.48)}" fill="#26092f"/>`;
  for (let i = 0; i < n; i++) s += `<path d="M${f(i * aw + aw * 0.14)} ${f(H * 0.88)} V${f(H * 0.68)} A${f(aw * 0.36)} ${f(aw * 0.36)} 0 0 1 ${f(i * aw + aw * 0.86)} ${f(H * 0.68)} V${f(H * 0.88)} Z" fill="#f3d79a" opacity="${i === Math.floor(n / 2) ? 0.95 : 0.55}"/><rect x="${f(i * aw + aw * 0.02)}" y="${f(H * 0.5)}" width="${f(aw * 0.06)}" height="${f(H * 0.4)}" fill="#f3d79a" opacity="0.4"/>`;
  for (let i = 0; i < 4; i++) s += `<rect x="${f(W * 0.06 + i * W * 0.01)}" y="${f(H * 0.9 + i * H * 0.025)}" width="${f(W * 0.88 - i * W * 0.02)}" height="${f(H * 0.02)}" fill="#f3d79a" opacity="${0.8 - i * 0.15}"/>`;
  return s;
};
// petits glyphes de marque (48 x 48) pour les barres d'en-tête
const glyphes = {
  rose: (c1, c2) => `<rect x="21" y="2" width="6" height="44" fill="${c1}"/><rect x="2" y="21" width="44" height="6" fill="${c1}"/><polygon points="24,8 30,24 24,40 18,24" fill="${c2}"/><rect x="21" y="21" width="6" height="6" fill="${c1}"/>`,
  croissant: (c1, c2) => `<circle cx="24" cy="24" r="20" fill="${c1}"/><circle cx="31" cy="19" r="17" fill="${c2}"/><rect x="34" y="30" width="8" height="8" fill="${c1}"/>`,
  fusee: (c1, c2) => `<path d="M24 2 Q38 16 36 34 H12 Q10 16 24 2 Z" fill="${c1}"/><polygon points="12,34 2,44 12,26" fill="${c2}"/><polygon points="36,34 46,44 36,26" fill="${c2}"/><rect x="19" y="14" width="10" height="10" fill="${c2}"/><polygon points="18,36 30,36 24,46" fill="${c2}"/>`,
  emblem: (c1, c2) => `<circle cx="24" cy="24" r="21" fill="none" stroke="${c1}" stroke-width="3"/><path d="M13 14 L24 36 L35 14" fill="none" stroke="${c2}" stroke-width="5"/><rect x="21" y="3" width="6" height="6" fill="${c1}" transform="rotate(45 24 6)"/>`,
  cloche: (c1, c2) => `<path d="M6 34 A18 18 0 0 1 42 34 Z" fill="${c1}"/><rect x="3" y="36" width="42" height="5" fill="${c1}"/><rect x="21" y="8" width="6" height="6" fill="${c2}"/>`,
  arche: (c1, c2) => `<rect x="4" y="40" width="40" height="5" fill="${c1}"/><path d="M8 40 V22 A16 16 0 0 1 40 22 V40 Z" fill="none" stroke="${c1}" stroke-width="4"/><path d="M17 40 V24 A7 7 0 0 1 31 24 V40 Z" fill="${c2}"/>`,
};
const glyphe = (k, nom, c1, c2, t = 44) => dessin(k, 48, 48, glyphes[nom](c1, c2), { width: `${t}px`, flexShrink: 0 });

// ═══ Gestes communs aux deux familles ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// Réseaux en pastilles d'icônes (carrés de 44 px, couleurs propres à chaque réseau ou à la maison)
function reseauxIcones(k, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = String(o.taille || 44); n.props.shape = o.forme || "square";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ color: o.couleur || S.fg, backgroundColor: o.fond, borderRadius: "0px", transitionDuration: DOUX, borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? "1.5px" : undefined, borderColor: o.contour }) },
    states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, borderColor: o.survolFond || S.accent }, focus: GK.focus(o.focus || S.accent) } });
  return n;
}
// Mention en italique (copyright) : même widget que la ligne légale mais lisible sur fond sombre
const bas = (G, k, env, o = {}) => G.ligneLegale({ taille: o.taille || 13, couleur: o.couleur, liens: o.liens, sansCookies: true, pile: o.pile })(k, env, o.centre);

// Composition « capture 40 » : grande marque + lettre à gauche, colonnes de liens à droite, filet, mentions à gauche et pastilles de réseaux à droite
function pied40(k, env, G, o) {
  const S = k.S, bandes = [], H = ["0px", "0px", "0px"];
  const art = (nodes, fond, nom) => G.bande(k, nodes, { fond, colonne: true, aligne: "stretch", gap: "0px", max: "100%", padV: H, padB: H, padH: o.artPlein ? H : MARGES, nom });
  if (o.artHaut) bandes.push(art(o.artHaut, o.fondArtHaut || o.fond, "Illustration haute"));
  const colO = { titre: o.accent, lien: o.fg, survol: o.accent, base: "150px", min: "130px", ...(o.colO || {}) };
  const gauche = k.col([...(o.avant || []), ...o.nom, ...(o.lettre ? [lettre(k, env, o.lettre)] : [])], { flexGrow: 1, flexBasis: o.baseG || "44%", minWidth: "280px", gap: "34px", justifyContent: "flex-start" });
  const droite = k.row([...(o.colonnes || []).map(([t, it]) => colLiens(k, t, it, colO)), ...(o.extraDroite || [])], { flexGrow: 1, flexBasis: o.baseD || "46%", minWidth: "280px", rowGap: "30px", columnGap: "28px", alignItems: "flex-start" });
  bandes.push(G.bande(k, [gauche, droite], { fond: o.fond, aligne: "flex-start", gap: "48px 64px", padV: o.padV || ["72px", "56px", "40px"], padB: o.padB || ["40px", "32px", "28px"], padH: MARGES, nom: "Marque et liens" }));
  if (o.artMilieu) bandes.push(art(o.artMilieu, o.fondArtMilieu || o.fond, "Illustration"));
  const mentions = k.col([bas(G, k, env, { couleur: o.mute, liens: o.fg })], { flexGrow: 1, flexBasis: "320px", minWidth: "260px" });
  const reseaux = reseauxIcones(k, env, o.reseaux.liste || ["facebook", "instagram", "x"], o.reseaux);
  bandes.push(G.bande(k, [trait(k, o.ligne || "#ffffff40"), k.row([mentions, reseaux], { width: "100%", alignItems: "center", rowGap: "14px", columnGap: "24px", justifyContent: "space-between" })], { fond: o.fondBas || o.fond, colonne: true, aligne: "stretch", gap: "20px", padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: MARGES, nom: "Mentions et réseaux" }));
  if (o.artBas) bandes.push(art(o.artBas, o.fondArtBas || o.fond, "Illustration basse"));
  bandes.forEach((b) => { b.styles.desktop.color = o.fg; });
  return [G.racine(k, bandes)];
}
// Composition « capture 41 » : barre marque + pastilles de réseaux, filet, colonnes à petit soulignement + abonnement, bande sombre de mentions
function pied41(k, env, G, o) {
  const bandes = [], H = ["0px", "0px", "0px"];
  const art = (nodes, fond, nom) => G.bande(k, nodes, { fond, colonne: true, aligne: "stretch", gap: "0px", max: "100%", padV: H, padB: H, padH: o.artPlein ? H : MARGES, nom });
  const reseaux = reseauxIcones(k, env, o.reseaux.liste || ["facebook", "x", "instagram", "linkedin", "youtube"], o.reseaux);
  bandes.push(G.bande(k, [k.row(o.marque, { alignItems: "center", columnGap: "16px", rowGap: "10px", flexWrap: "nowrap" }), reseaux], { fond: o.fond, aligne: "center", gap: "16px 32px", padV: o.padH1 || ["36px", "30px", "24px"], padB: o.padH1 || ["36px", "30px", "24px"], padH: MARGES, nom: "Marque et réseaux" }));
  if (o.artSous) bandes.push(art(o.artSous, o.fondArt || o.fond, "Illustration"));
  else if (!o.sansFilet) bandes.push(G.bande(k, [trait(k, o.ligne || "#ffffff40", "1px")], { fond: o.fond, colonne: true, padV: H, padB: H, padH: MARGES, nom: "Filet" }));
  const colO = { titre: o.titre, lien: o.fg, survol: o.accent, filet: o.accent, base: "150px", min: "130px", ...(o.colO || {}) };
  const cols = [...(o.artCol || []), ...o.colonnes.map(([t, it]) => colLiens(k, t, it, colO)), ...(o.fin || [])];
  bandes.push(G.bande(k, [k.row(cols, { width: "100%", rowGap: "32px", columnGap: "36px", alignItems: "flex-start" })], { fond: o.fond, colonne: true, aligne: "stretch", gap: "0px", padV: o.padV || ["48px", "40px", "32px"], padB: o.padVB || ["56px", "44px", "36px"], padH: MARGES, nom: "Colonnes" }));
  if (o.artBas) bandes.push(art(o.artBas, o.fondArt || o.fond, "Illustration basse"));
  bandes.push(G.bande(k, [bas(G, k, env, { couleur: o.muteBas || o.mute, liens: o.fgBas || o.fg })], { fond: o.fondBas, colonne: true, aligne: "stretch", padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: MARGES, nom: "Mentions" }));
  bandes.forEach((b) => { b.styles.desktop.color = o.fg; });
  return [G.racine(k, bandes)];
}

module.exports = { pied40, pied41, DOUX, racineDe, lien, caps, trait, souffle, carre, partie, horaires, coordonnees, bloc, abonnement, bouton, barre, lettre, MARGES, para, indexLigne, filetC, reseauxEx, colLiens, reseauxIcones, bas, alea, f, enveloppe, dessin, duo, vague, etoiles, glyphe, art: { horizonRadar, planete, pisteAvion, nuagesRoute, crete, fusee, blason, vignettes, vaguesOr, emblemeGrave, guilloche, clocheCles, arcades } };
