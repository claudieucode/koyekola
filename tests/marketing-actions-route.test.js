// Action de scénario « Plusieurs chemins » (route) : jusqu'à 5 cas évalués dans l'ordre + « Sinon », chacun avec sa condition
// (moteur de segments) et son chemin (toujours vers l'avant) ; conversion fidèle vers et depuis le canevas (poignées caseN / other) ;
// brouillons ; exécution de bout en bout par le moteur.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const auto = require("../src/marketing/automations");
const graph = require("../src/marketing/automations/graph");
const { createProvider } = require("../src/marketing/sending/providers");

let m, A, provider;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const contact = (email, fields = {}) => audience.upsertContact(A, { email, ...fields }).contact;
const make = (steps) => auto.createAutomation(A, { name: `R${Math.random().toString(36).slice(2, 6)}`, kind: "marketing", triggerEvent: "lms.user_registered", steps });
const tagRule = (name) => ({ op: "and", rules: [{ field: "tag", cmp: "has", value: name }] });
const countryRule = (c) => ({ op: "and", rules: [{ field: "country", cmp: "eq", value: c }] });
const tags = (c) => m.db.prepare("SELECT t.name FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ? ORDER BY t.name").all(c.id).map((r) => r.name);
const event = (c) => ({ id: Math.floor(Math.random() * 1e9), organizationId: 1, name: "lms.user_registered", contactId: c.id, email: c.email, metadata: {} });
const logs = (run) => m.db.prepare("SELECT action, detail FROM mk_automation_log WHERE run_id = ? ORDER BY id").all(run.id);

// route → étape 1 (vip) / étape 2 (France) / étape 3 (sinon), puis chaque étape pose son étiquette et file à la fin
const STEPS = (over = {}) => [
  { type: "route", cases: [{ label: "Clients VIP", definition: tagRule("vip"), to: 1 }, { label: "France", definition: countryRule("FR"), to: 2 }], otherwise: 3, ...over },
  { type: "add_tag", tag: "chemin-vip", next: 4 },
  { type: "add_tag", tag: "chemin-france", next: 4 },
  { type: "add_tag", tag: "chemin-autre" },
  { type: "end" },
];

beforeEach(() => { m = freshMarketing(); A = m.A; provider = createProvider({ provider: "console" }, { log: quiet }); });

describe("validation", () => {
  test("cas normalisés (nom par défaut, espaces), chemin « Sinon » par défaut = sortie ; champs superflus retirés", () => {
    const a = make([{ type: "route", cases: [{ definition: tagRule("a"), to: 1, junk: 1 }, { label: "  Deux\n mots  ", definition: tagRule("b"), to: "next" }], extra: 1 }, { type: "end" }]);
    assert.deepEqual(a.steps[0], { type: "route", cases: [{ label: "Cas 1", definition: tagRule("a"), to: 1 }, { label: "Deux mots", definition: tagRule("b"), to: "next" }], otherwise: "exit" });
  });
  test("refus : aucun cas, plus de 5 cas, cas sans condition valide, nom trop long, chemin en arrière ou inexistant", () => {
    const bad = (cases, over = {}) => code(() => make([{ type: "route", cases, ...over }, { type: "end" }]));
    assert.equal(bad([]), "invalid_automation");
    assert.equal(bad(undefined), "invalid_automation");
    assert.equal(bad(Array.from({ length: 6 }, (_, k) => ({ definition: tagRule(`t${k}`), to: 1 }))), "invalid_automation");
    assert.equal(code(() => make([{ type: "route", cases: Array.from({ length: 5 }, (_, k) => ({ definition: tagRule(`t${k}`), to: 1 })) }, { type: "end" }])), null, "5 cas : permis");
    assert.equal(bad([{ definition: { op: "and", rules: [] }, to: 1 }]), "invalid_segment", "condition vide");
    assert.equal(bad([{ definition: tagRule("a"), to: 1 }, null]), "invalid_automation");
    assert.equal(bad([{ label: "x".repeat(41), definition: tagRule("a"), to: 1 }]), "invalid_automation");
    assert.equal(bad([{ definition: tagRule("a"), to: 0 }]), "invalid_automation", "vers soi-même : une boucle");
    assert.equal(bad([{ definition: tagRule("a"), to: 9 }]), "invalid_automation", "étape inexistante");
    assert.equal(bad([{ definition: tagRule("a"), to: "plus-tard" }]), "invalid_automation");
    assert.equal(bad([{ definition: tagRule("a"), to: 1 }], { otherwise: -1 }), "invalid_automation");
  });
});

