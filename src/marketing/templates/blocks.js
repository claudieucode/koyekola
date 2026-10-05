// Blocs → HTML d'e-mail. Le modèle est COMPILÉ une seule fois en une liste de morceaux : du HTML produit par ce fichier
// (de confiance) et des variables. À chaque destinataire, seules les variables sont remplacées, et TOUJOURS échappées :
// une valeur de contact n'est jamais du HTML, du Markdown ni du gabarit.
//
// Compatibilité clients mail : mise en page en tableaux (role="presentation"), styles EN LIGNE, largeur 600 px,
// aucune feuille externe, aucun script, aucun formulaire. Le rendu réel dans Outlook/Gmail/Apple Mail n'est pas testable
// ici : la structure est volontairement prudente.
const crypto = require("crypto");
const sanitizeHtml = require("sanitize-html");
const { renderMarkdown } = require("../../utils/markdown");
const { MarketingError } = require("../errors");
const engine = require("./engine");
const { htmlToText } = require("./text");
const { richNodes } = require("./richtext");

const MAX_BLOCKS = 60;
const MARKDOWN_MAX = 10000;
const COLUMN_MAX = 5000;
const URL_PLACEHOLDER = "https://mk-url.invalid/";
const SYSTEM_URL = /^\{\{\s*(unsubscribe_url|preferences_url|view_url|event\.course_url|event\.learn_url)\s*\}\}$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const ALIGN = ["left", "center", "right"];
const MUTED = "#5d7182";
// Polices sûres pour l'e-mail (installées partout, avec replis) — aucune police web téléchargée
const FONTS = {
  system: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", serif: "Georgia,'Times New Roman',serif",
  arial: "Arial,Helvetica,sans-serif", verdana: "Verdana,Geneva,sans-serif", trebuchet: "'Trebuchet MS',Helvetica,sans-serif",
  tahoma: "Tahoma,Verdana,sans-serif", times: "'Times New Roman',Times,serif", courier: "'Courier New',Courier,monospace",
};
const SPACING = { compact: 4, normal: 8, large: 16 };
const DEFAULT_THEME = { background: "#f3f8fc", contentBackground: "#ffffff", textColor: "#10222f", accent: "#0277b6", fontFamily: "system", secondary: "#d5e3ee", maxWidth: 600, radius: 4, spacing: "normal" };
const TYPES = ["heading", "text", "image", "button", "divider", "spacer", "columns", "quote", "list", "social", "video", "course", "link", "coupon", "posts"];
const RATIOS = { "50-50": [50, 50], "60-40": [60, 40], "40-60": [40, 60], "70-30": [70, 30], "30-70": [30, 70] };
const BUTTON_SIZES = { s: "8px 16px", m: "12px 24px", l: "16px 32px" };
const NETWORKS = { facebook: "Facebook", instagram: "Instagram", x: "X", linkedin: "LinkedIn", youtube: "YouTube", tiktok: "TikTok", whatsapp: "WhatsApp", website: "Site web" };
const LIST_STYLES = ["bullets", "numbers", "checks"];
const BORDER_STYLES = ["solid", "dashed", "dotted"];
const WEIGHTS = { normal: 400, bold: 700 };
// Couleurs officielles des réseaux (pastilles du bloc « réseaux sociaux », texte blanc lisible sur chacune)
const NETWORK_COLORS = { facebook: "#1877f2", instagram: "#c13584", x: "#000000", linkedin: "#0a66c2", youtube: "#cc0000", tiktok: "#010101", whatsapp: "#128c4b", website: "#334155" };
const SOCIAL_STYLES = ["text", "buttons"];
const MAX_LIST_ITEMS = 20;
const MAX_SOCIAL = 8;
const LOCAL_HTTP = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?(\/[^\s<>"'`\\]*)?$/i;
const KINDS = ["marketing", "transactional"];
// Caractères de contrôle remplacés par une espace dans les champs d'une ligne (objet, titres, libellés)
const CONTROLS = new RegExp(`[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127, 0x2028, 0x2029)}]+`, "g");

const fail = (message) => new MarketingError("invalid_template", message);
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const T = (v) => ({ t: "text", v });
const V = (path) => ({ t: "var", path, filters: [] });
const anything = () => true; // pour les variables système que le SYSTÈME (pas l'auteur) place lui-même

// Le texte d'auteur est échappé une fois à la compilation ; les variables le seront à chaque rendu
function escapeAst(nodes) {
  return nodes.map((n) => {
    if (n.t === "text") return T(escapeHtml(n.v));
    if (n.t === "var") return n;
    return { ...n, branches: n.branches.map((b) => ({ ...b, body: escapeAst(b.body) })), else: n.else ? escapeAst(n.else) : null };
  });
}

// ---------- Couleurs et contraste ----------
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const textOn = (bg) => (contrast("#ffffff", bg) >= contrast("#10222f", bg) ? "#ffffff" : "#10222f");

function normalizeTheme(input = {}) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) throw fail("Le thème doit être un objet.");
  const theme = { ...DEFAULT_THEME };
  for (const key of ["background", "contentBackground", "textColor", "accent", "secondary"]) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== "string" || !HEX.test(input[key])) throw fail(`Couleur invalide pour « ${key} » : utilisez le format #rrggbb.`);
    theme[key] = input[key].toLowerCase();
  }
  if (input.fontFamily !== undefined) {
    if (!Object.hasOwn(FONTS, input.fontFamily)) throw fail(`Police inconnue (${Object.keys(FONTS).join(", ")}).`);
    theme.fontFamily = input.fontFamily;
  }
  if (input.maxWidth !== undefined) theme.maxWidth = intIn(input.maxWidth, 480, 720, "Largeur maximale du message (480 à 720 px)");
  if (input.radius !== undefined) theme.radius = intIn(input.radius, 0, 24, "Arrondi des boutons et encadrés (0 à 24 px)");
  if (input.spacing !== undefined) {
    if (!Object.hasOwn(SPACING, input.spacing)) throw fail("Espacement général inconnu (compact, normal ou large).");
    theme.spacing = input.spacing;
  }
  return theme;
}

