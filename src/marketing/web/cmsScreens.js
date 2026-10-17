// Écrans de KOLAKISA CMS qui n'ont pas déjà leur propre route (articles, médias, navigation, apparence, commentaires,
// utilisateurs, SEO, redirections, outils, paramètres). Un seul routeur, un seul gabarit (views/marketing/cms-screen.ejs) :
// chaque écran est un « modèle d'écran » décrit ci-dessous. Règles du palier 1 :
//  - lecture seule : aucune écriture, aucune table nouvelle ; les données viennent de cmsData.js (tables existantes) ;
//  - un écran « preview » est l'interface d'une fonctionnalité d'un prochain palier : bandeau explicite, commandes
//    désactivées, état vide honnête — jamais de donnée ou d'action simulée ;
//  - une action n'est proposée que si elle mène à une fonctionnalité qui existe déjà (éditeur d'articles, Espace SEO…).
const express = require("express");
const pages = require("../pages");
const patterns = require("../pages/patterns");
const templates = require("../pages/templates");
const data = require("./cmsData");
const nav = require("./cmsNav");
const { need } = require("./kit");

const BASE = nav.BASE;
const PER_PAGE = 25;
const SOON = "Cette fonctionnalité arrive dans un prochain palier. L'interface est en place ; rien n'est encore enregistré ni modifié ici.";
const isInstructor = (req) => req.session.user && req.session.user.role === "formateur";
const fdate = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—");
const size = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace(".", ",")} Mo` : n >= 1024 ? `${Math.round(n / 1024)} Ko` : `${n || 0} o`);
const empty = (icon, title, text, cta) => ({ icon, title, text, cta: cta || null });
const dis = (label, title = "Disponible dans un prochain palier") => ({ label, disabled: true, title });

// Onglets d'une rubrique : la sous-page courante est marquée
const tabsOf = (section, sub, list) => list.map(([slug, label, count]) => ({ label, count, href: `${BASE}/${section}${slug ? "/" + slug : ""}`, current: (sub || "") === slug }));

// Outil externe réel : seulement si l'utilisateur peut y accéder (les écrans du formateur exigent le compte créateur)
const instructorLink = (req, href) => (isInstructor(req) ? href : null);

// ---------- Modèles d'écran ----------
const SCREENS = {
  // ----- Articles -----
  articles(req, ctx, sub) {
    // Liste, états, création, corbeille : articles.js ; catégories et étiquettes : taxonomies.js ; ici : auteurs (lecture seule)
    const rows = data.authors(ctx.db).map((a) => ({ cells: [{ text: a.username, href: `/blog/auteur/${a.id}` }, String(a.n), String(a.published || 0)] }));
    return { title: "Auteurs", lead: "Les auteurs des articles du blog.", actions: [dis("Ajouter un auteur")],
      table: { caption: "Auteurs", columns: [{ label: "Auteur" }, { label: "Articles", num: true }, { label: "Publiés", num: true }], rows, empty: empty("user", "Aucun auteur", "Un auteur apparaît dès qu'il a écrit un article.") } };
  },

  // ----- Apparence -----
  apparence(req, ctx, sub) {
    const sites = pages.listSites(ctx);
    const siteRows = (anchor, linkLabel) => sites.map((s) => ({ cells: [{ text: s.name, href: `${BASE}/sites/${s.id}` }, String(s.page_count ?? s.pages ?? "—"), s.status === "active" ? { status: { label: "Actif", cls: "mk-status-ok" } } : { status: { label: "Archivé", cls: "mk-status-off" } }], actions: [{ label: linkLabel, href: `${BASE}/sites/${s.id}/reglages${anchor}` }] }));
    const siteTable = (caption, anchor, linkLabel) => ({ caption, columns: [{ label: "Site" }, { label: "Pages", num: true }, { label: "Statut" }], rows: siteRows(anchor, linkLabel), empty: empty("globe", "Aucun site", "Créez un site pour régler son design, son en-tête et son pied de page.", { label: "Créer un site", href: `${BASE}/sites#nouveau` }) });
    if (sub === "templates") {
      const user = pages.listPageTemplates(ctx);
      return { title: "Templates", lead: "Les modèles de pages proposés quand vous créez une page. Les modèles de site complets (accueil, article, archive, 404) arriveront dans un prochain palier.",
        actions: [{ label: "Créer une page", href: "/marketing/pages#nouvelle", variant: "primary" }],
        table: { caption: "Modèles de pages", columns: [{ label: "Modèle" }, { label: "Catégorie" }, { label: "Description" }],
          rows: [...user.map((t) => ({ cells: [`${t.name}`, `Mes modèles · ${t.category}`, t.description || "—"] })), ...templates.catalog().map((t) => ({ cells: [t.name, t.category, t.description] }))], empty: empty("layout", "Aucun modèle", "") } };
    }
    if (sub === "patterns") {
      const list = patterns.catalog(ctx);
      return { title: "Patterns", lead: "Les blocs prêts à l'emploi du Page Builder, regroupés par catégorie. Ils s'insèrent depuis l'éditeur.", actions: [{ label: "Ouvrir les pages", href: "/marketing/pages", variant: "primary" }],
        table: { caption: "Patterns", columns: [{ label: "Pattern" }, { label: "Catégorie" }, { label: "Sections", num: true }], rows: list.map((p) => ({ cells: [p.label, p.category, String(p.sections.length)] })), empty: empty("layers", "Aucun pattern", "") } };
    }
    if (sub === "styles") return { title: "Styles", lead: "Le design system de chaque site : couleurs, polices, tailles, espacements, boutons. Ouvrez un site pour le modifier.", table: siteTable("Styles par site", "#design", "Modifier les styles") };
    if (sub === "en-tete") return { title: "En-tête", lead: "L'en-tête de chaque site, avec ses variantes par page.", table: siteTable("En-têtes par site", "#entete", "Modifier l'en-tête") };
    if (sub === "pied-de-page") return { title: "Pied de page", lead: "Le pied de page de chaque site.", table: siteTable("Pieds de page par site", "#parties", "Modifier le pied de page") };
    return { title: "Éditeur du site", lead: "Chaque page de vos sites s'édite dans l'éditeur visuel KOLAKISA (Page Builder). Les réglages communs d'un site se trouvent dans sa fiche.",
      cards: [{ icon: "layout", title: "Éditer une page", text: "Choisissez une page : elle s'ouvre dans l'éditeur visuel.", href: "/marketing/pages", label: "Ouvrir les pages" },
        { icon: "palette", title: "Styles du site", text: "Couleurs, polices, tailles et boutons.", href: `${BASE}/apparence/styles`, label: "Ouvrir les styles" },
        { icon: "layers", title: "En-tête et pied de page", text: "Composants affichés en haut et en bas de chaque page du site.", href: `${BASE}/apparence/en-tete`, label: "Ouvrir l'en-tête" }],
      table: siteTable("Sites", "", "Ouvrir le site") };
  },

  // ----- SEO (le moteur SEO existant reste la seule source) -----
  seo(req, ctx, sub) {
    const seoTool = (path) => instructorLink(req, `/formateur/seo${path}`);
    const tabs = tabsOf("seo", sub, [["", "Vue générale"], ["analyse", "Analyse"], ["meta", "Meta"], ["indexation", "Indexation"], ["sitemap", "Sitemap"], ["schema", "Schema"], ["open-graph", "Open Graph"], ["robots", "Robots"], ["404", "404"]]);
    const c = data.seoCounts(ctx.db);
    const note = "Le moteur SEO de KOLAKISA (audit, règles, schema, redirections, 404) est déjà en place ; cet écran n'en crée pas un second.";
    const pagesList = data.pagesSeo(ctx);
    const pageTable = (caption, columns, cell) => ({ caption, columns, rows: pagesList.map((p) => ({ cells: [{ text: p.name, href: `/marketing/pages/${p.id}`, sub: `/p/${p.slug}` }, ...cell(p)] })), empty: empty("layout", "Aucune page", "Les pages de vos sites apparaissent ici.") });
    const ok = (v) => (v ? { status: { label: "Renseigné", cls: "mk-status-ok" } } : { status: { label: "Manquant", cls: "mk-status-warn" } });
    const engine = (path, label) => ({ icon: "searchCheck", title: label, text: "Ouvre l'Espace SEO existant.", href: seoTool(path), label: "Ouvrir", disabledText: "Réservé au compte créateur." });
    switch (sub) {
      case "analyse": return { title: "Analyse SEO", lead: note, tabs, cards: [engine("/audit", "Audit SEO du site"), engine("/analyse", "Analyse d'une adresse"), engine("/regles", "Règles de contrôle")] };
      case "meta": return { title: "Meta", lead: "Titre et description de chaque page de vos sites, tels que le moteur de pages les sert (lecture seule).", tabs,
        table: pageTable("Meta des pages", [{ label: "Page" }, { label: "Titre SEO" }, { label: "Description" }], (p) => [ok(p.seoParsed.title || p.title), ok(p.seoParsed.description || p.description)]) };
      case "indexation": return { title: "Indexation", lead: "Quelles pages les moteurs de recherche peuvent indexer (lecture seule).", tabs,
        table: pageTable("Indexation des pages", [{ label: "Page" }, { label: "Indexation" }, { label: "Statut" }], (p) => [p.seoParsed.noindex || !p.indexable ? { status: { label: "Non indexée", cls: "mk-status-off" } } : { status: { label: "Indexable", cls: "mk-status-ok" } }, p.status === "published" ? "En ligne" : "Hors ligne"]) };
      case "sitemap": return { title: "Sitemap", lead: "Le plan du site est généré automatiquement et inclut les pages publiées et indexables.", tabs, cards: [{ icon: "globe", title: "sitemap.xml", text: "Ouvre le plan du site tel que les moteurs de recherche le lisent.", href: "/sitemap.xml", label: "Ouvrir le sitemap" }, engine("/technique", "Réglages techniques")] };
      case "schema": return { title: "Schema", lead: note, tabs, cards: [engine("/technique", "Données structurées (schema.org)")] };
      case "open-graph": return { title: "Open Graph", lead: "Image de partage des pages sur les réseaux sociaux (lecture seule).", tabs,
        table: pageTable("Open Graph des pages", [{ label: "Page" }, { label: "Image de partage" }], (p) => [ok(p.seoParsed.ogImage)]) };
      case "robots": return { title: "Robots", lead: "Le fichier robots.txt est généré automatiquement.", tabs, cards: [{ icon: "shield", title: "robots.txt", text: "Ouvre le fichier lu par les robots d'indexation.", href: "/robots.txt", label: "Ouvrir robots.txt" }, engine("/technique", "Réglages techniques")] };
      case "404": {
        const rows = data.list404(ctx.db).map((e) => ({ cells: [e.path, String(e.hits_human), String(e.hits_bot), fdate(e.last_seen)] }));
        return { title: "Erreurs 404", lead: "Adresses demandées qui n'existent pas, relevées par le moteur SEO (lecture seule).", tabs, actions: seoTool("/erreurs-404") ? [{ label: "Gérer les erreurs 404", href: seoTool("/erreurs-404"), variant: "primary" }] : [],
          table: { caption: "Erreurs 404", columns: [{ label: "Adresse" }, { label: "Visites", num: true }, { label: "Robots", num: true }, { label: "Dernière" }], rows, empty: empty("searchCheck", "Aucune erreur 404", "Aucune adresse inexistante n'a été demandée.") } };
      }
      default: return { title: "SEO", lead: note, tabs, stats: [{ label: "Redirections actives", value: c.redirects, href: `${BASE}/redirections` }, { label: "Adresses en erreur 404", value: c.errors404, href: `${BASE}/seo/404` }, { label: "Pages suivies", value: pagesList.length, href: `${BASE}/seo/meta` }],
        cards: [engine("", "Espace SEO"), engine("/audit", "Audit du site"), engine("/redirections", "Redirections")] };
    }
  },

  // ----- Redirections -----
  redirections(req, ctx) {
    const q = String(req.query.q || "").trim();
    const rows = data.listRedirects(ctx.db, { q }).map((r) => ({ cells: [r.source_path, r.target, String(r.status), r.enabled ? { status: { label: "Active", cls: "mk-status-ok" } } : { status: { label: "Désactivée", cls: "mk-status-off" } }, String(r.hits), fdate(r.created_at)] }));
    const manage = instructorLink(req, "/formateur/seo/redirections");
    return { title: "Redirections", lead: "Les redirections appliquées à votre site (lecture seule). Elles se créent et se modifient dans l'Espace SEO existant.", actions: manage ? [{ label: "Gérer les redirections", href: manage, variant: "primary" }] : [dis("Ajouter une redirection", "Réservé au compte créateur")],
      search: { enabled: true, placeholder: "Rechercher une adresse", q },
      table: { caption: "Redirections", columns: [{ label: "Ancienne URL" }, { label: "Nouvelle URL" }, { label: "Type" }, { label: "Statut" }, { label: "Visites", num: true }, { label: "Créée le" }], rows, empty: empty("arrowRightLeft", q ? "Aucune redirection trouvée" : "Aucune redirection", "Une redirection envoie les visiteurs d'une ancienne adresse vers la nouvelle.", manage ? { label: "Ajouter une redirection", href: manage } : null) } };
  },

  // ----- Outils -----
  outils(req, ctx, sub) {
    const tabs = tabsOf("outils", sub, [["", "Santé du site"], ["importer", "Importer"], ["exporter", "Exporter"], ["sauvegardes", "Sauvegardes"], ["diagnostic", "Diagnostic"], ["systeme", "Informations système"], ["maintenance", "Maintenance"], ["cache", "Caches"], ["contenu", "Outils de contenu"], ["logs", "Journal d'activité"]]);
    switch (sub) {
      case "sauvegardes": {
        const kind = { auto: "Automatique", manuelle: "Manuelle", migration: "Avant migration" };
        return { title: "Sauvegardes", lead: "Les copies de la base de données, faites chaque jour automatiquement (lecture seule).", tabs,
          table: { caption: "Sauvegardes", columns: [{ label: "Fichier" }, { label: "Type" }, { label: "Taille", num: true }, { label: "Date" }], rows: data.listBackups().slice(0, 50).map((b) => ({ cells: [b.name, kind[b.kind] || b.kind, size(b.size), fdate(new Date(b.createdAt).toISOString())] })), empty: empty("history", "Aucune sauvegarde", "Les sauvegardes automatiques apparaissent ici.") } };
      }
      case "logs": {
        const rows = data.auditLog(ctx, 100).map((l) => ({ cells: [fdate(l.created_at), l.username || "Système", l.action, `${l.resource_type}${l.resource_id ? " #" + l.resource_id : ""}`] }));
        return { title: "Logs", lead: "Le journal d'audit des actions du marketing et des pages (lecture seule, non modifiable).", tabs, table: { caption: "Journal d'audit", columns: [{ label: "Date" }, { label: "Qui" }, { label: "Action" }, { label: "Élément" }], rows, empty: empty("history", "Aucune entrée", "Les actions apparaissent ici.") } };
      }
      default: return null; // santé, import, export, diagnostic, système, maintenance, caches et outils de contenu : routes de tools.js (palier 13)
    }
  },
};

