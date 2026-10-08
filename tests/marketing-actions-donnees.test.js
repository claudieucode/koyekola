// Actions de scénario sur les données du contact : « Copier un champ » (avec nettoyage), « Définir une date » (aujourd'hui ou champ
// date, décalage, fuseau) et « Calculer un nombre » : validation, valeurs réellement écrites, types respectés, champ vide, erreurs
// notées au journal sans casser le scénario, exécution de bout en bout par le moteur.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const auto = require("../src/marketing/automations");
const registry = require("../src/marketing/automations/actions");
const graph = require("../src/marketing/automations/graph");
const { createProvider } = require("../src/marketing/sending/providers");

let m, A, provider;
const iso = (s) => Date.parse(s);
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const contact = (email, fields = {}, tz) => { const c = audience.upsertContact(A, { email, ...fields }).contact; if (tz) m.db.prepare("UPDATE mk_contacts SET timezone = ? WHERE id = ?").run(tz, c.id); return c; };
const make = (steps) => auto.createAutomation(A, { name: `S${Math.random()}`, kind: "marketing", triggerEvent: "lms.user_registered", steps });
const exec = (type, c, step, now = "2026-10-08T06:00:00Z") => registry.getAction(type).execute({ ctx: A, step: { type, ...step }, contact: c, now: iso(now) });
const props = (c) => audience.getContactProperties(A, c.id);
const field = (c, f) => audience.getContact(A, c.id)[f];

beforeEach(() => {
  m = freshMarketing(); A = m.A; provider = createProvider({ provider: "console" }, { log: quiet });
  audience.defineProperty(A, { key: "niveau", label: "Niveau", type: "text" });
  audience.defineProperty(A, { key: "rentree", label: "Rentrée", type: "date" });
  audience.defineProperty(A, { key: "relance", label: "Relance", type: "date" });
  audience.defineProperty(A, { key: "solde", label: "Solde", type: "number" });
});

describe("validation", () => {
  test("copier : source et destination existantes, jamais l'e-mail en destination, nettoyage connu ; formes normalisées", () => {
    assert.deepEqual(make([{ type: "copy_field", from: "first_name", to: "property:niveau", junk: 1 }]).steps, [{ type: "copy_field", from: "first_name", to: "property:niveau", transform: "none" }]);
    const bad = (over) => code(() => make([{ type: "copy_field", from: "first_name", to: "company", ...over }]));
    assert.equal(bad({ to: "email" }), "invalid_automation", "l'e-mail ne se modifie pas");
    assert.equal(bad({ to: "status" }), "invalid_automation");
    assert.equal(bad({ from: "lms_user_id" }), "invalid_automation");
    assert.equal(bad({ to: "first_name" }), "invalid_automation", "source = destination");
    assert.equal(bad({ to: "property:absente" }), "invalid_automation");
    assert.equal(bad({ from: "property:Bad Key" }), "invalid_automation");
    assert.equal(bad({ transform: "reverse" }), "invalid_automation");
    assert.equal(code(() => make([{ type: "copy_field", from: "email", to: "property:niveau" }])), null, "l'e-mail peut être LU");
  });
  test("définir une date : champ date obligatoire (jamais un champ texte), départ, décalage, fuseau", () => {
    assert.deepEqual(make([{ type: "set_date", property: "property:relance", offsetDays: 7 }]).steps, [{ type: "set_date", property: "property:relance", base: "today", offsetDays: 7, zone: "contact" }]);
    const bad = (over) => code(() => make([{ type: "set_date", property: "property:relance", ...over }]));
    assert.equal(bad({ property: "property:niveau" }), "invalid_automation", "texte");
    assert.equal(bad({ property: "property:solde" }), "invalid_automation", "nombre");
    assert.equal(bad({ base: "hier" }), "invalid_automation");
    assert.equal(bad({ base: "property" }), "invalid_automation", "champ de départ manquant");
    assert.equal(bad({ base: "property", baseProperty: "property:niveau" }), "invalid_automation");
    assert.equal(bad({ offsetDays: 4000 }), "invalid_automation");
    assert.equal(bad({ offsetDays: 1.5 }), "invalid_automation");
    assert.equal(bad({ zone: "mars" }), "invalid_automation");
  });
  test("calculer : champ nombre, opération connue, valeur finie et bornée", () => {
    assert.deepEqual(make([{ type: "calculate", property: "property:solde", op: "add", value: 5, junk: 1 }]).steps, [{ type: "calculate", property: "property:solde", op: "add", value: 5 }]);
    const bad = (over) => code(() => make([{ type: "calculate", property: "property:solde", op: "add", value: 1, ...over }]));
    assert.equal(bad({ property: "property:niveau" }), "invalid_automation");
    assert.equal(bad({ op: "diviser" }), "invalid_automation");
    assert.equal(bad({ value: "5" }), "invalid_automation");
    assert.equal(bad({ value: Infinity }), "invalid_automation");
    assert.equal(bad({ value: 2e9 }), "invalid_automation");
    assert.equal(bad({ value: undefined }), "invalid_automation");
  });
});

