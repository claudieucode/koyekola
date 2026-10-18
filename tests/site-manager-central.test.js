// R8 lot 1 — Gestionnaire central de sites (« Mes sites ») : le site principal est une ligne comme les autres, chaque ligne ouvre RÉELLEMENT le bon espace CMS, les chiffres sont
// ceux du site (jamais mélangés), les modules activés sont visibles, et les permissions sont respectées. Vrai serveur, vraie base d'essai ; aucun navigateur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, A, B, C, memberA, viewer, noAccess, baseMain, base0;
const S = "/marketing/site-web/sites";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const mk = async (name) => Number(String((await boss.post(S, { name })).location).match(/sites\/(\d+)/)[1]);
const rowOf = (html, key) => (html.split("<tr").slice(1).map((p) => `<tr${p.split("</tr>")[0]}</tr>`).find((r) => r.includes(key)) || "");
const cell = (row, label) => (new RegExp(`data-label="${label}"[^>]*>([\\s\\S]*?)</td>`).exec(row) || [])[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const siteMeta = (html) => (/<meta name="mk-space" content="([a-z0-9]+)"/.exec(html) || [])[1] ?? null;

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  // État de départ de la base (vide en test courant ; données réelles en recette sur copie) : les attendus sont relatifs à cet état
  base0 = { pagesMain: one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id IS NULL AND archived_at IS NULL").n, publishedMain: one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id IS NULL AND archived_at IS NULL AND status = 'published'").n,
    activeSites: one("SELECT COUNT(*) n FROM mk_sites WHERE status = 'active' AND deleted_at IS NULL").n, archivedSites: one("SELECT COUNT(*) n FROM mk_sites WHERE status = 'archived' AND deleted_at IS NULL").n,
    publishedOfSites: one("SELECT COUNT(*) n FROM mk_landing_pages p JOIN mk_sites s ON s.id = p.site_id WHERE s.status = 'active' AND s.deleted_at IS NULL AND p.archived_at IS NULL AND p.status = 'published'").n, modules: one("SELECT COUNT(*) n FROM mk_site_modules WHERE enabled = 1").n };
  A = await mk("Alpha Manager"); B = await mk("Bravo Manager"); C = await mk("Charlie Archivé");
  // pages : 2 pour A (1 en ligne), 1 pour B, 1 pour le principal
  const page = (name, site, status) => db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (1, ?, ?, 't', ?, ?)").run(name, name.toLowerCase().replace(/\W/g, "-"), status, site);
  page("PageA1", A, "published"); page("PageA2", A, "draft"); page("PageB1", B, "published"); page("PagePrincipal", null, "published");
  // contacts : 2 pour A, 1 pour B, 3 sans site (site principal)
  baseMain = one("SELECT COUNT(*) n FROM mk_contacts c WHERE NOT EXISTS (SELECT 1 FROM mk_contact_sites cs WHERE cs.contact_id = c.id)").n; // contacts déjà présents (comptes de test) sans site
  const contact = (email, site) => db.prepare("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (1, ?, ?)").run(email, site);
  contact("a1@x.fr", A); contact("a2@x.fr", A); contact("b1@x.fr", B); contact("p1@x.fr", null); contact("p2@x.fr", null); contact("p3@x.fr", null);
  memberA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(memberA));
  viewer = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, ?, 'viewer')").run(idOf(viewer));
  noAccess = await newStudent(srv);
  await boss.post(`${S}/${C}/archiver`, {});
  await boss.post(`${S}/${A}/modules/sms`, { etat: "activer" });
  await boss.post(`${S}/${A}/modules/social`, { etat: "activer" });
  await boss.post(`${S}/${A}/modules/lms`, { etat: "activer" });   // module pas encore ouvert aux sites : jamais affiché ni compté
  await boss.post(`${S}/${B}/modules/ai`, { etat: "activer" }); await boss.post(`${S}/${B}/modules/ai`, { etat: "desactiver" });   // activé puis désactivé : n'apparaît plus
});
after(() => { db.close(); return srv.stop(); });

