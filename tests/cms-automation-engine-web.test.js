// KOLAKISA CMS — palier 17 : Automation Engine de bout en bout par les vraies routes (vrai serveur, vraie base) : isolation par site (IDOR),
// permissions, publication, simulation en lecture seule, historique, panneau du contact, masquage des données sensibles, XSS.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId, siteA, siteB, editorA, adminA, viewer, basic, autoA, autoB, autoP, contactId;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const count = (sql, ...a) => one(sql, ...a).n;
const M = "/marketing";
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const lastId = (loc, re) => Number(String(loc).match(re)[1]);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  siteA = lastId((await boss.post(`${M}/site-web/sites`, { name: "Site Alpha" })).location, /sites\/(\d+)/);
  siteB = lastId((await boss.post(`${M}/site-web/sites`, { name: "Site Bravo" })).location, /sites\/(\d+)/);
  for (const [name, site] of [["Scénario Alpha", siteA], ["Scénario Bravo", siteB], ["Scénario Principal", ""]]) assert.equal((await boss.post(`${M}/automatisations`, { name, kind: "marketing", trigger_event: "contact.created", site })).status, 302);
  const id = (n) => one("SELECT id FROM mk_automations WHERE name = ?", n).id;
  autoA = id("Scénario Alpha"); autoB = id("Scénario Bravo"); autoP = id("Scénario Principal");
  editorA = await newStudent(srv); adminA = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(siteA, idOf(editorA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteA, idOf(adminA));
  viewer = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, 'viewer')").run(orgId, idOf(viewer));
  const r = await boss.post(`${M}/site-web/utilisateurs/roles`, { name: "Automations sans sensibles", description: "t", perm: ["automations.read", "automations.write", "contacts.read"] });
  assert.ok([200, 302].includes(r.status));
  basic = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(basic), one("SELECT key FROM mk_roles WHERE name = 'Automations sans sensibles'").key);
  contactId = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (?, 'sim.web@exemple.fr', 'Simone', ?)").run(orgId, siteA).lastInsertRowid);
});
after(() => srv.stop());

describe("création, site et publication", () => {
  test("le site est enregistré à la création ; l'équipe de l'organisation voit tout et filtre", async () => {
    assert.deepEqual([autoA, autoB, autoP].map((i) => one("SELECT site_id FROM mk_automations WHERE id = ?", i).site_id), [siteA, siteB, null]);
    const all = (await boss.get(`${M}/automatisations`)).text;
    for (const n of ["Scénario Alpha", "Scénario Bravo", "Scénario Principal"]) assert.match(all, new RegExp(n));
    const only = (await boss.get(`${M}/automatisations?site=${siteB}`)).text;
    assert.match(only, /Scénario Bravo/); assert.doesNotMatch(only, /Scénario Alpha|Scénario Principal/);
  });
  test("publier exige le droit d'activation : l'éditeur du site ne peut pas, l'administrateur du site peut ; la version est enregistrée", async () => {
    await boss.post(`${M}/automatisations/${autoA}`, { name: "Scénario Alpha", steps: [{ type: "add_tag", tag: "alpha" }] }, { headers: {} }).catch(() => {});
    db.prepare("UPDATE mk_automations SET steps = ? WHERE id = ?").run(JSON.stringify([{ type: "add_tag", tag: "alpha" }]), autoA);
    assert.equal((await editorA.post(`${M}/automatisations/${autoA}/activer`, {})).status, 403);
    assert.equal(one("SELECT status FROM mk_automations WHERE id = ?", autoA).status, "draft");
    const r = await adminA.post(`${M}/automatisations/${autoA}/activer`, {});
    assert.equal(r.status, 302);
    const a = one("SELECT status, version FROM mk_automations WHERE id = ?", autoA);
    assert.deepEqual([a.status, a.version], ["active", 1]);
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_versions WHERE automation_id = ?", autoA), 1);
    assert.match((await boss.get(`${M}/automatisations/${autoA}`)).text, /Versions publiées[\s\S]*v1 \(en cours\)/);
    assert.equal((await adminA.post(`${M}/automatisations/${autoA}/pause`, {})).status, 302);
    assert.equal(one("SELECT status FROM mk_automations WHERE id = ?", autoA).status, "paused");
    assert.equal((await adminA.post(`${M}/automatisations/${autoA}/reprendre`, {})).status, 302);
    assert.equal(one("SELECT status FROM mk_automations WHERE id = ?", autoA).status, "active");
  });
  test("lecteur : consulte mais ne crée, ne modifie, ne simule ni n'active rien", async () => {
    assert.equal((await viewer.get(`${M}/automatisations`)).status, 200);
    assert.equal((await viewer.post(`${M}/automatisations`, { name: "Intrus", kind: "marketing", trigger_event: "contact.created" })).status, 403);
    for (const p of ["activer", "pause", "dupliquer", "supprimer"]) assert.equal((await viewer.post(`${M}/automatisations/${autoP}/${p}`, {})).status, 403, p);
    assert.equal((await viewer.get(`${M}/automatisations/${autoP}/simulation?contact=${contactId}`)).status, 403);
    assert.equal(count("SELECT COUNT(*) n FROM mk_automations WHERE name = 'Intrus'"), 0);
  });
});

