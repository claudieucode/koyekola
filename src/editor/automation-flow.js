// Éditeur visuel d'un scénario d'automatisation (canevas de nœuds/arêtes, via Drawflow).
// Le canevas est une simple VUE d'édition : à l'enregistrement, il est envoyé tel quel comme `canvas`
// et le serveur en dérive les `steps` exécutés par le moteur (src/marketing/automations/graph.js).
// Réglage d'une étape : clic sur le bloc (ou « ⋯ » → Modifier) → boîte de dialogue (./automation/stepEditors.js) qui
// modifie un brouillon ; « Enregistrer » l'applique au nœud puis enregistre aussitôt le scénario sur le serveur.
// Aucune donnée n'est insérée comme HTML : uniquement textContent / value, jamais innerHTML sur du texte saisi.
import Drawflow from "drawflow";
import { icon } from "../utils/icons";
import { STEP_LABELS } from "../utils/stepLabels";
import { openStepDialog, openStepMenu, closeStepMenu, confirmAction } from "./automation/ui";
import { UNITS, CHECKS, FIELD_LABELS, hasEditor, buildEditor, validate, clean } from "./automation/stepEditors";

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
  // Icônes du design system du site (src/utils/icons.js), les mêmes que partout ailleurs — jamais d'emoji.
  var ICON_NAMES = { trigger: "zap", email: "mail", wait: "clock", wait_for_event: "bell", condition: "gitBranch", split: "shuffle", update_field: "sliders", add_tag: "tag", remove_tag: "tag", add_to_list: "list", remove_from_list: "list", end: "stopCircle" };
  // Titre de la boîte de dialogue de chaque type d'étape
  var DIALOG_TITLES = { trigger: "Modifier le déclencheur", email: "Modifier l'e-mail", wait: "Modifier l'attente", wait_for_event: "Modifier « Attendre jusqu'à »", condition: "Modifier la condition", split: "Modifier le tirage aléatoire", update_field: "Mettre à jour un champ", add_tag: "Ajouter une étiquette", remove_tag: "Retirer une étiquette", add_to_list: "Ajouter à une liste", remove_from_list: "Retirer d'une liste" };
  // Types d'étape à DEUX sorties — mêmes noms de handle que graph.js#BRANCH_FIELDS côté serveur (tHandle/fHandle) :
  // s'ils divergent, une condition/un split se traduit vers la mauvaise branche sans qu'aucune erreur ne le signale.
  var BRANCH = { condition: { t: "onTrue", f: "onFalse", tHandle: "true", fHandle: "false", tLabel: "Oui", fLabel: "Non" }, split: { t: "onA", f: "onB", tHandle: "a", fHandle: "b", tLabel: "A", fLabel: "B" } };
  var MAKE = {
    email: function () { return { templateId: data.templates.length ? data.templates[0].id : null, trackClicks: a.kind === "marketing" }; },
    wait: function () { return { amount: 1, unit: "days" }; },
    wait_for_event: function () { return { event: "", amount: 7, unit: "days" }; },
    condition: function () { var s = data.segments[0]; return { check: "segment", definition: s ? JSON.parse(JSON.stringify(s.definition)) : null, _segmentId: s ? s.id : null }; },
    split: function () { return { percentage: 50 }; },
    update_field: function () { return { field: "first_name", value: "" }; },
    add_tag: function () { return { tag: "" }; },
    remove_tag: function () { return { tag: "" }; },
    add_to_list: function () { return { listId: data.lists.length ? data.lists[0].id : null }; },
    remove_from_list: function () { return { listId: data.lists.length ? data.lists[0].id : null }; },
    end: function () { return {}; },
  };

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
  editor.zoom_min = 0.4;
  editor.zoom_value = 0.1;
  editor.start();

  var seq = 0;
  var uid = function () { return "u" + Date.now().toString(36) + "-" + (++seq); };
  var dfId = {}; // myId (chaîne stable, ex "n0", "trigger") -> id numérique attribué par Drawflow
  var lastTriggerData = null; // conservé pour pouvoir recréer le déclencheur si jamais supprimé

  function nodeHtml(type) {
    return (
      '<div class="mk-flow-card mk-flow-card--' + type + '">' +
      '<div class="mk-flow-card-icon" aria-hidden="true">' + icon(ICON_NAMES[type] || "help", { size: 18 }) + "</div>" +
      '<div class="mk-flow-card-body"><div class="mk-flow-card-title"></div><div class="mk-flow-card-sub"></div></div>' +
      (locked && (type === "end") ? "" : '<button type="button" class="mk-flow-more" aria-haspopup="menu" aria-expanded="false">' + icon("moreHorizontal", { size: 18 }) + "</button>") +
      (BRANCH[type] ? '<div class="mk-flow-card-ports"><span class="mk-flow-port-label mk-flow-port-yes">' + BRANCH[type].tLabel + '</span><span class="mk-flow-port-label mk-flow-port-no">' + BRANCH[type].fLabel + "</span></div>" : "") +
      "</div>"
    );
  }

  function subtitleFor(type, d) {
    if (type === "trigger") {
      // ATTENTION : `data.triggers` (fermeture externe) est le CATALOGUE global {clé: {label,filters}} ; `d.triggers`
      // (ce nœud) est la liste — 1 à 3 — des déclencheurs CONFIGURÉS ici. Même nom, portées différentes.
      var t = data.triggers[d.triggerEvent];
      var base = (t ? t.label : d.triggerEvent) + (d.triggerFilter && d.triggerFilter.value ? " · " + d.triggerFilter.value : "");
      var n = Array.isArray(d.triggers) ? d.triggers.length : 1;
      return base + (n > 1 ? " (+ " + (n - 1) + " autre" + (n > 2 ? "s" : "") + ")" : "");
    }
    if (type === "email") { var tpl = data.templates.filter(function (x) { return x.id === d.templateId; })[0]; return tpl ? tpl.name : "Aucun modèle sélectionné"; }
    if (type === "wait") return (d.amount == null ? "?" : d.amount) + " " + (UNITS.filter(function (u) { return u[0] === d.unit; })[0] || [null, d.unit])[1];
    if (type === "wait_for_event") return (d.event || "Événement non défini") + " (" + (d.amount == null ? "?" : d.amount) + " " + (UNITS.filter(function (u) { return u[0] === d.unit; })[0] || [null, d.unit])[1] + " au plus)";
    if (type === "split") return (d.percentage == null ? "?" : d.percentage) + " % vers A";
    if (type === "update_field") {
      var label = d.field && d.field.indexOf("property:") === 0 ? "Propriété « " + d.field.slice(9) + " »" : FIELD_LABELS[d.field] || d.field || "Champ non défini";
      return label + " = " + (d.value ? "« " + d.value + " »" : "(vide)");
    }
    if (type === "condition") {
      if (d.check === "segment") {
        if (d._segmentId != null) { var seg = data.segments.filter(function (s) { return s.id === d._segmentId; })[0]; return "Segment : " + (seg ? seg.name : "—"); }
        var n = d.definition && Array.isArray(d.definition.rules) ? d.definition.rules.length : 0;
        return n ? n + " critère" + (n > 1 ? "s" : "") + " (" + (d.definition.op === "or" ? "OU" : "ET") + ")" : "Condition à construire";
      }
      return "Le contact " + (CHECKS.filter(function (c) { return c[0] === d.check; })[0] || [null, d.check])[1];
    }
    if (type === "add_tag" || type === "remove_tag") return d.tag ? "« " + d.tag + " »" : "Étiquette non définie";
    if (type === "add_to_list" || type === "remove_from_list") { var l = data.lists.filter(function (x) { return x.id === d.listId; })[0]; return l ? l.name : "Aucune liste sélectionnée"; }
    if (type === "end") return "Fin du passage";
    return "";
  }

  function paint(dfNodeId, type, d) {
    var wrap = document.getElementById("node-" + dfNodeId);
    if (!wrap) return;
    var title = wrap.querySelector(".mk-flow-card-title");
    var sub = wrap.querySelector(".mk-flow-card-sub");
    if (title) title.textContent = LABELS[type] || type;
    if (sub) sub.textContent = subtitleFor(type, d);
    var more = wrap.querySelector(".mk-flow-more");
    if (more) more.setAttribute("aria-label", "Actions de l'étape « " + (LABELS[type] || type) + " » : " + subtitleFor(type, d));
  }

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

  // ---------- Étapes : menu « ⋯ » et boîte de dialogue « Modifier » ----------
  var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
  var myIdOfDf = function (id) { return Object.keys(dfId).filter(function (k) { return String(dfId[k]) === String(id); })[0]; };
  var nodeOf = function (myId) { return dfId[myId] != null ? editor.getNodeFromId(dfId[myId]) : null; };
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

  function openEditor(myId) {
    var n = nodeOf(myId);
    if (!n || !hasEditor(n.name)) return; // « Fin » : rien à régler, aucune fenêtre vide
    closeStepMenu();
    var type = n.name;
    var original = type === "trigger" ? { name: a.name, triggers: clone(triggersOf(n.data)) } : withoutId(n.data);
    var initial = JSON.stringify(original);
    var draft = clone(original);
    var ctx = { data: data, a: a, locked: locked, emailNodes: function () { return emailNodesExcept(myId); } };
    var body = document.createElement("div");
    body.className = "mk-step-editor";
    function rerender() { body.textContent = ""; body.appendChild(buildEditor(type, ctx, draft, rerender)); }
    rerender();
    var dom = nodeDom(myId);
    if (dom) dom.classList.add("is-editing");
    openStepDialog({
      title: locked ? "Réglages : " + (LABELS[type] || type) : DIALOG_TITLES[type] || LABELS[type],
      iconHtml: icon(ICON_NAMES[type] || "help", { size: 20 }),
      body: body,
      wide: type === "condition" || type === "trigger",
      readOnly: locked,
      isDirty: function () { return JSON.stringify(draft) !== initial; },
      onClose: function () { var d = nodeDom(myId); if (d) d.classList.remove("is-editing"); },
      onSave: function () {
        var errors = validate(type, ctx, draft);
        if (errors.length) return { errors: errors };
        var final = clean(type, draft);
        if (type === "trigger") {
          a.name = final.name;
          var h1 = document.querySelector(".mk-head h1");
          if (h1) h1.textContent = a.name;
          setNodeData(TRIGGER_ID, { triggers: final.triggers, triggerEvent: final.triggers[0].event, triggerFilter: final.triggers[0].filter });
        } else setNodeData(myId, final);
        changed();
        announce("Étape « " + (LABELS[type] || type) + " » mise à jour.");
        // Enregistrement immédiat du scénario : la valeur survit à un rechargement sans autre action
        return persist().then(function (r) { if (r.ok) toast("Étape enregistrée.", "ok"); return {}; });
      },
    });
  }

  function duplicateStep(myId) {
    var n = nodeOf(myId);
    var raw = editor.drawflow.drawflow[editor.module].data[dfId[myId]];
    if (!n || !raw || myId === TRIGGER_ID) return;
    var copyId = uid();
    addNode(copyId, n.name, clone(withoutId(n.data)), { x: raw.pos_x + 40, y: raw.pos_y + NODE_H + 40 });
    changed();
    announce("Étape « " + (LABELS[n.name] || n.name) + " » dupliquée : reliez la copie à la suite voulue.");
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
      announce("Étape supprimée.");
      persist().then(function (r) { if (r.ok) toast("Étape supprimée.", "ok"); });
    });
  }

  function menuFor(myId, button) {
    var n = nodeOf(myId);
    if (!n) return;
    var type = n.name, items = [];
    if (hasEditor(type)) items.push({ label: locked ? "Voir les réglages" : "Modifier", run: function () { openEditor(myId); } });
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
  });
  editor.on("nodeMoved", changed);
  editor.on("connectionCreated", changed);
  editor.on("connectionRemoved", changed);
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

  // ---------- Palette : ajouter une étape ----------
  if (!locked) {
    var palette = $("au-add");
    var addCount = 0;
    Object.keys(MAKE).forEach(function (type) {
      var b = el("button", { type: "button", class: "btn btn-outline btn-sm" }, "+ " + LABELS[type]);
      b.addEventListener("click", function () {
        var myId = uid();
        var pos = { x: 320 + (addCount % 3) * 260, y: 260 + Math.floor(addCount / 3) * 170 };
        addCount++;
        addNode(myId, type, MAKE[type](), pos);
        changed();
        announce("Étape « " + LABELS[type] + " » ajoutée sur le canevas.");
        openEditor(myId); // réglée tout de suite (sauf « Fin », sans réglage)
      });
      palette.appendChild(b);
    });
  }

  // ---------- Zoom ----------
  var zin = $("au-zoom-in"), zout = $("au-zoom-out"), z100 = $("au-zoom-100"), zfit = $("au-zoom-fit");
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
    var zoom = Math.min(1.2, Math.max(editor.zoom_min, Math.min((rect.width - pad * 2) / Math.max(1, maxX - minX), (rect.height - pad * 2) / Math.max(1, maxY - minY))));
    editor.zoom = zoom; editor.zoom_last_value = zoom;
    editor.canvas_x = -minX * zoom + pad; editor.canvas_y = -minY * zoom + pad;
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
    editor.canvas_x = rect.width / 2 - cx * zoom;
    editor.canvas_y = rect.height / 2 - cy * zoom;
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
  function persist() {
    if (locked) return Promise.resolve({ ok: false });
    if (saving) { again = true; return saving.then(function () { return again ? (again = false, persist()) : { ok: !dirty }; }); }
    showError(""); setStatus("Enregistrement…");
    var canvas = exportGraph();
    var trig = editor.getNodeFromId(dfId[TRIGGER_ID]).data;
    var triggers = triggersOf(trig);
    var payload = { name: a.name, triggers: triggers, triggerEvent: triggers[0].event, triggerFilter: triggers[0].filter, canvas: canvas };
    saving = fetch("/marketing/automatisations/" + a.id, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (r) {
        if (r.ok) { dirty = false; setStatus("Enregistré à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })); return { ok: true }; }
        setStatus("Non enregistré");
        showError((r.j && r.j.error) || "Enregistrement impossible.");
        toast("Le scénario n'a pas pu être enregistré : " + ((r.j && r.j.error) || "erreur inconnue"), "error");
        return { ok: false, error: r.j && r.j.error };
      })
      .catch(function () { setStatus("Non enregistré"); showError("Enregistrement impossible pour le moment (connexion ?)."); return { ok: false }; })
      .then(function (r) { saving = null; return r; });
    return saving;
  }
  // Bouton « Enregistrer » du haut (déplacements, connexions, ajouts) : rechargement pour actualiser le contrôle avant activation
  function save() { persist().then(function (r) { if (r.ok) window.location.reload(); }); }
  var saveBtn = $("au-save");
  if (saveBtn) saveBtn.addEventListener("click", save);
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
})();
