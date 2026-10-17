// R7 (lot 5) — File de demandes de rattachement de contacts entre sites (décision produit du 17/10/2026, option 1). Serveur réel + bases synthétiques jetables.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { freshMarketing, TEST_KEY, MIGRATIONS, quiet } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));

describe("migration 083 : additive, demandes définitives, une seule demande en attente par site et adresse", () => {
  test("table créée sans toucher aux contacts ; rejouée : rien ; unicité en attente ; demande traitée figée ; site d'une autre organisation refusé", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig83-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "083") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON");
      db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
      db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (2, 'Autre', 'autre', '{}')");
      db.exec("INSERT INTO mk_contacts (organization_id, email) VALUES (1, 'x@x.fr')");
      const before = rows(db, "SELECT * FROM mk_contacts");
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied.filter((v) => v === "083"), ["083"]);
      assert.deepEqual(rows(db, "SELECT * FROM mk_contacts"), before);
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, []);
      const ins = (email = "x@x.fr", site = 1, org = 1) => db.prepare("INSERT INTO mk_contact_requests (organization_id, site_id, email, source) VALUES (?, ?, ?, 'admin')").run(org, site, email);
      ins(); assert.throws(() => ins(), /UNIQUE/, "une seule demande en attente par site et adresse");
      assert.throws(() => ins("y@x.fr", 2, 1), /même organisation/);
      db.prepare("UPDATE mk_contact_requests SET status = 'refused', decided_at = datetime('now')").run();
      assert.throws(() => db.prepare("UPDATE mk_contact_requests SET status = 'accepted'").run(), /déjà traitée/);
      ins(); // après traitement, une nouvelle demande est possible (limitée par le débit)
      assert.throws(() => db.prepare("UPDATE mk_contact_requests SET email = 'z@x.fr' WHERE status = 'pending'").run(), /non modifiable/);
      assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("service : file, plafond, décision atomique (base synthétique)", () => {
  const requests = require("../src/marketing/contactcore/requests");
  const core = require("../src/marketing/contactcore");
  const world = () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}')");
    core.identify(m.A, { email: "autre@x.fr", siteId: 2 }); core.identify(m.A, { email: "propre@x.fr", siteId: 1 });
    return { ...m, S1: { ...m.A, siteScope: 1 } };
  };
  test("adresse inconnue ou déjà lisible par le site : aucune demande ; adresse d'un autre site : une demande, jamais deux", () => {
    const w = world();
    assert.equal(requests.enqueue(w.S1, { email: "neuve@x.fr" }).queued, false);
    assert.equal(requests.enqueue(w.S1, { email: "propre@x.fr" }).queued, false);
    assert.equal(requests.enqueue(w.S1, { email: "Autre@X.fr " }).queued, true, "adresse normalisée");
    assert.equal(requests.enqueue(w.S1, { email: "autre@x.fr" }).queued, false, "demande répétée : pas de doublon");
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_contact_requests")[0].n, 1);
    assert.equal(requests.enqueue(w.A, { email: "autre@x.fr" }).queued, false, "l'équipe n'a pas besoin de demander");
  });
  test("le demandeur ne reçoit que « pending » / « treated » (aucun identifiant de contact, aucun site d'origine) ; l'équipe seule liste les détails", () => {
    const w = world();
    requests.enqueue(w.S1, { email: "autre@x.fr" });
    const mine = requests.listMine(w.S1);
    assert.deepEqual(mine.map((r) => Object.keys(r).sort()), [["createdAt", "email", "id", "state"]]);
    assert.equal(mine[0].state, "pending");
    assert.throws(() => requests.listPending(w.S1), /réservé/);
    const team = requests.listPending(w.A); assert.equal(team[0].origin_name, "S2"); assert.ok(team[0].contact_id);
  });
  test("plafond de demandes en attente par site : au-delà, plus de mise en file (même réponse), tentative journalisée au niveau de l'organisation", () => {
    const w = world();
    for (let i = 0; i < requests.PENDING_CAP; i += 1) w.db.prepare("INSERT INTO mk_contact_requests (organization_id, site_id, email, source) VALUES (1, 1, ?, 'admin')").run(`p${i}@x.fr`);
    const r = requests.enqueue(w.S1, { email: "autre@x.fr" });
    assert.deepEqual([r.queued, r.dropped], [false, true]);
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_contact_requests WHERE email = 'autre@x.fr'")[0].n, 0);
    const log = rows(w.db, "SELECT action, site_id FROM mk_audit_logs WHERE action = 'contact_request.dropped'");
    assert.deepEqual(log, [{ action: "contact_request.dropped", site_id: null }]);
  });
  test("décision : acceptation = lien de lecture seule, contact et consentements intacts ; refus = rien ; double décision refusée ; contact disparu = classée refusée", () => {
    const w = world();
    const target = rows(w.db, "SELECT * FROM mk_contacts WHERE email = 'autre@x.fr'")[0];
    w.db.prepare("INSERT INTO mk_consents (organization_id, contact_id, source, text_shown, action) VALUES (1, ?, 'form', 'preuve', 'granted')").run(target.id);
    const snapshot = () => JSON.stringify({ c: rows(w.db, "SELECT * FROM mk_contacts ORDER BY id"), k: rows(w.db, "SELECT * FROM mk_consents ORDER BY id") });
    requests.enqueue(w.S1, { email: "autre@x.fr" });
    const id = rows(w.db, "SELECT id FROM mk_contact_requests")[0].id;
    const before = snapshot();
    assert.throws(() => requests.decide(w.S1, id, "accept"), /réservé/, "un accès limité ne décide pas");
    assert.equal(requests.decide(w.A, id, "accept").status, "accepted");
    assert.equal(snapshot(), before, "contact et consentements strictement inchangés");
    assert.deepEqual(rows(w.db, "SELECT link FROM mk_contact_sites WHERE contact_id = ? AND site_id = 1", target.id), [{ link: "activity" }]);
    const access = require("../src/marketing/contactcore/siteAccess");
    assert.equal(access.canRead(w.S1, target), true); assert.equal(access.canWrite(w.S1, target), false, "lecture seule");
    assert.throws(() => requests.decide(w.A, id, "refuse"), /déjà été traitée/);
    // refus : aucun lien
    core.identify(w.A, { email: "refus@x.fr", siteId: 2 }); requests.enqueue(w.S1, { email: "refus@x.fr" });
    const rid = rows(w.db, "SELECT id FROM mk_contact_requests WHERE email = 'refus@x.fr'")[0].id;
    const before2 = snapshot(); assert.equal(requests.decide(w.A, rid, "refuse").status, "refused"); assert.equal(snapshot(), before2);
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_contact_sites cs JOIN mk_contacts c ON c.id = cs.contact_id WHERE c.email = 'refus@x.fr' AND cs.site_id = 1")[0].n, 0);
    // contact disparu
    core.identify(w.A, { email: "parti@x.fr", siteId: 2 }); requests.enqueue(w.S1, { email: "parti@x.fr" });
    const pid = rows(w.db, "SELECT id FROM mk_contact_requests WHERE email = 'parti@x.fr'")[0].id;
    w.db.prepare("DELETE FROM mk_contacts WHERE email = 'parti@x.fr'").run();
    assert.equal(requests.decide(w.A, pid, "accept").status, "refused");
    assert.throws(() => requests.decide(w.A, 99999, "accept"), /introuvable/);
    assert.throws(() => requests.decide(w.A, pid, "fusionner"), /inconnue/);
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_contacts WHERE email = 'autre@x.fr'")[0].n, 1, "aucun second contact");
  });
});

