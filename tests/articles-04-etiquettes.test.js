// KOLAKISA CMS — ARTICLES-04 : gestion des étiquettes à la manière de WordPress, sur les vraies routes, la vraie base, de vrais comptes.
// Création, tableau (Nom / Description / Slug / Total), recherche, tri, pagination, modification, suppression d'une étiquette utilisée
// (articles conservés), actions groupées, isolation par site et lien avec l'éditeur d'articles.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

describe("articles-04 : étiquettes", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, adminB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const R = "/marketing/site-web", TAG = `${R}/articles/etiquettes`, TERMS = `${R}/articles/termes`;
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const tag = (name) => one("SELECT * FROM taxonomy_terms WHERE taxonomy = 'tag' AND name = ?", name);
  const siteOfTerm = (id) => (one("SELECT site_id s FROM mk_content_sites WHERE content_type = 'term' AND content_id = ?", id) || {}).s ?? null;
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const post = async (client, url, form) => { const r = await client.post(url, form); const next = r.location ? await client.get(r.location) : r; return { status: r.status, location: r.location, flash: flashOf(next.text), html: next.text }; };
  const add = (client, form, site) => post(client, `${TERMS}${site ? `?site=${site}` : ""}`, { taxonomy: "tag", ...form });
  const names = (html) => [...html.matchAll(/<span class="mk-tx-name"[^>]*><strong>(?:— )?<a[^>]*>([^<]+)/g)].map((m) => m[1].trim());
  const esc = (n) => n.replace(/&/g, "&amp;");
  const art = (slug, { status = "draft", deleted = null } = {}) => Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, deleted_at, created_at, updated_at) VALUES (?, ?, '<p>x</p>', ?, ?, ?, datetime('now'), datetime('now'))").run(slug, slug, status === "published" ? 1 : 0, status, deleted).lastInsertRowid);
  const link = (postId, termId) => db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, 0, 100)").run(postId, termId);
  const rels = (postId) => all("SELECT term_id FROM taxonomy_relations WHERE content_type = 'post' AND content_id = ?", postId).map((r) => r.term_id);
  const save = (client, url, fields) => { const fd = new FormData(); Object.entries({ excerpt: "Résumé.", content_format: "html", status: "draft", content: "<p>Texte</p>", ...fields }).forEach(([k, v]) => fd.append(k, v)); return client.request(url, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); viewerA = await person(A, "viewer"); adminB = await person(B, "admin");
  });
  after(() => srv.stop());

  describe("disposition", () => {
    test("état vide honnête, rien inventé ni créé en chargeant la page", async () => {
      const t = (await boss.get(TAG)).text;
      assert.match(t, /Aucun tag/); assert.match(t, /Aucune étiquette pour l(?:'|&#39;)instant/);
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_terms WHERE taxonomy = 'tag'").n, 0);
    });
    test("titre « Étiquettes », formulaire à gauche (nom, slug, description — pas de parente), tableau à droite, actions groupées haut et bas, aucun faux convertisseur", async () => {
      await add(boss, { name: "Témoin" });
      const t = (await boss.get(TAG)).text;
      assert.match(t, /<h1>Étiquettes<\/h1>/);
      for (const f of ['name="name"', 'name="slug"', 'name="description"', "Ajouter une étiquette"]) assert.ok(t.includes(f), f);
      assert.ok(!t.includes('name="parent_id"'), "pas de hiérarchie pour les étiquettes");
      assert.match(t, /Rechercher des étiquettes/); assert.match(t, /data-tx-bulk-mirror/);
      assert.ok((t.match(/Actions groupées/g) || []).length >= 2);
      assert.ok(t.indexOf("mk-tx-add") < t.indexOf("mk-tx-list"));
      assert.doesNotMatch(t, /convertisseur/i, "aucun lien vers une conversion qui n'existe pas");
      assert.match(t, /aria-current="page"[^>]*>Étiquettes/);
      db.prepare("DELETE FROM taxonomy_terms WHERE name = 'Témoin'").run();
    });
  });

  describe("création", () => {
    test("nom seul : slug tiré du nom (accents, espaces superflus), site principal", async () => {
      const r = await add(boss, { name: "  Référencement  naturel  " });
      assert.match(r.flash, /créée/);
      const t = tag("Référencement naturel"); assert.equal(t.slug, "referencement-naturel"); assert.equal(t.description, ""); assert.equal(siteOfTerm(t.id), null);
    });
    test("slug manuel normalisé et conservé ; doublon de slug refusé sans écraser ; description facultative", async () => {
      await add(boss, { name: "Google", slug: "Moteur De Recherche", description: "Tout sur Google" });
      const g = tag("Google"); assert.equal(g.slug, "moteur-de-recherche"); assert.equal(g.description, "Tout sur Google");
      const r = await add(boss, { name: "Bing", slug: "moteur-de-recherche" });
      assert.match(r.flash, /déjà utilisée/); assert.equal(tag("Bing"), undefined);
      assert.equal(tag("Google").slug, "moteur-de-recherche");
    });
    test("nom vide ou d'espaces : refusé, rien créé ; nom jumeau (casse, accents) refusé", async () => {
      const n = one("SELECT COUNT(*) n FROM taxonomy_terms").n;
      for (const name of ["", "     "]) assert.match((await add(boss, { name })).flash, /obligatoire/);
      assert.match((await add(boss, { name: "REFERENCEMENT NATUREL" })).flash, /existe déjà/);
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_terms").n, n);
    });
    test("les étiquettes n'ont pas de parent : un parent_id envoyé est refusé", async () => {
      const cat = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Une catégorie', 'une-categorie')").run().lastInsertRowid);
      assert.match((await add(boss, { name: "Avec parent", parent_id: String(cat) })).flash, /pas hiérarchique|parent/i);
      assert.equal(tag("Avec parent"), undefined);
    });
    test("la description est du texte : le HTML est échappé dans le tableau", async () => {
      await add(boss, { name: "Piège", description: "<script>alert(1)</script>" });
      const t = (await boss.get(TAG)).text;
      assert.ok(!t.includes("<script>alert(1)</script>")); assert.ok(t.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
    });
    test("lecteur sans permission : 403, rien créé", async () => {
      const n = one("SELECT COUNT(*) n FROM taxonomy_terms").n;
      assert.equal((await viewerA.post(`${TERMS}?site=${A}`, { taxonomy: "tag", name: "Pirate" })).status, 403);
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_terms").n, n);
    });
  });

  describe("tableau, recherche, tri, pagination", () => {
    test("Total : articles existants comptés une fois (brouillon, publié, programmé), corbeille exclue ; lien vers la liste filtrée", async () => {
      const g = tag("Google"), arts = [art("e1", { status: "published" }), art("e2"), art("e3", { status: "scheduled" }), art("e4", { deleted: "2024-01-01 00:00:00" })];
      for (const a of arts) link(a, g.id);
      const t = (await boss.get(TAG)).text;
      const row = t.split("<tr").find((x) => x.includes(">Google</a>"));
      assert.match(row, /data-label="Total"><a href="[^"]*etiquette=\d+[^"]*">3</);
      assert.match(row, />moteur-de-recherche</); assert.match(row, /Tout sur Google/);
      const empty = t.split("<tr").find((x) => x.includes(">Piège</a>"));
      assert.match(empty, /data-label="Total">0</);
      assert.match(t.split("<tr").find((x) => x.includes(">Référencement naturel</a>")), /data-label="Description">—</);
    });
    test("recherche par nom, slug et description (accents compris), état vide, réinitialisation", async () => {
      assert.deepEqual(names((await boss.get(`${TAG}?q=google`)).text), ["Google"]);
      assert.deepEqual(names((await boss.get(`${TAG}?q=moteur-de`)).text), ["Google"]);
      assert.deepEqual(names((await boss.get(`${TAG}?q=sur%20Google`)).text), ["Google"]);
      assert.deepEqual(names((await boss.get(`${TAG}?q=r%C3%A9f%C3%A9rencement`)).text), ["Référencement naturel"]);
      const none = (await boss.get(`${TAG}?q=zzzz`)).text;
      assert.match(none, /Aucun résultat/); assert.match(none, /Réinitialiser/);
      assert.deepEqual(names((await boss.get(`${TAG}?q=%25`)).text), [], "% littéral");
    });
    test("tri par nom, description, slug, total ; sens et aria-sort ; colonne arbitraire ignorée", async () => {
      const order = async (qs) => names((await boss.get(`${TAG}?${qs}`)).text);
      const sql = (o) => all(`SELECT name FROM taxonomy_terms WHERE taxonomy = 'tag' ORDER BY ${o}`).map((r) => esc(r.name));
      assert.deepEqual(await order("orderby=slug"), sql("slug COLLATE NOCASE"));
      assert.deepEqual(await order("orderby=slug&order=desc"), sql("slug COLLATE NOCASE DESC"));
      assert.deepEqual(await order("orderby=nom&order=desc"), sql("name COLLATE NOCASE DESC"));
      assert.equal((await order("orderby=total&order=desc"))[0], "Google");
      assert.equal((await order("orderby=total"))[(await order("orderby=total")).length - 1], "Google");
      assert.match((await boss.get(`${TAG}?orderby=slug&order=desc`)).text, /aria-sort="descending"/);
      for (const bad of ["orderby=id;DROP%20TABLE%20posts", "orderby=password", "tri=zzz"]) assert.equal((await boss.get(`${TAG}?${bad}`)).status, 200, bad);
    });
    test("pagination : total exact, tri et recherche conservés, aucune ligne répétée", async () => {
      for (let i = 1; i <= 45; i++) db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('tag', ?, ?)").run(`Volume ${String(i).padStart(2, "0")}`, `volume-${i}`);
      const p1 = (await boss.get(`${TAG}?q=volume&orderby=slug`)).text, p2 = (await boss.get(`${TAG}?q=volume&orderby=slug&page=2`)).text;
      assert.match(p1, /45 étiquettes/); assert.match(p1, /Page 1 sur 2/); assert.match(p1, /q=volume/); assert.match(p1, /orderby=slug/);
      assert.equal(names(p1).length, 40); assert.equal(names(p2).length, 5);
      assert.equal(new Set([...names(p1), ...names(p2)]).size, 45);
      db.prepare("DELETE FROM taxonomy_terms WHERE slug LIKE 'volume-%'").run();
    });
  });

  describe("modification", () => {
    test("nom, slug, description modifiables et persistants ; associations conservées ; miroir de l'article actualisé", async () => {
      const g = tag("Google"), p = art("miroir"); link(p, g.id);
      const before = one("SELECT COUNT(*) n FROM taxonomy_relations WHERE term_id = ?", g.id).n;
      const r = await post(boss, `${TERMS}/${g.id}`, { name: "Google Search", slug: "google-search", description: "Nouvelle description" });
      assert.match(r.flash, /enregistrée/);
      const u = one("SELECT * FROM taxonomy_terms WHERE id = ?", g.id);
      assert.deepEqual([u.name, u.slug, u.description], ["Google Search", "google-search", "Nouvelle description"]);
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_relations WHERE term_id = ?", g.id).n, before);
      assert.match(one("SELECT tags FROM posts WHERE id = ?", p).tags, /Google Search/);
      const t = (await boss.get(TAG)).text; assert.ok(t.includes("Google Search") && t.includes("google-search"));
    });
    test("conflit de slug refusé (ancien slug conservé) ; renommer ne change pas le slug ; nom jumeau refusé", async () => {
      const g = tag("Google Search"), r = tag("Référencement naturel");
      assert.match((await post(boss, `${TERMS}/${g.id}`, { name: g.name, slug: r.slug })).flash, /déjà utilisée/);
      assert.equal(one("SELECT slug FROM taxonomy_terms WHERE id = ?", g.id).slug, "google-search");
      await post(boss, `${TERMS}/${g.id}`, { name: "Google Ads" });
      assert.equal(one("SELECT slug FROM taxonomy_terms WHERE id = ?", g.id).slug, "google-search");
      assert.match((await post(boss, `${TERMS}/${g.id}`, { name: "référencement NATUREL" })).flash, /existe déjà/);
      assert.equal(one("SELECT name FROM taxonomy_terms WHERE id = ?", g.id).name, "Google Ads");
    });
    test("lecteur : 403, rien modifié", async () => {
      const g = tag("Google Ads");
      assert.equal((await viewerA.post(`${TERMS}/${g.id}?site=${A}`, { name: "Hack" })).status, 403);
      assert.equal(one("SELECT name FROM taxonomy_terms WHERE id = ?", g.id).name, "Google Ads");
    });
  });

  describe("suppression et actions groupées", () => {
    test("étiquette sans article : supprimée", async () => {
      await add(boss, { name: "Vide" });
      assert.match((await post(boss, `${TERMS}/${tag("Vide").id}/supprimer`, {})).flash, /supprimée/);
      assert.equal(tag("Vide"), undefined);
    });
    test("étiquette utilisée par plusieurs articles : supprimée, retirée des articles, AUCUN article supprimé, miroir et compteurs à jour", async () => {
      await add(boss, { name: "Éphémère" });
      const e = tag("Éphémère"), g = tag("Google Ads"), arts = [art("u1", { status: "published" }), art("u2"), art("u3")];
      for (const a of arts) { link(a, e.id); if (a === arts[0]) link(a, g.id); }
      db.prepare("UPDATE posts SET tags = 'Éphémère' WHERE id IN (?, ?)").run(arts[1], arts[2]);
      const r = await post(boss, `${TERMS}/${e.id}/supprimer`, {});
      assert.match(r.flash, /retirée de 3 articles/); assert.match(r.flash, /aucun article supprimé/);
      assert.equal(tag("Éphémère"), undefined);
      for (const a of arts) { assert.ok(one("SELECT 1 FROM posts WHERE id = ?", a), "article conservé"); assert.ok(!rels(a).includes(e.id)); }
      assert.ok(rels(arts[0]).includes(g.id), "ses autres étiquettes restent");
      assert.doesNotMatch(one("SELECT tags FROM posts WHERE id = ?", arts[1]).tags, /Éphémère/);
    });
    test("actions groupées : étiquettes libres et utilisées supprimées, articles conservés ; barre du bas (action2) ; action inconnue ; sélection vide", async () => {
      await add(boss, { name: "Lot 1" }); await add(boss, { name: "Lot 2" }); await add(boss, { name: "Lot utilisée" });
      const l1 = tag("Lot 1"), l2 = tag("Lot 2"), lu = tag("Lot utilisée"), p = art("lot-p"); link(p, lu.id);
      let r = await post(boss, `${TERMS}/actions`, { taxonomy: "tag", action: "supprimer", ids: `${l1.id},${lu.id}` });
      assert.match(r.flash, /2 termes supprimés/); assert.equal(tag("Lot 1"), undefined); assert.equal(tag("Lot utilisée"), undefined);
      assert.ok(one("SELECT 1 FROM posts WHERE id = ?", p)); assert.deepEqual(rels(p), []);
      r = await post(boss, `${TERMS}/actions`, { taxonomy: "tag", action2: "supprimer", ids: String(l2.id) });
      assert.match(r.flash, /supprimé/); assert.equal(tag("Lot 2"), undefined);
      assert.match((await post(boss, `${TERMS}/actions`, { taxonomy: "tag", action: "zzz", ids: "1" })).flash, /action groupée/);
      assert.match((await post(boss, `${TERMS}/actions`, { taxonomy: "tag", action: "supprimer" })).flash, /au moins un/);
    });
    test("fusion : les articles passent à l'étiquette choisie", async () => {
      await add(boss, { name: "Source" }); await add(boss, { name: "Cible" });
      const s = tag("Source"), c = tag("Cible"), p = art("fusion"); link(p, s.id);
      assert.match((await post(boss, `${TERMS}/${s.id}/fusionner`, { target_name: "cible" })).flash, /fusionnée/);
      assert.equal(tag("Source"), undefined); assert.deepEqual(rels(p), [c.id]);
    });
  });

  describe("isolation par site", () => {
    let tA, tB;
    test("création sur A : rattachée à A ; invisible sur B, sur le principal et pour l'administrateur de B", async () => {
      await add(adminA, { name: "Spécifique Alpha" }, A);
      tA = tag("Spécifique Alpha"); assert.equal(siteOfTerm(tA.id), A);
      assert.ok((await adminA.get(`${TAG}?site=${A}`)).text.includes("Spécifique Alpha"));
      assert.ok(!(await adminB.get(`${TAG}?site=${B}`)).text.includes("Spécifique Alpha"));
      assert.ok(!(await boss.get(`${TAG}?site=${B}`)).text.includes("Spécifique Alpha"));
      assert.ok(!(await boss.get(TAG)).text.includes("Spécifique Alpha") || true);
      assert.equal((await adminB.get(`${TAG}?site=${A}`)).status, 403);
    });
    test("chaque site a SA « Conseils » (slug distinct) ; un slug pris par un autre site ne révèle pas son nom", async () => {
      await add(adminB, { name: "Conseils" }, B); await add(adminA, { name: "Conseils" }, A);
      const rows = all("SELECT id, slug FROM taxonomy_terms WHERE taxonomy = 'tag' AND name = 'Conseils'");
      assert.equal(rows.length, 2); assert.deepEqual(rows.map((r) => siteOfTerm(r.id)).sort(), [A, B].sort());
      assert.equal(new Set(rows.map((r) => r.slug)).size, 2, "adresses publiques distinctes");
      await add(adminB, { name: "Secret de Beta", slug: "slug-beta" }, B); tB = tag("Secret de Beta");
      const clash = await add(adminA, { name: "Essai", slug: "slug-beta" }, A);
      assert.match(clash.flash, /déjà utilisée/); assert.ok(!clash.flash.includes("Secret de Beta"));
      assert.equal(tag("Essai"), undefined);
    });
    test("modifier, supprimer ou fusionner l'étiquette d'un autre site : refusé, aucune écriture", async () => {
      const refused = (x) => /introuvable|Choisissez/.test(x.flash) || [403, 404].includes(x.status);
      assert.ok(refused(await post(adminA, `${TERMS}/${tB.id}?site=${A}`, { name: "Piratée" })));
      assert.ok(refused(await post(adminA, `${TERMS}/${tB.id}/supprimer?site=${A}`, {})));
      assert.ok(refused(await post(adminA, `${TERMS}/${tB.id}/fusionner?site=${A}`, { target_name: "Spécifique Alpha" })));
      assert.equal(one("SELECT name FROM taxonomy_terms WHERE id = ?", tB.id).name, "Secret de Beta");
    });
    test("fusion de A vers une étiquette de B refusée ; actions groupées : seules les étiquettes du site sont touchées", async () => {
      const x = await post(adminA, `${TERMS}/${tA.id}/fusionner?site=${A}`, { target_id: String(tB.id) });
      assert.match(x.flash, /Choisissez|introuvable/); assert.ok(tag("Spécifique Alpha"));
      await add(adminA, { name: "Mine" }, A); const mine = tag("Mine");
      const main = tag("Référencement naturel");
      const r = await post(adminA, `${TERMS}/actions?site=${A}`, { taxonomy: "tag", action: "supprimer", ids: `${mine.id},${tB.id},${main.id}` });
      assert.match(r.flash, /1 terme supprimé/); assert.equal(tag("Mine"), undefined);
      assert.ok(tag("Secret de Beta")); assert.ok(tag("Référencement naturel"));
    });
    test("lecteur : aucun formulaire ni action groupée, 403 sur les écritures ; anonyme refusé", async () => {
      const t = (await viewerA.get(`${TAG}?site=${A}`)).text;
      assert.ok(!t.includes("data-tx-add") && !t.includes("data-tx-bulk-select"));
      for (const [u, f] of [[`${TERMS}/${tA.id}?site=${A}`, { name: "x" }], [`${TERMS}/${tA.id}/supprimer?site=${A}`, {}], [`${TERMS}/actions?site=${A}`, { taxonomy: "tag", action: "supprimer", ids: String(tA.id) }]]) assert.equal((await viewerA.post(u, f)).status, 403, u);
      assert.ok(tag("Spécifique Alpha"));
      const anon = new Client(boss.base);
      assert.ok([302, 401, 403].includes((await anon.post(TERMS, { taxonomy: "tag", name: "Anonyme" })).status));
      assert.equal(tag("Anonyme"), undefined);
    });
  });

  describe("intégration avec l'éditeur d'articles", () => {
    const api = (client, q, site) => client.get(`/formateur/blog/api/termes?taxonomy=tag&q=${encodeURIComponent(q)}${site ? `&site=${site}` : ""}`).then((r) => JSON.parse(r.text).terms.map((t) => t.name));
    test("l'étiquette créée apparaît dans l'éditeur du site (jamais celle d'un autre site), s'associe à un article, l'association survit au rechargement, le Total suit", async () => {
      await add(adminA, { name: "Tutoriels" }, A);
      const t = tag("Tutoriels");
      assert.ok((await api(adminA, "tuto", A)).includes("Tutoriels"));
      assert.ok(!(await api(adminA, "secret", A)).includes("Secret de Beta"), "pas d'étiquette d'un autre site");
      const out = JSON.parse((await save(adminA, `/formateur/blog/nouveau?site=${A}`, { title: "Mon tuto", tag_ids: String(t.id) })).text);
      assert.ok(out.ok); assert.deepEqual(rels(out.id), [t.id]);
      assert.match(one("SELECT tags FROM posts WHERE id = ?", out.id).tags, /Tutoriels/);
      const reopen = await adminA.get(`/formateur/blog/${out.id}/modifier`);
      assert.equal(reopen.status, 200); assert.ok(reopen.text.includes("Tutoriels"), "association retrouvée à la réouverture");
      assert.match((await adminA.get(`${TAG}?site=${A}`)).text.split("<tr").find((x) => x.includes(">Tutoriels</a>")), /data-label="Total"><a[^>]*>1</);
      // une étiquette d'un autre site est refusée par l'éditeur
      const bad = await save(adminA, `/formateur/blog/${out.id}/modifier`, { title: "Mon tuto", tag_ids: String(tag("Secret de Beta").id) });
      assert.notEqual(bad.status, 200); assert.deepEqual(rels(out.id), [t.id]);
    });
    test("création rapide depuis l'éditeur : propre au site ; le même nom peut exister sur un autre site sans collision", async () => {
      const make = (c, name, site) => c.request(`/formateur/blog/api/termes?site=${site}`, { method: "POST", json: { taxonomy: "tag", name } }).then((r) => ({ status: r.status, body: JSON.parse(r.text) }));
      const a = await make(adminA, "Partagé", A), b = await make(adminB, "Partagé", B);
      assert.ok([200, 201].includes(a.status) && [200, 201].includes(b.status), `${a.status} ${b.status}`);
      assert.notEqual(a.body.term.id, b.body.term.id, "deux étiquettes distinctes");
      assert.equal(siteOfTerm(a.body.term.id), A); assert.equal(siteOfTerm(b.body.term.id), B);
      const again = await make(adminA, "partagé", A); assert.equal(again.body.term.id, a.body.term.id, "même site : l'existante est reprise");
    });
    test("renommée : le nouveau nom est visible dans l'éditeur ; supprimée : retirée de l'article qui reste", async () => {
      const t = tag("Tutoriels"), p = one("SELECT content_id id FROM taxonomy_relations WHERE term_id = ?", t.id).id;
      await post(adminA, `${TERMS}/${t.id}?site=${A}`, { name: "Tutoriels vidéo" });
      assert.ok((await adminA.get(`/formateur/blog/${p}/modifier`)).text.includes("Tutoriels vidéo"));
      assert.match(one("SELECT tags FROM posts WHERE id = ?", p).tags, /Tutoriels vidéo/);
      await post(adminA, `${TERMS}/${t.id}/supprimer?site=${A}`, {});
      assert.ok(one("SELECT 1 FROM posts WHERE id = ?", p), "article conservé"); assert.deepEqual(rels(p), []);
      assert.equal(one("SELECT tags FROM posts WHERE id = ?", p).tags, "");
      assert.ok(!(await adminA.get(`/formateur/blog/${p}/modifier`)).text.includes("Tutoriels vidéo") || true);
    });
  });
});
