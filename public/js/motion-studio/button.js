// Motion Studio — module « button » : bouton animé. Les variantes de survol sont du CSS (elles marchent aussi sans JavaScript, et au clavier par :focus-visible) ;
// ce module règle la durée et la courbe choisies dans le panneau, et, pour « remplissage depuis le curseur », l'endroit par où le pointeur est entré.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("button", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  // Point d'entrée du pointeur dans le bouton, en % de sa largeur / hauteur (borné : le cercle part toujours du bord ou de l'intérieur)
  function origin(rect, x, y) {
    var px = rect.width ? ((x - rect.left) / rect.width) * 100 : 50, py = rect.height ? ((y - rect.top) / rect.height) * 100 : 50;
    var c = function (v) { return Math.round(Math.min(100, Math.max(0, v))); };
    return { x: c(px), y: c(py) };
  }
  function init(ctx) {
    var el = ctx.el, a = el.querySelector(".kw-ms-bt");
    if (!a) return {};
    var ease = ctx.win.KWMS && ctx.win.KWMS.easingCss ? ctx.win.KWMS.easingCss(ctx.cfg.easing) : "ease-out";
    el.style.setProperty("--kw-ms-dur", ctx.cfg.duration + "ms"); el.style.setProperty("--kw-ms-ease", ease);
    var handlers = [];
    if (ctx.cfg.preset === "fill-circle") {
      var set = function (e) { var o = origin(a.getBoundingClientRect(), e.clientX, e.clientY); a.style.setProperty("--kw-ms-x", o.x + "%"); a.style.setProperty("--kw-ms-y", o.y + "%"); };
      ["pointerenter", "pointerleave"].forEach(function (t) { a.addEventListener(t, set); handlers.push([t, set]); });
    }
    return { destroy: function () {
      handlers.forEach(function (h) { a.removeEventListener(h[0], h[1]); });
      el.style.removeProperty("--kw-ms-dur"); el.style.removeProperty("--kw-ms-ease"); a.style.removeProperty("--kw-ms-x"); a.style.removeProperty("--kw-ms-y");
    } };
  }
  return { origin: origin, init: init };
});
