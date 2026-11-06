// Motion Studio : module « circular » (progression circulaire). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
// Le serveur écrit l'anneau et le nombre FINAUX ; ce module anime le tracé (stroke-dashoffset) et fait monter le nombre avec la MÊME animation
// (donc mêmes durée, courbe, délai, déclencheur, défilement, lecture/pause de l'éditeur). Mouvement réduit : rien n'est touché. destroy() restitue le nombre final.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("circular", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  var fmt = function (n, d) { return n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }); };
  // Suit une animation pour afficher une valeur dérivée (nombre qui monte) : lit sa progression réelle (courbe comprise) tant qu'elle joue
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
    var arc = el.querySelector(".kw-ms-cp-arc"), num = el.querySelector(".kw-ms-num"), ring = el.querySelector(".kw-ms-cp-ring");
    if (!arc || ctx.reduced) return {};
    var end = Number(arc.getAttribute("stroke-dashoffset")) || 0;
    var finalText = num ? num.textContent : "", to = num ? Number(num.getAttribute("data-to")) || 0 : 0, dec = num ? Number(num.getAttribute("data-dec")) || 0 : 0;
    var all = [], A = function (t, k, o) { var a = ctx.animate(t, k, o); all.push(a); return a; };
    var main = A(arc, [{ strokeDashoffset: 100 }, { strokeDashoffset: end }]);
    if (ctx.cfg.preset === "grow" && ring) A(ring, [{ opacity: 0, transform: "scale(.82)" }, { opacity: 1, transform: NONE }], { duration: Math.min(500, ctx.cfg.duration) });
    var f = num ? follow(win, main, function (p) { num.textContent = p >= 1 ? finalText : fmt(to * p, dec); }) : null;
    if (f) f.kick();
    return {
      destroy: function () { if (f) f.stop(); if (num) num.textContent = finalText; },
      play: function () { all.forEach(function (a) { a.cancel(); a.currentTime = 0; a.play(); }); if (f) f.kick(); },
      seek: function (ms) { all.forEach(function (a) { a.pause(); a.currentTime = ms; }); if (f) f.kick(); },
    };
  }
  return { fmt: fmt, follow: follow, init: init };
});
