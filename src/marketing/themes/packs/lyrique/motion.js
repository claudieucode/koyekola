/* Lyrique — lustre qui s'allume, saison filtrable, fiche concert, plan de salle et récapitulatif. Sans dépendance ; mouvement réduit respecté. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "lyrique") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var go = function (e) { e.preventDefault(); };
  var KEY = "ly-recap";
  b.classList.add("ly-ui");

  // Page courante dans le programme
  var seg = location.pathname.replace(/\/+$/, "").split("/").pop();
  $$(".ly-prog a,.ly-drawer a").forEach(function (a) {
    var h = a.getAttribute("href"); var last = h.replace(/\/+$/, "").split("/").pop();
    if ((h === "/" && (seg === "" || seg === "accueil" || seg === "demo")) || (last && h !== "/" && last === seg)) a.setAttribute("aria-current", "page");
  });

  // Lustre qui s'allume, apparitions
  if (!reduce) {
    b.classList.add("ly-js");
    var flames = $$(".ly-fl"), gls = $$(".ly-gl");
    flames.forEach(function (f, i) { f.style.transitionDelay = (0.2 + i * 0.12) + "s"; if (gls[i]) gls[i].style.transitionDelay = (0.2 + i * 0.12) + "s"; });
    setTimeout(function () { b.classList.add("ly-lit"); }, 350);
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
      $$("[data-reveal]").forEach(function (el) { io.observe(el); });
    } else $$("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); });
    // Faisceaux qui suivent légèrement le pointeur
    var hero = $(".ly-hero"), beams = $(".ly-beams"), raf = 0;
    if (hero && beams && window.matchMedia("(pointer:fine)").matches) hero.addEventListener("pointermove", function (e) {
      if (raf) return; raf = requestAnimationFrame(function () { raf = 0; var r = hero.getBoundingClientRect(); beams.style.transform = "translateX(" + (((e.clientX - r.left) / r.width - 0.5) * 36).toFixed(1) + "px)"; });
    });
    // Compteurs
    var cio = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; cio.unobserve(e.target);
        var el = e.target, to = +el.getAttribute("data-count"), t0 = performance.now();
        (function step(t) { var p = Math.min(1, (t - t0) / 1100), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString("fr-FR"); if (p < 1) requestAnimationFrame(step); })(t0);
      });
    }) : null;
    if (cio) $$("[data-count]").forEach(function (el) { cio.observe(el); });
  }

  // Onglets génériques (fiche concert, pupitres)
  $$("[data-tabs]").forEach(function (box) {
    var tabs = $$("[data-tab]", box), panels = $$("[data-panel]", box), fam = box.hasAttribute("data-fam");
    function show(id, focus) {
      if (!panels.some(function (p) { return p.getAttribute("data-panel") === id; })) id = tabs[0].getAttribute("data-tab");
      tabs.forEach(function (t) { var on = t.getAttribute("data-tab") === id; t.classList.toggle("is-on", on); on ? t.setAttribute("aria-current", "true") : t.removeAttribute("aria-current"); });
      panels.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-panel") === id); });
      $$("[data-fam]", box).forEach(function (g) { if (g !== box) g.classList.toggle("is-on", g.getAttribute("data-fam") === id); });
      if (focus && box.hasAttribute("data-hash")) { try { history.replaceState(null, "", "#" + id); } catch (e) {} }
    }
    tabs.forEach(function (t) { t.addEventListener("click", function (e) { go(e); show(t.getAttribute("data-tab"), true); }); });
    if (fam) $$(".ly-fam", box).forEach(function (g) { g.addEventListener("click", function () { show(g.getAttribute("data-fam"), false); }); });
    show((location.hash || "").slice(1) || tabs[0].getAttribute("data-tab"), false);
    window.addEventListener("hashchange", function () { if (box.hasAttribute("data-hash")) show(location.hash.slice(1), false); });
  });

  // Saison : filtres mois + formation
  $$("[data-season]").forEach(function (box) {
    var rows = $$(".ly-row", box), out = $("[data-count-out]", box), list = $(".ly-rows", box), cur = { m: "all", f: "all" };
    function apply() {
      var n = 0;
      rows.forEach(function (r) { var ok = (cur.m === "all" || r.getAttribute("data-m") === cur.m) && (cur.f === "all" || r.getAttribute("data-f") === cur.f); if (ok) { r.removeAttribute("hidden"); r.classList.add("is-in"); n++; } else r.setAttribute("hidden", ""); });
      if (out) out.textContent = n === 0 ? "Aucun concert" : n + (n > 1 ? " concerts" : " concert");
      list.classList.toggle("is-empty", n === 0);
    }
    $$("[data-fg]", box).forEach(function (a) {
      a.addEventListener("click", function (e) {
        go(e); var g = a.getAttribute("data-fg"); cur[g] = a.getAttribute("data-fv");
        $$('[data-fg="' + g + '"]', box).forEach(function (x) { x.classList.toggle("is-on", x === a); });
        apply();
      });
    });
    var rs = $("[data-reset]", box);
    if (rs) rs.addEventListener("click", function (e) { go(e); cur = { m: "all", f: "all" }; $$("[data-fg]", box).forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-fv") === "all"); }); apply(); });
    apply();
  });

  // Plan de salle : concert, catégories, récapitulatif
  var pl = $("[data-planner]");
  function fmt(n) { return n.toLocaleString("fr-FR") + " €"; }
  function lines(st) { return st.q.map(function (q, i) { return q ? { n: st.names[i], q: q, p: st.prices[i] } : null; }).filter(Boolean); }
  function textOf(st) {
    var ls = lines(st), t = ls.reduce(function (s, l) { return s + l.q * l.p; }, 0);
    return "Demande de places (démonstration)\nConcert : " + (st.title ? st.title + ", " + st.date : "à préciser") + "\n" + ls.map(function (l) { return "- " + l.q + " × " + l.n + " (" + fmt(l.p) + ")"; }).join("\n") + "\nTotal indicatif : " + fmt(t);
  }
  if (pl) {
    var cats = $$(".ly-cat", pl), st = { c: "", title: "", date: "", ids: [], names: [], prices: [], q: [] }, MAX = 8;
    cats.forEach(function (c, i) { st.ids[i] = c.getAttribute("data-cat"); st.names[i] = c.getAttribute("data-name"); st.prices[i] = +c.getAttribute("data-price"); st.q[i] = 0; });
    var rc = $("[data-rc]", pl), rl = $("[data-rl]", pl), rt = $("[data-rt]", pl), rm = $("[data-rm]", pl), box = $(".ly-recap", pl);
    function render() {
      var ls = lines(st), sum = st.q.reduce(function (a, c) { return a + c; }, 0), tot = ls.reduce(function (s, l) { return s + l.q * l.p; }, 0);
      rc.textContent = st.title ? st.title + " — " + st.date : "Aucun concert choisi.";
      rl.innerHTML = ""; ls.forEach(function (l) { var li = document.createElement("li"), a = document.createElement("span"), c = document.createElement("span"); a.textContent = l.q + " × " + l.n; c.textContent = fmt(l.q * l.p); li.appendChild(a); li.appendChild(c); rl.appendChild(li); });
      rt.textContent = fmt(tot);
      box.classList.toggle("is-over", sum >= MAX);
      rm.textContent = sum >= MAX ? "Maximum atteint : 8 places par demande." : "Maximum 8 places par demande. Ce récapitulatif n'est pas une réservation : il est transmis par le formulaire de contact.";
      cats.forEach(function (c, i) { $(".ly-qty", c).textContent = st.q[i]; c.classList.toggle("is-hot", st.q[i] > 0); });
      $$(".ly-zone", pl).forEach(function (z) { var i = st.ids.indexOf(z.getAttribute("data-zone")); z.classList.toggle("is-on", st.q[i] > 0); });
      $$("[data-zone-l]", pl).forEach(function (z) { z.classList.toggle("is-on", st.q[st.ids.indexOf(z.getAttribute("data-zone-l"))] > 0); });
      try { sessionStorage.setItem(KEY, JSON.stringify({ text: textOf(st), head: rc.textContent, lines: ls.map(function (l) { return l.q + " × " + l.n + " — " + fmt(l.q * l.p); }), total: fmt(tot), n: sum })); } catch (e) {}
    }
    function pick(id) {
      var chip = $$("[data-pc]", pl).filter(function (c) { return c.getAttribute("data-pc") === id; })[0] || $("[data-pc]", pl);
      $$("[data-pc]", pl).forEach(function (c) { c.classList.toggle("is-on", c === chip); });
      st.c = chip.getAttribute("data-pc"); st.title = chip.getAttribute("data-t"); st.date = chip.getAttribute("data-d"); render();
    }
    function bump(i, d) { var sum = st.q.reduce(function (a, c) { return a + c; }, 0); if (d > 0 && sum >= MAX) return; st.q[i] = Math.max(0, st.q[i] + d); render(); }
    $$("[data-pc]", pl).forEach(function (c) { c.addEventListener("click", function (e) { go(e); pick(c.getAttribute("data-pc")); }); });
    cats.forEach(function (c, i) {
      $$("[data-step]", c).forEach(function (a) { a.addEventListener("click", function (e) { go(e); bump(i, +a.getAttribute("data-step")); }); });
      c.addEventListener("mouseenter", function () { hot(st.ids[i], true); }); c.addEventListener("mouseleave", function () { hot(st.ids[i], false); });
    });
    function hot(id, on) { $$(".ly-zone", pl).forEach(function (z) { if (z.getAttribute("data-zone") === id) z.classList.toggle("is-hot", on); }); }
    $$(".ly-zone", pl).forEach(function (z) { z.addEventListener("click", function () { bump(st.ids.indexOf(z.getAttribute("data-zone")), 1); }); });
    var cp = $("[data-copy]", pl);
    cp.addEventListener("click", function (e) {
      go(e); var t = textOf(st), done = function () { cp.textContent = "Récapitulatif copié"; setTimeout(function () { cp.textContent = "Copier le récapitulatif"; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () {});
      else { var ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (x) {} document.body.removeChild(ta); }
    });
    pick((location.hash || "").slice(1) || "c1");
  }

  // Contact : rappel du récapitulatif et préremplissage prudent
  var rb = $("[data-recapbox]");
  if (rb) {
    var data = null; try { data = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) {}
    if (data && data.n > 0) {
      $("[data-recap-empty]", rb).hidden = true; $("[data-recap-full]", rb).hidden = false;
      $("[data-rc2]", rb).textContent = data.head; $("[data-rt2]", rb).textContent = data.total;
      var ul = $("[data-rl2]", rb); data.lines.forEach(function (l) { var li = document.createElement("li"); li.textContent = l; ul.appendChild(li); });
      var ta = $(".lp-main textarea"); if (ta && !ta.value) ta.value = data.text;
    }
  }
})();