// ---------- Champs ----------
function intIn(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) throw fail(`${label} : valeur invalide.`);
  return value;
}
const optHex = (value, label) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !HEX.test(value)) throw fail(`${label} : couleur invalide (format #rrggbb).`);
  return value.toLowerCase();
};
const optBool = (value) => value === true;
// Typographie propre à un bloc (titre, texte) : police, taille, interligne, couleur — sinon celles du thème
function typography(block, { sizeMin = 12, sizeMax = 28 } = {}) {
  const out = {};
  if (block.font !== undefined && block.font !== "") { if (!Object.hasOwn(FONTS, block.font)) throw fail("Police inconnue."); out.font = block.font; }
  if (block.fontSize !== undefined && block.fontSize !== null) out.fontSize = intIn(block.fontSize, sizeMin, sizeMax, `Taille du texte (${sizeMin} à ${sizeMax} px)`);
  if (block.lineHeight !== undefined && block.lineHeight !== null) {
    if (typeof block.lineHeight !== "number" || !(block.lineHeight >= 1 && block.lineHeight <= 2.4)) throw fail("Interligne invalide (1 à 2,4).");
    out.lineHeight = Math.round(block.lineHeight * 10) / 10;
  }
  const color = optHex(block.color, "Couleur du texte");
  if (color) out.color = color;
  Object.assign(out, emphasis(block));
  return out;
}
// Graisse, italique, espacement des lettres (titre, texte, bouton)
function emphasis(block) {
  const out = {};
  if (block.weight !== undefined && block.weight !== null && block.weight !== "") { if (!Object.hasOwn(WEIGHTS, block.weight)) throw fail("Graisse inconnue (normal ou bold)."); out.weight = block.weight; }
  if (optBool(block.italic)) out.italic = true;
  if (block.letterSpacing !== undefined && block.letterSpacing !== null && block.letterSpacing !== 0) out.letterSpacing = intIn(block.letterSpacing, 0, 10, "Espacement des lettres (0 à 10 px)");
  return out;
}
const emphasisCss = (t) => [t.weight ? `font-weight:${WEIGHTS[t.weight]}` : "", t.italic ? "font-style:italic" : "", t.letterSpacing ? `letter-spacing:${t.letterSpacing}px` : ""].filter(Boolean).join(";");
const typoCss = (t) => [t.font ? `font-family:${FONTS[t.font]}` : "", t.fontSize ? `font-size:${t.fontSize}px` : "", t.lineHeight ? `line-height:${t.lineHeight}` : "", t.color ? `color:${t.color}` : "", emphasisCss(t), t.align ? `text-align:${t.align}` : ""].filter(Boolean).join(";");
// Réglages communs à tout bloc : marges intérieures haut/bas, fond, affichage par appareil
function boxOf(block) {
  if (block.box === undefined || block.box === null) return null;
  if (typeof block.box !== "object" || Array.isArray(block.box)) throw fail("Réglages du bloc invalides.");
  const b = block.box, out = {};
  if (b.padTop !== undefined && b.padTop !== null) out.padTop = intIn(b.padTop, 0, 64, "Marge du haut (0 à 64 px)");
  if (b.padBottom !== undefined && b.padBottom !== null) out.padBottom = intIn(b.padBottom, 0, 64, "Marge du bas (0 à 64 px)");
  if (b.padLeft !== undefined && b.padLeft !== null) out.padLeft = intIn(b.padLeft, 0, 64, "Marge de gauche (0 à 64 px)");
  if (b.padRight !== undefined && b.padRight !== null) out.padRight = intIn(b.padRight, 0, 64, "Marge de droite (0 à 64 px)");
  if (b.border !== undefined && b.border !== null) {
    if (typeof b.border !== "object" || Array.isArray(b.border)) throw fail("Bordure du bloc invalide.");
    // Même forme à l'entrée et à la sortie (réenregistrable telle quelle) : { style, width, color, radius }
    const style = b.border.style, border = {};
    if (style !== undefined && style !== null && style !== "none") {
      if (!BORDER_STYLES.includes(style)) throw fail("Style de bordure inconnu (solid, dashed ou dotted).");
      Object.assign(border, { style, width: b.border.width === undefined || b.border.width === null ? 1 : intIn(b.border.width, 1, 8, "Épaisseur de la bordure (1 à 8 px)"), color: optHex(b.border.color, "Couleur de la bordure") || "#d5e3ee" });
    }
    if (b.border.radius !== undefined && b.border.radius !== null && b.border.radius !== 0) border.radius = intIn(b.border.radius, 0, 40, "Arrondi du bloc (0 à 40 px)");
    if (Object.keys(border).length) out.border = border;
  }
  const bg = optHex(b.background, "Fond du bloc"); if (bg) out.background = bg;
  if (optBool(b.hideMobile)) out.hideMobile = true;
  if (optBool(b.hideDesktop)) out.hideDesktop = true;
  if (out.hideMobile && out.hideDesktop) throw fail("Un bloc ne peut pas être masqué à la fois sur ordinateur et sur mobile (utilisez « Masquer le bloc »).");
  return Object.keys(out).length ? out : null;
}
// Réglages propres au mobile (« Mêmes styles pour ordinateur et mobiles » décoché) : seulement ce qui s'applique au type
// du bloc. Traduits en règles CSS dans la requête média du message (Gmail, Apple Mail, clients mobiles) ; les clients
// qui ignorent les requêtes média (Outlook sur ordinateur) gardent les réglages ordinateur — jamais l'inverse.
const MOBILE_KEYS = {
  "*": ["padTop", "padBottom", "padLeft", "padRight"],
  heading: ["fontSize", "align"], text: ["fontSize", "align"], button: ["fontSize", "align", "fullWidth"], image: ["width", "align"],
  video: ["width", "align"], spacer: ["height"], social: ["align"], link: ["fontSize", "align"], quote: ["fontSize", "align"], list: ["fontSize", "align"],
};
const MOBILE_SIZE = { heading: [16, 44], text: [12, 28], button: [12, 24], quote: [12, 32], list: [12, 28], link: [12, 28] };
function mobileOf(block) {
  if (block.mobile === undefined || block.mobile === null) return null;
  if (typeof block.mobile !== "object" || Array.isArray(block.mobile)) throw fail("Réglages mobiles invalides.");
  const allowedKeys = [...MOBILE_KEYS["*"], ...(MOBILE_KEYS[block.type] || [])];
  const m = block.mobile, out = {};
  for (const key of Object.keys(m)) {
    const v = m[key];
    if (v === undefined || v === null || v === "") continue;
    if (!allowedKeys.includes(key)) throw fail(`Réglage mobile « ${key.slice(0, 20)} » non applicable à ce bloc.`);
    if (key.startsWith("pad")) out[key] = intIn(v, 0, 64, "Marge sur mobile (0 à 64 px)");
    else if (key === "fontSize") { const [a, b] = MOBILE_SIZE[block.type]; out.fontSize = intIn(v, a, b, `Taille du texte sur mobile (${a} à ${b} px)`); }
    else if (key === "align") out.align = alignOf(v);
    else if (key === "width") out.width = intIn(v, 40, 720, "Largeur sur mobile (40 à 720 px)");
    else if (key === "height") out.height = intIn(v, 4, 120, "Hauteur sur mobile (4 à 120 px)");
    else if (key === "fullWidth") { if (v === true) out.fullWidth = true; }
  }
  return Object.keys(out).length ? out : null;
}
// Règles CSS mobiles d'un bloc (classes mkc-/mkf-/mka-/mkw-<id> posées par le rendu ; identifiants déjà validés)
function mobileCss(id, m) {
  const r = [];
  const pads = ["padTop", "padRight", "padBottom", "padLeft"].filter((k) => m[k] !== undefined);
  if (pads.length) r.push(`.mkc-${id}{${pads.map((k) => `padding-${k.slice(3).toLowerCase()}:${m[k]}px!important`).join(";")}}`);
  if (m.fontSize) r.push(`.mkf-${id}{font-size:${m.fontSize}px!important}`);
  if (m.align) {
    r.push(`.mkf-${id}{text-align:${m.align}!important}`);
    const [l, rr] = m.align === "center" ? ["auto", "auto"] : m.align === "right" ? ["auto", "0"] : ["0", "auto"];
    r.push(`.mka-${id}{float:none!important;margin-left:${l}!important;margin-right:${rr}!important}`);
  }
  if (m.width) r.push(`.mkw-${id}{width:${m.width}px!important;max-width:100%!important}`);
  if (m.height) r.push(`.mkh-${id}{height:${m.height}px!important;line-height:${m.height}px!important}`);
  if (m.fullWidth) r.push(`.mka-${id}{width:100%!important}.mkf-${id}{display:block!important}`);
  return r.join("");
}
function plain(source, allowed, { max = 200, required = false, label = "Le champ" } = {}) {
  const text = (typeof source === "string" ? source : "").replace(CONTROLS, " ").trim();
  if (required && !text) throw fail(`${label} est obligatoire.`);
  if (text.length > max) throw fail(`${label} est trop long (${max} caractères au plus).`);
  return escapeAst(engine.compile(text, { allowed }));
}

