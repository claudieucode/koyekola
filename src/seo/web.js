// Mon espace → SEO : vue d'ensemble, réglages, contenus (réglages SEO de chaque page), journal des modifications.
// Accès : contrôle unique (access.canManage) ; aujourd'hui tout formateur. Toutes les données affichées sont réelles.
const express = require("express");
const db = require("../config/database");
const { requireInstructor } = require("../middlewares/auth");
const settings = require("./settings");
const meta = require("./meta");
const entities = require("./entities");
const { listChanges } = require("./store");
const { inspect } = require("./inspect");
const images = require("./images");
const redirects = require("./redirects");
const notfound = require("./notfound");
const robots = require("./robots");
const sitemap = require("./sitemap");

const router = express.Router();
const canManage = (user) => Boolean(user && user.role === "formateur");
router.use("/formateur/seo", requireInstructor, (req, res, next) => (canManage(req.session.user) ? next() : res.status(403).render("error", { message: "Accès réservé à l'administration SEO." })));

const mediaImages = () => db.prepare("SELECT path, alt, width, height FROM media WHERE kind = 'image' ORDER BY id DESC LIMIT 300").all();
const FIELD_LABELS = { ...Object.fromEntries(Object.entries(meta.FIELDS).map(([k, f]) => [k, f.label])), ...Object.fromEntries(Object.entries(settings.FIELDS).map(([k, f]) => [k, f.label])) };

router.get("/formateur/seo", (req, res) => {
  const all = entities.list();
  const counts = {};
  for (const e of all) counts[e.type] = (counts[e.type] || 0) + 1;
  const custom = db.prepare("SELECT entity_type, COUNT(*) n FROM seo_meta GROUP BY entity_type").all();
  const st = settings.all();
  const logo = st.org_logo ? images.probe(st.org_logo) : null;
  res.render("seo/overview", {
    counts, custom: Object.fromEntries(custom.map((r) => [r.entity_type, r.n])), labels: entities.LABELS, st,
    status: [
      { label: "Logo de l'organisation", value: !st.org_logo ? "Configuration requise" : logo && logo.exists ? `${logo.width || "?"} × ${logo.height || "?"} px` : "Fichier introuvable", ok: Boolean(logo && logo.exists) },
      { label: "Profils sociaux officiels", value: st.social_profiles.length ? `${st.social_profiles.length} renseigné(s)` : "Configuration requise", ok: st.social_profiles.length > 0 },
      { label: "Image de partage par défaut", value: st.default_social_image ? (images.probe(st.default_social_image).exists ? "Renseignée" : "Fichier introuvable") : "Non renseignée", ok: Boolean(st.default_social_image && images.probe(st.default_social_image).exists) },
      { label: "Adresse publique (SITE_URL)", value: process.env.SITE_URL ? process.env.SITE_URL : "Configuration requise", ok: Boolean(process.env.SITE_URL) },
    ],
    changes: listChanges({ limit: 8 }), fieldLabels: FIELD_LABELS,
  });
});

router.get("/formateur/seo/reglages", (req, res) => {
  res.render("seo/settings", { fields: settings.FIELDS, groups: settings.GROUPS, values: settings.all(), media: mediaImages(), errors: [], saved: req.query.ok === "1" });
});
router.post("/formateur/seo/reglages", (req, res) => {
  const input = {};
  for (const [k, f] of Object.entries(settings.FIELDS)) {
    if (f.type === "bool") input[k] = req.body[k] === "1" ? "1" : "0";
    else if (Object.hasOwn(req.body, k)) input[k] = req.body[k];
  }
  const r = settings.save(input, req.session.user.id);
  if (!r.ok) return res.status(400).render("seo/settings", { fields: settings.FIELDS, groups: settings.GROUPS, values: { ...settings.all(), ...req.body }, media: mediaImages(), errors: r.errors, saved: false });
  res.redirect("/formateur/seo/reglages?ok=1");
});