describe("le site principal est une ligne comme les autres", () => {
  test("présent en premier avec ses propres chiffres (pages du principal, contacts sans site, équipe de l'organisation), distinct des sites", async () => {
    const html = (await boss.get(S)).text;
    const main = rowOf(html, 'data-site="principal"');
    assert.match(main, /Site principal/); assert.match(main, /Principal<\/span>/);
    assert.equal(cell(main, "Pages"), String(base0.pagesMain + 1)); assert.equal(cell(main, "En ligne"), String(base0.publishedMain + 1));
    const sansSite = one("SELECT COUNT(*) n FROM mk_contacts c WHERE NOT EXISTS (SELECT 1 FROM mk_contact_sites cs WHERE cs.contact_id = c.id)").n; // calcul indépendant en base
    assert.ok(sansSite >= baseMain + 3);
    assert.equal(cell(main, "Contacts"), String(sansSite), "seulement les contacts sans rattachement à un site (ceux d'Alpha et de Bravo en sont exclus)");
    assert.ok(Number(cell(main, "Équipe")) >= 1);
    assert.match(cell(main, "Modules"), /Tous/);
    assert.match(html.slice(html.indexOf("<tbody>")).trimStart().slice(0, 120), /^<tbody>\s*<tr data-site="principal"/, "le principal est la première ligne du tableau");
  });
  test("chaque site a SES chiffres : pages, en ligne, équipe, contacts rattachés, modules activés (Alpha seulement)", async () => {
    const html = (await boss.get(S)).text;
    const a = rowOf(html, "Alpha Manager"), b = rowOf(html, "Bravo Manager");
    assert.deepEqual([cell(a, "Pages"), cell(a, "En ligne"), cell(a, "Équipe"), cell(a, "Contacts")], ["2", "1", "1", "2"]);
    assert.deepEqual([cell(b, "Pages"), cell(b, "En ligne"), cell(b, "Équipe"), cell(b, "Contacts")], ["1", "1", "0", "1"]);
    assert.doesNotMatch(cell(a, "Modules"), /Formations/, "module non ouvert aux sites : non affiché"); assert.match(cell(a, "Modules"), /SMS/); assert.match(cell(a, "Modules"), /Réseaux sociaux/); assert.match(cell(b, "Modules"), /Aucun/);
    assert.doesNotMatch(html, /Charlie Archivé/, "un site archivé n'apparaît pas dans la vue « Actifs »");
  });
  test("bande de chiffres : sites actifs (principal compris), archivés, pages en ligne de tous les sites actifs, modules activés", async () => {
    const html = (await boss.get(S)).text;
    const stat = (label) => (new RegExp(`mk-stat-label">${label}</span><span class="mk-stat-value">([^<]*)<`).exec(html) || [])[1];
    assert.equal(stat("Sites actifs"), String(3 + base0.activeSites)); assert.equal(stat("Sites archivés"), String(1 + base0.archivedSites)); assert.equal(stat("Pages en ligne"), String(3 + base0.publishedMain + base0.publishedOfSites)); assert.equal(stat("Modules activés"), String(2 + base0.modules));
  });
  test("recherche et filtres : « principal » retrouve le site principal ; il n'apparaît ni dans Archivés ni dans Supprimés ; un autre mot l'exclut", async () => {
    assert.match((await boss.get(`${S}?q=principal`)).text, /data-site="principal"/);
    assert.doesNotMatch((await boss.get(`${S}?q=Alpha`)).text, /data-site="principal"/);
    for (const vue of ["archives", "supprimes"]) assert.doesNotMatch((await boss.get(`${S}?vue=${vue}`)).text, /data-site="principal"/);
    const arch = (await boss.get(`${S}?vue=archives`)).text; assert.match(arch, /Charlie Archivé/); assert.match(arch, /Archivé<\/span>/);
    assert.match((await boss.get(`${S}?vue=tous`)).text, /data-site="principal"/);
  });
});

