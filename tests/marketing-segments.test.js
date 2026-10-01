// Marketing M1c — moteur de segments : grammaire fermée AND/OR/NOT compilée en SQL paramétré.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const segments = require("../src/marketing/segments");

let m, A, B;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const emails = (ctx, def, opts) => segments.segmentContacts(ctx, def, { limit: 200, ...opts }).rows.map((r) => r.email).sort();
const and = (...rules) => ({ op: "and", rules });
const or = (...rules) => ({ op: "or", rules });
const not = (rule) => ({ op: "not", rule });
const r = (field, cmp, value) => ({ field, cmp, ...(value === undefined ? {} : { value }) });
const add = (ctx, email, extra = {}) => audience.upsertContact(ctx, { email, ...extra }).contact;

beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B;
  // « now » du contexte = T0 (2027-01-15 08:00 UTC) : les dates relatives sont déterministes
  add(A, "marie@ex.fr", { first_name: "Marie", last_name: "Dupont", country: "FR", company: "Acme" });
  add(A, "jean@ex.fr", { first_name: "Jean", last_name: "Martin", country: "TG" });
  add(A, "zoe@autre.org", { first_name: "Zoé", country: "FR" });
  const set = (email, col, val) => m.db.prepare(`UPDATE mk_contacts SET ${col} = ? WHERE email = ?`).run(val, email);
  set("marie@ex.fr", "created_at", "2027-01-10 10:00:00");
  set("jean@ex.fr", "created_at", "2026-06-01 10:00:00");
  set("zoe@autre.org", "created_at", "2027-01-14 23:00:00");
  set("marie@ex.fr", "last_open_at", "2027-01-12 09:00:00");
});

describe("règles sur les champs standard", () => {
  test("égalité (insensible à la casse), différent, contient, commence/finit par, dans une liste, vide", () => {
    assert.deepEqual(emails(A, and(r("country", "eq", "fr"))), ["marie@ex.fr", "zoe@autre.org"]);
    assert.deepEqual(emails(A, and(r("country", "neq", "FR"))), ["jean@ex.fr"]);
    assert.deepEqual(emails(A, and(r("email", "contains", "@ex."))), ["jean@ex.fr", "marie@ex.fr"]);
    assert.deepEqual(emails(A, and(r("email", "not_contains", "@ex."))), ["zoe@autre.org"]);
    assert.deepEqual(emails(A, and(r("first_name", "starts_with", "ma"))), ["marie@ex.fr"]);
    assert.deepEqual(emails(A, and(r("email", "ends_with", ".org"))), ["zoe@autre.org"]);
    assert.deepEqual(emails(A, and(r("country", "in", ["TG", "BJ"]))), ["jean@ex.fr"]);
    assert.deepEqual(emails(A, and(r("country", "not_in", ["TG"]))), ["marie@ex.fr", "zoe@autre.org"]);
    assert.deepEqual(emails(A, and(r("company", "is_empty"))), ["jean@ex.fr", "zoe@autre.org"]);
    assert.deepEqual(emails(A, and(r("company", "not_empty"))), ["marie@ex.fr"]);
  });
  test("les jokers LIKE saisis par l'utilisateur sont neutralisés (« % » et « _ » sont des caractères)", () => {
    add(A, "100%@ex.fr");
    assert.deepEqual(emails(A, and(r("email", "contains", "%"))), ["100%@ex.fr"]);
    assert.deepEqual(emails(A, and(r("email", "contains", "_"))), []);
  });
  test("statut", () => {
    const c = audience.findByEmail(A, "marie@ex.fr");
    compliance.recordConsent(A, c.id, { source: "form", textShown: "J'accepte" });
    assert.deepEqual(emails(A, and(r("status", "eq", "subscribed"))), ["marie@ex.fr"]);
    assert.deepEqual(emails(A, and(r("status", "in", ["unknown", "bounced"]))).length, 2);
    assert.equal(code(() => segments.validateDefinition(A, and(r("status", "eq", "inventé")))), "invalid_segment");
  });
  test("compte lié à un compte du LMS", () => {
    audience.updateContact(A, audience.findByEmail(A, "jean@ex.fr").id, { lms_user_id: 5 });
    assert.deepEqual(emails(A, and(r("lms_user_id", "not_empty"))), ["jean@ex.fr"]);
    assert.equal(emails(A, and(r("lms_user_id", "is_empty"))).length, 2);
  });
});

