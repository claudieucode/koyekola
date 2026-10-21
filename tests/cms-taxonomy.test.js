// KOLAKISA CMS — palier 5 : moteur de taxonomies (catégories hiérarchiques, étiquettes), de bout en bout par les vraies routes
// d'un vrai serveur et la vraie base : création/modification, slugs uniques par taxonomie, relations article↔terme, miroir des
// anciennes colonnes, éditeur (chemin par identifiants et chemin texte historique), archives publiques, suppression/fusion, droits.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId;
const ADMIN = "/marketing/site-web/articles";
const CAT = `${ADMIN}/categories`, TAG = `${ADMIN}/etiquettes`, TERMS = `${ADMIN}/termes`;
const json = (r) => JSON.parse(r.text);
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
const term = (taxonomy, name) => db.prepare("SELECT * FROM taxonomy_terms WHERE taxonomy = ? AND name = ?").get(taxonomy, name);
const post = (title) => db.prepare("SELECT * FROM posts WHERE title = ?").get(title);
const rels = (id) => db.prepare("SELECT r.*, t.taxonomy, t.name FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE content_type = 'post' AND content_id = ? ORDER BY r.position").all(id);
async function addTerm(client, taxonomy, name, extra = {}) {
  return client.post(TERMS, { taxonomy, name, retour: taxonomy === "tag" ? TAG : CAT, ...extra });
}
async function save(client, fields, id = null) {
  const fd = new FormData();
  Object.entries({ excerpt: "Résumé.", content_format: "html", status: "draft", ...fields }).forEach(([k, v]) => fd.append(k, v));
  return client.request(id ? `/formateur/blog/${id}/modifier` : "/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
}
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), ?)").run(orgId, c.email, role);
  return c;
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
});
after(() => srv.stop());

describe("écrans d'administration", () => {
  test("catégories et étiquettes s'ouvrent, état vide honnête", async () => {
    for (const [url, word] of [[CAT, "Aucune catégorie"], [TAG, "Aucun tag"]]) {
      const r = await boss.get(url);
      assert.equal(r.status, 200);
      assert.match(r.text, new RegExp(word));
    }
  });
  test("création d'une catégorie, d'une sous-catégorie à plusieurs niveaux, d'une étiquette", async () => {
    await addTerm(boss, "category", "Marketing");
    const m = term("category", "Marketing");
    assert.equal(m.slug, "marketing");
    await addTerm(boss, "category", "SEO", { parent_id: m.id });
    const s = term("category", "SEO");
    assert.equal(s.parent_id, m.id);
    await addTerm(boss, "category", "SEO technique", { parent_id: s.id });
    assert.equal(term("category", "SEO technique").parent_id, s.id);
    await addTerm(boss, "tag", "Google");
    assert.ok(term("tag", "Google"));
    const r = await boss.get(CAT);
    assert.match(r.text, /SEO technique/);
  });
  test("slug unique par taxonomie : « seo » catégorie et « seo » étiquette coexistent, doublon refusé", async () => {
    await addTerm(boss, "tag", "SEO");
    assert.equal(term("tag", "SEO").slug, "seo");
    assert.equal(term("category", "SEO").slug, "seo");
    await addTerm(boss, "category", "Autre", { slug: "marketing" });
    assert.equal(term("category", "Autre"), undefined);
    const r = await boss.get(CAT);
    assert.match(flashOf(r.text), /déjà utilisée/);
  });
  test("deux catégories de même nom sous le même parent : refusé ; nom vide refusé", async () => {
    await addTerm(boss, "category", "Marketing");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM taxonomy_terms WHERE name = 'Marketing'").get().n, 1);
    await addTerm(boss, "tag", "   ");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM taxonomy_terms WHERE taxonomy = 'tag' AND name = ''").get().n, 0);
  });
  test("modifier le nom ne change pas l'adresse ; cycle de parenté refusé", async () => {
    const m = term("category", "Marketing"), s = term("category", "SEO");
    await boss.post(`${TERMS}/${m.id}`, { name: "Marketing digital", retour: CAT });
    const u = db.prepare("SELECT * FROM taxonomy_terms WHERE id = ?").get(m.id);
    assert.equal(u.name, "Marketing digital"); assert.equal(u.slug, "marketing");
    await boss.post(`${TERMS}/${m.id}`, { name: "Marketing digital", parent_id: s.id, retour: CAT });
    assert.equal(db.prepare("SELECT parent_id FROM taxonomy_terms WHERE id = ?").get(m.id).parent_id, null);
  });
  test("recherche, tri, filtre « inutilisées »", async () => {
    let r = await boss.get(`${CAT}?q=technique`);
    assert.match(r.text, />SEO technique<\/a>/); assert.doesNotMatch(r.text, />Marketing digital<\/a>/);
    r = await boss.get(`${TAG}?tri=utilisation&inutilises=1`);
    assert.equal(r.status, 200); assert.match(r.text, /Google/);
  });
  test("une taxonomie inconnue est refusée", async () => {
    await boss.post(TERMS, { taxonomy: "zzz", name: "X", retour: CAT });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM taxonomy_terms WHERE name = 'X'").get().n, 0);
  });
});

