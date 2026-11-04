// Catalogue « Archive » (blog, catégories, étiquettes, auteurs) — 100 modèles = 20 CONTENUS (archétypes : style des cartes, mode de pagination, aide à la navigation)
// × 5 TRAITEMENTS de mise en page STRUCTURELLEMENT différents (pleine largeur, colonne à droite, colonne à gauche, bandeau d'en-tête, éditorial centré), chacun posé sur une identité visuelle (skin).
// Aucun modèle ne diffère d'un autre par la seule couleur. Tout est natif et réel : widget archiveinfo (titre, description, nombre), boucle d'articles qui SUIT l'archive affichée (archive:true),
// étiquettes {{post.*}}, catfilter, querylist, authorbox, search. Aucune image ni lien factice. Documentation : docs/theme-builder/kolakisa-archive-library.md
const EMPTY = "Aucun article dans cette rubrique pour le moment.";

// ── Éléments communs ─────────────────────────────────────────────────────────────────────────────────
const info = (k, st = {}) => k.W("archiveinfo", { tag: "h1", showDescription: true, showCount: true, fallback: "Blog" }, { color: k.S.fg, fontFamily: k.S.head, ...st });
// titre d'article cliquable
const ttl = (k, size = "22px", st = {}) => ({ ...k.H("{{post.title}}", "3", { fontSize: size, ...st }), props: { text: "{{post.title}}", level: "3", link: "{{post.url}}" } });
const cat = (k) => k.L("{{post.category}}", { color: k.S.accent });
const exc = (k, st = {}) => k.T("<p>{{post.excerpt}}</p>", { color: k.S.mute, fontSize: "15px", ...st });
const by = (k, st = {}) => k.T("<p>{{post.author}} · {{post.date}}</p>", { color: k.S.mute, fontSize: "13px", ...st });
const dateOnly = (k, st = {}) => k.T("<p>{{post.date}}</p>", { color: k.S.accent, fontSize: "14px", fontWeight: "700", ...st });
const body = (k, kids, st = {}) => k.col(kids, { paddingTop: k.S.pad, paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad, gap: "8px", ...st });
// carte standard : image (facultative), rubrique, titre, extrait (facultatif), auteur et date
const card = (k, o = {}) => [...(o.noImage ? [] : [k.img("post.image", { height: o.h || "200px", borderRadius: "0px" })]), body(k, [cat(k), ttl(k, o.size), ...(o.excerpt === false ? [] : [exc(k)]), by(k)], o.noImage ? { paddingTop: k.S.pad } : {})];
// rangée de liste : zone de texte qui prend la place restante
const grow = (st = {}) => ({ flexBasis: "0px", flexGrow: 1, minWidth: "220px", ...st });
const pad = (k) => ({ padding: k.S.pad, paddingTop: k.S.pad, paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad });
// boucle qui suit l'archive : pagination par défaut en numéros, état vide explicite
const lp = (extra = {}) => ({ source: "posts", archive: true, count: 9, paginate: true, pagination: "numbers", empty: EMPTY, ...extra });
const filt = (k, st = {}) => k.W("catfilter", { source: "posts", allLabel: "Toutes", showCount: true }, { color: k.S.fg, ...st });
const ql = (k, p, st = {}) => k.W("querylist", { source: "posts", mode: "recent", count: 5, layout: "compact", showCount: true, empty: "Rien à afficher pour le moment.", ...p }, { color: k.S.fg, ...st });
const tagCloud = (k) => ql(k, { title: "Étiquettes", source: "tags", mode: "popular", count: 16, layout: "inline" });
const author = (k) => k.W("authorbox", { showAvatar: true, showBio: true, showLink: false, linkLabel: "Tous ses articles", heading: "" }, { color: k.S.fg });

