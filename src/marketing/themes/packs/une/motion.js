/* Le Relais — rubriques filtrables, mode lecture, « à lire aussi » calculé, temps de lecture. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "une") return;
  var R = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var st = { g: function (k) { try { return localStorage.getItem("une-" + k); } catch (e) { return null; } }, s: function (k, v) { try { localStorage.setItem("une-" + k, v); } catch (e) {} } };
  var rt = function (w) { return Math.max(1, Math.round(w / 220)); };
  function on(list, fn) { list.forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); fn(a); }); }); }
  function press(list, cur) { list.forEach(function (x) { var o = x === cur; x.classList.toggle("is-on", o); x.setAttribute("aria-pressed", o ? "true" : "false"); }); }

  // Apparition douce + compteurs
  if (!R && "IntersectionObserver" in window) {
    b.classList.add("un-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
    $("[data-reveal]").forEach(function (el) { io.observe(el); });
  }
  var co = "IntersectionObserver" in window ? new IntersectionObserver(function (es) { es.forEach(function (e) {
    if (!e.isIntersecting) return; co.unobserve(e.target);
    var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "", t0 = null;
    if (R || isNaN(to)) return;
    (function step(ts) { t0 = t0 || ts; var p = Math.min(1, (ts - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
  }); }, { threshold: .4 }) : null;
  if (co) $("[data-count]").forEach(function (c) { co.observe(c); });

  // Éditions : matin / midi / soir (change l'étiquette et les brèves affichées)
  var ED = { matin: ["Édition du matin · mise à jour 06 h 30", 630], midi: ["Édition du midi · mise à jour 12 h 30", 1230], soir: ["Édition du soir · mise à jour 18 h 00", 2359] };
  var eds = $("[data-un-ed]");
  function setEd(k) {
    var d = ED[k] || ED.soir;
    eds.forEach(function (a) { var o = a.getAttribute("data-un-ed") === k; a.classList.toggle("is-on", o); a.setAttribute("aria-pressed", o ? "true" : "false"); });
    $("[data-un-edlabel]").forEach(function (e) { e.textContent = d[0]; });
    $("[data-un-edname]").forEach(function (e) { e.textContent = d[0].split(" · ")[0]; });
    $(".un-brv-l li").forEach(function (li) { li.hidden = +li.getAttribute("data-t") > d[1]; });
    st.s("ed", k);
  }
  on(eds, function (a) { setEd(a.getAttribute("data-un-ed")); });
  if (eds.length) setEd(st.g("ed") || "soir");

  // Méga-menu : fermeture au clavier / hors du menu ; menu mobile
  var mega = $(".un-mega"), burger = $(".un-burger");
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") mega.concat(burger).forEach(function (d) { if (d.open) { d.open = false; var s = d.querySelector("summary"); if (s) s.focus(); } }); });
  document.addEventListener("click", function (e) { mega.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; }); });
  $(".un-mega-p a, .un-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Temps de lecture de toutes les cartes
  $("[data-words]").forEach(function (el) { var t = el.querySelector("[data-rt]"); if (t) t.textContent = rt(+el.getAttribute("data-words")) + " min de lecture"; });

  // Filtre de rubriques (accueil, rubriques, auteurs, archives), tri, onglets d'année
  (document.querySelector("[data-un-scope]") ? [document.querySelector(".lp-main") || document] : []).forEach(function (sc) {
    var fl = $("[data-un-filter]", sc), list = $("[data-un-list]", sc)[0], items = $("[data-cat]", list || sc), cnt = $("[data-un-count]", sc)[0], emp = $("[data-un-empty]", sc)[0], title = $("[data-un-title]", sc)[0];
    var cur = "tout";
    var names = { tout: "Toutes les rubriques", monde: "Monde", societe: "Société", economie: "Économie", culture: "Culture", sciences: "Sciences", sport: "Sport" };
    function apply() {
      var vis = 0;
      items.forEach(function (it) {
        var pn = it.closest("[data-un-panel]"), inPanel = !pn || pn.classList.contains("is-on");
        var ok = (cur === "tout" || it.getAttribute("data-cat") === cur);
        it.hidden = !ok; if (ok && inPanel) vis++;
      });
      if (cnt) cnt.textContent = vis; if (emp) emp.hidden = vis > 0; if (title) title.textContent = names[cur] || "";
    }
    function pick(k) { cur = names[k] ? k : "tout"; fl.forEach(function (x) { var o = x.getAttribute("data-un-filter") === cur; x.classList.toggle("is-on", o); x.setAttribute("aria-pressed", o ? "true" : "false"); }); apply(); }
    on(fl, function (a) { pick(a.getAttribute("data-un-filter")); try { history.replaceState(null, "", "#" + a.getAttribute("data-un-filter")); } catch (e) {} });
    var h = (location.hash || "").slice(1); if (names[h]) pick(h); else apply();
    var srt = $("[data-un-sort]", sc);
    on(srt, function (a) {
      press(srt, a); var short = a.getAttribute("data-un-sort") === "short";
      items.slice().sort(function (x, y) { return short ? (+x.getAttribute("data-words") - +y.getAttribute("data-words")) : (+x.getAttribute("data-n") - +y.getAttribute("data-n")); }).forEach(function (el) { el.parentNode.appendChild(el); });
    });
    var tabs = $("[data-un-tab]", sc);
    on(tabs, function (a) {
      tabs.forEach(function (x) { var o = x === a; x.classList.toggle("is-on", o); x.setAttribute("aria-selected", o ? "true" : "false"); });
      $("[data-un-panel]", sc).forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-un-panel") === a.getAttribute("data-un-tab")); });
      apply();
    });
    window.addEventListener("hashchange", function () { var k = (location.hash || "").slice(1); if (names[k]) pick(k); });
  });

  // Mode lecture : taille du texte, colonnes, progression, sommaire, temps de lecture réel
  (document.querySelector("[data-un-reader]") ? [document.querySelector(".lp-main") || document] : []).forEach(function (rd) {
    var body = $("[data-un-body]", rd)[0], size = parseFloat(st.g("size")) || 1, cols = st.g("cols") === "2" ? "2" : "1";
    function paint() {
      body.style.setProperty("--un-fs", size); $("[data-un-sizeval]", rd).forEach(function (e) { e.textContent = Math.round(size * 100) + " %"; });
      b.setAttribute("data-un-cols", cols); $("[data-un-cols]", rd).forEach(function (x) { var o = x.getAttribute("data-un-cols") === cols; x.classList.toggle("is-on", o); x.setAttribute("aria-pressed", o ? "true" : "false"); });
    }
    on($("[data-un-size]", rd), function (a) { size = Math.min(1.5, Math.max(.85, Math.round((size + .1 * +a.getAttribute("data-un-size")) * 100) / 100)); st.s("size", size); paint(); });
    on($("[data-un-cols]", rd), function (a) { cols = a.getAttribute("data-un-cols"); st.s("cols", cols); paint(); });
    paint();
    var words = (body.textContent || "").trim().split(/\s+/).length, rtime = $("[data-un-rtime]", rd)[0];
    if (rtime) rtime.textContent = rt(words);
    var toc = $("[data-un-toc]", rd)[0];
    if (toc) $("[data-toc]", body).forEach(function (h, i) { var li = document.createElement("li"), a = document.createElement("a"); a.href = "#partie-" + (i + 1); a.textContent = h.textContent; a.addEventListener("click", function (e) { e.preventDefault(); h.scrollIntoView({ behavior: R ? "auto" : "smooth", block: "start" }); }); li.appendChild(a); toc.appendChild(li); });
    var bar = $("[data-un-prog]", rd)[0];
    function prog() { var r = body.getBoundingClientRect(), t = r.height - window.innerHeight * .6; bar.style.transform = "scaleX(" + Math.max(0, Math.min(1, -r.top / Math.max(t, 1) + .1)) + ")"; }
    if (bar) { window.addEventListener("scroll", prog, { passive: true }); window.addEventListener("resize", prog); prog(); }

    // À lire aussi : même rubrique d'abord (puis le reste), l'article en cours est exclu
    var rel = $("[data-un-rel]", rd)[0]; if (!rel) return;
    var cat = rel.getAttribute("data-un-rel"), me = rel.getAttribute("data-id"), out = $("[data-un-relout]", rel)[0], mode = "rub";
    var all = $(".un-catalog li", rd);
    function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function render() {
      var pool = all.filter(function (x) { return x.getAttribute("data-id") !== me && (mode === "all" || x.getAttribute("data-cat") === cat); });
      if (pool.length < 4) pool = pool.concat(all.filter(function (x) { return x.getAttribute("data-id") !== me && pool.indexOf(x) < 0; }));
      pool = pool.slice(0, 4);
      out.innerHTML = pool.map(function (x) {
        var w = +x.getAttribute("data-words");
        return '<article class="un-card"><div class="un-card-b"><p class="un-kick"><a class="un-tag" href="/rubrique#' + x.getAttribute("data-cat") + '">' + esc(x.getAttribute("data-cat-n")) + "</a> <span>" + esc(x.getAttribute("data-k")) + '</span></p><h3 class="un-t3"><a href="/article#' + x.getAttribute("data-id") + '">' + esc(x.getAttribute("data-t")) + '</a></h3><p class="un-ch">' + esc(x.getAttribute("data-ch")) + '</p><p class="un-meta"><span>' + esc(x.getAttribute("data-by")) + "</span><span>" + rt(w) + " min de lecture</span></p></div></article>";
      }).join("");
    }
    var ms = $("[data-un-relmode]", rel);
    on(ms, function (a) { mode = a.getAttribute("data-un-relmode"); press(ms, a); render(); });
    render();
  });

  // Newsletters : sélection et récapitulatif
  (document.querySelector("[data-un-pick]") ? [document.querySelector(".lp-main") || document] : []).forEach(function (sc) {
    var ps = $("[data-un-pickid]", sc), sum = $("[data-un-picksum]", sc)[0];
    on(ps, function (a) {
      var o = !a.classList.contains("is-on"); a.classList.toggle("is-on", o); a.setAttribute("aria-pressed", o ? "true" : "false"); a.querySelector("[data-un-state]").textContent = o ? "Choisie" : "Choisir";
      var ch = ps.filter(function (x) { return x.classList.contains("is-on"); }).map(function (x) { return x.getAttribute("data-un-pickid"); });
      sum.textContent = ch.length ? "Vous avez choisi : " + ch.join(" + ") + ". Indiquez-le dans votre message via le formulaire de contact." : "Aucune newsletter choisie pour l'instant.";
    });
  });

  // Dossier : chapitre en cours dans le sommaire
  (document.querySelector("[data-un-spy]") ? [document.querySelector(".lp-main") || document] : []).forEach(function (sc) {
    var ls = $("[data-un-spyl]", sc), ts = $("[data-un-spyt]", sc);
    on(ls, function (a) { var t = ts[+a.getAttribute("data-un-spyl")]; if (t) t.scrollIntoView({ behavior: R ? "auto" : "smooth", block: "start" }); });
    if (!("IntersectionObserver" in window)) return;
    var so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var i = ts.indexOf(e.target); ls.forEach(function (x, j) { x.classList.toggle("is-on", i === j); }); } }); }, { rootMargin: "-20% 0px -60% 0px" });
    ts.forEach(function (t) { so.observe(t); });
  });
})();
