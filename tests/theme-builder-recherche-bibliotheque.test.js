// Bibliothèque « Résultats de recherche » du Theme Builder : 100 modèles distincts par leur COMPOSITION, valides, responsives, sans contrôle décoratif ;
// aperçu = vignette ; utilisation → publication → vraie page de résultats du site (terme, nombre, pertinence, pagination, état vide, champ pré-rempli) ; isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");

const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const docOf = (key) => { const b = Catalog.build("search_results", key); return { type: "layout", children: b.sections[0].children }; };
const tree = (n) => `${n.type}${n.children ? `(${n.children.map(tree).join(",")})` : ""}`;
const OLD = ["vedette.clair", "extraits.clair", "grille-3.clair", "filtres.marque", "sans-resultat.nuit", "magazine.doux", "panneau.editorial", "compact.clair"];

describe("Résultats de recherche : 100 modèles distincts, structurés et responsives (catalogue)", () => {
  const all = Catalog.entries("search_results");
  test("exactement 100 modèles, clés et noms uniques ; les anciens modèles ont disparu", () => {
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100);
    assert.equal(new Set(all.map((e) => e.name)).size, 100);
    for (const old of OLD) assert.equal(Catalog.find("search_results", old), null, old);
    assert.equal(Catalog.list("search_results", { limit: 60 }).total, 100);
  });
  test("distincts par la composition : 10 compositions par contenu, aucun document répété, au moins 80 structures différentes", () => {
    const byContent = {};
    for (const e of all) (byContent[e.layoutKey] ||= []).push(tree(docOf(e.key)));
    assert.equal(Object.keys(byContent).length, 10);
    for (const [k, trees] of Object.entries(byContent)) assert.equal(new Set(trees).size, 10, `${k} : 10 compositions différentes`);
    const docs = all.map((e) => JSON.stringify(docOf(e.key), (key, v) => (key === "id" ? undefined : v)));
    assert.equal(new Set(docs).size, 100, "aucun document identique");
    assert.ok(new Set(all.map((e) => tree(docOf(e.key)))).size >= 80, "au moins 80 structures différentes sur 100");
  });
  test("chaque modèle : un seul titre principal (« Résultats pour … »), un champ de recherche, une vraie boucle de résultats avec état vide et pagination", () => {
    for (const e of all) {
      const doc = docOf(e.key); let h1 = 0, search = 0, loops = 0, bad = [];
      walk(doc, (n) => {
        if (n.type === "archiveinfo" && n.props.tag === "h1") h1 += 1;
        if (n.type === "heading" && n.props && n.props.level === "1") h1 += 1;
        if (n.type === "search") { search += 1; assert.equal(n.props.target, "blog", `${e.key} : la recherche mène aux résultats`); }
        if (n.type === "grid" && n.props && n.props.loop) {
          loops += 1; const l = n.props.loop;
          assert.equal(l.urlFilter, true, `${e.key} : boucle filtrée par ?q=`);
          assert.ok(["posts", "products", "courses", "pages"].includes(l.source), `${e.key} : source réelle`);
          assert.ok(l.empty && l.empty.length <= 160, `${e.key} : message d'état vide`);
          assert.ok(n.children.length >= 1, `${e.key} : modèle de carte`);
        }
        if ((n.type === "button" || n.type === "link") && !/^(\/(?:|blog|catalogue|contact|boutique|compte)|\{\{[a-z_.]+\}\})$/.test(String(n.props.url))) bad.push(n.props.url);
        if (n.type === "menu") for (const it of n.props.items) if (!/^\/(?:|blog|contact)$/.test(it.url)) bad.push(it.url);
      });
      assert.equal(h1, 1, `${e.key} : un seul titre principal`);
      assert.ok(search >= 1, `${e.key} : champ de recherche`);
      assert.ok(loops >= 1, `${e.key} : au moins une boucle de résultats`);
      assert.deepEqual(bad, [], `${e.key} : liens réels`);
    }
  });
  test("responsive : grilles adaptées à la tablette et au mobile, lignes qui passent à la ligne, aucun positionnement absolu", () => {
    for (const e of all) {
      let abs = 0, badGrid = 0, badRow = 0;
      walk(docOf(e.key), (n) => {
        const d = (n.styles && n.styles.desktop) || {};
        if (n.type === "grid" && !(n.props && n.props.loop)) { if (!(n.styles.tablet && n.styles.mobile)) badGrid += 1; }
        if (n.type === "grid" && n.props && n.props.loop && Number(d.columns) > 1) { if (!(n.styles.tablet && n.styles.mobile)) badGrid += 1; }
        if (d.position === "absolute" || d.position === "fixed") abs += 1;
        if (d.display === "flex" && d.flexDirection === "row" && d.flexWrap !== "wrap") badRow += 1;
      });
      assert.equal(abs, 0, `${e.key} : pas de positionnement absolu`);
      assert.equal(badGrid, 0, `${e.key} : grilles adaptées`);
      assert.equal(badRow, 0, `${e.key} : lignes qui passent à la ligne`);
    }
  });
  test("pas de contrôle décoratif : aucune barre de tri ou de filtre inventée, les filtres de catégories sont le widget réel", () => {
    for (const e of all) walk(docOf(e.key), (n) => {
      if (n.type === "select" || n.type === "tabs") assert.fail(`${e.key} : contrôle non pris en charge (${n.type})`);
      if (n.type === "catfilter") assert.equal(n.props.source, "posts");
    });
  });
  test("les 5 identités visuelles sont toutes présentes, 20 modèles chacune ; les contenus couvrent articles, produits, formations et pages", () => {
    const n = {}; for (const e of all) n[e.skinKey] = (n[e.skinKey] || 0) + 1;
    assert.deepEqual(Object.values(n), [20, 20, 20, 20, 20]);
    const sources = new Set(); for (const e of all) walk(docOf(e.key), (x) => { if (x.type === "grid" && x.props && x.props.loop) sources.add(x.props.loop.source); });
    assert.deepEqual([...sources].sort(), ["courses", "pages", "posts", "products"]);
  });
});

