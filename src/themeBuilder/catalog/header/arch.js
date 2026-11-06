// 36 ARCHITECTURES d'en-tête (compositions réellement différentes : nombre de rangées, grille, proportions, place de la marque et de la navigation, formes, filets), pas des variantes de couleur.
// Une architecture = (k, P, V) → rangées : k = kit de l'identité du modèle ; P = contenu du secteur (libellés de bouton, message, accroche) ; V = réglages propres au modèle (act, nav, tailles, casse…).
// V.act : actions de droite, une lettre par élément (s = recherche, a = compte, c = panier, i = réseaux, b = bouton principal, o = bouton contour, t = pastille).
const B = require("./blocks");
const { readable, mark, nav, btn, search, account, cart, social, date, note, tag, line, sp, contact, g, stack, grid, band, inner } = B;
const { compact } = require("../kit");

const rule = (S, o) => (o ? { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: o.w || "1px", borderColor: o.c || S.line } : {});
// Une rangée : bande pleine largeur au fond voulu + contenu borné
const R = (k, kids, o = {}) => band(k.S, [inner(kids, { justifyContent: o.j || "space-between", ...(o.inn || {}) }, o.innT, o.innM)],
  compact({ backgroundColor: o.bg || k.S.bg, color: o.fg || k.S.fg, paddingTop: o.pv || "16px", paddingBottom: o.pv || "16px", ...rule(k.S, o.rule), ...(o.top ? { borderTopWidth: o.top.w || "1px", borderStyle: "solid", borderColor: o.top.c || k.S.line } : {}), ...(o.st || {}) }), o.t, o.m);
const A = (k, P, V, extra = {}) => {
  const out = [], a = V.act || "", S = k.S;
  for (const ch of a) {
    if (ch === "s") out.push(search(k, { w: V.sw || "360px", ...(V.sOpt || {}) }));
    if (ch === "a") out.push(account(k, { color: extra.color }));
    if (ch === "c") out.push(cart(k, { color: extra.color }));
    if (ch === "i") out.push(social(k, { shape: S.radius === "0px" ? "square" : "circle", n: V.n || 3 }));
    if (ch === "t") out.push(tag(k, P.tag || "Nouveau"));
    if (ch === "o") out.push(btn(k, P.cta2 ? P.cta2[0] : "Nous contacter", P.cta2 ? P.cta2[1] : "/contact", "outline", V.b2 || {}));
    if (ch === "b") out.push(btn(k, P.cta[0], P.cta[1], V.bk || "solid", V.bo || {}));
  }
  return g(out, { gap: V.ag || "14px", justifyContent: "flex-end", flexWrap: "nowrap", ...(extra.st || {}) }, { flexWrap: "wrap" });
};
const M = (k, V, o = {}) => mark(k, { kind: V.mk || "logo", size: V.ms, h: V.mh, caps: V.mc, track: V.mt, weight: V.mw, font: V.mf, italic: V.mi, color: o.color, ...o });
const N = (k, V, o = {}) => nav(k, V.nav || "plain", { size: V.ns, caps: V.nc, track: V.nt, weight: V.nw, gap: V.ng, color: o.color, hover: V.nh, onHover: V.nho, ...o });
const bar = (k, P, V, o = {}) => { const bg = o.bg || k.S.accent, fg = o.fg || readable(bg);
  return R(k, [note(k, P.notice, { color: fg, size: "12.5px", caps: V.bc, track: V.bt }), g([V.bar === "social" ? social(k, { n: 2, size: 22 }) : V.bar === "contact" ? contact(k, { color: fg, icon: o.icon }) : V.bar === "date" ? date(k, { color: fg }) : note(k, P.right || "Livraison offerte dès un montant à définir", { color: fg, size: "12.5px" })], { gap: "14px" })], { bg, fg, pv: "8px", j: "space-between" }); };