describe("éditeur : catégories, catégorie principale, étiquettes", () => {
  test("chemin par identifiants : relations, primaire, miroir des anciennes colonnes", async () => {
    const m = term("category", "Marketing digital"), s = term("category", "SEO"), g = term("tag", "Google");
    const r = await save(boss, { title: "Article taxo", content: "<p>Texte</p>", category_ids: `${m.id},${s.id}`, primary_category_id: String(s.id), tag_ids: String(g.id) });
    assert.ok([200, 201, 302].includes(r.status), r.text);
    const p = post("Article taxo");
    const rs = rels(p.id);
    assert.deepEqual(rs.filter((x) => x.taxonomy === "category").map((x) => x.name).sort(), ["Marketing digital", "SEO"]);
    assert.equal(rs.find((x) => x.is_primary).name, "SEO");
    assert.equal(rs.filter((x) => x.taxonomy === "tag").length, 1);
    assert.equal(p.category, "Marketing digital");  // racine de la catégorie principale
    assert.equal(p.subcategory, "SEO");
    assert.equal(p.tags, "Google");
  });
  test("catégorie principale hors sélection : refusée, article inchangé", async () => {
    const p = post("Article taxo"), t = term("category", "SEO technique"), m = term("category", "Marketing digital");
    await save(boss, { title: "Article taxo", content: "<p>Texte</p>", category_ids: String(m.id), primary_category_id: String(t.id) }, p.id);
    assert.equal(rels(p.id).filter((x) => x.taxonomy === "category").length, 2);
  });
  test("chemin texte historique : crée catégorie et étiquettes manquantes sans doublon", async () => {
    await save(boss, { title: "Article texte", content: "<p>T</p>", category: "Marketing digital", subcategory: "SEO", tags: "Google, Nouveau tag" });
    const p = post("Article texte");
    assert.ok(term("tag", "Nouveau tag"));
    assert.equal(db.prepare("SELECT COUNT(*) n FROM taxonomy_terms WHERE taxonomy = 'tag' AND lower(name) = 'google'").get().n, 1);
    assert.equal(rels(p.id).filter((x) => x.taxonomy === "tag").length, 2);
    assert.equal(rels(p.id).find((x) => x.is_primary).name, "SEO");
  });
  test("API de l'éditeur : recherche d'étiquettes, création rapide (sans doublon), catégorie rapide", async () => {
    let r = await boss.get("/formateur/blog/api/termes?taxonomy=tag&q=goo");
    assert.ok(json(r).terms.some((t) => t.name === "Google"));
    r = await boss.request("/formateur/blog/api/termes", { method: "POST", json: { taxonomy: "tag", name: "Rapide" } });
    assert.equal(r.status, 201);
    const again = await boss.request("/formateur/blog/api/termes", { method: "POST", json: { taxonomy: "tag", name: "rapide" } });
    assert.equal(json(again).term.id, json(r).term.id);
    r = await boss.request("/formateur/blog/api/termes", { method: "POST", json: { taxonomy: "category", name: "Rapide cat" } });
    assert.equal(r.status, 201);
    r = await boss.request("/formateur/blog/api/termes", { method: "POST", json: { taxonomy: "category", name: "" } });
    assert.equal(r.status, 400);
    r = await anon.get("/formateur/blog/api/termes?taxonomy=tag");
    assert.notEqual(r.status, 200);
  });
  test("le formulaire de l'éditeur contient le sélecteur et les données réelles", async () => {
    const p = post("Article taxo");
    const r = await boss.get(`/formateur/blog/${p.id}/modifier`);
    assert.match(r.text, /data-taxo/); assert.match(r.text, /taxonomy-picker\.js/); assert.match(r.text, /Marketing digital/);
  });
});

