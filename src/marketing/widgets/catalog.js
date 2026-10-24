// KOLAKISA CMS → Apparence → Widgets : zones et blocs. UNE définition par bloc : libellé, catégorie, réglages (schéma décrit pour l'éditeur), validation et rendu public.
// Rien n'est exécuté : un bloc est un objet JSON { id, type, settings } ; chaque réglage est revalidé ICI (jamais confiance au navigateur) puis le rendu produit du HTML échappé.
// Un bloc absent d'ici n'existe pas : le catalogue de l'éditeur est cette liste, ni plus ni moins.
const sanitizeHtml = require("sanitize-html");
const { slugify } = require("../../utils/format");

const MAX_PER_ZONE = 40, MAX_INACTIVE = 100;
const ID = /^[a-z0-9]{6,24}$/;

// Zones réellement rendues par le moteur (views/partials/footer.ejs, views/marketing-public/landing.ejs, views/blog/*) — jamais de zone « pour remplir ».
const ZONES = Object.freeze([
  { key: "sidebar", label: "Colonne latérale principale", description: "Colonne à droite de la liste des articles du blog (sous l'article sur la page d'un article).", where: "Blog" },
  { key: "footer-1", label: "Section 1 de pied de page", description: "Première section du pied de page : sur le site principal et sur les pages du site.", where: "Pied de page" },
  { key: "footer-2", label: "Section 2 de pied de page", description: "Deuxième section du pied de page, à côté de la première.", where: "Pied de page" },
]);
const ZONE_KEYS = ZONES.map((z) => z.key);
const CATEGORIES = Object.freeze([
  { key: "texte", label: "Texte" }, { key: "media", label: "Médias" }, { key: "design", label: "Design" },
  { key: "site", label: "Site et navigation" }, { key: "dynamique", label: "Contenu dynamique" }, { key: "avance", label: "Avancé" },
]);

