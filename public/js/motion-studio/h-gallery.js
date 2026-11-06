// Motion Studio (lot S) — module « h-gallery » : galerie à défilement horizontal piloté par le défilement vertical.
// Le serveur écrit une bande native (faire défiler à la main, au doigt ou au clavier : la zone est focalisable). Ce module, sur écran large, épingle la scène
// (`position: sticky`, hauteur = fenêtre + distance à parcourir × vitesse) et traduit la progression verticale en translation de la bande (transform).
// Mouvement réduit, mobile (sauf option), trop peu d'éléments pour déborder : bande native conservée. Un lien qui reçoit le focus ramène la page à sa position.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("h-gallery", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  function pinProgress(top, height, vh) { var span = height - vh; return span > 0 ? clamp(-top / span, 0, 1) : 0; }
  // Hauteur de la section : une fenêtre + distance à parcourir × (vitesse / 100)
  var sectionHeight = function (vh, travel, pace) { return Math.round(vh + travel * (pace / 100)); };
  // Progression à viser pour centrer un élément (position x, largeur w) dans une scène de largeur sw, la bande pouvant avancer de `travel` px
  function progressFor(x, w, sw, travel) { return travel > 0 ? clamp((x + w / 2 - sw / 2) / travel, 0, 1) : 0; }

  function init(ctx) {
    var el = ctx.el, win = ctx.win, prm = ctx.cfg.params || {};
    if (ctx.reduced) return {};
    if (ctx.bp === "mobile" && !prm.pinMobile) return {};
    var stage = el.querySelector(".kw-ms-hg-stage"), view = el.querySelector("[data-ms-view]"), track = el.querySelector("[data-ms-track]"), fill = el.querySelector(".kw-ms-hg-fill");
    var items = Array.prototype.slice.call(el.querySelectorAll("[data-ms-item]"));
    if (!stage || !view || !track || items.length < 2) return {};
    var pace = clamp(Number(prm.pace) || 100, 50, 200), travel = 0, H = 0;
    var hadTab = view.getAttribute("tabindex");
    el.classList.add("kw-ms-live");
    var measure = function () {
      var vh = win.innerHeight || 1;
      travel = Math.max(0, track.scrollWidth - stage.clientWidth);
      H = sectionHeight(vh, travel, pace);
      el.style.setProperty("--kw-ms-hg-h", H + "px");
    };
    measure();
    if (travel < 40) { el.classList.remove("kw-ms-live"); el.style.removeProperty("--kw-ms-hg-h"); return {}; } // rien à faire défiler : bande native
    view.removeAttribute("tabindex"); // la bande ne défile plus d'elle-même : plus de zone à focaliser (les liens restent atteignables)
    var raf = 0, last = -1;
    var update = function () {
      raf = 0;
      var r = el.getBoundingClientRect(), p = pinProgress(r.top, r.height, win.innerHeight || 1);
      if (p === last) return;
      last = p;
      track.style.transform = "translate3d(" + (-p * travel).toFixed(1) + "px,0,0)";
      if (fill) fill.style.transform = "scaleX(" + p.toFixed(4) + ")";
    };
    var queue = function () { if (!raf) raf = win.requestAnimationFrame(update); };
    ctx.onResize(function () { measure(); last = -1; update(); });
    win.addEventListener("scroll", queue, { passive: true }); win.addEventListener("resize", queue);
    // Clavier : un lien hors champ ramène la page à la position qui le montre (et annule le défilement interne que le navigateur ferait seul)
    var onFocus = function (e) {
      stage.scrollLeft = 0;
      var it = e.target && e.target.closest ? e.target.closest("[data-ms-item]") : null;
      if (!it) return;
      var r = el.getBoundingClientRect(), p = progressFor(it.offsetLeft, it.offsetWidth, stage.clientWidth, travel);
      win.scrollTo(0, Math.round((win.pageYOffset || 0) + r.top + p * (r.height - (win.innerHeight || 1))));
    };
    var resetScroll = function () { if (stage.scrollLeft) stage.scrollLeft = 0; };
    el.addEventListener("focusin", onFocus); stage.addEventListener("scroll", resetScroll);
    update();
    ctx.onCleanup(function () {
      win.removeEventListener("scroll", queue); win.removeEventListener("resize", queue); if (raf) win.cancelAnimationFrame(raf);
      el.removeEventListener("focusin", onFocus); stage.removeEventListener("scroll", resetScroll);
      el.classList.remove("kw-ms-live"); el.style.removeProperty("--kw-ms-hg-h");
      track.style.transform = ""; if (fill) fill.style.transform = "";
      if (hadTab !== null) view.setAttribute("tabindex", hadTab);
    });
    return {};
  }
  return { pinProgress: pinProgress, sectionHeight: sectionHeight, progressFor: progressFor, init: init };
});
