// Page Builder — TIMELINE VISUELLE du Motion Studio (lot 3) : scènes multi-éléments, transitions de page / de sections, défilement fluide.
// Chargé AVANT page-builder.js (qui lui confie ses fonctions internes par attach), après public/js/motion-studio/scenes-core.js (calcul des départs, partagé avec le serveur
// et la page publique). Affiché dans les réglages de la PAGE (aucun élément sélectionné) : « Scènes et mouvement ».
//
// Modèle : theme.motionScenes (src/marketing/pages/motionScenes.js) — { v:1, scenes:[{ id, name, trigger, anchor, repeat, scrub, off, steps:[{ id, target, effect, at, duration,
// delay, easing, sync, after }] }], pageTransition, sectionTransition, smoothScroll }. Toute modification passe par change() : annuler / rétablir, enregistrement automatique,
// brouillon / publication / historique. La lecture pilote le runtime du canevas (iframe.contentWindow.kwMotionStudio.scenes) avec le contenu en cours d'édition.
(function () {
  "use strict";
  var A = null, seq = 0, sel = { scene: null, step: null }, PX = 90 /* pixels par seconde */, poll = 0, raf = 0, dragging = false;
  var uid = function () { return "pb-tl-" + (++seq); };
  function attach(api) { A = api; }
  var core = function () { return window.KWMSScenes || null; };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var newId = function () { var s = ""; while (s.length < 8) s += Math.random().toString(36).slice(2); return s.slice(0, 8); };
  var SCREENS = ["desktop", "tablet", "mobile"];
  var KIND = { "in": "entrée", out: "sortie", emph: "accent" };

  // ---------- Modèle ----------
  function model() { var t = A.content().theme; return (t && t.motionScenes) || null; }
  function scenes() { var m = model(); return (m && m.scenes) || []; }
  function sceneById(id) { return scenes().filter(function (s) { return s.id === id; })[0] || null; }
  function curScene() { var s = sceneById(sel.scene); if (!s && scenes().length) { s = scenes()[0]; sel.scene = s.id; } return s; }
  function stepOf(scene, id) { return ((scene && scene.steps) || []).filter(function (x) { return x.id === id; })[0] || null; }
  // Modifie theme.motionScenes dans UNE étape annulable ; le résultat vide retire la clé. Arrête l'aperçu en cours (le contenu change).
  function mutate(label, fn, opts) {
    stopPreview(true);
    A.change(function () {
      var c = A.content(); c.theme = Object.assign({}, c.theme);
      var m = c.theme.motionScenes ? clone(c.theme.motionScenes) : { v: 1 };
      m.v = 1; fn(m);
      if (m.scenes && !m.scenes.length) delete m.scenes;
      ["pageTransition", "sectionTransition", "smoothScroll"].forEach(function (k) { if (m[k] === undefined || m[k] === null) delete m[k]; });
      if (Object.keys(m).length <= 1) delete c.theme.motionScenes; else c.theme.motionScenes = m;
    }, { label: label, key: opts && opts.key, light: true });
    ui.sig = JSON.stringify(model()); // modification faite ICI : la veille ne doit pas la prendre pour un changement extérieur
  }
  function sceneMut(label, fn, opts) { mutate(label, function (m) { var s = (m.scenes || []).filter(function (x) { return x.id === sel.scene; })[0]; if (s) fn(s, m); }, opts); }
  function drop(o, k, empty) { if (o[k] === undefined || o[k] === "" || o[k] === null || o[k] === empty) delete o[k]; }

  // ---------- Éléments de la page ----------
  function typeLabel(t) { var x = A.SPEC.types.filter(function (y) { return y.type === t; })[0]; return x ? x.label : t; }
  function nodes() {
    var out = [];
    (function walk(list, depth) {
      (list || []).forEach(function (n) {
        if (!n || !n.id) return;
        var p = n.props || {}, txt = String(n.name || p.text || p.label || p.title || p.heading || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 28);
        out.push({ id: n.id, label: typeLabel(n.type) + (txt ? " — " + txt : "") });
        walk(n.children, depth + 1);
      });
    })((A.content().sections || []).filter(function (s) { return s && s.type === "layout"; }).reduce(function (a, s) { return a.concat(s.children || []); }, []), 0);
    return out;
  }
  function nodeLabel(list, id) { var f = list.filter(function (n) { return n.id === id; })[0]; return f ? f.label : null; }

  // ---------- Aperçu dans le canevas ----------
  function frameWin() { try { var f = A.frame(); return f && f.contentWindow ? f.contentWindow : null; } catch (e) { return null; } }
  function runtime() { var w = frameWin(); return w && w.kwMotionStudio && w.kwMotionStudio.scenes ? w.kwMotionStudio : null; }
  // Le canevas n'emporte le runtime que si la page contient du mouvement : on l'ajoute au besoin (même fichier que la page publique)
  function ensureRuntime() {
    return new Promise(function (resolve) {
      var r = runtime(); if (r) return resolve(r);
      var w = frameWin(); if (!w || !w.document || !w.document.body) return resolve(null);
      var s = w.document.createElement("script"); s.src = "/js/kw-motion-studio.js";
      s.onload = function () { var t = 0; (function wait() { var rr = runtime(); if (rr || ++t > 40) resolve(rr); else setTimeout(wait, 50); })(); };
      s.onerror = function () { resolve(null); };
      w.document.head.appendChild(s);
    });
  }
  function previewing(fn) {
    return ensureRuntime().then(function (r) {
      if (!r) { A.toast("Aperçu indisponible : attendez la fin du chargement de la page.", true); return false; }
      r.scenes.set(clone(model() || { v: 1 }));
      return fn(r.scenes);
    });
  }
  function stopPreview(quiet) { var r = runtime(), id = sel.scene; if (r && id) { try { r.scenes.stop(id); } catch (e) { /* canevas en cours de remplacement */ } } if (!quiet) refreshTransport(); }

  // ---------- Interface ----------
  var ui = { wrap: null, lane: null, head: null, time: null, playhead: null, sig: "" };

  function field(label, control, hint) { var h = A.h; return h("div", { class: "pb-field" }, h("label", { text: label }), control, hint ? h("p", { class: "pb-hint", text: hint }) : null); }
  function numInput(value, o, onCommit) {
    var i = A.h("input", { type: "number", min: String(o.min), max: String(o.max), step: String(o.step || 1), "data-tl": o.name || null, "aria-label": o.label || null });
    i.value = value === undefined || value === null ? "" : value; i.disabled = !A.canWrite();
    i.addEventListener("change", function () {
      var raw = i.value.trim();
      if (raw === "") { onCommit(null); return; }
      var n = Math.round(Number(raw)); if (!isFinite(n)) { i.value = value; return; }
      onCommit(clamp(n, o.min, o.max));
    });
    return i;
  }
  function numField(label, value, o, onCommit, hint) { o.label = label; var id = uid(), i = numInput(value, o, onCommit); i.id = id; return A.h("div", { class: "pb-field" }, A.h("label", { for: id, text: label }), i, hint ? A.h("p", { class: "pb-hint", text: hint }) : null); }
  function textInput(label, value, max, onCommit, name) {
    var h = A.h, id = uid(), i = h("input", { type: "text", id: id, maxlength: String(max), "data-tl": name || null });
    i.value = value || ""; i.disabled = !A.canWrite();
    i.addEventListener("change", function () { onCommit(i.value.trim()); });
    return h("div", { class: "pb-field" }, h("label", { for: id, text: label }), i);
  }
  function btn(label, act, fn, o) {
    o = o || {};
    return A.h("button", { type: "button", class: "btn " + (o.primary ? "btn-primary" : "btn-outline") + " btn-sm", "data-tl-act": act, disabled: o.disabled || null, title: o.tip || null, "aria-label": o.aria || null, onclick: fn }, label);
  }
  var sc = function () { return core(); };
  function fmt(ms) { return (ms / 1000).toFixed(2).replace(".", ",") + " s"; }

  // ----- Barre d'outils de lecture -----
  function transport(scene) {
    var h = A.h, none = !scene || !scene.steps.length;
    ui.time = h("span", { class: "pb-tl-time", "data-tl-time": "", "aria-live": "off", text: "0,00 s" });
    var bar = h("div", { class: "pb-row pb-wrap pb-tl-transport", role: "group", "aria-label": "Lecture de la scène" },
      btn("Lire", "play", function () { startPlay(); }, { disabled: none, tip: "Joue la scène sur la page" }),
      btn("Pause", "pause", function () { var r = runtime(); if (r) r.scenes.pause(sel.scene); refreshTransport(); }, { disabled: none }),
      btn("Reprendre", "resume", function () { var r = runtime(); if (r) r.scenes.resume(sel.scene); loop(); }, { disabled: none }),
      btn("Arrêter", "stop", function () { stopPreview(); paintHead(0); }, { disabled: none, tip: "Rend la page à son état normal" }),
      ui.time);
    return bar;
  }
  function startPlay() { previewing(function (s) { return s.play(sel.scene); }).then(function (ok) { if (ok) loop(); }); }
  function refreshTransport() { paintHead(readTime()); }
  function readTime() { var r = runtime(); return r && sel.scene ? r.scenes.time(sel.scene) : 0; }
  function loop() {
    cancelAnimationFrame(raf);
    var tick = function () {
      if (!ui.wrap || !ui.wrap.isConnected) return;
      var r = runtime(), st = r && sel.scene ? r.scenes.state(sel.scene) : "idle";
      paintHead(readTime());
      if (st === "running") raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function paintHead(ms) {
    if (ui.time) ui.time.textContent = fmt(ms).replace(" s", " s");
    if (ui.playhead) ui.playhead.style.left = Math.round(ms * PX / 1000) + "px";
  }

  // ----- Piste, barres, règle -----
  function trackOrder(scene) { var seen = {}, out = []; scene.steps.forEach(function (s) { if (!seen[s.target]) { seen[s.target] = true; out.push(s.target); } }); return out; }
  function laneWidth(total) { return Math.max(360, Math.ceil((total + 1500) * PX / 1000)); }
  function ruler(total, width) {
    var h = A.h, r = h("div", { class: "pb-tl-ruler", "data-tl-ruler": "", style: "width:" + width + "px", title: "Cliquer pour placer la tête de lecture" });
    var stepMs = PX >= 160 ? 250 : PX >= 70 ? 500 : 1000;
    for (var t = 0; t * stepMs <= width * 1000 / PX; t++) r.appendChild(h("span", { class: "pb-tl-tick" + (t % (1000 / stepMs) === 0 ? " is-major" : ""), style: "left:" + Math.round(t * stepMs * PX / 1000) + "px", text: t % (1000 / stepMs) === 0 ? (t * stepMs / 1000) + " s" : "" }));
    var seek = function (e) {
      var rect = r.getBoundingClientRect(), ms = clamp(Math.round((e.clientX - rect.left) * 1000 / PX), 0, Math.max(total, 0));
      previewing(function (s) { return s.seek(sel.scene, ms); }).then(function () { paintHead(ms); });
    };
    r.addEventListener("pointerdown", function (e) { if (!scene0().steps.length) return; r.setPointerCapture(e.pointerId); seek(e); r.onpointermove = seek; r.onpointerup = function () { r.onpointermove = null; r.onpointerup = null; }; });
    return r;
  }
  function scene0() { return curScene() || { steps: [] }; }

  function bar(scene, item, list) {
    var h = A.h, s = item.step, miss = !nodeLabel(list, s.target);
    var b = h("button", { type: "button", class: "pb-tl-bar kind-" + (sc().EFFECTS[s.effect] || sc().EFFECTS["fade-in"]).kind + (sel.step === s.id ? " is-selected" : "") + (miss ? " is-missing" : "") + (item.link ? " is-linked" : ""),
      "data-tl-step": s.id, "data-tl-start": String(item.start), "data-tl-dur": String(s.duration), "aria-label": (sc().EFFECTS[s.effect] || {}).label + ", début " + fmt(item.start) + ", durée " + fmt(s.duration) + (miss ? ", élément supprimé" : "") });
    b.appendChild(h("span", { class: "pb-tl-bar-label", text: (sc().EFFECTS[s.effect] || {}).label || s.effect }));
    var grip = h("span", { class: "pb-tl-grip", "data-tl-grip": "", "aria-hidden": "true" });
    b.appendChild(grip);
    place(b, item);
    b.addEventListener("click", function () { sel.step = s.id; draw(); });
    b.addEventListener("keydown", function (e) {
      if (!A.canWrite()) return;
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); nudge(s.id, d * (e.shiftKey ? 500 : 50)); }
      else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeStep(s.id); }
    });
    if (A.canWrite()) drag(b, grip, scene, s);
    return b;
  }
  function place(b, item) { b.style.left = Math.round(item.start * PX / 1000) + "px"; b.style.width = Math.max(14, Math.round(item.step.duration * PX / 1000)) + "px"; b.setAttribute("data-tl-start", String(item.start)); b.setAttribute("data-tl-dur", String(item.step.duration)); }
  // Positions de toutes les barres recalculées sans reconstruire le DOM (un lien sync / après déplace aussi les pas liés)
  function repaint() {
    var scene = curScene(); if (!scene || !ui.lane) return;
    var r = sc().resolve(scene);
    r.items.forEach(function (it) { var b = ui.lane.querySelector('[data-tl-step="' + it.id + '"]'); if (b) place(b, it); });
    var w = laneWidth(r.total);
    ui.lane.querySelectorAll(".pb-tl-lane,.pb-tl-ruler").forEach(function (l) { l.style.width = w + "px"; });
  }
  function nudge(id, delta) {
    var scene = curScene(), s = stepOf(scene, id), it = sc().resolve(scene).items.filter(function (x) { return x.id === id; })[0]; if (!s || !it) return;
    var key = it.link ? "delay" : "at", cur = it.link ? (s.delay || 0) : (s.at || 0), lim = sc().LIMITS[key];
    sceneMut("Déplacer un pas", function (sn) { var x = stepOf(sn, id); x[key] = clamp(cur + delta, lim[0], lim[1]); drop(x, key, 0); }, { key: "ms-tl-" + id });
    repaint(); var b = ui.lane.querySelector('[data-tl-step="' + id + '"]'); if (b) b.focus(); syncFields();
  }
  // Glisser une barre : déplacement (début, ou délai si le pas est lié) · poignée de droite : durée. Pas de 50 ms ; Alt = libre.
  function drag(b, grip, scene, s) {
    b.addEventListener("pointerdown", function (e) {
      if (e.button) return;
      var resize = e.target === grip, x0 = e.clientX, cur = stepOf(curScene(), s.id), it = sc().resolve(curScene()).items.filter(function (x) { return x.id === s.id; })[0];
      var key = resize ? "duration" : it.link ? "delay" : "at", v0 = resize ? (cur.duration || 600) : key === "delay" ? (cur.delay || 0) : (cur.at || 0), lim = sc().LIMITS[key], moved = false;
      b.classList.add("is-dragging"); dragging = true;
      var move = function (ev) {
        var dms = (ev.clientX - x0) * 1000 / PX; if (Math.abs(ev.clientX - x0) > 3) moved = true;
        if (!moved) return;
        var v = v0 + dms; if (!ev.altKey) v = Math.round(v / 50) * 50;
        v = clamp(Math.round(v), lim[0], lim[1]);
        sceneMut(resize ? "Durée d'un pas" : "Déplacer un pas", function (sn) { var x = stepOf(sn, s.id); x[key] = v; drop(x, key, key === "duration" ? 600 : 0); }, { key: "ms-tl-" + s.id + key });
        repaint();
      };
      // Écouteurs sur le document : le geste continue même si le panneau est redessiné pendant le glissement
      var up = function () { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up); dragging = false; b.classList.remove("is-dragging"); if (moved) { sel.step = s.id; draw(); } };
      document.addEventListener("pointermove", move); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
    });
  }

  function trackRow(scene, target, list, items) {
    var h = A.h, label = nodeLabel(list, target), order = trackOrder(scene), idx = order.indexOf(target);
    var head = h("div", { class: "pb-tl-track-head", "data-tl-track": target },
      h("span", { class: "pb-tl-track-name" + (label ? "" : " is-missing"), title: label || "Élément supprimé", text: label || "Élément supprimé" }),
      h("span", { class: "pb-tl-track-tools" },
        btn("↑", "track-up", function () { moveTrack(target, -1); }, { disabled: idx === 0 || !A.canWrite(), aria: "Monter la piste", tip: "Monter la piste" }),
        btn("↓", "track-down", function () { moveTrack(target, 1); }, { disabled: idx === order.length - 1 || !A.canWrite(), aria: "Descendre la piste", tip: "Descendre la piste" }),
        btn("+", "track-add", function () { addSteps([target], 0, "Ajouter un pas"); }, { disabled: !A.canWrite() || !label, aria: "Ajouter un pas sur cette piste", tip: "Ajouter un pas sur cette piste" })));
    var lane = h("div", { class: "pb-tl-lane", role: "group", "aria-label": "Piste : " + (label || "élément supprimé") });
    items.filter(function (it) { return it.step.target === target; }).forEach(function (it) { lane.appendChild(bar(scene, it, list)); });
    return { head: head, lane: lane };
  }
  function timeline(scene, list) {
    var h = A.h, r = sc().resolve(scene), width = laneWidth(r.total);
    var heads = h("div", { class: "pb-tl-heads" }, h("div", { class: "pb-tl-corner", text: "Pistes" }));
    var lanes = h("div", { class: "pb-tl-lanes", style: "width:" + width + "px" }), rul = ruler(r.total, width);
    lanes.appendChild(rul);
    var play = h("div", { class: "pb-tl-playhead", "data-tl-playhead": "", "aria-hidden": "true" });
    ui.playhead = play;
    var order = trackOrder(scene);
    order.forEach(function (t) { var row = trackRow(scene, t, list, r.items); heads.appendChild(row.head); lanes.appendChild(row.lane); });
    if (!order.length) lanes.appendChild(h("p", { class: "pb-hint pb-tl-empty", text: "Aucun pas : choisissez un élément ci-dessous (ou sélectionnez-le dans la page) puis « Ajouter ». Chaque élément a sa piste." }));
    lanes.appendChild(play);
    var scroller = h("div", { class: "pb-tl-scroll", tabindex: "0", "aria-label": "Timeline de la scène (défiler horizontalement)" }, lanes);
    ui.lane = lanes;
    return h("div", { class: "pb-tl-board", "data-tl-board": "" }, heads, scroller);
  }

  // ----- Opérations -----
  function addSteps(targets, stagger, label) {
    var made = [];
    sceneMut(label || "Ajouter un pas", function (sn) {
      sn.steps = sn.steps || [];
      var first = null;
      targets.forEach(function (t, i) {
        if (sn.steps.length >= sc().LIMITS.steps) return;
        var st = { id: newId(), target: t, effect: "fade-in" };
        if (first) { st.sync = first; if (stagger) st.delay = stagger * i; } else first = st.id;
        sn.steps.push(st); made.push(st.id);
      });
    });
    if (made.length) sel.step = made[0];
    draw();
    if (!made.length) A.toast("Une scène contient 40 pas au plus.", true);
  }
  function removeStep(id) {
    sceneMut("Supprimer un pas", function (sn) {
      sn.steps = sn.steps.filter(function (x) { return x.id !== id; });
      sn.steps.forEach(function (x) { if (x.sync === id) delete x.sync; if (x.after === id) delete x.after; });
    });
    if (sel.step === id) sel.step = null;
    draw();
  }
  function moveStep(id, dir) {
    sceneMut("Réordonner les pas", function (sn) {
      var s = stepOf(sn, id), i = sn.steps.indexOf(s), j = i;
      // voisin de la MÊME piste dans la direction demandée
      for (var k = i + dir; k >= 0 && k < sn.steps.length; k += dir) if (sn.steps[k].target === s.target) { j = k; break; }
      if (j !== i) { sn.steps[i] = sn.steps[j]; sn.steps[j] = s; }
    });
    draw();
  }
  function moveTrack(target, dir) {
    sceneMut("Réordonner les pistes", function (sn) {
      var order = trackOrder(sn), i = order.indexOf(target), j = i + dir;
      if (j < 0 || j >= order.length) return;
      order[i] = order[j]; order[j] = target;
      sn.steps = order.reduce(function (acc, t) { return acc.concat(sn.steps.filter(function (x) { return x.target === t; })); }, []);
    });
    draw();
  }
  function duplicateStep(id) {
    var nid = newId();
    sceneMut("Dupliquer un pas", function (sn) {
      var s = stepOf(sn, id); if (!s || sn.steps.length >= sc().LIMITS.steps) return;
      var c = clone(s); c.id = nid; c.at = Math.min(30000, (c.at || 0) + 200); sn.steps.splice(sn.steps.indexOf(s) + 1, 0, c);
    });
    sel.step = nid; draw();
  }

  // ----- Réglages d'un pas -----
  var fieldRefs = {};
  function syncFields() { var scene = curScene(), s = stepOf(scene, sel.step); if (!s || !fieldRefs.at) return; fieldRefs.at.value = s.at || 0; fieldRefs.delay.value = s.delay || 0; fieldRefs.duration.value = s.duration || 600; }
  function stepEditor(scene, list) {
    var h = A.h, s = stepOf(scene, sel.step), ro = !A.canWrite();
    if (!s) return h("p", { class: "pb-hint", "data-tl-step-hint": "", text: scene.steps.length ? "Sélectionnez un pas dans la timeline pour régler son effet, sa durée, son délai et sa courbe." : "" });
    var set = function (label, fn, key) { sceneMut(label, function (sn) { var x = stepOf(sn, s.id); fn(x, sn); }, key ? { key: "ms-tl-" + s.id + key } : undefined); repaint(); };
    var it = sc().resolve(scene).items.filter(function (x) { return x.id === s.id; })[0], linked = Boolean(it && it.link);
    var box = h("div", { class: "pb-tl-step", "data-tl-step-editor": "" });
    var tOpts = list.map(function (n) { return [n.id, n.label]; });
    if (!nodeLabel(list, s.target)) tOpts.unshift([s.target, "Élément supprimé"]);
    box.appendChild(A.selectField("Élément animé", s.target, tOpts, function (v) { set("Élément d'un pas", function (x) { x.target = v; }); draw(); }, { disabled: ro }));
    var eOpts = Object.keys(sc().EFFECTS).map(function (k) { return [k, sc().EFFECTS[k].label + " (" + KIND[sc().EFFECTS[k].kind] + ")"]; });
    box.appendChild(A.selectField("Effet", s.effect || "fade-in", eOpts, function (v) { set("Effet d'un pas", function (x) { x.effect = v; drop(x, "effect", "fade-in"); }); draw(); }, { disabled: ro }));
    fieldRefs.at = numInput(s.at || 0, { min: 0, max: 30000, step: 50, label: "Début (ms)", name: "at" }, function (n) { set("Début d'un pas", function (x) { x.at = n === null ? 0 : n; drop(x, "at", 0); }); draw(); });
    fieldRefs.delay = numInput(s.delay || 0, { min: 0, max: 10000, step: 50, label: "Délai (ms)", name: "delay" }, function (n) { set("Délai d'un pas", function (x) { x.delay = n === null ? 0 : n; drop(x, "delay", 0); }); draw(); });
    fieldRefs.duration = numInput(s.duration || 600, { min: 50, max: 10000, step: 50, label: "Durée (ms)", name: "duration" }, function (n) { set("Durée d'un pas", function (x) { x.duration = n === null ? 600 : n; drop(x, "duration", 600); }); draw(); });
    var ids = [uid(), uid(), uid()];
    var row = h("div", { class: "pb-tl-nums" });
    [["Début (ms)", fieldRefs.at, ids[0], linked ? "Inutilisé : ce pas suit un autre pas" : null], ["Délai (ms)", fieldRefs.delay, ids[1], null], ["Durée (ms)", fieldRefs.duration, ids[2], null]].forEach(function (f) {
      f[1].id = f[2]; if (f[3] && f[1] === fieldRefs.at) f[1].disabled = true;
      row.appendChild(h("div", { class: "pb-field" }, h("label", { for: f[2], text: f[0] }), f[1], f[3] ? h("p", { class: "pb-hint", text: f[3] }) : null));
    });
    box.appendChild(row);
    var easing = s.easing || "smooth", eas = A.SPEC.motionStudio.easings.slice(), named = eas.indexOf(easing) >= 0;
    var eaOpts = eas.map(function (e) { return [e, ({ smooth: "Douce (par défaut)", linear: "Constante", ease: "Standard", "ease-in": "Accélère", "ease-out": "Ralentit à la fin", "ease-in-out": "Accélère puis ralentit", spring: "Ressort" })[e] || e]; });
    if (!named) eaOpts.push([easing, "Personnalisée"]);
    box.appendChild(A.selectField("Courbe d'accélération", easing, eaOpts, function (v) { set("Courbe d'un pas", function (x) { x.easing = v; drop(x, "easing", "smooth"); }); draw(); }, { disabled: ro }));
    var cid = uid(), ci = h("input", { type: "text", id: cid, placeholder: "cubic-bezier(0.2, 0.7, 0.2, 1)", "data-tl": "bezier", disabled: ro || null });
    ci.value = named ? "" : easing;
    ci.addEventListener("change", function () {
      var v = ci.value.trim(); if (!v) return;
      var m = /^cubic-bezier\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)$/.exec(v);
      var ok = m && +m[1] >= 0 && +m[1] <= 1 && +m[3] >= 0 && +m[3] <= 1 && +m[2] >= -3 && +m[2] <= 3 && +m[4] >= -3 && +m[4] <= 3;
      if (!ok) { A.toast("Courbe personnalisée : cubic-bezier(a, b, c, d) avec a et c entre 0 et 1, b et d entre -3 et 3.", true); ci.value = named ? "" : easing; return; }
      set("Courbe d'un pas", function (x) { x.easing = "cubic-bezier(" + [m[1], m[2], m[3], m[4]].map(Number).join(", ") + ")"; }); draw();
    });
    box.appendChild(h("div", { class: "pb-field" }, h("label", { for: cid, text: "Courbe personnalisée (facultatif)" }), ci));
    // Synchronisation : même départ qu'un autre pas, ou à la suite d'un autre pas (les liens suivent les déplacements)
    var lab = function (x) { var i = scene.steps.indexOf(x) + 1; return "Pas " + i + " — " + (nodeLabel(list, x.target) || "élément supprimé") + " (" + ((sc().EFFECTS[x.effect || "fade-in"] || {}).label || "") + ")"; };
    var sOpts = [["", "Aucune (instant choisi ci-dessus)"]];
    scene.steps.forEach(function (x) { if (x.id !== s.id) { sOpts.push(["sync:" + x.id, "Même début que : " + lab(x)]); } });
    scene.steps.forEach(function (x) { if (x.id !== s.id) { sOpts.push(["after:" + x.id, "À la suite de : " + lab(x)]); } });
    var curSync = s.sync ? "sync:" + s.sync : s.after ? "after:" + s.after : "";
    box.appendChild(A.selectField("Synchronisation", curSync, sOpts, function (v) {
      var before = scene.steps.map(function (x) { return x.id; });
      var trial = clone(scene.steps); var t = trial.filter(function (x) { return x.id === s.id; })[0]; delete t.sync; delete t.after;
      if (v) t[v.split(":")[0]] = v.split(":")[1];
      if (sc().cycles(trial).length) { A.toast("Ce lien créerait une boucle (deux pas qui dépendent l'un de l'autre).", true); draw(); return; }
      set("Synchronisation d'un pas", function (x) { delete x.sync; delete x.after; if (v) x[v.split(":")[0]] = v.split(":")[1]; });
      void before; draw();
    }, { disabled: ro, hint: "« Même début » aligne plusieurs éléments sur le même départ ; « À la suite » enchaîne. Le délai s'ajoute." }));
    box.appendChild(h("div", { class: "pb-row pb-wrap" },
      btn("Monter", "step-up", function () { moveStep(s.id, -1); }, { disabled: ro, tip: "Remonte le pas dans sa piste (un pas plus bas l'emporte quand deux pas se chevauchent)" }),
      btn("Descendre", "step-down", function () { moveStep(s.id, 1); }, { disabled: ro }),
      btn("Dupliquer", "step-dup", function () { duplicateStep(s.id); }, { disabled: ro }),
      btn("Supprimer le pas", "step-del", function () { removeStep(s.id); }, { disabled: ro })));
    return box;
  }

  // ----- Réglages d'une scène -----
  function sceneSettings(scene, list) {
    var h = A.h, ro = !A.canWrite(), box = h("div", { class: "pb-tl-scene", "data-tl-scene-settings": "" });
    box.appendChild(textInput("Nom de la scène", scene.name || "", 60, function (v) { sceneMut("Nom de la scène", function (sn) { if (v) sn.name = v; else delete sn.name; }); draw(); }, "scene-name"));
    var tr = scene.trigger || "viewport";
    box.appendChild(A.selectField("Déclencheur", tr, sc().TRIGGERS ? Object.keys(sc().TRIGGERS).map(function (k) { return [k, sc().TRIGGERS[k]]; }) : [], function (v) { sceneMut("Déclencheur de la scène", function (sn) { sn.trigger = v; drop(sn, "trigger", "viewport"); if (v !== "viewport") delete sn.repeat; if (v !== "scroll") delete sn.scrub; }); draw(); }, { disabled: ro }));
    if (tr !== "load") {
      var aOpts = [["", "Le premier élément de la scène"]].concat(list.map(function (n) { return [n.id, n.label]; }));
      box.appendChild(A.selectField(tr === "click" ? "Élément cliqué" : "Élément observé", scene.anchor || "", aOpts, function (v) { sceneMut("Élément déclencheur", function (sn) { if (v) sn.anchor = v; else delete sn.anchor; }); draw(); }, { disabled: ro }));
    }
    if (tr === "viewport") box.appendChild(A.checkField("Rejouer à chaque retour à l'écran", scene.repeat, function (v) { sceneMut("Rejouer la scène", function (sn) { if (v) sn.repeat = true; else delete sn.repeat; }); }, { disabled: ro }));
    if (tr === "scroll") {
      var rg = scene.scrub || { start: 0, end: 100 };
      var setR = function (k, n) { sceneMut("Plage de défilement", function (sn) { var c = Object.assign({ start: 0, end: 100 }, sn.scrub); c[k] = n === null ? (k === "start" ? 0 : 100) : n; if (c.start >= c.end) { c = { start: 0, end: 100 }; } if (c.start === 0 && c.end === 100) delete sn.scrub; else sn.scrub = c; }); draw(); };
      box.appendChild(numField("Début de la plage (%)", rg.start, { min: 0, max: 99, name: "scrub-start" }, function (n) { setR("start", n); }));
      box.appendChild(numField("Fin de la plage (%)", rg.end, { min: 1, max: 100, name: "scrub-end" }, function (n) { setR("end", n); }, "L'animation avance et recule avec le défilement de la page."));
    }
    var off = scene.off || [];
    var checks = h("div", { class: "pb-checks" });
    SCREENS.forEach(function (bp) {
      var cb = h("input", { type: "checkbox", disabled: ro || null, "data-tl-screen": bp }); cb.checked = off.indexOf(bp) < 0;
      cb.addEventListener("change", function () {
        var next = SCREENS.filter(function (x) { return x === bp ? !cb.checked : off.indexOf(x) >= 0; });
        if (next.length === SCREENS.length) { cb.checked = true; A.toast("Laissez au moins un écran actif.", true); return; }
        sceneMut("Écrans de la scène", function (sn) { if (next.length) sn.off = next; else delete sn.off; });
      });
      checks.appendChild(h("label", {}, cb, " " + A.bpLabel(bp)));
    });
    box.appendChild(h("div", { class: "pb-field" }, h("p", { class: "pb-sub", text: "Scène active sur" }), checks));
    return box;
  }

  // ----- Options de la page : transitions et défilement fluide -----
  function pageOptions() {
    var h = A.h, ro = !A.canWrite(), m = model() || {}, spec = A.SPEC.motionStudio.scenes, box = h("div", { class: "pb-tl-page", "data-tl-page-options": "" });
    var pt = m.pageTransition || null;
    box.appendChild(h("p", { class: "pb-sub", text: "Transition entre les pages" }));
    box.appendChild(A.selectField("Cette page", pt ? pt.type : "", [["", "Comme le site (par défaut)"]].concat(spec.pageTransitions), function (v) { mutate("Transition de page", function (mm) { if (!v) delete mm.pageTransition; else mm.pageTransition = Object.assign({}, mm.pageTransition, { type: v }); if (v === "off" && mm.pageTransition) delete mm.pageTransition.duration; }); drawOptions(); }, { disabled: ro, hint: "Le navigateur fond la page quittée vers la nouvelle (API View Transitions). Les deux pages doivent avoir la transition. Sans effet sur un navigateur qui ne la connaît pas, ni si le visiteur demande moins de mouvement." }));
    if (pt && pt.type !== "off") box.appendChild(numField("Durée (ms)", pt.duration || spec.defaults.pageDuration, { min: 100, max: 1500, step: 50, name: "page-duration" }, function (n) { mutate("Durée de transition de page", function (mm) { if (mm.pageTransition) { mm.pageTransition.duration = n === null ? spec.defaults.pageDuration : n; if (mm.pageTransition.duration === spec.defaults.pageDuration) delete mm.pageTransition.duration; } }); }));
    var st = m.sectionTransition || null;
    box.appendChild(h("p", { class: "pb-sub", text: "Transition des sections" }));
    box.appendChild(A.selectField("Apparition des sections", st ? st.type : "", [["", "Aucune (par défaut)"]].concat(spec.sectionTransitions), function (v) { mutate("Transition des sections", function (mm) { if (!v) delete mm.sectionTransition; else mm.sectionTransition = Object.assign({}, mm.sectionTransition, { type: v }); }); drawOptions(); }, { disabled: ro, hint: "Chaque section sous la ligne de flottaison apparaît en arrivant à l'écran. Les sections visibles à l'ouverture ne sont jamais masquées." }));
    if (st) box.appendChild(numField("Durée (ms)", st.duration || spec.defaults.sectionDuration, { min: 200, max: 1500, step: 50, name: "section-duration" }, function (n) { mutate("Durée de transition des sections", function (mm) { if (mm.sectionTransition) { mm.sectionTransition.duration = n === null ? spec.defaults.sectionDuration : n; if (mm.sectionTransition.duration === spec.defaults.sectionDuration) delete mm.sectionTransition.duration; } }); }));
    var ss = m.smoothScroll || null;
    box.appendChild(h("p", { class: "pb-sub", text: "Défilement fluide" }));
    box.appendChild(A.checkField("Lisser le défilement à la molette", Boolean(ss), function (v) { mutate("Défilement fluide", function (mm) { if (v) mm.smoothScroll = { on: true }; else delete mm.smoothScroll; }); drawOptions(); }, { disabled: ro, hint: "Désactivé par défaut. Jamais actif si le visiteur demande moins de mouvement, ni avec le magnétisme de défilement ; ne touche ni au positionnement collant ni aux ancres natives. Non appliqué dans l'éditeur." }));
    if (ss) {
      box.appendChild(numField("Intensité (1 = vive, 10 = très douce)", ss.strength || spec.defaults.strength, { min: 1, max: 10, step: 1, name: "smooth-strength" }, function (n) { mutate("Intensité du défilement fluide", function (mm) { if (mm.smoothScroll) { mm.smoothScroll.strength = n === null ? 5 : n; if (mm.smoothScroll.strength === 5) delete mm.smoothScroll.strength; } }); }));
      box.appendChild(A.checkField("Animer aussi les liens vers une ancre de la page", ss.anchors !== false, function (v) { mutate("Ancres du défilement fluide", function (mm) { if (mm.smoothScroll) { if (v) delete mm.smoothScroll.anchors; else mm.smoothScroll.anchors = false; } }); }, { disabled: ro }));
    }
    return box;
  }
  function drawOptions() { if (ui.opts && ui.opts.isConnected) { var n = pageOptions(); ui.opts.replaceWith(n); ui.opts = n; } }

  // ----- Assemblage -----
  function sceneBar(scene) {
    var h = A.h, ro = !A.canWrite(), list = scenes();
    var opts = list.map(function (s, i) { return [s.id, (s.name || "Scène " + (i + 1)) + " (" + s.steps.length + " pas)"]; });
    var select = list.length ? A.selectField("Scène", scene ? scene.id : "", opts, function (v) { stopPreview(true); sel.scene = v; sel.step = null; draw(); }) : null;
    var row = h("div", { class: "pb-row pb-wrap" },
      btn("Nouvelle scène", "scene-add", function () {
        var id = newId();
        mutate("Nouvelle scène", function (m) { m.scenes = m.scenes || []; if (m.scenes.length >= sc().LIMITS.scenes) return; m.scenes.push({ id: id, name: "Scène " + (m.scenes.length + 1), steps: [] }); });
        if (sceneById(id)) { sel.scene = id; sel.step = null; } else A.toast("Une page contient 12 scènes au plus.", true);
        draw();
      }, { disabled: ro }),
      btn("Dupliquer la scène", "scene-dup", function () {
        var id = newId();
        mutate("Dupliquer une scène", function (m) { var s = (m.scenes || []).filter(function (x) { return x.id === sel.scene; })[0]; if (!s || m.scenes.length >= sc().LIMITS.scenes) return; var c = clone(s); c.id = id; c.name = ((s.name || "Scène") + " (copie)").slice(0, 60); var map = {}; c.steps.forEach(function (x) { map[x.id] = newId(); }); c.steps.forEach(function (x) { x.id = map[x.id]; if (x.sync) x.sync = map[x.sync]; if (x.after) x.after = map[x.after]; }); m.scenes.splice(m.scenes.indexOf(s) + 1, 0, c); });
        if (sceneById(id)) { sel.scene = id; sel.step = null; } draw();
      }, { disabled: ro || !scene }),
      btn("Supprimer la scène", "scene-del", function () {
        var id = sel.scene; mutate("Supprimer une scène", function (m) { m.scenes = (m.scenes || []).filter(function (x) { return x.id !== id; }); });
        sel.scene = null; sel.step = null; draw();
      }, { disabled: ro || !scene }));
    return h("div", {}, select, row);
  }
  function addRow(scene, list) {
    var h = A.h, ro = !A.canWrite(), id = uid(), pick = h("select", { id: id, "data-tl": "add-target", disabled: ro || null });
    list.forEach(function (n) { pick.appendChild(h("option", { value: n.id, text: n.label })); });
    var selected = (A.selection() || []).filter(function (x) { return nodeLabel(list, x); });
    if (selected.length) pick.value = selected[0];
    var stId = uid(), stag = numInput(0, { min: 0, max: 1000, step: 10, label: "Décalage entre éléments (ms)", name: "stagger" }, function () {}); stag.id = stId;
    return h("div", { class: "pb-tl-add", "data-tl-add": "" },
      h("div", { class: "pb-field" }, h("label", { for: id, text: "Ajouter un pas sur un élément" }), pick),
      h("div", { class: "pb-row pb-wrap" },
        btn("Ajouter un pas", "step-add", function () { if (pick.value) addSteps([pick.value], 0); }, { disabled: ro || !list.length }),
        btn(selected.length > 1 ? "Ajouter les " + selected.length + " éléments sélectionnés" : "Ajouter la sélection", "step-add-sel", function () { var cur = (A.selection() || []).filter(function (x) { return nodeLabel(list, x); }); if (!cur.length) { A.toast("Sélectionnez d'abord un ou plusieurs éléments dans la page.", true); return; } addSteps(cur, Math.round(Number(stag.value) || 0), "Ajouter des pas synchronisés"); }, { disabled: ro || !list.length, tip: "Les éléments partent ensemble (même début), avec un décalage optionnel en cascade" })),
      h("div", { class: "pb-field" }, h("label", { for: stId, text: "Décalage entre éléments (ms)" }), stag));
  }

  function draw() {
    if (!ui.wrap) return;
    cancelAnimationFrame(raf);
    var h = A.h, scene = curScene(), list = nodes();
    ui.wrap.textContent = ""; ui.lane = null; ui.playhead = null; fieldRefs = {};
    if (!core()) { ui.wrap.appendChild(h("p", { class: "pb-hint", text: "Le module de scènes n'a pas pu être chargé : rechargez l'éditeur." })); return; }
    ui.wrap.appendChild(sceneBar(scene));
    if (!scene) {
      ui.wrap.appendChild(h("p", { class: "pb-hint", "data-tl-empty": "", text: "Une scène enchaîne les animations de plusieurs éléments sur une même timeline (apparitions en cascade, sorties, accents). Créez-en une pour commencer." }));
    } else {
      ui.wrap.appendChild(sceneSettings(scene, list));
      ui.wrap.appendChild(transport(scene));
      ui.wrap.appendChild(h("div", { class: "pb-field" }, h("label", { text: "Échelle" }), (function () { var r = h("input", { type: "range", min: "30", max: "300", step: "10", value: String(PX), "data-tl": "zoom", "aria-label": "Échelle de la timeline (pixels par seconde)" }); r.addEventListener("input", function () { PX = Number(r.value); draw(); }); return r; })()));
      ui.wrap.appendChild(timeline(scene, list));
      ui.wrap.appendChild(addRow(scene, list));
      ui.wrap.appendChild(stepEditor(scene, list));
      var miss = scene.steps.filter(function (s) { return !nodeLabel(list, s.target); }).length;
      if (miss) ui.wrap.appendChild(h("p", { class: "pb-hint is-warn", "data-tl-missing": "", text: miss + " pas visent un élément supprimé : ils seront retirés à l'enregistrement (avec un avertissement)." }));
    }
    ui.sig = JSON.stringify(model());
  }

  // Panneau des réglages de la page. Les changements faits ailleurs (annuler / rétablir, assistant) sont repris par une veille légère tant que le panneau est affiché.
  function panel(box) {
    if (!A || !box) return false;
    var h = A.h;
    ui.wrap = h("div", { class: "pb-tl", "data-ms-timeline": "" });
    ui.opts = pageOptions();
    var scenesGroup = A.accGroup("ms-scenes", "Scènes et mouvement", false, function (b) {
      b.appendChild(h("p", { class: "pb-hint", text: "Timeline visuelle : plusieurs éléments, un ordre, des durées. Lecture sur la page. Enregistrée avec le brouillon, publiée avec la page." }));
      b.appendChild(ui.wrap); b.appendChild(ui.opts);
    }, scenes().length || 0);
    box.appendChild(scenesGroup);
    draw();
    clearInterval(poll);
    poll = setInterval(function () {
      if (!ui.wrap || !ui.wrap.isConnected) { clearInterval(poll); poll = 0; return; }
      var s = JSON.stringify(model());
      if (!dragging && s !== ui.sig && !(document.activeElement && ui.wrap.contains(document.activeElement) && /^(input|select|textarea)$/i.test(document.activeElement.tagName))) { draw(); drawOptions(); }
    }, 350);
    return true;
  }

  // Avertissements du serveur (élément supprimé) : le document de l'éditeur est nettoyé comme le serveur l'a fait, sans nouvelle étape d'historique
  function heal(w) {
    if (!w || w.kind !== "scene_target") return false;
    var m = A && A.content().theme && A.content().theme.motionScenes; if (!m || !m.scenes) return false;
    m.scenes.forEach(function (s) {
      if (w.sceneId && s.id !== w.sceneId) return;
      s.steps = s.steps.filter(function (x) { return x.target !== w.target; });
      s.steps.forEach(function (x) { if (x.sync && !s.steps.some(function (y) { return y.id === x.sync; })) delete x.sync; if (x.after && !s.steps.some(function (y) { return y.id === x.after; })) delete x.after; });
      if (s.anchor === w.target) delete s.anchor;
    });
    return true;
  }

  window.pbMotionTimeline = { attach: attach, panel: panel, heal: heal, redraw: draw, state: function () { return { scene: sel.scene, step: sel.step, px: PX }; } };
})();