describe("copier un champ", () => {
  test("copie vers un champ du contact ou une propriété, avec nettoyage", () => {
    const c = contact("copie@ex.fr", { first_name: "  jean-pierre   DUPONT ", phone: "Tél : 06 12-34.56 78 (soir)" });
    exec("copy_field", c, { from: "first_name", to: "company", transform: "capitalize" });
    assert.equal(field(c, "company"), "Jean-Pierre Dupont");
    exec("copy_field", c, { from: "first_name", to: "property:niveau", transform: "trim" });
    assert.equal(props(c).niveau, "jean-pierre DUPONT");
    exec("copy_field", c, { from: "phone", to: "country", transform: "digits" });
    assert.equal(field(c, "country"), "0612345678");
    exec("copy_field", c, { from: "email", to: "source", transform: "uppercase" });
    assert.equal(field(c, "source"), "COPIE@EX.FR");
    exec("copy_field", c, { from: "company", to: "language", transform: "lowercase" });
    assert.equal(field(c, "language"), "jean-pierre dupont");
  });
  test("source vide : rien n'est copié et la destination n'est jamais effacée", () => {
    const c = contact("vide@ex.fr", { company: "Garder" });
    const r = exec("copy_field", c, { from: "first_name", to: "company" });
    assert.equal(r.next, true); assert.equal(r.log[0], "skipped");
    assert.equal(field(c, "company"), "Garder");
  });
  test("valeur refusée par le type de la destination : notée au journal, le scénario continue, rien n'est écrit", () => {
    const c = contact("type@ex.fr", { first_name: "abc" });
    const r = exec("copy_field", c, { from: "first_name", to: "property:solde" });
    assert.equal(r.next, true); assert.equal(r.log[0], "failed"); assert.match(r.log[1], /nombre/i);
    assert.equal(props(c).solde, undefined);
  });
});

describe("définir une date", () => {
  // jeudi 8 octobre 2026 22:30 UTC : déjà vendredi 9 à 00:30 à Paris, encore jeudi 8 à 18:30 à New York
  const NOW = "2026-10-08T22:30:00Z";
  test("« aujourd'hui » suit le fuseau (contact ou organisation) ; décalages avant et après", () => {
    const ny = contact("ny@ex.fr", {}, "America/New_York");
    exec("set_date", ny, { property: "property:relance", base: "today", offsetDays: 0, zone: "contact" }, NOW);
    assert.equal(props(ny).relance, "2026-10-08", "New York : jeudi");
    exec("set_date", ny, { property: "property:relance", base: "today", offsetDays: 0, zone: "organization" }, NOW);
    assert.equal(props(ny).relance, "2026-10-09", "fuseau de l'organisation (Paris) : vendredi");
    exec("set_date", ny, { property: "property:relance", base: "today", offsetDays: 7, zone: "organization" }, NOW);
    assert.equal(props(ny).relance, "2026-10-16");
    exec("set_date", ny, { property: "property:relance", base: "today", offsetDays: -9, zone: "organization" }, NOW);
    assert.equal(props(ny).relance, "2026-09-30", "changement de mois");
  });
  test("à partir d'un autre champ date ; champ de départ vide : rien n'est défini", () => {
    const c = contact("dep@ex.fr");
    assert.equal(exec("set_date", c, { property: "property:relance", base: "property", baseProperty: "property:rentree", offsetDays: -14 }).log[0], "skipped");
    assert.equal(props(c).relance, undefined);
    audience.setContactProperties(A, c.id, { rentree: "2026-03-01" });
    exec("set_date", c, { property: "property:relance", base: "property", baseProperty: "property:rentree", offsetDays: -14 });
    assert.equal(props(c).relance, "2026-02-15");
    audience.setContactProperties(A, c.id, { rentree: "2028-02-28" });
    exec("set_date", c, { property: "property:relance", base: "property", baseProperty: "property:rentree", offsetDays: 1 });
    assert.equal(props(c).relance, "2028-02-29", "année bissextile");
  });
});

