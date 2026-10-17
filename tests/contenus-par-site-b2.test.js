// R6 (lot 4) — résolution publique B2 PAR DOMAINE : deux sites ont la même adresse logique d'article et de catégorie, chaque domaine sert SON contenu, aucun domaine ne sert celui d'un autre.
// Vrai serveur, base d'essai jetable, vrais domaines simulés (x-forwarded-host). Routes réelles : /blog, /blog/:adresse, archives, flux RSS, plan du site, redirections, recherche, commentaires.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("contenus par site : résolution publique par domaine (B2)", () => {
  let srv, boss, db, orgId, anon, A, B, C, D, ids = {};
  const HA = "www.alpha.example", HB = "beta.example", HD = "delta.example";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const on = (host) => ({ headers: { "x-forwarded-host": host, "User-Agent": "Mozilla/5.0 (test)" } });
  const get = (path, host) => anon.get(path, host ? on(host) : { headers: { "User-Agent": "Mozilla/5.0 (test)" } });
  const settingsUrl = (siteId) => `/marketing/site-web/sites/${siteId}/reglages.json`;
  async function newSite(name, publicUrl) {
    const siteId = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
    if (publicUrl) {
      const cur = JSON.parse((await boss.get(settingsUrl(siteId))).text);
      const r = await boss.request(settingsUrl(siteId), { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl } } } });
      assert.equal(r.status, 200, r.text.slice(0, 200));
    }
    return siteId;
  }
  const post = (slug, { site = null, address = null, published = 1 } = {}) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, published_at, status, robots_index) VALUES (?, ?, '<p>Contenu</p>', 'Résumé', ?, datetime('now'), ?, 1)").run(slug, `Titre ${slug}`, published, published ? "published" : "draft").lastInsertRowid);
    if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address) VALUES ('post', ?, ?, ?, '', ?)").run(id, orgId, site, address);
    return id;
  };
  const term = (slug, { site = null, address = null } = {}) => {
    const id = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', ?, ?)").run(`Cat ${slug}`, slug).lastInsertRowid);
    if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address) VALUES ('term', ?, ?, ?, 'category', ?)").run(id, orgId, site, address);
    return id;
  };
  const rel = (p, t) => db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary) VALUES ('post', ?, ?, 1)").run(p, t);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    A = await newSite("Alpha", `https://${HA}`); B = await newSite("Beta", `https://${HB}`); C = await newSite("Sans domaine"); D = await newSite("Delta", `https://${HD}`);
    ids.m1 = post("bienvenue"); ids.m2 = post("actualite-principale"); // contenus historiques (site principal)
    ids.a1 = post("bienvenue-alpha", { site: A, address: "bienvenue" }); ids.a2 = post("a-seul", { site: A });
    ids.b1 = post("bienvenue-beta", { site: B, address: "bienvenue" }); ids.b2 = post("b-brouillon", { site: B, address: "brouillon-b", published: 0 });
    ids.c1 = post("contenu-c", { site: C }); // site sans domaine : servi comme avant (décision B1/B2 en attente)
    ids.tm = term("principale"); ids.ta = term("cat-a", { site: A, address: "actus" }); ids.tb = term("cat-b", { site: B, address: "actus" });
    rel(ids.m1, ids.tm); rel(ids.a1, ids.ta); rel(ids.b1, ids.tb);
    db.prepare("INSERT INTO post_slug_history (old_slug, post_id) VALUES ('ancien-alpha', ?)").run(ids.a1);
    // Redirections créées par la vraie route (elle vide le cache des redirections du serveur)
    const mk = (source, target, site) => boss.post("/marketing/site-web/redirections", { source, target, status: "301", ...(site ? { site_id: String(site) } : {}) });
    assert.equal((await mk("/blog/vieux", "/blog/bienvenue")).status, 302);
    assert.equal((await mk("/blog/promo", "/blog/a-seul", A)).status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE source_path IN ('/blog/vieux', '/blog/promo')").n, 2, "redirections enregistrées");
  });
  after(() => { db.close(); return srv.stop(); });

  describe("même adresse logique, bon contenu selon le domaine", () => {
    test("« /blog/bienvenue » : l'article d'Alpha sur Alpha, celui de Beta sur Beta, l'article HISTORIQUE sur le domaine principal", async () => {
      const a = await get("/blog/bienvenue", HA), b = await get("/blog/bienvenue", HB), m = await get("/blog/bienvenue");
      assert.equal(a.status, 200); assert.equal(b.status, 200); assert.equal(m.status, 200);
      assert.ok(a.text.includes("Titre bienvenue-alpha") && !a.text.includes("Titre bienvenue-beta"));
      assert.ok(b.text.includes("Titre bienvenue-beta") && !b.text.includes("Titre bienvenue-alpha"));
      assert.ok(m.text.includes("Titre bienvenue") && !m.text.includes("bienvenue-alpha") && !m.text.includes("bienvenue-beta"), "le domaine principal garde son article");
      assert.match(a.text, /<link rel="canonical" href="https:\/\/www\.alpha\.example\/blog\/bienvenue"/, "adresse canonique du site");
    });
    test("adresse actuelle (slug) d'un article de site : sur son domaine → 301 vers l'adresse logique ; sans adresse logique → servi tel quel ; ancienne adresse → 301", async () => {
      const r = await get("/blog/bienvenue-alpha", HA);
      assert.equal(r.status, 301); assert.equal(r.headers.get("location"), "/blog/bienvenue");
      assert.equal((await get("/blog/a-seul", HA)).status, 200, "pas d'adresse logique : l'adresse actuelle sert");
      const old = await get("/blog/ancien-alpha", HA);
      assert.equal(old.status, 301); assert.equal(old.headers.get("location"), "/blog/bienvenue");
    });
    test("l'URL du domaine principal d'un article rattaché à un site AVEC domaine redirige (301) vers SON domaine ; l'ancienne adresse aussi ; un site SANS domaine reste servi comme avant", async () => {
      const r = await get("/blog/bienvenue-alpha");
      assert.equal(r.status, 301); assert.equal(r.headers.get("location"), `https://${HA}/blog/bienvenue`);
      const old = await get("/blog/ancien-alpha");
      assert.equal(old.status, 301); assert.equal(old.headers.get("location"), `https://${HA}/blog/bienvenue`);
      assert.equal((await get("/blog/contenu-c")).status, 200, "site sans domaine : adresse publique existante conservée");
    });
  });

  describe("aucune fuite entre domaines", () => {
    test("un article d'un autre site (adresse actuelle OU logique), du principal ou d'un site sans domaine est introuvable (404) sur un domaine de site ; un brouillon n'est ni servi ni révélé", async () => {
      for (const [path, host] of [["/blog/bienvenue-beta", HA], ["/blog/bienvenue-alpha", HB], ["/blog/a-seul", HB], ["/blog/actualite-principale", HA], ["/blog/contenu-c", HA], ["/blog/brouillon-b", HA], ["/blog/b-brouillon", HB], ["/blog/b-brouillon", null], ["/blog/brouillon-b", null], ["/blog/ancien-alpha", HB]]) {
        const r = await get(path, host);
        assert.equal(r.status, 404, `${host || "principal"} ${path} → ${r.status} ${r.headers.get("location") || ""}`);
      }
    });
    test("liste du blog : chaque domaine ne montre que ses articles ; le principal ne montre ni les articles des sites à domaine ni… ceux-ci seulement sur leur domaine", async () => {
      const a = (await get("/blog", HA)).text, b = (await get("/blog", HB)).text, m = (await get("/blog")).text;
      assert.ok(a.includes("Titre bienvenue-alpha") && a.includes("Titre a-seul"));
      assert.ok(!["bienvenue-beta", "actualite-principale", "contenu-c"].some((s) => a.includes(`Titre ${s}`)), "Alpha : rien d'un autre site");
      assert.ok(b.includes("Titre bienvenue-beta") && !["bienvenue-alpha", "a-seul", "actualite-principale"].some((s) => b.includes(`Titre ${s}`)));
      assert.ok(m.includes("Titre bienvenue") && m.includes("Titre actualite-principale") && m.includes("Titre contenu-c"), "principal : historiques + site sans domaine");
      assert.ok(!["bienvenue-alpha", "a-seul", "bienvenue-beta"].some((s) => m.includes(`Titre ${s}`)), "principal : aucun article d'un site à domaine");
      assert.ok(!b.includes("b-brouillon") && !m.includes("b-brouillon"));
    });
    test("recherche et auteur : le paramètre ?q= et l'auteur restent dans le domaine ; la page /recherche (principal seulement) exclut les sites à domaine", async () => {
      const q = (await get("/blog?q=bienvenue", HA)).text;
      assert.ok(q.includes("Titre bienvenue-alpha") && !q.includes("bienvenue-beta"));
      const g = (await get("/recherche?q=bienvenue")).text;
      assert.ok(g.includes("bienvenue") && !g.includes("bienvenue-alpha") && !g.includes("bienvenue-beta"));
      assert.equal((await get("/recherche?q=bienvenue", HA)).status, 404);
    });
    test("domaine sans article ou domaine inconnu : le blog reste introuvable (404) ou refusé (421), jamais celui d'un autre", async () => {
      assert.equal((await get("/blog", HD)).status, 404);
      assert.equal((await get("/blog/feed.xml", HD)).status, 404);
      assert.equal((await get("/blog", "inconnu.example")).status, 421);
    });
  });

  describe("archives, flux, plan du site, redirections", () => {
    test("catégories : même adresse logique « actus » sur deux domaines ; une catégorie de site n'existe pas sur le principal ni chez l'autre ; la catégorie historique reste au principal seulement", async () => {
      const a = await get("/blog/categorie/actus", HA), b = await get("/blog/categorie/actus", HB);
      assert.equal(a.status, 200); assert.equal(b.status, 200);
      assert.ok(a.text.includes("Titre bienvenue-alpha") && !a.text.includes("bienvenue-beta"));
      assert.ok(b.text.includes("Titre bienvenue-beta") && !b.text.includes("bienvenue-alpha"));
      for (const [path, host] of [["/blog/categorie/actus", null], ["/blog/categorie/cat-a", null], ["/blog/categorie/cat-b", HA], ["/blog/categorie/principale", HA]]) assert.equal((await get(path, host)).status, 404, `${host || "principal"} ${path}`);
      assert.equal((await get("/blog/categorie/cat-a", HA)).status, 200, "adresse actuelle du terme : acceptée sur son domaine");
      const m = await get("/blog/categorie/principale");
      assert.equal(m.status, 200); assert.ok(m.text.includes("Titre bienvenue") && !m.text.includes("bienvenue-alpha"));
    });
    test("flux RSS : un flux par domaine, adresses du domaine, aucun article d'un autre ; le principal n'a ni les articles d'Alpha ni ceux de Beta", async () => {
      const fa = (await get("/blog/feed.xml", HA)).text, fb = (await get("/blog/feed.xml", HB)).text, fm = (await get("/blog/feed.xml")).text;
      assert.ok(fa.includes(`https://${HA}/blog/bienvenue`) && fa.includes("Titre bienvenue-alpha") && !fa.includes("bienvenue-beta") && !fa.includes("actualite-principale"));
      assert.ok(fb.includes(`https://${HB}/blog/bienvenue`) && !fb.includes("bienvenue-alpha"));
      assert.ok(fm.includes("actualite-principale") && fm.includes("contenu-c") && !fm.includes("bienvenue-alpha") && !fm.includes("bienvenue-beta") && !fm.includes("alpha.example") && !fm.includes("beta.example"));
    });
    test("plan du site : chaque domaine liste ses articles sous leurs adresses logiques ; le principal ne liste que ses contenus", async () => {
      const sa = (await get("/sitemap.xml", HA)).text, sb = (await get("/sitemap.xml", HB)).text, sm = (await get("/sitemap.xml")).text;
      assert.ok(sa.includes(`https://${HA}/blog/bienvenue`) && sa.includes(`https://${HA}/blog/a-seul`) && sa.includes(`https://${HA}/blog/categorie/actus`) && !sa.includes("beta.example") && !sa.includes("actualite-principale"));
      assert.ok(sb.includes(`https://${HB}/blog/bienvenue`) && !sb.includes("alpha.example") && !sb.includes("brouillon-b") && !sb.includes("b-brouillon"));
      assert.ok(sm.includes("/blog/bienvenue<") && sm.includes("/blog/actualite-principale") && sm.includes("/blog/contenu-c"));
      assert.ok(!sm.includes("alpha.example") && !sm.includes("beta.example") && !sm.includes("bienvenue-alpha") && !sm.includes("bienvenue-beta") && !sm.includes("categorie/actus") && !sm.includes("cat-a"));
    });
    test("redirections : celle d'un site n'agit que sur SON domaine ; une redirection « pour tous » (sans site, règle existante du palier 12) agit partout, sa cible étant lue dans le contexte du domaine", async () => {
      const own = await get("/blog/promo", HA);
      assert.equal(own.status, 301); assert.match(own.headers.get("location"), /\/blog\/a-seul$/);
      assert.equal((await get("/blog/promo", HB)).status, 404, "la redirection d'Alpha n'agit pas chez Beta");
      assert.equal((await get("/blog/promo")).status, 404, "ni sur le principal");
      for (const host of [null, HA, HB]) {
        const r = await get("/blog/vieux", host);
        assert.equal(r.status, 301, `${host || "principal"} : redirection pour tous`);
        assert.match(r.headers.get("location"), /\/blog\/bienvenue$/);
      }
      // suivre la redirection mène, sur chaque domaine, à l'article DE CE domaine
      assert.ok((await get("/blog/bienvenue", HA)).text.includes("Titre bienvenue-alpha") && (await get("/blog/bienvenue", HB)).text.includes("Titre bienvenue-beta"));
    });
  });

  describe("écritures publiques : aucune écriture inter-sites", () => {
    test("commentaire déposé sur l'article d'un AUTRE domaine : introuvable, rien n'est écrit ; sur son propre domaine : accepté", async () => {
      const post_ = (path, host, body) => anon.request(path, { method: "POST", form: body, ...on(host) });
      const bad = await post_("/blog/bienvenue-beta/commentaires", HA, { body: "Intrus", author_name: "Zed", author_email: "z@e.fr" });
      assert.equal(bad.status, 404);
      // sur son propre domaine, par l'adresse logique : le commentaire est écrit sur le BON article
      const student = await newStudent(srv);
      const own = await student.request("/blog/bienvenue/commentaires", { method: "POST", form: { body: "Mon commentaire Alpha" }, ...on(HA) });
      assert.ok(own.status < 400, `commentaire sur son domaine : ${own.status}`);
      const row = one("SELECT content_id, content_type FROM blog_comments WHERE body = 'Mon commentaire Alpha'");
      assert.deepEqual(row && [row.content_type, row.content_id], ["post", ids.a1], "écrit sur l'article d'Alpha, jamais sur l'article historique « bienvenue »");
      const cross = await post_("/blog/a-seul/commentaires", HB, { body: "Intrus 3", author_name: "Zed", author_email: "z@e.fr" });
      assert.equal(cross.status, 404);
      assert.equal(one("SELECT COUNT(*) n FROM blog_comments WHERE body IN ('Intrus', 'Intrus 3')").n, 0, "aucun commentaire déposé sur un article d'un autre domaine");
    });
  });
});
