/* Amorce — mèche qui brûle avec la lecture, compte à rebours réel, apparition douce, recherche dans les notes. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "amorce") return;
  var one = function (s, r) { return (r || document).querySelector(s); };
  var all = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  b.classList.add("am-js");

  // Mèche : part de la page déjà lue
  var burn = function () {
    var h = document.documentElement, max = h.scrollHeight - window.innerHeight, p = max > 0 ? Math.min(1, Math.max(0.02, window.scrollY / max)) : 0.02;
    b.style.setProperty("--am-p", p.toFixed(4));
  };
  window.addEventListener("scroll", burn, { passive: true }); window.addEventListener("resize", burn); burn();

  // Compte à rebours réel vers l'heure de lancement
  var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
  var boxes = all("[data-am-countdown]"), days = one("[data-am-days]");
  if (boxes.length || days) {
    var end = new Date((boxes[0] && boxes[0].getAttribute("data-am-countdown")) || "2026-12-14T09:00:00+01:00").getTime();
    var tick = function () {
      var s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      boxes.forEach(function (bx) {
        var set = function (u, v) { var el = one('[data-u="' + u + '"]', bx); if (el) el.textContent = v; };
        set("d", pad(Math.floor(s / 86400))); set("h", pad(Math.floor(s % 86400 / 3600))); set("m", pad(Math.floor(s % 3600 / 60))); set("s", pad(s % 60));
      });
      if (days) days.textContent = Math.ceil(s / 86400);
      if (!s) { clearInterval(t); all(".am-mini").forEach(function (m) { m.textContent = "C'est lancé"; }); }
    };
    tick(); var t = setInterval(tick, reduce ? 30000 : 1000);
  }

  // Apparition douce des stations
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    all("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + "ms"; io.observe(el); });
  } else { all("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); }); }

  // Recherche dans les notes (?q=) avec état « aucun résultat »
  var idx = one("[data-am-index]");
  if (idx) {
    var items = all(".am-note", idx), empty = one("[data-am-empty]"), rc = one("[data-am-rcount]"), qs = "";
    try { qs = new URLSearchParams(location.search).get("q") || ""; } catch (e) {}
    var inp = one(".lp-main input[type=search], .lp-main input[name=q]");
    var run = function (val) {
      var q = norm(val).split(/\s+/).filter(Boolean), n = 0;
      items.forEach(function (li) { var ok = q.every(function (w) { return norm(li.getAttribute("data-s")).indexOf(w) >= 0; }); li.hidden = !ok; if (ok) n++; });
      if (rc) rc.textContent = q.length ? n + " résultat" + (n > 1 ? "s" : "") + " pour « " + val + " »" : "Saisissez un mot dans la recherche, ou parcourez les notes.";
      if (empty) { empty.hidden = !(q.length && !n); var s = one("[data-am-q]", empty); if (s) s.textContent = val; }
    };
    if (qs) { run(qs); if (inp && !inp.value) inp.value = qs; }
    if (inp) inp.addEventListener("input", function () { run(inp.value); });
  }
})();
