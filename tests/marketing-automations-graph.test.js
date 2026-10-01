// Traduction steps (exécution) ↔ graph (édition en canevas). Le format d'exécution ne change pas (engine.js
// intact) : ces tests vérifient que la traduction dans les deux sens préserve le COMPORTEMENT, pas juste la forme.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { stepsToGraph, graphToSteps, TRIGGER_ID, EXIT_ID } = require("../src/marketing/automations/graph");
const { MarketingError } = require("../src/marketing/errors");

describe("steps → graph", () => {
  test("scénario vide : seulement le déclencheur, aucune arête", () => {
    const g = stepsToGraph({ steps: [], triggerEvent: "lms.user_registered" });
    assert.deepEqual(g.nodes.map((n) => n.id), [TRIGGER_ID]);
    assert.deepEqual(g.edges, []);
  });
  test("linéaire : un nœud par étape, une arête entre chacune, la dernière sans sortie", () => {
    const g = stepsToGraph({ steps: [{ type: "email", templateId: 1 }, { type: "wait", amount: 1, unit: "days" }, { type: "end" }], triggerEvent: "lms.user_registered" });
    assert.deepEqual(g.nodes.map((n) => n.id).sort(), ["trigger", "n0", "n1", "n2"].sort());
    assert.deepEqual(g.edges.map((e) => `${e.source}>${e.target}`).sort(), ["trigger>n0", "n0>n1", "n1>n2"].sort());
    assert.equal(g.nodes.find((n) => n.id === "n2").type, "end");
  });
  test("condition : deux arêtes, étiquetées, vers les bonnes cibles", () => {
    const g = stepsToGraph({ steps: [{ type: "email", templateId: 1 }, { type: "condition", check: "opened", ref: 0, onTrue: 2, onFalse: 3 }, { type: "add_tag", tag: "a" }, { type: "add_tag", tag: "b" }], triggerEvent: "x" });
    const fromCond = g.edges.filter((e) => e.source === "n1");
    assert.equal(fromCond.length, 2);
    assert.deepEqual(fromCond.find((e) => e.sourceHandle === "true"), { id: fromCond.find((e) => e.sourceHandle === "true").id, source: "n1", target: "n2", sourceHandle: "true", label: "Oui" });
    assert.equal(fromCond.find((e) => e.sourceHandle === "false").target, "n3");
    // ref (index de l'étape) devient l'identifiant du nœud correspondant
    assert.equal(g.nodes.find((n) => n.id === "n1").data.ref, "n0");
  });
  test("« exit » crée un nœud de sortie partagé, une seule fois même si visé plusieurs fois", () => {
    const g = stepsToGraph({
      steps: [
        { type: "condition", check: "segment", definition: {}, onTrue: "exit", onFalse: 1 },
        { type: "add_tag", tag: "a", next: "exit" },
      ],
      triggerEvent: "x",
    });
    assert.equal(g.nodes.filter((n) => n.id === EXIT_ID).length, 1);
    assert.ok(g.edges.some((e) => e.target === EXIT_ID && e.source === "n0"));
    assert.ok(g.edges.some((e) => e.target === EXIT_ID && e.source === "n1"));
  });
  test("aucun nœud de sortie créé si rien ne sort jamais du scénario", () => {
    const g = stepsToGraph({ steps: [{ type: "email", templateId: 1 }, { type: "end" }], triggerEvent: "x" });
    assert.equal(g.nodes.some((n) => n.id === EXIT_ID), false);
  });
  test("split : deux arêtes A/B avec le bon handle, comme une condition mais onA/onB", () => {
    const g = stepsToGraph({ steps: [{ type: "split", percentage: 30, onA: 1, onB: 2 }, { type: "add_tag", tag: "a" }, { type: "add_tag", tag: "b" }], triggerEvent: "x" });
    const fromSplit = g.edges.filter((e) => e.source === "n0");
    assert.equal(fromSplit.length, 2);
    assert.deepEqual(fromSplit.find((e) => e.sourceHandle === "a"), { id: fromSplit.find((e) => e.sourceHandle === "a").id, source: "n0", target: "n1", sourceHandle: "a", label: "A" });
    assert.equal(fromSplit.find((e) => e.sourceHandle === "b").target, "n2");
    assert.equal(g.nodes.find((n) => n.id === "n0").data.percentage, 30);
  });
});

