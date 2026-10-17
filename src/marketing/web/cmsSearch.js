// KOLAKISA CMS → recherche d'administration (palier 23) : une seule barre pour retrouver une page, un article, un média ou un menu.
// Chaque famille n'est cherchée (et affichée) que si la personne a le droit de la lire ; les pages et articles à la corbeille ne sont pas proposés.
const express = require("express");
const db = require("../../config/database");

const LIMIT = 15;
// Les jokers LIKE saisis par la personne (% et _) sont neutralisés : on cherche le texte tel quel
const like = (text) => `%${String(text).replace(/[\\%_]/g, "\\$&")}%`;

module.exports = () => {
  const router = express.Router();
  router.get("/site-web/recherche", (req, res) => {
    const q = String(req.query.q || "").replace(/\s+/g, " ").trim().slice(0, 80);
    const can = req.mk.can;
    const found = { pages: [], articles: [], media: [], menus: [] };
    if (q) {
      const l = like(q), org = req.mk.ctx.organizationId;
      if (can("forms.read")) found.pages = db.prepare("SELECT id, name, slug, status FROM mk_landing_pages WHERE organization_id = ? AND archived_at IS NULL AND (name LIKE ? ESCAPE '\\' OR slug LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\') ORDER BY updated_at DESC LIMIT ?").all(org, l, l, l, LIMIT);
      if (can("articles.read")) found.articles = db.prepare("SELECT id, title, slug, status FROM posts WHERE deleted_at IS NULL AND (title LIKE ? ESCAPE '\\' OR slug LIKE ? ESCAPE '\\' OR excerpt LIKE ? ESCAPE '\\') ORDER BY updated_at DESC LIMIT ?").all(l, l, l, LIMIT);
      if (can("media.read")) found.media = db.prepare("SELECT id, name, path FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND (name LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' OR alt LIKE ? ESCAPE '\\') ORDER BY id DESC LIMIT ?").all(org, l, l, l, LIMIT);
      if (can("navigation.read")) found.menus = db.prepare("SELECT id, name FROM nav_menus WHERE name LIKE ? ESCAPE '\\' ORDER BY id DESC LIMIT ?").all(l, LIMIT);
    }
    res.render("marketing/cms-search", { title: "Recherche", active: "site-web", q, found, total: Object.values(found).reduce((n, list) => n + list.length, 0) });
  });
  return router;
};
