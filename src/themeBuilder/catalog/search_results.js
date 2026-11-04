// Catalogue « Résultats de recherche » — 100 modèles = 10 CONTENUS (ce qu'on cherche : articles, magazine, entreprise, portfolio, boutique, formations, pages du site, aide, tout le site, actualités)
// × 10 COMPOSITIONS de page STRUCTURELLEMENT différentes (liste, grille, colonne à droite, panneau à gauche, bandeau, premier résultat en grand, index, éditorial centré, barre de filtres, résultats puis pistes).
// Chaque modèle porte sa composition ET son identité visuelle (skin) : aucun ne diffère d'un autre par la seule couleur. Tout est natif et réel :
//  · titre « Résultats pour « … » » et nombre de résultats (widget archiveinfo, articles) ; champ de recherche pré-rempli avec le terme (widget search) ;
//  · boucles réelles filtrées par la requête de l'adresse (?q=, urlFilter) sur les articles, produits, formations ou pages DU SITE (isolation par site dans le moteur de requête) ;
//  · pagination (numéros), état « aucun résultat » propre à chaque boucle + bloc « affiner la recherche » (nouveau champ, catégories, lectures conseillées) ;
//  · aucun contrôle décoratif : pas de tri ni de filtres combinés (le moteur ne les propose pas : voir docs/theme-builder/kolakisa-search-results-library.md).
const EMPTY_Q = "Aucun résultat pour « {{query.q}} ». Vérifiez l'orthographe, essayez des mots plus courts ou un terme plus général.";

// ── Éléments de base ────────────────────────────────────────────────────────────────────────────────
const info = (k, o = {}, st = {}) => k.W("archiveinfo", { tag: "h1", showDescription: false, showCount: o.count !== false, fallback: "Recherche" }, { color: k.S.fg, fontFamily: k.S.head, fontSize: "34px", ...st });
const box = (k, st = {}) => k.search("blog", { width: "100%", maxWidth: "640px", ...st });
const pad = (k) => ({ paddingTop: k.S.pad, paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad });
const wrap = (k, kids, st = {}) => k.section(kids, { paddingTop: "40px", maxWidth: "1180px", width: "100%", marginLeft: "auto", marginRight: "auto", ...st });
const side = (k, kids, st = {}) => k.col(kids, { flexBasis: "280px", flexGrow: 0, flexShrink: 0, gap: k.S.gap, ...st });
const cols2 = (k, a, b, st = {}) => k.row([a, b], { alignItems: "flex-start", gap: k.S.gap, flexWrap: "wrap", ...st });
const muted = (k, html, st = {}) => k.T(html, { color: k.S.mute, fontSize: "15px", ...st });
const link = (k, token, level, size, st = {}) => ({ ...k.H(`{{${token}.title}}`, level, { fontSize: size, ...st }), props: { text: `{{${token}.title}}`, level, link: `{{${token}.url}}` } });

