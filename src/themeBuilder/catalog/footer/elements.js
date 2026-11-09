// ÉLÉMENTS AJOUTÉS à la grammaire des pieds de page (refonte). Ils s'écrivent comme les anciens, « nom:arg|libellé|texte », dans les rangées C / L / T / Z / A du moteur (./moteur.js) :
//   newsletter|Titre|Introduction   abonnement par e-mail : widget « Abonnement par e-mail » (emailsubscribe) branché sur un formulaire d'inscription publié du site.
//                                   SANS formulaire : message EXPLICITE « Inscription par e-mail non configurée » (éditeur ET site public), aucun faux champ, aucun faux bouton, et la publication du pied n'est pas bloquée.
//   contactform|Titre|Introduction  formulaire de contact : même widget en mode « tous les champs » d'un formulaire publié du site ; message explicite s'il n'y en a pas.
//   socials:facebook+tiktok+x|big   réseaux (les 13 du widget « Réseaux sociaux » : facebook instagram linkedin youtube x tiktok whatsapp telegram pinterest reddit threads website email), adresses par défaut modifiables dans le panneau ;
//                                   2e argument : plain | big | sq.  Sans liste : facebook, instagram, linkedin, youtube.
//   shopcats[:n]                    catégories de produits RÉELLES de la boutique (module Commerce) ; état vide explicite sinon.
//   shoplinks|Titre                 suivi de commande, panier, souhaits, livraison et retours : vrais liens /boutique/… ; état explicite si la boutique n'est pas ouverte.
//   legallinks[:inline]             Cookies, Contact + pages légales renseignées (mentions, confidentialité, CGV) ; l'éditeur signale celles qui manquent, les visiteurs ne voient JAMAIS de lien mort.
//   pay|Titre                       (déjà existant) moyens de paiement en pastilles, lus dans les Données de l'entreprise.
// Fonctions (pour les modèles qui ont besoin de plus) : widget(), reseaux(), accordeon() — voir ./kit-conception.js.
const { registerElement } = require("./moteur");

// Adresses par défaut (page d'accueil du réseau) : crédibles, modifiables dans le panneau « Réseaux sociaux ». « email » n'a pas d'adresse par défaut (il faut une vraie adresse mailto:).
const NETWORK_URLS = {
  facebook: "https://www.facebook.com/", instagram: "https://www.instagram.com/", linkedin: "https://www.linkedin.com/", youtube: "https://www.youtube.com/", x: "https://x.com/", tiktok: "https://www.tiktok.com/",
  whatsapp: "https://wa.me/", telegram: "https://t.me/", pinterest: "https://www.pinterest.com/", reddit: "https://www.reddit.com/", threads: "https://www.threads.net/", website: "/",
};
const NETWORK_KEYS = [...Object.keys(NETWORK_URLS), "email"];
const DEFAULT_NETWORKS = ["facebook", "instagram", "linkedin", "youtube"];

// Liste de réseaux → éléments { network, url } ; urls : { réseau: adresse } pour remplacer l'adresse par défaut
function networkItems(list, urls = {}) {
  const out = [];
  for (const n of list) {
    if (!NETWORK_KEYS.includes(n)) throw new Error(`Pied de page : réseau inconnu « ${n} » (réseaux possibles : ${NETWORK_KEYS.join(", ")}).`);
    const url = urls[n] || NETWORK_URLS[n];
    if (!url) throw new Error("Pied de page : le réseau « email » demande une adresse « mailto:… » (fonction reseaux()).");
    out.push({ network: n, url });
  }
  return out;
}
function socialNode(k, list, urls, look, center) {
  const S = k.S, n = k.social(networkItems(list, urls), { gap: look === "big" ? "14px" : look === "plain" ? "2px" : "8px", ...(center ? { justifyContent: "center" } : {}) });
  if (look === "plain") { n.props.shape = "plain"; n.props.size = "44"; /* glyphe de 24 px (taille × 0,55) dans une cible de 44 px : jamais de pictogramme de 12 px */ } else if (look === "big") n.props.size = "48"; else if (look === "sq") n.props.shape = "square";
  void S;
  return n;
}

registerElement("newsletter", (k, { a1, a2 }, env, center) => k.W("emailsubscribe", {
  title: a1 || "Restez informé", intro: a2 || "", button: "S'abonner", formId: 0, fields: "email", showWhenMissing: true, missingText: "",
}, { width: "100%", maxWidth: "460px", color: k.S.fg, ...(center ? { marginLeft: "auto", marginRight: "auto" } : {}) }));

registerElement("contactform", (k, { a1, a2 }, env, center) => k.W("emailsubscribe", {
  title: a1 || "Écrivez-nous", intro: a2 || "", button: "Envoyer", formId: 0, fields: "all", showWhenMissing: true, missingText: "",
}, { width: "100%", maxWidth: "460px", color: k.S.fg, ...(center ? { marginLeft: "auto", marginRight: "auto" } : {}) }));

registerElement("socials", (k, { x, a1 }, env, center) => socialNode(k, x ? x.split("+").filter(Boolean) : DEFAULT_NETWORKS, {}, a1, center));

registerElement("shopcats", (k, { x }, env, center) => k.W("shopcategories", { title: "", count: Number(x) || 6, showCount: false, onlyFilled: true, empty: "Aucune catégorie de produits pour le moment." },
  { color: k.S.fg, fontSize: "14px", ...(center ? { textAlign: "center" } : {}) }));

registerElement("shoplinks", (k, { a1 }, env, center) => k.W("shoplinks", { title: "", showTracking: true, showCart: true, showWishlist: false, showDelivery: true, empty: "La boutique n'est pas encore ouverte." },
  { color: k.S.fg, fontSize: "14px", ...(center ? { textAlign: "center" } : {}) }));

registerElement("legallinks", (k, { x }, env, center) => {
  const S = k.S, st = { fontSize: "13px", fontWeight: "500" };
  return k.row([k.LINK("Cookies", "/cookies", st), k.LINK("Contact", "/contact", st),
    k.W("bizlegal", { title: "", showName: false, showForm: false, showRegistrations: false, showPublisher: false, showHost: false, showPages: true, layout: x === "stack" ? "stack" : "inline", hintMissing: true }, { color: S.fg, fontSize: "13px", fontWeight: "500", ...(x === "stack" ? {} : { marginTop: "-8px" }) })],
    { gap: "10px", ...(center ? { justifyContent: "center" } : {}), ...(x === "stack" ? { flexDirection: "column", alignItems: "flex-start" } : {}) });
});

module.exports = { NETWORK_URLS, NETWORK_KEYS, DEFAULT_NETWORKS, networkItems, socialNode };
