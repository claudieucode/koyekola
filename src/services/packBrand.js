// Marque d'un pack de site : identité visuelle (packIdentity.js) + illustrations originales (packArt.js) appliquées aux pages du pack.
// Un pack importé garde ses pages 100 % modifiables : les emplacements d'images vides deviennent de VRAIS éléments « image » (adresse /themes-art/<pack>/<emplacement>.svg, servie par Kolakisa,
// aucune ressource externe), que l'utilisateur remplace par ses photos dans l'éditeur. Les illustrations ne dépendent que du pack : elles restent identiques après importation.
const identity = require("./packIdentity");
const art = require("./packArt");
const { PACKS } = require("../marketing/pages/sitePacks");

const idOf = (key) => identity.identityOf(PACKS, key);
const SLOT_NAME = /^Emplacement (?:de l'image|du visuel|du portrait|de la photo|de la capture|du plan|de l'illustration|des? visuels?)/i;

// Choisit l'emplacement d'illustration d'après le format du conteneur
function slotFor(styles, n, name = "") {
  const d = (styles && styles.desktop) || {}, ratio = String(d.aspectRatio || "").replace(/\s/g, "");
  const [a, b] = ratio.split("/").map(Number), r = a && b ? a / b : 0;
  const base = /portrait/i.test(name) ? "portrait" : r >= 2.2 ? "banner" : r >= 1.7 ? "wide" : r > 0 && r < 0.9 ? "portrait" : r > 0.95 && r < 1.1 ? "square" : "card";
  return `${base}-${(n % 24) + 1}`;
}
// Copie des sections avec illustrations ; home : la page d'accueil reçoit le nom et la description du pack comme titre et chapô lorsqu'ils sont encore des consignes entre crochets
function brand(sections, pack, { home = false } = {}) {
  const copy = JSON.parse(JSON.stringify(sections));
  let n = 0, titled = false, lead = false;
  const walk = (list) => {
    for (let i = 0; i < list.length; i += 1) {
      const x = list[i]; if (!x || typeof x !== "object") continue;
      if (x.type === "container" && SLOT_NAME.test(x.name || "") && (!x.children || !x.children.length)) {
        const st = x.styles || {}, d = { ...(st.desktop || {}) };
        const ratio = d.aspectRatio, minH = d.minHeight; delete d.minHeight;
        list[i] = { id: x.id, type: "image", props: { src: `/themes-art/${pack.key}/${slotFor(st, n, x.name)}.svg`, alt: "", decorative: true },
          styles: { ...st, desktop: { ...d, width: "100%", objectFit: "cover", ...(ratio ? { aspectRatio: ratio } : { aspectRatio: "4/3" }), ...(minH && !ratio ? { minHeight: minH } : {}) } } };
        n += 1; continue;
      }
      if (home && x.type === "heading" && !titled && x.props && String(x.props.level) === "1" && /^\[/.test(String(x.props.text || ""))) { x.props.text = pack.name; titled = true; }
      else if (home && titled && !lead && x.type === "text" && x.props && /^<p>\s*\[/.test(String(x.props.html || ""))) { x.props.html = `<p>${String(pack.description || "").replace(/[<>&]/g, "")}</p>`; lead = true; }
      if (Array.isArray(x.children)) walk(x.children);
    }
  };
  walk(copy);
  return copy;
}
const sectionsOfPage = (sections, pack, pageKey, home) => brand(sections, pack, { home: home || pageKey === "accueil" });
module.exports = { idOf, brand, sectionsOfPage, SLOT_NAME, slotFor };
