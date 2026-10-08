// Traduction entre le format d'ÉDITION (canvas : nœuds + positions x/y + arêtes) et le format d'EXÉCUTION
// (`steps`, une liste plate avec des sauts — voir engine.js, inchangé par cette phase). Le canvas est une simple
// VUE : la vérité qui s'exécute reste `steps`. Format canonique stocké :
//   { nodes: [{ id, type, data, position: {x,y} }], edges: [{ id, source, target, sourceHandle?, label? }] }
// `id` est une chaîne stable (contrairement à l'ancien adressage par position, qui cassait si on réordonnait).
const { MarketingError } = require("../errors");

const TRIGGER_ID = "trigger";
const EXIT_ID = "exit";
const NODE_W = 220, ROW_GAP = 140;

// Étapes à DEUX sorties (comme une condition) : condition (vrai/faux) et split (A/B, tirage aléatoire) partagent la
// même mécanique de branchement, seuls les noms de champ et les libellés de port changent.
const BRANCH_FIELDS = {
  condition: { t: "onTrue", f: "onFalse", tHandle: "true", fHandle: "false", tLabel: "Oui", fLabel: "Non" },
  split: { t: "onA", f: "onB", tHandle: "a", fHandle: "b", tLabel: "A", fLabel: "B" },
};

// Retire le contrôle de flux (type, onTrue/onFalse/onA/onB, next) : il devient des ARÊTES, jamais des données de nœud
const stepData = (step) => {
  const data = { ...step };
  delete data.type; delete data.onTrue; delete data.onFalse; delete data.onA; delete data.onB; delete data.next;
  return data;
};

// ---------- steps (exécution) → graph (édition) ----------
function stepsToGraph(automation) {
  const steps = Array.isArray(automation.steps) ? automation.steps : [];
  const idOf = (i) => `n${i}`;
  // `triggers` (1 à 3, migration 017) est la source complète ; à défaut (appelé avec l'ancienne forme), un seul
  // déclencheur reconstruit depuis triggerEvent/triggerFilter — jamais un nœud déclencheur sans aucun déclencheur.
  const triggers = Array.isArray(automation.triggers) && automation.triggers.length ? automation.triggers : [{ event: automation.triggerEvent || "", filter: automation.triggerFilter || {} }];
  const nodes = [{ id: TRIGGER_ID, type: "trigger", data: { triggers, triggerEvent: triggers[0].event, triggerFilter: triggers[0].filter }, position: { x: 40, y: 40 } }];
  const edges = [];
  let needExit = false;
  let edgeSeq = 0;
  const addEdge = (source, target, extra = {}) => edges.push({ id: `e${edgeSeq++}`, source, target, ...extra });

  // Colonne unique, une ligne par étape : lisible de haut en bas comme l'ancien éditeur linéaire, sans zigzag
  // horizontal (un vrai rangement en grille n'aurait de sens qu'en tenant compte des embranchements — phase 2).
  steps.forEach((step, i) => nodes.push({ id: idOf(i), type: step.type, data: { ...stepData(step), ...(step.type === "condition" && step.ref !== undefined ? { ref: idOf(step.ref) } : {}) }, position: { x: 40, y: 40 + (i + 1) * ROW_GAP } })); // même écart que entre deux étapes (le déclencheur aussi a sa hauteur)

  if (steps.length) addEdge(TRIGGER_ID, idOf(0));

  steps.forEach((step, i) => {
    if (step.type === "end") return; // aucune arête sortante : terminus
    const bf = BRANCH_FIELDS[step.type];
    if (bf) {
      const targetOf = (branch) => (branch === "exit" ? EXIT_ID : branch === "next" ? (i + 1 < steps.length ? idOf(i + 1) : null) : idOf(branch));
      const t = targetOf(step[bf.t]), f = targetOf(step[bf.f]);
      if (step[bf.t] === "exit" || step[bf.f] === "exit") needExit = true;
      if (t) addEdge(idOf(i), t, { sourceHandle: bf.tHandle, label: bf.tLabel });
      if (f) addEdge(idOf(i), f, { sourceHandle: bf.fHandle, label: bf.fLabel });
      return;
    }
    if (step.next === "exit") { needExit = true; addEdge(idOf(i), EXIT_ID); return; }
    const target = step.next !== undefined ? step.next : i + 1 < steps.length ? i + 1 : null;
    if (target !== null) addEdge(idOf(i), idOf(target));
  });

  if (needExit) nodes.push({ id: EXIT_ID, type: "end", data: { exit: true }, position: { x: 40, y: 40 + (steps.length + 1) * ROW_GAP } });
  return { nodes, edges };
}

