// KOLAKISA CMS — Outils → Exporter : sélection (tout, articles, pages, autre type), filtres validés par le serveur, formats natif (JSON) et WordPress (WXR), médias en archive ZIP,
// téléchargement privé, isolation par site, permissions. Vrai serveur, vraies routes ; les fichiers produits sont relus et contrôlés (XML bien formé via xmllint si présent).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const { readZip } = require("../src/services/tools/zip");

const O = "/marketing/site-web/outils";
let srv, boss, db, anon, org, A, B, alice, bob, ids = {};
const one = (sql, ...a) => db.prepare(sql).get(...a);
const qs = (site) => (site ? `?site=${site}` : "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function newSite(name) { return Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]); }
const userId = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const png = (w, h) => require("node:zlib") && Buffer.from("89504e470d0a1a0a0000000d49484452", "hex"); // remplacé ci-dessous par un vrai PNG
let sharp = null; try { sharp = require("sharp"); } catch { /* images de repli */ }
async function realPng(w = 40, h = 30) {
  if (sharp) return sharp({ create: { width: w, height: h, channels: 3, background: { r: 200, g: 60, b: 20 } } }).png().toBuffer();
  // PNG 1×1 valide (repli sans sharp)
  return Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAH6QpmQAAAABJRU5ErkJggg==", "base64");
}
async function upload(client, buffer, name, site) {
  const fd = new FormData(); fd.append("file", new Blob([buffer], { type: "image/png" }), name);
  const r = await client.request(`/marketing/site-web/mediatheque/televerser${qs(site)}`, { method: "POST", multipart: fd });
  assert.equal(r.status, 201, r.text.slice(0, 200));
  return JSON.parse(r.text).media;
}
async function waitRun(client, id, site, ms = 40000) {
  const end = Date.now() + ms;
  for (;;) {
    const r = await client.get(`${O}/operations/${id}.json${qs(site)}`);
    const p = JSON.parse(r.text);
    if (["done", "failed", "cancelled"].includes(p.status)) return p;
    if (Date.now() > end) throw new Error(`Délai dépassé : export ${id} (${p.status})`);
    await sleep(100);
  }
}
// Lance un export par l'écran (champ « choice »), attend la fin, télécharge. Retourne { r (réponse du POST), run, file }
async function doExport(client, fields = {}, site = null) {
  const r = await client.post(`${O}/exporter${qs(site)}`, { choice: "all", format: "json", ...fields });
  if (r.status !== 302) return { r };
  const id = Number(String(r.location).match(/exporter\/(\d+)/)[1]);
  const run = await waitRun(client, id, site);
  const file = run.status === "done" ? await client.get(`${O}/exporter/${id}/fichier${qs(site)}`) : null;
  return { r, id, run, file };
}
const json = (x) => JSON.parse(x.file.text);
const xmllint = (text) => { const f = path.join(srv.dir, `check-${Date.now()}-${Math.random().toString(16).slice(2)}.xml`); fs.writeFileSync(f, text); const r = spawnSync("xmllint", ["--noout", f], { encoding: "utf8" }); return r.error ? null : { ok: r.status === 0, err: r.stderr }; };
const post = (slug, title, { site = null, author = null, status = "published", at = "2026-10-10 12:00:00", content = "<p>Texte</p>", cat = [] } = {}) => {
  const pub = status === "published" ? 1 : 0;
  const id = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, excerpt, status, published, published_at, created_at, author_id, comments_enabled) VALUES (?, ?, ?, 'html', ?, ?, ?, ?, ?, ?, 1)").run(slug, title, content, `Résumé ${title}`, status, pub, pub ? at : null, at, author).lastInsertRowid);
  if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('post', ?, ?, ?, '')").run(id, org, site);
  cat.forEach((t, i) => db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, ?, 0)").run(id, t, i === 0 ? 1 : 0));
  return id;
};
const term = (taxonomy, name, slug, { site = null, parent = null } = {}) => {
  const id = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug, parent_id) VALUES (?, ?, ?, ?)").run(taxonomy, name, slug, parent).lastInsertRowid);
  if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('term', ?, ?, ?, ?)").run(id, org, site, taxonomy);
  return id;
};

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
  org = one("SELECT id FROM mk_organizations").id;
  A = await newSite("Export Alpha"); B = await newSite("Export Beta");
  alice = await newStudent(srv); bob = await newStudent(srv);
  const aid = userId(alice), bid = userId(bob);
  db.prepare("UPDATE users SET username = 'alice' WHERE id = ?").run(aid); db.prepare("UPDATE users SET username = 'bob' WHERE id = ?").run(bid);
  // Termes du site A (catégorie parente, enfant, étiquette) et d'un autre site
  ids.tech = term("category", "Technologie", "technologie", { site: A }); ids.ia = term("category", "Intelligence artificielle", "ia", { site: A, parent: ids.tech }); ids.cuisine = term("category", "Cuisine", "cuisine", { site: A }); ids.tag = term("tag", "Été", "ete", { site: A });
  ids.tb = term("category", "Secret de Beta", "secret-beta", { site: B });
  // Articles du site A : dates, auteurs, statuts différents ; contenu piégé pour XML ; un article de B et un du principal
  ids.p1 = post("tech-un", "Un article « Technologie » & l'été", { site: A, author: aid, at: "2026-10-10 12:00:00", cat: [ids.tech] });
  ids.p2 = post("ia-deux", "Intelligence artificielle", { site: A, author: bid, at: "2026-10-20 23:30:00", cat: [ids.ia] }); // 21/10 01:30 à Paris
  ids.p3 = post("cuisine-brouillon", "Brouillon cuisine", { site: A, author: aid, status: "draft", at: "2026-09-01 08:00:00", cat: [ids.cuisine] });
  ids.p4 = post("piege-xml", "Piège <XML> & \"guillemets\" ]]>", { site: A, author: aid, at: "2026-10-12 09:00:00", content: "<p>Accents éàçü, ligne ]]> piégée, <![CDATA[ x ]]> et emoji 😀</p><script>alert(1)</script>", cat: [ids.tech, ids.cuisine] });
  db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, 0, 100)").run(ids.p1, ids.tag);
  ids.pB = post("beta-secret", "Article secret de Beta", { site: B, author: bid, cat: [ids.tb] });
  ids.pM = post("principal-un", "Article du principal", { author: aid });
  // Commentaires : un approuvé (avec e-mail et IP à ne jamais exporter), un en attente
  db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, user_id, author_name, author_email, ip_hash, body, status) VALUES (?, 'post', ?, NULL, 'Zoé', 'zoe@secret.example', 'iphash123', 'Très bien ! <b>gras</b> ]]> 😀', 'approved')").run(ids.p1, ids.p1);
  db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, user_id, author_name, author_email, ip_hash, body, status) VALUES (?, 'post', ?, NULL, 'Spam', 'spam@x.example', 'iphash999', 'EN ATTENTE', 'pending')").run(ids.p1, ids.p1);
  // Pages du site A (parent / enfant) et du site B
  const page = async (name, site, extra = {}) => { const r = await boss.post("/marketing/pages", { name, template: "", site_id: String(site), ...extra }); return Number(String(r.location).match(/pages\/(\d+)/)[1]); };
  ids.g1 = await page("Page parente", A); ids.g2 = await page("Page enfant", A); ids.gB = await page("Page secrète de Beta", B);
  db.prepare("UPDATE mk_landing_pages SET parent_id = ?, created_by = ?, status = 'published', published_at = '2026-10-05 10:00:00' WHERE id = ?").run(ids.g1, aid, ids.g2);
  db.prepare("UPDATE mk_landing_pages SET created_by = ?, status = 'draft' WHERE id = ?").run(bid, ids.g1);
  // Médias : un du site A (fichier réel), un du site B (ne doit jamais sortir), un du site A dont le fichier a disparu
  ids.mA = await upload(boss, await realPng(), "alpha.png", A); ids.mB = await upload(boss, await realPng(), "beta.png", B);
  ids.missing = `/uploads/marketing/${org}/site-${A}/1700000000000-aaaaaaaaaaaa.png`;
  db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, site_id, reach) VALUES (?, 'image', 'image', ?, 'disparu.png', 'image/png', 10, ?, 'site')").run(org, ids.missing, A);
  // Menu du site A
  const m = await boss.post("/marketing/site-web/navigation/menus", { name: "Menu export" });
  const mid = Number(String(m.location).match(/menus\/(\d+)/)[1]);
  db.prepare("UPDATE nav_menus SET site_id = ? WHERE id = ?").run(A, mid);
  for (const [type, oid, label, url] of [["page", ids.g1, "Parente", ""], ["article", ids.p1, "Article", ""], ["category", ids.tech, "Techno", ""], ["custom", null, "Contact", "/contact"]]) db.prepare("INSERT INTO nav_items (menu_id, position, type, object_id, url, label) VALUES (?, 0, ?, ?, ?, ?)").run(mid, type, oid, url, label);
});
after(async () => { await srv.stop(); });

