/* Colophon — apparitions, catalogue filtrable, lecteur d'extrait paginé. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "colophon") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = { get: function (k) { try { return localStorage.getItem("cf-" + k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem("cf-" + k, v); } catch (e) {} } };
  function onClick(sel, fn, root) { $$(sel, root).forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); fn(a, ev); }); }); }
  function press(list, on) { list.forEach(function (x) { var s = x === on; x.classList.toggle("is-on", s); x.setAttribute("aria-pressed", s ? "true" : "false"); }); }

  // Apparitions au défilement + feuille qui se tourne
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("cf-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  }

  // Compteurs
  var cn = $$("[data-count]");
  if (cn.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      var el = e.target, to = parseInt(el.getAttribute("data-count"), 10); if (reduce || to > 1900) { el.textContent = to; return; }
      var t0 = null; (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
    }); }, { threshold: 0.5 });
    cn.forEach(function (c) { co.observe(c); });
  }

  // Menu mobile : se referme après un clic
  $$(".cf-menu-l a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Filtres génériques par rubrique (actualités)
  $$("[data-tabs]").forEach(function (box) {
    var tabs = $$("[data-tab]", box), items = $$("[data-kind]", box), empty = $(".cf-empty", box);
    tabs.forEach(function (t) { t.addEventListener("click", function (ev) {
      ev.preventDefault(); press(tabs, t); var k = t.getAttribute("data-tab"), n = 0; if (k === "tout") k = "";
      items.forEach(function (it) { var ok = !k || it.getAttribute("data-kind") === k; it.hidden = !ok; if (ok) n++; });
      if (empty) empty.hidden = n > 0;
    }); });
  });

  // ----- Catalogue filtrable -----
  $$(".cf-list").slice(0, 1).forEach(function () { var cat = document;
    var items = $$(".cf-bk", cat), list = $(".cf-list", cat), panel = $(".cf-detail", cat), count = $(".cf-count b", cat), empty = $(".cf-empty", cat), fd = $(".cf-fd", cat);
    var state = { genre: "", coll: "", annee: "", auteur: "" }, current = null;
    if (fd && window.innerWidth < 761) fd.open = false;
    function apply() {
      var n = 0;
      items.forEach(function (it) {
        var ok = !(state.genre && it.dataset.genre !== state.genre) && !(state.coll && it.dataset.coll !== state.coll) && !(state.annee && it.dataset.annee !== state.annee) && !(state.auteur && it.dataset.auteur !== state.auteur);
        it.hidden = !ok; if (ok) n++;
      });
      count.textContent = n; count.nextSibling.textContent = n > 1 ? " livres" : " livre"; empty.hidden = n > 0;
      if (current && current.hidden) closeP();
    }
    $$("[data-filter]", cat).forEach(function (g) {
      var name = g.getAttribute("data-filter"), chips = $$("a", g);
      chips.forEach(function (c) { c.addEventListener("click", function (ev) { ev.preventDefault(); state[name] = c.getAttribute("data-v") === "tous" ? "" : c.getAttribute("data-v"); press(chips, c); apply(); }); });
    });
    onClick(".cf-reset", function () { state = { genre: "", coll: "", annee: "", auteur: "" }; $$("[data-filter]", cat).forEach(function (g) { var cs = $$("a", g); press(cs, cs[0]); }); apply(); }, cat);
    var views = $$("[data-view]", $(".cf-views", cat));
    views.forEach(function (v) { v.addEventListener("click", function (ev) { ev.preventDefault(); list.setAttribute("data-view", v.getAttribute("data-view")); press(views, v); }); });
    function closeP() { panel.hidden = true; panel.innerHTML = ""; if (current) { var s = $(".cf-spine", current); if (s) s.classList.remove("is-open"); } current = null; }
    function openP(it) {
      if (current) { var o = $(".cf-spine", current); if (o) o.classList.remove("is-open"); }
      current = it; var s = $(".cf-spine", it); if (s) s.classList.add("is-open");
      var ex = it.dataset.ex === "1", slug = it.dataset.slug;
      panel.innerHTML = '<a class="cf-d-close" href="#fermer" role="button" aria-label="Fermer la fiche">×</a>' + $(".cf-card", it).outerHTML.replace(/<a class="cf-card-a"[^>]*>/, '<a class="cf-card-a" href="#" tabindex="-1">') +
        '<div class="cf-d-x">' + (ex ? '<a class="cf-btn" href="/livre#' + slug + '">Lire l’extrait</a>' : '<span>Extrait bientôt disponible.</span>') + '<a href="/contact">Service de presse et libraires</a></div>';
      var inner = $(".cf-card-in", panel); inner.appendChild($(".cf-d-x", panel)); panel.hidden = false;
      onClick(".cf-d-close", function () { closeP(); }, panel);
      panel.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }
    items.forEach(function (it) { $$("a[role=button]", it).forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); openP(it); }); }); });
    var h = location.hash.slice(1); if (h) items.forEach(function (it) { if (it.dataset.slug === h) openP(it); });
  });

  // ----- Livre : choix de l'extrait + lecteur paginé -----
  var eds = $$(".cf-ed"), picks = $$("[data-pick]"), readers = {};
  function showEd(slug) {
    if (!eds.length) return; var found = false;
    eds.forEach(function (e) { if (e.getAttribute("data-ed") === slug) found = true; });
    if (!found) slug = eds[0].getAttribute("data-ed");
    eds.forEach(function (e) { e.hidden = e.getAttribute("data-ed") !== slug; });
    picks.forEach(function (p) { var s = p.getAttribute("data-pick") === slug; p.classList.toggle("is-on", s); p.setAttribute("aria-pressed", s ? "true" : "false"); });
    if (readers[slug]) readers[slug].layout();
  }
  picks.forEach(function (p) { p.addEventListener("click", function (ev) { ev.preventDefault(); showEd(p.getAttribute("data-pick")); }); });

  var prefs = { fs: parseInt(store.get("fs"), 10) || 19, th: store.get("th") || "paper" };
  var all = [];
  function reader(box) {
    var view = $(".cf-view", box), flow = $(".cf-flow", box), bar = $(".cf-bar2", box), bi = $("i", bar), pg = $(".cf-pgn", box), prev = $("[data-act=pv]", box), next = $("[data-act=nx]", box);
    var cur = 0, spreads = 1, cols = 1, per = 1, ths = $$("[data-th]", box);
    view.setAttribute("tabindex", "0"); view.setAttribute("role", "document");
    function layout() {
      box.style.setProperty("--fs", prefs.fs + "px"); box.setAttribute("data-theme", prefs.th); press(ths, ths.filter(function (t) { return t.getAttribute("data-th") === prefs.th; })[0]);
      flow.style.transition = "none"; flow.style.transform = "translateX(0)";
      if (!view.offsetWidth) return;
      var cs = getComputedStyle(flow); per = parseInt(cs.columnCount, 10) || 1; var gap = parseFloat(cs.columnGap) || 0, w = view.clientWidth, cw = (w - gap * (per - 1)) / per;
      cols = Math.max(1, Math.round((flow.scrollWidth + gap) / (cw + gap))); spreads = Math.max(1, Math.ceil(cols / per));
      cur = Math.min(cur, spreads - 1); go(cur, true);
    }
    function go(n, now) {
      cur = Math.max(0, Math.min(spreads - 1, n));
      var gap = parseFloat(getComputedStyle(flow).columnGap) || 0;
      flow.style.transition = (now || reduce) ? "none" : ""; flow.style.transform = "translateX(" + (-cur * (view.clientWidth + gap)) + "px)";
      var a = cur * per + 1, z = Math.min(cols, a + per - 1), pct = spreads > 1 ? Math.round(cur / (spreads - 1) * 100) : 100;
      pg.textContent = (per > 1 && z > a ? "Pages " + a + "–" + z : "Page " + a) + " sur " + cols;
      bi.style.transform = "scaleX(" + (pct / 100) + ")"; bar.setAttribute("aria-valuenow", pct); bar.setAttribute("aria-valuetext", pct + " % de l’extrait");
      prev.classList.toggle("is-off", cur === 0); next.classList.toggle("is-off", cur === spreads - 1);
      prev.setAttribute("aria-disabled", cur === 0); next.setAttribute("aria-disabled", cur === spreads - 1);
      store.set("pos-" + box.getAttribute("data-slug"), cur);
    }
    function size(d) { prefs.fs = Math.max(15, Math.min(28, prefs.fs + d)); store.set("fs", prefs.fs); all.forEach(function (r) { r.layout(); }); }
    function theme(t) { prefs.th = t; store.set("th", t); all.forEach(function (r) { r.layout(); }); }
    onClick("[data-act]", function (a) { var k = a.getAttribute("data-act"); if (k === "pv") go(cur - 1); else if (k === "nx") go(cur + 1); else size(k === "sp" ? 2 : -2); }, box);
    ths.forEach(function (t) { t.addEventListener("click", function (ev) { ev.preventDefault(); theme(t.getAttribute("data-th")); }); });
    view.addEventListener("keydown", function (ev) {
      var k = ev.key, ok = true;
      if (k === "ArrowRight" || k === "PageDown" || k === " ") go(cur + 1); else if (k === "ArrowLeft" || k === "PageUp") go(cur - 1);
      else if (k === "Home") go(0); else if (k === "End") go(spreads - 1);
      else if (k === "+" || k === "=") size(2); else if (k === "-") size(-2);
      else if (k === "t" || k === "T") theme({ paper: "sepia", sepia: "night", night: "paper" }[prefs.th]); else ok = false;
      if (ok) ev.preventDefault();
    });
    var sx = null;
    view.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    view.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); }, { passive: true });
    var saved = parseInt(store.get("pos-" + box.getAttribute("data-slug")), 10); if (saved > 0) cur = saved;
    var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(layout, 150); });
    var api = { layout: layout }; all.push(api); readers[box.getAttribute("data-slug")] = api; return api;
  }
  $$("[data-reader]").forEach(reader);
  if (eds.length) {
    var h0 = location.hash.slice(1); showEd(h0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { all.forEach(function (r) { r.layout(); }); });
    window.addEventListener("hashchange", function () { showEd(location.hash.slice(1)); });
  }
})();
