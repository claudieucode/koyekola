// R8 lot 2 — INVENTAIRE EXACT du menu d'un site et test de chaque entrée. L'inventaire est une TABLE (ci-dessous) ; le test échoue si le menu réel s'en écarte, si une entrée du registre n'y est pas classée,
// ou si une entrée ouverte ne répond pas correctement par rôle (équipe, administrateur du site, lecteur du site, administrateur d'un autre site, anonyme) avec les seules données de SON site.
// Vrai serveur, vraie base d'essai ; les écritures passent par les adresses réelles avec le site de l'adresse.
const zlib = require("node:zlib");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const nav = require("../src/marketing/web/cmsNav");

// ── INVENTAIRE (clé du registre → décision) ───────────────────────────────────────────────────────────────────────────────────────
// ouvert        : écran réel dans le cadre du site, isolation démontrée (R5 médias, R6 contenus) ; ouvert-equipe : idem mais absent du menu d'un accès limité ; central : administration centrale (absent du menu d'un site)
// ferme (motif) : « Bientôt » visible, grisé, sans lien — l'isolation ou l'écran du site n'existe pas encore
const OUVERT = ["sites", "sitedash", "landing", "apparence", "apparence/en-tete", "apparence/pied-de-page", "redirections", "utilisateurs", "pagetests", "outils", "parametres",
  "articles", "articles/brouillons", "articles/programmes", "articles/publies", "articles/corbeille", "articles/categories", "articles/etiquettes", "articles/auteurs", "articles/ajouter", "mediatheque",
  "seo", "seo/404", "navigation", "apparence/menus", "commentaires", "commentaires/en-attente", "commentaires/approuves", "commentaires/indesirables", "commentaires/corbeille"];
const OUVERT_EQUIPE = []; // aucune entrée réservée à l'équipe pour l'instant
const CENTRAL = ["extensions", "outils/sauvegardes", "outils/systeme", "outils/logs"]; // « Extensions » (CMS-01) : activation des modules par l'équipe, depuis le principal
const MOTIFS = {
  "apparence/templates": "modèles de site complets : lot B3 non réalisé", "apparence/patterns": "blocs et patterns partagés/privés : lot B3",
  "apparence/styles": "styles par site : lot P2", "utilisateurs/ajouter": "invitations par site : lot C4", "utilisateurs/roles": "rôles : lot C4", "utilisateurs/permissions": "permissions : lot C4", "utilisateurs/invitations": "invitations : lot C4",
  // R8 lot 6C : « SEO » (réglages du site) et « Erreurs 404 » sont ouverts (isolation démontrée, seo-par-site-espace) ; les autres écrans SEO ne sont pas isolés par site
  "seo/analyse": "audit/analyse : explore l'hôte principal, équipe seulement", "seo/meta": "métadonnées de contenu : écran global", "seo/indexation": "indexation : écran global", "seo/sitemap": "plan du site : écran global", "seo/schema": "données structurées : écran global", "seo/open-graph": "partage : écran global", "seo/robots": "robots.txt : écran global (la règle supplémentaire du site est dans ses réglages SEO)",
  "redirections/liens-casses": "lot C4", "redirections/permaliens": "lot C4", corbeille: "corbeille globale : ne sera activée qu'une fois démontré qu'un site ne voit pas la corbeille d'un autre", "outils/importer": "lot C4", "outils/exporter": "lot C4",
  "outils/diagnostic": "lot C4", "outils/maintenance": "lot C4", "outils/cache": "lot C4", "outils/contenu": "lot C4",
};
for (const k of ["lecture", "commentaires", "medias", "permaliens", "seo", "confidentialite", "indexation", "emailing", "tunnels", "avance"]) MOTIFS[`parametres/${k}`] = "réglages détaillés par site : lot C4";

const png = (() => {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  return (w, h, rgb) => { const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3); return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]); };
})();

