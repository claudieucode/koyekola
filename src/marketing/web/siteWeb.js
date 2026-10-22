// « Site Web » dans l'Emailing : tableau de bord (chiffres réels), sites (pages, page d'accueil, design system,
// duplication, archivage). Les pages elles-mêmes sont sous /marketing/pages (même moteur pour Site Web et Tunnels).
// Droits : ceux des formulaires et pages (forms.read / forms.write).
const express = require("express");
const pages = require("../pages");
const stats = require("../pages/stats");
const tokens = require("../pages/tokens");
const { attempt, need } = require("./kit");
const multer = require("multer");
const media = require("../media");

const mediaUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: media.MAX_IMAGE, files: 1 } });
// Images de la médiathèque du site (blog, Centre de gestion) : utilisables dans les pages, gérées dans le Centre de gestion
function siteImages(db, { q = "", limit = 60 } = {}) {
  try {
    const like = `%${String(q || "").slice(0, 80).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    return db.prepare(`SELECT id, path, alt, title, width, height, size, mime FROM media WHERE kind = 'image' AND path LIKE '/uploads/thumbnails/%'
        AND (? = '%%' OR alt LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' OR path LIKE ? ESCAPE '\\') ORDER BY id DESC LIMIT ?`).all(like, like, like, like, Math.min(Number(limit) || 60, 200))
      .map((m) => ({ source: "site", id: m.id, path: m.path, name: m.title || m.path.split("/").pop(), alt: m.alt || "", width: m.width, height: m.height, size: m.size, mime: m.mime, editable: false }));
  } catch (e) {
    if (/no such table/i.test(e.message)) return [];
    throw e;
  }
}

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

// Formulaire du design system → jetons (valeurs refusées si invalides : jamais remplacées en silence)
function tokensFromBody(b, current) {
  const t = JSON.parse(JSON.stringify(current));
  for (const k of tokens.COLOR_KEYS) if (b[`color_${k}`] !== undefined) t.colors[k] = String(b[`color_${k}`]).trim();
  for (const k of ["heading", "body"]) if (b[`font_${k}`] !== undefined) t.fonts[k] = String(b[`font_${k}`]);
  for (const k of tokens.TYPE_KEYS) {
    if (b[`type_${k}_size`] !== undefined) t.type[k].size = Number(b[`type_${k}_size`]);
    if (b[`type_${k}_weight`] !== undefined) t.type[k].weight = Number(b[`type_${k}_weight`]);
  }
  for (const k of tokens.SPACE_KEYS) if (b[`space_${k}`] !== undefined) t.space[k] = Number(b[`space_${k}`]);
  for (const k of Object.keys(t.radius)) if (b[`radius_${k}`] !== undefined) t.radius[k] = Number(b[`radius_${k}`]);
  for (const k of Object.keys(t.shadow)) if (b[`shadow_${k}`] !== undefined) t.shadow[k] = String(b[`shadow_${k}`]);
  return t;
}

module.exports = () => {
  const router = express.Router();

  router.get("/site-web", need("forms.read"), (req, res) => {
    const d = stats.dashboard(req.mk.ctx, { days: Number(req.query.periode) || 30 });
    res.render("marketing/site-web", { title: "Site Web", active: "sitedash", d, cmsOv: require("./cmsData").overview(req.mk.ctx), aud: require("../pages/analytics").audience(req.mk.ctx, { days: d.period.days }) });
  });

  router.get("/site-web/sites", need("forms.read"), (req, res) => {
    const view = pages.SITE_VIEWS.includes(req.query.vue) ? req.query.vue : "actifs";
    const q = String(req.query.q || "").trim().slice(0, 80);
    const manager = require("../pages/siteManager");
    const counts = pages.siteCounts(req.mk.ctx);
    // Le site principal est une ligne comme les autres (équipe seulement) ; il suit la recherche et n'apparaît ni dans « Archivés » ni dans « Supprimés »
    const main = !req.mk.siteOnly ? manager.mainSite(req.mk.ctx) : null;
    const showMain = Boolean(main) && (view === "actifs" || view === "tous") && (!q || /principal|site principal/i.test(q) || main.name.toLowerCase().includes(q.toLowerCase()));
    res.render("marketing/sites", {
      title: "Mes sites", active: "sites", view, q, sites: manager.enrich(req.mk.ctx, pages.listSites(req.mk.ctx, { view, q })), counts, main: showMain ? main : null, totals: manager.totals(req.mk.ctx, counts), canModules: !req.mk.siteOnly && req.mk.can("sites.modules"), MODULES: require("../siteModules").MODULES,
      siteTypes: pages.SITE_TYPES, canWrite: req.mk.can("forms.write"), canDelete: !req.mk.siteOnly && req.mk.can("forms.write") && req.mk.can("pages.delete"),
    });
  });
  router.post("/site-web/sites", need("forms.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => (created ? `/marketing/site-web/sites/${created.id}` : "/marketing/site-web/sites"), () => {
      created = pages.createSite(req.mk.ctx, { name: req.body.name, slug: req.body.slug, description: req.body.description, siteType: req.body.site_type });
      return `Site « ${created.name} » créé. Ajoutez ses pages, choisissez sa page d'accueil et réglez son design system.`;
    });
  });

  // ---------- Modèles de thème : une page du Page Builder devient le modèle d'une famille de pages du site ----------
  const themeTemplates = require("../pages/themeTemplates");
  router.get("/site-web/modeles-de-theme", need("forms.read"), (req, res) => {
    const ctx = req.mk.ctx;
    res.render("marketing/theme-templates", {
      title: "Modèles de thème", active: "sitedash", types: themeTemplates.TYPES, templates: themeTemplates.list(ctx), canWrite: req.mk.can("forms.write"),
      pageChoices: pages.listPages(ctx, {}).filter((p) => p.kind !== "step" && !p.archived_at), audiences: require("../pages/nodes").AUDIENCES,
      categories: (() => { try { return require("../../services/blog").categories().map((c) => c.name); } catch { return []; } })(),
    });
  });
  router.post("/site-web/modeles-de-theme", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/site-web/modeles-de-theme", () => {
      const who = String(req.body.audience || "");
      themeTemplates.add(req.mk.ctx, { type: req.body.type, pageId: intOrNull(req.body.page_id), category: req.body.category, audience: who ? { who, value: req.body.audience_value } : null });
      return "Modèle enregistré. Il s'applique dès que sa page est en ligne ; sans modèle, le site garde son affichage d'origine.";
    });
  });
  router.post("/site-web/modeles-de-theme/:tid([a-f0-9]{8})/supprimer", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/site-web/modeles-de-theme", () => { themeTemplates.remove(req.mk.ctx, req.params.tid); return "Modèle retiré : le site reprend son affichage d'origine pour ces pages."; });
  });

  const load = (req, res) => {
    const site = pages.getSite(req.mk.ctx, intOrNull(req.params.id));
    if (!site) res.status(404).render("error", { message: "Site introuvable." });
    return site;
  };
  // « Ouvrir » un site : son espace d'administration (palier 3, B1) ; la fiche de réglages en est l'écran « Réglages »
  router.get("/site-web/sites/:id(\\d+)", need("forms.read"), (req, res) => {
    const site = load(req, res);
    if (!site) return;
    res.redirect(`/marketing/site-web/sites/${site.id}/tableau-de-bord`);
  });
  router.get("/site-web/sites/:id(\\d+)/reglages", need("forms.read"), (req, res) => {
    const site = load(req, res);
    if (!site) return;
    res.render("marketing/site", {
      title: "Réglages du site", active: "espace/reglages", site, siteTypes: pages.SITE_TYPES, canDelete: !req.mk.siteOnly && req.mk.can("forms.write") && req.mk.can("pages.delete"), sitePages: pages.listPages(req.mk.ctx, { siteId: site.id }), canWrite: req.mk.can("forms.write"),
      T: tokens, cssVars: tokens.tokensToCss(site.tokens), templates: require("../pages/templates").catalog(),
      components: pages.listComponents(req.mk.ctx, { siteId: site.id }), headerOverview: pages.headerOverview(req.mk.ctx, site.id),
    });
  });
  router.post("/site-web/sites/:id(\\d+)", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}/reglages`, () => {
      pages.updateSite(req.mk.ctx, site.id, { name: req.body.name, slug: req.body.slug, description: req.body.description, siteType: req.body.site_type });
      if (req.body.home_page_id !== undefined) pages.setHomePage(req.mk.ctx, site.id, intOrNull(req.body.home_page_id));
      return "Réglages du site enregistrés.";
    });
  });
  router.post("/site-web/sites/:id(\\d+)/design", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}/reglages#design`, () => {
      const t = req.body.reset === "1" ? tokens.DEFAULT_TOKENS : tokensFromBody(req.body, site.tokens);
      pages.updateSite(req.mk.ctx, site.id, { tokens: t });
      const live = pages.listPages(req.mk.ctx, { siteId: site.id }).filter((p) => p.status === "published").length;
      return `Design system enregistré${req.body.reset === "1" ? " (valeurs par défaut)" : ""}.${live ? ` Il s'applique tout de suite aux ${live} page(s) en ligne du site.` : ""}`;
    });
  });
  // ---------- Réglages du site (panneau de l'éditeur de pages, JSON) ----------
  // Même source de vérité que la page « Design system » du site : mk_sites.tokens. Chaque enregistrement est contrôlé
  // par une révision (409 si le site a été modifié ailleurs) et s'applique tout de suite aux pages en ligne du site.
  const settingsError = (res, next, error) => {
    const { MarketingError } = require("../errors");
    if (!(error instanceof MarketingError)) return next(error);
    res.status(error.code === "conflict" ? 409 : error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : 422).json({ error: { code: error.code, message: error.message } });
  };
  const siteSettings = require("../pages/siteSettings");
  const settingsPayload = (req, site) => ({
    site: { id: site.id, name: site.name }, revision: site.settings_revision, tokens: site.tokens, settings: site.settings,
    canWrite: req.mk.can("forms.write"), canCode: req.mk.can("pages.code"), canSeo: req.mk.can("seo.edit"),
    usage: pages.colorUsage(req.mk.ctx, site.id),
    catalog: {
      colorKeys: tokens.COLOR_KEYS, colorLabels: tokens.COLOR_LABELS, maxCustomColors: tokens.MAX_CUSTOM_COLORS,
      fontRoles: tokens.FONT_ROLES, fontLabels: tokens.FONT_LABELS, fonts: Object.fromEntries(Object.entries(tokens.FONTS).map(([k, f]) => [k, { label: f.label, stack: f.stack }])),
      typeKeys: tokens.TYPE_KEYS, typeLabels: tokens.TYPE_LABELS, shadows: Object.keys(tokens.SHADOWS), languages: siteSettings.LANGUAGES, maxCss: siteSettings.MAX_CSS,
    },
  });
  router.get("/site-web/sites/:id(\\d+)/reglages.json", need("forms.read"), (req, res, next) => {
    try {
      const site = pages.requireSite(req.mk.ctx, intOrNull(req.params.id));
      res.set("Cache-Control", "no-store").json(settingsPayload(req, site));
    } catch (error) { settingsError(res, next, error); }
  });
  router.put("/site-web/sites/:id(\\d+)/reglages.json", need("forms.write"), (req, res, next) => {
    try {
      const body = req.body || {};
      const current = pages.requireSite(req.mk.ctx, intOrNull(req.params.id));
      // Le CSS du site est du code : réservé à la permission « pages.code » (comme le widget HTML)
      if (body.settings && body.settings.customCss !== undefined && String(body.settings.customCss).trim() !== String(current.settings.customCss).trim() && !req.mk.can("pages.code")) {
        const { MarketingError } = require("../errors");
        throw new MarketingError("forbidden", "Le CSS personnalisé du site est réservé aux comptes autorisés à écrire du code (permission « pages.code »).");
      }
      // Référencement du site : réglage SEO réservé à la permission « seo.edit » (la description du site et noindex en font partie)
      if (body.settings && !req.mk.can("seo.edit")) {
        const sx = require("../pages/siteSettings");
        const norm = (st) => JSON.stringify({ seo: st.seo, description: st.identity && st.identity.description, noindex: st.extras && st.extras.noindex });
        let next = null;
        try { next = sx.normalizeSettings(body.settings); } catch { next = null; }
        if (next && norm(next) !== norm(current.settings)) {
          const { MarketingError } = require("../errors");
          throw new MarketingError("forbidden", "Vous n'avez pas la permission de modifier les réglages SEO du site (permission « seo.edit »).");
        }
      }
      const site = pages.saveSiteDesign(req.mk.ctx, current.id, { tokens: body.tokens, settings: body.settings, name: body.name, revision: body.revision });
      res.set("Cache-Control", "no-store").json(settingsPayload(req, site));
    } catch (error) { settingsError(res, next, error); }
  });
  // En-tête et pied de page du site : un composant affiché autour des sections de chaque page du site
  router.post("/site-web/sites/:id(\\d+)/parties", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}/reglages#parties`, () => {
      pages.setSiteParts(req.mk.ctx, site.id, { header: intOrNull(req.body.header), footer: intOrNull(req.body.footer) });
      return "En-tête et pied de page enregistrés : ils s'affichent sur toutes les pages du site.";
    });
  });
  // ---------- En-tête du site : création, variantes, exceptions par page ----------
  // En-tête de départ : une ligne avec le logo et le nom du site (éléments qui lisent l'identité du site) ; modifiable ensuite
  const STARTER_HEADER = () => ({ type: "layout", children: [{ type: "container", props: { full: true }, styles: { desktop: { display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "16px", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "24px", paddingRight: "24px" }, mobile: { flexDirection: "column", gap: "8px" } }, children: [{ type: "sitelogo", props: { height: 40 } }, { type: "sitetitle", props: { tag: "p", link: true } }] }] });
  router.post("/site-web/sites/:id(\\d+)/entete/creer", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}/reglages#entete`, () => {
      if (site.header_component_id) throw new (require("../errors").MarketingError)("invalid", "Ce site a déjà un en-tête.");
      let name = "En-tête principal", n = 1;
      while (req.mk.ctx.db.prepare("SELECT 1 FROM mk_web_components WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(req.mk.ctx.organizationId, name)) { n += 1; name = `En-tête principal ${n}`; }
      const c = pages.createComponent(req.mk.ctx, { name, section: STARTER_HEADER(), siteId: site.id });
      pages.setSiteParts(req.mk.ctx, site.id, { header: c.id, footer: site.footer_component_id });
      return `En-tête « ${c.name} » créé : il s'affiche sur toutes les pages du site. Utilisez « Modifier l'en-tête » pour le composer.`;
    });
  });
  router.post("/site-web/sites/:id(\\d+)/entete/variante", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    let variant = null;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}/reglages#entete`, () => {
      variant = pages.createHeaderVariant(req.mk.ctx, site.id, { name: req.body.name });
      return `Variante « ${variant.name} » créée (copie de l'en-tête du site). Modifiez-la, puis choisissez les pages qui l'utilisent.`;
    });
  });
  router.post("/site-web/sites/:id(\\d+)/entete/pages/:pageId(\\d+)", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}/reglages#entete`, () => {
      const page = pages.requirePage(req.mk.ctx, Number(req.params.pageId));
      if (page.site_id !== site.id) throw new (require("../errors").MarketingError)("invalid", "Cette page n'appartient pas à ce site.");
      const choice = String(req.body.choice || "inherit");
      const mode = choice === "none" ? "none" : choice.startsWith("variant:") ? "variant" : "inherit";
      pages.setPageHeader(req.mk.ctx, page.id, { mode, componentId: mode === "variant" ? Number(choice.slice(8)) : null });
      return mode === "none" ? `« ${page.name} » n'affiche plus d'en-tête.` : mode === "variant" ? `« ${page.name} » utilise maintenant une variante de l'en-tête.` : `« ${page.name} » utilise de nouveau l'en-tête du site.`;
    });
  });
  router.post("/site-web/sites/:id(\\d+)/dupliquer", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    let copy = null;
    attempt(req, res, next, () => (copy ? `/marketing/site-web/sites/${copy.id}` : `/marketing/site-web/sites/${site.id}/reglages`), () => {
      const withPages = req.body.contenu !== "configuration";
      copy = pages.duplicateSite(req.mk.ctx, site.id, { withPages });
      return withPages ? `Copie créée : « ${copy.name} » (réglages et pages ; les pages sont en brouillon, hors ligne). Médias, tunnels et articles ne sont pas copiés.` : `Copie créée : « ${copy.name} » (réglages seulement, sans pages).`;
    });
  });
  router.post("/site-web/sites/:id(\\d+)/archiver", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, "/marketing/site-web/sites", () => { pages.archiveSite(req.mk.ctx, site.id); return `Site « ${site.name} » archivé : ses pages sont hors ligne (rien n'est effacé).`; });
  });
  router.post("/site-web/sites/:id(\\d+)/restaurer", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}/reglages`, () => { pages.restoreSite(req.mk.ctx, site.id); return "Site restauré. Ses pages restent hors ligne : publiez celles qui sont prêtes."; });
  });
  router.post("/site-web/sites/:id(\\d+)/supprimer", need("forms.write"), need("pages.delete"), (req, res, next) => {
    if (req.mk.siteOnly) return res.status(403).render("error", { message: "Seule l'équipe de l'organisation peut supprimer un site." });
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, "/marketing/site-web/sites?vue=archives", () => {
      if (String(req.body.confirmation || "").trim().toLowerCase() !== site.name.toLowerCase()) throw new (require("../errors").MarketingError)("invalid_field", "Pour supprimer le site, tapez son nom exact dans le champ de confirmation.");
      pages.deleteSite(req.mk.ctx, site.id);
      return `Site « ${site.name} » supprimé. Il est dans la corbeille (Mes sites → Supprimés) : rien n'est effacé et vous pouvez le récupérer.`;
    });
  });
  router.post("/site-web/sites/:id(\\d+)/recuperer", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, "/marketing/site-web/sites?vue=archives", () => { pages.undeleteSite(req.mk.ctx, site.id); return `Site « ${site.name} » sorti de la corbeille (il reste archivé : restaurez-le pour le remettre en service).`; });
  });
  // ---------- Médiathèque de l'éditeur (JSON) ----------
  // Une seule bibliothèque d'images pour les pages : la médiathèque Marketing (envoi, texte de remplacement, suppression
  // contrôlée) et, en lecture, celle du site (blog, Centre de gestion). Aucun fichier n'est recopié.
  const { mediaCtx } = require("../media/requestContext"); // la médiathèque d'UN site (jamais « tous »)
  const mediaError = (res, next, error) => {
    const { MarketingError } = require("../errors");
    if (!(error instanceof MarketingError)) return next(error);
    res.status(error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : 422).json({ error: { code: error.code, message: error.message } });
  };
  const marketingItem = (m) => ({ source: "marketing", id: m.id, path: m.path, name: m.name, alt: m.alt || "", width: m.width, height: m.height, size: m.size, mime: m.mime, editable: true });
  router.get("/site-web/medias.json", need("forms.read"), (req, res) => {
    const src = ["marketing", "site"].includes(req.query.source) ? req.query.source : "all";
    const q = String(req.query.q || "").slice(0, 80);
    const mk = src === "site" ? [] : media.listMedia(mediaCtx(req), { kind: "image", q, limit: 100 }).items.map(marketingItem);
    // Les images de l'ancien blog n'ont pas de site propriétaire : elles ne sont proposées qu'au site PRINCIPAL, jamais dans la médiathèque d'un site
    const mctx = mediaCtx(req), site = src === "marketing" || Number.isInteger(mctx.siteScope) || Number.isInteger(mctx.siteFilter) ? [] : siteImages(mctx.db, { q, limit: 100 });
    res.set("Cache-Control", "no-store").json({ items: mk.concat(site) });
  });
  // Résolutions proposables pour une ou plusieurs images de la médiathèque (widget Image, Galerie…) : seulement les tailles
  // plus petites que l'image la plus petite du lot, et seulement si le serveur sait fabriquer des versions réduites.
  router.get("/site-web/medias/resolutions.json", need("forms.read"), (req, res) => {
    const variants = require("../media/variants");
    const list = [].concat(req.query.src || []).map(String).slice(0, 24);
    const vis = media.referenceSql(mediaCtx(req));
    const rows = list.map((src) => (variants.isLocal(src) ? mediaCtx(req).db.prepare(`SELECT width, height, size FROM mk_media WHERE organization_id = ? AND path = ? AND type = 'image' AND ${vis.sql}`).get(mediaCtx(req).organizationId, src, ...vis.params) : null));
    const known = rows.filter((r) => r && r.width);
    const complete = list.length > 0 && known.length === list.length;
    const min = complete ? Math.min(...known.map((r) => r.width)) : 0;
    res.set("Cache-Control", "no-store").json({
      available: variants.available(), complete, width: complete ? min : null, height: complete && list.length === 1 ? known[0].height : null, bytes: complete && list.length === 1 ? known[0].size : null,
      sizes: complete ? variants.offered(min) : [],
    });
  });
  // Où une image est utilisée (pages, composants, modèles, articles, sites) : la même détection que le refus de suppression
  router.get("/site-web/medias/:id(\\d+)/usage.json", need("forms.read"), (req, res) => {
    const m = media.getMedia(mediaCtx(req), Number(req.params.id));
    if (!m) return res.status(404).json({ error: { code: "not_found", message: "Fichier introuvable." } });
    res.set("Cache-Control", "no-store").json({ items: media.mediaUsage(mediaCtx(req), m).map((u) => ({ kind: u.kind, name: u.name, href: media.usageHref(u) })) });
  });
  router.post("/site-web/medias", need("forms.write"), (req, res, next) => {
    mediaUpload.single("file")(req, res, (uploadError) => {
      if (uploadError) return res.status(422).json({ error: { code: "invalid_field", message: uploadError.code === "LIMIT_FILE_SIZE" ? `Image trop lourde : ${media.MAX_IMAGE / 1048576} Mo au plus.` : "Envoi du fichier impossible." } });
      try {
        const { MarketingError } = require("../errors");
        if (!req.file) throw new MarketingError("invalid_field", "Aucun fichier reçu.");
        const utf8 = Buffer.from(req.file.originalname, "latin1").toString("utf8");
        const originalName = utf8.includes("\uFFFD") ? req.file.originalname : utf8;
        if (media.sniff(req.file.buffer) && media.sniff(req.file.buffer).kind !== "image") throw new MarketingError("invalid_field", "Une page affiche des images : JPEG, PNG, GIF ou WebP. Un PDF se partage par un lien.");
        let saved = media.saveUpload(mediaCtx(req), { buffer: req.file.buffer, originalName, declaredType: req.file.mimetype, allow: ["image"], siteId: media.siteOfUpload(mediaCtx(req)) });
        if (req.body && typeof req.body.alt === "string" && req.body.alt.trim()) saved = media.updateMedia(mediaCtx(req), saved.id, { alt: req.body.alt });
        res.status(201).json({ media: marketingItem(saved) });
      } catch (error) { mediaError(res, next, error); }
    });
  });
  router.post("/site-web/medias/:id(\\d+)", need("forms.write"), (req, res, next) => {
    try { res.json({ media: marketingItem(media.updateMedia(mediaCtx(req), Number(req.params.id), { name: req.body && req.body.name, alt: req.body && req.body.alt })) }); } catch (error) { mediaError(res, next, error); }
  });
  router.post("/site-web/medias/:id(\\d+)/supprimer", need("forms.write"), (req, res, next) => {
    try { res.json({ ok: media.deleteMedia(mediaCtx(req), Number(req.params.id)) }); } catch (error) { mediaError(res, next, error); }
  });

  // ---------- Composants réutilisables (éditeur visuel, JSON) ----------
  const jsonError = (res, next, error) => {
    const { MarketingError } = require("../errors");
    if (!(error instanceof MarketingError)) return next(error);
    res.status(error.code === "not_found" ? 404 : error.code === "in_use" || error.code === "duplicate" ? 409 : 422).json({ error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } });
  };
  const describe = (c, ctx) => ({ id: c.id, name: c.name, global: c.global, kind: c.kind, hasDraft: c.hasDraft, version: c.version, blocks: c.blocks, type: c.section && c.section.type, section: c.section, uses: ctx ? pages.componentInstances(ctx, c.id).reduce((n, p) => n + p.count, 0) : undefined });
  router.get("/site-web/composants.json", need("forms.read"), (req, res) => {
    res.set("Cache-Control", "no-store").json({ components: pages.listComponents(req.mk.ctx, { siteId: intOrNull(req.query.site) }).map(describe) });
  });
  router.get("/site-web/composants/:id(\\d+).json", need("forms.read"), (req, res) => {
    const c = pages.getComponent(req.mk.ctx, Number(req.params.id));
    if (!c) return res.status(404).json({ error: { code: "not_found", message: "Composant introuvable." } });
    res.json({ component: describe(c) });
  });
  router.post("/site-web/composants", need("forms.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      const c = pages.createComponent(req.mk.ctx, { name: b.name, section: b.section, siteId: b.global ? null : intOrNull(b.siteId), kind: b.kind === "global" ? "global" : "standard" });
      res.status(201).json({ component: describe(c) });
    } catch (error) { jsonError(res, next, error); }
  });
  router.post("/site-web/composants/:id(\\d+)", need("forms.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      res.json({ component: describe(pages.updateComponent(req.mk.ctx, Number(req.params.id), { name: b.name, section: b.section, global: typeof b.global === "boolean" ? b.global : undefined, siteId: b.siteId }), req.mk.ctx) });
    } catch (error) { jsonError(res, next, error); }
  });
  // Modèles de pages (enregistrés depuis l'éditeur ; proposés à la création d'une page) : PRIVÉS à leur site. Le site demandé (?site=) n'est qu'un sélecteur : l'accès à ce site est revérifié par le moteur (inScope)
  const tplSite = (req) => { const v = req.query.site; return v === undefined || v === "" || v === "principal" ? null : (/^\d{1,12}$/.test(String(v)) ? Number(v) : -1); };
  router.get("/site-web/modeles.json", need("forms.read"), (req, res) => {
    res.set("Cache-Control", "no-store").json({ templates: pages.listPageTemplates(req.mk.ctx, { siteId: tplSite(req) }).map(({ content, ...t }) => ({ ...t, sections: content.sections.length })) });
  });
  // Contenu d'un modèle de l'équipe (insertion dans la page en cours, depuis l'éditeur)
  router.get("/site-web/modeles/:id(\\d+).json", need("forms.read"), (req, res) => {
    const t = pages.getPageTemplate(req.mk.ctx, Number(req.params.id), { siteId: tplSite(req) });
    if (!t) return res.status(404).json({ error: { code: "not_found", message: "Modèle introuvable." } });
    res.set("Cache-Control", "no-store").json({ template: { id: t.id, name: t.name, category: t.category, sections: t.content.sections } });
  });
  // Sections d'un gabarit intégré (écran « Création guidée » de l'éditeur) : copie neuve à chaque appel, rien n'est enregistré
  router.get("/site-web/gabarits/:key([a-z0-9-]+).json", need("forms.read"), (req, res, next) => {
    try {
      const sections = pages.gabaritSections(req.mk.ctx, req.params.key);
      if (!sections) return res.status(404).json({ error: { code: "not_found", message: "Gabarit introuvable." } });
      res.set("Cache-Control", "no-store").json({ gabarit: { key: req.params.key, sections } });
    } catch (error) { jsonError(res, next, error); }
  });
  router.post("/site-web/modeles", need("forms.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      const t = pages.savePageTemplate(req.mk.ctx, { name: b.name, category: b.category, description: b.description, content: b.content, siteId: Number.isInteger(b.siteId) && b.siteId > 0 ? b.siteId : null });
      res.status(201).json({ template: { id: t.id, name: t.name, category: t.category } });
    } catch (error) { jsonError(res, next, error); }
  });
  router.post("/site-web/modeles/:id(\\d+)/supprimer", need("forms.write"), (req, res, next) => {
    // Retour à la liste des pages DU SITE du modèle (jamais celle du principal), avec la boîte « Nouvelle page » ouverte
    const own = req.mk.ctx.db.prepare("SELECT site_id FROM mk_page_templates WHERE id = ? AND organization_id = ?").get(Number(req.params.id), req.mk.ctx.organizationId);
    const home = own && Number.isInteger(own.site_id) && own.site_id > 0 ? `/marketing/site-web/sites/${own.site_id}/pages?nouvelle=1` : "/marketing/pages?nouvelle=1";
    attempt(req, res, next, home, () => { pages.deletePageTemplate(req.mk.ctx, Number(req.params.id)); return "Modèle supprimé (les pages déjà créées avec lui ne changent pas)."; });
  });
  // Pages et nombre d'instances liées (données réelles : contenu de travail de chaque page)
  router.get("/site-web/composants/:id(\\d+)/instances.json", need("forms.read"), (req, res) => {
    const c = pages.getComponent(req.mk.ctx, Number(req.params.id));
    if (!c) return res.status(404).json({ error: { code: "not_found", message: "Composant introuvable." } });
    const pagesUsing = pages.componentInstances(req.mk.ctx, c.id);
    res.set("Cache-Control", "no-store").json({ id: c.id, name: c.name, kind: c.kind, instances: pagesUsing.reduce((n, p) => n + p.count, 0), pages: pagesUsing });
  });
  // Mise à jour explicite : la copie de travail devient la version diffusée aux instances liées
  router.post("/site-web/composants/:id(\\d+)/mettre-a-jour", need("forms.write"), (req, res, next) => {
    try {
      const r = pages.publishComponent(req.mk.ctx, Number(req.params.id));
      res.json({ component: describe(r.component, req.mk.ctx), changed: r.changed, pages: r.instances.length, instances: r.instances.reduce((n, p) => n + p.count, 0) });
    } catch (error) { jsonError(res, next, error); }
  });
  router.post("/site-web/composants/:id(\\d+)/abandonner", need("forms.write"), (req, res, next) => {
    try { res.json({ component: describe(pages.discardComponentDraft(req.mk.ctx, Number(req.params.id)), req.mk.ctx) }); } catch (error) { jsonError(res, next, error); }
  });
  // Suppression : sans instance liée, directe ; sinon le corps choisit « instances » (les supprimer aussi) ou « detach » (les conserver, devenues indépendantes)
  router.post("/site-web/composants/:id(\\d+)/supprimer", need("forms.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      const r = pages.deleteComponent(req.mk.ctx, Number(req.params.id), { mode: b.mode || null, skipDraftOfPage: b.skipDraftOfPage ? Number(b.skipDraftOfPage) : null });
      res.json({ ok: true, ...r });
    } catch (error) { jsonError(res, next, error); }
  });
  return router;
};
