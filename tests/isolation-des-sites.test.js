// Palier 2 — isolation des sites : contexte de site, accès croisé entre sites (lecture, modification, suppression, création, usurpation de site_id),
// garde-fous de la base, migration (données conservées) et contrôle d'audit — par les vraies routes d'un vrai serveur et la vraie base.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId, memA, memB, outsider, anon;
let A, B, pageA, pageB, pageMain, compA, compB, compGlobal, listB, funnelB;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const uid = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const ORIGIN = () => ({ Origin: srv.base });
const mkSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-")).lastInsertRowid);
const mkPage = (site, name) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, ?, ?, ?, 'draft', ?)").run(orgId, name, `iso-${name.toLowerCase().replace(/\W+/g, "-")}`, name, site).lastInsertRowid);
const mkComp = (site, name) => Number(db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section) VALUES (?, ?, ?, ?)").run(orgId, site, name, JSON.stringify({ type: "text", title: name, body: "x" })).lastInsertRowid);
const page = (id) => one("SELECT * FROM mk_landing_pages WHERE id = ?", id);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  A = mkSite("Site A"); B = mkSite("Site B");
  pageA = mkPage(A, "Page A"); pageB = mkPage(B, "Page B"); pageMain = mkPage(null, "Page Principale");
  compA = mkComp(A, "Comp A"); compB = mkComp(B, "Comp B"); compGlobal = mkComp(null, "Comp Global");
  memA = await newStudent(srv); memB = await newStudent(srv); outsider = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, uid(memA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(B, uid(memB));
  listB = Number(db.prepare("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (?, 'Liste B', ?)").run(orgId, B).lastInsertRowid);
  funnelB = Number(db.prepare("INSERT INTO mk_funnels (organization_id, name, site_id) VALUES (?, 'Tunnel B', ?)").run(orgId, B).lastInsertRowid);
});
after(() => srv.stop());

describe("C — contexte de site (service)", () => {
  // Le service lit la base du serveur de test (DATA_DIR) : défini avant de charger les modules de base de données
  let ctxSvc;
  before(() => { process.env.DATA_DIR = path.join(srv.dir, "data"); ctxSvc = require("../src/services/siteContext"); });
  const who = (c) => ({ userId: uid(c), organizationId: orgId });
  const bossWho = () => ({ userId: one("SELECT id FROM users WHERE role = 'formateur'").id, organizationId: orgId });
  test("site accessible : contexte établi avec ses droits ; l'équipe accède à tous les sites", () => {
    const r = ctxSvc.resolve(db, who(memA), A);
    assert.equal(r.ok, true); assert.equal(r.site.id, A); assert.ok(r.perms.has("forms.write"));
    assert.equal(ctxSvc.resolve(db, bossWho(), B).ok, true);
  });
  test("passage de A à B : chaque résolution est indépendante (aucun état gardé)", () => {
    assert.equal(ctxSvc.resolve(db, who(memA), A).site.id, A);
    assert.equal(ctxSvc.resolve(db, who(memA), B).ok, false);
    assert.equal(ctxSvc.resolve(db, who(memA), A).site.id, A, "revenir sur A fonctionne toujours");
  });
  test("refus nets : site d'un autre, sans accès, inexistant, invalide, site principal pour un accès limité", () => {
    assert.equal(ctxSvc.resolve(db, who(memA), B).reason, "not_found", "ne révèle pas l'existence du site B");
    assert.equal(ctxSvc.resolve(db, who(outsider), A).ok, false);
    assert.equal(ctxSvc.resolve(db, bossWho(), 99999).reason, "not_found");
    assert.equal(ctxSvc.resolve(db, bossWho(), "1; DROP").reason, "invalid");
    assert.equal(ctxSvc.resolve(db, who(memA), null).reason, "forbidden");
    assert.equal(ctxSvc.resolve(db, bossWho(), null).ok, true);
  });
  test("site archivé ou supprimé : refusé sauf demande explicite ; accès retiré = effet immédiat", () => {
    const C = mkSite("Site C");
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(C, uid(memA));
    assert.equal(ctxSvc.resolve(db, who(memA), C).ok, true);
    db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(C);
    assert.equal(ctxSvc.resolve(db, who(memA), C).reason, "archived");
    assert.equal(ctxSvc.resolve(db, who(memA), C, { allowArchived: true }).ok, true);
    db.prepare("UPDATE mk_sites SET deleted_at = datetime('now') WHERE id = ?").run(C);
    assert.equal(ctxSvc.resolve(db, who(memA), C, { allowArchived: true }).reason, "deleted");
    db.prepare("DELETE FROM mk_site_members WHERE site_id = ? AND user_id = ?").run(C, uid(memA));
    assert.equal(ctxSvc.resolve(db, who(memA), C, { allowArchived: true, allowDeleted: true }).ok, false);
  });
});