describe("règles de date", () => {
  test("avant / après / le jour même (comparaison sur la date)", () => {
    assert.deepEqual(emails(A, and(r("created_at", "before", "2027-01-01"))), ["jean@ex.fr"]);
    assert.deepEqual(emails(A, and(r("created_at", "after", "2027-01-10"))), ["zoe@autre.org"]);
    assert.deepEqual(emails(A, and(r("created_at", "on", "2027-01-10"))), ["marie@ex.fr"]);
  });
  test("dans les N derniers jours / il y a plus de N jours (par rapport à « maintenant » du contexte)", () => {
    assert.deepEqual(emails(A, and(r("created_at", "within_days", 7))), ["marie@ex.fr", "zoe@autre.org"]);
    assert.deepEqual(emails(A, and(r("created_at", "older_than_days", 30))), ["jean@ex.fr"]);
  });
  test("jamais ouvert / a déjà ouvert ; « NON ouvert récemment » inclut ceux qui n'ont jamais ouvert", () => {
    assert.deepEqual(emails(A, and(r("last_open_at", "is_empty"))), ["jean@ex.fr", "zoe@autre.org"]);
    assert.deepEqual(emails(A, and(r("last_open_at", "not_empty"))), ["marie@ex.fr"]);
    assert.deepEqual(emails(A, and(not(r("last_open_at", "within_days", 30)))), ["jean@ex.fr", "zoe@autre.org"]);
  });
  test("format de date invalide ou inexistante refusé", () => {
    for (const v of ["2027-02-30", "hier", "01/01/2027", 5, null]) assert.equal(code(() => segments.validateDefinition(A, and(r("created_at", "before", v)))), "invalid_segment", String(v));
  });
});

describe("étiquettes et listes", () => {
  test("a l'étiquette / n'a pas l'étiquette (par nom, par identifiant)", () => {
    audience.tagContact(A, audience.findByEmail(A, "marie@ex.fr").id, "VIP");
    const tag = audience.listTags(A)[0];
    assert.deepEqual(emails(A, and(r("tag", "has", "vip"))), ["marie@ex.fr"]);
    assert.deepEqual(emails(A, and(r("tag", "has", tag.id))), ["marie@ex.fr"]);
    assert.deepEqual(emails(A, and(r("tag", "not_has", "VIP"))), ["jean@ex.fr", "zoe@autre.org"]);
    assert.deepEqual(emails(A, and(r("tag", "has", "inexistante"))), []);
  });
  test("dans la liste / hors de la liste", () => {
    const l = audience.createList(A, { name: "Newsletter" });
    audience.addToList(A, l.id, [audience.findByEmail(A, "jean@ex.fr").id]);
    assert.deepEqual(emails(A, and(r("list", "in_list", l.id))), ["jean@ex.fr"]);
    assert.deepEqual(emails(A, and(r("list", "in_list", "newsletter"))), ["jean@ex.fr"]);
    assert.deepEqual(emails(A, and(r("list", "not_in_list", l.id))), ["marie@ex.fr", "zoe@autre.org"]);
  });
  test("une liste ou une étiquette d'une AUTRE organisation ne correspond à rien", () => {
    const lb = audience.createList(B, { name: "B" });
    audience.addToList(B, lb.id, [add(B, "marie@ex.fr").id]);
    assert.deepEqual(emails(A, and(r("list", "in_list", lb.id))), []);
    assert.deepEqual(emails(A, and(r("list", "not_in_list", lb.id))).length, 3);
  });
});