const ARCH = {
  // 1 · Classique : marque à gauche, navigation à droite, actions
  classic: (k, P, V) => [R(k, [M(k, V), N(k, V, { st: { marginLeft: "auto" } }), A(k, P, V)], { pv: V.pv || "16px", rule: V.rule })],
  // 2 · Marque centrée, navigation à gauche, actions à droite (grille 1fr / auto / 1fr)
  centre: (k, P, V) => [R(k, [grid("1fr auto 1fr", [g([N(k, V)], { justifyContent: "flex-start" }), M(k, V), A(k, P, V)], { width: "100%", gap: "24px" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { pv: V.pv || "20px", rule: V.rule })],
  // 3 · Typographie monumentale : le nom du site en très grand, navigation en dessous
  monument: (k, P, V) => [
    R(k, [M(k, V, { size: V.ms || "clamp(44px, 9vw, 120px)", lh: 0.9, st: { width: "100%", textAlign: V.al || "left" } })], { pv: "24px", st: { paddingBottom: "4px" }, j: "flex-start" }),
    R(k, [N(k, V), A(k, P, V)], { pv: "14px", rule: V.rule || { w: "2px", c: k.S.fg }, top: V.top || { w: "2px", c: k.S.fg } }),
  ],
  // 4 · Deux niveaux : barre d'information puis rangée principale
  twolevel: (k, P, V) => [bar(k, P, V, { bg: V.barBg, fg: V.barFg }), R(k, [M(k, V), N(k, V), A(k, P, V)], { pv: V.pv || "18px", rule: V.rule })],
  // 5 · Pilule flottante : barre arrondie, ombre, détachée du bord (se pose sur le visuel)
  pill: (k, P, V) => [band(k.S, [inner([M(k, V), N(k, V), A(k, P, V)], { backgroundColor: V.pillBg || k.S.alt, borderRadius: V.pillR || "999px", boxShadow: "lg", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "28px", paddingRight: "12px", maxWidth: V.pillW || "1100px", borderStyle: "solid", borderWidth: V.pillB || "1px", borderColor: k.S.line })], { backgroundColor: "transparent", paddingTop: "16px", paddingBottom: "8px" })],
  // 6 · Bloc de marque coloré à gauche (30 %), contenu à droite : composition asymétrique
  sidebrand: (k, P, V) => [band(k.S, [grid(V.cols || "30% 1fr", [
    g([M(k, V, { color: k.S.onAccent }), V.tagline ? note(k, P.tagline, { color: k.S.onAccent, size: "12px" }) : sp("4")], { backgroundColor: k.S.accent, flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: "4px", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "32px", paddingRight: "24px" }),
    g([N(k, V), A(k, P, V)], { justifyContent: "space-between", paddingLeft: "32px", paddingRight: "32px", paddingTop: "18px", paddingBottom: "18px" }),
  ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { paddingLeft: "0px", paddingRight: "0px", ...rule(k.S, V.rule) }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" })],
  // 7 · Cellules brutalistes : quatre cases séparées par de gros filets
  cells: (k, P, V) => { const S = k.S, bd = { borderStyle: "solid", borderWidth: "0px", borderRightWidth: V.cw || "3px", borderColor: S.fg, paddingTop: "18px", paddingBottom: "18px", paddingLeft: "22px", paddingRight: "22px" };
    return [band(S, [grid(V.cols || "auto 1fr auto auto", [
      g([M(k, V, { color: S.onAccent })], { ...bd, backgroundColor: S.accent }), g([N(k, V)], { ...bd }), g([V.cellNote ? note(k, P.tagline, { size: "12px", caps: "uppercase", track: "1px", color: S.fg }) : date(k, { color: S.fg })], bd), g([A(k, P, V)], { ...bd, borderRightWidth: "0px", backgroundColor: V.cellBg || "transparent", justifyContent: "center" }),
    ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr 1fr" }, { gridTemplate: "1fr" })], { paddingLeft: "0px", paddingRight: "0px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: V.cw || "3px", borderColor: S.fg }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" })]; },
  // 8 · Index : minuscule et typographique, navigation à droite précédée d'un libellé
  index: (k, P, V) => [R(k, [M(k, V, { size: V.ms || "17px" }), g([note(k, V.idx || "Index —", { size: "12px", color: k.S.mute, caps: "uppercase", track: "1.4px" }), N(k, V, { size: V.ns || "13px" })], { gap: "18px", flexWrap: "nowrap" }), A(k, P, V)], { pv: V.pv || "14px", rule: V.rule })],
  // 9 · Boutique à trois étages : bandeau promo, rangée marque/recherche/compte/panier, bandeau de catégories
  shop3: (k, P, V) => [bar(k, P, V, { bg: V.barBg, fg: V.barFg }), R(k, [M(k, V), search(k, { grow: true, max: "620px", ...(V.sOpt || {}) }), A(k, P, { ...V, act: V.act || "ac" })], { pv: "16px", inn: { gap: "28px" } }), R(k, [N(k, V, { st: { width: "100%" } })], { pv: "0px", rule: V.rule || { w: "1px" }, top: V.top || { w: "1px" }, j: "flex-start", bg: V.row2Bg })],
  // 10 · Boutique centrée : recherche à gauche, marque au centre, compte et panier à droite ; catégories dessous
  shopc: (k, P, V) => [R(k, [grid("1fr auto 1fr", [g([search(k, { w: "100%", max: "460px", ...(V.sOpt || {}) })], { justifyContent: "flex-start" }), M(k, V), A(k, P, { ...V, act: V.act || "ac" })], { width: "100%", gap: "24px" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { pv: "22px" }), R(k, [N(k, V, { st: { margin: "0 auto" } })], { pv: "2px", rule: V.rule || { w: "1px" }, j: "center" })],
  // 11 · Boutique compacte : une rangée dense (marque, navigation, recherche, compte, panier) + ruban promo
  shopm: (k, P, V) => [R(k, [M(k, V), N(k, V, { st: { flexGrow: 1 } }), A(k, P, { ...V, act: V.act || "sac" })], { pv: "14px", rule: V.rule }), R(k, [note(k, P.notice, { color: V.ribFg || readable(V.ribBg || k.S.accent), size: "13px", caps: V.bc, track: V.bt })], { bg: V.ribBg || k.S.accent, pv: "7px", j: "center" })],
  // 12 · Méga-barre : fine barre sombre, rangée principale, navigation en blocs pleine largeur
  mega: (k, P, V) => [bar(k, P, V, { bg: V.barBg || k.S.fg, fg: V.barFg || k.S.bg }), R(k, [M(k, V), A(k, P, V)], { pv: "16px" }), R(k, [N(k, { ...V, nav: "block" }, { st: { width: "100%" }, hover: V.nh })], { pv: "0px", bg: V.row2Bg || k.S.alt, rule: V.rule || { w: "1px" }, j: "flex-start" })],
  // 13 · Navigation verticale : grande marque à gauche, liens empilés à droite, filet épais
  vertical: (k, P, V) => [R(k, [stack([M(k, V, { size: V.ms || "38px" }), V.tagline ? note(k, P.tagline, { size: "13px" }) : sp("2")], { gap: "6px" }), g([N(k, V, { vertical: true, size: V.ns || "18px", st: { textAlign: "right" } }), A(k, P, { ...V, act: V.act || "b" })], { alignItems: "flex-start", gap: "36px" })], { pv: "26px", rule: V.rule || { w: "3px", c: k.S.fg }, inn: { alignItems: "flex-start" } })],
  // 14 · Cadre : tout l'en-tête dans un cadre épais, avec marge de page
  frame: (k, P, V) => [band(k.S, [inner([M(k, V), N(k, V), A(k, P, V)], { borderStyle: "solid", borderWidth: V.fw || "3px", borderColor: V.fc || k.S.fg, paddingTop: "14px", paddingBottom: "14px", paddingLeft: "26px", paddingRight: "18px", borderRightWidth: V.fsh || undefined, borderBottomWidth: V.fsh || undefined, backgroundColor: V.fbg || "transparent" })], { paddingTop: "18px", paddingBottom: "18px" })],
  // 15 · Mât de magazine : date, accroche, réseaux ; titre monumental centré ; filets doubles ; navigation centrée
  masthead: (k, P, V) => [
    R(k, [date(k, {}), note(k, P.tagline, { size: "12px", caps: "uppercase", track: "2px", st: { textAlign: "center" } }), social(k, { n: 3, size: 24 })], { pv: "10px", rule: { w: "1px", c: k.S.fg } }),
    R(k, [M(k, V, { size: V.ms || "clamp(36px, 7vw, 84px)", lh: 1, st: { textAlign: "center", width: "100%" } })], { pv: "20px", j: "center" }),
    R(k, [N(k, V, { st: { margin: "0 auto" } }), ...(V.act ? [A(k, P, V)] : [])], { pv: "10px", rule: { w: "4px", c: k.S.fg }, top: { w: "1px", c: k.S.fg }, j: "center" }),
  ],
  // 16 · SaaS : pastille d'annonce en tête, marque, navigation, connexion et bouton
  saas: (k, P, V) => [R(k, [g([tag(k, P.tag || "Nouveau", { bg: V.tagBg }), note(k, P.notice, { color: V.annFg || k.S.onAccent, size: "13px" })], { gap: "10px", justifyContent: "center", width: "100%" })], { bg: V.annBg || k.S.accent, fg: V.annFg || k.S.onAccent, pv: "8px", j: "center" }), R(k, [M(k, V), N(k, V), A(k, P, { ...V, act: V.act || "ab" })], { pv: "14px", rule: V.rule })],
  // 17 · Deux tons : demi-fond coloré pour la marque, reste clair
  twotone: (k, P, V) => [band(k.S, [grid(V.cols || "auto 1fr", [g([M(k, V, { color: k.S.onAccent })], { backgroundColor: k.S.accent, paddingTop: "22px", paddingBottom: "22px", paddingLeft: "40px", paddingRight: "56px" }), g([N(k, V), A(k, P, V)], { justifyContent: "space-between", paddingLeft: "40px", paddingRight: "40px" })], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { paddingLeft: "0px", paddingRight: "0px", ...rule(k.S, V.rule) }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" })],
  // 18 · Médaillon : marque dans un disque coloré, navigation à droite
  badge: (k, P, V) => [R(k, [g([g([M(k, V, { color: k.S.onAccent, size: V.ms || "20px", st: { textAlign: "center" } })], { backgroundColor: k.S.accent, borderRadius: "999px", width: V.disc || "78px", height: V.disc || "78px", justifyContent: "center", paddingLeft: "10px", paddingRight: "10px", flexWrap: "nowrap" }), V.tagline ? note(k, P.tagline, { size: "13px" }) : sp("2")], { gap: "14px", flexWrap: "nowrap" }), N(k, V), A(k, P, V)], { pv: "14px", rule: V.rule })],
  // 19 · Recherche d'abord : grande recherche centrale, puces de navigation dessous
  searchfirst: (k, P, V) => [R(k, [M(k, V), search(k, { grow: true, max: "640px", ...(V.sOpt || {}) }), A(k, P, { ...V, act: V.act || "ab" })], { pv: "18px", inn: { gap: "32px" } }), R(k, [N(k, { ...V, nav: V.nav || "pill" }, { st: { margin: "0 auto" } })], { pv: "8px", bg: V.row2Bg || k.S.alt, j: "center" })],
  // 20 · Dalle : marque puis navigation étirée sur toute la largeur, liseré épais
  slab: (k, P, V) => [R(k, [M(k, V), N(k, { ...V, nav: V.nav || "tab" }, { st: { flexGrow: 1, justifyContent: "space-evenly" } }), A(k, P, V)], { pv: "0px", rule: V.rule || { w: "6px", c: k.S.accent }, inn: { alignItems: "stretch", gap: "28px" } })],
  // 21 · Contact d'abord : coordonnées et bouton de rendez-vous en haut, marque et navigation dessous
  contactfirst: (k, P, V) => [R(k, [contact(k, { color: V.barFg, icon: V.barIcon }), g([social(k, { n: 2, size: 22 }), btn(k, P.cta[0], P.cta[1], "pill", { padV: "7px", size: "13px" })], { gap: "12px" })], { bg: V.barBg || k.S.alt, pv: "8px" }), R(k, [M(k, V), N(k, V, { st: { margin: "0 auto" } }), A(k, P, { ...V, act: V.act || "a" })], { pv: "18px", rule: V.rule })],
  // 22 · Réservation : navigation de chaque côté de la marque, ornements, horaires et bouton
  booking: (k, P, V) => [R(k, [note(k, P.notice, { size: "12px", caps: "uppercase", track: "2px", st: { textAlign: "center", width: "100%" } })], { pv: "8px", j: "center", rule: { w: "1px" } }), R(k, [grid("1fr auto 1fr", [g([N(k, V)], { justifyContent: "flex-start" }), g([line(k, { st: { width: "40px" } }), M(k, V), line(k, { st: { width: "40px" } })], { flexWrap: "nowrap", gap: "14px" }), A(k, P, { ...V, act: V.act || "b" })], { width: "100%", gap: "24px" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { pv: "22px" })],
  // 23 · Portfolio sobre : une seule ligne très fine, marque minuscule, navigation en monospace
  mono: (k, P, V) => [R(k, [M(k, V, { size: V.ms || "15px" }), N(k, { ...V, nav: "mono" }, { size: "13px" }), ...(V.act ? [A(k, P, V)] : [])], { pv: "12px", rule: V.rule || { w: "1px", c: k.S.fg } })],
  // 24 · Sport : fond en diagonale, majuscules lourdes, gros bouton, liseré d'accent épais
  sport: (k, P, V) => [R(k, [M(k, V, { color: V.mcol }), N(k, { ...V, nc: "uppercase" }), A(k, P, V)], { pv: "16px", st: { backgroundImage: undefined }, rule: V.rule || { w: "8px", c: k.S.accent } })],
  // 25 · Luxe : marque centrée très espacée, navigation fine répartie de chaque côté, filets doubles
  luxe: (k, P, V) => [R(k, [note(k, P.notice, { size: "11.5px", caps: "uppercase", track: "3px", st: { textAlign: "center", width: "100%" } })], { pv: "9px", j: "center", rule: { w: "1px" } }), R(k, [grid("1fr auto 1fr", [g([N(k, { ...V, nav: V.nav || "thin" })], { justifyContent: "flex-start" }), M(k, V), g([...(V.act ? [A(k, P, V)] : [])], { justifyContent: "flex-end" })], { width: "100%", gap: "32px" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { pv: V.pv || "30px", rule: { w: "6px", c: k.S.line } })],
  // 26 · Architecture : colonnes séparées par des filets fins, cellule de coordonnées
  coords: (k, P, V) => { const S = k.S, cell = { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.fg, paddingLeft: "22px", paddingRight: "22px" };
    return [R(k, [grid(V.cols || "1fr 2fr 1fr auto", [g([M(k, V)], { borderLeftWidth: "0px", paddingLeft: "0px" }), g([N(k, V)], cell), g([note(k, P.tagline, { size: "11.5px", caps: "uppercase", track: "1.5px" })], cell), g([A(k, P, V)], cell)], { width: "100%", gap: "0px" }, { gridTemplate: "1fr 1fr" }, { gridTemplate: "1fr" })], { pv: "20px", rule: { w: "1px", c: S.fg }, top: { w: "1px", c: S.fg } })]; },
  // 27 · Superposé : sur un visuel d'ouverture, marque, navigation en verre dépoli, bouton
  glass: (k, P, V) => [band(k.S, [inner([M(k, V, { color: V.mcol || "#ffffff" }), g([N(k, V, { color: V.ncol || "#ffffff" })], { backgroundColor: "#ffffff1f", backdropBlur: 14, borderRadius: "999px", paddingLeft: "22px", paddingRight: "22px", paddingTop: "6px", paddingBottom: "6px", borderStyle: "solid", borderWidth: "1px", borderColor: "#ffffff40" }), A(k, P, V, { color: "#ffffff" })], { paddingTop: "20px" })], { backgroundColor: "transparent", color: "#ffffff" })],
  // 28 · Pile centrée : marque au-dessus, navigation centrée dessous avec ornements
  stackc: (k, P, V) => [R(k, [stack([M(k, V, { st: { textAlign: "center" } }), g([line(k, { st: { width: "36px" } }), N(k, V), line(k, { st: { width: "36px" } })], { justifyContent: "center", gap: "20px", flexWrap: "nowrap" }, { flexWrap: "wrap" })], { alignItems: "center", gap: "14px", width: "100%" }), ...(V.act ? [A(k, P, V)] : [])], { pv: "22px", rule: V.rule, j: "center" })],
  // 29 · Accroche : marque, filet vertical, accroche, navigation, réseaux et bouton
  tagline: (k, P, V) => [R(k, [g([M(k, V), line(k, { st: { width: "1px", height: "34px", borderLeftWidth: "1px" } }), note(k, P.tagline, { size: "12.5px", st: { maxWidth: "190px" } })], { gap: "16px", flexWrap: "nowrap" }), N(k, V), A(k, P, V)], { pv: "14px", rule: V.rule })],
  // 30 · Double action : navigation centrée, deux boutons (contour et plein) et pastille
  dual: (k, P, V) => [R(k, [M(k, V), N(k, V, { st: { margin: "0 auto" } }), A(k, P, { ...V, act: V.act || "tob" })], { pv: "16px", rule: V.rule })],
  // 31 · Dock : barre étroite, centrée, détachée du bord, navigation en pilules
  dock: (k, P, V) => [band(k.S, [inner([M(k, V, { size: V.ms || "18px" }), N(k, { ...V, nav: "pill" }), ...(V.act ? [A(k, P, V)] : [])], { maxWidth: V.dockW || "760px", backgroundColor: k.S.alt, borderRadius: "999px", boxShadow: "lg", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "24px", paddingRight: "10px", borderStyle: "solid", borderWidth: "1px", borderColor: k.S.line, justifyContent: "space-between" })], { backgroundColor: "transparent", paddingTop: "14px", paddingBottom: "6px" })],
  // 32 · Ticker : trois messages séparés en haut, marque centrée, navigation de part et d'autre
  ticker: (k, P, V) => [R(k, [note(k, P.notice, { size: "12px", color: readable(k.S.accent) }), note(k, P.right || "Un second message à personnaliser", { size: "12px", color: readable(k.S.accent) }), note(k, P.third || "Un troisième message", { size: "12px", color: readable(k.S.accent) })], { bg: k.S.accent, fg: readable(k.S.accent), pv: "7px", j: "space-around" }), R(k, [g([N(k, V)], { flexGrow: 1, justifyContent: "flex-start" }), M(k, V), g([A(k, P, V)], { flexGrow: 1, justifyContent: "flex-end" })], { pv: "20px", rule: V.rule })],
  // 33 · Gros bouton : marque, navigation, grand bouton d'action arrondi
  bigcta: (k, P, V) => [R(k, [M(k, V), N(k, V, { st: { marginLeft: "auto" } }), btn(k, P.cta[0], P.cta[1], "pill", { padV: "16px", padH: "30px", size: "15px", ...(V.bo || {}) })], { pv: "14px", rule: V.rule })],
  // 34 · Navigation encadrée : liens dans des cases contour, recherche et compte à droite
  boxnav: (k, P, V) => [R(k, [M(k, V), N(k, { ...V, nav: "box" }), A(k, P, V)], { pv: "16px", rule: V.rule || { w: "2px", c: k.S.fg } })],
  // 35 · Grille de navigation : marque à gauche sur deux niveaux ; à droite, liens utiles en haut et navigation en cases dessous
  navgrid: (k, P, V) => [band(k.S, [grid(V.cols || "auto 1fr", [g([M(k, V)], { paddingRight: "36px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderColor: k.S.fg, alignSelf: "stretch" }), stack([g([A(k, P, V)], { justifyContent: "flex-end", paddingTop: "10px", paddingBottom: "8px" }), g([N(k, { ...V, nav: "tab" }, { st: { width: "100%" } })], { justifyContent: "flex-start", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: k.S.line })], { gap: "0px", paddingLeft: "32px" })], { width: "100%", maxWidth: "1240px", marginLeft: "auto", marginRight: "auto", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { ...rule(k.S, V.rule || { w: "1px", c: k.S.fg }) })],
  // 36 · Barre ultra fine : une rangée basse sur fond sombre, marque et navigation en monospace, panier
  slim: (k, P, V) => [R(k, [M(k, V, { size: V.ms || "16px" }), N(k, V, { size: "12.5px", st: { margin: "0 auto" } }), A(k, P, V)], { pv: "9px", st: {} })],
};
module.exports = { ARCH };