// ── Fiches de résultat par type de contenu : un modèle de carte, répété pour chaque résultat réel ───────
// style : "carte" (image au-dessus), "ligne" (image à gauche), "texte" (sans image), "index" (une ligne), "grand" (premier résultat)
const KINDS = {
  posts: { source: "posts",
    item: (k, s, o) => {
      const cat = k.L("{{post.category}}", { color: k.S.accent }), by = muted(k, "<p>{{post.author}} · {{post.date}}</p>", { fontSize: "13px" });
      const exc = muted(k, "<p>{{post.excerpt}}</p>"), t = (sz) => link(k, "post", "3", sz);
      const body = (kids, st = {}) => k.col(kids, { gap: "8px", paddingTop: "4px", paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad, ...st });
      if (s === "ligne") return [k.row([k.img("post.image", { width: o.w || "220px", height: o.h || "150px", borderRadius: k.S.radius }), k.col([cat, t("21px"), ...(o.excerpt === false ? [] : [exc]), by], { flexBasis: "0px", flexGrow: 1, minWidth: "220px", gap: "8px" })], { alignItems: "flex-start", gap: k.S.gap, ...pad(k) })];
      if (s === "texte") return [body([...(o.cat === false ? [] : [cat]), t(o.size || "21px"), ...(o.excerpt === false ? [] : [exc]), by], { paddingTop: k.S.pad })];
      if (s === "index") return [k.row([muted(k, "<p>{{post.date}}</p>", { fontSize: "14px", flexBasis: "120px", flexShrink: 0 }), link(k, "post", "3", "18px", { flexBasis: "0px", flexGrow: 1, minWidth: "220px" }), muted(k, "<p>{{post.category}}</p>", { fontSize: "13px" })], { gap: "16px", ...pad(k) })];
      if (s === "grand") return [k.img("post.image", { height: "320px", borderRadius: "0px" }), body([cat, t("30px"), muted(k, "<p>{{post.excerpt}}</p>", { fontSize: "17px" }), by], { paddingTop: k.S.pad })];
      return [k.img("post.image", { height: o.h || "180px", borderRadius: "0px" }), body([cat, t(o.size || "21px"), ...(o.excerpt === false ? [] : [exc]), by])];
    } },
  products: { source: "products",
    item: (k, s, o) => {
      const price = k.T("<p>{{product.price}}</p>", { color: k.S.accent, fontWeight: "700", fontSize: "17px" });
      const t = link(k, "product", "3", o.size || "19px"), desc = muted(k, "<p>{{product.short_description}}</p>");
      const view = k.B("Voir le produit", "{{product.url}}", "outline");
      const body = (kids) => k.col(kids, { gap: "8px", paddingTop: "4px", paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad });
      if (s === "ligne") return [k.row([k.img("product.image", { width: "180px", height: "140px", borderRadius: k.S.radius }), k.col([t, desc, price, view], { flexBasis: "0px", flexGrow: 1, minWidth: "220px", gap: "8px" })], { alignItems: "flex-start", gap: k.S.gap, ...pad(k) })];
      if (s === "texte") return [body([t, desc, price])];
      if (s === "index") return [k.row([link(k, "product", "3", "18px", { flexBasis: "0px", flexGrow: 1, minWidth: "220px" }), price], { gap: "16px", justifyContent: "space-between", ...pad(k) })];
      if (s === "grand") return [k.img("product.image", { height: "320px", borderRadius: "0px" }), body([t, desc, price, view])];
      return [k.img("product.image", { height: o.h || "190px", borderRadius: "0px" }), body([t, price, view])];
    } },
  courses: { source: "courses",
    item: (k, s, o) => {
      const price = k.T("<p>{{course.price}}</p>", { color: k.S.accent, fontWeight: "700" }), by = muted(k, "<p>{{course.instructor}}</p>", { fontSize: "13px" });
      const t = link(k, "course", "3", o.size || "20px"), sub = muted(k, "<p>{{course.subtitle}}</p>");
      const body = (kids) => k.col(kids, { gap: "8px", paddingTop: "4px", paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad });
      if (s === "ligne") return [k.row([k.img("course.image", { width: "200px", height: "130px", borderRadius: k.S.radius }), k.col([k.L("{{course.category}}", { color: k.S.accent }), t, sub, k.row([price, by], { gap: "16px" })], { flexBasis: "0px", flexGrow: 1, minWidth: "220px", gap: "8px" })], { alignItems: "flex-start", gap: k.S.gap, ...pad(k) })];
      if (s === "texte") return [body([k.L("{{course.category}}", { color: k.S.accent }), t, sub, price])];
      if (s === "index") return [k.row([link(k, "course", "3", "18px", { flexBasis: "0px", flexGrow: 1, minWidth: "220px" }), by, price], { gap: "16px", ...pad(k) })];
      if (s === "grand") return [k.img("course.image", { height: "300px", borderRadius: "0px" }), body([k.L("{{course.category}}", { color: k.S.accent }), t, sub, price, by])];
      return [k.img("course.image", { height: o.h || "170px", borderRadius: "0px" }), body([t, sub, k.row([price, by], { gap: "12px" })])];
    } },
  pages: { source: "pages",
    item: (k, s, o) => {
      const t = link(k, "page_item", "3", s === "grand" ? "28px" : o.size || "20px"), tag = k.L("Page du site", { color: k.S.accent });
      const go = k.LINK("Ouvrir la page", "{{page_item.url}}");
      if (s === "index") return [k.row([t, go], { gap: "16px", justifyContent: "space-between", ...pad(k) })];
      return [k.col([tag, t, ...(s === "grand" ? [muted(k, "<p>Une page de ce site correspond à votre recherche.</p>", { fontSize: "17px" })] : []), go], { gap: "8px", ...pad(k) })];
    } },
};
const loop = (k, kind, cols, style, o = {}) => {
  const K = KINDS[kind];
  return k.loop(cols, K.item(k, style, o), { source: K.source, urlFilter: true, count: o.count || (cols === 1 ? 8 : cols * 3), paginate: o.paginate !== false, pagination: "numbers", empty: o.empty || EMPTY_Q, ...(o.offset ? { offset: o.offset } : {}) }, o.grid || {}, o.cardSt || {});
};
const heading = (k, txt, st = {}) => k.H(txt, "2", { fontSize: "24px", ...st });
const cats = (k) => k.W("catfilter", { source: "posts", allLabel: "Toutes", showCount: true }, { color: k.S.fg });
const list = (k, p) => k.W("querylist", { source: "posts", mode: "recent", count: 5, layout: "compact", showCount: false, empty: "Rien à afficher pour le moment.", ...p }, { color: k.S.fg, width: "100%" });
const refine = (k, o = {}) => k.card([k.H("Affiner la recherche", "3", { fontSize: "20px" }), muted(k, "<p>Aucun résultat qui convienne ? Reformulez votre recherche ou parcourez le site.</p>"), box(k, { maxWidth: "100%" }), ...(o.cats ? [cats(k)] : [])], { width: "100%" });

