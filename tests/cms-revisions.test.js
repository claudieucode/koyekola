// KOLAKISA CMS — palier 10 : historique commun, restauration sûre, corbeille commune, récupération, conflits — par les vraies routes d'un vrai serveur
// et la vraie base. Pages (et modèles), articles, apparence, patterns ; droits (palier 9), accès entre sites, IDOR, appels directs.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId, bossId;
const H = "/marketing/site-web/historique";
const T = "/marketing/site-web/corbeille";
const AP = "/marketing/site-web/apparence";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const q = (sql, ...a) => db.prepare(sql).all(...a);
const json = (r) => JSON.parse(r.text);
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const layout = (children) => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] });
const heading = (id, text) => ({ id, type: "heading", props: { text, level: 1 } });
async function person(role = null) {
  const c = await newStudent(srv);
  if (role) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), role);
  return c;
}
async function newPage(name) { return Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]); }
const rev = (id) => one("SELECT revision FROM mk_landing_pages WHERE id = ?", id).revision;
async function saveDraft(id, text, client = boss, revision = null) {
  return client.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: revision ?? rev(id), content: { sections: [layout([heading("head00000001", text)])] } } });
}
const publish = (id) => boss.postJson(`/marketing/pages/${id}/publier.json`, {});
const draftText = (id) => (JSON.parse(one("SELECT draft FROM mk_landing_pages WHERE id = ?", id).draft).sections[0].children[0].children[0].props.text);
const liveText = (id) => (JSON.parse(one("SELECT sections FROM mk_landing_pages WHERE id = ?", id).sections)[0].children[0].children[0].props.text);
// Force un nouveau point de brouillon (sinon des sauvegardes rapprochées de la même personne forment un seul point)
const newPoint = (type, id) => db.prepare("UPDATE cms_revisions SET updated_at = datetime('now', '-30 minutes') WHERE content_type = ? AND content_id = ?").run(type, id);
let postN = 0;
async function savePost(client, fields, id = null) {
  const fd = new FormData();
  Object.entries({ excerpt: "Résumé.", content_format: "html", status: "draft", ...fields }).forEach(([k, v]) => fd.append(k, v));
  return client.request(id ? `/formateur/blog/${id}/modifier` : "/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  bossId = one("SELECT id FROM users WHERE role = 'formateur'").id;
});
after(() => srv.stop());

