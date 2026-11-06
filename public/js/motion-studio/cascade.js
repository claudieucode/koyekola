// Motion Studio, lot « t » — module « cascade » : liste ou grille animée. Les éléments (.kw-ms-casc-item) apparaissent l'un après l'autre
// (décalage réglable, sens de la cascade : début, fin, centre, hasard). Animations sur chaque élément (opacity / transform / filter), jamais sur la racine.
// Le serveur écrit tous les éléments en clair : lisibles et visibles sans JavaScript ; mouvement réduit : rien n'est transformé.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("cascade", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  var PRESETS = {
    "fade-up": [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: NONE }],
    fade: [{ opacity: 0 }, { opacity: 1 }],
    scale: [{ opacity: 0, transform: "scale(.85)" }, { opacity: 1, transform: NONE }],
    "slide-left": [{ opacity: 0, transform: "translateX(-32px)" }, { opacity: 1, transform: NONE }],
    "slide-right": [{ opacity: 0, transform: "translateX(32px)" }, { opacity: 1, transform: NONE }],
    blur: [{ opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0)" }],
    flip: [{ opacity: 0, transform: "rotateX(-70deg)" }, { opacity: 1, transform: NONE }],
  };
  function init(ctx) {
    if (ctx.reduced) return {};
    var items = [].slice.call(ctx.el.querySelectorAll(".kw-ms-casc-item"));
    if (!items.length) return {};
    var frames = PRESETS[ctx.cfg.preset] || PRESETS["fade-up"], n = items.length;
    items.forEach(function (it, i) { ctx.animate(it, frames, { delay: ctx.stagger(i, n) }); });
    return {};
  }
  return { PRESETS: PRESETS, init: init };
});