function urlNodes(value, { mailto = false, system = true } = {}) {
  const url = typeof value === "string" ? value.trim() : "";
  const sys = SYSTEM_URL.exec(url);
  if (sys && system) return [V(sys[1])];
  if (!url) throw fail("L'adresse est obligatoire.");
  const ok = url.length <= 2000 && (/^https:\/\/[^\s<>"'`\\]+$/i.test(url) || (mailto && /^(mailto|tel):[^\s<>"'`\\]+$/i.test(url)));
  if (!ok || url.includes("{{") || url.includes("{%")) throw fail(`L'adresse doit commencer par https://${mailto ? " (ou mailto:)" : ""}, sans espace ni guillemet.`);
  if (/^https:\/\/[^/?#]*@/i.test(url)) throw fail("L'adresse ne doit pas contenir d'identifiant ni de mot de passe (https://utilisateur:motdepasse@…).");
  return [T(escapeHtml(url))];
}

// Adresse d'un instantané de formation (produite par le serveur) : https, ou http://localhost pour le développement local
function trustedUrl(value, label) {
  const url = typeof value === "string" ? value.trim() : "";
  const ok = url.length <= 2000 && (/^https:\/\/[^\s<>"'`\\]+$/i.test(url) || LOCAL_HTTP.test(url));
  if (!ok || url.includes("{{") || url.includes("{%")) throw fail(`${label} : l'adresse doit commencer par https:// (ou http://localhost en développement).`);
  if (/^https?:\/\/[^/?#]*@/i.test(url)) throw fail(`${label} : l'adresse ne doit pas contenir d'identifiant.`);
  return url;
}
// Fichier de la médiathèque en développement local (http://localhost/uploads/marketing/…) : accepté comme un
// instantané de formation. En production, l'adresse publique est en https et passe par la règle commune.
function localMedia(value) {
  const url = typeof value === "string" ? value.trim() : "";
  return LOCAL_HTTP.test(url) && /^http:\/\/[^/]+\/uploads\/marketing\//.test(url) ? [T(escapeHtml(trustedUrl(url, "Fichier")))] : null;
}
const euros = (cents) => (cents === 0 ? "Gratuit" : `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);

const alignOf = (v) => {
  if (v === undefined) return "left";
  if (!ALIGN.includes(v)) throw fail("Alignement invalide (left, center ou right).");
  return v;
};

// ---------- Markdown → HTML d'e-mail ----------
function emailMarkdownStyles(theme) {
  const font = `color:${theme.textColor}`;
  const fixed = (tag, style) => (t, attribs) => ({ tagName: tag, attribs: { style } });
  return {
    p: fixed("p", `margin:0 0 16px;${font}`),
    h2: fixed("h2", `margin:0 0 12px;font-size:22px;line-height:1.25;${font}`),
    h3: fixed("h3", `margin:0 0 12px;font-size:20px;line-height:1.25;${font}`),
    h4: fixed("h4", `margin:0 0 12px;font-size:17px;line-height:1.3;${font}`),
    ul: fixed("ul", "margin:0 0 16px;padding-left:24px"),
    ol: fixed("ol", "margin:0 0 16px;padding-left:24px"),
    li: fixed("li", "margin:0 0 6px"),
    blockquote: fixed("blockquote", `margin:0 0 16px;padding:4px 0 4px 14px;border-left:3px solid ${theme.accent};color:${MUTED}`),
    hr: fixed("hr", "border:0;border-top:1px solid #d5e3ee;margin:20px 0"),
    strong: fixed("strong", "font-weight:700"),
    em: fixed("em", "font-style:italic"),
    code: fixed("code", "font-family:Menlo,Consolas,monospace;font-size:14px;background:#eaf3fa;padding:1px 4px"),
    pre: fixed("pre", "margin:0 0 16px;padding:12px;background:#eaf3fa;font-family:Menlo,Consolas,monospace;font-size:14px;white-space:pre-wrap"),
    a: (tagName, attribs) => {
      const href = typeof attribs.href === "string" ? attribs.href : "";
      if (!/^(https:\/\/|mailto:)[^\s<>"']+$/i.test(href) || href.length > 2000) return { tagName: "span", attribs: {} };
      return { tagName: "a", attribs: { href, rel: "noopener noreferrer", style: `color:${theme.accent};text-decoration:underline` } };
    },
  };
}

function styleMarkdownHtml(html, theme) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "h2", "h3", "h4", "strong", "em", "a", "ul", "ol", "li", "blockquote", "hr", "br", "code", "pre"],
    allowedAttributes: { "*": ["style"], a: ["href", "rel", "style"] },
    allowedSchemes: ["https", "mailto"],
    disallowedTagsMode: "discard",
    transformTags: emailMarkdownStyles(theme),
  });
}

function markdownNodes(source, env, { max = MARKDOWN_MAX, label = "Le texte" } = {}) {
  const text = typeof source === "string" ? source.replace(/\r\n?/g, "\n") : "";
  if (!text.trim()) throw fail(`${label} est obligatoire.`);
  if (text.length > max) throw fail(`${label} est trop long (${max} caractères au plus).`);
  // Liens système autorisés en adresse : remplacés par une adresse factice, restituée à la fin
  const md = text.replace(/\]\(\s*\{\{\s*(unsubscribe_url|preferences_url|view_url|event\.course_url|event\.learn_url)\s*\}\}\s*\)/g, `](${URL_PLACEHOLDER}$1)`);
  for (let at = md.indexOf("]("); at !== -1; at = md.indexOf("](", at + 2)) {
    const window = md.slice(at + 2, at + 2102);
    const close = window.search(/[)\n]/);
    if ((close === -1 ? window : window.slice(0, close)).includes("{{")) {
      throw fail("Une variable ne peut pas se trouver dans l'adresse d'un lien (seuls {{unsubscribe_url}}, {{preferences_url}}, {{view_url}}, {{event.course_url}} et {{event.learn_url}} sont permis).");
    }
  }
  const ast = engine.compile(md, { allowed: env.allowed });
  if (ast.some((n) => n.t === "if")) throw fail("Les conditions ne sont pas permises dans un texte : utilisez la « condition d'affichage » du bloc.");

  // Variables → jetons alphanumériques (que le Markdown ne peut pas altérer), restitués APRÈS mise en forme
  const nonce = crypto.randomBytes(8).toString("hex");
  const vars = [];
  const source2 = ast.map((n) => (n.t === "text" ? n.v : `mkv${nonce}x${vars.push(n) - 1}x`)).join("");
  const html = styleMarkdownHtml(renderMarkdown(source2), env.theme);
  if (new RegExp(`<[^>]*mkv${nonce}x`).test(html)) throw fail("Une variable ne peut pas se trouver dans l'adresse d'un lien.");

  const nodes = [];
  const re = new RegExp(`mkv${nonce}x(\\d+)x|${URL_PLACEHOLDER.replace(/[.]/g, "\\.")}(unsubscribe_url|preferences_url|view_url|event\\.course_url|event\\.learn_url)`, "g");
  let last = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    if (m.index > last) nodes.push(T(html.slice(last, m.index)));
    nodes.push(m[1] !== undefined ? vars[Number(m[1])] : V(m[2]));
    last = re.lastIndex;
  }
  if (last < html.length) nodes.push(T(html.slice(last)));
  return nodes;
}

// ---------- Blocs ----------
function buildBlock(block, env, meta, k = {}) {
  const { theme, allowed } = env;
  // Classes posées seulement si le bloc a des réglages mobiles (k.f : police/alignement, k.a : bloc aligné, k.w : largeur, k.h : hauteur)
  const cls = (name) => (k[name] ? ` class="${k[name]}"` : "");
  switch (block.type) {
    case "heading": {
      const level = block.level === undefined ? 2 : block.level;
      if (![1, 2, 3].includes(level)) throw fail("Niveau de titre invalide (1, 2 ou 3).");
      const align = alignOf(block.align);
      const text = plain(block.text, allowed, { required: true, label: "Le titre" });
      const typo = typography(block, { sizeMin: 16, sizeMax: 44 });
      const href = typeof block.href === "string" && block.href.trim() ? urlNodes(block.href, { mailto: true }) : null;
      const newTab = Boolean(href) && optBool(block.newTab);
      meta.hasText = true;
      const color = typo.color || theme.textColor;
      const css = `margin:0;font-size:${typo.fontSize || { 1: 28, 2: 22, 3: 18 }[level]}px;line-height:${typo.lineHeight || 1.25};font-weight:${typo.weight ? WEIGHTS[typo.weight] : 800};color:${color};text-align:${align}${typo.font ? `;font-family:${FONTS[typo.font]}` : ""}${typo.italic ? ";font-style:italic" : ""}${typo.letterSpacing ? `;letter-spacing:${typo.letterSpacing}px` : ""}`;
      const inner = href ? [T('<a href="'), ...href, T(`"${newTab ? ' target="_blank"' : ""} style="color:${color};text-decoration:none">`), ...text, T("</a>")] : text;
      return { normalized: { text: block.text.trim(), level, align, ...typo, ...(href ? { href: block.href.trim() } : {}), ...(newTab ? { newTab } : {}) }, nodes: [T(`<h${level}${cls("f")} style="${css}">`), ...inner, T(`</h${level}>`)] };
    }
    case "text": {
      meta.hasText = true;
      const typo = typography(block);
      if (block.align !== undefined && block.align !== null && block.align !== "") typo.align = alignOf(block.align);
      const wrap = (nodes) => { const css = typoCss(typo); return css || k.f ? [T(`<div${cls("f")}${css ? ` style="${css}"` : ""}>`), ...nodes, T("</div>")] : nodes; };
      if (typeof block.html === "string") {
        const rich = richNodes(block.html, env, { color: typo.color });
        return { normalized: { html: rich.html, ...typo }, nodes: wrap(rich.nodes) };
      }
      return { normalized: { markdown: block.markdown, ...typo }, nodes: wrap(markdownNodes(block.markdown, env)) };
    }
    case "image": {
      const src = localMedia(block.src) || urlNodes(block.src, { system: false });
      const decorative = block.decorative === true;
      const alt = plain(block.alt, allowed, { max: 200, label: "Le texte alternatif" });
      if (!decorative && !(typeof block.alt === "string" && block.alt.trim())) throw fail("Le texte alternatif est obligatoire (ou cochez « image décorative »).");
      const width = block.width === undefined ? 552 : block.width;
      if (!Number.isInteger(width) || width < 40 || width > 720) throw fail("Largeur invalide (40 à 720 pixels).");
      const align = alignOf(block.align);
      const href = block.href ? urlNodes(block.href) : null;
      const margin = align === "center" ? "margin:0 auto;" : align === "right" ? "margin:0 0 0 auto;" : "";
      const radius = block.radius === undefined || block.radius === null ? 0 : intIn(block.radius, 0, 40, "Arrondi de l'image (0 à 40 px)");
      const newTab = optBool(block.newTab);
      meta.hasImage = true;
      return {
        normalized: { src: block.src.trim(), alt: (block.alt || "").trim(), decorative, width, align, ...(href ? { href: block.href.trim() } : {}), ...(radius ? { radius } : {}), ...(newTab && href ? { newTab } : {}) },
        nodes: [
          ...(href ? [T('<a href="'), ...href, T(`"${newTab ? ' target="_blank"' : ""} style="text-decoration:none">`)] : []),
          T(`<img${k.w || k.a ? ` class="${[k.w, k.a].filter(Boolean).join(" ")}"` : ""} src="`), ...src, T('" alt="'), ...alt, T(`" width="${width}" style="display:block;border:0;max-width:100%;height:auto;${margin}${radius ? `border-radius:${radius}px;` : ""}">`),
          ...(href ? [T("</a>")] : []),
        ],
      };
    }
    case "button": {
      const label = plain(block.label, allowed, { max: 80, required: true, label: "Le libellé du bouton" });
      const url = localMedia(block.url) || urlNodes(block.url, { mailto: true });
      if (block.color !== undefined && (typeof block.color !== "string" || !HEX.test(block.color))) throw fail("Couleur invalide pour le bouton : utilisez le format #rrggbb.");
      const color = (block.color || theme.accent).toLowerCase();
      const textColor = optHex(block.textColor, "Couleur du texte du bouton");
      const ink = textColor || textOn(color);
      if (contrast(ink, color) < 4.5) meta.lowContrast.push(color);
      const align = alignOf(block.align === undefined ? "center" : block.align);
      const fontSize = block.fontSize === undefined || block.fontSize === null ? 16 : intIn(block.fontSize, 12, 24, "Taille du texte du bouton (12 à 24 px)");
      const radius = block.radius === undefined || block.radius === null ? theme.radius : intIn(block.radius, 0, 40, "Arrondi du bouton (0 à 40 px)");
      const size = block.size === undefined ? "m" : block.size;
      if (!Object.hasOwn(BUTTON_SIZES, size)) throw fail("Taille de bouton inconnue (s, m ou l).");
      const fullWidth = optBool(block.fullWidth), newTab = optBool(block.newTab);
      const emph = emphasis(block);
      let border = null;
      if (block.borderStyle !== undefined && block.borderStyle !== null && block.borderStyle !== "none") {
        if (!BORDER_STYLES.includes(block.borderStyle)) throw fail("Style de bordure du bouton inconnu (solid, dashed ou dotted).");
        border = { borderStyle: block.borderStyle, borderWidth: block.borderWidth === undefined ? 2 : intIn(block.borderWidth, 1, 8, "Épaisseur de la bordure du bouton (1 à 8 px)"), borderColor: optHex(block.borderColor, "Couleur de la bordure du bouton") || ink };
      }
      const borderCss = border ? `;border:${border.borderWidth}px ${border.borderStyle} ${border.borderColor}` : "";
      meta.hasButton = true;
      return {
        normalized: { label: block.label.trim(), url: block.url.trim(), align, ...(block.color ? { color } : {}), ...(textColor ? { textColor } : {}), ...(fontSize !== 16 ? { fontSize } : {}), ...(block.radius !== undefined && block.radius !== null ? { radius } : {}), ...(size !== "m" ? { size } : {}), ...(fullWidth ? { fullWidth } : {}), ...(newTab ? { newTab } : {}), ...emph, ...(border || {}) },
        nodes: [
          T(`<table${cls("a")} role="presentation" align="${fullWidth ? "center" : align}" cellpadding="0" cellspacing="0"${fullWidth ? ' width="100%"' : ""} style="margin:${align === "center" || fullWidth ? "0 auto" : "0"}${fullWidth ? ";width:100%" : ";max-width:100%"}"><tr><td align="center" style="background:${color};border-radius:${radius}px${borderCss}"><a${cls("f")} href="`),
          ...url,
          T(`"${newTab ? ' target="_blank"' : ""} style="display:${fullWidth ? "block" : "inline-block"};padding:${BUTTON_SIZES[size]};font-size:${fontSize}px;font-weight:${emph.weight ? WEIGHTS[emph.weight] : 700};${emph.italic ? "font-style:italic;" : ""}${emph.letterSpacing ? `letter-spacing:${emph.letterSpacing}px;` : ""}text-decoration:none;color:${ink};border-radius:${radius}px">`),
          ...label,
          T("</a></td></tr></table>"),
        ],
      };
    }
    case "divider": {
      // « style » : seulement solid / dashed / dotted ; toute autre valeur (ancien champ libre, injection) est ignorée
      const style = BORDER_STYLES.includes(block.style) ? block.style : "solid";
      const thickness = block.thickness === undefined || block.thickness === null ? 1 : intIn(block.thickness, 1, 8, "Épaisseur de la ligne (1 à 8 px)");
      const width = block.width === undefined || block.width === null ? 100 : intIn(block.width, 10, 100, "Largeur de la ligne (10 à 100 %)");
      const color = optHex(block.color, "Couleur de la ligne");
      const align = alignOf(block.align === undefined ? "center" : block.align);
      const margin = align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0";
      return {
        normalized: { ...(style !== "solid" ? { style } : {}), ...(thickness !== 1 ? { thickness } : {}), ...(width !== 100 ? { width } : {}), ...(color ? { color } : {}), ...(align !== "center" ? { align } : {}) },
        nodes: [T(`<table role="presentation" width="${width}%" align="${align}" cellpadding="0" cellspacing="0" style="width:${width}%;margin:${margin}"><tr><td style="border-top:${thickness}px ${style} ${color || theme.secondary};font-size:0;line-height:0;height:1px">&nbsp;</td></tr></table>`)],
      };
    }
    case "spacer": {
      const height = block.height === undefined ? 24 : block.height;
      if (!Number.isInteger(height) || height < 4 || height > 120) throw fail("Hauteur invalide (4 à 120 pixels).");
      return { normalized: { height }, nodes: [T(`<div${cls("h")} style="height:${height}px;line-height:${height}px;font-size:0">&nbsp;</div>`)] };
    }
    case "columns": {
      meta.hasText = true;
      const rich = typeof block.leftHtml === "string" || typeof block.rightHtml === "string";
      const leftC = rich ? richNodes(block.leftHtml, env, { max: COLUMN_MAX * 2, label: "La colonne de gauche" }) : null;
      const rightC = rich ? richNodes(block.rightHtml, env, { max: COLUMN_MAX * 2, label: "La colonne de droite" }) : null;
      const left = rich ? leftC.nodes : markdownNodes(block.left, env, { max: COLUMN_MAX, label: "La colonne de gauche" });
      const right = rich ? rightC.nodes : markdownNodes(block.right, env, { max: COLUMN_MAX, label: "La colonne de droite" });
      const ratio = block.ratio === undefined ? "50-50" : block.ratio;
      if (!Object.hasOwn(RATIOS, ratio)) throw fail("Répartition des colonnes inconnue (50-50, 60-40, 40-60, 70-30 ou 30-70).");
      const stack = block.stack !== false; // empilées sur mobile (par défaut)
      const reverse = stack && optBool(block.reverse); // sur mobile : la colonne de droite d'abord
      const [wl, wr] = RATIOS[ratio];
      const cls = stack ? ' class="mk-col"' : "";
      const cell = (w, side, nodes) => [T(`<td${cls} width="${w}%" valign="top"${reverse ? ' dir="ltr"' : ""} style="width:${w}%;padding:${side === "l" ? "0 8px 0 0" : "0 0 0 8px"}">`), ...nodes, T("</td>")];
      // Inversion : technique dir="rtl" (cellules dans l'ordre droite → gauche, affichées gauche → droite sur ordinateur,
      // empilées droite d'abord sur mobile) — comprise par Outlook, Gmail et Apple Mail
      return {
        normalized: { ...(rich ? { leftHtml: leftC.html, rightHtml: rightC.html } : { left: block.left, right: block.right }), ...(ratio !== "50-50" ? { ratio } : {}), ...(stack ? {} : { stack: false }), ...(reverse ? { reverse: true } : {}) },
        nodes: [
          T(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed"${reverse ? ' dir="rtl"' : ""}><tr>`),
          ...(reverse ? [...cell(wr, "r", right), ...cell(wl, "l", left)] : [...cell(wl, "l", left), ...cell(wr, "r", right)]),
          T("</tr></table>"),
        ],
      };
    }
    case "quote": {
      meta.hasText = true;
      const text = plain(block.text, allowed, { max: 500, required: true, label: "La citation" });
      const author = typeof block.author === "string" && block.author.trim() ? plain(block.author, allowed, { max: 100, label: "L'auteur" }) : null;
      const typo = typography(block, { sizeMin: 12, sizeMax: 32 });
      const align = block.align === undefined || block.align === null || block.align === "" ? null : alignOf(block.align);
      const qcss = `border-left:4px solid ${theme.accent};padding:8px 0 8px 16px;font-size:${typo.fontSize || 18}px;line-height:${typo.lineHeight || 1.5};font-style:${block.italic === false ? "normal" : "italic"};color:${typo.color || theme.textColor}`
        + `${typo.font ? `;font-family:${FONTS[typo.font]}` : ""}${typo.weight ? `;font-weight:${WEIGHTS[typo.weight]}` : ""}${typo.letterSpacing ? `;letter-spacing:${typo.letterSpacing}px` : ""}${align ? `;text-align:${align}` : ""}`;
      return {
        normalized: { text: block.text.trim(), ...(author ? { author: block.author.trim() } : {}), ...typo, ...(block.italic === false ? { italic: false } : {}), ...(align ? { align } : {}) }, // citation : italique par défaut
        nodes: [
          T(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td${cls("f")} style="${qcss}">“`),
          ...text,
          T("”"),
          ...(author ? [T(`<br><span style="font-size:14px;font-style:normal;color:${MUTED}">— `), ...author, T("</span>")] : []),
          T("</td></tr></table>"),
        ],
      };
    }
    case "list": {
      meta.hasText = true;
      const style = block.style === undefined ? "bullets" : block.style;
      if (!LIST_STYLES.includes(style)) throw fail(`Style de liste inconnu (${LIST_STYLES.join(", ")}).`);
      if (!Array.isArray(block.items)) throw fail("Les éléments d'une liste doivent être un tableau de textes.");
      if (block.items.length < 1) throw fail("Une liste contient au moins un élément.");
      if (block.items.length > MAX_LIST_ITEMS) throw fail(`Trop d'éléments (${MAX_LIST_ITEMS} au plus).`);
      const items = block.items.map((item, i) => {
        if (typeof item !== "string") throw fail(`Élément ${i + 1} : un texte est attendu.`);
        return plain(item, allowed, { max: 200, required: true, label: `L'élément ${i + 1}` });
      });
      const nodes = [];
      if (style === "checks") {
        nodes.push(T('<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'));
        items.forEach((item) => nodes.push(T(`<tr><td width="24" valign="top" style="width:24px;padding:0 0 6px;font-weight:800;color:${theme.accent}">✓</td><td valign="top" style="padding:0 0 6px">`), ...item, T("</td></tr>")));
        nodes.push(T("</table>"));
      } else {
        const tag = style === "numbers" ? "ol" : "ul";
        nodes.push(T(`<${tag} style="margin:0;padding-left:24px">`));
        items.forEach((item) => nodes.push(T('<li style="margin:0 0 6px">'), ...item, T("</li>")));
        nodes.push(T(`</${tag}>`));
      }
      const typo = typography(block, { sizeMin: 12, sizeMax: 28 });
      if (block.align !== undefined && block.align !== null && block.align !== "") typo.align = alignOf(block.align);
      const css = typoCss(typo);
      const wrapped = css || k.f ? [T(`<div${cls("f")}${css ? ` style="${css}"` : ""}>`), ...nodes, T("</div>")] : nodes;
      return { normalized: { style, items: block.items.map((i) => i.trim()), ...typo }, nodes: wrapped };
    }
    case "social": {
      meta.hasText = true;
      if (!Array.isArray(block.links)) throw fail("Les réseaux sociaux doivent être un tableau de liens.");
      if (block.links.length < 1) throw fail("Ajoutez au moins un réseau social.");
      if (block.links.length > MAX_SOCIAL) throw fail(`Trop de liens (${MAX_SOCIAL} au plus).`);
      const align = alignOf(block.align === undefined ? "center" : block.align);
      const display = block.display === undefined || block.display === null ? "text" : block.display;
      if (!SOCIAL_STYLES.includes(display)) throw fail("Présentation des réseaux inconnue (text ou buttons).");
      const brand = block.colors !== "accent"; // pastilles : couleurs des réseaux (par défaut) ou couleur principale du message
      const seen = new Set();
      const nodes = display === "buttons"
        ? [T(`<div${cls("f")} style="font-size:0;line-height:0;text-align:${align}">`)]
        : [T(`<p${cls("f")} style="margin:0;font-size:15px;line-height:1.8;text-align:${align}">`)];
      const normalizedLinks = block.links.map((link, i) => {
        if (!link || typeof link !== "object") throw fail(`Lien ${i + 1} invalide.`);
        if (!Object.hasOwn(NETWORKS, link.network)) throw fail(`Réseau inconnu « ${String(link.network).slice(0, 20)} » (${Object.keys(NETWORKS).join(", ")}).`);
        if (seen.has(link.network)) throw fail(`Le réseau « ${NETWORKS[link.network]} » est présent deux fois.`);
        seen.add(link.network);
        const url = urlNodes(link.url, { system: false });
        if (display === "buttons") {
          const bg = brand ? NETWORK_COLORS[link.network] : theme.accent;
          nodes.push(T('<a href="'), ...url, T(`" style="display:inline-block;margin:4px;padding:8px 14px;background:${bg};font-size:14px;font-weight:700;line-height:1.2;color:${textOn(bg)};text-decoration:none;border-radius:${theme.radius}px">${NETWORKS[link.network]}</a>`));
        } else {
          if (i > 0) nodes.push(T("&nbsp;·&nbsp; "));
          nodes.push(T('<a href="'), ...url, T(`" style="color:${theme.accent};font-weight:700;text-decoration:underline">${NETWORKS[link.network]}</a>`));
        }
        return { network: link.network, url: link.url.trim() };
      });
      nodes.push(T(display === "buttons" ? "</div>" : "</p>"));
      return { normalized: { links: normalizedLinks, align, ...(display !== "text" ? { display } : {}), ...(display === "buttons" && !brand ? { colors: "accent" } : {}) }, nodes };
    }
    case "video": {
      meta.hasText = true;
      const url = urlNodes(block.url, { system: false });
      const title = plain(block.title, allowed, { max: 200, required: true, label: "Le titre de la vidéo" });
      const thumb = block.thumbnail ? urlNodes(block.thumbnail, { system: false }) : null;
      const width = block.width === undefined ? 552 : block.width;
      if (!Number.isInteger(width) || width < 40 || width > 720) throw fail("Largeur invalide (40 à 720 pixels).");
      const align = alignOf(block.align === undefined ? "center" : block.align);
      const margin = align === "center" ? "margin:0 auto;" : align === "right" ? "margin:0 0 0 auto;" : "";
      if (thumb) meta.hasImage = true;
      return {
        normalized: { url: block.url.trim(), ...(thumb ? { thumbnail: block.thumbnail.trim() } : {}), title: block.title.trim(), width, align },
        nodes: [
          ...(thumb ? [T('<a href="'), ...url, T(`" style="text-decoration:none"><img${k.w || k.a ? ` class="${[k.w, k.a].filter(Boolean).join(" ")}"` : ""} src="`), ...thumb, T('" alt="'), ...title, T(`" width="${width}" style="display:block;border:0;max-width:100%;height:auto;${margin}"></a>`)] : []),
          T(`<p${cls("f")} style="margin:${thumb ? "8px" : "0"} 0 0;text-align:${align}"><a href="`), ...url, T(`" style="color:${theme.accent};font-weight:700;text-decoration:underline">▶ Regarder la vidéo : `), ...title, T("</a></p>"),
        ],
      };
    }
    // Articles : liste d'articles (blog KOLAKISA ou flux RSS) prise en instantané par le SERVEUR (templates/posts.js, ou
    // injectée à chaque envoi d'une campagne RSS). Vide : autorisé dans un modèle (rempli à l'envoi d'une campagne RSS),
    // mais signalé comme bloquant pour un envoi ordinaire (lint « posts_empty »).
    case "posts": {
      meta.hasText = true;
      const count = Number.isInteger(block.count) && block.count >= 1 && block.count <= 10 ? block.count : 3;
      const layout = block.layout === "titles" ? "titles" : "excerpt";
      const showImages = block.showImages !== false;
      const cta = block.cta === undefined ? "Lire la suite" : block.cta;
      const label = plain(cta, allowed, { max: 40, required: true, label: "Le libellé du lien" });
      const raw = Array.isArray(block.items) ? block.items.slice(0, 20) : [];
      const items = raw.map((it, i) => {
        if (!it || typeof it !== "object") throw fail(`Articles : élément ${i + 1} invalide.`);
        const title = typeof it.title === "string" ? it.title.replace(CONTROLS, " ").trim().slice(0, 200) : "";
        if (!title) throw fail(`Articles : l'élément ${i + 1} n'a pas de titre.`);
        return { title, url: trustedUrl(it.url, "Article"), excerpt: typeof it.excerpt === "string" ? it.excerpt.replace(CONTROLS, " ").trim().slice(0, 300) : "", image: it.image ? trustedUrl(it.image, "Article (image)") : "", date: Number.isFinite(it.date) ? it.date : null };
      });
      if (!items.length) meta.postsEmpty = true;
      const nodes = [];
      if (!items.length) nodes.push(T(`<p style="margin:0;padding:16px;border:1px dashed #d5e3ee;color:${MUTED};font-size:15px">Les derniers articles s'afficheront ici.</p>`));
      items.forEach((it, i) => {
        if (showImages && it.image && layout === "excerpt") { meta.hasImage = true; nodes.push(T(`<a href="${escapeHtml(it.url)}" style="text-decoration:none"><img src="${escapeHtml(it.image)}" alt="${escapeHtml(it.title)}" width="${Math.max(200, (theme.maxWidth || 600) - 40)}" style="display:block;border:0;width:100%;max-width:100%;height:auto;margin:0 0 10px"></a>`)); }
        const day = it.date ? new Date(it.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";
        nodes.push(T(`<p style="margin:0 0 4px;font-size:${layout === "titles" ? 17 : 20}px;line-height:1.3;font-weight:800"><a href="${escapeHtml(it.url)}" style="color:${theme.textColor};text-decoration:none">${escapeHtml(it.title)}</a></p>`));
        if (day && layout === "excerpt") nodes.push(T(`<p style="margin:0 0 6px;font-size:13px;color:${MUTED}">${escapeHtml(day)}</p>`));
        if (it.excerpt && layout === "excerpt") nodes.push(T(`<p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:${theme.textColor}">${escapeHtml(it.excerpt)}</p>`));
        if (layout === "excerpt") { nodes.push(T(`<p style="margin:0"><a href="${escapeHtml(it.url)}" style="color:${theme.accent};font-weight:700;text-decoration:underline">`), ...label, T(" →</a></p>")); }
        if (i < items.length - 1) nodes.push(T(`<hr style="border:0;border-top:1px solid #d5e3ee;margin:${layout === "titles" ? 10 : 20}px 0">`));
      });
      return { normalized: { count, layout, showImages, cta: cta.trim(), items }, nodes };
    }
    case "course": {
      meta.hasText = true;
      const snap = block.snapshot;
      if (!Number.isInteger(block.courseId) || block.courseId < 1 || !snap || typeof snap !== "object" || snap.id !== block.courseId) throw fail("Choisissez une formation du catalogue (bloc « formation »).");
      const title = typeof snap.title === "string" ? snap.title.trim() : "";
      if (!title || title.length > 200) throw fail("Formation : le titre est absent ou trop long.");
      const subtitle = typeof snap.subtitle === "string" ? snap.subtitle.trim().slice(0, 300) : "";
      if (!Number.isInteger(snap.priceCents) || snap.priceCents < 0) throw fail("Formation : prix invalide.");
      const url = trustedUrl(snap.url, "Formation");
      const image = snap.image ? trustedUrl(snap.image, "Formation (image)") : "";
      const cta = block.cta === undefined ? "Voir la formation" : block.cta;
      const label = plain(cta, allowed, { max: 80, required: true, label: "Le libellé du bouton" });
      const ink = textOn(theme.accent);
      if (contrast(ink, theme.accent) < 4.5) meta.lowContrast.push(theme.accent);
      if (image) meta.hasImage = true;
      const text = [
        T(`<p style="margin:0 0 4px;font-size:20px;line-height:1.3;font-weight:800;color:${theme.textColor}">${escapeHtml(title)}</p>`),
        ...(subtitle ? [T(`<p style="margin:0 0 8px;font-size:15px;color:${MUTED}">${escapeHtml(subtitle)}</p>`)] : []),
        T(`<p style="margin:0 0 12px;font-size:16px;font-weight:700;color:${theme.accent}">${escapeHtml(euros(snap.priceCents))}</p>`),
        T(`<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${theme.accent};border-radius:4px"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;font-size:16px;font-weight:700;text-decoration:none;color:${ink}">`),
        ...label, T("</a></td></tr></table>"),
      ];
      return {
        normalized: { courseId: block.courseId, cta: cta.trim(), snapshot: { id: snap.id, title, subtitle, priceCents: snap.priceCents, url, image } },
        nodes: [
          T('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d5e3ee"><tr>'),
          ...(image ? [T(`<td class="mk-col" width="200" valign="top" style="width:200px"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" width="200" style="display:block;border:0;max-width:100%;height:auto"></td>`)] : []),
          T('<td class="mk-col" valign="top" style="padding:16px">'), ...text, T("</td></tr></table>"),
        ],
      };
    }
    case "link": {
      meta.hasText = true;
      const label = plain(block.label, allowed, { max: 120, required: true, label: "Le texte du lien" });
      const url = localMedia(block.url) || urlNodes(block.url, { mailto: true });
      const align = alignOf(block.align);
      const newTab = optBool(block.newTab);
      const typo = typography(block, { sizeMin: 12, sizeMax: 28 });
      const pcss = [typo.font ? `font-family:${FONTS[typo.font]}` : "", typo.fontSize ? `font-size:${typo.fontSize}px` : "", typo.lineHeight ? `line-height:${typo.lineHeight}` : ""].filter(Boolean).map((x) => `;${x}`).join("");
      const acss = `color:${typo.color || theme.accent};font-weight:${typo.weight ? WEIGHTS[typo.weight] : 700}${typo.italic ? ";font-style:italic" : ""}${typo.letterSpacing ? `;letter-spacing:${typo.letterSpacing}px` : ""};text-decoration:underline`;
      return {
        normalized: { label: block.label.trim(), url: block.url.trim(), align, ...(newTab ? { newTab } : {}), ...typo },
        nodes: [T(`<p${cls("f")} style="margin:0;text-align:${align}${pcss}"><a href="`), ...url, T(`"${newTab ? ' target="_blank"' : ""} style="${acss}">`), ...label, T("</a></p>")],
      };
    }
    case "coupon": {
      meta.hasText = true;
      const code = plain(block.code, allowed, { max: 40, required: true, label: "Le code promo" });
      const title = typeof block.title === "string" && block.title.trim() ? plain(block.title, allowed, { max: 100, label: "Le titre de l'offre" }) : null;
      const details = typeof block.details === "string" && block.details.trim() ? plain(block.details, allowed, { max: 300, label: "Les conditions" }) : null;
      const border = optHex(block.color, "Couleur du coupon") || theme.accent;
      return {
        normalized: { code: block.code.trim(), ...(title ? { title: block.title.trim() } : {}), ...(details ? { details: block.details.trim() } : {}), ...(block.color ? { color: border } : {}) },
        nodes: [
          T(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 16px;border:2px dashed ${border};border-radius:${theme.radius}px;text-align:center">`),
          ...(title ? [T(`<p style="margin:0 0 8px;font-size:17px;font-weight:700;color:${theme.textColor}">`), ...title, T("</p>")] : []),
          T(`<p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:700;letter-spacing:3px;color:${border}">`), ...code, T("</p>"),
          ...(details ? [T(`<p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:${MUTED}">`), ...details, T("</p>")] : []),
          T("</td></tr></table>"),
        ],
      };
    }
    default:
      throw fail(`Type de bloc inconnu « ${String(block.type).slice(0, 30)} » (types : ${TYPES.join(", ")} ; le pied de page est géré par le système).`);
  }
}

function footerNodes(kind, footer, env) {
  const nodes = [T(`<tr><td style="padding:16px 24px 24px;font-size:12px;line-height:1.5;color:${MUTED};text-align:center">`)];
  const defaultText = kind === "marketing" ? "Vous recevez cet e-mail parce que vous êtes en relation avec {{org.name}}." : "Ce message concerne votre compte chez {{org.name}}.";
  const text = footer && typeof footer.text === "string" && footer.text.trim() ? footer.text : defaultText;
  nodes.push(T('<p style="margin:0 0 8px">'), ...plain(text, env.allowed, { max: 1000, label: "Le texte du pied de page" }), T("</p>"));
  nodes.push({ t: "if", branches: [{ cond: engine.compileCondition("org.address", { allowed: anything }), body: [T('<p style="margin:0 0 8px;white-space:pre-line">'), V("org.address"), T("</p>")] }], else: null });
  if (kind === "marketing") {
    const link = `color:${MUTED};text-decoration:underline`;
    nodes.push(
      T(`<p style="margin:0"><a href="`), V("unsubscribe_url"), T(`" style="${link}">Se désinscrire</a>`),
      { t: "if", branches: [{ cond: engine.compileCondition("preferences_url", { allowed: anything }), body: [T(' · <a href="'), V("preferences_url"), T(`" style="${link}">Gérer mes préférences</a>`)] }], else: null },
      T("</p>"),
    );
  }
  nodes.push(T("</td></tr>"));
  return nodes;
}

// ---------- Compilation d'un modèle ----------
// annotate (aperçu de l'éditeur UNIQUEMENT, jamais un envoi) : chaque bloc porte data-mk-block="<id>" pour être
// sélectionné dans le rendu, et un bloc incomplet est montré à sa place (avec son problème, listé dans
// meta.blockErrors) au lieu de faire échouer tout l'aperçu. Le rendu d'un envoi reste strict.
function compileTemplate(template, { allowed = () => false, annotate = false, tolerant = false } = {}) {
  if (!template || typeof template !== "object") throw fail("Modèle invalide.");
  const kind = template.kind === undefined ? "marketing" : template.kind;
  if (!KINDS.includes(kind)) throw fail("Type de modèle invalide (marketing ou transactional).");
  if (template.blocks !== undefined && !Array.isArray(template.blocks)) throw fail("Les blocs doivent être une liste.");
  const blocks = template.blocks || [];
  if (blocks.length > MAX_BLOCKS) throw fail(`Trop de blocs (${MAX_BLOCKS} au plus).`);

  const theme = normalizeTheme(template.theme);
  const env = { theme, allowed };
  const meta = { kind, blockCount: blocks.filter((b) => b && !b.hidden).length, blockTypes: [], hasText: false, hasImage: false, hasButton: false, lowContrast: [], varsNoDefault: [], preheader: "", blockErrors: [], postsEmpty: false };

  const subjectSource = (typeof template.subject === "string" ? template.subject : "").replace(CONTROLS, " ").trim();
  if (subjectSource.length > 200) throw fail("L'objet est trop long (200 caractères au plus).");
  const subjectAst = engine.compile(subjectSource, { allowed });
  const preheaderSource = (typeof template.preheader === "string" ? template.preheader : "").replace(CONTROLS, " ").trim();
  const preheaderNodes = plain(preheaderSource, allowed, { max: 200, label: "Le préheader" });
  meta.preheader = preheaderSource;

  const bodyNodes = [];
  const normalizedBlocks = [];
  const mobileRules = [];
  const seenIds = new Set();
  blocks.forEach((block, index) => {
    const at = `Bloc ${index + 1}`;
    if (!block || typeof block !== "object" || Array.isArray(block)) throw fail(`${at} invalide : un objet est attendu.`);
    let id = block.id === undefined ? `b${index + 1}` : block.id;
    try {
      if (typeof id !== "string" || !/^[a-z0-9_-]{1,40}$/.test(id) || seenIds.has(id)) throw fail("Identifiant de bloc invalide ou en double (minuscules, chiffres, - et _, 40 caractères au plus).");
      seenIds.add(id);
      // Bloc masqué : conservé dans le modèle (et réaffichable), jamais envoyé ; visible estompé dans l'éditeur
      const hidden = block.hidden === true;
      const mobile = mobileOf(block);
      const k = mobile ? { f: `mkf-${id}`, a: `mka-${id}`, w: `mkw-${id}`, h: `mkh-${id}` } : {};
      const built = buildBlock(block, env, hidden ? { ...meta, lowContrast: [] } : meta, k);
      if (!hidden) meta.blockTypes.push(block.type);
      let showIf = null;
      if (block.showIf !== undefined && block.showIf !== null && block.showIf !== "") {
        if (typeof block.showIf !== "string") throw fail("La condition d'affichage doit être un texte.");
        if (block.showIf.length > 200) throw fail("La condition d'affichage est trop longue (200 caractères au plus).");
        if (/\{\{|\{%|%\}|\}\}/.test(block.showIf)) throw fail("Condition d'affichage invalide : écrivez seulement la condition (ex. contact.country == \"FR\").");
        showIf = engine.compileCondition(block.showIf, { allowed });
      }
      const box = boxOf(block);
      const pad = SPACING[theme.spacing];
      const classes = [box && box.hideMobile ? "mk-hide-m" : "", box && box.hideDesktop ? "mk-hide-d" : ""].filter(Boolean).join(" ");
      // Masqué sur ordinateur : caché par défaut (y compris Outlook : mso-hide), affiché par la règle mobile
      const rowStyle = [box && box.hideDesktop ? "display:none;mso-hide:all;max-height:0;overflow:hidden" : "", hidden && annotate ? "opacity:.35" : ""].filter(Boolean).join(";");
      const mark = `${classes ? ` class="${classes}"` : ""}${rowStyle ? ` style="${rowStyle}"` : ""}${annotate ? ` data-mk-block="${id}"${hidden ? ' data-mk-hidden="true"' : ""}` : ""}`;
      const side = (key) => (box && box[key] !== undefined ? box[key] : 24);
      const borderCss = box && box.border && box.border.style ? `;border:${box.border.width}px ${box.border.style} ${box.border.color}` : "";
      // Même écriture qu'avant quand gauche = droite : le HTML des messages existants reste identique
      const sides = `${side("padRight")}px`;
      const cellStyle = `padding:${box && box.padTop !== undefined ? box.padTop : pad}px ${sides} ${box && box.padBottom !== undefined ? box.padBottom : pad}px${side("padLeft") === side("padRight") ? "" : ` ${side("padLeft")}px`};font-size:16px;line-height:1.6;color:${theme.textColor}${box && box.background ? `;background:${box.background}` : ""}${borderCss}${box && box.border && box.border.radius ? `;border-radius:${box.border.radius}px` : ""}`;
      if (mobile && (!hidden || annotate)) mobileRules.push(mobileCss(id, mobile));
      const row = [T(`<tr${mark}><td${mobile ? ` class="mkc-${id}"` : ""} style="${cellStyle}">`), ...built.nodes, T("</td></tr>")];
      if (!hidden || annotate) bodyNodes.push(...(showIf && !annotate ? [{ t: "if", branches: [{ cond: showIf, body: row }], else: null }] : row));
      normalizedBlocks.push({ id, type: block.type, ...(hidden ? { hidden: true } : {}), ...(showIf ? { showIf: block.showIf.trim() } : {}), ...(box ? { box } : {}), ...(mobile ? { mobile } : {}), ...built.normalized });
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      // Éditeur : le bloc fautif reste visible à sa place, avec son problème ; le reste du message s'affiche normalement
      if ((annotate || tolerant) && typeof id === "string" && /^[a-z0-9_-]{1,40}$/.test(id)) {
        meta.blockErrors.push({ id, type: block.type, index, message: error.message });
        bodyNodes.push(T(`<tr${annotate ? ` data-mk-block="${id}"` : ""} data-mk-error="true"><td style="padding:8px 24px"><div style="padding:16px;border:2px dashed #b7860b;border-radius:8px;background:#fff8e1;color:#6a4e00;font:14px/1.45 -apple-system,Segoe UI,Roboto,Arial,sans-serif">${escapeHtml(error.message)}</div></td></tr>`));
        return;
      }
      throw fail(`${at} : ${error.message}`);
    }
  });

  const font = FONTS[theme.fontFamily];
  const padding = "&zwnj;&nbsp;".repeat(40);
  const ast = [
    T('<!DOCTYPE html>\n<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<meta name="x-apple-disable-message-reformatting">\n<meta name="color-scheme" content="light">\n<title>'),
    ...escapeAst(subjectAst),
    T(`</title>\n<style>@media only screen and (max-width:${theme.maxWidth + 24}px){.mk-container{width:100%!important}.mk-col{display:block!important;width:100%!important;padding:0 0 16px 0!important}.mk-hide-m{display:none!important}.mk-hide-d{display:table-row!important;max-height:none!important;overflow:visible!important}${mobileRules.join("")}}</style>\n</head>\n<body style="margin:0;padding:0;background:${theme.background}">\n`),
    ...(preheaderSource ? [T(`<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${theme.background}">`), ...preheaderNodes, T(`${padding}</div>\n`)] : []),
    T(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.background}"><tr><td align="center" style="padding:24px 12px">\n`),
    // Largeur fixe des colonnes (table-layout) + coupure des mots et adresses trop longs : le contenu ne peut jamais
    // élargir le message au-delà de l'écran (sinon une cellule s'étire à la taille du plus long mot)
    T(`<table role="presentation" class="mk-container" width="${theme.maxWidth}" cellpadding="0" cellspacing="0" style="width:${theme.maxWidth}px;max-width:100%;table-layout:fixed;overflow-wrap:anywhere;word-wrap:break-word;word-break:break-word;background:${theme.contentBackground};font-family:${font};color:${theme.textColor}">\n`),
    ...bodyNodes,
    ...footerNodes(kind, template.footer, env),
    T("\n</table>\n</td></tr></table>\n</body>\n</html>"),
  ];

  // Variables personnelles utilisées sans valeur par défaut (risque d'affichage vide)
  const noDefault = new Set();
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.t === "var" && /^contact\./.test(n.path) && n.path !== "contact.email" && !n.filters.some((f) => f.name === "default")) noDefault.add(n.path);
      else if (n.t === "if") { n.branches.forEach((b) => walk(b.body)); if (n.else) walk(n.else); }
    }
  };
  walk(ast);
  walk(subjectAst);
  meta.varsNoDefault = [...noDefault].sort();

  return {
    kind, ast, subjectAst, meta,
    normalized: { kind, subject: subjectSource, preheader: preheaderSource, theme, footer: { text: template.footer && typeof template.footer.text === "string" ? template.footer.text.trim() : "" }, blocks: normalizedBlocks },
    variables: engine.variablesUsed([...ast, ...subjectAst]),
  };
}

// ---------- Rendu pour un contact ----------
function renderEmail(compiled, context, options = {}) {
  const subject = engine.render(compiled.subjectAst, context, { ...options, escape: "header" }).trim();
  const html = engine.render(compiled.ast, context, { ...options, escape: "html" });
  const address = context && context.org && context.org.address;
  return { subject, html, text: htmlToText(html), meta: { addressPresent: typeof address === "string" && address.trim() !== "" } };
}

module.exports = { compileTemplate, renderEmail, normalizeTheme, DEFAULT_THEME, TYPES, KINDS, MAX_BLOCKS, FONTS, RATIOS };
