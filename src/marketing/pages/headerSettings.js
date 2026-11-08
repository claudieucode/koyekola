// Réglages d'un EN-TÊTE de site (Header Builder, lot L0) : un bloc VALIDÉ porté par la section de l'en-tête (`section.header`),
// à la place de l'ancienne lecture « sur le premier enfant » (position de son style de bureau + `props.headerFx`).
//
//   section.header = { v:1, mode, fx, threshold, offset, zIndex, stickOn, shrink, hideOnScroll }
//
// - mode      : "static" (ordinaire) · "sticky" (collé en haut) · "fixed" (fixé en haut, reste dans le flux : aucun espaceur ni saut de contenu) · "overlay" (superposé au visuel d'ouverture)
// - fx        : "" · "shrink" (les rangées se réduisent) · "solid" (un en-tête superposé devient plein) · "both"
// - threshold : défilement (px) à partir duquel l'en-tête passe à l'état « défilé » (classe is-scrolled)
// - offset    : décalage haut (px) d'un en-tête collé ou fixé (ex. sous une barre d'administration)
// - zIndex    : niveau d'empilement (1 à 100, 60 par défaut)
// - stickOn   : appareils sur lesquels l'en-tête colle : desktop, tablet, mobile
// - shrink    : { height } hauteur (px) de la rangée après réduction (24 à 120)
// - hideOnScroll : { enabled, tolerance } masqué quand on descend, réapparaît quand on remonte
// - edge      : "top" (par défaut) ou "bottom" : barre collée en BAS de l'écran (collé / fixé seulement) ; reserve = hauteur (px, 32 à 200) réservée à sa place dans la page : aucun saut de contenu
//
// Aucun HTML, CSS ni JS libre : tout est validé ici. Compatibilité : sans `section.header`, l'ancien format (premier enfant) est lu à l'identique.
// Un seul lecteur pour le rendu de page (_sections.ejs) et le rendu des parties globales (themeRender.partMode).

const MODES = ["static", "sticky", "fixed", "overlay"];
const FX = ["shrink", "solid", "both"];
const LEGACY_FX = [...FX, "hide"]; // ancien format : « hide » = l'en-tête se cache en descendant (réglage historique, conservé tel quel)
const DEVICES = ["desktop", "tablet", "mobile"];

const int = (v, min, max, dflt) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : dflt; };
const bool = (v) => v === true || v === "true" || v === 1 || v === "1";

// Valide un bloc brut (venant de l'éditeur ou d'un import) : valeurs inconnues ignorées, bornes appliquées.
function normalize(raw, { legacy = false } = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const mode = MODES.includes(raw.mode) ? raw.mode : "static";
  // Bloc `header` : « masquer » est le réglage hideOnScroll (un effet « hide » reçu est converti) ; ancien format : « hide » reste un effet, comme avant
  const converted = !legacy && raw.fx === "hide";
  const fx = (legacy ? LEGACY_FX : FX).includes(raw.fx) ? raw.fx : "";
  const stickOn = Array.isArray(raw.stickOn) ? DEVICES.filter((d) => raw.stickOn.includes(d)) : DEVICES.slice();
  const shrink = raw.shrink && typeof raw.shrink === "object" ? { height: int(raw.shrink.height, 24, 120, 32) } : { height: 32 };
  const hide = converted ? { enabled: true, tolerance: 6 } : raw.hideOnScroll && typeof raw.hideOnScroll === "object" ? { enabled: bool(raw.hideOnScroll.enabled), tolerance: int(raw.hideOnScroll.tolerance, 0, 100, 8) } : { enabled: false, tolerance: 8 };
  return {
    v: 1, mode, fx: mode === "static" ? "" : fx,
    threshold: int(raw.threshold, 0, 1000, 8), offset: int(raw.offset, 0, 200, 0), zIndex: int(raw.zIndex, 1, 100, 60),
    stickOn: stickOn.length ? stickOn : DEVICES.slice(), shrink, hideOnScroll: hide,
    edge: raw.edge === "bottom" && (mode === "sticky" || mode === "fixed") ? "bottom" : "top", reserve: int(raw.reserve, 32, 200, 72),
  };
}

