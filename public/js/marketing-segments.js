/* Constructeur visuel de segments : une liste de critères (ET / OU, avec NON par critère) qui produit la définition JSON.
   Les groupes imbriqués se règlent dans le mode avancé (JSON). Aucune donnée n'est insérée comme HTML : uniquement textContent. */
(function () {
  "use strict";
  var root = document.getElementById("mk-builder");
  var catalogNode = document.getElementById("mk-catalog");
  var textarea = document.getElementById("mk-definition");
  if (!root || !catalogNode || !textarea) return;

  var catalog = JSON.parse(catalogNode.textContent);
  var byField = {};
  catalog.forEach(function (f) { byField[f.field] = f; });
  var readOnly = root.getAttribute("data-readonly") === "1";
  var STATUS_LABELS = { unknown: "Pas de consentement", subscribed: "Abonné", unsubscribed: "Désinscrit", bounced: "Rebond", complained: "Plainte", suppressed: "Bloqué" };

  var model = { op: "and", rows: [] };
  var flat = true;

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Définition → modèle plat ; renvoie false si elle contient des groupes imbriqués (mode avancé seulement)
  function fromDefinition(def) {
    if (!def || (def.op !== "and" && def.op !== "or") || !Array.isArray(def.rules)) return false;
    var rows = [];
    for (var i = 0; i < def.rules.length; i++) {
      var r = def.rules[i], not = false;
      if (r && r.op === "not") { not = true; r = r.rule; }
      if (!r || r.op !== undefined || typeof r.field !== "string" || !byField[r.field]) return false;
      if (r.course !== undefined && !byField[r.field].supportsCourse) return false;
      rows.push({ not: not, field: r.field, cmp: r.cmp, value: r.value, course: r.course });
    }
    model = { op: def.op, rows: rows };
    return true;
  }

  function cmpInfo(row) {
    var f = byField[row.field];
    return f ? f.cmps.filter(function (c) { return c.cmp === row.cmp; })[0] : null;
  }

  function isComplete(row) {
    var c = cmpInfo(row);
    if (!c) return false;
    if (c.value === "none") return true;
    var v = row.value;
    if (c.value === "range") return Array.isArray(v) && isFinite(v[0]) && isFinite(v[1]) && v[0] !== "" && v[1] !== "";
    if (c.value === "textlist") return Array.isArray(v) && v.length > 0;
    if (c.value === "days" || c.value === "number" || c.value === "list") return typeof v === "number" && isFinite(v);
    return typeof v === "string" && v !== "";
  }

  function toDefinition() {
    var rules = model.rows.filter(isComplete).map(function (row) {
      var rule = { field: row.field, cmp: row.cmp };
      if (cmpInfo(row).value !== "none") rule.value = row.value;
      if (row.course !== undefined && byField[row.field].supportsCourse) rule.course = row.course;
      return row.not ? { op: "not", rule: rule } : rule;
    });
    return { op: model.op, rules: rules };
  }

  function sync() {
    var def = toDefinition();
    textarea.value = def.rules.length ? JSON.stringify(def, null, 2) : "";
    updateSummary();
    schedulePreview();
  }

  function defaultValue(f, c) {
    if (c.value === "range") return ["", ""];
    if (c.value === "status") return f.options[0];
    if (c.value === "select") return f.options[0];
    if (c.value === "list") return f.lists && f.lists.length ? f.lists[0].id : undefined;
    if (c.value === "none") return undefined;
    return c.value === "days" || c.value === "number" ? undefined : "";
  }

  function valueControl(row, c, f, onChange) {
    var wrap = el("span", { "class": "mk-value" });
    var label = "Valeur";
    function input(type, get, set, extra) {
      var i = el("input", Object.assign({ type: type, "aria-label": label, disabled: readOnly ? "" : null }, extra || {}));
      if (!readOnly) i.removeAttribute("disabled"); else i.setAttribute("disabled", "");
      i.value = get();
      i.addEventListener("input", function () { set(i.value); onChange(); });
      return i;
    }
    if (c.value === "text") wrap.appendChild(input("text", function () { return row.value || ""; }, function (v) { row.value = v; }, { maxlength: "200" }));
    else if (c.value === "textlist") wrap.appendChild(input("text", function () { return (row.value || []).join(", "); }, function (v) { row.value = v.split(",").map(function (s) { return s.trim(); }).filter(Boolean); }));
    else if (c.value === "date") wrap.appendChild(input("date", function () { return row.value || ""; }, function (v) { row.value = v; }));
    else if (c.value === "days") wrap.appendChild(input("number", function () { return row.value === undefined ? "" : String(row.value); }, function (v) { row.value = v === "" ? undefined : parseInt(v, 10); }, { min: "0", step: "1" }));
    else if (c.value === "number" && f.kind === "event") wrap.appendChild(input("number", function () { return row.value === undefined ? "" : String(row.value); }, function (v) { row.value = v === "" ? undefined : parseInt(v, 10); }, { min: "1", step: "1" }));
    else if (c.value === "number") wrap.appendChild(input("number", function () { return row.value === undefined ? "" : String(row.value); }, function (v) { row.value = v === "" ? undefined : Number(v); }, { step: "any" }));
    else if (c.value === "range") {
      if (!Array.isArray(row.value)) row.value = ["", ""];
      [0, 1].forEach(function (k) {
        wrap.appendChild(input("number", function () { return row.value[k] === "" ? "" : String(row.value[k]); }, function (v) { row.value[k] = v === "" ? "" : Number(v); }, { step: "any", "aria-label": k ? "Maximum" : "Minimum" }));
      });
    } else if (c.value === "status" || c.value === "select" || c.value === "list") {
      var sel = el("select", { "aria-label": label });
      if (readOnly) sel.setAttribute("disabled", "");
      var options = c.value === "list" ? (f.lists || []).map(function (l) { return [String(l.id), l.name]; })
        : f.options.map(function (o) { return [o, c.value === "status" ? STATUS_LABELS[o] || o : o]; });
      options.forEach(function (o) { sel.appendChild(el("option", { value: o[0] }, o[1])); });
      sel.value = row.value === undefined ? "" : String(row.value);
      if (sel.value === "" && options.length) { sel.value = options[0][0]; row.value = c.value === "list" ? Number(options[0][0]) : options[0][0]; }
      sel.addEventListener("change", function () { row.value = c.value === "list" ? Number(sel.value) : sel.value; onChange(); });
      wrap.appendChild(sel);
    }
    return wrap;
  }

  function render() {
    root.textContent = "";
    if (!flat) {
      root.appendChild(el("p", { "class": "mk-note" }, "Cette définition contient des groupes imbriqués : modifiez-la dans le mode avancé (JSON) ci-dessous."));
      return;
    }
    var op = el("div", { "class": "mk-group-op" });
    op.appendChild(el("span", {}, "Contacts qui respectent"));
    var opSel = el("select", { "aria-label": "Logique entre les critères" });
    opSel.appendChild(el("option", { value: "and" }, "tous les critères (ET)"));
    opSel.appendChild(el("option", { value: "or" }, "au moins un critère (OU)"));
    opSel.value = model.op;
    if (readOnly) opSel.setAttribute("disabled", "");
    opSel.addEventListener("change", function () { model.op = opSel.value; sync(); });
    op.appendChild(opSel);
    root.appendChild(op);

    if (!model.rows.length) root.appendChild(el("p", { "class": "field-hint" }, "Aucun critère : ajoutez-en un."));
    model.rows.forEach(function (row, index) {
      var box = el("div", { "class": "mk-rule" });
      var f = byField[row.field];

      var notLabel = el("label", { "class": "mk-not" });
      var not = el("input", { type: "checkbox" });
      not.checked = !!row.not;
      if (readOnly) not.setAttribute("disabled", "");
      not.addEventListener("change", function () { row.not = not.checked; sync(); });
      notLabel.appendChild(not);
      notLabel.appendChild(document.createTextNode(" NON"));
      box.appendChild(notLabel);

      var fieldSel = el("select", { "aria-label": "Champ" });
      var groups = {};
      catalog.forEach(function (c) {
        if (!groups[c.group]) { groups[c.group] = el("optgroup", { label: c.group }); fieldSel.appendChild(groups[c.group]); }
        groups[c.group].appendChild(el("option", { value: c.field }, c.label));
      });
      fieldSel.value = row.field;
      if (readOnly) fieldSel.setAttribute("disabled", "");
      fieldSel.addEventListener("change", function () {
        row.field = fieldSel.value;
        var nf = byField[row.field];
        row.cmp = nf.cmps[0].cmp;
        row.value = defaultValue(nf, nf.cmps[0]);
        row.course = undefined;
        render(); sync();
      });
      box.appendChild(fieldSel);

      var cmpSel = el("select", { "aria-label": "Comparateur" });
      f.cmps.forEach(function (c) { cmpSel.appendChild(el("option", { value: c.cmp }, c.label)); });
      cmpSel.value = row.cmp;
      if (readOnly) cmpSel.setAttribute("disabled", "");
      cmpSel.addEventListener("change", function () {
        row.cmp = cmpSel.value;
        row.value = defaultValue(f, cmpInfo(row));
        render(); sync();
      });
      box.appendChild(cmpSel);

      var c = cmpInfo(row);
      if (c && c.value !== "none") box.appendChild(valueControl(row, c, f, sync));

      if (f.kind === "event" && f.supportsCourse) {
        var courseWrap = el("div", { "class": "mk-rule-course" });
        if (f.courses && f.courses.length) {
          var courseId = "mk-course-" + index;
          courseWrap.appendChild(el("label", { "for": courseId }, "Formation"));
          var courseSel = el("select", { id: courseId });
          if (readOnly) courseSel.setAttribute("disabled", "");
          courseSel.appendChild(el("option", { value: "" }, "Toutes les formations"));
          f.courses.forEach(function (co) { courseSel.appendChild(el("option", { value: String(co.id) }, co.title)); });
          courseSel.value = row.course === undefined ? "" : String(row.course);
          if (courseSel.value === "" && row.course !== undefined) { courseSel.appendChild(el("option", { value: String(row.course) }, "Formation n° " + row.course)); courseSel.value = String(row.course); }
          courseSel.addEventListener("change", function () { row.course = courseSel.value === "" ? undefined : parseInt(courseSel.value, 10); sync(); });
          courseWrap.appendChild(courseSel);
        } else {
          courseWrap.appendChild(el("span", { "class": "field-hint" }, "Aucune formation connue pour l'instant : le critère porte sur toutes les formations."));
        }
        box.appendChild(courseWrap);
      }
      if (f.note) box.appendChild(el("p", { "class": "mk-rule-note" }, f.note));

      if (!readOnly) {
        var remove = el("button", { type: "button", "class": "btn btn-outline btn-sm", "aria-label": "Supprimer le critère " + (index + 1) }, "Supprimer");
        remove.addEventListener("click", function () { model.rows.splice(index, 1); render(); sync(); });
        box.appendChild(remove);
      }
      root.appendChild(box);
    });

    if (!readOnly) {
      var add = el("button", { type: "button", "class": "btn btn-outline btn-sm" }, "+ Ajouter un critère");
      add.addEventListener("click", function () {
        var f = catalog[0];
        model.rows.push({ not: false, field: f.field, cmp: f.cmps[0].cmp, value: defaultValue(f, f.cmps[0]) });
        render(); sync();
      });
      root.appendChild(add);
    }
  }

  // --- Résumé en français ---
  var summaryBox = document.getElementById("mk-summary");
  function valueText(row, c, f) {
    var v = row.value;
    if (c.value === "none") return "";
    if (c.value === "range") return Array.isArray(v) ? v[0] + " et " + v[1] : "";
    if (c.value === "textlist") return (v || []).join(", ");
    if (c.value === "status") return STATUS_LABELS[v] || String(v);
    if (c.value === "list") { var l = (f.lists || []).filter(function (x) { return x.id === v; })[0]; return l ? "« " + l.name + " »" : String(v); }
    if (c.value === "days") return String(v);
    if (c.value === "text" && f.kind === "tag") return "« " + v + " »";
    return String(v);
  }
  function describeRow(row) {
    var f = byField[row.field], c = cmpInfo(row);
    var text = f.label + " " + c.label.replace(/ N /, " " + (row.value === undefined ? "N" : row.value) + " ").replace(/ N$/, " " + row.value);
    if (c.value !== "none" && c.value !== "days" && !(c.cmp === "at_least")) text += " " + valueText(row, c, f);
    if (row.course !== undefined && f.courses) {
      var co = f.courses.filter(function (x) { return x.id === row.course; })[0];
      text += " (formation « " + (co ? co.title : "n° " + row.course) + " »)";
    }
    return (row.not ? "NON (" : "") + text + (row.not ? ")" : "");
  }
  function updateSummary() {
    if (!summaryBox) return;
    if (!flat) { summaryBox.textContent = "Définition avancée (groupes imbriqués) : voir le mode avancé."; return; }
    var done = model.rows.filter(isComplete);
    if (!done.length) { summaryBox.textContent = "Ajoutez un critère complet pour voir le résumé."; return; }
    var lead = done.length === 1 ? "Contacts pour lesquels : " : model.op === "and" ? "Contacts qui respectent tous ces critères : " : "Contacts qui respectent au moins un de ces critères : ";
    summaryBox.textContent = lead + done.map(describeRow).join(model.op === "and" ? " ; " : " ; ") + ".";
  }

  // --- Aperçu en direct ---
  var previewBox = document.getElementById("mk-preview");
  var previewBtn = document.getElementById("mk-preview-btn");
  var liveBox = document.getElementById("mk-live-count");
  var timer = null, seq = 0;
  function clearPreview() { if (previewBox) previewBox.textContent = ""; if (liveBox) liveBox.textContent = ""; }

  function showPreview(data) {
    clearPreview();
    var share = data.totalContacts > 0 ? Math.round((data.total / data.totalContacts) * 100) : 0;
    liveBox.appendChild(el("span", { "class": "mk-live-total" }, String(data.total)));
    liveBox.appendChild(el("span", { "class": "mk-live-detail" }, "contact" + (data.total > 1 ? "s" : "") + " dans ce segment (" + share + " % de l'audience)"));
    liveBox.appendChild(el("span", { "class": "mk-live-detail" }, data.sendable + " joignable" + (data.sendable > 1 ? "s" : "") + " : consentement prouvé, adresse non bloquée."));
    if (!data.rows.length) return;
    var wrap = el("div", { "class": "mk-table-wrap" });
    var table = el("table", { "class": "mk-table" });
    var head = el("tr", {});
    ["E-mail", "Nom", "Statut"].forEach(function (h) { head.appendChild(el("th", { scope: "col" }, h)); });
    table.appendChild(el("thead", {})).appendChild(head);
    var body = el("tbody", {});
    data.rows.forEach(function (r) {
      var tr = el("tr", {});
      tr.appendChild(el("td", {}, r.email));
      tr.appendChild(el("td", {}, r.name));
      tr.appendChild(el("td", {}, STATUS_LABELS[r.status] || r.status));
      body.appendChild(tr);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    previewBox.appendChild(wrap);
    if (data.total > data.rows.length) previewBox.appendChild(el("p", { "class": "field-hint" }, "Aperçu des " + data.rows.length + " premiers contacts."));
  }

  function showError(message) {
    clearPreview();
    previewBox.appendChild(el("p", { "class": "form-error", role: "alert" }, message));
  }

  // Une seule requête « utile » à la fois : une réponse arrivée après une modification plus récente est ignorée
  function refreshPreview() {
    if (!previewBox || !liveBox) return;
    var definition;
    try { definition = JSON.parse(textarea.value); } catch (e) { clearPreview(); previewBox.appendChild(el("p", { "class": "field-hint" }, "Ajoutez au moins un critère complet pour voir le nombre de contacts.")); return; }
    var mine = ++seq;
    var total = liveBox.querySelector(".mk-live-total"); if (total) total.classList.add("is-busy");
    if (previewBtn) previewBtn.disabled = true;
    fetch("/marketing/segments/apercu", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ definition: definition }) })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (r) { if (mine !== seq) return; if (r.ok) showPreview(r.data); else showError(r.data.error || "Aperçu impossible."); })
      .catch(function () { if (mine === seq) showError("Aperçu impossible pour le moment."); })
      .then(function () { if (mine === seq && previewBtn) previewBtn.disabled = false; });
  }
  function schedulePreview() {
    clearTimeout(timer);
    seq++; // toute réponse en cours devient obsolète
    if (!textarea.value.trim()) { clearPreview(); if (previewBtn) previewBtn.disabled = false; if (previewBox) previewBox.appendChild(el("p", { "class": "field-hint" }, "Ajoutez au moins un critère complet pour voir le nombre de contacts.")); return; }
    timer = setTimeout(refreshPreview, 400);
  }
  if (previewBtn) previewBtn.addEventListener("click", function () { clearTimeout(timer); refreshPreview(); });

  // Mode avancé : modifier le JSON met à jour le constructeur quand c'est possible
  textarea.addEventListener("input", function () {
    var parsed;
    try { parsed = JSON.parse(textarea.value); } catch (e) { return; }
    flat = fromDefinition(parsed);
    render(); updateSummary(); schedulePreview();
  });

  // Départ
  if (textarea.value.trim()) {
    try { flat = fromDefinition(JSON.parse(textarea.value)); } catch (e) { flat = false; }
  } else {
    var f0 = catalog[0];
    model.rows.push({ not: false, field: f0.field, cmp: f0.cmps[0].cmp, value: defaultValue(f0, f0.cmps[0]) });
  }
  render();
  updateSummary();
  if (textarea.value.trim()) refreshPreview(); else schedulePreview();
})();