describe("propriétés personnalisées", () => {
  beforeEach(() => {
    for (const [key, type, options] of [["age", "number"], ["ville", "text"], ["niveau", "select", ["débutant", "confirmé"]], ["etudiant", "boolean"], ["naissance", "date"]]) {
      audience.defineProperty(A, { key, label: key, type, options });
    }
    const id = (e) => audience.findByEmail(A, e).id;
    audience.setContactProperties(A, id("marie@ex.fr"), { age: 34, ville: "Lomé", niveau: "confirmé", etudiant: "non", naissance: "1990-05-01" });
    audience.setContactProperties(A, id("jean@ex.fr"), { age: 19, ville: "Kara", niveau: "débutant", etudiant: "oui", naissance: "2007-03-10" });
  });
  test("nombre : égal, plus grand, entre…", () => {
    assert.deepEqual(emails(A, and(r("property:age", "gt", 20))), ["marie@ex.fr"]);
    assert.deepEqual(emails(A, and(r("property:age", "lte", 19))), ["jean@ex.fr"]);
    assert.deepEqual(emails(A, and(r("property:age", "between", [18, 40]))), ["jean@ex.fr", "marie@ex.fr"]);
    assert.deepEqual(emails(A, and(r("property:age", "eq", 34))), ["marie@ex.fr"]);
  });
  test("texte et choix : contient, égal, dans", () => {
    assert.deepEqual(emails(A, and(r("property:ville", "contains", "om"))), ["marie@ex.fr"]);
    assert.deepEqual(emails(A, and(r("property:niveau", "eq", "débutant"))), ["jean@ex.fr"]);
    assert.deepEqual(emails(A, and(r("property:niveau", "in", ["débutant", "confirmé"]))), ["jean@ex.fr", "marie@ex.fr"]);
  });
  test("booléen et date", () => {
    assert.deepEqual(emails(A, and(r("property:etudiant", "is_true"))), ["jean@ex.fr"]);
    assert.deepEqual(emails(A, and(r("property:etudiant", "is_false"))), ["marie@ex.fr"]);
    assert.deepEqual(emails(A, and(r("property:naissance", "before", "2000-01-01"))), ["marie@ex.fr"]);
  });
  test("vide / renseigné ; un négatif inclut les contacts SANS valeur", () => {
    assert.deepEqual(emails(A, and(r("property:age", "is_empty"))), ["zoe@autre.org"]);
    assert.deepEqual(emails(A, and(r("property:age", "not_empty"))), ["jean@ex.fr", "marie@ex.fr"]);
    assert.deepEqual(emails(A, and(r("property:niveau", "neq", "débutant"))), ["marie@ex.fr", "zoe@autre.org"]);
  });
  test("propriété inconnue, ou comparateur incompatible avec le type : refusés", () => {
    assert.equal(code(() => segments.validateDefinition(A, and(r("property:zzz", "eq", "x")))), "invalid_segment");
    assert.equal(code(() => segments.validateDefinition(A, and(r("property:age", "contains", "3")))), "invalid_segment");
    assert.equal(code(() => segments.validateDefinition(A, and(r("property:age", "gt", "abc")))), "invalid_segment");
    assert.equal(code(() => segments.validateDefinition(A, and(r("property:niveau", "eq", "inconnu")))), "invalid_segment");
    assert.equal(code(() => segments.validateDefinition(A, and(r("property:age", "between", [1])))), "invalid_segment");
  });
});

describe("logique AND / OR / NOT", () => {
  test("ET, OU, NON et imbrications", () => {
    assert.deepEqual(emails(A, and(r("country", "eq", "FR"), r("company", "not_empty"))), ["marie@ex.fr"]);
    assert.deepEqual(emails(A, or(r("country", "eq", "TG"), r("company", "not_empty"))), ["jean@ex.fr", "marie@ex.fr"]);
    assert.deepEqual(emails(A, and(not(r("country", "eq", "FR")))), ["jean@ex.fr"]);
    assert.deepEqual(emails(A, and(r("country", "eq", "FR"), not(or(r("company", "not_empty"), r("first_name", "eq", "Zoé"))))), []);
    assert.deepEqual(emails(A, or(and(r("country", "eq", "FR"), r("company", "is_empty")), r("first_name", "eq", "Jean"))), ["jean@ex.fr", "zoe@autre.org"]);
  });
  test("NON sur un groupe entier (De Morgan)", () => {
    const g = and(r("country", "eq", "FR"), r("company", "not_empty"));
    assert.deepEqual(emails(A, and(not(g))), ["jean@ex.fr", "zoe@autre.org"]);
  });
});

