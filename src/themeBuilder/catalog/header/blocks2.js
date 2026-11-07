// Briques supplémentaires de la bibliothèque d'en-têtes : formes décoratives en CSS natif, titre monumental, ticker, blocs d'information, navigations en mosaïque / verticale,
// bouton hamburger + menu plein écran (ordinateur compris), pastille de panier. Contrat et limites : docs/theme-builder/HEADER_SECTOR_CONTRACT.md.
// Règle commune : aucune image, aucune coordonnée inventée, aucun positionnement absolu dans une rangée (flex/grille et points de rupture natifs) ; couleurs et polices = identité fixe du modèle (k.S).
const { sty, compact } = require("../kit");
const { nav } = require("./blocks");

const hide = (o) => (o && o.hideOn ? { hideOn: o.hideOn } : {});

// ── Formes décoratives (conteneurs vides : fond uni ou dégradé, arrondi, inclinaison ; jamais d'image) ──
// Disque ou cercle plein / dégradé. o : size (px), color, gradient { from, to, angle }, hideOn
const disc = (k, o = {}) => ({ type: "container", children: [], ...sty(compact({ width: `${o.size || 56}px`, height: `${o.size || 56}px`, borderRadius: "999px", ...(o.gradient ? { gradient: o.gradient } : { backgroundColor: o.color || k.S.accent }), flexShrink: 0, opacity: o.opacity })), ...hide(o) });
// Anneau (cercle contour)
const ring = (k, o = {}) => ({ type: "container", children: [], ...sty(compact({ width: `${o.size || 56}px`, height: `${o.size || 56}px`, borderRadius: "999px", borderStyle: "solid", borderWidth: o.w || "2px", borderColor: o.color || k.S.accent, flexShrink: 0 })), ...hide(o) });
// Bandeau diagonal (parallélogramme) : o : w, h (px), angle (-60..60), color / gradient
const slash = (k, o = {}) => ({ type: "container", children: [], ...sty(compact({ width: `${o.w || 120}px`, height: `${o.h || 40}px`, ...(o.gradient ? { gradient: o.gradient } : { backgroundColor: o.color || k.S.accent }), transform: { skewX: o.angle ?? -20 }, flexShrink: 0 })), ...hide(o) });
// Bande pleine largeur en dégradé (liseré de couleur) : o : h (px), gradient { from, to, angle }
const stripe = (k, o = {}) => ({ type: "container", props: { full: true }, children: [], ...sty(compact({ width: "100%", height: `${o.h || 6}px`, gradient: o.gradient || { from: k.S.accent, to: k.S.fg, angle: 90 } })) });
// Filet vertical (séparateur de cellules) : o : h (px), w, color
const vrule = (k, o = {}) => ({ type: "container", children: [], ...sty(compact({ width: o.w || "1px", height: `${o.h || 32}px`, backgroundColor: o.color || k.S.line, flexShrink: 0 })), ...hide(o) });
// Pavé de couleur (case pleine) pouvant porter du contenu : o : bg, w (px mini), pad
const slab = (k, children, o = {}) => ({ type: "group", children, ...sty(compact({ display: "flex", flexDirection: "row", alignItems: "center", gap: o.gap || "12px", backgroundColor: o.bg || k.S.accent, color: o.fg || k.S.onAccent, paddingTop: o.padV || "10px", paddingBottom: o.padV || "10px", paddingLeft: o.padH || "20px", paddingRight: o.padH || "20px", borderRadius: o.radius, ...(o.st || {}) })) });

// ── Titre monumental : nom du site à taille fluide (lisible dès 320 px, jamais de calc() libre) ──
// o : min, max (px entiers 8–200), font, weight, caps, track, color, italic, lh
const monument = (k, o = {}) => ({ type: "sitetitle", props: { tag: "p", link: true },
  parts: { link: { styles: { desktop: compact({ fontFamily: o.font || k.S.head, fontWeight: o.weight || k.S.weight, textTransform: o.caps, letterSpacing: o.track, color: o.color || k.S.fg, fontStyle: o.italic ? "italic" : undefined }) } } },
  ...sty(compact({ color: o.color || k.S.fg, fontFamily: o.font || k.S.head, fontWeight: o.weight || k.S.weight, fontSize: `fluid:${o.min || 40}-${o.max || 120}`, lineHeight: o.lh || 0.95, textTransform: o.caps, letterSpacing: o.track, fontStyle: o.italic ? "italic" : undefined, overflowWrap: "anywhere", ...(o.st || {}) })) });

// ── Ticker : bande de textes qui défile (widget natif « marquee » : pause au survol et au clavier, immobile en mouvement réduit) ──
// items : textes (annonces à personnaliser) ; o : speed slow|normal|fast, direction left|right, sep, color, bg, size, caps, track, font
const ticker = (k, items, o = {}) => ({ type: "marquee", props: { items: items.map((text) => ({ text })), speed: o.speed || "normal", direction: o.direction || "left", separator: o.sep ?? "•", pauseHover: o.pause !== false, label: o.label || "Informations défilantes" },
  ...sty(compact({ backgroundColor: o.bg, color: o.color || k.S.fg, fontFamily: o.font || k.S.font, fontSize: o.size || "13px", fontWeight: o.weight || "600", textTransform: o.caps, letterSpacing: o.track, paddingTop: o.padV || "8px", paddingBottom: o.padV || "8px", width: "100%" })) });

