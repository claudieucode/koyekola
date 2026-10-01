/* Éditeur d'étapes d'un scénario. Le serveur valide et normalise tout : ce script ne fait que composer la liste.
   Aucune donnée n'est insérée comme HTML (textContent / value uniquement). */
(function () {
  "use strict";
  var node = document.getElementById("mk-automation-data");
  if (!node) return;
  var data = JSON.parse(node.textContent);
  var locked = !!data.readOnly;
  var a = data.automation;
  var steps = JSON.parse(JSON.stringify(a.steps || []));
  var $ = function (id) { return document.getElementById(id); };
  var UNITS = [["minutes", "minutes"], ["hours", "heures"], ["days", "jours"]];
  var LABELS = { email: "Envoyer un e-mail", wait: "Attendre", condition: "Condition", add_tag: "Ajouter une étiquette", remove_tag: "Retirer une étiquette", add_to_list: "Ajouter à une liste", remove_from_list: "Retirer d'une liste", end: "Fin" };
  var MAKE = {
    email: function () { return { type: "email", templateId: data.templates.length ? data.templates[0].id : null, trackClicks: a.kind === "marketing" }; },
    wait: function () { return { type: "wait", amount: 1, unit: "days" }; },
    condition: function () { var s = data.segments[0]; return { type: "condition", check: "segment", definition: s ? JSON.parse(JSON.stringify(s.definition)) : null, onTrue: "next", onFalse: "exit", _segmentId: s ? s.id : null }; },
    add_tag: function () { return { type: "add_tag", tag: "" }; },
    remove_tag: function () { return { type: "remove_tag", tag: "" }; },
    add_to_list: function () { return { type: "add_to_list", listId: data.lists.length ? data.lists[0].id : null }; },
    remove_from_list: function () { return { type: "remove_from_list", listId: data.lists.length ? data.lists[0].id : null }; },
    end: function () { return { type: "end" }; }
  };
  var dirty = false;

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function announce(t) { var l = $("au-live"); if (l) { l.textContent = ""; setTimeout(function () { l.textContent = t; }, 30); } }
  function changed() { dirty = true; var s = $("au-status"); if (s) s.textContent = "Modifications non enregistrées"; }
  function showError(message) { var b = $("au-error"); b.textContent = message || ""; b.hidden = !message; }

  // ---------- Déclencheur ----------
  var trigger = $("au-trigger");
  Object.keys(data.triggers).forEach(function (key) { trigger.appendChild(el("option", { value: key }, data.triggers[key].label)); });
  trigger.value = a.triggerEvent;
  var name = $("au-name");
  name.value = a.name;
  var filterWrap = $("au-filter-wrap"), filterValue = $("au-filter-value"), filterLabel = $("au-filter-label");
  function currentFilterKey() { var f = data.triggers[trigger.value].filters; return f.length ? f[0] : null; }
  function syncFilter() {
    var f = currentFilterKey();
    filterWrap.hidden = !f;
    if (f) filterLabel.textContent = f[1];
  }
  syncFilter();
  filterValue.value = a.triggerFilter && a.triggerFilter.value ? a.triggerFilter.value : "";
  [trigger, name, filterValue].forEach(function (i) {
    if (locked) i.disabled = true;
    i.addEventListener("input", changed);
  });
  trigger.addEventListener("change", function () { syncFilter(); filterValue.value = ""; });

  // ---------- Étapes ----------
  var list = $("au-steps");
  function field(labelText, control) {
    var w = el("div", { "class": "field-group" });
    w.appendChild(el("label", { "for": control.id }, labelText));
    w.appendChild(control);
    return w;
  }
  var uid = 0;
  function select(step, key, options, onChange) {
    var s = el("select", { id: "au-f-" + (++uid) });
    options.forEach(function (o) { s.appendChild(el("option", { value: String(o[0]) }, o[1])); });
    s.value = step[key] == null ? "" : String(step[key]);
    if (locked) s.disabled = true;
    s.addEventListener("change", function () { onChange(s.value); changed(); });
    return s;
  }

  var CHECKS = [["segment", "Le contact correspond à un segment"], ["opened", "Un e-mail précédent a été ouvert"], ["clicked", "Un e-mail précédent a été cliqué"]];

  // Ce que « Si oui » / « Sinon » peuvent viser : l'étape suivante, la sortie du scénario, ou une étape PLUS LOIN
  // par son numéro (embranchement réel : les DEUX chemins peuvent continuer différemment, ex. e-mail A / e-mail B).
  // Jamais en arrière : cela créerait une boucle (refusé aussi côté serveur, mais on ne le propose même pas ici).
  function jumpOptions(index) {
    return [["next", "passer à l'étape suivante"], ["exit", "sortir du scénario"]].concat(
      steps.map(function (s, i) { return [i, "aller à l'étape " + (i + 1) + " : " + (LABELS[s.type] || s.type)]; }).filter(function (pair) { return pair[0] > index; })
    );
  }

  function stepFields(step, index) {
    var f = [];
    if (step.type === "email") {
      if (!data.templates.length) f.push(el("p", { "class": "mk-note" }, "Aucun modèle de ce type : créez d'abord un modèle « " + (a.kind === "marketing" ? "marketing" : "transactionnel") + " » dans Modèles."));
      f.push(field("Modèle", select(step, "templateId", data.templates.map(function (t) { return [t.id, t.name]; }), function (v) { step.templateId = parseInt(v, 10); })));
      var cb = el("input", { type: "checkbox", id: "au-f-" + (++uid) });
      cb.checked = !!step.trackClicks; if (locked) cb.disabled = true;
      cb.addEventListener("change", function () { step.trackClicks = cb.checked; changed(); });
      var lab = el("label", { "class": "checkbox-row", "for": cb.id }); lab.appendChild(cb); lab.appendChild(document.createTextNode(" Suivre les clics"));
      f.push(lab);
    } else if (step.type === "wait") {
      var n = el("input", { type: "number", min: "1", step: "1", id: "au-f-" + (++uid) });
      n.value = step.amount == null ? "" : String(step.amount); if (locked) n.disabled = true;
      n.addEventListener("input", function () { step.amount = n.value === "" ? undefined : parseInt(n.value, 10); changed(); });
      f.push(field("Durée", n));
      f.push(field("Unité", select(step, "unit", UNITS, function (v) { step.unit = v; })));
    } else if (step.type === "condition") {
      if (step.check === undefined) step.check = "segment";
      f.push(field("Condition", select(step, "check", CHECKS, function (v) {
        step.check = v;
        if (v === "segment" && step.definition === undefined) { var s0 = data.segments[0]; step.definition = s0 ? JSON.parse(JSON.stringify(s0.definition)) : null; step._segmentId = s0 ? s0.id : null; }
        if (v !== "segment" && step.ref === undefined) step.ref = null;
        render(); changed();
      })));
      if (step.check === "segment") {
        if (!data.segments.length) f.push(el("p", { "class": "mk-note" }, "Aucun segment enregistré : créez-en un dans Segments pour l'utiliser comme condition."));
        var opts = data.segments.map(function (s) { return [s.id, s.name]; });
        if (step.definition && step._segmentId == null) opts.unshift(["", "Segment enregistré précédemment (conservé)"]);
        f.push(field("Le contact doit correspondre au segment", select(step, "_segmentId", opts, function (v) {
          var seg = data.segments.filter(function (s) { return String(s.id) === v; })[0];
          if (seg) { step._segmentId = seg.id; step.definition = JSON.parse(JSON.stringify(seg.definition)); }
        })));
        f.push(el("p", { "class": "field-hint" }, "La définition du segment est copiée dans le scénario au moment de l'enregistrement."));
      } else {
        var emailSteps = steps.map(function (s, i) { return [i, s]; }).filter(function (pair) { return pair[0] < index && pair[1].type === "email"; });
        if (!emailSteps.length) f.push(el("p", { "class": "mk-note" }, "Aucun e-mail avant cette étape : ajoutez d'abord une étape « Envoyer un e-mail » plus haut dans la liste."));
        var refOpts = emailSteps.map(function (pair) { return [pair[0], "L'e-mail de l'étape " + (pair[0] + 1)]; });
        f.push(field("E-mail concerné", select(step, "ref", refOpts, function (v) { step.ref = parseInt(v, 10); })));
      }
      f.push(field("Si oui…", select(step, "onTrue", jumpOptions(index), function (v) { step.onTrue = (v === "next" || v === "exit") ? v : parseInt(v, 10); })));
      f.push(field("Sinon…", select(step, "onFalse", jumpOptions(index), function (v) { step.onFalse = (v === "next" || v === "exit") ? v : parseInt(v, 10); })));
      f.push(el("p", { "class": "field-hint" }, "Les numéros d'étape se recalculent si vous en ajoutez ou en enlevez, mais pas leur SENS : vérifiez ces deux réglages après avoir réorganisé les étapes."));
    } else if (step.type === "add_tag" || step.type === "remove_tag") {
      var t = el("input", { type: "text", maxlength: "64", id: "au-f-" + (++uid) });
      t.value = step.tag || ""; if (locked) t.disabled = true;
      t.addEventListener("input", function () { step.tag = t.value; changed(); });
      f.push(field("Étiquette", t));
    } else if (step.type === "add_to_list" || step.type === "remove_from_list") {
      if (!data.lists.length) f.push(el("p", { "class": "mk-note" }, "Aucune liste : créez-en une dans Listes."));
      f.push(field("Liste", select(step, "listId", data.lists.map(function (l) { return [l.id, l.name]; }), function (v) { step.listId = parseInt(v, 10); })));
    } else if (step.type === "end") {
      f.push(el("p", { "class": "field-hint" }, "Le passage du contact se termine ici."));
    }
    return f;
  }

  function move(from, to) {
    if (to < 0 || to >= steps.length) return;
    var s = steps.splice(from, 1)[0];
    steps.splice(to, 0, s);
    render(); changed();
    var btn = list.querySelectorAll(".mk-handle")[to]; if (btn) btn.focus();
    announce("Étape déplacée en position " + (to + 1) + " sur " + steps.length + ".");
  }

  function render() {
    list.textContent = "";
    if (!steps.length) list.appendChild(el("p", { "class": "field-hint" }, "Aucune étape : ajoutez-en une ci-dessous."));
    steps.forEach(function (step, index) {
      var card = el("div", { "class": "mk-block", role: "group", "aria-label": "Étape " + (index + 1) + " : " + LABELS[step.type] });
      var head = el("div", { "class": "mk-block-head" });
      head.appendChild(el("span", { "class": "mk-block-title" }, (index + 1) + ". " + (LABELS[step.type] || step.type)));
      if (!locked) {
        var up = el("button", { type: "button", "class": "mk-icon-btn mk-handle", "aria-label": "Monter l'étape " + (index + 1) }, "↑");
        up.disabled = index === 0; up.addEventListener("click", function () { move(index, index - 1); });
        var down = el("button", { type: "button", "class": "mk-icon-btn", "aria-label": "Descendre l'étape " + (index + 1) }, "↓");
        down.disabled = index === steps.length - 1; down.addEventListener("click", function () { move(index, index + 1); });
        var del = el("button", { type: "button", "class": "mk-icon-btn", "aria-label": "Supprimer l'étape " + (index + 1) }, "✕");
        del.addEventListener("click", function () { steps.splice(index, 1); render(); changed(); announce("Étape supprimée."); });
        [up, down, del].forEach(function (b) { head.appendChild(b); });
      }
      card.appendChild(head);
      var body = el("div", { "class": "mk-block-body" });
      stepFields(step, index).forEach(function (n) { body.appendChild(n); });
      card.appendChild(body);
      list.appendChild(card);
    });
  }

  if (!locked) {
    var add = $("au-add");
    Object.keys(MAKE).forEach(function (type) {
      var b = el("button", { type: "button", "class": "btn btn-outline btn-sm" }, "+ " + LABELS[type]);
      b.addEventListener("click", function () {
        steps.push(MAKE[type]()); render(); changed();
        var cards = list.querySelectorAll(".mk-block"); var last = cards[cards.length - 1];
        var first = last && last.querySelector("input, select"); if (first) first.focus();
        announce("Étape « " + LABELS[type] + " » ajoutée en position " + steps.length + ".");
      });
      add.appendChild(b);
    });
  }

  // ---------- Enregistrement ----------
  function payload() {
    var f = currentFilterKey();
    var v = filterValue.value.trim();
    return {
      name: name.value, triggerEvent: trigger.value, triggerFilter: f && v ? { key: f[0], value: v } : {},
      steps: steps.map(function (s) {
        var o = { type: s.type };
        if (s.type === "email") { o.templateId = s.templateId; o.trackClicks = !!s.trackClicks; }
        else if (s.type === "wait") { o.amount = s.amount; o.unit = s.unit; }
        else if (s.type === "condition") {
          o.check = s.check || "segment";
          if (o.check === "segment") o.definition = s.definition;
          else o.ref = s.ref;
          o.onTrue = s.onTrue === undefined ? "next" : s.onTrue;
          o.onFalse = s.onFalse === undefined ? "exit" : s.onFalse;
        }
        else if (s.type === "add_tag" || s.type === "remove_tag") { o.tag = s.tag; }
        else if (s.type === "add_to_list" || s.type === "remove_from_list") { o.listId = s.listId; }
        return o;
      })
    };
  }
  var saveBtn = $("au-save");
  var saving = false;
  function save() {
    if (locked || saving) return;
    saving = true; showError(""); $("au-status").textContent = "Enregistrement…";
    fetch("/marketing/automatisations/" + a.id, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (r) {
        if (r.ok) { dirty = false; $("au-status").textContent = "Enregistré."; window.location.reload(); }
        else { $("au-status").textContent = "Non enregistré"; showError(r.j.error || "Enregistrement impossible."); }
      })
      .catch(function () { $("au-status").textContent = "Non enregistré"; showError("Enregistrement impossible pour le moment."); })
      .then(function () { saving = false; });
  }
  if (saveBtn) saveBtn.addEventListener("click", save);
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  // les segments reconnus sont présélectionnés (comparaison de la définition copiée)
  steps.forEach(function (s) {
    if (s.type !== "condition" || !s.definition) return;
    var json = JSON.stringify(s.definition);
    var m = data.segments.filter(function (g) { return JSON.stringify(g.definition) === json; })[0];
    if (m) s._segmentId = m.id;
  });
  render();
})();