describe("calculer un nombre", () => {
  test("définir, ajouter, retirer, multiplier ; champ vide compté pour 0 ; arrondi propre", () => {
    const c = contact("calc@ex.fr");
    exec("calculate", c, { property: "property:solde", op: "add", value: 5 });
    assert.equal(props(c).solde, 5, "vide + 5");
    exec("calculate", c, { property: "property:solde", op: "multiply", value: 3 });
    assert.equal(props(c).solde, 15);
    exec("calculate", c, { property: "property:solde", op: "subtract", value: 20 });
    assert.equal(props(c).solde, -5, "les négatifs sont permis");
    exec("calculate", c, { property: "property:solde", op: "set", value: 0.1 });
    exec("calculate", c, { property: "property:solde", op: "add", value: 0.2 });
    assert.equal(props(c).solde, 0.3, "0,1 + 0,2 = 0,3 (pas 0,30000000000000004)");
    const r = exec("calculate", c, { property: "property:solde", op: "set", value: 1e9 });
    assert.equal(r.log[0], "calculate");
    const huge = exec("calculate", c, { property: "property:solde", op: "multiply", value: 1e9 });
    assert.equal(huge.log[0], "failed"); assert.match(huge.log[1], /hors bornes/);
    assert.equal(props(c).solde, 1e9, "propriété inchangée");
  });
});

describe("exécution par le moteur et brouillons", () => {
  const event = (c) => ({ id: Math.floor(Math.random() * 1e9), organizationId: 1, name: "lms.user_registered", contactId: c.id, email: c.email, metadata: {} });
  test("un scénario enchaîne copie, date et calcul : les valeurs sont écrites et journalisées", async () => {
    const a = make([
      { type: "copy_field", from: "first_name", to: "property:niveau", transform: "uppercase" },
      { type: "set_date", property: "property:relance", offsetDays: 3 },
      { type: "calculate", property: "property:solde", op: "add", value: 10 },
    ]);
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    const c = contact("e2e@ex.fr", { first_name: "awa" });
    auto.onEvent(A, event(c));
    const run = m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ?").get(c.id);
    await auto.runAutomation(A, run.id, { provider, now: T0 });
    assert.equal(props(c).niveau, "AWA");
    assert.match(props(c).relance, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(props(c).solde, 10);
    assert.deepEqual(m.db.prepare("SELECT action FROM mk_automation_log WHERE run_id = ? ORDER BY id").all(run.id).map((l) => l.action), ["copy_field", "set_date", "calculate", "completed"]);
  });
  test("étapes non réglées : brouillon, jamais une erreur", () => {
    const g = (type, data) => ({ nodes: [{ id: "trigger", type: "trigger", data: {} }, { id: "n1", type, data }], edges: [{ id: "e1", source: "trigger", target: "n1" }] });
    const todo = (type, data) => graph.incompleteNodes(g(type, data)).map((n) => n.id);
    assert.deepEqual(todo("copy_field", { from: "", to: "", transform: "none" }), ["n1"]);
    assert.deepEqual(todo("copy_field", { from: "first_name", to: "company", transform: "none" }), []);
    assert.deepEqual(todo("set_date", { property: "", base: "today" }), ["n1"]);
    assert.deepEqual(todo("set_date", { property: "property:relance", base: "property" }), ["n1"]);
    assert.deepEqual(todo("set_date", { property: "property:relance", base: "today" }), []);
    assert.deepEqual(todo("calculate", { property: "property:solde", op: "add" }), ["n1"]);
    assert.deepEqual(todo("calculate", { property: "property:solde", op: "add", value: 0 }), [], "0 est une valeur valide");
  });
});