describe("inventaire : le menu réel = la table", () => {
  const space = (limited) => ({ siteId: 5, principal: false, base: `${nav.BASE}/sites/5`, name: "S", listHref: `${nav.BASE}/sites`, limited });
  const items = (limited) => nav.projectSections(space(limited)).flatMap((g) => g.items).filter((i) => nav.ALL.some((r) => r.key === i.key));
  test("chaque entrée du registre est classée une fois (ouverte, ouverte équipe, centrale ou fermée avec son motif) : une nouvelle entrée non classée fait échouer ce test", () => {
    const keys = nav.ALL.map((r) => r.key); const classed = [...OUVERT, ...OUVERT_EQUIPE, ...CENTRAL, ...Object.keys(MOTIFS)];
    assert.deepEqual([...new Set(classed)].sort(), [...keys].sort()); assert.equal(classed.length, new Set(classed).size, "aucun doublon");
  });
  test("menu d'un site (équipe) : exactement les entrées ouvertes ont un lien dans le cadre du site ; les fermées sont grisées SANS lien avec le lot annoncé ; les centrales sont absentes", () => {
    const it = items(false), live = it.filter((i) => !i.disabled).map((i) => i.key).sort();
    assert.deepEqual(live, [...OUVERT, ...OUVERT_EQUIPE].sort());
    for (const i of it.filter((x) => x.disabled)) { assert.equal(i.href, null, i.key); assert.equal(i.status, "preview", i.key); assert.ok(i.phase, i.key); assert.ok(MOTIFS[i.key], `${i.key} : motif documenté`); }
    for (const k of CENTRAL) assert.ok(!it.some((i) => i.key === k), k);
    for (const i of it.filter((x) => !x.disabled && x.key !== "sites")) assert.ok(i.href.startsWith(`${nav.BASE}/sites/5/`), `${i.key} : ${i.href}`);
  });
  test("menu d'un accès limité : mêmes entrées ouvertes que l'équipe (création d'article comprise : l'éditeur est ouvert aux accès limités depuis R6) — seules les permissions du rôle filtrent", () => {
    assert.deepEqual(items(true).map((i) => i.key), items(false).map((i) => i.key));
  });
});

