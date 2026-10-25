// KOLAKISA CMS → Apparence → Personnaliser : interface du personnalisateur (panneau de réglages, aperçu réel du site, brouillon, publication).
// Le serveur est la seule source de vérité : chaque valeur est validée par lui (POST /rendu pour l'aperçu, /brouillon, /publier) ; l'interface n'annonce un succès
// qu'après SA réponse. Aperçu : les réglages qui ne changent que le CSS remplacent les feuilles de style du site dans le cadre (sans recharger) ;
// ceux qui changent le contenu (nom, logos, en-tête…) rechargent le cadre en gardant la position de défilement.
(function () {
  "use strict";
  var boot = JSON.parse(document.getElementById("kwc-boot").textContent);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var NS = "http://www.w3.org/2000/svg";

  // ---------- Données ----------
  var controls = {}, panelOf = {};
  boot.panels.forEach(function (p) { p.controls.forEach(function (c) { controls[c.id] = c; panelOf[c.id] = p.id; }); });
  var live = clone(boot.live);                 // version en ligne
  var values = clone(boot.values);             // valeurs affichées (en ligne + changements)
  var saved = clone(boot.changes || {});       // dernier brouillon ENREGISTRÉ
  var rev = boot.draft.rev || 0;               // version du brouillon connue du serveur
  var errors = {};                             // erreurs de validation par réglage
  var undoStack = [], redoStack = [];
  var busy = false, seq = 0, applied = 0, warnings = [];
  var device = "desktop", openPanel = null;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function same(a, b) { return String(a === null || a === undefined ? "" : a) === String(b === null || b === undefined ? "" : b); }
  function work() { var o = {}; Object.keys(values).forEach(function (id) { if (!same(values[id], live[id])) o[id] = values[id]; }); return o; }
  function sameChanges(a, b) { var ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(function (k) { return k in b && same(a[k], b[k]); }); }
  function dirty() { return !sameChanges(work(), saved); }
  function pendingCount() { return Object.keys(work()).length; }

  // ---------- Petits utilitaires d'interface ----------
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
  function icon(name, cls) { var s = document.createElementNS(NS, "svg"); s.setAttribute("class", "kwc-i " + (cls || "")); s.setAttribute("aria-hidden", "true"); var u = document.createElementNS(NS, "use"); u.setAttribute("href", "#i-" + name); s.appendChild(u); return s; }
  function toast(text, kind) {
    var t = h("div", { class: "kwc-toast kwc-toast-" + (kind || "ok"), role: kind === "error" ? "alert" : "status", text: text });
    $("#kwc-toasts").appendChild(t);
    setTimeout(function () { t.classList.add("is-out"); setTimeout(function () { t.remove(); }, 300); }, kind === "error" ? 7000 : 3500);
  }
  function modal(title, body, actions) {
    var m = $("#kwc-modal"), previous = document.activeElement;
    $("#kwc-modal-title").textContent = title;
    var b = $("#kwc-modal-body"); b.textContent = ""; [].concat(body).filter(Boolean).forEach(function (n) { b.appendChild(typeof n === "string" ? h("p", { text: n }) : n); });
    var a = $("#kwc-modal-act"); a.textContent = "";
    function close() { m.hidden = true; document.removeEventListener("keydown", esc, true); if (previous && previous.focus) previous.focus(); }
    function esc(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    actions.forEach(function (x) { a.appendChild(h("button", { type: "button", class: "kwc-btn" + (x.primary ? " kwc-btn-primary" : ""), text: x.label, onclick: function () { close(); if (x.run) x.run(); } })); });
    m.hidden = false; document.addEventListener("keydown", esc, true);
    var first = a.querySelector(".kwc-btn-primary") || a.querySelector("button"); if (first) first.focus();
    return close;
  }
  function labelOf(id) { var c = controls[id]; if (!c) return id; var p = boot.panels.filter(function (x) { return x.id === c.panel; })[0]; return (p ? p.label + " › " : "") + c.label; }

  // ---------- Statut ----------
  function setStatus() {
    var el = $("#kwc-status"), txt = $("#kwc-status-text"), state, text;
    if (busy === "save") { state = "busy"; text = "Enregistrement…"; }
    else if (busy === "publish") { state = "busy"; text = "Publication…"; }
    else if (dirty()) { state = "dirty"; text = "Modifications non enregistrées"; }
    else if (Object.keys(saved).length) { state = "draft"; text = "Brouillon enregistré"; }
    else { state = "live"; text = "Publié"; }
    el.setAttribute("data-state", state); txt.textContent = text;
    var can = boot.can, nothing = pendingCount() === 0;
    $("#kwc-save").disabled = !can.edit || !!busy || !dirty() || hasErrors();
    $("#kwc-publish").disabled = !can.publish || !!busy || nothing || hasErrors() || boot.pendingEngineDraft;
    $("#kwc-undo").disabled = !undoStack.length || !!busy; $("#kwc-redo").disabled = !redoStack.length || !!busy;
    var cnt = $("#kwc-publish"); cnt.textContent = nothing && !dirty() ? "Publié" : "Publier";
    if (!can.edit) $("#kwc-save").title = boot.readOnly ? "Ce site est archivé ou supprimé." : "Vous n'avez pas la permission de modifier ce site.";
    renderCounts();
  }
  function hasErrors() { return Object.keys(errors).length > 0; }

  // ---------- Panneaux ----------
  var side = $("#kwc-panel");
  function renderRoot() {
    openPanel = null; side.textContent = "";
    var head = h("div", { class: "kwc-root-head" }, [h("span", { class: "kwc-kicker", text: "Vous personnalisez" }), h("strong", { text: boot.siteName })]);
    side.appendChild(head);
    var list = h("ul", { class: "kwc-list", role: "list" });
    boot.panels.forEach(function (p) {
      var btn = h("button", { type: "button", class: "kwc-row", "data-panel": p.id, onclick: function () { renderPanel(p.id); } }, [
        h("span", { class: "kwc-row-ico" }, [icon(p.icon)]),
        h("span", { class: "kwc-row-txt" }, [h("strong", { text: p.label }), h("small", { text: p.hint })]),
        h("span", { class: "kwc-badge", "data-count": p.id, hidden: true }),
        icon("chev", "kwc-row-chev"),
      ]);
      list.appendChild(h("li", null, [btn]));
    });
    side.appendChild(list);
    if (boot.unsupported && boot.unsupported.length) {
      var d = h("details", { class: "kwc-unsupported" }, [h("summary", { text: "Non disponible pour ce site (" + boot.unsupported.length + ")" })]);
      var ul = h("ul");
      boot.unsupported.forEach(function (u) { ul.appendChild(h("li", null, [h("strong", { text: u[0] }), h("span", { text: " — " + u[1] })])); });
      d.appendChild(ul); side.appendChild(d);
    }
    side.appendChild(h("a", { class: "kwc-theme-link", href: boot.links.themes, target: "_blank", rel: "noopener" }, ["Thèmes du site ", icon("ext", "kwc-i-s")]));
    renderCounts();
  }
  function renderCounts() {
    var w = work(), per = {};
    Object.keys(w).forEach(function (id) { var p = panelOf[id]; per[p] = (per[p] || 0) + 1; });
    $$("[data-count]").forEach(function (b) { var n = per[b.getAttribute("data-count")] || 0; b.hidden = !n; b.textContent = n; b.setAttribute("aria-label", n + " réglage" + (n > 1 ? "s" : "") + " modifié" + (n > 1 ? "s" : "")); });
    $$("[data-ctl]").forEach(function (row) { var id = row.getAttribute("data-ctl"); row.classList.toggle("is-modified", !same(values[id], live[id])); var r = row.querySelector(".kwc-reset"); if (r) r.hidden = same(values[id], live[id]); });
  }
  function renderPanel(id) {
    openPanel = id; side.textContent = "";
    var p = boot.panels.filter(function (x) { return x.id === id; })[0];
    side.appendChild(h("div", { class: "kwc-panel-head" }, [h("button", { type: "button", class: "kwc-iconbtn", "aria-label": "Retour à la liste des réglages", title: "Retour", onclick: renderRoot }, [icon("back")]), h("div", null, [h("span", { class: "kwc-kicker", text: "Personnalisation" }), h("h2", { text: p.label })])]));
    var body = h("div", { class: "kwc-fields" });
    if (id === "menus") body.appendChild(menusPanel());
    else {
      if (id === "en-tete" && !boot.principal) body.appendChild(note("L'en-tête d'un site est un composant du Page Builder : il se compose là-bas.", boot.links.pageBuilder, "Modifier l'en-tête et le pied de page"));
      if (id === "pied" && !boot.principal) body.appendChild(note("Le pied de page d'un site est un composant du Page Builder : il se compose là-bas.", boot.links.pageBuilder, "Modifier l'en-tête et le pied de page"));
      p.controls.forEach(function (c) { body.appendChild(field(c)); });
      if (id === "couleurs" && warnings.length) body.appendChild(warnBox());
      if (id === "couleurs") body.appendChild(h("p", { class: "kwc-hint", text: "Une couleur vide reprend la valeur d'origine du site. Les couleurs ne s'appliquent qu'aux éléments qui utilisent les couleurs globales : les styles personnalisés d'une page restent intacts." }));
    }
    side.appendChild(body); updateVisibility(); renderCounts();
    var first = body.querySelector("input,select,textarea,button,a"); if (first) first.focus({ preventScroll: true });
  }
  function note(text, href, label) { var n = h("div", { class: "kwc-note" }, [h("p", { text: text })]); if (href) n.appendChild(h("a", { class: "kwc-btn", href: href, target: "_blank", rel: "noopener" }, [label + " ", icon("ext", "kwc-i-s")])); return n; }
  function warnBox() { var d = h("div", { class: "kwc-warn", role: "status" }, [h("strong", { text: "Lisibilité" })]); var ul = h("ul"); warnings.forEach(function (w) { ul.appendChild(h("li", { text: w })); }); d.appendChild(ul); return d; }
  function menusPanel() {
    var box = h("div", { class: "kwc-menus" });
    box.appendChild(h("p", { class: "kwc-hint", text: "Les menus s'enregistrent directement dans l'écran Navigation (ils ne passent pas par le brouillon). Revenez ici et actualisez l'aperçu pour les voir." }));
    if (!boot.menus.length) box.appendChild(h("p", { class: "kwc-empty-note", text: "Ce site n'a encore aucun menu." }));
    var ul = h("ul", { class: "kwc-menulist" });
    boot.menus.forEach(function (m) { ul.appendChild(h("li", null, [h("strong", { text: m.name }), h("small", { text: m.items + " élément" + (m.items > 1 ? "s" : "") + (m.locations.length ? " · " + m.locations.map(function (l) { return ({ header: "En-tête", footer: "Pied de page", mobile: "Mobile" })[l] || l; }).join(", ") : " · non affecté") + (m.broken ? " · " + m.broken + " lien(s) à vérifier" : "") })])); });
    box.appendChild(ul);
    box.appendChild(h("a", { class: "kwc-btn kwc-btn-primary", href: boot.links.menus, target: "_blank", rel: "noopener" }, ["Modifier les menus ", icon("ext", "kwc-i-s")]));
    box.appendChild(h("button", { type: "button", class: "kwc-btn", onclick: function () { reloadFrame(); } }, ["Actualiser l'aperçu"]));
    return box;
  }

  // ---------- Contrôles ----------
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
    return h("div", { class: "kwc-colorrow" }, [pick, hex]);
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
  function updateVisibility() {
    $$("[data-ctl]").forEach(function (row) {
      var c = controls[row.getAttribute("data-ctl")]; if (!c || !c.showIf) return;
      var ok = Object.keys(c.showIf).every(function (k) { return same(values[k], c.showIf[k]); });
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
  function set(id, value, forceSnapshot) {
    var now = Date.now();
    if (forceSnapshot || lastPush.id !== id || now - lastPush.t > 900) { undoStack.push(clone(values)); if (undoStack.length > 100) undoStack.shift(); redoStack = []; }
    lastPush = { id: id, t: now };
    values[id] = value;
    afterChange();
  }
  function afterChange() { setStatus(); schedulePreview(); }
  function restore(snap) { values = clone(snap); errors = {}; if (openPanel) renderPanel(openPanel); afterChange(); }
  $("#kwc-undo").addEventListener("click", function () { if (!undoStack.length) return; redoStack.push(clone(values)); restore(undoStack.pop()); });
  $("#kwc-redo").addEventListener("click", function () { if (!redoStack.length) return; undoStack.push(clone(values)); restore(redoStack.pop()); });

  // ---------- Appels au serveur ----------
  function post(path, body) {
    var payload = Object.assign({ site: boot.siteId === null ? "" : String(boot.siteId) }, body);
    return fetch(boot.base + path + boot.siteQuery, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
      .then(function (res) { return res.text().then(function (text) { var data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; } if (!res.ok) { var err = new Error((data && data.error && data.error.message) || (res.status === 401 ? "Votre session a expiré : reconnectez-vous." : res.status === 403 ? "Vous n'avez pas la permission d'effectuer cette action." : res.status >= 500 ? "Erreur du serveur : réessayez dans un instant." : "Requête refusée (" + res.status + ").")); err.status = res.status; throw err; } return data; }); },
        function () { var err = new Error("Connexion impossible : vérifiez votre réseau. Vos modifications restent dans cette page."); err.network = true; throw err; });
  }
  function matchError(message) {
    var hit = null;
    Object.keys(controls).forEach(function (id) { if (!hit && message.indexOf(controls[id].label) === 0) hit = id; });
    return hit;
  }

  // ---------- Aperçu ----------
  var timer = null;
  function schedulePreview() { clearTimeout(timer); timer = setTimeout(sendPreview, 220); }
  function sendPreview() {
    if (!boot.can.edit || hasErrors()) return;
    var mine = ++seq;
    post("/rendu", { changes: work() }).then(function (r) {
      if (mine < seq) return;          // une réponse plus récente est déjà arrivée ou en route
      applied = mine; warnings = r.warnings || [];
      Object.keys(errors).forEach(function (id) { if (!/hexadécimal/.test(errors[id])) delete errors[id]; });
      showErrors();
      if (r.structural) reloadFrame(); else applyAssets(r.assets);
      if (openPanel === "couleurs") { var old = $(".kwc-warn"); if (old) old.remove(); if (warnings.length) { var b = $(".kwc-fields"); if (b) b.insertBefore(warnBox(), b.querySelector(".kwc-hint")); } }
      setStatus();
    }, function (e) {
      if (mine < seq) return;
      if (e.network) { toast(e.message, "error"); return; }
      var id = matchError(e.message);
      if (id) setError(id, e.message); else toast(e.message, "error");
      setStatus();
    });
  }
  var iframe = $("#kwc-iframe");
  function frameDoc() { try { return iframe.contentDocument; } catch (e) { return null; } }
  function styleEl(doc, id) { var el = doc.getElementById(id); if (!el) { el = doc.createElement("style"); el.id = id; doc.head.appendChild(el); } return el; }
  function applyAssets(a) {
    var doc = frameDoc(); if (!doc || !doc.head || !a) return;
    if (typeof a.appearanceCss === "string") styleEl(doc, "kw-appearance").textContent = a.appearanceCss;
    if (typeof a.theme === "string") styleEl(doc, "kw-site-theme").textContent = a.theme;
    if (typeof a.custom === "string") styleEl(doc, "kw-site-custom").textContent = a.custom;
    if (typeof a.faces === "string") styleEl(doc, "kw-site-faces").textContent = a.faces;
    if (typeof a.bodyStyle === "string" && doc.body) a.bodyStyle.split(";").forEach(function (d) { var i = d.indexOf(":"); if (i > 0) doc.body.style.setProperty(d.slice(0, i).trim(), d.slice(i + 1).trim()); });
  }
  function withParam(url) { var base = url.split("#")[0], hash = url.indexOf("#") >= 0 ? url.slice(url.indexOf("#")) : ""; return base.replace(/([?&])kwcustom=1(&|$)/, "$1").replace(/[?&]$/, "") + (base.indexOf("?") >= 0 ? "&" : "?") + "kwcustom=1" + hash; }
  function loadFrame(url) { $("#kwc-loading").classList.add("on"); iframe.src = withParam(url); }
  var scrollKeep = null;
  function reloadFrame() { var w = iframe.contentWindow; try { scrollKeep = w ? w.scrollY : 0; } catch (e) { scrollKeep = 0; } $("#kwc-loading").classList.add("on"); try { w.location.reload(); } catch (e) { loadFrame(currentPage()); } }
  function currentPage() { return $("#kwc-page").value || (boot.previews[0] && boot.previews[0].url) || "/"; }
  iframe.addEventListener("load", function () {
    $("#kwc-loading").classList.remove("on");
    var w, doc = frameDoc(); if (!doc) return; w = iframe.contentWindow;
    if (scrollKeep !== null) { try { w.scrollTo(0, scrollKeep); } catch (e) { /* ignoré */ } scrollKeep = null; }
    // La navigation reste dans l'aperçu (les réglages en cours restent appliqués) ; les liens externes ne quittent pas le personnalisateur ; aucun envoi de formulaire
    doc.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
      var href = a.getAttribute("href") || "";
      if (href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) { if (/^javascript:/i.test(href)) e.preventDefault(); return; }
      e.preventDefault();
      var u; try { u = new URL(a.href, w.location.href); } catch (x) { return; }
      if (u.origin !== w.location.origin) { toast("Lien externe : il s'ouvre hors de l'aperçu.", "ok"); window.open(u.href, "_blank", "noopener"); return; }
      $("#kwc-loading").classList.add("on"); iframe.src = withParam(u.pathname + u.search + u.hash);
    }, true);
    doc.addEventListener("submit", function (e) { e.preventDefault(); toast("Les formulaires sont désactivés dans l'aperçu.", "ok"); }, true);
  });
  // Pages à prévisualiser
  (function () {
    var sel = $("#kwc-page");
    if (!boot.previews.length) { $("#kwc-empty").hidden = false; iframe.hidden = true; sel.hidden = true; return; }
    boot.previews.forEach(function (p) { sel.appendChild(h("option", { value: p.url, text: p.label })); });
    sel.addEventListener("change", function () { loadFrame(sel.value); });
  })();
  // Appareils
  $$("[data-device]").forEach(function (b) { b.addEventListener("click", function () {
    device = b.getAttribute("data-device"); $("#kwc-frame").setAttribute("data-device", device);
    $$("[data-device]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
  }); });

  // ---------- Brouillon et publication ----------
  function saveDraft() {
    if (busy || !boot.can.edit || hasErrors() || !dirty()) return Promise.resolve(false);
    busy = "save"; setStatus();
    var w = work();
    return post("/brouillon", { changes: w, rev: rev }).then(function (r) {
      rev = r.draft.rev; saved = clone(w); busy = false; setStatus(); toast(Object.keys(w).length ? "Brouillon enregistré." : "Brouillon vide : rien n'est en attente.", "ok"); return true;
    }, function (e) { busy = false; setStatus(); var id = matchError(e.message); if (id) setError(id, e.message); toast(e.message, "error"); return false; });
  }
  function publish() {
    if (busy || !boot.can.publish || hasErrors() || pendingCount() === 0) return;
    var list = h("ul", { class: "kwc-publist" }); Object.keys(work()).slice(0, 12).forEach(function (id) { list.appendChild(h("li", { text: labelOf(id) })); });
    var more = Object.keys(work()).length - 12;
    modal("Publier les modifications ?", [h("p", { text: pendingCount() + " réglage" + (pendingCount() > 1 ? "s" : "") + " seront appliqués au site public « " + boot.siteName + " » :" }), list, more > 0 ? h("p", { text: "… et " + more + " autre(s)." }) : null], [
      { label: "Annuler" },
      { label: "Publier maintenant", primary: true, run: doPublish },
    ]);
  }
  function doPublish() {
    var go = dirty() ? saveDraft() : Promise.resolve(true);
    go.then(function (ok) {
      if (!ok) return;
      busy = "publish"; setStatus();
      post("/publier", { rev: rev }).then(function (r) {
        // Succès : le serveur a écrit dans le moteur du site
        live = clone(r.live); values = clone(r.values); saved = {}; rev = 0; undoStack = []; redoStack = []; errors = {}; boot.history = r.history || boot.history; boot.revision = r.revision;
        busy = false; if (openPanel) renderPanel(openPanel); setStatus();
        toast("Publié : le site public utilise maintenant ces réglages.", "ok");
        reloadFrame();
      }, function (e) { busy = false; setStatus(); toast(e.message, "error"); });
    });
  }
  function discard() {
    modal("Annuler le brouillon ?", "Les réglages non publiés (enregistrés ou non) seront abandonnés : le personnalisateur revient à la version en ligne.", [
      { label: "Conserver" },
      { label: "Annuler le brouillon", primary: true, run: function () {
        post("/annuler", {}).then(function () { values = clone(live); saved = {}; rev = 0; undoStack = []; redoStack = []; errors = {}; if (openPanel) renderPanel(openPanel); setStatus(); reloadFrame(); toast("Brouillon annulé.", "ok"); }, function (e) { toast(e.message, "error"); });
      } },
    ]);
  }
  function versions() {
    var body = [];
    if (!boot.history.length) body.push("Aucune publication enregistrée pour ce site avec le personnalisateur.");
    else { var ul = h("ul", { class: "kwc-vlist" }); boot.history.forEach(function (v) {
      ul.appendChild(h("li", null, [h("span", null, [h("strong", { text: v.publishedAt + " UTC" }), h("small", { text: (v.by ? " · " + v.by : "") + " · " + v.count + " réglage" + (v.count > 1 ? "s" : "") + (v.note ? " · " + v.note : "") })]),
        boot.can.publish ? h("button", { type: "button", class: "kwc-btn", text: "Revenir en arrière", onclick: function () { closer(); restoreVersion(v.id); } }) : null]));
    }); body.push(ul); body.push(h("p", { class: "kwc-hint", text: "« Revenir en arrière » place les anciennes valeurs dans le brouillon : rien n'est publié tant que vous ne publiez pas." })); }
    var closer = modal("Versions publiées", body, [{ label: "Fermer" }]);
  }
  function restoreVersion(id) {
    post("/restaurer", { version: id }).then(function () { toast("Anciennes valeurs placées dans le brouillon : rechargement…", "ok"); setTimeout(function () { window.location.reload(); }, 600); }, function (e) { toast(e.message, "error"); });
  }
  $("#kwc-save").addEventListener("click", saveDraft);
  $("#kwc-publish").addEventListener("click", publish);

  // ---------- Menu « options », panneau, clavier, sortie ----------
  var more = $("#kwc-more"), menu = $("#kwc-moremenu");
  function closeMenu() { menu.hidden = true; more.setAttribute("aria-expanded", "false"); }
  more.addEventListener("click", function () { var open = menu.hidden; menu.hidden = !open; more.setAttribute("aria-expanded", String(open)); if (open) { var f = menu.querySelector("button,a"); if (f) f.focus(); } });
  document.addEventListener("click", function (e) { if (!menu.hidden && !menu.contains(e.target) && e.target !== more && !more.contains(e.target)) closeMenu(); });
  menu.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeMenu(); more.focus(); } if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); var items = $$("[role=menuitem]", menu), i = items.indexOf(document.activeElement); items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus(); } });
  menu.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b) return; closeMenu();
    var act = b.getAttribute("data-act");
    if (act === "refresh") reloadFrame();
    else if (act === "versions") versions();
    else if (act === "discard") discard();
    else if (act === "open-page") window.open(currentPage(), "_blank", "noopener");
    else if (act === "theme-mode") { var dark = document.documentElement.getAttribute("data-kola-theme") !== "dark"; document.documentElement.setAttribute("data-kola-theme", dark ? "dark" : "light"); try { localStorage.setItem("kolaTheme", dark ? "dark" : "light"); } catch (x) { /* préférence non mémorisée */ } $("#kwc-mode-label").textContent = dark ? "sombre" : "clair"; }
  });
  $("#kwc-mode-label").textContent = document.documentElement.getAttribute("data-kola-theme") === "dark" ? "sombre" : "clair";
  function collapse(on) { $("#kwc-main").classList.toggle("is-collapsed", on); $("#kwc-expand").hidden = !on; }
  $("#kwc-collapse").addEventListener("click", function () { collapse(true); $("#kwc-expand").focus(); });
  $("#kwc-expand").addEventListener("click", function () { collapse(false); $("#kwc-panel").focus(); });
  document.addEventListener("keydown", function (e) {
    var mod = e.ctrlKey || e.metaKey; if (!mod) return;
    var k = e.key.toLowerCase(), inText = /^(input|textarea|select)$/i.test(document.activeElement.tagName);
    if (k === "s") { e.preventDefault(); saveDraft(); }
    else if (!inText && k === "z" && !e.shiftKey) { e.preventDefault(); $("#kwc-undo").click(); }
    else if (!inText && (k === "y" || (k === "z" && e.shiftKey))) { e.preventDefault(); $("#kwc-redo").click(); }
  });
  var leaving = false;
  window.addEventListener("beforeunload", function (e) { if (!leaving && dirty()) { e.preventDefault(); e.returnValue = ""; } });
  $("#kwc-close").addEventListener("click", function (e) {
    if (!dirty()) return; e.preventDefault(); var href = this.href;
    modal("Quitter sans enregistrer ?", "Des modifications n'ont pas été enregistrées dans le brouillon.", [
      { label: "Rester" }, { label: "Quitter sans enregistrer", run: function () { leaving = true; location.href = href; } },
      { label: "Enregistrer et quitter", primary: true, run: function () { saveDraft().then(function (ok) { if (ok) { leaving = true; location.href = href; } }); } },
    ]);
  });
  // Un navigateur qui se déconnecte / se reconnecte : on le dit, sans rien perdre
  window.addEventListener("offline", function () { toast("Connexion perdue : vos modifications restent dans cette page.", "error"); });
  window.addEventListener("online", function () { toast("Connexion rétablie.", "ok"); if (dirty()) schedulePreview(); });

  // ---------- Bannières d'état ----------
  (function () {
    var box = $("#kwc-banners");
    function ban(text, kind) { box.appendChild(h("div", { class: "kwc-banner kwc-banner-" + kind, role: "status", text: text })); }
    if (boot.readOnly) ban("Ce site est archivé ou supprimé : le personnalisateur est en lecture seule.", "warn");
    else if (!boot.can.edit) ban("Vous pouvez voir ce site, mais pas le modifier (permission « appearance.styles »).", "warn");
    else if (!boot.can.publish) ban("Vous pouvez enregistrer des brouillons ; la publication est réservée aux administrateurs.", "info");
    if (boot.stale) ban("Un ancien brouillon n'était plus valide et n'a pas été repris : " + boot.stale, "warn");
    if (boot.pendingEngineDraft) ban("Un brouillon de l'Éditeur du site est en cours : publiez-le ou annulez-le d'abord pour pouvoir publier d'ici.", "warn");
  })();

  // ---------- Démarrage ----------
  renderRoot(); setStatus();
  if (boot.previews.length) loadFrame(boot.previews[0].url);
})();
