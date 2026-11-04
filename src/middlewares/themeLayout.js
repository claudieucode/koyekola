// En-tête et pied de page du Theme Builder sur TOUTES les pages d'un site à domaine propre (blog, recherche, boutique, 404…), pas seulement celles du Page Builder.
// Avant le rendu d'une vue de page (jamais d'un fragment), le modèle publié applicable est résolu et rendu avec les éléments du Page Builder ; le résultat est exposé aux vues
// header.ejs / footer.ejs (res.locals.themeHeader / themeFooter), qui remplacent alors leur habillage d'origine. Sans modèle applicable : aucun changement. Jamais bloquant.
// Domaine d'un site (req.kwSite) OU site principal (aucun kwSite : modèles à site_id NULL). Sans modèle publié applicable, le site principal garde son habillage d'apparence d'origine.
const themeRender = require("../marketing/web/themeRender");

function themeLayout(req, res, next) {
  const render = res.render.bind(res);
  let pending = null;
  const prepare = () => {
    if (!pending) pending = themeRender.renderParts(req, res).then((p) => { res.locals.themeHeader = p.header || ""; res.locals.themeFooter = p.footer || ""; res.locals.themeExtras = p.extras || ""; }).catch(() => {});
    return pending;
  };
  res.render = (view, locals, cb) => {
    // Un callback = rendu d'un fragment (modèle de page, section…) : pas une page complète, aucun habillage à préparer
    if (typeof locals === "function" || typeof cb === "function") return render(view, locals, cb);
    return prepare().then(() => render(view, locals, cb));
  };
  next();
}
module.exports = themeLayout;
