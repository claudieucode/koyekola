// Objectif Noir — amélioration facultative (le thème fonctionne sans ce script) : sur l'accueil, les anneaux de l'objectif suivent doucement le curseur.
// Désactivé si l'utilisateur préfère moins de mouvement ou si l'option « anneaux » est sur fixe.
(function () {
  "use strict";
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "objectif-noir") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mo = body.getAttribute("data-pk-motion");
  var ret = document.querySelector(".on-reticle");
  if (!ret || reduce || mo === "off" || mo === "calm" || body.getAttribute("data-pk-anneaux") === "off") return;
  var raf = 0, px = 50, py = 50;
  ret.addEventListener("pointermove", function (e) {
    var r = ret.getBoundingClientRect();
    px = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    py = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; ret.style.setProperty("--on-x", px.toFixed(1) + "%"); ret.style.setProperty("--on-y", py.toFixed(1) + "%"); });
  }, { passive: true });
  ret.addEventListener("pointerleave", function () { ret.style.setProperty("--on-x", "50%"); ret.style.setProperty("--on-y", "50%"); });
})();
