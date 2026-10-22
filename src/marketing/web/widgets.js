// KOLAKISA CMS → Apparence → Widgets : éditeur des zones de widgets, des blocs et des widgets désactivés d'UN site.
// UN écran partagé (comme Thèmes) : le site vient de l'adresse vérifiée par le serveur (/sites/<id>/widgets → ?site=<id>, ou champ « site » / « ?site= »),
// jamais d'un état global ; sans site choisi, c'est le site principal (équipe seulement). Droits : appearance.read (voir) · appearance.publish (enregistrer : les widgets sont publics).
// Chaque écriture est limitée au site de la requête ; un accès limité à un site ne peut agir que sur le sien (contrôlé ici ET par la garde de portée des routes).
const express = require("express");
const widgets = require("../../services/widgets");
const catalog = require("../widgets/catalog");
const navigation = require("../../services/navigation");
const pages = require("../pages");
const { UserError } = require("../../utils/errors");
const { need } = require("./kit");

const BASE = "/marketing/site-web/widgets";

module.exports = () => {
  const router = express.Router();
  const json = express.json({ limit: "600kb" });
  const fail = (res, status, message, extra = {}) => res.status(status).json({ ok: false, error: message, ...extra });

  // Le site visé : accès limité → le sien (jamais un autre) ; équipe → le site choisi, sinon le principal. null = refusé (réponse déjà envoyée).
  // asJson : réponses d'erreur JSON (appels de l'éditeur) plutôt que pages d'erreur.
  function target(req, res, asJson) {
    const ctx = req.mk.ctx;
    const refuse = (status, message) => { if (asJson) fail(res, status, message); else res.status(status).render("error", { message }); return null; };
    const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
    const asked = raw === undefined || raw === null || raw === "" ? undefined : /^\d{1,12}$/.test(String(raw)) ? Number(raw) : NaN;
    let siteId;
    if (ctx.siteScope !== undefined) {
      const own = Number.isInteger(ctx.siteScope) && ctx.siteScope > 0 ? ctx.siteScope : null;
      if (own === null || (asked !== undefined && asked !== own)) return refuse(403, "Vous n'avez pas accès à ce site.");
      siteId = own;
    } else if (asked === undefined) siteId = null;
    else if (Number.isNaN(asked) || asked < 1) return refuse(404, "Site introuvable.");
    else siteId = asked;
    if (siteId === null) return { siteId: null, name: "Site principal", principal: true, readOnly: false };
    const site = pages.getSite(ctx, siteId);
    if (!site) return refuse(404, "Site introuvable.");
    return { siteId, name: site.name, principal: false, readOnly: site.status !== "active" || Boolean(site.deleted_at) };
  }

  // ----- Écran -----
  router.get("/site-web/widgets", need("appearance.read"), (req, res) => {
    const t = target(req, res, false); if (!t) return;
    const state = widgets.get(t.siteId);
    const canEdit = req.mk.can("appearance.publish") && !t.readOnly;
    const q = new URLSearchParams(); if (t.siteId) q.set("site", String(t.siteId));
    const qs = q.toString() ? `?${q}` : "";
    const menus = navigation.listMenus({ siteId: t.siteId }).filter((m) => m.status === "published").map((m) => ({ id: m.id, name: m.name }));
    const data = {
      site: { id: t.siteId, name: t.name }, canEdit, readOnly: t.readOnly, revision: state.revision, layout: state.layout, updatedAt: state.updatedAt,
      zones: catalog.ZONES, categories: catalog.CATEGORIES, blocks: catalog.publicCatalog(), menus,
      urls: { save: `${BASE}/enregistrer${qs}`, preview: `${BASE}/apercu${qs}`, menus: `/marketing/site-web/apparence/menus${qs}` },
    };
    res.render("marketing/widgets", {
      title: "Widgets", active: "apparence/widgets", T: t, BASE, cmsWidgetsJs: true, canEdit, readOnly: t.readOnly,
      // Les « < » sont échappés : le JSON ne peut jamais fermer la balise qui le contient
      dataJson: JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, ""),
    });
  });

  // ----- Enregistrer (JSON) : tout ou rien, version contrôlée -----
  router.post("/site-web/widgets/enregistrer", need("appearance.publish"), json, (req, res, next) => {
    const t = target(req, res, true); if (!t) return;
    if (t.readOnly) return fail(res, 409, "Ce site est archivé ou supprimé : restaurez-le avant de modifier ses widgets.");
    const body = req.body && typeof req.body === "object" ? req.body : {};
    try {
      const saved = widgets.save(req.mk.ctx, t.siteId, body.layout, Number.isInteger(body.revision) ? body.revision : -1);
      res.json({ ok: true, revision: saved.revision, layout: saved.layout, updatedAt: saved.updatedAt });
    } catch (error) {
      if (error instanceof UserError) return fail(res, error.status || 400, error.message, error.status === 409 ? { conflict: true } : {});
      next(error);
    }
  });

  // ----- Aperçu d'un bloc (JSON) : même rendu que le site public, rien n'est enregistré -----
  router.post("/site-web/widgets/apercu", need("appearance.read"), json, (req, res) => {
    const t = target(req, res, true); if (!t) return;
    try { res.set("Cache-Control", "no-store").json({ ok: true, html: widgets.previewBlock(t.siteId, req.body && req.body.block) }); }
    catch (error) { fail(res, 400, error instanceof Error ? error.message : "Aperçu impossible."); }
  });

  return router;
};
