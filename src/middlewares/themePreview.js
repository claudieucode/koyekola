// Aperçu RÉEL d'un thème (Apparence → Thèmes) : ?kwtheme=<identifiant> sur une page du site, réservé aux personnes autorisées.
// Le rendu normal du site est utilisé (mêmes gabarits, mêmes contenus) ; seuls les jetons de design sont remplacés, EN MÉMOIRE, pour cette
// réponse : rien n'est enregistré, publié ni mis en cache, et le thème actif du site ne change pas.
// Site d'une page secondaire = celui que le moteur de rendu fournit à la vue ; sans site = site principal. Droit exigé : appearance.read sur CE site.
const db = require("../config/database");
const cmsAccess = require("../services/cmsAccess");
const KEY = /^[a-z][a-z0-9-]{1,39}$/;

function attach(req, res) {
  const key = req.query && typeof req.query.kwtheme === "string" ? req.query.kwtheme : "";
  const user = req.session && req.session.user;
  if (!KEY.test(key) || !user) return;
  let orgId = null;
  try { orgId = (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id; } catch { return; }
  if (!orgId) return;
  const allowed = (siteId) => { try { return cmsAccess.can(user.id, "appearance.read", { organizationId: orgId, siteId }); } catch { return false; } };
  res.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" });
  const themes = require("../services/themes");
  const appearance = require("../services/appearance");

  // Site principal : le CSS d'apparence de la requête est remplacé par celui du thème
  if (allowed(null)) {
    const prev = res.locals.appearance;
    res.locals.appearance = () => {
      try {
        const base = appearance.state(null).published;
        const p = themes.previewTokens(null, key, base.tokens);
        if (!p) return prev();
        const parts = appearance.parts({ preview: false });
        return { ...parts, css: String(appearance.buildCss(appearance.normalizeConfig({ ...base, tokens: p.tokens }, { strict: false })) || "").replace(/[<>]/g, "") };
      } catch { return prev(); }
    };
  }
  // Site secondaire : le site donné à la vue reçoit les jetons du thème et sa feuille de style recalculée
  const render = res.render.bind(res);
  res.render = (view, options, cb) => {
    try {
      const opts = typeof options === "function" ? null : options;
      const site = opts && opts.site;
      if (site && Number.isInteger(site.id) && site.tokens && allowed(site.id)) {
        const p = themes.previewTokens(site.id, key, site.tokens);
        if (p) {
          const pagesLib = require("../marketing/pages");
          const siteSettings = require("../marketing/pages/siteSettings");
          const { themeCss } = require("../marketing/pages/themeCss");
          void pagesLib;
          options = { ...opts, site: { ...site, tokens: p.tokens, assets: siteSettings.siteAssets(p.tokens, site.settings, themeCss) } };
        }
      }
    } catch { /* l'aperçu ne doit jamais casser la page */ }
    return render(view, options, cb);
  };
}
module.exports = { attach };
