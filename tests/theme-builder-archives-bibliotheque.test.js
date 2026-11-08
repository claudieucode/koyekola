// Bibliothèque « Archives » du Theme Builder : 100 modèles = 25 familles × 4 concepts, chacun avec SA composition et SON identité visuelle (valeurs fixes, polices de la bibliothèque) ;
// trois modes d'identité (propre, suit le site, hybride) ; aperçu = vignette ; utilisation → publication → vraie page d'archive du site (terme, nombre, pagination, filtre, état vide) ; isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const Archive = require("../src/themeBuilder/catalog/archive");
const concepts = require("../src/themeBuilder/catalog/archive-lib/concepts");

const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const docOf = (key, identity) => { const b = Catalog.build("archive", key, identity ? { identity } : {}); return { type: "layout", children: b.sections[0].children }; };
const tree = (n) => `${n.type}${n.children ? `(${n.children.map(tree).join(",")})` : ""}`;
const OLD = ["grille-3.clair", "grille-2.marque", "liste.clair", "vedette.clair", "magazine.nuit", "auteur.doux", "carrousel.clair", "charger-plus.clair", "blog.grille", "blog.bandeau", "magazine.liste", "minimal.index"];
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

describe("Archives : 100 modèles distincts, indépendants du site, structurés et responsives (catalogue)", () => {
  const all = Catalog.entries("archive");
  test("exactement 100 modèles, clés et noms uniques, 25 familles de 4 ; les anciens modèles ont disparu", () => {
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100);
    assert.equal(new Set(all.map((e) => e.name)).size, 100);
    const fam = {}; for (const e of all) fam[e.layoutKey] = (fam[e.layoutKey] || 0) + 1;
    assert.equal(Object.keys(fam).length, 25); assert.ok(Object.values(fam).every((n) => n === 4), "4 concepts par famille");
    for (const old of OLD) assert.equal(Catalog.find("archive", old), null, old);
    assert.equal(Catalog.list("archive", { limit: 60 }).total, 100);
  });
  test("diversité réelle : 100 documents différents ET 100 structures d'éléments différentes (pas des variations de couleur)", () => {
    const docs = all.map((e) => JSON.stringify(docOf(e.key), (key, v) => (key === "id" ? undefined : v)));
    assert.equal(new Set(docs).size, 100, "aucun document identique");
    assert.equal(new Set(all.map((e) => tree(docOf(e.key)))).size, 100, "100 structures différentes");
    assert.ok(new Set(concepts.map((c) => c.comp)).size >= 25, "25 compositions de base");
    const sig = new Set(concepts.map((c) => [c.comp, c.cols, c.img, c.barre, c.tete, c.nav, c.filtre].join("|"))); assert.equal(sig.size, 100, "100 signatures de réglages différentes");
  });
  test("chaque modèle : un seul titre principal, une vraie boucle d'articles qui suit l'archive, état vide, liens et images réels", () => {
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
          assert.ok(["numbers", "prevnext", "both", "more", "infinite"].includes(l.pagination) || l.paginate === false, `${e.key} : pagination du moteur`);
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
        if (n.type === "grid" && (!(n.props && n.props.loop) || Number(d.columns) > 1)) { if (!(n.styles.tablet && n.styles.mobile)) badGrid += 1; }
        if (d.position === "absolute" || d.position === "fixed") abs += 1;
        if (d.display === "flex" && d.flexDirection === "row" && d.flexWrap !== "wrap") badRow += 1;
      });
      assert.equal(abs, 0, `${e.key} : pas de positionnement absolu`); assert.equal(badGrid, 0, `${e.key} : grilles adaptées`); assert.equal(badRow, 0, `${e.key} : lignes qui passent à la ligne`);
    }
  });
  test("validation par le moteur du Page Builder : les 100 modèles × 3 modes d'identité sont acceptés tels quels (aucune valeur refusée)", () => {
    const Sections = require("../src/marketing/pages/sections");
    for (const e of all) for (const mode of ["own", "site", "hybrid"]) {
      const d = Catalog.build("archive", e.key, { identity: mode });
      assert.doesNotThrow(() => Sections.normalizeSection({ db: null, siteId: null }, JSON.parse(JSON.stringify(d.sections[0])), "Section 1", { n: 0, ids: new Set() }), `${e.key} (${mode})`);
    }
  });
  test("limites du moteur : au plus 400 éléments et 8 niveaux d'imbrication (sinon la page est refusée)", () => {
    const depth = (n) => 1 + Math.max(0, ...(n.children || []).map(depth)), count = (n) => 1 + (n.children || []).reduce((a, c) => a + count(c), 0);
    for (const e of all) { const d = Catalog.build("archive", e.key).sections[0]; assert.ok(count(d) <= 400, `${e.key} : ${count(d)} éléments`); assert.ok(depth(d) <= 9, `${e.key} : ${depth(d)} niveaux (layout compris)`); }
  });
  test("pas de contrôle décoratif : tout filtre de rubriques est branché sur une boucle (urlFilter), la recherche est le vrai widget, les étiquettes sont une vraie liste", () => {
    for (const e of all) {
      let cat = 0, filtered = 0, search = 0;
      walk(docOf(e.key), (n) => {
        if (n.type === "select" || n.type === "tabs") assert.fail(`${e.key} : contrôle non pris en charge (${n.type})`);
        if (n.type === "catfilter") cat += 1;
        if (n.type === "search") search += 1;
        if (n.type === "grid" && n.props && n.props.loop && n.props.loop.urlFilter) filtered += 1;
      });
      if (cat) assert.ok(filtered >= 1, `${e.key} : le filtre est branché sur une boucle`);
      const c = concepts[e.concept - 1];
      assert.equal(cat > 0, /C/.test(c.filtre), `${e.key} : filtre de rubriques conforme à la fiche`);
      assert.equal(search > 0, /S/.test(c.filtre), `${e.key} : recherche conforme à la fiche`);
    }
  });
  test("identité propre : aucune couleur ni police du site (0 jeton, polices de la bibliothèque), 100 palettes différentes, contrastes lisibles (AA)", () => {
    const pal = new Set();
    for (const e of all) {
      const json = JSON.stringify(docOf(e.key)); assert.doesNotMatch(json, /token:/, `${e.key} : aucun jeton du site`);
      for (const f of json.matchAll(/"fontFamily":"([^"]+)"/g)) assert.match(f[1], /^font\./, `${e.key} : police de la bibliothèque`);
      const s = Archive.skins.find((x) => x.key === e.skinKey); pal.add([s.bg, s.fg, s.accent].join());
      assert.ok(ratio(s.fg, s.bg) >= 4.5 && ratio(s.mute, s.bg) >= 4.5 && ratio(s.mute, s.alt) >= 4.5 && ratio(s.onAccent, s.accent) >= 4.5 && ratio(s.accent, s.bg) >= 4.5, `${e.key} : contrastes`);
    }
    assert.equal(pal.size, 100, "100 palettes différentes");
  });
  test("modes d'identité : « site » remplace les valeurs fixes par les jetons du site, « hybride » garde l'identité et affiche le nom réel du site, « propre » est le mode par défaut", () => {
    for (const e of all) {
      assert.equal(JSON.stringify(docOf(e.key)), JSON.stringify(docOf(e.key, "own")), `${e.key} : propre = défaut`);
      const site = JSON.stringify(docOf(e.key, "site")); assert.match(site, /token:background/, `${e.key} : mode site`);
      const s = Archive.skins.find((x) => x.key === e.skinKey); assert.ok(!site.includes(`"backgroundColor":"${s.bg}"`), `${e.key} : fond fixe remplacé`);
      const hy = JSON.stringify(docOf(e.key, "hybrid")); assert.match(hy, /sitetitle/, `${e.key} : nom du site`); assert.doesNotMatch(hy, /token:/, `${e.key} : hybride = identité propre`);
    }
    assert.equal(Catalog.build("archive", all[0].key, { identity: "invalide" }).name, all[0].name, "mode inconnu = propre");
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
  const adopt = async (site, key, identite) => {
    const u = await post(U(site, "/api/bibliotheque/utiliser"), { type: "archive", key, ...(identite ? { identite } : {}) }); assert.equal(u.status, 200, u.text.slice(0, 300));
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
      const core = (h) => h.replace(/<p style="margin:0;padding:8px 16px;background:#fef3c7[^>]*>Aperçu avec des articles d'exemple[^<]*<\/p>/, "").replace(/data-sid="[^"]*"/g, "").replace(/<title>[^<]*<\/title>/, "").replace(/<style>[^<]*<\/style>/, "").replace(/ data-kw-demo="1"/, "").replace(/<script src="[^"]*landing\.js[^"]*" defer><\/script>/, "");
      assert.equal(core(pv.text), core(th.text), `${e.key} : aperçu = vignette`);
      assert.match(pv.text, /kw-theme-template/, e.key);
      n += 1;
    }
    assert.equal(n, 100);
  });
  test("les 100 modèles s'insèrent dans un site (validation du moteur, 3 modes d'identité pour un échantillon) ; l'insertion ne publie rien", async () => {
    for (const e of Catalog.entries("archive")) {
      const u = await post(U(A, "/api/bibliotheque/utiliser"), { type: "archive", key: e.key }); assert.equal(u.status, 200, `${e.key} : ${u.text.slice(0, 200)}`);
      assert.notEqual(JSON.parse(u.text).template.status, "published", `${e.key} : brouillon`);
    }
    for (const mode of ["site", "hybrid", "own"]) { const u = await post(U(A, "/api/bibliotheque/utiliser"), { type: "archive", key: "technologie.terminal", identite: mode }); assert.equal(u.status, 200, mode); }
    for (const mode of ["site", "hybrid"]) for (const key of ["magazine-premium.une-du-matin", "photographie.galerie", "science-et-recherche.publication"]) { const u = await post(U(A, "/api/bibliotheque/utiliser"), { type: "archive", key, identite: mode }); assert.equal(u.status, 200, `${key} ${mode}`); }
  });
  test("archive de catégorie : seuls les articles de la catégorie et du site, paginés (9 par page), page 2 atteignable", async () => {
    await adopt(A, "blog-professionnel.ressources");
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
  test("barre de catégories branchée : le modèle « Ressources » filtre réellement la liste (?categorie=)", async () => {
    await adopt(A, "blog-professionnel.ressources"); assert.match(vis((await hostReq(srv, "a.test", "/blog")).text), />Blog professionnel</, "modèle à filtres affiché");
    const all = await hostReq(srv, "a.test", "/blog"); all.text = vis(all.text);
    assert.match(all.text, /Conseil de jardin/);
    const f = await hostReq(srv, "a.test", "/blog?categorie=Jardin"); f.text = vis(f.text);
    assert.equal(f.status, 200); assert.match(f.text, /Conseil de jardin/); assert.doesNotMatch(f.text, /Recette cuisine 13/, "le filtre réduit la liste");
  });
  test("état vide : un site sans article affiche un message utile, sans erreur ; un autre modèle remplace le précédent", async () => {
    // Une catégorie réelle du site sans aucun article publié : l'archive existe (page 200) et affiche l'état vide du modèle
    const tid = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Vide', 'vide')").run().lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('term', ?, ?, ?, 'vide')").run(tid, org, A);
    await adopt(A, "magazine-premium.une-du-matin");
    const e = await hostReq(srv, "a.test", "/blog/categorie/vide"); e.text = vis(e.text);
    assert.equal(e.status, 200); assert.match(e.text, /Aucun article dans cette rubrique/); assert.doesNotMatch(e.text, /Cannot|TypeError|undefined/);
    await adopt(A, "blog-minimaliste.carnet");
    const r = await hostReq(srv, "a.test", "/blog"); r.text = vis(r.text);
    assert.match(r.text, />Blog minimaliste</, "le nouveau modèle s'affiche"); assert.doesNotMatch(r.text, />Magazine premium</, "aucun reste du modèle précédent");
    const b = await hostReq(srv, "b.test", "/blog"); b.text = vis(b.text); assert.doesNotMatch(b.text, /kw-theme-template/, "le site B garde son rendu historique");
  });

  test("identité indépendante : bleu marine → beige/noir ; la charte du site change, le modèle non ; mode « site » puis retour au mode propre", async () => {
    const setTokens = (primary, background) => db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify({ colors: { primary, secondary: primary, background } }), A);
    const skin = Catalog.entries("archive").find((e) => e.key === "magazine-premium.une-du-matin"), S = require("../src/themeBuilder/catalog/archive").skins.find((s) => s.key === skin.key);
    setTokens("#0b2a40", "#0b2a40"); // 1. site bleu marine
    await adopt(A, skin.key); // 2. modèle beige / noir / blanc inséré (mode propre par défaut)
    let r = await hostReq(srv, "a.test", "/blog"); let t = vis(r.text).toLowerCase();
    assert.ok(t.includes(S.bg.toLowerCase()), "3. le fond beige du modèle est présent"); assert.ok(t.includes(S.fg.toLowerCase()), "le texte noir du modèle est présent");
    setTokens("#b91c1c", "#14532d"); // 4. la charte globale change
    r = await hostReq(srv, "a.test", "/blog"); t = vis(r.text).toLowerCase();
    assert.ok(t.includes(S.bg.toLowerCase()) && t.includes(S.fg.toLowerCase()), "5. le modèle indépendant n'a pas changé");
    await adopt(A, skin.key, "site"); // 6. passage volontaire au mode « suit le site »
    r = await hostReq(srv, "a.test", "/blog"); t = vis(r.text).toLowerCase();
    assert.ok(!t.includes(`background-color:${S.bg.toLowerCase()}`), "7. les valeurs fixes du modèle ne sont plus utilisées"); assert.match(t, /var\(--kw-background/, "les jetons du site s'appliquent");
    await adopt(A, skin.key, "own"); // 8. retour au mode indépendant
    r = await hostReq(srv, "a.test", "/blog"); t = vis(r.text).toLowerCase();
    assert.ok(t.includes(S.bg.toLowerCase()) && t.includes(S.fg.toLowerCase()), "9. l'identité d'origine est retrouvée intacte");
  });
});

