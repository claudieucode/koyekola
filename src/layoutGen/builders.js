// Constructeurs de compositions (programme 22.3). Un constructeur = une STRUCTURE paramétrable (grille, flex, empilement) ; les « layouts » nommés du registre (patterns.js) ne sont que des
// configurations de ces constructeurs : aucune variation n'est un nouveau widget. Chaque constructeur renvoie un tableau de nœuds natifs (la racine est un conteneur « bande »).
// Le contenu n'est jamais tronqué ni complété : un élément absent du contenu n'est pas fabriqué.
const B = require("./base");
const { node, heading, richText, button, image, badge, flex, grid, band, SPACE, frs, n2 } = B;

const WIDTH = Object.freeze({ narrow: "32rem", normal: "40rem", wide: "48rem", full: "64rem" });
// Échelle typographique : valeurs fixes issues du mapping contenu → mise en page (mapper.js)
const SIZE = Object.freeze({ display: "72px", xl: "56px", lg: "44px", md: "36px", sm: "28px" });
const h1 = (x, c, size, align, extra = {}) => heading(x, c.title, 1, { d: { fontSize: size === "token" ? "token:h1-size" : SIZE[size] || "token:h1-size", lineHeight: "1.08", textAlign: align, ...extra } });
const sub = (x, c, w = "normal", align = "left", extra = {}) => richText(x, c.text, { d: { maxWidth: WIDTH[w], color: "token:muted", fontSize: "20px", lineHeight: "1.55", textAlign: align, ...(align === "center" ? { marginLeft: "auto", marginRight: "auto" } : {}), ...extra } });
const btns = (x, c, align = "left") => {
  const list = [button(x, c.cta, "primary", null, "lg"), button(x, c.cta2, "outline", null, "lg")].filter(Boolean);
  return list.length ? node(x, "container", {}, { d: flex("row", { gap: "sm", wrap: true, justify: align === "center" ? "center" : "flex-start" }) }, list) : null;
};
const eyebrow = (x, c, align) => badge(x, c.eyebrow, { d: { alignSelf: align === "center" ? "center" : "flex-start" } });
const stack = (x, kids, { gap = "md", align = "stretch", justify, extra = {}, hint } = {}) => node(x, "stack", {}, { d: { ...flex("column", { gap, align, justify }), ...extra } }, kids, hint ? { hint } : {});
const cover = (extra = {}) => ({ width: "100%", height: "100%", objectFit: "cover", ...extra });
const FIT = (c) => (c.image && c.image.orient === "portrait" ? { aspectRatio: "3/4" } : { aspectRatio: "3/2" });
const body = (x, it, extra = {}) => richText(x, [it.text, it.price].filter(Boolean).join("\n\n"), { d: { color: "token:muted", ...extra } });
const iconlist = (x, list) => { const it = (list || []).map((i) => ({ text: i.title || i.text, icon: i.icon || "check" })).filter((i) => i.text); return it.length ? node(x, "iconlist", { items: it }) : null; };
const heading2 = (x, c, align = "left", extra = {}) => heading(x, c.title, 2, { d: { fontSize: "token:h2-size", textAlign: align, ...extra } });
const intro = (x, c, align = "left") => [heading2(x, c, align), c.text ? richText(x, c.text, { d: { color: "token:muted", maxWidth: WIDTH.wide, textAlign: align, ...(align === "center" ? { marginLeft: "auto", marginRight: "auto" } : {}) } }) : null].filter(Boolean);
const head = (x, c, align = "left") => { const k = intro(x, c, align); return k.length ? stack(x, k, { gap: "sm", align: align === "center" ? "center" : "stretch" }) : null; };

