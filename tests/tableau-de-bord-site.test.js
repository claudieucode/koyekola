// R8 lot 3 — Tableau de bord par site : chaque chiffre vient d'une source réelle, borné au site de l'espace, filtré par les droits de la personne ; le site principal garde sa sémantique (ses contenus, jamais la somme).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const dash = require("../src/marketing/web/siteDashboard");

describe("source indisponible : « — » et jamais un zéro présenté comme réel (unitaire)", () => {
  test("une base sans les tables de contenu donne des valeurs nulles, pas des zéros", () => {
    const m = freshMarketing(); // pas de tables posts / blog_comments
    const req = { mk: { ctx: m.A, can: () => true } };
    const space = { siteId: 1, principal: false, base: "/marketing/site-web/sites/1" };
    const by = Object.fromEntries(dash.indicators(req, space).map((s) => [s.label, s]));
    assert.equal(by["Articles publiés"].value, null); assert.equal(by["Commentaires en attente"].value, null); assert.match(by["Articles publiés"].hint, /indisponibles/);
    assert.equal(by["Formulaires"].value, 0, "table présente et vide : 0 est réel");
    assert.equal(dash.activity({ mk: { ctx: m.A, can: () => true } }, { siteId: null }), null, "jamais d'activité pour le site principal");
  });
});