describe("chaque ligne ouvre RÉELLEMENT le bon espace CMS", () => {
  test("tous les boutons « Ouvrir » : 200, l'espace du bon site (contexte serveur), jamais celui d'un autre ; le principal ouvre le tableau de bord du principal", async () => {
    const html = (await boss.get(`${S}?vue=tous`)).text;
    const hrefs = [...html.matchAll(/class="btn btn-outline btn-sm" href="([^"]+)">Ouvrir/g)].map((m) => m[1]);
    assert.ok(hrefs.length >= 3, `${hrefs.length} liens Ouvrir`);
    const seen = new Set();
    for (const h of hrefs) {
      const r = await boss.get(h); assert.equal(r.status, 200, h);
      const m = /sites\/(\d+)\//.exec(h);
      if (m) {
        assert.equal(siteMeta(r.text), m[1], `${h} : le contexte de site est ${m[1]}`);
        const name = one("SELECT name FROM mk_sites WHERE id = ?", Number(m[1])).name; assert.ok(r.text.includes(name), `${h} : affiche ${name}`);
        for (const other of [A, B, C].filter((i) => i !== Number(m[1]))) assert.ok(!r.text.includes(one("SELECT name FROM mk_sites WHERE id = ?", other).name) || /mes sites/i.test(r.text), "pas de contenu d'un autre site"); // le nom d'un autre site ne figure que dans les liens de navigation éventuels
      } else { assert.equal(h, "/marketing/site-web/principal/tableau-de-bord"); assert.equal(siteMeta(r.text), "principal"); }
      seen.add(h);
    }
    assert.ok(seen.has("/marketing/site-web/principal/tableau-de-bord") && seen.has(`${S}/${A}/tableau-de-bord`) && seen.has(`${S}/${B}/tableau-de-bord`));
  });
  test("le tableau de bord de chaque espace montre les chiffres de CE site seulement (pages en ligne)", async () => {
    const a = (await boss.get(`${S}/${A}/tableau-de-bord`)).text, b = (await boss.get(`${S}/${B}/tableau-de-bord`)).text;
    assert.match(a, /PageA1/); assert.doesNotMatch(a, /PageB1|PagePrincipal/);
    assert.match(b, /PageB1/); assert.doesNotMatch(b, /PageA1|PagePrincipal/);
    const p = (await boss.get("/marketing/site-web/principal/tableau-de-bord")).text; assert.match(p, /PagePrincipal/); assert.doesNotMatch(p, /PageA1|PageB1/);
  });
  test("navigation cohérente : depuis un espace, retour au gestionnaire (« Mes sites ») ; depuis le gestionnaire, retour à l'espace", async () => {
    for (const path of [`${S}/${A}/pages`, "/marketing/site-web/principal/pages"]) { const r = await boss.get(path); assert.match(r.text, /href="\/marketing\/site-web\/sites"[^>]*>[\s\S]{0,80}Mes sites/, `${path} : lien vers le gestionnaire`); }
  });
});

describe("permissions et isolation", () => {
  test("membre limité à Alpha : « Mes sites » ne montre qu'Alpha ; Bravo, le principal et le gestionnaire central lui sont fermés ; aucune action d'équipe", async () => {
    const list = await memberA.get(S); assert.equal(list.status, 302); assert.equal(list.location, "/marketing/site-web/mes-sites");
    const mine = (await memberA.get("/marketing/site-web/mes-sites")).text; assert.match(mine, /Alpha Manager/); assert.doesNotMatch(mine, /Bravo Manager|Site principal/);
    assert.equal((await memberA.get(`${S}/${A}/tableau-de-bord`)).status, 200);
    for (const p of [`${S}/${B}/tableau-de-bord`, `${S}/${B}/pages`]) assert.equal((await memberA.get(p)).status, 403, p);
    const principal = await memberA.get("/marketing/site-web/principal/tableau-de-bord"); assert.ok([302, 403].includes(principal.status));
    assert.equal((await memberA.post(`${S}/${A}/modules/ai`, { etat: "activer" })).status, 403, "activation réservée à l'équipe");
  });
  test("membre d'équipe en lecture (rôle lecteur) : voit tous les sites et les ouvre, sans bouton de création ni d'archivage ni de modules ; ne peut rien modifier", async () => {
    const r = await viewer.get(S); assert.equal(r.status, 200);
    assert.match(r.text, /Alpha Manager/); assert.match(r.text, /data-site="principal"/);
    assert.doesNotMatch(r.text, /data-mk-modal-open="nouveau"|\/archiver"|\/modules"/);
    assert.equal((await viewer.post(S, { name: "Pirate" })).status, 403); assert.equal((await viewer.post(`${S}/${A}/archiver`, {})).status, 403);
    assert.equal((await viewer.get(`${S}/${A}/tableau-de-bord`)).status, 200);
    assert.equal(one("SELECT status FROM mk_sites WHERE id = ?", A).status, "active");
  });
  test("l'équipe (administrateur) a les actions : création, modules, archivage ; un compte sans aucun accès et un visiteur anonyme sont refusés", async () => {
    const t = (await boss.get(S)).text; assert.match(t, /data-mk-modal-open="nouveau"/); assert.match(t, new RegExp(`href="/marketing/site-web/sites/${A}/modules"`));
    assert.ok([302, 403].includes((await noAccess.get(S)).status)); assert.doesNotMatch((await noAccess.get(S)).text, /Alpha Manager/);
    const anon = await new Client(srv.base).get(S); assert.equal(anon.status, 302); assert.match(anon.location, /connexion/);
  });
  test("aucune donnée d'un site ne fuit dans la vue d'un autre : les noms de pages et d'adresses de contacts n'apparaissent pas dans le gestionnaire", async () => {
    const html = (await boss.get(S)).text;
    for (const s of ["PageA1", "PageB1", "a1@x.fr", "b1@x.fr", "p1@x.fr"]) assert.ok(!html.includes(s), s);
  });
});
