// KOLAKISA CMS → Apparence → Polices : Bibliothèque · Téléversement · Installer des polices (Google Fonts auto-hébergées), PAR SITE.
// UN écran partagé (comme Thèmes, Articles et Pages) : le site vient de l'adresse vérifiée par le serveur (/sites/<id>/polices → ?site=<id>, ou « ?site= » / champ « site »),
// jamais d'un état global ; sans site choisi, c'est le site principal. Droits : appearance.read (voir) · appearance.styles (installer, téléverser) · appearance.publish
// (activer, désactiver, supprimer). Toute écriture est limitée au site de la requête ; un accès limité à un site ne peut agir que sur le sien.
const express = require("express");
const multer = require("multer");
const fonts = require("../../services/siteFonts");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");
const { need } = require("./kit");
const target = require("./siteTarget");

const BASE = "/marketing/site-web/polices";
const TABS = [["", "Bibliothèque"], ["/televerser", "Téléversement"], ["/installer", "Installer des polices"]];
const FAMILY = /^font\.[a-z0-9-]{1,60}$/;
const clean = (v, n = 80) => String(v || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, n);
const oneOf = (v, list, d = "") => (list.includes(String(v)) ? String(v) : d);

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text) => { req.session.mkFlash = { type, text, noReopen: true }; };
  const lim = fonts.limits();
  const uploader = multer({ storage: multer.memoryStorage(), limits: { fileSize: lim.fileBytes + 1, files: lim.perBatch + 1, fields: 10, parts: lim.perBatch + 12 } });

  const to = (t, path = "", query = {}) => {
    const q = new URLSearchParams(); if (t.siteId) q.set("site", String(t.siteId));
    for (const [k, v] of Object.entries(query)) if (v !== "" && v != null) q.set(k, String(v));
    return `${BASE}${path}${q.toString() ? `?${q}` : ""}`;
  };
  const siteField = (t) => (t.siteId ? `<input type="hidden" name="site" value="${t.siteId}">` : "");
  const caps = (req) => ({ canInstall: req.mk.can("appearance.styles"), canManage: req.mk.can("appearance.publish") });
  const base = (req, t, extra) => ({ active: "apparence/polices", BASE, T: t, to: (p, q) => to(t, p, q), siteField: siteField(t), tabs: TABS, cmsPolices: true, categories: fonts.CATEGORIES, ...caps(req), ...extra });
  const done = (req, res, t, type, text, path = "", query = {}) => { flash(req, type, text); res.redirect(to(t, path, query)); };
  const readOnlyMsg = "Ce site est archivé ou supprimé : restaurez-le avant de changer ses polices.";
  const run = (req, res, next, t, path, action) => {
    if (t.readOnly) return done(req, res, t, "error", readOnlyMsg, path);
    try { done(req, res, t, "ok", action(), path); }
    catch (error) {
      if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error);
      done(req, res, t, "error", error.message, path);
    }
  };
  const idOf = (v) => (/^\d{1,12}$/.test(String(v)) ? Number(v) : 0);

  // ----- Bibliothèque : polices du site, recherche, filtres combinables, liste ou grille, pagination -----
  router.get("/site-web/polices", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const f = {
      q: clean(req.query.q), source: oneOf(req.query.origine, ["google", "upload"]), category: oneOf(req.query.categorie, fonts.CATEGORY_KEYS), status: oneOf(req.query.statut, ["active", "disabled"]),
      sort: oneOf(req.query.tri, ["nom", "recent", "ancien"], "nom"), used: req.query.utilisee === "1" ? "1" : "", view: oneOf(req.query.vue, ["liste", "grille"], "liste"),
    };
    const result = fonts.list(t.siteId, { q: f.q, source: f.source, category: f.category, status: f.status, sort: f.sort, usedOnly: f.used === "1", page: req.query.page, perPage: f.view === "grille" ? 12 : 15 });
    const filtered = Boolean(f.q || f.source || f.category || f.status || f.used);
    res.render("marketing/polices", { ...base(req, t, {}), title: "Polices", tab: "", f, result, counts: fonts.counts(t.siteId), filtered, readOnly: t.readOnly, fontsLimits: lim });
  });

  // ----- Téléversement -----
  router.get("/site-web/polices/televerser", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    res.render("marketing/polices-upload", { ...base(req, t, {}), title: "Polices — Téléversement", tab: "/televerser", readOnly: t.readOnly, results: null, fontsLimits: lim, counts: fonts.counts(t.siteId), siteBytes: fonts.counts(t.siteId).total });
  });
  const wantsJson = (req) => /application\/json/.test(req.get("accept") || "");
  // multer d'abord : le champ « site » d'un formulaire multipart n'est lu qu'après l'analyse du corps ; le site est ensuite vérifié par le serveur comme partout (siteTarget)
  router.post("/site-web/polices/televerser", need("appearance.styles"), (req, res, next) => {
    uploader.array("polices", lim.perBatch + 1)(req, res, (uploadError) => {
      const t = target(req, res); if (!t) return;
      const fail = (status, message) => (wantsJson(req) ? res.status(status).json({ ok: false, error: message, results: [] }) : (flash(req, "error", message), res.redirect(to(t, "/televerser"))));
      if (uploadError) {
        const message = uploadError.code === "LIMIT_FILE_SIZE" ? `Un fichier dépasse la taille maximale de ${Math.round(lim.fileBytes / 1048576)} Mo.` : uploadError.code === "LIMIT_FILE_COUNT" || uploadError.code === "LIMIT_PART_COUNT" ? `${lim.perBatch} fichiers au plus par envoi.` : "Envoi impossible : fichiers illisibles.";
        return fail(400, message);
      }
      if (t.readOnly) return fail(409, readOnlyMsg);
      try {
        const entries = (req.files || []).map((x) => ({ name: x.originalname, buffer: x.buffer }));
        const results = fonts.upload(req.mk.ctx, t.siteId, entries, { category: oneOf(req.body.categorie, fonts.CATEGORY_KEYS, "sans-serif"), familyName: clean(req.body.famille, 60) });
        const okCount = results.filter((r) => r.ok).length;
        if (wantsJson(req)) return res.status(okCount || !results.length ? 200 : 422).json({ ok: okCount > 0, imported: okCount, failed: results.length - okCount, results: results.map(({ internal, ...r }) => r), library: to(t, "") });
        if (okCount) flash(req, results.length === okCount ? "ok" : "warn", `${okCount} fichier${okCount > 1 ? "s" : ""} importé${okCount > 1 ? "s" : ""}${results.length > okCount ? `, ${results.length - okCount} refusé${results.length - okCount > 1 ? "s" : ""}` : ""}.`);
        res.render("marketing/polices-upload", { ...base(req, t, {}), title: "Polices — Téléversement", tab: "/televerser", readOnly: t.readOnly, results: results.map(({ internal, ...r }) => r), fontsLimits: lim, counts: fonts.counts(t.siteId) });
      } catch (error) {
        if (error instanceof UserError || error instanceof MarketingError) return fail(422, error.message);
        next(error);
      }
    });
  });

  // ----- Installer des polices (Google Fonts auto-hébergées) -----
  router.get("/site-web/polices/installer", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const f = { q: clean(req.query.q), category: oneOf(req.query.categorie, ["all", "sans-serif", "serif", "display", "cursive", "monospace", "variable", "slab-serif"], "all"), sort: oneOf(req.query.tri, ["nom", "populaire"], "nom") };
    const result = fonts.catalogPage(t.siteId, { q: f.q, category: f.category === "variable" ? "all" : f.category, variable: f.category === "variable" ? "1" : "", sort: f.sort, page: req.query.page, perPage: 20 });
    res.render("marketing/polices-install", { ...base(req, t, {}), title: "Polices — Installer des polices", tab: "/installer", f, result, readOnly: t.readOnly, counts: fonts.counts(t.siteId) });
  });
  router.get("/site-web/polices/installer/:family", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const id = String(req.params.family);
    const fam = FAMILY.test(id) ? fonts.catalogFamily(t.siteId, id) : null;
    if (!fam) return res.status(404).render("error", { message: "Cette famille n'existe pas dans le catalogue." });
    res.render("marketing/polices-family", { ...base(req, t, {}), title: fam.family, tab: "/installer", fam, readOnly: t.readOnly, back: to(t, "/installer", { q: clean(req.query.q), categorie: clean(req.query.categorie, 20), page: idOf(req.query.page) || "" }) });
  });
  router.post("/site-web/polices/installer", need("appearance.styles"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    const family = String(req.body.famille || "");
    const raw = [].concat(req.body.variantes || []).slice(0, 60);
    const variants = raw.map((v) => { const m = /^(\d{1,4})-(normal|italic)$/.exec(String(v)); return m ? { weight: Number(m[1]), style: m[2] } : null; });
    if (variants.some((v) => v === null)) return done(req, res, t, "error", "Variantes invalides.", `/installer/${encodeURIComponent(FAMILY.test(family) ? family : "")}`);
    if (t.readOnly) return done(req, res, t, "error", readOnlyMsg, "/installer");
    try {
      const r = fonts.installGoogle(req.mk.ctx, t.siteId, family, variants);
      const msg = r.created ? `« ${r.font.family} » installée sur « ${t.name} » (${r.added} variante${r.added > 1 ? "s" : ""}). Elle est dans la bibliothèque et utilisable dans les réglages typographiques du site.`
        : r.added ? `« ${r.font.family} » : ${r.added} variante${r.added > 1 ? "s" : ""} ajoutée${r.added > 1 ? "s" : ""}.` : `« ${r.font.family} » est déjà installée avec ces variantes : rien à faire.`;
      flash(req, r.created || r.added ? "ok" : "info", msg);
      res.redirect(to(t, r.created || r.added ? "" : `/installer/${r.font.key}`, r.created || r.added ? { q: r.font.family } : {}));
    } catch (error) {
      if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error);
      done(req, res, t, "error", error.message, `/installer${FAMILY.test(family) && fonts.catalogFamily(t.siteId, family) ? `/${family}` : ""}`);
    }
  });

  // ----- Fiche d'une police du site -----
  const fontOf = (req, res, t) => {
    const f = fonts.get(t.siteId, idOf(req.params.id));
    if (!f) { res.status(404).render("error", { message: "Cette police n'existe pas sur ce site." }); return null; }
    return f;
  };
  router.get("/site-web/polices/:id(\\d+)", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const f = fontOf(req, res, t); if (!f) return;
    res.render("marketing/polices-detail", { ...base(req, t, {}), title: f.family, tab: "", font: f, readOnly: t.readOnly, sample: clean(req.query.texte, 160) });
  });
  router.post("/site-web/polices/:id(\\d+)/activer", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    run(req, res, next, t, "", () => `« ${fonts.setStatus(req.mk.ctx, t.siteId, idOf(req.params.id), "active").family} » est de nouveau proposée dans les réglages du site.`);
  });
  router.post("/site-web/polices/:id(\\d+)/desactiver", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    run(req, res, next, t, "", () => `« ${fonts.setStatus(req.mk.ctx, t.siteId, idOf(req.params.id), "disabled").family} » est désactivée : elle n'est plus proposée ni servie.`);
  });
  router.post("/site-web/polices/:id(\\d+)/categorie", need("appearance.styles"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    const id = idOf(req.params.id);
    run(req, res, next, t, `/${id}`, () => { const f = fonts.setCategory(req.mk.ctx, t.siteId, id, String(req.body.categorie || "")); return `Catégorie de « ${f.family} » mise à jour : elle sert de police de repli.`; });
  });
  router.post("/site-web/polices/:id(\\d+)/supprimer", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    const id = idOf(req.params.id);
    if (t.readOnly) return done(req, res, t, "error", readOnlyMsg, "");
    try { const r = fonts.remove(req.mk.ctx, t.siteId, id); done(req, res, t, "ok", `« ${r.family} » supprimée de « ${t.name} ».${r.source === "google" ? " Elle reste disponible dans le catalogue." : " Ses fichiers ont été effacés."}`, ""); }
    catch (error) { if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error); done(req, res, t, "error", error.message, `/${id}`); }
  });
  router.post("/site-web/polices/:id(\\d+)/variantes/:fileId(\\d+)/supprimer", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    const id = idOf(req.params.id);
    if (t.readOnly) return done(req, res, t, "error", readOnlyMsg, `/${id}`);
    try { const r = fonts.removeVariant(req.mk.ctx, t.siteId, id, idOf(req.params.fileId)); done(req, res, t, "ok", r.familyRemoved ? `« ${r.family} » supprimée (c'était sa dernière variante).` : "Variante supprimée.", r.familyRemoved ? "" : `/${id}`); }
    catch (error) { if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error); done(req, res, t, "error", error.message, `/${id}`); }
  });

  // ----- Pour les éditeurs : polices téléversées du site (sélecteur) et leurs règles @font-face d'aperçu -----
  router.get("/site-web/polices/mes-polices.json", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    res.set("Cache-Control", "private, no-store");
    res.json({ site: t.siteId, families: fonts.pickerFonts(t.siteId) });
  });
  router.get("/site-web/polices/mes-polices.css", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    res.set("Content-Type", "text/css; charset=utf-8");
    res.set("Cache-Control", "private, no-store");
    res.send(fonts.adminFaceCss(t.siteId));
  });
  return router;
};
