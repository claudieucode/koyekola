/* Personnaliser — réglages : champs (couleur, nombre, choix, interrupteur, image, CSS, palette, ordre, 4 côtés, valeur par appareil), brouillon, aperçu en direct et publication.
   Le serveur est la seule source de vérité : chaque valeur est validée par lui (POST /rendu pour l'aperçu, /brouillon, /publier) ; l'écran n'annonce un succès qu'après SA réponse.
   Les réglages qui ne changent que le CSS remplacent les feuilles de style du site dans le cadre (sans recharger) ; ceux qui changent le contenu rechargent le cadre en gardant la position. */
(function () {
  "use strict";
  var K = window.KWPZ; if (!K || !K.boot || !K.boot.panels) return;
  var boot = K.boot;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var NS = "http://www.w3.org/2000/svg";

  // ---------- Données ----------
  var controls = {}, panelOf = {}, panelById = {};
  boot.panels.forEach(function (p) { panelById[p.id] = p; p.controls.forEach(function (c) { controls[c.id] = c; panelOf[c.id] = p.id; }); });
  var live = clone(boot.live), values = clone(boot.values), saved = clone(boot.changes || {});
  var rev = boot.draft.rev || 0, errors = {}, busy = false, seq = 0, warnings = [], device = K.state.device;
  var undoStack = [], redoStack = [];
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function same(a, b) { var x = a === null || a === undefined ? "" : a, y = b === null || b === undefined ? "" : b; if (typeof x === "object" || typeof y === "object") return JSON.stringify(x) === JSON.stringify(y); return String(x) === String(y); }
  function wants(v, want) { if (want === "*") return v !== null && v !== undefined && v !== ""; if (Array.isArray(want)) return want.some(function (w) { return same(v, w); }); return same(v, want); }
  function work() { var o = {}; Object.keys(values).forEach(function (id) { if (!same(values[id], live[id])) o[id] = values[id]; }); return o; }
  function sameChanges(a, b) { var ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(function (k) { return k in b && same(a[k], b[k]); }); }
  function dirty() { return !sameChanges(work(), saved); }
  function pendingCount() { return Object.keys(work()).length; }
  function hasErrors() { return Object.keys(errors).length > 0; }

  // ---------- Utilitaires d'interface ----------
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") el.textContent = v; else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? "" : v);
    });
    [].concat(kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  function icon(name, cls) { var s = document.createElementNS(NS, "svg"); s.setAttribute("class", "kwc-i " + (cls || "")); s.setAttribute("aria-hidden", "true"); var u = document.createElementNS(NS, "use"); u.setAttribute("href", "#pz-i-" + name); s.appendChild(u); return s; }
  function toast(text, kind) { K.toast(text, kind); }
  function modal(title, body, actions) {
    var m = $("#pz-modal"), previous = document.activeElement;
    $("#pz-modal-title").textContent = title;
    var b = $("#pz-modal-body"); b.textContent = ""; [].concat(body).filter(Boolean).forEach(function (n) { b.appendChild(typeof n === "string" ? h("p", { text: n }) : n); });
    var a = $("#pz-modal-act"); a.textContent = "";
    function close() { m.hidden = true; document.removeEventListener("keydown", esc, true); if (previous && previous.focus) previous.focus(); }
    function esc(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    actions.forEach(function (x) { a.appendChild(h("button", { type: "button", class: "kwc-btn" + (x.primary ? " kwc-btn-primary" : ""), text: x.label, onclick: function () { close(); if (x.run) x.run(); } })); });
    m.hidden = false; document.addEventListener("keydown", esc, true);
    var first = a.querySelector(".kwc-btn-primary") || a.querySelector("button"); if (first) first.focus();
    return close;
  }
  function labelOf(id) { var c = controls[id]; if (!c) return id; var p = panelById[panelOf[id]]; return (p ? p.label + " › " : "") + c.label; }
  K.rerender = function () { K.emit("settings:rerender"); };
  function renderCounts() { $$("[data-ctl]").forEach(function (row) { var id = row.getAttribute("data-ctl"); row.classList.toggle("is-modified", !same(values[id], live[id])); var r = row.querySelector(".kwc-reset"); if (r) r.hidden = same(values[id], live[id]); }); }

  // ---------- Champs (repris du moteur d'interface éprouvé) ----------
  function field(c) {
    var wrap = h("div", { class: "kwc-field kwc-k-" + c.kind, "data-ctl": c.id });
    var lid = "kwc-f-" + c.id.replace(/[^a-z0-9]/gi, "-");
    var forbidden = (c.perm && boot.perControl && boot.perControl[c.id] === false);
    var disabled = !boot.can.edit || forbidden;
    var head = h("div", { class: "kwc-field-head" }, [h("label", { for: lid, text: c.label }), h("button", { type: "button", class: "kwc-reset", hidden: true, "aria-label": "Réinitialiser « " + c.label + " » (valeur en ligne)", title: "Réinitialiser", onclick: function () { set(c.id, live[c.id], true); refreshField(c); } }, [icon("reset", "kwc-i-s")])]);
    wrap.appendChild(head);
    var input;
    if (c.kind === "color") input = colorInput(c, lid, disabled);
    else if (c.kind === "number") input = numberInput(c, lid, disabled);
    else if (c.kind === "select") input = selectInput(c, lid, disabled);
    else if (c.kind === "toggle") input = toggleInput(c, lid, disabled);
    else if (c.kind === "media") input = mediaInput(c, lid, disabled);
    else if (c.kind === "css") input = cssInput(c, lid, disabled);
    else if (c.kind === "palette") input = paletteInput(c, lid, disabled);
    else if (c.kind === "order") input = orderInput(c, lid, disabled);
    else if (c.kind === "box") input = boxInput(c, lid, disabled);
    else if (c.kind === "resp") input = respInput(c, lid, disabled);
    else input = textInput(c, lid, disabled);
    wrap.appendChild(input);
    if (c.help) wrap.appendChild(h("small", { class: "kwc-help", text: c.help }));
    if (forbidden) wrap.appendChild(h("small", { class: "kwc-help kwc-help-lock", text: "Réservé aux comptes autorisés (« " + c.perm + " »)." }));
    wrap.appendChild(h("small", { class: "kwc-err", id: lid + "-err", role: "alert", hidden: true }));
    return wrap;
  }
  function refreshField(c) { var old = $('[data-ctl="' + c.id + '"]'); if (old) { old.replaceWith(field(c)); updateVisibility(); renderCounts(); showErrors(); } }
  function colorInput(c, lid, disabled) {
    var v = values[c.id] || "";
    var pick = h("input", { type: "color", class: "kwc-swatch", "aria-label": c.label + " : sélecteur de couleur", value: /^#[0-9a-f]{6}$/i.test(v) ? v : "#000000", disabled: disabled });
    var hex = h("input", { type: "text", id: lid, class: "kwc-hex", value: v, placeholder: c.allowEmpty ? "d'origine" : "#rrggbb", maxlength: 7, spellcheck: "false", autocomplete: "off", disabled: disabled, "aria-describedby": lid + "-err" });
    // Couleur vide = valeur d'origine du site : le sélecteur est atténué (sinon il afficherait un noir qui n'est pas la couleur réellement appliquée)
    function syncEmpty(x) { var empty = !/^#[0-9a-f]{6}$/i.test(x); pick.classList.toggle("is-empty", empty); pick.title = empty ? "Couleur d'origine du site (aucune valeur personnalisée)" : ""; }
    syncEmpty(v);
    pick.addEventListener("input", function () { hex.value = pick.value; hex.classList.remove("is-bad"); syncEmpty(pick.value); set(c.id, pick.value); });
    hex.addEventListener("input", function () {
      var x = hex.value.trim(); if (x && x[0] !== "#") x = "#" + x;
      if (x === "" && c.allowEmpty) { clearError(c.id); syncEmpty(""); set(c.id, ""); return; }
      if (/^#[0-9a-f]{6}$/i.test(x)) { pick.value = x; syncEmpty(x); clearError(c.id); set(c.id, x.toLowerCase()); }
      else setError(c.id, c.label + " : code hexadécimal attendu (ex. #0277b6).", true);
    });
    hex.addEventListener("blur", function () { if (!errors[c.id]) hex.value = values[c.id] || ""; });
    var rowEl = h("div", { class: "kwc-colorrow" }, [pick, hex]);
    // Couleurs nommées de la palette du site : choix en un clic
    var pal = c.id === "tokens.customColors" ? [] : (values["tokens.customColors"] || []);
    if (!pal.length || disabled) return rowEl;
    var chips = h("div", { class: "kwc-chips", role: "group", "aria-label": "Couleurs de la palette du site" }, pal.map(function (p) {
      return h("button", { type: "button", class: "kwc-chip", title: p.label + " " + p.hex, "aria-label": "Utiliser la couleur « " + p.label + " » (" + p.hex + ")", style: "background:" + p.hex, onclick: function () { hex.value = p.hex; pick.value = p.hex; syncEmpty(p.hex); clearError(c.id); set(c.id, p.hex); } });
    }));
    return h("div", null, [rowEl, chips]);
  }
  // Palette nommée du site : liste de couleurs (nom + couleur), ajout, suppression
  function paletteInput(c, lid, disabled) {
    var list = clone(values[c.id] || []);
    var box = h("div", { class: "kwc-palette", id: lid });
    function commit() { set(c.id, clone(list)); }
    list.forEach(function (item, i) {
      var pick = h("input", { type: "color", class: "kwc-swatch", "aria-label": "Couleur « " + item.label + " »", value: /^#[0-9a-f]{6}$/i.test(item.hex) ? item.hex : "#000000", disabled: disabled });
      var name = h("input", { type: "text", class: "kwc-palname", maxlength: 40, value: item.label, placeholder: "Nom (ex. Corail)", "aria-label": "Nom de la couleur", disabled: disabled, autocomplete: "off" });
      var del = h("button", { type: "button", class: "kwc-iconbtn", "aria-label": "Supprimer la couleur « " + item.label + " »", title: "Supprimer", disabled: disabled, onclick: function () { list.splice(i, 1); commit(); refreshField(c); } }, [icon("x")]);
      pick.addEventListener("input", function () { item.hex = pick.value; commit(); });
      name.addEventListener("input", function () { item.label = name.value; clearError(c.id); commit(); });
      box.appendChild(h("div", { class: "kwc-palrow" }, [pick, name, del]));
    });
    if (!list.length) box.appendChild(h("p", { class: "kwc-help", text: "Aucune couleur nommée pour l'instant." }));
    box.appendChild(h("button", { type: "button", class: "kwc-btn", disabled: disabled || list.length >= c.max, text: "Ajouter une couleur", onclick: function () {
      var n = list.length + 1, names = list.map(function (x) { return x.label; });
      while (names.indexOf("Couleur " + n) >= 0) n++;
      list.push({ key: "c-" + Math.random().toString(36).slice(2, 8), label: "Couleur " + n, hex: "#0277b6" }); commit(); refreshField(c);
    } }));
    return box;
  }
  function numberInput(c, lid, disabled) {
    var v = values[c.id]; v = v === null || v === undefined ? "" : v;
    var step = c.step || 1;
    var num = h("input", { type: "number", id: lid, class: "kwc-num", min: c.min, max: c.max, step: step, value: v, disabled: disabled, inputmode: "decimal", "aria-describedby": lid + "-err" });
    var range = h("input", { type: "range", class: "kwc-range", min: c.min, max: c.max, step: step, value: v === "" ? c.min : v, disabled: disabled, tabindex: "-1", "aria-hidden": "true" });
    function commit(x) {
      if (x === "") { clearError(c.id); set(c.id, c.nullable || /^tokens\.(link|type)/.test(c.id) ? null : live[c.id]); return; }
      var n = Number(x);
      if (!isFinite(n) || n < c.min || n > c.max) { setError(c.id, c.label + " : un nombre entre " + c.min + " et " + c.max + " est attendu.", true); return; }
      clearError(c.id); set(c.id, n);
    }
    num.addEventListener("input", function () { if (num.value !== "" && isFinite(Number(num.value))) range.value = num.value; commit(num.value); });
    range.addEventListener("input", function () { num.value = range.value; commit(range.value); });
    return h("div", { class: "kwc-numrow" }, [range, num, c.unit ? h("span", { class: "kwc-unit", text: c.unit }) : null]);
  }
  function selectInput(c, lid, disabled) {
    if (c.thumbs) return thumbsInput(c, lid, disabled);
    if (c.segmented) return segInput(c, lid, disabled);
    var sel = h("select", { id: lid, disabled: disabled }, c.options.map(function (o) { return h("option", { value: String(o[0]), text: o[1] }); }));
    sel.value = String(values[c.id] === null || values[c.id] === undefined ? "" : values[c.id]);
    sel.addEventListener("change", function () { set(c.id, c.number ? Number(sel.value) : sel.value); updateVisibility(); });
    return sel;
  }
  function toggleInput(c, lid, disabled) {
    var cb = h("input", { type: "checkbox", id: lid, role: "switch", class: "kwc-switch", checked: !!values[c.id], disabled: disabled });
    cb.addEventListener("change", function () { set(c.id, cb.checked); updateVisibility(); });
    return h("label", { class: "kwc-toggle", for: lid }, [cb, h("span", { class: "kwc-track", "aria-hidden": "true" }, [h("span", { class: "kwc-thumb" })]), h("span", { class: "kwc-toggle-txt", text: values[c.id] ? "Activé" : "Désactivé" })]);
  }
  function textInput(c, lid, disabled) {
    var el = c.kind === "textarea" ? h("textarea", { id: lid, rows: 3, maxlength: c.max, disabled: disabled }) : h("input", { type: "text", id: lid, maxlength: c.max, disabled: disabled, autocomplete: "off" });
    el.value = values[c.id] || ""; el.setAttribute("aria-describedby", lid + "-err");
    el.addEventListener("input", function () { clearError(c.id); set(c.id, el.value); });
    return el;
  }
  function cssInput(c, lid, disabled) {
    var locked = disabled || !boot.can.css;
    var el = h("textarea", { id: lid, class: "kwc-code", rows: 12, spellcheck: "false", maxlength: c.max, disabled: locked, placeholder: ".ma-classe {\n  color: #0b2a40;\n}" });
    el.value = values[c.id] || "";
    var count = h("small", { class: "kwc-help", text: "" });
    function upd() { count.textContent = el.value.length.toLocaleString("fr-FR") + " / " + c.max.toLocaleString("fr-FR") + " caractères"; }
    el.addEventListener("input", function () { upd(); clearError(c.id); set(c.id, el.value); });
    upd();
    var box = h("div", null, [el, count]);
    if (!boot.can.css) box.appendChild(h("small", { class: "kwc-help kwc-help-lock", text: "Le CSS est du code : réservé aux comptes autorisés (« pages.code »)." }));
    return box;
  }
  function mediaInput(c, lid, disabled) {
    var cur = values[c.id];
    var has = cur !== "" && cur !== null && cur !== undefined;
    var src = has ? (c.store === "id" ? mediaCache[cur] || null : cur) : null;
    var thumb = h("div", { class: "kwc-thumb-box" + (has ? "" : " is-empty") }, src ? [h("img", { src: src, alt: "" })] : [icon("image")]);
    var name = h("span", { class: "kwc-media-name", text: has ? (c.store === "id" ? "Image n° " + cur : String(cur).split("/").pop()) : "Aucune image" });
    var choose = h("button", { type: "button", class: "kwc-btn", id: lid, disabled: disabled, text: has ? "Remplacer" : "Choisir une image", onclick: function () {
      if (!window.KWMediaPicker) { toast("La médiathèque n'est pas disponible : rechargez la page.", "error"); return; }
      window.KWMediaPicker.open({ title: c.label, type: "image", multiple: false, onPick: function (m) {
        clearError(c.id);
        if (c.store === "id") { mediaCache[m.id] = m.url || m.path; set(c.id, m.id); } else set(c.id, m.path || m.url);
        refreshField(c);
      } });
    } });
    var kids = [choose];
    if (has) kids.push(h("button", { type: "button", class: "kwc-btn kwc-btn-ghost", disabled: disabled, text: "Retirer", onclick: function () {
      modal("Retirer l'image ?", "L'image reste dans la médiathèque ; elle n'est simplement plus utilisée ici. Vous pourrez annuler ce changement avant de publier.", [{ label: "Annuler" }, { label: "Retirer", primary: true, run: function () { set(c.id, c.store === "id" ? null : ""); refreshField(c); } }]);
    } }));
    return h("div", { class: "kwc-media" }, [thumb, h("div", { class: "kwc-media-side" }, [name, h("div", { class: "kwc-media-act" }, kids)])]);
  }
  var mediaCache = {};
  // ---------- Publication unique : onglets, groupes, vignettes, ordre, 4 côtés, valeurs par appareil ----------
  var spTab = "general";
  function singleBody(p, body) {
    var tabs = h("div", { class: "kwc-tabs", role: "tablist", "aria-label": "Publication unique" }, [["general", "Général"], ["design", "Design"]].map(function (t) {
      return h("button", { type: "button", role: "tab", class: "kwc-tab", "aria-selected": String(spTab === t[0]), "data-sptab": t[0], text: t[1], onclick: function () { spTab = t[0]; K.rerender(); } });
    }));
    body.appendChild(tabs);
    var groups = [], by = {};
    p.controls.filter(function (c) { return c.tab === spTab; }).forEach(function (c) { var g = c.group || "Réglages"; if (!by[g]) { by[g] = []; groups.push(g); } by[g].push(c); });
    groups.forEach(function (g, i) {
      var det = h("details", { class: "kwc-group", "data-group": g }); if (i < 2 || spTab === "design" && i < 1) det.open = true;
      det.appendChild(h("summary", { class: "kwc-group-title", text: g }));
      by[g].forEach(function (c) { det.appendChild(field(c)); });
      body.appendChild(det);
    });
  }
  var NS_ = "http://www.w3.org/2000/svg";
  function svgEl(name, attrs) { var e = document.createElementNS(NS_, name); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  // Vignette réelle d'une mise en page : dessine la structure (colonne, largeur du texte) — pas une illustration décorative
  function thumbSvg(kind, value) {
    var s = svgEl("svg", { viewBox: "0 0 120 80", class: "kwc-thumb-svg", "aria-hidden": "true", focusable: "false" });
    s.appendChild(svgEl("rect", { x: 3, y: 3, width: 114, height: 74, rx: 4, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" }));
    function block(x, y, w, hh, o) { s.appendChild(svgEl("rect", { x: x, y: y, width: w, height: hh, rx: 2, fill: "currentColor", "fill-opacity": o || ".22" })); }
    function lines(x, y, w, n) { for (var i = 0; i < n; i++) s.appendChild(svgEl("rect", { x: x, y: y + i * 6, width: i === n - 1 ? w * .6 : w, height: 2.5, rx: 1, fill: "currentColor", "fill-opacity": ".3" })); }
    if (value === "default") { s.appendChild(svgEl("circle", { cx: 60, cy: 40, r: 14, fill: "none", stroke: "currentColor", "stroke-opacity": ".4" })); s.appendChild(svgEl("path", { d: "M46 40h28M60 26c-6 6-6 22 0 28M60 26c6 6 6 22 0 28", fill: "none", stroke: "currentColor", "stroke-opacity": ".4" })); return s; }
    if (kind === "container") {
      if (value === "full") { block(8, 8, 104, 22); lines(8, 38, 104, 5); }
      else if (value === "narrow") { block(34, 10, 52, 20); lines(34, 38, 52, 5); }
      else { block(14, 10, 92, 24); lines(14, 42, 92, 4); }
    } else {
      if (value === "none") { block(26, 10, 68, 22); lines(26, 40, 68, 5); }
      else if (value === "left") { block(10, 10, 22, 58); block(38, 10, 72, 20); lines(38, 38, 72, 5); }
      else { block(10, 10, 72, 20); lines(10, 38, 72, 5); block(88, 10, 22, 58); }
    }
    return s;
  }
  function thumbsInput(c, lid, disabled) {
    var box = h("div", { class: "kwc-thumbs", role: "radiogroup", "aria-label": c.label });
    c.options.forEach(function (o) {
      var on = String(values[c.id]) === String(o[0]);
      var b = h("button", { type: "button", class: "kwc-thumb" + (on ? " is-on" : ""), role: "radio", "aria-checked": String(on), title: o[1], "aria-label": o[1], disabled: disabled, onclick: function () { set(c.id, o[0]); $$("button", box).forEach(function (x) { var y = x === b; x.classList.toggle("is-on", y); x.setAttribute("aria-checked", String(y)); }); updateVisibility(); } }, [thumbSvg(c.thumbs, o[0])]);
      box.appendChild(b);
    });
    return box;
  }
  function segInput(c, lid, disabled) {
    var box = h("div", { class: "kwc-seg", role: "radiogroup", "aria-label": c.label });
    c.options.forEach(function (o) {
      var on = String(values[c.id]) === String(o[0]);
      var b = h("button", { type: "button", class: "kwc-segbtn" + (on ? " is-on" : ""), role: "radio", "aria-checked": String(on), text: o[1], disabled: disabled, onclick: function () { set(c.id, o[0]); $$("button", box).forEach(function (x) { var y = x === b; x.classList.toggle("is-on", y); x.setAttribute("aria-checked", String(y)); }); updateVisibility(); } });
      box.appendChild(b);
    });
    return box;
  }
  // Liste réordonnable (glisser-déposer ET boutons monter/descendre au clavier) avec visibilité par élément
  function orderInput(c, lid, disabled) {
    var list = clone(values[c.id] || []); var label = {}; c.items.forEach(function (i) { label[i.id] = i; });
    var ul = h("ul", { class: "kwc-order", id: lid });
    function commit() { set(c.id, clone(list)); draw(); }
    function move(i, d) { var j = i + d; if (j < 0 || j >= list.length) return; var t = list[i]; list[i] = list[j]; list[j] = t; commit(); var b = $$("li", ul)[j]; if (b) { var f = b.querySelector(d < 0 ? ".kwc-up" : ".kwc-down"); if (f) f.focus(); } }
    var dragIndex = null;
    function draw() {
      ul.textContent = "";
      list.forEach(function (it, i) {
        var meta = label[it.id] || { label: it.id };
        var li = h("li", { class: "kwc-order-item" + (it.visible ? "" : " is-off"), draggable: disabled ? "false" : "true", "data-i": i });
        li.addEventListener("dragstart", function (e) { dragIndex = i; try { e.dataTransfer.setData("text/plain", String(i)); e.dataTransfer.effectAllowed = "move"; } catch (x) { /* ancien navigateur */ } li.classList.add("is-drag"); });
        li.addEventListener("dragend", function () { li.classList.remove("is-drag"); dragIndex = null; });
        li.addEventListener("dragover", function (e) { if (dragIndex !== null) { e.preventDefault(); } });
        li.addEventListener("drop", function (e) { e.preventDefault(); if (dragIndex === null || dragIndex === i) return; var m = list.splice(dragIndex, 1)[0]; list.splice(i, 0, m); dragIndex = null; commit(); });
        li.appendChild(h("span", { class: "kwc-grip", "aria-hidden": "true", text: "⋮⋮" }));
        li.appendChild(h("span", { class: "kwc-order-label", text: meta.label }));
        li.appendChild(h("button", { type: "button", class: "kwc-iconbtn kwc-up", "aria-label": "Monter « " + meta.label + " »", disabled: disabled || i === 0, text: "↑", onclick: function () { move(i, -1); } }));
        li.appendChild(h("button", { type: "button", class: "kwc-iconbtn kwc-down", "aria-label": "Descendre « " + meta.label + " »", disabled: disabled || i === list.length - 1, text: "↓", onclick: function () { move(i, 1); } }));
        li.appendChild(h("button", { type: "button", class: "kwc-iconbtn kwc-eye", "aria-pressed": String(!!it.visible), "aria-label": (it.visible ? "Masquer « " : "Afficher « ") + meta.label + " »", title: it.visible ? "Visible" : "Masqué", disabled: disabled || meta.locked, text: it.visible ? "●" : "○", onclick: function () { it.visible = !it.visible; commit(); } }));
        ul.appendChild(li);
      });
    }
    draw();
    return ul;
  }
  var DEVNAME = { desktop: "Ordinateur", tablet: "Tablette", mobile: "Mobile" };
  function devBadge() { return h("span", { class: "kwc-devbadge", "data-devbadge": "1", title: "Valeur pour : " + DEVNAME[device], text: DEVNAME[device] }); }
  function refreshDeviceFields() { $$(".kwc-k-box,.kwc-k-resp").forEach(function (row) { var c = controls[row.getAttribute("data-ctl")]; if (c) refreshField(c); }); }
  // Quatre côtés (haut, droite, bas, gauche) avec liaison, unité et valeur propre à chaque appareil
  function boxInput(c, lid, disabled) {
    var all = clone(values[c.id] || {}); var dev = c.responsive ? device : "desktop";
    var cur = (c.responsive ? all[dev] : all) || { top: null, right: null, bottom: null, left: null, unit: "px", linked: false };
    var inputs = {}; var SIDES = [["top", "EN HAUT"], ["right", "À DROITE"], ["bottom", "EN BAS"], ["left", "À GAUCHE"]];
    if (c.corners) SIDES = [["top", "HAUT-G"], ["right", "HAUT-D"], ["bottom", "BAS-D"], ["left", "BAS-G"]];
    function commit() {
      var any = SIDES.some(function (s) { return cur[s[0]] !== null && cur[s[0]] !== undefined; });
      var next = any ? { top: cur.top, right: cur.right, bottom: cur.bottom, left: cur.left, unit: c.noUnit ? "px" : (cur.unit || "px"), linked: !!cur.linked } : null;
      if (c.responsive) { var o = clone(all); o[dev] = next; var has = ["desktop", "tablet", "mobile"].some(function (d) { return o[d]; }); all = has ? { desktop: o.desktop || null, tablet: o.tablet || null, mobile: o.mobile || null } : null; set(c.id, all); }
      else { all = next; set(c.id, next); }
    }
    var row = h("div", { class: "kwc-box" });
    var cells = h("div", { class: "kwc-box-cells" });
    SIDES.forEach(function (s) {
      var inp = h("input", { type: "number", class: "kwc-num", min: c.corners || c.noUnit ? 0 : -400, max: c.max, step: 1, inputmode: "numeric", disabled: disabled, "aria-label": c.label + " — " + s[1].toLowerCase(), value: cur[s[0]] === null || cur[s[0]] === undefined ? "" : cur[s[0]] });
      inp.addEventListener("input", function () {
        var v = inp.value === "" ? null : Number(inp.value);
        if (v !== null && (!isFinite(v) || v < (c.corners || c.noUnit ? 0 : -400) || v > c.max)) { setError(c.id, c.label + " : un nombre entre " + (c.corners || c.noUnit ? 0 : -400) + " et " + c.max + " est attendu.", true); return; }
        clearError(c.id);
        if (cur.linked) SIDES.forEach(function (t) { cur[t[0]] = v; if (inputs[t[0]] !== inp) inputs[t[0]].value = v === null ? "" : v; }); else cur[s[0]] = v;
        commit();
      });
      inputs[s[0]] = inp; cells.appendChild(h("label", { class: "kwc-box-cell" }, [inp, h("span", { class: "kwc-box-lbl", text: s[1] })]));
    });
    var link = h("button", { type: "button", class: "kwc-box-link" + (cur.linked ? " is-on" : ""), "aria-pressed": String(!!cur.linked), "aria-label": "Lier les quatre valeurs", title: "Lier les valeurs", disabled: disabled, text: "🔗", onclick: function () {
      cur.linked = !cur.linked; link.classList.toggle("is-on", cur.linked); link.setAttribute("aria-pressed", String(cur.linked));
      if (cur.linked) { var first = SIDES.map(function (s) { return cur[s[0]]; }).filter(function (v) { return v !== null && v !== undefined; })[0]; if (first !== undefined) SIDES.forEach(function (s) { cur[s[0]] = first; inputs[s[0]].value = first; }); }
      commit();
    } });
    row.appendChild(cells); row.appendChild(link);
    var top = h("div", { class: "kwc-box-top" }, [c.responsive ? devBadge() : null]);
    if (!c.noUnit) { var unit = h("select", { class: "kwc-unitsel", "aria-label": "Unité", disabled: disabled }, ["px", "em", "rem", "%"].map(function (u) { return h("option", { value: u, text: u }); })); unit.value = cur.unit || "px"; unit.addEventListener("change", function () { cur.unit = unit.value; commit(); }); top.appendChild(unit); }
    return h("div", { class: "kwc-boxwrap" }, [top, row]);
  }
  // Nombre propre à chaque appareil : vide = valeur héritée de l'ordinateur (puis du thème)
  function respInput(c, lid, disabled) {
    var all = clone(values[c.id] || { desktop: null, tablet: null, mobile: null });
    var v = all[device]; var inherited = device !== "desktop" && (v === null || v === undefined) ? all.desktop : null;
    var num = h("input", { type: "number", id: lid, class: "kwc-num", min: c.min, max: c.max, step: 1, inputmode: "numeric", disabled: disabled, value: v === null || v === undefined ? "" : v, placeholder: inherited !== null && inherited !== undefined ? String(inherited) : "" });
    num.addEventListener("input", function () {
      var x = num.value === "" ? null : Number(num.value);
      if (x !== null && (!isFinite(x) || x < c.min || x > c.max)) { setError(c.id, c.label + " : un nombre entre " + c.min + " et " + c.max + " est attendu.", true); return; }
      clearError(c.id); all[device] = x; var any = ["desktop", "tablet", "mobile"].some(function (d) { return all[d] !== null && all[d] !== undefined; });
      set(c.id, any ? { desktop: all.desktop === undefined ? null : all.desktop, tablet: all.tablet === undefined ? null : all.tablet, mobile: all.mobile === undefined ? null : all.mobile } : null);
    });
    var reset = h("button", { type: "button", class: "kwc-iconbtn", "aria-label": "Réinitialiser la valeur " + DEVNAME[device].toLowerCase(), title: "Réinitialiser (" + DEVNAME[device] + ")", disabled: disabled, text: "↺", onclick: function () { num.value = ""; num.dispatchEvent(new Event("input")); } });
    return h("div", { class: "kwc-numrow" }, [devBadge(), num, h("span", { class: "kwc-unit", text: c.unit || "px" }), reset]);
  }
  function updateVisibility() {
    $$("[data-ctl]").forEach(function (row) {
      var c = controls[row.getAttribute("data-ctl")]; if (!c || !c.showIf) return;
      var ok = Object.keys(c.showIf).every(function (k) { return wants(values[k], c.showIf[k]); });
      row.hidden = !ok;
    });
    $$(".kwc-toggle-txt").forEach(function (t) { var cb = t.parentNode.querySelector("input"); if (cb) t.textContent = cb.checked ? "Activé" : "Désactivé"; });
  }
  function setError(id, msg, local) { errors[id] = msg; showErrors(); if (local) setStatus(); }
  function clearError(id) { if (errors[id]) { delete errors[id]; showErrors(); setStatus(); } }
  function showErrors() {
    $$("[data-ctl]").forEach(function (row) {
      var id = row.getAttribute("data-ctl"), e = row.querySelector(".kwc-err"), inp = row.querySelector("input[type=text],input[type=number],textarea,select");
      if (!e) return; e.hidden = !errors[id]; e.textContent = errors[id] || ""; row.classList.toggle("has-error", !!errors[id]);
      if (inp) inp.setAttribute("aria-invalid", errors[id] ? "true" : "false");
    });
  }

  // ---------- Changements, annuler / rétablir ----------
  var lastPush = { id: null, t: 0 };

  // ---------- Changements ----------
  var lastPush = { id: null, t: 0 };
  function set(id, value, forceSnapshot) {
    var now = Date.now();
    if (forceSnapshot || lastPush.id !== id || now - lastPush.t > 900) { undoStack.push(clone(values)); if (undoStack.length > 100) undoStack.shift(); redoStack = []; }
    lastPush = { id: id, t: now };
    values[id] = value;
    afterChange();
  }
  function status() {
    K.set("publishing", busy === "publish");
    K.set("publishable", Boolean(boot.can.publish) && !busy && pendingCount() > 0 && !hasErrors() && !boot.pendingEngineDraft);
    K.setDirty(dirty() && boot.can.edit);
    renderCounts();
  }
  function afterChange() { status(); schedulePreview(); scheduleSave(); K.emit("settings:changed"); }

  // ---------- Serveur ----------
  function post(path, body) {
    var payload = Object.assign({ site: boot.siteId === null ? "" : String(boot.siteId) }, body);
    return fetch(path + boot.siteQuery, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
      .then(function (res) { return res.text().then(function (text) { var data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; } if (!res.ok) { var err = new Error((data && data.error && data.error.message) || (res.status === 401 ? "Votre session a expiré : reconnectez-vous." : "Le serveur a refusé la demande (" + res.status + ").")); err.status = res.status; throw err; } return data; }); },
        function () { var err = new Error("Connexion impossible : vérifiez votre réseau. Vos modifications restent dans cette page."); err.network = true; throw err; });
  }
  function matchError(message) { var hit = null; Object.keys(controls).forEach(function (id) { if (!hit && message.indexOf(controls[id].label) === 0) hit = id; });
    if (!hit) { var ch = Object.keys(work()); if (ch.length === 1) hit = ch[0]; } // un seul réglage modifié : l'erreur lui appartient
    return hit; }

  // ---------- Aperçu ----------
  var ptimer = null;
  function schedulePreview() { clearTimeout(ptimer); ptimer = setTimeout(sendPreview, 220); }
  function sendPreview() {
    if (!boot.can.edit || hasErrors()) return;
    var mine = ++seq;
    post(boot.api + "/rendu", { changes: work() }).then(function (r) {
      if (mine < seq) return;
      warnings = r.warnings || []; K.emit("settings:warnings", warnings);
      Object.keys(errors).forEach(function (id) { if (!/hexadécimal/.test(errors[id])) delete errors[id]; });
      showErrors();
      if (r.structural) K.preview.softReload(); else applyAssets(r.assets);
      status();
    }, function (e) {
      if (mine < seq) return;
      if (e.network) { toast(e.message, "error"); return; }
      var id = matchError(e.message);
      if (id) setError(id, e.message); if (!id || !document.querySelector('[data-ctl="' + id + '"]')) toast(e.message, "error");
      status();
    });
  }
  function styleEl(doc, id) { var el = doc.getElementById(id); if (!el) { el = doc.createElement("style"); el.id = id; doc.head.appendChild(el); } return el; }
  function applyAssets(a) {
    var doc = K.preview.doc(); if (!doc || !doc.head || !a) return;
    if (typeof a.appearanceCss === "string") styleEl(doc, "kw-appearance").textContent = a.appearanceCss;
    if (typeof a.theme === "string") styleEl(doc, "kw-site-theme").textContent = a.theme;
    if (typeof a.custom === "string") styleEl(doc, "kw-site-custom").textContent = a.custom;
    if (typeof a.faces === "string") styleEl(doc, "kw-site-faces").textContent = a.faces;
    if (a.pack && doc.body) {
      String(a.pack.vars || "").split(";").forEach(function (d) { var i = d.indexOf(":"); if (i > 0) doc.body.style.setProperty(d.slice(0, i).trim(), d.slice(i + 1).trim()); });
      String(a.pack.attr || "").replace(/(data-pk-[a-z0-9-]+)="([^"]*)"/g, function (m, k, v) { doc.body.setAttribute(k, v); return m; });
    }
    if (typeof a.bodyStyle === "string" && doc.body) a.bodyStyle.split(";").forEach(function (d) { var i = d.indexOf(":"); if (i > 0) doc.body.style.setProperty(d.slice(0, i).trim(), d.slice(i + 1).trim()); });
  }
  // Après chaque chargement de l'aperçu, les réglages en cours (même non enregistrés) sont réappliqués
  K.on("preview:loaded", function () { if (pendingCount()) schedulePreview(); });

  // ---------- Brouillon (enregistré automatiquement) et publication ----------
  var stimer = null;
  function scheduleSave() { clearTimeout(stimer); stimer = setTimeout(saveDraft, 1200); }
  function saveDraft() {
    clearTimeout(stimer);
    if (busy || !boot.can.edit || hasErrors() || !dirty()) return Promise.resolve(false);
    busy = "save"; status();
    var w = work();
    return post(boot.api + "/brouillon", { changes: w, rev: rev }).then(function (r) {
      rev = r.draft.rev; saved = clone(w); busy = false; status(); return true;
    }, function (e) { busy = false; status(); var id = matchError(e.message); if (id) setError(id, e.message); toast(e.message, "error"); return false; });
  }
  function publish() {
    if (busy || !boot.can.publish || hasErrors() || pendingCount() === 0) return;
    var list = h("ul", { class: "kwc-publist" }); Object.keys(work()).slice(0, 12).forEach(function (id) { list.appendChild(h("li", { text: labelOf(id) })); });
    var more = Object.keys(work()).length - 12;
    modal("Publier les modifications ?", [h("p", { text: pendingCount() + " réglage" + (pendingCount() > 1 ? "s" : "") + " seront appliqués à toutes les pages du site public « " + boot.siteName + " » (aucun autre site n'est touché) :" }), list, more > 0 ? h("p", { text: "… et " + more + " autre" + (more > 1 ? "s" : "") + "." }) : null], [
      { label: "Annuler" },
      { label: "Publier maintenant", primary: true, run: doPublish },
    ]);
  }
  function doPublish() {
    var go = dirty() ? saveDraft() : Promise.resolve(true);
    go.then(function (ok) {
      if (!ok) return;
      busy = "publish"; status();
      post(boot.api + "/publier", { rev: rev }).then(function (r) {
        live = clone(r.live); values = clone(r.values); saved = {}; rev = 0; undoStack = []; redoStack = []; errors = {};
        busy = false; K.rerender(); status();
        toast("Publié : le site public utilise maintenant ces réglages.", "ok");
        K.preview.softReload();
      }, function (e) { busy = false; status(); toast(e.message, "error"); });
    });
  }
  K.pending = work; // réglages modifiés non publiés (lecture seule, pour les tests et les futurs modules)
  // Outils partagés avec les sous-écrans des catégories (Global…) : mêmes valeurs, même brouillon, même aperçu, même publication
  K.api = { h: h, icon: icon, toast: toast, modal: modal, values: function () { return values; }, set: set, device: function () { return device; }, pending: work };
  K.on("publish", publish);
  K.on("change:device", function (d) { device = d; refreshDeviceFields(); });
  window.addEventListener("pagehide", function () { if (dirty() && boot.can.edit && navigator.sendBeacon) { /* le brouillon est enregistré 1,2 s après chaque changement */ } });

  // ---------- Panneaux de catégories ----------
  function note(text, href, label) { var n = h("div", { class: "kwc-note" }, [h("p", { text: text })]); if (href) n.appendChild(h("a", { class: "kwc-btn", href: href, target: "_blank", rel: "noopener" }, [label])); return n; }
  function panelFields(p, body) { if (p.tabs) singleBody(p, body); else p.controls.filter(function (c) { return !/^parts\./.test(c.id); }).forEach(function (c) { body.appendChild(field(c)); }); }
  function menusView(body) {
    body.appendChild(h("p", { class: "kwc-hint", text: "Les menus se modifient dans l'écran Navigation (ils ne passent pas par le brouillon). Revenez ici et actualisez l'aperçu pour les voir." }));
    if (!boot.menus.length) body.appendChild(h("p", { class: "kwc-empty-note", text: "Ce site n'a encore aucun menu." }));
    var ul = h("ul", { class: "kwc-menulist" });
    boot.menus.forEach(function (m) { ul.appendChild(h("li", null, [h("strong", { text: m.name }), h("small", { text: m.items + " élément" + (m.items > 1 ? "s" : "") + (m.locations.length ? " · " + m.locations.join(", ") : " · non affecté") + (m.broken ? " · " + m.broken + " lien(s) à vérifier" : "") })])); });
    body.appendChild(ul);
    body.appendChild(h("a", { class: "kwc-btn kwc-btn-primary", href: boot.links.menus, target: "_blank", rel: "noopener", text: "Modifier les menus" }));
    body.appendChild(h("button", { type: "button", class: "kwc-btn", text: "Actualiser l'aperçu", onclick: function () { K.preview.softReload(); } }));
  }
  function widgetsView(body) {
    body.appendChild(h("p", { class: "kwc-hint", text: "Les widgets se composent dans l'écran Widgets. Voici l'état des zones de ce site." }));
    var ul = h("ul", { class: "kwc-menulist" });
    boot.zones.forEach(function (z) { ul.appendChild(h("li", null, [h("strong", { text: z.label }), h("small", { text: z.count + " widget" + (z.count > 1 ? "s" : "") + " · " + z.where })])); });
    body.appendChild(ul);
    body.appendChild(h("a", { class: "kwc-btn kwc-btn-primary", href: boot.links.widgets, target: "_blank", rel: "noopener", text: "Modifier les widgets" }));
    body.appendChild(h("button", { type: "button", class: "kwc-btn", text: "Actualiser l'aperçu", onclick: function () { K.preview.softReload(); } }));
  }
  function homeView(body) {
    if (boot.principal) { body.appendChild(note("La page d'accueil du site principal est celle de Kolakisa : elle se modifie dans Pages.", boot.links.pages, "Ouvrir les pages")); return; }
    var sel = h("select", { id: "pz-home", disabled: !boot.can.home });
    sel.appendChild(h("option", { value: "", text: "Aucune (page par défaut du site)" }));
    boot.home.pages.forEach(function (p) { sel.appendChild(h("option", { value: String(p.id), text: p.name, selected: boot.home.id === p.id })); });
    var btn = h("button", { type: "button", class: "kwc-btn kwc-btn-primary", text: "Définir comme page d'accueil", disabled: !boot.can.home, onclick: function () {
      btn.disabled = true;
      post(boot.base + "/accueil", { page: sel.value }).then(function () { boot.home.id = sel.value === "" ? null : Number(sel.value); toast("Page d'accueil enregistrée.", "ok"); K.preview.softReload(); btn.disabled = !boot.can.home; },
        function (e) { toast(e.message, "error"); btn.disabled = !boot.can.home; });
    } });
    body.appendChild(h("div", { class: "kwc-field" }, [h("div", { class: "kwc-field-head" }, [h("label", { for: "pz-home", text: "Page d'accueil du site" })]), sel, h("small", { class: "kwc-help", text: "La page affichée quand on ouvre l'adresse du site. Elle s'applique tout de suite (sans passer par Publier)." })]));
    if (!boot.home.pages.length) body.appendChild(h("p", { class: "kwc-empty-note", text: "Ce site n'a encore aucune page." }));
    body.appendChild(btn);
  }
  function cssView(body, cat) {
    if (boot.principal) { body.appendChild(note("Le site principal n'a pas de CSS additionnel : cette option est réservée aux sites créés.", null, "")); return true; }
    return false;
  }
  // En-tête : comportement (mode, effets, décalage, empilement, masquage au défilement, appareils) de l'en-tête du Theme Builder de CE site ; enregistré et publié par le serveur, validé par lui
  function headerView(body) {
    var tb = note("L'en-tête et le pied de page se composent dans le Theme Builder (leur unique gestionnaire : création, affectation, publication).", boot.links.themeBuilder, "Ouvrir le Theme Builder");
    var hd = boot.header;
    if (!hd) { body.appendChild(tb); body.appendChild(h("p", { class: "kwc-empty-note", text: "Ce site n'a pas encore d'en-tête créé dans le Theme Builder : le comportement se règle ici dès qu'il en a un." })); return; }
    var st = JSON.parse(JSON.stringify(hd.settings)), can = hd.editable && boot.can.edit;
    body.appendChild(h("p", { class: "kwc-help", text: "En-tête actuel : " + hd.name }));
    if (!hd.editable) body.appendChild(h("div", { class: "kwc-warn", role: "status" }, [h("p", { text: hd.reason })]));
    var out = h("div", { class: "kwc-fields" });
    function field(label, control, help) { return h("div", { class: "kwc-field" }, [h("div", { class: "kwc-field-head" }, [h("label", { text: label })]), control, help ? h("small", { class: "kwc-help", text: help }) : null]); }
    function select(opts, value, on) { var el = h("select", { class: "kwc-input", disabled: !can }, opts.map(function (o) { return h("option", { value: o[0], text: o[1], selected: o[0] === value }); })); el.addEventListener("change", function () { on(el.value); dirty2(); }); return el; }
    function num(value, min, max, on) { var el = h("input", { class: "kwc-input", type: "number", min: min, max: max, value: value, disabled: !can }); el.addEventListener("input", function () { var n = Number(el.value); if (Number.isFinite(n)) { on(Math.min(max, Math.max(min, Math.round(n)))); dirty2(); } }); return el; }
    function check(label, value, on) { var el = h("input", { type: "checkbox", checked: value, disabled: !can }); el.addEventListener("change", function () { on(el.checked); dirty2(); }); return h("label", { class: "kwc-check" }, [el, h("span", { text: " " + label })]); }
    var btn = h("button", { type: "button", class: "kwc-btn kwc-btn-primary", text: "Enregistrer et publier l'en-tête", disabled: true });
    var snapshot = JSON.stringify(st);
    function dirty2() { btn.disabled = !can || JSON.stringify(st) === snapshot; }
    function draw() {
      out.textContent = "";
      out.appendChild(field("Position", select([["static", "Ordinaire (défile avec la page)"], ["sticky", "Collé en haut"], ["fixed", "Fixé en haut"], ["overlay", "Superposé au visuel d'ouverture"]], st.mode, function (v) { st.mode = v; if (v === "static") st.fx = ""; draw(); }), "Collé : reste visible en haut quand on descend. Superposé : se place sur l'image d'ouverture."));
      if (st.mode !== "static") {
        out.appendChild(field("Effet au défilement", select([["", "Aucun"], ["shrink", "Réduire l'en-tête"], ["solid", "Devenir plein (fond opaque)"], ["both", "Réduire et devenir plein"]], st.fx || "", function (v) { st.fx = v; })));
        out.appendChild(field("Décalage par rapport au haut (px)", num(st.offset, 0, 200, function (n) { st.offset = n; }), "Utile sous une barre d'annonce ou d'administration."));
        out.appendChild(field("Niveau d'empilement (1 à 100)", num(st.zIndex, 1, 100, function (n) { st.zIndex = n; }), "Plus le nombre est grand, plus l'en-tête passe devant les autres éléments."));
        out.appendChild(field("Seuil d'activation du défilement (px)", num(st.threshold, 0, 1000, function (n) { st.threshold = n; })));
        out.appendChild(check("Masquer en descendant, réafficher en remontant", st.hideOnScroll.enabled, function (v) { st.hideOnScroll.enabled = v; }));
        var dev = h("div", { class: "kwc-field" }, [h("div", { class: "kwc-field-head" }, [h("label", { text: "Coller sur ces appareils" })])]);
        [["desktop", "Ordinateur"], ["tablet", "Tablette"], ["mobile", "Mobile"]].forEach(function (d) { dev.appendChild(check(d[1], st.stickOn.indexOf(d[0]) !== -1, function (v) { var set = st.stickOn.filter(function (x) { return x !== d[0]; }); if (v) set.push(d[0]); st.stickOn = set.length ? set : ["desktop", "tablet", "mobile"]; })); });
        out.appendChild(dev);
      }
      out.appendChild(btn);
    }
    btn.addEventListener("click", function () {
      btn.disabled = true;
      post(boot.base + "/entete", { settings: st }).then(function (r) { st = JSON.parse(JSON.stringify(r.settings)); snapshot = JSON.stringify(st); hd.settings = r.settings; toast("En-tête publié.", "ok"); K.preview.softReload(); draw(); dirty2(); },
        function (e) { toast(e.message, "error"); dirty2(); });
    });
    draw(); body.appendChild(out); body.appendChild(tb);
  }
  var VIEWS = {
    menus: menusView, widgets: widgetsView, accueil: homeView,
    "themebuilder-header": headerView,
    "themebuilder-footer": function (body) { body.appendChild(note("L'en-tête et le pied de page se composent dans le Theme Builder (leur unique gestionnaire : création, affectation, publication).", boot.links.themeBuilder, "Ouvrir le Theme Builder")); }
  };
  boot.categories.forEach(function (cat) {
    K.registerPanel(cat.id, { render: function (container) {
      var body = h("div", { class: "kwc-fields" }); container.appendChild(body);
      var render = function () {
        body.textContent = "";
        if (cat.id === "css-additionnel" && cssView(body, cat)) return;
        if (cat.view && VIEWS[cat.view] && (cat.view.indexOf("themebuilder") === 0)) VIEWS[cat.view](body);
        var ps = cat.panels.map(function (id) { return panelById[id]; }).filter(Boolean);
        if (cat.panels.length && !ps.length) body.appendChild(h("p", { class: "kwc-empty-note", text: "Aucun réglage de cette catégorie n'est disponible pour ce site." }));
        ps.forEach(function (p) {
          if (ps.length > 1) { var det = h("details", { class: "kwc-group", open: true }, [h("summary", { class: "kwc-group-title", text: p.label })]); body.appendChild(det); panelFields(p, det); }
          else panelFields(p, body);
        });
        if (cat.view && VIEWS[cat.view] && cat.view.indexOf("themebuilder") !== 0) VIEWS[cat.view](body);
        updateVisibility(); renderCounts(); showErrors();
        if (cat.id === "global" && warnings.length) { var d = h("div", { class: "kwc-warn", role: "status" }, [h("strong", { text: "Lisibilité" })]); var ul = h("ul"); warnings.forEach(function (w) { ul.appendChild(h("li", { text: w })); }); d.appendChild(ul); body.appendChild(d); }
      };
      render();
      var off = function () { if (body.isConnected && K.state.category === cat.id) render(); };
      K.on("settings:rerender", off);
    } });
  });
  status();
})();
