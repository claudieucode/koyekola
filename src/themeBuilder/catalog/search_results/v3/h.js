// Aides de la bibliothèque « Résultats de recherche » v3 : 100 conceptions, chacune avec SA PROPRE identité graphique en valeurs FIXES (couleurs, polices de la bibliothèque locale, rayons, boutons),
// variables --kw-* / --lp-* redéfinies sur la racine du modèle (voir catalog.js) : jamais la charte du site ni celle de l'administration.
// Tout est réel : résultats = boucles du moteur filtrées par ?q= (articles, produits, formations, pages DU SITE), tri = ?tri=, catégories = ?categorie=, pagination = numéros ; aucun contrôle décoratif.
const P = require("../../single_page/v2/h");
const { stackOf } = require("../../../../utils/fontLibrary");
const { W, own, px, NARROW, ID2, scopeCss, p } = P;
const EMPTY_Q = "Aucun résultat pour « {{query.q}} ». Vérifiez l'orthographe, essayez des mots plus courts ou plus généraux, ou parcourez les catégories.";
const link = (k, token, level, size, st = {}) => ({ ...k.H(`{{${token}.title}}`, level, { fontSize: size, fontFamily: k.S.head, lineHeight: 1.2, ...st }), props: { text: `{{${token}.title}}`, level, link: `{{${token}.url}}` } });
const mute = (k, html, st = {}) => k.T(html, { color: k.S.mute, fontSize: "15px", lineHeight: 1.5, ...st });
const tag = (k, token, st = {}) => k.T(`<p>{{${token}}}</p>`, { color: k.S.accent, fontSize: "13px", fontWeight: "700", ...st });
const pad = (k) => ({ paddingTop: k.S.pad, paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad });
const body = (k, kids, st = {}) => k.col(kids, { gap: "8px", flexGrow: 1, paddingTop: "6px", paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad, ...st });
const foot = (k, label, url) => k.B(label, url, "outline", { alignSelf: "flex-start", marginTop: "auto" });