describe("accès limité à un site : isolation complète (IDOR)", () => {
  test("liste, historique : seulement son site", async () => {
    const l = (await editorA.get(`${M}/automatisations?site=${siteA}`)).text;
    assert.match(l, /Scénario Alpha/); assert.doesNotMatch(l, /Scénario Bravo|Scénario Principal/);
    assert.equal((await editorA.get(`${M}/automatisations?site=${siteB}`)).status, 403);
    assert.notEqual((await editorA.get(`${M}/automatisations`)).status, 200, "sans site : pas d'accès à l'organisation");
    const h = (await editorA.get(`${M}/automatisations/historique?site=${siteA}`)).text;
    assert.doesNotMatch(h, /Scénario Bravo|Scénario Principal/);
    assert.equal((await editorA.get(`${M}/automatisations/historique?site=${siteB}`)).status, 403);
  });
  test("toutes les adresses d'un autre site (ou sans site) répondent 403, en lecture comme en écriture ; rien n'est modifié", async () => {
    for (const id of [autoB, autoP]) {
      for (const path of [`${id}`, `${id}/simulation?contact=${contactId}`, `${id}/passages/1`]) assert.equal((await editorA.get(`${M}/automatisations/${path}`)).status, 403, path);
      for (const path of [`${id}`, `${id}/dupliquer`, `${id}/activer`, `${id}/pause`, `${id}/reprendre`, `${id}/supprimer`]) assert.equal((await adminA.post(`${M}/automatisations/${path}`, { name: "Piraté" })).status, 403, path);
    }
    assert.equal((await editorA.get(`${M}/automatisations/999999`)).status, 403);
    assert.deepEqual(db.prepare("SELECT name, status FROM mk_automations WHERE id IN (?, ?) ORDER BY id").all(autoB, autoP).map((r) => [r.name, r.status]), [["Scénario Bravo", "draft"], ["Scénario Principal", "draft"]]);
  });
  test("création : seulement dans son site (le champ « site » est contrôlé par le serveur)", async () => {
    assert.equal((await editorA.post(`${M}/automatisations`, { name: "Créé par Alpha", kind: "marketing", trigger_event: "contact.created", site: siteA })).status, 302);
    assert.equal(one("SELECT site_id FROM mk_automations WHERE name = 'Créé par Alpha'").site_id, siteA);
    for (const body of [{ name: "Vers Bravo", site: siteB }, { name: "Sans site" }, { name: "Site inventé", site: 99999 }]) {
      assert.equal((await editorA.post(`${M}/automatisations`, { kind: "marketing", trigger_event: "contact.created", ...body })).status, 403);
      assert.equal(count("SELECT COUNT(*) n FROM mk_automations WHERE name = ?", body.name), 0);
    }
  });
  test("simulation et fiche : l'éditeur du site ne simule que sur un contact de son site", async () => {
    const r = await editorA.get(`${M}/automatisations/${autoA}/simulation?site=${siteA}&contact=${contactId}`);
    assert.equal(r.status, 200); assert.match(r.text, /Résultat pour/);
    const other = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (?, 'bravo.contact@exemple.fr', ?)").run(orgId, siteB).lastInsertRowid);
    const refused = (await editorA.get(`${M}/automatisations/${autoA}/simulation?site=${siteA}&contact=${other}`)).text;
    assert.match(refused, /Aucun contact ne correspond/); assert.doesNotMatch(refused, /bravo\.contact/);
  });
});

