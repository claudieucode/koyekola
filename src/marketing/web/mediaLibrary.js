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
const { mediaCtx, forId } = require("../media/requestContext");

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
// Adresse de la médiathèque DU SITE administré : dans le cadre de CE site (/sites/<id>/medias), sinon l'adresse historique du site principal. Tous les liens de la page partent d'ici :
// aucun lien ne doit faire quitter le site administré pour le site principal.
const spaceBase = (ctx) => { const site = siteContent.siteParam(ctx); return site ? `/marketing/site-web/sites/${site}/medias` : "/marketing/site-web/mediatheque"; };
const libraryUrl = (ctx) => spaceBase(ctx);
const folders = require("../media/folders");
const manager = require("../media/manager");
const { writeZip, MAX_TOTAL } = require("../../utils/zipStream");
const { exifOf } = require("../media/exif");
const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

// Filtres lus dans l'adresse (liste, page et API)
function filtersOf(query) {
  const portee = ["commun", "site", "tous"].includes(query.portee) ? query.portee : ""; // « tous » : vue d'ensemble de l'équipe, seulement sur demande
  const reach = portee === "commun" ? "shared" : portee === "site" ? "site" : "";
  const type = media.TYPES.includes(query.type) || query.type === "documents" ? query.type : "";
  const trashed = query.corbeille === "1";
  const sort = Object.hasOwn(media.SORTS, query.tri) ? query.tri : "recent";
  const period = Object.hasOwn(PERIODS, query.periode) ? String(query.periode) : "";
  const q = String(query.q || "").trim().slice(0, 100);
  const recents = query.recents === "1";
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(query.mois || "")) ? String(query.mois) : ""; // mois d'ajout (AAAA-MM), proposé par la médiathèque elle-même
  const page = Math.max(1, Number(query.page) || 1);
  // Explorateur : dossier (racine ou numéro), extension, taille (Ko) et largeur (px) minimales / maximales, doublons, fichiers volumineux
  const folder = query.dossier === "racine" ? null : intOrNull(query.dossier) || undefined;
  const ext = String(query.ext || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const kb = (v) => { const n = intOrNull(v); return n === null ? undefined : n * 1024; };
  const px = (v) => { const n = intOrNull(v); return n === null ? undefined : n; };
  const tag = intOrNull(query.tag) || undefined, collection = intOrNull(query.collection) || undefined;
  const adv = { tagId: tag, collectionId: collection, starred: query.favoris === "1", usedOnly: query.utilise === "1", folder, ext, minSize: kb(query.tmin), maxSize: kb(query.tmax), minWidth: px(query.lmin), maxWidth: px(query.lmax), duplicates: query.doublons === "1", large: query.volumineux === "1" };
  return { type, trashed, sort, period, q, page, reach, month, portee, recents, adv, raw: { dossier: query.dossier === "racine" ? "racine" : folder ? String(folder) : "", ext, tmin: query.tmin || "", tmax: query.tmax || "", lmin: query.lmin || "", lmax: query.lmax || "", doublons: query.doublons === "1" ? "1" : "", volumineux: query.volumineux === "1" ? "1" : "", tag: tag ? String(tag) : "", collection: collection ? String(collection) : "", favoris: query.favoris === "1" ? "1" : "", utilise: query.utilise === "1" ? "1" : "", recents: query.recents === "1" ? "1" : "" } };
}
function search(ctx, f, perPage = PER_PAGE) {
  const { starred, ...adv } = f.adv;
  const from = f.recents ? new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 19).replace("T", " ") : sinceOf(f.period);
  const sort = f.adv.usedOnly && f.sort === "recent" ? "utilise" : f.sort;
  const found = media.listMedia(ctx, { q: f.q, type: f.type, trashed: f.trashed, standalone: f.trashed, sort, from, month: f.month, reach: f.reach, ...adv, starredBy: starred ? ctx.userId : undefined, limit: perPage, offset: (f.page - 1) * perPage });
  found.items = manager.decorate(ctx, found.items);
  return { ...found, pages: Math.max(1, Math.ceil(found.total / perPage)), page: f.page, perPage };
}

