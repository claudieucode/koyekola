// Motion Studio : module « metric » (carte de métrique). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
// Le serveur écrit valeur, variation et mini-courbe FINALES (et une copie pour les lecteurs d'écran) ; ce module anime : la carte (3 effets), la valeur qui monte,
// la mini-courbe (révélation par clip-path) et la pastille de variation. Mouvement réduit : rien n'est touché. destroy() restitue la valeur finale.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("metric", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  var PRESETS = {
    rise: [{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: NONE }],
    fade: [{ opacity: 0 }, { opacity: 1 }],
    pop: [{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: NONE }],
  };
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
    var card = el.querySelector(".kw-ms-mc-card"), num = el.querySelector(".kw-ms-num"), spark = el.querySelector(".kw-ms-mc-spark"), delta = el.querySelector(".kw-ms-mc-badge");
    if (!card) return {};
    var all = [], dur = ctx.cfg.duration, A = function (t, k, o) { var a = ctx.animate(t, k, o); all.push(a); return a; };
    A(card, PRESETS[ctx.cfg.preset] || PRESETS.rise, { duration: Math.min(700, dur) });
    var f = null, finalText = "";
    if (num) {
      finalText = num.textContent;
      var to = Number(num.getAttribute("data-to")) || 0, dec = Number(num.getAttribute("data-dec")) || 0;
      var counter = A(num, [{ opacity: 0.4 }, { opacity: 1 }], { delay: Math.min(200, dur * 0.15) });
      f = follow(win, counter, function (p) { num.textContent = p >= 1 ? finalText : fmt(to * p, dec); });
      f.kick();
    }
    if (spark) A(spark, [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { delay: dur * 0.25, duration: dur * 0.75 });
    if (delta) A(delta, [{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: NONE }], { delay: dur * 0.55, duration: Math.max(150, dur * 0.35), easing: "spring" });
    return {
      destroy: function () { if (f) f.stop(); if (num) num.textContent = finalText; },
      play: function () { all.forEach(function (a) { a.cancel(); a.currentTime = 0; a.play(); }); if (f) f.kick(); },
      seek: function (ms) { all.forEach(function (a) { a.pause(); a.currentTime = ms; }); if (f) f.kick(); },
    };
  }
  return { PRESETS: PRESETS, fmt: fmt, follow: follow, init: init };
});
