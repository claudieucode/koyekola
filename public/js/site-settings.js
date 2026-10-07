/* Réglages du site — panneau de l'éditeur de pages KOLAKISA.
   Lit et enregistre les vrais réglages du site (GET/PUT /marketing/site-web/sites/:id/reglages.json) : couleurs et
   polices globales (jetons du design system, mk_sites.tokens). Chaque modification est enregistrée automatiquement
   (délai court, révision contrôlée) puis le canevas est redessiné avec les mêmes réglages que la page publiée.
   Aucune donnée n'est simulée : un écran affiche uniquement ce que le serveur sait enregistrer. */
(function () {
  "use strict";
  var bridge = null;          // fourni par l'éditeur : { siteId, canWrite, toast, rerender }
  var root = null, bodyEl, titleEl, statusEl, undoBtn, redoBtn, backBtn;
  var state = null;           // { revision, tokens, usage, catalog, canWrite }
  var view = "home";
  var past = [], future = []; // historique du panneau (instantanés des jetons)
  var saveTimer = null, saving = false, dirty = false, lastFocus = null;

  var HEX = /^#[0-9a-f]{6}$/i;
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v === null || v === undefined) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }

  // ---------- Chargement et enregistrement ----------
  function url() { return "/marketing/site-web/sites/" + bridge.siteId + "/reglages.json"; }
  function request(method, body) {
    return fetch(url(), { method: method, credentials: "same-origin", headers: body ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) {
        return r.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
          if (!r.ok) { var err = new Error(data && data.error ? data.error.message : "Erreur du serveur (" + r.status + ")."); err.status = r.status; throw err; }
          return data;
        });
      });
  }
  function shareCustomColors() { bridge.customColors = state.tokens.customColors.map(function (c) { return { key: c.key, label: c.label }; }); }
  function setStatus(text, kind) { statusEl.textContent = text; statusEl.className = "ss-status" + (kind ? " is-" + kind : ""); }

  function load() {
    setStatus("Chargement…");
    return request("GET").then(function (data) {
      state = data; past = []; future = []; dirty = false; shareCustomColors();
      setStatus(state.canWrite ? "À jour" : "Lecture seule (droits insuffisants)");
      render();
    }, function (err) { setStatus(err.message, "error"); bodyEl.textContent = ""; bodyEl.appendChild(h("p", { class: "ss-note is-error", text: "Impossible de charger les réglages : " + err.message })); });
  }

  // Modification : instantané pour annuler, puis enregistrement automatique avec délai (pas à chaque frappe)
  function change(mutator, opts) {
    if (!state.canWrite) return;
    var snapshot = clone(state.tokens);
    mutator(state.tokens);
    if (!opts || !opts.noHistory) { past.push(snapshot); if (past.length > 80) past.shift(); future = []; }
    dirty = true;
    setStatus("Modifications en attente…", "pending");
    updateHistoryButtons();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 600);
  }
  function save() {
    clearTimeout(saveTimer);
    if (saving) { saveTimer = setTimeout(save, 300); return Promise.resolve(); }
    if (!dirty) return Promise.resolve();
    saving = true;
    setStatus("Enregistrement…", "pending");
    var sent = clone(state.tokens);
    return request("PUT", { tokens: sent, revision: state.revision }).then(function (data) {
      saving = false;
      state.revision = data.revision; state.usage = data.usage; shareCustomColors();
      dirty = JSON.stringify(state.tokens) !== JSON.stringify(data.tokens);
      if (!dirty) state.tokens = data.tokens;
      setStatus("Enregistré", "ok");
      bridge.rerender();
      if (dirty) { saveTimer = setTimeout(save, 200); }
      refreshUsage();
    }, function (err) {
      saving = false;
      if (err.status === 409) { setStatus("Conflit : réglages modifiés ailleurs", "error"); showConflict(err.message); return; }
      setStatus("Non enregistré : " + err.message, "error");
      bridge.toast(err.message, true);
    });
  }
  function showConflict(message) {
    var box = h("div", { class: "ss-note is-error", role: "alert" }, [h("p", { text: message }), h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Recharger les réglages du site", onclick: function () { dirty = false; load(); } })]);
    bodyEl.insertBefore(box, bodyEl.firstChild);
  }
  function undo() { if (!past.length) return; future.push(clone(state.tokens)); state.tokens = past.pop(); afterHistory(); }
  function redo() { if (!future.length) return; past.push(clone(state.tokens)); state.tokens = future.pop(); afterHistory(); }
  function afterHistory() { dirty = true; setStatus("Modifications en attente…", "pending"); updateHistoryButtons(); render(); clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); }
  function updateHistoryButtons() { undoBtn.disabled = !past.length || !state.canWrite; redoBtn.disabled = !future.length || !state.canWrite; }

  // ---------- Navigation interne ----------
  var VIEWS = {
    home: { title: "Réglages du site" },
    colors: { title: "Couleurs globales", parent: "home" },
    fonts: { title: "Polices globales", parent: "home" },
  };
  function go(name) { view = name; render(); var first = bodyEl.querySelector("button, input, select"); if (first) first.focus({ preventScroll: true }); }
  function render() {
    if (!state) return;
    var v = VIEWS[view];
    titleEl.textContent = v.title;
    backBtn.hidden = !v.parent;
    bodyEl.textContent = "";
    bodyEl.scrollTop = 0;
    ({ home: renderHome, colors: renderColors, fonts: renderFonts })[view]();
    updateHistoryButtons();
  }

  function entry(label, hint, target, soon) {
    return h("li", {}, [h("button", { type: "button", class: "ss-entry", disabled: soon, "aria-disabled": soon ? "true" : false, onclick: function () { if (!soon) go(target); } }, [
      h("span", { class: "ss-entry-label", text: label }),
      h("span", { class: "ss-entry-hint", text: soon ? "Pas encore disponible" : hint }),
    ])]);
  }
  function group(title, items) { return h("section", { class: "ss-group" }, [h("h3", { text: title }), h("ul", { class: "ss-list" }, items)]); }
  function renderHome() {
    bodyEl.appendChild(h("p", { class: "ss-site", text: "Site : " + state.site.name }));
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Ces réglages s'appliquent à toutes les pages du site, y compris celles déjà en ligne. Un style choisi directement sur un élément reste prioritaire." }));
    bodyEl.appendChild(group("Système de conception", [
      entry("Couleurs globales", "Palette du site et couleurs personnalisées", "colors"),
      entry("Polices globales", "Titres, texte, boutons et liens", "fonts"),
    ]));
    bodyEl.appendChild(group("Styles du thème", [
      entry("Typographie", "", null, true), entry("Boutons", "", null, true), entry("Images", "", null, true), entry("Champs de formulaire", "", null, true),
    ]));
    bodyEl.appendChild(group("Réglages", [
      entry("Identité du site", "", null, true), entry("Arrière-plan", "", null, true), entry("Mise en page", "", null, true), entry("Visionneuse", "", null, true),
      entry("Transitions de page", "", null, true), entry("CSS personnalisé", "", null, true), entry("Réglages supplémentaires", "", null, true),
    ]));
    bodyEl.appendChild(h("p", { class: "ss-help" }, ["Besoin d'aide ? ", h("a", { href: "/marketing/site-web/sites/" + state.site.id, target: "_blank", rel: "noopener" }, ["Ouvrir la fiche du site"])]));
  }

  // ---------- Couleurs globales ----------
  function usageText(key) {
    var u = state.usage && state.usage[key];
    if (!u || !u.pages) return "Pas encore utilisée dans les pages";
    return "Utilisée dans " + u.pages + " page" + (u.pages > 1 ? "s" : "") + " (" + u.refs + " référence" + (u.refs > 1 ? "s" : "") + ")";
  }
  function colorRow(opts) {
    var colorInput = h("input", { type: "color", value: opts.hex, "aria-label": "Choisir la couleur « " + opts.label + " »", disabled: !state.canWrite });
    var hexInput = h("input", { type: "text", value: opts.hex, maxlength: "7", spellcheck: "false", autocomplete: "off", "aria-label": "Code hexadécimal de « " + opts.label + " »", disabled: !state.canWrite });
    var usage = h("span", { class: "ss-usage", "data-usage": opts.key, text: usageText(opts.key) });
    function apply(value) {
      if (!HEX.test(value)) { hexInput.classList.add("is-invalid"); hexInput.setAttribute("aria-invalid", "true"); return; }
      hexInput.classList.remove("is-invalid"); hexInput.removeAttribute("aria-invalid");
      value = value.toLowerCase();
      colorInput.value = value; hexInput.value = value;
      if (value !== opts.hex) { change(function (t) { opts.set(t, value); }); opts.hex = value; }
    }
    colorInput.addEventListener("input", function () { apply(colorInput.value); });
    hexInput.addEventListener("input", function () { var v = hexInput.value.trim(); if (v && v[0] !== "#") v = "#" + v; if (HEX.test(v)) apply(v); else { hexInput.classList.add("is-invalid"); hexInput.setAttribute("aria-invalid", "true"); } });
    hexInput.addEventListener("blur", function () { hexInput.value = opts.hex; hexInput.classList.remove("is-invalid"); hexInput.removeAttribute("aria-invalid"); });
    return { colorInput: colorInput, hexInput: hexInput, usage: usage };
  }
  function renderColors() {
    var C = state.catalog, T = state.tokens;
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Une couleur choisie ici est une variable du site : chaque élément qui l'utilise est mis à jour partout, pages en ligne comprises." }));
    var sys = h("ul", { class: "ss-colors" });
    C.colorKeys.forEach(function (key) {
      var r = colorRow({ key: key, label: C.colorLabels[key], hex: T.colors[key], set: function (t, v) { t.colors[key] = v; } });
      sys.appendChild(h("li", { class: "ss-color" }, [r.colorInput, h("div", { class: "ss-color-text" }, [h("span", { class: "ss-color-name", text: C.colorLabels[key] }), r.usage]), r.hexInput]));
    });
    bodyEl.appendChild(h("section", { class: "ss-group" }, [h("h3", { text: "Couleurs du système" }), sys]));

    var custom = h("ul", { class: "ss-colors" });
    T.customColors.forEach(function (c, i) {
      var r = colorRow({ key: c.key, label: c.label, hex: c.hex, set: function (t, v) { t.customColors[i].hex = v; } });
      var name = h("input", { type: "text", value: c.label, maxlength: "40", "aria-label": "Nom de la couleur", class: "ss-name", disabled: !state.canWrite });
      name.addEventListener("change", function () {
        var v = name.value.trim();
        if (!v) { name.value = c.label; return; }
        if (v !== c.label) { change(function (t) { t.customColors[i].label = v; }); c.label = v; }
      });
      var del = h("button", { type: "button", class: "ss-icon-btn", "aria-label": "Supprimer la couleur « " + c.label + " »", disabled: !state.canWrite, onclick: function () {
        var u = state.usage && state.usage[c.key];
        if (u && u.pages > 0) { bridge.toast("La couleur « " + c.label + " » est utilisée dans " + u.pages + " page(s) : remplacez-la d'abord dans ces pages.", true); return; }
        change(function (t) { t.customColors.splice(i, 1); }); render();
      } }, ["Supprimer"]);
      custom.appendChild(h("li", { class: "ss-color" }, [r.colorInput, h("div", { class: "ss-color-text" }, [name, r.usage]), r.hexInput, del]));
    });
    if (!T.customColors.length) custom.appendChild(h("li", { class: "ss-empty", text: "Aucune couleur personnalisée pour l'instant." }));
    var add = h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Ajouter une couleur", disabled: !state.canWrite || T.customColors.length >= C.maxCustomColors, onclick: function () {
      var key = "c-" + Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, "x");
      var n = T.customColors.length + 1, label = "Couleur " + n;
      while (T.customColors.some(function (c) { return c.label.toLowerCase() === label.toLowerCase(); })) label = "Couleur " + (++n);
      change(function (t) { t.customColors.push({ key: key, label: label, hex: "#6b1e2e" }); });
      render();
      var inputs = bodyEl.querySelectorAll(".ss-name"); if (inputs.length) { var last = inputs[inputs.length - 1]; last.focus(); last.select(); }
    } });
    bodyEl.appendChild(h("section", { class: "ss-group" }, [h("h3", { text: "Couleurs personnalisées" }), custom, add,
      h("p", { class: "ss-hint", text: "Une couleur personnalisée apparaît dans le sélecteur de couleur de chaque élément, sous « Site »." })]));
  }
  function refreshUsage() {
    bodyEl.querySelectorAll("[data-usage]").forEach(function (el) { el.textContent = usageText(el.getAttribute("data-usage")); });
  }

  // ---------- Polices globales ----------
  function renderFonts() {
    var C = state.catalog, T = state.tokens;
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Les polices proposées sont servies par KOLAKISA ou présentes sur tous les appareils : aucun service tiers n'est appelé." }));
    var sec = h("section", { class: "ss-group" }, [h("h3", { text: "Familles de police" })]);
    C.fontRoles.forEach(function (role) {
      var id = "ss-font-" + role;
      var sample = h("p", { class: "ss-sample", text: role === "heading" ? "Des objets pensés pour durer" : role === "button" ? "Je commence" : role === "link" ? "Découvrir notre histoire" : "Chaque pièce est choisie pour la qualité de sa fabrication." });
      sample.style.fontFamily = C.fonts[T.fonts[role]].stack;
      var select = h("select", { id: id, disabled: !state.canWrite }, Object.keys(C.fonts).map(function (k) { return h("option", { value: k, selected: T.fonts[role] === k, text: C.fonts[k].label }); }));
      select.addEventListener("change", function () {
        var v = select.value;
        change(function (t) { t.fonts[role] = v; });
        sample.style.fontFamily = C.fonts[v].stack;
      });
      sec.appendChild(h("div", { class: "ss-field" }, [h("label", { for: id, text: C.fontLabels[role] }), select, sample]));
    });
    bodyEl.appendChild(sec);
  }

  // ---------- Ouverture / fermeture ----------
  function build() {
    titleEl = h("h2", { id: "ss-title", text: "Réglages du site" });
    statusEl = h("span", { class: "ss-status", role: "status", "aria-live": "polite" });
    backBtn = h("button", { type: "button", class: "ss-icon-btn", "aria-label": "Retour aux réglages du site", hidden: true, onclick: function () { go(VIEWS[view].parent || "home"); } }, ["‹ Retour"]);
    undoBtn = h("button", { type: "button", class: "ss-icon-btn", "aria-label": "Annuler la dernière modification des réglages", onclick: undo, disabled: true }, ["Annuler"]);
    redoBtn = h("button", { type: "button", class: "ss-icon-btn", "aria-label": "Rétablir la modification des réglages", onclick: redo, disabled: true }, ["Rétablir"]);
    bodyEl = h("div", { class: "ss-body" });
    root = h("aside", { class: "ss-panel", role: "dialog", "aria-modal": "false", "aria-labelledby": "ss-title", hidden: true }, [
      h("header", { class: "ss-head" }, [
        h("div", { class: "ss-head-row" }, [backBtn, titleEl, h("button", { type: "button", class: "ss-icon-btn ss-close", "aria-label": "Fermer les réglages du site", onclick: close }, ["Fermer"])]),
        h("div", { class: "ss-head-row ss-tools" }, [undoBtn, redoBtn, statusEl]),
      ]),
      bodyEl,
    ]);
    root.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); close(); }
      var mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && e.key.toLowerCase() === "z" && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) { e.preventDefault(); e.stopPropagation(); undo(); }
    });
    document.body.appendChild(root);
  }
  function open() {
    if (!bridge) return;
    if (!bridge.siteId) { bridge.toast("Cette page n'appartient à aucun site : rattachez-la à un site (Réglages de la page) pour utiliser les réglages du site.", true); return; }
    if (!root) build();
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add("ss-open");
    view = "home";
    load().then(function () { var first = bodyEl.querySelector("button:not([disabled])"); if (first) first.focus({ preventScroll: true }); });
  }
  function close() {
    if (!root || root.hidden) return;
    save().then(function () {
      if (dirty && saving === false && state && state.canWrite && statusEl.className.indexOf("is-error") !== -1) {
        if (!window.confirm("Des modifications n'ont pas pu être enregistrées. Fermer quand même ?")) return;
      }
      root.hidden = true;
      document.body.classList.remove("ss-open");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
  }
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  window.KWSiteSettings = {
    init: function (b) { bridge = b; },
    open: open,
    close: close,
    isOpen: function () { return Boolean(root && !root.hidden); },
  };
  // L'éditeur (page-builder.js, chargé avant) publie son pont : le menu principal peut ouvrir le panneau
  if (window.KWEditor) window.KWSiteSettings.init(window.KWEditor);
})();
