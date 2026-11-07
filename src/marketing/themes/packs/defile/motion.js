/* Défilé — comportements : identifiants posés depuis data-sec, défilement doux, section active (rampe et menu), progression de lecture, compteurs, filtre des réalisations. */
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "defile") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, e) { return (e || document).querySelector(s); };
  var $$ = function (s, e) { return Array.prototype.slice.call((e || document).querySelectorAll(s)); };

  // Les blocs HTML du Page Builder n'acceptent pas d'identifiant : on les pose ici
  var secs = $$("[data-sec]");
  secs.forEach(function (s) { s.id = s.getAttribute("data-sec"); });
  var offset = function () { var h = $(".df-head"); return (h && getComputedStyle(h).position !== "static" ? h.offsetHeight : 0) + 8; };
  var scrollTo = function (id, smooth) { var t = document.getElementById(id); if (!t) return false; var y = t.getBoundingClientRect().top + window.pageYOffset - offset(); window.scrollTo({ top: y, behavior: smooth && !reduce ? "smooth" : "auto" }); return true; };
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("[data-go]"); if (!a) return;
    var id = a.getAttribute("data-go");
    if (document.getElementById(id) && document.querySelector("[data-sec]")) { ev.preventDefault(); history.replaceState(null, "", "#" + id); scrollTo(id, true); var d = a.closest("details"); if (d) d.open = false; }
  });
  if (location.hash.length > 1) setTimeout(function () { scrollTo(location.hash.slice(1), false); }, 60);

  // Section active
  var links = $$("[data-go],[data-rail]");
  var mark = function (id) { links.forEach(function (a) { var k = a.getAttribute("data-rail") || a.getAttribute("data-go"); a.classList.toggle("is-on", k === id); }); };
  if (secs.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) mark(e.target.getAttribute("data-sec")); }); }, { rootMargin: "-40% 0px -55% 0px" });
    secs.forEach(function (s) { io.observe(s); });
  }

  // Progression de lecture
  var bar = $("[data-prog]");
  if (bar) {
    var tick = function () { var h = document.documentElement, max = h.scrollHeight - h.clientHeight; bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")"; };
    window.addEventListener("scroll", tick, { passive: true }); window.addEventListener("resize", tick); tick();
  }

  // Compteurs au premier affichage
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !reduce) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = +el.getAttribute("data-count"), t0 = null;
        (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // Réalisations : filtre par type
  var works = $("[data-works]");
  if (works) {
    var cards = $$(".df-pc", works), n = $("[data-n]", works), empty = $("[data-empty]", works);
    var f = function (v) {
      var c = 0; cards.forEach(function (p) { var ok = v === "all" || p.getAttribute("data-t") === v; p.hidden = !ok; if (ok) c++; });
      if (n) n.textContent = c; if (empty) empty.classList.toggle("is-on", c === 0);
      $$(".df-chip", works).forEach(function (a) { var on = a.getAttribute("data-v") === v; a.classList.toggle("is-on", on); a.setAttribute("aria-pressed", on ? "true" : "false"); });
    };
    works.addEventListener("click", function (ev) { var a = ev.target.closest && ev.target.closest(".df-chip"); if (!a) return; ev.preventDefault(); history.replaceState(null, "", a.getAttribute("href")); f(a.getAttribute("data-v")); });
    var m = /^#type-(\w+)$/.exec(location.hash); f(m ? m[1] : "all");
  }
})();
