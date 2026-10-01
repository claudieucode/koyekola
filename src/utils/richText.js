// Texte riche des formations (éditeur de la fiche) : assainissement, conversions et extraction.
//
// Le formateur écrit dans un éditeur qui produit du HTML. Ce HTML n'est JAMAIS fait confiance :
//  - il est assaini par LISTE BLANCHE à l'enregistrement (sanitizeRich / normalizeList),
//  - et assaini de nouveau à chaque affichage (renderRich), au cas où la base aurait été modifiée autrement.
// Seuls les balises, attributs et styles précis ci-dessous survivent ; tout le reste est retiré
// (script, iframe, img, svg, formulaires, gestionnaires onclick…, styles non prévus).
const sanitizeHtml = require("sanitize-html");
const { parseDocument } = require("htmlparser2");
const { getOuterHTML, textContent } = require("domutils");
const { renderMarkdown } = require("./markdown");
const { listLines, inlineMarkdownToHtml, stripMarkdown, audienceFromText, audienceFromItems } = require("./profiles");

const MAX_HTML = 100000; // au-delà, le texte est tronqué avant tout traitement (protection contre les envois géants)
const MAX_ITEMS = 30; // éléments d'une liste (objectifs, prérequis…)

// ---------- Valeurs de style acceptées ----------
const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d{1,3})\s*)?\)$/i];
const ALLOWED_STYLES = {
  "*": {
    color: COLOR,
    "background-color": COLOR,
    "text-align": [/^(left|right|center|justify)$/],
    "font-size": [/^(0\.875|1\.25|1\.5)em$/],
    "font-family": [/^(Georgia, serif|monospace|Arial, sans-serif)$/],
  },
};

const SAFE_HREF = /^(https?:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+|\/(?!\/)[^\s"'<>]*)$/i;

const inRange = (value, min, max) => /^\d{1,2}$/.test(String(value)) && Number(value) >= min && Number(value) <= max;

// ---------- Transformations de balises (validation des valeurs d'attributs) ----------
const transformTags = {
  b: "strong",
  i: "em",
  strike: "s",
  del: "s",
  a: (tagName, attribs) => {
    const href = String(attribs.href || "").trim();
    if (!SAFE_HREF.test(href)) return { tagName: "a", attribs: {} };
    // Adresse externe : nouvel onglet, sans transmettre l'origine ni l'autorité de référencement
    if (/^https?:/i.test(href)) return { tagName: "a", attribs: { href, target: "_blank", rel: "noopener noreferrer nofollow" } };
    return { tagName: "a", attribs: { href } };
  },
  input: (tagName, attribs) => {
    if (String(attribs.type).toLowerCase() !== "checkbox") return { tagName: "span", attribs: {} };
    // Case à cocher d'une liste de tâches : jamais modifiable par le visiteur
    return { tagName: "input", attribs: { type: "checkbox", ...(attribs.checked !== undefined ? { checked: "checked" } : {}), disabled: "disabled" } };
  },
  ul: (tagName, attribs) => ({ tagName, attribs: attribs["data-type"] === "taskList" ? { "data-type": "taskList" } : {} }),
  li: (tagName, attribs) => {
    const out = {};
    if (attribs["data-type"] === "taskItem") {
      out["data-type"] = "taskItem";
      out["data-checked"] = attribs["data-checked"] === "true" ? "true" : "false";
    }
    return { tagName, attribs: out };
  },
};
for (const heading of ["p", "h1", "h2", "h3"]) {
  transformTags[heading] = (tagName, attribs) => {
    const out = {};
    if (attribs.style) out.style = attribs.style;
    if (inRange(attribs["data-indent"], 1, 6)) out["data-indent"] = String(Number(attribs["data-indent"]));
    return { tagName, attribs: out };
  };
}

const RICH_TAGS = ["p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "ul", "ol", "li", "a", "hr", "blockquote", "code", "pre", "span", "mark", "div", "label", "input"];
const INLINE_TAGS = ["strong", "em", "u", "s", "a", "br", "span", "mark"];

const baseOptions = {
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href"],
  allowProtocolRelative: false,
  allowedStyles: ALLOWED_STYLES,
  disallowedTagsMode: "discard",
  // Un titre vide serait une erreur d'accessibilité (lecteurs d'écran) : il est retiré
  exclusiveFilter: (frame) => /^h[1-3]$/.test(frame.tag) && !frame.text.trim(),
};
const richOptions = {
  ...baseOptions,
  allowedTags: RICH_TAGS,
  allowedAttributes: {
    a: ["href", "target", "rel"],
    p: ["style", "data-indent"], h1: ["style", "data-indent"], h2: ["style", "data-indent"], h3: ["style", "data-indent"],
    span: ["style"], mark: ["style"],
    ul: ["data-type"], li: ["data-type", "data-checked"],
    input: ["type", "checked", "disabled"],
  },
  transformTags,
};
const inlineOptions = {
  ...baseOptions,
  allowedTags: INLINE_TAGS,
  allowedAttributes: { a: ["href", "target", "rel"], span: ["style"], mark: ["style"] },
  transformTags: { b: "strong", i: "em", strike: "s", del: "s", a: transformTags.a },
};
// Affichage public : un H1 saisi dans le texte devient un H2 (le titre de la page est déjà l'unique H1)
const publicOptions = {
  ...richOptions,
  allowedClasses: { h2: ["rt-h1"] },
  transformTags: { ...transformTags, h1: (tagName, attribs) => ({ tagName: "h2", attribs: { ...(attribs.style ? { style: attribs.style } : {}), class: "rt-h1" } }) },
};

// Mise en forme de sortie : <br>, <hr> et <input> sans « / », et styles écrits « propriété: valeur; »
function tidy(html) {
  return html
    .replace(/<(br|hr|input)([^>]*?)\s*\/>/g, "<$1$2>")
    .replace(/ style="([^"]*)"/g, (m, style) => {
      const declarations = style.split(";").map((d) => d.trim()).filter(Boolean).map((d) => d.replace(/^([a-z-]+)\s*:\s*/i, "$1: "));
      return declarations.length ? ` style="${declarations.join("; ")}"` : "";
    });
}

