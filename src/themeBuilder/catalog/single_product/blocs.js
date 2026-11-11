// Briques communes des modèles « Fiche produit » : chacune fabrique des éléments natifs ou des widgets boutique, jamais de donnée inventée.
// Les textes de réassurance, de livraison, de retour, d'entretien… sont des CONSIGNES ÉDITABLES (« Indiquez ici… ») ; les chiffres, prix, avis et stocks viennent des étiquettes {{product.*}} et des widgets.
// Les couleurs des boutons, prix et choix des widgets boutique sont posées par les PARTIES du widget (node.parts) : le modèle garde son identité, quelle que soit la charte du site.
const st = (desktop) => ({ styles: { desktop } });
const part = (desktop) => ({ styles: { desktop } });
const pick = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

// Parties colorées d'un widget boutique, d'après l'identité du modèle
function partsOf(S, type) {
  const solid = S.btn === "solid", cap = S.caps === "none" ? undefined : S.caps;
  const main = solid ? { backgroundColor: S.accent, color: S.onAccent } : { backgroundColor: S.bg, color: S.accent };
  const alt = solid ? { backgroundColor: S.alt, color: S.fg } : { backgroundColor: S.accent, color: S.onAccent };
  const field = { backgroundColor: S.bg, color: S.fg };
  switch (type) {
    case "shopbuy": return {
      button: part(pick({ ...main, borderRadius: S.btnRadius, textTransform: cap, letterSpacing: cap ? S.track : undefined })),
      now: part(pick({ ...alt, borderRadius: S.btnRadius, textTransform: cap })),
      choice: part({ backgroundColor: S.alt, color: S.fg, borderRadius: S.btnRadius }),
      variant: part({ ...field, borderRadius: S.btnRadius }),
      qty: part({ ...field, borderRadius: S.btnRadius }),
      price: part({ color: S.accent }), old: part({ color: S.mute }), label: part({ color: S.mute }), stock: part({ color: S.mute }), message: part({ color: S.fg }),
    };
    case "shopgrid": return {
      card: part({ backgroundColor: S.alt, color: S.fg, borderRadius: S.radius }),
      name: part({ color: S.fg }), price: part({ color: S.accent }), old: part({ color: S.mute }), category: part({ color: S.mute }),
      cart: part(pick({ ...main, borderRadius: S.btnRadius })), badge: part({ backgroundColor: S.accent, color: S.onAccent }),
    };
    case "shopgallery": return { thumb: part({ backgroundColor: S.alt, borderRadius: S.radius }), badge: part({ backgroundColor: S.accent, color: S.onAccent }), nav: part({ backgroundColor: S.accent, color: S.onAccent }) };
    case "shopreviews": return { title: part({ color: S.fg }), summary: part({ color: S.fg }), item: part({ backgroundColor: S.alt, color: S.fg, borderRadius: S.radius }), stars: part({ color: S.accent }), meta: part({ color: S.mute }) };
    case "shopspecs": return { title: part({ color: S.fg }), row: part({ backgroundColor: S.alt, color: S.fg }), label: part({ color: S.mute }), value: part({ color: S.fg }) };
    default: return null;
  }
}
const SHOP = new Set(["shopbuy", "shopgrid", "shopgallery", "shopreviews", "shopspecs"]);
// widget boutique avec ses parties colorées (les parties demandées par le modèle l'emportent)
const shop = (k, type, props, styles = {}, extra = {}) => {
  const w = k.W(type, props, { color: k.S.fg, fontFamily: k.S.font, ...styles });
  if (SHOP.has(type)) w.parts = { ...partsOf(k.S, type), ...(extra.parts || {}) };
  return w;
};