// ── HERO ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const HERO = {
  // Image et texte côte à côte, proportions réglables, côté de l'image réglable
  split(x, c, p, pf) {
    const text = stack(x, [eyebrow(x, c), h1(x, c, pf.heroSize, "left"), sub(x, c), btns(x, c), p.points ? iconlist(x, c.items) : null], { gap: "md", justify: "center" });
    const img = image(x, c.image, { d: cover({ borderRadius: p.rounded ? "token:radius-lg" : "0px", ...FIT(c) }) });
    const kids = p.imageSide === "left" ? [img, text] : [text, img];
    const ratio = p.imageSide === "left" ? `${p.ratio.split(":").reverse().join(":")}` : p.ratio;
    return [band(x, [node(x, "grid", {}, { d: grid(frs(ratio), { gap: "xl", align: "center" }) }, kids)], { bg: p.bg || "default", rhythm: p.rhythm || "airy" })];
  },
  // Image en fond, voile de contraste, contenu positionné (gauche / centre)
  full(x, c, p, pf) {
    const al = p.align || "left";
    const inner = stack(x, [eyebrow(x, c, al), h1(x, c, pf.heroSize, al, { color: "#ffffff" }), sub(x, c, "normal", al, { color: "#ffffff" }), btns(x, c, al)], { gap: "md", align: al === "center" ? "center" : "flex-start", extra: { maxWidth: WIDTH.full } });
    const b = band(x, [inner], { bg: "dark", rhythm: "xxl", extra: { minHeight: p.height || "80vh", display: "flex", flexDirection: "column", justifyContent: "center", backgroundImage: { src: c.image.src }, backgroundSize: "cover", backgroundPosition: "center", overlay: { color: "#0b2a40b3" }, color: "#ffffff" } });
    b._r = { heroMinHeight: true };
    return [b];
  },
  // Typographie seule : très grand titre, texte étroit, pas d'image
  type(x, c, p, pf) {
    const al = p.align || "left";
    const kids = [eyebrow(x, c, al), h1(x, c, p.huge ? "display" : pf.heroSize, al, { letterSpacing: "-0.02em" }), p.rule ? node(x, "divider", { thickness: 3, lineStyle: "solid", color: "token:accent" }, { d: { width: "96px", ...(al === "center" ? { marginLeft: "auto", marginRight: "auto" } : {}) } }) : null, sub(x, c, p.narrow ? "narrow" : "normal", al), btns(x, c, al)];
    return [band(x, [stack(x, kids, { gap: "lg", align: al === "center" ? "center" : "flex-start" })], { bg: p.bg || "default", rhythm: "xxl" })];
  },
  // Superposition NATIVE : texte et image occupent la même zone de la grille ; la carte de texte recouvre l'image (placement par lignes/colonnes)
  layered(x, c, p, pf) {
    const mir = Boolean(p.mirror);
    const img = image(x, c.image, { d: cover({ gridColumnStart: mir ? 1 : 5, gridColumnEnd: mir ? 9 : 13, gridRowStart: 1, gridRowEnd: 2, ...FIT(c) }), t: { gridColumnStart: 1, gridColumnEnd: 13, gridRowStart: 1 }, m: { gridColumnStart: 1, gridColumnEnd: 13 } });
    const card = stack(x, [eyebrow(x, c), h1(x, c, pf.heroSize === "display" ? "xl" : pf.heroSize, "left"), sub(x, c), btns(x, c)], { gap: "md", extra: { gridColumnStart: mir ? 6 : 1, gridColumnEnd: mir ? 13 : 8, gridRowStart: 1, gridRowEnd: 2, zIndex: 2, alignSelf: "center", backgroundColor: "token:surface", paddingTop: SPACE.xl, paddingBottom: SPACE.xl, paddingLeft: SPACE.xl, paddingRight: SPACE.xl, boxShadow: "lg", borderRadius: "token:radius-md" }, hint: { layered: true } });
    return [band(x, [node(x, "grid", {}, { d: { display: "grid", columns: 12, gap: SPACE.md, alignItems: "center" } }, [img, card])], { bg: "default", rhythm: "airy" })];
  },
  minimal(x, c, p, pf) {
    return [band(x, [stack(x, [eyebrow(x, c, "center"), h1(x, c, "md", "center"), sub(x, c, "narrow", "center"), btns(x, c, "center")], { gap: "md", align: "center" })], { bg: "default", rhythm: "xxl" })];
  },
  // Éditorial : titre très large à gauche, texte et bouton dans une colonne étroite à droite, filet
  editorial(x, c, p, pf) {
    const left = stack(x, [eyebrow(x, c), h1(x, c, p.huge ? "display" : "xl", "left", { fontFamily: "serif" })], { gap: "md" });
    const right = stack(x, [sub(x, c, "narrow"), btns(x, c)], { gap: "md", justify: "flex-end" });
    const rows = [node(x, "grid", {}, { d: grid("2fr 1fr", { gap: "xl", align: "end" }) }, [left, right])];
    if (c.image) rows.push(image(x, c.image, { d: cover({ aspectRatio: "21/9", marginTop: SPACE.xl }) }));
    return [band(x, rows, { bg: "default", rhythm: "xl" })];
  },
  // Corporate : split sobre + points clés en liste d'icônes
  corporate(x, c, p, pf) { return HERO.split(x, c, { ratio: "7:5", imageSide: "right", points: true, rounded: false, bg: "surface", rhythm: "xl" }, pf); },
  product(x, c, p, pf) { return HERO.split(x, c, { ratio: "1:1", imageSide: "left", rounded: true, bg: "default", rhythm: "xl" }, pf); },
  // Asymétrique : grande image haute à droite sur deux lignes, texte à gauche, vignette secondaire (si une 2e image existe)
  asym(x, c, p, pf) {
    const second = (c.images || [])[1];
    const mir = Boolean(p.mirror);
    const big = image(x, c.image, { d: cover({ gridColumnStart: mir ? 1 : 7, gridColumnEnd: mir ? 7 : 13, gridRowStart: 1, gridRowEnd: 3, aspectRatio: "3/4" }), t: { gridColumnStart: 1, gridColumnEnd: 13, gridRowStart: 2, gridRowEnd: 3 }, m: { gridColumnStart: 1, gridColumnEnd: 13, gridRowStart: 2, gridRowEnd: 3 } });
    const text = stack(x, [eyebrow(x, c), h1(x, c, pf.heroSize, "left"), sub(x, c), btns(x, c)], { gap: "md", justify: "center", extra: { gridColumnStart: mir ? 7 : 1, gridColumnEnd: mir ? 13 : 7, gridRowStart: 1, gridRowEnd: 2 } });
    const small = second ? image(x, second, { d: cover({ gridColumnStart: mir ? 10 : 1, gridColumnEnd: mir ? 13 : 4, gridRowStart: 2, gridRowEnd: 3, aspectRatio: "1/1" }), t: { display: "none" }, m: { display: "none" } }) : null;
    return [band(x, [node(x, "grid", {}, { d: { display: "grid", columns: 12, gap: SPACE.lg, alignItems: "center" } }, [text, big, small])], { bg: "default", rhythm: "airy" })];
  },
};
HERO.creative = (x, c, p, pf) => HERO.asym(x, c, p, pf);

