// Marketing R3 (1/2) — segments : critères « Activité KOLAKISA » et « montant dépensé », usages, duplication, statistiques.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, T0 } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const segments = require("../src/marketing/segments");
const { fieldCatalog, sampleValue } = require("../src/marketing/segments/catalog");

const DAY = 86_400_000;
const PROOF = { source: "form", textShown: "Oui, je veux recevoir la newsletter" };
let m, A, B;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const mk = (email, consent = false) => {
  const { contact } = audience.upsertContact(A, { email });
  if (consent) compliance.recordConsent(A, contact.id, PROOF);
  return contact;
};
const ev = (contact, name, metadata = {}, at = T0 - DAY, org = 1) =>
  m.db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, created_at) VALUES (?, ?, 'x@ex.fr', ?, 'lms', ?, ?, ?)").run(org, name, contact.id, at, JSON.stringify(metadata), at);
const order = (contact, items, at = T0 - DAY) => ev(contact, "lms.order_completed", { totalCents: items.reduce((s, i) => s + i.priceCents, 0), items: items.map((i) => ({ courseId: i.courseId, title: i.title ?? "Formation", priceCents: i.priceCents })) }, at);
const seg = (...rules) => ({ op: "and", rules });
const emails = (def) => segments.segmentContacts(A, def, { limit: 100 }).rows.map((c) => c.email).sort();
const rule = (field, cmp, value, course) => ({ field, cmp, ...(value !== undefined && { value }), ...(course !== undefined && { course }) });

beforeEach(() => { m = freshMarketing(); A = m.A; B = m.B; });

