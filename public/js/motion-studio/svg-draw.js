// Motion Studio — module « svg-draw » : dessine un tracé SVG (stroke-dasharray / stroke-dashoffset).
// Le serveur nettoie le SVG (liste blanche) et RETIRE stroke-dasharray : c'est ce module qui le pose, d'après la longueur réelle lue par getTotalLength().
// Sans JavaScript ou avec « réduire les animations » : le tracé est affiché en entier. Une forme sans trait (remplissage seul) apparaît en fondu.
// destroy() restitue le SVG d'origine.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("svg-draw", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function lengthOf(node) { try { var n = node.getTotalLength(); return isFinite(n) && n > 0 ? n : 0; } catch (e) { return 0; } }
  // Images-clés d'une forme tracée : offset = longueur (invisible) → 0 (complet) ; « fin → début » : offset négatif
  function strokeFrames(len, preset) { var from = preset === "draw-reverse" ? -len : len; return [{ strokeDashoffset: from }, { strokeDashoffset: 0 }]; }
  var fillFrames = function () { return [{ fill: "currentColor", fillOpacity: 0 }, { fill: "currentColor", fillOpacity: 1 }]; };

  function init(ctx) {
    var svg = ctx.el.querySelector(".kw-ms-sd-svg");
    if (!svg || ctx.reduced) return {};
    var shapes = svg.querySelectorAll("[data-kw-sd]"), n = shapes.length, touched = [], preset = ctx.cfg.preset || "draw";
    Array.prototype.forEach.call(shapes, function (s, i) {
      var delay = ctx.stagger(i, n), len = lengthOf(s), stroked = ctx.win.getComputedStyle(s).stroke !== "none";
      if (stroked && len > 0) {
        s.style.strokeDasharray = len + " " + len; touched.push(s);
        ctx.animate(s, strokeFrames(len, preset), { delay: delay });
        if (preset === "draw-fill") ctx.animate(s, fillFrames(), { delay: delay + Math.round(ctx.cfg.duration * 0.7), duration: Math.max(50, Math.round(ctx.cfg.duration * 0.5)) });
      } else ctx.animate(s, [{ opacity: 0 }, { opacity: 1 }], { delay: delay });
    });
    return { destroy: function () { touched.forEach(function (s) { s.style.strokeDasharray = ""; s.style.strokeDashoffset = ""; }); } };
  }
  return { strokeFrames: strokeFrames, fillFrames: fillFrames, lengthOf: lengthOf, init: init };
});
