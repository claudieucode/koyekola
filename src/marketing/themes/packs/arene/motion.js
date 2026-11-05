/* Arène — animations légères, sans dépendance. Désactivées si l'utilisateur préfère moins de mouvement. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "arene") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Hauteur réelle de l'en-tête (pour le menu mobile plein écran)
  var head = document.querySelector(".ar-head");
  function sizeHead() { if (head) b.style.setProperty("--ar-headh", head.offsetHeight + "px"); }
  sizeHead(); window.addEventListener("resize", sizeHead);

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("ar-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms"; io.observe(el); });
  }

  // Compte à rebours du prochain match
  $$("[data-countdown]").forEach(function (box) {
    var end = new Date(box.getAttribute("data-countdown")).getTime(); if (isNaN(end)) return;
    var cells = {}; $$("[data-u]", box).forEach(function (c) { cells[c.getAttribute("data-u")] = c; });
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function tick() {
      var s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      cells.d.textContent = pad(Math.floor(s / 86400)); cells.h.textContent = pad(Math.floor(s % 86400 / 3600)); cells.m.textContent = pad(Math.floor(s % 3600 / 60)); cells.s.textContent = pad(s % 60);
      if (!s) { var l = box.parentNode.querySelector(".ar-next-meta"); if (l) l.textContent = "Coup d'envoi donné !"; clearInterval(t); }
    }
    tick(); var t = setInterval(tick, reduce ? 60000 : 1000);
  });

  // Compteurs de statistiques
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "";
        if (reduce || isNaN(to)) { el.textContent = to + suf; return; }
        var start = null; function step(ts) { if (!start) start = ts; var p = Math.min(1, (ts - start) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // Onglets Matchs : À venir / Résultats
  $$(".ar-tabs").forEach(function (tabs) {
    var scope = tabs.closest(".ar-fix");
    $$("a[data-tab]", tabs).forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        $$("a[data-tab]", tabs).forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-selected", x === a ? "true" : "false"); });
        $$("[data-panel]", scope).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== a.getAttribute("data-tab"); });
      });
    });
  });

  // Flèches du carrousel de joueurs
  $$("[data-scroll]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      var rail = a.closest(".ar-squad").querySelector(".ar-rail"); if (!rail) return;
      rail.scrollBy({ left: Number(a.getAttribute("data-scroll")) * Math.min(rail.clientWidth * 0.8, 640), behavior: reduce ? "auto" : "smooth" });
    });
  });
  // Clavier : flèches sur le carrousel
  $$(".ar-rail").forEach(function (rail) { rail.addEventListener("keydown", function (ev) { if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); rail.scrollBy({ left: (ev.key === "ArrowRight" ? 1 : -1) * 320, behavior: reduce ? "auto" : "smooth" }); } }); });
  // Menu mobile : se referme au clic sur un lien
  $$(".ar-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
})();
