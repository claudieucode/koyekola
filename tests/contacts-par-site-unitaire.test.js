// R7 (lot 1) — Contacts par site (D2, 16/10/2026) : migration 080 additive (reprise dérivée, déclencheurs) et règle d'accès unique (siteAccess).
// Base en mémoire avec les vraies migrations ; aucune base réelle, aucun serveur.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { freshMarketing, MIGRATIONS, quiet } = require("./marketing-helpers");
const access = require("../src/marketing/contactcore/siteAccess");
const core = require("../src/marketing/contactcore");
const audience = require("../src/marketing/audience");

const withUsers = (db) => db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");
const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));

describe("migration 080 : additive, reprise dérivée de l'existant", () => {
  test("les contacts, événements et sites existants ne changent pas ; les associations sont dérivées (origine, activité) ; organisation et sites étrangers ignorés", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig80-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "080") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON"); withUsers(db);
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
      db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}'), (2, 'Autre', 'autre', '{}')");
      db.exec("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (1, 'o1@x.fr', 1), (1, 'o2@x.fr', NULL), (1, 'o3@x.fr', 2), (2, 'b@x.fr', 3)");
      const ev = (org, contact, site) => db.prepare("INSERT INTO mk_events (organization_id, name, contact_id, source, occurred_at, created_at, site_id) VALUES (?, 'page.viewed', ?, 'cms', 1, 1, ?)").run(org, contact, site);
      ev(1, 2, 1); ev(1, 2, 1); ev(1, 1, 2); ev(1, 3, null); ev(1, 4, 1); /* contact d'une autre organisation */ ev(1, 999, 1); /* contact absent */
      const before = { c: rows(db, "SELECT * FROM mk_contacts ORDER BY id"), e: rows(db, "SELECT * FROM mk_events ORDER BY id"), s: rows(db, "SELECT * FROM mk_sites ORDER BY id") };
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied.filter((v) => v === "080"), ["080"]);
      assert.deepEqual({ c: rows(db, "SELECT * FROM mk_contacts ORDER BY id"), e: rows(db, "SELECT * FROM mk_events ORDER BY id"), s: rows(db, "SELECT * FROM mk_sites ORDER BY id") }, before, "aucune donnée existante modifiée");
      assert.deepEqual(rows(db, "SELECT contact_id, site_id, link FROM mk_contact_sites ORDER BY contact_id, site_id"), [
        { contact_id: 1, site_id: 1, link: "origin" }, { contact_id: 1, site_id: 2, link: "activity" },
        { contact_id: 2, site_id: 1, link: "activity" }, { contact_id: 3, site_id: 2, link: "origin" },
        { contact_id: 4, site_id: 3, link: "origin" },
      ], "contact 2 (sans origine) : activité seulement ; contact 3 : événement sans site ignoré ; contact d'une autre organisation : jamais lié au site de l'organisation 1");
      assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_contact_sites WHERE contact_id = 4 AND site_id = 1")[0].n, 0);
      assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("déclencheurs : l'association suit l'origine, les événements et la fusion", () => {
  const setup = () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}'), (2, 'Autre', 'autre', '{}')");
    return m;
  };
  const links = (db, id) => rows(db, "SELECT site_id, link FROM mk_contact_sites WHERE contact_id = ? ORDER BY site_id", id);

  test("nouveau contact avec origine, origine posée ou changée plus tard, événement d'un site (origine jamais rétrogradée)", () => {
    const { db, A } = setup();
    const c1 = core.identify({ ...A, siteScope: undefined }, { email: "a@x.fr", siteId: 1 }).contact;
    assert.deepEqual(links(db, c1.id), [{ site_id: 1, link: "origin" }]);
    const c2 = core.identify(A, { email: "b@x.fr" }).contact;
    assert.deepEqual(links(db, c2.id), []);
    core.recordEvent(A, { type: "page.viewed", contactId: c2.id, siteId: 2 });
    assert.deepEqual(links(db, c2.id), [{ site_id: 2, link: "activity" }]);
    db.prepare("UPDATE mk_contacts SET origin_site_id = 2 WHERE id = ?").run(c2.id);
    assert.deepEqual(links(db, c2.id), [{ site_id: 2, link: "origin" }], "l'activité devient origine");
    core.recordEvent(A, { type: "page.viewed", contactId: c2.id, siteId: 2 });
    assert.deepEqual(links(db, c2.id), [{ site_id: 2, link: "origin" }], "un événement ne rétrograde jamais l'origine");
    core.recordEvent(A, { type: "page.viewed", contactId: c2.id }); // sans site : aucune association
    assert.equal(links(db, c2.id).length, 1);
  });
  test("la base refuse une association entre organisations", () => {
    const { db, A } = setup();
    const c = core.identify(A, { email: "z@x.fr" }).contact;
    assert.throws(() => db.prepare("INSERT INTO mk_contact_sites (contact_id, site_id, organization_id, link) VALUES (?, 3, 1, 'activity')").run(c.id), /même organisation/);
    assert.throws(() => db.prepare("INSERT INTO mk_contact_sites (contact_id, site_id, organization_id, link) VALUES (?, 1, 2, 'activity')").run(c.id), /même organisation/);
  });
  test("fusion : les événements déplacés et l'origine reprise donnent les associations au maître ; aucun doublon de contact par site", () => {
    const { db, A } = setup();
    const master = core.identify(A, { email: "m@x.fr", siteId: 1 }).contact;
    const source = core.identify(A, { email: "s@x.fr", siteId: 2 }).contact;
    core.recordEvent(A, { type: "page.viewed", contactId: source.id, siteId: 2 });
    core.mergeContacts(A, master.id, source.id);
    assert.deepEqual(links(db, master.id), [{ site_id: 1, link: "origin" }, { site_id: 2, link: "activity" }]);
    assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_contacts WHERE record_status = 'active'")[0].n, 1);
  });
});

