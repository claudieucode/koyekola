// Motion Studio (lot S) — module « sticky-story » : histoire collante.
// Le serveur écrit les étapes (texte + son visuel en ligne : lisible sans JavaScript). Ce module ajoute kw-ms-live (CSS, à partir de 900 px : le visuel .kw-ms-ss-stage
// reste collé à côté des étapes) et désigne l'étape en cours = celle dont le centre est le plus proche du milieu de la fenêtre ; son visuel apparaît en fondu (CSS).
// Mouvement réduit ou petit écran : mise en page statique (chaque étape suivie de son visuel).
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("sticky-story", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  // Indice de l'étape dont le centre vertical est le plus proche de `line` (tôt en cas d'égalité)
  function activeIndex(centers, line) {
    var best = 0, bd = Infinity;
    centers.forEach(function (c, i) { var d = Math.abs(c - line); if (d < bd - 0.5) { bd = d; best = i; } });
    return best;
  }
  function init(ctx) {
    var el = ctx.el, win = ctx.win, cfg = ctx.cfg, prm = cfg.params || {};
    if (ctx.reduced) return {};
    var steps = Array.prototype.slice.call(el.querySelectorAll("[data-ms-step]")), figs = Array.prototype.slice.call(el.querySelectorAll("[data-ms-fig]"));
    if (steps.length < 2 || figs.length !== steps.length) return {};
    var top = Math.min(200, Math.max(0, Number(prm.top) || 96));
    el.style.setProperty("--kw-ms-dur", cfg.duration + "ms");
    el.style.setProperty("--kw-ms-ease", win.KWMS && win.KWMS.easingCss ? win.KWMS.easingCss(cfg.easing) : "ease");
    el.style.setProperty("--kw-ms-ss-top", top + "px");
    el.classList.add("kw-ms-live");
    var cur = -1, raf = 0;
    var set = function (i) {
      if (i === cur) return;
      cur = i;
      steps.forEach(function (s, k) { s.classList.toggle("is-active", k === i); if (k === i) s.setAttribute("aria-current", "step"); else s.removeAttribute("aria-current"); });
      figs.forEach(function (f, k) { f.classList.toggle("is-active", k === i); });
    };
    var update = function () {
      raf = 0;
      var vh = win.innerHeight || 1;
      set(activeIndex(steps.map(function (s) { var r = s.getBoundingClientRect(); return r.top + r.height / 2; }), vh * 0.5));
    };
    var queue = function () { if (!raf) raf = win.requestAnimationFrame(update); };
    win.addEventListener("scroll", queue, { passive: true }); win.addEventListener("resize", queue);
    update();
    ctx.onCleanup(function () {
      win.removeEventListener("scroll", queue); win.removeEventListener("resize", queue); if (raf) win.cancelAnimationFrame(raf);
      el.classList.remove("kw-ms-live");
      ["--kw-ms-dur", "--kw-ms-ease", "--kw-ms-ss-top"].forEach(function (k) { el.style.removeProperty(k); });
      steps.forEach(function (s) { s.classList.remove("is-active"); s.removeAttribute("aria-current"); });
      figs.forEach(function (f, k) { f.classList.toggle("is-active", k === 0); });
    });
    return {};
  }
  return { activeIndex: activeIndex, init: init };
});
