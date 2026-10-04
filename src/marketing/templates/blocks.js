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

const MAX_BLOCKS = 60;
const MARKDOWN_MAX = 10000;
const COLUMN_MAX = 5000;
const URL_PLACEHOLDER = "https://mk-url.invalid/";
const SYSTEM_URL = /^\{\{\s*(unsubscribe_url|preferences_url|view_url|event\.course_url|event\.learn_url)\s*\}\}$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const ALIGN = ["left", "center", "right"];
const MUTED = "#5d7182";
const FONTS = { system: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", serif: "Georgia,'Times New Roman',serif" };
const DEFAULT_THEME = { background: "#f3f8fc", contentBackground: "#ffffff", textColor: "#10222f", accent: "#0277b6", fontFamily: "system" };
const TYPES = ["heading", "text", "image", "button", "divider", "spacer", "columns", "quote", "list", "social", "video", "course"];
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
  for (const key of ["background", "contentBackground", "textColor", "accent"]) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== "string" || !HEX.test(input[key])) throw fail(`Couleur invalide pour « ${key} » : utilisez le format #rrggbb.`);
    theme[key] = input[key].toLowerCase();
  }
  if (input.fontFamily !== undefined) {
    if (!Object.hasOwn(FONTS, input.fontFamily)) throw fail(`Police inconnue (${Object.keys(FONTS).join(", ")}).`);
    theme.fontFamily = input.fontFamily;
  }
  return theme;
}

// ---------- Champs ----------
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
      meta.hasText = true;
      return { normalized: { text: block.text.trim(), level, align }, nodes: [T(`<h${level} style="margin:0;font-size:${level === 1 ? 28 : 22}px;line-height:1.25;font-weight:800;color:${theme.textColor};text-align:${align}">`), ...text, T(`</h${level}>`)] };
    }
    case "text": {
      meta.hasText = true;
      return { normalized: { markdown: block.markdown }, nodes: markdownNodes(block.markdown, env) };
    }
    case "image": {
      const src = localMedia(block.src) || urlNodes(block.src, { system: false });
      const decorative = block.decorative === true;
      const alt = plain(block.alt, allowed, { max: 200, label: "Le texte alternatif" });
      if (!decorative && !(typeof block.alt === "string" && block.alt.trim())) throw fail("Le texte alternatif est obligatoire (ou cochez « image décorative »).");
      const width = block.width === undefined ? 552 : block.width;
      if (!Number.isInteger(width) || width < 40 || width > 600) throw fail("Largeur invalide (40 à 600 pixels).");
      const align = alignOf(block.align);
      const href = block.href ? urlNodes(block.href) : null;
      const margin = align === "center" ? "margin:0 auto;" : align === "right" ? "margin:0 0 0 auto;" : "";
      meta.hasImage = true;
      return {
        normalized: { src: block.src.trim(), alt: (block.alt || "").trim(), decorative, width, align, ...(href ? { href: block.href.trim() } : {}) },
        nodes: [
          ...(href ? [T('<a href="'), ...href, T('" style="text-decoration:none">')] : []),
          T('<img src="'), ...src, T('" alt="'), ...alt, T(`" width="${width}" style="display:block;border:0;max-width:100%;height:auto;${margin}">`),
          ...(href ? [T("</a>")] : []),
        ],
      };
    }
    case "button": {
      const label = plain(block.label, allowed, { max: 80, required: true, label: "Le libellé du bouton" });
      const url = localMedia(block.url) || urlNodes(block.url, { mailto: true });
      if (block.color !== undefined && (typeof block.color !== "string" || !HEX.test(block.color))) throw fail("Couleur invalide pour le bouton : utilisez le format #rrggbb.");
      const color = (block.color || theme.accent).toLowerCase();
      const ink = textOn(color);
      if (contrast(ink, color) < 4.5) meta.lowContrast.push(color);
      const align = alignOf(block.align === undefined ? "center" : block.align);
      meta.hasButton = true;
      return {
        normalized: { label: block.label.trim(), url: block.url.trim(), align, ...(block.color ? { color } : {}) },
        nodes: [
          T(`<table role="presentation" align="${align}" cellpadding="0" cellspacing="0" style="margin:${align === "center" ? "0 auto" : "0"}"><tr><td style="background:${color};border-radius:4px"><a href="`),
          ...url,
          T(`" style="display:inline-block;padding:12px 24px;font-size:16px;font-weight:700;text-decoration:none;color:${ink}">`),
          ...label,
          T("</a></td></tr></table>"),
        ],
      };
    }
    case "divider":
      return { normalized: {}, nodes: [T('<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #d5e3ee;font-size:0;line-height:0;height:1px">&nbsp;</td></tr></table>')] };
    case "spacer": {
      const height = block.height === undefined ? 24 : block.height;
      if (!Number.isInteger(height) || height < 4 || height > 120) throw fail("Hauteur invalide (4 à 120 pixels).");
      return { normalized: { height }, nodes: [T(`<div style="height:${height}px;line-height:${height}px;font-size:0">&nbsp;</div>`)] };
    }
    case "columns": {
      meta.hasText = true;
      const left = markdownNodes(block.left, env, { max: COLUMN_MAX, label: "La colonne de gauche" });
      const right = markdownNodes(block.right, env, { max: COLUMN_MAX, label: "La colonne de droite" });
      return {
        normalized: { left: block.left, right: block.right },
        nodes: [
          T('<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td class="mk-col" width="50%" valign="top" style="width:50%;padding:0 8px 0 0">'),
          ...left,
          T('</td><td class="mk-col" width="50%" valign="top" style="width:50%;padding:0 0 0 8px">'),
          ...right,
          T("</td></tr></table>"),
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
      if (!Number.isInteger(width) || width < 40 || width > 600) throw fail("Largeur invalide (40 à 600 pixels).");
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
      const mark = annotate ? ` data-mk-block="${id}"${hidden ? ' data-mk-hidden="true" style="opacity:.35"' : ""}` : "";
      const row = [T(`<tr${mark}><td style="padding:8px 24px;font-size:16px;line-height:1.6;color:${theme.textColor}">`), ...built.nodes, T("</td></tr>")];
      if (!hidden || annotate) bodyNodes.push(...(showIf && !annotate ? [{ t: "if", branches: [{ cond: showIf, body: row }], else: null }] : row));
      normalizedBlocks.push({ id, type: block.type, ...(hidden ? { hidden: true } : {}), ...(showIf ? { showIf: block.showIf.trim() } : {}), ...built.normalized });
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
    T(`</title>\n<style>@media only screen and (max-width:620px){.mk-container{width:100%!important}.mk-col{display:block!important;width:100%!important;padding:0 0 16px 0!important}}</style>\n</head>\n<body style="margin:0;padding:0;background:${theme.background}">\n`),
    ...(preheaderSource ? [T(`<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${theme.background}">`), ...preheaderNodes, T(`${padding}</div>\n`)] : []),
    T(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.background}"><tr><td align="center" style="padding:24px 12px">\n`),
    T(`<table role="presentation" class="mk-container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${theme.contentBackground};font-family:${font};color:${theme.textColor}">\n`),
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

module.exports = { compileTemplate, renderEmail, normalizeTheme, DEFAULT_THEME, TYPES, KINDS, MAX_BLOCKS };
