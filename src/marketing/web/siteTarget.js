// Le site visé par une requête des écrans partagés « par site » (Thèmes, Polices…) : accès limité → le sien (jamais un autre) ; équipe → le site choisi
// (« ?site= » ou champ « site » d'un formulaire), sinon le site principal. Rien ici ne vient d'un état global : la valeur est validée puis revérifiée
// par pages.getSite. Renvoie null (réponse déjà envoyée : 403 ou 404) si le site est refusé ou introuvable.
const pages = require("../pages");

module.exports = function target(req, res) {
  const ctx = req.mk.ctx;
  const denied = (message) => res.status(403).render("error", { message });
  const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
  const asked = raw === undefined || raw === null || raw === "" ? undefined : /^\d{1,12}$/.test(String(raw)) ? Number(raw) : NaN;
  let siteId;
  if (ctx.siteScope !== undefined) {
    const own = Number.isInteger(ctx.siteScope) && ctx.siteScope > 0 ? ctx.siteScope : null;
    if (own === null || (asked !== undefined && asked !== own)) { denied("Vous n'avez pas accès à ce site."); return null; }
    siteId = own;
  } else if (asked === undefined) siteId = null;
  else if (Number.isNaN(asked) || asked < 1) { res.status(404).render("error", { message: "Site introuvable." }); return null; }
  else siteId = asked;
  if (siteId === null) return { siteId: null, name: "Site principal", principal: true, readOnly: false };
  const site = pages.getSite(ctx, siteId);
  if (!site) { res.status(404).render("error", { message: "Site introuvable." }); return null; }
  return { siteId, name: site.name, principal: false, readOnly: site.status !== "active" || Boolean(site.deleted_at), site };
};
