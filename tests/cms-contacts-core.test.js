// KOLAKISA CMS — palier 15 : Contact Core (service). Base en mémoire avec les vraies migrations, deux organisations.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const core = require("../src/marketing/contactcore");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const { sendableSql } = require("../src/marketing/compliance/sendable");

let m, A, B, db;
beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B; db = m.db;
  db.prepare("INSERT INTO users (username, email) VALUES ('alice', 'alice@x.fr'), ('bob', 'bob@x.fr'), ('u3','u3@x.fr'), ('u4','u4@x.fr'), ('u5','u5@x.fr'), ('u6','u6@x.fr'), ('admin','admin@x.fr')").run(); // id 7 = utilisateur du contexte de test
  db.prepare("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Vitrine'), (2, 'Autre org')").run();
});

describe("identité : création, normalisation, doublons", () => {
  test("l'adresse est normalisée (casse, espaces) : JOHN@EXAMPLE.COM et john@example.com = une seule fiche", () => {
    const a = core.identify(A, { email: "  John@Example.COM ", first_name: "John", source: "form" });
    const b = core.identify(A, { email: "john@example.com", last_name: "Doe" });
    assert.equal(a.created, true); assert.equal(b.created, false);
    assert.equal(a.contact.id, b.contact.id);
    assert.equal(b.contact.first_name, "John"); assert.equal(b.contact.last_name, "Doe", "les champs vides sont complétés");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contacts").get().n, 1);
  });
  test("le téléphone est normalisé en E.164 et trouvable", () => {
    const { contact } = core.identify(A, { email: "t@x.fr", phone: "+243 81 234 5678" });
    assert.equal(contact.normalized_phone, "+243812345678");
    assert.equal(audience.searchContacts(A, { q: "2345678" }).total, 1);
    const bad = core.identify(A, { email: "t2@x.fr", phone: "abc" });
    assert.equal(bad.contact.normalized_phone, "", "un numéro non normalisable n'est pas inventé");
  });
  test("un contact peut exister sans compte ; le lien utilisateur est explicite et refusé si l'adresse diffère", () => {
    const solo = core.identify(A, { email: "solo@x.fr" }).contact;
    assert.equal(solo.lms_user_id, null);
    const linked = core.identify(A, { email: "alice@x.fr", userId: 1 }).contact;
    assert.equal(linked.lms_user_id, 1);
    assert.throws(() => core.identify(A, { email: "autre@x.fr", userId: 2 }), /pas la même adresse/);
    assert.throws(() => core.identify(A, { email: "bob@x.fr", userId: 999 }), /introuvable/);
    assert.throws(() => core.identify(A, { email: "bob@x.fr", userId: -1 }), /invalide/);
  });
  test("identify ne consent jamais : statut inchangé, aucune preuve de consentement", () => {
    const { contact } = core.identify(A, { email: "c@x.fr", source: "registration", userId: undefined });
    assert.equal(contact.status, "unknown");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_consents").get().n, 0);
    assert.equal(compliance.isSendable(A, contact.id).ok, false);
  });
  test("cycle de vie : étape selon l'origine, jamais rétrogradée ; étape inconnue refusée", () => {
    assert.equal(core.identify(A, { email: "l@x.fr", source: "form" }).contact.lifecycle_stage, "lead");
    assert.equal(core.identify(A, { email: "m@x.fr", source: "comment" }).contact.lifecycle_stage, "contact");
    assert.equal(core.identify(A, { email: "l@x.fr", source: "comment" }).contact.lifecycle_stage, "lead");
    assert.throws(() => core.identify(A, { email: "z@x.fr", lifecycleStage: "roi" }), /inconnue/);
    const c = core.identify(A, { email: "n@x.fr" }).contact;
    assert.equal(core.setLifecycle(A, c.id, "customer").lifecycle_stage, "customer");
    assert.throws(() => core.setLifecycle(A, c.id, "inconnu"), /inconnue/);
  });
  test("site d'origine : vérifié (un site d'une autre organisation est refusé)", () => {
    assert.equal(core.identify(A, { email: "s@x.fr", siteId: 1 }).contact.origin_site_id, 1);
    assert.throws(() => core.identify(A, { email: "s2@x.fr", siteId: 2 }), /Site introuvable/);
  });
  test("détection de doublons : même numéro = fort, même nom + entreprise = possible ; rien n'est fusionné tout seul", () => {
    core.identify(A, { email: "a1@x.fr", phone: "+33 6 12 34 56 78", first_name: "Léa", last_name: "Martin", company: "Acme" });
    core.identify(A, { email: "a2@x.fr", phone: "+33612345678", first_name: "Lea", last_name: "M", company: "Acme" });
    core.identify(A, { email: "a3@x.fr", first_name: "Léa", last_name: "Martin", company: "Acme" });
    const d = core.findDuplicates(A);
    assert.ok(d.some((g) => g.level === "strong" && g.ids.length === 2));
    assert.ok(d.some((g) => g.level === "possible" && g.ids.length === 2));
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE record_status = 'active'").get().n, 3);
    assert.deepEqual(core.findDuplicates(B), [], "isolation par organisation");
  });
});

