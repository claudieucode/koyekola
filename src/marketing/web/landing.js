// Pages d'atterrissage dans Marketing (Campagnes → Pages d'atterrissage) : liste, éditeur par sections, aperçu,
// publication, rapport. Un seul formulaire par page : déplacer, supprimer ou ajouter une section ENREGISTRE aussi les
// modifications en cours (jamais de saisie perdue). Droits : ceux des formulaires d'inscription.
const express = require("express");
const landing = require("../landing");
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

module.exports = () => {
  const router = express.Router();

  router.get("/pages", need("forms.read"), (req, res) => {
    res.render("marketing/landing-list", { title: "Pages d'atterrissage", active: "landing", pages: landing.listPages(req.mk.ctx), STATUSES: landing.STATUSES, STATUS_CLASS });
  });
  router.post("/pages", need("forms.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => (created ? `/marketing/pages/${created.id}` : "/marketing/pages"), () => {
      created = landing.createPage(req.mk.ctx, { name: req.body.name });
      return "Page créée (brouillon) : composez-la, choisissez son formulaire d'inscription, puis publiez-la.";
    });
  });

  const load = (req, res) => {
    const p = landing.getPage(req.mk.ctx, intOrNull(req.params.id));
    if (!p) res.status(404).render("error", { message: "Page introuvable." });
    return p;
  };
  router.get("/pages/:id(\\d+)", need("forms.read"), (req, res) => {
    const page = load(req, res);
    if (!page) return;
    const { ctx } = req.mk;
    res.render("marketing/landing", {
      title: page.name, active: "landing", page, STATUSES: landing.STATUSES, STATUS_CLASS, SECTION_TYPES: landing.SECTION_TYPES,
      forms: forms.listForms(ctx), courses: listCourses(ctx), images: media.listMedia(ctx, { kind: "image", limit: 100 }).items,
      report: landing.pageReport(ctx, page.id), check: landing.preflight(ctx, page), canWrite: req.mk.can("forms.write"),
      publicUrl: `${String(process.env.SITE_URL || "").replace(/\/+$/, "")}/p/${page.slug}`,
    });
  });
  // Aperçu du brouillon (même rendu que la page publique ; clics et inscriptions non enregistrés)
  router.get("/pages/:id(\\d+)/apercu", need("forms.read"), (req, res) => {
    const page = load(req, res);
    if (!page) return;
    const ctx = req.mk.ctx;
    const form = page.form_id ? forms.getForm(ctx, page.form_id) : null;
    res.set("Cache-Control", "no-store");
    res.render("marketing-public/landing", { page: landing.viewModel(ctx, page), form, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: form ? forms.propertyFieldDefs(ctx.db, ctx.organizationId, form) : [], renderMarkdown, error: null, values: {}, thanks: null, preview: true });
  });

  // Enregistrer (+ éventuellement : monter / descendre / supprimer / ajouter une section)
  router.post("/pages/:id(\\d+)", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    const b = req.body;
    let anchor = "";
    attempt(req, res, next, () => `/marketing/pages/${page.id}${anchor}`, () => {
      const sections = sectionsFromBody(b);
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
      landing.savePage(req.mk.ctx, page.id, {
        name: b.name, slug: b.slug, title: b.title, description: b.description, sections, formId: b.form_id,
        tags: b.tags, indexable: b.indexable === "on", theme: { accent: b.theme_accent, background: b.theme_background, text: b.theme_text },
      });
      const text = action.startsWith("add:") ? "Section ajoutée." : action.startsWith("remove:") ? "Section supprimée." : action.startsWith("up:") || action.startsWith("down:") ? "Section déplacée." : "Page enregistrée.";
      return page.status === "published" ? `${text} La page en ligne est à jour.` : text;
    });
  });
  router.post("/pages/:id(\\d+)/publier", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}`, () => { const p = landing.publishPage(req.mk.ctx, page.id); return `Page en ligne : /p/${p.slug}${p.indexable ? "" : " (non indexée par les moteurs de recherche)"}.`; });
  });
  router.post("/pages/:id(\\d+)/depublier", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}`, () => { landing.unpublishPage(req.mk.ctx, page.id); return "Page hors ligne : son adresse affiche « page indisponible »."; });
  });
  router.post("/pages/:id(\\d+)/supprimer", need("forms.write"), (req, res, next) => {
    const page = load(req, res);
    if (!page) return;
    attempt(req, res, next, "/marketing/pages", () => { landing.deletePage(req.mk.ctx, page.id); return `Page « ${page.name} » supprimée, avec ses statistiques.`; });
  });
  return router;
};
