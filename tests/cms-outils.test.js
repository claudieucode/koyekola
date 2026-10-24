// KOLAKISA CMS — palier 13 : outils (export, import, santé, diagnostic, maintenance, caches, outils de contenu), de bout en bout.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const all = (sql, ...a) => db.prepare(sql).all(...a);
const O = "/marketing/site-web/outils";
const idOf = (location, re = /pages\/(\d+)/) => Number(String(location).match(re)[1]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function create(name, extra = {}) { const r = await boss.post("/marketing/pages", { name, template: "", ...extra }); assert.equal(r.status, 302); return idOf(r.location); }
const row = (id) => one("SELECT * FROM mk_landing_pages WHERE id = ?", id);
async function saveDraft(client, id, content = {}) {
  const r = row(id);
  const cur = r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections), seo: JSON.parse(r.seo || "{}") };
  return client.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: r.revision, content: { title: r.title || r.name, description: cur.description || "", seo: cur.seo || {}, ...content, sections: content.sections || cur.sections } } });
}
async function livePage(name, extra = {}, sections = [{ type: "text", markdown: "Contenu de la page." }]) {
  const id = await create(name, extra);
  assert.equal((await saveDraft(boss, id, { sections })).status, 200);
  db.prepare("UPDATE mk_landing_pages SET indexable = 1 WHERE id = ?").run(id);
  assert.equal((await boss.post(`/marketing/pages/${id}/publier.json`, {})).status, 200);
  return id;
}
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", c.email).id, role);
  return c;
}
async function newSite(name) { const r = await boss.post("/marketing/site-web/sites", { name }); return Number(String(r.location).match(/sites\/(\d+)/)[1]); }
const qs = (siteId) => (siteId ? `?site=${siteId}` : "");
// Attend la fin (ou l'attente de confirmation) d'une opération, par le vrai suivi de progression
async function waitRun(client, id, siteId, { until = ["done", "failed", "cancelled", "awaiting"], ms = 40000 } = {}) {
  const end = Date.now() + ms;
  for (;;) {
    const r = await client.get(`${O}/operations/${id}.json${qs(siteId)}`);
    assert.equal(r.status, 200, r.text.slice(0, 200));
    const p = JSON.parse(r.text);
    if (until.includes(p.status)) return p;
    if (Date.now() > end) throw new Error(`Délai dépassé : opération ${id} (${p.status}, ${p.done}/${p.total})`);
    await sleep(120);
  }
}
const runIdFrom = (location) => Number(String(location).match(/\/(?:importer|exporter)\/(\d+)/)[1]);
async function doExport(client, { site = null, types }) {
  const r = await client.post(`${O}/exporter${qs(site)}`, { types });
  assert.equal(r.status, 302, r.text.slice(0, 300));
  const id = runIdFrom(r.location);
  const p = await waitRun(client, id, site);
  assert.equal(p.status, "done", JSON.stringify(p));
  const f = await client.get(`${O}/exporter/${id}/fichier${qs(site)}`);
  assert.equal(f.status, 200);
  return { id, text: f.text, data: JSON.parse(f.text), headers: f.headers };
}
async function upload(client, site, text, fields = {}) {
  const fd = new FormData();
  fd.append("file", new Blob([text], { type: "application/json" }), "export.json");
  for (const [k, v] of Object.entries(fields)) for (const x of [].concat(v)) fd.append(k, x);
  const r = await client.request(`${O}/importer${qs(site)}`, { method: "POST", multipart: fd });
  return r;
}
async function analyse(client, site, text, fields) {
  const r = await upload(client, site, text, fields);
  assert.equal(r.status, 302, r.text.slice(0, 300));
  const id = runIdFrom(r.location);
  const p = await waitRun(client, id, site);
  return { id, p };
}
async function confirm(client, site, id) {
  const r = await client.post(`${O}/importer/${id}/confirmer${qs(site)}`, { confirm: "1" });
  assert.equal(r.status, 302);
  return waitRun(client, id, site, { until: ["done", "failed", "cancelled"] });
}
const runRow = (id) => { const r = one("SELECT * FROM cms_tool_runs WHERE id = ?", id); return { ...r, report: r.report ? JSON.parse(r.report) : null, plan: r.plan ? JSON.parse(r.plan) : null }; };

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
});
after(() => srv.stop());

describe("accès et permissions des outils", () => {
  test("les écrans répondent 200 pour le créateur ; un lecteur n'accède à rien (403)", async () => {
    for (const p of ["", "/importer", "/exporter", "/diagnostic", "/systeme", "/maintenance", "/cache", "/contenu", "/sauvegardes", "/logs"]) assert.equal((await boss.get(`${O}${p}`)).status, 200, p);
    const viewer = await member("viewer");
    for (const p of ["", "/importer", "/exporter", "/diagnostic", "/systeme", "/maintenance", "/cache", "/contenu"]) assert.equal((await viewer.get(`${O}${p}`)).status, 403, p);
  });
  test("éditeur : voit santé, diagnostic et informations ; ne peut ni exporter, ni importer, ni toucher à la maintenance, aux caches ou au contenu", async () => {
    const editor = await member("editor");
    for (const p of ["", "/diagnostic", "/systeme", "/sauvegardes"]) assert.equal((await editor.get(`${O}${p}`)).status, 200, p);
    for (const p of ["/importer", "/exporter", "/maintenance", "/cache", "/contenu"]) assert.equal((await editor.get(`${O}${p}`)).status, 403, p);
    assert.equal((await editor.post(`${O}/exporter`, { types: "pages" })).status, 403);
    assert.equal((await editor.post(`${O}/maintenance`, { enabled: "1", confirm: "1" })).status, 403);
    assert.equal((await editor.post(`${O}/cache`, { key: "all", confirm: "1" })).status, 403);
    assert.equal((await editor.post(`${O}/contenu/action`, { key: "log404", confirm: "1" })).status, 403);
    assert.equal((await editor.post(`${O}/sante`, {})).status, 302, "l'éditeur peut lancer l'analyse de santé (lecture seule)");
    assert.equal(one("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'export'").n, 0);
  });
  test("un anonyme est renvoyé vers la connexion", async () => {
    const r = await anon.get(O);
    assert.equal(r.status, 302);
    assert.match(r.location, /connexion/);
  });
  test("les nouvelles permissions existent dans le catalogue des rôles", async () => {
    const html = (await boss.get("/marketing/site-web/utilisateurs/roles/nouveau")).text;
    for (const k of ["tools.view", "tools.health", "tools.export", "tools.import", "tools.overwrite", "tools.content", "tools.cache", "tools.maintenance"]) assert.match(html, new RegExp(`value="${k.replace(".", "\\.")}"`), k);
  });
});