// ---------- graph (édition) → steps (exécution) ----------
function graphToSteps(graph) {
  const nodes = new Map((graph.nodes || []).map((n) => [n.id, n]));
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  if (!nodes.has(TRIGGER_ID)) throw new MarketingError("invalid_automation", "Le déclencheur est introuvable dans le schéma.");

  const outFrom = (id) => edges.filter((e) => e.source === id);
  const start = outFrom(TRIGGER_ID)[0];
  if (!start) return []; // rien après le déclencheur : scénario vide, valide

  // Tri topologique (Kahn), limité aux nœuds ATTEIGNABLES depuis le déclencheur — un nœud posé sur le canevas
  // mais jamais relié est ignoré (il n'exécute rien tant qu'il n'est pas connecté).
  const reachable = new Set();
  (function walk(id) {
    if (reachable.has(id) || id === EXIT_ID) return;
    reachable.add(id);
    for (const e of outFrom(id)) walk(e.target);
  })(start.target);

  const real = [...reachable]; // exclut trigger et exit (jamais dans `real` : walk part de start.target, jamais du trigger, et exit est court-circuité)
  const indegree = new Map(real.map((id) => [id, 0]));
  for (const e of edges) if (reachable.has(e.source) && reachable.has(e.target)) indegree.set(e.target, (indegree.get(e.target) || 0) + 1);

  const order = [];
  const queue = real.filter((id) => indegree.get(id) === 0).sort(); // ordre stable, déterministe
  const remaining = new Map(indegree);
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const e of outFrom(id)) {
      if (!reachable.has(e.target) || e.target === EXIT_ID) continue;
      remaining.set(e.target, remaining.get(e.target) - 1);
      if (remaining.get(e.target) === 0) queue.push(e.target);
    }
    queue.sort();
  }
  if (order.length !== real.length) {
    throw new MarketingError("invalid_automation", "Le scénario contient une boucle : une connexion ramène vers une étape déjà passée. Supprimez-la (les branches ne peuvent avancer que vers l'avant).");
  }

  const indexOf = new Map(order.map((id, i) => [id, i]));
  const resolve = (target) => {
    if (target === undefined) return undefined; // pas d'arête sortante : fin implicite (tombe en dehors du tableau)
    if (target === EXIT_ID) return "exit";
    const idx = indexOf.get(target);
    if (idx === undefined) throw new MarketingError("invalid_automation", "Une connexion vise une étape introuvable.");
    return idx;
  };

  return order.map((id, i) => {
    const node = nodes.get(id);
    if (!node) throw new MarketingError("invalid_automation", "Un nœud référencé par une connexion n'existe plus.");
    const outs = outFrom(id);
    const bf = BRANCH_FIELDS[node.type];
    if (bf) {
      const t = outs.find((e) => e.sourceHandle === bf.tHandle);
      const f = outs.find((e) => e.sourceHandle === bf.fHandle);
      const step = { type: node.type, [bf.t]: t ? resolve(t.target) ?? "exit" : "exit", [bf.f]: f ? resolve(f.target) ?? "exit" : "exit" };
      if (node.type === "condition") {
        step.check = node.data.check;
        if (node.data.check === "segment") step.definition = node.data.definition;
        else step.ref = node.data && node.data.ref !== undefined ? indexOf.get(node.data.ref) : undefined;
      } else if (node.type === "split") {
        step.percentage = node.data.percentage;
      }
      return step;
    }
    if (node.type === "end") return { type: "end" };
    const step = { type: node.type, ...(node.data || {}) };
    const target = outs[0] ? outs[0].target : undefined;
    const resolved = resolve(target);
    // « next » seulement si ce n'est PAS déjà l'étape suivante naturelle (i + 1) : garde la sortie proche de l'ancien format
    if (resolved !== undefined && resolved !== "exit" && resolved !== i + 1) step.next = resolved;
    else if (resolved === "exit") step.next = "exit";
    return step;
  });
}

