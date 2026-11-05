/* Cursus — surligneur, tampons, règle de lecture, onglets et filtres. Sans dépendance ; désactivé si l'on préfère moins de mouvement. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "cursus") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Hauteur de l'en-tête (menu mobile plein écran)
  var head = document.querySelector(".cu-head");
  function sizeHead() { if (head) b.style.setProperty("--cu-headh", head.offsetHeight + "px"); }
  sizeHead(); window.addEventListener("resize", sizeHead);
  $$(".cu-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Règle de lecture : avancement de la page dans l'en-tête
  var bar = document.querySelector(".cu-progress i");
  if (bar && !reduce) {
    var tick = false;
    var upd = function () { tick = false; var h = document.documentElement.scrollHeight - window.innerHeight; bar.style.setProperty("transform", "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0).toFixed(3) + ")"); };
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  }

  // Classe cu-js : n'apparaît qu'avec le JS ; le contenu reste visible en mouvement réduit
  b.classList.add("cu-ui");
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("cu-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms"; io.observe(el); });
    $$(".cu-hl,.cu-bars").forEach(function (el) { io.observe(el); });
  } else { $$(".cu-hl").forEach(function (el) { el.classList.add("is-in"); }); }

  // Compteurs
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "";
        if (reduce || isNaN(to)) { el.textContent = to + suf; return; }
        var t0 = null; function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1300); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // Onglets (choix d'un cursus)
  $$("[data-tabscope]").forEach(function (scope) {
    var tabs = $$("a[data-tab]", scope), panels = $$("[data-panel]", scope);
    tabs.forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        tabs.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        panels.forEach(function (p) {
          var on = p.getAttribute("data-panel") === a.getAttribute("data-tab"); p.classList.toggle("is-on", on);
          if (on) $$("[data-reveal]", p).forEach(function (el) { el.classList.add("is-in"); });
        });
      });
    });
  });

  // Filtres (programmes, enseignants, calendrier)
  $$("[data-fscope]").forEach(function (scope) {
    var items = $$("[data-item]", scope), out = scope.querySelector("[data-count-out]"), empty = scope.querySelector("[data-empty]"), state = {};
    function apply() {
      var n = 0;
      items.forEach(function (it) {
        var ok = Object.keys(state).every(function (g) { return state[g] === "tous" || (it.getAttribute("data-" + g) || "").split(" ").indexOf(state[g]) > -1; });
        it.classList.toggle("cu-off", !ok); if (ok) { n++; it.classList.add("is-in"); }
      });
      if (out) out.textContent = n;
      if (empty) empty.classList.toggle("cu-off", n > 0);
    }
    $$(".cu-filter", scope).forEach(function (f) {
      var g = f.getAttribute("data-group"); state[g] = "tous";
      $$("a[data-f]", f).forEach(function (a) {
        a.addEventListener("click", function (ev) {
          ev.preventDefault(); state[g] = a.getAttribute("data-f");
          $$("a[data-f]", f).forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-pressed", x === a ? "true" : "false"); });
          apply();
        });
      });
    });
  });

  // Plan du campus
  $$(".cu-map").forEach(function (scope) {
    var pins = $$("a[data-pin]", scope), places = $$("[data-place]", scope);
    pins.forEach(function (p) {
      p.addEventListener("click", function (ev) {
        ev.preventDefault(); var k = p.getAttribute("data-pin");
        pins.forEach(function (x) { x.classList.toggle("is-on", x === p); });
        places.forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-place") === k); });
      });
    });
  });

  // Léger mouvement des formes du hero au pointeur (souris seulement)
  var stage = document.querySelector(".cu-stage");
  if (stage && !reduce && window.matchMedia && window.matchMedia("(pointer:fine)").matches) {
    var art = stage.querySelector(".cu-art"), bu = stage.querySelector(".cu-bulletin");
    stage.addEventListener("pointermove", function (ev) {
      var r = stage.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
      if (art) art.style.transform = "translate(" + (x * -14).toFixed(1) + "px," + (y * -14).toFixed(1) + "px)";
      if (bu) bu.style.transform = "rotate(-4deg) translate(" + (x * 12).toFixed(1) + "px," + (y * 12).toFixed(1) + "px)";
    });
  }
})();