describe("A/B — accès croisé par les routes (membre du site A)", () => {
  test("témoin : le membre de A lit et enregistre sa page", async () => {
    assert.equal((await memA.get(`/marketing/pages/${pageA}`)).status, 200);
    const r = await memA.post(`/marketing/pages/${pageA}`, { name: "Page A", slug: page(pageA).slug, site_id: String(A), revision: String(page(pageA).revision), title: "T", description: "", form_id: "", tags: "" });
    assert.equal(page(pageA).site_id, A);
    assert.ok([200, 302].includes(r.status));
  });
  test("lecture : page, éditeur, aperçu, historique, composant, tunnel, liste, site du site B refusés", async () => {
    for (const u of [`/marketing/pages/${pageB}`, `/marketing/pages/${pageB}/editeur`, `/marketing/pages/${pageB}/apercu`, `/marketing/site-web/historique/page/${pageB}`,
      `/marketing/site-web/composants/${compB}.json`, `/marketing/tunnels/${funnelB}`, `/marketing/listes/${listB}`, `/marketing/site-web/sites/${B}`, `/marketing/site-web/sites/${B}/reglages.json`]) {
      const r = await memA.get(u);
      assert.equal(r.status, 403, u);
    }
  });
  test("lecture : ressources sans site (site principal) et écrans non rattachés à un site refusés", async () => {
    for (const u of [`/marketing/pages/${pageMain}`, "/marketing/pages", "/marketing/site-web/medias.json", "/marketing/site-web/utilisateurs", "/marketing/contacts", "/marketing/campagnes"]) {
      const r = await memA.get(u);
      assert.ok(r.status === 403 || (r.status === 302 && /mes-sites/.test(r.location)), `${u} → ${r.status}`);
    }
  });
  test("modification : enregistrer, publier, programmer, dupliquer, archiver, restaurer une page de B refusé, rien ne change", async () => {
    const before = JSON.stringify(page(pageB));
    for (const [m, u, body] of [["post", `/marketing/pages/${pageB}`, { name: "Pirate", site_id: String(B), revision: "0" }], ["post", `/marketing/pages/${pageB}/publier`, {}],
      ["post", `/marketing/pages/${pageB}/dupliquer`, {}], ["post", `/marketing/pages/${pageB}/archiver`, {}], ["post", `/marketing/pages/${pageB}/depublier`, {}],
      ["post", `/marketing/site-web/sites/${B}`, { name: "Pirate" }], ["post", `/marketing/site-web/sites/${B}/archiver`, {}], ["post", `/marketing/site-web/sites/${B}/dupliquer`, {}]]) {
      const r = await memA[m](u, body);
      assert.equal(r.status, 403, `${m} ${u}`);
    }
    const put = await memA.request(`/marketing/pages/${pageB}/brouillon`, { method: "PUT", json: { revision: 0, content: { sections: [], title: "Pirate" } }, headers: ORIGIN() });
    assert.equal(put.status, 403);
    assert.equal(JSON.stringify(page(pageB)), before);
    assert.equal(one("SELECT name FROM mk_sites WHERE id = ?", B).name, "Site B");
  });
  test("suppression : supprimer définitivement la page ou le site de B refusé", async () => {
    assert.equal((await memA.post(`/marketing/pages/${pageB}/supprimer`, {})).status, 403);
    assert.equal((await memA.post(`/marketing/site-web/sites/${B}/supprimer`, { confirmation: "Site B" })).status, 403);
    assert.ok(page(pageB)); assert.equal(one("SELECT deleted_at FROM mk_sites WHERE id = ?", B).deleted_at, null);
  });
  test("création / usurpation de site_id : créer une page, un composant, un import dans B (ou sans site) refusé", async () => {
    const n0 = one("SELECT COUNT(*) n FROM mk_landing_pages").n;
    assert.equal((await memA.post("/marketing/pages", { name: "Intrus", site_id: String(B) })).status, 403);
    assert.equal((await memA.post("/marketing/pages", { name: "Intrus principal", site_id: "" })).status, 403);
    assert.equal((await memA.post("/marketing/site-web/composants", { name: "Intrus", site_id: String(B) })).status, 403);
    const imp = await memA.request("/marketing/pages/importer.json", { method: "POST", json: { siteId: B, data: {} }, headers: ORIGIN() });
    assert.equal(imp.status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages").n, n0, "aucune page créée");
  });
  test("usurpation par déplacement : déplacer sa page vers B ou vers le site principal est refusé côté serveur", async () => {
    const body = (site) => ({ name: "Page A", slug: page(pageA).slug, site_id: site, revision: String(page(pageA).revision), title: "T", description: "", form_id: "", tags: "" });
    await memA.post(`/marketing/pages/${pageA}`, body(String(B)));
    assert.equal(page(pageA).site_id, A, "la page n'a pas été déplacée vers B");
    await memA.post(`/marketing/pages/${pageA}`, body(""));
    assert.equal(page(pageA).site_id, A, "la page n'a pas été déplacée vers le site principal");
  });
  test("liste filtrée par ?site=B, tunnels / listes / audience d'un autre site : refusés", async () => {
    for (const u of [`/marketing/tunnels?site=${B}`, `/marketing/listes?site=${B}`, `/marketing/site-web/tests-ab?site=${B}`, `/marketing/analytics/global?site=${B}`, `/marketing/contacts?site=${B}`]) {
      assert.equal((await memA.get(u)).status, 403, u);
    }
  });
  test("composant d'un autre site : insertion dans une page de A refusée (composant de A et global acceptés)", async () => {
    const put = (id) => memA.request(`/marketing/pages/${pageA}/brouillon`, { method: "PUT", json: { revision: page(pageA).revision, content: { sections: [{ type: "component", componentId: id }], title: "T" } }, headers: ORIGIN() });
    let r = await put(compB);
    assert.equal(r.status, 422, "composant de B refusé");
    assert.match(r.text, /autre site/);
    assert.equal((await put(compA)).status, 200);
    assert.equal((await put(compGlobal)).status, 200);
  });
});

describe("B — non connecté et sans accès", () => {
  test("visiteur déconnecté : redirigé, aucune donnée", async () => {
    for (const u of [`/marketing/pages/${pageA}`, `/marketing/site-web/sites/${A}`, "/marketing/site-web/sites"]) {
      const r = await anon.get(u);
      assert.equal(r.status, 302, u); assert.match(r.location, /connexion/);
    }
    assert.equal((await anon.post(`/marketing/pages/${pageA}`, { name: "x" })).status, 302);
  });
  test("compte sans aucun accès : tout refusé, même avec l'identifiant exact", async () => {
    for (const u of [`/marketing/pages/${pageA}`, `/marketing/site-web/sites/${A}`, `/marketing/site-web/sites/${B}`, "/marketing/site-web/sites"]) assert.equal((await outsider.get(u)).status, 403, u);
    assert.equal((await outsider.post(`/marketing/pages/${pageA}/supprimer`, {})).status, 403);
  });
  test("deux membres de sites différents sont symétriquement isolés", async () => {
    assert.equal((await memB.get(`/marketing/pages/${pageB}`)).status, 200);
    assert.equal((await memB.get(`/marketing/pages/${pageA}`)).status, 403);
    assert.equal((await memB.post(`/marketing/pages/${pageA}/supprimer`, {})).status, 403);
  });
  test("l'équipe de l'organisation garde l'accès à tous les sites (non-régression)", async () => {
    assert.equal((await boss.get(`/marketing/pages/${pageA}`)).status, 200);
    assert.equal((await boss.get(`/marketing/pages/${pageB}`)).status, 200);
    assert.equal((await boss.get(`/marketing/site-web/sites/${B}`)).status, 200);
  });
});

describe("garde-fous de la base (même sans passer par le serveur)", () => {
  test("une étape de tunnel ne peut pas utiliser une page d'un autre site", () => {
    const f = funnelB;
    assert.throws(() => db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id) VALUES (?, ?, 1, 'page', 'X', ?)").run(orgId, f, pageA), /site différent/);
    db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id) VALUES (?, ?, 1, 'page', 'OK', ?)").run(orgId, f, pageB);
    assert.throws(() => db.prepare("UPDATE mk_funnel_steps SET page_id = ? WHERE funnel_id = ?").run(pageA, f), /site différent/);
  });
  test("page parente et page d'accueil : du même site seulement", () => {
    assert.throws(() => db.prepare("UPDATE mk_landing_pages SET parent_id = ? WHERE id = ?").run(pageB, pageA), /site différent/);
    assert.throws(() => db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageB, A), /site différent/);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageA, A);
    db.prepare("UPDATE mk_sites SET home_page_id = NULL WHERE id = ?").run(A);
  });
});