describe("exécution", () => {
  async function through(c, steps = STEPS()) {
    const a = make(steps);
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    auto.onEvent(A, event(c));
    const run = m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ?").get(c.id);
    await auto.runAutomation(A, run.id, { provider, now: T0 });
    return run;
  }
  test("chaque contact suit son chemin ; le premier cas qui correspond l'emporte ; sinon « Sinon »", async () => {
    const vip = contact("vip@ex.fr", { country: "FR" });
    audience.tagContact(A, vip.id, "vip");
    const fr = contact("fr@ex.fr", { country: "FR" });
    const autre = contact("autre@ex.fr", { country: "BE" });
    const run = await through(vip);
    assert.deepEqual(tags(vip), ["chemin-vip", "vip"], "VIP ET France : le premier cas (VIP) l'emporte, pas de double passage");
    assert.deepEqual(logs(run).filter((l) => l.action === "route").map((l) => l.detail), ["« Clients VIP » → étape 2"]);
    await through(fr, STEPS()); // second scénario identique : le contact fr entre dans le sien
    assert.deepEqual(tags(fr), ["chemin-france"]);
    await through(autre, STEPS());
    assert.deepEqual(tags(autre), ["chemin-autre"]);
  });
  test("aucun cas ne correspond et « Sinon » sort du scénario : le contact sort (journalisé)", async () => {
    const c = contact("sortie@ex.fr", { country: "BE" });
    const run = await through(c, STEPS({ otherwise: "exit" }));
    assert.deepEqual(tags(c), []);
    assert.deepEqual(logs(run).filter((l) => l.action === "route").map((l) => l.detail), ["aucun cas → Sinon → sortie"]);
    assert.equal(m.db.prepare("SELECT status FROM mk_automation_runs WHERE id = ?").get(run.id).status, "exited");
  });
});

describe("canevas", () => {
  test("aller-retour fidèle : étapes → canevas → étapes (noms, conditions, chemins, « Sinon »)", () => {
    const a = make(STEPS());
    const g = graph.stepsToGraph(a);
    const node = g.nodes.find((n) => n.type === "route");
    assert.deepEqual(node.data.cases, [{ label: "Clients VIP", definition: tagRule("vip") }, { label: "France", definition: countryRule("FR") }], "les chemins ne sont pas des données du nœud : ce sont des arêtes");
    assert.equal(node.data.otherwise, undefined);
    const out = g.edges.filter((e) => e.source === node.id).map((e) => [e.sourceHandle, e.label, e.target]);
    assert.deepEqual(out, [["case1", "Clients VIP", "n1"], ["case2", "France", "n2"], ["other", "Sinon", "n3"]]);
    assert.deepEqual(graph.graphToSteps(g), a.steps);
  });
  test("« Sinon » vers la sortie : un nœud de sortie relié par la poignée « other », relu comme « exit »", () => {
    const a = make([{ type: "route", cases: [{ definition: tagRule("a"), to: 1 }], otherwise: "exit" }, { type: "add_tag", tag: "x" }]);
    const g = graph.stepsToGraph(a);
    assert.deepEqual(g.edges.filter((e) => e.sourceHandle === "other").map((e) => [e.label, e.target]), [["Sinon", "exit"]]);
    assert.equal(graph.graphToSteps(g)[0].otherwise, "exit");
  });
  test("un chemin non relié sort du scénario ; supprimer un cas décale les poignées sans rien mélanger", () => {
    const a = make(STEPS());
    const g = graph.stepsToGraph(a);
    // le cas « France » (case2) n'est plus relié : « sortie » ; « Sinon » reste relié à la même étape
    g.edges = g.edges.filter((e) => !(e.source === "n0" && e.sourceHandle === "case2"));
    const steps = graph.graphToSteps(g);
    assert.deepEqual(steps[0].cases.map((c) => c.to), [1, "exit"]);
    assert.equal(steps[steps[0].otherwise].tag, "chemin-autre", "« Sinon » mène toujours à la même étape (les numéros ont changé : l'étape inatteignable a disparu)");
    assert.equal(steps[steps[0].cases[0].to].tag, "chemin-vip");
  });
  test("étapes non réglées : brouillon", () => {
    const g = (data) => ({ nodes: [{ id: "trigger", type: "trigger", data: {} }, { id: "n1", type: "route", data }], edges: [{ id: "e1", source: "trigger", target: "n1" }] });
    assert.deepEqual(graph.incompleteNodes(g({ cases: [] })).map((n) => n.id), ["n1"]);
    assert.deepEqual(graph.incompleteNodes(g({ cases: [{ label: "A", definition: { op: "and", rules: [] } }] })).map((n) => n.id), ["n1"]);
    assert.deepEqual(graph.incompleteNodes(g({ cases: [{ label: "A", definition: tagRule("x") }] })), []);
  });
});