describe("règle d'accès : équipe, membre limité à un site, historique sans association", () => {
  const world = () => {
    const m = freshMarketing();
    const { db, A } = m;
    db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}')");
    const own = core.identify(A, { email: "own@x.fr", siteId: 1 }).contact;        // origine S1
    const seen = core.identify(A, { email: "seen@x.fr" }).contact;                 // événement S1 seulement (origine principale)
    core.recordEvent(A, { type: "page.viewed", contactId: seen.id, siteId: 1 });
    const other = core.identify(A, { email: "other@x.fr", siteId: 2 }).contact;    // origine S2
    const both = core.identify(A, { email: "both@x.fr", siteId: 2 }).contact;      // origine S2, activité S1
    core.recordEvent(A, { type: "page.viewed", contactId: both.id, siteId: 1 });
    const legacy = core.identify(A, { email: "legacy@x.fr" }).contact;             // historique : aucune association
    const get = (c) => audience.getContact(A, c.id);
    return { ...m, S1: { ...A, siteScope: 1 }, S2: { ...A, siteScope: 2 }, none: { ...A, siteScope: -1 }, own: get(own), seen: get(seen), other: get(other), both: get(both), legacy: get(legacy) };
  };

  test("équipe : tout lire et écrire ; membre limité : lecture = contacts associés à son site, écriture = origine seulement", () => {
    const w = world();
    for (const c of [w.own, w.seen, w.other, w.both, w.legacy]) { assert.ok(access.canRead(w.A, c)); assert.ok(access.canWrite(w.A, c)); }
    assert.deepEqual([w.own, w.seen, w.other, w.both, w.legacy].map((c) => access.canRead(w.S1, c)), [true, true, false, true, false]);
    assert.deepEqual([w.own, w.seen, w.other, w.both, w.legacy].map((c) => access.canWrite(w.S1, c)), [true, false, false, false, false]);
    assert.deepEqual([w.own, w.seen, w.other, w.both, w.legacy].map((c) => access.canRead(w.S2, c)), [false, false, true, true, false]);
    assert.deepEqual([w.own, w.seen, w.other, w.both, w.legacy].map((c) => access.canWrite(w.S2, c)), [false, false, true, true, false], "both : origine S2 → S2 écrit, S1 lit seulement");
    assert.ok([w.own, w.seen, w.other, w.both, w.legacy].every((c) => !access.canRead(w.none, c) && !access.canWrite(w.none, c)), "limité sans site : rien");
  });
  test("l'historique sans association n'est jamais accessible par défaut à un site", () => {
    const w = world();
    assert.equal(access.canRead(w.S1, w.legacy), false); assert.equal(access.canRead(w.S2, w.legacy), false);
    assert.deepEqual(audience.searchContacts(w.S1, {}).rows.map((c) => c.email).sort(), ["both@x.fr", "own@x.fr", "seen@x.fr"]);
    assert.ok(audience.searchContacts(w.A, {}).rows.some((c) => c.email === "legacy@x.fr"), "l'équipe le voit");
  });
  test("les listes sont bornées par le serveur même si l'appelant demande un autre site ; le filtre de l'équipe suit l'association", () => {
    const w = world();
    const emails = (ctx, o = {}) => audience.searchContacts(ctx, o).rows.map((c) => c.email).sort();
    assert.deepEqual(emails(w.S1, { siteId: 2 }), ["both@x.fr"], "demander le site 2 depuis le site 1 = intersection : seulement ce que le site 1 peut déjà lire (jamais other@x.fr)");
    assert.deepEqual(emails(w.S1, { siteId: 1 }), ["both@x.fr", "own@x.fr", "seen@x.fr"]);
    assert.deepEqual(emails(w.A, { siteId: 2 }), ["both@x.fr", "other@x.fr"]);
    assert.equal(audience.searchContacts(w.S1, {}).total, 3, "le total suit la même règle");
  });
  test("actions groupées : tout l'ensemble doit relever de l'origine du site, sinon rien n'est fait", () => {
    const w = world();
    assert.doesNotThrow(() => access.assertWritableIds(w.A, [w.own.id, w.other.id, w.legacy.id]));
    assert.doesNotThrow(() => access.assertWritableIds(w.S1, [w.own.id]));
    for (const ids of [[w.own.id, w.other.id], [w.seen.id], [w.both.id], [w.legacy.id], [w.own.id, 99999], [w.own.id, "1"], [w.own.id, null]]) assert.throws(() => access.assertWritableIds(w.S1, ids), /introuvable/, JSON.stringify(ids));
  });
  test("fusion et doublons : équipe seulement ; un membre limité est refusé sans rien lire ni modifier", () => {
    const w = world();
    assert.throws(() => core.findDuplicates(w.S1), /réservée à l'équipe/);
    assert.throws(() => core.mergePreview(w.S1, w.own.id, w.both.id), /réservée à l'équipe/);
    assert.throws(() => core.mergeContacts(w.S1, w.own.id, w.both.id), /réservée à l'équipe/);
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_contacts WHERE record_status = 'merged'")[0].n, 0);
    assert.doesNotThrow(() => core.mergePreview(w.A, w.own.id, w.other.id));
  });
});

describe("formulaires par site : service (défense en profondeur, indépendante des routes)", () => {
  const forms = require("../src/marketing/forms");
  const world = () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}'), (2, 'Autre', 'autre', '{}')");
    const mk = (ctx, name, siteId) => forms.createForm(ctx, { name, fields: [], consentText: "J'accepte ceci.", siteId });
    const f1 = mk({ ...m.A, siteScope: 1 }, "F1", 2 /* ignoré : le site vient du serveur */), f2 = mk({ ...m.A, siteScope: 2 }, "F2"), fm = mk(m.A, "Principal");
    return { ...m, f1, f2, fm, S1: { ...m.A, siteScope: 1 } };
  };
  test("le site d'un formulaire vient du serveur ; liste, lecture et toute écriture d'un formulaire d'un autre site ou du site principal sont « introuvable » pour un accès limité", () => {
    const w = world();
    assert.deepEqual([w.f1.siteId, w.f2.siteId, w.fm.siteId], [1, 2, null]);
    assert.deepEqual(forms.listForms(w.S1).map((f) => f.name), ["F1"]);
    assert.deepEqual(forms.listForms(w.A).map((f) => f.name).sort(), ["F1", "F2", "Principal"]);
    for (const f of [w.f2, w.fm]) {
      assert.throws(() => forms.getForm(w.S1, f.id), /introuvable/);
      assert.throws(() => forms.setStatus(w.S1, f.id, "published"), /introuvable/);
      assert.throws(() => forms.updateForm(w.S1, f.id, { name: "X", fields: [], consentText: "J'accepte ceci." }), /introuvable/);
      assert.throws(() => forms.deleteForm(w.S1, f.id), /introuvable/);
    }
    assert.equal(w.db.prepare("SELECT COUNT(*) n FROM mk_forms").get().n, 3);
    assert.doesNotThrow(() => forms.getForm(w.S1, w.f1.id));
  });
  test("la base refuse un formulaire rattaché à un site d'une autre organisation", () => {
    const w = world();
    assert.throws(() => w.db.prepare("UPDATE mk_forms SET site_id = 3 WHERE id = ?").run(w.f1.id), /même organisation/);
    assert.throws(() => w.db.prepare("INSERT INTO mk_forms (organization_id, name, slug, consent_text, site_id) VALUES (1, 'Z', 'z', 'ok ok', 3)").run(), /même organisation/);
  });
  test("migration 081 : colonnes ajoutées, formulaires et preuves existants inchangés (site NULL), preuves toujours en écriture seule", () => {
    const w = world();
    assert.equal(w.db.prepare("SELECT COUNT(*) n FROM pragma_table_info('mk_consents') WHERE name = 'site_id'").get().n, 1);
    const c = w.db.prepare("INSERT INTO mk_contacts (organization_id, email) VALUES (1, 'c@x.fr')").run().lastInsertRowid;
    w.db.prepare("INSERT INTO mk_consents (organization_id, contact_id, source, text_shown, action) VALUES (1, ?, 'form', 'preuve', 'granted')").run(c);
    assert.equal(w.db.prepare("SELECT site_id s FROM mk_consents").get().s, null);
    assert.throws(() => w.db.prepare("UPDATE mk_consents SET site_id = 1").run(), /lecture seule/);
  });
});

