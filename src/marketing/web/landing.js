// Pages (Site Web → Pages) : liste, éditeur par sections, brouillon et aperçu, publication, versions, rapport.
// Le contenu est enregistré dans le BROUILLON du moteur de pages ; « Publier » le met en ligne. Un seul formulaire par page : déplacer, supprimer ou ajouter une section ENREGISTRE aussi les
// modifications en cours (jamais de saisie perdue). Droits : ceux des formulaires d'inscription.
const express = require("express");
const cmsPages = require("../pages/cmsPages");
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
const ai = require("../ai");
const studio = require("../ai/studio");
const { AiError } = require("../../services/aiCore");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
// Réglages SEO : modifiés seulement avec la permission « seo.edit » (vérifiée ici, pas seulement masquée dans l'interface)
const sortedJson = (o) => JSON.stringify(Object.fromEntries(Object.entries(o || {}).sort(([a], [b]) => (a < b ? -1 : 1))));
function sameSeo(before, after) {
  try { return sortedJson(pages.normalizeSeo(before)) === sortedJson(pages.normalizeSeo(after)); } catch { return false; }
}
function guardSeo(req, before, after) {
  if (!req.mk.can("seo.edit") && !sameSeo(before, after)) throw new MarketingError("forbidden", "Vous n'avez pas la permission de modifier les réglages SEO (permission « seo.edit »).");
}
const STATUS_CLASS = { draft: "", published: "mk-status-ok", unpublished: "mk-status-warn" };

