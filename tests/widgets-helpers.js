// Contenu réaliste de chaque widget du catalogue, partagé par les tests de la mission « widgets » (page publiée, accessibilité).
const nodes = require("../src/marketing/pages/nodes");

// Éléments qui demandent un choix à l'insertion (image, adresse…) : on leur donne un contenu réaliste. Ceux qui dépendent d'une formation ou d'un
// formulaire réels du site (course, addtocart, courserating, signupform) sont éprouvés par leurs propres tests (formations, formulaires).
const NEEDS_DATA = new Set(["course", "addtocart", "courserating", "signupform"]);
const creatable = Object.keys(nodes.NODE_TYPES).filter((t) => nodes.PALETTE[t] && !NEEDS_DATA.has(t));
const LONG = "Mot" + "x".repeat(140);
// Variante « difficile » : les textes affichés deviennent très longs ; les choix de liste, adresses et autres valeurs techniques sont gardés valides
const stress = (v, key = "") => {
  if (typeof v === "string") return !/^(text|title|label|description|content|caption|alt|quote|author|role|subtitle|heading|body|question|answer|q|a|message|placeholder)$/i.test(key) ? v : `${v} ${LONG} ${"phrase très longue, ".repeat(25)}`;
  if (Array.isArray(v)) return v.map((x) => stress(x, key));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stress(x, k)]));
  return v;
};
const IMG = (i) => ({ src: `https://example.com/${i}.jpg`, alt: `Image ${i}` });
const OVER = {
  image: { src: "https://example.com/a.jpg", alt: "a" }, imagebox: { src: "https://example.com/a.jpg", title: "Titre" },
  gallery: { images: [IMG(1), IMG(2), IMG(3)] }, carousel: { images: [IMG(1), IMG(2)] },
  hotspot: { src: "https://example.com/a.jpg", alt: "Plan", spots: [{ x: 30, y: 40, title: "Point", text: "Détail" }] },
  audio: { src: "https://example.com/son.mp3", title: "Son" }, video: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Vidéo" },
  embed: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Contenu intégré" }, map: { address: "Paris, France", title: "Carte" },
  rating: { value: 4, max: 5, label: "Note" },
  mediacarousel: { items: [{ kind: "image", image: "https://example.com/a.jpg", alt: "a", caption: "" }, { kind: "image", image: "https://example.com/b.jpg", alt: "b", caption: "" }] },
  lottie: { src: "https://example.com/a.json", alt: "Animation" },
};
const EXTRA = { menuanchor: { anchor: "ancre-test" } }; // champs portés par l'élément lui-même
const idOf = (i) => `pub${String(i).padStart(9, "0")}`;
const build = (types, hard) => ({
  sections: [{ id: "sect00000001", type: "layout", children: types.map((t, i) => {
    const b = nodes.PALETTE[t].blank();
    const props = { ...(b.props || {}), ...(OVER[t] || {}) };
    return { id: `cont${String(i).padStart(8, "0")}`, type: "container", children: [{ id: idOf(i), type: t, ...(Object.keys(props).length ? { props: hard ? stress(props) : props } : {}), ...(EXTRA[t] || {}), ...(b.v ? { v: b.v } : {}), ...(b.children ? { children: b.children } : {}) }] };
  }) }],
});


module.exports = { NEEDS_DATA, creatable, LONG, stress, OVER, EXTRA, idOf, build };