const hasContent = (html) => /\S/.test(html.replace(/<[^>]*>/g, "")) || /<hr>|<input/.test(html);

function run(html, options) {
  const source = typeof html === "string" ? html.slice(0, MAX_HTML) : "";
  if (!source.trim()) return "";
  const out = tidy(sanitizeHtml(source, options)).trim();
  return hasContent(out) ? out : "";
}

// Texte riche complet (description) — c'est ce qui est enregistré
const sanitizeRich = (html) => run(html, richOptions);
// Mise en forme dans une ligne seulement (éléments de liste)
const sanitizeInline = (html) => run(html, inlineOptions);
// Ce qui est affiché au public : assaini une seconde fois, avec H1 → H2
const renderRich = (html) => run(sanitizeRich(html), publicOptions);

// ---------- Extraction des éléments d'une liste (« un élément par ligne ») ----------
const BLOCK_TAGS = new Set(["p", "h1", "h2", "h3", "blockquote", "div", "pre"]);
const isTag = (node, names) => node.type === "tag" && (Array.isArray(names) ? names : [names]).includes(node.name);
const serialize = (nodes) => nodes.map((n) => getOuterHTML(n, { encodeEntities: "utf8" })).join("");

// Un tableau de HTML par bloc de texte (les <p>, <div>… deviennent des blocs ; la case à cocher est ignorée)
function inlineBlocks(nodes) {
  const blocks = [];
  let buffer = [];
  const flush = () => {
    if (buffer.length) blocks.push(serialize(buffer));
    buffer = [];
  };
  for (const node of nodes) {
    if (node.type === "tag" && BLOCK_TAGS.has(node.name)) {
      flush();
      blocks.push(...inlineBlocks(node.children));
    } else if (isTag(node, ["label", "input"])) {
      continue;
    } else {
      buffer.push(node);
    }
  }
  flush();
  return blocks;
}

function pushItem(out, html) {
  const clean = sanitizeInline(html);
  if (!clean) return;
  out.push({ html: clean, text: textOf(parseDocument(clean)) });
}

function collectItems(nodes, out) {
  let loose = [];
  const flushLoose = () => {
    if (loose.length) pushItem(out, serialize(loose));
    loose = [];
  };
  for (const node of nodes) {
    if (isTag(node, ["ul", "ol"])) {
      flushLoose();
      for (const li of node.children.filter((c) => isTag(c, "li"))) {
        const nested = li.children.filter((c) => isTag(c, ["ul", "ol"]));
        const own = li.children.filter((c) => !isTag(c, ["ul", "ol"]));
        pushItem(out, inlineBlocks(own).filter((b) => /\S/.test(b.replace(/<[^>]*>/g, ""))).join("<br>"));
        collectItems(nested, out);
      }
    } else if (node.type === "tag" && BLOCK_TAGS.has(node.name)) {
      flushLoose();
      pushItem(out, inlineBlocks(node.children).join("<br>"));
    } else {
      loose.push(node);
    }
  }
  flushLoose();
}

// Éléments [{ html, text }] d'un champ « liste », 30 au plus
function listItems(html) {
  const clean = sanitizeRich(html);
  if (!clean) return [];
  const out = [];
  collectItems(parseDocument(clean).children, out);
  return out.slice(0, MAX_ITEMS);
}

// Forme enregistrée d'un champ « liste » : une liste à puces plate, mise en forme en ligne conservée
function normalizeList(html) {
  const items = listItems(html);
  return items.length ? `<ul>${items.map((i) => `<li>${i.html}</li>`).join("")}</ul>` : "";
}

// ---------- Texte brut et blocs (PDF, description pour Google) ----------
function textOf(node) {
  if (node.type === "text") return node.data;
  if (isTag(node, "br")) return " ";
  return (node.children || []).map(textOf).join("");
}
const flat = (value) => value.replace(/\s+/g, " ").trim();