describe("tableau de bord d'un site (serveur réel)", () => {
  let srv, boss, db, A, B, C, adminA, viewerA, limitedA, adminB, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const SP = "/marketing/site-web/sites";
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const stats = (html) => Object.fromEntries([...html.matchAll(/<a class="mk-stat mk-cms-stat"[^>]*><span class="mk-stat-label">([^<]*)<\/span><span class="mk-stat-value">([^<]*)<\/span>(?:<span class="mk-stat-hint">([^<]*)<\/span>)?/g)].map((m) => [m[1], { value: m[2], hint: m[3] || "" }]));
  const post = (slug, site, status, deleted = false) => { const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, deleted_at) VALUES (?, ?, '<p>x</p>', ?, ?, ?)").run(slug, `T ${slug}`, status === "published" ? 1 : 0, status, deleted ? "2026-01-01" : null).lastInsertRowid); if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, 1, ?)").run(id, site); return id; };
  const comment = (postId, status) => db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, body, status, author_name) VALUES (?, 'post', ?, 'c', ?, 'Invité')").run(postId, postId, status);
  const media = (name, reach, site) => db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, reach, site_id) VALUES (1, 'image', 'png', ?, ?, 'image/png', 10, ?, ?)").run(`/uploads/marketing/1/${name}`, name, reach, site);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Tab"); B = await mkSite("Bravo Tab"); C = await mkSite("Vide Tab");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Pages seules", description: "t", perm: ["forms.read"] });
    limitedA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Pages seules'").key);
    // Alpha : 2 publiés, 1 brouillon, 1 programmé, 1 à la corbeille ; Bravo : 1 publié ; principal : 3 publiés
    for (const [s, st, d] of [["a1", "published"], ["a2", "published"], ["a3", "draft"], ["a4", "scheduled"], ["a5", "published", true]]) post(s, A, st, d);
    const b1 = post("b1", B, "published"); for (const s of ["p1", "p2", "p3"]) post(s, null, "published");
    const a1 = one("SELECT id FROM posts WHERE slug = 'a1'").id;
    for (const st of ["pending", "pending", "approved", "trash", "spam"]) comment(a1, st); comment(b1, "pending");
    media("alpha1.png", "site", A); media("alpha2.png", "site", A); media("bravo1.png", "site", B); media("commun.png", "shared", null);
    const contact = (e, s) => db.prepare("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (1, ?, ?)").run(e, s);
    contact("a1@x.fr", A); contact("a2@x.fr", A); contact("b1@x.fr", B);
    const form = (n, s) => db.prepare("INSERT INTO mk_forms (organization_id, name, slug, consent_text, site_id) VALUES (1, ?, ?, 'oui', ?)").run(n, n.toLowerCase(), s);
    form("FA", A); form("FB1", B); form("FB2", B); form("FP", null);
    const log = (action, site) => db.prepare("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, site_id) VALUES (1, ?, ?, 'form', ?)").run(idOf(adminA), action, site);
    log("alpha.action.un", A); log("alpha.action.deux", A); log("bravo.action.secrete", B); log("principal.action.secrete", null);
  });
  after(() => { db.close(); return srv.stop(); });

  test("Alpha (équipe) : chiffres réels du seul site — articles publiés 2 (1 brouillon, 1 programmé ; corbeille exclue), commentaires en attente 2 (1 approuvé ; corbeille et indésirables exclus), 2 médias propres, 2 contacts, 1 formulaire", async () => {
    const s = stats((await boss.get(`${SP}/${A}/tableau-de-bord`)).text);
    assert.deepEqual([s["Articles publiés"].value, s["Articles publiés"].hint], ["2", "1 brouillon · 1 programmé"]);
    assert.deepEqual([s["Commentaires en attente"].value, s["Commentaires en attente"].hint], ["2", "1 approuvé"]);
    assert.deepEqual([s["Médias du site"].value, s["Médias du site"].hint], ["2", "propres à ce site"]);
    assert.equal(s["Contacts"].value, "2"); assert.equal(s["Formulaires"].value, "1");
    // contrôle indépendant en base
    assert.equal(one("SELECT COUNT(*) n FROM posts p JOIN mk_content_sites cs ON cs.content_id = p.id AND cs.content_type = 'post' WHERE cs.site_id = ? AND p.deleted_at IS NULL AND p.status = 'published'", A).n, 2);
  });
  test("Bravo et le site vide : leurs propres chiffres (jamais ceux d'Alpha) ; un site sans contenu affiche de vrais zéros", async () => {
    const b = stats((await boss.get(`${SP}/${B}/tableau-de-bord`)).text), c = stats((await boss.get(`${SP}/${C}/tableau-de-bord`)).text);
    assert.deepEqual([b["Articles publiés"].value, b["Commentaires en attente"].value, b["Médias du site"].value, b["Contacts"].value, b["Formulaires"].value], ["1", "1", "1", "1", "2"]);
    assert.deepEqual([c["Articles publiés"].value, c["Commentaires en attente"].value, c["Médias du site"].value, c["Contacts"].value, c["Formulaires"].value], ["0", "0", "0", "0", "0"]);
    const act = (await boss.get(`${SP}/${C}/tableau-de-bord`)).text; assert.match(act, /Activité récente/); assert.doesNotMatch(act, /alpha\.action|bravo\.action|principal\.action/, "seulement les événements de CE site (sa création)");
  });
  test("site principal : sa propre sémantique — ses 3 articles sans site, ses médias COMMUNS, ses formulaires sans site ; pas de somme des sites ; pas d'activité", async () => {
    const r = await boss.get("/marketing/site-web/principal/tableau-de-bord"); const s = stats(r.text);
    assert.equal(s["Articles publiés"].value, "3"); assert.equal(s["Médias communs"].value, "1"); assert.equal(s["Formulaires"].value, "1"); assert.equal(s["Médias communs"].hint, "partagés entre les sites");
    assert.equal(s["Contacts"].value, String(one("SELECT COUNT(*) n FROM mk_contacts c WHERE NOT EXISTS (SELECT 1 FROM mk_contact_sites cs WHERE cs.contact_id = c.id)").n), "contacts sans rattachement à un site (calcul indépendant)"); assert.ok(Number(s["Contacts"].value) >= 1 && Number(s["Contacts"].value) < one("SELECT COUNT(*) n FROM mk_contacts").n, "les contacts des sites n'y sont pas comptés");
    assert.ok(!("Médias du site" in s)); assert.doesNotMatch(r.text, /Activité récente/);
    assert.equal(s["Commentaires en attente"].value, "0", "les commentaires des articles de sites ne sont pas ceux du principal");
  });
  test("droits : un rôle qui ne lit que les pages ne voit ni articles, ni commentaires, ni médias, ni contacts ; le lecteur (droits de lecture) voit les mêmes chiffres que l'équipe pour ce site", async () => {
    const lim = stats((await limitedA.get(`${SP}/${A}/tableau-de-bord`)).text);
    for (const k of ["Articles publiés", "Commentaires en attente", "Médias du site", "Contacts"]) assert.ok(!(k in lim), `rôle limité : ${k} absent`);
    assert.ok("Pages en ligne" in lim && "Formulaires" in lim);
    const team = stats((await boss.get(`${SP}/${A}/tableau-de-bord`)).text), view = stats((await viewerA.get(`${SP}/${A}/tableau-de-bord`)).text);
    for (const k of Object.keys(view)) assert.deepEqual(view[k], team[k], k);
  });
  test("activité récente : le journal du site seulement (jamais celui d'un autre site ni du principal), avec le droit de le lire ; refusé à qui ne l'a pas", async () => {
    const html = (await boss.get(`${SP}/${A}/tableau-de-bord`)).text;
    assert.match(html, /alpha\.action\.un/); assert.match(html, /alpha\.action\.deux/); assert.doesNotMatch(html, /bravo\.action\.secrete|principal\.action\.secrete/);
    const lim = (await limitedA.get(`${SP}/${A}/tableau-de-bord`)).text; assert.doesNotMatch(lim, /alpha\.action|Activité récente/, "sans audit.read : pas d'activité");
    const admin = (await adminA.get(`${SP}/${A}/tableau-de-bord`)).text; assert.doesNotMatch(admin, /bravo\.action\.secrete|principal\.action\.secrete/);
  });
  test("isolation : l'administrateur d'un autre site, un compte sans accès et un anonyme n'obtiennent aucun chiffre d'Alpha", async () => {
    const x = await adminB.get(`${SP}/${A}/tableau-de-bord`); assert.equal(x.status, 403); assert.doesNotMatch(x.text, /Articles publiés|alpha\.action/);
    const a = await anon.get(`${SP}/${A}/tableau-de-bord`); assert.equal(a.status, 302);
    const own = stats((await adminB.get(`${SP}/${B}/tableau-de-bord`)).text); assert.equal(own["Articles publiés"].value, "1");
  });
  test("les chiffres suivent les données : un nouvel article publié d'Alpha s'ajoute aux siens et pas à ceux de Bravo ni du principal", async () => {
    post("a-nouveau", A, "published");
    assert.equal(stats((await boss.get(`${SP}/${A}/tableau-de-bord`)).text)["Articles publiés"].value, "3");
    assert.equal(stats((await boss.get(`${SP}/${B}/tableau-de-bord`)).text)["Articles publiés"].value, "1");
    assert.equal(stats((await boss.get("/marketing/site-web/principal/tableau-de-bord")).text)["Articles publiés"].value, "3");
  });
});