describe("de bout en bout (serveur réel) : interface, API, permissions, débit, concurrence, journal", () => {
  let srv, db, boss, A, B, C, editorA, adminA, editorB, editorC, orgAdmin, siteRoleHolder, orgProcessor, ipN = 0;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const count = (sql, ...a) => one(sql, ...a).n;
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const CT = "/marketing/contacts", RQ = "/marketing/contacts/demandes";
  const add = (email, site = null, extra = "") => Number(db.prepare(`INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id${extra ? ", " + extra.split("=")[0] : ""}) VALUES (1, ?, 'Prénom-Secret', ?${extra ? ", " + extra.split("=")[1] : ""})`).run(email, site).lastInsertRowid);
  const snapshot = (id) => JSON.stringify({ c: { ...one("SELECT * FROM mk_contacts WHERE id = ?", id) }, k: db.prepare("SELECT * FROM mk_consents WHERE contact_id = ? ORDER BY id").all(id).map((r) => ({ ...r })) });
  const create = (client, site, email) => client.post(`${CT}?site=${site}`, { email, first_name: "Test", site });
  const shape = (r) => ({ status: r.status, location: String(r.location) });
  const key = {};
  const rawKeyFrom = (html) => html.match(/<code>(mk_live_[0-9a-f]{48})<\/code>/)[1];
  const api = (k, p, opts = {}) => new Client(srv.base).request(`/api/v1${p}`, { ...opts, headers: { authorization: `Bearer ${k}`, "X-Forwarded-For": `192.0.2.${(ipN += 1) % 250}` } });
  async function newKey(name, scope, site) { await boss.post("/marketing/api", { name, scope, ...(site ? { site_id: String(site) } : {}) }); return rawKeyFrom((await boss.get("/marketing/api")).text); }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", CONTACT_REQUESTS_PER_HOUR: "8" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo"); C = await mk("Site Charlie");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    editorA = await member(A, "editor"); adminA = await member(A, "admin"); editorB = await member(B, "editor"); editorC = await member(C, "editor");
    orgAdmin = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, ?, 'admin')").run(idOf(orgAdmin));
    // rôle personnalisé qui donne la permission dédiée à une personne limitée à un site : elle ne doit toujours pas pouvoir traiter
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Traiteur", description: "t", perm: ["contacts.read", "contacts.write", "contacts.requests"] });
    const roleKey = one("SELECT key FROM mk_roles WHERE name = 'Traiteur'").key;
    siteRoleHolder = await newStudent(srv); // limitée au site A MAIS avec le rôle personnalisé qui porte la permission dédiée
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(A, idOf(siteRoleHolder), roleKey);
    orgProcessor = await newStudent(srv); // membre de l'ÉQUIPE avec ce rôle personnalisé : seule voie (hors Super administrateur) pour traiter
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, ?, ?)").run(idOf(orgProcessor), roleKey);
    key.aW = await newKey("Alpha écriture", "write", A); key.cW = await newKey("Charlie écriture", "write", C); key.orgW = await newKey("Org écriture", "write");
  });
  after(() => { db.close(); return srv.stop(); });

  test("adresse nouvelle : créée tout de suite avec l'origine du site, aucune demande ; adresse d'un autre site et de l'historique : aucune fiche, MÊME réponse HTTP, une demande chacune", async () => {
    const other = add("prive.bravo@ex.fr", B), legacy = add("prive.historique@ex.fr");
    const before = [snapshot(other), snapshot(legacy)];
    const rNew = await create(editorA, A, "nouveau.alpha@ex.fr");
    const rOther = await create(editorA, A, "prive.bravo@ex.fr");
    const rLegacy = await create(editorA, A, "prive.historique@ex.fr");
    assert.deepEqual(shape(rOther), shape(rNew)); assert.deepEqual(shape(rLegacy), shape(rNew));
    assert.doesNotMatch(String(rNew.location), /contacts\/\d+/);
    for (const r of [rNew, rOther, rLegacy]) assert.doesNotMatch(r.text, /prive\.|Bravo|existe déjà/);
    assert.equal(one("SELECT origin_site_id o FROM mk_contacts WHERE email = 'nouveau.alpha@ex.fr'").o, A);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_requests WHERE site_id = ?", A), 2);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_requests WHERE email = 'nouveau.alpha@ex.fr'"), 0, "adresse nouvelle : pas de demande");
    assert.deepEqual([snapshot(other), snapshot(legacy)], before, "fiches intactes");
    assert.equal(count("SELECT COUNT(*) n FROM mk_contacts WHERE email IN ('prive.bravo@ex.fr', 'prive.historique@ex.fr')"), 2, "aucun second contact");
    // demandes répétées : une seule demande en attente, même réponse
    const again = await create(editorA, A, "prive.bravo@ex.fr"); assert.deepEqual(shape(again), shape(rNew));
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_requests WHERE email = 'prive.bravo@ex.fr' AND status = 'pending'"), 1);
  });
  test("« Mes demandes » : le site ne voit que SES demandes, sous les états « en attente » / « traitée », sans détail du contact ni du site d'origine ; un autre site ne les voit pas", async () => {
    const mine = (await editorA.get(`${RQ}?site=${A}`)).text;
    assert.match(mine, /prive\.bravo@ex\.fr/); assert.match(mine, /En attente/);
    const table = mine.slice(mine.indexOf("<table"), mine.indexOf("</table>")); // le tableau seulement (hors gabarit de la page)
    assert.doesNotMatch(table, /Prénom-Secret|Site Bravo|origine|contacts\/\d+/i);
    assert.doesNotMatch(mine, /Prénom-Secret|Site Bravo/);
    const theirs = (await editorB.get(`${RQ}?site=${B}`)).text;
    assert.doesNotMatch(theirs, /prive\.bravo@ex\.fr|prive\.historique/);
    assert.equal((await editorB.get(`${RQ}?site=${A}`)).status, 403, "demandes d'un autre site : refusées");
    const sneaky = await editorB.get(`${RQ}/traiter?site=${B}`); assert.ok([302, 403].includes(sneaky.status)); assert.doesNotMatch(sneaky.text, /prive\.bravo@ex\.fr/);
  });
  test("permissions : seule l'équipe avec la permission dédiée traite ; un administrateur d'organisation SANS elle, un administrateur de site, un éditeur et un rôle personnalisé limité à un site sont refusés", async () => {
    const id = one("SELECT id FROM mk_contact_requests WHERE email = 'prive.bravo@ex.fr'").id;
    for (const [who, client] of [["adminA", adminA], ["editorA", editorA], ["orgAdmin (contacts.merge sans contacts.requests)", orgAdmin]]) {
      for (const q of ["", `?site=${A}`]) { const screen = await client.get(`${RQ}/traiter${q}`); assert.ok([302, 403].includes(screen.status), `${who} : écran (${screen.status})`); assert.doesNotMatch(screen.text, /prive\.bravo@ex\.fr/, `${who} : aucune demande affichée`); }
      const r = await client.post(`${RQ}/${id}/accepter`, {}); assert.ok([403, 302].includes(r.status) && !(await Promise.resolve(false)), who);
      assert.equal(count("SELECT COUNT(*) n FROM mk_contact_requests WHERE id = ? AND status = 'pending'", id), 1, `${who} : demande inchangée`);
    }
    const holder = await siteRoleHolder.get(`${RQ}/traiter?site=${A}`); assert.ok([302, 403].includes(holder.status), "permission dédiée portée par un rôle de SITE : écran fermé (refus ou renvoi)"); assert.doesNotMatch(holder.text, /prive\.bravo@ex\.fr/);
    for (const q of ["", `?site=${A}`]) { const r = await siteRoleHolder.post(`${RQ}/${id}/accepter${q}`, { site: A }); assert.ok([403, 302].includes(r.status)); }
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_requests WHERE id = ? AND status = 'pending'", id), 1);
    // positif : un membre de l'ÉQUIPE avec la permission dédiée (rôle personnalisé) ouvre l'écran ; refus pour ceux qui n'ont qu'un rôle de site
    assert.equal((await orgProcessor.get(`${RQ}/traiter`)).status, 200);
    const team = await boss.get(`${RQ}/traiter`); assert.equal(team.status, 200);
    assert.match(team.text, /prive\.bravo@ex\.fr/); assert.match(team.text, /Site Alpha/);
  });
  test("acceptation par l'équipe : lecture seule pour le site demandeur ; contact et consentements intacts ; le site voit « Traitée » ; aucune écriture possible", async () => {
    const id = one("SELECT id FROM mk_contact_requests WHERE email = 'prive.bravo@ex.fr'").id;
    const contact = one("SELECT id FROM mk_contacts WHERE email = 'prive.bravo@ex.fr'").id;
    db.prepare("INSERT INTO mk_consents (organization_id, contact_id, source, text_shown, action) VALUES (1, ?, 'form', 'preuve', 'granted')").run(contact);
    const before = snapshot(contact);
    assert.equal((await editorA.get(`${CT}/${contact}?site=${A}`)).status, 404, "avant : fiche introuvable");
    const r = await boss.post(`${RQ}/${id}/accepter`, {}); assert.equal(r.status, 302);
    assert.equal(one("SELECT status s FROM mk_contact_requests WHERE id = ?", id).s, "accepted");
    assert.equal(snapshot(contact), before, "données et consentements inchangés");
    assert.equal((await editorA.get(`${CT}/${contact}?site=${A}`)).status, 200, "après : lecture");
    assert.equal((await editorA.post(`${CT}/${contact}?site=${A}`, { first_name: "PIRATE", site: A })).status, 404, "écriture refusée");
    assert.equal((await editorA.post(`${CT}/${contact}/consentement?site=${A}`, { site: A, action: "grant" })).status === 200, false);
    assert.equal(snapshot(contact), before);
    const mine = (await editorA.get(`${RQ}?site=${A}`)).text; assert.match(mine, /Traitée/);
    const tbl = mine.slice(mine.indexOf("<table"), mine.indexOf("</table>")); assert.doesNotMatch(tbl, /refus|accept/i, "le tableau ne distingue pas accepté / refusé");
    // la même demande ne se traite pas deux fois
    const again = await boss.post(`${RQ}/${id}/refuser`, {}); assert.equal(again.status, 302);
    assert.equal(one("SELECT status s FROM mk_contact_requests WHERE id = ?", id).s, "accepted");
  });
  test("refus : le contact n'est pas modifié, aucun lien ; le demandeur voit simplement « Traitée »", async () => {
    const contact = one("SELECT id FROM mk_contacts WHERE email = 'prive.historique@ex.fr'").id;
    const id = one("SELECT id FROM mk_contact_requests WHERE email = 'prive.historique@ex.fr'").id;
    const before = snapshot(contact);
    assert.equal((await boss.post(`${RQ}/${id}/refuser`, {})).status, 302);
    assert.equal(one("SELECT status s FROM mk_contact_requests WHERE id = ?", id).s, "refused");
    assert.equal(snapshot(contact), before);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_sites WHERE contact_id = ? AND site_id = ?", contact, A), 0);
    assert.equal((await editorA.get(`${CT}/${contact}?site=${A}`)).status, 404);
    assert.match((await editorA.get(`${RQ}?site=${A}`)).text, /prive\.historique@ex\.fr[\s\S]{0,200}Traitée/);
  });
  test("traitements concurrents : deux décisions simultanées sur la même demande — une seule est enregistrée", async () => {
    const c = add("concurrent@ex.fr", B); await create(editorA, A, "concurrent@ex.fr");
    const id = one("SELECT id FROM mk_contact_requests WHERE email = 'concurrent@ex.fr'").id;
    await Promise.all([boss.post(`${RQ}/${id}/accepter`, {}), boss.post(`${RQ}/${id}/refuser`, {}), boss.post(`${RQ}/${id}/accepter`, {})]);
    assert.equal(count("SELECT COUNT(*) n FROM mk_audit_logs WHERE resource_type = 'contact_request' AND resource_id = ? AND action IN ('contact_request.accepted', 'contact_request.refused')", String(id)), 1);
    const st = one("SELECT status s FROM mk_contact_requests WHERE id = ?", id).s;
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_sites WHERE contact_id = ? AND site_id = ?", c, A), st === "accepted" ? 1 : 0, "le lien correspond à l'unique décision");
  });
  test("journal : création, acceptation et refus sont consignés au niveau de l'organisation, sans information du contact ; un administrateur de site (audit.read) ne les lit pas", async () => {
    const logs = rows(db, "SELECT action, site_id, metadata FROM mk_audit_logs WHERE resource_type = 'contact_request'");
    assert.ok(["contact_request.created", "contact_request.accepted", "contact_request.refused"].every((a) => logs.some((l) => l.action === a)));
    assert.ok(logs.every((l) => l.site_id === null), "événements d'organisation");
    assert.ok(logs.every((l) => !/@|Prénom-Secret/.test(l.metadata) || /contactId/.test(l.metadata) === false || !/@/.test(l.metadata)), "aucune adresse dans le journal");
    const page = await adminA.get(`/marketing/site-web/outils/logs?site=${A}`);
    assert.equal(page.status, 200); assert.doesNotMatch(page.text, /contact_request/);
    assert.match((await boss.get("/marketing/site-web/outils/logs")).text, /contact_request/);
  });
  test("limite de débit par site : après le plafond, MÊME refus quel que soit le résultat (adresse nouvelle ou connue) ; un autre site n'est pas touché", async () => {
    add("connu.bravo@ex.fr", B);
    const seq = [];
    for (let i = 0; i < 12; i += 1) {
      const email = i % 2 ? "connu.bravo@ex.fr" : `charlie.neuf${i}@ex.fr`;
      const r = await create(editorC, C, email); seq.push({ i, email, ...shape(r), flash: /Trop de tentatives/.test(r.text) });
    }
    const loc = new Set(seq.map((s) => s.location));
    // les 8 premières (plafond) aboutissent à la liste, la suite est refusée de la même façon pour les deux types d'adresse
    const refused = seq.filter((s) => s.location.endsWith("/nouveau?site=" + C));
    assert.ok(refused.length >= 4, JSON.stringify(seq));
    assert.deepEqual([...new Set(refused.map((s) => s.email.startsWith("charlie") ? "neuve" : "connue"))].sort(), ["connue", "neuve"], "refusées sans distinction d'adresse");
    assert.ok(loc.size <= 2);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contacts WHERE email LIKE 'charlie.neuf%'") <= 4, true);
    const stillOk = await create(editorB, B, "bravo.libre@ex.fr"); assert.match(String(stillOk.location), /contacts\?site=/);
  });
  test("API : clé de site — 202 identique pour adresse nouvelle ou d'un autre site, demande mise en file (source api) ; clé d'organisation inchangée ; débit 429", async () => {
    add("api.prive@ex.fr", B);
    const body = (email) => ({ method: "POST", json: { email, first_name: "Api" } });
    const rNew = await api(key.aW, "/contacts", body("api.nouveau@ex.fr")), rKnown = await api(key.aW, "/contacts", body("api.prive@ex.fr"));
    assert.equal(rNew.status, 202); assert.equal(rKnown.status, 202); assert.equal(rKnown.text, rNew.text);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_requests WHERE email = 'api.prive@ex.fr' AND source = 'api' AND site_id = ?", A), 1);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_requests WHERE email = 'api.nouveau@ex.fr'"), 0);
    assert.equal(one("SELECT first_name f FROM mk_contacts WHERE email = 'api.prive@ex.fr'").f, "Prénom-Secret");
    const org = await api(key.orgW, "/contacts", body("api.org@ex.fr")); assert.equal(org.status, 201, "clé d'organisation : contrat historique");
    const orgKnown = await api(key.orgW, "/contacts", body("api.prive@ex.fr")); assert.equal(orgKnown.status, 200);
    let limited = 0; for (let i = 0; i < 12; i += 1) { const r = await api(key.cW, "/contacts", body(i % 2 ? "api.prive@ex.fr" : `api.c${i}@ex.fr`)); if (r.status === 429) limited += 1; else assert.equal(r.status, 202); }
    assert.ok(limited >= 4, `${limited} refus 429`);
  });
});
