// KOLAKISA CMS → Paramètres (palier 14) : écrans et API du moteur de réglages (src/services/settings). Les droits sont ceux du palier 9, calculés dans le
// contexte du site choisi (?site=) et revérifiés par le moteur pour CHAQUE réglage : l'interface masque, le serveur décide.
const express = require("express");
const engine = require("../../services/settings");
const access = require("../../services/cmsAccess");
const pages = require("../pages");
const db = require("../../config/database");
const { need } = require("./kit");
const general = require("./generalSettings");
const privacy = require("./privacy");
const connectorsWeb = require("./connectors");
const target = require("./siteTarget");
const permalinksUi = require("./permalinksSettings");

const BASE = "/marketing/site-web/parametres";
// Adresses des groupes (français) → clés du moteur
const SLUGS = { general: "general", ecriture: "writing", lecture: "reading", commentaires: "comments", medias: "media", permaliens: "permalinks", seo: "seo", confidentialite: "privacy", indexation: "indexation", emailing: "email", tunnels: "tunnels" };
const SLUG_OF = Object.fromEntries(Object.entries(SLUGS).map(([s, g]) => [g, s]));
const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
// Anciens noms de champs du formulaire des commentaires (palier 6) : toujours acceptés
const LEGACY = { enabled_default: "comments_enabled_default", guests_allowed: "comments_guests_allowed", moderation: "comments_moderation", replies_allowed: "comments_replies_allowed", max_depth: "comments_max_depth", links_allowed: "comments_links_allowed" };

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };
  const ctxOf = (req) => ({ ...req.mk.ctx, can: req.mk.can, orgLevel: !req.mk.siteOnly });
  const scopeOf = (req) => {
    const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
    if (raw === undefined || raw === "" || raw === null) return { scope: { siteId: null } };
    const id = intOrNull(raw);
    return id && pages.listSites(req.mk.ctx).some((s) => s.id === id) ? { scope: { siteId: id } } : { missing: true };
  };
  const q = (scope) => (scope.siteId ? `?site=${scope.siteId}` : "");
  const sitesFor = (req) => {
    const all = pages.listSites(req.mk.ctx).filter((s) => s.status === "active").map((s) => ({ id: s.id, name: s.name }));
    if (!req.mk.siteOnly) return all;
    const mine = new Set(access.siteMemberships(req.session.user.id).map((m) => m.site_id));
    return all.filter((s) => mine.has(s.id));
  };
  const visibleGroups = (req, scope) => Object.entries(engine.GROUPS).filter(([g]) => engine.defsFor(scope).some((d) => d.group === g)).filter(([g]) => req.mk.can("settings.read") || (g === "seo" && req.mk.can("seo.view")));
  const canRead = (req, group) => req.mk.can("settings.read") || (group === "seo" && req.mk.can("seo.view"));
  // Écran ouvert dans le cadre d'un site (/sites/<id>/parametres-<groupe>) : le site est celui du cadre ; formulaires et redirections y restent
  const inFrame = (req) => /\/sites\/\d+\//.test(req.originalUrl || "");
  const landing = (req, slug, scope) => (req.body && req.body.frame === "1" && scope.siteId ? (slug ? `/marketing/site-web/sites/${scope.siteId}/parametres-${slug}` : `/marketing/site-web/sites/${scope.siteId}/reglages`) : `${BASE}${slug ? `/${slug}` : ""}${q(scope)}`);
  // Réglages COMMUNS À TOUTE LA PLATEFORME qui s'appliquent aussi à un site (lecture seule dans l'espace d'un site : une modification se fait depuis le site principal, par l'équipe)
  const platformRecap = (req, group, siteScope) => {
    const ctx = { ...ctxOf(req), orgLevel: true };
    const scope = { siteId: null };
    const values = engine.readAll(scope, ctx);
    const own = new Set(siteScope ? engine.defsFor(siteScope).map((d) => d.key) : []); // déjà réglés PAR le site : pas répétés ici
    return engine.defsFor(scope).filter((d) => d.group === group && !own.has(d.key)).map((d) => {
      const v = values[d.key].value;
      const opt = d.type === "enum" ? (d.options(scope).find(([k]) => String(k) === String(v)) || [])[1] : null;
      return { key: d.key, label: d.label, help: d.help || "", value: d.type === "boolean" ? (v ? "Oui" : "Non") : opt || (v === null || v === "" || v === undefined ? "Non défini" : String(v)), sensitive: Boolean(d.sensitive) };
    });
  };
  const fail = (res, error) => res.status(error.status || 422).render("error", { message: error.message });

  // Valeurs proposées pour les réglages « page » et « image »
  const choices = (req, scope) => {
    const org = req.mk.ctx.organizationId;
    return {
      pages: db.prepare("SELECT id, name FROM mk_landing_pages WHERE organization_id = ? AND site_id IS ? AND status = 'published' AND archived_at IS NULL AND kind <> 'step' ORDER BY name COLLATE NOCASE LIMIT 300").all(org, scope.siteId),
      images: db.prepare("SELECT path, name FROM mk_media WHERE organization_id = ? AND type = 'image' AND deleted_at IS NULL ORDER BY id DESC LIMIT 300").all(org),
    };
  };
  const optionsFor = (d, scope) => (d.type === "enum" ? d.options(scope) : null);

  const render = (req, res, group, scope, extra = {}) => {
    const ctx = ctxOf(req);
    const defs = engine.defsFor(scope).filter((d) => d.group === group);
    const values = engine.readAll(scope, ctx);
    const view = defs.map((d) => ({
      key: d.key, label: d.label, help: d.help || "", type: d.type, sensitive: Boolean(d.sensitive), nullable: Boolean(d.nullable), min: d.min, max: scope.siteId && d.maxSite ? d.maxSite : d.max,
      value: extra.formValues && d.key in extra.formValues ? extra.formValues[d.key] : values[d.key].value, def: values[d.key].default, options: optionsFor(d, scope), editable: ctx.can(d.perm) && (!d.sensitive || ctx.can("settings.sensitive")), perm: d.perm, impact: d.impact || "",
    }));
    res.render("marketing/settings-group", {
      title: `Paramètres · ${engine.GROUPS[group].label}`, active: group === "general" ? "parametres" : `parametres/${SLUG_OF[group]}`, group, groupLabel: engine.GROUPS[group].label, intro: engine.GROUPS[group].intro, view,
      scope, q: q(scope), BASE, SLUG_OF, SLUGS, sites: sitesFor(req), siteOnly: req.mk.siteOnly, groups: visibleGroups(req, scope).map(([g, d]) => ({ key: g, label: d.label, slug: SLUG_OF[g] })), choices: choices(req, scope), TIMEZONES: engine.TIMEZONES,
      structure: group === "permalinks" ? permalinkStructure() : null, settingsJs: true, pending: extra.pending || null, errors: extra.errors || [], formValues: extra.formValues || null,
      ...(group === "reading" ? readingExtras(req, scope, extra.frame) : {}),
      frame: Boolean(extra.frame), pingLog: group === "writing" ? require("../../services/writing").log(scope.siteId) : null, recap: scope.siteId ? platformRecap(req, group, scope) : null, canTeam: !req.mk.siteOnly,
    });
  };
  // Lecture : état de la visibilité (même réglage que Paramètres → Indexation), adresse du flux réel, lien vers l'écran d'indexation
  function readingExtras(req, scope, frame) {
    const vis = engine.readAll(scope, ctxOf(req)).search_visibility.value;
    const info = scope.siteId ? require("../../services/urls").siteInfo(scope.siteId) : null;
    const feedUrl = scope.siteId ? (info && info.base ? `${info.base}/blog/feed.xml` : null) : "/blog/feed.xml";
    const visibilityUrl = frame && scope.siteId ? `/marketing/site-web/sites/${scope.siteId}/parametres-indexation` : `${BASE}/indexation${q(scope)}`;
    return { visibility: vis === "closed" ? "closed" : "open", visibilityUrl, feedUrl };
  }
  function permalinkStructure() {
    const tx = require("../../services/taxonomy");
    return [["Page du CMS", "/p/<adresse>"], ["Article", "/blog/<adresse>"], ["Formation", "/cours/<adresse>"], ...Object.values(tx.TAXONOMIES).map((t) => [t.label, `${tx.baseOf(t.key)}/<adresse>`])];
  }

  // En-tête des Paramètres autour de l'écran des permaliens (absent dans le cadre d'un site : le menu du site tient lieu d'onglets)
  const permalinksHead = (req, scope) => (inFrame(req) ? { frame: true } : { settingsHead: { heading: "Permaliens", intro: "", groups: visibleGroups(req, scope).map(([g, d]) => ({ key: g, label: d.label, slug: SLUG_OF[g] })), BASE, q: q(scope), scope, sites: sitesFor(req), siteOnly: req.mk.siteOnly, tabKey: "permalinks", tabPath: "/permaliens" } });
  // Aperçu et validation à la volée (JSON, aucune écriture)
  router.post("/site-web/parametres/permaliens/apercu", (req, res) => {
    if (!req.mk.can("settings.read")) return res.status(403).json({ ok: false, errors: ["Permission requise."] });
    const t = target(req, res, { json: true }); if (!t) return;
    permalinksUi.preview(req, res, t);
  });
  // ----- Écrans -----
  // Connecteurs : page propre (centre d'intégrations) ; le niveau (central ou un site) vient de l'adresse vérifiée
  router.get("/site-web/parametres/connecteurs", (req, res) => connectorsWeb.render(req, res));
  const groupRoute = new RegExp(`^/site-web/parametres(?:/(${Object.keys(SLUGS).join("|")}))?/?$`);
  router.get(groupRoute, (req, res) => {
    const group = SLUGS[req.params[0] || "general"];
    const s = scopeOf(req);
    if (s.missing) return res.status(404).render("error", { message: "Site introuvable." });
    if (!canRead(req, group)) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'ouvrir cet écran." });
    if (!s.scope.siteId && req.mk.siteOnly) return res.redirect("/marketing/site-web/mes-sites");
    // Permaliens : écran dédié (structure des articles, préfixes des archives) au-dessus du moteur unique services/permalinks
    if (group === "permalinks") {
      const t = target(req, res); if (!t) return;
      return permalinksUi.render(req, res, t, permalinksHead(req, s.scope));
    }
    // Un groupe sans réglage propre au site (commentaires, médias…) s'affiche tout de même pour un site : il montre ce qui s'applique réellement, en lecture seule
    if (!engine.defsFor(s.scope).some((d) => d.group === group) && !(s.scope.siteId && platformRecap(req, group, s.scope).length)) return res.redirect(`${BASE}${q(s.scope)}`);
    // Général : le centre de configuration (sections, aperçus, enregistrement en une fois) ; les autres groupes gardent leur formulaire
    if (group === "general") {
      const t = target(req, res); if (!t) return;
      return general.render(req, res, t, "parametres", { settingsHead: { heading: "Général", intro: "", groups: visibleGroups(req, s.scope).map(([g, d]) => ({ key: g, label: d.label, slug: SLUG_OF[g] })), BASE, q: q(s.scope), scope: s.scope, sites: sitesFor(req), siteOnly: req.mk.siteOnly, tabKey: "general", tabPath: "" } });
    }
    // Confidentialité : deux onglets (Réglages · Guide de politique) ; le formulaire générique ne sert plus à ce groupe
    if (group === "privacy") {
      const t = target(req, res); if (!t) return;
      // Dans l'espace d'un site (adresse /sites/<id>/confidentialite), pas d'onglets centraux ni de choix de site : le site est celui du cadre
      const inSite = /\/sites\/\d+\//.test(req.originalUrl || "");
      return privacy.render(req, res, t, inSite ? {} : { settingsHead: { heading: "Confidentialité", intro: "", groups: visibleGroups(req, s.scope).map(([g, d]) => ({ key: g, label: d.label, slug: SLUG_OF[g] })), BASE, q: q(s.scope), scope: s.scope, sites: sitesFor(req), siteOnly: req.mk.siteOnly, tabKey: "privacy", tabPath: "/confidentialite" } });
    }
    render(req, res, group, s.scope, { frame: inFrame(req) });
  });

  // Enregistrement d'un groupe (formulaire) : tout ou rien ; réglage sensible = confirmation explicite
  router.post(groupRoute, (req, res, next) => {
    const group = SLUGS[req.params[0] || "general"];
    const s = scopeOf(req);
    if (s.missing) return res.status(404).render("error", { message: "Site introuvable." });
    if (!req.mk.can("settings.write") && !(group === "seo" && req.mk.can("seo.edit"))) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    // Formulaire de l'écran Permaliens (structure, préfixes) ; un envoi qui ne porte que « normalize_paths » (ancien formulaire, API) suit le chemin générique ci-dessous
    if (group === "permalinks" && req.body && ("preset" in req.body || "structure" in req.body || "category_base" in req.body || "tag_base" in req.body)) {
      const t = target(req, res); if (!t) return;
      const out = permalinksUi.save(Object.assign(req, { permalinksHead: permalinksHead(req, s.scope).settingsHead }), res, t, next);
      if (out && out.redirect) return res.redirect(landing(req, req.params[0], s.scope));
      return;
    }
    const ctx = ctxOf(req);
    const body = { ...(req.body || {}) };
    if (group === "comments") for (const [from, to] of Object.entries(LEGACY)) if (from in body && !(to in body)) body[to] = body[from];
    const patch = {};
    for (const d of engine.defsFor(s.scope).filter((x) => x.group === group)) {
      if (!ctx.can(d.perm) || (d.sensitive && !ctx.can("settings.sensitive"))) continue; // champ non modifiable pour cette personne : ignoré (le moteur le refuserait)
      if (d.type === "boolean") {
        const shown = `_b_${d.key}` in body || group === "comments"; // case décochée = absente du formulaire : seul le marqueur prouve que le champ était affiché
        if (shown) patch[d.key] = body[d.key] === "1" || body[d.key] === "on" || body[d.key] === "true";
      } else if (d.key in body) patch[d.key] = body[d.key];
    }
    let result;
    try { result = engine.update(s.scope, patch, ctx, { confirm: body.confirm === "1", actor: req }); } catch (error) { if (error.status) return fail(res, error); return next(error); }
    if (result.ok) {
      flash(req, "ok", result.changed.length ? `Réglages enregistrés (${result.changed.length} modification${result.changed.length > 1 ? "s" : ""}).` : "Aucune modification à enregistrer.");
      return res.redirect(landing(req, req.params[0], s.scope));
    }
    const frame = req.body.frame === "1";
    if (result.confirmRequired) return render(req, res.status(409), group, s.scope, { pending: result.confirmRequired, formValues: patch, frame });
    return render(req, res.status(422), group, s.scope, { errors: result.errors, formValues: patch, frame });
  });

  // ----- API JSON -----
  const api = express.Router();
  const json = (res, status, body) => res.status(status).set("Cache-Control", "no-store").json(body);
  const scopeJson = (req, res) => { const s = scopeOf(req); if (s.missing) { json(res, 404, { error: "Site introuvable." }); return null; } if (!s.scope.siteId && req.mk.siteOnly) { json(res, 403, { error: "Les réglages du site principal sont réservés à l'équipe de l'organisation." }); return null; } return s.scope; };
  const describe = (scope, ctx) => {
    const values = engine.readAll(scope, ctx);
    return engine.defsFor(scope).map((d) => ({ key: d.key, group: d.group, label: d.label, type: d.type, value: values[d.key].value, default: values[d.key].default, sensitive: Boolean(d.sensitive), permission: d.perm, editable: ctx.can(d.perm) && (!d.sensitive || ctx.can("settings.sensitive")) }));
  };
  const respond = (res, result) => {
    if (result.ok) return json(res, 200, { ok: true, changed: result.changed });
    if (result.confirmRequired) return json(res, 409, { ok: false, confirmRequired: result.confirmRequired });
    const denied = (result.errors || []).some((e) => /permission/i.test(e));
    return json(res, denied ? 403 : 422, { ok: false, errors: result.errors });
  };
  api.get("/", (req, res) => {
    if (!req.mk.can("settings.read") && !req.mk.can("seo.view")) return json(res, 403, { error: "Permission « settings.read » requise." });
    const scope = scopeJson(req, res); if (!scope) return;
    const items = describe(scope, ctxOf(req)).filter((i) => req.mk.can("settings.read") || i.group === "seo");
    json(res, 200, { scope: scope.siteId ? `site:${scope.siteId}` : "main", settings: items });
  });
  api.get("/preferences", (req, res) => json(res, 200, { scope: "user", preferences: engine.userPrefs(req.session.user.id) }));
  api.put("/preferences", (req, res) => {
    const unknown = Object.keys(req.body || {}).filter((k) => !engine.USER_PREFS.some((p) => p.key === k));
    if (unknown.length) return json(res, 422, { ok: false, errors: [`Préférence inconnue : ${unknown.map((k) => String(k).slice(0, 30)).join(", ")} (les réglages du site ne se modifient pas ici).`] });
    json(res, 200, { ok: true, preferences: engine.setUserPrefs(req.session.user.id, req.body || {}) });
  });
  api.get("/groupes/:group", (req, res) => {
    const group = SLUGS[req.params.group] || (engine.GROUPS[req.params.group] ? req.params.group : null);
    if (!group) return json(res, 404, { error: "Groupe inconnu." });
    if (!canRead(req, group)) return json(res, 403, { error: "Permission requise." });
    const scope = scopeJson(req, res); if (!scope) return;
    json(res, 200, { group, settings: describe(scope, ctxOf(req)).filter((i) => i.group === group) });
  });
  api.put("/groupes/:group", (req, res, next) => {
    const group = SLUGS[req.params.group] || (engine.GROUPS[req.params.group] ? req.params.group : null);
    if (!group) return json(res, 404, { error: "Groupe inconnu." });
    const scope = scopeJson(req, res); if (!scope) return;
    const values = req.body && typeof req.body.values === "object" && req.body.values && !Array.isArray(req.body.values) ? req.body.values : null;
    if (!values) return json(res, 422, { ok: false, errors: ["Corps invalide : { values: { clé: valeur } } attendu."] });
    const foreign = Object.keys(values).filter((k) => !engine.defsFor(scope).some((d) => d.key === k && d.group === group));
    if (foreign.length) return json(res, 422, { ok: false, errors: [`Réglage étranger à ce groupe : ${foreign.map((k) => String(k).slice(0, 30)).join(", ")}.`] });
    try { respond(res, engine.update(scope, values, ctxOf(req), { confirm: req.body.confirm === true, actor: req })); } catch (error) { if (error.status) return json(res, error.status, { error: error.message }); next(error); }
  });
  // Général : un enregistrement unique de tous les champs modifiés (tout ou rien) ; la réponse renvoie les valeurs RÉELLEMENT enregistrées
  api.put("/general", (req, res, next) => {
    const scope = scopeJson(req, res); if (!scope) return;
    const values = req.body && typeof req.body.values === "object" && req.body.values && !Array.isArray(req.body.values) ? req.body.values : null;
    if (!values) return json(res, 422, { ok: false, errors: ["Corps invalide : { values: { clé: valeur } } attendu."] });
    const foreign = Object.keys(values).filter((k) => !general.KEYS.includes(k));
    if (foreign.length) return json(res, 422, { ok: false, errors: [`Réglage étranger à cet écran : ${foreign.map((k) => String(k).slice(0, 30)).join(", ")}.`] });
    try {
      const ctx = ctxOf(req);
      const result = engine.update(scope, values, ctx, { confirm: req.body.confirm === true, actor: req });
      if (!result.ok) return respond(res, result);
      const now = engine.readAll(scope, ctx);
      json(res, 200, { ok: true, changed: result.changed, values: Object.fromEntries(general.KEYS.filter((k) => k in now).map((k) => [k, now[k].value])) });
    } catch (error) { if (error.status) return json(res, error.status, { error: error.message }); next(error); }
  });
  privacy.apiRoutes(api);
  connectorsWeb.apiRoutes(api);
  api.get("/:key", (req, res) => {
    const scope = scopeJson(req, res); if (!scope) return;
    const d = engine.byKey(scope, req.params.key);
    if (!d) return json(res, 404, { error: "Réglage inconnu pour ce périmètre." });
    if (!canRead(req, d.group)) return json(res, 403, { error: "Permission requise." });
    json(res, 200, describe(scope, ctxOf(req)).find((i) => i.key === d.key));
  });
  api.put("/:key", (req, res, next) => {
    const scope = scopeJson(req, res); if (!scope) return;
    if (!engine.byKey(scope, req.params.key)) return json(res, 404, { error: "Réglage inconnu pour ce périmètre (les préférences personnelles et la configuration de la plateforme ne se modifient pas ici)." });
    if (!req.body || !("value" in req.body)) return json(res, 422, { ok: false, errors: ["Corps invalide : { value } attendu."] });
    try { respond(res, engine.update(scope, { [req.params.key]: req.body.value }, ctxOf(req), { confirm: req.body.confirm === true, actor: req })); } catch (error) { if (error.status) return json(res, error.status, { error: error.message }); next(error); }
  });
  api.delete("/:key", (req, res, next) => {
    const scope = scopeJson(req, res); if (!scope) return;
    if (!engine.byKey(scope, req.params.key)) return json(res, 404, { error: "Réglage inconnu pour ce périmètre." });
    try { respond(res, engine.reset(scope, req.params.key, ctxOf(req), { confirm: req.query.confirm === "1" || (req.body && req.body.confirm === true), actor: req })); } catch (error) { if (error.status) return json(res, error.status, { error: error.message }); next(error); }
  });
  router.use("/site-web/parametres/api", api);

  // Restaurer la valeur par défaut d'UN réglage ou d'UN groupe (jamais un « tout réinitialiser » global)
  router.post("/site-web/parametres/reinitialiser", (req, res, next) => {
    const s = scopeOf(req);
    if (s.missing) return res.status(404).render("error", { message: "Site introuvable." });
    const target = String(req.body.target || "");
    const back = landing(req, SLUG_OF[engine.byKey(s.scope, target) ? engine.byKey(s.scope, target).group : target] || "", s.scope);
    try {
      const r = engine.reset(s.scope, target, ctxOf(req), { confirm: req.body.confirm === "1", actor: req });
      if (r.ok) flash(req, "ok", r.changed.length ? "Valeur par défaut rétablie." : "Ce réglage a déjà sa valeur par défaut.");
      else if (r.confirmRequired) flash(req, "error", `Réglage sensible : confirmez la réinitialisation (${r.confirmRequired.map((c) => c.label).join(", ")}).`);
      else flash(req, "error", r.errors.join(" "));
    } catch (error) { if (error.status) return fail(res, error); return next(error); }
    res.redirect(back);
  });

  // ----- Avancé : plateforme (lecture seule) et préférences personnelles -----
  router.get("/site-web/parametres/avance", need("settings.read"), (req, res) => {
    const s = scopeOf(req);
    if (s.missing) return res.status(404).render("error", { message: "Site introuvable." });
    res.render("marketing/settings-advanced", { title: "Paramètres · Avancé", active: "parametres/avance", BASE, SLUGS, SLUG_OF, scope: s.scope, q: q(s.scope), sites: sitesFor(req), siteOnly: req.mk.siteOnly, groups: visibleGroups(req, s.scope).map(([g, d]) => ({ key: g, label: d.label, slug: SLUG_OF[g] })), platform: engine.platform(), prefs: engine.userPrefs(req.session.user.id), settingsJs: true, frame: inFrame(req), canTeam: !req.mk.siteOnly });
  });

  return router;
};
module.exports.BASE = BASE;
module.exports.SLUGS = SLUGS;