describe("D — migration et contrôle d'audit", () => {
  test("les données existantes sont conservées : sites, pages, composants, accès, aucun doublon", () => {
    assert.equal(one("SELECT COUNT(*) n FROM mk_sites WHERE id IN (?, ?)", A, B).n, 2);
    assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE id = ?", pageMain).site_id, null, "le site principal reste sans site_id (rien n'est attribué arbitrairement)");
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE slug = ?", page(pageA).slug).n, 1);
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_members WHERE site_id = ?", A).n, 1);
  });
  test("migrations 070 et 071 appliquées une seule fois", () => {
    assert.equal(one("SELECT COUNT(*) n FROM schema_migrations WHERE version IN ('070','071')").n, 2);
    assert.equal(one("SELECT COUNT(*) n FROM sqlite_master WHERE type='trigger' AND (name LIKE '%same_site%' OR name LIKE '%keeps%' OR name LIKE '%move%')").n, 7);
  });
  test("le script d'audit signale une incohérence (composant d'un autre site dans une page) et ne modifie rien", () => {
    const file = db.prepare("PRAGMA database_list").all()[0].file;
    const run = () => spawnSync(process.execPath, [path.join(__dirname, "..", "scripts", "audit-sites.js"), file], { encoding: "utf8" });
    const clean = run();
    assert.match(clean.stdout, /Sites : /);
    db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify([{ type: "component", componentId: compB }]), pageA);
    const dirty = run();
    assert.equal(dirty.status, 1);
    assert.match(dirty.stdout, /composant propre à un autre site : 1\s+← ANOMALIE/);
    db.prepare("UPDATE mk_landing_pages SET sections = '[]' WHERE id = ?").run(pageA);
    assert.equal(run().status, clean.status, "la base n'a pas été modifiée par l'audit");
  });
});


