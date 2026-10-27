// Réglages communs à (presque) tous les blocs, comme les « block supports » de Gutenberg :
//   - ancre HTML (attribut id) : cible d'un lien interne (#mon-ancre) ;
//   - classes CSS supplémentaires : uniquement des classes préfixées « kb-x- » (crochets de style pour le CSS du site) — jamais de classe libre,
//     pour éviter toute collision avec le CSS du site ou l'injection de mise en forme.
// Les mêmes règles sont appliquées par le serveur (src/utils/blogHtml.js) : ce qui n'y est pas conforme n'est pas enregistré.
import { Extension } from "@tiptap/core";
import { LOCKABLE_TYPES } from "./editing";

export const ANCHOR_RE = /^[a-z][a-z0-9_-]{0,63}$/;
export const XCLASS_TOKEN = /^kb-x-[a-z0-9-]{1,30}$/;
export const MAX_XCLASS = 5;

// Texte saisi → ancre valide ("" si rien d'exploitable)
export function normalizeAnchor(text) {
  const s = String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^[^a-z]+/, "").replace(/-+/g, "-").replace(/-$/, "").slice(0, 64);
  return ANCHOR_RE.test(s) ? s : "";
}
// "bandeau promo" → "kb-x-bandeau kb-x-promo" (déjà préfixé : conservé)
export function normalizeClasses(text) {
  const out = [];
  for (const raw of String(text || "").split(/[\s,]+/)) {
    if (!raw) continue;
    const base = raw.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/^kb-x-/, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
    const cls = base ? `kb-x-${base}` : "";
    if (XCLASS_TOKEN.test(cls) && !out.includes(cls)) out.push(cls);
  }
  return out.slice(0, MAX_XCLASS).join(" ");
}
export const classesForDisplay = (xclass) => String(xclass || "").split(/\s+/).filter(Boolean).map((c) => c.replace(/^kb-x-/, "")).join(" ");

export const BlockSupports = Extension.create({
  name: "kbBlockSupports",
  addGlobalAttributes() {
    return [{
      types: LOCKABLE_TYPES,
      attributes: {
        anchor: {
          default: null,
          keepOnSplit: false,
          parseHTML: (el) => (ANCHOR_RE.test(el.getAttribute("id") || "") ? el.getAttribute("id") : null),
          renderHTML: (attrs) => (attrs.anchor ? { id: attrs.anchor } : {}),
        },
        xclass: {
          default: "",
          keepOnSplit: false,
          parseHTML: (el) => normalizeClasses((el.getAttribute("data-class") || "").split(/\s+/).filter((c) => XCLASS_TOKEN.test(c)).join(" ")),
          renderHTML: (attrs) => (attrs.xclass ? { "data-class": attrs.xclass } : {}),
        },
      },
    }];
  },
});
