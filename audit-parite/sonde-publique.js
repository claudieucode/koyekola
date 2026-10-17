// Sonde d'audit palier 23 — LECTURE SEULE sur un serveur de test jetable (base temporaire, aucune donnée de production).
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor, Client } = require("../tests/helpers");
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const anon = new Client(srv.base);
  const M = "/marketing";
  // Contenu de départ créé par les vraies routes
  const pg = await boss.post(`${M}/pages`, { name: "Page Audit", template: "vente" });
  const pid = Number(String(pg.location).match(/(\d+)$/)[1]);
  const art = await boss.post(`${M}/site-web/articles`, { title: "Article Audit" });
  console.log("create page", pg.status, pg.location, "| create article", art.status, art.location);
  const pageSlug = db.prepare("SELECT slug,status FROM mk_landing_pages WHERE id=?").get(pid);
  console.log("page", pageSlug);
  const post = db.prepare("SELECT id,slug,published,status FROM posts ORDER BY id DESC LIMIT 1").get();
  console.log("post", post);
  const urls = ["/", "/blog", `/blog/${post.slug}`, `/p/${pageSlug.slug}`, "/sitemap.xml", "/robots.txt", "/blog/feed", "/blog/rss.xml", "/rss.xml", "/feed", "/recherche?q=audit", "/blog?q=audit", "/blog/auteur/x", "/blog/archives", "/introuvable-xyz", "/blog/introuvable", "/wp-login.php", "/api", "/humans.txt", "/favicon.ico", "/.well-known/security.txt"];
  for (const u of urls) {
    const r = await anon.get(u);
    const t = r.text;
    const pick = (re) => (t.match(re) || [, ""])[1].slice(0, 90);
    console.log(String(r.status).padEnd(4), u.padEnd(28), "title=", pick(/<title>([^<]*)/), "| canon=", pick(/rel="canonical" href="([^"]*)"/), "| robots=", pick(/name="robots" content="([^"]*)"/), "| cache=", r.headers.get("cache-control"));
  }
  const home = (await anon.get("/")).text;
  console.log("HOME og:", (home.match(/property="og:[a-z:]+"/g) || []).length, "jsonld:", (home.match(/application\/ld\+json/g) || []).length, "lang:", (home.match(/<html[^>]*lang="([^"]*)"/) || [])[1]);
  const p404 = await anon.get("/introuvable-xyz"); console.log("404 body has noindex:", /noindex/.test(p404.text), "len", p404.text.length);
  console.log("tables:", db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().length);
  db.close(); await srv.stop();
})().catch((e) => { console.error("ERR", e); process.exit(1); });
