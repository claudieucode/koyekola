// Bibliothèque de modèles : COMPOSANTS réutilisables officiels (programme 20.4). Chacun est UNE section native du Page Builder (mêmes éléments que les patterns), que l'importation
// enregistre comme composant du site (pages.createComponent, mk_web_components) : en-tête et pied de page compris. Aucun faux contenu : les textes entre crochets sont à remplacer ;
// l'importation ne branche JAMAIS un composant sur le site public (en-tête / pied de page : Apparence → Parties du site).
const { helpers: { H, T, B, I, card, cols, grid } } = require("./patterns");

const row = { display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "24px", flexWrap: "wrap" };
const bar = (children, styles = {}) => ({ type: "layout", children: [{ type: "container", children, styles: { desktop: { paddingTop: "16px", paddingBottom: "16px", paddingLeft: "24px", paddingRight: "24px", ...styles } } }] });
const nav = (location) => ({ type: "menu", props: { label: "Navigation", source: "location", location, items: [] } });

const COMPONENTS = [
  { key: "header-simple", role: "header", category: "En-têtes", name: "En-tête simple", description: "Logo du site et menu de navigation sur une ligne.",
    build: () => bar([{ type: "group", children: [{ type: "sitelogo", props: { height: 48, link: true } }, nav("header")], styles: { desktop: row } }]) },
  { key: "header-cta", role: "header", category: "En-têtes", name: "En-tête avec bouton", description: "Logo, menu de navigation et bouton d'action à renseigner.",
    build: () => bar([{ type: "group", children: [{ type: "sitelogo", props: { height: 48, link: true } }, nav("header"), B("[Action principale]", "/contact")], styles: { desktop: row } }]) },
  { key: "footer-simple", role: "footer", category: "Pieds de page", name: "Pied de page simple", description: "Menu de pied de page et ligne de copyright (année automatique).",
    build: () => bar([{ type: "group", children: [{ type: "copyright", props: { owner: "", text: "Tous droits réservés." } }, nav("footer")], styles: { desktop: row } }]) },
  { key: "footer-colonnes", role: "footer", category: "Pieds de page", name: "Pied de page en colonnes", description: "Présentation, liens du pied de page, coordonnées à renseigner et copyright.",
    build: () => bar([cols(3, (i) => (i === 0 ? [{ type: "sitetitle", props: { tag: "p", link: true } }, T("<p>[Une phrase qui présente votre activité.]</p>")]
      : i === 1 ? [H("Liens", "3"), nav("footer")]
        : [H("Contact", "3"), { type: "iconlist", props: { items: [{ text: "[Adresse]", icon: "mapPin" }, { text: "[Adresse e-mail]", icon: "mail" }] } }])),
      { type: "copyright", props: { owner: "", text: "Tous droits réservés." } }], { paddingTop: "48px", paddingBottom: "32px" }) },
  { key: "bandeau-annonce", role: "component", category: "Bandeaux", name: "Bandeau d'annonce", description: "Une ligne d'annonce avec lien, en haut ou en bas d'une page.",
    build: () => bar([{ type: "group", children: [T("<p>[Votre annonce : offre, événement, information importante.]</p>", { textAlign: "center" }), B("[En savoir plus]", "/contact", "outline")], styles: { desktop: { ...row, justifyContent: "center" } } }], { backgroundColor: "token:primary" }) },
  { key: "carte-service", role: "component", category: "Cartes", name: "Carte de service", description: "Icône, titre, texte et lien : une carte réutilisable.",
    build: () => bar([card([I("star"), H("[Nom du service]", "3"), T("<p>[Ce que la personne obtient.]</p>"), B("En savoir plus", "/contact", "outline")])]) },
  { key: "bloc-chiffre", role: "component", category: "Blocs de statistiques", name: "Bloc de chiffre clé", description: "Un chiffre et ce qu'il mesure. N'affichez que des chiffres réels et sourcés.",
    build: () => bar([card([H("[chiffre réel]", "2", { fontSize: "30px", textAlign: "center" }), T("<p>[ce qu'il mesure, et sa source]</p>", { textAlign: "center" })])]) },
  { key: "bandeau-appel", role: "component", category: "Blocs de contenu", name: "Bandeau d'appel à l'action", description: "Titre, phrase d'appui et bouton sur fond de couleur principale.",
    build: () => bar([H("[Prêt à commencer ?]", "2", { color: "token:on-primary", textAlign: "center" }), T("<p>[Le bénéfice principal en une phrase.]</p>", { color: "token:on-primary", textAlign: "center" }), B("[Je commence]", "/contact", "outline")], { backgroundColor: "token:primary", alignItems: "center", paddingTop: "48px", paddingBottom: "48px" }) },
  { key: "barre-boutique", role: "component", category: "Boutique", name: "Barre de boutique (recherche et panier)", description: "Recherche de produits et lien vers le panier, branchés sur la boutique du site (module « Commerce » requis).",
    build: () => bar([{ type: "group", children: [{ type: "shopsearch", props: {} }, { type: "shopcart", props: {} }], styles: { desktop: row } }]) },
];
// Programme 100 : composants supplémentaires (src/marketing/pages/lib100/components.js).
COMPONENTS.push(...require("./lib100/components").entries({ H, T, B, I, card, cols, grid, row, bar, nav }));
for (const c of COMPONENTS) c.build = require("./lib100/fixes").wrap(c.build);
void grid;
const catalog = () => COMPONENTS.map(({ key, role, category, name, description }) => ({ key, role, category, name, description }));
const buildComponent = (key) => { const c = COMPONENTS.find((x) => x.key === key); return c ? JSON.parse(JSON.stringify(c.build())) : null; };
module.exports = { COMPONENTS, catalog, buildComponent };