// Ancien format : position de la première bande (style de bureau) et headerFx de son conteneur.
function legacyOf(section) {
  const first = section && Array.isArray(section.children) ? section.children[0] : null;
  const pos = first && first.styles && first.styles.desktop ? first.styles.desktop.position : "";
  const fx = first && first.props && LEGACY_FX.includes(first.props.headerFx) ? first.props.headerFx : "";
  const mode = pos === "sticky" ? "sticky" : pos === "absolute" ? "overlay" : "static";
  return normalize({ mode, fx: mode === "static" ? "" : fx }, { legacy: true });
}

// Réglages effectifs d'une section d'en-tête : le bloc `header` s'il existe, sinon l'ancien format.
function resolve(section) {
  if (!section || typeof section !== "object") return normalize({});
  return normalize(section.header) || legacyOf(section);
}

// Classes de l'enveloppe (celle que la page fait défiler) : identiques à l'ancien format pour sticky / overlay.
// kw-hdr-no-<appareil> : l'en-tête collé / fixé redevient ordinaire sur cet appareil (réglage « Coller sur »).
function classes(section) {
  const h = resolve(section);
  const base = h.mode === "sticky" ? " kw-theme-sticky" : h.mode === "overlay" ? " kw-theme-overlay" : h.mode === "fixed" ? " kw-theme-fixed" : "";
  const off = h.mode === "sticky" || h.mode === "fixed" ? DEVICES.filter((d) => !h.stickOn.includes(d)).map((d) => ` kw-hdr-no-${d}`).join("") : "";
  return base + off + (h.edge === "bottom" ? " kw-theme-bottom" : "") + (h.fx && h.mode !== "static" ? ` kw-theme-fx-${h.fx}` : "");
}

// Données publiques lues par le script du visiteur (data-kw-*) et variables CSS : seulement des nombres entiers bornés et des mots d'une liste fermée.
//  - data-kw-scroll : effet (shrink / solid / both) ou « watch » (simple suivi de l'état « défilé » pour les styles par état)
//  - data-kw-threshold : seuil de défilement en px (écrit seulement s'il diffère de 8)
//  - data-kw-hide, data-kw-hide-tol : masquage en descendant, réapparition en remontant (tolérance en px)
//  - style : --kw-hdr-top (décalage), --kw-hdr-z (empilement), --kw-hdr-shrink (hauteur du logo réduit)
const hasAlt = (list) => (list || []).some((c) => c && ((["sitelogo", "sitetitle"].includes(c.type) && c.props && (c.props.scrollHeight || c.props.scrollText)) || hasAlt(c.children)));
function dataAttrs(section) {
  const h = resolve(section);
  const a = {};
  if (h.mode === "static") return a;
  a["data-kw-scroll"] = h.fx || (section && hasAlt(section.children) ? "track" : "watch"); // « track » : un logo ou un titre alternatif au défilement a besoin de l'état défilé
  if (h.threshold !== 8) a["data-kw-threshold"] = String(h.threshold);
  if (h.hideOnScroll.enabled) { a["data-kw-hide"] = "1"; a["data-kw-hide-tol"] = String(h.hideOnScroll.tolerance); }
  const vars = [];
  if (h.offset) vars.push(`--kw-hdr-top:${h.offset}px`);
  if (h.zIndex !== 60) vars.push(`--kw-hdr-z:${h.zIndex}`);
  if (h.edge === "bottom") vars.push(`--kw-hdr-h:${h.reserve}px`);
  if (h.shrink.height !== 32) vars.push(`--kw-hdr-shrink:${h.shrink.height}px`);
  if (vars.length) a.style = vars.join(";");
  return a;
}

module.exports = { MODES, FX, DEVICES, normalize, resolve, classes, dataAttrs };
