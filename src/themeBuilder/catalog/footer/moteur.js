// MOTEUR PARTAGÉ du catalogue « Pied de page » (extrait tel quel de l'ancien catalogue : aucun changement de comportement).
// Il contient tout ce qui transforme une description déclarative (rangées C / L / T / Z de codes d'éléments « nom:arg|libellé|adresse ») en section de composant du Page Builder :
//   tone / legible (contrastes AA), FOCUS / linkStates / buttonStates / mergePart / finishNode (états survol-focus, cibles de 44 px sur mobile), item / rawItem (les éléments), band (une rangée → une bande pleine largeur), wrap (le pied entier).
// Les éléments NOUVEAUX (newsletter, réseaux, accordéon mobile…) sont enregistrés dans le registre EXTRA par ./elements.js : un seul moteur, pas deux.
// Un seul endroit à modifier pour changer le comportement de tous les modèles (anciens comme nouveaux).
const { kit, sty } = require("../kit");

// Registre des éléments ajoutés (nom → (k, { x, a1, a2, a3 }, env, center) → nœud). Rempli par ./elements.js ; consulté par rawItem() avant de refuser un nom inconnu.
const EXTRA = new Map();
const registerElement = (name, fn) => { if (EXTRA.has(name)) throw new Error(`Pied de page : élément « ${name} » déjà enregistré.`); EXTRA.set(name, fn); };