// Section vide mais VALIDE pour chaque type (une section ajoutée s'enregistre tout de suite)
function blankSection(ctx, type) { // ctx : médiathèque du site de la page (voir media.forSite)
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

const siteContent = require("../../services/siteContent");
const listBase = (siteId, principal = false) => (Number.isInteger(siteId) && siteId > 0 ? `/marketing/site-web/sites/${siteId}/pages` : principal ? "/marketing/site-web/principal/pages" : "/marketing/pages");

module.exports = () => {
  const router = express.Router();

  // Site Web → Pages : toutes les pages (liste à la manière de WordPress). Le site courant vient du serveur (ctx.siteScope / ctx.siteFilter), jamais du HTML :
  // un accès limité à un site ne voit que ce site, l'équipe qui a ouvert l'espace d'un site (adresse /sites/<id>/pages) ne voit que ses pages.
  router.get("/pages", need("forms.read"), (req, res) => {
    const ctx = req.mk.ctx;
    pages.promoteScheduledPages(ctx.db, { force: true });
    const siteId = siteContent.siteParam(ctx); // site courant (null = liste centrale de l'équipe)
    const principal = !siteId && ctx.siteFilter === "principal"; // espace du site principal : pages sans site, seulement
    // Ancien lien « ?vue=archivees » conservé : c'est la corbeille
    const state = req.query.vue === "archivees" ? "corbeille" : cmsPages.STATES.includes(req.query.etat) ? req.query.etat : "toutes";
    // Tri par colonne (?orderby=titre|auteur|date & order=asc|desc), validé par liste fermée ; l'ancien ?tri= reste accepté
    const byCol = ["titre", "auteur", "date"].includes(req.query.orderby) ? req.query.orderby : null;
    const tri = byCol || (Object.hasOwn(cmsPages.SORTS, req.query.tri) ? req.query.tri : "modifiee");
    const ordre = byCol ? (req.query.order === "asc" ? "asc" : req.query.order === "desc" ? "desc" : (byCol === "date" ? "desc" : "asc")) : req.query.ordre === "asc" || (tri === "titre" && req.query.ordre !== "desc") ? "asc" : "desc";
    const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(req.query.mois || "")) ? String(req.query.mois) : "";
    // Sélecteur « Site » de la liste centrale seulement : sur l'espace d'un site, la portée est celle du serveur (le paramètre « site » ne filtre rien de plus)
    const siteFilterParam = siteId || principal ? "" : String(req.query.site || "");
    const filters = { q: String(req.query.q || "").trim().slice(0, 80), site: siteFilterParam, auteur: String(req.query.auteur || ""), mois: month, tri, ordre };
    // Nombre de pages par liste : « Options de l'écran », mémorisé dans un cookie de l'administration (borné côté serveur)
    const cookiePar = /(?:^|;\s*)mk_pg_par=(\d{1,3})/.exec(req.headers.cookie || "");
    const perPage = cmsPages.clampPerPage(req.query.par || (cookiePar && cookiePar[1]) || cmsPages.PER_PAGE);
    if (req.query.par) res.cookie("mk_pg_par", String(perPage), { path: "/marketing", sameSite: "lax", httpOnly: true, maxAge: 365 * 864e5 });
    const result = cmsPages.queryPages(ctx, { state, q: filters.q, siteId: filters.site, authorId: filters.auteur, month, sort: filters.tri, dir: filters.ordre, page: req.query.page, perPage });
    res.render("marketing/landing-list", { layoutFormats: require("../pages/layoutFormat").FORMATS, newPageOpen: req.query.nouvelle === "1",
      title: "Pages", active: "landing", state, filters, result, pages: result.rows, perPage, months: cmsPages.months(ctx, state), authors: cmsPages.authorsOfPages(ctx), sites: siteId || principal ? [] : pages.listSites(ctx), moveSites: pages.listSites(ctx), templates: require("../pages/templates").catalog(),
      userTemplates: pages.listPageTemplates(ctx, siteId ? { siteId } : principal ? { siteId: null } : undefined), canWrite: req.mk.can("forms.write"), canPublish: req.mk.can("pages.publish"), canDelete: req.mk.can("pages.delete"), cmsPagesJs: true, cmsArticlesJs: true,
      fixedSite: siteId ? { id: siteId } : principal ? { id: null } : null, listBase: listBase(siteId, principal),
      STATUSES: landing.STATUSES, STATUS_CLASS, KINDS: pages.KINDS,
    });
  });
  // Liste des pages « de retour » : celle de l'ESPACE DU SITE de la page (jamais la liste centrale, qui est celle du principal) ; sans site : la liste centrale, comme avant
  const pagesHome = (siteId) => (Number.isInteger(siteId) && siteId > 0 ? `/marketing/site-web/sites/${siteId}/pages` : "/marketing/pages");
  // PAGES-02 — « Créer et ouvrir l'éditeur » : la page est créée UNE SEULE FOIS (jeton d'idempotence du formulaire : double clic, requête répétée, nouvelle tentative = la même page), en un bloc
  // atomique (aucune page orpheline si le modèle est refusé), dans le site vérifié par le serveur, en BROUILLON ; puis on ouvre l'éditeur du mode choisi (visuel, ou édition par sections).
  const createdOnce = new Map(); // `${compte}:${jeton}` → identifiant de la page (processus unique ; purgé au-delà de 500 entrées)
  const TOKEN = /^[A-Za-z0-9_-]{16,64}$/;
  const MODES = { editeur: (id) => `/marketing/pages/${id}/editeur?retour=pages`, fiche: (id) => `/marketing/pages/${id}` };
  // Adresse de retour vers la liste après une action : celle fournie par la liste si elle a la forme d'une liste de pages (jamais une adresse libre), sinon la liste du site de la page
  const LIST_BACK = /^\/marketing\/(?:pages|site-web\/principal\/pages|site-web\/sites\/\d{1,12}\/pages)(?:\?[A-Za-z0-9_=&%.+\-]*)?$/;
  const listBack = (req, siteId, fallback) => (LIST_BACK.test(String(req.body.retour || "")) ? req.body.retour : fallback !== undefined ? fallback : pagesHome(siteId));
  router.post("/pages", need("forms.write"), (req, res, next) => {
    let created = null;
    const mode = req.body.ouvrir === undefined ? null : String(req.body.ouvrir);
    const toBuilder = mode === "editeur";
    attempt(req, res, next, () => (created ? (MODES[mode] ? MODES[mode](created.id) : `/marketing/pages/${created.id}`) : pagesHome(req.mk.site ? req.mk.site.id : null)), () => {   // échec : retour à l'espace du site vérifié par le serveur
      if (mode !== null && !MODES[mode]) throw new MarketingError("invalid_field", "Mode d'édition inconnu : choisissez l'éditeur visuel ou l'édition par sections. Aucune page n'a été créée.");
      const token = TOKEN.test(String(req.body.request_id || "")) ? `${req.session.user.id}:${req.body.request_id}` : null;
      if (token && createdOnce.has(token)) {   // nouvelle tentative du MÊME formulaire : on rouvre la page déjà créée, sans en créer une seconde
        const row = req.mk.ctx.db.prepare("SELECT id, site_id FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(createdOnce.get(token), req.mk.ctx.organizationId);
        if (row && (!Number.isInteger(req.mk.ctx.siteScope) || row.site_id === req.mk.ctx.siteScope)) { created = row; return "Cette page a déjà été créée : la voici."; }
        createdOnce.delete(token);
      }
      const siteId = intOrNull(req.body.site_id);
      const template = typeof req.body.template === "string" && req.body.template ? req.body.template : null;
      // Nouvelle page du CMS : une page de site (bandeau + texte, publiable tout de suite) ; sans « ouvrir », comportement historique (page d'atterrissage)
      // La mise en page guidée est un réglage de l'éditeur visuel : elle n'est pas appliquée (ni annoncée) quand on ouvre l'édition par sections
      const layout = toBuilder && req.body.layoutMode === "guided" ? { mode: "guided", format: req.body.layoutFormat, maxWidth: req.body.layoutMax, gutter: req.body.layoutGutter, locked: req.body.layoutLocked === "1" } : null;
      created = pages.createPage(req.mk.ctx, { name: req.body.name, siteId, kind: siteId || mode ? "page" : "landing", template, layout, blank: toBuilder && !template });
      if (token) { createdOnce.set(token, created.id); if (createdOnce.size > 500) createdOnce.delete(createdOnce.keys().next().value); }
      return template ? "Page créée à partir du modèle (brouillon) : remplacez les textes entre crochets dans l'éditeur, puis publiez-la." : "Page créée (brouillon) : composez-la, puis publiez-la.";
    });
  });
  // Nommage à la création (éditeur) : contrôle en direct du nom (mêmes règles que la création et le renommage) puis création JSON, sans passer par la liste des pages
  router.get("/pages/nom.json", need("forms.write"), (req, res, next) => {
    try { res.set("Cache-Control", "no-store").json({ ok: true, name: landing.checkName(req.mk.ctx, req.query.name, { exceptId: intOrNull(req.query.except) }) }); }
    catch (error) { if (error instanceof MarketingError) return res.set("Cache-Control", "no-store").json({ ok: false, code: error.code, message: error.message }); next(error); }
  });
  router.post("/pages/:id(\\d+)/renommer.json", need("forms.write"), (req, res, next) => {
    try { const p = landing.renamePage(req.mk.ctx, intOrNull(req.params.id), (req.body || {}).name); res.json({ page: { id: p.id, name: p.name, slug: p.slug } }); }
    catch (error) { jsonError(res, next, error); }
  });
  router.post("/pages/creer.json", need("forms.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      const siteId = intOrNull(b.siteId);
      const template = typeof b.template === "string" && b.template ? b.template : null;
      const layout = b.layout && typeof b.layout === "object" && b.layout.mode === "guided" ? b.layout : null;
      const page = pages.createPage(req.mk.ctx, { name: b.name, siteId, kind: "page", template, layout, blank: !template });
      res.status(201).json({ page: { id: page.id, name: page.name, slug: page.slug }, url: `/marketing/pages/${page.id}/editeur?retour=pages` });
    } catch (error) { jsonError(res, next, error); }
  });
  // Actions groupées de la liste (publier, mettre hors ligne, corbeille, restaurer, supprimer définitivement) : droits vérifiés par action
  router.post("/pages/actions", need("forms.write"), (req, res, next) => {
    const ctx = req.mk.ctx;
    const action = String(req.body.action || req.body.action2 || ""); // action2 : la barre du bas du tableau
    const needs = { publier: "pages.publish", depublier: "pages.publish", corbeille: "forms.write", restaurer: "forms.write", supprimer: "pages.delete" }[action];
    if (!needs || !req.mk.can(needs)) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    // Site de l'opération : celui de la requête vérifié par le serveur (accès limité), sinon le champ « site » (site courant de la liste), validé : jamais une page d'un autre site
    const rawSite = String(req.body.site || req.query.site || "");
    const siteLimit = Number.isInteger(ctx.siteScope) ? ctx.siteScope : /^\d{1,12}$/.test(rawSite) ? Number(rawSite) : rawSite === "principal" ? null : undefined;
    const back = LIST_BACK.test(String(req.body.retour || "")) ? req.body.retour : listBase(Number.isInteger(siteLimit) ? siteLimit : null, siteLimit === null);
    // Message propre aux actions groupées : une erreur ici ne rouvre pas la fenêtre « Nouvelle page » (noReopen)
    const flash = (type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; res.redirect(back); };
    try {
      const r = cmsPages.bulk(ctx, action, req.body.ids, {
        publish: (id) => pages.publish(ctx, id), unpublish: (id) => landing.unpublishPage(ctx, id), archive: (id) => pages.archivePage(ctx, id),
        restore: (id) => pages.restorePage(ctx, id), remove: (id) => landing.deletePage(ctx, id),
      }, (row) => (typeof ctx.canOn === "function" ? ctx.canOn(row.site_id ?? null, needs) : true), { siteLimit }); // droit vérifié sur le site de CHAQUE page (plafond de droits compris)
      const n = r.done.length;
      const head = n ? `${n} page${n > 1 ? "s" : ""} ${r.label[n > 1 ? 1 : 0]}.` : "";
      const detail = r.failed.map((f) => `« ${f.name} » : ${f.message}`).join(" · ");
      if (!r.failed.length) return flash("ok", head);
      if (!n) return flash("error", "Aucune page n'a pu être traitée.", detail);
      flash("ok", `${head} ${r.failed.length} refusée${r.failed.length > 1 ? "s" : ""}.`, detail);
    } catch (error) {
      if (!(error instanceof MarketingError)) return next(error);
      flash("error", error.message);
    }
  });

  const load = (req, res) => {
    const p = pages.getPage(req.mk.ctx, intOrNull(req.params.id));
    if (!p) res.status(404).render("error", { message: "Page introuvable." });
    return p;
  };
  // Modification rapide (liste) : titre, adresse et état (brouillon / publié) d'UNE page, sans ouvrir l'éditeur. Mêmes services que la fiche de la page
  // (saveSettings : nom unique, adresse valide et libre, redirection de l'ancienne adresse d'une page en ligne ; publish / unpublish : contrôles de publication).
  // Droits vérifiés ici : écrire pour le titre et l'adresse ; « pages.publish » pour changer l'état.
  router.post("/pages/:id(\\d+)/modification-rapide", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    const wants = ["draft", "published"].includes(req.body.status) ? req.body.status : null;
    const wantsChange = wants && ((wants === "published") !== (page.status === "published"));
    if (wantsChange && !req.mk.can("pages.publish")) return res.status(403).render("error", { message: "Vous n'avez pas la permission de publier ou de retirer une page." });
    if (page.archived_at) { req.session.mkFlash = { type: "error", text: "Cette page est dans la corbeille : restaurez-la avant de la modifier." }; return res.redirect(listBack(req, page.site_id)); }
    attempt(req, res, next, listBack(req, page.site_id), () => {
      const ctx = req.mk.ctx;
      const slugGiven = String(req.body.slug ?? "").trim();
      landing.saveSettings(ctx, page.id, { name: req.body.title, slug: slugGiven || page.slug, formId: page.form_id, tags: page.tags, indexable: page.indexable });
      if (wantsChange) { if (wants === "published") pages.publish(ctx, page.id); else pages.unpublish(ctx, page.id); }
      return `« ${pages.getPage(ctx, page.id).name} » mise à jour.`;
    });
  });
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
  const shown = (ctx, page, content) => landing.viewModel(ctx, { ...page, ...content, scope: require("./themeRender").previewScope(ctx.db, ctx, page), sections: pages.withSiteParts(ctx, page, pages.resolveSections(ctx, content.sections)) });

  router.get("/pages/:id(\\d+)", need("forms.read"), (req, res) => {
    const page = load(req, res);
    if (!page) return;
    const { ctx } = req.mk;
    res.render("marketing/landing", {
      title: page.name, active: "landing", page, content: page.working, STATUSES: landing.STATUSES, STATUS_CLASS, SECTION_LABELS: Object.fromEntries(Object.entries(pages.TYPES).map(([k, t]) => [k, t.label])),
      forms: forms.listForms(ctx), courses: listCourses(ctx), images: media.listMedia(media.forSite(ctx, page.site_id), { kind: "image", limit: 100 }).items, // médiathèque DU site de la page
      pagesHome: pagesHome(page.site_id), sites: pages.listSites(ctx), versions: pages.listVersions(ctx, page.id), inFunnels: require("../funnels").funnelsOfPage(ctx, page.id),
      variantOf: ctx.db.prepare("SELECT t.id, t.page_id, p.name FROM mk_page_tests t JOIN mk_landing_pages p ON p.id = t.page_id WHERE t.variant_page_id = ? AND t.organization_id = ?").get(page.id, ctx.organizationId) || null,
      openTest: ctx.db.prepare("SELECT id, name, status FROM mk_page_tests WHERE page_id = ? AND organization_id = ? AND status IN ('draft', 'running', 'stopped')").get(page.id, ctx.organizationId) || null,
      report: landing.pageReport(ctx, page.id), check: landing.preflight(ctx, { ...page, sections: pages.resolveSections(ctx, page.working.sections) }), canWrite: req.mk.can("forms.write"),
      publicUrl: `${String(process.env.SITE_URL || "").replace(/\/+$/, "")}/p/${page.slug}`,
      parents: cmsPages.parentChoices(ctx, page), canDelete: req.mk.can("pages.delete"),
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
  // SEO de la page (palier 11) : aperçu dans les résultats de recherche et analyse. Même moteur que la page publique
  // (seo/webPages.js) ; les champs envoyés par l'éditeur (non enregistrés) remplacent ceux du brouillon pour l'aperçu.
  // `analyse: true` rend en plus le brouillon ENREGISTRÉ pour lire ses titres, images et liens réels.
  router.post("/pages/:id(\\d+)/seo/analyse", need("forms.read"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    if (!req.mk.can("seo.view")) return res.status(403).json({ error: { code: "forbidden", message: "Vous n'avez pas la permission de voir l'analyse SEO (permission « seo.view »)." } });
    try {
      const ctx = req.mk.ctx;
      const body = req.body || {};
      const site = page.site_id ? pages.getSite(ctx, page.site_id) : null;
      const seo = body.seo ? pages.normalizeSeo(body.seo) : page.working.seo;
      const title = typeof body.title === "string" ? body.title.slice(0, 200) : page.working.title;
      const description = typeof body.description === "string" ? body.description.slice(0, 400) : page.working.description;
      const working = { ...page, title, description, seo: JSON.stringify(seo), sections: page.working.sections };
      const seoWeb = require("../../seo/webPages");
      const done = (html) => {
        const result = seoWeb.analyze(req, { page: working, site, html });
        res.set("Cache-Control", "no-store").json(result);
      };
      if (body.analyse !== true) return done("");
      // Rendu réel du brouillon (sans l'enregistrer ni compter de visite) : la même page que l'aperçu
      const form = page.form_id ? forms.getForm(ctx, page.form_id) : null;
      res.render("marketing-public/landing", { page: shown(ctx, page, { ...page.working, title, description, seo }), site, tokensToCss, form, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: form ? forms.propertyFieldDefs(ctx.db, ctx.organizationId, form) : [], renderMarkdown, error: null, values: {}, thanks: null, preview: true, previewLabel: null }, (error, html) => {
        if (error) return next(error);
        const main = (html.match(/<main[\s\S]*?<\/main>/i) || [html])[0];
        done(main);
      });
    } catch (error) { jsonError(res, next, error); }
  });
  // Aperçu d'un état d'historique du brouillon (palier 10) : consultation seulement, la page n'est pas modifiée
  router.get("/pages/:id(\\d+)/revisions/:rid(\\d+)/apercu", need("forms.read"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    if (!req.mk.can("revisions.view")) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    let content;
    try { content = require("../../services/revisions").adapter("page").content(req.mk.ctx, page.id, `r:${req.params.rid}`); } catch (error) { return res.status(404).render("error", { message: error.message }); }
    renderPreview(req, res, page, content, "État d'historique du brouillon — consultation seulement.");
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
        sections.push(blankSection(media.forSite(req.mk.ctx, page.site_id), m[1]));
        anchor = `#section-${sections.length - 1}`;
      }
      const ctx = req.mk.ctx;
      landing.saveSettings(ctx, page.id, { name: b.name, slug: b.slug, formId: b.form_id, tags: b.tags, indexable: b.indexable === "on" });
      const siteId = intOrNull(b.site_id);
      // Déplacer une page vers un autre site (ou vers le site principal) exige les droits d'écriture SUR le site de destination, vérifiés côté serveur
      if (b.site_id !== undefined && siteId !== page.site_id && !ctx.canOn(siteId, "forms.write")) throw new MarketingError("forbidden", "Vous n'avez pas accès au site de destination : la page n'a pas été déplacée.");
      if (b.site_id !== undefined && siteId !== page.site_id) pages.movePage(ctx, page.id, siteId);
      // Page parente (hiérarchie préparée) : un changement de site retire d'abord le lien avec l'ancien parent
      if (b.site_id !== undefined && siteId !== page.site_id) cmsPages.setParent(ctx, page.id, null);
      if (b.parent_id !== undefined) cmsPages.setParent(ctx, page.id, intOrNull(b.parent_id));
      const nextContent = contentFromBody(b, sections, page.working);
      guardSeo(req, page.working.seo, nextContent.seo);
      pages.saveDraft(ctx, page.id, nextContent, { revision: Number(b.revision) });
      const text = action.startsWith("add:") ? "Section ajoutée." : action.startsWith("remove:") ? "Section supprimée." : action.startsWith("up:") || action.startsWith("down:") ? "Section déplacée." : b.sections ? "Brouillon enregistré." : "Réglages enregistrés.";
      if (!b.sections) return page.status === "published" ? "Réglages enregistrés. Adresse, site, formulaire et étiquettes s'appliquent tout de suite ; titre, description et SEO sont dans le brouillon : « Publier les modifications » les met en ligne." : text;
      return page.status === "published" ? `${text} La page en ligne n'a pas changé : cliquez sur « Publier les modifications » pour la mettre à jour.` : text;
    });
  });
  // ---------- Éditeur visuel ----------
  // Erreur métier en JSON : conflit (autre onglet) 409, introuvable 404, contenu invalide 422 (message précis)
  const jsonError = (res, next, error) => {
    if (!(error instanceof MarketingError)) return next(error);
    res.status(error.code === "conflict" ? 409 : error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : 422).json({ error: { code: error.code, message: error.message } });
  };
  // Éditeur ouvert sur une page (component = null) ou sur la SOURCE d'un composant du site : en-tête, pied de page…
  const openEditor = (req, res, page, { component = null } = {}) => {
    const { ctx } = req.mk;
    const site = page.site_id ? pages.getSite(ctx, page.site_id) : null;
    const nodesLib = require("../pages/nodes");
    const form = page.form_id ? forms.getForm(ctx, page.form_id) : null;
    const funnel = component ? null : require("../funnels").funnelsOfPage(ctx, page.id).find((f) => f.status === "active") || null;
    const boot = {
      page: { breakpoints: require("../pages/siteSettings").breakpointsOf(site && site.settings), id: page.id, name: page.name, slug: page.slug, status: page.status, hasDraft: page.hasDraft, revision: page.revision, siteId: page.site_id, siteName: site ? site.name : null,
        customColors: site ? site.tokens.customColors.map((c) => ({ key: c.key, label: c.label })) : [], siteClasses: site && site.settings ? site.settings.classes || [] : [], siteSettingsUrl: site ? `/marketing/site-web/sites/${site.id}/reglages.json` : null, formId: page.form_id, formName: form ? form.name : null, formPublished: Boolean(form && form.status === "published"), indexable: Boolean(page.indexable), funnel: funnel ? { id: funnel.id, name: funnel.name, position: funnel.position } : null,
        abTest: component ? null : (ctx.db.prepare("SELECT id, page_id FROM mk_page_tests WHERE variant_page_id = ? AND organization_id = ?").get(page.id, ctx.organizationId)) || null,
        // Édition d'un composant : adresses de l'éditeur propres au composant (rendu, enregistrement) et retour à la fiche du site
        ...(component ? { base: `/marketing/site-web/composants/${component.id}`, component: { id: component.id, name: component.name, role: component.role, kind: component.kind, hasDraft: component.hasDraft, version: component.version, instances: pages.componentInstances(ctx, component.id).reduce((n, p) => n + p.count, 0) } } : {}) },
      content: page.working, types: blanks(media.forSite(ctx, page.site_id)), spec: nodesLib.editorSpec(), canWrite: req.mk.can("forms.write"),
      // Permissions exigées par certains widgets (cadenas de la bibliothèque ; revérifiées à l'enregistrement)
      perms: { "pages.code": req.mk.can("pages.code") },
      // Formulaires proposés au widget « Formulaire » (état réel : un brouillon ne s'affiche pas sur la page)
      forms: require("../forms").listForms(ctx).map((f) => ({ id: f.id, name: f.name, status: f.status })),
      blocks: require("../pages/patterns").catalog(ctx).concat(require("../../services/appearance").patternBlocks(page.site_id ?? null)),
      courses: listCourses(ctx).map((c) => ({ id: c.id, title: c.title })),
      components: pages.listComponents(ctx, { siteId: page.site_id }).map((c) => ({ id: c.id, name: c.name, global: c.global, kind: c.kind, hasDraft: c.hasDraft, version: c.version, blocks: c.blocks, type: c.section && c.section.type, uses: pages.componentInstances(ctx, c.id).reduce((n, p) => n + p.count, 0) })),
      // Modèles de pages de l'équipe (onglet Blocs : insérables dans la page en cours)
      // Écran d'accueil / création guidée : registre des types et gabarits intégrés, pages récemment modifiées (données réelles)
      pageCatalog: component ? null : require("../pages/pageTypes").catalog(ctx), recentPages: component ? [] : pages.recentPages(ctx, { exceptId: page.id }),
      templates: pages.listPageTemplates(ctx, { siteId: page.site_id ?? null }).map((t) => ({ id: t.id, name: t.name, category: t.category, sections: t.content.sections.length })),
      // Adresses proposées pour les liens : pages en ligne, pages du site, étape suivante (page d'un tunnel)
      links: [{ url: "/catalogue", label: "Catalogue des formations" }, { url: "/blog", label: "Blog" }, { url: "/", label: "Accueil du site" }]
        .concat(funnel ? [{ url: require("../funnels").NEXT_URL, label: `Étape suivante du tunnel « ${funnel.name} »` }, ...require("../funnels").getFunnel(ctx, funnel.id).steps.filter((x) => x.pageId !== page.id).map((x) => ({ url: `/etape/${x.id}`, label: `Étape « ${x.name} » du tunnel « ${funnel.name} »` }))] : [])
        .concat(pages.listPages(ctx).filter((p) => p.status === "published" && p.id !== page.id).slice(0, 50).map((p) => ({ url: `/p/${p.slug}`, label: `Page « ${p.name} »` }))),
      siteUrl: String((site && site.settings && site.settings.seo && site.settings.seo.publicUrl) || process.env.SITE_URL || "").replace(/\/+$/, ""),
      // SEO (palier 11) : droits réels (revérifiés à l'enregistrement) et adresses du service SEO
      layoutFormats: (({ FORMATS, PROTECTED, PROTECTED_LABELS }) => ({ formats: FORMATS, protected: PROTECTED, labels: PROTECTED_LABELS }))(require("../pages/layoutFormat")),
      seo: { canView: req.mk.can("seo.view"), canEdit: req.mk.can("seo.edit"), url: component ? null : `/marketing/pages/${page.id}/seo/analyse` },
      tags: require("../audience/tags").listTags(ctx).map((t) => t.name),
    };
    res.set("Cache-Control", "no-store");
    const { ICONS } = require("../../utils/icons");
    res.render("marketing/page-builder", { title: `Éditeur — ${page.name}`, embedded: req.query.cadre === "1", page, backTo: !component && req.query.retour === "pages" ? pagesHome(page.site_id) : null, sitesHome: req.mk.siteOnly ? "/marketing/site-web/mes-sites" : "/marketing/site-web/sites", boot: safeJson(boot), spec: boot.spec, iconExists: (n) => Object.hasOwn(ICONS, n) });
  };
  // ---------- IA Kolakisa : l'IA PROPOSE, l'éditeur applique (une étape d'historique) — rien n'est enregistré ici ----------
  const IA_STATUS = { not_configured: 503, quota: 429, rate: 429, conflict: 409, busy: 429 };
  const iaError = (res, next, error) => {
    if (error instanceof AiError || error instanceof MarketingError) return res.status(IA_STATUS[error.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: error.message, code: error.code });
    next(error);
  };
  router.get("/pages/:id(\\d+)/ia/etat", need("forms.read"), (req, res) => {
    res.set("Cache-Control", "no-store").json({ configured: ai.getAiSettings(req.mk.ctx).configured, canWrite: req.mk.can("forms.write") });
  });
  router.post("/pages/:id(\\d+)/ia/proposer", need("forms.write"), async (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    try { res.set("Cache-Control", "no-store").json(await studio.propose(req.mk.ctx, page.id, req.body || {})); } catch (error) { iaError(res, next, error); }
  });
  // Analyse responsive : le navigateur mesure le rendu réel ; les corrections sont calculées par des règles (aucune clé IA nécessaire)
  router.post("/pages/:id(\\d+)/ia/responsive", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    try { res.set("Cache-Control", "no-store").json(studio.responsiveFixes(req.mk.ctx, page.id, req.body || {})); } catch (error) { iaError(res, next, error); }
  });
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
      back: c.site_id ? `/marketing/site-web/sites/${c.site_id}/reglages#entete` : "/marketing/site-web/sites", working: { sections: [c.draft || c.section], title: c.name, description: "", theme: pages.normalizeTheme({}), seo: {} }, role };
  };
  router.get("/site-web/composants/:id(\\d+)/editeur", need("forms.read"), (req, res) => {
    const c = loadComponent(req, res);
    if (!c) return;
    const page = componentPage(req.mk.ctx, c);
    openEditor(req, res, page, { component: { id: c.id, name: c.name, role: page.role, kind: c.kind, hasDraft: c.hasDraft, version: c.version } });
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
      // Composant ordinaire : copie de travail (aucun effet sur les pages avant « Mettre à jour ») ; en-tête, pied de page et variantes du site : application directe, comme avant
      const direct = c.variant_of || (c.site_id && ((pages.getSite(ctx, c.site_id) || {}).header_component_id === c.id || (pages.getSite(ctx, c.site_id) || {}).footer_component_id === c.id));
      if (direct) pages.updateComponent(ctx, c.id, { section: content.sections[0] });
      else pages.saveComponentDraft(ctx, c.id, content.sections[0]);
      res.set("Cache-Control", "no-store").json({ revision: 0, savedAt: new Date().toISOString(), draft: !direct });
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
      const content = (req.body && req.body.content) || {};
      guardSeo(req, page.working.seo, content.seo);
      const { revision, warnings } = pages.saveDraft(req.mk.ctx, page.id, content, { revision: Number(req.body && req.body.revision) });
      res.set("Cache-Control", "no-store").json({ revision, savedAt: new Date().toISOString(), ...(warnings && warnings.length ? { warnings } : {}) });
    } catch (error) { jsonError(res, next, error); }
  });
  router.post("/pages/:id(\\d+)/publier.json", need("pages.publish"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    try {
      const { version } = pages.publish(req.mk.ctx, page.id);
      const p = pages.getPage(req.mk.ctx, page.id);
      res.json({ version, revision: p.revision, url: `/p/${p.slug}` });
    } catch (error) { jsonError(res, next, error); }
  });

  router.post("/pages/:id(\\d+)/publier", need("pages.publish"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, listBack(req, page.site_id, `/marketing/pages/${page.id}`), () => {
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
  // Programmation (palier 23) : la date est saisie en heure locale (champ « local ») ; le navigateur joint son décalage horaire en minutes (« offset »)
  router.post("/pages/:id(\\d+)/programmer", need("pages.publish"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}`, () => {
      const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(req.body.local || ""));
      const offset = Number(req.body.offset);
      if (!m || !Number.isInteger(offset) || Math.abs(offset) > 840) throw new (require("../errors").MarketingError)("invalid_field", "Date de programmation invalide.");
      const utc = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) + offset * 60000).toISOString().slice(0, 19).replace("T", " ");
      pages.schedulePage(req.mk.ctx, page.id, utc);
      return "Publication programmée : la page sera mise en ligne à la première visite du site après l'heure choisie.";
    });
  });
  router.post("/pages/:id(\\d+)/programmer/annuler", need("pages.publish"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}`, () => { pages.cancelSchedule(req.mk.ctx, page.id); return "Programmation annulée : la page reste hors ligne."; });
  });
  router.post("/pages/:id(\\d+)/depublier", need("pages.publish"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, listBack(req, page.site_id, `/marketing/pages/${page.id}`), () => { pages.unpublish(req.mk.ctx, page.id); return "Page hors ligne : son adresse affiche « page indisponible »."; });
  });
  router.post("/pages/:id(\\d+)/depublier.json", need("pages.publish"), (req, res, next) => {
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
  // Déplacer une page vers un autre site (ou le site principal) : droit d'écrire sur la page (garde de la route) ET sur le site d'arrivée ; équipe seulement pour le site principal
  router.post("/pages/:id(\\d+)/deplacer", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}`, () => {
      const raw = req.body.site_id;
      const target = raw === undefined || raw === "" ? null : intOrNull(raw);
      if (raw !== undefined && raw !== "" && target === null) throw new MarketingError("invalid_field", "Site de destination invalide.");
      if (req.mk.siteOnly && target === null) throw new MarketingError("forbidden", "Le site principal est réservé à l'équipe de l'organisation.");
      if (typeof req.mk.ctx.canOn === "function" && !req.mk.ctx.canOn(target, "forms.write")) throw new MarketingError("forbidden", "Vous ne pouvez pas écrire dans le site de destination.");
      // Les droits sur la page source (garde de la route) et sur le site d'arrivée (ci-dessus) sont établis : la portée « un seul site » de la requête est levée pour CE déplacement seulement,
      // afin qu'une personne autorisée sur deux sites puisse déplacer de l'un à l'autre (sans cela, le service refuse tout site autre que celui de la requête)
      const sourceOk = typeof req.mk.ctx.canOn !== "function" || req.mk.ctx.canOn(page.site_id ?? null, "forms.write");
      if (!sourceOk) throw new MarketingError("forbidden", "Vous ne pouvez pas écrire dans le site de cette page.");
      const moveCtx = Number.isInteger(req.mk.ctx.siteScope) ? { ...req.mk.ctx, siteScope: undefined } : req.mk.ctx;
      pages.movePage(moveCtx, page.id, target);
      return `Page « ${page.name} » déplacée.`;
    });
  });
  router.post("/pages/:id(\\d+)/archiver", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, listBack(req, page.site_id), () => { pages.archivePage(req.mk.ctx, page.id, { detach: req.body.detacher === "on" }); return `Page « ${page.name} » archivée (hors ligne). Ses statistiques et versions sont gardées.`; });
  });
  router.post("/pages/:id(\\d+)/restaurer", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, listBack(req, page.site_id, `/marketing/pages/${page.id}`), () => { pages.restorePage(req.mk.ctx, page.id); return "Page restaurée (hors ligne) : publiez-la quand elle est prête."; });
  });
  // Suppression DÉFINITIVE : administrateur seulement, et seulement depuis la corbeille (une page n'est jamais effacée d'un seul clic)
  router.post("/pages/:id(\\d+)/supprimer", need("pages.delete"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    if (!page.archived_at) { req.session.mkFlash = { type: "error", text: "Mettez d'abord la page à la corbeille : elle ne peut être supprimée définitivement que depuis la corbeille." }; return res.redirect(`/marketing/pages/${page.id}`); }
    attempt(req, res, next, listBack(req, page.site_id), () => { landing.deletePage(req.mk.ctx, page.id, { detach: req.body.detacher === "on" }); return `Page « ${page.name} » supprimée, avec ses statistiques et ses versions.`; });
  });
  return router;
};
