/* Rideau — révélations, programme de salle, rideau rejouable, filtres de saison, fiches par onglets, plan de salle et récapitulatif. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "rideau") return;
  var R = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var $1 = function (s, r) { return (r || document).querySelector(s); };
  var on = function (els, fn) { els.forEach(function (e) { e.addEventListener("click", function (ev) { ev.preventDefault(); fn(e, ev); }); }); };
  var q = {}; (location.search || "").replace(/[?&]([^=&]+)=([^&]*)/g, function (m, k, v) { q[k] = decodeURIComponent(v); });
  var hash = (location.hash || "").replace("#", "");

  // Apparition au défilement
  if (!R && "IntersectionObserver" in window) {
    b.classList.add("rd-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  } else b.classList.add("rd-js");

  // Programme de salle plein écran
  var prog = $1(".rd-prog");
  if (prog) {
    prog.addEventListener("toggle", function () { b.classList.toggle("rd-lock", prog.open); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && prog.open) { prog.open = false; var s = $1("summary", prog); if (s) s.focus(); } });
  }

  // Compteurs
  $("[data-count]").forEach(function (el) {
    var end = parseInt(el.getAttribute("data-count"), 10); if (R || !("IntersectionObserver" in window) || isNaN(end)) return;
    var o = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; o.disconnect(); var s = performance.now(); (function st(n) { var k = Math.min(1, (n - s) / 1200); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(st); })(s); });
    o.observe(el);
  });

  // Rideau : fermeture puis réouverture ; faisceaux qui suivent le curseur
  var hero = $1("[data-rd-hero]"), rp = $1("[data-rd-replay]");
  if (hero && rp) {
    if (R) rp.hidden = true;
    on([rp], function () { if (R || hero.classList.contains("rd-shut")) return; hero.classList.add("rd-shut"); rp.textContent = "Lever le rideau"; setTimeout(function () { hero.classList.remove("rd-shut"); rp.textContent = "Refermer le rideau"; }, 1500); });
    if (!R && window.matchMedia("(pointer: fine)").matches) {
      var beams = $(".rd-beam", hero), raf = 0;
      hero.addEventListener("pointermove", function (e) { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; var x = (e.clientX / window.innerWidth - 0.5) * 120; beams.forEach(function (bm, i) { bm.style.translate = (x * (i ? -0.6 : 1)).toFixed(1) + "px 0"; }); }); });
    }
  }

  // Saison : filtres mois / genre / vue
  var season = $1("[data-rd-season]");
  if (season) {
    var st = { m: "", g: "" };
    var cards = $("[data-rd-card]", season), cnt = $1("[data-rd-count]", season), empty = $1("[data-rd-empty]", season);
    var mark = function (key) { $("[data-rd-f='" + key + "']", season).forEach(function (a) { var v = a.getAttribute("data-v"); var o = (v === "tous" ? "" : v) === st[key]; a.classList.toggle("is-on", o); a.setAttribute("aria-pressed", o ? "true" : "false"); }); };
    var apply = function () {
      var n = 0;
      cards.forEach(function (c) { var ok = (!st.m || c.getAttribute("data-m") === st.m) && (!st.g || c.getAttribute("data-g") === st.g); c.classList.toggle("is-off", !ok); if (ok && c.tagName !== "TR") n++; });
      if (cnt) cnt.textContent = n; if (empty) empty.classList.toggle("is-on", n === 0);
      mark("m"); mark("g");
    };
    on($("[data-rd-f]", season), function (a) { var v = a.getAttribute("data-v"); st[a.getAttribute("data-rd-f")] = v === "tous" ? "" : v; apply(); });
    on($("[data-rd-reset]", season), function () { st.m = ""; st.g = ""; apply(); });
    on($("[data-rd-view]", season), function (a) { var v = a.getAttribute("data-rd-view"); season.setAttribute("data-view", v); $("[data-rd-view]", season).forEach(function (x) { var o = x === a; x.classList.toggle("is-on", o); x.setAttribute("aria-pressed", o ? "true" : "false"); }); });
    var hm = hash.match(/^(mois|genre)-(.+)$/); if (hm) st[hm[1] === "mois" ? "m" : "g"] = hm[2];
    apply();
  }

  // Fiche spectacle : onglets
  var tabs = $("[data-rd-tab]");
  if (tabs.length) {
    var panes = $("[data-rd-pane]");
    var open = function (slug, focus) {
      if (!panes.some(function (p) { return p.getAttribute("data-rd-pane") === slug; })) slug = tabs[0].getAttribute("data-rd-tab");
      tabs.forEach(function (t) { var o = t.getAttribute("data-rd-tab") === slug; t.classList.toggle("is-on", o); t.setAttribute("aria-selected", o ? "true" : "false"); if (o && focus) t.focus(); });
      panes.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-rd-pane") === slug); });
    };
    on(tabs, function (t) { open(t.getAttribute("data-rd-tab")); });
    tabs.forEach(function (t, i) { t.addEventListener("keydown", function (e) { var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return; e.preventDefault(); open(tabs[(i + d + tabs.length) % tabs.length].getAttribute("data-rd-tab"), true); }); });
    open(q.s || hash.replace(/^sp-/, ""));
  }

  // Billetterie : plan de salle
  var box = $1("[data-rd-box]");
  if (box) {
    var seats = $(".rd-s[data-k]", box), picks = $("[data-rd-pick]", box), prices = {}, MAX = 8;
    $("[data-rd-zone]", box).forEach(function (z) { prices[z.getAttribute("data-rd-zone")] = parseInt(z.getAttribute("data-p"), 10); });
    var cur = { slug: picks[0].getAttribute("data-rd-pick"), title: picks[0].getAttribute("data-t"), f: parseFloat(picks[0].getAttribute("data-f")) || 1, date: "" };
    var red = false, sel = [];
    var elShow = $1("[data-rd-show]", box), elWhen = $1("[data-rd-when]", box), list = $1("[data-rd-list]", box), tot = $1("[data-rd-total]", box), live = $1("[data-rd-live]", box), go = $1("[data-rd-go]", box), sw = $1("[data-rd-red]", box);
    var hashStr = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
    var label = function (s) { return "Rang " + s.getAttribute("data-k").charAt(0) + ", fauteuil " + s.getAttribute("data-k").slice(1); };
    var zname = { o: "orchestre", b: "balcon", g: "galerie" };
    var price = function (s) { var p = prices[s.getAttribute("data-z")] * cur.f * (red ? 0.75 : 1); return Math.round(p); };
    var say = function (t) { if (live) live.textContent = t; };
    var render = function () {
      var sum = 0;
      list.innerHTML = "";
      sel.forEach(function (s) { var p = price(s); sum += p; var li = document.createElement("li"); li.innerHTML = "<span></span><strong></strong>"; li.firstChild.textContent = label(s) + " (" + zname[s.getAttribute("data-z")] + ")"; li.lastChild.textContent = p + " €"; list.appendChild(li); });
      if (!sel.length) { var n = document.createElement("li"); n.className = "rd-none"; n.textContent = "Aucun fauteuil choisi."; list.appendChild(n); }
      tot.textContent = sum + " €"; elShow.textContent = cur.title; elWhen.textContent = cur.date;
      seats.forEach(function (s) { var x = s.classList.contains("is-x"), o = sel.indexOf(s) > -1; s.classList.toggle("is-sel", o); s.setAttribute("aria-checked", o ? "true" : "false"); s.setAttribute("aria-label", label(s) + ", " + zname[s.getAttribute("data-z")] + ", " + price(s) + " euros" + (x ? ", occupé" : "")); });
      var txt = summary();
      go.setAttribute("href", sel.length ? "/contact?demande=" + encodeURIComponent(txt) : "/contact");
    };
    var summary = function () {
      if (!sel.length) return "";
      var sum = sel.reduce(function (a, s) { return a + price(s); }, 0);
      return "Demande de places (démonstration) — " + cur.title + ", " + cur.date + " — " + sel.map(function (s) { return s.getAttribute("data-k"); }).join(", ") + " — total indicatif " + sum + " €" + (red ? " (tarif réduit)" : "") + ".";
    };
    var reseed = function () {
      sel = [];
      seats.forEach(function (s) { var x = hashStr(cur.slug + cur.date + s.getAttribute("data-k")) < 0.24; s.classList.toggle("is-x", x); s.setAttribute("role", "checkbox"); s.setAttribute("aria-disabled", x ? "true" : "false"); });
      var free = seats.filter(function (s) { return !s.classList.contains("is-x"); }).length;
      render(); say(cur.title + ", " + cur.date + " : " + free + " fauteuils libres sur " + seats.length + ".");
    };
    var dg = function (slug) { return $1("[data-rd-dg='" + slug + "']", box); };
    var setShow = function (a) {
      cur.slug = a.getAttribute("data-rd-pick"); cur.title = a.getAttribute("data-t"); cur.f = parseFloat(a.getAttribute("data-f")) || 1;
      picks.forEach(function (p) { var o = p === a; p.classList.toggle("is-on", o); p.setAttribute("aria-pressed", o ? "true" : "false"); });
      $("[data-rd-dg]", box).forEach(function (g) { g.classList.toggle("is-on", g.getAttribute("data-rd-dg") === cur.slug); });
      setDate($1("[data-rd-date]", dg(cur.slug)));
    };
    var setDate = function (a) {
      cur.date = a.getAttribute("data-d");
      $("[data-rd-date]", dg(cur.slug)).forEach(function (d) { var o = d === a; d.classList.toggle("is-on", o); d.setAttribute("aria-pressed", o ? "true" : "false"); });
      reseed();
    };
    on(picks, setShow);
    on($("[data-rd-date]", box), setDate);
    on(seats, function (s) {
      if (s.classList.contains("is-x")) { say(label(s) + " : occupé."); return; }
      var i = sel.indexOf(s);
      if (i > -1) sel.splice(i, 1); else if (sel.length >= MAX) { say("Huit fauteuils au maximum par demande."); return; } else sel.push(s);
      render(); say(label(s) + (i > -1 ? " retiré." : " choisi.") + " Total indicatif : " + tot.textContent + ".");
    });
    // Navigation au clavier dans le plan (flèches)
    var rows = $(".rd-row", box);
    seats.forEach(function (s) {
      s.addEventListener("keydown", function (e) {
        if (e.key === " ") { e.preventDefault(); s.click(); return; }
        var d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key]; if (!d) return;
        e.preventDefault();
        var row = s.closest(".rd-row"), ri = rows.indexOf(row), cs = $(".rd-s", row), ci = cs.indexOf(s);
        var nr = rows[ri + d[0]], t;
        if (d[0]) { if (nr) t = $(".rd-s", nr)[Math.min(ci, 13)]; } else t = cs[ci + d[1]];
        if (t) t.focus();
      });
    });
    on([sw], function () { red = !red; sw.setAttribute("aria-checked", red ? "true" : "false"); render(); say(red ? "Tarif réduit appliqué." : "Tarif plein."); });
    on($("[data-rd-clear]", box), function () { sel = []; render(); say("Sélection vidée."); });
    on($("[data-rd-copy]", box), function (a) {
      var t = summary(); if (!t) { say("Choisissez d'abord au moins un fauteuil."); return; }
      var done = function () { say("Récapitulatif copié. Collez-le dans le formulaire de contact."); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { say(t); });
      else { var ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { say(t); } document.body.removeChild(ta); }
    });
        var init = picks.filter(function (p) { return p.getAttribute("data-rd-pick") === (q.s || hash.replace(/^sp-/, "")); })[0] || picks[0];
    setShow(init);
  }
})();
