// Centre de gestion (Mon espace → Centre de gestion) : ventes, élèves, analytics, ressources, activité.
// Réservé au formateur connecté (vérifié ici, côté serveur) ; chaque formateur ne voit que les données de SES formations.
// Pages rendues par le serveur : filtres, recherche, tri et pagination passent dans l'adresse (rafraîchissement,
// précédent / suivant et liens partagés conservent l'état). Une erreur de chargement affiche « Réessayer ».
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const db = require("../config/database");
const { requireInstructor } = require("../middlewares/auth");
const { IMAGE_TYPES, VIDEO_TYPES, AUDIO_TYPES } = require("../middlewares/upload");
const { uploadsRoot } = require("../config/paths");
const { removeUploadedFile } = require("../utils/uploads");
const blog = require("../services/blog");
const seoImages = require("../seo/images");
const common = require("../services/gestion/common");
const sales = require("../services/gestion/sales");
const students = require("../services/gestion/students");
const analytics = require("../services/gestion/analytics");
const resources = require("../services/gestion/resources");
const activity = require("../services/gestion/activity");

const router = express.Router();
router.use("/formateur/gestion", requireInstructor);

const me = (req) => req.session.user.id;
function flash(req, type, text) { req.session.gFlash = { type, text }; }
// Adresse de la page avec des paramètres modifiés (filtres, tri, pagination) : l'état reste dans l'URL
function urlFor(req) {
  return (over = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...req.query, ...over })) if (v !== undefined && v !== null && v !== "" && !(k === "page" && String(v) === "1")) q.set(k, String(v));
    const s = q.toString();
    return `${req.baseUrl}${req.path}${s ? `?${s}` : ""}`;
  };
}
function takeFlash(req) { const f = req.session.gFlash || null; delete req.session.gFlash; return f; }
// Rendu commun : message éventuel, et page d'erreur avec « Réessayer » (même adresse) si une requête échoue
function page(view, title, build) {
  return (req, res) => {
    let data;
    try { data = build(req, res); } catch (error) {
      console.error(`[KOLAKISA] Centre de gestion (${req.path}) :`, error.stack || error.message);
      // Détail technique affiché au formateur (page réservée) : permet d'identifier la cause sans accès aux journaux
      return res.status(500).render("gestion/erreur", { title, retry: req.originalUrl, back: backOf(req.path), detail: String(error.message || error).slice(0, 300) });
    }
    if (data === null) return res.status(404).render("gestion/erreur", { title: "Introuvable", notFound: true, retry: null, back: backOf(req.path) });
    if (data === undefined) return; // réponse déjà envoyée (redirection)
    res.render(view, { title, flash: takeFlash(req), query: req.query, url: urlFor(req), ...data });
  };
}
// Action (formulaire) : une erreur inattendue ne montre jamais une page brute ; le formateur revient sur la page
// d'origine avec un message clair et le détail technique
function safely(back, fn) {
  return (req, res, next) => {
    try { return fn(req, res, next); } catch (error) {
      console.error(`[KOLAKISA] Centre de gestion (${req.method} ${req.path}) :`, error.stack || error.message);
      flash(req, "error", `L'action n'a pas abouti. Détail technique : ${String(error.message || error).slice(0, 200)}`);
      return res.redirect(back);
    }
  };
}
// Bouton « Retour » : le niveau parent réel (jamais history.back())
function backOf(p) {
  if (/^\/formateur\/gestion\/ventes\/commandes\/\d+/.test(p)) return { href: "/formateur/gestion/ventes", label: "Retour aux commandes" };
  if (/^\/formateur\/gestion\/eleves\/\d+/.test(p)) return { href: "/formateur/gestion/eleves", label: "Retour aux élèves" };
  if (/^\/formateur\/gestion\/ventes\/.+/.test(p)) return { href: "/formateur/gestion/ventes", label: "Retour aux ventes" };
  if (/^\/formateur\/gestion\/.+/.test(p)) return { href: "/formateur/gestion", label: "Retour au Centre de gestion" };
  return { href: "/formateur", label: "Retour à Mon espace" };
}
router.use("/formateur/gestion", (req, res, next) => { res.locals.back = backOf(req.path === "/" ? "/formateur/gestion" : `/formateur/gestion${req.path}`); next(); });

