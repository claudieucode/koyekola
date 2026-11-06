// Aperçu RÉEL du personnalisateur (Apparence → Personnaliser) : ?kwcustom=1 sur une page du site, réservé aux personnes autorisées.
// Le rendu normal du site est utilisé (mêmes gabarits, mêmes contenus) ; seuls les réglages en cours de la session — copie de travail gardée PAR SITE dans la session de
// la personne — sont superposés EN MÉMOIRE pour cette réponse : rien n'est enregistré, publié ni mis en cache, et la version en ligne ne change pas.
// Site d'une page secondaire = celui que le moteur de rendu fournit à la vue ; sans site = site principal. Droit exigé : appearance.read sur CE site (jamais sur un autre).
const db = require("../config/database");
const cmsAccess = require("../services/cmsAccess");

function attach(req, res) {
  const user = req.session && req.session.user;
  let work = req.session && req.session.kwCustomizer;
  let orgId = null;
  try { orgId = (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id; } catch { return; }
  if (!orgId) return;
  let can = (perm, siteId) => { try { return cmsAccess.can(user.id, perm, { organizationId: orgId, siteId }); } catch { return false; } };
  // Lien d'aperçu partageable (?kwshare=<jeton>) : le jeton est l'accréditation ; il ne donne accès qu'à l'aperçu en lecture de SON site, avec les réglages figés au partage
  const token = req.query && typeof req.query.kwshare === "string" ? req.query.kwshare : "";
  if (token) {
    const shared = require("../services/customizer").shareLookup(token);
    if (!shared) return;
    work = { [String(shared.siteId)]: shared.changes };
    can = (perm, siteId) => perm === "appearance.read" && siteId === shared.siteId;
    req.kwShared = true; // le comptage des vues ignore ces visites
  } else if (!user || !work || typeof work !== "object") return;
  res.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" });
  req.kwCzWork = work; req.kwCzCan = can; // réglages en cours, relus par les rendus qui en dépendent (ex. Publication unique)
  const customizer = require("../services/customizer");
  const appearance = require("../services/appearance");

  // Site principal : en-tête, pied de page et CSS d'apparence de la requête viennent de la configuration publiée + les réglages en cours
  if (work.p && can("appearance.read", null)) {
    const prev = res.locals.appearance;
    res.locals.appearance = () => {
      try {
        const st = appearance.state(null);
        const cfg = customizer.applyChanges({ tokens: st.published.tokens, header: st.published.header, footer: st.published.footer }, customizer.cleanChanges(work.p, null), null).config;
        return appearance.parts({ override: cfg });
      } catch { return prev(); }
    };
  }
  // En-tête et pied choisis (composants) : remplacements pour cette requête seulement
  const store = {};
  for (const [key, changes] of Object.entries(work)) {
    if (key === "p" || !changes || typeof changes !== "object") continue;
    const sid = Number(key);
    if (!Number.isInteger(sid) || !can("appearance.read", sid)) continue;
    const o = {};
    if (Object.hasOwn(changes, "parts.header")) o.header = changes["parts.header"] === "" || changes["parts.header"] === null ? null : Number(changes["parts.header"]);
    if (Object.hasOwn(changes, "parts.footer")) o.footer = changes["parts.footer"] === "" || changes["parts.footer"] === null ? null : Number(changes["parts.footer"]);
    if (Object.keys(o).length) store[String(sid)] = o;
  }
  if (Object.keys(store).length) req.kwPartsPreview = store;
  // Site secondaire : le site donné à la vue reçoit son nom, ses jetons, ses réglages et ses feuilles de style recalculés
  const render = res.render.bind(res);
  res.render = (view, options, cb) => {
    try {
      const opts = typeof options === "function" ? null : options;
      const site = opts && opts.site;
      const mine = site && Number.isInteger(site.id) ? work[String(site.id)] : null;
      if (mine && can("appearance.read", site.id)) {
        const cfg = customizer.applyChanges({ name: site.name, tokens: site.tokens, settings: site.settings }, customizer.cleanChanges(mine, site.id), site.id).config;
        options = { ...opts, site: { ...site, name: cfg.name, tokens: cfg.tokens, settings: cfg.settings, assets: require("../marketing/pages/siteSettings").siteAssets(cfg.tokens, cfg.settings, require("../marketing/pages/themeCss").themeCss) } };
      }
    } catch { /* l'aperçu ne doit jamais casser la page */ }
    return render(view, options, cb);
  };
}
module.exports = { attach };
