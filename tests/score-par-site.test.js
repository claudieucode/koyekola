// R7 (lot 6.4) — Score des contacts multisite : migration 088 (colonne du journal, reprise sans rien deviner), score DU SITE pour un accès limité, règles/niveaux/recalcul réservés à l'équipe,
// calcul de l'équipe inchangé, module requis, parcours HTTP réels.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { freshMarketing, TEST_KEY, MIGRATIONS, quiet } = require("./marketing-helpers");
const core = require("../src/marketing/contactcore");
const scoring = require("../src/marketing/scoring");
const segments = require("../src/marketing/segments");
const modules = require("../src/marketing/siteModules");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));
const code = (fn) => { try { fn(); } catch (e) { return e.code || e.message; } return null; };

describe("migration 088 : une colonne, reprise de l'historique sans rien deviner", () => {
  test("le site d'une ligne vient de l'événement d'origine quand il en porte un ; sinon NULL ; scénarios NULL ; score des contacts intact ; déclencheurs ; rejouée : rien", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig88-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "088") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON");
      db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
      db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (2, 'S2', 's2', '{}')");
      db.exec("INSERT INTO mk_contacts (organization_id, email, score) VALUES (1, 'a@x.fr', 30)");
      const ev = (site, org = 1) => Number(db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, created_at, site_id) VALUES (?, 'page.visited', 'a@x.fr', 1, 't', 1, '{}', 1, ?)").run(org, site).lastInsertRowid);
      const e1 = ev(1), e2 = ev(null), e3 = ev(2, 2), e4 = ev(2);       // e3 : événement d'une AUTRE organisation ; e4 : événement de l'organisation 1 qui porte le site 2, lequel appartient à l'organisation 2
      db.exec("INSERT INTO mk_score_rules (organization_id, event, points) VALUES (1, 'page.visited', 10)");
      const log = (eventId, source = "rule") => db.prepare("INSERT INTO mk_score_log (organization_id, contact_id, rule_id, event_id, event, points, created_at, source) VALUES (1, 1, ?, ?, 'page.visited', 10, 1, ?)").run(source === "rule" ? 1 : null, eventId, source);
      log(e1); log(e2); log(999); log(e3 + 1000); log(e1, "automation");      // événement avec site, sans site, introuvable ; scénario dont le repère ressemble à un événement
      db.prepare("INSERT INTO mk_score_log (organization_id, contact_id, rule_id, event_id, event, points, created_at) VALUES (1, 1, 1, ?, 'page.visited', 10, 1)").run(e3);
      log(e4);   // événement d'un site d'une autre organisation
      const before = rows(db, "SELECT id, points, event_id, source FROM mk_score_log ORDER BY id");
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied.filter((v) => v === "088"), ["088"]);
      assert.deepEqual(rows(db, "SELECT id, points, event_id, source FROM mk_score_log ORDER BY id"), before, "aucune autre donnée modifiée");
      assert.deepEqual(rows(db, "SELECT id, site_id FROM mk_score_log ORDER BY id").map((r) => r.site_id), [1, null, null, null, null, null, null], "site repris seulement quand l'événement d'origine (même organisation) en portait un");
      assert.equal(rows(db, "SELECT score FROM mk_contacts")[0].score, 30, "score des contacts intact");
      assert.throws(() => db.prepare("UPDATE mk_score_log SET site_id = NULL WHERE id = 1").run(), /ne change jamais/);
      assert.throws(() => db.prepare("INSERT INTO mk_score_log (organization_id, contact_id, event_id, event, points, created_at, site_id) VALUES (1, 1, 5, 'x', 1, 1, 2)").run(), /même organisation/);
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, []);
      assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("service : score de l'équipe inchangé, score DU SITE pour un accès limité, règles réservées à l'équipe (base synthétique)", () => {
  const world = () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}'), (2, 'Autre', 'autre', '{}')");
    const A = m.ctx(1);
    const mk = (email, siteId) => core.identify(A, { email, ...(siteId ? { siteId } : {}) }).contact;
    const c1 = mk("c1@x.fr", 1), c2 = mk("c2@x.fr", 2), org = mk("org@x.fr"), both = mk("both@x.fr", 1);
    core.identify(A, { email: "both@x.fr", siteId: 2 });
    scoring.createRule(A, { event: "page.visited", points: 10 });
    const ev = (contact, siteId, name = "page.visited") => { const at = Date.now(); const id = Number(m.db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, created_at, site_id) VALUES (1, ?, ?, ?, 't', ?, '{}', ?, ?)").run(name, contact.email, contact.id, at, at, siteId ?? null).lastInsertRowid); return { id, organizationId: 1, name, contactId: contact.id, email: contact.email, metadata: {}, occurredAt: at, siteId: siteId ?? null }; };
    return { ...m, A, S1: { ...A, siteScope: 1 }, S2: { ...A, siteScope: 2 }, c1, c2, org, both, ev };
  };
  const stored = (w, c) => w.db.prepare("SELECT score FROM mk_contacts WHERE id = ?").get(c.id).score;

  test("attribution : chaque ligne porte le site de l'ÉVÉNEMENT (jamais une valeur de requête) ; site d'une autre organisation ou invalide → aucun ; le score de l'équipe est identique, module activé ou non", () => {
    const w = world();
    scoring.applyEvent(w.A, w.ev(w.c1, 1)); scoring.applyEvent(w.A, w.ev(w.c1, null)); scoring.applyEvent(w.A, w.ev(w.c1, 3)); scoring.applyEvent(w.A, w.ev(w.c1, 999));
    assert.deepEqual(rows(w.db, "SELECT site_id FROM mk_score_log ORDER BY id").map((r) => r.site_id), [1, null, null, null]);
    assert.equal(stored(w, w.c1), 40, "tous les points comptent pour l'organisation, comme avant");
    modules.setEnabled(w.A, 1, "scoring", true); scoring.applyEvent(w.A, w.ev(w.c1, 1)); modules.setEnabled(w.A, 1, "scoring", false); scoring.applyEvent(w.A, w.ev(w.c1, 1));
    assert.equal(stored(w, w.c1), 60, "le module n'a aucune influence sur le calcul");
  });
  test("score du site : somme des lignes de SON site pour les contacts que SON site lit ; jamais le score de l'organisation ; module requis", () => {
    const w = world();
    scoring.applyEvent(w.A, w.ev(w.c1, 1)); scoring.applyEvent(w.A, w.ev(w.c1, 1)); scoring.applyEvent(w.A, w.ev(w.c1, 2)); scoring.applyEvent(w.A, w.ev(w.c1, null));
    scoring.applyEvent(w.A, w.ev(w.c2, 2)); scoring.applyEvent(w.A, w.ev(w.org, null)); scoring.applyEvent(w.A, w.ev(w.both, 1)); scoring.applyEvent(w.A, w.ev(w.both, 2)); scoring.applyEvent(w.A, w.ev(w.both, 2));
    assert.equal(code(() => scoring.overview(w.S1)), "module_disabled");
    assert.equal(scoring.contactScore(w.S1, w.c1.id), null, "module désactivé : aucun score montré");
    modules.setEnabled(w.A, 1, "scoring", true); modules.setEnabled(w.A, 2, "scoring", true);
    const s = scoring.contactScore(w.S1, w.c1.id);
    assert.equal(stored(w, w.c1), 40); assert.deepEqual([s.score, s.siteScore, s.history.length], [20, true, 2], "20 = les deux lignes du site 1 (pas 40)");
    assert.equal(scoring.contactScore(w.S1, w.both.id).score, 10, "contact de deux sites : seulement la part du site 1"); assert.equal(scoring.contactScore(w.S2, w.both.id).score, 20);
    assert.equal(scoring.contactScore(w.S1, w.c2.id), null, "contact d'un autre site : introuvable"); assert.equal(scoring.contactScore(w.S1, w.org.id), null, "contact sans site : équipe seulement");
    const ov = scoring.overview(w.S1); const emails = ov.top.map((c) => c.email).sort();
    assert.deepEqual(emails, ["both@x.fr", "c1@x.fr"], "classement limité aux contacts lisibles du site");
    assert.equal(ov.levels.reduce((n, l) => n + l.contacts, 0), 2, "répartition : seulement les contacts lisibles du site"); assert.deepEqual(ov.top.map((c) => c.score), [20, 10]);
    assert.equal(scoring.overview(w.A).top.length, 4, "l'équipe voit tout");
  });
  test("règles, niveaux, recalcul, lecture des règles : réservés à l'équipe ; la lecture des niveaux n'écrit rien ; identifiants falsifiés refusés", () => {
    const w = world(); modules.setEnabled(w.A, 1, "scoring", true);
    const rule = scoring.listRules(w.A)[0].id, before = JSON.stringify(rows(w.db, "SELECT * FROM mk_score_rules"));
    for (const [name, fn] of [["créer", () => scoring.createRule(w.S1, { event: "page.visited", points: 5 })], ["modifier", () => scoring.updateRule(w.S1, rule, { points: 99 })], ["supprimer", () => scoring.deleteRule(w.S1, rule)],
      ["proposées", () => scoring.addSuggested(w.S1)], ["niveaux", () => scoring.saveLevels(w.S1, [{ name: "A", min: 0 }, { name: "B", min: 5 }])], ["recalculer", () => scoring.recompute(w.S1)], ["lire les règles", () => scoring.listRules(w.S1)]]) assert.equal(code(fn), "forbidden", name);
    assert.equal(JSON.stringify(rows(w.db, "SELECT * FROM mk_score_rules")), before);
    const org2 = w.ctx(2); assert.equal(code(() => scoring.updateRule(org2, rule, { points: 1 })), "not_found", "règle d'une autre organisation");
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_score_levels")[0].n, 0, "aucun niveau encore écrit");
    assert.equal(scoring.levels(w.S1).length, 4, "niveaux par défaut lisibles"); assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_score_levels")[0].n, 0, "la lecture par un site n'écrit rien");
    assert.equal(code(() => scoring.overview({ ...w.A, siteScope: -1 })), "module_disabled", "site imposé invalide");
  });
  test("recalcul de l'équipe : mêmes points, sites conservés, ajustements de scénarios conservés et attribués au site du scénario", () => {
    const w = world(); modules.setEnabled(w.A, 1, "scoring", true);
    scoring.applyEvent(w.A, w.ev(w.c1, 1)); scoring.applyEvent(w.A, w.ev(w.c1, null));
    scoring.adjustScore(w.A, w.c1.id, { mode: "add", points: 5, key: 101, siteId: 1 }); scoring.adjustScore(w.A, w.c1.id, { mode: "add", points: 7, key: 102, siteId: 999 });
    assert.deepEqual(rows(w.db, "SELECT site_id FROM mk_score_log WHERE source = 'automation' ORDER BY id").map((r) => r.site_id), [1, null]);
    const snap = () => JSON.stringify([rows(w.db, "SELECT score FROM mk_contacts ORDER BY id"), rows(w.db, "SELECT event_id, points, source, site_id FROM mk_score_log ORDER BY source, event_id")]);
    const before = snap(); scoring.recompute(w.A);
    assert.equal(snap(), before, "recalculer redonne exactement les mêmes points et les mêmes sites");
    assert.equal(scoring.contactScore(w.S1, w.c1.id).score, 15, "10 (événement) + 5 (scénario du site 1) ; pas les 7 du scénario sans site");
  });
  test("scénario « Modifier le score » : la ligne du journal porte le site du SCÉNARIO (relu en base), pas celui d'un contexte falsifié ; le score de l'équipe est modifié comme avant", () => {
    const w = world(); const action = require("../src/marketing/automations/actions").getAction("adjust_score");
    const run = (automation, key) => action.execute({ ctx: { ...w.A, bus: null }, run: { id: key }, index: 0, step: { mode: "add", points: 5 }, contact: w.c1, automation });
    assert.equal(run({ site_id: 1 }, 1).next, true); assert.equal(run({ site_id: null }, 2).next, true);
    assert.deepEqual(rows(w.db, "SELECT site_id FROM mk_score_log WHERE source = 'automation' ORDER BY id").map((r) => r.site_id), [1, null]);
    assert.equal(stored(w, w.c1), 10, "comportement historique de l'équipe inchangé");
  });
  test("segments : le critère « Score » est refusé à un accès limité (il regrouperait l'activité de tous les sites) et reste ouvert à l'équipe", () => {
    const w = world();
    const def = { op: "and", rules: [{ field: "score", cmp: "gte", value: 10 }] };
    assert.doesNotThrow(() => segments.validateDefinition(w.A, def));
    assert.throws(() => segments.validateDefinition(w.S1, def), /réservé à l'équipe/);
  });
});

