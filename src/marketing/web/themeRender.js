// Rendu d'un MODÈLE DE THÈME dans une page du site (blog, 404) : la page du Page Builder choisie est affichée dans la zone
// de contenu, avec ses données (article courant, catégorie demandée). Toute erreur renvoie null : la page garde alors son
// affichage d'origine (un modèle ne peut jamais casser le blog ni la page d'erreur).
const pages = require("../pages");
const headerSettings = require("../pages/headerSettings");
const landing = require("../landing");
const forms = require("../forms");
const tokens = require("../pages/tokens");
const themeTemplates = require("../pages/themeTemplates");
const { visitorContext } = require("../pages/visitorContext");
const { audienceMatches } = require("../pages/nodes");

const ctxOf = (db, marketing) => ({ db, organizationId: marketing.organizationId, userId: null, bus: marketing.bus, settings: marketing.settings, baseUrl: process.env.SITE_URL });
const MS = (v) => { const t = Date.parse(`${String(v || "").replace(" ", "T")}Z`); return Number.isFinite(t) ? t : null; };

// Données d'un article pour les étiquettes {{post.…}} ; contentHtml : corps déjà produit (et nettoyé) par le blog
// Compléments lus dans la base (nombre de commentaires, auteur, adresse de la catégorie) ; jamais bloquants
function extras(post) {
  const out = {};
  try { out.commentsCount = require("../../services/blog").countComments(post.id); } catch { /* ignoré */ }
  try {
    const query = require("../pages/query");
    if (post.category) out.categoryUrl = query.termUrl("category", post.category);
    if (post.author_id) out.authorView = query.authorView(require("../../config/database").prepare("SELECT id, username, bio, avatar_path FROM users WHERE id = ?").get(post.author_id));
  } catch { /* ignoré */ }
  return out;
}
function postScope(post, { contentHtml = "", minutes = null, author = "", toc = [] } = {}) {
  const safeImg = (p) => (typeof p === "string" && (/^\/uploads\/thumbnails\/[A-Za-z0-9._-]+$/.test(p) || /^https:\/\/[^\s"'<>]+$/.test(p)) ? p : "");
  return { title: post.title, url: require("../../services/urls").publicPath("post", post), excerpt: String(post.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 300), image: safeImg(post.cover_path),
    date: MS(post.published_at), category: post.category || "", author, minutes: minutes || null, contentHtml, toc: Array.isArray(toc) ? toc.filter((t) => t && t.text && t.id).map((t) => ({ level: Number(t.level) || 2, text: String(t.text), id: String(t.id), href: t.href ? String(t.href) : "" })) : [],
    id: post.id, slug: post.slug, authorId: post.author_id || null, tags: String(post.tags || "").split(",").map((t) => t.trim()).filter(Boolean), modified: MS(post.updated_at),
    ...extras(post), views: post.views || 0, commentsOpen: post.comments_enabled !== 0,
    seoTitle: String(post.seo_title || "").slice(0, 160), seoDescription: String(post.seo_description || "").replace(/\s+/g, " ").trim().slice(0, 320) };
}

// Habillage d'un modèle rendu hors Page Builder : jetons du site, feuille des pages, CSS généré (jetons → thème → éléments → personnalisé) ; même code pour les modèles de page ET les parties globales
// opts.noSite : aperçu de la bibliothèque — ni jetons, ni thème, ni polices, ni CSS du site (le modèle se montre tel qu'il est)
function wrapHtml(res, vm, siteOk, body, cls, opts = {}) {
  // Source de vérité unique : si l'apparence du site (Apparence → Styles) est publiée, ses jetons habillent aussi les modèles de thème
  const main = opts.noSite ? null : require("../../services/appearance").publishedTokens();
  const FF = require("../pages/footerFrontier");
  // Pied indépendant (« solo ») : pas de colonne de contenu (.lp-main), pas de jetons du site sur l'enveloppe ; la racine <footer data-kw-ft> porte ses propres variables
  const soloFoot = cls.includes("kw-theme-footer") && ((vm && vm.sections) || []).some((x) => x && x.ft && x.ft.mode === "solo");
  // Polices : celles du site ET celles que les éléments du modèle posent eux-mêmes (identité propre d'un modèle : « font.<famille> » dans ses styles) ; sans cela le navigateur retomberait sur la police du site
  const faces = require("../../utils/fontLibrary").faceCssFor(tokens.tokensToCss(main || (siteOk && siteOk.tokens) || {}) + "\n" + (((main || (siteOk && siteOk.tokens) || {}).global) ? require("../pages/globalStyles").globalCss((main || siteOk.tokens).global, "site") : "") + "\n" + String(vm.nodeCss || ""), { siteId: main ? null : siteOk ? siteOk.id : undefined });
  // Partie globale (en-tête, pied) : même colonne de contenu que les pages du site (réglage de largeur du site, comme dans le Page Builder) ; la feuille de la plateforme ne doit pas changer l'aspect des liens non stylés
  const band = cls.includes("kw-theme-part") ? ".kw-theme-part { color: var(--kw-text, #10222f); } :where(.kw-theme-part) a:not([class]) { color: revert; text-decoration: revert; } .kw-theme-part.kw-theme-sticky { position: sticky; top: 0; z-index: 60; } .kw-theme-part.kw-theme-overlay { position: absolute; top: 0; left: 0; right: 0; z-index: 60; }" : "";
  // Gabarits de contenu : titre et description d'archive à une échelle de page (le titre de niveau 1 du thème est pensé pour un bandeau d'accueil)
  const bleed = cls.includes("kw-theme-bleed") ? ".kw-theme-bleed > .lp-main { max-width: none; padding-left: 0; padding-right: 0; }" : "";
  const tpl = cls.includes("kw-theme-template") ? ".kw-theme-template .kw-ai-title { font-size: clamp(1.7rem, 1.2rem + 1.8vw, 2.5rem); line-height: 1.15; } .kw-theme-template .kw-ai-desc { font-size: 1.05rem; line-height: 1.55; }" : "";
  // Chaque feuille « du site » passe par l'exclusion du pied indépendant (siteOk.assets.* et vm.customCss l'ont reçue à leur émission)
  const css = [faces, bleed, tpl, main ? FF.excludeFooter(require("../pages/themeCss").themeCss(main)) : siteOk && siteOk.assets.theme, FF.excludeFooter(band), vm.nodeCss, siteOk && siteOk.assets.custom, vm.customCss].filter(Boolean).join("\n").replace(/</g, "");
  const style = !soloFoot && (siteOk || main) ? ` style="${tokens.tokensToCss(main || siteOk.tokens).replace(/"/g, "&quot;")} --lp-accent: var(--kw-primary)"` : "";
  // Motion Studio : les modèles rendus hors du Page Builder (404, articles, archives…) peuvent contenir des widgets de mouvement ; sans leur feuille de style et leur runtime ils s'afficheraient bruts. Additif :
  // rien n'est ajouté tant que le modèle n'utilise aucun widget de mouvement.
  const A = (path) => (res.locals.asset ? res.locals.asset(path) : path);
  const ms = vm && vm.motionStudio;
  const motionCss = ms && ms.css ? `<link rel="stylesheet" href="${A("/css/motion-studio.css")}">` : "";
  const motionJs = ms && Array.isArray(ms.modules) ? `<script type="application/json" id="kw-ms-modules">${JSON.stringify(Object.fromEntries(ms.modules.map((m) => [m, A("/js/motion-studio/" + m + ".js")]))).replace(/</g, "\\u003c")}</script>${ms.scenes ? `<script type="application/json" id="kw-ms-scenes">${JSON.stringify(ms.scenes).replace(/</g, "\\u003c")}</script>` : ""}<script src="${A("/js/kw-motion-studio.js")}" defer></script>` : "";
  const landingCss = `<link rel="stylesheet" href="${res.locals.asset ? res.locals.asset("/css/landing.css") : "/css/landing.css"}">`;
  if (soloFoot) return `<div class="${cls} lp-site">${landingCss}${motionCss}<style>${css}</style>${body}${motionJs}</div>`;
  return `<div class="${cls}${siteOk || main ? " lp-site" : ""}"${style}>${landingCss}${motionCss}<style>${css}</style><div class="lp-main">${body}</div>${motionJs}</div>`;
}
const siteOf = (ctx, page) => { const site = page.site_id ? pages.getSite(ctx, page.site_id) : null; return site && site.status === "active" ? site : null; };
// Comportement d'une partie globale, lu dans sa première bande : « collant » (position: sticky) ou « superposé » (position: absolute) ; la bande est dans le <div> de la partie, qui ne peut coller que si c'est lui qui porte la position
function partMode(section) { return headerSettings.classes(section); }
// Un modèle fait de bandes pleine largeur (conteneurs « pleine largeur ») doit pouvoir toucher les bords : sa zone n'est alors plus limitée à la colonne de texte du site. Sans bande pleine largeur, rien ne change.
const bleedOf = (sections) => ((sections || []).some((s) => s && s.type === "layout" && (s.children || []).some((c) => c && c.props && (c.props.full === true || c.props.band === true))) ? " kw-theme-bleed" : "");
// Rend le modèle de vue `vm` avec les éléments du Page Builder (callback : html | null). Un callback passé à res.render ne passe jamais par themeLayout (rendu de fragment).
function renderVm(res, vm, siteOk, cls, done, opts = {}) {
  res.render("marketing-public/_sections", { page: vm, form: null, preview: true, thanks: null, error: null, values: {}, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: [], builder: false, legalSite: (opts.legalSite !== undefined ? opts.legalSite : siteOk) || null }, (err, body) => {
    if (err) return done(null);
    try { done(wrapHtml(res, vm, siteOk, body, cls, opts)); } catch { done(null); }
  });
}
// Site dont on cherche les modèles : celui du domaine de la requête (req.kwSite) sauf indication contraire de la route ; null = site principal (modèles à site_id NULL)
const siteIdOf = (req, siteId) => (siteId !== undefined ? siteId : req.kwSite && Number.isInteger(req.kwSite.id) ? req.kwSite.id : null);

// done(html | null)
// type : une famille ou une liste ordonnée (la première qui a un modèle en ligne gagne : ex. archive de catégorie, puis liste du blog)
function renderRegion(req, res, db, type, { category = "", categories = [], tag = "", tags = [], postId = null, authorId = null, scope = {}, query = {}, siteId } = {}, done) {
  let finished = false;
  const end = (html) => { if (!finished) { finished = true; done(html); } };
  try {
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return end(null);
    const ctx = ctxOf(db, marketing);
    const visitor = visitorContext(db, marketing.organizationId, req);
    const opts = { category, categories, tag, tags, postId, authorId };
    // Theme Builder (23.1) : modèles du site de la requête, toutes familles. Le contexte de la page est mémorisé pour l'en-tête et le pied de page (themeLayout)
    const tbSite = siteIdOf(req, siteId);
    const TB = require("../../themeBuilder/render");
    { const first = [].concat(type)[0]; res.locals.themeCtx = TB.regionContext(tbSite, first, opts) || res.locals.themeCtx; }
    let row = TB.pickRegion(ctx, tbSite, type, opts);
    // Sans modèle applicable, l'ancien système décide exactement comme avant
    if (!row) for (const t of [].concat(type)) { row = themeTemplates.pick(ctx, t, { category, categories, tag, tags, postId, visitor, siteId }); if (row) break; }
    if (!row) return end(null);
    const page = landing.getPublishedPage(db, row.slug);
    if (!page) return end(null);
    const sections = pages.resolveSections(ctx, page.sections).filter((s) => !s.hidden && audienceMatches(s.audience, visitor));
    const vm = landing.viewModel(ctx, { ...page, visitor: { ...visitor, query: { ...visitor.query, ...query } }, scope, sections });
    renderVm(res, vm, siteOf(ctx, page), `kw-theme-template${bleedOf(sections)}`, end);
  } catch (error) { end(null); }
}

// En-tête et pied de page d'un site pour la requête : { header, footer } en HTML (null = rien ne s'applique, l'habillage d'origine reste). Utilisé par themeLayout ; jamais bloquant.
function renderParts(req, res) {
  return new Promise((resolve) => {
    try {
      // Domaine d'un site : son numéro ; sinon site principal (null)
      if (req.kwSite && !Number.isInteger(req.kwSite.id)) return resolve({});
      const site = { id: req.kwSite ? req.kwSite.id : null };
      const marketing = req.app.locals.marketing;
      if (!marketing || !marketing.ready) return resolve({});
      const db = require("../../config/database");
      const ctx = ctxOf(db, marketing);
      const TB = require("../../themeBuilder/render");
      if (!TB.hasParts(ctx, site.id)) return resolve({});
      const visitor = visitorContext(db, marketing.organizationId, req);
      const baseCtx = TB.withVisitor(res.locals.themeCtx || TB.defaultContext(site.id, String(req.originalUrl || req.url || "/").split("?")[0]), visitor, req); // + visiteur connecté / rôle (conditions du pied)
      const win = TB.resolveParts(ctx, site.id, baseCtx);
      const out = {};
      const extras = TB.resolveExtras(ctx, site.id, baseCtx);
      // Barre latérale puis modèles personnalisés, rendus dans l'ordre (le plus précis d'abord) ; un échec n'empêche jamais la page
      const extraJobs = [];
      if (extras.sidebar) extraJobs.push(new Promise((ok) => {
        const section = pages.partSection(ctx, extras.sidebar.sourceId, "sidebar");
        if (!section) { console.warn(`[KOLAKISA] Theme Builder : barre latérale « ${extras.sidebar.name} » sans version publiée ; ignorée.`); return ok(null); }
        const vm = landing.viewModel(ctx, { id: null, slug: "", site_id: site.id, organization_id: marketing.organizationId, visitor, theme: {}, scope: {}, sections: [section] });
        renderVm(res, vm, siteOf(ctx, { site_id: site.id }), `kw-theme-part kw-theme-sidebar${bleedOf([section])}`, (html) => ok(html || null));
      }));
      for (const t of extras.custom) extraJobs.push(new Promise((ok) => {
        const row = TB.pageRowOf(ctx, site.id, t), page = row && landing.getPublishedPage(db, row.slug);
        if (!page) return ok(null);
        const sections = pages.resolveSections(ctx, page.sections).filter((s) => !s.hidden && audienceMatches(s.audience, visitor));
        const vm = landing.viewModel(ctx, { ...page, visitor, scope: {}, sections });
        renderVm(res, vm, siteOf(ctx, page), `kw-theme-template kw-theme-custom${bleedOf(sections)}`, (html) => ok(html || null));
      }));
      const extraDone = Promise.all(extraJobs).then((parts) => { const html = parts.filter(Boolean).join("\n"); if (html) out.extras = html; });
      const jobs = [extraDone, ...["header", "footer"].filter((w) => win[w]).map((which) => new Promise((ok) => {
        const section = pages.partSection(ctx, win[which].sourceId, which);
        if (!section) { console.warn(`[KOLAKISA] Theme Builder : ${which === "header" ? "en-tête" : "pied de page"} « ${win[which].name} » sans version publiée ; habillage d'origine conservé.`); return ok(); }
        const vm = landing.viewModel(ctx, { id: null, slug: "", site_id: site.id, organization_id: marketing.organizationId, visitor, theme: {}, scope: {}, sections: [section] });
        renderVm(res, vm, siteOf(ctx, { site_id: site.id }), `kw-theme-part kw-theme-${which}${which === "header" ? partMode(section) : ""}${bleedOf([section])}`, (html) => { if (html) out[which] = html; ok(); });
      }))];
      Promise.all(jobs).then(() => resolve(out), () => resolve({}));
    } catch { resolve({}); }
  });
}

// Pendant qu'on dessine un modèle d'article : données du dernier article publié (aperçu réaliste)
function previewScope(db, ctx, page, typesOverride = null, pick = {}) {
  try {
    // Types du document : ancien système ET modèles du Theme Builder (un modèle d'article du Theme Builder reçoit lui aussi un vrai article)
    let types = typesOverride || themeTemplates.typesOfPage(ctx, page.id);
    if (!typesOverride) {
      const tb = require("../../themeBuilder").store.byDocument(ctx, "page", page.id);
      const asLegacy = { single_post: "single_post", archive: "blog_archive", search_results: "search_results" }[tb && tb.type];
      if (asLegacy && !types.includes(asLegacy)) types = [...types, asLegacy];
    }
    if (types.includes("single_course")) {
      const c = db.prepare("SELECT * FROM courses WHERE published = 1 ORDER BY created_at DESC, id DESC LIMIT 1").get();
      if (!c) return {};
      return { course: { id: c.id, title: c.title, subtitle: c.subtitle || "", priceCents: c.price_cents || 0, url: `/cours/${encodeURIComponent(c.slug)}`, image: c.thumbnail_path || "", category: c.category || "", instructor: "", description: String(c.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400) } };
    }
    if (types.some((t) => ["blog_archive", "author_archive", "search_results"].includes(t)) && !types.includes("single_post")) {
      const total = db.prepare("SELECT COUNT(*) n FROM posts WHERE published = 1 AND deleted_at IS NULL").get().n;
      return { archive: { type: "blog", name: "", id: null, termIds: [], title: "Titre de l'archive (exemple)", description: "Description de l'archive : elle viendra de la catégorie, de l'étiquette ou de l'auteur affiché.", count: total, url: "/blog", search: "" } };
    }
    if (!types.includes("single_post")) return {};
    // « Aperçu avec le contenu » (équivalent de Preview Dynamic Content As) : un article PUBLIÉ choisi ; sinon le plus récent
    const chosen = Number.isInteger(pick && pick.postId) && pick.postId > 0 ? db.prepare("SELECT * FROM posts WHERE id = ? AND published = 1").get(pick.postId) : null;
    const post = chosen || db.prepare("SELECT * FROM posts WHERE published = 1 ORDER BY published_at DESC, id DESC LIMIT 1").get();
    if (!post) return {};
    const blog = require("../../services/blog");
    let html = "", toc = [];
    try { const r = blog.renderPost(post, {}); html = r.html; toc = r.toc || []; } catch { html = ""; }
    const author = post.author_id ? db.prepare("SELECT username FROM users WHERE id = ?").get(post.author_id) : null;
    return { post: postScope(post, { contentHtml: html, toc, author: author ? author.username : "" }) };
  } catch { return {}; }
}

// ── Aperçu d'un modèle du CATALOGUE (aucune écriture) : mêmes éléments, mêmes jetons et même CSS que le site public ; données d'EXEMPLE clairement annoncées ─────────────────────────────
const EXAMPLE = {
  post: { title: "Titre de l'article (exemple)", url: "/blog", excerpt: "Le résumé de l'article s'affichera ici.", image: "", date: Date.now(), category: "Catégorie", author: "Auteur", minutes: 4, id: null, slug: "exemple", tags: ["exemple"], contentHtml: "<p>Le texte de votre contenu s'affichera ici : paragraphes, intertitres, images et listes.</p><h2>Un intertitre</h2><p>Chaque modèle met en page ce texte réel dès que le contenu existe.</p>" },
  product: { id: null, title: "Nom du produit (exemple)", subtitle: "", shortDescription: "Description courte du produit.", description: "Description détaillée du produit : elle vient de la fiche produit de la boutique.", priceCents: 4900, priceLabel: "49,00 €", regularLabel: "59,00 €", url: "/boutique", image: "", category: "Catégorie", sku: "REF-EXEMPLE", availability: "En stock", cartUrl: "/boutique/panier" },
};
function catalogScope(db, ctx, type) {
  if (type === "single_post") { const real = previewScope(db, ctx, { id: 0 }, ["single_post"]); return real.post ? real : { post: EXAMPLE.post }; }
  if (type === "single_page") return { post: { ...EXAMPLE.post, title: "Titre de la page (exemple)" } };
  if (type === "archive") return { archive: { type: "blog", name: "", id: null, termIds: [], title: "Titre de l'archive (exemple)", description: "Description de l'archive : elle viendra de la catégorie, de l'étiquette ou de l'auteur affiché.", count: 12, url: "/blog", search: "" }, post: EXAMPLE.post };
  if (type === "search_results") return { archive: { type: "search", name: "", id: null, termIds: [], title: "Résultats de recherche (exemple)", description: "", count: 12, url: "/blog", search: "exemple" } };
  if (type === "single_product") return { product: EXAMPLE.product };
  if (type === "product_archive") return { archive: { type: "shop", title: "Boutique (exemple)", description: "", count: 36, url: "/boutique", search: "" } };
  return {};
}
const FILLER = '<div style="max-width:1100px;margin:0 auto;padding:40px 24px;font:14px/1.6 system-ui,sans-serif;color:#64748b"><div style="height:160px;border-radius:12px;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);margin-bottom:20px"></div><div style="height:12px;background:#e2e8f0;border-radius:6px;margin:10px 0;width:80%"></div><div style="height:12px;background:#e2e8f0;border-radius:6px;margin:10px 0;width:65%"></div><div style="height:12px;background:#e2e8f0;border-radius:6px;margin:10px 0;width:72%"></div><p style="margin-top:18px;font-size:12px">Contenu de la page (aperçu)</p></div>';
// Contexte de page d'un aperçu d'en-tête : fond d'ouverture neutre (dégradé, libellé « aperçu ») puis une page de remplissage assez longue pour essayer le défilement
const HERO_BG = "linear-gradient(135deg,#1e293b,#475569 60%,#64748b)";
const headerContext = (thumb) => {
  const hero = (h) => `<div aria-hidden="true" style="position:relative;height:${h}px;background:${HERO_BG}">${thumb ? "" : '<span style="position:absolute;left:24px;bottom:16px;font:600 12px/1.4 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#e2e8f0">Aperçu · fond d\'ouverture neutre</span>'}</div>`;
  return thumb ? hero(150) : hero(420) + FILLER + FILLER + FILLER + FILLER;
};
// Aperçu d'en-tête : le menu plein écran (widget « motionfsmenu ») s'affiche FERMÉ, bouton seul, comme sur le site publié. Sans cela, l'aperçu (qui ne charge pas le script du widget) montrerait la liste de liens à plat ;
// le panneau et ses effets se testent sur la page publiée. Additif : aucun effet sur le rendu public.
// Menu d'EXEMPLE (aucun menu affecté au site) : la bibliothèque le montre pour juger la mise en page, mais il est annoncé comme tel ; jamais sur un site publié
const SAMPLE_NOTE = 'nav[data-kw-sample]::after{content:"(menu d\'exemple)";display:block;margin-top:6px;font:italic 11px/1.4 system-ui,sans-serif;opacity:.65}';
const FSMENU_CLOSED = ".kw-ms-fm .kw-ms-fm-panel{display:none}.kw-ms-fm .kw-ms-fm-toggle[hidden]{display:inline-flex}";
// done(html | null). doc : résultat de catalog.build()
// thumb : miniature de carte (sans bloc de remplissage, sans défilement) ; mêmes éléments et même CSS que l'aperçu complet
function previewDoc(req, res, { siteId, type, doc, thumb = false, sampleMenu = false, withTheme = false }, done) {
  try {
    const marketing = req.app.locals.marketing, db = require("../../config/database");
    if (!marketing || !marketing.ready) return done(null);
    const ctx = ctxOf(db, marketing);
    const section = doc.kind === "component" ? doc.section : null;
    const content = pages.normalizeContent(ctx, { site_id: siteId }, { sections: doc.kind === "component" ? [doc.section] : doc.sections });
    // En-tête : rendu comme une partie du site (sitePart) pour que le défilement, le logo alternatif et l'identité du site agissent comme sur la page publiée
    if (type === "header" && section) content.sections = content.sections.map((x) => (x.type === "layout" ? { ...x, id: x.id || "parthead", sitePart: "header" } : x));
    const visitor = visitorContext(db, marketing.organizationId, req);
    // Bibliothèque « Résultats de recherche » : terme et résultats de DÉMONSTRATION (aperçu seulement, jamais le site publié) ; ?q=… et ?etat=vide permettent d'essayer le terme et l'état « aucun résultat »
    if (type === "search_results" && sampleMenu) { const qy = (req.query && typeof req.query === "object") ? req.query : {}; visitor.demoResults = true; visitor.query = { ...qy, q: typeof qy.q === "string" && qy.q.trim() ? qy.q : (qy.etat === "vide" ? "mot-introuvable" : "exemple") }; }
    // Titre et nombre de l'aperçu « Résultats de recherche » : suivent le terme d'essai (?q=) et l'état « aucun résultat » (?etat=vide)
    const demoScope = (sc) => { if (!(type === "search_results" && sampleMenu && sc && sc.archive)) return sc; const qy = visitor.query || {}; return { ...sc, archive: { ...sc.archive, title: `Résultats pour « ${String(qy.q || "exemple").slice(0, 80)} »`, count: qy.etat === "vide" ? 0 : 24, search: qy.q || "exemple" } }; };
    // Pied : même marquage que sur le site publié (balise <footer> posée par la vue + ligne légale du site), pour que l'aperçu et la mesure se fassent dans les conditions réelles
    // Aperçu de la BIBLIOTHÈQUE : le pied se montre en mode indépendant (« solo ») et SANS le thème du site (ni ses jetons, polices, CSS) : c'est le vrai design du modèle. `withTheme` (« voir avec mon thème ») : le site habille l'aperçu, avec le mode propre du modèle.
    const isoFoot = type === "footer" && Boolean(section) && !withTheme;
    const themedSite = type === "footer" && withTheme ? siteOf(ctx, { site_id: siteId }) : null, themedPack = themedSite && themedSite.assets && themedSite.assets.pack && themedSite.assets.pack.link ? themedSite.assets.pack : null; /* « voir avec mon thème » : la feuille du thème actif aussi */
    if (type === "footer" && section) content.sections = content.sections.map((x) => (x.type === "layout" ? { ...x, id: x.id || "partfoot", sitePart: "footer", ...(isoFoot ? { ftMode: "solo" } : {}) } : x));
    const vm = landing.viewModel(ctx, { id: null, slug: "", site_id: siteId, organization_id: marketing.organizationId, visitor, theme: {}, scope: demoScope(catalogScope(db, ctx, type)), sections: content.sections, ...(sampleMenu ? { demoMenu: true, ...(type === "product_archive" || type === "single_product" ? { demoShop: true } : {}), ...(type === "archive" ? { demoPosts: true } : {}) } : {}) });
    const cls = doc.kind === "component" ? `kw-theme-part kw-theme-${type}${type === "header" ? partMode(section) : ""}${bleedOf(content.sections)}` : `kw-theme-template${bleedOf(content.sections)}`;
    renderVm(res, vm, isoFoot ? null : siteOf(ctx, { site_id: siteId }), cls, (html) => {
      if (!html) return done(null);
      // En-tête : contexte de page NEUTRE sous l'en-tête (dégradé CSS sans image ni texte qui paraisse réel) pour juger un en-tête superposé, transparent ou en verre ; mêmes éléments dans la vignette (plus court)
      const demoNote = (type === "product_archive" || type === "single_product") && sampleMenu && !thumb ? '<p style="margin:0;padding:8px 16px;background:#fef3c7;color:#78350f;font:13px/1.4 system-ui,sans-serif;text-align:center">Aperçu avec des produits d\'exemple : votre boutique affichera ses vrais produits.</p>' : "";
      const demoPostsNote = type === "archive" && sampleMenu && !thumb ? '<p style="margin:0;padding:8px 16px;background:#fef3c7;color:#78350f;font:13px/1.4 system-ui,sans-serif;text-align:center">Aperçu avec des articles d\'exemple : votre site affichera ses vrais articles.</p>' : "";
      const body = demoNote + demoPostsNote + (type === "header" ? html + headerContext(thumb) : type === "footer" ? (thumb ? "" : FILLER) + html : html);
      done(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Aperçu</title>${themedPack ? themedPack.link : ""}${type === "header" && html.includes("kw-ms-fm") ? `<link rel="stylesheet" href="${res.locals.asset ? res.locals.asset("/css/motion-studio.css") : "/css/motion-studio.css"}">` : ""}<style>html,body{margin:0}${type === "footer" && sampleMenu ? SAMPLE_NOTE : ""}${type === "header" ? FSMENU_CLOSED : ""}${thumb ? "html,body{overflow:hidden;pointer-events:none}" : ""}</style></head><body${type === "footer" ? ' class="lp-body lp-site"' : ""}${themedPack ? themedPack.attr : ""}${thumb ? "" : ' data-kw-demo="1"'}>${body}${thumb ? "" : '<script src="' + (res.locals.asset ? res.locals.asset("/js/landing.js") : "/js/landing.js") + '" defer></script>'}</body></html>`);
    }, isoFoot ? { noSite: true, legalSite: siteOf(ctx, { site_id: siteId }) } : {});
  } catch { done(null); }
}

module.exports = { renderRegion, renderParts, postScope, previewScope, previewDoc };