describe("écran : sélection, filtres alimentés par les données réelles", () => {
  test("« Tout le contenu » est coché par défaut ; articles, pages et autres types, format, médias et bouton sont présents ; les filtres viennent des données du site", async () => {
    const r = await boss.get(`${O}/exporter${qs(A)}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /<input type="radio" name="choice" value="all" checked/);
    assert.match(r.text, /value="articles"/); assert.match(r.text, /value="pages"/); assert.match(r.text, /value="other:media"/); assert.match(r.text, /value="other:taxonomies"/);
    assert.match(r.text, /Télécharger le fichier d'exportation/);
    assert.match(r.text, /name="format" value="json" checked/); assert.match(r.text, /name="format" value="wxr"/); assert.match(r.text, /name="media" value="1"/);
    assert.match(r.text, /Exportez le contenu de <strong>ce site<\/strong>/); assert.match(r.text, /ne supprime ni ne modifie le contenu original/);
    // catégories, auteurs et statuts du site A seulement
    assert.match(r.text, /Technologie/); assert.match(r.text, /— Intelligence artificielle/); assert.doesNotMatch(r.text, /Secret de Beta/);
    assert.match(r.text, /<option value="\d+">alice<\/option>/); assert.match(r.text, /<option value="\d+">bob<\/option>/); assert.match(r.text, /En attente de relecture/);
    assert.doesNotMatch(r.text, /name="choice" value="other:contacts" checked/, "données personnelles : jamais cochées d'office");
  });
  test("types sensibles et réservés au site principal : « contacts » est signalé ; « seo » n'est pas proposé pour un site", async () => {
    const site = (await boss.get(`${O}/exporter${qs(A)}`)).text, main = (await boss.get(`${O}/exporter`)).text;
    assert.doesNotMatch(site, /value="other:seo"/); assert.match(main, /value="other:seo"/);
    assert.match(site, /Données personnelles/);
  });
  test("aperçu du périmètre : nombre d'éléments, erreurs de filtre, absence de résultat — sans rien exporter", async () => {
    const pv = async (fields) => JSON.parse((await boss.post(`${O}/exporter/apercu${qs(A)}`, { choice: "articles", ...fields })).text);
    const runsBefore = one("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'export'").n;
    assert.deepEqual(await pv({}).then((r) => [r.ok, r.count, r.empty]), [true, 4, false]);
    assert.equal((await pv({ status: "draft" })).count, 1);
    assert.equal((await pv({ status: "published", author: String(userId(bob)) })).count, 1);
    assert.equal((await pv({ category: String(ids.tb) })).ok, false, "catégorie d'un autre site refusée");
    const none = await pv({ from: "2030-01-01" }); assert.equal(none.empty, true);
    assert.equal((await pv({ from: "2026-13-40" })).ok, false);
    assert.equal((await pv({ from: "2026-10-20", to: "2026-10-01" })).ok, false);
    assert.equal((await pv({ status: "inconnu" })).ok, false);
    assert.equal(one("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'export'").n, runsBefore, "l'aperçu ne crée aucune opération");
  });
});

describe("filtres : le fichier contient exactement ce qui correspond", () => {
  const titles = (e) => json(e).resources.articles.map((a) => a.title).sort();
  test("articles seuls : uniquement ceux du site, avec leurs catégories et étiquettes utilisées (et leurs parents), sans les autres termes", async () => {
    const e = await doExport(boss, { choice: "articles" }, A);
    assert.equal(e.run.status, "done", JSON.stringify(e.run));
    const d = json(e);
    assert.equal(d.resources.articles.length, 4);
    assert.ok(!d.resources.articles.some((a) => /Beta|principal/i.test(a.title)), "rien d'un autre site ni du principal");
    assert.deepEqual(Object.keys(d.resources).sort(), ["articles", "taxonomies"]);
    const names = d.resources.taxonomies.map((t) => t.name).sort();
    assert.deepEqual(names, ["Cuisine", "Intelligence artificielle", "Technologie", "Été"].sort(), "termes utilisés + parent « Technologie »");
    assert.ok(!names.includes("Secret de Beta"));
    const a1 = d.resources.articles.find((a) => a.slug === "tech-un");
    assert.equal(a1.authorName, "alice"); assert.ok(a1.categoryRefs.length === 1 && a1.tagRefs.length === 1);
  });
  test("auteur, catégorie (avec sous-catégories), statut, plage de dates dans le fuseau du site, et combinaisons", async () => {
    assert.deepEqual(titles(await doExport(boss, { choice: "articles", author: String(userId(alice)) }, A)), ["Brouillon cuisine", "Piège <XML> & \"guillemets\" ]]>", "Un article « Technologie » & l'été"].sort());
    assert.deepEqual(titles(await doExport(boss, { choice: "articles", category: String(ids.tech) }, A)), ["Intelligence artificielle", "Piège <XML> & \"guillemets\" ]]>", "Un article « Technologie » & l'été"].sort(), "la catégorie ET ses sous-catégories");
    assert.deepEqual(titles(await doExport(boss, { choice: "articles", status: "draft" }, A)), ["Brouillon cuisine"]);
    // « 21/10 » à Paris : l'article publié le 20/10 à 23:30 UTC (01:30 locale) en fait partie ; celui du 10/10 non
    assert.deepEqual(titles(await doExport(boss, { choice: "articles", from: "2026-10-21", to: "2026-10-21" }, A)), ["Intelligence artificielle"], "dates : fuseau du site, pas UTC");
    const none = await doExport(boss, { choice: "articles", from: "2026-10-20", to: "2026-10-20" }, A);
    assert.equal(none.r.status, 422, "le 20 (heure locale) : aucun article, message d'absence de résultat");
    assert.deepEqual(titles(await doExport(boss, { choice: "articles", author: String(userId(alice)), status: "published", category: String(ids.cuisine) }, A)), ["Piège <XML> & \"guillemets\" ]]>"], "combinaison");
  });
  test("aucun résultat : message clair, aucune opération, la sélection reste affichée", async () => {
    const before = one("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'export'").n;
    const r = await boss.post(`${O}/exporter${qs(A)}`, { choice: "articles", format: "json", from: "2030-01-01", status: "published" });
    assert.equal(r.status, 422);
    assert.match(r.text, /Aucun contenu ne correspond/);
    assert.match(r.text, /name="from"[^>]*value="2030-01-01"/, "la saisie est conservée");
    assert.equal(one("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'export'").n, before);
  });
  test("pages : filtres auteur, statut, dates ; la hiérarchie (page parente) est conservée", async () => {
    const all = json(await doExport(boss, { choice: "pages" }, A));
    assert.deepEqual(all.resources.pages.map((p) => p.name).sort(), ["Page enfant", "Page parente"]);
    const child = all.resources.pages.find((p) => p.name === "Page enfant");
    assert.equal(child.parentRef, `p${ids.g1}`);
    assert.deepEqual(json(await doExport(boss, { choice: "pages", status_pages: "published" }, A)).resources.pages.map((p) => p.name), ["Page enfant"]);
    assert.deepEqual(json(await doExport(boss, { choice: "pages", author_pages: String(userId(bob)) }, A)).resources.pages.map((p) => p.name), ["Page parente"]);
    assert.equal((await boss.post(`${O}/exporter${qs(A)}`, { choice: "pages", format: "json", from_pages: "2031-01-01" })).status, 422);
  });
  test("autre type : un seul type, avec son comptage réel", async () => {
    const d = json(await doExport(boss, { choice: "other:taxonomies" }, A));
    assert.deepEqual(Object.keys(d.resources), ["taxonomies"]);
    assert.ok(d.resources.taxonomies.every((t) => t.name !== "Secret de Beta"));
    assert.equal(d.counts.taxonomies, d.resources.taxonomies.length);
  });
});

describe("format natif : structure, accents, relations, aucun secret", () => {
  test("tout le contenu du site : manifeste, accents, caractères XML sensibles, relations et menus ; aucune donnée d'un autre site ni secret", async () => {
    const e = await doExport(boss, { choice: "all" }, A);
    assert.equal(e.run.status, "done", JSON.stringify(e.run));
    assert.match(e.file.headers.get("content-type"), /application\/json/);
    assert.match(e.file.headers.get("content-disposition"), /attachment; filename="kolakisa-export-alpha-\d{4}-\d{2}-\d{2}\.json"/);
    const d = json(e);
    assert.equal(d.format, "kolakisa-site@1"); assert.equal(d.source.siteName, "Export Alpha"); assert.ok(d.exportedAt); assert.equal(d.media.files, false);
    for (const k of ["pages", "articles", "taxonomies", "menus", "media", "comments"]) assert.ok(d.resources[k], k);
    const piege = d.resources.articles.find((a) => a.slug === "piege-xml");
    assert.match(piege.title, /Piège <XML> & "guillemets" \]\]>/); assert.match(piege.content, /éàçü/); assert.match(piege.content, /😀/);
    assert.equal(d.resources.menus[0].items.find((i) => i.type === "article").objectRef, `a${ids.p1}`, "le menu garde une référence");
    const text = e.file.text;
    assert.doesNotMatch(text, /Secret de Beta|Article secret|Page secrète|beta\.png/, "rien du site B");
    assert.doesNotMatch(text, /Article du principal/);
    assert.doesNotMatch(text, /zoe@secret|spam@x|iphash|password|prof@test\.local/i, "ni e-mail, ni IP, ni compte");
    assert.equal(d.resources.comments.length, 1, "seul le commentaire approuvé");
    assert.ok(d.integrity.sha256.length === 64);
  });
  test("site principal : seulement le contenu non rattaché à un site", async () => {
    const d = json(await doExport(boss, { choice: "articles" }));
    assert.deepEqual(d.resources.articles.map((a) => a.title), ["Article du principal"]);
  });
  test("réimport : un export d'articles filtré se réimporte dans un autre site (même moteur d'import)", async () => {
    const e = await doExport(boss, { choice: "articles", author: String(userId(alice)), status: "published" }, A);
    const fd = new FormData(); fd.append("file", new Blob([e.file.text], { type: "application/json" }), "export.json"); fd.append("types", "articles"); fd.append("types", "taxonomies"); fd.append("on_conflict", "duplicate");
    const imp = await boss.request(`${O}/importer?site=${B}`, { method: "POST", multipart: fd });
    assert.equal(imp.status, 302, imp.text.slice(0, 200));
    const id = Number(String(imp.location).match(/importer\/(\d+)/)[1]);
    let p; for (let i = 0; i < 100; i++) { p = JSON.parse((await boss.get(`${O}/operations/${id}.json?site=${B}`)).text); if (["awaiting", "done", "failed"].includes(p.status)) break; await sleep(100); }
    assert.equal(p.status, "awaiting", JSON.stringify(p));
    assert.equal(one("SELECT COUNT(*) n FROM posts WHERE title LIKE 'Un article « Technologie »%'").n >= 1, true);
  });
});

describe("format WXR (WordPress)", () => {
  test("tout le contenu : XML bien formé, espaces de noms et version, catégories, étiquettes, articles, pages, commentaires, médias, menus ; aucune adresse e-mail", async () => {
    const e = await doExport(boss, { choice: "all", format: "wxr" }, A);
    assert.equal(e.run.status, "done", JSON.stringify(e.run));
    assert.match(e.file.headers.get("content-type"), /application\/xml/);
    assert.match(e.file.headers.get("content-disposition"), /\.xml"/);
    const x = e.file.text;
    const lint = xmllint(x);
    if (lint) assert.equal(lint.ok, true, `xmllint : ${lint.err}`);
    assert.match(x, /^<\?xml version="1.0" encoding="UTF-8" \?>/);
    assert.match(x, /xmlns:wp="http:\/\/wordpress\.org\/export\/1\.2\/"/); assert.match(x, /<wp:wxr_version>1\.2<\/wp:wxr_version>/);
    assert.match(x, /<wp:category>[\s\S]*<wp:cat_name><!\[CDATA\[Intelligence artificielle\]\]><\/wp:cat_name>/);
    assert.match(x, /<wp:category_parent><!\[CDATA\[technologie\]\]><\/wp:category_parent>/, "hiérarchie des catégories");
    assert.match(x, /<wp:tag>[\s\S]*<wp:tag_name><!\[CDATA\[Été\]\]><\/wp:tag_name>/);
    assert.match(x, /<wp:post_type><!\[CDATA\[post\]\]><\/wp:post_type>/); assert.match(x, /<wp:post_type><!\[CDATA\[page\]\]><\/wp:post_type>/); assert.match(x, /<wp:post_type><!\[CDATA\[attachment\]\]><\/wp:post_type>/); assert.match(x, /<wp:post_type><!\[CDATA\[nav_menu_item\]\]><\/wp:post_type>/);
    assert.match(x, /<category domain="category" nicename="technologie"><!\[CDATA\[Technologie\]\]><\/category>/);
    assert.match(x, /<wp:status><!\[CDATA\[publish\]\]><\/wp:status>/); assert.match(x, /<wp:status><!\[CDATA\[draft\]\]><\/wp:status>/);
    assert.match(x, /<wp:comment>[\s\S]*Très bien !/, "commentaire approuvé"); assert.doesNotMatch(x, /EN ATTENTE/);
    assert.match(x, /<wp:comment_author_email><!\[CDATA\[\]\]><\/wp:comment_author_email>/, "e-mail toujours vide");
    assert.doesNotMatch(x, /zoe@secret|spam@x|iphash|@secret|prof@test\.local/i);
    assert.doesNotMatch(x, /Secret de Beta|Article secret|Page secrète/);
    assert.match(x, /<wp:attachment_url><!\[CDATA\[https:\/\/k\.test\/uploads\/marketing\/\d+\/site-\d+\/\d+-[0-9a-f]+\.png\]\]><\/wp:attachment_url>/);
  });
  test("contenu piégé : « ]]> » découpé, accents et emoji conservés, aucun caractère interdit en XML", async () => {
    const e = await doExport(boss, { choice: "articles", format: "wxr" }, A);
    const x = e.file.text;
    const lint = xmllint(x); if (lint) assert.equal(lint.ok, true, lint.err);
    assert.match(x, /éàçü/); assert.match(x, /😀/); assert.match(x, /\]\]\]\]><!\[CDATA\[>/, "séquence de fin de CDATA protégée");
    assert.doesNotMatch(x, /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/);
  });
  test("dates : date locale du site et date GMT distinctes (Paris, heure d'été) ; articles d'un seul auteur ; commentaires avec leurs articles", async () => {
    const x = (await doExport(boss, { choice: "articles", format: "wxr", status: "published", author: String(userId(bob)) }, A)).file.text;
    assert.match(x, /<wp:post_date><!\[CDATA\[2026-10-21 01:30:00\]\]><\/wp:post_date>/); assert.match(x, /<wp:post_date_gmt><!\[CDATA\[2026-10-20 23:30:00\]\]><\/wp:post_date_gmt>/);
    assert.match(x, /<dc:creator><!\[CDATA\[bob\]\]><\/dc:creator>/); assert.doesNotMatch(x, /Un article « Technologie »/);
    const withComments = (await doExport(boss, { choice: "articles", format: "wxr", author: String(userId(alice)) }, A)).file.text;
    assert.match(withComments, /<wp:comment>/);
  });
  test("pages : hiérarchie par identifiant parent, texte de l'éditeur seulement (limite documentée)", async () => {
    const x = (await doExport(boss, { choice: "pages", format: "wxr" }, A)).file.text;
    const lint = xmllint(x); if (lint) assert.equal(lint.ok, true, lint.err);
    assert.match(x, new RegExp(`<wp:post_id>${ids.g2 + 100000}</wp:post_id>[\\s\\S]*?<wp:post_parent>${ids.g1 + 100000}</wp:post_parent>`));
  });
  test("un type qui n'existe qu'en format natif est refusé en WXR (message clair, aucune opération) ; « tout » l'ignore et le dit", async () => {
    const before = one("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'export'").n;
    const r = await boss.post(`${O}/exporter${qs(A)}`, { choice: "other:redirects", format: "wxr" });
    assert.equal(r.status, 422); assert.match(r.text, /existe que dans le format natif/);
    assert.equal(one("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'export'").n, before);
    const all = await doExport(boss, { choice: "all", format: "wxr" }, A);
    const rep = JSON.parse(one("SELECT report FROM cms_tool_runs WHERE id = ?", all.id).report);
    assert.ok(rep.skippedFormat.includes("redirects") && rep.skippedFormat.includes("settings"), JSON.stringify(rep.skippedFormat));
  });
});

describe("médias : métadonnées ou archive ZIP", () => {
  test("sans l'option : références et métadonnées seulement, et c'est dit", async () => {
    const d = json(await doExport(boss, { choice: "all" }, A));
    assert.equal(d.media.files, false); assert.match(d.media.note, /ne sont pas inclus/);
    assert.ok(d.resources.media.some((m) => m.name === "alpha.png"));
  });
  test("avec l'option : archive ZIP valide (export + media/ + manifeste), fichiers identiques aux originaux, introuvables listés, aucun fichier d'un autre site", async () => {
    const e = await doExport(boss, { choice: "all", media: "1" }, A);
    assert.equal(e.run.status, "done", JSON.stringify(e.run));
    assert.match(e.file.headers.get("content-type"), /application\/zip/);
    assert.match(e.file.headers.get("content-disposition"), /\.zip"/);
    const entries = readZip(e.file.body);
    const names = entries.map((x) => x.name);
    assert.ok(names.includes("export.json") && names.includes("manifest.json"));
    const rel = ids.mA.path.replace(`/uploads/marketing/${org}/`, "");
    const original = fs.readFileSync(path.join(srv.dir, "uploads", "marketing", String(org), rel));
    const inZip = entries.find((x) => x.name === `media/${rel}`);
    assert.ok(inZip, `fichier média dans l'archive : ${names.join(", ")}`);
    assert.ok(inZip.data.equals(original), "contenu identique à l'original");
    assert.ok(!names.some((n) => n.includes(path.basename(ids.mB.path))), "le fichier du site B n'est jamais joint");
    const manifest = JSON.parse(entries.find((x) => x.name === "manifest.json").data.toString("utf8"));
    assert.ok(manifest.files.included.includes(`media/${rel}`));
    assert.ok(manifest.files.missing.includes(ids.missing), "le fichier disparu est listé, jamais prétendu inclus");
    assert.ok(!names.some((n) => n.includes("1700000000000-aaaaaaaaaaaa")));
    assert.match(manifest.note, /pas une sauvegarde du serveur/);
    assert.equal(JSON.parse(entries.find((x) => x.name === "export.json").data.toString("utf8")).media.files, true);
    assert.equal(JSON.parse(one("SELECT report FROM cms_tool_runs WHERE id = ?", e.id).report).archive.missingFiles, 1);
  });
  test("WXR + médias : l'archive contient export.xml ; articles + médias cités seulement", async () => {
    const e = await doExport(boss, { choice: "all", format: "wxr", media: "1" }, A);
    const entries = readZip(e.file.body);
    assert.ok(entries.some((x) => x.name === "export.xml"));
    const lint = xmllint(entries.find((x) => x.name === "export.xml").data.toString("utf8")); if (lint) assert.equal(lint.ok, true, lint.err);
  });
  test("le fichier produit est dans un dossier PRIVÉ : absent de uploads/, introuvable par une adresse publique, téléchargement réservé", async () => {
    const e = await doExport(boss, { choice: "all", media: "1" }, A);
    const rec = one("SELECT result FROM cms_tool_runs WHERE id = ?", e.id).result;
    assert.match(rec, /^@file:export-\d+-[0-9a-f]{16}\.zip$/);
    const name = rec.slice(6);
    assert.ok(fs.existsSync(path.join(srv.dir, "data", "exports", name)), "dans le dossier privé des exports");
    assert.ok(!fs.existsSync(path.join(srv.dir, "uploads", name)));
    for (const u of [`/uploads/${name}`, `/uploads/marketing/${name}`, `/exports/${name}`, `/data/exports/${name}`]) assert.notEqual((await anon.get(u)).status, 200, u);
    assert.notEqual((await anon.get(`${O}/exporter/${e.id}/fichier${qs(A)}`)).status, 200, "anonyme refusé");
    // nettoyage : un export expiré voit son fichier effacé du disque
    db.prepare("UPDATE cms_tool_runs SET expires_at = datetime('now', '-1 hour') WHERE id = ?").run(e.id);
    const clean = await boss.post(`${O}/contenu/action`, { key: "runs", confirm: "1" });
    assert.equal(clean.status, 302);
    assert.ok(!fs.existsSync(path.join(srv.dir, "data", "exports", name)), "fichier supprimé après expiration");
    assert.equal((await boss.get(`${O}/exporter/${e.id}/fichier${qs(A)}`)).status, 410);
  });
});

describe("permissions, isolation et requêtes invalides", () => {
  test("un accès limité au site A exporte ses pages, pas celles de B ; un lecteur n'exporte rien ; un anonyme est renvoyé", async () => {
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, userId(c), role); return c; };
    const adminA = await member(A, "admin"), viewerA = await member(A, "viewer");
    const ok = await doExport(adminA, { choice: "pages" }, A);
    assert.equal(ok.run.status, "done"); assert.ok(!ok.file.text.includes("Page secrète de Beta"));
    assert.equal((await adminA.post(`${O}/exporter${qs(B)}`, { choice: "pages", format: "json" })).status, 403, "le site B lui est fermé");
    assert.equal((await adminA.get(`${O}/exporter${qs(B)}`)).status, 403);
    const forged = await adminA.post(`${O}/exporter${qs(A)}`, { choice: "pages", format: "json", site: String(B) });
    assert.equal(forged.status, 302); const fid = Number(String(forged.location).match(/exporter\/(\d+)/)[1]);
    assert.equal(one("SELECT site_id FROM cms_tool_runs WHERE id = ?", fid).site_id, A, "le site vient de l'adresse vérifiée, jamais du champ envoyé");
    assert.notEqual((await viewerA.post(`${O}/exporter${qs(A)}`, { choice: "pages", format: "json" })).status, 302, "un lecteur n'exporte pas");
    assert.notEqual((await anon.post(`${O}/exporter`, { choice: "all" })).status, 200);
    // l'opération d'un site n'est pas lisible depuis un autre site (IDOR)
    const other = await member(B, "admin");
    assert.equal((await other.get(`${O}/exporter/${ok.id}/fichier${qs(B)}`)).status, 404);
  });
  test("requêtes invalides : format, sélection, type, catégorie, dates — messages clairs, jamais d'erreur serveur", async () => {
    for (const fields of [{ choice: "all", format: "csv" }, { choice: "other:inexistant" }, { choice: "articles", category: "abc" }, { choice: "articles", from: "pas-une-date" }, { choice: "pages", author_pages: "99999" }, { choice: "articles", status: "<script>" }, { choice: "../../etc/passwd" }]) {
      const r = await boss.post(`${O}/exporter${qs(A)}`, { format: "json", ...fields });
      assert.ok([200, 302, 422].includes(r.status), `${JSON.stringify(fields)} → ${r.status}`);
      if (r.status === 302) assert.doesNotMatch(String(r.location), /exporter\/\d+$/, `${JSON.stringify(fields)} ne doit pas lancer d'export`) ;
    }
  });
  test("aucun secret dans aucun format (contrôle sur tous les fichiers produits)", async () => {
    for (const fields of [{ choice: "all" }, { choice: "all", format: "wxr" }, { choice: "other:settings" }]) {
      const e = await doExport(boss, fields, A);
      if (e.run.status !== "done") continue;
      assert.doesNotMatch(e.file.text, /\$2[aby]\$\d{2}\$|sk_(live|test)_|BEGIN [A-Z ]*PRIVATE KEY|"password"|api_key|zoe@secret|iphash/i, JSON.stringify(fields));
    }
  });
});

