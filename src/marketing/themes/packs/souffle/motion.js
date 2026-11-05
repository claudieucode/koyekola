/* Souffle — respiration guidée, planning filtrable, apparitions douces. Sans dépendance ; n'anime que transform/opacity ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "souffle") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Apparition douce (contenu visible sans JS ou en mouvement réduit)
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("so-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 90 + "ms"; io.observe(el); });
  }

  // Barre d'application : le menu « Plus » se ferme au choix d'un lien ou avec Échap
  $$(".so-more").forEach(function (d) {
    d.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a")) d.removeAttribute("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") d.removeAttribute("open"); });
  });

  // Les liens-boutons répondent aussi à la barre d'espace
  document.addEventListener("keydown", function (e) { var a = e.target; if (e.key === " " && a && a.getAttribute && a.getAttribute("role") === "button" && a.tagName === "A") { e.preventDefault(); a.click(); } });

  // Mot du hero synchronisé avec le souffle
  var lbl = document.querySelector("[data-hero-lbl]");
  if (lbl && !reduce) { var inh = false; setInterval(function () { inh = !inh; lbl.textContent = inh ? "Inspirez" : "Expirez"; }, 4500); }

  // Filtres (planning, ateliers, journal)
  $$("[data-so-filter]").forEach(function (root) {
    var st = {}, items = $$(".so-item", root), days = $$(".so-day", root), out = $$("[data-out]", root)[0];
    var one = root.getAttribute("data-one") || "résultat", many = root.getAttribute("data-many") || "résultats";
    function apply() {
      items.forEach(function (it) {
        var ok = true;
        for (var k in st) { if (k === "jour" || st[k] === "all") continue; if ((it.getAttribute("data-" + k) || "").split(" ").indexOf(st[k]) < 0) { ok = false; break; } }
        it.hidden = !ok;
        if (!ok) { var p = it.querySelector("[data-pick][aria-pressed=true]"); if (p) { p.setAttribute("aria-pressed", "false"); resetSum(); } }
      });
      var n = 0;
      days.forEach(function (d) {
        var show = !st.jour || st.jour === "all" || d.getAttribute("data-jour") === st.jour;
        d.hidden = !show;
        var vis = d.querySelectorAll(".so-item:not([hidden])").length;
        d.classList.toggle("is-empty", !vis);
        if (show) n += vis;
      });
      if (!days.length) n = items.filter(function (i) { return !i.hidden; }).length;
      if (out) out.textContent = n + " " + (n > 1 ? many : one);
    }
    function resetSum() { var s = $$("[data-sum]", root)[0]; if (!s) return; $$(".so-sum-empty", s)[0].hidden = false; $$(".so-sum-body", s)[0].hidden = true; }
    root.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-fk]");
      if (a) {
        e.preventDefault(); st[a.getAttribute("data-fk")] = a.getAttribute("data-fv");
        $$("a[data-fk=" + a.getAttribute("data-fk") + "]", root).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        apply(); return;
      }
      var p = e.target.closest && e.target.closest("a[data-pick]");
      if (p) {
        e.preventDefault();
        $$("[data-pick]", root).forEach(function (x) { x.setAttribute("aria-pressed", x === p ? "true" : "false"); });
        var s = $$("[data-sum]", root)[0]; if (!s) return;
        $$(".so-sum-empty", s)[0].hidden = true; $$(".so-sum-body", s)[0].hidden = false;
        $$("[data-s=title]", s)[0].textContent = p.getAttribute("data-title"); $$("[data-s=detail]", s)[0].textContent = p.getAttribute("data-detail");
        $$("[data-s=msg]", s)[0].textContent = p.getAttribute("data-msg");
      }
    });
    var go = $$("[data-s=go]", root)[0];
    if (go) go.addEventListener("click", function () {
      var m = $$("[data-s=msg]", root)[0].textContent;
      try { if (navigator.clipboard) navigator.clipboard.writeText(m); } catch (x) {}
    });
    apply();
  });

  // Choix de formule selon le rythme
  $$("[data-pick-box]").forEach(function (root) {
    var out = $$("[data-pick-out]", root)[0], cards = $$("[data-formule]", root);
    var map = { 0: ["unite", "Pour venir de temps en temps : le cours à l'unité, 18 € sans engagement."], 1: ["carnet", "Une fois par semaine : le carnet de 10 cours revient à 15 € le cours."], 2: ["mensuel", "Deux fois par semaine : la formule mensuelle revient à environ 10 € le cours."], 3: ["libre", "Trois fois ou plus : Souffle libre, à partir de 7 € le cours."] };
    root.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-rhythm]"); if (!a) return; e.preventDefault();
      var r = map[a.getAttribute("data-rhythm")];
      $$("a[data-rhythm]", root).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      cards.forEach(function (c) { c.classList.toggle("is-pick", c.getAttribute("data-formule") === r[0]); });
      out.textContent = r[1];
    });
  });

  // Respiration guidée
  var MODES = { coherence: [["Inspirez", 5, 1], ["Expirez", 5, 0]], carre: [["Inspirez", 4, 1], ["Retenez", 4, 1], ["Expirez", 4, 0], ["Retenez à vide", 4, 0]], "478": [["Inspirez", 4, 1], ["Retenez", 7, 1], ["Expirez", 8, 0]] };
  $$("[data-breath]").forEach(function (root) {
    var orb = $$(".so-orb", root)[0], ph = $$("[data-ph]", root)[0], cd = $$("[data-cd]", root)[0], live = $$("[data-live]", root)[0], go = $$("[data-bgo]", root)[0], cyc = $$("[data-cyc]", root)[0];
    var mode = "coherence", mins = 1, i = 0, left = 0, el = 0, cycles = 0, tk = null, state = "idle";
    function scale(up) { return "scale(" + (up ? 1 : 0.62) + ")"; }
    function setPhase(resume) {
      var p = MODES[mode][i];
      ph.textContent = p[0]; live.textContent = p[0] + ", " + p[1] + " secondes";
      if (!resume) left = p[1];
      cd.textContent = left;
      orb.style.transitionDuration = reduce || p[0].indexOf("Retenez") === 0 ? "0s" : left + "s";
      orb.style.transform = scale(p[2]);
    }
    function status() { cyc.textContent = cycles + (cycles > 1 ? " cycles" : " cycle") + " · " + el + " s sur " + mins * 60 + " s"; }
    function tick() {
      left--; el++;
      if (el >= mins * 60) { finish(); return; }
      if (left <= 0) { i = (i + 1) % MODES[mode].length; if (i === 0) cycles++; setPhase(false); } else cd.textContent = left;
      status();
    }
    function start() { state = "run"; go.textContent = "Pause"; setPhase(state === "paused"); clearInterval(tk); tk = setInterval(tick, 1000); }
    function pause() {
      state = "paused"; clearInterval(tk); go.textContent = "Reprendre";
      orb.style.transitionDuration = "0s"; orb.style.transform = getComputedStyle(orb).transform;
      live.textContent = "Pause";
    }
    function resume() { state = "run"; go.textContent = "Pause"; setPhase(true); tk = setInterval(tick, 1000); }
    function reset(txt) {
      clearInterval(tk); state = "idle"; i = 0; el = 0; cycles = 0; left = 0;
      orb.style.transitionDuration = reduce ? "0s" : "1.2s"; orb.style.transform = scale(0);
      ph.textContent = txt || "Prêt·e ?"; cd.innerHTML = "&nbsp;"; go.textContent = "Commencer"; cyc.textContent = "Aucun cycle pour l'instant.";
    }
    function finish() {
      var n = cycles + 1, t = el; reset("Merci");
      cyc.textContent = "Exercice terminé : " + n + " cycles en " + t + " secondes."; live.textContent = "Exercice terminé";
    }
    go.addEventListener("click", function (e) { e.preventDefault(); if (state === "idle") { i = 0; el = 0; cycles = 0; start(); } else if (state === "run") pause(); else resume(); });
    root.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-bm],a[data-bd]"); if (!a) return; e.preventDefault();
      var isMode = a.hasAttribute("data-bm");
      $$(isMode ? "a[data-bm]" : "a[data-bd]", root).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      if (isMode) mode = a.getAttribute("data-bm"); else mins = parseInt(a.getAttribute("data-bd"), 10);
      if (state !== "idle") reset();
    });
    orb.style.transform = scale(0);
  });
})();
