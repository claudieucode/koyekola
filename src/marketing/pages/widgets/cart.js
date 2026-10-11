// Panier : les formations que le visiteur a mises dans SON panier (le vrai panier du site, en session), le total et le bouton vers la caisse.
// Rien n'est inventé : un panier vide affiche le message prévu ; une formation dépubliée disparaît ; les prix sont ceux du site (offre en cours comprise).
const { getCourse } = require("../../bridge/catalog");
module.exports = {
  type: "cart", label: "Panier", group: "commerce", icon: "cart", version: 1, style: "box", status: "operational",
  description: "Le contenu du panier du visiteur, le total et le bouton vers la caisse",
  keywords: "panier cart achats commande total caisse checkout recapitulatif boutique formations",
  dependencies: ["Le visiteur doit être connecté (le panier du site est lié au compte)", "Pages du site /panier et /commande"],
  schema: [
    { key: "title", kind: "text", label: "Titre (facultatif)", max: 80, default: "Votre panier" },
    { key: "showImage", kind: "bool", label: "Afficher la vignette des formations", default: true },
    { key: "showTotal", kind: "bool", label: "Afficher le total", default: true },
    { key: "checkoutLabel", kind: "text", label: "Texte du bouton vers la caisse", max: 40, required: true, default: "Passer la commande" },
    { key: "cartLabel", kind: "text", label: "Texte du lien vers le panier détaillé (vide = aucun)", max: 40, default: "Modifier le panier" },
    { key: "empty", kind: "text", label: "Message quand le panier est vide", max: 160, default: "Votre panier est vide." },
  ],
  data(ctx, p, env) {
    const ids = (env.visitor && env.visitor.cartIds) || [];
    const items = ids.map((id) => getCourse(ctx, id)).filter(Boolean).map((c) => ({ title: c.title, url: `/cours/${encodeURIComponent(c.slug)}`, image: c.thumbnail_path || "", priceCents: c.price_cents || 0 }));
    return { items, totalCents: items.reduce((a, c) => a + c.priceCents, 0) };
  },
};
