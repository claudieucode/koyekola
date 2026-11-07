// Motion Studio (lot S) — module « card-stack » : cartes empilées au défilement (sticky stacking).
// Le serveur écrit la liste de cartes (lisible sans JavaScript). Ce module ajoute la classe kw-ms-live (CSS : chaque carte devient `position: sticky`, décalée de
// `offset` px par rang) puis, à chaque image de défilement, réduit et assombrit une carte à mesure que les suivantes la recouvrent (transform + opacity du voile).
// Mouvement réduit : le module ne fait rien, les cartes restent l'une sous l'autre. destroy() restitue la mise en page statique.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("card-stack", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var num = function (v, d, a, b) { v = Number(v); return isFinite(v) ? clamp(v, a, b) : d; };
  // Part (0 à 1) d'une carte déjà posée sur la précédente : 0 tant qu'elle est à plus d'une hauteur de sa position collée, 1 une fois collée
  function cover(top, stickTop, height) { return height > 0 ? clamp(1 - (top - stickTop) / height, 0, 1) : 0; }
  // Couverture cumulée de chaque carte (somme des parts des cartes suivantes) → { scale, dim } par carte
  function states(tops, heights, stickTops, shrink, dim) {
    var n = tops.length, cov = [], i, j;
    for (i = 0; i < n; i++) cov.push(0);
    for (j = 1; j < n; j++) { var p = cover(tops[j], stickTops[j], heights[j]); for (i = 0; i < j; i++) cov[i] += p; }
    return cov.map(function (c) { return { scale: 1 - (shrink / 100) * c, dim: (dim / 100) * Math.min(1, c) }; });
  }

  function init(ctx) {
    var el = ctx.el, win = ctx.win, prm = ctx.cfg.params || {};
    if (ctx.reduced) return {};
    var cards = Array.prototype.slice.call(el.querySelectorAll(".kw-ms-cs-card"));
    var ins = cards.map(function (c) { return c.querySelector(".kw-ms-cs-in"); });
    if (cards.length < 2 || ins.some(function (x) { return !x; })) return {};
    var top = num(prm.top, 80, 0, 200), off = num(prm.offset, 24, 0, 60), shrink = num(prm.shrink, 5, 0, 20), dim = num(prm.dim, 20, 0, 60);
    if (ctx.bp === "mobile") top = Math.round(top * 0.6);
    var unit = win.CSS && win.CSS.supports && win.CSS.supports("height", "1svh") ? "svh" : "vh";
    el.style.setProperty("--kw-ms-cs-top", top + "px");
    el.style.setProperty("--kw-ms-cs-off", off + "px");
    el.style.setProperty("--kw-ms-cs-h", num(el.getAttribute("data-kw-ms-height"), 60, 30, 90) + unit);
    cards.forEach(function (c, i) { c.style.setProperty("--kw-ms-cs-i", String(i)); });
    el.classList.add("kw-ms-live");

    var raf = 0, last = [];
    var update = function () {
      raf = 0;
      var rects = cards.map(function (c) { return c.getBoundingClientRect(); });
      var st = states(rects.map(function (r) { return r.top; }), rects.map(function (r) { return r.height; }), cards.map(function (c, i) { return top + i * off; }), shrink, dim);
      st.forEach(function (s, i) {
        var key = s.scale.toFixed(4) + "|" + s.dim.toFixed(3);
        if (last[i] === key) return;
        last[i] = key;
        ins[i].style.transform = s.scale === 1 ? "" : "scale(" + s.scale.toFixed(4) + ")";
        ins[i].style.setProperty("--kw-ms-cs-dim", s.dim.toFixed(3));
      });
    };
    var queue = function () { if (!raf) raf = win.requestAnimationFrame(update); };
    win.addEventListener("scroll", queue, { passive: true }); win.addEventListener("resize", queue);
    update();
    ctx.onCleanup(function () {
      win.removeEventListener("scroll", queue); win.removeEventListener("resize", queue); if (raf) win.cancelAnimationFrame(raf);
      el.classList.remove("kw-ms-live");
      ["--kw-ms-cs-top", "--kw-ms-cs-off", "--kw-ms-cs-h"].forEach(function (k) { el.style.removeProperty(k); });
      cards.forEach(function (c, i) { c.style.removeProperty("--kw-ms-cs-i"); ins[i].style.transform = ""; ins[i].style.removeProperty("--kw-ms-cs-dim"); });
    });
    return {};
  }
  return { cover: cover, states: states, init: init };
});