const hostReq = (srv, host, path) => {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text }));
    });
    r.on("error", reject); r.end();
  });
};
const count = (t, s) => t.split(s).length - 1;
// Texte visible de la page (sans les scripts : le JSON-LD du blog liste aussi des articles)
const vis = (t) => t.replace(/<script[\s\S]*?<\/script>/g, "");

describe("Résultats de recherche : bibliothèque → aperçu → site public (vrai serveur)", () => {
  let srv, boss, db, org, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const mkPost = (site, slug, title, extra = "") => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, status, published_at) VALUES (?, ?, ?, ?, 1, 'published', datetime('now'))").run(slug, title, `<p>${extra || "Texte"}</p>`, extra).lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, ?)").run(id, org, site, slug);
    return id;
  };
  const setDomain = async (site, url) => { const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text); return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() }); };
  const adopt = async (site, key) => {
    const u = await post(U(site, "/api/bibliotheque/utiliser"), { type: "search_results", key }); assert.equal(u.status, 200, u.text.slice(0, 300));
    const t = JSON.parse(u.text).template;
    const p = await post(U(site, `/api/modeles/${t.id}/publier`), { replace: true }); assert.equal(p.status, 200, p.text.slice(0, 300));
    return t;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = mkSite("Site A", "site-a"); B = mkSite("Site B", "site-b");
    const home = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, 'Accueil A', 'accueil-a', 'Accueil A', 'published', ?, datetime('now'), 'page', 1)").run(org, A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, A);
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, 'Tarifs mimosa', 'tarifs-mimosa', 'Tarifs mimosa', 'published', ?, datetime('now'), 'page', 1)").run(org, A);
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, 'Tarifs secrets de B', 'tarifs-b', 'Tarifs secrets de B', 'published', ?, datetime('now'), 'page', 1)").run(org, B);
    for (let i = 1; i <= 13; i += 1) mkPost(A, `mimosa-a-${i}`, `Mimosa pratique ${String(i).padStart(2, "0")}`);
    mkPost(A, "autre-a", "Un article sans rapport");
    mkPost(B, "mimosa-b", "Mimosa réservé au site B");
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("les 100 modèles : l'aperçu et la vignette répondent et rendent la même page", async () => {
    let n = 0;
    for (const e of Catalog.entries("search_results")) {
      const base = U(A, `/api/bibliotheque/search_results/${e.key}`);
      const pv = await boss.get(`${base}/apercu`), th = await boss.get(`${base}/vignette`);
      assert.equal(pv.status, 200, e.key); assert.equal(th.status, 200, e.key);
      const core = (h) => h.replace(/data-sid="[^"]*"/g, "").replace(/<title>[^<]*<\/title>/, "").replace(/<style>[^<]*<\/style>/, "");
      assert.equal(core(pv.text), core(th.text), `${e.key} : aperçu = vignette`);
      assert.match(pv.text, /kw-theme-template/, e.key);
      assert.match(pv.text, /type="search"/, `${e.key} : champ de recherche rendu`);
      n += 1;
    }
    assert.equal(n, 100);
  });
  test("page publique : terme recherché, nombre de résultats, champ pré-rempli, résultats pertinents du seul site, aucun résultat d'un autre site", async () => {
    await adopt(A, "blog.grille");
    const r = await hostReq(srv, "a.test", "/blog?q=mimosa"); r.text = vis(r.text);
    assert.equal(r.status, 200);
    assert.match(r.text, /Résultats pour («|&laquo;|&#171;)\s*mimosa/i, "terme affiché dans le titre");
    assert.match(r.text, /value="mimosa"/, "champ de recherche pré-rempli");
    assert.match(r.text, /Mimosa pratique 13/); assert.match(r.text, /Mimosa pratique 05/); assert.doesNotMatch(r.text, /Mimosa pratique 04/, "9 résultats par page (3 colonnes × 3)");
    assert.doesNotMatch(r.text, /Un article sans rapport/, "seuls les résultats correspondant à la requête");
    assert.doesNotMatch(r.text, /Mimosa réservé au site B/, "isolation entre sites");
    assert.match(r.text, /13/, "nombre de résultats");
  });
  test("pagination : 13 résultats, 9 par page → page 2 atteignable avec le même terme ; l'état vide rappelle le terme et propose de relancer la recherche", async () => {
    const r = await hostReq(srv, "a.test", "/blog?q=mimosa");
    const href = (r.text.match(/href="([^"]*lp-[a-z0-9]+=2[^"]*)"/i) || [])[1]; assert.ok(href, "lien vers la page 2");
    const p2 = await hostReq(srv, "a.test", "/blog" + href.replace(/&amp;/g, "&")); p2.text = vis(p2.text);
    assert.equal(p2.status, 200); assert.match(p2.text, /Mimosa pratique 04/); assert.match(p2.text, /Mimosa pratique 01/); assert.doesNotMatch(p2.text, /Mimosa pratique 13/);
    const none = await hostReq(srv, "a.test", "/blog?q=zzxqv");
    assert.equal(none.status, 200); assert.match(none.text, /Aucun résultat pour («|&laquo;|&#171;)\s*zzxqv/i, "état vide avec le terme");
    assert.match(none.text, /type="search"/, "possibilité de relancer une recherche");
    assert.doesNotMatch(none.text, /Cannot|TypeError|undefined/, "aucune erreur technique visible");
  });
  test("modèle « tout le site » : pages du site (du seul site), produits et formations sans erreur ; un autre modèle remplace le précédent", async () => {
    await adopt(A, "tout.liste");
    const r = await hostReq(srv, "a.test", "/blog?q=tarifs");
    assert.equal(r.status, 200); assert.match(r.text, /Tarifs mimosa/); assert.doesNotMatch(r.text, /Tarifs secrets de B/, "isolation des pages");
    assert.match(r.text, /Pages du site/); assert.match(r.text, /Produits/); assert.match(r.text, /Formations/);
    await adopt(A, "blog.index");
    const r2 = await hostReq(srv, "a.test", "/blog?q=mimosa"); r2.text = vis(r2.text);
    assert.doesNotMatch(r2.text, /Pages du site/, "aucun reste de l'ancien modèle");
    const b = await hostReq(srv, "b.test", "/blog?q=mimosa"); b.text = vis(b.text); assert.doesNotMatch(b.text, /Mimosa pratique/, "le site B ne montre pas les articles du site A");
  });
});
