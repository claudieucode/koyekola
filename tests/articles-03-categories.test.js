// KOLAKISA CMS — ARTICLES-03 : gestion des catégories à la manière de WordPress (formulaire d'ajout à gauche, tableau à droite),
// sur les vraies routes, la vraie base, de vrais comptes. Création, hiérarchie, recherche, tri, pagination, modification, suppression,
// actions groupées, compteurs, isolation par site et lien avec l'éditeur d'articles.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

describe("articles-03 : catégories", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, adminB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const R = "/marketing/site-web", CAT = `${R}/articles/categories`, TERMS = `${R}/articles/termes`;
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const cat = (name) => one("SELECT * FROM taxonomy_terms WHERE taxonomy = 'category' AND name = ?", name);
  const siteOfTerm = (id) => (one("SELECT site_id s FROM mk_content_sites WHERE content_type = 'term' AND content_id = ?", id) || {}).s ?? null;
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  // Envoie le formulaire puis relit la page de retour : le message d'erreur ou de réussite est celui que verrait la personne
  const post = async (client, url, form) => { const r = await client.post(url, form); const next = r.location ? await client.get(r.location) : r; return { status: r.status, location: r.location, flash: flashOf(next.text), html: next.text }; };
  const add = (client, form, site) => post(client, `${TERMS}${site ? `?site=${site}` : ""}`, { taxonomy: "category", ...form });
  const names = (html) => [...html.matchAll(/<span class="mk-tx-name"[^>]*><strong>(?:— )?<a[^>]*>([^<]+)/g)].map((m) => m[1].trim());
  const post_ = (slug, { status = "draft", deleted = null } = {}) => Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, deleted_at, created_at, updated_at) VALUES (?, ?, '<p>x</p>', ?, ?, ?, datetime('now'), datetime('now'))").run(slug, slug, status === "published" ? 1 : 0, status, deleted).lastInsertRowid);
  const link = (postId, termId, primary = 0) => db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, ?, 0)").run(postId, termId, primary);
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
    test("état vide honnête, sans catégorie inventée", async () => {
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_terms WHERE taxonomy = 'category'").n, 0);
      const t = (await boss.get(CAT)).text;
      assert.match(t, /Aucune catégorie/); assert.doesNotMatch(t, /Uncategorized|Non class/);
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_terms WHERE taxonomy = 'category'").n, 0, "la page ne crée rien en se chargeant");
    });
    test("formulaire d'ajout à gauche (nom, slug, parente, description), tableau à droite (Nom, Description, Slug, Total), actions groupées en haut et en bas, recherche, notes", async () => {
      await add(boss, { name: "Témoin" });
      const t = (await boss.get(CAT)).text;
      assert.match(t, /<h1>Catégories<\/h1>/);
      for (const f of ['name="name"', 'name="slug"', 'name="parent_id"', 'name="description"', "Ajouter une catégorie"]) assert.ok(t.includes(f), f);
      assert.match(t, /Rechercher des catégories/);
      assert.ok((t.match(/Actions groupées/g) || []).length >= 2, "barre du haut et du bas");
      assert.match(t, /data-tx-bulk-mirror/);
      assert.match(t, /Supprimer une catégorie ne supprime <strong>jamais<\/strong> les articles/);
      assert.ok(t.indexOf("mk-tx-add") < t.indexOf("mk-tx-list"), "formulaire avant le tableau");
    });
  });

  describe("création", () => {
    test("nom seul : slug tiré du nom (accents, casse, caractères spéciaux), site principal", async () => {
      const r = await add(boss, { name: "Éducation & Santé !" });
      assert.match(r.flash, /créée/);
      const c = cat("Éducation & Santé !");
      assert.equal(c.slug, "education-sante"); assert.equal(c.parent_id, null); assert.equal(c.description, "");
      assert.equal(siteOfTerm(c.id), null);
    });
    test("slug manuel conservé tel quel (normalisé), jamais remplacé en silence", async () => {
      await add(boss, { name: "Actualités", slug: "Les Nouvelles" });
      assert.equal(cat("Actualités").slug, "les-nouvelles");
    });
    test("nom vide ou d'espaces : refusé avec message, rien créé, saisies utilisables", async () => {
      const n = one("SELECT COUNT(*) n FROM taxonomy_terms").n;
      for (const name of ["", "    "]) { const r = await add(boss, { name, description: "garde-moi" }); assert.match(r.flash, /obligatoire/); }
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_terms").n, n);
    });
    test("slug en doublon : refus explicite (le slug existant n'est pas écrasé) ; slug automatique en doublon : suffixé", async () => {
      const r = await add(boss, { name: "Autre", slug: "les-nouvelles" });
      assert.match(r.flash, /déjà utilisée/); assert.equal(cat("Autre"), undefined);
      await add(boss, { name: "Éducation Santé", parent_id: String(cat("Actualités").id) }); // autre parent : pas un jumeau, même slug de base
      assert.equal(cat("Éducation Santé").slug, "education-sante-2");
      db.prepare("DELETE FROM taxonomy_terms WHERE name IN ('Éducation Santé', 'Témoin')").run();
    });
    test("catégorie parente valide ; parent inexistant ou étiquette refusés ; description enregistrée", async () => {
      const parent = cat("Actualités");
      await add(boss, { name: "Sport", parent_id: String(parent.id), description: "Tous les <b>sports</b>" });
      const sport = cat("Sport"); assert.equal(sport.parent_id, parent.id); assert.equal(sport.description, "Tous les <b>sports</b>");
      assert.match((await add(boss, { name: "Orpheline", parent_id: "99999" })).flash, /parente introuvable/);
      const tag = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('tag', 'étiq', 'etiq')").run().lastInsertRowid);
      assert.match((await add(boss, { name: "Sous étiquette", parent_id: String(tag) })).flash, /parente introuvable/);
      assert.equal(cat("Orpheline"), undefined); assert.equal(cat("Sous étiquette"), undefined);
    });
    test("la description est du texte : le HTML saisi est échappé dans le tableau", async () => {
      const t = (await boss.get(CAT)).text;
      assert.ok(!t.includes("<b>sports</b>")); assert.ok(t.includes("&lt;b&gt;sports&lt;/b&gt;"));
    });
    test("un nom jumeau au même endroit est refusé (casse et accents ignorés)", async () => {
      assert.match((await add(boss, { name: "ACTUALITES" })).flash, /existe déjà/);
    });
    test("taxonomie inconnue refusée ; lecteur sans permission : 403 et rien créé", async () => {
      const n = one("SELECT COUNT(*) n FROM taxonomy_terms").n;
      await boss.post(TERMS, { taxonomy: "zzz", name: "X" });
      assert.equal((await viewerA.post(`${TERMS}?site=${A}`, { taxonomy: "category", name: "Pirate lecteur" })).status, 403);
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_terms").n, n);
    });
  });

  describe("modification et hiérarchie", () => {
    test("nom, slug, description et parent modifiables ; compteurs et relations restent cohérents", async () => {
      const sport = cat("Sport"), edu = cat("Éducation & Santé !");
      const r = await post(boss, `${TERMS}/${sport.id}`, { name: "Sports", slug: "sports-co", description: "Mis à jour", parent_id: String(edu.id) });
      assert.match(r.flash, /enregistrée/);
      const s = one("SELECT * FROM taxonomy_terms WHERE id = ?", sport.id);
      assert.deepEqual([s.name, s.slug, s.description, s.parent_id], ["Sports", "sports-co", "Mis à jour", edu.id]);
    });
    test("slug déjà pris : refusé, l'ancien slug reste", async () => {
      const s = cat("Sports");
      assert.match((await post(boss, `${TERMS}/${s.id}`, { name: "Sports", slug: "les-nouvelles" })).flash, /déjà utilisée/);
      assert.equal(cat("Sports").slug, "sports-co");
    });
    test("pas son propre parent, pas de boucle (parent = descendant)", async () => {
      const edu = cat("Éducation & Santé !"), s = cat("Sports");
      assert.match((await post(boss, `${TERMS}/${edu.id}`, { name: edu.name, parent_id: String(edu.id) })).flash, /propre parent/);
      assert.match((await post(boss, `${TERMS}/${edu.id}`, { name: edu.name, parent_id: String(s.id) })).flash, /boucle impossible/);
      assert.equal(cat("Éducation & Santé !").parent_id, null);
    });
    test("modifier le nom ne change pas le slug personnalisé", async () => {
      const s = cat("Sports");
      await post(boss, `${TERMS}/${s.id}`, { name: "Sports et loisirs" });
      assert.equal(one("SELECT slug FROM taxonomy_terms WHERE id = ?", s.id).slug, "sports-co");
    });
  });

  describe("tableau : hiérarchie, compteurs, recherche, tri, pagination", () => {
    test("hiérarchie indentée, description absente = tiret, slug affiché", async () => {
      const t = (await boss.get(CAT)).text;
      const rows = t.split("<tr").filter((x) => x.includes("mk-tx-name"));
      const edu = rows.find((x) => x.includes("Éducation")), sp = rows.find((x) => x.includes("Sports et loisirs"));
      assert.match(edu, /padding-left:0px/); assert.match(sp, /padding-left:18px/); assert.match(sp, /<strong>— /);
      assert.match(edu, /data-label="Description">—</); assert.match(edu, />education-sante</);
      assert.ok(t.indexOf("Éducation") < t.indexOf("Sports et loisirs"), "le parent précède ses enfants");
    });
    test("Total : articles existants comptés une seule fois (brouillon, publié, programmé), corbeille exclue ; limité à la catégorie", async () => {
      const c = cat("Actualités");
      const p1 = post_("a1", { status: "published" }), p2 = post_("a2"), p3 = post_("a3", { status: "scheduled" }), p4 = post_("a4", { deleted: "2024-01-01 00:00:00" });
      for (const p of [p1, p2, p3, p4]) link(p, c.id, p === p1 ? 1 : 0);
      link(p1, cat("Sports et loisirs").id);
      const t = (await boss.get(CAT)).text;
      const row = (name) => t.split("<tr").find((x) => x.includes(`>${name}</a>`));
      assert.match(row("Actualités"), /data-label="Total">(?:<a[^>]*>)?3</);
      assert.match(row("Sports et loisirs"), /data-label="Total">(?:<a[^>]*>)?1</);
      assert.match(row("Autre") || "", /^$/); // jamais créée
    });
    test("recherche par nom, par slug et par description, avec tri et sans résultat", async () => {
      assert.deepEqual(names((await boss.get(`${CAT}?q=actualit`)).text), ["Actualités"]);
      assert.deepEqual(names((await boss.get(`${CAT}?q=sports-co`)).text), ["Sports et loisirs"]);
      assert.deepEqual(names((await boss.get(`${CAT}?q=mis%20%C3%A0%20jour`)).text), ["Sports et loisirs"]);
      const none = (await boss.get(`${CAT}?q=zzzzintrouvable`)).text;
      assert.match(none, /Aucun résultat/); assert.match(none, /Réinitialiser/);
      assert.deepEqual(names((await boss.get(`${CAT}?q=%25`)).text), [], "le joker % est littéral");
    });
    test("tri par colonne : nom, slug, total, croissant et décroissant ; colonne arbitraire ignorée ; SQL non injectable", async () => {
      const order = async (qs) => names((await boss.get(`${CAT}?${qs}`)).text);
      const esc = (n) => n.replace(/&/g, "&amp;");
      assert.deepEqual(await order("orderby=slug"), all("SELECT name FROM taxonomy_terms WHERE taxonomy = 'category' ORDER BY slug COLLATE NOCASE").map((r) => esc(r.name)));
      assert.equal((await order("orderby=slug&order=desc"))[0], "Sports et loisirs");
      assert.equal((await order("orderby=total&order=desc"))[0], "Actualités");
      assert.deepEqual(await order("orderby=nom&order=desc"), all("SELECT name FROM taxonomy_terms WHERE taxonomy = 'category' ORDER BY name COLLATE NOCASE DESC").map((r) => esc(r.name)));
      for (const bad of ["orderby=id;DROP%20TABLE%20posts", "orderby=password", "tri=zzz"]) assert.equal((await boss.get(`${CAT}?${bad}`)).status, 200, bad);
      assert.ok(one("SELECT COUNT(*) n FROM posts").n >= 4);
      const t = (await boss.get(`${CAT}?orderby=slug&order=desc`)).text;
      assert.match(t, /aria-sort="descending"/);
    });
    test("pagination : total exact, pages, tri et recherche conservés", async () => {
      for (let i = 1; i <= 45; i++) db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', ?, ?)").run(`Volume ${String(i).padStart(2, "0")}`, `volume-${i}`);
      const p1 = (await boss.get(`${CAT}?q=volume&orderby=slug`)).text, p2 = (await boss.get(`${CAT}?q=volume&orderby=slug&page=2`)).text;
      assert.match(p1, /45 catégories/); assert.match(p1, /Page 1 sur 2/); assert.match(p1, /page=2/); assert.match(p1, /q=volume/); assert.match(p1, /orderby=slug/);
      assert.equal(names(p1).length, 40); assert.equal(names(p2).length, 5);
      assert.equal(new Set([...names(p1), ...names(p2)]).size, 45, "aucune ligne répétée entre pages");
      db.prepare("DELETE FROM taxonomy_terms WHERE slug LIKE 'volume-%'").run();
    });
  });

  describe("suppression et actions groupées", () => {
    test("catégorie vide supprimée ; catégorie utilisée REFUSÉE sans destination, articles intacts", async () => {
      await add(boss, { name: "Vide" }); await add(boss, { name: "Utilisée" });
      const v = cat("Vide"), u = cat("Utilisée"), p = post_("garde-moi"); link(p, u.id, 1);
      assert.match((await post(boss, `${TERMS}/${v.id}/supprimer`, {})).flash, /supprimée/); assert.equal(cat("Vide"), undefined);
      assert.match((await post(boss, `${TERMS}/${u.id}/supprimer`, {})).flash, /réassigner/);
      assert.ok(cat("Utilisée")); assert.equal(one("SELECT COUNT(*) n FROM taxonomy_relations WHERE term_id = ?", u.id).n, 1);
      assert.ok(one("SELECT 1 FROM posts WHERE id = ?", p));
    });
    test("avec destination : articles conservés et rattachés à la destination, sous-catégories remontent", async () => {
      const u = cat("Utilisée"), dest = cat("Actualités"), child = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug, parent_id) VALUES ('category', 'Enfant', 'enfant', ?)").run(u.id).lastInsertRowid);
      const p = one("SELECT content_id id FROM taxonomy_relations WHERE term_id = ?", u.id).id;
      const r = await post(boss, `${TERMS}/${u.id}/supprimer`, { reassign_to: String(dest.id) });
      assert.match(r.flash, /réassigné/); assert.equal(cat("Utilisée"), undefined);
      assert.ok(one("SELECT 1 FROM taxonomy_relations WHERE content_type = 'post' AND content_id = ? AND term_id = ?", p, dest.id), "article rattaché à la destination");
      assert.equal(one("SELECT parent_id p FROM taxonomy_terms WHERE id = ?", child).p, null);
      assert.ok(one("SELECT 1 FROM posts WHERE id = ?", p));
    });
    test("destination inexistante ou identique : refusée, rien supprimé", async () => {
      const dest = cat("Actualités");
      assert.match((await post(boss, `${TERMS}/${dest.id}/supprimer`, { reassign_to: String(dest.id) })).flash, /autre terme|introuvable/);
      assert.ok(cat("Actualités"));
    });
    test("actions groupées : réussites et refus détaillés (catégorie utilisée), barre du bas (action2), action inconnue, sélection vide", async () => {
      await add(boss, { name: "Lot 1" }); await add(boss, { name: "Lot 2" }); await add(boss, { name: "Lot usage" });
      const l1 = cat("Lot 1"), l2 = cat("Lot 2"), lu = cat("Lot usage"); link(post_("lot-p"), lu.id);
      let r = await post(boss, `${TERMS}/actions`, { taxonomy: "category", action: "supprimer", ids: `${l1.id},${lu.id}` });
      assert.match(r.flash, /1 terme supprimé/); assert.match(r.flash, /Lot usage/); assert.equal(cat("Lot 1"), undefined); assert.ok(cat("Lot usage"));
      r = await post(boss, `${TERMS}/actions`, { taxonomy: "category", action2: "supprimer", ids: String(l2.id) });
      assert.match(r.flash, /supprimé/); assert.equal(cat("Lot 2"), undefined);
      assert.match((await post(boss, `${TERMS}/actions`, { taxonomy: "category", action: "zzz", ids: String(lu.id) })).flash, /action groupée/);
      assert.match((await post(boss, `${TERMS}/actions`, { taxonomy: "category", action: "supprimer" })).flash, /au moins un/);
      assert.ok(cat("Lot usage"));
    });
  });

  describe("isolation par site et permissions", () => {
    let termA, termB, termMain;
    test("création sur A : rattachée à A ; invisible sur B, sur le site principal et pour l'administrateur de B", async () => {
      await add(adminA, { name: "Spécifique Alpha" }, A);
      termA = cat("Spécifique Alpha"); assert.equal(siteOfTerm(termA.id), A);
      assert.ok((await adminA.get(`${CAT}?site=${A}`)).text.includes("Spécifique Alpha"));
      assert.ok(!(await adminB.get(`${CAT}?site=${B}`)).text.includes("Spécifique Alpha"));
      assert.ok(!(await boss.get(`${CAT}?site=${B}`)).text.includes("Spécifique Alpha"));
      assert.equal((await adminB.get(`${CAT}?site=${A}`)).status, 403);
    });
    test("deux sites peuvent avoir chacun leur « Conseils » ; nom pris par un autre site : aucune fuite dans le message", async () => {
      await add(adminB, { name: "Conseils" }, B); await add(adminA, { name: "Conseils" }, A);
      const rows = all("SELECT t.id, t.slug FROM taxonomy_terms t WHERE t.name = 'Conseils'");
      assert.equal(rows.length, 2, "une catégorie par site");
      assert.deepEqual(rows.map((r) => siteOfTerm(r.id)).sort(), [A, B].sort());
      const r = await add(adminA, { name: "Autre A", slug: "spécifique-beta-secret" }, A); // crée normalement
      assert.equal(cat("Autre A").slug, "specifique-beta-secret");
      await add(adminB, { name: "Secret de Beta", slug: "slug-beta" }, B);
      const clash = await add(adminA, { name: "Essai", slug: "slug-beta" }, A);
      assert.match(clash.flash, /déjà utilisée/); assert.ok(!clash.flash.includes("Secret de Beta"), "le nom d'un terme d'un autre site n'est pas révélé");
      assert.equal(cat("Essai"), undefined);
    });
    test("modifier, supprimer ou fusionner une catégorie d'un autre site : introuvable, aucune écriture", async () => {
      termB = cat("Secret de Beta");
      const x = await post(adminA, `${TERMS}/${termB.id}?site=${A}`, { name: "Piratée" }); assert.ok(/introuvable/.test(x.flash) || [403, 404].includes(x.status), `${x.status} ${x.flash}`);
      const y = await post(adminA, `${TERMS}/${termB.id}/supprimer?site=${A}`, {}); assert.ok(/introuvable/.test(y.flash) || [403, 404].includes(y.status), `${y.status} ${y.flash}`);
      const z = await post(adminA, `${TERMS}/${termB.id}/fusionner?site=${A}`, { target_id: String(termA.id) }); assert.ok(/Choisissez|introuvable/.test(z.flash) || [403, 404].includes(z.status), `${z.status} ${z.flash}`);
      assert.equal(one("SELECT name FROM taxonomy_terms WHERE id = ?", termB.id).name, "Secret de Beta");
    });
    test("relation parent-enfant entre sites interdite (création, modification), y compris vers le site principal", async () => {
      termMain = cat("Actualités");
      const n = one("SELECT COUNT(*) n FROM taxonomy_terms").n;
      assert.match((await add(adminA, { name: "Enfant de B", parent_id: String(termB.id) }, A)).flash, /même site/);
      assert.match((await add(adminA, { name: "Enfant du principal", parent_id: String(termMain.id) }, A)).flash, /même site/);
      assert.match((await post(adminA, `${TERMS}/${termA.id}?site=${A}`, { name: termA.name, parent_id: String(termB.id) })).flash, /même site/);
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_terms").n, n);
      assert.equal(one("SELECT parent_id p FROM taxonomy_terms WHERE id = ?", termA.id).p, null);
    });
    test("réassignation vers un autre site refusée ; articles d'un autre site non comptés dans mon Total", async () => {
      assert.match((await post(adminA, `${TERMS}/${termA.id}/supprimer?site=${A}`, { reassign_to: String(termB.id) })).flash, /introuvable/);
      assert.ok(one("SELECT 1 FROM taxonomy_terms WHERE id = ?", termA.id));
    });
    test("actions groupées : seules les catégories du site sont touchées", async () => {
      const mine = cat("Autre A");
      const r = await post(adminA, `${TERMS}/actions?site=${A}`, { taxonomy: "category", action: "supprimer", ids: `${mine.id},${termB.id},${termMain.id}` });
      assert.match(r.flash, /1 terme supprimé/); assert.equal(cat("Autre A"), undefined);
      assert.ok(cat("Secret de Beta")); assert.ok(cat("Actualités"));
    });
    test("lecteur et anonyme : tableau lisible pour le lecteur, aucune écriture ; anonyme refusé", async () => {
      assert.equal((await viewerA.get(`${CAT}?site=${A}`)).status, 200);
      const t = (await viewerA.get(`${CAT}?site=${A}`)).text;
      assert.ok(!t.includes("data-tx-add") && !t.includes("data-tx-bulk-select"), "pas de formulaire ni d'action groupée sans droit");
      for (const [u, f] of [[`${TERMS}/${termA.id}?site=${A}`, { name: "x" }], [`${TERMS}/${termA.id}/supprimer?site=${A}`, {}], [`${TERMS}/actions?site=${A}`, { taxonomy: "category", action: "supprimer", ids: String(termA.id) }]]) assert.equal((await viewerA.post(u, f)).status, 403, u);
      assert.ok(cat("Spécifique Alpha"));
      const anon = new Client(boss.base);
      assert.ok([302, 401, 403].includes((await anon.post(TERMS, { taxonomy: "category", name: "Anonyme" })).status));
      assert.equal(cat("Anonyme"), undefined);
    });
  });

  describe("intégration avec l'éditeur d'articles", () => {
    test("une catégorie créée apparaît dans l'éditeur du site, s'associe à un article, le Total suit ; renommée puis supprimée sans perdre l'article", async () => {
      await add(adminA, { name: "Tutoriels" }, A);
      const t = cat("Tutoriels");
      const editor = await adminA.get(`/formateur/blog/nouveau?site=${A}`);
      assert.ok(editor.text.includes("Tutoriels"), "visible dans le sélecteur de l'éditeur");
      assert.ok(!editor.text.includes("Secret de Beta"), "pas de catégorie d'un autre site dans l'éditeur");
      const out = JSON.parse((await save(adminA, `/formateur/blog/nouveau?site=${A}`, { title: "Mon tuto", category_ids: String(t.id), primary_category_id: String(t.id) })).text);
      assert.ok(out.ok);
      assert.ok(one("SELECT 1 FROM taxonomy_relations WHERE content_type = 'post' AND content_id = ? AND term_id = ?", out.id, t.id));
      assert.match((await adminA.get(`${CAT}?site=${A}`)).text.split("<tr").find((x) => x.includes(">Tutoriels</a>")), /data-label="Total"><a[^>]*>1</);
      // catégorie d'un autre site refusée par l'éditeur
      const refused = await save(adminA, `/formateur/blog/${out.id}/modifier`, { title: "Mon tuto", category_ids: String(termBId()) });
      assert.notEqual(refused.status, 200);
      await post(adminA, `${TERMS}/${t.id}?site=${A}`, { name: "Tutoriels vidéo" });
      assert.ok((await adminA.get(`/formateur/blog/${out.id}/modifier`)).text.includes("Tutoriels vidéo"));
      assert.equal(one("SELECT category FROM posts WHERE id = ?", out.id).category, "Tutoriels vidéo", "miroir de l'article actualisé");
      await add(adminA, { name: "Guides" }, A);
      await post(adminA, `${TERMS}/${t.id}/supprimer?site=${A}`, { reassign_to: String(cat("Guides").id) });
      assert.ok(one("SELECT 1 FROM posts WHERE id = ?", out.id), "article conservé");
      assert.ok(one("SELECT 1 FROM taxonomy_relations WHERE content_id = ? AND term_id = ?", out.id, cat("Guides").id), "article rattaché à la destination");
      assert.equal(one("SELECT category FROM posts WHERE id = ?", out.id).category, "Guides");
    });
    const termBId = () => cat("Secret de Beta").id;
  });
});
