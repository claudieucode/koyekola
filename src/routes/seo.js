// robots.txt et sitemap.xml : dire aux moteurs de recherche quoi explorer, et où se trouve la liste des pages.
const express = require("express");
const db = require("../config/database");
const { absoluteUrl, escapeXml, isoDate } = require("../utils/seo");
const { slugify } = require("../utils/format");
const blog = require("./blog");

const router = express.Router();

// Espaces privés : jamais explorés (les pages elles-mêmes sont aussi en « noindex »)
const DISALLOWED = ["/formateur", "/mes-cours", "/panier", "/commande", "/apprendre", "/certificat", "/favoris", "/connexion", "/inscription", "/uploads/videos", "/uploads/resources", "/marketing", "/u/", "/preferences/", "/t/", "/webhooks/"];

router.get("/robots.txt", (req, res) => {
  const lines = ["User-agent: *", ...DISALLOWED.map((p) => `Disallow: ${p}`), "", `Sitemap: ${absoluteUrl(req, "/sitemap.xml")}`, ""];
  res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(lines.join("\n"));
});

// Chaque fournisseur ajoute des pages au plan du site : { path, lastmod? }
const providers = [
  () => [{ path: "/" }, { path: "/catalogue" }, { path: "/a-propos" }, { path: "/faq" }, { path: "/contact" }],
  () =>
    db
      .prepare("SELECT DISTINCT category FROM courses WHERE published = 1 AND archived = 0 ORDER BY category")
      .all()
      .map((c) => ({ path: `/categorie/${slugify(c.category)}` })),
  () =>
    db
      .prepare("SELECT slug, updated_at, created_at FROM courses WHERE published = 1 AND archived = 0 ORDER BY created_at DESC")
      .all()
      .map((c) => ({ path: `/cours/${c.slug}`, lastmod: isoDate(c.updated_at || c.created_at) })),
  () => blog.sitemapEntries(),
];

router.get("/sitemap.xml", (req, res) => {
  const entries = providers.flatMap((provider) => provider());
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((e) => `  <url><loc>${escapeXml(absoluteUrl(req, e.path))}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`),
    "</urlset>",
    "",
  ].join("\n");
  res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(xml);
});

module.exports = router;
module.exports.providers = providers;