// ---- Étiquettes réelles ----
const crumb = (k, s = {}) => k.W("breadcrumb", { items: [{ label: "Accueil", url: "/" }, { label: "Boutique", url: "/boutique" }, { label: "Ce produit" }], separator: "chevron" }, { color: k.S.mute, fontSize: "14px", ...s });
const title = (k, s = {}, t, m) => k.H("{{product.title}}", "1", s, t, m);
const price = (k, s = {}) => k.row([k.T("<p>{{product.price}}</p>", { fontSize: "28px", fontWeight: "700", color: k.S.accent, margin: "0px", fontFamily: k.S.head }), k.T("<p>{{product.regular_price}}</p>", { fontSize: "18px", color: k.S.mute, textDecoration: "line-through", margin: "0px" })], { gap: "14px", ...s });
const shortD = (k, s = {}) => k.T("<p>{{product.short_description}}</p>", { fontSize: "17px", ...s });
const longD = (k, s = {}) => k.T("<p>{{product.description}}</p>", s);
const meta = (k, s = {}) => k.row([k.T("<p>Référence : {{product.sku}}</p>", { fontSize: "14px", color: k.S.mute, margin: "0px" }), k.T("<p>{{product.availability}}</p>", { fontSize: "14px", color: k.S.mute, margin: "0px" }), k.T("<p>{{product.category}}</p>", { fontSize: "14px", color: k.S.mute, margin: "0px" })], { gap: "18px", ...s });
const metaCol = (k, s = {}) => k.col([k.T("<p>Référence : {{product.sku}}</p>", { fontSize: "14px", color: k.S.mute, margin: "0px" }), k.T("<p>Disponibilité : {{product.availability}}</p>", { fontSize: "14px", color: k.S.mute, margin: "0px" }), k.T("<p>Catégorie : {{product.category}}</p>", { fontSize: "14px", color: k.S.mute, margin: "0px" })], { gap: "4px", ...s });
const eyebrow = (k, s = {}) => k.L("{{product.category}}", s);
const catBadge = (k) => ({ type: "badge", props: { text: "{{product.category}}", tone: "neutral" } });
const skuBadge = (k) => ({ type: "badge", props: { text: "Réf. {{product.sku}}", tone: "neutral" } });

const ICONS = [{ text: "Paiement à la commande, selon les moyens activés par la boutique", icon: "check" }, { text: "Livraison ou retrait : précisez ici vos conditions", icon: "check" }, { text: "Une question avant d'acheter ? Contactez-nous", icon: "check" }];
const trust = (k, s = {}, inline = false) => k.W("iconlist", { items: ICONS, iconColor: k.S.accent, ...(inline ? { inline: true } : {}) }, { color: k.S.fg, ...s });
const contactLine = (k, s = {}) => k.row([k.T("<p>Une question avant d'acheter ?</p>", { margin: "0px", color: k.S.mute, fontSize: "14px" }), k.LINK("Contactez-nous", "/contact", { color: k.S.accent })], { gap: "8px", ...s });

// ---- Galerie ----
const GAL = { V: "thumbs-left", H: "thumbs-bottom", S: "stack", G: "grid", M: "mosaic", C: "carousel", Z: "single", F: "hero", T: "stack", N: "single" };
const RATIO = { V: "4:5", H: "1:1", S: "3:4", G: "1:1", M: "auto", C: "16:9", Z: "1:1", F: "16:9", T: "3:4", N: "1:1" };
const gallery = (k, c, sp = {}) => {
  const code = c.gal;
  const styles = code === "N" ? { maxWidth: "320px", width: "100%" } : {};
  return shop(k, "shopgallery", { layout: GAL[code], zoom: sp.zoom !== undefined ? sp.zoom : (code === "Z" || code === "V" || code === "G"), ratio: sp.ratio || RATIO[code], showBadge: sp.badge !== undefined ? sp.badge : code !== "N" }, styles);
};

// ---- Achat ----
const buyProps = (c, sp = {}, over = {}) => ({ label: sp.label || "Ajouter au panier", showQuantity: true, showPrice: true, showStock: true, variantStyle: sp.var || "select", showBuyNow: false, buyNowLabel: "Acheter maintenant", ...over });
const buy = (k, c, sp = {}, over = {}, styles = {}) => shop(k, "shopbuy", buyProps(c, sp, over), styles);