// ── Cartes de résultat : un modèle de carte, répété pour chaque résultat réel ───────────────────────
// styles : carte (visuel au-dessus), ligne (visuel à gauche), texte (sans visuel), index (une ligne), grand (premier résultat), tableau (colonnes alignées), photo (visuel dominant)
const CARDS = {
  posts: (k, s, o = {}) => {
    const meta = mute(k, "<p>{{post.author}} · {{post.date}}</p>", { fontSize: "13px" }), exc = mute(k, "<p>{{post.excerpt}}</p>"), t = (z) => link(k, "post", "3", z);
    if (s === "ligne") return [k.row([k.img("post.image", { width: o.w || "200px", height: o.h || "140px", borderRadius: k.S.radius, flexShrink: 0 }), k.col([tag(k, "post.category"), t(o.size || "21px"), ...(o.excerpt === false ? [] : [exc]), meta], { flexBasis: "0px", flexGrow: 1, minWidth: "220px", gap: "8px" })], { alignItems: "flex-start", gap: k.S.gap, ...pad(k) })];
    if (s === "texte") return [body(k, [...(o.cat === false ? [] : [tag(k, "post.category")]), t(o.size || "21px"), ...(o.excerpt === false ? [] : [exc]), meta], { paddingTop: k.S.pad })];
    if (s === "index") return [k.row([mute(k, "<p>{{post.date}}</p>", { fontSize: "14px", flexBasis: "130px", flexShrink: 0 }), link(k, "post", "3", "18px", { flexBasis: "0px", flexGrow: 1, minWidth: "200px" }), mute(k, "<p>{{post.category}}</p>", { fontSize: "13px" })], { gap: "16px", ...pad(k) })];
    if (s === "grand") return [k.img("post.image", { height: o.h || "340px", borderRadius: "0px" }), body(k, [tag(k, "post.category"), t("32px"), mute(k, "<p>{{post.excerpt}}</p>", { fontSize: "17px" }), meta], { paddingTop: k.S.pad })];
    if (s === "tableau") return [k.grid(3, [link(k, "post", "3", "17px"), mute(k, "<p>{{post.category}}</p>", { fontSize: "14px" }), mute(k, "<p>{{post.date}}</p>", { fontSize: "14px" })], { gridTemplate: "3fr 1fr 1fr", alignItems: "center", ...pad(k) })];
    if (s === "photo") return [k.img("post.image", { height: o.h || "300px", borderRadius: "0px" }), body(k, [t(o.size || "20px"), meta])];
    return [k.img("post.image", { height: o.h || "180px", borderRadius: "0px" }), body(k, [tag(k, "post.category"), t(o.size || "21px"), ...(o.excerpt === false ? [] : [exc]), meta])];
  },
  products: (k, s, o = {}) => {
    const price = k.T("<p>{{product.price}}</p>", { color: k.S.accent, fontWeight: "700", fontSize: "18px" }), desc = mute(k, "<p>{{product.short_description}}</p>"), t = (z) => link(k, "product", "3", z), go = foot(k, "Voir le produit", "{{product.url}}");
    if (s === "ligne") return [k.row([k.img("product.image", { width: o.w || "170px", height: o.h || "130px", borderRadius: k.S.radius, flexShrink: 0 }), k.col([t(o.size || "19px"), desc, price, go], { flexBasis: "0px", flexGrow: 1, minWidth: "220px", gap: "8px" })], { alignItems: "flex-start", gap: k.S.gap, ...pad(k) })];
    if (s === "texte") return [body(k, [t(o.size || "19px"), desc, price, go], { paddingTop: k.S.pad })];
    if (s === "index") return [k.row([link(k, "product", "3", "18px", { flexBasis: "0px", flexGrow: 1, minWidth: "200px" }), price], { gap: "16px", justifyContent: "space-between", ...pad(k) })];
    if (s === "grand") return [k.img("product.image", { height: o.h || "340px", borderRadius: "0px" }), body(k, [t("30px"), desc, price, go], { paddingTop: k.S.pad })];
    if (s === "tableau") return [k.grid(3, [link(k, "product", "3", "17px"), price, k.B("Voir", "{{product.url}}", "outline", { justifySelf: "start" })], { gridTemplate: "3fr 1fr 1fr", alignItems: "center", ...pad(k) })];
    if (s === "photo") return [k.img("product.image", { height: o.h || "300px", borderRadius: "0px" }), body(k, [t(o.size || "19px"), price])];
    return [k.img("product.image", { height: o.h || "190px", borderRadius: "0px" }), body(k, [t(o.size || "19px"), price, go])];
  },
  courses: (k, s, o = {}) => {
    const price = k.T("<p>{{course.price}}</p>", { color: k.S.accent, fontWeight: "700" }), priceBy = k.T("<p>{{course.price}} · {{course.instructor}}</p>", { color: k.S.accent, fontWeight: "700", fontSize: "15px" }), by = mute(k, "<p>{{course.instructor}}</p>", { fontSize: "13px" }), sub = mute(k, "<p>{{course.subtitle}}</p>"), t = (z) => link(k, "course", "3", z), go = foot(k, "Voir la formation", "{{course.url}}");
    if (s === "ligne") return [k.row([k.img("course.image", { width: o.w || "190px", height: o.h || "125px", borderRadius: k.S.radius, flexShrink: 0 }), k.col([tag(k, "course.category"), t(o.size || "20px"), sub, priceBy], { flexBasis: "0px", flexGrow: 1, minWidth: "220px", gap: "8px" })], { alignItems: "flex-start", gap: k.S.gap, ...pad(k) })];
    if (s === "texte") return [body(k, [tag(k, "course.category"), t(o.size || "20px"), sub, price, by], { paddingTop: k.S.pad })];
    if (s === "index") return [k.row([link(k, "course", "3", "18px", { flexBasis: "0px", flexGrow: 1, minWidth: "200px" }), by, price], { gap: "16px", ...pad(k) })];
    if (s === "grand") return [k.img("course.image", { height: o.h || "320px", borderRadius: "0px" }), body(k, [tag(k, "course.category"), t("30px"), sub, priceBy, go], { paddingTop: k.S.pad })];
    if (s === "tableau") return [k.grid(3, [link(k, "course", "3", "17px"), by, price], { gridTemplate: "3fr 1fr 1fr", alignItems: "center", ...pad(k) })];
    if (s === "photo") return [k.img("course.image", { height: o.h || "280px", borderRadius: "0px" }), body(k, [t(o.size || "20px"), price])];
    return [k.img("course.image", { height: o.h || "170px", borderRadius: "0px" }), body(k, [tag(k, "course.category"), t(o.size || "20px"), sub, priceBy, go])];
  },
  pages: (k, s, o = {}) => {
    const t = (z) => link(k, "page_item", "3", z), go = k.LINK("Ouvrir la page", "{{page_item.url}}", { alignSelf: "flex-start", marginTop: "auto" });
    if (s === "index" || s === "tableau") return [k.row([t(s === "index" ? "18px" : "17px"), go], { gap: "16px", justifyContent: "space-between", alignItems: "center", ...pad(k) })];
    if (s === "ligne") return [k.row([k.col([t(o.size || "20px"), mute(k, "<p>Page du site</p>", { fontSize: "13px" })], { flexGrow: 1, gap: "6px" }), go], { alignItems: "center", gap: k.S.gap, ...pad(k) })];
    return [body(k, [mute(k, "<p>Page du site</p>", { fontSize: "13px", color: k.S.accent, fontWeight: "700" }), t(s === "grand" ? "30px" : o.size || "20px"), go], { paddingTop: k.S.pad })];
  },
};
// Boucle de résultats : filtrée par l'adresse (terme, catégorie, tri), paginée par numéros, avec son propre état « aucun résultat »
const mergeSt = (a = {}, b = {}) => ({ ...a, ...b, desktop: { ...(a.desktop || {}), ...(b.desktop || {}) }, ...(a.tablet || b.tablet ? { tablet: { ...(a.tablet || {}), ...(b.tablet || {}) } } : {}), ...(a.mobile || b.mobile ? { mobile: { ...(a.mobile || {}), ...(b.mobile || {}) } } : {}) });
const results = (k, kind, cols, style, o = {}) => {
  const flat = style === "index" || style === "tableau" ? { backgroundColor: "transparent", borderRadius: "0px", boxShadow: "none", borderWidth: "0px", borderBottomWidth: "1px", borderStyle: "solid", borderColor: k.S.line } : {};
  const L = k.loop(cols, CARDS[kind](k, style, o), { source: kind, urlFilter: true, count: o.count || (cols === 1 ? 8 : cols * 3), paginate: o.paginate !== false, pagination: o.paginate === false ? "none" : "numbers", empty: o.empty || EMPTY_Q, ...(o.offset ? { offset: o.offset } : {}) }, { alignItems: "stretch", ...(o.grid || {}) }, { ...flat, ...(o.cardSt || {}) });
  // La carte est la ligne / la grille elle-même quand elle n'en contient qu'une (un niveau d'imbrication de moins : la profondeur des pages est limitée à 8)
  const card = L.children[0];
  if (card.children && card.children.length === 1 && ["group", "grid"].includes(card.children[0].type)) { const c = card.children[0]; L.children[0] = { ...c, styles: mergeSt(card.styles, c.type === "grid" ? { ...c.styles, desktop: { display: "grid", flexDirection: undefined, ...(c.styles.desktop || {}) } } : c.styles) }; if (c.type === "grid") { const d = L.children[0].styles.desktop; delete d.flexDirection; d.display = "grid"; } }
  return L;
};

