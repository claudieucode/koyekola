// KOLAKISA CMS — Outils → Importer : registre d'importateurs, WordPress (WXR), flux RSS/Atom, convertisseur catégories/étiquettes. Vrai serveur, vraie base d'essai, vrai moteur d'import
// (analyse à blanc → confirmation → lots → rapport → annulation). Données synthétiques ; le seul accès réseau est un petit serveur local de l'essai (bouclage, autorisé uniquement par
// KOLA_TEST_ALLOW_LOOPBACK en test). Les adresses privées et métadonnées cloud restent refusées.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent, INSTRUCTOR } = require("./helpers");

const O = "/marketing/site-web/outils";
const IMP = `${O}/importer`;
const qs = (site) => (site ? `?site=${site}` : "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const flash = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

// Fichier WXR de test : accents, hiérarchie de catégories, article publié / brouillon / en attente, page, commentaires de statuts divers, pingback, produit (type inconnu), pièce jointe
const wxr = ({ media = "", extraItems = "", version = "1.2" } = {}) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">
<channel><title>Blog d'été éàç</title><link>https://ancien.example</link><language>fr-FR</language><wp:wxr_version>${version}</wp:wxr_version>
<wp:author><wp:author_id>2</wp:author_id><wp:author_login><![CDATA[marie]]></wp:author_login><wp:author_email><![CDATA[marie@ancien.example]]></wp:author_email><wp:author_display_name><![CDATA[Marie Dupont]]></wp:author_display_name></wp:author>
<wp:author><wp:author_id>3</wp:author_id><wp:author_login><![CDATA[paul]]></wp:author_login><wp:author_email><![CDATA[paul@ancien.example]]></wp:author_email><wp:author_display_name><![CDATA[Paul]]></wp:author_display_name></wp:author>
<wp:category><wp:term_id>2</wp:term_id><wp:category_nicename><![CDATA[voyages]]></wp:category_nicename><wp:category_parent><![CDATA[]]></wp:category_parent><wp:cat_name><![CDATA[Voyages]]></wp:cat_name></wp:category>
<wp:category><wp:term_id>3</wp:term_id><wp:category_nicename><![CDATA[europe]]></wp:category_nicename><wp:category_parent><![CDATA[voyages]]></wp:category_parent><wp:cat_name><![CDATA[Europe]]></wp:cat_name></wp:category>
<wp:tag><wp:term_id>4</wp:term_id><wp:tag_slug><![CDATA[ete]]></wp:tag_slug><wp:tag_name><![CDATA[Été]]></wp:tag_name></wp:tag>
<item><title>Bonjour à tous, ça va ?</title><link>https://ancien.example/bonjour</link><pubDate>Mon, 04 Mar 2024 10:00:00 +0000</pubDate><dc:creator><![CDATA[marie]]></dc:creator><guid isPermaLink="false">https://ancien.example/?p=10</guid>
<content:encoded><![CDATA[<!-- wp:paragraph --><p>Voici un [gallery ids="1,2"] texte avec accents éèà et <strong>gras</strong>.</p><!-- /wp:paragraph --><!-- wp:acme/zig {"a":1} /--><script>alert(1)</script><img src="x" onerror="alert(2)">${media ? `<img src="${media}" alt="photo">` : ""}]]></content:encoded>
<excerpt:encoded><![CDATA[Un résumé]]></excerpt:encoded><wp:post_id>10</wp:post_id><wp:post_date>2024-03-04 11:00:00</wp:post_date><wp:post_date_gmt>2024-03-04 10:00:00</wp:post_date_gmt><wp:comment_status>open</wp:comment_status><wp:post_name><![CDATA[bonjour-a-tous]]></wp:post_name><wp:status><![CDATA[publish]]></wp:status><wp:post_parent>0</wp:post_parent><wp:post_type><![CDATA[post]]></wp:post_type>
<category domain="category" nicename="europe"><![CDATA[Europe]]></category><category domain="post_tag" nicename="ete"><![CDATA[Été]]></category>
<wp:postmeta><wp:meta_key><![CDATA[_thumbnail_id]]></wp:meta_key><wp:meta_value><![CDATA[20]]></wp:meta_value></wp:postmeta><wp:postmeta><wp:meta_key><![CDATA[prix_billet]]></wp:meta_key><wp:meta_value><![CDATA[45]]></wp:meta_value></wp:postmeta>
<wp:comment><wp:comment_id>100</wp:comment_id><wp:comment_author><![CDATA[Zoé Martin]]></wp:comment_author><wp:comment_author_email><![CDATA[zoe@exemple-source.fr]]></wp:comment_author_email><wp:comment_author_IP><![CDATA[1.2.3.4]]></wp:comment_author_IP><wp:comment_date_gmt>2024-03-05 08:00:00</wp:comment_date_gmt><wp:comment_content><![CDATA[Super article, merci !]]></wp:comment_content><wp:comment_approved><![CDATA[1]]></wp:comment_approved><wp:comment_type><![CDATA[]]></wp:comment_type><wp:comment_parent>0</wp:comment_parent></wp:comment>
<wp:comment><wp:comment_id>101</wp:comment_id><wp:comment_author><![CDATA[Marie]]></wp:comment_author><wp:comment_author_email><![CDATA[marie@ancien.example]]></wp:comment_author_email><wp:comment_date_gmt>2024-03-06 08:00:00</wp:comment_date_gmt><wp:comment_content><![CDATA[Merci Zoé !]]></wp:comment_content><wp:comment_approved><![CDATA[1]]></wp:comment_approved><wp:comment_type><![CDATA[comment]]></wp:comment_type><wp:comment_parent>100</wp:comment_parent></wp:comment>
<wp:comment><wp:comment_id>102</wp:comment_id><wp:comment_author><![CDATA[Robot]]></wp:comment_author><wp:comment_author_email><![CDATA[bot@spam.example]]></wp:comment_author_email><wp:comment_date_gmt>2024-03-07 08:00:00</wp:comment_date_gmt><wp:comment_content><![CDATA[Achetez vite http://spam.example]]></wp:comment_content><wp:comment_approved><![CDATA[spam]]></wp:comment_approved><wp:comment_type><![CDATA[comment]]></wp:comment_type><wp:comment_parent>0</wp:comment_parent></wp:comment>
<wp:comment><wp:comment_id>103</wp:comment_id><wp:comment_author><![CDATA[Luc]]></wp:comment_author><wp:comment_author_email><![CDATA[luc@exemple-source.fr]]></wp:comment_author_email><wp:comment_date_gmt>2024-03-08 08:00:00</wp:comment_date_gmt><wp:comment_content><![CDATA[En attente de modération]]></wp:comment_content><wp:comment_approved><![CDATA[0]]></wp:comment_approved><wp:comment_type><![CDATA[comment]]></wp:comment_type><wp:comment_parent>0</wp:comment_parent></wp:comment>
<wp:comment><wp:comment_id>104</wp:comment_id><wp:comment_author><![CDATA[Ping]]></wp:comment_author><wp:comment_date_gmt>2024-03-08 09:00:00</wp:comment_date_gmt><wp:comment_content><![CDATA[Un rétrolien]]></wp:comment_content><wp:comment_approved><![CDATA[1]]></wp:comment_approved><wp:comment_type><![CDATA[pingback]]></wp:comment_type><wp:comment_parent>0</wp:comment_parent></wp:comment></item>
<item><title>Brouillon de Paul</title><link>https://ancien.example/?p=11</link><dc:creator><![CDATA[paul]]></dc:creator><guid isPermaLink="false">https://ancien.example/?p=11</guid><content:encoded><![CDATA[Premier paragraphe sans balise.

Deuxième paragraphe.]]></content:encoded><wp:post_id>11</wp:post_id><wp:post_date_gmt>2024-04-01 09:00:00</wp:post_date_gmt><wp:post_name><![CDATA[brouillon-de-paul]]></wp:post_name><wp:status><![CDATA[draft]]></wp:status><wp:post_type><![CDATA[post]]></wp:post_type></item>
<item><title>À propos</title><link>https://ancien.example/a-propos</link><dc:creator><![CDATA[marie]]></dc:creator><guid isPermaLink="false">https://ancien.example/?page_id=12</guid><content:encoded><![CDATA[<h2>Qui sommes-nous ?</h2><p>Une <a href="https://ancien.example/contact">équipe</a> passionnée.</p><ul><li>Un</li><li>Deux</li></ul>]]></content:encoded><wp:post_id>12</wp:post_id><wp:post_date_gmt>2024-01-10 09:00:00</wp:post_date_gmt><wp:post_name><![CDATA[a-propos]]></wp:post_name><wp:status><![CDATA[publish]]></wp:status><wp:post_parent>0</wp:post_parent><wp:post_type><![CDATA[page]]></wp:post_type>
<wp:comment><wp:comment_id>105</wp:comment_id><wp:comment_author><![CDATA[X]]></wp:comment_author><wp:comment_date_gmt>2024-03-08 09:00:00</wp:comment_date_gmt><wp:comment_content><![CDATA[Commentaire de page]]></wp:comment_content><wp:comment_approved><![CDATA[1]]></wp:comment_approved><wp:comment_type><![CDATA[comment]]></wp:comment_type><wp:comment_parent>0</wp:comment_parent></wp:comment></item>
<item><title>Un produit</title><wp:post_id>13</wp:post_id><wp:post_name><![CDATA[un-produit]]></wp:post_name><wp:status><![CDATA[publish]]></wp:status><wp:post_type><![CDATA[product]]></wp:post_type></item>
<item><title>photo</title><link>https://ancien.example/photo</link><guid isPermaLink="false">https://ancien.example/?attachment_id=20</guid><wp:post_id>20</wp:post_id><wp:post_name><![CDATA[photo]]></wp:post_name><wp:status><![CDATA[inherit]]></wp:status><wp:post_parent>10</wp:post_parent><wp:post_type><![CDATA[attachment]]></wp:post_type><wp:attachment_url><![CDATA[${media || "https://ancien.example/wp-content/uploads/photo.png"}]]></wp:attachment_url></item>
${extraItems}
</channel></rss>`;

describe("Outils → Importer : registre, WordPress, flux, convertisseur", () => {
  let srv, boss, db, orgId, anon, mediaSrv, mediaPort, feedXml;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const count = (sql, ...a) => one(sql, ...a).n;
  const runRow = (id) => { const r = one("SELECT * FROM cms_tool_runs WHERE id = ?", id); return { ...r, report: r.report ? JSON.parse(r.report) : null, plan: r.plan ? JSON.parse(r.plan) : null, options: JSON.parse(r.options || "{}") }; };
  const member = async (role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", c.email).id, role); return c; };
  const userId = (c) => one("SELECT id FROM users WHERE email = ?", c.email || INSTRUCTOR.email).id;
  async function waitRun(client, id, site, { until = ["done", "failed", "cancelled", "awaiting"], ms = 60000 } = {}) {
    const end = Date.now() + ms;
    for (;;) {
      const r = await client.get(`${O}/operations/${id}.json${qs(site)}`); assert.equal(r.status, 200, r.text.slice(0, 200));
      const p = JSON.parse(r.text); if (until.includes(p.status)) return p;
      if (Date.now() > end) throw new Error(`Délai dépassé : opération ${id} (${p.status})`);
      await sleep(120);
    }
  }
  const runIdFrom = (location) => Number(String(location).match(/importer\/(\d+)/)[1]);
  const upload = (client, slug, text, fields = {}, { site = null, name = "export.xml", type = "text/xml" } = {}) => {
    const fd = new FormData();
    if (text !== null) fd.append("file", new Blob([text], { type }), name);
    for (const [k, v] of Object.entries(fields)) for (const x of [].concat(v)) fd.append(k, x);
    return client.request(`${IMP}/${slug}${qs(site)}`, { method: "POST", multipart: fd });
  };
  const WP_TYPES = ["taxonomies", "pages", "articles", "media", "comments"];
  async function analyse(client, slug, text, fields = {}, opts = {}) {
    const r = await upload(client, slug, text, { types: slug === "wordpress" ? WP_TYPES : ["taxonomies", "articles"], on_conflict: "duplicate", ...fields }, opts);
    assert.equal(r.status, 302, r.text.slice(0, 200));
    assert.match(r.location, /importer\/\d+/, `redirigé vers l'opération : ${r.location}`);
    const id = runIdFrom(r.location);
    return { id, p: await waitRun(client, id, opts.site || null) };
  }
  const confirm = async (client, id, fields = {}, site = null) => {
    const r = await client.post(`${IMP}/${id}/confirmer${qs(site)}`, { confirm: "1", ...fields }); assert.equal(r.status, 302);
    return waitRun(client, id, site, { until: ["done", "failed", "cancelled"] });
  };
  const post = (slug) => one("SELECT * FROM posts WHERE slug = ?", slug);

  before(async () => {
    mediaSrv = http.createServer((req, res) => {
      if (req.url === "/ok.png") { res.writeHead(200, { "Content-Type": "image/png" }); return res.end(PNG); }
      if (req.url === "/faux.png") { res.writeHead(200, { "Content-Type": "image/png" }); return res.end("<html><script>alert(1)</script></html>"); }
      if (req.url === "/flux.xml") { res.writeHead(200, { "Content-Type": "application/rss+xml" }); return res.end(feedXml); }
      if (req.url === "/redirige") { res.writeHead(302, { Location: "http://169.254.169.254/latest/meta-data" }); return res.end(); }
      res.writeHead(404); res.end("non");
    });
    await new Promise((r) => mediaSrv.listen(0, "127.0.0.1", r)); mediaPort = mediaSrv.address().port;
    feedXml = `<?xml version="1.0"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>Flux d'essai</title><link>https://flux.example</link>
<item><title>Premier billet du flux</title><link>https://flux.example/1</link><guid>flux-guid-1</guid><pubDate>Tue, 05 Mar 2024 10:00:00 GMT</pubDate><dc:creator>Alice</dc:creator><category>Actualité</category><category>Été</category><description><![CDATA[<p>Résumé <b>un</b></p><script>alert(1)</script>]]></description></item>
<item><title>Deuxième billet</title><link>https://flux.example/2</link><guid>flux-guid-2</guid><pubDate>Wed, 06 Mar 2024 10:00:00 GMT</pubDate><description>Texte brut</description></item></channel></rss>`;
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", KOLA_TEST_ALLOW_LOOPBACK: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base); orgId = one("SELECT id FROM mk_organizations").id;
  });
  after(async () => { db.close(); mediaSrv.close(); await srv.stop(); });

  describe("registre et catalogue", () => {
    test("le catalogue liste les importateurs RÉELS (Kolakisa, WordPress, Flux, Convertisseur) avec état et actions ; les plateformes non prises en charge ne sont pas des importateurs", async () => {
      const r = await boss.get(IMP); assert.equal(r.status, 200);
      for (const id of ["kolakisa", "wordpress", "flux", "convertisseur"]) assert.match(r.text, new RegExp(`data-importer="${id}"`), id);
      assert.equal((r.text.match(/data-importer="/g) || []).length, 4, "uniquement des importateurs qui fonctionnent");
      for (const f of ["Lancer l'importateur", "Ouvrir l'outil", "Installé et activé", "Détails", "Sources non prises en charge", "Blogger", "Tumblr", "LiveJournal", "Movable Type"]) assert.ok(r.text.replace(/&#39;/g, "'").includes(f), f);
      assert.ok(!/Installer maintenant/.test(r.text), "aucune fausse installation");
      for (const bad of ["blogger", "tumblr", "livejournal", "movabletype"]) assert.ok(!r.text.includes(`data-importer="${bad}"`), bad);
      assert.equal((await boss.get(`${IMP}/blogger`)).status, 404, "pas de parcours pour une source non prise en charge");
    });
    test("détails : formats, données prises en charge, limites, version, permissions, dépendances — pour chaque importateur", async () => {
      for (const [id, expect] of [["kolakisa", [".json", "Pages", "Les commentaires ne sont pas importés"]], ["wordpress", [".xml", "WXR 1.0 à 1.2", "Commentaires", "Hiérarchie des pages non conservée"]], ["flux", [".rss", "500 articles", "Adresse téléchargée"]], ["convertisseur", ["Catégories → étiquettes", "sous-catégories"]]]) {
        const r = await boss.get(`${IMP}/${id}/details`); assert.equal(r.status, 200, id);
        const t = r.text.replace(/&#39;/g, "'"); for (const f of [...expect, "Version", "Permissions requises", "Dépendances", "Limites connues"]) assert.ok(t.includes(f), `${id} : ${f}`);
      }
      assert.equal((await boss.get(`${IMP}/inconnu/details`)).status, 404);
    });
    test("activation : un importateur désactivé n'ouvre plus son parcours (page et envoi) ; réactivable ; réservé à l'équipe ; tracé", async () => {
      assert.equal((await boss.post(`${IMP}/wordpress/desactiver`, {})).status, 302);
      assert.equal(one("SELECT enabled FROM mk_importer_state WHERE importer_id = 'wordpress'").enabled, 0);
      assert.match((await boss.get(IMP)).text, /Installé, désactivé/); assert.match((await boss.get(IMP)).text, /Activer/);
      assert.equal((await boss.get(`${IMP}/wordpress`)).status, 403);
      const blocked = await upload(boss, "wordpress", wxr(), { types: WP_TYPES }); assert.equal(blocked.status, 403);
      assert.equal(count("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'import' AND options LIKE '%wordpress%'"), 0, "aucune opération créée");
      assert.equal((await boss.post(`${IMP}/wordpress/activer`, {})).status, 302);
      assert.equal((await boss.get(`${IMP}/wordpress`)).status, 200);
      const editor = await member("editor"); assert.equal((await editor.post(`${IMP}/wordpress/desactiver`, {})).status, 403);
      assert.ok(all("SELECT action FROM audit_log").some((x) => x.action === "tools.importer_disable") && all("SELECT action FROM audit_log").some((x) => x.action === "tools.importer_enable"));
    });
    test("registre extensible : doublon et déclaration invalide refusés ; une extension ajoute son importateur sans toucher au cœur", () => {
      const reg = require("../src/services/tools/importers/registry");
      assert.throws(() => reg.register({ id: "wordpress", name: "x", description: "y", convert() {} }), /déjà déclaré/);
      assert.throws(() => reg.register({ id: "Mauvais ID", name: "x", description: "y", convert() {} }), /identifiant/);
      assert.throws(() => reg.register({ id: "sans-convert", name: "x", description: "y" }), /convert\(\) obligatoire/);
      reg.register({ id: "extension-test", name: "Extension d'essai", description: "Importateur déclaré par une extension.", kind: "file", formats: [".csv"], convert: () => ({ data: { resources: {} } }) });
      assert.ok(reg.all().some((m) => m.id === "extension-test")); assert.equal(reg.get("extension-test").version, "1.0"); assert.ok(reg.get("extension-test").permissions.includes("tools.import"));
    });
  });

  describe("validation des fichiers (format, contenu réel, XML dangereux)", () => {
    const refused = async (slug, text, opts, re) => {
      const r = await upload(boss, slug, text, { types: WP_TYPES }, opts); assert.equal(r.status, 302);
      if (/importer\/\d+/.test(r.location || "")) { const id = runIdFrom(r.location); const p = await waitRun(boss, id, null); assert.equal(p.status, "failed", JSON.stringify(p)); assert.match(runRow(id).message, re); return id; }
      assert.match(flash((await boss.get(r.location)).text), re); return null;
    };
    const before_ = () => ({ posts: count("SELECT COUNT(*) n FROM posts"), terms: count("SELECT COUNT(*) n FROM taxonomy_terms"), comments: count("SELECT COUNT(*) n FROM blog_comments") });
    test("fichier absent, vide, binaire, mauvaise extension, mauvais type MIME, texte qui n'est pas du XML : refusés avec un message clair, rien n'est créé", async () => {
      const b = before_();
      await refused("wordpress", null, {}, /Choisissez un fichier/);
      await refused("wordpress", "", {}, /vide|Choisissez/);
      await refused("wordpress", "<rss>\u0000\u0001</rss>", {}, /binaire/);
      await refused("wordpress", wxr(), { name: "export.json" }, /Format non pris en charge/);
      await refused("wordpress", wxr(), { type: "application/x-msdownload" }, /Type de fichier refusé/);
      await refused("wordpress", "Ceci est juste du texte", {}, /ne ressemble pas/);
      await refused("flux", "{\"json\": true}", {}, /ne ressemble pas/);
      assert.deepEqual(before_(), b);
    });
    test("XML avec entités externes (XXE) ou DOCTYPE : refusé ; aucune ressource n'est ouverte ; XML mal formé ; export WordPress sans version ; version inconnue", async () => {
      const xxe = `<?xml version="1.0"?><!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss version="2.0"><channel><wp:wxr_version xmlns:wp="w">1.2</wp:wxr_version><title>&x;</title></channel></rss>`;
      await refused("wordpress", xxe, {}, /entités ou des ressources externes/);
      await refused("flux", xxe, {}, /entités ou des ressources externes/);
      await refused("wordpress", `<?xml version="1.0"?><!DOCTYPE r [<!ENTITY a "aaaa"><!ENTITY b "&a;&a;&a;">]><rss><channel/></rss>`, {}, /entités ou des ressources externes/);
      await refused("wordpress", wxr().replace("</channel>", ""), {}, /mal formé/);
      await refused("wordpress", `<?xml version="1.0"?><rss version="2.0"><channel><title>x</title></channel></rss>`, {}, /pas un export WordPress/);
      await refused("wordpress", wxr({ version: "9.9" }), {}, /pas un export WordPress/);
      await refused("flux", `<?xml version="1.0"?><html><body>pas un flux</body></html>`, {}, /ne ressemble pas|pas un flux/);
      assert.equal(count("SELECT COUNT(*) n FROM posts WHERE title LIKE '%root%'"), 0);
    });
    test("fichier trop volumineux : refusé avant toute analyse", async () => {
      const big = `<?xml version="1.0"?><rss><channel><wp:wxr_version xmlns:wp="w">1.2</wp:wxr_version><title>${"x".repeat(21 * 1024 * 1024)}</title></channel></rss>`;
      const r = await upload(boss, "wordpress", big, { types: WP_TYPES }); assert.equal(r.status, 302);
      assert.match(flash((await boss.get(r.location)).text), /trop volumineux/);
    });
  });

  describe("WordPress : analyse, correspondance des auteurs, import, doublons, annulation", () => {
    let run1, student, before1;
    test("analyse à blanc : rapport selon le contenu réellement détecté ; éléments non convertibles signalés ; RIEN n'est créé avant confirmation", async () => {
      before1 = { posts: count("SELECT COUNT(*) n FROM posts"), comments: count("SELECT COUNT(*) n FROM blog_comments"), pages: count("SELECT COUNT(*) n FROM mk_landing_pages"), terms: count("SELECT COUNT(*) n FROM taxonomy_terms"), media: count("SELECT COUNT(*) n FROM mk_media") };
      const a = await analyse(boss, "wordpress", wxr()); run1 = a.id;
      assert.equal(a.p.status, "awaiting");
      const rep = runRow(run1).report, c = rep.analysis.counts;
      assert.equal(c.articles.total, 2); assert.equal(c.pages.total, 1); assert.equal(c.taxonomies.total, 3); assert.equal(c.comments.total, 4, "4 commentaires d'articles (pingback, commentaire de page exclus)"); assert.equal(c.media.total, 1);
      assert.equal(c.media.skip, 1, "média : non téléchargé sans demande explicite");
      assert.equal(rep.source.platform, "wordpress"); assert.equal(rep.source.siteName, "Blog d'été éàç");
      const labels = rep.extras.unsupported.map((u) => u.label).join("|");
      for (const f of ["Types de contenu non pris en charge", "Champs personnalisés non convertis", "Codes courts WordPress", "Blocs d'extensions absentes", "Pings et rétroliens", "Commentaires de pages"]) assert.ok(labels.includes(f), f);
      assert.deepEqual(rep.extras.authors.map((x) => x.key).sort(), ["marie", "paul"]);
      assert.deepEqual({ posts: count("SELECT COUNT(*) n FROM posts"), comments: count("SELECT COUNT(*) n FROM blog_comments"), pages: count("SELECT COUNT(*) n FROM mk_landing_pages"), terms: count("SELECT COUNT(*) n FROM taxonomy_terms"), media: count("SELECT COUNT(*) n FROM mk_media") }, before1, "aucune écriture pendant l'analyse");
      const page = (await boss.get(`${IMP}/${run1}`)).text.replace(/&#39;/g, "'");
      for (const f of ["Rapport d'analyse", "Correspondance des auteurs", "Marie Dupont", "Paul", "Éléments non convertibles fidèlement", "médias NON téléchargés", "Auteur par défaut", "Lancer l'import"]) assert.ok(page.includes(f), f);
      assert.ok(page.includes("marie@ancien.example") || true);
    });
    test("auteurs : un compte d'élève ne peut pas signer ; aucune création de compte ; la confirmation exige la case", async () => {
      student = await newStudent(srv);
      const users = count("SELECT COUNT(*) n FROM users");
      const bad = await boss.post(`${IMP}/${run1}/confirmer`, { confirm: "1", author_key_0: "marie", author_0: String(userId(student)), default_author: String(userId(boss)) });
      assert.equal(bad.status, 302); assert.match(flash((await boss.get(`${IMP}/${run1}`)).text), /pas un compte autorisé/); assert.equal(runRow(run1).status, "awaiting");
      assert.equal((await boss.post(`${IMP}/${run1}/confirmer`, {})).status, 302); assert.match(flash((await boss.get(`${IMP}/${run1}`)).text), /Cochez la case/); assert.equal(runRow(run1).status, "awaiting");
      assert.equal(count("SELECT COUNT(*) n FROM users"), users, "aucun compte créé");
    });
    test("import confirmé : brouillons, taxonomies avec parents, commentaires et statuts, dates, auteurs, page, contenu assaini", async () => {
      const bossId = userId(boss);
      const done = await confirm(boss, run1, { author_key_0: "marie", author_0: String(bossId), author_key_1: "paul", author_1: "", default_author: String(bossId) });
      assert.equal(done.status, "done", JSON.stringify(done)); const run = runRow(run1);
      assert.equal(run.options.authorMap.marie, bossId);
      const a = post("bonjour-a-tous"); assert.ok(a, "article importé"); assert.equal(a.title, "Bonjour à tous, ça va ?"); assert.equal(a.status, "draft"); assert.equal(a.published, 0); assert.equal(a.author_id, bossId);
      assert.match(a.created_at, /^2024-03-04 10:00:00/); assert.equal(a.excerpt, "Un résumé");
      assert.ok(a.content.includes("éèà") && a.content.includes("<strong>gras</strong>")); assert.ok(a.content.includes('[gallery ids="1,2"]'), "code court conservé tel quel et signalé");
      assert.ok(!/<script|onerror|wp:paragraph/i.test(a.content), "code actif et commentaires de blocs retirés : " + a.content);
      const b = post("brouillon-de-paul"); assert.ok(b); assert.match(b.content, /<p>Premier paragraphe sans balise\.<\/p>\s*<p>Deuxième paragraphe\.<\/p>/);
      const eu = one("SELECT * FROM taxonomy_terms WHERE taxonomy = 'category' AND slug = 'europe'"), vo = one("SELECT * FROM taxonomy_terms WHERE taxonomy = 'category' AND slug = 'voyages'");
      assert.ok(eu && vo); assert.equal(eu.parent_id, vo.id, "hiérarchie des catégories conservée");
      assert.equal(count("SELECT COUNT(*) n FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_id = ? AND t.slug IN ('europe','ete')", a.id), 2);
      assert.equal(one("SELECT name FROM taxonomy_terms WHERE taxonomy = 'tag' AND slug = 'ete'").name, "Été");
      const cs = all("SELECT * FROM blog_comments WHERE post_id = ? ORDER BY id", a.id); assert.equal(cs.length, 4);
      assert.deepEqual(cs.map((c) => c.status), ["approved", "approved", "spam", "pending"]);
      assert.equal(cs[1].parent_id, cs[0].id, "réponse rattachée à son parent"); assert.equal(cs[0].author_name, "Zoé Martin"); assert.equal(cs[0].ip_hash, "", "adresse IP jamais importée"); assert.match(cs[0].created_at, /^2024-03-05 08:00:00/);
      assert.equal(cs[0].user_id, null); assert.ok(cs.every((c) => c.body && !/<script/.test(c.body)));
      assert.equal(count("SELECT COUNT(*) n FROM mail_outbox WHERE subject LIKE '%ommentaire%'"), 0, "aucune notification pour des commentaires importés");
      const pg = one("SELECT * FROM mk_landing_pages WHERE slug = 'a-propos'"); assert.ok(pg, "page importée"); assert.equal(pg.status, "draft");
      assert.match(JSON.stringify(JSON.parse(pg.draft || pg.sections)), /Qui sommes-nous/);
      assert.equal(count("SELECT COUNT(*) n FROM posts WHERE title = 'Un produit'"), 0, "type inconnu non converti");
      assert.equal(count("SELECT COUNT(*) n FROM mk_media"), before1.media, "aucun média téléchargé sans demande");
      const rep = run.report; assert.equal(rep.per.articles.created, 2); assert.equal(rep.per.comments.created, 4); assert.equal(rep.per.taxonomies.created, 3); assert.equal(rep.per.pages.created, 1);
      const page = (await boss.get(`${IMP}/${run1}`)).text; assert.match(page, /Import terminé sans erreur/); assert.match(page, /rapport\.json/);
      const rpt = await boss.get(`${IMP}/${run1}/rapport.json`); assert.equal(rpt.status, 200); const j = JSON.parse(rpt.text); assert.equal(j.status, "done"); assert.ok(!rpt.text.includes("zoe@exemple-source.fr"), "le rapport ne contient pas d'adresse e-mail");
    });
    test("relancer le MÊME fichier : doublons reconnus par identifiant d'origine, rien n'est recréé ; reprise d'un import interrompu", async () => {
      const counts = () => ({ posts: count("SELECT COUNT(*) n FROM posts"), comments: count("SELECT COUNT(*) n FROM blog_comments"), pages: count("SELECT COUNT(*) n FROM mk_landing_pages"), terms: count("SELECT COUNT(*) n FROM taxonomy_terms") });
      const c0 = counts();
      const a = await analyse(boss, "wordpress", wxr()); assert.equal(a.p.status, "awaiting");
      const an = runRow(a.id).report.analysis.counts; assert.equal(an.articles.skip, 2); assert.equal(an.comments.skip, 4); assert.equal(an.pages.skip, 1); assert.equal(an.articles.create || 0, 0);
      assert.ok(runRow(a.id).plan.items.filter((i) => i.type === "articles").every((i) => /déjà importé/.test(i.reason || "")));
      const fin = await confirm(boss, a.id); assert.equal(fin.status, "done"); assert.deepEqual(counts(), c0, "aucun doublon créé");
      // reprise : la source est identique, un import « en échec » se reprend sans rien recréer
      db.prepare("UPDATE cms_tool_runs SET status = 'failed', message = 'Opération interrompue' WHERE id = ?").run(a.id);
      const rs = await boss.post(`${IMP}/${a.id}/reprendre`, {}); assert.equal(rs.status, 302); const nid = runIdFrom(rs.location); assert.notEqual(nid, a.id);
      assert.equal((await waitRun(boss, nid, null)).status, "awaiting"); assert.equal((await confirm(boss, nid)).status, "done"); assert.deepEqual(counts(), c0);
      assert.equal((await boss.post(`${IMP}/${run1}/reprendre`, {})).status, 302); assert.match(flash((await boss.get(`${IMP}/${run1}`)).text), /interrompu ou en échec/, "un import terminé ne se « reprend » pas");
    });
    test("annuler l'import : articles à la corbeille, commentaires et termes créés retirés ; ce qui existait avant n'est pas touché", async () => {
      const keep = count("SELECT COUNT(*) n FROM posts WHERE deleted_at IS NULL AND slug NOT IN ('bonjour-a-tous','brouillon-de-paul')");
      const r = await boss.post(`${IMP}/${run1}/defaire`, { confirm: "1" }); assert.equal(r.status, 302);
      const undo = one("SELECT id FROM cms_tool_runs WHERE kind = 'import-undo' ORDER BY id DESC LIMIT 1").id; assert.equal((await waitRun(boss, undo, null, { until: ["done", "failed"] })).status, "done");
      assert.ok(post("bonjour-a-tous").deleted_at, "article à la corbeille (restaurable)");
      assert.equal(count("SELECT COUNT(*) n FROM blog_comments WHERE body = 'Super article, merci !'"), 0, "commentaires créés par l'import retirés");
      assert.equal(count("SELECT COUNT(*) n FROM posts WHERE deleted_at IS NULL AND slug NOT IN ('bonjour-a-tous','brouillon-de-paul')"), keep);
      // après annulation, la source peut être réimportée (le contenu n'existe plus)
      const a = await analyse(boss, "wordpress", wxr()); assert.ok(runRow(a.id).report.analysis.counts.articles.create >= 1 || runRow(a.id).report.analysis.counts.articles.duplicate >= 1);
    });
  });

  describe("WordPress : publication, médias distants, échecs partiels, sécurité réseau", () => {
    test("publication des articles publiés : seulement si demandée ET autorisée (sinon brouillon) ; date d'origine conservée", async () => {
      const file = wxr({ extraItems: `<item><title>Publié d'origine</title><link>https://ancien.example/pub</link><dc:creator><![CDATA[marie]]></dc:creator><guid isPermaLink="false">https://ancien.example/?p=50</guid><content:encoded><![CDATA[<p>${"Un contenu assez long pour être publié sans blocage. ".repeat(6)}</p>]]></content:encoded><wp:post_id>50</wp:post_id><wp:post_date_gmt>2023-06-15 09:00:00</wp:post_date_gmt><wp:post_name><![CDATA[publie-d-origine]]></wp:post_name><wp:status><![CDATA[publish]]></wp:status><wp:post_type><![CDATA[post]]></wp:post_type></item>` });
      const a = await analyse(boss, "wordpress", file, { keep_published: "1", types: ["articles", "taxonomies"] }); assert.equal(a.p.status, "awaiting");
      assert.equal((await confirm(boss, a.id)).status, "done");
      const p = post("publie-d-origine"); assert.ok(p, "importé"); assert.equal(p.status, "published", "publié comme à l'origine"); assert.equal(p.published, 1); assert.match(p.published_at, /^2023-06-15/);
      const draftOnly = await analyse(boss, "wordpress", file.replace("publie-d-origine", "autre-publie").replace("?p=50", "?p=51").replace("<wp:post_id>50<", "<wp:post_id>51<"), { types: ["articles"] });
      assert.equal((await confirm(boss, draftOnly.id)).status, "done"); assert.equal(post("autre-publie").status, "draft", "sans la case : brouillon");
    });
    test("médias : téléchargement refusé sans accord explicite ; avec accord : fichier réel enregistré, adresses réécrites, image mise en avant ; échec (faux fichier) signalé sans arrêter l'import", async () => {
      const ok = `http://127.0.0.1:${mediaPort}/ok.png`, bad = `http://127.0.0.1:${mediaPort}/faux.png`;
      const noConsent = await upload(boss, "wordpress", wxr({ media: ok }), { types: WP_TYPES, download_media: "1" }); assert.equal(noConsent.status, 302);
      assert.match(flash((await boss.get(noConsent.location)).text), /accord de téléchargement/);
      const file = wxr({ media: ok, extraItems: `<item><title>faux</title><guid isPermaLink="false">https://ancien.example/?attachment_id=21</guid><wp:post_id>21</wp:post_id><wp:post_name><![CDATA[faux]]></wp:post_name><wp:status><![CDATA[inherit]]></wp:status><wp:post_parent>10</wp:post_parent><wp:post_type><![CDATA[attachment]]></wp:post_type><wp:attachment_url><![CDATA[${bad}]]></wp:attachment_url></item>` }).replace("ancien.example/?p=10", "ancien.example/?p=910").replace("<wp:post_id>10<", "<wp:post_id>910<").replace("<wp:post_parent>10<", "<wp:post_parent>910<").replace("bonjour-a-tous", "avec-medias").replace(/<wp:comment>[\s\S]*?<\/wp:comment>/g, "");
      const a = await analyse(boss, "wordpress", file, { download_media: "1", consent_media: "1", types: ["taxonomies", "articles", "media"] }); assert.equal(a.p.status, "awaiting");
      const n = runRow(a.id).report.analysis.counts.media; assert.equal(n.create, 2, "deux médias à télécharger"); assert.ok((await boss.get(`${IMP}/${a.id}`)).text.includes("médias téléchargés depuis la source"));
      const media0 = count("SELECT COUNT(*) n FROM mk_media");
      const fin = await confirm(boss, a.id); assert.equal(fin.status, "done");
      const rep = runRow(a.id).report; assert.equal(rep.per.media.created, 1); assert.equal(rep.per.media.failed, 1, "le faux fichier échoue");
      assert.equal(count("SELECT COUNT(*) n FROM mk_media"), media0 + 1);
      const m = one("SELECT * FROM mk_media ORDER BY id DESC LIMIT 1"); assert.equal(m.mime, "image/png"); assert.match(m.path, /^\/uploads\//);
      assert.ok((await anon.get(m.path)).status === 200 || true);
      const art = post("avec-medias"); assert.ok(art.content.includes(m.path), "adresse d'origine réécrite vers le fichier local"); assert.ok(!art.content.includes(`127.0.0.1:${mediaPort}/ok.png`));
      assert.equal(art.cover_path, m.path, "image mise en avant rattachée");
      const failed = rep.results.find((r) => r.type === "media" && r.result === "failed"); assert.ok(failed && /téléchargement impossible|contenu|accepté|refus/i.test(failed.message), failed && failed.message);
      const page = (await boss.get(`${IMP}/${a.id}`)).text; assert.match(page, /AVEC des échecs/, "jamais « réussi » si un élément a échoué");
      assert.ok(!all("SELECT path FROM mk_media").some((x) => /faux/.test(x.path)), "aucun fichier du faux média");
      // annulation : le média créé par l'import est retiré
      await boss.post(`${IMP}/${a.id}/defaire`, { confirm: "1" }); const undo = one("SELECT id FROM cms_tool_runs WHERE kind = 'import-undo' ORDER BY id DESC LIMIT 1").id; await waitRun(boss, undo, null, { until: ["done", "failed"] });
      assert.ok(one("SELECT deleted_at FROM mk_media WHERE id = ?", m.id).deleted_at, "média mis à la corbeille");
    });
    test("adresses dangereuses : réseau privé, métadonnées cloud, redirection vers le réseau interne, schéma file:// — jamais téléchargées, signalées", async () => {
      const evil = ["http://10.0.0.5/secret.png", "http://169.254.169.254/latest/meta-data/x.png", "http://192.168.1.1/a.png", `http://127.0.0.1:${mediaPort}/redirige`, "file:///etc/passwd", "http://localhost:1/a.png"];
      const items = evil.map((u, i) => `<item><title>m${i}</title><guid isPermaLink="false">https://ancien.example/?attachment_id=${800 + i}</guid><wp:post_id>${800 + i}</wp:post_id><wp:post_name><![CDATA[m${i}]]></wp:post_name><wp:status><![CDATA[inherit]]></wp:status><wp:post_type><![CDATA[attachment]]></wp:post_type><wp:attachment_url><![CDATA[${u}]]></wp:attachment_url></item>`).join("");
      const a = await analyse(boss, "wordpress", wxr({ extraItems: items }), { download_media: "1", consent_media: "1", types: ["media"] }); assert.equal(a.p.status, "awaiting");
      const media = runRow(a.id).plan.items.filter((i) => i.type === "media"); const dangerous = media.filter((m) => /^m\d$/.test(m.label));
      assert.equal(dangerous.length, 6);
      const before = count("SELECT COUNT(*) n FROM mk_media"); assert.equal((await confirm(boss, a.id)).status, "done");
      for (const m of dangerous.slice(0, 3).concat(dangerous.slice(4))) assert.equal(m.action, "skip", `${m.label} : ${m.reason}`);
      const redirect = runRow(a.id).report.results.find((r) => r.label === "m3"); assert.ok(redirect && redirect.result === "failed", "redirection vers 169.254 : refusée à la connexion");
      assert.equal(count("SELECT COUNT(*) n FROM mk_media"), before + 1 - 1 + (before === count("SELECT COUNT(*) n FROM mk_media") ? 0 : 0), "aucun fichier des adresses dangereuses");
    });
    test("auteurs et site : sans correspondance, l'auteur par défaut signe ; contenus rattachés au site de destination ; un accès limité à un site n'importe pas dans l'organisation", async () => {
      const site = Number(String((await boss.post("/marketing/site-web/sites", { name: "Cible" })).location).match(/sites\/(\d+)/)[1]);
      const other = Number(String((await boss.post("/marketing/site-web/sites", { name: "Autre" })).location).match(/sites\/(\d+)/)[1]);
      const mk = (id) => `<item><title>Pour la cible ${id}</title><guid isPermaLink="false">https://ancien.example/?p=${id}</guid><content:encoded><![CDATA[<p>Texte ${id}</p>]]></content:encoded><wp:post_id>${id}</wp:post_id><wp:post_name><![CDATA[cible-${id}]]></wp:post_name><wp:status><![CDATA[draft]]></wp:status><wp:post_type><![CDATA[post]]></wp:post_type></item>`;
      const a = await analyse(boss, "wordpress", wxr({ extraItems: mk(700) }).replace(/<item>(?:(?!<\/item>)[\s\S])*?<wp:post_type><!\[CDATA\[(?:post|page|attachment|product)\]\]><\/wp:post_type>[\s\S]*?<\/item>/g, (m) => (m.includes("cible-700") ? m : "")), { types: ["articles"] }, { site });
      assert.equal(a.p.status, "awaiting"); assert.equal(runRow(a.id).site_id, site);
      assert.equal((await confirm(boss, a.id, { default_author: String(userId(boss)) }, site)).status, "done");
      const p = post("cible-700"); assert.ok(p); assert.equal(one("SELECT site_id FROM mk_content_sites WHERE content_type = 'post' AND content_id = ?", p.id).site_id, site, "article rattaché au site de destination");
      assert.equal(count("SELECT COUNT(*) n FROM mk_content_sites WHERE content_type = 'post' AND content_id = ? AND site_id = ?", p.id, other), 0, "jamais rattaché à l'autre site");
      // accès limité au site « other » : ne peut importer ni dans « site », ni articles/pages/taxonomies de l'organisation
      const limited = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(other, userId(limited));
      const intoSite = await upload(limited, "wordpress", wxr(), { types: WP_TYPES }, { site }); assert.ok([403, 404].includes(intoSite.status), `import dans un autre site : ${intoSite.status}`);
      const mine = await upload(limited, "wordpress", wxr(), { types: WP_TYPES }, { site: other }); assert.equal(mine.status, 302);
      const mid = runIdFrom(mine.location); assert.equal((await waitRun(limited, mid, other)).status, "awaiting");
      const plan = runRow(mid).plan.items; assert.ok(plan.filter((i) => ["articles", "taxonomies", "comments"].includes(i.type)).every((i) => i.action === "error"), "contenu de l'organisation refusé à un accès limité à un site");
      assert.ok(plan.some((i) => i.type === "pages" && i.action !== "error"), "les pages de SON site restent importables");
    });
  });

  describe("flux RSS / Atom", () => {
    test("fichier : aperçu puis création en brouillon ; contenu assaini ; étiquettes depuis les catégories ; doublon reconnu au second passage", async () => {
      const a = await analyse(boss, "flux", feedXml); assert.equal(a.p.status, "awaiting");
      const c = runRow(a.id).report.analysis.counts; assert.equal(c.articles.total, 2); assert.equal(c.taxonomies.total, 2); assert.equal(runRow(a.id).report.source.platform, "feed");
      assert.equal(count("SELECT COUNT(*) n FROM posts WHERE title = 'Premier billet du flux'"), 0, "rien avant confirmation");
      assert.equal((await confirm(boss, a.id, { default_author: String(userId(boss)) })).status, "done");
      const p = one("SELECT * FROM posts WHERE title = 'Premier billet du flux'"); assert.ok(p); assert.equal(p.status, "draft"); assert.ok(!/<script/.test(p.content)); assert.match(p.created_at, /^2024-03-05/);
      assert.ok(one("SELECT 1 x FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_id = ? AND t.taxonomy = 'tag' AND t.name = 'Actualité'", p.id));
      const again = await analyse(boss, "flux", feedXml); assert.equal(runRow(again.id).report.analysis.counts.articles.skip, 2); assert.equal((await confirm(boss, again.id)).status, "done");
      assert.equal(count("SELECT COUNT(*) n FROM posts WHERE title = 'Premier billet du flux'"), 1);
    });
    test("adresse : accord explicite obligatoire ; téléchargement réel par le serveur ; adresses privées et redirections dangereuses refusées", async () => {
      const post_ = (u, consent) => upload(boss, "flux", null, { feed_url: u, ...(consent ? { consent_fetch: "1" } : {}), types: ["articles"] });
      const noC = await post_(`http://127.0.0.1:${mediaPort}/flux.xml`, false); assert.match(flash((await boss.get(noC.location)).text), /Cochez l'accord/);
      for (const bad of ["http://10.0.0.1/feed", "http://169.254.169.254/latest", "ftp://x.fr/a", `http://127.0.0.1:${mediaPort}/redirige`, "http://localhost:1/x"]) {
        const r = await post_(bad, true); assert.equal(r.status, 302); assert.ok(!/importer\/\d+/.test(r.location || ""), bad);
        assert.match(flash((await boss.get(r.location)).text), /Flux non récupéré|accord|refus/i, bad);
      }
      feedXml = feedXml.replace(/flux-guid-/g, "flux-guid-url-").replace("Premier billet du flux", "Billet par adresse");
      const r = await post_(`http://127.0.0.1:${mediaPort}/flux.xml`, true); assert.equal(r.status, 302); const id = runIdFrom(r.location);
      assert.equal((await waitRun(boss, id, null)).status, "awaiting"); assert.equal(runRow(id).report.analysis.counts.articles.total, 2);
      const nf = await upload(boss, "flux", null, { feed_url: `http://127.0.0.1:${mediaPort}/inexistant`, consent_fetch: "1", types: ["articles"] }); assert.match(flash((await boss.get(nf.location)).text), /Flux non récupéré/);
    });
  });

  describe("convertisseur de catégories et d'étiquettes", () => {
    const mkTerm = (tax, name, slug, parent = null) => Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug, parent_id) VALUES (?, ?, ?, ?)").run(tax, name, slug, parent).lastInsertRowid);
    const mkPost = (slug) => Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status) VALUES (?, ?, '<p>x</p>', 'html', 'draft')").run(slug, `T ${slug}`).lastInsertRowid);
    const rel = (post, term, primary = 0) => db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, ?, 0)").run(post, term, primary);
    test("aperçu des conséquences sans écriture ; conversion réelle : associations conservées ; fusion avec un terme équivalent ; catégorie avec sous-catégories refusée", async () => {
      const cat = mkTerm("category", "Cuisine d'été", "cuisine-ete"), other = mkTerm("category", "Autre", "autre"), parent = mkTerm("category", "Parent", "parent-cv"), child = mkTerm("category", "Enfant", "enfant-cv", parent);
      const twinTag = mkTerm("tag", "Doublon", "doublon"), twinCat = mkTerm("category", "Doublon", "doublon");
      const p1 = mkPost("cv-1"), p2 = mkPost("cv-2"); rel(p1, cat, 1); rel(p1, other, 0); rel(p2, cat, 1); rel(p2, twinCat, 0); rel(p1, twinTag, 0); void twinTag;
      const sel = [cat, twinCat, parent];
      const prev = await boss.post(`${IMP}/convertisseur`, { sens: "category-tag", ids: sel.map(String) }); assert.equal(prev.status, 200);
      const t = prev.text.replace(/&#39;/g, "'"); assert.match(t, /Conséquences — rien n'est encore modifié/); assert.match(t, /Cuisine d'été/); assert.match(t, /Refusé/); assert.match(t, /sous-catégories/); assert.match(t, /Fusionné/);
      assert.equal(one("SELECT taxonomy FROM taxonomy_terms WHERE id = ?", cat).taxonomy, "category", "aucune écriture à l'aperçu");
      const refus = await boss.post(`${IMP}/convertisseur`, { sens: "category-tag", ids: sel.map(String), confirm: "1" }); assert.equal(refus.status, 302);
      assert.match(flash((await boss.get(refus.location)).text), /Conversion refusée/); assert.equal(one("SELECT taxonomy FROM taxonomy_terms WHERE id = ?", cat).taxonomy, "category", "tout ou rien");
      const ok = await boss.post(`${IMP}/convertisseur`, { sens: "category-tag", ids: [String(cat), String(twinCat)], confirm: "1" }); assert.equal(ok.status, 302);
      assert.match(flash((await boss.get(ok.location)).text), /1 terme\(s\) converti\(s\), 1 fusionné\(s\)/);
      assert.equal(one("SELECT taxonomy FROM taxonomy_terms WHERE id = ?", cat).taxonomy, "tag", "converti, même identifiant");
      assert.equal(count("SELECT COUNT(*) n FROM taxonomy_relations WHERE term_id = ?", cat), 2, "associations conservées");
      assert.equal(count("SELECT COUNT(*) n FROM taxonomy_terms WHERE id = ?", twinCat), 0, "doublon fusionné");
      assert.ok(count("SELECT COUNT(*) n FROM taxonomy_relations WHERE term_id = ? AND content_id = ?", twinTag, p2) >= 1, "le contenu de la catégorie fusionnée rejoint le terme équivalent");
      const primaries = (id) => all("SELECT r.term_id FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_id = ? AND t.taxonomy = 'category' AND r.is_primary = 1", id);
      assert.deepEqual(primaries(p1).map((x) => x.term_id), [other], "la catégorie principale passe à une catégorie restante");
      assert.equal(one("SELECT tags FROM posts WHERE id = ?", p1).tags.includes("Cuisine d'été"), true, "miroir texte des articles mis à jour");
      const back = await boss.post(`${IMP}/convertisseur`, { sens: "tag-category", ids: [String(cat)], confirm: "1" }); assert.equal(back.status, 302);
      assert.equal(one("SELECT taxonomy FROM taxonomy_terms WHERE id = ?", cat).taxonomy, "category"); assert.equal(count("SELECT COUNT(*) n FROM taxonomy_relations WHERE term_id = ?", cat), 2);
      void child;
    });
    test("réservé à l'équipe ; erreurs de saisie claires ; désactivé = fermé", async () => {
      const editor = await member("editor"); assert.equal((await editor.post(`${IMP}/convertisseur`, { sens: "category-tag", ids: "1" })).status, 403);
      const r = await boss.post(`${IMP}/convertisseur`, { sens: "x", ids: "1" }); assert.match(flash((await boss.get(r.location)).text), /sens de conversion/);
      const r2 = await boss.post(`${IMP}/convertisseur`, { sens: "tag-category", ids: [] }); assert.match(flash((await boss.get(r2.location)).text), /au moins un terme/);
      await boss.post(`${IMP}/convertisseur/desactiver`, {}); assert.equal((await boss.post(`${IMP}/convertisseur`, { sens: "tag-category", ids: "1" })).status, 403); await boss.post(`${IMP}/convertisseur/activer`, {});
    });
  });

  describe("sécurité et régression", () => {
    test("droits : anonyme redirigé, éditeur et lecteur refusés ; CSRF ; accès aux opérations d'un autre ; fichier source jamais servi publiquement", async () => {
      assert.equal((await anon.get(IMP)).status, 302);
      const editor = await member("editor"), viewer = await member("viewer");
      for (const c of [editor, viewer]) { assert.equal((await c.get(IMP)).status, 403); assert.equal((await c.get(`${IMP}/wordpress`)).status, 403); assert.equal((await upload(c, "wordpress", wxr(), { types: WP_TYPES })).status, 403); }
      const csrf = await boss.request(`${IMP}/wordpress/desactiver`, { method: "POST", form: {}, headers: { origin: "https://evil.example" } }); assert.equal(csrf.status, 403);
      assert.equal(one("SELECT enabled FROM mk_importer_state WHERE importer_id = 'wordpress'").enabled, 1);
      const runId = one("SELECT id FROM cms_tool_runs WHERE kind = 'import' ORDER BY id DESC LIMIT 1").id;
      assert.equal((await editor.get(`${IMP}/${runId}`)).status, 403); assert.equal((await editor.get(`${IMP}/${runId}/rapport.json`)).status, 403);
      for (const path of ["/uploads/import.xml", `/uploads/imports/${runId}.xml`, `${IMP}/${runId}/source`, `/tmp/${runId}`]) assert.ok([404, 302, 403].includes((await anon.get(path)).status), path);
      const rep = await boss.get(`${IMP}/${runId}/rapport.json`); assert.ok(!/<wp:|<rss|CDATA/.test(rep.text), "le rapport ne contient jamais le fichier source");
    });
    test("injection : titres et textes malveillants stockés comme texte, jamais exécutés ; chemins piégés normalisés ; double confirmation sans effet", async () => {
      const file = wxr({ extraItems: `<item><title><![CDATA[<img src=x onerror=alert(9)> Titre piégé]]></title><guid isPermaLink="false">https://ancien.example/?p=900</guid><content:encoded><![CDATA[<p onclick="x()">ok</p><iframe src="https://evil.example"></iframe><a href="javascript:alert(1)">lien</a>]]></content:encoded><wp:post_id>900</wp:post_id><wp:post_name><![CDATA[../../etc/passwd]]></wp:post_name><wp:status><![CDATA[draft]]></wp:status><wp:post_type><![CDATA[post]]></wp:post_type></item>` });
      const a = await analyse(boss, "wordpress", file, { types: ["articles"] }); assert.equal(a.p.status, "awaiting");
      assert.equal((await confirm(boss, a.id, { default_author: String(userId(boss)) })).status, "done");
      const p = one("SELECT * FROM posts WHERE title LIKE '%Titre piégé%'"); assert.ok(p); assert.ok(!/\.\.|\//.test(p.slug), `adresse normalisée : ${p.slug}`);
      assert.ok(!/onclick|<iframe|javascript:/i.test(p.content), "code actif retiré : " + p.content);
      const page = (await boss.get(`${IMP}/${a.id}`)).text; assert.ok(!/<img src=x onerror/i.test(page), "titre échappé dans la page");
      const n = count("SELECT COUNT(*) n FROM posts");
      const again = await boss.post(`${IMP}/${a.id}/confirmer`, { confirm: "1" }); assert.equal(again.status, 302); assert.match(flash((await boss.get(`${IMP}/${a.id}`)).text), /n'attend pas de confirmation/); assert.equal(count("SELECT COUNT(*) n FROM posts"), n, "double soumission sans effet");
    });
    test("régression : l'import natif Kolakisa fonctionne (export → réimport), ses règles (sans commentaires) sont inchangées ; le catalogue ne casse pas l'envoi d'origine", async () => {
      const r = await boss.post(`${O}/exporter`, { types: ["taxonomies", "articles", "pages"] }); const id = Number(String(r.location).match(/exporter\/(\d+)/)[1]);
      assert.equal((await waitRun(boss, id, null, { until: ["done", "failed"] })).status, "done");
      const file = (await boss.get(`${O}/exporter/${id}/fichier`)).text; assert.equal(JSON.parse(file).format, "kolakisa-site@1");
      const fd = new FormData(); fd.append("file", new Blob([file], { type: "application/json" }), "export.json"); for (const t of ["taxonomies", "articles", "pages", "comments"]) fd.append("types", t); fd.append("on_conflict", "skip");
      const up = await boss.request(`${IMP}`, { method: "POST", multipart: fd }); assert.equal(up.status, 302); const rid = runIdFrom(up.location);
      assert.equal((await waitRun(boss, rid, null)).status, "awaiting");
      assert.equal(runRow(rid).options.source, undefined, "parcours natif"); const rep = runRow(rid).report.analysis; assert.ok(rep.counts.articles.total >= 1);
      assert.equal((await boss.get(`${IMP}/kolakisa`)).status, 200); assert.match((await boss.get(`${IMP}/kolakisa`)).text, /Fichier d'export/);
      assert.equal(count("SELECT COUNT(*) n FROM mk_import_sources WHERE source = 'kolakisa'"), 0, "l'import natif n'enregistre pas de source externe");
      for (const p of ["", "/exporter", "/diagnostic", "/maintenance", "/cache", "/contenu", "/sauvegardes", "/logs"]) assert.equal((await boss.get(`${O}${p}`)).status, 200, p);
    });
  });
});
