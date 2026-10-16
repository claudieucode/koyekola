// Outils communs aux routes d'administration : exécution d'une action avec message flash, contrôle de permission.
const { MarketingError } = require("../errors");

// Exécute une action d'écriture : un message de réussite (texte renvoyé) ou l'erreur métier en message flash, puis redirection
function attempt(req, res, next, back, action) {
  try {
    // L'action renvoie un texte, ou { text, detail } quand un détail technique (replié à l'affichage) l'accompagne
    const message = action();
    if (message) req.session.mkFlash = typeof message === "string" ? { type: "ok", text: message } : { type: "ok", text: message.text, detail: message.detail };
  } catch (error) {
    if (!(error instanceof MarketingError)) return next(error);
    req.session.mkFlash = { type: "error", text: error.message, detail: error.detail };
  }
  res.redirect(keepSite(req, typeof back === "function" ? back() : back));
}

// Lot P1a : une action lancée depuis l'espace d'UN site (écrans partagés ouverts par /sites/<id>/<module>) revient sur ce même écran DANS ce site, pas sur
// la liste de l'organisation. Sûr parce que : (1) le site est celui que le serveur a vérifié pour cette requête (req.mk.site), jamais celui de l'en-tête ;
// (2) l'en-tête « Referer » sert seulement à reconnaître que l'on vient bien de l'espace de CE site ; (3) seules les listes racines des écrans partagés sont
// concernées ; hors de l'espace d'un site, rien ne change.
const SHARED_ROOTS = /^\/marketing\/(?:listes|segments|modeles|campagnes|automatisations|tunnels|analytics\/global|site-web\/tests-ab|site-web\/outils)\/?$/;
function keepSite(req, target) {
  try {
    const site = req.mk && req.mk.site;
    if (!site || typeof target !== "string") return target;
    const [path, query = ""] = target.split("?");
    if (!SHARED_ROOTS.test(path) || /(?:^|&)site=/.test(query)) return target;
    const from = new URL(req.get("referer") || "", "http://x.invalid").pathname;
    if (!new RegExp(`^/marketing/site-web/sites/${site.id}/`).test(from)) return target;
    return `${path}?${query ? `${query}&` : ""}site=${site.id}`;
  } catch { return target; }
}

const need = (permission) => (req, res, next) => {
  if (req.mk.can(permission)) return next();
  res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
};

const flashError = (req, text) => { req.session.mkFlash = { type: "error", text }; };
const flashOk = (req, text) => { req.session.mkFlash = { type: "ok", text }; };

// Données intégrées dans une balise <script type="application/json"> : « < » et les séparateurs de ligne sont échappés,
// aucune valeur (nom de modèle, libellé…) ne peut donc fermer la balise ni injecter du HTML.
const safeJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(new RegExp("\\u2028", "g"), "\\u2028").replace(new RegExp("\\u2029", "g"), "\\u2029");

// Email Engine (palier 16) : sites proposés (équipe de l'organisation) ou site imposé (accès limité à un site)
const siteChoices = (req) => {
  const { db, organizationId } = req.mk.ctx;
  const rows = req.mk.siteOnly
    ? db.prepare("SELECT id, name FROM mk_sites WHERE organization_id = ? AND id = ?").all(organizationId, req.mk.siteId ?? 0)
    : db.prepare("SELECT id, name FROM mk_sites WHERE organization_id = ? ORDER BY name").all(organizationId);
  return { sitesList: req.mk.siteOnly ? [] : rows, siteFixed: req.mk.siteOnly ? req.mk.siteId : null, siteFilter: req.mk.ctx.siteFilter ?? "", siteNames: Object.fromEntries(rows.map((r) => [r.id, r.name])) };
};

module.exports = { attempt, need, flashError, flashOk, safeJson, siteChoices };
