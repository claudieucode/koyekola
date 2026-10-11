// Palier 2 (suite) — caches et sites : le domaine d'un site ne sert jamais le contenu d'un autre site, même après un changement de domaine,
// d'accueil, d'archivage, de suppression, de permissions, ou en requêtes simultanées. Vrais serveur, vraie base, vrais en-têtes Host.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId, A, B, pageA, pageB, member;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const uid = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const ORIGIN = () => ({ Origin: srv.base });

// Requête avec un en-tête Host choisi (le domaine du site)
function hostGet(host, urlPath) {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path: urlPath, method: "GET", headers: { Host: host } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, headers: resp.headers, text, location: resp.headers.location }));
    });
    r.on("error", reject); r.end();
  });
}
const mkSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-")).lastInsertRowid);
const mkPublished = (site, name, marker) => {
  const sections = JSON.stringify([{ type: "text", id: "s1", title: marker, body: marker }]);
  return Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, sections, published_at) VALUES (?, ?, ?, ?, 'published', ?, ?, datetime('now'))")
    .run(orgId, name, name.toLowerCase().replace(/\W+/g, "-"), marker, site, sections).lastInsertRowid);
};
// Enregistre le domaine par la vraie route (réglages du site, avec révision) : c'est ce chemin qui doit invalider le cache
async function setDomain(siteId, url) {
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  const settings = { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } };
  return boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { settings, revision: cur.revision }, headers: ORIGIN() });
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  A = mkSite("Site Alpha"); B = mkSite("Site Beta");
  pageA = mkPublished(A, "CONTENU-ALPHA-PRIVE", "CONTENU-ALPHA-PRIVE"); pageB = mkPublished(B, "CONTENU-BETA-PRIVE", "CONTENU-BETA-PRIVE");
  db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageA, A);
  db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageB, B);
  member = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, uid(member));
});
after(() => srv.stop());

describe("cache des domaines", () => {
  test("chaque domaine sert uniquement SON site", async () => {
    assert.equal((await setDomain(A, "https://alpha.test")).status, 200);
    assert.equal((await setDomain(B, "https://beta.test")).status, 200);
    const a = await hostGet("alpha.test", "/");
    const b = await hostGet("beta.test", "/");
    assert.equal(a.status, 200); assert.match(a.text, /CONTENU-ALPHA-PRIVE/); assert.doesNotMatch(a.text, /CONTENU-BETA-PRIVE/);
    assert.equal(b.status, 200); assert.match(b.text, /CONTENU-BETA-PRIVE/); assert.doesNotMatch(b.text, /CONTENU-ALPHA-PRIVE/);
  });
  test("une page de B n'est pas servie sur le domaine de A (ni /p/…, ni /adresse)", async () => {
    const slugB = one("SELECT slug FROM mk_landing_pages WHERE id = ?", pageB).slug;
    for (const u of [`/${slugB}`, `/p/${slugB}`]) {
      const r = await hostGet("alpha.test", u);
      assert.notEqual(r.status, 200, u);
      assert.doesNotMatch(r.text, /CONTENU-BETA-PRIVE/, u);
    }
  });
  test("un même domaine ne peut pas être attribué à deux sites", async () => {
    const r = await setDomain(B, "https://alpha.test");
    assert.equal(r.status, 422);
    assert.match(r.text, /déjà celle du site/);
    assert.match((await hostGet("beta.test", "/")).text, /CONTENU-BETA-PRIVE/, "B garde son domaine");
  });
  test("changement de domaine : l'ancien domaine ne sert plus rien IMMÉDIATEMENT (pas d'attente du cache)", async () => {
    assert.equal((await setDomain(A, "https://alpha2.test")).status, 200);
    const old = await hostGet("alpha.test", "/");
    assert.doesNotMatch(old.text, /CONTENU-ALPHA-PRIVE/, "l'ancien domaine ne sert plus le site A");
    assert.match((await hostGet("alpha2.test", "/")).text, /CONTENU-ALPHA-PRIVE/);
  });
  test("changement de page d'accueil, archivage, suppression : effet immédiat sur le domaine", async () => {
    const p2 = mkPublished(A, "NOUVEL-ACCUEIL-ALPHA", "NOUVEL-ACCUEIL-ALPHA");
    assert.ok([200, 302].includes((await boss.post(`/marketing/site-web/sites/${A}`, { name: "Site Alpha", slug: "site-alpha", home_page_id: String(p2) })).status));
    assert.match((await hostGet("alpha2.test", "/")).text, /NOUVEL-ACCUEIL-ALPHA/);
    await boss.post(`/marketing/site-web/sites/${A}/archiver`, {});
    const arch = await hostGet("alpha2.test", "/");
    assert.doesNotMatch(arch.text, /NOUVEL-ACCUEIL-ALPHA|CONTENU-ALPHA-PRIVE/, "site archivé : plus servi");
    await boss.post(`/marketing/site-web/sites/${A}/restaurer`, {});
    await boss.post(`/marketing/site-web/sites/${A}/archiver`, {});
    await boss.post(`/marketing/site-web/sites/${A}/supprimer`, { confirmation: "Site Alpha" });
    assert.ok(one("SELECT deleted_at FROM mk_sites WHERE id = ?", A).deleted_at);
    assert.doesNotMatch((await hostGet("alpha2.test", "/")).text, /ALPHA/, "site supprimé : plus servi");
    assert.match((await hostGet("beta.test", "/")).text, /CONTENU-BETA-PRIVE/, "B n'est pas affecté");
    await boss.post(`/marketing/site-web/sites/${A}/recuperer`, {});
    await boss.post(`/marketing/site-web/sites/${A}/restaurer`, {});
  });
  test("les pages publiques ne sont jamais mises en cache partagé (private, no-cache)", async () => {
    const r = await hostGet("beta.test", "/");
    assert.match(String(r.headers["cache-control"]), /no-store|private/, "jamais de cache partagé (CDN, proxy) pour une page de site");
  });
});

