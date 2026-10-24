// KOLAKISA CMS → Apparence → Thèmes : aperçu COMPLET d'un thème de la bibliothèque (son site de démonstration, page par page) et visuels originaux (SVG).
// L'aperçu est isolé : il n'utilise AUCUN contenu du site de la requête (ni pages, ni médias, ni articles) ; il n'écrit rien en base ; les jetons du thème sont posés en mémoire
// sur un site transitoire. La personne doit avoir le droit appearance.read ; le site vérifié par le serveur ne sert qu'à contrôler ce droit et à conserver le choix du site dans les liens.
const express = require("express");
const landing = require("../landing");
const pagesLib = require("../pages");
const sections = require("../pages/sections");
const forms = require("../forms");
const siteSettings = require("../pages/siteSettings");
const { themeCss } = require("../pages/themeCss");
const { tokensToCss } = require("../pages/tokens");
const { renderMarkdown } = require("../../utils/markdown");
const library = require("../themes/library");
const { need } = require("./kit");

const BASE = "/marketing/site-web/themes";
const KEY = /^[a-z][a-z0-9-]{1,39}$/;
const PAGE = /^[a-z][a-z0-9-]{1,29}$/;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function demoSite(spec, tokens) {
  const settings = siteSettings.normalizeSettings({}, { strict: false });
  return { id: 0, name: spec.brand || spec.name, slug: "demo", status: "active", home_page_id: null, tokens, settings, assets: siteSettings.siteAssets(tokens, settings, themeCss) };
}

// Liens internes du site de démonstration : « /slug » devient l'aperçu de CETTE page du thème (les autres adresses restent telles quelles)
function rewriteLinks(html, spec, base, query) {
  const keys = new Set(spec.pages.map((p) => p.key));
  return html.replace(/href="\/([a-z0-9-]*)"/g, (m, slug) => {
    const target = slug === "" ? "accueil" : slug;
    return keys.has(target) ? `href="${base}/${target}${query}"` : m;
  });
}

module.exports = () => {
  const router = express.Router();
  const target = require("./siteTarget");

  router.get("/site-web/themes/:key/demo/:page?", need("appearance.read"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    const key = String(req.params.key), pageKey = String(req.params.page || "accueil");
    const spec = KEY.test(key) && PAGE.test(pageKey) ? library.specOf(key) : null;
    if (!spec || !spec.pages.some((p) => p.key === pageKey)) return res.status(404).render("error", { message: "Ce thème ou cette page de démonstration n'existe pas." });
    try {
      const ctx = { ...req.mk.ctx, demoBrand: spec.brand || spec.name };
      const raw = library.pageSections(key, pageKey);
      const normalized = sections.normalizeSections(ctx, raw.map((s, i) => ({ ...s, id: `s${String(i).padStart(7, "0")}` })));
      const resolved = pagesLib.resolveSections(ctx, normalized);
      const tokens = library.demoPageTokens(key);
      const page = landing.viewModel(ctx, {
        id: 0, organization_id: ctx.organizationId, name: spec.pages.find((p) => p.key === pageKey).name, slug: pageKey, title: spec.pages.find((p) => p.key === pageKey).name, description: "", status: "draft", kind: "page", site_id: null, form_id: null, tags: [], indexable: 0,
        theme: pagesLib.normalizeTheme({}), seo: pagesLib.normalizeSeo({}), sections: resolved, scope: {},
      });
      res.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" });
      const query = t.siteId ? `?site=${t.siteId}` : "";
      res.render("marketing-public/landing", { page, site: demoSite(spec, tokens), tokensToCss, form: null, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: [], renderMarkdown, error: null, values: {}, thanks: null, preview: true, previewLabel: `Site de démonstration « ${esc(spec.name)} » : textes, chiffres et témoignages sont fictifs. —` }, (err, html) => {
        if (err) return next(err);
        res.send(rewriteLinks(html, spec, `${BASE}/${key}/demo`, query));
      });
    } catch (error) { next(error); }
  });
  return router;
};