// ── Archétypes ───────────────────────────────────────────────────────────────────────────────────────
// A(key, label, tags, desc, { head(k) → éléments sous le titre, content(k, cols) → éléments de la liste (cols = nombre maximal de colonnes que le traitement autorise) })
const A = (key, label, tags, desc, o) => ({ key, label, tags, desc, head: () => [], ...o });
const g = (k, n, cols, kids, loop, st, cardSt) => k.loop(Math.min(n, cols), kids, loop, st, cardSt);
const ARCHETYPES = [
  A("grille-3", "Grille de 3 cartes", ["grille", "cartes", "blog classique"], "Trois cartes par ligne : image, rubrique, titre, extrait.", { content: (k, c) => [g(k, 3, c, card(k), lp())] }),
  A("grille-2", "Grandes cartes", ["grille", "grandes cartes", "magazine"], "Deux grandes cartes par ligne, image haute.", { content: (k, c) => [g(k, 2, c, card(k, { h: "280px", size: "26px" }), lp({ count: 8 }))] }),
  A("grille-4", "Grille dense", ["grille", "dense", "sans extrait"], "Quatre petites cartes par ligne, sans extrait.", { content: (k, c) => [g(k, 4, c, card(k, { h: "150px", size: "17px", excerpt: false }), lp({ count: 12 }))] }),
  A("liste-image", "Liste avec image", ["liste", "horizontal", "image"], "Un article par ligne : image à gauche, texte à droite.", { content: (k) => [k.loop(1, [k.row([k.img("post.image", { width: "260px", height: "170px", borderRadius: k.S.radius }), k.col([cat(k), ttl(k, "24px"), exc(k), by(k)], grow({ gap: "8px" }))], { alignItems: "flex-start", gap: k.S.gap, ...pad(k) })], lp({ count: 8 }))] }),
  A("vedette", "Article à la une", ["vedette", "à la une", "grille"], "Le dernier article en grand, les suivants en grille.", { content: (k, c) => [
    k.loop(1, [k.img("post.image", { height: "380px", borderRadius: "0px" }), body(k, [cat(k), ttl(k, "34px"), exc(k, { fontSize: "17px" }), by(k)], { paddingTop: k.S.pad })], { source: "posts", archive: true, count: 1, empty: EMPTY }),
    g(k, 3, c, card(k), lp({ offset: 1, count: 6 }))] }),
  A("magazine", "Magazine asymétrique", ["magazine", "asymétrique", "éditorial"], "Grande une à gauche, trois brèves à droite, puis la suite.", { content: (k, c) => [
    k.row([
      k.loop(1, [k.img("post.image", { height: "340px", borderRadius: "0px" }), body(k, [cat(k), ttl(k, "30px"), exc(k), by(k)])], { source: "posts", archive: true, count: 1, empty: EMPTY }, { flexBasis: "0px", flexGrow: 2, minWidth: "300px" }),
      k.loop(1, [body(k, [cat(k), ttl(k, "18px"), by(k)], { paddingTop: k.S.pad })], { source: "posts", archive: true, count: 3, offset: 1, empty: EMPTY }, { flexBasis: "0px", flexGrow: 1, minWidth: "240px" })], { alignItems: "flex-start", gap: k.S.gap, flexWrap: "wrap" }),
    g(k, 3, c, card(k, { h: "170px" }), lp({ offset: 4, count: 6 }))] }),
  A("texte", "Cartes de texte", ["texte", "sobre", "sans image"], "Cartes de texte uniquement : rubrique, titre, extrait, auteur.", { content: (k, c) => [g(k, 3, c, card(k, { noImage: true }), lp({ count: 9 }))] }),
  A("compacte", "Liste compacte", ["compact", "titres", "date"], "Une ligne par article : date, titre, auteur.", { content: (k) => [k.loop(1, [k.row([k.T("<p>{{post.date}}</p>", { color: k.S.mute, fontSize: "14px", flexBasis: "120px", flexShrink: 0 }), ttl(k, "19px", grow()), k.T("<p>{{post.author}}</p>", { color: k.S.mute, fontSize: "14px" })], { gap: "16px", ...pad(k) })], lp({ count: 15 }), { gap: "0px" })] }),
  A("mosaique", "Mosaïque", ["mosaïque", "irrégulier", "image"], "Deux grandes cartes puis quatre petites.", { content: (k, c) => [
    g(k, 2, c, card(k, { h: "300px", size: "28px" }), { source: "posts", archive: true, count: 2, empty: EMPTY }),
    g(k, 4, c, card(k, { h: "120px", size: "16px", excerpt: false }), lp({ offset: 2, count: 8 }))] }),
  A("chronologie", "Chronologie", ["timeline", "date", "chronologique"], "Fil vertical : la date à gauche, l'article à droite sur un trait.", { content: (k) => [k.loop(1, [k.row([dateOnly(k, { flexBasis: "130px", flexShrink: 0 }), k.col([ttl(k, "21px"), exc(k), cat(k)], grow({ paddingLeft: "20px", borderLeftWidth: "3px", borderStyle: "solid", borderColor: k.S.accent }))], { alignItems: "flex-start", gap: "16px", ...pad(k) })], lp({ count: 10 }), { gap: "0px" })] }),
  A("carrousel", "Carrousel puis liste", ["carrousel", "slider", "à la une"], "Carrousel horizontal des derniers articles, puis la liste paginée.", { content: (k, c) => [
    g(k, 3, c, card(k, { h: "180px", size: "19px", excerpt: false }), { source: "posts", archive: true, count: 6, slider: true, empty: EMPTY }),
    k.loop(1, [k.row([ttl(k, "20px", grow()), by(k)], pad(k))], lp({ offset: 6, count: 10 }))] }),
  A("charger-plus", "Charger plus", ["charger plus", "pagination", "grille"], "Grille de cartes et bouton « charger plus » à la place des numéros.", { content: (k, c) => [g(k, 3, c, card(k, { h: "190px" }), lp({ pagination: "more", count: 6 }))] }),
  A("defilement", "Défilement continu", ["défilement infini", "pagination", "flux"], "Flux d'articles qui se prolonge automatiquement au fil du défilement.", { content: (k) => [k.loop(1, [k.row([k.img("post.image", { width: "200px", height: "130px", borderRadius: k.S.radius }), k.col([ttl(k, "21px"), by(k)], grow({ gap: "6px" }))], { gap: "20px", ...pad(k) })], lp({ pagination: "infinite", count: 8 }))] }),
  A("precedent-suivant", "Précédent / suivant", ["pagination", "précédent suivant", "lecture"], "Cartes larges et navigation « Précédent / Suivant » plutôt que des numéros.", { content: (k, c) => [g(k, 2, c, card(k, { h: "220px", size: "24px" }), lp({ pagination: "prevnext", count: 6 }))] }),
  A("portfolio", "Portfolio", ["portfolio", "réalisations", "image"], "Vitrine d'images, titre sous chaque vignette.", { content: (k, c) => [g(k, 3, c, [k.img("post.image", { height: "260px", borderRadius: "0px" }), body(k, [ttl(k, "18px"), cat(k)], { paddingTop: k.S.pad })], lp({ count: 12, pagination: "both" }))] }),
  A("actualites", "Fil d'actualités", ["actualités", "dépêches", "date"], "Dépêches : date, rubrique, titre et chapeau, séparées par un filet.", { content: (k) => [k.loop(1, [k.row([dateOnly(k, { flexBasis: "120px", flexShrink: 0 }), k.col([cat(k), ttl(k, "22px"), exc(k)], grow({ gap: "6px" }))], { alignItems: "flex-start", gap: "20px", ...pad(k) })], lp({ count: 10, pagination: "both" }), { gap: "0px" })] }),
  A("categories", "Archive de catégorie", ["catégorie", "filtres", "rubriques"], "Barre de rubriques sous le titre, puis la grille de la catégorie.", { head: (k) => [filt(k)], content: (k, c) => [g(k, 3, c, card(k), lp({ urlFilter: true }))] }),
  A("etiquettes", "Archive d'étiquette", ["étiquette", "tags", "nuage"], "Nuage d'étiquettes au-dessus d'une liste de cartes de texte.", { head: (k) => [tagCloud(k)], content: (k, c) => [g(k, 2, c, card(k, { noImage: true, size: "24px" }), lp({ count: 8 }))] }),
  A("auteur", "Archive d'auteur", ["auteur", "profil", "biographie"], "Fiche de l'auteur (photo, biographie) puis ses articles.", { head: (k) => [author(k)], content: (k, c) => [g(k, 2, c, card(k, { h: "200px" }), lp({ count: 8 }))] }),
  A("recherche", "Recherche et filtres", ["recherche", "filtres", "catégories"], "Champ de recherche et filtres de catégories, grille filtrée par l'adresse.", { head: (k) => [k.search("blog", { maxWidth: "420px", width: "100%" }), filt(k)], content: (k, c) => [g(k, 3, c, card(k, { h: "170px", size: "19px" }), lp({ urlFilter: true }))] }),
];

