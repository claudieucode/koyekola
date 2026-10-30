// Programme 20.2 — intégration du Site Builder : création atomique, double soumission, états réels de la liste, accès directs entre sites.
// Vrais serveur, vraies routes, vraie base (mêmes outils que gestionnaire-de-sites.test.js).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId;
const S = "/marketing/site-web/sites";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
});
after(() => srv.stop());

describe("création d'un site", () => {
  test("atomique : si l'écriture du journal échoue, AUCUN site n'est créé ; une fois la panne levée, la création réussit", async () => {
    db.exec("CREATE TRIGGER p20_panne BEFORE INSERT ON mk_audit_logs WHEN NEW.action = 'site.created' BEGIN SELECT RAISE(ABORT, 'panne simulée'); END");
    try {
      await boss.post(S, { name: "Site Fragile" });
      assert.equal(one("SELECT COUNT(*) n FROM mk_sites WHERE name = 'Site Fragile'").n, 0, "aucun site à moitié créé");
      assert.doesNotMatch(flashOf((await boss.get(S)).text), /mk-flash-ok/, "aucun succès annoncé");
    } finally { db.exec("DROP TRIGGER p20_panne"); }
    const r = await boss.post(S, { name: "Site Fragile" });
    assert.equal(r.status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM mk_sites WHERE name = 'Site Fragile'").n, 1);
    assert.equal(one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'site.created'").n >= 1, true);
  });
  test("double soumission côté serveur : un seul site, le second envoi est refusé clairement (nom déjà pris)", async () => {
    const [a, b] = [await boss.post(S, { name: "Double Clic" }), await boss.post(S, { name: "Double Clic" })];
    assert.equal(a.status, 302); assert.equal(b.status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM mk_sites WHERE name = 'Double Clic'").n, 1);
    assert.match(flashOf((await boss.get(S)).text), /porte déjà ce nom/);
  });
  test("double soumission côté navigateur : le formulaire de création porte data-mk-once et le script le gère", async () => {
    const html = (await boss.get(S)).text;
    assert.match(html, /<form action="\/marketing\/site-web\/sites" method="post" data-mk-once>/);
    const js = fs.readFileSync(path.join(__dirname, "..", "public/js/mk/shell.js"), "utf8");
    assert.match(js, /form\[data-mk-once\]/);
    assert.match(js, /data-mk-sent/);
    assert.match(js, /pageshow/, "rétabli au retour par l'historique");
  });
});

describe("liste « Mes sites » : états réels", () => {
  test("un site sans page en ligne est « En préparation » ; un site avec une page en ligne est « Publié » ; le menu mène aux réglages", async () => {
    const id = one("SELECT id FROM mk_sites WHERE name = 'Site Fragile'").id;
    let html = (await boss.get(S)).text;
    const row = (h) => h.slice(h.indexOf(`data-site="${id}"`), h.indexOf("</tr>", h.indexOf(`data-site="${id}"`)));
    assert.match(row(html), /En préparation/);
    assert.doesNotMatch(row(html), />Publié</);
    assert.match(row(html), new RegExp(`href="/marketing/site-web/sites/${id}/reglages"`));
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, theme, status, kind, site_id, created_by) VALUES (?, 'Accueil', 'accueil-p20', 'Accueil', '[]', '{}', 'published', 'page', ?, 1)").run(orgId, id);
    html = (await boss.get(S)).text;
    assert.match(row(html), />Publié</);
  });
  test("aucune donnée fictive : un site archivé n'affiche pas d'état de publication", async () => {
    const id = one("SELECT id FROM mk_sites WHERE name = 'Double Clic'").id;
    await boss.post(`${S}/${id}/archiver`, {});
    const html = (await boss.get(`${S}?vue=archives`)).text;
    const start = html.indexOf(`data-site="${id}"`);
    const row = html.slice(start, html.indexOf("</tr>", start));
    assert.match(row, /Archivé/);
    assert.doesNotMatch(row, /En préparation|>Publié</);
  });
});

describe("isolation : accès directs d'un membre limité au site A vers le site B", () => {
  let a, b, member, pageB;
  before(async () => {
    a = one("SELECT id FROM mk_sites WHERE name = 'Site Fragile'").id;
    b = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site B Secret', 'site-b-secret', '{}')").run(orgId).lastInsertRowid);
    pageB = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, theme, status, kind, site_id, created_by) VALUES (?, 'Page B', 'page-b-p20', 'Page B', '[]', '{}', 'draft', 'page', ?, 1)").run(orgId, b).lastInsertRowid);
    member = await newStudent(srv);
    const uid = one("SELECT id FROM users WHERE email = ?", member.email).id;
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(a, uid);
  });
  test("réglages, domaines, modules, tableau de bord et pages du site B : refusés côté serveur", async () => {
    for (const u of [`${S}/${b}`, `${S}/${b}/reglages`, `${S}/${b}/domaines`, `${S}/${b}/modules`, `${S}/${b}/tableau-de-bord`, `${S}/${b}/pages`]) {
      const r = await member.get(u);
      assert.ok([403, 404].includes(r.status), `${u} → ${r.status}`);
      assert.doesNotMatch(r.text || "", /Site B Secret|Page B/, `${u} ne divulgue rien`);
    }
  });
  test("écritures vers le site B : refusées, rien n'est modifié", async () => {
    for (const [u, body] of [[`${S}/${b}`, { name: "Piraté" }], [`${S}/${b}/archiver`, {}], [`${S}/${b}/dupliquer`, {}], [`${S}/${b}/domaines`, { host: "pirate.test" }]]) {
      const r = await member.post(u, body);
      assert.ok([403, 404].includes(r.status), `${u} → ${r.status}`);
    }
    const siteB = one("SELECT name, status FROM mk_sites WHERE id = ?", b);
    assert.deepEqual({ ...siteB }, { name: "Site B Secret", status: "active" });
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_domains WHERE site_id = ?", b).n, 0);
  });
  test("page du site B ouverte avec l'identifiant seul (éditeur, aperçu, brouillon) : refusée", async () => {
    for (const u of [`/marketing/pages/${pageB}`, `/marketing/pages/${pageB}/apercu`]) {
      const r = await member.get(u);
      assert.ok([403, 404, 302].includes(r.status), `${u} → ${r.status}`);
      if (r.status === 302) assert.doesNotMatch(r.location || "", new RegExp(`pages/${pageB}`));
    }
    const put = await member.request(`/marketing/pages/${pageB}/brouillon`, { method: "PUT", json: { content: {}, revision: 0 } });
    assert.ok([403, 404].includes(put.status), `PUT brouillon → ${put.status}`);
    assert.equal(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageB).draft, null, "le brouillon du site B n'a pas été écrit");
  });
});
