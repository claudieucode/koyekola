/* Le Verger — mouvement léger, sans dépendance. Respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "tiers") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  b.classList.add("tl-js");

  // Hauteur de l'en-tête (menu mobile) et page courante
  var head = document.querySelector(".tl-head");
  function sizeHead() { if (head) b.style.setProperty("--tl-headh", head.offsetHeight + 4 + "px"); }
  sizeHead(); window.addEventListener("resize", sizeHead);
  var path = location.pathname.replace(/\/+$/, "") || "/";
  $$(".tl-nv, .tl-dl").forEach(function (a) { var h = (a.getAttribute("href") || "").replace(/\/+$/, "") || "/"; if (h === path) a.setAttribute("aria-current", "page"); });
  $$(".tl-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Étiquettes et épingles placées en pourcentage sur le plan
  $$("[data-px]").forEach(function (el) { el.style.left = el.getAttribute("data-px") + "%"; el.style.top = el.getAttribute("data-py") + "%"; });

  // Apparition au défilement
  var revs = $$("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) { revs.forEach(function (e) { e.classList.add("is-in"); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    revs.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 70 + "ms"; io.observe(el); });
  }

  // Compteurs
  var cs = $$("[data-count]");
  if (cs.length && !reduce && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), t0 = null; if (isNaN(to)) return;
      (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
    }); }, { threshold: 0.5 });
    cs.forEach(function (c) { co.observe(c); });
  }

  // Filtres génériques (espaces, membres, événements, FAQ)
  $$("[data-fscope]").forEach(function (scope) {
    var btns = $$("[data-filter]", scope), items = $$("[data-fitems] > [data-cat]", scope), count = scope.querySelector("[data-fcount]"), empty = scope.querySelector("[data-fempty]");
    var unit = count ? count.textContent.replace(/^\d+\s*/, "") : "";
    btns.forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault(); var f = a.getAttribute("data-filter"), n = 0;
        btns.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        items.forEach(function (it) { var show = f === "all" || it.getAttribute("data-cat").split(" ").indexOf(f) > -1; it.hidden = !show; if (show) { n++; it.classList.add("is-in"); } });
        if (count) count.textContent = n + " " + (n < 2 ? unit.replace(/s$/, "").replace(/aux$/, "al").replace(/^événements$/, "événement") : unit);
        if (empty) empty.hidden = n > 0;
      });
    });
  });

  // Plan interactif : survol, clic, clavier
  $$("[data-plan]").forEach(function (box) {
    var links = $$("a[data-zone]", box), zs = $$("g[data-zone]", box), ds = $$("[data-zone-detail]", box);
    function select(z, focus) {
      links.forEach(function (a) { var on = a.getAttribute("data-zone") === z; a.classList.toggle("is-on", on); if (a.hasAttribute("aria-pressed")) a.setAttribute("aria-pressed", on ? "true" : "false"); });
      zs.forEach(function (g) { g.classList.toggle("is-on", g.getAttribute("data-zone") === z); });
      ds.forEach(function (d) { d.hidden = d.getAttribute("data-zone-detail") !== z; });
    }
    links.forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); select(a.getAttribute("data-zone")); });
      a.addEventListener("mouseenter", function () { select(a.getAttribute("data-zone")); });
      a.addEventListener("focus", function () { select(a.getAttribute("data-zone")); });
    });
    zs.forEach(function (g) { g.addEventListener("mouseenter", function () { select(g.getAttribute("data-zone")); }); g.addEventListener("click", function () { select(g.getAttribute("data-zone")); }); });
    var list = box.querySelector(".tl-zlist");
    if (list) list.addEventListener("keydown", function (ev) {
      var k = ev.key; if (k !== "ArrowRight" && k !== "ArrowLeft" && k !== "ArrowDown" && k !== "ArrowUp") return;
      var arr = $$("a", list), i = arr.indexOf(document.activeElement); if (i < 0) return; ev.preventDefault();
      arr[(i + (k === "ArrowRight" || k === "ArrowDown" ? 1 : arr.length - 1)) % arr.length].focus();
    });
    select("open");
  });

  // Simulateur de réservation (démonstration : rien n'est enregistré)
  $$("[data-sim]").forEach(function (sim) {
    var types = $$("[data-sim-type] a", sim), days = $$("[data-sim-days] a", sim), durs = $$("[data-sim-dur] a", sim);
    var nEl = sim.querySelector(".tl-n"), note = sim.querySelector("[data-cap-note]"), people = 1, summary = "";
    var $ = function (s) { return sim.querySelector(s); };
    function radio(group) {
      group.forEach(function (a) {
        a.addEventListener("click", function (ev) { ev.preventDefault(); group.forEach(function (x) { x.setAttribute("aria-checked", x === a ? "true" : "false"); }); calc(); });
        a.addEventListener("keydown", function (ev) {
          var k = ev.key, i = group.indexOf(a), j = -1;
          if (k === "ArrowRight" || k === "ArrowDown") j = (i + 1) % group.length; else if (k === "ArrowLeft" || k === "ArrowUp") j = (i + group.length - 1) % group.length; else if (k === " ") { ev.preventDefault(); a.click(); return; }
          if (j > -1) { ev.preventDefault(); group[j].focus(); group[j].click(); }
        });
      });
    }
    radio(types); radio(durs);
    days.forEach(function (a) {
      function tog(ev) { ev.preventDefault(); a.setAttribute("aria-checked", a.getAttribute("aria-checked") === "true" ? "false" : "true"); calc(); }
      a.addEventListener("click", tog); a.addEventListener("keydown", function (ev) { if (ev.key === " ") tog(ev); });
    });
    $$("[data-sim-people] a", sim).forEach(function (a) {
      function step(ev) { ev.preventDefault(); people += a.getAttribute("href") === "#plus" ? 1 : -1; calc(); }
      a.addEventListener("click", step); a.addEventListener("keydown", function (ev) { if (ev.key === " ") step(ev); });
    });
    function on(g) { return g.filter(function (a) { return a.getAttribute("aria-checked") === "true"; }); }
    function eur(n) { return Math.round(n).toLocaleString("fr-FR"); }
    function calc() {
      var t = on(types)[0], d = on(durs)[0], dd = on(days), cap = +t.getAttribute("data-cap"), r = +t.getAttribute("data-r");
      people = Math.max(1, Math.min(cap, people)); nEl.textContent = people;
      note.textContent = cap === 1 ? "Une personne par cabine" : cap + " personnes au maximum";
      var unit = t.getAttribute("data-mode") === "pp" ? r * people : r + Math.max(0, people - +t.getAttribute("data-from")) * +t.getAttribute("data-extra");
      var weeks = +d.getAttribute("data-w"), off = +d.getAttribute("data-off"), nd = dd.length;
      var total = unit * nd * weeks * (1 - off / 100), dnames = dd.map(function (a) { return a.getAttribute("data-v"); }).join(", ");
      $("[data-out-total]").textContent = nd ? eur(total) : "—";
      $("[data-out-sub]").textContent = nd ? "soit environ " + eur(total / weeks) + " € par semaine" + (off ? ", remise de " + off + " % incluse" : "") : "Choisissez au moins un jour.";
      $("[data-r-type]").textContent = t.getAttribute("data-v"); $("[data-r-days]").textContent = nd ? dnames + " (" + nd + " par semaine)" : "aucun";
      $("[data-r-people]").textContent = people; $("[data-r-dur]").textContent = d.getAttribute("data-v");
      summary = "Simulation du Verger (démonstration, aucune réservation).\nEspace : " + t.getAttribute("data-v") + "\nJours : " + (nd ? dnames : "à préciser") + "\nPersonnes : " + people + "\nDurée : " + d.getAttribute("data-v") + "\nEstimation : " + (nd ? eur(total) + " € HT" : "à préciser") + " (tarifs fictifs).";
    }
    var go = $("[data-sim-go]"), cp = $("[data-sim-copy]"), msg = $("[data-sim-msg]");
    if (go) go.addEventListener("click", function () { try { sessionStorage.setItem("tlRecap", summary); } catch (e) {} });
    if (cp) cp.addEventListener("click", function (ev) {
      ev.preventDefault();
      var ok = function () { msg.textContent = "Récapitulatif copié."; }, ko = function () { msg.textContent = "Copie impossible : sélectionnez le récapitulatif ci-dessus."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(summary).then(ok, ko); else ko();
    });
    calc();
  });

  // Formulaire de contact : reprise du récapitulatif du simulateur
  function prefill() { try { var rec = sessionStorage.getItem("tlRecap"), ta = document.querySelector(".lp-main textarea"); if (rec && ta) { if (!ta.value) ta.value = rec; sessionStorage.removeItem("tlRecap"); return true; } } catch (e) {} return false; }
  if (!prefill()) setTimeout(prefill, 1200);
})();
