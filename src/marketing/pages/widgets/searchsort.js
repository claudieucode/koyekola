// Trier les résultats : liens « Plus récents / Plus anciens / A→Z / Z→A / Prix » qui ajoutent ?tri=… à l'adresse de la recherche en CONSERVANT le terme, la catégorie et les autres paramètres
// (et en remettant la pagination à la première page). Le tri est réellement appliqué par le moteur aux boucles « filtrées par l'adresse » (landing/index.js, TRI). Le prix n'est proposé que pour les produits et les formations.
const OPTIONS = { recent: "Plus récents", ancien: "Plus anciens", alpha: "A → Z", "alpha-inverse": "Z → A", "prix-croissant": "Prix croissant", "prix-decroissant": "Prix décroissant" };
module.exports = {
  type: "searchsort", label: "Trier les résultats", group: "site", icon: "sliders", version: 1, style: "box", status: "operational",
  description: "Liens de tri des résultats de recherche (date, ordre alphabétique, prix)",
  keywords: "tri trier ordre resultats recherche date alphabetique prix croissant decroissant plus recents plus anciens",
  schema: [
    { key: "label", kind: "text", label: "Texte avant les liens", max: 40, default: "Trier par" },
    { key: "recent", kind: "bool", label: "Plus récents", default: true },
    { key: "ancien", kind: "bool", label: "Plus anciens", default: true },
    { key: "alpha", kind: "bool", label: "A → Z", default: true },
    { key: "alphaInverse", kind: "bool", label: "Z → A", default: false },
    { key: "prix", kind: "bool", label: "Prix croissant / décroissant (produits et formations)", default: false },
    { key: "layout", kind: "select", label: "Présentation", options: [["pills", "Puces"], ["text", "Texte"], ["select", "Liste déroulante"]], default: "pills" },
  ],
  // Adresse de base : tous les paramètres actuels sauf le tri et la page des boucles
  data(ctx, p, env) {
    const q = (env.visitor && env.visitor.query) || {};
    const keep = Object.entries(q).filter(([k, v]) => k !== "tri" && !k.startsWith("lp-") && typeof v === "string" && v).slice(0, 12);
    const options = [["recent", p.recent], ["ancien", p.ancien], ["alpha", p.alpha], ["alpha-inverse", p.alphaInverse], ["prix-croissant", p.prix], ["prix-decroissant", p.prix]].filter(([, on]) => on).map(([k]) => ({ key: k, label: OPTIONS[k] }));
    const base = keep.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v).slice(0, 100))}`).join("&");
    return { options, base, active: typeof q.tri === "string" && OPTIONS[q.tri] ? q.tri : options[0] ? options[0].key : "" };
  },
};
