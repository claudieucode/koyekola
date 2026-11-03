// KOLAKISA CMS → Paramètres → Confidentialité : deux onglets (Réglages · Guide de politique).
// Aucun second système : la page de politique est le réglage « privacy_page » du moteur (services/settings) — mêmes droits, mêmes validations, même journal, même isolation par site.
// Ce fichier calcule l'ÉTAT réel (page associée, publiée, brouillon, supprimée, d'un autre site), crée une VRAIE page du CMS (pages.createPage) et sert le guide (services/privacy).
// Le site vient de l'adresse vérifiée par le serveur (« ?site= », espace d'un site), jamais d'un corps de requête.
const engine = require("../../services/settings");
const db = require("../../config/database");
const pages = require("../pages");
const guideService = require("../../services/privacy");
const target = require("./siteTarget");
const { safeJson } = require("./kit");

const KEYS = ["privacy_page", "analytics_retention_days"];
const POLICY_NAME = "Politique de confidentialité";

const ctxOf = (req) => ({ ...req.mk.ctx, can: req.mk.can, orgLevel: !req.mk.siteOnly });
const pageRow = (id, org) => db.prepare("SELECT id, name, slug, site_id, status, archived_at, kind, organization_id, updated_at FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(id, org);
const editUrl = (id) => `/marketing/pages/${id}/editeur?retour=pages`;

// Pages du site actif que l'on peut associer (non archivées, hors étapes de tunnel) — jamais celles d'un autre site
function choices(org, siteId) {
  return db.prepare("SELECT id, name, status, kind FROM mk_landing_pages WHERE organization_id = ? AND site_id IS ? AND archived_at IS NULL AND kind <> 'step' ORDER BY name COLLATE NOCASE LIMIT 300").all(org, siteId)
    .map((p) => ({ id: p.id, name: p.name, status: p.status, published: p.status === "published" }));
}

// État réel de la politique : calculé à partir de la base, jamais simulé
function stateOf(req, t) {
  const scope = { siteId: t.siteId };
  const ctx = ctxOf(req);
  const org = req.mk.ctx.organizationId;
  const values = engine.readAll(scope, ctx);
  const raw = values.privacy_page.value;
  const id = /^\d+$/.test(String(raw ?? "")) ? Number(raw) : null;
  const list = choices(org, t.siteId);
  const likely = list.filter((p) => guideService.NAME_RE.test(p.name));
  const out = { id, state: "none", label: "", detail: "", page: null, candidates: likely.map((p) => ({ id: p.id, name: p.name, published: p.published })), links: null };
  if (!id) {
    if (likely.length) { out.state = "draft_available"; out.label = likely.some((p) => !p.published) ? "Une page de politique existe, non associée" : "Une page de politique publiée existe, non associée"; out.detail = `« ${likely[0].name} » ressemble à votre politique : sélectionnez-la ci-dessous pour l'associer au site.`; }
    else { out.state = "none"; out.label = "Aucune page sélectionnée"; out.detail = "Créez une page de politique de confidentialité ou sélectionnez-en une existante."; }
    return out;
  }
  const row = pageRow(id, org);
  if (!row) { out.state = "unavailable"; out.label = "Page sélectionnée indisponible"; out.detail = "La page associée a été supprimée. Sélectionnez-en une autre ou créez-en une nouvelle."; return out; }
  out.page = { id: row.id, name: row.name, status: row.status, edit: editUrl(row.id), preview: `/marketing/pages/${row.id}/apercu` };
  if (row.archived_at) { out.state = "unavailable"; out.label = "Page sélectionnée indisponible"; out.detail = "La page associée est dans la corbeille : les visiteurs n'y ont pas accès. Restaurez-la ou choisissez-en une autre."; }
  else if ((row.site_id ?? null) !== (t.siteId ?? null)) { out.state = "unavailable"; out.label = "Page sélectionnée indisponible"; out.detail = "La page associée n'appartient pas à ce site. Choisissez une page de ce site."; }
  else if (row.status !== "published") { out.state = "draft"; out.label = "Page associée, pas encore publiée"; out.detail = "Le lien de confidentialité n'apparaît pas encore pour les visiteurs : publiez la page pour qu'il s'affiche."; }
  else {
    out.state = "published"; out.label = "Page publiée et associée";
    out.detail = t.siteId ? "Un lien « Confidentialité » s'affiche dans le pied de page des pages du site." : "Un lien « Politique de confidentialité » s'affiche dans le bandeau de consentement du site.";
    try { out.page.publicUrl = require("../../services/urls").pagePath(row, { hostSite: null }); } catch { /* adresse publique non calculable : non affichée */ }
  }
  return out;
}

function build(req, t) {
  const scope = { siteId: t.siteId };
  const ctx = ctxOf(req);
  const org = req.mk.ctx.organizationId;
  const values = engine.readAll(scope, ctx);
  const defs = Object.fromEntries(engine.defsFor(scope).filter((d) => KEYS.includes(d.key)).map((d) => [d.key, d]));
  const q = t.siteId ? `?site=${t.siteId}` : "";
  const editable = (k) => Boolean(defs[k]) && !t.readOnly && ctx.can(defs[k].perm) && (!defs[k].sensitive || ctx.can("settings.sensitive"));
  return {
    siteId: t.siteId, siteName: t.name, principal: t.principal, readOnly: t.readOnly, q,
    policy: stateOf(req, t), pages: choices(org, t.siteId),
    canSelect: editable("privacy_page"), canCreate: !t.readOnly && req.mk.can("forms.write"),
    retention: defs.analytics_retention_days ? { value: values.analytics_retention_days.value, def: values.analytics_retention_days.default, min: defs.analytics_retention_days.min, max: defs.analytics_retention_days.max, editable: editable("analytics_retention_days") } : null,
    guide: guideService.guide({ db, organizationId: org, siteId: t.siteId, can: req.mk.can }),
    api: `/marketing/site-web/parametres/api/confidentialite${q}`,
    links: { pages: t.siteId ? `/marketing/site-web/sites/${t.siteId}/pages` : "/marketing/pages", footer: t.siteId ? `/marketing/site-web/sites/${t.siteId}/constructeur-de-theme?type=footer` : "/marketing/site-web/apparence/pied-de-page", menus: `/marketing/site-web/apparence/menus${q}` },
  };
}

function render(req, res, t, extra = {}) {
  const data = build(req, t);
  res.set("Cache-Control", "no-store");
  const tab = req.query.onglet === "guide" ? "guide" : "reglages";
  res.render("marketing/privacy", { title: "Confidentialité", active: "parametres/confidentialite", T: t, P: data, tab, bootJson: safeJson({ ...data, tab }), privacyJs: true, ...extra });
}

// Routes JSON (montées dans l'API des paramètres, avant les routes « /:key »)
function apiRoutes(api) {
  const json = (res, status, body) => res.status(status).set("Cache-Control", "no-store").json(body);
  const siteOf = (req, res) => {
    const t = target(req, res, { json: true }); if (!t) return null;
    if (!t.siteId && req.mk.siteOnly) { json(res, 403, { error: "Les réglages du site principal sont réservés à l'équipe de l'organisation." }); return null; }
    return t;
  };
  const state = (req, t) => { const d = build(req, t); return { policy: d.policy, pages: d.pages, retention: d.retention, canSelect: d.canSelect, canCreate: d.canCreate }; };
  const denied = (res, result) => {
    const forbidden = (result.errors || []).some((e) => /permission/i.test(e));
    return json(res, forbidden ? 403 : 422, { ok: false, errors: result.errors });
  };

  api.get("/confidentialite", (req, res) => {
    if (!req.mk.can("settings.read")) return json(res, 403, { error: "Permission « settings.read » requise." });
    const t = siteOf(req, res); if (!t) return;
    json(res, 200, { ok: true, ...state(req, t) });
  });

  // Enregistrement : { values: { privacy_page?, analytics_retention_days? } } — tout ou rien, validé par le moteur (page du bon site, droits, journal)
  api.put("/confidentialite", (req, res, next) => {
    const t = siteOf(req, res); if (!t) return;
    const values = req.body && typeof req.body.values === "object" && req.body.values && !Array.isArray(req.body.values) ? req.body.values : null;
    if (!values || !Object.keys(values).length) return json(res, 422, { ok: false, errors: ["Corps invalide : { values: { clé: valeur } } attendu."] });
    const foreign = Object.keys(values).filter((k) => !KEYS.includes(k));
    if (foreign.length) return json(res, 422, { ok: false, errors: [`Réglage étranger à cet écran : ${foreign.map((k) => String(k).slice(0, 30)).join(", ")}.`] });
    if (t.readOnly) return json(res, 403, { ok: false, errors: ["Ce site est archivé : ses réglages ne se modifient plus."] });
    try {
      const result = engine.update({ siteId: t.siteId }, values, ctxOf(req), { confirm: req.body.confirm === true, actor: req });
      if (!result.ok) return result.confirmRequired ? json(res, 409, { ok: false, confirmRequired: result.confirmRequired }) : denied(res, result);
      json(res, 200, { ok: true, changed: result.changed, ...state(req, t) });
    } catch (error) { if (error.status) return json(res, error.status, { ok: false, errors: [error.message] }); next(error); }
  });

  // Création d'une VRAIE page du site (pages.createPage), avec le modèle à compléter ; brouillon (publication = règles normales du CMS)
  api.post("/confidentialite/creer", (req, res, next) => {
    if (!req.mk.can("forms.write")) return json(res, 403, { ok: false, errors: ["Vous n'avez pas la permission de créer une page."] });
    const t = siteOf(req, res); if (!t) return;
    if (t.readOnly) return json(res, 403, { ok: false, errors: ["Ce site est archivé : on n'y crée plus de page."] });
    try {
      const current = stateOf(req, t);
      const existing = [];
      if (current.page && current.state !== "unavailable") existing.push({ id: current.page.id, name: current.page.name, status: current.page.status, edit: current.page.edit });
      for (const c of current.candidates) if (!existing.some((e) => e.id === c.id)) existing.push({ id: c.id, name: c.name, status: c.published ? "published" : "draft", edit: editUrl(c.id) });
      // Page déjà présente : jamais de doublon silencieux — on propose de l'ouvrir ; créer une autre exige une confirmation explicite
      if (existing.length && req.body.confirm !== true) return json(res, 409, { ok: false, exists: existing });
      const sections = guideService.template({ db, organizationId: req.mk.ctx.organizationId, siteId: t.siteId, can: req.mk.can });
      // Le nom d'une page est unique dans son site : une page supplémentaire (confirmée) reçoit un numéro
      const taken = (n) => db.prepare("SELECT 1 FROM mk_landing_pages WHERE organization_id = ? AND site_id IS ? AND name = ? COLLATE NOCASE").get(req.mk.ctx.organizationId, t.siteId, n);
      let name = POLICY_NAME; for (let i = 2; taken(name) && i < 50; i++) name = `${POLICY_NAME} (${i})`;
      const page = pages.createPage(req.mk.ctx, { name, siteId: t.siteId, kind: "page", sections });
      // Association automatique seulement s'il n'y en a pas déjà une valide et si la personne a le droit de modifier ce réglage
      let associated = false;
      if ((current.state === "none" || current.state === "draft_available" || current.state === "unavailable") && req.mk.can("settings.write")) {
        const r = engine.update({ siteId: t.siteId }, { privacy_page: page.id }, ctxOf(req), { actor: req });
        associated = Boolean(r.ok);
      }
      json(res, 201, { ok: true, page: { id: page.id, name: page.name }, edit: editUrl(page.id), associated, ...state(req, t) });
    } catch (error) { if (error.status || error.code) return json(res, error.status || 422, { ok: false, errors: [error.message] }); next(error); }
  });
}

module.exports = { render, build, stateOf, apiRoutes, KEYS };
