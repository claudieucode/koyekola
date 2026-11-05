/* Laboratoire — tracé de courbes, réticule de lecture, filtres, compteurs. Sans dépendance ; simplifié si l'utilisateur préfère moins de mouvement. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "labo") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var io = "IntersectionObserver" in window;
  var trace = b.getAttribute("data-pk-trace") !== "off";
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = "http://www.w3.org/2000/svg";

  var head = document.querySelector(".lb-head");
  function sizeHead() { if (head) b.style.setProperty("--lb-headh", head.offsetHeight + "px"); }
  sizeHead(); window.addEventListener("resize", sizeHead);

  // Apparition au défilement
  if (!reduce && io) {
    b.classList.add("lb-js");
    var rv = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); rv.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; rv.observe(el); });
  }

  // Tracé des courbes (stroke-dashoffset) à l'apparition de chaque figure
  if (!reduce && io && trace) {
    b.classList.add("lb-tr");
    var dr = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; dr.unobserve(e.target);
        var fig = e.target;
        requestAnimationFrame(function () {
          $$(".lb-draw", fig).forEach(function (p, i) { p.style.transition = "stroke-dashoffset 1.7s cubic-bezier(.3,.6,.2,1) " + i * 90 + "ms"; p.style.strokeDashoffset = "0"; });
          fig.classList.add("is-drawn");
          setTimeout(function () { $$(".lb-draw", fig).forEach(function (p) { p.style.strokeDasharray = ""; p.style.transition = ""; }); }, 2800);
        });
      });
    }, { threshold: 0.25 });
    $$("[data-draw]").forEach(function (fig) {
      $$(".lb-draw", fig).forEach(function (p) {
        var len = 0; try { len = p.getTotalLength(); } catch (x) {}
        if (len) { p.style.strokeDasharray = len + " " + len; p.style.strokeDashoffset = len; }
      });
      dr.observe(fig);
    });
  }

  // Compteurs
  var cs = $$("[data-count]");
  if (cs.length && io) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute("data-count"), 10); if (isNaN(to)) return;
        if (reduce) { el.textContent = to; return; }
        var t0 = null; (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1300); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: 0.4 });
    cs.forEach(function (c) { co.observe(c); });
  }

  // Graphiques : réticule + infobulle au survol, au toucher et au clavier
  $$(".lb-chart").forEach(function (c) {
    var svg = c.querySelector("svg"), tip = c.querySelector(".lb-tip"), ret = c.querySelector(".lb-ret"); if (!svg || !tip || !ret) return;
    var rv_ = ret.querySelector(".lb-rv"), rh = ret.querySelector(".lb-rh"), dots = $$(".lb-dot", ret), xy = c.getAttribute("data-k") === "xy", unit = c.getAttribute("data-unit") || "", S = [], i = 1, cur = 0, W = 600, H = 300;
    while (c.hasAttribute("data-s" + i)) {
      var raw = c.getAttribute("data-s" + i).split("~");
      S.push({ n: raw[0], p: raw[1].split(";").map(function (t) { var a = t.split("|"); return { l: a[0], v: a[1], x: +a[2], y: +a[3] }; }) }); i++;
    }
    if (!S.length) return;
    function show(k) {
      var P = S[0].p; k = Math.max(0, Math.min(P.length - 1, k)); cur = k; var p0 = P[k], top = p0.y;
      rv_.setAttribute("x1", p0.x); rv_.setAttribute("x2", p0.x); rh.setAttribute("y1", p0.y); rh.setAttribute("y2", p0.y);
      S.forEach(function (s, j) { var q = s.p[k], d = dots[j]; if (!q || !d) return; d.setAttribute("cx", q.x); d.setAttribute("cy", q.y); top = Math.min(top, q.y); });
      while (tip.firstChild) tip.removeChild(tip.firstChild);
      var h = document.createElement("b"); h.textContent = p0.l; tip.appendChild(h);
      S.forEach(function (s) { var q = s.p[k]; if (!q) return; var l = document.createElement("span"); l.textContent = s.n + " : " + q.v + (unit ? " " + unit : ""); tip.appendChild(l); });
      tip.style.left = (p0.x / W * 100) + "%"; tip.style.top = (p0.y / H * 100) + "%";
      tip.className = "lb-tip is-on lb-tip--" + (p0.x > W * 0.55 ? "r" : "l");
      ret.classList.add("is-on");
    }
    function hide() { ret.classList.remove("is-on"); tip.classList.remove("is-on"); }
    function at(ev) {
      var r = svg.getBoundingClientRect(); if (!r.width) return;
      var vx = (ev.clientX - r.left) / r.width * W, vy = (ev.clientY - r.top) / r.height * H, best = 0, bd = 1e9;
      S[0].p.forEach(function (p, k) { var d = Math.pow(p.x - vx, 2) + (xy ? Math.pow(p.y - vy, 2) : 0); if (d < bd) { bd = d; best = k; } });
      show(best);
    }
    tip.setAttribute("aria-live", "off");
    svg.addEventListener("pointermove", function (ev) { tip.setAttribute("aria-live", "off"); at(ev); });
    svg.addEventListener("pointerdown", at);
    svg.addEventListener("pointerleave", function () { if (document.activeElement !== c) hide(); });
    c.setAttribute("tabindex", "0"); c.setAttribute("role", "group");
    c.setAttribute("aria-label", (svg.getAttribute("aria-label") || "Graphique") + " — flèches gauche et droite pour lire les valeurs");
    c.addEventListener("focus", function () { show(cur); });
    c.addEventListener("blur", hide);
    c.addEventListener("keydown", function (ev) {
      var d = ev.key === "ArrowRight" || ev.key === "ArrowUp" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowDown" ? -1 : ev.key === "Home" ? -999 : ev.key === "End" ? 999 : 0;
      if (!d) return; ev.preventDefault(); tip.setAttribute("aria-live", "polite"); show(cur + d);
    });
  });

  // Filtres (publications, équipes) : liens pilotés par le script
  $$("[data-filters]").forEach(function (box) {
    var scope = box.closest("[data-scope]"); if (!scope) return;
    var st = {}, items = $$("[data-item]", scope), count = scope.querySelector(".lb-count"), empty = scope.querySelector("[data-empty]");
    var noun = count ? (count.textContent.indexOf("personne") > -1 ? ["personne", "personnes"] : ["résultat", "résultats"]) : null;
    $$("a[data-fk]", box).forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault(); var k = a.getAttribute("data-fk"); st[k] = a.getAttribute("data-fv");
        $$('a[data-fk="' + k + '"]', box).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        var n = 0;
        items.forEach(function (it) { var ok = Object.keys(st).every(function (kk) { return st[kk] === "all" || it.getAttribute("data-" + kk) === st[kk]; }); it.hidden = !ok; if (ok) n++; });
        if (count) count.textContent = n + " " + (n > 1 ? noun[1] : noun[0]);
        if (empty) empty.hidden = n > 0;
      });
    });
  });

  // « Citer cet article » : copie de la référence
  $$("[data-copy]").forEach(function (a) {
    var label = a.textContent;
    a.addEventListener("click", function (ev) {
      ev.preventDefault(); var t = a.parentNode.querySelector(".lb-cite-t"); if (!t) return;
      var done = function () { a.textContent = "Référence copiée"; setTimeout(function () { a.textContent = label; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t.textContent).then(done, function () { sel(t); });
      else sel(t);
      function sel(n) { var r = document.createRange(); r.selectNodeContents(n); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); a.textContent = "Texte sélectionné : copiez-le"; }
    });
  });

  // Lecture des coordonnées du curseur dans l'en-tête de page d'accueil
  var hero = document.querySelector(".lb-hero"), xy = hero && hero.querySelector(".lb-xy");
  if (hero && xy && !reduce) hero.addEventListener("pointermove", function (ev) {
    var r = hero.getBoundingClientRect(); xy.textContent = "X " + ((ev.clientX - r.left) / r.width).toFixed(3) + " · Y " + ((ev.clientY - r.top) / r.height).toFixed(3);
  });

  // Menu mobile : se referme au clic sur un lien
  $$(".lb-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
})();
