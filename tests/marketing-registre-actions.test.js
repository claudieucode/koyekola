// Registre des actions d'un scénario (src/marketing/automations/actions/) : garde-fous d'invariant. Une action visible
// dans la palette doit pouvoir réellement être validée ET exécutée ; le serveur, le client et les libellés doivent
// rester d'accord. Les comportements eux-mêmes sont couverts par les tests de scénarios existants (inchangés).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const registry = require("../src/marketing/automations/actions");
const { validateSteps } = require("../src/marketing/automations/steps");
const { STEP_LABELS } = require("../src/utils/stepLabels");
const { MarketingError } = require("../src/marketing/errors");

const EXPECTED = ["email", "sms", "wait", "wait_for_event", "wait_until", "condition", "split", "update_field", "add_tag", "remove_tag", "add_to_list", "remove_from_list", "adjust_score", "add_note", "start_automation", "stop_automation", "end"];

describe("registre des actions", () => {
  test("les actions sont enregistrées dans l'ordre de la palette (les 12 historiques puis les nouvelles, « fin » en dernier)", () => {
    assert.deepEqual(registry.actionTypes(), EXPECTED);
  });

  test("chaque action a une identité complète, une validation et une exécution", () => {
    for (const a of registry.listActions()) {
      assert.ok(registry.CATEGORIES.includes(a.category), `${a.type} : catégorie`);
      assert.equal(a.label, STEP_LABELS[a.type], `${a.type} : libellé identique à utils/stepLabels.js`);
      assert.ok(a.description.length > 0, `${a.type} : description`);
      assert.ok(Number.isInteger(a.version) && a.version >= 1, `${a.type} : version`);
      assert.equal(a.status, "available", `${a.type} : une action exécutable est « available »`);
      assert.equal(typeof a.validate, "function");
      assert.equal(typeof a.execute, "function");
      assert.ok(Array.isArray(a.requires), `${a.type} : requires`);
    }
  });

  test("tout libellé d'étape (hors déclencheur) correspond à une action, et inversement", () => {
    const labelled = Object.keys(STEP_LABELS).filter((k) => k !== "trigger").sort();
    assert.deepEqual([...registry.actionTypes()].sort(), labelled);
  });

  test("le registre de l'éditeur (client) connaît toutes les actions du serveur", () => {
    const client = fs.readFileSync(path.join(__dirname, "..", "src", "editor", "automation", "registry.js"), "utf8");
    for (const type of registry.actionTypes()) assert.match(client, new RegExp(`\\n  ${type}: \\{`), `${type} absent de editor/automation/registry.js`);
  });

  test("la description sérialisable ne contient aucune fonction", () => {
    const described = registry.describeActions();
    assert.equal(described.length, EXPECTED.length);
    assert.deepEqual(JSON.parse(JSON.stringify(described)), described);
  });

  test("le message « type inconnu » liste les types enregistrés", () => {
    assert.throws(() => validateSteps({}, [{ type: "inexistant" }], "marketing"), (e) => e instanceof MarketingError && e.message.includes(`(${EXPECTED.join(", ")})`));
  });

  test("une définition incomplète ou en double est refusée à l'enregistrement", () => {
    const ok = { type: "essai_registre", category: "contact", label: "Essai", description: "Essai", version: 1, status: "available", validate: () => ({}), execute: () => ({ next: true }) };
    assert.throws(() => registry.defineAction({ ...ok, category: "inconnue" }), /catégorie/);
    assert.throws(() => registry.defineAction({ ...ok, status: "bientot" }), /statut/);
    assert.throws(() => registry.defineAction({ ...ok, execute: undefined }), /execute/);
    assert.throws(() => registry.defineAction({ ...ok, type: "email" }), /déjà enregistrée/);
    assert.throws(() => registry.defineAction({ ...ok, type: "Mauvais Type" }), /invalide/);
  });
});

describe("exécution par le registre", () => {
  const exec = (type, step, extra = {}) => registry.getAction(type).execute({ step, ...extra });

  test("attendre rend une durée en millisecondes et un message de journal", () => {
    assert.deepEqual(exec("wait", { amount: 2, unit: "hours" }), { log: ["wait", "2 hours"], wait: 7200000 });
    assert.deepEqual(exec("wait_for_event", { event: "lms.course_completed", amount: 3, unit: "days" }), { log: ["wait_for_event", "lms.course_completed (3 days au plus)"], wait: 259200000 });
  });

  test("la fin termine le passage", () => {
    assert.deepEqual(exec("end", { type: "end" }), { complete: true });
  });

  test("un tirage vers « sortie » sort du scénario, vers une étape saute, vers « suivante » continue", () => {
    const orig = Math.random;
    try {
      Math.random = () => 0.0; // toujours A
      assert.deepEqual(exec("split", { percentage: 50, onA: "exit", onB: "next" }), { log: ["split", "50% → A (sortie)"], exit: "split" });
      assert.deepEqual(exec("split", { percentage: 50, onA: 3, onB: "next" }), { log: ["split", "50% → A (étape 4)"], jump: 3 });
      Math.random = () => 0.99; // toujours B
      assert.deepEqual(exec("split", { percentage: 50, onA: 3, onB: "next" }), { log: ["split", "50% → B (étape suivante)"], next: true });
    } finally { Math.random = orig; }
  });
});