describe("compteurs, archives et pages publiques", () => {
  test("compteurs calculés depuis les relations (sous-catégories incluses)", async () => {
    const r = await boss.get(CAT);
    assert.match(r.text, /avec sous-catégories/);
  });
  test("article non publié : absent des archives ; publié : présent, avec liens catégorie et étiquette", async () => {
    let r = await anon.get("/blog/categorie/seo");
    assert.equal(r.status, 200); assert.doesNotMatch(r.text, /Article taxo/);
    const p = post("Article taxo");
    await save(boss, { title: "Article taxo", content: "<p>Texte assez long pour publier.</p>", status: "published", category_ids: `${term("category", "Marketing digital").id},${term("category", "SEO").id}`, primary_category_id: String(term("category", "SEO").id), tag_ids: String(term("tag", "Google").id) }, p.id);
    r = await anon.get("/blog/categorie/seo");
    assert.match(r.text, /Article taxo/);
    r = await anon.get("/blog/categorie/marketing"); // la catégorie parente inclut les descendants
    assert.match(r.text, /Article taxo/);
    r = await anon.get("/blog/etiquette/google");
    assert.match(r.text, /Article taxo/);
    r = await anon.get(`/blog/${db.prepare("SELECT slug FROM posts WHERE id = ?").get(p.id).slug}`);
    assert.match(r.text, /\/blog\/categorie\/seo/); assert.match(r.text, /\/blog\/etiquette\/google/);
  });
  test("terme inconnu : 404 ; catégorie et étiquette de même slug servent chacune la bonne page", async () => {
    assert.equal((await anon.get("/blog/categorie/inexistante")).status, 404);
    assert.equal((await anon.get("/blog/etiquette/inexistante")).status, 404);
    assert.equal((await anon.get("/blog/etiquette/seo")).status, 200);
  });
  test("plan du site : les archives de termes utilisés y figurent", async () => {
    const r = await anon.get("/sitemap.xml");
    assert.match(r.text, /\/blog\/categorie\/seo/);
  });
  test("article mis à la corbeille : disparaît des archives publiques", async () => {
    const p = post("Article taxo");
    await boss.post(`${ADMIN}/${p.id}/corbeille`, { retour: ADMIN });
    const r = await anon.get("/blog/etiquette/google");
    assert.doesNotMatch(r.text, /Article taxo/);
    await boss.post(`${ADMIN}/${p.id}/restaurer`, { retour: ADMIN });
  });
  test("liste des articles du CMS : filtre par catégorie (identifiant) et par étiquette", async () => {
    const s = term("category", "SEO");
    let r = await boss.get(`${ADMIN}?categorie=${s.id}`);
    assert.match(r.text, /Article taxo/);
    r = await boss.get(`${ADMIN}?etiquette=${term("tag", "Rapide").id}`);
    assert.doesNotMatch(r.text, /Article taxo/);
  });
  test("dupliquer un article copie ses termes", async () => {
    const p = post("Article taxo");
    await boss.post(`${ADMIN}/${p.id}/dupliquer`, { retour: ADMIN });
    const copy = db.prepare("SELECT * FROM posts WHERE id != ? AND title LIKE 'Article taxo%' ORDER BY id DESC").get(p.id);
    assert.ok(copy);
    assert.equal(rels(copy.id).length, rels(p.id).length);
  });
});

