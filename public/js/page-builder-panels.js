// Éditeur de pages — gestionnaire de panneaux (gauche et droit) : ancré, flottant, barre d'icônes, masqué ; espaces de travail enregistrables.
//
// Ce fichier ne touche JAMAIS au document en cours de conception : il ne modifie que la PRÉSENTATION de l'environnement de travail.
// Il s'appuie sur l'état déjà géré par page-builder.js (objets `panels` et `dock` partagés via window.pbPanelsBridge, aucune copie) :
//   - masqué / affiché, largeurs, hauteur de la Structure : état existant (poignées, double-clic, boutons de la barre d'outils) ;
//   - NOUVEAU : mode de chaque panneau (ancré | flottant | barre d'icônes), position et taille du panneau flottant, repli des propriétés,
//     espaces de travail (Standard, Conception, Structure + dispositions personnelles), raccourcis.
// Préférences : localStorage, propres à la personne ET au site (clé « pb:pbp:<personne>:<site> »). Positions et tailles passent par `transform`
// et `width/height` du seul panneau déplacé : le canevas n'est ni reconstruit ni redessiné pendant un déplacement.
(function () {
  "use strict";
  var B = null, main, left, right, frame, st, KEY, WSKEY, custom = [], Z = 61, menuEl = null, menuFor = null, peek = null;
  var MIN_W = 240, MIN_H = 180, MAX_W = 640, STRIP_W = 44, SNAP = 72;
  var DEF = { mode: "docked", x: null, y: null, w: 300, h: 520 };
  var SIDES = ["left", "right"];
  var TITLES = { left: "Éléments", right: "Structure et propriétés" };

  // ---------- Espaces de travail fournis (ne modifient que la présentation) ----------
  var PRESETS = [
    { id: "standard", name: "Standard", hint: "Éléments à gauche, structure et propriétés à droite",
      snap: { panels: { left: 260, right: 340, layers: 46, leftHidden: false, rightHidden: false, layersCollapsed: false }, dock: { mode: "docked", last: "docked" }, pbp: { left: { mode: "docked" }, right: { mode: "docked" }, insp: false } } },
    { id: "conception", name: "Conception", hint: "Panneaux masqués : toute la place pour la page",
      snap: { panels: { leftHidden: true, rightHidden: true }, dock: { mode: "docked", last: "docked" }, pbp: { left: { mode: "docked" }, right: { mode: "docked" }, insp: false } } },
    { id: "structure", name: "Structure", hint: "Structure bien visible, éléments en barre d'icônes",
      snap: { panels: { right: 460, layers: 72, leftHidden: false, rightHidden: false, layersCollapsed: false }, dock: { mode: "docked", last: "docked" }, pbp: { left: { mode: "icons" }, right: { mode: "docked" }, insp: false } } }
  ];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, attrs, html) { var n = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]); }); if (html) n.innerHTML = html; return n; };
  var load = function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  var save = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible : la disposition vaut pour cette séance */ } };
  var num = function (v, d) { return typeof v === "number" && isFinite(v) ? v : d; };
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), Math.max(a, b)); };
  var narrow = function () { return window.matchMedia("(max-width: 1100px)").matches; };

  // ---------- Icônes (SVG en ligne : aucune dépendance) ----------
  var P = {
    float: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
    dock: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    dockR: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
    strip: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16"/><path d="M5.5 8h.01M5.5 12h.01M5.5 16h.01"/>',
    hide: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    ws: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
    elements: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    blocks: '<rect x="3" y="3" width="18" height="6" rx="1"/><rect x="3" y="12" width="8" height="9" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/>',
    page: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
    props: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>', plus: '<path d="M12 5v14M5 12h14"/>', reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'
  };
  var svg = function (n) { return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + P[n] + "</svg>"; };

  // ---------- État ----------
  function side(s) { return st[s]; }
  function modeOf(s) { return B.panels[s + "Hidden"] ? "hidden" : side(s).mode; }
  function sanitize(o) {
    var out = { left: Object.assign({}, DEF), right: Object.assign({}, DEF, { w: 340, h: 560 }), insp: false, active: "standard", before: null };
    o = o || {};
    SIDES.forEach(function (s) {
      var v = o[s] || {};
      out[s].mode = ["docked", "floating", "icons"].indexOf(v.mode) >= 0 ? v.mode : "docked";
      out[s].x = v.x === null || v.x === undefined ? null : num(v.x, null); out[s].y = v.y === null || v.y === undefined ? null : num(v.y, null);
      out[s].w = clamp(Math.round(num(v.w, out[s].w)), MIN_W, MAX_W); out[s].h = Math.max(MIN_H, Math.round(num(v.h, out[s].h)));
    });
    out.insp = Boolean(o.insp); out.active = typeof o.active === "string" ? o.active : "standard";
    out.before = o.before && typeof o.before === "object" ? { leftHidden: Boolean(o.before.leftHidden), rightHidden: Boolean(o.before.rightHidden) } : null;
    return out;
  }
  function persist() { save(KEY, st); }
  function snapshot() {
    var p = B.panels, d = B.dock;
    return {
      panels: { left: p.left, right: p.right, layers: p.layers, leftHidden: Boolean(p.leftHidden), rightHidden: Boolean(p.rightHidden), layersCollapsed: Boolean(p.layersCollapsed) },
      dock: { mode: d.mode, last: d.last, x: d.x, y: d.y, w: d.w, h: d.h },
      pbp: { left: Object.assign({}, st.left), right: Object.assign({}, st.right), insp: st.insp }
    };
  }

  // ---------- Application à l'écran ----------
  function bounds() { var r = main.getBoundingClientRect(); return { top: Math.max(0, r.top), left: Math.max(0, r.left), right: Math.min(window.innerWidth, r.right), bottom: window.innerHeight }; }
  function clampFloat(s) {
    var c = side(s), b = bounds();
    c.w = clamp(Math.round(c.w), MIN_W, Math.min(MAX_W, window.innerWidth - 16));
    c.h = clamp(Math.round(c.h), MIN_H, b.bottom - b.top - 8);
    c.x = clamp(Math.round(c.x), 0, window.innerWidth - c.w);
    c.y = clamp(Math.round(c.y), b.top, b.bottom - c.h);
  }
  function place(s) { var c = side(s), n = s === "left" ? left : right; n.style.width = c.w + "px"; n.style.height = c.h + "px"; n.style.transform = "translate3d(" + c.x + "px," + c.y + "px,0)"; }
  function colVars() {
    var v = {};
    var l = modeOf("left"), r = modeOf("right");
    v["--pbp-lc"] = l === "docked" ? "var(--pb-left-w)" : l === "icons" ? STRIP_W + "px" : "0px"; v["--pbp-lr"] = l === "docked" ? "6px" : "0px";
    v["--pbp-rc"] = r === "docked" ? "var(--pb-right-w)" : r === "icons" ? STRIP_W + "px" : "0px"; v["--pbp-rr"] = r === "docked" ? "6px" : "0px";
    Object.keys(v).forEach(function (k) { main.style.setProperty(k, v[k]); });
  }
  // Mise en page seule (légère : appelée à chaque changement d'état de l'éditeur, y compris pendant un glissement de poignée)
  function layout() {
    main.classList.add("pbp");
    SIDES.forEach(function (s) {
      var n = s === "left" ? left : right, m = modeOf(s), c = side(s);
      var floating = m === "floating", icons = m === "icons";
      if (floating && (c.x === null || c.y === null)) { var r0 = n.getBoundingClientRect(); c.x = r0.width ? r0.left : (s === "left" ? 60 : window.innerWidth - c.w - 20); c.y = r0.width ? r0.top : bounds().top + 8; if (r0.width) { c.w = r0.width; c.h = Math.min(r0.height, 560); } }
      if (floating) { clampFloat(s); place(s); } else { n.style.width = ""; n.style.height = ""; n.style.transform = ""; }
      n.classList.toggle("pbp-floating", floating);
      n.classList.toggle("pbp-icons", icons);
      if (!icons) n.classList.remove("pbp-peek");
      main.setAttribute("data-pbp-" + s, m);
      var rz = $('[data-pb-resize="' + s + '"]'); if (rz) rz.classList.toggle("pbp-no-resizer", m !== "docked");
      var strip = $('.pbp-strip[data-side="' + s + '"]'); if (strip) strip.hidden = !icons || narrow();
    });
    colVars();
  }
  function render(opts) {
    opts = opts || {};
    layout();
    SIDES.forEach(function (s) {
      var m = modeOf(s), c = side(s), floating = m === "floating", icons = m === "icons";
      var n = s === "left" ? left : right;
      var bar = $(".pbp-bar", n);
      if (bar) {
        var fl = $('[data-pbp="float"]', bar), ic = $('[data-pbp="icons"]', bar);
        fl.innerHTML = svg(floating ? (s === "left" ? "dock" : "dockR") : "float");
        fl.setAttribute("aria-label", floating ? "Ancrer le panneau" : "Détacher le panneau (le déplacer librement)");
        fl.setAttribute("data-tip", fl.getAttribute("aria-label")); fl.setAttribute("aria-pressed", String(floating));
        ic.setAttribute("aria-pressed", String(icons));
        bar.tabIndex = floating ? 0 : -1;
        bar.setAttribute("aria-label", floating ? TITLES[s] + " : flèches pour déplacer, Maj + flèches pour redimensionner" : TITLES[s]);
      }
    });
    right.classList.toggle("pbp-insp-collapsed", st.insp);
    var bar = $(".pbp-bar", right);
    if (bar) { var chip = $('[data-pbp="props"]', bar); if (chip) chip.setAttribute("aria-pressed", String(!st.insp)); var chs = $('[data-pbp="struct"]', bar); if (chs) chs.setAttribute("aria-pressed", String(!B.panels.layersCollapsed)); }
    updateButtons();
    if (!opts.quiet) { persist(); B.queueZoom(); }
  }
  function updateButtons() {
    // Les boutons de la barre d'outils de l'éditeur reflètent l'état réel (masqué / affiché)
    try { B.renderTools(); } catch (e) { /* barre d'outils absente : sans importance */ }
  }

  // ---------- Commandes ----------
  function setHidden(s, hidden) { B.panels[s + "Hidden"] = hidden; if (hidden) closePeek(); B.applyPanels(); render(); }
  function toggle(s) { setHidden(s, !B.panels[s + "Hidden"]); }
  function setMode(s, m) {
    if (narrow() && m !== "docked") { B.toast("Cette disposition demande un écran plus large : les panneaux restent ancrés ici."); return; }
    side(s).mode = m; if (B.panels[s + "Hidden"]) B.panels[s + "Hidden"] = false;
    closePeek(); B.applyPanels(); render();
    var n = s === "left" ? left : right; n.classList.remove("pbp-enter"); void n.offsetWidth; n.classList.add("pbp-enter"); setTimeout(function () { n.classList.remove("pbp-enter"); }, 220);
  }
  function both(hide, restore) {
    if (hide) { st.before = { leftHidden: Boolean(B.panels.leftHidden), rightHidden: Boolean(B.panels.rightHidden) }; B.panels.leftHidden = true; B.panels.rightHidden = true; }
    else { var b = restore && st.before ? st.before : { leftHidden: false, rightHidden: false }; B.panels.leftHidden = b.leftHidden && b.rightHidden ? false : b.leftHidden; B.panels.rightHidden = b.leftHidden && b.rightHidden ? false : b.rightHidden; st.before = null; }
    closePeek(); B.applyPanels(); render();
  }
  function toggleBoth() { both(!(B.panels.leftHidden && B.panels.rightHidden)); }
  function extended() { var visible = !B.panels.leftHidden || !B.panels.rightHidden; if (visible) both(true); else both(false, true); }
  function toggleInspector() { st.insp = !st.insp; render(); }
  function toggleStructure() { B.panels.layersCollapsed = !B.panels.layersCollapsed; B.applyPanels(); B.applyLayers(); render(); }

  function apply(snap, id) {
    var base = snapshot();
    var s = {
      panels: Object.assign({}, base.panels, snap.panels || {}), dock: Object.assign({}, base.dock, snap.dock || {}),
      pbp: { left: Object.assign({}, st.left, snap.pbp && snap.pbp.left), right: Object.assign({}, st.right, snap.pbp && snap.pbp.right), insp: snap.pbp ? Boolean(snap.pbp.insp) : st.insp }
    };
    Object.assign(B.panels, s.panels); Object.assign(B.dock, s.dock);
    var next = sanitize({ left: s.pbp.left, right: s.pbp.right, insp: s.pbp.insp, active: id || st.active });
    st = next; closePeek();
    B.applyPanels(); B.applyLayers(); B.applyDock(); B.saveDock();
    render();
  }
  function reset() { apply(PRESETS[0].snap, "standard"); B.toast("Disposition par défaut rétablie."); }

  // ---------- Espaces de travail personnels ----------
  function saveCustom() { save(WSKEY, custom); }
  function uid() { return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function nameFree(n, except) { n = (n || "").trim().slice(0, 40); if (!n) return ""; var low = n.toLowerCase(); var all = PRESETS.concat(custom).filter(function (x) { return x.id !== except; }); if (all.some(function (x) { return x.name.toLowerCase() === low; })) { var i = 2; while (all.some(function (x) { return x.name.toLowerCase() === (n + " " + i).toLowerCase(); })) i++; return n + " " + i; } return n; }
  function addCustom(name, snap) { var w = { id: uid(), name: nameFree(name), snap: snap || snapshot() }; if (!w.name) return null; custom.push(w); saveCustom(); st.active = w.id; persist(); return w; }
  var find = function (id) { return PRESETS.concat(custom).filter(function (w) { return w.id === id; })[0]; };

  // ---------- Barres d'en-tête des panneaux ----------
  function makeBar(s) {
    var bar = el("div", { class: "pbp-bar", "data-pbp-bar": s, role: "group" });
    bar.innerHTML = '<span class="pbp-grip" aria-hidden="true">' + svg("grip") + '</span><span class="pbp-title">' + TITLES[s] + "</span>";
    if (s === "right") bar.innerHTML += '<span class="pbp-chips"><button type="button" class="pbp-chip" data-pbp="struct" aria-pressed="true" data-tip="Afficher / replier la Structure">Structure</button><button type="button" class="pbp-chip" data-pbp="props" aria-pressed="true" data-tip="Afficher / replier les propriétés">Propriétés</button></span>';
    var btn = function (k, label, ic) { return '<button type="button" class="pbp-btn" data-pbp="' + k + '" aria-label="' + label + '" data-tip="' + label + '">' + svg(ic) + "</button>"; };
    bar.innerHTML += '<span class="pbp-actions">' + btn("ws", "Espaces de travail", "ws") + btn("icons", "Réduire en barre d'icônes", "strip") + btn("float", "Détacher le panneau (le déplacer librement)", "float") + btn("hide", "Masquer le panneau", "hide") + "</span>";
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pbp]"); if (!b) return;
      var k = b.getAttribute("data-pbp");
      if (k === "ws") openMenu(b, s);
      else if (k === "icons") setMode(s, modeOf(s) === "icons" ? "docked" : "icons");
      else if (k === "float") setMode(s, side(s).mode === "floating" ? "docked" : "floating");
      else if (k === "hide") toggle(s);
      else if (k === "struct") toggleStructure();
      else if (k === "props") toggleInspector();
    });
    bar.addEventListener("dblclick", function (e) { if (e.target.closest("button")) return; if (!narrow()) setMode(s, side(s).mode === "floating" ? "docked" : "floating"); });
    bar.addEventListener("keydown", function (e) {
      if (modeOf(s) !== "floating" || e.target !== bar || ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(e.key) < 0) return;
      e.preventDefault();
      var c = side(s), d = e.shiftKey ? 24 : 16, dx = e.key === "ArrowLeft" ? -d : e.key === "ArrowRight" ? d : 0, dy = e.key === "ArrowUp" ? -d : e.key === "ArrowDown" ? d : 0;
      if (e.shiftKey) { c.w += dx; c.h += dy; } else { c.x += dx; c.y += dy; }
      clampFloat(s); place(s); persist();
    });
    gesture(bar, s, "move");
    return bar;
  }
  function makeHandles(s, n) {
    ["e", "s", "w", "se", "sw"].forEach(function (d) { var h = el("span", { class: "pbp-rz pbp-rz-" + d, "aria-hidden": "true", "data-dir": d }); n.appendChild(h); gesture(h, s, d); });
  }

  // ---------- Déplacer / redimensionner / ancrer (une seule logique, pointeur : souris, stylet et tactile) ----------
  var dropEl = null;
  function dropZone(s, show) {
    if (!dropEl) { dropEl = el("div", { class: "pbp-drop", "aria-hidden": "true" }); document.body.appendChild(dropEl); }
    if (!show) { dropEl.classList.remove("is-on"); return; }
    var b = bounds(), w = clamp(B.panels[s], 200, 560), toolsW = $(".pb-tools") ? $(".pb-tools").getBoundingClientRect().width : 48;
    dropEl.style.top = b.top + "px"; dropEl.style.height = (b.bottom - b.top) + "px"; dropEl.style.width = w + "px";
    dropEl.style.left = (s === "left" ? b.left + toolsW : b.right - w) + "px";
    dropEl.classList.add("is-on");
  }
  function front(s) { Z = Z >= 68 ? 62 : Z + 1; (s === "left" ? left : right).style.zIndex = Z; }
  function gesture(handle, s, dir) {
    handle.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest && e.target.closest("button, input")) return;
      if (narrow()) return;
      var n = s === "left" ? left : right, c = side(s), wasDocked = modeOf(s) !== "floating";
      if (dir !== "move" && wasDocked) return;
      if (modeOf(s) === "icons" || modeOf(s) === "hidden") return;
      e.preventDefault();
      var sx = e.clientX, sy = e.clientY, started = dir !== "move" || !wasDocked, origin = null, active = false;
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* capture non prise en charge */ }
      var begin = function () {
        if (started) return;
        // Panneau ancré saisi par son en-tête : il se détache à l'endroit où il se trouve, puis suit le pointeur
        var r = n.getBoundingClientRect(); c.x = r.left; c.y = r.top; c.w = r.width; c.h = Math.min(r.height, 560, bounds().bottom - bounds().top - 8);
        c.mode = "floating"; started = true; render({ quiet: true }); place(s);
      };
      var o = { x: c.x, y: c.y, w: c.w, h: c.h };
      var move = function (ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!started) { if (Math.abs(dx) + Math.abs(dy) < 6) return; begin(); o = { x: c.x, y: c.y, w: c.w, h: c.h }; }
        if (!active) { active = true; frame.style.pointerEvents = "none"; document.body.classList.add("pbp-moving"); n.classList.add("is-moving"); front(s); }
        if (dir === "move") { c.x = o.x + dx; c.y = o.y + dy; }
        else {
          if (dir.indexOf("e") >= 0) c.w = o.w + dx;
          if (dir.indexOf("w") >= 0) { var nw = clamp(o.w - dx, MIN_W, MAX_W); c.x = o.x + (o.w - nw); c.w = nw; }
          if (dir.indexOf("s") >= 0) c.h = o.h + dy;
        }
        if (dir === "move") { c.x = clamp(c.x, 0, window.innerWidth - c.w); var bb = bounds(); c.y = clamp(c.y, bb.top, bb.bottom - c.h); }
        else { c.w = clamp(c.w, MIN_W, Math.min(MAX_W, window.innerWidth - 16)); c.h = clamp(c.h, MIN_H, bounds().bottom - bounds().top - 8); c.x = clamp(c.x, 0, window.innerWidth - c.w); c.y = clamp(c.y, bounds().top, bounds().bottom - c.h); }
        place(s);
        if (dir === "move") { var near = s === "left" ? ev.clientX <= bounds().left + 48 + SNAP : ev.clientX >= bounds().right - SNAP; dropZone(s, near); n.classList.toggle("is-dock-target", near); }
      };
      var up = function (ev) {
        handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", up); handle.removeEventListener("pointercancel", up);
        try { handle.releasePointerCapture(e.pointerId); } catch (err) { /* déjà relâchée */ }
        frame.style.pointerEvents = ""; document.body.classList.remove("pbp-moving"); n.classList.remove("is-moving", "is-dock-target");
        var near = dir === "move" && ev.type === "pointerup" && (s === "left" ? ev.clientX <= bounds().left + 48 + SNAP : ev.clientX >= bounds().right - SNAP);
        dropZone(s, false);
        if (!started) return;
        // Déposé sur la zone d'ancrage : le panneau se rattache (jamais d'ancrage involontaire : il faut lâcher DANS la zone)
        if (near && active) { c.mode = "docked"; render(); return; }
        persist(); if (wasDocked) B.queueZoom(); // la mise en page ne change que si le panneau vient de quitter son emplacement
      };
      handle.addEventListener("pointermove", move); handle.addEventListener("pointerup", up); handle.addEventListener("pointercancel", up);
    });
  }

  // ---------- Barre d'icônes (mode compact) et panneau temporaire ----------
  var STRIPS = {
    left: [["pb-tab-elements", "Éléments", "elements"], ["pb-tab-blocks", "Blocs", "blocks"], ["pb-tab-page", "Page", "page"]],
    right: [["struct", "Structure", "layers"], ["props", "Propriétés", "props"]]
  };
  function makeStrip(s) {
    var st0 = el("div", { class: "pbp-strip", "data-side": s, role: "toolbar", "aria-label": "Panneau " + (s === "left" ? "de gauche" : "de droite") + " réduit", "aria-orientation": "vertical", hidden: "" });
    var top = el("div", { class: "pbp-strip-top" });
    STRIPS[s].forEach(function (it) { var b = el("button", { type: "button", class: "pbp-strip-btn", "data-key": it[0], "aria-label": it[1], "data-tip": it[1] }, svg(it[2])); top.appendChild(b); });
    st0.appendChild(top);
    var down = el("div", { class: "pbp-strip-bot" });
    down.appendChild(el("button", { type: "button", class: "pbp-strip-btn", "data-key": "__dock", "aria-label": "Rétablir le panneau complet", "data-tip": "Rétablir le panneau complet" }, svg(s === "left" ? "dock" : "dockR")));
    st0.appendChild(down);
    st0.addEventListener("click", function (e) {
      var b = e.target.closest("[data-key]"); if (!b) return;
      var key = b.getAttribute("data-key");
      if (key === "__dock") { setMode(s, "docked"); return; }
      if (s === "left") B.openTab(key); else { if (key === "struct" && B.panels.layersCollapsed) toggleStructure(); if (key === "props" && st.insp) toggleInspector(); }
      openPeek(s);
    });
    return st0;
  }
  function openPeek(s) {
    var n = s === "left" ? left : right, strip = $('.pbp-strip[data-side="' + s + '"]'), b = bounds();
    if (peek && peek !== s) closePeek();
    var w = clamp(B.panels[s], MIN_W, Math.min(560, window.innerWidth - 120));
    n.style.width = w + "px"; n.style.top = b.top + "px"; n.style.height = (b.bottom - b.top) + "px";
    var sr = strip.getBoundingClientRect();
    if (s === "left") n.style.left = sr.right + "px"; else n.style.left = (sr.left - w) + "px";
    n.classList.add("pbp-peek"); peek = s; front(s);
  }
  function closePeek() {
    if (!peek) return;
    var n = peek === "left" ? left : right; n.classList.remove("pbp-peek"); ["width", "top", "left", "height"].forEach(function (k) { n.style[k] = ""; });
    if (modeOf(peek) === "floating") place(peek);
    peek = null;
  }

  // ---------- Menu « Espaces de travail » ----------
  function closeMenu() { if (!menuEl) return; menuEl.remove(); if (menuFor) menuFor.setAttribute("aria-expanded", "false"); menuEl = null; var f = menuFor; menuFor = null; if (f && document.contains(f)) f.focus({ preventScroll: true }); }
  function openMenu(anchor, s) {
    if (menuEl) { closeMenu(); return; }
    menuFor = anchor; anchor.setAttribute("aria-expanded", "true");
    var m = el("div", { class: "pbp-menu", role: "menu", "aria-label": "Espaces de travail" });
    var build = function () {
      m.innerHTML = "";
      var head = el("div", { class: "pbp-menu-h" }, "Espaces de travail"); m.appendChild(head);
      var row = function (w, builtIn) {
        var r = el("div", { class: "pbp-row" + (st.active === w.id ? " is-active" : ""), role: "none" });
        var b = el("button", { type: "button", class: "pbp-row-main", role: "menuitemradio", "aria-checked": String(st.active === w.id) });
        b.innerHTML = '<span class="pbp-row-ck">' + (st.active === w.id ? svg("check") : "") + '</span><span class="pbp-row-t"><strong></strong>' + (builtIn ? '<small>' + w.hint + "</small>" : "") + "</span>";
        $("strong", b).textContent = w.name;
        b.addEventListener("click", function () { apply(w.snap, w.id); closeMenu(); });
        r.appendChild(b);
        if (!builtIn) {
          var act = function (ic, label, fn) { var x = el("button", { type: "button", class: "pbp-mini", "aria-label": label + " : " + w.name, "data-tip": label }, svg(ic)); x.addEventListener("click", function (ev) { ev.stopPropagation(); fn(); }); r.appendChild(x); };
          act("edit", "Renommer", function () {
            var inp = el("input", { type: "text", class: "pbp-in", maxlength: "40", "aria-label": "Nouveau nom" }); inp.value = w.name; b.replaceWith(inp); inp.focus(); inp.select();
            var done = function (ok) { if (ok) { var nn = nameFree(inp.value, w.id); if (nn) { w.name = nn; saveCustom(); } } build(); };
            inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); done(true); } else if (ev.key === "Escape") { ev.stopPropagation(); done(false); } });
            inp.addEventListener("blur", function () { done(true); });
          });
          act("copy", "Dupliquer", function () { custom.push({ id: uid(), name: nameFree(w.name + " (copie)"), snap: JSON.parse(JSON.stringify(w.snap)) }); saveCustom(); build(); });
          act("trash", "Supprimer", function () { custom = custom.filter(function (x) { return x.id !== w.id; }); if (st.active === w.id) { st.active = "standard"; persist(); } saveCustom(); build(); });
        }
        m.appendChild(r);
      };
      PRESETS.forEach(function (w) { row(w, true); });
      if (custom.length) { m.appendChild(el("div", { class: "pbp-menu-h" }, "Mes dispositions")); custom.forEach(function (w) { row(w, false); }); }
      var f = el("form", { class: "pbp-new" });
      f.innerHTML = '<label class="sr-only" for="pbp-new-name">Nom de la disposition</label><input id="pbp-new-name" class="pbp-in" type="text" maxlength="40" placeholder="Nom" autocomplete="off"><button type="submit" class="pbp-save" data-tip="Enregistrer la disposition actuelle">' + svg("plus") + "<span>Enregistrer</span></button>";
      f.addEventListener("submit", function (ev) { ev.preventDefault(); var v = $("input", f).value; var w = addCustom(v || "Ma disposition"); if (w) { B.toast("Disposition « " + w.name + " » enregistrée."); render({ quiet: true }); build(); } });
      f.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { ev.stopPropagation(); closeMenu(); } });
      m.appendChild(f);
      var rs = el("button", { type: "button", class: "pbp-reset", role: "menuitem" }, svg("reset") + "<span>Réinitialiser la disposition par défaut</span>");
      rs.addEventListener("click", function () { reset(); closeMenu(); });
      m.appendChild(rs);
      var ft = el("p", { class: "pbp-menu-f" }, "Ctrl/⌘ + Alt + 1 : gauche · 2 : droite · 0 : les deux · F : conception étendue");
      m.appendChild(ft);
    };
    build();
    document.body.appendChild(m); menuEl = m;
    var r = anchor.getBoundingClientRect(), w = 300;
    m.style.width = w + "px"; m.style.left = clamp(s === "left" ? r.left : r.right - w, 8, window.innerWidth - w - 8) + "px"; m.style.top = (r.bottom + 6) + "px";
    var first = $(".pbp-row-main", m); if (first) first.focus({ preventScroll: true });
    m.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.stopPropagation(); closeMenu(); return; }
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        var items = [].slice.call(m.querySelectorAll(".pbp-row-main, .pbp-reset, .pbp-in")); var i = items.indexOf(document.activeElement);
        if (i < 0 && ev.key === "ArrowUp") return; ev.preventDefault(); items[(i + (ev.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus();
      }
    });
  }

  // ---------- Écouteurs globaux (installés une fois, jamais par panneau : rien à nettoyer à la fermeture d'un panneau) ----------
  function onKey(e) {
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if (e.key === "Escape") { if (menuEl) { closeMenu(); return; } if (peek) { var p = peek; closePeek(); var sb = $('.pbp-strip[data-side="' + p + '"] .pbp-strip-btn'); if (sb) sb.focus(); return; } }
    if (typing || !(e.metaKey || e.ctrlKey) || !e.altKey || e.shiftKey) return;
    if (document.querySelector("dialog[open]")) return;
    var c = e.code, handled = true;
    if (c === "Digit1" || c === "Numpad1") toggle("left");
    else if (c === "Digit2" || c === "Numpad2") toggle("right");
    else if (c === "Digit0" || c === "Numpad0") toggleBoth();
    else if (c === "KeyF") extended();
    else if (c === "KeyR") reset();
    else handled = false;
    if (handled) { e.preventDefault(); e.stopPropagation(); }
  }
  function onDown(e) {
    if (menuEl && !menuEl.contains(e.target) && !(menuFor && menuFor.contains(e.target))) closeMenu();
    if (peek) { var n = peek === "left" ? left : right, strip = $('.pbp-strip[data-side="' + peek + '"]'); if (!n.contains(e.target) && !strip.contains(e.target) && !(e.target.closest && e.target.closest(".pb-tip"))) closePeek(); }
    if (e.target.closest) { var f = e.target.closest(".pb-left.pbp-floating, .pb-right.pbp-floating"); if (f) front(f === left ? "left" : "right"); }
  }
  function onResize() {
    SIDES.forEach(function (s) { if (modeOf(s) === "floating") { clampFloat(s); place(s); } });
    var nar = narrow(); main.classList.toggle("pbp-narrow", nar);
    SIDES.forEach(function (s) { var strip = $('.pbp-strip[data-side="' + s + '"]'); if (strip) strip.hidden = modeOf(s) !== "icons" || nar; });
    if (peek && nar) closePeek();
  }

  // ---------- Démarrage ----------
  function start() {
    B = window.pbPanelsBridge; if (!B) return;
    main = $("[data-pb-main]"); left = $("[data-pb-left]"); right = $("[data-pb-right]"); frame = $("[data-pb-frame]");
    if (!main || !left || !right || !frame || main.classList.contains("pbp")) return;
    KEY = "pb:pbp:" + B.userId + ":" + B.siteId; WSKEY = "pb:pbp-ws:" + B.userId + ":" + B.siteId;
    st = sanitize(load(KEY, null));
    custom = (load(WSKEY, []) || []).filter(function (w) { return w && typeof w.id === "string" && typeof w.name === "string" && w.snap; }).slice(0, 30);
    SIDES.forEach(function (s) { var n = s === "left" ? left : right; n.insertBefore(makeBar(s), n.firstChild); makeHandles(s, n); main.appendChild(makeStrip(s)); });
    // Les panneaux flottants sont des « régions » nommées pour les lecteurs d'écran
    left.setAttribute("data-pbp-panel", "left"); right.setAttribute("data-pbp-panel", "right");
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("blur", function () { if (peek) closePeek(); }); // clic dans la page (iframe) : le panneau temporaire se referme
    onResize();
    render({ quiet: true });
    B.queueZoom();
  }

  window.pbPanels = {
    start: start,
    sync: function () { if (B && main) layout(); },
    toggle: function (s) { if (B) toggle(s); }, toggleBoth: function () { if (B) toggleBoth(); }, extended: function () { if (B) extended(); },
    reset: function () { if (B) reset(); }, setMode: function (s, m) { if (B) setMode(s, m); },
    workspaces: function () { return PRESETS.concat(custom).map(function (w) { return { id: w.id, name: w.name, active: st.active === w.id }; }); },
    applyWorkspace: function (id) { var w = find(id); if (B && w) apply(w.snap, w.id); },
    state: function () { return B ? { left: modeOf("left"), right: modeOf("right"), insp: st.insp, active: st.active, geometry: { left: Object.assign({}, st.left), right: Object.assign({}, st.right) } } : null; }
  };
  if (window.pbPanelsBridge && !main) start();
})();
