// Éditeur visuel des pages (Site Web / Tunnels). Le canevas affiche le RENDU RÉEL de la page (même gabarit que la page
// publiée, calculé par le serveur) ; ce script gère la sélection, l'historique (annuler / rétablir), les calques
// (glisser-déposer, renommer, masquer, verrouiller), l'inspecteur, les composants et la sauvegarde automatique du
// brouillon. Aucun HTML venant de l'utilisateur n'est inséré : tout le texte passe par textContent / value.
(function () {
  "use strict";
  var boot = JSON.parse(document.getElementById("pb-boot").textContent);
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var PAGE = boot.page;
  var canWrite = boot.canWrite;
  var TYPES = {};
  boot.types.forEach(function (t) { TYPES[t.type] = t; });
  var LABEL = function (type) { return type === "component" ? "Composant" : (TYPES[type] ? TYPES[type].label : type); };
  var components = boot.components.slice();

  var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
  var newId = function () { var a = new Uint8Array(6); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); };

  // ---------- État ----------
  var content = clone(boot.content);
  content.sections.forEach(function (s) { if (!s.id) s.id = newId(); });
  var sections = function () { return content.sections; };
  var byId = function (id) { return sections().find(function (s) { return s.id === id; }) || null; };
  var indexOf = function (id) { return sections().findIndex(function (s) { return s.id === id; }); };
  var selection = [];
  var revision = PAGE.revision;
  var hasDraft = PAGE.hasDraft;
  var status = PAGE.status;

  // ---------- Petits outils d'interface ----------
  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      (Array.isArray(c) ? c : [c]).forEach(function (x) { if (x !== null && x !== undefined && x !== false) el.appendChild(typeof x === "string" ? document.createTextNode(x) : x); });
    }
    return el;
  }
  function icon(name) {
    var t = document.querySelector('template[data-pb-icon="' + name + '"]');
    return t ? t.content.firstElementChild.cloneNode(true) : document.createTextNode("");
  }
  var toastTimer = null;
  function toast(text, isError) {
    var t = $("[data-pb-toast]");
    t.textContent = text;
    t.classList.toggle("is-error", Boolean(isError));
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, isError ? 6000 : 3200);
  }
  var isLocked = function (s) { return Boolean(s && s.locked); };
  function refuseLocked(list) {
    if (list.some(isLocked)) { toast("Section verrouillée : déverrouillez-la d'abord.", true); return true; }
    return false;
  }

  // ---------- Historique (annuler / rétablir) ----------
  var past = [], future = [], lastKey = null;
  var snapshot = function () { return JSON.stringify({ sections: content.sections, selection: selection }); };
  function restore(snap) {
    var s = JSON.parse(snap);
    content.sections = s.sections;
    selection = s.selection.filter(function (id) { return byId(id); });
  }
  // Une modification : l'état précédent part dans l'historique. Les frappes successives dans un même champ (clé
  // identique) forment UNE seule étape d'annulation.
  function change(fn, opts) {
    opts = opts || {};
    if (!canWrite) return;
    if (!opts.key || opts.key !== lastKey) {
      past.push(snapshot());
      if (past.length > 100) past.shift();
      future = [];
    }
    lastKey = opts.key || null;
    fn();
    afterChange(opts.light);
  }
  function undo() {
    if (!past.length) return;
    future.push(snapshot());
    restore(past.pop());
    lastKey = null;
    afterChange(false);
  }
  function redo() {
    if (!future.length) return;
    past.push(snapshot());
    restore(future.pop());
    lastKey = null;
    afterChange(false);
  }
  // light : saisie dans un champ (l'inspecteur n'est pas redessiné, sinon le curseur serait perdu)
  function afterChange(light) {
    renderLayers();
    if (!light) renderInspector();
    updateHistoryButtons();
    scheduleRender();
    scheduleSave();
  }
  function updateHistoryButtons() {
    $("[data-pb-undo]").disabled = !past.length || !canWrite;
    $("[data-pb-redo]").disabled = !future.length || !canWrite;
  }

  // ---------- Sélection ----------
  function select(id, additive) {
    if (!id) selection = [];
    else if (additive) selection = selection.indexOf(id) >= 0 ? selection.filter(function (x) { return x !== id; }) : selection.concat(id);
    else selection = [id];
    lastKey = null;
    markLayerSelection();
    renderInspector();
    markCanvasSelection();
  }
  // Sélection : les calques sont mis à jour sur place (les redessiner casserait le double-clic de renommage)
  function markLayerSelection() {
    Array.prototype.forEach.call(document.querySelectorAll(".pb-layer[data-id]"), function (li) {
      var on = selection.indexOf(li.dataset.id) >= 0;
      li.classList.toggle("is-selected", on);
      var main = li.querySelector(".pb-layer-main");
      if (main) main.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  var selectedSections = function () { return sections().filter(function (s) { return selection.indexOf(s.id) >= 0; }); };

  // ---------- Opérations sur les sections ----------
  function insertAfterSelection(list) {
    var idx = selection.length ? Math.max.apply(null, selection.map(indexOf)) + 1 : sections().length;
    if (idx < 0) idx = sections().length;
    if (sections().length + list.length > 30) { toast("30 sections au plus par page.", true); return; }
    change(function () {
      list.forEach(function (s, i) { s.id = newId(); content.sections.splice(idx + i, 0, s); });
      selection = list.map(function (s) { return s.id; });
    });
  }
  function addType(type, extra) {
    var t = TYPES[type];
    if (!t || !t.blank && !extra) return;
    insertAfterSelection([Object.assign(clone(t.blank || { type: type }), extra || {})]);
    toast(LABEL(type) + " ajouté.");
  }
  function removeSelected() {
    var list = selectedSections();
    if (!list.length || refuseLocked(list)) return;
    change(function () {
      content.sections = sections().filter(function (s) { return selection.indexOf(s.id) < 0; });
      selection = [];
    });
    toast(list.length > 1 ? list.length + " sections supprimées (Ctrl/⌘ + Z pour annuler)." : "Section supprimée (Ctrl/⌘ + Z pour annuler).");
  }
  function duplicateSelected() {
    var list = selectedSections();
    if (!list.length) return;
    insertAfterSelection(list.map(function (s) { var c = clone(s); delete c.locked; return c; }));
  }
  function moveSelected(delta) {
    var list = selectedSections();
    if (!list.length || refuseLocked(list)) return;
    var idxs = list.map(function (s) { return indexOf(s.id); }).sort(function (a, b) { return a - b; });
    if ((delta < 0 && idxs[0] === 0) || (delta > 0 && idxs[idxs.length - 1] === sections().length - 1)) return;
    change(function () {
      var arr = content.sections;
      (delta < 0 ? idxs : idxs.slice().reverse()).forEach(function (i) { var tmp = arr[i + delta]; arr[i + delta] = arr[i]; arr[i] = tmp; });
    });
  }
  // Déplacer (glisser-déposer) : les sections choisies vont avant l'élément cible (ou à la fin)
  function moveTo(ids, targetId, after) {
    var moving = sections().filter(function (s) { return ids.indexOf(s.id) >= 0; });
    if (!moving.length || refuseLocked(moving)) return;
    change(function () {
      var rest = sections().filter(function (s) { return ids.indexOf(s.id) < 0; });
      var at = targetId ? rest.findIndex(function (s) { return s.id === targetId; }) : rest.length;
      if (at < 0) at = rest.length;
      if (targetId && after) at += 1;
      content.sections = rest.slice(0, at).concat(moving, rest.slice(at));
    });
  }
  function setFlag(ids, flag, value) {
    change(function () { sections().forEach(function (s) { if (ids.indexOf(s.id) >= 0) { if (value) s[flag] = true; else delete s[flag]; } }); });
  }
  var clipboard = null;
  try { clipboard = JSON.parse(localStorage.getItem("pb-clipboard") || "null"); } catch (e) { clipboard = null; }
  function copySelected(cut) {
    var list = selectedSections();
    if (!list.length) return;
    clipboard = list.map(function (s) { var c = clone(s); delete c.id; delete c.locked; return c; });
    try { localStorage.setItem("pb-clipboard", JSON.stringify(clipboard)); } catch (e) { /* copie gardée pour cet onglet seulement */ }
    if (cut) removeSelected();
    else toast(list.length > 1 ? list.length + " sections copiées." : "Section copiée.");
  }
  function paste() {
    if (!clipboard || !clipboard.length) { toast("Rien à coller : copiez d'abord une section.", true); return; }
    insertAfterSelection(clone(clipboard));
  }
  function rename(id, name) {
    change(function () { var s = byId(id); if (!s) return; var n = name.trim().slice(0, 60); if (n) s.name = n; else delete s.name; });
  }

  // ---------- Calques ----------
  var dragIds = null, dragNewType = null;
  function renderLayers() {
    var list = $("[data-pb-layers]");
    list.textContent = "";
    if (!sections().length) { list.appendChild(h("li", { class: "pb-hint", text: "Aucune section : ajoutez-en une depuis l'onglet « Ajouter »." })); return; }
    sections().forEach(function (s, i) {
      var selected = selection.indexOf(s.id) >= 0;
      var li = h("li", { class: "pb-layer" + (selected ? " is-selected" : "") + (s.hidden ? " is-hidden" : "") + (s.id === errorSectionId ? " is-error" : ""), draggable: canWrite && !s.locked ? "true" : null, dataset: { id: s.id } },
        h("span", { class: "pb-grip", "aria-hidden": "true" }, icon("grip")),
        h("button", { type: "button", class: "pb-layer-main", "aria-pressed": selected ? "true" : "false",
          onclick: function (e) { select(s.id, e.shiftKey || e.metaKey || e.ctrlKey); },
          ondblclick: function () { if (canWrite) startRename(li, s); } },
          h("span", { class: "pb-layer-name", text: s.name || (s.type === "hero" ? s.title : s.type === "component" ? componentName(s.componentId) : LABEL(s.type)) || LABEL(s.type) }),
          h("span", { class: "pb-layer-type", text: (i + 1) + ". " + LABEL(s.type) + (s.hideOn && s.hideOn.length ? " · masquée sur " + s.hideOn.map(bpLabel).join(", ") : "") })),
        h("span", { class: "pb-layer-flags" },
          h("button", { type: "button", "aria-pressed": s.hidden ? "true" : "false", title: s.hidden ? "Afficher" : "Masquer", "aria-label": (s.hidden ? "Afficher" : "Masquer") + " la section " + (i + 1), disabled: !canWrite, onclick: function () { setFlag([s.id], "hidden", !s.hidden); } }, icon(s.hidden ? "eyeOff" : "eye")),
          h("button", { type: "button", "aria-pressed": s.locked ? "true" : "false", title: s.locked ? "Déverrouiller" : "Verrouiller", "aria-label": (s.locked ? "Déverrouiller" : "Verrouiller") + " la section " + (i + 1), disabled: !canWrite, onclick: function () { setFlag([s.id], "locked", !s.locked); } }, icon("lock"))));
      li.addEventListener("dragstart", function (e) {
        dragIds = selection.indexOf(s.id) >= 0 ? selection.slice() : [s.id];
        dragNewType = null;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", "section");
      });
      li.addEventListener("dragover", function (e) {
        if (!dragIds && !dragNewType) return;
        e.preventDefault();
        var after = e.offsetY > li.offsetHeight / 2;
        li.classList.toggle("is-drop-before", !after);
        li.classList.toggle("is-drop-after", after);
      });
      li.addEventListener("dragleave", function () { li.classList.remove("is-drop-before", "is-drop-after"); });
      li.addEventListener("drop", function (e) {
        e.preventDefault();
        var after = li.classList.contains("is-drop-after");
        li.classList.remove("is-drop-before", "is-drop-after");
        dropAt(s.id, after);
      });
      list.appendChild(li);
    });
  }
  function dropAt(targetId, after) {
    if (dragIds) moveTo(dragIds, targetId, after);
    else if (dragNewType) {
      var t = TYPES[dragNewType];
      if (t && t.blank) {
        selection = targetId ? [targetId] : [];
        if (targetId && !after) { var i = indexOf(targetId); selection = i > 0 ? [sections()[i - 1].id] : []; if (i === 0) { insertAtStart(clone(t.blank)); dragNewType = null; return; } }
        addType(dragNewType);
      }
    }
    dragIds = null;
    dragNewType = null;
  }
  function insertAtStart(s) {
    change(function () { s.id = newId(); content.sections.unshift(s); selection = [s.id]; });
  }
  $("[data-pb-layers]").addEventListener("dragover", function (e) { if (dragIds || dragNewType) e.preventDefault(); });
  $("[data-pb-layers]").addEventListener("drop", function (e) { if (e.target === e.currentTarget) { e.preventDefault(); dropAt(null, true); } });
  document.addEventListener("dragend", function () { dragIds = null; dragNewType = null; });
  function startRename(li, s) {
    var main = li.querySelector(".pb-layer-main");
    var input = h("input", { type: "text", class: "pb-layer-rename", value: s.name || "", maxlength: "60", "aria-label": "Nom de la section", placeholder: LABEL(s.type) });
    main.replaceWith(input);
    input.focus();
    var done = false;
    var finish = function (save) { if (done) return; done = true; if (save) rename(s.id, input.value); else renderLayers(); };
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") finish(true); if (e.key === "Escape") finish(false); });
    input.addEventListener("blur", function () { finish(true); });
  }
  var bpLabel = function (b) { return { desktop: "ordinateur", tablet: "tablette", mobile: "mobile" }[b] || b; };
  var componentName = function (id) { var c = components.find(function (x) { return x.id === id; }); return c ? c.name : "Composant"; };

  // ---------- Ajouter ----------
  function renderAdd() {
    var list = $("[data-pb-add]");
    list.textContent = "";
    boot.types.forEach(function (t) {
      var disabled = !canWrite || Boolean(t.unavailable);
      var btn = h("button", { type: "button", disabled: disabled, draggable: disabled || !t.blank ? null : "true", onclick: function () {
        if (t.asks) { var f = $("[data-pb-video-form]"); f.hidden = false; $("#pb-video-url").focus(); return; }
        addType(t.type);
      } }, t.label, t.unavailable ? h("small", { text: t.unavailable }) : null);
      btn.addEventListener("dragstart", function (e) { dragNewType = t.type; dragIds = null; e.dataTransfer.setData("text/plain", "new"); });
      list.appendChild(h("li", {}, btn));
    });
  }
  $("[data-pb-video-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    addType("video", { type: "video", url: $("#pb-video-url").value.trim(), title: $("#pb-video-title").value.trim(), caption: "" });
    e.currentTarget.reset();
    e.currentTarget.hidden = true;
  });
  $("[data-pb-video-cancel]").addEventListener("click", function () { $("[data-pb-video-form]").hidden = true; });

  // ---------- Composants ----------
  function fetchComponent(id) {
    return api("GET", "/marketing/site-web/composants/" + id + ".json").then(function (r) { return r.component; });
  }
  function renderComponents() {
    var list = $("[data-pb-components]");
    list.textContent = "";
    if (!components.length) { list.appendChild(h("li", { class: "pb-hint", text: "Aucun composant. Sélectionnez une section, puis « Enregistrer comme composant »." })); return; }
    components.forEach(function (c) {
      list.appendChild(h("li", {},
        h("strong", { text: c.name }),
        h("span", { class: "pb-hint", text: LABEL(c.type) + (c.global ? " · tous les sites" : " · ce site") }),
        canWrite ? h("span", { class: "pb-row" },
          h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { insertAfterSelection([{ type: "component", componentId: c.id }]); } }, "Synchronisé"),
          h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function () { fetchComponent(c.id).then(function (comp) { insertAfterSelection([clone(comp.section)]); }, apiFail); } }, "Copie"),
          h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function () {
            if (!window.confirm("Supprimer le composant « " + c.name + " » ? (Refusé s'il est utilisé par une page.)")) return;
            api("POST", "/marketing/site-web/composants/" + c.id + "/supprimer", {}).then(function () { components = components.filter(function (x) { return x.id !== c.id; }); renderComponents(); toast("Composant supprimé."); }, apiFail);
          } }, "Supprimer")) : null));
    });
  }
  function saveAsComponent(s, name, global) {
    var section = clone(s);
    delete section.id; delete section.locked; delete section.hidden;
    return api("POST", "/marketing/site-web/composants", { name: name, section: section, global: global, siteId: PAGE.siteId }).then(function (r) {
      components.push(r.component);
      renderComponents();
      toast("Composant « " + r.component.name + " » enregistré.");
      return r.component;
    }, apiFail);
  }

  // ---------- Inspecteur ----------
  var STYLE = {
    padding: [["", "Par défaut"], ["none", "Aucun"], ["sm", "Petit"], ["md", "Moyen"], ["lg", "Grand"], ["xl", "Très grand"]],
    background: [["default", "Aucun"], ["surface", "Surface"], ["primary", "Couleur principale"], ["accent", "Accent"], ["dark", "Foncé"]],
    align: [["", "Par défaut"], ["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]],
    width: [["normal", "Normale"], ["narrow", "Étroite"], ["wide", "Large"], ["full", "Pleine largeur"]],
  };
  var STYLE_LABEL = { padding: "Espacement vertical", background: "Fond", align: "Alignement du texte", width: "Largeur" };
  var F = {
    hero: [["title", "text", "Titre", 150], ["subtitle", "textarea", "Sous-titre", 300], ["image", "image", "Image"], ["imageAlt", "text", "Description de l'image", 200], ["buttonLabel", "text", "Texte du bouton", 60], ["buttonUrl", "text", "Adresse du bouton (/catalogue ou https://…)"]],
    text: [["markdown", "markdown", "Texte"]],
    image: [["src", "image", "Image"], ["alt", "text", "Description de l'image (obligatoire)", 200], ["caption", "text", "Légende", 200], ["link", "text", "Lien au clic (facultatif)"]],
    list: [["title", "text", "Titre", 150], ["items", "lines", "Points (un par ligne)"]],
    course: [["courseId", "course", "Formation"], ["cta", "text", "Texte du bouton", 60]],
    button: [["label", "text", "Texte", 60], ["url", "text", "Adresse (/catalogue ou https://…)"], ["align", "select", "Position", [["center", "Centré"], ["left", "À gauche"]]]],
    quote: [["text", "textarea", "Citation", 600], ["author", "text", "Auteur", 120]],
    form: [["heading", "text", "Titre", 150], ["intro", "textarea", "Introduction", 400]],
    features: [["title", "text", "Titre", 150], ["intro", "textarea", "Introduction", 400], ["columns", "select", "Colonnes sur ordinateur", [[2, "2"], [3, "3"], [4, "4"]]], ["items", "repeat", "Cartes", { max: 12, blank: { title: "Nouvelle carte", text: "" }, fields: [["title", "text", "Titre", 80], ["text", "textarea", "Texte", 400]] }]],
    faq: [["title", "text", "Titre", 150], ["items", "repeat", "Questions", { max: 20, blank: { q: "Nouvelle question ?", a: "La réponse." }, fields: [["q", "text", "Question", 200], ["a", "textarea", "Réponse (gras, liens…)", 2000]] }]],
    cta: [["title", "text", "Titre", 150], ["text", "textarea", "Texte", 400], ["buttonLabel", "text", "Texte du bouton", 60], ["buttonUrl", "text", "Adresse du bouton"]],
    video: [["url", "text", "Adresse (YouTube, Vimeo ou fichier https://)"], ["title", "text", "Titre (lu par les lecteurs d'écran)", 150], ["caption", "text", "Légende", 200]],
    testimonials: [["title", "text", "Titre", 150], ["items", "repeat", "Témoignages", { max: 12, blank: { text: "Nouveau témoignage.", author: "", role: "" }, fields: [["text", "textarea", "Témoignage", 600], ["author", "text", "Auteur", 120], ["role", "text", "Fonction", 120]] }]],
    divider: [["line", "checkbox", "Afficher une ligne"], ["size", "select", "Hauteur", [["sm", "Petite"], ["md", "Moyenne"], ["lg", "Grande"]]]],
  };
  var fieldCount = 0;
  // Un champ lié à target[key] ; onEdit appelé à chaque saisie (étape d'annulation regroupée par champ)
  function field(target, def, onEdit, disabled, keyPrefix) {
    var key = def[0], kind = def[1], label = def[2], extra = def[3];
    var id = "pb-f-" + (++fieldCount);
    var editKey = keyPrefix + ":" + key;
    var set = function (v, light) { onEdit(function () { target[key] = v; }, { key: editKey, light: light !== false }); };
    var wrap = h("div", { class: "pb-field" });
    var input;
    if (kind === "checkbox") {
      input = h("input", { type: "checkbox", id: id, disabled: disabled });
      input.checked = target[key] !== false;
      input.addEventListener("change", function () { set(input.checked); });
      wrap.appendChild(h("label", { for: id }, input, " " + label));
      return wrap;
    }
    wrap.appendChild(h("label", { for: id, text: label }));
    if (kind === "textarea" || kind === "markdown" || kind === "lines") {
      input = h("textarea", { id: id, rows: kind === "markdown" ? "10" : "4", maxlength: typeof extra === "number" ? String(extra) : null, disabled: disabled });
      input.value = kind === "lines" ? (target[key] || []).join("\n") : (target[key] || "");
      input.addEventListener("input", function () { set(kind === "lines" ? input.value.split("\n") : input.value); });
      if (kind === "markdown") wrap.appendChild(h("p", { class: "pb-hint", text: "**gras**, *italique*, ## intertitre, listes avec « - », [lien](https://…)." }));
    } else if (kind === "select" || kind === "course") {
      var options = kind === "course" ? boot.courses.map(function (c) { return [c.id, c.title]; }) : extra;
      input = h("select", { id: id, disabled: disabled }, options.map(function (o) { return h("option", { value: String(o[0]), text: o[1] }); }));
      input.value = String(target[key]);
      input.addEventListener("change", function () { var v = input.value; set(typeof options[0][0] === "number" ? Number(v) : v, false); });
    } else if (kind === "image") {
      var lib = h("select", { id: id, disabled: disabled }, [h("option", { value: "", text: "Médiathèque : aucune / adresse ci-dessous" })].concat(boot.images.map(function (m) { return h("option", { value: m.path, text: m.name }); })));
      var url = h("input", { type: "url", "aria-label": label + " : adresse https://", placeholder: "https://…", disabled: disabled });
      var cur = target[key] || "";
      lib.value = boot.images.some(function (m) { return m.path === cur; }) ? cur : "";
      url.value = /^https:/.test(cur) ? cur : "";
      lib.addEventListener("change", function () { url.value = ""; set(lib.value, false); });
      url.addEventListener("input", function () { lib.value = ""; set(url.value.trim()); });
      wrap.appendChild(lib);
      wrap.appendChild(url);
      return wrap;
    } else {
      input = h("input", { type: "text", id: id, maxlength: typeof extra === "number" ? String(extra) : null, disabled: disabled });
      input.value = target[key] || "";
      input.addEventListener("input", function () { set(input.value); });
    }
    wrap.appendChild(input);
    return wrap;
  }
  function repeatField(s, def, disabled) {
    var key = def[0], label = def[2], cfg = def[3];
    var fs = h("fieldset", { class: "pb-group" }, h("legend", { text: label }));
    var box = h("div", { class: "pb-repeat" });
    (s[key] || []).forEach(function (item, i) {
      var row = h("div", { class: "pb-repeat-item" },
        h("div", { class: "pb-row" }, h("span", { text: label.replace(/s$/, "") + " " + (i + 1) }),
          h("span", { class: "pb-buttons" },
            h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || i === 0, "aria-label": "Monter l'élément " + (i + 1), onclick: function () { change(function () { var a = s[key]; var t = a[i - 1]; a[i - 1] = a[i]; a[i] = t; }); } }, "↑"),
            h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || (s[key] || []).length < 2, "aria-label": "Retirer l'élément " + (i + 1), onclick: function () { change(function () { s[key].splice(i, 1); }); } }, "Retirer"))));
      cfg.fields.forEach(function (fd) { row.appendChild(field(item, fd, change, disabled, s.id + ":" + key + ":" + i)); });
      box.appendChild(row);
    });
    fs.appendChild(box);
    if ((s[key] || []).length < cfg.max) fs.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, onclick: function () { change(function () { s[key] = (s[key] || []).concat(clone(cfg.blank)); }); } }, "Ajouter"));
    return fs;
  }
  function styleGroup(list, disabled) {
    var fs = h("fieldset", { class: "pb-group" }, h("legend", { text: "Mise en page" }));
    Object.keys(STYLE).forEach(function (k) {
      var id = "pb-st-" + k;
      var values = list.map(function (s) { return (s.style && s.style[k]) || ""; });
      var same = values.every(function (v) { return v === values[0]; });
      var opts = STYLE[k].map(function (o) { return h("option", { value: o[0], text: o[1] }); });
      if (!same) opts.unshift(h("option", { value: "__mixed", text: "Plusieurs valeurs" }));
      var sel = h("select", { id: id, disabled: disabled }, opts);
      sel.value = same ? (values[0] || STYLE[k][0][0]) : "__mixed";
      sel.addEventListener("change", function () {
        if (sel.value === "__mixed") return;
        change(function () { list.forEach(function (s) { s.style = Object.assign({}, s.style); if (!sel.value || sel.value === "default" || sel.value === "normal") delete s.style[k]; else s.style[k] = sel.value; if (!Object.keys(s.style).length) delete s.style; }); });
      });
      fs.appendChild(h("div", { class: "pb-field" }, h("label", { for: id, text: STYLE_LABEL[k] }), sel));
    });
    return fs;
  }
  function visibilityGroup(s, disabled) {
    var fs = h("fieldset", { class: "pb-group" }, h("legend", { text: "Affichage" }));
    var checks = h("div", { class: "pb-checks" });
    ["desktop", "tablet", "mobile"].forEach(function (b) {
      var cb = h("input", { type: "checkbox", disabled: disabled });
      cb.checked = !(s.hideOn || []).includes(b);
      cb.addEventListener("change", function () {
        var next = ["desktop", "tablet", "mobile"].filter(function (x) { return x === b ? !cb.checked : (s.hideOn || []).includes(x); });
        if (next.length === 3) { cb.checked = true; toast("Une section doit rester visible sur au moins un écran (sinon : « Masquer »).", true); return; }
        change(function () { if (next.length) s.hideOn = next; else delete s.hideOn; });
      });
      checks.appendChild(h("label", {}, cb, " " + { desktop: "Ordinateur", tablet: "Tablette", mobile: "Mobile" }[b]));
    });
    fs.appendChild(h("p", { class: "pb-hint", text: "Écrans où la section s'affiche :" }));
    fs.appendChild(checks);
    return fs;
  }
  function actionsGroup(list) {
    var one = list.length === 1 ? list[0] : null;
    var locked = list.some(isLocked);
    var fs = h("fieldset", { class: "pb-group" }, h("legend", { text: "Actions" }));
    var b = function (label, fn, opts) { return h("button", Object.assign({ type: "button", class: "btn btn-outline btn-sm", onclick: fn }, opts || {}), label); };
    fs.appendChild(h("div", { class: "pb-buttons" },
      b("Monter", function () { moveSelected(-1); }, { disabled: !canWrite || locked }),
      b("Descendre", function () { moveSelected(1); }, { disabled: !canWrite || locked }),
      b("Dupliquer", duplicateSelected, { disabled: !canWrite }),
      b("Copier", function () { copySelected(false); }),
      b(list.some(function (s) { return s.hidden; }) ? "Afficher" : "Masquer", function () { setFlag(selection.slice(), "hidden", !list.some(function (s) { return s.hidden; })); }, { disabled: !canWrite }),
      b(locked ? "Déverrouiller" : "Verrouiller", function () { setFlag(selection.slice(), "locked", !locked); }, { disabled: !canWrite }),
      b("Supprimer", removeSelected, { class: "btn btn-danger btn-sm", disabled: !canWrite || locked })));
    if (one && canWrite && one.type !== "component") {
      var form = h("form", { class: "pb-field" });
      var nameId = "pb-comp-name";
      var nameInput = h("input", { type: "text", id: nameId, maxlength: "80", required: true, placeholder: "Nom du composant" });
      var global = h("input", { type: "checkbox" });
      form.appendChild(h("label", { for: nameId, text: "Enregistrer comme composant réutilisable" }));
      form.appendChild(nameInput);
      if (PAGE.siteId) form.appendChild(h("label", { class: "pb-checks" }, global, " Utilisable par tous les sites"));
      form.appendChild(h("button", { type: "submit", class: "btn btn-outline btn-sm" }, "Enregistrer le composant"));
      form.addEventListener("submit", function (e) { e.preventDefault(); saveAsComponent(one, nameInput.value, !PAGE.siteId || global.checked).then(function () { nameInput.value = ""; }); });
      fs.appendChild(form);
    }
    return fs;
  }
  // Composant synchronisé : son contenu se modifie ici, pour TOUTES les pages qui l'affichent
  var compSaveTimer = null;
  function componentInspector(box, s) {
    box.appendChild(h("p", { class: "pb-note", text: "Composant synchronisé « " + componentName(s.componentId) + " » : le modifier ici le modifie sur toutes les pages qui l'utilisent (enregistré automatiquement ; non concerné par « Annuler »)." }));
    var holder = h("div", {}, h("p", { class: "pb-hint", text: "Chargement du composant…" }));
    box.appendChild(holder);
    fetchComponent(s.componentId).then(function (comp) {
      holder.textContent = "";
      var sec = comp.section;
      var editor = function (fn) {
        fn();
        clearTimeout(compSaveTimer);
        compSaveTimer = setTimeout(function () {
          api("POST", "/marketing/site-web/composants/" + comp.id, { section: sec }).then(function () { toast("Composant enregistré (toutes les pages)."); scheduleRender(); }, apiFail);
        }, 800);
      };
      (F[sec.type] || []).forEach(function (fd) { holder.appendChild(fd[1] === "repeat" ? h("p", { class: "pb-hint", text: "Liste modifiable après détachement." }) : field(sec, fd, editor, !canWrite || isLocked(s), "comp" + comp.id)); });
      if (canWrite) holder.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () {
        change(function () { var i = indexOf(s.id); var copy = Object.assign(clone(sec), { id: s.id }); if (s.style) copy.style = s.style; if (s.hideOn) copy.hideOn = s.hideOn; if (s.name) copy.name = s.name; content.sections[i] = copy; });
        toast("Composant détaché : cette section est maintenant une copie indépendante.");
      } }, "Détacher (copie indépendante)"));
    }, function (err) { holder.textContent = ""; holder.appendChild(h("p", { class: "pb-note is-warn", text: err.message })); });
  }
  function renderInspector() {
    var box = $("[data-pb-inspector]");
    box.textContent = "";
    fieldCount = 0;
    var list = selectedSections();
    if (!list.length) {
      box.appendChild(h("div", { class: "pb-insp-head" }, h("div", {}, h("h2", { text: "Aucune section sélectionnée" }), h("p", { text: "Cliquez une section dans l'aperçu ou dans les calques." }))));
      box.appendChild(h("p", { class: "pb-note", text: "Titre, description, SEO, formulaire d'inscription et adresse de la page : dans les réglages de la page." }));
      box.appendChild(h("a", { class: "btn btn-outline btn-sm", href: "/marketing/pages/" + PAGE.id }, "Réglages de la page"));
      return;
    }
    if (list.length > 1) {
      box.appendChild(h("div", { class: "pb-insp-head" }, h("div", {}, h("h2", { text: list.length + " sections sélectionnées" }), h("p", { text: "Les réglages ci-dessous s'appliquent à toutes." }))));
      if (canWrite) box.appendChild(styleGroup(list, list.some(isLocked)));
      box.appendChild(actionsGroup(list));
      return;
    }
    var s = list[0];
    var locked = !canWrite || isLocked(s);
    box.appendChild(h("div", { class: "pb-insp-head" }, h("div", {}, h("h2", { text: s.name || LABEL(s.type) }), h("p", { text: LABEL(s.type) + " · section " + (indexOf(s.id) + 1) }))));
    if (isLocked(s)) box.appendChild(h("p", { class: "pb-note is-warn", text: "Section verrouillée : déverrouillez-la pour la modifier, la déplacer ou la supprimer." }));
    if (s.type === "component") componentInspector(box, s);
    else {
      var contentFs = h("fieldset", { class: "pb-group" }, h("legend", { text: "Contenu" }));
      if (s.type === "form") contentFs.appendChild(h("p", { class: "pb-note", text: PAGE.formId ? "Champs, consentement et liste viennent du formulaire choisi dans les réglages de la page." : "Aucun formulaire choisi : la section ne s'affichera pas en ligne. Choisissez-le dans les réglages de la page." }));
      (F[s.type] || []).forEach(function (fd) { contentFs.appendChild(fd[1] === "repeat" ? repeatField(s, fd, locked) : field(s, fd, change, locked, s.id)); });
      box.appendChild(contentFs);
    }
    if (canWrite) box.appendChild(styleGroup([s], locked));
    if (canWrite) box.appendChild(visibilityGroup(s, locked));
    box.appendChild(actionsGroup([s]));
  }

  // ---------- Requêtes ----------
  function api(method, url, body) {
    return fetch(url, { method: method, credentials: "same-origin", headers: Object.assign({ Accept: "application/json" }, body ? { "Content-Type": "application/json" } : {}), body: body ? JSON.stringify(body) : undefined })
      .then(function (r) {
        return r.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
          if (!r.ok) { var err = new Error((data && data.error && data.error.message) || "Erreur du serveur (" + r.status + ")."); err.status = r.status; err.code = data && data.error && data.error.code; throw err; }
          return data;
        });
      });
  }
  function apiFail(err) { toast(err.message || "La requête a échoué.", true); }
  var payload = function () { return { sections: content.sections, title: content.title, description: content.description, theme: content.theme, seo: content.seo }; };
  // « Section 3 (bandeau) : … » → identifiant de la section 3 (mise en évidence dans les calques)
  var errorSectionId = null;
  function sectionFromError(message) {
    var m = /Section (\d+)/.exec(message || "");
    return m && sections()[Number(m[1]) - 1] ? sections()[Number(m[1]) - 1].id : null;
  }

  // ---------- Canevas (rendu réel) ----------
  var frame = $("[data-pb-frame]");
  var renderTimer = null, renderSeq = 0;
  function scheduleRender() { clearTimeout(renderTimer); renderTimer = setTimeout(renderCanvas, 250); }
  function renderCanvas() {
    var seq = ++renderSeq;
    fetch("/marketing/pages/" + PAGE.id + "/rendu", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: payload() }) })
      .then(function (r) { return r.text().then(function (text) { return { ok: r.ok, text: text }; }); })
      .then(function (res) {
        if (seq !== renderSeq) return; // une modification plus récente est déjà en cours d'affichage
        var errBox = $("[data-pb-render-error]");
        if (!res.ok) {
          var msg = "Aperçu non mis à jour.";
          try { msg = JSON.parse(res.text).error.message; } catch (e) { /* réponse non JSON : message générique */ }
          errBox.textContent = msg + " Corrigez ce point : l'aperçu et l'enregistrement reprendront.";
          errBox.hidden = false;
          errorSectionId = sectionFromError(msg);
          renderLayers();
          return;
        }
        errBox.hidden = true;
        if (errorSectionId) { errorSectionId = null; renderLayers(); }
        var y = 0;
        try { y = frame.contentWindow.scrollY; } catch (e) { y = 0; }
        frame.onload = function () { setupCanvas(y); };
        frame.srcdoc = res.text;
      }, function () { var errBox = $("[data-pb-render-error]"); errBox.textContent = "Aperçu indisponible (connexion au serveur interrompue)."; errBox.hidden = false; });
  }
  function setupCanvas(y) {
    var doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    doc.body.classList.add("lp-builder");
    frame.contentWindow.scrollTo(0, y);
    doc.addEventListener("click", function (e) {
      var block = e.target.closest("[data-section-id]");
      e.preventDefault();
      select(block ? block.dataset.sectionId : null, e.shiftKey || e.metaKey || e.ctrlKey);
    });
    doc.addEventListener("keydown", onKey);
    markCanvasSelection();
  }
  function markCanvasSelection() {
    var doc = frame.contentDocument;
    if (!doc) return;
    Array.prototype.forEach.call(doc.querySelectorAll("[data-section-id]"), function (el) { el.classList.toggle("is-selected", selection.indexOf(el.dataset.sectionId) >= 0); });
    var first = selection.length ? doc.querySelector('[data-section-id="' + selection[0] + '"]') : null;
    if (first) { var r = first.getBoundingClientRect(); if (r.top < 0 || r.top > frame.clientHeight - 40) first.scrollIntoView({ block: "center", behavior: "smooth" }); }
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-device]"), function (btn) {
    if (btn.tagName !== "BUTTON") return;
    btn.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".pb-devices button"), function (b) { b.setAttribute("aria-checked", b === btn ? "true" : "false"); });
      $("[data-pb-frame-wrap]").dataset.device = btn.dataset.device;
    });
  });

  // ---------- Sauvegarde automatique ----------
  var saveTimer = null, saving = false, dirty = false, blocked = false, retry = 0;
  var saveEl = $("[data-pb-save]");
  function setSave(text, cls) { saveEl.textContent = text; saveEl.className = "pb-save" + (cls ? " " + cls : ""); }
  function scheduleSave() {
    if (!canWrite) return;
    dirty = true;
    if (!blocked) setSave("Modifications non enregistrées");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 1000);
  }
  function backup() { try { localStorage.setItem("pb-backup-" + PAGE.id, JSON.stringify({ at: Date.now(), content: payload() })); } catch (e) { /* stockage indisponible */ } }
  function save() {
    if (!dirty || blocked) return Promise.resolve();
    if (saving) { clearTimeout(saveTimer); saveTimer = setTimeout(save, 500); return Promise.resolve(); }
    saving = true;
    dirty = false;
    setSave("Enregistrement…");
    return api("PUT", "/marketing/pages/" + PAGE.id + "/brouillon", { content: payload(), revision: revision }).then(function (r) {
      saving = false;
      retry = 0;
      revision = r.revision;
      hasDraft = true;
      updateStatus();
      if (!dirty) setSave("Enregistré à " + new Date(r.savedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), "is-ok");
      try { localStorage.removeItem("pb-backup-" + PAGE.id); } catch (e) { /* rien */ }
    }, function (err) {
      saving = false;
      dirty = true;
      backup();
      if (err.status === 409) { blocked = true; setSave("Non enregistré : page modifiée ailleurs", "is-error"); toast(err.message + " Une copie de votre travail est gardée dans ce navigateur.", true); return; }
      if (err.status === 422) { setSave("Non enregistré : " + err.message, "is-error"); errorSectionId = sectionFromError(err.message); renderLayers(); return; }
      if (err.status === 403) { blocked = true; setSave("Non enregistré : droits insuffisants", "is-error"); return; }
      retry = Math.min(retry + 1, 5);
      setSave("Erreur d'enregistrement : nouvel essai dans " + (retry * 5) + " s", "is-error");
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, retry * 5000);
    });
  }
  window.addEventListener("beforeunload", function (e) { if (dirty || saving) { backup(); e.preventDefault(); e.returnValue = ""; } });

  // ---------- Statut, publication ----------
  function updateStatus() {
    var el = $("[data-pb-status]");
    var live = status === "published";
    el.textContent = live ? (hasDraft ? "En ligne · modifications non publiées" : "En ligne") : status === "unpublished" ? "Hors ligne" : "Brouillon";
    el.classList.toggle("is-live", live && !hasDraft);
    var pub = $("[data-pb-publish]");
    pub.hidden = !canWrite || (live && !hasDraft);
    pub.textContent = live ? "Publier les modifications" : "Publier";
  }
  $("[data-pb-publish]").addEventListener("click", function () {
    var btn = this;
    btn.disabled = true;
    clearTimeout(saveTimer);
    (dirty ? save() : Promise.resolve()).then(function () {
      if (dirty || blocked) { btn.disabled = false; toast("Enregistrez d'abord vos modifications (voir le message en haut).", true); return; }
      return api("POST", "/marketing/pages/" + PAGE.id + "/publier.json", {}).then(function (r) {
        status = "published";
        hasDraft = false;
        revision = r.revision;
        updateStatus();
        toast("Page en ligne (version " + r.version + ") : " + r.url);
      }, apiFail);
    }).then(function () { btn.disabled = false; });
  });

  // ---------- Onglets, aide, boutons ----------
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".pb-tabs [role=tab]"));
  function openTab(tab) {
    tabs.forEach(function (t) { var on = t === tab; t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1; document.getElementById(t.getAttribute("aria-controls")).hidden = !on; });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { openTab(t); });
    t.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      openTab(next);
      next.focus();
    });
  });
  $("[data-pb-undo]").addEventListener("click", undo);
  $("[data-pb-redo]").addEventListener("click", redo);
  $("[data-pb-help]").addEventListener("click", function () { $("[data-pb-help-dialog]").showModal(); });

  // ---------- Raccourcis clavier ----------
  function onKey(e) {
    var t = e.target;
    var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    var mod = e.metaKey || e.ctrlKey;
    var k = e.key.toLowerCase();
    if (mod && k === "s") { e.preventDefault(); clearTimeout(saveTimer); save(); return; }
    if (typing) return; // dans un champ : annuler / copier natifs du champ
    if (mod && k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && k === "y") { e.preventDefault(); redo(); return; }
    if (mod && k === "a") { e.preventDefault(); selection = sections().map(function (s) { return s.id; }); markLayerSelection(); renderInspector(); markCanvasSelection(); return; }
    if (!canWrite && !(mod && k === "c")) return;
    if (mod && k === "c") { e.preventDefault(); copySelected(false); return; }
    if (mod && k === "x") { e.preventDefault(); copySelected(true); return; }
    if (mod && k === "v") { e.preventDefault(); paste(); return; }
    if (mod && k === "d") { e.preventDefault(); duplicateSelected(); return; }
    if ((e.key === "Delete" || e.key === "Backspace") && selection.length) { e.preventDefault(); removeSelected(); return; }
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); moveSelected(e.key === "ArrowUp" ? -1 : 1); return; }
    if (e.key === "Escape" && selection.length) { select(null); }
  }
  document.addEventListener("keydown", onKey);

  // ---------- Démarrage ----------
  (function offerBackup() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem("pb-backup-" + PAGE.id) || "null"); } catch (e) { raw = null; }
    if (!raw || !raw.content || !canWrite) return;
    if (window.confirm("Une copie non enregistrée de cette page (" + new Date(raw.at).toLocaleString("fr-FR") + ") est gardée dans ce navigateur. La reprendre ?")) {
      change(function () { content.sections = raw.content.sections || content.sections; content.sections.forEach(function (s) { if (!s.id) s.id = newId(); }); });
    } else {
      try { localStorage.removeItem("pb-backup-" + PAGE.id); } catch (e) { /* rien */ }
    }
  })();
  if (!canWrite) setSave("Lecture seule");
  updateStatus();
  renderLayers();
  renderAdd();
  renderComponents();
  renderInspector();
  updateHistoryButtons();
  renderCanvas();
})();