// ---------- Vue d'ensemble ----------
router.get("/formateur/gestion", page("gestion/index", "Centre de gestion", (req) => {
  const id = me(req);
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  // Chaque bloc est calculé séparément : un bloc en échec affiche « Données indisponibles », les autres restent justes
  const problems = [];
  const safe = (label, fn, fallback = null) => {
    try { return fn(); } catch (error) {
      console.error(`[KOLAKISA] Centre de gestion · Vue d'ensemble (${label}) :`, error.message);
      problems.push({ label, message: error.message });
      return fallback;
    }
  };
  const p30 = common.period({ periode: "30j" });
  const SALES = "FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN courses c ON c.id = oi.course_id WHERE c.instructor_id = ?";
  return {
    overview: {
      orders: safe("Ventes", () => one(`SELECT COUNT(DISTINCT o.id) n ${SALES}`, id).n),
      revenue30: safe("Ventes", () => one(`SELECT COALESCE(SUM(oi.price_cents), 0) s ${SALES} AND o.created_at >= ? AND o.created_at < ?`, id, p30.from, p30.to).s),
      coupons: safe("Codes promo", () => sales.listCoupons(id).filter((c) => c.state.key === "on").length),
      students: safe("Élèves", () => one("SELECT COUNT(DISTINCT e.user_id) n FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.instructor_id = ?", id).n),
      enrollments30: safe("Élèves", () => one("SELECT COUNT(*) n FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.instructor_id = ? AND e.created_at >= ? AND e.created_at < ?", id, p30.from, p30.to).n),
      // Nombre de fichiers seulement : les utilisations (coûteuses) ne sont calculées que dans Ressources
      resources: safe("Ressources", () => { const all = resources.allResources(id); if (all.problems.length) throw new Error(all.problems.map((x) => `${x.label} : ${x.message}`).join(" · ")); return all.length; }),
      unread: safe("Notifications", () => activity.unreadCount(id)),
      alerts: safe("Alertes", () => activity.alerts(id), []),
      recent: safe("Activité récente", () => activity.feed(id, { page: 1 }).rows.slice(0, 6), []),
    },
    problems,
  };
}));

// ---------- Ventes ----------
router.get("/formateur/gestion/ventes", page("gestion/ventes", "Ventes", (req) => ({ tab: "commandes", orders: sales.listOrders(me(req), req.query), courses: sales.myCourses(me(req)) })));
router.get("/formateur/gestion/ventes/commandes", (req, res) => res.redirect(301, `/formateur/gestion/ventes${req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : ""}`));
router.get("/formateur/gestion/ventes/commandes/:id(\\d+)", (req, res, next) => page("gestion/commande", `Commande #${req.params.id}`, (r) => sales.getOrder(me(r), Number(r.params.id)) || null)(req, res, next));
router.get("/formateur/gestion/ventes/transactions", page("gestion/ventes", "Transactions", (req) => ({ tab: "transactions", simulatedOrders: db.prepare("SELECT COUNT(DISTINCT o.id) n FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN courses c ON c.id = oi.course_id WHERE c.instructor_id = ?").get(me(req)).n })));
router.get("/formateur/gestion/ventes/remboursements", page("gestion/ventes", "Remboursements", () => ({ tab: "remboursements" })));
router.get("/formateur/gestion/ventes/coupons", page("gestion/ventes", "Codes promo", (req) => {
  const editing = req.query.modifier ? sales.getCoupon(me(req), Number(req.query.modifier)) : null;
  return { tab: "coupons", coupons: sales.listCoupons(me(req)), courses: sales.myCourses(me(req)), editing, form: editing ? formOf(editing) : { active: 1, kind: "percent" }, errors: {} };
}));
// Valeurs du formulaire à partir d'un code enregistré (dates affichées en jour de Paris)
function formOf(c) {
  const day = (v, end) => { if (!v) return ""; const d = new Date(`${v.replace(" ", "T")}Z`); if (end) d.setTime(d.getTime() - 1000); return new Intl.DateTimeFormat("en-CA", { timeZone: common.TZ }).format(d); };
  return { code: c.code, kind: c.kind, value: c.kind === "fixed" ? (c.value / 100).toFixed(2) : String(c.value), course_id: c.course_id || "", starts_at: day(c.starts_at), expires_at: day(c.expires_at, true), max_uses: c.max_uses || "", active: c.active };
}
function couponForm(req, res, current) {
  const v = sales.validateCoupon(me(req), req.body || {}, current ? current.id : null);
  if (v.errors) {
    return res.status(400).render("gestion/ventes", { title: "Codes promo", tab: "coupons", url: urlFor(req), flash: { type: "error", text: "Le code promo n'a pas été enregistré : corrigez les champs signalés." }, query: {}, coupons: sales.listCoupons(me(req)), courses: sales.myCourses(me(req)), editing: current, form: { ...req.body, active: req.body.active ? 1 : 0 }, errors: v.errors });
  }
  if (current) { sales.updateCoupon(me(req), current.id, v.values); flash(req, "ok", `Code ${v.values.code} modifié.`); }
  else { sales.createCoupon(me(req), v.values); flash(req, "ok", `Code ${v.values.code} créé${v.values.active ? " et actif" : " (désactivé)"}.`); }
  res.redirect("/formateur/gestion/ventes/coupons");
}
router.post("/formateur/gestion/ventes/coupons", safely("/formateur/gestion/ventes/coupons", (req, res) => couponForm(req, res, null)));
router.post("/formateur/gestion/ventes/coupons/:id(\\d+)", safely("/formateur/gestion/ventes/coupons", (req, res) => {
  const c = sales.getCoupon(me(req), Number(req.params.id));
  if (!c) return res.status(404).render("gestion/erreur", { title: "Introuvable", notFound: true, back: backOf(req.path) });
  couponForm(req, res, c);
}));
router.post("/formateur/gestion/ventes/coupons/:id(\\d+)/:action(activer|desactiver|supprimer)", safely("/formateur/gestion/ventes/coupons", (req, res) => {
  const c = sales.getCoupon(me(req), Number(req.params.id));
  if (!c) { flash(req, "error", "Code promo introuvable."); return res.redirect("/formateur/gestion/ventes/coupons"); }
  if (req.params.action === "supprimer") { sales.deleteCoupon(me(req), c.id); flash(req, "ok", `Code ${c.code} supprimé (les commandes passées conservent leur remise).`); }
  else { sales.setCouponActive(me(req), c.id, req.params.action === "activer"); flash(req, "ok", `Code ${c.code} ${req.params.action === "activer" ? "activé" : "désactivé"}.`); }
  res.redirect("/formateur/gestion/ventes/coupons");
}));

