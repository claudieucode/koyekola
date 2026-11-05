/* Millésime — parallaxe des coteaux, jauges, filtre des cuvées, fiches et comparaison de millésimes, saisons de la vigne, demande de dégustation (rien n'est enregistré). */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "millesime") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  (document.querySelector(".lp-main") || b).classList.add("mv-js");
  function tap(list, fn) {
    list.forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); fn(a); });
      a.addEventListener("keydown", function (ev) { if (ev.key === " ") { ev.preventDefault(); fn(a); } });
    });
  }

  // Page courante dans l'étiquette de menu
  var seg = (location.pathname.replace(/\/+$/, "").split("/").pop() || "").toLowerCase();
  $$(".mv-list a,.mv-drawer li a").forEach(function (a) {
    var h = (a.getAttribute("href") || "").replace(/^\/+/, "").toLowerCase();
    if ((h === "" && (seg === "" || seg === "accueil" || seg === "demo")) || (h && h === seg)) a.setAttribute("aria-current", "page");
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var d = $(".mv-menu[open]"); if (d) { d.removeAttribute("open"); var s = $("summary", d); if (s) s.focus(); } } });

  // Apparition et jauges
  var items = $$("[data-reveal],.mv-gs");
  if (reduce || !("IntersectionObserver" in window)) items.forEach(function (el) { el.classList.add("is-in"); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.1 });
    items.forEach(function (el, i) { if (el.hasAttribute("data-reveal")) el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  }

  // Compteurs
  $$("[data-count]").forEach(function (el) {
    var to = parseInt(el.getAttribute("data-count"), 10); if (isNaN(to) || reduce || !("IntersectionObserver" in window)) return;
    var co = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; co.disconnect();
      var t0 = null; (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1300); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
    }, { threshold: 0.5 });
    co.observe(el);
  });

  // Parallaxe du panorama (transform uniquement)
  var hero = $(".mv-hero");
  if (hero && !reduce && b.getAttribute("data-pk-parallax") !== "off") {
    var layers = [[".mv-b1", .22, 8], [".mv-b2", .16, 14], [".mv-b3", .1, 22], [".mv-b4", .05, 34], [".mv-b5", 0, 0], [".mv-sun", .3, -10]].map(function (l) { return { el: $(l[0], hero), k: l[1], p: l[2] }; });
    var px = 0, want = false;
    function paint() {
      want = false; var y = Math.max(0, Math.min(window.pageYOffset, hero.offsetHeight));
      layers.forEach(function (l) { if (l.el) l.el.style.transform = "translate3d(" + (px * l.p).toFixed(1) + "px," + (y * l.k).toFixed(1) + "px,0)"; });
    }
    function ask() { if (!want) { want = true; requestAnimationFrame(paint); } }
    window.addEventListener("scroll", ask, { passive: true });
    hero.addEventListener("pointermove", function (e) { var r = hero.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - 0.5; ask(); });
    hero.addEventListener("pointerleave", function () { px = 0; ask(); });
    paint();
  }

  // Filtre des cuvées
  var fl = $(".mv-filters");
  if (fl) {
    var cards = $$("[data-list] .mv-cuvee"), nEl = $("[data-n]");
    tap($$("a", fl), function (a) {
      var f = a.getAttribute("data-f"), n = 0;
      $$("a", fl).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
      cards.forEach(function (c) { var show = f === "tous" || c.getAttribute("data-type") === f; c.hidden = !show; if (show) n++; });
      if (nEl) nEl.textContent = n;
    });
  }

  // Fiches millésimes : frise, mode seul ou comparaison
  var vint = $("[data-vint]");
  if (vint) {
    vint = document;
    var fiches = {}; $$(".mv-fiche", vint).forEach(function (f) { fiches[f.getAttribute("data-yr")] = f; });
    var frise = $$(".mv-frise a", vint), solo = $$("[data-solo]", vint), cmp = $("[data-cmp]", vint), slots = $(".mv-slots", vint);
    var st = { mode: "solo", cur: "2019", a: "2018", b: "2021", slot: "a" };
    var GL = ["Maturité", "Concentration", "Fraîcheur", "Charpente", "Longueur"], ADJ = ["mûr", "concentré", "frais", "charpenté", "long"];
    var g = function (y) { return fiches[y].getAttribute("data-g").split(",").map(Number); };
    var at = function (y, k) { return fiches[y].getAttribute("data-" + k); };
    function renderCmp() {
      var A = g(st.a), B = g(st.b);
      $$(".sa", vint).forEach(function (e) { e.textContent = st.a; }); $$(".sb", vint).forEach(function (e) { e.textContent = st.b; });
      $$(".mv-cmp-list li", cmp).forEach(function (li, i) {
        var ra = $(".mv-A .mv-gf", li), rb = $(".mv-B .mv-gf", li);
        ra.setAttribute("width", A[i]); rb.setAttribute("width", B[i]);
        $(".mv-A", li).setAttribute("aria-label", GL[i] + " " + st.a + " : " + A[i] + " sur 100"); $(".mv-B", li).setAttribute("aria-label", GL[i] + " " + st.b + " : " + B[i] + " sur 100");
        $(".va", li).textContent = A[i]; $(".vb", li).textContent = B[i];
      });
      ["st", "garde", "ap", "v", "rd"].forEach(function (k) { $('[data-c="' + k + '-a"]', cmp).textContent = at(st.a, k); $('[data-c="' + k + '-b"]', cmp).textContent = at(st.b, k); });
      var sum = $("[data-sum]", cmp), ba = 0, bb = 0, ia = -1, ib = -1;
      A.forEach(function (v, i) { var d = v - B[i]; if (d > ba) { ba = d; ia = i; } if (-d > bb) { bb = -d; ib = i; } });
      if (st.a === st.b) sum.textContent = "Le même millésime est choisi des deux côtés : touchez une autre année pour comparer.";
      else sum.textContent = (ia >= 0 ? "Le " + st.a + " est plus " + ADJ[ia] + " (+" + ba + " en " + GL[ia].toLowerCase() + ")" : "Le " + st.a + " ne prend l'avantage sur aucun critère") + (ib >= 0 ? " ; le " + st.b + " est plus " + ADJ[ib] + " (+" + bb + " en " + GL[ib].toLowerCase() + ")." : ".");
      $$(".mv-gs", cmp).forEach(function (s) { s.classList.add("is-in"); });
    }
    function paintFrise() {
      frise.forEach(function (a) {
        var y = a.getAttribute("data-y"), on = st.mode === "solo" ? y === st.cur : (y === st.a || y === st.b);
        a.classList.toggle("is-on", st.mode === "solo" && y === st.cur); a.classList.toggle("is-a", st.mode === "cmp" && y === st.a); a.classList.toggle("is-b", st.mode === "cmp" && y === st.b);
        if (st.mode === "cmp") a.classList.toggle("is-on", y === st.slotYear); a.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    function show() {
      var isCmp = st.mode === "cmp"; solo.forEach(function (e) { e.hidden = isCmp; }); cmp.hidden = !isCmp; slots.hidden = !isCmp;
      Object.keys(fiches).forEach(function (y) { fiches[y].classList.toggle("is-on", y === st.cur); });
      $$("a", slots).forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-slot") === st.slot); });
      st.slotYear = st.slot === "a" ? st.a : st.b; paintFrise(); if (isCmp) renderCmp();
    }
    tap($$(".mv-modes a", vint), function (a) {
      st.mode = a.getAttribute("data-mode"); $$(".mv-modes a", vint).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); }); show();
    });
    tap($$("a", slots), function (a) { st.slot = a.getAttribute("data-slot"); show(); });
    tap(frise, function (a) {
      var y = a.getAttribute("data-y");
      if (st.mode === "solo") st.cur = y; else { st[st.slot] = y; st.slot = st.slot === "a" ? "b" : "a"; }
      show();
    });
    show();
  }

  // Saisons de la vigne
  var sa = $("[data-saisons]");
  if (sa) {
    var tabs = $$(".mv-seasons a", sa), panels = $$(".mv-sp", sa), months = $$(".mv-months span", sa);
    function pick(i) {
      tabs.forEach(function (t, k) { t.classList.toggle("is-on", k === i); t.setAttribute("aria-selected", k === i ? "true" : "false"); });
      panels.forEach(function (p, k) { p.classList.toggle("is-on", k === i); });
      var ms = tabs[i].getAttribute("data-months").split(",").map(Number);
      months.forEach(function (m, k) { m.classList.toggle("is-on", ms.indexOf(k) > -1); });
    }
    tap(tabs, function (a) { pick(tabs.indexOf(a)); });
    var cur = new Date().getMonth(), start = 4;
    tabs.forEach(function (t, k) { if (t.getAttribute("data-months").split(",").map(Number).indexOf(cur) > -1) start = k; });
    pick(start);
  }

  // Demande de dégustation : récapitulatif pour le formulaire de contact
  var rs = $("[data-resa]");
  if (rs) {
    var S = { f: "Verticale · 1 h 30", fn: "Verticale", s: "Dim. 24 janvier, 11 h 00", p: 4 };
    var msg = $("[data-msg]", rs);
    function text() { return "Bonjour, je souhaite une dégustation « " + S.fn + " » (" + S.f.split(" · ")[1] + "), le " + S.s.charAt(0).toLowerCase() + S.s.slice(1) + ", pour " + S.p + " personnes. Pouvez-vous me confirmer la disponibilité ?"; }
    function refresh() {
      $('[data-r="f"]', rs).textContent = S.f; $('[data-r="s"]', rs).textContent = S.s; $('[data-r="p"]', rs).textContent = S.p + " personnes"; $("[data-pn]", rs).textContent = S.p; msg.textContent = text();
      $("[data-copied]", rs).textContent = "Rien n'est réservé ici : collez ce message dans le formulaire de contact, nous confirmons par courriel.";
    }
    function radio(sel, fn) { var l = $$(sel, rs); tap(l, function (a) { l.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-checked", on ? "true" : "false"); }); fn(a); refresh(); }); }
    radio(".mv-form", function (a) { S.fn = a.getAttribute("data-f"); S.f = S.fn + " · " + a.getAttribute("data-d"); });
    radio(".mv-slot", function (a) { S.s = a.getAttribute("data-s"); });
    tap($$("[data-pax]", rs), function (a) { S.p = Math.max(2, Math.min(12, S.p + Number(a.getAttribute("data-pax")))); refresh(); });
    tap($$("[data-copy]", rs), function () {
      var t = text(), note = $("[data-copied]", rs);
      function ok() { note.textContent = "Récapitulatif copié. Collez-le dans le message du formulaire de contact."; }
      var no = function () { var r = document.createRange(); r.selectNodeContents(msg); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); note.textContent = "Message sélectionné : copiez-le (Ctrl+C)."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, no); else no();
    });
    refresh();
  }
})();
