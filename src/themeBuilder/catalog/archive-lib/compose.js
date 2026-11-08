// Compositions d'archives : 25 structures de page (pas des variations de couleur) × réglages de chaque concept (colonnes, image, barre latérale, en-tête, navigation, filtre).
// Tout est natif et réel : widget archiveinfo (titre, description, nombre), boucles d'articles réels qui suivent l'archive affichée (archive:true), pagination du moteur de requêtes
// (numéros, précédent/suivant, charger plus, défilement infini), catfilter branché sur la boucle (urlFilter), recherche, listes réelles de rubriques/étiquettes/plus lus, authorbox (page d'auteur).
// Aucune image, donnée ou lien factice. Voir docs/theme-builder/archive/.
const EMPTY = "Aucun article dans cette rubrique pour le moment. Revenez bientôt ou parcourez les autres rubriques.";
const PAGINATION = { N: "numbers", PS: "prevnext", NP: "both", M: "more", I: "infinite" };

// Lecture du réglage « image » d'un concept
function imgSpec(s) {
  const t = String(s || "");
  if (/^aucune/.test(t)) return { none: true };
  const side = /gauche/.test(t) ? "left" : /droite/.test(t) ? "right" : "";
  let aspect = "3/2";
  if (/16:9/.test(t)) aspect = "16/9"; else if (/4:3/.test(t)) aspect = "4/3"; else if (/3:2/.test(t)) aspect = "3/2";
  else if (/1:1|carré|carrée|rond/.test(t)) aspect = "1/1"; else if (/4:5|portrait/.test(t)) aspect = "3/4";
  else if (/plein|large 2:1|large/.test(t)) aspect = "21/9";
  return { aspect, side, round: /rond/.test(t), small: /petite/.test(t), full: /plein/.test(t), bg: /fond/.test(t) };
}

// Variante de traitement d'une même composition (évite que deux concepts voisins aient exactement la même structure d'éléments)
const VARIANT = { 77: 1, 37: 3, 46: 4, 43: 2, 79: 2, 49: 1, 53: 2, 82: 3, 51: 1, 45: 1, 69: 2, 29: 1 };

