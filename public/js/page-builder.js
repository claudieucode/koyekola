// Page Builder KOLAKISA (Site Web / Tunnels). Le canevas affiche le RENDU RÉEL de la page (même gabarit que la page
// publiée, calculé par le serveur à chaque modification) ; ce script gère le modèle (sections et éléments imbriqués),
// la sélection synchronisée canevas ↔ calques, le glisser-déposer, l'édition directe des textes, l'inspecteur (styles
// par écran et par état), la barre contextuelle, l'historique, la médiathèque, les composants, les blocs, l'aperçu, la
// palette de commandes et la sauvegarde automatique du brouillon. Le serveur valide chaque valeur : rien n'est affiché
// qui ne soit enregistré tel quel. Aucun HTML venant de l'utilisateur n'est inséré dans l'interface de l'éditeur
// (textContent / value) ; le texte riche est assaini par le serveur avant d'apparaître dans la page.
(function () {
  "use strict";
  var boot = JSON.parse(document.getElementById("pb-boot").textContent);
  var SPEC = boot.spec;
  var PAGE = boot.page;
  var canWrite = boot.canWrite;
  var NT = {}; SPEC.types.forEach(function (t) { NT[t.type] = t; });
  var LEGACY = {}; boot.types.forEach(function (t) { LEGACY[t.type] = t; });
  var SP = {}; SPEC.styleProps.forEach(function (p) { SP[p.key] = p; });
  var BPS = SPEC.breakpoints.map(function (b) { return b.key; });
  var bpLabel = function (k) { return SPEC.breakpoints.find(function (b) { return b.key === k; }).label; };
  var components = boot.components.slice();

  // ---------- Outils ----------
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
  var newId = function () { var a = new Uint8Array(6); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("pb:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("pb:" + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
  };
  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") el.textContent = v;
      else if (k === "value") el.value = v;
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
    return t ? t.content.firstElementChild.cloneNode(true) : h("span", { "aria-hidden": "true" });
  }
  var toastTimer = null;
  function toast(text, isError) {
    var t = $("[data-pb-toast]");
    t.textContent = text;
    t.classList.toggle("is-error", Boolean(isError));
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, isError ? 6500 : 3200);
  }
  function api(method, url, body, isForm) {
    var opts = { method: method, credentials: "same-origin", headers: { Accept: "application/json" } };
    if (body && isForm) opts.body = body;
    else if (body) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    return fetch(url, opts).then(function (r) {
      return r.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
        if (!r.ok) {
          var msg = data && data.error ? (typeof data.error === "string" ? data.error : data.error.message) : "Erreur du serveur (" + r.status + ").";
          var err = new Error(msg); err.status = r.status; err.code = data && data.error && data.error.code; throw err;
        }
        return data;
      });
    });
  }
  function apiFail(err) { toast(err.message || "La requête a échoué.", true); }

  // ---------- Modèle : sections (racine) et éléments imbriqués ----------
  var content = clone(boot.content);
  var CONTAINERS = SPEC.types.filter(function (t) { return t.container; }).map(function (t) { return t.type; });
  // Section ou élément ? Certaines sections prêtes portent le nom d'un élément (texte, image, liste, bouton…) : une
  // section se reconnaît à sa place (racine de la page) ou à sa marque (section pas encore placée, copiée, déplacée)
  var SECTION_MARK = new WeakSet();
  var markSection = function (it) { if (it && typeof it === "object") SECTION_MARK.add(it); return it; };
  var isNode = function (it) { return Boolean(it && NT[it.type] && !it.section && !SECTION_MARK.has(it) && (!content || content.sections.indexOf(it) < 0)); };
  var kidsOf = function (it) { return it && (it.type === "layout" || CONTAINERS.indexOf(it.type) >= 0) ? (it.children || (it.children = [])) : null; };
  function ensureIds(list) {
    (list || []).forEach(function (it) {
      if (!it.id) it.id = newId();
      var k = kidsOf(it);
      if (k) ensureIds(k);
    });
  }
  function reId(it) { it.id = newId(); delete it.locked; var k = kidsOf(it); if (k) k.forEach(reId); return it; }
  ensureIds(content.sections);
  // Recherche d'un élément : { item, list, index, parent (null = racine), depth, ancestors }
  function locate(id, list, parent, depth, ancestors) {
    list = list || content.sections; depth = depth || 0; ancestors = ancestors || [];
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      if (it.id === id) return { item: it, list: list, index: i, parent: parent || null, depth: depth, ancestors: ancestors };
      var k = kidsOf(it);
      if (k) { var r = locate(id, k, it, depth + 1, ancestors.concat(it)); if (r) return r; }
    }
    return null;
  }
  var byId = function (id) { var l = locate(id); return l ? l.item : null; };
  function walk(fn, list, parent, depth) {
    (list || content.sections).forEach(function (it) {
      fn(it, parent || null, depth || 0);
      var k = kidsOf(it);
      if (k) walk(fn, k, it, (depth || 0) + 1);
    });
  }
  function typeLabel(it) {
    if (!it) return "";
    if (it.type === "layout") return "Section libre";
    if (it.type === "component") return "Composant";
    return NT[it.type] ? NT[it.type].label : LEGACY[it.type] ? LEGACY[it.type].label : it.type;
  }
  function preview(it) {
    var p = it.props || {};
    var t = p.text || p.label || (p.html ? p.html.replace(/<[^>]+>/g, " ") : "") || it.title || it.heading || it.label || "";
    return String(t).replace(/\s+/g, " ").trim().slice(0, 40);
  }
  var nameOf = function (it) { return it.name || (preview(it) && it.type !== "layout" ? typeLabel(it) + " · " + preview(it) : typeLabel(it)); };
  function lockedDeep(id) { var l = locate(id); if (!l) return false; return Boolean(l.item.locked || l.ancestors.some(function (a) { return a.locked; })); }
  function topOf(id) { var l = locate(id); return l ? (l.ancestors[0] || l.item) : null; }
  var sectionIndex = function (s) { return content.sections.indexOf(s); };

  // ---------- État de l'éditeur ----------
  var selection = [];
  var device = "desktop";           // écran affiché ET modifié (styles par écran)
  var styleState = "normal";        // normal | hover | focus | active
  var revision = PAGE.revision, hasDraft = PAGE.hasDraft, status = PAGE.status;
  var collapsed = store.get("collapsed-" + PAGE.id, {});
  var editing = null;               // édition directe en cours dans le canevas
  var clipboard = null, styleClipboard = null;
  var tool = "select";              // select | hand
  var zoom = 1, zoomFit = false;
  var aids = store.get("aids", { grid: false, outlines: false, rulers: false, snap: true });
  var panels = store.get("panels", { left: 260, right: 340, layers: 46, leftHidden: false, rightHidden: false });
  var frame = $("[data-pb-frame]");
  var stage = $("[data-pb-stage]");
  var wrap = $("[data-pb-frame-wrap]");
  var dirty = false, blocked = false, saving = false, saveTimer = null;

  // ---------- Historique (annuler / rétablir) ----------
  var past = [], future = [], lastKey = null;
  var snapshot = function () { return JSON.stringify({ sections: content.sections, title: content.title, description: content.description, seo: content.seo, theme: content.theme, selection: selection }); };
  function restore(snap) {
    var s = JSON.parse(snap);
    content.sections = s.sections; content.title = s.title; content.description = s.description; content.seo = s.seo; content.theme = s.theme;
    selection = s.selection.filter(function (id) { return byId(id); });
  }
  // Une modification : l'état précédent part dans l'historique. Les frappes successives dans un même champ (clé
  // identique) forment UNE seule étape d'annulation.
  function change(fn, opts) {
    opts = opts || {};
    if (!canWrite) return false;
    var before = snapshot();
    if (fn() === false) return false;
    if (!opts.key || opts.key !== lastKey) {
      past.push(before);
      if (past.length > 150) past.shift();
      future = [];
    }
    lastKey = opts.key || null;
    afterChange(opts.light);
    return true;
  }
  function undo() { if (!past.length) return; future.push(snapshot()); restore(past.pop()); lastKey = null; afterChange(false); }
  function redo() { if (!future.length) return; past.push(snapshot()); restore(future.pop()); lastKey = null; afterChange(false); }
  // light : saisie dans un champ de l'inspecteur (il n'est pas redessiné, sinon le curseur serait perdu)
  function afterChange(light) {
    renderTree();
    if (!light) { renderInspector(); renderContext(); renderPageSettings(); }
    updateHistoryButtons();
    scheduleRender();
    scheduleSave();
  }
  function updateHistoryButtons() {
    $("[data-pb-undo]").disabled = !past.length || !canWrite;
    $("[data-pb-redo]").disabled = !future.length || !canWrite;
  }

  // ---------- Sélection ----------
  function select(id, additive, opts) {
    opts = opts || {};
    if (editing && (!id || id !== editing.id)) commitEdit();
    if (!id) selection = [];
    else if (additive) selection = selection.indexOf(id) >= 0 ? selection.filter(function (x) { return x !== id; }) : selection.concat(id);
    else selection = [id];
    if (id && !additive) revealInTree(id);
    styleState = "normal";
    markTreeSelection();
    renderInspector();
    renderContext();
    markCanvasSelection(opts.scroll !== false);
  }
  var selectedItems = function () { return selection.map(byId).filter(Boolean); };
  function revealInTree(id) {
    var l = locate(id);
    if (!l) return;
    var changed = false;
    l.ancestors.forEach(function (a) { if (collapsed[a.id]) { delete collapsed[a.id]; changed = true; } });
    if (changed) { store.set("collapsed-" + PAGE.id, collapsed); renderTree(); }
  }

  // ---------- Placement (règles de structure) ----------
  // Racine : uniquement des sections. Section libre et conteneurs : uniquement des éléments. Un élément posé à la racine
  // est placé dans une nouvelle section libre (jamais d'élément orphelin).
  function insertInto(parent, index, items) {
    if (parent === null) {
      var sections = [], pending = [];
      items.forEach(function (it) { if (isNode(it)) pending.push(it); else { if (pending.length) { sections.push({ id: newId(), type: "layout", children: pending }); pending = []; } sections.push(it); } });
      if (pending.length) sections.push({ id: newId(), type: "layout", children: pending });
      if (content.sections.length + sections.length > 30) { toast("Une page compte au plus 30 sections.", true); return null; }
      Array.prototype.splice.apply(content.sections, [index, 0].concat(sections));
      return items;
    }
    var k = kidsOf(parent);
    if (!k || items.some(function (it) { return !isNode(it); })) { toast("Une section ne se place pas dans un conteneur : seuls les éléments s'y placent.", true); return null; }
    Array.prototype.splice.apply(k, [index, 0].concat(items));
    return items;
  }
  // Où ajouter un nouvel élément : dans le conteneur sélectionné, sinon après la sélection, sinon en fin de page
  function insertionPoint(it) {
    var l = selection.length ? locate(selection[selection.length - 1]) : null;
    if (isNode(it) && l) {
      if (kidsOf(l.item) && !lockedDeep(l.item.id)) return { parent: l.item, index: kidsOf(l.item).length };
      if (l.parent && !lockedDeep(l.parent.id)) return { parent: l.parent, index: l.index + 1 };
    }
    var top = l ? (l.ancestors[0] || l.item) : null;
    return { parent: null, index: top ? sectionIndex(top) + 1 : content.sections.length };
  }
  function addItems(items, at) {
    items.forEach(function (it) { ensureIds([it]); });
    var p = at || insertionPoint(items[0]);
    if (p.parent && lockedDeep(p.parent.id)) { toast("Emplacement verrouillé : déverrouillez-le d'abord.", true); return; }
    change(function () {
      if (!insertInto(p.parent, p.index, items)) return false;
      selection = items.map(function (it) { return it.id; });
    });
    markCanvasSelection(false);
  }
  function newNode(type, extra) {
    var t = NT[type];
    var n = Object.assign({ type: type }, clone(t.blank), extra || {});
    if (t.container && !n.children) n.children = [];
    ensureIds([n]);
    return n;
  }
  // Ajout d'un élément du registre (demande la donnée réelle si besoin : image, vidéo, formation…)
  function addElement(type, at) {
    if (!canWrite) return;
    if (type === "layout") return addItems([{ type: "layout", children: [newNode("container")] }], at && at.parent === null ? at : { parent: null, index: insertionPoint({ type: "layout" }).index });
    var t = NT[type];
    if (!t) return addLegacy(type, at);
    if (t.asks === "image") return openMedia({ title: "Choisir l'image", onPick: function (m) { addItems([newNode("image", { props: m.alt ? { src: m.path, alt: m.alt } : { src: m.path, alt: "", decorative: true } })], at); if (!m.alt) toast("Image ajoutée comme décorative : ajoutez un texte de remplacement si elle porte une information."); } });
    if (t.asks === "images") return openMedia({ title: "Images de la galerie (plusieurs possibles)", multiple: true, onPick: function (list) {
      var missing = list.filter(function (m) { return !m.alt; });
      if (missing.length) { toast("Ajoutez d'abord un texte de remplacement aux images choisies (dans la médiathèque) : " + missing.map(function (m) { return m.name; }).join(", "), true); return; }
      addItems([newNode("gallery", { props: { images: list.map(function (m) { return { src: m.path, alt: m.alt }; }) } })], at);
    } });
    if (t.asks === "video") return ask("Nouvelle vidéo", [["url", "url", "Adresse (YouTube, Vimeo ou fichier vidéo https://)"], ["title", "text", "Titre (lu par les lecteurs d'écran)"]], function (v) { addItems([newNode("video", { props: v })], at); });
    if (t.asks === "audio") return ask("Nouveau fichier audio", [["src", "url", "Adresse https:// du fichier (.mp3, .m4a, .ogg, .wav)"], ["title", "text", "Titre (facultatif)", true]], function (v) { addItems([newNode("audio", { props: v })], at); });
    if (t.asks === "course") {
      if (!boot.courses.length) { toast("Publiez d'abord une formation dans le catalogue.", true); return; }
      return ask("Formation à présenter", [["courseId", "course", "Formation"]], function (v) { addItems([newNode("course", { props: { courseId: Number(v.courseId), cta: "Découvrir la formation" } })], at); });
    }
    addItems([newNode(type)], at);
  }
  // Sections existantes (bandeau, formulaire, points forts…) : leur contenu de départ vient du serveur
  function addLegacy(type, at) {
    var t = LEGACY[type];
    if (!t) return;
    if (t.unavailable) { toast(t.unavailable, true); return; }
    if (type === "form" && content.sections.some(function (s) { return s.type === "form"; })) { toast("Une page n'a qu'un formulaire d'inscription.", true); return; }
    var where = at && at.parent === null ? at : { parent: null, index: insertionPoint({ type: type }).index };
    if (t.asks) return ask("Nouvelle vidéo", [["url", "url", "Adresse (YouTube, Vimeo ou fichier https://)"], ["title", "text", "Titre de la vidéo"]], function (v) { addItems([markSection({ type: "video", url: v.url, title: v.title, caption: "" })], where); });
    addItems([markSection(clone(t.blank))], where);
  }

  // ---------- Opérations sur la sélection ----------
  function refuseLocked(ids) {
    if (ids.some(lockedDeep)) { toast("Élément verrouillé : déverrouillez-le d'abord (cadenas dans les calques).", true); return true; }
    return false;
  }
  // Sélection sans doublons parent/enfant (un enfant d'un élément sélectionné suit son parent)
  function topLevelSelection(ids) {
    ids = ids || selection;
    return ids.filter(function (id) { var l = locate(id); return l && !l.ancestors.some(function (a) { return ids.indexOf(a.id) >= 0; }); });
  }
  function removeSelected() { removeItems(topLevelSelection()); }
  // Suppression (avec toute la descendance) : modèle, calques, canevas et sélection mis à jour ; annulable (Ctrl/⌘ + Z)
  function removeItems(ids) {
    ids = topLevelSelection(ids);
    if (!ids.length || refuseLocked(ids)) return;
    var label = ids.length === 1 ? "« " + nameOf(byId(ids[0])) + " »" : ids.length + " éléments";
    change(function () {
      ids.forEach(function (id) { var l = locate(id); if (l) l.list.splice(l.index, 1); });
      selection = selection.filter(function (id) { return byId(id); });
    });
    markCanvasSelection(false);
    toast(label + " supprimé. Ctrl/⌘ + Z pour annuler.");
  }
  // Nombre d'éléments contenus (toute la descendance)
  function countDeep(it) { var n = 0; (kidsOf(it) || []).forEach(function (c) { n += 1 + countDeep(c); }); return n; }
  function duplicateSelected() {
    var ids = topLevelSelection();
    if (!ids.length) return;
    if (ids.some(function (id) { return !isNode(byId(id)); }) && content.sections.length + ids.length > 30) { toast("Une page compte au plus 30 sections.", true); return; }
    change(function () {
      var copies = [];
      ids.forEach(function (id) { var l = locate(id); var c = reId(clone(l.item)); l.list.splice(l.index + 1, 0, c); copies.push(c.id); });
      selection = copies;
    });
  }
  // Déplacer d'un cran parmi ses voisins (Alt + ↑ / ↓)
  function nudge(delta) {
    var ids = topLevelSelection();
    if (!ids.length || refuseLocked(ids)) return;
    var first = locate(ids[0]);
    if (!ids.every(function (id) { return locate(id).list === first.list; })) { toast("Pour déplacer plusieurs éléments ensemble, ils doivent avoir le même parent.", true); return; }
    change(function () {
      var list = first.list;
      var idx = ids.map(function (id) { return list.indexOf(byId(id)); }).sort(function (a, b) { return a - b; });
      if ((delta < 0 && idx[0] === 0) || (delta > 0 && idx[idx.length - 1] === list.length - 1)) return false;
      (delta < 0 ? idx : idx.slice().reverse()).forEach(function (i) { var t = list[i + delta]; list[i + delta] = list[i]; list[i] = t; });
    });
  }
  // Déplacer vers un parent et une position (glisser-déposer). Un élément ne va jamais dans un de ses descendants.
  function moveTo(ids, parent, index) {
    ids = topLevelSelection(ids);
    if (!ids.length || refuseLocked(ids)) return;
    if (parent && lockedDeep(parent.id)) { toast("Emplacement verrouillé.", true); return; }
    if (parent && ids.some(function (id) { return id === parent.id || locate(parent.id).ancestors.some(function (a) { return a.id === id; }); })) { toast("Un élément ne peut pas aller à l'intérieur de lui-même.", true); return; }
    var items = ids.map(byId);
    items.forEach(function (it) { if (!isNode(it)) markSection(it); }); // reste une section une fois retirée de la racine
    if (parent && items.some(function (it) { return !isNode(it); })) { toast("Une section ne se place pas dans un conteneur.", true); return; }
    change(function () {
      var targetList = parent ? kidsOf(parent) : content.sections;
      var anchor = targetList[index] || null;
      ids.forEach(function (id) { var l = locate(id); l.list.splice(l.index, 1); });
      var at = anchor ? targetList.indexOf(anchor) : targetList.length;
      if (at < 0) at = targetList.length;
      if (!insertInto(parent, at, items)) return false;
      selection = ids.slice();
    });
  }
  function setFlag(ids, flag, value) {
    if (!ids.length) return;
    change(function () { ids.forEach(function (id) { var it = byId(id); if (it) { if (value) it[flag] = true; else delete it[flag]; } }); });
  }
  function rename(id, name) {
    change(function () { var it = byId(id); if (!it) return false; var n = String(name || "").trim().slice(0, 60); if ((it.name || "") === n) return false; if (n) it.name = n; else delete it.name; });
  }
  // Grouper : éléments d'un même parent → un « Groupe » à la place du premier
  function groupSelected() {
    var ids = topLevelSelection();
    if (!ids.length) return;
    var items = ids.map(function (id) { return locate(id); });
    if (items.some(function (l) { return !isNode(l.item); })) { toast("Seuls des éléments (pas des sections entières) se groupent.", true); return; }
    if (!items.every(function (l) { return l.list === items[0].list; })) { toast("Pour grouper, choisissez des éléments du même parent.", true); return; }
    if (refuseLocked(ids)) return;
    change(function () {
      var list = items[0].list;
      var sorted = items.slice().sort(function (a, b) { return a.index - b.index; });
      var g = { id: newId(), type: "group", name: "Groupe", children: sorted.map(function (l) { return l.item; }) };
      var at = sorted[0].index;
      sorted.slice().reverse().forEach(function (l) { list.splice(list.indexOf(l.item), 1); });
      list.splice(at, 0, g);
      selection = [g.id];
    });
  }
  function ungroupSelected() {
    var ids = selection.filter(function (id) { var it = byId(id); return it && ["group", "stack", "container"].indexOf(it.type) >= 0; });
    if (!ids.length) { toast("Sélectionnez un groupe (ou une pile, un conteneur) à dissocier.", true); return; }
    if (refuseLocked(ids)) return;
    change(function () {
      var freed = [];
      ids.forEach(function (id) { var l = locate(id); var kids = l.item.children || []; Array.prototype.splice.apply(l.list, [l.index, 1].concat(kids)); freed = freed.concat(kids.map(function (k) { return k.id; })); });
      selection = freed;
    });
  }
  // Copier / couper / coller (éléments et sections)
  function copySelected(cut) {
    var ids = topLevelSelection();
    if (!ids.length) return;
    clipboard = ids.map(function (id) { var it = byId(id); var c = clone(it); if (!isNode(it)) c.section = true; return c; });
    store.set("clipboard", clipboard);
    if (cut) { if (refuseLocked(ids)) return; removeSelected(); toast("Coupé (" + ids.length + ")."); }
    else toast("Copié (" + ids.length + ").");
  }
  function paste() {
    var items = clipboard || store.get("clipboard", null);
    if (!items || !items.length) { toast("Rien à coller.", true); return; }
    addItems(items.map(function (it) { var c = reId(clone(it)); if (c.section) { delete c.section; markSection(c); } return c; }));
  }
  // Copier / coller le style (styles par écran et par état ; préréglages des sections)
  function copyStyle() {
    var it = selectedItems()[0];
    if (!it) return;
    styleClipboard = { styles: clone(it.styles || {}), states: clone(it.states || {}), style: clone(it.style || null) };
    store.set("style-clipboard", styleClipboard);
    toast("Style copié depuis « " + nameOf(it) + " ».");
  }
  function pasteStyle() {
    var st = styleClipboard || store.get("style-clipboard", null);
    if (!st) { toast("Aucun style copié.", true); return; }
    var ids = selection.slice();
    if (!ids.length || refuseLocked(ids)) return;
    change(function () {
      ids.forEach(function (id) {
        var it = byId(id);
        if (Object.keys(st.styles).length) it.styles = clone(st.styles); else delete it.styles;
        if (Object.keys(st.states).length) it.states = clone(st.states); else delete it.states;
        if (!isNode(it) && st.style) it.style = clone(st.style);
      });
    });
    toast("Style collé sur " + ids.length + " élément" + (ids.length > 1 ? "s" : "") + ".");
  }

  // ---------- Styles (par écran et par état) ----------
  // Écran modifié = écran affiché. Une valeur absente est héritée de l'écran plus grand.
  function styleSet(it, bp, state, create) {
    if (state && state !== "normal") {
      if (!it.states) { if (!create) return null; it.states = {}; }
      if (!it.states[state]) { if (!create) return null; it.states[state] = {}; }
      return it.states[state];
    }
    if (!it.styles) { if (!create) return null; it.styles = {}; }
    if (!it.styles[bp]) { if (!create) return null; it.styles[bp] = {}; }
    return it.styles[bp];
  }
  function ownValue(it, key) { var s = styleSet(it, device, styleState, false); return s && s[key] !== undefined ? s[key] : undefined; }
  // Valeur héritée (écrans plus grands) : affichée en indication grise
  function inheritedValue(it, key) {
    if (styleState !== "normal") return undefined;
    var i = BPS.indexOf(device);
    for (var j = i - 1; j >= 0; j--) { var s = it.styles && it.styles[BPS[j]]; if (s && s[key] !== undefined) return s[key]; }
    return undefined;
  }
  function cleanStyles(it) {
    if (it.styles) { BPS.forEach(function (b) { if (it.styles[b] && !Object.keys(it.styles[b]).length) delete it.styles[b]; }); if (!Object.keys(it.styles).length) delete it.styles; }
    if (it.states) { Object.keys(it.states).forEach(function (k) { if (!Object.keys(it.states[k]).length) delete it.states[k]; }); if (!Object.keys(it.states).length) delete it.states; }
  }
  function setStyle(ids, key, value, opts) {
    ids = ids || selection;
    if (!ids.length || refuseLocked(ids)) return;
    change(function () {
      ids.forEach(function (id) {
        var it = byId(id);
        if (!it) return;
        var empty = value === "" || value === null || value === undefined;
        var set = styleSet(it, device, styleState, !empty);
        if (!set) return;
        if (empty) delete set[key]; else set[key] = value;
        cleanStyles(it);
      });
    }, { key: opts && opts.key ? opts.key + ":" + device + ":" + styleState : null, light: opts && opts.light });
  }
  function setProp(id, key, value, opts) {
    if (lockedDeep(id)) { toast("Élément verrouillé.", true); return; }
    change(function () {
      var it = byId(id);
      if (!it) return false;
      if (isNode(it)) { it.props = it.props || {}; it.props[key] = value; } else it[key] = value;
    }, { key: opts && opts.key, light: opts && opts.light });
  }
  // Valeurs saisies : « 24 » → « 24px » ; vérification avant envoi (le serveur revérifie)
  var LEN = /^-?\d{1,4}(\.\d{1,3})?(px|%|rem|em|vh|vw)$/;
  function parseLength(v, key) {
    var s = String(v || "").trim().toLowerCase().replace(",", ".");
    if (!s) return "";
    if (/^-?\d{1,4}(\.\d{1,3})?$/.test(s)) s = s === "0" ? "0" : s + "px";
    if (s === "auto") return ["width", "height", "marginTop", "marginRight", "marginBottom", "marginLeft"].indexOf(key) >= 0 ? s : null;
    if (s === "0" || LEN.test(s)) {
      if (/^-/.test(s) && !/^(margin|top|left|letterSpacing)/.test(key)) return null;
      return s;
    }
    return null;
  }

  // ---------- Calques (arbre) ----------
  var treeEl = $("[data-pb-layers]");
  var dragIds = null, dragNew = null;
  function renderTree() {
    var frag = document.createDocumentFragment();
    var build = function (list, level, into) {
      list.forEach(function (it) {
        var kids = kidsOf(it);
        var open = kids && kids.length && !collapsed[it.id];
        var on = selection.indexOf(it.id) >= 0;
        var li = h("li", { role: "treeitem", "aria-level": String(level), "aria-selected": String(on), "aria-expanded": kids && kids.length ? String(Boolean(open)) : null, class: "pb-node" + (it.hidden ? " is-hidden" : "") + (it.locked ? " is-locked" : ""), dataset: { id: it.id } });
        var row = h("div", { class: "pb-row-item" + (on ? " is-selected" : "") + (it.id === errorItemId ? " is-error" : ""), draggable: canWrite ? "true" : null, style: "--level:" + (level - 1), tabindex: "-1" },
          kids && kids.length ? h("button", { type: "button", class: "pb-twist", tabindex: "-1", "aria-label": open ? "Replier" : "Déplier", onclick: function (e) { e.stopPropagation(); toggleCollapse(it.id); } }, icon(open ? "chevronDown" : "chevronRight")) : h("span", { class: "pb-twist-gap", "aria-hidden": "true" }),
          h("span", { class: "pb-node-icon", "aria-hidden": "true" }, icon(isNode(it) ? NT[it.type].icon : it.type === "layout" ? "layout" : "fileText")),
          h("span", { class: "pb-node-name", text: nameOf(it) }),
          h("span", { class: "pb-node-flags" },
            h("button", { type: "button", tabindex: "-1", class: "pb-flag" + (it.hidden ? " is-on" : ""), "aria-pressed": String(Boolean(it.hidden)), "aria-label": (it.hidden ? "Afficher « " : "Masquer « ") + nameOf(it) + " »", "data-tip": it.hidden ? "Afficher" : "Masquer", disabled: !canWrite, onclick: function (e) { e.stopPropagation(); setFlag([it.id], "hidden", !it.hidden); } }, icon(it.hidden ? "eyeOff" : "eye")),
            h("button", { type: "button", tabindex: "-1", class: "pb-flag" + (it.locked ? " is-on" : ""), "aria-pressed": String(Boolean(it.locked)), "aria-label": (it.locked ? "Déverrouiller « " : "Verrouiller « ") + nameOf(it) + " »", "data-tip": it.locked ? "Déverrouiller" : "Verrouiller", disabled: !canWrite, onclick: function (e) { e.stopPropagation(); setFlag([it.id], "locked", !it.locked); } }, icon("lock")),
            h("button", { type: "button", tabindex: "-1", class: "pb-flag pb-flag-delete", "aria-label": "Supprimer « " + nameOf(it) + " »" + (kids && kids.length ? " et ses " + countDeep(it) + " élément(s)" : ""), "data-tip": kids && kids.length ? "Supprimer (avec ses " + countDeep(it) + " élément(s))" : "Supprimer", disabled: !canWrite || lockedDeep(it.id), onclick: function (e) { e.stopPropagation(); removeItems([it.id]); } }, icon("trash"))));
        row.addEventListener("click", function (e) { select(it.id, e.shiftKey || e.metaKey || e.ctrlKey); });
        row.addEventListener("dblclick", function (e) { if (canWrite && !e.target.closest("button")) startRename(row, it); });
        row.addEventListener("contextmenu", function (e) { e.preventDefault(); if (selection.indexOf(it.id) < 0) select(it.id); openMenu(e.clientX, e.clientY); });
        row.addEventListener("dragstart", function (e) {
          if (lockedDeep(it.id)) { e.preventDefault(); toast("Élément verrouillé.", true); return; }
          dragIds = selection.indexOf(it.id) >= 0 ? selection.slice() : [it.id]; dragNew = null;
          e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "pb-move");
        });
        row.addEventListener("dragover", function (e) {
          if (!dragIds && !dragNew) return;
          var pos = dropPosition(row, e.clientY, it);
          e.preventDefault();
          clearTreeDrop();
          row.classList.add(pos === "before" ? "is-drop-before" : pos === "after" ? "is-drop-after" : "is-drop-inside");
        });
        row.addEventListener("dragleave", function () { row.classList.remove("is-drop-before", "is-drop-after", "is-drop-inside"); });
        row.addEventListener("drop", function (e) {
          var pos = dropPosition(row, e.clientY, it);
          clearTreeDrop();
          e.preventDefault();
          var l = locate(it.id);
          performDrop(pos === "inside" ? { parent: it, index: kidsOf(it).length } : { parent: l.parent, index: l.index + (pos === "after" ? 1 : 0) });
        });
        li.appendChild(row);
        if (open) { var ul = h("ul", { role: "group", class: "pb-tree-group" }); build(kids, level + 1, ul); li.appendChild(ul); }
        into.appendChild(li);
      });
    };
    build(content.sections, 1, frag);
    treeEl.textContent = "";
    if (!content.sections.length) treeEl.appendChild(h("li", { class: "pb-tree-empty", role: "none" }, h("p", { class: "pb-hint", text: "Page vide : glissez un élément ou un bloc ici, ou dans la page." })));
    treeEl.appendChild(frag);
    var cur = treeEl.querySelector(".pb-row-item.is-selected") || treeEl.querySelector(".pb-row-item");
    if (cur) cur.tabIndex = 0;
  }
  // Avant / après / dedans selon la hauteur du pointeur dans la ligne ; « dedans » seulement pour un conteneur
  function dropPosition(row, y, it) {
    var r = row.getBoundingClientRect();
    var rel = (y - r.top) / r.height;
    var accepts = kidsOf(it) && (dragNew ? isNode(dragNew.sample) : (dragIds || []).every(function (id) { return isNode(byId(id)); }));
    if (accepts && rel > 0.28 && rel < 0.72) return "inside";
    return rel < 0.5 ? "before" : "after";
  }
  function clearTreeDrop() { $$(".is-drop-before, .is-drop-after, .is-drop-inside", treeEl).forEach(function (el) { el.classList.remove("is-drop-before", "is-drop-after", "is-drop-inside"); }); }
  treeEl.addEventListener("dragover", function (e) { if ((dragIds || dragNew) && (e.target === treeEl || e.target.closest(".pb-tree-empty"))) e.preventDefault(); });
  treeEl.addEventListener("drop", function (e) { if (e.target === treeEl || e.target.closest(".pb-tree-empty")) { e.preventDefault(); performDrop({ parent: null, index: content.sections.length }); } });
  document.addEventListener("dragend", function () { dragIds = null; dragNew = null; clearTreeDrop(); hideDropIndicator(); });
  function performDrop(target) {
    if (dragNew) { var make = dragNew.make; dragNew = null; make(target); }
    else if (dragIds) { var ids = dragIds; dragIds = null; moveTo(ids, target.parent, target.index); }
  }
  function markTreeSelection() {
    $$(".pb-node", treeEl).forEach(function (li) {
      var on = selection.indexOf(li.dataset.id) >= 0;
      li.setAttribute("aria-selected", String(on));
      li.firstElementChild.classList.toggle("is-selected", on);
    });
    var cur = selection.length ? treeEl.querySelector('.pb-node[data-id="' + selection[selection.length - 1] + '"] > .pb-row-item') : null;
    if (cur) { $$(".pb-row-item", treeEl).forEach(function (r) { r.tabIndex = -1; }); cur.tabIndex = 0; cur.scrollIntoView({ block: "nearest" }); }
  }
  function toggleCollapse(id, value) {
    if (value === undefined) value = !collapsed[id];
    if (value) collapsed[id] = true; else delete collapsed[id];
    store.set("collapsed-" + PAGE.id, collapsed);
    renderTree();
  }
  function startRename(row, it) {
    var nameEl = row.querySelector(".pb-node-name");
    var input = h("input", { type: "text", class: "pb-rename", maxlength: "60", value: it.name || "", placeholder: typeLabel(it), "aria-label": "Nouveau nom du calque" });
    nameEl.replaceWith(input);
    input.focus(); input.select();
    var done = false;
    var finish = function (save) { if (done) return; done = true; if (save) rename(it.id, input.value); renderTree(); };
    input.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") finish(true); if (e.key === "Escape") finish(false); });
    input.addEventListener("blur", function () { finish(true); });
    input.addEventListener("click", function (e) { e.stopPropagation(); });
  }
  // Clavier dans l'arbre : ↑ ↓ (parcourir), → ← (déplier, replier, parent), Entrée (écrire), F2 (renommer)
  treeEl.addEventListener("keydown", function (e) {
    var row = e.target.closest && e.target.closest(".pb-row-item");
    if (!row || e.target.tagName === "INPUT" || e.altKey || e.metaKey || e.ctrlKey) return; // raccourcis (Alt + ↑…) : gérés plus bas
    var rows = $$(".pb-row-item", treeEl);
    var i = rows.indexOf(row);
    var id = row.parentNode.dataset.id;
    var it = byId(id);
    var go = function (r) { if (!r) return; rows.forEach(function (x) { x.tabIndex = -1; }); r.tabIndex = 0; r.focus(); select(r.parentNode.dataset.id, e.shiftKey); };
    if (e.key === "ArrowDown") { e.preventDefault(); go(rows[i + 1]); }
    else if (e.key === "ArrowUp") { e.preventDefault(); go(rows[i - 1]); }
    else if (e.key === "ArrowRight" && kidsOf(it) && kidsOf(it).length) { e.preventDefault(); if (collapsed[id]) { toggleCollapse(id, false); focusRow(id); } else go(rows[i + 1]); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); if (kidsOf(it) && kidsOf(it).length && !collapsed[id]) { toggleCollapse(id, true); focusRow(id); } else { var l = locate(id); if (l.parent) { select(l.parent.id); focusRow(l.parent.id); } } }
    else if (e.key === "F2" && canWrite) { e.preventDefault(); startRename(row, it); }
    else if (e.key === "Enter") { e.preventDefault(); select(id); if (INLINE[it.type]) startEdit(id); }
  });
  function focusRow(id) { var r = treeEl.querySelector('.pb-node[data-id="' + id + '"] > .pb-row-item'); if (r) { $$(".pb-row-item", treeEl).forEach(function (x) { x.tabIndex = -1; }); r.tabIndex = 0; r.focus(); } }
  function expandAll() { collapsed = {}; store.set("collapsed-" + PAGE.id, collapsed); renderTree(); }
  function collapseAll() { walk(function (it) { if (kidsOf(it) && kidsOf(it).length) collapsed[it.id] = true; }); store.set("collapsed-" + PAGE.id, collapsed); renderTree(); }
  // Une seule flèche dans l'en-tête : replier / déplier le panneau Calques (l'inspecteur prend alors toute la hauteur)
  var layersToggle = $("[data-pb-layers-toggle]");
  function applyLayersPanel() {
    var open = !panels.layersCollapsed;
    $("[data-pb-right]").classList.toggle("is-layers-collapsed", !open);
    layersToggle.setAttribute("aria-expanded", String(open));
    layersToggle.setAttribute("aria-label", open ? "Replier le panneau Calques" : "Déplier le panneau Calques");
    layersToggle.setAttribute("data-tip", open ? "Replier le panneau Calques" : "Déplier le panneau Calques");
    layersToggle.textContent = "";
    layersToggle.appendChild(icon(open ? "chevronDown" : "chevronRight"));
  }
  layersToggle.addEventListener("click", function () { panels.layersCollapsed = !panels.layersCollapsed; store.set("panels", panels); applyLayersPanel(); });

  // ---------- Palette d'éléments, outils, blocs, composants ----------
  // Glisser depuis la palette : dragNew = { sample, make(cible) }
  function draggableSource(el, sample, make) {
    el.setAttribute("draggable", canWrite ? "true" : "false");
    el.addEventListener("dragstart", function (e) {
      if (!canWrite) { e.preventDefault(); return; }
      dragNew = { sample: sample, make: make }; dragIds = null;
      e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", "pb-new");
    });
  }
  function renderElements(filter) {
    var box = $("[data-pb-elements]");
    box.textContent = "";
    var f = norm(filter);
    var groups = Object.keys(SPEC.categories).map(function (k) { return { label: SPEC.categories[k], items: SPEC.types.filter(function (t) { return t.category === k; }).map(function (t) { return { type: t.type, label: t.label, icon: t.icon, disabled: t.asks === "course" && !boot.courses.length ? "Publiez d'abord une formation dans le catalogue." : null }; }) }; });
    groups[0].items.unshift({ type: "layout", label: "Section libre", icon: "layout" });
    groups.push({ label: "Sections prêtes", items: boot.types.map(function (t) { return { type: t.type, label: t.label, icon: "fileText", disabled: t.unavailable, legacy: true }; }) });
    groups.forEach(function (g) {
      var items = g.items.filter(function (it) { return !f || norm(it.label).indexOf(f) >= 0 || norm(g.label).indexOf(f) >= 0; });
      if (!items.length) return;
      var ul = h("ul", { class: "pb-palette" });
      items.forEach(function (it) {
        var btn = h("button", { type: "button", class: "pb-pal-item", disabled: !canWrite || Boolean(it.disabled), "data-tip": it.disabled || null, onclick: function () { if (it.legacy) addLegacy(it.type); else addElement(it.type); } }, icon(it.icon), h("span", { text: it.label }));
        if (!it.disabled) draggableSource(btn, it.legacy ? { type: it.type, section: true } : { type: it.type }, function (target) { if (it.legacy) addLegacy(it.type, target); else addElement(it.type, target); });
        ul.appendChild(h("li", {}, btn));
      });
      box.appendChild(h("section", { class: "pb-pal-group" }, h("h3", { class: "pb-sub", text: g.label }), ul));
    });
    if (!box.children.length) box.appendChild(h("p", { class: "pb-hint", text: "Aucun élément ne correspond." }));
  }
  $("[data-pb-el-search]").addEventListener("input", function () { renderElements(this.value); });

  var TOOLS = [
    { key: "select", label: "Sélection (V)", icon: "mousePointer", mode: true },
    { key: "hand", label: "Main (H)", tip: "Main : faire défiler la page en la glissant (H)", icon: "arrowRightLeft", mode: true },
    { sep: true },
    { key: "layout", label: "Section libre" }, { key: "container", label: "Conteneur" }, { key: "columns", label: "Colonnes" }, { key: "grid", label: "Grille" }, { key: "stack", label: "Pile" }, { key: "group", label: "Groupe" },
    { sep: true },
    { key: "heading", label: "Titre" }, { key: "text", label: "Texte (T)" }, { key: "list", label: "Liste" }, { key: "quote", label: "Citation" }, { key: "table", label: "Tableau" },
    { sep: true },
    { key: "image", label: "Image (I)" }, { key: "gallery", label: "Galerie" }, { key: "video", label: "Vidéo" }, { key: "audio", label: "Audio" }, { key: "icon", label: "Icône" },
    { sep: true },
    { key: "button", label: "Bouton (B)" }, { key: "link", label: "Lien" }, { key: "accordion", label: "Accordéon / FAQ" }, { key: "tabs", label: "Onglets" },
    { sep: true },
    { key: "divider", label: "Séparateur" }, { key: "spacer", label: "Espace" }, { key: "form", label: "Formulaire d'inscription" }, { key: "countdown", label: "Compte à rebours" }, { key: "course", label: "Formation" },
  ];
  // Barre d'outils : compacte (icônes, nom en infobulle) ou étendue (icône + nom) — préférence d'interface mémorisée
  var toolLabel = function (label) { return label.replace(/\s*\([^)]*\)$/, ""); };
  function renderTools() {
    var nav = $("[data-pb-tools]");
    nav.textContent = "";
    var expanded = Boolean(panels.toolsExpanded);
    nav.appendChild(h("button", { type: "button", class: "pb-tool pb-tools-toggle", "aria-expanded": String(expanded), "aria-label": expanded ? "Réduire la barre d'outils" : "Déployer la barre d'outils (noms des outils)", "data-tip": expanded ? "Réduire la barre d'outils" : "Déployer la barre d'outils",
      onclick: function () { panels.toolsExpanded = !panels.toolsExpanded; applyPanels(); renderTools(); } }, icon(expanded ? "chevronLeft" : "chevronRight"), h("span", { class: "pb-tool-label", text: expanded ? "Réduire" : "Déployer" })));
    nav.appendChild(h("span", { class: "pb-tools-sep", role: "separator" }));
    TOOLS.forEach(function (t) {
      if (t.sep) { nav.appendChild(h("span", { class: "pb-tools-sep", role: "separator" })); return; }
      var ic = t.mode ? t.icon : t.key === "layout" ? "layout" : t.key === "form" ? "fileText" : NT[t.key] ? NT[t.key].icon : "plus";
      var unavailable = t.key === "course" && !boot.courses.length ? "publiez d'abord une formation" : t.key === "form" && LEGACY.form && LEGACY.form.unavailable ? LEGACY.form.unavailable : null;
      var btn = h("button", { type: "button", class: "pb-tool", "aria-label": t.label, "data-tip": unavailable ? t.label + " — " + unavailable : t.tip || t.label, "data-mode": t.mode ? t.key : null, "aria-pressed": t.mode ? String(tool === t.key) : null, disabled: (!t.mode && !canWrite) || Boolean(unavailable),
        onclick: function () { if (t.mode) setTool(t.key); else addElement(t.key); } }, icon(ic), h("span", { class: "pb-tool-label", text: toolLabel(t.label) }));
      if (!t.mode && !unavailable) draggableSource(btn, { type: t.key }, function (target) { addElement(t.key, target); });
      nav.appendChild(btn);
    });
    nav.appendChild(h("span", { class: "pb-tools-grow" }));
    nav.appendChild(h("button", { type: "button", class: "pb-tool", "aria-label": "Médiathèque", "data-tip": "Médiathèque", onclick: function () { openMedia({ title: "Médiathèque" }); } }, icon("image"), h("span", { class: "pb-tool-label", text: "Médiathèque" })));
    nav.appendChild(h("button", { type: "button", class: "pb-tool", "aria-label": "Règles (R)", "data-tip": "Règles (R)", "data-aid": "rulers", "aria-pressed": String(Boolean(aids.rulers)), onclick: function () { setAid("rulers", !aids.rulers); } }, icon("spacing"), h("span", { class: "pb-tool-label", text: "Règles" })));
    nav.appendChild(h("button", { type: "button", class: "pb-tool", "aria-label": "Guides", "data-tip": "Afficher les guides (tirez-les depuis les règles)", "data-aid": "guides", "aria-pressed": String(aids.guides !== false), onclick: function () { setAid("guides", aids.guides === false); } }, icon("columns"), h("span", { class: "pb-tool-label", text: "Guides" })));
    nav.appendChild(h("button", { type: "button", class: "pb-tool", "aria-label": "Panneau des éléments", "data-tip": panels.leftHidden ? "Afficher le panneau des éléments" : "Masquer le panneau des éléments", "aria-pressed": String(!panels.leftHidden), onclick: function () { togglePanel("left"); } }, icon("layers"), h("span", { class: "pb-tool-label", text: "Éléments" })));
    nav.appendChild(h("button", { type: "button", class: "pb-tool", "aria-label": "Calques", "data-tip": panels.rightHidden ? "Afficher les calques et l'inspecteur" : "Masquer les calques et l'inspecteur", "aria-pressed": String(!panels.rightHidden), onclick: function () { togglePanel("right"); } }, icon("listChecks"), h("span", { class: "pb-tool-label", text: "Calques" })));
  }

  // ---------- Infobulles (une seule, au-dessus de l'interface : jamais coupée par un panneau qui défile) ----------
  var tipEl = h("div", { class: "pb-tip", role: "tooltip", id: "pb-tip", hidden: true });
  document.body.appendChild(tipEl);
  var tipTimer = null, tipFor = null;
  function hideTip() { clearTimeout(tipTimer); tipTimer = null; if (tipFor) tipFor.removeAttribute("aria-describedby"); tipFor = null; tipEl.hidden = true; }
  function showTip(el) {
    var text = el.getAttribute("data-tip");
    if (!text) return;
    // Barre étendue : le nom est déjà affiché, l'infobulle n'ajoute que ce qui manque (raccourci, indisponibilité)
    var label = el.querySelector(".pb-tool-label");
    if (panels.toolsExpanded && label && el.closest(".pb-tools") && toolLabel(text) === label.textContent && text === label.textContent) return;
    tipEl.textContent = text;
    tipEl.hidden = false;
    var r = el.getBoundingClientRect(), t = tipEl.getBoundingClientRect();
    var side = el.closest(".pb-tools");
    var left = side ? r.right + 10 : r.left + r.width / 2 - t.width / 2;
    var top = side ? r.top + r.height / 2 - t.height / 2 : r.bottom + 8;
    if (!side && top + t.height > window.innerHeight - 8) top = r.top - t.height - 8;
    tipEl.style.left = Math.max(8, Math.min(left, window.innerWidth - t.width - 8)) + "px";
    tipEl.style.top = Math.max(8, Math.min(top, window.innerHeight - t.height - 8)) + "px";
    tipEl.classList.toggle("is-side", Boolean(side));
    el.setAttribute("aria-describedby", "pb-tip");
    tipFor = el;
  }
  function armTip(el) {
    if (tipFor === el) return;
    hideTip();
    tipFor = el;
    tipTimer = setTimeout(function () { tipFor = null; showTip(el); }, 350);
  }
  document.addEventListener("mouseover", function (e) { var el = e.target.closest && e.target.closest("[data-tip]"); if (el) armTip(el); else if (tipFor) hideTip(); });
  document.addEventListener("mouseout", function (e) { var el = e.target.closest && e.target.closest("[data-tip]"); if (el && !el.contains(e.relatedTarget)) hideTip(); });
  document.addEventListener("focusin", function (e) { var el = e.target.closest && e.target.closest("[data-tip]"); if (el && el.matches(":focus-visible")) armTip(el); });
  document.addEventListener("focusout", hideTip);
  document.addEventListener("mousedown", hideTip, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideTip(); }, true);
  function setTool(k) {
    tool = k;
    $$(".pb-tool[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === k)); });
    var doc = frame.contentDocument;
    if (doc && doc.body) doc.body.classList.toggle("pb-hand", k === "hand");
  }
  function renderBlocks() {
    var box = $("[data-pb-blocks]");
    box.textContent = "";
    var cats = {};
    boot.blocks.forEach(function (b) { (cats[b.category] = cats[b.category] || []).push(b); });
    Object.keys(cats).forEach(function (c) {
      var ul = h("ul", { class: "pb-blocks" });
      cats[c].forEach(function (b) {
        var make = function (target) {
          if (b.sections.some(function (s) { return s.type === "form"; }) && content.sections.some(function (s) { return s.type === "form"; })) { toast("Une page n'a qu'un formulaire d'inscription : ce bloc en contient un.", true); return; }
          var secs = clone(b.sections); ensureIds(secs);
          var index = target && target.parent === null ? target.index : target && target.parent ? sectionIndex(topOf(target.parent.id)) + 1 : insertionPoint({ type: "layout" }).index;
          change(function () { if (!insertInto(null, index, secs)) return false; selection = [secs[0].id]; });
          markCanvasSelection(true);
        };
        var btn = h("button", { type: "button", class: "pb-block-item", "data-block": b.key, disabled: !canWrite, onclick: function () { make(null); } }, h("strong", { text: b.label }), h("span", { class: "pb-hint", text: b.sections.length > 1 ? b.sections.length + " sections" : "Section libre" }));
        draggableSource(btn, { type: "layout" }, make);
        ul.appendChild(h("li", {}, btn));
      });
      box.appendChild(h("section", { class: "pb-pal-group" }, h("h3", { class: "pb-sub", text: c }), ul));
    });
  }
  function fetchComponent(id) { return api("GET", "/marketing/site-web/composants/" + id + ".json").then(function (r) { return r.component; }); }
  function renderComponents() {
    var ul = $("[data-pb-components]");
    ul.textContent = "";
    if (!components.length) { ul.appendChild(h("li", {}, h("p", { class: "pb-hint", text: "Aucun composant. Sélectionnez un élément ou une section, puis « Enregistrer comme composant » (inspecteur, onglet Avancé)." }))); return; }
    components.forEach(function (c) {
      var insertSync = function (target) { addItems([{ type: "component", componentId: c.id }], { parent: null, index: target && target.parent === null ? target.index : insertionPoint({ type: "component" }).index }); };
      var syncBtn = h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: !canWrite, onclick: function () { insertSync(null); } }, "Synchronisé");
      draggableSource(syncBtn, { type: "component" }, insertSync);
      ul.appendChild(h("li", { class: "pb-comp" },
        h("div", {}, h("strong", { text: c.name }), h("span", { class: "pb-hint", text: (c.global ? "Global" : "Ce site") + " · " + (c.type === "layout" ? "Section libre" : LEGACY[c.type] ? LEGACY[c.type].label : c.type) })),
        h("div", { class: "pb-row pb-wrap" }, syncBtn,
          h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: !canWrite, onclick: function () { fetchComponent(c.id).then(function (comp) { var s = markSection(reId(clone(comp.section))); ensureIds([s]); addItems([s], { parent: null, index: insertionPoint({ type: "layout" }).index }); }, apiFail); } }, "Copie"),
          h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: !canWrite, onclick: function () {
            if (!window.confirm("Supprimer le composant « " + c.name + " » ? (Refusé s'il est encore utilisé par une page.)")) return;
            api("POST", "/marketing/site-web/composants/" + c.id + "/supprimer", {}).then(function () { components = components.filter(function (x) { return x.id !== c.id; }); renderComponents(); toast("Composant supprimé."); }, apiFail);
          } }, "Supprimer"))));
    });
  }
  // Enregistrer un élément ou une section comme composant (un élément est enregistré dans une section libre)
  function saveAsComponent(it, name, global) {
    var section = clone(it);
    if (isNode(it)) section = { type: "layout", children: [section] };
    delete section.id; delete section.locked;
    return api("POST", "/marketing/site-web/composants", { name: name, section: section, global: global, siteId: PAGE.siteId }).then(function (r) {
      components.push(r.component); renderComponents(); toast("Composant « " + r.component.name + " » enregistré (onglet Composants)."); return r.component;
    }, apiFail);
  }

  // ---------- Champs de l'inspecteur ----------
  var fieldSeq = 0;
  var fid = function () { return "pb-f-" + (++fieldSeq); };
  function textField(label, value, onInput, opts) {
    opts = opts || {};
    var id = fid();
    var input = opts.multiline ? h("textarea", { id: id, rows: opts.rows || "4", maxlength: opts.max ? String(opts.max) : null, disabled: opts.disabled }) : h("input", { id: id, type: opts.type || "text", maxlength: opts.max ? String(opts.max) : null, disabled: opts.disabled, list: opts.list || null, placeholder: opts.placeholder || null });
    input.value = value === undefined || value === null ? "" : value;
    input.addEventListener(opts.onChange ? "change" : "input", function () { onInput(input.value); });
    return h("div", { class: "pb-field" }, h("label", { for: id, text: label }), input, opts.hint ? h("p", { class: "pb-hint", text: opts.hint }) : null);
  }
  function selectField(label, value, options, onChange, opts) {
    opts = opts || {};
    var id = fid();
    var sel = h("select", { id: id, disabled: opts.disabled }, options.map(function (o) { return h("option", { value: String(o[0]), text: o[1] }); }));
    sel.value = value === undefined || value === null ? String(options[0][0]) : String(value);
    sel.addEventListener("change", function () { onChange(sel.value); });
    return h("div", { class: "pb-field" }, h("label", { for: id, text: label }), sel);
  }
  function checkField(label, value, onChange, opts) {
    var cb = h("input", { type: "checkbox", disabled: opts && opts.disabled });
    cb.checked = Boolean(value);
    cb.addEventListener("change", function () { onChange(cb.checked); });
    return h("label", { class: "pb-check" }, cb, " " + label);
  }
  document.body.appendChild(h("datalist", { id: "pb-tags" }, (boot.tags || []).map(function (t) { return h("option", { value: t }); })));
  document.body.appendChild(h("datalist", { id: "pb-links" }, boot.links.map(function (l) { return h("option", { value: l.url, label: l.label }); })));
  document.body.appendChild(h("datalist", { id: "pb-scale" }, SPEC.spacingScale.map(function (n) { return h("option", { value: n + "px" }); }).concat(["auto", "100%", "50%"].map(function (v) { return h("option", { value: v }); }))));

  // Contenu de chaque élément (onglet « Contenu »)
  function nodeContentFields(it, box, disabled) {
    var p = it.props || (it.props = {});
    var set = function (k, light) { return function (v) { setProp(it.id, k, v, { key: it.id + ":" + k, light: light !== false }); }; };
    switch (it.type) {
      case "heading":
        box.appendChild(textField("Texte", p.text, set("text"), { max: 200, disabled: disabled, hint: "Ou double-cliquez sur le titre dans la page." }));
        box.appendChild(selectField("Niveau", p.level, [["1", "Titre 1 (un seul par page)"], ["2", "Titre 2"], ["3", "Titre 3"], ["4", "Titre 4"], ["5", "Titre 5"], ["6", "Titre 6"]], set("level", false), { disabled: disabled }));
        break;
      case "text":
        box.appendChild(h("p", { class: "pb-hint", text: "Double-cliquez sur le texte dans la page pour l'écrire directement : gras, italique, liens, listes, couleurs… dans la barre du haut." }));
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, onclick: function () { startEdit(it.id); } }, "Écrire dans la page"));
        break;
      case "list":
        box.appendChild(textField("Points (un par ligne)", (p.items || []).join("\n"), function (v) { setProp(it.id, "items", v.split("\n"), { key: it.id + ":items", light: true }); }, { multiline: true, disabled: disabled }));
        box.appendChild(checkField("Liste numérotée", p.ordered, function (v) { setProp(it.id, "ordered", v); }, { disabled: disabled }));
        break;
      case "quote":
        box.appendChild(textField("Citation", p.text, set("text"), { multiline: true, max: 600, disabled: disabled }));
        box.appendChild(textField("Auteur", p.author, set("author"), { max: 100, disabled: disabled }));
        break;
      case "code":
        box.appendChild(textField("Texte affiché tel quel", p.text, set("text"), { multiline: true, rows: "8", max: 4000, disabled: disabled, hint: "Affiché comme texte, jamais exécuté." }));
        break;
      case "image":
        box.appendChild(mediaPreview(p.src, function (m) { change(function () { var x = byId(it.id); x.props.src = m.path; if (m.alt && !x.props.alt) { x.props.alt = m.alt; delete x.props.decorative; } }); }, disabled));
        box.appendChild(textField("Texte de remplacement", p.alt, function (v) { change(function () { var x = byId(it.id); x.props.alt = v; if (v) delete x.props.decorative; else x.props.decorative = true; }, { key: it.id + ":alt", light: true }); }, { max: 200, disabled: disabled, hint: "Décrit l'image pour les personnes qui ne la voient pas (et pour le référencement). Vide = image décorative." }));
        box.appendChild(textField("Lien au clic (facultatif)", p.link, set("link"), { list: "pb-links", disabled: disabled, placeholder: "/catalogue ou https://…" }));
        box.appendChild(textField("Légende", p.caption, set("caption"), { max: 200, disabled: disabled }));
        break;
      case "gallery":
        (p.images || []).forEach(function (im, i) {
          box.appendChild(h("div", { class: "pb-repeat-item" }, h("img", { src: im.src, alt: "", class: "pb-thumb" }),
            textField("Texte de remplacement " + (i + 1), im.alt, function (v) { change(function () { byId(it.id).props.images[i].alt = v; }, { key: it.id + ":img" + i, light: true }); }, { max: 200, disabled: disabled }),
            h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || p.images.length < 2, onclick: function () { change(function () { byId(it.id).props.images.splice(i, 1); }); } }, "Retirer")));
        });
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || (p.images || []).length >= 24, onclick: function () { openMedia({ title: "Ajouter à la galerie", multiple: true, onPick: function (list) { change(function () { var x = byId(it.id); list.forEach(function (m) { x.props.images.push({ src: m.path, alt: m.alt || "" }); }); }); } }); } }, "Ajouter des images"));
        break;
      case "video":
        box.appendChild(textField("Adresse (YouTube, Vimeo ou fichier https://)", p.url, set("url"), { type: "url", disabled: disabled }));
        box.appendChild(textField("Titre (lu par les lecteurs d'écran)", p.title, set("title"), { max: 150, disabled: disabled }));
        break;
      case "audio":
        box.appendChild(textField("Adresse https:// du fichier", p.src, set("src"), { type: "url", disabled: disabled }));
        box.appendChild(textField("Titre", p.title, set("title"), { max: 150, disabled: disabled }));
        break;
      case "button":
      case "link":
        box.appendChild(textField("Texte", p.label, set("label"), { max: it.type === "button" ? 80 : 120, disabled: disabled }));
        box.appendChild(textField("Adresse", p.url, set("url"), { list: "pb-links", disabled: disabled, placeholder: "/catalogue, /p/… ou https://…", hint: PAGE.funnel ? "/etape-suivante : l'étape suivante du tunnel « " + PAGE.funnel.name + " »." : null }));
        if (it.type === "button") box.appendChild(selectField("Apparence", p.variant, [["primary", "Plein"], ["outline", "Contour"], ["ghost", "Discret"]], set("variant", false), { disabled: disabled }));
        box.appendChild(checkField("Ouvrir dans un nouvel onglet (adresses https:// seulement)", p.newTab, function (v) { setProp(it.id, "newTab", v); }, { disabled: disabled }));
        break;
      case "accordion":
        repeatEditor(box, it, "items", [["q", "Question", 200], ["a", "Réponse (gras, liens…)", 2000, true]], { q: "Nouvelle question ?", a: "La réponse." }, 30, disabled);
        box.appendChild(checkField("Données structurées FAQ (moteurs de recherche)", p.faqSchema, function (v) { setProp(it.id, "faqSchema", v); }, { disabled: disabled }));
        break;
      case "tabs":
        repeatEditor(box, it, "items", [["title", "Titre de l'onglet", 60], ["text", "Contenu (gras, liens…)", 2000, true]], { title: "Nouvel onglet", text: "Contenu." }, 8, disabled);
        break;
      case "table":
        tableEditor(box, it, disabled);
        break;
      case "countdown":
        var d = p.until ? new Date(p.until) : new Date(Date.now() + 7 * 86400000);
        var pad = function (n) { return ("0" + n).slice(-2); };
        var val = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
        box.appendChild(textField("Fin (heure de votre ordinateur)", val, function (v) { var x = new Date(v); if (!isNaN(x)) setProp(it.id, "until", x.toISOString().replace(/\.\d{3}Z$/, "Z")); }, { type: "datetime-local", disabled: disabled, onChange: true }));
        box.appendChild(textField("Texte affiché à la fin", p.endText, set("endText"), { max: 120, disabled: disabled }));
        break;
      case "course":
        box.appendChild(selectField("Formation", p.courseId, boot.courses.map(function (c) { return [c.id, c.title]; }), function (v) { setProp(it.id, "courseId", Number(v)); }, { disabled: disabled }));
        box.appendChild(textField("Texte du bouton", p.cta, set("cta"), { max: 60, disabled: disabled }));
        break;
      case "icon":
        box.appendChild(selectField("Icône", p.name, SPEC.icons.map(function (n) { return [n, n]; }), function (v) { setProp(it.id, "name", v); }, { disabled: disabled }));
        box.appendChild(selectField("Taille", p.size, [["16", "16 px"], ["24", "24 px"], ["32", "32 px"], ["48", "48 px"], ["64", "64 px"]], function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        box.appendChild(textField("Description (si l'icône porte une information)", p.label, set("label"), { max: 80, disabled: disabled }));
        break;
      case "spacer":
        box.appendChild(selectField("Hauteur", p.size, ["8", "16", "24", "32", "48", "64", "80", "96", "128"].map(function (v) { return [v, v + " px"]; }), function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        break;
      default:
        box.appendChild(h("p", { class: "pb-hint", text: kidsOf(it) ? "Conteneur : " + kidsOf(it).length + " élément(s). Sa mise en page (direction, écarts, colonnes, alignement) se règle dans l'onglet Style." : "Aucun contenu à régler : voir l'onglet Style." }));
    }
  }
  function repeatEditor(box, it, key, fields, blank, max, disabled) {
    var list = it.props[key] || [];
    list.forEach(function (row, i) {
      var w = h("div", { class: "pb-repeat-item" }, h("div", { class: "pb-row" }, h("strong", { text: "N° " + (i + 1) }),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || i === 0, "aria-label": "Monter le n° " + (i + 1), onclick: function () { change(function () { var a = byId(it.id).props[key]; var t = a[i - 1]; a[i - 1] = a[i]; a[i] = t; }); } }, icon("arrowUp")),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || list.length < 2, onclick: function () { change(function () { byId(it.id).props[key].splice(i, 1); }); } }, "Retirer")));
      fields.forEach(function (fd) { w.appendChild(textField(fd[1], row[fd[0]], function (v) { change(function () { byId(it.id).props[key][i][fd[0]] = v; }, { key: it.id + ":" + key + i + fd[0], light: true }); }, { max: fd[2], multiline: fd[3], disabled: disabled })); });
      box.appendChild(w);
    });
    if (list.length < max) box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, onclick: function () { change(function () { var x = byId(it.id); x.props[key] = (x.props[key] || []).concat(clone(blank)); }); } }, "Ajouter"));
  }
  function tableEditor(box, it, disabled) {
    var rows = it.props.rows || [];
    var cols = rows.length ? rows[0].length : 1;
    var tbl = h("table", { class: "pb-table-edit" });
    rows.forEach(function (r, i) {
      tbl.appendChild(h("tr", {}, r.map(function (c, j) {
        var inp = h("input", { type: "text", value: c, maxlength: "200", disabled: disabled, "aria-label": "Ligne " + (i + 1) + ", colonne " + (j + 1) });
        inp.addEventListener("input", function () { change(function () { byId(it.id).props.rows[i][j] = inp.value; }, { key: it.id + ":cell" + i + "-" + j, light: true }); });
        return h("td", {}, inp);
      })));
    });
    box.appendChild(h("div", { class: "pb-table-wrap" }, tbl));
    var b = function (label, fn, off) { return h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || off, onclick: function () { change(fn); } }, label); };
    box.appendChild(h("div", { class: "pb-row pb-wrap" },
      b("+ Ligne", function () { byId(it.id).props.rows.push(Array(cols).fill("")); }, rows.length >= 40),
      b("− Ligne", function () { byId(it.id).props.rows.pop(); }, rows.length < 2),
      b("+ Colonne", function () { byId(it.id).props.rows.forEach(function (r) { r.push(""); }); }, cols >= 8),
      b("− Colonne", function () { byId(it.id).props.rows.forEach(function (r) { r.pop(); }); }, cols < 2)));
    box.appendChild(checkField("Première ligne = en-têtes", it.props.header !== false, function (v) { setProp(it.id, "header", v); }, { disabled: disabled }));
    box.appendChild(textField("Légende (facultative)", it.props.caption, function (v) { setProp(it.id, "caption", v, { key: it.id + ":caption", light: true }); }, { max: 150, disabled: disabled }));
  }
  function mediaPreview(src, onPick, disabled) {
    return h("div", { class: "pb-media-pick" }, src ? h("img", { src: src, alt: "", class: "pb-thumb" }) : h("span", { class: "pb-hint", text: "Aucune image" }),
      h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, onclick: function () { openMedia({ title: "Choisir l'image", onPick: onPick }); } }, src ? "Remplacer" : "Choisir"));
  }

  // Sections prêtes (bandeau, formulaire…) : champs de contenu
  var F = {
    hero: [["title", "text", "Titre", 150], ["subtitle", "textarea", "Sous-titre", 300], ["image", "image", "Image"], ["imageAlt", "text", "Description de l'image", 200], ["buttonLabel", "text", "Texte du bouton", 60], ["buttonUrl", "link", "Adresse du bouton"]],
    text: [["markdown", "markdown", "Texte"]],
    image: [["src", "image", "Image"], ["alt", "text", "Description de l'image (obligatoire)", 200], ["caption", "text", "Légende", 200], ["link", "link", "Lien au clic (facultatif)"]],
    list: [["title", "text", "Titre", 150], ["items", "lines", "Points (un par ligne)"]],
    course: [["courseId", "course", "Formation"], ["cta", "text", "Texte du bouton", 60]],
    button: [["label", "text", "Texte", 60], ["url", "link", "Adresse"], ["align", "select", "Position", [["center", "Centré"], ["left", "À gauche"]]]],
    quote: [["text", "textarea", "Citation", 600], ["author", "text", "Auteur", 120]],
    form: [["heading", "text", "Titre", 150], ["intro", "textarea", "Introduction", 400]],
    features: [["title", "text", "Titre", 150], ["intro", "textarea", "Introduction", 400], ["columns", "select", "Colonnes sur ordinateur", [[2, "2"], [3, "3"], [4, "4"]]], ["items", "repeat", "Cartes", { max: 12, blank: { title: "Nouvelle carte", text: "" }, fields: [["title", "Titre", 80], ["text", "Texte", 400, true]] }]],
    faq: [["title", "text", "Titre", 150], ["items", "repeat", "Questions", { max: 20, blank: { q: "Nouvelle question ?", a: "La réponse." }, fields: [["q", "Question", 200], ["a", "Réponse (gras, liens…)", 2000, true]] }]],
    cta: [["title", "text", "Titre", 150], ["text", "textarea", "Texte", 400], ["buttonLabel", "text", "Texte du bouton", 60], ["buttonUrl", "link", "Adresse du bouton"]],
    video: [["url", "text", "Adresse (YouTube, Vimeo ou fichier https://)"], ["title", "text", "Titre (lu par les lecteurs d'écran)", 150], ["caption", "text", "Légende", 200]],
    testimonials: [["title", "text", "Titre", 150], ["items", "repeat", "Témoignages", { max: 12, blank: { text: "Nouveau témoignage.", author: "", role: "" }, fields: [["text", "Témoignage", 600, true], ["author", "Auteur", 120], ["role", "Fonction", 120]] }]],
    divider: [["line", "checkbox", "Afficher une ligne"], ["size", "select", "Hauteur", [["sm", "Petite"], ["md", "Moyenne"], ["lg", "Grande"]]]],
  };
  function legacyContentFields(s, box, disabled) {
    if (s.type === "form") box.appendChild(h("p", { class: "pb-note", text: PAGE.formId ? "Formulaire « " + PAGE.formName + " »" + (PAGE.formPublished ? "" : " (pas encore publié : la page ne pourra pas être publiée)") + ". Champs et consentement se règlent dans le formulaire ; il se choisit dans les réglages de la page." : "Aucun formulaire choisi : choisissez-le dans les réglages de la page (sinon la page ne peut pas être publiée)." }));
    (F[s.type] || []).forEach(function (fd) {
      var key = fd[0], kind = fd[1], label = fd[2], extra = fd[3];
      var set = function (v, light) { setProp(s.id, key, v, { key: s.id + ":" + key, light: light !== false }); };
      if (kind === "repeat") {
        var list = s[key] || [];
        box.appendChild(h("p", { class: "pb-sub", text: label }));
        list.forEach(function (row, i) {
          var w = h("div", { class: "pb-repeat-item" }, h("div", { class: "pb-row" }, h("strong", { text: "N° " + (i + 1) }),
            h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || list.length < 2, onclick: function () { change(function () { byId(s.id)[key].splice(i, 1); }); } }, "Retirer")));
          extra.fields.forEach(function (f) { w.appendChild(textField(f[1], row[f[0]], function (v) { change(function () { byId(s.id)[key][i][f[0]] = v; }, { key: s.id + key + i + f[0], light: true }); }, { max: f[2], multiline: f[3], disabled: disabled })); });
          box.appendChild(w);
        });
        if (list.length < extra.max) box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, onclick: function () { change(function () { var x = byId(s.id); x[key] = (x[key] || []).concat(clone(extra.blank)); }); } }, "Ajouter"));
        return;
      }
      if (kind === "checkbox") { box.appendChild(checkField(label, s[key] !== false, function (v) { set(v, false); }, { disabled: disabled })); return; }
      if (kind === "select") { box.appendChild(selectField(label, s[key], extra, function (v) { set(typeof extra[0][0] === "number" ? Number(v) : v, false); }, { disabled: disabled })); return; }
      if (kind === "course") { box.appendChild(selectField(label, s[key], boot.courses.map(function (c) { return [c.id, c.title]; }), function (v) { set(Number(v), false); }, { disabled: disabled })); return; }
      if (kind === "image") {
        box.appendChild(h("p", { class: "pb-sub", text: label }));
        box.appendChild(mediaPreview(s[key], function (m) { change(function () { var x = byId(s.id); x[key] = m.path; if (key === "src" && !x.alt && m.alt) x.alt = m.alt; if (key === "image" && !x.imageAlt && m.alt) x.imageAlt = m.alt; }); }, disabled));
        if (s[key] && key === "image") box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { set("", false); } }, "Retirer l'image"));
        return;
      }
      if (kind === "lines") { box.appendChild(textField(label, (s[key] || []).join("\n"), function (v) { set(v.split("\n")); }, { multiline: true, disabled: disabled })); return; }
      box.appendChild(textField(label, s[key], set, { multiline: kind === "textarea" || kind === "markdown", rows: kind === "markdown" ? "10" : "4", max: typeof extra === "number" ? extra : null, list: kind === "link" ? "pb-links" : null, disabled: disabled, hint: kind === "markdown" ? "**gras**, *italique*, ## intertitre, listes avec « - », [lien](https://…)." : null }));
    });
  }

  // ---------- Contrôles de style ----------
  var TYPO_TYPES = ["heading", "text", "list", "quote", "code", "button", "link", "accordion", "tabs", "table", "countdown"];
  var MEDIA_TYPES = ["image", "gallery", "video"];
  var GROUP_ORDER = ["layout", "size", "spacing", "typography", "color", "background", "border", "effects", "position", "media"];
  function relevantGroups(it) {
    var g = ["size", "spacing", "color", "border", "effects", "position"];
    var container = !isNode(it) || kidsOf(it);
    if (container) { g.push("layout"); g.push("background"); g.push("typography"); }
    if (isNode(it) && TYPO_TYPES.indexOf(it.type) >= 0) g.push("typography");
    if (isNode(it) && MEDIA_TYPES.indexOf(it.type) >= 0) g.push("media");
    if (isNode(it) && !kidsOf(it)) g.push("layout");
    if (isNode(it) && it.type === "button") g.push("background");
    return GROUP_ORDER.filter(function (k) { return g.indexOf(k) >= 0; });
  }
  var optLabel = function (p, v) { var o = (p.options || []).find(function (x) { return String(x[0]) === String(v); }); return o ? o[1] : v; };
  var lockedAny = function (items) { return !canWrite || items.some(function (x) { return lockedDeep(x.id); }); };
  var idsOf = function (items) { return items.map(function (x) { return x.id; }); };
  function styleControl(items, key) {
    var p = SP[key];
    var it = items[0];
    var own = ownValue(it, key);
    var mixed = items.some(function (x) { return JSON.stringify(ownValue(x, key)) !== JSON.stringify(own); });
    var inh = inheritedValue(it, key);
    var dis = lockedAny(items);
    var id = fid();
    var reset = own !== undefined ? h("button", { type: "button", class: "pb-reset", "data-tip": "Revenir à la valeur héritée", "aria-label": "Effacer « " + p.label + " » pour cet écran", disabled: dis, onclick: function () { setStyle(idsOf(items), key, ""); } }, "↺") : null;
    var label = h("label", { for: id }, p.label);
    var control;
    if (p.kind === "enum") {
      control = h("select", { id: id, disabled: dis }, [h("option", { value: "", text: inh !== undefined ? "Hérité : " + optLabel(p, inh) : "Par défaut" })].concat(p.options.map(function (o) { return h("option", { value: o[0], text: o[1] }); })));
      control.value = mixed || own === undefined ? "" : String(own);
      control.addEventListener("change", function () { setStyle(idsOf(items), key, control.value); });
    } else if (p.kind === "color") {
      control = colorInput(id, own, inh, dis, function (v) { setStyle(idsOf(items), key, v); });
    } else if (p.kind === "number") {
      control = h("input", { id: id, type: "number", step: key === "columns" || key === "zIndex" ? "1" : "0.05", min: key === "opacity" ? "0" : key === "columns" ? "1" : null, max: key === "opacity" ? "1" : key === "columns" ? "12" : null, placeholder: inh !== undefined ? String(inh) : "", disabled: dis });
      control.value = mixed || own === undefined ? "" : String(own);
      control.addEventListener("change", function () { setStyle(idsOf(items), key, control.value === "" ? "" : Number(control.value)); });
    } else {
      control = h("input", { id: id, type: "text", inputmode: "decimal", list: "pb-scale", placeholder: inh !== undefined ? String(inh) : "auto", disabled: dis, autocomplete: "off" });
      control.value = mixed || own === undefined ? "" : String(own);
      control.addEventListener("change", function () {
        var v = parseLength(control.value, key);
        if (v === null) { control.setAttribute("aria-invalid", "true"); toast(p.label + " : valeur invalide (ex. 24px, 50%, 2rem" + (key.indexOf("margin") === 0 || key === "width" || key === "height" ? ", auto" : "") + ").", true); return; }
        control.removeAttribute("aria-invalid");
        setStyle(idsOf(items), key, v);
      });
    }
    return h("div", { class: "pb-field pb-style-field" + (own !== undefined ? " is-set" : "") }, h("div", { class: "pb-row" }, label, reset), control);
  }
  var TOKEN_LABEL = { primary: "Principale", secondary: "Secondaire", accent: "Accent", background: "Fond", surface: "Surface", text: "Texte", muted: "Atténuée", success: "Succès", warning: "Alerte", error: "Erreur", "on-primary": "Sur principale", "on-accent": "Sur accent" };
  function colorInput(id, own, inh, dis, onSet) {
    var isToken = own && own.indexOf("token:") === 0;
    var hex = own && /^#/.test(own) ? own : "#000000";
    if (hex.length === 4) hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    var picker = h("input", { type: "color", value: hex.slice(0, 7), disabled: dis, "aria-label": "Couleur personnalisée" });
    var tokens = h("select", { id: id, disabled: dis }, [h("option", { value: "", text: inh ? "Héritée" : "Par défaut" }), h("option", { value: "custom", text: "Personnalisée" }), h("option", { value: "transparent", text: "Transparente" })].concat(SPEC.colorTokens.map(function (t) { return h("option", { value: "token:" + t, text: "Site : " + (TOKEN_LABEL[t] || t) }); })));
    tokens.value = !own ? "" : isToken || own === "transparent" ? own : "custom";
    var text = h("input", { type: "text", value: own && /^#/.test(own) ? own : "", placeholder: "#rrggbb", maxlength: "9", disabled: dis, "aria-label": "Code couleur" });
    picker.hidden = tokens.value !== "custom"; text.hidden = tokens.value !== "custom";
    tokens.addEventListener("change", function () { if (tokens.value === "custom") { picker.hidden = false; text.hidden = false; onSet(picker.value); } else onSet(tokens.value); });
    picker.addEventListener("change", function () { onSet(picker.value); });
    text.addEventListener("change", function () { var v = text.value.trim(); if (!/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) { toast("Couleur : code #rrggbb attendu.", true); return; } onSet(v.toLowerCase()); });
    return h("div", { class: "pb-color" }, tokens, picker, text);
  }
  // Boîte d'espacement : marges (extérieur) et marges intérieures, comme le modèle de boîte CSS
  function spacingBox(items) {
    var dis = lockedAny(items);
    var cell = function (key, cls) {
      var it = items[0];
      var own = ownValue(it, key), inh = inheritedValue(it, key);
      var inp = h("input", { type: "text", class: "pb-box-input " + cls, list: "pb-scale", "aria-label": SP[key].label, value: own === undefined ? "" : own, placeholder: inh !== undefined ? String(inh).replace("px", "") : "–", disabled: dis, autocomplete: "off" });
      inp.addEventListener("change", function () { var v = parseLength(inp.value, key); if (v === null) { toast(SP[key].label + " : valeur invalide.", true); return; } setStyle(idsOf(items), key, v); });
      return inp;
    };
    return h("div", { class: "pb-boxmodel" }, h("span", { class: "pb-box-label", text: "Marge" }),
      cell("marginTop", "is-mt"), cell("marginRight", "is-mr"), cell("marginBottom", "is-mb"), cell("marginLeft", "is-ml"),
      h("div", { class: "pb-box-inner" }, h("span", { class: "pb-box-label", text: "Intérieur" }), cell("paddingTop", "is-pt"), cell("paddingRight", "is-pr"), cell("paddingBottom", "is-pb"), cell("paddingLeft", "is-pl"), h("span", { class: "pb-box-core", "aria-hidden": "true" })));
  }
  function composedControls(items, group) {
    var it = items[0];
    var dis = lockedAny(items);
    var ids = idsOf(items);
    var out = [];
    if (group === "background") {
      var bg = ownValue(it, "backgroundImage");
      out.push(h("p", { class: "pb-sub", text: "Image de fond" }), mediaPreview(bg && bg.src, function (m) { setStyle(ids, "backgroundImage", { src: m.path }); }, dis));
      if (bg) out.push(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis, onclick: function () { setStyle(ids, "backgroundImage", ""); } }, "Retirer l'image de fond"));
      var g = ownValue(it, "gradient") || null;
      out.push(h("p", { class: "pb-sub", text: "Dégradé" }));
      var from = h("input", { type: "color", value: g && /^#/.test(g.from) ? g.from.slice(0, 7) : "#0277b6", disabled: dis, "aria-label": "Couleur de départ du dégradé" });
      var to = h("input", { type: "color", value: g && /^#/.test(g.to) ? g.to.slice(0, 7) : "#102a3a", disabled: dis, "aria-label": "Couleur d'arrivée du dégradé" });
      var angle = h("input", { type: "number", min: "0", max: "360", step: "1", value: g ? g.angle : 180, disabled: dis, "aria-label": "Angle du dégradé (degrés)", class: "pb-ctx-num" });
      var apply = function () { setStyle(ids, "gradient", { from: from.value, to: to.value, angle: Number(angle.value) || 0 }); };
      if (g) [from, to, angle].forEach(function (x) { x.addEventListener("change", apply); });
      out.push(h("div", { class: "pb-row pb-wrap" }, from, to, angle, h("span", { class: "pb-hint", text: "°" }), g ? h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis, onclick: function () { setStyle(ids, "gradient", ""); } }, "Retirer") : h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: dis, onclick: apply }, "Appliquer")));
    }
    if (group === "position") {
      var t = ownValue(it, "transform") || {};
      var mk = function (k, label) {
        var id = fid();
        var inp = h("input", { id: id, type: "text", value: t[k] === undefined ? "" : t[k], disabled: dis, placeholder: k === "scale" ? "1" : "0" });
        inp.addEventListener("change", function () {
          var next = Object.assign({}, ownValue(byId(it.id), "transform") || {});
          var v = inp.value.trim();
          if (k === "x" || k === "y") { var l = parseLength(v, "top"); if (l === null) { toast(label + " : valeur invalide.", true); return; } if (l) next[k] = l; else delete next[k]; }
          else if (v === "") delete next[k];
          else if (isNaN(Number(v))) { toast(label + " : nombre attendu.", true); return; }
          else next[k] = Number(v);
          setStyle(ids, "transform", Object.keys(next).length ? next : "");
        });
        return h("div", { class: "pb-field pb-mini" }, h("label", { for: id, text: label }), inp);
      };
      out.push(h("p", { class: "pb-sub", text: "Transformation" }), h("div", { class: "pb-grid-2" }, mk("x", "Décalage X"), mk("y", "Décalage Y"), mk("rotate", "Rotation (°)"), mk("scale", "Échelle")));
    }
    return out;
  }
  function styleTab(items, box) {
    var it = items[0];
    box.appendChild(h("p", { class: "pb-note", text: "Écran modifié : " + bpLabel(device) + (device === "desktop" ? " (les autres écrans en héritent ; changez d'écran en haut à droite)." : " (les champs vides héritent de l'écran plus grand).") }));
    var states = h("div", { class: "pb-seg", role: "radiogroup", "aria-label": "État de l'élément" }, [{ key: "normal", label: "Normal" }].concat(SPEC.states).map(function (s) {
      return h("button", { type: "button", role: "radio", "aria-checked": String(styleState === s.key), onclick: function () { styleState = s.key; renderInspector(); renderContext(); } }, s.label);
    }));
    box.appendChild(states);
    if (styleState !== "normal") box.appendChild(h("p", { class: "pb-hint", text: "Style appliqué au " + { hover: "survol de la souris", focus: "focus au clavier", active: "moment du clic" }[styleState] + ", sur tous les écrans." }));
    relevantGroups(it).forEach(function (g) {
      var keys = SPEC.styleProps.filter(function (p) { return p.group === g && g !== "spacing"; }).map(function (p) { return p.key; });
      if (g === "layout" && isNode(it) && !kidsOf(it)) keys = ["alignSelf", "display"];
      var det = h("details", { class: "pb-acc" });
      if (store.get("open-" + g, ["layout", "spacing", "typography", "color"].indexOf(g) >= 0)) det.open = true;
      det.addEventListener("toggle", function () { store.set("open-" + g, det.open); });
      det.appendChild(h("summary", { text: SPEC.groups[g] }));
      var inner = h("div", { class: "pb-acc-body" });
      if (g === "spacing") inner.appendChild(spacingBox(items));
      keys.forEach(function (k) { inner.appendChild(styleControl(items, k)); });
      composedControls(items, g).forEach(function (x) { inner.appendChild(x); });
      det.appendChild(inner);
      box.appendChild(det);
    });
    if (!isNode(it) && LEGACY[it.type]) legacyLayout(items, box);
  }
  // Préréglages des sections prêtes (espacement, fond, largeur, alignement du design system)
  var STYLE = {
    padding: [["", "Par défaut"], ["none", "Aucun"], ["sm", "Petit"], ["md", "Moyen"], ["lg", "Grand"], ["xl", "Très grand"]],
    background: [["default", "Aucun"], ["surface", "Surface"], ["primary", "Couleur principale"], ["accent", "Accent"], ["dark", "Foncé"]],
    align: [["", "Par défaut"], ["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]],
    width: [["normal", "Normale"], ["narrow", "Étroite"], ["wide", "Large"], ["full", "Pleine largeur"]],
  };
  var STYLE_LABEL = { padding: "Espacement vertical (design system)", background: "Fond (design system)", align: "Alignement du texte", width: "Largeur (design system)" };
  function legacyLayout(items, box) {
    var det = h("details", { class: "pb-acc", open: true }, h("summary", { text: "Préréglages du site" }));
    var inner = h("div", { class: "pb-acc-body" });
    var dis = lockedAny(items);
    Object.keys(STYLE).forEach(function (k) {
      var vals = items.map(function (s) { return (s.style && s.style[k]) || ""; });
      inner.appendChild(selectField(STYLE_LABEL[k], vals[0] || STYLE[k][0][0], STYLE[k], function (v) {
        change(function () { items.forEach(function (s0) { var s = byId(s0.id); s.style = Object.assign({}, s.style); if (!v || v === "default" || v === "normal") delete s.style[k]; else s.style[k] = v; if (!Object.keys(s.style).length) delete s.style; }); });
      }, { disabled: dis }));
    });
    det.appendChild(inner);
    box.appendChild(det);
  }

  // ---------- Informations (selon la sélection : uniquement des données réelles du modèle et du canevas) ----------
  var KIND_LABEL = { layout: "Section", container: "Conteneur", columns: "Colonnes", column: "Colonne", grid: "Grille", stack: "Pile", group: "Groupe" };
  function measured(id) {
    var doc = frame.contentDocument;
    var el = doc && doc.querySelector('[data-node-id="' + id + '"],[data-section-id="' + id + '"]');
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), el: el };
  }
  function infoRows(it) {
    var rows = [];
    var add = function (k, v) { if (v !== undefined && v !== null && v !== "") rows.push([k, String(v)]); };
    if (!it) {
      var count = 0; walk(function () { count += 1; });
      add("Nom", PAGE.name);
      add("Adresse", "/p/" + PAGE.slug);
      add("Statut", $("[data-pb-status]").textContent);
      add("Sections", content.sections.length);
      add("Éléments", count - content.sections.length);
      add("Écran affiché", bpLabel(device) + " · " + WIDTH[device] + " px de large");
      add("Zoom", Math.round(zoom * 100) + " %");
      add("Enregistrement", $("[data-pb-save]").textContent || "—");
      return rows;
    }
    var l = locate(it.id);
    var p = it.props || {};
    var m = measured(it.id);
    var node = isNode(it);
    add("Type", KIND_LABEL[it.type] || (node ? typeLabel(it) + (it.type === "heading" ? " (H" + p.level + ")" : it.type === "text" ? " (texte riche)" : it.type === "list" ? (p.ordered ? " (numérotée)" : " (à puces)") : "") : (LEGACY[it.type] ? LEGACY[it.type].label : typeLabel(it)) + " (section prête)"));
    add("Nom", it.name || "—");
    add("Identifiant", it.id);
    add("Parent", l && l.parent ? nameOf(l.parent) : "Page");
    if (kidsOf(it)) add("Enfants", kidsOf(it).length + (countDeep(it) > kidsOf(it).length ? " (" + countDeep(it) + " au total)" : ""));
    if (m) add("Dimensions affichées", m.w + " × " + m.h + " px (" + bpLabel(device).toLowerCase() + ")");
    if (node && (it.type === "heading" || it.type === "quote")) add("Contenu", (p.text || "").slice(0, 120));
    if (!node && (it.markdown || it.text)) { var md = String(it.markdown || it.text).replace(/[#*_>\[\]()`-]/g, " ").replace(/\s+/g, " ").trim(); add("Contenu", md.slice(0, 120) + (md.length > 120 ? "…" : "")); }
    if (node && it.type === "text") { var txt = (p.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); add("Contenu", txt.slice(0, 120) + (txt.length > 120 ? "…" : "")); add("Mots", txt ? txt.split(" ").length : 0); }
    if ((node && it.type === "image") || (!node && ((it.type === "hero" && it.image) || (it.type === "image" && it.src)))) {
      var src = p.src || it.src || it.image;
      add("Source", src);
      add("Format", (String(src).split("?")[0].split(".").pop() || "").toUpperCase());
      add("Texte de remplacement", p.decorative ? "Image décorative" : (p.alt || it.alt || it.imageAlt || "manquant"));
      var img = m && (m.el.tagName === "IMG" ? m.el : m.el.querySelector("img"));
      if (img && img.naturalWidth) add("Taille d'origine", img.naturalWidth + " × " + img.naturalHeight + " px");
    }
    if (!node && it.type === "button") { add("Texte", it.label); add("Adresse", it.url); }
    if (node && (it.type === "button" || it.type === "link")) { add("Texte", p.label); add("Adresse", p.url); if (it.type === "button") add("Apparence", { primary: "Plein", outline: "Contour", ghost: "Discret" }[p.variant] || p.variant); add("Nouvel onglet", p.newTab ? "oui" : "non"); }
    if (it.type === "form") { add("Formulaire", PAGE.formName || "aucun (à choisir dans les réglages de la page)"); add("Publié", PAGE.formId ? (PAGE.formPublished ? "oui" : "non : la page ne peut pas être publiée") : "—"); add("Titre", it.heading); }
    if (!node && it.type !== "layout" && it.type !== "form" && it.type !== "button") add("Titre", it.title || it.heading);
    var bps = BPS.filter(function (b) { return it.styles && it.styles[b] && Object.keys(it.styles[b]).length; });
    add("Réglages par écran", bps.length ? bps.map(bpLabel).join(", ") : "aucun (style par défaut)");
    var sts = Object.keys(it.states || {});
    if (sts.length) add("États stylés", sts.map(function (k) { return { hover: "survol", focus: "focus", active: "clic" }[k]; }).join(", "));
    if (it.audience) add("Affiché à", (SPEC.audiences.find(function (a) { return a[0] === it.audience.who; }) || [0, it.audience.who])[1] + (it.audience.value !== undefined ? " " + it.audience.value : ""));
    if (it.hideOn && it.hideOn.length) add("Masqué sur", it.hideOn.map(bpLabel).join(", "));
    add("État", [it.hidden ? "masqué" : "", lockedDeep(it.id) ? "verrouillé" : ""].filter(Boolean).join(", ") || "visible, modifiable");
    return rows;
  }
  var infoOpen = store.get("info-open", true);
  function infoBlock(it) {
    var det = h("details", { class: "pb-info", "data-pb-info": it ? it.id : "page" });
    det.open = infoOpen;
    det.addEventListener("toggle", function () { infoOpen = det.open; store.set("info-open", infoOpen); });
    det.appendChild(h("summary", { text: "Informations" }));
    det.appendChild(h("dl", { class: "pb-meta" }, infoRows(it).reduce(function (all, r) { return all.concat(h("dt", { text: r[0] }), h("dd", { text: r[1] })); }, [])));
    return det;
  }
  // Mesures du canevas changées (nouveau rendu, écran, zoom) : seules les informations sont redessinées
  function refreshInfo() {
    var box = $("[data-pb-info]");
    if (!box) return;
    var it = box.dataset.pbInfo === "page" ? null : byId(box.dataset.pbInfo);
    if (box.dataset.pbInfo !== "page" && !it) return;
    var dl = box.querySelector("dl");
    dl.replaceWith(h("dl", { class: "pb-meta" }, infoRows(it).reduce(function (all, r) { return all.concat(h("dt", { text: r[0] }), h("dd", { text: r[1] })); }, [])));
  }

  // ---------- Inspecteur ----------
  var inspTab = store.get("insp-tab", "content");
  function renderInspector() {
    var box = $("[data-pb-inspector]");
    box.textContent = "";
    fieldSeq = 0;
    var items = selectedItems();
    if (!items.length) {
      box.appendChild(h("div", { class: "pb-insp-head" }, h("p", { class: "pb-kind", text: "Page" }), h("h2", { text: PAGE.name }), h("p", { class: "pb-hint", text: "Cliquez un élément dans la page ou dans les calques pour le régler." })));
      box.appendChild(infoBlock(null));
      box.appendChild(h("p", { class: "pb-note", text: "Titre, description, SEO et couleurs de la page : onglet « Page » du panneau de gauche." }));
      return;
    }
    var it = items[0];
    var multi = items.length > 1;
    var locked = lockedAny(items);
    var l = locate(it.id);
    var crumbs = multi ? null : h("nav", { class: "pb-crumbs", "aria-label": "Parents de l'élément" }, [h("button", { type: "button", onclick: function () { select(null); }, text: "Page" })].concat(l.ancestors.map(function (a) { return h("button", { type: "button", onclick: function () { select(a.id); }, text: nameOf(a) }); })));
    box.appendChild(h("div", { class: "pb-insp-head" }, crumbs, h("p", { class: "pb-kind", text: multi ? "Sélection multiple" : (KIND_LABEL[it.type] || typeLabel(it)) }), h("h2", { text: multi ? items.length + " éléments sélectionnés" : nameOf(it) }), h("p", { class: "pb-hint", text: multi ? "Les réglages de style s'appliquent à tous." : typeLabel(it) + (kidsOf(it) ? " · " + kidsOf(it).length + " enfant(s)" : "") })));
    if (!multi) box.appendChild(infoBlock(it));
    if (locked && canWrite) box.appendChild(h("p", { class: "pb-note is-warn", text: "Verrouillé : déverrouillez-le (cadenas dans les calques) pour le modifier, le déplacer ou le supprimer." }));
    var tabs = multi ? [["style", "Style"], ["advanced", "Actions"]] : it.type === "component" ? [["content", "Contenu"], ["advanced", "Avancé"]] : [["content", "Contenu"], ["style", "Style"], ["advanced", "Avancé"]];
    if (!tabs.some(function (t) { return t[0] === inspTab; })) inspTab = tabs[0][0];
    var tablist = h("div", { class: "pb-insp-tabs", role: "tablist", "aria-label": "Réglages de la sélection" });
    tabs.forEach(function (t) { tablist.appendChild(h("button", { type: "button", role: "tab", "aria-selected": String(inspTab === t[0]), onclick: function () { inspTab = t[0]; store.set("insp-tab", inspTab); renderInspector(); } }, t[1])); });
    box.appendChild(tablist);
    var body = h("div", { class: "pb-insp-body", role: "tabpanel" });
    box.appendChild(body);
    if (inspTab === "content") {
      if (it.type === "component") componentInspector(body, it);
      else if (isNode(it)) nodeContentFields(it, body, locked);
      else if (it.type === "layout") body.appendChild(h("p", { class: "pb-hint", text: "Section libre : " + it.children.length + " élément(s). Ajoutez-y des éléments par glisser-déposer, ou sélectionnez-la puis cliquez un élément de la palette." }));
      else legacyContentFields(it, body, locked);
    } else if (inspTab === "style") styleTab(items, body);
    else advancedTab(items, body, locked);
  }
  function advancedTab(items, box, locked) {
    var it = items[0];
    var b = function (label, fn, opts) { return h("button", Object.assign({ type: "button", class: "btn btn-outline btn-sm", onclick: fn }, opts || {}), label); };
    if (items.length === 1) box.appendChild(textField("Nom du calque", it.name, function (v) { rename(it.id, v); }, { max: 60, placeholder: typeLabel(it), onChange: true, disabled: !canWrite }));
    box.appendChild(h("div", { class: "pb-row pb-wrap" },
      b(items.some(function (x) { return x.hidden; }) ? "Afficher" : "Masquer", function () { setFlag(selection.slice(), "hidden", !items.some(function (x) { return x.hidden; })); }, { disabled: !canWrite }),
      b(items.some(function (x) { return x.locked; }) ? "Déverrouiller" : "Verrouiller", function () { setFlag(selection.slice(), "locked", !items.some(function (x) { return x.locked; })); }, { disabled: !canWrite }),
      b("Dupliquer", duplicateSelected, { disabled: !canWrite }),
      b("Copier le style", copyStyle),
      b("Coller le style", pasteStyle, { disabled: !canWrite || locked }),
      items.length > 1 ? b("Grouper", groupSelected, { disabled: !canWrite || locked }) : null,
      items.length === 1 && ["group", "stack", "container"].indexOf(it.type) >= 0 ? b("Dissocier", ungroupSelected, { disabled: !canWrite || locked }) : null,
      b("Supprimer", removeSelected, { class: "btn btn-danger btn-sm", disabled: !canWrite || locked })));
    if (items.length > 1) {
      box.appendChild(h("p", { class: "pb-sub", text: "Aligner (dans leur parent)" }));
      box.appendChild(h("div", { class: "pb-row pb-wrap" }, [["flex-start", "Début"], ["center", "Centre"], ["flex-end", "Fin"], ["stretch", "Étirer"]].map(function (a) { return b(a[1], function () { setStyle(selection.slice(), "alignSelf", a[0]); }, { disabled: !canWrite || locked }); }),
        b("Répartir", distribute, { disabled: !canWrite || locked })));
    }
    if (items.length === 1 && it.type !== "component") box.appendChild(audienceField(it, locked));
    if (items.length === 1 && !isNode(it)) {
      var checks = h("div", { class: "pb-checks" });
      BPS.forEach(function (bp) {
        var cb = h("input", { type: "checkbox", disabled: locked });
        cb.checked = !(it.hideOn || []).includes(bp);
        cb.addEventListener("change", function () {
          var next = BPS.filter(function (x) { return x === bp ? !cb.checked : (it.hideOn || []).includes(x); });
          if (next.length === BPS.length) { cb.checked = true; toast("Une section doit rester visible sur au moins un écran (sinon : « Masquer »).", true); return; }
          change(function () { var s = byId(it.id); if (next.length) s.hideOn = next; else delete s.hideOn; });
        });
        checks.appendChild(h("label", {}, cb, " " + bpLabel(bp)));
      });
      box.appendChild(h("p", { class: "pb-sub", text: "Afficher sur" }));
      box.appendChild(checks);
    }
    if (items.length === 1 && canWrite && it.type !== "component") {
      var form = h("form", { class: "pb-field" });
      var nameInput = h("input", { type: "text", id: "pb-comp-name", maxlength: "80", required: true, placeholder: "Nom du composant" });
      var global = h("input", { type: "checkbox" });
      form.appendChild(h("p", { class: "pb-sub", text: "Composant réutilisable" }));
      form.appendChild(h("label", { for: "pb-comp-name", text: "Enregistrer comme composant" }));
      form.appendChild(nameInput);
      if (PAGE.siteId) form.appendChild(h("label", { class: "pb-check" }, global, " Utilisable par tous les sites (global)"));
      form.appendChild(h("button", { type: "submit", class: "btn btn-outline btn-sm" }, "Enregistrer le composant"));
      form.addEventListener("submit", function (e) { e.preventDefault(); saveAsComponent(it, nameInput.value, !PAGE.siteId || global.checked).then(function () { nameInput.value = ""; }); });
      box.appendChild(form);
    }
  }
  // Personnalisation : à qui s'affiche cet élément (évalué sur la page publique avec ce que le site sait du visiteur)
  function audienceField(it, locked) {
    var wrap = h("div", { class: "pb-field" });
    var a = it.audience || {};
    var id = fid();
    var sel = h("select", { id: id, disabled: locked }, [h("option", { value: "", text: "Tout le monde" })].concat(SPEC.audiences.map(function (o) { return h("option", { value: o[0], text: o[1] }); })));
    sel.value = a.who || "";
    var needsValue = function (w) { return w === "tag" || w === "not_tag" || w === "score_min"; };
    var val = h("input", { type: a.who === "score_min" ? "number" : "text", min: "0", step: "1", maxlength: "60", placeholder: a.who === "score_min" ? "Score minimal" : "Nom de l'étiquette", value: a.value === undefined ? "" : String(a.value), disabled: locked, "aria-label": "Valeur du public d'affichage", list: a.who === "score_min" ? null : "pb-tags" });
    val.hidden = !needsValue(a.who);
    var apply = function () {
      var who = sel.value;
      val.hidden = !needsValue(who);
      val.type = who === "score_min" ? "number" : "text";
      if (needsValue(who) && val.value.trim() === "") { val.focus(); return; }
      change(function () {
        var x = byId(it.id);
        if (!who) delete x.audience;
        else x.audience = needsValue(who) ? { who: who, value: who === "score_min" ? Number(val.value) : val.value.trim() } : { who: who };
      });
    };
    sel.addEventListener("change", apply);
    val.addEventListener("change", apply);
    wrap.appendChild(h("p", { class: "pb-sub", text: "Personnalisation" }));
    wrap.appendChild(h("label", { for: id, text: "Afficher à" }));
    wrap.appendChild(sel);
    wrap.appendChild(val);
    wrap.appendChild(h("p", { class: "pb-hint", text: "Selon ce que le site sait réellement du visiteur : son compte s'il est connecté, ou le contact relié à son navigateur (cookies acceptés). Un visiteur inconnu ne voit que ce qui s'adresse à tout le monde ou aux inconnus." }));
    return wrap;
  }
  // Répartir : le parent commun répartit l'espace entre ses enfants (flex, espacés)
  function distribute() {
    var ls = selection.map(function (id) { return locate(id); }).filter(Boolean);
    var parent = ls[0] && ls[0].parent;
    if (!parent || !ls.every(function (l) { return l.parent === parent; })) { toast("Répartir : choisissez des éléments du même parent.", true); return; }
    if (lockedDeep(parent.id)) { toast("Parent verrouillé.", true); return; }
    change(function () { var s = styleSet(parent, device, "normal", true); s.display = "flex"; s.justifyContent = "space-between"; if (!s.flexDirection) s.flexDirection = parent.type === "columns" ? "row" : "column"; cleanStyles(parent); });
  }
  // Composant synchronisé : sa source se modifie ici, pour TOUTES les pages qui l'affichent
  var compSaveTimer = null;
  function componentInspector(box, s) {
    var c = components.find(function (x) { return x.id === s.componentId; });
    box.appendChild(h("p", { class: "pb-note", text: "Composant synchronisé « " + (c ? c.name : "?") + " » : le modifier ici modifie sa SOURCE, donc toutes les pages qui l'utilisent (enregistré automatiquement ; non concerné par « Annuler »)." }));
    var holder = h("div", {}, h("p", { class: "pb-hint", text: "Chargement du composant…" }));
    box.appendChild(holder);
    fetchComponent(s.componentId).then(function (comp) {
      holder.textContent = "";
      var sec = comp.section;
      if (sec.type === "layout") holder.appendChild(h("p", { class: "pb-hint", text: "Composant fait d'éléments : détachez-le pour modifier ses éléments dans cette page (il devient une copie indépendante)." }));
      else (F[sec.type] || []).forEach(function (fd) {
        if (fd[1] === "repeat" || fd[1] === "image") return;
        holder.appendChild(textField(fd[2], fd[1] === "lines" ? (sec[fd[0]] || []).join("\n") : sec[fd[0]], function (v) {
          sec[fd[0]] = fd[1] === "lines" ? v.split("\n") : v;
          clearTimeout(compSaveTimer);
          compSaveTimer = setTimeout(function () { api("POST", "/marketing/site-web/composants/" + comp.id, { section: sec }).then(function () { toast("Source du composant enregistrée (toutes les pages)."); scheduleRender(); }, apiFail); }, 800);
        }, { multiline: fd[1] === "textarea" || fd[1] === "markdown" || fd[1] === "lines", disabled: !canWrite || lockedDeep(s.id) }));
      });
      if (canWrite) holder.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () {
        change(function () { var l = locate(s.id); var copy = markSection(reId(clone(sec))); copy.id = s.id; ensureIds([copy]); if (s.hideOn) copy.hideOn = s.hideOn; if (s.name) copy.name = s.name; l.list[l.index] = copy; });
        toast("Composant détaché : cette section est maintenant une copie indépendante.");
      } }, "Détacher (copie indépendante)"));
    }, function (err) { holder.textContent = ""; holder.appendChild(h("p", { class: "pb-note is-warn", text: err.message })); });
  }

  // ---------- Barre contextuelle (selon la sélection) ----------
  function ctxSelect(label, key, items, options) {
    var p = SP[key];
    var own = ownValue(items[0], key);
    var sel = h("select", { "aria-label": label || p.label, "data-tip": label || p.label, disabled: lockedAny(items) }, [h("option", { value: "", text: (label || p.label) + "…" })].concat((options || p.options).map(function (o) { return h("option", { value: o[0], text: o[1] }); })));
    sel.value = own === undefined ? "" : String(own);
    sel.addEventListener("change", function () { setStyle(idsOf(items), key, key === "columns" && sel.value ? Number(sel.value) : sel.value); });
    return sel;
  }
  function ctxLength(label, key, items, width) {
    var own = ownValue(items[0], key), inh = inheritedValue(items[0], key);
    var inp = h("input", { type: "text", class: "pb-ctx-num", style: "width:" + (width || 64) + "px", "aria-label": label, "data-tip": label, list: "pb-scale", value: own === undefined ? "" : own, placeholder: inh !== undefined ? String(inh) : label, disabled: lockedAny(items) });
    inp.addEventListener("change", function () {
      var v = key === "lineHeight" ? (inp.value.trim() === "" ? "" : Number(inp.value.replace(",", "."))) : parseLength(inp.value, key);
      if (v === null || (key === "lineHeight" && v !== "" && (isNaN(v) || v < 0.8 || v > 3))) { toast(label + " : valeur invalide.", true); return; }
      setStyle(idsOf(items), key, v);
    });
    return inp;
  }
  function ctxColor(label, key, items) {
    var own = ownValue(items[0], key);
    var inp = h("input", { type: "color", "aria-label": label, "data-tip": label, value: own && /^#/.test(own) ? own.slice(0, 7) : "#000000", disabled: lockedAny(items) });
    inp.addEventListener("change", function () { setStyle(idsOf(items), key, inp.value); });
    return h("span", { class: "pb-ctx-color" + (own ? " is-set" : "") }, inp);
  }
  function ctxAlign(items, key, values) {
    var own = ownValue(items[0], key);
    return h("span", { class: "pb-seg pb-seg-icons", role: "group", "aria-label": SP[key].label }, values.map(function (v) {
      return h("button", { type: "button", "aria-pressed": String(own === v[0]), "aria-label": v[1], "data-tip": v[1], disabled: lockedAny(items), onclick: function () { setStyle(idsOf(items), key, own === v[0] ? "" : v[0]); } }, icon(v[2]));
    }));
  }
  var ctxSep = function () { return h("span", { class: "pb-ctx-sep", "aria-hidden": "true" }); };
  function renderContext() {
    var bar = $("[data-pb-context]");
    bar.textContent = "";
    if (editing && editing.rich) { richToolbar(bar); return; }
    var items = selectedItems();
    if (!items.length) { bar.appendChild(h("span", { class: "pb-ctx-hint", text: "Écran : " + bpLabel(device) + (device === "desktop" ? "" : " — vos réglages s'appliquent à cet écran") })); return; }
    var it = items[0];
    var same = items.every(function (x) { return x.type === it.type; });
    bar.appendChild(h("span", { class: "pb-ctx-name", text: items.length > 1 ? items.length + " éléments" : typeLabel(it) }));
    if (styleState !== "normal") bar.appendChild(h("span", { class: "pb-ctx-state", text: { hover: "Survol", focus: "Focus", active: "Clic" }[styleState] }));
    if (items.length > 1) {
      bar.appendChild(h("button", { type: "button", class: "pb-ctx-btn", disabled: !canWrite, onclick: groupSelected }, "Grouper"));
      bar.appendChild(ctxAlign(items, "alignSelf", [["flex-start", "Aligner au début", "alignLeft"], ["center", "Centrer", "alignCenter"], ["flex-end", "Aligner à la fin", "alignRight"]]));
      bar.appendChild(h("button", { type: "button", class: "pb-ctx-btn", disabled: !canWrite, onclick: distribute }, "Répartir"));
      return;
    }
    if (same && isNode(it) && TYPO_TYPES.indexOf(it.type) >= 0) {
      bar.appendChild(ctxSelect("Police", "fontFamily", items));
      bar.appendChild(ctxLength("Taille", "fontSize", items, 60));
      bar.appendChild(ctxSelect("Graisse", "fontWeight", items));
      bar.appendChild(ctxColor("Couleur du texte", "color", items));
      bar.appendChild(ctxSep());
      bar.appendChild(ctxAlign(items, "textAlign", [["left", "Aligner à gauche", "alignLeft"], ["center", "Centrer", "alignCenter"], ["right", "Aligner à droite", "alignRight"], ["justify", "Justifier", "alignJustify"]]));
      bar.appendChild(ctxLength("Interligne", "lineHeight", items, 50));
      bar.appendChild(ctxLength("Espacement des lettres", "letterSpacing", items, 56));
      bar.appendChild(ctxSelect("Casse", "textTransform", items));
    }
    if (it.type === "button") {
      bar.appendChild(ctxSep());
      bar.appendChild(ctxColor("Fond du bouton", "backgroundColor", items));
      bar.appendChild(ctxLength("Arrondi", "borderRadius", items, 56));
      bar.appendChild(ctxSelect("Largeur", "width", items, [["auto", "Largeur auto"], ["100%", "Toute la largeur"]]));
      bar.appendChild(ctxAlign(items, "alignSelf", [["flex-start", "À gauche", "alignLeft"], ["center", "Centré", "alignCenter"], ["flex-end", "À droite", "alignRight"]]));
      bar.appendChild(h("button", { type: "button", class: "pb-ctx-btn", onclick: function () { inspTab = "style"; styleState = "hover"; renderInspector(); renderContext(); } }, "Survol…"));
    }
    if (it.type === "image") {
      bar.appendChild(h("button", { type: "button", class: "pb-ctx-btn", disabled: lockedAny(items), onclick: function () { openMedia({ title: "Remplacer l'image", onPick: function (m) { change(function () { var x = byId(it.id); x.props.src = m.path; if (m.alt && !x.props.alt) { x.props.alt = m.alt; delete x.props.decorative; } }); } }); } }, icon("image"), "Remplacer"));
      bar.appendChild(ctxSelect("Cadrage", "objectFit", items));
      bar.appendChild(ctxSelect("Proportions", "aspectRatio", items));
      bar.appendChild(ctxLength("Arrondi", "borderRadius", items, 56));
      bar.appendChild(ctxSelect("Ombre", "boxShadow", items));
      bar.appendChild(ctxLength("Largeur", "width", items, 64));
    }
    if (!isNode(it) || kidsOf(it)) {
      bar.appendChild(ctxColor("Couleur de fond", "backgroundColor", items));
      bar.appendChild(ctxLength("Intérieur haut", "paddingTop", items, 60));
      bar.appendChild(ctxLength("Intérieur bas", "paddingBottom", items, 60));
      if (kidsOf(it)) bar.appendChild(ctxLength("Écart entre enfants", "gap", items, 56));
      if (it.type === "grid") bar.appendChild(ctxSelect("Colonnes", "columns", items, [1, 2, 3, 4, 5, 6].map(function (n) { return [n, n + " colonne" + (n > 1 ? "s" : "")]; })));
      bar.appendChild(ctxLength("Largeur max.", "maxWidth", items, 70));
      bar.appendChild(ctxSelect("Arrondi", "borderRadius", items, [["0", "Sans arrondi"], ["8px", "8 px"], ["12px", "12 px"], ["16px", "16 px"], ["24px", "24 px"]]));
    }
    if (INLINE[it.type] && canWrite) bar.appendChild(h("button", { type: "button", class: "pb-ctx-btn", disabled: lockedDeep(it.id), onclick: function () { startEdit(it.id); } }, icon("edit"), "Écrire"));
  }

  // ---------- Édition directe dans le canevas ----------
  // plain : texte simple (titre, bouton, lien, citation) ; rich : texte riche (barre de mise en forme en haut)
  var INLINE = { heading: "plain", button: "plain", link: "plain", quote: "plain", text: "rich" };
  function startEdit(id) {
    var it = byId(id);
    if (!it || !INLINE[it.type] || !canWrite) return;
    if (lockedDeep(id)) { toast("Élément verrouillé.", true); return; }
    var doc = frame.contentDocument;
    var el = doc && doc.querySelector('[data-node-id="' + id + '"]');
    if (!el) return;
    if (it.type === "quote") el = el.querySelector("p") || el;
    if (editing) commitEdit();
    if (selection.length !== 1 || selection[0] !== id) { selection = [id]; markTreeSelection(); renderInspector(); }
    editing = { id: id, el: el, rich: INLINE[it.type] === "rich", before: it.type === "text" ? el.innerHTML : el.textContent };
    $$(".pb-handle", doc).forEach(function (x) { x.remove(); });
    el.setAttribute("contenteditable", "true");
    el.classList.add("pb-editing");
    el.focus();
    var range = doc.createRange(); range.selectNodeContents(el); range.collapse(false);
    var sel = frame.contentWindow.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    renderContext();
    toast(editing.rich ? "Écriture directe : mise en forme dans la barre du haut ; Échap pour annuler, clic ailleurs pour valider." : "Écriture directe : Entrée pour valider, Échap pour annuler.");
  }
  function commitEdit(cancel) {
    if (!editing) return;
    var ed = editing;
    editing = null;
    ed.el.removeAttribute("contenteditable");
    ed.el.classList.remove("pb-editing");
    var it = byId(ed.id);
    if (!cancel && it) {
      if (ed.rich) {
        var html = ed.el.innerHTML.trim();
        if (!ed.el.textContent.trim()) { toast("Un texte ne peut pas être vide : supprimez l'élément s'il ne sert plus.", true); pendingRender = true; }
        else if (html !== ed.before) setProp(ed.id, "html", html);
      } else {
        var text = ed.el.textContent.replace(/\s+/g, " ").trim();
        var key = it.type === "button" || it.type === "link" ? "label" : "text";
        if (!text) { toast("Le texte ne peut pas être vide.", true); pendingRender = true; }
        else if (text !== String(ed.before).replace(/\s+/g, " ").trim()) setProp(ed.id, key, text);
      }
    } else pendingRender = true;
    renderContext();
    renderInspector();
    if (pendingRender) { pendingRender = false; scheduleRender(); }
    else drawOverlays();
  }
  // Barre de mise en forme du texte riche (agit sur la sélection dans le canevas)
  function richToolbar(bar) {
    var doc = frame.contentDocument;
    var exec = function (cmd, value) { doc.execCommand(cmd, false, value === undefined ? null : value); if (editing) editing.el.focus(); };
    var keepFocus = function (b) { b.addEventListener("mousedown", function (e) { e.preventDefault(); }); return b; };
    var btn = function (label, ic, cmd, value) {
      var b = keepFocus(h("button", { type: "button", class: "pb-ctx-btn pb-ctx-icon", "aria-label": label, "data-tip": label }, icon(ic)));
      b.addEventListener("click", function () { if (typeof cmd === "function") cmd(); else exec(cmd, value); });
      return b;
    };
    var txt = function (label, text, cmd, cls) {
      var b = keepFocus(h("button", { type: "button", class: "pb-ctx-btn pb-ctx-icon " + (cls || ""), "aria-label": label, "data-tip": label }, text));
      b.addEventListener("click", function () { exec(cmd); });
      return b;
    };
    bar.appendChild(h("span", { class: "pb-ctx-name", text: "Texte" }));
    var block = h("select", { "aria-label": "Type de paragraphe", "data-tip": "Type de paragraphe" }, [["p", "Paragraphe"], ["h2", "Intertitre 2"], ["h3", "Intertitre 3"], ["h4", "Intertitre 4"], ["blockquote", "Citation"]].map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
    block.addEventListener("change", function () { exec("formatBlock", "<" + block.value + ">"); });
    bar.appendChild(block);
    bar.appendChild(txt("Gras (Ctrl/⌘ + B)", "G", "bold", "is-bold"));
    bar.appendChild(txt("Italique (Ctrl/⌘ + I)", "I", "italic", "is-italic"));
    bar.appendChild(txt("Souligné (Ctrl/⌘ + U)", "S", "underline", "is-underline"));
    bar.appendChild(txt("Barré", "B", "strikeThrough", "is-strike"));
    bar.appendChild(txt("Exposant", "x²", "superscript"));
    bar.appendChild(txt("Indice", "x₂", "subscript"));
    bar.appendChild(ctxSep());
    var color = keepFocus(h("input", { type: "color", "aria-label": "Couleur du texte sélectionné", "data-tip": "Couleur du texte", value: "#102a3a" }));
    color.addEventListener("change", function () { doc.execCommand("styleWithCSS", false, true); exec("foreColor", color.value); doc.execCommand("styleWithCSS", false, false); });
    bar.appendChild(color);
    bar.appendChild(btn("Surligner", "highlighter", function () { doc.execCommand("styleWithCSS", false, true); exec("hiliteColor", "#fff3b0"); doc.execCommand("styleWithCSS", false, false); }));
    bar.appendChild(btn("Lien", "link", function () {
      var sel = frame.contentWindow.getSelection();
      var range = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      if (!range || range.collapsed) { toast("Sélectionnez d'abord le texte du lien.", true); return; }
      editing.keep = true;
      ask("Lien", [["url", "link", "Adresse (/catalogue, /p/… ou https://…)"], ["newTab", "checkbox", "Ouvrir dans un nouvel onglet"]], function (v) {
        if (!editing) return;
        editing.keep = false;
        editing.el.focus();
        sel.removeAllRanges(); sel.addRange(range);
        if (!/^(\/(?!\/)|https:\/\/)/.test(v.url)) { toast("Adresse : /… ou https://…", true); return; }
        exec("createLink", v.url);
        if (v.newTab) { var a = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement); a = a && a.closest("a"); if (a) a.setAttribute("target", "_blank"); }
      }, function () { if (editing) { editing.keep = false; editing.el.focus(); sel.removeAllRanges(); sel.addRange(range); } });
    }));
    bar.appendChild(btn("Retirer le lien", "close", "unlink"));
    bar.appendChild(ctxSep());
    bar.appendChild(btn("Liste à puces", "list", "insertUnorderedList"));
    bar.appendChild(btn("Liste numérotée", "listOrdered", "insertOrderedList"));
    bar.appendChild(btn("Augmenter le retrait", "indentMore", "indent"));
    bar.appendChild(btn("Diminuer le retrait", "indentLess", "outdent"));
    bar.appendChild(ctxSep());
    bar.appendChild(btn("Aligner à gauche", "alignLeft", "justifyLeft"));
    bar.appendChild(btn("Centrer", "alignCenter", "justifyCenter"));
    bar.appendChild(btn("Aligner à droite", "alignRight", "justifyRight"));
    bar.appendChild(btn("Effacer la mise en forme", "clearFormat", "removeFormat"));
    var ok = keepFocus(h("button", { type: "button", class: "pb-ctx-btn" }, icon("check"), "Valider"));
    ok.addEventListener("click", function () { commitEdit(); });
    bar.appendChild(ok);
  }

  // ---------- Canevas (rendu réel) ----------
  var renderTimer = null, renderSeq = 0, pendingRender = false;
  var payload = function () { return { sections: content.sections, title: content.title, description: content.description, theme: content.theme, seo: content.seo }; };
  // Pas de nouveau rendu pendant une édition directe ou un geste dans le canevas (guide, poignée) : le document serait
  // remplacé sous la souris ; le rendu attend la fin du geste
  var gesture = false;
  function scheduleRender() { if (editing || gesture) { pendingRender = true; return; } clearTimeout(renderTimer); renderTimer = setTimeout(renderCanvas, 220); }
  function endGesture() { gesture = false; if (pendingRender && !editing) { pendingRender = false; scheduleRender(); } }
  var errorItemId = null;
  // « Section 3 › élément 2 « Titre » : … » → identifiant de l'élément en cause (mis en évidence dans les calques)
  function itemFromError(message) {
    var m = /Section (\d+)((?: › élément \d+(?: « [^»]* »)?)*)/.exec(message || "");
    if (!m) return null;
    var it = content.sections[Number(m[1]) - 1];
    (m[2].match(/élément (\d+)/g) || []).forEach(function (part) { var k = it && kidsOf(it); it = k ? k[Number(part.replace(/\D/g, "")) - 1] : null; });
    return it ? it.id : null;
  }
  function renderCanvas() {
    if (editing || gesture) { pendingRender = true; return; }
    var seq = ++renderSeq;
    fetch("/marketing/pages/" + PAGE.id + "/rendu", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: payload() }) })
      .then(function (r) { return r.text().then(function (text) { return { ok: r.ok, text: text }; }); })
      .then(function (res) {
        if (seq !== renderSeq) return;
        var errBox = $("[data-pb-render-error]");
        if (!res.ok) {
          var msg = "Aperçu non mis à jour.";
          try { msg = JSON.parse(res.text).error.message; } catch (e) { /* réponse non JSON */ }
          errBox.textContent = msg + " Corrigez ce point : l'aperçu et l'enregistrement reprendront.";
          errBox.hidden = false;
          errorItemId = itemFromError(msg);
          markError();
          return;
        }
        errBox.hidden = true;
        if (errorItemId) { errorItemId = null; markError(); }
        if (editing || gesture) { pendingRender = true; return; }
        var y = 0;
        try { y = frame.contentWindow.scrollY; } catch (e) { y = 0; }
        frame.onload = function () { setupCanvas(y); };
        frame.srcdoc = res.text;
      }, function () { var errBox = $("[data-pb-render-error]"); errBox.textContent = "Aperçu indisponible (connexion au serveur interrompue)."; errBox.hidden = false; });
  }
  function markError() { $$(".pb-row-item.is-error", treeEl).forEach(function (r) { r.classList.remove("is-error"); }); if (errorItemId) { var r = treeEl.querySelector('.pb-node[data-id="' + errorItemId + '"] > .pb-row-item'); if (r) r.classList.add("is-error"); } }
  var targetOf = function (e) { return e.target && e.target.closest ? e.target.closest("[data-node-id],[data-section-id]") : null; };
  var idOfEl = function (el) { return el ? el.getAttribute("data-node-id") || el.getAttribute("data-section-id") : null; };
  function setupCanvas(y) {
    var doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    doc.body.classList.add("lp-builder");
    doc.body.classList.toggle("pb-outlines", aids.outlines);
    doc.body.classList.toggle("pb-hand", tool === "hand");
    if (aids.grid) { var g = doc.createElement("div"); g.className = "pb-grid-overlay"; for (var i = 0; i < 12; i++) g.appendChild(doc.createElement("span")); doc.body.appendChild(g); }
    frame.contentWindow.scrollTo(0, y);
    doc.addEventListener("click", function (e) {
      if (selectedGuide) { selectedGuide = null; drawGuides(); }
      if (tool === "hand") { e.preventDefault(); return; }
      if (editing && editing.el.contains(e.target)) return;
      e.preventDefault();
      if (e.target.closest(".pb-handle")) return;
      select(idOfEl(targetOf(e)), e.shiftKey || e.metaKey || e.ctrlKey, { scroll: false });
    });
    doc.addEventListener("dblclick", function (e) {
      var id = idOfEl(targetOf(e));
      var it = id && byId(id);
      if (it && INLINE[it.type]) { e.preventDefault(); startEdit(id); }
    });
    doc.addEventListener("contextmenu", function (e) {
      var id = idOfEl(targetOf(e));
      if (!id || editing) return;
      e.preventDefault();
      if (selection.indexOf(id) < 0) select(id, false, { scroll: false });
      var r = frame.getBoundingClientRect();
      openMenu(r.left + e.clientX * zoom, r.top + e.clientY * zoom);
    });
    doc.addEventListener("keydown", function (e) {
      if (editing) {
        if (e.key === "Escape") { e.preventDefault(); var ed = editing; if (ed.rich) ed.el.innerHTML = ed.before; else ed.el.textContent = ed.before; commitEdit(true); return; }
        if (e.key === "Enter" && !editing.rich) { e.preventDefault(); commitEdit(); return; }
        if ((e.metaKey || e.ctrlKey) && ["b", "i", "u"].indexOf(e.key.toLowerCase()) >= 0 && !editing.rich) e.preventDefault();
        return;
      }
      if (!menu.hidden || document.querySelector("dialog[open]")) return;
      onKey(e);
    });
    doc.addEventListener("focusout", function (e) { if (editing && e.target === editing.el && !editing.keep) setTimeout(function () { if (editing && !editing.keep && doc.activeElement !== editing.el) commitEdit(); }, 150); });
    doc.addEventListener("paste", function (e) {
      if (!editing || editing.rich) return;
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData("text/plain");
      doc.execCommand("insertText", false, text.replace(/\s+/g, " "));
    });
    // Glisser-déposer dans le canevas (depuis la palette, les calques, ou un élément sélectionné du canevas)
    doc.addEventListener("dragstart", function (e) {
      var id = idOfEl(targetOf(e));
      if (!id || editing || !canWrite || lockedDeep(id)) { e.preventDefault(); return; }
      dragIds = selection.indexOf(id) >= 0 ? selection.slice() : [id]; dragNew = null;
      e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "pb-move");
    });
    doc.addEventListener("mousedown", function (e) {
      if (tool === "hand") { panStart(e); return; }
      var el = targetOf(e);
      var id = idOfEl(el);
      if (el && selection.indexOf(id) >= 0 && !editing && canWrite && !lockedDeep(id) && !e.target.closest(".pb-handle")) el.setAttribute("draggable", "true");
    });
    doc.addEventListener("mouseup", function () { $$("[data-node-id][draggable],[data-section-id][draggable]", doc).forEach(function (x) { x.removeAttribute("draggable"); }); });
    doc.addEventListener("dragover", function (e) {
      if (!dragIds && !dragNew) return;
      var t = canvasDropTarget(e);
      if (!t) { hideDropIndicator(); return; }
      e.preventDefault();
      showDropIndicator(t);
    });
    doc.addEventListener("drop", function (e) {
      var t = canvasDropTarget(e);
      hideDropIndicator();
      if (!t) return;
      e.preventDefault();
      performDrop(t.target);
    });
    frame.contentWindow.addEventListener("scroll", function () { drawOverlays(); drawRulers(); }, { passive: true });
    // Position du pointeur reportée sur les règles
    var raf = 0;
    doc.addEventListener("mousemove", function (e) {
      if (!aids.rulers) return;
      pointerPage = { x: e.clientX + frame.contentWindow.scrollX, y: e.clientY + frame.contentWindow.scrollY };
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; drawRulers(); });
    });
    doc.addEventListener("mouseleave", function () { pointerPage = null; drawRulers(); });
    markCanvasSelection(false);
    drawRulers();
    drawGuides();
    refreshInfo();
  }
  // Cible de dépôt dans le canevas : avant / après un élément (selon l'axe de son parent) ou dans un conteneur
  function canvasDropTarget(e) {
    var doc = frame.contentDocument;
    var el = targetOf(e);
    var sample = dragNew ? dragNew.sample : byId((dragIds || [])[0]);
    var placingNode = Boolean(sample && (dragNew ? NT[sample.type] && !sample.section : isNode(sample)));
    if (!el) return { target: { parent: null, index: content.sections.length }, el: null, pos: "end" };
    var l = locate(idOfEl(el));
    if (!l) return null;
    var r = el.getBoundingClientRect();
    var it = l.item;
    var horizontal = false;
    if (l.parent && el.parentElement) { var cs = doc.defaultView.getComputedStyle(el.parentElement); horizontal = (cs.display.indexOf("flex") >= 0 && cs.flexDirection.indexOf("row") === 0) || (cs.display.indexOf("grid") >= 0 && cs.gridTemplateColumns.split(" ").length > 1); }
    var rel = horizontal ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height;
    var accepts = kidsOf(it) && placingNode && !lockedDeep(it.id) && !(dragIds && dragIds.indexOf(it.id) >= 0);
    if (accepts && ((rel > 0.2 && rel < 0.8) || !kidsOf(it).length)) return { target: { parent: it, index: kidsOf(it).length }, el: el, pos: "inside", horizontal: horizontal };
    if (!placingNode && l.parent) {
      var top = l.ancestors[0];
      var te = doc.querySelector('[data-section-id="' + top.id + '"]');
      var tr = te.getBoundingClientRect();
      var after = (e.clientY - tr.top) / tr.height >= 0.5;
      return { target: { parent: null, index: sectionIndex(top) + (after ? 1 : 0) }, el: te, pos: after ? "after" : "before", horizontal: false };
    }
    if (l.parent && lockedDeep(l.parent.id)) return null;
    return { target: { parent: l.parent, index: l.index + (rel >= 0.5 ? 1 : 0) }, el: el, pos: rel >= 0.5 ? "after" : "before", horizontal: horizontal };
  }
  function overlayEl(cls) {
    var doc = frame.contentDocument;
    var el = doc.querySelector("." + cls);
    if (!el) { el = doc.createElement("div"); el.className = cls; doc.body.appendChild(el); }
    return el;
  }
  function pageRect(el) { var r = el.getBoundingClientRect(); var w = frame.contentWindow; return { left: r.left + w.scrollX, top: r.top + w.scrollY, width: r.width, height: r.height }; }
  function showDropIndicator(t) {
    var doc = frame.contentDocument;
    if (!doc) return;
    var line = overlayEl("pb-drop-line"), box = overlayEl("pb-drop-box"), label = overlayEl("pb-drop-label");
    if (!t.el) {
      var main = doc.querySelector(".lp-main") || doc.body;
      var pr = pageRect(main);
      box.style.display = "none";
      line.style.cssText = "left:" + pr.left + "px;top:" + (pr.top + pr.height - 2) + "px;width:" + pr.width + "px;height:3px";
      label.textContent = "Fin de la page (nouvelle section)";
      label.style.cssText = "left:" + pr.left + "px;top:" + Math.max(0, pr.top + pr.height - 24) + "px";
      return;
    }
    var r = pageRect(t.el);
    var parentName = t.target.parent ? nameOf(t.target.parent) : "la page";
    if (t.pos === "inside") {
      line.style.display = "none";
      box.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px";
      label.textContent = "Dans « " + nameOf(t.target.parent) + " » · position " + (t.target.index + 1);
    } else {
      box.style.display = "none";
      if (t.horizontal) line.style.cssText = "left:" + ((t.pos === "after" ? r.left + r.width : r.left) - 1) + "px;top:" + r.top + "px;width:3px;height:" + r.height + "px";
      else line.style.cssText = "left:" + r.left + "px;top:" + ((t.pos === "after" ? r.top + r.height : r.top) - 1) + "px;width:" + r.width + "px;height:3px";
      label.textContent = (t.pos === "after" ? "Après" : "Avant") + " « " + nameOf(byId(idOfEl(t.el))) + " » · dans " + (t.target.parent ? "« " + parentName + " »" : parentName);
    }
    label.style.left = r.left + "px";
    label.style.top = Math.max(0, r.top - 22) + "px";
  }
  function hideDropIndicator() {
    var doc = frame.contentDocument;
    if (!doc) return;
    $$(".pb-drop-line, .pb-drop-box, .pb-drop-label", doc).forEach(function (x) { x.remove(); });
  }
  // Sélection dans le canevas : cadre, nom, dimensions, parent en pointillés, poignées de redimensionnement
  function markCanvasSelection(scroll) {
    var doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    $$(".is-selected", doc).forEach(function (el) { el.classList.remove("is-selected"); });
    selection.forEach(function (id) { var el = doc.querySelector('[data-node-id="' + id + '"],[data-section-id="' + id + '"]'); if (el) el.classList.add("is-selected"); });
    drawOverlays();
    if (scroll && selection.length) {
      var first = doc.querySelector('[data-node-id="' + selection[0] + '"],[data-section-id="' + selection[0] + '"]');
      if (first) { var r = first.getBoundingClientRect(); if (r.top < 0 || r.top > frame.contentWindow.innerHeight - 40) first.scrollIntoView({ block: "center", behavior: "smooth" }); }
    }
  }
  function drawOverlays() {
    var doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    $$(".pb-sel-box, .pb-sel-badge, .pb-parent-box, .pb-handle, .pb-dim", doc).forEach(function (x) { x.remove(); });
    selection.forEach(function (id, n) {
      var el = doc.querySelector('[data-node-id="' + id + '"],[data-section-id="' + id + '"]');
      if (!el) return;
      var r = pageRect(el);
      var box = doc.createElement("div"); box.className = "pb-sel-box"; box.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px"; doc.body.appendChild(box);
      if (n !== 0) return;
      var it = byId(id);
      var badge = doc.createElement("div"); badge.className = "pb-sel-badge"; badge.textContent = nameOf(it) + " · " + Math.round(r.width) + " × " + Math.round(r.height);
      badge.style.left = r.left + "px"; badge.style.top = Math.max(18, r.top) + "px"; doc.body.appendChild(badge);
      var l = locate(id);
      if (l && l.parent) {
        var pe = doc.querySelector('[data-node-id="' + l.parent.id + '"],[data-section-id="' + l.parent.id + '"]');
        if (pe) { var pr = pageRect(pe); var pb = doc.createElement("div"); pb.className = "pb-parent-box"; pb.style.cssText = "left:" + pr.left + "px;top:" + pr.top + "px;width:" + pr.width + "px;height:" + pr.height + "px"; doc.body.appendChild(pb); }
      }
      if (selection.length === 1 && isNode(it) && canWrite && !lockedDeep(id) && !editing) {
        [["e", r.left + r.width, r.top + r.height / 2, "Largeur"], ["s", r.left + r.width / 2, r.top + r.height, "Hauteur"], ["se", r.left + r.width, r.top + r.height, "Largeur et hauteur"]].forEach(function (hd) {
          var hEl = doc.createElement("div"); hEl.className = "pb-handle pb-handle-" + hd[0]; hEl.style.left = hd[1] + "px"; hEl.style.top = hd[2] + "px";
          hEl.setAttribute("title", hd[3]);
          hEl.addEventListener("mousedown", function (e) { resizeStart(e, id, el, hd[0]); });
          doc.body.appendChild(hEl);
        });
      }
    });
  }
  // Redimensionner à la souris : largeur / hauteur en pixels, pour l'écran modifié (par pas de 8 px si magnétisme)
  function resizeStart(e, id, el, dir) {
    e.preventDefault(); e.stopPropagation();
    var doc = frame.contentDocument;
    var start = { x: e.clientX, y: e.clientY, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height };
    var dim = doc.createElement("div"); dim.className = "pb-dim"; doc.body.appendChild(dim);
    gesture = true;
    var snap = function (v) { return aids.snap ? Math.round(v / 8) * 8 : Math.round(v); };
    var cur = { w: null, h: null };
    // Magnétisme : le bord droit / bas se cale sur un guide proche (6 px), sinon sur le pas de 8 px
    var origin = pageRect(el);
    var toGuide = function (edge, list) { if (!aids.snap || aids.guides === false) return null; var best = null; list.forEach(function (g) { if (Math.abs(g - edge) <= 6 && (best === null || Math.abs(g - edge) < Math.abs(best - edge))) best = g; }); return best; };
    var move = function (ev) {
      var gl = guidesFor(), onGuide = false;
      if (dir !== "s") { var w = start.w + ev.clientX - start.x; var gv = toGuide(origin.left + w, gl.v); cur.w = Math.max(16, gv !== null ? Math.round(gv - origin.left) : snap(w)); onGuide = onGuide || gv !== null; el.style.width = cur.w + "px"; }
      if (dir !== "e") { var hh = start.h + ev.clientY - start.y; var gh = toGuide(origin.top + hh, gl.h); cur.h = Math.max(8, gh !== null ? Math.round(gh - origin.top) : snap(hh)); onGuide = onGuide || gh !== null; el.style.height = cur.h + "px"; }
      var r = pageRect(el);
      dim.textContent = Math.round(r.width) + " × " + Math.round(r.height) + (onGuide ? " · calé sur un guide" : "");
      dim.style.left = (r.left + r.width + 8) + "px"; dim.style.top = (r.top + r.height + 8) + "px";
    };
    var up = function () {
      doc.removeEventListener("mousemove", move); doc.removeEventListener("mouseup", up); dim.remove();
      gesture = false;
      if (cur.w === null && cur.h === null) { endGesture(); return; }
      change(function () {
        var s = styleSet(byId(id), device, "normal", true);
        if (cur.w !== null) s.width = cur.w + "px";
        if (cur.h !== null) s.height = cur.h + "px";
      });
      toast("Dimensions enregistrées pour l'écran « " + bpLabel(device) + " ».");
    };
    doc.addEventListener("mousemove", move); doc.addEventListener("mouseup", up);
  }
  // Outil « main » : faire défiler la page en la glissant
  function panStart(e) {
    e.preventDefault();
    var win = frame.contentWindow, doc = frame.contentDocument;
    var sx = e.clientX, sy = e.clientY, oy = win.scrollY, sl = stage.scrollLeft;
    var move = function (ev) { win.scrollTo(0, oy - (ev.clientY - sy)); stage.scrollLeft = sl - (ev.clientX - sx) * zoom; };
    var up = function () { doc.removeEventListener("mousemove", move); doc.removeEventListener("mouseup", up); };
    doc.addEventListener("mousemove", move); doc.addEventListener("mouseup", up);
  }

  // ---------- Écrans, zoom, aides visuelles ----------
  var WIDTH = { desktop: 1280, tablet: 820, mobile: 390 };
  function setDevice(d) {
    if (editing) commitEdit();
    selectedGuide = null;
    device = d;
    $$(".pb-top .pb-devices button").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.device === d)); });
    wrap.dataset.device = d;
    applyZoom();
    renderInspector(); renderContext();
    setTimeout(function () { drawOverlays(); drawGuides(); drawRulers(); refreshInfo(); }, 60);
  }
  $$(".pb-top .pb-devices button").forEach(function (b) { b.addEventListener("click", function () { setDevice(b.dataset.device); }); });
  function applyZoom() {
    var w = WIDTH[device];
    if (zoomFit) zoom = Math.min(1, Math.max(0.25, Math.floor((stage.clientWidth - 48) / w * 100) / 100));
    var hgt = Math.max(400, (stage.clientHeight - 48) / zoom);
    wrap.style.width = w + "px";
    wrap.style.height = hgt + "px";
    wrap.style.transform = "scale(" + zoom + ")";
    wrap.style.marginRight = -((1 - zoom) * w) + "px";
    wrap.style.marginBottom = -((1 - zoom) * hgt) + "px";
    $("[data-pb-zoom='100']").textContent = Math.round(zoom * 100) + " %";
    drawRulers();
    refreshInfo();
  }
  function setZoom(z) { zoomFit = z === "fit"; if (!zoomFit) zoom = Math.min(2, Math.max(0.25, z)); applyZoom(); }
  $$("[data-pb-zoom]").forEach(function (b) { b.addEventListener("click", function () { var v = b.dataset.pbZoom; setZoom(v === "fit" ? "fit" : v === "100" ? 1 : v === "+" ? Math.round((zoom + 0.1) * 10) / 10 : Math.round((zoom - 0.1) * 10) / 10); }); });
  window.addEventListener("resize", function () { if (zoomFit) applyZoom(); else drawRulers(); });
  // La zone du canevas change de taille (panneaux, fenêtre, mise en page initiale) : le cadre suit
  if (window.ResizeObserver) new ResizeObserver(function () { applyZoom(); }).observe(stage);
  function setAid(k, v) {
    aids[k] = v; store.set("aids", aids);
    $$("[data-pb-toggle='" + k + "'], [data-aid='" + k + "']").forEach(function (b) { b.setAttribute("aria-pressed", String(k === "guides" ? v !== false : Boolean(v))); });
    if (k === "rulers") { $("[data-pb-ruler-x]").hidden = !v; $("[data-pb-ruler-y]").hidden = !v; $("[data-pb-ruler-corner]").hidden = !v; $("[data-pb-canvas]").classList.toggle("has-rulers", v); drawRulers(); }
    var doc = frame.contentDocument;
    if (k === "outlines" && doc && doc.body) doc.body.classList.toggle("pb-outlines", v);
    if (k === "grid" && doc && doc.body) {
      var g = doc.querySelector(".pb-grid-overlay");
      if (v && !g) { g = doc.createElement("div"); g.className = "pb-grid-overlay"; for (var i = 0; i < 12; i++) g.appendChild(doc.createElement("span")); doc.body.appendChild(g); }
      if (!v && g) g.remove();
    }
    if (k === "guides" || k === "guidesLocked") { drawGuides(); drawRulers(); }
  }
  $$("[data-pb-toggle]").forEach(function (b) { b.addEventListener("click", function () { setAid(b.dataset.pbToggle, !aids[b.dataset.pbToggle]); }); });

  // ---------- Règles et guides ----------
  // Coordonnées : celles de la page affichée, en pixels CSS (origine : coin haut gauche de la page ; l'axe vertical
  // suit le défilement de la page). Le zoom ne change que l'échelle d'affichage. Les guides sont une préférence
  // d'interface propre à chaque page et à chaque écran (jamais enregistrés dans le contenu de la page).
  var RULER_UNIT = { name: "px", perPx: 1 }; // une autre unité : nombre d'unités par pixel CSS
  var RULER = 20;
  var guides = store.get("guides-" + PAGE.id, {});
  var selectedGuide = null;
  var pointerPage = null;
  var guidesFor = function (d) { var g = guides[d || device]; if (!g) g = guides[d || device] = { h: [], v: [] }; return g; };
  var saveGuides = function () { store.set("guides-" + PAGE.id, guides); };
  function rulerStep() {
    var steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
    for (var i = 0; i < steps.length; i++) if (steps[i] * zoom >= 56) return steps[i];
    return 5000;
  }
  function drawRulers() {
    if (!aids.rulers) return;
    var rx = $("[data-pb-ruler-x]"), ry = $("[data-pb-ruler-y]");
    var cr = $("[data-pb-canvas]").getBoundingClientRect(), fr = frame.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var sy = 0, sx = 0; try { sy = frame.contentWindow.scrollY; sx = frame.contentWindow.scrollX; } catch (e) { sy = 0; }
    var step = rulerStep();
    var minor = step * zoom >= 120 ? step / 10 : step * zoom >= 60 ? step / 5 : step / 2;
    var g = guidesFor();
    var paint = function (cv, len, horizontal, origin, offset, marks, pointer) {
      cv.width = Math.max(1, Math.round((horizontal ? len : RULER) * dpr)); cv.height = Math.max(1, Math.round((horizontal ? RULER : len) * dpr));
      cv.style.width = (horizontal ? len : RULER) + "px"; cv.style.height = (horizontal ? RULER : len) + "px";
      var c = cv.getContext("2d"); c.scale(dpr, dpr);
      c.fillStyle = "#f8fafc"; c.fillRect(0, 0, horizontal ? len : RULER, horizontal ? RULER : len);
      c.strokeStyle = "#cbd5e1"; c.beginPath(); if (horizontal) { c.moveTo(0, RULER - 0.5); c.lineTo(len, RULER - 0.5); } else { c.moveTo(RULER - 0.5, 0); c.lineTo(RULER - 0.5, len); } c.stroke();
      c.fillStyle = "#475569"; c.strokeStyle = "#94a3b8"; c.font = "9px system-ui, sans-serif"; c.lineWidth = 1;
      var from = Math.floor((offset - origin / zoom) / minor) * minor;
      var to = offset + (len - origin) / zoom;
      for (var v = from; v <= to; v += minor) {
        var pos = Math.round(origin + (v - offset) * zoom) + 0.5;
        if (pos < 0 || pos > len) continue;
        var major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
        var half = !major && Math.abs((v * 2) / step - Math.round((v * 2) / step)) < 1e-6;
        var tick = major ? RULER - 4 : half ? 8 : 5;
        c.beginPath();
        if (horizontal) { c.moveTo(pos, RULER - tick); c.lineTo(pos, RULER); } else { c.moveTo(RULER - tick, pos); c.lineTo(RULER, pos); }
        c.stroke();
        if (major) {
          var text = String(Math.round(v * RULER_UNIT.perPx));
          if (horizontal) c.fillText(text, pos + 3, 9);
          else { c.save(); c.translate(9, pos + 3); c.rotate(Math.PI / 2); c.fillText(text, 0, 0); c.restore(); }
        }
      }
      // Guides de cet écran, et position du pointeur dans la page
      c.fillStyle = "#0891b2";
      marks.forEach(function (m) { var p = origin + (m - offset) * zoom; if (p < 0 || p > len) return; c.beginPath(); if (horizontal) { c.moveTo(p - 4, 0); c.lineTo(p + 4, 0); c.lineTo(p, 6); } else { c.moveTo(0, p - 4); c.lineTo(0, p + 4); c.lineTo(6, p); } c.fill(); });
      if (pointer !== null) { var pp = Math.round(origin + (pointer - offset) * zoom) + 0.5; if (pp >= 0 && pp <= len) { c.strokeStyle = "#e11d48"; c.beginPath(); if (horizontal) { c.moveTo(pp, 0); c.lineTo(pp, RULER); } else { c.moveTo(0, pp); c.lineTo(RULER, pp); } c.stroke(); } }
    };
    paint(rx, Math.max(0, cr.width - RULER), true, fr.left - (cr.left + RULER), sx, g.v, pointerPage ? pointerPage.x : null);
    paint(ry, Math.max(0, cr.height - RULER), false, fr.top - (cr.top + RULER), sy, g.h, pointerPage ? pointerPage.y : null);
  }
  stage.addEventListener("scroll", drawRulers, { passive: true });
  // Position dans la page (coordonnées CSS) d'un point de l'écran ; inside : au-dessus de la page affichée
  function pageAt(clientX, clientY) {
    var fr = frame.getBoundingClientRect();
    var win = frame.contentWindow;
    return { x: Math.round((clientX - fr.left) / zoom + win.scrollX), y: Math.round((clientY - fr.top) / zoom + win.scrollY), inside: clientX >= fr.left && clientX <= fr.right && clientY >= fr.top && clientY <= fr.bottom };
  }
  // Guides dans le canevas : lignes en coordonnées de page (elles suivent le défilement et le zoom)
  function drawGuides() {
    var doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    $$(".pb-guide", doc).forEach(function (x) { x.remove(); });
    if (aids.guides === false) return;
    var g = guidesFor();
    var H = doc.documentElement.scrollHeight;
    ["h", "v"].forEach(function (axis) {
      g[axis].forEach(function (pos, i) {
        var el = doc.createElement("div");
        el.className = "pb-guide pb-guide-" + axis + (selectedGuide && selectedGuide.axis === axis && selectedGuide.i === i ? " is-selected" : "") + (aids.guidesLocked ? " is-locked" : "");
        if (axis === "h") el.style.top = pos + "px"; else { el.style.left = pos + "px"; el.style.height = H + "px"; }
        el.setAttribute("title", (axis === "h" ? "Guide horizontal : " : "Guide vertical : ") + pos + " " + RULER_UNIT.name + (aids.guidesLocked ? " (verrouillé)" : " — glisser pour déplacer, hors de la page pour supprimer"));
        el.addEventListener("mousedown", function (e) { guideDrag(e, axis, i, el); });
        el.addEventListener("contextmenu", function (e) { e.preventDefault(); e.stopPropagation(); selectedGuide = { axis: axis, i: i }; drawGuides(); var r = frame.getBoundingClientRect(); guideMenu(r.left + e.clientX * zoom, r.top + e.clientY * zoom); });
        el.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); });
        doc.body.appendChild(el);
      });
    });
  }
  function guideLabel(doc, axis, pos) {
    var lab = doc.querySelector(".pb-guide-label") || doc.body.appendChild(Object.assign(doc.createElement("div"), { className: "pb-guide-label" }));
    var win = frame.contentWindow;
    lab.textContent = pos + " " + RULER_UNIT.name;
    lab.style.left = (axis === "v" ? pos + 6 : win.scrollX + 6) + "px";
    lab.style.top = (axis === "h" ? pos + 6 : win.scrollY + 6) + "px";
    return lab;
  }
  // Déplacer un guide (dans le canevas) ; relâché au bord de la page (vers la règle) : supprimé
  function guideDrag(e, axis, i, el) {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    selectedGuide = { axis: axis, i: i };
    if (aids.guidesLocked) { drawGuides(); toast("Guides verrouillés : clic droit sur une règle pour les déverrouiller."); return; }
    var doc = frame.contentDocument, win = frame.contentWindow;
    gesture = true;
    var moved = false, out = false, cur = guidesFor()[axis][i];
    el.classList.add("is-selected");
    var place = function (v, isOut) {
      moved = true;
      out = isOut;
      cur = Math.max(0, Math.round(v));
      el.style[axis === "h" ? "top" : "left"] = cur + "px";
      el.classList.toggle("is-removing", out);
      if (out) { var l0 = doc.querySelector(".pb-guide-label"); if (l0) l0.textContent = "Relâcher : supprimer"; } else guideLabel(doc, axis, cur);
      drawRulers();
    };
    // Dans la page (coordonnées du canevas) ; vers le bord de la page : suppression
    var move = function (ev) { pointerPage = { x: ev.clientX + win.scrollX, y: ev.clientY + win.scrollY }; place(axis === "h" ? ev.clientY + win.scrollY : ev.clientX + win.scrollX, axis === "h" ? ev.clientY < 4 : ev.clientX < 4); };
    // Hors de la page (règles, panneaux) : le déplacement continue ; relâché du côté de sa règle (au-dessus ou à
    // gauche de la page), le guide est supprimé
    var pmove = function (ev) {
      var fr = frame.getBoundingClientRect(), pp = pageAt(ev.clientX, ev.clientY);
      place(axis === "h" ? pp.y : pp.x, axis === "h" ? ev.clientY < fr.top : ev.clientX < fr.left);
    };
    var finished = false;
    var up = function () {
      if (finished) return;
      finished = true;
      doc.removeEventListener("mousemove", move); doc.removeEventListener("mouseup", up);
      document.removeEventListener("mousemove", pmove); document.removeEventListener("mouseup", up);
      var lab = doc.querySelector(".pb-guide-label"); if (lab) lab.remove();
      if (moved) {
        var g = guidesFor();
        if (out) { g[axis].splice(i, 1); selectedGuide = null; toast("Guide supprimé."); }
        else g[axis][i] = cur;
        saveGuides();
      }
      drawGuides(); drawRulers();
      endGesture();
    };
    doc.addEventListener("mousemove", move); doc.addEventListener("mouseup", up);
    document.addEventListener("mousemove", pmove); document.addEventListener("mouseup", up);
  }
  // Créer un guide en le tirant depuis une règle (horizontale → guide horizontal, verticale → guide vertical)
  function rulerDrag(axis) {
    return function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      if (aids.guides === false) setAid("guides", true);
      var cv = e.currentTarget;
      cv.setPointerCapture(e.pointerId);
      var doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      gesture = true;
      var temp = doc.createElement("div");
      temp.className = "pb-guide pb-guide-" + axis + " is-temp";
      if (axis === "v") temp.style.height = doc.documentElement.scrollHeight + "px";
      temp.style.display = "none";
      doc.body.appendChild(temp);
      var pos = null;
      var move = function (ev) {
        var p = pageAt(ev.clientX, ev.clientY);
        // Guide horizontal : seule la hauteur compte (relâché à côté d'une page étroite, il est créé quand même) ;
        // guide vertical : seule la position horizontale compte
        var fr = frame.getBoundingClientRect(), cv0 = $("[data-pb-canvas]").getBoundingClientRect();
        var inBand = axis === "h" ? ev.clientY >= fr.top && ev.clientY <= fr.bottom && ev.clientX >= cv0.left && ev.clientX <= cv0.right
          : ev.clientX >= fr.left && ev.clientX <= fr.right && ev.clientY >= cv0.top && ev.clientY <= cv0.bottom;
        pos = inBand ? Math.max(0, axis === "h" ? p.y : p.x) : null;
        temp.style.display = pos === null ? "none" : "";
        if (pos !== null) { temp.style[axis === "h" ? "top" : "left"] = pos + "px"; guideLabel(doc, axis, pos); }
        pointerPage = p.inside ? { x: p.x, y: p.y } : null;
        drawRulers();
      };
      var up = function () {
        cv.removeEventListener("pointermove", move); cv.removeEventListener("pointerup", up);
        temp.remove();
        var lab = doc.querySelector(".pb-guide-label"); if (lab) lab.remove();
        if (pos !== null) {
          var g = guidesFor();
          g[axis].push(pos);
          selectedGuide = { axis: axis, i: g[axis].length - 1 };
          saveGuides();
          toast((axis === "h" ? "Guide horizontal" : "Guide vertical") + " à " + pos + " " + RULER_UNIT.name + " (écran " + bpLabel(device).toLowerCase() + "). Glissez-le hors de la page pour le supprimer.");
        }
        drawGuides(); drawRulers();
        endGesture();
      };
      cv.addEventListener("pointermove", move); cv.addEventListener("pointerup", up);
    };
  }
  $("[data-pb-ruler-x]").addEventListener("pointerdown", rulerDrag("h"));
  $("[data-pb-ruler-y]").addEventListener("pointerdown", rulerDrag("v"));
  function removeSelectedGuide() {
    if (!selectedGuide) return false;
    var g = guidesFor();
    if (g[selectedGuide.axis][selectedGuide.i] === undefined) { selectedGuide = null; return false; }
    g[selectedGuide.axis].splice(selectedGuide.i, 1);
    selectedGuide = null;
    saveGuides(); drawGuides(); drawRulers();
    toast("Guide supprimé.");
    return true;
  }
  function clearGuides() { guides[device] = { h: [], v: [] }; selectedGuide = null; saveGuides(); drawGuides(); drawRulers(); toast("Guides de l'écran « " + bpLabel(device) + " » supprimés."); }
  function guideMenu(x, y) {
    var entries = [
      selectedGuide ? ["Supprimer ce guide", removeSelectedGuide, false, "Suppr"] : null,
      [aids.guidesLocked ? "Déverrouiller les guides" : "Verrouiller les guides", function () { setAid("guidesLocked", !aids.guidesLocked); }, false],
      [aids.guides === false ? "Afficher les guides" : "Masquer les guides", function () { setAid("guides", aids.guides === false); }, false],
      ["Supprimer tous les guides de cet écran", clearGuides, !(guidesFor().h.length || guidesFor().v.length)],
    ].filter(Boolean);
    menu.textContent = "";
    entries.forEach(function (en) { menu.appendChild(h("button", { type: "button", role: "menuitem", class: "pb-menu-item", disabled: en[2] || null, tabindex: "-1", onclick: function () { closeMenu(); en[1](); } }, h("span", { text: en[0] }), en[3] ? h("kbd", { text: en[3] }) : null)); });
    menu.hidden = false;
    var r = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + "px";
    menu.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + "px";
    var first = menu.querySelector(".pb-menu-item:not([disabled])"); if (first) first.focus();
  }
  ["[data-pb-ruler-x]", "[data-pb-ruler-y]", "[data-pb-ruler-corner]"].forEach(function (sel) { $(sel).addEventListener("contextmenu", function (e) { e.preventDefault(); selectedGuide = null; guideMenu(e.clientX, e.clientY); }); });

  // ---------- Panneaux redimensionnables ----------
  var main = $("[data-pb-main]");
  function applyPanels() {
    main.style.setProperty("--pb-tools-w", panels.toolsExpanded ? "176px" : "48px");
    main.classList.toggle("is-tools-expanded", Boolean(panels.toolsExpanded));
    main.style.setProperty("--pb-left-w", panels.left + "px");
    main.style.setProperty("--pb-right-w", panels.right + "px");
    main.classList.toggle("is-left-hidden", panels.leftHidden);
    main.classList.toggle("is-right-hidden", panels.rightHidden);
    $("[data-pb-right]").style.setProperty("--pb-layers-h", panels.layers + "%");
    store.set("panels", panels);
    if (zoomFit) applyZoom(); else drawRulers();
  }
  function togglePanel(side) { panels[side + "Hidden"] = !panels[side + "Hidden"]; applyPanels(); renderTools(); }
  $$("[data-pb-resize]").forEach(function (handle) {
    var side = handle.dataset.pbResize;
    var setW = function (w) { panels[side] = Math.min(560, Math.max(200, Math.round(w))); panels[side + "Hidden"] = false; applyPanels(); };
    handle.addEventListener("pointerdown", function (e) {
      e.preventDefault(); handle.setPointerCapture(e.pointerId);
      var sx = e.clientX, sw = panels[side];
      frame.style.pointerEvents = "none";
      var move = function (ev) { setW(side === "left" ? sw + ev.clientX - sx : sw - (ev.clientX - sx)); };
      var up = function () { handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", up); frame.style.pointerEvents = ""; renderTools(); };
      handle.addEventListener("pointermove", move); handle.addEventListener("pointerup", up);
    });
    handle.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); setW(panels[side] + ((e.key === "ArrowRight") === (side === "left") ? 16 : -16)); } });
    handle.addEventListener("dblclick", function () { togglePanel(side); });
  });
  var split = $("[data-pb-split]");
  split.addEventListener("pointerdown", function (e) {
    e.preventDefault(); split.setPointerCapture(e.pointerId);
    var r = $("[data-pb-right]").getBoundingClientRect();
    frame.style.pointerEvents = "none";
    var move = function (ev) { panels.layers = Math.min(80, Math.max(15, Math.round((ev.clientY - r.top) / r.height * 100))); applyPanels(); };
    var up = function () { split.removeEventListener("pointermove", move); split.removeEventListener("pointerup", up); frame.style.pointerEvents = ""; };
    split.addEventListener("pointermove", move); split.addEventListener("pointerup", up);
  });
  split.addEventListener("keydown", function (e) { if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); panels.layers = Math.min(80, Math.max(15, panels.layers + (e.key === "ArrowDown" ? 4 : -4))); applyPanels(); } });

  // ---------- Onglets du panneau gauche ----------
  var tabs = $$(".pb-tabs [role=tab]");
  function openTab(tab) { if (panels.leftHidden) togglePanel("left"); tabs.forEach(function (t) { var on = t === tab; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; document.getElementById(t.getAttribute("aria-controls")).hidden = !on; }); }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { openTab(t); });
    t.addEventListener("keydown", function (e) { if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; openTab(next); next.focus(); });
  });

  // ---------- Réglages de la page (titre, description, SEO, couleurs) ----------
  function renderPageSettings() {
    var box = $("[data-pb-page-settings]");
    if (box.contains(document.activeElement)) return; // saisie en cours : on ne redessine pas
    box.textContent = "";
    var seo = content.seo || {};
    var setC = function (k) { return function (v) { change(function () { content[k] = v; }, { key: "page:" + k, light: true }); }; };
    var setS = function (k) { return function (v) { change(function () { content.seo = Object.assign({}, content.seo); if (v === "" || v === false) delete content.seo[k]; else content.seo[k] = v; }, { key: "seo:" + k, light: true }); }; };
    box.appendChild(h("p", { class: "pb-sub", text: "Page" }));
    box.appendChild(textField("Titre de la page (onglet du navigateur)", content.title, setC("title"), { max: 120, disabled: !canWrite }));
    box.appendChild(textField("Description (aperçu de partage)", content.description, setC("description"), { multiline: true, max: 300, disabled: !canWrite }));
    box.appendChild(h("p", { class: "pb-sub", text: "Référencement (moteur SEO du site)" }));
    box.appendChild(textField("Titre SEO (60 caractères conseillés)", seo.title, setS("title"), { max: 70, disabled: !canWrite, placeholder: content.title }));
    box.appendChild(textField("Méta-description (150 caractères conseillés)", seo.description, setS("description"), { multiline: true, max: 160, disabled: !canWrite }));
    box.appendChild(textField("Adresse canonique (facultative)", seo.canonical, setS("canonical"), { type: "url", disabled: !canWrite, placeholder: (boot.siteUrl || "https://…") + "/p/" + PAGE.slug }));
    box.appendChild(h("p", { class: "pb-sub", text: "Image de partage (Open Graph, X)" }));
    box.appendChild(mediaPreview(seo.ogImage, function (m) { change(function () { content.seo = Object.assign({}, content.seo, { ogImage: m.path }); }); }, !canWrite));
    if (seo.ogImage) box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: !canWrite, onclick: function () { change(function () { content.seo = Object.assign({}, content.seo); delete content.seo.ogImage; }); } }, "Retirer"));
    box.appendChild(checkField("Ne pas indexer cette page (noindex)", seo.noindex, function (v) { change(function () { content.seo = Object.assign({}, content.seo); if (v) content.seo.noindex = true; else delete content.seo.noindex; }); }, { disabled: !canWrite }));
    box.appendChild(h("p", { class: "pb-hint", text: "Adresse (/p/" + PAGE.slug + "), formulaire, étiquettes et indexation générale : dans les réglages de la page. " + (PAGE.indexable ? "Page indexable." : "Page non indexable (voir ses réglages).") }));
    // Vérifications réelles du contenu (titre principal, textes de remplacement)
    var h1 = 0, noAlt = 0;
    var firstHero = content.sections.findIndex(function (x) { return x.type === "hero" && !x.hidden; });
    if (firstHero >= 0) h1++;
    walk(function (it) { if (it.hidden) return; if (it.type === "heading" && it.props && String(it.props.level) === "1") h1++; if (it.type === "image" && it.props && !it.props.alt && !it.props.decorative) noAlt++; if (it.type === "image" && !isNode(it) && !it.alt) noAlt++; });
    box.appendChild(h("p", { class: "pb-sub", text: "Vérifications" }));
    box.appendChild(h("p", { class: "pb-note" + (h1 === 1 ? "" : " is-warn"), text: h1 === 1 ? "Un seul titre principal (H1) : correct." : h1 === 0 ? "Aucun titre principal (H1) : ajoutez un titre de niveau 1." : h1 + " titres principaux (H1) : gardez-en un seul." }));
    box.appendChild(h("p", { class: "pb-note" + (noAlt ? " is-warn" : ""), text: noAlt ? noAlt + " image(s) sans texte de remplacement." : "Toutes les images ont un texte de remplacement (ou sont décoratives)." }));
    if (!PAGE.siteId) {
      box.appendChild(h("p", { class: "pb-sub", text: "Couleurs de la page" }));
      var theme = content.theme || {};
      [["accent", "Couleur principale"], ["background", "Fond"], ["text", "Texte"]].forEach(function (c) {
        var inp = h("input", { type: "color", value: theme[c[0]] || "#000000", disabled: !canWrite, id: "pb-theme-" + c[0] });
        inp.addEventListener("change", function () { change(function () { content.theme = Object.assign({}, content.theme); content.theme[c[0]] = inp.value; }); });
        box.appendChild(h("div", { class: "pb-field pb-inline" }, h("label", { for: "pb-theme-" + c[0], text: c[1] }), inp));
      });
    } else box.appendChild(h("p", { class: "pb-note", text: "Couleurs, polices et espacements viennent du design system du site « " + PAGE.siteName + " » (Site Web → Sites) : les modifier là les applique à toutes ses pages." }));
    box.appendChild(h("a", { class: "btn btn-outline btn-sm", href: "/marketing/pages/" + PAGE.id }, "Réglages et versions de la page"));
  }

  // ---------- Médiathèque ----------
  var mediaDialog = $("[data-pb-media]");
  var mediaOpts = {}, mediaItems = [], mediaChosen = [];
  function openMedia(opts) {
    if (editing) commitEdit();
    mediaOpts = opts || {};
    mediaChosen = [];
    $("#pb-media-title").textContent = mediaOpts.title || "Médiathèque";
    mediaDialog.showModal();
    loadMedia();
  }
  var mediaTimer = null;
  function loadMedia(keep) {
    var q = $("[data-pb-media-q]").value, src = $("[data-pb-media-src]").value;
    $("[data-pb-media-status]").textContent = "Chargement…";
    return api("GET", "/marketing/site-web/medias.json?source=" + encodeURIComponent(src) + "&q=" + encodeURIComponent(q)).then(function (r) {
      mediaItems = r.items;
      if (keep) mediaChosen = mediaChosen.map(function (c) { return mediaItems.find(function (m) { return m.source === c.source && m.id === c.id; }) || c; });
      $("[data-pb-media-status]").textContent = r.items.length ? r.items.length + " image(s)." : "Aucune image" + (q ? " pour cette recherche." : " : envoyez-en une.");
      renderMediaGrid();
    }, function (err) { $("[data-pb-media-status]").textContent = err.message; });
  }
  $("[data-pb-media-q]").addEventListener("input", function () { clearTimeout(mediaTimer); mediaTimer = setTimeout(loadMedia, 250); });
  $("[data-pb-media-src]").addEventListener("change", function () { loadMedia(); });
  var mediaKey = function (m) { return m.source + ":" + m.id; };
  function renderMediaGrid() {
    var grid = $("[data-pb-media-grid]");
    grid.textContent = "";
    mediaItems.forEach(function (m) {
      var chosen = mediaChosen.some(function (x) { return mediaKey(x) === mediaKey(m); });
      var btn = h("button", { type: "button", class: "pb-media-item" + (chosen ? " is-chosen" : ""), "aria-pressed": String(chosen), "aria-label": (m.alt || m.name) + (m.width ? " (" + m.width + " × " + m.height + ")" : ""), onclick: function () { chooseMedia(m); }, ondblclick: function () { chooseMedia(m, true); } },
        h("img", { src: m.path, alt: "", loading: "lazy" }), h("span", { class: "pb-media-name", text: m.name }), m.alt ? null : h("span", { class: "pb-media-flag", text: "Sans texte alt." }));
      grid.appendChild(h("li", {}, btn));
    });
    renderMediaDetail();
  }
  function chooseMedia(m, confirmNow) {
    if (mediaOpts.multiple) {
      var k = mediaKey(m);
      mediaChosen = mediaChosen.some(function (x) { return mediaKey(x) === k; }) ? mediaChosen.filter(function (x) { return mediaKey(x) !== k; }) : mediaChosen.concat(m);
    } else mediaChosen = [m];
    renderMediaGrid();
    if (confirmNow && !mediaOpts.multiple && mediaOpts.onPick) finishMedia();
  }
  function finishMedia() {
    if (!mediaOpts.onPick || !mediaChosen.length) return;
    var pick = mediaOpts.onPick, chosen = mediaChosen.slice(), multiple = mediaOpts.multiple;
    mediaDialog.close();
    pick(multiple ? chosen : chosen[0]);
  }
  function renderMediaDetail() {
    var box = $("[data-pb-media-detail]");
    box.textContent = "";
    var m = mediaChosen[mediaChosen.length - 1];
    if (!m) { box.appendChild(h("p", { class: "pb-hint", text: mediaOpts.onPick ? "Choisissez une image (double-clic pour l'insérer directement)." : "Cliquez une image pour voir ses informations." })); return; }
    box.appendChild(h("img", { src: m.path, alt: "", class: "pb-media-big" }));
    box.appendChild(h("dl", { class: "pb-meta" }, h("dt", { text: "Nom" }), h("dd", { text: m.name }), h("dt", { text: "Dimensions" }), h("dd", { text: m.width ? m.width + " × " + m.height + " px" : "inconnues" }),
      h("dt", { text: "Poids" }), h("dd", { text: m.size ? Math.round(m.size / 1024) + " Ko" : "—" }), h("dt", { text: "Type" }), h("dd", { text: m.mime || "image" }), h("dt", { text: "Adresse" }), h("dd", {}, h("code", { text: m.path })), h("dt", { text: "Bibliothèque" }), h("dd", { text: m.source === "marketing" ? "Marketing" : "Site (gérée dans le Centre de gestion)" })));
    if (m.editable && canWrite) {
      var name = textField("Nom", m.name, function () {}, { max: 120 });
      var alt = textField("Texte de remplacement", m.alt, function () {}, { max: 200 });
      box.appendChild(name); box.appendChild(alt);
      box.appendChild(h("div", { class: "pb-row pb-wrap" },
        h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () {
          api("POST", "/marketing/site-web/medias/" + m.id, { alt: alt.querySelector("input").value, name: name.querySelector("input").value }).then(function (r) { Object.assign(m, r.media); toast("Image mise à jour."); loadMedia(true); }, apiFail);
        } }, "Enregistrer"),
        h("button", { type: "button", class: "btn btn-danger btn-sm", onclick: function () {
          if (!window.confirm("Supprimer définitivement « " + m.name + " » ? (Refusé si une page, un composant ou un modèle d'e-mail l'utilise.)")) return;
          api("POST", "/marketing/site-web/medias/" + m.id + "/supprimer", {}).then(function () { mediaChosen = []; toast("Image supprimée."); loadMedia(); }, apiFail);
        } }, "Supprimer")));
    } else if (!m.editable) box.appendChild(h("p", { class: "pb-hint", text: "Texte de remplacement et suppression : Centre de gestion → Ressources." }));
    if (mediaOpts.onPick) box.appendChild(h("button", { type: "button", class: "btn btn-primary btn-sm", onclick: finishMedia }, mediaOpts.multiple ? "Insérer " + mediaChosen.length + " image(s)" : "Insérer cette image"));
  }
  function uploadFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) { toast("Format accepté : JPEG, PNG, GIF ou WebP.", true); return; }
    if (file.size > 5 * 1048576) { toast("Image trop lourde : 5 Mo au plus.", true); return; }
    var fd = new FormData(); fd.append("file", file);
    $("[data-pb-media-status]").textContent = "Envoi de « " + file.name + " »…";
    api("POST", "/marketing/site-web/medias", fd, true).then(function (r) {
      toast("Image envoyée : ajoutez son texte de remplacement à droite.");
      $("[data-pb-media-src]").value = "all"; $("[data-pb-media-q]").value = "";
      mediaChosen = mediaOpts.multiple ? mediaChosen.concat(r.media) : [r.media];
      loadMedia(true);
    }, function (err) { $("[data-pb-media-status]").textContent = err.message; toast(err.message, true); });
  }
  $("[data-pb-upload]").addEventListener("change", function () { uploadFile(this.files[0]); this.value = ""; });
  var drop = $("[data-pb-drop]");
  ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, "Files") >= 0) { e.preventDefault(); drop.classList.add("is-over"); } }); });
  drop.addEventListener("dragleave", function () { drop.classList.remove("is-over"); });
  drop.addEventListener("drop", function (e) { e.preventDefault(); drop.classList.remove("is-over"); if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]); });
  if (!canWrite) { $(".pb-upload").hidden = true; drop.hidden = true; }

  // ---------- Fenêtre « demande de contenu » ----------
  var askDialog = $("[data-pb-ask]");
  var askDone = null, askCancel = null;
  // fields : [nom, type (text | url | link | course | checkbox), libellé, facultatif]
  function ask(title, fields, done, cancel) {
    $("[data-pb-ask-title]").textContent = title;
    var box = $("[data-pb-ask-fields]");
    box.textContent = "";
    fields.forEach(function (f, i) {
      var id = "pb-ask-" + i;
      if (f[1] === "checkbox") { box.appendChild(h("label", { class: "pb-check" }, h("input", { type: "checkbox", id: id, name: f[0] }), " " + f[2])); return; }
      var input = f[1] === "course" ? h("select", { id: id, name: f[0] }, boot.courses.map(function (c) { return h("option", { value: c.id, text: c.title }); }))
        : h("input", { id: id, name: f[0], type: f[1] === "link" ? "text" : f[1], list: f[1] === "link" ? "pb-links" : null, required: f[3] ? null : true });
      box.appendChild(h("div", { class: "pb-field" }, h("label", { for: id, text: f[2] }), input));
    });
    $("[data-pb-ask-error]").hidden = true;
    askDone = done; askCancel = cancel || null;
    askDialog.showModal();
    var first = box.querySelector("input, select"); if (first) first.focus();
  }
  $("[data-pb-ask-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = {};
    $$("[data-pb-ask-fields] [name]").forEach(function (x) { v[x.name] = x.type === "checkbox" ? x.checked : x.value.trim(); });
    var cb = askDone; askDone = null; askCancel = null;
    askDialog.close();
    if (cb) cb(v);
  });
  askDialog.addEventListener("close", function () { if (askCancel) { var c = askCancel; askCancel = null; askDone = null; c(); } });
  $$("[data-pb-close]").forEach(function (b) { b.addEventListener("click", function () { b.closest("dialog").close(); }); });

  // ---------- Aperçu (fenêtre dans la page, jamais un nouvel onglet d'office) ----------
  var previewDialog = $("[data-pb-preview-dialog]");
  function openPreview() {
    if (editing) commitEdit();
    var go = function () { $("[data-pb-preview-frame]").src = "/marketing/pages/" + PAGE.id + "/apercu?t=" + Date.now(); previewDialog.showModal(); };
    if (dirty && !blocked) { clearTimeout(saveTimer); save().then(go); } else go();
  }
  $("[data-pb-preview]").addEventListener("click", openPreview);
  $$("[data-preview-device]").forEach(function (b) { b.addEventListener("click", function () { $$("[data-preview-device]").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); }); $("[data-pb-preview-frame]").dataset.device = b.dataset.previewDevice; }); });
  previewDialog.addEventListener("close", function () { $("[data-pb-preview-frame]").src = "about:blank"; });

  // ---------- Menu contextuel (clic droit) ----------
  var menu = $("[data-pb-menu]");
  function openMenu(x, y) {
    var items = selectedItems();
    if (!items.length) return;
    var it = items[0];
    var locked = lockedAny(items);
    var l = locate(it.id);
    var entries = [
      INLINE[it.type] && items.length === 1 ? ["Modifier le texte", function () { startEdit(it.id); }, locked, "Entrée"] : null,
      ["Dupliquer", duplicateSelected, !canWrite, "Ctrl+D"],
      ["Copier", function () { copySelected(false); }, false, "Ctrl+C"],
      ["Couper", function () { copySelected(true); }, !canWrite || locked, "Ctrl+X"],
      ["Coller", paste, !canWrite, "Ctrl+V"],
      ["Copier le style", copyStyle, false, "Ctrl+Alt+C"],
      ["Coller le style", pasteStyle, !canWrite || locked, "Ctrl+Alt+V"],
      "-",
      items.length === 1 ? ["Renommer", function () { var row = treeEl.querySelector('.pb-node[data-id="' + it.id + '"] > .pb-row-item'); if (row) startRename(row, it); }, !canWrite, "F2"] : null,
      [items.some(function (z) { return z.hidden; }) ? "Afficher" : "Masquer", function () { setFlag(selection.slice(), "hidden", !items.some(function (z) { return z.hidden; })); }, !canWrite, "Ctrl+Maj+H"],
      [items.some(function (z) { return z.locked; }) ? "Déverrouiller" : "Verrouiller", function () { setFlag(selection.slice(), "locked", !items.some(function (z) { return z.locked; })); }, !canWrite, "Ctrl+Maj+L"],
      items.length > 1 ? ["Grouper", groupSelected, !canWrite || locked, "Ctrl+G"] : null,
      items.length === 1 && ["group", "stack", "container"].indexOf(it.type) >= 0 ? ["Dissocier", ungroupSelected, !canWrite || locked, "Ctrl+Maj+G"] : null,
      l && l.parent ? ["Sélectionner le parent", function () { select(l.parent.id); }, false] : null,
      ["Monter", function () { nudge(-1); }, !canWrite || locked, "Alt+↑"],
      ["Descendre", function () { nudge(1); }, !canWrite || locked, "Alt+↓"],
      ["Ajouter au-dessus…", function () { openCommands("Ajouter", { before: it.id }); }, !canWrite],
      ["Ajouter en dessous…", function () { openCommands("Ajouter", { after: it.id }); }, !canWrite],
      "-",
      ["Supprimer", removeSelected, !canWrite || locked, "Suppr"],
    ].filter(Boolean);
    menu.textContent = "";
    entries.forEach(function (e) {
      if (e === "-") { menu.appendChild(h("div", { class: "pb-menu-sep", role: "separator" })); return; }
      menu.appendChild(h("button", { type: "button", role: "menuitem", class: "pb-menu-item" + (e[0] === "Supprimer" ? " is-danger" : ""), disabled: e[2] || null, tabindex: "-1", onclick: function () { closeMenu(); e[1](); } }, h("span", { text: e[0] }), e[3] ? h("kbd", { text: e[3] }) : null));
    });
    menu.hidden = false;
    var r = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + "px";
    menu.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + "px";
    var first = menu.querySelector(".pb-menu-item:not([disabled])"); if (first) first.focus();
  }
  function closeMenu() { menu.hidden = true; }
  menu.addEventListener("keydown", function (e) {
    var list = $$(".pb-menu-item:not([disabled])", menu);
    var i = list.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); (list[i + 1] || list[0]).focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); (list[i - 1] || list[list.length - 1]).focus(); }
    else if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); closeMenu(); }
  });
  document.addEventListener("mousedown", function (e) { if (!menu.hidden && !menu.contains(e.target)) closeMenu(); });

  // ---------- Palette de commandes (Ctrl/⌘ + K) ----------
  var cmdDialog = $("[data-pb-command-dialog]");
  var cmdAnchor = null, cmdIndex = 0, cmdShown = [];
  function commandList() {
    var has = selection.length > 0;
    var adds = [{ type: "layout", label: "Section libre" }].concat(SPEC.types.map(function (t) { return { type: t.type, label: t.label }; })).concat(boot.types.map(function (t) { return { type: t.type, label: t.label + " (section prête)", legacy: true }; }));
    var list = canWrite ? adds.map(function (a) { return { label: "Ajouter : " + a.label, run: function () { addAt(a.type, a.legacy); } }; }) : [];
    if (canWrite) boot.blocks.forEach(function (b) { list.push({ label: "Ajouter le bloc : " + b.label, run: function () { var btn = $(".pb-block-item[data-block='" + b.key + "']"); if (btn) btn.click(); } }); });
    return list.concat([
      { label: "Ouvrir la médiathèque", run: function () { openMedia({ title: "Médiathèque" }); } },
      { label: "Aperçu", run: openPreview }, { label: "Enregistrer maintenant", run: saveNow, off: !canWrite }, { label: "Publier", run: function () { $("[data-pb-publish]").click(); }, off: !canWrite || $("[data-pb-publish]").hidden },
      { label: "Annuler", run: undo, off: !past.length }, { label: "Rétablir", run: redo, off: !future.length },
      { label: "Dupliquer la sélection", run: duplicateSelected, off: !has || !canWrite }, { label: "Supprimer la sélection", run: removeSelected, off: !has || !canWrite },
      { label: "Grouper", run: groupSelected, off: selection.length < 2 || !canWrite }, { label: "Dissocier", run: ungroupSelected, off: !has || !canWrite },
      { label: "Masquer / afficher", run: function () { setFlag(selection.slice(), "hidden", !selectedItems().some(function (z) { return z.hidden; })); }, off: !has || !canWrite },
      { label: "Verrouiller / déverrouiller", run: function () { setFlag(selection.slice(), "locked", !selectedItems().some(function (z) { return z.locked; })); }, off: !has || !canWrite },
      { label: "Copier le style", run: copyStyle, off: !has }, { label: "Coller le style", run: pasteStyle, off: !has || !canWrite },
      { label: "Sélectionner le parent", run: function () { var l = locate(selection[0]); if (l && l.parent) select(l.parent.id); }, off: !has },
      { label: "Écran : ordinateur", run: function () { setDevice("desktop"); } }, { label: "Écran : tablette", run: function () { setDevice("tablet"); } }, { label: "Écran : mobile", run: function () { setDevice("mobile"); } },
      { label: "Zoom : ajuster à l'écran", run: function () { setZoom("fit"); } }, { label: "Zoom : 100 %", run: function () { setZoom(1); } },
      { label: "Grille : afficher / masquer", run: function () { setAid("grid", !aids.grid); } },
      { label: "Guides : afficher / masquer", run: function () { setAid("guides", aids.guides === false); } },
      { label: aids.guidesLocked ? "Guides : déverrouiller" : "Guides : verrouiller", run: function () { setAid("guidesLocked", !aids.guidesLocked); } },
      { label: "Guides : tout supprimer (cet écran)", run: clearGuides, off: !(guidesFor().h.length || guidesFor().v.length) }, { label: "Contours : afficher / masquer", run: function () { setAid("outlines", !aids.outlines); } }, { label: "Règles : afficher / masquer", run: function () { setAid("rulers", !aids.rulers); } },
      { label: "Panneau des éléments : afficher / masquer", run: function () { togglePanel("left"); } },
      { label: "Calques : tout déplier", run: expandAll }, { label: "Calques : tout replier", run: collapseAll },
      { label: panels.layersCollapsed ? "Calques : déplier le panneau" : "Calques : replier le panneau", run: function () { layersToggle.click(); } }, { label: "Calques et inspecteur : afficher / masquer", run: function () { togglePanel("right"); } },
      { label: "Réglages de la page (SEO, titre)", run: function () { openTab($("#pb-tab-page")); } },
    ]).filter(function (c) { return !c.off; });
  }
  function addAt(type, legacy) {
    var anchor = cmdAnchor; cmdAnchor = null;
    var at;
    if (anchor) {
      var l = locate(anchor.before || anchor.after);
      if (l) {
        var node = !legacy && type !== "layout";
        at = node ? (l.parent || isNode(l.item) ? { parent: l.parent, index: l.index + (anchor.after ? 1 : 0) } : { parent: null, index: sectionIndex(l.item) + (anchor.after ? 1 : 0) }) : { parent: null, index: sectionIndex(l.ancestors[0] || l.item) + (anchor.after ? 1 : 0) };
      }
    }
    if (legacy) addLegacy(type, at); else addElement(type, at);
  }
  function openCommands(prefill, anchor) {
    if (editing) commitEdit();
    cmdAnchor = anchor || null;
    var q = $("[data-pb-cmd-q]");
    q.value = prefill || "";
    cmdIndex = 0;
    cmdDialog.showModal();
    renderCommands();
    q.focus();
  }
  function renderCommands() {
    var words = norm($("[data-pb-cmd-q]").value).split(/\s+/).filter(Boolean);
    cmdShown = commandList().filter(function (c) { var t = norm(c.label); return words.every(function (w) { return t.indexOf(w) >= 0; }); }).slice(0, 80);
    cmdIndex = Math.min(cmdIndex, Math.max(0, cmdShown.length - 1));
    var ul = $("[data-pb-cmd-list]");
    ul.textContent = "";
    cmdShown.forEach(function (c, i) { ul.appendChild(h("li", { role: "option", id: "pb-cmd-" + i, "aria-selected": String(i === cmdIndex), class: i === cmdIndex ? "is-active" : null, onclick: function () { runCommand(i); }, text: c.label })); });
    if (!cmdShown.length) ul.appendChild(h("li", { class: "pb-hint", role: "none", text: "Aucune commande." }));
    $("[data-pb-cmd-q]").setAttribute("aria-activedescendant", cmdShown.length ? "pb-cmd-" + cmdIndex : "");
  }
  function runCommand(i) { var c = cmdShown[i]; if (!c) return; var anchor = cmdAnchor; cmdDialog.close(); cmdAnchor = anchor; c.run(); cmdAnchor = null; }
  $("[data-pb-cmd-q]").addEventListener("input", function () { cmdIndex = 0; renderCommands(); });
  $("[data-pb-cmd-q]").addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); cmdIndex = Math.min(cmdShown.length - 1, cmdIndex + 1); renderCommands(); scrollCmd(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); cmdIndex = Math.max(0, cmdIndex - 1); renderCommands(); scrollCmd(); }
    else if (e.key === "Enter") { e.preventDefault(); runCommand(cmdIndex); }
  });
  function scrollCmd() { var a = $(".pb-cmd-list .is-active"); if (a) a.scrollIntoView({ block: "nearest" }); }
  $("[data-pb-command]").addEventListener("click", function () { openCommands(""); });

  // ---------- Sauvegarde automatique ----------
  var retry = 0;
  var saveEl = $("[data-pb-save]");
  function setSave(text, cls) { saveEl.textContent = text; saveEl.className = "pb-save" + (cls ? " " + cls : ""); }
  function scheduleSave() {
    if (!canWrite) return;
    dirty = true;
    if (!blocked) setSave("Modifications non enregistrées", "is-dirty");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 1000);
    backup();
  }
  function backup() { try { localStorage.setItem("pb-backup-" + PAGE.id, JSON.stringify({ at: Date.now(), revision: revision, content: payload() })); } catch (e) { /* stockage indisponible */ } }
  function save() {
    if (!dirty || blocked) return Promise.resolve();
    if (saving) { clearTimeout(saveTimer); saveTimer = setTimeout(save, 500); return Promise.resolve(); }
    saving = true;
    dirty = false;
    setSave("Enregistrement…");
    return api("PUT", "/marketing/pages/" + PAGE.id + "/brouillon", { content: payload(), revision: revision }).then(function (r) {
      saving = false; retry = 0; revision = r.revision; hasDraft = true;
      updateStatus();
      if (!dirty) { setSave("Enregistré à " + new Date(r.savedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), "is-ok"); try { localStorage.removeItem("pb-backup-" + PAGE.id); } catch (e) { /* rien */ } }
    }, function (err) {
      saving = false; dirty = true; backup();
      if (err.status === 409) { blocked = true; setSave("Non enregistré : page modifiée ailleurs", "is-error"); toast(err.message + " Une copie de votre travail est gardée dans ce navigateur.", true); return; }
      if (err.status === 422) { setSave("Non enregistré : " + err.message, "is-error"); errorItemId = itemFromError(err.message); markError(); return; }
      if (err.status === 403) { blocked = true; setSave("Non enregistré : droits insuffisants", "is-error"); return; }
      retry = Math.min(retry + 1, 5);
      setSave("Erreur d'enregistrement : nouvel essai dans " + (retry * 5) + " s", "is-error");
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, retry * 5000);
    });
  }
  function saveNow() { if (editing) commitEdit(); clearTimeout(saveTimer); if (!dirty) { setSave("Tout est enregistré", "is-ok"); return Promise.resolve(); } return save(); }
  $("[data-pb-save-now]").addEventListener("click", saveNow);
  if (!canWrite) $("[data-pb-save-now]").hidden = true;
  window.addEventListener("beforeunload", function (e) { if (editing) commitEdit(); if (dirty || saving) { backup(); e.preventDefault(); e.returnValue = ""; } });

  // ---------- Statut, publication ----------
  function updateStatus() {
    var el = $("[data-pb-status]");
    var live = status === "published";
    el.textContent = live ? (hasDraft ? "En ligne · modifications non publiées" : "En ligne") : status === "unpublished" ? "Hors ligne" : "Brouillon";
    el.classList.toggle("is-live", live && !hasDraft);
    var pub = $("[data-pb-publish]");
    pub.hidden = !canWrite || (live && !hasDraft) || Boolean(PAGE.abTest);
    pub.textContent = live ? "Publier les modifications" : "Publier";
    if (PAGE.abTest) el.textContent = "Version B d'un test A/B";
  }
  $("[data-pb-publish]").addEventListener("click", function () {
    var btn = this;
    if (editing) commitEdit();
    btn.disabled = true;
    clearTimeout(saveTimer);
    (dirty ? save() : Promise.resolve()).then(function () {
      if (dirty || blocked) { btn.disabled = false; toast("Enregistrez d'abord vos modifications (voir le message en haut).", true); return; }
      return api("POST", "/marketing/pages/" + PAGE.id + "/publier.json", {}).then(function (r) {
        status = "published"; hasDraft = false; revision = r.revision;
        updateStatus();
        toast("Page en ligne (version " + r.version + ") : " + r.url);
      }, apiFail);
    }).then(function () { btn.disabled = false; });
  });
  $("[data-pb-undo]").addEventListener("click", undo);
  $("[data-pb-redo]").addEventListener("click", redo);

  // ---------- Raccourcis clavier ----------
  function onKey(e) {
    var t = e.target;
    var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    var mod = e.metaKey || e.ctrlKey;
    var k = (e.key || "").toLowerCase();
    if (mod && k === "s") { e.preventDefault(); saveNow(); return; }
    if (mod && k === "k") { e.preventDefault(); openCommands(""); return; }
    if (typing || editing) return;
    if (mod && k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && k === "y") { e.preventDefault(); redo(); return; }
    if (mod && (k === "=" || k === "+")) { e.preventDefault(); setZoom(Math.round((zoom + 0.1) * 10) / 10); return; }
    if (mod && k === "-") { e.preventDefault(); setZoom(Math.round((zoom - 0.1) * 10) / 10); return; }
    if (mod && k === "0") { e.preventDefault(); setZoom(1); return; }
    if (e.shiftKey && (e.code === "Digit1" || k === "!")) { e.preventDefault(); setZoom("fit"); return; }
    if (mod && k === "a") { e.preventDefault(); var l0 = selection.length ? locate(selection[0]) : null; selection = (l0 ? l0.list : content.sections).map(function (s) { return s.id; }); markTreeSelection(); renderInspector(); renderContext(); markCanvasSelection(false); return; }
    if (mod && e.altKey && (k === "c" || e.code === "KeyC")) { e.preventDefault(); copyStyle(); return; }
    if (mod && e.altKey && (k === "v" || e.code === "KeyV")) { e.preventDefault(); pasteStyle(); return; }
    if (mod && k === "c") { e.preventDefault(); copySelected(false); return; }
    if (k === "escape") { if (selectedGuide) { selectedGuide = null; drawGuides(); return; } if (selection.length) select(null); return; }
    if ((k === "delete" || k === "backspace") && selectedGuide) { e.preventDefault(); removeSelectedGuide(); return; }
    if (!mod && !e.altKey && !e.shiftKey && k === "r") { e.preventDefault(); setAid("rulers", !aids.rulers); return; }
    if (!canWrite) return;
    if (mod && k === "x") { e.preventDefault(); copySelected(true); return; }
    if (mod && k === "v") { e.preventDefault(); paste(); return; }
    if (mod && k === "d") { e.preventDefault(); duplicateSelected(); return; }
    if (mod && k === "g") { e.preventDefault(); if (e.shiftKey) ungroupSelected(); else groupSelected(); return; }
    if (mod && e.shiftKey && k === "h") { e.preventDefault(); setFlag(selection.slice(), "hidden", !selectedItems().some(function (z) { return z.hidden; })); return; }
    if (mod && e.shiftKey && k === "l") { e.preventDefault(); setFlag(selection.slice(), "locked", !selectedItems().some(function (z) { return z.locked; })); return; }
    if ((k === "delete" || k === "backspace") && selection.length) { e.preventDefault(); removeSelected(); return; }
    if (e.altKey && (k === "arrowup" || k === "arrowdown")) { e.preventDefault(); nudge(k === "arrowup" ? -1 : 1); return; }
    if (k === "enter" && selection.length === 1 && INLINE[(byId(selection[0]) || {}).type]) { e.preventDefault(); startEdit(selection[0]); return; }
    if (!mod && !e.altKey && !e.shiftKey) {
      if (k === "v") setTool("select");
      else if (k === "h") setTool("hand");
      else if (k === "t") addElement("text");
      else if (k === "i") addElement("image");
      else if (k === "b") addElement("button");
    }
  }
  document.addEventListener("keydown", function (e) { if (!menu.hidden || document.querySelector("dialog[open]")) return; onKey(e); });

  // ---------- Démarrage ----------
  (function offerBackup() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem("pb-backup-" + PAGE.id) || "null"); } catch (e) { raw = null; }
    if (!raw || !raw.content || !canWrite) return;
    if (JSON.stringify(raw.content.sections) === JSON.stringify(content.sections)) { try { localStorage.removeItem("pb-backup-" + PAGE.id); } catch (e) { /* rien */ } return; }
    if (window.confirm("Une copie non enregistrée de cette page (" + new Date(raw.at).toLocaleString("fr-FR") + ") est gardée dans ce navigateur. La reprendre ?")) {
      change(function () { content.sections = raw.content.sections || content.sections; ensureIds(content.sections); if (raw.content.seo) content.seo = raw.content.seo; if (raw.content.title) content.title = raw.content.title; if (raw.content.description !== undefined) content.description = raw.content.description; });
    } else { try { localStorage.removeItem("pb-backup-" + PAGE.id); } catch (e) { /* rien */ } }
  })();
  if (!canWrite) setSave("Lecture seule");
  Object.keys(aids).forEach(function (k) { $$("[data-pb-toggle='" + k + "']").forEach(function (b) { b.setAttribute("aria-pressed", String(aids[k])); }); });
  if (aids.rulers) { $("[data-pb-ruler-x]").hidden = false; $("[data-pb-ruler-y]").hidden = false; $("[data-pb-ruler-corner]").hidden = false; $("[data-pb-canvas]").classList.add("has-rulers"); }
  zoomFit = true;
  applyPanels();
  applyLayersPanel();
  updateStatus();
  renderTools();
  renderElements("");
  renderBlocks();
  renderComponents();
  renderPageSettings();
  renderTree();
  renderInspector();
  renderContext();
  updateHistoryButtons();
  applyZoom();
  renderCanvas();
  // Lecture de l'état pour les tests de bout en bout (aucune écriture possible par ce biais)
  window.__pb = { content: function () { return clone(content); }, selection: function () { return selection.slice(); }, device: function () { return device; }, revision: function () { return revision; }, dirty: function () { return dirty || saving; } };
})();
