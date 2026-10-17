// R8 lot 4 — Export CSV des contacts PAR SITE : un accès limité exporte les seuls contacts que SON site peut lire (jamais un autre site, ni le principal), avec le droit d'export ET celui de voir les données sensibles ;
// les listes d'un autre site ne sont pas communiquées ; l'équipe garde l'export global ; chaque export est journalisé avec le site. L'IMPORT par site n'est pas ouvert (voir rapport).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const access = require("../src/services/cmsAccess");

describe("export de contacts par site", () => {
  let srv, boss, db, A, B, adminA, editorA, viewerA, adminB, noAccess, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const SP = "/marketing/site-web/sites", X = "/marketing/contacts/export.csv";
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const contact = (email, site) => Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (1, ?, 'P', ?)").run(email, site).lastInsertRowid);
  const exp = (role, perm) => access.permissionsOf(role).has(perm);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Export"); B = await mkSite("Bravo Export");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); editorA = await member(A, "editor"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin"); noAccess = await newStudent(srv);
    const a1 = contact("alice.export@ex.cd", A), a2 = contact("anna.export@ex.cd", A), b1 = contact("bob.export@ex.cd", B), p1 = contact("paul.export@ex.cd", null);
    const listA = Number(db.prepare("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (1, 'Liste-Alpha', ?)").run(A).lastInsertRowid), listB = Number(db.prepare("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (1, 'Liste-Bravo-Secrete', ?)").run(B).lastInsertRowid);
    for (const [l, c] of [[listA, a1], [listB, a1], [listB, b1]]) db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (1, ?, ?)").run(l, c);   // Alice (site Alpha) est AUSSI dans une liste de Bravo
  });
  after(() => { db.close(); return srv.stop(); });

  test("administrateur du site : exporte les contacts d'Alpha seulement (en-tête, aucune adresse d'un autre site ni du principal) ; la liste d'un autre site n'est pas communiquée", async () => {
    const r = await adminA.get(`${X}?site=${A}`); assert.equal(r.status, 200); assert.match(r.headers.get("content-type"), /text\/csv/); assert.match(r.headers.get("cache-control") || "", /no-store/);
    assert.match(r.text, /E-mail,Prénom/);
    assert.match(r.text, /alice\.export@ex\.cd/); assert.match(r.text, /anna\.export@ex\.cd/);
    assert.doesNotMatch(r.text, /bob\.export|paul\.export/, "aucun contact d'un autre site ni du principal");
    assert.match(r.text, /Liste-Alpha/); assert.doesNotMatch(r.text, /Liste-Bravo-Secrete/, "la liste d'un autre site n'est pas exportée");
  });
  test("l'équipe : export du site (filtre) ou global ; l'export global contient tout (comportement historique)", async () => {
    const site = (await boss.get(`${X}?site=${A}`)).text; assert.match(site, /alice\.export/); assert.doesNotMatch(site, /bob\.export|paul\.export/);
    assert.match(site, /Liste-Bravo-Secrete/, "l'équipe voit toutes les listes d'un contact");
    const all = (await boss.get(X)).text; for (const e of ["alice", "anna", "bob", "paul"]) assert.match(all, new RegExp(`${e}\\.export`));
  });
  test("droits : l'export exige « exporter » ET « voir les données sensibles » (selon le rôle) ; autre site, sans accès et anonyme sont refusés ; site falsifié refusé", async () => {
    for (const [who, c, role] of [["éditeur", editorA, "editor"], ["lecteur", viewerA, "viewer"]]) {
      const r = await c.get(`${X}?site=${A}`); const allowed = exp(role, "contacts.export") && exp(role, "contacts.view_sensitive");
      assert.equal(r.status, allowed ? 200 : 403, `${who} suit ses droits`); if (!allowed) assert.doesNotMatch(r.text, /@ex\.cd/);
    }
    assert.equal((await adminB.get(`${X}?site=${A}`)).status, 403, "administrateur d'un autre site");
    const own = await adminA.get(`${X}?site=${B}`); assert.equal(own.status, 403, "Alpha ne vise pas Bravo"); assert.doesNotMatch(own.text, /bob\.export/);
    assert.ok([302, 403].includes((await adminA.get(X)).status), "sans site : jamais le global");
    assert.ok([302, 403].includes((await noAccess.get(`${X}?site=${A}`)).status)); const a = await anon.get(`${X}?site=${A}`); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
  });
  test("les filtres de l'écran restent bornés au site : une recherche ne fait pas sortir un contact d'un autre site", async () => {
    for (const q of ["bob", "paul", "export"]) { const r = await adminA.get(`${X}?site=${A}&q=${q}`); assert.equal(r.status, 200); assert.doesNotMatch(r.text, /bob\.export|paul\.export/, q); }
    const r = await adminA.get(`${X}?site=${A}&q=alice`); assert.match(r.text, /alice\.export/); assert.doesNotMatch(r.text, /anna\.export/);
  });
  test("journal : chaque export est tracé au site (sans adresse) ; le lien « Exporter » de la liste du site garde le site et fonctionne", async () => {
    const before = one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'contacts.exported' AND site_id = ?", A).n;
    await adminA.get(`${X}?site=${A}`); assert.equal(one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'contacts.exported' AND site_id = ?", A).n, before + 1);
    assert.doesNotMatch(String(one("SELECT metadata m FROM mk_audit_logs WHERE action = 'contacts.exported' ORDER BY id DESC").m), /@/);
    const page = (await adminA.get(`${SP}/${A}/contacts`)).text; const link = (page.match(/href="(\/marketing\/contacts\/export\.csv[^"]*)"/) || [])[1];
    assert.ok(link && /site=\d+/.test(link.replace(/&amp;/g, "&")), "lien d'export avec le site");
    assert.equal((await adminA.get(link.replace(/&amp;/g, "&"))).status, 200, "le lien fonctionne");
    assert.doesNotMatch(String((await viewerA.get(`${SP}/${A}/contacts`)).text.match(/export\.csv/) || ""), /export/, "pas de lien d'export sans le droit");
  });
});