describe("cache des redirections propres à un site", () => {
  test("une redirection du site B ne s'applique que sur le domaine de B (pas sur A, pas sur le site principal), après invalidation du cache", async () => {
    db.prepare("INSERT INTO seo_redirects (source_path, target, status, site_id) VALUES ('/promo-beta', '/cible-beta', 301, ?)").run(B);
    await boss.post("/marketing/site-web/outils/cache", { key: "redirects" }); // invalidation réelle du cache des redirections
    const onB = await hostGet("beta.test", "/promo-beta");
    assert.equal(onB.status, 301); assert.equal(onB.location, "/cible-beta");
    for (const host of ["alpha2.test", "k.test"]) {
      const r = await hostGet(host, "/promo-beta");
      assert.notEqual(r.location, "/cible-beta", `${host} ne doit pas appliquer la redirection de B`);
    }
  });
});

describe("permissions et requêtes simultanées", () => {
  test("retirer l'accès d'un membre est immédiat, sans reconnexion", async () => {
    const pA2 = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, 'Page Perm', 'page-perm', 'Page Perm', 'draft', ?)").run(orgId, A).lastInsertRowid);
    assert.equal((await member.get(`/marketing/pages/${pA2}`)).status, 200);
    db.prepare("DELETE FROM mk_site_members WHERE site_id = ? AND user_id = ?").run(A, uid(member));
    assert.equal((await member.get(`/marketing/pages/${pA2}`)).status, 403);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, uid(member));
    assert.equal((await member.get(`/marketing/pages/${pA2}`)).status, 200, "l'accès rendu est immédiat aussi");
  });
  test("40 requêtes simultanées alternant le site A et le site B : aucune réponse croisée", async () => {
    const pA2 = one("SELECT id FROM mk_landing_pages WHERE slug = 'page-perm'").id;
    const pB2 = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, 'Page Beta Perm', 'page-beta-perm', 'Page Beta Perm', 'draft', ?)").run(orgId, B).lastInsertRowid);
    const jobs = Array.from({ length: 40 }, (_, i) => (i % 2 ? member.get(`/marketing/pages/${pB2}`).then((r) => ["B", r.status]) : member.get(`/marketing/pages/${pA2}`).then((r) => ["A", r.status])));
    for (const [which, status] of await Promise.all(jobs)) assert.equal(status, which === "A" ? 200 : 403, `site ${which}`);
  });
});

describe("état actuel hors périmètre du palier 2 (caractérisation, PAS une garantie d'isolation)", () => {
  test("le blog, les formations et le catalogue sont ceux du site principal, y compris sur le domaine d'un site : ils ne sont PAS isolés par site", async () => {
    db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at) VALUES ('article-principal', 'ARTICLE-DU-SITE-PRINCIPAL', 'x', 'html', 'published', 1, datetime('now'))").run();
    const main = await hostGet("k.test", "/blog");
    const onSite = await hostGet("beta.test", "/blog");
    assert.equal(main.status, 200);
    assert.match(main.text, /ARTICLE-DU-SITE-PRINCIPAL/);
    // Documenté tel quel : le palier 3 devra décider de ce que le blog affiche sur le domaine d'un site
    assert.equal(onSite.status, 200);
    assert.match(onSite.text, /ARTICLE-DU-SITE-PRINCIPAL/, "constat : le blog du site principal est visible sur le domaine d'un site");
  });
});