module.exports = () => {
  const router = express.Router();
  const sections = nav.GENERIC_SECTIONS.join("|");
  // Sous-pages connues de chaque rubrique : toute autre adresse est une vraie 404
  const known = new Map(nav.ALL.map((i) => [i.key, true]));
  router.get(new RegExp(`^/site-web/(${sections})(?:/([a-z0-9-]+))?/?$`), need("forms.read"), (req, res, next) => {
    const [section, sub] = [req.params[0], req.params[1] || ""];
    const key = sub ? `${section}/${sub}` : section;
    if (!known.has(key)) return next();
    const item = nav.itemOf(key);
    if (!req.mk.can(item.permission)) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'ouvrir cet écran." });
    // R7 lot 4 : le journal d'activité d'un SITE n'est lisible, par un accès limité à ce site, qu'avec la permission « audit.read » du site (rôle Administrateur) — jamais par simple droit « tools.view » ;
    // la liste elle-même est de toute façon réduite aux lignes de CE site (audit.scopeSql). L'équipe de l'organisation garde son accès actuel.
    if (key === "outils/logs" && req.mk.siteOnly && !req.mk.can("audit.read")) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'ouvrir cet écran." });
    const model = SCREENS[section](req, req.mk.ctx, sub);
    res.render("marketing/cms-screen", { active: key, query: req.query, preview: item.status === "preview", PER_PAGE, ...model, title: model.title });
  });
  return router;
};
module.exports.SCREENS = SCREENS;
