// KOLAKISA SEO CORE — lot 3 : audit réel du site (exploration des pages publiques + règles), notes, corrections.
// Site de test volontairement truffé de problèmes connus ; chaque problème doit être détecté sur la bonne page.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

describe("SEO CORE : audit du site", () => {
  let srv, prof, external, auditId;
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const run = (sql, ...a) => { const db = srv.db(); db.prepare(sql).run(...a); db.close(); };
  const issues = (rule) => q("SELECT path, detail, id, data FROM seo_issues WHERE audit_id = ? AND rule_id = ?", auditId, rule);
  const long = (seed) => Array.from({ length: 160 }, (_, i) => `${seed} phrase numéro ${i} sur les tableaux croisés dynamiques et les formules avancées`).join(". ");
  before(async () => {
    // Faux site externe : une page existante, une page disparue
    external = http.createServer((req, res) => { res.writeHead(req.url === "/disparue" ? 404 : 200, { "content-type": "text/html" }); res.end("ok"); });
    await new Promise((r) => external.listen(0, "127.0.0.1", r));
    const ext = `http://127.0.0.1:${external.address().port}`;
    srv = await startServer({ KOLA_TEST_ALLOW_LOOPBACK: "1" });
    prof = await loginInstructor(srv);
    await createCourse(prof, srv, { title: "Excel avancé", price: 49 });
    const post = (slug, title, content, extra = "") => run(`INSERT INTO posts (slug, title, excerpt, content, content_format, published, published_at, status, category, focus_keyword${extra ? `, ${extra.split("=")[0]}` : ""}) VALUES (?, ?, 'Un extrait suffisamment long pour servir de description à cet article de test.', ?, 'html', 1, datetime('now'), 'published', 'Bureautique', ?${extra ? `, ${extra.split("=")[1]}` : ""})`, slug, title, content, slug.startsWith("jumeau") ? "excel avancé" : "");
    post("liens", "Article avec des liens", `<p>Voir <a href="/ancienne-adresse">l'ancienne page</a>, <a href="/page-qui-n-existe-pas">une page disparue</a>, <a href="${ext}/disparue">une source supprimée</a> et <a href="${ext}/ok">une source valide</a>.</p><figure class="kb-image"><img src="/uploads/thumbnails/absente.png"></figure>`);
    post("jumeau-a", "Maîtriser Excel avancé pas à pas", `<p>${long("Texte commun")}</p>`);
    post("jumeau-b", "Maîtriser Excel avancé pas à pas facilement", `<p>${long("Texte commun")}</p>`);
    post("court", "Article court", "<p>Trois mots seulement.</p><h3>Sous-partie sans H2</h3>");
    post("cache", "Article noindex", "<p>Caché.</p>", "robots_index=0");
    await prof.post("/formateur/seo/redirections", { source: "/ancienne-adresse", target: "/blog/court", status: "301" });
    await prof.post("/formateur/seo/redirections", { source: "/etape-1", target: "/ancienne-adresse", status: "301" });
    await prof.post("/formateur/seo/reglages", { robots_custom: "User-agent: *\nDisallow: /blog/court" });
    const visitor = new Client(srv.base);
    await visitor.request("/introuvable-visitee", { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0)" } });
  });
  after(async () => { await srv.stop(); external.close(); });

  test("scan complet : pages réellement lues, notes enregistrées, historique", async () => {
    const r = await prof.post("/formateur/seo/audit", { kind: "full" });
    assert.equal(r.status, 302);
    const a = q("SELECT * FROM seo_audits ORDER BY id DESC LIMIT 1")[0];
    auditId = a.id;
    assert.equal(a.status, "done", a.error || "");
    assert.ok(a.pages >= 10, `${a.pages} pages`);
    const scores = JSON.parse(a.scores);
    for (const k of ["indexability", "metadata", "content", "links", "images", "schema", "technical"]) assert.ok(scores[k] && scores[k].score >= 0 && scores[k].score <= 100, k);
    const page = (await prof.get(`/formateur/seo/audit?id=${a.id}`)).text;
    assert.match(page, /Note globale interne/);
    assert.match((await prof.get("/formateur/seo")).text, /Dernier audit/);
  });

  test("liens : interne cassé, vers une redirection, externe cassé (vérifié réellement), externe valide ignoré", () => {
    assert.match(issues("broken_internal_link").find((i) => i.path === "/blog/liens").detail, /\/page-qui-n-existe-pas \(404\)/);
    assert.match(issues("link_to_redirect").find((i) => i.path === "/blog/liens").detail, /\/ancienne-adresse → \/blog\/court/);
    const ext = issues("broken_external_link").filter((i) => i.path === "/blog/liens");
    assert.equal(ext.length, 1);
    assert.match(ext[0].detail, /\/disparue \(404\)/);
  });

  test("images : alt absent, fichier introuvable", () => {
    assert.ok(issues("image_alt_missing").some((i) => i.path === "/blog/liens"));
    assert.match(issues("image_broken").find((i) => i.path === "/blog/liens").detail, /absente\.png/);
  });

  test("contenu : faible, niveau sauté, très similaire, cannibalisation (présentés comme analyses)", () => {
    assert.ok(issues("thin_content").some((i) => i.path === "/blog/court"));
    assert.ok(issues("heading_skip").some((i) => i.path === "/blog/court"));
    assert.match(issues("near_duplicate").find((i) => i.path === "/blog/jumeau-a").detail, /passages communs avec \/blog\/jumeau-b/);
    assert.match(issues("cannibalization").find((i) => i.path === "/blog/jumeau-a").detail, /Même mot-clé principal « excel avancé »/);
    assert.equal(issues("near_duplicate").some((i) => i.path === "/blog/liens"), false, "pas de faux positif");
  });

  test("indexabilité : page du plan du site interdite par robots.txt ; page noindex absente du plan du site", () => {
    assert.ok(issues("robots_blocks_sitemap").some((i) => i.path === "/blog/court"));
    assert.equal(issues("noindex_in_sitemap").length, 0);
  });

  test("technique : chaîne de redirections, adresse introuvable visitée par une personne", () => {
    assert.match(issues("redirect_chain")[0].detail, /\/etape-1 → \/ancienne-adresse → \/blog\/court/);
    assert.ok(issues("not_found_hits").some((i) => i.path === "/introuvable-visitee"));
  });

  test("aucune page orpheline parmi les articles listés sur le blog ; pas de faux problèmes sur l'accueil", () => {
    assert.equal(issues("orphan_page").filter((i) => i.path.startsWith("/blog/jumeau")).length, 0);
    assert.equal(issues("title_missing").length, 0);
    assert.equal(issues("schema_invalid").length, 0);
    assert.equal(issues("viewport_missing").length, 0);
  });

  test("corrections automatiques réelles : liens vers une redirection remplacés dans l'article, chaîne raccourcie", async () => {
    const linkIssue = issues("link_to_redirect").find((i) => i.path === "/blog/liens");
    await prof.post(`/formateur/seo/audit/corriger/${linkIssue.id}`, {});
    const content = q("SELECT content FROM posts WHERE slug = 'liens'")[0].content;
    assert.match(content, /href="\/blog\/court"/);
    assert.doesNotMatch(content, /href="\/ancienne-adresse"/);
    assert.ok(q("SELECT fixed_at FROM seo_issues WHERE id = ?", linkIssue.id)[0].fixed_at);
    assert.equal(q("SELECT COUNT(*) n FROM seo_changes WHERE source = 'autofix'")[0].n, 1);
    const chain = issues("redirect_chain")[0];
    await prof.post(`/formateur/seo/audit/corriger/${chain.id}`, {});
    assert.equal(q("SELECT target FROM seo_redirects WHERE source_path = '/etape-1'")[0].target, "/blog/court");
    // une correction déjà faite n'est pas refaite
    const again = await prof.post(`/formateur/seo/audit/corriger/${chain.id}`, {});
    assert.match(decodeURIComponent(again.location), /Déjà corrigé/);
  });

  test("analyse d'une seule page et page des règles", async () => {
    const html = (await prof.get("/formateur/seo/analyse?path=%2Fblog%2Fliens")).text;
    assert.match(html, /Lien interne cassé/);
    assert.match(html, /Image introuvable/);
    assert.match((await prof.get("/formateur/seo/regles")).text, /broken_internal_link/);
  });

  test("scan ciblé (images) : seules les règles de la catégorie ; accès refusé aux élèves", async () => {
    await prof.post("/formateur/seo/audit", { kind: "images" });
    const a = q("SELECT * FROM seo_audits ORDER BY id DESC LIMIT 1")[0];
    assert.equal(a.kind, "images");
    assert.deepEqual([...new Set(q("SELECT category FROM seo_issues WHERE audit_id = ?", a.id).map((r) => r.category))], ["images"]);
    const student = await newStudent(srv);
    const denied = await student.post("/formateur/seo/audit", { kind: "full" });
    assert.ok(denied.status === 403 || (denied.status === 302 && !String(denied.location).startsWith("/formateur/seo")), `réponse ${denied.status}`);
    assert.equal(q("SELECT COUNT(*) n FROM seo_audits WHERE triggered_by = (SELECT id FROM users WHERE role = 'etudiant' LIMIT 1)")[0].n, 0);
  });
});
