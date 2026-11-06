// Motion Studio — module « tilt-card » : la carte s'incline vers la souris (perspective 3D) et un reflet lumineux suit le pointeur.
// Souris seulement : écran tactile, éditeur et « réduire les animations » laissent la carte à plat (le contenu est identique). transform sur la carte (élément interne), jamais sur la racine.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("tilt-card", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var num = function (v, d, a, b) { var n = Number(v); return isFinite(n) && v !== "" && v !== null && v !== undefined ? clamp(n, a, b) : d; };
  // Position du pointeur dans la carte (0–1) → angles ; haut de la carte : bascule vers l'arrière
  function angles(x, y, max, invert) {
    var s = invert ? -1 : 1;
    return { rx: Math.round(-(y - 0.5) * 2 * max * s * 100) / 100 + 0, ry: Math.round((x - 0.5) * 2 * max * s * 100) / 100 + 0 }; // « + 0 » : jamais -0
  }
  function transform(a, perspective, scale) { return "perspective(" + perspective + "px) rotateX(" + a.rx + "deg) rotateY(" + a.ry + "deg) scale(" + scale + ")"; }
  function settings(params) {
    var p = params || {};
    return { max: num(p.maxTilt, 10, 2, 25), scale: num(p.scale, 1.03, 1, 1.15), perspective: num(p.perspective, 900, 400, 2000), glare: p.glare !== false, strength: num(p.glareStrength, 35, 5, 80) / 100, invert: p.invert === true };
  }
  function finePointer(win) { return Boolean(win.matchMedia && win.matchMedia("(hover: hover) and (pointer: fine)").matches); }

  function init(ctx) {
    var el = ctx.el, win = ctx.win, card = el.querySelector(".kw-ms-tc-card");
    if (!card || ctx.reduced || ctx.mode === "editor" || !finePointer(win)) return {};
    var s = settings(ctx.cfg.params), ease = win.KWMS && win.KWMS.easingCss ? win.KWMS.easingCss(ctx.cfg.easing) : "ease-out", raf = 0, pending = null, inside = false;
    var apply = function () {
      raf = 0; if (!pending || !inside) return;
      var r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
      var x = clamp((pending.x - r.left) / r.width, 0, 1), y = clamp((pending.y - r.top) / r.height, 0, 1);
      card.style.transform = transform(angles(x, y, s.max, s.invert), s.perspective, s.scale);
      if (s.glare) { card.style.setProperty("--kw-ms-gx", Math.round(x * 100) + "%"); card.style.setProperty("--kw-ms-gy", Math.round(y * 100) + "%"); card.style.setProperty("--kw-ms-go", String(s.strength)); }
    };
    var mouse = function (e) { return !e.pointerType || e.pointerType === "mouse"; };
    var enter = function (e) { if (!mouse(e)) return; inside = true; card.style.transition = "transform 120ms linear"; };
    var move = function (e) { if (!mouse(e)) return; inside = true; pending = { x: e.clientX, y: e.clientY }; if (!raf) raf = win.requestAnimationFrame(apply); };
    var leave = function (e) {
      if (!mouse(e)) return; inside = false;
      card.style.transition = "transform " + ctx.cfg.duration + "ms " + ease; card.style.transform = ""; card.style.setProperty("--kw-ms-go", "0");
    };
    el.addEventListener("pointerenter", enter); el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    ctx.onCleanup(function () {
      el.removeEventListener("pointerenter", enter); el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave);
      if (raf) win.cancelAnimationFrame(raf);
    });
    return { destroy: function () { card.style.transform = ""; card.style.transition = ""; card.style.removeProperty("--kw-ms-go"); card.style.removeProperty("--kw-ms-gx"); card.style.removeProperty("--kw-ms-gy"); } };
  }
  return { angles: angles, transform: transform, settings: settings, init: init };
});