router.get("/formateur/seo/contenus", (req, res) => {
  const type = String(req.query.type || "");
  const q = String(req.query.q || "").trim().toLowerCase();
  const customKeys = new Set(db.prepare("SELECT entity_type || ':' || entity_key k FROM seo_meta").all().map((r) => r.k));
  const courseCustom = new Set(db.prepare("SELECT id FROM courses WHERE (seo_title IS NOT NULL AND seo_title <> '') OR (seo_description IS NOT NULL AND seo_description <> '')").all().map((r) => `course:${r.id}`));
  const list = entities.list().filter((e) => (!type || e.type === type) && (!q || e.name.toLowerCase().includes(q) || e.path.includes(q)))
    .map((e) => ({ ...e, custom: customKeys.has(`${e.type}:${e.key}`) || courseCustom.has(`${e.type}:${e.key}`) }));
  res.render("seo/contents", { list, labels: entities.LABELS, type, q });
});

async function renderEntity(req, res, { errors = [], status = 200, values = null } = {}) {
  const { type, key } = req.params;
  const entity = entities.find(type, key);
  if (!entity || type === "post") return res.status(404).render("error", { message: "Contenu introuvable." });
  const stored = meta.stored(type, key);
  // Contrôle qualité : ce que la page publique publie réellement, comparé à ce qui est enregistré
  const live = await inspect(entity.path, { host: req.get("host") });
  const checks = [];
  if (live.page) {
    const p = live.page;
    const want = (field, actual, label) => { if (stored[field]) checks.push({ label, ok: actual ? actual.includes(stored[field]) : false, stored: stored[field], actual: actual || "(absent)" }); };
    want("seo_title", p.title, "Titre SEO → <title>");
    want("seo_description", p.description, "Méta description → meta description");
    want("canonical_url", p.canonical, "URL canonique → link canonical");
    want("og_title", p.og["og:title"], "Titre de partage → og:title");
    want("og_description", p.og["og:description"], "Description de partage → og:description");
    if (stored.og_image_path) checks.push({ label: "Image de partage → og:image", ok: Boolean(p.og["og:image"] && p.og["og:image"].endsWith(stored.og_image_path)), stored: stored.og_image_path, actual: p.og["og:image"] || "(absente : fichier introuvable ?)" });
    if (stored.robots_index !== null || stored.robots_follow !== null) {
      const expected = `${stored.robots_index === 0 ? "noindex" : "index"}, ${stored.robots_follow === 0 ? "nofollow" : "follow"}`;
      checks.push({ label: "Indexation → meta robots", ok: expected === "index, follow" ? !p.robots || p.robots === "index, follow" : p.robots === expected, stored: expected, actual: p.robots || "(aucune : index, follow)" });
    }
  }
  res.status(status).render("seo/entity", {
    entity, typeLabel: entities.LABELS[type], fields: meta.FIELDS, values: values || stored, media: mediaImages(), errors, saved: req.query.ok === "1",
    live, checks, changes: listChanges({ entityType: type, entityKey: key, limit: 20 }), fieldLabels: FIELD_LABELS,
  });
}
router.get("/formateur/seo/contenus/:type/:key", (req, res, next) => renderEntity(req, res).catch(next));
router.post("/formateur/seo/contenus/:type/:key", (req, res, next) => {
  const { type, key } = req.params;
  if (!entities.find(type, key) || type === "post") return res.status(404).render("error", { message: "Contenu introuvable." });
  const input = {};
  for (const k of Object.keys(meta.FIELDS)) if (Object.hasOwn(req.body, k)) input[k] = req.body[k];
  const r = meta.save(type, key, input, req.session.user.id);
  if (!r.ok) return renderEntity(req, res, { errors: r.errors, status: 400, values: { ...meta.stored(type, key), ...input } }).catch(next);
  res.redirect(`/formateur/seo/contenus/${type}/${encodeURIComponent(key)}?ok=1`);
});

router.get("/formateur/seo/journal", (req, res) => {
  res.render("seo/journal", { changes: listChanges({ limit: 300 }), fieldLabels: FIELD_LABELS, labels: { ...entities.LABELS, settings: "Réglages" } });
});