describe("chaque entrée ouverte, par rôle, avec les seules données de son site", () => {
  let srv, boss, db, A, B, adminA, viewerA, adminB, anon, authA, authB, ids = {}, mediaA, mediaB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const nameOf = (c) => one("SELECT username FROM users WHERE email = ?", c.email).username;
  const SP = "/marketing/site-web/sites";
  const frame = (html, name) => html.includes(`mk-site-banner-name">${name}<`);
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const post = (slug, site, authorId, { status = "draft", published = 0 } = {}) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, author_id) VALUES (?, ?, '<p>x</p>', ?, ?, ?)").run(slug, `Titre ${slug}`, published, status, authorId).lastInsertRowid);
    if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, 1, ?)").run(id, site);
    return id;
  };
  const term = (slug, site, taxonomy = "category") => { const id = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES (?, ?, ?)").run(taxonomy, `Terme ${slug}`, slug).lastInsertRowid); if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('term', ?, 1, ?, ?)").run(id, site, taxonomy); return id; };
  const comment = (postId, body) => Number(db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, body, status, author_name) VALUES (?, 'post', ?, ?, 'pending', 'Invité')").run(postId, postId, body).lastInsertRowid);
  const upload = (client, buf, name, site) => { const fd = new FormData(); fd.append("file", new Blob([buf], { type: "image/png" }), name); return client.request(`/marketing/site-web/mediatheque/televerser${site ? `?site=${site}` : ""}`, { method: "POST", multipart: fd }); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Menu"); B = await mkSite("Bravo Menu");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
    authA = await newStudent(srv); authB = await newStudent(srv);
    ids.a1 = post("art-alpha", A, idOf(authA), { status: "published", published: 1 }); ids.a2 = post("brouillon-alpha", A, idOf(authA));
    ids.b1 = post("art-bravo", B, idOf(authB), { status: "published", published: 1 }); ids.p1 = post("art-principal", null, idOf(authB));
    ids.ta = term("cat-alpha", A); ids.tb = term("cat-bravo", B); ids.tagA = term("tag-alpha", A, "tag");
    ids.ca = comment(ids.a1, "COM-ALPHA"); ids.cb = comment(ids.b1, "COM-BRAVO");
    assert.equal((await upload(boss, png(8, 8, [10, 20, 30]), "alpha.png", A)).status < 400, true); assert.equal((await upload(boss, png(9, 9, [30, 20, 10]), "bravo.png", B)).status < 400, true);
    mediaA = one("SELECT id FROM mk_media WHERE name = 'alpha.png'"); mediaB = one("SELECT id FROM mk_media WHERE name = 'bravo.png'");
  });
  after(() => { db.close(); return srv.stop(); });

  const ENTRIES = [
    ["articles", "Titre art-alpha", /Titre art-bravo|Titre art-principal/], ["articles/brouillons", "Titre brouillon-alpha", /Titre art-bravo|Titre art-principal/], ["articles/programmes", null, /Titre art-bravo|Titre art-principal/],
    ["articles/publies", "Titre art-alpha", /Titre art-bravo|Titre art-principal|brouillon-alpha/], ["articles/corbeille", null, /Titre art-bravo|Titre art-principal/],
    ["articles/categories", "Terme cat-alpha", /Terme cat-bravo/], ["articles/etiquettes", "Terme tag-alpha", /Terme cat-bravo/],
    ["articles/auteurs", null, null], ["commentaires", "COM-ALPHA", /COM-BRAVO/], ["commentaires/en-attente", "COM-ALPHA", /COM-BRAVO/],
    ["commentaires/approuves", null, /COM-BRAVO/], ["commentaires/indesirables", null, /COM-BRAVO/], ["commentaires/corbeille", null, /COM-BRAVO/], ["medias", "alpha.png", /bravo\.png/],
  ];
  for (const [slug, mustHave, mustNot] of ENTRIES) {
    test(`/sites/N/${slug} : équipe, administrateur et lecteur du site → 200 dans le cadre du site avec SES données ; autre site → 403 ; anonyme → connexion`, async () => {
      for (const [who, c] of [["équipe", boss], ["administrateur", adminA], ["lecteur", viewerA]]) {
        const r = await c.get(`${SP}/${A}/${slug}`);
        assert.equal(r.status, 200, `${who} ${slug}`);
        assert.ok(frame(r.text, "Alpha Menu"), `${who} : cadre du site`);
        assert.match(r.text, /<meta name="mk-space" content="\d+">|Marketing du site/, "menu du site");
        if (mustHave) assert.ok(r.text.includes(mustHave), `${who} : ${mustHave}`);
        if (mustNot) assert.doesNotMatch(r.text, mustNot, `${who} : aucune donnée d'un autre site ni du principal`);
        if (who !== "équipe") assert.ok(!r.text.includes(`${SP}/${B}/`), `${who} : aucun lien vers l'autre site (le sélecteur de sites est réservé à l'équipe)`);
      }
      assert.equal((await adminB.get(`${SP}/${A}/${slug}`)).status, 403, "administrateur d'un autre site");
      const a = await anon.get(`${SP}/${A}/${slug}`); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
    });
  }
  test("Auteurs : seulement les auteurs des articles du site (jamais ceux d'un autre site ni du principal) — corrige une fuite de l'écran historique", async () => {
    const mine = nameOf(authA), other = nameOf(authB);
    for (const c of [boss, adminA, viewerA]) { const t = (await c.get(`${SP}/${A}/articles/auteurs`)).text; assert.ok(t.includes(mine), "auteur du site"); assert.ok(!t.includes(other), "auteur d'un autre site"); }
    const direct = await adminA.get(`/marketing/site-web/articles/auteurs?site=${A}`); assert.ok(!direct.text.includes(other), "adresse directe : même portée");
    const global = (await boss.get("/marketing/site-web/articles/auteurs")).text; assert.ok(global.includes(mine) && global.includes(other), "équipe sans site choisi : vue historique inchangée");
  });
  test("Ajouter un article : ouvert dans le cadre du site à l'équipe et à l'administrateur du site (brouillon rattaché au site) ; refusé au lecteur (permission) et à l'administrateur d'un autre site", async () => {
    for (const c of [boss, adminA]) { const t = await c.get(`${SP}/${A}/articles/ajouter`); assert.equal(t.status, 200); assert.ok(frame(t.text, "Alpha Menu")); }
    assert.equal((await viewerA.get(`${SP}/${A}/articles/ajouter`)).status, 403);
    assert.ok(!(await viewerA.get(`${SP}/${A}/articles`)).text.includes("/articles/ajouter"), "le menu du lecteur ne montre pas un lien qui répondrait 403");
    assert.ok((await adminA.get(`${SP}/${A}/articles`)).text.includes(`${SP}/${A}/articles/ajouter`), "l'administrateur du site le voit"); assert.equal((await adminB.get(`${SP}/${A}/articles/ajouter`)).status, 403);
    const before = one("SELECT COUNT(*) n FROM posts").n;
    assert.equal((await viewerA.post("/marketing/site-web/articles", { site: A, title: "Pirate lecteur" })).status, 403);
    assert.equal((await adminB.post("/marketing/site-web/articles", { site: A, title: "Pirate autre site" })).status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM posts").n, before, "aucun brouillon créé par un refus");
    const ok = await adminA.post("/marketing/site-web/articles", { site: A, title: "Brouillon créé par Alpha" }); assert.equal(ok.status, 302);
    const created = one("SELECT id FROM posts WHERE title = 'Brouillon créé par Alpha'"); assert.ok(created, "créé");
    assert.equal(one("SELECT site_id s FROM mk_content_sites WHERE content_type = 'post' AND content_id = ?", created.id).s, A, "rattaché au site de l'adresse, jamais à un autre");
  });
  test("écritures depuis l'espace du site : l'administrateur met à la corbeille un article de SON site ; un article d'un autre site (même avec le site de l'adresse) reste intact ; le lecteur ne peut rien écrire", async () => {
    const act = (c, id, site) => c.post(`/marketing/site-web/articles/actions?site=${site}`, { site, action: "corbeille", ids: [String(id)] });
    const trashed = (id) => Boolean(one("SELECT deleted_at FROM posts WHERE id = ?", id).deleted_at);
    await act(viewerA, ids.a2, A); assert.equal(trashed(ids.a2), false, "lecteur : rien");
    await act(adminA, ids.b1, A); await act(adminA, ids.p1, A); assert.equal(trashed(ids.b1) || trashed(ids.p1), false, "articles d'un autre site / du principal intacts");
    await act(adminB, ids.a2, B); await act(adminB, ids.a2, A); assert.equal(trashed(ids.a2), false, "administrateur d'un autre site : rien");
    await act(adminA, ids.a2, A); assert.equal(trashed(ids.a2), true, "administrateur du site : article du site mis à la corbeille");
    assert.match((await adminA.get(`${SP}/${A}/articles/corbeille`)).text, /Titre brouillon-alpha/, "visible dans la corbeille du site");
    assert.doesNotMatch((await boss.get(`${SP}/${B}/articles/corbeille`)).text, /Titre brouillon-alpha/, "pas dans celle d'un autre site");
  });
  test("commentaires : l'administrateur du site modère ses commentaires ; celui d'un autre site (même avec le site de l'adresse) reste intact ; le lecteur ne modère pas", async () => {
    const st = (id) => one("SELECT status FROM blog_comments WHERE id = ?", id).status;
    await viewerA.post(`/marketing/site-web/commentaires/${ids.ca}/approuver?site=${A}`, { site: A }); assert.equal(st(ids.ca), "pending", "lecteur : rien");
    await adminA.post(`/marketing/site-web/commentaires/${ids.cb}/approuver?site=${A}`, { site: A }); assert.equal(st(ids.cb), "pending", "commentaire d'un autre site intact");
    await adminB.post(`/marketing/site-web/commentaires/${ids.ca}/approuver?site=${B}`, { site: B }); assert.equal(st(ids.ca), "pending");
    await adminA.post(`/marketing/site-web/commentaires/${ids.ca}/approuver?site=${A}`, { site: A }); assert.equal(st(ids.ca), "approved", "administrateur du site : approuvé");
    assert.match((await adminA.get(`${SP}/${A}/commentaires/approuves`)).text, /COM-ALPHA/);
  });
  test("médias : l'administrateur téléverse dans SON site et gère ses médias ; un média d'un autre site est introuvable/intact ; le lecteur ne téléverse ni ne supprime", async () => {
    const before = one("SELECT COUNT(*) n FROM mk_media").n;
    assert.ok([302, 403, 404].includes((await upload(viewerA, png(7, 7, [1, 2, 3]), "lecteur.png", A)).status) && one("SELECT COUNT(*) n FROM mk_media").n === before, "lecteur : aucun téléversement");
    const up = await upload(adminA, png(6, 6, [9, 9, 9]), "admin-alpha.png", A); assert.ok(up.status < 400); const mine = one("SELECT id, site_id s, reach FROM mk_media WHERE name = 'admin-alpha.png'"); assert.equal(mine.s, A);
    const trash = (c, id, site) => c.post(`/marketing/site-web/mediatheque/${id}/corbeille?site=${site}`, { site });
    await trash(adminA, mediaB.id, A); await trash(adminB, mediaA.id, B); await trash(viewerA, mediaA.id, A);
    assert.equal(one("SELECT deleted_at FROM mk_media WHERE id = ?", mediaB.id).deleted_at, null, "média d'un autre site intact"); assert.equal(one("SELECT deleted_at FROM mk_media WHERE id = ?", mediaA.id).deleted_at, null, "intact pour l'autre site et le lecteur");
    await trash(adminA, mine.id, A); assert.ok(one("SELECT deleted_at FROM mk_media WHERE id = ?", mine.id).deleted_at, "administrateur : son média à la corbeille");
    const list = (await adminA.get(`${SP}/${A}/medias`)).text; assert.ok(list.includes("alpha.png") && !list.includes("bravo.png"));
  });
});

