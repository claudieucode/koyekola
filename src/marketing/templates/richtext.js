// Texte riche de l'éditeur (HTML produit par la zone d'édition) → HTML d'e-mail.
// Deux passes, toujours dans cet ordre :
//   1. NETTOYAGE strict de ce qui vient du navigateur : liste fermée de balises, de styles (couleur, fond, taille,
//      alignement, retrait) et de liens (https / mailto). Tout le reste est retiré.
//   2. MISE EN FORME e-mail : styles EN LIGNE ajoutés par le serveur (marges, couleurs du thème) — compatibles
//      Outlook, Gmail, Apple Mail (aucune classe, aucune feuille de style).
// Les variables {{…}} restent des VARIABLES (remplacées et échappées à chaque destinataire), jamais du texte figé.
const crypto = require("crypto");
const sanitizeHtml = require("sanitize-html");
const { MarketingError } = require("../errors");
const engine = require("./engine");

const fail = (message) => new MarketingError("invalid_template", message);
const T = (v) => ({ t: "text", v });
const V = (path) => ({ t: "var", path, filters: [] });
const URL_PLACEHOLDER = "https://mk-url.invalid/";
const SYSTEM = "unsubscribe_url|preferences_url|view_url|event\\.course_url|event\\.learn_url";
const COLOR = [/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i, /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i];
const TAGS = ["p", "h2", "h3", "h4", "strong", "em", "u", "s", "sup", "sub", "a", "ul", "ol", "li", "br", "span", "blockquote"];
const MAX = 20000;

// Passe 1 : ce que le navigateur produit (execCommand, collage) ramené à un sous-ensemble sûr
const CLEAN = {
  allowedTags: TAGS,
  allowedAttributes: { "*": ["style"], a: ["href", "target"] },
  allowedSchemes: ["https", "mailto"],
  allowedSchemesByTag: { a: ["https", "mailto"] },
  allowProtocolRelative: false,
  allowedStyles: {
    "*": {
      color: COLOR, "background-color": COLOR,
      "font-size": [/^(?:9|[1-3]\d|4[0-8])px$/],
      "text-align": [/^(?:left|right|center|justify)$/],
      "margin-left": [/^\d{1,3}px$/], "padding-left": [/^\d{1,3}px$/],
      "font-weight": [/^(?:bold|700|800)$/], "font-style": [/^italic$/],
      "text-decoration": [/^(?:underline|line-through)$/], "text-decoration-line": [/^(?:underline|line-through)$/],
    },
  },
  transformTags: {
    b: "strong", i: "em", strike: "s", del: "s", ins: "u", div: "p", h1: "h2", h5: "h4", h6: "h4",
    font: (tag, attribs) => ({ tagName: "span", attribs: attribs.color ? { style: `color:${attribs.color}` } : {} }),
  },
  disallowedTagsMode: "discard",
};

// Passe 2 : styles d'e-mail (le style de l'auteur, déjà filtré, vient APRÈS et l'emporte)
function emailStyles({ color, accent }) {
  const add = (base) => (tagName, attribs) => ({ tagName, attribs: { ...attribs, style: base + (attribs.style ? `;${attribs.style}` : "") } });
  return {
    p: add(`margin:0 0 16px;color:${color}`),
    h2: add(`margin:0 0 12px;font-size:22px;line-height:1.25;font-weight:800;color:${color}`),
    h3: add(`margin:0 0 12px;font-size:19px;line-height:1.3;font-weight:700;color:${color}`),
    h4: add(`margin:0 0 10px;font-size:17px;line-height:1.3;font-weight:700;color:${color}`),
    ul: add("margin:0 0 16px;padding-left:24px"),
    ol: add("margin:0 0 16px;padding-left:24px"),
    li: add("margin:0 0 6px"),
    blockquote: add(`margin:0 0 16px;padding:4px 0 4px 14px;border-left:3px solid ${accent}`),
    strong: add("font-weight:700"),
    em: add("font-style:italic"),
    u: add("text-decoration:underline"),
    s: add("text-decoration:line-through"),
    a: (tagName, attribs) => (!attribs.href ? { tagName: "span", attribs: {} } : { tagName, attribs: { href: attribs.href, ...(attribs.target === "_blank" ? { target: "_blank" } : {}), rel: "noopener noreferrer", style: `color:${accent};text-decoration:underline${attribs.style ? `;${attribs.style}` : ""}` } }),
  };
}