// ---------- Redirections ----------
function renderRedirects(req, res, { errors = [], form = {}, status = 200, report = null } = {}) {
  res.status(status).render("seo/redirects", {
    list: redirects.list({ q: String(req.query.q || "") }), q: String(req.query.q || ""), chains: redirects.chains(), errors, form,
    saved: req.query.ok || null, report, edit: req.query.modifier ? redirects.get(Number(req.query.modifier)) : null,
  });
}
router.get("/formateur/seo/redirections", (req, res) => renderRedirects(req, res, { form: { source: String(req.query.source || ""), target: "", status: 301 } }));
router.post("/formateur/seo/redirections", (req, res) => {
  const r = redirects.create({ source: req.body.source, target: req.body.target, status: req.body.status, note: req.body.note }, req.session.user.id);
  if (!r.ok) return renderRedirects(req, res, { errors: r.errors, form: req.body, status: 400 });
  notfound.remove(redirects.normalizePath(req.body.source)); // l'adresse introuvable est désormais redirigée
  res.redirect("/formateur/seo/redirections?ok=cree");
});
router.post("/formateur/seo/redirections/:id(\\d+)", (req, res) => {
  const r = redirects.update(Number(req.params.id), { source: req.body.source, target: req.body.target, status: req.body.status, note: req.body.note, enabled: req.body.enabled === "1" ? "1" : "0" }, req.session.user.id);
  if (!r.ok) return renderRedirects(req, res, { errors: r.errors, form: req.body, status: 400 });
  res.redirect("/formateur/seo/redirections?ok=modifiee");
});
router.post("/formateur/seo/redirections/:id(\\d+)/supprimer", (req, res) => {
  redirects.remove(Number(req.params.id), req.session.user.id);
  res.redirect("/formateur/seo/redirections?ok=supprimee");
});
router.post("/formateur/seo/redirections/:id(\\d+)/raccourcir", (req, res) => {
  const r = redirects.fixChain(Number(req.params.id), req.session.user.id);
  if (!r.ok) return renderRedirects(req, res, { errors: r.errors, status: 400 });
  res.redirect("/formateur/seo/redirections?ok=raccourcie");
});
router.post("/formateur/seo/redirections/import", (req, res) => {
  const report = redirects.importCsv(String(req.body.csv || ""), req.session.user.id);
  renderRedirects(req, res, { report });
});
router.get("/formateur/seo/redirections.csv", (req, res) => {
  res.type("text/csv; charset=utf-8").set("Content-Disposition", 'attachment; filename="redirections-kolakisa.csv"').send(`\ufeff${redirects.exportCsv()}`);
});

// ---------- Erreurs 404 ----------
router.get("/formateur/seo/erreurs-404", (req, res) => {
  const filter = ["all", "human", "bot", "ignored"].includes(req.query.filtre) ? req.query.filtre : "all";
  res.render("seo/notfound", { list: notfound.list({ filter, q: String(req.query.q || "") }), stats: notfound.stats(), filter, q: String(req.query.q || ""), done: req.query.ok || null });
});
router.post("/formateur/seo/erreurs-404/action", (req, res) => {
  const path = String(req.body.path || "");
  if (req.body.action === "ignorer") notfound.setIgnored(path, true);
  else if (req.body.action === "retablir") notfound.setIgnored(path, false);
  else if (req.body.action === "supprimer") notfound.remove(path);
  res.redirect("/formateur/seo/erreurs-404?ok=1");
});

// ---------- robots.txt et plan du site ----------
router.get("/formateur/seo/technique", (req, res) => {
  const map = sitemap.entries();
  res.render("seo/technical", {
    robotsText: robots.text(req), robotsProblems: robots.check(settings.get("robots_custom")), conflicts: robots.conflicts(req, map.included.map((e) => e.path)),
    included: map.included, excluded: map.excluded,
  });
});

module.exports = { router, canManage };
