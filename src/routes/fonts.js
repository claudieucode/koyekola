// Font Manager : manifeste léger de la bibliothèque et règles @font-face à la demande (aperçus du sélecteur, canevas des éditeurs).
const express = require("express");
const fonts = require("../utils/fontLibrary");
const router = express.Router();

// Manifeste sans le détail des fichiers (le détail se déduit de l'identifiant) : de quoi chercher, filtrer et afficher les graisses
router.get("/polices/manifeste.json", (req, res) => {
  // Seulement ce que le sélecteur utilise (recherche, filtres, graisses, aperçu) : licence, source, repli, axes… restent côté serveur
  const list = fonts.list().map((f) => ({ id: f.id, family: f.family, category: f.category, categories: f.categories, popularity: f.popularity, weights: f.weights, styles: f.styles, variable: f.variable, stack: fonts.stack(f) }));
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ count: list.length, families: list });
});

// ?f=font.inter,font.lora : règles @font-face de ces familles seulement (au plus 40 par appel)
router.get("/polices.css", (req, res) => {
  const ids = String(req.query.f || "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 40);
  const css = ids.map((id) => fonts.byId(id)).filter(Boolean).map((f) => fonts.faceCss(f)).join("\n");
  res.set("Content-Type", "text/css; charset=utf-8");
  res.set("Cache-Control", "public, max-age=86400");
  res.send(css);
});

// Polices TÉLÉVERSÉES par un site : /polices/site/<48 caractères aléatoires>.<woff2|woff|ttf|otf>. L'adresse n'est pas devinable et n'est servie que tant que la
// famille est ACTIVE (désactivée ou supprimée : 404). Un site public doit pouvoir charger ses propres polices : l'isolation entre sites repose sur cet identifiant
// secret par fichier (aucun fichier n'est partagé entre deux sites) et sur la base, jamais sur un numéro de site lu dans l'adresse.
router.get("/polices/site/:name", (req, res) => {
  const m = /^([a-f0-9]{48})(\.(?:woff2|woff|ttf|otf))$/.exec(String(req.params.name));
  const hit = m ? require("../services/siteFonts").publicFile(m[1], m[2]) : null;
  if (!hit) return res.status(404).type("text/plain").send("Introuvable");
  res.set({ "Content-Type": hit.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'", "Cross-Origin-Resource-Policy": "same-origin" });
  res.sendFile(hit.file, { dotfiles: "deny" });
});

module.exports = router;
