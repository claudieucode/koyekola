// Fichiers publics des thèmes autonomes : /theme-packs/<clé>/style.css et /theme-packs/<clé>/motion.js. Publics (le site publié les charge), sans donnée de site ;
// le contenu ne dépend que du thème. Mise en cache longue : l'adresse porte une empreinte (?v=) qui change quand le thème change. Thème ou fichier inconnu : 404.
const express = require("express");
const packs = require("../themes/packs");

module.exports = () => {
  const router = express.Router();
  const send = (file, type) => (req, res) => {
    const p = packs.KEY.test(req.params.key) ? packs.get(req.params.key) : null;
    const body = p ? p[file] : "";
    if (!body) return res.status(404).type("text/plain").send("Introuvable");
    const etag = `"${p.hash}-${file}"`;
    if (req.get("if-none-match") === etag) return res.status(304).end();
    res.set({ "Content-Type": `${type}; charset=utf-8`, "Cache-Control": "public, max-age=604800", ETag: etag, "X-Content-Type-Options": "nosniff", "Access-Control-Allow-Origin": "*" }).send(body);
  };
  router.get("/theme-packs/:key/style.css", send("css", "text/css"));
  router.get("/theme-packs/:key/motion.js", send("js", "application/javascript"));
  return router;
};
