// Mandat — comportements du thème : estimateur de mission (calcul en direct), grille de créneaux de rendez-vous (jours ouvrés réels), filtre des missions, bascule d'étude de cas,
// compteurs de chiffres. Aucune dépendance ; sans script, la page reste lisible et chaque lien fonctionne.
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "mandat") return;
  var body = document.body;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ") + " €"; };
  var tt;
  function toast(m) { var t = $(".md-toast"); if (!t) { t = document.createElement("div"); t.className = "md-toast"; t.setAttribute("role", "status"); body.appendChild(t); } t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 2400); }

  // ----- révélation et compteurs -----
  if (!calm && "IntersectionObserver" in window) {
    body.classList.add("md-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (n) { if (n.getBoundingClientRect().top < window.innerHeight) n.classList.add("is-in"); else io.observe(n); });
    setTimeout(function () { $$("[data-reveal]").forEach(function (n) { n.classList.add("is-in"); }); }, 2500);
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = +el.getAttribute("data-count"), suf = el.getAttribute("data-suf") || "", t0 = null;
        (function step(t) { if (t0 === null) t0 = t; var p = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: .5 });
    $$("[data-count]").forEach(function (n) { co.observe(n); });
  }

  // ----- filtre des missions -----
  var fil = $("[data-filters]");
  if (fil) {
    var items = $$(".md-m"), empty = $("[data-empty]");
    var cur = "";
    var apply = function () {
      var n = 0;
      items.forEach(function (it) { var ok = !cur || it.getAttribute("data-sect") === cur; it.hidden = !ok; if (ok) n++; });
      $$(".md-chip", fil).forEach(function (c) { var v = c.getAttribute("data-sect"); var on = (v === "tous" ? "" : v) === cur; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      if (empty) empty.hidden = n > 0;
    };
    var fromHash = function () { var h = (location.hash || "").slice(1); cur = h && h !== "tous" && $("[data-sect='" + h + "']", fil) ? h : ""; };
    fromHash(); apply();
    fil.addEventListener("click", function (ev) { var c = ev.target.closest && ev.target.closest(".md-chip"); if (!c) return; ev.preventDefault(); var v = c.getAttribute("data-sect"); cur = v === "tous" ? "" : v; try { history.replaceState(null, "", cur ? "#" + cur : location.pathname); } catch (e) {} apply(); });
    window.addEventListener("hashchange", function () { fromHash(); apply(); });
  }

  // ----- étude de cas : affichage selon l'adresse -----
  var cs = $("[data-case]");
  if (cs) {
    var store = $("[data-data]");
    var show = function () {
      var h = (location.hash || "").slice(1), a = h && store ? $("[data-slug='" + h + "']", store) : null;
      if (!a) return;
      $("[data-m-title]").textContent = a.getAttribute("data-title"); $("[data-m-ctx]").textContent = a.getAttribute("data-ctx"); $("[data-m-ctx2]").textContent = a.getAttribute("data-ctx");
      $("[data-m-sect]").textContent = "Mission · " + a.getAttribute("data-sect"); $("[data-m-k]").textContent = a.getAttribute("data-k"); $("[data-m-kl]").textContent = a.getAttribute("data-kl");
      $("[data-m-res]").textContent = a.getAttribute("data-res") + ". Les chiffres sont suivis chaque mois par la direction, avec le tableau remis en fin de mission.";
      var ol = $("[data-m-steps]"); ol.innerHTML = "";
      $$("p", a).forEach(function (p, i) { var li = document.createElement("li"), b = document.createElement("b"), s = document.createElement("span"); b.textContent = "Étape " + (i + 1); s.textContent = p.textContent; li.appendChild(b); li.appendChild(s); ol.appendChild(li); });
      document.title = a.getAttribute("data-title");
    };
    show(); window.addEventListener("hashchange", show);
  }

  // ----- estimateur -----
  var est = $("[data-est]"), st = { tjm: 780, type: "Diagnostic", days: 2, urg: false, site: false }, summary = {};
  if (est) {
    var calc = function () {
      var base = st.tjm * st.days, rem = st.days >= 20 ? .10 : st.days >= 10 ? .05 : 0;
      var ht = base * (1 - rem); if (st.urg) ht += base * .15; if (st.site) ht += 60 * st.days;
      summary = { ht: ht, ttc: ht * 1.2 };
      $("[data-ht]", est).textContent = fmt(ht); $("[data-ttc]", est).textContent = fmt(ht * 1.2);
      $("[data-rem]", est).textContent = "environ " + fmt(ht / st.days) + " HT par jour" + (rem ? " (remise de " + Math.round(rem * 100) + " % incluse)" : "");
      $("[data-days]", est).textContent = st.days; updatePick();
    };
    est.addEventListener("click", function (ev) {
      var o = ev.target.closest && ev.target.closest(".md-opt, .md-s"); if (!o) return; ev.preventDefault();
      if (o.hasAttribute("data-type")) { $$("[data-type]", est).forEach(function (n) { n.classList.remove("is-on"); n.setAttribute("aria-pressed", "false"); }); o.classList.add("is-on"); o.setAttribute("aria-pressed", "true"); st.tjm = +o.getAttribute("data-tjm"); st.type = o.firstChild.textContent; }
      else if (o.hasAttribute("data-opt")) { var on = !o.classList.contains("is-on"); o.classList.toggle("is-on", on); o.setAttribute("aria-pressed", on ? "true" : "false"); if (o.getAttribute("data-opt") === "urgence") st.urg = on; else st.site = on; }
      else if (o.hasAttribute("data-d")) st.days = Math.max(1, Math.min(30, st.days + (+o.getAttribute("data-d"))));
      calc();
    });
  }

  // ----- créneaux de rendez-vous -----
  var sl = $("[data-slots]");
  var picked = "";
  function updatePick() {
    var p = $("[data-pick]"); if (!p) return;
    if (!picked) { p.textContent = "Aucun créneau choisi."; return; }
    var on = $("[data-type].is-on"), txt = "Rendez-vous souhaité : " + picked + " (30 minutes, visioconférence).";
    if (est && summary.ht) txt += " Estimation : " + fmt(summary.ht) + " HT, " + (on ? on.firstChild.textContent : "") + ", " + st.days + " jour(s).";
    p.textContent = txt;
  }
  if (sl) {
    var grid = $("[data-grid]", sl), d = new Date(), n = 0, hours = ["9 h 30", "11 h", "14 h 30", "16 h"];
    d.setHours(12, 0, 0, 0);
    while (n < 10) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      var box = document.createElement("div"), b = document.createElement("b"), label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      box.className = "md-day"; b.textContent = label; box.appendChild(b);
      var doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
      hours.forEach(function (h, i) {
        var a = document.createElement("a"); a.className = "md-slot"; a.href = "#creneau"; a.setAttribute("role", "button"); a.setAttribute("data-when", label + " à " + h);
        var full = (doy + i * 3) % 5 === 0; a.textContent = full ? h + " (complet)" : h; if (full) { a.className += " is-full"; a.setAttribute("aria-disabled", "true"); }
        box.appendChild(a);
      });
      grid.appendChild(box); n++;
    }
    sl.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest(".md-slot"); if (a && !a.classList.contains("is-full")) { ev.preventDefault(); $$(".md-slot", sl).forEach(function (x) { x.classList.remove("is-on"); }); a.classList.add("is-on"); picked = a.getAttribute("data-when"); updatePick(); return; }
      var c = ev.target.closest && ev.target.closest("[data-copy]");
      if (c) { ev.preventDefault(); if (!picked) { toast("Choisissez d'abord un créneau"); return; } var txt = $("[data-pick]").textContent; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast("Récapitulatif copié"); }, function () { toast("Copie impossible : sélectionnez le texte"); }); else toast("Copie impossible : sélectionnez le texte"); }
    });
  }
  if (est) calc();
})();
