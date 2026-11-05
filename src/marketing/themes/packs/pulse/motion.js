/* Pulse — line-up interactif, favoris locaux, programme à onglets et lecteur d'extraits synthétisés (Web Audio). Aucun fichier audio ; le son ne démarre que sur action de l'utilisateur. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "pulse") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  b.classList.add("pu-ui");

  // Apparition saccadée au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("pu-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 90 + "ms"; io.observe(el); });
  }

  // Compte à rebours et compteurs
  $$("[data-countdown]").forEach(function (box) {
    var end = new Date(box.getAttribute("data-countdown")).getTime(), c = {}; if (isNaN(end)) return;
    $$("[data-u]", box).forEach(function (x) { c[x.getAttribute("data-u")] = x; });
    var pad = function (n, l) { n = "" + n; while (n.length < l) n = "0" + n; return n; };
    function tick() { var s = Math.max(0, Math.floor((end - Date.now()) / 1000)); c.d.textContent = pad(Math.floor(s / 86400), 3); c.h.textContent = pad(Math.floor(s % 86400 / 3600), 2); c.m.textContent = pad(Math.floor(s % 3600 / 60), 2); c.s.textContent = pad(s % 60, 2); }
    tick(); setInterval(tick, reduce ? 60000 : 1000);
  });
  if (!reduce && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "", t0 = null;
      (function st(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1000); el.textContent = Math.round(to * p) + suf; if (p < 1) requestAnimationFrame(st); })(performance.now());
    }); }, { threshold: 0.5 });
    $$("[data-count]").forEach(function (el) { co.observe(el); });
  }

  // ---------- favoris (stockés seulement sur cet appareil) ----------
  var favs = [];
  try { favs = JSON.parse(localStorage.getItem("pulse-favs") || "[]"); if (!Array.isArray(favs)) favs = []; } catch (e) { favs = []; }
  function saveFavs() { try { localStorage.setItem("pulse-favs", JSON.stringify(favs)); } catch (e) {} }
  var onlyFav = false;
  function syncFavs() {
    $$("[data-fav]").forEach(function (a) { var on = favs.indexOf(a.getAttribute("data-fav")) > -1, nm = (a.getAttribute("aria-label") || "").replace(/^(Ajouter|Retirer) | (aux|des) favoris$/g, ""); a.setAttribute("aria-pressed", on ? "true" : "false"); if (nm) a.setAttribute("aria-label", (on ? "Retirer " : "Ajouter ") + nm + (on ? " des favoris" : " aux favoris")); var s = $("span", a); if (s) s.textContent = on ? "Favori ✓" : "Favori"; });
    $$(".pu-set").forEach(function (a) { a.classList.toggle("is-fav", favs.indexOf(a.getAttribute("data-id")) > -1); });
    $$("[data-favn]").forEach(function (n) { n.textContent = favs.length; });
    var plan = $("[data-plan]"); if (plan) {
      plan.innerHTML = ""; var n = 0;
      $$("[data-art]").forEach(function (c) { if (favs.indexOf(c.getAttribute("data-id")) < 0) return; n++; var li = document.createElement("li"), s = document.createElement("strong"), m = document.createElement("small"); s.textContent = $("h3", c).textContent; m.textContent = $$(".pu-card-meta span", c).map(function (x) { return x.textContent; }).join(" · "); li.appendChild(s); li.appendChild(m); plan.appendChild(li); });
      var msg = $("[data-planmsg]"); if (msg) msg.textContent = n ? n + " artiste" + (n > 1 ? "s" : "") + " dans votre planning (enregistré sur cet appareil uniquement)." : "Aucun favori pour l'instant : touchez l'étoile d'un artiste pour le garder ici.";
    }
    applyFilter();
  }

  // ---------- filtres du line-up ----------
  var fd = "all", fs = "all";
  function applyFilter() {
    var box = $("[data-lineup]"); if (!box) return; var n = 0;
    $$("[data-art]").forEach(function (c) { var ok = (fd === "all" || c.getAttribute("data-day") === fd) && (fs === "all" || c.getAttribute("data-scene") === fs) && (!onlyFav || favs.indexOf(c.getAttribute("data-id")) > -1); c.hidden = !ok; if (ok) n++; });
    var out = $("[data-out]"); if (out) out.textContent = n + " artiste" + (n > 1 ? "s" : "") + " affiché" + (n > 1 ? "s" : "");
    var em = $("[data-empty]"); if (em) em.hidden = n > 0;
  }
  function setOn(list, a) { list.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); }); }

  // ---------- moteur audio ----------
  var T = [
    { bpm: 124, root: 45, sc: [0, 2, 3, 5, 7, 8, 10], k: "x...x...x...x...", c: "....x.......x...", h: "..x...x...x...x.", bass: "0..0..0.3..3..2.", lead: "4.2.4.5.4.2.0.2.", bw: "sawtooth", lw: "triangle", pad: 0 },
    { bpm: 140, root: 43, sc: [0, 2, 3, 5, 7, 8, 11], k: "x..x..x...x.x...", c: "....x.......x...", h: "xxxxxxxxxxxxxxxx", bass: "0.0.0.3.0.0.5.4.", lead: "7.5.7.4.7.5.9.4.", bw: "sawtooth", lw: "square", pad: 0 },
    { bpm: 90, root: 41, sc: [0, 2, 3, 5, 7, 9, 10], k: "x.....x...x.....", c: "....x.......x...", h: "x.x.x.x.x.x.x.x.", bass: "0.....0.....3.2.", lead: "....4.......2...", bw: "sine", lw: "triangle", pad: 1 },
    { bpm: 172, root: 40, sc: [0, 1, 3, 5, 7, 8, 10], k: "x.....x...x.x...", c: "....x..x..x.x..x", h: "x.xxx.xxx.xxx.xx", bass: "0..0..3..0..5.2.", lead: "9.7.9.4.7.5.4.2.", bw: "sawtooth", lw: "square", pad: 0 },
    { bpm: 100, root: 38, sc: [0, 2, 4, 5, 7, 9, 11], k: "x...............", c: "................", h: "................", bass: "0.......3.......", lead: "0.2.4.6.4.2.0.2.", bw: "sine", lw: "sine", pad: 1 }
  ];
  var SHIFT = [0, 0, -4, -2];
  var A = { ctx: null, m: null, an: null, nb: null, cur: 0, on: false, step: 0, bar: 0, next: 0, timer: 0, vol: 0.4 }, UIs = [];
  var hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  function note(tr, ch, oct, sh) { var d = parseInt(ch, 10), o = Math.floor(d / 7); return tr.root + sh + tr.sc[d % 7] + 12 * (o + oct); }
  function tone(t, f, dur, type, v, cut) {
    var x = A.ctx, o = x.createOscillator(), g = x.createGain(), fl = x.createBiquadFilter();
    o.type = type; o.frequency.value = f; fl.type = "lowpass"; fl.frequency.value = cut || 3000;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(A.m ? A.pre : A.m); o.start(t); o.stop(t + dur + 0.05);
  }
  function kick(t, v) { var x = A.ctx, o = x.createOscillator(), g = x.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34); o.connect(g); g.connect(A.pre); o.start(t); o.stop(t + 0.4); }
  function noise(t, dur, type, f, v) {
    var x = A.ctx, s = x.createBufferSource(), fl = x.createBiquadFilter(), g = x.createGain();
    s.buffer = A.nb; fl.type = type; fl.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(A.pre); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function sched(tr, st, bar, t, sd) {
    var sh = SHIFT[bar % 4];
    if (tr.k[st] === "x") kick(t, tr.bpm < 95 || tr === T[4] ? 0.7 : 0.95);
    if (tr.c[st] === "x") noise(t, tr === T[2] ? 0.18 : 0.12, "bandpass", 1800, 0.45);
    if (tr.h[st] === "x") noise(t, 0.04, "highpass", 7500, st % 4 === 2 ? 0.28 : 0.14);
    if (tr.bass[st] !== ".") tone(t, hz(note(tr, tr.bass[st], -1, sh)), sd * 2.2, tr.bw, 0.34, tr.bw === "sine" ? 900 : 700);
    if (tr.lead[st] !== ".") tone(t, hz(note(tr, tr.lead[st], 1, sh)), sd * 2.4, tr.lw, tr.lw === "square" ? 0.07 : 0.13, 2600);
    if (tr.pad && (st === 0 || st === 8)) [0, 2, 4].forEach(function (d) { var x = A.ctx, o = x.createOscillator(), g = x.createGain(); o.type = "triangle"; o.frequency.value = hz(note(tr, "" + (d + (st ? 1 : 0)), 0, sh)); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + sd * 3); g.gain.linearRampToValueAtTime(0.0001, t + sd * 8); o.connect(g); g.connect(A.pre); o.start(t); o.stop(t + sd * 8 + 0.1); });
  }
  function pump() {
    var tr = T[A.cur], sd = 60 / tr.bpm / 4;
    while (A.next < A.ctx.currentTime + 0.14) { sched(tr, A.step, A.bar, A.next, sd); A.next += sd; if (++A.step > 15) { A.step = 0; A.bar++; } }
  }
  function volume() { var v = A.vol; if (A.m) A.m.gain.setTargetAtTime(v * v * 0.9, A.ctx.currentTime, 0.03); }
  function init() {
    if (A.ctx) return true; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    var x = A.ctx = new AC(); A.pre = x.createGain(); A.m = x.createGain(); A.m.gain.value = 0;
    var cp = x.createDynamicsCompressor(); A.an = x.createAnalyser(); A.an.fftSize = 128; A.an.smoothingTimeConstant = 0.7;
    A.pre.connect(cp); cp.connect(A.m); A.m.connect(A.an); A.an.connect(x.destination);
    A.nb = x.createBuffer(1, x.sampleRate, x.sampleRate); var d = A.nb.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  function play() {
    if (!init()) { say("Le son n'est pas disponible sur ce navigateur."); return; }
    A.ctx.resume(); A.step = 0; A.bar = 0; A.next = A.ctx.currentTime + 0.06; clearInterval(A.timer); A.timer = setInterval(pump, 30); pump(); A.on = true; volume(); refresh(); loop();
  }
  function pause(msg) {
    if (!A.on) return; A.on = false; clearInterval(A.timer); if (A.m) A.m.gain.setTargetAtTime(0, A.ctx.currentTime, 0.02);
    var c = A.ctx; setTimeout(function () { if (!A.on && c.state === "running") c.suspend(); }, 160); refresh(msg);
  }
  function pick(n) { var was = A.on; A.cur = n; if (was) { A.step = 0; A.bar = 0; A.next = A.ctx.currentTime + 0.06; } refresh(); }
  function say(t) { UIs.forEach(function (u) { u.state.textContent = t; }); }

  // ---------- visualiseur ----------
  function draw(u, live) {
    var c = u.cv, g = c.getContext("2d"), w = c.width, h = c.height, n = 32, bw = w / n, data = null;
    g.clearRect(0, 0, w, h);
    if (live && A.an) { data = new Uint8Array(A.an.frequencyBinCount); A.an.getByteFrequencyData(data); }
    for (var i = 0; i < n; i++) {
      var v = data ? data[Math.floor(i * 1.5)] / 255 : 0.08 + (i % 5) * 0.015;
      g.fillStyle = i % 2 ? "#ff2fd0" : "#b8ff1a"; var bh = Math.max(4, v * h * 0.95); g.fillRect(i * bw + 2, h - bh, bw - 4, bh);
    }
  }
  var raf = 0;
  function loop() {
    cancelAnimationFrame(raf); if (reduce) { UIs.forEach(function (u) { draw(u, false); }); return; }
    (function f() { UIs.forEach(function (u) { draw(u, A.on); }); if (A.on) raf = requestAnimationFrame(f); })();
  }

  // ---------- interface du lecteur ----------
  var ICO_P = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>', ICO_S = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zm8 0h4v16h-4z" fill="currentColor"/></svg>';
  function refresh(msg) {
    var tr = T[A.cur], name = $$(".pu-tn")[A.cur] ? tr.bpm + " BPM" : "";
    UIs.forEach(function (u) {
      u.btn.innerHTML = A.on ? ICO_S : ICO_P; u.btn.setAttribute("aria-label", A.on ? "Pause" : "Lecture");
      u.title.textContent = u.names[A.cur];
      u.state.textContent = msg || (A.on ? "Lecture en boucle · " + name + (reduce ? " · visualiseur animé désactivé (mouvement réduit)" : "") : "À l'arrêt. Appuyez sur lecture pour démarrer le son.");
      u.items.forEach(function (li, i) { li.classList.toggle("is-on", i === A.cur); $("button", li).setAttribute("aria-pressed", i === A.cur ? "true" : "false"); });
    });
    $$("[data-play]").forEach(function (a) { var on = A.on && +a.getAttribute("data-play") === A.cur, s = $("span", a); a.classList.toggle("is-live", on); a.setAttribute("aria-pressed", on ? "true" : "false"); if (s) s.textContent = on ? (a.classList.contains("pu-btn") ? "Pause" : "Pause") : (a.classList.contains("pu-btn") ? "Écouter l'extrait" : "Écouter"); });
  }
  $$("[data-player]").forEach(function (box) {
    var ui = $("[data-ui]", box), items = $$(".pu-tracks li", box), names = items.map(function (li) { return $(".pu-tn", li).textContent.replace(/^\d+ · /, ""); });
    var wrap = document.createElement("div"); wrap.className = "pu-pl";
    wrap.innerHTML = '<div class="pu-pl-top"><button type="button" class="pu-pbtn" aria-label="Lecture"></button><div><p class="pu-pl-title"></p><p class="pu-pl-state" role="status" aria-live="polite"></p></div></div><canvas class="pu-viz" width="640" height="110" aria-hidden="true"></canvas><div class="pu-vol"><label>Volume <output>40 %</output></label><input type="range" min="0" max="100" value="40" aria-label="Volume du lecteur"></div>';
    ui.appendChild(wrap);
    var u = { btn: $(".pu-pbtn", wrap), title: $(".pu-pl-title", wrap), state: $(".pu-pl-state", wrap), cv: $(".pu-viz", wrap), items: items, names: names }; UIs.push(u);
    var rng = $("input", wrap), out = $("output", wrap);
    rng.value = Math.round(A.vol * 100);
    rng.addEventListener("input", function () { A.vol = rng.value / 100; UIs.forEach(function (x) { }); $$(".pu-vol input").forEach(function (r) { r.value = rng.value; }); $$(".pu-vol output").forEach(function (o) { o.textContent = rng.value + " %"; }); volume(); });
    u.btn.addEventListener("click", function () { A.on ? pause() : play(); });
    items.forEach(function (li, i) { var bt = document.createElement("button"); bt.type = "button"; while (li.firstChild) bt.appendChild(li.firstChild); li.appendChild(bt); bt.addEventListener("click", function () { if (A.cur === i && A.on) return; pick(i); if (!A.on) play(); }); });
  });
  if (UIs.length) { refresh(); loop(); document.addEventListener("visibilitychange", function () { if (document.hidden && A.on) pause("En pause : l'onglet est passé en arrière-plan."); }); }

  // ---------- fiches artistes ----------
  var fiches = $("[data-fiches]");
  if (fiches) {
    var picks = $$("[data-fiche-pick]"), panels = $$("[data-fiche]");
    var show = function (id) { panels.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-fiche") === id); }); picks.forEach(function (a) { var on = a.getAttribute("data-fiche-pick") === id; a.classList.toggle("is-on", on); a.setAttribute("aria-pressed", on ? "true" : "false"); }); };
    show(picks[0].getAttribute("data-fiche-pick"));
    picks.forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); show(a.getAttribute("data-fiche-pick")); var p = $(".pu-fiche.is-on"); if (p && window.innerWidth < 1024) p.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }); }); });
  }

  // ---------- programme : onglets par nuit ----------
  var days = $("[data-days]");
  if (days) {
    var tabs = $$("[data-day]", days), pn = $$("[data-daypanel]", days);
    var showDay = function (k) { pn.forEach(function (p) { p.hidden = p.getAttribute("data-daypanel") !== k; }); setOn(tabs, tabs.filter(function (t) { return t.getAttribute("data-day") === k; })[0]); };
    showDay("ven"); tabs.forEach(function (t) { t.addEventListener("click", function (ev) { ev.preventDefault(); showDay(t.getAttribute("data-day")); }); });
  }

  // ---------- clics délégués : filtres, favoris, écoute ----------
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a[data-fd],a[data-fs],a[data-ff],a[data-fav],a[data-play]"); if (!a) return;
    ev.preventDefault();
    if (a.hasAttribute("data-fd")) { fd = a.getAttribute("data-fd"); setOn($$("[data-fd]"), a); applyFilter(); }
    else if (a.hasAttribute("data-fs")) { fs = a.getAttribute("data-fs"); setOn($$("[data-fs]"), a); applyFilter(); }
    else if (a.hasAttribute("data-ff")) { onlyFav = !onlyFav; a.classList.toggle("is-on", onlyFav); a.setAttribute("aria-pressed", onlyFav ? "true" : "false"); applyFilter(); }
    else if (a.hasAttribute("data-fav")) { var id = a.getAttribute("data-fav"), i = favs.indexOf(id); if (i > -1) favs.splice(i, 1); else favs.push(id); saveFavs(); syncFavs(); }
    else if (a.hasAttribute("data-play") && UIs.length) { var n = +a.getAttribute("data-play"); if (A.on && A.cur === n) pause(); else { pick(n); if (!A.on) play(); } }
  });
  // Les liens ayant role="button" répondent aussi à la barre d'espace
  document.addEventListener("keydown", function (ev) { var a = ev.target; if (ev.key === " " && a && a.getAttribute && a.tagName === "A" && a.getAttribute("role") === "button") { ev.preventDefault(); a.click(); } });
  // Menu « Plus » : se referme au clic sur un lien ou sur Échap
  $$(".pu-sheet a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { var d = $(".pu-more[open]"); if (d) { d.open = false; $("summary", d).focus(); } } });
  syncFavs();
})();
