// Motion Studio : module « chart » (graphique en barres, ligne ou anneau). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
// Le serveur écrit le graphique FINAL (SVG / HTML) et le tableau de données ; ce module anime : barres (transform: scaleY), ligne (révélation par clip-path), anneau
// (tracé de chaque secteur à la suite). Aucune propriété de mise en page animée. Mouvement réduit : rien n'est touché.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("chart", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  var slice = function (l) { return Array.prototype.slice.call(l); };
  function init(ctx) {
    var el = ctx.el;
    if (ctx.reduced) return {};
    var fade = ctx.cfg.preset === "fade", all = [], dur = ctx.cfg.duration;
    var A = function (t, k, o) { var a = ctx.animate(t, k, o); all.push(a); return a; };
    var bars = slice(el.querySelectorAll(".kw-ms-ch-bar")), labels = slice(el.querySelectorAll(".kw-ms-ch-v"));
    var line = el.querySelector(".kw-ms-ch-line"), dots = slice(el.querySelectorAll(".kw-ms-ch-dot")), segs = slice(el.querySelectorAll(".kw-ms-ch-seg"));
    if (bars.length) {
      var n = bars.length;
      bars.forEach(function (b, i) { A(b, fade ? [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: NONE }] : [{ transform: "scaleY(0)" }, { transform: NONE }], { delay: ctx.stagger(i, n) }); });
      labels.forEach(function (l, i) { A(l, [{ opacity: 0 }, { opacity: 1 }], { delay: ctx.stagger(i, n) + (fade ? 0 : dur * 0.55), duration: Math.max(120, dur * 0.45) }); });
    } else if (line) {
      var m = dots.length || 1;
      if (fade) A(line, [{ opacity: 0 }, { opacity: 1 }]); else A(line, [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }]);
      dots.forEach(function (d, i) { A(d, [{ opacity: 0, transform: "translate(-50%, 50%) scale(.2)" }, { opacity: 1, transform: "translate(-50%, 50%) scale(1)" }], { delay: fade ? 0 : (i / m) * dur * 0.85, duration: Math.max(150, dur * 0.3) }); });
      labels.forEach(function (l, i) { A(l, [{ opacity: 0 }, { opacity: 1 }], { delay: fade ? 0 : (i / m) * dur * 0.85 + dur * 0.15, duration: Math.max(150, dur * 0.3) }); });
    } else if (segs.length) {
      var acc = 0, parts = segs.map(function (s) { var da = (s.getAttribute("stroke-dasharray") || "0 100").split(/\s+/); var len = Number(da[0]) || 0; return { s: s, da: da, len: len }; });
      var totalLen = parts.reduce(function (t, q) { return t + q.len; }, 0) || 1;
      parts.forEach(function (q, i) {
        if (fade) { A(q.s, [{ opacity: 0 }, { opacity: 1 }], { delay: ctx.stagger(i, parts.length) }); return; }
        var start = (acc / totalLen) * dur, d = Math.max(60, (q.len / totalLen) * dur); acc += q.len;
        A(q.s, [{ strokeDasharray: "0 100" }, { strokeDasharray: q.da[0] + " " + q.da[1] }], { delay: start, duration: d, easing: "linear" });
      });
    }
    if (!all.length) return {};
    return {
      destroy: function () {},
      play: function () { all.forEach(function (a) { a.cancel(); a.currentTime = 0; a.play(); }); },
      seek: function (ms) { all.forEach(function (a) { a.pause(); a.currentTime = ms; }); },
    };
  }
  return { init: init };
});
