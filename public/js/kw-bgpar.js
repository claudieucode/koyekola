// Parallaxe d'arrière-plan : l'image de fond d'un élément se déplace plus doucement que la page (attribut data-kw-bgpar = amplitude en %).
// Un seul écouteur de défilement passif, mis à jour par requestAnimationFrame, seulement pour les éléments visibles.
// Jamais dans l'éditeur ; immobile si le visiteur demande de réduire les animations (l'image reste centrée).
(function () {
  "use strict";
  if (!document.querySelector("[data-kw-bgpar]")) return;
  if (document.body && document.body.hasAttribute("data-kw-builder")) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var els = Array.prototype.slice.call(document.querySelectorAll("[data-kw-bgpar]"));
  var visible = new Set(), raf = 0;
  var update = function () {
    raf = 0;
    var vh = window.innerHeight || 1;
    visible.forEach(function (el) {
      var amp = Number(el.getAttribute("data-kw-bgpar")) || 0, r = el.getBoundingClientRect();
      // -1 quand l'élément entre par le bas, +1 quand il sort par le haut
      var p = Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2)));
      el.style.backgroundPosition = "50% " + (50 - p * amp).toFixed(2) + "%";
    });
  };
  var ask = function () { if (!raf) raf = requestAnimationFrame(update); };
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); }); ask(); }, { rootMargin: "100px" });
    els.forEach(function (el) { el.classList.add("kw-bgpar"); io.observe(el); });
  } else { return; }
  window.addEventListener("scroll", ask, { passive: true });
  window.addEventListener("resize", ask);
})();