describe("pages : brouillon, publication, historique, restauration", () => {
  let id, v1;
  test("les sauvegardes de brouillon alimentent un vrai historique, sans toucher à la version en ligne", async () => {
    id = await newPage("Page historique");
    assert.equal((await saveDraft(id, "Version A")).status, 200);
    assert.equal((await publish(id)).status, 200);
    v1 = one("SELECT number FROM mk_page_versions WHERE page_id = ?", id).number;
    assert.equal(liveText(id), "Version A");
    assert.equal((await saveDraft(id, "Version B")).status, 200);
    newPoint("page", id);
    assert.equal((await saveDraft(id, "Version C")).status, 200);
    assert.equal(liveText(id), "Version A", "le contenu publié ne change jamais par une sauvegarde de brouillon");
    assert.equal(draftText(id), "Version C");
    const rows = q("SELECT kind FROM cms_revisions WHERE content_type = 'page' AND content_id = ?", id);
    assert.ok(rows.length >= 2 && rows.every((r) => r.kind === "draft"));
  });
  test("sauvegardes rapprochées de la même personne : un seul point (pas de remplissage de l'historique)", async () => {
    const before = q("SELECT id FROM cms_revisions WHERE content_type = 'page' AND content_id = ?", id).length;
    for (const t of ["C1", "C2", "C3", "C4"]) await saveDraft(id, t);
    assert.equal(q("SELECT id FROM cms_revisions WHERE content_type = 'page' AND content_id = ?", id).length, before, "quatre sauvegardes de plus, aucun point de plus");
    assert.equal(draftText(id), "C4");
    await saveDraft(id, "Version C");
  });
  test("l'écran Historique liste de vraies entrées (publication, brouillons), groupées par jour, avec l'auteur", async () => {
    const r = await boss.get(`${H}/page/${id}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Aujourd&#39;hui|Aujourd'hui/); assert.match(r.text, /Version publiée n° 1/); assert.match(r.text, /Brouillon enregistré/); assert.match(r.text, /Prof/);
    assert.match(r.text, /Brouillon non publié/);
  });
  test("consulter un point : contenu réel, aperçu rendu par le vrai moteur, aucune modification de la page", async () => {
    const before = JSON.stringify(one("SELECT draft, sections, revision FROM mk_landing_pages WHERE id = ?", id));
    const draftRow = one("SELECT id FROM cms_revisions WHERE content_type = 'page' AND content_id = ? ORDER BY id LIMIT 1", id);
    const v = await boss.get(`${H}/page/${id}/version?ref=r:${draftRow.id}`);
    assert.equal(v.status, 200); assert.match(v.text, /Version B|Version C|Version A/);
    const pv = await boss.get(`/marketing/pages/${id}/revisions/${draftRow.id}/apercu`);
    assert.equal(pv.status, 200); assert.match(pv.text, /Version B|Version C/); assert.match(pv.text, /consultation seulement/);
    assert.equal((await boss.get(`/marketing/pages/${id}/versions/${v1}/apercu`)).status, 200);
    assert.equal(JSON.stringify(one("SELECT draft, sections, revision FROM mk_landing_pages WHERE id = ?", id)), before);
  });
  test("comparer : différences réelles entre la version en ligne et le brouillon", async () => {
    const r = await boss.get(`${H}/page/${id}/comparer?a=live&b=draft`);
    assert.equal(r.status, 200); assert.match(r.text, /Modifié/); assert.match(r.text, /contenu/);
    const same = await boss.get(`${H}/page/${id}/comparer?a=draft&b=draft`);
    assert.match(same.text, /Aucune différence/);
  });
  test("restaurer une ancienne version : le brouillon actuel est conservé, la restauration est tracée et réversible, le contenu en ligne ne bouge pas", async () => {
    assert.equal(draftText(id), "Version C");
    const r = await boss.post(`${H}/page/${id}/restaurer`, { ref: `v:${v1}` });
    assert.equal(r.status, 302);
    assert.equal(draftText(id), "Version A", "le brouillon prend le contenu de la version restaurée");
    assert.equal(liveText(id), "Version A");
    const kinds = q("SELECT kind, data FROM cms_revisions WHERE content_type = 'page' AND content_id = ? AND kind IN ('before_restore', 'restore')", id);
    assert.deepEqual(kinds.map((k) => k.kind).sort(), ["before_restore", "restore"]);
    const snap = kinds.find((k) => k.kind === "before_restore");
    assert.match(snap.data, /Version C/, "l'état d'avant (V.C) est conservé");
    // On peut revenir à l'état d'avant la restauration
    const back = one("SELECT id FROM cms_revisions WHERE content_type = 'page' AND content_id = ? AND kind = 'before_restore'", id);
    await boss.post(`${H}/page/${id}/restaurer`, { ref: `r:${back.id}` });
    assert.equal(draftText(id), "Version C", "retour possible : rien n'est perdu");
  });
  test("conflit : une sauvegarde faite avec une ancienne révision est refusée, rien n'est écrasé", async () => {
    const stale = rev(id);
    assert.equal((await saveDraft(id, "Par B", boss, stale)).status, 200);
    const r = await saveDraft(id, "Par A (périmée)", boss, stale);
    assert.equal(r.status, 409); assert.match(json(r).error.message, /modifiée ailleurs/);
    assert.equal(draftText(id), "Par B");
  });
  test("restaurer depuis un faux identifiant ou un point d'une autre page : refusé, rien ne change", async () => {
    const other = await newPage("Autre page");
    await saveDraft(other, "Contenu de l'autre page");
    const foreign = one("SELECT id FROM cms_revisions WHERE content_type = 'page' AND content_id = ?", other).id;
    const before = draftText(id);
    await boss.post(`${H}/page/${id}/restaurer`, { ref: `r:${foreign}` });
    await boss.post(`${H}/page/${id}/restaurer`, { ref: "r:999999" });
    await boss.post(`${H}/page/${id}/restaurer`, { ref: "n'importe quoi" });
    assert.equal(draftText(id), before);
    assert.equal((await boss.get(`${H}/page/${id}/version?ref=r:${foreign}`)).status, 404, "pas de lecture d'un autre contenu par manipulation de la référence");
  });
  test("pagination : l'historique n'est jamais chargé en entier (25 par page), les points de brouillon sont bornés", async () => {
    db.exec("BEGIN");
    const ins = db.prepare("INSERT INTO cms_revisions (content_type, content_id, kind, label, data, fingerprint) VALUES ('page', ?, 'draft', 'Bulk', '{}', ?)");
    for (let i = 0; i < 80; i++) ins.run(id, `bulk${i}`);
    db.exec("COMMIT");
    const r = await boss.get(`${H}/page/${id}`);
    assert.match(r.text, /Page 1 sur [3-9]/);
    assert.ok((r.text.match(/data-hi-pick/g) || []).length <= 25);
    assert.match((await boss.get(`${H}/page/${id}?page=2`)).text, /Page 2 sur/);
    db.prepare("DELETE FROM cms_revisions WHERE label = 'Bulk'").run();
  });
  test("supprimer un point de brouillon : réservé aux administrateurs ; publications et restaurations ne se suppriment jamais", async () => {
    const draftRow = one("SELECT id FROM cms_revisions WHERE content_type = 'page' AND content_id = ? AND kind = 'draft' LIMIT 1", id);
    const keep = one("SELECT id FROM cms_revisions WHERE content_type = 'page' AND content_id = ? AND kind = 'restore' LIMIT 1", id);
    const editor = await person("editor");
    assert.equal((await editor.post(`${H}/page/${id}/supprimer-version`, { ref: `r:${draftRow.id}` })).status, 403);
    assert.ok(one("SELECT 1 FROM cms_revisions WHERE id = ?", draftRow.id));
    await boss.post(`${H}/page/${id}/supprimer-version`, { ref: `r:${keep.id}` });
    assert.ok(one("SELECT 1 FROM cms_revisions WHERE id = ?", keep.id), "une restauration est conservée");
    await boss.post(`${H}/page/${id}/supprimer-version`, { ref: `r:${draftRow.id}` });
    assert.equal(one("SELECT 1 FROM cms_revisions WHERE id = ?", draftRow.id), undefined);
  });
  test("récupération après fermeture : le brouillon survit, la version en ligne est intacte, l'historique le signale", async () => {
    const p = await newPage("Page crash");
    await saveDraft(p, "Publié");
    await publish(p);
    await saveDraft(p, "Travail non publié");
    // « fermeture du navigateur » : on revient plus tard avec une nouvelle session
    const again = await loginInstructor(srv);
    assert.equal(draftText(p), "Travail non publié");
    assert.equal(liveText(p), "Publié");
    assert.match((await again.get(`${H}/page/${p}`)).text, /Brouillon non publié/);
    assert.match((await again.get(`/marketing/pages/${p}/apercu`)).text, /Travail non publié/);
    const pub = await anon.get(`/p/${one("SELECT slug FROM mk_landing_pages WHERE id = ?", p).slug}`, { headers: { "User-Agent": "Mozilla/5.0 Chrome/120" } });
    assert.match(pub.text, /Publié/); assert.doesNotMatch(pub.text, /Travail non publié/);
  });
});

describe("articles : même moteur d'historique, conflit, récupération", () => {
  let pid;
  test("l'historique d'un article liste ses vraies révisions ; comparer montre les ajouts et suppressions de texte", async () => {
    const r = await savePost(boss, { title: "Article versionné", content: "<p>Première phrase.</p><p>Deuxième phrase.</p>" });
    pid = json(r).id;
    await savePost(boss, { title: "Article versionné", content: "<p>Première phrase.</p><p>Deuxième phrase modifiée.</p><p>Troisième.</p>" }, pid);
    assert.ok(one("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?", pid).n >= 2);
    const list = await boss.get(`${H}/post/${pid}`);
    assert.equal(list.status, 200); assert.match(list.text, /Article versionné/);
    const ids = q("SELECT id FROM post_revisions WHERE post_id = ? ORDER BY id", pid).map((x) => x.id);
    const cmp = await boss.get(`${H}/post/${pid}/comparer?a=r:${ids[0]}&b=r:${ids[ids.length - 1]}`);
    assert.equal(cmp.status, 200); assert.match(cmp.text, /Deuxième phrase modifiée/); assert.match(cmp.text, /Troisième/); assert.match(cmp.text, /Ajouté/);
  });
  test("conflit : un autre onglet a enregistré → l'ancien onglet est refusé sans rien écraser ; avec la bonne version, l'enregistrement passe", async () => {
    const base = one("SELECT updated_at FROM posts WHERE id = ?", pid).updated_at;
    db.prepare("UPDATE posts SET updated_at = datetime('now', '+5 seconds') WHERE id = ?").run(pid);
    const r = await savePost(boss, { title: "Article versionné", content: "<p>Écrasement par l'onglet périmé</p>", base_updated_at: base }, pid);
    assert.equal(r.status, 409); assert.equal(json(r).conflict, true); assert.match(json(r).error, /modifié depuis votre dernière sauvegarde/);
    assert.doesNotMatch(one("SELECT content FROM posts WHERE id = ?", pid).content, /Écrasement/);
    const fresh = one("SELECT updated_at FROM posts WHERE id = ?", pid).updated_at;
    const ok = await savePost(boss, { title: "Article versionné", content: "<p>Version à jour</p>", base_updated_at: fresh }, pid);
    assert.equal(ok.status, 200);
    assert.match(one("SELECT content FROM posts WHERE id = ?", pid).content, /Version à jour/);
    assert.ok(json(ok).updatedAt);
  });
  test("sans version fournie (anciens clients), l'enregistrement fonctionne comme avant", async () => {
    assert.equal((await savePost(boss, { title: "Article versionné", content: "<p>Sans base</p>" }, pid)).status, 200);
  });
  test("récupération : une sauvegarde automatique plus récente est proposée à la réouverture, listée dans l'historique, et n'écrase rien", async () => {
    const fd = new FormData(); fd.append("title", "Article versionné"); fd.append("content", "<p>Texte autosauvegardé non enregistré</p>");
    assert.equal((await boss.request(`/formateur/blog/${pid}/autosave`, { method: "POST", multipart: fd })).status, 200);
    db.prepare("UPDATE posts SET updated_at = datetime('now', '-1 hour') WHERE id = ?").run(pid);
    const page = (await boss.get(`/formateur/blog/${pid}/modifier`)).text;
    assert.match(page, /"autosave":\{"savedAt"/); assert.match(page, /Texte autosauvegardé non enregistré/);
    assert.doesNotMatch(one("SELECT content FROM posts WHERE id = ?", pid).content, /autosauvegardé/);
    assert.match((await boss.get(`${H}/post/${pid}`)).text, /Sauvegarde automatique non enregistrée/);
    const preview = await boss.get(`${H}/post/${pid}/version?ref=autosave`);
    assert.match(preview.text, /Texte autosauvegardé/);
  });
  test("restaurer un article : par l'éditeur du blog (état actuel conservé, restauration tracée), depuis l'historique commun", async () => {
    const first = one("SELECT id FROM post_revisions WHERE post_id = ? ORDER BY id LIMIT 1", pid).id;
    const before = one("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?", pid).n;
    const r = await boss.post(`/formateur/blog/${pid}/versions/${first}/restaurer`, {});
    assert.equal(r.status, 302);
    assert.match(one("SELECT content FROM posts WHERE id = ?", pid).content, /Première phrase/);
    assert.ok(one("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?", pid).n > before);
    assert.ok(one("SELECT 1 FROM post_revisions WHERE post_id = ? AND kind = 'restore'", pid));
    assert.match((await boss.get(`${H}/post/${pid}`)).text, /\/formateur\/blog\/\d+\/versions\/\d+\/restaurer/, "le bouton Restaurer pointe vers la vraie route");
  });
  test("propriété : un auteur voit l'historique de SES articles, pas celui des autres (IDOR)", async () => {
    const author = await person("author");
    const mine = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, author_id) VALUES ('rev-mien', 'Mon article', 'x', 'html', 'draft', 0, ?)").run(idOf(author)).lastInsertRowid);
    assert.equal((await author.get(`${H}/post/${mine}`)).status, 200);
    assert.equal((await author.get(`${H}/post/${pid}`)).status, 403);
    assert.equal((await author.get(`${H}/post/${pid}/version?ref=autosave`)).status, 403);
    assert.equal((await author.get(`${H}/post/${pid}/comparer?a=r:1`)).status, 403);
  });
});

describe("apparence : brouillon, publication, restauration, conflit", () => {
  const style = (fields) => boss.post(`${AP}/styles`, fields);
  const draftRev = () => one("SELECT draft_rev FROM appearance_configs").draft_rev;
  test("chaque enregistrement du brouillon laisse un point d'historique ; la publication archive la version", async () => {
    await style({ "colors.primary": "#aa0000" });
    newPoint("appearance", 0);
    await style({ "colors.primary": "#00aa00" });
    assert.ok(q("SELECT id FROM cms_revisions WHERE content_type = 'appearance'").length >= 2);
    await boss.post(`${AP}/publier`, {});
    await style({ "colors.primary": "#0000aa" });
    const h = await boss.get(`${H}/appearance/0`);
    assert.equal(h.status, 200); assert.match(h.text, /Publication de l(?:'|&#39;)apparence/); assert.match(h.text, /Brouillon enregistré/);
  });
  test("conflit : un onglet périmé ne peut ni enregistrer ni publier par-dessus le brouillon d'un autre", async () => {
    const stale = draftRev();
    await boss.post(`${AP}/styles`, { "colors.primary": "#111111", base: String(stale) });
    assert.equal(one("SELECT draft FROM appearance_configs").draft.includes("#111111"), true);
    await boss.post(`${AP}/styles`, { "colors.primary": "#222222", base: String(stale) });
    assert.ok(!one("SELECT draft FROM appearance_configs").draft.includes("#222222"), "écrasement refusé");
    assert.match(flashOf((await boss.get(`${AP}/styles`)).text), /modifié depuis que vous l(?:'|&#39;)avez ouvert/);
    const before = one("SELECT published FROM appearance_configs").published;
    await boss.post(`${AP}/publier`, { base: String(stale) });
    assert.equal(one("SELECT published FROM appearance_configs").published, before, "publication refusée");
    await boss.post(`${AP}/publier`, { base: String(draftRev()) });
    assert.notEqual(one("SELECT published FROM appearance_configs").published, before);
  });
  test("restaurer une ancienne version dans le brouillon : l'état du brouillon est conservé avant, la restauration est tracée, rien n'est publié", async () => {
    await style({ "colors.primary": "#333333" });
    const published = one("SELECT published FROM appearance_configs").published;
    const old = one("SELECT id FROM appearance_revisions ORDER BY id LIMIT 1").id;
    const r = await boss.post(`${H}/appearance/0/restaurer`, { ref: `p:${old}` });
    assert.equal(r.status, 302);
    assert.equal(one("SELECT published FROM appearance_configs").published, published, "la version en ligne ne change pas");
    const kinds = q("SELECT kind, data FROM cms_revisions WHERE content_type = 'appearance' AND kind IN ('before_restore', 'restore')").map((k) => k.kind).sort();
    assert.deepEqual(kinds, ["before_restore", "restore"]);
    assert.match(q("SELECT data FROM cms_revisions WHERE content_type = 'appearance' AND kind = 'before_restore'")[0].data, /#333333/, "le brouillon d'avant est conservé");
    assert.ok(!one("SELECT draft FROM appearance_configs").draft.includes("#333333"));
  });
  test("comparer deux états de l'apparence : différences réelles par domaine (styles, en-tête, pied de page)", async () => {
    const ids = q("SELECT id FROM appearance_revisions ORDER BY id").map((x) => x.id);
    const r = await boss.get(`${H}/appearance/0/comparer?a=p:${ids[0]}&b=p:${ids[ids.length - 1]}`);
    assert.equal(r.status, 200); assert.match(r.text, /Styles/); assert.match(r.text, /colors › primary/);
  });
  test("en-tête et pied de page sont versionnés avec l'apparence (même historique)", async () => {
    await boss.post(`${AP}/en-tete`, { logo_mode: "text", logo_text: "TÊTE V2", search: "1", cart: "1", account: "1", mobile_cta: "1", base: String(draftRev()) });
    const last = q("SELECT data FROM cms_revisions WHERE content_type = 'appearance' ORDER BY id DESC")[0];
    assert.match(last.data, /TÊTE V2/);
  });
});

describe("patterns : historique, corbeille, restauration", () => {
  let pid, src;
  test("créer, renommer : points d'historique réels ; mettre à la corbeille : le pattern disparaît du Page Builder mais n'est pas effacé", async () => {
    src = await newPage("Source patterns");
    await saveDraft(src, "Mon bloc");
    await boss.post(`${AP}/patterns`, { page_id: String(src), section_index: "0", name: "Bloc historique" });
    pid = one("SELECT id FROM appearance_patterns WHERE name = 'Bloc historique'").id;
    await boss.post(`${AP}/patterns/${pid}`, { name: "Bloc historique renommé", description: "d" });
    const kinds = q("SELECT kind FROM cms_revisions WHERE content_type = 'pattern' AND content_id = ? ORDER BY id", pid).map((k) => k.kind);
    assert.deepEqual(kinds, ["create", "rename"]);
    assert.match((await boss.get(`/marketing/pages/${src}/editeur`)).text, /Bloc historique renommé/);
    await boss.post(`${AP}/patterns/${pid}/supprimer`, {});
    assert.ok(one("SELECT deleted_at FROM appearance_patterns WHERE id = ?", pid).deleted_at);
    assert.doesNotMatch((await boss.get(`/marketing/pages/${src}/editeur`)).text, /Bloc historique renommé/);
  });
  test("restaurer une version du pattern (nom d'avant) : l'état avant restauration est conservé", async () => {
    await boss.post(`${T}/actions`, { action: "restaurer", items: `pattern:${pid}`, retour: T });
    const first = one("SELECT id FROM cms_revisions WHERE content_type = 'pattern' AND content_id = ? AND kind = 'create'", pid).id;
    const r = await boss.post(`${H}/pattern/${pid}/restaurer`, { ref: `r:${first}` });
    assert.equal(r.status, 302);
    assert.equal(one("SELECT name FROM appearance_patterns WHERE id = ?", pid).name, "Bloc historique");
    assert.ok(one("SELECT 1 FROM cms_revisions WHERE content_type = 'pattern' AND content_id = ? AND kind = 'before_restore'", pid));
  });
  test("restaurer depuis la corbeille alors qu'un pattern du même nom existe : bloqué avec un message clair", async () => {
    await boss.post(`${AP}/patterns/${pid}/supprimer`, {});
    db.prepare("INSERT INTO appearance_patterns (name, sections) VALUES ('Bloc historique', '[]')").run();
    await boss.post(`${T}/actions`, { action: "restaurer", items: `pattern:${pid}`, retour: T });
    assert.ok(one("SELECT deleted_at FROM appearance_patterns WHERE id = ?", pid).deleted_at, "toujours à la corbeille");
    assert.match(flashOf((await boss.get(T)).text), /Aucun élément n(?:'|&#39;)a été traité/);
    db.prepare("DELETE FROM appearance_patterns WHERE name = 'Bloc historique' AND deleted_at IS NULL").run();
  });
  test("suppression définitive : seulement depuis la corbeille ; l'historique du pattern part avec lui", async () => {
    await boss.post(`${AP}/patterns`, { page_id: String(src), section_index: "0", name: "Éphémère" });
    const e = one("SELECT id FROM appearance_patterns WHERE name = 'Éphémère'").id;
    await boss.post(`${T}/actions`, { action: "supprimer", items: `pattern:${e}`, retour: T });
    assert.ok(one("SELECT 1 FROM appearance_patterns WHERE id = ?", e), "pas encore à la corbeille : refusé");
    await boss.post(`${AP}/patterns/${e}/supprimer`, {});
    await boss.post(`${T}/actions`, { action: "supprimer", items: `pattern:${e}`, retour: T });
    assert.equal(one("SELECT 1 FROM appearance_patterns WHERE id = ?", e), undefined);
    assert.equal(q("SELECT 1 FROM cms_revisions WHERE content_type = 'pattern' AND content_id = ?", e).length, 0);
  });
});

describe("corbeille commune", () => {
  test("pages, articles, médias, commentaires et patterns supprimés sont listés (vraies données), avec effectifs par type", async () => {
    const page = await newPage("Page à supprimer");
    await boss.post(`/marketing/pages/${page}/archiver`, {});
    const post = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, deleted_at, author_id) VALUES ('tr-art', 'Article supprimé', 'x', 'html', 'draft', 0, datetime('now'), ?)").run(bossId).lastInsertRowid);
    const mid = Number(db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, deleted_at) VALUES (?, 'image', 'image', '/uploads/marketing/1/x.png', 'x.png', 'image/png', 10, datetime('now'))").run(orgId).lastInsertRowid);
    const livePost = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at) VALUES ('tr-live', 'Article vivant', 'x', 'html', 'published', 1, datetime('now'))").run().lastInsertRowid);
    const cid = Number(db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, body, status) VALUES (?, 'post', ?, 'Invité', 'Commentaire supprimé', 'trash')").run(livePost, livePost).lastInsertRowid);
    const r = await boss.get(T);
    assert.equal(r.status, 200);
    for (const text of ["Page à supprimer", "Article supprimé", "x.png", "Commentaire supprimé"]) assert.match(r.text, new RegExp(text));
    assert.doesNotMatch(r.text, /Article vivant/);
    assert.match((await boss.get(`${T}?type=media`)).text, /x\.png/); assert.doesNotMatch((await boss.get(`${T}?type=media`)).text, /Page à supprimer/);
    assert.match((await boss.get(`${T}?q=supprim`)).text, /Article supprimé/);
    Object.assign(globalThis, { __trash: { page, post, mid, cid, livePost } });
  });
  test("restaurer : chaque type reprend son état (page et article restent HORS LIGNE, jamais republiés d'office)", async () => {
    const { page, post, mid, cid } = globalThis.__trash;
    await boss.post(`${T}/actions`, { action: "restaurer", items: [`page:${page}`, `post:${post}`, `media:${mid}`, `comment:${cid}`], retour: T });
    assert.equal(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", page).archived_at, null);
    assert.notEqual(one("SELECT status FROM mk_landing_pages WHERE id = ?", page).status, "published");
    assert.equal(one("SELECT deleted_at FROM posts WHERE id = ?", post).deleted_at, null);
    assert.equal(one("SELECT published FROM posts WHERE id = ?", post).published, 0);
    assert.equal(one("SELECT deleted_at FROM mk_media WHERE id = ?", mid).deleted_at, null);
    assert.notEqual(one("SELECT status FROM blog_comments WHERE id = ?", cid).status, "trash");
    assert.match(flashOf((await boss.get(T)).text), /4 éléments restaurés/);
  });
  test("dépendance disparue : un commentaire dont l'article est à la corbeille, une page dont le site est archivé — restauration bloquée et expliquée", async () => {
    const { livePost, cid } = globalThis.__trash;
    db.prepare("UPDATE blog_comments SET status = 'trash' WHERE id = ?").run(cid);
    db.prepare("UPDATE posts SET deleted_at = datetime('now') WHERE id = ?").run(livePost);
    await boss.post(`${T}/actions`, { action: "restaurer", items: `comment:${cid}`, retour: T });
    assert.equal(one("SELECT status FROM blog_comments WHERE id = ?", cid).status, "trash");
    assert.match(flashOf((await boss.get(T)).text), /Aucun élément n(?:'|&#39;)a été traité/);
    const siteId = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, tokens, status) VALUES (?, 'Site archivé', '{}', 'archived')").run(orgId).lastInsertRowid);
    const pg = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, archived_at) VALUES (?, 'Page du site archivé', 'page-site-archive', 't', 'draft', ?, datetime('now'))").run(orgId, siteId).lastInsertRowid);
    await boss.post(`${T}/actions`, { action: "restaurer", items: `page:${pg}`, retour: T });
    assert.ok(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", pg).archived_at, "pas de page cassée restaurée dans un site archivé");
    db.prepare("UPDATE posts SET deleted_at = NULL WHERE id = ?").run(livePost);
  });
  test("avertissement non bloquant : un article dont l'image de couverture a disparu est restauré, avec le problème signalé", async () => {
    const post = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, deleted_at, cover_path) VALUES ('tr-img', 'Article sans image', 'x', 'html', 'draft', 0, datetime('now'), '/uploads/thumbnails/disparue.png')").run().lastInsertRowid);
    await boss.post(`${T}/actions`, { action: "restaurer", items: `post:${post}`, retour: T });
    assert.equal(one("SELECT deleted_at FROM posts WHERE id = ?", post).deleted_at, null);
    assert.match(flashOf((await boss.get(T)).text), /points à vérifier|image de couverture/i);
  });
  test("suppression définitive : irréversible et demandée explicitement (confirmation dans l'interface), seulement depuis la corbeille", async () => {
    const post = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, deleted_at) VALUES ('tr-purge', 'À purger', 'x', 'html', 'draft', 0, datetime('now'))").run().lastInsertRowid);
    assert.match((await boss.get(T)).text, /Cette action est irréversible/);
    await boss.post(`${T}/actions`, { action: "supprimer", items: `post:${post}`, retour: T });
    assert.equal(one("SELECT 1 FROM posts WHERE id = ?", post), undefined);
    const live = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published) VALUES ('tr-noop', 'Pas à la corbeille', 'x', 'html', 'draft', 0)").run().lastInsertRowid);
    await boss.post(`${T}/actions`, { action: "supprimer", items: `post:${live}`, retour: T });
    assert.ok(one("SELECT 1 FROM posts WHERE id = ?", live), "un article hors corbeille ne se supprime pas définitivement");
  });
  test("droits : l'éditeur restaure mais ne supprime pas définitivement ; le lecteur n'ouvre pas la corbeille ; un simple membre non plus", async () => {
    const editor = await person("editor"), viewer = await person("viewer"), plain = await person();
    const post = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, deleted_at) VALUES ('tr-droits', 'Droits corbeille', 'x', 'html', 'draft', 0, datetime('now'))").run().lastInsertRowid);
    const media = Number(db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, deleted_at) VALUES (?, 'image', 'image', '/uploads/marketing/1/d.png', 'd.png', 'image/png', 10, datetime('now'))").run(orgId).lastInsertRowid);
    assert.equal((await viewer.get(T)).status, 403); assert.equal((await plain.get(T)).status, 403); assert.notEqual((await anon.get(T)).status, 200);
    assert.equal((await viewer.post(`${T}/actions`, { action: "restaurer", items: `post:${post}` })).status, 403);
    await editor.post(`${T}/actions`, { action: "supprimer", items: [`post:${post}`, `media:${media}`] });
    assert.ok(one("SELECT 1 FROM posts WHERE id = ?", post), "articles.delete est réservé aux administrateurs");
    assert.ok(one("SELECT 1 FROM mk_media WHERE id = ?", media), "media.delete est réservé aux administrateurs");
    await editor.post(`${T}/actions`, { action: "restaurer", items: `post:${post}` });
    assert.equal(one("SELECT deleted_at FROM posts WHERE id = ?", post).deleted_at, null, "l'éditeur restaure");
    const admin = await person("admin");
    db.prepare("UPDATE posts SET deleted_at = datetime('now') WHERE id = ?").run(post);
    await admin.post(`${T}/actions`, { action: "supprimer", items: `post:${post}` });
    assert.equal(one("SELECT 1 FROM posts WHERE id = ?", post), undefined, "l'administrateur supprime définitivement");
  });
  test("actions groupées honnêtes : les éléments refusés sont comptés et expliqués", async () => {
    const a = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, deleted_at) VALUES ('tr-g1', 'Groupe A', 'x', 'html', 'draft', 0, datetime('now'))").run().lastInsertRowid);
    await boss.post(`${T}/actions`, { action: "restaurer", items: [`post:${a}`, "post:999999", "inconnu:1", "page:999999"], retour: T });
    const f = flashOf((await boss.get(T)).text);
    assert.match(f, /1 élément restauré/); assert.match(f, /refusé/);
    assert.equal(one("SELECT deleted_at FROM posts WHERE id = ?", a).deleted_at, null);
  });
});

describe("droits, accès entre sites, appels directs", () => {
  let siteA, siteB, pageA, pageB, userA;
  before(async () => {
    siteA = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, tokens) VALUES (?, 'Site A', '{}')").run(orgId).lastInsertRowid);
    siteB = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, tokens) VALUES (?, 'Site B', '{}')").run(orgId).lastInsertRowid);
    pageA = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, 'Page A', 'page-rev-a', 't', 'draft', ?)").run(orgId, siteA).lastInsertRowid);
    pageB = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, 'Page B', 'page-rev-b', 't', 'draft', ?)").run(orgId, siteB).lastInsertRowid);
    userA = await person();
    await boss.post(`/marketing/site-web/utilisateurs/${idOf(userA)}/sites`, { site_id: String(siteA), role: "editor" });
  });
  test("lecteur : pas d'historique ; éditeur : voit et restaure ; seul l'administrateur supprime des points", async () => {
    const viewer = await person("viewer"), editor = await person("editor");
    const p = await newPage("Droits historique");
    await saveDraft(p, "Un"); newPoint("page", p); await saveDraft(p, "Deux");
    const ref = `r:${one("SELECT id FROM cms_revisions WHERE content_type = 'page' AND content_id = ? ORDER BY id LIMIT 1", p).id}`;
    assert.equal((await viewer.get(`${H}/page/${p}`)).status, 403);
    assert.equal((await viewer.post(`${H}/page/${p}/restaurer`, { ref })).status, 403);
    assert.equal((await editor.get(`${H}/page/${p}`)).status, 200);
    await editor.post(`${H}/page/${p}/restaurer`, { ref });
    assert.equal(draftText(p), "Un");
  });
  test("utilisateur du site A : historique de ses pages oui, de celles du site B jamais — lecture, comparaison, restauration, aperçu", async () => {
    assert.equal((await userA.get(`${H}/page/${pageA}`)).status, 200);
    for (const path of [`${H}/page/${pageB}`, `${H}/page/${pageB}/version?ref=draft`, `${H}/page/${pageB}/comparer?a=live&b=draft`, `/marketing/pages/${pageB}/revisions/1/apercu`]) assert.equal((await userA.get(path)).status, 403, path);
    assert.equal((await userA.post(`${H}/page/${pageB}/restaurer`, { ref: "draft" })).status, 403);
    for (const path of [T, `${H}/appearance/0`, `${H}/post/1`]) assert.notEqual((await userA.get(path)).status, 200, path);
  });
  test("identifiants et types manipulés : 404 ou refus, jamais de contenu d'un autre", async () => {
    assert.equal((await boss.get(`${H}/inconnu/1`)).status, 404);
    assert.equal((await boss.get(`${H}/page/99999`)).status, 404);
    assert.equal((await boss.get(`${H}/page/abc`)).status, 404);
    assert.equal((await boss.post(`${H}/page/99999/restaurer`, { ref: "draft" })).status, 404);
    assert.equal((await anon.get(`${H}/page/${pageA}`)).status, 302);
  });
  test("aucune route ne modifie une révision existante : seuls restaurer (nouveau point) et supprimer un brouillon existent", async () => {
    const row = one("SELECT id, data FROM cms_revisions WHERE content_type = 'page' LIMIT 1");
    for (const method of ["PUT", "PATCH", "DELETE"]) assert.notEqual((await boss.request(`${H}/page/${pageA}/version`, { method })).status, 200);
    assert.equal(one("SELECT data FROM cms_revisions WHERE id = ?", row.id).data, row.data);
  });
  test("performance : un historique de 300 points s'affiche vite et l'ouverture de la page ne le charge pas", async () => {
    const p = await newPage("Page performance");
    db.exec("BEGIN");
    const ins = db.prepare("INSERT INTO cms_revisions (content_type, content_id, kind, label, data, fingerprint) VALUES ('page', ?, 'restore', 'Point', '{}', ?)");
    for (let i = 0; i < 300; i++) ins.run(p, `perf${i}`);
    db.exec("COMMIT");
    let t0 = Date.now();
    const r = await boss.get(`${H}/page/${p}`);
    assert.equal(r.status, 200); assert.ok(Date.now() - t0 < 3000, `${Date.now() - t0} ms`);
    t0 = Date.now();
    const editor = await boss.get(`/marketing/pages/${p}`);
    assert.equal(editor.status, 200); assert.doesNotMatch(editor.text, /Point/, "la fiche de la page ne charge pas l'historique");
    assert.ok(Date.now() - t0 < 3000);
  });
});

describe("données sensibles", () => {
  test("l'historique de l'apparence et des patterns ne contient ni mot de passe ni jeton ni secret", () => {
    const all = q("SELECT data FROM cms_revisions UNION ALL SELECT config FROM appearance_revisions").map((r) => r.data).join("\n");
    const found = all.match(/.{0,40}(password|passwd|secret|api[_-]?key|token":"|\$2[aby]\$).{0,40}/i);
    assert.equal(found, null, found ? found[0] : "");
  });
});