describe("validation : la grammaire est fermée", () => {
  const bad = (def, pattern) => {
    let error;
    try { segments.validateDefinition(A, def); } catch (e) { error = e; }
    assert.ok(error, JSON.stringify(def));
    assert.equal(error.code, "invalid_segment");
    if (pattern) assert.match(error.message, pattern);
  };
  test("groupe vide, racine non groupe, opérateur ou champ ou comparateur inconnus", () => {
    bad(and(), /vide/i);
    bad(or(), /vide/i);
    bad(r("country", "eq", "FR"), /groupe/i);
    bad({ op: "xor", rules: [r("country", "eq", "x")] }, /opérateur/i);
    bad(and(r("mot_de_passe", "eq", "x")), /champ/i);
    bad(and(r("country", "regex", "x")), /comparateur/i);
    bad(and(r("created_at", "contains", "x")), /comparateur/i);
    bad(and({ field: "country", cmp: "eq", value: "FR", extra: 1 }), /inattendu|non pris/i);
    bad({ op: "not", rule: [] }, /règle/i);
    bad({ op: "not", rules: [r("country", "eq", "x")] }, /inattendu|règle/i);
    bad(null); bad("texte"); bad([]);
  });
  test("valeurs de mauvais type ou trop grandes", () => {
    bad(and(r("country", "eq", { a: 1 })), /valeur/i);
    bad(and(r("country", "in", "FR")), /liste/i);
    bad(and(r("country", "in", [])), /liste/i);
    bad(and(r("country", "in", Array(101).fill("x"))), /liste/i);
    bad(and(r("country", "eq", "x".repeat(201))), /trop long/i);
    bad(and(r("created_at", "within_days", -1)), /jours/i);
    bad(and(r("created_at", "within_days", 1.5)), /jours/i);
  });
  test("profondeur et nombre de règles limités", () => {
    let deep = r("country", "eq", "FR");
    for (let i = 0; i < 8; i++) deep = and(deep);
    bad(deep, /profondeur/i);
    bad(and(...Array(101).fill(r("country", "eq", "FR"))), /trop de règles/i);
  });
  test("le message situe l'erreur (numéro de règle)", () => {
    bad(and(r("country", "eq", "FR"), or(r("first_name", "eq", "x"), r("nimporte", "eq", "x"))), /règle 2.*règle 2/i);
  });
  test("injection SQL : noms de champs jamais concaténés, valeurs toujours liées", () => {
    bad(and(r("country; DROP TABLE mk_contacts; --", "eq", "x")));
    bad(and(r("property:x' OR '1'='1", "eq", "x")));
    assert.deepEqual(emails(A, and(r("first_name", "eq", "x' OR '1'='1"))), []);
    assert.deepEqual(emails(A, and(r("email", "contains", "'; DROP TABLE mk_contacts; --"))), []);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_contacts").get().n, 3);
  });
});