// ── Contenus : ce que la page de résultats montre ───────────────────────────────────────────────────
// kind : type de résultats principal ; more(k, c) → sections de résultats d'autres types ; aside(k) → colonne secondaire ; after(k) → pistes ; count : nombre d'articles dans le titre (le moteur ne compte que le blog).
const A = (key, label, tags, desc, o) => ({ key, label, tags, desc, kind: "posts", count: true, more: () => [], aside: null, after: null, opts: {}, ...o });
const CONTENTS = [
  A("blog", "Blog", ["blog", "articles"], "Articles du blog avec extrait, catégorie et auteur.", { aside: (k) => [k.card([k.L("Catégories"), cats(k)]), list(k, { title: "Les plus lus", mode: "popular" })], after: (k) => [refine(k, { cats: true }), list(k, { title: "À lire plutôt", layout: "cards", count: 3, showExcerpt: true })] }),
  A("magazine", "Magazine", ["magazine", "images", "éditorial"], "Articles très visuels de magazine, grandes images.", { opts: { h: "240px", size: "24px" }, aside: (k) => [list(k, { title: "À la une", mode: "popular", layout: "cards", showExcerpt: false }), k.card([k.L("Rubriques"), cats(k)])], after: (k) => [list(k, { title: "Peut-être cherchiez-vous", mode: "popular", layout: "cards", count: 3 }), refine(k)] }),
  A("entreprise", "Site d'entreprise", ["entreprise", "pages", "actualités"], "Pages du site puis actualités de l'entreprise.", { kind: "pages", count: false, more: (k, c) => [heading(k, "Actualités"), loop(k, "posts", c.cols, c.style === "grand" ? "texte" : c.style, { count: 4, paginate: false, empty: "Aucune actualité ne correspond à « {{query.q}} »." })], aside: (k) => [k.card([k.L("Nous contacter"), muted(k, "<p>Une question ? Écrivez-nous.</p>"), k.B("Contact", "/contact", "outline")])], after: (k) => [refine(k), list(k, { title: "Dernières actualités", count: 4 })] }),
  A("portfolio", "Portfolio", ["portfolio", "réalisations", "images"], "Réalisations présentées par leur image, sans extrait.", { opts: { excerpt: false, h: "220px", size: "20px" }, aside: (k) => [k.card([k.L("Catégories"), cats(k)])], after: (k) => [refine(k, { cats: true }), list(k, { title: "Autres réalisations", layout: "slider", count: 8, showImage: true })] }),
  A("boutique", "Boutique", ["boutique", "produits", "prix"], "Produits du catalogue avec prix et lien, puis articles.", { kind: "products", count: false, more: (k, c) => [heading(k, "Conseils et articles"), loop(k, "posts", c.cols, c.cols > 1 || c.style === "grand" ? "texte" : c.style, { count: 3, paginate: false, empty: "Aucun article ne correspond à « {{query.q}} »." })], aside: (k) => [k.card([k.L("Boutique"), k.B("Voir toute la boutique", "/boutique", "outline"), k.account()])], after: (k) => [refine(k), k.B("Parcourir la boutique", "/boutique")] }),
  A("formations", "Formations", ["formations", "catalogue", "prix"], "Formations du catalogue avec prix et formateur.", { kind: "courses", count: false, aside: (k) => [k.card([k.L("Catalogue"), k.B("Toutes les formations", "/catalogue", "outline")]), k.W("courselist", { count: 3, sort: "recent", showPrice: true, cta: "Découvrir", empty: "Les formations apparaîtront ici." }, { width: "100%" })], after: (k) => [refine(k), k.B("Voir tout le catalogue", "/catalogue")] }),
  A("pages", "Pages du site", ["pages", "site", "navigation"], "Pages publiées du site, titre et lien.", { kind: "pages", count: false, aside: (k) => [k.card([k.L("Navigation"), k.W("menu", { label: "Navigation", source: "manual", vertical: true, mobileToggle: false, items: [{ label: "Accueil", url: "/" }, { label: "Blog", url: "/blog" }, { label: "Contact", url: "/contact" }] }, { color: k.S.fg })])], after: (k) => [refine(k), k.B("Retour à l'accueil", "/", "outline")] }),
  A("aide", "Centre d'aide", ["aide", "support", "contact"], "Réponses du centre d'aide, avec contact si rien ne correspond.", { opts: { cat: false }, aside: (k) => [k.card([k.L("Besoin d'aide ?"), muted(k, "<p>Notre équipe vous répond rapidement.</p>"), k.B("Contacter le support", "/contact")]), list(k, { title: "Questions fréquentes", mode: "popular" })], after: (k) => [k.card([k.H("Toujours rien ?", "3", { fontSize: "20px" }), muted(k, "<p>Décrivez-nous ce que vous cherchez : nous vous répondrons.</p>"), k.B("Nous écrire", "/contact")], { width: "100%" }), refine(k)] }),
  A("tout", "Tout le site", ["tout le site", "articles", "pages", "produits"], "Articles, pages, produits et formations réunis en sections.", { count: false, more: (k, c) => [heading(k, "Pages du site"), loop(k, "pages", 1, "index", { count: 5, paginate: false, empty: "Aucune page ne correspond à « {{query.q}} »." }), heading(k, "Produits"), loop(k, "products", c.cols > 1 ? 2 : 1, c.cols > 1 ? "carte" : "texte", { count: 4, paginate: false, empty: "Aucun produit ne correspond à « {{query.q}} »." }), heading(k, "Formations"), loop(k, "courses", c.cols > 1 ? 2 : 1, c.cols > 1 ? "carte" : "texte", { count: 4, paginate: false, empty: "Aucune formation ne correspond à « {{query.q}} »." })], aside: (k) => [k.card([k.L("Catégories"), cats(k)])], after: (k) => [refine(k, { cats: true })] }),
  A("actualites", "Actualités", ["actualités", "dates", "association"], "Actualités datées, ton institutionnel ou associatif.", { opts: { cat: false }, aside: (k) => [list(k, { title: "Dernières actualités", count: 6 }), k.card([k.L("Rejoignez-nous"), k.B("Nous contacter", "/contact", "outline")])], after: (k) => [list(k, { title: "Dernières actualités", count: 4 }), refine(k)] }),
];