describe("déplacement de page, composants et déclencheurs : cas limites", () => {
  const form = (id, site) => { const r = page(id); return { name: r.name, slug: r.slug, site_id: site === null ? "" : String(site), revision: String(r.revision), title: "T", description: "", form_id: "", tags: "" }; };
  const flash = async (c = boss) => ((await c.get("/marketing/site-web/sites")).text.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
  let funnelA, stepPage, parent, child;
  before(() => {
    funnelA = Number(db.prepare("INSERT INTO mk_funnels (organization_id, name, site_id) VALUES (?, 'Tunnel A', ?)").run(orgId, A).lastInsertRowid);
    stepPage = mkPage(A, "Page Etape");
    db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id) VALUES (?, ?, 1, 'page', 'E1', ?)").run(orgId, funnelA, stepPage);
    parent = mkPage(A, "Parent"); child = mkPage(A, "Enfant");
    db.prepare("UPDATE mk_landing_pages SET parent_id = ? WHERE id = ?").run(parent, child);
  });
  test("une page qui est une étape de tunnel ne change pas de site en silence (serveur), et la base refuse aussi", async () => {
    await boss.post(`/marketing/pages/${stepPage}`, form(stepPage, B));
    assert.equal(page(stepPage).site_id, A);
    assert.throws(() => db.prepare("UPDATE mk_landing_pages SET site_id = ? WHERE id = ?").run(B, stepPage), /site différent/);
    assert.throws(() => db.prepare("UPDATE mk_funnels SET site_id = ? WHERE id = ?").run(B, funnelA), /site différent/);
  });
  test("déplacer une page parente détache ses enfants au lieu de laisser un lien entre deux sites ; la base refuse un déplacement brut", async () => {
    assert.throws(() => db.prepare("UPDATE mk_landing_pages SET site_id = ? WHERE id = ?").run(B, parent), /site différent/);
    await boss.post(`/marketing/pages/${parent}`, form(parent, B));
    assert.equal(page(parent).site_id, B);
    assert.equal(page(child).parent_id, null, "l'enfant est détaché");
    assert.equal(page(child).site_id, A);
  });
  test("une page d'accueil déplacée ne reste pas l'accueil de son ancien site", async () => {
    const h = mkPage(A, "Accueil Mobile");
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(h, A);
    await boss.post(`/marketing/pages/${h}`, form(h, B));
    assert.equal(page(h).site_id, B);
    assert.equal(one("SELECT home_page_id FROM mk_sites WHERE id = ?", A).home_page_id, null);
  });
  test("variante d'en-tête propre à l'ancien site : remise à « en-tête du site » au déplacement", async () => {
    const v = mkComp(A, "Variante A"); const p = mkPage(A, "Page Variante");
    db.prepare("UPDATE mk_landing_pages SET header_mode = 'variant', header_component_id = ? WHERE id = ?").run(v, p);
    await boss.post(`/marketing/pages/${p}`, form(p, B));
    assert.equal(page(p).site_id, B);
    assert.deepEqual([page(p).header_mode, page(p).header_component_id], ["inherit", null]);
  });
  test("réserver un composant global à un site est refusé s'il sert d'en-tête à un autre site", async () => {
    const g = mkComp(null, "Entete Global");
    db.prepare("UPDATE mk_sites SET header_component_id = ? WHERE id = ?").run(g, B);
    const r = await boss.post(`/marketing/site-web/composants/${g}`, { name: "Entete Global", global: "0", site_id: String(A) });
    assert.equal(one("SELECT site_id FROM mk_web_components WHERE id = ?", g).site_id, null, "reste global");
    db.prepare("UPDATE mk_sites SET header_component_id = NULL WHERE id = ?").run(B);
    assert.ok(r.status);
  });
  test("opérations légitimes : déplacer une page libre vers un autre site, composant global partout, étape de tunnel du même site", async () => {
    const free = mkPage(A, "Page Libre");
    await boss.post(`/marketing/pages/${free}`, form(free, B));
    assert.equal(page(free).site_id, B);
    const f2 = mkPage(B, "Page Etape B");
    db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id) VALUES (?, ?, 5, 'page', 'E5', ?)").run(orgId, funnelB, f2);
    const r = await memA.request(`/marketing/pages/${pageA}/brouillon`, { method: "PUT", json: { revision: page(pageA).revision, content: { sections: [{ type: "component", componentId: compGlobal }], title: "T" } }, headers: ORIGIN() });
    assert.equal(r.status, 200);
  });
});
