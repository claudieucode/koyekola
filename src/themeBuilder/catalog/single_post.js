// Catalogue « Article individuel » v3 : 100 créations, chacune avec SA PROPRE identité graphique (couleurs et polices en valeurs FIXES, jamais la charte du site) et SA composition.
// Source : v3/concepts.js (fiches de conception) × v3/archetypes.js (32 structures de composition) ; voir docs/theme-builder/single-post/refonte-v3/.
// Le modèle est rendu AUTOUR d'un article réel : {{post.title}} + postcontent toujours présents, image par étiquette dynamique ({{post.image}}), jamais d'image factice ni de lien inventé.
// Les trois modes d'identité (propre / suit le site / hybride) passent par catalog/identityModes.js, comme la Fiche produit.
const { R, ARCH } = require("./single_post/v3/concepts");
const { skinOf } = require("./single_post/v3/skin");
const ARCHETYPES = require("./single_post/v3/archetypes");
const { context } = require("./single_post/v3/h");
const VARIANTES = (() => { try { return require("./single_post/v3/variantes.json"); } catch { return []; } })(); // voir scripts/assigner-variantes-article.js

const fold = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const slug = (v) => fold(v).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const concepts = R.map((r, i) => ({ id: r[0], name: r[1], dir: r[2], sector: r[3], arch: r[4], title: r[5], hero: r[6], cols: r[7], readW: r[8], metaNote: r[9], authorNote: r[10], side: r[11], widgets: r[12], features: r[13], palette: r[14], fonts: r[15], sig: r[16], v: VARIANTES[i] || [0, 0, 0] }));
const families = [...new Set(concepts.map((c) => c.dir))].map((label) => ({ key: slug(label), label }));
const skins = concepts.map((c) => skinOf(c));
const layouts = concepts.map((c, i) => ({
  key: slug(c.name), label: c.name, family: slug(c.dir), skin: skins[i].key, keySkin: skins[i].key,
  tags: [slug(c.sector), ...c.features.slice(0, 2).map(slug), slug(ARCH[c.arch][0])].filter(Boolean),
  desc: c.sig, concept: c,
  build: (k) => ARCHETYPES[c.arch](context(k, c)),
}));
if (new Set(layouts.map((l) => l.key)).size !== layouts.length) throw new Error("Article individuel v3 : noms de mises en page en double");
module.exports = { type: "single_post", kind: "page", flat: true, ownSkins: true, skins, families, layouts };
