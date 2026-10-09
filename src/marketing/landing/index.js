// Pages d'atterrissage (point 6 de la parité Mailchimp) : pages web publiques /p/<adresse>, faites de sections.
// Grammaire fermée (aucun HTML libre) : chaque section est validée et normalisée à l'enregistrement ; les liens ne
// peuvent viser qu'une adresse https:// ou une page du site (« /… »), les images qu'une adresse https:// ou un fichier
// de la médiathèque marketing. L'inscription passe par un formulaire publié (preuve de consentement, double
// confirmation, liste, étiquettes du formulaire) ; la page ajoute jusqu'à 5 étiquettes à ses inscrits.
// Statistiques : visites (visiteurs uniques par jour, empreinte non réversible, robots exclus), clics, inscriptions.
const crypto = require("crypto");
const { MarketingError } = require("../errors");
const { checkCtx, audit } = require("../audience/shared");
const { getCourse } = require("../bridge/catalog");
const pageNodes = require("../pages/nodes");
// Grammaire des sections : commune à tout le moteur de pages (Site Web, Tunnels)
const { SECTION_TYPES, normalizeSection, normalizeSections, bad, line } = require("../pages/sections");

const MAX_TAGS = 5;
const STATUSES = { draft: "Brouillon", published: "En ligne", unpublished: "Hors ligne" };
const DEFAULT_THEME = { accent: "#0277b6", background: "#f3f8fc", text: "#10222f" };
const HEX = /^#[0-9a-f]{6}$/i;
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pingdom|monitor/i;

const parse = (row) => (row ? { ...row, sections: JSON.parse(row.sections || "[]"), theme: { ...DEFAULT_THEME, ...JSON.parse(row.theme || "{}") }, tags: JSON.parse(row.tags || "[]") } : null);
function getPage(ctx, id) {
  checkCtx(ctx);
  return parse(Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null);
}
function requirePage(ctx, id) {
  const p = getPage(ctx, id);
  if (!p) throw new MarketingError("not_found", "Page introuvable.");
  return p;
}
function getPublishedPage(db, slug) {
  return parse(SLUG.test(String(slug || "")) ? db.prepare("SELECT * FROM mk_landing_pages WHERE slug = ? AND status = 'published' AND archived_at IS NULL").get(slug) : null);
}
function listPages(ctx) {
  checkCtx(ctx);
  return ctx.db.prepare(`SELECT p.*,
      (SELECT COUNT(DISTINCT visitor) FROM mk_landing_events e WHERE e.page_id = p.id AND e.type = 'view') AS visitors,
      (SELECT COUNT(*) FROM mk_landing_events e WHERE e.page_id = p.id AND e.type = 'signup') AS signups
    FROM mk_landing_pages p WHERE p.organization_id = ? ORDER BY p.updated_at DESC, p.id DESC`).all(ctx.organizationId).map(parse);
}

