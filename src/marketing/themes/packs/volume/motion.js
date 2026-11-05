/* Volume — révélations par masque (clip-path), titres ligne par ligne, filtre de projets, comparateur avant/après. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "volume") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Révélation : seulement si le mouvement est permis et l'option active ; sinon tout reste visible.
  if (!reduce && b.getAttribute("data-pk-anim") !== "off" && "IntersectionObserver" in window) {
    b.classList.add("vo-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    $$("[data-lines],[data-reveal]").forEach(function (el) { io.observe(el); });
    // Un élément masqué par clip-path n'est jamais « visible » pour l'observateur : on observe son parent.
    var mo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { $$("[data-mask]", e.target).concat(e.target.hasAttribute("data-mask") ? [e.target] : []).forEach(function (m) { m.classList.add("is-in"); }); mo.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });
    var seen = [];
    $$("[data-mask]").forEach(function (el) { var p = el.parentElement || el; if (seen.indexOf(p) < 0) { seen.push(p); mo.observe(p); } });
  }

  // Filtre des projets par typologie + redistribution des colonnes décalées
  var grids = $$(".vo-sel--all [data-cols]"), cards = [];
  grids.forEach(function (g) { $$(".vo-card", g).forEach(function (c) { cards.push(c); }); });
  function relayout() {
    if (!grids.length) return;
    var vis = cards.filter(function (c) { return !c.hidden; }), hid = cards.filter(function (c) { return c.hidden; });
    vis.forEach(function (c, i) { c.setAttribute("data-col", i % 3); grids[Math.floor(i / 3)].appendChild(c); });
    hid.forEach(function (c) { grids[grids.length - 1].appendChild(c); });
    grids.forEach(function (g, i) { var s = g.closest(".vo-sel"); if (s) s.hidden = i > 0 && i * 3 >= vis.length; });
  }
  $$(".vo-tabs").forEach(function (tabs) {
    $$("a[data-filter]", tabs).forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var f = a.getAttribute("data-filter"), n = 0;
        $$("a[data-filter]", tabs).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        $$("[data-type]").forEach(function (el) { var show = f === "all" || el.getAttribute("data-type") === f; el.hidden = !show; if (show && el.classList.contains("vo-card")) { n++; el.classList.add("is-in"); } });
        relayout(document);
        var c = document.querySelector("[data-count]"); if (c) c.textContent = n;
      });
    });
  });

  // Comparateur avant / après : glisser, flèches du clavier, boutons
  $$("[data-ba]").forEach(function (box) {
    var h = box.querySelector(".vo-ba-h"), sw = box.parentNode.querySelectorAll("[data-ba-set]"), pct = 50, drag = false;
    function set(p) {
      pct = Math.max(0, Math.min(100, p)); box.style.setProperty("--p", pct + "%");
      h.style.setProperty("--bw", (box.clientWidth * (pct - 50) / 50 * 0.5 * 2 - 0) + "px");
      h.style.left = "50%"; h.style.transform = "translateX(" + (box.clientWidth * (pct - 50) / 100) + "px)";
      h.setAttribute("aria-valuenow", Math.round(pct));
      Array.prototype.forEach.call(sw, function (a) { a.classList.toggle("is-on", Number(a.getAttribute("data-ba-set")) === Math.round(pct)); });
    }
    function from(ev) { var r = box.getBoundingClientRect(); set((ev.clientX - r.left) / r.width * 100); }
    box.addEventListener("pointerdown", function (ev) { drag = true; try { box.setPointerCapture(ev.pointerId); } catch (e) {} from(ev); });
    box.addEventListener("pointermove", function (ev) { if (drag) from(ev); });
    box.addEventListener("pointerup", function () { drag = false; }); box.addEventListener("pointercancel", function () { drag = false; });
    h.addEventListener("click", function (ev) { ev.preventDefault(); });
    h.addEventListener("keydown", function (ev) {
      var k = ev.key, d = k === "ArrowLeft" || k === "ArrowDown" ? -5 : k === "ArrowRight" || k === "ArrowUp" ? 5 : 0;
      if (k === "Home") { ev.preventDefault(); set(0); } else if (k === "End") { ev.preventDefault(); set(100); } else if (d) { ev.preventDefault(); set(pct + d); }
    });
    Array.prototype.forEach.call(sw, function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); set(Number(a.getAttribute("data-ba-set"))); }); });
    window.addEventListener("resize", function () { set(pct); });
    set(50);
  });

  // Menu mobile : se referme après un clic
  $$(".vo-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
})();
