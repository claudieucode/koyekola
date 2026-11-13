// Catalogues des pages COMMERCE du Theme Builder : Panier, Validation de commande, Commande reçue, Compte client. 20 compositions × 5 identités = 100 modèles par type.
// Chaque modèle contient l'élément « page de boutique » correspondant (shopcartpage, shopcheckoutpage, shoporderpage, shopaccountpage) : il affiche la VRAIE page (formulaires, totaux, routes, contrôles serveur
// identiques à la page par défaut) ; la composition ajoute seulement titre, mise en page, consignes éditables et, selon le cas, de vrais produits mis en avant. Aucune donnée fictive, aucun faux avis ni compte à rebours.
// « Utiliser ce modèle » crée une copie indépendante dans le site (Page Builder + modèle Theme Builder en brouillon). Documentation : docs/boutique/THEME_BUILDER_COMMERCE.md.
const WIDGET = { cart: "shopcartpage", checkout: "shopcheckoutpage", order_received: "shoporderpage", my_account: "shopaccountpage" };
const TITLE = { cart: "Votre panier", checkout: "Finaliser votre commande", order_received: "Merci pour votre commande", my_account: "Mon compte" };
const LABEL = { cart: "Contenu du panier", checkout: "Formulaire de commande", order_received: "Confirmation de commande", my_account: "Espace client" };
const KIND_TAG = { cart: "panier", checkout: "commande", order_received: "confirmation", my_account: "compte" };
// Consignes de réassurance : textes ÉDITABLES (« Indiquez ici… »), jamais des promesses inventées
const HELP = {
  cart: [["Livraison", "Indiquez ici vos délais et vos frais de livraison."], ["Retours", "Indiquez ici votre politique de retour et d'échange."], ["Paiement", "Indiquez ici les moyens de paiement que vous acceptez."]],
  checkout: [["Paiement sécurisé", "Indiquez ici comment vos clients sont protégés lors du paiement."], ["Livraison", "Indiquez ici vos délais de livraison."], ["Besoin d'aide ?", "Indiquez ici comment vous joindre avant de commander."]],
  order_received: [["Et maintenant ?", "Indiquez ici ce qui se passe après la commande : préparation, expédition, suivi."], ["Une question ?", "Indiquez ici comment vous joindre pour suivre une commande."], ["Retours", "Indiquez ici votre politique de retour."]],
  my_account: [["Vos commandes", "Retrouvez ici l'historique et le suivi de vos achats."], ["Vos données", "Indiquez ici comment vous gérez les données personnelles."], ["Besoin d'aide ?", "Indiquez ici comment vous contacter."]],
};

const blocks = (k, type) => {
  const W = (w = "1100px") => ({ maxWidth: w, width: "100%", marginLeft: "auto", marginRight: "auto" });
  const title = (align) => k.H(TITLE[type], "1", { fontSize: "34px", ...(align ? { textAlign: align } : {}) });
  const page = () => k.W(WIDGET[type], { note: LABEL[type] }, { color: k.S.fg, width: "100%" });
  const sec = (ch, w = "1100px", st = {}) => k.section([k.col(ch, { ...W(w), gap: k.S.gap })], { paddingTop: "40px", paddingBottom: "40px", ...st });
  const infos = () => k.row(HELP[type].map(([t, d]) => k.card([k.L(t), k.T(`<p>${d}</p>`, { fontSize: "15px" })], { flexBasis: "260px", flexGrow: 1 })), { alignItems: "stretch", gap: k.S.gap, flexWrap: "wrap" });
  const help = () => k.card([k.L("Une question ?"), k.T("<p>Écrivez-nous, nous vous répondons.</p>", { fontSize: "15px" }), k.B("Nous contacter", "/contact", "outline")]);
  const featured = () => k.col([k.H("Vous aimerez aussi", "2", { fontSize: "24px" }), k.W("shopgrid", { source: "featured", count: 4, columns: "4", orderby: "featured", showPrice: true, showImage: true, layout: "grid", ratio: "1/1", cardStyle: "boxed", showBadge: false, showCategory: false, showDescription: false, showCart: false, paginate: false, empty: "" }, { color: k.S.fg })]);
  const back = () => k.row([k.LINK("← Continuer mes achats", "/boutique", { fontSize: "14px" })], { gap: "8px" }); // checkout : retour discret, sans rangée de produits qui détournerait du paiement
  return { W, title, page, sec, infos, help, featured, back };
};
// 4 façons de poser le titre × 5 compléments = 20 compositions structurellement différentes par type (× 5 identités = 100 modèles)
const HEADS = [
  { key: "gauche", label: "Titre à gauche", tag: "simple", build: (k, b, t, body) => [b.sec([b.title(), ...body])] },
  { key: "centre", label: "Titre centré, colonne étroite", tag: "centré", build: (k, b, t, body) => [b.sec([b.title("center"), ...body], "760px")] },
  { key: "bandeau", label: "Bandeau de titre", tag: "bandeau", build: (k, b, t, body) => [k.band([k.inner([k.H(TITLE[t], "1", { fontSize: "32px" })], { justifyContent: "flex-start" })], { paddingTop: "32px", paddingBottom: "32px", backgroundColor: k.S.alt }), b.sec(body)] },
  { key: "fil", label: "Fil d'accueil et titre", tag: "fil d'ariane", build: (k, b, t, body) => [b.sec([k.row([k.LINK("Accueil", "/", { fontSize: "14px" }), k.T("<p>›</p>", { fontSize: "14px" }), k.LINK("Boutique", "/boutique", { fontSize: "14px" })], { gap: "8px" }), b.title(), ...body])] },
];
const EXTRAS = [
  { key: "seule", label: "page seule", tag: "épuré", build: (k, b) => [b.page()] },
  { key: "consignes", label: "consignes en bas", tag: "consignes", build: (k, b) => [b.page(), b.infos()] },
  { key: "aide", label: "aide à droite", tag: "aide", build: (k, b) => [k.row([k.col([b.page()], { flexBasis: "0px", flexGrow: 1, minWidth: "300px" }), k.col([b.help()], { flexBasis: "280px", flexShrink: 0 })], { alignItems: "flex-start", gap: "32px", flexWrap: "wrap" })] },
  { key: "aide-bas", label: "aide en bas", tag: "contact", build: (k, b) => [b.page(), b.help()] },
  { key: "produits", label: "produits mis en avant", tag: "produits", build: (k, b, t) => (t === "checkout" ? [b.back(), b.page()] : [b.page(), b.featured()]) },
];
const LAYOUTS = [];
for (const h of HEADS) for (const e of EXTRAS) LAYOUTS.push({ key: `${h.key}-${e.key}`, label: `${h.label} · ${e.label}`, tags: [h.tag, e.tag], desc: `${h.label}, ${e.label}.`, build: (k, t) => { const b = blocks(k, t); return h.build(k, b, t, e.build(k, b, t)); } });

function catalog(type) {
  return { type, kind: "page", layouts: LAYOUTS.map((l) => ({ key: l.key, label: l.label, tags: [...l.tags, KIND_TAG[type]], desc: l.desc, build: (k) => l.build(k, type) })) };
}
module.exports = { catalog, WIDGET, TITLE };