// ---------- Élèves ----------
router.get("/formateur/gestion/eleves", page("gestion/eleves", "Élèves", (req) => ({ list: students.listStudents(me(req), req.query), courses: sales.myCourses(me(req)) })));
router.get("/formateur/gestion/eleves/:id(\\d+)", page("gestion/eleve", "Élève", (req, res) => {
  const s = students.getStudent(me(req), Number(req.params.id));
  return s ? { ...s, title: s.user.username } : null;
}));

// ---------- Analytics ----------
router.get("/formateur/gestion/analytics", page("gestion/analytics", "Analytics", (req) => {
  const p = common.period(req.query);
  return { period: p, periods: common.PERIODS, report: analytics.report(me(req), p) };
}));

// ---------- Ressources ----------
router.get("/formateur/gestion/ressources", page("gestion/ressources", "Ressources", (req) => ({ list: resources.listResources(me(req), req.query), kinds: resources.KIND_LABELS, sources: resources.SOURCE_LABELS })));
// Envoi réel vers la médiathèque du site : dossier et extension choisis d'après le VRAI type du fichier (jamais son nom)
const TYPES = { ...Object.fromEntries(Object.entries(IMAGE_TYPES).map(([m, e]) => [m, ["image", "thumbnails", e]])), ...Object.fromEntries(Object.entries(VIDEO_TYPES).map(([m, e]) => [m, ["video", "blog", e]])), ...Object.fromEntries(Object.entries(AUDIO_TYPES).map(([m, e]) => [m, ["audio", "blog", e]])) };
const resourceUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(uploadsRoot, TYPES[file.mimetype][1])),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${TYPES[file.mimetype][2]}`),
  }),
  fileFilter: (req, file, cb) => cb(null, Boolean(TYPES[file.mimetype])),
  limits: { fileSize: 300 * 1024 * 1024, files: 10 },
}).array("fichiers", 10);
router.post("/formateur/gestion/ressources", (req, res) => {
  resourceUpload(req, res, (err) => { try {
    if (err) { flash(req, "error", err.code === "LIMIT_FILE_SIZE" ? "Fichier trop lourd (300 Mo au plus)." : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE" ? "10 fichiers au plus par envoi." : `Envoi impossible. Détail technique : ${String(err.message || err).slice(0, 200)}`); return res.redirect("/formateur/gestion/ressources"); }
    const files = req.files || [];
    const refused = Math.max(0, Number(req.body.count || 0) - files.length);
    if (!files.length) { flash(req, "error", "Aucun fichier accepté : images (JPEG, PNG, WebP, GIF, AVIF), vidéos (MP4, WebM, MOV) ou audio (MP3, M4A, AAC, OGG, WAV)."); return res.redirect("/formateur/gestion/ressources"); }
    const added = files.map((f) => {
      const [kind, dir] = TYPES[f.mimetype];
      let dims = null;
      if (kind === "image") { try { dims = seoImages.readDimensions(fs.readFileSync(f.path)); } catch { dims = null; } }
      // multer lit le nom d'origine en latin-1 : « Bannière » arriverait en « BanniÃ¨re » ; relu en UTF-8
      const utf8 = Buffer.from(String(f.originalname || ""), "latin1").toString("utf8");
      const title = (utf8.includes("\uFFFD") ? String(f.originalname || "") : utf8).replace(/\.[a-z0-9]{1,8}$/i, "").replace(/[\r\n]+/g, " ").slice(0, 200);
      return blog.addMedia({ path: `/uploads/${dir}/${f.filename}`, kind, mime: f.mimetype, size: f.size, width: dims && dims.width, height: dims && dims.height, title, userId: me(req) });
    });
    flash(req, "ok", `${added.length} fichier(s) ajouté(s) à la médiathèque du site${refused ? ` · ${refused} refusé(s) (type non pris en charge)` : ""}.`);
    res.redirect("/formateur/gestion/ressources?source=site");
  } catch (error) {
    console.error("[KOLAKISA] Centre de gestion (envoi de fichiers) :", error.stack || error.message);
    flash(req, "error", `L'envoi n'a pas abouti. Détail technique : ${String(error.message || error).slice(0, 200)}`);
    res.redirect("/formateur/gestion/ressources");
  } });
});
router.post("/formateur/gestion/ressources/:id(\\d+)/supprimer", safely("/formateur/gestion/ressources", (req, res) => {
  const m = blog.getMedia(Number(req.params.id));
  if (!m) { flash(req, "error", "Fichier introuvable."); return res.redirect("/formateur/gestion/ressources"); }
  let usage;
  try { usage = blog.imageReferences(m.path); } catch (error) {
    console.error("[KOLAKISA] Centre de gestion · suppression (utilisations) :", error.message);
    flash(req, "error", "Suppression refusée par sécurité : impossible de vérifier si ce fichier est encore utilisé.");
    return res.redirect("/formateur/gestion/ressources");
  }
  if (usage.length) { flash(req, "error", `« ${m.title || path.basename(m.path)} » est encore utilisé : ${usage.slice(0, 4).join(", ")}${usage.length > 4 ? "…" : ""}. Retirez-le d'abord de ces endroits.`); return res.redirect("/formateur/gestion/ressources"); }
  db.prepare("DELETE FROM media WHERE id = ?").run(m.id);
  removeUploadedFile(m.path, "supprimée depuis le Centre de gestion (Ressources)");
  for (const v of blog.imageVariants(m.path)) removeUploadedFile(v.src, "version réduite d'une image supprimée");
  flash(req, "ok", `« ${m.title || path.basename(m.path)} » supprimé.`);
  res.redirect(`/formateur/gestion/ressources${req.body.retour && /^\?[\w=&%.+-]*$/.test(req.body.retour) ? req.body.retour : ""}`);
}));