describe("moteur : activité KOLAKISA", () => {
  test("« a eu lieu » / « n'a jamais eu lieu »", () => {
    const a = mk("a@ex.fr"), b = mk("b@ex.fr"); mk("c@ex.fr");
    ev(a, "lms.course_enrolled", { courseId: 1 }); ev(b, "lms.user_registered");
    assert.deepEqual(emails(seg(rule("event:lms.course_enrolled", "happened"))), ["a@ex.fr"]);
    assert.deepEqual(emails(seg(rule("event:lms.course_enrolled", "never"))), ["b@ex.fr", "c@ex.fr"]);
  });
  test("au moins N fois", () => {
    const a = mk("a@ex.fr"), b = mk("b@ex.fr");
    for (let i = 0; i < 3; i++) ev(a, "lms.lesson_completed", { courseId: 1, lessonId: i });
    ev(b, "lms.lesson_completed", { courseId: 1, lessonId: 9 });
    assert.deepEqual(emails(seg(rule("event:lms.lesson_completed", "at_least", 3))), ["a@ex.fr"]);
    assert.deepEqual(emails(seg(rule("event:lms.lesson_completed", "at_least", 1))), ["a@ex.fr", "b@ex.fr"]);
  });
  test("dans les N derniers jours / pas dans les N derniers jours", () => {
    const a = mk("a@ex.fr"), b = mk("b@ex.fr"), c = mk("c@ex.fr");
    ev(a, "lms.lesson_completed", {}, T0 - 2 * DAY); ev(b, "lms.lesson_completed", {}, T0 - 40 * DAY);
    assert.deepEqual(emails(seg(rule("event:lms.lesson_completed", "within_days", 7))), ["a@ex.fr"]);
    assert.deepEqual(emails(seg(rule("event:lms.lesson_completed", "not_within_days", 7))), ["b@ex.fr", "c@ex.fr"], "inclut ceux qui n'ont jamais rien fait");
    assert.equal(c.id > 0, true);
  });
  test("filtre par formation (événements simples)", () => {
    const a = mk("a@ex.fr"), b = mk("b@ex.fr");
    ev(a, "lms.course_completed", { courseId: 7 }); ev(b, "lms.course_completed", { courseId: 8 });
    assert.deepEqual(emails(seg(rule("event:lms.course_completed", "happened", undefined, 7))), ["a@ex.fr"]);
    assert.deepEqual(emails(seg(rule("event:lms.course_completed", "never", undefined, 7))), ["b@ex.fr"]);
  });
  test("filtre par formation dans une commande (une commande peut contenir plusieurs formations)", () => {
    const a = mk("a@ex.fr"), b = mk("b@ex.fr");
    order(a, [{ courseId: 1, priceCents: 1000 }, { courseId: 2, priceCents: 2000 }]); order(b, [{ courseId: 3, priceCents: 500 }]);
    assert.deepEqual(emails(seg(rule("event:lms.order_completed", "happened", undefined, 2))), ["a@ex.fr"]);
    assert.deepEqual(emails(seg(rule("event:lms.order_completed", "happened", undefined, 3))), ["b@ex.fr"]);
    assert.deepEqual(emails(seg(rule("event:lms.order_completed", "happened"))), ["a@ex.fr", "b@ex.fr"]);
  });
  test("le filtre de formation se combine avec la période et le nombre", () => {
    const a = mk("a@ex.fr");
    ev(a, "lms.lesson_completed", { courseId: 1 }, T0 - 2 * DAY); ev(a, "lms.lesson_completed", { courseId: 1 }, T0 - 3 * DAY); ev(a, "lms.lesson_completed", { courseId: 2 }, T0 - 1 * DAY);
    assert.deepEqual(emails(seg(rule("event:lms.lesson_completed", "at_least", 2, 1))), ["a@ex.fr"]);
    assert.deepEqual(emails(seg(rule("event:lms.lesson_completed", "at_least", 2, 2))), []);
    assert.deepEqual(emails(seg(rule("event:lms.lesson_completed", "within_days", 1, 2))), ["a@ex.fr"], "borne incluse : un événement d'il y a exactement 24 h est dans « 1 jour »");
  });
  test("isolation : les événements d'une autre organisation ne comptent pas", () => {
    const a = mk("a@ex.fr");
    const other = audience.upsertContact(B, { email: "a@ex.fr" }).contact;
    ev(other, "lms.course_enrolled", { courseId: 1 }, T0 - DAY, 2);
    assert.deepEqual(emails(seg(rule("event:lms.course_enrolled", "happened"))), []);
    assert.equal(a.id > 0, true);
  });
  test("se combine avec les autres critères (ET / OU / NON)", () => {
    const a = mk("a@ex.fr", true), b = mk("b@ex.fr", true); mk("c@ex.fr");
    ev(a, "lms.course_completed", { courseId: 1 }); ev(b, "lms.course_enrolled", { courseId: 1 });
    audience.tagContact(A, a.id, "vip");
    assert.deepEqual(emails({ op: "and", rules: [rule("event:lms.course_completed", "happened"), rule("tag", "has", "vip")] }), ["a@ex.fr"]);
    assert.deepEqual(emails({ op: "or", rules: [rule("event:lms.course_completed", "happened"), rule("event:lms.course_enrolled", "happened")] }), ["a@ex.fr", "b@ex.fr"]);
    assert.deepEqual(emails({ op: "and", rules: [{ op: "not", rule: rule("event:lms.course_enrolled", "happened") }, rule("status", "eq", "subscribed")] }), ["a@ex.fr"]);
  });
  test("un segment d'activité ne donne aucun droit d'envoi", () => {
    const a = mk("a@ex.fr"); ev(a, "lms.order_completed", { totalCents: 100, items: [] });
    const def = seg(rule("event:lms.order_completed", "happened"));
    assert.equal(segments.countSegment(A, def), 1);
    assert.equal(segments.countSegment(A, def, { sendableOnly: true }), 0);
  });
  test("validation : événement inconnu, valeurs et formation invalides, injection", () => {
    const bad = (r) => code(() => segments.validateDefinition(A, seg(r)));
    assert.equal(bad(rule("event:lms.inconnu", "happened")), "invalid_segment");
    assert.equal(bad(rule("event:contact.created", "happened")), "invalid_segment", "seuls les événements KOLAKISA sont proposés");
    assert.equal(bad(rule("event:lms.course_enrolled", "at_least")), "invalid_segment");
    assert.equal(bad(rule("event:lms.course_enrolled", "at_least", 0)), "invalid_segment");
    assert.equal(bad(rule("event:lms.course_enrolled", "at_least", 1.5)), "invalid_segment");
    assert.equal(bad(rule("event:lms.course_enrolled", "at_least", 100001)), "invalid_segment");
    assert.equal(bad(rule("event:lms.course_enrolled", "happened", 5)), "invalid_segment", "« happened » n'attend pas de valeur");
    assert.equal(bad(rule("event:lms.course_enrolled", "within_days", -1)), "invalid_segment");
    assert.equal(bad(rule("event:lms.course_enrolled", "happened", undefined, "1; DROP TABLE mk_events")), "invalid_segment");
    assert.equal(bad(rule("event:lms.course_enrolled", "happened", undefined, 0)), "invalid_segment");
    assert.equal(bad(rule("event:lms.user_registered", "happened", undefined, 3)), "invalid_segment", "cet événement n'a pas de formation");
    assert.equal(bad(rule("email", "eq", "a@ex.fr", 3)), "invalid_segment", "« course » n'existe que pour les événements de formation");
    assert.equal(code(() => segments.countSegment(A, seg(rule("event:lms.course_enrolled", "happened", undefined, 3)))), null);
  });
});

