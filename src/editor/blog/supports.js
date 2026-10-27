// Réglages communs à (presque) tous les blocs, comme les « block supports » de Gutenberg :
//   - ancre HTML (attribut id) : cible d'un lien interne (#mon-ancre) ;
//   - classes CSS supplémentaires : uniquement des classes préfixées « kb-x- » (crochets de style pour le CSS du site) — jamais de classe libre,
//     pour éviter toute collision avec le CSS du site ou l'injection de mise en forme.
// Les mêmes règles sont appliquées par le serveur (src/utils/blogHtml.js) : ce qui n'y est pas conforme n'est pas enregistré.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { LOCKABLE_TYPES } from "./editing";
import { containerNames } from "../../shared/blockRegistry";
import { STYLE_PROPS, cleanValue, colorStyle } from "../../shared/blockStyles";

// Types de blocs qui reçoivent les réglages « texte » (typographie) et « conteneur » (espace entre blocs internes)
export const TEXT_STYLE_TYPES = ["paragraph", "heading", "blockquote", "bulletList", "orderedList", "kbPreformatted", "kbVerse", "codeBlock"];
export const CONTAINER_STYLE_TYPES = containerNames(); // dérivé du registre central
export const styleScopeTypes = (p) => (p.scope === "text" ? TEXT_STYLE_TYPES : p.scope === "container" ? CONTAINER_STYLE_TYPES : LOCKABLE_TYPES);
export const supportsStyle = (type, p) => styleScopeTypes(p).includes(type);

export const ANCHOR_RE = /^[a-z][a-z0-9_-]{0,63}$/;
export const XCLASS_TOKEN = /^kb-x-[a-z0-9-]{1,30}$/;
export const MAX_XCLASS = 5;
export const TONES = [["", "Par défaut"], ["accent", "Accent"], ["muted", "Atténué"], ["primary", "Bleu nuit"]];
// Variantes de style par bloc (équivalent des « styles de bloc » de Gutenberg) : mêmes listes fermées que le serveur (VARIANTS dans blogHtml.js)
export const VARIANTS = {
  horizontalRule: [["", "Par défaut"], ["dots", "Points"], ["wide", "Large"], ["short", "Court"]],
  kbImage: [["", "Par défaut"], ["rounded", "Coins arrondis"], ["circle", "Rond"], ["shadow", "Ombre"]],
  blockquote: [["", "Par défaut"], ["bordered", "Encadrée"]],
  table: [["", "Par défaut"], ["striped", "Lignes alternées"]],
  kbGroup: [["", "Par défaut"], ["card", "Carte"]],
};

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
  // Légende d'un tableau : affichée sous le tableau dans l'éditeur (le serveur en fait un <caption>)
  addProseMirrorPlugins() {
    return [new Plugin({
      key: new PluginKey("kbTableCaption"),
      props: {
        decorations(state) {
          const decos = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name === "table" && node.attrs.caption) {
              decos.push(Decoration.widget(pos + node.nodeSize, () => { const d = document.createElement("div"); d.className = "kb-ed-table-caption"; d.contentEditable = "false"; d.textContent = node.attrs.caption; return d; }, { side: -1, key: `cap-${pos}-${node.attrs.caption}`, ignoreSelection: true }));
              return false;
            }
            return true;
          });
          return decos.length ? DecorationSet.create(state.doc, decos) : null;
        },
      },
    })];
  },
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
        hide: {
          default: "",
          keepOnSplit: false,
          parseHTML: (el) => String(el.getAttribute("data-hide") || "").split(/\s+/).filter((d) => ["mobile", "tablet", "desktop"].includes(d)).join(" "),
          renderHTML: (attrs) => (attrs.hide ? { "data-hide": attrs.hide } : {}),
        },
        blockName: {
          default: null,
          keepOnSplit: false,
          parseHTML: (el) => (el.getAttribute("data-name") || "").replace(/\s+/g, " ").trim().slice(0, 60) || null,
          renderHTML: (attrs) => (attrs.blockName ? { "data-name": attrs.blockName } : {}),
        },
        variant: {
          default: "",
          keepOnSplit: false,
          parseHTML: (el) => el.getAttribute("data-variant") || "",
          renderHTML: (attrs) => (attrs.variant ? { "data-variant": attrs.variant } : {}),
        },
        xclass: {
          default: "",
          keepOnSplit: false,
          parseHTML: (el) => normalizeClasses((el.getAttribute("data-class") || "").split(/\s+/).filter((c) => XCLASS_TOKEN.test(c)).join(" ")),
          renderHTML: (attrs) => (attrs.xclass ? { "data-class": attrs.xclass } : {}),
        },
      },
    }, ...STYLE_PROPS.map((p) => ({
      // Réglages de style communs (typographie, couleur, espacement, bordure, ombre, dimensions) : src/shared/blockStyles.js
      types: styleScopeTypes(p),
      attributes: {
        [p.key]: {
          default: "",
          keepOnSplit: p.scope === "text",
          parseHTML: (el) => cleanValue(p.key, el.getAttribute(p.attr)),
          renderHTML: (attrs) => {
            const v = attrs[p.key] ? cleanValue(p.key, attrs[p.key]) : "";
            if (!v) return {};
            return p.color ? { [p.attr]: v, style: colorStyle({ [p.key]: v }) } : { [p.attr]: v };
          },
        },
      },
    })), {
      // Lettrine (premier paragraphe d'une section)
      types: ["paragraph"],
      attributes: { dropcap: { default: false, keepOnSplit: false, parseHTML: (el) => el.getAttribute("data-dropcap") === "true", renderHTML: (attrs) => (attrs.dropcap ? { "data-dropcap": "true" } : {}) } },
    }, {
      // Teinte du texte du bloc : jetons du site (liste fermée, la même que le serveur)
      types: ["paragraph", "heading", "blockquote", "bulletList", "orderedList"],
      attributes: { tone: { default: "", keepOnSplit: true, parseHTML: (el) => (["accent", "muted", "primary"].includes(el.getAttribute("data-tone")) ? el.getAttribute("data-tone") : ""), renderHTML: (attrs) => (attrs.tone ? { "data-tone": attrs.tone } : {}) } },
    }, {
      // Liste numérotée décroissante
      types: ["orderedList"],
      attributes: { reversed: { default: false, parseHTML: (el) => el.hasAttribute("reversed"), renderHTML: (attrs) => (attrs.reversed ? { reversed: "reversed" } : {}) } },
    }, {
      // Légende d'un tableau (le serveur en fait un <caption>)
      types: ["table"],
      attributes: {
        caption: {
          default: "",
          parseHTML: (el) => el.getAttribute("data-caption") || "",
          renderHTML: (attrs) => (attrs.caption ? { "data-caption": attrs.caption } : {}),
        },
      },
    }];
  },
});
