// « Produits GO » : affiche sur n'importe quelle page les produits GO choisis dans le Sourcing produit (Product Hunter Nakewenze).
// La liste des produits proposée dans l'éditeur est lue à chaque ouverture (les mises à jour quotidiennes y apparaissent sans redéploiement) : les produits GO
// d'abord, avec les drapeaux des pays où ils le sont. Seule une fiche PUBLIQUE est affichée (nom, textes de vente, photos, prix de vente conseillé du pays) :
// jamais le coût, la marge, le ratio, les liens fournisseurs ni les pubs des concurrents. Tout le design se règle dans l'onglet Style et par parties (parts.js).
const sourcing = require("../../sourcing/catalog");

const bool = (key, label, def) => ({ key, kind: "bool", label, default: def });
const COUNTRY_OPTIONS = Object.entries(sourcing.COUNTRIES).map(([k, c]) => [k, `${c.f} ${c.n} (${c.cur})`]);
const EMPTY_ITEM = { product: "", name: "", text: "", price: "", badge: "", image: "", link: "" };

module.exports = {
  type: "produitsgo", label: "Produits GO", group: "commerce", icon: "grid", version: 1, style: "box", status: "operational",
  description: "Vos produits GO du Sourcing produit, choisis un par un : photos, nom, texte de vente, prix du pays et bouton, design libre",
  dependencies: ["Données du Sourcing produit (Marketing → Sourcing produit)"],
  keywords: "produits go sourcing product hunter nakewenze gagnant dropshipping vitrine produit carte prix",
  schema: [
    { key: "title", kind: "text", label: "Titre (facultatif)", max: 100, default: "" },
    { key: "country", kind: "select", label: "Pays ciblé (devise du prix et statut GO)", options: COUNTRY_OPTIONS, default: "US" },
    { key: "products", kind: "items", label: "Produits à afficher", min: 1, max: 12, default: [{ ...EMPTY_ITEM }],
      fields: [
        // Choix relus à chaque ouverture de l'éditeur et à chaque enregistrement (getter) : les produits du jour, GO en premier
        { key: "product", kind: "select", label: "Produit", get options() { return sourcing.productOptions(); }, default: "" },
        { key: "name", kind: "text", label: "Nom affiché (vide = nom du produit)", max: 120, default: "" },
        { key: "text", kind: "textarea", label: "Texte (vide = « Texte du produit » ci-dessous)", max: 500, default: "" },
        { key: "price", kind: "text", label: "Prix affiché (vide = prix conseillé du pays)", max: 30, default: "" },
        { key: "badge", kind: "text", label: "Pastille (ex. Nouveau, -20 %)", max: 30, default: "" },
        { key: "image", kind: "image", label: "Image personnalisée (vide = photos du produit)" },
        { key: "link", kind: "link", label: "Lien du bouton (page produit, boutique…)" },
      ] },
    { key: "layout", kind: "select", label: "Présentation", options: [["grid", "Grille de cartes"], ["list", "Liste (image à gauche)"], ["feature", "Vedette (grande image, texte à côté)"]], default: "grid" },
    { key: "columns", kind: "select", label: "Colonnes (grille, ordinateur)", options: [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]], default: "3" },
    { key: "ratio", kind: "select", label: "Format de l'image", options: [["1/1", "Carré"], ["4/5", "Portrait 4:5"], ["3/4", "Portrait 3:4"], ["4/3", "Paysage 4:3"], ["16/9", "Large 16:9"]], default: "1/1" },
    { key: "fit", kind: "select", label: "Cadrage de l'image", options: [["cover", "Remplir le cadre"], ["contain", "Image entière"]], default: "cover" },
    { key: "cardStyle", kind: "select", label: "Carte", options: [["boxed", "Encadrée"], ["plain", "Sans cadre"], ["soft", "Fond doux"]], default: "boxed" },
    { key: "align", kind: "select", label: "Alignement du texte", options: [["left", "À gauche"], ["center", "Centré"]], default: "left" },
    { key: "nameLang", kind: "select", label: "Nom du produit", options: [["fr", "En français"], ["en", "En anglais"]], default: "fr" },
    { key: "textSource", kind: "select", label: "Texte du produit", options: [["promise", "La promesse (anglais)"], ["pain", "Le problème résolu (anglais)"], ["none", "Aucun texte"]], default: "promise" },
    bool("showImage", "Afficher l'image", true), bool("showGallery", "Miniatures des autres photos (clic = grande image)", false),
    bool("showName", "Afficher le nom", true), bool("showPrice", "Afficher le prix", true), bool("roundPrice", "Prix conseillé arrondi en ,99", true),
    bool("showBadge", "Afficher la pastille", true), bool("showButton", "Afficher le bouton (produits avec un lien)", true),
    { key: "buttonLabel", kind: "text", label: "Texte du bouton", max: 40, default: "Voir le produit" },
    bool("newTab", "Ouvrir le lien dans un nouvel onglet", false),
    { key: "empty", kind: "text", label: "Message s'il n'y a aucun produit", max: 160, default: "Aucun produit pour le moment." },
  ],
  complete(p) {
    if (!(p.products || []).some((x) => x && x.product)) return "Produits GO : choisissez au moins un produit.";
    return null;
  },
  data(ctx, p) {
    const items = [], missing = [], notGo = [];
    (p.products || []).forEach((it, i) => {
      if (!it || !it.product) return;
      const x = sourcing.publicProduct(it.product, p.country, p.roundPrice);
      if (!x) { missing.push(i + 1); return; }
      const name = it.name || (p.nameLang === "en" ? x.nameEn || x.nameFr : x.nameFr || x.nameEn);
      if (!x.go) notGo.push(name);
      const text = it.text || (p.textSource === "promise" ? x.promise : p.textSource === "pain" ? x.pain : "");
      const gallery = it.image ? [] : x.gallery;
      items.push({ index: i, name, text, price: it.price || x.price, badge: it.badge, image: it.image || x.image, gallery, go: x.go });
    });
    const c = sourcing.COUNTRIES[p.country] || sourcing.COUNTRIES.US;
    return { items, missing, notGo, country: `${c.f} ${c.n}` };
  },
};
