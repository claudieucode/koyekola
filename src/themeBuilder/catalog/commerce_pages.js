// Catalogues des pages COMMERCE du Theme Builder : Panier, Validation de commande, Commande reçue, Compte client. 6 compositions × 5 identités = 30 modèles par type.
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
  return { W, title, page, sec, infos, help, featured };
};
const LAYOUTS = [
  { key: "simple", label: "Simple", tags: ["simple", "épuré"], desc: "Titre puis la page, dans une colonne de 1100 px.", build: (k, t) => { const b = blocks(k, t); return [b.sec([b.title(), b.page()])]; } },
  { key: "etroit", label: "Colonne étroite centrée", tags: ["centré", "étroit"], desc: "Titre centré et page dans une colonne étroite de 760 px.", build: (k, t) => { const b = blocks(k, t); return [b.sec([b.title("center"), b.page()], "760px")]; } },
  { key: "bandeau", label: "Bandeau de titre", tags: ["bandeau", "couleur"], desc: "Bandeau de couleur avec le titre, puis la page.", build: (k, t) => { const b = blocks(k, t); const bn = k.band([k.inner([k.H(TITLE[t], "1", { fontSize: "32px" })], { justifyContent: "flex-start" })], { paddingTop: "32px", paddingBottom: "32px", backgroundColor: k.S.alt }); return [bn, b.sec([b.page()])]; } },
  { key: "reassurance", label: "Avec consignes en bas", tags: ["réassurance", "consignes"], desc: "La page, puis trois cartes de consignes éditables (livraison, retours, aide).", build: (k, t) => { const b = blocks(k, t); return [b.sec([b.title(), b.page(), b.infos()])]; } },
  { key: "aide", label: "Page et aide à droite", tags: ["colonne", "aide", "contact"], desc: "La page à gauche, une carte d'aide avec lien de contact à droite.", build: (k, t) => { const b = blocks(k, t); return [b.sec([b.title(), k.row([k.col([b.page()], { flexBasis: "0px", flexGrow: 1, minWidth: "300px" }), k.col([b.help()], { flexBasis: "280px", flexShrink: 0 })], { alignItems: "flex-start", gap: "32px", flexWrap: "wrap" })], "1180px")]; } },
  { key: "produits", label: "Avec produits mis en avant", tags: ["produits", "ventes additionnelles"], desc: "La page, puis une rangée de vrais produits mis en avant de la boutique.", build: (k, t) => { const b = blocks(k, t); return [b.sec([b.title(), b.page(), b.featured()])]; } },
];
// Compositions retenues par type (6 chacune ; la « sans distraction » de la validation de commande n'a pas de rangée de produits)
const SETS = {
  cart: ["simple", "etroit", "bandeau", "reassurance", "aide", "produits"],
  checkout: ["simple", "etroit", "bandeau", "reassurance", "aide", "etroit-aide"],
  order_received: ["simple", "etroit", "bandeau", "reassurance", "aide", "produits"],
  my_account: ["simple", "etroit", "bandeau", "reassurance", "aide", "produits"],
};
LAYOUTS.push({ key: "etroit-aide", label: "Étroit avec aide en bas", tags: ["étroit", "aide"], desc: "Page dans une colonne étroite, carte d'aide en dessous : aucune distraction avant le paiement.", build: (k, t) => { const b = blocks(k, t); return [b.sec([b.title("center"), b.page(), b.help()], "760px")]; } });

function catalog(type) {
  return { type, kind: "page", layouts: SETS[type].map((key) => { const l = LAYOUTS.find((x) => x.key === key); return { key, label: l.label, tags: [...l.tags, KIND_TAG[type]], desc: `${l.desc}`, build: (k) => l.build(k, type) }; }) };
}
module.exports = { catalog, WIDGET, TITLE };