const decodeEntities = (s) => s.replace(/&nbsp;|&#160;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const visibleText = (html) => html.replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;| /g, " ").trim();

// html : contenu de l'éditeur. env : { allowed, theme }. opts.color : couleur du texte du bloc (sinon celle du thème).
function richNodes(source, env, { max = MAX, label = "Le texte", color } = {}) {
  const raw = typeof source === "string" ? source : "";
  if (raw.length > max) throw fail(`${label} est trop long (${max} caractères au plus, mise en forme comprise).`);
  // Liens système permis en adresse : adresse factice, restituée à la fin
  const withSys = raw.replace(new RegExp(`href=(["'])\\s*\\{\\{\\s*(${SYSTEM})\\s*\\}\\}\\s*\\1`, "g"), (m, q, name) => `href=${q}${URL_PLACEHOLDER}${name}${q}`);
  if (/\{%|%\}/.test(withSys)) throw fail("Les conditions ne sont pas permises dans un texte : utilisez la « condition d'affichage » du bloc.");
  // Chaque variable est validée (catalogue, filtres) puis remplacée par un jeton alphanumérique, inaltérable par le
  // nettoyage ; elle est restituée après la mise en forme (rendu) ou telle qu'écrite (contenu enregistré).
  const nonce = crypto.randomBytes(8).toString("hex");
  const vars = [], sources = [];
  const tokenized = withSys.replace(/\{\{[\s\S]*?\}\}/g, (escaped) => {
    const src = decodeEntities(escaped); // la zone d'édition écrit & < > en entités, même dans une variable
    const ast = engine.compile(src, { allowed: env.allowed });
    if (ast.length !== 1 || ast[0].t !== "var") throw fail(`Variable invalide : ${src.slice(0, 60)}`);
    vars.push(ast[0]); sources.push(src);
    return `mkv${nonce}x${vars.length - 1}x`;
  });
  if (/\{\{|\}\}/.test(tokenized)) throw fail("Variable mal fermée : écrivez-la sous la forme {{contact.first_name}}.");
  const clean = sanitizeHtml(tokenized, CLEAN);
  if (!visibleText(clean)) throw fail(`${label} est obligatoire.`);
  if (new RegExp(`<[^>]*mkv${nonce}x`).test(clean)) throw fail("Une variable ne peut pas se trouver dans l'adresse d'un lien (seuls {{unsubscribe_url}}, {{preferences_url}}, {{view_url}}, {{event.course_url}} et {{event.learn_url}} sont permis).");
  // Contenu enregistré : nettoyé, variables telles qu'écrites, liens système rétablis
  const saved = clean
    .replace(new RegExp(`mkv${nonce}x(\\d+)x`, "g"), (m, i) => sources[Number(i)].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))
    .replace(new RegExp(`${URL_PLACEHOLDER.replace(/[.]/g, "\\.")}(${SYSTEM})`, "g"), "{{$1}}");
  const styled = sanitizeHtml(clean, {
    allowedTags: TAGS, allowedAttributes: { "*": ["style"], a: ["href", "target", "rel", "style"] }, allowedSchemes: ["https", "mailto"],
    transformTags: emailStyles({ color: color || env.theme.textColor, accent: env.theme.accent }), disallowedTagsMode: "discard",
  });
  const nodes = [];
  const re = new RegExp(`mkv${nonce}x(\\d+)x|${URL_PLACEHOLDER.replace(/[.]/g, "\\.")}(${SYSTEM})`, "g");
  let last = 0;
  for (let m = re.exec(styled); m; m = re.exec(styled)) {
    if (m.index > last) nodes.push(T(styled.slice(last, m.index)));
    nodes.push(m[1] !== undefined ? vars[Number(m[1])] : V(m[2]));
    last = re.lastIndex;
  }
  if (last < styled.length) nodes.push(T(styled.slice(last)));
  return { nodes, html: saved };
}

// Ancien contenu Markdown → texte riche, pour l'ouvrir dans la zone d'édition (même liste fermée de balises).
// Les variables sont mises à l'abri de la mise en forme Markdown, puis restituées telles qu'écrites.
function markdownToRich(md) {
  const { renderMarkdown } = require("../../utils/markdown");
  const nonce = crypto.randomBytes(6).toString("hex");
  const vars = [];
  const src = String(md || "").replace(/\{\{[\s\S]*?\}\}/g, (v) => `mkv${nonce}x${vars.push(v) - 1}x`);
  const html = sanitizeHtml(renderMarkdown(src), CLEAN);
  return html.replace(new RegExp(`mkv${nonce}x(\\d+)x`, "g"), (m, i) => vars[Number(i)].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
}

module.exports = { richNodes, markdownToRich, RICH_MAX: MAX };
