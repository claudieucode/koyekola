// Motion Studio — module « image-parallax » : l'image, un peu plus grande que son cadre, glisse plus lentement que la page.
// Animation liée au défilement (déclencheur « scroll » du runtime : la progression est celle de la page). Repli : sans JavaScript, avec « réduire les animations »
// ou sur un écran coupé, l'image reste fixe et recadrée (object-fit: cover). Seul transform est animé, sur l'image (jamais la racine).
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("image-parallax", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  // depth = débordement de l'image de chaque côté, en % de la hauteur du cadre ; le décalage maximal (en % de la hauteur de l'IMAGE) en découle
  function geometry(depth) {
    var d = clamp(Number(depth) || 15, 3, 40), total = 100 + 2 * d;
    return { depth: d, height: total, top: -d, shift: Math.round((d / total) * 10000) / 100 };
  }
  function frames(shift, reverse) {
    var a = reverse ? shift : -shift;
    return [{ transform: "translate3d(0," + a + "%,0)" }, { transform: "translate3d(0," + (-a) + "%,0)" }];
  }
  function init(ctx) {
    var img = ctx.el.querySelector(".kw-ms-pp-img");
    if (!img || ctx.reduced) return {};
    var g = geometry(ctx.cfg.params.depth);
    img.style.height = g.height + "%"; img.style.top = g.top + "%";
    // Le runtime ne pilote que l'avancement ; la courbe doit rester linéaire (le mouvement suit le doigt / la molette, sans accélération)
    ctx.animate(img, frames(g.shift, Boolean(ctx.cfg.params.reverse)), { easing: "linear" });
    return { destroy: function () { img.style.height = ""; img.style.top = ""; } };
  }
  return { geometry: geometry, frames: frames, init: init };
});