// ---------- Étapes à configurer (brouillon) ----------
// Une étape insérée depuis la palette n'est pas encore réglée : rien de choisi (modèle, étiquette, liste, critères…).
// C'est un état de BROUILLON légitime, distinct d'une donnée invalide (champ inconnu, valeur hors bornes), qui reste
// refusée comme avant. Seules les étapes RELIÉES au déclencheur comptent : un nœud isolé n'exécute rien.
const blank = (v) => v === undefined || v === null || (typeof v === "string" && !v.trim());
const INCOMPLETE = {
  email: (d) => blank(d.templateId),
  sms: (d) => blank(d.body),
  wait: (d) => blank(d.amount) || blank(d.unit),
  wait_for_event: (d) => blank(d.event) || blank(d.amount) || blank(d.unit),
  condition: (d) => ((d.check || "segment") === "segment" ? !d.definition || !Array.isArray(d.definition.rules) || !d.definition.rules.length : blank(d.ref)),
  split: (d) => blank(d.percentage),
  update_field: (d) => blank(d.field) || d.field === "property:",
  add_tag: (d) => blank(d.tag), remove_tag: (d) => blank(d.tag),
  add_to_list: (d) => blank(d.listId), remove_from_list: (d) => blank(d.listId),
  adjust_score: (d) => blank(d.mode) || blank(d.points),
  add_note: (d) => blank(d.body),
  copy_field: (d) => blank(d.from) || blank(d.to),
  set_date: (d) => blank(d.property) || (d.base === "property" && blank(d.baseProperty)),
  calculate: (d) => blank(d.property) || blank(d.op) || blank(d.value),
  webhook_call: (d) => blank(d.endpointId),
  notify_team: (d) => !Array.isArray(d.recipients) || !d.recipients.length || blank(d.subject) || blank(d.body),
  start_automation: (d) => blank(d.automationId), stop_automation: (d) => blank(d.automationId),
  wait_until: (d) => blank(d.mode) || (d.mode === "property" && blank(d.property)) || (d.mode === "date" && blank(d.date)) || (d.mode === "business_hours" && (!Array.isArray(d.days) || !d.days.length)),
};
function reachableIds(graph) {
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const seen = new Set();
  const walk = (id) => { if (seen.has(id) || id === EXIT_ID) return; seen.add(id); for (const e of edges) if (e.source === id) walk(e.target); };
  walk(TRIGGER_ID);
  seen.delete(TRIGGER_ID);
  return seen; // (EXIT_ID n'y figure jamais : la sortie implicite n'est pas une étape)
}
// Nœuds reliés au déclencheur dont le réglage obligatoire n'a pas encore été fait : [{ id, type }]
function incompleteNodes(graph) {
  if (!graph || !Array.isArray(graph.nodes)) return [];
  const reach = reachableIds(graph);
  return graph.nodes.filter((n) => reach.has(n.id) && INCOMPLETE[n.type] && INCOMPLETE[n.type](n.data || {})).map((n) => ({ id: n.id, type: n.type }));
}

// Nœuds posés sur le canevas mais reliés à aucun chemin partant du déclencheur (rien ne les relie automatiquement)
function orphanNodes(graph) {
  if (!graph || !Array.isArray(graph.nodes)) return [];
  const reach = reachableIds(graph);
  return graph.nodes.filter((n) => n.id !== TRIGGER_ID && !reach.has(n.id) && !(n.id === EXIT_ID && !(graph.edges || []).length)).map((n) => ({ id: n.id, type: n.type }));
}

module.exports = { stepsToGraph, graphToSteps, incompleteNodes, orphanNodes, TRIGGER_ID, EXIT_ID };