// ── Traitements : composition de la page autour du contenu ───────────────────────────────────────────
const W = (st) => ({ maxWidth: "1180px", marginLeft: "auto", marginRight: "auto", width: "100%", paddingTop: "40px", ...st });
const sideCol = (k, kids) => k.col(kids, { flexBasis: "280px", flexGrow: 0, flexShrink: 0, gap: k.S.gap });
const mainCol = (k, kids) => k.col(kids, { flexBasis: "0px", flexGrow: 1, minWidth: "280px", gap: k.S.gap });
// Avec une colonne latérale, la zone de liste est étroite : sur tablette elle passe à UNE colonne (sinon les titres se cassent sur trois lignes)
const narrow = (nodes) => { const walk = (n) => { if (n.type === "grid" && n.props && n.props.loop && n.styles) n.styles.tablet = { ...(n.styles.tablet || {}), columns: 1 }; (n.children || []).forEach(walk); return n; }; return nodes.map(walk); };
const widgets = (k) => [k.card([k.L("Rubriques"), filt(k)]), k.card([ql(k, { title: "Les plus lus", mode: "popular" })]), k.card([tagCloud(k)])];
const TREATMENTS = [
  { key: "pleine", label: "Pleine largeur", skinShift: 0, tag: "pleine largeur",
    build: (k, a) => [k.section([k.col([info(k, { fontSize: "40px" }), ...a.head(k)], { gap: "14px" }), ...a.content(k, 4)], W())] },
  { key: "droite", label: "Colonne à droite", skinShift: 1, tag: "colonne latérale",
    build: (k, a) => [k.section([k.col([info(k, { fontSize: "38px" }), ...a.head(k)], { gap: "14px" }), k.row([mainCol(k, narrow(a.content(k, 2))), sideCol(k, widgets(k))], { alignItems: "flex-start", gap: k.S.gap, flexWrap: "wrap" })], W())] },
  { key: "gauche", label: "Colonne à gauche", skinShift: 2, tag: "colonne latérale",
    build: (k, a) => [k.section([k.row([sideCol(k, [info(k, { fontSize: "30px" }), ...a.head(k), k.search("blog", { width: "100%" }), k.card([ql(k, { title: "Rubriques", source: "categories", mode: "popular", count: 12 })])]), mainCol(k, narrow(a.content(k, 2)))], { alignItems: "flex-start", gap: k.S.gap, flexWrap: "wrap" })], W())] },
  { key: "bandeau", label: "Bandeau d'en-tête", skinShift: 3, tag: "bandeau",
    build: (k, a) => [
      k.band([k.inner([k.col([info(k, { fontSize: "40px" }), ...a.head(k)], { gap: "14px", flexBasis: "0px", flexGrow: 1, minWidth: "260px" }), ...(a.key === "recherche" ? [] : [k.search("blog", { maxWidth: "360px", width: "100%" })])], { alignItems: "flex-end" })], { paddingTop: "48px", paddingBottom: "48px", backgroundColor: k.S.alt }),
      k.section(a.content(k, 3), W())] },
  { key: "centre", label: "Éditorial centré", skinShift: 4, tag: "centré",
    build: (k, a) => [k.section([k.col([info(k, { fontSize: "46px", textAlign: "center" }), ...a.head(k), k.divider({ width: "100%" })], { alignItems: "center", textAlign: "center", gap: "14px", width: "100%" }), ...a.content(k, 3)], W({ maxWidth: "1000px" }))] },
];
const SKIN_ORDER = ["clair", "marque", "nuit", "editorial", "doux"];

// 100 entrées : l'identité visuelle varie avec le traitement ET le contenu, de façon déterministe
function entries() {
  const out = [];
  ARCHETYPES.forEach((a, i) => TREATMENTS.forEach((t) => {
    const skinKey = SKIN_ORDER[(i + t.skinShift) % SKIN_ORDER.length];
    out.push({ key: `${a.key}.${t.key}`, layoutKey: a.key, layoutLabel: a.label, treatmentKey: t.key, skinKey, name: `${a.label} · ${t.label}`, desc: a.desc, tags: [...a.tags, t.tag, skinKey], build: (k) => t.build(k, a) });
  }));
  return out;
}
module.exports = { type: "archive", kind: "page", entries, layouts: ARCHETYPES.map((a) => ({ key: a.key, label: a.label, tags: a.tags, desc: a.desc })) };