describe("moteur : montant dépensé", () => {
  beforeEach(() => {
    const a = mk("a@ex.fr"), b = mk("b@ex.fr"), c = mk("c@ex.fr"); mk("d@ex.fr");
    order(a, [{ courseId: 1, priceCents: 4900 }]); order(a, [{ courseId: 2, priceCents: 2000 }]); // 69 €
    order(b, [{ courseId: 1, priceCents: 4900 }]); // 49 €
    order(c, [{ courseId: 1, priceCents: 0 }]); // gratuit : 0 €
  });
  test("comparaisons en euros", () => {
    assert.deepEqual(emails(seg(rule("lms_spent", "gt", 50))), ["a@ex.fr"]);
    assert.deepEqual(emails(seg(rule("lms_spent", "gte", 49))), ["a@ex.fr", "b@ex.fr"]);
    assert.deepEqual(emails(seg(rule("lms_spent", "lt", 50))).includes("b@ex.fr"), true);
    assert.deepEqual(emails(seg(rule("lms_spent", "between", [40, 60]))), ["b@ex.fr"]);
  });
  test("décimales gérées sans erreur d'arrondi", () => {
    assert.deepEqual(emails(seg(rule("lms_spent", "gte", 49.0))), ["a@ex.fr", "b@ex.fr"]);
    assert.deepEqual(emails(seg(rule("lms_spent", "gt", 48.99))), ["a@ex.fr", "b@ex.fr"]);
    assert.deepEqual(emails(seg(rule("lms_spent", "gt", "48,99"))), ["a@ex.fr", "b@ex.fr"]);
  });
  test("« n'a jamais acheté » et « a déjà acheté » (une commande gratuite est un achat)", () => {
    assert.deepEqual(emails(seg(rule("lms_spent", "not_empty"))), ["a@ex.fr", "b@ex.fr", "c@ex.fr"]);
    assert.deepEqual(emails(seg(rule("lms_spent", "is_empty"))), ["d@ex.fr"]);
  });
  test("validation : montant négatif, intervalle inversé, non numérique", () => {
    const bad = (r) => code(() => segments.validateDefinition(A, seg(r)));
    assert.equal(bad(rule("lms_spent", "gt", -1)), "invalid_segment");
    assert.equal(bad(rule("lms_spent", "between", [10, 5])), "invalid_segment");
    assert.equal(bad(rule("lms_spent", "gt", "beaucoup")), "invalid_segment");
    assert.equal(bad(rule("lms_spent", "eq", 5)), "invalid_segment", "comparateur non proposé");
  });
  test("isolation entre organisations", () => {
    const other = audience.upsertContact(B, { email: "a@ex.fr" }).contact;
    ev(other, "lms.order_completed", { totalCents: 99900, items: [] }, T0, 2);
    assert.equal(segments.countSegment(A, seg(rule("lms_spent", "gt", 500))), 0);
  });
});

