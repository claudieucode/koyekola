// KOLAKISA — adresses des avatars de commentaires (voir services/avatars). Publiques, sans cookie, sans donnée personnelle dans l'adresse.
const express = require("express");
const db = require("../config/database");
const avatars = require("../services/avatars");
const comments = require("../services/comments");
const router = express.Router();
const IMMUTABLE = "public, max-age=31536000, immutable";

router.get("/l/:type/:seed.svg", (req, res) => {
  const { type, seed } = req.params;
  if (!avatars.LOCAL.includes(type) || !/^[0-9a-f]{8,40}$/.test(seed)) return res.status(404).type("text/plain").send("Introuvable");
  const initials = /^[\p{L}\p{N}]{1,2}$/u.test(String(req.query.i || "")) ? String(req.query.i) : "?";
  res.set({ "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": IMMUTABLE, "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'", "X-Content-Type-Options": "nosniff" }).send(avatars.svg(type, seed, initials));
});

// Gravatar par le serveur : seulement pour un commentaire PUBLIÉ d'un contenu publié, si le site a accepté l'envoi externe
router.get("/g/:id.png", async (req, res) => {
  const fallback = () => res.redirect(302, `/avatar/l/mystery/${avatars.seedOf(String(req.params.id))}.svg`);
  try {
    const row = /^\d{1,9}$/.test(req.params.id) ? db.prepare("SELECT c.id, c.status, c.content_type, c.content_id, c.user_id, c.author_email, u.email AS user_email FROM blog_comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.id = ?").get(Number(req.params.id)) : null;
    if (!row || row.status !== "approved") return res.status(404).type("text/plain").send("Introuvable");
    const def = comments.CONTENT[row.content_type], content = def && def.row(row.content_id);
    if (!content || !def.published(content)) return res.status(404).type("text/plain").send("Introuvable");
    const cfg = comments.settingsOf(row.content_type, row.content_id);
    const email = row.user_id ? row.user_email : row.author_email;
    if (!cfg.show_avatars || !cfg.avatar_external || !avatars.EXTERNAL.includes(cfg.avatar_default) || !email) return fallback();
    const img = await avatars.gravatar(email, cfg.avatar_default, cfg.avatar_rating);
    res.set({ "Content-Type": img.type, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" }).send(img.body);
  } catch { fallback(); }
});
// Aperçu pour l'administration : un avatar généré par Gravatar pour une adresse de démonstration (jamais une vraie adresse), réservé aux personnes connectées
router.get("/preview/:type.png", async (req, res) => {
  if (!req.session || !req.session.user || !avatars.EXTERNAL.includes(req.params.type)) return res.status(404).type("text/plain").send("Introuvable");
  try {
    const img = await avatars.gravatar("apercu@kolakisa.invalid", req.params.type, "G");
    res.set({ "Content-Type": img.type, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" }).send(img.body);
  } catch { res.redirect(302, `/avatar/l/mystery/${avatars.seedOf("apercu")}.svg`); }
});
module.exports = router;
