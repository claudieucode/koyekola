// robots.txt et sitemap.xml : produits par le SEO CORE (src/seo/robots.js et src/seo/sitemap.js) depuis la base réelle.
const express = require("express");
const robots = require("../seo/robots");
const sitemap = require("../seo/sitemap");

const router = express.Router();

router.get("/robots.txt", (req, res) => {
  res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(robots.text(req));
});

router.get("/sitemap.xml", (req, res) => {
  res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(sitemap.xml(req));
});

module.exports = router;
