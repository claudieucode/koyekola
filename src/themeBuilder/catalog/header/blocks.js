// Briques de la bibliothèque d'en-têtes « Atelier » : chaque modèle assemble ces briques selon SON architecture (arch.js) et SON identité (models.js).
// Tout est natif du Page Builder (grammaire fermée) : conteneurs flex/grille, titres, logo et titre du site, menu AFFECTÉ à l'emplacement « En-tête » (aucun lien inventé), recherche, compte, mini-panier,
// boutons, réseaux. Aucune image factice, aucun positionnement absolu à l'intérieur d'une rangée : le responsive passe par flex/grille et les points de rupture natifs.
const { sty, compact } = require("../kit");

// ── Identité propre d'un modèle : couleurs FIXES et polices de la bibliothèque locale (jamais la charte du site ni celle de l'administration) ──
const ID = (key, label, o) => ({
  key, label, bg: "#ffffff", fg: "#111111", mute: "#555555", alt: "#f3f3f3", accent: "#111111", onAccent: "#ffffff", line: "#dddddd",
  radius: "0px", btnRadius: "0px", shadow: "none", font: "font.inter", head: "font.inter", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single",
  ...o,
});

// ── Éléments ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const lumOf = (h) => { const m = /^#([0-9a-f]{6})/i.exec(h); if (!m) return 0.5; const v = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const readable = (bg) => (lumOf(bg) < 0.4 ? "#ffffff" : "#111111");
const fam = (S, role) => (role === "head" ? S.head : S.font);
const txt = (S, o = {}) => compact({ color: S.fg, fontFamily: S.font, ...o });

// Marque : logo du site (image), titre du site (texte), ou les deux. Le titre prend la police de titres du modèle.
function mark(k, o = {}) {
  const S = k.S, kind = o.kind || "title";
  // Taille : « clamp(min, vw, max) » est une écriture de confort des modèles ; la grammaire n'accepte que des px : ordinateur = max, tablette = milieu, mobile = min
  const sz = String(o.size || "24px"), cm = /^clamp\((\d+)px,\s*[\d.]+vw,\s*(\d+)px\)$/.exec(sz);
  const fs = cm ? { d: `${cm[2]}px`, t: `${Math.round((Number(cm[1]) + Number(cm[2])) / 2)}px`, m: `${cm[1]}px` } : { d: sz };
  // Le site impose sa police aux liens (`.lp-site a`) : le nom du site est un lien, sa typographie propre passe donc par la partie « Lien » du widget
  const titleLink = { styles: { desktop: compact({ fontFamily: o.font || S.head, fontWeight: o.weight || S.weight, fontStyle: o.italic ? "italic" : undefined, textTransform: o.caps || undefined, letterSpacing: o.track || undefined, color: o.color || S.fg }) } };
  const title = () => ({ type: "sitetitle", props: { tag: "p", link: true }, parts: { link: titleLink }, ...sty(compact({ color: o.color || S.fg, fontFamily: o.font || S.head, fontWeight: o.weight || S.weight, fontSize: fs.d, lineHeight: o.lh || 1, textTransform: o.caps || undefined, letterSpacing: o.track || undefined, fontStyle: o.italic ? "italic" : undefined, whiteSpace: cm ? "normal" : "nowrap", overflowWrap: cm ? "anywhere" : undefined, ...(o.st || {}) }), fs.t ? { fontSize: fs.t } : undefined, fs.m ? { fontSize: fs.m } : undefined) });
  const logo = () => ({ type: "sitelogo", props: { height: o.h || (cm ? 72 : 40), link: true }, parts: { text: { styles: { desktop: compact({ fontFamily: o.font || S.head, fontWeight: o.weight || S.weight, fontSize: fs.d, color: o.color || S.fg }), ...(fs.t ? { tablet: { fontSize: fs.t }, mobile: { fontSize: fs.m } } : {}) } } } });
  if (kind === "logo") return logo();
  if (kind === "both") return { type: "group", children: [logo(), title()], ...sty({ display: "flex", flexDirection: "row", alignItems: "center", gap: "12px", flexWrap: "nowrap" }) };
  return title();
}

