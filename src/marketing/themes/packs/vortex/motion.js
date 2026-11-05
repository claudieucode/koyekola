/* Vortex — classement triable, fiches joueurs (radar), HUD en direct, compte à rebours. Sans dépendance ; mouvement réduit respecté. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "vortex") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
  var fr = function (n) { return Number(n).toLocaleString("fr-FR"); };

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("vx-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  }

  // Compteurs
  var cs = $$("[data-count]");
  if (cs.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      var el = e.target, to = +el.getAttribute("data-count"), suf = el.getAttribute("data-suffix") || "", t0 = null;
      if (reduce) return;
      (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1300); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
    }); }, { threshold: 0.4 });
    cs.forEach(function (c) { co.observe(c); });
  }

  // Compte à rebours
  $$("[data-countdown]").forEach(function (box) {
    var end = new Date(box.getAttribute("data-countdown")).getTime(), cell = {}; if (isNaN(end)) return;
    $$("[data-u]", box).forEach(function (c) { cell[c.getAttribute("data-u")] = c; });
    function tick() { var s = Math.max(0, Math.floor((end - Date.now()) / 1000)); cell.d.textContent = pad(Math.floor(s / 86400)); cell.h.textContent = pad(Math.floor(s % 86400 / 3600)); cell.m.textContent = pad(Math.floor(s % 3600 / 60)); cell.s.textContent = pad(s % 60); if (!s) clearInterval(t); }
    tick(); var t = setInterval(tick, reduce ? 60000 : 1000);
  });

  // HUD en direct (valeurs simulées)
  var live = $$("[data-live]"), sp = $$("[data-spark] i");
  if (!reduce && (live.length || sp.length)) setInterval(function () {
    live.forEach(function (el) { var v = +el.getAttribute("data-base") + Math.round((Math.random() - 0.5) * 2 * +el.getAttribute("data-jit")); el.textContent = (el.getAttribute("data-base") > 999 ? fr(v) : v) + (el.getAttribute("data-suf") || ""); });
    sp.forEach(function (i, k) { var n = sp[k + 1]; i.setAttribute("data-h", n ? n.getAttribute("data-h") : 3 + Math.floor(Math.random() * 8)); });
  }, 1800);

  // Filtres, tri, rang, limite, onglets
  $$("[data-scope]").forEach(function (sc) {
    var items = $$("[data-item]", sc), f = {}, lim = +sc.getAttribute("data-limit") || 0, sk = sc.getAttribute("data-sort-init"), dir = -1, tab = null;
    var empty = sc.querySelector(".vx-empty"), out = sc.querySelector("[data-count-out]");
    $$("[data-key].is-on", sc).forEach(function (a) { f[a.getAttribute("data-key")] = a.getAttribute("data-val"); });
    var tb = sc.querySelector("[data-tab].is-on"); if (tb) tab = tb.getAttribute("data-tab");
    function val(it, i) { var c = it.cells[i]; var v = c.getAttribute("data-v"); return isNaN(+v) ? v : +v; }
    function apply() {
      if (sk !== null && items[0] && items[0].cells) {
        var i = +sk; items.sort(function (x, y) { var a = val(x, i), c = val(y, i); return (a < c ? -1 : a > c ? 1 : 0) * dir; });
        items.forEach(function (it) { it.parentNode.appendChild(it); });
      }
      var n = 0;
      items.forEach(function (it) {
        var ok = Object.keys(f).every(function (k) { return f[k] === "all" || it.getAttribute("data-" + k) === f[k]; });
        if (tab) { var p = it.closest("[data-panel]"); if (p) ok = ok && p.getAttribute("data-panel") === tab; }
        if (ok) { n++; if (lim && n > lim) ok = false; }
        it.hidden = !ok; var r = it.querySelector("[data-rank]"); if (r && ok) r.textContent = pad(n);
      });
      if (tab) $$("[data-panel]", sc).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== tab; });
      if (empty) empty.hidden = n > 0 || false;
      if (out) out.textContent = n + (n > 1 ? " résultats." : " résultat.");
      $$("th[aria-sort]", sc).forEach(function (th) { var a = th.querySelector("[data-sort]"); th.setAttribute("aria-sort", a && a.getAttribute("data-sort") === sk ? (dir > 0 ? "ascending" : "descending") : "none"); });
      $$("[data-sort]", sc).forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("data-sort") === sk && !a.closest("th")); });
    }
    sc.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a[data-key],a[data-sort],a[data-tab]"); if (!a || !sc.contains(a)) return;
      ev.preventDefault();
      if (a.hasAttribute("data-key")) { var k = a.getAttribute("data-key"); f[k] = a.getAttribute("data-val"); $$("[data-key='" + k + "']", sc).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); }); }
      else if (a.hasAttribute("data-sort")) { var s = a.getAttribute("data-sort"); if (s === sk) dir = -dir; else { sk = s; dir = a.getAttribute("data-type") === "s" ? 1 : -1; } }
      else { tab = a.getAttribute("data-tab"); $$("[data-tab]", sc).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on); }); }
      apply();
    });
    apply();
  });

  // Fiche joueur en panneau + radar
  var AX = ["Précision", "Réflexes", "Stratégie", "Cohésion", "Sang-froid", "Polyvalence"], NS = "http://www.w3.org/2000/svg";
  var panel, last;
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function se(t, at) { var e = document.createElementNS(NS, t); for (var k in at) e.setAttribute(k, at[k]); return e; }
  function pt(i, v) { var a = -Math.PI / 2 + i * Math.PI / 3; return [(100 + Math.cos(a) * 70 * v / 100).toFixed(1), (100 + Math.sin(a) * 70 * v / 100).toFixed(1)]; }
  function radar(vals) {
    var s = se("svg", { "class": "vx-radar", viewBox: "-30 -6 260 212", role: "img", "aria-label": "Radar : " + AX.map(function (n, i) { return n + " " + vals[i]; }).join(", ") });
    [100, 66, 33].forEach(function (r) { s.appendChild(se("polygon", { points: AX.map(function (_, i) { return pt(i, r).join(","); }).join(" "), fill: "none", stroke: "#ffffff2e" })); });
    AX.forEach(function (n, i) { var p = pt(i, 100), q = pt(i, 118); s.appendChild(se("line", { x1: 100, y1: 100, x2: p[0], y2: p[1], stroke: "#ffffff22" })); var t = se("text", { x: q[0], y: +q[1] + 4, "class": "vx-radar-lab", "text-anchor": q[0] < 90 ? "end" : q[0] > 110 ? "start" : "middle" }); t.textContent = n; s.appendChild(t); });
    s.appendChild(se("polygon", { "class": "vx-radar-poly", points: vals.map(function (v, i) { return pt(i, v).join(","); }).join(" ") }));
    return s;
  }
  function build() {
    panel = el("div", "vx-panel"); panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", "Fiche joueur");
    var bd = el("div", "vx-panel-bd"), bx = el("div", "vx-panel-box"), x = el("button", "vx-panel-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Fermer la fiche");
    bx.appendChild(x); panel.appendChild(bd); panel.appendChild(bx); b.appendChild(panel);
    bd.addEventListener("click", close); x.addEventListener("click", close);
    panel.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { close(); return; }
      if (ev.key === "Tab") { var f = $$("button,a[href]", panel), i = f.indexOf(document.activeElement); if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1].focus(); } else if (!ev.shiftKey && i === f.length - 1) { ev.preventDefault(); f[0].focus(); } }
    });
  }
  function open(a) {
    if (!panel) build(); last = a;
    var src = a.hasAttribute("data-name") ? a : document.querySelector("a[data-pid='" + a.getAttribute("data-pid") + "'][data-name]") || a;
    var d = function (k) { return k === "season" || k === "m" ? a.getAttribute("data-" + k) : src.getAttribute("data-" + k); }, vals = d("r").split(",").map(Number), m = d("m").split("|"), bx = panel.querySelector(".vx-panel-box");
    $$(".vx-pc", bx).forEach(function (n) { n.remove(); });
    var wrap = el("div", "vx-pc"), h = el("h2", "", d("handle")); wrap.appendChild(el("span", "vx-g", d("gname") + " · " + d("role"))); wrap.appendChild(h);
    wrap.appendChild(el("p", "vx-pname", d("name") + ", " + d("age") + " ans"));
    wrap.appendChild(radar(vals));
    var st = el("div", "vx-pstats"); [["Note", m[0]], ["KDA", m[1]], ["Victoires", m[2] + " %"], ["Points", m[3]]].forEach(function (r) { var c = el("div"); c.appendChild(el("b", "", r[1])); c.appendChild(el("small", "", r[0])); st.appendChild(c); }); wrap.appendChild(st);
    wrap.appendChild(el("p", "vx-tag", "Saison " + d("season") + " · données de démonstration"));
    var dl = el("dl", "vx-pax"); AX.forEach(function (n, i) { var r = el("div"), bar = el("span"), fill = el("i"); fill.style.width = vals[i] + "%"; bar.appendChild(fill); r.appendChild(el("dt", "", n)); var dd = el("dd", "", vals[i]); var mid = el("dd"); mid.style.textAlign = "left"; mid.appendChild(bar); r.appendChild(mid); r.appendChild(dd); dl.appendChild(r); }); wrap.appendChild(dl);
    wrap.appendChild(el("p", "vx-pbio", d("bio")));
    var cta = el("a", "vx-btn", "Contacter l'équipe"); cta.href = "/contact"; wrap.appendChild(cta); bx.appendChild(wrap);
    panel.classList.add("is-open"); b.style.overflow = "hidden"; panel.querySelector(".vx-panel-x").focus();
  }
  function close() { if (!panel) return; panel.classList.remove("is-open"); b.style.overflow = ""; if (last) last.focus(); }
  document.addEventListener("click", function (ev) { var a = ev.target.closest && ev.target.closest("a[data-open]"); if (a) { ev.preventDefault(); open(a); } });

  // Navigation : indicateur sous le lien courant + section lue
  var nav = document.querySelector(".vx-nav"), ind = nav && nav.querySelector(".vx-ind");
  if (nav && ind) {
    var path = location.pathname.replace(/\/$/, "") || "/", cur = null;
    $$("a", nav).forEach(function (a) { var h = a.getAttribute("href").replace(/\/$/, "") || "/"; if (h === path) { cur = a; a.setAttribute("aria-current", "page"); } });
    var go = function (a) { if (!a) { nav.classList.remove("is-set"); return; } nav.classList.add("is-set"); ind.style.width = a.offsetWidth + "px"; ind.style.setProperty("--x", a.offsetLeft + "px"); ind.style.setProperty("--w", a.offsetWidth + "px"); };
    go(cur);
    $$("a", nav).forEach(function (a) { a.addEventListener("mouseenter", function () { go(a); }); a.addEventListener("focus", function () { go(a); }); a.addEventListener("mouseleave", function () { go(cur); }); a.addEventListener("blur", function () { go(cur); }); });
    window.addEventListener("resize", function () { go(cur); });
  }
  var secs = $$("[data-sec]"), rn = document.querySelector("[data-read-n]"), rt = document.querySelector("[data-read-t]"), rl = document.querySelector("[data-read-l]");
  if (secs.length && rn && "IntersectionObserver" in window) {
    rt.textContent = pad(secs.length);
    var so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { rn.textContent = pad(secs.indexOf(e.target) + 1); rl.textContent = e.target.getAttribute("data-sec"); } }); }, { rootMargin: "-35% 0px -60% 0px" });
    secs.forEach(function (s) { so.observe(s); });
  }
  $$(".vx-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
})();
