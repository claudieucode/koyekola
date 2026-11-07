// Motion Studio, lot « t » — module « kinetic » : texte cinétique. Chaque ligne du bloc entre en mouvement (glissement alterné, rebond d'échelle,
// rotation, zoom, dérive pendant le défilement). Animations sur des éléments INTERNES (.kw-ms-kin-line), jamais sur la racine ; opacity / transform / filter seulement.
// Le serveur écrit toutes les lignes en clair (lisibles et visibles sans JavaScript) ; mouvement réduit : rien n'est transformé.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("kinetic", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var num = function (v, d) { return typeof v === "number" && isFinite(v) ? v : d; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var NONE = "none";
  // Images-clés de la ligne i (dist : amplitude en % de la largeur de la ligne). Les lignes paires et impaires partent de côtés opposés.
  var PRESETS = {
    slide: function (i, dist) { var s = i % 2 ? 1 : -1; return [{ opacity: 0, transform: "translateX(" + s * dist + "%)" }, { opacity: 1, transform: NONE }]; },
    pop: function () { return [{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: NONE }]; },
    rotate: function (i) { return [{ opacity: 0, transform: "translateY(.5em) rotate(" + (i % 2 ? 8 : -8) + "deg)" }, { opacity: 1, transform: NONE }]; },
    zoom: function () { return [{ opacity: 0, transform: "scale(1.8)", filter: "blur(.25em)" }, { opacity: 1, transform: NONE, filter: "blur(0)" }]; },
    drift: function (i, dist) { var s = i % 2 ? 1 : -1; return [{ transform: "translateX(" + s * dist + "%)" }, { transform: "translateX(" + -s * dist + "%)" }]; },
  };
  function init(ctx) {
    if (ctx.reduced) return {};
    var lines = [].slice.call(ctx.el.querySelectorAll(".kw-ms-kin-line"));
    if (!lines.length) return {};
    var preset = Object.prototype.hasOwnProperty.call(PRESETS, ctx.cfg.preset) ? ctx.cfg.preset : "slide";
    var dist = clamp(num(ctx.cfg.params.distance, 30), 5, 100), n = lines.length;
    lines.forEach(function (l, i) { ctx.animate(l, PRESETS[preset](i, dist), { delay: preset === "drift" ? 0 : ctx.stagger(i, n) }); });
    return {};
  }
  return { PRESETS: PRESETS, init: init };
});
