// Éditeur visuel d'un scénario d'automatisation (canevas de nœuds/arêtes, via Drawflow).
// Le canevas est une simple VUE d'édition : à l'enregistrement, il est envoyé tel quel comme `canvas`
// et le serveur en dérive les `steps` exécutés par le moteur (src/marketing/automations/graph.js).
// Aucune donnée n'est insérée comme HTML : uniquement textContent / value, jamais innerHTML sur du texte saisi.
import Drawflow from "drawflow";
import { icon } from "../utils/icons";
import { STEP_LABELS } from "../utils/stepLabels";

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
  var UNITS = [["minutes", "minutes"], ["hours", "heures"], ["days", "jours"]];
  var CHECKS = [["segment", "correspond à un segment"], ["opened", "a ouvert un e-mail précédent"], ["clicked", "a cliqué un e-mail précédent"]];
  // Mêmes champs que steps.js#EDITABLE_FIELDS (jamais l'e-mail ni le statut) : à tenir synchronisé avec le serveur.
  var FIELD_OPTIONS = [["first_name", "Prénom"], ["last_name", "Nom"], ["phone", "Téléphone"], ["company", "Société"], ["country", "Pays"], ["language", "Langue"], ["source", "Source"]];
  var FIELD_LABELS = {}; FIELD_OPTIONS.forEach(function (f) { FIELD_LABELS[f[0]] = f[1]; });
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

  // ---------- Panneau latéral ----------
  var panel = $("au-panel");
  var selectedMyId = null;

  function field(labelText, control) {
    var w = el("div", { class: "field-group" });
    w.appendChild(el("label", { for: control.id }, labelText));
    w.appendChild(control);
    return w;
  }
  function makeSelect(options, value, onChange) {
    var s = el("select", { id: "au-p-" + (++seq) });
    options.forEach(function (o) { s.appendChild(el("option", { value: String(o[0]) }, o[1])); });
    s.value = value == null ? "" : String(value);
    if (locked) s.disabled = true;
    s.addEventListener("change", function () { onChange(s.value); });
    return s;
  }
  function makeText(value, maxlength, onChange) {
    var t = el("input", { type: "text", id: "au-p-" + (++seq), maxlength: String(maxlength || 200) });
    t.value = value || "";
    if (locked) t.disabled = true;
    t.addEventListener("input", function () { onChange(t.value); });
    return t;
  }
  function makeNumber(value, onChange) {
    var n = el("input", { type: "number", min: "1", step: "1", id: "au-p-" + (++seq) });
    n.value = value == null ? "" : String(value);
    if (locked) n.disabled = true;
    n.addEventListener("input", function () { onChange(n.value === "" ? undefined : parseInt(n.value, 10)); });
    return n;
  }

  // ---------- Condition construite ici (ET/OU), sans passer par un segment déjà enregistré ----------
  // Même format que le moteur de segments (src/marketing/segments/engine.js) : { op: "and"|"or", rules: [...] },
  // volontairement PLAT (pas de groupes imbriqués, comme le constructeur visuel de la page Segments en mode
  // simple) — une réimplémentation compacte plutôt qu'un partage de code avec public/js/marketing-segments.js,
  // les deux panneaux (page dédiée vs panneau latéral étroit) n'ayant pas la même mise en page ; le format de
  // données, lui, reste identique et interchangeable (une condition construite ici a exactement la forme d'un
  // segment enregistré, et réciproquement).
  var CATALOG_BY_FIELD = {};
  (data.segmentCatalog || []).forEach(function (f) { CATALOG_BY_FIELD[f.field] = f; });
  var STATUS_LABELS = { unknown: "Pas de consentement", subscribed: "Abonné", unsubscribed: "Désinscrit", bounced: "Rebond", complained: "Plainte", suppressed: "Bloqué" };

  function cmpInfoFor(field, cmp) {
    var f = CATALOG_BY_FIELD[field];
    return f ? f.cmps.filter(function (c) { return c.cmp === cmp; })[0] : null;
  }
  function defaultRuleValue(f, c) {
    if (c.value === "range") return ["", ""];
    if (c.value === "status" || c.value === "select") return f.options[0];
    if (c.value === "list") return f.lists && f.lists.length ? f.lists[0].id : undefined;
    if (c.value === "none") return undefined;
    return c.value === "days" || c.value === "number" ? undefined : "";
  }
  function ruleIsComplete(rule) {
    var c = cmpInfoFor(rule.field, rule.cmp);
    if (!c) return false;
    if (c.value === "none") return true;
    var v = rule.value;
    if (c.value === "range") return Array.isArray(v) && isFinite(v[0]) && isFinite(v[1]) && v[0] !== "" && v[1] !== "";
    if (c.value === "textlist") return Array.isArray(v) && v.length > 0;
    if (c.value === "days" || c.value === "number" || c.value === "list") return typeof v === "number" && isFinite(v);
    return typeof v === "string" && v !== "";
  }
  function ruleValueControl(rule, c, f, onChange) {
    var wrap = el("span", { class: "mk-value" });
    function input(type, extra) {
      var i = el("input", Object.assign({ type: type, id: "au-p-" + (++seq) }, extra || {}));
      if (locked) i.disabled = true;
      return i;
    }
    if (c.value === "text") {
      var t = input("text", { maxlength: "200" }); t.value = rule.value || "";
      t.addEventListener("input", function () { rule.value = t.value; onChange(false); });
      wrap.appendChild(t);
    } else if (c.value === "textlist") {
      var tl = input("text", {}); tl.value = (rule.value || []).join(", ");
      tl.addEventListener("input", function () { rule.value = tl.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean); onChange(false); });
      wrap.appendChild(tl);
    } else if (c.value === "date") {
      var dt = input("date", {}); dt.value = rule.value || "";
      dt.addEventListener("input", function () { rule.value = dt.value; onChange(false); });
      wrap.appendChild(dt);
    } else if (c.value === "days" || c.value === "number") {
      var nb = input("number", c.value === "days" ? { min: "0", step: "1" } : { step: "any" });
      nb.value = rule.value === undefined ? "" : String(rule.value);
      nb.addEventListener("input", function () { rule.value = nb.value === "" ? undefined : (c.value === "days" ? parseInt(nb.value, 10) : Number(nb.value)); onChange(false); });
      wrap.appendChild(nb);
    } else if (c.value === "range") {
      if (!Array.isArray(rule.value)) rule.value = ["", ""];
      [0, 1].forEach(function (k) {
        var r = input("number", { step: "any", "aria-label": k ? "Maximum" : "Minimum" });
        r.value = rule.value[k] === "" ? "" : String(rule.value[k]);
        r.addEventListener("input", function () { rule.value[k] = r.value === "" ? "" : Number(r.value); onChange(false); });
        wrap.appendChild(r);
      });
    } else if (c.value === "status" || c.value === "select" || c.value === "list") {
      var options = c.value === "list" ? (f.lists || []).map(function (l) { return [l.id, l.name]; }) : f.options.map(function (o) { return [o, c.value === "status" ? (STATUS_LABELS[o] || o) : o]; });
      var sel = makeSelect(options, rule.value, function (v) { rule.value = c.value === "list" ? Number(v) : v; onChange(false); });
      wrap.appendChild(sel);
    }
    return wrap;
  }
  // renderRows : true → reconstruit tout (changement de structure, ex. champ/comparateur) ; false → valeur seule (pas de perte de focus)
  function buildConditionEditor(myId) {
    var box = el("div", { class: "mk-cond-builder" });
    // editor.getNodeFromId() renvoie un CLONE JSON à chaque appel (jamais la même référence) : le relire après une
    // mutation locale perdrait le changement. `def` est donc lu UNE SEULE fois puis gardé comme unique source de
    // vérité en mémoire tant que ce panneau existe ; chaque mutation (ligne ajoutée, champ changé…) le modifie en
    // place, et `commit()` envoie CET objet — jamais un nouveau clone relu entre-temps.
    var live = editor.getNodeFromId(dfId[myId]).data;
    var def = (live.definition && typeof live.definition === "object" && Array.isArray(live.definition.rules)) ? live.definition : { op: "and", rules: [] };
    function commit() { saveNodeData(myId, { definition: def }); }
    function renderRows(full) {
      if (!full) return;
      box.textContent = "";

      var opRow = el("div", { class: "mk-group-op" });
      opRow.appendChild(el("span", {}, "Le contact respecte"));
      opRow.appendChild(makeSelect([["and", "tous les critères (ET)"], ["or", "au moins un critère (OU)"]], def.op || "and", function (v) { def.op = v; commit(); }));
      box.appendChild(opRow);

      if (!def.rules.length) box.appendChild(el("p", { class: "field-hint" }, "Aucun critère : ajoutez-en un."));
      def.rules.forEach(function (raw, index) {
        var not = raw && raw.op === "not";
        var rule = not ? raw.rule : raw;
        if (!rule || !CATALOG_BY_FIELD[rule.field]) return;
        var f = CATALOG_BY_FIELD[rule.field];
        var line = el("div", { class: "mk-rule" });

        var notLabel = el("label", { class: "mk-not" });
        var notCb = el("input", { type: "checkbox" }); notCb.checked = not; if (locked) notCb.disabled = true;
        notCb.addEventListener("change", function () { def.rules[index] = notCb.checked ? { op: "not", rule: rule } : rule; commit(); });
        notLabel.appendChild(notCb); notLabel.appendChild(document.createTextNode(" NON"));
        line.appendChild(notLabel);

        var groups = {};
        var fieldSelEl = el("select", { id: "au-p-" + (++seq), "aria-label": "Champ" });
        (data.segmentCatalog || []).forEach(function (c) {
          if (!groups[c.group]) { groups[c.group] = el("optgroup", { label: c.group }); fieldSelEl.appendChild(groups[c.group]); }
          groups[c.group].appendChild(el("option", { value: c.field }, c.label));
        });
        fieldSelEl.value = rule.field; if (locked) fieldSelEl.disabled = true;
        fieldSelEl.addEventListener("change", function () {
          var nf = CATALOG_BY_FIELD[fieldSelEl.value];
          var next = { field: fieldSelEl.value, cmp: nf.cmps[0].cmp, value: defaultRuleValue(nf, nf.cmps[0]) };
          def.rules[index] = not ? { op: "not", rule: next } : next;
          commit(); renderRows(true);
        });
        line.appendChild(fieldSelEl);

        var cmpSelEl = makeSelect(f.cmps.map(function (c) { return [c.cmp, c.label]; }), rule.cmp, function (v) {
          rule.cmp = v; rule.value = defaultRuleValue(f, cmpInfoFor(rule.field, v)); commit(); renderRows(true);
        });
        line.appendChild(cmpSelEl);

        var c = cmpInfoFor(rule.field, rule.cmp);
        if (c && c.value !== "none") line.appendChild(ruleValueControl(rule, c, f, commit));
        if (f.note) line.appendChild(el("p", { class: "mk-rule-note field-hint" }, f.note));

        if (!locked) {
          var rm = el("button", { type: "button", class: "btn btn-outline btn-sm", "aria-label": "Supprimer le critère " + (index + 1) }, "Supprimer");
          rm.addEventListener("click", function () { def.rules.splice(index, 1); commit(); renderRows(true); });
          line.appendChild(rm);
        }
        box.appendChild(line);
      });

      if (!locked) {
        var add = el("button", { type: "button", class: "btn btn-outline btn-sm" }, "+ Ajouter un critère");
        add.addEventListener("click", function () {
          var f0 = (data.segmentCatalog || [])[0];
          if (!f0) return;
          def.rules.push({ field: f0.field, cmp: f0.cmps[0].cmp, value: defaultRuleValue(f0, f0.cmps[0]) });
          commit(); renderRows(true);
        });
        box.appendChild(add);
      }
    }
    renderRows(true);
    return box;
  }

  function saveNodeData(myId, patch) {
    var id = dfId[myId];
    var current = editor.getNodeFromId(id).data;
    var next = Object.assign({}, current, patch);
    editor.updateNodeDataFromId(id, next);
    var type = editor.getNodeFromId(id).name;
    paint(id, type, next);
    if (myId === TRIGGER_ID) lastTriggerData = { myId: myId, data: next };
    changed();
  }

  function panelFor(myId) {
    var id = dfId[myId];
    var n = editor.getNodeFromId(id);
    var type = n.name, d = n.data;
    panel.textContent = "";
    var h = el("h3", { class: "mk-flow-panel-title" });
    h.appendChild(iconEl(ICON_NAMES[type] || "help", { size: 16 }));
    h.appendChild(document.createTextNode(" " + (LABELS[type] || type)));
    panel.appendChild(h);

    if (type === "trigger") {
      var nameInput = makeText(a.name, 150, function (v) { a.name = v; changed(); });
      panel.appendChild(field("Nom du scénario", nameInput));
      // CATALOGUE global (voir la remarque dans subtitleFor) — jamais confondu avec `d.triggers`, la liste (1 à 3)
      // des déclencheurs configurés sur CE nœud, la seule chose qu'on modifie dans cette boucle.
      var triggerCatalog = data.triggers;
      if (!Array.isArray(d.triggers) || !d.triggers.length) d.triggers = [{ event: d.triggerEvent || "", filter: d.triggerFilter || {} }];
      var triggerOpts = Object.keys(triggerCatalog).map(function (k) { return [k, triggerCatalog[k].label]; });
      function commitTriggers() { saveNodeData(myId, { triggers: d.triggers, triggerEvent: d.triggers[0].event, triggerFilter: d.triggers[0].filter }); }

      d.triggers.forEach(function (trig, ti) {
        if (d.triggers.length > 1) panel.appendChild(el("h4", { class: "mk-trigger-row-title" }, "Déclencheur " + (ti + 1) + " sur " + d.triggers.length));
        var isCustomTrigger = !triggerCatalog[trig.event];
        if (isCustomTrigger && trig.event) panel.appendChild(el("p", { class: "mk-note" }, "Déclencheur personnalisé actuel : « " + trig.event + " ». Choisir un élément ci-dessous le remplace."));
        panel.appendChild(field("Se déclenche quand…", makeSelect(triggerOpts, trig.event, function (v) {
          trig.event = v; trig.filter = {};
          commitTriggers(); panelFor(myId);
        })));
        var filters = triggerCatalog[trig.event] ? triggerCatalog[trig.event].filters : [];
        if (filters.length) {
          var fv = makeText(trig.filter && trig.filter.value, 200, function (v) { trig.filter = v ? { key: filters[0][0], value: v } : {}; commitTriggers(); });
          panel.appendChild(field(filters[0][1], fv));
        }
        // « change » (pas « input ») : ne s'applique qu'une fois la saisie terminée (Entrée/perte du focus), sinon
        // chaque frappe redessinerait le panneau entier (via panelFor, pour rafraîchir la note ci-dessus) et
        // interromprait la saisie à la première lettre.
        var customTrigger = el("input", { type: "text", id: "au-p-" + (++seq), maxlength: "64", pattern: "[a-z][a-z0-9_.]{1,63}", placeholder: "mon_evenement.special" });
        if (locked) customTrigger.disabled = true;
        customTrigger.addEventListener("change", function () {
          if (customTrigger.value) { trig.event = customTrigger.value; trig.filter = {}; commitTriggers(); panelFor(myId); }
        });
        panel.appendChild(field("…ou un événement personnalisé (remplace le choix ci-dessus ; par exemple un événement envoyé par l'API)", customTrigger));
        if (!locked && d.triggers.length > 1) {
          var rmTrigger = el("button", { type: "button", class: "btn btn-outline btn-sm" }, "Retirer ce déclencheur");
          rmTrigger.addEventListener("click", function () { d.triggers.splice(ti, 1); commitTriggers(); panelFor(myId); });
          panel.appendChild(rmTrigger);
        }
      });
      if (!locked && d.triggers.length < 3) {
        var addTrigger = el("button", { type: "button", class: "btn btn-outline btn-sm" }, "+ Ajouter un déclencheur (" + d.triggers.length + "/3)");
        addTrigger.addEventListener("click", function () {
          d.triggers.push({ event: Object.keys(triggerCatalog)[0] || "", filter: {} });
          commitTriggers(); panelFor(myId);
        });
        panel.appendChild(addTrigger);
      }
      if (d.triggers.length > 1) panel.appendChild(el("p", { class: "field-hint" }, "N'importe lequel de ces déclencheurs démarre ce scénario (jusqu'à 3, comme les flux d'automatisation Mailchimp)."));
    } else if (type === "email") {
      if (!data.templates.length) panel.appendChild(el("p", { class: "mk-note" }, "Aucun modèle de ce type : créez d'abord un modèle « " + (a.kind === "marketing" ? "marketing" : "transactionnel") + " » dans Modèles."));
      panel.appendChild(field("Modèle", makeSelect(data.templates.map(function (t) { return [t.id, t.name]; }), d.templateId, function (v) { saveNodeData(myId, { templateId: parseInt(v, 10) }); })));
      var cb = el("input", { type: "checkbox", id: "au-p-" + (++seq) });
      cb.checked = !!d.trackClicks; if (locked) cb.disabled = true;
      cb.addEventListener("change", function () { saveNodeData(myId, { trackClicks: cb.checked }); });
      var lab = el("label", { class: "checkbox-row", for: cb.id }); lab.appendChild(cb); lab.appendChild(document.createTextNode(" Suivre les clics"));
      panel.appendChild(lab);
    } else if (type === "wait") {
      panel.appendChild(field("Durée", makeNumber(d.amount, function (v) { saveNodeData(myId, { amount: v }); })));
      panel.appendChild(field("Unité", makeSelect(UNITS, d.unit, function (v) { saveNodeData(myId, { unit: v }); })));
    } else if (type === "wait_for_event") {
      var evInput = el("input", { type: "text", id: "au-p-" + (++seq), maxlength: "64", pattern: "[a-z][a-z0-9_.]{1,63}", placeholder: "lms.course_completed" });
      evInput.value = d.event || ""; if (locked) evInput.disabled = true;
      evInput.addEventListener("change", function () { saveNodeData(myId, { event: evInput.value }); });
      panel.appendChild(field("Nom de l'événement attendu", evInput));
      panel.appendChild(field("Délai maximal", makeNumber(d.amount, function (v) { saveNodeData(myId, { amount: v }); })));
      panel.appendChild(field("Unité", makeSelect(UNITS, d.unit, function (v) { saveNodeData(myId, { unit: v }); })));
      panel.appendChild(el("p", { class: "field-hint" }, "Si l'événement n'arrive jamais, le scénario reprend quand même une fois le délai maximal écoulé — jamais d'attente sans fin."));
    } else if (type === "condition" || type === "split") {
      if (type === "condition") {
        panel.appendChild(field("Condition", makeSelect(CHECKS.map(function (c) { return [c[0], "Le contact " + c[1]]; }), d.check, function (v) {
          var patch = { check: v };
          if (v === "segment" && d.definition === undefined) { var s0 = data.segments[0]; patch.definition = s0 ? JSON.parse(JSON.stringify(s0.definition)) : null; patch._segmentId = s0 ? s0.id : null; }
          saveNodeData(myId, patch); panelFor(myId);
        })));
        if (d.check === "segment") {
          var segMode = d._segmentId != null ? "saved" : "custom";
          panel.appendChild(field("Comment définir la condition ?", makeSelect(
            [["saved", "Choisir un segment déjà enregistré"], ["custom", "Construire une condition ici (ET / OU)"]], segMode,
            function (v) {
              if (v === "saved") { var s0 = data.segments[0]; saveNodeData(myId, { _segmentId: s0 ? s0.id : null, definition: s0 ? JSON.parse(JSON.stringify(s0.definition)) : null }); }
              else saveNodeData(myId, { _segmentId: null, definition: (d.definition && Array.isArray(d.definition.rules)) ? d.definition : { op: "and", rules: [] } });
              panelFor(myId);
            }
          )));
          if (segMode === "saved") {
            if (!data.segments.length) panel.appendChild(el("p", { class: "mk-note" }, "Aucun segment enregistré : créez-en un dans Segments, ou construisez la condition ici."));
            var segOpts = data.segments.map(function (s) { return [s.id, s.name]; });
            panel.appendChild(field("Segment", makeSelect(segOpts, d._segmentId, function (v) {
              var seg = data.segments.filter(function (s) { return String(s.id) === v; })[0];
              if (seg) saveNodeData(myId, { _segmentId: seg.id, definition: JSON.parse(JSON.stringify(seg.definition)) });
            })));
          } else {
            if (!data.segmentCatalog || !data.segmentCatalog.length) panel.appendChild(el("p", { class: "mk-note" }, "Aucun champ disponible."));
            else panel.appendChild(buildConditionEditor(myId));
          }
        } else {
          var refOpts = graph_.nodesOfType("email").filter(function (p) { return p.id !== myId; }).map(function (p) { return [p.id, "L'e-mail « " + subtitleFor("email", editor.getNodeFromId(dfId[p.id]).data) + " »"]; });
          if (!refOpts.length) panel.appendChild(el("p", { class: "mk-note" }, "Aucune étape « e-mail » sur le canevas : ajoutez-en une pour vérifier son ouverture ou son clic."));
          panel.appendChild(field("E-mail concerné", makeSelect(refOpts, d.ref, function (v) { saveNodeData(myId, { ref: v }); })));
        }
      } else {
        panel.appendChild(field("Pourcentage vers « A »", makeNumber(d.percentage, function (v) { saveNodeData(myId, { percentage: v }); })));
        panel.appendChild(el("p", { class: "field-hint" }, "Tirage aléatoire à chaque passage : aucun lien avec les données du contact (utile pour un test A/B sur le parcours lui-même)."));
      }
      panel.appendChild(el("p", { class: "field-hint" }, "Reliez la sortie « " + BRANCH[type].tLabel + " » et la sortie « " + BRANCH[type].fLabel + " » du nœud aux étapes voulues sur le canevas."));
    } else if (type === "update_field") {
      var isProp = typeof d.field === "string" && d.field.indexOf("property:") === 0;
      panel.appendChild(field("Champ à modifier", makeSelect(FIELD_OPTIONS, isProp ? "" : d.field, function (v) { saveNodeData(myId, { field: v }); })));
      var propInput = makeText(isProp ? d.field.slice(9) : "", 40, function (v) { if (v) saveNodeData(myId, { field: "property:" + v }); });
      panel.appendChild(field("…ou le nom d'une propriété personnalisée (remplace le choix ci-dessus)", propInput));
      panel.appendChild(field("Nouvelle valeur", makeText(d.value, 300, function (v) { saveNodeData(myId, { value: v }); })));
    } else if (type === "add_tag" || type === "remove_tag") {
      panel.appendChild(field("Étiquette", makeText(d.tag, 64, function (v) { saveNodeData(myId, { tag: v }); })));
    } else if (type === "add_to_list" || type === "remove_from_list") {
      if (!data.lists.length) panel.appendChild(el("p", { class: "mk-note" }, "Aucune liste : créez-en une dans Listes."));
      panel.appendChild(field("Liste", makeSelect(data.lists.map(function (l) { return [l.id, l.name]; }), d.listId, function (v) { saveNodeData(myId, { listId: parseInt(v, 10) }); })));
    } else if (type === "end") {
      panel.appendChild(el("p", { class: "field-hint" }, "Le passage du contact se termine ici."));
    }

    if (!locked && type !== "trigger") {
      var del = el("button", { type: "button", class: "btn btn-outline btn-sm mk-flow-panel-delete" }, "Supprimer cette étape");
      del.addEventListener("click", function () {
        editor.removeNodeId("node-" + id);
        delete dfId[myId];
        closePanel();
        changed();
        announce("Étape supprimée.");
      });
      panel.appendChild(del);
    }
  }

  function closePanel() {
    selectedMyId = null;
    panel.textContent = "";
    panel.appendChild(el("p", { class: "field-hint mk-flow-panel-empty" }, "Cliquez sur une étape du schéma pour la régler ici."));
  }
  closePanel();

  // petit annuaire pour retrouver les nœuds d'un type donné (utilisé par le panneau « condition »)
  var graph_ = {
    nodesOfType: function (type) {
      var out = [];
      Object.keys(dfId).forEach(function (myId) {
        var n = editor.getNodeFromId(dfId[myId]);
        if (n && n.name === type) out.push({ id: myId, data: n.data });
      });
      return out;
    },
  };

  editor.on("nodeSelected", function (id) {
    // Drawflow émet l'identifiant en chaîne (tiré de l'id DOM "node-<n>"), alors qu'addNode() renvoie un nombre :
    // comparaison en chaîne des deux côtés, sinon la correspondance échoue toujours (===).
    var myId = Object.keys(dfId).filter(function (k) { return String(dfId[k]) === String(id); })[0];
    if (!myId) return;
    selectedMyId = myId;
    panelFor(myId);
  });
  editor.on("nodeUnselected", closePanel);
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
    var dom = document.getElementById("node-" + dfId[myId]);
    if (dom) { dom.classList.add("selected"); editor.node_selected = dom; }
    selectedMyId = myId;
    panelFor(myId);
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

  var saving = false;
  function save() {
    if (locked || saving) return;
    saving = true; showError(""); setStatus("Enregistrement…");
    var canvas = exportGraph();
    var trig = editor.getNodeFromId(dfId[TRIGGER_ID]).data;
    var triggers = Array.isArray(trig.triggers) && trig.triggers.length ? trig.triggers : [{ event: trig.triggerEvent, filter: trig.triggerFilter || {} }];
    var payload = { name: a.name, triggers: triggers, triggerEvent: triggers[0].event, triggerFilter: triggers[0].filter, canvas: canvas };
    fetch("/marketing/automatisations/" + a.id, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (r) {
        if (r.ok) { dirty = false; setStatus("Enregistré."); window.location.reload(); }
        else { setStatus("Non enregistré"); showError(r.j.error || "Enregistrement impossible."); }
      })
      .catch(function () { setStatus("Non enregistré"); showError("Enregistrement impossible pour le moment."); })
      .then(function () { saving = false; });
  }
  var saveBtn = $("au-save");
  if (saveBtn) saveBtn.addEventListener("click", save);
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
})();