describe("entrées fermées : « Bientôt » sans donnée ni action", () => {
  let srv, boss, adminA, A, db;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = Number(String((await boss.post("/marketing/site-web/sites", { name: "Alpha Fermé" })).location).match(/sites\/(\d+)/)[1]);
    adminA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'admin')").run(A, adminA.email);
  });
  after(() => { db.close(); return srv.stop(); });
  test("le menu montre chaque entrée fermée grisée sans lien ; son adresse directe n'affiche ni tableau, ni formulaire, ni donnée (équipe et administrateur du site)", async () => {
    const menu = (await boss.get(`/marketing/site-web/sites/${A}/tableau-de-bord`)).text;
    const nbBientot = (menu.match(/mk-cms-tag[^>]*>Bientôt/g) || []).length;
    assert.equal(nbBientot, Object.keys(MOTIFS).length, "autant d'entrées « Bientôt » que d'entrées fermées de l'inventaire (Formulaires et Contacts sont ouverts depuis R8 lot 3)");
    for (const slug of ["modeles"]) for (const c of [boss, adminA]) { // R8 lot 6C : « seo » est ouvert (seo-par-site-espace)
      const r = await c.get(`/marketing/site-web/sites/${A}/${slug}`);
      assert.equal(r.status, 200, slug); assert.match(r.text, /Prochain palier/, slug);
      const main = (r.text.match(/<main[\s\S]*<\/main>/) || [""])[0];
      assert.doesNotMatch(main, /<table|<form|<button(?![^>]*disabled)/, `${slug} : ni donnée ni action`);
    }
  });
  test("les adresses déléguées hors de la liste fermée ne sont jamais servies (sous-page inconnue ou réservée aux écritures) ; une écriture ne passe jamais par la délégation (GET seulement)", async () => {
    for (const p of ["articles/inconnue", "articles/actions", "commentaires/actions", "commentaires/effacer-invite", "medias/televerser", "medias/liste"]) {
      const r = await boss.get(`/marketing/site-web/sites/${A}/${p}`);
      assert.ok(r.status === 404 || r.status === 403, `${p} -> ${r.status}`);
      assert.doesNotMatch(r.text, /mk-cms-nav|Titre |COM-/, `${p} : aucun écran servi`);
    }
    for (const p of ["articles/brouillons", "articles", "medias", "commentaires/en-attente"]) { const w = await boss.post(`/marketing/site-web/sites/${A}/${p}`, {}); assert.ok(w.status >= 400 || w.status === 302, `${p} : ${w.status}`); assert.notEqual(w.status, 200, `${p} : une écriture n'est jamais servie`); }
  });
});
