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
const { parseVideoUrl } = require("./video");
const { renderArticle, CALLOUTS } = require("./articleMarkdown");

const MAX_HTML = 300000;
const WORDS_PER_MINUTE = 230;
const CALLOUT_TYPES = Object.keys(CALLOUTS); // conseil, a-retenir, bon-a-savoir, info, attention
const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d{1,3})\s*)?\)$/i, /^var\(--kb-[a-z]{2,12}\)$/];
const SAFE_HREF = /^(https?:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+|\/(?!\/)[^\s"'<>]*|#[a-z0-9-]{1,80})$/i;
const IMG_SRC = /^\/uploads\/thumbnails\/[A-Za-z0-9_.-]{1,200}\.(?:png|jpe?g|webp|gif|avif)$/i; // images publiques du site uniquement
const AUDIO_SRC = /^\/uploads\/blog\/[A-Za-z0-9_.-]{1,200}\.(?:mp3|m4a|ogg|oga|wav|aac)$/i;
const MEDIA_URL = /^(https:\/\/[^\s"'<>]{1,500}|\/uploads\/blog\/[A-Za-z0-9_.-]{1,200})$/i;
const COURSE_SLUG = /^[a-z0-9-]{1,120}$/;
const REL_TOKENS = new Set(["nofollow", "sponsored", "ugc", "noopener", "noreferrer"]);
const DIV_CLASSES = ["kb-reusable", "kb-spacer", "kb-pagebreak", "kb-columns", "kb-column", "kb-group", "kb-buttons", "kb-gallery", "kb-video", "kb-audio", "kb-embed", "kb-course", "kb-newsletter", "kb-cta", "kb-faq", "kb-faq-answer", "kb-accordion-body", "kb-compare", "kb-compare-col", "kb-step-body", "callout", ...CALLOUT_TYPES.map((t) => `callout-${t}`)];

// Mises en page des colonnes : largeurs en %, 2 à 4 colonnes
const COLUMN_LAYOUT = /^(50-50|33-67|67-33|25-75|75-25|33-33-33|25-50-25|50-25-25|25-25-50|25-25-25-25)$/;
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
    }
    if (main === "kb-audio" && attribs["data-author"]) out["data-author"] = String(attribs["data-author"]).slice(0, 120);
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
    if (main === "kb-spacer") { keep("data-size", /^(s|m|l|xl)$/); keep("data-size-mobile", /^(s|m|l|xl)$/); }
    if (main === "kb-columns") { keep("data-layout", COLUMN_LAYOUT); keep("data-gap", /^(none|s|m|l)$/); keep("data-stack", /^(mobile|tablet|never)$/); keep("data-valign", /^(top|center|bottom)$/); }
    if (main === "kb-group") { keep("data-bg", /^(none|light|accent|dark|warm)$/); keep("data-pad", /^(none|s|m|l)$/); keep("data-border", /^(true)$/); keep("data-width", /^(normal|wide)$/); }
    if (main === "kb-buttons") keep("data-align", /^(left|center|right)$/);
    if (main === "kb-reusable") { keep("data-ref", /^\d{1,9}$/); if (!out["data-ref"]) return { tagName: "div", attribs: {} }; }
    if (main === "kb-compare-col" && /^(pro|con|neutral)$/.test(attribs["data-tone"] || "")) out["data-tone"] = attribs["data-tone"];
    Object.assign(out, pick(attribs, ["data-title", "data-caption"]));
    return { tagName: "div", attribs: out };
  },
  details: (tagName, attribs) => ({ tagName, attribs: { class: keepClasses(attribs, ["kb-accordion", "kb-faq-item"]) || "kb-accordion" } }),
  ol: (tagName, attribs) => {
    const out = {};
    if (classesOf(attribs).includes("kb-steps")) { out.class = "kb-steps"; Object.assign(out, pick(attribs, ["data-title"])); }
    if (/^\d{1,4}$/.test(String(attribs.start || ""))) out.start = String(attribs.start);
    return { tagName, attribs: out };
  },
  ul: (tagName, attribs) => ({ tagName, attribs: attribs["data-type"] === "taskList" ? { "data-type": "taskList" } : {} }),
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
    if (classesOf(attribs).includes("kb-button")) {
      out.class = "kb-button";
      if (/^(left|center|right)$/.test(attribs["data-align"] || "")) out["data-align"] = attribs["data-align"];
      for (const [k, re] of [["data-size", /^(s|m|l)$/], ["data-radius", /^(none|s|pill)$/], ["data-width", /^(auto|full)$/], ["data-bg", HEX], ["data-fg", HEX], ["data-border", HEX]]) if (re.test(String(attribs[k] || ""))) out[k] = attribs[k];
    }
    return { tagName, attribs: out };
  },
  td: (tagName, attribs) => ({ tagName, attribs: pick(attribs, ["colspan", "rowspan"]) }),
  th: (tagName, attribs) => ({ tagName, attribs: pick(attribs, ["colspan", "rowspan"]) }),
  pre: (tagName) => ({ tagName, attribs: {} }),
  code: (tagName, attribs) => ({ tagName, attribs: /^language-[a-z0-9+-]{1,20}$/.test(attribs.class || "") ? { class: attribs.class } : {} }),
};
for (const h of ["h1", "h2", "h3", "h4", "h5", "h6"]) transformTags[h] = (tagName, attribs) => ({ tagName, attribs: pick(attribs, ["style"]) });
transformTags.hr = (tagName) => ({ tagName, attribs: {} });
transformTags.blockquote = (tagName, attribs) => ({ tagName, attribs: classesOf(attribs).includes("kb-pullquote") ? { class: "kb-pullquote" } : {} });
transformTags.table = (tagName) => ({ tagName, attribs: {} });
// Bloc verrouillé dans l'éditeur (protection contre les modifications accidentelles) : marqueur conservé, valeur stricte
const LOCKABLE = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol", "pre", "table", "figure", "div", "details", "hr"];
for (const tag of LOCKABLE) {
  const base = transformTags[tag];
  transformTags[tag] = (tagName, attribs) => {
    const r = base ? base(tagName, attribs) : { tagName, attribs: {} };
    if (attribs["data-locked"] === "true" && r.tagName === tagName) r.attribs = { ...r.attribs, "data-locked": "true" };
    return r;
  };
}

const saveOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "s", "sup", "sub", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "hr", "blockquote", "code", "pre", "span", "mark",
    "div", "figure", "figcaption", "img", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col", "details", "summary", "label", "input"],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"], img: ["src", "alt", "title", "width", "height", "data-media-id"],
    figure: ["class", "data-align", "data-width", "data-credit", "data-main", "data-ratio"],
    div: ["class", "data-url", "data-src", "data-course", "data-callout", "data-columns", "data-tone", "data-title", "data-caption", "data-size", "data-size-mobile", "data-layout", "data-gap", "data-stack", "data-valign", "data-bg", "data-pad", "data-border", "data-width", "data-align", "data-poster", "data-autoplay", "data-muted", "data-loop", "data-nocontrols", "data-author", "data-gap", "data-ref"],
    details: ["class"], ol: ["class", "data-title", "start"], ul: ["data-type"], li: ["data-type", "data-checked"], input: ["type", "checked", "disabled"],
    p: ["style", "class", "data-align", "data-size", "data-radius", "data-width", "data-bg", "data-fg", "data-border"], h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"], blockquote: ["class"], span: ["style"], mark: ["style"],
    td: ["colspan", "rowspan"], th: ["colspan", "rowspan"], code: ["class"],
  },
  allowedClasses: false, // vérifiées une à une dans transformTags (listes blanches)
  allowedStyles: { "*": { color: COLOR, "background-color": COLOR, "text-align": [/^(left|right|center|justify)$/] } },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags,
  exclusiveFilter: (frame) => (/^h[1-6]$/.test(frame.tag) && !frame.text.trim()) || (frame.tag === "span" && !frame.text.trim() && !Object.keys(frame.attribs).length),
};
// allowedClasses: false désactive le filtre de classes de sanitize-html ; nos transformations ne laissent passer que les classes listées
saveOptions.allowedAttributes["*"] = [];
for (const tag of LOCKABLE) saveOptions.allowedAttributes[tag] = [...(saveOptions.allowedAttributes[tag] || []), "data-locked"];

function tidy(html) {
  return html
    .replace(/<(br|hr|input|img|col)([^>]*?)\s*\/>/g, "<$1$2>")
    .replace(/<(span|div)><\/\1>/g, "") // restes d'éléments refusés (image externe, bloc invalide)
    .replace(/\n{3,}/g, "\n\n");
}

