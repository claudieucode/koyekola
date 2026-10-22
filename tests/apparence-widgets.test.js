// KOLAKISA CMS — Apparence → Widgets : zones, blocs et widgets désactivés PAR SITE, sur les vraies routes, la vraie base, de vrais comptes.
// Éditeur (données chargées), enregistrement tout-ou-rien, validation et assainissement, conflit de version, persistance, rendu PUBLIC (principal et pages d'un site),
// aperçu de bloc, permissions côté serveur et isolation entre deux sites (+ le site principal).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");
const catalog = require("../src/marketing/widgets/catalog");

describe("apparence-widgets : zones, blocs, désactivés, enregistrement, rendu public, isolation", () => {
  let srv, boss, db, orgId, A, B, C, adminA, editorA, viewerA, pageA, pageB, menuB, menuA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const W = "/marketing/site-web/widgets", SP = "/marketing/site-web/sites";
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const SECTIONS = JSON.stringify([{ type: "text", markdown: "Contenu" }]);
  const q = (site) => (site ? `?site=${site}` : "");
  let n = 0; const bid = () => `t${String(++n).padStart(8, "0")}`;
  const blk = (type, settings = {}, id = bid()) => ({ id, type, settings });
  const layout = (zones = {}, inactive = []) => ({ zones: { sidebar: [], "footer-1": [], "footer-2": [], ...zones }, inactive });
  const data = (html) => JSON.parse(/<script type="application\/json" id="wd-data">([\s\S]*?)<\/script>/.exec(html)[1].replace(/\\u003c/g, "<"));
  const editorData = async (c, path) => data((await c.get(path)).text);
  const save = (c, site, lay, revision) => c.postJson(`${W}/enregistrer${q(site)}`, { revision, layout: lay });
  const row = (site) => one("SELECT * FROM cms_widget_layouts WHERE COALESCE(site_id, 0) = COALESCE(?, 0)", site || null);
  const saved = async (c, site, lay) => { const cur = row(site); const r = await save(c, site, lay, cur ? cur.revision : 0); assert.equal(r.status, 200, r.text); return JSON.parse(r.text); };
  const preview = (id) => `/marketing/pages/${id}/apercu`;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (nm) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, nm, nm.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta"); C = site("Gamma");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer");
    const page = (slug, s) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, 'published', 'page', ?, datetime('now'))").run(orgId, slug, slug, slug, SECTIONS, s).lastInsertRowid);
    pageA = page("page-alpha", A); pageB = page("page-beta", B);
    db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at, category, tags, created_at, updated_at) VALUES ('article-un', 'Premier article du blog', '<p>x</p>', 1, 'published', datetime('now'), 'Actualités', 'astuces, guide', datetime('now'), datetime('now'))").run();
    menuB = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug) VALUES (?, 'Menu Beta', 'menu-beta')").run(B).lastInsertRowid);
    db.prepare("INSERT INTO nav_items (menu_id, position, type, url, label) VALUES (?, 0, 'custom', '/lien-beta', 'Lien secret de Beta')").run(menuB);
    menuA = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug) VALUES (?, 'Menu Alpha', 'menu-alpha')").run(A).lastInsertRowid);
    db.prepare("INSERT INTO nav_items (menu_id, position, type, url, label) VALUES (?, 0, 'custom', '/lien-alpha', 'Lien public Alpha')").run(menuA);
  });
  after(() => { db.close(); return srv.stop(); });

  describe("éditeur", () => {
    test("ouverture : titre, barre d'outils, trois zones réelles, catalogue de 18 blocs, mise en page vide, aucune zone factice", async () => {
      const r = await boss.get(`${SP}/${A}/widgets`);
      assert.equal(r.status, 200);
      for (const f of ["data-wd-root", "<h1 class=\"mk-wd-title\">Widgets", "data-wd-inserter", "data-wd-undo", "data-wd-redo", "data-wd-structure", "data-wd-save", "data-wd-more", "Annuler", "Rétablir", "Enregistrer", 'data-wd-tab="settings"', 'data-wd-tab="structure"', 'data-wd-tab="blocks"']) assert.ok(r.text.includes(f), f);
      const d = data(r.text);
      assert.deepEqual(d.zones.map((z) => z.key), ["sidebar", "footer-1", "footer-2"]);
      assert.equal(d.blocks.length, 18);
      assert.equal(d.revision, 0); assert.deepEqual(d.layout.inactive, []); assert.deepEqual(d.layout.zones["footer-1"], []);
      assert.equal(d.site.id, A); assert.equal(d.canEdit, true); assert.match(d.urls.save, new RegExp(`site=${A}$`));
      assert.doesNotMatch(r.text, /Elementor|WPForms|Hostinger|Astra/);
      assert.match(r.text, /<link rel="stylesheet" href="\/css\/widgets\.css/);
    });
    test("le menu « Apparence » propose Widgets, ouvert dans le cadre du site", async () => {
      const r = await boss.get(`${SP}/${A}/widgets`);
      assert.match(r.text, /href="[^"]*\/sites\/\d+\/widgets"[^>]*aria-current="page"|aria-current="page"[^>]*href="[^"]*widgets"/);
      assert.equal((await boss.get(W)).status, 200, "site principal");
    });
    test("chaque bloc du catalogue : réglages décrits, valeurs par défaut valides et rendu sans erreur", async () => {
      for (const b of catalog.BLOCKS) {
        assert.ok(b.label && b.category && b.description && Array.isArray(b.fields) && b.fields.length, b.key);
        assert.ok(catalog.CATEGORIES.some((c) => c.key === b.category), b.key);
        const clean = catalog.cleanBlock({ id: bid(), type: b.key, settings: b.defaults }, b.key);
        assert.ok(clean.settings, b.key);
      }
      const lay = layout({ sidebar: catalog.BLOCKS.map((b) => blk(b.key, b.defaults)) });
      const r = await save(boss, A, lay, 0);
      assert.equal(r.status, 200, r.text);
      for (const b of catalog.BLOCKS) { const p = await boss.postJson(`${W}/apercu${q(A)}`, { block: blk(b.key, b.defaults) }); assert.equal(p.status, 200, b.key); assert.equal(JSON.parse(p.text).ok, true, b.key); }
      db.prepare("DELETE FROM cms_widget_layouts WHERE site_id = ?").run(A);
    });
  });

  describe("enregistrement et persistance", () => {
    test("enregistrer : version 1, réglages conservés après rechargement, ordre conservé, désactivés conservés", async () => {
      const lay = layout({ "footer-1": [blk("heading", { text: "Bienvenue", level: 2 }), blk("paragraph", { text: "Premier\n\nSecond" }), blk("button", { label: "Contact", url: "/contact", style: "outline" })], sidebar: [blk("search", { title: "Chercher" })] }, [blk("paragraph", { text: "Mis de côté" })]);
      const r = JSON.parse((await save(boss, A, lay, 0)).text);
      assert.equal(r.ok, true); assert.equal(r.revision, 1);
      const d = await editorData(boss, `${SP}/${A}/widgets`);
      assert.equal(d.revision, 1);
      assert.deepEqual(d.layout.zones["footer-1"].map((b) => b.type), ["heading", "paragraph", "button"]);
      assert.equal(d.layout.zones["footer-1"][0].settings.text, "Bienvenue"); assert.equal(d.layout.zones["footer-1"][0].settings.level, 2);
      assert.equal(d.layout.zones.sidebar[0].settings.title, "Chercher");
      assert.equal(d.layout.inactive[0].settings.text, "Mis de côté");
      assert.equal(row(A).revision, 1);
    });
    test("réorganiser, déplacer entre zones, désactiver puis restaurer : tout est persistant", async () => {
      const cur = (await editorData(boss, `${SP}/${A}/widgets`)).layout;
      const [h, p, b] = cur.zones["footer-1"], kept = cur.inactive[0];
      const lay = layout({ "footer-1": [p, h], "footer-2": [b, kept], sidebar: cur.zones.sidebar }, []);
      await saved(boss, A, lay);
      const d = (await editorData(boss, `${SP}/${A}/widgets`)).layout;
      assert.deepEqual(d.zones["footer-1"].map((x) => x.id), [p.id, h.id]);
      assert.deepEqual(d.zones["footer-2"].map((x) => x.id), [b.id, kept.id], "déplacé entre zones et restauré depuis les désactivés");
      assert.equal(d.zones["footer-2"][1].settings.text, "Mis de côté", "un widget désactivé garde ses réglages");
      assert.deepEqual(d.inactive, []);
      await saved(boss, A, layout({ "footer-1": [p, h], "footer-2": [b], sidebar: cur.zones.sidebar }, [kept]));
      assert.equal((await editorData(boss, `${SP}/${A}/widgets`)).layout.inactive[0].id, kept.id, "désactivé à nouveau");
    });
    test("dupliquer et supprimer : la copie a son propre identifiant ; la suppression est définitive après enregistrement", async () => {
      const cur = (await editorData(boss, `${SP}/${A}/widgets`)).layout;
      const copy = { ...cur.zones["footer-1"][0], id: bid() };
      await saved(boss, A, layout({ ...cur.zones, "footer-1": [cur.zones["footer-1"][0], copy, cur.zones["footer-1"][1]] }, cur.inactive));
      const mid = (await editorData(boss, `${SP}/${A}/widgets`)).layout;
      assert.equal(mid.zones["footer-1"].length, 3);
      assert.notEqual(mid.zones["footer-1"][0].id, mid.zones["footer-1"][1].id);
      await saved(boss, A, layout({ ...mid.zones, "footer-1": mid.zones["footer-1"].filter((x) => x.id !== copy.id) }, []));
      const end = (await editorData(boss, `${SP}/${A}/widgets`)).layout;
      assert.equal(end.zones["footer-1"].length, 2); assert.deepEqual(end.inactive, [], "supprimé définitivement");
    });
    test("conflit : une version périmée est refusée (409), rien n'est écrit ; sans version : refusé", async () => {
      const cur = row(A), before = cur.layout;
      const stale = await save(boss, A, layout({ "footer-1": [blk("separator")] }), cur.revision - 1);
      assert.equal(stale.status, 409); const j = JSON.parse(stale.text); assert.equal(j.ok, false); assert.equal(j.conflict, true); assert.match(j.error, /modifiés ailleurs/);
      assert.equal((await boss.postJson(`${W}/enregistrer${q(A)}`, { layout: layout() })).status, 409, "sans version");
      assert.equal((await boss.postJson(`${W}/enregistrer${q(A)}`, { revision: "1", layout: layout() })).status, 409, "version non entière");
      assert.equal(row(A).layout, before); assert.equal(row(A).revision, cur.revision);
    });
    test("double envoi avec la même version : un seul passe, l'autre est un conflit", async () => {
      const cur = row(A), lay = (await editorData(boss, `${SP}/${A}/widgets`)).layout;
      const [r1, r2] = await Promise.all([save(boss, A, lay, cur.revision), save(boss, A, lay, cur.revision)]);
      assert.deepEqual([r1.status, r2.status].sort(), [200, 409]);
      assert.equal(row(A).revision, cur.revision + 1);
    });
    test("journal d'audit : widgets.saved avec le site", () => {
      const a = one("SELECT * FROM mk_audit_logs WHERE action = 'widgets.saved' AND site_id = ? ORDER BY id DESC", A);
      assert.ok(a, "entrée de journal");
    });
  });

  describe("validation côté serveur : tout ou rien", () => {
    const rev = () => (row(A) ? row(A).revision : 0);
    const refused = async (label, lay, re) => {
      const before = row(A), r = await save(boss, A, lay, rev());
      assert.equal(r.status, 400, label); const j = JSON.parse(r.text); assert.equal(j.ok, false, label); assert.match(j.error, re, label);
      assert.deepEqual(row(A), before, `${label} : rien n'est écrit`);
    };
    test("mises en page invalides refusées avec un message exploitable", async () => {
      await refused("bloc inconnu", layout({ sidebar: [blk("flash-animation")] }), /n'existe pas/);
      await refused("zone inconnue", { zones: { pirate: [] }, inactive: [] }, /n'existe pas/);
      await refused("identifiant invalide", layout({ sidebar: [{ id: "../x", type: "separator", settings: {} }] }), /identifiant/);
      const dup = blk("separator"); await refused("doublon", layout({ sidebar: [dup], "footer-1": [dup] }), /deux fois/);
      await refused("trop de blocs", layout({ sidebar: Array.from({ length: 41 }, () => blk("separator")) }), /au plus 40/);
      await refused("liste invalide", { zones: { sidebar: "x" }, inactive: [] }, /liste invalide/);
      await refused("bloc non objet", layout({ sidebar: ["x"] }), /bloc invalide/);
      assert.equal((await boss.postJson(`${W}/enregistrer${q(A)}`, { revision: rev(), layout: "pas une mise en page" })).status, 400);
    });
    test("JSON illisible : erreur serveur contrôlée, rien n'est écrit", async () => {
      const before = row(A), r = await boss.request(`${W}/enregistrer${q(A)}`, { method: "POST", headers: { "Content-Type": "application/json" }, form: undefined, multipart: "{oups" });
      assert.ok(r.status >= 400 && r.status < 500, String(r.status)); assert.deepEqual(row(A), before);
    });
    test("réglages assainis : adresses dangereuses retirées, HTML nettoyé, classes limitées, bornes appliquées", async () => {
      const lay = layout({ sidebar: [
        blk("image", { src: "javascript:alert(1)", alt: "x", link: "javascript:alert(2)" }),
        blk("image", { src: "/uploads/../../etc/passwd" }),
        blk("image", { src: "https://cdn.example.com/a.png", link: "https://exemple.fr/x", alt: "ok" }),
        blk("html", { code: '<p onclick="x()">Salut <a href="javascript:alert(1)">piège</a><script>alert(1)</script><iframe src="https://evil.test"></iframe><img src="data:image/png;base64,xx" onerror="y()"><form action="/x"><input></form></p>' }),
        blk("paragraph", { text: "<b>pas du HTML</b>", className: "kw-ok evil-class kw-ok2 \"onload=x" }),
        blk("recent-posts", { count: 9999 }), blk("gallery", { images: ["https://a.test/1.png", "data:text/html;base64,AA", "/uploads/x/y.png"], columns: 99 }),
        blk("video", { src: "https://a.test/page.html" }), blk("button", { label: "Go", url: "//evil.test" }),
      ] });
      const out = JSON.parse((await save(boss, A, lay, rev())).text).layout.zones.sidebar;
      assert.equal(out[0].settings.src, ""); assert.equal(out[0].settings.link, "");
      assert.equal(out[1].settings.src, "", "chemin avec « .. »");
      assert.equal(out[2].settings.src, "https://cdn.example.com/a.png");
      const html = out[3].settings.code;
      assert.doesNotMatch(html, /script|iframe|onclick|onerror|javascript:|<form|<input|data:image/i); assert.match(html, /Salut/);
      assert.equal(out[4].settings.className, "kw-ok kw-ok2"); assert.equal(out[4].settings.text, "<b>pas du HTML</b>");
      assert.equal(out[5].settings.count, 15); assert.deepEqual(out[6].settings.images, ["https://a.test/1.png", "/uploads/x/y.png"]); assert.equal(out[6].settings.columns, 4);
      assert.equal(out[7].settings.src, "", "vidéo : seuls les fichiers vidéo"); assert.equal(out[8].settings.url, "", "adresse sans protocole refusée");
      const view = (await boss.postJson(`${W}/apercu${q(A)}`, { block: out[4] })).text;
      assert.match(JSON.parse(view).html, /&lt;b&gt;pas du HTML&lt;\/b&gt;/, "le texte est échappé");
      await saved(boss, A, layout());
    });
  });

  describe("rendu public (le moteur de rendu du site, pas une imitation)", () => {
    test("site principal : pied de page et colonne latérale du blog affichent les blocs enregistrés, dans l'ordre", async () => {
      await saved(boss, null, layout({
        "footer-1": [blk("heading", { text: "Titre principal pied", level: 3 }), blk("paragraph", { text: "Texte du pied principal" })],
        "footer-2": [blk("button", { label: "Écrire", url: "/contact" })],
        sidebar: [blk("recent-posts", { title: "Derniers", count: 3, showDate: true }), blk("categories", { title: "Rubriques" }), blk("tag-cloud", { title: "Mots" }), blk("search", { title: "Trouver" })],
      }, [blk("paragraph", { text: "NE DOIT PAS APPARAÎTRE (désactivé)" })]));
      const blog = (await Promise.resolve(new Client(srv.base).get("/blog"))).text;
      assert.match(blog, /<aside class="kw-widget-zone kw-zone-sidebar"/); assert.match(blog, /has-widget-sidebar/);
      assert.ok(blog.indexOf("Titre principal pied") > 0 && blog.indexOf("Titre principal pied") < blog.indexOf("Texte du pied principal"), "ordre");
      assert.match(blog, /<aside class="kw-widget-zone kw-zone-footer-1"/); assert.match(blog, /Écrire<\/a>/);
      assert.match(blog, /Premier article du blog<\/a>/, "article récent réel"); assert.match(blog, /Actualités/, "catégorie réelle"); assert.match(blog, /astuces/, "étiquette réelle");
      assert.match(blog, /<form class="kw-widget-search" action="\/blog"/);
      assert.doesNotMatch(blog, /NE DOIT PAS APPARAÎTRE/, "un widget désactivé n'est jamais rendu");
      const post = (await new Client(srv.base).get("/blog/article-un")).text;
      assert.match(post, /kw-zone-sidebar/); assert.match(post, /Titre principal pied/);
    });
    test("page d'un site : pied de page du SITE seulement (ni celui d'un autre site, ni celui du principal)", async () => {
      await saved(boss, A, layout({ "footer-1": [blk("paragraph", { text: "Pied d'Alpha" })], "footer-2": [blk("site-identity", { tagline: "Signature Alpha" })] }));
      await saved(boss, B, layout({ "footer-1": [blk("paragraph", { text: "Pied de Beta" })] }));
      const a = (await boss.get(preview(pageA))).text, b = (await boss.get(preview(pageB))).text;
      assert.match(a, /Pied d&#39;Alpha/); assert.match(a, /Signature Alpha/); assert.match(a, />Alpha</, "nom du site");
      assert.doesNotMatch(a, /Pied de Beta|Titre principal pied/);
      assert.match(b, /Pied de Beta/); assert.doesNotMatch(b, /Pied d&#39;Alpha|Signature Alpha|Titre principal pied/);
    });
    test("le principal ne reçoit rien des sites, et inversement ; un site sans widgets garde son pied de page d'origine", async () => {
      const blog = (await new Client(srv.base).get("/blog")).text;
      assert.doesNotMatch(blog, /Pied d&#39;Alpha|Pied de Beta/);
      const c = await boss.get(`${SP}/${C}/widgets`); assert.deepEqual(data(c.text).layout.zones["footer-1"], []);
      const pageC = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'pc', 'pc', 'pc', ?, 'published', 'page', ?, datetime('now'))").run(orgId, SECTIONS, C).lastInsertRowid);
      const html = (await boss.get(preview(pageC))).text;
      assert.doesNotMatch(html, /kw-widget-zone|lp-foot-widgets/); assert.match(html, /class="lp-foot"/);
    });
    test("navigation : le menu du site s'affiche ; le menu d'un AUTRE site (identifiant forgé) ne s'affiche jamais", async () => {
      await saved(boss, A, layout({ "footer-1": [blk("navigation", { title: "Liens", menuId: menuA }), blk("navigation", { title: "Piège", menuId: menuB })] }));
      const a = (await boss.get(preview(pageA))).text;
      assert.match(a, /Lien public Alpha/); assert.doesNotMatch(a, /Lien secret de Beta/);
      assert.deepEqual((await editorData(boss, `${SP}/${A}/widgets`)).menus.map((m) => m.name), ["Menu Alpha"], "l'éditeur ne propose que les menus du site");
    });
    test("zone non prise en charge : l'ajouter à une zone inexistante est refusé (aucune zone fictive)", async () => {
      const r = await save(boss, A, { zones: { "header-1": [blk("separator")] }, inactive: [] }, row(A).revision);
      assert.equal(r.status, 400);
    });
  });

  describe("aperçu d'un bloc", () => {
    test("même rendu que le site public ; rien n'est enregistré ; bloc invalide refusé", async () => {
      const before = row(A);
      const r = JSON.parse((await boss.postJson(`${W}/apercu${q(A)}`, { block: blk("heading", { text: "Aperçu <i>x</i>", level: 3 }) })).text);
      assert.equal(r.ok, true); assert.match(r.html, /<h3 class="kw-widget-heading[^"]*">Aperçu &lt;i&gt;x&lt;\/i&gt;<\/h3>/);
      const bad = await boss.postJson(`${W}/apercu${q(A)}`, { block: { id: "x", type: "heading" } });
      assert.equal(bad.status, 400); assert.deepEqual(row(A), before);
      assert.equal((await boss.postJson(`${W}/apercu${q(A)}`, {})).status, 400);
    });
  });

  describe("permissions côté serveur", () => {
    test("lecteur : consulte (canEdit faux), aperçu autorisé ; enregistrer refusé (403) et rien ne change", async () => {
      const d = await editorData(viewerA, `${SP}/${A}/widgets`); assert.equal(d.canEdit, false);
      assert.equal((await viewerA.postJson(`${W}/apercu${q(A)}`, { block: blk("separator") })).status, 200);
      const before = row(A); assert.equal((await save(viewerA, A, layout({ sidebar: [blk("separator")] }), before.revision)).status, 403);
      assert.deepEqual(row(A), before);
    });
    test("éditeur : consulte, ne publie pas : enregistrer refusé (403)", async () => {
      assert.equal((await editorData(editorA, `${SP}/${A}/widgets`)).canEdit, false);
      assert.equal((await save(editorA, A, layout(), row(A).revision)).status, 403);
    });
    test("administrateur du site : enregistre sur SON site", async () => {
      assert.equal((await editorData(adminA, `${SP}/${A}/widgets`)).canEdit, true);
      const r = await save(adminA, A, layout({ "footer-2": [blk("spacer", { size: "l" })] }), row(A).revision);
      assert.equal(r.status, 200, r.text);
    });
    test("visiteur non connecté : aucun accès à l'écran ni à l'enregistrement", async () => {
      const anon = new Client(srv.base);
      assert.ok([302, 401, 403].includes((await anon.get(`${W}${q(A)}`)).status));
      const r = await anon.postJson(`${W}/enregistrer${q(A)}`, { revision: 0, layout: layout() }); assert.ok([302, 401, 403].includes(r.status), String(r.status));
    });
  });

  describe("isolation multisite", () => {
    test("accès limité au site A : tout autre site ou le principal est refusé côté serveur, par adresse, paramètre et corps forgés", async () => {
      const beforeB = row(B), beforeP = row(null);
      for (const p of [`${SP}/${B}/widgets`, `${W}?site=${B}`, `${W}?site=${C}`]) assert.equal((await adminA.get(p)).status, 403, p);
      const bare = await adminA.get(W); assert.ok([302, 403].includes(bare.status), `adresse sans site : ${bare.status}`);
      const lay = layout({ sidebar: [blk("paragraph", { text: "INTRUS" })] });
      assert.equal((await adminA.postJson(`${W}/enregistrer?site=${B}`, { revision: beforeB.revision, layout: lay })).status, 403);
      assert.equal((await adminA.postJson(`${W}/enregistrer`, { site: B, revision: beforeB.revision, layout: lay })).status, 403, "site forgé dans le corps");
      assert.equal((await adminA.postJson(`${W}/enregistrer?site=${A}`, { site: B, revision: row(A).revision, layout: lay })).status, 200, "la requête vise le site vérifié, pas le corps");
      assert.equal((await adminA.postJson(`${W}/apercu?site=${B}`, { block: blk("separator") })).status, 403);
      assert.deepEqual(row(B), beforeB, "le site B est intact"); assert.deepEqual(row(null), beforeP, "le principal est intact");
      assert.equal(JSON.parse(row(A).layout).zones.sidebar[0].settings.text, "INTRUS", "…et l'écriture a bien eu lieu sur A");
      await saved(boss, A, layout());
    });
    test("sans site, un compte limité n'agit jamais sur le principal ; l'équipe sans site agit sur le principal", async () => {
      const r = await adminA.postJson(`${W}/enregistrer`, { revision: row(null).revision, layout: layout({ sidebar: [blk("separator")] }) });
      assert.ok([200, 403].includes(r.status));
      if (r.status === 200) { const lay = JSON.parse(row(A).layout); assert.equal(lay.zones.sidebar.length, 1, "écrit sur son propre site, jamais sur le principal"); assert.equal(JSON.parse(row(null).layout).zones.sidebar.length, 4); }
      await saved(boss, A, layout());
    });
    test("modifier A ne change ni B, ni C, ni le principal (lignes, versions, données, rendu)", async () => {
      const snap = () => JSON.stringify([row(B), row(C), row(null)]);
      const before = snap();
      await saved(boss, A, layout({ sidebar: [blk("paragraph", { text: "Seulement pour Alpha" })], "footer-1": [blk("separator")] }, [blk("spacer")]));
      assert.equal(snap(), before);
      assert.match(JSON.stringify((await editorData(boss, `${SP}/${A}/widgets`)).layout), /Seulement pour Alpha/);
      assert.doesNotMatch(JSON.stringify((await editorData(boss, `${SP}/${B}/widgets`)).layout), /Seulement pour Alpha/);
      assert.doesNotMatch(JSON.stringify((await editorData(boss, W)).layout), /Seulement pour Alpha/);
      assert.deepEqual((await editorData(boss, `${SP}/${C}/widgets`)).layout, layout());
    });
    test("la même zone sur deux sites a des versions indépendantes ; un identifiant de bloc identique sur deux sites est permis", async () => {
      const shared = bid();
      const ra = JSON.parse((await save(boss, B, layout({ "footer-2": [blk("separator", {}, shared)] }), row(B).revision)).text);
      const rc = JSON.parse((await save(boss, C, layout({ "footer-2": [blk("separator", {}, shared)] }), 0)).text);
      assert.equal(rc.revision, 1); assert.ok(ra.revision >= 1);
      assert.equal(JSON.parse(row(B).layout).zones["footer-2"][0].id, shared); assert.equal(JSON.parse(row(C).layout).zones["footer-2"][0].id, shared);
    });
    test("site inconnu : 404 ; site archivé : consultation seule, enregistrement refusé", async () => {
      assert.equal((await boss.get(`${W}?site=99999`)).status, 404);
      assert.equal((await boss.get(`${W}?site=abc`)).status, 404);
      const r404 = await boss.postJson(`${W}/enregistrer?site=99999`, { revision: 0, layout: layout() }); assert.equal(r404.status, 404); assert.equal(JSON.parse(r404.text).ok, false);
      db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(C);
      const before = row(C);
      assert.equal((await editorData(boss, `${SP}/${C}/widgets`)).readOnly, true);
      assert.equal((await save(boss, C, layout(), before.revision)).status, 409);
      assert.deepEqual(row(C), before);
      db.prepare("UPDATE mk_sites SET status = 'active' WHERE id = ?").run(C);
    });
    test("tous les liens de l'éditeur portent le site de la requête", async () => {
      const d = await editorData(boss, `${SP}/${A}/widgets`);
      assert.ok(d.urls.save.endsWith(`?site=${A}`) && d.urls.preview.endsWith(`?site=${A}`) && d.urls.menus.endsWith(`?site=${A}`));
      const p = await editorData(boss, W); assert.equal(p.site.id, null); assert.doesNotMatch(p.urls.save, /site=/);
    });
  });

  describe("données et migration", () => {
    test("table cms_widget_layouts : une ligne par site, unicité vérifiée par la base", () => {
      assert.throws(() => db.prepare("INSERT INTO cms_widget_layouts (site_id, layout) VALUES (?, '{}')").run(A), /UNIQUE/);
      assert.throws(() => db.prepare("INSERT INTO cms_widget_layouts (site_id, layout) VALUES (NULL, '{}')").run(), /UNIQUE/, "une seule ligne pour le principal");
    });
    test("un contenu corrompu en base ne casse ni l'éditeur ni les pages publiques", async () => {
      db.prepare("UPDATE cms_widget_layouts SET layout = '{pas du json' WHERE site_id = ?").run(B);
      const d = await editorData(boss, `${SP}/${B}/widgets`); assert.deepEqual(d.layout, layout());
      assert.equal((await boss.get(preview(pageB))).status, 200);
      db.prepare("UPDATE cms_widget_layouts SET layout = ? WHERE site_id = ?").run(JSON.stringify({ zones: { sidebar: [{ id: "abcdefgh", type: "n-existe-pas", settings: {} }] }, inactive: [] }), B);
      assert.equal((await boss.get(preview(pageB))).status, 200);
      assert.deepEqual((await editorData(boss, `${SP}/${B}/widgets`)).layout, layout());
    });
  });
});