describe("migration 081 sur des données existantes, double confirmation et consentement restrictif (service, base synthétique)", () => {
  const forms = require("../src/marketing/forms");
  test("migration 081 : formulaires, preuves de consentement et confirmations en attente existants strictement inchangés ; tous restent au site principal", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig81-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "081") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON"); withUsers(db);
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a')");
      db.exec("INSERT INTO mk_forms (organization_id, name, slug, consent_text) VALUES (1, 'Ancien', 'ancien', 'Texte de preuve')");
      db.exec("INSERT INTO mk_contacts (organization_id, email) VALUES (1, 'x@x.fr')");
      db.exec("INSERT INTO mk_consents (organization_id, contact_id, source, text_shown, action, form_id) VALUES (1, 1, 'form', 'Texte de preuve', 'granted', 1)");
      const before = { f: rows(db, "SELECT * FROM mk_forms"), c: rows(db, "SELECT * FROM mk_consents") };
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied.filter((v) => v === "081"), ["081"]);
      const strip = (r) => r.map(({ site_id, notify_email, ...rest }) => rest); // notify_email : colonne ajoutée plus tard par la migration 126 (défaut vide), sans effet sur les données existantes
      assert.deepEqual({ f: strip(rows(db, "SELECT * FROM mk_forms")), c: strip(rows(db, "SELECT * FROM mk_consents")) }, { f: strip(before.f), c: strip(before.c) });
      assert.deepEqual([rows(db, "SELECT site_id FROM mk_forms")[0].site_id, rows(db, "SELECT site_id FROM mk_consents")[0].site_id], [null, null]);
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, [], "rejouée : rien à appliquer");
      assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  const world = () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}')");
    const f = forms.createForm({ ...m.A, siteScope: 1 }, { name: "F1", fields: ["first_name"], consentText: "J'accepte ceci.", doubleOptin: true });
    forms.setStatus(m.A, f.id, "published");
    return { ...m, form: f };
  };
  test("double confirmation : un contact d'un autre site, désinscrit, reçoit une confirmation en attente SANS rien changer (champs, origine, association, consentement) ; la confirmation par la personne l'abonne avec le site de collecte", () => {
    const w = world();
    const other = core.identify(w.A, { email: "p@x.fr", siteId: 2 }).contact;
    w.db.prepare("UPDATE mk_contacts SET status = 'unsubscribed' WHERE id = ?").run(other.id);
    const r = forms.submitForm(w.A, w.form.id, { email: "p@x.fr", first_name: "Intrus", consent: "1", ip: "203.0.113.5" });
    assert.equal(r.ok, true); assert.equal(r.pending, true); assert.ok(r.token);
    const after = rows(w.db, "SELECT first_name, status, origin_site_id FROM mk_contacts WHERE id = ?", other.id)[0];
    assert.ok(!after.first_name, "champ non complété"); assert.equal(after.status, "unsubscribed"); assert.equal(after.origin_site_id, 2);
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", other.id)[0].n, 0, "aucun consentement avant la confirmation");
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_contact_sites WHERE contact_id = ? AND site_id = 1", other.id)[0].n, 0, "aucune association avec le site du formulaire");
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_events WHERE contact_id = ? AND site_id = 1", other.id)[0].n, 0, "événement non rattaché au site du formulaire");
    const ok = forms.confirmSubscription(w.A, r.token);
    assert.equal(ok.ok, true);
    assert.equal(rows(w.db, "SELECT status FROM mk_contacts WHERE id = ?", other.id)[0].status, "subscribed");
    const proof = rows(w.db, "SELECT site_id, source FROM mk_consents WHERE contact_id = ?", other.id);
    assert.deepEqual(proof, [{ site_id: 1, source: "form" }], "preuve avec le site de collecte");
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_contact_sites WHERE contact_id = ? AND site_id = 1", other.id)[0].n, 0, "la confirmation ne donne pas non plus accès à la fiche");
  });
  test("sans double confirmation : un désinscrit d'un autre site n'est pas réabonné ; un contact « inconnu » d'un autre site peut donner son accord (aucun consentement restrictif écrasé)", () => {
    const w = world();
    w.db.prepare("UPDATE mk_forms SET double_optin = 0 WHERE id = ?").run(w.form.id);
    const un = core.identify(w.A, { email: "u@x.fr", siteId: 2 }).contact;
    w.db.prepare("UPDATE mk_contacts SET status = 'unsubscribed' WHERE id = ?").run(un.id);
    const unknown = core.identify(w.A, { email: "k@x.fr", siteId: 2 }).contact;
    assert.equal(forms.submitForm(w.A, w.form.id, { email: "u@x.fr", consent: "1" }).ok, true);
    assert.equal(rows(w.db, "SELECT status FROM mk_contacts WHERE id = ?", un.id)[0].status, "unsubscribed");
    assert.equal(forms.submitForm(w.A, w.form.id, { email: "k@x.fr", consent: "1" }).ok, true);
    assert.equal(rows(w.db, "SELECT status FROM mk_contacts WHERE id = ?", unknown.id)[0].status, "subscribed", "l'absence de consentement devient un accord seulement par la case cochée de la personne");
  });
});
