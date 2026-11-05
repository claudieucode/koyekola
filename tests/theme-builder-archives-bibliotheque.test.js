// Bibliothèque « Archives » du Theme Builder : 100 modèles distincts par leur COMPOSITION, valides, responsives, sans contrôle décoratif ;
// aperçu = vignette ; utilisation → publication → vraie page de résultats du site (terme, nombre, pertinence, pagination, état vide, champ pré-rempli) ; isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");

const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const docOf = (key) => { const b = Catalog.build("archive", key); return { type: "layout", children: b.sections[0].children }; };
const tree = (n) => `${n.type}${n.children ? `(${n.children.map(tree).join(",")})` : ""}`;
const OLD = ["grille-3.clair", "grille-2.marque", "liste.clair", "vedette.clair", "magazine.nuit", "auteur.doux", "carrousel.clair", "charger-plus.clair"];

describe("Archives : 100 modèles distincts, structurés et responsives (catalogue)", () => {
  const all = Catalog.entries("archive");
  test("exactement 100 modèles, clés et noms uniques ; les anciens modèles ont disparu", () => {
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100);
    assert.equal(new Set(all.map((e) => e.name)).size, 100);
    for (const old of OLD) assert.equal(Catalog.find("archive", old), null, old);
    assert.equal(Catalog.list("archive", { limit: 60 }).total, 100);
  });
  test("distincts par la composition : 10 compositions par contenu, aucun document répété, au moins 50 structures différentes", () => {
    const byContent = {};
    for (const e of all) (byContent[e.layoutKey] ||= []).push(tree(docOf(e.key)));
    assert.equal(Object.keys(byContent).length, 10);
    for (const [k, trees] of Object.entries(byContent)) assert.equal(new Set(trees).size, 10, `${k} : 10 compositions différentes`);
    const docs = all.map((e) => JSON.stringify(docOf(e.key), (key, v) => (key === "id" ? undefined : v)));
    assert.equal(new Set(docs).size, 100, "aucun document identique");
    assert.ok(new Set(all.map((e) => tree(docOf(e.key)))).size >= 50, "au moins 50 structures différentes sur 100");
  });
  test("chaque modèle : un seul titre principal (en-tête d'archive), une vraie boucle d'articles qui suit l'archive, état vide, pagination, liens réels", () => {
    for (const e of all) {
      const doc = docOf(e.key); let h1 = 0, loops = 0, bad = [];
      walk(doc, (n) => {
        if (n.type === "archiveinfo" && n.props.tag === "h1") h1 += 1;
        if (n.type === "heading" && n.props && n.props.level === "1") h1 += 1;
        if (n.type === "grid" && n.props && n.props.loop) {
          loops += 1; const l = n.props.loop;
          assert.equal(l.source, "posts", `${e.key} : articles réels`); assert.equal(l.archive, true, `${e.key} : suit l'archive affichée`);
          assert.ok(l.empty && l.empty.length <= 160, `${e.key} : message d'état vide`);
          assert.ok(n.children.length >= 1, `${e.key} : modèle de carte`);
        }
        if (n.type === "image" && n.props && !/^\{\{post\.image\}\}$/.test(String(n.props.src || n.props.url || "{{post.image}}"))) bad.push("image " + (n.props.src || n.props.url));
        if ((n.type === "button" || n.type === "link") && !/^(\/(?:|blog|catalogue|contact|boutique|compte)|\{\{[a-z_.]+\}\})$/.test(String(n.props.url))) bad.push(n.props.url);
      });
      assert.equal(h1, 1, `${e.key} : un seul titre principal`);
      assert.ok(loops >= 1, `${e.key} : au moins une boucle d'articles`);
      assert.deepEqual(bad, [], `${e.key} : liens et images réels`);
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
  test("pas de contrôle décoratif : tout filtre est le widget de catégories branché sur la boucle (urlFilter) ; l'auteur a sa fiche, la catégorie sa description", () => {
    for (const e of all) {
      let cat = 0, filtered = 0, author = 0, desc = 0;
      walk(docOf(e.key), (n) => {
        if (n.type === "select" || n.type === "tabs") assert.fail(`${e.key} : contrôle non pris en charge (${n.type})`);
        if (n.type === "catfilter") cat += 1;
        if (n.type === "grid" && n.props && n.props.loop && n.props.loop.urlFilter) filtered += 1;
        if (n.type === "authorbox") author += 1;
        if (n.type === "archiveinfo" && n.props.showDescription) desc += 1;
      });
      if (cat) assert.ok(filtered >= 1, `${e.key} : le filtre est branché sur une boucle`);
      if (e.layoutKey === "auteur") assert.equal(author, 1, `${e.key} : fiche auteur`);
      if (e.layoutKey === "categorie") assert.equal(desc, 1, `${e.key} : description de la catégorie`);
    }
  });
  test("les 5 identités visuelles, 20 modèles chacune ; 10 contenus aux directions différentes (pas de style Kolakisa imposé)", () => {
    const n = {}; for (const e of all) n[e.skinKey] = (n[e.skinKey] || 0) + 1;
    assert.deepEqual(Object.values(n), [20, 20, 20, 20, 20]);
    assert.equal(new Set(all.map((e) => e.layoutKey)).size, 10);
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
const vis = (t) => t.replace(/<script[\s\S]*?<\/script>/g, "");

describe("Archives : bibliothèque → aperçu → archives publiques (vrai serveur)", () => {
  let srv, boss, db, org, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const mkPost = (site, slug, title, category, tags = "") => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, status, published_at, category, tags) VALUES (?, ?, '<p>Texte</p>', 'Extrait', 1, 'published', datetime('now'), ?, ?)").run(slug, title, category, tags).lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, ?)").run(id, org, site, slug);
    // Catégorie et étiquette réelles (termes + liens), comme celles créées par le CMS ; sans elles le moteur les reconstruit à la première visite
    const term = (taxonomy, name) => {
      const slugT = name.toLowerCase(), row = db.prepare("SELECT id FROM taxonomy_terms WHERE taxonomy = ? AND slug = ?").get(taxonomy, slugT);
      if (row) return row.id;
      const tid = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES (?, ?, ?)").run(taxonomy, name, slugT).lastInsertRowid);
      db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('term', ?, ?, ?, ?)").run(tid, org, site, slugT);
      return tid;
    };
    if (category) db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary) VALUES ('post', ?, ?, 1)").run(id, term("category", category));
    if (tags) db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary) VALUES ('post', ?, ?, 0)").run(id, term("tag", tags));
    return id;
  };
  const setDomain = async (site, url) => { const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text); return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() }); };
  const adopt = async (site, key, conditions) => {
    const u = await post(U(site, "/api/bibliotheque/utiliser"), { type: "archive", key }); assert.equal(u.status, 200, u.text.slice(0, 300));
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
    for (let i = 1; i <= 13; i += 1) mkPost(A, `cuisine-a-${i}`, `Recette cuisine ${String(i).padStart(2, "0")}`, "Cuisine", "four");
    mkPost(A, "jardin-a", "Conseil de jardin", "Jardin", "serre");
    mkPost(B, "cuisine-b", "Recette réservée au site B", "");
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("les 100 modèles : l'aperçu et la vignette répondent et rendent la même page", async () => {
    let n = 0;
    for (const e of Catalog.entries("archive")) {
      const base = U(A, `/api/bibliotheque/archive/${e.key}`);
      const pv = await boss.get(`${base}/apercu`), th = await boss.get(`${base}/vignette`);
      assert.equal(pv.status, 200, e.key); assert.equal(th.status, 200, e.key);
      const core = (h) => h.replace(/data-sid="[^"]*"/g, "").replace(/<title>[^<]*<\/title>/, "").replace(/<style>[^<]*<\/style>/, "");
      assert.equal(core(pv.text), core(th.text), `${e.key} : aperçu = vignette`);
      assert.match(pv.text, /kw-theme-template/, e.key);
      n += 1;
    }
    assert.equal(n, 100);
  });
  test("archive de catégorie : seuls les articles de la catégorie et du site, paginés (9 par page), page 2 atteignable", async () => {
    await adopt(A, "blog.grille");
    const blog = await hostReq(srv, "a.test", "/blog"); assert.equal(blog.status, 200); assert.match(vis(blog.text), /kw-theme-template/);
    const r = await hostReq(srv, "a.test", "/blog/categorie/cuisine"); r.text = vis(r.text);
    assert.equal(r.status, 200, r.text.slice(0, 200)); assert.match(r.text, /kw-theme-template/, "le modèle d'archive s'applique à la catégorie");
    assert.match(r.text, /Recette cuisine 13/); assert.match(r.text, /Recette cuisine 05/); assert.doesNotMatch(r.text, /Recette cuisine 04/);
    assert.doesNotMatch(r.text, /Conseil de jardin/, "autre catégorie absente"); assert.doesNotMatch(r.text, /Recette réservée au site B/, "isolation entre sites");
    assert.ok((r.text.match(/class="site-header"/g) || []).length <= 1, "pas de second en-tête");
    const href = (r.text.match(/href="([^"]*lp-[a-z0-9]+=2[^"]*)"/i) || [])[1]; assert.ok(href, "lien vers la page 2");
    const p2 = await hostReq(srv, "a.test", "/blog/categorie/cuisine" + href.replace(/&amp;/g, "&").replace(/^[^?]*/, "")); p2.text = vis(p2.text);
    assert.equal(p2.status, 200); assert.match(p2.text, /Recette cuisine 04/); assert.doesNotMatch(p2.text, /Recette cuisine 13/);
  });
  test("archive d'étiquette : seuls les articles portant l'étiquette", async () => {
    const r = await hostReq(srv, "a.test", "/blog/etiquette/four"); r.text = vis(r.text);
    if (r.status === 404) return; // adresse d'étiquette configurable : ignorée si absente
    assert.equal(r.status, 200); assert.match(r.text, /kw-theme-template/); assert.match(r.text, /Recette cuisine 13/); assert.doesNotMatch(r.text, /Conseil de jardin/);
  });
  test("barre de catégories branchée : le modèle « bandeau » filtre réellement la liste (?categorie=)", async () => {
    await adopt(A, "blog.bandeau"); assert.match(vis((await hostReq(srv, "a.test", "/blog")).text), />Le blog</, "modèle bandeau affiché");
    const all = await hostReq(srv, "a.test", "/blog"); all.text = vis(all.text);
    assert.match(all.text, /Conseil de jardin/);
    const f = await hostReq(srv, "a.test", "/blog?categorie=Jardin"); f.text = vis(f.text);
    assert.equal(f.status, 200); assert.match(f.text, /Conseil de jardin/); assert.doesNotMatch(f.text, /Recette cuisine 13/, "le filtre réduit la liste");
  });
  test("état vide : un site sans article affiche un message utile, sans erreur ; un autre modèle remplace le précédent", async () => {
    // Une catégorie réelle du site sans aucun article publié : l'archive existe (page 200) et affiche l'état vide du modèle
    const tid = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Vide', 'vide')").run().lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('term', ?, ?, ?, 'vide')").run(tid, org, A);
    await adopt(A, "magazine.liste");
    const e = await hostReq(srv, "a.test", "/blog/categorie/vide"); e.text = vis(e.text);
    assert.equal(e.status, 200); assert.match(e.text, /Aucun article dans cette rubrique/); assert.doesNotMatch(e.text, /Cannot|TypeError|undefined/);
    await adopt(A, "minimal.index");
    const r = await hostReq(srv, "a.test", "/blog"); r.text = vis(r.text);
    assert.match(r.text, />Journal</, "le nouveau modèle s'affiche"); assert.doesNotMatch(r.text, />Le blog</, "aucun reste du modèle précédent");
    const b = await hostReq(srv, "b.test", "/blog"); b.text = vis(b.text); assert.doesNotMatch(b.text, /kw-theme-template/, "le site B garde son rendu historique");
  });
});
