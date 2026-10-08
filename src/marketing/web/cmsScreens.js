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
    const fixed = { categories: 1, etiquettes: 1, auteurs: 1, ajouter: 1 };
    const counts = data.postCounts(ctx.db);
    const tabs = tabsOf("articles", sub, [["", "Tous", counts.all], ["brouillons", "Brouillons", counts.brouillons], ["programmes", "Programmés", counts.programmes], ["publies", "Publiés", counts.publies]]);
    const newHref = instructorLink(req, "/formateur/blog/nouveau");
    const add = newHref ? { label: "Ajouter un article", href: newHref, variant: "primary" } : dis("Ajouter un article", "Réservé au compte créateur");
    if (sub === "ajouter") {
      return { title: "Ajouter un article", lead: "L'éditeur d'articles de KOLAKISA (éditeur riche, mode Document, SEO, versions, sauvegarde automatique) est déjà en place : il s'ouvrira ici dans un prochain palier.",
        cards: [{ icon: "edit", title: "Écrire un article", text: "Ouvre l'éditeur d'articles existant.", href: newHref, label: "Ouvrir l'éditeur", disabledText: "Réservé au compte créateur." },
          { icon: "fileText", title: "Gérer le blog", text: "Liste, brouillons, publication et corbeille de blocs, dans l'espace du blog existant.", href: instructorLink(req, "/formateur/blog"), label: "Ouvrir le blog", disabledText: "Réservé au compte créateur." }] };
    }
    if (sub === "categories" || sub === "etiquettes") {
      const rows = (sub === "categories" ? data.categories(ctx.db) : data.tags(ctx.db)).map((c) => ({ cells: [{ text: c.name, href: sub === "categories" ? `/blog/categorie/${encodeURIComponent(c.name.toLowerCase().replace(/\s+/g, "-"))}` : null }, String(c.n)] }));
      const one = sub === "categories" ? "catégorie" : "étiquette";
      return { title: sub === "categories" ? "Catégories" : "Étiquettes", lead: `Les ${sub === "categories" ? "catégories" : "étiquettes"} sont aujourd'hui saisies dans chaque article ; la gestion centralisée (renommer, fusionner, hiérarchie) arrive dans un prochain palier.`,
        actions: [dis(`Ajouter une ${one}`)], search: { enabled: false, placeholder: `Rechercher une ${one}` },
        table: { caption: sub === "categories" ? "Catégories" : "Étiquettes", columns: [{ label: "Nom" }, { label: "Articles", num: true }], rows, empty: empty("tag", `Aucune ${one}`, `Les ${sub === "categories" ? "catégories" : "étiquettes"} apparaissent dès qu'un article en utilise.`) } };
    }
    if (sub === "auteurs") {
      const rows = data.authors(ctx.db).map((a) => ({ cells: [{ text: a.username, href: `/blog/auteur/${a.id}` }, String(a.n), String(a.published || 0)] }));
      return { title: "Auteurs", lead: "Les auteurs des articles du blog.", actions: [dis("Ajouter un auteur")],
        table: { caption: "Auteurs", columns: [{ label: "Auteur" }, { label: "Articles", num: true }, { label: "Publiés", num: true }], rows, empty: empty("user", "Aucun auteur", "Un auteur apparaît dès qu'il a écrit un article.") } };
    }
    const state = fixed[sub] ? null : sub || null;
    const q = String(req.query.q || "").trim();
    const posts = data.listPosts(ctx.db, { state, q });
    const rows = posts.map((p) => {
      const st = data.POST_STATUS[p.status] || [p.status, "mk-status-off"];
      return { cells: [{ text: p.title, href: newHref ? `/formateur/blog/${p.id}/modifier` : null, sub: `/blog/${p.slug}` }, { status: { label: st[0], cls: st[1] } }, p.author || "—", p.category || "—", fdate(p.published_at || p.updated_at)],
        actions: [...(newHref ? [{ label: "Modifier", href: `/formateur/blog/${p.id}/modifier` }] : []), ...(p.status === "published" ? [{ label: "Voir", href: `/blog/${p.slug}` }] : [])] };
    });
    const label = { brouillons: "Brouillons", programmes: "Programmés", publies: "Publiés" }[sub] || "Articles";
    return { title: label === "Articles" ? "Articles" : `Articles · ${label}`, lead: "Les articles du blog KOLAKISA. Cet écran est en lecture seule : la rédaction se fait dans l'éditeur d'articles existant.", actions: [add], tabs,
      search: { enabled: true, placeholder: "Rechercher un article", q },
      table: { caption: "Articles", columns: [{ label: "Titre" }, { label: "Statut" }, { label: "Auteur" }, { label: "Catégorie" }, { label: "Date" }], rows,
        empty: empty("fileText", q ? "Aucun article trouvé" : state ? `Aucun article ${label.toLowerCase()}` : "Aucun article", q ? "Essayez un autre mot." : "Les articles que vous écrivez apparaissent ici.", newHref ? { label: "Créer un article", href: newHref } : null) } };
  },

  // ----- Navigation -----
  navigation(req, ctx) {
    const menus = [["principal", "Menu principal"], ["pied", "Menu du pied de page"], ["mobile", "Menu mobile"], ["secondaire", "Menus secondaires"]];
    const cur = menus.find(([k]) => k === req.query.menu) ? req.query.menu : "principal";
    const list = pages.listPages(ctx, {}).slice(0, 30).map((p) => ({ name: p.name, hint: `/p/${p.slug}` }));
    return { title: "Navigation", lead: "Composez les menus de vos sites. L'ordre se règle par glisser-déposer. Pour l'instant, les menus se construisent dans l'élément « Menu » du Page Builder.", soon: SOON,
      tabs: menus.map(([k, l]) => ({ label: l, href: `${BASE}/navigation?menu=${k}`, current: cur === k })), actions: [dis("Enregistrer le menu")],
      tree: { pickerTitle: "Ajouter au menu", pickerHint: "Pages de vos sites (lecture seule)", candidates: list, treeTitle: menus.find(([k]) => k === cur)[1], emptyText: "Ce menu est vide. Les éléments ajoutés apparaîtront ici, réorganisables par glisser-déposer, avec leurs sous-menus." } };
  },

  // ----- Apparence -----
  apparence(req, ctx, sub) {
    const sites = pages.listSites(ctx);
    const siteRows = (anchor, linkLabel) => sites.map((s) => ({ cells: [{ text: s.name, href: `${BASE}/sites/${s.id}` }, String(s.page_count ?? s.pages ?? "—"), s.status === "active" ? { status: { label: "Actif", cls: "mk-status-ok" } } : { status: { label: "Archivé", cls: "mk-status-off" } }], actions: [{ label: linkLabel, href: `${BASE}/sites/${s.id}${anchor}` }] }));
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
    if (sub === "menus") return { title: "Menus", lead: "Les menus de navigation de vos sites.", soon: SOON, actions: [dis("Ajouter un menu")],
      cards: [{ icon: "menu", title: "Gérer la navigation", text: "Les emplacements de menus (principal, pied de page, mobile) se composent dans l'écran Navigation.", href: `${BASE}/navigation`, label: "Ouvrir Navigation" }] };
    return { title: "Éditeur du site", lead: "Chaque page de vos sites s'édite dans l'éditeur visuel KOLAKISA (Page Builder). Les réglages communs d'un site se trouvent dans sa fiche.",
      cards: [{ icon: "layout", title: "Éditer une page", text: "Choisissez une page : elle s'ouvre dans l'éditeur visuel.", href: "/marketing/pages", label: "Ouvrir les pages" },
        { icon: "palette", title: "Styles du site", text: "Couleurs, polices, tailles et boutons.", href: `${BASE}/apparence/styles`, label: "Ouvrir les styles" },
        { icon: "layers", title: "En-tête et pied de page", text: "Composants affichés en haut et en bas de chaque page du site.", href: `${BASE}/apparence/en-tete`, label: "Ouvrir l'en-tête" }],
      table: siteTable("Sites", "", "Ouvrir le site") };
  },

  // ----- Commentaires -----
  commentaires(req, ctx, sub) {
    const total = data.commentCount(ctx.db);
    const tabs = tabsOf("commentaires", sub, [["", "Tous", total], ["en-attente", "En attente", 0], ["approuves", "Approuvés", total], ["indesirables", "Indésirables", 0], ["corbeille", "Corbeille", 0]]);
    const q = String(req.query.q || "").trim();
    const columns = [{ label: "Auteur" }, { label: "Commentaire" }, { label: "Publié sur" }, { label: "Date" }, { label: "Statut" }];
    const preview = ["en-attente", "indesirables", "corbeille"].includes(sub);
    const rows = preview ? [] : data.listComments(ctx.db, { q }).map((c) => ({ cells: [c.author, c.body.length > 140 ? `${c.body.slice(0, 140)}…` : c.body, { text: c.post_title, href: `/blog/${c.post_slug}#commentaire-${c.id}` }, fdate(c.created_at), { status: { label: "Approuvé", cls: "mk-status-ok" } }], actions: [{ label: "Voir", href: `/blog/${c.post_slug}#commentaire-${c.id}` }] }));
    const noun = { "en-attente": "en attente", indesirables: "indésirable", corbeille: "dans la corbeille" }[sub];
    return { title: "Commentaires", lead: "Les commentaires laissés par les membres sous les articles. Aujourd'hui ils sont publiés immédiatement : la modération (approbation, indésirables, réponses, corbeille) arrive dans un prochain palier.",
      soon: preview ? SOON : null, tabs, search: { enabled: !preview, placeholder: "Rechercher un commentaire", q },
      table: { caption: "Commentaires", columns, rows, empty: empty("inbox", preview ? `Aucun commentaire ${noun}` : q ? "Aucun commentaire trouvé" : "Aucun commentaire", preview ? "Cette vue sera alimentée par la modération." : "Les commentaires des membres sous vos articles apparaissent ici.") } };
  },

  // ----- Utilisateurs -----
  utilisateurs(req, ctx, sub) {
    const team = data.listTeam(ctx);
    const tabs = tabsOf("utilisateurs", sub, [["", "Tous", team.length], ["ajouter", "Ajouter"], ["roles", "Rôles"], ["permissions", "Permissions"], ["invitations", "Invitations"]]).map((t) => ({ ...t, count: t.count }));
    if (sub === "roles") {
      const matrix = data.roleMatrix();
      const n = Object.fromEntries(matrix.roles.map((r) => [r, team.filter((u) => u.role === r).length]));
      return { title: "Rôles", lead: "Les quatre rôles de l'équipe, du plus restreint au plus complet. La création de rôles personnalisés arrive dans un prochain palier.", tabs, actions: [dis("Ajouter un rôle")],
        table: { caption: "Rôles", columns: [{ label: "Rôle" }, { label: "Droits" }, { label: "Membres", num: true }], rows: matrix.roles.slice().reverse().map((r) => ({ cells: [data.ROLE_LABEL[r], data.ROLE_TEXT[r], String(n[r])] })), empty: empty("shield", "", "") } };
    }
    if (sub === "permissions") {
      const matrix = data.roleMatrix();
      return { title: "Permissions", lead: "Qui peut faire quoi, aujourd'hui (lecture seule). Les permissions fines par contenu arrivent dans un prochain palier.", tabs,
        table: { caption: "Permissions par rôle", columns: [{ label: "Permission" }, ...matrix.roles.map((r) => ({ label: data.ROLE_LABEL[r] }))], rows: matrix.permissions.map((p) => ({ cells: [p.key, ...matrix.roles.map((r) => (p.byRole[r] ? "Oui" : "—"))] })), empty: empty("shield", "", "") } };
    }
    if (sub === "ajouter" || sub === "invitations") {
      return { title: sub === "ajouter" ? "Ajouter un utilisateur" : "Invitations", lead: sub === "ajouter" ? "Ajout d'un membre à l'équipe du site." : "Invitations envoyées par e-mail pour rejoindre l'équipe.", soon: SOON, tabs,
        actions: [dis(sub === "ajouter" ? "Ajouter un utilisateur" : "Inviter quelqu'un")],
        table: { caption: "Invitations", columns: [{ label: "E-mail" }, { label: "Rôle" }, { label: "Envoyée le" }, { label: "Statut" }], rows: [], empty: empty("mail", "Aucune invitation", "Les invitations en attente apparaîtront ici.") } };
    }
    const q = String(req.query.q || "").trim();
    const list = data.listTeam(ctx, { q });
    return { title: "Utilisateurs", lead: "L'équipe qui gère le site et le marketing. Les rôles sont fixes pour l'instant : la gestion complète des utilisateurs arrive dans un prochain palier.", tabs, actions: [dis("Ajouter un utilisateur")],
      search: { enabled: true, placeholder: "Rechercher un utilisateur", q },
      table: { caption: "Équipe", columns: [{ label: "Utilisateur" }, { label: "E-mail" }, { label: "Rôle" }, { label: "Membre depuis" }], rows: list.map((u) => ({ cells: [u.username, u.email, { status: { label: data.ROLE_LABEL[u.role] || u.role, cls: u.role === "owner" ? "mk-status-info" : "mk-status-off" } }, fdate(u.created_at)] })), empty: empty("users", q ? "Aucun utilisateur trouvé" : "Aucun utilisateur", "") } };
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
    const tabs = tabsOf("outils", sub, [["", "Santé du site"], ["importer", "Importer"], ["exporter", "Exporter"], ["sauvegardes", "Sauvegardes"], ["diagnostic", "Diagnostic"], ["logs", "Logs"], ["cache", "Cache"], ["remplacer", "Recherche / remplacement"]]);
    switch (sub) {
      case "importer": return { title: "Importer", lead: "Importer une page enregistrée au format KOLAKISA.", tabs, cards: [{ icon: "upload", title: "Importer une page", text: "L'import d'une page (fichier .json) se fait depuis la liste des pages.", href: "/marketing/pages", label: "Ouvrir les pages" }, { icon: "users", title: "Importer des contacts", text: "Import de contacts par fichier CSV.", href: "/marketing/importer", label: "Ouvrir l'import" }] };
      case "exporter": return { title: "Exporter", lead: "Chaque page s'exporte depuis sa fiche (fichier .json). L'export complet du site arrive dans un prochain palier.", tabs, cards: [{ icon: "download", title: "Exporter une page", text: "Ouvrez une page puis « Exporter ».", href: "/marketing/pages", label: "Ouvrir les pages" }] };
      case "sauvegardes": {
        const kind = { auto: "Automatique", manuelle: "Manuelle", migration: "Avant migration" };
        return { title: "Sauvegardes", lead: "Les copies de la base de données, faites chaque jour automatiquement (lecture seule).", tabs,
          table: { caption: "Sauvegardes", columns: [{ label: "Fichier" }, { label: "Type" }, { label: "Taille", num: true }, { label: "Date" }], rows: data.listBackups().slice(0, 50).map((b) => ({ cells: [b.name, kind[b.kind] || b.kind, size(b.size), fdate(new Date(b.createdAt).toISOString())] })), empty: empty("history", "Aucune sauvegarde", "Les sauvegardes automatiques apparaissent ici.") } };
      }
      case "logs": {
        const rows = data.auditLog(ctx, 100).map((l) => ({ cells: [fdate(l.created_at), l.username || "Système", l.action, `${l.resource_type}${l.resource_id ? " #" + l.resource_id : ""}`] }));
        return { title: "Logs", lead: "Le journal d'audit des actions du marketing et des pages (lecture seule, non modifiable).", tabs, table: { caption: "Journal d'audit", columns: [{ label: "Date" }, { label: "Qui" }, { label: "Action" }, { label: "Élément" }], rows, empty: empty("history", "Aucune entrée", "Les actions apparaissent ici.") } };
      }
      case "diagnostic": return { title: "Diagnostic", lead: "Contrôles techniques du site.", soon: SOON, tabs, actions: [dis("Lancer le diagnostic")], table: { caption: "Résultats", columns: [{ label: "Contrôle" }, { label: "Résultat" }, { label: "Détail" }], rows: [], empty: empty("activity", "Aucun diagnostic lancé", "Les résultats s'afficheront ici.") } };
      case "cache": return { title: "Cache", lead: "Gestion du cache des pages.", soon: SOON, tabs, actions: [dis("Vider le cache")], table: { caption: "Cache", columns: [{ label: "Zone" }, { label: "Taille", num: true }, { label: "Dernier vidage" }], rows: [], empty: empty("zap", "Rien à afficher", "Le cache sera géré ici.") } };
      case "remplacer": return { title: "Recherche / remplacement", lead: "Remplacer un texte dans tout le contenu du site.", soon: SOON, tabs, form: { fields: [{ label: "Rechercher", type: "text" }, { label: "Remplacer par", type: "text" }, { label: "Dans", type: "select", options: ["Pages", "Articles", "Pages et articles"] }], submit: "Remplacer" } };
      default: return { title: "Santé du site", lead: "Vue d'ensemble de l'état technique du site.", soon: SOON, tabs, actions: [dis("Analyser le site")],
        cards: [{ icon: "download", title: "Sauvegardes", text: "Vérifiez les sauvegardes automatiques.", href: `${BASE}/outils/sauvegardes`, label: "Ouvrir" }, { icon: "history", title: "Logs", text: "Consultez le journal d'audit.", href: `${BASE}/outils/logs`, label: "Ouvrir" }, { icon: "searchCheck", title: "Erreurs 404", text: "Adresses introuvables relevées.", href: `${BASE}/seo/404`, label: "Ouvrir" }] };
    }
  },

  // ----- Paramètres (interface seulement : champs désactivés) -----
  parametres(req, ctx, sub) {
    const tabs = tabsOf("parametres", sub, [["", "Général"], ["identite", "Identité"], ["domaine", "Domaine"], ["urls", "URLs"], ["permaliens", "Permaliens"], ["seo", "SEO"], ["performance", "Performance"], ["securite", "Sécurité"], ["confidentialite", "Confidentialité"], ["cookies", "Cookies"], ["scripts", "Scripts"], ["code", "Code personnalisé"], ["maintenance", "Maintenance"]]);
    const siteUrl = process.env.SITE_URL || "";
    const F = (label, type, extra = {}) => ({ label, type, ...extra });
    const SECTIONS = {
      "": ["Général", "Réglages généraux du site.", [F("Nom du site", "text"), F("Slogan", "text"), F("Langue du site", "select", { options: ["Français"] }), F("Fuseau horaire", "select", { options: ["Africa/Brazzaville"] })]],
      identite: ["Identité du site", "Logo, icône et nom affichés partout.", [F("Logo", "file"), F("Icône du site (favicon)", "file"), F("Nom affiché", "text")]],
      domaine: ["Domaine", "Adresse publique du site.", [F("Adresse principale", "text", { value: siteUrl, hint: siteUrl ? "Valeur actuelle (variable SITE_URL du serveur)." : "Non renseignée sur ce serveur." }), F("Domaines supplémentaires", "text")]],
      urls: ["URLs", "Structure des adresses.", [F("Adresse du site", "text", { value: siteUrl }), F("Préfixe des pages", "text", { value: "/p/", hint: "Valeur actuelle du moteur de pages." })]],
      permaliens: ["Permaliens", "Forme des adresses des pages et des articles.", [F("Structure des adresses", "select", { options: ["/p/nom-de-la-page (actuel)"] }), F("Base des articles", "text", { value: "/blog/", hint: "Valeur actuelle du blog." })]],
      seo: ["SEO", "Réglages SEO par défaut.", [F("Titre par défaut", "text"), F("Description par défaut", "textarea"), F("Image de partage par défaut", "file")]],
      performance: ["Performance", "Compression, cache et chargement.", [F("Cache des pages", "select", { options: ["Désactivé"] }), F("Chargement différé des images", "checkbox")]],
      securite: ["Sécurité", "Protection de l'accès et des formulaires.", [F("Limitation des tentatives de connexion", "checkbox"), F("Anti-robot des formulaires", "checkbox")]],
      confidentialite: ["Confidentialité", "Pages et mentions légales.", [F("Page de politique de confidentialité", "select", { options: ["—"] }), F("Page de mentions légales", "select", { options: ["—"] })]],
      cookies: ["Cookies", "Bandeau de consentement.", [F("Afficher le bandeau", "checkbox"), F("Texte du bandeau", "textarea")]],
      scripts: ["Scripts", "Scripts de mesure et d'intégration.", [F("Scripts de l'en-tête", "textarea"), F("Scripts du pied de page", "textarea")]],
      code: ["Code personnalisé", "CSS global du site.", [F("CSS personnalisé", "textarea")]],
      maintenance: ["Maintenance", "Mettre le site hors ligne temporairement.", [F("Activer le mode maintenance", "checkbox"), F("Message affiché aux visiteurs", "textarea")]],
    };
    const [title, lead, fields] = SECTIONS[sub || ""];
    return { title: `Paramètres · ${title}`, lead, soon: SOON, tabs, form: { fields, submit: "Enregistrer les modifications" } };
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
    const model = SCREENS[section](req, req.mk.ctx, sub);
    res.render("marketing/cms-screen", { active: key, query: req.query, preview: item.status === "preview", PER_PAGE, ...model, title: model.title });
  });
  return router;
};
module.exports.SCREENS = SCREENS;
