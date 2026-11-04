/* Atelier Nord — interactions : apparitions, filtres, compteurs, curseur-étiquette, sommaire d'étude de cas. Sans dépendance ; transform/opacity uniquement. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "atelier") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var head = document.querySelector(".at-head");
  function sizeHead() { if (head) b.style.setProperty("--at-headh", head.offsetHeight + "px"); }
  sizeHead(); window.addEventListener("resize", sizeHead);
  $$(".at-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Apparitions
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("at-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + "ms"; io.observe(el); });
  }

  // Filtres (projets, journal)
  $$(".at-filters").forEach(function (bar) {
    var scope = bar.parentNode, items = $$("[data-cat]", scope), empty = scope.querySelector(".at-empty");
    $$("a[data-filter]", bar).forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var k = a.getAttribute("data-filter"), n = 0;
        $$("a[data-filter]", bar).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        items.forEach(function (it) { var show = k === "tout" || it.getAttribute("data-cat") === k; it.classList.toggle("is-hidden", !show); if (show) { n++; it.classList.add("is-in"); } });
        if (empty) empty.hidden = n > 0;
      });
    });
  });

  // Compteurs
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !reduce) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "", pre = el.getAttribute("data-prefix") || "", t0 = null;
        if (isNaN(to)) return;
        (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1200); el.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // Curseur-étiquette sur les éléments [data-cursor]
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && !reduce && b.getAttribute("data-pk-cursor") !== "off") {
    var cur = document.createElement("div"); cur.className = "at-cursor"; cur.setAttribute("aria-hidden", "true"); cur.innerHTML = "<span></span>"; b.appendChild(cur);
    var lab = cur.firstChild, x = 0, y = 0, raf = 0;
    function paint() { cur.style.transform = "translate(" + x + "px," + y + "px)"; raf = 0; }
    document.addEventListener("mousemove", function (ev) {
      x = ev.clientX; y = ev.clientY; if (!raf) raf = requestAnimationFrame(paint);
      var t = ev.target && ev.target.closest ? ev.target.closest("[data-cursor]") : null;
      if (t) { lab.textContent = t.getAttribute("data-cursor"); cur.classList.add("is-on"); } else cur.classList.remove("is-on");
    }, { passive: true });
    document.addEventListener("mouseleave", function () { cur.classList.remove("is-on"); });
  }

  // Collage d'accueil : léger décalage au pointeur
  var col = document.querySelector("[data-parallax]");
  if (col && fine && !reduce) {
    var cards = $$(".at-card", col);
    col.addEventListener("mousemove", function (ev) {
      var r = col.getBoundingClientRect(), dx = (ev.clientX - r.left) / r.width - 0.5, dy = (ev.clientY - r.top) / r.height - 0.5;
      cards.forEach(function (c, i) { c.style.translate = (dx * (i + 1) * -14) + "px " + (dy * (i + 1) * -14) + "px"; });
    });
    col.addEventListener("mouseleave", function () { cards.forEach(function (c) { c.style.translate = ""; }); });
  }

  // Étude de cas : barre de lecture + sommaire
  var spy = $$("[data-spy]");
  if (spy.length) {
    var bar = document.createElement("div"); bar.className = "at-progress"; bar.setAttribute("aria-hidden", "true"); b.appendChild(bar);
    var secs = $$("[data-section]"), tick = 0;
    function upd() {
      tick = 0; var h = document.documentElement.scrollHeight - window.innerHeight, p = h > 0 ? window.scrollY / h : 0;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
      var cur2 = secs[0]; secs.forEach(function (s) { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) cur2 = s; });
      spy.forEach(function (a) { a.classList.toggle("is-on", !!cur2 && a.getAttribute("data-spy") === cur2.getAttribute("data-section")); });
    }
    window.addEventListener("scroll", function () { if (!tick) tick = requestAnimationFrame(upd); }, { passive: true }); upd();
    spy.forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); var s = document.querySelector('[data-section="' + a.getAttribute("data-spy") + '"]'); if (s) s.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }); });
  }
})();
