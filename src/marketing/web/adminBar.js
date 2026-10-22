// KOLAKISA CMS → barre d'administration : notifications du site actif (liste, ouverture, marquage « lu »). Le site vient de « ?site= » / du champ « site », VÉRIFIÉ par le serveur
// (siteTarget : accès limité → le sien seulement ; équipe → le site choisi, sinon le principal) ; la personne ne voit et ne marque que les éléments de CE site.
// L'état « lu » est celui du centre d'activité (une seule vérité). Aucun élément n'est inventé : sans commentaire à modérer ni activité, le panneau est vide.
const express = require("express");
const adminBar = require("../../services/adminBar");
const target = require("./siteTarget");

const BASE = "/marketing/barre";

module.exports = () => {
  const router = express.Router();
  const argsOf = (req, t) => ({ userId: req.session.user.id, siteId: t.siteId, can: req.mk.can, isFormateur: req.session.user.role === "formateur" });
  const spaceOf = (t) => ({ siteId: t.siteId, base: t.siteId ? `/marketing/site-web/sites/${t.siteId}` : "/marketing/site-web/principal" });
  const q = (t) => (t.siteId ? `site=${t.siteId}` : "");
  const label = (n) => (n > 9 ? "9+" : String(n));

  router.get("/barre/notifications.json", (req, res) => {
    const t = target(req, res, { json: true }); if (!t) return;
    const args = argsOf(req, t), n = adminBar.notifications(args);
    res.set("Cache-Control", "no-store").json({
      unread: n.unread, label: label(n.unread), total: n.total, siteName: t.name,
      items: n.items.map((i) => ({ key: i.key, kind: i.kind, title: i.title, detail: i.detail, excerpt: i.excerpt || "", at: i.at, unread: i.unread, href: `${BASE}/ouvrir?cle=${encodeURIComponent(i.key)}${t.siteId ? `&${q(t)}` : ""}` })),
    });
  });
  router.post("/barre/notifications/lu", (req, res) => {
    const t = target(req, res, { json: true }); if (!t) return;
    const args = argsOf(req, t);
    if (!adminBar.markRead(args, String((req.body && req.body.key) || ""))) return res.status(404).json({ error: { code: "not_found", message: "Cette notification n'existe plus." } });
    const unread = adminBar.unreadCount(args);
    res.set("Cache-Control", "no-store").json({ ok: true, unread, label: label(unread) });
  });
  router.post("/barre/notifications/tout-lu", (req, res) => {
    const t = target(req, res, { json: true }); if (!t) return;
    const args = argsOf(req, t);
    adminBar.markAllRead(args);
    const unread = adminBar.unreadCount(args);
    res.set("Cache-Control", "no-store").json({ ok: true, unread, label: label(unread) });
  });
  // Ouvrir une notification : marquée comme lue, puis redirection vers l'élément (adresse calculée par le serveur)
  router.get("/barre/ouvrir", (req, res) => {
    const t = target(req, res); if (!t) return;
    const args = argsOf(req, t), key = String(req.query.cle || "");
    const href = adminBar.markRead(args, key) ? adminBar.hrefOf(key, { space: spaceOf(t), userId: args.userId }) : null;
    if (!href) { req.session.mkFlash = { type: "error", text: "Cet élément n'existe plus.", noReopen: true }; return res.redirect(t.siteId ? `/marketing/site-web/sites/${t.siteId}/tableau-de-bord` : "/marketing"); }
    res.redirect(href);
  });
  return router;
};
