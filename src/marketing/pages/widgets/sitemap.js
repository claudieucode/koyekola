// Plan du site (comme le widget « Sitemap » d'Elementor) : la liste des pages, articles et formations publiés et indexables, rangés par type, en une à trois colonnes.
// Source : le même plan du site que celui proposé aux moteurs de recherche (sitemap.xml) — aucun contenu non public n'y figure.
module.exports = {
  type: "sitemap", label: "Plan du site", group: "site", icon: "list", version: 1, style: "text", status: "operational",
  description: "La liste des pages, articles et formations publiés",
  keywords: "plan du site sitemap liste pages articles formations navigation arborescence",
  schema: [
    { key: "label", kind: "text", label: "Nom du plan (lu par les lecteurs d'écran)", max: 60, required: true, default: "Plan du site" },
    { key: "pages", kind: "bool", label: "Afficher les pages", default: true },
    { key: "articles", kind: "bool", label: "Afficher les articles du blog", default: true },
    { key: "courses", kind: "bool", label: "Afficher les formations", default: true },
    { key: "columns", kind: "select", label: "Colonnes", options: [["1", "1"], ["2", "2"], ["3", "3"]], default: "2" },
    { key: "max", kind: "number", label: "Nombre maximum de liens par type", min: 5, max: 200, integer: true, default: 50 },
  ],
  validate(p, at) { if (!p.pages && !p.articles && !p.courses) throw new Error(`${at} : choisissez au moins un type de contenu à afficher.`); },
  data(ctx, p) {
    let list = [];
    try { list = require("../../../seo/sitemap").entries().included; } catch { list = []; }
    const nice = (e) => e.title || (e.path === "/" ? "Accueil" : decodeURIComponent(e.path.split("/").filter(Boolean).pop() || e.path).replace(/[-_]+/g, " "));
    const pick = (types) => list.filter((e) => types.includes(e.type) && !e.base).slice(0, p.max).map((e) => ({ path: e.path, title: nice(e) }));
    const groups = [];
    if (p.pages) groups.push({ key: "pages", label: "Pages", items: pick(["Page", "Page web"]) });
    if (p.articles) groups.push({ key: "articles", label: "Articles", items: pick(["Article"]) });
    if (p.courses) groups.push({ key: "courses", label: "Formations", items: pick(["Formation"]) });
    return { groups: groups.filter((g) => g.items.length) };
  },
};