describe("de bout en bout (serveur réel) : écran du score ouvert aux sites, lecture seule, isolation, rôles", () => {
  let srv, db, boss, A, B, adminA, editorA, adminB, readerA, maskedA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const S = "/marketing/score";
  let nEv = 0;
  const contact = (email, site) => { const c = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (1, ?, ?)").run(email, site).lastInsertRowid); return c; };
  const logRow = (c, site, pts) => db.prepare("INSERT INTO mk_score_log (organization_id, contact_id, rule_id, event_id, event, points, created_at, site_id) VALUES (1, ?, NULL, ?, 'page.visited', ?, 1, ?)").run(c, 9000 + ++nEv, pts, site);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); editorA = await member(A, "editor"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Campagnes seules", description: "t", perm: ["campaigns.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Campagnes seules'").key);
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Contacts masques", description: "t", perm: ["contacts.read"] });
    maskedA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Contacts masques'").key);
    await boss.post(`${S}/regles/proposees`, {});
    const ca = contact("alpha@ex.cd", A), cb = contact("bravo@ex.cd", B), co = contact("organisation@ex.cd", null);
    logRow(ca, A, 40); logRow(ca, B, 70); logRow(cb, B, 30); logRow(co, null, 55);
    db.prepare("UPDATE mk_contacts SET score = CASE email WHEN 'alpha@ex.cd' THEN 110 WHEN 'bravo@ex.cd' THEN 30 ELSE 55 END").run();
  });
  after(() => { db.close(); return srv.stop(); });
  const rulesBefore = () => JSON.stringify(db.prepare("SELECT * FROM mk_score_rules").all().map((r) => ({ ...r })));

  test("module désactivé : l'écran du site est refusé à l'administrateur, à l'éditeur et à tout rôle ; l'équipe garde son accès complet", async () => {
    for (const c of [adminA, editorA, readerA]) { const r = await c.get(`${S}?site=${A}`); assert.ok([403, 404].includes(r.status), `${r.status}`); assert.doesNotMatch(r.text, /alpha@ex|bravo@ex|organisation@ex/); }
    const team = await boss.get(S); assert.equal(team.status, 200); assert.match(team.text, /Règles/); assert.match(team.text, /organisation@ex\.cd/);
  });
  test("module activé : l'administrateur et l'éditeur voient le score DE LEUR SITE (40, pas les 110 de l'organisation), sans règles ni formulaire d'écriture ; le rôle sans lecture des contacts reste refusé", async () => {
    assert.equal((await boss.post(`${M(A)}/scoring`, { etat: "activer" })).status, 302);
    for (const c of [adminA, editorA]) {
      const r = await c.get(`${S}?site=${A}`); assert.equal(r.status, 200);
      assert.match(r.text, /alpha@ex\.cd/); assert.match(r.text, /40 points/); assert.doesNotMatch(r.text, /110 points|bravo@ex|organisation@ex/);
      assert.doesNotMatch(r.text, /Nouvelle règle|Quand…|Recalculer|Enregistrer les niveaux|action="\/marketing\/score\//);
      assert.match(r.text, /Score du site/);
    }
    assert.equal((await readerA.get(`${S}?site=${A}`)).status, 403, "rôle sans contacts.read");
    const masked = await maskedA.get(`${S}?site=${A}`); assert.equal(masked.status, 200);
    assert.doesNotMatch(masked.text, /alpha@ex\.cd/, "sans le droit de voir les données sensibles, l'adresse est masquée"); assert.match(masked.text, /40 points/);
  });
  test("fiche du contact : le site voit le score du site pour ses contacts, jamais pour ceux d'un autre site ou sans site ; l'équipe garde le score de l'organisation", async () => {
    const ca = one("SELECT id FROM mk_contacts WHERE email = 'alpha@ex.cd'").id, cb = one("SELECT id FROM mk_contacts WHERE email = 'bravo@ex.cd'").id, co = one("SELECT id FROM mk_contacts WHERE email = 'organisation@ex.cd'").id;
    const mine = await adminA.get(`/marketing/contacts/${ca}?site=${A}`); assert.equal(mine.status, 200);
    assert.match(mine.text, /mk-stat-label">Score<\/span><span class="mk-stat-value">40<\/span>/); assert.match(mine.text, /score du site/); assert.doesNotMatch(mine.text, /value">110</);
    for (const id of [cb, co]) { const r = await adminA.get(`/marketing/contacts/${id}?site=${A}`); assert.ok([403, 404].includes(r.status), `${id} ${r.status}`); assert.doesNotMatch(r.text, /bravo@ex|organisation@ex/); }
    assert.match((await boss.get(`/marketing/contacts/${ca}`)).text, /mk-stat-label">Score<\/span><span class="mk-stat-value">110<\/span>/);
  });
  test("écriture : règles, niveaux, recalcul, règles proposées et suppression sont fermés aux sites (même avec un site falsifié dans l'adresse ou le corps) ; rien ne change", async () => {
    const before = rulesBefore(), levelsBefore = JSON.stringify(db.prepare("SELECT * FROM mk_score_levels").all().map((r) => ({ ...r }))), scores = JSON.stringify(db.prepare("SELECT id, score FROM mk_contacts ORDER BY id").all().map((r) => ({ ...r })));
    const id = one("SELECT id FROM mk_score_rules LIMIT 1").id;
    for (const c of [adminA, editorA]) for (const q of ["", `?site=${A}`, `?site=${B}`]) for (const [p, body] of [["/regles", { event: "page.visited", points: 99 }], ["/regles/proposees", {}], [`/regles/${id}`, { action: "supprimer" }], [`/regles/${id}`, { points: 99 }], ["/niveaux", { levels: { 0: { name: "X", min: 0 }, 1: { name: "Y", min: 3 } } }], ["/recalculer", {}]]) {
      const r = await c.post(`${S}${p}${q}`, { ...body, site: A }); assert.ok([302, 403, 404].includes(r.status), `${p}${q} ${r.status}`); if (r.status === 302) assert.doesNotMatch(r.location || "", /score#|score$/ , "redirection vers l'accueil des sites, pas une action");
    }
    assert.equal(rulesBefore(), before); assert.equal(JSON.stringify(db.prepare("SELECT * FROM mk_score_levels").all().map((r) => ({ ...r }))), levelsBefore);
    assert.equal(JSON.stringify(db.prepare("SELECT id, score FROM mk_contacts ORDER BY id").all().map((r) => ({ ...r }))), scores);
  });
  test("isolation : l'administrateur de B (module désactivé puis activé) ne voit jamais les données d'Alpha ; Alpha ne peut pas viser B ; paramètres de site falsifiés refusés", async () => {
    assert.equal((await adminB.get(`${S}?site=${B}`)).status, 403, "module non activé pour B");
    assert.equal((await adminB.get(`${S}?site=${A}`)).status, 403);
    assert.equal((await boss.post(`${M(B)}/scoring`, { etat: "activer" })).status, 302);
    const b = await adminB.get(`${S}?site=${B}`); assert.equal(b.status, 200);
    assert.match(b.text, /bravo@ex\.cd/); assert.match(b.text, /30 points/); assert.doesNotMatch(b.text, /70 points/, "les 70 points du site B portés par un contact d'Alpha ne sont pas visibles de B"); assert.doesNotMatch(b.text, /alpha@ex|organisation@ex/);
    for (const q of [`?site=${A}`, `?site=abc`, `?site=-1`, `?site=${A}&site=${B}`, ""]) { const r = await adminA.get(`${S}${q}`); assert.ok([302, 403, 404].includes(r.status) || (r.status === 200 && !/bravo@ex|organisation@ex/.test(r.text)), `${q} ${r.status}`); }
    assert.equal((await adminA.get(`${S}?site=${B}`)).status, 403, "Alpha vise Bravo");
    assert.doesNotMatch((await adminA.get(`${S}?site=${A}`)).text, /bravo@ex/);
    const api = await boss.request("/api/v1/score"); assert.ok([401, 404].includes(api.status), "aucune API de score");
  });
  test("segment avec critère de score : créé par l'équipe pour un site, il s'ouvre sans erreur serveur pour l'administrateur du site ; modification du critère de score par le site refusée", async () => {
    const seg = Number(db.prepare("INSERT INTO mk_segments (organization_id, name, definition, site_id) VALUES (1, 'Chauds', ?, ?) RETURNING id").get(JSON.stringify({ op: "and", rules: [{ field: "score", cmp: "gte", value: 10 }] }), A).id);
    for (const p of ["/marketing/segments", `/marketing/segments/${seg}`]) { const r = await adminA.get(`${p}?site=${A}`); assert.ok(r.status < 500, `${p} ${r.status}`); }
  });
  test("module désactivé après usage : les lignes du journal sont conservées (l'équipe les lit), l'accès du site est refusé ; historique de l'équipe inchangé", async () => {
    const before = one("SELECT COUNT(*) n FROM mk_score_log").n;
    assert.equal((await boss.post(`${M(A)}/scoring`, { etat: "desactiver" })).status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM mk_score_log").n, before);
    assert.equal((await adminA.get(`${S}?site=${A}`)).status, 403);
    const team = (await boss.get(S)).text; assert.match(team, /alpha@ex\.cd/); assert.match(team, /Règles/);
    const ca = one("SELECT id FROM mk_contacts WHERE email = 'alpha@ex.cd'").id;
    assert.doesNotMatch((await adminA.get(`/marketing/contacts/${ca}?site=${A}`)).text, /mk-stat-label">Score</, "module désactivé : pas de score sur la fiche");
  });
});
