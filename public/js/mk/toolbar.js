// Barre d'outils contextuelle universelle de l'éditeur d'e-mails (au-dessus du canevas).
// - Un REGISTRE associe chaque type de bloc à ses groupes d'outils : ajouter un type = enregistrer ses outils,
//   sans toucher à la barre elle-même.
// - Les contrôles lisent et écrivent les VRAIES données du bloc sélectionné (mêmes champs que le panneau de droite),
//   via l'interface fournie par l'éditeur (api) : historique, aperçu, enregistrement automatique et panneau restent
//   ceux de l'éditeur — aucun état parallèle.
// - Le texte se met en forme dans le canevas même (édition directe) : les commandes passent par api.text.
// - Les groupes qui ne tiennent pas dans la largeur passent dans le menu « Plus » (calque flottant commun).
(function () {
  "use strict";
  var REGISTRY = {};
  function register(type, build) { REGISTRY[type] = build; }

  function create(api) {
    var root = api.root, el = api.el, iconSpan = api.iconSpan;
    var syncers = [], groups = [], pops = [];
    var shown = { id: undefined, type: undefined };
    var bar = el("div", { "class": "mk-tb-bar" });
    var moreWrap = el("div", { "class": "mk-tb-group mk-tb-more", hidden: true });
    var morePanel = el("div", { "class": "mk-tb-pop mk-tb-morepanel", role: "group", "aria-label": "Autres outils", hidden: true });
    root.appendChild(bar); root.appendChild(morePanel);

    // ---------- Contrôles réutilisables ----------
    function tip(node, label) { node.setAttribute("aria-label", label); node.setAttribute("data-tip", label); }
    function keepSelection(node) { node.addEventListener("mousedown", function (e) { e.preventDefault(); }); } // le texte sélectionné dans l'e-mail reste sélectionné
    function button(o) {
      var b = el("button", { type: "button", "class": "mk-tb-btn" + (o.text ? " has-text" : "") });
      tip(b, o.label);
      if (o.icon) b.appendChild(iconSpan(o.icon, "mk-tb-ico"));
      if (o.glyph) b.appendChild(el("span", { "class": "mk-tb-glyph" + (o.glyphClass ? " " + o.glyphClass : ""), "aria-hidden": "true" }, o.glyph));
      if (o.text) b.appendChild(el("span", { "class": "mk-tb-text" }, o.text));
      if (o.keep) keepSelection(b);
      if (o.active) b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { if (b.getAttribute("aria-disabled") === "true") return; o.run(b); sync(); });
      syncers.push(function () {
        if (o.active) b.setAttribute("aria-pressed", o.active() ? "true" : "false");
        if (o.disabled) { var d = !!o.disabled(); b.setAttribute("aria-disabled", String(d)); }
      });
      return b;
    }
    function select(o) {
      var s = el("select", { "class": "mk-tb-select" + (o.cls ? " " + o.cls : "") });
      tip(s, o.label); s.title = o.label;
      var extra = el("option", { value: "__current", hidden: true }, "");
      s.appendChild(extra);
      o.options.forEach(function (x) { s.appendChild(el("option", { value: String(x[0]) }, x[1])); });
      s.addEventListener("change", function () { if (s.value !== "__current") o.set(s.value); sync(); if (o.after) o.after(); });
      syncers.push(function () {
        var v = o.value(); v = v == null ? "" : String(v);
        var known = [].some.call(s.options, function (op) { return op.value === v && op !== extra; });
        if (known) s.value = v; else { extra.textContent = o.format ? o.format(v) : v; s.value = "__current"; }
        if (o.disabled) s.disabled = !!o.disabled();
      });
      return s;
    }
    function number(o) {
      var wrap = el("label", { "class": "mk-tb-num", title: o.label });
      wrap.appendChild(el("span", { "class": "mk-tb-num-label", "aria-hidden": "true" }, o.short));
      var input = el("input", { type: "number", min: String(o.min), max: String(o.max), step: "1", placeholder: o.placeholder || "", "aria-label": o.label });
      wrap.appendChild(input);
      if (o.unit) wrap.appendChild(el("span", { "class": "mk-tb-unit", "aria-hidden": "true" }, o.unit));
      input.addEventListener("input", function () {
        var n = parseInt(input.value, 10);
        if (input.value === "") o.set(undefined);
        else if (!isNaN(n) && n >= o.min && n <= o.max) o.set(n);
      });
      input.addEventListener("change", function () { var n = parseInt(input.value, 10); if (input.value !== "" && (isNaN(n) || n < o.min || n > o.max)) { input.value = o.value() == null ? "" : o.value(); api.announce("Valeur refusée : de " + o.min + " à " + o.max + "."); } });
      syncers.push(function () { if (document.activeElement !== input) { var v = o.value(); input.value = v == null ? "" : String(v); } });
      return wrap;
    }
    function color(o) {
      var lab = el("label", { "class": "mk-tb-btn mk-tb-color" });
      tip(lab, o.label);
      if (o.icon) lab.appendChild(iconSpan(o.icon, "mk-tb-ico")); else lab.appendChild(el("span", { "class": "mk-tb-glyph", "aria-hidden": "true" }, o.glyph || "A"));
      var swatch = el("span", { "class": "mk-tb-swatch", "aria-hidden": "true" });
      var input = el("input", { type: "color", "class": "mk-tb-colorinput", "aria-label": o.label });
      lab.appendChild(swatch); lab.appendChild(input);
      if (o.keep) lab.addEventListener("mousedown", function () { if (api.text.saveRange) api.text.saveRange(); });
      input.addEventListener("input", function () { swatch.style.background = input.value; if (o.live) o.set(input.value); });
      input.addEventListener("change", function () { o.set(input.value); sync(); });
      syncers.push(function () {
        var v = o.value();
        swatch.style.background = v || "transparent"; swatch.classList.toggle("is-empty", !v);
        if (v && /^#[0-9a-f]{6}$/i.test(v)) input.value = v;
        var d = o.disabled && o.disabled(); input.disabled = !!d; lab.setAttribute("aria-disabled", String(!!d));
      });
      return lab;
    }
    // Petit panneau flottant (lien, texte alternatif, espacement, bordure, visibilité…)
    function popover(o) {
      var panel = el("div", { "class": "mk-tb-pop", role: "dialog", "aria-label": o.label, hidden: true });
      root.appendChild(panel);
      var b = button({ icon: o.icon, glyph: o.glyph, text: o.text, label: o.label, keep: o.keep, active: o.active, disabled: o.disabled, run: function () { if (panel.hidden) open(); else close(true); } });
      b.setAttribute("aria-haspopup", "dialog"); b.setAttribute("aria-expanded", "false");
      function open() {
        closePops();
        panel.textContent = "";
        panel.appendChild(el("p", { "class": "mk-tb-pop-title" }, o.label));
        o.build(panel, close);
        // Ouvert depuis le menu « Plus » : le menu se referme et le panneau s'ancre sur le bouton « Plus »
        var anchor = morePanel.contains(b) ? moreWrap.querySelector("button") : b;
        closeMore();
        panel.hidden = false; b.setAttribute("aria-expanded", "true");
        if (window.kbFloat) window.kbFloat.open(anchor, panel, { align: anchor === b ? "start" : "end", onClose: function () { panel.hidden = true; b.setAttribute("aria-expanded", "false"); } });
        var first = panel.querySelector("input:not([type=hidden]):not([disabled]), select, button"); if (first) first.focus();
      }
      function close(refocus) {
        if (panel.hidden) return;
        if (window.kbFloat) window.kbFloat.close(panel);
        panel.hidden = true; b.setAttribute("aria-expanded", "false");
        if (refocus) b.focus();
      }
      panel.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); close(true); } });
      pops.push({ panel: panel, button: b, close: close });
      return b;
    }
    function closePops() { pops.forEach(function (p) { p.close(false); }); }
    document.addEventListener("mousedown", function (e) {
      pops.forEach(function (p) { if (!p.panel.hidden && !p.panel.contains(e.target) && !p.button.contains(e.target)) p.close(false); });
      if (!morePanel.hidden && !morePanel.contains(e.target) && !moreWrap.contains(e.target) && !pops.some(function (p) { return p.panel.contains(e.target); })) closeMore();
    });
    // Champs des panneaux flottants
    function field(labelText, control, hint) {
      var w = el("div", { "class": "mk-tb-field" });
      var id = "mk-tb-" + Math.random().toString(36).slice(2, 8);
      control.id = control.id || id;
      w.appendChild(el("label", { "for": control.id }, labelText));
      w.appendChild(control);
      if (hint) w.appendChild(el("p", { "class": "mk-tb-hint" }, hint));
      return w;
    }
    function textInput(value, attrs) { var i = el("input", Object.assign({ type: "text" }, attrs || {})); i.value = value == null ? "" : String(value); return i; }
    function numInput(value, min, max, placeholder) { var i = el("input", { type: "number", min: String(min), max: String(max), step: "1", placeholder: placeholder || "" }); i.value = value == null ? "" : String(value); return i; }
    function intOrU(v) { var n = parseInt(v, 10); return v === "" || isNaN(n) ? undefined : n; }
    function check(labelText, checked, onChange) {
      var id = "mk-tb-c" + Math.random().toString(36).slice(2, 8);
      var i = el("input", { type: "checkbox", id: id }); i.checked = !!checked;
      i.addEventListener("change", function () { onChange(i.checked, i); });
      var l = el("label", { "class": "checkbox-row", "for": id }); l.appendChild(i); l.appendChild(document.createTextNode(" " + labelText));
      return l;
    }
    function actions(okText, onOk, extra) {
      var row = el("div", { "class": "mk-tb-pop-actions" });
      if (extra) row.appendChild(extra);
      var ok = el("button", { type: "button", "class": "btn btn-primary btn-sm" }, okText);
      ok.addEventListener("click", onOk); row.appendChild(ok);
      return row;
    }
    function errorLine() { return el("p", { "class": "mk-tb-error", role: "alert" }); }
    var C = { button: button, select: select, number: number, color: color, popover: popover, field: field, textInput: textInput, numInput: numInput, intOrU: intOrU, check: check, actions: actions, errorLine: errorLine, keepSelection: keepSelection };

    // ---------- Rendu ----------
    function group(def) {
      var g = el("div", { "class": "mk-tb-group", role: "group", "aria-label": def.name });
      g.setAttribute("data-priority", String(def.priority || 1));
      def.items.filter(Boolean).forEach(function (n) { g.appendChild(n); });
      if (def.when) syncers.push(function () { var h = !def.when(); if (g.hidden !== h) { g.hidden = h; needFit = true; } }); // groupe affiché seulement dans certains états
      return g;
    }
    function render(force) {
      var block = api.block();
      var type = block ? block.type : "__none";
      if (!force && shown.id === (block ? block.id : null) && shown.type === type) { sync(); return; }
      shown = { id: block ? block.id : null, type: type };
      closePops(); closeMore();
      pops.forEach(function (p) { p.panel.remove(); });
      syncers = []; pops = []; groups = [];
      bar.textContent = ""; morePanel.textContent = "";
      var build = REGISTRY[type] || REGISTRY.__generic;
        groups = build({ block: api.block, api: api, C: C }).map(group);
      groups.forEach(function (g) { bar.appendChild(g); });
      // Menu « Plus » : outils qui ne tiennent pas dans la largeur
      moreWrap.textContent = "";
      var mb = button({ icon: "moreHorizontal", label: "Plus d'outils", run: function () { if (morePanel.hidden) openMore(mb); else closeMore(); } });
      mb.setAttribute("aria-haspopup", "true"); mb.setAttribute("aria-expanded", "false");
      moreWrap.appendChild(mb);
      bar.appendChild(moreWrap);
      root.setAttribute("data-context", type);
      root.setAttribute("aria-label", "Outils : " + (block ? api.label(block) : "message (aucun bloc sélectionné)"));
      sync(); fit();
    }
    function openMore(btn) {
      closePops();
      morePanel.hidden = false; btn.setAttribute("aria-expanded", "true");
      if (window.kbFloat) window.kbFloat.open(btn, morePanel, { onClose: function () { morePanel.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
    }
    function closeMore() {
      if (morePanel.hidden) return;
      if (window.kbFloat) window.kbFloat.close(morePanel);
      morePanel.hidden = true;
      var b = moreWrap.querySelector("button"); if (b) b.setAttribute("aria-expanded", "false");
    }
    // Les groupes de priorité la plus basse (puis les derniers) passent dans « Plus » jusqu'à ce que la barre tienne
    function fit() {
      closeMore();
      groups.forEach(function (g) { bar.insertBefore(g, moreWrap); });
      moreWrap.hidden = true;
      if (bar.scrollWidth <= bar.clientWidth + 1) return;
      moreWrap.hidden = false;
      var order = groups.map(function (g, i) { return { g: g, p: parseInt(g.getAttribute("data-priority"), 10), i: i }; })
        .sort(function (a, b) { return b.p - a.p || b.i - a.i; });
      var moved = [];
      for (var k = 0; k < order.length && bar.scrollWidth > bar.clientWidth + 1; k++) { moved.push(order[k]); morePanel.appendChild(order[k].g); }
      // ordre d'origine dans le menu « Plus »
      moved.sort(function (a, b) { return a.i - b.i; }).forEach(function (m) { morePanel.appendChild(m.g); });
    }
    var needFit = false;
    function sync() {
      syncers.forEach(function (fn) { try { fn(); } catch (e) { /* contrôle d'un bloc disparu : ignoré jusqu'au prochain rendu */ } });
      if (needFit) { needFit = false; fit(); }
    }
    if (window.ResizeObserver) new ResizeObserver(function () { fit(); }).observe(root);
    return { render: render, sync: sync, fit: fit, closePops: closePops };
  }

  // ======================================================================
  // Outils par type de bloc
  // ======================================================================
  var ALIGNS = [["left", "alignLeft", "À gauche"], ["center", "alignCenter", "Centré"], ["right", "alignRight", "À droite"]];
  function alignButtons(ctx, get, set) {
    return ALIGNS.map(function (a) { return ctx.C.button({ icon: a[1], label: "Aligner " + a[2].toLowerCase(), active: function () { return (get() || "left") === a[0]; }, run: function () { set(a[0]); } }); });
  }
  // Données d'un bloc : écrire puis prévenir l'éditeur (historique, aperçu, enregistrement, panneau)
  function setter(ctx, key, opts) {
    return function (v) { var b = ctx.block(); if (!b) return; b[key] = v === "" ? undefined : v; ctx.api.blockChanged(opts); };
  }
  function getter(ctx, key, fallback) { return function () { var b = ctx.block(); return b && b[key] != null ? b[key] : fallback; }; }
  function boxOf(ctx) { var b = ctx.block(); b.box = b.box || {}; return b.box; }

  // Panneaux communs : espacement intérieur, bordure, visibilité
  function spacingPop(ctx) {
    return ctx.C.popover({ icon: "spacing", label: "Espacement intérieur", build: function (p) {
      var box = boxOf(ctx), C = ctx.C, grid = document.createElement("div"); grid.className = "mk-tb-grid2";
      [["padTop", "Haut", "auto"], ["padBottom", "Bas", "auto"], ["padLeft", "Gauche", "24"], ["padRight", "Droite", "24"]].forEach(function (f) {
        var i = C.numInput(box[f[0]], 0, 64, f[2]);
        i.addEventListener("input", function () { var n = C.intOrU(i.value); if (n === undefined || (n >= 0 && n <= 64)) { box[f[0]] = n; ctx.api.blockChanged(); } });
        grid.appendChild(C.field(f[1] + " (px)", i));
      });
      p.appendChild(grid);
      p.appendChild(ctx.api.el("p", { "class": "mk-tb-hint" }, "Vide = espacement des styles globaux (24 px à gauche et à droite)."));
    } });
  }
  function borderPop(ctx, label) {
    return ctx.C.popover({ icon: "borderBox", label: label || "Bordure du bloc", build: function (p) {
      var box = boxOf(ctx), C = ctx.C; box.border = box.border || {};
      var bd = box.border;
      var style = document.createElement("select");
      [["none", "Aucune"], ["solid", "Pleine"], ["dashed", "Tirets"], ["dotted", "Pointillés"]].forEach(function (o) { style.appendChild(ctx.api.el("option", { value: o[0] }, o[1])); });
      style.value = bd.style || "none";
      var width = C.numInput(bd.width, 1, 8, "1"), color = document.createElement("input"), radius = C.numInput(bd.radius, 0, 40, "0");
      color.type = "color"; color.value = bd.color || "#d5e3ee";
      style.addEventListener("change", function () { bd.style = style.value === "none" ? undefined : style.value; if (bd.style && !bd.color) bd.color = color.value; ctx.api.blockChanged(); });
      width.addEventListener("input", function () { var n = C.intOrU(width.value); if (n === undefined || (n >= 1 && n <= 8)) { bd.width = n; ctx.api.blockChanged(); } });
      color.addEventListener("input", function () { bd.color = color.value; ctx.api.blockChanged(); });
      radius.addEventListener("input", function () { var n = C.intOrU(radius.value); if (n === undefined || (n >= 0 && n <= 40)) { bd.radius = n; ctx.api.blockChanged(); } });
      var g = document.createElement("div"); g.className = "mk-tb-grid2";
      g.appendChild(C.field("Style", style)); g.appendChild(C.field("Épaisseur (px)", width)); g.appendChild(C.field("Couleur", color)); g.appendChild(C.field("Arrondi (px)", radius));
      p.appendChild(g);
    } });
  }
  function visibilityPop(ctx) {
    return ctx.C.popover({ icon: "eye", label: "Visibilité", active: function () { var b = ctx.block(); return !!(b && (b.hidden || (b.box && (b.box.hideMobile || b.box.hideDesktop)))); }, build: function (p) {
      var box = boxOf(ctx), C = ctx.C, b = ctx.block();
      var msg = C.errorLine();
      [["hideDesktop", "Afficher sur ordinateur"], ["hideMobile", "Afficher sur mobile"]].forEach(function (d) {
        p.appendChild(C.check(d[1], !box[d[0]], function (on, input) {
          var other = d[0] === "hideMobile" ? "hideDesktop" : "hideMobile";
          if (!on && box[other]) { input.checked = true; msg.textContent = "Un bloc s'affiche au moins sur un appareil."; return; }
          msg.textContent = ""; box[d[0]] = on ? undefined : true; ctx.api.blockChanged({ structural: true });
        }));
      });
      p.appendChild(C.check("Envoyer ce bloc", !b.hidden, function (on) { if (on === !ctx.block().hidden) return; ctx.api.toggleHidden(); }));
      p.appendChild(msg);
    } });
  }
  function settingsButton(ctx) {
    return ctx.C.button({ icon: "settings", text: "Réglages", label: "Tous les réglages du bloc (panneau de droite)", run: function () { ctx.api.openProps("styles"); } });
  }
  function fontSelect(ctx, key, label, emptyLabel) {
    return ctx.C.select({ label: label, cls: "is-font", options: [["", emptyLabel]].concat(ctx.api.fonts()), value: getter(ctx, key, ""), set: setter(ctx, key) });
  }

  // ---------- Aucun bloc sélectionné : réglages généraux du message (styles globaux) ----------
  register("__none", function (ctx) {
    var C = ctx.C, api = ctx.api;
    var theme = function (k) { return function () { return api.theme()[k]; }; };
    var setTheme = function (k) { return function (v) { api.setTheme(k, v); }; };
    return [
      { name: "Ajouter", priority: 1, items: [C.popover({ icon: "plus", text: "Ajouter un bloc", label: "Ajouter un bloc", build: function (p, close) {
        var list = api.el("div", { "class": "mk-tb-addlist" });
        api.blockTypes().forEach(function (t) {
          var b = api.el("button", { type: "button", "class": "mk-tb-additem" }, t[1]);
          b.addEventListener("click", function () { close(false); api.addBlock(t[0]); });
          list.appendChild(b);
        });
        p.appendChild(list);
      } })] },
      { name: "Police du message", priority: 1, items: [C.select({ label: "Police du message", cls: "is-font", options: api.fonts(), value: theme("fontFamily"), set: setTheme("fontFamily") })] },
      { name: "Couleurs du message", priority: 2, items: [
        C.color({ glyph: "A", label: "Couleur du texte du message", value: theme("textColor"), set: setTheme("textColor") }),
        C.color({ icon: "palette", label: "Couleur principale (boutons, liens)", value: theme("accent"), set: setTheme("accent") }),
        C.color({ icon: "borderBox", label: "Fond de la page", value: theme("background"), set: setTheme("background") }),
        C.color({ icon: "layers", label: "Fond du contenu", value: theme("contentBackground"), set: setTheme("contentBackground") })] },
      { name: "Largeur du message", priority: 3, items: [C.number({ short: "Largeur", label: "Largeur du message (480 à 720 px)", min: 480, max: 720, unit: "px", value: theme("maxWidth"), set: function (v) { if (v !== undefined) api.setTheme("maxWidth", v); } })] },
      { name: "Aide", priority: 3, items: [api.el("p", { "class": "mk-tb-note" }, "Cliquez sur un bloc de l'e-mail pour le modifier.")] },
    ];
  });

  // ---------- Texte : édition directe dans l'e-mail ----------
  register("text", function (ctx) {
    var C = ctx.C, api = ctx.api, t = api.text;
    var off = function () { return !t.active(); };
    var cmd = function (name, value, css) { return function () { t.exec(name, value, css); }; };
    var state = function (name) { return function () { return t.active() && t.state(name); }; };
    var start = C.button({ icon: "edit", text: "Écrire", label: "Écrire dans le texte (curseur dans l'e-mail)", run: function () { api.startInline(); } });
    var b = ctx.block;
    return [
      { name: "Édition", priority: 1, items: [start], when: function () { return !t.active(); } },
      { name: "Style de paragraphe", priority: 1, items: [C.select({ label: "Style du paragraphe", cls: "is-style", options: [["p", "Paragraphe"], ["h2", "Titre 1"], ["h3", "Titre 2"], ["h4", "Titre 3"], ["blockquote", "Citation"]],
        value: function () { return t.active() ? t.blockTag() : "p"; }, set: function (v) { t.setBlock(v); }, disabled: off })] },
      { name: "Police et taille", priority: 2, items: [
        fontSelect(ctx, "font", "Police du bloc (vide : celle du message)", "Police par défaut"),
        C.select({ label: "Taille : texte sélectionné, sinon tout le bloc", cls: "is-size", options: [12, 14, 16, 18, 20, 24, 28, 32].map(function (n) { return [String(n), String(n)]; }),
          value: function () { return t.active() ? t.sizeAtCaret() : (b() && b().fontSize) || 16; }, format: function (v) { return v; },
          set: function (v) {
            var n = parseInt(v, 10);
            if (t.active() && t.hasSelection()) { t.setSize(n); return; }
            if (n > 28) { api.announce("Sélectionnez du texte pour lui donner une taille de " + n + " px (taille du bloc : 28 px au plus)."); api.toast("Sélectionnez du texte pour cette taille (taille du bloc : 12 à 28 px).", "info"); return; }
            var bl = b(); bl.fontSize = n === 16 ? undefined : n; api.blockChanged();
          } })] },
      { name: "Mise en forme", priority: 1, items: [
        C.button({ glyph: "B", glyphClass: "is-bold", label: "Gras (Ctrl+B)", keep: true, run: cmd("bold"), active: state("bold"), disabled: off }),
        C.button({ glyph: "I", glyphClass: "is-italic", label: "Italique (Ctrl+I)", keep: true, run: cmd("italic"), active: state("italic"), disabled: off }),
        C.button({ glyph: "U", glyphClass: "is-under", label: "Souligné (Ctrl+U)", keep: true, run: cmd("underline"), active: state("underline"), disabled: off }),
        C.button({ glyph: "S", glyphClass: "is-strike", label: "Barré", keep: true, run: cmd("strikeThrough"), active: state("strikeThrough"), disabled: off })] },
      { name: "Couleurs", priority: 2, items: [
        C.color({ glyph: "A", label: "Couleur du texte sélectionné", keep: true, value: function () { return t.active() ? t.colorAtCaret() : ""; }, set: function (v) { t.exec("foreColor", v, true); }, disabled: off }),
        C.color({ icon: "highlighter", label: "Surligner le texte sélectionné", keep: true, value: function () { return t.active() ? t.highlightAtCaret() : ""; }, set: function (v) { t.exec("hiliteColor", v, true); }, disabled: off })] },
      { name: "Lien", priority: 1, items: [C.popover({ icon: "link", label: "Lien (Ctrl+K)", keep: true, active: function () { return t.active() && !!t.link(); }, disabled: off, build: function (p, close) {
        var a = t.link();
        var url = C.textInput(a ? a.getAttribute("href") : "", { placeholder: "https://… ou mailto:…", maxlength: "2000" });
        var newTab = a && a.getAttribute("target") === "_blank";
        var tab = C.check("Ouvrir dans un nouvel onglet", newTab, function (on) { newTab = on; });
        var err = C.errorLine();
        p.appendChild(C.field("Adresse du lien", url)); p.appendChild(tab); p.appendChild(err);
        var remove = null;
        if (a) { remove = api.el("button", { type: "button", "class": "btn btn-outline btn-sm" }, "Retirer le lien"); remove.addEventListener("click", function () { t.removeLink(); close(false); api.announce("Lien retiré."); }); }
        var apply = function () { var r = t.applyLink(url.value.trim(), newTab); if (r !== true) { err.textContent = r; url.focus(); return; } close(false); api.announce("Lien appliqué."); };
        url.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); apply(); } });
        p.appendChild(C.actions(a ? "Modifier" : "Appliquer", apply, remove));
      } })] },
      { name: "Alignement", priority: 2, items: [C.popover({ icon: "alignLeft", label: "Alignement du paragraphe", keep: true, disabled: off, build: function (p, close) {
        var row = api.el("div", { "class": "mk-tb-row" });
        [["justifyLeft", "alignLeft", "À gauche"], ["justifyCenter", "alignCenter", "Centré"], ["justifyRight", "alignRight", "À droite"], ["justifyFull", "alignJustify", "Justifié"]].forEach(function (a) {
          var on = t.state(a[0]);
          var bt = api.el("button", { type: "button", "class": "mk-tb-btn", "aria-pressed": on ? "true" : "false", "aria-label": a[2], "data-tip": a[2] });
          bt.appendChild(api.iconSpan(a[1], "mk-tb-ico"));
          C.keepSelection(bt);
          bt.addEventListener("click", function () { close(false); t.exec(a[0], null, true); api.announce("Paragraphe aligné : " + a[2].toLowerCase() + "."); });
          row.appendChild(bt);
        });
        p.appendChild(row);
      } })] },
      { name: "Listes", priority: 2, items: [
        C.button({ icon: "list", label: "Liste à puces", keep: true, run: cmd("insertUnorderedList"), active: state("insertUnorderedList"), disabled: off }),
        C.button({ icon: "listOrdered", label: "Liste numérotée", keep: true, run: cmd("insertOrderedList"), active: state("insertOrderedList"), disabled: off })] },
      { name: "Retrait", priority: 3, items: [
        C.button({ icon: "indentLess", label: "Diminuer le retrait", keep: true, run: function () { t.indent(-1); }, disabled: off }),
        C.button({ icon: "indentMore", label: "Augmenter le retrait", keep: true, run: function () { t.indent(1); }, disabled: off })] },
      { name: "Variables", priority: 2, items: [C.select({ label: "Insérer une variable à l'emplacement du curseur", cls: "is-vars", options: [["", "{ } Variable"]].concat(api.variables()), value: function () { return ""; }, set: function (v) { if (v) t.insertVariable(v); }, disabled: off })] },
      { name: "Effacer", priority: 3, items: [C.button({ icon: "clearFormat", label: "Effacer la mise en forme du texte sélectionné", keep: true, run: function () { t.clear(); }, disabled: off })] },
    ];
  });

  // ---------- Titre ----------
  register("heading", function (ctx) {
    var C = ctx.C;
    return [
      { name: "Niveau", priority: 1, items: [C.select({ label: "Niveau du titre", options: [["1", "Grand titre"], ["2", "Titre moyen"], ["3", "Petit titre"]], value: getter(ctx, "level", 2), set: function (v) { setter(ctx, "level")(parseInt(v, 10)); } })] },
      { name: "Police et taille", priority: 2, items: [fontSelect(ctx, "font", "Police du titre", "Police du message"), C.number({ short: "Taille", label: "Taille du titre (16 à 44 px, vide = automatique)", min: 16, max: 44, unit: "px", placeholder: "auto", value: getter(ctx, "fontSize"), set: setter(ctx, "fontSize") })] },
      { name: "Mise en forme", priority: 1, items: [
        C.button({ glyph: "B", glyphClass: "is-bold", label: "Gras", active: function () { var b = ctx.block(); return !b.weight || b.weight === "bold"; }, run: function () { var b = ctx.block(); b.weight = !b.weight || b.weight === "bold" ? "normal" : undefined; ctx.api.blockChanged(); } }),
        C.button({ glyph: "I", glyphClass: "is-italic", label: "Italique", active: getter(ctx, "italic", false), run: function () { var b = ctx.block(); b.italic = b.italic ? undefined : true; ctx.api.blockChanged(); } }),
        C.color({ glyph: "A", label: "Couleur du titre", value: getter(ctx, "color", ""), set: setter(ctx, "color") })] },
      { name: "Alignement", priority: 2, items: alignButtons(ctx, getter(ctx, "align", "left"), setter(ctx, "align")) },
      { name: "Lien", priority: 2, items: [linkPop(ctx, "Lien du titre", "href", "newTab", true)] },
      { name: "Bloc", priority: 3, items: [spacingPop(ctx), visibilityPop(ctx), settingsButton(ctx)] },
    ];
  });
  // Lien d'un bloc (titre, image, bouton) : adresse validée comme par le serveur
  function linkPop(ctx, label, key, tabKey, optional) {
    return ctx.C.popover({ icon: "link", label: label, active: function () { var b = ctx.block(); return !!(b && b[key]); }, build: function (p, close) {
      var C = ctx.C, b = ctx.block();
      var url = C.textInput(b[key], { placeholder: "https://… ou mailto:…", maxlength: "2000" });
      var err = C.errorLine();
      p.appendChild(C.field("Adresse", url));
      if (tabKey) p.appendChild(C.check("Ouvrir dans un nouvel onglet", b[tabKey], function (on) { ctx.block()[tabKey] = on || undefined; ctx.api.blockChanged(); }));
      p.appendChild(err);
      var apply = function () {
        var v = url.value.trim();
        if (!v && optional) { ctx.block()[key] = undefined; ctx.api.blockChanged(); close(false); return; }
        if (!/^(https:\/\/[^\s<>"'`\\]+|mailto:[^\s<>"'`\\]+)$/i.test(v)) { err.textContent = "Adresse invalide : commencez par https:// (ou mailto:), sans espace."; url.focus(); return; }
        ctx.block()[key] = v; ctx.api.blockChanged(); close(false); ctx.api.announce("Lien enregistré.");
      };
      url.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); apply(); } });
      var remove = null;
      if (optional && b[key]) { remove = ctx.api.el("button", { type: "button", "class": "btn btn-outline btn-sm" }, "Retirer le lien"); remove.addEventListener("click", function () { ctx.block()[key] = undefined; ctx.api.blockChanged(); close(false); }); }
      p.appendChild(C.actions("Appliquer", apply, remove));
    } });
  }

  // ---------- Image ----------
  register("image", function (ctx) {
    var C = ctx.C, api = ctx.api;
    return [
      { name: "Image", priority: 1, items: [C.popover({ icon: "image", text: "Remplacer", label: "Remplacer l'image", build: function (p, close) {
        var file = api.el("input", { type: "file", accept: "image/jpeg,image/png,image/gif,image/webp", "class": "sr-only" });
        var imp = api.el("label", { "class": "btn btn-outline btn-sm" }, "Importer depuis l'ordinateur");
        imp.appendChild(file);
        file.addEventListener("change", function () { if (file.files[0]) { api.uploadInto(file.files[0]); close(false); } });
        var lib = api.el("button", { type: "button", "class": "btn btn-outline btn-sm" }, "Choisir dans la médiathèque");
        lib.addEventListener("click", function () { close(false); api.openMediaFor(); });
        var row = api.el("div", { "class": "mk-tb-pop-actions is-start" }); row.appendChild(imp); row.appendChild(lib);
        p.appendChild(row);
      } }),
        C.popover({ icon: "type", text: "Alt", label: "Texte alternatif", active: function () { var b = ctx.block(); return !!(b.alt || b.decorative); }, build: function (p, close) {
          var b = ctx.block(), input = C.textInput(b.alt, { maxlength: "200" });
          input.addEventListener("input", function () { ctx.block().alt = input.value; api.blockChanged(); });
          p.appendChild(C.field("Décrit l'image (lecteurs d'écran, images bloquées)", input));
          p.appendChild(C.check("Image décorative (pas de texte alternatif)", b.decorative, function (on) { ctx.block().decorative = on; api.blockChanged(); }));
          input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); close(true); } });
        } })] },
      { name: "Dimensions", priority: 1, items: [C.number({ short: "Largeur", label: "Largeur de l'image (40 à 720 px ; hauteur proportionnelle)", min: 40, max: 720, unit: "px", placeholder: "552", value: getter(ctx, "width"), set: setter(ctx, "width") }),
        C.number({ short: "Arrondi", label: "Arrondi des coins (0 à 40 px)", min: 0, max: 40, unit: "px", placeholder: "0", value: getter(ctx, "radius"), set: setter(ctx, "radius") })] },
      { name: "Alignement", priority: 2, items: alignButtons(ctx, getter(ctx, "align", "left"), setter(ctx, "align")) },
      { name: "Lien", priority: 2, items: [linkPop(ctx, "Lien au clic sur l'image", "href", "newTab", true)] },
      { name: "Bloc", priority: 3, items: [borderPop(ctx), spacingPop(ctx), visibilityPop(ctx), settingsButton(ctx)] },
    ];
  });

  // ---------- Bouton ----------
  var SHAPES = [["0", "Carré"], ["4", "Légèrement arrondi"], ["12", "Arrondi"], ["40", "Ovale"]];
  register("button", function (ctx) {
    var C = ctx.C, api = ctx.api;
    return [
      { name: "Texte du bouton", priority: 1, items: [C.popover({ icon: "type", text: "Texte", label: "Texte du bouton", build: function (p, close) {
        var input = C.textInput(ctx.block().label, { maxlength: "80" });
        input.addEventListener("input", function () { ctx.block().label = input.value; api.blockChanged(); });
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); close(true); } });
        p.appendChild(C.field("Texte affiché", input));
      } }), linkPop(ctx, "Lien du bouton", "url", "newTab", false)] },
      { name: "Couleurs", priority: 1, items: [
        C.color({ icon: "palette", label: "Couleur du bouton", value: function () { return ctx.block().color || api.theme().accent; }, set: setter(ctx, "color") }),
        C.color({ glyph: "A", label: "Couleur du texte du bouton", value: function () { return ctx.block().textColor || ""; }, set: setter(ctx, "textColor") })] },
      { name: "Forme", priority: 2, items: [C.select({ label: "Forme du bouton", options: SHAPES.concat([["custom", "Personnalisé…"]]),
        value: function () { var r = ctx.block().radius; r = r == null ? api.theme().radius : r; return SHAPES.some(function (s) { return s[0] === String(r); }) ? String(r) : "custom"; },
        set: function (v) { if (v === "custom") { api.openProps("styles"); return; } ctx.block().radius = parseInt(v, 10); api.blockChanged(); } }),
        C.select({ label: "Taille du bouton (marges intérieures)", options: [["s", "Petit"], ["m", "Moyen"], ["l", "Grand"]], value: getter(ctx, "size", "m"), set: function (v) { ctx.block().size = v === "m" ? undefined : v; api.blockChanged(); } })] },
      { name: "Bordure", priority: 3, items: [C.popover({ icon: "borderBox", label: "Bordure du bouton", active: function () { var b = ctx.block(); return !!(b.borderStyle && b.borderStyle !== "none"); }, build: function (p) {
        var b = ctx.block(), style = document.createElement("select");
        [["none", "Aucune"], ["solid", "Pleine"], ["dashed", "Tirets"], ["dotted", "Pointillés"]].forEach(function (o) { style.appendChild(api.el("option", { value: o[0] }, o[1])); });
        style.value = b.borderStyle || "none";
        var width = C.numInput(b.borderWidth, 1, 8, "2"), color = document.createElement("input"); color.type = "color"; color.value = b.borderColor || "#10222f";
        style.addEventListener("change", function () { ctx.block().borderStyle = style.value === "none" ? undefined : style.value; api.blockChanged(); });
        width.addEventListener("input", function () { var n = C.intOrU(width.value); if (n === undefined || (n >= 1 && n <= 8)) { ctx.block().borderWidth = n; api.blockChanged(); } });
        color.addEventListener("input", function () { ctx.block().borderColor = color.value; api.blockChanged(); });
        var g = api.el("div", { "class": "mk-tb-grid2" });
        g.appendChild(C.field("Style", style)); g.appendChild(C.field("Épaisseur (px)", width)); g.appendChild(C.field("Couleur", color));
        p.appendChild(g);
      } })] },
      { name: "Largeur et alignement", priority: 2, items: [C.button({ icon: "maximize", label: "Toute la largeur", active: getter(ctx, "fullWidth", false), run: function () { var b = ctx.block(); b.fullWidth = b.fullWidth ? undefined : true; api.blockChanged(); } })].concat(alignButtons(ctx, getter(ctx, "align", "center"), setter(ctx, "align"))) },
      { name: "Bloc", priority: 3, items: [spacingPop(ctx), visibilityPop(ctx), settingsButton(ctx)] },
    ];
  });

  // ---------- Ligne de séparation ----------
  register("divider", function (ctx) {
    var C = ctx.C;
    return [
      { name: "Ligne", priority: 1, items: [C.select({ label: "Style de la ligne", options: [["solid", "Pleine"], ["dashed", "Tirets"], ["dotted", "Pointillés"]], value: getter(ctx, "style", "solid"), set: function (v) { setter(ctx, "style")(v === "solid" ? undefined : v); } }),
        C.color({ icon: "palette", label: "Couleur de la ligne", value: function () { return ctx.block().color || ctx.api.theme().secondary; }, set: setter(ctx, "color") })] },
      { name: "Dimensions", priority: 1, items: [C.number({ short: "Largeur", label: "Largeur de la ligne (10 à 100 %)", min: 10, max: 100, unit: "%", placeholder: "100", value: getter(ctx, "width"), set: setter(ctx, "width") }),
        C.number({ short: "Épaisseur", label: "Épaisseur (1 à 8 px)", min: 1, max: 8, unit: "px", placeholder: "1", value: getter(ctx, "thickness"), set: setter(ctx, "thickness") })] },
      { name: "Alignement", priority: 2, items: alignButtons(ctx, getter(ctx, "align", "center"), setter(ctx, "align")) },
      { name: "Bloc", priority: 3, items: [spacingPop(ctx), visibilityPop(ctx), settingsButton(ctx)] },
    ];
  });

  // ---------- Espace ----------
  register("spacer", function (ctx) {
    var C = ctx.C;
    return [
      { name: "Hauteur", priority: 1, items: [C.number({ short: "Hauteur", label: "Hauteur de l'espace (4 à 120 px)", min: 4, max: 120, unit: "px", placeholder: "24", value: getter(ctx, "height"), set: setter(ctx, "height") })] },
      { name: "Fond", priority: 1, items: [C.color({ icon: "palette", label: "Fond de l'espace", value: function () { return (ctx.block().box || {}).background || ""; }, set: function (v) { boxOf(ctx).background = v; ctx.api.blockChanged(); } })] },
      { name: "Bloc", priority: 2, items: [visibilityPop(ctx), settingsButton(ctx)] },
    ];
  });

  // ---------- Vidéo (miniature + lien : un e-mail ne lit pas de vidéo) ----------
  register("video", function (ctx) {
    var C = ctx.C;
    function urlPop(label, key, icon, text) {
      return C.popover({ icon: icon, text: text, label: label, build: function (p, close) {
        var input = C.textInput(ctx.block()[key], { placeholder: "https://…", maxlength: "2000" }), err = C.errorLine();
        p.appendChild(C.field(label, input)); p.appendChild(err);
        var apply = function () { var v = input.value.trim(); if (v && !/^https:\/\/[^\s<>"'`\\]+$/i.test(v)) { err.textContent = "Adresse invalide : commencez par https://."; return; } ctx.block()[key] = v || (key === "url" ? "" : undefined); ctx.api.blockChanged(); close(false); };
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); apply(); } });
        p.appendChild(C.actions("Appliquer", apply));
      } });
    }
    return [
      { name: "Vidéo", priority: 1, items: [urlPop("Adresse de la vidéo", "url", "link", "Vidéo"), C.popover({ icon: "type", text: "Titre", label: "Titre de la vidéo (obligatoire)", active: function () { return !!ctx.block().title; }, build: function (p, close) {
        var input = C.textInput(ctx.block().title, { maxlength: "200" });
        input.addEventListener("input", function () { ctx.block().title = input.value; ctx.api.blockChanged(); });
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); close(true); } });
        p.appendChild(C.field("Titre (lien « Regarder la vidéo » et texte alternatif de la miniature)", input));
      } }), urlPop("Miniature (image https://…)", "thumbnail", "image", "Miniature")] },
      { name: "Dimensions", priority: 1, items: [C.number({ short: "Largeur", label: "Largeur de la miniature (40 à 600 px)", min: 40, max: 600, unit: "px", placeholder: "552", value: getter(ctx, "width"), set: setter(ctx, "width") })] },
      { name: "Alignement", priority: 2, items: alignButtons(ctx, getter(ctx, "align", "center"), setter(ctx, "align")) },
      { name: "Bloc", priority: 3, items: [spacingPop(ctx), visibilityPop(ctx), settingsButton(ctx)] },
    ];
  });

  // ---------- Réseaux sociaux ----------
  register("social", function (ctx) {
    var C = ctx.C;
    return [
      { name: "Réseaux", priority: 1, items: [C.button({ icon: "link", text: "Réseaux", label: "Choisir les réseaux et leurs adresses (panneau de droite)", run: function () { ctx.api.openProps("content"); } })] },
      { name: "Présentation", priority: 1, items: [C.select({ label: "Présentation des liens", options: [["text", "Liens texte"], ["buttons", "Pastilles"]], value: getter(ctx, "display", "text"), set: function (v) { setter(ctx, "display")(v === "text" ? undefined : v); } }),
        C.select({ label: "Couleur des pastilles", options: [["brand", "Couleurs des réseaux"], ["accent", "Couleur principale"]], value: function () { return ctx.block().colors === "accent" ? "accent" : "brand"; }, set: function (v) { setter(ctx, "colors")(v === "accent" ? "accent" : undefined); }, disabled: function () { return ctx.block().display !== "buttons"; } })] },
      { name: "Alignement", priority: 2, items: alignButtons(ctx, getter(ctx, "align", "center"), setter(ctx, "align")) },
      { name: "Bloc", priority: 3, items: [spacingPop(ctx), visibilityPop(ctx), settingsButton(ctx)] },
    ];
  });

  // ---------- Colonnes (section à deux colonnes) ----------
  register("columns", function (ctx) {
    var C = ctx.C;
    return [
      { name: "Colonnes", priority: 1, items: [C.select({ label: "Répartition des colonnes", options: [["50-50", "50 / 50"], ["60-40", "60 / 40"], ["40-60", "40 / 60"], ["70-30", "70 / 30"], ["30-70", "30 / 70"]], value: getter(ctx, "ratio", "50-50"), set: function (v) { setter(ctx, "ratio")(v === "50-50" ? undefined : v); } }),
        C.button({ icon: "smartphone", label: "Empiler les colonnes sur mobile", active: function () { return ctx.block().stack !== false; }, run: function () { var b = ctx.block(); b.stack = b.stack === false ? undefined : false; if (b.stack === false) b.reverse = undefined; ctx.api.blockChanged(); } }),
        C.button({ icon: "edit", text: "Contenu", label: "Modifier le texte des colonnes (panneau de droite)", run: function () { ctx.api.openProps("content"); } })] },
      { name: "Fond", priority: 2, items: [C.color({ icon: "palette", label: "Fond de la section", value: function () { return (ctx.block().box || {}).background || ""; }, set: function (v) { boxOf(ctx).background = v; ctx.api.blockChanged(); } })] },
      { name: "Bloc", priority: 2, items: [borderPop(ctx, "Bordure de la section"), spacingPop(ctx), visibilityPop(ctx), settingsButton(ctx)] },
    ];
  });

  // ---------- Autres blocs (citation, liste, lien, coupon, formation) : réglages communs ----------
  register("__generic", function (ctx) {
    var C = ctx.C;
    return [
      { name: "Contenu", priority: 1, items: [C.button({ icon: "edit", text: "Contenu", label: "Modifier le contenu (panneau de droite)", run: function () { ctx.api.openProps("content"); } })] },
      { name: "Fond", priority: 2, items: [C.color({ icon: "palette", label: "Fond du bloc", value: function () { return (ctx.block().box || {}).background || ""; }, set: function (v) { boxOf(ctx).background = v; ctx.api.blockChanged(); } })] },
      { name: "Bloc", priority: 2, items: [borderPop(ctx), spacingPop(ctx), visibilityPop(ctx), settingsButton(ctx)] },
    ];
  });

  window.MkToolbar = { register: register, create: create, registry: REGISTRY };
})();
