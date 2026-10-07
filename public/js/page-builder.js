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
  function reId(it) { it.id = newId(); delete it.locked; delete it.anchor; var k = kidsOf(it); if (k) k.forEach(reId); return it; }
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
    placeCanvasBar();
    if (!light) renderDoc();
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
    markDocSelection(opts.scroll !== false);
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
    if (t.asks === "images") return openMedia({ title: type === "carousel" ? "Images du carrousel (au moins deux)" : "Images de la galerie (plusieurs possibles)", multiple: true, onPick: function (list) {
      var missing = list.filter(function (m) { return !m.alt; });
      if (missing.length) { toast("Ajoutez d'abord un texte de remplacement aux images choisies (dans la médiathèque) : " + missing.map(function (m) { return m.name; }).join(", "), true); return; }
      if (type === "carousel" && list.length < 2) { toast("Un carrousel demande au moins deux images.", true); return; }
      addItems([newNode(type, { props: { images: list.map(function (m) { return { src: m.path, alt: m.alt }; }) } })], at);
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
  // Ancre d'un élément (lien direct #ancre) : vérifiée ici pour un message immédiat, revérifiée par le serveur
  function setAnchor(id, value) {
    var v = String(value || "").trim().toLowerCase();
    if (v && !/^[a-z][a-z0-9-]{0,39}$/.test(v)) { toast("Ancre invalide : lettres minuscules, chiffres et tirets, en commençant par une lettre.", true); renderInspector(); return; }
    var taken = false;
    walk(function (x) { if (x.id !== id && x.anchor === v) taken = true; });
    if (v && taken) { toast("L'ancre « " + v + " » est déjà utilisée sur cette page.", true); renderInspector(); return; }
    change(function () { var it = byId(id); if (v) it.anchor = v; else delete it.anchor; });
  }

  // ---------- Structures : colonnes et grille ----------
  // Largeur des colonnes : proportions (flex-grow) par écran, ramenées à une moyenne de 1 (1 / 1 = moitié-moitié).
  var MAX_COLS = 6;
  function growAt(c, from) {
    for (var j = from; j >= 0; j--) { var s = c.styles && c.styles[BPS[j]]; if (s && s.flexGrow !== undefined) return Number(s.flexGrow); }
    return 1;
  }
  // Parts de la largeur (en %) de chaque colonne, pour l'écran modifié
  function columnShares(it) {
    var g = (kidsOf(it) || []).map(function (c) { return growAt(c, BPS.indexOf(device)); });
    var tot = g.reduce(function (a, b) { return a + b; }, 0) || 1;
    return g.map(function (x) { return x / tot * 100; });
  }
  // Enregistre des parts (en %) pour l'écran modifié : une valeur égale à celle héritée n'est pas répétée
  function storeShares(colsItem, shares) {
    var k = kidsOf(colsItem), avg = 100 / k.length, i0 = BPS.indexOf(device);
    k.forEach(function (c, i) {
      var g = Math.max(0.05, Math.round(shares[i] / avg * 100) / 100);
      var inh = growAt(c, i0 - 1);
      var s = styleSet(c, device, "normal", true);
      if (Math.abs(g - inh) < 0.01) delete s.flexGrow; else s.flexGrow = g;
      cleanStyles(c);
    });
  }
  function equalizeColumns(colsItem) {
    kidsOf(colsItem).forEach(function (c) { if (c.styles) BPS.forEach(function (b) { if (c.styles[b]) delete c.styles[b].flexGrow; }); cleanStyles(c); });
  }
  var pct = function (v) { return (Math.round(v * 10) / 10).toString().replace(".", ",") + " %"; };
  function addColumn(id) {
    var it = byId(id);
    if (!it || it.type !== "columns" || refuseLocked([id])) return;
    var n = kidsOf(it).length;
    if (n >= MAX_COLS) { toast("Au plus " + MAX_COLS + " colonnes : utilisez une grille pour davantage.", true); return; }
    change(function () { var x = byId(id); kidsOf(x).push(newNode("column")); equalizeColumns(x); selection = [id]; });
    toast((n + 1) + " colonnes de " + pct(100 / (n + 1)) + " chacune (largeurs modifiables).");
  }
  function removeColumn(id, index) {
    var it = byId(id);
    if (!it || refuseLocked([id])) return;
    var k = kidsOf(it);
    if (k.length <= 1) { toast("Il reste une seule colonne : supprimez plutôt toute la structure.", true); return; }
    var i = index === undefined ? k.length - 1 : index;
    var inside = countDeep(k[i]);
    change(function () { kidsOf(byId(id)).splice(i, 1); selection = [id]; });
    toast("Colonne " + (i + 1) + " retirée" + (inside ? " avec ses " + inside + " élément(s)" : "") + ". Ctrl/⌘ + Z pour annuler.");
  }
  function moveColumn(id, i, delta) {
    if (refuseLocked([id])) return;
    change(function () { var k = kidsOf(byId(id)); var j = i + delta; if (j < 0 || j >= k.length) return false; var t = k[i]; k[i] = k[j]; k[j] = t; });
  }
  // Largeur d'une colonne (en %) : les autres se partagent le reste en gardant leurs proportions
  function setColumnShare(id, i, value) {
    var it = byId(id);
    if (!it || refuseLocked([id])) return;
    var sh = columnShares(it);
    if (sh.length < 2) return;
    var v = Math.min(95, Math.max(5, value));
    var rest = 100 - sh[i], next = sh.map(function (x, j) { return j === i ? v : rest > 0 ? x / rest * (100 - v) : (100 - v) / (sh.length - 1); });
    if (next.some(function (x) { return x < 2; })) { toast("Chaque colonne garde au moins quelques pour cent de la largeur.", true); renderInspector(); return; }
    change(function () { storeShares(byId(id), next); });
  }
  // Grille : nombre de colonnes réellement affiché (réglage de l'écran, sinon celui mesuré dans le canevas)
  function gridColumnsOf(it) {
    for (var j = BPS.indexOf(device); j >= 0; j--) { var s = it.styles && it.styles[BPS[j]]; if (s && s.columns !== undefined) return Number(s.columns); }
    var el = canvasEl(it.id);
    if (el) { var t = frame.contentWindow.getComputedStyle(el).gridTemplateColumns; if (t && t !== "none") return t.split(" ").length; }
    return 3;
  }
  function gridSetColumns(id, n) {
    n = Math.min(12, Math.max(1, n));
    setStyle([id], "columns", n);
  }
  function gridAddRow(id) {
    var it = byId(id);
    if (!it || refuseLocked([id])) return;
    var cols = gridColumnsOf(it), n = kidsOf(it).length;
    var add = (cols - n % cols) % cols + cols; // compléter la dernière ligne, puis une ligne entière
    if (n + add > 96) { toast("Une grille compte au plus 96 cellules.", true); return; }
    change(function () { var k = kidsOf(byId(id)); for (var i = 0; i < add; i++) k.push(newNode("container", { name: "Cellule " + (n + i + 1) })); selection = [id]; });
    toast("Ligne ajoutée (" + add + " cellule" + (add > 1 ? "s" : "") + ").");
  }
  function gridRemoveRow(id) {
    var it = byId(id);
    if (!it || refuseLocked([id])) return;
    var cols = gridColumnsOf(it), k = kidsOf(it);
    if (k.length <= cols) { toast("La grille garde au moins une ligne.", true); return; }
    var drop = k.length % cols || cols;
    var inside = k.slice(-drop).reduce(function (a, c) { return a + countDeep(c); }, 0);
    change(function () { kidsOf(byId(id)).splice(-drop, drop); selection = [id]; });
    toast("Dernière ligne retirée (" + drop + " cellule" + (drop > 1 ? "s" : "") + (inside ? ", " + inside + " élément(s)" : "") + "). Ctrl/⌘ + Z pour annuler.");
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
  // Réinitialiser le style : tous les écrans et tous les états (le contenu est gardé) ; annulable
  function resetStyle() {
    var ids = selection.slice();
    if (!ids.length || refuseLocked(ids)) return;
    var any = ids.some(function (id) { var it = byId(id); return it && (it.styles || it.states); });
    if (!any) { toast("Aucun style propre à réinitialiser."); return; }
    change(function () { ids.forEach(function (id) { var it = byId(id); if (it) { delete it.styles; delete it.states; } }); });
    toast("Style réinitialisé (tous les écrans et états). Ctrl/⌘ + Z pour annuler.");
  }
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
  function setStyle(ids, key, value, opts) { var m = {}; m[key] = value; setStyles(ids, m, opts); }
  // Plusieurs propriétés en une seule étape d'annulation (côtés liés, retrait du fond…)
  function setStyles(ids, map, opts) {
    ids = ids || selection;
    if (!ids.length || refuseLocked(ids)) return;
    change(function () {
      ids.forEach(function (id) {
        var it = byId(id);
        if (!it) return;
        Object.keys(map).forEach(function (key) {
          var value = map[key];
          var empty = value === "" || value === null || value === undefined;
          var set = styleSet(it, device, styleState, !empty);
          if (!set) return;
          if (empty) delete set[key]; else set[key] = value;
        });
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
  // Bibliothèque d'éléments (gauche = créer). La barre d'outils choisit la catégorie affichée ; la recherche porte sur tout.
  var elCategory = store.get("el-category", "");
  function elementGroups() {
    var groups = Object.keys(SPEC.categories).map(function (k) { return { key: k, label: SPEC.categories[k], items: SPEC.types.filter(function (t) { return t.category === k; }).map(function (t) { return { type: t.type, label: t.label, icon: t.icon, disabled: t.asks === "course" && !boot.courses.length ? "Publiez d'abord une formation dans le catalogue." : null }; }) }; });
    groups[0].items.unshift({ type: "layout", label: "Section libre", icon: "layout" });
    var legacy = boot.types.map(function (t) { return { type: t.type, label: t.label, icon: "fileText", disabled: t.unavailable, legacy: true }; });
    groups.push({ key: "form", label: "Formulaires", items: legacy.filter(function (t) { return t.type === "form"; }) });
    groups.push({ key: "sections", label: "Sections prêtes", items: legacy.filter(function (t) { return t.type !== "form"; }) });
    return groups;
  }
  // Favoris et éléments récemment utilisés (préférences d'interface de cette personne, dans ce navigateur)
  var favs = store.get("el-favs", []), recents = store.get("el-recent", []);
  var elKey = function (it) { return (it.legacy ? "s:" : "n:") + it.type; };
  function useElement(it) { recents = [elKey(it)].concat(recents.filter(function (k) { return k !== elKey(it); })).slice(0, 6); store.set("el-recent", recents); }
  function toggleFav(it) { var k = elKey(it); favs = favs.indexOf(k) >= 0 ? favs.filter(function (x) { return x !== k; }) : favs.concat(k); store.set("el-favs", favs); renderElements($("[data-pb-el-search]").value); }
  function renderElements(filter) {
    var box = $("[data-pb-elements]");
    box.textContent = "";
    var f = norm(filter);
    var groups = elementGroups();
    // Recherche : une seule liste, triée par pertinence (nom qui commence par le mot, nom qui le contient, mot associé)
    if (f) {
      var score = function (it, g) { var l = norm(it.label); return l.indexOf(f) === 0 ? 0 : l.indexOf(f) >= 0 ? 1 : norm(g.label).indexOf(f) >= 0 ? 2 : norm(SEARCH_WORDS[it.type] || "").indexOf(f) >= 0 ? 3 : 9; };
      var found = [];
      groups.forEach(function (g, gi) { g.items.forEach(function (it, ii) { var sc = score(it, g); if (sc < 9) found.push({ it: it, sc: sc, o: gi * 100 + ii }); }); });
      found.sort(function (x, y) { return x.sc - y.sc || x.o - y.o; });
      groups = found.length ? [{ key: "results", label: found.length + " résultat" + (found.length > 1 ? "s" : ""), items: found.map(function (x) { return x.it; }) }] : [];
    }
    if (!f && !elCategory) {
      var all = [].concat.apply([], groups.map(function (g) { return g.items; }));
      var pick = function (keys) { return keys.map(function (k) { return all.find(function (x) { return elKey(x) === k; }); }).filter(Boolean); };
      var fav = pick(favs), rec = pick(recents.filter(function (k) { return favs.indexOf(k) < 0; }));
      groups = (fav.length ? [{ key: "fav", label: "Favoris", items: fav }] : []).concat(rec.length ? [{ key: "recent", label: "Récemment utilisés", items: rec }] : []).concat(groups);
    }
    var shown = f ? groups : elCategory ? groups.filter(function (g) { return g.key === elCategory; }) : groups;
    if (!f && elCategory) {
      var g0 = groups.find(function (g) { return g.key === elCategory; });
      box.appendChild(h("div", { class: "pb-cat-head" }, h("strong", { text: g0 ? g0.label : "" }), h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function () { setCategory(""); } }, "Tout afficher")));
    }
    shown.forEach(function (g) {
      var items = g.items.filter(function (it) { return !f || norm(it.label).indexOf(f) >= 0 || norm(g.label).indexOf(f) >= 0 || norm(SEARCH_WORDS[it.type] || "").indexOf(f) >= 0; });
      if (!items.length) return;
      var ul = h("ul", { class: "pb-palette" });
      items.forEach(function (it) {
        var btn = h("button", { type: "button", class: "pb-pal-item", disabled: !canWrite || Boolean(it.disabled), "data-tip": it.disabled || null, onclick: function () { useElement(it); if (it.legacy) addLegacy(it.type); else addElement(it.type); } }, icon(it.icon), h("span", { text: it.label }));
        if (!it.disabled) draggableSource(btn, it.legacy ? { type: it.type, section: true } : { type: it.type }, function (target) { useElement(it); if (it.legacy) addLegacy(it.type, target); else addElement(it.type, target); });
        var isFav = favs.indexOf(elKey(it)) >= 0;
        var star = h("button", { type: "button", class: "pb-fav", "aria-pressed": String(isFav), "aria-label": (isFav ? "Retirer des favoris : " : "Ajouter aux favoris : ") + it.label, "data-tip": isFav ? "Retirer des favoris" : "Ajouter aux favoris", onclick: function (e) { e.stopPropagation(); toggleFav(it); } }, isFav ? "★" : "☆");
        ul.appendChild(h("li", { class: "pb-pal-li" }, btn, star));
      });
      box.appendChild(h("section", { class: "pb-pal-group" }, elCategory && !f ? null : h("h3", { class: "pb-sub", text: g.label }), ul));
    });
    if (box.querySelectorAll(".pb-pal-group").length === 0) box.appendChild(h("p", { class: "pb-hint", text: "Aucun élément ne correspond." }));
  }
  // Mots de recherche supplémentaires (ce que l'on tape naturellement pour trouver un élément)
  var SEARCH_WORDS = { image: "photo visuel illustration media", gallery: "photos images diaporama media", video: "youtube vimeo film media", audio: "son musique podcast mp3", button: "bouton cta appel action lien", link: "lien url", heading: "titre h1 h2 texte", text: "paragraphe texte riche", accordion: "faq questions reponses accordeon", tabs: "onglets", columns: "colonnes grille mise en page layout", column: "colonne", grid: "grille tableau colonnes lignes", container: "boite bloc conteneur div", stack: "pile empiler", spacer: "espace vide marge", divider: "separateur ligne trait", countdown: "compte a rebours minuteur urgence", course: "formation cours produit vente", form: "formulaire inscription email champs", icon: "icone pictogramme", table: "tableau", badge: "etiquette label pastille nouveau", timeline: "chronologie etapes histoire parcours programme", progress: "progression barre pourcentage jauge", toggle: "bascule deplier details afficher plus", alert: "alerte avertissement information notice message", counter: "compteur chiffre statistique nombre", testimonial: "temoignage avis client citation note etoiles", pricing: "tarif prix offre abonnement", breadcrumb: "fil ariane chemin navigation", social: "reseaux sociaux facebook instagram linkedin youtube", modal: "fenetre modale popup pop-up dialogue", menu: "menu navigation liens nav", carousel: "carrousel slider diaporama images defilant", quote: "citation temoignage", layout: "section libre bloc" };
  // Choisir une catégorie (barre d'outils) : le panneau de gauche s'ouvre sur la bibliothèque correspondante
  function setCategory(key) {
    elCategory = key;
    store.set("el-category", key);
    if (key === "blocks" || key === "components") openTab($(key === "blocks" ? "#pb-tab-blocks" : "#pb-tab-components"));
    else { openTab($("#pb-tab-elements")); $("[data-pb-el-search]").value = ""; renderElements(""); }
    $$(".pb-tool[data-cat]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.cat === key)); });
  }
  $("[data-pb-el-search]").addEventListener("input", function () { renderElements(this.value); });

  // Barre d'outils (gauche = créer) : modes du canevas, puis catégories de la bibliothèque d'éléments
  var TOOLS = [
    { key: "select", label: "Sélection (V)", icon: "mousePointer", mode: true },
    { key: "hand", label: "Main (H)", tip: "Main : faire défiler la page en la glissant (H)", icon: "arrowRightLeft", mode: true },
    { sep: true },
    { cat: "structure", label: "Structure", tip: "Structure : section, conteneur, colonnes, grille…", icon: "layout" },
    { cat: "text", label: "Texte", tip: "Texte : titre, paragraphe, liste, citation, tableau, badge, alerte, chronologie…", icon: "type" },
    { cat: "media", label: "Média", tip: "Média : image, galerie, vidéo, audio, icône", icon: "image" },
    { cat: "interaction", label: "Interaction", tip: "Interaction : bouton, lien, accordéon, onglets, bascule, menu, fil d'Ariane, réseaux sociaux, fenêtre", icon: "mousePointer" },
    { cat: "form", label: "Formulaires", tip: "Formulaire d'inscription de la page", icon: "fileText" },
    { cat: "marketing", label: "Marketing", tip: "Marketing : compte à rebours, compteur, témoignage, offre tarifaire, barre de progression", icon: "clock" },
    { cat: "commerce", label: "Formations", tip: "Formations du catalogue", icon: "graduation" },
    { sep: true },
    { cat: "sections", label: "Sections prêtes", tip: "Sections prêtes : bandeau, points forts, FAQ, appel à l'action…", icon: "listChecks" },
    { cat: "blocks", label: "Blocs", tip: "Blocs : en-têtes, tarifs, témoignages, colonnes… prêts à l'emploi", icon: "columns" },
    { cat: "components", label: "Composants", tip: "Composants réutilisables", icon: "copy" },
  ];
  // Barre d'outils : compacte (icônes, nom en infobulle) ou étendue (icône + nom) — préférence d'interface mémorisée
  var toolLabel = function (label) { return label.replace(/\s*\([^)]*\)$/, ""); };
  function renderTools() {
    var nav = $("[data-pb-tools]");
    nav.textContent = "";
    var expanded = Boolean(panels.toolsExpanded), dense = Boolean(panels.toolsDense);
    nav.appendChild(h("button", { type: "button", class: "pb-tool pb-tools-toggle", "aria-expanded": String(expanded), "aria-label": expanded ? "Réduire la barre d'outils" : "Déployer la barre d'outils (noms des outils)", "data-tip": expanded ? "Réduire la barre d'outils" : "Déployer la barre d'outils",
      onclick: function () { panels.toolsExpanded = !panels.toolsExpanded; if (panels.toolsExpanded) panels.toolsDense = false; applyPanels(); renderTools(); } }, icon(expanded ? "chevronLeft" : "chevronRight"), h("span", { class: "pb-tool-label", text: expanded ? "Réduire" : "Déployer" })));
    nav.appendChild(h("button", { type: "button", class: "pb-tool pb-tools-cols", "aria-pressed": String(dense), "aria-label": dense ? "Barre d'outils sur une colonne" : "Barre d'outils sur deux colonnes", "data-tip": dense ? "Une colonne (compacte)" : "Deux colonnes (outils nommés, barre plus courte)",
      onclick: function () { panels.toolsDense = !panels.toolsDense; if (panels.toolsDense) panels.toolsExpanded = false; applyPanels(); renderTools(); } }, icon("columns"), h("span", { class: "pb-tool-label", text: dense ? "1 colonne" : "2 colonnes" })));
    nav.appendChild(h("span", { class: "pb-tools-sep", role: "separator" }));
    TOOLS.forEach(function (t) {
      if (t.sep) { nav.appendChild(h("span", { class: "pb-tools-sep", role: "separator" })); return; }
      var btn = h("button", { type: "button", class: "pb-tool", "aria-label": t.label, "data-tip": t.tip || t.label, "data-mode": t.mode ? t.key : null, "data-cat": t.cat || null,
        "aria-pressed": t.mode ? String(tool === t.key) : String(elCategory === t.cat && !panels.leftHidden),
        onclick: function () { if (t.mode) setTool(t.key); else setCategory(t.cat); } }, icon(t.icon), h("span", { class: "pb-tool-label", text: toolLabel(t.label) }));
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
    if ((panels.toolsExpanded || panels.toolsDense) && label && el.closest(".pb-tools") && text === label.textContent && label.scrollWidth <= label.clientWidth) return;
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
    placeCanvasBar();
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
    var lab = h("label", { class: "pb-check" }, cb, " " + label);
    return opts && opts.hint ? h("div", {}, lab, h("p", { class: "pb-hint", text: opts.hint })) : lab;
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
        if (p.link) box.appendChild(checkField("Ouvrir le lien dans un nouvel onglet (https:// seulement)", p.newTab, function (v) { setProp(it.id, "newTab", v); }, { disabled: disabled }));
        box.appendChild(textField("Légende", p.caption, set("caption"), { max: 200, disabled: disabled }));
        box.appendChild(textField("Titre (infobulle au survol, facultatif)", p.title, set("title"), { max: 150, disabled: disabled }));
        break;
      case "gallery":
        (p.images || []).forEach(function (im, i) {
          box.appendChild(h("div", { class: "pb-repeat-item" }, h("img", { src: im.src, alt: "", class: "pb-thumb" }),
            textField("Texte de remplacement " + (i + 1), im.alt, function (v) { change(function () { byId(it.id).props.images[i].alt = v; }, { key: it.id + ":img" + i, light: true }); }, { max: 200, disabled: disabled }),
            textField("Légende " + (i + 1), im.caption, function (v) { change(function () { byId(it.id).props.images[i].caption = v; }, { key: it.id + ":gcap" + i, light: true }); }, { max: 200, disabled: disabled }),
            textField("Lien de l'image " + (i + 1) + " (facultatif)", im.link, function (v) { change(function () { byId(it.id).props.images[i].link = v; }, { key: it.id + ":glink" + i, light: true }); }, { list: "pb-links", disabled: disabled, placeholder: "/catalogue ou https://…" }),
            h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || p.images.length < 2, onclick: function () { change(function () { byId(it.id).props.images.splice(i, 1); }); } }, "Retirer")));
        });
        box.appendChild(checkField("Agrandir au clic (visionneuse)", p.lightbox, function (v) { setProp(it.id, "lightbox", v); }, { disabled: disabled, hint: "Les images qui ont un lien ouvrent leur lien." }));
        box.appendChild(checkField("Mosaïque (hauteurs naturelles, en colonnes)", p.masonry, function (v) { setProp(it.id, "masonry", v); }, { disabled: disabled }));
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || (p.images || []).length >= 24, onclick: function () { openMedia({ title: "Ajouter à la galerie", multiple: true, onPick: function (list) { change(function () { var x = byId(it.id); list.forEach(function (m) { x.props.images.push({ src: m.path, alt: m.alt || "" }); }); }); } }); } }, "Ajouter des images"));
        break;
      case "video":
        box.appendChild(textField("Adresse (YouTube, Vimeo ou fichier https://)", p.url, set("url"), { type: "url", disabled: disabled }));
        box.appendChild(textField("Titre (lu par les lecteurs d'écran)", p.title, set("title"), { max: 150, disabled: disabled }));
        box.appendChild(h("p", { class: "pb-sub", text: "Lecture" }));
        box.appendChild(checkField("Lecture automatique (sans le son, exigé par les navigateurs)", p.autoplay, function (v) { change(function () { var x = byId(it.id).props; if (v) { x.autoplay = true; x.muted = true; } else { delete x.autoplay; if (x.controls === false) delete x.controls; } }); }, { disabled: disabled }));
        box.appendChild(checkField("Son coupé au départ", p.muted || p.autoplay, function (v) { setProp(it.id, "muted", v); }, { disabled: disabled || p.autoplay }));
        box.appendChild(checkField("Lire en boucle", p.loop, function (v) { setProp(it.id, "loop", v); }, { disabled: disabled }));
        box.appendChild(checkField("Afficher les commandes de lecture", p.controls !== false, function (v) { change(function () { var x = byId(it.id).props; if (v) delete x.controls; else x.controls = false; }); }, { disabled: disabled || !p.autoplay, hint: p.autoplay ? null : "Les commandes restent affichées sans lecture automatique (sinon la vidéo ne pourrait pas démarrer)." }));
        if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(p.url || "")) {
          box.appendChild(h("p", { class: "pb-sub", text: "Image d'attente (avant la lecture)" }));
          box.appendChild(mediaPreview(p.poster, function (m) { setProp(it.id, "poster", m.path); }, disabled));
          if (p.poster) box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { change(function () { delete byId(it.id).props.poster; }); } }, "Retirer l'image d'attente"));
        }
        break;
      case "audio":
        box.appendChild(textField("Adresse https:// du fichier", p.src, set("src"), { type: "url", disabled: disabled }));
        box.appendChild(textField("Titre", p.title, set("title"), { max: 150, disabled: disabled }));
        box.appendChild(checkField("Lire en boucle", p.loop, function (v) { setProp(it.id, "loop", v); }, { disabled: disabled, hint: "Pas de lecture automatique : les navigateurs la bloquent pour un son." }));
        break;
      case "button":
      case "link":
        box.appendChild(textField("Texte", p.label, set("label"), { max: it.type === "button" ? 80 : 120, disabled: disabled }));
        box.appendChild(textField("Adresse", p.url, set("url"), { list: "pb-links", disabled: disabled, placeholder: "/catalogue, /p/… ou https://…", hint: PAGE.funnel ? "/etape-suivante : l'étape suivante du tunnel « " + PAGE.funnel.name + " »." : null }));
        if (it.type === "button") box.appendChild(selectField("Apparence", p.variant, [["primary", "Plein"], ["outline", "Contour"], ["ghost", "Discret"]], set("variant", false), { disabled: disabled }));
        box.appendChild(checkField("Ouvrir dans un nouvel onglet (adresses https:// seulement)", p.newTab, function (v) { setProp(it.id, "newTab", v); }, { disabled: disabled }));
        if (it.type === "button") {
          box.appendChild(selectField("Nature du lien (moteurs de recherche)", p.rel || "", [["", "Normal"], ["nofollow", "Non recommandé (nofollow)"], ["sponsored", "Sponsorisé / payé"]], function (v) { setProp(it.id, "rel", v); }, { disabled: disabled }));
          box.appendChild(h("p", { class: "pb-sub", text: "Icône du bouton" }));
          if (p.icon) {
            box.appendChild(selectField("Position de l'icône", p.iconPos || "before", [["before", "Avant le texte"], ["after", "Après le texte"]], function (v) { setProp(it.id, "iconPos", v); }, { disabled: disabled }));
            box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { change(function () { var x = byId(it.id).props; delete x.icon; delete x.iconPos; }); } }, "Retirer l'icône"));
          }
          box.appendChild(iconPicker(p.icon || "", function (v) { setProp(it.id, "icon", v); }, disabled));
        }
        break;
      case "accordion":
        repeatEditor(box, it, "items", [["q", "Question", 200], ["a", "Réponse (gras, liens…)", 2000, true]], { q: "Nouvelle question ?", a: "La réponse." }, 30, disabled);
        box.appendChild(checkField("Première question ouverte à l'affichage", p.openFirst, function (v) { setProp(it.id, "openFirst", v); }, { disabled: disabled }));
        box.appendChild(checkField("Données structurées FAQ (moteurs de recherche)", p.faqSchema, function (v) { setProp(it.id, "faqSchema", v); }, { disabled: disabled }));
        box.appendChild(selectField("Icône des questions", p.icon || "chevron", [["chevron", "Flèche"], ["plus", "Plus / moins"], ["none", "Aucune"]], function (v) { setProp(it.id, "icon", v); }, { disabled: disabled }));
        box.appendChild(checkField("Une seule réponse ouverte à la fois", p.single, function (v) { setProp(it.id, "single", v); }, { disabled: disabled, hint: "Ouvrir une question referme les autres (navigateurs récents ; ailleurs, plusieurs restent possibles)." }));
        break;
      case "tabs":
        repeatEditor(box, it, "items", [["title", "Titre de l'onglet", 60], ["text", "Contenu (gras, liens…)", 2000, true]], { title: "Nouvel onglet", text: "Contenu." }, 20, disabled);
        (p.items || []).forEach(function (tb, i) {
          box.appendChild(selectField("Icône de l'onglet « " + tb.title + " »", tb.icon || "", [["", "Aucune"]].concat(SPEC.icons.map(function (n) { return [n, n]; })), function (v) { change(function () { var x = byId(it.id).props.items[i]; if (v) x.icon = v; else delete x.icon; }); }, { disabled: disabled }));
        });
        box.appendChild(checkField("Onglets à la verticale (à gauche du contenu)", p.vertical, function (v) { setProp(it.id, "vertical", v); }, { disabled: disabled, hint: "Sur mobile, ils repassent à l'horizontale." }));
        break;
      case "badge":
        box.appendChild(textField("Texte", p.text, set("text"), { max: 40, disabled: disabled }));
        box.appendChild(selectField("Couleur", p.tone, [["primary", "Couleur du site"], ["neutral", "Neutre"], ["success", "Succès"], ["warning", "Attention"], ["error", "Alerte"]], function (v) { setProp(it.id, "tone", v); }, { disabled: disabled }));
        break;
      case "timeline":
        repeatEditor(box, it, "items", [["date", "Date ou repère", 40], ["title", "Titre", 120], ["text", "Texte", 600, true]], { date: "", title: "Nouvelle étape", text: "" }, 30, disabled);
        break;
      case "progress":
        box.appendChild(textField("Libellé", p.label, set("label"), { max: 80, disabled: disabled }));
        box.appendChild(textField("Valeur (0 à 100)", String(p.value), function (v) { var n = Math.round(Number(v)); if (!isFinite(n) || n < 0 || n > 100) { toast("Valeur entre 0 et 100.", true); return; } setProp(it.id, "value", n, { key: it.id + ":value", light: true }); }, { type: "number", disabled: disabled, hint: "Une donnée réelle (par ex. places réservées) ; ne pas inventer de chiffre." }));
        box.appendChild(checkField("Afficher la valeur en %", p.showValue !== false, function (v) { setProp(it.id, "showValue", v); }, { disabled: disabled }));
        box.appendChild(checkField("Remplir la barre à l'apparition (animation)", p.animate, function (v) { setProp(it.id, "animate", v); }, { disabled: disabled }));
        break;
      case "menu":
        box.appendChild(textField("Nom du menu (lecteurs d'écran)", p.label, set("label"), { max: 60, disabled: disabled }));
        repeatEditor(box, it, "items", [["label", "Texte du lien", 60], ["url", "Adresse (/page, https://… ou #ancre)", 500]], { label: "Nouveau lien", url: "/" }, 12, disabled);
        // Sous-menus : un niveau, sous chaque lien
        (p.items || []).forEach(function (m, i) {
          var kids = m.children || [];
          var sub = h("details", { class: "pb-acc pb-sub-acc" }, h("summary", {}, h("span", { class: "pb-acc-title", text: "Sous-menu de « " + m.label + " »" }), kids.length ? h("span", { class: "pb-acc-count", text: String(kids.length) }) : null));
          var body = h("div", { class: "pb-acc-body" });
          kids.forEach(function (c, j) {
            body.appendChild(h("div", { class: "pb-repeat-item" },
              textField("Texte", c.label, function (v) { change(function () { byId(it.id).props.items[i].children[j].label = v; }, { key: it.id + ":sub" + i + "l" + j, light: true }); }, { max: 60, disabled: disabled }),
              textField("Adresse", c.url, function (v) { change(function () { byId(it.id).props.items[i].children[j].url = v; }, { key: it.id + ":sub" + i + "u" + j, light: true }); }, { list: "pb-links", disabled: disabled }),
              h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { change(function () { var x = byId(it.id).props.items[i]; x.children.splice(j, 1); if (!x.children.length) delete x.children; }); } }, "Retirer")));
          });
          body.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || kids.length >= 10, onclick: function () { change(function () { var x = byId(it.id).props.items[i]; x.children = (x.children || []).concat({ label: "Sous-lien", url: "/" }); }); } }, "Ajouter un sous-lien"));
          sub.appendChild(body);
          box.appendChild(sub);
        });
        box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () {
          var pagesOnSite = boot.links.filter(function (l) { return /^\/p\//.test(l.url) && !(p.items || []).some(function (m) { return m.url === l.url; }); }).slice(0, 12 - (p.items || []).length);
          if (!pagesOnSite.length) { toast("Aucune autre page publiée à ajouter.", true); return; }
          change(function () { var x = byId(it.id).props; pagesOnSite.forEach(function (l) { x.items.push({ label: l.label.replace(/^Page « |»$/g, "").trim(), url: l.url }); }); });
          toast(pagesOnSite.length + " page(s) publiée(s) ajoutée(s) au menu.");
        } }, "Ajouter les pages publiées"));
        box.appendChild(checkField("Liens les uns sous les autres", p.vertical, function (v) { setProp(it.id, "vertical", v); }, { disabled: disabled }));
        box.appendChild(checkField("Sur mobile, replier derrière un bouton « Menu »", p.mobileToggle, function (v) { setProp(it.id, "mobileToggle", v); }, { disabled: disabled }));
        break;
      case "carousel":
        box.appendChild(textField("Nom du carrousel (lecteurs d'écran)", p.label, set("label"), { max: 80, disabled: disabled }));
        (p.images || []).forEach(function (im, i) {
          box.appendChild(h("div", { class: "pb-repeat-item" }, h("img", { src: im.src, alt: "", class: "pb-thumb" }),
            textField("Texte de remplacement " + (i + 1), im.alt, function (v) { change(function () { byId(it.id).props.images[i].alt = v; }, { key: it.id + ":img" + i, light: true }); }, { max: 200, disabled: disabled }),
            textField("Légende " + (i + 1), im.caption, function (v) { change(function () { byId(it.id).props.images[i].caption = v; }, { key: it.id + ":cap" + i, light: true }); }, { max: 200, disabled: disabled }),
            h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || p.images.length < 3, onclick: function () { change(function () { byId(it.id).props.images.splice(i, 1); }); } }, "Retirer")));
        });
        box.appendChild(checkField("Points de navigation", p.dots !== false, function (v) { setProp(it.id, "dots", v); }, { disabled: disabled }));
        box.appendChild(checkField("Revenir au début après la dernière image (boucle)", p.loop, function (v) { setProp(it.id, "loop", v); }, { disabled: disabled }));
        box.appendChild(checkField("Défilement automatique", p.autoplay, function (v) { setProp(it.id, "autoplay", v); }, { disabled: disabled, hint: "S'arrête au survol, au clavier ou au toucher ; jamais si la personne réduit les animations." }));
        if (p.autoplay) box.appendChild(selectField("Intervalle", String(p.interval || 5), ["2", "3", "4", "5", "6", "8", "10", "15", "20"].map(function (n) { return [n, n + " secondes"]; }), function (v) { setProp(it.id, "interval", Number(v)); }, { disabled: disabled }));
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || (p.images || []).length >= 24, onclick: function () { openMedia({ title: "Ajouter au carrousel", multiple: true, onPick: function (list) { change(function () { var x = byId(it.id); list.forEach(function (m) { x.props.images.push({ src: m.path, alt: m.alt || "" }); }); }); } }); } }, "Ajouter des images"));
        break;
      case "table":
        tableEditor(box, it, disabled);
        box.appendChild(checkField("Dernière ligne en pied de tableau (total)", p.footer, function (v) { setProp(it.id, "footer", v); }, { disabled: disabled }));
        box.appendChild(checkField("Lignes alternées", p.striped, function (v) { setProp(it.id, "striped", v); }, { disabled: disabled }));
        box.appendChild(selectField("Alignement des cellules", p.align || "left", [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]], function (v) { setProp(it.id, "align", v); }, { disabled: disabled }));
        break;
      case "divider":
        box.appendChild(selectField("Style du trait", p.lineStyle || "solid", [["solid", "Plein"], ["dashed", "Tirets"], ["dotted", "Points"], ["double", "Double"]], function (v) { setProp(it.id, "lineStyle", v); }, { disabled: disabled }));
        box.appendChild(selectField("Épaisseur", String(p.thickness || 1), ["1", "2", "3", "4", "6", "8", "12"].map(function (n) { return [n, n + " px"]; }), function (v) { setProp(it.id, "thickness", Number(v)); }, { disabled: disabled }));
        var dc = fid();
        box.appendChild(h("div", { class: "pb-field" }, h("label", { for: dc, text: "Couleur du trait" }), colorButton(dc, p.color, undefined, disabled, function (v, o) { if (v) setProp(it.id, "color", v, o && o.light ? { key: it.id + ":color", light: true } : null); else change(function () { delete byId(it.id).props.color; }); }, "divider-color")));
        box.appendChild(h("p", { class: "pb-hint", text: "Largeur : onglet Style › Dimensions ; espace autour : Espacement." }));
        break;
      case "toggle":
        box.appendChild(textField("Titre (cliquable)", p.title, set("title"), { max: 150, disabled: disabled }));
        box.appendChild(textField("Contenu (gras, liens…)", p.text, set("text"), { multiline: true, max: 4000, disabled: disabled }));
        box.appendChild(checkField("Ouvert à l'affichage", p.open, function (v) { setProp(it.id, "open", v); }, { disabled: disabled }));
        break;
      case "alert":
        box.appendChild(selectField("Type", p.tone, [["info", "Information"], ["success", "Succès"], ["warning", "Attention"], ["error", "Erreur / important"]], function (v) { setProp(it.id, "tone", v); }, { disabled: disabled }));
        box.appendChild(textField("Titre (facultatif)", p.title, set("title"), { max: 120, disabled: disabled }));
        box.appendChild(textField("Message (gras, liens…)", p.text, set("text"), { multiline: true, max: 1000, disabled: disabled }));
        box.appendChild(checkField("Le visiteur peut le fermer", p.dismissible, function (v) { setProp(it.id, "dismissible", v); }, { disabled: disabled }));
        break;
      case "counter":
        box.appendChild(textField("Nombre (réel, vérifiable)", String(p.value), function (v) { var n = Number(String(v).replace(",", ".")); if (!isFinite(n)) { toast("Nombre attendu.", true); return; } setProp(it.id, "value", n, { key: it.id + ":value", light: true }); }, { disabled: disabled, hint: "Ne pas inventer de chiffre : indiquez sa source dans le libellé." }));
        box.appendChild(h("div", { class: "pb-grid-2" }, textField("Avant (ex. +)", p.prefix, set("prefix"), { max: 10, disabled: disabled }), textField("Après (ex. %, élèves)", p.suffix, set("suffix"), { max: 16, disabled: disabled })));
        box.appendChild(textField("Ce que mesure ce nombre (et sa source)", p.label, set("label"), { max: 120, disabled: disabled }));
        box.appendChild(selectField("Décimales", String(p.decimals || 0), [["0", "Aucune"], ["1", "1"], ["2", "2"]], function (v) { setProp(it.id, "decimals", Number(v)); }, { disabled: disabled }));
        box.appendChild(selectField("Animation du comptage", String(p.duration === undefined ? 1500 : p.duration), [["0", "Aucune"], ["800", "Rapide"], ["1500", "Normale"], ["3000", "Lente"]], function (v) { setProp(it.id, "duration", Number(v)); }, { disabled: disabled }));
        break;
      case "testimonial":
        box.appendChild(textField("Témoignage (réel, avec l'accord de la personne)", p.text, set("text"), { multiline: true, max: 1200, disabled: disabled }));
        box.appendChild(textField("Nom", p.name, set("name"), { max: 80, disabled: disabled }));
        box.appendChild(textField("Fonction ou contexte", p.role, set("role"), { max: 120, disabled: disabled }));
        box.appendChild(selectField("Note", String(p.rating || 0), [["0", "Pas de note"], ["1", "1 / 5"], ["2", "2 / 5"], ["3", "3 / 5"], ["4", "4 / 5"], ["5", "5 / 5"]], function (v) { setProp(it.id, "rating", Number(v)); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-sub", text: "Photo (facultative)" }));
        box.appendChild(mediaPreview(p.avatar, function (m) { setProp(it.id, "avatar", m.path); }, disabled));
        if (p.avatar) box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { change(function () { delete byId(it.id).props.avatar; }); } }, "Retirer la photo"));
        break;
      case "pricing":
        box.appendChild(textField("Nom de l'offre", p.title, set("title"), { max: 80, disabled: disabled }));
        box.appendChild(h("div", { class: "pb-grid-2" }, textField("Prix (réel)", p.price, set("price"), { max: 30, disabled: disabled }), textField("Période (ex. / mois)", p.period, set("period"), { max: 40, disabled: disabled })));
        box.appendChild(textField("Description courte", p.description, set("description"), { max: 300, disabled: disabled }));
        box.appendChild(textField("Ce qui est inclus (un point par ligne)", (p.features || []).join("\n"), function (v) { setProp(it.id, "features", v.split("\n"), { key: it.id + ":features", light: true }); }, { multiline: true, disabled: disabled }));
        box.appendChild(h("div", { class: "pb-grid-2" }, textField("Texte du bouton", p.ctaLabel, set("ctaLabel"), { max: 60, disabled: disabled }), textField("Adresse du bouton", p.ctaUrl, set("ctaUrl"), { list: "pb-links", disabled: disabled })));
        box.appendChild(textField("Badge (ex. Le plus choisi)", p.badge, set("badge"), { max: 40, disabled: disabled }));
        box.appendChild(checkField("Mettre cette offre en avant", p.highlight, function (v) { setProp(it.id, "highlight", v); }, { disabled: disabled }));
        break;
      case "breadcrumb":
        repeatEditor(box, it, "items", [["label", "Texte", 60], ["url", "Adresse (sauf le dernier niveau : la page actuelle)", 500]], { label: "Niveau", url: "/" }, 8, disabled);
        box.appendChild(selectField("Séparateur", p.separator || "chevron", [["chevron", "›"], ["slash", "/"], ["dot", "·"]], function (v) { setProp(it.id, "separator", v); }, { disabled: disabled }));
        break;
      case "social":
        box.appendChild(textField("Nom de la liste (lecteurs d'écran)", p.label, set("label"), { max: 60, disabled: disabled }));
        (p.items || []).forEach(function (x, i) {
          box.appendChild(h("div", { class: "pb-repeat-item" },
            selectField("Réseau", x.network, SPEC.socialNetworks, function (v) { change(function () { byId(it.id).props.items[i].network = v; }); }, { disabled: disabled }),
            textField(x.network === "email" ? "Adresse (mailto:vous@exemple.fr)" : "Adresse du profil (https://…)", x.url, function (v) { change(function () { byId(it.id).props.items[i].url = v; }, { key: it.id + ":soc" + i, light: true }); }, { disabled: disabled }),
            h("div", { class: "pb-row" },
              h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || i === 0, "aria-label": "Monter", onclick: function () { change(function () { var a = byId(it.id).props.items; var t = a[i - 1]; a[i - 1] = a[i]; a[i] = t; }); } }, icon("arrowUp")),
              h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || p.items.length < 2, onclick: function () { change(function () { byId(it.id).props.items.splice(i, 1); }); } }, "Retirer"))));
        });
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || (p.items || []).length >= 12, onclick: function () { change(function () { byId(it.id).props.items.push({ network: "instagram", url: "https://" }); }); } }, "Ajouter un réseau"));
        box.appendChild(selectField("Taille", String(p.size || 32), [["24", "Petite"], ["32", "Moyenne"], ["40", "Grande"], ["48", "Très grande"]], function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        box.appendChild(selectField("Forme", p.shape || "circle", [["circle", "Rond"], ["square", "Carré arrondi"], ["plain", "Icône seule"]], function (v) { setProp(it.id, "shape", v); }, { disabled: disabled }));
        break;
      case "modal":
        box.appendChild(textField("Texte du bouton qui ouvre la fenêtre", p.buttonLabel, set("buttonLabel"), { max: 60, disabled: disabled }));
        box.appendChild(selectField("Apparence du bouton", p.variant, [["primary", "Plein"], ["outline", "Contour"], ["ghost", "Discret"]], function (v) { setProp(it.id, "variant", v); }, { disabled: disabled }));
        box.appendChild(textField("Titre de la fenêtre", p.title, set("title"), { max: 120, disabled: disabled }));
        box.appendChild(textField("Contenu (gras, liens…)", p.text, set("text"), { multiline: true, max: 4000, disabled: disabled }));
        box.appendChild(h("div", { class: "pb-grid-2" }, textField("Bouton dans la fenêtre (facultatif)", p.ctaLabel, set("ctaLabel"), { max: 60, disabled: disabled }), textField("Son adresse", p.ctaUrl, set("ctaUrl"), { list: "pb-links", disabled: disabled })));
        box.appendChild(selectField("Taille", p.size || "md", [["sm", "Petite"], ["md", "Moyenne"], ["lg", "Grande"]], function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { var d = frame.contentDocument && frame.contentDocument.getElementById("kw-m-" + it.id); if (d && d.showModal) { d.showModal(); var c = d.querySelector("[data-kw-modal-close]"); if (c) c.onclick = function () { d.close(); }; d.onclick = function (e) { if (e.target === d) d.close(); }; } } }, "Ouvrir la fenêtre dans le canevas"));
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
        box.appendChild(iconPicker(p.name, function (v) { setProp(it.id, "name", v); }, disabled));
        box.appendChild(textField("Lien au clic (facultatif)", p.link, set("link"), { list: "pb-links", disabled: disabled, placeholder: "/catalogue ou https://…", hint: "Une icône cliquable a besoin d'une description (ci-dessous)." }));
        if (p.link) box.appendChild(checkField("Nouvel onglet (https:// seulement)", p.newTab, function (v) { setProp(it.id, "newTab", v); }, { disabled: disabled }));
        box.appendChild(selectField("Taille", p.size, [["16", "16 px"], ["24", "24 px"], ["32", "32 px"], ["48", "48 px"], ["64", "64 px"], ["96", "96 px"], ["128", "128 px"]], function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        box.appendChild(textField("Description (si l'icône porte une information)", p.label, set("label"), { max: 80, disabled: disabled }));
        break;
      case "spacer":
        box.appendChild(selectField("Hauteur", p.size, ["8", "16", "24", "32", "48", "64", "80", "96", "128"].map(function (v) { return [v, v + " px"]; }), function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        break;
      default:
        box.appendChild(h("p", { class: "pb-hint", text: kidsOf(it) ? "Conteneur : " + kidsOf(it).length + " élément(s). Sa mise en page (direction, écarts, colonnes, alignement) se règle dans l'onglet Style." : "Aucun contenu à régler : voir l'onglet Style." }));
    }
  }
  // Choix d'une icône : grille de la bibliothèque du site, avec recherche (les noms sont en anglais)
  function iconPicker(current, onPick, disabled) {
    var q = h("input", { type: "search", class: "pb-icon-search", placeholder: "Rechercher une icône (star, mail, clock…)", "aria-label": "Rechercher une icône", disabled: disabled, autocomplete: "off" });
    var grid = h("div", { class: "pb-icon-grid", role: "listbox", "aria-label": "Icônes" });
    var draw = function () {
      var f = q.value.trim().toLowerCase();
      grid.textContent = "";
      SPEC.icons.filter(function (n) { return !f || n.toLowerCase().indexOf(f) >= 0; }).forEach(function (n) {
        grid.appendChild(h("button", { type: "button", role: "option", class: "pb-icon-opt", "aria-selected": String(n === current), "aria-label": n, "data-tip": n, "data-icon": n, disabled: disabled, onclick: function () { onPick(n); } }, icon(n)));
      });
      if (!grid.children.length) grid.appendChild(h("p", { class: "pb-hint", text: "Aucune icône ne correspond." }));
    };
    q.addEventListener("input", draw);
    draw();
    return h("div", { class: "pb-field" }, h("label", { text: "Icône : " + current }), q, grid);
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
    if (s.type === "form") {
      box.appendChild(h("p", { class: "pb-note" + (PAGE.formId && PAGE.formPublished ? "" : " is-warn"), text: PAGE.formId ? "Formulaire « " + PAGE.formName + " »" + (PAGE.formPublished ? "" : " (pas encore publié : la page ne pourra pas être publiée)") + "." : "Aucun formulaire choisi : la page ne peut pas être publiée." }));
      box.appendChild(h("div", { class: "pb-row pb-wrap" },
        PAGE.formId ? h("a", { class: "btn btn-outline btn-sm", href: "/marketing/formulaires/" + PAGE.formId, target: "_blank", rel: "noopener" }, "Champs, consentement, liste, messages") : null,
        h("a", { class: "btn btn-ghost btn-sm", href: "/marketing/pages/" + PAGE.id }, PAGE.formId ? "Choisir un autre formulaire" : "Choisir le formulaire")));
    }
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
  // ---------- Inspecteur : un schéma par type d'élément (registre extensible) ----------
  // groups : groupes de l'onglet Style et leurs propriétés (null = toutes celles du groupe ; true = contrôle composé) ;
  // states : styles de survol / focus / clic proposés. Un nouveau type d'élément ajoute ici son schéma.
  var BOX_LAYOUT = ["display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "gap", "rowGap", "columnGap"];
  var SIZE_W = ["width", "minWidth", "maxWidth"];
  var BOX = { layout: BOX_LAYOUT, size: null, spacing: true, color: null, background: true, border: null, effects: null };
  var TEXTUAL = { layout: ["alignSelf"], typography: null, color: null, size: SIZE_W, spacing: true, background: true, border: null, effects: ["boxShadow", "opacity", "transitionDuration"] };
  // Ordre des groupes selon la nature de l'élément (le premier est ouvert par défaut)
  var TEXT_ORDER = ["typography", "spacing", "size", "layout", "background", "border", "effects"];
  var INSPECTORS = {
    section: { kind: "Section", groups: BOX },
    container: { kind: "Conteneur", groups: BOX },
    columns: { kind: "Colonnes", groups: BOX },
    column: { kind: "Colonne", groups: BOX },
    stack: { kind: "Pile", groups: BOX },
    group: { kind: "Groupe", groups: BOX },
    grid: { kind: "Grille", groups: { layout: ["columns", "gridTemplate", "gridRows", "gap", "rowGap", "columnGap", "alignItems", "justifyContent"], size: null, spacing: true, color: null, background: true, border: null, effects: null } },
    heading: { kind: "Titre", groups: TEXTUAL, order: TEXT_ORDER },
    text: { kind: "Texte", groups: TEXTUAL, order: TEXT_ORDER },
    list: { kind: "Liste", groups: TEXTUAL, order: TEXT_ORDER },
    quote: { kind: "Citation", groups: TEXTUAL, order: TEXT_ORDER },
    code: { kind: "Code", groups: TEXTUAL, order: TEXT_ORDER },
    table: { kind: "Tableau", groups: TEXTUAL, order: TEXT_ORDER },
    tabs: { kind: "Onglets", groups: TEXTUAL, order: TEXT_ORDER },
    accordion: { kind: "Accordéon / FAQ", groups: TEXTUAL, order: TEXT_ORDER },
    countdown: { kind: "Compte à rebours", groups: TEXTUAL, order: TEXT_ORDER },
    badge: { kind: "Badge", groups: { layout: ["alignSelf"], typography: ["fontSize", "fontWeight", "textTransform", "letterSpacing"], spacing: true, border: null }, order: ["typography", "border", "spacing", "layout"] },
    timeline: { kind: "Chronologie", groups: TEXTUAL, order: TEXT_ORDER },
    progress: { kind: "Barre de progression", groups: { layout: ["alignSelf"], typography: ["fontSize", "fontWeight"], color: ["color"], size: SIZE_W, spacing: true }, order: ["size", "typography", "spacing", "layout"] },
    menu: { kind: "Menu", groups: TEXTUAL, order: TEXT_ORDER, states: true },
    toggle: { kind: "Bascule", groups: TEXTUAL, order: TEXT_ORDER },
    alert: { kind: "Alerte", groups: TEXTUAL, order: TEXT_ORDER },
    counter: { kind: "Compteur", groups: { layout: ["alignSelf"], typography: null, color: null, size: SIZE_W, spacing: true, effects: ["opacity", "transitionDuration"] }, order: ["typography", "spacing", "size", "layout", "effects"] },
    testimonial: { kind: "Témoignage", groups: { layout: ["alignSelf"], typography: null, color: null, size: SIZE_W, spacing: true, background: true, border: null, effects: null }, order: ["typography", "background", "border", "effects", "spacing", "size", "layout"], states: true },
    pricing: { kind: "Offre tarifaire", groups: { layout: ["alignSelf"], typography: null, color: null, size: SIZE_W, spacing: true, background: true, border: null, effects: null }, order: ["background", "border", "effects", "typography", "spacing", "size", "layout"], states: true },
    breadcrumb: { kind: "Fil d'Ariane", groups: TEXTUAL, order: TEXT_ORDER },
    social: { kind: "Réseaux sociaux", groups: { layout: ["alignSelf"], color: ["color"], spacing: true, effects: ["opacity"] }, order: ["color", "spacing", "layout", "effects"] },
    modal: { kind: "Fenêtre (modale)", groups: { layout: ["alignSelf"], spacing: true }, order: ["spacing", "layout"] },
    carousel: { kind: "Carrousel", groups: { layout: ["alignSelf"], size: SIZE_W, spacing: true, border: null, effects: null }, order: ["size", "border", "effects", "spacing", "layout"] },
    image: { kind: "Image", groups: { layout: ["alignSelf"], size: null, media: null, spacing: true, border: null, effects: null }, states: true, order: ["size", "media", "border", "effects", "spacing", "layout"] },
    gallery: { kind: "Galerie", groups: { layout: ["columns", "gap"], size: SIZE_W, spacing: true, border: null, effects: null }, order: ["layout", "size", "border", "effects", "spacing"] },
    video: { kind: "Vidéo", groups: { layout: ["alignSelf"], size: SIZE_W, spacing: true, border: null, effects: null }, order: ["size", "border", "effects", "spacing", "layout"] },
    audio: { kind: "Audio", groups: { layout: ["alignSelf"], size: SIZE_W, spacing: true, border: null, effects: null } },
    button: { kind: "Bouton", groups: { layout: ["alignSelf"], typography: null, color: null, background: true, size: SIZE_W, spacing: true, border: null, effects: null }, states: true, order: ["typography", "size", "background", "border", "spacing", "effects", "layout"] },
    link: { kind: "Lien", groups: { layout: ["alignSelf"], typography: null, color: ["color"], spacing: true }, states: true, order: TEXT_ORDER },
    icon: { kind: "Icône", groups: { layout: ["alignSelf"], color: ["color"], size: ["width", "height"], spacing: true }, states: true },
    spacer: { kind: "Espace", groups: { size: ["height"], spacing: true } },
    divider: { kind: "Séparateur", groups: { size: SIZE_W, border: null, spacing: true } },
    course: { kind: "Formation", groups: { layout: ["alignSelf"], size: SIZE_W, background: true, spacing: true, border: null, effects: null }, states: true },
    form: { kind: "Formulaire", groups: { size: null, spacing: true, color: null, background: true, border: null, effects: null }, presets: true },
    component: { kind: "Composant", groups: null },
    legacy: { kind: "Section prête", groups: { size: null, spacing: true, color: null, background: true, border: null, effects: null }, presets: true },
  };
  function inspectorFor(it) {
    if (!it) return null;
    if (it.type === "layout") return INSPECTORS.section;
    if (it.type === "component") return INSPECTORS.component;
    if (isNode(it)) return INSPECTORS[it.type] || { kind: typeLabel(it), groups: { spacing: true, size: null } };
    if (it.type === "form") return INSPECTORS.form;
    return Object.assign({}, INSPECTORS.legacy, { kind: LEGACY[it.type] ? LEGACY[it.type].label : INSPECTORS.legacy.kind });
  }
  var GROUP_ORDER = ["layout", "size", "spacing", "typography", "color", "background", "media", "border", "effects"];
  var optLabel = function (p, v) { var o = (p.options || []).find(function (x) { return String(x[0]) === String(v); }); return o ? o[1] : v; };
  var lockedAny = function (items) { return !canWrite || items.some(function (x) { return lockedDeep(x.id); }); };
  var idsOf = function (items) { return items.map(function (x) { return x.id; }); };
  // ---------- Contrôles de style compacts ----------
  // Une ligne par propriété : libellé | valeur | effacer. Le point devant le libellé signale une valeur propre à l'écran
  // modifié ; les petites icônes d'appareil, les écrans plus petits qui ont leur propre valeur pour cette propriété.
  var UNITS = {
    width: ["px", "%", "rem", "vw", "auto"], height: ["px", "%", "rem", "vh", "auto"],
    minWidth: ["px", "%", "rem", "vw"], maxWidth: ["px", "%", "rem", "vw"], minHeight: ["px", "%", "rem", "vh"], maxHeight: ["px", "%", "rem", "vh"],
    gap: ["px", "rem", "em", "%"], rowGap: ["px", "rem", "em", "%"], columnGap: ["px", "rem", "em", "%"], fontSize: ["px", "rem", "em"], letterSpacing: ["px", "em"], borderWidth: ["px"], borderTopWidth: ["px"], borderRightWidth: ["px"], borderBottomWidth: ["px"], borderLeftWidth: ["px"],
    borderRadius: ["px", "%", "rem"], borderTopLeftRadius: ["px", "%", "rem"], borderTopRightRadius: ["px", "%", "rem"], borderBottomRightRadius: ["px", "%", "rem"], borderBottomLeftRadius: ["px", "%", "rem"],
    top: ["px", "%", "rem"], left: ["px", "%", "rem"], right: ["px", "%", "rem"], bottom: ["px", "%", "rem"],
  };
  ["Top", "Right", "Bottom", "Left"].forEach(function (s) { UNITS["margin" + s] = ["px", "%", "rem", "em", "auto"]; UNITS["padding" + s] = ["px", "%", "rem", "em"]; });
  var unitsOf = function (key) { return (UNITS[key] || ["px", "%", "rem", "em"]).slice(); };
  // « 64px » → { num: "64", unit: "px" } ; « auto » → { num: "", unit: "auto" } ; « 0 » → { num: "0", unit: "px" }
  function splitLen(v) {
    if (v === undefined || v === null || v === "") return null;
    var s = String(v);
    if (s === "auto") return { num: "", unit: "auto" };
    var m = /^(-?[\d.]+)([a-z%]*)$/.exec(s);
    return m ? { num: m[1], unit: m[2] || "px" } : null;
  }
  var DEVICE_ICON = { desktop: "monitor", tablet: "tablet", smartphone: "smartphone", mobile: "smartphone" };
  // Flèches ↑ / ↓ : un pas (Maj : 10 pas, Alt : un dixième) ; chaque pas s'applique tout de suite, une seule étape d'annulation
  function arrowStep(input, step, read, write) {
    input.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      var d = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : e.altKey ? 0.1 : 1) * step;
      write(Math.round((read() + d) * 1000) / 1000);
    });
  }
  // Libellés courts dans les lignes (le nom complet reste en infobulle et pour les lecteurs d'écran)
  var SHORT = { alignItems: "Alignement", alignSelf: "Placement", flexWrap: "Retour ligne", justifyContent: "Répartition", gap: "Écart", rowGap: "Écart lignes", columnGap: "Écart colonnes", flexDirection: "Direction", display: "Affichage",
    minWidth: "Largeur min.", maxWidth: "Largeur max.", minHeight: "Hauteur min.", maxHeight: "Hauteur max.", flexGrow: "Proportion", columns: "Colonnes",
    fontFamily: "Police", fontWeight: "Graisse", fontSize: "Taille", lineHeight: "Interligne", letterSpacing: "Interlettrage", textTransform: "Casse", textAlign: "Alignement", textDecoration: "Décoration", fontStyle: "Style",
    zIndex: "Plan", boxShadow: "Ombre (préréglage)", gridTemplate: "Largeurs", gridRows: "Lignes", gridColumnSpan: "Colonnes occupées", gridRowSpan: "Lignes occupées", textShadow: "Ombre du texte", transitionDuration: "Transition (ms)", transformOrigin: "Origine", right: "Décalage droite", bottom: "Décalage bas", opacity: "Opacité", overflow: "Débordement", objectFit: "Cadrage", objectPosition: "Point focal", aspectRatio: "Proportions", top: "Décalage haut", left: "Décalage gauche" };
  function propRow(items, key, control, label, id, extra) {
    label = label || SHORT[key];
    var it = items[0];
    var own = ownValue(it, key);
    var dis = lockedAny(items);
    var others = styleState === "normal" ? BPS.filter(function (b) { return b !== "desktop" && it.styles && it.styles[b] && it.styles[b][key] !== undefined; }) : [];
    var marks = others.length ? h("span", { class: "pb-prop-bps" }, others.map(function (b) {
      return h("span", { class: "pb-prop-bp" + (b === device ? " is-current" : ""), title: "Valeur propre à l'écran « " + bpLabel(b) + " »", role: "img", "aria-label": "Valeur propre : " + bpLabel(b) }, icon(DEVICE_ICON[b]));
    })) : null;
    var reset = own !== undefined ? h("button", { type: "button", class: "pb-reset", "data-tip": "Effacer : revenir à la valeur héritée", "aria-label": "Effacer « " + (label || SP[key].label) + " » pour cet écran", disabled: dis, onclick: function () { setStyle(idsOf(items), key, ""); } }, "↺") : h("span", { class: "pb-reset-slot", "aria-hidden": "true" });
    return h("div", { class: "pb-field pb-style-field pb-prop" + (own !== undefined ? " is-set" : ""), "data-prop": key },
      h("div", { class: "pb-prop-head" }, h("label", { for: id, class: "pb-prop-label", title: SP[key].label, "aria-label": SP[key].label }, label || SP[key].label), marks),
      control, extra || null, reset);
  }
  function styleControl(items, key, label, extra) {
    var p = SP[key];
    var it = items[0];
    var own = ownValue(it, key);
    var mixed = items.some(function (x) { return JSON.stringify(ownValue(x, key)) !== JSON.stringify(own); });
    var inh = inheritedValue(it, key);
    var dis = lockedAny(items);
    var id = fid();
    var control;
    if (p.kind === "enum") {
      control = h("select", { id: id, class: "pb-prop-select", disabled: dis }, [h("option", { value: "", text: inh !== undefined ? "Hérité : " + optLabel(p, inh) : "Par défaut" })].concat(p.options.map(function (o) { return h("option", { value: o[0], text: o[1] }); })));
      control.value = mixed || own === undefined ? "" : String(own);
      control.addEventListener("change", function () { setStyle(idsOf(items), key, control.value); });
    } else if (p.kind === "color") control = colorButton(id, mixed ? undefined : own, inh, dis, function (v, opts) { setStyle(idsOf(items), key, v, opts); }, key);
    else if (p.kind === "number") control = numberControl(items, key, id, mixed ? undefined : own, inh, dis);
    else if (p.kind === "text") {
      control = h("input", { id: id, type: "text", class: "pb-prop-text", value: mixed || own === undefined ? "" : String(own), placeholder: inh !== undefined ? String(inh) : "ex. 2fr 1fr", disabled: dis, autocomplete: "off" });
      control.addEventListener("change", function () {
        var v = control.value.trim().toLowerCase().replace(/\s+/g, " ");
        if (v && !/^((\d{1,2}(\.\d)?fr|\d{1,4}px|\d{1,3}%|auto)( |$)){1,12}$/.test(v + " ")) { control.setAttribute("aria-invalid", "true"); toast(p.label + " : valeurs séparées par des espaces, parmi 1fr, 240px, 30%, auto (12 au plus).", true); return; }
        setStyle(idsOf(items), key, v);
      });
    }
    else control = lengthControl(items, key, id, mixed ? undefined : own, inh, dis);
    return propRow(items, key, control, label, id, extra);
  }
  // Nombres sans unité : bornes et pas de chaque propriété (les mêmes que le serveur)
  var NUM = { opacity: [0, 1, 0.05], lineHeight: [0.8, 3, 0.1], zIndex: [-10, 100, 1], columns: [1, 12, 1], flexGrow: [0.05, 20, 0.1], gridRows: [1, 12, 1], gridColumnSpan: [1, 12, 1], gridRowSpan: [1, 6, 1], transitionDuration: [0, 2000, 50] };
  function numberControl(items, key, id, own, inh, dis) {
    var lim = NUM[key] || [-9999, 9999, 1];
    var inp = h("input", { id: id, type: "text", inputmode: "decimal", class: "pb-num", placeholder: inh !== undefined ? String(inh) : key === "opacity" ? "1" : "", disabled: dis, autocomplete: "off" });
    inp.value = own === undefined ? "" : String(own);
    var clamp = function (n) { n = Math.min(lim[1], Math.max(lim[0], n)); return lim[2] === 1 ? Math.round(n) : Math.round(n * 1000) / 1000; };
    inp.addEventListener("change", function () {
      var s = inp.value.trim().replace(",", ".");
      if (s === "") { setStyle(idsOf(items), key, ""); return; }
      var n = Number(s);
      if (!isFinite(n)) { inp.setAttribute("aria-invalid", "true"); toast(SP[key].label + " : nombre attendu.", true); return; }
      setStyle(idsOf(items), key, clamp(n));
    });
    arrowStep(inp, lim[2], function () { var v = Number((inp.value || inp.placeholder || "0").replace(",", ".")); return isFinite(v) ? v : 0; }, function (n) { n = clamp(n); inp.value = String(n); setStyle(idsOf(items), key, n, { key: "step:" + key, light: true }); });
    return h("div", { class: "pb-len" }, inp, key === "opacity" ? h("span", { class: "pb-len-unit is-static", text: "0 – 1" }) : null);
  }
  // Longueurs : valeur + unité (seules les unités utiles à la propriété) ; « 2rem » tapé directement est compris
  function lengthControl(items, key, id, own, inh, dis) {
    var units = unitsOf(key);
    var cur = splitLen(own), base = splitLen(inh);
    var unit = cur ? cur.unit : base ? base.unit : units[0];
    if (units.indexOf(unit) < 0) units.push(unit);
    var num = h("input", { id: id, type: "text", inputmode: "decimal", class: "pb-len-num", value: cur && cur.unit !== "auto" ? cur.num : "", placeholder: base ? (base.unit === "auto" ? "auto" : base.num) : cur && cur.unit === "auto" ? "auto" : "–", disabled: dis || unit === "auto", autocomplete: "off" });
    var sel = units.length > 1 ? h("select", { class: "pb-len-unit", "aria-label": SP[key].label + " : unité", disabled: dis }, units.map(function (u) { return h("option", { value: u, text: u }); })) : h("span", { class: "pb-len-unit is-static", text: units[0] });
    if (sel.tagName === "SELECT") sel.value = unit;
    var unitNow = function () { return sel.tagName === "SELECT" ? sel.value : units[0]; };
    var commit = function (opts) {
      var u = unitNow();
      if (u === "auto") { setStyle(idsOf(items), key, "auto", opts); return; }
      var raw = num.value.trim().replace(",", ".");
      if (raw === "") { setStyle(idsOf(items), key, "", opts); return; }
      var typed = /^(-?\d{1,4}(?:\.\d{1,3})?)\s*(px|%|rem|em|vh|vw)$/i.exec(raw);
      var v = typed ? typed[1] + typed[2].toLowerCase() : /^-?\d{1,4}(\.\d{1,3})?$/.test(raw) ? (Number(raw) === 0 ? "0" : raw + u) : raw;
      var ok = parseLength(v, key);
      if (ok === null) { num.setAttribute("aria-invalid", "true"); toast(SP[key].label + " : valeur invalide (ex. 24, 50 %, 2rem" + (units.indexOf("auto") >= 0 ? ", auto" : "") + ").", true); return; }
      num.removeAttribute("aria-invalid");
      setStyle(idsOf(items), key, ok, opts);
    };
    num.addEventListener("change", function () { commit(); });
    if (sel.tagName === "SELECT") sel.addEventListener("change", function () {
      if (sel.value === "auto" || num.value.trim() !== "") commit();
      else { num.disabled = false; num.focus(); }
    });
    arrowStep(num, 1, function () { var v = parseFloat(num.value || (base && base.unit !== "auto" ? base.num : "0")); return isFinite(v) ? v : 0; }, function (n) {
      if (n < 0 && !/^(margin|top|left|letterSpacing)/.test(key)) n = 0;
      if (unitNow() === "auto" && sel.tagName === "SELECT") { sel.value = units[0]; num.disabled = false; }
      num.value = String(n);
      commit({ key: "step:" + key, light: true });
    });
    return h("div", { class: "pb-len" }, num, sel);
  }

  // ---------- Couleurs : bouton compact (pastille + code) et sélecteur ----------
  var TOKEN_LABEL = { primary: "Principale", secondary: "Secondaire", accent: "Accent", background: "Fond", surface: "Surface", text: "Texte", muted: "Atténuée", success: "Succès", warning: "Alerte", error: "Erreur", "on-primary": "Sur principale", "on-accent": "Sur accent" };
  // Couleur réelle d'une couleur du site (thème appliqué à la page affichée dans le canevas)
  function tokenColor(t) { try { var d = frame.contentDocument; var c = d && d.body ? getComputedStyle(d.body).getPropertyValue("--kw-" + t).trim() : ""; return c || null; } catch (e) { return null; } }
  var colorPreview = function (v) { return !v ? null : v === "transparent" ? "transparent" : v.indexOf("token:") === 0 ? tokenColor(v.slice(6)) : v; };
  var colorText = function (v) { return !v ? "" : v === "transparent" ? "Transparente" : v.indexOf("token:") === 0 ? "Site : " + (TOKEN_LABEL[v.slice(6)] || v.slice(6)) : v.toUpperCase(); };
  var hex2 = function (n) { return ("0" + Math.max(0, Math.min(255, Math.round(n))).toString(16)).slice(-2); };
  function normHex(v) { var s = String(v).toLowerCase(); if (s.length === 4) s = "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]; return s; }
  function hexToRgb(v) { var s = normHex(v); return { r: parseInt(s.slice(1, 3), 16), g: parseInt(s.slice(3, 5), 16), b: parseInt(s.slice(5, 7), 16), a: s.length === 9 ? parseInt(s.slice(7, 9), 16) / 255 : 1 }; }
  function rgbToHsl(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255, max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, s = 0, hh = 0, d = max - min;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); hh = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; hh = Math.round(hh * 60); if (hh < 0) hh += 360; }
    return hh + "°, " + Math.round(s * 100) + " %, " + Math.round(l * 100) + " %";
  }
  function hslToHex(hh, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + hh / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return "#" + hex2(f(0) * 255) + hex2(f(8) * 255) + hex2(f(4) * 255);
  }
  // Saisie libre : #RGB, #RRGGBB, #RRGGBBAA, rgb(a)(r, g, b[, a]), hsl(a)(t, s %, l %[, a]) → #rrggbb[aa]
  function parseColor(text) {
    var s = String(text || "").trim().toLowerCase().replace(/\s+/g, "");
    if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(s)) return normHex(s);
    if (/^[0-9a-f]{6}$/.test(s)) return "#" + s;
    var alpha = function (x) { if (x === undefined) return ""; var a = /%$/.test(x) ? parseFloat(x) / 100 : parseFloat(x); return isFinite(a) && a < 1 ? hex2(Math.max(0, a) * 255) : ""; };
    var m = /^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,([\d.]+%?))?\)$/.exec(s);
    if (m && [m[1], m[2], m[3]].every(function (x) { return Number(x) <= 255; })) return "#" + hex2(m[1]) + hex2(m[2]) + hex2(m[3]) + alpha(m[4]);
    m = /^hsla?\((\d{1,3})(?:deg)?,(\d{1,3})%,(\d{1,3})%(?:,([\d.]+%?))?\)$/.exec(s);
    if (m && Number(m[1]) <= 360 && Number(m[2]) <= 100 && Number(m[3]) <= 100) return hslToHex(Number(m[1]), Number(m[2]), Number(m[3])) + alpha(m[4]);
    return null;
  }
  function paintSwatch(sw, v) {
    sw.className = "pb-swatch" + (!v ? " is-empty" : v === "transparent" ? " is-transparent" : "");
    var c = v && v !== "transparent" ? colorPreview(v) : null;
    sw.style.background = c || "";
    if (v && v !== "transparent" && !c) sw.classList.add("is-empty");
  }
  // opts.noClear : pas de « par défaut » (couleurs d'un dégradé)
  function colorButton(id, own, inh, dis, onSet, histKey, opts) {
    opts = opts || {};
    var sw = h("span", { class: "pb-swatch", "aria-hidden": "true" });
    paintSwatch(sw, own || inh);
    var text = h("span", { class: "pb-color-text", text: own ? colorText(own) : inh ? colorText(inh) + " · hérité" : "Par défaut" });
    var btn = h("button", { type: "button", id: id, class: "pb-color-btn" + (own ? "" : " is-inherited"), disabled: dis, "aria-haspopup": "dialog", "data-color-key": histKey }, sw, text);
    btn.addEventListener("click", function () { if (!cpop.hidden && cpopFor === btn) { closeColorPop(); return; } openColorPop(btn, own, inh, onSet, opts); });
    return btn;
  }
  var cpop = h("div", { class: "pb-cpop", role: "dialog", "aria-label": "Choisir une couleur", hidden: true });
  document.body.appendChild(cpop);
  var cpopFor = null, cpopDirty = false;
  function closeColorPop(noRender) {
    if (cpop.hidden) return;
    cpop.hidden = true;
    var f = cpopFor; cpopFor = null;
    if (cpopDirty && !noRender) { cpopDirty = false; renderInspector(); renderContext(); var again = f && f.dataset.colorKey ? $("[data-pb-inspector] [data-color-key='" + f.dataset.colorKey + "']") : null; if (again) again.focus(); }
    else if (f && document.body.contains(f)) f.focus();
    cpopDirty = false;
  }
  function openColorPop(btn, own, inh, onSet, opts) {
    closeColorPop(true);
    cpopFor = btn; cpopDirty = false;
    cpop.textContent = "";
    var hk = "color:" + (btn.dataset.colorKey || "x");
    var cur = own && /^#/.test(own) ? normHex(own) : null;
    var state = { hex: cur ? cur.slice(0, 7) : "#0277b6", alpha: cur && cur.length === 9 ? parseInt(cur.slice(7), 16) / 255 : 1 };
    var sw = btn.querySelector(".pb-swatch"), label = btn.querySelector(".pb-color-text");
    var hexIn = h("input", { type: "text", class: "pb-cpop-hex", value: cur ? cur.toUpperCase() : "", placeholder: "#RRGGBB, rgb(…), hsl(…)", "aria-label": "Code couleur (HEX, RGB ou HSL)", autocomplete: "off", spellcheck: "false" });
    var native = h("input", { type: "color", value: state.hex, "aria-label": "Nuancier", class: "pb-cpop-native" });
    var alpha = h("input", { type: "range", min: "0", max: "100", step: "1", value: String(Math.round(state.alpha * 100)), "aria-label": "Opacité de la couleur (en %)" });
    var alphaOut = h("output", { class: "pb-cpop-alpha", text: Math.round(state.alpha * 100) + " %" });
    var info = h("p", { class: "pb-cpop-info", "aria-live": "polite" });
    var show = function (v) {
      paintSwatch(sw, v);
      label.textContent = v ? colorText(v) : "Par défaut";
      btn.classList.toggle("is-inherited", !v);
      var rgb = v && /^#/.test(v) ? hexToRgb(v) : null;
      info.textContent = rgb ? "RGB " + rgb.r + ", " + rgb.g + ", " + rgb.b + (rgb.a < 1 ? " · opacité " + Math.round(rgb.a * 100) + " %" : "") + " · HSL " + rgbToHsl(rgb) : v ? colorText(v) : "";
      $$(".pb-cpop-token", cpop).forEach(function (x) { x.classList.toggle("is-on", v === "token:" + x.dataset.token); });
    };
    var set = function (v) { cpopDirty = true; show(v); onSet(v, { key: hk, light: true }); };
    var applyHex = function () { var v = state.hex + (state.alpha < 0.999 ? hex2(state.alpha * 255) : ""); hexIn.value = v.toUpperCase(); hexIn.removeAttribute("aria-invalid"); set(v); };
    native.addEventListener("input", function () { state.hex = native.value; applyHex(); });
    alpha.addEventListener("input", function () { state.alpha = Number(alpha.value) / 100; alphaOut.textContent = alpha.value + " %"; applyHex(); });
    hexIn.addEventListener("change", function () {
      var c = parseColor(hexIn.value);
      if (!c) { hexIn.setAttribute("aria-invalid", "true"); toast("Couleur : #RRGGBB, rgb(r, g, b) ou hsl(t, s %, l %) attendu.", true); return; }
      state.hex = c.slice(0, 7); state.alpha = c.length === 9 ? parseInt(c.slice(7), 16) / 255 : 1;
      native.value = state.hex; alpha.value = String(Math.round(state.alpha * 100)); alphaOut.textContent = alpha.value + " %";
      applyHex();
    });
    hexIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); hexIn.dispatchEvent(new Event("change")); } });
    var tokens = h("div", { class: "pb-cpop-tokens", role: "group", "aria-label": "Couleurs du site" }, SPEC.colorTokens.map(function (t) {
      var c = tokenColor(t);
      var b = h("button", { type: "button", class: "pb-cpop-token" + (c ? "" : " is-empty"), "data-token": t, "data-tip": "Site : " + (TOKEN_LABEL[t] || t) + (c ? " (" + c + ")" : " — définie par le thème du site"), "aria-label": "Couleur du site : " + (TOKEN_LABEL[t] || t) });
      if (c) b.style.background = c;
      b.addEventListener("click", function () { set("token:" + t); });
      return b;
    }));
    cpop.appendChild(h("div", { class: "pb-cpop-row" }, native, hexIn));
    cpop.appendChild(h("div", { class: "pb-cpop-row" }, h("span", { class: "pb-cpop-label", text: "Opacité" }), alpha, alphaOut));
    cpop.appendChild(info);
    cpop.appendChild(h("p", { class: "pb-cpop-label", text: "Couleurs du site" }));
    if (!SPEC.colorTokens.some(tokenColor)) cpop.appendChild(h("p", { class: "pb-cpop-none", text: "Cette page n'utilise pas de thème de site : ces couleurs n'y ont pas de valeur (reliez la page à un site pour les utiliser)." }));
    cpop.appendChild(tokens);
    cpop.appendChild(h("div", { class: "pb-cpop-row pb-cpop-actions" },
      h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function () { set("transparent"); } }, "Transparente"),
      opts.noClear ? null : h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function () { cpopDirty = true; onSet("", {}); closeColorPop(); } }, inh ? "Hériter" : "Par défaut"),
      h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { closeColorPop(); } }, "OK")));
    show(own);
    if (!own) info.textContent = inh ? "Valeur héritée : " + colorText(inh) : "Aucune couleur réglée pour cet écran.";
    cpop.hidden = false;
    var r = btn.getBoundingClientRect(), w = cpop.offsetWidth, hgt = cpop.offsetHeight;
    var left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
    var top = r.bottom + 4 + hgt > window.innerHeight - 8 ? Math.max(8, r.top - hgt - 4) : r.bottom + 4;
    cpop.style.left = left + "px"; cpop.style.top = top + "px";
    hexIn.focus();
  }
  document.addEventListener("mousedown", function (e) { if (!cpop.hidden && !cpop.contains(e.target) && !(cpopFor && cpopFor.contains(e.target))) closeColorPop(); });
  cpop.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeColorPop(); } });

  // ---------- Espacement : modèle de boîte compact (marges autour, intérieur dedans), côtés liables ----------
  var SIDES = ["Top", "Right", "Bottom", "Left"];
  var SIDE_LABEL = { Top: "haut", Right: "droite", Bottom: "bas", Left: "gauche" };
  var linkState = store.get("spacing-link", { margin: false, padding: false });
  function spacingBox(items) {
    var it = items[0], dis = lockedAny(items), ids = idsOf(items);
    var cell = function (kind, side) {
      var key = kind + side;
      var own = ownValue(it, key), inh = inheritedValue(it, key);
      var name = (kind === "margin" ? "Marge " : "Intérieur ") + SIDE_LABEL[side];
      var inp = h("input", { type: "text", inputmode: "decimal", class: "pb-box-input is-" + kind[0] + side[0].toLowerCase() + (own !== undefined ? " is-set" : ""), list: "pb-scale", value: own === undefined ? "" : own, placeholder: inh !== undefined ? String(inh) : "0", "aria-label": name + (linkState[kind] ? " (4 côtés liés)" : ""), "data-tip": name + (inh !== undefined && own === undefined ? " · hérité : " + inh : ""), disabled: dis, autocomplete: "off", "data-prop": key });
      var commit = function (v, opts) {
        var map = {};
        (linkState[kind] ? SIDES : [side]).forEach(function (s) { map[kind + s] = v; });
        setStyles(ids, map, opts);
      };
      inp.addEventListener("change", function () {
        var v = parseLength(inp.value, key);
        if (v === null) { inp.setAttribute("aria-invalid", "true"); toast(name + " : valeur invalide (ex. 24, 2rem" + (kind === "margin" ? ", auto" : "") + ").", true); return; }
        commit(v);
      });
      arrowStep(inp, 1, function () { var p = splitLen(inp.value || inp.placeholder); return p && p.unit !== "auto" ? Number(p.num) : 0; }, function (n) {
        var p = splitLen(inp.value || inp.placeholder) || { unit: "px" };
        if (n < 0 && kind === "padding") n = 0;
        var v = n === 0 ? "0" : n + (p.unit === "auto" ? "px" : p.unit);
        inp.value = v;
        if (linkState[kind]) $$("[data-pb-inspector] .pb-box-input[data-prop^='" + kind + "']").forEach(function (x) { x.value = v; });
        commit(v, { key: "step:" + kind, light: true });
      });
      return inp;
    };
    var linkBtn = function (kind, label) {
      var on = Boolean(linkState[kind]);
      return h("button", { type: "button", class: "pb-link-btn", "aria-pressed": String(on), "data-link": kind, "aria-label": (on ? "Délier les côtés : " : "Lier les 4 côtés : ") + label, "data-tip": on ? label + " : 4 côtés liés (une valeur pour tous)" : label + " : côtés indépendants — cliquer pour les lier", disabled: dis,
        onclick: function () {
          linkState[kind] = !on; store.set("spacing-link", linkState);
          if (!on) {
            var vals = SIDES.map(function (s) { return ownValue(it, kind + s); });
            var first = vals.filter(function (v) { return v !== undefined; })[0];
            if (first !== undefined && vals.some(function (v) { return v !== first; })) {
              var map = {}; SIDES.forEach(function (s) { map[kind + s] = first; });
              setStyles(ids, map);
              toast(label + " : les 4 côtés valent maintenant " + first + ".");
              return;
            }
          }
          renderInspector();
        } }, icon("link"), h("span", { text: label }));
    };
    return h("div", { class: "pb-spacing" },
      h("div", { class: "pb-spacing-head" }, linkBtn("margin", "Marge"), linkBtn("padding", "Intérieur")),
      h("div", { class: "pb-boxmodel" },
        h("span", { class: "pb-box-label", text: "Marge", "aria-hidden": "true" }),
        h("div", { class: "pb-box-pad", "aria-hidden": "true" }, h("span", { class: "pb-box-label", text: "Intérieur" })),
        cell("margin", "Top"), cell("margin", "Right"), cell("margin", "Bottom"), cell("margin", "Left"),
        cell("padding", "Top"), cell("padding", "Right"), cell("padding", "Bottom"), cell("padding", "Left"),
        h("span", { class: "pb-box-core", "aria-hidden": "true" })));
  }

  // ---------- Bordure : style d'abord ; épaisseur et couleur seulement s'il y a une bordure ; arrondi liable ----------
  var CORNER_KEYS = [["borderTopLeftRadius", "↖ Haut gauche"], ["borderTopRightRadius", "↗ Haut droit"], ["borderBottomRightRadius", "↘ Bas droit"], ["borderBottomLeftRadius", "↙ Bas gauche"]];
  var radiusSplit = {}, widthSplit = {};
  var SIDE_WIDTHS = [["borderTopWidth", "↑ Haut"], ["borderRightWidth", "→ Droite"], ["borderBottomWidth", "↓ Bas"], ["borderLeftWidth", "← Gauche"]];
  var valueOf = function (it, k) { var o = ownValue(it, k); return o !== undefined ? o : inheritedValue(it, k); };
  function borderControls(items, inner) {
    var it = items[0], ids = idsOf(items), dis = lockedAny(items);
    inner.appendChild(styleControl(items, "borderStyle", "Style"));
    var style = valueOf(it, "borderStyle");
    if ((style && style !== "none") || ownValue(it, "borderWidth") !== undefined || ownValue(it, "borderColor") !== undefined || SIDE_WIDTHS.some(function (k) { return ownValue(it, k[0]) !== undefined; })) {
      // Épaisseur : une valeur (liée) ou une par côté (ex. seulement une ligne en bas)
      var wsplit = widthSplit[it.id] || SIDE_WIDTHS.some(function (k) { return valueOf(it, k[0]) !== undefined; });
      var wlink = h("button", { type: "button", class: "pb-link-btn is-icon", "aria-pressed": String(!wsplit), "data-link": "border-width", "aria-label": wsplit ? "Lier les 4 côtés (une épaisseur)" : "Délier : une épaisseur par côté", "data-tip": wsplit ? "Côtés indépendants — cliquer pour une seule épaisseur" : "4 côtés liés — cliquer pour régler chaque côté", disabled: dis,
        onclick: function () {
          if (wsplit) {
            var first = SIDE_WIDTHS.map(function (k) { return ownValue(it, k[0]); }).filter(function (v) { return v !== undefined; })[0];
            var map = {}; SIDE_WIDTHS.forEach(function (k) { map[k[0]] = ""; });
            if (first !== undefined) map.borderWidth = first;
            delete widthSplit[it.id];
            setStyles(ids, map);
          } else {
            widthSplit[it.id] = true;
            // Sans épaisseur générale, le navigateur mettrait 3 px aux côtés non réglés : on part de 0 (seuls les côtés réglés se voient)
            if (valueOf(it, "borderWidth") === undefined) { setStyle(ids, "borderWidth", "0"); toast("Épaisseur par côté : les côtés non réglés restent à 0."); }
            else renderInspector();
          }
        } }, icon("link"));
      if (!wsplit) inner.appendChild(styleControl(items, "borderWidth", "Épaisseur", wlink));
      else {
        inner.appendChild(h("div", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Épaisseur par côté" }), wlink));
        inner.appendChild(styleControl(items, "borderWidth", "Tous les côtés"));
        SIDE_WIDTHS.forEach(function (k) { inner.appendChild(styleControl(items, k[0], k[1])); });
      }
      inner.appendChild(styleControl(items, "borderColor", "Couleur"));
    }
    var split = radiusSplit[it.id] || CORNER_KEYS.some(function (c) { return valueOf(it, c[0]) !== undefined; });
    var link = h("button", { type: "button", class: "pb-link-btn is-icon", "aria-pressed": String(!split), "data-link": "radius", "aria-label": split ? "Lier les 4 coins (un seul arrondi)" : "Délier : un arrondi par coin", "data-tip": split ? "Coins indépendants — cliquer pour un seul arrondi" : "4 coins liés — cliquer pour régler chaque coin", disabled: dis,
      onclick: function () {
        if (split) {
          var first = CORNER_KEYS.map(function (c) { return ownValue(it, c[0]); }).filter(function (v) { return v !== undefined; })[0];
          var map = {}; CORNER_KEYS.forEach(function (c) { map[c[0]] = ""; });
          if (first !== undefined) map.borderRadius = first;
          delete radiusSplit[it.id];
          setStyles(ids, map);
        } else { radiusSplit[it.id] = true; renderInspector(); }
      } }, icon("link"));
    if (!split) { inner.appendChild(styleControl(items, "borderRadius", "Arrondi", link)); return; }
    inner.appendChild(h("div", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Arrondi par coin" }), link));
    inner.appendChild(styleControl(items, "borderRadius", "Tous les coins"));
    CORNER_KEYS.forEach(function (c) { inner.appendChild(styleControl(items, c[0], c[1])); });
  }

  // ---------- Fond : type (aucun, couleur, image, dégradé) puis seulement ses réglages ----------
  var bgChoice = {};
  function bgTypeOf(it) { return valueOf(it, "gradient") ? "gradient" : valueOf(it, "backgroundImage") ? "image" : valueOf(it, "backgroundColor") ? "color" : "none"; }
  function backgroundControls(items, inner) {
    var it = items[0], ids = idsOf(items), dis = lockedAny(items);
    var type = bgChoice[it.id] || bgTypeOf(it);
    var id = fid();
    var sel = h("select", { id: id, class: "pb-prop-select", disabled: dis }, [["none", "Aucun"], ["color", "Couleur"], ["image", "Image"], ["gradient", "Dégradé"]].map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
    sel.value = type;
    sel.addEventListener("change", function () {
      if (sel.value === "none") { delete bgChoice[it.id]; setStyles(ids, { backgroundColor: "", backgroundImage: "", gradient: "", overlay: "", backgroundSize: "", backgroundPosition: "", backgroundRepeat: "", backgroundAttachment: "" }); return; }
      bgChoice[it.id] = sel.value;
      if (sel.value === "gradient" && !valueOf(it, "gradient")) { setStyle(ids, "gradient", { from: "#0277b6", to: "#102a3a", angle: 180 }); return; }
      renderInspector();
    });
    inner.appendChild(h("div", { class: "pb-field pb-style-field pb-prop", "data-prop": "backgroundType" }, h("div", { class: "pb-prop-head" }, h("label", { for: id, class: "pb-prop-label" }, "Type")), sel, h("span", { class: "pb-reset-slot", "aria-hidden": "true" })));
    var has = function (k) { return ownValue(it, k) !== undefined; };
    if (type === "color" || has("backgroundColor")) inner.appendChild(styleControl(items, "backgroundColor", type === "color" ? "Couleur" : "Couleur dessous"));
    if (type === "image" || has("backgroundImage")) {
      var bg = ownValue(it, "backgroundImage");
      var pid = fid();
      var pick = h("button", { type: "button", id: pid, class: "pb-img-btn", disabled: dis, onclick: function () { openMedia({ title: "Image de fond", onPick: function (m) { setStyle(ids, "backgroundImage", { src: m.path }); } }); } },
        bg ? h("img", { src: bg.src, alt: "" }) : h("span", { class: "pb-img-empty", "aria-hidden": "true" }), h("span", { class: "pb-color-text", text: bg ? bg.src.split("/").pop() : "Choisir une image" }));
      var rm = bg ? h("button", { type: "button", class: "pb-reset", "data-tip": "Retirer l'image de fond", "aria-label": "Retirer l'image de fond", disabled: dis, onclick: function () { setStyle(ids, "backgroundImage", ""); } }, "↺") : h("span", { class: "pb-reset-slot", "aria-hidden": "true" });
      inner.appendChild(h("div", { class: "pb-field pb-style-field pb-prop" + (bg ? " is-set" : ""), "data-prop": "backgroundImage" }, h("div", { class: "pb-prop-head" }, h("label", { for: pid, class: "pb-prop-label" }, "Image")), pick, rm));
      if (bg || valueOf(it, "backgroundImage")) {
        inner.appendChild(styleControl(items, "backgroundSize", "Taille"));
        inner.appendChild(styleControl(items, "backgroundPosition", "Position"));
        inner.appendChild(styleControl(items, "backgroundRepeat", "Répétition"));
        inner.appendChild(styleControl(items, "backgroundAttachment", "Défilement"));
      }
    }
    // Voile : une couleur (souvent semi-transparente) posée sur l'image ou le dégradé, pour la lisibilité du texte
    if (type === "image" || type === "gradient" || has("overlay")) {
      var ov = ownValue(it, "overlay"), ovi = inheritedValue(it, "overlay");
      var oid = fid();
      var ovBtn = colorButton(oid, ov && ov.color, ovi && ovi.color, dis, function (v, opts) { setStyle(ids, "overlay", v ? { color: v } : "", opts); }, "overlay");
      var ovReset = ov ? h("button", { type: "button", class: "pb-reset", "data-tip": "Retirer le voile", "aria-label": "Retirer le voile", disabled: dis, onclick: function () { setStyle(ids, "overlay", ""); } }, "↺") : h("span", { class: "pb-reset-slot", "aria-hidden": "true" });
      inner.appendChild(h("div", { class: "pb-field pb-style-field pb-prop" + (ov ? " is-set" : ""), "data-prop": "overlay" }, h("div", { class: "pb-prop-head" }, h("label", { for: oid, class: "pb-prop-label", title: "Voile coloré posé sur le fond (choisir une opacité dans le sélecteur)" }, "Voile")), ovBtn, ovReset));
    }
    if (type === "gradient" || has("gradient")) {
      var g = valueOf(it, "gradient");
      var gset = function (part) { return function (v, opts) { if (!v) return; var cur = Object.assign({ from: "#0277b6", to: "#102a3a", angle: 180 }, valueOf(byId(it.id), "gradient") || {}); cur[part] = v; setStyle(ids, "gradient", cur, opts); }; };
      var row = function (label, control, cid) { return h("div", { class: "pb-field pb-style-field pb-prop" }, h("div", { class: "pb-prop-head" }, h("label", { for: cid, class: "pb-prop-label" }, label)), control, h("span", { class: "pb-reset-slot", "aria-hidden": "true" })); };
      var f1 = fid(), f2 = fid(), f3 = fid();
      inner.appendChild(row("Départ", colorButton(f1, g && g.from, undefined, dis, gset("from"), "gradient-from", { noClear: true }), f1));
      inner.appendChild(row("Arrivée", colorButton(f2, g && g.to, undefined, dis, gset("to"), "gradient-to", { noClear: true }), f2));
      var ang = h("input", { id: f3, type: "text", inputmode: "numeric", class: "pb-len-num", value: g ? String(g.angle) : "180", disabled: dis, autocomplete: "off" });
      var setAngle = function (n, opts) { n = ((Math.round(n) % 360) + 360) % 360; ang.value = String(n); gset("angle")(n, opts); };
      ang.addEventListener("change", function () { var n = Number(ang.value); if (!isFinite(n)) { toast("Angle : nombre de degrés attendu.", true); return; } setAngle(n); });
      arrowStep(ang, 1, function () { return Number(ang.value) || 0; }, function (n) { setAngle(n, { key: "step:gradient-angle", light: true }); });
      inner.appendChild(row("Angle", h("div", { class: "pb-len" }, ang, h("span", { class: "pb-len-unit is-static", text: "°" })), f3));
      if (has("gradient")) inner.appendChild(h("div", { class: "pb-prop-sub" }, h("span"), h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis, onclick: function () { if (bgChoice[it.id] === "gradient") delete bgChoice[it.id]; setStyle(ids, "gradient", ""); } }, "Retirer le dégradé")));
    }
  }
  function composedControls(items, group) {
    var it = items[0];
    var dis = lockedAny(items);
    var ids = idsOf(items);
    var out = [];
    if (group === "effects") {
      var sh = ownValue(it, "shadow"), shi = inheritedValue(it, "shadow"), cur = sh || shi || { x: 0, y: 6, blur: 18, spread: 0, color: "#10222f29" };
      var put = function (k, v, opts) { var next = Object.assign({ x: 0, y: 6, blur: 18, spread: 0, color: "#10222f29" }, ownValue(byId(it.id), "shadow") || shi || {}); next[k] = v; setStyle(ids, "shadow", next, opts); };
      var num = function (k, label, min, max) {
        var id = fid();
        var inp = h("input", { id: id, type: "text", inputmode: "numeric", class: "pb-len-num", value: sh ? String(sh[k]) : "", placeholder: String(cur[k]), disabled: dis, autocomplete: "off" });
        inp.addEventListener("change", function () { var n = Math.round(Number(inp.value)); if (!isFinite(n) || n < min || n > max) { toast(label + " : entre " + min + " et " + max + ".", true); return; } put(k, n); });
        arrowStep(inp, 1, function () { return Number(inp.value || inp.placeholder) || 0; }, function (n) { n = Math.min(max, Math.max(min, Math.round(n))); inp.value = String(n); put(k, n, { key: "step:shadow" + k, light: true }); });
        return h("div", { class: "pb-field pb-style-field pb-prop" }, h("div", { class: "pb-prop-head" }, h("label", { for: id, class: "pb-prop-label" }, label)), h("div", { class: "pb-len" }, inp, h("span", { class: "pb-len-unit is-static", text: "px" })), h("span", { class: "pb-reset-slot", "aria-hidden": "true" }));
      };
      out.push(h("p", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Ombre personnalisée" }), sh ? h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis, onclick: function () { setStyle(ids, "shadow", ""); } }, "Retirer") : null));
      var sc = fid();
      out.push(num("x", "Décalage X", -100, 100), num("y", "Décalage Y", -100, 100), num("blur", "Flou", 0, 200), num("spread", "Étendue", -50, 100),
        h("div", { class: "pb-field pb-style-field pb-prop" + (sh ? " is-set" : ""), "data-prop": "shadow" }, h("div", { class: "pb-prop-head" }, h("label", { for: sc, class: "pb-prop-label" }, "Couleur")), colorButton(sc, sh && sh.color, shi && shi.color, dis, function (v, opts) { if (v) put("color", v, opts); }, "shadow", { noClear: true }), h("span", { class: "pb-reset-slot", "aria-hidden": "true" })));
    }
    if (group === "position") {
      var t = ownValue(it, "transform") || {};
      var mk = function (k, label, unit) {
        var id = fid();
        var inp = h("input", { id: id, type: "text", inputmode: "decimal", class: "pb-len-num", value: t[k] === undefined ? "" : t[k], disabled: dis, placeholder: k === "scale" ? "1" : "0", autocomplete: "off" });
        inp.addEventListener("change", function () {
          var next = Object.assign({}, ownValue(byId(it.id), "transform") || {});
          var v = inp.value.trim();
          if (k === "x" || k === "y") { var l = parseLength(v, "top"); if (l === null) { toast(label + " : valeur invalide.", true); return; } if (l) next[k] = l; else delete next[k]; }
          else if (v === "") delete next[k];
          else if (isNaN(Number(v))) { toast(label + " : nombre attendu.", true); return; }
          else next[k] = Number(v);
          setStyle(ids, "transform", Object.keys(next).length ? next : "");
        });
        return h("div", { class: "pb-field pb-style-field pb-prop" }, h("div", { class: "pb-prop-head" }, h("label", { for: id, class: "pb-prop-label" }, label)), h("div", { class: "pb-len" }, inp, unit ? h("span", { class: "pb-len-unit is-static", text: unit }) : null), h("span", { class: "pb-reset-slot", "aria-hidden": "true" }));
      };
      out.push(h("p", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Transformation" })), mk("x", "Décalage X"), mk("y", "Décalage Y"), mk("rotate", "Rotation", "°"), mk("scale", "Échelle", "×"), mk("skewX", "Inclinaison X", "°"), mk("skewY", "Inclinaison Y", "°"));
    }
    return out;
  }
  // Sélecteur d'écran : icônes (nom en infobulle) ; un point signale un écran où cet élément a ses propres réglages
  function breakpointSwitch(items) {
    var it = items[0];
    var seg = h("div", { class: "pb-seg pb-bp-seg", role: "radiogroup", "aria-label": "Écran modifié" }, SPEC.breakpoints.map(function (b) {
      var own = it.styles && it.styles[b.key] && Object.keys(it.styles[b.key]).length;
      return h("button", { type: "button", role: "radio", "aria-checked": String(device === b.key), class: own ? "has-values" : null, "data-tip": own ? b.label + " · réglages propres à cet écran" : b.label + (b.key === "desktop" ? "" : " · hérite de l'écran plus grand"), "data-device": b.key, onclick: function () { setDevice(b.key); } }, icon(DEVICE_ICON[b.key]), h("span", { class: "sr-only", text: b.label }));
    }));
    return h("div", { class: "pb-insp-bar" }, h("span", { class: "pb-insp-bar-label", text: "Écran" }), seg);
  }
  function styleTab(items, box) {
    var it = items[0];
    var schema = inspectorFor(it);
    var bar = breakpointSwitch(items);
    if (schema.states && items.every(function (x) { return inspectorFor(x).states; })) {
      bar.appendChild(h("span", { class: "pb-insp-bar-label is-second", text: "État" }));
      bar.appendChild(h("div", { class: "pb-seg pb-state-seg", role: "radiogroup", "aria-label": "État de l'élément" }, [{ key: "normal", label: "Normal" }].concat(SPEC.states).map(function (st) {
        return h("button", { type: "button", role: "radio", "aria-checked": String(styleState === st.key), onclick: function () { styleState = st.key; renderInspector(); renderContext(); } }, st.label);
      })));
    } else if (styleState !== "normal") styleState = "normal";
    box.appendChild(bar);
    if (styleState !== "normal") box.appendChild(h("p", { class: "pb-hint pb-insp-note", text: "Style appliqué au " + { hover: "survol de la souris", focus: "focus au clavier", active: "moment du clic" }[styleState] + ", sur tous les écrans." }));
    else if (device !== "desktop") box.appendChild(h("p", { class: "pb-hint pb-insp-note", text: "Écran « " + bpLabel(device) + " » : un champ vide reprend la valeur de l'écran plus grand (en gris)." }));
    // Une propriété, une seule place : la couleur du texte va dans la typographie quand elle existe, la couleur de fond
    // dans « Fond » (avec l'image et le dégradé)
    var keysOf = function (g) {
      var spec = schema.groups[g];
      return Array.isArray(spec) ? spec.slice() : SPEC.styleProps.filter(function (p) { return p.group === g && (p.key !== "flexGrow" || it.type === "column"); }).map(function (p) { return p.key; });
    };
    var plan = [];
    var order = schema.order || GROUP_ORDER;
    var hasTypo = schema.groups && schema.groups.typography !== undefined;
    order.forEach(function (g) {
      if (!schema.groups || schema.groups[g] === undefined) return;
      var keys = g === "spacing" ? [] : keysOf(g);
      if (g === "color") {
        keys = keys.filter(function (k) { return k !== "backgroundColor"; });
        if (hasTypo || !keys.length) return;
      }
      if (g === "typography" && schema.groups.color !== undefined && keysOf("color").indexOf("color") >= 0) keys.splice(Math.min(3, keys.length), 0, "color");
      if (g === "layout") { var lp = locate(it.id); if (lp && lp.parent && lp.parent.type === "grid" && keys.indexOf("gridColumnSpan") < 0) keys = keys.concat(["gridColumnSpan", "gridRowSpan"]); }
      if (g === "background") keys = ["backgroundColor", "backgroundImage", "gradient", "overlay", "backgroundSize", "backgroundPosition", "backgroundRepeat", "backgroundAttachment"];
      plan.push([g, keys]);
    });
    if (it.type === "layout" && items.length === 1) {
      var wid = fid();
      var wsel = h("select", { id: wid, class: "pb-prop-select", disabled: lockedAny(items) }, STYLE.width.map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
      wsel.value = (it.style && it.style.width) || "normal";
      wsel.addEventListener("change", function () { change(function () { var x = byId(it.id); x.style = Object.assign({}, x.style); if (wsel.value === "normal") delete x.style.width; else x.style.width = wsel.value; if (!Object.keys(x.style).length) delete x.style; }); });
      box.appendChild(h("div", { class: "pb-field pb-style-field pb-prop pb-sec-width" + (it.style && it.style.width ? " is-set" : ""), "data-prop": "sectionWidth" }, h("div", { class: "pb-prop-head" }, h("label", { for: wid, class: "pb-prop-label" }, "Largeur de section")), wsel, h("span", { class: "pb-reset-slot", "aria-hidden": "true" })));
    }
    plan.forEach(function (x, i) { box.appendChild(styleSection(items, x[0], x[1], { open: i === 0 })); });
    if (schema.presets && !isNode(it)) legacyLayout(items, box);
  }
  // Un groupe repliable (état ouvert / fermé mémorisé) ; le nombre discret = valeurs propres à l'écran modifié
  var COLOR_LABEL = { color: "Texte" };
  function styleSection(items, g, keys, opts) {
    var det = h("details", { class: "pb-acc", "data-group": g });
    if (store.get("open-" + g, Boolean(opts && opts.open))) det.open = true;
    det.addEventListener("toggle", function () { store.set("open-" + g, det.open); });
    var counted = g === "spacing" ? SIDES.map(function (s) { return "margin" + s; }).concat(SIDES.map(function (s) { return "padding" + s; })) : keys;
    var set = counted.filter(function (k, i) { return counted.indexOf(k) === i && items.some(function (x) { return ownValue(x, k) !== undefined; }); }).length;
    det.appendChild(h("summary", {}, h("span", { class: "pb-acc-title", text: SPEC.groups[g] || g }), set ? h("span", { class: "pb-acc-count", title: set + " réglage(s) propre(s) à cet écran", "aria-label": set + " réglage(s) modifié(s)" }, String(set)) : null));
    var inner = h("div", { class: "pb-acc-body" });
    if (g === "spacing") inner.appendChild(spacingBox(items));
    else if (g === "border") borderControls(items, inner);
    else if (g === "background") backgroundControls(items, inner);
    else keys.forEach(function (k) { if (SP[k]) inner.appendChild(styleControl(items, k, g === "typography" && k === "color" ? "Couleur" : g === "color" ? COLOR_LABEL[k] : null)); });
    composedControls(items, g).forEach(function (x) { inner.appendChild(x); });
    det.appendChild(inner);
    return det;
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
    if (typeof cpop !== "undefined" && cpop && !cpop.hidden) { cpop.hidden = true; cpopFor = null; }
    var box = $("[data-pb-inspector]");
    var keepScroll = box.dataset.for === selection.join(",") ? box.scrollTop : 0;
    box.textContent = "";
    box.dataset.for = selection.join(",");
    fieldSeq = 0;
    var items = selectedItems();
    // Rien de sélectionné : état vide, et seulement quelques actions globales réelles
    if (!items.length) {
      box.appendChild(h("div", { class: "pb-insp-empty" },
        h("h2", { text: "Aucun élément sélectionné" }),
        h("p", { class: "pb-hint", text: "Sélectionnez un élément sur le canevas ou dans les calques pour modifier ses propriétés." })));
      box.appendChild(breakpointSwitch([{}]));
      box.appendChild(h("div", { class: "pb-row pb-wrap" },
        h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { openTab($("#pb-tab-page")); } }, "Réglages de la page"),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: !past.length || !canWrite, onclick: undo }, icon("undo"), "Annuler"),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: !future.length || !canWrite, onclick: redo }, icon("redo"), "Rétablir")));
      var det = infoBlock(null);
      det.querySelector("summary").textContent = "Informations sur la page";
      box.appendChild(det);
      return;
    }
    var it = items[0];
    var multi = items.length > 1;
    var locked = lockedAny(items);
    var schema = inspectorFor(it);
    var l = locate(it.id);
    // En-tête : ce que l'on modifie (nature, nom) et son chemin dans la structure (cliquable)
    var crumbs = multi || !l.ancestors.length ? null : h("nav", { class: "pb-crumbs", "aria-label": "Parents de l'élément" }, [h("button", { type: "button", onclick: function () { select(null); }, text: "Page" })].concat(l.ancestors.map(function (a) { return h("button", { type: "button", onclick: function () { select(a.id); }, text: nameOf(a) }); })));
    box.appendChild(h("div", { class: "pb-insp-head" }, crumbs,
      h("p", { class: "pb-kind", text: multi ? "Sélection multiple" : schema.kind }),
      h("h2", { text: multi ? items.length + " éléments" : (it.name || preview(it) || schema.kind) })));
    if (locked && canWrite) box.appendChild(h("p", { class: "pb-note is-warn", text: "Verrouillé : déverrouillez-le (cadenas dans les calques) pour le modifier." }));
    var tabs = multi ? [["style", "Style"], ["advanced", "Avancé"]] : !schema.groups ? [["content", "Contenu"], ["advanced", "Avancé"]] : [["content", "Contenu"], ["style", "Style"], ["advanced", "Avancé"]];
    if (!tabs.some(function (t) { return t[0] === inspTab; })) inspTab = tabs[0][0];
    var tablist = h("div", { class: "pb-insp-tabs", role: "tablist", "aria-label": "Réglages de la sélection" });
    tabs.forEach(function (t) { tablist.appendChild(h("button", { type: "button", role: "tab", "aria-selected": String(inspTab === t[0]), onclick: function () { inspTab = t[0]; store.set("insp-tab", inspTab); renderInspector(); } }, t[1])); });
    box.appendChild(tablist);
    var body = h("div", { class: "pb-insp-body", role: "tabpanel" });
    box.appendChild(body);
    if (inspTab === "content") {
      if (it.type === "component") componentInspector(body, it);
      else if (kidsOf(it)) structureContent(it, body);
      else if (isNode(it)) nodeContentFields(it, body, locked);
      else legacyContentFields(it, body, locked);
    } else if (inspTab === "style") styleTab(items, body);
    else advancedTab(items, body, locked);
    box.scrollTop = keepScroll;
  }
  // Contenu d'une section libre ou d'un conteneur : sa structure (enfants cliquables), et comment y ajouter
  function structureContent(it, box) {
    var kids = kidsOf(it);
    box.appendChild(h("p", { class: "pb-sub", text: kids.length ? kids.length + " élément(s) à l'intérieur" : "Vide" }));
    if (kids.length) {
      box.appendChild(h("ul", { class: "pb-kids" }, kids.map(function (c) {
        return h("li", {}, h("button", { type: "button", class: "pb-kid", onclick: function () { select(c.id); } }, icon(isNode(c) ? NT[c.type].icon : "layout"), h("span", { class: "pb-kid-kind", text: (inspectorFor(c) || {}).kind || typeLabel(c) }), h("span", { class: "pb-kid-name", text: c.name || preview(c) })));
      })));
    }
    if (it.type === "columns") columnsContent(it, box);
    else if (it.type === "grid") gridContent(it, box);
    box.appendChild(h("div", { class: "pb-row pb-wrap" }, h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: !canWrite || lockedDeep(it.id) || it.type === "columns", onclick: function () { openCommands("Ajouter", { inside: it.id }); } }, icon("plus"), "Ajouter un élément à l'intérieur")));
    box.appendChild(h("p", { class: "pb-hint", text: it.type === "columns" ? "Chaque colonne reçoit ses propres éléments : sélectionnez une colonne puis ajoutez-y un élément (ou glissez-le dedans)." : "Vous pouvez aussi glisser un élément de la bibliothèque (à gauche) directement dedans." }));
  }
  // Colonnes : nombre, largeur de chacune (en % de la ligne, pour l'écran modifié), ordre
  function columnsContent(it, box) {
    var kids = kidsOf(it), dis = !canWrite || lockedDeep(it.id);
    var shares = columnShares(it);
    box.appendChild(h("div", { class: "pb-insp-bar" }, h("span", { class: "pb-insp-bar-label", text: "Colonnes" }),
      h("div", { class: "pb-stepper" },
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Retirer la dernière colonne", "data-tip": "Retirer la dernière colonne", disabled: dis || kids.length <= 1, onclick: function () { removeColumn(it.id); } }, icon("minus")),
        h("output", { class: "pb-stepper-value", "data-pb-col-count": "", text: String(kids.length) }),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Ajouter une colonne", "data-tip": "Ajouter une colonne (largeurs réparties également)", disabled: dis || kids.length >= MAX_COLS, onclick: function () { addColumn(it.id); } }, icon("plus")))));
    if (device === "mobile") box.appendChild(h("p", { class: "pb-hint", text: "Sur mobile, les colonnes s'affichent l'une sous l'autre : leurs largeurs se règlent sur ordinateur et tablette." }));
    var list = h("ol", { class: "pb-cols-list" });
    kids.forEach(function (c, i) {
      var id = fid();
      var input = h("input", { id: id, type: "number", min: "5", max: "95", step: "1", value: String(Math.round(shares[i] * 10) / 10), disabled: dis || device === "mobile" || kids.length < 2, "data-pb-col-share": String(i) });
      input.addEventListener("change", function () { var v = Number(input.value); if (!isFinite(v)) return; setColumnShare(it.id, i, v); });
      list.appendChild(h("li", { class: "pb-col-row" },
        h("button", { type: "button", class: "pb-kid", onclick: function () { select(c.id); } }, h("span", { class: "pb-kid-name", text: c.name || "Colonne " + (i + 1) }), h("span", { class: "pb-kid-kind", text: (kidsOf(c) || []).length + " élément(s)" })),
        h("label", { class: "sr-only", for: id, text: "Largeur de la colonne " + (i + 1) + " en %" }), input, h("span", { class: "pb-unit", text: "%" }),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Déplacer la colonne " + (i + 1) + " vers la gauche", "data-tip": "Vers la gauche", disabled: dis || i === 0, onclick: function () { moveColumn(it.id, i, -1); } }, icon("chevronLeft")),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Déplacer la colonne " + (i + 1) + " vers la droite", "data-tip": "Vers la droite", disabled: dis || i === kids.length - 1, onclick: function () { moveColumn(it.id, i, 1); } }, icon("chevronRight")),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Supprimer la colonne " + (i + 1), "data-tip": "Supprimer cette colonne", disabled: dis || kids.length <= 1, onclick: function () { removeColumn(it.id, i); } }, icon("trash"))));
    });
    box.appendChild(list);
    box.appendChild(h("div", { class: "pb-row pb-wrap" }, h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis || device === "mobile", onclick: function () { change(function () { equalizeColumns(byId(it.id)); }); } }, "Répartir également")));
    box.appendChild(h("p", { class: "pb-hint", text: "Astuce : dans la page, tirez la séparation entre deux colonnes pour changer leurs largeurs." }));
  }
  // Grille : colonnes (écran modifié) et lignes (calculées à partir du nombre de cellules)
  function gridContent(it, box) {
    var dis = !canWrite || lockedDeep(it.id);
    var cols = gridColumnsOf(it), n = kidsOf(it).length, rows = Math.max(1, Math.ceil(n / cols));
    var stepper = function (label, value, attr, minus, plus, offMinus, offPlus) {
      return h("div", { class: "pb-insp-bar" }, h("span", { class: "pb-insp-bar-label", text: label }), h("div", { class: "pb-stepper" },
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": minus[0], "data-tip": minus[0], disabled: dis || offMinus, onclick: minus[1] }, icon("minus")),
        h("output", { class: "pb-stepper-value", text: String(value) }, null),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": plus[0], "data-tip": plus[0], disabled: dis || offPlus, onclick: plus[1] }, icon("plus"))));
    };
    var c = stepper("Colonnes", cols, "cols", ["Retirer une colonne", function () { gridSetColumns(it.id, cols - 1); }], ["Ajouter une colonne", function () { gridSetColumns(it.id, cols + 1); }], cols <= 1, cols >= 12);
    c.querySelector("output").setAttribute("data-pb-grid-cols", "");
    box.appendChild(c);
    var r = stepper("Lignes", rows, "rows", ["Retirer la dernière ligne", function () { gridRemoveRow(it.id); }], ["Ajouter une ligne", function () { gridAddRow(it.id); }], n <= cols, n >= 96);
    r.querySelector("output").setAttribute("data-pb-grid-rows", "");
    box.appendChild(r);
    box.appendChild(h("p", { class: "pb-hint", text: "Colonnes pour l'écran « " + bpLabel(device) + " » ; une ligne = " + cols + " cellule(s). L'écart se règle dans Style › Mise en page." }));
  }
  function advancedTab(items, box, locked) {
    var it = items[0];
    var single = items.length === 1;
    var b = function (label, fn, opts) { return h("button", Object.assign({ type: "button", class: "btn btn-outline btn-sm", onclick: fn }, opts || {}), label); };
    if (single) {
      var info = infoBlock(it);
      box.appendChild(info);
      box.appendChild(textField("Nom du calque", it.name, function (v) { rename(it.id, v); }, { max: 60, placeholder: inspectorFor(it).kind, onChange: true, disabled: !canWrite }));
      if (isNode(it)) box.appendChild(textField("Ancre (identifiant pour un lien #…)", it.anchor, function (v) { setAnchor(it.id, v); }, { max: 40, placeholder: "ex. tarifs", onChange: true, disabled: !canWrite || locked, hint: it.anchor ? "Lien vers cet élément : " + (PAGE.slug ? "/p/" + PAGE.slug : "") + "#" + it.anchor : "Lettres minuscules, chiffres et tirets. Permet un lien direct vers cet élément (menu, bouton « Voir les tarifs »…)." }));
    }
    // Position et plan (propriétés avancées de placement), pour l'écran actif
    if (inspectorFor(it).groups) {
      var pos = styleSection(items, "position", SPEC.styleProps.filter(function (p) { return p.group === "position"; }).map(function (p) { return p.key; }));
      box.appendChild(pos);
    }
    if (single && it.type !== "component") box.appendChild(audienceField(it, locked));
    if (single && it.type !== "component") {
      var checks = h("div", { class: "pb-checks" });
      BPS.forEach(function (bp) {
        var cb = h("input", { type: "checkbox", disabled: locked });
        cb.checked = !(it.hideOn || []).includes(bp);
        cb.addEventListener("change", function () {
          var next = BPS.filter(function (x) { return x === bp ? !cb.checked : (it.hideOn || []).includes(x); });
          if (next.length === BPS.length) { cb.checked = true; toast("Il doit rester visible sur au moins un écran (sinon : « Masquer »).", true); return; }
          change(function () { var s = byId(it.id); if (next.length) s.hideOn = next; else delete s.hideOn; });
        });
        checks.appendChild(h("label", {}, cb, " " + bpLabel(bp)));
      });
      box.appendChild(h("p", { class: "pb-sub", text: "Afficher sur" }));
      box.appendChild(checks);
    }
    if (single && isNode(it)) box.appendChild(motionField(it, locked));
    if (items.length > 1) {
      box.appendChild(h("p", { class: "pb-sub", text: "Aligner (dans leur parent)" }));
      box.appendChild(h("div", { class: "pb-row pb-wrap" }, [["flex-start", "Début"], ["center", "Centre"], ["flex-end", "Fin"], ["stretch", "Étirer"]].map(function (a) { return b(a[1], function () { setStyle(selection.slice(), "alignSelf", a[0]); }, { disabled: !canWrite || locked }); }),
        b("Répartir", distribute, { disabled: !canWrite || locked })));
    }
    box.appendChild(h("p", { class: "pb-sub", text: "Actions" }));
    box.appendChild(h("div", { class: "pb-row pb-wrap" },
      b(items.some(function (x) { return x.hidden; }) ? "Afficher" : "Masquer", function () { setFlag(selection.slice(), "hidden", !items.some(function (x) { return x.hidden; })); }, { disabled: !canWrite }),
      b(items.some(function (x) { return x.locked; }) ? "Déverrouiller" : "Verrouiller", function () { setFlag(selection.slice(), "locked", !items.some(function (x) { return x.locked; })); }, { disabled: !canWrite }),
      b("Dupliquer", duplicateSelected, { disabled: !canWrite }),
      b("Copier le style", copyStyle),
      b("Coller le style", pasteStyle, { disabled: !canWrite || locked }),
      b("Réinitialiser le style", resetStyle, { disabled: !canWrite || locked || !items.some(function (x) { return x.styles || x.states; }) }),
      items.length > 1 ? b("Grouper", groupSelected, { disabled: !canWrite || locked }) : null,
      single && ["group", "stack", "container"].indexOf(it.type) >= 0 ? b("Dissocier", ungroupSelected, { disabled: !canWrite || locked }) : null,
      b("Supprimer", removeSelected, { class: "btn btn-danger btn-sm", disabled: !canWrite || locked })));
    if (single && canWrite && it.type !== "component") {
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
  // Animation : entrée à l'apparition (durée, délai) et effet au survol ; rejouable dans le canevas
  function motionField(it, locked) {
    var m = it.motion || {};
    var setM = function (k, v) { change(function () { var x = byId(it.id); var n = Object.assign({}, x.motion); if (v === "" || v === undefined) delete n[k]; else n[k] = v; if (k === "entrance" && !v) { delete n.duration; delete n.delay; } if (k === "entrance" && v) { if (n.duration === undefined) n.duration = 600; if (n.delay === undefined) n.delay = 0; } if (Object.keys(n).length) x.motion = n; else delete x.motion; }); };
    var det = h("details", { class: "pb-acc", "data-group": "motion" });
    if (store.get("open-motion", Boolean(m.entrance || m.hover))) det.open = true;
    det.addEventListener("toggle", function () { store.set("open-motion", det.open); });
    det.appendChild(h("summary", {}, h("span", { class: "pb-acc-title", text: "Animation" }), m.entrance || m.hover ? h("span", { class: "pb-acc-count", text: String((m.entrance ? 1 : 0) + (m.hover ? 1 : 0)) }) : null));
    var inner = h("div", { class: "pb-acc-body" });
    inner.appendChild(selectField("À l'apparition", m.entrance || "", [["", "Aucune"]].concat(SPEC.entrances), function (v) { setM("entrance", v); }, { disabled: locked }));
    if (m.entrance) {
      inner.appendChild(h("div", { class: "pb-grid-2" },
        selectField("Durée", String(m.duration || 600), [["300", "Rapide"], ["600", "Normale"], ["900", "Lente"], ["1500", "Très lente"]], function (v) { setM("duration", Number(v)); }, { disabled: locked }),
        selectField("Délai", String(m.delay || 0), [["0", "Aucun"], ["150", "0,15 s"], ["300", "0,3 s"], ["600", "0,6 s"], ["1000", "1 s"]], function (v) { setM("delay", Number(v)); }, { disabled: locked })));
      inner.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { var el = canvasEl(it.id); if (!el) return; el.classList.remove("pb-anim-replay"); void el.offsetWidth; el.classList.add("pb-anim-replay"); setTimeout(function () { el.classList.remove("pb-anim-replay"); }, (m.duration || 600) + 100); } }, "Voir l'animation"));
    }
    inner.appendChild(selectField("Au survol", m.hover || "", [["", "Aucun effet"]].concat(SPEC.hovers), function (v) { setM("hover", v); }, { disabled: locked }));
    inner.appendChild(h("p", { class: "pb-hint", text: "Les animations ne jouent pas pour les personnes qui ont demandé à réduire les animations (réglage de leur appareil)." }));
    det.appendChild(inner);
    return det;
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
    if (same && isNode(it) && inspectorFor(it).groups && inspectorFor(it).groups.typography !== undefined) {
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
    placeCanvasBar();
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
    placeCanvasBar();
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
        // Le cadre va être remplacé : le clavier passe à la zone du canevas (sinon un raccourci tapé pendant le
        // rechargement, Ctrl/⌘ + Z par exemple, serait perdu)
        if (document.activeElement === frame) $("[data-pb-canvas]").focus({ preventScroll: true });
        frame.srcdoc = res.text;
      }, function () { var errBox = $("[data-pb-render-error]"); errBox.textContent = "Aperçu indisponible (connexion au serveur interrompue)."; errBox.hidden = false; });
  }
  function markError() { $$(".pb-row-item.is-error", treeEl).forEach(function (r) { r.classList.remove("is-error"); }); if (errorItemId) { var r = treeEl.querySelector('.pb-node[data-id="' + errorItemId + '"] > .pb-row-item'); if (r) r.classList.add("is-error"); } }
  var ignoreClickUntil = 0;
  // Le canevas ne prend le clavier que sur une action de la personne (clic dedans, édition directe, touche Tab) : un
  // chargement ou un contenu de la page ne doit jamais retirer le curseur d'un champ de l'inspecteur
  var canvasPointerAt = 0, tabAt = 0, parentFocus = null;
  document.addEventListener("focusin", function (e) { if (e.target !== frame) parentFocus = e.target; });
  document.addEventListener("keydown", function (e) { if (e.key === "Tab") tabAt = Date.now(); }, true);
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
    doc.addEventListener("mousedown", function () { canvasPointerAt = Date.now(); }, true);
    doc.addEventListener("keydown", function (e) { if (e.key === "Tab") tabAt = Date.now(); }, true);
    frame.contentWindow.addEventListener("focus", function () {
      if (editing || Date.now() - canvasPointerAt < 1500 || Date.now() - tabAt < 500) return;
      var back = parentFocus && document.body.contains(parentFocus) && !parentFocus.disabled ? parentFocus : $("[data-pb-canvas]");
      back.focus({ preventScroll: true });
    });
    doc.addEventListener("click", function (e) {
      if (selectedGuide) { selectedGuide = null; drawGuides(); }
      if (tool === "hand") { e.preventDefault(); return; }
      // Fin d'un redimensionnement (poignée, séparation de colonnes) : le relâchement n'est pas un clic de sélection
      if (Date.now() < ignoreClickUntil) { e.preventDefault(); return; }
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
    $$(".pb-sel-box, .pb-sel-badge, .pb-parent-box, .pb-handle, .pb-dim, .pb-col-split, .pb-struct-add", doc).forEach(function (x) { x.remove(); });
    placeCanvasBar();
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
      if (selection.length === 1 && canWrite && !lockedDeep(id) && !editing) structureOverlays(it, el, r);
    });
  }
  // Colonnes et grille sélectionnées : séparations à tirer (largeurs) et bouton « + » au bord (colonne, ligne)
  function structureOverlays(it, el, r) {
    var doc = frame.contentDocument;
    var plus = function (cls, x, y, label, fn) {
      var b = doc.createElement("button");
      b.type = "button"; b.className = "pb-struct-add " + cls; b.textContent = "+"; b.title = label; b.setAttribute("aria-label", label);
      b.style.left = x + "px"; b.style.top = y + "px";
      b.addEventListener("mousedown", function (e) { e.preventDefault(); e.stopPropagation(); });
      b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); fn(); });
      doc.body.appendChild(b);
    };
    if (it.type === "columns") {
      var kids = kidsOf(it);
      if (kids.length < MAX_COLS) plus("is-col", r.left + r.width, r.top + r.height / 2, "Ajouter une colonne", function () { addColumn(it.id); });
      if (frame.contentWindow.getComputedStyle(el).flexDirection.indexOf("row") !== 0) return; // colonnes empilées (mobile)
      var els = kids.map(function (c) { return canvasEl(c.id); });
      if (els.some(function (x) { return !x; })) return;
      for (var i = 0; i < els.length - 1; i++) {
        var a = pageRect(els[i]), b = pageRect(els[i + 1]);
        if (Math.abs(a.top - b.top) > 4) continue; // colonnes passées à la ligne
        var sp = doc.createElement("div");
        sp.className = "pb-col-split";
        sp.title = "Tirer pour changer la largeur des colonnes " + (i + 1) + " et " + (i + 2);
        sp.style.cssText = "left:" + ((a.left + a.width + b.left) / 2) + "px;top:" + r.top + "px;height:" + r.height + "px";
        (function (k) { sp.addEventListener("mousedown", function (e) { columnSplitStart(e, it.id, k); }); })(i);
        doc.body.appendChild(sp);
      }
    } else if (it.type === "grid") {
      plus("is-row", r.left + r.width / 2, r.top + r.height, "Ajouter une ligne", function () { gridAddRow(it.id); });
      plus("is-col", r.left + r.width, r.top + r.height / 2, "Ajouter une colonne", function () { gridSetColumns(it.id, gridColumnsOf(it) + 1); });
    } else if (kidsOf(it) && !kidsOf(it).length) {
      plus("is-inside", r.left + r.width / 2, r.top + r.height / 2, "Ajouter un élément ici", function () { openCommands("Ajouter", { inside: it.id }); });
    }
  }
  // Tirer la séparation entre deux colonnes : les deux voisines se partagent leur largeur commune
  function columnSplitStart(e, colsId, i) {
    e.preventDefault(); e.stopPropagation();
    var doc = frame.contentDocument;
    var cols = kidsOf(byId(colsId)).map(function (c) { return canvasEl(c.id); });
    var widths = cols.map(function (x) { return x.getBoundingClientRect().width; });
    var pair = widths[i] + widths[i + 1], total = widths.reduce(function (a, b) { return a + b; }, 0), x0 = e.clientX, a0 = widths[i];
    var min = total * 0.05;
    var nice = [25, 100 / 3, 50, 200 / 3, 75, 20, 40, 60, 80];
    var dim = doc.createElement("div"); dim.className = "pb-dim"; doc.body.appendChild(dim);
    gesture = true;
    var shares = null;
    var move = function (ev) {
      var a = Math.min(pair - min, Math.max(min, a0 + ev.clientX - x0));
      var w = widths.slice(); w[i] = a; w[i + 1] = pair - a;
      shares = w.map(function (x) { return x / total * 100; });
      if (aids.snap) { // magnétisme : pour cent entiers, et fractions courantes (¼, ⅓, ½…) à 1,5 % près
        var near = nice.filter(function (n) { return Math.abs(n - shares[i]) <= 1.5; })[0];
        var target = near !== undefined ? near : Math.round(shares[i]);
        var both = shares[i] + shares[i + 1];
        target = Math.min(both - 5, Math.max(5, target));
        shares[i] = target; shares[i + 1] = both - target;
      }
      cols.forEach(function (c, k) { c.style.flexGrow = String(shares[k]); });
      var r = pageRect(cols[i + 1]);
      dim.textContent = shares.map(pct).join(" · ");
      dim.style.left = r.left + "px"; dim.style.top = Math.max(0, r.top - 30) + "px";
    };
    var up = function () {
      doc.removeEventListener("mousemove", move); doc.removeEventListener("mouseup", up); dim.remove();
      cols.forEach(function (c) { c.style.flexGrow = ""; });
      gesture = false;
      ignoreClickUntil = Date.now() + 250;
      if (!shares) { endGesture(); return; }
      change(function () { storeShares(byId(colsId), shares); });
      toast("Largeurs enregistrées pour l'écran « " + bpLabel(device) + " » : " + shares.map(pct).join(" / ") + ".");
    };
    doc.addEventListener("mousemove", move); doc.addEventListener("mouseup", up);
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
      ignoreClickUntil = Date.now() + 250;
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
  // ---------- Barre d'actions du canevas (posée sur l'élément sélectionné) ----------
  // Registre extensible : chaque action déclare son icône, son libellé, quand elle est indisponible et ce qu'elle fait ;
  // chaque type d'élément liste ses actions propres, complétées des actions communes selon le contexte.
  var canvasEl = function (id) { var doc = frame.contentDocument; return doc ? doc.querySelector('[data-node-id="' + id + '"],[data-section-id="' + id + '"]') : null; };
  var cbar = h("div", { class: "pb-cbar", role: "toolbar", "aria-label": "Actions sur la sélection", hidden: true });
  document.body.appendChild(cbar);
  var anyFlag = function (k) { return selectedItems().some(function (x) { return x[k]; }); };
  var CANVAS_ACTIONS = {
    parent: { icon: "arrowUp", label: "Sélectionner le parent", run: function (it) { var l = locate(it.id); if (l && l.parent) select(l.parent.id, false, { scroll: false }); } },
    move: { icon: "grip", label: "Déplacer : tirez vers un nouvel emplacement (ou Alt + ↑ / ↓)", drag: true },
    edit: { icon: "edit", label: "Modifier le texte (ou double-clic)", run: function (it) { startEdit(it.id); } },
    replace: { icon: "image", label: "Remplacer l'image", run: function (it) { openMedia({ title: "Remplacer l'image", onPick: function (m) { change(function () { var x = byId(it.id); x.props.src = m.path; if (m.alt) { x.props.alt = m.alt; delete x.props.decorative; } }); } }); } },
    crop: { icon: "borderBox", label: "Recadrer : cadrage, point focal, proportions", run: function () { openInspector("style", "media"); } },
    settings: { icon: "sliders", label: "Réglages du contenu", run: function () { openInspector("content"); } },
    addCol: { icon: "plus", label: "Ajouter une colonne", off: function (it) { return kidsOf(it).length >= MAX_COLS; }, run: function (it) { addColumn(it.id); } },
    delCol: { icon: "minus", label: "Retirer la dernière colonne", off: function (it) { return kidsOf(it).length <= 1; }, run: function (it) { removeColumn(it.id); } },
    gridCol: { icon: "columns", label: "Ajouter une colonne à la grille", off: function (it) { return gridColumnsOf(it) >= 12; }, run: function (it) { gridSetColumns(it.id, gridColumnsOf(it) + 1); } },
    gridRow: { icon: "listPlus", label: "Ajouter une ligne", run: function (it) { gridAddRow(it.id); } },
    gridRowDel: { icon: "listMinus", label: "Retirer la dernière ligne", off: function (it) { return kidsOf(it).length <= gridColumnsOf(it); }, run: function (it) { gridRemoveRow(it.id); } },
    addInside: { icon: "plus", label: "Ajouter un élément à l'intérieur", run: function (it) { openCommands("Ajouter", { inside: it.id }); } },
    addSection: { icon: "listPlus", label: "Ajouter une section en dessous", run: function (it) { openCommands("Ajouter", { after: topOf(it.id).id }); } },
    duplicate: { icon: "copy", label: "Dupliquer (Ctrl/⌘ + D)", run: function () { duplicateSelected(); } },
    hide: { icon: function () { return anyFlag("hidden") ? "eye" : "eyeOff"; }, label: function () { return anyFlag("hidden") ? "Afficher (Ctrl/⌘ + Maj + H)" : "Masquer : reste dans la page et les calques (Ctrl/⌘ + Maj + H)"; }, pressed: function () { return anyFlag("hidden"); }, run: function () { setFlag(selection.slice(), "hidden", !anyFlag("hidden")); } },
    lock: { icon: "lock", label: function () { return anyFlag("locked") ? "Déverrouiller (Ctrl/⌘ + Maj + L)" : "Verrouiller : ni déplacé, ni modifié, ni supprimé (Ctrl/⌘ + Maj + L)"; }, pressed: function () { return anyFlag("locked"); }, run: function () { setFlag(selection.slice(), "locked", !anyFlag("locked")); } },
    remove: { icon: "trash", label: "Supprimer (Suppr) — Ctrl/⌘ + Z pour annuler", danger: true, run: function () { removeSelected(); } },
    more: { icon: "moreHorizontal", label: "Plus d'actions : copier, coller, style, grouper, ajouter…", run: function (it, btn) { var r = btn.getBoundingClientRect(); openMenu(r.left, r.bottom + 4); } },
  };
  var TEXTISH = ["edit"], SETTINGS = ["settings"];
  var TYPE_ACTIONS = { heading: TEXTISH, text: TEXTISH, button: TEXTISH, link: TEXTISH, quote: TEXTISH, image: ["replace", "crop"], video: SETTINGS, audio: SETTINGS, gallery: SETTINGS, accordion: SETTINGS, tabs: SETTINGS, table: SETTINGS, list: SETTINGS, countdown: SETTINGS, course: SETTINGS, icon: SETTINGS, code: SETTINGS,
    columns: ["addCol", "delCol"], grid: ["gridCol", "gridRow", "gridRowDel"], container: ["addInside"], column: ["addInside"], stack: ["addInside"], group: ["addInside"], layout: ["addInside", "addSection"], form: ["settings", "addSection"], legacy: ["settings", "addSection"], component: ["settings"] };
  var STRUCTURAL = ["layout", "container", "columns", "column", "grid", "stack", "group"];
  function canvasActionsFor(items) {
    if (!items.length || !canWrite) return [];
    if (items.length > 1) return ["duplicate", "hide", "lock", "remove", "more"];
    var it = items[0], l = locate(it.id);
    if (it.locked) return ["lock", "more"];
    if (lockedDeep(it.id)) return l.parent ? ["parent", "more"] : ["more"];
    var key = isNode(it) ? it.type : it.type === "layout" || it.type === "component" || it.type === "form" ? it.type : "legacy";
    var list = (l.parent ? ["parent"] : []).concat(isNode(it) ? ["move"] : []).concat(TYPE_ACTIONS[key] || []).concat(["duplicate", "hide"]);
    if (STRUCTURAL.indexOf(it.type) >= 0 || !isNode(it)) list.push("lock");
    return list.concat(["remove", "more"]);
  }
  var val = function (v) { return typeof v === "function" ? v() : v; };
  function buildCanvasBar(acts, it) {
    cbar.textContent = "";
    acts.forEach(function (k) {
      var a = CANVAS_ACTIONS[k];
      var label = val(a.label);
      var b = h("button", { type: "button", class: "pb-cbar-btn" + (a.danger ? " is-danger" : ""), "data-action": k, "aria-label": label, "data-tip": label, "aria-pressed": a.pressed ? String(a.pressed()) : null, disabled: a.off && a.off(it) ? true : null }, icon(val(a.icon)));
      if (a.drag) {
        b.setAttribute("draggable", "true");
        b.addEventListener("dragstart", function (e) { dragIds = selection.slice(); dragNew = null; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "pb-move"); hideTip(); });
      } else b.addEventListener("click", function (e) { e.preventDefault(); hideTip(); a.run(it, b); });
      cbar.appendChild(b);
    });
  }
  // Position : au-dessus de l'élément (bord droit), en dessous s'il n'y a pas la place ; masquée hors de la zone visible
  function placeCanvasBar() {
    if (!cbar) return; // appel pendant l'initialisation
    if (mode === "structure") { cbar.hidden = true; return; }
    var items = selectedItems();
    var acts = editing || gesture || tool === "hand" ? [] : canvasActionsFor(items);
    var el = acts.length ? canvasEl(selection[0]) : null;
    if (!el) { cbar.hidden = true; return; }
    var key = selection.join(",") + "|" + acts.join(",") + "|" + items.map(function (x) { return (x.hidden ? "h" : "") + (x.locked ? "l" : "") + ((kidsOf(x) || []).length); }).join(",") + "|" + device;
    if (cbar.dataset.key !== key) { buildCanvasBar(acts, items[0]); cbar.dataset.key = key; }
    var fr = frame.getBoundingClientRect(), sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    var top = fr.top + r.top * zoom, bottom = fr.top + r.bottom * zoom, right = fr.left + r.right * zoom;
    if (bottom < sr.top + 8 || top > sr.bottom - 8 || !r.width) { cbar.hidden = true; return; }
    cbar.hidden = false;
    var bw = cbar.offsetWidth, bh = cbar.offsetHeight;
    // Au-dessus si possible ; sinon dans le coin haut de l'élément s'il est assez grand (on ne cache pas son voisin) ;
    // sinon en dessous
    var y = top - bh - 6;
    if (y < sr.top + 4) y = bottom - top >= bh * 2.5 ? Math.max(top, sr.top) + 4 : bottom + 6 + bh < sr.bottom ? bottom + 6 : sr.top + 4;
    var x = Math.min(Math.max(right - bw, sr.left + 4), sr.right - bw - 4);
    cbar.style.left = Math.round(x) + "px"; cbar.style.top = Math.round(y) + "px";
  }
  stage.addEventListener("scroll", placeCanvasBar, { passive: true });
  window.addEventListener("resize", placeCanvasBar);
  // Ouvrir l'inspecteur sur un onglet (et un groupe de réglages déplié)
  function openInspector(tab, group) {
    if (panels.rightHidden) togglePanel("right");
    inspTab = tab; store.set("insp-tab", tab);
    if (group) store.set("open-" + group, true);
    renderInspector();
    var target = group ? $("[data-pb-inspector] details[data-group='" + group + "']") : $("[data-pb-inspector] .pb-insp-body");
    if (target) { target.scrollIntoView({ block: "nearest" }); var f = target.querySelector("input, select, textarea, button"); if (f) f.focus({ preventScroll: true }); }
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

  // ---------- Mode « Structure » : le même document, présenté comme une suite de blocs éditables ----------
  // Aucun second document : chaque saisie passe par setProp / change (historique, sauvegarde, calques, inspecteur et
  // canevas suivent). Entrée en fin de titre ou de texte crée un paragraphe après ; Retour arrière dans un bloc de
  // texte vide le supprime ; « + » entre deux blocs ouvre l'insertion à cet endroit ; la poignée déplace le bloc.
  var mode = store.get("mode", "visual");
  var docEl = $("[data-pb-doc]");
  var docFocus = null; // { id, field, end } : curseur à rendre après un redessin
  function setMode(m) {
    if (editing) commitEdit();
    mode = m === "structure" ? "structure" : "visual";
    store.set("mode", mode);
    $$("[data-pb-mode]").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.pbMode === mode)); });
    $("[data-pb-canvas]").classList.toggle("is-structure", mode === "structure");
    docEl.hidden = mode !== "structure";
    if (mode === "structure") renderDoc();
    else { applyZoom(); setTimeout(function () { drawOverlays(); drawRulers(); drawGuides(); }, 30); }
    placeCanvasBar();
  }
  $$("[data-pb-mode]").forEach(function (b) { b.addEventListener("click", function () { setMode(b.dataset.pbMode); }); });
  var blockIcon = function (it) { return isNode(it) ? NT[it.type].icon : it.type === "layout" ? "layout" : it.type === "component" ? "copy" : "fileText"; };
  function blockSummary(it) {
    var p = it.props || {};
    switch (it.type) {
      case "gallery": return (p.images || []).length + " image(s)";
      case "accordion": return (p.items || []).length + " question(s) : " + (p.items || []).map(function (x) { return x.q; }).join(" · ");
      case "tabs": return (p.items || []).length + " onglet(s) : " + (p.items || []).map(function (x) { return x.title; }).join(" · ");
      case "table": return (p.rows || []).length + " ligne(s) × " + ((p.rows || [])[0] || []).length + " colonne(s)";
      case "countdown": return "Jusqu'au " + (p.until ? new Date(p.until).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : "—");
      case "course": var c = (boot.courses || []).find(function (x) { return x.id === p.courseId; }); return c ? c.title : "Formation";
      case "spacer": return "Espace de " + p.size + " px";
      case "divider": return "Ligne de séparation";
      case "icon": return "Icône « " + p.name + " », " + p.size + " px";
      case "badge": return p.text;
      case "timeline": return (p.items || []).length + " étape(s) : " + (p.items || []).map(function (x) { return x.title; }).join(" · ");
      case "progress": return p.label + " : " + p.value + " %";
      case "menu": return (p.items || []).map(function (x) { return x.label; }).join(" · ");
      case "carousel": return (p.images || []).length + " image(s)";
      case "toggle": return p.title;
      case "alert": return (p.title ? p.title + " — " : "") + String(p.text || "").slice(0, 80);
      case "counter": return (p.prefix || "") + p.value + (p.suffix || "") + " · " + p.label;
      case "testimonial": return p.name + " : « " + String(p.text || "").slice(0, 60) + " »";
      case "pricing": return p.title + " · " + p.price + (p.period ? " " + p.period : "");
      case "breadcrumb": return (p.items || []).map(function (x) { return x.label; }).join(" › ");
      case "social": return (p.items || []).map(function (x) { return x.network; }).join(" · ");
      case "modal": return "Bouton « " + p.buttonLabel + " » → " + p.title;
      case "audio": return p.title || p.src || "";
      case "component": return "Composant synchronisé : le modifier change toutes ses utilisations";
      default: return preview(it) || "";
    }
  }
  // Champ éditable du bloc (contenteditable) : chaque frappe = une modification « légère » (une étape d'annulation par champ)
  function editable(it, field, html, cls, opts) {
    opts = opts || {};
    var dis = lockedDeep(it.id) || !canWrite;
    var el = h("div", { class: "pb-blk-edit " + (cls || ""), contenteditable: dis ? "false" : opts.rich ? "true" : "plaintext-only", role: "textbox", "aria-multiline": opts.rich ? "true" : "false", "aria-label": opts.label || field, "data-field": field, "data-placeholder": opts.placeholder || "", spellcheck: "true" });
    if (opts.rich) el.innerHTML = html || ""; else el.textContent = html || "";
    el.addEventListener("input", function () {
      var v = opts.rich ? el.innerHTML : el.textContent.replace(/\n/g, " ");
      if (opts.write) opts.write(v); else setProp(it.id, field, v, { key: it.id + ":" + field, light: true });
    });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && (!opts.rich || atEnd(el))) {
        if (opts.rich && !atEnd(el)) return;
        e.preventDefault();
        if (opts.noSplit) return;
        newParagraphAfter(it.id);
      } else if (e.key === "Backspace" && !el.textContent.trim() && opts.removable) {
        e.preventDefault();
        var prev = prevEditable(it.id);
        removeItems([it.id]);
        if (prev) { docFocus = { id: prev.id, field: prev.field, end: true }; restoreDocFocus(); }
      }
    });
    el.addEventListener("paste", function (e) {
      if (opts.rich) return; // texte riche : nettoyé par le serveur (liste blanche)
      e.preventDefault();
      var t = (e.clipboardData || window.clipboardData).getData("text/plain").replace(/\s+/g, " ");
      document.execCommand("insertText", false, t);
    });
    return el;
  }
  function atEnd(el) {
    var s = window.getSelection();
    if (!s.rangeCount) return false;
    var r = s.getRangeAt(0).cloneRange();
    r.selectNodeContents(el); r.setStart(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
    return !r.toString().length;
  }
  // Entrée en fin de bloc : un paragraphe vide juste après (dans le même parent), curseur dedans
  function newParagraphAfter(id) {
    var l = locate(id);
    if (!l || !canWrite) return;
    var n = newNode("text", { props: { html: "" } });
    var at = l.parent || isNode(l.item) ? { parent: l.parent, index: l.index + 1 } : { parent: null, index: sectionIndex(l.item) + 1 };
    if (at.parent && lockedDeep(at.parent.id)) return;
    change(function () { if (!insertInto(at.parent, at.index, [n])) return false; selection = [n.id]; });
    docFocus = { id: n.id, field: "html" };
    restoreDocFocus();
  }
  // Bloc éditable précédent (ordre de lecture), pour y remettre le curseur
  function prevEditable(id) {
    var order = [];
    walk(function (x) { if (["heading", "text", "quote"].indexOf(x.type) >= 0 && isNode(x)) order.push(x); });
    var i = order.findIndex(function (x) { return x.id === id; });
    var p = i > 0 ? order[i - 1] : null;
    return p ? { id: p.id, field: p.type === "text" ? "html" : "text" } : null;
  }
  function restoreDocFocus() {
    if (!docFocus || mode !== "structure") return;
    var f = docFocus; docFocus = null;
    var el = docEl.querySelector('.pb-blk[data-id="' + f.id + '"] [data-field="' + f.field + '"]');
    if (!el) return;
    el.focus();
    if (el.isContentEditable) { var r = document.createRange(); r.selectNodeContents(el); r.collapse(!f.end ? true : false); if (f.end) r.collapse(false); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
  }
  function blockInput(it, field, label, value, opts) {
    opts = opts || {};
    var id = fid();
    var inp = h("input", { id: id, type: opts.type || "text", value: value || "", placeholder: opts.placeholder || "", disabled: lockedDeep(it.id) || !canWrite, list: opts.list || null, maxlength: opts.max ? String(opts.max) : null, "data-field": field, autocomplete: "off" });
    inp.addEventListener("input", function () { if (opts.write) opts.write(inp.value); else setProp(it.id, field, inp.value, { key: it.id + ":" + field, light: true }); });
    return h("label", { class: "pb-blk-inp", for: id }, h("span", { text: label }), inp);
  }
  function blockBody(it) {
    var p = it.props || {};
    var dis = lockedDeep(it.id) || !canWrite;
    if (it.type === "heading" && isNode(it)) return editable(it, "text", p.text, "is-h" + p.level, { label: "Titre", placeholder: "Titre…" });
    if (it.type === "text" && isNode(it)) return editable(it, "html", p.html, "is-text", { rich: true, label: "Paragraphe", placeholder: "Écrivez… (Entrée en fin de texte : nouveau paragraphe)", removable: true });
    if (it.type === "quote" && isNode(it)) return h("div", { class: "pb-blk-quote" }, editable(it, "text", p.text, "is-quote", { label: "Citation", placeholder: "Citation…", noSplit: true }), blockInput(it, "author", "Auteur", p.author, { max: 100 }));
    if ((it.type === "button" || it.type === "link") && isNode(it)) return h("div", { class: "pb-blk-row" }, blockInput(it, "label", "Texte", p.label, { max: 80 }), blockInput(it, "url", "Adresse", p.url, { list: "pb-links", placeholder: "/catalogue ou https://…" }));
    if (it.type === "video" && isNode(it)) return h("div", { class: "pb-blk-row" }, blockInput(it, "url", "Adresse de la vidéo", p.url, { type: "url" }), blockInput(it, "title", "Titre", p.title, { max: 150 }));
    if (it.type === "list" && isNode(it)) {
      var ta = h("textarea", { rows: String(Math.max(2, (p.items || []).length)), disabled: dis, "aria-label": "Points de la liste (un par ligne)", "data-field": "items" });
      ta.value = (p.items || []).join("\n");
      ta.addEventListener("input", function () { setProp(it.id, "items", ta.value.split("\n"), { key: it.id + ":items", light: true }); });
      return h("div", { class: "pb-blk-list" + (p.ordered ? " is-ordered" : "") }, ta);
    }
    if (it.type === "code" && isNode(it)) {
      var code = h("textarea", { rows: "4", class: "is-code", disabled: dis, "aria-label": "Texte affiché tel quel", "data-field": "text" });
      code.value = p.text || "";
      code.addEventListener("input", function () { setProp(it.id, "text", code.value, { key: it.id + ":text", light: true }); });
      return code;
    }
    if (it.type === "image" && isNode(it)) {
      return h("div", { class: "pb-blk-media" }, h("img", { src: p.src, alt: "", class: "pb-blk-img" }),
        h("div", { class: "pb-blk-media-side" }, blockInput(it, "alt", "Texte de remplacement", p.alt, { max: 200, write: function (v) { change(function () { var x = byId(it.id); x.props.alt = v; if (v) delete x.props.decorative; else x.props.decorative = true; }, { key: it.id + ":alt", light: true }); } }),
          h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: dis, onclick: function () { openMedia({ title: "Remplacer l'image", onPick: function (m) { change(function () { var x = byId(it.id); x.props.src = m.path; if (m.alt && !x.props.alt) { x.props.alt = m.alt; delete x.props.decorative; } }); } }); } }, "Remplacer l'image")));
    }
    // Sections prêtes : leurs textes principaux s'écrivent ici (mêmes champs que l'inspecteur) ; le reste à droite
    if (!isNode(it) && F[it.type]) {
      var flds = F[it.type].filter(function (f) { return ["text", "textarea", "markdown", "lines"].indexOf(f[1]) >= 0; }).slice(0, 4);
      if (flds.length) {
        var wrap = h("div", { class: "pb-blk-legacy" });
        flds.forEach(function (f) {
          var key = f[0];
          if (f[1] === "text") { wrap.appendChild(blockInput(it, key, f[2], it[key], { max: f[3] })); return; }
          var lines = f[1] === "lines";
          var ta = h("textarea", { rows: String(f[1] === "markdown" ? 5 : 3), disabled: dis, "aria-label": f[2], "data-field": key, maxlength: f[3] ? String(f[3]) : null });
          ta.value = lines ? (it[key] || []).join("\n") : it[key] || "";
          ta.addEventListener("input", function () { setProp(it.id, key, lines ? ta.value.split("\n") : ta.value, { key: it.id + ":" + key, light: true }); });
          wrap.appendChild(h("label", { class: "pb-blk-inp" }, h("span", { text: f[2] + (f[1] === "markdown" ? " (gras **…**, liens [texte](adresse))" : "") }), ta));
        });
        if (F[it.type].length > flds.length) wrap.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm pb-blk-more", onclick: function (e) { e.stopPropagation(); select(it.id, false, { scroll: false }); openInspector("content"); } }, "Autres réglages (image, bouton, éléments…)"));
        return wrap;
      }
    }
    // Autres éléments : résumé réel + réglages dans l'inspecteur
    var summary = isNode(it) || it.type === "component" ? blockSummary(it) : (it.heading || it.title || it.label || preview(it) || "");
    return h("div", { class: "pb-blk-summary" }, h("span", { text: summary || "—" }), h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function (e) { e.stopPropagation(); select(it.id, false, { scroll: false }); openInspector("content"); } }, "Modifier"));
  }
  function inserter(anchor, label) {
    return h("div", { class: "pb-ins" }, h("button", { type: "button", class: "pb-ins-btn", disabled: !canWrite, "aria-label": label, "data-tip": label, onclick: function (e) { e.stopPropagation(); openCommands("Ajouter", anchor); } }, icon("plus")));
  }
  function docBlock(it) {
    var kids = kidsOf(it);
    var l = locate(it.id);
    var dis = lockedDeep(it.id) || !canWrite;
    var schema = inspectorFor(it);
    var tool = function (ic, label, fn, off, cls) { return h("button", { type: "button", class: "pb-blk-tool" + (cls ? " " + cls : ""), "aria-label": label, "data-tip": label, disabled: off || null, onclick: function (e) { e.stopPropagation(); select(it.id, false, { scroll: false }); fn(); } }, icon(ic)); };
    var level = it.type === "heading" && isNode(it) ? h("select", { class: "pb-blk-level", "aria-label": "Niveau du titre", disabled: dis, onchange: function (e) { setProp(it.id, "level", e.target.value); } }, ["1", "2", "3", "4", "5", "6"].map(function (n) { return h("option", { value: n, text: "H" + n }); })) : null;
    if (level) level.value = String(it.props.level);
    var grip = h("span", { class: "pb-blk-grip", draggable: dis ? "false" : "true", "aria-hidden": "true", title: "Glisser pour déplacer" }, icon("grip"));
    grip.addEventListener("dragstart", function (e) { e.stopPropagation(); dragIds = selection.indexOf(it.id) >= 0 ? selection.slice() : [it.id]; dragNew = null; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "pb-move"); });
    var head = h("div", { class: "pb-blk-head" }, grip, icon(blockIcon(it)), h("span", { class: "pb-blk-kind", text: schema.kind }), it.name ? h("span", { class: "pb-blk-name", text: it.name }) : null,
      it.hidden ? h("span", { class: "pb-blk-badge", text: "Masqué" }) : null, it.locked ? h("span", { class: "pb-blk-badge", text: "Verrouillé" }) : null, it.audience ? h("span", { class: "pb-blk-badge is-aud", text: "Public ciblé" }) : null,
      h("span", { class: "pb-blk-grow" }), level,
      h("span", { class: "pb-blk-tools" },
        tool("arrowUp", "Monter (Alt + ↑)", function () { nudge(-1); }, dis || l.index === 0),
        tool("arrowDown", "Descendre (Alt + ↓)", function () { nudge(1); }, dis || l.index === l.list.length - 1),
        tool("copy", "Dupliquer (Ctrl/⌘ + D)", function () { duplicateSelected(); }, !canWrite),
        tool(it.hidden ? "eye" : "eyeOff", it.hidden ? "Afficher" : "Masquer", function () { setFlag([it.id], "hidden", !it.hidden); }, !canWrite),
        tool("trash", "Supprimer (Ctrl/⌘ + Z pour annuler)", function () { removeItems([it.id]); }, dis, "is-danger"),
        tool("moreHorizontal", "Plus d'actions", function () { var r = head.getBoundingClientRect(); openMenu(r.right - 220, r.bottom); }, false)));
    var el = h("div", { class: "pb-blk" + (kids ? " is-box" : "") + (it.hidden ? " is-hidden" : "") + (selection.indexOf(it.id) >= 0 ? " is-selected" : ""), "data-id": it.id, "data-type": it.type, tabindex: "-1" }, head);
    if (!kids) el.appendChild(h("div", { class: "pb-blk-body" }, blockBody(it)));
    else {
      var list = h("div", { class: "pb-blk-kids" });
      if (!kids.length) list.appendChild(h("button", { type: "button", class: "pb-blk-empty", disabled: dis, "data-drop-inside": it.id, onclick: function (e) { e.stopPropagation(); openCommands("Ajouter", { inside: it.id }); } }, icon("plus"), it.type === "column" ? "Colonne vide : ajouter un élément" : "Vide : ajouter un élément"));
      kids.forEach(function (c, i) { if (i === 0 && !dis) list.appendChild(inserter({ before: c.id }, "Insérer un élément ici")); list.appendChild(docBlock(c)); if (!dis) list.appendChild(inserter({ after: c.id }, "Insérer un élément ici")); });
      el.appendChild(list);
    }
    return el;
  }
  function renderDoc() {
    if (mode !== "structure") return;
    var keep = docEl.scrollTop;
    var active = document.activeElement && docEl.contains(document.activeElement) ? document.activeElement : null;
    if (active && !docFocus) { var b = active.closest(".pb-blk"); if (b && active.dataset.field) docFocus = { id: b.dataset.id, field: active.dataset.field, end: true }; }
    docEl.textContent = "";
    var page = h("div", { class: "pb-doc-page" });
    page.appendChild(h("div", { class: "pb-doc-head" }, h("p", { class: "pb-kind", text: "Structure de la page" }), h("h2", { text: content.title || PAGE.name }),
      h("p", { class: "pb-hint", text: content.sections.length + " section(s). Écrivez directement dans les blocs ; « + » insère un élément ; la poignée ⠿ déplace ; les styles se règlent à droite. Même page que le mode Visuel." })));
    if (!content.sections.length) page.appendChild(h("p", { class: "pb-hint", text: "Page vide." }));
    content.sections.forEach(function (s, i) { if (i === 0 && canWrite) page.appendChild(inserter({ before: s.id }, "Insérer une section ici")); page.appendChild(docBlock(s)); if (canWrite) page.appendChild(inserter({ after: s.id }, "Insérer une section ici")); });
    if (canWrite) page.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm pb-doc-add", onclick: function () { openCommands("Ajouter"); } }, icon("plus"), "Ajouter un bloc en fin de page"));
    docEl.appendChild(page);
    docEl.scrollTop = keep;
    restoreDocFocus();
  }
  function markDocSelection(scroll) {
    if (mode !== "structure") return;
    $$(".pb-blk.is-selected", docEl).forEach(function (b) { b.classList.remove("is-selected"); });
    selection.forEach(function (id) { var b = docEl.querySelector('.pb-blk[data-id="' + id + '"]'); if (b) b.classList.add("is-selected"); });
    if (scroll && selection.length) { var f = docEl.querySelector('.pb-blk[data-id="' + selection[0] + '"]'); if (f) f.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }
  // Sélection : un clic sur un bloc (ou dans un de ses champs) le sélectionne — inspecteur et calques suivent
  docEl.addEventListener("mousedown", function (e) {
    var b = e.target.closest(".pb-blk");
    if (!b || e.target.closest(".pb-blk-tool, .pb-ins-btn, .pb-blk-empty")) return;
    // Clic hors d'un champ : le bloc prend le clavier (Suppr, Ctrl/⌘ + D, Alt + ↑ / ↓… s'appliquent à lui)
    var onField = e.target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='plaintext-only'], button");
    if (!onField) setTimeout(function () { var again = docEl.querySelector('.pb-blk[data-id="' + b.dataset.id + '"]'); if (again) again.focus({ preventScroll: true }); }, 0);
    if (selection.length === 1 && selection[0] === b.dataset.id && !(e.shiftKey || e.metaKey || e.ctrlKey)) return;
    select(b.dataset.id, e.shiftKey || e.metaKey || e.ctrlKey, { scroll: false });
  });
  docEl.addEventListener("focusin", function (e) {
    var b = e.target.closest(".pb-blk");
    if (b && selection.indexOf(b.dataset.id) < 0) select(b.dataset.id, false, { scroll: false });
  });
  // Glisser-déposer : avant / après un bloc (moitié haute / basse), ou dans un conteneur vide
  var docDrop = null;
  function clearDocDrop() { $$(".is-drop-before, .is-drop-after, .is-drop-inside", docEl).forEach(function (x) { x.classList.remove("is-drop-before", "is-drop-after", "is-drop-inside"); }); docDrop = null; }
  docEl.addEventListener("dragover", function (e) {
    if (!dragIds && !dragNew) return;
    clearDocDrop();
    var empty = e.target.closest("[data-drop-inside]");
    if (empty) { var box = byId(empty.dataset.dropInside); if (box && !lockedDeep(box.id)) { e.preventDefault(); empty.classList.add("is-drop-inside"); docDrop = { parent: box, index: 0 }; } return; }
    var b = e.target.closest(".pb-blk");
    if (!b) return;
    var l = locate(b.dataset.id);
    if (!l || (dragIds && dragIds.some(function (id) { return id === l.item.id || l.ancestors.some(function (a) { return a.id === id; }); }))) return;
    if (l.parent && lockedDeep(l.parent.id)) return;
    var r = b.getBoundingClientRect();
    var after = e.clientY > r.top + Math.min(r.height / 2, 40);
    e.preventDefault();
    b.classList.add(after ? "is-drop-after" : "is-drop-before");
    docDrop = { parent: l.parent, index: l.index + (after ? 1 : 0) };
  });
  docEl.addEventListener("dragleave", function (e) { if (!docEl.contains(e.relatedTarget)) clearDocDrop(); });
  docEl.addEventListener("drop", function (e) {
    if (!docDrop) return;
    e.preventDefault();
    var t = docDrop; clearDocDrop();
    performDrop(t);
  });

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
    $("[data-pb-zoom-value]").textContent = Math.round(zoom * 100) + " %";
    $$("[data-pb-zoom]").forEach(function (b) { var v = b.dataset.pbZoom; b.disabled = (v === "-" && zoom <= 0.25) || (v === "+" && zoom >= 2); });
    drawRulers();
    refreshInfo();
    placeCanvasBar();
  }
  function setZoom(z) { zoomFit = z === "fit"; if (!zoomFit) zoom = Math.min(2, Math.max(0.25, z)); applyZoom(); setTimeout(function () { drawOverlays(); drawGuides(); }, 30); }
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
    main.style.setProperty("--pb-tools-w", panels.toolsExpanded ? "176px" : panels.toolsDense ? "136px" : "48px");
    main.classList.toggle("is-tools-expanded", Boolean(panels.toolsExpanded));
    main.classList.toggle("is-tools-dense", Boolean(panels.toolsDense) && !panels.toolsExpanded);
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
    } else {
      box.appendChild(h("p", { class: "pb-note", text: "Couleurs, polices, tailles de titres, boutons et espacements viennent du design system du site « " + PAGE.siteName + " » : les modifier là les applique à toutes ses pages." }));
      box.appendChild(h("a", { class: "btn btn-outline btn-sm", href: "/marketing/site-web/sites/" + PAGE.siteId + "#design", target: "_blank", rel: "noopener" }, "Ouvrir les styles globaux du site"));
    }
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
      ["Réinitialiser le style", resetStyle, !canWrite || locked || !items.some(function (z) { return z.styles || z.states; })],
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
      { label: "Copier le style", run: copyStyle, off: !has }, { label: "Réinitialiser le style", run: resetStyle, off: !has || !canWrite }, { label: "Coller le style", run: pasteStyle, off: !has || !canWrite },
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
      { label: mode === "structure" ? "Mode : Visuel" : "Mode : Structure (blocs)", run: function () { setMode(mode === "structure" ? "visual" : "structure"); } },
    ]).filter(function (c) { return !c.off; });
  }
  function addAt(type, legacy) {
    var anchor = cmdAnchor; cmdAnchor = null;
    var at;
    if (anchor && anchor.inside) {
      var box = byId(anchor.inside);
      if (box && kidsOf(box)) at = { parent: box, index: kidsOf(box).length };
    } else if (anchor) {
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
    if (mod && e.shiftKey && k === "e") { e.preventDefault(); setMode(mode === "structure" ? "visual" : "structure"); return; }
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
  setMode(mode);
  // Lecture de l'état pour les tests de bout en bout (aucune écriture possible par ce biais)
  window.__pb = { content: function () { return clone(content); }, selection: function () { return selection.slice(); }, device: function () { return device; }, revision: function () { return revision; }, dirty: function () { return dirty || saving; }, mode: function () { return mode; } };
})();