// Navigation du CMS : le style des liens (soulignement, pastille, cadre, barre, point…) vient des « parties » du widget (survol et focus inclus), pas d'un CSS libre.
function nav(k, kind = "plain", o = {}) {
  const S = k.S, base = { fontFamily: S.font, fontSize: o.size || "15px", fontWeight: o.weight || "600", color: o.color || S.fg, textTransform: o.caps || undefined, letterSpacing: o.track || undefined };
  const pad = (v, h) => ({ paddingTop: v, paddingBottom: v, paddingLeft: h, paddingRight: h });
  const hov = (st) => ({ hover: st, focus: st });
  let link = { styles: { desktop: base } }, list = { styles: { desktop: { gap: o.gap || "26px" } } };
  const acc = o.hover || S.accent;
  switch (kind) {
    case "underline": link = { styles: { desktop: { ...base, ...pad("6px", "0px"), borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: "transparent" } }, states: hov({ borderColor: acc }) }; break;
    case "pill": link = { styles: { desktop: { ...base, ...pad("8px", "16px"), borderRadius: "999px" } }, states: hov({ backgroundColor: acc, color: o.onHover || S.onAccent }) }; list = { styles: { desktop: { gap: "6px" } } }; break;
    case "box": link = { styles: { desktop: { ...base, ...pad("9px", "16px"), borderStyle: "solid", borderWidth: "1.5px", borderColor: "transparent" } }, states: hov({ borderColor: S.fg }) }; list = { styles: { desktop: { gap: "8px" } } }; break;
    case "block": link = { styles: { desktop: { ...base, ...pad("12px", "20px") } }, states: hov({ backgroundColor: acc, color: o.onHover || S.onAccent }) }; list = { styles: { desktop: { gap: "0px" } } }; break;
    case "tab": link = { styles: { desktop: { ...base, ...pad("12px", "18px"), borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: "transparent" } }, states: hov({ borderColor: acc }) }; list = { styles: { desktop: { gap: "4px" } } }; break;
    case "thin": link = { styles: { desktop: { ...base, fontWeight: "400" } }, states: hov({ color: acc }) }; break;
    case "mono": link = { styles: { desktop: { ...base, fontWeight: "500" } }, states: hov({ color: acc, textDecoration: "underline" }) }; break;
    default: link = { styles: { desktop: base }, states: hov({ color: acc }) };
  }
  return { type: "menu", props: { label: o.label || "Navigation principale", source: "location", location: o.location || "header", items: [], vertical: o.vertical === true, mobileToggle: o.vertical !== true }, parts: { link, list, burger: { styles: { desktop: { color: o.color || S.fg } } } }, ...sty(compact({ fontFamily: S.font, ...(o.st || {}) }), o.t, o.m) };
}

// Bouton : plein, contour, pilule, carré, flèche (la flèche est une partie du texte, jamais une image)
function btn(k, label, url, kind = "solid", o = {}) {
  const S = k.S, solid = kind !== "outline" && kind !== "ghost" && kind !== "line";
  const bg = o.bg || S.accent, fg = o.fg || S.onAccent;
  const st = { backgroundColor: solid ? bg : "transparent", color: solid ? fg : (o.fg || S.fg), borderStyle: "solid", borderWidth: kind === "outline" ? "1.5px" : kind === "ghost" ? "0px" : kind === "line" ? "0px" : "0px", borderColor: o.border || (kind === "outline" ? (o.fg || S.fg) : bg), borderRadius: kind === "pill" ? "999px" : (o.radius || S.btnRadius), fontFamily: o.font || S.font, fontWeight: o.weight || "700", fontSize: o.size || "14px", textTransform: o.caps || undefined, letterSpacing: o.track || undefined, paddingTop: o.padV || "11px", paddingBottom: o.padV || "11px", paddingLeft: o.padH || "20px", paddingRight: o.padH || "20px", whiteSpace: "nowrap" };
  if (kind === "line") Object.assign(st, { borderBottomWidth: "2px", borderRadius: "0px", paddingLeft: "0px", paddingRight: "0px", borderColor: o.fg || S.fg });
  const label2 = kind === "arrow" ? `${label} →` : label;
  return { type: "button", props: { label: label2, url, variant: solid ? "primary" : "outline" }, ...sty(compact({ ...st, ...(o.st || {}) })) };
}

