/* Boussole — itinéraire interactif, filtres, liste de contrôle, révélations. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "boussole") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fr = function (n) { return Number(n).toLocaleString("fr-FR"); };
  b.classList.add("bs-js");

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("bs-rv");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  }

  // Tracés : longueur réelle (les attributs pathLength / dasharray sont retirés par le filtre de sécurité)
  function len(p) { try { return Math.ceil(p.getTotalLength()) + 2; } catch (e) { return 0; } }
  var hr = $(".bs-hero-route"); if (hr && !reduce) { var hl = len(hr); if (hl) { hr.style.setProperty("--len", hl); hr.classList.add("bs-draw"); } }

  // Menu latéral : fermeture (Échap, clic à l'extérieur, clic sur un lien)
  var menu = $(".bs-menu");
  if (menu) {
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; var s = $("summary", menu); if (s) s.focus(); } });
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    $$(".bs-panel a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.open = false; }); });
  }

  // Compteurs
  var cs = $$("[data-count]");
  if (cs.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), sep = el.getAttribute("data-sep");
      var show = function (v) { el.textContent = sep ? fr(v) : v; };
      if (reduce || isNaN(to)) { show(to); return; }
      var t0 = null; (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1200); show(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); })(performance.now());
    }); }, { threshold: 0.4 });
    cs.forEach(function (c) { co.observe(c); });
  }

  // Filtres combinés (voyages, carnet)
  $$("[data-filterset]").forEach(function (set) {
    var items = $$("[data-item]", set), out = $("[data-fcount]", set), empty = $(".bs-empty", set), state = {};
    function apply() {
      var n = 0;
      items.forEach(function (it) {
        var ok = Object.keys(state).every(function (g) { return state[g] === "all" || it.getAttribute("data-" + g) === state[g]; });
        it.hidden = !ok; if (ok) n++;
      });
      if (out) out.textContent = n; if (empty) empty.classList.toggle("is-show", n === 0);
    }
    $$("[data-fg]", set).forEach(function (g) {
      var k = g.getAttribute("data-fg"); state[k] = "all";
      $$("a[data-v]", g).forEach(function (a) { a.addEventListener("click", function (ev) {
        ev.preventDefault(); state[k] = a.getAttribute("data-v");
        $$("a[data-v]", g).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); });
        apply();
      }); });
    });
  });

  // Itinéraire interactif
  $$("[data-it]").forEach(function (it) {
    var steps = $$("[data-step]", it), n = steps.length, cur = -1, pace = "s", timer = null;
    var segs = $$("[data-seg]", it), lens = [], mks = $$("[data-mk]", it), here = $("[data-here]", it), fut = $("[data-fut]", it), cur_ = $("[data-cur]", it), curd = $("[data-curd]", it);
    var o = {}; $$("[data-o]", it).forEach(function (e) { o[e.getAttribute("data-o")] = e; });
    var play = $('[data-act="play"]', it), a0 = parseInt(it.getAttribute("data-alt0"), 10);
    var d = function (s, k) { return parseFloat(s.getAttribute("data-" + k)); };
    function rest(i) { return pace === "t" ? Math.floor(i / 3) : 0; }
    function setPos(i) {
      var mx = i < 0 ? d(it, "m0x") : d(steps[i], "mx"), my = i < 0 ? d(it, "m0y") : d(steps[i], "my"), px = i < 0 ? d(it, "p0x") : d(steps[i], "px"), py = i < 0 ? d(it, "p0y") : d(steps[i], "py");
      if (here) here.style.transform = "translate(" + mx + "px," + my + "px)";
      if (cur_) { cur_.setAttribute("x1", px); cur_.setAttribute("x2", px); } if (curd) { curd.setAttribute("cx", px); curd.setAttribute("cy", py); }
      if (fut) { fut.setAttribute("x", px); fut.setAttribute("width", Math.max(0, 760 - px)); }
    }
    function sum() {
      var km = 0, up = 0, dy = 0, i, L = [];
      for (i = 0; i <= cur; i++) { km += d(steps[i], "km"); up += d(steps[i], "up"); dy += d(steps[i], "days"); L.push((i + 1) + ". " + steps[i].getAttribute("data-name") + " : " + d(steps[i], "km") + " km, +" + d(steps[i], "up") + " m, arrivée à " + d(steps[i], "alt") + " m"); }
      var totDays = 0; steps.forEach(function (s) { totDays += d(s, "days"); }); totDays += rest(n - 1);
      return { km: km, up: up, day: dy + rest(cur), tot: totDays, lines: L };
    }
    function text() {
      if (cur < 0) return "Aucune étape choisie pour l'instant. Cliquez sur une étape de la frise pour composer votre itinéraire.";
      var s = sum(), t = it.getAttribute("data-title");
      return "Demande d'itinéraire (démonstration)\nVoyage : " + t + "\nDépart : " + it.getAttribute("data-start") + "\nRythme : " + (pace === "t" ? "tranquille (journées de repos)" : "soutenu") + "\nÉtapes choisies : 1 à " + (cur + 1) + " sur " + n + "\n\n" + s.lines.join("\n") + "\n\nTotal : " + (Math.round(s.km * 10) / 10) + " km, +" + fr(s.up) + " m de dénivelé, " + s.day + " jour(s) de voyage" + (cur === n - 1 ? "" : " (voyage complet : " + s.tot + " jours)") + ".\nMessage : ";
    }
    function render() {
      var s = cur < 0 ? { km: 0, up: 0, day: 0, tot: 0 } : sum(), tot = 0; steps.forEach(function (x) { tot += d(x, "days"); }); tot += rest(n - 1);
      var set = function (k, v) { if (o[k]) o[k].textContent = v; };
      set("idx", cur + 1); set("name", cur < 0 ? it.getAttribute("data-start") : steps[cur].getAttribute("data-name"));
      set("txt", cur < 0 ? "Choisissez une étape dans la frise ci-dessous pour tracer l'itinéraire jusqu'à elle." : $(".bs-st-t", steps[cur]).textContent);
      set("alt", fr(cur < 0 ? a0 : d(steps[cur], "alt"))); set("km", fr(Math.round(s.km * 10) / 10)); set("up", fr(s.up)); set("day", cur < 0 ? 0 : s.day); set("tot", tot); set("sum", text());
    }
    function select(i, focus) {
      var prev = cur; cur = Math.max(-1, Math.min(n - 1, i));
      segs.forEach(function (sg, k) { sg.style.strokeDashoffset = k <= cur ? 0 : lens[k]; sg.style.transitionDelay = reduce ? "0s" : (cur > prev ? Math.max(0, k - prev - 1) * 0.12 : 0) + "s"; sg.classList.toggle("is-on", k <= cur); });
      mks.forEach(function (m, k) { m.classList.toggle("is-on", k <= cur + 1 && k > 0 || k === 0); });
      steps.forEach(function (s, k) { s.classList.toggle("is-on", k === cur); s.classList.toggle("is-past", k < cur); if (k === cur) s.setAttribute("aria-current", "step"); else s.removeAttribute("aria-current"); });
      setPos(cur); render(); if (focus && steps[cur]) steps[cur].focus();
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } if (play) { play.classList.remove("is-on"); play.textContent = "Lecture"; } }
    steps.forEach(function (s, i) { s.addEventListener("click", function (e) { e.preventDefault(); stop(); select(i); }); });
    $(".bs-steps", it).addEventListener("keydown", function (e) {
      var k = e.key, i = steps.indexOf(document.activeElement);
      if ((k === "ArrowRight" || k === "ArrowDown") && i < n - 1) { e.preventDefault(); stop(); select(i + 1, true); }
      else if ((k === "ArrowLeft" || k === "ArrowUp") && i > 0) { e.preventDefault(); stop(); select(i - 1, true); }
    });
    $$("[data-pace]", it).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); pace = a.getAttribute("data-pace"); $$("[data-pace]", it).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); }); render(); }); });
    var msg = o.msg, flash = function (t) { if (msg) { msg.textContent = t; setTimeout(function () { msg.textContent = ""; }, 3500); } };
    $$("[data-act]", it).forEach(function (a) { a.addEventListener("click", function (e) {
      var act = a.getAttribute("data-act"); if (act === "dl" || act === "copy" || act === "prev" || act === "next" || act === "play") e.preventDefault(); else return;
      if (act === "prev") { stop(); select(cur - 1); }
      else if (act === "next") { stop(); select(cur + 1); }
      else if (act === "play") {
        if (timer) { stop(); return; }
        if (cur >= n - 1) select(-1);
        play.classList.add("is-on"); play.textContent = "Pause";
        timer = setInterval(function () { if (cur >= n - 1) stop(); else select(cur + 1); }, 1800); select(cur + 1);
      } else if (act === "copy") {
        var t = text();
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { flash("Résumé copié : collez-le dans le formulaire de contact."); }, function () { flash("Copie impossible : sélectionnez le texte du résumé."); });
        else { var r = document.createRange(); r.selectNodeContents(o.sum); var sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(r); flash("Texte sélectionné : copiez-le (Ctrl+C)."); }
      } else if (act === "dl") {
        try { var blob = new Blob([text()], { type: "text/plain;charset=utf-8" }), u = URL.createObjectURL(blob), l = document.createElement("a"); l.href = u; l.download = "mon-itineraire-boussole.txt"; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 500); flash("Fichier téléchargé."); } catch (x) { flash("Téléchargement impossible."); }
      }
    }); });
    segs.forEach(function (sg, k) { lens[k] = len(sg); sg.style.strokeDasharray = lens[k]; });
    select(-1);
  });

  // Liste de contrôle du sac
  $$("[data-gear]").forEach(function (g) {
    var scope = g.closest(".bs-gear-in"), body = 70, tot = scope.querySelector("[data-gtot]"), bar = scope.querySelector("[data-gbar]"), box = bar.parentNode, tick = scope.querySelector("[data-gtick]"), msg = scope.querySelector("[data-gmsg]");
    function calc() {
      var w = 0; $$(".bs-gi.is-on", g).forEach(function (a) { w += parseFloat(a.getAttribute("data-w")) || 0; });
      var kg = w / 1000, ratio = kg / (body * 0.15);
      tot.textContent = kg.toFixed(1).replace(".", ",");
      bar.style.transform = "scaleX(" + Math.min(1, ratio) + ")"; box.classList.toggle("is-warn", ratio > 0.75 && ratio <= 1); box.classList.toggle("is-over", ratio > 1);
      msg.textContent = kg / body <= 0.10 ? "Confortable : " + Math.round(kg / body * 100) + " % de votre poids." : kg / body <= 0.15 ? "À la limite conseillée (" + Math.round(kg / body * 100) + " %). Allégez si possible." : "Trop lourd (" + Math.round(kg / body * 100) + " %) : retirez des objets.";
    }
    $$(".bs-gi", g).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var on = !a.classList.contains("is-on"); a.classList.toggle("is-on", on); a.setAttribute("aria-checked", on); calc(); }); a.addEventListener("keydown", function (e) { if (e.key === " ") { e.preventDefault(); a.click(); } }); });
    $$("[data-body]", scope).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); body = parseInt(a.getAttribute("data-body"), 10); $$("[data-body]", scope).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); }); calc(); }); });
    if (tick) tick.style.left = "66%"; calc();
  });
})();
