/* Pierre — filtres instantanés, bascule jour / soir, galerie, plan interactif, plan de ville. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "pierre") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function on(el, fn) { el.addEventListener("click", function (e) { e.preventDefault(); fn(el, e); }); }

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("pr-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  }

  // Compteurs
  var cs = $$("[data-count]");
  if (cs.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute("data-count"), 10); if (isNaN(to) || reduce) return;
        var t0 = null; requestAnimationFrame(function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1200); el.textContent = Math.max(1, Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); });
      });
    }, { threshold: 0.5 });
    cs.forEach(function (c) { co.observe(c); });
  }

  // Bascule jour / soir sur la fenêtre du hero
  $$("[data-daytoggle]").forEach(function (a) {
    on(a, function () { var w = a.closest(".pr-win"), n = w.classList.toggle("is-night"); a.setAttribute("aria-pressed", n ? "true" : "false"); });
  });

  // Filtres de biens (accueil : recherche rapide ; page Biens : filtres instantanés)
  var KEYS = { vendre: "mode", louer: "mode", maison: "type", appartement: "type", loft: "type", r1: "rooms", r3: "rooms", r4: "rooms", bs: "band", bm: "band", bl: "band" };
  var BAND = { bs: "s", bm: "m", bl: "l" };
  var fresh = function () { return { mode: "all", type: "all", band: "all", rooms: "all" }; };
  var state = fresh();
  var finderOnly = !document.querySelector(".pr-filters");
  var roots = $$("[data-finder], .pr-filters");
  var cards = $$(".pr-card[data-mode]").filter(function (c) { return !c.closest(".pr-feat"); });
  function paintChips() {
    roots.forEach(function (r) {
      $$(".pr-chip[data-g]", r).forEach(function (c) {
        var isOn = state[c.getAttribute("data-g")] === c.getAttribute("data-v");
        c.classList.toggle("is-on", isOn); c.setAttribute("aria-pressed", isOn ? "true" : "false");
      });
    });
  }
  function apply() {
    paintChips();
    var n = 0;
    cards.forEach(function (c) {
      var ok = (state.mode === "all" || c.getAttribute("data-mode") === state.mode) && (state.type === "all" || c.getAttribute("data-type") === state.type) &&
        (state.band === "all" || c.getAttribute("data-band") === state.band) && (state.rooms === "all" || c.getAttribute("data-rooms") === state.rooms);
      c.hidden = !ok; if (ok) n++;
    });
    $$("[data-gblock]").forEach(function (g) { g.hidden = !$$(".pr-card:not([hidden])", g).length; });
    var N = document.querySelector("[data-result-n]"), T = document.querySelector("[data-result-t]"), E = document.querySelector("[data-empty]");
    if (N) N.textContent = n; if (T) T.textContent = n > 1 ? "biens affichés" : "bien affiché"; if (E) E.hidden = n > 0;
    var go = document.querySelector("[data-finder-go]");
    if (go) { var h = []; ["mode", "type", "rooms"].forEach(function (k) { if (state[k] !== "all") h.push(state[k]); }); go.setAttribute("href", "/biens" + (h.length ? "#" + h.join("+") : "")); }
  }
  roots.forEach(function (r) {
    $$(".pr-chip[data-g]", r).forEach(function (c) { on(c, function () { state[c.getAttribute("data-g")] = c.getAttribute("data-v"); apply(); }); });
  });
  $$("[data-reset]").forEach(function (a) { on(a, function () { state = fresh(); apply(); }); });
  if (roots.length) {
    if (finderOnly) state.mode = "vendre";
    (location.hash || "").replace("#", "").split("+").forEach(function (t) { if (KEYS[t]) state[KEYS[t]] = BAND[t] || t; });
    apply();
  }

  // Conseils : filtre par thème
  $$("[data-tips]").forEach(function (root) {
    var chips = $$(".pr-chip", root), tips = $$(".pr-tip", root);
    chips.forEach(function (c) { on(c, function () { var v = c.getAttribute("data-v"); chips.forEach(function (x) { x.classList.toggle("is-on", x === c); }); tips.forEach(function (t) { t.hidden = v !== "all" && t.getAttribute("data-cat") !== v; }); }); });
  });

  // Fiche : galerie et plan
  $$("[data-gallery]").forEach(function (g) {
    var links = $$("[data-go]", g), slides = $$("[data-slide]", g);
    slides.forEach(function (s, i) { s.hidden = i !== 0; });
    links.forEach(function (a) { on(a, function () { var k = a.getAttribute("data-go"); links.forEach(function (x) { x.classList.toggle("is-on", x === a); }); slides.forEach(function (s) { s.hidden = s.getAttribute("data-slide") !== k; }); }); });
  });
  var plan = document.querySelector("[data-plan]");
  if (plan) {
    var rl = $$("[data-room]");
    var sync = function (id) { if (id) plan.setAttribute("data-on", id); else plan.removeAttribute("data-on"); };
    var pinned = function () { var p = rl.filter(function (x) { return x.classList.contains("is-on"); })[0]; return p ? p.getAttribute("data-room") : null; };
    rl.forEach(function (a) {
      var id = a.getAttribute("data-room");
      on(a, function () {
        var same = pinned() === id;
        rl.forEach(function (x) { x.classList.toggle("is-on", !same && x.getAttribute("data-room") === id); });
        sync(same ? null : id);
        var ps = document.querySelector('[data-slide="plan"]'), gal = document.querySelector('[data-go="plan"]');
        if (!same && ps && ps.hidden && gal) gal.click();
      });
      a.addEventListener("mouseenter", function () { sync(id); });
      a.addEventListener("mouseleave", function () { sync(pinned()); });
    });
  }

  // Plan des quartiers
  $$("[data-quartiers]").forEach(function (root) {
    var map = root.querySelector(".pr-qmap-plan"), links = $$("[data-q]", root), qc = $$("[data-qcard]", root);
    function show(i) { map.setAttribute("data-on", i); links.forEach(function (l) { l.classList.toggle("is-on", l.getAttribute("data-q") === i); }); qc.forEach(function (c) { c.hidden = c.getAttribute("data-qcard") !== i; }); }
    links.forEach(function (l) { on(l, function () { show(l.getAttribute("data-q")); }); });
    show("0");
  });

  // Menu mobile : se referme au clic
  $$(".pr-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
})();
