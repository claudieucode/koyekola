// Catalogue « En-tête » : 100 COMPOSITIONS distinctes (10 familles × 10), pas un croisement mise en page × couleur. Chaque modèle fixe sa propre identité visuelle (20 par identité).
// Une composition = des RANGÉES (bandes pleine largeur) ; une rangée = trois zones (gauche, centre, droite) remplies d'éléments natifs du Page Builder : logo du site, titre du site,
// menu AFFECTÉ à l'emplacement « En-tête » (Apparence → Menus : aucun lien de navigation inventé), recherche, compte, mini-panier, boutons, réseaux, date, texte.
// Comportements : « collant » (position: sticky) et « transparent / superposé » (position: absolute) se posent sur la PREMIÈRE bande, la seule que lit le rendu (themeRender.partMode).
// Responsive : rien n'est positionné en absolu à l'intérieur d'une rangée (flex + retour à la ligne), le menu se replie derrière un bouton (mobileToggle), les éléments secondaires
// (réseaux, date, messages) sont masqués sur mobile (hideOn) ; une rangée dont tout le contenu est masqué l'est aussi.
// Voir docs/theme-builder/kolakisa-header-library.md pour la grammaire des rangées et l'ajout d'un modèle.
const { kit, sty } = require("./kit");

const FAMILIES = [
  { key: "classique", label: "Classique et corporate" },
  { key: "centre", label: "Centré et éditorial" },
  { key: "boutique", label: "Boutique et e-commerce" },
  { key: "minimal", label: "Minimal et portfolio" },
  { key: "saas", label: "SaaS et application" },
  { key: "transparent", label: "Transparent sur visuel" },
  { key: "collant", label: "Collant au défilement" },
  { key: "barre", label: "Avec barre supérieure" },
  { key: "magazine", label: "Magazine et blog" },
  { key: "creatif", label: "Créatif et structure libre" },
];

// ── Identités locales à une rangée : le texte et les boutons d'une rangée colorée (accent, encre) restent lisibles ───────────────────────────────────────────────
const tone = (S, bg) => {
  // Rangée secondaire : fond « alterné » de l'identité. L'identité « marque » a un alterné translucide (blanc 13 %) : avec son texte blanc il serait illisible sur la page claire, on passe alors à la teinte « encre »
  if (bg === "alt") return S.alt.startsWith("#") && S.alt.length === 9 ? tone(S, "ink") : { ...S, bg: S.alt, alt: S.bg };
  if (bg === "accent") return { ...S, bg: S.accent, fg: S.onAccent, mute: S.onAccent, alt: "#ffffff22", accent: S.onAccent, onAccent: S.accent, line: "#ffffff55" };
  if (bg === "ink" && S.ink) return { ...S, bg: S.ink, fg: S.onInk, mute: S.onInk, alt: S.ink, accent: S.onInk, onAccent: S.ink, line: "#ffffff44" };
  if (bg === "ink") return { ...S, bg: "token:text", fg: "token:background", mute: "token:background", alt: "token:text", accent: "token:background", onAccent: "token:text", line: "token:muted" };
  if (bg === "over") return { ...S, bg: "transparent", fg: "#ffffff", mute: "#ffffffcc", alt: "#00000066", accent: "#ffffff", onAccent: "#0b1220", line: "#ffffff55", shadow: "none" };
  return S;
};
const PAD = { xs: "6px", sm: "10px", lg: "24px", xl: "36px" };
const GLASS = (S) => (S.bg.startsWith("#") && S.bg.length === 7 ? `${S.bg}cc` : "#ffffffcc");
const HIDE_MOBILE = new Set(["social", "date", "note", "tag", "cta2", "link", "contact"]);

// Un code est masqué sur mobile s'il le demande (« @m », « @tm ») ou si c'est un élément secondaire (réseaux, date, message, pastille, bouton contour, lien, recherche compacte) sans « :keep » ; le bouton principal, le menu, le compte, le panier et la grande recherche restent
const hiddenOnMobile = (code) => { if (/@(tm|m)$/.test(code)) return true; const [name, x] = code.split("|")[0].split(":"); return (HIDE_MOBILE.has(name) && x !== "keep") || (name === "search" && x !== "wide"); };