describe("graph → steps", () => {
  const edge = (source, target, extra) => ({ id: `${source}-${target}`, source, target, ...extra });

  test("scénario vide (déclencheur sans arête sortante)", () => {
    assert.deepEqual(graphToSteps({ nodes: [{ id: TRIGGER_ID, type: "trigger", data: {} }], edges: [] }), []);
  });
  test("linéaire : ordre respecté, « next » omis quand c'est déjà l'étape suivante naturelle", () => {
    const graph = {
      nodes: [
        { id: TRIGGER_ID, type: "trigger", data: {} },
        { id: "a", type: "email", data: { templateId: 5, trackClicks: true } },
        { id: "b", type: "wait", data: { amount: 2, unit: "days" } },
        { id: "c", type: "end", data: {} },
      ],
      edges: [edge(TRIGGER_ID, "a"), edge("a", "b"), edge("b", "c")],
    };
    assert.deepEqual(graphToSteps(graph), [{ type: "email", templateId: 5, trackClicks: true }, { type: "wait", amount: 2, unit: "days" }, { type: "end" }]);
  });
  test("un nœud jamais relié au déclencheur n'apparaît pas dans les étapes", () => {
    const graph = {
      nodes: [{ id: TRIGGER_ID, type: "trigger", data: {} }, { id: "a", type: "email", data: { templateId: 1 } }, { id: "orphelin", type: "email", data: { templateId: 2 } }],
      edges: [edge(TRIGGER_ID, "a")],
    };
    assert.equal(graphToSteps(graph).length, 1);
  });
  test("condition avec deux branches qui reconvergent sur le MÊME nœud", () => {
    const graph = {
      nodes: [
        { id: TRIGGER_ID, type: "trigger", data: {} },
        { id: "cond", type: "condition", data: { check: "segment", definition: { op: "and", rules: [] } } },
        { id: "a", type: "add_tag", data: { tag: "branche-a" } },
        { id: "b", type: "add_tag", data: { tag: "branche-b" } },
        { id: "fin", type: "add_tag", data: { tag: "commun" } },
      ],
      edges: [
        edge(TRIGGER_ID, "cond"), edge("cond", "a", { sourceHandle: "true" }), edge("cond", "b", { sourceHandle: "false" }),
        edge("a", "fin"), edge("b", "fin"),
      ],
    };
    const steps = graphToSteps(graph);
    assert.equal(steps.length, 4);
    assert.equal(steps[0].type, "condition");
    const fin = steps.length - 1; // "fin" est topologiquement placé après a ET b
    assert.equal(steps[0].onTrue !== steps[0].onFalse, true, "les deux branches vont vers des nœuds distincts avant de reconverger");
    // les deux branches (peu importe où elles sont placées) pointent finalement toutes deux vers l'étape « fin »
    const branchStep = (idx) => steps[idx];
    const aIdx = steps.findIndex((s) => s.tag === "branche-a");
    const bIdx = steps.findIndex((s) => s.tag === "branche-b");
    assert.equal(branchStep(aIdx).next === fin || aIdx + 1 === fin, true);
    assert.equal(branchStep(bIdx).next === fin || bIdx + 1 === fin, true);
  });
  test("une arête vers le nœud de sortie devient « exit »", () => {
    const graph = {
      nodes: [{ id: TRIGGER_ID, type: "trigger", data: {} }, { id: "a", type: "add_tag", data: { tag: "x" } }, { id: EXIT_ID, type: "end", data: { exit: true } }],
      edges: [edge(TRIGGER_ID, "a"), edge("a", EXIT_ID)],
    };
    assert.deepEqual(graphToSteps(graph), [{ type: "add_tag", tag: "x", next: "exit" }]);
  });
  test("une boucle (arête vers une étape déjà placée) est refusée avec un message clair", () => {
    const graph = {
      nodes: [{ id: TRIGGER_ID, type: "trigger", data: {} }, { id: "a", type: "add_tag", data: { tag: "x" } }, { id: "b", type: "add_tag", data: { tag: "y" } }],
      edges: [edge(TRIGGER_ID, "a"), edge("a", "b"), edge("b", "a")], // b revient vers a : boucle
    };
    assert.throws(() => graphToSteps(graph), MarketingError);
    try { graphToSteps(graph); } catch (e) { assert.match(e.message, /boucle/); }
  });
  test("ref (identifiant de nœud) se résout vers l'index de l'étape correspondante", () => {
    const graph = {
      nodes: [
        { id: TRIGGER_ID, type: "trigger", data: {} },
        { id: "mail", type: "email", data: { templateId: 9 } },
        { id: "wait", type: "wait", data: { amount: 1, unit: "days" } },
        { id: "cond", type: "condition", data: { check: "opened", ref: "mail" } },
      ],
      edges: [edge(TRIGGER_ID, "mail"), edge("mail", "wait"), edge("wait", "cond")],
    };
    const steps = graphToSteps(graph);
    const condStep = steps.find((s) => s.type === "condition");
    assert.equal(condStep.ref, steps.findIndex((s) => s.type === "email"));
  });
  test("split : sourceHandle a/b se résout vers onA/onB, jamais confondu avec une condition (onTrue/onFalse)", () => {
    const graph = {
      nodes: [
        { id: TRIGGER_ID, type: "trigger", data: {} },
        { id: "sp", type: "split", data: { percentage: 20 } },
        { id: "a", type: "add_tag", data: { tag: "a" } },
        { id: "b", type: "add_tag", data: { tag: "b" } },
      ],
      edges: [edge(TRIGGER_ID, "sp"), edge("sp", "a", { sourceHandle: "a" }), edge("sp", "b", { sourceHandle: "b" })],
    };
    const steps = graphToSteps(graph);
    const splitStep = steps.find((s) => s.type === "split");
    assert.equal(splitStep.percentage, 20);
    assert.equal(splitStep.onTrue, undefined, "un split n'a pas onTrue/onFalse");
    assert.equal(steps[splitStep.onA].tag, "a");
    assert.equal(steps[splitStep.onB].tag, "b");
  });
});