describe("catalogue : activité KOLAKISA", () => {
  test("champs proposés, libellés français, formations issues des événements (sans lire le LMS)", () => {
    const a = mk("a@ex.fr");
    ev(a, "lms.course_enrolled", { courseId: 1, title: "Excel" }, T0 - 5 * DAY);
    ev(a, "lms.course_enrolled", { courseId: 1, title: "Excel avancé" }, T0 - 1 * DAY);
    order(a, [{ courseId: 2, title: "Python", priceCents: 100 }]);
    const cat = Object.fromEntries(fieldCatalog(A).map((f) => [f.field, f]));
    for (const f of ["event:lms.order_completed", "event:lms.course_enrolled", "event:lms.lesson_completed", "event:lms.course_completed", "event:lms.review_posted", "event:lms.favorite_added", "event:lms.user_registered", "lms_spent"]) assert.ok(cat[f], f);
    assert.equal(cat["event:lms.course_completed"].group, "Activité KOLAKISA");
    assert.equal(cat["lms_spent"].group, "Achats");
    assert.equal(cat["event:lms.user_registered"].supportsCourse, false);
    assert.equal(cat["event:lms.course_enrolled"].supportsCourse, true);
    assert.deepEqual(cat["event:lms.course_enrolled"].courses, [{ id: 1, title: "Excel avancé" }, { id: 2, title: "Python" }], "titre le plus récent, formations d'une commande incluses");
    assert.match(cat["event:lms.course_enrolled"].note, /depuis l'activation/);
  });
  test("aucune formation d'une autre organisation dans le catalogue", () => {
    const other = audience.upsertContact(B, { email: "o@ex.fr" }).contact;
    ev(other, "lms.course_enrolled", { courseId: 99, title: "Secrète" }, T0, 2);
    assert.ok(!JSON.stringify(fieldCatalog(A)).includes("Secrète"));
  });
  test("INVARIANT : chaque combinaison proposée est acceptée (y compris avec une formation)", () => {
    const a = mk("a@ex.fr"); ev(a, "lms.course_completed", { courseId: 1, title: "Excel" });
    let n = 0;
    for (const f of fieldCatalog(A).filter((x) => x.field.startsWith("event:") || x.field === "lms_spent")) {
      for (const c of f.cmps) {
        const base = { field: f.field, cmp: c.cmp, ...(c.value === "none" ? {} : { value: sampleValue(f, c, A) }) };
        assert.doesNotThrow(() => segments.validateDefinition(A, seg(base)), `${f.field} ${c.cmp}`);
        segments.countSegment(A, seg(base));
        if (f.supportsCourse && f.courses.length) { assert.doesNotThrow(() => segments.validateDefinition(A, seg({ ...base, course: f.courses[0].id }))); n++; }
        n++;
      }
    }
    assert.ok(n >= 25, `seulement ${n} combinaisons`);
  });
  test("libellés de comparateurs en français, sans identifiant technique", () => {
    for (const f of fieldCatalog(A).filter((x) => x.field.startsWith("event:") || x.field === "lms_spent")) for (const c of f.cmps) assert.ok(c.label && !c.label.includes("_"), `${f.field}.${c.cmp}`);
  });
});

describe("segments enregistrés : usages, duplication, statistiques", () => {
  let list, tpl;
  beforeEach(() => {
    list = audience.createList(A, { name: "L" });
    tpl = Number(m.db.prepare("INSERT INTO mk_templates (organization_id, name, kind, subject, blocks) VALUES (1, 'T', 'marketing', 'S', '[]')").run().lastInsertRowid);
  });
  const campaign = (name, segId, status = "draft") => Number(m.db.prepare("INSERT INTO mk_campaigns (organization_id, name, template_id, target_type, target_id, status) VALUES (1, ?, ?, 'segment', ?, ?)").run(name, tpl, segId, status).lastInsertRowid);

  test("usages : les campagnes qui ciblent ce segment", () => {
    const s = segments.createSegment(A, { name: "S", definition: seg(rule("country", "eq", "FR")) });
    const other = segments.createSegment(A, { name: "T", definition: seg(rule("country", "eq", "TG")) });
    const c1 = campaign("Une", s.id, "sent"); campaign("Deux", s.id); campaign("Autre", other.id);
    const usage = segments.segmentUsage(A, s.id);
    assert.deepEqual(usage.map((u) => u.name).sort(), ["Deux", "Une"]);
    assert.equal(usage.find((u) => u.id === c1).status, "sent");
    assert.deepEqual(segments.segmentUsage(A, 99999), []);
  });
  test("les campagnes des scénarios (kind « automation ») ne comptent pas comme usage", () => {
    const s = segments.createSegment(A, { name: "S", definition: seg(rule("country", "eq", "FR")) });
    m.db.prepare("INSERT INTO mk_campaigns (organization_id, name, template_id, target_type, target_id, kind) VALUES (1, 'sys', ?, 'segment', ?, 'automation')").run(tpl, s.id);
    assert.deepEqual(segments.segmentUsage(A, s.id), []);
  });
  test("duplication : « Copie de … », même définition, noms uniques", () => {
    const s = segments.createSegment(A, { name: "Élèves actifs", description: "d", definition: seg(rule("country", "eq", "FR")) });
    const c1 = segments.duplicateSegment(A, s.id);
    assert.equal(c1.name, "Copie de Élèves actifs");
    assert.deepEqual(c1.definition, s.definition);
    assert.equal(c1.description, "d");
    assert.equal(segments.duplicateSegment(A, s.id).name, "Copie de Élèves actifs (2)");
    assert.equal(segments.duplicateSegment(A, s.id).name, "Copie de Élèves actifs (3)");
    assert.equal(code(() => segments.duplicateSegment(A, 99999)), "not_found");
    assert.equal(code(() => segments.duplicateSegment(B, s.id)), "not_found", "autre organisation");
  });
  test("duplication : nom trop long tronqué proprement (100 caractères au plus)", () => {
    const s = segments.createSegment(A, { name: "x".repeat(100), definition: seg(rule("country", "eq", "FR")) });
    assert.ok(segments.duplicateSegment(A, s.id).name.length <= 100);
  });
  test("vue d'ensemble : effectif, joignables, part de l'audience, usages", () => {
    mk("a@ex.fr", true); mk("b@ex.fr"); mk("c@ex.fr", true);
    m.db.prepare("UPDATE mk_contacts SET country = 'FR'").run();
    const s = segments.createSegment(A, { name: "FR", definition: seg(rule("country", "eq", "FR")) });
    campaign("Camp", s.id);
    const [o] = segments.segmentOverview(A);
    assert.deepEqual([o.name, o.count, o.sendable, o.usedBy, o.broken], ["FR", 3, 2, 1, null]);
    assert.equal(o.sharePercent, 100);
  });
  test("vue d'ensemble : un segment cassé est signalé sans faire échouer les autres", () => {
    segments.createSegment(A, { name: "Bon", definition: seg(rule("country", "eq", "FR")) });
    const bad = segments.createSegment(A, { name: "Cassé", definition: seg(rule("country", "eq", "TG")) });
    m.db.prepare("UPDATE mk_segments SET definition = ? WHERE id = ?").run(JSON.stringify({ op: "and", rules: [] }), bad.id);
    const rows = segments.segmentOverview(A);
    assert.equal(rows.length, 2);
    assert.ok(rows.find((r) => r.name === "Cassé").broken);
    assert.equal(rows.find((r) => r.name === "Bon").broken, null);
  });
  test("vue d'ensemble : audience vide, pas de division par zéro", () => {
    segments.createSegment(A, { name: "Vide", definition: seg(rule("country", "eq", "FR")) });
    assert.equal(segments.segmentOverview(A)[0].sharePercent, 0);
  });
});