// ── Un élément de zone : « nom:arg:arg|libellé|adresse » (+ « @m » / « @tm » pour masquer sur mobile / tablette et mobile) ───────────────────────────────────────
function item(k, code) {
  const hid = (code.match(/@(tm|m)$/) || [])[1];
  const [head, a1, a2] = code.replace(/@(tm|m)$/, "").split("|");
  const [name, x, y] = head.split(":");
  const S = k.S;
  let node;
  switch (name) {
    case "~": return { type: "spacer", props: { size: "8" } }; // zone vide : cale invisible qui garde le centre centré
    case "logo": node = k.logo(Number(x) || 44); break;
    case "title": node = k.siteTitle({ fontSize: `${Number(x) || 22}px` }); break;
    case "menu": node = k.menu("header", x === "sm" ? { fontSize: "14px" } : x === "lg" ? { fontSize: "17px" } : x === "caps" ? { fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.4px" } : {}); break;
    case "search": {
      node = k.search(y === "catalogue" ? "catalogue" : "blog", x === "wide" ? { flexGrow: 1, flexBasis: "320px", minWidth: "260px", maxWidth: "520px" } : { flexShrink: 0, width: "330px", maxWidth: "100%" });
      node.styles.mobile = { width: "100%", maxWidth: "100%", flexBasis: "100%" }; // sur mobile : sa propre ligne ; le bouton passe sous le champ plutôt que de se couper
      break;
    }
    case "account": node = k.account({ alignSelf: "center" }); node.props.showCart = false; break; // le panier est un élément à part (« cart »)
    case "cart": node = { type: "minicart", props: { label: "Panier", showCount: true, hideEmpty: false }, ...sty({ color: S.fg, fontWeight: "600" }) }; break;
    case "social": node = k.social([{ network: "facebook", url: "https://www.facebook.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }, { network: "instagram", url: "https://www.instagram.com/" }], { gap: "8px" }); break;
    case "date": node = { type: "dyntext", props: { source: "today", before: "", after: "", fallback: "", tag: "span" }, ...sty({ color: S.mute, fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.5px" }) }; break;
    case "note": node = k.T(`<p>${a1}</p>`, { fontSize: "14px", color: S.mute }); break;
    case "tag": node = k.T(`<p><strong>${a1 || "Nouveau"}</strong></p>`, { fontSize: "12px", backgroundColor: S.accent, color: S.onAccent, borderRadius: "999px", paddingTop: "3px", paddingBottom: "3px", paddingLeft: "10px", paddingRight: "10px" }); break;
    case "contact": node = k.W("iconlist", { items: [{ text: "Votre téléphone", icon: "smartphone" }, { text: "Votre adresse e-mail", icon: "mail" }], inline: true, iconColor: S.accent }, { color: S.fg, fontSize: "13px" }); break; // coordonnées : textes à remplacer, jamais de numéro inventé
    case "cta": node = k.B(a1 || "Découvrir", a2 || "/catalogue"); break;
    case "cta2": node = k.B(a1 || "Nous contacter", a2 || "/contact", "outline", S.bg === "token:primary" ? { color: S.fg, borderColor: S.fg } : {}); break; // identité « marque » : le contour orange sur le bleu de marque est trop peu contrasté (2,3)
    case "link": node = k.LINK(a1 || "Contact", a2 || "/contact", { alignSelf: "center", textDecoration: "none" }); break;
    default: throw new Error(`En-tête : élément inconnu « ${name} ».`);
  }
  // Identité PROPRE (polices de la bibliothèque) : la police s'applique à tous les éléments de texte. Le site impose sa propre police aux liens et aux boutons (`.lp-site a`, `.kw-btn`) : posée sur le widget, elle
  // ne les atteindrait pas ; pour le menu, le logo, le compte et la recherche on utilise donc les « parties » du widget (parts.js), dont le sélecteur l'emporte (le bouton de recherche prend ainsi les couleurs de l'identité, pas le bleu du site).
  if (S.font && S.font.startsWith("font.") && name !== "~") {
    const set = (d) => ({ styles: { desktop: d } });
    node = { ...node, styles: { ...(node.styles || {}), desktop: { ...((node.styles || {}).desktop || {}), fontFamily: name === "logo" || name === "title" ? S.head : S.font } } };
    if (name === "menu" || name === "account") node.parts = { link: set({ fontFamily: S.font }) };
    if (name === "search") node.parts = { field: set({ fontFamily: S.font, backgroundColor: S.alt, color: S.fg, borderColor: S.line }), button: set({ fontFamily: S.font, backgroundColor: S.accent, color: S.onAccent, borderRadius: S.btnRadius }) };
    if (name === "logo") node.parts = { text: set({ fontFamily: S.head, fontWeight: S.weight, fontSize: "24px", color: S.fg }) };
  }
  const hide = hid === "tm" ? ["tablet", "mobile"] : hiddenOnMobile(code) ? ["mobile"] : null;
  return hide ? { ...node, hideOn: hide } : node;
}

// ── Une rangée → une bande ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// row : { l, c, r : [codes], bg: "alt"|"accent"|"ink", pad: "xs"|"sm"|"lg"|"xl", rule: "none"|"thin"|"accent"|"thick"|"double", inn: {…}, card: true, pill: true, frame: true }
function band(S0, row, first, mode) {
  const over = first && mode === "overlay";
  const S = over ? tone(S0, "over") : tone(S0, row.bg);
  const k = kit(S);
  const l = row.l || [], c = row.c || [], r = row.r || [];
  const all = [...l, ...c, ...r];
  const mobileHidden = all.length > 0 && all.every(hiddenOnMobile);
  const zone = (codes, st, side) => k.row(codes.map((x) => item(k, x)), { gap: "20px", ...st }, null, side ? { flexBasis: "auto", flexGrow: 0 } : undefined);
  // Une zone vide d'une rangée à trois zones est remplie d'une cale invisible (« ~ ») : le centre reste centré quand les deux côtés partagent la place
  // Centre court (logo, titre, date, texte) : les deux côtés partagent la place à parts égales, le centre est vraiment centré. Centre long (menu, recherche large) : répartition « space-between », sans retour à la ligne forcé.
  const shortCentre = c.length > 0 && c.every((x) => /^(logo|title|date|note|tag|social|~)/.test(x));
  let zs;
  if (c.length && shortCentre) zs = [zone(l.length ? l : ["~"], { flexBasis: "0px", flexGrow: 1, justifyContent: "flex-start" }, true), zone(c, { justifyContent: "center" }), zone(r.length ? r : ["~"], { flexBasis: "0px", flexGrow: 1, justifyContent: "flex-end" }, true)];
  else if (c.length) zs = [zone(l.length ? l : ["~"]), zone(c, { justifyContent: "center", flexGrow: 1 }), zone(r.length ? r : ["~"], { justifyContent: "flex-end" })];
  else if (l.length && r.length) zs = [zone(l), zone(r, { justifyContent: "flex-end" })];
  else if (l.length) zs = [zone(l)];
  else zs = [zone(r, { marginLeft: "auto" })];
  const justify = c.length || (l.length && r.length) ? "space-between" : l.length ? "flex-start" : "flex-end";
  const padV = PAD[row.pad] || S.pad;
  const innSt = { justifyContent: justify, ...(row.inn || {}) };
  if (row.card) Object.assign(innSt, { backgroundColor: over ? "#0b122099" : S.alt, borderRadius: row.pill ? "999px" : S.radius === "0px" ? "0px" : "16px", boxShadow: S.shadow === "none" ? "md" : S.shadow, paddingTop: "12px", paddingBottom: "12px", paddingLeft: row.pill ? "26px" : "22px", paddingRight: row.pill ? "16px" : "22px" });
  if (row.frame) Object.assign(innSt, { borderStyle: "solid", borderWidth: "1.5px", borderColor: S.fg });
  const rule = row.rule || (row.card ? "none" : undefined);
  const bst = { paddingTop: padV, paddingBottom: padV };
  if (rule === "none") Object.assign(bst, { borderBottomWidth: "0px", boxShadow: "none" });
  else if (rule === "thin") Object.assign(bst, { borderStyle: "solid", borderBottomWidth: "1px", borderColor: S.line });
  else if (rule === "accent") Object.assign(bst, { borderStyle: "solid", borderBottomWidth: "4px", borderColor: S.accent });
  else if (rule === "thick") Object.assign(bst, { borderStyle: "solid", borderBottomWidth: "3px", borderColor: S.fg });
  else if (rule === "double") Object.assign(bst, { borderStyle: "double", borderBottomWidth: "6px", borderColor: S.fg });
  if (row.card) bst.backgroundColor = "transparent";
  if (first && mode === "glass") Object.assign(bst, { backdropBlur: 14, backgroundColor: GLASS(S) });
  if (over) Object.assign(bst, { backgroundColor: "transparent", color: "#ffffff", borderBottomWidth: "0px", boxShadow: "none" });
  const node = k.band([k.inner(zs, innSt, { justifyContent: "space-between", gap: "12px" }, { justifyContent: "space-between", gap: "10px" })], bst, { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "14px", paddingRight: "14px", paddingTop: row.pad === "xl" ? "20px" : undefined, paddingBottom: row.pad === "xl" ? "20px" : undefined });
  return mobileHidden ? { ...node, hideOn: ["mobile"] } : node;
}

// ── Définition d'un modèle ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const R = (l, c, r, o = {}) => ({ l, c, r, ...o });
const CTA = "cta|Découvrir|/catalogue", SUB = "cta|S'abonner|/blog", START = "cta|Commencer|/inscription", CONTACT = "cta2|Nous contacter|/contact", LOGIN = "link|Se connecter|/connexion";
const OFFER = "note|Une offre à mettre en avant — modifiez ce message.", MORE = "link|En savoir plus|/";
// Toutes les rangées sont dans UN conteneur pleine largeur (sans espace entre rangées) : c'est lui qui porte « collant » ou « superposé » (themeRender.partMode lit le premier enfant de la section),
// si bien que l'en-tête entier se comporte comme un seul bloc.
function wrap(S, bands, mode, fx) {
  const st = { display: "flex", flexDirection: "column", gap: "0px", width: "100%" };
  if (mode === "sticky") Object.assign(st, { position: "sticky", top: "0px", zIndex: 50, boxShadow: S.shadow === "none" ? "sm" : S.shadow });
  if (mode === "glass") Object.assign(st, { position: "sticky", top: "0px", zIndex: 50 });
  if (mode === "overlay") Object.assign(st, { position: "absolute", top: "0px", left: "0px", right: "0px", zIndex: 40 });
  return { type: "container", props: { full: true, ...(fx ? { headerFx: fx } : {}) }, children: bands, ...sty(st) };
}
// Modes composés : « stickyshrink » (collant, la rangée se réduit au défilement), « overlaysolid » (superposé et transparent, il devient plein au défilement)
const BASE_MODE = { stickyshrink: "sticky", overlaysolid: "overlay" }, FX = { stickyshrink: "shrink", overlaysolid: "solid" };
const M = (family, skin, key, label, tags, desc, rows, mode) => ({ key, family, skin, label, tags, desc,
  build: (k) => [wrap(k.S, rows.map((row, i) => band(k.S, row, i === 0, BASE_MODE[mode] || mode)), BASE_MODE[mode] || mode, FX[mode])] });

const { IDENT, IDENT2, MOODS } = require("./identities");

const LAYOUTS = [
  // ── 1 · Classique et corporate ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  M("classique", "clair", "classique-logo-menu-bouton", "Logo, menu et bouton d'action", ["classique", "navigation", "bouton"], "Logo à gauche, menu et bouton d'action à droite.", [R(["logo"], [], ["menu", CTA])]),
  M("classique", "editorial", "classique-menu-contre-logo", "Menu collé au logo", ["classique", "contact", "double bouton"], "Menu juste après le logo, deux boutons à droite.", [R(["logo", "menu"], [], [CONTACT, CTA])]),
  M("classique", "nuit", "classique-connexion", "Connexion et inscription", ["compte", "double action"], "Menu, lien de connexion et bouton d'inscription.", [R(["logo"], [], ["menu", LOGIN, "cta|Créer un compte|/inscription"])]),
  M("classique", "clair", "classique-menu-centre-recherche", "Menu central et recherche", ["recherche", "centré", "bouton"], "Menu au centre, recherche et bouton à droite.", [R(["logo"], ["menu"], ["search:mini", CTA])]),
  M("classique", "editorial", "classique-logo-central", "Logo central", ["centré", "élégant", "bouton"], "Menu à gauche, logo au centre, bouton à droite.", [R(["menu"], ["logo:48"], [CTA])]),
  M("classique", "doux", "classique-large", "Pleine largeur aérée", ["large", "aéré", "rendez-vous"], "Colonne élargie, logo plus grand, rangée haute.", [R(["logo:52"], [], ["menu", "cta|Prendre rendez-vous|/contact"], { pad: "lg", inn: { maxWidth: "1440px" } })]),
  M("classique", "nuit", "classique-deux-niveaux", "Deux niveaux", ["complet", "navigation", "aide"], "Logo, aide et bouton ; menu sur une seconde rangée centrée.", [R(["logo"], [], ["link|Aide|/faq", CTA], { rule: "none" }), R([], ["menu"], [], { bg: "alt", pad: "sm" })]),

  // ── 2 · Centré et éditorial ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  M("centre", "clair", "centre-logo-au-dessus", "Logo au-dessus du menu", ["centré", "empilé", "éditorial"], "Logo centré, menu centré dessous.", [R([], ["logo:52"], [], { rule: "none" }), R([], ["menu"], [], { pad: "sm" })]),
  M("centre", "editorial", "centre-titre-de-journal", "Titre de journal", ["éditorial", "date", "recherche"], "Date et recherche, grand titre, menu sous filet.", [R(["date"], [], ["search:mini"], { pad: "sm", rule: "none" }), R([], ["title:44"], [], { rule: "none" }), R([], ["menu:caps"], [], { rule: "thin", pad: "sm" })]),
  M("centre", "doux", "centre-menu-gauche-compte-droite", "Menu, logo, compte", ["centré", "compte", "doux"], "Menu à gauche, logo au centre, compte à droite.", [R(["menu"], ["logo:48"], ["account"])]),
  M("centre", "editorial", "centre-filet-double", "Titre à filet double", ["éditorial", "serif", "filet"], "Titre centré entre filets, menu en capitales.", [R([], ["title:38"], [], { rule: "double" }), R([], ["menu:caps"], [], { pad: "sm" })]),
  M("centre", "clair", "centre-date-titre-recherche", "Date, titre, recherche, menu", ["éditorial", "blog", "date"], "Date à gauche, titre centré, recherche à droite ; menu discret dessous.", [R(["date"], ["title:30"], ["search:mini"], { rule: "none" }), R([], ["menu:sm"], [], { pad: "sm" })]),
  M("centre", "nuit", "centre-menu-logo-panier", "Menu, logo, panier", ["centré", "boutique", "compte"], "Menu à gauche, logo au centre, connexion et panier.", [R(["menu"], ["logo:46"], [LOGIN, "cart"])]),
  M("centre", "marque", "centre-signature", "Titre et signature", ["signature", "centré", "marque"], "Titre centré, une ligne de signature, menu dessous.", [R([], ["title:34"], [], { rule: "none", pad: "sm" }), R([], ["note:keep|Votre signature en une ligne — modifiez ce texte."], [], { rule: "none", pad: "xs" }), R([], ["menu"], [], { pad: "sm" })]),
  M("centre", "doux", "centre-reseaux-logo-bouton", "Réseaux, logo, bouton, menu", ["réseaux", "centré", "bouton"], "Réseaux sociaux, logo central, bouton d'action ; menu centré dessous.", [R(["social"], ["logo:46"], [CTA], { rule: "none" }), R([], ["menu:sm"], [], { pad: "xs" })]),
  M("centre", "marque", "centre-logo-menu-bouton-empiles", "Logo, menu et bouton empilés", ["centré", "empilé", "bouton"], "Logo, menu réduit puis bouton, tous centrés.", [R([], ["logo:40"], [], { rule: "none", pad: "sm" }), R([], ["menu:sm"], [], { rule: "none", pad: "xs" }), R([], [CTA], [], { pad: "sm" })]),
  M("centre", "nuit", "centre-grand-titre", "Grand titre, menu et recherche", ["affiche", "capitales", "recherche"], "Grand titre centré ; menu en capitales à gauche, recherche à droite.", [R([], ["title:40"], [], { pad: "xl", rule: "none" }), R(["menu:caps"], [], ["search:mini"], { pad: "sm" })]),

  // ── 3 · Boutique et e-commerce ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  M("boutique", "clair", "boutique-complete", "Recherche, compte et panier", ["boutique", "panier", "compte"], "Logo, menu central, recherche, compte et panier.", [R(["logo"], ["menu"], ["search:mini", "account", "cart"])]),
  M("boutique", "doux", "boutique-recherche-large", "Grande recherche et rayons", ["recherche", "boutique", "panier"], "Logo, large champ de recherche, compte et panier ; menu des rayons dessous.", [R(["logo"], ["search:wide:catalogue"], ["account", "cart"], { rule: "none" }), R([], ["menu"], [], { bg: "alt", pad: "sm" })]),
  M("boutique", "marque", "boutique-promo-trois-niveaux", "Promotion et trois niveaux", ["promotion", "boutique", "catégories"], "Bandeau promotionnel, logo/recherche/compte, menu en rangée.", [R([], [OFFER], [], { bg: "accent", pad: "xs", rule: "none" }), R(["logo"], ["search:wide:catalogue"], ["account", "cart"], { rule: "none" }), R([], ["menu"], [], { bg: "alt", pad: "sm" })]),
  M("boutique", "editorial", "boutique-menu-compte-panier", "Menu, compte et panier", ["boutique", "compte", "sobre"], "Logo, menu au centre, compte et panier, sans recherche.", [R(["logo"], ["menu"], ["account", "cart"])]),
  M("boutique", "clair", "boutique-panier-seul", "Panier seul", ["boutique", "panier", "épuré"], "Logo, menu, mini-panier.", [R(["logo"], [], ["menu", "cart"])]),
  M("boutique", "nuit", "boutique-recherche-compte", "Recherche et compte", ["recherche", "compte", "sombre"], "Logo, grand champ de recherche, compte.", [R(["logo"], ["search:wide"], ["account"])]),
  M("boutique", "doux", "boutique-rayons", "Rayons sous la recherche", ["catégories", "boutique", "rayons"], "Logo, recherche, compte, panier ; menu des rayons sur une seconde rangée.", [R(["logo"], [], ["search:mini:catalogue", "account", "cart"], { rule: "none" }), R(["menu"], [], ["link|Promotions|/catalogue"], { bg: "alt", pad: "sm" })]),
  M("boutique", "editorial", "boutique-service", "Barre de service", ["service", "aide", "boutique"], "Message de service et aide au-dessus, logo/menu/panier dessous.", [R(["note:keep|Une information de service à afficher ici."], [], ["link|Aide|/faq"], { bg: "alt", pad: "xs", rule: "none" }), R(["logo"], ["menu"], ["cart"])]),
  M("boutique", "marque", "boutique-vitrine", "Vitrine centrée", ["boutique", "centré", "vitrine"], "Menu à gauche, logo au centre, recherche et panier.", [R(["menu"], ["logo:50"], ["search:mini", "cart"])]),

  // ── 4 · Minimal et portfolio ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  M("minimal", "clair", "minimal-nom-et-menu", "Nom et menu", ["minimaliste", "portfolio", "sobre"], "Titre du site à gauche, menu à droite.", [R(["title:24"], [], ["menu"])]),
  M("minimal", "editorial", "minimal-menu-gauche-logo-droite", "Menu à gauche, logo à droite", ["minimaliste", "capitales", "inversé"], "Menu en capitales à gauche, petit logo à droite.", [R(["menu:caps"], [], ["logo:36"], { pad: "lg" })]),
  M("minimal", "nuit", "minimal-portfolio", "Portfolio", ["portfolio", "capitales", "sombre"], "Petit titre, menu en capitales au centre, lien de contact, grandes marges.", [R(["title:20"], ["menu:caps"], ["link|Contact|/contact"], { pad: "xl" })]),
  M("minimal", "marque", "minimal-parlons-en", "Menu et « Parlons-en »", ["minimaliste", "contact", "bouton"], "Menu et bouton de contact contour.", [R(["logo:38"], [], ["menu", "cta2|Parlons-en|/contact"])]),
  M("minimal", "doux", "minimal-pastille-flottante", "Pastille flottante", ["flottant", "arrondi", "moderne"], "Logo, menu et bouton dans une pastille détachée du bord.", [R(["logo:34"], ["menu"], [CTA], { card: true, pill: true })]),
  M("minimal", "editorial", "minimal-logo-recherche", "Logo et recherche sous filet", ["minimaliste", "recherche", "filet"], "Logo et recherche, sans menu, simple filet dessous.", [R(["logo:44"], [], ["search:mini"], { pad: "xl", rule: "thin" })]),
  M("minimal", "nuit", "minimal-titre-menu-central", "Titre et menu central", ["minimaliste", "sombre", "titre"], "Titre à gauche, menu discret au centre.", [R(["title"], ["menu:sm"], [])]),
  M("minimal", "marque", "minimal-logo-central-menu-droite", "Logo central, menu à droite", ["minimaliste", "centré", "compact"], "Petit logo au centre, menu réduit à droite.", [R([], ["logo:30"], ["menu:sm"], { pad: "sm" })]),

  // ── 5 · SaaS et application ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  M("saas", "clair", "saas-connexion-essai", "Connexion et essai", ["saas", "connexion", "inscription"], "Menu, connexion, bouton d'essai.", [R(["logo"], [], ["menu", LOGIN, START])]),
  M("saas", "marque", "saas-annonce-nouveau", "Annonce « Nouveau »", ["annonce", "saas", "bouton"], "Bandeau d'annonce avec pastille, puis en-tête classique.", [R([], ["tag|Nouveau", "note|Découvrez la dernière nouveauté — modifiez ce message.", MORE], [], { bg: "accent", pad: "xs", rule: "none" }), R(["logo"], [], ["menu", CTA])]),
  M("saas", "doux", "saas-pilule", "Pilule connexion", ["flottant", "pilule", "saas"], "Pilule flottante : logo, menu, connexion, bouton.", [R(["logo:34"], ["menu"], ["link|Connexion|/connexion", START], { card: true, pill: true })]),
  M("saas", "clair", "saas-verre-depoli", "Verre dépoli collant", ["collant", "verre", "moderne"], "Reste en haut de page, fond translucide flouté.", [R(["logo:40"], [], ["menu", START])], "glass"),
  M("saas", "nuit", "saas-demo-et-essai", "Démo et essai", ["saas", "double bouton", "sombre"], "Menu central, bouton contour « démo » et bouton plein.", [R(["logo"], ["menu"], ["cta2|Voir la démo|/contact", START])]),
  M("saas", "nuit", "saas-recherche-docs", "Recherche et connexion", ["recherche", "documentation", "sombre"], "Menu près du logo, recherche, connexion, bouton.", [R(["logo", "menu"], [], ["search:mini", "link|Connexion|/connexion", START])]),
  M("saas", "marque", "saas-essai-gratuit", "Essai gratuit centré", ["saas", "centré", "marque"], "Menu centré, bouton « essai gratuit ».", [R(["logo"], ["menu"], ["cta|Essai gratuit|/inscription"])]),
  M("saas", "editorial", "saas-logo-pastille", "Logo et pastille", ["nouveau", "pastille", "saas"], "Pastille à côté du logo, menu et bouton.", [R(["logo", "tag|Nouveau@tm"], [], ["menu", CTA])]),
  M("saas", "editorial", "saas-produit-recherche", "Produit et recherche", ["produit", "recherche", "bouton"], "Menu central, recherche et bouton de démarrage.", [R(["logo"], ["menu"], ["search:mini", START])]),

  // ── 6 · Transparent sur visuel (superposé : posé sur le visuel d'ouverture de la page) ─────────────────────────────────────────────────────────────────────
  M("transparent", "nuit", "superpose-classique", "Superposé classique", ["transparent", "superposé", "héros"], "Posé sur le visuel d'ouverture, logo à gauche, menu et bouton à droite.", [R(["logo"], [], ["menu", CTA])], "overlay"),
  M("transparent", "clair", "superpose-logo-central", "Superposé, logo central", ["transparent", "centré", "héros"], "Menu, logo central et bouton sur le visuel.", [R(["menu"], ["logo:50"], [CTA])], "overlay"),
  M("transparent", "doux", "superpose-menu-pres-du-logo", "Superposé, menu près du logo", ["transparent", "contour", "héros"], "Logo et menu à gauche, bouton contour à droite.", [R(["logo", "menu"], [], ["cta2|Contact|/contact"])], "overlay"),
  M("transparent", "editorial", "superpose-titre-capitales", "Superposé, titre et capitales", ["transparent", "éditorial", "capitales"], "Titre du site et menu en capitales sur le visuel.", [R(["title:24"], [], ["menu:caps"])], "overlay"),
  M("transparent", "nuit", "superpose-recherche-compte", "Superposé, recherche et compte", ["transparent", "recherche", "compte"], "Menu central, recherche et compte sur le visuel.", [R(["logo"], ["menu"], ["search:mini", "account"])], "overlay"),
  M("transparent", "clair", "superpose-reseaux", "Superposé, réseaux", ["transparent", "réseaux", "centré"], "Réseaux à gauche, logo central, menu à droite.", [R(["social"], ["logo:48"], ["menu"])], "overlay"),
  M("transparent", "marque", "superpose-grand-large", "Superposé, très large", ["transparent", "large", "héros"], "Colonne élargie, grand logo, menu agrandi central et bouton.", [R(["logo:52"], ["menu:lg"], [CTA], { pad: "xl", inn: { maxWidth: "1440px" } })], "overlay"),
  M("transparent", "editorial", "superpose-contact", "Superposé, parlons-en", ["transparent", "contact", "éditorial"], "Titre, menu en capitales et bouton contour.", [R(["title:26"], [], ["menu:caps", "cta2|Parlons-en|/contact"])], "overlay"),
  M("transparent", "doux", "superpose-menu-panier", "Superposé, menu et panier", ["transparent", "boutique", "panier"], "Logo, menu et mini-panier sur le visuel.", [R(["logo:40"], [], ["menu", "cart"])], "overlay"),

  // ── 7 · Collant au défilement ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  M("collant", "clair", "collant-classique", "Collant classique", ["collant", "sticky", "ombre"], "Reste collé en haut, ombre légère.", [R(["logo"], [], ["menu", CTA])], "sticky"),
  M("collant", "doux", "collant-verre-central", "Verre, menu central", ["collant", "verre", "recherche"], "Verre dépoli : menu, logo central, recherche et compte.", [R(["menu"], ["logo:42"], ["search:mini", "account"])], "glass"),
  M("collant", "marque", "collant-ombre-marque", "Collant couleur de marque", ["collant", "marque", "ombre"], "Bande de marque collée, menu central, bouton.", [R(["logo"], ["menu"], [CTA])], "sticky"),
  M("collant", "clair", "collant-centre-panier", "Collant, logo central et panier", ["collant", "boutique", "centré"], "Menu, logo central, recherche et panier.", [R(["menu"], ["logo:46"], ["search:mini", "cart"])], "sticky"),
  M("collant", "nuit", "collant-fin-sombre", "Collant fin sombre, titre et panier", ["collant", "compact", "boutique"], "Rangée fine et sombre : titre, menu réduit central, panier.", [R(["title:20"], ["menu:sm"], ["cart"], { pad: "xs" })], "sticky"),
  M("collant", "doux", "collant-recherche-compte", "Collant, recherche et compte", ["collant", "recherche", "compte"], "Logo et menu, recherche et compte.", [R(["logo", "menu"], [], ["search:mini", "account"])], "sticky"),
  M("collant", "nuit", "collant-connexion", "Collant, connexion", ["collant", "connexion", "sombre"], "Menu, connexion et bouton.", [R(["logo"], [], ["menu", LOGIN, CTA])], "sticky"),
  M("collant", "marque", "collant-deux-rangees", "Collant, deux rangées", ["collant", "complet", "navigation"], "Rangée du haut collée ; menu sur une seconde rangée.", [R(["logo"], [], ["link|Contact|/contact", CTA], { rule: "none" }), R([], ["menu"], [], { bg: "alt", pad: "sm" })], "sticky"),
  M("collant", "editorial", "collant-ruban", "Collant, ruban éditorial", ["collant", "éditorial", "recherche"], "Menu en capitales, titre central, recherche.", [R(["menu:caps"], ["title:30"], ["search:mini"])], "sticky"),

  // ── 8 · Avec barre supérieure ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  M("barre", "clair", "barre-reseaux-compte", "Barre réseaux et compte", ["barre supérieure", "réseaux", "compte"], "Fine barre (réseaux, compte) au-dessus de l'en-tête.", [R(["social"], [], ["account"], { bg: "alt", pad: "xs", rule: "none" }), R(["logo"], [], ["menu", CTA])]),
  M("barre", "marque", "barre-annonce-centree", "Barre d'annonce", ["annonce", "promotion", "bouton"], "Annonce centrée avec lien, puis logo, menu et bouton.", [R([], [OFFER, MORE], [], { bg: "accent", pad: "xs", rule: "none" }), R(["logo"], ["menu"], [CTA])]),
  M("barre", "editorial", "barre-contact-titre", "Barre contact et titre", ["contact", "éditorial", "barre supérieure"], "Message et liens de service, titre et menu en capitales.", [R(["note:keep|Une question ? Écrivez-nous."], [], ["link|Contact|/contact", LOGIN], { bg: "alt", pad: "xs", rule: "none" }), R(["title:28"], [], ["menu:caps"])]),
  M("barre", "nuit", "barre-date-aide", "Barre date et aide", ["date", "aide", "sombre"], "Date et aide au-dessus, logo, menu et recherche.", [R(["date"], [], ["link|Aide|/faq"], { bg: "alt", pad: "xs", rule: "none" }), R(["logo"], ["menu"], ["search:mini"])]),
  M("barre", "doux", "barre-recherche-large", "Barre réseaux, grande recherche", ["recherche", "compte", "réseaux"], "Réseaux, compte et panier au-dessus ; logo et menu, grande recherche et bouton.", [R(["social"], [], ["account", "cart"], { bg: "alt", pad: "xs", rule: "none" }), R(["logo", "menu:sm"], ["search:wide:catalogue"], [CTA])]),
  M("barre", "clair", "barre-cta-logo-centre", "Barre bouton, logo centré", ["barre supérieure", "centré", "bouton"], "Message et bouton, puis logo centré et menu dessous.", [R(["note:keep|Ouverture, nouveauté, événement : une phrase suffit."], [], [CTA], { bg: "accent", pad: "xs", rule: "none" }), R([], ["logo:48"], [], { rule: "none" }), R([], ["menu"], [], { pad: "sm" })]),
  M("barre", "marque", "barre-encre-date-reseaux", "Barre encre", ["date", "réseaux", "contraste"], "Barre sombre (date, réseaux) au-dessus d'un en-tête classique.", [R(["date"], [], ["social"], { bg: "ink", pad: "xs", rule: "none" }), R(["logo"], [], ["menu", CTA])]),
  M("barre", "nuit", "barre-service-compte-panier", "Barre service, compte et panier", ["service", "boutique", "sombre"], "Liens de service, compte et panier ; logo et menu central.", [R(["link|Aide|/faq", "link|Contact|/contact"], [], ["account", "cart"], { bg: "alt", pad: "xs", rule: "none" }), R(["logo"], ["menu"], [])]),
  M("barre", "editorial", "barre-titre-reseaux-menu", "Barre éditoriale complète", ["éditorial", "date", "réseaux"], "Date et réseaux, grand titre centré, menu en capitales.", [R(["date"], [], ["social"], { pad: "xs", rule: "thin" }), R([], ["title:36"], [], { rule: "none" }), R([], ["menu:caps"], [], { pad: "sm" })]),

  // ── 9 · Magazine et blog ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  M("magazine", "clair", "blog-classique-abonnement", "Blog et abonnement", ["blog", "recherche", "abonnement"], "Logo, rubriques, recherche et bouton d'abonnement.", [R(["logo:40"], [], ["menu", "search:mini", SUB])]),
  M("magazine", "editorial", "magazine-une", "Une de magazine", ["magazine", "date", "abonnement"], "Grand titre, date et recherche ; rubriques et abonnement dessous.", [R(["title:40"], [], ["date", "search:mini"], { rule: "none" }), R(["menu:caps"], [], [SUB], { bg: "alt", pad: "sm" })]),
  M("magazine", "doux", "blog-grande-recherche", "Blog, grande recherche et rubriques", ["blog", "recherche", "abonnement"], "Logo, large champ de recherche, bouton d'abonnement ; rubriques dessous.", [R(["logo"], ["search:wide"], [SUB], { rule: "none" }), R([], ["menu"], [], { bg: "alt", pad: "sm" })]),
  M("magazine", "clair", "blog-rubriques-dessous", "Rubriques sous le logo", ["blog", "rubriques", "recherche"], "Logo et recherche ; rubriques sur une seconde rangée.", [R(["logo"], [], ["search:mini"], { rule: "none" }), R(["menu"], [], [], { bg: "alt", pad: "sm" })]),
  M("magazine", "marque", "blog-newsletter", "Blog et newsletter", ["blog", "newsletter", "marque"], "Titre, menu central, bouton d'abonnement.", [R(["title:24"], ["menu"], [SUB])]),
  M("magazine", "editorial", "magazine-titre-gauche", "Titre, date et rubriques, filet épais", ["magazine", "éditorial", "date"], "Titre à gauche, date et rubriques en capitales, filet épais.", [R(["title:34"], [], ["date", "menu:caps"], { rule: "thick" })]),
  M("magazine", "nuit", "magazine-reseaux-titre", "Réseaux, titre, recherche, rubriques", ["magazine", "réseaux", "sombre"], "Réseaux à gauche, titre central, recherche à droite ; rubriques en capitales dessous.", [R(["social"], ["title:30"], ["search:mini"], { rule: "none" }), R([], ["menu:caps"], [], { pad: "sm" })]),
  M("magazine", "doux", "blog-compte-abonnement", "Blog, compte et abonnement", ["blog", "compte", "abonnement"], "Menu, connexion et bouton d'abonnement.", [R(["logo"], [], ["menu", "link|Connexion|/connexion", SUB])]),
  M("magazine", "marque", "magazine-filet-double", "Magazine, double filet", ["magazine", "recherche", "compte"], "Titre centré sous double filet ; recherche, rubriques, compte.", [R([], ["title:40"], [], { rule: "double" }), R(["search:mini"], ["menu"], ["account"], { pad: "sm" })]),

  // ── 10 · Créatif et structure libre ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  M("creatif", "doux", "creatif-carte-ombree", "Carte ombrée avec compte", ["carte", "encadré", "compte"], "En-tête encadré dans une carte à ombre portée : logo, menu, compte.", [R(["logo:38"], [], ["menu", "account"], { card: true })]),
  M("creatif", "editorial", "creatif-cadre-contour", "Cadre contour", ["cadre", "contour", "éditorial"], "Titre, menu en capitales et bouton dans un cadre fin.", [R(["title:26"], ["menu:caps"], ["cta2|Contact|/contact"], { card: true, frame: true })]),
  M("creatif", "clair", "creatif-asymetrique", "Asymétrique", ["asymétrique", "grand logo", "menu bas"], "Grand logo à gauche, menu et bouton alignés à droite dessous.", [R(["logo:56"], [], [], { rule: "none" }), R([], [], ["menu", CTA], { pad: "sm" })]),
  M("creatif", "marque", "creatif-bandeau-marque", "Bandeau de marque, menu centré dessous", ["marque", "bandeau", "large"], "Large bande de couleur : logo et bouton, menu agrandi centré sur une seconde rangée.", [R(["logo:56"], [], [CTA], { pad: "lg", rule: "none" }), R([], ["menu:lg"], [], { pad: "sm" })]),
  M("creatif", "nuit", "creatif-bicolore", "Bicolore", ["bicolore", "réseaux", "contraste"], "Rangée d'accent (logo, réseaux) et rangée sombre (menu, bouton).", [R(["logo"], [], ["social"], { bg: "accent", rule: "none" }), R(["menu"], [], [CTA], { bg: "alt", pad: "sm" })]),
  M("creatif", "doux", "creatif-double-carte", "Deux cartes", ["cartes", "flottant", "compte"], "Une carte logo/compte/panier, une pastille de navigation.", [R(["logo:36"], [], ["cart", "account"], { card: true, rule: "none" }), R([], ["menu"], [], { card: true, pill: true, pad: "sm" })]),
  M("creatif", "editorial", "creatif-pile-centre-reseaux", "Pile centrée avec réseaux", ["empilé", "centré", "réseaux"], "Titre, menu en capitales et réseaux, centrés.", [R([], ["title:36"], [], { rule: "none", pad: "sm" }), R([], ["menu:caps"], [], { rule: "none", pad: "xs" }), R([], ["social:keep"], [], { pad: "sm" })]),
  M("creatif", "nuit", "creatif-icones", "Icônes", ["icônes", "compact", "réseaux"], "Titre à gauche ; réseaux, panier et compte en icônes.", [R(["title"], [], ["social:keep", "cart", "account"])]),
  M("creatif", "marque", "creatif-menu-geant", "Menu géant et recherche", ["affiche", "aéré", "recherche"], "Rangée très haute, menu agrandi, liseré d'accent ; recherche sur une seconde rangée.", [R(["logo"], [], ["menu:lg"], { pad: "xl", rule: "accent" }), R(["search:wide"], [], [], { bg: "alt", pad: "sm" })]),

  // ── Modèles sectoriels (répartis dans leur famille) : identité, palette et polices propres (liste IDENT) ──────────────────────────────────────────────────────
  M("classique", "resto", "restaurant-reservation", "Restaurant : réservation et carte", ["restaurant", "réservation", "chaleureux"], "Barre de coordonnées ; logo central entre la carte et le bouton de réservation.", [R(["contact"], [], ["social"], { bg: "alt", pad: "xs", rule: "none" }), R(["menu:caps"], ["logo:52"], ["link|La carte|/catalogue", "cta|Réserver une table|/contact"], { pad: "lg", rule: "thin" })]),
  M("classique", "ecole", "ecole-inscriptions", "École : inscriptions et espace élève", ["éducation", "inscription", "élèves"], "Bandeau d'annonce, logo, menu et boutons d'inscription ; se réduit au défilement.", [R(["note|Inscriptions ouvertes : modifiez ce message."], [], ["link|Espace élève|/connexion"], { bg: "accent", pad: "xs", rule: "none" }), R(["logo:44"], [], ["menu", "cta|S'inscrire|/inscription"], { rule: "thin" })], "stickyshrink"),
  M("creatif", "agence", "agence-brutaliste", "Agence : titre brut en capitales", ["agence", "créatif", "contraste"], "Nom en capitales, menu en capitales, bouton au ton acide, filet épais ; se réduit au défilement.", [R(["title:26"], [], ["menu:caps", "cta|Parlons-en|/contact"], { rule: "thick", pad: "lg" })], "stickyshrink"),
  M("classique", "cabinet", "cabinet-confiance", "Cabinet : coordonnées et rendez-vous", ["cabinet", "professionnel", "rendez-vous"], "Barre de coordonnées, logo, menu et bouton de rendez-vous.", [R(["contact"], [], ["link|Espace client|/connexion"], { bg: "alt", pad: "xs", rule: "none" }), R(["logo:44"], [], ["menu", "cta|Prendre rendez-vous|/contact"])]),
  M("minimal", "portfolio", "portfolio-signature", "Portfolio : signature et menu discret", ["portfolio", "minimaliste", "signature"], "Nom en grand à gauche, menu discret à droite, sans filet ; se réduit au défilement.", [R(["title:30"], [], ["menu:sm"], { rule: "none", pad: "lg" })], "stickyshrink"),
  M("saas", "saas", "saas-violet-essai", "SaaS : essai gratuit", ["saas", "produit", "essai"], "Logo, menu central, connexion et bouton d'essai ; se réduit au défilement.", [R(["logo:38"], ["menu"], [LOGIN, "cta|Essai gratuit|/inscription"], { rule: "thin" })], "stickyshrink"),
  M("magazine", "media", "media-une-du-jour", "Média : une du jour", ["média", "magazine", "éditorial"], "Date et recherche, grand titre centré, rubriques en capitales sous double filet.", [R(["date"], [], ["search:mini"], { pad: "xs", rule: "none" }), R([], ["title:46"], [], { rule: "none" }), R([], ["menu:caps"], [], { rule: "double", pad: "sm" })]),
  M("boutique", "mode", "mode-boutique-promo", "Mode : boutique et promotion", ["boutique", "mode", "promotion"], "Bandeau promotionnel, logo central, menu à gauche, compte et panier à droite.", [R([], ["note:keep|Une offre à mettre en avant : modifiez ce message."], [], { bg: "accent", pad: "xs", rule: "none" }), R(["menu"], ["logo:46"], ["account", "cart"], { rule: "thin", pad: "lg" })]),
  M("transparent", "hotel", "hotel-couverture", "Hôtel : superposé à la couverture", ["hôtel", "luxe", "superposé"], "En-tête transparent sur le visuel d'ouverture ; il devient plein au défilement.", [R(["menu:caps"], ["title:30"], ["cta2|Réserver|/contact"], { pad: "lg", rule: "none" })], "overlaysolid"),
  M("barre", "asso", "association-don", "Association : faire un don", ["association", "don", "engagement"], "Bandeau d'engagement, logo, menu et grand bouton « Faire un don ».", [R(["note|Chaque geste compte : modifiez ce message."], [], ["link|Devenir bénévole|/contact"], { bg: "alt", pad: "xs", rule: "none" }), R(["logo:46"], [], ["menu", "cta|Faire un don|/contact"], { pad: "lg", rule: "accent" })]),
  M("collant", "immo", "immobilier-recherche", "Immobilier : recherche de biens", ["immobilier", "recherche", "annonces"], "Logo et menu, large recherche, bouton de contact ; se réduit au défilement.", [R(["logo:40", "menu"], ["search:wide"], ["cta|Nous contacter|/contact"], { rule: "thin" })], "stickyshrink"),
  M("minimal", "sante", "bien-etre-pastille", "Bien-être : pastille douce", ["bien-être", "santé", "pastille"], "En-tête en pastille arrondie : logo, menu et bouton de rendez-vous.", [R(["logo:38"], [], ["menu", "cta|Prendre rendez-vous|/contact"], { card: true, pill: true, rule: "none" })]),
];

// Remplacement des cinq identités du site par les palettes propres (le suffixe de clé d'origine est gardé dans keySkin)
const seen = {};
for (const l of LAYOUTS) {
  const mood = MOODS[l.skin];
  if (!mood) continue;
  const pool = IDENT2.filter((x) => x.mood === mood);
  const n = seen[mood] = (seen[mood] || 0) + 1;
  l.keySkin = l.skin; l.skin = pool[(n - 1) % pool.length].key;
}

module.exports = { type: "header", kind: "component", flat: true, ownSkins: true, families: FAMILIES, layouts: LAYOUTS, skins: [...IDENT2.map(({ mood: _m, ...x }) => x), ...IDENT] };
