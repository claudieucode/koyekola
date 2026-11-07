/* Socle — comportements : chiffres clés par exercice (recalcul réel), cartogramme de régions qui filtre le tableau des sites, filtre des actualités, sommaire de page. */
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "socle") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, e) { return (e || document).querySelector(s); };
  var $$ = function (s, e) { return Array.prototype.slice.call((e || document).querySelectorAll(s)); };
  var nf = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); };
  var pct = function (a, b) { var v = (a / b - 1) * 100; return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1).replace(".", ",") + " %"; };
  var Y = { 2022: { ca: 4120, rop: 410, eff: 14200, inv: 380, co2: 88, pays: 17 }, 2023: { ca: 4580, rop: 468, eff: 15100, inv: 420, co2: 81, pays: 18 }, 2024: { ca: 4870, rop: 512, eff: 15900, inv: 455, co2: 74, pays: 19 } };

  $$(".so-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Chiffres clés : choix de l'exercice, valeurs animées (sauf mouvement réduit), variation calculée
  var fin = $("[data-fin]");
  if (fin) {
    var cur = { ca: 0, rop: 0, eff: 0, inv: 0, co2: 0, pays: 0 }, raf = 0;
    var paint = function () { Object.keys(cur).forEach(function (k) { var e = $('[data-k="' + k + '"]', fin); if (e) e.textContent = nf(cur[k]); }); };
    var go = function (y) {
      var to = Y[y], from = {}; Object.keys(cur).forEach(function (k) { from[k] = cur[k]; });
      $$(".so-year", fin).forEach(function (a) { var on = a.getAttribute("data-y") === String(y); a.classList.toggle("is-on", on); a.setAttribute("aria-pressed", on ? "true" : "false"); });
      $$(".so-bar-c", fin).forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-y") === String(y)); });
      var l = $("[data-ylabel]", fin); if (l) l.textContent = y;
      var v = $("[data-var]", fin), prev = Y[y - 1];
      if (v) v.textContent = prev ? "Variation par rapport à " + (y - 1) + " : chiffre d'affaires " + pct(to.ca, prev.ca) + ", résultat opérationnel " + pct(to.rop, prev.rop) + ", effectifs " + pct(to.eff, prev.eff) + "." : "Premier exercice présenté : pas de variation à calculer.";
      cancelAnimationFrame(raf);
      if (reduce) { Object.keys(to).forEach(function (k) { cur[k] = to[k]; }); return paint(); }
      var t0 = null;
      (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - p, 3); Object.keys(to).forEach(function (k) { cur[k] = from[k] + (to[k] - from[k]) * e; }); paint(); if (p < 1) raf = requestAnimationFrame(step); })(performance.now());
    };
    cur = { ca: Y[2024].ca, rop: Y[2024].rop, eff: Y[2024].eff, inv: Y[2024].inv, co2: Y[2024].co2, pays: Y[2024].pays };
    fin.addEventListener("click", function (ev) { var a = ev.target.closest && ev.target.closest(".so-year"); if (!a) return; ev.preventDefault(); history.replaceState(null, "", a.getAttribute("href")); go(+a.getAttribute("data-y")); });
    var m = /^#exercice-(\d{4})$/.exec(location.hash); go(m && Y[m[1]] ? +m[1] : 2024);
  }

  // Implantations : le cartogramme filtre le tableau
  var sites = $("[data-sites]");
  if (sites) {
    var rows = $$("tbody tr", sites), n = $("[data-n]", sites), reg = "all";
    var apply = function () {
      var c = 0; rows.forEach(function (r) { var ok = reg === "all" || r.getAttribute("data-reg") === reg; r.hidden = !ok; if (ok) c++; });
      if (n) n.textContent = c;
      $$(".so-tile", sites).forEach(function (t) { var on = t.getAttribute("data-r") === reg; t.classList.toggle("is-on", on); t.setAttribute("aria-pressed", on ? "true" : "false"); });
    };
    sites.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a[href^='#region-']"); if (!a) return; ev.preventDefault();
      reg = a.hasAttribute("data-reset") ? "all" : (reg === a.getAttribute("data-r") ? "all" : a.getAttribute("data-r")); history.replaceState(null, "", "#region-" + reg); apply();
    });
    var h = /^#region-(\w+)$/.exec(location.hash); if (h) reg = h[1]; apply();
  }

  // Actualités : filtre par type
  var news = $("[data-news]");
  if (news) {
    var items = $$(".so-news", news), empty = $("[data-empty]", news);
    var f = function (v) {
      var c = 0; items.forEach(function (i) { var ok = v === "all" || i.getAttribute("data-cat") === v; i.hidden = !ok; if (ok) c++; });
      $$(".so-chip", news).forEach(function (a) { var on = a.getAttribute("data-v") === v; a.classList.toggle("is-on", on); a.setAttribute("aria-pressed", on ? "true" : "false"); });
      if (empty) empty.classList.toggle("is-on", c === 0);
    };
    news.addEventListener("click", function (ev) { var a = ev.target.closest && ev.target.closest(".so-chip"); if (!a) return; ev.preventDefault(); history.replaceState(null, "", a.getAttribute("href")); f(a.getAttribute("data-v")); });
    var t = /^#type-(\w+)$/.exec(location.hash); f(t ? t[1] : "all");
  }

  // Sommaire de page : défilement vers les titres marqués et lien actif
  var toc = $$(".so-toc a[href^='#']");
  if (toc.length) {
    var targets = {}; $$("[data-sec]").forEach(function (h) { targets[h.getAttribute("data-sec")] = h; });
    toc.forEach(function (a) { a.addEventListener("click", function (ev) { var h = targets[a.getAttribute("href").slice(1)]; if (!h) return; ev.preventDefault(); h.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) toc.forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("href") === "#" + e.target.getAttribute("data-sec")); }); }); }, { rootMargin: "-20% 0px -70% 0px" });
      Object.keys(targets).forEach(function (k) { io.observe(targets[k]); });
    }
  }

  // Copier le lien
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-copy-link]"); if (!b) return; ev.preventDefault();
    var done = function () { var t = b.textContent; b.textContent = "Lien copié ✓"; setTimeout(function () { b.textContent = t; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, done); else done();
  });
})();
