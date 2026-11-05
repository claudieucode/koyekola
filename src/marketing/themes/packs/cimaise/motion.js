/* Cimaise — parcours d'exposition, fiche d'œuvre en panneau, filtres, projecteur. Sans dépendance ; mouvement réduit respecté. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "cimaise") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
  var seg = function (p) { var s = p.split("/").filter(Boolean).pop() || ""; return s === "accueil" ? "" : s; };

  // Apparition douce au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("cm-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el) { io.observe(el); });
  }

  // Page courante dans l'index
  var here = seg(location.pathname);
  $$(".cm-index a, .cm-drawer a").forEach(function (a) { if (seg(a.pathname) === here) a.setAttribute("aria-current", "page"); });
  $$(".cm-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Horaires : ouvert / fermé selon le jour
  var H = { 0: [10, 18], 1: null, 2: [11, 19], 3: [11, 19], 4: [11, 21], 5: [11, 19], 6: [10, 19] }, now = new Date(), dd = now.getDay(), hh = now.getHours() + now.getMinutes() / 60;
  var hrs = H[dd], msg;
  if (!hrs) msg = "Fermé aujourd'hui, réouverture demain à 11 h";
  else if (hh < hrs[0]) msg = "Ouvre aujourd'hui à " + hrs[0] + " h";
  else if (hh < hrs[1]) msg = "Ouvert jusqu'à " + hrs[1] + " h";
  else msg = "Fermé pour ce soir";
  $$("[data-hours-status]").forEach(function (el) { el.textContent = msg; });
  $$(".cm-table tr[data-d]").forEach(function (tr) { if (Number(tr.getAttribute("data-d")) === dd) tr.classList.add("is-today"); });

  // Compteurs
  var cs = $$("[data-count]");
  if (cs.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target); var el = e.target, to = parseInt(el.getAttribute("data-count"), 10); if (reduce || isNaN(to)) return;
      var t0 = null; (function st(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1300); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(st); })(performance.now());
    }); }, { threshold: 0.5 });
    cs.forEach(function (c) { co.observe(c); });
  }

  // Projecteur qui suit la souris sur les murs
  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    $$(".cm-hero, .cm-room-wall, .cm-focus-wall").forEach(function (wall) {
      var sp = $(".cm-spot", wall); if (!sp) return;
      wall.addEventListener("pointermove", function (e) { var r = wall.getBoundingClientRect(); sp.style.transform = "translate(" + Math.round(e.clientX - r.left) + "px," + Math.round(e.clientY - r.top) + "px)"; sp.classList.add("is-on"); });
      wall.addEventListener("pointerleave", function () { sp.classList.remove("is-on"); });
    });
  }

  // Survol liste des salles <-> plan
  $$(".cm-rm[data-hov]").forEach(function (li) {
    var n = li.getAttribute("data-hov"), cell = $('.cm-route-plan [data-hov="' + n + '"]');
    function on(v) { li.classList.toggle("is-hov", v); if (cell) cell.classList.toggle("is-on", v); }
    li.addEventListener("mouseenter", function () { on(true); }); li.addEventListener("mouseleave", function () { on(false); });
    li.addEventListener("focusin", function () { on(true); }); li.addEventListener("focusout", function () { on(false); });
  });

  // Filtres (expositions, collection, médiation)
  $$("[data-filter]").forEach(function (box) {
    var st = {}, items = $$("[data-state],[data-artist],[data-pub]", box).filter(function (x) { return x.closest("li,article"); });
    items = $$("li[data-state], li[data-artist], article[data-pub]", box);
    var out = $("[data-out]", box), empty = $(".cm-empty", box);
    $$("a[data-fk]", box).forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault(); var k = a.getAttribute("data-fk"), v = a.getAttribute("data-fv"); st[k] = v;
        $$('a[data-fk="' + k + '"]', box).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        var shown = 0;
        items.forEach(function (it) {
          var ok = true;
          for (var key in st) { if (st[key] === "all") continue; var map = { state: "data-state", artist: "data-artist", kind: "data-kind", pub: "data-pub" }; if (it.getAttribute(map[key]) !== st[key]) ok = false; }
          it.hidden = !ok; if (ok) shown++;
        });
        if (out) out.textContent = shown; if (empty) empty.hidden = shown > 0;
      });
    });
  });

  // ----- Fiche d'œuvre -----
  var panel = $(".cm-panel"), reg = $$(".cm-reg-i"), cur = -1, lastFocus = null, zi = 0, ZS = [1, 1.8, 2.6];
  function regIndex(id) { for (var i = 0; i < reg.length; i++) if (reg[i].getAttribute("data-w") === id) return i; return -1; }
  function slot(n) { return $('[data-slot="' + n + '"]', panel); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function setZoom(i) {
    zi = Math.max(0, Math.min(ZS.length - 1, i)); var zin = $(".cm-zoom-in", panel);
    zin.style.transform = "scale(" + ZS[zi] + ")"; $(".cm-zoom", panel).classList.toggle("is-z", zi > 0); $(".cm-zv", panel).textContent = Math.round(ZS[zi] * 100) + " %";
    if (zi === 0) zin.style.transformOrigin = "50% 50%";
  }
  function fill(i) {
    var r = reg[i], d = function (k) { return r.getAttribute("data-" + k); }; cur = i;
    var a = slot("art"); a.innerHTML = ""; a.appendChild(r.querySelector("svg").cloneNode(true)); setZoom(0);
    slot("room").textContent = "Salle " + pad(Number(d("room"))) + " · " + d("roomn");
    slot("title").textContent = d("t"); slot("artist").textContent = d("a") + ", " + d("y");
    var dl = slot("dl"); dl.innerHTML = "";
    [["Technique", d("tech")], ["Dimensions", d("dim")], ["Inventaire", d("inv")], ["Provenance", "Collection de la galerie (fictive)"]].forEach(function (p) { var row = el("div"); row.appendChild(el("dt", "", p[0])); row.appendChild(el("dd", "", p[1])); dl.appendChild(row); });
    slot("txt").textContent = d("txt");
    var rl = slot("rel"); rl.innerHTML = "";
    (d("rel") || "").split(" ").forEach(function (id) {
      var j = regIndex(id); if (j < 0) return; var a2 = el("a", "cm-rel-i"); a2.href = "/oeuvre"; a2.setAttribute("data-open", id); a2.appendChild(reg[j].querySelector("svg").cloneNode(true)); a2.appendChild(el("span", "", reg[j].getAttribute("data-t"))); rl.appendChild(a2);
    });
    $(".cm-pscroll", panel).scrollTop = 0;
  }
  function openP(id, from) { var i = regIndex(id); if (i < 0 || !panel) return; if (cur < 0) lastFocus = from || document.activeElement; fill(i); b.classList.add("cm-open"); var x = $(".cm-x", panel); setTimeout(function () { if (x) x.focus(); }, 60); }
  function closeP() { if (!panel || !b.classList.contains("cm-open")) return; b.classList.remove("cm-open"); cur = -1; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function stepP(d) { if (cur < 0) return; fill((cur + d + reg.length) % reg.length); }

  // ----- Parcours -----
  var tour = $(".cm-tour"), rooms = tour ? $$(".cm-room", tour) : [], rc = 0;
  function go(n, scroll) {
    if (!rooms.length) return; rc = Math.max(0, Math.min(rooms.length - 1, n));
    rooms.forEach(function (r, i) { r.hidden = i !== rc; });
    $$(".cm-pc", tour).forEach(function (c, i) { var on = i === rc; c.classList.toggle("is-on", on); if (on) c.setAttribute("aria-current", "true"); else c.removeAttribute("aria-current"); });
    var tc = $("[data-tc]", tour); if (tc) tc.textContent = pad(rc + 1);
    $$("[data-room-nav]", tour).forEach(function (a) { var d = Number(a.getAttribute("data-room-nav")); a.setAttribute("aria-disabled", (rc + d < 0 || rc + d >= rooms.length) ? "true" : "false"); });
    if (scroll) { var top = tour.getBoundingClientRect().top; if (top < 0 || top > window.innerHeight * 0.6) tour.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
  }
  if (tour) { var m = /salle-(\d)/.exec(location.hash); go(m ? Number(m[1]) - 1 : 0, false); }

  // Délégation des clics
  document.addEventListener("click", function (ev) {
    var t = ev.target, a;
    if ((a = t.closest("[data-open]"))) { ev.preventDefault(); openP(a.getAttribute("data-open"), a); return; }
    if (t.closest("[data-close]")) { ev.preventDefault(); closeP(); return; }
    if ((a = t.closest("[data-pnav]"))) { ev.preventDefault(); stepP(Number(a.getAttribute("data-pnav"))); return; }
    if ((a = t.closest("[data-zoom]"))) { ev.preventDefault(); setZoom(zi + Number(a.getAttribute("data-zoom"))); return; }
    if ((a = t.closest(".cm-zoom")) && panel && panel.contains(a)) { setZoom(zi ? 0 : 1); return; }
    if ((a = t.closest("[data-go]"))) { ev.preventDefault(); go(Number(a.getAttribute("data-go")) - 1, true); return; }
    if ((a = t.closest("[data-room-nav]"))) { ev.preventDefault(); go(rc + Number(a.getAttribute("data-room-nav")), true); }
  });
  var zoomBox = panel && $(".cm-zoom", panel);
  if (zoomBox) zoomBox.addEventListener("pointermove", function (e) { if (!zi) return; var r = zoomBox.getBoundingClientRect(); $(".cm-zoom-in", panel).style.transformOrigin = Math.round((e.clientX - r.left) / r.width * 100) + "% " + Math.round((e.clientY - r.top) / r.height * 100) + "%"; });

  // Clavier
  document.addEventListener("keydown", function (ev) {
    var tag = (ev.target.tagName || "").toLowerCase(); if (tag === "input" || tag === "textarea" || tag === "select") return;
    var open = b.classList.contains("cm-open");
    if (open) {
      if (ev.key === "Escape") { ev.preventDefault(); closeP(); }
      else if (ev.key === "ArrowRight") { ev.preventDefault(); stepP(1); }
      else if (ev.key === "ArrowLeft") { ev.preventDefault(); stepP(-1); }
      else if (ev.key === "+" || ev.key === "=") { ev.preventDefault(); setZoom(zi + 1); }
      else if (ev.key === "-") { ev.preventDefault(); setZoom(zi - 1); }
      else if (ev.key === "0") { setZoom(0); }
      else if (ev.key === "Tab") {
        var f = $$("a[href],summary", panel).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); } else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); } else if (!panel.contains(document.activeElement)) { ev.preventDefault(); first.focus(); }
      }
    } else if (tour && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
      if (ev.key === "ArrowRight") { go(rc + 1, true); } else if (ev.key === "ArrowLeft") { go(rc - 1, true); }
    }
  });
})();
