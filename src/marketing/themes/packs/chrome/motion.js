/* Chrome — reflet qui suit la souris, configurateur, comparateur, filtres et simulateur. Sans dépendance ; mouvement réduit respecté. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "chrome") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var eur = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, " ") + " €"; };
  var fr = function (n, d) { return Number(n).toFixed(d == null ? 0 : d).replace(".", ","); };
  var act = function (els, fn) { els.forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); fn(a, e); }); a.addEventListener("keydown", function (e) { if (e.key === " ") { e.preventDefault(); a.click(); } }); }); };

  // Apparition au défilement (le contenu reste visible sans JS ou en mouvement réduit)
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("cr-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = Math.min(i % 4, 3) * 80 + "ms"; io.observe(el); });
  }

  // Reflet : suit le pointeur, sinon glisse avec le défilement
  var stages = $$("[data-stage]"), used = false, raf = 0, px = 0, py = 0;
  function set(st, x, y) { st.style.setProperty("--mx", x + "%"); st.style.setProperty("--my", y + "%"); }
  function byScroll() {
    stages.forEach(function (st) { var r = st.getBoundingClientRect(), h = window.innerHeight, p = Math.min(1, Math.max(0, (h - r.top) / (h + r.height))); set(st, Math.round(10 + 80 * p), 36); });
  }
  stages.forEach(function (st) { set(st, 62, 38); });
  if (!reduce) {
    byScroll();
    window.addEventListener("scroll", function () { if (!used && !raf) raf = requestAnimationFrame(function () { raf = 0; byScroll(); }); }, { passive: true });
    window.addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY; used = true;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        stages.forEach(function (st) { var r = st.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return; set(st, Math.round(Math.min(110, Math.max(-10, (px - r.left) / r.width * 100))), Math.round(Math.min(100, Math.max(0, (py - r.top) / r.height * 100)))); });
      });
    }, { passive: true });
  }

  // Teinte des fiches (accueil, modèle)
  function paint(el, t) { el.className = el.className.replace(/\bcr-t-\w+/g, "").trim() + " cr-t-" + t; }
  act($$("[data-tint]"), function (a) {
    var host = a.closest("[data-glint]"); if (!host) return;
    paint(host, a.getAttribute("data-tint"));
    $$("[data-tint]", host).forEach(function (x) { x.classList.toggle("is-on", x === a); });
  });

  // Onglets (modèle, atelier)
  $$(".cr-tabs").forEach(function (tabs) {
    var scope = tabs.parentNode;
    act($$("a[data-tab]", tabs), function (a) {
      $$("a[data-tab]", tabs).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on); });
      $$("[data-panel]", scope).forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-panel") === a.getAttribute("data-tab")); });
    });
  });

  // Compteurs
  var cs = $$("[data-count]");
  if (cs.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = Number(el.getAttribute("data-count")), dec = el.getAttribute("data-dec") ? 1 : 0, t0 = null;
        var show = function (v) { el.textContent = fr(dec ? v / 10 : v, dec); };
        if (reduce) return show(to);
        (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1300); show(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: 0.4 });
    cs.forEach(function (c) { co.observe(c); });
  }

  // Configurateur
  var cfg = $("[data-cfg]"), stage = $(".cr-stage--cfg");
  var cmpT = $(".cr-cmp");
  function pick(k) { return $('[data-k="' + k + '"].is-on', cfg); }
  function num(a, n) { return Number(a && a.getAttribute(n)) || 0; }
  function mens(price) { var fin = price * 0.9, r = 0.049 / 12; return fin * r / (1 - Math.pow(1 + r, -60)); }
  function compute(mod) {
    var m = mod || pick("m"), e = pick("e"), p = num(m, "data-p") + num(pick("t"), "data-p") + num(pick("r"), "data-p") + num(e, "data-p");
    $$('[data-k="o"].is-on', cfg).forEach(function (o) { p += num(o, "data-p"); });
    return { price: p, ch: num(e, "data-ch") + num(m, "data-d"), t: num(e, "data-t") + num(m, "data-s") };
  }
  function update() {
    if (!cfg || !stage) return;
    var m = pick("m"), c = compute(), opts = $$('[data-k="o"].is-on', cfg).map(function (o) { return o.getAttribute("data-n"); });
    stage.setAttribute("data-model", m.getAttribute("data-v")); stage.setAttribute("data-rim", pick("r").getAttribute("data-v")); paint(stage, pick("t").getAttribute("data-v"));
    var sum = [m.getAttribute("data-n"), pick("t").getAttribute("data-n"), "jantes " + pick("r").getAttribute("data-n"), pick("e").getAttribute("data-n")].concat(opts).join(" · ");
    var out = { name: m.getAttribute("data-n"), sum: sum, ch: c.ch + " ch", t: fr(c.t, 1) + " s", mo: "≈ " + eur(mens(c.price)) + "/mois", price: eur(c.price) };
    Object.keys(out).forEach(function (k) { var el = $('[data-out="' + k + '"]'); if (el) el.textContent = out[k]; });
    cfg.setAttribute("data-summary", sum + " — " + eur(c.price) + " (prix de démonstration)");
    if (cmpT) $$("tr[data-calc]", cmpT).forEach(function (tr) {
      var kind = tr.getAttribute("data-calc");
      $$("td", tr).forEach(function (td) {
        var mm = $('[data-k="m"][data-v="' + td.getAttribute("data-m") + '"]', cfg), x = compute(mm);
        td.textContent = kind === "price" ? eur(x.price) : kind === "mo" ? "≈ " + eur(mens(x.price)) + "/mois" : kind === "ch" ? x.ch + " ch" : fr(x.t, 1) + " s";
      });
    });
  }
  if (cfg) {
    act($$(".cr-opt", cfg), function (a) {
      if (a.getAttribute("data-k") === "o") { var on = !a.classList.contains("is-on"); a.classList.toggle("is-on", on); a.setAttribute("aria-checked", on); }
      else $$('[data-k="' + a.getAttribute("data-k") + '"]', cfg).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-checked", on); });
      update();
    });
    // Flèches : passer d'un choix à l'autre dans un groupe
    $$('[role="radiogroup"]', cfg).forEach(function (g) {
      g.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0; if (!d) return;
        var l = $$(".cr-opt", g), i = l.indexOf(document.activeElement); if (i < 0) return; e.preventDefault(); var n = l[(i + d + l.length) % l.length]; n.focus(); n.click();
      });
    });
    act($$("[data-copy]"), function () {
      var txt = cfg.getAttribute("data-summary") || "", note = $('[data-out="copied"]');
      var done = function (ok) { if (note) note.textContent = ok ? "Résumé copié. Collez-le dans votre message de contact." : "Copie impossible : sélectionnez le résumé affiché ci-dessus et collez-le dans votre message."; };
      try { navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); }); } catch (e) { done(false); }
    });
    update();
  }

  // Comparateur : trois modèles au plus
  if (cmpT) {
    var chips = $$("[data-cmp]");
    act(chips, function (a) {
      var sel = (cmpT.getAttribute("data-sel") || "").split(" ").filter(Boolean), k = a.getAttribute("data-cmp"), i = sel.indexOf(k);
      if (i >= 0) { if (sel.length > 1) sel.splice(i, 1); } else { sel.push(k); if (sel.length > 3) sel.shift(); }
      cmpT.setAttribute("data-sel", sel.join(" "));
      chips.forEach(function (c) { var on = sel.indexOf(c.getAttribute("data-cmp")) >= 0; c.classList.toggle("is-on", on); c.setAttribute("aria-checked", on); });
    });
  }

  // Occasions : filtres
  
  if ($(".cr-oc-list")) {
    var f = { type: "all", fuel: "all" }, fchips = $$(".cr-chip[data-f]");
    act(fchips, function (a) {
      var g = a.getAttribute("data-f"); f[g] = a.getAttribute("data-v");
      fchips.forEach(function (c) { if (c.getAttribute("data-f") === g) { var on = c === a; c.classList.toggle("is-on", on); c.setAttribute("aria-checked", on); } });
      var n = 0;
      $$(".cr-oc").forEach(function (li) { var ok = (f.type === "all" || li.getAttribute("data-type") === f.type) && (f.fuel === "all" || li.getAttribute("data-fuel") === f.fuel); li.hidden = !ok; if (ok) n++; });
      $("[data-occ-n]").textContent = n; var em = $(".cr-empty"); if (em) em.classList.toggle("is-on", !n);
    });
  }

  // Simulateur de financement (indicatif)
  var sim = $("[data-sim]");
  if (sim) {
    var s = { prix: 55000, apport: 5000, duree: 48, taux: 4.9 };
    var lim = { prix: [15000, 120000, 5000], apport: [0, 60000, 1000], duree: [24, 72, 12], taux: [2.9, 8.9, 0.5] };
    var draw = function () {
      s.apport = Math.min(s.apport, s.prix - 5000);
      $$("[data-v]", sim).forEach(function (o) { var k = o.getAttribute("data-v"); o.textContent = k === "taux" ? fr(s[k], 1) : k === "duree" ? s[k] : String(s[k]).replace(/\B(?=(\d{3})+$)/g, " "); });
      var fin = s.prix - s.apport, r = s.taux / 1200, n = s.duree, m = fin * r / (1 - Math.pow(1 + r, -n));
      $('[data-r="mens"]', sim).textContent = eur(m) + "/mois"; $('[data-r="fin"]', sim).textContent = eur(fin); $('[data-r="cout"]', sim).textContent = eur(m * n - fin);
    };
    act($$("[data-step]", sim), function (a) {
      var k = a.getAttribute("data-step"), l = lim[k]; s[k] = Math.round(Math.min(l[1], Math.max(l[0], s[k] + Number(a.getAttribute("data-dir")) * l[2])) * 10) / 10; draw();
    });
    draw();
  }

  // Menus : Échap ferme le mega-menu, le tiroir se referme au clic
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var h = $(".cr-has"); if (h && h.contains(document.activeElement)) document.activeElement.blur(); $$(".cr-burger[open]").forEach(function (d) { d.open = false; }); } });
  $$(".cr-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
})();