describe("aller-retour (steps → graph → steps) : le comportement est préservé", () => {
  test("le scénario exact demandé par l'utilisateur (Bienvenue avec branchement) survit à l'aller-retour", () => {
    const original = [
      { type: "wait", amount: 1, unit: "days" },
      { type: "email", templateId: 3, trackClicks: false },
      { type: "wait", amount: 3, unit: "days" },
      { type: "condition", check: "opened", ref: 1, onTrue: 4, onFalse: 6 },
      { type: "email", templateId: 4, trackClicks: false },
      { type: "end" },
      { type: "email", templateId: 5, trackClicks: false },
    ];
    const graph = stepsToGraph({ steps: original, triggerEvent: "lms.user_registered", triggerFilter: {} });
    const roundTripped = graphToSteps(graph);
    assert.equal(roundTripped.length, original.length);
    // Même comportement : l'e-mail référencé par la condition reste bien celui qui a été envoyé juste après le déclencheur
    const condIdx = roundTripped.findIndex((s) => s.type === "condition");
    assert.equal(roundTripped[condIdx].check, "opened");
    assert.equal(roundTripped[roundTripped[condIdx].ref].type, "email");
    // Les deux branches mènent bien à deux e-mails DIFFÉRENTS, chacun suivi d'une fin (directe ou par épuisement du tableau)
    const trueTarget = roundTripped[condIdx].onTrue;
    const falseTarget = roundTripped[condIdx].onFalse;
    assert.notEqual(trueTarget, falseTarget);
    assert.equal(roundTripped[trueTarget].type, "email");
    assert.equal(roundTripped[falseTarget].type, "email");
  });
  test("un scénario avec un split survit à l'aller-retour (jamais confondu avec une condition)", () => {
    const original = [
      { type: "split", percentage: 40, onA: 1, onB: 2 },
      { type: "add_tag", tag: "a" },
      { type: "add_tag", tag: "b" },
    ];
    const graph = stepsToGraph({ steps: original, triggerEvent: "lms.user_registered", triggerFilter: {} });
    const roundTripped = graphToSteps(graph);
    assert.deepEqual(roundTripped, original);
  });
});
