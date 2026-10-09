// robots.txt et sitemap.xml : produits par le SEO CORE (src/seo/robots.js et src/seo/sitemap.js) depuis la base réelle, pour le site
// de l'hôte demandé (domaine propre d'un site) ou le site principal. Cache court : une publication, un changement d'adresse ou une
// redirection prennent effet en quelques minutes.
const express = require("express");
const robots = require("../seo/robots");
const sitemap = require("../seo/sitemap");

const router = express.Router();
const CACHE = "public, max-age=300";

router.get("/robots.txt", (req, res) => {
  res.type("text/plain").set("Cache-Control", CACHE).send(robots.text(req));
});

router.get("/sitemap.xml", (req, res) => {
  res.type("application/xml").set("Cache-Control", CACHE).send(sitemap.xml(req));
});
router.get("/sitemap-:part.xml", (req, res, next) => {
  const body = sitemap.xml(req, req.params.part);
  if (body === null) return next();
  res.type("application/xml").set("Cache-Control", CACHE).send(body);
});

module.exports = router;
