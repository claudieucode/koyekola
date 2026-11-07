// Lumière Objet — améliorations facultatives (le thème fonctionne sans ce script).
// 1. Simulateur : un seul interrupteur de température ouvert à la fois (sans script, la plus froide ouverte l'emporte).
// 2. Accueil : le faisceau de lumière suit doucement le curseur (désactivé si l'utilisateur préfère moins de mouvement ou si l'option « faisceau » est sur fixe).
(function () {
  "use strict";
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "lumiere-objet") return;
  document.addEventListener("toggle", function (e) {
    var d = e.target;
    if (!d || !d.classList || !d.classList.contains("lo-sw") || !d.open) return;
    var box = d.closest(".lo-sim-box");
    if (!box) return;
    box.querySelectorAll("details.lo-sw[open]").forEach(function (o) { if (o !== d) o.removeAttribute("open"); });
  }, true);
  var hero = document.querySelector(".lo-hero");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mo = body.getAttribute("data-pk-motion");
  if (!hero || reduce || mo === "off" || mo === "calm" || body.getAttribute("data-pk-faisceau") === "off") return;
  var raf = 0, px = 70, py = 30;
  hero.addEventListener("pointermove", function (e) {
    var r = hero.getBoundingClientRect();
    px = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    py = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; hero.style.setProperty("--lo-x", px.toFixed(1) + "%"); hero.style.setProperty("--lo-y", py.toFixed(1) + "%"); });
  }, { passive: true });
})();