function ctxOf(k, c) {
  const S = k.S, im = imgSpec(c.img), hybrid = Boolean(k.hybrid);
  const muted = (html, st = {}) => k.T(html, { color: S.mute, fontSize: "15px", ...st });
  const ttl = (size, st = {}) => ({ ...k.H("{{post.title}}", "3", { fontSize: size, lineHeight: 1.2, ...st }), props: { text: "{{post.title}}", level: "3", link: "{{post.url}}" } });
  const cat = () => k.L("{{post.category}}", { color: S.accent });
  const by = (extra = "") => muted(`<p>{{post.author}} · {{post.date}}${extra}</p>`, { fontSize: "13px" });
  const exc = (st = {}) => muted("<p>{{post.excerpt}}</p>", st);
  const picture = (st = {}) => (im.none ? null : k.img("post.image", { aspectRatio: im.aspect, borderRadius: im.round ? "999px" : S.radius, ...st }));
  const body = (kids, st = {}) => k.col(kids.filter(Boolean), { gap: "8px", paddingTop: "4px", paddingBottom: S.pad, paddingLeft: S.pad, paddingRight: S.pad, ...st });
  // Éléments de fiche « à plat » : le retrait horizontal est porté par chaque élément (pas de colonne intermédiaire), pour rester sous la profondeur maximale du moteur (8 niveaux)
  const flat = (kids, o = {}) => [...(o.top ? [k.spacer("8")] : []), ...kids.filter(Boolean).map((kid, i, arr) => ({ ...kid, styles: { ...(kid.styles || {}), desktop: { ...((kid.styles || {}).desktop || {}), paddingLeft: S.pad, paddingRight: S.pad, ...(i === arr.length - 1 ? { paddingBottom: S.pad } : {}) } } }))];
  const grow = (st = {}) => ({ flexBasis: "0px", flexGrow: 1, minWidth: "260px", ...st });

  // ── Fiches d'article (répétées pour chaque article réel) ──
  const ITEMS = {
    carte: (o = {}) => [picture({ borderRadius: "0px" }), ...flat([cat(), ttl(o.size || "21px"), o.noexc ? null : exc(), by()])].filter(Boolean),
    tuile: (o = {}) => flat([cat(), ttl(o.size || "22px"), o.noexc ? null : exc(), by()], { top: S.pad }),
    portrait: (o = {}) => [k.img("post.image", { aspectRatio: "3/4", borderRadius: "0px" }), ...flat([ttl(o.size || "18px"), by()])],
    ligne: (o = {}) => [k.row([picture({ width: o.w || "230px", flexShrink: 0 }), k.col([cat(), ttl(o.size || "21px"), exc(), by(o.extra)], grow({ gap: "8px" }))].filter(Boolean), { alignItems: "flex-start", gap: S.gap, paddingTop: S.pad, paddingBottom: S.pad, paddingLeft: S.pad, paddingRight: S.pad })],
    ligneD: (o = {}) => [k.row([k.col([cat(), ttl(o.size || "23px"), exc(), by()], grow({ gap: "8px" })), picture({ width: o.w || "260px", flexShrink: 0 })].filter(Boolean), { alignItems: "flex-start", gap: S.gap, paddingTop: S.pad, paddingBottom: S.pad, paddingLeft: S.pad, paddingRight: S.pad })],
    compact: () => [k.row([im.none ? null : k.img("post.image", { width: "96px", height: "96px", flexShrink: 0, borderRadius: im.round ? "999px" : S.radius }), k.col([cat(), ttl("17px"), by()], grow({ gap: "4px", minWidth: "160px" }))].filter(Boolean), { alignItems: "center", gap: "14px", paddingTop: "12px", paddingBottom: "12px", paddingLeft: S.pad, paddingRight: S.pad })],
    grand: (o = {}) => [picture({ borderRadius: "0px", aspectRatio: o.aspect || im.aspect || "16/9" }), ...flat([cat(), ttl(o.size || "34px"), exc({ fontSize: "17px" }), by()], { top: S.pad })].filter(Boolean),
    index: () => [k.row([muted("<p>{{post.date}}</p>", { fontSize: "14px", flexBasis: "130px", flexShrink: 0 }), ttl("19px", { flexBasis: "0px", flexGrow: 1, minWidth: "220px" }), muted("<p>{{post.category}}</p>", { fontSize: "13px" })], { gap: "16px", paddingTop: "12px", paddingBottom: "12px", paddingLeft: S.pad, paddingRight: S.pad })],
    // Cartes à titre superposé : le titre est posé sur l'image (dégradé sombre pour la lisibilité)
    overlay: (o = {}) => [k.col([k.img("post.image", { aspectRatio: o.aspect || "4/3", borderRadius: "0px" }),
      k.col([k.L("{{post.category}}", { color: "#ffffff" }), { ...k.H("{{post.title}}", "3", { fontSize: o.size || "22px", color: "#ffffff", lineHeight: 1.15 }), props: { text: "{{post.title}}", level: "3", link: "{{post.url}}" } }], { marginTop: "-96px", paddingTop: "28px", paddingBottom: S.pad, paddingLeft: S.pad, paddingRight: S.pad, backgroundColor: "#000000b3", gap: "6px" })], { gap: "0px", overflow: "hidden", minHeight: "220px", justifyContent: "flex-end", backgroundColor: S.alt })],
    // Ligne de frise : date à gauche, trait vertical, contenu à droite
    frise: () => flat([muted("<p>{{post.date}}</p>", { fontSize: "14px" }), cat(), ttl("21px"), exc(), by()]),
    // Ligne de tableau : titre · rubrique · date
    ligneTab: () => [k.row([ttl("17px", { flexBasis: "0px", flexGrow: 3, minWidth: "200px" }), muted("<p>{{post.category}}</p>", { flexBasis: "0px", flexGrow: 1, minWidth: "110px", fontSize: "14px" }), muted("<p>{{post.date}}</p>", { flexBasis: "150px", flexShrink: 0, fontSize: "14px" })], { gap: "16px", paddingTop: "14px", paddingBottom: "14px", paddingLeft: S.pad, paddingRight: S.pad })],
    // Classement : trié par nombre de lectures (tri réel du moteur), compteur de lectures affiché
    classement: () => [k.row([ttl("22px", { flexBasis: "0px", flexGrow: 1, minWidth: "220px" }), muted("<p>{{post.views}} lectures</p>", { fontSize: "13px", flexShrink: 0 })], { gap: "16px", paddingTop: "14px", paddingBottom: "14px", paddingLeft: S.pad, paddingRight: S.pad })],
    affiche: () => flat([cat(), ttl("60px", { lineHeight: 1.02 }), by()], { top: "22px" }),
    // Fiche cadrée (type polaroïd) : cadre blanc épais, légende sous l'image
    fiche: () => [k.col([picture({ borderRadius: "0px" }), ttl("17px"), by()].filter(Boolean), { gap: "10px", paddingTop: "12px", paddingBottom: "16px", paddingLeft: "12px", paddingRight: "12px" })],
  };
  const CARD_RESET = { backgroundColor: "transparent", borderWidth: "0px", boxShadow: undefined };
  const CARD_LINE = { backgroundColor: "transparent", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.line, borderRadius: "0px" };
  const CARD_FRISE = { backgroundColor: "transparent", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "3px", borderColor: S.accent, borderRadius: "0px", boxShadow: undefined };
  const CARD_FICHE = { backgroundColor: "#ffffff", borderRadius: "2px", boxShadow: "lg", borderWidth: "0px" };

  // Boucle d'articles réels qui suit l'archive affichée (catégorie, étiquette, auteur) ; seules les boucles marquées « paginate » se tournent en pages
  const loop = (cols, style, o = {}) => k.loop(cols, ITEMS[style](o), {
    source: "posts", archive: true, urlFilter: o.filter === undefined ? /C/.test(c.filtre) : o.filter, count: o.count || (cols === 1 ? 8 : cols * 3),
    paginate: o.paginate !== false, pagination: PAGINATION[c.nav] || "numbers", empty: EMPTY, ...(o.offset ? { offset: o.offset } : {}), ...(o.orderby ? { orderby: o.orderby, order: "desc" } : {}), ...(o.slider ? { slider: true } : {}),
  }, { ...(o.grid || {}) }, { ...(o.line ? CARD_LINE : o.frise ? CARD_FRISE : o.plain ? CARD_RESET : o.fiche ? CARD_FICHE : {}), ...(o.cardSt || {}) });

  // ── Filtres, recherche, étiquettes : chacun est branché sur le moteur (catfilter → ?categorie=, search → /recherche, étiquettes → archives d'étiquette) ──
  const catfilter = () => k.W("catfilter", { source: "posts", allLabel: "Toutes", showCount: true }, { color: S.fg });
  const searchBox = (st = {}) => k.search("blog", { maxWidth: "380px", width: "100%", ...st });
  const ql = (p, st = {}) => k.W("querylist", { source: "posts", mode: "recent", count: 5, layout: "compact", showCount: false, empty: "Rien à afficher pour le moment.", ...p }, { color: S.fg, width: "100%", ...st });
  const tagsInline = () => ql({ title: "", source: "tags", mode: "popular", count: 10, layout: "inline" });
  const filters = () => {
    const out = [];
    if (/C/.test(c.filtre)) out.push(catfilter());
    if (/S/.test(c.filtre)) out.push(searchBox());
    if (/T/.test(c.filtre)) out.push(tagsInline());
    return out;
  };

  // ── En-tête de l'archive : titre, description, nombre (données réelles du CMS) ──
  const info = (st = {}, o = {}) => k.W("archiveinfo", { tag: "h1", showDescription: o.description !== false, showCount: o.count !== false, fallback: "Blog" }, { color: S.fg, fontFamily: S.head, fontSize: "40px", fontWeight: S.weight, lineHeight: 1.08, ...st });
  const kicker = () => (hybrid ? k.siteTitle({ fontSize: "14px", color: S.accent }) : k.L(c.fam, { color: S.accent }));
  const authorBox = /photographe|artiste|praticien|chef|freelance|écrivain|journaliste|cabinet|auteur/i.test(c.usage + c.nom) ? [k.W("authorbox", { showAvatar: true, showBio: true, showLink: false, linkLabel: "" }, { color: S.fg })] : [];
  const head = (st = {}, inBar = true) => {
    const f = c.barre === "H" || !inBar ? [] : filters();
    if (c.tete === "centré") return k.col([kicker(), info({ textAlign: "center", fontSize: "46px", ...st }), k.divider(), ...authorBox, ...f], { alignItems: "center", gap: "12px", textAlign: "center" });
    if (c.tete === "éditorial") return k.col([k.row([kicker()], { gap: "0px" }), info({ fontSize: "56px", lineHeight: 1.02, ...st }), k.divider({ borderWidth: "2px" }), ...authorBox, ...f], { gap: "12px" });
    if (c.tete === "bandeau") return k.band([k.inner([k.col([kicker(), info({ fontSize: "42px", ...st }), ...authorBox], { gap: "10px", ...grow() }), ...(f.length ? [k.col(f, { gap: "10px", alignItems: "flex-start", ...grow({ minWidth: "240px" }) })] : [])], { alignItems: "flex-end" })], { backgroundColor: S.alt, paddingTop: "44px", paddingBottom: "36px" });
    return k.col([kicker(), info({ fontSize: "30px", ...st }), ...authorBox, ...f], { gap: "10px" });
  };
  const toolbar = () => (c.barre === "H" && filters().length ? [k.row(filters(), { gap: "16px", alignItems: "center", paddingTop: "10px", paddingBottom: "10px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderBottomWidth: "1px", borderColor: S.line })] : []);

  // ── Barre latérale : blocs de listes réelles (jamais de contenu inventé) ──
  const rubriques = () => k.card([k.L("Rubriques"), ql({ source: "categories", mode: "popular", count: 12, showCount: true })]);
  const plusLus = () => k.card([k.L("Les plus lus"), ql({ mode: "popular" })]);
  const recents = () => k.card([k.L("Récents"), ql({ mode: "recent" })]);
  const etiquettes = () => k.card([k.L("Étiquettes"), ql({ source: "tags", mode: "popular", count: 14, layout: "inline" })]);
  const contact = () => k.card([k.L("Une question ?"), muted("<p>Écrivez-nous, nous vous répondons.</p>"), k.B("Nous contacter", "/contact", "outline")]);
  const SIDE_SETS = [[rubriques, plusLus], [plusLus, etiquettes], [recents, rubriques, contact], [rubriques, etiquettes, recents]];
  const sideBlocks = () => {
    const base = SIDE_SETS[c.n % SIDE_SETS.length].map((f) => f());
    return (c.barre === "G" || c.barre === "D") ? [...filters().map((x) => k.card([x])), ...base] : base;
  };
  const side = (kids, st = {}) => k.col(kids, { flexBasis: "290px", flexGrow: 0, flexShrink: 0, gap: S.gap, ...(c.barre === "G" || c.barre === "D" ? {} : {}), ...st });
  const split = (mainKids, st = {}) => {
    const mainCol = k.col(mainKids, { gap: S.gap, ...grow({ minWidth: "300px" }) }), sideCol = side(sideBlocks());
    return k.row(c.barre === "G" ? [sideCol, mainCol] : [mainCol, sideCol], { alignItems: "flex-start", gap: S.gap, flexWrap: "wrap", ...st });
  };
  // Mise en page : avec barre latérale G/D le contenu principal est en colonne ; sinon sur toute la largeur
  const hasSide = c.barre === "G" || c.barre === "D";
  const page = (mainKids, o = {}) => {
    const inner = hasSide ? [split(mainKids)] : mainKids;
    const top = o.noHead ? [] : c.tete === "bandeau" ? [] : [head(o.headSt)];
    const wrap = k.section([...top, ...toolbar(), ...inner], { paddingTop: "40px", maxWidth: o.maxWidth || "1180px", width: "100%", marginLeft: "auto", marginRight: "auto", ...(o.st || {}) });
    return c.tete === "bandeau" && !o.noHead ? [head(o.headSt), wrap] : [wrap];
  };
  const v = VARIANT[c.n] || 0;
  return { k, c, S, v, im, loop, head, page, split, ITEMS, filters, toolbar, info, kicker, catfilter, searchBox, ql, muted, grow, hasSide, rubriques, plusLus };
}

// ── Les 25 compositions ──
const g = (x, n) => Math.max(1, Math.min(4, n || 3));
const COMP = {
  // Grille de cartes
  G: ({ c, v, loop, page }) => page(v === 1 ? [loop(1, "grand", { count: 1, paginate: false }), loop(g(0, c.cols), "carte", { offset: 1, count: c.cols * 3 })]
    : v === 2 ? [loop(g(0, c.cols), "portrait", { count: c.cols * 3 })] : v === 3 ? [loop(2, "compact", { count: 12 })] : v === 4 ? [loop(g(0, c.cols), "overlay", { count: c.cols * 3 })] : [loop(g(0, c.cols), "carte", { count: c.cols * 3 })]),
  // Grille asymétrique : la première colonne est deux fois plus large
  GA: ({ k, c, loop, page, grow }) => page([k.row(c.barre === "G" ? [k.col([loop(1, "portrait", { count: 3, paginate: false, grid: { gap: "20px" } })], grow({ flexGrow: 1, minWidth: "240px" })), k.col([loop(1, "grand", { count: 2, offset: 3, paginate: false, aspect: "3/2" })], grow({ flexGrow: 2, minWidth: "300px" }))] : [k.col([loop(1, "grand", { count: 2, paginate: false, aspect: "3/2" })], grow({ flexGrow: 2, minWidth: "300px" })), k.col([loop(1, "portrait", { count: 3, offset: 2, paginate: false, grid: { gap: "20px" } })], grow({ flexGrow: 1, minWidth: "240px" }))], { alignItems: "flex-start", gap: k.S.gap }), loop(c.cols, "carte", { offset: 5, count: c.cols * 3, noexc: true })]),
  // Liste image à gauche / à droite / texte seul
  LI: ({ loop, page }) => page([loop(1, "ligne", { line: true, plain: true, grid: { gap: "0px" } })]),
  LD: ({ loop, page }) => page([loop(1, "ligneD", { line: true, plain: true, grid: { gap: "0px" } })]),
  LT: ({ loop, page }) => page([loop(1, "tuile", { line: true, plain: true, grid: { gap: "0px" }, size: "26px" })], { maxWidth: "820px" }),
  // Index daté, groupé visuellement par la date affichée à gauche
  IX: ({ k, v, loop, page }) => page([...(v === 1 ? [k.L("Archives")] : []), loop(1, "index", { line: true, plain: true, count: 20, grid: { gap: "0px" } })], { maxWidth: "900px", headSt: { fontSize: "32px" } }),
  GM: ({ loop, page, hasSide }) => page([loop(hasSide ? 1 : 2, "index", { line: true, plain: true, count: 24, grid: { gap: "0px", columnGap: "40px" } })], { maxWidth: "1100px" }),
  // Mosaïque : une grande, deux moyennes empilées, puis une grille serrée
  MO: ({ k, c, v, loop, page, grow }) => {
    const big = k.col([loop(1, "grand", { count: 1, paginate: false, aspect: "4/3", size: "28px" })], grow({ flexGrow: 2, minWidth: "300px" }));
    const small = k.col([loop(1, "overlay", { count: 2, offset: 1, paginate: false, aspect: "3/2", size: "19px", grid: { gap: "20px" } })], grow({ flexGrow: 1, minWidth: "260px" }));
    return page([k.row(v === 1 ? [small, big] : [big, small], { alignItems: "flex-start", gap: k.S.gap }), loop(c.cols >= 4 ? 4 : 3, "carte", { offset: 3, count: 9, noexc: true })]);
  },
  // Une et brèves
  UB: ({ k, c, v, loop, page, grow }) => {
    if (v === 2) return page([loop(3, "carte", { count: 3, paginate: false, noexc: true }), loop(1, "ligne", { offset: 3, count: 8, line: true, plain: true, grid: { gap: "0px" } })]);
    const one = k.col([loop(1, "grand", { count: 1, paginate: false })], grow({ flexGrow: 2, minWidth: "300px" }));
    const brief = k.col([loop(1, "tuile", { count: 3, offset: 1, paginate: false, size: "18px", noexc: true, line: true, plain: true, grid: { gap: "0px" } })], grow({ flexGrow: 1, minWidth: "240px" }));
    return page([k.row(v === 1 ? [brief, one] : [one, brief], { alignItems: "flex-start", gap: k.S.gap }), loop(c.cols, "carte", { offset: 4, count: c.cols * 3, noexc: true })]);
  },
  // Héros + grille
  HG: ({ k, c, v, loop, page, grow }) => page(v === 1
    ? [k.row([k.col([loop(1, "grand", { count: 1, paginate: false })], grow({ flexGrow: 2, minWidth: "300px" })), k.col([loop(1, "tuile", { count: 3, offset: 1, paginate: false, size: "18px", noexc: true, line: true, plain: true, grid: { gap: "0px" } })], grow({ flexGrow: 1, minWidth: "240px" }))], { alignItems: "flex-start", gap: k.S.gap }), loop(c.cols, "carte", { offset: 4, count: c.cols * 3, noexc: true })]
    : v === 2 ? [loop(1, "grand", { count: 1, paginate: false, aspect: "21/9" }), loop(c.cols, "overlay", { offset: 1, count: c.cols * 3 })]
    : v === 3 ? [loop(1, "grand", { count: 1, paginate: false, aspect: "21/9" }), loop(1, "ligne", { offset: 1, count: 8, line: true, plain: true, grid: { gap: "0px" } })]
    : [loop(1, "grand", { count: 1, paginate: false, aspect: "21/9" }), loop(c.cols, "carte", { offset: 1, count: c.cols * 3, noexc: c.cols > 3 })]),
  // Trois vedettes verticales, puis liste
  V3: ({ loop, page }) => page([loop(3, "portrait", { count: 3, paginate: false }), loop(1, "ligne", { offset: 3, count: 8, line: true, plain: true, grid: { gap: "0px" } })]),
  // Sections par rubrique : une boucle par rubrique populaire n'existe pas dans le moteur ; deux blocs (récents puis plus lus) servent de sections réelles
  MS: ({ k, c, loop, page, ql }) => page([k.L("À la une"), loop(c.cols, "carte", { count: c.cols, paginate: false, noexc: true }), k.divider(), k.L("Les plus lus"), loop(1, "classement", { orderby: "views", count: 5, paginate: false, line: true, plain: true, grid: { gap: "0px" } }), k.divider(), k.L("Tous les articles"), loop(c.cols, "carte", { offset: c.cols, count: c.cols * 2, noexc: true })]),
  // Colonnes de journal : filets verticaux, texte seul, premier article en tête
  CJ: ({ k, c, loop, page }) => page([loop(1, "grand", { count: 1, paginate: false, aspect: "21/9", size: "40px" }), loop(c.cols, "tuile", { offset: 1, count: c.cols * 4, size: "20px", plain: true, grid: { gap: "0px" }, cardSt: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: k.S.line } })]),
  // Frise chronologique
  TL: ({ loop, page }) => page([loop(1, "frise", { count: 8, frise: true, grid: { gap: "28px" } })], { maxWidth: "900px" }),
  // Cartes à image de fond et titre superposé
  OV: ({ c, loop, page }) => page([loop(c.cols, "overlay", { count: c.cols * 3, aspect: "4/3" })]),
  // Pleine largeur immersive : une image large par article
  FS: ({ v, loop, page }) => page([v === 2 ? loop(2, "grand", { count: 6, aspect: "16/9", size: "26px", plain: true }) : v === 1 ? loop(1, "grand", { count: 5, aspect: "21/9", size: "34px", plain: true, grid: { gap: "40px" } }) : loop(1, "overlay", { count: 5, aspect: "21/9", size: "34px", grid: { gap: "28px" } })], { maxWidth: "1400px" }),
  // Bandes défilantes (carrousel horizontal réel du moteur)
  CR: ({ k, c, loop, page }) => page([k.L("À la une"), loop(c.cols, "portrait", { count: 8, paginate: false, slider: true }), k.L("Tous les articles"), loop(c.cols, "carte", { offset: 8, count: c.cols * 2, noexc: true })]),
  // Tableau : en-têtes de colonnes puis lignes réelles
  TB: ({ k, S, loop, page, muted }) => page([k.row([muted("<p>Titre</p>", { flexGrow: 3, flexBasis: "0px", minWidth: "200px", fontSize: "13px" }), muted("<p>Rubrique</p>", { flexGrow: 1, flexBasis: "0px", minWidth: "110px", fontSize: "13px" }), muted("<p>Date</p>", { flexBasis: "150px", flexShrink: 0, fontSize: "13px" })], { gap: "16px", paddingLeft: S.pad, paddingRight: S.pad, borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: S.fg }), loop(1, "ligneTab", { count: 15, line: true, plain: true, grid: { gap: "0px" } })]),
  // Zigzag : grandes images, texte qui chevauche l'image
  ZZ: ({ k, loop, page }) => page([loop(1, "ligne", { w: "46%", extra: "", line: true, plain: true, grid: { gap: "16px" }, count: 6 })]),
  // Écran scindé : titre et filtres fixes à gauche, liste qui défile à droite
  SP: ({ k, c, S, loop, filters, info, kicker, grow }) => [k.section([k.row([
    k.col([kicker(), info({ fontSize: "44px" }), ...filters()], { flexBasis: "320px", flexGrow: 0, flexShrink: 0, gap: "14px", position: "sticky", top: "24px", alignSelf: "flex-start" }),
    k.col([loop(1, "ligne", { line: true, plain: true, grid: { gap: "0px" }, w: "200px" })], grow({ minWidth: "300px" }))], { alignItems: "flex-start", gap: S.gap, flexWrap: "wrap" })], { paddingTop: "40px", maxWidth: "1180px", width: "100%", marginLeft: "auto", marginRight: "auto" })],
  // Classement : tri réel par nombre de lectures
  NU: ({ loop, page }) => page([loop(1, "classement", { orderby: "views", count: 10, line: true, plain: true, grid: { gap: "0px" } })], { maxWidth: "900px" }),
  // Cartes horizontales compactes
  CH: ({ c, loop, page }) => page([loop(Math.min(c.cols, 2), "compact", { count: 12, grid: {} })]),
  // Typographique géant
  TY: ({ loop, page }) => page([loop(1, "affiche", { count: 6, line: true, plain: true, grid: { gap: "0px" } })], { headSt: { fontSize: "72px" } }),
  // Mur de fiches cadrées
  PO: ({ c, loop, page }) => page([loop(c.cols, "fiche", { count: c.cols * 3, fiche: true })]),
  // Pile de fiches : grandes images pleine largeur l'une sous l'autre
  ST: ({ k, loop, page }) => page([k.divider(), loop(1, "grand", { count: 4, aspect: "16/9", size: "30px", plain: true, grid: { gap: "48px" } })], { maxWidth: "860px" }),
};

function build(c) {
  return (k) => {
    const ctx = ctxOf(k, c);
    const fn = COMP[c.comp];
    if (!fn) throw new Error(`Composition d'archive inconnue : ${c.comp}`);
    return fn({ ...ctx, S: k.S });
  };
}
module.exports = { build, COMP, imgSpec, EMPTY };
