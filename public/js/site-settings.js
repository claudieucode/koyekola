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
  function snap() { return { tokens: clone(state.tokens), settings: clone(state.settings), name: state.site.name }; }
  function restoreSnap(sn) { state.tokens = sn.tokens; state.settings = sn.settings; state.site.name = sn.name; }
  function change(mutator, opts) {
    if (!state.canWrite) return;
    var snapshot = snap();
    mutator(state.tokens, state.settings, state);
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
    var sent = snap();
    return request("PUT", { tokens: sent.tokens, settings: sent.settings, name: sent.name, revision: state.revision }).then(function (data) {
      saving = false;
      state.revision = data.revision; state.usage = data.usage; shareCustomColors();
      dirty = JSON.stringify(snap()) !== JSON.stringify({ tokens: data.tokens, settings: data.settings, name: data.site.name });
      if (!dirty) { state.tokens = data.tokens; state.settings = data.settings; state.site.name = data.site.name; }
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
  function undo() { if (!past.length) return; future.push(snap()); restoreSnap(past.pop()); afterHistory(); }
  function redo() { if (!future.length) return; past.push(snap()); restoreSnap(future.pop()); afterHistory(); }
  function afterHistory() { dirty = true; setStatus("Modifications en attente…", "pending"); updateHistoryButtons(); render(); clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); }
  function updateHistoryButtons() { undoBtn.disabled = !past.length || !state.canWrite; redoBtn.disabled = !future.length || !state.canWrite; }

  // ---------- Navigation interne ----------
  var VIEWS = {
    home: { title: "Réglages du site" },
    colors: { title: "Couleurs globales", parent: "home" },
    fonts: { title: "Polices globales", parent: "home" },
    typography: { title: "Typographie", parent: "home" },
    buttons: { title: "Boutons", parent: "home" },
    images: { title: "Images", parent: "home" },
    forms: { title: "Champs de formulaire", parent: "home" },
    identity: { title: "Identité du site", parent: "home" },
    background: { title: "Arrière-plan", parent: "home" },
    layout: { title: "Mise en page", parent: "home" },
    lightbox: { title: "Visionneuse", parent: "home" },
    transitions: { title: "Transitions de page", parent: "home" },
    css: { title: "CSS personnalisé", parent: "home" },
    extras: { title: "Réglages supplémentaires", parent: "home" },
    seo: { title: "Référencement (SEO)", parent: "home" },
  };
  function go(name) { view = name; render(); var first = bodyEl.querySelector("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])"); if (first) first.focus({ preventScroll: true }); }
  function render() {
    if (!state) return;
    var v = VIEWS[view];
    titleEl.textContent = v.title;
    backBtn.hidden = !v.parent;
    bodyEl.textContent = "";
    bodyEl.scrollTop = 0;
    ({ home: renderHome, colors: renderColors, fonts: renderFonts, typography: renderTypography, buttons: renderButtons, images: renderImages, forms: renderForms,
       identity: renderIdentity, background: renderBackground, layout: renderLayout, lightbox: renderLightbox, transitions: renderTransitions, css: renderCss, extras: renderExtras, seo: renderSeo })[view]();
    updateHistoryButtons();
  }

  function entry(label, hint, target) {
    return h("li", {}, [h("button", { type: "button", class: "ss-entry", onclick: function () { go(target); } }, [
      h("span", { class: "ss-entry-label", text: label }),
      h("span", { class: "ss-entry-hint", text: hint }),
    ])]);
  }
  function group(title, items) { return h("section", { class: "ss-group" }, [h("h3", { text: title }), h("ul", { class: "ss-list" }, items)]); }
  function renderHome() {
    bodyEl.appendChild(h("p", { class: "ss-site", text: "Site : " + state.site.name }));
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Ces réglages s'appliquent à toutes les pages du site, y compris celles déjà en ligne. Ordre de priorité, du plus général au plus précis : réglages du site, styles du thème, style de l'élément posé dans l'inspecteur (il l'emporte), puis CSS personnalisé. Un style choisi sur un élément n'est donc jamais écrasé par un réglage global." }));
    bodyEl.appendChild(group("Système de conception", [
      entry("Couleurs globales", "Palette du site et couleurs personnalisées", "colors"),
      entry("Polices globales", "Titres, texte, boutons et liens", "fonts"),
    ]));
    bodyEl.appendChild(group("Styles du thème", [
      entry("Typographie", "Titres, texte, liens et listes", "typography"), entry("Boutons", "Couleurs, états, dimensions", "buttons"),
      entry("Images", "Rayon, bordure, ombre, ajustement", "images"), entry("Champs de formulaire", "Champs, focus, cases à cocher", "forms"),
    ]));
    bodyEl.appendChild(group("Réglages", [
      entry("Identité du site", "Nom, description, logo, favicon", "identity"), entry("Arrière-plan", "Couleur, dégradé, image", "background"),
      entry("Mise en page", "Largeurs, marges, points de rupture", "layout"), entry("Visionneuse", "Agrandissement des images de galerie", "lightbox"),
      entry("Transitions de page", "Effet lors du changement de page", "transitions"), entry("CSS personnalisé", "Règles CSS de tout le site", "css"),
      entry("Réglages supplémentaires", "Langue, défilement, référencement", "extras"),
      entry("Référencement (SEO)", "Titre, description, image de partage, indexation", "seo"),
    ]));
    bodyEl.appendChild(h("p", { class: "ss-help" }, ["Besoin d'aide ? ", h("a", { href: "/marketing/site-web/sites/" + state.site.id, target: "_blank", rel: "noopener" }, ["Ouvrir la fiche du site"])]));
  }

  // ---------- Moteur de formulaire : chaque champ lit et écrit un vrai réglage (chemin dans les jetons ou les réglages) ----------
  function settingsRoot() { return { tokens: state.tokens, settings: state.settings }; }
  function getPath(path) { return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, settingsRoot()); }
  function setPath(path, v) { var ks = path.split("."), last = ks.pop(), o = ks.reduce(function (a, k) { return a[k]; }, settingsRoot()); o[last] = v; }
  var uid = 0;
  function fieldWrap(spec, control, extra) {
    var id = "ss-f-" + (++uid);
    control.id = id;
    return h("div", { class: "ss-field" + (spec.inline ? " is-inline" : "") }, [h("label", { for: id, text: spec.label }), control, extra, spec.hint ? h("p", { class: "ss-hint", text: spec.hint }) : null]);
  }
  function numberField(spec) {
    var v = getPath(spec.path);
    var N = window.KWNumeric;
    // Même NumericControl que l'éditeur (saisie, ▲▼, flèches du clavier, bornes) ; repli sur un champ simple s'il manque
    if (N) {
      var ctl = N.create({ label: spec.label, min: spec.min, max: spec.max, step: spec.step || 1, precision: spec.precision, value: v === null || v === undefined ? "" : v, placeholder: spec.nullable ? "Par défaut" : "", staticUnit: spec.unit || null, allowEmpty: Boolean(spec.nullable), disabled: !state.canWrite, drag: false, live: true,
        onCommit: function (raw) {
          var val = raw === "" ? (spec.nullable ? null : getPath(spec.path)) : Number(raw);
          if (raw !== "" && !isFinite(val)) return false;
          if (val === getPath(spec.path)) return;
          change(function () { setPath(spec.path, val); });
        } });
      var nw = fieldWrap(spec, ctl);
      ctl.removeAttribute("id");
      ctl.input.id = "ss-n-" + (++uid);
      nw.querySelector("label").setAttribute("for", ctl.input.id);
      return nw;
    }
    var input = h("input", { type: "number", min: spec.min, max: spec.max, step: spec.step || 1, value: v === null || v === undefined ? "" : String(v), placeholder: spec.nullable ? "Par défaut" : null, disabled: !state.canWrite, inputmode: "decimal" });
    input.addEventListener("input", function () {
      var raw = input.value.trim();
      var val = raw === "" ? (spec.nullable ? null : getPath(spec.path)) : Number(raw);
      if (raw !== "" && !isFinite(val)) return;
      var cur = getPath(spec.path);
      if (val === cur) return;
      change(function () { setPath(spec.path, val); });
    });
    var wrap = fieldWrap(spec, input, spec.unit ? h("span", { class: "ss-unit", text: spec.unit }) : null);
    if (spec.unit) wrap.classList.add("has-unit");
    return wrap;
  }
  function selectField(spec) {
    var cur = getPath(spec.path);
    var select = h("select", { disabled: !state.canWrite }, spec.options.map(function (o) { return h("option", { value: String(o[0]), selected: String(cur === null || cur === undefined ? "" : cur) === String(o[0]), text: o[1] }); }));
    select.addEventListener("change", function () {
      var raw = select.value, val = spec.numeric ? Number(raw) : raw;
      change(function () { setPath(spec.path, val); });
    });
    return fieldWrap(spec, select);
  }
  function toggleField(spec) {
    var input = h("input", { type: "checkbox", checked: Boolean(getPath(spec.path)), disabled: !state.canWrite });
    input.addEventListener("change", function () { change(function () { setPath(spec.path, input.checked); }); if (spec.rerender) render(); });
    var id = "ss-f-" + (++uid);
    input.id = id;
    return h("div", { class: "ss-field ss-toggle" }, [input, h("label", { for: id, text: spec.label }), spec.hint ? h("p", { class: "ss-hint", text: spec.hint }) : null]);
  }
  function textField(spec) {
    var area = spec.kind === "textarea";
    var input = h(area ? "textarea" : "input", Object.assign({ disabled: !state.canWrite, maxlength: spec.max, spellcheck: spec.code ? "false" : null, rows: area ? (spec.rows || 4) : null, class: spec.code ? "ss-code" : null }, area ? {} : { type: "text" }));
    input.value = getPath(spec.path) || "";
    input.addEventListener("input", function () { var v = input.value; if (v !== getPath(spec.path)) change(function () { setPath(spec.path, v); }); });
    return fieldWrap(spec, input);
  }
  // Couleur : « par défaut », une couleur du site (système ou personnalisée) ou une couleur libre
  function colorRefField(spec) {
    var C = state.catalog, cur = getPath(spec.path) || "";
    var opts = [["", spec.emptyLabel || "Par défaut"]];
    C.colorKeys.forEach(function (k) { opts.push(["token:" + k, "Site : " + C.colorLabels[k]]); });
    state.tokens.customColors.forEach(function (c) { opts.push(["token:" + c.key, "Site : " + c.label]); });
    if (!spec.siteOnly) opts.push(["#", "Couleur libre…"]);
    var isHex = /^#[0-9a-f]{6}$/i.test(cur);
    var select = h("select", { disabled: !state.canWrite }, opts.map(function (o) { return h("option", { value: o[0], selected: isHex ? o[0] === "#" : o[0] === cur, text: o[1] }); }));
    var picker = h("input", { type: "color", value: isHex ? cur : "#6b1e2e", "aria-label": spec.label + " : couleur libre", hidden: !isHex, disabled: !state.canWrite });
    select.addEventListener("change", function () {
      var v = select.value;
      if (v === "#") { v = picker.value; picker.hidden = false; } else picker.hidden = true;
      change(function () { setPath(spec.path, v); });
    });
    picker.addEventListener("input", function () { var v = picker.value.toLowerCase(); change(function () { setPath(spec.path, v); }); });
    var wrap = fieldWrap(spec, select, picker);
    wrap.classList.add("ss-colorref");
    return wrap;
  }
  function imageField(spec) {
    var cur = getPath(spec.path) || "";
    var preview = h("div", { class: "ss-image" });
    function paint() {
      var v = getPath(spec.path) || "";
      preview.textContent = "";
      if (v) preview.appendChild(h("img", { src: v, alt: "", width: "64", height: "64" }));
      preview.appendChild(h("span", { class: "ss-image-path", text: v || "Aucune image" }));
    }
    var pick = h("button", { type: "button", class: "btn btn-outline btn-sm", text: cur ? "Changer l'image" : "Choisir une image", disabled: !state.canWrite, onclick: function () {
      bridge.pickImage(function (path) { change(function () { setPath(spec.path, path); }); pick.textContent = "Changer l'image"; paint(); });
    } });
    var clear = h("button", { type: "button", class: "btn btn-ghost btn-sm", text: "Retirer", disabled: !state.canWrite, onclick: function () { change(function () { setPath(spec.path, ""); }); pick.textContent = "Choisir une image"; paint(); } });
    paint();
    return h("div", { class: "ss-field" }, [h("span", { class: "ss-label", text: spec.label }), preview, h("div", { class: "ss-row" }, [pick, clear]), spec.hint ? h("p", { class: "ss-hint", text: spec.hint }) : null]);
  }
  // Couleur unie au format #rrggbb (nuancier du navigateur)
  function hexField(spec) {
    var input = h("input", { type: "color", value: getPath(spec.path) || "#000000", disabled: !state.canWrite });
    input.addEventListener("input", function () { var v = input.value.toLowerCase(); change(function () { setPath(spec.path, v); }); });
    return fieldWrap(spec, input);
  }
  var KINDS = { hex: hexField, number: numberField, select: selectField, toggle: toggleField, text: textField, textarea: textField, color: colorRefField, image: imageField };
  function fields(list) { return list.map(function (spec) { return KINDS[spec.kind](spec); }); }
  function section(title, list, hint) { return h("section", { class: "ss-group" }, [h("h3", { text: title }), hint ? h("p", { class: "ss-hint", text: hint }) : null].concat(fields(list))); }
  function details(title, list, open) { return h("details", { class: "ss-details", open: open || null }, [h("summary", { text: title }), h("div", { class: "ss-details-body" }, fields(list))]); }

  var WEIGHTS = [[400, "Normal (400)"], [500, "Moyen (500)"], [600, "Demi-gras (600)"], [700, "Gras (700)"], [800, "Très gras (800)"]];
  var TRANSFORMS = [["none", "Normale"], ["uppercase", "MAJUSCULES"], ["lowercase", "minuscules"], ["capitalize", "Première Lettre"]];

  function renderTypography() {
    var C = state.catalog;
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Taille, graisse, hauteur de ligne et détails de chaque niveau. Les familles de police se choisissent dans « Polices globales ». Un champ vide garde la valeur d'origine." }));
    C.typeKeys.forEach(function (k, i) {
      var base = "tokens.type." + k + ".";
      bodyEl.appendChild(details(C.typeLabels[k], [
        { kind: "number", path: base + "size", label: "Taille", min: 10, max: 96, unit: "px" },
        { kind: "select", path: base + "weight", label: "Graisse", options: WEIGHTS, numeric: true },
        { kind: "number", path: base + "lineHeight", label: "Hauteur de ligne", min: 1, max: 2, step: 0.05 },
        { kind: "number", path: base + "letterSpacing", label: "Espacement des lettres", min: -0.1, max: 0.5, step: 0.01, unit: "em" },
        { kind: "select", path: base + "transform", label: "Casse", options: TRANSFORMS },
        { kind: "select", path: base + "fontStyle", label: "Style", options: [["normal", "Normal"], ["italic", "Italique"]] },
        { kind: "color", path: base + "color", label: "Couleur du texte", emptyLabel: "Hérité (d'origine)" },
      ], i === 0));
    });
    bodyEl.appendChild(details("Liens du texte", [
      { kind: "color", path: "tokens.link.color", label: "Couleur", emptyLabel: "Par défaut (couleur principale)" },
      { kind: "color", path: "tokens.link.hoverColor", label: "Couleur au survol", emptyLabel: "Identique" },
      { kind: "select", path: "tokens.link.underline", label: "Soulignement", options: [["", "Par défaut"], ["always", "Toujours"], ["hover", "Au survol seulement"], ["none", "Jamais"]] },
    ]));
    bodyEl.appendChild(details("Listes", [
      { kind: "number", path: "tokens.list.gap", label: "Espace entre les éléments", min: 0, max: 32, unit: "px", nullable: true },
      { kind: "color", path: "tokens.list.markerColor", label: "Couleur des puces", emptyLabel: "Par défaut" },
    ]));
  }
  function renderButtons() {
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Appliqués aux boutons du site. Les couleurs et états concernent les boutons principaux ; les contours (« outline ») et discrets (« ghost ») gardent leur apparence. Un bouton réglé dans l'inspecteur reste prioritaire. Taille et graisse du texte : « Typographie ▸ Bouton »." }));
    bodyEl.appendChild(section("Dimensions", [
      { kind: "number", path: "tokens.buttons.paddingY", label: "Marge intérieure verticale", min: 4, max: 32, unit: "px", nullable: true },
      { kind: "number", path: "tokens.buttons.paddingX", label: "Marge intérieure horizontale", min: 8, max: 64, unit: "px", nullable: true },
      { kind: "number", path: "tokens.buttons.borderWidth", label: "Épaisseur de la bordure", min: 0, max: 6, unit: "px", nullable: true },
      { kind: "number", path: "tokens.radius.button", label: "Rayon des coins", min: 0, max: 48, unit: "px" },
      { kind: "number", path: "tokens.sizes.buttonHeight", label: "Hauteur minimale", min: 32, max: 72, unit: "px" },
      { kind: "select", path: "tokens.shadow.button", label: "Ombre", options: state.catalog.shadows.map(function (s) { return [s, s === "none" ? "Aucune" : s === "sm" ? "Légère" : s === "md" ? "Moyenne" : "Forte"]; }) },
    ]));
    [["normal", "État normal"], ["hover", "Au survol"], ["active", "Au clic"]].forEach(function (st) {
      bodyEl.appendChild(details(st[1], [
        { kind: "color", path: "tokens.buttons." + st[0] + ".bg", label: "Fond", emptyLabel: "Par défaut" },
        { kind: "color", path: "tokens.buttons." + st[0] + ".color", label: "Texte", emptyLabel: "Par défaut" },
        { kind: "color", path: "tokens.buttons." + st[0] + ".border", label: "Bordure", emptyLabel: "Par défaut" },
      ]));
    });
    bodyEl.appendChild(details("Au focus (navigation au clavier)", [
      { kind: "color", path: "tokens.buttons.focus.color", label: "Couleur du contour", emptyLabel: "Par défaut" },
      { kind: "number", path: "tokens.buttons.focus.width", label: "Épaisseur du contour", min: 0, max: 8, unit: "px", nullable: true },
      { kind: "number", path: "tokens.buttons.focus.offset", label: "Décalage du contour", min: 0, max: 8, unit: "px", nullable: true },
    ]));
  }
  function renderImages() {
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Rayon, bordure et ombre s'appliquent aux images, boîtes d'image, galeries et carrousels. Ajustement et position concernent les images à format imposé (galeries, carrousels, cartes d'articles et de formations). Les images s'adaptent déjà à la largeur de l'écran." }));
    bodyEl.appendChild(section("Apparence", [
      { kind: "number", path: "tokens.images.radius", label: "Rayon des coins", min: 0, max: 48, unit: "px", nullable: true },
      { kind: "number", path: "tokens.images.borderWidth", label: "Épaisseur de la bordure", min: 0, max: 8, unit: "px", nullable: true },
      { kind: "color", path: "tokens.images.borderColor", label: "Couleur de la bordure", emptyLabel: "Par défaut" },
      { kind: "select", path: "tokens.images.shadow", label: "Ombre", options: [["", "Aucune (d'origine)"]].concat(state.catalog.shadows.filter(function (s) { return s !== "none"; }).map(function (s) { return [s, s === "sm" ? "Légère" : s === "md" ? "Moyenne" : "Forte"]; })) },
    ]));
    bodyEl.appendChild(section("Images à format imposé", [
      { kind: "select", path: "tokens.images.fit", label: "Ajustement", options: [["", "Par défaut"], ["cover", "Remplir (recadrer)"], ["contain", "Contenir (tout voir)"], ["fill", "Étirer"], ["scale-down", "Réduire si besoin"]] },
      { kind: "select", path: "tokens.images.position", label: "Position", options: [["", "Par défaut"], ["center", "Centre"], ["top", "Haut"], ["bottom", "Bas"], ["left", "Gauche"], ["right", "Droite"]] },
    ]));
  }
  function renderForms() {
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Champs des formulaires d'inscription et de recherche du site. Le bouton d'envoi suit les réglages des boutons." }));
    bodyEl.appendChild(section("Champs de saisie", [
      { kind: "color", path: "tokens.forms.bg", label: "Fond", emptyLabel: "Par défaut" },
      { kind: "color", path: "tokens.forms.color", label: "Texte", emptyLabel: "Par défaut" },
      { kind: "color", path: "tokens.forms.borderColor", label: "Bordure", emptyLabel: "Par défaut" },
      { kind: "number", path: "tokens.forms.borderWidth", label: "Épaisseur de la bordure", min: 0, max: 4, unit: "px", nullable: true },
      { kind: "number", path: "tokens.forms.radius", label: "Rayon des coins", min: 0, max: 32, unit: "px", nullable: true },
      { kind: "number", path: "tokens.forms.paddingY", label: "Marge intérieure verticale", min: 4, max: 24, unit: "px", nullable: true },
      { kind: "number", path: "tokens.forms.paddingX", label: "Marge intérieure horizontale", min: 6, max: 32, unit: "px", nullable: true },
    ]));
    bodyEl.appendChild(section("Focus et aides", [
      { kind: "color", path: "tokens.forms.focusColor", label: "Couleur au focus", emptyLabel: "Par défaut" },
      { kind: "color", path: "tokens.forms.placeholderColor", label: "Texte d'aide à la saisie", emptyLabel: "Par défaut" },
      { kind: "color", path: "tokens.forms.labelColor", label: "Libellés des champs", emptyLabel: "Par défaut" },
      { kind: "color", path: "tokens.forms.accent", label: "Cases à cocher et boutons radio", emptyLabel: "Par défaut" },
    ]));
  }
  function renderIdentity() {
    var nameInput = h("input", { type: "text", maxlength: "100", value: state.site.name, disabled: !state.canWrite });
    nameInput.addEventListener("input", function () { var v = nameInput.value; if (v.trim() && v !== state.site.name) change(function (t, s, st) { st.site.name = v; }); });
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Le nom, le logo et le favicon sont utilisés par les pages publiées du site : onglet du navigateur, pied de page, aperçu lors d'un partage. La description sert aux pages qui n'ont pas la leur." }));
    bodyEl.appendChild(h("section", { class: "ss-group" }, [h("h3", { text: "Informations générales" }), fieldWrap({ label: "Nom du site" }, nameInput)].concat(fields([
      { kind: "textarea", path: "settings.identity.description", label: "Description du site", max: 300, rows: 3, hint: "300 caractères au plus." },
    ]))));
    bodyEl.appendChild(h("section", { class: "ss-group" }, [h("h3", { text: "Logo et favicon" })].concat(fields([
      { kind: "image", path: "settings.identity.logoUrl", label: "Logo", hint: "Affiché dans le pied de page de chaque page du site, à la place du nom." },
      { kind: "image", path: "settings.identity.logoMobileUrl", label: "Logo mobile (facultatif)", hint: "Remplace le logo sur les petits écrans." },
      { kind: "image", path: "settings.identity.faviconUrl", label: "Favicon", hint: "Petite icône de l'onglet (carrée : PNG, SVG, ICO)." },
    ]))));
  }
  function renderBackground() {
    var g = state.settings.background.gradient.enabled;
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Fond de toutes les pages du site. Un fond posé sur une section ou un conteneur reste visible par-dessus." }));
    bodyEl.appendChild(section("Couleur", [{ kind: "color", path: "settings.background.color", label: "Couleur de fond", emptyLabel: "Couleur « Fond » du site" }]));
    bodyEl.appendChild(h("section", { class: "ss-group" }, [h("h3", { text: "Dégradé" })].concat(fields([{ kind: "toggle", path: "settings.background.gradient.enabled", label: "Utiliser un dégradé", rerender: true }]).concat(g ? fields([
      { kind: "color", path: "settings.background.gradient.from", label: "Début", siteOnly: false },
      { kind: "color", path: "settings.background.gradient.to", label: "Fin", siteOnly: false },
      { kind: "number", path: "settings.background.gradient.angle", label: "Angle", min: 0, max: 360, unit: "°" },
    ]) : []))));
    bodyEl.appendChild(section("Image", [
      { kind: "image", path: "settings.background.image", label: "Image de fond" },
      { kind: "select", path: "settings.background.position", label: "Position", options: [["center", "Centre"], ["top", "Haut"], ["bottom", "Bas"], ["left", "Gauche"], ["right", "Droite"]] },
      { kind: "select", path: "settings.background.size", label: "Taille", options: [["cover", "Couvrir la page"], ["contain", "Contenir"], ["auto", "Taille d'origine"]] },
      { kind: "select", path: "settings.background.repeat", label: "Répétition", options: [["no-repeat", "Aucune"], ["repeat", "Répéter"], ["repeat-x", "Horizontale"], ["repeat-y", "Verticale"]] },
      { kind: "toggle", path: "settings.background.fixed", label: "Image fixe au défilement", hint: "Ordinateur seulement ; sur mobile l'image défile avec la page (meilleures performances)." },
    ]));
  }
  function renderLayout() {
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Ces valeurs s'appliquent à toutes les pages du site. Les largeurs et marges réglées sur un élément restent prioritaires." }));
    bodyEl.appendChild(section("Largeurs et marges", [
      { kind: "toggle", path: "settings.layout.fullWidth", label: "Contenu pleine largeur", hint: "Le contenu des pages occupe toute la largeur de l'écran (les conteneurs gardent leur largeur maximale)." },
      { kind: "number", path: "settings.layout.contentWidth", label: "Largeur du contenu", min: 480, max: 1600, unit: "px" },
      { kind: "number", path: "settings.layout.containerWidth", label: "Largeur maximale des conteneurs", min: 480, max: 1600, unit: "px", hint: "1 100 px par défaut. 1 140 px est la valeur courante des constructeurs de pages ; la valeur choisie s'applique aux conteneurs « encadrés » et au contenu des conteneurs « fond pleine largeur, contenu encadré »." },
      { kind: "number", path: "settings.layout.gutter", label: "Marges latérales", min: 0, max: 80, unit: "px" },
      { kind: "number", path: "tokens.space.lg", label: "Espace entre les sections", min: 0, max: 200, unit: "px" },
    ]));
    bodyEl.appendChild(section("Écrans (points de rupture)", [
      { kind: "number", path: "settings.layout.breakpoints.tablet", label: "Tablette : jusqu'à", min: 820, max: 1279, unit: "px", hint: "Les styles « Tablette » des éléments et « Masquer sur tablette » s'appliquent jusqu'à cette largeur." },
      { kind: "number", path: "settings.layout.breakpoints.mobile", label: "Mobile : jusqu'à", min: 400, max: 767, unit: "px", hint: "Les styles « Mobile » des éléments et « Masquer sur mobile » s'appliquent jusqu'à cette largeur. Les adaptations internes de chaque élément gardent leurs propres seuils." },
      { kind: "number", path: "settings.layout.breakpoints.wide", label: "Grand écran : à partir de", min: 1400, max: 3000, unit: "px", hint: "Les styles « Grand écran » des éléments et « Masquer sur grand écran » s'appliquent à partir de cette largeur ; sans réglage propre, un élément garde son style « Ordinateur »." },
    ]));
  }
  function renderLightbox() {
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Agrandissement des images des galeries d'images dont l'option « Agrandir au clic » est cochée." }));
    bodyEl.appendChild(section("Visionneuse", [
      { kind: "toggle", path: "settings.lightbox.enabled", label: "Activer la visionneuse", hint: "Désactivée, un clic ouvre simplement l'image dans la page." },
      { kind: "hex", path: "settings.lightbox.overlay", label: "Couleur du fond" },
      { kind: "number", path: "settings.lightbox.overlayOpacity", label: "Opacité du fond", min: 20, max: 100, unit: "%" },
      { kind: "toggle", path: "settings.lightbox.arrows", label: "Flèches précédent / suivant" },
      { kind: "toggle", path: "settings.lightbox.closeOnOverlay", label: "Fermer en cliquant à côté de l'image" },
      { kind: "toggle", path: "settings.lightbox.captions", label: "Afficher les légendes" },
      { kind: "select", path: "settings.lightbox.animation", label: "Animation d'ouverture", options: [["fade", "Fondu"], ["zoom", "Zoom"], ["none", "Aucune"]] },
    ]));
  }
  function renderTransitions() {
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Effet au passage d'une page à l'autre du site. Il utilise la fonction de transition de page du navigateur : sur un navigateur qui ne la propose pas, la page change simplement sans effet. Désactivé pour les personnes qui ont demandé moins d'animations." }));
    bodyEl.appendChild(section("Transition", [
      { kind: "select", path: "settings.transitions.type", label: "Type", options: [["none", "Aucune"], ["fade", "Fondu"], ["slide", "Glissement"]] },
      { kind: "number", path: "settings.transitions.duration", label: "Durée", min: 100, max: 1000, step: 50, unit: "ms" },
    ]));
  }
  function renderCss() {
    var C = state.catalog;
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Règles CSS appliquées à tout le site, après les réglages ci-dessus. Écrivez « .ma-classe { color: #0b2a40; } » : chaque sélecteur est automatiquement limité aux pages du site. Pas d'@, de commentaire, d'adresse ni de ressource externe. Le CSS posé ici l'emporte sur les réglages globaux ; un style d'élément n'est dépassé que par un sélecteur plus précis. " + C.maxCss.toLocaleString("fr-FR") + " caractères au plus." }));
    if (!state.canCode) bodyEl.appendChild(h("p", { class: "ss-note is-error", text: "Réservé aux comptes autorisés à écrire du code (permission « pages.code »). Vous pouvez le lire, pas le modifier." }));
    var ta = textField({ kind: "textarea", path: "settings.customCss", label: "CSS du site", max: C.maxCss, rows: 14, code: true });
    var area = ta.querySelector("textarea");
    area.disabled = !state.canWrite || !state.canCode;
    var count = h("p", { class: "ss-hint", "aria-live": "polite" });
    function upd() { count.textContent = area.value.length.toLocaleString("fr-FR") + " / " + C.maxCss.toLocaleString("fr-FR") + " caractères"; }
    area.addEventListener("input", upd); upd();
    bodyEl.appendChild(h("section", { class: "ss-group" }, [ta, count]));
  }
  function renderExtras() {
    var langs = Object.keys(state.catalog.languages).map(function (k) { return [k, state.catalog.languages[k]]; });
    bodyEl.appendChild(section("Langue et accessibilité", [
      { kind: "select", path: "settings.extras.language", label: "Langue des pages", options: langs, hint: "Déclarée dans chaque page (lecteurs d'écran, traduction, moteurs de recherche)." },
      { kind: "toggle", path: "settings.extras.smoothScroll", label: "Défilement doux vers les ancres", hint: "Désactivé automatiquement pour les personnes qui ont demandé moins d'animations." },
    ]));
    bodyEl.appendChild(section("Référencement", [
      { kind: "toggle", path: "settings.extras.noindex", label: "Demander aux moteurs de recherche de ne pas indexer ce site", hint: "S'applique à toutes les pages du site, en plus du réglage de chaque page." },
    ]));
  }

  // Référencement du site : valeurs par défaut des pages du site (une page peut toujours avoir les siennes, dans son panneau SEO)
  function renderSeo() {
    bodyEl.appendChild(h("p", { class: "ss-hint", text: "Valeurs par défaut des pages du site. Ordre de priorité : le réglage SEO de la page l'emporte, puis son titre et sa description, puis ces réglages du site, puis ceux de KOLAKISA (Réglages SEO)." }));
    if (!state.canSeo) bodyEl.appendChild(h("p", { class: "ss-note is-error", text: "Vous pouvez lire ces réglages, pas les modifier (permission « seo.edit »)." }));
    var wrap = h("div", { class: "ss-seo" }, []);
    wrap.appendChild(section("Titre et description", [
      { kind: "text", path: "settings.seo.title", label: "Nom du site dans les résultats", max: 70, hint: "Ajouté après le titre de chaque page (« Titre · Nom »). Vide : le nom du site." },
      { kind: "textarea", path: "settings.identity.description", label: "Description du site", max: 300, rows: 3, hint: "Utilisée par les pages qui n'ont pas leur propre description." },
    ]));
    wrap.appendChild(section("Partage sur les réseaux", [
      { kind: "image", path: "settings.seo.ogImage", label: "Image de partage par défaut", hint: "Pour les pages sans image de partage ni bandeau. Idéalement 1200 × 630. Choisie dans la médiathèque." },
    ]));
    wrap.appendChild(section("Indexation et adresse", [
      { kind: "toggle", path: "settings.extras.noindex", label: "Demander aux moteurs de ne pas indexer ce site", hint: "Toutes les pages du site sont alors en noindex (et absentes du plan du site)." },
      { kind: "toggle", path: "settings.seo.follow", label: "Autoriser les moteurs à suivre les liens des pages", hint: "Décoché : toutes les pages du site sont publiées en nofollow." },
      { kind: "text", path: "settings.seo.publicUrl", label: "Adresse publique du site (facultative)", max: 200, hint: "Ex. https://www.monsite.com — sans chemin. Utilisée pour les adresses canoniques, le partage et les données structurées. Vide : l'adresse de KOLAKISA." },
    ]));
    if (!state.canSeo) wrap.querySelectorAll("input, select, textarea, button").forEach(function (el) { el.disabled = true; });
    bodyEl.appendChild(wrap);
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
      var stackOf = function (k) { var lib = window.KFonts && window.KFonts.byId(k); if (lib) { window.KFonts.ensure([lib.id]); return lib.stack; } return C.fonts[k] ? C.fonts[k].stack : "inherit"; };
      sample.style.fontFamily = stackOf(T.fonts[role]);
      // Police : bibliothèque centrale (Font Manager) ; les polices historiques du site restent proposées en tête
      var select = window.KFonts
        ? window.KFonts.picker({ site: true, value: T.fonts[role], legacy: Object.keys(C.fonts).map(function (k) { return [k, C.fonts[k].label]; }), legacyStacks: function () { var m = {}; Object.keys(C.fonts).forEach(function (k) { m[k] = C.fonts[k].stack; }); return m; }, disabled: !state.canWrite, label: C.fontLabels[role],
          onChange: function (v) { change(function (t) { t.fonts[role] = v; }); setTimeout(function () { sample.style.fontFamily = stackOf(v); }, 60); } })
        : h("select", { id: id, disabled: !state.canWrite }, Object.keys(C.fonts).map(function (k) { return h("option", { value: k, selected: T.fonts[role] === k, text: C.fonts[k].label }); }));
      if (!window.KFonts) select.addEventListener("change", function () { var v = select.value; change(function (t) { t.fonts[role] = v; }); sample.style.fontFamily = C.fonts[v].stack; });
      select.id = id;
      if (window.KFonts && !window.KFonts.ready()) window.KFonts.load().then(function () { sample.style.fontFamily = stackOf(T.fonts[role]); }).catch(function () {});
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
