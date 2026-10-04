// Éditeur visuel d'un scénario d'automatisation (canevas de nœuds/arêtes, via Drawflow).
// Le canevas est une simple VUE d'édition : à l'enregistrement, il est envoyé tel quel comme `canvas`
// et le serveur en dérive les `steps` exécutés par le moteur (src/marketing/automations/graph.js).
// Règle d'usage : palette = INSÉRER (aucune fenêtre) ; clic sur une étape (ou « ⋯ » → Configurer) = CONFIGURER, dans
// la grande interface (./automation/ui.js + stepEditors.js) qui modifie un brouillon ; « Enregistrer » l'applique au
// nœud puis enregistre aussitôt le scénario. Icônes, libellés, résumés : registre central ./automation/registry.js.
// Aucune donnée n'est insérée comme HTML : uniquement textContent / value, jamais innerHTML sur du texte saisi.
import Drawflow from "drawflow";
import { icon } from "../utils/icons";
import { STEP_LABELS } from "../utils/stepLabels";
import { openStepDialog, openStepMenu, closeStepMenu, confirmAction } from "./automation/ui";
import { buildEditor, validate, clean } from "./automation/stepEditors";
import { action, configurable, isConfigured, summary } from "./automation/registry";
import { buildPalette, DRAG_TYPE } from "./automation/palette";