// Identité locale à une rangée colorée (le texte et les boutons restent lisibles) — mêmes règles que les en-têtes
const tone = (S, bg) => {
  if (bg === "alt") return S.alt.startsWith("#") && S.alt.length === 9 ? tone(S, "ink") : { ...S, bg: S.alt, alt: S.bg };
  if (bg === "accent") return { ...S, bg: S.accent, fg: S.onAccent, mute: S.onAccent, alt: "#ffffff22", accent: S.onAccent, onAccent: S.accent, line: "#ffffff55" };
  if (bg === "ink") return S.ink ? { ...S, bg: S.ink, fg: S.onInk, mute: S.onInk, alt: S.ink, accent: S.onInk, onAccent: S.ink, line: "#ffffff55" } : { ...S, bg: "token:text", fg: "token:background", mute: "token:background", alt: "token:text", accent: "token:background", onAccent: "token:text", line: "token:muted" };
  return S;
};
const PAD = { xs: "10px", sm: "16px", md: "", lg: "44px", xl: "64px" };
const NETWORKS = [{ network: "facebook", url: "https://www.facebook.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }, { network: "instagram", url: "https://www.instagram.com/" }, { network: "youtube", url: "https://www.youtube.com/" }];
// ── Contraste (WCAG) et états des liens et boutons ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const lumOf = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const isHex6 = (c) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
const contrastOf = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hexOf = (v) => `#${v.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")).join("")}`;
// Fond réel d'une couleur éventuellement semi-transparente (#rrggbbaa) posée sur le fond de la rangée
const flat = (c, bg) => { if (isHex6(c)) return c; if (!(typeof c === "string" && /^#[0-9a-f]{8}$/i.test(c)) || !isHex6(bg)) return null; const a = parseInt(c.slice(7, 9), 16) / 255, f = rgbOf(c.slice(0, 7)), b = rgbOf(bg); return hexOf(f.map((x, i) => x * a + b[i] * (1 - a))); };
// Le texte secondaire (« mute ») doit rester lisible (≥ 4,5:1) sur le fond ET sur le fond alterné des cartes : sinon on le rapproche progressivement de la couleur du texte
function legible(S) {
  if (!isHex6(S.mute) || !isHex6(S.fg) || !isHex6(S.bg)) return S;
  const backs = [S.bg, flat(S.alt, S.bg)].filter(Boolean), a = rgbOf(S.mute), b = rgbOf(S.fg);
  let mute = S.mute;
  for (let t = 0; t <= 1.0001 && !backs.every((x) => contrastOf(mute, x) >= 4.5); t += 0.05) mute = hexOf(a.map((v, i) => v + (b[i] - v) * t));
  return mute === S.mute ? S : { ...S, mute };
}
const FOCUS = (S) => ({ outlineStyle: "solid", outlineWidth: "2px", outlineColor: S.fg, outlineOffset: "3px" });
// Survol d'un lien : souligné, et couleur d'accent seulement si elle reste lisible (≥ 4,5:1) sur le fond de la rangée
const linkStates = (S) => ({ hover: { textDecoration: "underline", ...(isHex6(S.accent) && isHex6(S.bg) && contrastOf(S.accent, S.bg) >= 4.5 ? { color: S.accent } : {}) }, focus: FOCUS(S) });
// Survol d'un bouton : les deux couleurs du bouton s'inversent (même contraste que l'état normal)
const buttonStates = (S, solid) => ({ hover: solid ? { backgroundColor: S.onAccent, color: S.accent, borderStyle: "solid", borderWidth: "1.5px", borderColor: S.accent } : { backgroundColor: S.accent, color: S.onAccent }, focus: FOCUS(S) });
const T44 = { minHeight: "44px", display: "inline-flex", alignItems: "center" };
const mergePart = (node, key, add) => { const cur = (node.parts || {})[key] || {}; node.parts = { ...(node.parts || {}), [key]: { ...cur, styles: { ...(cur.styles || {}), ...(add.styles ? Object.fromEntries(Object.entries(add.styles).map(([bp, v]) => [bp, { ...((cur.styles || {})[bp] || {}), ...v }])) : {}) }, ...(add.states ? { states: add.states } : {}) } }; };
// Applique à un élément (et à ses enfants) les états survol / focus et les zones cliquables de 44 px sur mobile. Mutation sur des nœuds fraîchement construits.
// Fond LOCAL : un bloc qui pose son propre fond uni (carte, pastille de couleur) change le fond réel de tout ce qu'il contient. Les états survol / focus des liens qu'il contient sont alors calculés sur CE fond
// (couleur de survol d'accent seulement si lisible dessus, contour de focus de la couleur du lien ou, à défaut, noir/blanc lisible) ; hors d'un tel bloc, rien ne change.
function toneLocal(S, n, bg) {
  if (!isHex6(bg) || !isHex6(S.bg) || bg.toLowerCase() === S.bg.toLowerCase()) return S;
  const own = ((n.styles || {}).desktop || {}).color;
  const fg = isHex6(own) && contrastOf(own, bg) >= 4.5 ? own : isHex6(S.fg) && contrastOf(S.fg, bg) >= 4.5 ? S.fg : contrastOf("#ffffff", bg) >= contrastOf("#000000", bg) ? "#ffffff" : "#000000";
  return { ...S, bg, fg };
}
function finishNode(S0, n, bg0 = S0.bg) {
  const fond = ((n.styles || {}).desktop || {}).backgroundColor, bgHere = isHex6(fond) ? fond : bg0;
  for (const c of n.children || []) finishNode(S0, c, bgHere);
  const S = toneLocal(S0, n, bg0); // le fond d'un nœud ne change pas ses propres états (un bouton plein garde ses couleurs) : seul le fond de ses PARENTS compte
  // le site impose sa police aux liens : les liens des widgets de données reprennent la police (et la casse) de l'identité, comme les autres liens du pied
  const fam = S.font && S.font.startsWith("font.") ? { fontFamily: S.font } : {}, caps = S.caps && S.caps !== "none" ? { textTransform: S.caps, letterSpacing: S.track } : {};
  const mobile = (st) => { n.styles = { ...(n.styles || {}), mobile: { ...((n.styles || {}).mobile || {}), ...st } }; };
  if (n.type === "link") { n.states = linkStates(S); mobile(T44); }
  else if (n.type === "button") { const solid = n.props && n.props.variant === "primary"; n.states = buttonStates(S, solid); mobile({ ...T44, justifyContent: "center" }); }
  else if (n.type === "menu") mergePart(n, "link", { styles: { mobile: { paddingTop: "12px", paddingBottom: "12px" } }, states: linkStates(S) });
  else if (n.type === "account") mergePart(n, "link", { styles: { mobile: { paddingTop: "12px", paddingBottom: "12px" } }, states: linkStates(S) });
  else if (n.type === "minicart") { n.states = linkStates(S); mobile(T44); }
  else if (n.type === "social") mergePart(n, "link", { styles: { mobile: { width: "44px", height: "44px" } }, states: { hover: { opacity: 0.8 }, focus: FOCUS(S) } });
  else if (["bizcontact", "bizphone", "bizemail", "bizlegal"].includes(n.type)) {
    mergePart(n, "link", { styles: { desktop: n.type === "bizlegal" ? { ...fam, ...caps } : fam, mobile: { paddingTop: "14px", paddingBottom: "14px" } }, states: linkStates(S) });
    if (n.type === "bizcontact" || n.type === "bizlegal") mergePart(n, "item", { styles: { mobile: { minHeight: "44px", alignItems: "center" } } });
  } else if (n.type === "shopcategories" || n.type === "shoplinks") {
    mergePart(n, "link", { styles: { desktop: fam, mobile: { paddingTop: "14px", paddingBottom: "14px", display: "inline-block" } }, states: linkStates(S) });
    mergePart(n, "item", { styles: { mobile: { minHeight: "44px" } } });
  } else if (n.type === "emailsubscribe") { // champ et bouton : 44 px de haut sur mobile, mêmes états que les autres boutons
    mergePart(n, "input", { styles: { mobile: { height: "44px" } } });
    mergePart(n, "button", { styles: { desktop: { ...fam, ...caps }, mobile: { paddingTop: "14px", paddingBottom: "14px" } }, states: buttonStates(S, true) });
  } else if (n.type === "backtotop") mergePart(n, "button", { styles: { desktop: { ...fam, ...caps }, mobile: { height: "44px" } }, states: { hover: { textDecoration: "underline" }, focus: FOCUS(S) } });
  else if (n.type === "sitetitle") { // lien du titre du site : marge haute et basse pour atteindre ~44 px selon la taille de la police
    const f = parseInt(((n.styles || {}).desktop || {}).fontSize, 10) || 22, pad = Math.max(0, Math.ceil((46 - 1.2 * f) / 2));
    if (pad) mergePart(n, "link", { styles: { mobile: { paddingTop: `${pad}px`, paddingBottom: `${pad}px` } }, states: linkStates(S) }); else mergePart(n, "link", { states: linkStates(S) });
  } else if (n.type === "sitelogo") { // logo : image portée à 44 px de haut sur mobile si elle est plus petite ; logo texte (site sans logo) : marges haute et basse
    mergePart(n, "text", { styles: { mobile: { paddingTop: "5px", paddingBottom: "5px" } } });
    const h = Number(n.props && n.props.height) || 0;
    if (h && h < 44) mergePart(n, "image", { styles: { mobile: { height: "44px" } } });
  }
  return n;
}
const ABOUT = "Décrivez en une ou deux phrases votre activité et ce que vos visiteurs trouveront ici.";

// ── Un élément : « nom:arg|libellé|adresse » ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// center : l'élément est centré (rangées Z et colonnes centrées)
function item(k, code, env, center) {
  // Un élément peut aussi être une FONCTION (k, env, center) → nœud : widget posé avec ses réglages (kit-conception : widget(), accordeon()…). Même finition que les éléments en texte.
  if (typeof code === "function") return finishNode(k.S, code(k, env, center));
  return finishNode(k.S, ownFont(k.S, code, rawItem(k, code, env, center)));
}
function rawItem(k, code, env, center) {
  const [head, a1, a2, a3] = code.split("|");
  const [name, x] = head.split(":");
  const S = k.S, mid = center ? { textAlign: "center" } : {};
  const links = (list, st = {}) => k.col(list.map((s) => { const [label, url] = s.split(">"); return k.LINK(label, url, { fontSize: "14px", fontWeight: "500", ...mid }); }), { gap: "8px", alignItems: center ? "center" : "flex-start", ...st });
  const mobileOff = (n) => ({ ...n, hideOn: ["mobile"] });
  switch (name) {
    case "logo": return k.logo(Number(x) || 40);
    case "title": return k.siteTitle({ fontSize: `${Number(x) || 22}px`, ...(Number(x) >= 60 ? { lineHeight: 1.05, width: "100%" } : {}), ...mid });
    case "about": return k.T(`<p>${a1 || ABOUT}</p>`, { color: S.mute, fontSize: "14px", maxWidth: "360px", ...(center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}) });
    case "text": return k.T(`<p>${a1}</p>`, { color: S.mute, fontSize: "14px", ...mid });
    case "head": return k.L(a1, mid);
    case "H": return k.H(a1, a2 || "3", { fontSize: a2 === "1" ? "40px" : a2 === "2" ? "28px" : "20px", ...mid });
    case "menu": return k.menu("footer", { fontSize: "14px" }, true);
    case "hmenu": return k.menu("header", { fontSize: "14px" }, true);
    case "menuh": case "hmenuh": {
      const n = k.menu(name === "menuh" ? "footer" : "header", x === "caps" ? { fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.4px" } : { fontSize: "14px" }, false);
      n.props.mobileToggle = false; // un pied de page n'a pas de bouton « hamburger » : les liens passent simplement à la ligne
      return n;
    }
    case "links": return links([a1, a2, a3].filter(Boolean));
    case "link": return k.LINK(a1, a2, { fontSize: "14px", fontWeight: "500", ...mid });
    case "social": {
      const n = k.social(NETWORKS.slice(0, x === "big" ? 4 : 3), { gap: x === "big" ? "14px" : "8px", ...(center ? { justifyContent: "center" } : {}) });
      if (x === "plain") { n.props.shape = "plain"; n.props.size = "24"; } else if (x === "big") n.props.size = "48"; else if (x === "sq") n.props.shape = "square";
      return n;
    }
    // Copyright automatique : année courante + raison sociale des Données de l'entreprise ; sans elle (étiquette vide), le nom du site
    case "copy": return k.W("copyright", { owner: "{{business.legalname}}", text: "Tous droits réservés." }, { color: S.mute, fontSize: "13px", ...(center || x === "c" ? { textAlign: "center" } : {}) });
    // Liens légaux : Cookies et Contact (pages de la plateforme) + les pages légales renseignées dans les Données de l'entreprise (mentions, confidentialité, CGV), invisibles tant qu'elles ne le sont pas
    case "legal": return k.row([k.LINK("Cookies", "/cookies", { fontSize: "13px", fontWeight: "500" }), k.LINK("Contact", "/contact", { fontSize: "13px", fontWeight: "500" }), ...(x === "3" ? [k.LINK("FAQ", "/faq", { fontSize: "13px", fontWeight: "500" })] : []),
      k.W("bizlegal", { title: "", showName: false, showForm: false, showRegistrations: false, showPublisher: false, showHost: false, showPages: true, layout: "inline" }, { color: S.fg, fontSize: "13px", fontWeight: "500", marginTop: "-8px" })] /* -8 px : annule la marge haute de la liste des pages légales (widget) pour aligner ses liens sur Cookies et Contact */, { gap: "16px" });
    // Informations légales (raison sociale, forme, immatriculations) ; les pages légales sont déjà dans « legal »
    case "legalinfo": return k.W("bizlegal", { title: "", showName: true, showForm: true, showRegistrations: true, showPublisher: false, showHost: false, showPages: false, layout: x === "inline" ? "inline" : "stack" }, { color: S.mute, fontSize: "13px", ...mid });
    case "phone": return k.W("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: true }, { color: S.fg, fontSize: "14px", fontWeight: "600", ...mid });
    case "email": return k.W("bizemail", { prefix: "", text: "", showIcon: true }, { color: S.fg, fontSize: "14px", fontWeight: "600", ...mid });
    case "pay": return k.W("bizpayments", { title: a1 || "Paiement accepté", look: "pills", showIcon: false }, { color: S.fg, fontSize: "13px", ...mid });
    case "deliv": return k.W("bizdelivery", { title: a1 || "Livraison et retours", showDelivery: true, showReturns: true, showIcon: false }, { color: S.mute, fontSize: "14px", ...mid });
    case "top": return k.W("backtotop", { mode: "inline", side: "right", label: "Retour en haut", showLabel: true, threshold: 300 }, { color: S.fg, fontSize: "13px", fontWeight: "600" });
    case "news": {
      const heading = a1 || "Restez informé", intro = a2 || "Décrivez ici ce que recevront vos abonnés.";
      if (env && env.formId) return k.W("signupform", { formId: env.formId, heading, intro, button: "S'abonner" }, { width: "100%", maxWidth: "460px", ...(center ? { marginLeft: "auto", marginRight: "auto" } : {}) });
      return k.col([k.H(heading, "3", { fontSize: "20px", ...mid }), k.T(`<p>${intro}</p>`, { color: S.mute, fontSize: "14px", ...mid }), k.B("Nous contacter", "/contact")], { alignItems: center ? "center" : "flex-start", maxWidth: "460px" });
    }
    case "cta": return k.B(a1 || "Nous contacter", a2 || "/contact", undefined, center ? { alignSelf: "center" } : {});
    case "cta2": return k.B(a1 || "Nous contacter", a2 || "/contact", "outline", { ...(S.bg === "token:primary" ? { color: S.fg, borderColor: S.fg } : {}), ...(center ? { alignSelf: "center" } : {}) });
    // Coordonnées : adresse, téléphone et e-mail CLIQUABLES lus dans les Données de l'entreprise (rien tant qu'ils ne sont pas renseignés : plus de faux texte « Votre adresse e-mail »)
    case "contact": return k.W("bizcontact", { title: a1 || "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: true, layout: x === "inline" ? "inline" : "stack" }, { color: S.fg, fontSize: "14px", ...mid });
    case "hours": return k.W("bizhours", { title: a1 === "-" ? "" : a1 || "Horaires d'ouverture", showOpenNow: true, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: S.mute, fontSize: "14px", ...mid });
    case "map": return k.W("map", { address: "France", zoom: 5, height: x === "wide" ? 300 : 240, title: "Carte : remplacez l'adresse par la vôtre" }, { width: "100%", borderRadius: S.radius });
    case "cats": return k.W("querylist", { title: "", source: "categories", mode: "popular", count: 6, layout: "list", showCount: false, empty: "Les catégories apparaîtront ici." }, { color: S.fg, fontSize: "14px" });
    case "recent": return k.W("querylist", { title: "", source: "posts", mode: "recent", count: Number(x) || 3, layout: "compact", showImage: false, showDate: true, empty: "Les articles apparaîtront ici." }, { color: S.fg, fontSize: "14px" });
    case "popular": return k.W("querylist", { title: "", source: "posts", mode: "popular", count: Number(x) || 3, layout: "compact", showImage: false, showDate: false, empty: "Les articles apparaîtront ici." }, { color: S.fg, fontSize: "14px" });
    case "courses": return k.W("courselist", { count: Number(x) || 3, sort: "recent", showPrice: false, cta: "Découvrir", empty: "Les formations apparaîtront ici." }, { width: "100%" });
    case "search": return k.search(x === "catalogue" ? "catalogue" : "blog", { width: "100%", maxWidth: "420px" });
    case "account": { const n = k.account({ alignSelf: center ? "center" : "flex-start" }); n.props.showCart = false; return n; }
    case "cart": return k.W("minicart", { label: "Panier", showCount: true, hideEmpty: false }, { color: S.fg, fontWeight: "600" });
    case "toggle": return k.W("toggle", { title: a1, text: a2, open: false }, { color: S.fg, width: "100%" });
    case "date": return mobileOff({ type: "dyntext", props: { source: "today", before: "", after: "", fallback: "", tag: "span" }, ...sty({ color: S.mute, fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.5px" }) });
    case "badge": return k.T(`<p><strong>${a1 || "Nouveau"}</strong></p>`, { fontSize: "12px", backgroundColor: S.accent, color: S.onAccent, borderRadius: "999px", paddingTop: "3px", paddingBottom: "3px", paddingLeft: "10px", paddingRight: "10px" });
    case "div": return k.divider({ width: "100%" });
    default: {
      // Éléments ajoutés après la refonte (./elements.js) : même grammaire « nom:arg|a1|a2|a3 », même finition (états, 44 px, police d'identité)
      const extra = EXTRA.get(name);
      if (extra) return extra(k, { x, a1, a2, a3 }, env || {}, center);
      throw new Error(`Pied de page : élément inconnu « ${name} ».`);
    }
  }
}

// Identité PROPRE : la police s'applique à tous les éléments de texte ; le site impose la sienne aux liens et boutons, d'où les « parties » (parts.js) pour le menu, le compte, le logo et la recherche.
function ownFont(S, code, node) {
  const name = String(code).split("|")[0].split(":")[0];
  if (!(S.font && S.font.startsWith("font."))) return node;
  const set = (d) => ({ styles: { desktop: d } });
  const out = { ...node, styles: { ...(node.styles || {}), desktop: { ...((node.styles || {}).desktop || {}), fontFamily: name === "logo" || name === "title" ? S.head : S.font } } };
  if (["menu", "hmenu", "menuh", "hmenuh", "account"].includes(name)) out.parts = { link: set({ fontFamily: S.font }) };
  if (name === "search") out.parts = { field: set({ fontFamily: S.font, backgroundColor: S.alt, color: S.fg, borderColor: S.line }), button: set({ fontFamily: S.font, backgroundColor: S.accent, color: S.onAccent, borderRadius: S.btnRadius }) };
  if (name === "logo") out.parts = { text: set({ fontFamily: S.head, fontWeight: S.weight, fontSize: "24px", color: S.fg }) };
  return out;
}

// ── Accordéon mobile : un conteneur « accordéon » dont les volets ne se replient que sur mobile (≤ 767 px) ; ailleurs, affichage normal en colonnes (titre de colonne). Mécanisme existant (landing.js) : pas de second moteur.
// panels : [{ title, w, codes }] ; chaque volet est un conteneur nommé (son nom = titre du bouton sur mobile, titre de colonne ailleurs).
function accordionNode(k, env, center, panels, st = {}, opts = {}) {
  const S = k.S, min = opts.min || (panels.length >= 5 ? "160px" : "200px");
  const kids = panels.map((p) => ({ type: "container", name: p.title, children: p.codes.map((c) => item(k, c, env, center)),
    ...sty({ display: "flex", flexDirection: "column", gap: "12px", flexBasis: "0px", flexGrow: p.w || 1, minWidth: panels.length === 1 ? "0px" : min, alignItems: center ? "center" : "flex-start", ...(center ? { textAlign: "center" } : {}) }) }));
  const node = k.inner(kids, { alignItems: "flex-start", justifyContent: "space-between", gap: S.gap, color: S.fg, ...st });
  node.props = { mode: "accordion", accStart: opts.start === "all" ? "all" : "none", accSingle: opts.single === true, accMobile: true };
  return node;
}

// ── Une rangée → une bande ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function band(S0, row, first, env) {
  const S = legible(tone(S0, row.bg)), k = kit(S);
  const center = !!(row.z || row.center);
  const it = (codes) => codes.map((c) => item(k, c, env, center));
  const edge = { ...(row.tablet ? { tablet: row.tablet } : {}), ...(row.mobile ? { mobile: row.mobile } : {}) }; // réglages par écran propres à la rangée (modèles nouveaux ; absents des anciens)
  const padV = PAD[row.pad] || (/^\d+px$/.test(row.pad || "") ? row.pad : S.pad);
  const max = row.max ? { maxWidth: row.max, marginLeft: "auto", marginRight: "auto" } : {};
  let inner;
  if (row.acc) {
    // row.acc : [[poids?, "Titre du volet", code, code…], …] — colonnes qui deviennent un accordéon sur mobile
    const panels = row.acc.map((c) => { const w = typeof c[0] === "number" ? c[0] : 1, a = typeof c[0] === "number" ? c.slice(1) : c; return { title: a[0], w, codes: a.slice(1) }; });
    inner = accordionNode(k, env, center, panels, { ...max }, { min: row.min, start: row.accStart, single: row.accSingle });
  } else if (row.cols) {
    const min = row.min || (row.cols.length >= 5 ? "160px" : "200px");
    const cols = row.cols.map((c) => {
      const w = typeof c[0] === "number" ? c[0] : 1, codes = typeof c[0] === "number" ? c.slice(1) : c;
      const st = { flexBasis: "0px", flexGrow: w, minWidth: row.cols.length === 1 ? "0px" : min, alignItems: center ? "center" : "flex-start", gap: "12px", ...(center ? { textAlign: "center" } : {}) };
      return row.cards ? finishNode(S, k.card(it(codes), st)) : k.col(it(codes), st); // la carte pose un fond : ses liens sont refinis sur CE fond
    });
    inner = k.inner(cols, { alignItems: "flex-start", justifyContent: "space-between", gap: S.gap, ...(row.frame ? { borderStyle: "solid", borderWidth: "1.5px", borderColor: S.fg, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px" } : {}), ...max });
  } else if (row.z) {
    inner = k.inner(it(row.z), { flexDirection: "column", alignItems: "center", justifyContent: "center", gap: row.gap || "18px", textAlign: "center", ...max });
  } else if (row.t) {
    const [l, c, r] = row.t, z = (codes, jc) => k.row(it(codes), { gap: "20px", flexBasis: "0px", flexGrow: 1, minWidth: "180px", justifyContent: jc });
    inner = k.inner([z(l, "flex-start"), z(c, "center"), z(r, "flex-end")], { alignItems: "center", justifyContent: "space-between", ...max });
  } else {
    const zones = [k.row(it(row.l || []), { gap: "20px", justifyContent: "flex-start" })];
    if ((row.r || []).length) zones.push(k.row(it(row.r), { gap: "20px", justifyContent: "flex-end" }));
    inner = k.inner(zones, { alignItems: "center", justifyContent: "space-between", ...max });
  }
  inner.styles.mobile = { gap: "20px", ...(row.l ? { flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" } : {}) };
  if (edge.tablet) inner.styles.tablet = { ...(inner.styles.tablet || {}), ...edge.tablet };
  if (edge.mobile) inner.styles.mobile = { ...inner.styles.mobile, ...edge.mobile };
  const rule = row.rule || (first ? (S0.rule === "none" ? "none" : S0.rule === "double" ? "double" : "thin") : "none");
  const bst = { paddingTop: padV, paddingBottom: padV, borderBottomWidth: "0px", boxShadow: "none" };
  if (rule === "thin") Object.assign(bst, { borderStyle: "solid", borderTopWidth: "1px", borderColor: S.line });
  else if (rule === "accent") Object.assign(bst, { borderStyle: "solid", borderTopWidth: "4px", borderColor: S.accent });
  else if (rule === "thick") Object.assign(bst, { borderStyle: "solid", borderTopWidth: "3px", borderColor: S.fg });
  else if (rule === "double") Object.assign(bst, { borderStyle: "double", borderTopWidth: "6px", borderColor: S.fg });
  return k.band([inner], bst, { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "16px", paddingRight: "16px", paddingTop: row.pad === "xl" || row.pad === "lg" ? "32px" : undefined, paddingBottom: row.pad === "xl" || row.pad === "lg" ? "32px" : undefined });
}


// Constructeurs de rangées
const C = (cols, o = {}) => ({ cols, ...o });
const L = (l, r, o = {}) => ({ l, r, ...o });
const T = (l, c, r, o = {}) => ({ t: [l, c, r], ...o });
const Z = (z, o = {}) => ({ z, ...o });
const A = (acc, o = {}) => ({ acc, ...o }); // colonnes repliables sur mobile seulement

// Liens et boutons imbriqués (liste légale, liens du pied…) : la police de l'identité s'applique aussi à eux (le site impose la sienne aux liens)
function fontAll(S, n) {
  if (!(S.font && S.font.startsWith("font."))) return;
  for (const c of n.children || []) {
    if ((c.type === "link" || c.type === "button") && !(c.styles && c.styles.desktop && c.styles.desktop.fontFamily)) c.styles = { ...(c.styles || {}), desktop: { ...((c.styles || {}).desktop || {}), fontFamily: S.font } };
    fontAll(S, c);
  }
}
// Toutes les rangées sont dans UN conteneur pleine largeur sans espace entre rangées : le pied entier se comporte comme un seul bloc
function wrap(S, rows, env) {
  const root = { type: "container", props: { full: true }, children: rows.map((r, i) => band(S, r, i === 0, env)), ...sty({ display: "flex", flexDirection: "column", gap: "0px", width: "100%" }) };
  fontAll(S, root);
  return root;
}

module.exports = { tone, legible, PAD, NETWORKS, lumOf, isHex6, contrastOf, rgbOf, hexOf, flat, FOCUS, linkStates, buttonStates, T44, mergePart, finishNode, item, rawItem, ownFont, band, fontAll, wrap, C, L, T, Z, A, EXTRA, registerElement, accordionNode };