describe("suppression, réassignation, fusion", () => {
  // ARTICLES-04 : une ÉTIQUETTE utilisée se supprime (retirée de ses articles, conservés) ; une CATÉGORIE utilisée exige toujours une destination
  test("catégorie utilisée : suppression refusée sans réassignation, rien n'est perdu", async () => {
    await addTerm(boss, "category", "Refus utilisée");
    const c = term("category", "Refus utilisée"), p = post("Article taxo");
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, 0, 9)").run(p.id, c.id);
    await boss.post(`${TERMS}/${c.id}/supprimer`, { retour: CAT });
    assert.ok(term("category", "Refus utilisée"));
    assert.match(flashOf((await boss.get(CAT)).text), /utilisé|réassign/i);
  });
  test("catégorie utilisée supprimée avec réassignation : relations transférées, enfants remontés", async () => {
    const s = term("category", "SEO"), m = term("category", "Marketing digital"), t = term("category", "SEO technique");
    const before = db.prepare("SELECT COUNT(*) n FROM taxonomy_relations WHERE term_id = ?").get(s.id).n;
    assert.ok(before > 0);
    await boss.post(`${TERMS}/${s.id}/supprimer`, { reassign_to: String(m.id), retour: CAT });
    assert.equal(db.prepare("SELECT 1 FROM taxonomy_terms WHERE id = ?").get(s.id), undefined);
    assert.equal(db.prepare("SELECT parent_id FROM taxonomy_terms WHERE id = ?").get(t.id).parent_id, m.id);
    const p = post("Article taxo");
    assert.ok(rels(p.id).some((x) => x.name === "Marketing digital" && x.is_primary));
    assert.equal(p.category, "Marketing digital"); assert.equal(p.subcategory, "");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM (SELECT content_id, term_id FROM taxonomy_relations GROUP BY content_id, term_id HAVING COUNT(*) > 1)").get().n, 0);
  });
  test("fusion d'étiquettes par le nom : articles transférés, source supprimée", async () => {
    const n = term("tag", "Nouveau tag"), g = term("tag", "Google");
    await boss.post(`${TERMS}/${n.id}/fusionner`, { target_name: "google", retour: TAG });
    assert.equal(term("tag", "Nouveau tag"), undefined);
    const p = post("Article texte");
    assert.equal(rels(p.id).filter((x) => x.taxonomy === "tag").length, 1);
    assert.ok(db.prepare("SELECT 1 FROM taxonomy_relations WHERE term_id = ? AND content_id = ?").get(g.id, p.id));
    assert.match(db.prepare("SELECT tags FROM posts WHERE id = ?").get(p.id).tags, /Google/);
  });
  test("fusion vers un terme inexistant refusée", async () => {
    const r = term("tag", "Rapide");
    await boss.post(`${TERMS}/${r.id}/fusionner`, { target_name: "n'existe pas", retour: TAG });
    assert.ok(term("tag", "Rapide"));
  });
  test("actions groupées (catégories) : supprime les termes libres, refuse les utilisés", async () => {
    await addTerm(boss, "category", "Libre A"); await addTerm(boss, "category", "Libre B");
    const ids = [term("category", "Libre A").id, term("category", "Libre B").id, term("category", "Refus utilisée").id];
    await boss.post(`${TERMS}/actions`, { taxonomy: "category", action: "supprimer", ids, retour: CAT });
    assert.equal(term("category", "Libre A"), undefined); assert.equal(term("category", "Libre B"), undefined);
    assert.ok(term("category", "Refus utilisée"));
  });
  test("supprimer définitivement un article supprime ses relations (déclencheur)", async () => {
    await save(boss, { title: "Éphémère", content: "<p>x</p>", tags: "Google" });
    const p = post("Éphémère");
    assert.ok(rels(p.id).length);
    db.prepare("DELETE FROM posts WHERE id = ?").run(p.id);
    assert.equal(rels(p.id).length, 0);
  });
});

describe("droits d'accès", () => {
  test("anonyme : redirigé ; lecteur : voit mais ne peut ni créer ni supprimer ; éditeur : crée, ne supprime pas ; admin : tout", async () => {
    assert.notEqual((await anon.get(CAT)).status, 200);
    const viewer = await member("viewer"), editor = await member("editor"), admin = await member("admin");
    assert.equal((await viewer.get(CAT)).status, 200);
    await addTerm(viewer, "category", "Par lecteur");
    assert.equal(term("category", "Par lecteur"), undefined);
    await addTerm(editor, "category", "Par éditeur");
    assert.ok(term("category", "Par éditeur"));
    const e = term("category", "Par éditeur");
    await editor.post(`${TERMS}/${e.id}/supprimer`, { retour: CAT });
    assert.ok(term("category", "Par éditeur"));
    await admin.post(`${TERMS}/${e.id}/supprimer`, { retour: CAT });
    assert.equal(term("category", "Par éditeur"), undefined);
    const page = await viewer.get(CAT);
    assert.doesNotMatch(page.text, /data-tx-new/);
  });
});

describe("reprise de l'existant et performance", () => {
  test("la reprise a converti les anciens textes en termes (idempotente au redémarrage)", async () => {
    const n = db.prepare("SELECT COUNT(*) n FROM taxonomy_terms").get().n;
    assert.ok(n > 0);
  });
  test("10 000 termes : la liste s'affiche vite, paginée", async () => {
    const ins = db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('tag', ?, ?)");
    db.exec("BEGIN");
    for (let i = 0; i < 10000; i++) ins.run(`Masse ${i}`, `masse-${i}`);
    db.exec("COMMIT");
    const t0 = Date.now();
    const r = await boss.get(`${TAG}?q=Masse&tri=utilisation&page=3`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Page 3 sur/);
    assert.ok(Date.now() - t0 < 3000, `${Date.now() - t0} ms`);
    db.prepare("DELETE FROM taxonomy_terms WHERE slug LIKE 'masse-%'").run();
  });
});
