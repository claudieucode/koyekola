// KOLAKISA CMS → Apparence → Éditeur du site (palier 8) : styles globaux, modèles (templates), patterns,
// aperçu (bureau / tablette / mobile avec le vrai rendu du site) et publication. Le Page Builder reste le moteur visuel : les
// modèles et les patterns sont des pages / sections du Page Builder ; ici on les affecte, on les range et on les publie.
// Droits : appearance.read (voir) · appearance.styles / .parts / .templates / .patterns (éditeur) · appearance.publish (administrateur).
const express = require("express");
const appearance = require("../../services/appearance");
const navigation = require("../../services/navigation");
const taxonomy = require("../../services/taxonomy");
const tokensLib = require("../pages/tokens");
const themeTemplates = require("../pages/themeTemplates");
const pages = require("../pages");
const sectionsLib = require("../pages/sections");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");
const { need } = require("./kit");

const BASE = "/marketing/site-web/apparence";
const SECTIONS = {
  "": { title: "Éditeur du site", key: "apparence" },
  styles: { title: "Styles", key: "apparence/styles" },
  templates: { title: "Templates", key: "apparence/templates" },
  patterns: { title: "Patterns", key: "apparence/patterns" },
};
const intOrNull = (v) => (/^\d{1,9}$/.test(String(v ?? "")) ? Number(v) : null);

