// Theme Builder → site public : « Barre latérale » et « Modèle personnalisé ». L'écran les propose, ils DOIVENT donc avoir un effet réel sur le site publié :
// ils s'affichent sous le contenu de la page, avant le pied de page, selon leurs conditions (blog, article, recherche, 404…), avec isolation entre sites,
// brouillon et archivage sans effet. Serveur réel, hôtes réels (Host).
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
const CONTENT = (t) => ({ title: t, sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: t, level: "2" } }] }] });

describe("Theme Builder : barre latérale et modèles personnalisés sur le site public (serveur réel)", () => {
  let srv, boss, db, org, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const get = (host, p) => hostReq(srv, host, p);
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {} });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const setDomain = async (site, url) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() });
  };
  const mkPost = (site, slug, title) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at, category, tags) VALUES (?, ?, '<p>Texte</p>', 1, 'published', datetime('now'), '', '')").run(slug, title).lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, ?)").run(id, org, site, slug);
    return id;
  };
  // Modèle de PAGE (personnalisé) : contenu repérable = le nom ; modèle COMPOSANT (barre latérale) : le contenu est écrit dans le composant
  const model = async (site, type, name, conditions = {}, { publish = true } = {}) => {
    const r = await post(U(site, "/api/modeles"), { type, name, conditions }); assert.equal(r.status, 200, r.text.slice(0, 200));
    const t = JSON.parse(r.text).template;
    if (t.sourceKind === "page") {
      const rev = one("SELECT revision FROM mk_landing_pages WHERE id = ?", t.sourceId).revision;
      assert.equal((await boss.request(`/marketing/pages/${t.sourceId}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content: CONTENT(name) } })).status, 200);
    } else {
      const c = one("SELECT section FROM mk_web_components WHERE id = ?", t.sourceId);
      const section = JSON.parse(c.section); section.children = [{ id: "hed000000002", type: "heading", props: { text: name, level: "3" } }];
      db.prepare("UPDATE mk_web_components SET section = ? WHERE id = ?").run(JSON.stringify(section), t.sourceId);
    }
    if (publish) { const p = await post(U(site, `/api/modeles/${t.id}/publier`)); assert.equal(p.status, 200, p.text.slice(0, 300)); }
    return t;
  };
  const archive = async (site, t) => assert.equal((await post(U(site, `/api/modeles/${t.id}/archiver`))).status, 200);
  const extras = (html) => { const m = html.match(/<aside class="kw-theme-extras"[^>]*>([\s\S]*?)<\/aside>/); return m ? m[1] : ""; };
  const PAGES = ["/", "/blog", "/blog/article-a", "/blog?q=Article", "/introuvable-xyz"];

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

  test("0. sans modèle : aucun bloc complémentaire, rendu historique", async () => {
    for (const p of PAGES) { const r = await get("a.test", p); assert.ok([200, 404].includes(r.status), `${p} → ${r.status}`); assert.doesNotMatch(r.text, /kw-theme-extras/, p); }
  });

  test("1. modèle personnalisé global : affiché sur toutes les pages (blog, article, recherche, 404), sous le contenu et avant le pied de page", async () => {
    await model(A, "custom", "CUSTOM-GLOBAL");
    for (const p of PAGES.filter((x) => x !== "/")) {
      const r = await get("a.test", p); assert.ok([200, 404].includes(r.status), `${p} → ${r.status}`);
      assert.ok(extras(r.text).includes("CUSTOM-GLOBAL"), `${p} : modèle personnalisé absent du bloc complémentaire`);
    }
    // Accueil (page du Page Builder) : le modèle fait partie des sections de la page, après son contenu
    const home = await get("a.test", "/"); assert.equal(home.status, 200);
    assert.ok(home.text.includes("CUSTOM-GLOBAL"), "accueil : modèle personnalisé absent");
    const r = await get("a.test", "/blog/article-a");
    const iAside = r.text.indexOf('class="kw-theme-extras"'), iFooter = r.text.indexOf('class="site-footer"');
    assert.ok(iAside > r.text.indexOf("</main>"), "après le contenu principal");
    assert.ok(iFooter === -1 || iAside < iFooter, "avant le pied de page");
  });

  test("2. plusieurs modèles personnalisés : tous ceux qui correspondent s'affichent, le plus précis d'abord ; exclusion et brouillon respectés", async () => {
    await model(A, "custom", "CUSTOM-ARTICLES", { include: [{ kind: "post" }] });
    await model(A, "custom", "CUSTOM-SANS-404", { exclude: [{ kind: "not_found" }] });
    await model(A, "custom", "CUSTOM-BROUILLON", {}, { publish: false });
    const art = extras((await get("a.test", "/blog/article-a")).text);
    assert.ok(art.includes("CUSTOM-GLOBAL") && art.includes("CUSTOM-ARTICLES") && art.includes("CUSTOM-SANS-404"), "les trois s'appliquent à un article");
    assert.ok(art.indexOf("CUSTOM-ARTICLES") < art.indexOf("CUSTOM-GLOBAL"), "le plus précis (articles) avant le global");
    assert.ok(!art.includes("CUSTOM-BROUILLON"), "un brouillon ne s'affiche jamais");
    const nf = extras((await get("a.test", "/introuvable-xyz")).text);
    assert.ok(nf.includes("CUSTOM-GLOBAL") && !nf.includes("CUSTOM-SANS-404") && !nf.includes("CUSTOM-ARTICLES"), "404 : exclusion respectée, modèle réservé aux articles absent");
    const blog = extras((await get("a.test", "/blog")).text);
    assert.ok(!blog.includes("CUSTOM-ARTICLES"), "liste du blog : modèle réservé aux articles absent");
  });

  test("3. barre latérale : le modèle le plus précis s'affiche ; archivage = disparition immédiate", async () => {
    const g = await model(A, "sidebar", "SIDE-GLOBALE");
    await model(A, "sidebar", "SIDE-ARTICLES", { include: [{ kind: "post" }] });
    const art = extras((await get("a.test", "/blog/article-a")).text);
    assert.ok(art.includes("SIDE-ARTICLES") && !art.includes("SIDE-GLOBALE"), "un seul modèle de barre latérale : le plus précis");
    const blog = extras((await get("a.test", "/blog")).text);
    assert.ok(blog.includes("SIDE-GLOBALE") && !blog.includes("SIDE-ARTICLES"), "liste du blog : la barre latérale globale");
    await archive(A, g);
    const after = extras((await get("a.test", "/blog")).text);
    assert.ok(!after.includes("SIDE-GLOBALE"), "archivée : n'apparaît plus");
  });

  test("4. isolation : rien du site A sur le site B", async () => {
    for (const p of ["/blog", "/blog/article-b", "/introuvable-xyz"]) {
      const r = await get("b.test", p); assert.ok([200, 404].includes(r.status), `${p} → ${r.status}`);
      assert.doesNotMatch(r.text, /CUSTOM-|SIDE-|kw-theme-extras/, `${p} : fuite du site A`);
    }
  });

  test("5. l'écran dit la vérité : l'emplacement d'affichage est annoncé pour ces deux types", async () => {
    const js = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "public", "js", "theme-builder.js"), "utf8");
    assert.match(js, /sidebar: "[^"]*sous le contenu[^"]*avant le pied de page/);
    assert.match(js, /custom: "[^"]*sous le contenu[^"]*avant le pied de page/);
  });
});
