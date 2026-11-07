// Réglages d'un EN-TÊTE de site (Header Builder, lot L0) : un bloc VALIDÉ porté par la section de l'en-tête (`section.header`),
// à la place de l'ancienne lecture « sur le premier enfant » (position de son style de bureau + `props.headerFx`).
//
//   section.header = { v:1, mode, fx, threshold, offset, zIndex, stickOn, shrink, hideOnScroll }
//
// - mode      : "static" (ordinaire) · "sticky" (collé en haut) · "fixed" (fixé, hors flux) · "overlay" (superposé au visuel d'ouverture)
// - fx        : "" · "shrink" (les rangées se réduisent) · "solid" (un en-tête superposé devient plein) · "both"
// - threshold : défilement (px) à partir duquel l'en-tête passe à l'état « défilé » (classe is-scrolled)
// - offset    : décalage haut (px) d'un en-tête collé ou fixé (ex. sous une barre d'administration)
// - zIndex    : niveau d'empilement (1 à 100, 60 par défaut)
// - stickOn   : appareils sur lesquels l'en-tête colle : desktop, tablet, mobile
// - shrink    : { height } hauteur (px) de la rangée après réduction (24 à 120)
// - hideOnScroll : { enabled, tolerance } masqué quand on descend, réapparaît quand on remonte
//
// Aucun HTML, CSS ni JS libre : tout est validé ici. Compatibilité : sans `section.header`, l'ancien format (premier enfant) est lu à l'identique.
// Un seul lecteur pour le rendu de page (_sections.ejs) et le rendu des parties globales (themeRender.partMode).

const MODES = ["static", "sticky", "fixed", "overlay"];
const FX = ["shrink", "solid", "both"];
const DEVICES = ["desktop", "tablet", "mobile"];

const int = (v, min, max, dflt) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : dflt; };
const bool = (v) => v === true || v === "true" || v === 1 || v === "1";

// Valide un bloc brut (venant de l'éditeur ou d'un import) : valeurs inconnues ignorées, bornes appliquées.
function normalize(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const mode = MODES.includes(raw.mode) ? raw.mode : "static";
  const fx = FX.includes(raw.fx) ? raw.fx : "";
  const stickOn = Array.isArray(raw.stickOn) ? DEVICES.filter((d) => raw.stickOn.includes(d)) : DEVICES.slice();
  const shrink = raw.shrink && typeof raw.shrink === "object" ? { height: int(raw.shrink.height, 24, 120, 32) } : { height: 32 };
  const hide = raw.hideOnScroll && typeof raw.hideOnScroll === "object" ? { enabled: bool(raw.hideOnScroll.enabled), tolerance: int(raw.hideOnScroll.tolerance, 0, 100, 8) } : { enabled: false, tolerance: 8 };
  return {
    v: 1, mode, fx: mode === "static" ? "" : fx,
    threshold: int(raw.threshold, 0, 1000, 8), offset: int(raw.offset, 0, 200, 0), zIndex: int(raw.zIndex, 1, 100, 60),
    stickOn: stickOn.length ? stickOn : DEVICES.slice(), shrink, hideOnScroll: hide,
  };
}

// Ancien format : position de la première bande (style de bureau) et headerFx de son conteneur.
function legacyOf(section) {
  const first = section && Array.isArray(section.children) ? section.children[0] : null;
  const pos = first && first.styles && first.styles.desktop ? first.styles.desktop.position : "";
  const fx = first && first.props && FX.includes(first.props.headerFx) ? first.props.headerFx : "";
  const mode = pos === "sticky" ? "sticky" : pos === "absolute" ? "overlay" : "static";
  return normalize({ mode, fx: mode === "static" ? "" : fx });
}

// Réglages effectifs d'une section d'en-tête : le bloc `header` s'il existe, sinon l'ancien format.
function resolve(section) {
  if (!section || typeof section !== "object") return normalize({});
  return normalize(section.header) || legacyOf(section);
}

// Classes de l'enveloppe (celle que la page fait défiler) : identiques à l'ancien format pour sticky / overlay.
function classes(section) {
  const h = resolve(section);
  const base = h.mode === "sticky" ? " kw-theme-sticky" : h.mode === "overlay" ? " kw-theme-overlay" : h.mode === "fixed" ? " kw-theme-fixed" : "";
  return base + (h.fx && h.mode !== "static" ? ` kw-theme-fx-${h.fx}` : "");
}

// Données publiques lues par le script du visiteur (data-kw-*) : seulement des nombres et des mots d'une liste fermée.
// L0 : mêmes attributs que l'ancien format (data-kw-scroll seulement s'il y a un effet) ; le seuil n'est écrit que s'il diffère de 8 px.
function dataAttrs(section) {
  const h = resolve(section);
  const a = {};
  if (h.fx && h.mode !== "static") { a["data-kw-scroll"] = h.fx; if (h.threshold !== 8) a["data-kw-threshold"] = String(h.threshold); }
  return a;
}

module.exports = { MODES, FX, DEVICES, normalize, resolve, classes, dataAttrs };