describe("simulation, historique, panneau du contact", () => {
  test("la simulation est en lecture seule et annonce ce qui serait fait, sans rien écrire", async () => {
    db.prepare("UPDATE mk_automations SET steps = ? WHERE id = ?").run(JSON.stringify([{ type: "add_tag", tag: "simule" }, { type: "wait", amount: 2, unit: "days" }, { type: "end" }]), autoP);
    const before = { tags: count("SELECT COUNT(*) n FROM mk_contact_tags"), ev: count("SELECT COUNT(*) n FROM mk_events"), runs: count("SELECT COUNT(*) n FROM mk_automation_runs") };
    const page = (await boss.get(`${M}/automatisations/${autoP}/simulation?contact=sim.web@exemple.fr`)).text;
    assert.match(page, /sans rien envoyer ni modifier/); assert.match(page, /[Rr]ien n(?:'|&#39;)a été envoyé ni modifié/);
    assert.match(page, /serait exécutée/); assert.match(page, /simule/); assert.match(page, /attente/);
    assert.deepEqual({ tags: count("SELECT COUNT(*) n FROM mk_contact_tags"), ev: count("SELECT COUNT(*) n FROM mk_events"), runs: count("SELECT COUNT(*) n FROM mk_automation_runs") }, before);
    assert.match((await boss.get(`${M}/automatisations/${autoP}/simulation?contact=inconnu@exemple.fr`)).text, /Aucun contact ne correspond/);
  });
  test("historique : filtres, pagination, états ; panneau « Scénarios » sur la fiche du contact", async () => {
    const now = Date.now();
    const ins = db.prepare("INSERT INTO mk_automation_runs (organization_id, automation_id, contact_id, steps, step_index, status, wake_at, entered_at, last_error, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
    ins.run(orgId, autoP, contactId, JSON.stringify([{ type: "wait", amount: 1, unit: "days" }, { type: "add_tag", tag: "x" }]), 1, "running", now + 86400000, now, "");
    const second = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name) VALUES (?, 'echec@exemple.fr', 'Eva')").run(orgId).lastInsertRowid);
    ins.run(orgId, autoP, second, "[]", 0, "failed", now, now, "panne du fournisseur");
    const h = (await boss.get(`${M}/automatisations/historique`)).text;
    assert.match(h, /sim\.web@exemple\.fr/); assert.match(h, /En attente/); assert.match(h, /panne du fournisseur/);
    const errs = (await boss.get(`${M}/automatisations/historique?erreurs=1`)).text;
    assert.match(errs, /echec@exemple\.fr/); assert.doesNotMatch(errs, /sim\.web@exemple\.fr/);
    assert.match((await boss.get(`${M}/automatisations/historique?q=Simone`)).text, /sim\.web/);
    assert.equal((await boss.get(`${M}/automatisations/historique?etat=pirate&page=-4`)).status, 200, "valeurs invalides ignorées");
    const fiche = (await boss.get(`${M}/contacts/${contactId}`)).text;
    assert.match(fiche, /Scénarios d(?:'|&#39;)automatisation/); assert.match(fiche, /Scénario Principal/); assert.match(fiche, /En attente/);
  });
  test("sans le droit « données sensibles » : adresses masquées dans l'historique, la simulation et le détail ; recherche limitée", async () => {
    const h = (await basic.get(`${M}/automatisations/historique`)).text;
    assert.doesNotMatch(h, /sim\.web@exemple\.fr|echec@exemple\.fr/); assert.match(h, /s•••@exemple\.fr/);
    const sim = (await basic.get(`${M}/automatisations/${autoP}/simulation?contact=sim.web@exemple.fr`)).text;
    assert.doesNotMatch(sim, /sim\.web@exemple\.fr/);
  });
  test("XSS : noms de scénarios et de contacts restent du texte", async () => {
    await boss.post(`${M}/automatisations`, { name: "<img src=x onerror=alert(1)>", kind: "marketing", trigger_event: "contact.created" });
    db.prepare("UPDATE mk_contacts SET first_name = ? WHERE id = ?").run("<svg onload=alert(2)>", contactId);
    for (const url of [`${M}/automatisations`, `${M}/automatisations/historique`, `${M}/contacts/${contactId}`, `${M}/automatisations/${autoP}/simulation?contact=${contactId}`]) assert.doesNotMatch((await boss.get(url)).text, /<img src=x onerror|<svg onload/, url);
  });
});
