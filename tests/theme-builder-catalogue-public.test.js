// Catalogue de modèles → site public (serveur réel, domaines réels) : un modèle UTILISÉ depuis la bibliothèque, puis publié, habille réellement le site ; l'autre site n'est pas touché ;
// l'API de la bibliothèque (liste paginée, miniature, aperçu, utilisation) respecte les droits ; export puis import d'une copie.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const hostReq = (srv, host, path) => {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, headers: resp.headers }));
    });
    r.on("error", reject); r.end();
  });
};

describe("Bibliothèque de modèles du Theme Builder : de la bibliothèque au site public", () => {
  let srv, boss, db, org, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const setDomain = async (site, url) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() });
  };
  const mkPost = (site, slug, title) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at) VALUES (?, ?, '<p>Texte</p>', 1, 'published', datetime('now'))").run(slug, title).lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, ?)").run(id, org, site, slug);
  };
  // utilise un modèle de la bibliothèque dans le site puis le publie ; renvoie le modèle du site
  const adopt = async (site, type, key) => {
    const u = await post(U(site, "/api/bibliotheque/utiliser"), { type, key }); assert.equal(u.status, 200, u.text.slice(0, 300));
    const t = JSON.parse(u.text).template; assert.equal(t.status, "draft");
    const p = await post(U(site, `/api/modeles/${t.id}/publier`)); assert.equal(p.status, 200, p.text.slice(0, 300));
    return t;
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Site A", "site-a"); B = mkSite("Site B", "site-b");
    const home = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, 'Accueil A', 'accueil-a', 'Accueil A', 'published', ?, datetime('now'), 'page', 1)").run(org, A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, A);
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
    mkPost(A, "article-a", "Article de A"); mkPost(B, "article-b", "Article de B");
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("API : 9 types de 100 modèles, liste paginée sans documents, filtres, miniature et aperçu pour chaque type", async () => {
    const types = JSON.parse((await boss.get(U(A, "/api/bibliotheque"))).text).types;
    assert.equal(types.length, 9); for (const t of types) assert.equal(t.count, 100, t.type);
    const l = JSON.parse((await boss.get(U(A, "/api/bibliotheque?type=header&limite=10&page=3"))).text);
    assert.equal(l.items.length, 10); assert.equal(l.page, 3); assert.equal(l.total, 100); assert.ok(!("section" in l.items[0]));
    const f = JSON.parse((await boss.get(U(A, "/api/bibliotheque?type=header&identite=nuit"))).text); assert.equal(f.total, 20);
    assert.equal((await boss.get(U(A, "/api/bibliotheque?type=custom"))).status, 404, "type sans bibliothèque");
    for (const t of types) {
      const key = JSON.parse((await boss.get(U(A, `/api/bibliotheque?type=${t.type}&limite=1`))).text).items[0].key;
      const th = await boss.get(U(A, `/api/bibliotheque/${t.type}/${key}/miniature`)); assert.equal(th.status, 200); assert.match(th.text, /<svg/);
      const ap = await boss.get(U(A, `/api/bibliotheque/${t.type}/${key}/apercu`)); assert.equal(ap.status, 200, `${t.type} aperçu`); assert.match(ap.text, /<!doctype html>/i); assert.match(ap.text, /kw-theme-(part|template)/);
    }
    assert.equal((await boss.get(U(A, "/api/bibliotheque/header/inconnu.inconnu/apercu"))).status, 404);
  });
  test("droits : sans connexion, ni liste ni utilisation", async () => {
    const anon = await fetch(`${srv.base}${U(A, "/api/bibliotheque?type=header")}`, { redirect: "manual" }); assert.ok([301, 302, 401, 403].includes(anon.status), `${anon.status}`);
    const use = await fetch(`${srv.base}${U(A, "/api/bibliotheque/utiliser")}`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/json", Origin: srv.base }, body: JSON.stringify({ type: "header", key: "classique.clair" }) });
    assert.ok([301, 302, 401, 403].includes(use.status), `${use.status}`);
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_templates").n, 0, "rien n'a été créé");
  });
  test("en-tête et pied de page de la bibliothèque : ils habillent le blog, un article et la 404 du site A, pas le site B", async () => {
    await adopt(A, "header", "classique.clair"); await adopt(A, "footer", "une-ligne.clair");
    for (const p of ["/", "/blog", "/blog/article-a", "/introuvable-xyz"]) {
      const r = await hostReq(srv, "a.test", p); assert.ok([200, 404].includes(r.status), `${p} → ${r.status}`);
      // pages du Page Builder (accueil) : les parties sont dans la page même ; pages de la plateforme : dans leur zone « partie globale »
      if (p === "/") { assert.match(r.text, /kw-sitelogo/, "accueil : en-tête du modèle"); continue; }
      assert.match(r.text, /kw-theme-header/, `${p} : en-tête`); assert.match(r.text, /kw-theme-footer/, `${p} : pied de page`);
      assert.doesNotMatch(r.text, /class="site-header"/, `${p} : ancien en-tête`);
    }
    const b = await hostReq(srv, "b.test", "/blog"); assert.equal(b.status, 200); assert.doesNotMatch(b.text, /kw-theme-(header|footer)/, "isolation");
  });
  test("article, archives, recherche et page introuvable de la bibliothèque : rendus avec les contenus réels du site", async () => {
    await adopt(A, "single_post", "classique.clair"); await adopt(A, "archive", "grille-3.clair"); await adopt(A, "search_results", "vedette.clair"); await adopt(A, "not_found", "simple.centre");
    const post = await hostReq(srv, "a.test", "/blog/article-a"); assert.equal(post.status, 200); assert.match(post.text, /kw-theme-template/); assert.match(post.text, /<h1[^>]*>[^<]*Article de A/);
    const arch = await hostReq(srv, "a.test", "/blog"); assert.match(arch.text, /kw-theme-template/); assert.match(arch.text, /Article de A/); assert.doesNotMatch(arch.text, /Article de B/);
    const q = await hostReq(srv, "a.test", "/blog?q=Article"); assert.match(q.text, /kw-theme-template/); assert.match(q.text, /Article de A/);
    const nf = await hostReq(srv, "a.test", "/introuvable-xyz"); assert.equal(nf.status, 404); assert.match(nf.text, /kw-theme-template/);
    const other = await hostReq(srv, "b.test", "/blog/article-b"); assert.doesNotMatch(other.text, /kw-theme-template/, "le site B garde son rendu");
  });
  test("copie indépendante : modifier ou archiver la copie du site ne change pas la bibliothèque ; export puis import", async () => {
    const t = JSON.parse((await post(U(A, "/api/bibliotheque/utiliser"), { type: "footer", key: "trois-colonnes.nuit" })).text); assert.ok(t.ok, JSON.stringify(t).slice(0, 200));
    const tpl = t.template, ex = await boss.get(U(A, `/api/modeles/${tpl.id}/export.json`)); assert.equal(ex.status, 200);
    const imp = JSON.parse((await post(U(B, "/api/importer"), { payload: JSON.parse(ex.text) })).text); assert.ok(imp.ok, JSON.stringify(imp).slice(0, 200)); assert.equal(imp.template.type, "footer");
    assert.equal((await post(U(A, `/api/modeles/${tpl.id}/archiver`))).status, 200);
    const again = JSON.parse((await boss.get(U(A, "/api/bibliotheque?type=footer&limite=5"))).text); assert.equal(again.total, 100, "le catalogue est intact");
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_templates WHERE site_id = ?", B).n, 1, "l'import n'a touché que le site B");
  });
});
