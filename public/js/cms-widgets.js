// KOLAKISA CMS → Apparence → Widgets : éditeur des zones et des blocs (public/js, aucun script en ligne : CSP de l'administration).
// L'état est une mise en page JSON { zones: { <zone>: [bloc] }, inactive: [bloc] } ; bloc = { id, type, settings }. Le serveur valide et normalise tout à l'enregistrement
// (POST /enregistrer, version contrôlée) et fournit le rendu des aperçus (POST /apercu) : l'aperçu est le rendu du site public, pas une imitation.
// Annuler / Rétablir ne portent que sur l'état local ; un enregistrement serveur n'est jamais « annulé » : annuler après un enregistrement crée une nouvelle modification à enregistrer.
(function () {
  "use strict";
  var root = document.querySelector("[data-wd-root]");
  var dataEl = document.getElementById("wd-data");
  if (!root || !dataEl) return;
  var D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { root.querySelector("[data-wd-loading]").textContent = "Les données de l'éditeur sont illisibles. Rechargez la page."; return; }

  var $ = function (sel, el) { return (el || root).querySelector(sel); };
  var ZONES = D.zones, BLOCKS = D.blocks, EDIT = D.canEdit;
  var BY = {}; BLOCKS.forEach(function (b) { BY[b.key] = b; });
  var LS = function (fn) { try { return fn(window.localStorage); } catch (e) { return null; } };
  var KEY = "wd_" + (D.site.id || "principal") + "_";
  var MAX = 40;

  var ICONS = {
    text: "M5 6h14M5 11h14M5 16h9", heading: "M6 5v14M18 5v14M6 12h12", list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01", image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01",
    images: "M3 7h14v12H3zM7 3h14v12M3 16l4-4 3 3", video: "M3 6h13v12H3zM16 10l5-3v10l-5-3", audio: "M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3M19 16a3 3 0 1 1-3-3", button: "M3 8h18v8H3zM8 12h8",
    minus: "M5 12h14", space: "M12 3v6M9 6l3-3 3 3M12 21v-6M9 18l3 3 3-3M5 12h14", badge: "M12 3l2.5 2 3.2-.2.8 3.1 2.5 2-1.2 3 1.2 3-2.5 2-.8 3.1-3.2-.2L12 21l-2.5-2-3.2.2-.8-3.1-2.5-2L4.2 12 3 9l2.5-2 .8-3.1 3.2.2z",
    menu: "M4 6h16M4 12h16M4 18h16", search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4", news: "M5 4h11v16H5zM16 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3", comment: "M4 5h16v11H9l-5 4z", folder: "M3 6h6l2 2h10v11H3z",
    tag: "M3 12V4h8l10 10-8 8zM7.5 7.5h.01", code: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 5l-4 14", up: "M6 15l6-6 6 6", down: "M6 9l6 6 6-6", chevron: "M6 9l6 6 6-6", copy: "M8 8h12v12H8zM4 16V4h12",
    trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3", eyeoff: "M3 3l18 18M10.6 6.2A9 9 0 0 1 21 12a13 13 0 0 1-3 3.8M6.5 6.7A13 13 0 0 0 3 12s3.5 6 9 6a8.6 8.6 0 0 0 3.4-.7", restore: "M4 12a8 8 0 1 0 3-6.2M4 4v4h4",
    grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01", plus: "M12 5v14M5 12h14"
  };
  function icon(name, cls) { var s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("class", "mk-wd-ico" + (cls ? " " + cls : "")); var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", ICONS[name] || ICONS.text); s.appendChild(p); return s; }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { var v = attrs[k]; if (v === false || v === null || v === undefined) return; if (k === "text") e.textContent = v; else if (k === "class") e.className = v; else e.setAttribute(k, v === true ? "" : v); });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function uid() { var a = new Uint8Array(8); (window.crypto || window.msCrypto).getRandomValues(a); var s = "w"; a.forEach(function (n) { s += (n % 36).toString(36); }); return s; }
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  // ---------- État ----------
  var S = {
    layout: clone(D.layout), revision: D.revision, savedJson: JSON.stringify(D.layout), selected: null, insertZone: ZONES[0].key, tab: "blocks",
    past: [], future: [], saving: false, search: "", cat: "all", conflict: false, lastCoalesce: null, lastAt: 0,
    collapsed: (function () { try { return JSON.parse(LS(function (s) { return s.getItem(KEY + "collapsed"); }) || "{}") || {}; } catch (e) { return {}; } })(),
    panel: LS(function (s) { return s.getItem("wd_panel"); }) !== "0", savedAt: null
  };
  var jsonOf = function () { return JSON.stringify(S.layout); };
  var dirty = function () { return jsonOf() !== S.savedJson; };
  var live = h("div", { class: "sr-only", role: "status", "aria-live": "polite" }); root.appendChild(live);
  function say(t) { live.textContent = ""; window.setTimeout(function () { live.textContent = t; }, 30); }

  function listOf(zone) { return zone === "inactive" ? S.layout.inactive : S.layout.zones[zone]; }
  function find(id) {
    var keys = ZONES.map(function (z) { return z.key; }).concat(["inactive"]);
    for (var i = 0; i < keys.length; i++) { var l = listOf(keys[i]); for (var j = 0; j < l.length; j++) if (l[j].id === id) return { zone: keys[i], index: j, block: l[j], list: l }; }
    return null;
  }
  var zoneLabel = function (k) { return k === "inactive" ? "Widgets désactivés" : (ZONES.filter(function (z) { return z.key === k; })[0] || {}).label || k; };
  var labelOf = function (b) { return (BY[b.type] || {}).label || b.type; };

  // ---------- Historique ----------
  function snapshot() { return jsonOf(); }
  function mutate(fn, coalesce) {
    if (!EDIT || S.saving) return;
    var now = Date.now();
    if (!(coalesce && S.lastCoalesce === coalesce && now - S.lastAt < 900)) { S.past.push(snapshot()); if (S.past.length > 100) S.past.shift(); }
    S.lastCoalesce = coalesce || null; S.lastAt = now; S.future = [];
    fn(); refreshChrome();
  }
  function restore(json) { S.layout = JSON.parse(json); if (S.selected && !find(S.selected)) S.selected = null; S.lastCoalesce = null; renderAll(); }
  function undo() { if (!S.past.length || S.saving) return; S.future.push(snapshot()); restore(S.past.pop()); say("Modification annulée."); }
  function redo() { if (!S.future.length || S.saving) return; S.past.push(snapshot()); restore(S.future.pop()); say("Modification rétablie."); }

  // ---------- Barre d'outils ----------
  var bar = { undo: $("[data-wd-undo]"), redo: $("[data-wd-redo]"), save: $("[data-wd-save]"), label: $("[data-wd-save-label]"), state: $("[data-wd-state]"), banner: $("[data-wd-banner]"), panelBtn: $("[data-wd-panel-toggle]"), ins: $("[data-wd-inserter]"), str: $("[data-wd-structure]") };
  function refreshChrome() {
    var d = dirty();
    bar.undo.disabled = !S.past.length || S.saving || !EDIT; bar.redo.disabled = !S.future.length || S.saving || !EDIT;
    bar.save.disabled = !EDIT || S.saving || !d || S.conflict;
    bar.label.textContent = S.saving ? "Enregistrement…" : "Enregistrer";
    bar.save.classList.toggle("is-busy", S.saving);
    bar.state.className = "mk-wd-state" + (d ? " is-dirty" : "");
    if (S.saving) bar.state.textContent = "Enregistrement en cours…";
    else if (d) bar.state.textContent = "Modifications non enregistrées";
    else if (S.savedAt) bar.state.textContent = "Enregistré à " + S.savedAt;
    else bar.state.textContent = "";
    bar.panelBtn.setAttribute("aria-pressed", String(S.panel));
    $("[data-wd-panel]").classList.toggle("is-closed", !S.panel);
    root.classList.toggle("has-panel", S.panel);
    bar.ins.setAttribute("aria-pressed", String(S.panel && S.tab === "blocks"));
    bar.str.setAttribute("aria-pressed", String(S.panel && S.tab === "structure"));
  }
  function banner(msg, actions) {
    bar.banner.textContent = ""; if (!msg) { bar.banner.hidden = true; return; }
    bar.banner.appendChild(h("span", { text: msg }));
    (actions || []).forEach(function (a) { bar.banner.appendChild(h("button", { type: "button", class: "mk-wd-btn", text: a.label })).addEventListener("click", a.fn); });
    bar.banner.hidden = false;
  }

  // ---------- Opérations sur les blocs ----------
  function addBlock(type, zone, index, keepTab) {
    var def = BY[type]; if (!def || !EDIT) return;
    var list = listOf(zone); if (list.length >= MAX) { banner("Cette zone contient déjà " + MAX + " blocs : c'est le maximum."); return; }
    var id = uid();
    mutate(function () { list.splice(index === undefined ? list.length : index, 0, { id: id, type: type, settings: clone(def.defaults) }); S.selected = id; if (!keepTab) S.tab = "settings"; renderAll(); });
    say("Bloc « " + def.label + " » ajouté à « " + zoneLabel(zone) + " ».");
    focusBlock(id);
  }
  function move(id, zone, index) {
    var f = find(id); if (!f || !EDIT) return;
    var target = listOf(zone);
    if (zone !== f.zone && target.length >= MAX) { banner("La zone « " + zoneLabel(zone) + " » contient déjà " + MAX + " blocs."); return; }
    if (zone === f.zone && (index === f.index || index === f.index + 1)) return;
    mutate(function () {
      var b = f.list.splice(f.index, 1)[0];
      var at = zone === f.zone && index > f.index ? index - 1 : index;
      target.splice(Math.max(0, Math.min(at === undefined ? target.length : at, target.length)), 0, b);
      renderAll();
    });
    say("Bloc déplacé vers « " + zoneLabel(zone) + " ».");
    focusBlock(id);
  }
  function shift(id, dir) {
    var f = find(id); if (!f) return;
    var to = f.index + dir; if (to < 0 || to >= f.list.length) return;
    mutate(function () { var b = f.list.splice(f.index, 1)[0]; f.list.splice(to, 0, b); renderAll(); });
    say("Bloc déplacé en position " + (to + 1) + " sur " + f.list.length + ".");
    focusBlock(id);
  }
  function duplicate(id) {
    var f = find(id); if (!f || f.list.length >= MAX) return;
    var nid = uid();
    mutate(function () { f.list.splice(f.index + 1, 0, { id: nid, type: f.block.type, settings: clone(f.block.settings) }); S.selected = nid; renderAll(); });
    say("Bloc dupliqué."); focusBlock(nid);
  }
  function remove(id, hard) {
    var f = find(id); if (!f) return;
    if (hard && !window.confirm("Supprimer définitivement ce bloc « " + labelOf(f.block) + " » ? Ses réglages seront perdus après l'enregistrement.")) return;
    mutate(function () { f.list.splice(f.index, 1); if (S.selected === id) S.selected = null; renderAll(); });
    say("Bloc supprimé. Vous pouvez annuler avec Ctrl+Z.");
  }
  function deactivate(id) { var f = find(id); if (!f || f.zone === "inactive") return; if (S.layout.inactive.length >= 100) { banner("Trop de widgets désactivés : supprimez-en avant d'en ajouter."); return; } move(id, "inactive"); }
  function focusBlock(id) { window.setTimeout(function () { var el = root.querySelector('[data-block="' + id + '"] [data-card]'); if (el) el.focus({ preventScroll: false }); }, 0); }
  function select(id, tab) { S.selected = id; if (tab) S.tab = tab; if (id && !S.panel) { S.panel = true; } renderCanvasSelection(); renderPanes(); refreshChrome(); }

  // ---------- Aperçus (rendu serveur) ----------
  var previews = {}; // clé (type+réglages) → html
  function previewKey(b) { return b.type + ":" + JSON.stringify(b.settings); }
  function loadPreview(b, box) {
    var key = previewKey(b);
    var show = function (html) { box.innerHTML = html || ""; box.classList.toggle("is-empty", !html); if (!html) box.textContent = "Ce bloc n'affichera rien tant qu'il n'est pas complété."; box.removeAttribute("aria-busy"); };
    var apply = function (html) { if (box.isConnected) show(html); }; // réponse tardive : ignorée si le bloc a été redessiné entre-temps
    if (previews[key] !== undefined) return show(previews[key]); // déjà connu : tout de suite (la boîte n'est pas encore dans la page lors du dessin)
    box.setAttribute("aria-busy", "true");
    clearTimeout(box._t);
    box._t = window.setTimeout(function () {
      fetch(D.urls.preview, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ block: b }) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (j) { if (j && j.ok) { previews[key] = j.html; if (previewKey(b) === key) apply(j.html); } else if (box.isConnected) { box.textContent = (j && j.error) || "Aperçu indisponible."; box.classList.add("is-empty"); box.removeAttribute("aria-busy"); } })
        .catch(function () { if (box.isConnected) { box.textContent = "Aperçu indisponible (réseau)."; box.classList.add("is-empty"); box.removeAttribute("aria-busy"); } });
    }, 220);
  }

  // ---------- Zones et blocs (canevas) ----------
  var canvas = $("[data-wd-canvas]");
  var drag = null; // { id } | { type }
  function renderCanvas() {
    canvas.textContent = "";
    ZONES.forEach(function (z) { canvas.appendChild(zoneEl(z.key, z.label, z.description, false)); });
    canvas.appendChild(zoneEl("inactive", "Widgets désactivés", "Les blocs de cette zone ne seront pas affichés sur votre site. Ils gardent leurs réglages : vous pouvez les restaurer dans une zone.", true));
    renderCanvasSelection();
  }
  function zoneEl(key, name, desc, inactive) {
    var list = listOf(key), open = !S.collapsed[key], bid = "wd-zone-" + key;
    var sec = h("section", { class: "mk-wd-zone" + (inactive ? " is-inactive" : "") + (open ? "" : " is-collapsed"), "data-zone": key });
    var toggle = h("button", { type: "button", class: "mk-wd-zone-toggle", "aria-expanded": String(open), "aria-controls": bid }, [h("h2", { text: name }), h("span", { class: "mk-wd-count", text: list.length + (list.length > 1 ? " blocs" : " bloc") }), icon("chevron", "mk-wd-chev")]);
    toggle.addEventListener("click", function () { S.collapsed[key] = open; LS(function (s) { s.setItem(KEY + "collapsed", JSON.stringify(S.collapsed)); }); renderCanvas(); });
    sec.appendChild(h("header", { class: "mk-wd-zone-head" }, [toggle]));
    var body = h("div", { class: "mk-wd-zone-body", id: bid, hidden: !open });
    if (desc) body.appendChild(h("p", { class: "mk-wd-zone-desc", text: desc }));
    var ul = h("ul", { class: "mk-wd-blocks", "data-dropzone": key, "aria-label": name });
    list.forEach(function (b) { ul.appendChild(blockEl(b, key)); });
    if (!list.length) ul.appendChild(h("li", { class: "mk-wd-emptyhint", text: inactive ? "Aucun widget désactivé." : "Cette zone est vide : ajoutez un bloc ou glissez-en un ici." }));
    body.appendChild(ul);
    if (!inactive && EDIT) {
      var add = h("button", { type: "button", class: "mk-wd-add", "aria-label": "Ajouter un bloc à « " + name + " »" }, [icon("plus"), h("span", { text: "Ajouter un bloc" })]);
      add.addEventListener("click", function () { S.insertZone = key; S.tab = "blocks"; S.panel = true; renderPanes(); refreshChrome(); var q = $("[data-wd-search]"); if (q) q.focus(); });
      body.appendChild(add);
    }
    sec.appendChild(body);
    wireDrop(ul, key);
    return sec;
  }
  function blockEl(b, zone) {
    var def = BY[b.type] || { label: b.type, icon: "text" };
    var li = h("li", { class: "mk-wd-block", "data-block": b.id, draggable: EDIT ? "true" : false });
    var head = h("div", { class: "mk-wd-block-head" }, [EDIT ? h("span", { class: "mk-wd-grip", "aria-hidden": "true" }, [icon("grip")]) : null, icon(def.icon), h("span", { class: "mk-wd-block-name", text: def.label })]);
    var card = h("div", { class: "mk-wd-card", tabindex: "0", role: "button", "data-card": "1", "aria-label": def.label + ", bloc " + (find(b.id).index + 1) + " sur " + listOf(zone).length + " dans " + zoneLabel(zone) + (EDIT ? ". Entrée : régler. Alt + flèches : déplacer." : "") }, [head]);
    var box = h("div", { class: "mk-wd-preview" }); card.appendChild(box);
    loadPreview(b, box);
    card.addEventListener("click", function () { select(b.id, "settings"); });
    card.addEventListener("keydown", function (e) {
      if (e.target !== card) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(b.id, "settings"); }
      else if (EDIT && e.altKey && e.key === "ArrowUp") { e.preventDefault(); shift(b.id, -1); }
      else if (EDIT && e.altKey && e.key === "ArrowDown") { e.preventDefault(); shift(b.id, 1); }
      else if (EDIT && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); remove(b.id, zone === "inactive"); }
    });
    li.appendChild(card);
    if (EDIT) li.appendChild(toolbar(b, zone));
    li.addEventListener("dragstart", function (e) { drag = { id: b.id }; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("application/x-wd-block", b.id); } catch (x) { /* ignoré */ } li.classList.add("is-dragging"); root.classList.add("is-dragging"); });
    li.addEventListener("dragend", function () { drag = null; li.classList.remove("is-dragging"); root.classList.remove("is-dragging"); clearDrop(); });
    return li;
  }
  function btn(label, ic, fn, extra) {
    var b = h("button", { type: "button", class: "mk-wd-tbtn", "aria-label": label, title: label }, [icon(ic)]);
    if (extra && extra.disabled) b.disabled = true;
    b.addEventListener("click", function (e) { e.stopPropagation(); fn(); }); return b;
  }
  function toolbar(b, zone) {
    var f = find(b.id), bar2 = h("div", { class: "mk-wd-toolbar", role: "toolbar", "aria-label": "Actions du bloc " + labelOf(b) });
    bar2.appendChild(btn("Monter", "up", function () { shift(b.id, -1); }, { disabled: f.index === 0 }));
    bar2.appendChild(btn("Descendre", "down", function () { shift(b.id, 1); }, { disabled: f.index === f.list.length - 1 }));
    if (zone === "inactive") {
      var sel = h("select", { class: "mk-wd-mini", "aria-label": "Restaurer dans une zone" }, [h("option", { value: "", text: "Restaurer dans…" })].concat(ZONES.map(function (z) { return h("option", { value: z.key, text: z.label }); })));
      sel.addEventListener("click", function (e) { e.stopPropagation(); });
      sel.addEventListener("change", function () { if (sel.value) move(b.id, sel.value); });
      bar2.appendChild(sel);
    } else {
      var mv = h("select", { class: "mk-wd-mini", "aria-label": "Déplacer vers une autre zone" }, [h("option", { value: "", text: "Déplacer vers…" })].concat(ZONES.filter(function (z) { return z.key !== zone; }).map(function (z) { return h("option", { value: z.key, text: z.label }); })));
      mv.addEventListener("click", function (e) { e.stopPropagation(); });
      mv.addEventListener("change", function () { if (mv.value) move(b.id, mv.value); });
      bar2.appendChild(mv);
      bar2.appendChild(btn("Dupliquer", "copy", function () { duplicate(b.id); }));
      bar2.appendChild(btn("Désactiver (garder sans afficher)", "eyeoff", function () { deactivate(b.id); }));
    }
    bar2.appendChild(btn(zone === "inactive" ? "Supprimer définitivement" : "Supprimer", "trash", function () { remove(b.id, zone === "inactive"); }));
    return bar2;
  }
  function renderCanvasSelection() {
    root.querySelectorAll(".mk-wd-block").forEach(function (li) { var on = li.getAttribute("data-block") === S.selected; li.classList.toggle("is-selected", on); var c = li.querySelector("[data-card]"); if (c) c.setAttribute("aria-pressed", String(on)); });
  }

  // ---------- Glisser-déposer : position visible, déplacements invalides refusés ----------
  var dropLine = h("li", { class: "mk-wd-dropline", "aria-hidden": "true" });
  function clearDrop() { if (dropLine.parentNode) dropLine.parentNode.removeChild(dropLine); root.querySelectorAll(".is-drop-target").forEach(function (u) { u.classList.remove("is-drop-target", "is-drop-invalid"); }); }
  function indexAt(ul, y) {
    var items = Array.prototype.slice.call(ul.querySelectorAll(":scope > .mk-wd-block"));
    for (var i = 0; i < items.length; i++) { var r = items[i].getBoundingClientRect(); if (y < r.top + r.height / 2) return i; }
    return items.length;
  }
  function validDrop(zone) {
    if (!drag || !EDIT) return false;
    if (drag.id) { var f = find(drag.id); return Boolean(f) && (f.zone === zone || listOf(zone).length < MAX); }
    return zone !== "inactive" && listOf(zone).length < MAX; // un nouveau bloc ne se dépose pas dans les désactivés
  }
  function wireDrop(ul, zone) {
    ul.addEventListener("dragover", function (e) {
      if (!drag) return;
      var ok = validDrop(zone);
      ul.classList.add("is-drop-target"); ul.classList.toggle("is-drop-invalid", !ok);
      e.dataTransfer.dropEffect = ok ? (drag.id ? "move" : "copy") : "none";
      if (!ok) { if (dropLine.parentNode) dropLine.parentNode.removeChild(dropLine); return; }
      e.preventDefault();
      var i = indexAt(ul, e.clientY), items = ul.querySelectorAll(":scope > .mk-wd-block");
      ul.insertBefore(dropLine, items[i] || null);
    });
    ul.addEventListener("dragleave", function (e) { if (!ul.contains(e.relatedTarget)) { ul.classList.remove("is-drop-target", "is-drop-invalid"); if (dropLine.parentNode === ul) ul.removeChild(dropLine); } });
    ul.addEventListener("drop", function (e) {
      if (!drag) return;
      e.preventDefault();
      var ok = validDrop(zone), i = indexAt(ul, e.clientY), d = drag; drag = null; clearDrop(); root.classList.remove("is-dragging");
      if (!ok) { banner("Ce déplacement n'est pas possible."); return; }
      if (d.id) move(d.id, zone, i); else addBlock(d.type, zone, i, true); // le catalogue reste ouvert pour enchaîner les dépôts
    });
  }

  // ---------- Panneau : Blocs ----------
  var panes = { blocks: $('[data-wd-pane="blocks"]'), settings: $('[data-wd-pane="settings"]'), structure: $('[data-wd-pane="structure"]') };
  function usedCount(type) { var n = 0; ZONES.forEach(function (z) { S.layout.zones[z.key].forEach(function (b) { if (b.type === type) n++; }); }); return n; }
  function renderBlocksPane() {
    var p = panes.blocks, prevSearch = $("[data-wd-search]"), had = prevSearch && document.activeElement === prevSearch;
    p.textContent = "";
    if (!EDIT) { p.appendChild(h("p", { class: "mk-wd-note", text: "Vous consultez les widgets : l'ajout de blocs demande le droit de publier l'apparence." })); return; }
    var zsel = h("select", { id: "wd-zone-target", class: "mk-wd-input" }, ZONES.map(function (z) { return h("option", { value: z.key, text: z.label, selected: z.key === S.insertZone }); }));
    zsel.addEventListener("change", function () { S.insertZone = zsel.value; });
    p.appendChild(h("div", { class: "mk-wd-field" }, [h("label", { for: "wd-zone-target", text: "Ajouter dans la zone" }), zsel]));
    var q = h("input", { type: "search", class: "mk-wd-input", "data-wd-search": "1", placeholder: "Rechercher un bloc…", "aria-label": "Rechercher un bloc", value: S.search, autocomplete: "off" });
    q.addEventListener("input", function () { S.search = q.value; renderBlockList(); });
    p.appendChild(q);
    var chips = h("div", { class: "mk-wd-chips", role: "group", "aria-label": "Catégories de blocs" });
    [{ key: "all", label: "Tous" }].concat(D.categories).forEach(function (c) {
      var b = h("button", { type: "button", class: "mk-wd-chip", "aria-pressed": String(S.cat === c.key), text: c.label });
      b.addEventListener("click", function () { S.cat = c.key; renderBlocksPane(); }); chips.appendChild(b);
    });
    p.appendChild(chips);
    p.appendChild(h("div", { class: "mk-wd-list", "data-wd-list": "1" }));
    renderBlockList();
    if (had) { var nq = $("[data-wd-search]"); if (nq) { nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); } }
  }
  function renderBlockList() {
    var list = $("[data-wd-list]"); if (!list) return; list.textContent = "";
    var q = S.search.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    var found = BLOCKS.filter(function (b) {
      if (S.cat !== "all" && b.category !== S.cat) return false;
      var hay = (b.label + " " + b.description).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      return !q || hay.indexOf(q) !== -1;
    });
    if (!found.length) { list.appendChild(h("p", { class: "mk-wd-note", role: "status", text: "Aucun bloc ne correspond à « " + S.search + " »." })); return; }
    D.categories.forEach(function (c) {
      var inCat = found.filter(function (b) { return b.category === c.key; }); if (!inCat.length) return;
      list.appendChild(h("h3", { class: "mk-wd-cat", text: c.label }));
      var grid = h("div", { class: "mk-wd-grid" });
      inCat.forEach(function (b) {
        var n = usedCount(b.key);
        var it = h("button", { type: "button", class: "mk-wd-item", draggable: "true", title: b.description }, [icon(b.icon), h("span", { class: "mk-wd-item-name", text: b.label }), n ? h("span", { class: "mk-wd-used", text: "Utilisé " + n + (n > 1 ? " fois" : " fois") }) : null, h("span", { class: "mk-wd-item-desc", text: b.description })]);
        it.addEventListener("click", function () { addBlock(b.key, S.insertZone); });
        it.addEventListener("dragstart", function (e) { drag = { type: b.key }; e.dataTransfer.effectAllowed = "copy"; try { e.dataTransfer.setData("application/x-wd-new", b.key); } catch (x) { /* ignoré */ } root.classList.add("is-dragging"); });
        it.addEventListener("dragend", function () { drag = null; root.classList.remove("is-dragging"); clearDrop(); });
        grid.appendChild(it);
      });
      list.appendChild(grid);
    });
  }

  // ---------- Panneau : Réglages ----------
  function fieldInput(b, f, id) {
    var v = b.settings[f.name], dis = !EDIT, c;
    function set(val, coalesce) { mutate(function () { b.settings[f.name] = val; refreshBlockCard(b.id); }, coalesce ? b.id + ":" + f.name : null); }
    if (f.type === "textarea" || f.type === "code" || f.type === "lines") {
      var txt = f.type === "lines" ? (Array.isArray(v) ? v.join("\n") : v || "") : v || "";
      c = h("textarea", { id: id, class: "mk-wd-input" + (f.type === "code" ? " is-code" : ""), rows: f.type === "code" ? "8" : "4", maxlength: f.max ? String(f.type === "lines" ? 5000 : f.max) : false, disabled: dis, spellcheck: f.type === "code" ? "false" : false });
      c.value = txt; c.addEventListener("input", function () { set(f.type === "lines" ? c.value.split("\n") : c.value, true); });
    } else if (f.type === "select") {
      c = h("select", { id: id, class: "mk-wd-input", disabled: dis }, f.options.map(function (o) { return h("option", { value: String(o[0]), text: o[1] }); }));
      c.value = String(v); c.addEventListener("change", function () { set(c.value); });
    } else if (f.type === "menu") {
      c = h("select", { id: id, class: "mk-wd-input", disabled: dis }, [h("option", { value: "0", text: D.menus.length ? "— Choisir un menu —" : "Aucun menu publié sur ce site" })].concat(D.menus.map(function (m) { return h("option", { value: String(m.id), text: m.name }); })));
      c.value = String(v || 0); c.addEventListener("change", function () { set(parseInt(c.value, 10) || 0); });
    } else if (f.type === "checkbox") {
      c = h("input", { id: id, type: "checkbox", disabled: dis }); c.checked = v === true || v === "true" || v === 1; c.addEventListener("change", function () { set(c.checked); });
    } else if (f.type === "number") {
      c = h("input", { id: id, type: "number", class: "mk-wd-input", min: f.min, max: f.max, disabled: dis }); c.value = v; c.addEventListener("input", function () { set(c.value === "" ? "" : parseInt(c.value, 10), true); });
    } else {
      c = h("input", { id: id, type: f.type === "url" ? "url" : "text", class: "mk-wd-input", maxlength: f.max ? String(f.max) : "500", disabled: dis, placeholder: f.type === "url" || f.type === "image" ? "https://… ou /uploads/…" : false, autocomplete: "off" });
      c.value = v || ""; c.addEventListener("input", function () { set(c.value, true); });
    }
    return c;
  }
  function renderSettingsPane() {
    var p = panes.settings; p.textContent = "";
    var f = S.selected && find(S.selected);
    if (!f) {
      p.appendChild(h("p", { class: "mk-wd-note", text: "Sélectionnez un bloc dans une zone pour régler son contenu et sa présentation." }));
      p.appendChild(h("p", { class: "mk-wd-note", text: "Les blocs d'une zone « Widgets désactivés » ne s'affichent pas sur le site mais gardent leurs réglages." }));
      if (EDIT) { var a = h("button", { type: "button", class: "mk-wd-btn", text: "Ajouter un bloc" }); a.addEventListener("click", function () { S.tab = "blocks"; renderPanes(); refreshChrome(); }); p.appendChild(a); }
      return;
    }
    var def = BY[f.block.type]; if (!def) return;
    p.appendChild(h("div", { class: "mk-wd-sethead" }, [icon(def.icon), h("div", null, [h("strong", { text: def.label }), h("p", { class: "mk-wd-note", text: def.description + " Zone : " + zoneLabel(f.zone) + "." })])]));
    var form = h("div", { class: "mk-wd-form" });
    def.fields.forEach(function (fd, i) {
      var id = "wd-f-" + f.block.id + "-" + i, inp = fieldInput(f.block, fd, id);
      var row = h("div", { class: "mk-wd-field" + (fd.type === "checkbox" ? " is-check" : "") });
      if (fd.type === "checkbox") { row.appendChild(inp); row.appendChild(h("label", { for: id, text: fd.label })); } else { row.appendChild(h("label", { for: id, text: fd.label })); row.appendChild(inp); }
      if (fd.help) row.appendChild(h("p", { class: "mk-wd-help", text: fd.help }));
      if (fd.type === "menu" && !D.menus.length) row.appendChild(h("p", { class: "mk-wd-help" }, ["Créez d'abord un menu dans ", h("a", { href: D.urls.menus, text: "Apparence → Menus" }), "."]));
      form.appendChild(row);
    });
    p.appendChild(form);
    if (EDIT) {
      var acts = h("div", { class: "mk-wd-setacts" });
      var d1 = h("button", { type: "button", class: "mk-wd-btn", text: "Dupliquer" }); d1.addEventListener("click", function () { duplicate(f.block.id); });
      var d2 = f.zone === "inactive" ? null : h("button", { type: "button", class: "mk-wd-btn", text: "Désactiver" }); if (d2) d2.addEventListener("click", function () { deactivate(f.block.id); });
      var d3 = h("button", { type: "button", class: "mk-wd-btn mk-wd-btn--danger", text: "Supprimer" }); d3.addEventListener("click", function () { remove(f.block.id, f.zone === "inactive"); });
      [d1, d2, d3].forEach(function (x) { if (x) acts.appendChild(x); }); p.appendChild(acts);
    }
  }
  function refreshBlockCard(id) { var f = find(id); var box = root.querySelector('[data-block="' + id + '"] .mk-wd-preview'); if (f && box) loadPreview(f.block, box); }

  // ---------- Panneau : Structure ----------
  function renderStructure() {
    var p = panes.structure; p.textContent = "";
    var tree = h("ul", { class: "mk-wd-tree" });
    ZONES.map(function (z) { return [z.key, z.label]; }).concat([["inactive", "Widgets désactivés"]]).forEach(function (z) {
      var l = listOf(z[0]), li = h("li", null, [h("p", { class: "mk-wd-tree-zone", text: z[1] + " (" + l.length + ")" })]);
      var ul = h("ul");
      l.forEach(function (b) {
        var it = h("button", { type: "button", class: "mk-wd-tree-item", "aria-current": S.selected === b.id ? "true" : false }, [icon((BY[b.type] || {}).icon), h("span", { text: labelOf(b) })]);
        it.addEventListener("click", function () { select(b.id, "settings"); var el = root.querySelector('[data-block="' + b.id + '"]'); if (el) { if (S.collapsed[z[0]]) { S.collapsed[z[0]] = false; renderCanvas(); el = root.querySelector('[data-block="' + b.id + '"]'); } if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" }); } });
        ul.appendChild(h("li", null, [it]));
      });
      if (!l.length) ul.appendChild(h("li", { class: "mk-wd-note", text: "Vide" }));
      li.appendChild(ul); tree.appendChild(li);
    });
    p.appendChild(tree);
  }

  function renderPanes() {
    ["blocks", "settings", "structure"].forEach(function (k) {
      var on = S.tab === k; panes[k].hidden = !on;
      var t = $('[data-wd-tab="' + k + '"]'); t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
    });
    if (S.tab === "blocks") renderBlocksPane(); else if (S.tab === "settings") renderSettingsPane(); else renderStructure();
  }
  function renderAll() { renderCanvas(); renderPanes(); refreshChrome(); }

  // ---------- Enregistrement ----------
  function save() {
    if (!EDIT || S.saving || !dirty() || S.conflict) return;
    S.saving = true; banner(""); refreshChrome();
    fetch(D.urls.save, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ revision: S.revision, layout: S.layout }) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: "Réponse inattendue du serveur (code " + r.status + ")." }; }); })
      .then(function (j) {
        S.saving = false;
        if (j && j.ok) {
          S.layout = j.layout; S.revision = j.revision; S.savedJson = JSON.stringify(j.layout); S.past = []; S.future = []; // le serveur fait foi : l'état affiché est celui qu'il a enregistré
          if (S.selected && !find(S.selected)) S.selected = null;
          var d = new Date(); S.savedAt = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
          renderAll(); say("Widgets enregistrés.");
        } else if (j && j.conflict) {
          S.conflict = true; refreshChrome();
          banner("Ces widgets ont été modifiés ailleurs depuis votre chargement. Vos modifications n'ont pas été enregistrées.", [{ label: "Recharger la dernière version", fn: function () { S.savedJson = jsonOf(); window.location.reload(); } }]);
        } else { refreshChrome(); banner((j && j.error) || "L'enregistrement a échoué. Vos modifications sont conservées dans l'éditeur.", [{ label: "Réessayer", fn: save }]); }
      })
      .catch(function () { S.saving = false; refreshChrome(); banner("Le serveur n'a pas répondu : rien n'a été enregistré. Vos modifications sont conservées dans l'éditeur.", [{ label: "Réessayer", fn: save }]); });
  }

  // ---------- Câblage ----------
  bar.undo.addEventListener("click", undo); bar.redo.addEventListener("click", redo); bar.save.addEventListener("click", save);
  bar.ins.addEventListener("click", function () { if (S.panel && S.tab === "blocks") S.panel = false; else { S.panel = true; S.tab = "blocks"; } renderPanes(); refreshChrome(); if (S.panel) { var q = $("[data-wd-search]"); if (q) q.focus(); } });
  bar.str.addEventListener("click", function () { if (S.panel && S.tab === "structure") S.panel = false; else { S.panel = true; S.tab = "structure"; } renderPanes(); refreshChrome(); });
  bar.panelBtn.addEventListener("click", function () { S.panel = !S.panel; LS(function (s) { s.setItem("wd_panel", S.panel ? "1" : "0"); }); refreshChrome(); });
  root.querySelectorAll("[data-wd-tab]").forEach(function (t) {
    t.addEventListener("click", function () { S.tab = t.getAttribute("data-wd-tab"); renderPanes(); refreshChrome(); });
    t.addEventListener("keydown", function (e) { var tabs = ["blocks", "settings", "structure"], i = tabs.indexOf(S.tab); if (e.key === "ArrowRight") i = (i + 1) % 3; else if (e.key === "ArrowLeft") i = (i + 2) % 3; else return; e.preventDefault(); S.tab = tabs[i]; renderPanes(); refreshChrome(); $('[data-wd-tab="' + S.tab + '"]').focus(); });
  });
  var more = $("[data-wd-more]"), moreMenu = $("[data-wd-more-menu]");
  $("[data-wd-menus-link]").setAttribute("href", D.urls.menus);
  function closeMore() { moreMenu.hidden = true; more.setAttribute("aria-expanded", "false"); }
  more.addEventListener("click", function (e) { e.stopPropagation(); var open = moreMenu.hidden; moreMenu.hidden = !open; more.setAttribute("aria-expanded", String(open)); if (open) { var f = moreMenu.querySelector("button,a"); if (f) f.focus(); } });
  document.addEventListener("click", function (e) { if (!moreMenu.hidden && !moreMenu.contains(e.target)) closeMore(); });
  moreMenu.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeMore(); more.focus(); } });
  moreMenu.querySelectorAll("[data-wd-act]").forEach(function (b) {
    b.addEventListener("click", function () {
      var a = b.getAttribute("data-wd-act"); closeMore();
      if (a === "collapse-all" || a === "expand-all") { ZONES.map(function (z) { return z.key; }).concat(["inactive"]).forEach(function (k) { S.collapsed[k] = a === "collapse-all"; }); LS(function (s) { s.setItem(KEY + "collapsed", JSON.stringify(S.collapsed)); }); renderCanvas(); }
      else if (a === "reload") { if (!dirty() || window.confirm("Abandonner les modifications non enregistrées ?")) { S.savedJson = jsonOf(); window.location.reload(); } }
    });
  });
  document.addEventListener("keydown", function (e) {
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    var mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    else if (mod && !typing && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (mod && !typing && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
    else if (e.key === "Escape" && !typing && S.selected) { select(null); }
  });
  window.addEventListener("beforeunload", function (e) { if (dirty() && !S.conflict) { e.preventDefault(); e.returnValue = ""; } });

  if (!EDIT) root.classList.add("is-readonly");
  S.tab = "blocks";
  renderAll();
})();
