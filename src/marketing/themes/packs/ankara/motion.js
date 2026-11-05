/* Ankara — carte, agenda filtrable, parcours, fiches artistes en panneau, révélations. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "ankara") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  b.classList.add("an-js");

  // Révélation au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("an-anim");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  }

  // Compteurs
  $$("[data-count]").forEach(function (el) {
    var to = parseInt(el.getAttribute("data-count"), 10); if (reduce || isNaN(to) || !("IntersectionObserver" in window)) return;
    var o = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; o.disconnect(); var t0 = null; (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now()); }, { threshold: 0.5 });
    o.observe(el);
  });

  // Carte de navigation
  var map = document.querySelector(".an-map");
  if (map) {
    var lock = function () { b.classList.toggle("an-lock", map.open); };
    map.addEventListener("toggle", lock);
    $$("a", map).forEach(function (a) { a.addEventListener("click", function () { map.open = false; }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && map.open) { map.open = false; map.querySelector("summary").focus(); } });
  }

  // Parallaxe douce du totem
  var depth = $$("[data-depth]");
  if (!reduce && depth.length && window.matchMedia("(pointer: fine)").matches) {
    var raf = 0;
    window.addEventListener("pointermove", function (e) {
      if (raf) return; raf = requestAnimationFrame(function () { raf = 0; var x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5; depth.forEach(function (d) { var k = +d.getAttribute("data-depth"); d.style.transform = "translate3d(" + (x * k).toFixed(1) + "px," + (y * k).toFixed(1) + "px,0)"; }); });
    });
  }

  // Agenda / mosaïque filtrables (discipline, ville, mois)
  $$(".an-fscope").forEach(function (sc) {
    var state = {}, items = $$("[data-item]", sc), out = sc.querySelector("[data-count-out]"), empty = sc.querySelector("[data-empty]"), unit = sc.getAttribute("data-unit") || "";
    function apply() {
      var n = 0, any = false;
      Object.keys(state).forEach(function (k) { if (state[k] !== "*") any = true; });
      items.forEach(function (it) {
        var ok = Object.keys(state).every(function (k) { return state[k] === "*" || it.getAttribute("data-" + k) === state[k]; });
        it.hidden = !ok; if (ok) n++;
      });
      sc.classList.toggle("is-filtering", any);
      if (out) out.textContent = n + " " + (n > 1 || unit === "rendez-vous" ? unit : unit.replace(/s$/, ""));
      if (empty) empty.classList.toggle("is-on", n === 0);
    }
    $$("[data-filter]", sc).forEach(function (a) {
      var g = a.getAttribute("data-filter"); if (!(g in state)) state[g] = "*";
      a.addEventListener("click", function (e) {
        e.preventDefault(); state[g] = a.getAttribute("data-val");
        $$('[data-filter="' + g + '"]', sc).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        apply();
      });
    });
    // Mon parcours
    var list = sc.querySelector("[data-trip-list]"), sum = sc.querySelector("[data-trip-sum]"), picks = {};
    function trip() {
      if (!list) return; var ids = Object.keys(picks).sort(function (x, y) { return picks[x].iso < picks[y].iso ? -1 : 1; });
      list.textContent = "";
      ids.forEach(function (id) { var li = document.createElement("li"); li.textContent = picks[id].when + " — " + picks[id].title + " (" + picks[id].city + ")"; list.appendChild(li); });
      var cities = {}; ids.forEach(function (id) { cities[picks[id].city] = 1; });
      var nc = Object.keys(cities).length;
      sum.textContent = ids.length ? ids.length + " rendez-vous dans " + nc + " ville" + (nc > 1 ? "s" : "") + " : de quoi remplir de belles soirées. Rien n'est réservé." : "Aucune date choisie. Touchez « + Mon parcours » sur un rendez-vous pour composer votre semaine de festival.";
    }
    $$("[data-pick]", sc).forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault(); var id = a.getAttribute("data-pick"), on = !picks[id];
        if (on) picks[id] = { title: a.getAttribute("data-title"), city: a.getAttribute("data-city"), when: a.getAttribute("data-when"), iso: a.closest("[data-iso]").getAttribute("data-iso") }; else delete picks[id];
        a.setAttribute("aria-pressed", on ? "true" : "false"); a.classList.toggle("is-on", on); trip();
      });
    });
  });

  // Fiche artiste en panneau
  var tiles = $$("[data-artist]"); if (!tiles.length) return;
  var panel = document.createElement("aside"); panel.className = "an-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", "Fiche de l'artiste"); panel.hidden = true;
  panel.innerHTML = '<div class="an-pbg"></div><div class="an-sheet" tabindex="-1"><button type="button" class="an-pclose" aria-label="Fermer la fiche">Fermer ✕</button><div class="an-pbody"></div><div class="an-pnav"><button type="button" data-d="-1">← Précédent</button><button type="button" data-d="1">Suivant →</button></div></div>';
  b.appendChild(panel);
  var sheet = panel.querySelector(".an-sheet"), body = panel.querySelector(".an-pbody"), cur = null, opener = null;
  function visible() { return tiles.filter(function (t) { return !t.closest("[data-item]").hidden; }); }
  function show(t) { cur = t; body.innerHTML = t.parentNode.querySelector(".an-fiche").innerHTML; sheet.scrollTop = 0; panel.setAttribute("aria-label", "Fiche de " + t.getAttribute("aria-label").replace("Ouvrir la fiche de ", "")); }
  function open(t) { opener = t; show(t); panel.hidden = false; b.classList.add("an-lock"); requestAnimationFrame(function () { panel.classList.add("is-open"); sheet.focus(); }); }
  function close() { panel.classList.remove("is-open"); b.classList.remove("an-lock"); setTimeout(function () { panel.hidden = true; }, reduce ? 0 : 260); if (opener) opener.focus(); }
  tiles.forEach(function (t) { t.addEventListener("click", function (e) { e.preventDefault(); open(t); }); });
  panel.addEventListener("click", function (e) {
    if (e.target.classList.contains("an-pbg") || e.target.classList.contains("an-pclose")) close();
    var d = e.target.getAttribute && e.target.getAttribute("data-d");
    if (d) { var v = visible(), i = v.indexOf(cur); show(v[(i + +d + v.length) % v.length]); sheet.focus(); }
  });
  document.addEventListener("keydown", function (e) {
    if (panel.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    if (e.key === "Tab") { var f = $$("button,a[href]", sheet).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return; var first = f[0], last = f[f.length - 1]; if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });
})();
