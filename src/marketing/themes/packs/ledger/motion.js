/* Ledger : palette de commandes, courbes en direct, simulateur épargne / prêt, filtres. Sans dépendance ; mouvement réduit respecté. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "ledger") return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = "http://www.w3.org/2000/svg";
  var nf = function (n, d) { return Number(n).toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }).replace(/[  ]/g, " "); };
  var eur = function (n) { return nf(n) + " €"; };

  // hauteur de l'en-tête (menu mobile) + lien courant
  var head = $(".lg-head");
  function sizeHead() { if (head) b.style.setProperty("--lg-headh", head.offsetHeight + "px"); }
  sizeHead(); addEventListener("resize", sizeHead);
  $$(".lg-nav a").forEach(function (a) { if (a.getAttribute("href") === location.pathname) a.setAttribute("aria-current", "page"); });
  $$(".lg-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("lg-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  }

  // compteurs
  $$("[data-count]").forEach(function (el) {
    var to = parseFloat(el.getAttribute("data-count")), d = +el.getAttribute("data-dec") || 0;
    if (reduce || isNaN(to) || !("IntersectionObserver" in window)) return;
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; o.disconnect(); var t0 = null;
      (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1300); el.textContent = nf(to * (1 - Math.pow(1 - p, 3)), d); if (p < 1) requestAnimationFrame(step); })(performance.now());
    }, { threshold: 0.5 }); o.observe(el);
  });

  // palette de commandes
  var pal = $(".lg-pal"), q = "", qt = $(".lg-pal-t"), items = $$("[data-pal-i]");
  function vis() { return items.filter(function (a) { return !a.classList.contains("is-off"); }); }
  function filter() {
    var n = 0; items.forEach(function (a) { var ok = !q || a.textContent.toLowerCase().indexOf(q.toLowerCase()) > -1; a.classList.toggle("is-off", !ok); if (ok) n++; });
    $$(".lg-pal-g").forEach(function (g) { var nx = g.nextElementSibling, any = false; while (nx && !nx.classList.contains("lg-pal-g") && !nx.classList.contains("lg-pal-none")) { if (!nx.classList.contains("is-off")) any = true; nx = nx.nextElementSibling; } g.classList.toggle("is-off", !any); });
    pal.classList.toggle("is-none", !n); qt.textContent = q || "Tapez pour filtrer"; qt.classList.toggle("has-q", !!q);
  }
  var opener;
  function open(from) { if (!pal) return; opener = from || document.activeElement; q = ""; filter(); pal.classList.add("is-open"); var v = vis()[0]; if (v) v.focus(); }
  function close() { if (!pal || !pal.classList.contains("is-open")) return; pal.classList.remove("is-open"); if (opener && opener.focus) opener.focus(); }
  if (pal) {
    $$("[data-pal]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); open(a); }); });
    $$("[data-pal-close]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); close(); }); });
    $$("[data-pal-i]").forEach(function (a) { a.addEventListener("click", function () { pal.classList.remove("is-open"); }); });
    document.addEventListener("keydown", function (e) {
      var isOpen = pal.classList.contains("is-open"), tag = (e.target.tagName || "").toLowerCase();
      if (!isOpen) { if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !/input|textarea|select/.test(tag) && !e.target.isContentEditable)) { e.preventDefault(); open(); } return; }
      var v = vis(), i = v.indexOf(document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (v.length) v[(i + 1) % v.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (v.length) v[(i - 1 + v.length) % v.length].focus(); }
      else if (e.key === "Backspace") { e.preventDefault(); q = q.slice(0, -1); filter(); if (vis()[0]) vis()[0].focus(); }
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); q += e.key; filter(); if (vis()[0]) vis()[0].focus(); }
      else if (e.key === "Tab") { e.preventDefault(); if (v.length) v[(i + (e.shiftKey ? -1 : 1) + v.length) % v.length].focus(); }
    });
  }

  // filtres et facturation
  $$("[data-filter]").forEach(function (bar) {
    var scope = bar.closest(".pk-bleed").querySelector("[data-filter-scope]");
    $$("a[data-f]", bar).forEach(function (a) { a.addEventListener("click", function (e) {
      e.preventDefault(); var f = a.getAttribute("data-f");
      $$("a[data-f]", bar).forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-selected", x === a); });
      $$("[data-item]", scope).forEach(function (c) { c.classList.toggle("is-off", f !== "tous" && c.getAttribute("data-cat") !== f); });
    }); });
  });
  $$("[data-bill]").forEach(function (bar) {
    var sec = bar.closest(".pk-bleed");
    $$("a[data-b]", bar).forEach(function (a) { a.addEventListener("click", function (e) {
      e.preventDefault(); $$("a[data-b]", bar).forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-pressed", x === a); });
      sec.setAttribute("data-bill", a.getAttribute("data-b"));
    }); });
  });

  // tableau de bord du hero : courbe et flux en direct
  var lc = $("[data-livechart]");
  if (lc && !reduce) {
    var pts = [30, 38, 32, 50, 44, 62, 68], line = $(".lg-lc-l", lc), area = $(".lg-lc-a", lc), W = 300, H = 90;
    var draw = function () {
      var mn = Math.min.apply(0, pts), mx = Math.max.apply(0, pts), sp = mx - mn || 1;
      var d = pts.map(function (v, i) { return (i ? "L" : "M") + (i * W / (pts.length - 1)).toFixed(1) + " " + (H - 8 - (v - mn) / sp * (H - 20)).toFixed(1); }).join("");
      line.setAttribute("d", d); area.setAttribute("d", d + "L" + W + " " + H + "L0 " + H + "Z");
    };
    draw();
    var txs = [["Café des Halles", "Sorties", "−3,20", "neg"], ["Salaire (exemple)", "Revenus", "+2 140,00", "pos"], ["Biocoop Rivage", "Courses", "−42,87", "neg"], ["Abonnement trains", "Transport", "−75,00", "neg"], ["Pot « Voyage »", "Épargne", "−150,00", "neg"], ["Remboursement ami", "Virements", "+28,50", "pos"]], ti = 4, feed = $("[data-feed]");
    setInterval(function () {
      if (document.hidden) return;
      pts.shift(); pts.push(Math.max(10, Math.min(95, pts[pts.length - 1] + (Math.random() - 0.42) * 22))); draw();
      var t = txs[ti++ % txs.length], li = document.createElement("li"); li.className = "is-new";
      li.innerHTML = '<span class="lg-fi"></span><span><b></b><i></i></span><span class="lg-n"></span>';
      li.children[0].textContent = t[0].charAt(0); li.querySelector("b").textContent = t[0]; li.querySelector("i").textContent = t[1];
      var s = li.children[2]; s.textContent = t[2] + " €"; if (t[3] === "pos") s.classList.add("lg-pos");
      feed.insertBefore(li, feed.firstChild); if (feed.children.length > 4) feed.removeChild(feed.lastChild);
    }, 2600);
  }

  // simulateur
  var sim = $("[data-sim]"); if (!sim) return;
  var mode = "sav", S = {}, ctls = {};
  function cfg(c) { var p = (c.getAttribute("data-" + mode) || "").split(","); return p.length > 3 ? { min: +p[0], max: +p[1], step: +p[2], val: +p[3] } : null; }
  function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  $$("[data-ctl]", sim).forEach(function (c) {
    var key = c.getAttribute("data-ctl"), sl = $("[data-slider]", c), o = { c: c, sl: sl, key: key, unit: c.getAttribute("data-unit"), vals: {} };
    ctls[key] = o; sl.setAttribute("role", "slider"); sl.setAttribute("tabindex", "0"); sl.setAttribute("aria-label", sl.getAttribute("data-label"));
    function set(v) {
      var k = cfg(c); if (!k) return; v = Math.round((Math.max(k.min, Math.min(k.max, v)) - k.min) / k.step) * k.step + k.min; v = +v.toFixed(2);
      if (v === S[key]) return; S[key] = v; paint(o); calc();
    }
    o.set = set;
    sl.addEventListener("keydown", function (e) {
      var k = cfg(c), d = 0; if (!k) return;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") d = k.step; else if (e.key === "ArrowLeft" || e.key === "ArrowDown") d = -k.step; else if (e.key === "PageUp") d = k.step * 10; else if (e.key === "PageDown") d = -k.step * 10;
      else if (e.key === "Home") { e.preventDefault(); return set(k.min); } else if (e.key === "End") { e.preventDefault(); return set(k.max); } else return;
      e.preventDefault(); set(S[key] + d);
    });
    function fromX(e) { var k = cfg(c), r = sl.getBoundingClientRect(); set(k.min + Math.max(0, Math.min(1, (e.clientX - r.left - 11) / (r.width - 22))) * (k.max - k.min)); }
    sl.addEventListener("pointerdown", function (e) { sl.setPointerCapture && sl.setPointerCapture(e.pointerId); sl.focus(); fromX(e); sl._d = 1; });
    sl.addEventListener("pointermove", function (e) { if (sl._d) fromX(e); });
    sl.addEventListener("pointerup", function () { sl._d = 0; });
    sl.addEventListener("pointercancel", function () { sl._d = 0; });
    $$("[data-st]", c).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var k = cfg(c); set(S[key] + k.step * +a.getAttribute("data-st")); }); });
  });
  function paint(o) {
    var k = cfg(o.c); if (!k) return; var v = S[o.key], p = (v - k.min) / (k.max - k.min);
    o.c.style.setProperty("--v", p); o.sl.style.setProperty("--v", p);
    o.sl.setAttribute("aria-valuemin", k.min); o.sl.setAttribute("aria-valuemax", k.max); o.sl.setAttribute("aria-valuenow", v);
    var txt = o.key === "rate" ? nf(v, 1) + " %" : o.key === "years" ? v + (v > 1 ? " ans" : " an") : eur(v);
    o.sl.setAttribute("aria-valuetext", txt); $("[data-val]", o.c).textContent = txt;
  }
  function setMode(m) {
    mode = m;
    Object.keys(ctls).forEach(function (key) {
      var o = ctls[key], on = o.c.getAttribute("data-modes").split(" ").indexOf(m) > -1; o.c.classList.toggle("is-off", !on);
      if (on) { var k = cfg(o.c); if (S[key + m] == null) S[key + m] = k.val; S[key] = S[key + m]; paint(o); }
    });
    calc();
  }
  var tabs = $("[data-mode]", sim.parentNode.parentNode) || $("[data-mode]");
  $$("a[data-m]", tabs).forEach(function (a) { a.addEventListener("click", function (e) {
    e.preventDefault(); $$("a[data-m]", tabs).forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-selected", x === a); });
    Object.keys(ctls).forEach(function (key) { S[key + mode] = S[key]; }); setMode(a.getAttribute("data-m"));
  }); });

  var chart = $("[data-chart]"), svg = $("svg", chart), tip = $(".lg-tip", chart), series = [], srT, last = "";
  function calc() {
    Object.keys(ctls).forEach(function (k) { if (S[k] != null) S[k + mode] = S[k]; });
    var P = S.amount, Y = S.years, R = S.rate / 100 / 12, N = Y * 12, M = mode === "sav" ? S.monthly : 0, i, bal = P, paid = P, intr = 0, pay = 0, A = [], B = [], C = [];
    if (mode === "sav") {
      A.push(bal); B.push(paid); C.push(0);
      for (i = 1; i <= N; i++) { bal = bal * (1 + R) + M; paid += M; if (i % 12 === 0) { A.push(bal); B.push(paid); C.push(bal - paid); } }
      series = [A, B]; last = "Épargne : " + eur(P) + " au départ, " + eur(M) + " par mois, " + Y + " an" + (Y > 1 ? "s" : "") + ", taux de démonstration " + nf(S.rate, 1) + " % → capital estimé " + eur(bal) + ".";
      $("[data-res-k]").textContent = "Capital estimé après " + Y + (Y > 1 ? " ans" : " an"); $("[data-res-big]").textContent = eur(bal);
      $("[data-res-a-k]").textContent = "Total versé"; $("[data-res-a]").textContent = eur(paid); $("[data-res-b-k]").textContent = "Intérêts estimés"; $("[data-res-b]").textContent = eur(bal - paid);
      $("[data-leg1]").textContent = "Capital cumulé"; $("[data-leg2]").textContent = "Total versé";
      var sr = "Avec " + eur(P) + " au départ et " + eur(M) + " par mois pendant " + Y + " ans à " + nf(S.rate, 1) + " %, le capital estimé est de " + eur(bal) + ", dont " + eur(bal - paid) + " d'intérêts.";
    } else {
      pay = R ? P * R / (1 - Math.pow(1 + R, -N)) : P / N; var cum = 0; A.push(P); B.push(0);
      for (i = 1; i <= N; i++) { var it = bal * R; bal = bal - (pay - it); cum += it; if (i % 12 === 0) { A.push(Math.max(0, bal)); B.push(cum); } }
      intr = pay * N - P; series = [A, B]; last = "Prêt : " + eur(P) + " sur " + Y + " an" + (Y > 1 ? "s" : "") + ", taux de démonstration " + nf(S.rate, 1) + " % → mensualité estimée " + eur(pay) + ", coût des intérêts " + eur(intr) + ".";
      $("[data-res-k]").textContent = "Mensualité estimée"; $("[data-res-big]").textContent = eur(pay);
      $("[data-res-a-k]").textContent = "Coût des intérêts"; $("[data-res-a]").textContent = eur(intr); $("[data-res-b-k]").textContent = "Total remboursé"; $("[data-res-b]").textContent = eur(pay * N);
      $("[data-leg1]").textContent = "Capital restant dû"; $("[data-leg2]").textContent = "Intérêts déjà payés";
      sr = "Pour un prêt de " + eur(P) + " sur " + Y + " ans à " + nf(S.rate, 1) + " %, la mensualité estimée est de " + eur(pay) + " et les intérêts totaux de " + eur(intr) + ".";
    }
    $("[data-sum]").textContent = last; var lk = $("[data-sum-link]"); if (lk) lk.setAttribute("href", "/contact?simulation=" + encodeURIComponent(last));
    clearTimeout(srT); srT = setTimeout(function () { $("[data-res-sr]").textContent = sr; }, 500);
    render(); table();
  }
  var W = 640, H = 280, L = 56, Rr = 16, T = 14, Bt = 30, ymax = 1;
  function xy(i, v, n) { return [L + i * (W - L - Rr) / n, T + (H - T - Bt) * (1 - v / ymax)]; }
  function render() {
    var n = series[0].length - 1; ymax = Math.max.apply(0, series[0].concat(series[1])) * 1.05 || 1;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    for (var g = 0; g <= 4; g++) {
      var y = T + (H - T - Bt) * g / 4; svg.appendChild(el("line", { x1: L, x2: W - Rr, y1: y, y2: y, stroke: "#1d3631" }));
      var t = el("text", { x: L - 8, y: y + 4, "text-anchor": "end", fill: "#93aba3", "font-size": 11, "font-family": "monospace" }); t.textContent = nf(ymax * (1 - g / 4) / 1000, 1) + " k"; svg.appendChild(t);
    }
    [0, Math.round(n / 2), n].forEach(function (i, k, a) { if (k && a[k - 1] === i) return; var p = xy(i, 0, n), t = el("text", { x: p[0], y: H - 8, "text-anchor": k === 0 ? "start" : k === 2 ? "end" : "middle", fill: "#93aba3", "font-size": 11, "font-family": "monospace" }); t.textContent = "an " + i; svg.appendChild(t); });
    var d1 = series[0].map(function (v, i) { return (i ? "L" : "M") + xy(i, v, n).map(function (z) { return z.toFixed(1); }).join(" "); }).join("");
    var d2 = series[1].map(function (v, i) { return (i ? "L" : "M") + xy(i, v, n).map(function (z) { return z.toFixed(1); }).join(" "); }).join("");
    svg.appendChild(el("path", { d: d1 + "L" + (W - Rr) + " " + (H - Bt) + "L" + L + " " + (H - Bt) + "Z", fill: "#3df0b0", opacity: ".14" }));
    svg.appendChild(el("path", { d: d2, fill: "none", stroke: "#ffb454", "stroke-width": 2, "stroke-dasharray": "5 4" }));
    svg.appendChild(el("path", { d: d1, fill: "none", stroke: "#3df0b0", "stroke-width": 2.5, "stroke-linejoin": "round" }));
    var cur = el("line", { x1: 0, x2: 0, y1: T, y2: H - Bt, stroke: "#e6f4ef", "stroke-opacity": ".4", visibility: "hidden" }), dot = el("circle", { r: 5, fill: "#3df0b0", stroke: "#06100e", "stroke-width": 2, visibility: "hidden" });
    svg.appendChild(cur); svg.appendChild(dot); svg._c = [cur, dot, n];
  }
  function hover(e) {
    var c = svg._c; if (!c || !series.length) return; var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, n = c[2];
    var i = Math.max(0, Math.min(n, Math.round((x - L) / (W - L - Rr) * n))), p = xy(i, series[0][i], n);
    c[0].setAttribute("x1", p[0]); c[0].setAttribute("x2", p[0]); c[1].setAttribute("cx", p[0]); c[1].setAttribute("cy", p[1]); c[0].setAttribute("visibility", "visible"); c[1].setAttribute("visibility", "visible");
    tip.innerHTML = ""; tip.appendChild(document.createTextNode("An " + i + " · " + eur(series[0][i]))); tip.appendChild(document.createElement("br")); tip.appendChild(document.createTextNode($("[data-leg2]").textContent + " : " + eur(series[1][i])));
    tip.classList.add("is-on"); var px = p[0] / W * r.width; tip.style.transform = "translateX(" + Math.min(Math.max(0, px - 70), r.width - 170) + "px)";
  }
  chart.addEventListener("pointermove", hover);
  chart.addEventListener("pointerleave", function () { tip.classList.remove("is-on"); if (svg._c) { svg._c[0].setAttribute("visibility", "hidden"); svg._c[1].setAttribute("visibility", "hidden"); } });
  function table() {
    var host = $("[data-table]"), t = document.createElement("table"), h = document.createElement("thead"), tb = document.createElement("tbody");
    var cap = document.createElement("caption"); cap.className = "lg-sr"; cap.textContent = "Valeurs de la simulation, année par année"; t.appendChild(cap);
    var hr = h.insertRow(); ["Année", $("[data-leg1]").textContent, $("[data-leg2]").textContent].forEach(function (x) { var th = document.createElement("th"); th.scope = "col"; th.textContent = x; hr.appendChild(th); });
    series[0].forEach(function (v, i) { var r = tb.insertRow(); [i, eur(v), eur(series[1][i])].forEach(function (x, k) { var td = r.insertCell(); td.className = "lg-n"; td.textContent = x; }); });
    t.appendChild(h); t.appendChild(tb); host.innerHTML = ""; host.appendChild(t);
  }
  var cp = $("[data-copy]"); if (cp) cp.addEventListener("click", function (e) {
    e.preventDefault(); var done = function () { cp.textContent = "Résumé copié"; setTimeout(function () { cp.textContent = "Copier le résumé"; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(last).then(done, function () {}); });
  setMode("sav");
})();
