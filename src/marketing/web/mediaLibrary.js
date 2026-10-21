// KOLAKISA CMS — Médias (palier 3) : la médiathèque du CMS. Elle s'appuie sur le service existant (src/marketing/media :
// table mk_media, dossier des envois, signature des fichiers, détection d'usage) et sur lui seul : pas de second stockage.
// Page + API JSON (la même API sert le sélecteur partagé « MediaPicker », voir public/js/media-picker.js).
// Droits : voir (media.read), envoyer (media.upload), modifier et mettre à la corbeille (media.write), supprimer
// définitivement (media.delete). Chaque lecture et écriture est limitée à l'organisation de la personne connectée.
const express = require("express");
const multer = require("multer");
const media = require("../media");
const { MarketingError } = require("../errors");
const { need } = require("./kit");
const siteContent = require("../../services/siteContent");

const PER_PAGE = 48;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: media.MAX_UPLOAD, files: 1 } });
const MAX_FILES = 20; // fichiers par envoi « méthode du navigateur »
const uploadMany = multer({ storage: multer.memoryStorage(), limits: { fileSize: media.MAX_UPLOAD, files: MAX_FILES } });
// Les navigateurs envoient le nom en latin1 : on le relit en UTF-8
const originalNameOf = (file) => { const utf8 = Buffer.from(file.originalname, "latin1").toString("utf8"); return utf8.includes("�") ? file.originalname : utf8; };
const PERIODS = { jour: "Aujourd'hui", 7: "7 derniers jours", 30: "30 derniers jours", annee: "Cette année" };

// Début de période (UTC, comme les dates de la base)
function sinceOf(period) {
  const now = new Date();
  const iso = (d) => d.toISOString().slice(0, 19).replace("T", " ");
  if (period === "jour") return iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));
  if (period === "annee") return iso(new Date(Date.UTC(now.getUTCFullYear(), 0, 1)));
  if (period === "7" || period === "30") return iso(new Date(now.getTime() - Number(period) * 864e5));
  return "";
}
// Adresse de la médiathèque DU SITE administré (le site de la requête, vérifié par le serveur) : sert aux liens « Ouvrir la médiathèque » après un envoi
const libraryUrl = (ctx) => { const site = siteContent.siteParam(ctx); return `/marketing/site-web/mediatheque${site ? `?site=${site}` : ""}`; };
const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

// Filtres lus dans l'adresse (liste, page et API)
function filtersOf(query) {
  const reach = query.portee === "commun" ? "shared" : query.portee === "site" ? "site" : "";
  const type = media.TYPES.includes(query.type) || query.type === "documents" ? query.type : "";
  const trashed = query.corbeille === "1";
  const sort = Object.hasOwn(media.SORTS, query.tri) ? query.tri : "recent";
  const period = Object.hasOwn(PERIODS, query.periode) ? String(query.periode) : "";
  const q = String(query.q || "").trim().slice(0, 100);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(query.mois || "")) ? String(query.mois) : ""; // mois d'ajout (AAAA-MM), proposé par la médiathèque elle-même
  const page = Math.max(1, Number(query.page) || 1);
  return { type, trashed, sort, period, q, page, reach, month };
}
function search(ctx, f, perPage = PER_PAGE) {
  const found = media.listMedia(ctx, { q: f.q, type: f.type, trashed: f.trashed, sort: f.sort, from: sinceOf(f.period), month: f.month, reach: f.reach, limit: perPage, offset: (f.page - 1) * perPage });
  return { ...found, pages: Math.max(1, Math.ceil(found.total / perPage)), page: f.page, perPage };
}

