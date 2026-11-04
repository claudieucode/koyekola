// Bibliothèque « Archive » du Theme Builder : 100 modèles distincts par leur COMPOSITION (pas par la couleur seule), valides, responsives, branchés sur le contexte réel de l'archive
// (liste qui suit l'archive affichée, pagination, état vide) ; aperçu = vignette ; utilisation → publication → archives réelles du site ; isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");

const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const docOf = (key) => { const b = Catalog.build("archive", key); return { type: "layout", children: b.sections[0].children }; };
// Arbre des types d'éléments seulement (la composition), sans valeurs ni identifiants
const tree = (n) => `${n.type}${n.children ? `(${n.children.map(tree).join(",")})` : ""}`;
// Signature de composition : arbre + réglages structurants des boucles (colonnes, pagination, carrousel, filtres d'adresse)
const signature = (doc) => { const parts = []; walk(doc, (n) => { if (n.type === "grid" && n.props && n.props.loop) { const l = n.props.loop; parts.push(`${n.styles.desktop.columns}|${l.pagination || (l.slider ? "slider" : "-")}|${l.urlFilter ? "f" : ""}|${l.count}|${l.offset || 0}`); } }); return `${tree(doc)}#${parts.join(";")}`; };

describe("Archive : 100 modèles distincts, structurés et responsives (catalogue)", () => {
  const all = Catalog.entries("archive");
  test("exactement 100 modèles, clés et noms uniques ; les anciens modèles ont disparu", () => {
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100);
    assert.equal(new Set(all.map((e) => e.name)).size, 100);
    for (const old of ["grille-3.clair", "lateral-droite.clair", "filet.nuit", "filtres-haut.doux", "bandeau.marque", "etiquettes.clair"]) assert.equal(Catalog.find("archive", old), null, old);
  });
  test("distincts par la composition : les 5 traitements d'un même contenu ont 5 structures différentes, aucun document n'est répété", () => {
    const byLayout = {};
    for (const e of all) (byLayout[e.layoutKey] ||= []).push(tree(docOf(e.key)));
    assert.equal(Object.keys(byLayout).length, 20);
    for (const [k, trees] of Object.entries(byLayout)) assert.equal(new Set(trees).size, 5, `${k} : 5 compositions`);
    const docs = all.map((e) => JSON.stringify(docOf(e.key), (key, v) => (key === "id" ? undefined : v)));
    assert.equal(new Set(docs).size, 100, "aucun document identique");
    assert.ok(new Set(all.map((e) => signature(docOf(e.key)))).size >= 95, "au moins 95 compositions différentes sur 100 (structure + réglages de boucle)");
  });
  test("chaque modèle : un seul titre d'archive, une liste qui suit l'archive, état vide, aucune image ni lien factice, aucune position absolue, responsive", () => {
    for (const e of all) {
      const doc = docOf(e.key); let h1 = 0, follow = 0, loops = 0, badLoop = 0, grids = 0, badGrid = 0, abs = 0, rows = 0, badRow = 0, srcBad = 0, hrefBad = 0;
      walk(doc, (n) => {
        if (n.type === "archiveinfo" && n.props.tag === "h1") h1 += 1;
        if (n.type === "grid" && n.props && n.props.loop) {
          const l = n.props.loop; loops += 1;
          if (l.archive === true) follow += 1;
          if (l.source !== "posts" || !l.empty || !(n.styles.tablet && n.styles.mobile)) badLoop += 1;
        } else if (n.type === "grid") { grids += 1; if (!(n.styles.tablet && n.styles.mobile)) badGrid += 1; }
        if (n.type === "image" && !/^\{\{post\.image\}\}$/.test(String(n.props.src))) srcBad += 1;
        if ((n.type === "button" || n.type === "link") && !/^\/[a-z-]*$|^\{\{/.test(String(n.props.url))) hrefBad += 1;
        if (n.type === "heading" && n.props.link && !/^\{\{post\.url\}\}$/.test(n.props.link)) hrefBad += 1;
        const d = (n.styles && n.styles.desktop) || {};
        if (d.position === "absolute" || d.position === "fixed") abs += 1;
        if (d.display === "flex" && d.flexDirection === "row") { rows += 1; if (d.flexWrap !== "wrap") badRow += 1; }
      });
      assert.equal(h1, 1, `${e.key} : un seul titre d'archive`);
      assert.ok(loops >= 1 && follow >= 1, `${e.key} : au moins une liste qui suit l'archive`);
      assert.equal(badLoop, 0, `${e.key} : boucles d'articles avec état vide, adaptées tablette / mobile`);
      assert.equal(badGrid, 0, `${e.key} : grilles adaptées`);
      assert.equal(srcBad, 0, `${e.key} : images dynamiques uniquement`);
      assert.equal(hrefBad, 0, `${e.key} : liens réels ou dynamiques`);
      assert.equal(abs, 0, `${e.key} : pas de positionnement absolu`);
      assert.equal(badRow, 0, `${e.key} : lignes qui passent à la ligne sur petit écran`);
    }
  });
  test("fonctionnalités d'archive présentes dans la bibliothèque : 5 paginations, carrousel, filtre d'adresse, auteur, filtres, recherche ; colonne latérale ≤ 2 colonnes", () => {
    const seen = new Set();
    for (const e of all) {
      walk(docOf(e.key), (n) => {
        if (n.type === "grid" && n.props && n.props.loop) {
          const l = n.props.loop; if (l.paginate) seen.add(`pagination:${l.pagination}`); if (l.slider) seen.add("slider"); if (l.urlFilter) seen.add("urlFilter");
          if (/\.(droite|gauche)$/.test(e.key)) assert.ok(n.styles.desktop.columns <= 2, `${e.key} : avec colonne latérale, 2 colonnes au plus`);
        }
        if (["authorbox", "catfilter", "search", "querylist"].includes(n.type)) seen.add(n.type);
      });
    }
    for (const f of ["pagination:numbers", "pagination:more", "pagination:infinite", "pagination:prevnext", "pagination:both", "slider", "urlFilter", "authorbox", "catfilter", "search", "querylist"]) assert.ok(seen.has(f), `fonctionnalité absente : ${f}`);
  });
  test("les 5 identités visuelles sont toutes présentes, 20 modèles chacune", () => {
    const n = {}; for (const e of all) n[e.skinKey] = (n[e.skinKey] || 0) + 1;
    assert.deepEqual(Object.values(n), [20, 20, 20, 20, 20]);
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

describe("Archive : bibliothèque → aperçu → archives publiques (vrai serveur)", () => {
  let srv, boss, db, org, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const setDomain = async (site, url) => { const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text); return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() }); };
  const mkPost = (site, slug, title, category, minutesAgo = 0) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, excerpt, content, category, published, status, published_at) VALUES (?, ?, ?, '<p>Texte</p>', ?, 1, 'published', datetime('now', ?))").run(slug, title, `Extrait de ${title}`, category, `-${minutesAgo} minutes`).lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, ?)").run(id, org, site, slug);
    // catégorie rattachée à son site, comme le fait l'éditeur (le même terme ne peut pas servir deux sites)
    const slugOf = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let term = db.prepare("SELECT t.id FROM taxonomy_terms t JOIN mk_content_sites c ON c.content_type = 'term' AND c.content_id = t.id WHERE t.taxonomy = 'category' AND t.slug = ? AND c.site_id = ?").get(`${slugOf}-${site}`, site);
    if (!term) {
      const tid = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug, description, parent_id) VALUES ('category', ?, ?, '', NULL)").run(category, `${slugOf}-${site}`).lastInsertRowid);
      db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('term', ?, ?, ?, ?)").run(tid, org, site, `${slugOf}-${site}`);
      term = { id: tid };
    }
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, 1, 0)").run(id, term.id);
  };
  const adopt = async (site, key) => {
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
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
    for (let i = 1; i <= 8; i++) mkPost(A, `actu-${i}`, `Actualité numéro ${i}`, "Actus", i);
    mkPost(A, "guide-unique", "Guide unique de A", "Guides", 30);
    mkPost(B, "article-b", "Article réservé au site B", "Rubrique de B", 1);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("les 100 modèles : l'aperçu et la vignette répondent, rendent le même modèle et l'archive de démonstration explicitement signalée", async () => {
    let n = 0;
    for (const e of Catalog.entries("archive")) {
      const base = U(A, `/api/bibliotheque/archive/${e.key}`);
      const pv = await boss.get(`${base}/apercu`), th = await boss.get(`${base}/vignette`);
      assert.equal(pv.status, 200, e.key); assert.equal(th.status, 200, e.key);
      const core = (h) => h.replace(/data-sid="[^"]*"/g, "").replace(/<title>[^<]*<\/title>/, "").replace(/<style>[^<]*<\/style>/, "");
      assert.equal(core(pv.text), core(th.text), `${e.key} : aperçu = vignette`);
      assert.match(pv.text, /kw-theme-template/, e.key);
      assert.match(pv.text, /Titre de l(?:'|&#39;)archive \(exemple\)/, `${e.key} : l'archive de démonstration est annoncée comme exemple`);
      n += 1;
    }
    assert.equal(n, 100);
  });
  test("aperçu de la bibliothèque : sans article, des articles d'exemple annoncés montrent la mise en page ; avec des articles, ce sont ceux du site", async () => {
    const C = mkSite("Site C vide", "site-c");
    const empty = await boss.get(U(C, "/api/bibliotheque/archive/liste-image.droite/apercu")); assert.equal(empty.status, 200);
    assert.match(empty.text, /Titre de l(?:'|&#39;)article d(?:'|&#39;)exemple 1/, "articles d'exemple quand le site n'en a pas");
    assert.doesNotMatch(empty.text, /Actualité numéro/, "aucun article d'un autre site");
    const withPosts = await boss.get(U(A, "/api/bibliotheque/archive/liste-image.droite/apercu"));
    assert.match(withPosts.text, /Actualité numéro/); assert.doesNotMatch(withPosts.text, /article d(?:'|&#39;)exemple/, "les vrais articles remplacent l'exemple");
  });
  test("publié : la liste suit l'archive du site A (blog complet, une catégorie, un seul résultat, recherche vide), sans contenu de démonstration ni article du site B", async () => {
    await adopt(A, "grille-3.pleine");
    const blog = await hostReq(srv, "a.test", "/blog"); assert.equal(blog.status, 200, srv.log().split("\n").filter((l) => /rror/.test(l)).slice(-3).join("\n"));
    assert.match(blog.text, /kw-theme-template/);
    assert.match(blog.text, /Actualité numéro 1/); assert.match(blog.text, /Guide unique de A/);
    assert.doesNotMatch(blog.text, /Article réservé au site B/, "isolation entre sites");
    assert.doesNotMatch(blog.text, /\(exemple\)|article d(?:'|&#39;)exemple/, "aucun contenu de démonstration sur le site publié");
    // archive d'une catégorie : seulement ses articles (un seul résultat pour « Guides »)
    const link = (re) => { const m = blog.text.match(re); return m ? m[1] : null; };
    const guides = link(/href="(\/[^"]*guides-\d+[^"]*)"/i); assert.ok(guides, "lien de la catégorie Guides");
    const g = await hostReq(srv, "a.test", guides); assert.equal(g.status, 200);
    assert.match(g.text, /Guide unique de A/); assert.doesNotMatch(g.text, /Actualité numéro/, "aucun article d'une autre catégorie");
    const actus = link(/href="(\/[^"]*actus-\d+[^"]*)"/i); assert.ok(actus, "lien de la catégorie Actus");
    const a = await hostReq(srv, "a.test", actus); assert.match(a.text, /Actualité numéro 3/); assert.doesNotMatch(a.text, /Guide unique de A/);
    // archive vide : l'état vide explicite remplace silencieusement rien
    const empty = await hostReq(srv, "a.test", "/blog?q=zzzintrouvablezzz"); assert.equal(empty.status, 200);
    assert.match(empty.text, /Aucun article dans cette rubrique pour le moment/);
    assert.doesNotMatch(empty.text, /Actualité numéro/);
  });
  test("pagination : « charger plus » (6 par page) montre la page 2 avec les articles suivants, sans doublon avec la page 1", async () => {
    await adopt(A, "charger-plus.pleine");
    // articles réellement affichés par la boucle (un titre par enveloppe « kw-loop-item »), sans compter les autres endroits de la page
    const titles = (html) => (html.match(/kw-loop-item"[\s\S]*?(Actualité numéro \d|Guide unique de A)/g) || []).map((m) => m.match(/Actualité numéro \d|Guide unique de A/)[0]);
    const p1 = await hostReq(srv, "a.test", "/blog"); assert.equal(p1.status, 200);
    const shown1 = titles(p1.text);
    assert.equal(shown1.length, 6, "6 articles sur la première page"); assert.equal(new Set(shown1).size, 6);
    const more = p1.text.match(/href="([^"]*lp-[a-z0-9]+=2[^"]*)"/i); assert.ok(more, "lien vers la page 2");
    const p2 = await hostReq(srv, "a.test", `/blog${more[1].replace(/&amp;/g, "&")}`); assert.equal(p2.status, 200);
    const shown2 = titles(p2.text);
    assert.equal(shown2.length, 3, "les 3 articles restants sur la page 2");
    assert.equal(shown2.filter((t) => shown1.includes(t)).length, 0, "aucun doublon entre les pages");
    assert.equal(new Set([...shown1, ...shown2]).size, 9, "les 9 articles du site A sont atteints, aucun de B");
  });
  test("remplacement : un autre modèle remplace le précédent sans reste de l'ancien, et le site B garde son rendu", async () => {
    await adopt(A, "compacte.pleine");
    const r = await hostReq(srv, "a.test", "/blog"); assert.equal(r.status, 200);
    assert.match(r.text, /Actualité numéro 1/);
    assert.doesNotMatch(r.text, /lp-[a-z0-9]+=2[^"]*more|data-loop-more/, "plus de bouton « charger plus » de l'ancien modèle");
    const b = await hostReq(srv, "b.test", "/blog"); assert.equal(b.status, 200);
    assert.doesNotMatch(b.text, /kw-theme-template/, "le site B n'a pas ce modèle");
    assert.match(b.text, /Article réservé au site B/);
  });
});
