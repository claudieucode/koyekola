// Échantillons de pages SANS filtre sur un conteneur : leur CSS doit rester strictement identique à celui d'avant la correction
// (voir tests/isolation-conteneur.test.js et docs/page-builder/ISOLATION_CONTENEUR_FILTRES.md).
const ID = (s) => String(s).padEnd(12, "0");
const bg = { backgroundColor: "#102030", backgroundImage: { src: "https://example.com/fond.jpg" }, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", overlay: { color: "rgba(0,0,0,.4)" } };
const kid = (id, type, props, extra) => ({ id: ID(id), type, props: props || {}, children: [], ...(extra || {}) });
const SAMPLES = {
  sectionFond: [{ id: ID("s1"), type: "layout", styles: { desktop: { ...bg, paddingTop: "40px" }, mobile: { paddingTop: "10px" } }, states: { hover: { backgroundColor: "#ff0000" } }, children: [kid("t1", "heading", { text: "Titre", level: 2 })] }],
  conteneurs: [{ id: ID("s2"), type: "layout", children: ["container", "group", "stack", "grid", "columns", "column"].map((t, i) => kid("c" + i, t, {}, { styles: { desktop: { ...bg, borderRadius: "12px", shadow: { x: 0, y: 4, blur: 10, spread: 0, color: "#000" } }, tablet: { backgroundColor: "#eee" } }, states: { hover: { opacity: 0.8 } } })) }],
  bande: [{ id: ID("s3"), type: "layout", children: [kid("b1", "container", { band: true }, { styles: { desktop: { paddingLeft: "20px", paddingRight: "20px", gradient: { from: "#000", to: "#fff", angle: 90 } } } })] }],
  filtreSurFeuilles: [{ id: ID("s4"), type: "layout", children: [kid("i1", "image", { src: "https://example.com/a.jpg", alt: "x" }, { styles: { desktop: { filter: { blur: 7 } }, mobile: { filter: { grayscale: 100 } } }, states: { hover: { filter: { sepia: 50 } } } }), kid("h1", "heading", { text: "x", level: 2 }, { styles: { desktop: { filter: { brightness: 120 } } } })] }],
  filtreNeutre: [{ id: ID("s5"), type: "layout", children: [kid("n1", "container", {}, { styles: { desktop: { ...bg, filter: { blur: 0, brightness: 100 } } } })] }],
  backdropSeul: [{ id: ID("s6"), type: "layout", children: [kid("d1", "container", {}, { styles: { desktop: { ...bg, backdrop: { blur: 12 } } } })] }],
  fondEnLettres: [{ id: ID("s7"), type: "layout", children: [kid("l1", "container", {}, { styles: { desktop: { gradient: { from: "#f00", to: "#00f", angle: 90 }, backgroundClip: "text" } } })] }],
};
module.exports = { SAMPLES, ID, kid, bg };
