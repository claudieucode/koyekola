// KOLAKISA CMS — barre d'administration supérieure : intégration dans la coque, sélecteur de site (droits et isolation), adresse publique, création rapide,
// actions liées au contenu consulté, notifications réelles PAR SITE (liste, lecture, « tout lu »), profil et déconnexion, échappement, accessibilité — sur les vraies routes,
// la vraie base et de vrais comptes (équipe, administrateur / éditeur / lecteur d'un site).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("barre d'administration : coque, sites, création, notifications, profil", () => {
  let srv, boss, db, orgId, A, B, C, X, adminA, editorA, viewerA, pageA, homeA, postA, postB, postM;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const SP = "/marketing/site-web/sites", NF = "/marketing/barre";
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const bar = (html) => (html.match(/<nav class="kab"[\s\S]*?<\/nav>/) || [""])[0];
  const links = (html) => [...bar(html).matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const SECTIONS = JSON.stringify([{ type: "text", markdown: "Contenu" }]);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n, slug, settings = "{}", status = "active") => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens, settings, status) VALUES (?, ?, ?, '{}', ?, ?)").run(orgId, n, slug, settings, status).lastInsertRowid);
    A = site("Alpha", "alpha", JSON.stringify({ seo: { publicUrl: "https://alpha.example" } })); B = site("Beta", "beta"); C = site("<img src=x onerror=alert(1)>", "gamma"); X = site("Archivé", "archive", "{}", "archived");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer");
    const page = (slug, s, st = "published") => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, ?, 'page', ?, datetime('now'))").run(orgId, slug, slug, slug, SECTIONS, st, s).lastInsertRowid);
    pageA = page("page-alpha", A); homeA = pageA; db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(homeA, A);
    const pageB = page("page-beta", B); db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageB, B);
    const post = (slug, title, s) => { const id = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, comments_enabled) VALUES (?, ?, '<p>x</p>', 'html', 'published', 1, datetime('now'), 1)").run(slug, title).lastInsertRowid); if (s) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, ?, ?)").run(id, orgId, s); return id; };
    postA = post("art-a", "Article A", A); postB = post("art-b", "Article B", B); postM = post("art-m", "Article principal", null);
    const com = (p, who, body) => Number(db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, author_email, body, status) VALUES (?, 'post', ?, ?, 'x@y.z', ?, 'pending')").run(p, p, who, body).lastInsertRowid);
    com(postA, "Awa", "Premier"); com(postA, "Moussa", "<b>Second</b>"); com(postB, "Zoé", "Beta"); com(postM, "Luc", "Principal");
  });
  after(() => { db.close(); return srv.stop(); });

  describe("intégration dans la coque", () => {
    test("une seule barre sur les écrans du CMS (principal, site, listes, fiche de page) ; aucune sur le site public, la connexion ni les éditeurs plein cadre", async () => {
      for (const u of ["/marketing/site-web/principal/tableau-de-bord", `${SP}/${A}/tableau-de-bord`, `${SP}/${A}/pages`, "/marketing/site-web/articles", "/marketing/site-web/mediatheque", `/marketing/pages/${pageA}`]) {
        const r = await boss.get(u); assert.equal(r.status, 200, u);
        assert.equal((r.text.match(/<nav class="kab"/g) || []).length, 1, `${u} : une seule barre`);
        assert.match(r.text, /href="[^"]*adminbar\.css/); assert.match(r.text, /src="[^"]*adminbar\.js/);
      }
      for (const u of ["/", "/connexion", "/marketing/site-web/sites", `/marketing/pages/${pageA}/apercu`, `/marketing/site-web/personnaliser?site=${A}`]) assert.doesNotMatch((await boss.get(u)).text, /<nav class="kab"/, `${u} : pas de barre`);
    });
    test("plus de doublon dans la barre du haut : un seul menu de compte, un seul bouton de thème, plus de sélecteur de site dans le menu latéral", async () => {
      const t = (await boss.get(`${SP}/${A}/tableau-de-bord`)).text;
      assert.equal((t.match(/id="mk-user-menu"/g) || []).length, 1); assert.equal((t.match(/data-kola-theme-cycle/g) || []).length, 1);
      assert.doesNotMatch(t, /mk-cms-site-btn|mk-cms-add|mk-cms-topsearch/);
      // Ordre vertical : (1) barre d'administration globale, puis la coque (rail / menu / contenu). Plus de barre de chemin globale :
      // le fil d'Ariane est dans le bandeau de contexte, en haut de la zone de contenu (CADRE-CMS-01)
      const iBar = t.indexOf('<nav class="kab"'), iApp = t.indexOf('<div class="mk-app'), iMain = t.indexOf('<div class="mk-main">');
      assert.ok(iBar > 0 && iBar < iApp && iApp < iMain, `ordre : barre ${iBar} < coque ${iApp} < contenu ${iMain}`);
      assert.doesNotMatch(t, /kab-crumbbar/, "plus de barre de chemin globale");
      assert.doesNotMatch(t.slice(iApp, iMain), /mk-breadcrumb/, "aucun fil d'Ariane au-dessus du contenu (menu et rail compris)");
      assert.doesNotMatch(t.slice(iMain), /class="mk-topbar/);
      assert.equal((t.match(/class="mk-breadcrumb mk-cms-crumbs"/g) || []).length, 1, "un seul fil d'Ariane, dans la zone de contenu");
    });
    test("les écrans hors CMS (Marketing) gardent leur barre d'origine", async () => {
      const t = (await boss.get("/marketing/campagnes")).text;
      assert.doesNotMatch(t, /<nav class="kab"/); assert.match(t, /id="mk-user-menu"/); assert.match(t, /<div class="mk-main">\s*<header class="mk-topbar">/, "hors CMS, le fil d'Ariane reste dans la colonne du contenu");
    });
  });

  describe("sélecteur de site", () => {
    test("équipe : site principal + tous les sites actifs, identifiés par leur nom et leur domaine ; « Gérer les sites » ; site courant marqué", async () => {
      const b = bar((await boss.get(`${SP}/${A}/tableau-de-bord`)).text);
      assert.match(b, /Site principal/); assert.match(b, /Alpha[\s\S]*alpha\.example/); assert.match(b, /Beta/); assert.match(b, /Gérer les sites/);
      assert.match(b, new RegExp(`href="${SP}/${A}/tableau-de-bord"[^>]*aria-current="true"`));
      assert.doesNotMatch(b, /Archivé/, "un site archivé n'est pas proposé");
      for (const href of links(b).filter((h) => /\/tableau-de-bord$/.test(h))) assert.equal((await boss.get(href)).status, 200, href);
    });
    test("accès limité à A : uniquement A, sans site principal ni « Gérer les sites » ; changer de contexte n'expose jamais B", async () => {
      const t = (await adminA.get(`${SP}/${A}/tableau-de-bord`)).text, b = bar(t);
      assert.match(b, /Alpha/); assert.doesNotMatch(b, /Beta|Site principal|Gérer les sites/);
      assert.equal((await adminA.get(`${SP}/${B}/tableau-de-bord`)).status, 403);
      assert.equal((await adminA.get("/marketing/site-web/principal/tableau-de-bord")).status, 403);
    });
    test("un nom de site contenant du HTML est échappé dans la barre (aucune balise injectée)", async () => {
      const b = bar((await boss.get(`${SP}/${A}/tableau-de-bord`)).text);
      assert.ok(b.includes("&lt;img src=x onerror=alert(1)&gt;")); assert.doesNotMatch(b, /<img src=x/);
    });
  });

  describe("accès au site public", () => {
    test("domaine propre : adresse du domaine ; sans domaine : accueil publié sur la plateforme ; sans page publiée ou archivé : désactivé et expliqué ; principal : racine", async () => {
      assert.match(bar((await boss.get(`${SP}/${A}/tableau-de-bord`)).text), /class="kab-btn kab-public[^"]*" href="https:\/\/alpha\.example\/" target="_blank" rel="noopener"/);
      const hb = bar((await boss.get(`${SP}/${B}/tableau-de-bord`)).text);
      assert.match(hb, /class="kab-btn kab-public[^"]*" href="\/p\/page-beta" target="_blank"/);
      db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE slug = 'page-beta'").run();
      assert.match(bar((await boss.get(`${SP}/${B}/tableau-de-bord`)).text), /kab-public[^"]* is-disabled" role="link" aria-disabled="true"[^>]*data-tip="Ce site n(?:'|&#39;)a encore aucune page publiée\."/);
      db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE slug = 'page-beta'").run();
      assert.match(bar((await boss.get("/marketing/site-web/principal/tableau-de-bord")).text), /kab-public[^"]*" href="\/" target="_blank"/);
    });
  });

  describe("création rapide", () => {
    test("équipe dans A : page, article, média, formulaire du site A (jamais d'un autre site) et nouveau site", async () => {
      const b = bar((await boss.get(`${SP}/${A}/tableau-de-bord`)).text);
      const create = [...b.matchAll(/data-kab-create="(\w+)"/g)].map((m) => m[1]);
      assert.deepEqual(create, ["page", "article", "media", "form", "site"]);
      for (const h of links(b).filter((x) => /pages#nouvelle|articles\/ajouter|medias\/ajouter|formulaires#nouveau/.test(x))) assert.ok(h.startsWith(`${SP}/${A}/`), h);
    });
    test("selon les droits : l'administrateur du site crée dans son site (pas de « Site » : réservé à l'équipe) ; le lecteur ne voit aucune création", async () => {
      const ca = [...bar((await adminA.get(`${SP}/${A}/tableau-de-bord`)).text).matchAll(/data-kab-create="(\w+)"/g)].map((m) => m[1]);
      assert.ok(ca.includes("page") && !ca.includes("site"), ca.join());
      const cv = bar((await viewerA.get(`${SP}/${A}/tableau-de-bord`)).text);
      assert.doesNotMatch(cv, /kab-create|data-kab-create/);
    });
    test("chaque entrée de création mène à un écran existant (jamais 404)", async () => {
      for (const h of links(bar((await boss.get(`${SP}/${A}/tableau-de-bord`)).text)).filter((x) => /pages#nouvelle|articles\/ajouter|medias\/ajouter|formulaires#nouveau|sites#nouveau/.test(x))) {
        const r = await boss.get(h.replace(/#.*$/, "")); assert.ok(r.status === 200 || r.status === 302, `${h} : ${r.status}`);
      }
    });
  });

  describe("actions liées à l'écran et au contenu consulté", () => {
    test("fiche d'une page : modifier avec l'éditeur, prévisualiser, voir la page — avec l'identifiant de CETTE page ; page non publiée : pas de « Voir la page »", async () => {
      const ctx = [...bar((await boss.get(`/marketing/pages/${pageA}`)).text).matchAll(/data-kab-ctx="([\w-]+)"/g)].map((m) => m[1]);
      assert.deepEqual(ctx, ["page-editor", "page-preview", "page-view"]);
      assert.ok(links(bar((await boss.get(`/marketing/pages/${pageA}`)).text)).includes(`/marketing/pages/${pageA}/editeur`));
      const draft = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id) VALUES (?, 'Brouillon', 'brouillon-a', 'Brouillon', ?, 'draft', 'page', ?)").run(orgId, SECTIONS, A).lastInsertRowid);
      assert.deepEqual([...bar((await boss.get(`/marketing/pages/${draft}`)).text).matchAll(/data-kab-ctx="([\w-]+)"/g)].map((m) => m[1]), ["page-editor", "page-preview"]);
    });
    test("tableau de bord d'un site : « Page d'accueil » (sa vraie page) et « Personnaliser » (ce site) ; sans page d'accueil : seulement « Personnaliser »", async () => {
      const b = bar((await boss.get(`${SP}/${A}/tableau-de-bord`)).text);
      assert.ok(links(b).includes(`/marketing/pages/${homeA}/editeur`)); assert.ok(links(b).includes(`/marketing/site-web/personnaliser?site=${A}`));
      const g = bar((await boss.get(`${SP}/${C}/tableau-de-bord`)).text);
      assert.doesNotMatch(g, /data-kab-ctx="home-edit"/); assert.match(g, /data-kab-ctx="customize"/);
    });
    test("aucune action de page là où aucune page n'est consultée (liste des médias)", async () => {
      assert.doesNotMatch(bar((await boss.get(`${SP}/${A}/medias`)).text), /data-kab-ctx="page-/);
    });
  });

  describe("notifications : données réelles, par site", () => {
    const unread = async (c, site) => json(await c.get(`${NF}/notifications.json${site ? `?site=${site}` : ""}`));
    test("compteurs et listes propres à chaque site : A = 2, B = 1, principal = 1 ; le texte reste du texte", async () => {
      const a = await unread(boss, A), b = await unread(boss, B), m = await unread(boss, null);
      assert.equal(a.unread, 2); assert.equal(b.unread, 1);
      // Le principal ajoute à ses commentaires l'activité de la plateforme du formateur (ici : les comptes élèves créés par le test) ; jamais les commentaires d'un site
      assert.equal(m.items.filter((i) => i.kind === "comment").length, 1); assert.ok(m.items.every((i) => i.kind === "comment" || i.kind === "user")); assert.ok(m.unread >= 2, "principal : " + m.unread);
      globalThis.__principal = m.unread;
      assert.deepEqual(a.items.map((i) => i.detail).sort(), ["Awa · Article A", "Moussa · Article A"]);
      assert.ok(a.items.every((i) => i.title === "Commentaire à modérer" && i.unread));
      assert.ok(a.items.some((i) => i.excerpt === "<b>Second</b>"), "le contenu est renvoyé brut ; l'interface l'affiche en texte");
      assert.match(bar((await boss.get(`${SP}/${A}/tableau-de-bord`)).text), /data-kab-badge>2</);
      assert.match(bar((await boss.get(`${SP}/${B}/tableau-de-bord`)).text), /data-kab-badge>1</);
    });
    test("accès limité à A : ses notifications seulement ; B et le principal refusés (403), site forgé refusé", async () => {
      const bare = await adminA.get(`${NF}/notifications.json`);
      assert.ok(bare.status === 403 || bare.status === 302 || (bare.status === 200 && json(bare).siteName === "Alpha"), `sans site, un accès limité n'obtient jamais le principal (${bare.status})`);
      assert.equal((await unread(adminA, A)).unread, 2);
      for (const s of [B, "0", "abc"]) { const r = await adminA.get(`${NF}/notifications.json?site=${s}`); assert.ok([302, 403].includes(r.status), `site=${s} : ${r.status}`); assert.doesNotMatch(r.text, /"items"/, `site=${s} : rien n'est servi`); }
      for (const p of ["/notifications/lu", "/notifications/tout-lu"]) assert.equal((await adminA.postJson(`${NF}${p}?site=${B}`, { site: String(B), key: "comment:3" })).status, 403, p);
    });
    test("lecteur (sans droit de modération) : pas de cloche, liste vide", async () => {
      assert.doesNotMatch(bar((await viewerA.get(`${SP}/${A}/tableau-de-bord`)).text), /kab-bell/);
      assert.equal((await unread(viewerA, A)).unread, 0);
    });
    test("marquer comme lue : seulement un élément de CE site ; celui d'un autre site est refusé et rien ne change", async () => {
      const ids = (s) => db.prepare("SELECT id FROM blog_comments WHERE content_id = ?").all(s).map((r) => r.id);
      const cA = ids(postA)[0], cB = ids(postB)[0];
      const bad = await boss.postJson(`${NF}/notifications/lu?site=${A}`, { site: String(A), key: `comment:${cB}` });
      assert.equal(bad.status, 404); assert.equal((await unread(boss, B)).unread, 1);
      const ok = json(await boss.postJson(`${NF}/notifications/lu?site=${A}`, { site: String(A), key: `comment:${cA}` }));
      assert.equal(ok.ok, true); assert.equal(ok.unread, 1); assert.equal(ok.label, "1");
      assert.ok(one("SELECT 1 x FROM activity_reads WHERE item_key = ?", `comment:${cA}`), "l'état « lu » est celui du centre d'activité");
      assert.equal((await unread(boss, A)).unread, 1); assert.equal((await unread(boss, B)).unread, 1, "B inchangé");
      assert.equal((await boss.postJson(`${NF}/notifications/lu?site=${A}`, { site: String(A), key: "n-importe-quoi" })).status, 404);
    });
    test("« tout marquer comme lu » : seulement le site courant (B et le principal gardent leurs non lus) ; état vide propre ensuite", async () => {
      const r = json(await boss.postJson(`${NF}/notifications/tout-lu?site=${A}`, { site: String(A) }));
      assert.equal(r.unread, 0); assert.equal(r.label, "0");
      assert.equal((await unread(boss, A)).unread, 0); assert.equal((await unread(boss, B)).unread, 1); assert.equal((await unread(boss, null)).unread, globalThis.__principal, 'le principal garde ses non lus');
      const after = await unread(boss, A); assert.ok(after.items.every((i) => !i.unread), "les éléments restent listés, marqués lus");
      assert.doesNotMatch(bar((await boss.get(`${SP}/${A}/tableau-de-bord`)).text), /data-kab-badge>\d/);
    });
    test("ouvrir une notification : marquée lue puis redirection vers l'écran du SITE ; un élément d'un autre site renvoie au tableau de bord sans rien marquer", async () => {
      const cB = db.prepare("SELECT id FROM blog_comments WHERE content_id = ?").get(postB).id;
      const bad = await boss.get(`${NF}/ouvrir?cle=comment:${cB}&site=${A}`);
      assert.equal(bad.status, 302); assert.equal(bad.location, `${SP}/${A}/tableau-de-bord`); assert.equal((await unread(boss, B)).unread, 1);
      const open = await boss.get(`${NF}/ouvrir?cle=comment:${cB}&site=${B}`);
      assert.equal(open.status, 302); assert.equal(open.location, `${SP}/${B}/commentaires/en-attente`); assert.equal((await unread(boss, B)).unread, 0);
      const main = db.prepare("SELECT id FROM blog_comments WHERE content_id = ?").get(postM).id;
      assert.equal((await boss.get(`${NF}/ouvrir?cle=comment:${main}`)).location, "/marketing/site-web/commentaires/en-attente");
    });
    test("visiteur non connecté : aucune réponse utile", async () => {
      const r = await fetch(`${srv.base}${NF}/notifications.json`, { redirect: "manual" });
      assert.ok([301, 302, 303, 401, 403].includes(r.status)); assert.doesNotMatch(await r.text(), /"items"/);
    });
  });

  describe("profil, déconnexion et accessibilité", () => {
    test("formateur : nom, rôle, profil, compte, mon espace, thème (clair / sombre / auto) et déconnexion par le formulaire POST sécurisé existant", async () => {
      const b = bar((await boss.get(`${SP}/${A}/tableau-de-bord`)).text);
      assert.match(b, /class="kab-user-name">Prof</); assert.match(b, /Formateur/);
      for (const h of ["/formateur/profil", "/mon-compte", "/formateur"]) assert.ok(links(b).includes(h), h);
      assert.match(b, /<form action="\/deconnexion" method="post"[^>]*><button type="submit" role="menuitem"/);
      for (const m of ["light", "dark", "auto"]) assert.match(b, new RegExp(`data-kola-theme-set="${m}"`));
      for (const h of ["/formateur/profil", "/mon-compte"]) assert.equal((await boss.get(h)).status, 200, h);
    });
    test("la déconnexion invalide réellement la session", async () => {
      const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(B, idOf(c));
      assert.equal((await c.get(`${SP}/${B}/tableau-de-bord`)).status, 200);
      assert.equal((await c.post("/deconnexion", {})).status, 302);
      const after = await c.get(`${SP}/${B}/tableau-de-bord`); assert.ok(after.status === 302 || after.status === 401 || after.status === 403, `après déconnexion : ${after.status}`);
    });
    test("membre non formateur : « Mon profil » mène au compte, « Mes formations »", async () => {
      const b = bar((await adminA.get(`${SP}/${A}/tableau-de-bord`)).text);
      assert.ok(links(b).includes("/mon-compte")); assert.ok(links(b).includes("/mes-cours")); assert.doesNotMatch(b, /\/formateur\/profil/);
    });
    test("accessibilité : chaque menu a un bouton déclencheur nommé avec aria-haspopup / aria-expanded / aria-controls vers un menu existant ; boutons icônes nommés", async () => {
      const t = (await boss.get(`${SP}/${A}/tableau-de-bord`)).text, b = bar(t);
      const triggers = [...b.matchAll(/<button[^>]*data-kab-toggle[^>]*>/g)].map((m) => m[0]);
      assert.ok(triggers.length >= 5, `déclencheurs : ${triggers.length}`);
      for (const tr of triggers) {
        assert.match(tr, /aria-haspopup="(menu|dialog)"/); assert.match(tr, /aria-expanded="false"/);
        const id = /aria-controls="([^"]+)"/.exec(tr)[1]; assert.ok(b.includes(`id="${id}"`), `${id} existe`);
      }
      assert.match(b, /aria-label="Barre d'administration"/); assert.match(b, /role="menu"/); assert.match(b, /role="menuitem"/);
      for (const m of b.matchAll(/<button[^>]*class="[^"]*kab-icon[^"]*"[^>]*>/g)) assert.match(m[0], /aria-label=/);
      assert.match(b, /<noscript|aria-live="polite"/);
    });
  });
});