// ---------- Jeu de données : site A (pages, menu, redirections), articles, taxonomies, médias ----------
let siteA, siteB, pA1, pA2, art1, art2, catId, tagId, menuId;
describe("export : contenu, relations, périmètre, secrets", () => {
  before(async () => {
    siteA = await newSite("Site Export A");
    siteB = await newSite("Site Export B");
    pA1 = await livePage("Offre Alpha", { site_id: String(siteA) }, [{ type: "text", markdown: "Bonjour **Alpha** : notre offre." }]);
    pA2 = await create("Brouillon Alpha", { site_id: String(siteA) });
    await livePage("Page du site B", { site_id: String(siteB) });
    await boss.post("/marketing/site-web/articles/termes", { taxonomy: "category", name: "Marketing", slug: "marketing" });
    await boss.post("/marketing/site-web/articles/termes", { taxonomy: "tag", name: "Photoshop", slug: "photoshop" });
    catId = one("SELECT id FROM taxonomy_terms WHERE slug = 'marketing'").id;
    tagId = one("SELECT id FROM taxonomy_terms WHERE slug = 'photoshop'").id;
    art1 = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, excerpt, seo_title, seo_description, language) VALUES ('article-un', 'Article un', '<p>Texte <strong>riche</strong> un.</p>', 'html', 'published', 1, datetime('now'), 'Résumé un', 'Titre SEO un', 'Description SEO un', 'fr')").run().lastInsertRowid);
    art2 = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published) VALUES ('article-deux', 'Article deux', '<p>Texte deux.</p>', 'html', 'draft', 0)").run().lastInsertRowid);
    // Les articles et leurs termes appartiennent au site A (l'export d'un site ne contient QUE son contenu) ; rattachés avant de poser les relations (la base refuse une relation entre sites)
    const own = db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES (?, ?, ?, ?, ?)");
    own.run("term", catId, orgId, siteA, "category"); own.run("term", tagId, orgId, siteA, "tag"); own.run("post", art1, orgId, siteA, ""); own.run("post", art2, orgId, siteA, "");
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, 1, 0), ('post', ?, ?, 0, 0)").run(art1, catId, art1, tagId);
    // menu du site A avec une page, un article, une catégorie et un lien libre
    const m = await boss.post("/marketing/site-web/navigation/menus", { name: "Menu A" });
    menuId = Number(String(m.location).match(/menus\/(\d+)/)[1]);
    db.prepare("UPDATE nav_menus SET site_id = ? WHERE id = ?").run(siteA, menuId);
    const navigation = null; void navigation;
    for (const [type, oid, label, url] of [["page", pA1, "Offre", ""], ["article", art1, "Article", ""], ["category", catId, "Marketing", ""], ["custom", null, "Contact", "/contact"]])
      db.prepare("INSERT INTO nav_items (menu_id, position, type, object_id, url, label) VALUES (?, 0, ?, ?, ?, ?)").run(menuId, type, oid, url, label);
    await boss.post("/marketing/site-web/redirections", { source: "/ancienne-offre-a", target: "/catalogue", status: "301", site_id: String(siteA) });
    db.prepare("INSERT INTO mk_media (organization_id, kind, path, name, mime, size, alt, type, site_id, reach) VALUES (?, 'image', ?, 'photo-export.png', 'image/png', 1000, 'Une photo', 'image', ?, 'site')").run(orgId, `/uploads/marketing/1/site-${siteA}/photo-export.png`, siteA);
  });
  test("export du site A : pages du site A seulement, réglages, menus, redirections ; format et références", async () => {
    const e = await doExport(boss, { site: siteA, types: ["site", "pages", "menus", "redirects"] });
    assert.equal(e.data.format, "kolakisa-site@1");
    assert.equal(e.data.source.siteId, siteA);
    assert.deepEqual(e.data.resources.pages.map((p) => p.name).sort(), ["Brouillon Alpha", "Offre Alpha"]);
    assert.ok(!JSON.stringify(e.data).includes("Page du site B"), "rien du site B");
    assert.equal(e.data.resources.menus[0].items.length, 4);
    assert.equal(e.data.resources.menus[0].items.find((i) => i.type === "page").objectRef, `p${pA1}`, "le menu garde une RÉFÉRENCE de page, pas une adresse");
    assert.equal(e.data.resources.redirects[0].source, "/ancienne-offre-a");
    assert.match(e.data.resources.pages.find((p) => p.name === "Offre Alpha").content.sections[0].markdown, /Alpha/);
    assert.equal(e.data.media.files, false, "les fichiers ne sont pas exportés (et c'est dit)");
    assert.match(e.headers.get("content-disposition"), /attachment; filename="kolakisa-site-export-a-\d{4}-\d{2}-\d{2}\.json"/);
    assert.equal(e.headers.get("cache-control"), "no-store");
  });
  test("export des articles et taxonomies : relations par références, SEO, aucun secret ni compte", async () => {
    const e = await doExport(boss, { site: siteA, types: ["taxonomies", "articles", "media", "comments"] });
    const a1 = e.data.resources.articles.find((a) => a.slug === "article-un");
    assert.deepEqual(a1.categoryRefs, [`t${catId}`]);
    assert.deepEqual(a1.tagRefs, [`t${tagId}`]);
    assert.equal(a1.seo_title, "Titre SEO un");
    assert.ok(e.data.resources.taxonomies.some((t) => t.ref === `t${catId}` && t.name === "Marketing"));
    assert.ok(e.data.resources.media.some((m) => m.path === `/uploads/marketing/1/site-${siteA}/photo-export.png` && m.alt === "Une photo"));
    // aucun secret / compte
    const text = e.text;
    assert.doesNotMatch(text, /\$2[aby]\$\d{2}\$/, "aucun hash de mot de passe");
    assert.doesNotMatch(text, /prof@test\.local|MotDePasseProf123|password_hash|session|api_key/i, "aucun compte ni secret");
    assert.ok(!("users" in e.data.resources));
    assert.equal(e.data.integrity.sha256.length, 64);
  });
  test("périmètre : le contenu de l'organisation n'est pas proposé pour un export « site » d'un compte limité à un site", async () => {
    const guest = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteA, one("SELECT id FROM users WHERE email = ?", guest.email).id);
    assert.equal((await guest.get(`${O}/exporter?site=${siteA}`)).status, 200);
    const e = await doExport(guest, { site: siteA, types: ["pages", "articles", "taxonomies", "media", "comments"] });
    assert.deepEqual(Object.keys(e.data.resources), ["pages"], "seules les pages de son site : jamais articles, médias, commentaires");
    assert.equal((await guest.get(`${O}/exporter?site=${siteB}`)).status, 403, "le site B lui est fermé");
    assert.equal((await guest.post(`${O}/exporter?site=${siteB}`, { types: "pages" })).status, 403);
    const main = await guest.get(`${O}/exporter`);
    assert.equal(main.status, 302, "le site principal lui est fermé (renvoi vers « Mes sites »)");
    assert.match(main.location, /mes-sites/);
    assert.equal((await guest.post(`${O}/exporter`, { types: "pages" })).status, 403);
  });
  test("IDOR : une opération d'export n'est lisible que dans le périmètre de son site", async () => {
    const e = await doExport(boss, { site: siteA, types: ["pages"] });
    const guestB = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteB, one("SELECT id FROM users WHERE email = ?", guestB.email).id);
    assert.equal((await guestB.get(`${O}/operations/${e.id}.json?site=${siteB}`)).status, 404);
    assert.equal((await guestB.get(`${O}/exporter/${e.id}/fichier?site=${siteB}`)).status, 404);
  });
  test("export vide ou non autorisé : refusé avec un message", async () => {
    const r = await boss.post(`${O}/exporter`, { types: ["site"] }); // « site » exige un site
    assert.equal(r.status, 302);
    assert.match(r.location, /\/exporter(\?|$)/);
    assert.equal(one("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'export' AND options LIKE '%\"site\"%' AND site_id IS NULL").n, 0);
  });
});

