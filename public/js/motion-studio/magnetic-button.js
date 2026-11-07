// Motion Studio — module « magnetic-button » : le bouton (un vrai lien) se rapproche du curseur quand celui-ci passe à proximité.
// Souris seulement : écran tactile, clavier, éditeur et « réduire les animations » laissent le bouton en place. transform sur le lien et son texte (éléments internes), jamais sur la racine.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("magnetic-button", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var num = function (v, d, a, b) { var n = Number(v); return isFinite(n) && v !== "" && v !== null && v !== undefined ? clamp(n, a, b) : d; };
  // Décalage du bouton : centre (cx, cy), taille (w, h), pointeur (px, py). Hors de la zone d'attraction (bouton + radius px) : null.
  // Dans la zone : fraction `strength` de l'écart, plafonnée à la moitié du rayon (le bouton ne s'éloigne jamais de sa place de plus de radius / 2).
  function pull(cx, cy, w, h, px, py, strength, radius) {
    var dx = px - cx, dy = py - cy;
    if (Math.abs(dx) > w / 2 + radius || Math.abs(dy) > h / 2 + radius) return null;
    var cap = Math.max(radius / 2, 8), s = strength / 100;
    return { x: Math.round(clamp(dx * s, -cap, cap) * 10) / 10, y: Math.round(clamp(dy * s, -cap, cap) * 10) / 10 };
  }
  function settings(params) { var p = params || {}; return { strength: num(p.strength, 35, 5, 70), radius: num(p.radius, 120, 20, 300), labelShift: p.labelShift !== false }; }
  function finePointer(win) { return Boolean(win.matchMedia && win.matchMedia("(hover: hover) and (pointer: fine)").matches); }

  function init(ctx) {
    var el = ctx.el, win = ctx.win, a = el.querySelector(".kw-ms-bt"), label = el.querySelector(".kw-ms-bt-label");
    if (!a || ctx.reduced || ctx.mode === "editor" || !finePointer(win)) return {};
    var s = settings(ctx.cfg.params), ease = win.KWMS && win.KWMS.easingCss ? win.KWMS.easingCss(ctx.cfg.easing) : "ease-out";
    el.style.setProperty("--kw-ms-dur", ctx.cfg.duration + "ms"); el.style.setProperty("--kw-ms-ease", ease);
    var tx = 0, ty = 0, raf = 0, last = null, active = false;
    var put = function (x, y, fast) {
      tx = x; ty = y;
      a.style.transition = fast ? "transform 160ms ease-out" : "transform " + Math.max(ctx.cfg.duration, 300) + "ms cubic-bezier(.34, 1.56, .64, 1)";
      a.style.transform = x || y ? "translate3d(" + x + "px," + y + "px,0)" : "";
      if (label && s.labelShift) { label.style.transition = a.style.transition; label.style.transform = x || y ? "translate3d(" + Math.round(x * 0.35 * 10) / 10 + "px," + Math.round(y * 0.35 * 10) / 10 + "px,0)" : ""; }
    };
    var frame = function () {
      raf = 0; if (!last) return;
      var r = a.getBoundingClientRect(); if (!r.width) return;
      // le rectangle mesuré est déjà décalé de (tx, ty) : on retrouve le centre au repos
      var v = pull(r.left + r.width / 2 - tx, r.top + r.height / 2 - ty, r.width, r.height, last.x, last.y, s.strength, s.radius);
      if (v) { active = true; put(v.x, v.y, true); } else if (active) { active = false; put(0, 0, false); }
    };
    var move = function (e) { if (e.pointerType && e.pointerType !== "mouse") return; last = { x: e.clientX, y: e.clientY }; if (!raf) raf = win.requestAnimationFrame(frame); };
    var out = function () { last = null; if (active) { active = false; put(0, 0, false); } };
    win.addEventListener("pointermove", move, { passive: true }); win.document.documentElement.addEventListener("pointerleave", out);
    ctx.onCleanup(function () { win.removeEventListener("pointermove", move); win.document.documentElement.removeEventListener("pointerleave", out); if (raf) win.cancelAnimationFrame(raf); });
    return { destroy: function () {
      a.style.transform = ""; a.style.transition = ""; if (label) { label.style.transform = ""; label.style.transition = ""; }
      el.style.removeProperty("--kw-ms-dur"); el.style.removeProperty("--kw-ms-ease");
    } };
  }
  return { pull: pull, settings: settings, init: init };
});
