// Aides de la bibliothèque « Article individuel » v2 (100 concepts, voie B). Mêmes règles que ../shared.js : un seul {{post.title}}, un seul postcontent, aucune image ni lien inventé.
const S = require("../shared");
const px = (n) => `${n}px`;
// titre de l'article (H1) avec tailles tablette et mobile dérivées
const T = (k, size, st = {}) => k.H("{{post.title}}", "1", { fontSize: px(size), lineHeight: 1.12, ...st }, { fontSize: px(Math.round(size * 0.78)) }, { fontSize: px(Math.max(28, Math.round(size * 0.58))) });
// contenu de l'article dans une colonne de largeur donnée
const BODY = (k, w, st = {}) => k.col([k.W("postcontent", {})], { ...S.COL(w), ...st });
const EX = (k, st = {}) => k.dyn("post.excerpt", { fontSize: "19px", color: k.S.mute, ...st });
const IMG = (k, st = {}) => k.img("post.image", { maxHeight: "480px", ...st });
const SHR = (label = "Partager") => ({ networks: ["facebook", "x", "linkedin"], label });
const ALERT = (tone, title, text) => ({ tone, title, text });
module.exports = { ...S, T, BODY, EX, IMG, SHR, ALERT, px };
