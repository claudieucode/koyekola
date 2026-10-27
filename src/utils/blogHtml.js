// Contenu des articles écrits avec l'éditeur éditorial (texte riche, format « html »).
//
// 1. sanitizeBlogHtml : ce qui est ENREGISTRÉ. Liste blanche stricte (balises, attributs, classes, styles) : aucun script,
//    aucun gestionnaire d'événement, aucune iframe. Les blocs « à risque » (vidéo, intégration, audio, formation,
//    newsletter) ne sont que des MARQUEURS (<div class="kb-video" data-url="…">) : leur lecteur est fabriqué à l'affichage.
// 2. renderBlogHtml : ce qui est AFFICHÉ. Réassaini (défense en profondeur), puis : ancres et sommaire des titres, lecteurs
//    vidéo/audio (hébergeurs autorisés seulement), cartes de formation, formulaire newsletter, titres des encadrés, et
//    extraction des données pour le référencement (FAQ, étapes, images, liens, nombre de mots).
// 3. markdownToEditorHtml : ouvre un ancien article Markdown dans l'éditeur, sans rien perdre.
const sanitizeHtml = require("sanitize-html");
const { parseDocument } = require("htmlparser2");
const { default: render } = require("dom-serializer");
const { Element, Text } = require("domhandler");
const DomUtils = require("domutils");
const { slugify } = require("./format");
const { parseVideoUrl, embedProvider } = require("./video");
const { renderArticle, CALLOUTS } = require("./articleMarkdown");
const { STYLE_PROPS, cleanValue, colorStyleFromData } = require("../shared/blockStyles");
const dynamicBlocks = require("../shared/dynamicBlocks");
const blogDynamic = require("./blogDynamic");
const customHtml = require("./customHtml");
const CONTAINER_CLASSES = new Set(require("../shared/blockRegistry").containerClasses());

