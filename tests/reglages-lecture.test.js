// KOLAKISA CMS — Paramètres → Lecture : mode de la page d'accueil (accueil standard / page statique / derniers articles), page des articles, nombre d'articles par page,
// éléments et contenu des flux, visibilité aux moteurs de recherche. Vrai serveur, vraie base d'essai, vraies routes publiques : on vérifie l'EFFET sur le site publié,
// pas seulement l'enregistrement du formulaire. Isolation entre le site principal et un site à domaine propre.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("réglages de lecture : effet réel sur le site publié", () => {
  let srv, boss, db, orgId, anon, S;
  const HS = "lecture.example";
  const RD = "/marketing/site-web/parametres/lecture";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const UA = { "User-Agent": "Mozilla/5.0 (test)" };
  const on = (host) => ({ headers: { "x-forwarded-host": host, ...UA } });
  const pub = (path, host) => anon.get(path, host ? on(host) : { headers: UA });
  const save = (fields, site) => boss.post(`${RD}${site ? `?site=${site}` : ""}`, { ...(site ? { site: String(site) } : {}), confirm: "1", ...fields });
  const flash = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
  const page = (name, slug, site = null) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, draft, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, '[]', '[]', 'published', 'page', ?, '2026-01-01 00:00:00')").run(orgId, name, slug, name, site).lastInsertRowid);
  const post = (n, extra = {}) => Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, excerpt, published, published_at, status, robots_index) VALUES (?, ?, '<p>Texte <strong>complet</strong> de l''article</p>', 'html', ?, ?, datetime('now', ?), ?, 1)").run(`art-${n}`, `Article ${n}`, `Extrait ${n}`, extra.draft ? 0 : 1, `-${n} minutes`, extra.draft ? "draft" : "published").lastInsertRowid);
  const titles = (html) => [...html.matchAll(/Article (\d+)/g)].map((m) => Number(m[1]));
  const items = (xml) => (xml.match(/<item>/g) || []).length;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    for (let i = 1; i <= 14; i++) post(i);
    post(99, { draft: true }); // brouillon : jamais publié ni dans le flux
  });
  after(() => { db.close(); return srv.stop(); });

  describe("écran", () => {
    test("quatre sections réelles, modes, sélecteurs de pages, champs numériques validés, état de visibilité", async () => {
      const r = await boss.get(RD);
      assert.equal(r.status, 200);
      for (const f of ["Page d'accueil", "Articles et archives", "Flux de syndication", "Visibilité pour les moteurs de recherche", 'name="show_on_front"', 'name="homepage_page"', 'name="posts_page"', 'name="posts_per_page"', 'name="feed_items"', 'name="feed_content"', "cms-lecture.js", "Paramètres → Indexation"]) assert.ok(r.text.includes(f), f);
      assert.match(r.text, /name="posts_per_page" min="1" max="50"/); assert.match(r.text, /name="feed_items" min="1" max="50"/);
      assert.match(r.text, /name="show_on_front" value="standard" data-read-mode checked/, "accueil standard par défaut (comportement inchangé)");
    });
  });

  describe("accueil du site principal", () => {
    test("par défaut : l'accueil standard (formations) ; rien n'a changé pour les visiteurs", async () => {
      const r = await pub("/"); assert.equal(r.status, 200); assert.doesNotMatch(r.text, /Article 1\b/);
    });
    test("mode « derniers articles » : « / » affiche les articles publiés (jamais le brouillon), triés par date, paginés selon le réglage", async () => {
      assert.equal((await save({ show_on_front: "posts", posts_per_page: "5", feed_items: "20", feed_content: "excerpt", homepage_page: "", posts_page: "" })).status, 302);
      const r = await pub("/"); assert.equal(r.status, 200);
      const t = titles(r.text);
      assert.ok(t.includes(1) && !t.includes(99), "le plus récent est présent, le brouillon absent");
      assert.match(r.text, /href="\/\?page=2"/, "la pagination reste sur « / »");
      const p3 = await pub("/?page=3"); assert.ok(titles(p3.text).some((n) => n >= 11), "dernière page : les plus anciens");
      assert.match(r.text, /<link rel="canonical" href="[^"]*\/"/);
    });
    test("nombre d'articles par page : appliqué à la liste du blog, à l'accueil et aux archives ; un autre réglage change réellement le résultat", async () => {
      const five = new Set(titles((await pub("/blog")).text).filter((n) => n < 99));
      await save({ show_on_front: "posts", posts_per_page: "2", feed_items: "20", feed_content: "excerpt", homepage_page: "", posts_page: "" });
      const two = new Set(titles((await pub("/blog")).text).filter((n) => n < 99));
      assert.ok(two.size < five.size, `${two.size} < ${five.size}`);
    });
    test("valeurs invalides refusées côté serveur : zéro, négatif, trop grand, texte, tableau — rien n'est enregistré", async () => {
      const before = JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE key LIKE 'cms.%' ORDER BY key").all());
      for (const bad of ["0", "-3", "51", "abc", "1.5", ""]) { const r = await save({ posts_per_page: bad }); assert.equal(r.status, 422, `posts_per_page=${bad}`); assert.match(r.text, /entre 1 et 50/); }
      for (const bad of ["0", "99", "x"]) assert.equal((await save({ feed_items: bad })).status, 422, `feed_items=${bad}`);
      assert.equal((await save({ feed_content: "tout" })).status, 422);
      assert.equal((await save({ show_on_front: "autre" })).status, 422);
      assert.equal(JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE key LIKE 'cms.%' ORDER BY key").all()), before);
    });
    test("mode « page statique » : la page choisie devient « / » ; son ancienne adresse redirige ; sans page choisie, l'enregistrement est refusé", async () => {
      const home = page("Accueil perso", "accueil-perso");
      const refus = await save({ show_on_front: "page", homepage_page: "" }); assert.equal(refus.status, 422); assert.match(refus.text, /choisissez la page statique/);
      assert.equal((await save({ show_on_front: "page", homepage_page: String(home) })).status, 302);
      const r = await pub("/"); assert.equal(r.status, 200); assert.ok(r.text.includes("Accueil perso"));
      assert.equal((await pub("/p/accueil-perso")).status, 301);
    });
    test("changer de mode est réversible : la page choisie reste enregistrée et revient en repassant en mode page", async () => {
      const home = one("SELECT id FROM mk_landing_pages WHERE slug = 'accueil-perso'").id;
      await save({ show_on_front: "posts", homepage_page: String(home) });
      assert.ok(titles((await pub("/")).text).length > 0, "mode articles");
      assert.equal(one("SELECT value FROM mk_settings WHERE key = 'cms.homepage_page'").value, String(home), "la page n'est pas perdue");
      await save({ show_on_front: "page", homepage_page: String(home) });
      assert.ok((await pub("/")).text.includes("Accueil perso"));
    });
    test("page des articles : /blog y renvoie, son adresse affiche la liste (pagination, titre), différente de l'accueil", async () => {
      const home = one("SELECT id FROM mk_landing_pages WHERE slug = 'accueil-perso'").id;
      const pa = page("Nos actualités", "actualites");
      const same = await save({ show_on_front: "page", homepage_page: String(home), posts_page: String(home) });
      assert.equal(same.status, 422); assert.match(same.text, /différente de la page d(&#39;|')accueil/);
      assert.equal((await save({ show_on_front: "page", homepage_page: String(home), posts_page: String(pa), posts_per_page: "3" })).status, 302);
      const b = await pub("/blog"); assert.equal(b.status, 301); assert.equal(b.location, "/p/actualites");
      const l = await pub("/p/actualites"); assert.equal(l.status, 200);
      assert.ok(titles(l.text).length > 0 && l.text.includes("Nos actualités"));
      assert.match(l.text, /href="\/p\/actualites\?page=2"/);
      assert.ok(!titles(l.text).includes(99));
    });
    test("page d'accueil devenue indisponible (dépubliée) : jamais une accueil vide ni une erreur, l'accueil de secours reprend", async () => {
      const home = one("SELECT id FROM mk_landing_pages WHERE slug = 'accueil-perso'").id;
      db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE id = ?").run(home);
      const r = await pub("/"); assert.equal(r.status, 200); assert.ok(!r.text.includes("Accueil perso"));
      const rd = await boss.get(RD); assert.match(rd.text, /n'est plus disponible/);
      db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(home);
    });
    test("page d'un autre site, brouillon ou étape de tunnel : refusées comme page d'accueil", async () => {
      const otherSite = Number(String((await boss.post("/marketing/site-web/sites", { name: "Voisin" })).location).match(/sites\/(\d+)/)[1]);
      const other = page("Autre", "autre-site", otherSite);
      assert.equal((await save({ show_on_front: "page", homepage_page: String(other) })).status, 422);
      const draft = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, draft, status, kind) VALUES (?, 'Brouillon', 'brouillon-x', 'B', '[]', '[]', 'draft', 'page')").run(orgId).lastInsertRowid);
      const r = await save({ show_on_front: "page", homepage_page: String(draft) }); assert.equal(r.status, 422); assert.match(r.text, /pas publiée/);
    });
  });

  describe("flux de syndication", () => {
    test("nombre d'éléments : suit le réglage, uniquement les articles publiés, ordre du plus récent", async () => {
      await save({ show_on_front: "posts", posts_per_page: "10", feed_items: "4", feed_content: "excerpt", homepage_page: "", posts_page: "" });
      const f = await pub("/blog/feed.xml"); assert.equal(f.status, 200);
      assert.match(f.headers.get("content-type"), /application\/rss\+xml/);
      assert.equal(items(f.text), 4); assert.ok(!f.text.includes("Article 99"));
      assert.deepEqual(titles(f.text).slice(0, 4), [1, 2, 3, 4]);
      await save({ feed_items: "9" }); assert.equal(items((await pub("/blog/feed.xml")).text), 9);
    });
    test("extrait : description seule, jamais le texte complet ; texte complet : content:encoded en CDATA ; XML bien formé et caractères échappés", async () => {
      await save({ feed_items: "3", feed_content: "excerpt" });
      const ex = (await pub("/blog/feed.xml")).text;
      assert.ok(ex.includes("<description>Extrait 1</description>")); assert.ok(!ex.includes("content:encoded>")); assert.ok(!ex.includes("complet</strong>"));
      await save({ feed_items: "3", feed_content: "full" });
      const full = (await pub("/blog/feed.xml")).text;
      assert.match(full, /<content:encoded><!\[CDATA\[<p>Texte <strong>complet<\/strong>/);
      assert.match(full, /xmlns:content="http:\/\/purl\.org\/rss\/1\.0\/modules\/content\/"/);
      assert.equal((full.match(/<item>/g) || []).length, (full.match(/<\/item>/g) || []).length);
      assert.equal((full.match(/<!\[CDATA\[/g) || []).length, (full.match(/\]\]>/g) || []).length);
      assert.match((await pub("/blog/feed.xml")).headers.get("cache-control"), /no-cache/, "un changement de réglage est pris en compte tout de suite");
    });
    test("le flux n'est pas confondu avec les archives : changer le nombre par page ne change pas le flux", async () => {
      await save({ posts_per_page: "2", feed_items: "6", feed_content: "excerpt" });
      assert.equal(items((await pub("/blog/feed.xml")).text), 6);
    });
  });

  describe("visibilité pour les moteurs de recherche (un seul réglage, partagé avec Indexation)", () => {
    test("l'écran Lecture reflète l'état d'Indexation, sans stockage dupliqué ; fermé : noindex réel", async () => {
      assert.match((await boss.get(RD)).text, /Visible : indexation autorisée/);
      assert.equal((await boss.post("/marketing/site-web/parametres/indexation", { search_visibility: "closed", confirm: "1" })).status, 302);
      assert.match((await boss.get(RD)).text, /Masqué aux moteurs de recherche/);
      const home = await pub("/blog"); assert.match(home.headers.get("x-robots-tag") || "", /noindex/); assert.match(home.text, /noindex/);
      assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_settings WHERE key LIKE 'cms.%visib%'").get().n, 1, "une seule valeur stockée");
      await boss.post("/marketing/site-web/parametres/indexation", { search_visibility: "open", confirm: "1" });
      assert.doesNotMatch((await pub("/blog")).headers.get("x-robots-tag") || "", /noindex/);
    });
  });

  describe("site à domaine propre : réglages indépendants, isolés du site principal", () => {
    before(async () => {
      S = Number(String((await boss.post("/marketing/site-web/sites", { name: "Lecture" })).location).match(/sites\/(\d+)/)[1]);
      const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${S}/reglages.json`)).text);
      const r = await boss.request(`/marketing/site-web/sites/${S}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HS}` } } } });
      assert.equal(r.status, 200, r.text.slice(0, 200));
      for (let i = 1; i <= 7; i++) { const id = Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, published_at, status, robots_index) VALUES (?, ?, '<p>x</p>', 'ext', 1, datetime('now', ?), 'published', 1)").run(`site-${i}`, `Site ${i}`, `-${i} minutes`).lastInsertRowid); db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address) VALUES ('post', ?, ?, ?, '', NULL)").run(id, orgId, S); }
    });
    test("réglages du site enregistrés dans le site (et pas dans le principal) ; limites et modes propres", async () => {
      assert.equal((await save({ show_on_front: "posts", posts_per_page: "3", feed_items: "2", feed_content: "full" }, S)).status, 302);
      const s = JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", S).settings);
      assert.deepEqual([s.reading.showOnFront, s.reading.postsPerPage, s.reading.feedItems, s.reading.feedContent], ["posts", 3, 2, "full"]);
      assert.equal((await save({ posts_per_page: "0" }, S)).status, 422);
    });
    test("l'accueil du domaine affiche les articles DE CE SITE, avec sa propre pagination et son propre flux ; le principal reste inchangé", async () => {
      const home = await pub("/", HS); assert.equal(home.status, 200);
      assert.match(home.text, /href="\/\?page=2"/, "pagination propre au site, sur « / »"); assert.doesNotMatch(home.text, /href="\/\?page=3"/, "7 articles, 3 par page : 2 pages");
      assert.ok(!/Article \d/.test(home.text), "aucun article du site principal");
      const feed = await pub("/blog/feed.xml", HS); assert.equal(items(feed.text), 2); assert.match(feed.text, /content:encoded/); assert.ok(!feed.text.includes("Article "));
      const main = await pub("/blog/feed.xml"); assert.equal(items(main.text), 6); assert.ok(!main.text.includes("Site 1"));
    });
    test("un administrateur limité à un autre site ne peut pas modifier les réglages de lecture de celui-ci ; un site forgé est refusé", async () => {
      const other = Number(String((await boss.post("/marketing/site-web/sites", { name: "Autre lecture" })).location).match(/sites\/(\d+)/)[1]);
      const c = await newStudent(srv);
      db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(other, one("SELECT id FROM users WHERE email = ?", c.email || "").id || 0);
      const r = await c.post(`${RD}?site=${S}`, { site: String(S), posts_per_page: "50", confirm: "1" });
      assert.ok([302, 403, 404].includes(r.status) && !(r.status === 302 && /parametres\/lecture/.test(r.location || "") && one("SELECT settings FROM mk_sites WHERE id = ?", S).settings.includes('"postsPerPage":50')));
      assert.equal((await boss.post(`${RD}?site=999999`, { site: "999999", posts_per_page: "5", confirm: "1" })).status, 404);
    });
  });
});
