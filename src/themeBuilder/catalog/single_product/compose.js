// Compositeur des modèles « Fiche produit » : (concept à 4 axes + réglages propres au modèle) → arbre d'éléments.
// Axes : galerie (gal) · bloc d'informations (inf) · contenu (cont) · achat (ach). Chaque modèle ajoute son ordre d'informations (info), ses briques de signature (sig), ses textes de consigne (sec, note).
const B = require("./blocs");
const MAXW = { maxWidth: "1180px", width: "100%", marginLeft: "auto", marginRight: "auto" };
const wrap = (k, ch, s = {}) => k.section([k.col(ch, { ...MAXW, gap: k.S.gap, ...s })]);
// grille à deux zones : se replie en une colonne sous la tablette
const two = (a, b, tpl, s = {}) => ({ type: "grid", children: [a, b], styles: { desktop: { display: "grid", columns: 2, ...(tpl ? { gridTemplate: tpl } : {}), gap: "40px", alignItems: "start", ...s }, tablet: { columns: 1, gridTemplate: "1fr" }, mobile: { columns: 1, gridTemplate: "1fr" } } });
const sticky = (k, ch, s = {}) => k.col(ch, { position: "sticky", top: "24px", gap: "16px", ...s }, undefined, { position: "static" });

// Une brique de la colonne d'informations, par code
function atom(k, c, sp, code, ctx) {
  switch (code) {
    case "c": return B.crumb(k);
    case "e": return B.eyebrow(k);
    case "g": return B.catBadge(k);
    case "u": return B.skuBadge(k);
    case "t": return B.title(k, sp.ttl ? { fontSize: sp.ttl } : {});
    case "T": return B.title(k, { fontSize: "48px", lineHeight: 1.05 }, { fontSize: "34px" });
    case "p": return B.price(k);
    case "q": return B.shortD(k);
    case "l": return B.longD(k);
    case "b": return ctx.buyArea;
    case "m": return B.meta(k);
    case "M": return B.metaCol(k);
    case "r": return B.trust(k);
    case "R": return B.trust(k, {}, true);
    case "d": return k.divider();
    case "n": return B.contactLine(k);
    case "y": return k.card([k.L(sp.note[0]), k.T(`<p>${sp.note[1]}</p>`, { margin: "0px" })]);
    case "j": return B.SIG.specs(k);
    case "s": return k.spacer("8");
    default: return null;
  }
}
const DEFAULT_INFO = "c t p q b m";

// Zone d'achat selon l'axe « ach »
function buyArea(k, c, sp) {
  switch (c.ach) {
    case "CARD": return k.card([k.L("Acheter"), B.buy(k, c, sp, { showBuyNow: true })], { borderColor: k.S.accent, borderStyle: "solid", borderWidth: "2px" });
    case "CFG": return k.card([B.SIG.cfg(k), B.buy(k, c, sp, { showBuyNow: false })], { gap: "14px" });
    case "BAR": return null; // l'achat est dans la barre collée en bas
    case "DRAW": return null; // l'achat est dans le panneau latéral
    default: return B.buy(k, c, sp, { showBuyNow: false }); // IN et STK
  }
}

// Contenu selon l'axe « cont »
function content(k, c, sp) {
  const desc = "{{product.description}}", ship = "Indiquez ici vos délais, zones de livraison et conditions de retour.";
  switch (c.cont) {
    case "TAB": return k.W("tabs", { items: [{ title: "Description", text: desc }, { title: sp.sec[0], text: sp.sec[1] }, { title: "Livraison et retours", text: ship }] }, { color: k.S.fg });
    case "ACC": return k.W("accordion", { items: [{ q: "Description", a: desc }, { q: sp.sec[0], a: sp.sec[1] }, { q: "Livraison et retours", a: ship }, { q: "Une question ?", a: "Écrivez-nous depuis la page Contact, nous vous répondrons." }], openFirst: true, icon: "chevron" }, { color: k.S.fg });
    case "SEC": {
      const sec = (anchor, head, body) => ({ ...k.col([k.H(head, "2", { fontSize: "24px" }), body], { gap: "10px", scrollMarginTop: "72px" }), anchor });
      const nav = k.row([k.LINK("Description", "#description", { color: k.S.accent }), k.LINK(sp.sec[0], "#details", { color: k.S.accent }), k.LINK("Livraison", "#livraison", { color: k.S.accent })], { gap: "22px", position: "sticky", top: "0px", backgroundColor: k.S.bg, paddingTop: "10px", paddingBottom: "10px", borderBottomWidth: "1px", borderStyle: "solid", borderColor: k.S.line, zIndex: 5 });
      return k.col([nav, sec("description", "Description", B.longD(k)), sec("details", sp.sec[0], k.T(`<p>${sp.sec[1]}</p>`)), sec("livraison", "Livraison et retours", k.T(`<p>${ship}</p>`))], { gap: "28px" });
    }
    case "EDI": return k.col([k.L(sp.sec[0], { textAlign: "center" }), k.H("{{product.title}}", "2", { textAlign: "center", fontSize: "34px" }), B.longD(k, { fontSize: "19px", lineHeight: 1.8 }), k.divider(), k.T(`<p>${sp.sec[1]}</p>`, { fontStyle: "italic", color: k.S.mute })], { maxWidth: "680px", width: "100%", marginLeft: "auto", marginRight: "auto", gap: "22px" });
    case "SPEC": return k.col([k.H("Caractéristiques", "2", { fontSize: "26px" }), B.SIG.specs(k), k.card([k.L(sp.sec[0]), k.T(`<p>${sp.sec[1]}</p>`, { margin: "0px" })]), B.longD(k)], { gap: "20px" });
    default: return k.col([k.H("Description", "2", { fontSize: "24px" }), B.longD(k)], { gap: "10px" }); // FLAT
  }
}

