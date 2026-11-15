/* KOLAKISA — Navigator Studio : miniature RÉELLE de toute la page + rectangle de la zone visible + commandes de navigation.
   Chargé À LA DEMANDE (premier clic sur le bouton) : jamais au démarrage de l'éditeur, jamais sur le site publié.
   Aucune donnée de zoom ni de position ici : tout passe par la source unique de page-builder.js (api.viewState / api.viewTo / api.setZoom …).

   Miniature : le serveur renvoie déjà le HTML RENDU de la page (c'est ce que le canevas charge). Le Navigateur recharge ce MÊME rendu dans un cadre isolé,
   sans script (sandbox), à la largeur réelle de la page, réduit par une simple transformation d'échelle : images, textes, couleurs, polices, arrière-plans,
   bordures et colonnes sont donc ceux de la page. Aucun clonage du DOM interactif de l'éditeur, aucun identifiant dupliqué, aucun événement ni script rejoué.
   Actualisation : différée et regroupée (≥ 500 ms après la dernière modification, ≥ 1,2 s entre deux reconstructions, jamais pendant un geste), double tampon
   (l'ancien rendu reste affiché jusqu'à ce que le nouveau soit prêt), et le cadre est RETIRÉ à la fermeture (aucune mémoire gardée). */
(function (root) {
  "use strict";
  var A = null, panel = null, view = null, box = null, rectEl = null, selEl = null, emptyEl = null, zoomInput = null, histBack = null, histFwd = null, secBtn = null, secPop = null, secSearch = null, secList = null, tzOut = null, tzMinus = null, tzPlus = null;
  var tz = 1, TZ_MAX = 8, secOpen = false, secItems = [], secActive = 0;   // tz : zoom PROPRE à la miniature (1 = ajustée), indépendant du zoom du canevas
  var open = false, unsub = null, unsubContent = null, ro = null, frameEl = null, building = null, seq = 0;
  var lastGen = -1, lastBuildAt = 0, lastDocW = 0, lastDocH = 0, refreshTimer = 0, rafQueued = false, geom = null, dragging = false, resizing = false;
  var UI_KEY = "navigator-ui", MIN_W = 224, MIN_H = 190, DEF_W = 320, DEF_H = 360, FRAME_MAX_H = 60000;
  var ui = { mode: "float", x: null, y: null, w: DEF_W, h: DEF_H, locked: false, min: false, max: false, prev: null, adv: false, dockW: 280, recent: [] };

  var el = function (tag, attrs) { var n = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { if (k === "text") n.textContent = attrs[k]; else if (attrs[k] !== null && attrs[k] !== false) n.setAttribute(k, attrs[k] === true ? "" : attrs[k]); }); for (var i = 2; i < arguments.length; i++) if (arguments[i]) n.appendChild(arguments[i]); return n; };
  var SVG = "http://www.w3.org/2000/svg";
  var svg = function (d, size) { var s = document.createElementNS(SVG, "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", String(size || 15)); s.setAttribute("height", String(size || 15)); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true"); d.split("|").forEach(function (seg) { var p = document.createElementNS(SVG, "path"); p.setAttribute("d", seg); s.appendChild(p); }); return s; };
  var ICON = {
    close: "M18 6 6 18|M6 6l12 12", minus: "M5 12h14", plus: "M12 5v14|M5 12h14",
    fit: "M8 3H5a2 2 0 0 0-2 2v3|M21 8V5a2 2 0 0 0-2-2h-3|M3 16v3a2 2 0 0 0 2 2h3|M16 21h3a2 2 0 0 0 2-2v-3",
    width: "M4 12h16|M8 8l-4 4 4 4|M16 8l4 4-4 4", whole: "M5 3h14v18H5z|M5 9h14", one: "M9 8l3-2v12",
    lock: "M7 11V8a5 5 0 0 1 10 0v3|M5 11h14v10H5z", unlock: "M7 11V8a5 5 0 0 1 9.5-2|M5 11h14v10H5z",
    dock: "M3 4h18v16H3z|M15 4v16", float: "M3 5h13v11H3z|M8 11h13v8H8z",
    min: "M5 19h14", max: "M4 4h16v16H4z", restore: "M8 4h12v12|M4 8h12v12H4z",
    chevron: "m6 9 6 6 6-6", back: "M15 18l-6-6 6-6", fwd: "M9 6l6 6-6 6",
    top: "M5 4h14|M12 20V8|M7 13l5-5 5 5", mid: "M4 8h16|M4 16h16|M12 10v4", height: "M12 4v16|M8 8l4-4 4 4|M8 16l4 4 4-4", list: "M8 6h13|M8 12h13|M8 18h13|M3 6h.01|M3 12h.01|M3 18h.01", search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z|M21 21l-4.3-4.3", globe: "M3 3h18v18H3z|M3 9h18|M9 9v12", end: "M5 20h14|M12 4v12|M7 11l5 5 5-5",
    sel: "M4 4h16v16H4z|M9 9h6v6H9z", hand: "M18 11V6a2 2 0 0 0-4 0|M14 10V4a2 2 0 0 0-4 0v2|M10 10.5V6a2 2 0 0 0-4 0v8|M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",
    area: "M3 7V5a2 2 0 0 1 2-2h2|M17 3h2a2 2 0 0 1 2 2v2|M21 17v2a2 2 0 0 1-2 2h-2|M7 21H5a2 2 0 0 1-2-2v-2|M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z|M16 16l-2-2", home: "M3 11 12 3l9 8|M5 10v10h14V10", reset: "M3 12a9 9 0 1 0 3-6.7L3 8|M3 3v5h5"
  };
  var btn = function (label, icon, onclick, cls, extra) {
    var b = el("button", { type: "button", class: "pb-nvs-btn" + (cls ? " " + cls : ""), "aria-label": label, "data-tip": label }, svg(ICON[icon]));
    if (extra) Object.keys(extra).forEach(function (k) { b.setAttribute(k, extra[k]); });
    b.addEventListener("click", onclick); return b;
  };
  var txtBtn = function (label, text, onclick) { var b = el("button", { type: "button", class: "pb-nvs-btn pb-nvs-txt", "aria-label": label, "data-tip": label, text: text }); b.addEventListener("click", onclick); return b; };
  var loadUi = function () { try { var v = A.store.get(UI_KEY, null); if (v && typeof v === "object") Object.keys(ui).forEach(function (k) { if (v[k] !== undefined) ui[k] = v[k]; }); } catch (e) { /* mémoire indisponible */ } };
  var saveUi = function () { try { A.store.set(UI_KEY, { mode: ui.mode, x: ui.x, y: ui.y, w: ui.w, h: ui.h, locked: ui.locked, min: ui.min, max: ui.max, prev: ui.prev, adv: ui.adv, dockW: ui.dockW, recent: ui.recent }); } catch (e) { /* mémoire indisponible */ } };
  var cbox = function () { return A.canvas().getBoundingClientRect(); };
  var clamp = function (v, lo, hi) { return Math.min(Math.max(v, lo), Math.max(lo, hi)); };

  // ---------- Miniature : le rendu du serveur, isolé et sans script ----------
  var vhToVar = function (t) { return t.replace(/(-?\d*\.?\d+)\s*(?:d|s|l)?vh\b/gi, "calc($1 * var(--pb-nvs-vh))"); };
  function prepare(html, viewportH) {
    var out = html
      .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")                                   // aucun script rejoué
      .replace(/<iframe\b([^>]*?)\ssrc=/gi, "<iframe$1 data-nosrc=")                     // les contenus intégrés restent des boîtes vides
      .replace(/\sautoplay(=("[^"]*"|'[^']*'|[^\s>]*))?/gi, "")                          // aucune vidéo ne démarre
      .replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, function (m, a, b, c) { return a + vhToVar(b) + c; })   // « 100vh » = hauteur de l'écran d'origine, pas celle de la miniature
      .replace(/style="([^"]*)"/gi, function (m, b) { return 'style="' + vhToVar(b) + '"'; });
    var css = "<style>*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}html{scroll-behavior:auto!important;overflow:hidden!important}:root{--pb-nvs-vh:" + (viewportH / 100) + "px}</style>";
    return /<head[^>]*>/i.test(out) ? out.replace(/<head[^>]*>/i, function (m) { return m + css; }) : css + out;
  }
  function build() {
    if (!open || !panel) return;
    var vs = A.viewState(), r = A.render();
    if (!vs || !r.html) { if (emptyEl) emptyEl.hidden = false; return; }
    if (A.gesture()) { schedule(400); return; }                                          // jamais pendant un geste ni une transition
    var wait = 1200 - (performance.now() - lastBuildAt);
    if (frameEl && wait > 0) { schedule(wait); return; }                                 // au plus une reconstruction par 1,2 s
    var mine = ++seq, de = A.frame().contentDocument.documentElement;
    var cw = de.clientWidth, ch = A.frame().contentWindow.innerHeight, docH = Math.min(FRAME_MAX_H, Math.max(vs.docH, ch));
    var nf = el("iframe", { class: "pb-nvs-frame", sandbox: "allow-same-origin", tabindex: "-1", "aria-hidden": "true", title: "Aperçu de la page" });
    nf.style.width = cw + "px"; nf.style.height = docH + "px"; nf.style.opacity = "0";
    building = nf;
    nf.addEventListener("load", function () {
      if (mine !== seq || !open) { nf.remove(); return; }
      var old = frameEl; frameEl = nf; building = null; nf.style.opacity = ""; if (old) old.remove();
      lastGen = vs.gen; lastBuildAt = performance.now(); lastDocW = cw; lastDocH = docH;
      if (emptyEl) emptyEl.hidden = true;
      fit(); placeRect(A.viewState());
    });
    nf.srcdoc = prepare(r.html, ch);
    box.appendChild(nf);
    lastGen = vs.gen;
  }
  function schedule(ms) { clearTimeout(refreshTimer); refreshTimer = setTimeout(build, ms === undefined ? 500 : ms); }

  // ---------- Ajustement : la miniature remplit l'espace disponible sans déformation ----------
  function fit() {
    if (!view || !frameEl) return;
    var cw = lastDocW || 1, dh = lastDocH || 1, vr = view.getBoundingClientRect(), pad = 12;
    var aw = Math.max(40, vr.width - pad * 2), ah = Math.max(40, vr.height - pad * 2);
    var k0 = Math.min(aw / cw, ah / dh), k = k0 * tz;
    if (cw * k > 24000 || dh * k > 24000) { k = Math.min(24000 / cw, 24000 / dh); tz = Math.max(1, k / k0); }   // borne mémoire de la miniature agrandie
    geom = { k: k, k0: k0, w: Math.max(2, cw * k), h: Math.max(2, dh * k), docW: cw, docH: dh };   // dimensions fractionnaires : aucune déformation même très petite
    box.style.width = geom.w + "px"; box.style.height = geom.h + "px";
    frameEl.style.transform = "scale(" + k + ")";
    view.classList.toggle("is-zoomed", tz > 1.001);
    syncTz();
    placeRect(A.viewState());
  }

  // ---------- Rectangle de la zone visible (une écriture de style par image) ----------
  function placeRect(vs) {
    if (!geom || !vs || !rectEl) return;
    var k = geom.k, sx = geom.docW / Math.max(1, vs.docW);
    rectEl.style.transform = "translate3d(" + (vs.x * k).toFixed(2) + "px," + (vs.y * k).toFixed(2) + "px,0)";
    rectEl.style.width = Math.min(geom.w, vs.w * k).toFixed(2) + "px"; rectEl.style.height = Math.min(geom.h, vs.h * k).toFixed(2) + "px";
    var sr = A.hasSelection() ? A.selectionRect() : null;
    if (sr) { selEl.hidden = false; selEl.style.transform = "translate3d(" + (sr.x * k).toFixed(2) + "px," + (sr.y * k).toFixed(2) + "px,0)"; selEl.style.width = Math.max(2, sr.w * k).toFixed(2) + "px"; selEl.style.height = Math.max(2, sr.h * k).toFixed(2) + "px"; }
    else selEl.hidden = true;
    var pct = Math.round(vs.zoom * 100);
    if (zoomInput && document.activeElement !== zoomInput) zoomInput.value = pct;
    panel.querySelector(".pb-nvs-zoom").textContent = pct + " %";
    view.setAttribute("aria-valuetext", "Zone visible : " + Math.round(vs.y) + " px depuis le haut sur " + Math.round(vs.docH) + " px, zoom " + pct + " %"); void sx;
    var h = A.history(); if (histBack) { histBack.disabled = !h.back; histFwd.disabled = !h.forward; }
    if (tz > 1.001 && !dragging && !panning) follow(vs);
  }
  // Miniature agrandie : le rectangle de navigation reste toujours visible (la miniature défile seulement s'il sort de l'espace disponible)
  function follow(vs) {
    var k = geom.k, vr = view.getBoundingClientRect(), br = box.getBoundingClientRect();
    var rx = br.left - vr.left + vs.x * k, ry = br.top - vr.top + vs.y * k, rw = Math.min(geom.w, vs.w * k), rh = Math.min(geom.h, vs.h * k), dx = 0, dy = 0;
    // si le cadre tient dans l'espace : il y reste entièrement ; sinon : on le recentre dès que son centre sort de l'espace
    if (rw <= vr.width) { if (rx < 0) dx = rx; else if (rx + rw > vr.width) dx = rx + rw - vr.width; } else if (rx + rw / 2 < 0 || rx + rw / 2 > vr.width) dx = rx + rw / 2 - vr.width / 2;
    if (rh <= vr.height) { if (ry < 0) dy = ry; else if (ry + rh > vr.height) dy = ry + rh - vr.height; } else if (ry + rh / 2 < 0 || ry + rh / 2 > vr.height) dy = ry + rh / 2 - vr.height / 2;
    if (dx || dy) { view.scrollLeft += dx; view.scrollTop += dy; }
  }
  // Zoom de la miniature : autour d'un point (le point visé reste sous le curseur) ; ne touche JAMAIS au zoom du canevas
  function setTz(next, cx, cy) {
    next = clamp(Math.round(next * 100) / 100, 1, TZ_MAX);
    if (!geom || Math.abs(next - tz) < 0.005) return;
    var vr = view.getBoundingClientRect(), br = box.getBoundingClientRect();
    var ax = cx === undefined ? vr.left + vr.width / 2 : cx, ay = cy === undefined ? vr.top + vr.height / 2 : cy;
    var px = (ax - br.left) / geom.k, py = (ay - br.top) / geom.k;                       // point du DOCUMENT sous l'ancre
    tz = next; fit();
    var nb = box.getBoundingClientRect(), nr = view.getBoundingClientRect();
    view.scrollLeft += nb.left + px * geom.k - ax + (nr.left - vr.left) * 0; view.scrollTop += nb.top + py * geom.k - ay;
    placeRect(A.viewState());
  }
  function syncTz() {
    if (!tzOut) return;
    tzOut.textContent = Math.round(tz * 100) + " %"; tzMinus.disabled = tz <= 1.001; tzPlus.disabled = tz >= TZ_MAX - 0.001;
    var g = panel.querySelector("[data-nav=tzfit]"); if (g) g.disabled = tz <= 1.001;
  }
  function sync() {
    if (!open || rafQueued) return;
    rafQueued = true;
    requestAnimationFrame(function () {
      rafQueued = false;
      var vs = A.viewState(); if (!vs) return;
      if (vs.gen !== lastGen) schedule(500);                                              // nouveau rendu de la page
      else if (frameEl && (Math.abs(Math.min(FRAME_MAX_H, vs.docH) - lastDocH) > 2)) schedule(600);   // la hauteur a changé
      placeRect(vs);
    });
  }

  // ---------- Navigation : cliquer dans la miniature ou glisser le rectangle ----------
  function toDoc(e) { var r = box.getBoundingClientRect(); return { x: (e.clientX - r.left) / geom.k, y: (e.clientY - r.top) / geom.k }; }
  var navQueued = false, navTarget = null;
  function go(p, grab) {
    var vs = A.viewState(); if (!vs) return;
    navTarget = { x: p.x - (grab ? grab.dx : vs.w / 2), y: p.y - (grab ? grab.dy : vs.h / 2), maxX: Math.max(0, vs.docW - vs.w), maxY: Math.max(0, vs.docH - vs.h) };
    if (!navQueued) { navQueued = true; requestAnimationFrame(function () { navQueued = false; var t = navTarget; A.viewTo(Math.min(t.maxX, Math.max(0, t.x)), Math.min(t.maxY, Math.max(0, t.y))); }); }
  }
  var panning = false;
  function onWheel(e) {
    if (!geom) return;
    if (e.ctrlKey || e.metaKey || e.altKey) { e.preventDefault(); setTz(tz * Math.exp(-e.deltaY * 0.0028), e.clientX, e.clientY); }   // Ctrl / ⌘ / pincement : zoom de la miniature
  }
  function startPan(e) {                                                                                                          // bouton du milieu : déplacer la miniature agrandie
    e.preventDefault(); if (tz <= 1.001) return;
    var sx = e.clientX, sy = e.clientY, l0 = view.scrollLeft, t0 = view.scrollTop, id = e.pointerId; panning = true; view.classList.add("is-panning");
    try { view.setPointerCapture(id); } catch (x) { /* capture indisponible */ }
    var move = function (ev) { if (ev.pointerId === id) { view.scrollLeft = l0 - (ev.clientX - sx); view.scrollTop = t0 - (ev.clientY - sy); } };
    var up = function (ev) { if (ev.pointerId !== id) return; view.removeEventListener("pointermove", move); view.removeEventListener("pointerup", up); view.removeEventListener("pointercancel", up); panning = false; view.classList.remove("is-panning"); };
    view.addEventListener("pointermove", move); view.addEventListener("pointerup", up); view.addEventListener("pointercancel", up);
  }
  function onDown(e) {
    if (e.button === 1) { startPan(e); return; }
    if (e.button !== 0 || !geom) return;
    e.preventDefault();
    var p = toDoc(e), vs = A.viewState(), grab = null;
    A.rememberView(false);
    if (vs && p.x >= vs.x && p.x <= vs.x + vs.w && p.y >= vs.y && p.y <= vs.y + vs.h) grab = { dx: p.x - vs.x, dy: p.y - vs.y };   // saisir le rectangle
    else go(p, null);                                                                                                                  // cliquer ailleurs : y aller
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
    else if (k === "Home") A.goTo("start"); else if (k === "End") A.goTo("end");
    else if (k === "+" || k === "=") setTz(tz * 1.25); else if (k === "-") setTz(tz / 1.25); else if (k === "0") { tz = 1; fit(); view.scrollLeft = 0; view.scrollTop = 0; }
    else return;
    e.preventDefault();
  }

  // ---------- Disposition du panneau : flottant (libre) ou ancré (colonne à droite du canevas), redimensionnable, mémorisée ----------
  function applyLayout() {
    if (!panel) return;
    var c = cbox(), canvasEl = A.canvas();
    var dock = ui.mode === "dock";
    panel.classList.toggle("is-dock", dock); panel.classList.toggle("is-min", ui.min && !dock); panel.classList.toggle("is-locked", ui.locked);
    canvasEl.classList.toggle("has-nav-dock", dock);
    canvasEl.style.setProperty("--pb-nvs-dock-w", dock ? ui.dockW + "px" : "0px");
    if (dock) { ["left", "top", "right", "bottom", "width", "height"].forEach(function (k) { panel.style[k] = ""; }); }
    else {
      var w = ui.max ? Math.round(c.width * 0.62) : ui.w, h = ui.min ? 0 : ui.max ? Math.round(c.height * 0.8) : ui.h;
      w = clamp(w, MIN_W, c.width - 16); h = ui.min ? "" : clamp(h, MIN_H, c.height - 16);
      var x = ui.max ? Math.round((c.width - w) / 2) : ui.x === null ? c.width - w - 14 : ui.x, y = ui.max ? Math.round((c.height - h) / 2) : ui.y === null ? c.height - (ui.min ? 40 : h) - 58 : ui.y;
      panel.style.width = w + "px"; panel.style.height = ui.min ? "" : h + "px";
      panel.style.left = clamp(x, 0, c.width - w) + "px"; panel.style.top = clamp(y, 0, c.height - (ui.min ? 40 : h)) + "px"; panel.style.right = "auto"; panel.style.bottom = "auto";
    }
    var set = function (sel, label, icon) { var b = panel.querySelector(sel); if (!b) return; b.setAttribute("aria-label", label); b.setAttribute("data-tip", label); b.replaceChildren(svg(ICON[icon])); };
    set("[data-nav=lock]", ui.locked ? "Déverrouiller la position" : "Verrouiller la position", ui.locked ? "lock" : "unlock");
    set("[data-nav=dock]", dock ? "Détacher : panneau flottant" : "Ancrer dans l'espace de travail", dock ? "float" : "dock");
    set("[data-nav=min]", ui.min ? "Restaurer la taille" : "Réduire le panneau", ui.min ? "restore" : "min");
    set("[data-nav=max]", ui.max ? "Restaurer la taille précédente" : "Agrandir le panneau", ui.max ? "restore" : "max");
    panel.querySelector("[data-nav=lock]").setAttribute("aria-pressed", String(ui.locked)); panel.querySelector("[data-nav=lock]").hidden = dock;
    panel.querySelector("[data-nav=min]").hidden = dock; panel.querySelector("[data-nav=max]").hidden = dock;
    closeSections();
    requestAnimationFrame(fit);
  }
  function dragHead(e) {
    if (e.button !== 0 || e.target.closest("button") || ui.mode === "dock" || ui.locked || ui.max) return;
    var c = cbox(), r = panel.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top, id = e.pointerId, queued = false, cx = e.clientX, cy = e.clientY, head = e.currentTarget;
    try { head.setPointerCapture(id); } catch (x) { /* capture indisponible */ }
    var apply = function () { queued = false; ui.x = clamp(cx - c.left - ox, 0, c.width - r.width); ui.y = clamp(cy - c.top - oy, 0, c.height - r.height); panel.style.left = ui.x + "px"; panel.style.top = ui.y + "px"; };
    var move = function (ev) { if (ev.pointerId !== id) return; cx = ev.clientX; cy = ev.clientY; if (!queued) { queued = true; requestAnimationFrame(apply); } };
    var up = function (ev) { if (ev.pointerId !== id) return; head.removeEventListener("pointermove", move); head.removeEventListener("pointerup", up); head.removeEventListener("pointercancel", up); saveUi(); };
    head.addEventListener("pointermove", move); head.addEventListener("pointerup", up); head.addEventListener("pointercancel", up);
  }
  // Redimensionnement : 8 poignées (bords et coins) en mode flottant, bord gauche seul en mode ancré
  var DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
  function startResize(e, dir) {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    var c = cbox(), r = panel.getBoundingClientRect(), start = { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height }, sx = e.clientX, sy = e.clientY, id = e.pointerId, h0 = e.currentTarget, queued = false, cx = sx, cy = sy;
    try { h0.setPointerCapture(id); } catch (x) { /* capture indisponible */ }
    resizing = true; panel.classList.add("is-resizing");
    var apply = function () {
      queued = false;
      var dx = cx - sx, dy = cy - sy;
      if (ui.mode === "dock") { ui.dockW = clamp(Math.round(start.w - dx), MIN_W, Math.round(c.width * 0.6)); panel.parentNode.style.setProperty("--pb-nvs-dock-w", ui.dockW + "px"); fit(); return; }
      var x = start.x, y = start.y, w = start.w, h = start.h, maxW = c.width - 8, maxH = c.height - 8;
      if (dir.indexOf("e") >= 0) w = clamp(start.w + dx, MIN_W, Math.min(maxW, maxW - start.x));
      if (dir.indexOf("s") >= 0) h = clamp(start.h + dy, MIN_H, Math.min(maxH, maxH - start.y));
      if (dir.indexOf("w") >= 0) { w = clamp(start.w - dx, MIN_W, Math.min(maxW, start.x + start.w)); x = start.x + start.w - w; }
      if (dir.indexOf("n") >= 0) { h = clamp(start.h - dy, MIN_H, Math.min(maxH, start.y + start.h)); y = start.y + start.h - h; }
      ui.x = x; ui.y = y; ui.w = w; ui.h = h; ui.max = false; ui.min = false;
      panel.style.left = x + "px"; panel.style.top = y + "px"; panel.style.width = w + "px"; panel.style.height = h + "px";
      fit();
    };
    var move = function (ev) { if (ev.pointerId !== id) return; cx = ev.clientX; cy = ev.clientY; if (!queued) { queued = true; requestAnimationFrame(apply); } };
    var up = function (ev) { if (ev.pointerId !== id) return; h0.removeEventListener("pointermove", move); h0.removeEventListener("pointerup", up); h0.removeEventListener("pointercancel", up); resizing = false; panel.classList.remove("is-resizing"); saveUi(); applyLayout(); };
    h0.addEventListener("pointermove", move); h0.addEventListener("pointerup", up); h0.addEventListener("pointercancel", up);
  }

  // ---------- Construction du panneau ----------
  function build_panel() {
    var title = el("span", { class: "pb-nvs-title", id: "pb-nvs-title", text: "Navigateur" });
    var zoomOut = el("output", { class: "pb-nvs-zoom", "aria-live": "off" });
    var head = el("div", { class: "pb-nvs-head" }, title, zoomOut,
      btn("Verrouiller la position", "unlock", function () { ui.locked = !ui.locked; saveUi(); applyLayout(); }, "", { "data-nav": "lock", "aria-pressed": "false" }),
      btn("Ancrer dans l'espace de travail", "dock", function () { ui.mode = ui.mode === "dock" ? "float" : "dock"; ui.min = false; ui.max = false; saveUi(); applyLayout(); }, "", { "data-nav": "dock" }),
      btn("Réduire le panneau", "min", function () { ui.min = !ui.min; ui.max = false; saveUi(); applyLayout(); }, "", { "data-nav": "min" }),
      btn("Agrandir le panneau", "max", function () { if (ui.max) { ui.max = false; } else { ui.max = true; ui.min = false; } saveUi(); applyLayout(); }, "", { "data-nav": "max" }),
      btn("Fermer le Navigateur", "close", function () { toggle(false); }, "", { "data-nav": "close" }));
    head.addEventListener("pointerdown", dragHead);
    head.addEventListener("dblclick", function (e) { if (e.target.closest("button") || ui.mode === "dock") return; ui.min = !ui.min; ui.max = false; saveUi(); applyLayout(); });

    emptyEl = el("p", { class: "pb-nvs-empty", text: "Aperçu en cours…" });
    box = el("div", { class: "pb-nvs-thumbbox" });
    rectEl = el("div", { class: "pb-nvs-rect", "aria-hidden": "true" }); selEl = el("div", { class: "pb-nvs-sel", "aria-hidden": "true", hidden: "" });
    box.appendChild(selEl); box.appendChild(rectEl);
    view = el("div", { class: "pb-nvs-view", tabindex: "0", role: "slider", "aria-label": "Zone visible de la page : cliquez ou glissez dans la miniature, ou utilisez les flèches", "aria-orientation": "vertical", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" }, box, emptyEl);
    view.addEventListener("pointerdown", onDown); view.addEventListener("keydown", onKey); view.addEventListener("wheel", onWheel, { passive: false });
    view.addEventListener("auxclick", function (e) { if (e.button === 1) e.preventDefault(); });
    tzMinus = btn("Réduire l'aperçu (la page ne change pas)", "minus", function () { setTz(tz / 1.25); }, "pb-nvs-mini", { "data-nav": "tz-out" });
    tzPlus = btn("Agrandir l'aperçu (la page ne change pas)", "plus", function () { setTz(tz * 1.25); }, "pb-nvs-mini", { "data-nav": "tz-in" });
    tzOut = el("output", { class: "pb-nvs-tzval", "aria-live": "off", "data-tip": "Zoom de l'aperçu" });
    var tzFit = btn("Vue globale : ajuster l'aperçu", "fit", function () { tz = 1; fit(); view.scrollLeft = 0; view.scrollTop = 0; }, "pb-nvs-mini", { "data-nav": "tzfit" });
    var tzCenter = btn("Centrer l'aperçu sur la zone visible", "sel", function () { var vs = A.viewState(); if (!vs || !geom) return; var vr = view.getBoundingClientRect(), br = box.getBoundingClientRect(); view.scrollLeft += br.left - vr.left + (vs.x + vs.w / 2) * geom.k - vr.width / 2; view.scrollTop += br.top - vr.top + (vs.y + vs.h / 2) * geom.k - vr.height / 2; }, "pb-nvs-mini", { "data-nav": "tzcenter" });
    var resetBtn = btn("Rétablir la disposition par défaut du panneau", "reset", function () { ui = { mode: "float", x: null, y: null, w: DEF_W, h: DEF_H, locked: false, min: false, max: false, prev: null, adv: ui.adv, dockW: 280, recent: ui.recent }; saveUi(); applyLayout(); }, "pb-nvs-mini", { "data-nav": "reset" });
    var mini = el("div", { class: "pb-nvs-mini-bar", role: "group", "aria-label": "Zoom de l'aperçu" }, tzOut, tzMinus, tzPlus, tzCenter, tzFit, el("span", { class: "pb-nvs-sep", "aria-hidden": "true" }), resetBtn);
    ['pointerdown', 'wheel'].forEach(function (t) { mini.addEventListener(t, function (e) { e.stopPropagation(); }); });

    zoomInput = el("input", { class: "pb-nvs-zoom-input", type: "text", inputmode: "numeric", "aria-label": "Niveau de zoom du canevas en pourcentage (Entrée pour appliquer)", "data-tip": "Zoom du canevas : tapez un pourcentage (10 à 500)", size: "3", maxlength: "3" });
    zoomInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var n = parseFloat(zoomInput.value.replace(",", ".")); if (!isFinite(n)) return;
      A.rememberView(false); A.setZoom(clamp(n / 100, A.zoomMin, A.zoomMax), { animate: true }); zoomInput.blur();
    });
    zoomInput.addEventListener("blur", function () { placeRect(A.viewState()); });
    var presets = btn("Niveaux de zoom prédéfinis (10 % à 500 %)", "chevron", function (e) { var r = e.currentTarget.getBoundingClientRect(); A.openZoomMenu(r); }, "pb-nvs-presets");
    var grp = function () { var g = el("span", { class: "pb-nvs-grp", role: "group" }); for (var i = 0; i < arguments.length; i++) g.appendChild(arguments[i]); return g; };
    // Zoom du CANEVAS : − · pourcentage · + | ajustements
    var row1 = el("div", { class: "pb-nvs-row", role: "toolbar", "aria-label": "Zoom du canevas" },
      grp(btn("Zoom arrière", "minus", function () { A.rememberView(true); A.setZoom(A.zoomStep(-1), { animate: true }); }),
        el("span", { class: "pb-nvs-zoomwrap" }, zoomInput, el("span", { class: "pb-nvs-pct", text: "%", "aria-hidden": "true" }), presets),
        btn("Zoom avant", "plus", function () { A.rememberView(true); A.setZoom(A.zoomStep(1), { animate: true }); })),
      el("span", { class: "pb-nvs-sep", "aria-hidden": "true" }),
      grp(btn("Ajuster à la fenêtre : toute la page visible", "whole", function () { A.rememberView(false); A.showWholePage(); }, "", { "data-nav": "fit-window" }),
        btn("Ajuster à la largeur : la page remplit la largeur", "width", function () { A.fitWidthFill(); }, "", { "data-nav": "fit-width" }),
        btn("Ajuster à la hauteur : la section en cours remplit la hauteur", "height", function () { A.fitHeightSection(); }, "", { "data-nav": "fit-height" }),
        txtBtn("Affichage 100 %", "1:1", function () { A.rememberView(false); A.setZoom(1, { animate: true }); }),
        btn("Réinitialiser la position : centrer le document", "home", function () { A.rememberView(false); A.centerDocument(); }, "", { "data-nav": "pos-reset" })));
    histBack = btn("Vue précédente", "back", function () { A.viewBack(); }); histFwd = btn("Vue suivante", "fwd", function () { A.viewForward(); });
    var toolBtn = function (label, icon, tool) { return btn(label, icon, function () { A.setTool(A.tool() === tool ? "select" : tool); syncTools(); }, "pb-nvs-tool", { "data-nav-tool": tool }); };
    // Navigation : historique · début / milieu / fin · outils · sections
    secBtn = el("button", { type: "button", class: "pb-nvs-secbtn", "aria-haspopup": "listbox", "aria-expanded": "false", "data-tip": "Aller à une section : rechercher et choisir", "aria-label": "Aller à une section" }, svg(ICON.list, 14), el("span", { class: "pb-nvs-seclabel", text: "Sections" }), svg(ICON.chevron, 12));
    secBtn.addEventListener("click", function () { if (secOpen) closeSections(); else openSections(); });
    var row2 = el("div", { class: "pb-nvs-row", role: "toolbar", "aria-label": "Navigation" },
      grp(histBack, histFwd), el("span", { class: "pb-nvs-sep", "aria-hidden": "true" }),
      grp(btn("Aller au début de la page", "top", function () { A.goTo("start"); }), btn("Aller à la fin de la page", "end", function () { A.goTo("end"); })),
      el("span", { class: "pb-nvs-sep", "aria-hidden": "true" }),
      grp(toolBtn("Outil Main : déplacer le canevas (H)", "hand", "hand"), toolBtn("Zoom par zone (Z)", "area", "zoomarea"), btn("Zoom sur la sélection", "sel", function () { A.zoomToSelection(); }, "", { "data-nav": "zoom-sel" })),
      el("span", { class: "pb-nvs-grow", "aria-hidden": "true" }), secBtn);
    var body = el("div", { class: "pb-nvs-body" }, el("div", { class: "pb-nvs-vwrap" }, view, mini), el("div", { class: "pb-nvs-ctl" }, row1, row2));
    panel = el("div", { class: "pb-nvs", role: "group", "aria-labelledby": "pb-nvs-title", "data-pb-navigator-panel": "", hidden: "" }, head, body);
    DIRS.forEach(function (d) { var h = el("span", { class: "pb-nvs-rs pb-nvs-rs-" + d, "aria-hidden": "true" }); h.addEventListener("pointerdown", function (e) { startResize(e, d); }); panel.appendChild(h); });
    A.canvas().appendChild(panel);
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { if (open && !resizing) requestAnimationFrame(fit); }); ro.observe(view); }
  }
  function syncTools() { if (!panel) return; Array.prototype.forEach.call(panel.querySelectorAll("[data-nav-tool]"), function (b) { b.setAttribute("aria-pressed", String(A.tool() === b.getAttribute("data-nav-tool"))); }); }
  // ---------- Sections : recherche, liste, récentes ----------
  function buildSecPop() {
    secSearch = el("input", { class: "pb-nvs-secsearch", type: "text", role: "combobox", "aria-expanded": "true", "aria-controls": "pb-nvs-seclist", "aria-autocomplete": "list", placeholder: "Rechercher une section", "aria-label": "Rechercher une section", autocomplete: "off" });
    secList = el("div", { class: "pb-nvs-seclist", id: "pb-nvs-seclist", role: "listbox", "aria-label": "Sections de la page" });
    secPop = el("div", { class: "pb-nvs-secpop", hidden: "" }, el("div", { class: "pb-nvs-secsearchwrap" }, svg(ICON.search, 13), secSearch), secList);
    secSearch.addEventListener("input", function () { renderSections(); });
    secSearch.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { secActive = Math.min(secItems.length - 1, secActive + 1); markActive(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { secActive = Math.max(0, secActive - 1); markActive(); e.preventDefault(); }
      else if (e.key === "Enter") { if (secItems[secActive]) pickSection(secItems[secActive].id); e.preventDefault(); }
      else if (e.key === "Escape") { closeSections(); secBtn.focus(); e.preventDefault(); e.stopPropagation(); }
    });
    secList.addEventListener("click", function (e) { var o = e.target.closest("[data-sec]"); if (o) pickSection(o.getAttribute("data-sec")); });
    secList.addEventListener("pointermove", function (e) { var o = e.target.closest("[data-sec]"); if (o) { var i = secItems.findIndex(function (x) { return x.id === o.getAttribute("data-sec"); }); if (i >= 0 && i !== secActive) { secActive = i; markActive(); } } });
    panel.appendChild(secPop);
  }
  function renderSections() {
    var q = secSearch.value.trim().toLowerCase(), all = A.sections(), rec = (ui.recent || []).map(function (id) { return all.find(function (s) { return s.id === id; }); }).filter(Boolean);
    var hit = function (s) { return !q || s.name.toLowerCase().indexOf(q) >= 0; };
    secItems = []; secList.textContent = "";
    var group = function (label, arr) { if (!arr.length) return; if (label) secList.appendChild(el("div", { class: "pb-nvs-secgrp", role: "presentation", text: label })); arr.forEach(function (s) { secItems.push(s); secList.appendChild(el("div", { class: "pb-nvs-secitem", role: "option", id: "pb-nvs-sec-" + secItems.length, "data-sec": s.id, text: s.name })); }); };
    if (!q) group("Récentes", rec.filter(hit));
    group(!q && rec.length ? "Toutes les sections" : "", all.filter(hit));
    if (!secItems.length) secList.appendChild(el("div", { class: "pb-nvs-secnone", text: all.length ? "Aucune section ne correspond" : "Cette page n'a pas encore de section" }));
    secActive = 0; markActive();
  }
  function markActive() {
    Array.prototype.forEach.call(secList.querySelectorAll("[data-sec]"), function (n, i) { n.classList.toggle("is-active", i === secActive); n.setAttribute("aria-selected", String(i === secActive)); if (i === secActive) { secSearch.setAttribute("aria-activedescendant", n.id); n.scrollIntoView({ block: "nearest" }); } });
  }
  function pickSection(id) {
    ui.recent = [id].concat((ui.recent || []).filter(function (x) { return x !== id; })).slice(0, 4); saveUi();
    closeSections(); A.rememberView(false); A.goToSection(id);
  }
  function openSections() {
    if (!secPop) buildSecPop();
    secOpen = true; secBtn.setAttribute("aria-expanded", "true"); secSearch.value = ""; renderSections();
    secPop.hidden = false; requestAnimationFrame(function () { secPop.classList.add("is-open"); });
    secSearch.focus({ preventScroll: true });
    setTimeout(function () { document.addEventListener("pointerdown", outside, true); }, 0);
  }
  function outside(e) { if (secPop && !secPop.contains(e.target) && !secBtn.contains(e.target)) closeSections(); }
  function closeSections() {
    if (!secOpen) return;
    secOpen = false; secBtn.setAttribute("aria-expanded", "false"); secPop.classList.remove("is-open"); secPop.hidden = true;
    document.removeEventListener("pointerdown", outside, true);
  }
  function fillSections() { if (secOpen) renderSections(); }

  // ---------- Ouverture / fermeture ----------
  function toggle(next) {
    if (next === undefined) next = !open;
    if (next === open) return;
    var b = document.querySelector("[data-pb-navigator]");
    if (next) {
      if (!panel) build_panel();
      loadUi(); open = true; panel.hidden = false; applyLayout(); fillSections(); syncTools();
      unsub = A.subscribe(function () { sync(); syncTools(); }); unsubContent = A.subscribeContent(function () { if (open) { schedule(500); fillSections(); } });
      A.window.addEventListener("resize", onWin);
      requestAnimationFrame(function () { panel.classList.add("is-open"); build(); placeRect(A.viewState()); });
    } else {
      closeSections(); tz = 1; open = false; panel.classList.remove("is-open"); seq++;
      if (unsub) unsub(); unsub = null; if (unsubContent) unsubContent(); unsubContent = null; clearTimeout(refreshTimer);
      A.window.removeEventListener("resize", onWin);
      A.canvas().classList.remove("has-nav-dock"); A.canvas().style.setProperty("--pb-nvs-dock-w", "0px");
      if (frameEl) { frameEl.remove(); frameEl = null; } if (building) { building.remove(); building = null; }   // la mémoire de l'aperçu est rendue
      geom = null;
      var done = function () { if (!open && panel) panel.hidden = true; };
      var dur = parseFloat(getComputedStyle(panel).transitionDuration) * 1000;
      if (dur > 1) setTimeout(done, dur + 20); else done();
    }
    if (b) { b.setAttribute("aria-expanded", String(open)); b.setAttribute("aria-pressed", String(open)); }
    if (open) setTimeout(function () { if (view) view.focus({ preventScroll: true }); }, 0);
  }
  function onWin() { if (open) { applyLayout(); sync(); } }
  root.pbNavigator = {
    attach: function (api) { A = api; return root.pbNavigator; },
    toggle: toggle, isOpen: function () { return open; },
    geometry: function () { return geom ? { k: geom.k, w: geom.w, h: geom.h } : null; },
    state: function () { return { mode: ui.mode, locked: ui.locked, min: ui.min, max: ui.max, w: ui.w, h: ui.h, x: ui.x, y: ui.y, frame: Boolean(frameEl) }; }
  };
})(window);
