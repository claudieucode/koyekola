// Motion Studio : module « loader » (indicateur de chargement et squelette). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
// L'animation est une boucle CSS (transform / opacity). Ce module règle sa vitesse (jamais plus rapide que 600 ms par cycle : pas de flash) et ajoute un VRAI bouton
// Pause / Lecture (WCAG 2.2.2 : une animation de plus de 5 s qui démarre seule doit pouvoir être arrêtée). Mouvement réduit : les formes restent fixes (règle CSS) et le bouton n'est pas proposé.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("loader", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var MIN_CYCLE = 600;
  var speedOf = function (ms) { return Math.max(MIN_CYCLE, Math.min(10000, Number(ms) || 1200)); };
  function init(ctx) {
    var el = ctx.el, doc = ctx.doc;
    el.style.setProperty("--ms-speed", speedOf(ctx.cfg.duration) + "ms");
    if (ctx.reduced || el.getAttribute("data-kw-ms-pausable") === "0") return { destroy: function () { el.style.removeProperty("--ms-speed"); } };
    var stage = el.querySelector(".kw-ms-ld-stage"); if (!stage) return {};
    var b = doc.createElement("button"); b.type = "button"; b.className = "kw-ms-ld-pause"; b.setAttribute("aria-pressed", "false");
    var set = function (paused) { el.toggleAttribute("data-kw-ms-paused", paused); b.setAttribute("aria-pressed", paused ? "true" : "false"); b.textContent = paused ? "Reprendre l'animation" : "Mettre l'animation en pause"; };
    set(false);
    var onClick = function () { set(!el.hasAttribute("data-kw-ms-paused")); };
    b.addEventListener("click", onClick); el.appendChild(b);
    return { destroy: function () { b.removeEventListener("click", onClick); if (b.parentNode) b.parentNode.removeChild(b); el.removeAttribute("data-kw-ms-paused"); el.style.removeProperty("--ms-speed"); } };
  }
  return { speedOf: speedOf, init: init };
});