function slugify(text) {
  return String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "") || "page";
}
function freeSlug(ctx, base, exceptId = null) {
  let slug = base, n = 2;
  // Une adresse qui sert de redirection (ancienne adresse d'une page renommée) n'est pas attribuée d'office : elle masquerait la nouvelle page
  const cms = require("../pages/cmsPages");
  while (ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE slug = ? AND id IS NOT ?").get(slug, exceptId) || cms.redirectSource(ctx, slug)) slug = `${base.slice(0, 55)}-${n++}`;
  return slug;
}

function createPage(ctx, { name } = {}) {
  checkCtx(ctx);
  const clean_ = line(name, 100);
  if (!clean_) throw bad("Le nom de la page est obligatoire.");
  if (ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, clean_)) throw new MarketingError("duplicate", "Une page porte déjà ce nom.");
  const sections = [{ type: "hero", title: clean_, subtitle: "Une phrase qui dit clairement ce que la personne y gagne.", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" }, { type: "form", heading: "Inscrivez-vous", intro: "" }];
  const id = Number(ctx.db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, created_by) VALUES (?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, clean_, freeSlug(ctx, slugify(clean_)), clean_, JSON.stringify(sections), ctx.userId ?? null).lastInsertRowid);
  audit(ctx, "landing.created", "landing", id, {});
  return getPage(ctx, id);
}

// Réglages de la page (nom, adresse, formulaire, étiquettes, indexation) : appliqués tout de suite, ils ne font pas
// partie du contenu publié (le contenu, lui, passe par le brouillon du moteur de pages : src/marketing/pages)
function saveSettings(ctx, id, input = {}) {
  const before = requirePage(ctx, id);
  const name = line(input.name, 100);
  if (!name) throw bad("Le nom de la page est obligatoire.");
  const dup = ctx.db.prepare("SELECT id FROM mk_landing_pages WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, name);
  if (dup && dup.id !== id) throw new MarketingError("duplicate", "Une page porte déjà ce nom.");
  const slug = line(input.slug, 60).toLowerCase();
  if (!SLUG.test(slug)) throw bad("Adresse de la page : lettres minuscules sans accent, chiffres et tirets (ex. « guide-gratuit »).");
  // Page d'un site : elle peut être servie à la racine du domaine du site, une adresse réservée à une route du site est donc refusée (palier 12)
  if (slug !== before.slug && before.site_id && require("../../services/urls").isReserved(slug)) throw bad(`« ${slug} » est réservée à une route du site : choisissez une autre adresse.`);
  if (ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE slug = ? AND id <> ?").get(slug, id)) throw new MarketingError("duplicate", `L'adresse « /p/${slug} » est déjà utilisée par une autre page.`);
  let formId = null;
  if (input.formId !== undefined && input.formId !== null && input.formId !== "") {
    formId = Number(input.formId);
    const form = ctx.db.prepare("SELECT id FROM mk_forms WHERE id = ? AND organization_id = ?").get(formId, ctx.organizationId);
    if (!form) throw bad("Formulaire d'inscription introuvable.");
  }
  const tags = [...new Set((Array.isArray(input.tags) ? input.tags : String(input.tags || "").split(",")).map((t) => line(t, 64)).filter(Boolean))];
  if (tags.length > MAX_TAGS) throw bad(`${MAX_TAGS} étiquettes au plus.`);
  ctx.db.prepare("UPDATE mk_landing_pages SET name = ?, slug = ?, form_id = ?, tags = ?, indexable = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name, slug, formId, JSON.stringify(tags), input.indexable ? 1 : 0, id);
  // Page en ligne dont l'adresse change : l'ancien lien redirige vers le nouveau (CMS, palier 2)
  require("../pages/cmsPages").slugChanged(ctx, { id, oldSlug: before.slug, newSlug: slug, status: before.status, publishedAt: before.published_at, siteId: before.site_id });
  return getPage(ctx, id);
}

// Enregistrement complet (réglages + contenu EN LIGNE immédiatement). Conservé pour l'API et les scripts ; l'éditeur
// passe par le brouillon (saveSettings + pages.saveDraft, puis pages.publish).
function savePage(ctx, id, input = {}) {
  const page = requirePage(ctx, id);
  saveSettings(ctx, id, input);
  const sections = normalizeSections(ctx, input.sections);
  const theme = {};
  for (const k of Object.keys(DEFAULT_THEME)) theme[k] = HEX.test(String(input.theme && input.theme[k] || "")) ? input.theme[k].toLowerCase() : DEFAULT_THEME[k];
  const title = line(input.title, 120) || line(input.name, 100);
  ctx.db.prepare("UPDATE mk_landing_pages SET title = ?, description = ?, sections = ?, theme = ?, updated_at = datetime('now') WHERE id = ?")
    .run(title, line(input.description, 300), JSON.stringify(sections), JSON.stringify(theme), id);
  audit(ctx, "landing.saved", "landing", id, { sections: sections.length, published: page.status === "published" });
  return getPage(ctx, id);
}

// Vérifications avant publication : contenu présent, formulaire publié si la page a une section d'inscription
function preflight(ctx, page) {
  const errors = [];
  if (!page.sections.length) errors.push("La page ne contient aucune section.");
  if (page.sections.some((s) => s.type === "form")) {
    const form = page.form_id ? ctx.db.prepare("SELECT status, name FROM mk_forms WHERE id = ? AND organization_id = ?").get(page.form_id, ctx.organizationId) : null;
    if (!form) errors.push("La section d'inscription a besoin d'un formulaire : choisissez-en un dans les réglages de la page.");
    else if (form.status !== "published") errors.push(`Le formulaire « ${form.name} » n'est pas publié : publiez-le d'abord (Audience → Formulaires d'inscription).`);
  }
  for (const s of page.sections) if (s.type === "course" && !getCourse(ctx, s.courseId)) errors.push("Une section « formation » vise une formation qui n'est plus publiée.");
  // Widgets « Formulaire » : leur formulaire doit exister et être publié
  for (const s of page.sections) if (s.type === "layout") pageNodes.walk(s.children, (n) => {
    if (n.type !== "signupform" || n.hidden) return;
    const f = ctx.db.prepare("SELECT status, name FROM mk_forms WHERE id = ? AND organization_id = ?").get(Number(n.props && n.props.formId), ctx.organizationId);
    if (!f) errors.push("Un widget « Formulaire » vise un formulaire supprimé : choisissez-en un autre.");
    else if (f.status !== "published") errors.push(`Le formulaire « ${f.name} » n'est pas publié : publiez-le d'abord (Audience → Formulaires d'inscription).`);
  });
  return { ready: errors.length === 0, errors };
}
function publishPage(ctx, id) {
  const page = requirePage(ctx, id);
  const check = preflight(ctx, page);
  if (!check.ready) throw new MarketingError("preflight_failed", check.errors.join(" "));
  ctx.db.prepare("UPDATE mk_landing_pages SET status = 'published', published_at = COALESCE(published_at, datetime('now')), updated_at = datetime('now') WHERE id = ?").run(id);
  audit(ctx, "landing.published", "landing", id, { slug: page.slug });
  return getPage(ctx, id);
}
function unpublishPage(ctx, id) {
  requirePage(ctx, id);
  ctx.db.prepare("UPDATE mk_landing_pages SET status = 'unpublished', updated_at = datetime('now') WHERE id = ?").run(id);
  audit(ctx, "landing.unpublished", "landing", id, {});
}
function deletePage(ctx, id) {
  requirePage(ctx, id);
  ctx.db.prepare("DELETE FROM mk_landing_pages WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "landing.deleted", "landing", id, {});
}

// Données d'affichage : formations relues dans le catalogue (titre, prix, image, adresse à jour) ; dans les sections
// libres, texte riche assaini de nouveau et formations relues de la même façon ; CSS des éléments stylés
const courseView = (c) => ({ title: c.title, subtitle: c.subtitle || "", priceCents: c.price_cents || 0, url: `/cours/${encodeURIComponent(c.slug)}`, image: c.thumbnail_path || "" });
// Contenu dynamique : lu au moment de l'affichage (articles, formations, compteurs, visiteur)
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
// Identité du site d'une page : nom (site de la page, sinon nom du site dans les réglages SEO), page d'accueil du site
// (si elle est en ligne, sinon l'accueil de la plateforme), logo de l'organisation (réglages SEO, adresse vérifiée)
function siteInfo(ctx, page) {
  let seo = {};
  try { seo = require("../../seo/settings").all(); } catch { seo = {}; }
  const site = page && page.site_id ? ctx.db.prepare("SELECT name, home_page_id, settings FROM mk_sites WHERE id = ? AND organization_id = ?").get(page.site_id, ctx.organizationId) : null;
  // Le logo choisi dans « Réglages du site ▸ Identité » passe avant le logo des réglages SEO de l'organisation
  let siteLogo = "";
  try { siteLogo = site ? require("../pages/siteSettings").normalizeSettings(JSON.parse(site.settings || "{}")).identity.logoUrl : ""; } catch { siteLogo = ""; }
  const home = site && site.home_page_id ? ctx.db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ? AND status = 'published'").get(site.home_page_id) : null;
  const logo = String(seo.org_logo || "");
  const safeLogo = (/^\/uploads\/[A-Za-z0-9_\/.-]{1,200}\.(png|jpe?g|webp|gif|avif|svg)$/i.test(logo) && !logo.includes("..")) || /^https:\/\/[^\s"'<>]{3,300}$/i.test(logo) ? logo : "";
  return { name: (site && site.name) || seo.site_name || "KOLAKISA", homeUrl: home ? `/p/${home.slug}` : "/", logo: siteLogo || safeLogo };
}
function dynamicProps(ctx, n, visitor, page) {
  const p = n.props;
  if (n.type === "posts") {
    const { listPosts } = require("../bridge/catalog");
    return { ...p, items: listPosts({ ...ctx, baseUrl: "" }, { limit: p.count, category: p.category }).map((x) => ({ title: x.title, url: x.url, excerpt: x.excerpt || "", image: x.image || "", date: x.date })) };
  }
  if (n.type === "courselist") {
    const { listCourseCards } = require("../bridge/catalog");
    return { ...p, items: listCourseCards(ctx, { limit: p.count, category: p.category, sort: p.sort }).map(courseView) };
  }
  if (n.type === "catfilter") {
    const q = (visitor && visitor.query) || {};
    const keep = Object.entries(q).filter(([k]) => k !== "categorie" && !k.startsWith("lp-"));
    const href = (name) => { const sp = new URLSearchParams(keep); if (name) sp.set("categorie", name); const t = sp.toString(); return t ? `?${t}` : "?"; };
    let rows = [];
    try {
      rows = p.source === "courses"
        ? ctx.db.prepare("SELECT category AS name, COUNT(*) AS n FROM courses WHERE published = 1 AND category != '' GROUP BY category ORDER BY category COLLATE NOCASE").all()
        : ctx.db.prepare("SELECT category AS name, COUNT(*) AS n FROM posts WHERE published = 1 AND category IS NOT NULL AND category != '' GROUP BY category ORDER BY category COLLATE NOCASE").all();
    } catch { rows = []; }
    const current = typeof q.categorie === "string" ? q.categorie.toLowerCase() : "";
    return { ...p, items: [{ name: p.allLabel, href: href(""), current: !current, count: null }, ...rows.slice(0, 40).map((r) => ({ name: r.name, href: href(r.name), current: r.name.toLowerCase() === current, count: p.showCount ? r.n : null }))] };
  }
  if (n.type === "dyntext") {
    const { countPublished } = require("../bridge/catalog");
    const now = new Date();
    const value = {
      firstName: visitor && visitor.firstName ? visitor.firstName : "",
      today: `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
      year: String(now.getFullYear()),
      pageTitle: page ? page.title || page.name || "" : "",
      courseCount: String(countPublished(ctx, "courses")),
      postCount: String(countPublished(ctx, "posts")),
    }[p.source];
    return { ...p, value };
  }
  if (n.type === "embed") return { ...p, embed: pageNodes.embedOf(p.url) };
  if (n.type === "sitelogo" || n.type === "sitetitle" || n.type === "copyright") {
    const s = siteInfo(ctx, page);
    if (n.type === "copyright") return { ...p, year: String(new Date().getFullYear()), owner: p.owner || s.name };
    return { ...p, name: s.name, homeUrl: s.homeUrl, ...(n.type === "sitelogo" ? { logo: s.logo } : {}) };
  }
  // Formulaire : affiché seulement s'il est publié (sinon rien sur la page publique, un avertissement dans l'éditeur)
  if (n.type === "signupform") {
    const forms = require("../forms");
    let f = null;
    try { f = forms.getForm(ctx, p.formId); } catch { f = null; }
    const live = f && f.status === "published" ? f : null;
    return { ...p, formName: f ? f.name : "", form: live, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: live ? forms.propertyFieldDefs(ctx.db, ctx.organizationId, live) : [] };
  }
  // Boutons de partage : adresse publique de la page (https seulement : un partage vers une adresse locale n'aurait aucun sens)
  if (n.type === "sharebuttons") {
    const base = String(ctx.baseUrl || "").replace(/\/+$/, "");
    const shareUrl = page && page.slug && /^https:\/\/[^\s"'<>]+$/.test(base) ? `${base}/p/${page.slug}` : "";
    return { ...p, shareUrl, pageTitle: page ? page.title || page.name || "" : "" };
  }
  if (n.type === "account") return { ...p, loggedIn: Boolean(visitor && visitor.loggedIn), cartCount: visitor ? visitor.cartCount || 0 : 0 };
  return null;
}
// Vue d'une formation pour les étiquettes dynamiques (scope.course) et les boucles
const courseScope = (c) => ({ title: c.title, subtitle: c.subtitle || "", priceCents: c.price_cents || 0, url: `/cours/${encodeURIComponent(c.slug)}`, image: c.thumbnail_path || "", category: c.category || "", description: String(c.description || "").replace(/\s+/g, " ").trim().slice(0, 300) });
// Éléments d'une boucle (grille « répéter pour chaque ») : une page de résultats, filtrée par l'adresse si demandé
function loopQuery(ctx, loop, id, visitor, scope) {
  const q = (visitor && visitor.query) || {};
  const pageNo = loop.paginate ? Math.max(1, Math.min(parseInt(q[`lp-${id}`], 10) || 1, 500)) : 1;
  const query = { ...loop, pagination: loop.paginate ? loop.pagination || "numbers" : "none" };
  if (loop.urlFilter) {
    if (typeof q.q === "string" && q.q.trim()) query.search = q.q.trim().slice(0, 80);
    if (typeof q.categorie === "string" && q.categorie.trim()) query.categories = [q.categorie.trim().slice(0, 80)];
  }
  const r = require("../pages/query").runQuery(loop.source === "courses" ? ctx : { ...ctx, baseUrl: "" }, query, { pageNo, scope });
  return { items: r.items, total: r.total, pageNo: r.pageNo, pages: r.pages };
}
function nodeView(ctx, nodes, visitor, page, scope) {
  scope = scope || baseScope(ctx, visitor, page);
  return (nodes || []).map((n) => {
    // Étiquettes dynamiques {{post.title}}… résolues à l'affichage ; adresses et images revalidées après résolution
    if (pageNodes.dynamic.nodeIsDynamic(n)) n = { ...n, props: pageNodes.dynamic.resolveProps(n.props, scope, require("../pages/sections")) };
    if (n.type === "postcontent") return { ...n, props: { ...n.props, html: scope.post && scope.post.contentHtml ? scope.post.contentHtml : "" } };
    // Boucle : la grille répète ses enfants (le modèle) pour chaque résultat ; chaque copie reçoit son propre contexte
    if (n.type === "grid" && n.props && n.props.loop && n.children) {
      const loop = n.props.loop, found = loopQuery(ctx, loop, n.id, visitor, scope);
      const children = [];
      found.items.forEach((item, i) => {
        const itemScope = { ...scope, ...{ [require("../pages/query").SOURCES.get(loop.source).scopeKey]: item } };
        nodeView(ctx, n.children, visitor, page, itemScope).forEach((c) => children.push({ ...c, loopItem: i }));
      });
      return { ...n, children, loopInfo: { empty: !found.items.length, message: loop.empty, paginate: Boolean(loop.paginate) && found.pages > 1, pagination: loop.pagination || "numbers", pageNo: found.pageNo, pages: found.pages,
        base: Object.entries((visitor && visitor.query) || {}).filter(([k]) => k !== `lp-${n.id}`).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&") } };
    }
    const dyn = dynamicProps(ctx, n, visitor, page);
    if (dyn) n = { ...n, props: dyn };
    // Widget personnalisé : son gabarit et ses champs « lien » (comptés dans cet ordre, comme dans linksOf)
    const cw = pageNodes.CUSTOM_WIDGETS[n.type];
    if (cw) {
      // Données dynamiques du widget (requête, article courant, visiteur…) : jamais bloquant, un échec donne un widget vide
      let data = null;
      if (cw.data) { try { data = cw.data(ctx, n.props, { scope, visitor, page, runQuery: (q, o) => require("../pages/query").runQuery(ctx, q, { scope, ...o }) }); } catch { data = null; } }
      n = { ...n, customView: { partial: `widgets/${cw.template || n.type}`, links: cw.schema.filter((f) => f.kind === "link").map((f) => f.key), data } };
    }
    if (n.type === "addtocart" || n.type === "courserating") {
      const c = getCourse(ctx, n.props.courseId);
      if (c && n.type === "courserating") return { ...n, props: { ...n.props, course: courseView(c), rating: require("../bridge/catalog").courseRating(ctx, c.id) } };
      return c ? { ...n, props: { ...n.props, course: courseView(c) } } : null; // formation dépubliée : le bouton disparaît (jamais un achat impossible)
    }
    if (n.type === "course") {
      const c = getCourse(ctx, n.props.courseId);
      return c ? { ...n, props: { ...n.props, course: courseView(c) } } : null; // formation dépubliée : l'élément disparaît
    }
    const m = n.audience ? { ...n, audienceLabel: pageNodes.audienceLabel(n.audience) } : n;
    if (n.type === "text") return { ...m, props: { ...n.props, html: pageNodes.sanitizeRich(n.props.html) } };
    return n.children ? { ...m, children: nodeView(ctx, n.children, visitor, page, scope) } : m;
  }).filter(Boolean);
}
// Contexte des étiquettes dynamiques d'une page : visiteur, page, site, date, adresse (+ article ou formation d'un modèle de thème)
function baseScope(ctx, visitor, page) {
  return { visitor, page, site: siteInfo(ctx, page), now: new Date(), query: (visitor && visitor.query) || {}, ...((page && page.scope) || {}) };
}
function viewModel(ctx, page) {
  const scope = baseScope(ctx, page.visitor, page);
  const sections = page.sections.map((s0) => {
    const s = s0.audience ? { ...s0, audienceLabel: pageNodes.audienceLabel(s0.audience) } : s0;
    if (s.type === "layout") return { ...s, children: nodeView(ctx, s.children, page.visitor, page, scope) };
    if (s.type !== "course") return s;
    const c = getCourse(ctx, s.courseId);
    if (!c) return null; // formation dépubliée depuis : la section disparaît (jamais un lien mort)
    return { ...s, course: courseView(c) };
  }).filter(Boolean);
  // Attributs de mouvement (entrée, défilement, souris) calculés une seule fois, au même endroit, pour le canevas, l'aperçu et la page publiée
  for (const s of sections) if (s.type === "layout") pageNodes.walk(s.children, (n) => { n.motionAttr = pageNodes.motionAttrs(n); });
  // Table des matières : titres de la page (dans l'ordre d'affichage), chacun avec son ancre (la sienne, sinon kw-h-<id>)
  const tocs = [], heads = [];
  for (const s of sections) if (s.type === "layout") pageNodes.walk(s.children, (n) => { if (n.type === "toc") tocs.push(n); else if (n.type === "heading" && n.props && n.props.text) heads.push(n); });
  if (tocs.length) {
    for (const n of heads) n.tocId = n.anchor || `kw-h-${n.id}`;
    for (const t of tocs) t.props = { ...t.props, items: heads.filter((n) => Number(n.props.level) >= 2 && Number(n.props.level) <= Number(t.props.depth)).map((n) => ({ level: Number(n.props.level), text: n.props.text, href: `#${n.tocId}` })) };
  }
  // CSS personnalisé de la page (revalidé à chaque affichage ; un CSS devenu invalide n'est simplement pas appliqué)
  let customCss = "";
  try { customCss = page.theme && page.theme.css ? pageNodes.normalizePageCss(page.theme.css) : ""; } catch { customCss = ""; }
  // Points de rupture du site de la page (réglages du site) : écrans « Tablette » et « Mobile » de ses éléments
  let breakpoints;
  try {
    const row = page.site_id ? ctx.db.prepare("SELECT settings FROM mk_sites WHERE id = ? AND organization_id = ?").get(page.site_id, ctx.organizationId) : null;
    breakpoints = row ? require("../pages/siteSettings").breakpointsOf(require("../pages/siteSettings").normalizeSettings(JSON.parse(row.settings || "{}"))) : undefined;
  } catch { breakpoints = undefined; }
  // Polices de la bibliothèque utilisées par la page : leurs règles @font-face sont livrées avec elle (aucune autre n'est chargée)
  const nodeCss = pageNodes.pageCss(sections, breakpoints);
  const faces = require("../../utils/fontLibrary").faceCssFor(nodeCss);
  return { ...page, sections, nodeCss: faces ? `${faces}\n${nodeCss}` : nodeCss, customCss };
}
// Liens cliquables d'une page AFFICHÉE (viewModel), dans l'ordre : le même calcul sert au rendu et à /p/<adresse>/clic/<n>
function linksOf(page) {
  const out = [];
  page.sections.forEach((s, i) => {
    if (s.type === "hero" && s.buttonUrl) out.push({ section: i, label: s.buttonLabel, url: s.buttonUrl });
    if (s.type === "button") out.push({ section: i, label: s.label, url: s.url });
    if (s.type === "cta") out.push({ section: i, label: s.buttonLabel, url: s.buttonUrl });
    if (s.type === "image" && s.link) out.push({ section: i, label: `Image : ${s.alt}`, url: s.link });
    if (s.type === "course" && s.course) out.push({ section: i, label: `Formation : ${s.course.title}`, url: s.course.url });
    // Section libre : mêmes liens, dans l'ordre d'affichage des éléments
    if (s.type === "layout") pageNodes.walk(s.children, (n) => {
      if ((n.type === "sitelogo" || n.type === "sitetitle") && n.props.link && n.props.homeUrl) out.push({ section: i, label: n.type === "sitelogo" ? "Logo du site" : "Titre du site", url: n.props.homeUrl });
      if (["container", "grid", "stack", "group"].includes(n.type) && (n.props || {}).link) out.push({ section: i, label: `Conteneur : ${n.name || (pageNodes.NODE_TYPES[n.type] || {}).label || n.type}`, url: n.props.link });
      if (n.type === "flipbox" && n.props.ctaUrl) out.push({ section: i, label: `Boîte retournable : ${n.props.ctaLabel}`, url: n.props.ctaUrl });
      if (n.type === "pricelist") n.props.items.forEach((it) => { if (it.link) out.push({ section: i, label: `Liste de prix : ${it.title}`, url: it.link }); });
      if ((n.type === "imagebox" || n.type === "iconbox") && n.props.link) out.push({ section: i, label: `${n.type === "imagebox" ? "Boîte d'image" : "Boîte d'icône"} : ${n.props.title}`, url: n.props.link });
      const cw = pageNodes.CUSTOM_WIDGETS[n.type];
      if (cw) cw.schema.forEach((f) => { if (f.kind === "link" && n.props[f.key]) out.push({ section: i, label: `${cw.label} : ${f.label}`, url: n.props[f.key] }); });
      if (n.type === "heading" && n.props.link) out.push({ section: i, label: `Titre : ${n.props.text}`, url: n.props.link });
      if (n.type === "button") out.push({ section: i, label: n.props.label, url: n.props.url });
      if (n.type === "link") out.push({ section: i, label: n.props.label, url: n.props.url });
      if (n.type === "menu") n.props.items.forEach((m) => { out.push({ section: i, label: `Menu : ${m.label}`, url: m.url }); (m.children || []).forEach((c) => out.push({ section: i, label: `Menu : ${m.label} › ${c.label}`, url: c.url })); });
      if (n.type === "image" && n.props.link) out.push({ section: i, label: `Image : ${n.props.alt}`, url: n.props.link });
      if (n.type === "icon" && n.props.link) out.push({ section: i, label: `Icône : ${n.props.label}`, url: n.props.link });
      if (n.type === "gallery") n.props.images.forEach((im) => { if (im.link) out.push({ section: i, label: `Galerie : ${im.alt}`, url: im.link }); });
      if (n.type === "pricing" && n.props.ctaUrl) out.push({ section: i, label: `Offre ${n.props.title} : ${n.props.ctaLabel}`, url: n.props.ctaUrl });
      if (n.type === "breadcrumb") n.props.items.forEach((c, k) => { if (c.url && k < n.props.items.length - 1) out.push({ section: i, label: `Fil d'Ariane : ${c.label}`, url: c.url }); });
      if (n.type === "social") n.props.items.forEach((s2) => out.push({ section: i, label: `Réseau : ${s2.network}`, url: s2.url }));
      if (n.type === "iconlist") n.props.items.forEach((it) => { if (it.link) out.push({ section: i, label: `Liste : ${it.text}`, url: it.link }); });
      if (n.type === "posts") (n.props.items || []).forEach((it) => out.push({ section: i, label: `Article : ${it.title}`, url: it.url }));
      if (n.type === "courselist") (n.props.items || []).forEach((c) => out.push({ section: i, label: `Formation : ${c.title}`, url: c.url }));
      if (n.type === "account") { out.push({ section: i, label: n.props.loggedIn ? "Mon compte" : "Se connecter", url: n.props.loggedIn ? "/mon-compte" : "/connexion" }); if (n.props.showCart) out.push({ section: i, label: "Panier", url: "/panier" }); }
      if (n.type === "modal" && n.props.ctaUrl) out.push({ section: i, label: `Fenêtre : ${n.props.ctaLabel}`, url: n.props.ctaUrl });
      if (n.type === "course" && n.props.course) out.push({ section: i, label: `Formation : ${n.props.course.title}`, url: n.props.course.url });
    });
  });
  // Les ancres (#…) sautent dans la page sans passer par le compteur de clics (même règle que href() du rendu)
  return out.filter((l) => !/^(#|mailto:)/.test(String(l.url)));
}

// ---------- Statistiques ----------
// Empreinte de visiteur : non réversible, change chaque jour (aucune adresse IP conservée, aucun cookie)
function visitorOf(req, secret) {
  const day = new Date().toISOString().slice(0, 10);
  return crypto.createHmac("sha256", String(secret || "kolakisa")).update(`${req.ip}|${req.get("user-agent") || ""}|${day}`).digest("hex").slice(0, 32);
}
const isBot = (req) => !req.get("user-agent") || BOT.test(req.get("user-agent"));
function record(db, page, type, visitor, target = "", now = Date.now()) {
  db.prepare("INSERT INTO mk_landing_events (organization_id, page_id, type, visitor, target, occurred_at) VALUES (?, ?, ?, ?, ?, ?)").run(page.organization_id, page.id, type, visitor, String(target).slice(0, 200), now);
}
function pageReport(ctx, id, { days = 30, now = Date.now() } = {}) {
  requirePage(ctx, id);
  const since = now - days * 86400000;
  const one = (sql, ...a) => ctx.db.prepare(sql).get(...a);
  const views = one("SELECT COUNT(*) n, COUNT(DISTINCT visitor) u FROM mk_landing_events WHERE page_id = ? AND type = 'view' AND occurred_at >= ?", id, since);
  const signups = one("SELECT COUNT(*) n FROM mk_landing_events WHERE page_id = ? AND type = 'signup' AND occurred_at >= ?", id, since).n;
  const clicks = ctx.db.prepare("SELECT target, COUNT(*) n, COUNT(DISTINCT visitor) u FROM mk_landing_events WHERE page_id = ? AND type = 'click' AND occurred_at >= ? GROUP BY target ORDER BY n DESC").all(id, since);
  const total = one("SELECT COUNT(DISTINCT visitor) u, (SELECT COUNT(*) FROM mk_landing_events WHERE page_id = ? AND type = 'signup') s FROM mk_landing_events WHERE page_id = ? AND type = 'view'", id, id);
  return { days, views: views.n, visitors: views.u, signups, conversion: views.u ? Math.round((signups / views.u) * 1000) / 10 : null, clicks, allTime: { visitors: total.u, signups: total.s } };
}

module.exports = {
  createPage, savePage, saveSettings, getPage, requirePage, getPublishedPage, listPages, publishPage, unpublishPage, deletePage, preflight, viewModel, linksOf, freeSlug,
  visitorOf, isBot, record, pageReport, normalizeSection, slugify, SECTION_TYPES, STATUSES, DEFAULT_THEME, MAX_TAGS,
};