// Blocs [{ type: "heading" | "paragraph" | "bullet" | "number", text, n?, depth }] dans l'ordre du texte
function descriptionBlocks(html) {
  const clean = sanitizeRich(html);
  if (!clean) return [];
  const blocks = [];
  const walkList = (list, depth) => {
    let n = 0;
    for (const li of list.children.filter((c) => isTag(c, "li"))) {
      n += 1;
      const own = li.children.filter((c) => !isTag(c, ["ul", "ol"]));
      const text = flat(own.map(textOf).join(" "));
      if (text) blocks.push({ type: list.name === "ol" ? "number" : "bullet", text, n, depth });
      for (const nested of li.children.filter((c) => isTag(c, ["ul", "ol"]))) walkList(nested, depth + 1);
    }
  };
  for (const node of parseDocument(clean).children) {
    if (isTag(node, ["h1", "h2", "h3"])) {
      const text = flat(textOf(node));
      if (text) blocks.push({ type: "heading", text, depth: 0 });
    } else if (isTag(node, ["ul", "ol"])) {
      walkList(node, 0);
    } else if (node.type === "tag" && node.name !== "hr") {
      const text = flat(textOf(node));
      if (text) blocks.push({ type: "paragraph", text, depth: 0 });
    } else if (node.type === "text" && flat(node.data)) {
      blocks.push({ type: "paragraph", text: flat(node.data), depth: 0 });
    }
  }
  return blocks;
}

// Texte brut d'un contenu riche, coupé proprement sur un mot à `max` caractères
function htmlText(html, max = Infinity) {
  const text = descriptionBlocks(html).map((b) => b.text).join(" ");
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}

// ---------- Ancien format → format riche ----------
const escapeHtml = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Markdown de l'ancien champ « description » → HTML riche (les titres ne descendent plus d'un niveau supplémentaire)
function legacyDescriptionToHtml(markdown) {
  const html = renderMarkdown(String(markdown || "")).replace(/<h4>/g, "<h3>").replace(/<\/h4>/g, "</h3>");
  return sanitizeRich(html);
}

// Ancien champ « un élément par ligne » → liste à puces
function legacyListToHtml(text) {
  const lines = listLines(text);
  return lines.length ? `<ul>${lines.map((l) => `<li>${inlineMarkdownToHtml(l)}</li>`).join("")}</ul>` : "";
}

// ---------- Vue d'ensemble pour une formation ----------
const LIST_FIELDS = ["objectives", "prerequisites", "target_audience", "skills"];
const isRichCourse = (course) => String(course && course.rich_text) === "1";
// Ancien format : une ligne = un élément. Les puces (*, -, 1.) et la mise en forme Markdown sont interprétées, jamais affichées.
const legacyItems = (text) => listLines(text).map((l) => ({ html: inlineMarkdownToHtml(l), text: stripMarkdown(l) }));

// Tout ce qu'il faut pour afficher (page publique, PDF, référencement) : identique pour l'ancien et le nouveau format
function courseTexts(course) {
  if (isRichCourse(course)) {
    return {
      isRich: true,
      descriptionHtml: renderRich(course.description),
      descriptionText: htmlText(course.description),
      descriptionBlocks: descriptionBlocks(course.description),
      objectives: listItems(course.objectives),
      prerequisites: listItems(course.prerequisites),
      audience: listItems(course.target_audience),
      audienceProfiles: audienceFromItems(listItems(course.target_audience)),
      skills: listItems(course.skills),
    };
  }
  return {
    isRich: false,
    descriptionHtml: renderMarkdown(course.description),
    descriptionText: null,
    descriptionBlocks: null,
    objectives: legacyItems(course.objectives),
    prerequisites: legacyItems(course.prerequisites),
    audience: legacyItems(course.target_audience),
    audienceProfiles: audienceFromText(course.target_audience),
    skills: legacyItems(course.skills),
  };
}

// Contenu à donner à l'éditeur du formulaire : le format riche tel qu'enregistré, ou l'ancien texte converti (sans toucher à la base)
function editorSources(course) {
  const c = course || {};
  if (isRichCourse(c)) {
    return { description: sanitizeRich(c.description), objectives: sanitizeRich(c.objectives), prerequisites: sanitizeRich(c.prerequisites), target_audience: sanitizeRich(c.target_audience), skills: sanitizeRich(c.skills) };
  }
  return {
    description: legacyDescriptionToHtml(c.description),
    objectives: legacyListToHtml(c.objectives),
    prerequisites: legacyListToHtml(c.prerequisites),
    target_audience: legacyListToHtml(c.target_audience),
    skills: legacyListToHtml(c.skills),
  };
}

module.exports = {
  LIST_FIELDS, sanitizeRich, sanitizeInline, renderRich, listItems, normalizeList, descriptionBlocks, htmlText,
  legacyDescriptionToHtml, legacyListToHtml, courseTexts, editorSources, isRichCourse,
};
