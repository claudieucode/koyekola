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
    res.render("marketing/site-web", { title: "Site Web", active: "sitedash", d, aud: require("../pages/analytics").audience(req.mk.ctx, { days: d.period.days }) });
  });

  router.get("/site-web/sites", need("forms.read"), (req, res) => {
    const archived = req.query.vue === "archives";
    res.render("marketing/sites", { title: "Sites", active: "sites", archived, sites: pages.listSites(req.mk.ctx, { archived }) });
  });
  router.post("/site-web/sites", need("forms.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => (created ? `/marketing/site-web/sites/${created.id}` : "/marketing/site-web/sites"), () => {
      created = pages.createSite(req.mk.ctx, { name: req.body.name });
      return "Site créé : ajoutez ses pages, choisissez sa page d'accueil et réglez son design system.";
    });
  });

  const load = (req, res) => {
    const site = pages.getSite(req.mk.ctx, intOrNull(req.params.id));
    if (!site) res.status(404).render("error", { message: "Site introuvable." });
    return site;
  };
  router.get("/site-web/sites/:id(\\d+)", need("forms.read"), (req, res) => {
    const site = load(req, res);
    if (!site) return;
    res.render("marketing/site", {
      title: site.name, active: "sites", site, sitePages: pages.listPages(req.mk.ctx, { siteId: site.id }), canWrite: req.mk.can("forms.write"),
      T: tokens, cssVars: tokens.tokensToCss(site.tokens), templates: require("../pages/templates").catalog(),
      components: pages.listComponents(req.mk.ctx, { siteId: site.id }),
    });
  });
  router.post("/site-web/sites/:id(\\d+)", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}`, () => {
      pages.updateSite(req.mk.ctx, site.id, { name: req.body.name });
      if (req.body.home_page_id !== undefined) pages.setHomePage(req.mk.ctx, site.id, intOrNull(req.body.home_page_id));
      return "Réglages du site enregistrés.";
    });
  });
  router.post("/site-web/sites/:id(\\d+)/design", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}#design`, () => {
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
    canWrite: req.mk.can("forms.write"), canCode: req.mk.can("pages.code"),
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
      const site = pages.saveSiteDesign(req.mk.ctx, current.id, { tokens: body.tokens, settings: body.settings, name: body.name, revision: body.revision });
      res.set("Cache-Control", "no-store").json(settingsPayload(req, site));
    } catch (error) { settingsError(res, next, error); }
  });
  // En-tête et pied de page du site : un composant affiché autour des sections de chaque page du site
  router.post("/site-web/sites/:id(\\d+)/parties", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}#parties`, () => {
      pages.setSiteParts(req.mk.ctx, site.id, { header: intOrNull(req.body.header), footer: intOrNull(req.body.footer) });
      return "En-tête et pied de page enregistrés : ils s'affichent sur toutes les pages du site.";
    });
  });
  router.post("/site-web/sites/:id(\\d+)/dupliquer", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    let copy = null;
    attempt(req, res, next, () => (copy ? `/marketing/site-web/sites/${copy.id}` : `/marketing/site-web/sites/${site.id}`), () => {
      copy = pages.duplicateSite(req.mk.ctx, site.id);
      return `Copie créée : « ${copy.name} » (ses pages sont hors ligne, en brouillon).`;
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
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}`, () => { pages.restoreSite(req.mk.ctx, site.id); return "Site restauré. Ses pages restent hors ligne : publiez celles qui sont prêtes."; });
  });
  // ---------- Médiathèque de l'éditeur (JSON) ----------
  // Une seule bibliothèque d'images pour les pages : la médiathèque Marketing (envoi, texte de remplacement, suppression
  // contrôlée) et, en lecture, celle du site (blog, Centre de gestion). Aucun fichier n'est recopié.
  const mediaError = (res, next, error) => {
    const { MarketingError } = require("../errors");
    if (!(error instanceof MarketingError)) return next(error);
    res.status(error.code === "not_found" ? 404 : 422).json({ error: { code: error.code, message: error.message } });
  };
  const marketingItem = (m) => ({ source: "marketing", id: m.id, path: m.path, name: m.name, alt: m.alt || "", width: m.width, height: m.height, size: m.size, mime: m.mime, editable: true });
  router.get("/site-web/medias.json", need("forms.read"), (req, res) => {
    const src = ["marketing", "site"].includes(req.query.source) ? req.query.source : "all";
    const q = String(req.query.q || "").slice(0, 80);
    const mk = src === "site" ? [] : media.listMedia(req.mk.ctx, { kind: "image", q, limit: 100 }).items.map(marketingItem);
    const site = src === "marketing" ? [] : siteImages(req.mk.ctx.db, { q, limit: 100 });
    res.set("Cache-Control", "no-store").json({ items: mk.concat(site) });
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
        let saved = media.saveUpload(req.mk.ctx, { buffer: req.file.buffer, originalName, declaredType: req.file.mimetype });
        if (req.body && typeof req.body.alt === "string" && req.body.alt.trim()) saved = media.updateMedia(req.mk.ctx, saved.id, { alt: req.body.alt });
        res.status(201).json({ media: marketingItem(saved) });
      } catch (error) { mediaError(res, next, error); }
    });
  });
  router.post("/site-web/medias/:id(\\d+)", need("forms.write"), (req, res, next) => {
    try { res.json({ media: marketingItem(media.updateMedia(req.mk.ctx, Number(req.params.id), { name: req.body && req.body.name, alt: req.body && req.body.alt })) }); } catch (error) { mediaError(res, next, error); }
  });
  router.post("/site-web/medias/:id(\\d+)/supprimer", need("forms.write"), (req, res, next) => {
    try { res.json({ ok: media.deleteMedia(req.mk.ctx, Number(req.params.id)) }); } catch (error) { mediaError(res, next, error); }
  });

  // ---------- Composants réutilisables (éditeur visuel, JSON) ----------
  const jsonError = (res, next, error) => {
    const { MarketingError } = require("../errors");
    if (!(error instanceof MarketingError)) return next(error);
    res.status(error.code === "not_found" ? 404 : error.code === "in_use" || error.code === "duplicate" ? 409 : 422).json({ error: { code: error.code, message: error.message } });
  };
  const describe = (c, ctx) => ({ id: c.id, name: c.name, global: c.global, type: c.section && c.section.type, section: c.section, uses: ctx ? pages.componentUsage(ctx, c.id).length : undefined });
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
      const c = pages.createComponent(req.mk.ctx, { name: b.name, section: b.section, siteId: b.global ? null : intOrNull(b.siteId) });
      res.status(201).json({ component: describe(c) });
    } catch (error) { jsonError(res, next, error); }
  });
  router.post("/site-web/composants/:id(\\d+)", need("forms.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      res.json({ component: describe(pages.updateComponent(req.mk.ctx, Number(req.params.id), { name: b.name, section: b.section, global: typeof b.global === "boolean" ? b.global : undefined, siteId: b.siteId }), req.mk.ctx) });
    } catch (error) { jsonError(res, next, error); }
  });
  // Modèles de pages de l'équipe (enregistrés depuis l'éditeur ; proposés à la création d'une page)
  router.get("/site-web/modeles.json", need("forms.read"), (req, res) => {
    res.set("Cache-Control", "no-store").json({ templates: pages.listPageTemplates(req.mk.ctx).map(({ content, ...t }) => ({ ...t, sections: content.sections.length })) });
  });
  // Contenu d'un modèle de l'équipe (insertion dans la page en cours, depuis l'éditeur)
  router.get("/site-web/modeles/:id(\\d+).json", need("forms.read"), (req, res) => {
    const t = pages.getPageTemplate(req.mk.ctx, Number(req.params.id));
    if (!t) return res.status(404).json({ error: { code: "not_found", message: "Modèle introuvable." } });
    res.set("Cache-Control", "no-store").json({ template: { id: t.id, name: t.name, category: t.category, sections: t.content.sections } });
  });
  router.post("/site-web/modeles", need("forms.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      const t = pages.savePageTemplate(req.mk.ctx, { name: b.name, category: b.category, description: b.description, content: b.content });
      res.status(201).json({ template: { id: t.id, name: t.name, category: t.category } });
    } catch (error) { jsonError(res, next, error); }
  });
  router.post("/site-web/modeles/:id(\\d+)/supprimer", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/pages#nouvelle", () => { pages.deletePageTemplate(req.mk.ctx, Number(req.params.id)); return "Modèle supprimé (les pages déjà créées avec lui ne changent pas)."; });
  });
  router.post("/site-web/composants/:id(\\d+)/supprimer", need("forms.write"), (req, res, next) => {
    try {
      pages.deleteComponent(req.mk.ctx, Number(req.params.id));
      res.json({ ok: true });
    } catch (error) { jsonError(res, next, error); }
  });
  return router;
};