function sanitizeBlogHtml(html) {
  const source = typeof html === "string" ? html.slice(0, MAX_HTML) : "";
  if (!source.trim()) return "";
  const out = tidy(sanitizeHtml(source, saveOptions)).trim();
  return /\S/.test(out.replace(/<[^>]*>/g, "")) || /<(img|hr|input|div class="kb-)/.test(out) ? out : "";
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
    const attrs = { src: v.src || url, ...(opts.nocontrols ? {} : { controls: "" }), preload: "metadata", playsinline: "" };
    if (opts.poster) attrs.poster = opts.poster;
    if (opts.loop) attrs.loop = "";
    // Lecture automatique : toujours muette (règle des navigateurs)
    if (opts.autoplay) { attrs.autoplay = ""; attrs.muted = ""; } else if (opts.muted) attrs.muted = "";
    player = el("video", attrs, [text("Votre navigateur ne lit pas cette vidéo.")]);
  } else return null;
  return el("figure", { class: "kb-video" }, [player, ...(caption ? [el("figcaption", {}, [text(caption)])] : [])]);
}

// options : courseCard(slug) → HTML | null ; newsletterHtml → HTML | null ; tocDepth 2|3
function renderBlogHtml(html, { courseCard = () => null, newsletterHtml = null, tocDepth = 3, imageSize = () => null, imageVariants = () => [], reusableHtml = () => null } = {}) {
  // Blocs réutilisables synchronisés : contenu lu à l'affichage (une modification s'applique partout) ; jamais imbriqués
  const REF = /<div class="kb-reusable"[^>]*data-ref="(\d+)"[^>]*><\/div>/g;
  const clean = sanitizeBlogHtml(html).replace(REF, (m, id) => sanitizeBlogHtml(reusableHtml(Number(id)) || "").replace(REF, ""));
  const doc = parseDocument(clean);
  const toc = [];
  const faq = [];
  const howto = [];
  const images = [];
  const links = [];
  const usedIds = new Set();
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
      node.attribs.id = uniqueId(t);
      if ((level === 2 || (level === 3 && tocDepth >= 3)) && !insideAny(node, ["kb-cta", "callout", "kb-faq", "details"])) toc.push({ level, id: node.attribs.id, text: t });
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
      replace(node, videoPlayer(node.attribs["data-url"], node.attribs["data-caption"], { poster: node.attribs["data-poster"], autoplay: b("data-autoplay"), muted: b("data-muted"), loop: b("data-loop"), nocontrols: b("data-nocontrols") }));
    } else if (name === "div" && hasClass(node, "kb-embed")) {
      const url = node.attribs["data-url"];
      const player = videoPlayer(url, node.attribs["data-caption"]);
      const map = GOOGLE_MAP.test(url || "");
      if (map) replace(node, el("figure", { class: "kb-map" }, [el("div", { class: "kb-map-frame" }, [el("iframe", { src: url, title: node.attribs["data-caption"] || "Carte Google Maps", loading: "lazy", referrerpolicy: "no-referrer-when-downgrade", allowfullscreen: "" })]), ...(node.attribs["data-caption"] ? [el("figcaption", {}, [text(node.attribs["data-caption"])])] : [])]));
      else if (player) replace(node, player);
      else {
        let host = url;
        try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* adresse relative */ }
        replace(node, el("p", { class: "kb-embed-link" }, [el("a", { href: url, target: "_blank", rel: "noopener noreferrer nofollow" }, [text(node.attribs["data-caption"] || `Voir le contenu sur ${host}`)])]));
      }
    } else if (name === "div" && hasClass(node, "kb-audio")) {
      const title = [node.attribs["data-title"], node.attribs["data-author"]].filter(Boolean).join(" — ");
      replace(node, el("figure", { class: "kb-audio" }, [el("audio", { src: node.attribs["data-src"], controls: "", preload: "none" }, [text("Votre navigateur ne lit pas ce fichier audio.")]), ...(title ? [el("figcaption", {}, [text(title)])] : [])]));
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
  const out = render(doc, { encodeEntities: "utf8" });
  const plain = DomUtils.textContent(doc);
  const words = (plain.match(/[\p{L}\p{N}’']+/gu) || []).length;
  return { html: out, toc, words, minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)), images, links, faq, howto };
}

// Texte brut d'un contenu (analyse, résumé automatique)
function blogPlainText(html) {
  return DomUtils.textContent(parseDocument(sanitizeBlogHtml(html))).replace(/\s+/g, " ").trim();
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

module.exports = { sanitizeBlogHtml, renderBlogHtml, blogPlainText, markdownToEditorHtml, CALLOUT_TYPES, WORDS_PER_MINUTE };