// ---- Briques de signature (sous la fiche) ----
const blank = (t) => `Indiquez ici ${t}.`;
const secHead = (k, text, s = {}) => k.H(text, "2", { fontSize: "26px", ...s });
const SIG = {
  // tableau de repères (tailles, dimensions, compatibilité…) à compléter
  table: (k, sp) => k.card([secHead(k, sp.note[0], { fontSize: "22px" }), { type: "table", props: { header: true, striped: true, caption: "", rows: [["Repère", "À renseigner"], [sp.note[0], sp.note[1]], ["Conseil", blank("votre conseil")], ["Contact", "Une question ? Écrivez-nous depuis la page Contact."]] }, ...st({ color: k.S.fg, width: "100%" }) }]),
  care: (k, sp) => k.card([k.L(sp.note[0]), { type: "list", props: { items: [sp.note[1], blank("les précautions"), blank("la durée ou la garantie")], ordered: false }, ...st({ color: k.S.fg }) }]),
  steps: (k, sp) => k.col([secHead(k, sp.note[0]), { type: "timeline", props: { items: [{ date: "Étape 1", title: sp.note[0], text: sp.note[1] }, { date: "Étape 2", title: "Précisez la suite", text: blank("la deuxième étape") }, { date: "Étape 3", title: "Terminez", text: blank("la dernière étape") }] }, ...st({ color: k.S.fg }) }]),
  faq: (k, sp) => k.W("accordion", { items: [{ q: sp.note[0], a: sp.note[1] }, { q: "Livraison et retours", a: "Indiquez ici vos délais, zones de livraison et conditions de retour." }, { q: "Une question ?", a: "Écrivez-nous depuis la page Contact, nous vous répondrons." }], openFirst: false, icon: "plus" }, { color: k.S.fg }),
  rev: (k) => shop(k, "shopreviews", { title: "Avis clients", count: 3, showSummary: true }),
  specs: (k) => shop(k, "shopspecs", { title: "Caractéristiques", showSku: true, showCategories: true, showTags: false, showWeight: true, showDimensions: true, showStock: true, showAttributes: true }),
  ship: (k, sp) => ({ type: "alert", props: { tone: "info", title: sp.note[0], text: sp.note[1], dismissible: false }, ...st({ color: k.S.fg }) }),
  warn: (k, sp) => ({ type: "alert", props: { tone: "warning", title: sp.note[0], text: sp.note[1], dismissible: false }, ...st({ color: k.S.fg }) }),
  benefits: (k, sp) => k.grid(3, [k.card([k.L("Atout 1"), k.T(`<p>${sp.note[1]}</p>`)]), k.card([k.L("Atout 2"), k.T(`<p>${blank("un deuxième atout")}</p>`)]), k.card([k.L("Atout 3"), k.T(`<p>${blank("un troisième atout")}</p>`)])]),
  quote: (k, sp) => ({ type: "quote", props: { text: sp.note[1], author: "" }, ...st({ color: k.S.fg }) }),
  story: (k) => k.col([k.L("En bref"), k.T("<p>{{product.short_description}}</p>", { fontSize: "22px", lineHeight: 1.5 })], { borderLeftWidth: "3px", borderStyle: "solid", borderColor: k.S.accent, paddingLeft: "18px", gap: "6px" }),
  iconrow: (k) => trust(k, {}, true),
  list: (k, sp) => k.col([k.L(sp.note[0]), { type: "list", props: { items: [sp.note[1], blank("un deuxième point"), blank("un troisième point")], ordered: true }, ...st({ color: k.S.fg }) }]),
  tabs: (k, sp) => k.W("tabs", { items: [{ title: sp.note[0], text: sp.note[1] }, { title: "À savoir", text: blank("les informations utiles") }] }, { color: k.S.fg }),
  cta: (k, sp) => k.card([k.H(sp.note[0], "3"), k.T(`<p>${sp.note[1]}</p>`), k.row([k.B("Nous contacter", "/contact"), k.LINK("Voir la boutique", "/boutique", { color: k.S.accent })])]),
  badges: (k) => k.row([catBadge(k), skuBadge(k), { type: "badge", props: { text: "{{product.availability}}", tone: "neutral" } }], { gap: "10px" }),
  cfg: (k) => ({ type: "alert", props: { tone: "info", title: "Personnalisation", text: "Personnalisation : ajoutez le texte dans le champ de la fiche d'achat.", dismissible: false }, ...st({ color: k.S.fg }) }),
};
// related:N = produits liés (réels) en N colonnes
const related = (k, cols = 3, head = "Vous aimerez aussi") => k.col([k.H(head, "2", { fontSize: "26px" }), shop(k, "shopgrid", { source: "related", count: cols, columns: String(cols), orderby: "newest", showPrice: true, showImage: true })]);

module.exports = { shop, partsOf, crumb, title, price, shortD, longD, meta, metaCol, eyebrow, catBadge, skuBadge, trust, contactLine, gallery, buy, buyProps, SIG, related, secHead, blank, st, GAL };
