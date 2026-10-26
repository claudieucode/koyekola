// Non-régression de l'audit (B1 modules 1-11) : une fusion ne rend jamais joignable une personne désinscrite d'une liste ou d'une catégorie.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const core = require("../src/marketing/contactcore");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");

let m, A, db;
beforeEach(() => { m = freshMarketing(); A = m.A; db = m.db; db.prepare("INSERT INTO users (username, email) VALUES ('alice', 'alice@x.fr'), ('bob', 'bob@x.fr'), ('u3','u3@x.fr'), ('u4','u4@x.fr'), ('u5','u5@x.fr'), ('u6','u6@x.fr'), ('admin','admin@x.fr')").run(); }); // id 7 = utilisateur du contexte de test

function prepare() {
  const master = core.identify(A, { email: "m@x.fr", source: "form" }).contact;
  const source = core.identify(A, { email: "s@x.fr", source: "form" }).contact;
  for (const c of [master, source]) compliance.recordConsent(A, c.id, { source: "form", textShown: "J'accepte", ip: "" });
  return { master, source };
}

describe("fusion et refus", () => {
  test("désabonné d'une LISTE sur la fiche absorbée : le maître reste exclu de cette liste", () => {
    const { master, source } = prepare();
    const list = audience.createList(A, { name: "Newsletter" });
    audience.addToList(A, list.id, [source.id, master.id]);
    compliance.unsubscribe(A, source.id, { scope: "list", listId: list.id, source: "link" });
    assert.equal(compliance.isSendable(A, master.id, { listId: list.id }).ok, true, "avant fusion : le maître est joignable");
    core.mergeContacts(A, master.id, source.id);
    assert.equal(compliance.isSendable(A, master.id, { listId: list.id }).ok, false, "après fusion : le refus a suivi");
    assert.equal(compliance.isSendable(A, master.id).ok, true, "les autres listes ne sont pas touchées");
  });

  test("catégorie refusée sur la fiche absorbée : le maître l'est aussi, même s'il l'avait acceptée", () => {
    const { master, source } = prepare();
    compliance.createCategory(A, { key: "promos", label: "Promotions" });
    compliance.setPreference(A, master.id, "promos", true);
    compliance.setPreference(A, source.id, "promos", false);
    core.mergeContacts(A, master.id, source.id);
    assert.equal(compliance.isSendable(A, master.id, { category: "promos" }).ok, false);
  });

  test("désinscription globale de la source : le maître n'est plus joignable", () => {
    const { master, source } = prepare();
    compliance.unsubscribe(A, source.id, { scope: "all", source: "link" });
    core.mergeContacts(A, master.id, source.id);
    assert.equal(compliance.isSendable(A, master.id).ok, false);
  });
});

describe("réinscription d'une personne désinscrite (audit B2)", () => {
  const { registerLmsUser } = require("../src/marketing/bridge/lms");
  test("la case cochée à l'inscription ne réabonne pas une adresse désinscrite", () => {
    const c = core.identify(A, { email: "victime@x.fr", source: "form" }).contact;
    compliance.recordConsent(A, c.id, { source: "form", textShown: "J'accepte", ip: "" });
    compliance.unsubscribe(A, c.id, { scope: "all", source: "link" });
    db.prepare("INSERT INTO users (username, email) VALUES ('pirate', 'victime@x.fr')").run();
    const uid = db.prepare("SELECT id FROM users WHERE email = 'victime@x.fr'").get().id;
    const r = registerLmsUser(A, { id: uid, username: "pirate", email: "victime@x.fr" }, { optIn: true, ip: "" });
    assert.equal(r.subscribed, false);
    assert.equal(compliance.isSendable(A, c.id).ok, false);
  });
  test("une adresse inconnue qui coche la case est abonnée comme avant", () => {
    db.prepare("INSERT INTO users (username, email) VALUES ('nouv', 'nouv@x.fr')").run();
    const uid = db.prepare("SELECT id FROM users WHERE email = 'nouv@x.fr'").get().id;
    assert.equal(registerLmsUser(A, { id: uid, username: "nouv", email: "nouv@x.fr" }, { optIn: true, ip: "" }).subscribed, true);
  });
});

describe("export CSV et audience (audit modules 1-11)", () => {
  const { toCsv } = require("../src/marketing/import/csv");
  test("un numéro international reste intact, une vraie formule est neutralisée", () => {
    const out = toCsv([["+243 81 234 5678", "+243812345678", "=SOMME(A1)", "@cmd", "-2+3", "+1+1", "+abc"]]);
    assert.equal(out, "+243 81 234 5678,+243812345678,'=SOMME(A1),'@cmd,'-2+3,'+1+1,'+abc\r\n");
  });
  test("une fiche archivée est comptée « fiche archivée », pas « catégorie refusée »", () => {
    const sendingAudience = require("../src/marketing/sending/audience");
    const c = core.identify(A, { email: "arch@x.fr", source: "form" }).contact;
    compliance.recordConsent(A, c.id, { source: "form", textShown: "J'accepte", ip: "" });
    db.prepare("UPDATE mk_contacts SET record_status = 'archived' WHERE id = ?").run(c.id);
    const list = audience.createList(A, { name: "Archivés" });
    audience.addToList(A, list.id, [c.id]);
    const summary = sendingAudience.audienceSummary(A, { targetType: "list", targetId: list.id });
    assert.equal(summary.excluded.inactive_record, 1);
    assert.equal(summary.excluded.category_opted_out, 0);
  });
});