// ---------- Aides de validation ----------
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const text = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
const oneLine = (v, max = 200) => text(v, max).replace(/\s+/g, " ");
const oneOf = (v, list, dflt) => (list.includes(v) ? v : dflt);
const int = (v, min, max, dflt) => { const n = Number.parseInt(v, 10); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt; };
const bool = (v, dflt = false) => (v === undefined || v === null ? dflt : v === true || v === "true" || v === "1" || v === 1 || v === "on");
const MEDIA_PATH = /^\/uploads\/[A-Za-z0-9][A-Za-z0-9/_.\-]{0,200}$/;
// Adresse de média : fichier téléversé du site OU https ; jamais javascript:, data:, ni adresse sans protocole
const mediaUrl = (v) => { const s = text(v, 500); if (!s) return ""; if (MEDIA_PATH.test(s) && !s.includes("..")) return s; return /^https:\/\/[^\s"'<>\\]+$/.test(s) ? s : ""; };
const linkUrl = (v) => { const s = text(v, 500); if (!s) return ""; if (/^\/(?!\/)[^\s"'<>\\]*$/.test(s)) return s; if (/^(https?:\/\/[^\s"'<>\\]+|mailto:[^\s"'<>\\@]+@[^\s"'<>\\]+|tel:[+0-9 ().-]{3,30})$/i.test(s)) return s; return ""; };
const external = (u) => /^https?:\/\//i.test(u);
const relOf = (u) => (external(u) ? ' target="_blank" rel="noopener noreferrer"' : "");
const ALIGN = ["left", "center", "right"];
const title = (s) => (s.title ? `<h3 class="kw-widget-title">${esc(s.title)}</h3>` : "");

const HTML_OPTIONS = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "small", "sup", "sub", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "hr", "blockquote", "code", "pre", "span", "div", "img", "table", "thead", "tbody", "tr", "th", "td", "figure", "figcaption"],
  allowedAttributes: { a: ["href", "title", "target", "rel"], img: ["src", "alt", "title", "width", "height", "loading"], "*": ["class"], td: ["colspan", "rowspan"], th: ["colspan", "rowspan"] },
  allowedSchemes: ["https", "http", "mailto", "tel"], allowedSchemesByTag: { img: ["https"] }, allowProtocolRelative: false,
  allowedClasses: { "*": [/^kw-[a-z0-9-]{1,40}$/] },
  transformTags: { a: (tag, a) => ({ tagName: "a", attribs: { ...a, ...(a.href && /^https?:/i.test(a.href) ? { target: "_blank", rel: "noopener noreferrer" } : {}) } }), img: (tag, a) => ({ tagName: "img", attribs: { ...a, loading: "lazy" } }) },
  disallowedTagsMode: "discard",
};
const cleanHtml = (v) => sanitizeHtml(String(v ?? "").slice(0, 20000), HTML_OPTIONS).trim();

const F = {
  title: { name: "title", label: "Titre du bloc", type: "text", max: 80, help: "Affiché au-dessus du contenu (facultatif)." },
  align: { name: "align", label: "Alignement", type: "select", options: [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]] },
  cls: { name: "className", label: "Classe CSS", type: "text", max: 80, help: "Classes « kw-… » du thème, séparées par des espaces (facultatif)." },
};
const cssClass = (v) => text(v, 80).split(/\s+/).filter((c) => /^kw-[a-z0-9-]{1,40}$/.test(c)).slice(0, 4).join(" ");

// scope : { sql, params } de contentScope (articles du site) ou null ; db : base ; env : { siteId, scope, siteName }
const postsWhere = (env) => `p.published = 1 AND p.deleted_at IS NULL${env.scope ? " AND " + env.scope.sql.replace(/posts\.id/g, "p.id") : ""}`;
const sp = (env) => (env.scope ? env.scope.params : []);

const BLOCKS = [
  { key: "paragraph", label: "Paragraphe", category: "texte", icon: "text", description: "Un paragraphe de texte simple.", defaults: { text: "", align: "left", className: "" },
    fields: [{ name: "text", label: "Texte", type: "textarea", max: 4000 }, F.align, F.cls],
    clean: (s) => ({ text: text(s.text, 4000), align: oneOf(s.align, ALIGN, "left"), className: cssClass(s.className) }),
    render: (s) => (s.text ? `<div class="kw-widget-body kw-align-${s.align}">${s.text.split(/\n{2,}/).map((p) => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`).join("")}</div>` : "") },
  { key: "heading", label: "Titre", category: "texte", icon: "heading", description: "Un titre de section (niveau 2 à 4).", defaults: { text: "Titre", level: 3, align: "left", className: "" },
    fields: [{ name: "text", label: "Texte du titre", type: "text", max: 160 }, { name: "level", label: "Niveau", type: "select", options: [[2, "Titre 2"], [3, "Titre 3"], [4, "Titre 4"]] }, F.align, F.cls],
    clean: (s) => ({ text: oneLine(s.text, 160), level: int(s.level, 2, 4, 3), align: oneOf(s.align, ALIGN, "left"), className: cssClass(s.className) }),
    render: (s) => (s.text ? `<h${s.level} class="kw-widget-heading kw-align-${s.align}">${esc(s.text)}</h${s.level}>` : "") },
  { key: "list", label: "Liste", category: "texte", icon: "list", description: "Une liste à puces ou numérotée.", defaults: { title: "", items: [], ordered: false, className: "" },
    fields: [F.title, { name: "items", label: "Éléments (un par ligne)", type: "lines", max: 200, maxItems: 30 }, { name: "ordered", label: "Liste numérotée", type: "checkbox" }, F.cls],
    clean: (s) => ({ title: oneLine(s.title, 80), items: (Array.isArray(s.items) ? s.items : String(s.items || "").split("\n")).map((i) => oneLine(i, 200)).filter(Boolean).slice(0, 30), ordered: bool(s.ordered), className: cssClass(s.className) }),
    render: (s) => (s.items.length ? `${title(s)}<${s.ordered ? "ol" : "ul"} class="kw-widget-list">${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</${s.ordered ? "ol" : "ul"}>` : "") },
  { key: "image", label: "Image", category: "media", icon: "image", description: "Une image (fichier du site ou adresse https), avec lien facultatif.", defaults: { src: "", alt: "", caption: "", link: "", align: "center" },
    fields: [{ name: "src", label: "Image", type: "image" }, { name: "alt", label: "Texte alternatif", type: "text", max: 200, help: "Décrit l'image pour les lecteurs d'écran." }, { name: "caption", label: "Légende", type: "text", max: 200 }, { name: "link", label: "Lien", type: "url" }, F.align],
    clean: (s) => ({ src: mediaUrl(s.src), alt: oneLine(s.alt, 200), caption: oneLine(s.caption, 200), link: linkUrl(s.link), align: oneOf(s.align, ALIGN, "center") }),
    render: (s) => { if (!s.src) return ""; const img = `<img src="${esc(s.src)}" alt="${esc(s.alt)}" loading="lazy">`; return `<figure class="kw-widget-image kw-align-${s.align}">${s.link ? `<a href="${esc(s.link)}"${relOf(s.link)}>${img}</a>` : img}${s.caption ? `<figcaption>${esc(s.caption)}</figcaption>` : ""}</figure>`; } },
  { key: "gallery", label: "Galerie", category: "media", icon: "images", description: "Plusieurs images en grille (jusqu'à 12).", defaults: { title: "", images: [], columns: 3 },
    fields: [F.title, { name: "images", label: "Images (une adresse par ligne)", type: "lines", max: 500, maxItems: 12, help: "Fichiers du site (/uploads/…) ou adresses https." }, { name: "columns", label: "Colonnes", type: "select", options: [[2, "2"], [3, "3"], [4, "4"]] }],
    clean: (s) => ({ title: oneLine(s.title, 80), images: (Array.isArray(s.images) ? s.images : String(s.images || "").split("\n")).map((i) => mediaUrl(typeof i === "object" && i ? i.src : i)).filter(Boolean).slice(0, 12), columns: int(s.columns, 2, 4, 3) }),
    render: (s) => (s.images.length ? `${title(s)}<div class="kw-widget-gallery kw-cols-${s.columns}">${s.images.map((u) => `<img src="${esc(u)}" alt="" loading="lazy">`).join("")}</div>` : "") },
  { key: "video", label: "Vidéo", category: "media", icon: "video", description: "Un fichier vidéo du site (mp4, webm).", defaults: { src: "", title: "" },
    fields: [{ name: "src", label: "Fichier vidéo", type: "url", help: "Adresse d'un fichier mp4 ou webm (/uploads/… ou https)." }, { name: "title", label: "Titre", type: "text", max: 120 }],
    clean: (s) => { const u = mediaUrl(s.src); return { src: /\.(mp4|webm|ogv|m4v)(\?|$)/i.test(u) ? u : "", title: oneLine(s.title, 120) }; },
    render: (s) => (s.src ? `<figure class="kw-widget-video"><video controls preload="metadata" src="${esc(s.src)}"${s.title ? ` aria-label="${esc(s.title)}"` : ""}></video></figure>` : "") },
  { key: "audio", label: "Audio", category: "media", icon: "audio", description: "Un fichier audio du site (mp3, ogg, wav).", defaults: { src: "", title: "" },
    fields: [{ name: "src", label: "Fichier audio", type: "url", help: "Adresse d'un fichier mp3, ogg ou wav (/uploads/… ou https)." }, { name: "title", label: "Titre", type: "text", max: 120 }],
    clean: (s) => { const u = mediaUrl(s.src); return { src: /\.(mp3|ogg|wav|m4a|oga)(\?|$)/i.test(u) ? u : "", title: oneLine(s.title, 120) }; },
    render: (s) => (s.src ? `<div class="kw-widget-audio">${s.title ? `<p>${esc(s.title)}</p>` : ""}<audio controls preload="none" src="${esc(s.src)}"></audio></div>` : "") },
  { key: "button", label: "Bouton", category: "design", icon: "button", description: "Un bouton qui mène à une adresse.", defaults: { label: "En savoir plus", url: "", style: "primary", align: "left" },
    fields: [{ name: "label", label: "Texte du bouton", type: "text", max: 60 }, { name: "url", label: "Adresse", type: "url" }, { name: "style", label: "Style", type: "select", options: [["primary", "Plein"], ["outline", "Contour"]] }, F.align],
    clean: (s) => ({ label: oneLine(s.label, 60), url: linkUrl(s.url), style: oneOf(s.style, ["primary", "outline"], "primary"), align: oneOf(s.align, ALIGN, "left") }),
    render: (s) => (s.label && s.url ? `<p class="kw-align-${s.align}"><a class="kw-widget-button kw-widget-button--${s.style}" href="${esc(s.url)}"${relOf(s.url)}>${esc(s.label)}</a></p>` : "") },
  { key: "separator", label: "Séparateur", category: "design", icon: "minus", description: "Une ligne de séparation.", defaults: { style: "line" },
    fields: [{ name: "style", label: "Style", type: "select", options: [["line", "Ligne"], ["dots", "Points"]] }],
    clean: (s) => ({ style: oneOf(s.style, ["line", "dots"], "line") }), render: (s) => `<hr class="kw-widget-separator kw-widget-separator--${s.style}">` },
  { key: "spacer", label: "Espace", category: "design", icon: "space", description: "Un espace vertical entre deux blocs.", defaults: { size: "m" },
    fields: [{ name: "size", label: "Hauteur", type: "select", options: [["s", "Petite"], ["m", "Moyenne"], ["l", "Grande"], ["xl", "Très grande"]] }],
    clean: (s) => ({ size: oneOf(s.size, ["s", "m", "l", "xl"], "m") }), render: (s) => `<div class="kw-widget-spacer kw-spacer-${s.size}" aria-hidden="true"></div>` },
  { key: "site-identity", label: "Identité du site", category: "site", icon: "badge", description: "Le nom du site et une signature.", defaults: { tagline: "", showName: true, align: "left" },
    fields: [{ name: "showName", label: "Afficher le nom du site", type: "checkbox" }, { name: "tagline", label: "Signature", type: "text", max: 160 }, F.align],
    clean: (s) => ({ tagline: oneLine(s.tagline, 160), showName: bool(s.showName, true), align: oneOf(s.align, ALIGN, "left") }),
    render: (s, env) => { const name = s.showName ? env.siteName : ""; return name || s.tagline ? `<div class="kw-widget-identity kw-align-${s.align}">${name ? `<p class="kw-widget-site-name">${esc(name)}</p>` : ""}${s.tagline ? `<p class="kw-widget-tagline">${esc(s.tagline)}</p>` : ""}</div>` : ""; } },
  { key: "navigation", label: "Navigation", category: "site", icon: "menu", description: "Un menu du site (Apparence → Menus).", defaults: { title: "", menuId: 0 },
    fields: [F.title, { name: "menuId", label: "Menu", type: "menu" }],
    clean: (s) => ({ title: oneLine(s.title, 80), menuId: int(s.menuId, 0, 2147483647, 0) }),
    render: (s, env) => {
      if (!s.menuId) return "";
      const nav = require("../../services/navigation");
      // Le menu doit appartenir au site de la zone : jamais le menu d'un autre site, même avec un identifiant forgé
      const menu = env.db.prepare("SELECT id, site_id FROM nav_menus WHERE id = ?").get(s.menuId);
      if (!menu || (menu.site_id ?? null) !== (env.siteId ?? null)) return "";
      const data = nav.forMenu(s.menuId);
      const items = data && data.items ? data.items : [];
      const li = (it) => `<li>${it.href ? `<a href="${esc(it.href)}"${it.newTab ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(it.label)}</a>` : `<span>${esc(it.label)}</span>`}${it.children && it.children.length ? `<ul>${it.children.map(li).join("")}</ul>` : ""}</li>`;
      return items.length ? `${title(s)}<nav class="kw-widget-nav" aria-label="${esc(s.title || data.name || "Navigation")}"><ul>${items.map(li).join("")}</ul></nav>` : "";
    } },
  { key: "search", label: "Recherche", category: "dynamique", icon: "search", description: "Un champ de recherche dans le blog du site.", defaults: { title: "", placeholder: "Rechercher…" },
    fields: [F.title, { name: "placeholder", label: "Texte d'aide", type: "text", max: 60 }],
    clean: (s) => ({ title: oneLine(s.title, 80), placeholder: oneLine(s.placeholder, 60) || "Rechercher…" }),
    render: (s) => `${title(s)}<form class="kw-widget-search" action="/blog" method="get" role="search"><label class="sr-only" for="kw-ws-q">Rechercher</label><input id="kw-ws-q" type="search" name="q" maxlength="100" placeholder="${esc(s.placeholder)}"><button type="submit">Rechercher</button></form>` },
  { key: "recent-posts", label: "Articles récents", category: "dynamique", icon: "news", description: "Les derniers articles publiés du site.", defaults: { title: "Articles récents", count: 5, showDate: false },
    fields: [F.title, { name: "count", label: "Nombre d'articles", type: "number", min: 1, max: 15 }, { name: "showDate", label: "Afficher la date", type: "checkbox" }],
    clean: (s) => ({ title: oneLine(s.title, 80), count: int(s.count, 1, 15, 5), showDate: bool(s.showDate) }),
    render: (s, env) => {
      const rows = env.db.prepare(`SELECT p.id, p.title, p.slug, p.published_at FROM posts p WHERE ${postsWhere(env)} ORDER BY p.published_at DESC, p.id DESC LIMIT ?`).all(...sp(env), s.count);
      return rows.length ? `${title(s)}<ul class="kw-widget-list kw-widget-posts">${rows.map((r) => `<li><a href="${esc(require("../../services/urls").publicPath("post", r))}">${esc(r.title)}</a>${s.showDate && r.published_at ? ` <time datetime="${esc(String(r.published_at).slice(0, 10))}">${esc(String(r.published_at).slice(0, 10).split("-").reverse().join("/"))}</time>` : ""}</li>`).join("")}</ul>` : `${title(s)}<p class="kw-widget-empty">Aucun article publié pour l'instant.</p>`;
    } },
  { key: "recent-comments", label: "Commentaires récents", category: "dynamique", icon: "comment", description: "Les derniers commentaires approuvés.", defaults: { title: "Commentaires récents", count: 5 },
    fields: [F.title, { name: "count", label: "Nombre de commentaires", type: "number", min: 1, max: 15 }],
    clean: (s) => ({ title: oneLine(s.title, 80), count: int(s.count, 1, 15, 5) }),
    render: (s, env) => {
      const rows = env.db.prepare(`SELECT c.id, c.author_name, u.username, c.user_id, p.title, p.slug FROM blog_comments c JOIN posts p ON p.id = c.post_id LEFT JOIN users u ON u.id = c.user_id WHERE c.status = 'approved' AND ${postsWhere(env)} ORDER BY c.created_at DESC, c.id DESC LIMIT ?`).all(...sp(env), s.count);
      return rows.length ? `${title(s)}<ul class="kw-widget-list kw-widget-comments">${rows.map((r) => `<li>${esc(r.user_id ? r.username || "Membre" : r.author_name || "Anonyme")} sur <a href="/blog/${esc(encodeURIComponent(r.slug))}#commentaire-${r.id}">${esc(r.title)}</a></li>`).join("")}</ul>` : `${title(s)}<p class="kw-widget-empty">Aucun commentaire pour l'instant.</p>`;
    } },
  { key: "categories", label: "Catégories d'articles", category: "dynamique", icon: "folder", description: "Les catégories du blog, avec le nombre d'articles.", defaults: { title: "Catégories", showCount: true },
    fields: [F.title, { name: "showCount", label: "Afficher le nombre d'articles", type: "checkbox" }],
    clean: (s) => ({ title: oneLine(s.title, 80), showCount: bool(s.showCount, true) }),
    render: (s, env) => {
      const cats = require("../../services/blog").categories(env.scope).slice(0, 30);
      return cats.length ? `${title(s)}<ul class="kw-widget-list kw-widget-cats">${cats.map((c) => `<li><a href="/blog/categorie/${esc(c.slug)}">${esc(c.name)}</a>${s.showCount ? ` <span class="kw-widget-count">${c.count}</span>` : ""}</li>`).join("")}</ul>` : `${title(s)}<p class="kw-widget-empty">Aucune catégorie.</p>`;
    } },
  { key: "tag-cloud", label: "Nuage d'étiquettes", category: "dynamique", icon: "tag", description: "Les étiquettes des articles publiés.", defaults: { title: "Étiquettes", count: 20 },
    fields: [F.title, { name: "count", label: "Nombre d'étiquettes", type: "number", min: 1, max: 50 }],
    clean: (s) => ({ title: oneLine(s.title, 80), count: int(s.count, 1, 50, 20) }),
    render: (s, env) => {
      const blog = require("../../services/blog"), tax = require("../../services/taxonomy");
      const seen = new Map();
      for (const r of env.db.prepare(`SELECT p.tags FROM posts p WHERE ${postsWhere(env)} AND p.tags <> ''`).all(...sp(env))) for (const t of blog.parseTags(r.tags)) { const k = t.toLowerCase(); seen.set(k, { name: seen.get(k)?.name || t, n: (seen.get(k)?.n || 0) + 1 }); }
      const tags = [...seen.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, "fr")).slice(0, s.count);
      const base = tax.baseOf("tag");
      return tags.length ? `${title(s)}<p class="kw-widget-tags">${tags.map((t) => `<a href="${esc(base)}/${esc(slugify(t.name))}">${esc(t.name)}</a>`).join(" ")}</p>` : `${title(s)}<p class="kw-widget-empty">Aucune étiquette.</p>`;
    } },
  { key: "html", label: "HTML personnalisé", category: "avance", icon: "code", description: "Du HTML simple, nettoyé à l'enregistrement : pas de script, de cadre ni de formulaire.", defaults: { code: "" },
    fields: [{ name: "code", label: "Code HTML", type: "code", max: 20000, help: "Balises de texte, liens, images https et tableaux uniquement. Tout le reste est retiré." }],
    clean: (s) => ({ code: cleanHtml(s.code) }), render: (s) => (s.code ? `<div class="kw-widget-html">${cleanHtml(s.code)}</div>` : "") },
];
const BY_KEY = new Map(BLOCKS.map((b) => [b.key, b]));

