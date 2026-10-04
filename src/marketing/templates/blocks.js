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
const TYPES = ["heading", "text", "image", "button", "divider", "spacer", "columns", "quote", "list", "social", "video", "course", "link", "coupon"];
const RATIOS = { "50-50": [50, 50], "60-40": [60, 40], "40-60": [40, 60], "70-30": [70, 30], "30-70": [30, 70] };
const BUTTON_SIZES = { s: "8px 16px", m: "12px 24px", l: "16px 32px" };
const NETWORKS = { facebook: "Facebook", instagram: "Instagram", x: "X", linkedin: "LinkedIn", youtube: "YouTube", tiktok: "TikTok", whatsapp: "WhatsApp", website: "Site web" };
const LIST_STYLES = ["bullets", "numbers", "checks"];
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
  return out;
}
const typoCss = (t) => [t.font ? `font-family:${FONTS[t.font]}` : "", t.fontSize ? `font-size:${t.fontSize}px` : "", t.lineHeight ? `line-height:${t.lineHeight}` : "", t.color ? `color:${t.color}` : ""].filter(Boolean).join(";");
// Réglages communs à tout bloc : marges intérieures haut/bas, fond, affichage par appareil
function boxOf(block) {
  if (block.box === undefined || block.box === null) return null;
  if (typeof block.box !== "object" || Array.isArray(block.box)) throw fail("Réglages du bloc invalides.");
  const b = block.box, out = {};
  if (b.padTop !== undefined && b.padTop !== null) out.padTop = intIn(b.padTop, 0, 64, "Marge du haut (0 à 64 px)");
  if (b.padBottom !== undefined && b.padBottom !== null) out.padBottom = intIn(b.padBottom, 0, 64, "Marge du bas (0 à 64 px)");
  const bg = optHex(b.background, "Fond du bloc"); if (bg) out.background = bg;
  if (optBool(b.hideMobile)) out.hideMobile = true;
  if (optBool(b.hideDesktop)) out.hideDesktop = true;
  if (out.hideMobile && out.hideDesktop) throw fail("Un bloc ne peut pas être masqué à la fois sur ordinateur et sur mobile (utilisez « Masquer le bloc »).");
  return Object.keys(out).length ? out : null;
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
function buildBlock(block, env, meta) {
  const { theme, allowed } = env;
  switch (block.type) {
    case "heading": {
      const level = block.level === undefined ? 2 : block.level;
      if (level !== 1 && level !== 2) throw fail("Niveau de titre invalide (1 ou 2).");
      const align = alignOf(block.align);
      const text = plain(block.text, allowed, { required: true, label: "Le titre" });
      const typo = typography(block, { sizeMin: 16, sizeMax: 44 });
      meta.hasText = true;
      const css = `margin:0;font-size:${typo.fontSize || (level === 1 ? 28 : 22)}px;line-height:${typo.lineHeight || 1.25};font-weight:800;color:${typo.color || theme.textColor};text-align:${align}${typo.font ? `;font-family:${FONTS[typo.font]}` : ""}`;
      return { normalized: { text: block.text.trim(), level, align, ...typo }, nodes: [T(`<h${level} style="${css}">`), ...text, T(`</h${level}>`)] };
    }
    case "text": {
      meta.hasText = true;
      const typo = typography(block);
      const wrap = (nodes) => { const css = typoCss(typo); return css ? [T(`<div style="${css}">`), ...nodes, T("</div>")] : nodes; };
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
          T('<img src="'), ...src, T('" alt="'), ...alt, T(`" width="${width}" style="display:block;border:0;max-width:100%;height:auto;${margin}${radius ? `border-radius:${radius}px;` : ""}">`),
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
      meta.hasButton = true;
      return {
        normalized: { label: block.label.trim(), url: block.url.trim(), align, ...(block.color ? { color } : {}), ...(textColor ? { textColor } : {}), ...(fontSize !== 16 ? { fontSize } : {}), ...(block.radius !== undefined && block.radius !== null ? { radius } : {}), ...(size !== "m" ? { size } : {}), ...(fullWidth ? { fullWidth } : {}), ...(newTab ? { newTab } : {}) },
        nodes: [
          T(`<table role="presentation" align="${fullWidth ? "center" : align}" cellpadding="0" cellspacing="0"${fullWidth ? ' width="100%"' : ""} style="margin:${align === "center" || fullWidth ? "0 auto" : "0"}${fullWidth ? ";width:100%" : ""}"><tr><td align="center" style="background:${color};border-radius:${radius}px"><a href="`),
          ...url,
          T(`"${newTab ? ' target="_blank"' : ""} style="display:${fullWidth ? "block" : "inline-block"};padding:${BUTTON_SIZES[size]};font-size:${fontSize}px;font-weight:700;text-decoration:none;color:${ink};border-radius:${radius}px">`),
          ...label,
          T("</a></td></tr></table>"),
        ],
      };
    }
    case "divider":
      return { normalized: {}, nodes: [T(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${theme.secondary};font-size:0;line-height:0;height:1px">&nbsp;</td></tr></table>`)] };
    case "spacer": {
      const height = block.height === undefined ? 24 : block.height;
      if (!Number.isInteger(height) || height < 4 || height > 120) throw fail("Hauteur invalide (4 à 120 pixels).");
      return { normalized: { height }, nodes: [T(`<div style="height:${height}px;line-height:${height}px;font-size:0">&nbsp;</div>`)] };
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
          T(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"${reverse ? ' dir="rtl"' : ""}><tr>`),
          ...(reverse ? [...cell(wr, "r", right), ...cell(wl, "l", left)] : [...cell(wl, "l", left), ...cell(wr, "r", right)]),
          T("</tr></table>"),
        ],
      };
    }
    case "quote": {
      meta.hasText = true;
      const text = plain(block.text, allowed, { max: 500, required: true, label: "La citation" });
      const author = typeof block.author === "string" && block.author.trim() ? plain(block.author, allowed, { max: 100, label: "L'auteur" }) : null;
      return {
        normalized: { text: block.text.trim(), ...(author ? { author: block.author.trim() } : {}) },
        nodes: [
          T(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-left:4px solid ${theme.accent};padding:8px 0 8px 16px;font-size:18px;line-height:1.5;font-style:italic;color:${theme.textColor}">“`),
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
      return { normalized: { style, items: block.items.map((i) => i.trim()) }, nodes };
    }
    case "social": {
      meta.hasText = true;
      if (!Array.isArray(block.links)) throw fail("Les réseaux sociaux doivent être un tableau de liens.");
      if (block.links.length < 1) throw fail("Ajoutez au moins un réseau social.");
      if (block.links.length > MAX_SOCIAL) throw fail(`Trop de liens (${MAX_SOCIAL} au plus).`);
      const align = alignOf(block.align === undefined ? "center" : block.align);
      const seen = new Set();
      const nodes = [T(`<p style="margin:0;font-size:15px;line-height:1.8;text-align:${align}">`)];
      const normalizedLinks = block.links.map((link, i) => {
        if (!link || typeof link !== "object") throw fail(`Lien ${i + 1} invalide.`);
        if (!Object.hasOwn(NETWORKS, link.network)) throw fail(`Réseau inconnu « ${String(link.network).slice(0, 20)} » (${Object.keys(NETWORKS).join(", ")}).`);
        if (seen.has(link.network)) throw fail(`Le réseau « ${NETWORKS[link.network]} » est présent deux fois.`);
        seen.add(link.network);
        const url = urlNodes(link.url, { system: false });
        if (i > 0) nodes.push(T("&nbsp;·&nbsp; "));
        nodes.push(T('<a href="'), ...url, T(`" style="color:${theme.accent};font-weight:700;text-decoration:underline">${NETWORKS[link.network]}</a>`));
        return { network: link.network, url: link.url.trim() };
      });
      nodes.push(T("</p>"));
      return { normalized: { links: normalizedLinks, align }, nodes };
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
          ...(thumb ? [T('<a href="'), ...url, T('" style="text-decoration:none"><img src="'), ...thumb, T('" alt="'), ...title, T(`" width="${width}" style="display:block;border:0;max-width:100%;height:auto;${margin}"></a>`)] : []),
          T(`<p style="margin:${thumb ? "8px" : "0"} 0 0;text-align:${align}"><a href="`), ...url, T(`" style="color:${theme.accent};font-weight:700;text-decoration:underline">▶ Regarder la vidéo : `), ...title, T("</a></p>"),
        ],
      };
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
      return {
        normalized: { label: block.label.trim(), url: block.url.trim(), align, ...(newTab ? { newTab } : {}) },
        nodes: [T(`<p style="margin:0;text-align:${align}"><a href="`), ...url, T(`"${newTab ? ' target="_blank"' : ""} style="color:${theme.accent};font-weight:700;text-decoration:underline">`), ...label, T("</a></p>")],
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
function compileTemplate(template, { allowed = () => false, annotate = false } = {}) {
  if (!template || typeof template !== "object") throw fail("Modèle invalide.");
  const kind = template.kind === undefined ? "marketing" : template.kind;
  if (!KINDS.includes(kind)) throw fail("Type de modèle invalide (marketing ou transactional).");
  if (template.blocks !== undefined && !Array.isArray(template.blocks)) throw fail("Les blocs doivent être une liste.");
  const blocks = template.blocks || [];
  if (blocks.length > MAX_BLOCKS) throw fail(`Trop de blocs (${MAX_BLOCKS} au plus).`);

  const theme = normalizeTheme(template.theme);
  const env = { theme, allowed };
  const meta = { kind, blockCount: blocks.filter((b) => b && !b.hidden).length, blockTypes: [], hasText: false, hasImage: false, hasButton: false, lowContrast: [], varsNoDefault: [], preheader: "", blockErrors: [] };

  const subjectSource = (typeof template.subject === "string" ? template.subject : "").replace(CONTROLS, " ").trim();
  if (subjectSource.length > 200) throw fail("L'objet est trop long (200 caractères au plus).");
  const subjectAst = engine.compile(subjectSource, { allowed });
  const preheaderSource = (typeof template.preheader === "string" ? template.preheader : "").replace(CONTROLS, " ").trim();
  const preheaderNodes = plain(preheaderSource, allowed, { max: 200, label: "Le préheader" });
  meta.preheader = preheaderSource;

  const bodyNodes = [];
  const normalizedBlocks = [];
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
      const built = buildBlock(block, env, hidden ? { ...meta, lowContrast: [] } : meta);
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
      const cellStyle = `padding:${box && box.padTop !== undefined ? box.padTop : pad}px 24px ${box && box.padBottom !== undefined ? box.padBottom : pad}px;font-size:16px;line-height:1.6;color:${theme.textColor}${box && box.background ? `;background:${box.background}` : ""}`;
      const row = [T(`<tr${mark}><td style="${cellStyle}">`), ...built.nodes, T("</td></tr>")];
      if (!hidden || annotate) bodyNodes.push(...(showIf && !annotate ? [{ t: "if", branches: [{ cond: showIf, body: row }], else: null }] : row));
      normalizedBlocks.push({ id, type: block.type, ...(hidden ? { hidden: true } : {}), ...(showIf ? { showIf: block.showIf.trim() } : {}), ...(box ? { box } : {}), ...built.normalized });
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      // Éditeur : le bloc fautif reste visible à sa place, avec son problème ; le reste du message s'affiche normalement
      if (annotate && typeof id === "string" && /^[a-z0-9_-]{1,40}$/.test(id)) {
        meta.blockErrors.push({ id, type: block.type, index, message: error.message });
        bodyNodes.push(T(`<tr data-mk-block="${id}" data-mk-error="true"><td style="padding:8px 24px"><div style="padding:16px;border:2px dashed #b7860b;border-radius:8px;background:#fff8e1;color:#6a4e00;font:14px/1.45 -apple-system,Segoe UI,Roboto,Arial,sans-serif">${escapeHtml(error.message)}</div></td></tr>`));
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
    T(`</title>\n<style>@media only screen and (max-width:${theme.maxWidth + 20}px){.mk-container{width:100%!important}.mk-col{display:block!important;width:100%!important;padding:0 0 16px 0!important}.mk-hide-m{display:none!important}.mk-hide-d{display:table-row!important;max-height:none!important;overflow:visible!important}}</style>\n</head>\n<body style="margin:0;padding:0;background:${theme.background}">\n`),
    ...(preheaderSource ? [T(`<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${theme.background}">`), ...preheaderNodes, T(`${padding}</div>\n`)] : []),
    T(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.background}"><tr><td align="center" style="padding:24px 12px">\n`),
    T(`<table role="presentation" class="mk-container" width="${theme.maxWidth}" cellpadding="0" cellspacing="0" style="width:${theme.maxWidth}px;max-width:100%;background:${theme.contentBackground};font-family:${font};color:${theme.textColor}">\n`),
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