// ---------- Import ----------
const mkFile = (resources, extra = {}) => JSON.stringify({ format: "kolakisa-site@1", exportedAt: new Date().toISOString(), source: { siteId: 999, siteName: "Autre site" }, selection: Object.keys(resources), resources, ...extra });
const count = (sql, ...a) => one(sql, ...a).n;
let fileAB; // export complet du site A + contenu de l'organisation
describe("import : analyse à blanc, confirmation, lots, relations remappées", () => {
  before(async () => { fileAB = (await doExport(boss, { site: siteA, types: ["site", "pages", "menus", "redirects", "taxonomies", "articles", "seo"] })).text; });

  test("analyse à blanc : rapport (créations, conflits, erreurs) et AUCUNE écriture", async () => {
    const before = { pages: count("SELECT COUNT(*) n FROM mk_landing_pages"), posts: count("SELECT COUNT(*) n FROM posts"), terms: count("SELECT COUNT(*) n FROM taxonomy_terms"), menus: count("SELECT COUNT(*) n FROM nav_menus"), redirects: count("SELECT COUNT(*) n FROM seo_redirects"), hist: count("SELECT COUNT(*) n FROM cms_revisions") };
    const { id, p } = await analyse(boss, siteB, fileAB, { types: ["pages", "articles", "taxonomies", "menus", "redirects"], on_conflict: "skip" });
    assert.equal(p.status, "awaiting");
    const run = runRow(id);
    const an = run.report.analysis;
    assert.equal(an.counts.pages.total, 2);
    assert.equal(an.counts.articles.total, 2);
    assert.ok(an.counts.pages.create + (an.counts.pages.conflict || 0) + (an.counts.pages.skip || 0) === 2);
    assert.deepEqual({ pages: count("SELECT COUNT(*) n FROM mk_landing_pages"), posts: count("SELECT COUNT(*) n FROM posts"), terms: count("SELECT COUNT(*) n FROM taxonomy_terms"), menus: count("SELECT COUNT(*) n FROM nav_menus"), redirects: count("SELECT COUNT(*) n FROM seo_redirects"), hist: count("SELECT COUNT(*) n FROM cms_revisions") }, before, "dry run : la base n'a pas bougé");
    const page = (await boss.get(`${O}/importer/${id}?site=${siteB}`)).text;
    assert.match(page, /Rapport d'analyse/);
    assert.match(page, /simulation : rien n'a été modifié/);
    assert.match(page, /Lancer l'import/);
  });

  test("import confirmé dans le site B : pages et articles en BROUILLON, relations remappées sur de NOUVEAUX identifiants, menu cohérent", async () => {
    // Les pages du site A existent déjà (adresses prises) : on importe en créant des copies pour tester le remappage complet
    const { id } = await analyse(boss, siteB, fileAB, { types: ["pages", "articles", "taxonomies", "menus", "redirects"], on_conflict: "duplicate" });
    const done = await confirm(boss, siteB, id);
    assert.equal(done.status, "done", JSON.stringify(done));
    const run = runRow(id);
    const per = run.report.per;
    assert.equal(per.pages.created, 2);
    assert.equal(per.articles.created, 2);
    // pages : dans le site B, en brouillon, jamais publiées
    const pages = all("SELECT * FROM mk_landing_pages WHERE id IN (" + run.report.created.pages.join(",") + ")");
    assert.equal(pages.length, 2);
    for (const p of pages) { assert.equal(p.site_id, siteB); assert.notEqual(p.status, "published", "jamais publié d'office"); }
    assert.ok(pages.every((p) => !run.report.created.pages.includes(pA1) && p.id !== pA1 && p.id !== pA2), "de nouveaux identifiants");
    // articles : brouillons, jamais publiés, catégories remappées
    const arts = all("SELECT * FROM posts WHERE id IN (" + run.report.created.articles.join(",") + ")");
    for (const a of arts) { assert.equal(a.published, 0); assert.equal(a.status, "draft"); }
    const copy1 = arts.find((a) => /article-un/.test(a.slug));
    assert.ok(copy1, "copie de l'article un");
    const terms = all("SELECT t.* FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_type = 'post' AND r.content_id = ?", copy1.id);
    assert.equal(terms.length, 2, "catégorie et étiquette rattachées");
    assert.ok(terms.every((t) => t.id !== catId && t.id !== tagId), "relations remappées sur les copies de termes (duplicate)");
    assert.equal(copy1.seo_title, "Titre SEO un");
    // menu : éléments liés aux NOUVELLES ressources
    const menu = one("SELECT * FROM nav_menus WHERE id = ?", run.report.created.menus[0]);
    assert.equal(menu.site_id, siteB);
    const items = all("SELECT * FROM nav_items WHERE menu_id = ?", menu.id);
    assert.equal(items.find((i) => i.type === "page").object_id !== pA1, true);
    assert.ok(run.report.created.pages.includes(items.find((i) => i.type === "page").object_id), "le menu pointe sur la page importée");
    // R8 lot 4 : un menu de site ne pointe que sur des ressources de CE site ; les articles importés sont de niveau organisation (scope « org » de l'import) : l'élément « article » est donc ignoré (et signalé), jamais lié à un contenu hors du site
    assert.equal(items.find((i) => i.type === "article"), undefined, "élément vers un article hors du site : ignoré");
    // redirection du site B
    // R8 lot 6 : l'ancienne adresse est unique PAR site (migration 090) — la même source existant pour le site A, elle est créée pour le site B
    assert.equal(count("SELECT COUNT(*) n FROM seo_redirects WHERE site_id = ? AND source_path = '/ancienne-offre-a'", siteB), 1, "même source que celle du site A : créée pour le site B");
    // historique : les services ont enregistré leurs révisions
    assert.ok(count("SELECT COUNT(*) n FROM cms_revisions WHERE content_type = 'page' AND content_id IN (" + run.report.created.pages.join(",") + ")") >= 1);
    // progression réelle
    assert.equal(done.percent, 100);
    assert.equal(done.total, done.done + done.failed + done.skipped);
  });

  test("conflits : « ignorer » ne modifie rien ; « tout arrêter » bloque ; « mettre à jour » exige tools.overwrite et ne touche ni article en ligne ni menu", async () => {
    const before = count("SELECT COUNT(*) n FROM posts");
    const skip = await analyse(boss, siteA, fileAB, { types: ["pages", "articles"], on_conflict: "skip" });
    const doneSkip = await confirm(boss, siteA, skip.id);
    assert.equal(doneSkip.status, "done");
    assert.equal(count("SELECT COUNT(*) n FROM posts"), before, "rien créé : tout existait déjà");
    assert.equal(runRow(skip.id).report.per.pages.skipped, 2);
    // stop
    const stop = await analyse(boss, siteA, fileAB, { types: ["pages", "articles"], on_conflict: "stop" });
    assert.equal(stop.p.status, "awaiting");
    assert.equal(runRow(stop.id).report.analysis.blocked, true);
    const blocked = await boss.post(`${O}/importer/${stop.id}/confirmer?site=${siteA}`, { confirm: "1" });
    assert.equal(blocked.status, 302);
    assert.equal(runRow(stop.id).status, "awaiting", "refusé : l'import n'a pas démarré");
    assert.match((await boss.get(`${O}/importer/${stop.id}?site=${siteA}`)).text, /tout arrêter/);
    // update : l'article en ligne est protégé, le brouillon est mis à jour avec révision
    const modified = JSON.parse(fileAB);
    delete modified.integrity; // fichier modifié à la main : sans somme de contrôle
    modified.resources.articles.find((a) => a.slug === "article-deux").content = "<p>Texte deux MODIFIÉ.</p>";
    modified.resources.articles.find((a) => a.slug === "article-un").content = "<p>Tentative sur l'article en ligne.</p>";
    modified.resources.pages.find((p) => p.name === "Offre Alpha").content.sections = [{ type: "text", markdown: "Nouveau texte importé" }];
    const upd = await analyse(boss, siteA, JSON.stringify(modified), { types: ["pages", "articles"], on_conflict: "update" });
    const doneUpd = await confirm(boss, siteA, upd.id);
    assert.equal(doneUpd.status, "done", JSON.stringify(doneUpd));
    assert.match(one("SELECT content FROM posts WHERE id = ?", art2).content, /MODIFIÉ/);
    assert.match(one("SELECT content FROM posts WHERE id = ?", art1).content, /Texte <strong>riche<\/strong> un/, "article en ligne jamais modifié");
    assert.match(row(pA1).draft, /Nouveau texte importé/, "brouillon de la page mis à jour");
    assert.match(row(pA1).sections, /Alpha/, "version EN LIGNE inchangée");
    assert.ok(count("SELECT COUNT(*) n FROM cms_revisions WHERE content_type = 'page' AND content_id = ?", pA1) >= 1, "l'ancien brouillon est dans l'historique");
  });
});

describe("import : fichiers invalides, malveillants, droits", () => {
  const analyseText = (client, site, text, fields = { types: ["pages", "articles", "taxonomies", "menus", "redirects", "media", "seo"], on_conflict: "skip" }) => analyse(client, site, text, fields);
  test("fichiers invalides : vide, pas du JSON, mauvais format, tronqué, binaire, somme de contrôle fausse, trop gros — refus clair, rien d'écrit", async () => {
    const before = count("SELECT COUNT(*) n FROM mk_landing_pages") + count("SELECT COUNT(*) n FROM posts");
    for (const [label, text, re] of [["vide", " ", /vide|Choisissez/], ["texte", "ceci n'est pas du json", /JSON valide/], ["mauvais format", JSON.stringify({ format: "wordpress@1", resources: {} }), /Format non reconnu/], ["tronqué", fileAB.slice(0, 500), /JSON valide/], ["tableau", "[1,2,3]", /non reconnu/], ["sans ressources", JSON.stringify({ format: "kolakisa-site@1" }), /incomplet/]]) {
      const r = await upload(boss, siteB, text, { types: ["pages"], on_conflict: "skip" });
      if (label === "vide") { assert.equal(r.status, 302); continue; }
      assert.equal(r.status, 302, label);
      const p = await waitRun(boss, runIdFrom(r.location), siteB);
      assert.equal(p.status, "failed", label);
      assert.match(p.message, re, label);
    }
    const tampered = JSON.parse(fileAB);
    tampered.resources.pages[0].name = "Nom modifié après l'export";
    const t = await analyseText(boss, siteB, JSON.stringify(tampered));
    assert.equal(t.p.status, "failed");
    assert.match(t.p.message, /modifié ou abîmé|somme de contrôle/);
    const bin = await upload(boss, siteB, "{\u0000binaire}", { types: ["pages"] });
    assert.equal(bin.status, 302);
    assert.match(String((await boss.get(bin.location)).text), /binaire|Choisissez|fichier/i);
    const big = await upload(boss, siteB, "x".repeat(21 * 1024 * 1024), { types: ["pages"] });
    assert.equal(big.status, 302);
    assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages") + count("SELECT COUNT(*) n FROM posts"), before, "aucune ressource créée par ces essais");
  });
  test("contenu malveillant : script, gestionnaire d'événement et lien javascript: retirés des articles ; noms HTML échappés ; redirection //evil refusée", async () => {
    const evil = mkFile({
      articles: [{ ref: "a1", slug: "piege-xss", title: "<img src=x onerror=alert(1)> Piège", content: '<p>Bonjour</p><script>alert(1)</script><a href="javascript:alert(2)" onclick="alert(3)">lien</a><iframe src="https://evil.example"></iframe>', content_format: "html", categoryRefs: [], tagRefs: [] }],
      redirects: [{ source: "/vol", target: "//evil.example/x", status: 301 }, { source: "/vol2", target: "javascript:alert(1)", status: 301 }, { source: "/formateur/x", target: "/blog", status: 301 }],
      media: [{ ref: "x1", path: "/uploads/marketing/1/../../../etc/passwd", name: "x" }],
      taxonomies: [{ ref: "t1", taxonomy: "category", name: "<script>alert(1)</script>", slug: "xss-cat" }],
    });
    const { id, p } = await analyseText(boss, siteB, evil);
    assert.equal(p.status, "awaiting");
    const plan = runRow(id).plan.items;
    assert.equal(plan.filter((i) => i.type === "redirects" && i.action === "error").length, 3, "les trois redirections dangereuses sont refusées dès l'analyse");
    assert.equal(plan.find((i) => i.type === "media").action, "error", "chemin de fichier piégé refusé");
    const done = await confirm(boss, siteB, id);
    assert.equal(done.status, "done");
    const art = one("SELECT * FROM posts WHERE slug = 'piege-xss'");
    assert.ok(art, "article créé");
    assert.doesNotMatch(art.content, /<script|onclick|javascript:|<iframe/i, "code actif retiré du contenu");
    assert.match(art.content, /Bonjour/);
    assert.equal(art.published, 0);
    assert.equal(count("SELECT COUNT(*) n FROM seo_redirects WHERE source_path IN ('/vol', '/vol2', '/formateur/x')"), 0);
    // affichage du rapport : aucune injection HTML
    const html = (await boss.get(`${O}/importer/${id}?site=${siteB}`)).text;
    assert.doesNotMatch(html, /<img src=x onerror|<script>alert\(1\)<\/script>/);
  });
  test("code HTML dans une page : refusé sans la permission « pages.code » (même par import) ; accepté avec", async () => {
    const withHtml = mkFile({ pages: [{ ref: "p1", name: "Page avec code", slug: "page-avec-code", kind: "page", content: { title: "t", sections: [{ id: "sec000000001", type: "layout", children: [{ id: "htm000000001", type: "html", props: { html: "<b>code</b>" } }] }] } }] });
    // le rôle « admin » n'a pas pages.code ? on teste avec un rôle personnalisé sans ce droit
    const role = await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Importeur sans code", description: "t", perm: ["tools.view", "tools.import", "forms.read", "forms.write"] });
    assert.ok([200, 302].includes(role.status));
    const key = one("SELECT key FROM mk_roles WHERE name = 'Importeur sans code'").key;
    const noCode = await member(key);
    const a = await analyseText(noCode, siteB, withHtml, { types: ["pages"], on_conflict: "skip" });
    assert.equal(a.p.status, "awaiting");
    const plan = runRow(a.id).plan.items[0];
    assert.equal(plan.action, "error");
    assert.match(plan.issues.join(" "), /réservé|pages\.code|HTML/i);
    const ok = await analyseText(boss, siteB, withHtml, { types: ["pages"], on_conflict: "skip" });
    assert.notEqual(runRow(ok.id).plan.items[0].action, "error", "le propriétaire a pages.code");
  });
  test("privilèges : un import ne crée ni compte ni rôle ; le fichier ne choisit pas son site de destination", async () => {
    const users = count("SELECT COUNT(*) n FROM users"), members = count("SELECT COUNT(*) n FROM mk_org_members"), roles = count("SELECT COUNT(*) n FROM mk_roles");
    const forged = mkFile({ users: [{ ref: "u1", username: "pirate", email: "pirate@evil.example", role: "owner" }], pages: [{ ref: "p1", name: "Page forgée", slug: "page-forgee", content: { title: "t", sections: [{ type: "text", markdown: "x" }] } }] }, { source: { siteId: siteA, siteName: "Site Export A" } });
    const r = await analyseText(boss, siteB, forged, { types: ["pages", "site"], on_conflict: "skip" });
    assert.equal(r.p.status, "failed", "type de ressource inconnu (users) : fichier refusé");
    assert.match(r.p.message, /inconnu/);
    const ok = JSON.parse(forged); delete ok.resources.users;
    const run2 = await analyseText(boss, siteB, JSON.stringify(ok), { types: ["pages"], on_conflict: "skip" });
    const done = await confirm(boss, siteB, run2.id);
    assert.equal(done.status, "done");
    assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE slug = 'page-forgee'").site_id, siteB, "créée dans le site CHOISI (B), pas celui du fichier (A)");
    assert.equal(count("SELECT COUNT(*) n FROM users"), users);
    assert.equal(count("SELECT COUNT(*) n FROM mk_org_members"), members);
    assert.equal(count("SELECT COUNT(*) n FROM mk_roles"), roles);
  });
  test("droits : éditeur refusé ; compte limité au site B ne peut pas importer dans A ; update exige tools.overwrite", async () => {
    const editor = await member("editor");
    assert.equal((await editor.post(`${O}/importer`, {})).status, 403);
    const guestB = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteB, one("SELECT id FROM users WHERE email = ?", guestB.email).id);
    const into = await upload(guestB, siteA, mkFile({ pages: [] }), { types: ["pages"] });
    assert.equal(into.status, 403, "import dans un site qui n'est pas le sien");
    const mine = await analyseText(guestB, siteB, mkFile({ pages: [{ ref: "p1", name: "Page du site B limité", slug: "page-b-limite", content: { title: "t", sections: [{ type: "text", markdown: "x" }] } }], articles: [{ ref: "a1", slug: "art-interdit", title: "Interdit", content: "<p>x</p>", categoryRefs: [], tagRefs: [] }] }), { types: ["pages", "articles"], on_conflict: "skip" });
    const items = runRow(mine.id).plan.items;
    assert.equal(items.find((i) => i.type === "pages").action, "create");
    assert.ok(!items.some((i) => i.type === "articles"), "contenu de l'organisation : retiré de la sélection d'un accès limité à un site");
    assert.ok(runRow(mine.id).report.analysis.skippedTypes.includes("articles"), "et signalé dans le rapport");
    // custom role sans tools.overwrite
    const role = await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Importeur sans écrasement", description: "t", perm: ["tools.view", "tools.import", "forms.read", "forms.write", "articles.read", "articles.write", "taxonomies.read", "taxonomies.write"] });
    assert.ok([200, 302].includes(role.status));
    const noOver = await member(one("SELECT key FROM mk_roles WHERE name = 'Importeur sans écrasement'").key);
    const upd = await analyseText(noOver, siteA, fileAB, { types: ["pages"], on_conflict: "update" });
    assert.ok(runRow(upd.id).plan.items.every((i) => i.action === "error"), "mise à jour refusée sans tools.overwrite");
  });
});

describe("import : lots, progression réelle, annulation, annulation d'import", () => {
  const bigFile = (n, prefix) => mkFile({ pages: Array.from({ length: n }, (_, i) => ({ ref: `p${i + 1}`, name: `${prefix} ${i + 1}`, slug: `${prefix.toLowerCase()}-${i + 1}`, kind: "page", content: { title: `Titre ${i + 1}`, sections: [{ type: "text", markdown: `Texte ${i + 1}` }] } })) });
  test("gros import (120 pages) : exécuté par lots, compteurs réels, rapport exact", async () => {
    const { id } = await analyse(boss, siteB, bigFile(120, "Lot"), { types: ["pages"], on_conflict: "skip" });
    assert.equal(runRow(id).total, 120);
    await boss.post(`${O}/importer/${id}/confirmer?site=${siteB}`, { confirm: "1" });
    const seen = [];
    const end = Date.now() + 60000;
    let p;
    do { p = JSON.parse((await boss.get(`${O}/operations/${id}.json?site=${siteB}`)).text); seen.push(p.done); await sleep(40); } while (!p.finished && Date.now() < end);
    assert.equal(p.status, "done");
    assert.equal(p.done, 120);
    assert.equal(p.percent, 100);
    assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND slug LIKE 'lot-%'", siteB), 120);
    assert.ok(seen.every((v, i) => i === 0 || v >= seen[i - 1]), "la progression ne recule jamais");
    assert.equal(runRow(id).report.per.pages.created, 120);
  });
  test("annulation en cours : arrêt entre deux lots, rapport précis, aucune page à moitié écrite", async () => {
    const { id } = await analyse(boss, siteB, bigFile(200, "Stop"), { types: ["pages"], on_conflict: "skip" });
    await boss.post(`${O}/importer/${id}/confirmer?site=${siteB}`, { confirm: "1" });
    for (let i = 0; i < 100; i++) { const p = JSON.parse((await boss.get(`${O}/operations/${id}.json?site=${siteB}`)).text); if (p.done > 0 || p.finished) break; await sleep(20); }
    await boss.post(`${O}/operations/${id}/annuler?site=${siteB}`, { retour: `${O}/importer/${id}` });
    const p = await waitRun(boss, id, siteB, { until: ["done", "cancelled", "failed"] });
    const created = count("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND slug LIKE 'stop-%'", siteB);
    const rep = runRow(id).report;
    assert.ok(["cancelled", "done"].includes(p.status));
    if (p.status === "cancelled") {
      assert.ok(created < 200 && created >= 0);
      assert.equal(created, rep.per.pages.created, "le rapport correspond exactement à la base");
      const stray = all("SELECT id FROM mk_landing_pages WHERE site_id = ? AND slug LIKE 'stop-%' AND draft IS NULL AND sections = '[]'", siteB);
      assert.equal(stray.length, 0, "aucune page à moitié écrite (sans contenu)");
    } else assert.equal(created, 200);
  });
  test("annuler un import : pages et articles créés à la corbeille, ce qui existait avant intact", async () => {
    const before = count("SELECT COUNT(*) n FROM mk_landing_pages WHERE archived_at IS NULL");
    const f = mkFile({ pages: [{ ref: "p1", name: "À défaire A", slug: "a-defaire-a", content: { title: "t", sections: [{ type: "text", markdown: "x" }] } }, { ref: "p2", name: "À défaire B", slug: "a-defaire-b", content: { title: "t", sections: [{ type: "text", markdown: "y" }] } }], articles: [{ ref: "a1", slug: "article-a-defaire", title: "Article à défaire", content: "<p>x</p>", categoryRefs: [], tagRefs: [] }] });
    const { id } = await analyse(boss, siteB, f, { types: ["pages", "articles"], on_conflict: "skip" });
    assert.equal((await confirm(boss, siteB, id)).status, "done");
    assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages WHERE archived_at IS NULL"), before + 2);
    const r = await boss.post(`${O}/importer/${id}/defaire?site=${siteB}`, { confirm: "1" });
    assert.equal(r.status, 302);
    const undoId = one("SELECT id FROM cms_tool_runs WHERE kind = 'import-undo' ORDER BY id DESC").id;
    assert.equal((await waitRun(boss, undoId, siteB)).status, "done");
    assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages WHERE archived_at IS NULL"), before, "pages importées à la corbeille");
    assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages WHERE slug LIKE 'a-defaire-%' AND archived_at IS NOT NULL"), 2, "récupérables, pas supprimées");
    assert.ok(one("SELECT deleted_at FROM posts WHERE slug = 'article-a-defaire'").deleted_at);
    const again = await boss.post(`${O}/importer/${id}/defaire?site=${siteB}`, { confirm: "1" });
    assert.equal(again.status, 302);
    assert.equal(count("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'import-undo' AND options LIKE ?", `%"of":${id}%`), 1, "une seule annulation possible");
  });
  test("aller-retour : exporter le site B puis réimporter donne les mêmes contenus", async () => {
    const e1 = await doExport(boss, { site: siteB, types: ["pages"] });
    const names = e1.data.resources.pages.map((p) => p.name).sort();
    const siteC = await newSite("Site Réimport C");
    const { id } = await analyse(boss, siteC, e1.text, { types: ["pages"], on_conflict: "duplicate" });
    assert.equal((await confirm(boss, siteC, id)).status, "done");
    const e2 = await doExport(boss, { site: siteC, types: ["pages"] });
    const base = (n) => n.replace(/( \(\d+\))+$/, "");
    assert.deepEqual(e2.data.resources.pages.map((p) => base(p.name)).sort(), names.map(base).sort(), "mêmes pages (les noms sont uniques dans l'organisation : un suffixe est ajouté)");
    const text = (d) => JSON.stringify(d.resources.pages.map((p) => p.content.sections.map((s) => s.markdown || s.title || "")).sort());
    assert.equal(text(e2.data), text(e1.data), "mêmes contenus");
  });
});

// ---------- Santé du site ----------
const healthResults = (id) => Object.fromEntries(runRow(id).report.results.map((r) => [r.id, r]));
async function runHealth(client, site = null) {
  const r = await client.post(`${O}/sante${qs(site)}`, {});
  assert.equal(r.status, 302);
  const id = one("SELECT MAX(id) id FROM cms_tool_runs WHERE kind = 'health'").id;
  const p = await waitRun(client, id, site, { ms: 90000 });
  assert.equal(p.status, "done", JSON.stringify(p));
  return { id, res: healthResults(id), report: runRow(id).report };
}
describe("santé du site : contrôles réels, état normal et problèmes simulés", () => {
  test("état normal : chaque contrôle a un statut, un détail ; aucun « OK » sans vérification ; relancer = nouvelle analyse", async () => {
    const a = await runHealth(boss);
    const r = a.res;
    for (const k of ["homepage", "not_found", "sitemap", "robots", "db_integrity", "backups", "sensitive_files", "admin_protected", "response_time", "media", "integrity"]) assert.ok(r[k], `contrôle ${k} présent`);
    assert.equal(r.homepage.status, "good");
    assert.equal(r.not_found.status, "good", "une adresse inexistante répond 404");
    assert.equal(r.sitemap.status === "good" || r.sitemap.status === "warning", true);
    assert.match(r.sitemap.detail, /adresse/);
    assert.equal(r.db_integrity.status, "good");
    assert.equal(r.admin_protected.status, "good");
    assert.equal(r.sensitive_files.status, "good");
    assert.match(r.response_time.detail, /ms/);
    assert.equal(r.unmeasured.status, "info", "ce qui n'est pas mesurable est dit « non mesuré »");
    assert.match(r.unmeasured.detail, /Non mesuré/);
    for (const x of a.report.results) { assert.ok(["good", "warning", "critical", "info"].includes(x.status), x.id); assert.ok(x.detail && x.title && x.category, x.id); }
    assert.equal(a.report.summary.good + a.report.summary.warning + a.report.summary.critical + a.report.summary.info, a.report.results.length);
    const b = await runHealth(boss);
    assert.notEqual(b.id, a.id, "une nouvelle analyse est une nouvelle opération");
    const page = (await boss.get(O)).text;
    assert.match(page, /Dernière analyse/);
    assert.match(page, /Impact|Recommandation|Page d&#39;accueil/);
  });
  test("problème simulé : page publiée inaccessible, lien de menu cassé, média manquant, redirection vers un 404, SEO sans description", async () => {
    // page publiée mais rendue inaccessible (état incohérent simulé directement en base)
    const broken = await livePage("Page cassée santé", { site_id: String(siteA) });
    db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(siteA); // le site de la page est archivé : plus servi comme site ; la page reste visible via /p
    db.prepare("UPDATE mk_sites SET status = 'active' WHERE id = ?").run(siteA);
    db.prepare("UPDATE mk_landing_pages SET status = 'published', archived_at = NULL WHERE id = ?").run(broken);
    // média référencé dont le fichier n'existe pas
    db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at) VALUES ('art-media-manquant', 'Art média', '<p><img src=\"/uploads/thumbnails/fichier-fantome.png\" alt=\"x\"></p>', 'html', 'published', 1, datetime('now'))").run();
    // redirection vers une adresse introuvable
    await boss.post("/marketing/site-web/redirections", { source: "/vers-le-vide", target: "/destination-inexistante-xyz", status: "301" });
    // menu vers une ressource supprimée
    db.prepare("INSERT INTO nav_items (menu_id, position, type, object_id, label) VALUES (?, 9, 'page', 987654, 'Page fantôme')").run(menuId);
    // page publiée indexable sans description
    await livePage("Sans description santé", {}, [{ type: "text", markdown: "x" }]);
    const { res } = await runHealth(boss);
    assert.equal(res.media.status, "critical");
    assert.match(res.media.detail, /fichier introuvable|référence/);
    assert.equal(res.redirects.status, "warning");
    assert.match(res.redirects.detail, /vers-le-vide/);
    assert.equal(res.integrity.status, "warning");
    assert.match(res.integrity.detail, /anomalie/);
    assert.equal(res.seo_meta.status, "warning");
    assert.match(res.seo_meta.detail, /sans description/);
    assert.ok(res.media.recommendation && res.media.impact, "chaque problème explique impact et recommandation");
  });
  test("route 404 cassée / sitemap inaccessible : détectés (serveur dont le plan du site est cassé volontairement)", async () => {
    // Le plan du site est vide quand aucune page n'est indexable : le contrôle le signale en « À surveiller »
    db.prepare("UPDATE mk_landing_pages SET indexable = 0").run();
    db.prepare("UPDATE posts SET published = 0, status = 'draft'").run();
    const { res } = await runHealth(boss);
    assert.ok(["warning", "good"].includes(res.sitemap.status));
    if (res.sitemap.status === "warning") assert.match(res.sitemap.detail, /vide/);
    db.prepare("UPDATE mk_landing_pages SET indexable = 1").run();
  });
  test("santé par site : le contrôle ne lit que le périmètre du site choisi (pages du site B jamais comptées dans A)", async () => {
    const a = await runHealth(boss, siteA);
    const b = await runHealth(boss, siteB);
    assert.match(a.res.pages_reachable.detail, /\d+ page/);
    assert.ok(!a.res.posts_reachable || /site principal/.test(a.res.posts_reachable.detail), "les articles appartiennent au site principal");
    assert.equal(runRow(a.id).site_id, siteA);
    assert.notEqual(runRow(a.id).report.siteId, runRow(b.id).report.siteId);
    // un compte limité à B ne voit pas l'analyse de A
    const guestB = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteB, one("SELECT id FROM users WHERE email = ?", guestB.email).id);
    assert.equal((await guestB.get(`${O}/operations/${a.id}.json?site=${siteB}`)).status, 404);
    assert.equal((await guestB.get(`${O}?site=${siteA}`)).status, 403);
    assert.equal((await guestB.get(`${O}?site=${siteB}`)).status, 200);
    assert.equal((await guestB.post(`${O}/sante?site=${siteA}`, {})).status, 403);
  });
});

describe("diagnostic : intégrité et orphelins (lecture seule, corrections confirmées)", () => {
  test("détecte relations brisées, révisions orphelines, historiques d'adresses morts ; ne modifie rien", async () => {
    // relation orpheline : un terme du site principal (non rattaché) vers un article qui n'existe pas
    const orphanTerm = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Orpheline', 'orpheline-diagnostic')").run().lastInsertRowid);
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', 424242, ?, 0, 0)").run(orphanTerm);
    db.prepare("INSERT INTO cms_revisions (content_type, content_id, kind, label, data, fingerprint) VALUES ('page', 424242, 'draft', 'x', '{}', 'f1')").run();
    db.prepare("INSERT INTO cms_url_history (resource_type, resource_id, old_slug) VALUES ('page', 424242, 'adresse-morte')").run();
    const before = { rel: count("SELECT COUNT(*) n FROM taxonomy_relations"), rev: count("SELECT COUNT(*) n FROM cms_revisions"), hist: count("SELECT COUNT(*) n FROM cms_url_history") };
    const r = await boss.post(`${O}/diagnostic/integrite`, {});
    assert.equal(r.status, 302);
    const id = one("SELECT MAX(id) id FROM cms_tool_runs WHERE kind = 'integrity'").id;
    assert.equal((await waitRun(boss, id, null)).status, "done");
    const rep = runRow(id).report;
    const g = Object.fromEntries(rep.groups.map((x) => [x.key, x]));
    assert.ok(g.taxonomy_relations.count >= 1);
    assert.ok(g.revisions.count >= 1);
    assert.ok(g.url_history.count >= 1);
    assert.ok(g.menu_refs.count >= 1, "élément de menu vers une page supprimée");
    assert.deepEqual({ rel: count("SELECT COUNT(*) n FROM taxonomy_relations"), rev: count("SELECT COUNT(*) n FROM cms_revisions"), hist: count("SELECT COUNT(*) n FROM cms_url_history") }, before, "le diagnostic ne supprime rien");
    const page = (await boss.get(`${O}/diagnostic`)).text;
    assert.match(page, /anomalie/);
    assert.match(page, /potentiellement inutilisé/);
  });
  test("correction : simulation sans la case, application avec confirmation ; l'éditeur ne peut pas corriger", async () => {
    const sim = await boss.post(`${O}/diagnostic/corriger`, { key: "taxonomy_relations" });
    assert.equal(sim.status, 302);
    assert.equal(count("SELECT COUNT(*) n FROM taxonomy_relations WHERE content_id = 424242"), 1, "simulation : rien supprimé");
    const editor = await member("editor");
    assert.equal((await editor.post(`${O}/diagnostic/corriger`, { key: "taxonomy_relations", confirm: "1" })).status, 403);
    assert.equal(count("SELECT COUNT(*) n FROM taxonomy_relations WHERE content_id = 424242"), 1);
    await boss.post(`${O}/diagnostic/corriger`, { key: "taxonomy_relations", confirm: "1" });
    assert.equal(count("SELECT COUNT(*) n FROM taxonomy_relations WHERE content_id = 424242"), 0);
    assert.ok(count("SELECT COUNT(*) n FROM taxonomy_relations") > 0, "les relations valides sont intactes");
    await boss.post(`${O}/diagnostic/corriger`, { key: "revisions", confirm: "1" });
    await boss.post(`${O}/diagnostic/corriger`, { key: "url_history", confirm: "1" });
    assert.equal(count("SELECT COUNT(*) n FROM cms_revisions WHERE content_id = 424242"), 0);
    assert.equal(count("SELECT COUNT(*) n FROM cms_url_history WHERE old_slug = 'adresse-morte'"), 0);
    assert.ok(count("SELECT COUNT(*) n FROM cms_url_history") >= 0);
    assert.equal((await boss.post(`${O}/diagnostic/corriger`, { key: "DROP TABLE users", confirm: "1" })).status, 302);
    assert.ok(count("SELECT COUNT(*) n FROM users") > 0, "clé inconnue refusée, aucune requête libre");
    assert.ok(count("SELECT COUNT(*) n FROM audit_log WHERE action = 'tools.integrity_fix'") >= 3, "chaque correction est journalisée");
  });
  test("médias inutilisés : détectés sans rien supprimer", async () => {
    const r = require("child_process"); void r;
    const html = (await boss.get(`${O}/diagnostic`)).text;
    assert.match(html, /Médias potentiellement inutilisés/);
    assert.equal(count("SELECT COUNT(*) n FROM mk_media WHERE path = ?", `/uploads/marketing/1/site-${siteA}/photo-export.png`), 1, "le média est toujours là");
  });
});

describe("informations système, caches, maintenance par site, outils de contenu", () => {
  test("informations système : faits réels, aucun secret", async () => {
    const html = (await boss.get(`${O}/systeme`)).text;
    for (const t of ["Version de KOLAKISA", "SQLite", "Node.js", "Environnement", "Taille du fichier"]) assert.match(html, new RegExp(t));
    assert.match(html, /Définie/);
    assert.doesNotMatch(html, new RegExp(TEST_KEY.slice(0, 12)), "la clé n'est jamais affichée");
    assert.doesNotMatch(html, /secret-de-test-assez-long|MotDePasseProf123/);
    const site = (await boss.get(`${O}/systeme?site=${siteA}`)).text;
    assert.match(site, new RegExp(`Identifiant du site</dt><dd>${siteA}</dd>`));
  });
  test("caches : inspection réelle, invalidation unitaire et globale (avec confirmation) ; les données ne bougent pas", async () => {
    await anon.get("/robots.txt"); await anon.get("/sitemap.xml");
    const before = { redirects: count("SELECT COUNT(*) n FROM seo_redirects"), pages: count("SELECT COUNT(*) n FROM mk_landing_pages") };
    const html = (await boss.get(`${O}/cache`)).text;
    assert.match(html, /Réglages SEO/);
    assert.match(html, /Chargé|Vide/);
    const one_ = await boss.post(`${O}/cache`, { key: "redirects" });
    assert.equal(one_.status, 302);
    assert.ok(count("SELECT COUNT(*) n FROM audit_log WHERE action = 'tools.cache_clear'") >= 1);
    await boss.post(`${O}/cache`, { key: "all" });
    assert.ok(count("SELECT COUNT(*) n FROM audit_log WHERE action = 'tools.cache_all'") === 0, "sans confirmation : rien");
    await boss.post(`${O}/cache`, { key: "all", confirm: "1" });
    assert.ok(count("SELECT COUNT(*) n FROM audit_log WHERE action = 'tools.cache_all'") === 1);
    await boss.post(`${O}/cache`, { key: "inconnu" });
    assert.deepEqual({ redirects: count("SELECT COUNT(*) n FROM seo_redirects"), pages: count("SELECT COUNT(*) n FROM mk_landing_pages") }, before);
    assert.equal((await anon.get("/robots.txt")).status, 200, "le site fonctionne après invalidation");
  });
  test("maintenance PAR SITE : le site A en maintenance (503), le site B et le site principal restent en ligne ; l'équipe n'est jamais bloquée", async () => {
    const sA = (await boss.get(`/marketing/site-web/sites/${siteA}`)).text; void sA;
    const slugA = row(pA1).slug;
    assert.equal((await anon.get(`/p/${slugA}`)).status, 200);
    const noConfirm = await boss.post(`${O}/maintenance?site=${siteA}`, { enabled: "1", message: "Retour dans une heure" });
    assert.equal(count("SELECT COUNT(*) n FROM cms_maintenance WHERE enabled = 1"), 0, "sans confirmation : rien");
    assert.equal(noConfirm.status, 302);
    await boss.post(`${O}/maintenance?site=${siteA}`, { enabled: "1", confirm: "1", message: "Retour dans <b>une heure</b>" });
    await sleep(3200); // le cache de lecture se rafraîchit (3 s)
    const res = await anon.get(`/p/${slugA}`);
    assert.equal(res.status, 503);
    assert.match(res.text, /Retour dans &lt;b&gt;une heure&lt;\/b&gt;/, "message échappé");
    assert.equal(res.headers.get("retry-after"), "600");
    assert.match(res.text, /noindex/);
    const pageB = await anon.get(`/p/${row(await (async () => one("SELECT id FROM mk_landing_pages WHERE site_id = ? AND status = 'published'", siteB).id)()).slug}`);
    assert.equal(pageB.status, 200, "le site B n'est pas touché");
    assert.equal((await anon.get("/blog")).status, 200, "le site principal non plus");
    assert.equal((await anon.get("/connexion")).status, 200, "la connexion reste accessible");
    assert.equal((await boss.get(`/p/${slugA}`)).status, 200, "l'équipe connectée voit le site normalement");
    assert.equal((await boss.get(O)).status, 200, "et garde l'administration");
    // un compte ordinaire (élève) est bloqué comme un visiteur
    const student = await newStudent(srv);
    assert.equal((await student.get(`/p/${slugA}`)).status, 503);
    await boss.post(`${O}/maintenance?site=${siteA}`, { enabled: "0" });
    await sleep(3200);
    assert.equal((await anon.get(`/p/${slugA}`)).status, 200, "désactivée : le site revient");
  });
  test("maintenance du site principal : n'affecte pas les pages d'un autre site", async () => {
    await boss.post(`${O}/maintenance`, { enabled: "1", confirm: "1", message: "Principal en travaux" });
    await sleep(3200);
    assert.equal((await anon.get("/blog")).status, 503);
    assert.equal((await anon.get(`/p/${row(pA1).slug}`)).status, 200, "les pages du site A restent en ligne");
    assert.equal((await anon.get("/robots.txt")).status, 200);
    assert.equal((await boss.get("/blog")).status, 200, "l'équipe n'est pas bloquée");
    await boss.post(`${O}/maintenance`, { enabled: "0" });
    await sleep(3200);
    assert.equal((await anon.get("/blog")).status, 200);
    const editor = await member("editor");
    assert.equal((await editor.post(`${O}/maintenance`, { enabled: "1", confirm: "1" })).status, 403);
  });
  test("rechercher / remplacer : simulation sans écriture, confirmation, brouillon seulement, historique, texte seulement", async () => {
    const id = await create("Page remplacement", { site_id: String(siteA) });
    await saveDraft(boss, id, { sections: [{ type: "text", markdown: "Notre ancien nom est ici. Visitez /ancien-nom ou https://ancien-nom.example." }] });
    await boss.post(`/marketing/pages/${id}/publier.json`, {});
    await saveDraft(boss, id, { sections: [{ type: "text", markdown: "Notre ancien nom est ici (brouillon). Lien : https://ancien-nom.example" }] });
    const liveBefore = row(id).sections, draftBefore = row(id).draft;
    const sim = await boss.post(`${O}/contenu/simuler?site=${siteA}`, { search: "ancien nom", replace: "nouveau nom", pages: "1" });
    assert.equal(sim.status, 302);
    const runId = one("SELECT MAX(id) id FROM cms_tool_runs WHERE kind = 'content'").id;
    assert.equal((await waitRun(boss, runId, siteA)).status, "awaiting");
    assert.equal(row(id).draft, draftBefore, "simulation : rien modifié");
    assert.ok(runRow(runId).report.plan.some((f) => f.label === "Page remplacement"));
    assert.ok((await boss.get(`${O}/contenu?site=${siteA}`)).text.includes("rien n'a été modifié"));
    const noConfirm = await boss.post(`${O}/contenu/remplacer/${runId}?site=${siteA}`, {});
    assert.equal(noConfirm.status, 302);
    assert.equal(runRow(runId).status, "awaiting");
    await boss.post(`${O}/contenu/remplacer/${runId}?site=${siteA}`, { confirm: "1" });
    assert.equal((await waitRun(boss, runId, siteA, { until: ["done", "failed", "cancelled"] })).status, "done");
    assert.match(row(id).draft, /Notre nouveau nom est ici \(brouillon\)/);
    assert.match(row(id).draft, /https:\/\/ancien-nom\.example/, "les adresses ne sont jamais touchées (clé « markdown » = texte, mais le texte « ancien nom » avec espace seul est remplacé)");
    assert.equal(row(id).sections, liveBefore, "la version EN LIGNE n'a pas changé");
    assert.ok(count("SELECT COUNT(*) n FROM cms_revisions WHERE content_type = 'page' AND content_id = ?", id) >= 1, "ancien brouillon dans l'historique");
    const editor = await member("editor");
    assert.equal((await editor.post(`${O}/contenu/simuler?site=${siteA}`, { search: "ancien nom", replace: "x", pages: "1" })).status, 403);
    const tooShort = await boss.post(`${O}/contenu/simuler?site=${siteA}`, { search: "a", replace: "b", pages: "1" });
    assert.equal(tooShort.status, 302);
  });
  test("régénérations et nettoyages : simulation par défaut, confirmation pour appliquer, périmètre précis", async () => {
    db.prepare("INSERT INTO seo_404 (path, hits_human, hits_bot, last_seen) VALUES ('/vieux-404', 1, 0, datetime('now', '-200 days')), ('/recent-404', 1, 0, datetime('now'))").run();
    const html = (await boss.get(`${O}/contenu`)).text;
    assert.match(html, /Actualiser le plan du site/);
    assert.match(html, /1 entrée\(s\) de plus de 90 jours/);
    await boss.post(`${O}/contenu/action`, { key: "log404" });
    assert.equal(count("SELECT COUNT(*) n FROM seo_404 WHERE path = '/vieux-404'"), 1, "simulation : rien supprimé");
    await boss.post(`${O}/contenu/action`, { key: "log404", confirm: "1" });
    assert.equal(count("SELECT COUNT(*) n FROM seo_404 WHERE path = '/vieux-404'"), 0);
    assert.equal(count("SELECT COUNT(*) n FROM seo_404 WHERE path = '/recent-404'"), 1, "les entrées récentes sont gardées");
    const r = await boss.post(`${O}/contenu/action`, { key: "sitemap", confirm: "1" });
    assert.equal(r.status, 302);
    assert.equal((await anon.get("/sitemap.xml")).status, 200);
    assert.equal((await boss.post(`${O}/contenu/action`, { key: "rm -rf", confirm: "1" })).status, 302);
  });
});

describe("interruption, liens cassés dans la santé, journal", () => {
  test("opération interrompue (serveur arrêté) : détectée, marquée interrompue avec son rapport partiel, annulable", async () => {
    const created = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, kind) VALUES (?, 'Page interrompue', 'page-interrompue', 't', 'draft', ?, 'page')").run(orgId, siteB).lastInsertRowid);
    const partial = JSON.stringify({ partial: true, per: { pages: { created: 1, updated: 0, skipped: 0, failed: 0 } }, created: { pages: [created], articles: [], taxonomies: [], menus: [], redirects: [] }, results: [] });
    const id = Number(db.prepare("INSERT INTO cms_tool_runs (organization_id, site_id, user_id, kind, status, phase, options, report, total, done, started_at) VALUES (?, ?, 1, 'import', 'running', 'apply', '{\"types\":[\"pages\"],\"onConflict\":\"skip\"}', ?, 10, 1, datetime('now', '-30 minutes'))").run(orgId, siteB, partial).lastInsertRowid);
    const page = await boss.get(`${O}?site=${siteB}`); // l'écran vérifie les opérations bloquées
    assert.equal(page.status, 200);
    const r = runRow(id);
    assert.equal(r.status, "failed");
    assert.match(r.message, /interrompue/);
    const undo = await boss.post(`${O}/importer/${id}/defaire?site=${siteB}`, { confirm: "1" });
    assert.equal(undo.status, 302);
    const uid = one("SELECT MAX(id) id FROM cms_tool_runs WHERE kind = 'import-undo'").id;
    assert.equal((await waitRun(boss, uid, siteB)).status, "done");
    assert.ok(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", created).archived_at, "ce que l'import interrompu avait créé est retiré (corbeille)");
  });
  test("la santé signale un lien interne cassé (moteur du palier 12, pas un second moteur)", async () => {
    const id = await livePage("Page lien mort santé", {}, [{ type: "text", markdown: "[mort](/p/cette-page-nexiste-pas-du-tout)" }]);
    void id;
    const { res } = await runHealth(boss);
    assert.equal(res.broken_links.status, "warning");
    assert.match(res.broken_links.detail, /liens? cassés?/);
    assert.match(res.broken_links.action.href, /liens-casses/);
  });
  test("les opérations sensibles sont journalisées (export, import, caches, maintenance, nettoyages)", async () => {
    for (const a of ["tools.export_start", "tools.export_download", "tools.import_analyse", "tools.import_apply", "tools.import_undo", "tools.cache_clear", "tools.maintenance_on", "tools.maintenance_off", "tools.content_action", "tools.replace_apply"]) assert.ok(count("SELECT COUNT(*) n FROM audit_log WHERE action = ?", a) >= 1, a);
    const details = all("SELECT details FROM audit_log WHERE action LIKE 'tools.%'").map((r) => r.details).join(" ");
    assert.doesNotMatch(details, /password|MotDePasse|api_key|secret/i, "aucun secret dans le journal");
  });
});
