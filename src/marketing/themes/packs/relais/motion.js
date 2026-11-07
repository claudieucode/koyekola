/* Relais : compteurs, barres avant/après, filtre des études, témoin de la méthode qui avance au défilement. Aucune dépendance ; inactif hors du thème Relais. */
(function () {
  var B = document.body;
  if (!B || B.getAttribute("data-kw-pack") !== "relais") return;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var all = function (s, e) { return [].slice.call((e || document).querySelectorAll(s)); };
  var one = function (s, e) { return (e || document).querySelector(s); };
  var prevent = function (e) { if (e && e.preventDefault) e.preventDefault(); };
  var mo = B.getAttribute("data-pk-motion");
  var still = RM || mo === "off";
  if (!still) B.classList.add("rl-js");

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (e.key === " " && t && t.tagName === "A" && t.getAttribute("role") === "button") { e.preventDefault(); t.click(); }
  });

  // ----- compteurs : de 0 à la valeur, une seule fois, quand ils entrent à l'écran -----
  var fmt = function (v, dec) { return (dec ? v.toFixed(1) : String(Math.round(v))).replace(".", ","); };
  var run = function (el) {
    var end = parseFloat(el.getAttribute("data-rl-count")), pre = ({ plus: "+", moins: "−", fois: "×" })[el.getAttribute("data-pre")] || "", suf = ({ pct: " %", sem: " sem." })[el.getAttribute("data-suf")] || "";
    var dec = String(el.getAttribute("data-rl-count")).indexOf(".") > -1, t0 = null, dur = 1200;
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(end * e, dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  var targets = all("[data-rl-count]");
  var bars = all(".rl-ba");
  if ("IntersectionObserver" in window && !still) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        io.unobserve(x.target);
        if (x.target.hasAttribute("data-rl-count")) run(x.target); else x.target.classList.add("rl-in");
      });
    }, { threshold: 0.35 });
    targets.forEach(function (t) { io.observe(t); });
    bars.forEach(function (t) { io.observe(t); });
  } else { bars.forEach(function (b) { b.classList.add("rl-in"); }); B.classList.remove("rl-js"); }

  // ----- études : filtre par service et par mot -----
  var list = one("[data-rl-list]");
  if (list) {
    var cases = all(".rl-case", list), st = { f: "tout", q: "" }, out = one("[data-rl-count-out]"), empty = one("[data-rl-empty]");
    var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var apply = function () {
      var n = 0;
      cases.forEach(function (c) {
        var ok = (st.f === "tout" || (c.getAttribute("data-sv") || "").split(" ").indexOf(st.f) > -1) && (!st.q || norm(c.getAttribute("data-hay") || "").indexOf(st.q) > -1);
        c.classList.toggle("rl-hid", !ok); if (ok) n++;
      });
      if (out) out.textContent = n === 0 ? "Aucune étude" : n === 1 ? "1 étude" : n + " études";
      if (empty) empty.classList.toggle("rl-hid", n !== 0);
    };
    var slot = one("[data-rl-search]");
    if (slot) {
      var inp = document.createElement("input");
      inp.type = "search"; inp.placeholder = "Client, secteur, mot…"; inp.setAttribute("aria-label", "Rechercher dans les études");
      inp.addEventListener("input", function () { st.q = norm(inp.value.trim()); apply(); });
      slot.appendChild(inp);
    }
    all("[data-rl-f]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        prevent(e); st.f = a.getAttribute("data-rl-f");
        all("[data-rl-f]").forEach(function (x) { x.classList.toggle("is-on", x === a); });
        apply();
      });
    });
    var rs = one("[data-rl-reset]");
    if (rs) rs.addEventListener("click", function (e) {
      prevent(e); st = { f: "tout", q: "" };
      all("[data-rl-f]").forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-rl-f") === "tout"); });
      var i2 = slot && one("input", slot); if (i2) i2.value = ""; apply();
    });
  }

  // ----- méthode : le témoin avance avec le défilement de la page -----
  var track = one("[data-rl-track]");
  if (track && !still) {
    var ticking = false;
    var upd = function () {
      ticking = false;
      var r = track.getBoundingClientRect(), vh = window.innerHeight || 700;
      var p = (vh * 0.65 - r.top) / Math.max(1, r.height);
      p = Math.max(0.04, Math.min(1, p));
      track.style.setProperty("--rl-p", p.toFixed(3));
    };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } };
    window.addEventListener("scroll", req, { passive: true }); window.addEventListener("resize", req); upd();
  }
})();