// ── Compositions : dix structures de page différentes ────────────────────────────────────────────────
const shape = (a, style, cols) => ({ cols, style });
const main = (k, a, cols, st, o = {}) => loop(k, a.kind, cols, st, { ...a.opts, ...o });
const COMPOSITIONS = [
  { key: "liste", label: "Liste", skinShift: 0, tag: "liste",
    build: (k, a) => [wrap(k, [info(k, a), box(k), main(k, a, 1, "ligne", { grid: { gap: "0px" } }), ...a.more(k, shape(a, "ligne", 1)), ...(a.after ? a.after(k) : [])])] },
  { key: "grille", label: "Grille de cartes", skinShift: 1, tag: "grille",
    build: (k, a) => [wrap(k, [info(k, a), box(k), main(k, a, 3, "carte"), ...a.more(k, shape(a, "carte", 3)), ...(a.after ? a.after(k).slice(0, 1) : [])])] },
  { key: "lateral-droite", label: "Colonne à droite", skinShift: 2, tag: "colonne latérale",
    build: (k, a) => [wrap(k, [info(k, a), box(k), cols2(k, k.col([main(k, a, 1, "texte", { grid: { gap: "0px" } }), ...a.more(k, shape(a, "texte", 1))], { flexBasis: "0px", flexGrow: 1, minWidth: "280px", gap: k.S.gap }), side(k, a.aside ? a.aside(k) : [refine(k)]))])] },
  { key: "panneau-gauche", label: "Panneau à gauche", skinShift: 3, tag: "panneau",
    build: (k, a) => [wrap(k, [cols2(k, side(k, [k.card([info(k, a, { fontSize: "26px" }), k.search("blog", { width: "100%" })]), ...(a.aside ? a.aside(k) : [])]), k.col([main(k, a, 2, "carte", { h: "150px", size: "18px" }), ...a.more(k, shape(a, "carte", 2))], { flexBasis: "0px", flexGrow: 1, minWidth: "300px", gap: k.S.gap }))])] },
  { key: "bandeau", label: "Bandeau de recherche", skinShift: 4, tag: "bandeau",
    build: (k, a) => [k.band([k.inner([k.col([info(k, a, { fontSize: "36px" }), box(k, { maxWidth: "680px" })], { gap: "16px", flexBasis: "0px", flexGrow: 1 })])], { paddingTop: "56px", paddingBottom: "56px", backgroundColor: k.S.alt }),
      wrap(k, [main(k, a, 2, "carte", { h: "160px" }), ...a.more(k, shape(a, "carte", 2)), ...(a.after ? a.after(k) : [])])] },
  { key: "vedette", label: "Premier résultat en grand", skinShift: 0, tag: "vedette",
    build: (k, a) => [wrap(k, [info(k, a), box(k), main(k, a, 1, "grand", { count: 1, paginate: false }), main(k, a, 2, "texte", { offset: 1, count: 8, size: "19px" }), ...a.more(k, shape(a, "texte", 1))])] },
  { key: "index", label: "Index compact", skinShift: 1, tag: "compact",
    build: (k, a) => [wrap(k, [k.row([info(k, a, { fontSize: "28px" }), box(k, { maxWidth: "380px" })], { justifyContent: "space-between" }), main(k, a, 1, "index", { count: 20, grid: { gap: "0px" } }), ...a.more(k, shape(a, "index", 1)), ...(a.after ? a.after(k).slice(0, 1) : [])], { maxWidth: "900px" })] },
  { key: "editorial", label: "Éditorial centré", skinShift: 2, tag: "centré",
    build: (k, a) => [wrap(k, [k.col([info(k, a, { fontSize: "44px", textAlign: "center" }), k.divider(), box(k, { maxWidth: "520px" })], { alignItems: "center" }), main(k, a, 1, "texte", { count: 6, size: "28px", grid: { gap: "8px" }, cardSt: { textAlign: "center", alignItems: "center" } }), ...a.more(k, shape(a, "texte", 1)), ...(a.after ? a.after(k).slice(-1) : [])], { maxWidth: "760px" })] },
  { key: "filtres", label: "Barre de filtres", skinShift: 3, tag: "filtres",
    build: (k, a) => [wrap(k, [info(k, a), box(k), cats(k), main(k, a, 2, "texte", { count: 8 }), ...a.more(k, shape(a, "texte", 2))])] },
  { key: "sections", label: "Résultats puis pistes", skinShift: 4, tag: "suggestions",
    build: (k, a) => [wrap(k, [info(k, a), box(k), main(k, a, 1, "ligne", { count: 6, w: "180px", h: "120px", grid: { gap: "0px" } }), ...a.more(k, shape(a, "ligne", 1)), k.divider(), ...(a.after ? a.after(k) : [refine(k)])])] },
];
const SKIN_ORDER = ["clair", "marque", "nuit", "editorial", "doux"];

// 100 entrées : l'identité visuelle varie avec la composition ET le contenu, de façon déterministe (20 modèles par identité)
function entries() {
  const out = [];
  CONTENTS.forEach((a, i) => COMPOSITIONS.forEach((c) => {
    const skinKey = SKIN_ORDER[(i + c.skinShift) % SKIN_ORDER.length];
    out.push({ key: `${a.key}.${c.key}`, layoutKey: a.key, layoutLabel: a.label, treatmentKey: c.key, skinKey, name: `${a.label} · ${c.label}`, desc: `${a.desc} Composition : ${c.label.toLowerCase()}.`, tags: [...a.tags, c.tag, skinKey], build: (k) => c.build(k, a) });
  }));
  return out;
}
module.exports = { type: "search_results", kind: "page", entries, layouts: CONTENTS.map((a) => ({ key: a.key, label: a.label, tags: a.tags, desc: a.desc })) };
