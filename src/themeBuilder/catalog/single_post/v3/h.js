// Aides de la bibliothèque « Article individuel » v3. Règles : un seul {{post.title}} (H1), un seul contenu d'article (postcontent), aucune donnée ni image inventée, aucun positionnement absolu,
// toute grille repasse à 1 colonne sur mobile. Les médias riches (galerie, vidéo, audio, tableau, code, carte) vivent DANS le contenu de l'article (blocs de l'éditeur d'article) : le modèle ne simule rien.
const px = (n) => `${n}px`;
const stick = (st = {}) => ({ position: "sticky", top: "32px", ...st });
const COL = (maxWidth) => ({ maxWidth, marginLeft: "auto", marginRight: "auto", width: "100%" });
const META = (a = {}) => ({ showAuthor: true, showDate: true, showCategory: true, showReading: true, ...a });
const REL = (a = {}) => ({ title: "À lire aussi", source: "posts", mode: "related", count: 3, layout: "cards", ...a });
const SHR = (label = "Partager") => ({ networks: ["facebook", "x", "linkedin"], label });
const band0 = { paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px" };
// widgets réellement posés par un modèle (les autres médias sont des blocs du contenu)
const TEMPLATE = new Set(["postcontent", "toc", "postnav", "sharebuttons", "querylist", "authorbox", "postcomments", "postmeta", "postterms", "readingprogress", "quote", "alert", "badge"]);

function context(k, c) {
  const S = k.S, has = (w) => c.widgets.includes(w), done = new Set();
  const left = /gauche/i.test(c.side) ? "left" : /droite|rail/i.test(c.side) ? "right" : "none";
  const centered = /centré/.test(c.title), mono = /monumental/.test(c.title);
  const x = {
    k, c, S, has, done, left, centered,
    align: centered ? { textAlign: "center" } : {},
    t: (size, st = {}) => { const s = Math.round(size * (mono ? 1.45 : 1)); return k.H("{{post.title}}", "1", { fontSize: px(s), lineHeight: mono ? 1.02 : 1.1, fontFamily: S.head, fontWeight: S.weight, ...(centered ? { textAlign: "center" } : {}), ...(mono ? { letterSpacing: "-1px" } : {}), ...st }, { fontSize: px(Math.round(s * 0.78)) }, { fontSize: px(Math.max(30, Math.round(s * 0.56))) }); },
    ex: (st = {}) => k.dyn("post.excerpt", { fontSize: "19px", lineHeight: 1.55, color: S.mute, ...(centered ? { textAlign: "center" } : {}), ...st }),
    body: (w = c.readW, st = {}) => k.col([k.W("postcontent", {})], { ...COL(`${w}px`), fontSize: "18px", lineHeight: 1.75, ...st }),
    meta: (a = {}, st = {}) => k.W("postmeta", META({ separator: "dot", align: centered ? "center" : "left", ...a }), st),
    img: (st = {}) => k.img("post.image", { maxHeight: "480px", ...st }),
    // image d'ouverture selon le traitement choisi par le concept
    hero: (maxH = 520) => {
      const h = c.hero, I = (st) => k.img("post.image", { maxHeight: px(maxH), ...st });
      if (h === "aucune" || h === "vidéo") return null;
      if (h === "plein écran") return k.band([I({ maxHeight: "760px", borderRadius: "0px" })], band0);
      if (h === "pleine largeur") return k.band([I({ borderRadius: "0px" })], band0);
      if (h === "panoramique") return k.band([I({ maxHeight: "340px", borderRadius: "0px" })], band0);
      if (h === "bande étroite") return k.band([I({ maxHeight: "220px", borderRadius: "0px" })], band0);
      if (h === "cadre épais") return k.col([I({ maxHeight: px(Math.min(maxH, 460)), borderRadius: "0px" })], { borderStyle: "solid", borderWidth: "10px", borderColor: S.fg, paddingTop: "14px", paddingBottom: "14px", paddingLeft: "14px", paddingRight: "14px", ...COL("820px") });
      if (h === "portrait vertical") return k.col([I({ aspectRatio: "3/4", maxHeight: "620px", borderRadius: "0px" })], { ...COL("460px") });
      if (h === "carré décalé") return k.col([I({ aspectRatio: "1/1", maxHeight: "560px", borderRadius: "0px" })], { width: "72%", marginLeft: "auto" }, null, { width: "100%" });
      if (h === "détourée") return k.col([I({ objectFit: "contain", maxHeight: "440px", borderRadius: "0px" })], { backgroundColor: S.alt, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px" });
      if (h === "mosaïque" || h === "diptyque") return k.grid(h === "diptyque" ? 2 : 3, [I({ maxHeight: "420px", borderRadius: "0px", gridColumnSpan: h === "diptyque" ? "1" : "2" }), k.card([k.dyn("post.category", { fontWeight: "700" }), k.dyn("post.date", { color: S.mute }), x.ex({ fontSize: "16px" })], { justifyContent: "flex-end", borderRadius: "0px" })], { gridTemplate: h === "diptyque" ? "3fr 2fr" : "2fr 1fr", alignItems: "stretch" });
      return I({ borderRadius: "0px" }); // « flottante habillée » et autres : image en colonne
    },
    // place un widget d'accompagnement une seule fois, seulement si le concept le prévoit
    place: (name, node) => { if (!has(name) || done.has(name)) return null; done.add(name); return node; },
    toc: (st = {}) => x.place("toc", k.W("toc", { title: "Sommaire", depth: "3", numbered: /plan|chapitre|numérot/i.test(c.features.join(" ")) }, st)),
    share: (st = {}) => x.place("sharebuttons", k.W("sharebuttons", SHR(), st)),
    author: (st = {}) => x.place("authorbox", k.W("authorbox", { showAvatar: true, heading: "" }, st)),
    nav: () => x.place("postnav", k.W("postnav", {})),
    rel: (a) => x.place("querylist", k.W("querylist", REL(a))),
    comments: () => x.place("postcomments", k.W("postcomments", {})),
    progress: () => x.place("readingprogress", k.W("readingprogress", {})),
    quote: (st = {}) => x.place("quote", k.W("quote", { text: "{{post.excerpt}}", author: "" }, { fontSize: "26px", lineHeight: 1.3, fontFamily: S.head, ...st })),
    terms: (show = "category", st = {}) => x.place("postterms", k.W("postterms", { show, look: "text" }, st)),
    alert: (title, text, tone = "info") => x.place("alert", k.W("alert", { tone, title, text })),
    // VARIANTES STRUCTURELLES du concept (choisies une fois pour toutes par scripts/assigner-variantes-article.js pour garantir des arbres réellement différents) :
    // hv = ouverture (0 pile, 1 bandeau de fond, 2 titre | résumé, 3 filet puis titre), tv = fin d'article (0 pile, 1 deux colonnes, 2 bandeau), bv = corps (0 seul, 1 date en marge, 2 mise à jour en pied)
    hv: (c.v || [0, 0, 0])[0], tv: (c.v || [0, 0, 0])[1], bv: (c.v || [0, 0, 0])[2],
  };
  const nn = (a) => a.filter(Boolean);
  x.head = (size, o = {}) => {
    const terms = o.terms === false ? null : x.terms(), meta = o.meta === false ? null : x.meta();
    if (x.hv === 1) return k.band([k.inner([k.col(nn([terms, x.t(size), o.ex ? x.ex() : null, meta]), { gap: "16px", maxWidth: "900px", ...(centered ? { marginLeft: "auto", marginRight: "auto" } : {}) })])], { backgroundColor: S.alt });
    if (x.hv === 2) return k.grid(2, [x.t(size), k.col(nn([terms, x.ex({ fontSize: "17px" }), meta]), { gap: "14px" })], { gridTemplate: "3fr 2fr", alignItems: "end" });
    if (x.hv === 3) return k.col(nn([meta, k.divider({ borderTopWidth: S.bw === "0px" ? "1px" : S.bw, borderColor: S.fg }), terms, x.t(size), o.ex ? x.ex() : null]), { gap: "14px" });
    return k.col(nn([terms, x.t(size), o.ex ? x.ex() : null, meta]), { gap: "16px" });
  };
  const bodyBase = x.body;
  x.body = (w = c.readW, st = {}) => {
    const b = bodyBase(w, st);
    if (x.bv === 1) return k.grid(2, [k.col([k.dyn("post.date", { fontSize: "13px", color: S.mute }), k.dyn("post.category", { fontSize: "13px", fontWeight: "700" })], { gap: "6px", ...stick() }, null, { position: "static" }), b], { gridTemplate: "1fr 5fr", alignItems: "start" });
    if (x.bv === 2) return k.col([b, k.divider({ borderColor: S.line }), k.dyn("post.modified", { fontSize: "14px", color: S.mute })], { gap: "20px" });
    return b;
  };
  x.tail = () => {
    const items = nn([x.share(), x.author(), x.nav()]), more = nn([x.rel(), x.comments()]);
    if (x.tv === 1 && items.length > 1) return [k.grid(2, [k.col(nn([items[0]]), { gap: "20px" }), k.col(items.slice(1), { gap: "20px" })], { gridTemplate: "1fr 1fr", alignItems: "start" }), ...more];
    if (x.tv === 2 && items.length) return [k.band([k.inner([k.col(items, { gap: "20px", width: "100%" })])], { backgroundColor: S.alt }), ...more];
    return [...items, ...more];
  };
  return x;
}
module.exports = { px, COL, META, REL, SHR, band0, TEMPLATE, context };