const search = (k, o = {}) => {
  const S = k.S;
  const node = { type: "search", props: { target: o.target || "blog", placeholder: o.placeholder || "Rechercher…", button: o.button || "Rechercher" }, ...sty(compact({ borderRadius: S.btnRadius, flexShrink: o.grow ? undefined : 0, flexGrow: o.grow ? 1 : undefined, flexBasis: o.grow ? "260px" : undefined, width: o.w || (o.grow ? undefined : "280px"), maxWidth: o.grow ? (o.max || "560px") : "100%", ...(o.st || {}) }), undefined, { width: "100%", maxWidth: "100%", flexBasis: "100%" }) };
  node.parts = { field: { styles: { desktop: compact({ fontFamily: S.font, backgroundColor: o.fieldBg || S.alt, color: S.fg, borderColor: o.fieldLine || S.line, borderRadius: o.radius || S.btnRadius }) } }, button: { styles: { desktop: compact({ fontFamily: S.font, backgroundColor: S.accent, color: S.onAccent, borderRadius: o.radius || S.btnRadius }) } } };
  return node;
};
const account = (k, o = {}) => { const n = { type: "account", props: { login: o.login || "Se connecter", account: o.account || "Mon compte", showCart: false, cart: "Panier" }, ...sty(compact({ color: o.color || k.S.fg, alignSelf: "center", ...(o.st || {}) })) }; n.parts = { link: { styles: { desktop: { fontFamily: k.S.font, color: o.color || k.S.fg, fontWeight: "600", fontSize: o.size || "14px" } } } }; return n; };
const cart = (k, o = {}) => ({ type: "minicart", props: { label: o.label || "Panier", showCount: true, hideEmpty: false }, ...sty(compact({ color: o.color || k.S.fg, fontFamily: k.S.font, fontWeight: "600", ...(o.st || {}) })) });
const social = (k, o = {}) => ({ type: "social", props: { items: [{ network: "instagram", url: "https://www.instagram.com/" }, { network: "facebook", url: "https://www.facebook.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }].slice(0, o.n || 3), size: String(o.size || 28), shape: o.shape || "square", label: "Nos réseaux" }, ...sty(compact({ gap: "8px", ...(o.st || {}) })), hideOn: ["mobile"] });
const date = (k, o = {}) => ({ type: "dyntext", props: { source: "today", before: o.before || "", after: "", fallback: "", tag: "span" }, ...sty(compact({ color: o.color || k.S.mute, fontFamily: o.font || k.S.font, fontSize: o.size || "12px", textTransform: "uppercase", letterSpacing: "1.6px", ...(o.st || {}) })), hideOn: ["mobile"] });
const note = (k, html, o = {}) => ({ type: "text", props: { html: `<p>${html}</p>` }, ...sty(compact({ color: o.color || k.S.mute, fontFamily: o.font || k.S.font, fontSize: o.size || "13px", textTransform: o.caps || undefined, letterSpacing: o.track || undefined, lineHeight: 1.4, ...(o.st || {}) })), ...(o.mobile === false ? {} : {}) });
const tag = (k, label, o = {}) => ({ type: "text", props: { html: `<p><strong>${label}</strong></p>` }, ...sty(compact({ backgroundColor: o.bg || k.S.accent, color: o.fg || k.S.onAccent, fontFamily: k.S.font, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.4px", borderRadius: o.radius || "999px", paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", ...(o.st || {}) })) });
const line = (k, o = {}) => ({ type: "divider", props: { line: true, size: "md" }, ...sty(compact({ borderColor: o.color || k.S.line, ...(o.st || {}) })) });
const sp = (n = "8") => ({ type: "spacer", props: { size: n } });
const contact = (k, o = {}) => ({ type: "iconlist", props: { items: [{ text: "Votre téléphone", icon: "smartphone" }, { text: "Votre adresse e-mail", icon: "mail" }], inline: true, iconColor: o.icon || k.S.accent }, ...sty(compact({ color: o.color || k.S.fg, fontFamily: k.S.font, fontSize: "13px", ...(o.st || {}) })), hideOn: ["mobile"] });

// ── Mise en forme ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Groupe flex : ligne par défaut ; retour à la ligne autorisé (le responsive vient du flex-wrap, pas de positions fixes)
const g = (children, st = {}, t, m) => ({ type: "group", children, ...sty(compact({ display: "flex", flexDirection: "row", alignItems: "center", gap: "16px", flexWrap: "wrap", ...st }), t, m) });
const stack = (children, st = {}, t, m) => ({ type: "stack", children, ...sty(compact({ display: "flex", flexDirection: "column", gap: "6px", ...st }), t, m) });
const grid = (cols, children, st = {}, t, m) => ({ type: "grid", children, ...sty(compact({ display: "grid", gridTemplate: cols, alignItems: "center", gap: "16px", ...st }), t, m) });
// Bande pleine largeur (fond, filets) : les rangées d'un en-tête sont des bandes ; `inner` borne le contenu à la largeur du site
const band = (S, children, st = {}, t, m) => ({ type: "container", props: { full: true }, children, ...sty(compact({ backgroundColor: S.bg, color: S.fg, display: "flex", flexDirection: "column", alignItems: "stretch", gap: "0px", paddingLeft: "24px", paddingRight: "24px", ...st }), t || { paddingLeft: "18px", paddingRight: "18px" }, m || { paddingLeft: "14px", paddingRight: "14px" }) });
const inner = (children, st = {}, t, m) => ({ type: "container", children, ...sty(compact({ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", maxWidth: "1240px", width: "100%", marginLeft: "auto", marginRight: "auto", ...st }), t, m) });

// Enveloppe de l'en-tête : UN conteneur pleine largeur qui porte le mode (collant / superposé) et l'effet au défilement ; le premier enfant est lu par le rendu (themeRender.partMode)
function wrap(S, rows, mode, extra = {}) {
  const base = { static: "", sticky: "sticky", glass: "sticky", overlay: "overlay", stickyshrink: "sticky", stickyhide: "sticky", overlaysolid: "overlay" }[mode] ?? "";
  const fx = { stickyshrink: "shrink", overlaysolid: "solid", stickyhide: "hide", glass: "" }[mode] || "";
  const st = { display: "flex", flexDirection: "column", gap: "0px", width: "100%", ...extra };
  if (base === "sticky") Object.assign(st, { position: "sticky", top: "0px", zIndex: 50 });
  if (base === "overlay") Object.assign(st, { position: "absolute", top: "0px", left: "0px", right: "0px", zIndex: 40 });
  if (mode === "glass") Object.assign(st, { backdropBlur: 14 });
  return { type: "container", props: { full: true, ...(fx ? { headerFx: fx } : {}) }, children: rows, ...sty(compact(st)) };
}

// ── Mouvement (natif : « motion » des éléments, désactivé si le visiteur demande moins de mouvement) ────────────────────────────────────
const mv = (node, entrance, delay = 0, duration = 600) => ({ ...node, motion: { entrance, duration, delay } });
const hv = (node, hover) => ({ ...node, motion: { ...(node.motion || {}), hover } });

module.exports = { readable, ID, mark, nav, btn, search, account, cart, social, date, note, tag, line, sp, contact, g, stack, grid, band, inner, wrap, mv, hv, txt, fam };
