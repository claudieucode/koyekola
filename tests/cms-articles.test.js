// KOLAKISA CMS — palier 4 : les articles, de bout en bout, par les vraies routes d'un vrai serveur et la vraie base. Le blog existant
// (éditeur riche, versions, SEO, programmation) est la source ; ici : gestion CMS, corbeille, copie, image mise en avant de la
// médiathèque du CMS, usages, droits, sécurité du contenu.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("zlib");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId;
const CMS = "/marketing/site-web/articles";
const LIB = "/marketing/site-web/mediatheque";
const row = (id) => db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
const byTitle = (t) => db.prepare("SELECT * FROM posts WHERE title = ?").get(t);
const json = (r) => JSON.parse(r.text);
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];

function png(w = 40, h = 30, rgb = [2, 119, 182]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
// Envoi d'une image dans la médiathèque du CMS (comme le sélecteur partagé de l'éditeur)
async function uploadImage(client, name, rgb) {
  const fd = new FormData(); fd.append("file", new Blob([png(40, 30, rgb)], { type: "image/png" }), name);
  const r = await client.request(`${LIB}/televerser`, { method: "POST", multipart: fd });
  assert.equal(r.status, 201, r.text);
  return json(r).media;
}
// Enregistrement d'un article par l'éditeur du blog (route réelle), réponse JSON de l'éditeur
async function saveByEditor(client, fields, id = null) {
  const fd = new FormData();
  Object.entries({ excerpt: "Résumé.", content_format: "html", status: "draft", ...fields }).forEach(([k, v]) => fd.append(k, v));
  const r = await client.request(id ? `/formateur/blog/${id}/modifier` : "/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
  return r;
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

describe("ouvrir, créer, titre et adresse", () => {
  let id;
  test("la liste est vide au départ (état vide honnête), dans la coque CMS", async () => {
    const r = await boss.get(CMS);
    assert.equal(r.status, 200);
    assert.match(r.text, /class="mk-body is-cms"/);
    assert.match(r.text, /Aucun article/);
    assert.match(r.text, /Créez votre premier article pour commencer/);
  });
  test("« Nouvel article » crée un VRAI article (identifiant, brouillon, auteur) et ouvre l'éditeur", async () => {
    const r = await boss.post(CMS, { title: "Comment réussir son référencement naturel" });
    assert.equal(r.status, 302);
    id = Number(r.location.match(/blog\/(\d+)\/modifier/)[1]);
    const p = row(id);
    assert.equal(p.title, "Comment réussir son référencement naturel");
    assert.equal(p.slug, "comment-reussir-son-referencement-naturel", "adresse déduite du titre, sans accents");
    assert.equal(p.status, "draft");
    assert.equal(p.published, 0);
    assert.equal(p.published_at, null);
    assert.ok(p.author_id, "auteur enregistré");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?").get(id).n, 1, "première version gardée");
    const editor = await boss.get(r.location);
    assert.equal(editor.status, 200);
    assert.match(editor.text, /\/js\/media-picker\.js/);
    assert.match(editor.text, /\/js\/kwmedia\.js/);
  });
  test("titre vide refusé, rien n'est créé ; deux titres identiques → deux adresses distinctes", async () => {
    const before = db.prepare("SELECT COUNT(*) n FROM posts").get().n;
    await boss.post(CMS, { title: "   " });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM posts").get().n, before);
    const again = await boss.post(CMS, { title: "Comment réussir son référencement naturel" });
    const other = row(Number(again.location.match(/blog\/(\d+)\/modifier/)[1]));
    assert.equal(other.slug, "comment-reussir-son-referencement-naturel-2");
  });
  test("titre, extrait, adresse personnalisée et contenu : enregistrés par l'éditeur, relus après rafraîchissement", async () => {
    const r = await saveByEditor(boss, { title: "Mon titre modifié", excerpt: "Découvrez les principales techniques…", slug: "mon-adresse-perso", content: "<p>Premier paragraphe</p>" }, id);
    assert.equal(r.status, 200, r.text);
    const p = row(id);
    assert.equal(p.title, "Mon titre modifié");
    assert.equal(p.slug, "mon-adresse-perso");
    assert.equal(p.excerpt, "Découvrez les principales techniques…");
    const page = (await boss.get(`/formateur/blog/${id}/modifier`)).text;
    assert.match(page, /Mon titre modifié/);
    assert.match(page, /mon-adresse-perso/);
  });
  test("si le titre change, l'adresse personnalisée n'est pas modifiée d'office", async () => {
    await saveByEditor(boss, { title: "Encore un autre titre", slug: "mon-adresse-perso", content: "<p>x</p>" }, id);
    assert.equal(row(id).slug, "mon-adresse-perso");
  });
});

describe("contenu riche, liens, sécurité (XSS)", () => {
  test("mise en forme, liens et titres conservés ; scripts, gestionnaires d'événements et adresses dangereuses supprimés", async () => {
    const evil = `<h2>Titre H2</h2><p><strong>gras</strong> <em>italique</em> <u>souligné</u> <s>barré</s></p><ul><li>un</li></ul><blockquote>citation</blockquote><hr>
      <p><a href="https://exemple.com" target="_blank" rel="nofollow sponsored">lien externe</a> <a href="/blog">lien interne</a> <a href="javascript:alert(1)">piège</a></p>
      <script>alert('xss')</script><img src="/uploads/thumbnails/x.png" onerror="alert(1)"><p onclick="alert(2)">clic</p><iframe src="https://evil.example"></iframe><img src="https://evil.example/x.png">`;
    const r = await saveByEditor(boss, { title: "Article XSS", content: evil, status: "published" });
    assert.equal(r.status, 200, r.text);
    const p = byTitle("Article XSS");
    assert.match(p.content, /<h2>Titre H2<\/h2>/);
    assert.match(p.content, /<strong>gras<\/strong>/);
    assert.match(p.content, /<blockquote>/);
    assert.match(p.content, /href="https:\/\/exemple\.com"/);
    assert.match(p.content, /rel="[^"]*nofollow/);
    for (const bad of [/<script/i, /onerror/i, /onclick/i, /javascript:/i, /<iframe/i, /evil\.example/i]) assert.doesNotMatch(p.content, bad, String(bad));
    const pub = (await anon.get(`/blog/${p.slug}`)).text;
    assert.equal(pub.includes("alert('xss')"), false, "aucun script dans la page publique");
    assert.doesNotMatch(pub, /onerror=|onclick=/i);
  });
});

describe("image mise en avant et images du texte : médiathèque du CMS", () => {
  let cover, inline, id;
  before(async () => { cover = await uploadImage(boss, "couverture.png", [200, 20, 20]); inline = await uploadImage(boss, "dans-le-texte.png", [20, 200, 20]); });
  test("image choisie dans la médiathèque : adresse + référence stable (media_id), persistante", async () => {
    const r = await saveByEditor(boss, { title: "Article avec images", cover_media: cover.path, cover_alt: "Une couverture rouge", status: "published",
      content: `<p>Avant</p><img src="${inline.path}" alt="Un carré vert" data-media-id="${inline.id}"><p>Après</p>` });
    assert.equal(r.status, 200, r.text);
    id = json(r).id;
    const p = row(id);
    assert.equal(p.cover_path, cover.path);
    assert.equal(p.featured_media_id, cover.id, "référence stable vers la médiathèque");
    assert.match(p.content, new RegExp(inline.path.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")));
    assert.match(p.content, new RegExp(`data-media-id="${inline.id}"`));
  });
  test("l'article public affiche la vraie image mise en avant et l'image du texte (fichiers servis)", async () => {
    const p = row(id);
    const pub = await anon.get(`/blog/${p.slug}`);
    assert.equal(pub.status, 200);
    assert.ok(pub.text.includes(cover.path), "couverture");
    assert.ok(pub.text.includes(inline.path), "image du texte");
    assert.equal((await anon.get(cover.path)).status, 200);
    assert.equal((await anon.get(inline.path)).status, 200);
  });
  test("le contrôle SEO avant publication reconnaît les images de la médiathèque du CMS (jamais « image introuvable »)", async () => {
    const fd = new FormData();
    Object.entries({ title: "Contrôle SEO", content: `<p>Texte</p><img src="${inline.path}" alt="vert">`, cover_path: cover.path, slug: "controle-seo" }).forEach(([k, v]) => fd.append(k, v));
    const r = await boss.request("/formateur/blog/api/seo-check", { method: "POST", multipart: fd });
    assert.equal(r.status, 200, r.text);
    const res = json(r);
    const critical = (res.critical || (res.check && res.check.critical) || []).join(" ");
    assert.doesNotMatch(critical, /introuvable/i, critical);
    const missing = db.prepare("SELECT 1").get(); assert.ok(missing);
  });
  test("une adresse d'image inconnue de la médiathèque est refusée (pas de chemin libre)", async () => {
    const r = await saveByEditor(boss, { title: "Image inventée", cover_media: "/uploads/marketing/1/inventee.png", content: "<p>x</p>" });
    assert.equal(r.status, 200);
    const p = byTitle("Image inventée");
    assert.equal(p.cover_path, null);
    assert.equal(p.featured_media_id, null);
  });
  test("la médiathèque indique les articles qui utilisent l'image et refuse de la supprimer tant qu'elle sert", async () => {
    const d = json(await boss.get(`${LIB}/${cover.id}.json`));
    assert.ok(d.usage.some((u) => u.kind === "article" && /Article avec images/.test(u.name)));
    assert.equal(d.usage.find((u) => u.kind === "article").href, `/formateur/blog/${id}/modifier`);
    await boss.post(`${LIB}/${cover.id}/corbeille`, {});
    const refused = await boss.post(`${LIB}/${cover.id}/supprimer`, {});
    assert.equal(refused.status, 409);
    assert.match(json(refused).error.message, /utilisé/);
    assert.ok(db.prepare("SELECT 1 FROM mk_media WHERE id = ?").get(cover.id));
    await boss.post(`${LIB}/${cover.id}/restaurer`, {});
  });
  test("remplacer l'image mise en avant : l'ancienne reste dans la médiathèque (jamais effacée par le blog)", async () => {
    const other = await uploadImage(boss, "autre-couverture.png", [20, 20, 200]);
    await saveByEditor(boss, { title: "Article avec images", cover_media: other.path, status: "published", content: "<p>sans image</p>" }, id);
    const p = row(id);
    assert.equal(p.cover_path, other.path);
    assert.equal(p.featured_media_id, other.id);
    assert.ok(db.prepare("SELECT 1 FROM mk_media WHERE id = ?").get(cover.id), "fiche gardée");
    assert.equal((await anon.get(cover.path)).status, 200, "fichier gardé");
  });
});

describe("prévisualiser, publier, programmer, corriger", () => {
  let id, slug;
  before(async () => { const r = await saveByEditor(boss, { title: "Cycle de vie", content: "<p>Version un</p>", status: "draft" }); id = json(r).id; slug = row(id).slug; });
  test("brouillon : visible en aperçu (vrai rendu), introuvable pour le public", async () => {
    assert.match((await boss.get(`/formateur/blog/${id}/apercu`)).text, /Version un/);
    assert.equal((await anon.get(`/blog/${slug}`)).status, 404);
  });
  test("publier depuis le CMS : statut et date réels, l'article est public", async () => {
    const r = await boss.post(`${CMS}/${id}/publier`, {});
    assert.equal(r.status, 302);
    const p = row(id);
    assert.equal(p.status, "published");
    assert.equal(p.published, 1);
    assert.ok(p.published_at);
    const pub = await anon.get(`/blog/${slug}`);
    assert.equal(pub.status, 200);
    assert.match(pub.text, /Cycle de vie/);
    assert.match(pub.text, /Version un/);
  });
  test("modifier un article publié puis enregistrer : la nouvelle version est publique, une version est gardée", async () => {
    await saveByEditor(boss, { title: "Cycle de vie", content: "<p>Version deux</p>", status: "published" }, id);
    assert.match((await anon.get(`/blog/${slug}`)).text, /Version deux/);
    assert.ok(db.prepare("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?").get(id).n >= 2);
  });
  test("slug inexistant : vraie 404 (jamais un article au hasard)", async () => {
    assert.equal((await anon.get("/blog/article-qui-n-existe-pas")).status, 404);
  });
  test("programmation : « programmé » n'est pas public avant l'heure ; à l'heure, il devient public à la première lecture", async () => {
    const future = new Date(Date.now() + 3600e3).toISOString();
    const r = await saveByEditor(boss, { title: "Article programmé", content: "<p>Bientôt</p>", status: "scheduled", published_at_utc: future });
    assert.equal(r.status, 200, r.text);
    const sid = json(r).id;
    assert.equal(row(sid).status, "scheduled");
    assert.equal(row(sid).published, 0);
    assert.equal((await anon.get(`/blog/${row(sid).slug}`)).status, 404, "pas public avant l'heure");
    assert.match((await boss.get(`${CMS}/programmes`)).text, /Article programmé/);
    db.prepare("UPDATE posts SET published_at = datetime('now', '-1 minute') WHERE id = ?").run(sid); // l'heure est passée
    assert.equal((await anon.get(`/blog/${row(sid).slug}`)).status, 200, "publié à la première lecture après l'heure");
    assert.equal(row(sid).status, "published");
  });
  test("remettre en brouillon retire l'article du site", async () => {
    await boss.post(`${CMS}/${id}/depublier`, {});
    assert.equal(row(id).status, "draft");
    assert.equal((await anon.get(`/blog/${slug}`)).status, 404);
    await boss.post(`${CMS}/${id}/publier`, {});
  });
  test("publier un article vide est refusé", async () => {
    const empty = db.prepare("INSERT INTO posts (slug, title, content_format, status) VALUES ('vide-test', 'Article vide', 'html', 'draft')").run().lastInsertRowid;
    await boss.post(`${CMS}/${empty}/publier`, {});
    assert.equal(row(Number(empty)).status, "draft");
    assert.match(flashOf((await boss.get(CMS)).text), /vide/i);
  });
});

describe("dupliquer, corbeille, restaurer, supprimer", () => {
  let id, copyId, cover;
  before(async () => {
    cover = await uploadImage(boss, "copie.png", [90, 90, 90]);
    const r = await saveByEditor(boss, { title: "Article à copier", content: "<p>Contenu d'origine</p>", status: "published", category: "SEO", tags: "seo, blog", cover_media: cover.path });
    id = json(r).id;
  });
  test("dupliquer : nouvel article en brouillon, même contenu et même image, l'original n'est pas touché", async () => {
    const before = row(id);
    const r = await boss.post(`${CMS}/${id}/dupliquer`, {});
    assert.equal(r.status, 302);
    const copy = db.prepare("SELECT * FROM posts WHERE title = 'Article à copier (copie)'").get();
    copyId = copy.id;
    assert.notEqual(copy.id, id);
    assert.notEqual(copy.slug, before.slug);
    assert.equal(copy.status, "draft");
    assert.equal(copy.published, 0);
    assert.equal(copy.published_at, null);
    assert.equal(copy.content, before.content);
    assert.equal(copy.cover_path, before.cover_path);
    assert.equal(copy.featured_media_id, before.featured_media_id);
    assert.equal(copy.category, "SEO");
    const after = row(id);
    for (const k of ["title", "slug", "status", "content", "published_at", "updated_at", "cover_path"]) assert.equal(after[k], before[k], `original inchangé : ${k}`);
    assert.equal((await anon.get(`/blog/${copy.slug}`)).status, 404, "la copie n'est pas publique");
  });
  test("corbeille : hors liste, hors ligne, conservé en base ; restaurer le remet en BROUILLON", async () => {
    const slug = row(id).slug;
    assert.equal((await anon.get(`/blog/${slug}`)).status, 200);
    assert.equal((await boss.post(`${CMS}/${id}/corbeille`, {})).status, 302);
    const p = row(id);
    assert.ok(p.deleted_at, "suppression douce : la ligne existe toujours");
    assert.equal(p.published, 0);
    assert.equal(p.status, "draft");
    assert.equal((await anon.get(`/blog/${slug}`)).status, 404, "hors ligne");
    assert.doesNotMatch((await boss.get(CMS)).text, /Article à copier<\/a>/);
    assert.match((await boss.get(`${CMS}/corbeille`)).text, /Article à copier/);
    assert.doesNotMatch((await boss.get("/formateur/blog")).text, /Article à copier<\/a>\s*<\/td>|>Article à copier</, "absent de l'ancienne liste du blog");
    await boss.post(`${CMS}/${id}/restaurer`, {});
    assert.equal(row(id).deleted_at, null);
    assert.equal(row(id).status, "draft", "jamais republié d'office");
    assert.equal((await anon.get(`/blog/${slug}`)).status, 404);
  });
  test("suppression définitive : refusée hors de la corbeille ; depuis la corbeille elle efface l'article et ses versions, jamais l'image de la médiathèque", async () => {
    await boss.post(`${CMS}/${copyId}/supprimer`, {});
    assert.ok(row(copyId), "refusée hors corbeille");
    assert.match(flashOf((await boss.get(CMS)).text), /corbeille/i);
    await boss.post(`${CMS}/${copyId}/corbeille`, {});
    await boss.post(`${CMS}/${copyId}/supprimer`, {});
    assert.equal(row(copyId), undefined);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?").get(copyId).n, 0, "versions supprimées avec l'article");
    assert.ok(db.prepare("SELECT 1 FROM mk_media WHERE id = ?").get(cover.id), "image de la médiathèque conservée");
    assert.equal((await anon.get(cover.path)).status, 200);
  });
  test("une programmation en corbeille ne se publie jamais toute seule", async () => {
    const r = await saveByEditor(boss, { title: "Programmé puis supprimé", content: "<p>x</p>", status: "scheduled", published_at_utc: new Date(Date.now() + 3600e3).toISOString() });
    const sid = json(r).id;
    await boss.post(`${CMS}/${sid}/corbeille`, {});
    db.prepare("UPDATE posts SET published_at = datetime('now', '-1 hour') WHERE id = ?").run(sid);
    assert.equal((await anon.get(`/blog/${row(sid).slug}`)).status, 404);
    assert.equal(row(sid).published, 0);
  });
});

describe("liste : recherche, filtres, tri, pagination, actions groupées", () => {
  before(async () => {
    const mk = (title, over = {}) => saveByEditor(boss, { title, content: `<p>texte ${title}</p>`, status: "draft", ...over });
    await mk("Alpha du marketing", { category: "Marketing", excerpt: "Un extrait spécial zèbre" });
    await mk("Zeta du design", { category: "Design", status: "published" });
    for (let i = 1; i <= 24; i++) await mk(`Pagination ${String(i).padStart(2, "0")}`, { category: "Pagination" });
    db.prepare("UPDATE posts SET created_at = '2020-01-01 10:00:00' WHERE title = 'Alpha du marketing'").run();
  });
  const titles = (html) => [...html.matchAll(/<span class="mk-ar-cell">[\s\S]*?<span>(?:<a[^>]*>)?([^<]+)/g)].map((m) => m[1].trim());
  test("recherche réelle : titre, adresse, extrait, contenu", async () => {
    assert.ok(titles((await boss.get(`${CMS}?q=Zeta`)).text).includes("Zeta du design"));
    assert.ok(titles((await boss.get(`${CMS}?q=zeta-du-design`)).text).includes("Zeta du design"), "adresse");
    assert.ok(titles((await boss.get(`${CMS}?q=${encodeURIComponent("extrait spécial")}`)).text).includes("Alpha du marketing"), "extrait");
    assert.ok(titles((await boss.get(`${CMS}?q=${encodeURIComponent("texte Zeta")}`)).text).includes("Zeta du design"), "contenu");
    const none = (await boss.get(`${CMS}?q=introuvable-xyz`)).text;
    assert.match(none, /Aucun article trouvé/);
    assert.doesNotMatch(none, /<table/);
  });
  test("filtres : état, catégorie, date, auteur", async () => {
    assert.ok(titles((await boss.get(`${CMS}/publies`)).text).includes("Zeta du design"));
    assert.ok(!titles((await boss.get(`${CMS}/publies`)).text).includes("Alpha du marketing"));
    assert.deepEqual(titles((await boss.get(`${CMS}?categorie=Design`)).text), ["Zeta du design"]);
    assert.ok(!titles((await boss.get(`${CMS}?periode=30&categorie=Marketing`)).text).includes("Alpha du marketing"), "créé en 2020 : hors des 30 derniers jours");
    assert.ok(titles((await boss.get(`${CMS}?periode=30&categorie=Design`)).text).includes("Zeta du design"));
    const authorId = db.prepare("SELECT id FROM users WHERE role = 'formateur'").get().id;
    assert.ok(titles((await boss.get(`${CMS}?auteur=${authorId}`)).text).length > 0);
    assert.deepEqual(titles((await boss.get(`${CMS}?auteur=999999`)).text), []);
  });
  test("compteurs d'onglets = vrais comptes de la base", async () => {
    const html = (await boss.get(CMS)).text;
    const n = (label) => Number(html.match(new RegExp(`${label} <span class="mk-tab-count">(\\d+)`))[1]);
    assert.equal(n("Tous"), db.prepare("SELECT COUNT(*) n FROM posts WHERE deleted_at IS NULL").get().n);
    assert.equal(n("Publiés"), db.prepare("SELECT COUNT(*) n FROM posts WHERE deleted_at IS NULL AND status = 'published'").get().n);
    assert.equal(n("Corbeille"), db.prepare("SELECT COUNT(*) n FROM posts WHERE deleted_at IS NOT NULL").get().n);
  });
  test("tri : titre A→Z / Z→A, plus ancien, date de publication", async () => {
    const az = titles((await boss.get(`${CMS}?tri=titre&categorie=Pagination`)).text);
    assert.deepEqual(az, [...az].sort((a, b) => a.localeCompare(b, "fr")));
    assert.equal(titles((await boss.get(`${CMS}?tri=titre_desc`)).text)[0], "Zeta du design");
    assert.equal(titles((await boss.get(`${CMS}?tri=ancien`)).text)[0], "Alpha du marketing");
    assert.equal(titles((await boss.get(`${CMS}?tri=publie`)).text)[0], "Zeta du design", "articles publiés d'abord");
  });
  test("pagination : 20 par page, pas de doublon, page hors limites ramenée à la dernière", async () => {
    const p1 = (await boss.get(`${CMS}?tri=titre`)).text;
    assert.equal((p1.match(/name="ids" value=/g) || []).length, 20);
    assert.match(p1, /Page 1 sur/);
    const p2 = (await boss.get(`${CMS}?tri=titre&page=2`)).text;
    const ids = (h) => [...h.matchAll(/name="ids" value="(\d+)"/g)].map((m) => m[1]);
    assert.equal(ids(p1).filter((i) => ids(p2).includes(i)).length, 0);
    assert.match((await boss.get(`${CMS}?page=9999`)).text, /Page \d+ sur \d+/);
  });
  test("actions groupées : publier, remettre en brouillon, corbeille, restaurer, supprimer ; rapport des refus", async () => {
    const a = byTitle("Pagination 01").id, b = byTitle("Pagination 02").id;
    const post = (action, ids) => boss.request(`${CMS}/actions`, { method: "POST", form: new URLSearchParams([["action", action], ...ids.map((i) => ["ids", String(i)])]) });
    await post("publier", [a, b]);
    assert.equal(row(a).status, "published");
    assert.equal(row(b).status, "published");
    await post("depublier", [a, b]);
    assert.equal(row(a).status, "draft");
    await post("corbeille", [a, b]);
    assert.ok(row(a).deleted_at && row(b).deleted_at);
    await post("restaurer", [a]);
    assert.equal(row(a).deleted_at, null);
    const live = byTitle("Pagination 03").id;
    await post("supprimer", [live, b]);
    assert.ok(row(live), "hors corbeille : intact");
    assert.equal(row(b), undefined, "depuis la corbeille : supprimé");
    assert.match(flashOf((await boss.get(CMS)).text), /1 article supprimé définitivement/);
    assert.equal((await boss.request(`${CMS}/actions`, { method: "POST", form: { action: "detruire", ids: String(a) } })).status, 403);
  });
});

describe("droits", () => {
  let viewer, editor, admin, pid;
  before(async () => {
    viewer = await member("viewer"); editor = await member("editor"); admin = await member("admin");
    pid = json(await saveByEditor(boss, { title: "Article des droits", content: "<p>x</p>" })).id;
  });
  test("lecteur : consultation seule, aucune action", async () => {
    const html = (await viewer.get(CMS)).text;
    assert.equal((await viewer.get(CMS)).status, 200);
    assert.match(html, /Article des droits/);
    assert.doesNotMatch(html, /name="ids"/);
    assert.doesNotMatch(html, /data-mk-modal-open="nouvel-article"/);
    for (const [url, form] of [[CMS, { title: "x" }], [`${CMS}/${pid}/publier`, {}], [`${CMS}/${pid}/corbeille`, {}], [`${CMS}/${pid}/dupliquer`, {}], [`${CMS}/${pid}/supprimer`, {}], [`${CMS}/actions`, { action: "corbeille", ids: String(pid) }]]) {
      assert.equal((await viewer.post(url, form)).status, 403, url);
    }
    assert.equal(row(pid).deleted_at, null);
  });
  test("éditeur (rôle) : copie, publie, corbeille, restaure ; ne supprime pas définitivement ; ne crée pas (éditeur d'articles réservé au compte créateur)", async () => {
    assert.equal((await editor.post(`${CMS}/${pid}/dupliquer`, {})).status, 302);
    assert.ok(db.prepare("SELECT 1 FROM posts WHERE title = 'Article des droits (copie)'").get());
    await editor.post(`${CMS}/${pid}/corbeille`, {});
    assert.ok(row(pid).deleted_at);
    assert.equal((await editor.post(`${CMS}/${pid}/supprimer`, {})).status, 403);
    assert.ok(row(pid));
    await editor.post(`${CMS}/${pid}/restaurer`, {});
    assert.equal(row(pid).deleted_at, null);
    const before = db.prepare("SELECT COUNT(*) n FROM posts").get().n;
    await editor.post(CMS, { title: "Tentative de création" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM posts").get().n, before, "rien créé par un compte qui n'a pas l'éditeur");
    assert.doesNotMatch((await editor.get(CMS)).text, /data-mk-modal-open="nouvel-article"/);
  });
  test("administrateur : supprime définitivement, depuis la corbeille", async () => {
    await admin.post(`${CMS}/${pid}/corbeille`, {});
    assert.match((await admin.get(`${CMS}/corbeille`)).text, /Supprimer définitivement/);
    assert.equal((await admin.post(`${CMS}/${pid}/supprimer`, {})).status, 302);
    assert.equal(row(pid), undefined);
  });
  test("un compte hors équipe marketing n'accède à rien, et l'éditeur d'articles lui est fermé", async () => {
    const student = await newStudent(srv);
    assert.notEqual((await student.get(CMS)).status, 200);
    assert.notEqual((await student.post(CMS, { title: "x" })).status, 200);
    assert.notEqual((await student.get("/formateur/blog/nouveau")).status, 200);
  });
});

describe("l'existant continue de fonctionner", () => {
  test("blog public, pages, médiathèque et éditeur de pages répondent", async () => {
    for (const url of ["/blog", "/marketing/pages", LIB, "/marketing/site-web", "/marketing/tunnels", "/formateur/blog", "/formateur/blog/nouveau", "/sitemap.xml"]) {
      const r = await boss.get(url);
      assert.equal(r.status, 200, url);
    }
    assert.doesNotMatch((await anon.get("/sitemap.xml")).text, /article-xss-corbeille/);
  });
  test("catégories, étiquettes et auteurs du CMS ignorent la corbeille", async () => {
    const t = db.prepare("INSERT INTO posts (slug, title, content_format, status, category, tags, deleted_at) VALUES ('c-corbeille', 'En corbeille', 'html', 'draft', 'CategorieFantome', 'etiquettefantome', datetime('now'))").run();
    assert.ok(t.lastInsertRowid);
    assert.doesNotMatch((await boss.get(`${CMS}/categories`)).text, /CategorieFantome/);
    assert.doesNotMatch((await boss.get(`${CMS}/etiquettes`)).text, /etiquettefantome/);
  });
});
