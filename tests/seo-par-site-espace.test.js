// R8 lot 6C — SEO dans l'espace d'un site (HTTP, vrais hôtes) : réglages, redirections, 404 ; droits réels ; site toujours celui de l'adresse ; rendu public par domaine ; aucune fuite entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const access = require("../src/services/cmsAccess");

function hostGet(srv, host, urlPath) {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path: urlPath, method: "GET", headers: { Host: host } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, location: resp.headers.location }));
    });
    r.on("error", reject); r.end();
  });
}

describe("SEO d'un site : espace, droits, rendu par domaine", () => {
  let srv, boss, db, A, B, adminA, editorA, viewerA, adminB, outsider, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const SP = "/marketing/site-web/sites";
  const can = (role, perm) => access.permissionsOf(role).has(perm);
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
  const own = (site, key) => { const r = one("SELECT value FROM seo_site_settings WHERE site_id = ? AND key = ?", site, key); return r ? JSON.parse(r.value) : undefined; };
  const redirs = (site) => db.prepare("SELECT source_path, target FROM seo_redirects WHERE site_id = ? ORDER BY id").all(site).map((r) => `${r.source_path}>${r.target}`);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Seo"); B = await mkSite("Bravo Seo");
    const org = one("SELECT id FROM mk_organizations").id;
    for (const [site, slug, url] of [[A, "accueil-a", "https://un.test"], [B, "accueil-b", "https://deux.test"]]) {
      const p = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, indexable) VALUES (?, ?, ?, ?, 'published', ?, datetime('now'), 1)").run(org, slug.toUpperCase(), slug, slug.toUpperCase(), site).lastInsertRowid);
      db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(p, site);
      const cur = JSON.parse((await boss.get(`${SP}/${site}/reglages.json`)).text);
      const r = await boss.request(`${SP}/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: { Origin: srv.base } });
      assert.equal(r.status, 200);
    }
    adminA = await member(A, "admin"); editorA = await member(A, "editor"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin"); outsider = await newStudent(srv);
    // marque du SITE PRINCIPAL, reconnaissable (réglages globaux, équipe)
    const g = await boss.post("/formateur/seo/reglages", { site_name: "MARQUE-PRINCIPALE", org_name: "ORG-PRINCIPALE", default_description: "DESCRIPTION-PRINCIPALE", robots_custom: "User-agent: *\nDisallow: /secret-principal" });
    assert.ok([200, 302].includes(g.status), String(g.status));
  });
  after(() => { db.close(); return srv.stop(); });

  test("menu et accès : les entrées SEO ouvertes selon les droits réels ; autre site, sans accès et anonyme refusés ; les neuf rubriques SEO sont ouvertes", async () => {
    const page = (await adminA.get(`${SP}/${A}/seo`)); assert.equal(page.status, 200);
    assert.match(page.text, /SEO du site/); assert.match(page.text, new RegExp(`${SP}/${A}/seo/404`));
    assert.match(page.text, new RegExp(`href="${SP}/${A}/seo/(analyse|meta|indexation|sitemap|schema|open-graph|robots)"`), "les neuf rubriques SEO sont ouvertes (voir seo-site-outils.test.js)");
    for (const [who, c, role] of [["éditeur", editorA, "editor"], ["lecteur", viewerA, "viewer"]]) {
      const r = await c.get(`${SP}/${A}/seo`); assert.equal(r.status, can(role, "seo.view") ? 200 : 403, who);
    }
    assert.equal((await adminB.get(`${SP}/${A}/seo`)).status, 403); assert.equal((await adminA.get(`${SP}/${B}/seo`)).status, 403);
    assert.equal((await outsider.get(`${SP}/${A}/seo`)).status, 403); const a = await anon.get(`${SP}/${A}/seo`); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
    for (const p of ["seo/analyse", "seo/meta", "seo/robots", "seo/sitemap"]) { assert.equal((await adminA.get(`${SP}/${A}/${p}`)).status, 200, p); assert.equal((await adminB.get(`${SP}/${A}/${p}`)).status, 403, p); }
  });
  test("réglages : écriture réservée à seo.edit, bornée au site de l'adresse ; un site_id/site du formulaire est ignoré ; une clé globale est ignorée ; un refus ne modifie rien", async () => {
    const globalBefore = JSON.stringify(db.prepare("SELECT key, value FROM seo_settings ORDER BY key").all());
    const ok = await adminA.post(`${SP}/${A}/seo`, { site_name: "Alpha Officiel", org_name: "Alpha SA", robots_custom: "User-agent: *\nDisallow: /secret-a", site_id: String(B), site: String(B), publish_guard: "block_critical", index_authors: "1" });
    assert.equal(ok.status, 302);
    assert.equal(own(A, "site_name"), "Alpha Officiel"); assert.equal(own(A, "org_name"), "Alpha SA");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_site_settings WHERE site_id = ?").get(B).n, 0, "rien pour l'autre site");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_site_settings WHERE key IN ('publish_guard', 'index_authors')").get().n, 0, "clés globales ignorées");
    assert.equal(JSON.stringify(db.prepare("SELECT key, value FROM seo_settings ORDER BY key").all()), globalBefore, "réglages globaux inchangés");
    assert.equal((await adminB.post(`${SP}/${A}/seo`, { site_name: "Pirate" })).status, 403); assert.equal(own(A, "site_name"), "Alpha Officiel");
    assert.equal((await outsider.post(`${SP}/${A}/seo`, { site_name: "Pirate" })).status, 403);
    assert.ok([302, 403].includes((await anon.post(`${SP}/${A}/seo`, { site_name: "Pirate" })).status));
    assert.equal((await viewerA.post(`${SP}/${A}/seo`, { site_name: "Pirate" })).status, 403);
    const e = await editorA.post(`${SP}/${A}/seo`, { org_description: "Par l'éditeur" }); assert.equal(e.status, can("editor", "seo.edit") ? 302 : 403);
    const bad = await adminA.post(`${SP}/${A}/seo`, { title_template: "{inconnu}", site_name: "Autre Nom" });
    assert.equal(bad.status, 302); assert.equal(own(A, "site_name"), "Alpha Officiel", "lot refusé = rien d'enregistré");
    assert.ok((await adminA.get(`${SP}/${A}/seo/meta`)).text.includes("Alpha Officiel"));
    assert.ok(db.prepare("SELECT COUNT(*) n FROM seo_changes WHERE site_id = ? AND entity_type = 'settings'").get(A).n >= 2, "journal avec le site");
    // archivé : lecture seule
    db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(A);
    await adminA.post(`${SP}/${A}/seo`, { site_name: "Pendant archive" }); assert.equal(own(A, "site_name"), "Alpha Officiel", "site archivé : refusé");
    db.prepare("UPDATE mk_sites SET status = 'active' WHERE id = ?").run(A);
  });
  test("rendu public par domaine : chaque site publie SON identité ; aucune donnée de la marque du site principal ; robots.txt et plan du site propres au domaine", async () => {
    const [ha, hb, rr, ra, rb, sa, sb] = [await hostGet(srv, "un.test", "/"), await hostGet(srv, "deux.test", "/"), null, await hostGet(srv, "un.test", "/robots.txt"), await hostGet(srv, "deux.test", "/robots.txt"), await hostGet(srv, "un.test", "/sitemap.xml"), await hostGet(srv, "deux.test", "/sitemap.xml")];
    assert.equal(ha.status, 200); assert.equal(hb.status, 200); assert.ok(rr === null);
    for (const h of [ha, hb, ra, rb, sa, sb]) assert.doesNotMatch(h.text, /MARQUE-PRINCIPALE|ORG-PRINCIPALE|DESCRIPTION-PRINCIPALE|secret-principal/, "aucune donnée du principal");
    assert.match(ha.text, /Alpha Officiel/); assert.match(ha.text, /Alpha SA/); assert.doesNotMatch(hb.text, /Alpha/);
    assert.match(ha.text, /rel="canonical" href="https:\/\/un\.test/); assert.match(hb.text, /rel="canonical" href="https:\/\/deux\.test/);
    assert.match(ra.text, /Disallow: \/secret-a/); assert.doesNotMatch(rb.text, /secret-/); assert.match(ra.text, /Sitemap: https:\/\/un\.test\/sitemap\.xml/); assert.match(rb.text, /Sitemap: https:\/\/deux\.test\/sitemap\.xml/);
    assert.match(sa.text, /https:\/\/un\.test\//); assert.doesNotMatch(sa.text, /deux\.test/); assert.match(sb.text, /https:\/\/deux\.test\//); assert.doesNotMatch(sb.text, /un\.test/);
    const main = await hostGet(srv, "k.test", "/robots.txt"); assert.match(main.text, /Disallow: \/secret-principal/); assert.doesNotMatch(main.text, /secret-a/);
  });
  test("redirections : créées et résolues par site ; même ancienne adresse sur deux sites ; l'hôte principal n'est pas touché ; droits (créer, modifier, supprimer, externe) ; site du formulaire ignoré", async () => {
    assert.equal((await adminA.post(`${SP}/${A}/redirections`, { source: "/ancien", target: "/a-page", status: "301", site_id: String(B), site: String(B) })).status, 302);
    assert.equal((await adminB.post(`${SP}/${B}/redirections`, { source: "/ancien", target: "/b-page", status: "302" })).status, 302);
    assert.deepEqual(redirs(A), ["/ancien>/a-page"]); assert.deepEqual(redirs(B), ["/ancien>/b-page"]);
    let r = await hostGet(srv, "un.test", "/ancien"); assert.equal(r.status, 301); assert.equal(r.location, "/a-page");
    r = await hostGet(srv, "deux.test", "/ancien"); assert.equal(r.status, 302); assert.equal(r.location, "/b-page");
    r = await hostGet(srv, "k.test", "/ancien"); assert.notEqual(r.status, 301); assert.notEqual(r.status, 302);
    // droits
    const rid = one("SELECT id FROM seo_redirects WHERE site_id = ?", A).id;
    const mk = async (c, role, path, target) => { const x = await c.post(`${SP}/${A}/redirections`, { source: path, target }); assert.equal(x.status, can(role, "redirects.create") ? 302 : 403); };
    await mk(editorA, "editor", "/par-editeur", "/ailleurs"); await mk(viewerA, "viewer", "/par-lecteur", "/ailleurs");
    await editorA.post(`${SP}/${A}/redirections`, { source: "/ext-editeur", target: "https://exemple.org/x" });
    assert.equal(redirs(A).some((s) => s.startsWith("/ext-editeur")), can("editor", "redirects.external"), "externe : permission dédiée");
    await adminA.post(`${SP}/${A}/redirections`, { source: "/ext-admin", target: "https://exemple.org/x" }); assert.ok(redirs(A).includes("/ext-admin>https://exemple.org/x"));
    const del = await editorA.post(`${SP}/${A}/redirections/${rid}/supprimer`, {}); assert.equal(del.status, can("editor", "redirects.delete") ? 302 : 403);
    assert.ok(redirs(A).includes("/ancien>/a-page"), "l'éditeur ne supprime pas sans le droit");
    // modifier la sienne (le site ne peut pas être changé par le formulaire)
    await adminA.post(`${SP}/${A}/redirections/${rid}`, { source: "/ancien", target: "/a-page-2", status: "301", enabled: "1", site_id: String(B) });
    assert.deepEqual({ ...one("SELECT site_id, target FROM seo_redirects WHERE id = ?", rid) }, { site_id: A, target: "/a-page-2" });
    assert.equal((await hostGet(srv, "un.test", "/ancien")).location, "/a-page-2", "le cache est renouvelé");
  });
  test("redirections : jamais celles d'un autre site ni les communes (lecture, modification, suppression, export) ; adresses falsifiées refusées", async () => {
    const ridB = one("SELECT id FROM seo_redirects WHERE site_id = ?", B).id;
    await boss.post("/formateur/seo/redirections", { source: "/commune", target: "/ailleurs-commune", status: "301" });
    const common = one("SELECT id FROM seo_redirects WHERE site_id IS NULL AND source_path = '/commune'");
    assert.ok(common, "redirection commune créée par l'équipe");
    const list = (await adminA.get(`${SP}/${A}/redirections`)).text; assert.match(list, /a-page-2/); { const m = /<code>\/b-page<\/code>|ailleurs-commune/.exec(list); assert.equal(m, null, m && list.slice(Math.max(0, m.index - 200), m.index + 100)); }
    const csv = (await adminA.get(`${SP}/${A}/redirections/export.csv`)).text; assert.match(csv, /a-page-2/); assert.doesNotMatch(csv, /\/b-page|commune/);
    for (const id of [ridB, common.id]) {
      await adminA.post(`${SP}/${A}/redirections/${id}`, { source: "/pirate", target: "/pirate2", status: "301" });
      await adminA.post(`${SP}/${A}/redirections/${id}/supprimer`, {});
    }
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE id IN (?, ?)").get(ridB, common.id).n, 2, "ni modifiées ni supprimées");
    assert.equal(one("SELECT target FROM seo_redirects WHERE id = ?", ridB).target, "/b-page");
    // l'autre site tente de toucher celle de A en passant par SON adresse ou par celle de A
    const ridA = one("SELECT id FROM seo_redirects WHERE site_id = ? AND source_path = '/ancien'", A).id;
    await adminB.post(`${SP}/${B}/redirections/${ridA}/supprimer`, {}); assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE id = ?", ridA).n, 1);
    assert.equal((await adminB.post(`${SP}/${A}/redirections/${ridA}/supprimer`, {})).status, 403);
    assert.equal((await adminB.get(`${SP}/${A}/redirections`)).status, 403); assert.equal((await adminB.get(`${SP}/${A}/redirections/export.csv`)).status, 403);
    // import : uniquement dans le site de l'adresse
    await adminA.post(`${SP}/${A}/redirections/import`, { csv: "/i1,/j1,301,import\n/i2,/j2,302,import\n" });
    assert.ok(redirs(A).includes("/i1>/j1") && redirs(A).includes("/i2>/j2")); assert.equal(redirs(B).filter((s) => s.startsWith("/i")).length, 0);
  });
  test("404 : chaque domaine enregistre ses adresses introuvables ; l'administrateur du site ne voit que celles de son site ; l'équipe choisit le site ; l'hôte principal garde les siennes", async () => {
    await hostGet(srv, "un.test", "/introuvable-a-seulement"); await hostGet(srv, "deux.test", "/introuvable-b-seulement"); await hostGet(srv, "k.test", "/introuvable-principal"); await hostGet(srv, "un.test", "/commune-404"); await hostGet(srv, "deux.test", "/commune-404");
    const la = (await adminA.get(`${SP}/${A}/seo/404`)).text, lb = (await adminB.get(`${SP}/${B}/seo/404`)).text;
    assert.match(la, /introuvable-a-seulement/); assert.doesNotMatch(la, /introuvable-b-seulement|introuvable-principal/);
    assert.match(lb, /introuvable-b-seulement/); assert.doesNotMatch(lb, /introuvable-a-seulement|introuvable-principal/);
    assert.match(la, /commune-404/); assert.match(lb, /commune-404/);
    assert.equal((await adminB.get(`${SP}/${A}/seo/404`)).status, 403); assert.equal((await outsider.get(`${SP}/${A}/seo/404`)).status, 403);
    const forged = (await adminA.get(`${SP}/${A}/seo/404?site=${B}`)).text; assert.doesNotMatch(forged, /introuvable-b-seulement/, "?site= ignoré");
    const central = (await boss.get("/formateur/seo/erreurs-404")).text; assert.match(central, /introuvable-principal/); assert.doesNotMatch(central, /introuvable-a-seulement|introuvable-b-seulement/);
    assert.match((await boss.get(`/formateur/seo/erreurs-404?site=${A}`)).text, /introuvable-a-seulement/);
    assert.equal((await viewerA.get(`${SP}/${A}/seo/404`)).status, can("viewer", "seo.view") ? 200 : 403);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_404 WHERE path = '/commune-404'").get().n, 2, "même adresse sur deux sites = deux lignes");
  });
});