(function () {
  "use strict";
  var node = document.getElementById("mk-automation-data");
  if (!node) return;
  var data = JSON.parse(node.textContent);
  var locked = !!data.readOnly;
  var a = data.automation;
  var TRIGGER_ID = "trigger";
  var EXIT_ID = "exit";
  var NODE_W = 220, NODE_H = 96;

  var LABELS = STEP_LABELS;
  // Types d'étape à DEUX sorties — mêmes noms de handle que graph.js#BRANCH_FIELDS côté serveur (tHandle/fHandle) :
  // s'ils divergent, une condition/un split se traduit vers la mauvaise branche sans qu'aucune erreur ne le signale.
  var BRANCH = { condition: { t: "onTrue", f: "onFalse", tHandle: "true", fHandle: "false", tLabel: "Oui", fLabel: "Non" }, split: { t: "onA", f: "onB", tHandle: "a", fHandle: "b", tLabel: "A", fLabel: "B" } };
  var hasEditor = configurable;
  var iconOf = function (type) { return action(type).icon; }; // icône du registre (design system du site, jamais d'emoji)

  var $ = function (id) { return document.getElementById(id); };
  var container = $("au-flow");
  if (!container) return;

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text !== undefined) n.textContent = text;
    return n;
  }
  // Icône du design system (jamais d'emoji) : le SVG vient toujours du registre fixe icons.js, jamais de texte
  // saisi — seul endroit où ce fichier pose du HTML de confiance plutôt que du textContent.
  function iconEl(name, opts) {
    var span = document.createElement("span");
    span.className = "mk-flow-icon";
    span.innerHTML = icon(name, opts);
    return span;
  }
  function announce(t) { var l = $("au-live"); if (l) { l.textContent = ""; setTimeout(function () { l.textContent = t; }, 30); } }
  function showError(message) { var b = $("au-error"); b.textContent = message || ""; b.hidden = !message; }
  function setStatus(t) { var s = $("au-status"); if (s) s.textContent = t; }
  var dirty = false;
  function changed() { dirty = true; setStatus("Modifications non enregistrées"); }

  // ---------- Canevas Drawflow ----------
  var editor = new Drawflow(container);
  editor.reroute = false;
  editor.editor_mode = locked ? "view" : "edit";
  editor.zoom_max = 1.6;
  editor.zoom_min = 0.2;
  editor.zoom_value = 0.1;
  editor.start();
  // Drawflow reconnaît le fond du canevas à sa PREMIÈRE classe (« parent-drawflow ») : sans cela, un clic sur le fond
  // ne désélectionne pas l'étape et ne permet pas de faire glisser le canevas hors de la zone déjà dessinée.
  container.className = "parent-drawflow " + container.className.replace(/\bparent-drawflow\b/, "").trim();

  var seq = 0;
  var uid = function () { return "u" + Date.now().toString(36) + "-" + (++seq); };
  var dfId = {}; // myId (chaîne stable, ex "n0", "trigger") -> id numérique attribué par Drawflow
  var lastTriggerData = null; // conservé pour pouvoir recréer le déclencheur si jamais supprimé

  function nodeHtml(type) {
    var tone = action(type).tone;
    return (
      '<div class="mk-flow-card mk-flow-card--' + type + (tone ? " is-" + tone : "") + '">' +
      '<div class="mk-flow-card-head"><span class="mk-flow-card-icon" aria-hidden="true">' + icon(iconOf(type) || "help", { size: 18 }) + "</span>" +
      '<span class="mk-flow-card-title"></span>' +
      (locked && type === "end" ? "" : '<button type="button" class="mk-flow-more" aria-haspopup="menu" aria-expanded="false">' + icon("moreHorizontal", { size: 18 }) + "</button>") +
      "</div>" +
      '<div class="mk-flow-card-sub"></div>' +
      (type === "trigger" ? "" : '<span class="mk-flow-card-orphan" title="Aucune connexion ne mène à cette étape depuis le déclencheur">Non reliée au scénario</span>') +
      (BRANCH[type] ? '<div class="mk-flow-card-ports"><span class="mk-flow-port-label mk-flow-port-yes">' + BRANCH[type].tLabel + '</span><span class="mk-flow-port-label mk-flow-port-no">' + BRANCH[type].fLabel + "</span></div>" : "") +
      "</div>"
    );
  }

  // Contexte des règles du registre pour un nœud (une condition « a ouvert » vise un AUTRE e-mail du canevas)
  function ctxFor(myId) { return { data: data, a: a, locked: locked, emailNodes: function () { return emailNodesExcept(myId); }, branches: function () { return branchesOf(myId); } }; }
  function subtitleFor(type, d, myId) { return summary(type, ctxFor(myId), d); }
  var serverTodo = {}; // nœuds signalés « à configurer » par le serveur au dernier enregistrement

  function paint(dfNodeId, type, d) {
    var wrap = document.getElementById("node-" + dfNodeId);
    if (!wrap) return;
    var myId = d && d._id;
    var title = wrap.querySelector(".mk-flow-card-title");
    var sub = wrap.querySelector(".mk-flow-card-sub");
    var ok = isConfigured(type, ctxFor(myId), d || {}) && !serverTodo[myId];
    if (title) title.textContent = LABELS[type] || type;
    if (sub) sub.textContent = ok ? subtitleFor(type, d, myId) : "Non configuré";
    wrap.classList.toggle("is-unconfigured", !ok);
    var more = wrap.querySelector(".mk-flow-more");
    if (more) more.setAttribute("aria-label", "Actions de l'étape « " + (LABELS[type] || type) + " » : " + (ok ? subtitleFor(type, d, myId) : "non configurée"));
  }
  function repaintAll() { Object.keys(dfId).forEach(function (k) { var n = nodeOf(k); if (n) paint(dfId[k], n.name, n.data); }); }

  function ioFor(type) { return type === "trigger" ? [0, 1] : BRANCH[type] ? [1, 2] : type === "end" ? [1, 0] : [1, 1]; }

  function addNode(myId, type, d, pos) {
    var io = ioFor(type);
    var full = Object.assign({}, d, { _id: myId });
    var id = editor.addNode(type, io[0], io[1], pos.x, pos.y, "mk-flow-node", full, nodeHtml(type));
    dfId[myId] = id;
    paint(id, type, d);
    if (type === "trigger") lastTriggerData = { myId: myId, data: d };
    return id;
  }

  // ---------- Chargement du canevas initial ----------
  var graph = data.canvas && Array.isArray(data.canvas.nodes) ? data.canvas : { nodes: [], edges: [] };
  graph.nodes.forEach(function (n) { addNode(n.id, n.type, n.data || {}, n.position || { x: 40, y: 40 }); });
  graph.edges.forEach(function (e) {
    // "false"/"b" (condition/split) → 2e sortie ; tout le reste (non défini, "true", "a", étape à une seule sortie) → 1re.
    var out = (e.sourceHandle === "false" || e.sourceHandle === "b") ? "output_2" : "output_1";
    var srcId = dfId[e.source], tgtId = dfId[e.target];
    if (srcId != null && tgtId != null) editor.addConnection(srcId, tgtId, out, "input_1");
  });
  if (!dfId[TRIGGER_ID]) addNode(TRIGGER_ID, "trigger", { triggers: [{ event: a.triggerEvent, filter: a.triggerFilter || {} }], triggerEvent: a.triggerEvent, triggerFilter: a.triggerFilter || {} }, { x: 40, y: 40 });
  // Les résumés (et l'état « Non configuré ») dépendent des autres étapes (une condition vise un e-mail) : redessinés
  // une fois TOUT le schéma chargé ; les étapes non reliées au déclencheur sont signalées
  setTimeout(function () { repaintAll(); markOrphans(); }, 0);

  // ---------- Étapes : menu « ⋯ » et boîte de dialogue « Modifier » ----------
  var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
  function myIdOfDf(id) { return Object.keys(dfId).filter(function (k) { return String(dfId[k]) === String(id); })[0]; }
  function nodeOf(myId) { return dfId[myId] != null ? editor.getNodeFromId(dfId[myId]) : null; }
  var withoutId = function (d) { var out = Object.assign({}, d); delete out._id; return out; };
  var nodeDom = function (myId) { return document.getElementById("node-" + dfId[myId]); };
  var triggersOf = function (d) { return Array.isArray(d.triggers) && d.triggers.length ? d.triggers : [{ event: d.triggerEvent || "", filter: d.triggerFilter || {} }]; };

  // Remplace les données d'un nœud (jamais une fusion : une clé retirée dans la boîte de dialogue disparaît vraiment)
  function setNodeData(myId, d) {
    var id = dfId[myId];
    var next = Object.assign({}, d, { _id: myId });
    editor.updateNodeDataFromId(id, next);
    paint(id, editor.getNodeFromId(id).name, next);
    if (myId === TRIGGER_ID) lastTriggerData = { myId: myId, data: next };
  }
  // Étapes « e-mail » du canevas (autres que celle en cours) : cible possible d'une condition « a ouvert / a cliqué »
  function emailNodesExcept(myId) {
    return Object.keys(dfId).filter(function (k) { return k !== myId; }).map(function (k) { return { id: k, n: nodeOf(k) }; })
      .filter(function (x) { return x.n && x.n.name === "email"; })
      .map(function (x) { return { id: x.id, label: subtitleFor("email", x.n.data) }; });
  }

  // Où mènent les deux sorties d'une condition / d'un tirage (connexions actuelles du canevas)
  function branchesOf(myId) {
    var r = dfId[myId] != null ? editor.drawflow.drawflow[editor.module].data[dfId[myId]] : null;
    var target = function (out) {
      var c = r && r.outputs[out] && r.outputs[out].connections[0];
      var t = c && myIdOfDf(c.node), tn = t && nodeOf(t);
      return tn ? (LABELS[tn.name] || tn.name) + (tn.name === "end" ? "" : " — " + subtitleFor(tn.name, tn.data, t)) : null;
    };
    return { t: target("output_1"), f: target("output_2") };
  }

  // Grande interface de configuration d'une étape (ou du déclencheur). opts.addTrigger : ouvre le déclencheur avec
  // une ligne de déclencheur supplémentaire prête à choisir (« Ajouter un déclencheur »).
  function openEditor(myId, opts) {
    opts = opts || {};
    var n = nodeOf(myId);
    if (!n || !hasEditor(n.name)) return; // « Fin » : rien à régler, aucune fenêtre vide
    closeStepMenu();
    var type = n.name, def = action(type);
    var original = type === "trigger" ? { name: a.name, triggers: clone(triggersOf(n.data)) } : withoutId(n.data);
    var initial = JSON.stringify(original);
    var draft = clone(original);
    if (type === "trigger" && opts.addTrigger && draft.triggers.length < 3) draft.triggers.push({ event: "", filter: {} });
    var ctx = ctxFor(myId);
    var body = document.createElement("div");
    body.className = "mk-step-editor";
    function rerender() { body.textContent = ""; body.appendChild(buildEditor(type, ctx, draft, rerender)); }
    rerender();
    var dom = nodeDom(myId);
    if (dom) dom.classList.add("is-editing");
    // Même fenêtre pour toutes les étapes : titre « Configurer : … » (seule mention du nom), contenu propre au type,
    // pied Annuler / Enregistrer. Aucune colonne qui répète le nom, l'icône ou un résumé.
    openStepDialog({
      title: locked ? "Réglages : " + def.label : def.title || "Configurer : " + def.label,
      body: body,
      readOnly: locked,
      isDirty: function () { return JSON.stringify(draft) !== initial; },
      onClose: function () { var d = nodeDom(myId); if (d) d.classList.remove("is-editing"); },
      onSave: function () {
        var errors = validate(type, ctx, draft);
        if (errors.length) return { errors: errors };
        var final = clean(type, draft);
        var before = clone(n.data), nameBefore = a.name;
        if (type === "trigger") {
          a.name = final.name;
          setNodeData(TRIGGER_ID, { triggers: final.triggers, triggerEvent: final.triggers[0].event, triggerFilter: final.triggers[0].filter });
        } else setNodeData(myId, final);
        changed();
        // Enregistrement immédiat du scénario ; en cas d'échec, l'étape reprend ses réglages enregistrés et la
        // fenêtre reste ouverte avec la saisie, pour réessayer (rien n'est perdu, rien n'est faussement « enregistré »)
        return persist({ quiet: true }).then(function (r) {
          if (r.ok) {
            var h1 = document.querySelector(".mk-head h1");
            if (h1) h1.textContent = a.name;
            announce("Étape « " + def.label + " » configurée.");
            toast("Configuration enregistrée.", "ok");
            return {};
          }
          a.name = nameBefore;
          setNodeData(myId, withoutId(before));
          return { errors: ["Impossible d'enregistrer les modifications. " + (r.error || "Vérifiez votre connexion puis réessayez.")] };
        });
      },
    });
  }

  function duplicateStep(myId) {
    var n = nodeOf(myId);
    var raw = editor.drawflow.drawflow[editor.module].data[dfId[myId]];
    if (!n || !raw || myId === TRIGGER_ID) return;
    var copyId = uid();
    addNode(copyId, n.name, clone(withoutId(n.data)), freeSpot({ x: raw.pos_x + NODE_W + 40, y: raw.pos_y })); // copie indépendante : aucune connexion
    changed();
    markOrphans();
    announce("Étape « " + (LABELS[n.name] || n.name) + " » dupliquée, non reliée : reliez la copie à la suite voulue.");
    persist().then(function (r) { if (r.ok) toast("Étape dupliquée.", "ok"); });
  }

  function deleteStep(myId) {
    var n = nodeOf(myId);
    if (!n || myId === TRIGGER_ID) return;
    var label = LABELS[n.name] || n.name;
    confirmAction({ title: "Supprimer cette étape ?", text: "L'étape « " + label + " » (" + subtitleFor(n.name, n.data) + ") et ses connexions seront retirées du scénario.", ok: "Supprimer" }).then(function (ok) {
      if (!ok || dfId[myId] == null) return;
      editor.removeNodeId("node-" + dfId[myId]); // retire aussi toutes ses connexions
      delete dfId[myId];
      changed();
      markOrphans();
      announce("Étape supprimée.");
      persist().then(function (r) { if (r.ok) toast("Étape supprimée.", "ok"); });
    });
  }

  function menuFor(myId, button) {
    var n = nodeOf(myId);
    if (!n) return;
    var type = n.name, items = [];
    if (hasEditor(type)) items.push({ label: locked ? "Voir les réglages" : "Configurer", run: function () { openEditor(myId); } });
    if (!locked && type === "trigger") {
      var count = triggersOf(n.data).length;
      items.push({ label: count < 3 ? "Ajouter un déclencheur" : "Ajouter un déclencheur (3 au plus)", disabled: count >= 3, run: function () { openEditor(TRIGGER_ID, { addTrigger: true }); } });
    }
    if (!locked && type !== "trigger") {
      items.push({ label: "Dupliquer", run: function () { duplicateStep(myId); } });
      items.push({ label: "Supprimer", danger: true, run: function () { deleteStep(myId); } });
    }
    if (items.length) openStepMenu(button, items, "Actions de l'étape « " + (LABELS[type] || type) + " »");
  }

  // Bouton « ⋯ » : ni glisser ni sélection Drawflow (mousedown arrêté avant d'atteindre le canevas)
  ["mousedown", "touchstart", "pointerdown"].forEach(function (evt) {
    container.addEventListener(evt, function (e) { if (e.target.closest && e.target.closest(".mk-flow-more")) e.stopPropagation(); }, true);
  });
  container.addEventListener("click", function (e) {
    var more = e.target.closest && e.target.closest(".mk-flow-more");
    if (!more) return;
    e.preventDefault();
    var nodeEl = more.closest(".drawflow-node");
    var myId = nodeEl && myIdOfDf(nodeEl.id.replace("node-", ""));
    if (myId) menuFor(myId, more);
  });
  // Clic sur un bloc (sans le déplacer) : ouvre « Modifier ». Un glisser, un point de connexion ou « ⋯ » n'ouvrent rien.
  var downAt = null;
  container.addEventListener("pointerdown", function (e) {
    var nodeEl = e.target.closest && e.target.closest(".drawflow-node");
    downAt = nodeEl && e.button === 0 && !e.target.closest(".input, .output, .mk-flow-more") ? { x: e.clientX, y: e.clientY, node: nodeEl } : null;
  }, true);
  container.addEventListener("pointerup", function (e) {
    var start = downAt; downAt = null;
    if (!start || Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > 6) return;
    var myId = myIdOfDf(start.node.id.replace("node-", ""));
    if (myId) openEditor(myId);
  });

  editor.on("nodeRemoved", function (id) {
    var gone = myIdOfDf(id);
    if (gone && gone !== TRIGGER_ID) delete dfId[gone]; // supprimé au clavier (Suppr) : l'annuaire reste exact
    markOrphans();
  });
  editor.on("nodeMoved", changed);
  // ---------- Connexions manuelles (glisser du point de sortie d'une étape au point d'entrée d'une autre) ----------
  // Seule façon de relier deux étapes. Chaque connexion créée ou supprimée est vérifiée puis enregistrée aussitôt.
  var undoingConnection = false;
  function dropConnection(c, why) {
    undoingConnection = true;
    editor.removeSingleConnection(c.output_id, c.input_id, c.output_class, c.input_class);
    undoingConnection = false;
    markOrphans();
    showError(why); toast(why, "error"); announce(why);
  }
  var connectionSave = null;
  function saveConnections() { clearTimeout(connectionSave); connectionSave = setTimeout(function () { persist({ quiet: true }).then(onConnectionSaved); }, 250); }
  var lastConnection = null;
  function onConnectionSaved(r) {
    if (r.ok || !lastConnection) return;
    // Refusée par le serveur (boucle : une connexion qui ramène en arrière) : la connexion est retirée, rien n'est perdu
    var c = lastConnection; lastConnection = null;
    var why = r.error || "Connexion impossible.";
    dropConnection(c, why);
    persist({ quiet: true }).then(function () { showError(why); }); // l'explication reste affichée après l'enregistrement
  }
  editor.on("connectionCreated", function (c) {
    if (undoingConnection) return;
    var out = editor.getNodeFromId(c.output_id).outputs[c.output_class];
    // Une sortie ne mène qu'à une étape (le moteur n'en suit qu'une) : pour changer la suite, supprimer l'ancienne connexion
    if (out && out.connections.length > 1) { dropConnection(c, "Cette sortie est déjà reliée à une étape : supprimez d'abord la connexion existante (cliquez dessus, puis « Supprimer la connexion »)."); return; }
    changed();
    markOrphans();
    lastConnection = c;
    announce("Connexion créée.");
    saveConnections();
  });
  // Suppression d'une connexion : clic dessus → bouton « Supprimer la connexion » à l'endroit du clic (ou touche Suppr)
  var selectedConn = null, lastDown = null;
  var connBtn = el("button", { type: "button", class: "mk-flow-conn-del", hidden: "" });
  connBtn.innerHTML = icon("trash", { size: 14 }); // SVG du registre fixe icons.js
  connBtn.appendChild(document.createTextNode(" Supprimer la connexion"));
  container.parentElement.appendChild(connBtn);
  container.addEventListener("mousedown", function (e) { lastDown = { x: e.clientX, y: e.clientY }; }, true);
  function hideConnBtn() { connBtn.hidden = true; }
  function removeSelectedConnection() {
    if (!selectedConn) return;
    var c = selectedConn; selectedConn = null; hideConnBtn();
    editor.removeSingleConnection(c.output_id, c.input_id, c.output_class, c.input_class); // → connectionRemoved (enregistré)
  }
  editor.on("connectionSelected", function (c) {
    if (locked) return;
    selectedConn = c;
    var box = container.parentElement.getBoundingClientRect();
    connBtn.hidden = false;
    connBtn.style.left = Math.max(8, Math.min(box.width - connBtn.offsetWidth - 8, (lastDown ? lastDown.x : box.left + box.width / 2) - box.left + 10)) + "px";
    connBtn.style.top = Math.max(8, (lastDown ? lastDown.y : box.top + 40) - box.top - connBtn.offsetHeight - 10) + "px";
    announce("Connexion sélectionnée : « Supprimer la connexion » ou touche Suppr pour la retirer.");
  });
  editor.on("connectionUnselected", function () { selectedConn = null; hideConnBtn(); });
  connBtn.addEventListener("mousedown", function (e) { e.stopPropagation(); });
  connBtn.addEventListener("click", removeSelectedConnection);
  document.addEventListener("keydown", function (e) {
    if (!selectedConn || (e.key !== "Delete" && e.key !== "Backspace")) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable], dialog")) return;
    e.preventDefault();
    removeSelectedConnection();
  });
  editor.on("connectionRemoved", function () {
    hideConnBtn();
    if (undoingConnection) return;
    changed();
    markOrphans();
    lastConnection = null;
    announce("Connexion supprimée.");
    saveConnections();
  });
  editor.on("nodeRemoved", function (id) {
    // Le déclencheur ne peut pas être supprimé : Drawflow n'offre pas de blocage par nœud,
    // on le recrée donc immédiatement s'il vient de disparaître.
    if (String(id) !== String(dfId[TRIGGER_ID])) return;
    delete dfId[TRIGGER_ID];
    var restored = lastTriggerData ? lastTriggerData.data : { triggerEvent: a.triggerEvent, triggerFilter: a.triggerFilter || {} };
    addNode(TRIGGER_ID, "trigger", restored, { x: 40, y: 40 });
    showError("Le déclencheur ne peut pas être supprimé : il a été restauré.");
    setTimeout(function () { showError(""); }, 4000);
  });

  // ---------- Ajout d'une étape (palette : clic ou glisser-déposer) ----------
  // Ajouter = créer et placer l'étape, RIEN d'autre : aucune connexion n'est jamais créée automatiquement (ni vers la
  // dernière étape, ni vers l'étape sélectionnée, ni vers celle sur laquelle on dépose). Les connexions sont faites
  // par la personne, du point de sortie d'une étape au point d'entrée d'une autre (glisser natif de Drawflow).
  var rawNode = function (myId) { return editor.drawflow.drawflow[editor.module].data[dfId[myId]]; };
  // Emplacement libre : la position voulue (centre de la zone visible, point de dépôt…) décalée vers le bas tant
  // qu'elle chevauche une étape existante — les étapes existantes ne sont jamais déplacées
  function freeSpot(pos) {
    var p = { x: Math.round(pos.x), y: Math.round(pos.y) };
    var all = Object.keys(dfId).map(rawNode).filter(Boolean);
    for (var i = 0; i < 60 && all.some(function (r) { return Math.abs(r.pos_x - p.x) < NODE_W + 16 && Math.abs(r.pos_y - p.y) < NODE_H + 16; }); i++) p.y += NODE_H + 24;
    return p;
  }
  function viewCenter() {
    var c = container.getBoundingClientRect(), r = editor.precanvas.getBoundingClientRect(), zoom = editor.zoom || 1;
    return { x: (c.left + c.width / 2 - r.left) / zoom - NODE_W / 2, y: (c.top + c.height / 3 - r.top) / zoom - NODE_H / 2 };
  }

  function addStep(type, where) {
    where = where || {};
    if (!action(type).make) return null;
    try {
      var wasDirty = dirty, statusBefore = $("au-status") ? $("au-status").textContent : "";
      var myId = uid();
      addNode(myId, type, action(type).make({ data: data, a: a }), freeSpot(where.at || viewCenter()));
      changed();
      markOrphans();
      announce("Étape « " + (LABELS[type] || type) + " » ajoutée sur le canevas, non reliée : tirez depuis le point de sortie d'une étape vers son point d'entrée pour la relier.");
      // Insérer ≠ configurer : aucune fenêtre ; l'étape est enregistrée telle quelle et se configure d'un clic.
      persist().then(function (r) {
        if (r.ok) return;
        if (dfId[myId] != null) { editor.removeNodeId("node-" + dfId[myId]); delete dfId[myId]; }
        dirty = wasDirty; setStatus(statusBefore); markOrphans();
        toast("Impossible d'ajouter cette étape. Veuillez réessayer." + (r.error ? " (" + r.error + ")" : ""), "error");
      });
      return myId;
    } catch (e) {
      console.error("[automatisation] ajout d'étape impossible", e); // erreur réelle, jamais masquée
      toast("Impossible d'ajouter cette étape. Veuillez réessayer.", "error");
      return null;
    }
  }

  // Étapes qui ne sont reliées à aucun chemin partant du déclencheur : signalées sur le canevas (et au contrôle avant
  // activation côté serveur). Un brouillon peut en contenir pendant sa construction : rien n'est relié à leur place.
  function markOrphans() {
    var reach = {}, stack = [TRIGGER_ID];
    while (stack.length) {
      var id = stack.pop();
      if (reach[id] || dfId[id] == null) continue;
      reach[id] = true;
      var r = rawNode(id);
      Object.keys((r && r.outputs) || {}).forEach(function (o) { r.outputs[o].connections.forEach(function (c) { var t = myIdOfDf(c.node); if (t) stack.push(t); }); });
    }
    Object.keys(dfId).forEach(function (k) {
      var dom = nodeDom(k);
      if (dom) dom.classList.toggle("is-orphan", k !== TRIGGER_ID && !reach[k]);
    });
  }

  var pal = null;
  if (!locked && $("au-palette")) {
    pal = buildPalette({
      root: $("au-palette"),
      workspace: $("au-workspace"),
      openButton: $("au-palette-open"),
      iconHtml: function (name, size) { return icon(name, { size: size }); },
      onAdd: function (type) { addStep(type); },
      onAddTrigger: function () { openEditor(TRIGGER_ID, { addTrigger: true }); },
    });
    // Glisser-déposer depuis la palette : l'étape est posée sous le pointeur (place libre la plus proche), jamais reliée
    var isStepDrag = function (e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, DRAG_TYPE) !== -1; };
    container.addEventListener("dragover", function (e) {
      if (!isStepDrag(e)) return;
      e.preventDefault(); e.dataTransfer.dropEffect = "copy";
      container.classList.add("is-drop-zone");
    });
    container.addEventListener("dragleave", function (e) { if (!container.contains(e.relatedTarget)) container.classList.remove("is-drop-zone"); });
    container.addEventListener("drop", function (e) {
      if (!isStepDrag(e)) return;
      e.preventDefault();
      var type = e.dataTransfer.getData(DRAG_TYPE);
      container.classList.remove("is-drop-zone");
      var r = editor.precanvas.getBoundingClientRect();
      var zoom = editor.zoom || 1;
      addStep(type, { at: { x: Math.round((e.clientX - r.left) / zoom - NODE_W / 2), y: Math.round((e.clientY - r.top) / zoom - 30) } });
    });
  }

  // ---------- Zoom ----------
  // Point fixe du zoom de Drawflow (transform-origin du canevas interne, au centre par défaut)
  function zoomOrigin() { var cs = getComputedStyle(editor.precanvas).transformOrigin.split(" "); return { x: parseFloat(cs[0]) || 0, y: parseFloat(cs[1]) || 0 }; }
  var zin = $("au-zoom-in"), zout = $("au-zoom-out"), z100 = $("au-zoom-100"), zfit = $("au-zoom-fit"), zlevel = $("au-zoom-level");
  // Contrôle de zoom : niveau affiché en direct, boutons désactivés aux limites (fonctions de zoom de Drawflow)
  function showZoom() {
    var z = editor.zoom || 1, pct = Math.round(z * 100) + " %";
    if (zlevel) zlevel.textContent = pct;
    if (z100) z100.setAttribute("aria-label", "Zoom actuel : " + pct + ". Revenir à 100 %");
    if (zin) zin.disabled = z >= editor.zoom_max - 0.001;
    if (zout) zout.disabled = z <= editor.zoom_min + 0.001;
  }
  editor.on("zoom", function () { setTimeout(showZoom, 0); });
  setTimeout(showZoom, 0);
  if (zin) zin.addEventListener("click", function () { editor.zoom_in(); });
  if (zout) zout.addEventListener("click", function () { editor.zoom_out(); });
  if (z100) z100.addEventListener("click", function () { editor.zoom_reset(); });
  if (zfit) zfit.addEventListener("click", function () {
    var ids = Object.keys(dfId);
    if (!ids.length) return;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ids.forEach(function (myId) {
      var n = editor.drawflow.drawflow[editor.module].data[dfId[myId]];
      if (!n) return;
      minX = Math.min(minX, n.pos_x); minY = Math.min(minY, n.pos_y);
      maxX = Math.max(maxX, n.pos_x + NODE_W); maxY = Math.max(maxY, n.pos_y + NODE_H);
    });
    var rect = container.getBoundingClientRect();
    var pad = 60;
    // Vue d'ensemble : peut descendre sous le zoom minimal manuel pour qu'un grand scénario tienne entièrement à l'écran
    var zoom = Math.min(1.2, Math.max(0.1, Math.min((rect.width - pad * 2) / Math.max(1, maxX - minX), (rect.height - pad * 2) / Math.max(1, maxY - minY))));
    editor.zoom = zoom; editor.zoom_last_value = zoom;
    // Drawflow agrandit depuis le CENTRE du canevas (transform-origin par défaut) : l'origine entre dans le calcul
    var o = zoomOrigin();
    var spanW = (maxX - minX) * zoom, spanH = (maxY - minY) * zoom;
    var offX = Math.max(pad, (rect.width - spanW) / 2), offY = Math.max(pad, (rect.height - spanH) / 2);
    editor.canvas_x = offX - o.x - (minX - o.x) * zoom; editor.canvas_y = offY - o.y - (minY - o.y) * zoom;
    editor.precanvas.style.transform = "translate(" + editor.canvas_x + "px, " + editor.canvas_y + "px) scale(" + editor.zoom + ")";
    editor.dispatch("zoom", editor.zoom);
  });

  // Centre le canevas sur UN nœud précis (zoom conservé, juste le cadrage) : utilisé par le contrôle avant
  // activation ci-dessous pour amener directement à l'étape fautive plutôt que de laisser chercher à l'œil.
  function centerOnNode(myId) {
    var n = editor.drawflow.drawflow[editor.module].data[dfId[myId]];
    if (!n) return false;
    var rect = container.getBoundingClientRect();
    var zoom = Math.min(1, Math.max(editor.zoom_min, editor.zoom || 1));
    var cx = n.pos_x + NODE_W / 2, cy = n.pos_y + NODE_H / 2;
    editor.zoom = zoom; editor.zoom_last_value = zoom;
    var o = zoomOrigin();
    editor.canvas_x = rect.width / 2 - o.x - (cx - o.x) * zoom;
    editor.canvas_y = rect.height / 2 - o.y - (cy - o.y) * zoom;
    editor.precanvas.style.transform = "translate(" + editor.canvas_x + "px, " + editor.canvas_y + "px) scale(" + editor.zoom + ")";
    editor.dispatch("zoom", editor.zoom);
    return true;
  }
  function selectNode(myId) {
    var prev = container.querySelector(".drawflow-node.selected");
    if (prev) prev.classList.remove("selected");
    var dom = nodeDom(myId);
    if (dom) dom.classList.add("selected");
    openEditor(myId);
  }

  // ---------- Contrôle avant activation : sauter directement au nœud fautif ----------
  document.querySelectorAll("[data-au-goto-template]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var templateId = parseInt(btn.getAttribute("data-au-goto-template"), 10);
      var target = Object.keys(dfId).filter(function (myId) {
        var n = editor.getNodeFromId(dfId[myId]);
        return n && n.data && n.data.templateId === templateId;
      })[0];
      if (!target) { announce("Cette étape n'est plus sur le canevas."); return; }
      centerOnNode(target);
      selectNode(target);
      announce("Étape sélectionnée sur le canevas.");
    });
  });

  // ---------- Enregistrement ----------
  function exportGraph() {
    var raw = editor.export().drawflow[editor.module].data;
    var dfToMy = {};
    Object.keys(raw).forEach(function (dfNodeId) { var n = raw[dfNodeId]; dfToMy[dfNodeId] = n.data._id; });
    var nodes = Object.keys(raw).map(function (dfNodeId) {
      var n = raw[dfNodeId];
      var d = Object.assign({}, n.data); delete d._id;
      return { id: n.data._id, type: n.name, data: d, position: { x: n.pos_x, y: n.pos_y } };
    });
    var edges = [];
    var eseq = 0;
    Object.keys(raw).forEach(function (dfNodeId) {
      var n = raw[dfNodeId];
      Object.keys(n.outputs || {}).forEach(function (outKey) {
        (n.outputs[outKey].connections || []).forEach(function (c) {
          var extra = {};
          if (BRANCH[n.name]) extra = outKey === "output_1" ? { sourceHandle: BRANCH[n.name].tHandle, label: BRANCH[n.name].tLabel } : { sourceHandle: BRANCH[n.name].fHandle, label: BRANCH[n.name].fLabel };
          edges.push(Object.assign({ id: "e" + (++eseq), source: n.data._id, target: dfToMy[c.node] }, extra));
        });
      });
    });
    return { nodes: nodes, edges: edges };
  }

  var saving = null; // promesse de l'enregistrement en cours
  var again = false;
  function toast(t, type) { if (typeof window.mkToast === "function") window.mkToast(t, type); }
  // Envoie le scénario complet (nom, déclencheurs, canevas) ; le serveur en dérive et valide les étapes exécutées
  function persist(opts) {
    opts = opts || {};
    if (locked) return Promise.resolve({ ok: false });
    if (saving) { again = true; return saving.then(function () { return again ? (again = false, persist(opts)) : { ok: !dirty }; }); }
    showError(""); setStatus("Enregistrement…");
    var canvas = exportGraph();
    var trig = editor.getNodeFromId(dfId[TRIGGER_ID]).data;
    var triggers = triggersOf(trig);
    var payload = { name: a.name, triggers: triggers, triggerEvent: triggers[0].event, triggerFilter: triggers[0].filter, canvas: canvas };
    saving = fetch("/marketing/automatisations/" + a.id, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (r) {
        if (r.ok) {
          dirty = false;
          serverTodo = {};
          (r.j.incomplete || []).forEach(function (x) { serverTodo[x.id] = true; });
          var todo = (r.j.incomplete || []).length;
          setStatus("Enregistré à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + (todo ? " · " + todo + " étape" + (todo > 1 ? "s" : "") + " à configurer" : ""));
          repaintAll();
          return { ok: true, incomplete: r.j.incomplete || [] };
        }
        setStatus("Non enregistré");
        console.error("[automatisation] enregistrement refusé par le serveur", r.j);
        showError((r.j && r.j.error) || "Enregistrement impossible.");
        if (!opts.quiet) toast("Le scénario n'a pas pu être enregistré : " + ((r.j && r.j.error) || "erreur inconnue"), "error");
        return { ok: false, error: r.j && r.j.error };
      })
      .catch(function (err) { console.error("[automatisation] enregistrement impossible", err); setStatus("Non enregistré"); showError("Enregistrement impossible pour le moment (connexion ?)."); return { ok: false }; })
      .then(function (r) { saving = null; return r; });
    return saving;
  }
  // Bouton « Enregistrer » du haut (déplacements, connexions, ajouts) : rechargement pour actualiser le contrôle avant activation
  function save() { persist().then(function (r) { if (r.ok) window.location.reload(); }); }
  var saveBtn = $("au-save");
  if (saveBtn) saveBtn.addEventListener("click", save);
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
})();
