// Motion Studio — module « image-reveal » : révèle une image par un masque (clip-path) : balayages, iris, rideaux, diagonale.
// Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md. Le serveur écrit l'image ENTIÈRE (visible sans JavaScript) ; le masque n'existe que pendant l'animation
// (état de départ tenu jusqu'au déclencheur, puis état naturel = image entière). Mouvement réduit : rien n'est transformé. Seuls clip-path et transform sont animés,
// sur des éléments internes (jamais la racine).
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("image-reveal", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var FULL = "inset(0 0 0 0)";
  // [masque de départ, masque d'arrivée] — mêmes fonctions de part et d'autre (inset ↔ inset, circle ↔ circle, polygon ↔ polygon) : seule condition d'une interpolation
  var MASKS = {
    "wipe-left": ["inset(0 100% 0 0)", FULL],
    "wipe-right": ["inset(0 0 0 100%)", FULL],
    "wipe-up": ["inset(100% 0 0 0)", FULL],
    "wipe-down": ["inset(0 0 100% 0)", FULL],
    iris: ["circle(0% at 50% 50%)", "circle(75% at 50% 50%)"],
    curtains: ["inset(0 50% 0 50%)", FULL],
    "curtains-v": ["inset(50% 0 50% 0)", FULL],
    diagonal: ["polygon(0 0, 0 0, 0 0)", "polygon(0 0, 200% 0, 0 200%)"],
  };
  function frames(preset) { var m = MASKS[preset] || MASKS["wipe-left"]; return [{ clipPath: m[0] }, { clipPath: m[1] }]; }

  function init(ctx) {
    var el = ctx.el, frame = el.querySelector(".kw-ms-ir-frame"), img = el.querySelector(".kw-ms-ir-img");
    if (!frame || ctx.reduced) return {};
    ctx.animate(frame, frames(ctx.cfg.preset));
    // Léger zoom arrière de l'image pendant la révélation (réglage « zoom », actif par défaut)
    if (img && ctx.cfg.params.zoom !== false) ctx.animate(img, [{ transform: "scale(1.18)" }, { transform: "scale(1)" }]);
    return {};
  }
  return { MASKS: MASKS, frames: frames, init: init };
});
