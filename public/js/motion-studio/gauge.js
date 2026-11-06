// Motion Studio : module « gauge » (jauge en demi-cercle). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
// Le serveur écrit l'aiguille / l'arc et la valeur FINAUX ; ce module fait tourner l'aiguille (ou tracer l'arc) depuis le minimum et fait monter la valeur
// avec la même animation. Mouvement réduit : rien n'est touché. destroy() restitue la valeur finale.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("gauge", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
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
    var needle = el.querySelector(".kw-ms-g-needle"), arc = el.querySelector(".kw-ms-g-arc"), num = el.querySelector(".kw-ms-num");
    if (!needle && !arc) return {};
    var all = [], A = function (t, k, o) { var a = ctx.animate(t, k, o); all.push(a); return a; };
    var fromV = num ? Number(num.getAttribute("data-from")) || 0 : 0, toV = num ? Number(num.getAttribute("data-to")) || 0 : 0;
    var span = Number(el.getAttribute("aria-valuemax")) - Number(el.getAttribute("aria-valuemin")) || 1;
    var frac = Math.max(0, Math.min(1, (toV - Number(el.getAttribute("aria-valuemin"))) / span));
    var main;
    if (needle) {
      var easing = ctx.cfg.preset === "spring" ? "spring" : null;
      main = A(needle, [{ transform: "rotate(" + (-frac * 180) + "deg)" }, { transform: "rotate(0deg)" }], easing ? { easing: easing } : undefined);
    } else {
      main = A(arc, [{ strokeDashoffset: 100 }, { strokeDashoffset: Number(arc.getAttribute("stroke-dashoffset")) || 0 }]);
    }
    var finalText = num ? num.textContent : "", dec = num ? Number(num.getAttribute("data-dec")) || 0 : 0;
    var f = num ? follow(win, main, function (p) { num.textContent = p >= 1 ? finalText : fmt(fromV + (toV - fromV) * p, dec); }) : null;
    if (f) f.kick();
    return {
      destroy: function () { if (f) f.stop(); if (num) num.textContent = finalText; },
      play: function () { all.forEach(function (a) { a.cancel(); a.currentTime = 0; a.play(); }); if (f) f.kick(); },
      seek: function (ms) { all.forEach(function (a) { a.pause(); a.currentTime = ms; }); if (f) f.kick(); },
    };
  }
  return { fmt: fmt, follow: follow, init: init };
});
