/* Héliade : cycle du jour (soleil + courbe de production), barre qui se solidifie, apparitions, compteurs, onglets, filtres et calculateur d'économies. Sans dépendance ; mouvement réduit respecté. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "heliade") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = "http://www.w3.org/2000/svg";
  function fmt(n, d) { return n.toLocaleString("fr-FR", { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }

  // Barre transparente -> pleine
  var head = $(".he-head");
  function onScroll() { if (head) head.classList.toggle("is-solid", (window.pageYOffset || document.documentElement.scrollTop) > 24); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  $$(".he-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.removeAttribute("open"); }); });

  // Apparitions
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("he-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (e, i) { e.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(e); });
  }

  // Compteurs
  var cnt = $$("[data-count]");
  if (cnt.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      var t = e.target, to = parseInt(t.getAttribute("data-count"), 10), suf = t.getAttribute("data-suffix") || "", yr = to > 1900 && to < 2100;
      function show(v) { t.textContent = (yr ? String(v) : fmt(v)) + suf; }
      if (reduce || isNaN(to)) { show(to); return; }
      var s0 = null; (function step(ts) { if (!s0) s0 = ts; var p = Math.min(1, (ts - s0) / 1400); show(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); })(performance.now());
    }); }, { threshold: 0.4 });
    cnt.forEach(function (c) { co.observe(c); });
  }

  // Onglets
  $$("[data-tabs]").forEach(function (root) {
    var tabs = $$("a[data-tab]", root), cur = $("a.is-on[data-tab]", root);
    $$("[data-panel]", root).forEach(function (p) { p.hidden = !cur || p.getAttribute("data-panel") !== cur.getAttribute("data-tab"); });
    tabs.forEach(function (a) { a.setAttribute("aria-selected", a.classList.contains("is-on")); a.addEventListener("click", function (e) {
      e.preventDefault(); var k = a.getAttribute("data-tab");
      tabs.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on); });
      $$("[data-panel]", root).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== k; });
    }); });
  });
  // Filtres
  $$("[data-filters]").forEach(function (root) {
    var fs = $$("a[data-filter]", root), items = $$("[data-cat]", root), empty = $(".he-empty", root);
    fs.forEach(function (a) { a.setAttribute("aria-pressed", a.classList.contains("is-on")); a.addEventListener("click", function (e) {
      e.preventDefault(); var k = a.getAttribute("data-filter"), n = 0;
      fs.forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-pressed", x === a); });
      items.forEach(function (it) { var ok = k === "all" || it.getAttribute("data-cat") === k; it.hidden = !ok; if (ok) { n++; it.classList.add("is-in"); } });
      if (empty) empty.classList.toggle("is-on", n === 0);
    }); });
  });

  // Cycle du jour
  var live = $("[data-cycle]");
  if (live) {
    var sun = $("[data-sun]", live), dusk = $("[data-dusk]", live), curve = $("[data-curve]", live), area = $("[data-area]", live), dot = $("[data-dot]", live);
    var kw = $("[data-kw]", live), kwh = $("[data-kwh]", live), tm = $("[data-time]", live), N = 80, tab = [0], i;
    var bell = function (p) { return Math.pow(Math.max(0, Math.sin(Math.PI * p)), 1.5); };
    for (i = 1; i <= N; i++) tab.push(tab[i - 1] + bell((i - 0.5) / N) * 14 / N);
    var px = function (p) { return 20 + 560 * p; }, py = function (p) { return 110 - 88 * bell(p); };
    var draw = function (p) {
      var x = 40 + 520 * p, y = 290 - 600 * p * (1 - p);
      sun.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")");
      dusk.setAttribute("opacity", (0.38 * (1 - Math.pow(Math.sin(Math.PI * p), 0.5))).toFixed(2));
      var d = "M" + px(0) + " 110", k, m = Math.max(1, Math.round(p * N));
      for (k = 1; k <= m; k++) { var q = p * k / m; d += "L" + px(q).toFixed(1) + " " + py(q).toFixed(1); }
      curve.setAttribute("d", d); area.setAttribute("d", d + "L" + px(p).toFixed(1) + " 110Z");
      dot.setAttribute("cx", px(p).toFixed(1)); dot.setAttribute("cy", py(p).toFixed(1));
      var hr = 6 + 14 * p, h = Math.floor(hr), mi = Math.floor((hr - h) * 60);
      kw.textContent = fmt(4.2 * bell(p), 1); kwh.textContent = fmt(4.2 * tab[Math.round(p * N)], 1); tm.textContent = (h < 10 ? "0" : "") + h + " h " + (mi < 10 ? "0" : "") + mi;
    };
    if (reduce || b.getAttribute("data-pk-cycle") === "off") draw(0.5);
    else {
      var vis = true, P = 28000, t0 = performance.now();
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(live);
      (function loop(ts) { if (vis) draw(Math.min(1, ((ts - t0) % P) / (P * 0.92))); requestAnimationFrame(loop); })(t0);
    }
  }

  // Calculateur d'économies d'énergie
  var calc = $("[data-calc]"); if (!calc) return;
  var box = $("[data-fields]", calc), chartBox = $("[data-chart]", calc), svg = $("svg", chartBox), tip = $(".he-tip", calc);
  var ORI = [["Plein sud", 1], ["Sud-est ou sud-ouest", 0.95], ["Est ou ouest", 0.85], ["Toit plat avec supports", 0.9], ["Nord-est ou nord-ouest", 0.65]];
  var REG = [["Hauts-de-France", 980], ["Île-de-France", 1050], ["Bretagne", 1080], ["Pays de la Loire", 1130], ["Bourgogne-Franche-Comté", 1100], ["Nouvelle-Aquitaine", 1250], ["Auvergne-Rhône-Alpes", 1220], ["Occitanie", 1380], ["Provence-Alpes-Côte d'Azur", 1450]];
  var MP = [0.04, 0.055, 0.088, 0.108, 0.128, 0.138, 0.144, 0.128, 0.098, 0.064, 0.036, 0.031], MC = [0.11, 0.1, 0.09, 0.08, 0.075, 0.07, 0.07, 0.07, 0.075, 0.085, 0.095, 0.11];
  var MN = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"], MF = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var sp = MP.reduce(function (a, c) { return a + c; }, 0), sc = MC.reduce(function (a, c) { return a + c; }, 0);
  MP = MP.map(function (v) { return v / sp; }); MC = MC.map(function (v) { return v / sc; });
  var S = { ori: 0, reg: 3, surf: 33, cons: 5500, pilot: true }, out = {}, series = null, srT;

  function field(label, id) { var w = document.createElement("div"); w.className = "he-fld"; var h = document.createElement("div"); h.className = "he-fld-h"; var l = document.createElement("label"); l.className = "he-fld-l"; l.htmlFor = id; l.textContent = label; h.appendChild(l); w.appendChild(h); return { w: w, h: h }; }
  function sel(label, id, opts, key) {
    var f = field(label, id), s = document.createElement("select"); s.id = id;
    opts.forEach(function (o, i) { var op = document.createElement("option"); op.value = i; op.textContent = o[0]; s.appendChild(op); });
    s.value = S[key]; s.addEventListener("change", function () { S[key] = +s.value; run(); }); f.w.appendChild(s); return f.w;
  }
  function range(label, id, min, max, step, key, unit) {
    var f = field(label, id), r = document.createElement("input"), v = document.createElement("span"); v.className = "he-fld-v"; f.h.appendChild(v);
    r.type = "range"; r.id = id; r.min = min; r.max = max; r.step = step; r.value = S[key];
    function upd() { S[key] = +r.value; var txt = fmt(S[key]) + " " + unit; v.textContent = txt; r.setAttribute("aria-valuetext", txt); r.style.setProperty("--p", ((S[key] - min) / (max - min) * 100) + "%"); }
    r.addEventListener("input", function () { upd(); run(); }); upd(); f.w.appendChild(r); return f.w;
  }
  box.textContent = "";
  box.appendChild(sel("Orientation du toit", "he-f-ori", ORI, "ori"));
  box.appendChild(range("Surface de toit utilisable", "he-f-surf", 10, 120, 1, "surf", "m²"));
  box.appendChild(range("Consommation annuelle", "he-f-cons", 2000, 16000, 100, "cons", "kWh"));
  box.appendChild(sel("Région", "he-f-reg", REG, "reg"));
  var sw = document.createElement("label"), cb = document.createElement("input"), sp2 = document.createElement("span");
  sw.className = "he-sw"; cb.type = "checkbox"; cb.checked = true; sp2.textContent = "Je décale mes usages en journée (eau chaude, lave-linge)";
  cb.addEventListener("change", function () { S.pilot = cb.checked; run(); }); sw.appendChild(cb); sw.appendChild(sp2); box.appendChild(sw);
  $$("[data-k]", calc).forEach(function (e) { out[e.getAttribute("data-k")] = e; });

  var W = 640, H = 280, L = 50, R = 12, T = 12, B = 28;
  window.addEventListener("resize", function () { if (series && Math.abs(svg.getBoundingClientRect().width - W) > 8) draw2(); });
  function run() {
    var kwc = S.surf / 6, prod = kwc * REG[S.reg][1] * ORI[S.ori][1], share = S.pilot ? 0.6 : 0.45, self = 0;
    var P = MP.map(function (m) { return m * prod; }), C = MC.map(function (m) { return m * S.cons; });
    P.forEach(function (p, k) { self += Math.min(p, C[k] * share); });
    var surplus = prod - self, save = self * 0.22 + surplus * 0.13, cost = kwc * 2300, pay = save > 50 ? cost / save : 0, ratio = prod ? self / prod : 0, cover = S.cons ? self / S.cons : 0;
    out.prod.textContent = fmt(prod) + " kWh/an"; out.save.textContent = "≈ " + fmt(save) + " €"; out.kwc.textContent = fmt(kwc, 1) + " kWc";
    out.pay.textContent = pay ? "≈ " + fmt(pay, 1) + " ans" : "—";
    var sum = "Toit " + ORI[S.ori][0].toLowerCase() + ", " + S.surf + " m² (" + fmt(kwc, 1) + " kWc), " + REG[S.reg][0] + ", " + fmt(S.cons) + " kWh/an : production estimée " + fmt(prod) + " kWh/an, dont " + fmt(ratio * 100) + " % utilisés sur place (" + fmt(cover * 100) + " % de ma consommation), économies indicatives ≈ " + fmt(save) + " €/an, amortissement indicatif " + (pay ? "≈ " + fmt(pay, 1) + " ans" : "non significatif") + " (estimation de démonstration).";
    $("[data-sum]", calc).textContent = sum; $("[data-link]", calc).setAttribute("href", "/contact?simulation=" + encodeURIComponent(sum));
    clearTimeout(srT); srT = setTimeout(function () { $("[data-sr]", calc).textContent = "Mise à jour : production " + fmt(prod) + " kilowattheures par an, économies indicatives " + fmt(save) + " euros par an."; }, 600);
    series = { P: P, C: C }; draw2();
  }
  function draw2() {
    W = Math.round(svg.getBoundingClientRect().width) || 640; H = W < 480 ? 240 : 280; L = W < 480 ? 38 : 50; svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var P = series.P, C = series.C, ymax = Math.max.apply(0, P.concat(C)) * 1.12 || 1, unit = [50, 100, 200, 250, 500, 1000, 2000].filter(function (u) { return u * 4 >= ymax; })[0] || 4000, g;
    ymax = unit * 4; var bw = (W - L - R) / 12;
    svg.setAttribute("aria-label", "Production et consommation mensuelles estimées en kilowattheures. Production maximale " + fmt(Math.max.apply(0, P)) + " en été.");
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    for (g = 0; g <= 4; g++) {
      var y = T + (H - T - B) * g / 4; svg.appendChild(el("line", { x1: L, x2: W - R, y1: y, y2: y, stroke: "#dbeae3", "stroke-width": 1 }));
      var t = el("text", { x: L - 8, y: y + 4, "text-anchor": "end", fill: "#4f6a62", "font-size": 11, "font-family": "sans-serif" }); t.textContent = fmt(ymax * (1 - g / 4)); svg.appendChild(t);
    }
    P.forEach(function (v, k) {
      var h = (H - T - B) * v / ymax, x = L + k * bw + bw * 0.16;
      svg.appendChild(el("rect", { x: x, y: H - B - h, width: bw * 0.68, height: Math.max(0, h), rx: 5, fill: "#ffb400" }));
      var t2 = el("text", { x: L + k * bw + bw / 2, y: H - 9, "text-anchor": "middle", fill: "#4f6a62", "font-size": 12, "font-family": "sans-serif" }); t2.textContent = MN[k]; svg.appendChild(t2);
    });
    var d = C.map(function (v, k) { return (k ? "L" : "M") + (L + k * bw + bw / 2).toFixed(1) + " " + (T + (H - T - B) * (1 - v / ymax)).toFixed(1); }).join("");
    svg.appendChild(el("path", { d: d, fill: "none", stroke: "#2f7fc4", "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    C.forEach(function (v, k) { svg.appendChild(el("circle", { cx: L + k * bw + bw / 2, cy: T + (H - T - B) * (1 - v / ymax), r: 4, fill: "#fff", stroke: "#2f7fc4", "stroke-width": 2 })); });
  }
  function hover(e) {
    if (!series) return; var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, k = Math.floor((x - L) / ((W - L - R) / 12));
    if (k < 0 || k > 11) { tip.classList.remove("is-on"); return; }
    tip.textContent = MF[k] + " · production " + fmt(series.P[k]) + " kWh · consommation " + fmt(series.C[k]) + " kWh";
    var left = (L + k * (W - L - R) / 12) / W * r.width; tip.style.left = Math.max(4, Math.min(left - 60, chartBox.clientWidth - tip.offsetWidth - 4)) + "px"; tip.classList.add("is-on");
  }
  chartBox.addEventListener("pointermove", hover); chartBox.addEventListener("pointerdown", hover); chartBox.addEventListener("pointerleave", function () { tip.classList.remove("is-on"); });
  run();
})();