// « colors.primary » → { colors: { primary } } ; une chaîne vide = « valeur d'origine » (null pour les nombres)
function unflatten(body, prefixList) {
  const out = {};
  for (const [name, raw] of Object.entries(body || {})) {
    if (!prefixList.some((p) => name === p || name.startsWith(`${p}.`))) continue;
    const parts = name.split(".");
    if (parts.some((x) => !/^[A-Za-z0-9]{1,24}$/.test(x))) continue;
    let node = out;
    parts.slice(0, -1).forEach((k) => { node[k] = node[k] && typeof node[k] === "object" ? node[k] : {}; node = node[k]; });
    node[parts[parts.length - 1]] = raw;
  }
  return out;
}
const NUMERIC = new Set(["size", "weight", "lineHeight", "paddingY", "paddingX", "borderWidth", "width", "offset", "content", "narrow", "buttonHeight", "fieldHeight", "xs", "sm", "md", "lg", "xl", "xxl", "button", "field", "card"]);
function coerce(node, path = []) {
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === "object") coerce(v, [...path, k]);
    else if (typeof v === "string" && NUMERIC.has(k) && path[0] !== "shadow") node[k] = v.trim() === "" ? (["paddingY", "paddingX", "borderWidth", "width", "offset"].includes(k) ? null : undefined) : Number(v);
  }
  for (const k of Object.keys(node)) if (node[k] === undefined) delete node[k];
  return node;
}

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };
  const guard = (req, res, next, back, action) => {
    try { const m = action(); if (m) flash(req, "ok", m); res.redirect(typeof back === "function" ? back() : back); }
    catch (error) {
      if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error);
      flash(req, "error", error.message); res.redirect(typeof back === "function" ? back() : back);
    }
  };

  // ----- Pages de l'éditeur -----
  const show = (sub) => (req, res) => {
    const ctx = req.mk.ctx, st = appearance.state(null), can = (p) => req.mk.can(p);
    const data = {
      title: SECTIONS[sub].title, active: SECTIONS[sub].key, section: sub, BASE, st, history: appearance.history(null, 8), tokens: tokensLib, FONTS: tokensLib.FONTS,
      canStyles: can("appearance.styles"), canParts: can("appearance.parts"), canTemplates: can("appearance.templates"), canPatterns: can("appearance.patterns"), canPublish: can("appearance.publish"),
      menus: navigation.assignments(), navLocations: navigation.LOCATIONS, appearanceJs: true,
      warnings: contrastWarnings(st.draft.tokens),
    };
    if (sub === "") {
      data.sites = pages.listSites(ctx);
      data.previews = previewTargets();
      data.deviceTarget = String(req.query.url || "");
    }
    if (sub === "templates") {
      data.types = themeTemplates.TYPES; data.conditions = themeTemplates.CONDITIONS;
      data.templates = themeTemplates.list(ctx);
      data.pageChoices = pages.listPages(ctx, {}).filter((p) => p.kind !== "step" && !p.archived_at);
      data.audiences = require("../pages/nodes").AUDIENCES;
      data.categories = taxonomy.tree("category"); data.tags = taxonomy.list({ taxonomy: "tag", perPage: 200, sort: "nom" }).rows;
      data.posts = require("../../config/database").prepare("SELECT id, title FROM posts WHERE deleted_at IS NULL ORDER BY COALESCE(published_at, created_at) DESC LIMIT 60").all();
    }
    if (sub === "patterns") {
      data.userPatterns = appearance.patternRows(null).map((p) => ({ ...p, count: (JSON.parse(p.sections) || []).length }));
      data.builtin = require("../pages/patterns").catalog(ctx).length;
      data.components = pages.listComponents(ctx).map((c) => ({ id: c.id, name: c.name, global: c.global, uses: pages.componentUsage(ctx, c.id).length }));
      data.pageChoices = pages.listPages(ctx, {}).filter((p) => p.kind !== "step" && !p.archived_at);
      const pid = intOrNull(req.query.page);
      const page = pid ? pages.getPage(ctx, pid) : null;
      data.sourcePage = page && !page.archived_at ? { id: page.id, name: page.name, sections: (page.working.sections || []).map((s, i) => ({ index: i, label: sectionLabel(s) })) } : null;
    }
    res.render("marketing/appearance-editor", data);
  };
  Object.keys(SECTIONS).forEach((sub) => router.get(sub ? `/site-web/apparence/${sub}` : "/site-web/apparence", need("appearance.read"), show(sub)));

  function contrastWarnings(t) {
    const out = [];
    const c = t.colors, ratio = (a, b) => tokensLib.contrast(a, b);
    const check = (label, a, b) => { const r = ratio(a, b); if (r < 4.5) out.push(`${label} : contraste ${r.toFixed(1)}:1 (4,5:1 recommandé pour la lisibilité).`); };
    check("Texte sur le fond", c.text, c.background); check("Texte sur la surface", c.text, c.surface); check("Texte discret sur le fond", c.muted, c.background);
    check("Texte des boutons sur la couleur principale", tokensLib.onColor(c.primary), c.primary);
    return out;
  }
  function sectionLabel(s) {
    const name = s.name || (s.props && (s.props.title || s.props.heading)) || "";
    return `${s.type}${name ? ` — ${String(name).slice(0, 50)}` : ""}${Array.isArray(s.children) ? ` (${s.children.length} élément${s.children.length > 1 ? "s" : ""})` : ""}`;
  }
  // Adresses réelles à prévisualiser : l'accueil et ce que le site contient vraiment
  function previewTargets() {
    const db = require("../../config/database");
    const out = [{ url: "/", label: "Accueil" }, { url: "/blog", label: "Blog" }, { url: "/catalogue", label: "Catalogue" }, { url: "/a-propos", label: "À propos" }];
    const post = db.prepare("SELECT slug, title FROM posts WHERE published = 1 AND deleted_at IS NULL ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1").get();
    if (post) out.push({ url: require("../../services/urls").publicPath("post", post), label: `Article : ${post.title}` });
    const cat = taxonomy.publicTerms("category")[0], tag = taxonomy.publicTerms("tag")[0];
    if (cat) out.push({ url: taxonomy.urlOf(cat), label: `Catégorie : ${cat.name}` });
    if (tag) out.push({ url: taxonomy.urlOf(tag), label: `Étiquette : ${tag.name}` });
    out.push({ url: "/page-qui-n-existe-pas-apercu", label: "Page introuvable (404)" });
    return out;
  }

  // ----- Enregistrement du brouillon -----
  router.post("/site-web/apparence/styles", need("appearance.styles"), (req, res, next) => {
    guard(req, res, next, `${BASE}/styles`, () => {
      const patch = coerce(unflatten(req.body, ["colors", "fonts", "type", "buttons", "link", "radius", "shadow", "border", "sizes", "space"]));
      appearance.saveDraft(null, "tokens", patch, req.session.user.id, { baseRev: req.body.base });
      return "Styles enregistrés dans le brouillon. Prévisualisez, puis publiez pour les voir sur le site.";
    });
  });
  // L'en-tête et le pied de page du site principal se gèrent UNIQUEMENT dans le Theme Builder : les anciennes adresses y redirigent (aucun gestionnaire autonome).
  router.get("/site-web/apparence/en-tete", need("forms.read"), (req, res) => res.redirect(301, "/marketing/site-web/principal/constructeur-de-theme?type=header"));
  router.get("/site-web/apparence/pied-de-page", need("forms.read"), (req, res) => res.redirect(301, "/marketing/site-web/principal/constructeur-de-theme?type=footer"));

  // ----- Publication, annulation, historique -----
  router.post("/site-web/apparence/publier", need("appearance.publish"), (req, res, next) => {
    guard(req, res, next, BASE, () => { appearance.publish(null, req.session.user.id, req.body.note, { baseRev: req.body.base }); return "Apparence publiée : le site public utilise maintenant ces réglages."; });
  });
  router.post("/site-web/apparence/brouillon/annuler", need("appearance.styles"), (req, res, next) => {
    guard(req, res, next, BASE, () => { appearance.discardDraft(null); return "Brouillon annulé : retour à la version en ligne."; });
  });
  router.post("/site-web/apparence/retirer", need("appearance.publish"), (req, res, next) => {
    guard(req, res, next, BASE, () => { appearance.unpublish(null); return "Apparence retirée : le site reprend son affichage d'origine (l'historique est conservé)."; });
  });
  router.post("/site-web/apparence/versions/:id(\\d+)/restaurer", need("appearance.styles"), (req, res, next) => {
    guard(req, res, next, BASE, () => { appearance.restore(null, Number(req.params.id), req.session.user.id); return "Ancienne version placée dans le brouillon : vérifiez-la puis publiez."; });
  });

  // ----- Templates : affectation d'une page du Page Builder à une famille de pages (conditions + priorité) -----
  router.post("/site-web/apparence/templates", need("appearance.templates"), (req, res, next) => {
    guard(req, res, next, `${BASE}/templates`, () => {
      const who = String(req.body.audience || "");
      themeTemplates.add(req.mk.ctx, { type: req.body.type, pageId: intOrNull(req.body.page_id), category: req.body.category, tag: req.body.tag, postId: intOrNull(req.body.post_id), audience: who ? { who, value: req.body.audience_value } : null });
      return "Template enregistré. Il s'applique dès que sa page est en ligne ; sans template, le site garde son affichage d'origine.";
    });
  });
  router.post("/site-web/apparence/templates/:tid([a-f0-9]{8})/supprimer", need("appearance.templates"), (req, res, next) => {
    guard(req, res, next, `${BASE}/templates`, () => { themeTemplates.remove(req.mk.ctx, req.params.tid); return "Template retiré : le site reprend son affichage d'origine pour ces pages."; });
  });

  // ----- Patterns -----
  router.post("/site-web/apparence/patterns", need("appearance.patterns"), (req, res, next) => {
    const page = intOrNull(req.body.page_id);
    guard(req, res, next, () => `${BASE}/patterns`, () => {
      const ctx = req.mk.ctx;
      const src = page ? pages.getPage(ctx, page) : null;
      if (!src || src.archived_at) throw new UserError("Choisissez une page du site.");
      const idx = intOrNull(req.body.section_index);
      const sec = idx === null ? null : (src.working.sections || [])[idx];
      if (!sec) throw new UserError("Choisissez la section à enregistrer.");
      if (sec.type === "component") throw new UserError("Cette section est déjà un composant synchronisé : utilisez-la telle quelle dans le Page Builder.");
      // Copie indépendante : identifiants retirés (le Page Builder en donne de nouveaux à l'insertion), contenu revalidé par le moteur de pages
      const strip = (n) => (Array.isArray(n) ? n.map(strip) : n && typeof n === "object" ? Object.fromEntries(Object.entries(n).filter(([k]) => k !== "id").map(([k, v]) => [k, strip(v)])) : n);
      const clean = sectionsLib.normalizeSection(ctx, strip(sec), 0);
      appearance.createPattern({ name: req.body.name, description: req.body.description, sections: [strip(clean)], sourcePageId: src.id, userId: req.session.user.id });
      return `Pattern « ${String(req.body.name).trim()} » enregistré. Il est dans « Ajouter » → Blocs du Page Builder (copie indépendante).`;
    });
  });
  router.post("/site-web/apparence/patterns/:id(\\d+)", need("appearance.patterns"), (req, res, next) => {
    guard(req, res, next, `${BASE}/patterns`, () => { appearance.renamePattern(Number(req.params.id), { name: req.body.name, description: req.body.description }, req.session.user.id); return "Pattern renommé."; });
  });
  router.post("/site-web/apparence/patterns/:id(\\d+)/supprimer", need("appearance.patterns"), (req, res, next) => {
    guard(req, res, next, `${BASE}/patterns`, () => { const p = appearance.deletePattern(Number(req.params.id), req.session.user.id); return `Pattern « ${p.name} » mis à la corbeille (restaurable depuis CMS → Corbeille ; les pages qui l'ont déjà inséré ne changent pas).`; });
  });
  return router;
};