// Version pour le navigateur : sans fonctions
const publicCatalog = () => BLOCKS.map(({ key, label, category, icon, description, defaults, fields }) => ({ key, label, category, icon, description, defaults, fields }));

// Bloc validé : { id, type, settings } ou une erreur lisible
function cleanBlock(raw, where) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(`${where} : bloc invalide.`);
  const def = BY_KEY.get(raw.type);
  if (!def) throw new Error(`${where} : le bloc « ${text(raw.type, 40)} » n'existe pas.`);
  if (typeof raw.id !== "string" || !ID.test(raw.id)) throw new Error(`${where} : identifiant de bloc invalide.`);
  const settings = raw.settings && typeof raw.settings === "object" && !Array.isArray(raw.settings) ? raw.settings : {};
  return { id: raw.id, type: def.key, settings: def.clean({ ...def.defaults, ...settings }) };
}

// Mise en page complète validée : tout ou rien (une erreur n'enregistre rien)
function cleanLayout(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Mise en page invalide.");
  const zonesIn = raw.zones && typeof raw.zones === "object" && !Array.isArray(raw.zones) ? raw.zones : {};
  for (const k of Object.keys(zonesIn)) if (!ZONE_KEYS.includes(k)) throw new Error(`La zone « ${text(k, 40)} » n'existe pas.`);
  const seen = new Set(), zones = {};
  const take = (list, where, max) => {
    if (list !== undefined && !Array.isArray(list)) throw new Error(`${where} : liste invalide.`);
    if ((list || []).length > max) throw new Error(`${where} : au plus ${max} blocs.`);
    return (list || []).map((b, i) => {
      const c = cleanBlock(b, `${where}, bloc ${i + 1}`);
      if (seen.has(c.id)) throw new Error(`${where} : un même bloc apparaît deux fois.`);
      seen.add(c.id); return c;
    });
  };
  for (const z of ZONES) zones[z.key] = take(zonesIn[z.key], z.label, MAX_PER_ZONE);
  return { zones, inactive: take(raw.inactive, "Widgets désactivés", MAX_INACTIVE) };
}
const emptyLayout = () => ({ zones: Object.fromEntries(ZONE_KEYS.map((k) => [k, []])), inactive: [] });

function renderBlock(block, env) {
  const def = BY_KEY.get(block.type);
  if (!def) return "";
  try {
    const inner = def.render(def.clean({ ...def.defaults, ...block.settings }), env);
    if (!inner) return "";
    const cls = block.settings && block.settings.className ? ` ${cssClass(block.settings.className)}` : "";
    return `<section class="kw-widget kw-widget--${def.key}${cls}" id="widget-${esc(block.id)}">${inner}</section>`;
  } catch { return ""; } // un bloc en échec n'empêche jamais la page de s'afficher
}

module.exports = { ZONES, ZONE_KEYS, CATEGORIES, BLOCKS, BY_KEY, MAX_PER_ZONE, MAX_INACTIVE, ID, publicCatalog, cleanBlock, cleanLayout, emptyLayout, renderBlock, cleanHtml, esc };