const MAX_HTML = 300000;
const WORDS_PER_MINUTE = 230;
const CALLOUT_TYPES = Object.keys(CALLOUTS); // conseil, a-retenir, bon-a-savoir, info, attention
const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d{1,3})\s*)?\)$/i, /^var\(--kb-[a-z]{2,12}\)$/];
const SAFE_HREF = /^(https?:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+|\/(?!\/)[^\s"'<>]*|#[a-z0-9-]{1,80})$/i;
const IMG_SRC = /^\/uploads\/(?:thumbnails\/|marketing\/\d{1,9}\/(?:site-\d{1,9}\/)?(?:\d{4}\/(?:0[1-9]|1[0-2])\/)?)[A-Za-z0-9_.-]{1,200}\.(?:png|jpe?g|webp|gif|avif)$/i; // images publiques du site (blog, médiathèque du CMS) uniquement
const FILE_SRC = /^\/uploads\/blog\/[A-Za-z0-9_.-]{1,200}\.(?:pdf|docx|xlsx|pptx|odt|ods|odp|txt|csv|zip)$/i; // fichiers à télécharger (bloc Fichier) : formats bureautiques sûrs, jamais d'exécutable
// Variantes de style par bloc (équivalent des « styles de bloc » de Gutenberg) : liste fermée, par balise ou par balise.classe
const VARIANTS = { hr: ["dots", "wide", "short"], "figure.kb-image": ["rounded", "circle", "shadow"], blockquote: ["bordered"], table: ["striped"], "div.kb-group": ["card"] };
const TRACK_SRC = /^\/uploads\/blog\/[A-Za-z0-9_.-]{1,200}\.vtt$/i; // sous-titres WebVTT téléversés
const AUDIO_SRC = /^\/uploads\/blog\/[A-Za-z0-9_.-]{1,200}\.(?:mp3|m4a|ogg|oga|wav|aac)$/i;
const MEDIA_URL = /^(https:\/\/[^\s"'<>]{1,500}|\/uploads\/blog\/[A-Za-z0-9_.-]{1,200})$/i;
const COURSE_SLUG = /^[a-z0-9-]{1,120}$/;
const REL_TOKENS = new Set(["nofollow", "sponsored", "ugc", "noopener", "noreferrer"]);
const DIV_CLASSES = ["kb-more", "kb-file", "kb-cover", "kb-mediatext", "kb-mediatext-body", "kb-reusable", "kb-spacer", "kb-pagebreak", "kb-columns", "kb-column", "kb-group", "kb-buttons", "kb-gallery", "kb-video", "kb-audio", "kb-embed", "kb-course", "kb-newsletter", "kb-cta", "kb-faq", "kb-faq-answer", "kb-accordion-body", "kb-compare", "kb-compare-col", "kb-step-body", "callout", "kb-html", "kb-nextpage", ...dynamicBlocks.DYNAMIC.map((d) => d.cls), ...CALLOUT_TYPES.map((t) => `callout-${t}`)];

// Mises en page des colonnes : largeurs en %, 2 à 4 colonnes
const COLUMN_LAYOUT = /^(custom|50-50|33-67|67-33|25-75|75-25|33-33-33|25-50-25|50-25-25|25-25-50|25-25-25-25)$/;
const HEX = /^#[0-9a-f]{6}$/i;
const pick = (attribs, names) => Object.fromEntries(names.filter((n) => attribs[n] !== undefined && attribs[n] !== "").map((n) => [n, String(attribs[n]).slice(0, 500)]));
const classesOf = (attribs) => String(attribs.class || "").split(/\s+/).filter(Boolean);
const keepClasses = (attribs, allowed) => classesOf(attribs).filter((c) => allowed.includes(c)).join(" ");

// ---------- 1. Assainissement (enregistrement) ----------
const transformTags = {
  b: "strong",
  i: "em",
  strike: "s",
  del: "s",
  a: (tagName, attribs) => {
    const href = String(attribs.href || "").trim();
    if (!SAFE_HREF.test(href)) return { tagName: "span", attribs: {} };
    const out = { href };
    const rel = new Set(String(attribs.rel || "").toLowerCase().split(/\s+/).filter((t) => REL_TOKENS.has(t)));
    if (attribs.target === "_blank") { out.target = "_blank"; rel.add("noopener"); rel.add("noreferrer"); }
    if (rel.size) out.rel = [...rel].join(" ");
    const cls = keepClasses(attribs, ["btn", "btn-primary", "btn-outline"]);
    if (cls) out.class = cls;
    return { tagName: "a", attribs: out };
  },
  img: (tagName, attribs) => {
    const src = String(attribs.src || "").trim();
    if (!IMG_SRC.test(src)) return { tagName: "span", attribs: {} };
    const out = { src, alt: String(attribs.alt || "").slice(0, 300) };
    if (attribs.title) out.title = String(attribs.title).slice(0, 200);
    for (const k of ["width", "height"]) if (/^\d{1,5}$/.test(String(attribs[k] || ""))) out[k] = String(attribs[k]);
    if (/^\d{1,9}$/.test(String(attribs["data-media-id"] || ""))) out["data-media-id"] = String(attribs["data-media-id"]);
    return { tagName: "img", attribs: out };
  },
  figure: (tagName, attribs) => {
    const out = { class: "kb-image" };
    if (/^(left|center|right|wide)$/.test(attribs["data-align"] || "")) out["data-align"] = attribs["data-align"];
    if (/^(25|33|50|66|75|100)$/.test(attribs["data-width"] || "")) out["data-width"] = attribs["data-width"];
    if (attribs["data-credit"]) out["data-credit"] = String(attribs["data-credit"]).slice(0, 200);
    if (attribs["data-main"] === "true") out["data-main"] = "true";
    if (/^(16-9|4-3|1-1|3-2|3-4)$/.test(attribs["data-ratio"] || "")) out["data-ratio"] = attribs["data-ratio"];
    if (attribs["data-lightbox"] === "true") out["data-lightbox"] = "true";
    if (attribs["data-fit"] === "contain") out["data-fit"] = "contain";
    return { tagName, attribs: out };
  },
  div: (tagName, attribs) => {
    const cls = keepClasses(attribs, DIV_CLASSES);
    if (!cls) return { tagName: "div", attribs: {} };
    const out = { class: cls };
    const main = cls.split(" ")[0];
    if (main === "kb-video" || main === "kb-embed") {
      const url = String(attribs["data-url"] || "").trim();
      if (!MEDIA_URL.test(url)) return { tagName: "div", attribs: {} };
      out["data-url"] = url;
    }
    if (main === "kb-video") {
      if (IMG_SRC.test(String(attribs["data-poster"] || ""))) out["data-poster"] = attribs["data-poster"];
      for (const k of ["data-autoplay", "data-muted", "data-loop", "data-nocontrols"]) if (attribs[k] === "true") out[k] = "true";
      if (TRACK_SRC.test(String(attribs["data-track"] || ""))) {
        out["data-track"] = attribs["data-track"];
        out["data-track-lang"] = /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(String(attribs["data-track-lang"] || "")) ? attribs["data-track-lang"] : "fr";
        out["data-track-label"] = String(attribs["data-track-label"] || "Sous-titres").replace(/[\r\n]+/g, " ").slice(0, 40);
      }
    }
    if (main === "kb-video" && /^(none|metadata|auto)$/.test(attribs["data-preload"] || "")) out["data-preload"] = attribs["data-preload"];
    if (main === "kb-audio" && attribs["data-author"]) out["data-author"] = String(attribs["data-author"]).slice(0, 120);
    if (main === "kb-audio") { if (attribs["data-loop"] === "true") out["data-loop"] = "true"; if (/^(none|metadata|auto)$/.test(attribs["data-preload"] || "")) out["data-preload"] = attribs["data-preload"]; }
    if (main === "kb-gallery") { if (attribs["data-natural"] === "true") out["data-natural"] = "true"; if (attribs["data-lightbox"] === "true") out["data-lightbox"] = "true"; }
    if (main === "kb-gallery" && /^(s|m|l)$/.test(attribs["data-gap"] || "")) out["data-gap"] = attribs["data-gap"];
    if (main === "kb-audio") {
      const src = String(attribs["data-src"] || "").trim();
      if (!AUDIO_SRC.test(src)) return { tagName: "div", attribs: {} };
      out["data-src"] = src;
    }
    if (main === "kb-course") {
      if (!COURSE_SLUG.test(String(attribs["data-course"] || ""))) return { tagName: "div", attribs: {} };
      out["data-course"] = attribs["data-course"];
    }
    if (main === "callout") {
      const type = CALLOUT_TYPES.includes(attribs["data-callout"]) ? attribs["data-callout"] : (cls.match(/callout-([a-z-]+)/) || [])[1];
      if (!CALLOUT_TYPES.includes(type)) return { tagName: "div", attribs: {} };
      out.class = `callout callout-${type}`;
      out["data-callout"] = type;
    }
    if (main === "kb-gallery" && /^[2-4]$/.test(attribs["data-columns"] || "")) out["data-columns"] = attribs["data-columns"];
    const keep = (name, re) => { if (re.test(String(attribs[name] || ""))) out[name] = attribs[name]; };
    if (main === "kb-spacer") { keep("data-size", /^(s|m|l|xl)$/); keep("data-size-mobile", /^(s|m|l|xl)$/); keep("data-px", /^(?:[8-9]|[1-9]\d|[1-4]\d\d)$/); } // hauteur libre : 8 à 499 px
    if (main === "kb-columns") { keep("data-layout", COLUMN_LAYOUT); keep("data-gap", /^(none|s|m|l)$/); keep("data-stack", /^(mobile|tablet|never)$/); keep("data-valign", /^(top|center|bottom)$/); }
    if (main === "kb-group") { keep("data-bg", /^(none|light|accent|dark|warm)$/); keep("data-pad", /^(none|s|m|l)$/); keep("data-border", /^(true)$/); keep("data-width", /^(normal|wide)$/); keep("data-layout", /^(row|stack|grid)$/); keep("data-justify", /^(left|center|right|between)$/); keep("data-gridcols", /^[2-4]$/); keep("data-valign", /^(top|center|bottom)$/); }
    const dyn = dynamicBlocks.BY_CLASS.get(main);
    if (dyn) {
      Object.assign(out, dynamicBlocks.cleanAttrs(dyn, attribs));
      if (main === "kb-rss" && !out["data-url"]) return { tagName: "div", attribs: {} }; // un flux sans adresse valide n'a pas de sens
    }
    if (main === "kb-html") {
      // HTML personnalisé : conservé UNIQUEMENT si la signature du compte créateur correspond au code (src/utils/customHtml.js)
      const code = String(attribs["data-code"] || "");
      if (!customHtml.verify(code, attribs["data-sig"])) return { tagName: "div", attribs: {} };
      out["data-code"] = code; out["data-sig"] = attribs["data-sig"];
    }
    if (main === "kb-column") { keep("data-basis", /^(?:[5-9]|[1-8]\d|9[0-5])$/); keep("data-valign", /^(top|center|bottom)$/); }
    if (main === "kb-buttons") keep("data-align", /^(left|center|right)$/);
    if (main === "kb-reusable") { keep("data-ref", /^\d{1,9}$/); if (!out["data-ref"]) return { tagName: "div", attribs: {} }; }
    if (main === "kb-compare-col" && /^(pro|con|neutral)$/.test(attribs["data-tone"] || "")) out["data-tone"] = attribs["data-tone"];
    if (main === "kb-more" && attribs["data-label"]) out["data-label"] = String(attribs["data-label"]).replace(/[\r\n]+/g, " ").slice(0, 60);
    if (main === "kb-file") {
      const url = String(attribs["data-url"] || "").trim();
      if (!FILE_SRC.test(url)) return { tagName: "div", attribs: {} };
      out["data-url"] = url;
      if (attribs["data-download"] === "true") out["data-download"] = "true";
      if (attribs["data-preview"] === "true" && /\.pdf$/i.test(url)) out["data-preview"] = "true"; // aperçu intégré : PDF seulement
    }
    if (main === "kb-cover") {
      const src = String(attribs["data-src"] || "").trim();
      if (!IMG_SRC.test(src)) return { tagName: "div", attribs: {} };
      out["data-src"] = src;
      keep("data-overlay", /^(0|20|40|60|80)$/); keep("data-height", /^(s|m|l)$/);
      keep("data-fx", /^(0|[1-9]?[05]|100)$/); keep("data-fy", /^(0|[1-9]?[05]|100)$/); // point focal de l'image (pourcentages par pas de 5)
      keep("data-fixed", /^true$/); keep("data-shade", /^(dark|navy|light)$/); keep("data-pos", /^(tl|tc|tr|ml|mc|mr|bl|bc|br)$/);
      if (attribs["data-alt"]) out["data-alt"] = String(attribs["data-alt"]).replace(/[\r\n]+/g, " ").slice(0, 200);
    }
    if (main === "kb-mediatext") { keep("data-side", /^(left|right)$/); keep("data-width", /^(25|33|40|50|60|66|75)$/); keep("data-valign", /^(top|center|bottom)$/); keep("data-crop", /^true$/); keep("data-stack", /^(mobile|never)$/); }
    Object.assign(out, pick(attribs, ["data-title", "data-caption"]));
    return { tagName: "div", attribs: out };
  },
  details: (tagName, attribs) => ({ tagName, attribs: { class: keepClasses(attribs, ["kb-accordion", "kb-faq-item"]) || "kb-accordion", ...(attribs["data-open"] === "true" ? { "data-open": "true" } : {}) } }),
  ol: (tagName, attribs) => {
    const out = {};
    if (classesOf(attribs).includes("kb-steps")) { out.class = "kb-steps"; Object.assign(out, pick(attribs, ["data-title"])); }
    if (/^\d{1,4}$/.test(String(attribs.start || ""))) out.start = String(attribs.start);
    if (attribs.reversed !== undefined) out.reversed = "reversed";
    if (/^(decimal|lower-alpha|upper-alpha|lower-roman|upper-roman|lower-greek)$/.test(attribs["data-ltype"] || "")) out["data-ltype"] = attribs["data-ltype"];
    return { tagName, attribs: out };
  },
  ul: (tagName, attribs) => ({ tagName, attribs: { ...(attribs["data-type"] === "taskList" ? { "data-type": "taskList" } : {}), ...(/^(disc|circle|square|none)$/.test(attribs["data-ltype"] || "") ? { "data-ltype": attribs["data-ltype"] } : {}) } }),
  li: (tagName, attribs) => {
    const out = {};
    if (attribs["data-type"] === "taskItem") { out["data-type"] = "taskItem"; out["data-checked"] = attribs["data-checked"] === "true" ? "true" : "false"; }
    return { tagName, attribs: out };
  },
  input: (tagName, attribs) => {
    if (String(attribs.type).toLowerCase() !== "checkbox") return { tagName: "span", attribs: {} };
    return { tagName: "input", attribs: { type: "checkbox", ...(attribs.checked !== undefined ? { checked: "checked" } : {}), disabled: "disabled" } };
  },
  p: (tagName, attribs) => {
    const out = pick(attribs, ["style"]);
    if (/^[1-4]$/.test(String(attribs["data-indent"] || ""))) out["data-indent"] = attribs["data-indent"];
    if (attribs["data-dropcap"] === "true") out["data-dropcap"] = "true";
    if (classesOf(attribs).includes("kb-button")) {
      out.class = "kb-button";
      if (/^(left|center|right)$/.test(attribs["data-align"] || "")) out["data-align"] = attribs["data-align"];
      for (const [k, re] of [["data-size", /^(s|m|l)$/], ["data-radius", /^(none|s|pill)$/], ["data-width", /^(auto|full)$/], ["data-bg", HEX], ["data-fg", HEX], ["data-border", HEX]]) if (re.test(String(attribs[k] || ""))) out[k] = attribs[k];
    }
    return { tagName, attribs: out };
  },
  td: (tagName, attribs) => ({ tagName, attribs: pick(attribs, ["colspan", "rowspan"]) }),
  th: (tagName, attribs) => ({ tagName, attribs: pick(attribs, ["colspan", "rowspan"]) }),
  pre: (tagName, attribs) => ({ tagName, attribs: classesOf(attribs).includes("kb-preformatted") ? { class: "kb-preformatted" } : classesOf(attribs).includes("kb-verse") ? { class: "kb-verse" } : {} }),
  code: (tagName, attribs) => ({ tagName, attribs: /^language-[a-z0-9+-]{1,20}$/.test(attribs.class || "") ? { class: attribs.class } : {} }),
};
for (const h of ["h1", "h2", "h3", "h4", "h5", "h6"]) transformTags[h] = (tagName, attribs) => ({ tagName, attribs: { ...pick(attribs, ["style"]), ...(/^[1-4]$/.test(String(attribs["data-indent"] || "")) ? { "data-indent": attribs["data-indent"] } : {}) } });
transformTags.hr = (tagName) => ({ tagName, attribs: {} });
// Note de bas de page : <sup class="kb-fn" data-note="…"> (le texte de la note est dans l'attribut, rendu en liste à la fin de l'article)
transformTags.sup = (tagName, attribs) => ({ tagName, attribs: classesOf(attribs).includes("kb-fn") && String(attribs["data-note"] || "").trim() ? { class: "kb-fn", "data-note": String(attribs["data-note"]).replace(/[\r\n\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 500) } : {} });
transformTags.blockquote = (tagName, attribs) => ({ tagName, attribs: { ...(classesOf(attribs).includes("kb-pullquote") ? { class: "kb-pullquote" } : {}), ...(attribs["data-cite"] ? { "data-cite": String(attribs["data-cite"]).replace(/[\r\n\u2028\u2029]+/g, " ").trim().slice(0, 200) } : {}) } });
transformTags.table = (tagName, attribs) => ({ tagName, attribs: { ...(attribs["data-caption"] ? { "data-caption": String(attribs["data-caption"]).replace(/[\r\n]+/g, " ").slice(0, 200) } : {}), ...(attribs["data-footer"] === "true" ? { "data-footer": "true" } : {}), ...(attribs["data-fixed"] === "true" ? { "data-fixed": "true" } : {}) } });
// Bloc verrouillé dans l'éditeur (protection contre les modifications accidentelles) : marqueur conservé, valeur stricte
const BLOCK_ID = /^b[a-z0-9]{8}$/;
const TONE_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol"]); // teinte du texte (jeton du site) : liste fermée
const ANCHOR_ID = /^[a-z][a-z0-9_-]{0,63}$/;
const XCLASS_TOKEN = /^kb-x-[a-z0-9-]{1,30}$/;
const LOCKABLE = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol", "pre", "table", "figure", "div", "details", "hr"];
for (const tag of LOCKABLE) {
  const base = transformTags[tag];
  transformTags[tag] = (tagName, attribs) => {
    const r = base ? base(tagName, attribs) : { tagName, attribs: {} };
    if (attribs["data-locked"] === "true" && r.tagName === tagName) r.attribs = { ...r.attribs, "data-locked": "true" };
    // Identité stable du bloc (vue en liste, corbeille) et bloc masqué : valeurs strictes
    if (r.tagName === tagName && BLOCK_ID.test(attribs["data-block-id"] || "")) r.attribs = { ...r.attribs, "data-block-id": attribs["data-block-id"] };
    if (r.tagName === tagName && attribs["data-hidden"] === "true") r.attribs = { ...r.attribs, "data-hidden": "true" };
    // Ancre HTML et classes supplémentaires (réglages communs des blocs) : valeurs strictes, mêmes règles que l'éditeur (src/editor/blog/supports.js)
    if (r.tagName === tagName && ANCHOR_ID.test(attribs.id || "")) r.attribs = { ...r.attribs, id: attribs.id };
    if (r.tagName === tagName && TONE_TAGS.has(tagName) && /^(accent|muted|primary)$/.test(attribs["data-tone"] || "")) r.attribs = { ...r.attribs, "data-tone": attribs["data-tone"] };
    // Visibilité par appareil : mobile, tablette, ordinateur (jamais les trois à la fois : un bloc masqué partout se masque avec « Masquer »)
    if (r.tagName === tagName && attribs["data-hide"]) {
      const devices = [...new Set(String(attribs["data-hide"]).split(/\s+/).filter((d) => ["mobile", "tablet", "desktop"].includes(d)))];
      if (devices.length && devices.length < 3) r.attribs = { ...r.attribs, "data-hide": ["mobile", "tablet", "desktop"].filter((d) => devices.includes(d)).join(" ") };
    }
    if (r.tagName === tagName && attribs["data-name"]) r.attribs = { ...r.attribs, "data-name": String(attribs["data-name"]).replace(/[\r\n\u2028\u2029]+/g, " ").trim().slice(0, 60) };
    if (r.tagName === tagName && attribs["data-variant"]) {
      const first = String(r.attribs.class || "").split(" ")[0];
      const allowed = VARIANTS[tagName] || VARIANTS[`${tagName}.${first}`] || [];
      if (allowed.includes(attribs["data-variant"])) r.attribs = { ...r.attribs, "data-variant": attribs["data-variant"] };
    }
    // Réglages de style communs (typographie, couleur, espacement, bordure, ombre, dimensions) : listes fermées ou couleur #rrggbb, voir src/shared/blockStyles.js
    if (r.tagName === tagName) {
      for (const p of STYLE_PROPS) {
        if (p.scope === "text" && !TONE_TAGS.has(tagName) && tagName !== "pre") continue;
        if (p.scope === "container" && !CONTAINER_CLASSES.has(String(r.attribs.class || "").split(" ")[0])) continue;
        const v = cleanValue(p.key, attribs[p.attr]);
        if (v) r.attribs = { ...r.attribs, [p.attr]: v };
      }
    }
    const extra = String(attribs["data-class"] || "").split(/\s+/).filter((c) => XCLASS_TOKEN.test(c)).slice(0, 5);
    if (r.tagName === tagName && extra.length) r.attribs = { ...r.attribs, "data-class": [...new Set(extra)].join(" ") };
    return r;
  };
}

const saveOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "s", "sup", "sub", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "hr", "blockquote", "code", "pre", "span", "mark",
    "div", "figure", "figcaption", "img", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col", "details", "summary", "label", "input"],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"], img: ["src", "alt", "title", "width", "height", "data-media-id"],
    figure: ["class", "data-align", "data-width", "data-credit", "data-main", "data-ratio", "data-lightbox", "data-fit"],
    div: ["class", "data-url", "data-src", "data-course", "data-callout", "data-columns", "data-tone", "data-title", "data-caption", "data-size", "data-size-mobile", "data-layout", "data-gap", "data-stack", "data-valign", "data-bg", "data-pad", "data-border", "data-width", "data-align", "data-poster", "data-autoplay", "data-muted", "data-loop", "data-nocontrols", "data-author", "data-gap", "data-ref", "data-label", "data-alt", "data-overlay", "data-height", "data-side", "data-download", "data-track", "data-track-lang", "data-track-label", "data-natural", "data-lightbox", "data-preload", "data-depth", "data-view", "data-date", "data-excerpt", "data-image", "data-category", "data-max", "data-placeholder", "data-button", "data-links", "data-count", "data-code", "data-sig", "data-preview", "data-fx", "data-fy", "data-fixed", "data-shade", "data-pos", "data-crop", "data-justify", "data-gridcols", "data-basis", "data-px"],
    details: ["class", "data-open"], ol: ["class", "data-title", "start", "reversed", "data-ltype"], ul: ["data-type", "data-ltype"], li: ["data-type", "data-checked"], input: ["type", "checked", "disabled"],
    p: ["style", "data-indent", "data-dropcap", "class", "data-align", "data-size", "data-radius", "data-width", "data-bg", "data-fg", "data-border"], h1: ["style", "data-indent"], h2: ["style", "data-indent"], h3: ["style", "data-indent"], h4: ["style", "data-indent"], h5: ["style", "data-indent"], h6: ["style", "data-indent"], blockquote: ["class", "data-cite"], sup: ["class", "data-note"], span: ["style"], mark: ["style"],
    td: ["colspan", "rowspan"], th: ["colspan", "rowspan"], code: ["class"], pre: ["class"], table: ["data-caption", "data-footer", "data-fixed"],
  },
  allowedClasses: false, // vérifiées une à une dans transformTags (listes blanches)
  // Taille du texte : seulement les 3 tailles proposées par l'éditeur (relatives au texte de l'article) ; police : seulement
  // les 4 familles du ruban du mode Document (polices chargées par le site ou familles système — src/editor/blog/documentMode.js)
  allowedStyles: { "*": { color: COLOR, "background-color": COLOR, "text-align": [/^(left|right|center|justify)$/], "font-size": [/^(0\.875|1\.25|1\.5)em$/], "font-family": [/^(Figtree, sans-serif|["']?Bricolage Grotesque["']?, sans-serif|Georgia, serif|ui-monospace, Menlo, monospace)$/] } },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags,
  exclusiveFilter: (frame) => (/^h[1-6]$/.test(frame.tag) && !frame.text.trim()) || (frame.tag === "span" && !frame.text.trim() && !Object.keys(frame.attribs).length),
};
// allowedClasses: false désactive le filtre de classes de sanitize-html ; nos transformations ne laissent passer que les classes listées
saveOptions.allowedAttributes["*"] = [];
for (const tag of LOCKABLE) saveOptions.allowedAttributes[tag] = [...(saveOptions.allowedAttributes[tag] || []), "data-locked", "data-block-id", "data-hidden", "id", "data-class", "data-variant", "data-name", "data-tone", "data-hide", ...STYLE_PROPS.map((p) => p.attr)];

function tidy(html) {
  return html
    .replace(/<(br|hr|input|img|col)([^>]*?)\s*\/>/g, "<$1$2>")
    .replace(/<(span|div)><\/\1>/g, "") // restes d'éléments refusés (image externe, bloc invalide)
    .replace(/\n{3,}/g, "\n\n");
}

// Version publique : les blocs masqués dans l'éditeur ne sont jamais publiés ; les repères internes de l'éditeur sont retirés
function withoutHidden(html) {
  if (!/data-hidden="true"|data-block-id=|data-name=/.test(html)) return html;
  const doc = parseDocument(html);
  for (const n of DomUtils.findAll((x) => x.attribs && x.attribs["data-hidden"] === "true", doc.children)) DomUtils.removeElement(n);
  for (const n of DomUtils.findAll((x) => x.attribs && (x.attribs["data-block-id"] || x.attribs["data-hidden"] || x.attribs["data-name"]), doc.children)) { delete n.attribs["data-block-id"]; delete n.attribs["data-hidden"]; delete n.attribs["data-name"]; }
  return render(doc.children, { encodeEntities: "utf8" });
}

// Deux blocs ne peuvent pas porter la même ancre : la première est conservée, les suivantes perdent leur ancre (le bloc reste, rien d'autre n'est modifié)
function uniqueAnchors(html) {
  if (!html.includes(' id="')) return html;
  const seen = new Set();
  return html.replace(/(<[a-z0-9]+\b[^>]*?) id="([a-z][a-z0-9_-]*)"/g, (m, head, id) => (seen.has(id) ? head : (seen.add(id), m)));
}

function sanitizeBlogHtml(html) {
  const source = typeof html === "string" ? html.slice(0, MAX_HTML).replace(/\r\n?/g, "\n") : ""; // les formulaires envoient des fins de ligne CRLF : le contenu enregistré a toujours \n
  if (!source.trim()) return "";
  const out = uniqueAnchors(tidy(sanitizeHtml(source, saveOptions)).trim());
  return /\S/.test(out.replace(/<[^>]*>/g, "")) || /<(img|hr|input|div class="kb-)/.test(out) ? out : "";
}

// D11 : ce que l'enregistrement va RETIRER ou aplatir, dit à la personne au lieu d'être perdu en silence.
// Ne modifie rien : lecture seule du HTML reçu, avec les mêmes règles que sanitizeBlogHtml. Retourne [{ kind, label, count }].
const KNOWN_TAGS = new Set([...saveOptions.allowedTags, "html", "head", "body"]);
function findUnsupported(html) {
  const source = typeof html === "string" ? html.slice(0, MAX_HTML) : "";
  if (!source.trim()) return [];
  const found = new Map();
  const note = (kind, label) => { const cur = found.get(kind) || { kind, label, count: 0 }; cur.count += 1; found.set(kind, cur); };
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.type !== "tag" && n.type !== "script" && n.type !== "style") continue;
      const a = n.attribs || {};
      if (!KNOWN_TAGS.has(n.name)) note(`tag:${n.name}`, `balise <${n.name}> non prise en charge`);
      else if (n.name === "img" && !IMG_SRC.test(String(a.src || "").trim())) note("img", "image hors médiathèque du site (adresse externe ou invalide)");
      else if (n.name === "a" && !SAFE_HREF.test(String(a.href || "").trim())) note("a", "lien dont l'adresse n'est pas autorisée");
      else if (n.name === "div") {
        const kb = classesOf(a).filter((c) => c.startsWith("kb-") && !DIV_CLASSES.includes(c));
        if (kb.length) note(`bloc:${kb[0]}`, `bloc « ${kb[0]} » inconnu (contenu conservé sans sa mise en forme)`);
        const main = classesOf(a).find((c) => DIV_CLASSES.includes(c));
        if ((main === "kb-video" || main === "kb-embed") && !MEDIA_URL.test(String(a["data-url"] || "").trim())) note("media", "vidéo ou intégration dont l'adresse n'est pas autorisée");
        if (main === "kb-audio" && !AUDIO_SRC.test(String(a["data-src"] || "").trim())) note("audio", "fichier audio non autorisé");
      }
      if (n.children) walk(n.children);
    }
  };
  walk(parseDocument(source).children);
  return [...found.values()];
}

// ---------- 2. Affichage ----------
const el = (name, attribs = {}, children = []) => {
  const node = new Element(name, attribs, children);
  children.forEach((c) => { c.parent = node; });
  return node;
};
const text = (value) => new Text(value);
const htmlNodes = (html) => parseDocument(html).children;
const hasClass = (node, c) => node.attribs && classesOf(node.attribs).includes(c);
const textOf = (node) => DomUtils.textContent(node).replace(/\s+/g, " ").trim();
const insideAny = (node, classes) => {
  for (let p = node.parent; p; p = p.parent) if (p.attribs && classes.some((c) => hasClass(p, c) || (c === "details" && p.name === "details"))) return true;
  return false;
};

// Carte Google Maps : uniquement l'adresse d'intégration officielle (Partager → Intégrer une carte)
const GOOGLE_MAP = /^https:\/\/www\.google\.com\/maps\/embed\?pb=[A-Za-z0-9!._%~:-]{10,2000}$/;
const VIDEO_FILE = /^\/uploads\/blog\/[A-Za-z0-9_.-]{1,200}\.(?:mp4|webm|mov|m4v|ogv)$/i;
function videoPlayer(url, caption, opts = {}) {
  const v = VIDEO_FILE.test(url) ? { kind: "file", src: url } : parseVideoUrl(url);
  if (!v) return null;
  let player;
  if (v.kind === "youtube" || v.kind === "vimeo") {
    player = el("div", { class: "kb-video-frame" }, [el("iframe", { src: v.src, title: caption || "Vidéo", loading: "lazy", allow: "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen", allowfullscreen: "", referrerpolicy: "strict-origin-when-cross-origin" })]);
  } else if (v.kind === "file" && /^\/uploads\//.test(v.src || url)) {
    const attrs = { src: v.src || url, ...(opts.nocontrols ? {} : { controls: "" }), preload: opts.preload || "metadata", playsinline: "" };
    if (opts.poster) attrs.poster = opts.poster;
    if (opts.loop) attrs.loop = "";
    // Lecture automatique : toujours muette (règle des navigateurs)
    if (opts.autoplay) { attrs.autoplay = ""; attrs.muted = ""; } else if (opts.muted) attrs.muted = "";
    const track = opts.track && TRACK_SRC.test(opts.track.src) ? [el("track", { kind: "subtitles", src: opts.track.src, srclang: opts.track.lang, label: opts.track.label, default: "" })] : [];
    player = el("video", attrs, [...track, text("Votre navigateur ne lit pas cette vidéo.")]);
  } else return null;
  return el("figure", { class: "kb-video" }, [player, ...(caption ? [el("figcaption", {}, [text(caption)])] : [])]);
}

// options : courseCard(slug) → HTML | null ; newsletterHtml → HTML | null ; tocDepth 2|3
function renderBlogHtml(html, { courseCard = () => null, newsletterHtml = null, tocDepth = 3, imageSize = () => null, imageVariants = () => [], reusableHtml = () => null, fileSize = () => null, widgets = null, allowCustomHtml = true, pageHref = (n) => `?page=${n}` } = {}) {
  // Blocs réutilisables synchronisés : contenu lu à l'affichage (une modification s'applique partout) ; jamais imbriqués
  const REF = /<div class="kb-reusable"[^>]*data-ref="(\d+)"[^>]*><\/div>/g;
  const clean = withoutHidden(sanitizeBlogHtml(html)).replace(REF, (m, id) => withoutHidden(sanitizeBlogHtml(reusableHtml(Number(id)) || "")).replace(REF, ""));
  const doc = parseDocument(clean);
  const toc = [];
  const pageBreaks = [];
  const tocBlocks = [];
  const footnotes = [];
  const faq = [];
  const howto = [];
  const images = [];
  const links = [];
  const usedIds = new Set();
  // Ancres saisies dans l'éditeur : réservées avant de fabriquer les ancres des titres (aucune collision) ; classes supplémentaires (data-class) déposées en class
  for (const n of DomUtils.findAll((x) => x.attribs && (x.attribs.id || x.attribs["data-class"]), doc.children)) {
    if (n.attribs.id) usedIds.add(n.attribs.id);
    if (n.attribs["data-class"]) { n.attribs.class = [n.attribs.class, n.attribs["data-class"]].filter(Boolean).join(" "); delete n.attribs["data-class"]; }
  }
  // Couleurs libres des réglages de style (déjà validées #rrggbb par la sanitisation) : déposées en variables CSS, jamais en style libre
  for (const n of DomUtils.findAll((x) => x.attribs && STYLE_PROPS.some((p) => p.color && x.attribs[p.attr]), doc.children)) {
    const css = colorStyleFromData(n.attribs);
    if (css) n.attribs.style = [n.attribs.style, css].filter(Boolean).join("; ");
  }
  const uniqueId = (t) => {
    const base = slugify(t).slice(0, 60) || "section";
    let id = base;
    for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
    usedIds.add(id);
    return id;
  };
  const replace = (node, replacement) => {
    if (!replacement) return DomUtils.removeElement(node);
    const nodes = Array.isArray(replacement) ? replacement : [replacement];
    // Un bloc remplacé par son lecteur (vidéo, formation…) garde son ancre et ses classes supplémentaires
    const first = nodes.find((n) => n && n.attribs);
    if (first && node.attribs) {
      if (node.attribs.id && !first.attribs.id) first.attribs.id = node.attribs.id;
      const extra = String(node.attribs.class || "").split(/\s+/).filter((c) => /^kb-x-/.test(c));
      if (extra.length) first.attribs.class = [first.attribs.class, ...extra].filter(Boolean).join(" ");
      // Réglages de style (marges, bordure, couleurs…) : portés par le lecteur qui remplace le bloc
      for (const p of STYLE_PROPS) if (node.attribs[p.attr] && !first.attribs[p.attr]) first.attribs[p.attr] = node.attribs[p.attr];
      if (node.attribs.style && !first.attribs.style) first.attribs.style = node.attribs.style;
    }
    nodes.forEach((n) => DomUtils.prepend(node, n));
    DomUtils.removeElement(node);
  };

  for (const node of DomUtils.findAll(() => true, doc.children)) {
    if (!node.parent && node !== doc && !doc.children.includes(node)) continue; // déjà retiré
    const name = node.name;
    if (/^h[1-6]$/.test(name)) {
      if (name === "h1") node.name = "h2", node.attribs.class = "rt-h1"; // la page a déjà son unique H1
      const level = Number(node.name[1]);
      const t = textOf(node);
      if (!t) continue;
      if (!node.attribs.id) node.attribs.id = uniqueId(t); // une ancre saisie par la personne est conservée telle quelle
      if ((level === 2 || (level === 3 && tocDepth >= 3) || (level === 4 && tocDepth >= 4)) && !insideAny(node, ["kb-cta", "callout", "kb-faq", "details"])) toc.push({ level, id: node.attribs.id, text: t, node });
    } else if (name === "img") {
      node.attribs.loading = "lazy";
      node.attribs.decoding = "async";
      // Dimensions réelles (médiathèque) : le navigateur réserve la place, le texte ne « saute » pas pendant le chargement
      if (!node.attribs.width || !node.attribs.height) {
        const size = imageSize(node.attribs.src);
        if (size && size.width > 0 && size.height > 0) { node.attribs.width = String(size.width); node.attribs.height = String(size.height); }
      }
      // Versions réduites WebP présentes : le navigateur choisit la taille adaptée à l'écran
      const variants = imageVariants(node.attribs.src) || [];
      if (variants.length) {
        const full = Number(node.attribs.width) || 0;
        node.attribs.srcset = [...variants.map((v) => `${v.src} ${v.w}w`), ...(full ? [`${node.attribs.src} ${full}w`] : [])].join(", ");
        node.attribs.sizes = "(max-width: 760px) 100vw, 760px";
      }
      images.push({ src: node.attribs.src, alt: node.attribs.alt || "" });
    } else if (name === "figure" && hasClass(node, "kb-image")) {
      const credit = node.attribs["data-credit"];
      if (node.attribs["data-width"] && node.attribs["data-width"] !== "100") node.attribs.style = `max-width: ${node.attribs["data-width"]}%`;
      // Agrandissement (lightbox) : l'image devient un bouton accessible, ouvert par public/js/article-lightbox.js ; jamais sur une image déjà cliquable (lien)
      const lightbox = node.attribs["data-lightbox"] === "true" || (node.parent && hasClass(node.parent, "kb-gallery") && node.parent.attribs["data-lightbox"] === "true");
      const pic = DomUtils.findOne((n) => n.name === "img", node.children, false);
      if (lightbox && pic) {
        const trigger = el("button", { type: "button", class: "kb-lightbox-trigger", "aria-label": `Agrandir l'image${pic.attribs.alt ? ` : ${pic.attribs.alt}` : ""}`, "aria-haspopup": "dialog" });
        DomUtils.prepend(pic, trigger);
        DomUtils.removeElement(pic);
        DomUtils.appendChild(trigger, pic);
      }
      if (credit) {
        let cap = DomUtils.findOne((n) => n.name === "figcaption", node.children);
        if (!cap) { cap = el("figcaption"); DomUtils.appendChild(node, cap); }
        DomUtils.appendChild(cap, el("span", { class: "kb-credit" }, [text(`Crédit : ${credit}`)]));
      }
    } else if (name === "p" && hasClass(node, "kb-button")) {
      // Couleurs choisies (validées #rrggbb à l'enregistrement) : variables CSS du bouton
      const vars = [["data-bg", "--kb-btn-bg"], ["data-fg", "--kb-btn-fg"], ["data-border", "--kb-btn-border"]].filter(([k]) => HEX.test(node.attribs[k] || "")).map(([k, v]) => `${v}: ${node.attribs[k]}`);
      if (vars.length) node.attribs.style = vars.join("; ");
    } else if (name === "a") {
      links.push({ href: node.attribs.href, internal: !/^https?:/i.test(node.attribs.href) });
    } else if (name === "div" && hasClass(node, "kb-video")) {
      const b = (k) => node.attribs[k] === "true";
      replace(node, videoPlayer(node.attribs["data-url"], node.attribs["data-caption"], { poster: node.attribs["data-poster"], autoplay: b("data-autoplay"), muted: b("data-muted"), loop: b("data-loop"), nocontrols: b("data-nocontrols"), preload: node.attribs["data-preload"], track: node.attribs["data-track"] ? { src: node.attribs["data-track"], lang: node.attribs["data-track-lang"] || "fr", label: node.attribs["data-track-label"] || "Sous-titres" } : null }));
    } else if (name === "div" && hasClass(node, "kb-embed")) {
      const url = node.attribs["data-url"];
      const player = videoPlayer(url, node.attribs["data-caption"]);
      const map = GOOGLE_MAP.test(url || "");
      if (map) replace(node, el("figure", { class: "kb-map" }, [el("div", { class: "kb-map-frame" }, [el("iframe", { src: url, title: node.attribs["data-caption"] || "Carte Google Maps", loading: "lazy", referrerpolicy: "no-referrer-when-downgrade", allowfullscreen: "" })]), ...(node.attribs["data-caption"] ? [el("figcaption", {}, [text(node.attribs["data-caption"])])] : [])]));
      else if (player) replace(node, player);
      else if (embedProvider(url)) {
        // Autres lecteurs reconnus (Spotify, SoundCloud, Dailymotion, Loom, TED) : adresse reconstruite par le serveur
        const e = embedProvider(url);
        const frame = el("iframe", { src: e.src, title: node.attribs["data-caption"] || e.title, loading: "lazy", allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture", allowfullscreen: "", referrerpolicy: "strict-origin-when-cross-origin", ...(e.sandboxAttr ? { sandbox: e.sandboxAttr } : {}) });
        replace(node, el("figure", { class: `kb-embed-frame kb-embed-${e.provider}`, ...(e.height ? { style: `--kb-embed-h: ${e.height}px` } : {}) }, [frame, ...(node.attribs["data-caption"] ? [el("figcaption", {}, [text(node.attribs["data-caption"])])] : [])]));
      } else {
        let host = url;
        try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* adresse relative */ }
        replace(node, el("p", { class: "kb-embed-link" }, [el("a", { href: url, target: "_blank", rel: "noopener noreferrer nofollow" }, [text(node.attribs["data-caption"] || `Voir le contenu sur ${host}`)])]));
      }
    } else if (name === "div" && hasClass(node, "kb-audio")) {
      const title = [node.attribs["data-title"], node.attribs["data-author"]].filter(Boolean).join(" — ");
      replace(node, el("figure", { class: "kb-audio" }, [el("audio", { src: node.attribs["data-src"], controls: "", preload: node.attribs["data-preload"] || "none", ...(node.attribs["data-loop"] === "true" ? { loop: "" } : {}) }, [text("Votre navigateur ne lit pas ce fichier audio.")]), ...(title ? [el("figcaption", {}, [text(title)])] : [])]));
    } else if (name === "div" && hasClass(node, "kb-file")) {
      // Bloc Fichier : lien de téléchargement avec type et poids du fichier
      const url = node.attribs["data-url"];
      const ext = (url.match(/\.([a-z0-9]+)$/i) || [])[1] || "";
      const title = node.attribs["data-title"] || decodeURIComponent(url.split("/").pop().replace(/^\d+-[0-9a-f]{16}-?/, "")) || "Fichier";
      const bytes = Number(fileSize(url)) || 0;
      const size = bytes ? ` · ${bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1).replace(".", ",")} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`}` : "";
      const dl = node.attribs["data-download"] === "true" ? { download: "" } : {};
      const preview = node.attribs["data-preview"] === "true" && /\.pdf$/i.test(url) ? [el("iframe", { class: "kb-file-preview", src: url, title: `Aperçu : ${title}`, loading: "lazy" })] : [];
      replace(node, el("div", { class: "kb-file" }, [
        el("a", { class: "kb-file-name", href: url, ...dl }, [text(title)]),
        el("span", { class: "kb-file-meta" }, [text(`${ext.toUpperCase()}${size}`)]),
        el("a", { class: "btn btn-outline kb-file-btn", href: url, ...dl, "aria-label": `Télécharger ${title}` }, [text("Télécharger")]),
        ...preview,
      ]));
    } else if (name === "div" && hasClass(node, "kb-cover")) {
      // Bloc Couverture : image de fond sous un voile, contenu par-dessus (l'image est une vraie balise <img>, jamais un style)
      const fx = node.attribs["data-fx"]; const fy = node.attribs["data-fy"];
      const img = el("img", { class: "kb-cover-img", src: node.attribs["data-src"], alt: node.attribs["data-alt"] || "", loading: "lazy", decoding: "async", ...(fx || fy ? { style: `object-position: ${fx || 50}% ${fy || 50}%` } : {}) });
      const shade = el("div", { class: "kb-cover-shade", "aria-hidden": "true" });
      const body = el("div", { class: "kb-cover-body" }, node.children.slice());
      body.children.forEach((c) => { c.parent = body; });
      node.children = [];
      DomUtils.appendChild(node, img);
      DomUtils.appendChild(node, shade);
      DomUtils.appendChild(node, body);
      delete node.attribs["data-src"]; delete node.attribs["data-alt"]; delete node.attribs["data-fx"]; delete node.attribs["data-fy"];
      images.push({ src: img.attribs.src, alt: img.attribs.alt });
    } else if (name === "table") {
      if (node.attribs["data-caption"]) { DomUtils.prepend(node.children[0] || node, el("caption", {}, [text(node.attribs["data-caption"])])); delete node.attribs["data-caption"]; }
      // Ligne de pied : la dernière ligne du corps devient un <tfoot>
      if (node.attribs["data-footer"] === "true") {
        const body = [...node.children].reverse().find((c) => c.name === "tbody");
        const rows = body ? body.children.filter((c) => c.name === "tr") : [];
        if (rows.length > 1) { const last = rows[rows.length - 1]; DomUtils.removeElement(last); DomUtils.appendChild(node, el("tfoot", {}, [last])); }
        delete node.attribs["data-footer"];
      }
    } else if (name === "div" && hasClass(node, "kb-html")) {
      // HTML personnalisé : restitué seulement si la signature du compte créateur est valide (src/utils/customHtml.js)
      const code = node.attribs["data-code"];
      if (allowCustomHtml && customHtml.verify(code, node.attribs["data-sig"])) replace(node, el("div", { class: "kb-html-block" }, htmlNodes(customHtml.decode(code))));
      else replace(node, null);
    } else if (name === "div" && hasClass(node, "kb-nextpage")) {
      pageBreaks.push(node);
    } else if (name === "div" && hasClass(node, "kb-toc")) {
      tocBlocks.push(node);
    } else if (name === "div" && widgets && blogDynamic.BUILDERS[classesOf(node.attribs).find((c) => blogDynamic.BUILDERS[c])]) {
      const built = blogDynamic.BUILDERS[classesOf(node.attribs).find((c) => blogDynamic.BUILDERS[c])](node.attribs, { widgets });
      replace(node, built);
    } else if (name === "div" && dynamicBlocks.BY_CLASS.has(classesOf(node.attribs)[0])) {
      replace(node, null); // bloc dynamique sans données (aperçu hors site) : rien n'est affiché plutôt qu'un cadre vide
    } else if (name === "sup" && hasClass(node, "kb-fn")) {
      footnotes.push(node);
    } else if (name === "div" && hasClass(node, "kb-course")) {
      const card = courseCard(node.attribs["data-course"]);
      replace(node, card ? htmlNodes(card) : null);
    } else if (name === "div" && hasClass(node, "kb-newsletter")) {
      replace(node, newsletterHtml ? htmlNodes(newsletterHtml) : null);
    } else if (name === "div" && hasClass(node, "callout")) {
      const type = node.attribs["data-callout"];
      node.attribs.role = "note";
      DomUtils.prepend(node.children[0] || node, el("p", { class: "callout-title" }, [text(node.attribs["data-title"] || CALLOUTS[type] || "Information")]));
      if (!node.children.length) DomUtils.appendChild(node, el("p", { class: "callout-title" }, [text(CALLOUTS[type])]));
      delete node.attribs["data-title"];
    } else if (name === "blockquote" && node.attribs["data-cite"]) {
      DomUtils.appendChild(node, el("cite", {}, [text(node.attribs["data-cite"])]));
      delete node.attribs["data-cite"];
    } else if (name === "div" && hasClass(node, "kb-columns") && node.attribs["data-layout"] === "custom") {
      // Largeurs libres : chaque colonne porte son pourcentage ; les autres se partagent le reste à parts égales
      const cols = node.children.filter((c) => hasClass(c, "kb-column"));
      const set = cols.map((c) => Number(c.attribs["data-basis"]) || 0);
      const free = set.filter((v) => !v).length;
      const rest = Math.max(5, 100 - set.reduce((a, b) => a + b, 0));
      node.attribs.style = `--kb-cols: ${set.map((v) => `${v || Math.round((rest / (free || 1)) * 10) / 10}fr`).join(" ")}`;
      cols.forEach((c) => { delete c.attribs["data-basis"]; });
    } else if (name === "div" && hasClass(node, "kb-spacer") && node.attribs["data-px"]) {
      node.attribs.style = `--kb-px: ${node.attribs["data-px"]}px`;
    } else if (name === "details" && node.attribs["data-open"] === "true") {
      node.attribs.open = ""; delete node.attribs["data-open"]; // accordéon ouvert par défaut
    } else if (name === "details" && hasClass(node, "kb-faq-item")) {
      const summary = DomUtils.findOne((n) => n.name === "summary", node.children, false);
      const q = summary ? textOf(summary) : "";
      const answer = node.children.filter((n) => n !== summary);
      const a = answer.map((n) => (n.type === "text" ? n.data : textOf(n))).join(" ").replace(/\s+/g, " ").trim();
      if (q && a) faq.push({ q, a });
    } else if (name === "ol" && hasClass(node, "kb-steps")) {
      const steps = node.children.filter((n) => n.name === "li").map((li) => {
        const strong = DomUtils.findOne((n) => n.name === "strong", li.children);
        const full = textOf(li);
        const stepName = strong ? textOf(strong) : full.slice(0, 80);
        const stepText = strong ? full.replace(stepName, "").trim() || full : full;
        return { name: stepName, text: stepText };
      }).filter((s) => s.name);
      if (steps.length >= 2) howto.push({ name: node.attribs["data-title"] || "", steps });
    }
  }
  // Découpage en pages (bloc « Page suivante ») : chaque repère ouvre une nouvelle page ; le sommaire sait dans quelle page se trouve chaque titre
  const topIndex = (node) => { let n = node; while (n && n.parent && n.parent !== doc) n = n.parent; return doc.children.indexOf(n); };
  const breakAt = pageBreaks.map(topIndex).filter((i) => i >= 0).sort((x, y) => x - y);
  const pageOf = (node) => 1 + breakAt.filter((i) => i < topIndex(node)).length;
  for (const t of toc) { t.page = pageOf(t.node); delete t.node; }
  // Notes de bas de page : numérotées dans l'ordre du texte ; la liste est en fin d'article (en fin de chaque page si l'article est découpé), avec lien de retour
  const notes = footnotes.map((sup, i) => {
    const n = i + 1;
    const refId = uniqueId(`fnref-${n}`); const noteId = uniqueId(`fn-${n}`);
    const page = pageOf(sup);
    DomUtils.prepend(sup, el("sup", { class: "kb-fn-ref", id: refId }, [el("a", { href: `#${noteId}`, "aria-label": `Note ${n}` }, [text(String(n))])]));
    DomUtils.removeElement(sup);
    return { page, item: () => el("li", { id: noteId, value: String(n) }, [text(sup.attribs["data-note"]), text(" "), el("a", { href: `#${refId}`, class: "kb-fn-back", "aria-label": `Retour au texte (note ${n})` }, [text("↩")])]) };
  });
  const notesAside = (list) => el("aside", { class: "kb-footnotes", "aria-label": "Notes de bas de page" }, [el("ol", {}, list.map((x) => x.item()))]);
  // Sommaire en bloc : liste des titres de l'article (page de chaque titre comprise)
  for (const node of tocBlocks) replace(node, blogDynamic.toc(node.attribs, toc, (n) => (breakAt.length ? pageHref(n) : "")));
  let pages = null;
  if (breakAt.length) {
    const kids = doc.children.slice();
    const cuts = [0, ...breakAt, kids.length];
    pages = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const slice = kids.slice(cuts[i], cuts[i + 1]).filter((k) => !pageBreaks.includes(k));
      const mine = notes.filter((x) => x.page === i + 1);
      pages.push(render([...slice, ...(mine.length ? [notesAside(mine)] : [])], { encodeEntities: "utf8" }));
    }
    pages = pages.filter((p) => /\S/.test(p.replace(/<[^>]*>/g, "")) || /<(img|figure|iframe|hr)/.test(p));
    if (pages.length < 2) pages = null;
  }
  if (notes.length) DomUtils.appendChild(doc, notesAside(notes));
  for (const node of pageBreaks) DomUtils.removeElement(node);
  const out = render(doc, { encodeEntities: "utf8" });
  const plainOf = (nodes) => nodes.map((n) => (n.type === "text" ? n.data : n.attribs && (hasClass(n, "kb-html-block") || n.name === "script" || n.name === "style") ? "" : plainOf(n.children || []))).join(" ");
  const plain = plainOf(doc.children);
  const words = (plain.match(/[\p{L}\p{N}’']+/gu) || []).length;
  return { html: out, pages, toc, words, minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)), images, links, faq, howto };
}

// Texte brut d'un contenu (analyse, résumé automatique)
function blogPlainText(html) {
  return DomUtils.textContent(parseDocument(withoutHidden(sanitizeBlogHtml(html)))).replace(/\s+/g, " ").trim();
}

// Texte qui précède le bloc « Lire la suite » (résumé automatique d'un article sans extrait saisi) ; "" s'il n'y a pas de repère
function excerptBeforeMore(html, max = 300) {
  const clean = sanitizeBlogHtml(html);
  const at = clean.search(/<div class="kb-more"/);
  if (at <= 0) return "";
  const text = blogPlainText(clean.slice(0, at).replace(/<\/(p|h[1-6]|li|blockquote|div)>/g, "</$1> "));
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40))}…`;
}

// ---------- 3. Ancien article Markdown → HTML de l'éditeur ----------
function markdownToEditorHtml(markdown) {
  const { html } = renderArticle(markdown, { courseCard: (slug) => `<div class="kb-course" data-course="${slug}"></div>` });
  const converted = html
    .replace(/<aside class="callout callout-([a-z-]+)" role="note"><p class="callout-title">([^<]*)<\/p>/g, (m, type, title) => `<div class="callout callout-${type}" data-callout="${type}"${title && title !== CALLOUTS[type] ? ` data-title="${title}"` : ""}>`)
    .replace(/<\/aside>/g, "</div>")
    .replace(/<figure class="article-figure">/g, '<figure class="kb-image" data-align="center">')
    .replace(/<p class="article-cta">/g, '<p class="kb-button" data-align="center">')
    .replace(/ loading="lazy" decoding="async"/g, "")
    .replace(/<h([23]) id="[^"]*">/g, "<h$1>");
  return sanitizeBlogHtml(converted);
}

module.exports = { sanitizeBlogHtml, findUnsupported, excerptBeforeMore, renderBlogHtml, blogPlainText, withoutHidden, markdownToEditorHtml, CALLOUT_TYPES, WORDS_PER_MINUTE };
