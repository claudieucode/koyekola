/* Étoile — bascule jour/nuit, carte du domaine, fiche, calendrier, récapitulatif. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "etoile") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var host = $(".lp-main") || b; host.classList.add("et-js");
  var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };

  // ---------- Jour / nuit ----------
  var start = b.getAttribute("data-pk-start") || "nuit", h = new Date().getHours();
  var mode = store("etoile-mode") || (start === "auto" ? (h >= 7 && h < 19 ? "jour" : "nuit") : start);
  function setMode(m) {
    mode = m; b.setAttribute("data-et-mode", m === "jour" ? "day" : "night");
    $$(".et-mode").forEach(function (a) { a.setAttribute("aria-checked", m === "nuit" ? "true" : "false"); });
    $$("[data-mode-t]").forEach(function (t) { t.textContent = m === "nuit" ? "Nuit" : "Jour"; });
    $$("[data-mode-btn]").forEach(function (a) { a.textContent = m === "nuit" ? "Faire se lever le jour" : "Faire tomber la nuit"; });
  }
  setMode(mode === "jour" ? "jour" : "nuit");
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest(".et-mode,[data-mode-btn]"); if (!a) return;
    ev.preventDefault(); setMode(mode === "nuit" ? "jour" : "nuit"); store("etoile-mode", mode);
  });

  // ---------- Apparition, compteurs, menu ----------
  if (!reduce && "IntersectionObserver" in window) {
    host.classList.add("et-rev");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
    $$("[data-count]").forEach(function (el) {
      var to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "";
      var o = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; o.disconnect(); var t0 = null;
        (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
      }, { threshold: 0.5 }); o.observe(el);
    });
  }
  $$(".et-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
  function go(name) { var t = $('[data-sec="' + name + '"]'); if (t && t.scrollIntoView) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
  document.addEventListener("click", function (ev) { var a = ev.target.closest && ev.target.closest("[data-anchor]"); if (a) { ev.preventDefault(); go(a.getAttribute("data-anchor")); } });

  // ---------- Onglets génériques (constellations, saisons) ----------
  $$("[data-tabs]").forEach(function (root) {
    var tabs = $$("[data-tab]", root), panes = $$("[data-pane]", root);
    tabs.forEach(function (t) {
      t.addEventListener("click", function (ev) {
        ev.preventDefault(); var k = t.getAttribute("data-tab");
        tabs.forEach(function (x) { var on = x === t; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        panes.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-pane") === k); });
      });
    });
  });

  // ---------- Filtre des activités ----------
  $$("[data-filterbox]").forEach(function (root) {
    var fl = $$("[data-cat]", $(".et-filters", root)), items = $$(".et-ac", root), out = $("[data-count-out]", root);
    fl.forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault(); var c = a.getAttribute("data-cat"), n = 0;
        fl.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        items.forEach(function (it) { var ok = c === "all" || it.getAttribute("data-cat").split(" ").indexOf(c) > -1; it.classList.toggle("is-out", !ok); if (ok) n++; });
        out.textContent = n + (n > 1 ? " activités" : " activité");
      });
    });
  });

  // ---------- 404 : un vœu ----------
  var wish = $("[data-wish]");
  if (wish) wish.addEventListener("click", function (ev) {
    ev.preventDefault(); var s = $("[data-wish-star]"), o = $("[data-wish-out]");
    if (s && !reduce) { s.classList.remove("is-go"); void s.getBoundingClientRect(); s.classList.add("is-go"); }
    if (o) o.textContent = "Une étoile a filé. Votre vœu est noté (et le chemin du retour, juste au-dessus).";
  });

  // ---------- Carte du domaine, fiche, séjour ----------
  var dom = $("[data-domain]"); if (!dom) return;
  var plan = $("[data-plan]"), spots = $$(".et-spot", dom), panel = $("[data-fiches]", dom), fiches = $$(".et-cat .et-fiche"), flts = $$("[data-flt]", dom), live = $("[data-live]", dom), cnt = $("[data-count-out]", dom);
  var cur = null, pers = 2, dIn = null, dOut = null, view = new Date(), now = new Date();
  now.setHours(0, 0, 0, 0); view = new Date(now.getFullYear(), now.getMonth(), 1);
  var F = (plan.getAttribute("data-f") || "").split(",").map(Number);
  var q = function (k) { return $('[data-r="' + k + '"]', plan); };
  var D = function (d) { return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); };

  function pick(id, quiet) {
    var f = fiches.filter(function (x) { return x.getAttribute("data-id") === id; })[0]; if (!f) return;
    cur = { id: id, cap: +f.getAttribute("data-cap"), base: +f.getAttribute("data-base"), extra: +f.getAttribute("data-extra"), name: f.getAttribute("data-name") };
    panel.innerHTML = ""; var cl = f.cloneNode(true); cl.classList.add("is-on"); panel.appendChild(cl);
    spots.forEach(function (s) { var on = s.getAttribute("data-id") === id; s.classList.toggle("is-on", on); if (on) s.setAttribute("aria-current", "true"); else s.removeAttribute("aria-current"); });
    if (pers > cur.cap) pers = cur.cap;
    if (!quiet && live) live.textContent = "Hébergement sélectionné : " + cur.name + ", " + cur.cap + " personnes au plus.";
    recap();
  }
  spots.forEach(function (s) { s.addEventListener("click", function (ev) { ev.preventDefault(); pick(s.getAttribute("data-id")); }); });

  flts.forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault(); var t = a.getAttribute("data-flt"), n = 0, first = null;
      flts.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      spots.forEach(function (s) { var ok = t === "all" || s.getAttribute("data-type") === t; s.classList.toggle("is-dim", !ok); if (ok) { n++; if (!first) first = s.getAttribute("data-id"); } });
      cnt.textContent = n + (n > 1 ? " hébergements" : " hébergement");
      var curSpot = spots.filter(function (s) { return s.getAttribute("data-id") === (cur && cur.id); })[0];
      if (first && curSpot && curSpot.classList.contains("is-dim")) pick(first);
    });
  });

  // Calendrier
  var cal = $("[data-cal]", plan), calT = $("[data-cal-title]", plan), help = $("[data-cal-help]", plan);
  var same = function (a, b2) { return a && b2 && a.getTime() === b2.getTime(); };
  function drawCal(focusT) {
    cal.innerHTML = ""; calT.textContent = view.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    ["L", "M", "M", "J", "V", "S", "D"].forEach(function (l, i) { var s = document.createElement("span"); s.className = "et-dh"; s.setAttribute("aria-hidden", "true"); s.textContent = l; cal.appendChild(s); });
    var first = (view.getDay() + 6) % 7, days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (var i = 0; i < first; i++) cal.appendChild(document.createElement("span"));
    for (var d = 1; d <= days; d++) {
      var dt = new Date(view.getFullYear(), view.getMonth(), d), a = document.createElement("a");
      a.className = "et-d"; a.href = "#jour"; a.textContent = d; a.setAttribute("data-t", dt.getTime()); a.setAttribute("aria-label", D(dt));
      if (dt < now) { a.classList.add("is-off"); a.setAttribute("aria-disabled", "true"); }
      if (same(dt, dIn) || same(dt, dOut)) { a.classList.add("is-in"); a.setAttribute("aria-pressed", "true"); }
      else if (dIn && dOut && dt > dIn && dt < dOut) a.classList.add("is-rg");
      cal.appendChild(a);
    }
    var prev = $('[data-cal-nav="-1"]', plan), next = $('[data-cal-nav="1"]', plan);
    prev.classList.toggle("is-off", view <= new Date(now.getFullYear(), now.getMonth(), 1));
    next.classList.toggle("is-off", view >= new Date(now.getFullYear(), now.getMonth() + 12, 1));
    if (focusT) { var f = $('[data-t="' + focusT + '"]', cal); if (f) f.focus(); }
  }
  cal.addEventListener("click", function (ev) {
    var a = ev.target.closest("a.et-d"); if (!a) return; ev.preventDefault();
    if (a.classList.contains("is-off")) return;
    var t = new Date(+a.getAttribute("data-t"));
    if (!dIn || dOut || t <= dIn) { dIn = t; dOut = null; } else dOut = t;
    drawCal(a.getAttribute("data-t")); recap();
  });
  cal.addEventListener("keydown", function (ev) {
    var a = ev.target.closest && ev.target.closest("a.et-d"); if (!a) return;
    var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[ev.key]; if (!step) return;
    ev.preventDefault(); var all = $$("a.et-d", cal), i = all.indexOf(a) + step;
    if (all[i]) all[i].focus();
  });
  $$("[data-cal-nav]", plan).forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); if (a.classList.contains("is-off")) return; view = new Date(view.getFullYear(), view.getMonth() + (+a.getAttribute("data-cal-nav")), 1); drawCal(); }); });

  // Voyageurs
  var ppn = $("[data-pp-n]", plan), ppc = $("[data-pp-cap]", plan);
  $$("[data-pp]", plan).forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); var n = pers + (+a.getAttribute("data-pp")); if (cur && n >= 1 && n <= cur.cap) { pers = n; recap(); } }); });

  // Récapitulatif
  var sum = $("[data-sum]", plan), send = $("[data-send]", plan), copy = $("[data-copy]", plan), text = "";
  var eur = function (n) { return n.toLocaleString("fr-FR") + " €"; };
  function recap() {
    if (!cur) return;
    var nights = dIn && dOut ? Math.round((dOut - dIn) / 864e5) : 0, total = 0, warn = "";
    for (var i = 0; i < nights; i++) { var d = new Date(dIn.getTime() + i * 864e5), f = F[d.getMonth()] || 1; total += Math.round(cur.base * f) + Math.max(0, pers - 2) * Math.round(cur.extra * f); }
    if (nights === 1) warn = "Séjour de deux nuits au minimum."; else if (!dIn) warn = ""; else if (!dOut) warn = "Choisissez maintenant votre jour de départ.";
    var ok = nights >= 2;
    $("[data-plan-unit]", plan).textContent = cur.name;
    ppn.textContent = pers; ppc.textContent = (cur.cap > 1 ? "1 à " + cur.cap : "1") + " personnes pour cet hébergement";
    $$("[data-pp]", plan).forEach(function (a) { var n = pers + (+a.getAttribute("data-pp")); a.classList.toggle("is-off", n < 1 || n > cur.cap); });
    q("unit").textContent = cur.name; q("in").textContent = dIn ? D(dIn) : "—"; q("out").textContent = dOut ? D(dOut) : "—";
    q("nights").textContent = nights ? nights : "—"; q("pers").textContent = pers; q("total").textContent = ok ? eur(total) : "—"; q("warn").textContent = warn;
    help.textContent = !dIn ? "Choisissez votre jour d'arrivée." : !dOut ? "Choisissez maintenant votre jour de départ." : nights + (nights > 1 ? " nuits" : " nuit") + " du " + dIn.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + " au " + dOut.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + ".";
    text = ok ? "Demande de séjour — Étoile Glamping\nHébergement : " + cur.name + "\nArrivée : " + D(dIn) + "\nDépart : " + D(dOut) + "\nNuits : " + nights + "\nVoyageurs : " + pers + "\nTotal indicatif : " + eur(total) + " (sans engagement)" : "";
    sum.textContent = text; sum.style.display = text ? "block" : "";
    send.setAttribute("href", text ? "/contact?message=" + encodeURIComponent(text) : "/contact");
  }
  copy.addEventListener("click", function (ev) {
    ev.preventDefault(); if (!text) { help.textContent = "Choisissez d'abord deux nuits ou plus."; return; }
    var done = function () { copy.textContent = "Copié !"; setTimeout(function () { copy.textContent = "Copier le récapitulatif"; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {}); else done();
  });

  drawCal();
  var hash = (location.hash || "").slice(1);
  pick(fiches.some(function (f) { return f.getAttribute("data-id") === hash; }) ? hash : "s1", true);
})();
