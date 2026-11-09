// En-tête et pied de page du Theme Builder sur TOUTES les pages d'un site à domaine propre (blog, recherche, boutique, 404…), pas seulement celles du Page Builder.
// Avant le rendu d'une vue de page (jamais d'un fragment), le modèle publié applicable est résolu et rendu avec les éléments du Page Builder ; le résultat est exposé aux vues
// header.ejs / footer.ejs (res.locals.themeHeader / themeFooter), qui remplacent alors leur habillage d'origine. Sans modèle applicable : aucun changement. Jamais bloquant.
// Domaine d'un site (req.kwSite) OU site principal (aucun kwSite : modèles à site_id NULL). Sans modèle publié applicable, le site principal garde son habillage d'apparence d'origine.
const themeRender = require("../marketing/web/themeRender");

function themeLayout(req, res, next) {
  const render = res.render.bind(res);
  let pending = null;
  const prepare = () => {
    if (!pending) {
      // Pied de page avec formulaire (lettre d'information, contact) sur une page qui n'est pas une page du Page Builder : jeton anti-robot, page de retour et message de l'envoi précédent (?kwi=…&w=…)
      try {
        if (res.locals.formToken === undefined) res.locals.formToken = require("../marketing/forms/antispam").issue();
        const u = String(req.originalUrl || req.url || "/");
        res.locals.kwBack = /^\/(?!\/)[^\\\x00-\x1f]{0,400}$/.test(u) ? u : "/";
        const w = req.query && req.query.w, code = req.query && req.query.kwi;
        const MSG = { ok: ["thanks", "Merci, votre inscription est enregistrée."], confirmer: ["thanks", "Merci ! Un e-mail de confirmation vient de vous être envoyé : cliquez sur le lien qu'il contient pour finaliser votre inscription (pensez aux courriers indésirables)."], consent: ["error", "Cochez la case pour confirmer votre inscription."], email: ["error", "Adresse e-mail invalide."], trop: ["error", "Trop de tentatives : réessayez dans un instant."], indispo: ["error", "L'inscription n'est pas disponible pour le moment."] };
        if (typeof w === "string" && /^[a-z0-9]{6,20}$/.test(w) && typeof code === "string" && Object.prototype.hasOwnProperty.call(MSG, code)) res.locals.widgetForm = { id: w, [MSG[code][0]]: MSG[code][1], values: {} };
      } catch { /* jamais bloquant */ }
    }
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