describe("journal d'événements", () => {
  test("recordEvent : événement lié au contact, au site, à l'objet ; lecture paginée par curseur", () => {
    const c = core.identify(A, { email: "e@x.fr" }).contact;
    for (let i = 1; i <= 5; i++) core.recordEvent(A, { type: "form.submitted", contactId: c.id, siteId: 1, source: "cms", objectType: "form", objectId: i, metadata: { n: i } });
    const p1 = core.eventsOf(A, c.id, { limit: 2, type: "form.submitted" });
    assert.equal(p1.events.length, 2); assert.ok(p1.next);
    assert.equal(p1.events[0].objectId, "5"); assert.equal(p1.events[0].siteId, 1); assert.deepEqual(p1.events[0].metadata, { n: 5 });
    const p2 = core.eventsOf(A, c.id, { limit: 10, before: p1.next, type: "form.submitted" });
    assert.equal(p2.events.length, 3); assert.equal(p2.next, null);
  });
  test("validation : type, objet, site d'une autre organisation, contact d'une autre organisation, auteur, métadonnées", () => {
    const c = core.identify(A, { email: "v@x.fr" }).contact;
    assert.throws(() => core.recordEvent(A, { type: "Mauvais Type" }), /Type d'événement invalide/);
    assert.throws(() => core.recordEvent(A, { type: "a.b", objectType: "../x" }), /Type d'objet invalide/);
    assert.throws(() => core.recordEvent(A, { type: "a.b", siteId: 2 }), /Site introuvable/);
    assert.throws(() => core.recordEvent(B, { type: "a.b", contactId: c.id }), /Contact introuvable/, "IDOR inter-organisation");
    assert.throws(() => core.recordEvent(A, { type: "a.b", actorUserId: 999 }), /Auteur introuvable/);
    assert.throws(() => core.recordEvent(A, { type: "a.b", metadata: [] }), /objet/);
    assert.throws(() => core.recordEvent(A, { type: "a.b", metadata: { x: "y".repeat(20000) } }), /volumineuses/);
  });
  test("idempotence : la même clé ne crée pas deux événements", () => {
    const c = core.identify(A, { email: "i@x.fr" }).contact;
    const r1 = core.recordEvent(A, { type: "order.created", contactId: c.id, idempotencyKey: "o:1" });
    const r2 = core.recordEvent(A, { type: "order.created", contactId: c.id, idempotencyKey: "o:1" });
    assert.equal(r2.duplicate, true); assert.equal(r1.id, r2.id);
  });
  test("un événement est un fait historique : type, date, source, site, objet ne se modifient pas (contact_id oui)", () => {
    const c = core.identify(A, { email: "h@x.fr" }).contact;
    const { id } = core.recordEvent(A, { type: "page.viewed", contactId: c.id, siteId: 1, objectType: "page", objectId: "9" });
    for (const col of ["name = 'x.y'", "occurred_at = 1", "source = 'autre'", "site_id = NULL", "object_id = '1'", "actor_user_id = 1"]) {
      assert.throws(() => db.prepare(`UPDATE mk_events SET ${col} WHERE id = ?`).run(id), /fait historique/, col);
    }
    assert.doesNotThrow(() => db.prepare("UPDATE mk_events SET contact_id = NULL WHERE id = ?").run(id));
  });
  test("anonyme → identifié : les événements reçus avec une adresse avant la fiche la rejoignent à la création", () => {
    core.recordEvent(A, { type: "comment.created", email: "futur@x.fr", source: "comments" });
    assert.equal(db.prepare("SELECT contact_id FROM mk_events WHERE email = 'futur@x.fr'").get().contact_id, null);
    const r = core.identify(A, { email: "futur@x.fr", source: "form" });
    assert.equal(r.attachedEvents, 1);
    assert.ok(core.eventsOf(A, r.contact.id, { type: "comment.created" }).events.length === 1, "l'événement antérieur est sur la fiche");
  });
  test("anonyme → identifié : le visiteur suivi est relié à la fiche", () => {
    const vid = "abcdefghijklmnopqrst.1800000000000";
    db.prepare("INSERT INTO mk_web_visitors (id, organization_id, first_seen, last_seen) VALUES (?, 1, 1, 1)").run(vid);
    const c = core.identify(A, { email: "w@x.fr", visitorId: vid }).contact;
    assert.equal(db.prepare("SELECT contact_id FROM mk_web_visitors WHERE id = ?").get(vid).contact_id, c.id);
  });
});

describe("état de la fiche et envoi", () => {
  test("une fiche archivée, inactive ou fusionnée n'est jamais joignable, même abonnée", () => {
    const c = core.identify(A, { email: "s@x.fr" }).contact;
    compliance.recordConsent(A, c.id, { source: "form", textShown: "J'accepte", ip: "1.2.3.4" });
    assert.equal(compliance.isSendable(A, c.id).ok, true);
    const gate = () => { const s = sendableSql("c"); return db.prepare(`SELECT COUNT(*) n FROM mk_contacts c WHERE c.id = ? AND ${s.sql}`).get(c.id, ...s.params).n; };
    assert.equal(gate(), 1);
    for (const st of ["archived", "inactive"]) {
      core.setRecordStatus(A, c.id, st);
      assert.equal(compliance.isSendable(A, c.id).ok, false, st); assert.equal(gate(), 0, `${st} (SQL)`);
      assert.equal(require("../src/marketing/sms").isSmsSendable(A, c.id).reason, "inactive_record", `${st} (SMS)`);
    }
    core.setRecordStatus(A, c.id, "active");
    assert.equal(compliance.isSendable(A, c.id).ok, true);
    assert.throws(() => core.setRecordStatus(A, c.id, "merged"), /invalide/);
  });
  test("recherche et filtres : cycle de vie, état, site, consentement, source, dates, inactivité", () => {
    const a = core.identify(A, { email: "f1@x.fr", source: "form", siteId: 1 }).contact;
    const b = core.identify(A, { email: "f2@x.fr", source: "comment" }).contact;
    compliance.recordConsent(A, a.id, { source: "form", textShown: "J'accepte", ip: "" });
    core.setRecordStatus(A, b.id, "archived");
    const n = (c) => audience.searchContacts(A, c).total;
    assert.equal(n({ lifecycle: "lead" }), 1);
    assert.equal(n({ recordStatus: "live" }), 1);
    assert.equal(n({ recordStatus: "archived" }), 1);
    assert.equal(n({}), 2, "sans critère : toutes les fiches (compatibilité)");
    assert.equal(n({ siteId: 1 }), 1);
    assert.equal(n({ consent: "granted" }), 1); assert.equal(n({ consent: "none" }), 1);
    assert.equal(n({ source: "comment" }), 1);
    assert.equal(n({ inactiveDays: 30 }), 2);
    assert.throws(() => n({ recordStatus: "x" }), /inconnu/);
    assert.throws(() => n({ consent: "x" }), /inconnu/);
    assert.equal(audience.searchContacts(B, {}).total, 0, "isolation par organisation");
  });
  test("recherche : les jokers LIKE et l'injection ne cassent rien", () => {
    core.identify(A, { email: "100%@x.fr" });
    assert.equal(audience.searchContacts(A, { q: "%" }).total, 1);
    assert.equal(audience.searchContacts(A, { q: "'; DROP TABLE mk_contacts;--" }).total, 0);
    assert.ok(db.prepare("SELECT COUNT(*) n FROM mk_contacts").get().n >= 1);
  });
});

describe("fusion", () => {
  function pair() {
    const master = core.identify(A, { email: "m@x.fr", first_name: "Marie" }).contact;
    const source = core.identify(A, { email: "s@x.fr", last_name: "Curie", phone: "+33612345678", company: "Labo", source: "form" }).contact;
    audience.tagContact(A, master.id, "vip"); audience.tagContact(A, source.id, "webinar");
    core.recordEvent(A, { type: "form.submitted", contactId: source.id, siteId: 1 });
    compliance.recordConsent(A, source.id, { source: "form", textShown: "J'accepte", ip: "" });
    return { master, source };
  }
  test("aperçu : rien n'est écrit", () => {
    const { master, source } = pair();
    const p = core.mergePreview(A, master.id, source.id);
    assert.ok(p.fills.includes("last_name")); assert.equal(p.tagsToAdd, 1); assert.ok(p.events >= 1); assert.equal(p.consentProofs, 1);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contact_merges").get().n, 0);
  });
  test("fusion : champs, étiquettes, événements repris ; la source est conservée, jamais joignable ; alias retrouvé ; preuves conservées", () => {
    const { master, source } = pair();
    const r = core.mergeContacts(A, master.id, source.id);
    assert.equal(r.master.last_name, "Curie"); assert.equal(r.master.company, "Labo");
    assert.equal(r.master.normalized_phone, "+33612345678");
    assert.deepEqual(audience.tagsOf(A, master.id).map((t) => t.name).sort(), ["vip", "webinar"]);
    const src = audience.getContact(A, source.id);
    assert.equal(src.record_status, "merged"); assert.equal(src.merged_into_id, master.id);
    assert.equal(compliance.isSendable(A, source.id).ok, false);
    assert.equal(audience.findByEmail(A, "s@x.fr").id, master.id, "l'ancienne adresse mène au maître");
    assert.equal(core.identify(A, { email: "S@x.fr" }).created, false, "pas de nouveau doublon via l'ancienne adresse");
    assert.equal(core.eventsOf(A, master.id).events.some((e) => e.type === "form.submitted"), true);
    assert.equal(core.consentProofs(A, master.id).length, 1, "preuve de la fiche absorbée visible sur le maître");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?").get(source.id).n, 1, "preuve non déplacée ni supprimée");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contacts").get().n, 2, "aucune fiche supprimée");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contact_merges").get().n, 1);
    assert.equal(audience.searchContacts(A, { recordStatus: "live" }).total, 1);
  });
  test("le consentement du maître ne devient jamais plus permissif ; une source désinscrite rend le maître restrictif", () => {
    const { master, source } = pair();
    compliance.recordConsent(A, master.id, { source: "form", textShown: "J'accepte", ip: "" });
    db.prepare("UPDATE mk_contacts SET status = 'unsubscribed' WHERE id = ?").run(source.id);
    const r = core.mergeContacts(A, master.id, source.id);
    assert.equal(r.master.status, "unsubscribed");
    assert.equal(compliance.isSendable(A, master.id).ok, false);
    // et l'inverse : source abonnée, maître inconnu → le maître ne devient PAS abonné
    const m2 = core.identify(A, { email: "m2@x.fr" }).contact, s2 = core.identify(A, { email: "s2@x.fr" }).contact;
    compliance.recordConsent(A, s2.id, { source: "form", textShown: "J'accepte", ip: "" });
    assert.equal(core.mergeContacts(A, m2.id, s2.id).master.status, "unknown");
  });
  test("refus : même fiche, fiche déjà fusionnée, autre organisation", () => {
    const { master, source } = pair();
    assert.throws(() => core.mergeContacts(A, master.id, master.id), /deux contacts différents/);
    assert.throws(() => core.mergeContacts(B, master.id, source.id), /introuvable/);
    core.mergeContacts(A, master.id, source.id);
    assert.throws(() => core.mergeContacts(A, master.id, source.id), /déjà été fusionnée/);
    assert.throws(() => core.setRecordStatus(A, source.id, "active"), /fusionnée/);
  });
  test("effacement du maître : emporte les fiches absorbées et anonymise le journal ; l'adresse peut rester en suppression", () => {
    const { master, source } = pair();
    core.mergeContacts(A, master.id, source.id);
    assert.equal(audience.deleteContact(A, master.id, { suppress: true }), true);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contacts").get().n, 0);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contact_merges").get().n, 0);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_events WHERE email IS NOT NULL AND email IN ('s@x.fr','m@x.fr')").get().n, 0);
    assert.ok(db.prepare("SELECT 1 FROM mk_suppressions WHERE email = 's@x.fr'").get(), "l'ancienne adresse aussi");
  });
  test("effacement : les événements attachés à l'adresse seule sont anonymisés aussi", () => {
    core.recordEvent(A, { type: "comment.created", email: "orphelin@x.fr", source: "comments", metadata: { a: 1 } });
    const c = core.identify(A, { email: "orphelin@x.fr" }).contact;
    assert.equal(audience.deleteContact(A, c.id), true);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_events WHERE email = 'orphelin@x.fr'").get().n, 0);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_events WHERE name = 'comment.created' AND metadata <> '{}'").get().n, 0);
  });
});