// ── Éléments de page ────────────────────────────────────────────────────────────────────────────────
const info = (k, o = {}) => W(k, "archiveinfo", { tag: o.tag || "h1", showDescription: false, showCount: false, fallback: "Recherche" }, { fontFamily: k.S.head, fontSize: px(o.size || 36), lineHeight: 1.1, ...(o.st || {}) }, { fontSize: px(Math.round((o.size || 36) * 0.85)) }, { fontSize: px(Math.min(30, Math.round((o.size || 36) * 0.72))) });
const box = (k, o = {}) => W(k, "search", { target: "blog", placeholder: o.placeholder || "Rechercher…", button: o.button || "Rechercher" }, { width: "100%", maxWidth: o.max || "640px", flexWrap: "nowrap", flexShrink: 0, ...(o.st || {}) }, undefined, { maxWidth: "100%" });
const count = (k, source = "posts", st = {}) => W(k, "searchcount", { source, withTerm: true }, st);
const sort = (k, o = {}) => W(k, "searchsort", { label: o.label === undefined ? "Trier par" : o.label, recent: true, ancien: o.ancien !== false, alpha: true, alphaInverse: false, prix: Boolean(o.prix), layout: o.layout || "pills" }, o.st || {});
const cats = (k, source = "posts", st = {}) => W(k, "catfilter", { source, allLabel: "Toutes les catégories", showCount: true }, st);
const popular = (k, title, o = {}) => W(k, "querylist", { title, source: "posts", mode: o.mode || "popular", count: o.count || 5, layout: o.layout || "compact", showCount: false, showExcerpt: o.excerpt === true, showImage: o.image === true, empty: "Rien à afficher pour le moment." }, { width: "100%", ...(o.st || {}) });
const heading = (k, txt, st = {}) => k.H(txt, "2", { fontSize: "24px", fontFamily: k.S.head, ...st });
const card = (k, kids, st = {}) => k.card(kids, { alignSelf: "stretch", ...st });
const refine = (k, o = {}) => card(k, [k.H(o.title || "Affiner la recherche", "3", { fontSize: "20px", fontFamily: k.S.head }), mute(k, `<p>${o.text || "Aucun résultat qui convienne ? Reformulez votre recherche ou parcourez le site."}</p>`), box(k, { max: "100%", placeholder: o.placeholder }), ...(o.cats === false ? [] : [cats(k)])], o.st || {});
// Zone de contenu centrée : UN seul niveau de conteneur (la profondeur des pages est limitée à 8 niveaux)
const wrap = (k, kids, st = {}) => k.col(kids, { gap: k.S.gap, paddingTop: "40px", paddingBottom: "56px", paddingLeft: "24px", paddingRight: "24px", maxWidth: "1180px", width: "100%", marginLeft: "auto", marginRight: "auto", fontFamily: k.S.font, color: k.S.fg, ...st });
const side = (k, kids, st = {}) => k.col(kids, { flexBasis: "280px", flexGrow: 0, flexShrink: 0, gap: k.S.gap, ...st }, { flexBasis: "100%", flexGrow: 1 }, { flexBasis: "100%", flexGrow: 1 });
const main = (k, kids, st = {}) => k.col(kids, { flexBasis: "0px", flexGrow: 1, minWidth: "300px", gap: k.S.gap, ...st });
const split = (k, a, b, st = {}) => k.row([a, b], { alignItems: "flex-start", gap: k.S.gap, flexWrap: "wrap", ...st });
const bandOf = (k, kids, st = {}) => k.band([k.col(kids, { gap: "16px", maxWidth: "1180px", width: "100%", marginLeft: "auto", marginRight: "auto" })], { fontFamily: k.S.font, ...st });
module.exports = { ...P, P, EMPTY_Q, link, mute, tag, pad, body, foot, CARDS, results, info, box, count, sort, cats, popular, heading, card, refine, wrap, side, main, split, bandOf };
