// R8 lot 6D — import de contacts dans l'espace d'un site (HTTP) : droits réels, site toujours celui de l'adresse, portée des imports, analyse obligatoire, plafond, doublons inter-sites sans fuite.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const access = require("../src/services/cmsAccess");

describe("import de contacts d'un site", () => {
  let srv, boss, db, A, B, adminA, editorA, viewerA, adminB, outsider, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const SP = "/marketing/site-web/sites";
  const can = (role, perm) => access.permissionsOf(role).has(perm);
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
  const upload = async (client, base, text, extra = {}) => {
    const fd = new FormData(); fd.append("file", new Blob([text], { type: "text/csv" }), "contacts.csv"); for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    return client.request(`${base}/importer`, { method: "POST", multipart: fd, headers: { Origin: srv.base } });
  };
  const idFrom = (r) => Number(String(r.location).match(/importer\/(\d+)/)[1]);
  const contact = (email) => one("SELECT * FROM mk_contacts WHERE email = ?", email);
  const FORM = { map_0: "email", map_1: "first_name", update_existing: "overwrite" };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Import"); B = await mkSite("Bravo Import");
    adminA = await member(A, "admin"); editorA = await member(A, "editor"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin"); outsider = await newStudent(srv);
    db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (1, 'secret.bravo@ex.cd', 'Original-Bravo', ?)").run(B);
    db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (1, 'propre.alpha@ex.cd', 'Original-Alpha', ?)").run(A);
  });
  after(() => { db.close(); return srv.stop(); });

  test("accès : menu du site, droit d'import (selon le rôle), autre site / sans accès / anonyme refusés ; l'import central reste fermé aux comptes limités", async () => {
    const dash = (await adminA.get(`${SP}/${A}/tableau-de-bord`)).text; assert.match(dash, new RegExp(`href="${SP}/${A}/importer"`));
    assert.equal((await adminA.get(`${SP}/${A}/importer`)).status, 200);
    for (const [c, role] of [[editorA, "editor"], [viewerA, "viewer"]]) assert.equal((await c.get(`${SP}/${A}/importer`)).status, can(role, "contacts.import") ? 200 : 403, role);
    assert.equal((await adminB.get(`${SP}/${A}/importer`)).status, 403); assert.equal((await adminA.get(`${SP}/${B}/importer`)).status, 403);
    assert.equal((await outsider.get(`${SP}/${A}/importer`)).status, 403); const a = await anon.get(`${SP}/${A}/importer`); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
    for (const p of ["/marketing/importer", "/marketing/importer/1"]) assert.notEqual((await adminA.get(p)).status, 200, p);
    assert.equal((await boss.get("/marketing/importer")).status, 200, "l'équipe garde l'import central");
  });
  test("envoi : l'import prend le site de l'adresse (un « site » du formulaire est ignoré) ; plafond de lignes ; fichier vide refusé ; droit d'import exigé", async () => {
    const up = await upload(adminA, `${SP}/${A}`, "E-mail,Prénom\nnouveau.alpha@ex.cd,Nouveau\n", { site_id: String(B), site: String(B) });
    assert.equal(up.status, 302); const id = idFrom(up);
    assert.equal(one("SELECT site_id FROM mk_imports WHERE id = ?", id).site_id, A);
    const before = one("SELECT COUNT(*) n FROM mk_imports").n;
    const big = await upload(adminA, `${SP}/${A}`, `E-mail,Prénom\n${Array.from({ length: 5001 }, (_, i) => `g${i}@ex.cd,G`).join("\n")}\n`); assert.doesNotMatch(String(big.location), /importer\/\d+/);
    assert.equal(one("SELECT COUNT(*) n FROM mk_imports").n, before, "rien n'est créé au-delà du plafond");
    assert.equal(one("SELECT COUNT(*) n FROM mk_imports").n, before);
    assert.equal((await upload(viewerA, `${SP}/${A}`, "E-mail\nx@ex.cd\n")).status, can("viewer", "contacts.import") ? 302 : 403);
    assert.equal((await upload(adminB, `${SP}/${A}`, "E-mail\nx@ex.cd\n")).status, 403); assert.equal((await upload(outsider, `${SP}/${A}`, "E-mail\nx@ex.cd\n")).status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM mk_imports WHERE site_id = ?", B).n, 0, "rien pour l'autre site");
  });
  test("portée : un import n'est visible que dans son site ; ailleurs « introuvable » ou refusé ; l'équipe le voit au niveau central, pas dans l'espace d'un autre site", async () => {
    const id = idFrom(await upload(adminA, `${SP}/${A}`, "E-mail,Prénom\nport@ex.cd,P\n"));
    assert.equal((await adminA.get(`${SP}/${A}/importer/${id}`)).status, 200);
    assert.equal((await adminB.get(`${SP}/${B}/importer/${id}`)).status, 404, "par SON adresse, l'import d'un autre site est introuvable");
    assert.equal((await adminB.get(`${SP}/${A}/importer/${id}`)).status, 403);
    for (const act of ["analyser", "lancer", "reprendre"]) { assert.equal((await adminB.post(`${SP}/${B}/importer/${id}/${act}`, FORM)).status, 404, act); assert.equal((await adminB.post(`${SP}/${A}/importer/${id}/${act}`, FORM)).status, 403, act); }
    assert.equal((await adminB.get(`${SP}/${B}/importer/${id}/rejets.csv`)).status, 404);
    assert.equal((await boss.get(`/marketing/importer/${id}`)).status, 200); assert.equal((await boss.get(`${SP}/${A}/importer/${id}`)).status, 200); assert.equal((await boss.get(`${SP}/${B}/importer/${id}`)).status, 404);
    const listA = (await adminA.get(`${SP}/${A}/importer`)).text, listB = (await adminB.get(`${SP}/${B}/importer`)).text;
    assert.match(listA, new RegExp(`importer/${id}"`)); assert.doesNotMatch(listB, new RegExp(`importer/${id}"`));
    assert.equal(one("SELECT status FROM mk_imports WHERE id = ?", id).status, "previewed", "rien n'a démarré");
  });
  test("analyse obligatoire, lancement unique, doublons inter-sites : le contact d'un autre site n'est ni modifié ni révélé ; une demande de rattachement est mise en file", async () => {
    const text = "E-mail,Prénom\nsecret.bravo@ex.cd,Pirate\npropre.alpha@ex.cd,Mis-a-jour\nnouveau2.alpha@ex.cd,Nouveau2\n";
    const id = idFrom(await upload(adminA, `${SP}/${A}`, text));
    await adminA.post(`${SP}/${A}/importer/${id}/lancer`, FORM);
    assert.equal(one("SELECT status FROM mk_imports WHERE id = ?", id).status, "previewed", "pas de lancement sans analyse");
    const an = await adminA.post(`${SP}/${A}/importer/${id}/analyser`, FORM); assert.equal(an.status, 200);
    { const m = /Original-Bravo|Bravo Import|demande de rattachement|ailleurs/.exec(an.text); /* l'adresse figure dans le fichier de l'utilisateur lui-même (exemples) ; rien de l'autre site n'est ajouté */ assert.equal(m, null, m && an.text.slice(Math.max(0, m.index - 300), m.index + 120)); }
    await adminA.post(`${SP}/${A}/importer/${id}/lancer`, FORM);
    assert.equal(one("SELECT status FROM mk_imports WHERE id = ?", id).status, "done");
    await adminA.post(`${SP}/${A}/importer/${id}/lancer`, FORM); // double envoi
    assert.equal(one("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'nouveau2.alpha@ex.cd'").n, 1, "aucun doublon");
    assert.equal(contact("secret.bravo@ex.cd").first_name, "Original-Bravo", "contact de l'autre site intact");
    assert.equal(contact("propre.alpha@ex.cd").first_name, "Mis-a-jour"); assert.equal(contact("nouveau2.alpha@ex.cd").origin_site_id, A);
    assert.deepEqual({ ...one("SELECT email, site_id, status FROM mk_contact_requests") }, { email: "secret.bravo@ex.cd", site_id: A, status: "pending" });
    const done = (await adminA.get(`${SP}/${A}/importer/${id}`)).text; assert.doesNotMatch(done, /Original-Bravo|Bravo Import|demande de rattachement|ailleurs/);
    const imp = one("SELECT created_count, updated_count FROM mk_imports WHERE id = ?", id); assert.deepEqual({ ...imp }, { created_count: 2, updated_count: 1 }, "le doublon inter-sites apparaît comme une création");
    const logs = db.prepare("SELECT action, site_id, metadata FROM mk_audit_logs WHERE resource_type = 'import' AND resource_id = ?").all(String(id)); assert.ok(logs.length >= 2 && logs.every((l) => l.site_id === A) && logs.every((l) => !/@/.test(l.metadata)));
  });
  test("lignes rejetées : droit de voir les données sensibles ; jamais celles d'un autre site", async () => {
    const id = idFrom(await upload(adminA, `${SP}/${A}`, "E-mail,Prénom\npas-un-email,Mauvais\nbon.rejet@ex.cd,Bon\n"));
    await adminA.post(`${SP}/${A}/importer/${id}/analyser`, FORM); await adminA.post(`${SP}/${A}/importer/${id}/lancer`, FORM);
    const ok = await adminA.get(`${SP}/${A}/importer/${id}/rejets.csv`); assert.equal(ok.status, can("admin", "contacts.view_sensitive") ? 200 : 403); if (ok.status === 200) { assert.match(ok.text, /pas-un-email/); assert.match(ok.headers.get("cache-control") || "", /no-store/); }
    const ed = await editorA.get(`${SP}/${A}/importer/${id}/rejets.csv`); assert.equal(ed.status, can("editor", "contacts.view_sensitive") ? 404 === ed.status ? 200 : 200 : 403);
    assert.equal((await adminB.get(`${SP}/${A}/importer/${id}/rejets.csv`)).status, 403); assert.equal((await adminB.get(`${SP}/${B}/importer/${id}/rejets.csv`)).status, 404);
  });
});
