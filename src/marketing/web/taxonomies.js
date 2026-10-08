// KOLAKISA CMS → Articles → Catégories et Étiquettes (palier 5) : gestion des termes de la taxonomie (liste, recherche, tri, pagination,
// création, modification, suppression avec réassignation, fusion). Droits : taxonomies.read (voir), taxonomies.write (créer, modifier),
// taxonomies.delete (supprimer, fusionner). Un terme utilisé n'est jamais supprimé en silence : il faut dire où réassigner ses contenus.
const express = require("express");
const taxonomy = require("../../services/taxonomy");
const { UserError } = require("../../utils/errors");
const { need } = require("./kit");

const BASE = "/marketing/site-web/articles";
const PATHS = { category: `${BASE}/categories`, tag: `${BASE}/etiquettes` };
const PER_PAGE = 40;
const SLUGS = { categories: "category", etiquettes: "tag" };

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };
  const back = (req, key) => (new RegExp(`^${PATHS[key].replace(/\//g, "\\/")}(\\?[^#\\s]*)?$`).test(String(req.body.retour || "")) ? req.body.retour : PATHS[key]);
  const keyOf = (req) => (taxonomy.TAXONOMIES[req.body.taxonomy] ? req.body.taxonomy : null);

  // ----- Liste -----
  const show = (key) => (req, res) => {
    const def = taxonomy.TAXONOMIES[key];
    taxonomy.reconcile(); // articles venus d'une autre voie que l'éditeur
    const f = { q: String(req.query.q || "").trim().slice(0, 80), tri: Object.hasOwn(taxonomy.SORTS, req.query.tri) ? req.query.tri : "nom", inutilises: req.query.inutilises === "1", parent: /^\d{1,9}$/.test(String(req.query.parent || "")) || req.query.parent === "0" ? String(req.query.parent) : "" };
    let rows, total, page, pages;
    const flat = f.q || f.inutilises || f.parent || f.tri !== "nom" || !def.hierarchical;
    if (flat) {
      const r = taxonomy.list({ taxonomy: key, q: f.q, sort: f.tri, parentId: f.parent, unused: f.inutilises, page: req.query.page, perPage: PER_PAGE });
      rows = r.rows.map((t) => ({ ...t, depth: 0 })); total = r.total; page = r.page; pages = r.pages;
    } else {
      // Arbre : ordre de lecture (parent puis enfants), découpé en pages ; les chiffres ne sont calculés que pour les lignes affichées
      const all = taxonomy.tree(key);
      total = all.length; pages = Math.max(1, Math.ceil(total / PER_PAGE)); page = Math.min(Math.max(1, Number(req.query.page) || 1), pages);
      const slice = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
      const counted = new Map(taxonomy.counts(slice).map((t) => [t.id, t]));
      rows = slice.map((t) => ({ ...t, total: counted.get(t.id).total, live: counted.get(t.id).live, parent_name: t.parent_id ? (all.find((x) => x.id === t.parent_id) || {}).name : null }));
    }
    if (def.hierarchical) for (const r of rows) r.withChildren = taxonomy.subtreeCount(r.id, "all"); // contenus du terme et de ses sous-catégories, comptés une fois
    res.render("marketing/taxonomy-terms", {
      title: def.plural, active: key === "category" ? "articles/categories" : "articles/etiquettes", key, def, rows, total, page, pages, f, flat, PATHS, base: taxonomy.baseOf(key),
      options: def.hierarchical ? taxonomy.tree("category") : [], tagNames: key === "tag" ? taxonomy.list({ taxonomy: "tag", perPage: 200, sort: "nom" }).rows.map((t) => t.name) : [],
      canWrite: req.mk.can("taxonomies.write"), canDelete: req.mk.can("taxonomies.delete"), taxoJs: true,
    });
  };
  router.get(/^\/site-web\/articles\/(categories|etiquettes)\/?$/, need("taxonomies.read"), (req, res, next) => show(SLUGS[req.params[0]])(req, res, next));

  // ----- Écriture -----
  const act = (path, perm, fn) => router.post(path, need(perm), (req, res, next) => {
    try {
      const key = fn(req) || "category";
      res.redirect(back(req, key));
    } catch (error) {
      if (!(error instanceof UserError)) return next(error);
      flash(req, "error", error.message);
      res.redirect(back(req, taxonomy.TAXONOMIES[req.body.taxonomy] ? req.body.taxonomy : "category"));
    }
  });
  act("/site-web/articles/termes", "taxonomies.write", (req) => {
    const key = keyOf(req);
    if (!key) throw new UserError("Taxonomie inconnue.");
    const t = taxonomy.create({ taxonomy: key, name: req.body.name, slug: req.body.slug, description: req.body.description, parentId: req.body.parent_id ? Number(req.body.parent_id) : null });
    flash(req, "ok", `${taxonomy.TAXONOMIES[key].label} « ${t.name} » créée.`);
    return key;
  });
  act("/site-web/articles/termes/:id(\\d+)", "taxonomies.write", (req) => {
    const t = taxonomy.get(Number(req.params.id));
    if (!t) throw new UserError("Terme introuvable.");
    req.body.taxonomy = t.taxonomy;
    const u = taxonomy.update(t.id, { name: req.body.name, slug: req.body.slug, description: req.body.description, parentId: taxonomy.TAXONOMIES[t.taxonomy].hierarchical ? (req.body.parent_id ? Number(req.body.parent_id) : null) : undefined });
    flash(req, "ok", `« ${u.name} » enregistrée.`);
    return t.taxonomy;
  });
  act("/site-web/articles/termes/:id(\\d+)/supprimer", "taxonomies.delete", (req) => {
    const t = taxonomy.get(Number(req.params.id));
    if (!t) throw new UserError("Terme introuvable.");
    req.body.taxonomy = t.taxonomy;
    const r = taxonomy.remove(t.id, { reassignTo: req.body.reassign_to || null });
    flash(req, "ok", r.moved ? `« ${t.name} » supprimée : ${r.moved} article${r.moved > 1 ? "s" : ""} réassigné${r.moved > 1 ? "s" : ""} à « ${r.to.name} ».` : `« ${t.name} » supprimée.`);
    return t.taxonomy;
  });
  act("/site-web/articles/termes/:id(\\d+)/fusionner", "taxonomies.delete", (req) => {
    const t = taxonomy.get(Number(req.params.id));
    if (!t) throw new UserError("Terme introuvable.");
    req.body.taxonomy = t.taxonomy;
    // Étiquettes : la destination est saisie par son nom ; catégories : choisie dans la liste
    let target = req.body.target_id ? taxonomy.get(Number(req.body.target_id)) : null;
    if (!target && req.body.target_name) target = taxonomy.list({ taxonomy: t.taxonomy, q: String(req.body.target_name).trim(), perPage: 50 }).rows.find((x) => x.name.toLowerCase() === String(req.body.target_name).trim().toLowerCase()) || null;
    if (!target) throw new UserError("Choisissez le terme qui garde les contenus (il doit exister).");
    const r = taxonomy.merge(t.id, target.id);
    flash(req, "ok", `« ${t.name} » fusionnée dans « ${target.name} » (${r.moved} article${r.moved > 1 ? "s" : ""} transféré${r.moved > 1 ? "s" : ""}).`);
    return t.taxonomy;
  });
  router.post("/site-web/articles/termes/actions", need("taxonomies.delete"), (req, res, next) => {
    const key = keyOf(req) || "category";
    try {
      const ids = taxonomy.uniqueIds(req.body.ids).slice(0, 200);
      if (!ids.length) throw new UserError("Sélectionnez au moins un terme.");
      if (req.body.action !== "supprimer") throw new UserError("Action inconnue.");
      const done = [], failed = [];
      for (const id of ids) {
        const t = taxonomy.get(id);
        try { if (!t) throw new UserError("introuvable"); taxonomy.remove(id); done.push(id); } catch (e) { if (!(e instanceof UserError)) throw e; failed.push(`« ${t ? t.name : "#" + id} » : ${e.message}`); }
      }
      const head = done.length ? `${done.length} terme${done.length > 1 ? "s" : ""} supprimé${done.length > 1 ? "s" : ""}.` : "";
      if (!failed.length) flash(req, "ok", head); else if (!done.length) flash(req, "error", "Aucun terme n'a pu être supprimé.", failed.join(" · ")); else flash(req, "ok", `${head} ${failed.length} refusé${failed.length > 1 ? "s" : ""} (utilisés).`, failed.join(" · "));
      res.redirect(back(req, key));
    } catch (error) {
      if (!(error instanceof UserError)) return next(error);
      flash(req, "error", error.message); res.redirect(back(req, key));
    }
  });
  return router;
};