// ── SECTIONS INTERNES ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const SEC = {
  // Cartes en grille régulière (services, avantages…) ; numérotées ou non
  cards(x, c, p, pf) {
    const cols = Math.min(p.cols || pf.cols, 4);
    if (p.showcase) {
      // Vitrine : visuel dominant (4/3) puis titre et texte, sans fond de carte ; une colonne de moins pour laisser respirer les images
      const sc = Math.min(cols, 3);
      const tiles = c.items.map((it) => stack(x, [it.image ? image(x, it.image, { d: cover({ aspectRatio: "4/3", borderRadius: "token:radius-md" }) }) : null, heading(x, it.title, 3, { d: { fontSize: "token:h3-size" } }), body(x, it), it.price ? heading(x, it.price, 4, { d: { color: "token:primary" } }) : null], { gap: "sm" }));
      return [band(x, [head(x, c, p.align || "left"), node(x, "grid", {}, { d: grid(Array(sc).fill("1fr").join(" "), { gap: "xl", align: "start" }) }, tiles, { hint: { cols: sc } })], { bg: p.bg || "default", rhythm: "airy" })];
    }
    const cards = c.items.map((it, i) => node(x, "container", {}, { d: { ...flex("column", { gap: "sm" }), backgroundColor: p.flat ? "transparent" : "token:surface", borderRadius: "token:radius-md", paddingTop: SPACE.lg, paddingBottom: SPACE.lg, paddingLeft: SPACE.lg, paddingRight: SPACE.lg, ...(p.flat ? {} : { boxShadow: "sm" }) } }, [
      p.numbered ? node(x, "badge", { text: n2(i + 1) }, { d: { alignSelf: "flex-start" } }) : null,
      it.image ? image(x, it.image, { d: cover({ aspectRatio: "3/2", borderRadius: "token:radius-sm" }) }) : null,
      heading(x, it.title, 3, { d: { fontSize: "token:h3-size" } }), richText(x, it.text, { d: { color: "token:muted" } }), it.price ? heading(x, it.price, 4, { d: { color: "token:primary" } }) : null,
    ]));
    return [band(x, [head(x, c, p.align || "left"), node(x, "grid", {}, { d: grid(Array(cols).fill("1fr").join(" "), { gap: "lg", align: "stretch" }) }, cards, { hint: { cols } })], { bg: p.bg || "surface", rhythm: p.rhythm || "normal" })];
  },
  // Liste éditoriale : titre à gauche, texte à droite, filet entre les lignes
  list(x, c, p, pf) {
    const rows = c.items.map((it, i) => node(x, "grid", {}, { d: grid(frs(p.ratio || "1:2"), { gap: "lg", align: "start", ...(i ? { borderTopWidth: "1px", borderStyle: "solid", borderColor: "token:muted", paddingTop: SPACE.md } : {}) } ) }, [
      node(x, "container", {}, { d: flex("row", { gap: "sm", align: "baseline" }) }, [p.numbered ? heading(x, n2(i + 1), 4, { d: { color: "token:primary" } }) : null, heading(x, it.title, 3, { d: { fontSize: "token:h3-size" } })]),
      body(x, it),
    ]));
    return [band(x, [head(x, c), stack(x, rows, { gap: "md" })], { bg: p.bg || "default", rhythm: "normal" })];
  },
  // Asymétrique : la première carte occupe deux colonnes et deux lignes, les suivantes se rangent autour (espace négatif assumé)
  asymCards(x, c, p, pf) {
    const cards = c.items.map((it, i) => node(x, "container", {}, { d: { ...flex("column", { gap: "sm", justify: i === 0 ? "flex-end" : "flex-start" }), ...(i === 0 ? { gridColumnSpan: 2, gridRowSpan: 2, backgroundColor: "token:primary", color: "token:on-primary" } : { backgroundColor: "token:surface", boxShadow: "sm" }), borderRadius: "token:radius-md", paddingTop: SPACE.lg, paddingBottom: SPACE.lg, paddingLeft: SPACE.lg, paddingRight: SPACE.lg }, t: { gridColumnSpan: 2, gridRowSpan: 1 }, m: { gridColumnSpan: 1 } }, [
      heading(x, it.title, i === 0 ? 2 : 3, { d: { fontSize: i === 0 ? "token:h2-size" : "token:h3-size" } }), body(x, it, i === 0 ? { color: "token:on-primary" } : {}),
    ]));
    return [band(x, [head(x, c), node(x, "grid", {}, { d: { display: "grid", gridTemplate: "1fr 1fr 1fr", gridAutoRows: "auto", gap: SPACE.md } }, cards, { hint: { asym: true } })], { bg: "default", rhythm: "normal" })];
  },
  // Texte d'introduction + liste de points : colonne de présentation à gauche, éléments à droite
  split(x, c, p, pf) {
    const left = stack(x, [eyebrow(x, c), heading2(x, c), richText(x, c.text, { d: { color: "token:muted" } }), c.image ? image(x, c.image, { d: cover({ aspectRatio: "3/2", borderRadius: "token:radius-md" }) }) : null, btns(x, c)], { gap: "md" });
    const right = c.items.length ? stack(x, c.items.map((it, i) => node(x, "container", {}, { d: flex("row", { gap: "md", align: "flex-start" }) }, [p.numbered ? heading(x, n2(i + 1), 3, { d: { color: "token:primary" } }) : null, stack(x, [heading(x, it.title, 4, { d: { fontSize: "token:h4-size" } }), body(x, it)], { gap: "xs" })])), { gap: "lg" }) : null;
    const kids = p.side === "right" ? [right, left] : [left, right];
    return [band(x, [node(x, "grid", {}, { d: grid(frs(p.ratio || "1:1"), { gap: "xl", align: "start" }) }, kids.filter(Boolean))], { bg: p.bg || "default", rhythm: p.rhythm || "normal" })];
  },
  stats(x, c, p, pf) {
    const nums = c.items.filter((i) => Number.isFinite(i.value));
    const cols = Math.min(nums.length, 4);
    const cells = nums.map((it) => node(x, "counter", { value: it.value, prefix: it.prefix || "", suffix: it.suffix || "", label: it.title || it.text }, { d: { textAlign: p.align || "center" } }));
    return [band(x, [head(x, c, "center"), node(x, "grid", {}, { d: grid(Array(cols).fill("1fr").join(" "), { gap: "lg" }) }, cells, { hint: { cols, keep2: true } })], { bg: p.bg || "primary", rhythm: "normal" })];
  },
  team(x, c, p, pf) {
    const cols = Math.min(p.cols || pf.cols, 4);
    const cards = c.items.map((it) => stack(x, [it.image ? image(x, it.image, { d: cover({ aspectRatio: "1/1", borderRadius: p.round ? "50%" : "token:radius-md" }) }) : null, heading(x, it.title, 3, { d: { fontSize: "token:h4-size" } }), body(x, it)], { gap: "xs", align: p.round ? "center" : "stretch", extra: p.round ? { textAlign: "center" } : {} }));
    return [band(x, [head(x, c, "center"), node(x, "grid", {}, { d: grid(Array(cols).fill("1fr").join(" "), { gap: "lg" }) }, cards, { hint: { cols } })], { bg: p.bg || "default", rhythm: "normal" })];
  },
  testimonials(x, c, p, pf) {
    const items = c.items.filter((i) => i.text && (i.author || i.title));
    const mk = (it, big) => node(x, "testimonial", { text: it.text, name: it.author || it.title, role: it.role || "", rating: 0 }, big ? { d: { fontSize: "24px", lineHeight: "1.4" } } : null);
    let body;
    if (p.featured && items.length > 1) body = node(x, "grid", {}, { d: grid("2fr 1fr", { gap: "lg", align: "stretch" }) }, [mk(items[0], true), stack(x, items.slice(1).map((i) => mk(i, false)), { gap: "md" })], { hint: { asym: true } });
    else { const cols = Math.min(p.cols || Math.min(items.length, 3), 3); body = node(x, "grid", {}, { d: grid(Array(cols).fill("1fr").join(" "), { gap: "lg", align: "stretch" }) }, items.map((i) => mk(i, false)), { hint: { cols } }); }
    return [band(x, [head(x, c, "center"), body], { bg: p.bg || "surface", rhythm: "normal" })];
  },
  pricing(x, c, p, pf) {
    const items = c.items.filter((i) => i.title && i.price);
    const cols = Math.min(items.length, 4);
    const cells = items.map((it, i) => node(x, "pricing", { title: it.title, price: it.price, period: it.period || "", description: it.text || "", features: it.features || [], ...(it.cta && it.cta.url ? { ctaLabel: it.cta.label, ctaUrl: it.cta.url } : {}), badge: it.badge || "", highlight: it.highlight === true || (p.highlightMiddle && items.length === 3 && i === 1) }));
    return [band(x, [head(x, c, "center"), node(x, "grid", {}, { d: grid(Array(cols).fill("1fr").join(" "), { gap: "lg", align: "stretch" }) }, cells, { hint: { cols } })], { bg: p.bg || "default", rhythm: "normal" })];
  },
  // Comparatif de fonctionnalités : tableau natif (lignes fournies par le contenu uniquement)
  compare(x, c, p, pf) {
    return [band(x, [head(x, c, "center"), node(x, "table", { rows: c.table, header: true, striped: true, caption: c.title || "" })], { bg: "default", rhythm: "normal" })];
  },
  faq(x, c, p, pf) {
    const acc = node(x, "accordion", { items: c.items.filter((i) => i.q && i.a).map((i) => ({ q: i.q, a: i.a })), faqSchema: true, openFirst: true });
    if (!p.split) return [band(x, [head(x, c, "center"), acc], { bg: p.bg || "default", rhythm: "normal" })];
    return [band(x, [node(x, "grid", {}, { d: grid("1fr 2fr", { gap: "xl", align: "start" }) }, [stack(x, [heading2(x, c), richText(x, c.text, { d: { color: "token:muted" } })], { gap: "sm", extra: { position: "sticky", top: "24px" } }), acc])], { bg: p.bg || "default", rhythm: "normal" })];
  },
  steps(x, c, p, pf) {
    const cols = Math.min(c.items.length, 4);
    const cells = c.items.map((it, i) => stack(x, [heading(x, n2(i + 1), 2, { d: { color: "token:primary", fontSize: "token:h2-size" } }), node(x, "divider", { thickness: 2, lineStyle: "solid", color: "token:primary" }), heading(x, it.title, 3, { d: { fontSize: "token:h4-size" } }), body(x, it)], { gap: "sm" }));
    if (p.vertical) return [band(x, [head(x, c), stack(x, c.items.map((it, i) => node(x, "grid", {}, { d: grid("1fr 6fr", { gap: "lg", align: "start" }) }, [heading(x, n2(i + 1), 2, { d: { color: "token:primary" } }), stack(x, [heading(x, it.title, 3, { d: { fontSize: "token:h3-size" } }), body(x, it)], { gap: "xs" })])), { gap: "lg" })], { bg: "default", rhythm: "normal" })];
    return [band(x, [head(x, c), node(x, "grid", {}, { d: grid(Array(cols).fill("1fr").join(" "), { gap: "lg" }) }, cells, { hint: { cols } })], { bg: "default", rhythm: "normal" })];
  },
  // Galerie : grille native (colonnes, ratio) ou maçonnerie (hauteurs naturelles)
  gallery(x, c, p, pf) {
    const imgs = c.images.slice(0, 24);
    const g = node(x, "gallery", { images: imgs.map((i) => ({ src: i.src, alt: i.alt || "Image", ...(i.caption ? { caption: i.caption } : {}) })), lightbox: true, masonry: Boolean(p.masonry), columns: p.cols || Math.min(Math.max(imgs.length, 2), 4), ...(p.ratio ? { ratio: p.ratio } : {}) }, { d: { gap: SPACE.sm } });
    return [band(x, [head(x, c, p.align || "left"), g], { bg: p.bg || "default", rhythm: "normal" })];
  },
  // Mosaïque : grille 4 colonnes, tuiles de tailles différentes (rythme 2×2, 1×1, 1×2…), images recadrées
  mosaic(x, c, p, pf) {
    const SPANS = [[2, 2], [1, 1], [1, 2], [1, 1], [2, 1], [1, 1], [1, 1], [2, 1]];
    const tiles = c.images.slice(0, 8).map((im, i) => { const [cs, rs] = SPANS[i % SPANS.length]; return image(x, im, { d: cover({ gridColumnSpan: cs, gridRowSpan: rs, borderRadius: "token:radius-sm" }), t: { gridColumnSpan: Math.min(cs, 2), gridRowSpan: 1 }, m: { gridColumnSpan: 1, gridRowSpan: 1 } }); });
    return [band(x, [head(x, c), node(x, "grid", {}, { d: { display: "grid", gridTemplate: "1fr 1fr 1fr 1fr", gridAutoRows: "180px", gridAutoFlow: "row dense", gap: SPACE.sm } }, tiles, { hint: { mosaic: true } })], { bg: p.bg || "default", rhythm: "normal" })];
  },
  logos(x, c, p, pf) {
    const imgs = c.images.slice(0, 12);
    return [band(x, [head(x, c, "center"), node(x, "gallery", { images: imgs.map((i) => ({ src: i.src, alt: i.alt || "Logo partenaire" })), columns: Math.min(imgs.length, 6), lightbox: false }, { d: { gap: SPACE.lg, opacity: "0.8" } })], { bg: "surface", rhythm: "compact" })];
  },
  contact(x, c, p, pf) {
    const left = stack(x, [heading2(x, c), richText(x, c.text, { d: { color: "token:muted" } }), iconlist(x, (c.items || []).map((i) => ({ ...i, title: i.text || i.title })))].filter(Boolean), { gap: "md" });
    const right = stack(x, [c.image ? image(x, c.image, { d: cover({ aspectRatio: "3/2", borderRadius: "token:radius-md" }) }) : null, btns(x, c)], { gap: "md", justify: "center" });
    return [band(x, [node(x, "grid", {}, { d: grid(frs("1:1"), { gap: "xl", align: "center" }) }, [left, right])], { bg: "surface", rhythm: "normal" })];
  },
  cta(x, c, p, pf) {
    if (p.split) return [band(x, [node(x, "grid", {}, { d: grid("2fr 1fr", { gap: "lg", align: "center" }) }, [stack(x, [heading2(x, c, "left", { color: "token:on-primary" }), richText(x, c.text, { d: { color: "token:on-primary" } })], { gap: "sm" }), btns(x, c, "left")])], { bg: "primary", rhythm: "normal" })];
    return [band(x, [stack(x, [heading2(x, c, "center", { color: "token:on-primary" }), richText(x, c.text, { d: { color: "token:on-primary", textAlign: "center" } }), btns(x, c, "center")], { gap: "md", align: "center" })], { bg: "primary", rhythm: "normal" })];
  },
  // Texte long en colonnes de lecture, lettrine
  article(x, c, p, pf) {
    const cols = node(x, "text", { html: B.para(c.text), dropCap: true }, { d: { columnCount: p.columns || 2, columnGap: SPACE.xl, fontSize: "18px", lineHeight: "1.7" }, t: { columnCount: 1 }, m: { columnCount: 1 } }, null, { hint: { cols: 1 } });
    const more = c.items.length ? stack(x, c.items.map((it) => stack(x, [heading(x, it.title, 3, { d: { fontSize: "token:h4-size" } }), body(x, it)], { gap: "xs" })), { gap: "md" }) : null;
    return [band(x, [heading2(x, c, "left"), cols, more, c.image ? image(x, c.image, { d: cover({ aspectRatio: "21/9" }) }) : null], { bg: "default", rhythm: "normal" })];
  },
  // E-commerce : grille de produits (image, nom, texte, prix, bouton)
  products(x, c, p, pf) {
    const cols = Math.min(p.cols || pf.cols, 4);
    const cards = c.items.map((it) => stack(x, [it.image ? image(x, it.image, { d: cover({ aspectRatio: "1/1", borderRadius: "token:radius-md" }) }) : null, heading(x, it.title, 3, { d: { fontSize: "token:h4-size" } }), richText(x, it.text, { d: { color: "token:muted" } }), it.price ? heading(x, it.price, 4, { d: { color: "token:primary" } }) : null, button(x, it.cta, "outline")], { gap: "xs" }));
    return [band(x, [head(x, c), node(x, "grid", {}, { d: grid(Array(cols).fill("1fr").join(" "), { gap: "lg" }) }, cards, { hint: { cols } })], { bg: "default", rhythm: "normal" })];
  },
  // Catégories : grandes tuiles image avec titre en surimpression (même cellule de grille)
  tiles(x, c, p, pf) {
    const tiles = c.items.map((it, i) => node(x, "container", {}, { d: { display: "grid", minHeight: i === 0 && p.lead ? "420px" : "260px", borderRadius: "token:radius-md", overflow: "hidden", ...(i === 0 && p.lead ? { gridColumnSpan: 2, gridRowSpan: 2 } : {}), ...(it.image ? { backgroundImage: { src: it.image.src }, backgroundSize: "cover", backgroundPosition: "center", overlay: { color: "#0b2a4066" } } : { backgroundColor: "token:secondary" }), alignItems: "end", color: "#ffffff", paddingTop: SPACE.lg, paddingBottom: SPACE.lg, paddingLeft: SPACE.lg, paddingRight: SPACE.lg }, t: { gridColumnSpan: 1, gridRowSpan: 1 }, m: { minHeight: "200px" } }, [heading(x, it.title, 3, { d: { color: "#ffffff" } }), body(x, it, { color: "#ffffff" })]));
    return [band(x, [head(x, c), node(x, "grid", {}, { d: grid("1fr 1fr 1fr", { gap: "md" }) }, tiles, { hint: { asym: Boolean(p.lead) } })], { bg: "default", rhythm: "normal" })];
  },
  // Fiche produit : galerie à gauche, informations à droite
  detail(x, c, p, pf) {
    const gal = node(x, "gallery", { images: c.images.map((i) => ({ src: i.src, alt: i.alt || c.title || "Produit" })), columns: c.images.length > 1 ? 2 : 1, lightbox: true });
    const info = stack(x, [eyebrow(x, c), heading(x, c.title, 1, { d: { fontSize: "token:h1-size" } }), c.price ? heading(x, c.price, 3, { d: { color: "token:primary" } }) : null, richText(x, c.text), iconlist(x, c.items), btns(x, c)], { gap: "md", justify: "center" });
    return [band(x, [node(x, "grid", {}, { d: grid(frs("7:5"), { gap: "xl", align: "start" }) }, [gal, info])], { bg: "default", rhythm: "normal" })];
  },
};
module.exports = { HERO, SEC, WIDTH, SIZE };
