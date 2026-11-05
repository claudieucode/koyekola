/* Élan — compteurs d'impact, module de don de démonstration, filtres et onglets. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "elan") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fr = function (n, d) { return n.toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };

  // Hauteur de l'en-tête (menu mobile)
  var head = document.querySelector(".el-head");
  function sizeHead() { if (head) b.style.setProperty("--el-headh", head.offsetHeight + "px"); }
  sizeHead(); window.addEventListener("resize", sizeHead);

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("el-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  }

  // Compteurs d'impact
  var counters = $$("[data-count]");
  function runCount(el) {
    var to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "";
    if (reduce || isNaN(to)) { el.textContent = fr(to) + suf; return; }
    var start = null;
    function step(ts) { if (!start) start = ts; var p = Math.min(1, (ts - start) / 1600); el.textContent = fr(Math.round(to * (1 - Math.pow(1 - p, 3)))) + suf; if (p < 1) requestAnimationFrame(step); }
    el.textContent = "0" + suf; requestAnimationFrame(step);
  }
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { co.unobserve(e.target); runCount(e.target); } }); }, { threshold: 0.4 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // Compteur « en direct » (simulation)
  $$("[data-live]").forEach(function (el) {
    var rate = parseFloat(el.getAttribute("data-live")) || 0.4, t0 = Date.now();
    function upd() { el.textContent = "+" + fr(Math.floor((Date.now() - t0) / 1000 * rate * 10)); }
    upd(); setInterval(upd, 1500);
  });

  // Filtres (missions, actualités)
  $$("[data-filter]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      var tabs = a.parentNode, scope = document, key = a.getAttribute("data-filter"), shown = 0;
      $$("[data-filter]", tabs).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
      $$("[data-filterable] > [data-cat]", scope).forEach(function (card) { var ok = key === "tout" || card.getAttribute("data-cat") === key; card.hidden = !ok; if (ok) shown++; });
      var n = scope.querySelector('[data-out="n"]'); if (n) n.textContent = shown;
    });
  });

  // Onglets (Agir) et filtre bénévolat
  $$("[data-tab]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      var scope = a.closest(".el-agir") || document;
      $$("[data-tab]", a.parentNode).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
      $$("[data-panel]", scope).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== a.getAttribute("data-tab"); });
    });
  });
  $$("[data-vfilter]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      var key = a.getAttribute("data-vfilter");
      $$("[data-vfilter]", a.parentNode).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
      $$(".el-role").forEach(function (r) { r.hidden = !(key === "tout" || r.getAttribute("data-where") === key); });
    });
  });

  // Module de don : démonstration, aucun paiement
  var UNITS = {
    eau: [6, function (n) { return n + " mois d'eau potable"; }, "pour une famille entière"],
    repas: [0.8, function (n) { return n + " repas chaud" + (n > 1 ? "s" : ""); }, "servis dans une cantine solidaire"],
    ecole: [14, function (n) { return n + " kit" + (n > 1 ? "s" : "") + " scolaire" + (n > 1 ? "s" : ""); }, "cahiers, stylos, cartable"],
    soins: [9, function (n) { return n + " consultation" + (n > 1 ? "s" : ""); }, "dans un poste de soins de proximité"]
  };
  $$("[data-don]").forEach(function (box) {
    var s = { amt: 30, freq: "month", cause: "eau" };
    var out = function (k) { return box.querySelector('[data-out="' + k + '"]'); };
    function pick(group, attr, val) { $$("[" + attr + "]", group).forEach(function (x) { x.setAttribute("aria-checked", x.getAttribute(attr) === String(val) ? "true" : "false"); }); }
    function render() {
      var u = UNITS[s.cause], per = Math.floor(s.amt / u[0] + 1e-9), word = s.freq === "month" ? "par mois" : "une seule fois";
      out("amount").textContent = fr(s.amt) + " €";
      out("sum").textContent = fr(s.amt) + " € " + word;
      out("eq").textContent = u[1](fr(per)); out("eqtxt").textContent = u[2];
      out("year").textContent = s.freq === "month" ? "Sur un an : " + fr(s.amt * 12) + " €, soit " + u[1](fr(Math.floor(s.amt * 12 / u[0] + 1e-9))) + "." : "Don unique, sans engagement : vous pourrez le renouveler quand vous le souhaitez.";
      out("net").textContent = "coût réel " + fr(s.amt * 0.34, 2) + " €" + (s.freq === "month" ? " par mois" : "");
      $$("[data-amt]", box).forEach(function (x) { x.setAttribute("aria-checked", Number(x.getAttribute("data-amt")) === s.amt ? "true" : "false"); });
      $$("[data-freq]", box).forEach(function (x) { x.setAttribute("aria-checked", x.getAttribute("data-freq") === s.freq ? "true" : "false"); });
      $$("[data-cause]", box).forEach(function (x) { x.setAttribute("aria-checked", x.getAttribute("data-cause") === s.cause ? "true" : "false"); });
    }
    function recap() {
      return "Récapitulatif de don (démonstration) : " + out("sum").textContent + ", pour « " + out("eq").textContent + " » (" + s.cause + "). " + out("net").textContent + " après déduction indicative.";
    }
    box.addEventListener("click", function (ev) {
      var a = ev.target.closest ? ev.target.closest("a") : null; if (!a || !box.contains(a)) return;
      if (a.hasAttribute("data-recap")) { try { if (navigator.clipboard) navigator.clipboard.writeText(recap()); } catch (e) {} try { sessionStorage.setItem("elan-recap", recap()); } catch (e2) {} return; }
      ev.preventDefault();
      if (a.hasAttribute("data-amt")) s.amt = Number(a.getAttribute("data-amt"));
      else if (a.hasAttribute("data-step")) s.amt = Math.max(5, Math.min(500, s.amt + Number(a.getAttribute("data-step"))));
      else if (a.hasAttribute("data-freq")) s.freq = a.getAttribute("data-freq");
      else if (a.hasAttribute("data-cause")) s.cause = a.getAttribute("data-cause");
      render();
    });
    // Clavier : flèches dans un groupe de choix
    $$('[role="radiogroup"]', box).forEach(function (g) {
      g.addEventListener("keydown", function (ev) {
        if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].indexOf(ev.key) < 0) return;
        var items = $$("a", g), i = items.indexOf(document.activeElement); if (i < 0) return;
        ev.preventDefault(); var n = items[(i + (ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]; n.focus(); n.click();
      });
    });
    render();
  });

  // Menu mobile : se referme au clic sur un lien
  $$(".el-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
})();
