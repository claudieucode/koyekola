/* Orbite — spotlight au curseur, compteurs, onglets, bascule mensuel/annuel, filtres. Sans dépendance ; simplifié si l'utilisateur préfère moins de mouvement. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "orbite") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var animOn = !reduce && b.getAttribute("data-pk-anim") !== "off";
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  b.classList.add("or-js");
  var fr = function (n, d) { return Number(n).toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };

  // Apparition au défilement
  if (animOn && "IntersectionObserver" in window) {
    b.classList.add("or-anim");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + "ms"; io.observe(el); });
  }

  // Pilule d'en-tête qui se réduit + inclinaison de la maquette au défilement
  var stage = document.querySelector("[data-stage]"), ticking = false;
  function onScroll() {
    ticking = false; var y = window.pageYOffset || 0;
    b.classList.toggle("or-scrolled", y > 24);
    if (stage && !reduce) stage.style.setProperty("--or-rx", String(Math.max(0, 9 - y / 55).toFixed(2)));
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Spotlight : le halo suit le curseur (variables CSS --mx / --my)
  var spotRaf = 0, last = null;
  document.addEventListener("pointermove", function (ev) {
    if (ev.pointerType === "touch") return;
    var el = ev.target && ev.target.closest ? ev.target.closest("[data-spot]") : null; if (!el) return;
    last = { el: el, x: ev.clientX, y: ev.clientY };
    if (!spotRaf) spotRaf = requestAnimationFrame(function () {
      spotRaf = 0; var r = last.el.getBoundingClientRect();
      last.el.style.setProperty("--mx", (last.x - r.left) + "px"); last.el.style.setProperty("--my", (last.y - r.top) + "px");
    });
  }, { passive: true });

  // Compteurs
  function countTo(el, to, dec, suf, from, ms) {
    if (!animOn) { el.textContent = fr(to, dec) + suf; return; }
    var t0 = null; (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / ms); el.textContent = fr(from + (to - from) * (1 - Math.pow(1 - p, 3)), dec) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now ? performance.now() : 0);
  }
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      var el = e.target, to = parseFloat(el.getAttribute("data-count")); if (isNaN(to)) return;
      countTo(el, to, parseInt(el.getAttribute("data-dec") || "0", 10), el.getAttribute("data-suffix") || "", 0, 1400);
    }); }, { threshold: 0.4 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // Bascule mensuel / annuel : change réellement les prix affichés
  $$("[data-pricing]").forEach(function (sc) {
    var tg = sc.querySelector(".or-toggle"); if (!tg) return;
    function set(m) {
      tg.classList.toggle("is-year", m === "y");
      $$("a[data-bill]", tg).forEach(function (a) { var on = a.getAttribute("data-bill") === m; a.classList.toggle("is-on", on); a.setAttribute("aria-pressed", on ? "true" : "false"); });
      $$("[data-m]", sc).forEach(function (el) {
        var v = el.getAttribute("data-" + m);
        if (el.classList.contains("or-amt")) { var from = parseFloat(el.textContent) || 0; countTo(el, parseFloat(v), 0, "", from, 450); } else el.textContent = v;
      });
    }
    $$("a[data-bill]", tg).forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); set(a.getAttribute("data-bill")); }); });
  });

  // Onglets des vues produit (tous les panneaux restent visibles sans JavaScript)
  $$(".or-tabs").forEach(function (tabs) {
    var scope = tabs.closest(".or-feat"), panels = $$("[data-panel]", scope);
    function show(id) {
      panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== id; });
      $$("a[data-tab]", tabs).forEach(function (x) { var on = x.getAttribute("data-tab") === id; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
    }
    $$("a[data-tab]", tabs).forEach(function (a, i, all) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); show(a.getAttribute("data-tab")); });
      a.addEventListener("keydown", function (ev) { var d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0; if (!d) return; ev.preventDefault(); var n = all[(i + d + all.length) % all.length]; n.focus(); show(n.getAttribute("data-tab")); });
    });
    show("t1");
  });

  // Filtres des ressources
  $$(".or-chips").forEach(function (chips) {
    var scope = chips.closest(".or-res"), cards = $$("[data-cat]", scope);
    $$("a[data-filter]", chips).forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault(); var f = a.getAttribute("data-filter");
        $$("a[data-filter]", chips).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        cards.forEach(function (c) { c.hidden = f !== "all" && c.getAttribute("data-cat") !== f; });
      });
    });
  });

  // Menu mobile : se referme au clic sur un lien ou avec Échap
  $$(".or-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") $$(".or-burger[open]").forEach(function (d) { d.open = false; }); });
})();