// Panneau d'achat latéral collant (tiroir) ou barre collée en bas
const drawer = (k, c, sp) => sticky(k, [k.card([k.L("Votre achat"), B.price(k), B.buy(k, c, sp, { showBuyNow: true }), B.trust(k)], { boxShadow: "md", gap: "14px" })]);
const bar = (k, c, sp) => k.band([k.inner([k.col([k.L("{{product.category}}"), k.T("<p>{{product.price}}</p>", { fontWeight: "700", margin: "0px", fontSize: "20px" })], { gap: "0px" }), B.buy(k, c, sp, { showBuyNow: true, showQuantity: true }, { maxWidth: "620px" })])], { position: "sticky", bottom: "0px", zIndex: 30, borderTopWidth: "1px", borderBottomWidth: "0px", paddingTop: "10px", paddingBottom: "10px" });

function compose(k, c, sp) {
  const ctx = { buyArea: buyArea(k, c, sp) };
  const codes = (sp.info || DEFAULT_INFO).split(/\s+/).filter(Boolean);
  const isB = c.inf === "B", isF = c.gal === "F";
  const infoNodes = (omit = "") => codes.filter((x) => !omit.includes(x)).map((x) => atom(k, c, sp, x, ctx)).filter(Boolean);
  const infoCol = (omit = "", s = {}) => k.col(infoNodes(omit), { gap: "16px", ...(c.ach === "STK" ? { position: "sticky", top: "24px" } : {}), ...s }, undefined, c.ach === "STK" ? { position: "static" } : undefined);
  const gx = (sp.gx || "").split("").map((x) => (x === "n" ? k.T(`<p>${sp.sec[0]} : ${B.blank("les détails")}</p>`, { fontSize: "13px", color: k.S.mute, margin: "0px" }) : x === "u" ? B.skuBadge(k) : x === "g" ? B.catBadge(k) : null)).filter(Boolean);
  const gal = () => (gx.length ? k.col([B.gallery(k, c, sp), ...gx], { gap: "10px" }) : B.gallery(k, c, sp));
  const cont = content(k, c, sp);
  const sig = (sp.sig || []).map((s) => { const [n, a] = s.split(":"); return n === "rel" ? B.related(k, Number(a) || 3, sp.relHead) : B.SIG[n](k, sp); });
  const out = [];
  if (isF) out.push(k.band([gal()], { padding: "0px", paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px", gap: "0px" }));
  let main;
  if (isB) {
    // bandeau de titre : fil d'Ariane, titre, prix, puis le reste
    out.push(k.band([k.inner([k.col([B.crumb(k), B.title(k, sp.ttl ? { fontSize: sp.ttl } : {})], { gap: "8px" }), B.price(k)], { alignItems: "flex-end" })], { backgroundColor: k.S.alt }));
    const rest = infoCol("ctpe");
    main = isF ? k.col([rest], { maxWidth: "720px", width: "100%", marginLeft: "auto", marginRight: "auto" }) : two(gal(), rest);
  } else if (c.inf === "K") {
    const left = k.col([c.gal === "T" ? sticky(k, [gal()]) : gal(), cont], { gap: "28px" });
    main = two(left, c.gal === "T" ? infoCol() : sticky(k, infoNodes()), sp.tpl || "3fr 2fr");
  } else if (c.inf === "Ctr") {
    const centered = { alignItems: "center", textAlign: "center" };
    main = k.col([isF ? null : k.col([gal()], { maxWidth: c.gal === "N" ? "340px" : "620px", width: "100%", marginLeft: "auto", marginRight: "auto" }), k.col(infoNodes(), { gap: "16px", ...centered, maxWidth: "640px", width: "100%", marginLeft: "auto", marginRight: "auto" })].filter(Boolean), { gap: "28px" });
  } else if (c.inf === "C3") {
    main = k.grid(3, [k.col([k.H("À propos", "2", { fontSize: "22px" }), B.shortD(k), ...(sp.sum ? [B.longD(k)] : [])], { gap: "12px" }), gal(), infoCol("q")], { alignItems: "start", gridTemplate: sp.tpl || "1fr 1.2fr 1fr" });
  } else if (c.inf === "O") {
    const over = k.card(infoNodes(), { marginTop: "-110px", position: "relative", zIndex: 2, maxWidth: "560px", width: "100%", marginLeft: "auto", marginRight: "auto", boxShadow: "lg", backgroundColor: k.S.bg }, undefined, { marginTop: "0px" });
    main = k.col(isF ? [over] : [gal(), over], { gap: "0px" });
  } else if (c.inf === "L") {
    main = two(infoCol(), c.gal === "T" ? sticky(k, [gal()]) : gal(), sp.tpl);
  } else {
    // R : galerie à gauche, informations à droite
    const g = c.gal === "T" ? sticky(k, [gal()]) : gal();
    main = c.gal === "N" ? two(g, infoCol(), "1fr 2fr") : two(g, infoCol(), sp.tpl);
  }
  const body = [main];
  if (c.inf !== "K") body.push(cont);
  body.push(...sig);
  // panneau d'achat latéral (tiroir)
  const page = c.ach === "DRAW" ? [two(k.col(body, { gap: k.S.gap }), drawer(k, c, sp), "2fr 1fr")] : body;
  out.push(wrap(k, page));
  if (c.ach === "BAR") out.push(bar(k, c, sp));
  return out;
}
module.exports = { compose, wrap, two, sticky };