// ── Blocs d'information : consignes à remplacer (jamais de numéro, d'adresse ou d'horaire inventé) ──
const INFO = { hours: { icon: "clock", text: "Vos horaires d'ouverture" }, phone: { icon: "smartphone", text: "Votre téléphone" }, address: { icon: "mapPin", text: "Votre adresse" }, mail: { icon: "mail", text: "Votre adresse e-mail" } };
// kinds : ["hours","phone","address","mail"] ; o : inline (true par défaut : une ligne), color, icon, size, gap, hideOn (défaut : mobile)
// En ligne, chaque information est sa propre liste d'une entrée dans un groupe flex : une liste « en ligne » (is-inline) impose display:flex et résisterait au masquage sur mobile (hideOn) ; une liste simple se masque bien.
const info = (k, kinds, o = {}) => {
  const one = (items) => ({ type: "iconlist", props: { items: items.map((x) => ({ text: (INFO[x] || INFO.phone).text, icon: (INFO[x] || INFO.phone).icon })), inline: false, iconColor: o.icon || k.S.accent },
    ...sty(compact({ color: o.color || k.S.fg, fontFamily: o.font || k.S.font, fontSize: o.size || "13px", ...(o.st || {}) })), hideOn: o.hideOn || ["mobile"] });
  if (o.inline === false) return one(kinds);
  return { type: "group", children: kinds.map((x) => one([x])), ...sty(compact({ display: "flex", flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: o.gap || "10px" })) };
};

// ── Navigations ──
// Navigation en MOSAÏQUE : les liens du menu affecté forment des cases (bordure + remplissage) qui passent à la ligne dans un bloc de largeur bornée (o.w, px) ; ce n'est PAS une grille à colonnes
// (la partie « Liste » du menu n'accepte que flex : voir le contrat). o : w (px, défaut 420), gap, border (couleur), bg (fond des cases), padV, padH
function navTiles(k, kind = "box", o = {}) {
  const n = nav(k, kind, { ...o });
  const S = k.S, base = n.parts.link.styles.desktop;
  n.parts = { ...n.parts,
    list: { styles: { desktop: { display: "flex", flexWrap: "wrap", gap: o.gap || "8px", maxWidth: `${o.w || 420}px` }, mobile: { maxWidth: "100%" } } },
    link: { styles: { desktop: { ...base, paddingTop: o.padV || "10px", paddingBottom: o.padV || "10px", paddingLeft: o.padH || "16px", paddingRight: o.padH || "16px", borderStyle: "solid", borderWidth: "1px", borderColor: o.border || S.line, ...(o.bg ? { backgroundColor: o.bg } : {}) } }, states: n.parts.link.states || { hover: { backgroundColor: S.accent, color: S.onAccent }, focus: { backgroundColor: S.accent, color: S.onAccent } } } };
  return n;
}
// Navigation VERTICALE (liens empilés) : alias explicite de nav(..., { vertical: true })
const navStack = (k, kind = "plain", o = {}) => nav(k, kind, { ...o, vertical: true });

// ── Bouton hamburger + menu plein écran (ORDINATEUR ET MOBILE) : widget natif « Menu plein écran animé » lu dans le menu affecté à « En-tête » ──
// o : buttonLabel, closeLabel, numbers (true), align left|center, preset fade|slide-down|slide-right|circle, duration, stagger, color, size, font, bg, caps, track
const fsMenu = (k, o = {}) => ({ type: "motionfsmenu", props: { source: "location", label: o.label || "Menu principal", buttonLabel: o.buttonLabel || "Menu", closeLabel: o.closeLabel || "Fermer", links: [{ label: "Accueil", url: "/" }, { label: "Contact", url: "/contact" }], numbers: o.numbers !== false, align: o.align || "left" },
  motion: { studio: { preset: o.preset || "circle", duration: o.duration || 500, delay: 0, easing: "smooth", stagger: o.stagger || 70 } },
  ...sty(compact({ color: o.color || k.S.fg, fontFamily: o.font || k.S.font, fontSize: o.size || "15px", fontWeight: "700", textTransform: o.caps, letterSpacing: o.track })) });

// ── Pastille de panier : mini-panier du site (nombre réel d'articles) avec pastille colorée ──
const cartPill = (k, o = {}) => ({ type: "minicart", props: { label: o.label || "Panier", showCount: true, hideEmpty: false },
  parts: { count: { styles: { desktop: compact({ backgroundColor: o.bg || k.S.accent, color: o.fg || k.S.onAccent, borderRadius: "999px", fontSize: "11px", fontWeight: "700" }) } } },
  ...sty(compact({ color: o.color || k.S.fg, fontFamily: k.S.font, fontWeight: "600" })) });

module.exports = { disc, ring, slash, stripe, vrule, slab, monument, ticker, info, navTiles, navStack, fsMenu, cartPill, INFO };