describe("champs personnalisés étendus", () => {
  const def = (k, type, options) => audience.defineProperty(A, { key: k, label: k, type, options });
  test("url, e-mail, téléphone, choix multiple : validation et lecture", () => {
    def("site_web", "url"); def("mail_pro", "email"); def("tel_pro", "phone"); def("interets", "multiselect", ["a", "b", "c"]);
    const c = core.identify(A, { email: "p@x.fr" }).contact;
    audience.setContactProperties(A, c.id, { site_web: "https://exemple.fr/x", mail_pro: " Pro@X.FR ", tel_pro: "+243 81 234 5678", interets: ["a", "c"] });
    assert.deepEqual(audience.getContactProperties(A, c.id), { interets: ["a", "c"], mail_pro: "pro@x.fr", site_web: "https://exemple.fr/x", tel_pro: "+243812345678" });
    for (const [k, v] of [["site_web", "javascript:alert(1)"], ["site_web", "pas une url"], ["mail_pro", "x"], ["tel_pro", "12"], ["interets", ["z"]], ["interets", [1]]]) {
      assert.throws(() => audience.setContactProperties(A, c.id, { [k]: v }), /invalide/i, `${k}=${v}`);
    }
    audience.setContactProperties(A, c.id, { interets: [] });
    assert.equal("interets" in audience.getContactProperties(A, c.id), false, "liste vide = retire la valeur");
  });
  test("les types historiques fonctionnent toujours", () => {
    def("age", "number"); def("naissance", "date"); def("ok", "boolean"); def("niveau", "select", ["x", "y"]);
    const c = core.identify(A, { email: "q@x.fr" }).contact;
    audience.setContactProperties(A, c.id, { age: "32", naissance: "2000-02-29", ok: "oui", niveau: "x" });
    assert.deepEqual(audience.getContactProperties(A, c.id), { age: 32, naissance: "2000-02-29", niveau: "x", ok: true });
    assert.throws(() => def("bad", "inconnu"), /Type inconnu/);
  });
});
