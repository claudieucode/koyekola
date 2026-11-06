// Gradin — comportements du thème : leçons à cocher avec progression (anneau, durée restante) mémorisée dans le navigateur, ouverture/fermeture des modules,
// filtre des formations par niveau, paiement en une ou trois fois (montants recalculés), révélation douce. Aucune dépendance ; sans script, tout reste lisible.
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "gradin") return;
  var body = document.body;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var KEY = "gradin-parcours";
  var eur = function (n) { return n.toFixed(2).replace(".", ",").replace(",00", "") + " €"; };

  if (!calm && "IntersectionObserver" in window) {
    body.classList.add("gr-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (n) { if (n.getBoundingClientRect().top < window.innerHeight) n.classList.add("is-in"); else io.observe(n); });
    setTimeout(function () { $$("[data-reveal]").forEach(function (n) { n.classList.add("is-in"); }); }, 2500);
  }

  // ----- filtre des formations -----
  var fil = $("[data-filters]");
  if (fil) {
    var items = $$(".gr-f"), empty = $("[data-empty]"), cur = "";
    var apply = function () {
      var n = 0; items.forEach(function (it) { var ok = !cur || it.getAttribute("data-niv") === cur; it.hidden = !ok; if (ok) n++; });
      $$(".gr-chip", fil).forEach(function (c) { var v = c.getAttribute("data-niv"), on = (v === "tous" ? "" : v) === cur; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      if (empty) empty.hidden = n > 0;
    };
    var fromHash = function () { var h = (location.hash || "").slice(1); cur = h && h !== "tous" && $("[data-niv='" + h + "']", fil) ? h : ""; };
    fromHash(); apply();
    fil.addEventListener("click", function (ev) { var c = ev.target.closest && ev.target.closest(".gr-chip"); if (!c) return; ev.preventDefault(); var v = c.getAttribute("data-niv"); cur = v === "tous" ? "" : v; try { history.replaceState(null, "", cur ? "#" + cur : location.pathname); } catch (e) {} apply(); });
    window.addEventListener("hashchange", function () { fromHash(); apply(); });
  }

  // ----- paiement en une ou trois fois -----
  var pay = $("[data-pay]");
  if (pay) {
    var setPay = function (n) {
      $$("[data-plan]").forEach(function (p) {
        var price = +p.getAttribute("data-price");
        $("[data-amount]", p).textContent = n === 1 ? eur(price) : "3 × " + eur(price / 3);
        $("[data-per]", p).textContent = n === 1 ? "paiement unique" : "soit " + eur(price) + " au total, sans frais";
      });
      $$(".gr-chip", pay).forEach(function (c) { var on = +c.getAttribute("data-n") === n; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
    };
    pay.addEventListener("click", function (ev) { var c = ev.target.closest && ev.target.closest(".gr-chip"); if (!c) return; ev.preventDefault(); setPay(+c.getAttribute("data-n")); });
  }

  // ----- programme : leçons cochables, progression mémorisée -----
  var mods = $("[data-mods]"), ring = $("[data-ring]");
  if (mods && ring) {
    var done = {};
    try { done = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { done = {}; }
    var lessons = $$(".gr-l", mods);
    var total = lessons.length, totalMin = lessons.reduce(function (a, l) { return a + (+l.getAttribute("data-min")); }, 0);
    var hm = function (m) { return Math.floor(m / 60) + " h " + (m % 60 < 10 ? "0" : "") + (m % 60); };
    var msgs = ["Première marche : choisissez une leçon.", "C'est parti, la première marche est franchie.", "Belle progression, continuez ainsi.", "Plus de la moitié du chemin est derrière vous.", "Dernière ligne droite !", "Parcours terminé, bravo !"];
    var render = function () {
      var n = 0, left = totalMin;
      lessons.forEach(function (l) { var on = !!done[l.getAttribute("data-id")]; l.classList.toggle("is-done", on); var c = $(".gr-chk", l); c.setAttribute("aria-checked", on ? "true" : "false"); if (on) { n++; left -= +l.getAttribute("data-min"); } });
      var pct = Math.round(n / total * 100);
      $(".gr-ring", ring).style.setProperty("--p", pct); $("[data-pct]", ring).textContent = pct + " %";
      $("[data-done]", ring).textContent = n; $("[data-left]", ring).textContent = left > 0 ? hm(left) + " restantes" : "Aucune leçon restante";
      $("[data-msg]", ring).textContent = n === 0 ? msgs[0] : n === total ? msgs[5] : pct < 25 ? msgs[1] : pct < 50 ? msgs[2] : pct < 85 ? msgs[3] : msgs[4];
    };
    var save = function () { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} };
    mods.addEventListener("click", function (ev) {
      var chk = ev.target.closest && ev.target.closest(".gr-chk");
      if (chk) { ev.preventDefault(); var id = chk.closest(".gr-l").getAttribute("data-id"); if (done[id]) delete done[id]; else done[id] = 1; save(); render(); return; }
      var ex = ev.target.closest && ev.target.closest("[data-expand]"), co = ev.target.closest && ev.target.closest("[data-collapse]");
      if (ex || co) { ev.preventDefault(); $$("[data-mod]", mods).forEach(function (d) { d.open = !!ex; }); }
    });
    ring.addEventListener("click", function (ev) { var r = ev.target.closest && ev.target.closest("[data-reset]"); if (r) { ev.preventDefault(); done = {}; save(); render(); } });
    render();
  }
})();
