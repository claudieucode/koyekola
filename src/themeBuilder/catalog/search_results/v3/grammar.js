// Grammaire des pages de résultats : une page = TITRE (head) + OUTILS (nombre, tri, catégories, à un endroit choisi) + RÉSULTATS (body) + COLONNE (aside) + FIN DE PAGE (tail).
// specs.js (généré par scripts/choisir-structures-recherche.js) ne retient que les 100 combinaisons les plus différentes entre elles (similarité de structure mesurée sur l'arbre réel) ; chaque univers en reçoit 5.
const H = require("./h");
const { wrap, info, box, results, count, sort, cats, popular, heading, refine, card, split, side, main, bandOf, mute } = H;
const HEADS = ["Titre et champ", "Titre à gauche, champ à droite", "Bandeau de recherche", "Panneau de recherche", "Titre centré", "Barre compacte"];
const BODIES = ["liste", "grille de deux colonnes", "grille de trois colonnes", "grille de quatre colonnes", "premier résultat en grand", "grille asymétrique", "grandes photographies", "index compact", "tableau", "éditorial centré", "titres en trois colonnes", "petites vignettes", "sections par type"];
const ASIDES = ["", "colonne à droite", "filtres à gauche"], TAILS = ["", "nouvelle recherche en fin de page", "lectures conseillées", "nouvelle recherche et lectures"], POS = ["", "outils au-dessus des résultats", "outils dans la colonne", "outils dans le bandeau"];
const wide = (b) => [3, 6, 2].includes(b);
function tools(k, u, set) { const s = set || []; return [...(s.includes("count") ? [count(k, u.kind)] : []), ...(s.includes("sort") ? [sort(k, { prix: u.kind === "products" || u.kind === "courses", layout: "pills" })] : []), ...(s.includes("cats") && u.kind !== "products" ? [cats(k, u.kind === "courses" ? "courses" : "posts")] : [])]; }
function head(k, u, h, inBand) {
  const ph = u.ph, t = (z) => info(k, { size: z, count: u.kind === "posts" });
  if (h === 0) return { kids: [t(36), box(k, { placeholder: ph })] };
  if (h === 1) return { kids: [k.row([t(32), box(k, { max: "420px", placeholder: ph })], { justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" })] };
  if (h === 2) return { band: (extra) => bandOf(k, [t(38), box(k, { max: "100%", placeholder: ph, st: { fontSize: "19px" } }), ...(u.hint ? [mute(k, `<p>${u.hint}</p>`)] : []), ...extra], { paddingTop: "56px", paddingBottom: "48px", backgroundColor: k.S.alt }) };
  if (h === 3) return { kids: [card(k, [t(28), box(k, { max: "100%", placeholder: ph })])] };
  if (h === 4) return { kids: [k.col([t(46, {}), k.divider(), box(k, { max: "540px", placeholder: ph })], { alignItems: "center", gap: "16px" })], centered: true };
  return { kids: [k.row([t(26), box(k, { max: "340px", placeholder: ph })], { alignItems: "center", flexWrap: "wrap", gap: "20px" })] };
}
function body(k, u, b, wideOk, o = {}) {
  const cols = (n) => (wideOk ? n : Math.min(n, 2)), R = (c, style, x = {}) => results(k, u.kind, c, style, { ...(u.opts || {}), ...x });
  switch (b) {
    case 0: return [R(1, "ligne", { grid: { gap: "0px" } })];
    case 1: return [R(2, "carte", { h: "200px" })];
    case 2: return [R(cols(3), "carte")];
    case 3: return [R(cols(4), "carte", { h: "130px", size: "16px", excerpt: false })];
    case 4: return [R(1, "grand", { count: 1, paginate: false }), R(2, "texte", { offset: 1, count: 8, size: "19px" })];
    case 5: return [split(k, main(k, [R(1, "grand", { count: 1, paginate: false })], { flexGrow: 2 }), side(k, [R(1, "texte", { offset: 1, count: 3, paginate: false, size: "18px", excerpt: false })], { flexBasis: "340px" })), R(cols(3), "carte", { offset: 4, count: 6, h: "150px" })];
    case 6: return [R(2, "photo", { h: "320px", size: "22px" })];
    case 7: return [R(1, "index", { count: 20, grid: { gap: "0px" } })];
    case 8: return [k.grid(3, [mute(k, "<p>Titre</p>", { fontWeight: "700" }), mute(k, `<p>${u.kind === "posts" ? "Rubrique" : u.kind === "pages" ? "Page" : "Détail"}</p>`, { fontWeight: "700" }), mute(k, `<p>${u.kind === "posts" ? "Date" : u.kind === "pages" ? "Accès" : "Prix"}</p>`, { fontWeight: "700" })], { gridTemplate: "3fr 1fr 1fr", paddingLeft: k.S.pad, paddingRight: k.S.pad }), R(1, "tableau", { count: 12, grid: { gap: "0px" } })];
    case 9: return [R(1, "texte", { size: "28px", count: 6, grid: { gap: "8px" }, cardSt: { textAlign: "center", alignItems: "center" } })];
    case 10: return [R(cols(3), "texte", { count: 9, size: "19px" })];
    case 11: return [R(1, "ligne", { w: "110px", h: "80px", size: "18px", excerpt: false, grid: { gap: "0px" }, count: 12 })];
    default: return [heading(k, u.labels[u.kind] || "Résultats"), R(2, "texte", { count: 4, paginate: false })];
  }
}
const more = (k, u) => (u.sources || []).filter((s) => s !== u.kind).flatMap((s) => [heading(k, u.labels[s] || "Autres résultats"), results(k, s, 1, "index", { count: 4, paginate: false, empty: "Aucun résultat dans cette rubrique pour « {{query.q}} »." })]);
const tail = (k, u, t) => (t === 1 ? [refine(k)] : t === 2 ? [popular(k, "À lire aussi", { mode: "recent", layout: "cards", count: 3 })] : t === 3 ? [refine(k), popular(k, "À lire aussi", { mode: "recent", layout: "cards", count: 3 })] : []);
// Assemble une page selon une spec { head, pos, set, body, aside, tail, more }
function assemble(k, u, s0) {
  // La grille asymétrique ne tient pas à côté d'une colonne (profondeur et largeur) : elle devient « premier résultat en grand »
  const s = s0.aside && s0.body === 5 ? { ...s0, body: 4 } : s0;
  const hd = head(k, u, s.head), t = tools(k, u, s.set), centered = Boolean(hd.centered);
  const toolRow = t.length ? [k.row(t, { gap: "16px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" })] : [];
  const asideKids = s.aside ? [...(s.pos === 2 && t.length ? [card(k, [mute(k, "<p>Filtrer</p>", { fontWeight: "700" }), ...t])] : []), ...(u.aside ? u.aside(k) : [refine(k)])] : [];
  const above = s.pos === 1 || (s.pos === 2 && !s.aside) ? toolRow : [];
  const results_ = [...above, ...body(k, u, s.body, wide(s.body) && !s.aside), ...(s.more ? more(k, u) : []), ...tail(k, u, s.tail)];
  if (s.head === 2) {
    const band = hd.band(s.pos === 3 ? toolRow : []);
    return [band, wrap(k, s.aside ? [split(k, ...(s.aside === 2 ? [side(k, asideKids), main(k, results_)] : [main(k, results_), side(k, asideKids)]))] : results_, { paddingTop: "32px", ...(centered ? { maxWidth: "960px" } : {}) })];
  }
  const top = [...hd.kids, ...(s.pos === 3 ? toolRow : [])];
  const inner = s.aside ? [split(k, ...(s.aside === 2 ? [side(k, asideKids), main(k, results_)] : [main(k, results_), side(k, asideKids)]))] : results_;
  return [wrap(k, [...top, ...inner], centered ? { maxWidth: "900px" } : {})];
}
module.exports = { assemble, HEADS, BODIES, ASIDES, TAILS, POS };