describe("volume et performance", () => {
  test("1 500 articles : export complet par lots dans un délai raisonnable, nombre exact, mémoire contenue", async () => {
    const ins = db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, created_at, author_id) VALUES (?, ?, ?, 'html', 'published', 1, '2026-09-15 10:00:00', '2026-09-15 10:00:00', ?)");
    const own = db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('post', ?, ?, ?, '')");
    db.exec("BEGIN");
    for (let i = 0; i < 1500; i++) { const id = Number(ins.run(`volume-${i}`, `Volume ${i} éàü`, `<p>${"Lorem ipsum ".repeat(40)}</p>`, userId(alice)).lastInsertRowid); own.run(id, org, A); }
    db.exec("COMMIT");
    const t0 = Date.now();
    const e = await doExport(boss, { choice: "articles", from: "2026-09-10", to: "2026-09-30" }, A);
    assert.equal(e.run.status, "done", JSON.stringify(e.run));
    assert.equal(json(e).resources.articles.length, 1500, "nombre exact selon les filtres");
    assert.ok(Date.now() - t0 < 30000, `durée ${Date.now() - t0} ms`);
    const w = await doExport(boss, { choice: "articles", format: "wxr", from: "2026-09-10", to: "2026-09-30" }, A);
    assert.equal(w.run.status, "done"); const lint = xmllint(w.file.text); if (lint) assert.equal(lint.ok, true, lint.err);
    assert.equal((w.file.text.match(/<wp:post_type><!\[CDATA\[post\]\]>/g) || []).length, 1500);
  });
});
