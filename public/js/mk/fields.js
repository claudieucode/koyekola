// Contrôles communs du panneau de réglages des blocs (éditeur d'e-mails). Un seul système pour tous les blocs :
// section, champ, texte, nombre, liste, choix segmenté, interrupteur, couleur, espacement, typographie, bordure.
// Chaque contrôle lit et écrit directement une propriété du bloc (ou de ses sous-objets box / mobile) :
// vide = valeur héritée (styles globaux), affichée comme telle, avec un retour à la valeur globale.
// Identifiants stables : « f-<bloc>-<propriété> » (les étiquettes restent associées, les tests aussi).
(function () {
  "use strict";
  function create(api) {
    var el = api.el, iconSpan = api.iconSpan;
    var ro = function () { return api.readOnly; };
    function changed(structural) { api.changed(structural); }

    // ---------- Structure ----------
    function section(title, nodes, opts) {
      opts = opts || {};
      return { title: title, nodes: (nodes || []).filter(Boolean), hint: opts.hint, cls: opts.cls };
    }
    function field(labelText, control, opts) {
      opts = opts || {};
      var wrap = el("div", { "class": "mk-fx" + (opts.inline ? " is-inline" : "") });
      var head = el("div", { "class": "mk-fx-head" });
      head.appendChild(el(opts.group ? "span" : "label", opts.group ? { "class": "mk-fx-label", id: control.id + "-label" } : { "class": "mk-fx-label", "for": control.id }, labelText));
      if (opts.reset) head.appendChild(opts.reset);
      wrap.appendChild(head);
      wrap.appendChild(control);
      if (opts.hint) wrap.appendChild(el("p", { "class": "mk-fx-hint" }, opts.hint));
      return wrap;
    }
    // Bouton « valeur globale » : visible seulement quand une valeur locale remplace la valeur héritée
    // Toujours présent (masqué tant qu'aucune valeur locale) : b.sync() après chaque saisie
    function resetButton(target, keys, labelText, after) {
      keys = [].concat(keys);
      if (ro()) return null;
      var b = el("button", { type: "button", "class": "mk-fx-reset", "aria-label": labelText + " : revenir à la valeur globale", title: "Revenir à la valeur globale" }, "Valeur globale");
      b.sync = function () { b.hidden = !keys.some(function (k) { return target[k] != null && target[k] !== ""; }); };
      b.sync();
      b.addEventListener("click", function () { keys.forEach(function (k) { delete target[k]; }); changed(); api.rerender(); if (after) after(); api.announce(labelText + " : valeur globale rétablie."); });
      return b;
    }
    function syncReset(r) { if (r && r.sync) r.sync(); }

    // ---------- Champs simples ----------
    function text(target, key, labelText, o) {
      o = o || {};
      var input = el("input", { type: "text", id: "f-" + o.owner + "-" + key, maxlength: String(o.max || 500) });
      if (o.vars) input.setAttribute("data-var-target", "");
      if (o.placeholder) input.setAttribute("placeholder", o.placeholder);
      input.value = target[key] == null ? "" : String(target[key]);
      input.disabled = ro();
      input.addEventListener("input", function () { target[key] = input.value; changed(); });
      return field(labelText, input, { hint: o.hint });
    }
    function number(target, key, labelText, o) {
      o = o || {};
      var box = el("div", { "class": "mk-fx-num" });
      var input = el("input", { type: "number", id: "f-" + o.owner + "-" + key, min: String(o.min), max: String(o.max), step: String(o.step || 1), placeholder: o.inherit != null ? String(o.inherit) : "" });
      if (o.list) input.setAttribute("list", o.list);
      input.value = target[key] == null ? "" : String(target[key]);
      input.disabled = ro();
      box.appendChild(input);
      if (o.unit) box.appendChild(el("span", { "class": "mk-fx-unit", "aria-hidden": "true" }, o.unit));
      var err = el("p", { "class": "mk-fx-error", role: "alert" });
      var reset = o.inherit != null ? resetButton(target, key, labelText) : null;
      input.addEventListener("input", function () {
        var n = o.step && o.step < 1 ? parseFloat(input.value) : parseInt(input.value, 10);
        if (input.value === "") { delete target[key]; err.textContent = ""; changed(); syncReset(reset); return; }
        if (isNaN(n) || n < o.min || n > o.max) { err.textContent = "De " + o.min + " à " + o.max + (o.unit ? " " + o.unit : "") + "."; input.setAttribute("aria-invalid", "true"); return; }
        err.textContent = ""; input.removeAttribute("aria-invalid"); target[key] = n; changed(); syncReset(reset);
      });
      var w = field(labelText, box, { hint: o.hint, reset: reset });
      input.id && w.querySelector("label") && w.querySelector("label").setAttribute("for", input.id);
      w.appendChild(err);
      return w;
    }
    function select(target, key, labelText, options, o) {
      o = o || {};
      var sel = el("select", { id: "f-" + o.owner + "-" + key });
      if (o.inherit) sel.appendChild(el("option", { value: "" }, o.inherit));
      options.forEach(function (x) { sel.appendChild(el("option", { value: String(x[0]) }, x[1])); });
      sel.value = target[key] == null ? (o.inherit ? "" : String(o.fallback)) : String(target[key]);
      sel.disabled = ro();
      sel.addEventListener("change", function () {
        if (sel.value === "" && o.inherit) delete target[key];
        else target[key] = o.int ? parseInt(sel.value, 10) : o.float ? parseFloat(sel.value) : sel.value;
        changed(o.structural); if (o.rerender) api.rerender();
      });
      return field(labelText, sel, { hint: o.hint });
    }
    // Choix en boutons (un seul actif, flèches du clavier) ; o.inherit : premier choix « valeur globale » (vide)
    function segment(target, key, labelText, options, o) {
      o = o || {};
      var id = "f-" + o.owner + "-" + key;
      var opts = (o.inherit ? [["", o.inherit]] : []).concat(options);
      var current = target[key] == null ? (o.inherit ? "" : o.fallback) : target[key];
      var row = el("div", { "class": "mk-seg", role: "radiogroup", id: id, "aria-labelledby": id + "-label" });
      var btns = [];
      opts.forEach(function (x) {
        var on = String(x[0]) === String(current);
        var b = el("button", { type: "button", "class": "mk-seg-btn", role: "radio", "aria-checked": String(on), tabindex: on ? "0" : "-1" });
        if (x[2]) { b.appendChild(iconSpan(x[2])); b.setAttribute("aria-label", x[1]); b.setAttribute("title", x[1]); } else b.textContent = x[1];
        b.disabled = ro();
        b.addEventListener("click", function () {
          if (x[0] === "") delete target[key]; else target[key] = o.int ? parseInt(x[0], 10) : x[0];
          btns.forEach(function (y) { var s = y === b; y.setAttribute("aria-checked", String(s)); y.tabIndex = s ? 0 : -1; });
          if (o.onPick) o.onPick(x[0]);
          changed(o.structural); if (o.rerender) api.rerender();
        });
        b.addEventListener("keydown", function (e) {
          var i = btns.indexOf(b), n = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
          if (!n) return; e.preventDefault(); var t = btns[(i + n + btns.length) % btns.length]; t.focus(); t.click();
        });
        btns.push(b); row.appendChild(b);
      });
      if (!btns.some(function (b) { return b.tabIndex === 0; }) && btns[0]) btns[0].tabIndex = 0;
      return field(labelText, row, { group: true, hint: o.hint });
    }
    // Interrupteur (case à cocher) ; o.invert : coché = propriété absente (ex. « Afficher sur mobile » = !hideMobile)
    function toggle(target, key, labelText, o) {
      o = o || {};
      var input = el("input", { type: "checkbox", id: "f-" + o.owner + "-" + key + (o.suffix || ""), "class": "mk-fx-switch" });
      // o.defaultOn : actif par défaut (ex. italique d'une citation) — décoché = false enregistré, coché = valeur par défaut
      var on = o.defaultOn ? target[key] !== false : !!target[key]; input.checked = o.invert ? !on : on;
      input.disabled = ro();
      input.addEventListener("change", function () {
        if (o.defaultOn) { if (input.checked) delete target[key]; else target[key] = false; changed(o.structural); return; }
        var val = o.invert ? !input.checked : input.checked;
        if (o.guard && o.guard(val, input) === false) return;
        if (val) target[key] = o.value != null ? o.value : true; else if (o.keepFalse) target[key] = false; else delete target[key];
        changed(o.structural); if (o.rerender) api.rerender();
      });
      var lab = el("label", { "class": "mk-fx-toggle", "for": input.id }); lab.appendChild(input); lab.appendChild(el("span", {}, labelText));
      var w = el("div", { "class": "mk-fx" }); w.appendChild(lab);
      if (o.hint) w.appendChild(el("p", { "class": "mk-fx-hint" }, o.hint));
      return w;
    }

    // ---------- Couleur : aperçu + sélecteur + HEX ; vide = valeur héritée affichée ----------
    function color(target, key, labelText, o) {
      o = o || {};
      var id = "f-" + o.owner + "-" + key;
      var own = target[key];
      var shown = own || o.inherit || "#000000";
      var box = el("div", { "class": "mk-fx-color" + (own ? "" : " is-inherited") });
      var pick = el("input", { type: "color", id: id + "-picker", "aria-label": labelText + " (sélecteur)" });
      pick.value = /^#[0-9a-f]{6}$/i.test(shown) ? shown : "#000000";
      var hex = el("input", { type: "text", id: id, maxlength: "7", spellcheck: "false", autocomplete: "off", "aria-label": labelText + " (code HEX)", placeholder: o.inherit ? o.inherit.toUpperCase() : "#RRGGBB" });
      hex.value = own ? own.toUpperCase() : "";
      var note = el("span", { "class": "mk-fx-color-note" }, own ? "" : (o.inheritLabel || "Comme le message"));
      pick.disabled = hex.disabled = ro();
      var reset = resetButton(target, key, labelText);
      var apply = function (v) { target[key] = v.toLowerCase(); box.classList.remove("is-inherited"); note.textContent = ""; changed(); syncReset(reset); };
      pick.addEventListener("input", function () { hex.value = pick.value.toUpperCase(); hex.removeAttribute("aria-invalid"); apply(pick.value); });
      pick.addEventListener("change", function () { api.rerender(); });
      hex.addEventListener("input", function () {
        var v = hex.value.trim(); if (v && v.charAt(0) !== "#") v = "#" + v;
        if (v === "") { delete target[key]; box.classList.add("is-inherited"); note.textContent = o.inheritLabel || "Comme le message"; changed(); syncReset(reset); return; }
        if (/^#[0-9a-f]{6}$/i.test(v)) { hex.removeAttribute("aria-invalid"); pick.value = v.toLowerCase(); apply(v); } else hex.setAttribute("aria-invalid", "true");
      });
      hex.addEventListener("blur", function () { if (hex.getAttribute("aria-invalid") === "true") { hex.value = target[key] ? target[key].toUpperCase() : ""; hex.removeAttribute("aria-invalid"); } });
      box.appendChild(pick); box.appendChild(hex); box.appendChild(note);
      return field(labelText, box, { reset: reset, hint: o.hint });
    }

    // ---------- Espacement : 4 côtés, « même valeur partout », valeurs proposées ----------
    var SIDES = [["padTop", "Haut"], ["padBottom", "Bas"], ["padLeft", "Gauche"], ["padRight", "Droite"]];
    function spacing(box, labelText, o) {
      o = o || {};
      var inherit = o.inherit || {};
      var vals = SIDES.map(function (s) { return box[s[0]]; });
      var same = vals.every(function (v) { return v != null && v === vals[0]; });
      var wrap = el("div", { "class": "mk-fx mk-fx-spacing" });
      var head = el("div", { "class": "mk-fx-head" });
      head.appendChild(el("span", { "class": "mk-fx-label" }, labelText));
      var r = resetButton(box, SIDES.map(function (s) { return s[0]; }), labelText); if (r) head.appendChild(r);
      var resync = function () { syncReset(r); };
      wrap.appendChild(head);
      var listId = "mk-fx-pads";
      if (!document.getElementById(listId)) { var dl = el("datalist", { id: listId }); [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64].forEach(function (n) { dl.appendChild(el("option", { value: String(n) })); }); document.body.appendChild(dl); }
      var grid = el("div", { "class": "mk-fx-grid4" });
      var inputs = [];
      SIDES.forEach(function (s, i) {
        var id = "f-" + o.owner + "-" + s[0];
        var cell = el("div", { "class": "mk-fx-side" });
        cell.appendChild(el("label", { "for": id }, s[1]));
        var input = el("input", { type: "number", id: id, min: "0", max: "64", step: "1", list: listId, placeholder: inherit[s[0]] != null ? String(inherit[s[0]]) : "auto" });
        input.value = box[s[0]] == null ? "" : String(box[s[0]]);
        input.disabled = ro();
        input.addEventListener("input", function () {
          var n = parseInt(input.value, 10);
          var targets = linked.checked ? SIDES.map(function (x) { return x[0]; }) : [s[0]];
          if (input.value === "") targets.forEach(function (k) { delete box[k]; });
          else if (!isNaN(n) && n >= 0 && n <= 64) targets.forEach(function (k) { box[k] = n; });
          else return;
          if (linked.checked) inputs.forEach(function (x) { if (x !== input) x.value = input.value; });
          changed(); resync();
        });
        inputs.push(input);
        cell.appendChild(input); grid.appendChild(cell);
      });
      wrap.appendChild(grid);
      var linked = el("input", { type: "checkbox", id: "f-" + o.owner + "-padsame", "class": "mk-fx-switch" });
      linked.checked = same; linked.disabled = ro();
      linked.addEventListener("change", function () {
        if (linked.checked) { var v = inputs[0].value; inputs.forEach(function (x) { x.value = v; }); SIDES.forEach(function (x) { if (v === "") delete box[x[0]]; else box[x[0]] = parseInt(v, 10); }); changed(); }
      });
      var ll = el("label", { "class": "mk-fx-toggle", "for": linked.id }); ll.appendChild(linked); ll.appendChild(el("span", {}, "Même valeur partout"));
      wrap.appendChild(ll);
      wrap.appendChild(el("p", { "class": "mk-fx-hint" }, o.hint || "En pixels (0 à 64). Vide = valeur des styles globaux."));
      return wrap;
    }

    // ---------- Bordure ----------
    var BORDER_STYLES = [["none", "Aucune"], ["solid", "Pleine"], ["dashed", "Tirets"], ["dotted", "Pointillés"]];
    function border(holder, key, o) {
      o = o || {};
      var bd = holder[key] = holder[key] || {};
      var nodes = [segment(bd, "style", "Style", BORDER_STYLES.slice(1), { owner: o.owner + "-bd", inherit: "Aucune", rerender: true })];
      if (bd.style && bd.style !== "none") {
        var row = el("div", { "class": "mk-fx-grid2" });
        row.appendChild(number(bd, "width", "Épaisseur", { owner: o.owner + "-bd", min: 1, max: 8, unit: "px", inherit: 1 }));
        row.appendChild(color(bd, "color", "Couleur", { owner: o.owner + "-bd", inherit: "#d5e3ee", inheritLabel: "Gris clair (par défaut)" }));
        nodes.push(row);
      }
      if (o.radius !== false) nodes.push(number(bd, "radius", "Arrondi des coins", { owner: o.owner + "-bd", min: 0, max: 40, unit: "px", inherit: 0 }));
      return nodes;
    }

    // ---------- Typographie : seulement ce que le bloc sait rendre ----------
    var ALIGNS = [["left", "À gauche", "alignLeft"], ["center", "Centré", "alignCenter"], ["right", "À droite", "alignRight"]];
    function typography(block, spec) {
      var owner = block.id, theme = api.theme(), out = [];
      if (spec.font) out.push(select(block, "font", "Police", api.fonts(), { owner: owner, inherit: "Comme le message (" + (api.fontLabel(theme.fontFamily)) + ")" }));
      var row = el("div", { "class": "mk-fx-grid2" });
      if (spec.size) row.appendChild(number(block, "fontSize", "Taille", { owner: owner, min: spec.size[0], max: spec.size[1], unit: "px", inherit: spec.size[2] }));
      if (spec.lineHeight) row.appendChild(select(block, "lineHeight", "Interligne", [["1.2", "Serré (1,2)"], ["1.4", "1,4"], ["1.6", "Standard (1,6)"], ["1.8", "Aéré (1,8)"], ["2", "Double (2)"]], { owner: owner, inherit: "Normal", float: true }));
      if (row.childNodes.length) out.push(row);
      if (spec.color) out.push(color(block, "color", spec.colorLabel || "Couleur du texte", { owner: owner, inherit: spec.colorInherit || theme.textColor, inheritLabel: spec.colorInheritLabel }));
      if (spec.align) out.push(segment(block, "align", "Alignement", ALIGNS, { owner: owner, inherit: spec.align === "inherit" ? "Auto" : null, fallback: spec.align === "inherit" ? "" : spec.align }));
      var row2 = el("div", { "class": "mk-fx-grid2" });
      if (spec.weight) row2.appendChild(segment(block, "weight", "Graisse", [["normal", "Normale"], ["bold", "Grasse"]], { owner: owner, fallback: spec.weight }));
      if (spec.letterSpacing) row2.appendChild(number(block, "letterSpacing", "Espacement des lettres", { owner: owner, min: 0, max: 10, unit: "px", inherit: 0 }));
      if (row2.childNodes.length) out.push(row2);
      if (spec.italic) out.push(toggle(block, "italic", "Italique", { owner: owner, defaultOn: spec.italic === "default-on" }));
      return out;
    }

    return { section: section, field: field, text: text, number: number, select: select, segment: segment, toggle: toggle, color: color, spacing: spacing, border: border, typography: typography, resetButton: resetButton, ALIGNS: ALIGNS };
  }
  window.MkFields = { create: create };
})();
