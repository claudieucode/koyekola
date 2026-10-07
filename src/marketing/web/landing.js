// Pages (Site Web → Pages) : liste, éditeur par sections, brouillon et aperçu, publication, versions, rapport.
// Le contenu est enregistré dans le BROUILLON du moteur de pages ; « Publier » le met en ligne. Un seul formulaire par page : déplacer, supprimer ou ajouter une section ENREGISTRE aussi les
// modifications en cours (jamais de saisie perdue). Droits : ceux des formulaires d'inscription.
const express = require("express");
const landing = require("../landing");
const pages = require("../pages");
const { tokensToCss } = require("../pages/tokens");
const { blanks } = require("../pages/blanks");
const { safeJson } = require("./kit");
const forms = require("../forms");
const media = require("../media");
const { listCourses } = require("../bridge/catalog");
const { MarketingError } = require("../errors");
const { renderMarkdown } = require("../../utils/markdown");
const { attempt, need } = require("./kit");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const STATUS_CLASS = { draft: "", published: "mk-status-ok", unpublished: "mk-status-warn" };

// Section vide mais VALIDE pour chaque type (une section ajoutée s'enregistre tout de suite)
function blankSection(ctx, type) {
  switch (type) {
    case "hero": return { type, title: "Un titre qui dit ce que la personne y gagne", subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" };
    case "text": return { type, markdown: "Votre texte ici. Vous pouvez mettre du **gras** et des [liens](https://kolakisa.com)." };
    case "list": return { type, title: "Ce que vous allez apprendre", items: ["Premier point fort", "Deuxième point fort"] };
    case "button": return { type, label: "Découvrir le catalogue", url: "/catalogue", align: "center" };
    case "quote": return { type, text: "Une phrase marquante d'un élève ou d'un partenaire.", author: "" };
    case "form": return { type, heading: "Inscrivez-vous", intro: "" };
    case "course": {
      const c = listCourses(ctx)[0];
      if (!c) throw new MarketingError("invalid_field", "Aucune formation publiée dans le catalogue : publiez-en une pour l'ajouter à la page.");
      return { type, courseId: c.id, cta: "Découvrir la formation" };
    }
    case "image": {
      const img = media.listMedia(ctx, { kind: "image", limit: 1 }).items[0];
      if (!img) throw new MarketingError("invalid_field", "Aucune image dans la médiathèque : ajoutez-en une (Modèles d'e-mails → Médias), ou ajoutez un bandeau avec une adresse d'image.");
      return { type, src: img.path, alt: img.alt || img.name, caption: "", link: "" };
    }
    default: throw new MarketingError("invalid_field", "Type de section inconnu.");
  }
}
// Formulaire HTML → sections (image : choix dans la médiathèque, sinon adresse saisie)
function sectionsFromBody(body) {
  const raw = body.sections && typeof body.sections === "object" ? Object.keys(body.sections).sort((a, b) => Number(a) - Number(b)).map((k) => body.sections[k]) : [];
  return raw.map((s) => {
    const out = { ...s };
    if (s.type === "hero") out.image = s.imageLib || s.imageUrl || "";
    if (s.type === "image") out.src = s.srcLib || s.srcUrl || "";
    if (s.type === "list") out.items = String(s.items || "").split(/\r?\n/);
    return out;
  });
}

// Contenu de travail envoyé par l'éditeur → brouillon du moteur de pages (jamais directement en ligne)
function contentFromBody(b, sections, working) {
  return {
    sections, title: b.title, description: b.description,
    theme: b.theme_accent === undefined ? working.theme : { accent: b.theme_accent, background: b.theme_background, text: b.theme_text },
    seo: { ...working.seo, canonical: b.seo_canonical, ogImage: b.seo_og_image },
  };
}

module.exports = () => {
  const router = express.Router();

  // Site Web → Pages : toutes les pages (sites, tunnels, pages d'atterrissage), archivées à part
  router.get("/pages", need("forms.read"), (req, res) => {
    const archived = req.query.vue === "archivees";
    res.render("marketing/landing-list", {
      title: "Pages", active: "landing", archived, pages: pages.listPages(req.mk.ctx, { archived }), sites: pages.listSites(req.mk.ctx), templates: require("../pages/templates").catalog(),
      userTemplates: pages.listPageTemplates(req.mk.ctx), canWrite: req.mk.can("forms.write"),
      STATUSES: landing.STATUSES, STATUS_CLASS, KINDS: pages.KINDS,
    });
  });
  router.post("/pages", need("forms.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => (created ? `/marketing/pages/${created.id}` : "/marketing/pages"), () => {
      const siteId = intOrNull(req.body.site_id);
      const template = typeof req.body.template === "string" && req.body.template ? req.body.template : null;
      created = pages.createPage(req.mk.ctx, { name: req.body.name, siteId, kind: siteId ? "page" : "landing", template });
      return template ? "Page créée à partir du modèle (brouillon) : remplacez les textes entre crochets dans l'éditeur visuel, puis publiez-la." : "Page créée (brouillon) : composez-la, puis publiez-la.";
    });
  });

  const load = (req, res) => {
    const p = pages.getPage(req.mk.ctx, intOrNull(req.params.id));
    if (!p) res.status(404).render("error", { message: "Page introuvable." });
    return p;
  };
  // Export / import d'une page (fichier JSON au format kolakisa-page@1, entièrement revalidé à l'import)
  router.get("/pages/:id(\\d+)/exporter", need("forms.read"), (req, res) => {
    const page = load(req, res);
    if (!page) return;
    res.set("Content-Disposition", `attachment; filename="page-${page.slug}.kolakisa.json"`).set("Cache-Control", "no-store").json(pages.exportPage(req.mk.ctx, page.id));
  });
  router.post("/pages/importer.json", need("forms.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      const p = pages.importPage(req.mk.ctx, b.data, { siteId: intOrNull(b.siteId) });
      res.status(201).json({ page: { id: p.id, name: p.name }, url: `/marketing/pages/${p.id}/editeur` });
    } catch (error) { jsonError(res, next, error); }
  });
  // Données d'affichage d'un contenu (formations relues dans le catalogue, composants synchronisés résolus)
  // Aperçu, canevas, versions : vus comme par un visiteur inconnu (personnalisation non appliquée, tout est montré)
  const shown = (ctx, page, content) => landing.viewModel(ctx, { ...page, ...content, sections: pages.withSiteParts(ctx, page, pages.resolveSections(ctx, content.sections)) });

  router.get("/pages/:id(\\d+)", need("forms.read"), (req, res) => {
    const page = load(req, res);
    if (!page) return;
    const { ctx } = req.mk;
    res.render("marketing/landing", {
      title: page.name, active: "landing", page, content: page.working, STATUSES: landing.STATUSES, STATUS_CLASS, SECTION_LABELS: Object.fromEntries(Object.entries(pages.TYPES).map(([k, t]) => [k, t.label])),
      forms: forms.listForms(ctx), courses: listCourses(ctx), images: media.listMedia(ctx, { kind: "image", limit: 100 }).items,
      sites: pages.listSites(ctx), versions: pages.listVersions(ctx, page.id), inFunnels: require("../funnels").funnelsOfPage(ctx, page.id),
      variantOf: ctx.db.prepare("SELECT t.id, t.page_id, p.name FROM mk_page_tests t JOIN mk_landing_pages p ON p.id = t.page_id WHERE t.variant_page_id = ? AND t.organization_id = ?").get(page.id, ctx.organizationId) || null,
      openTest: ctx.db.prepare("SELECT id, name, status FROM mk_page_tests WHERE page_id = ? AND organization_id = ? AND status IN ('draft', 'running', 'stopped')").get(page.id, ctx.organizationId) || null,
      report: landing.pageReport(ctx, page.id), check: landing.preflight(ctx, { ...page, sections: pages.resolveSections(ctx, page.working.sections) }), canWrite: req.mk.can("forms.write"),
      publicUrl: `${String(process.env.SITE_URL || "").replace(/\/+$/, "")}/p/${page.slug}`,
    });
  });
  // Analyse d'une page : entonnoir réel (visiteurs ayant accepté la mesure d'audience), plus forte perte si l'échantillon
  // le permet
  router.get("/pages/:id(\\d+)/analyse", need("forms.read"), (req, res) => {
    const page = load(req, res);
    if (!page) return;
    const days = [7, 30, 90].includes(Number(req.query.periode)) ? Number(req.query.periode) : 30;
    const { ctx } = req.mk;
    res.render("marketing/page-analysis", { title: `Analyse — ${page.name}`, active: "landing", page, days, funnel: require("../pages/analytics").pageFunnel(ctx, { slug: page.slug, sections: pages.resolveSections(ctx, page.published.sections) }, { days }), report: landing.pageReport(ctx, page.id, { days }) });
  });
  // Comparer une version avec l'état actuel de la page (brouillon s'il existe, sinon la version en ligne)
  router.get("/pages/:id(\\d+)/versions/:n(\\d+)/comparer", need("forms.read"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    let v;
    try { v = pages.getVersion(req.mk.ctx, page.id, Number(req.params.n)); } catch (error) { if (error instanceof MarketingError) return res.status(404).render("error", { message: error.message }); return next(error); }
    const diff = require("../pages/compare").compareContents(v.content, page.working);
    res.render("marketing/page-compare", { title: `Comparer la version ${v.number} — ${page.name}`, active: "landing", page, version: v, diff, canWrite: req.mk.can("forms.write") });
  });
  // Aperçu du BROUILLON (ou de la version en ligne s'il n'y a pas de brouillon) : clics et inscriptions non enregistrés
  const renderPreview = (req, res, page, content, label) => {
    const ctx = req.mk.ctx;
    const form = page.form_id ? forms.getForm(ctx, page.form_id) : null;
    res.set("Cache-Control", "no-store");
    res.render("marketing-public/landing", { page: shown(ctx, page, content), site: page.site_id ? pages.getSite(ctx, page.site_id) : null, tokensToCss, form, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: form ? forms.propertyFieldDefs(ctx.db, ctx.organizationId, form) : [], renderMarkdown, error: null, values: {}, thanks: null, preview: true, previewLabel: label });
  };
  router.get("/pages/:id(\\d+)/apercu", need("forms.read"), (req, res) => {
    const page = load(req, res);
    if (!page) return;
    renderPreview(req, res, page, page.working, page.hasDraft ? "Aperçu du brouillon — pas encore en ligne." : null);
  });
  router.get("/pages/:id(\\d+)/versions/:n(\\d+)/apercu", need("forms.read"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    let v;
    try { v = pages.getVersion(req.mk.ctx, page.id, Number(req.params.n)); } catch (error) { if (error instanceof MarketingError) return res.status(404).render("error", { message: error.message }); return next(error); }
    renderPreview(req, res, page, v.content, `Version ${v.number} — consultation seulement.`);
  });

  // Enregistrer (+ éventuellement : monter / descendre / supprimer / ajouter une section) : réglages appliqués tout de
  // suite, contenu enregistré dans le BROUILLON (la version en ligne ne change qu'avec « Publier »)
  router.post("/pages/:id(\\d+)", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    const b = req.body;
    let anchor = "";
    attempt(req, res, next, () => `/marketing/pages/${page.id}${anchor}`, () => {
      // Fiche de la page (réglages et SEO) : les sections ne sont pas envoyées, elles restent celles du brouillon
      // (elles se modifient dans l'éditeur visuel). Le formulaire par sections reste accepté (API, scripts, tests).
      const sections = b.sections ? sectionsFromBody(b) : page.working.sections;
      const action = String(b.action || "save");
      let m;
      if ((m = /^(up|down|remove):(\d{1,2})$/.exec(action))) {
        const i = Number(m[2]);
        if (i < sections.length) {
          if (m[1] === "remove") sections.splice(i, 1);
          else { const j = m[1] === "up" ? i - 1 : i + 1; if (j >= 0 && j < sections.length) [sections[i], sections[j]] = [sections[j], sections[i]]; anchor = `#section-${Math.max(0, Math.min(sections.length - 1, j))}`; }
        }
      } else if ((m = /^add:([a-z]+)$/.exec(action))) {
        sections.push(blankSection(req.mk.ctx, m[1]));
        anchor = `#section-${sections.length - 1}`;
      }
      const ctx = req.mk.ctx;
      landing.saveSettings(ctx, page.id, { name: b.name, slug: b.slug, formId: b.form_id, tags: b.tags, indexable: b.indexable === "on" });
      const siteId = intOrNull(b.site_id);
      if (b.site_id !== undefined && siteId !== page.site_id) pages.movePage(ctx, page.id, siteId);
      pages.saveDraft(ctx, page.id, contentFromBody(b, sections, page.working), { revision: Number(b.revision) });
      const text = action.startsWith("add:") ? "Section ajoutée." : action.startsWith("remove:") ? "Section supprimée." : action.startsWith("up:") || action.startsWith("down:") ? "Section déplacée." : b.sections ? "Brouillon enregistré." : "Réglages enregistrés.";
      if (!b.sections) return page.status === "published" ? "Réglages enregistrés. Adresse, site, formulaire et étiquettes s'appliquent tout de suite ; titre, description et SEO sont dans le brouillon : « Publier les modifications » les met en ligne." : text;
      return page.status === "published" ? `${text} La page en ligne n'a pas changé : cliquez sur « Publier les modifications » pour la mettre à jour.` : text;
    });
  });
  // ---------- Éditeur visuel ----------
  // Erreur métier en JSON : conflit (autre onglet) 409, introuvable 404, contenu invalide 422 (message précis)
  const jsonError = (res, next, error) => {
    if (!(error instanceof MarketingError)) return next(error);
    res.status(error.code === "conflict" ? 409 : error.code === "not_found" ? 404 : 422).json({ error: { code: error.code, message: error.message } });
  };
  // Éditeur ouvert sur une page (component = null) ou sur la SOURCE d'un composant du site : en-tête, pied de page…
  const openEditor = (req, res, page, { component = null } = {}) => {
    const { ctx } = req.mk;
    const site = page.site_id ? pages.getSite(ctx, page.site_id) : null;
    const nodesLib = require("../pages/nodes");
    const form = page.form_id ? forms.getForm(ctx, page.form_id) : null;
    const funnel = component ? null : require("../funnels").funnelsOfPage(ctx, page.id).find((f) => f.status === "active") || null;
    const boot = {
      page: { id: page.id, name: page.name, slug: page.slug, status: page.status, hasDraft: page.hasDraft, revision: page.revision, siteId: page.site_id, siteName: site ? site.name : null,
        formId: page.form_id, formName: form ? form.name : null, formPublished: Boolean(form && form.status === "published"), indexable: Boolean(page.indexable), funnel: funnel ? { id: funnel.id, name: funnel.name, position: funnel.position } : null,
        abTest: component ? null : (ctx.db.prepare("SELECT id, page_id FROM mk_page_tests WHERE variant_page_id = ? AND organization_id = ?").get(page.id, ctx.organizationId)) || null,
        // Édition d'un composant : adresses de l'éditeur propres au composant (rendu, enregistrement) et retour à la fiche du site
        ...(component ? { base: `/marketing/site-web/composants/${component.id}`, component: { id: component.id, name: component.name, role: component.role } } : {}) },
      content: page.working, types: blanks(ctx), spec: nodesLib.editorSpec(), canWrite: req.mk.can("forms.write"),
      // Permissions exigées par certains widgets (cadenas de la bibliothèque ; revérifiées à l'enregistrement)
      perms: { "pages.code": req.mk.can("pages.code") },
      // Formulaires proposés au widget « Formulaire » (état réel : un brouillon ne s'affiche pas sur la page)
      forms: require("../forms").listForms(ctx).map((f) => ({ id: f.id, name: f.name, status: f.status })),
      blocks: require("../pages/patterns").catalog(ctx),
      courses: listCourses(ctx).map((c) => ({ id: c.id, title: c.title })),
      components: pages.listComponents(ctx, { siteId: page.site_id }).map((c) => ({ id: c.id, name: c.name, global: c.global, type: c.section && c.section.type, uses: pages.componentUsage(ctx, c.id).length })),
      // Modèles de pages de l'équipe (onglet Blocs : insérables dans la page en cours)
      templates: pages.listPageTemplates(ctx).map((t) => ({ id: t.id, name: t.name, category: t.category, sections: t.content.sections.length })),
      // Adresses proposées pour les liens : pages en ligne, pages du site, étape suivante (page d'un tunnel)
      links: [{ url: "/catalogue", label: "Catalogue des formations" }, { url: "/blog", label: "Blog" }, { url: "/", label: "Accueil du site" }]
        .concat(funnel ? [{ url: require("../funnels").NEXT_URL, label: `Étape suivante du tunnel « ${funnel.name} »` }] : [])
        .concat(pages.listPages(ctx).filter((p) => p.status === "published" && p.id !== page.id).slice(0, 50).map((p) => ({ url: `/p/${p.slug}`, label: `Page « ${p.name} »` }))),
      siteUrl: String(process.env.SITE_URL || "").replace(/\/+$/, ""),
      tags: require("../audience/tags").listTags(ctx).map((t) => t.name),
    };
    res.set("Cache-Control", "no-store");
    const { ICONS } = require("../../utils/icons");
    res.render("marketing/page-builder", { title: `Éditeur — ${page.name}`, page, boot: safeJson(boot), spec: boot.spec, iconExists: (n) => Object.hasOwn(ICONS, n) });
  };
  router.get("/pages/:id(\\d+)/editeur", need("forms.read"), (req, res) => {
    const page = load(req, res);
    if (!page) return;
    if (page.archived_at) return res.redirect(`/marketing/pages/${page.id}`);
    openEditor(req, res, page);
  });

  // ---------- Édition de la source d'un composant (en-tête / pied de page du site) dans le même éditeur ----------
  // Le composant est UNE section ; le modifier met à jour toutes les pages qui l'affichent (composant synchronisé : pas de
  // brouillon, enregistrement automatique). Mêmes routes que pour une page : rendu du canevas et enregistrement.
  const loadComponent = (req, res) => {
    const c = pages.getComponent(req.mk.ctx, Number(req.params.id));
    if (!c || !c.section) { res.status(404).render("error", { message: "Composant introuvable." }); return null; }
    return c;
  };
  // « page » de travail du composant : mêmes champs qu'une page pour l'éditeur et le rendu (aucune n'est enregistrée)
  const componentPage = (ctx, c) => {
    const site = c.site_id ? pages.getSite(ctx, c.site_id) : null;
    const role = site && site.header_component_id === c.id ? "header" : site && site.footer_component_id === c.id ? "footer" : c.variant_of ? "variant" : "component";
    return { id: `c${c.id}`, name: c.name, slug: "", title: c.name, description: "", status: "published", kind: "page", hasDraft: false, revision: 0, site_id: c.site_id, form_id: null, indexable: 0, archived_at: null, header_mode: "inherit",
      back: c.site_id ? `/marketing/site-web/sites/${c.site_id}#entete` : "/marketing/site-web/sites", working: { sections: [c.section], title: c.name, description: "", theme: pages.normalizeTheme({}), seo: {} }, role };
  };
  router.get("/site-web/composants/:id(\\d+)/editeur", need("forms.read"), (req, res) => {
    const c = loadComponent(req, res);
    if (!c) return;
    const page = componentPage(req.mk.ctx, c);
    openEditor(req, res, page, { component: { id: c.id, name: c.name, role: page.role } });
  });
  router.post("/site-web/composants/:id(\\d+)/rendu", need("forms.read"), (req, res, next) => {
    const c = loadComponent(req, res);
    if (!c) return;
    const ctx = req.mk.ctx;
    try {
      const page = componentPage(ctx, c);
      const content = pages.normalizeContent(ctx, page, (req.body && req.body.content) || {});
      res.set("Cache-Control", "no-store");
      res.render("marketing-public/landing", { page: landing.viewModel(ctx, { ...page, ...content, sections: pages.resolveSections(ctx, content.sections) }), site: c.site_id ? pages.getSite(ctx, c.site_id) : null, tokensToCss, form: null, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: [], renderMarkdown, error: null, values: {}, thanks: null, preview: true, previewLabel: null, builder: true });
    } catch (error) { jsonError(res, next, error); }
  });
  router.put("/site-web/composants/:id(\\d+)/brouillon", need("forms.write"), (req, res, next) => {
    const c = loadComponent(req, res);
    if (!c) return;
    const ctx = req.mk.ctx;
    try {
      const content = pages.normalizeContent(ctx, componentPage(ctx, c), (req.body && req.body.content) || {});
      if (content.sections.length !== 1) throw new MarketingError("invalid", "Ce composant est UNE seule section : gardez une seule section dans l'éditeur (placez tous les éléments dedans).");
      pages.updateComponent(ctx, c.id, { section: content.sections[0] });
      res.set("Cache-Control", "no-store").json({ revision: 0, savedAt: new Date().toISOString() });
    } catch (error) { jsonError(res, next, error); }
  });
  // Rendu du canevas : contenu de l'éditeur validé (rien n'est enregistré), même gabarit que la page publiée
  router.post("/pages/:id(\\d+)/rendu", need("forms.read"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    const ctx = req.mk.ctx;
    try {
      const content = pages.normalizeContent(ctx, page, (req.body && req.body.content) || {});
      const form = page.form_id ? forms.getForm(ctx, page.form_id) : null;
      res.set("Cache-Control", "no-store");
      res.render("marketing-public/landing", { page: shown(ctx, page, content), site: page.site_id ? pages.getSite(ctx, page.site_id) : null, tokensToCss, form, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: form ? forms.propertyFieldDefs(ctx.db, ctx.organizationId, form) : [], renderMarkdown, error: null, values: {}, thanks: null, preview: true, previewLabel: null, builder: true });
    } catch (error) { jsonError(res, next, error); }
  });
  // Sauvegarde automatique du brouillon (JSON) : jamais d'écrasement silencieux (révision), réponse = nouvelle révision
  router.put("/pages/:id(\\d+)/brouillon", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    try {
      const { revision } = pages.saveDraft(req.mk.ctx, page.id, (req.body && req.body.content) || {}, { revision: Number(req.body && req.body.revision) });
      res.set("Cache-Control", "no-store").json({ revision, savedAt: new Date().toISOString() });
    } catch (error) { jsonError(res, next, error); }
  });
  router.post("/pages/:id(\\d+)/publier.json", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    try {
      const { version } = pages.publish(req.mk.ctx, page.id);
      const p = pages.getPage(req.mk.ctx, page.id);
      res.json({ version, revision: p.revision, url: `/p/${p.slug}` });
    } catch (error) { jsonError(res, next, error); }
  });

  router.post("/pages/:id(\\d+)/publier", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}`, () => {
      const { version } = pages.publish(req.mk.ctx, page.id);
      return `Page en ligne (version ${version}) : /p/${page.slug}${page.indexable ? "" : " (non indexée par les moteurs de recherche)"}.`;
    });
  });
  router.post("/pages/:id(\\d+)/brouillon/abandonner", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}`, () => { pages.discardDraft(req.mk.ctx, page.id); return "Brouillon abandonné : l'éditeur affiche de nouveau la version en ligne."; });
  });
  router.post("/pages/:id(\\d+)/versions/:n(\\d+)/restaurer", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}`, () => {
      pages.restoreVersion(req.mk.ctx, page.id, Number(req.params.n));
      return `Version ${req.params.n} copiée dans le brouillon. La page en ligne n'a pas changé : vérifiez l'aperçu, puis publiez.`;
    });
  });
  router.post("/pages/:id(\\d+)/depublier", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}`, () => { pages.unpublish(req.mk.ctx, page.id); return "Page hors ligne : son adresse affiche « page indisponible »."; });
  });
  router.post("/pages/:id(\\d+)/depublier.json", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    try { pages.unpublish(req.mk.ctx, page.id); res.json({ ok: true, revision: pages.getPage(req.mk.ctx, page.id).revision }); } catch (error) { jsonError(res, next, error); }
  });
  router.post("/pages/:id(\\d+)/dupliquer", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    let copy = null;
    attempt(req, res, next, () => (copy ? `/marketing/pages/${copy.id}` : `/marketing/pages/${page.id}`), () => { copy = pages.duplicatePage(req.mk.ctx, page.id); return `Copie créée (hors ligne) : « ${copy.name} ».`; });
  });
  router.post("/pages/:id(\\d+)/archiver", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, "/marketing/pages", () => { pages.archivePage(req.mk.ctx, page.id); return `Page « ${page.name} » archivée (hors ligne). Ses statistiques et versions sont gardées.`; });
  });
  router.post("/pages/:id(\\d+)/restaurer", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}`, () => { pages.restorePage(req.mk.ctx, page.id); return "Page restaurée (hors ligne) : publiez-la quand elle est prête."; });
  });
  router.post("/pages/:id(\\d+)/supprimer", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, "/marketing/pages", () => { landing.deletePage(req.mk.ctx, page.id); return `Page « ${page.name} » supprimée, avec ses statistiques et ses versions.`; });
  });
  return router;
};