describe("évaluation", () => {
  test("isolation : un segment n'atteint que les contacts de son organisation", () => {
    add(B, "b@autre.fr", { country: "FR" });
    assert.deepEqual(emails(B, and(r("country", "eq", "FR"))), ["b@autre.fr"]);
    assert.equal(segments.countSegment(A, and(r("country", "eq", "FR"))), 2);
  });
  test("comptage, aperçu borné, pagination par curseur", () => {
    const def = and(r("country", "in", ["FR", "TG"]));
    assert.equal(segments.countSegment(A, def), 3);
    assert.equal(segments.previewSegment(A, def, { limit: 2 }).rows.length, 2);
    assert.equal(code(() => segments.previewSegment(A, def, { limit: 500 })), "invalid_field");
    const p1 = segments.segmentContacts(A, def, { limit: 2 });
    const p2 = segments.segmentContacts(A, def, { limit: 2, afterId: p1.nextAfterId });
    assert.deepEqual([p1.rows.length, p2.rows.length, p2.nextAfterId], [2, 1, null]);
  });
  test("« sendableOnly » : abonnés et non supprimés uniquement", () => {
    const marie = audience.findByEmail(A, "marie@ex.fr");
    const jean = audience.findByEmail(A, "jean@ex.fr");
    compliance.recordConsent(A, marie.id, { source: "form", textShown: "J'accepte" });
    compliance.recordConsent(A, jean.id, { source: "form", textShown: "J'accepte" });
    compliance.addSuppression(A, { email: "jean@ex.fr", reason: "bounced" });
    const def = and(r("country", "in", ["FR", "TG"]));
    assert.equal(segments.countSegment(A, def), 3);
    assert.equal(segments.countSegment(A, def, { sendableOnly: true }), 1);
  });
  test("appartenance d'un contact précis (pour les automatisations)", () => {
    const def = and(r("country", "eq", "TG"));
    assert.equal(segments.matches(A, def, audience.findByEmail(A, "jean@ex.fr").id), true);
    assert.equal(segments.matches(A, def, audience.findByEmail(A, "marie@ex.fr").id), false);
  });
  test("20 000 contacts : un segment combiné répond vite", () => {
    const ins = m.db.prepare("INSERT INTO mk_contacts (organization_id, email, country, status) VALUES (1, ?, ?, ?)");
    m.db.exec("BEGIN");
    for (let i = 0; i < 20000; i++) ins.run(`user${i}@perf.test`, i % 3 ? "FR" : "TG", i % 5 ? "subscribed" : "unknown");
    m.db.exec("COMMIT");
    const t = Date.now();
    const n = segments.countSegment(A, and(r("country", "eq", "FR"), or(r("status", "eq", "subscribed"), r("email", "starts_with", "user1")), not(r("tag", "has", "x"))));
    assert.ok(n > 10000);
    assert.ok(Date.now() - t < 1500, `trop lent : ${Date.now() - t} ms`);
  });
});

describe("segments enregistrés", () => {
  test("création, lecture, modification, liste, suppression ; nom unique ; audit", () => {
    const def = and(r("country", "eq", "FR"));
    const s = segments.createSegment(A, { name: "Français", description: "Tous les FR", definition: def });
    assert.deepEqual(segments.getSegment(A, s.id).definition, def);
    assert.equal(code(() => segments.createSegment(A, { name: "français", definition: def })), "duplicate");
    const upd = segments.updateSegment(A, s.id, { name: "FR", definition: and(r("country", "eq", "TG")) });
    assert.equal(upd.name, "FR");
    assert.equal(segments.listSegments(A).length, 1);
    assert.equal(segments.evaluateSegment(A, s.id).rows.length, 1);
    assert.equal(segments.deleteSegment(A, s.id), true);
    assert.equal(segments.getSegment(A, s.id), null);
    const actions = m.db.prepare("SELECT action FROM mk_audit_logs WHERE resource_type = 'segment' ORDER BY id").all().map((x) => x.action);
    assert.deepEqual(actions, ["segment.created", "segment.updated", "segment.deleted"]);
  });
  test("une définition invalide n'est jamais enregistrée", () => {
    assert.equal(code(() => segments.createSegment(A, { name: "X", definition: and() })), "invalid_segment");
    assert.equal(code(() => segments.createSegment(A, { name: "", definition: and(r("country", "eq", "FR")) })), "invalid_field");
    assert.equal(segments.listSegments(A).length, 0);
  });
  test("isolation : un segment d'une autre organisation est introuvable", () => {
    const s = segments.createSegment(A, { name: "S", definition: and(r("country", "eq", "FR")) });
    assert.equal(segments.getSegment(B, s.id), null);
    assert.equal(code(() => segments.evaluateSegment(B, s.id)), "not_found");
    assert.equal(segments.deleteSegment(B, s.id), false);
    assert.equal(code(() => segments.updateSegment(B, s.id, { name: "pirate" })), "not_found");
  });
  test("propriété supprimée après coup : l'évaluation échoue proprement (pas de résultat faux)", () => {
    audience.defineProperty(A, { key: "ville", label: "Ville", type: "text" });
    const s = segments.createSegment(A, { name: "S", definition: and(r("property:ville", "eq", "Lomé")) });
    m.db.exec("DELETE FROM mk_property_defs");
    assert.equal(code(() => segments.evaluateSegment(A, s.id)), "invalid_segment");
  });
});