module.exports = () => {
  const router = express.Router();
  const ctxOf = (req, o) => mediaCtx(req, o); // la médiathèque d'UN site (voir media/requestContext.js)
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
    const usage = media.mediaUsage(ctx, m).map((u) => ({ kind: u.kind, name: u.name, href: media.usageHref(u), confidence: u.confidence || "probable" }));
    // Mêmes fichiers (même empreinte) dans cette médiathèque : information seulement
    const vis = media.visibleSql(ctx);
    const twins = m.sha256 ? ctx.db.prepare(`SELECT id, name FROM mk_media WHERE organization_id = ? AND sha256 = ? AND id <> ? AND deleted_at IS NULL AND ${vis.sql} ORDER BY id LIMIT 20`).all(ctx.organizationId, m.sha256, m.id, ...vis.params) : [];
    const folder = m.folderId ? folders.getFolder(ctx, m.folderId) : null;
    const where = media.parsePublicPath(ctx, m.path);
    const [rich] = manager.decorate(ctx, [m]);
    return { exif: m.type === "image" && /jpe?g$/i.test(m.path) && where ? exifOf(where.absolute) : null, media: { ...rich, author: authorsOf(ctx, [m.createdBy])[m.createdBy] || null }, usage, duplicates: twins, folder: folder ? { id: folder.id, name: folder.name } : null, analysis: { scanned: ["modèles d'e-mail", "pages et tunnels", "composants", "modèles de page", "réglages de site", "articles"], notScanned: ["cours (LMS)", "produits et téléchargements", "formulaires", "e-mails déjà envoyés"] } };
  };

  // ----- Page -----
  const page = (uploadOpen, active) => (req, res) => {
    const ctx = ctxOf(req, { overview: true });
    const f = filtersOf(req.query);
    const found = search(ctx, f);
    const authors = authorsOf(ctx, found.items.map((m) => m.createdBy));
    const tree = folders.listFolders(ctx);
    res.render("marketing/media-library", {
      tree, crumbs: f.adv.folder ? folders.breadcrumb(ctx, f.adv.folder) : [], dupCount: f.adv.duplicates ? found.total : null, mediaLarge: media.LARGE_BYTES,
      title: "Médiathèque", active, uploadOpen, months: media.mediaMonths(ctx, { trashed: f.trashed }), orgView: !Number.isInteger(req.mk.ctx.siteScope) && req.mk.ctx.siteFilter === undefined, spaceBase: spaceBase(ctx), f, found, counts: media.mediaCounts(ctx), authors, TYPE_LABELS: media.TYPE_LABELS, PERIODS, view: ["liste", "compacte"].includes(req.query.vue) ? req.query.vue : "grille",
      canUpload: req.mk.can("media.upload"), canWrite: req.mk.can("media.write"), canDelete: req.mk.can("media.delete"), uploadCfg: { ...media.uploadConfig(), libraryUrl: libraryUrl(ctx) }, formats: media.FORMATS, maxMb: media.uploadConfig().limits,
      mediaJs: true,
    });
  };
  router.get(base, need("media.read"), page(false, "mediatheque"));
  // ----- Média → Ajouter un fichier média (« Téléverser un média ») : la même file d'importation et le même service que la médiathèque -----
  router.get(`${base}/ajouter`, need("media.upload"), (req, res) => {
    const ctx = ctxOf(req);
    res.render("marketing/media-upload", { title: "Téléverser un média", active: "mediatheque/ajouter", cfg: { ...media.uploadConfig(), libraryUrl: libraryUrl(ctx) }, spaceBase: spaceBase(ctx), classic: req.query.methode === "navigateur", maxFiles: MAX_FILES, mediaJs: true });
  });
  // « Méthode du navigateur » : formulaire classique, sans JavaScript, plusieurs fichiers ; MÊME validation et MÊME enregistrement que l'envoi principal (aucun second système)
  router.post(`${base}/ajouter`, need("media.upload"), (req, res, next) => {
    uploadMany.array("files", MAX_FILES)(req, res, (uploadError) => {
      const ctx = ctxOf(req), back = `${spaceBase(ctx)}/ajouter?methode=navigateur`;
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
    const ctx = ctxOf(req, { overview: true });
    const f = filtersOf(req.query);
    const found = search(ctx, f, Math.min(Math.max(Number(req.query.limite) || 24, 1), 100));
    res.set("Cache-Control", "no-store").json({ items: found.items, total: found.total, page: found.page, pages: found.pages, more: found.page < found.pages, counts: media.mediaCounts(ctx), canUpload: req.mk.can("media.upload") });
  });
  // Diagnostic d'isolation (lecture seule, équipe de l'organisation) : médias sans propriétaire clair, fichiers sans fiche, références entre sites, doublons — rien n'est modifié
  router.get(`${base}/diagnostic.json`, need("media.read"), (req, res) => {
    if (req.mk.siteOnly || Number.isInteger(req.mk.ctx.siteScope)) return res.status(403).json({ error: { code: "forbidden", message: "Le diagnostic d'isolation est réservé à l'équipe de l'organisation." } });
    res.set("Cache-Control", "no-store").json(require("../media/audit").audit(req.mk.ctx));
  });
  router.get(`${base}/:id(\\d+).json`, need("media.read"), (req, res, next) => {
    const m = media.getMedia(ctxOf(req), Number(req.params.id));
    if (!m) return res.status(404).json({ error: { code: "not_found", message: "Fichier introuvable." } });
    try { res.set("Cache-Control", "no-store").json(describe(ctxOf(req), m)); } catch (error) { fail(res, next, error); }
  });

  // Envoi d'UN fichier par requête : l'interface en envoie plusieurs à la suite, avec une progression et une erreur par fichier
  router.post(`${base}/televerser`, need("media.upload"), (req, res, next) => {
    upload.single("file")(req, res, (uploadError) => {
      if (uploadError) return res.status(422).json({ error: { code: "invalid_field", message: uploadError.code === "LIMIT_FILE_SIZE" ? `Le fichier dépasse la taille maximale autorisée (${media.MAX_UPLOAD / 1048576} Mo).` : "Envoi impossible : fichier illisible." } });
      try {
        if (!req.file) throw new MarketingError("invalid_field", "Aucun fichier reçu.");
        const requested = String((req.body && req.body.nom) || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 150); // nom choisi après un conflit de noms (« garder les deux »)
        const originalName = requested || originalNameOf(req.file);
        let saved = media.saveUpload(ctxOf(req), { buffer: req.file.buffer, originalName, declaredType: req.file.mimetype, siteId: media.siteOfUpload(ctxOf(req)) });
        const toFolder = intOrNull(req.body && req.body.dossier); // dossier de destination choisi dans l'explorateur (vérifié : même médiathèque)
        if (toFolder) { const r = folders.moveMedia(ctxOf(req), [saved.id], toFolder); if (r.failed.length) throw new MarketingError("invalid_field", r.failed[0].message); saved = media.getMedia(ctxOf(req), saved.id); saved.duplicateOf = saved.duplicateOf || []; }
        if (req.body && (req.body.alt || req.body.title)) saved = media.updateMedia(ctxOf(req), saved.id, { alt: req.body.alt, title: req.body.title });
        res.status(201).json({ media: saved });
      } catch (error) { fail(res, next, error); }
    });
  });

  router.post(`${base}/actions`, need("media.write"), (req, res, next) => {
    const action = String((req.body && req.body.action) || "");
    const needs = { corbeille: "media.write", restaurer: "media.write", supprimer: "media.delete" }[action];
    if (!needs || !req.mk.can(needs)) return res.status(403).json({ error: { code: "forbidden", message: "Vous n'avez pas la permission d'effectuer cette action." } });
    const ids = [...new Set((Array.isArray(req.body.ids) ? req.body.ids : []).map(intOrNull).filter(Boolean))].slice(0, 200);
    if (!ids.length) return res.status(422).json({ error: { code: "invalid_field", message: "Sélectionnez au moins un fichier." } });
    const run = { corbeille: media.trashMedia, restaurer: media.restoreMedia, supprimer: media.purgeMedia }[action];
    const done = []; const failed = [];
    for (const id of ids) {
      const c = forId(req.mk.ctx, id); // chaque fichier est traité dans la médiathèque de SON site (l'équipe), ou du site imposé par le serveur (accès limité / site choisi)
      const m = media.getMedia(c, id);
      try { run(c, id); done.push(id); } catch (error) { if (!(error instanceof MarketingError)) return next(error); failed.push({ id, name: m ? m.name : `#${id}`, message: error.message }); }
    }
    res.json({ done, failed });
  });

  // ----- Explorateur : dossiers logiques, déplacement, empreintes et doublons (rien n'est supprimé ici) -----
  router.get(`${base}/dossiers.json`, need("media.read"), (req, res) => {
    const ctx = ctxOf(req, { overview: true });
    res.set("Cache-Control", "no-store").json({ ...folders.listFolders(ctx), breadcrumb: folders.breadcrumb(ctx, intOrNull(req.query.dossier)) });
  });
  router.post(`${base}/dossiers`, need("media.write"), (req, res, next) => {
    try { const b = req.body || {}; res.status(201).json({ folder: folders.createFolder(ctxOf(req), { name: b.name, parentId: intOrNull(b.parent_id) }) }); } catch (error) { fail(res, next, error); }
  });
  router.post(`${base}/dossiers/:fid(\\d+)`, need("media.write"), (req, res, next) => {
    try {
      const b = req.body || {}, id = Number(req.params.fid), ctx = ctxOf(req);
      let folder = folders.getFolder(ctx, id);
      if (!folder) throw new MarketingError("not_found", "Dossier introuvable.");
      if (b.name !== undefined) folder = folders.renameFolder(ctx, id, b.name);
      if (Object.hasOwn(b, "parent_id")) folder = folders.moveFolder(ctx, id, intOrNull(b.parent_id));
      res.json({ folder });
    } catch (error) { fail(res, next, error); }
  });
  router.post(`${base}/dossiers/:fid(\\d+)/supprimer`, need("media.write"), (req, res, next) => {
    try { res.json({ ok: folders.deleteFolder(ctxOf(req), Number(req.params.fid)) }); } catch (error) { fail(res, next, error); }
  });
  router.post(`${base}/deplacer`, need("media.write"), (req, res, next) => {
    try {
      const ids = [...new Set((Array.isArray(req.body.ids) ? req.body.ids : []).map(intOrNull).filter(Boolean))].slice(0, 200);
      if (!ids.length) throw new MarketingError("invalid_field", "Sélectionnez au moins un fichier.");
      res.json(folders.moveMedia(ctxOf(req), ids, intOrNull(req.body.folder_id)));
    } catch (error) { fail(res, next, error); }
  });
  router.get(`${base}/doublons.json`, need("media.read"), (req, res, next) => {
    try { res.set("Cache-Control", "no-store").json({ groups: folders.duplicateGroups(ctxOf(req, { overview: true })) }); } catch (error) { fail(res, next, error); }
  });
  // Calcule les empreintes manquantes des fichiers déjà présents (par lots de 50, en flux) : à répéter jusqu'à « left: 0 »
  router.post(`${base}/empreintes`, need("media.write"), async (req, res, next) => {
    try { res.json(await folders.computeMissingHashes(ctxOf(req, { overview: true }), { limit: 50 })); } catch (error) { fail(res, next, error); }
  });

  router.post(`${base}/:id(\\d+)`, need("media.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      res.json({ media: media.updateMedia(ctxOf(req), Number(req.params.id), { name: b.name, alt: b.alt, title: b.title, caption: b.caption, description: b.description }) });
    } catch (error) { fail(res, next, error); }
  });
  // Partage explicite (R5) : rendre un fichier commun à tous les sites, ou l'attribuer à UN site. Réservé à l'équipe de l'organisation (le service le vérifie aussi).
  router.post(`${base}/:id(\\d+)/partage`, need("media.write"), (req, res, next) => {
    try {
      const b = req.body || {};
      res.json({ media: media.setMediaScope(ctxOf(req), Number(req.params.id), { reach: b.reach, siteId: b.site_id }) });
    } catch (error) { fail(res, next, error); }
  });
  router.post(`${base}/:id(\\d+)/corbeille`, need("media.write"), (req, res, next) => {
    try { res.json({ media: media.trashMedia(ctxOf(req), Number(req.params.id)) }); } catch (error) { fail(res, next, error); }
  });
  router.post(`${base}/:id(\\d+)/restaurer`, need("media.write"), (req, res, next) => {
    try { res.json({ media: media.restoreMedia(ctxOf(req), Number(req.params.id)) }); } catch (error) { fail(res, next, error); }
  });
  router.post(`${base}/:id(\\d+)/supprimer`, need("media.delete"), (req, res, next) => {
    try { res.json({ ok: media.purgeMedia(ctxOf(req), Number(req.params.id)) }); } catch (error) { fail(res, next, error); }
  });

  // ===================== Gestionnaire de fichiers (lot 1) =====================
  const rec = (res, next, fn) => { try { fn(); } catch (error) { fail(res, next, error); } };
  const num = (v) => intOrNull(v);
  const body = (req) => req.body || {};
  // Tout ce dont l'écran a besoin au démarrage, en un seul appel (une seule médiathèque : celle du site courant)
  router.get(`${base}/gestionnaire.json`, need("media.read"), (req, res, next) => rec(res, next, () => {
    const ctx = ctxOf(req, { overview: true });
    const tree = folders.listFolders(ctx), starredFolders = [...manager.starredSet(ctx, "folder")];
    const scoped = Boolean(folders.scopeOf(ctx));
    res.set("Cache-Control", "no-store").json({ counts: manager.sidebarCounts(ctx), prefs: manager.getPrefs(ctx), folders: tree.folders.map((fo) => ({ ...fo, starred: starredFolders.includes(fo.id) })), rootCount: tree.rootCount, foldersEnabled: tree.enabled,
      tags: scoped ? manager.listTags(ctx) : [], collections: scoped ? manager.listCollections(ctx) : [], retention: scoped ? manager.getRetention(ctx) : 0, colors: manager.COLORS });
  }));
  // Favoris et préférences : propres à la personne
  router.post(`${base}/favoris`, need("media.read"), (req, res, next) => rec(res, next, () => res.json({ starred: manager.setStar(ctxOf(req), String(body(req).kind), num(body(req).id), body(req).on !== false && body(req).on !== "0") })));
  router.get(`${base}/preferences.json`, need("media.read"), (req, res) => res.set("Cache-Control", "no-store").json({ prefs: manager.getPrefs(ctxOf(req, { overview: true })) }));
  router.post(`${base}/preferences`, need("media.read"), (req, res, next) => rec(res, next, () => res.json({ prefs: manager.setPrefs(ctxOf(req, { overview: true }), body(req)) })));
  router.post(`${base}/utilise`, need("media.read"), (req, res, next) => rec(res, next, () => res.json({ updated: manager.touchUsed(ctxOf(req), Array.isArray(body(req).ids) ? body(req).ids.map(num) : []) })));
  // Tags
  router.get(`${base}/tags.json`, need("media.read"), (req, res, next) => rec(res, next, () => res.set("Cache-Control", "no-store").json({ tags: manager.listTags(ctxOf(req)) })));
  router.post(`${base}/tags`, need("media.write"), (req, res, next) => rec(res, next, () => res.status(201).json({ tag: manager.createTag(ctxOf(req), { name: body(req).name, color: body(req).color }) })));
  router.post(`${base}/tags/:tid(\\d+)`, need("media.write"), (req, res, next) => rec(res, next, () => res.json({ tag: manager.renameTag(ctxOf(req), Number(req.params.tid), { name: body(req).name, color: body(req).color }) })));
  router.post(`${base}/tags/:tid(\\d+)/supprimer`, need("media.write"), (req, res, next) => rec(res, next, () => res.json({ ok: manager.deleteTag(ctxOf(req), Number(req.params.tid)) })));
  router.post(`${base}/etiqueter`, need("media.write"), (req, res, next) => rec(res, next, () => res.json(manager.tagMedia(ctxOf(req), Array.isArray(body(req).ids) ? body(req).ids.map(num) : [], { add: body(req).add, remove: body(req).remove }))));
  router.post(`${base}/:id(\\d+)/tags`, need("media.write"), (req, res, next) => rec(res, next, () => res.json({ tags: manager.setMediaTags(ctxOf(req), Number(req.params.id), Array.isArray(body(req).tags) ? body(req).tags : []) })));
  // Collections
  router.get(`${base}/collections.json`, need("media.read"), (req, res, next) => rec(res, next, () => res.set("Cache-Control", "no-store").json({ collections: manager.listCollections(ctxOf(req)) })));
  router.post(`${base}/collections`, need("media.write"), (req, res, next) => rec(res, next, () => res.status(201).json({ collection: manager.createCollection(ctxOf(req), { name: body(req).name, description: body(req).description }) })));
  router.post(`${base}/collections/:cid(\\d+)`, need("media.write"), (req, res, next) => rec(res, next, () => res.json({ collection: manager.renameCollection(ctxOf(req), Number(req.params.cid), { name: body(req).name, description: body(req).description }) })));
  router.post(`${base}/collections/:cid(\\d+)/supprimer`, need("media.write"), (req, res, next) => rec(res, next, () => res.json({ ok: manager.deleteCollection(ctxOf(req), Number(req.params.cid)) })));
  router.post(`${base}/collections/:cid(\\d+)/ajouter`, need("media.write"), (req, res, next) => rec(res, next, () => res.json(manager.addToCollection(ctxOf(req), Number(req.params.cid), body(req).ids))));
  router.post(`${base}/collections/:cid(\\d+)/retirer`, need("media.write"), (req, res, next) => rec(res, next, () => res.json(manager.removeFromCollection(ctxOf(req), Number(req.params.cid), body(req).ids))));
  // Dossiers enrichis : couleur, description, propriétés, corbeille
  router.post(`${base}/dossiers/:fid(\\d+)/meta`, need("media.write"), (req, res, next) => rec(res, next, () => res.json({ folder: manager.updateFolder(ctxOf(req), Number(req.params.fid), { color: body(req).color, description: body(req).description }) })));
  router.get(`${base}/dossiers/:fid(\\d+)/proprietes.json`, need("media.read"), (req, res, next) => rec(res, next, () => res.set("Cache-Control", "no-store").json({ properties: manager.folderProperties(ctxOf(req), Number(req.params.fid)) })));
  router.post(`${base}/dossiers/:fid(\\d+)/corbeille`, need("media.write"), (req, res, next) => rec(res, next, () => res.json(manager.trashFolder(ctxOf(req), Number(req.params.fid)))));
  router.post(`${base}/dossiers/:fid(\\d+)/restaurer`, need("media.write"), (req, res, next) => rec(res, next, () => res.json({ folder: manager.restoreFolder(ctxOf(req), Number(req.params.fid)) })));
  router.post(`${base}/dossiers/:fid(\\d+)/supprimer-definitivement`, need("media.delete"), (req, res, next) => rec(res, next, () => res.json(manager.purgeFolder(ctxOf(req), Number(req.params.fid)))));
  // Corbeille : contenu, vidage, conservation
  router.get(`${base}/corbeille.json`, need("media.read"), (req, res, next) => rec(res, next, () => { const ctx = ctxOf(req); manager.sweepTrash(ctx); res.set("Cache-Control", "no-store").json({ ...manager.listTrash(ctx, { q: req.query.q }), retention: manager.getRetention(ctx) }); }));
  router.post(`${base}/corbeille/vider`, need("media.delete"), (req, res, next) => rec(res, next, () => res.json(manager.emptyTrash(ctxOf(req)))));
  router.post(`${base}/corbeille/conservation`, need("media.delete"), (req, res, next) => rec(res, next, () => res.json({ days: manager.setRetention(ctxOf(req), Number(body(req).days)) })));
  // Fichiers : copie, stockage, doublons, suggestions, téléchargement groupé
  router.post(`${base}/:id(\\d+)/copier`, need("media.upload"), (req, res, next) => rec(res, next, () => res.status(201).json({ media: manager.copyMedia(ctxOf(req), Number(req.params.id), { folderId: Object.hasOwn(body(req), "folder_id") ? num(body(req).folder_id) : undefined }) })));
  router.get(`${base}/stockage.json`, need("media.read"), (req, res, next) => rec(res, next, () => res.set("Cache-Control", "no-store").json(manager.storageStats(ctxOf(req, { overview: true })))));
  router.get(`${base}/doublons/:sha([0-9a-f]{64}).json`, need("media.read"), (req, res, next) => rec(res, next, () => res.set("Cache-Control", "no-store").json({ items: manager.duplicateDetail(ctxOf(req, { overview: true }), req.params.sha) })));
  router.post(`${base}/doublons/resoudre`, need("media.write"), (req, res, next) => rec(res, next, () => res.json(manager.resolveDuplicates(ctxOf(req), { sha256: body(req).sha256, keepId: num(body(req).keep_id), action: body(req).action, folderId: num(body(req).folder_id), ids: Array.isArray(body(req).ids) ? body(req).ids.map(num) : undefined }))));
  router.get(`${base}/suggestions.json`, need("media.read"), (req, res, next) => rec(res, next, () => res.set("Cache-Control", "no-store").json({ items: manager.suggest(ctxOf(req, { overview: true }), String(req.query.q || "")) })));
  // Téléchargement groupé : archive ZIP des fichiers choisis (ceux de CETTE médiathèque seulement ; 200 fichiers et 1 Go au plus)
  router.get(`${base}/telecharger.zip`, need("media.read"), (req, res, next) => {
    try {
      const ctx = ctxOf(req), ids = String(req.query.ids || "").split(",").map(num).filter(Boolean).slice(0, 200);
      if (!ids.length) throw new MarketingError("invalid_field", "Sélectionnez au moins un fichier.");
      const entries = []; let total = 0;
      for (const id of ids) { const m = manager.ownMedia(ctx, id, { trashed: true }), where = media.parsePublicPath(ctx, m.path); if (!where) continue; entries.push({ name: m.name, absolute: where.absolute, mtime: new Date(String(m.createdAt).replace(" ", "T") + "Z") }); total += m.size; }
      if (!entries.length) throw new MarketingError("not_found", "Aucun de ces fichiers n'est disponible sur le stockage.");
      if (total > MAX_TOTAL) throw new MarketingError("invalid_field", `La sélection pèse ${(total / 1048576).toFixed(0)} Mo : 1 Go au plus par archive. Téléchargez en plusieurs fois.`);
      res.set({ "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="mediatheque-${new Date().toISOString().slice(0, 10)}.zip"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      writeZip(entries, res).catch(() => res.destroy());
    } catch (error) { fail(res, next, error); }
  });
  // Avant un envoi : parmi ces fichiers (nom, taille, empreinte), lesquels existent déjà dans la médiathèque ? (aucune écriture)
  router.post(`${base}/verifier`, need("media.upload"), (req, res, next) => rec(res, next, () => {
    const ctx = ctxOf(req), vis = media.visibleSql(ctx), out = [];
    for (const it of (Array.isArray(body(req).files) ? body(req).files : []).slice(0, 200)) {
      const name = String(it.name || "").slice(0, 150), sha = /^[0-9a-f]{64}$/.test(String(it.sha256 || "")) ? String(it.sha256) : null;
      const folder = num(it.folder_id);
      const same = sha ? ctx.db.prepare(`SELECT id, name FROM mk_media WHERE organization_id = ? AND sha256 = ? AND deleted_at IS NULL AND ${vis.sql} LIMIT 3`).all(ctx.organizationId, sha, ...vis.params) : [];
      const named = ctx.db.prepare(`SELECT id, name FROM mk_media WHERE organization_id = ? AND name = ? COLLATE NOCASE AND deleted_at IS NULL AND ${vis.sql} AND folder_id IS ? LIMIT 3`).all(ctx.organizationId, name, ...vis.params, folder);
      out.push({ name, sameContent: same, sameName: named });
    }
    res.json({ files: out });
  }));
  return router;
};
