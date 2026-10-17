// R3 (A-07) — table déclarative des routes (web/routeScopes.js) : équivalence EXACTE avec l'ancienne cascade d'expressions régulières (conservée ci-dessous
// comme ORACLE, copiée de web/index.js à la base C, PLUS les règles ajoutées ensuite par MP, R5 et R6 dans le même ordre — adaptation d'intégration) et couverture : chaque route d'administration réellement montée appartient à une famille déclarée.
// Base en mémoire avec les vraies migrations ; aucun serveur.
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const { siteOfRequest, declaredFamily, SITE_RULES, FAMILIES, RESOURCE_TABLES } = require("../src/marketing/web/routeScopes");
const { createMarketingRouters } = require("../src/marketing/web");

// ---- ORACLE : l'ancienne fonction, inchangée ----
const legacySiteOfRequest = (db) => (req) => {
    const p = req.path;
    let m = /^\/pages\/(\d+)(?:\/|$)/.exec(p);
    if (m) { const r = db.prepare("SELECT site_id FROM mk_landing_pages WHERE id = ?").get(Number(m[1])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    m = /^\/site-web\/sites\/(\d+)(?:\/|$)/.exec(p);
    if (m) return { siteId: Number(m[1]) };
    // Espace du site principal (palier 3, B1) : le site principal est « siteId null » — réservé à l'équipe de l'organisation (jamais à un accès limité à un site)
    if (/^\/site-web\/principal(?:\/|$)/.test(p)) return { siteId: null };
    m = /^\/site-web\/historique\/page\/(\d+)(?:\/|$)/.exec(p);
    if (m) { const r = db.prepare("SELECT site_id FROM mk_landing_pages WHERE id = ?").get(Number(m[1])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    m = /^\/site-web\/composants\/(\d+)/.exec(p);
    if (m) { const r = db.prepare("SELECT site_id FROM mk_web_components WHERE id = ?").get(Number(m[1])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    // Outils (palier 13) : le site choisi (?site=) fixe le contexte des droits ; sans lui, l'organisation / le site principal
    // Moteur des pages (MP) : création / import JSON (site dans le corps), contrôle du nom (site dans l'adresse)
    if (req.method === "POST" && (p === "/pages/creer.json" || p === "/pages/importer.json") && req.body && /^\d{1,12}$/.test(String(req.body.siteId ?? ""))) return { siteId: Number(req.body.siteId) };
    if (req.method === "GET" && p === "/pages/nom.json" && /^\d{1,12}$/.test(String((req.query && req.query.site) ?? ""))) return { siteId: Number(req.query.site) };
    if (/^\/site-web\/(?:outils|parametres)(?:\/|$)/.test(p)) {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      if (/^\d{1,12}$/.test(String(raw ?? ""))) return { siteId: Number(raw) };
      return null;
    }
    // Email Engine (palier 16) : audiences, segments, modèles et campagnes d'UN site. Par identifiant : le site est celui de la ressource ;
    // pour les pages sans identifiant (liste, création), c'est « ?site= » ou le champ « site » envoyé — la personne limitée à un site n'ouvre que le sien.
    m = /^\/(campagnes|listes|segments|modeles|automatisations|tunnels)\/(\d{1,12})(?:\/|$)/.exec(p);
    if (m) {
      const tbl = { campagnes: "mk_campaigns", listes: "mk_lists", segments: "mk_segments", modeles: "mk_templates", automatisations: "mk_automations", tunnels: "mk_funnels" }[m[1]];
      const r = db.prepare(`SELECT site_id FROM ${tbl} WHERE id = ?`).get(Number(m[2]));
      return r ? { siteId: r.site_id } : { siteId: null, missing: true };
    }
    // Tests A/B (palier 22) : la liste d'UN site (?site=) s'ouvre aux personnes limitées à ce site ; une expérience porte le site de sa page
    if (req.method === "GET" && p === "/site-web/tests-ab" && /^\d{1,12}$/.test(String((req.query && req.query.site) ?? ""))) return { siteId: Number(req.query.site) };
    m = /^\/tests-ab\/(\d{1,12})(?:\/|$)/.exec(p);
    if (m) {
      const r = db.prepare("SELECT t.site_id FROM mk_page_tests t WHERE t.id = ?").get(Number(m[1]));
      return r ? { siteId: r.site_id } : { siteId: null, missing: true };
    }
    // Analytics central (palier 21) : le tableau de bord d'UN site (?site=) s'ouvre aux personnes qui n'ont accès qu'à ce site
    if (req.method === "GET" && /^\/analytics\/global(?:\/export)?$/.test(p) && /^\d{1,12}$/.test(String((req.query && req.query.site) ?? ""))) return { siteId: Number(req.query.site) };
    // Diagnostic d'un événement (palier 19) : le site est celui de l'événement
    m = /^\/evenements\/(\d{1,12})$/.exec(p);
    if (m) {
      const r = db.prepare("SELECT site_id FROM mk_events WHERE id = ?").get(Number(m[1]));
      return r ? { siteId: r.site_id } : { siteId: null, missing: true };
    }
    if (/^\/(?:campagnes|listes|segments|modeles|automatisations|tunnels)(?:\/(?:nouvelle|nouveau|apercu|apercu-cible|historique|parcours(?:\/.*)?|bibliotheque(?:\/.*)?))?$/.test(p)) {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      if (/^\d{1,12}$/.test(String(raw ?? ""))) return { siteId: Number(raw) };
      return null;
    }
    // Contact Core (palier 15) : lecture des contacts d'UN site (?site=) — c'est ce qui ouvre l'écran aux personnes qui n'ont accès qu'à ce site
    if (req.method === "GET" && /^\/contacts(?:\/export\.csv|\/\d+(?:\/evenements\.json)?)?$/.test(p) && /^\d{1,12}$/.test(String((req.query && req.query.site) ?? ""))) return { siteId: Number(req.query.site) };
    // Formulaires par site (R7 lot 2)
    m = /^\/formulaires\/(\d{1,12})(?:\/|$)/.exec(p);
    if (m) { const r = db.prepare("SELECT site_id FROM mk_forms WHERE id = ?").get(Number(m[1])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    if (/^\/formulaires(?:\/|$)/.test(p)) {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      return /^\d{1,12}$/.test(String(raw ?? "")) ? { siteId: Number(raw) } : null;
    }
    // Assistant IA (R7 lot 6.2)
    if (/^\/ia\/(?:etat|objets|reecrire|brouillon|optimiser|sms)$/.test(p)) {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      return /^\d{1,12}$/.test(String(raw ?? "")) ? { siteId: Number(raw) } : null;
    }
    // SMS par site (R7 lot 6.1)
    m = /^\/sms\/campagnes\/(\d{1,12})(?:\/|$)/.exec(p);
    if (m) { const r = db.prepare("SELECT site_id FROM mk_sms_campaigns WHERE id = ?").get(Number(m[1])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    if (/^\/sms(?:\/(?:campagnes|abonnes))?$/.test(p)) {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      return /^\d{1,12}$/.test(String(raw ?? "")) ? { siteId: Number(raw) } : null;
    }
    // Navigation par site (R8 lot 4)
    m = /^\/site-web\/navigation\/menus\/(\d{1,12})(?:\/|$)/.exec(p);
    if (m) { let r; try { r = db.prepare("SELECT site_id FROM nav_menus WHERE id = ?").get(Number(m[1])); } catch { r = undefined; } return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    m = /^\/site-web\/navigation\/elements\/(\d{1,12})(?:\/|$)/.exec(p);
    if (m) { let r; try { r = db.prepare("SELECT mn.site_id FROM nav_items i JOIN nav_menus mn ON mn.id = i.menu_id WHERE i.id = ?").get(Number(m[1])); } catch { r = undefined; } return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    if (/^\/site-web\/(?:navigation|apparence\/menus)(?:\/(?:menus|emplacements|importer|ressources))?$/.test(p)) {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      return /^\d{1,12}$/.test(String(raw ?? "")) ? { siteId: Number(raw) } : null;
    }
    // Revenus par site (R7 lot 6.5) : aperçu en lecture seule
    if (req.method === "GET" && p === "/contacts/nouveau") { const raw = (req.query && req.query.site) ?? ""; return /^\d{1,12}$/.test(String(raw)) ? { siteId: Number(raw) } : null; } // R8 lot 3
    if (req.method === "GET" && p === "/revenus") {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      return /^\d{1,12}$/.test(String(raw ?? "")) ? { siteId: Number(raw) } : null;
    }
    // Score par site (R7 lot 6.4) : aperçu en lecture seule
    if (req.method === "GET" && p === "/score") {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      return /^\d{1,12}$/.test(String(raw ?? "")) ? { siteId: Number(raw) } : null;
    }
    // Réseaux sociaux par site (R7 lot 6.3)
    m = /^\/reseaux\/(\d{1,12})\/(?:annuler|relancer|supprimer)$/.exec(p);
    if (m) { const r = db.prepare("SELECT site_id FROM mk_social_posts WHERE id = ?").get(Number(m[1])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    if (p === "/reseaux") {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      return /^\d{1,12}$/.test(String(raw ?? "")) ? { siteId: Number(raw) } : null;
    }
    // Demandes de rattachement (R7 lot 5) : « Mes demandes » d'un site
    if (req.method === "GET" && p === "/contacts/demandes" && /^\d{1,12}$/.test(String((req.query && req.query.site) ?? ""))) return { siteId: Number(req.query.site) };
    // Contacts par site (R7) : écriture d'un contact par un accès limité à un site (site = « ?site= » ou champ « site »)
    if (req.method === "POST" && /^\/contacts(?:\/(?:actions|\d+(?:\/(?:proprietes|etiquettes(?:\/retirer)?|listes(?:\/retirer)?|cycle-de-vie|etat|consentement|desinscrire|supprimer-adresse|effacer))?))?$/.test(p)) {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      if (/^\d{1,12}$/.test(String(raw ?? ""))) return { siteId: Number(raw) };
      return null;
    }
    if (req.method === "POST" && (p === "/pages" || p === "/site-web/composants") && req.body && /^\d+$/.test(String(req.body.site_id || ""))) return { siteId: Number(req.body.site_id) };
    // Médias par site (R5) et contenus par site (R6 lot 2) : règles ajoutées à la cascade d'origine, dans l'ordre de la branche R6
    m = /^\/site-web\/(?:mediatheque|medias)\/(\d{1,12})(?:\.json|\/|$)/.exec(p);
    if (m) { const r = db.prepare("SELECT site_id FROM mk_media WHERE id = ?").get(Number(m[1])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    const contentSite = (type, id) => { const s = require("../src/services/siteContent").siteOf(db, type, id); return s === undefined ? { siteId: null, missing: true } : { siteId: s }; };
    m = /^\/site-web\/articles\/(\d{1,12})(?:\/|$)/.exec(p);
    if (m) return contentSite("post", Number(m[1]));
    m = /^\/site-web\/articles\/termes\/(\d{1,12})(?:\/|$)/.exec(p);
    if (m) return contentSite("term", Number(m[1]));
    m = /^\/site-web\/commentaires\/(\d{1,12})(?:\/|$)/.exec(p);
    if (m) {
      const c = db.prepare("SELECT content_type, content_id FROM blog_comments WHERE id = ?").get(Number(m[1]));
      if (!c) return { siteId: null, missing: true };
      return c.content_type === "post" ? contentSite("post", c.content_id) : { siteId: null };
    }
    if (/^\/site-web\/(?:articles|commentaires)(?:\/|$)/.test(p)) {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      return /^\d{1,12}$/.test(String(raw ?? "")) ? { siteId: Number(raw) } : null;
    }
    if (/^\/site-web\/(?:mediatheque|medias)(?:\/|\.json$|$)/.test(p)) {
      const raw = req.query && req.query.site;
      return /^\d{1,12}$/.test(String(raw ?? "")) ? { siteId: Number(raw) } : null;
    }
    return null;
  };

// ---- fin de l'oracle ----

// ---- Jeu d'essai : sites, ressources et événements ----
let m, db, legacy, S1, S2;
const row = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
before(() => {
  m = freshMarketing();
  db = m.db;
  S1 = row("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Alpha', 'alpha', '{}')");
  S2 = row("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Beta', 'beta', '{}')");
  // Contenus (R6) : tables minimales du cœur (absentes d'une base marketing seule) + un article du site Alpha, un terme du site Beta, un commentaire de l'article
  db.exec("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, slug TEXT, title TEXT); CREATE TABLE IF NOT EXISTS taxonomy_terms (id INTEGER PRIMARY KEY, taxonomy TEXT, name TEXT, slug TEXT); CREATE TABLE IF NOT EXISTS blog_comments (id INTEGER PRIMARY KEY, post_id INTEGER, content_type TEXT, content_id INTEGER, body TEXT)");
  db.exec("INSERT INTO posts (id, slug, title) VALUES (1, 'a', 'A'), (2, 'b', 'B'); INSERT INTO taxonomy_terms (id, taxonomy, name, slug) VALUES (1, 'category', 'C', 'c'); INSERT INTO blog_comments (id, post_id, content_type, content_id, body) VALUES (1, 1, 'post', 1, 'x'), (2, 1, 'page', 1, 'y')");
  db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('post', 1, 1, ?, ''), ('term', 1, 1, ?, 'category')").run(S1, S2);
  db.prepare("INSERT INTO mk_forms (organization_id, name, slug, consent_text, site_id) VALUES (1, 'F1', 'f1', 'consentement', ?), (1, 'F2', 'f2', 'consentement', NULL)").run(S1);
  db.prepare("INSERT INTO mk_sms_campaigns (organization_id, name, body, site_id) VALUES (1, 'C1', 'x', ?), (1, 'C2', 'x', NULL)").run(S1);
  db.prepare("INSERT INTO mk_social_posts (organization_id, group_key, network, body, scheduled_at, site_id) VALUES (1, 'g', 'facebook', 'x', 1, ?), (1, 'g', 'facebook', 'x', 1, NULL)").run(S1);
  const sites = [S1, S2, null];
  for (const s of sites) {
    row("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (1, ?, ?, 't', 'draft', ?)", `P${s}`, `p-${s}`, s);
    row("INSERT INTO mk_web_components (organization_id, site_id, name, section) VALUES (1, ?, ?, '{}')", s, `C${s}`);
    const list = row("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (1, ?, ?)", `L${s}`, s);
    row("INSERT INTO mk_segments (organization_id, name, definition, site_id) VALUES (1, ?, '{}', ?)", `S${s}`, s);
    row("INSERT INTO mk_templates (organization_id, name, site_id) VALUES (1, ?, ?)", `T${s}`, s);
    row("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, site_id) VALUES (1, ?, 'list', ?, ?)", `Ca${s}`, list, s);
    row("INSERT INTO mk_automations (organization_id, name, trigger_event, site_id) VALUES (1, ?, 'contact_created', ?)", `A${s}`, s);
    row("INSERT INTO mk_funnels (organization_id, name, site_id) VALUES (1, ?, ?)", `F${s}`, s);
    m.bus.emit({ organizationId: 1, name: "page.viewed", email: `e${s}@ex.fr`, siteId: s, idempotencyKey: `ev-${s}` });
  }
  legacy = legacySiteOfRequest(db);
});

// ---- Énumération des routes réellement montées ----
function expandRegexp(re) {
  let s = re.source.replace(/\\\//g, "/").replace(/^\^/, "").replace(/\$$/, "");
  s = s.replace(/\(\?:[^()]*(?:\([^()]*\)[^()]*)*\)\?/g, "").replace(/\/\?$/, "");
  const g = /\(([^()]*\|[^()]*)\)/.exec(s);
  return g ? g[1].split("|").map((alt) => s.replace(g[0], alt)) : [s];
}
function concrete(routePath, id) {
  if (routePath instanceof RegExp) return expandRegexp(routePath);
  return [String(routePath).replace(/:[A-Za-z]+(?:\([^)]*\))?/g, String(id))];
}
// Préfixe de montage d'un sous-routeur, relu de l'expression régulière interne d'Express (« ^\\/site-web\\/parametres\\/api\\/?(?=\\/|$) » → « /site-web/parametres/api »)
const prefixOf = (layer) => {
  const src = layer.regexp && layer.regexp.source;
  if (!src || src === "^\\/?(?=\\/|$)") return "";
  return src.replace(/^\^/, "").replace(/\\\//g, "/").replace(/\(\?=\/\|\$\)$/, "").replace(/\/\?$/, "");
};
function mountedRoutes() {
  const routers = createMarketingRouters({ db });
  const out = [];
  (function walk(stack, prefix) {
    for (const l of stack) {
      if (l.route) {
        for (const method of Object.keys(l.route.methods)) for (const p of [].concat(l.route.path)) out.push({ method: method.toUpperCase(), path: p instanceof RegExp ? p : prefix + p });
      } else if (l.name === "router" && l.handle && l.handle.stack) walk(l.handle.stack, prefix + prefixOf(l));
    }
  })(routers.admin.stack, "");
  return out;
}

describe("la table déclarative reproduit EXACTEMENT l'ancienne logique (oracle)", () => {
  const variants = [
    {}, { query: { site: "2" } }, { query: { site: "x" } }, { query: { site: "" } }, { query: { site: "principal" } },
    { body: { site: "1" } }, { body: { site_id: "2" } }, { body: { site_id: "abc" } }, { query: { site: "2" }, body: { site: "1", site_id: "3" } },
    { query: { site: "123456789012345" } },
  ];
  const handmade = ["/pages/creer.json", "/pages/importer.json", "/site-web/articles", "/site-web/articles/1", "/site-web/articles/termes/1", "/site-web/articles/99999", "/site-web/commentaires", "/site-web/commentaires/1", "/site-web/commentaires/99999", "/site-web/mediatheque", "/site-web/mediatheque/1", "/site-web/mediatheque/1.json", "/site-web/medias.json", "/site-web/medias/1", "/", "/inconnue", "/pages", "/pages/1", "/pages/1/editeur", "/pages/abc", "/pages/99999", "/pages/nom.json", "/site-web/sites/7/pages", "/site-web/sites/x", "/site-web/principal", "/site-web/principal/tableau-de-bord",
    "/site-web/historique/page/2", "/site-web/historique/page/99999", "/site-web/composants", "/site-web/composants/1", "/site-web/composants/2/x", "/site-web/composants/99999", "/site-web/outils", "/site-web/outils/sante", "/site-web/parametres", "/site-web/parametres/general",
    "/campagnes", "/campagnes/nouvelle", "/campagnes/1", "/campagnes/2/pause", "/campagnes/99999", "/listes", "/listes/1", "/segments/3", "/modeles/1", "/modeles/bibliotheque", "/modeles/bibliotheque/k/apercu", "/modeles/apercu",
    "/automatisations", "/automatisations/parcours", "/automatisations/parcours/abc", "/automatisations/historique", "/automatisations/1", "/tunnels/1/etapes/2", "/tunnels/nouveau",
    "/tests-ab/1", "/tests-ab/99999", "/site-web/tests-ab", "/analytics/global", "/analytics/global/export", "/analytics/global/x", "/analytics", "/evenements/1", "/evenements/99999", "/evenements/1/x", "/evenements",
    "/contacts", "/contacts/actions", "/contacts/12", "/contacts/12/etiquettes", "/contacts/12/etiquettes/retirer", "/contacts/12/cycle-de-vie", "/contacts/12/etat", "/contacts/12/effacer", "/contacts/fusion", "/ia", "/ia/etat", "/ia/sms", "/ia/objets", "/ia/reecrire", "/ia/brouillon", "/ia/optimiser", "/sms", "/sms/abonnes", "/sms/campagnes", "/sms/campagnes/1", "/sms/campagnes/1/lancer", "/sms/campagnes/99999/annuler", "/sms/reglages", "/sms/test", "/sms/blocages", "/revenus", "/revenus/fenetre", "/score", "/score/regles", "/score/regles/1", "/score/niveaux", "/score/recalculer", "/reseaux", "/reseaux/1/annuler", "/reseaux/2/relancer", "/reseaux/99999/supprimer", "/reseaux/reglages", "/reseaux/reglages/sites", "/contacts/demandes", "/contacts/demandes/traiter", "/contacts/demandes/3/accepter", "/contacts/12/evenements.json", "/formulaires", "/formulaires/1", "/formulaires/1/publier", "/formulaires/99999/supprimer", "/contacts/12/x", "/contacts/doublons", "/webhooks", "/site-web/utilisateurs"];
  const paths = new Set(handmade);
  before(() => { for (const r of mountedRoutes()) for (const id of [1, 2, 99999]) for (const p of concrete(r.path, id)) paths.add(p); });

  test("mêmes résultats pour chaque adresse × méthode × variante de requête (plusieurs milliers de cas)", () => {
    let n = 0;
    for (const path of paths) for (const method of ["GET", "POST", "PUT"]) for (const v of variants) {
      const req = { path, method, query: v.query || {}, body: v.body || {} };
      assert.deepEqual(siteOfRequest(db, req), legacy(req), `${method} ${path} ${JSON.stringify(v)}`);
      n += 1;
    }
    assert.ok(n > 5000, `${n} cas comparés`);
  });
  test("sans req.query ni req.body (cas limites de l'ancienne fonction) : même résultat", () => {
    for (const path of ["/site-web/outils", "/campagnes", "/site-web/tests-ab", "/contacts", "/pages"]) {
      for (const method of ["GET", "POST"]) assert.deepEqual(siteOfRequest(db, { path, method }), legacy({ path, method }), `${method} ${path}`);
    }
  });
  test("résolutions attendues sur des cas connus (garde contre un oracle vide)", () => {
    assert.deepEqual(siteOfRequest(db, { path: "/pages/1", method: "GET" }), { siteId: S1 });
    assert.deepEqual(siteOfRequest(db, { path: "/pages/3", method: "GET" }), { siteId: null });
    assert.deepEqual(siteOfRequest(db, { path: "/pages/99999", method: "GET" }), { siteId: null, missing: true });
    assert.deepEqual(siteOfRequest(db, { path: "/campagnes/2", method: "POST" }), { siteId: S2 });
    assert.deepEqual(siteOfRequest(db, { path: "/site-web/principal", method: "GET" }), { siteId: null });
    assert.deepEqual(siteOfRequest(db, { path: "/site-web/sites/9", method: "GET" }), { siteId: 9 });
    assert.deepEqual(siteOfRequest(db, { path: "/listes", method: "GET", query: { site: "2" } }), { siteId: 2 });
    assert.equal(siteOfRequest(db, { path: "/listes", method: "GET", query: { site: "x" } }), null);
    assert.equal(siteOfRequest(db, { path: "/inconnue", method: "GET" }), null);
  });
});

describe("couverture : chaque route d'administration montée est déclarée dans une famille", () => {
  test("aucune route n'échappe à la table (une nouvelle route non déclarée ferait échouer ce test)", () => {
    const routes = mountedRoutes();
    assert.ok(routes.length > 400, `${routes.length} routes énumérées`);
    const undeclared = [];
    for (const r of routes) for (const p of concrete(r.path, 1)) if (!declaredFamily(p)) undeclared.push(`${r.method} ${p}`);
    assert.deepEqual(undeclared, [], "routes à déclarer dans FAMILIES (web/routeScopes.js)");
  });
  test("contrôle négatif : une famille inconnue n'est pas déclarée ; à l'exécution elle vaut « aucun site » (refus par défaut conservé)", () => {
    assert.equal(declaredFamily("/nouvelle-famille/1"), null);
    assert.equal(declaredFamily("/site-web/nouveau-module"), null);
    assert.equal(siteOfRequest(db, { path: "/nouvelle-famille/1", method: "POST", query: { site: "2" }, body: { site: "2", site_id: "2" } }), null);
  });
  test("les routes d'un contenu rattaché à un site et appelées par identifiant résolvent un site (sauf exceptions justifiées)", () => {
    // Exceptions : fiches et rapports qui relèvent du Contact Core ou de l'organisation, pas d'un site (le site y est un simple filtre en lecture)
    const EXCEPTIONS = [/^\/contacts\//, /^\/analytics\//, /^\/automatisations\/parcours\//, /^\/modeles\/bibliotheque\//, /^\/modeles\/blocs-enregistres\//, /^\/site-web\/(?:outils|parametres|tests-ab)(?:\/|$)/, /^\/evenements\/(?:abandons|synchroniser)/, /^\/segments\/apercu/, /^\/modeles\/(?:adresse|apercu)$/, /^\/campagnes\/apercu-cible$/];
    const idRoute = /^\/(?:pages|campagnes|listes|segments|modeles|automatisations|tunnels|tests-ab|evenements)\/1(?:\/|$)|^\/site-web\/(?:sites|composants|historique\/page)\/1(?:\/|$)/;
    const silent = [];
    for (const r of mountedRoutes()) for (const p of concrete(r.path, 1)) {
      if (!idRoute.test(p) || EXCEPTIONS.some((e) => e.test(p))) continue;
      if (!siteOfRequest(db, { path: p, method: r.method, query: {}, body: {} })) silent.push(`${r.method} ${p}`);
    }
    assert.deepEqual(silent, [], "routes par identifiant sans site résolu");
  });
  test("règles et familles : identifiants uniques, tables de ressources en liste fermée", () => {
    assert.equal(new Set(SITE_RULES.map((r) => r.id)).size, SITE_RULES.length);
    assert.equal(new Set(FAMILIES.map((f) => f.id)).size, FAMILIES.length);
    for (const t of Object.values(RESOURCE_TABLES)) assert.match(t, /^mk_[a-z_]+$/);
    assert.ok(FAMILIES.every((f) => ["site", "organization"].includes(f.scope)));
  });
});