// ---------- Activité et notifications ----------
router.get("/formateur/gestion/activite", page("gestion/activite", "Activité", (req) => {
  const view = ["notifications", "alertes"].includes(req.query.vue) ? req.query.vue : "activite";
  return { view, feed: view === "alertes" ? null : activity.feed(me(req), { ...req.query, vue: view }), alerts: activity.alerts(me(req)), types: activity.TYPES, unread: activity.unreadCount(me(req)) };
}));
// Ouvrir une notification : marquée comme lue, puis redirection vers l'élément réel (adresse calculée par le serveur)
router.get("/formateur/gestion/activite/ouvrir", safely("/formateur/gestion/activite", (req, res) => {
  const it = activity.markRead(me(req), String(req.query.cle || ""));
  if (!it) { flash(req, "error", "Cet élément n'existe plus."); return res.redirect("/formateur/gestion/activite"); }
  res.redirect(it.href || "/formateur/gestion/activite?vue=notifications");
}));
router.post("/formateur/gestion/activite/lu", safely("/formateur/gestion/activite?vue=notifications", (req, res) => {
  if (!activity.markRead(me(req), String(req.body.cle || ""))) flash(req, "error", "Cet élément n'existe plus.");
  res.redirect(`/formateur/gestion/activite?vue=notifications${req.body.etat === "non-lu" ? "&etat=non-lu" : ""}`);
}));
router.post("/formateur/gestion/activite/tout-lu", safely("/formateur/gestion/activite?vue=notifications", (req, res) => {
  activity.markAllRead(me(req));
  flash(req, "ok", "Toutes les notifications sont marquées comme lues.");
  res.redirect("/formateur/gestion/activite?vue=notifications");
}));

module.exports = router;
