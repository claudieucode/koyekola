// Aides communes aux 100 mises en page « Article individuel ». Chaque mise en page porte SA PROPRE identité visuelle (skin) : le catalogue compte 100 modèles = 100 compositions différentes.
// Contrat d'une mise en page : L(clé, libellé, étiquettes, description, skin, (k, env) => [éléments]) — k = kit(skin) (voir ../kit.js) ; le résultat est posé dans une section libre.
const SKIN_KEYS = ["clair", "marque", "nuit", "editorial", "doux"];
const L = (key, label, tags, desc, skin, build) => {
  if (!SKIN_KEYS.includes(skin)) throw new Error(`single_post/${key} : identité inconnue « ${skin} »`);
  return { key, label, tags, desc, skin, build };
};
const SHARE = { networks: ["facebook", "x", "linkedin"] };
const CRUMB = { items: [{ label: "Accueil", url: "/" }, { label: "Blog", url: "/blog" }, { label: "Cet article" }], separator: "chevron" };
const META = (a = {}) => ({ showAuthor: true, showDate: true, showCategory: true, showReading: true, ...a });
const REL = (a = {}) => ({ title: "À lire aussi", source: "posts", mode: "related", count: 3, layout: "cards", ...a });
// colonne centrée de largeur donnée (le contenu reste centré et plein écran sur mobile)
const COL = (maxWidth) => ({ maxWidth, marginLeft: "auto", marginRight: "auto", width: "100%" });
module.exports = { L, SKIN_KEYS, SHARE, CRUMB, META, REL, COL };