module.exports = () => {
  const router = express.Router();
  const base = "/site-web/mediatheque";

  const fail = (res, next, error) => {
    if (!(error instanceof MarketingError)) return next(error);
    res.status(error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : error.code === "invalid_state" ? 409 : error.code === "unavailable" ? 503 : 422).json({ error: { code: error.code, message: error.message } });
  };
  const authorsOf = (ctx, ids) => {
    const list = [...new Set(ids.filter(Boolean))];
    if (!list.length) return {};
    return Object.fromEntries(ctx.db.prepare(`SELECT id, username FROM users WHERE id IN (${list.map(() => "?").join(",")})`).all(...list).map((u) => [u.id, u.username]));
  };
  const describe = (ctx, m) => {
    const usage = media.mediaUsage(ctx, m).map((u) => ({ kind: u.kind, name: u.name, href: media.usageHref(u) }));
    return { media: { ...m, author: authorsOf(ctx, [m.createdBy])[m.createdBy] || null }, usage };
  };

  // ----- Page -----
  const page = (uploadOpen, active) => (req, res) => {
    const ctx = req.mk.ctx;
    const f = filtersOf(req.query);
    const found = search(ctx, f);
    const authors = authorsOf(ctx, found.items.map((m) => m.createdBy));
    res.render("marketing/media-library", {
      title: "Médiathèque", active, uploadOpen, months: media.mediaMonths(ctx, { trashed: f.trashed }), orgView: media.orgLevel(ctx) && !Number.isInteger(ctx.siteFilter) && ctx.siteFilter !== "principal", f, found, counts: media.mediaCounts(ctx), authors, TYPE_LABELS: media.TYPE_LABELS, PERIODS, view: req.query.vue === "liste" ? "liste" : "grille",
      canUpload: req.mk.can("media.upload"), canWrite: req.mk.can("media.write"), canDelete: req.mk.can("media.delete"), uploadCfg: { ...media.uploadConfig(), libraryUrl: libraryUrl(ctx) }, formats: media.FORMATS, maxMb: media.uploadConfig().limits,
      mediaJs: true,
    });
  };
  router.get(base, need("media.read"), page(false, "mediatheque"));
  // ----- Média → Ajouter un fichier média (« Téléverser un média ») : la même file d'importation et le même service que la médiathèque -----
  router.get(`${base}/ajouter`, need("media.upload"), (req, res) => {
    const ctx = req.mk.ctx;
    res.render("marketing/media-upload", { title: "Téléverser un média", active: "mediatheque/ajouter", cfg: { ...media.uploadConfig(), libraryUrl: libraryUrl(ctx) }, classic: req.query.methode === "navigateur", maxFiles: MAX_FILES, mediaJs: true });
  });
  // « Méthode du navigateur » : formulaire classique, sans JavaScript, plusieurs fichiers ; MÊME validation et MÊME enregistrement que l'envoi principal (aucun second système)
  router.post(`${base}/ajouter`, need("media.upload"), (req, res, next) => {
    uploadMany.array("files", MAX_FILES)(req, res, (uploadError) => {
      const ctx = req.mk.ctx, site = siteContent.siteParam(ctx), back = `/marketing/site-web/mediatheque/ajouter?${site ? `site=${site}&` : ""}methode=navigateur`;
      const flash = (type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; res.redirect(back); };
      if (uploadError) return flash("error", uploadError.code === "LIMIT_FILE_SIZE" ? `Un fichier dépasse la taille maximale d'une requête (${media.MAX_UPLOAD / 1048576} Mo) : rien n'a été enregistré.` : uploadError.code === "LIMIT_FILE_COUNT" ? `Trop de fichiers : ${MAX_FILES} au plus par envoi.` : "Envoi impossible : fichier illisible.");
      const files = (req.files || []).filter((f) => f.size > 0 && f.originalname);
      if (!files.length) return flash("error", "Choisissez au moins un fichier.");
      const done = [], failed = [];
      for (const file of files) {
        const originalName = originalNameOf(file);
        try { done.push(media.saveUpload(ctx, { buffer: file.buffer, originalName, declaredType: file.mimetype, siteId: media.siteOfUpload(ctx) })); }
        catch (error) { if (!(error instanceof MarketingError)) return next(error); failed.push(`« ${originalName} » : ${error.message}`); }
      }
      const head = done.length ? `${done.length} fichier${done.length > 1 ? "s" : ""} enregistré${done.length > 1 ? "s" : ""} dans la médiathèque de ce site.` : "";
      if (!failed.length) return flash("ok", head);
      if (!done.length) return flash("error", "Aucun fichier n'a pu être enregistré.", failed.join(" · "));
      flash("ok", `${head} ${failed.length} refusé${failed.length > 1 ? "s" : ""}.`, failed.join(" · "));
    });
  });

  // ----- API JSON -----
  router.get(`${base}/liste.json`, need("media.read"), (req, res) => {
    const ctx = req.mk.ctx;
    const f = filtersOf(req.query);
    const found = search(ctx, f, Math.min(Math.max(Number(req.query.limite) || 24, 1), 100));
    res.set("Cache-Control", "no-store").json({ items: found.items, total: found.total, page: found.page, pages: found.pages, more: found.page < found.pages, counts: media.mediaCounts(ctx), canUpload: req.mk.can("media.upload") });
  });
  router.get(`${base}/:id(\\d+).json`, need("media.read"), (req, res, next) => {
    const m = media.getMedia(req.mk.ctx, Number(req.params.id));
    if (!m) return res.status(404).json({ error: { code: "not_found", message: "Fichier introuvable." } });
    try { res.set("Cache-Control", "no-store").json(describe(req.mk.ctx, m)); } catch (error) { fail(res, next, error); }
  });

  // Envoi d'UN fichier par requête : l'interface en envoie plusieurs à la suite, avec une progression et une erreur par fichier
  router.post(`${base}/televerser`, need("media.upload"), (req, res, next) => {
    upload.single("file")(req, res, (uploadError) => {
      if (uploadError) return res.status(422).json({ error: { code: "invalid_field", message: uploadError.code === "LIMIT_FILE_SIZE" ? `Le fichier dépasse la taille maximale autorisée (${media.MAX_UPLOAD / 1048576} Mo).` : "Envoi impossible : fichier illisible." } });
      try {
        if (!req.file) throw new MarketingError("invalid_field", "Aucun fichier reçu.");
        const originalName = originalNameOf(req.file);
        let saved = media.saveUpload(req.mk.ctx, { buffer: req.file.buffer, originalName, declaredType: req.file.mimetype, siteId: media.siteOfUpload(req.mk.ctx) });
        if (req.body && (req.body.alt || req.body.title)) saved = media.updateMedia(req.mk.ctx, saved.id, { alt: req.body.alt, title: req.body.title });
        res.status(201).json({ media: saved });
      } catch (error) { fail(res, next, error); }
    });
  });

  router.post(`${base}/actions`, need("media.write"), (req, res, next) => {
    const ctx = req.mk.ctx;
    const action = String((req.body && req.body.action) || "");
    const needs = { corbeille: "media.write", restaurer: "media.write", supprimer: "media.delete" }[action];
    if (!needs || !req.mk.can(needs)) return res.status(403).json({ error: { code: "forbidden", message: "Vous n'avez pas la permission d'effectuer cette action." } });
    const ids = [...new Set((Array.isArray(req.body.ids) ? req.body.ids : []).map(intOrNull).filter(Boolean))].slice(0, 200);
    if (!ids.length) return res.status(422).json({ error: { code: "invalid_field", message: "Sélectionnez au moins un fichier." } });
    const run = { corbeille: media.trashMedia, restaurer: media.restoreMedia, supprimer: media.purgeMedia }[action];
    const done = []; const failed = [];
    for (const id of ids) {
      const m = media.getMedia(ctx, id);
      try { run(ctx, id); done.push(id); } catch (error) { if (!(error instanceof MarketingError)) return next(error); failed.push({ id, name: m ? m.name : `#${id}`, message: error.message }); }
    }
    res.json({ done, failed });
  });

  router.post(`${base}/:id(\\d+)`, need("media.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      res.json({ media: media.updateMedia(req.mk.ctx, Number(req.params.id), { name: b.name, alt: b.alt, title: b.title, caption: b.caption, description: b.description }) });
    } catch (error) { fail(res, next, error); }
  });
  // Partage explicite (R5) : rendre un fichier commun à tous les sites, ou l'attribuer à UN site. Réservé à l'équipe de l'organisation (le service le vérifie aussi).
  router.post(`${base}/:id(\\d+)/partage`, need("media.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      res.json({ media: media.setMediaScope(req.mk.ctx, Number(req.params.id), { reach: b.reach, siteId: b.site_id }) });
    } catch (error) { fail(res, next, error); }
  });
  router.post(`${base}/:id(\\d+)/corbeille`, need("media.write"), (req, res, next) => {
    try { res.json({ media: media.trashMedia(req.mk.ctx, Number(req.params.id)) }); } catch (error) { fail(res, next, error); }
  });
  router.post(`${base}/:id(\\d+)/restaurer`, need("media.write"), (req, res, next) => {
    try { res.json({ media: media.restoreMedia(req.mk.ctx, Number(req.params.id)) }); } catch (error) { fail(res, next, error); }
  });
  router.post(`${base}/:id(\\d+)/supprimer`, need("media.delete"), (req, res, next) => {
    try { res.json({ ok: media.purgeMedia(req.mk.ctx, Number(req.params.id)) }); } catch (error) { fail(res, next, error); }
  });
  return router;
};
