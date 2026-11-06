// Motion Studio : module « compare » (comparaison de données). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
// Le serveur écrit barres, valeurs et écarts FINAUX ; ce module fait croître les barres (transform: scaleX) ligne après ligne, la deuxième série juste après la première,
// et fait monter les valeurs avec la même animation. Mouvement réduit : rien n'est touché. destroy() restitue les valeurs finales.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("compare", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  var fmt = function (n, d) { return n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }); };
  function follow(win, anim, apply) {
    var raf = 0, tm = 0, dead = false;
    function frame() {
      raf = 0; tm = 0; if (dead) return;
      var p = null, st = "idle";
      try { p = anim.effect.getComputedTiming().progress; st = anim.playState; } catch (e) { /* animation retirée */ }
      apply(p == null ? 1 : Math.min(1, Math.max(0, p)));
      if (st === "running" || st === "pending") raf = win.requestAnimationFrame(frame);
      else if (st === "paused") tm = win.setTimeout(frame, 250);
    }
    return {
      kick: function () { if (dead) return; if (tm) { win.clearTimeout(tm); tm = 0; } if (!raf) raf = win.requestAnimationFrame(frame); },
      stop: function () { dead = true; if (raf) win.cancelAnimationFrame(raf); win.clearTimeout(tm); },
    };
  }
  function init(ctx) {
    var el = ctx.el, win = ctx.win;
    if (ctx.reduced) return {};
    var rows = Array.prototype.slice.call(el.querySelectorAll(".kw-ms-cmp-row"));
    if (!rows.length) return {};
    var fade = ctx.cfg.preset === "grow-fade", all = [], follows = [], restore = [], gap = Math.min(180, ctx.cfg.duration * 0.2);
    rows.forEach(function (row, i) {
      Array.prototype.forEach.call(row.querySelectorAll(".kw-ms-cmp-fill"), function (fill, k) {
        var a = ctx.animate(fill, fade ? [{ transform: "scaleX(0)", opacity: 0 }, { transform: NONE, opacity: 1 }] : [{ transform: "scaleX(0)" }, { transform: NONE }], { delay: ctx.stagger(i, rows.length) + k * gap });
        all.push(a);
        var num = fill.parentNode.parentNode.querySelector(".kw-ms-num");
        if (num) {
          var txt = num.textContent, to = Number(num.getAttribute("data-to")) || 0, dec = Number(num.getAttribute("data-dec")) || 0;
          var f = follow(win, a, function (p) { num.textContent = p >= 1 ? txt : fmt(to * p, dec); });
          follows.push(f); restore.push(function () { num.textContent = txt; }); f.kick();
        }
      });
      var d = row.querySelector(".kw-ms-cmp-delta");
      if (d) all.push(ctx.animate(d, [{ opacity: 0, transform: "scale(.7)" }, { opacity: 1, transform: NONE }], { delay: ctx.stagger(i, rows.length) + gap + ctx.cfg.duration * 0.6, duration: Math.max(150, ctx.cfg.duration * 0.35) }));
    });
    var kick = function () { follows.forEach(function (f) { f.kick(); }); };
    return {
      destroy: function () { follows.forEach(function (f) { f.stop(); }); restore.forEach(function (r) { r(); }); },
      play: function () { all.forEach(function (a) { a.cancel(); a.currentTime = 0; a.play(); }); kick(); },
      seek: function (ms) { all.forEach(function (a) { a.pause(); a.currentTime = ms; }); kick(); },
    };
  }
  return { fmt: fmt, follow: follow, init: init };
});
