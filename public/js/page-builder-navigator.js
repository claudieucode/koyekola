/* KOLAKISA — Navigateur de page (comme le panneau « Navigation » des logiciels de création) : miniature de TOUTE la page + rectangle de la zone visible.
   Chargé À LA DEMANDE (premier clic sur le bouton) : jamais au démarrage de l'éditeur, jamais sur le site publié.
   Il ne possède AUCUNE donnée de zoom ni de position : il lit et pilote la source unique de page-builder.js (api.viewState / api.viewTo / api.setZoom).
   Miniature = représentation SIMPLIFIÉE dessinée sur un canvas (rectangles lus une fois dans la page), jamais un clone du DOM.
   Mises à jour : zone visible = une écriture de style par image ; miniature = redessinée seulement quand le contenu change (au plus ~4 fois par seconde). */
(function (root) {
  "use strict";
  var A = null, panel = null, view = null, canvas = null, rectEl = null, titleZoom = null, thumbBox = null;
  var open = false, unsub = null, unsubContent = null, drawTimer = 0, rafQueued = false, lastGen = -1, lastDocH = 0, lastDocW = 0, geom = null, dragging = false;
  var THUMB_W = 208, THUMB_H = 190, THUMB_H_TALL = 300, POS_KEY = "navigator-pos", OPEN_KEY = "navigator-open";
  var el = function (tag, attrs) { var n = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { if (k === "text") n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); }); for (var i = 2; i < arguments.length; i++) if (arguments[i]) n.appendChild(arguments[i]); return n; };
  var svg = function (d) { var s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", "15"); s.setAttribute("height", "15"); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true"); var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); s.appendChild(p); return s; };
  var ICON = { close: "M18 6 6 18M6 6l12 12", minus: "M5 12h14", plus: "M12 5v14M5 12h14", fit: "M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3", whole: "M4 4h16v16H4zM4 9h16M9 9v11", home: "M3 11 12 3l9 8M5 10v10h14V10" };
  var btn = function (label, icon, onclick, extra) { var b = el("button", { type: "button", class: "pb-nav-btn" + (extra ? " " + extra : ""), "aria-label": label, "data-tip": label }, svg(ICON[icon])); b.addEventListener("click", onclick); return b; };

  // ---------- Miniature : rectangles simplifiés lus dans la page (une seule lecture, aucun clonage) ----------
  function collect() {
    var doc = A.frame().contentDocument, win = A.frame().contentWindow;
    if (!doc || !doc.body) return null;
    var out = [], nodes = doc.querySelectorAll("[data-node-id]"), sx = win.scrollX, sy = win.scrollY, cap = 900;
    for (var i = 0; i < nodes.length && out.length < cap; i++) {
      var n = nodes[i], r = n.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      var depth = 0, p = n.parentElement; while (p && p !== doc.body) { if (p.hasAttribute && p.hasAttribute("data-node-id")) depth++; p = p.parentElement; }
      var tag = n.tagName, kind = "box", bg = "";
      if (/^H[1-6]$/.test(tag)) kind = "title";
      else if (/^(IMG|PICTURE|VIDEO|IFRAME|CANVAS|SVG)$/.test(tag) || n.querySelector(":scope > img, :scope > video, :scope > picture")) kind = "media";
      else if (tag === "BUTTON" || (tag === "A" && /btn|button/i.test(n.className))) kind = "button";
      else if (!n.querySelector("[data-node-id]")) kind = "text";
      if (kind === "box" && depth <= 2 && r.width * r.height > 4000) { bg = win.getComputedStyle(n).backgroundColor; if (/^rgba\(.*, 0\)$|^transparent$/.test(bg)) bg = ""; }
      out.push({ x: r.left + sx, y: r.top + sy, w: r.width, h: r.height, d: depth, k: kind, bg: bg });
    }
    return out;
  }
  function draw() {
    if (!open || !panel) return;
    var vs = A.viewState(); if (!vs) return;
    var nodes = collect(); if (!nodes) return;
    var maxH = vs.docW / vs.docH < 0.5 ? THUMB_H_TALL : THUMB_H;   // page très longue : miniature plus haute (et étroite) pour rester lisible
    var k = Math.min(THUMB_W / vs.docW, maxH / vs.docH), w = Math.max(20, Math.round(vs.docW * k)), h = Math.max(20, Math.round(vs.docH * k)), dpr = Math.min(2, window.devicePixelRatio || 1);
    k = Math.min(w / vs.docW, h / vs.docH);
    geom = { k: k, w: w, h: h, docW: vs.docW, docH: vs.docH };
    thumbBox.style.width = w + "px"; thumbBox.style.height = h + "px";
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + "px"; canvas.style.height = h + "px";
    var c = canvas.getContext("2d"), cs = getComputedStyle(panel);
    var rule = cs.getPropertyValue("--pb-nav-rule").trim() || "#c9d6e0", ink = cs.getPropertyValue("--pb-nav-ink").trim() || "#44596b", accent = cs.getPropertyValue("--pb-nav-accent").trim() || "#0277b6", page = cs.getPropertyValue("--pb-nav-page").trim() || "#fff";
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = page; c.fillRect(0, 0, w, h);
    nodes.forEach(function (n) {
      var x = n.x * k, y = n.y * k, ww = Math.max(1, n.w * k), hh = Math.max(1, n.h * k);
      if (n.k === "box") {
        if (n.bg) { c.fillStyle = n.bg; c.fillRect(x, y, ww, hh); }
        if (n.d <= 3 && ww > 6 && hh > 6) { c.strokeStyle = rule; c.lineWidth = 0.75; c.strokeRect(x + 0.4, y + 0.4, ww - 0.8, hh - 0.8); }
      } else if (n.k === "title") { c.fillStyle = ink; c.globalAlpha = 0.85; c.fillRect(x, y + hh * 0.2, ww * 0.7, Math.max(1.5, hh * 0.5)); c.globalAlpha = 1; }
      else if (n.k === "text") { c.fillStyle = ink; c.globalAlpha = 0.35; var lines = Math.max(1, Math.min(6, Math.round(hh / 3))); for (var i = 0; i < lines; i++) c.fillRect(x, y + i * (hh / lines) + 0.4, ww * (i === lines - 1 ? 0.6 : 0.95), Math.max(1, Math.min(2, hh / lines * 0.5))); c.globalAlpha = 1; }
      else if (n.k === "media") { c.fillStyle = rule; c.fillRect(x, y, ww, hh); c.strokeStyle = ink; c.globalAlpha = 0.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + ww, y + hh); c.moveTo(x + ww, y); c.lineTo(x, y + hh); c.stroke(); c.globalAlpha = 1; }
      else if (n.k === "button") { c.fillStyle = accent; c.fillRect(x, y, Math.max(3, ww), Math.max(2, hh)); }
    });
    lastGen = vs.gen; lastDocH = vs.docH; lastDocW = vs.docW;
    placeRect(vs);
  }
  function scheduleDraw() { clearTimeout(drawTimer); drawTimer = setTimeout(function () { requestAnimationFrame(draw); }, 250); }

  // ---------- Rectangle de la zone visible : une seule écriture de style par image ----------
  function placeRect(vs) {
    if (!geom || !vs) return;
    var k = geom.k;
    rectEl.style.transform = "translate3d(" + (vs.x * k).toFixed(2) + "px," + (vs.y * k).toFixed(2) + "px,0)";
    rectEl.style.width = Math.min(geom.w, vs.w * k).toFixed(2) + "px"; rectEl.style.height = Math.min(geom.h, vs.h * k).toFixed(2) + "px";
    titleZoom.textContent = Math.round(vs.zoom * 100) + " %";
    view.setAttribute("aria-valuetext", "Zone visible : " + Math.round(vs.y) + " px depuis le haut sur " + Math.round(vs.docH) + " px");
  }
  function sync() {
    if (!open || rafQueued) return;
    rafQueued = true;
    requestAnimationFrame(function () {
      rafQueued = false;
      var vs = A.viewState(); if (!vs) return;
      if (vs.gen !== lastGen || Math.abs(vs.docH - lastDocH) > 2 || Math.abs(vs.docW - lastDocW) > 2) { scheduleDraw(); }
      placeRect(vs);
    });
  }

  // ---------- Navigation : cliquer dans la miniature ou glisser le rectangle ----------
  function toDoc(e) { var r = thumbBox.getBoundingClientRect(); return { x: (e.clientX - r.left) / geom.k, y: (e.clientY - r.top) / geom.k }; }
  var navQueued = false, navTarget = null;
  function go(p, grab) {   // centre la zone visible sur (p) ; en glissant, garde le point saisi sous le curseur
    var vs = A.viewState(); if (!vs) return;
    navTarget = { x: p.x - (grab ? grab.dx : vs.w / 2), y: p.y - (grab ? grab.dy : vs.h / 2), maxX: Math.max(0, vs.docW - vs.w), maxY: Math.max(0, vs.docH - vs.h) };
    if (!navQueued) { navQueued = true; requestAnimationFrame(function () { navQueued = false; var t = navTarget; A.viewTo(Math.min(t.maxX, Math.max(0, t.x)), Math.min(t.maxY, Math.max(0, t.y))); }); }
  }
  function onDown(e) {
    if (e.button !== 0 || !geom) return;
    e.preventDefault();
    var p = toDoc(e), vs = A.viewState(), grab = null;
    if (vs && p.x >= vs.x && p.x <= vs.x + vs.w && p.y >= vs.y && p.y <= vs.y + vs.h) grab = { dx: p.x - vs.x, dy: p.y - vs.y };   // saisir le rectangle
    else go(p, null);                                                                                                              // cliquer ailleurs : y aller
    if (!grab) grab = { dx: vs ? vs.w / 2 : 0, dy: vs ? vs.h / 2 : 0 };
    dragging = true; panel.classList.add("is-dragging");
    try { view.setPointerCapture(e.pointerId); } catch (x) { /* capture indisponible */ }
    var move = function (ev) { if (ev.pointerId === e.pointerId) go(toDoc(ev), grab); };
    var up = function (ev) { if (ev.pointerId !== e.pointerId) return; view.removeEventListener("pointermove", move); view.removeEventListener("pointerup", up); view.removeEventListener("pointercancel", up); try { view.releasePointerCapture(ev.pointerId); } catch (x) { /* déjà relâché */ } dragging = false; panel.classList.remove("is-dragging"); };
    view.addEventListener("pointermove", move); view.addEventListener("pointerup", up); view.addEventListener("pointercancel", up);
  }
  function onKey(e) {
    var vs = A.viewState(); if (!vs) return;
    var step = e.shiftKey ? vs.h : vs.h / 4, k = e.key;
    if (k === "ArrowDown") A.viewTo(vs.x, Math.min(vs.docH - vs.h, vs.y + step));
    else if (k === "ArrowUp") A.viewTo(vs.x, Math.max(0, vs.y - step));
    else if (k === "ArrowRight") A.viewTo(Math.min(vs.docW - vs.w, vs.x + step), vs.y);
    else if (k === "ArrowLeft") A.viewTo(Math.max(0, vs.x - step), vs.y);
    else if (k === "Home") A.viewTo(0, 0); else if (k === "End") A.viewTo(vs.x, vs.docH);
    else return;
    e.preventDefault();
  }

  // ---------- Panneau flottant ----------
  function clampPos(x, y) { var c = A.canvas().getBoundingClientRect(), r = panel.getBoundingClientRect(); return { x: Math.min(Math.max(0, x), Math.max(0, c.width - r.width)), y: Math.min(Math.max(0, y), Math.max(0, c.height - r.height)) }; }
  function placePanel(pos) {
    if (pos) { var p = clampPos(pos.x, pos.y); panel.style.left = p.x + "px"; panel.style.top = p.y + "px"; panel.style.right = "auto"; panel.style.bottom = "auto"; }
    else { panel.style.left = panel.style.top = ""; panel.style.right = ""; panel.style.bottom = ""; }
  }
  function dragHead(e) {
    if (e.button !== 0 || e.target.closest("button")) return;
    var c = A.canvas().getBoundingClientRect(), r = panel.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top, id = e.pointerId, queued = false, cx = e.clientX, cy = e.clientY, head = e.currentTarget;
    try { head.setPointerCapture(id); } catch (x) { /* capture indisponible */ }
    var apply = function () { queued = false; var p = clampPos(cx - c.left - ox, cy - c.top - oy); panel.style.left = p.x + "px"; panel.style.top = p.y + "px"; panel.style.right = "auto"; panel.style.bottom = "auto"; };
    var move = function (ev) { if (ev.pointerId !== id) return; cx = ev.clientX; cy = ev.clientY; if (!queued) { queued = true; requestAnimationFrame(apply); } };
    var up = function (ev) { if (ev.pointerId !== id) return; head.removeEventListener("pointermove", move); head.removeEventListener("pointerup", up); head.removeEventListener("pointercancel", up); try { A.store.set(POS_KEY, { x: parseFloat(panel.style.left) || 0, y: parseFloat(panel.style.top) || 0 }); } catch (x) { /* mémoire indisponible */ } };
    head.addEventListener("pointermove", move); head.addEventListener("pointerup", up); head.addEventListener("pointercancel", up);
  }
  function build() {
    titleZoom = el("output", { class: "pb-nav-zoom", "aria-live": "off" });
    var close = btn("Fermer le Navigateur", "close", function () { toggle(false); });
    var head = el("div", { class: "pb-nav-head" }, el("span", { class: "pb-nav-title", id: "pb-nav-title", text: "Navigateur" }), titleZoom, close);
    head.addEventListener("pointerdown", dragHead);
    canvas = el("canvas", { class: "pb-nav-thumb", "aria-hidden": "true" });
    rectEl = el("div", { class: "pb-nav-rect", "aria-hidden": "true" });
    thumbBox = el("div", { class: "pb-nav-thumbbox" }, canvas, rectEl);
    view = el("div", { class: "pb-nav-view", tabindex: "0", role: "slider", "aria-label": "Zone visible de la page : cliquez ou glissez dans la miniature, ou utilisez les flèches", "aria-orientation": "vertical", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" }, thumbBox);
    view.addEventListener("pointerdown", onDown); view.addEventListener("keydown", onKey);
    var foot = el("div", { class: "pb-nav-foot" },
      btn("Zoom arrière", "minus", function () { A.setZoom(A.zoomStep(-1), { animate: true }); }),
      btn("Zoom avant", "plus", function () { A.setZoom(A.zoomStep(1), { animate: true }); }),
      el("span", { class: "pb-nav-sep", "aria-hidden": "true" }),
      btn("Ajuster à l'écran : toute la largeur de la page", "fit", function () { A.setZoom("fit", { animate: true }); }),
      btn("Afficher la page entière", "whole", function () { A.showWholePage(); }),
      btn("Revenir en haut à gauche", "home", function () { A.viewTo(0, 0); }));
    panel = el("div", { class: "pb-nav", role: "group", "aria-labelledby": "pb-nav-title", "data-pb-navigator-panel": "", hidden: "" }, head, view, foot);
    A.canvas().appendChild(panel);
  }
  function toggle(next) {
    if (next === undefined) next = !open;
    if (next === open) return;
    var b = document.querySelector("[data-pb-navigator]");
    if (next) {
      if (!panel) build();
      open = true; panel.hidden = false;
      try { placePanel(A.store.get(POS_KEY, null)); } catch (x) { placePanel(null); }
      unsub = A.subscribe(sync); unsubContent = A.subscribeContent(function () { if (open) scheduleDraw(); });
      A.window.addEventListener("resize", sync);
      requestAnimationFrame(function () { panel.classList.add("is-open"); draw(); });
    } else {
      open = false; panel.classList.remove("is-open");
      if (unsub) unsub(); unsub = null; if (unsubContent) unsubContent(); unsubContent = null; clearTimeout(drawTimer);
      A.window.removeEventListener("resize", sync);
      var done = function () { if (!open && panel) panel.hidden = true; };
      var dur = parseFloat(getComputedStyle(panel).transitionDuration) * 1000;
      if (dur > 1) setTimeout(done, dur + 20); else done();
    }
    if (b) { b.setAttribute("aria-expanded", String(open)); b.setAttribute("aria-pressed", String(open)); }
    try { A.store.set(OPEN_KEY, open); } catch (x) { /* mémoire indisponible */ }
    if (open) setTimeout(function () { if (view) view.focus({ preventScroll: true }); }, 0);
  }
  root.pbNavigator = {
    attach: function (api) { A = api; return root.pbNavigator; },
    toggle: toggle, isOpen: function () { return open; },
    // utile aux tests de mesure : géométrie de la miniature et du rectangle
    geometry: function () { return geom ? { k: geom.k, w: geom.w, h: geom.h } : null; }
  };
})(window);
