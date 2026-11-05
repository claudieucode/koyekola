/* Pellicule — grain, révélations, chapitres, filtres de filmographie, fiche film en panneau, lecteur de bande-annonce simulée. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "pellicule") return;
  var R = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n, l) { n = String(n); while (n.length < (l || 2)) n = "0" + n; return n; };
  var focusable = "a[href],summary,[tabindex]:not([tabindex='-1'])";

  // Apparition au défilement
  if (!R && "IntersectionObserver" in window) {
    b.classList.add("pe-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  }

  // Progression de lecture (barre de chapitres) et timecode
  var prog = $(".pe-prog")[0], tcs = $("[data-tc]"), tick = false, t0 = Date.now();
  function upd() {
    tick = false;
    var m = document.documentElement.scrollHeight - window.innerHeight, p = m > 0 ? Math.min(1, Math.max(0, window.pageYOffset / m)) : 0;
    if (prog) prog.style.transform = "scaleX(" + p.toFixed(4) + ")";
    var s = Math.floor(p * 5400 + (R ? 0 : (Date.now() - t0) / 1000)), f = R ? 0 : Math.floor(((Date.now() - t0) % 1000) / 41.67);
    var t = pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s % 3600 / 60)) + ":" + pad(s % 60) + ":" + pad(f);
    tcs.forEach(function (e) { e.textContent = t; });
  }
  function req() { if (!tick) { tick = true; requestAnimationFrame(upd); } }
  window.addEventListener("scroll", req, { passive: true }); window.addEventListener("resize", req); upd();
  if (tcs.length && !R) setInterval(upd, 500);

  // Compteurs
  $("[data-count]").forEach(function (el) {
    var end = parseInt(el.getAttribute("data-count"), 10); if (R || !("IntersectionObserver" in window) || isNaN(end)) return;
    var o = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; o.disconnect(); var s = performance.now(); (function st(n) { var k = Math.min(1, (n - s) / 1100); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(st); })(s); });
    o.observe(el);
  });

  // Rangées : flèches
  function arrows(row) {
    var w = row.parentNode; $("[data-pe-nav]", w).forEach(function (a) {
      var d = parseInt(a.getAttribute("data-pe-nav"), 10), off = d < 0 ? row.scrollLeft <= 4 : row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
      a.setAttribute("aria-disabled", off ? "true" : "false");
    });
  }
  $(".pe-row").forEach(function (r) { r.addEventListener("scroll", function () { arrows(r); }, { passive: true }); arrows(r); });
  window.addEventListener("resize", function () { $(".pe-row").forEach(arrows); });

  // Filtres année / genre
  var st = { annee: "all", genre: "all" }, bar = $(".pe-fbar")[0];
  function apply() {
    var n = 0;
    $(".pe-film").forEach(function (f) {
      var ok = (st.annee === "all" || f.getAttribute("data-band") === st.annee) && (st.genre === "all" || f.getAttribute("data-genre") === st.genre);
      f.classList.toggle("is-off", !ok); if (ok) n++;
    });
    $("[data-pe-rowsec]").forEach(function (s) { s.classList.toggle("is-off", !s.querySelector(".pe-film:not(.is-off)")); });
    $(".pe-chip[data-axis]").forEach(function (c) { c.setAttribute("aria-pressed", st[c.getAttribute("data-axis")] === c.getAttribute("data-val") ? "true" : "false"); });
    var cnt = $("[data-pe-count]")[0]; if (cnt) cnt.textContent = n;
    var em = $("[data-pe-empty]")[0]; if (em) em.classList.toggle("is-on", !n);
    $(".pe-row").forEach(function (r) { r.scrollLeft = 0; arrows(r); });
  }
  if (bar) {
    var h = (location.hash || "").replace("#", "").split("-");
    if (h.length === 2 && st.hasOwnProperty(h[0])) { st[h[0]] = h[1]; apply(); }
    document.addEventListener("click", function (e) {
      var c = e.target.closest && e.target.closest(".pe-chip[data-axis]"); if (c) { e.preventDefault(); st[c.getAttribute("data-axis")] = c.getAttribute("data-val"); apply(); return; }
      var r = e.target.closest && e.target.closest("[data-pe-reset]"); if (r) { e.preventDefault(); st.annee = st.genre = "all"; apply(); }
    });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-pe-nav]"); if (!a) return; e.preventDefault();
    var row = a.closest(".pe-rowsec").querySelector(".pe-row"); row.scrollBy({ left: parseInt(a.getAttribute("data-pe-nav"), 10) * row.clientWidth * 0.8, behavior: R ? "auto" : "smooth" });
  });

  // Fermeture du menu mobile au clic extérieur
  document.addEventListener("click", function (e) { var d = $(".pe-chap-m[open]")[0]; if (d && !d.contains(e.target)) d.removeAttribute("open"); });

  // Utilitaires de fenêtre modale
  var lastFocus = null;
  function trap(box, e) {
    if (e.key !== "Tab") return; var f = $(focusable, box).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function mk(tag, cls, html) { var e = document.createElement(tag); e.className = cls; if (html) e.innerHTML = html; return e; }

  // Fiche film en panneau
  var ov, panel, pbody;
  function buildPanel() {
    ov = mk("div", "pe-ov"); panel = mk("aside", "pe-panel"); panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", "Fiche du film");
    panel.innerHTML = '<a class="pe-x" href="#fermer" aria-label="Fermer la fiche">Fermer</a><div class="pe-pposter"></div><div class="pe-pf"></div>';
    document.body.appendChild(ov); document.body.appendChild(panel); pbody = panel.querySelector(".pe-pf");
    ov.addEventListener("click", closePanel);
    panel.addEventListener("keydown", function (e) { trap(panel, e); });
  }
  function openPanel(card, from) {
    if (!panel) buildPanel(); lastFocus = from;
    pbody.innerHTML = card.querySelector(".pe-fiche").innerHTML;
    var ps = panel.querySelector(".pe-pposter"); ps.innerHTML = ""; var sv = card.querySelector(".pe-ps"); if (sv) ps.appendChild(sv.cloneNode(true));
    panel.setAttribute("aria-label", "Fiche du film " + (card.querySelector(".pe-pt") || {}).textContent);
    panel.scrollTop = 0; ov.classList.add("is-on"); panel.classList.add("is-on"); b.classList.add("pe-lock");
    setTimeout(function () { panel.querySelector(".pe-x").focus(); }, 30);
  }
  function closePanel() { if (!panel || !panel.classList.contains("is-on")) return; panel.classList.remove("is-on"); ov.classList.remove("is-on"); b.classList.remove("pe-lock"); if (lastFocus) lastFocus.focus(); }

  // Lecteur de bande-annonce simulée (aucune vidéo, aucun son)
  var th, T = { on: false, t: 0, len: 30, last: 0, beat: -1, raf: 0, d: null, bgA: true };
  function buildTheatre() {
    th = mk("div", "pe-th"); th.setAttribute("role", "dialog"); th.setAttribute("aria-modal", "true"); th.setAttribute("aria-label", "Lecteur de bande-annonce (simulation)");
    th.innerHTML = '<div class="pe-th-in"><div class="pe-th-screen"><div class="pe-th-bg"></div><div class="pe-th-shade"></div><div class="pe-th-card" aria-live="polite"><p class="pe-th-l1"></p><p class="pe-th-l2"></p></div><div class="pe-th-flash"></div><p class="pe-th-tag">Démonstration · sans son</p></div>' +
      '<div class="pe-th-ctl"><a class="pe-cb" href="#lecture" data-a="play" aria-label="Lecture"></a><div class="pe-seek" role="slider" tabindex="0" aria-label="Position dans la bande-annonce" aria-valuemin="0" aria-valuemax="30" aria-valuenow="0" aria-valuetext="0 seconde sur 30"><div class="pe-seek-t"><i></i></div></div><span class="pe-th-t">00:00 / 00:30</span><a class="pe-cb pe-cb--fs" href="#plein-ecran" data-a="fs">Plein écran</a><a class="pe-cb" href="#fermer" data-a="x">Fermer</a></div>' +
      '<p class="pe-th-note">Bande-annonce simulée : titres animés sur l\'affiche, sans vidéo. Échap pour fermer, espace pour lecture / pause, flèches pour avancer.</p></div>';
    document.body.appendChild(th);
    th.addEventListener("click", function (e) {
      var a = e.target.closest("[data-a]"); if (!a) return; e.preventDefault(); var k = a.getAttribute("data-a");
      if (k === "play") toggle(); else if (k === "x") closeTh(); else if (k === "fs") { var s = th.querySelector(".pe-th-in"); if (document.fullscreenElement) document.exitFullscreen(); else if (s.requestFullscreen) s.requestFullscreen(); }
    });
    var sk = th.querySelector(".pe-seek"), drag = false;
    function pos(e) { var r = sk.getBoundingClientRect(); seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * T.len); }
    sk.addEventListener("pointerdown", function (e) { drag = true; try { sk.setPointerCapture(e.pointerId); } catch (x) {} pos(e); });
    sk.addEventListener("pointermove", function (e) { if (drag) pos(e); });
    sk.addEventListener("pointerup", function () { drag = false; });
    sk.addEventListener("keydown", function (e) {
      var d = { ArrowRight: 2, ArrowUp: 2, ArrowLeft: -2, ArrowDown: -2 }[e.key]; if (d) { e.preventDefault(); seek(T.t + d); } else if (e.key === "Home") { e.preventDefault(); seek(0); } else if (e.key === "End") { e.preventDefault(); seek(T.len); }
    });
    th.addEventListener("keydown", function (e) { trap(th, e); });
  }
  var ICON = { play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>', pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>' };
  function beats(d) { return [[0, "Pellicule présente", ""], [4, "Un film de", d.by], [9, d.tag, ""], [15, d.g, "—"], [21, "Cet automne", ""], [25, "", d.t]]; }
  function render() {
    var d = T.d, bs = beats(d), i = 0; for (var k = 0; k < bs.length; k++) if (T.t >= bs[k][0]) i = k;
    if (i !== T.beat) {
      T.beat = i; var l1 = th.querySelector(".pe-th-l1"), l2 = th.querySelector(".pe-th-l2"); l1.textContent = bs[i][1]; l2.textContent = bs[i][2];
      var bg = th.querySelector(".pe-th-bg"); bg.className = "pe-th-bg " + (i % 2 ? "is-a" : "is-b"); var s = bg.firstChild; if (s) { s.style.animation = "none"; void s.getBoundingClientRect(); s.style.animation = ""; }
      if (!R && i > 0) { var f = th.querySelector(".pe-th-flash"); f.classList.add("is-on"); setTimeout(function () { f.classList.remove("is-on"); }, 90); }
    }
    th.querySelector(".pe-seek-t i").style.transform = "scaleX(" + (T.t / T.len).toFixed(4) + ")";
    var sk = th.querySelector(".pe-seek"), s2 = Math.floor(T.t); sk.setAttribute("aria-valuenow", s2); sk.setAttribute("aria-valuetext", s2 + " secondes sur " + T.len);
    th.querySelector(".pe-th-t").textContent = "00:" + pad(s2) + " / 00:" + T.len;
  }
  function loop(n) {
    if (!T.on) return; T.t += (n - T.last) / 1000; T.last = n;
    if (T.t >= T.len) { T.t = T.len; render(); setPlay(false); return; }
    render(); T.raf = requestAnimationFrame(loop);
  }
  function setPlay(p) {
    T.on = p; var a = th.querySelector('[data-a="play"]'); a.innerHTML = p ? ICON.pause : ICON.play; a.setAttribute("aria-label", p ? "Pause" : (T.t >= T.len ? "Revoir" : "Lecture"));
    cancelAnimationFrame(T.raf); if (p) { T.last = performance.now(); T.raf = requestAnimationFrame(loop); }
  }
  function toggle() { if (!T.on && T.t >= T.len) { T.t = 0; T.beat = -1; } setPlay(!T.on); }
  function seek(t) { T.t = Math.max(0, Math.min(T.len, t)); render(); }
  function openTh(a) {
    if (!th) buildTheatre(); lastFocus = a; closePanel();
    T.d = { t: a.getAttribute("data-t"), by: a.getAttribute("data-by"), tag: a.getAttribute("data-tag"), g: a.getAttribute("data-g") };
    var p = a.getAttribute("data-p"), src = p !== "scene" && document.querySelector('.pe-film[data-slug="' + p + '"] .pe-ps');
    if (!src) src = document.querySelector(".pe-scene");
    var bg = th.querySelector(".pe-th-bg"); bg.innerHTML = ""; if (src) { var c = src.cloneNode(true); c.setAttribute("preserveAspectRatio", "xMidYMid slice"); bg.appendChild(c); }
    th.setAttribute("aria-label", "Bande-annonce simulée : " + T.d.t);
    T.t = 0; T.beat = -1; th.classList.add("is-on"); b.classList.add("pe-lock"); render();
    if (!R) setPlay(true); else setPlay(false);
    setTimeout(function () { th.querySelector('[data-a="play"]').focus(); }, 30);
  }
  function closeTh() { if (!th || !th.classList.contains("is-on")) return; setPlay(false); th.classList.remove("is-on"); b.classList.remove("pe-lock"); if (document.fullscreenElement) document.exitFullscreen(); if (lastFocus) lastFocus.focus(); }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-pe-trailer]"); if (t) { e.preventDefault(); openTh(t); return; }
    var f = e.target.closest && e.target.closest("[data-pe-film]"); if (f) { e.preventDefault(); openPanel(f.closest(".pe-film"), f); return; }
    var x = e.target.closest && e.target.closest(".pe-x"); if (x) { e.preventDefault(); closePanel(); }
  });
  document.addEventListener("keydown", function (e) {
    if (th && th.classList.contains("is-on")) {
      if (e.key === "Escape") { e.preventDefault(); closeTh(); } else if (e.key === " " && !e.target.closest("a")) { e.preventDefault(); toggle(); }
    } else if (e.key === "Escape") closePanel();
  });
})();
