// Motion Studio — module « animated-bg » : anime les calques d'un fond (dégradé qui tourne, mesh gradient, grain). Seuls transform (et opacity) bougent, sur des calques internes.
// Le serveur écrit le fond FIXE (même rendu, sans mouvement) : sans JavaScript ou avec « réduire les animations », rien ne bouge et aucun bouton n'est ajouté.
// Boucle sans fin : un bouton Pause visible (réglage « Afficher le bouton Pause », actif par défaut) et une mise en pause automatique quand le bloc quitte l'écran.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("animated-bg", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var T = function (x, y, s, r) { return "translate3d(" + x + "%," + y + "%,0) scale(" + s + ")" + (r ? " rotate(" + r + "deg)" : ""); };
  // Images-clés de chaque calque selon l'effet : [calque, départ, arrivée, facteur de durée]
  var PLANS = {
    gradient: [["l1", "rotate(0deg)", "rotate(180deg)", 1]],
    mesh: [["l1", T(0, 0, 1), T(18, 10, 1.2), 1], ["l2", T(0, 0, 1), T(-15, 14, 1.1), 1.3], ["l3", T(0, 0, 1), T(10, -16, 1.25), 1.6]],
    noise: [["l1", "rotate(0deg)", "rotate(40deg)", 1.5], ["grain", "translate3d(0,0,0)", "translate3d(-6%,4%,0)", 1]],
  };
  function plan(preset) { return PLANS[preset] || PLANS.gradient; }

  function init(ctx) {
    var el = ctx.el, doc = ctx.doc, win = ctx.win, art = el.querySelector(".kw-ms-bg-art");
    if (!art) return {};
    var p = ctx.cfg.params || {}, grain = Number(p.grain);
    if (isFinite(grain)) el.style.setProperty("--kw-ms-grain", String(Math.min(60, Math.max(0, grain)) / 100));
    if (ctx.reduced) return { destroy: function () { el.style.removeProperty("--kw-ms-grain"); } };
    var anims = [];
    plan(ctx.cfg.preset).forEach(function (row) {
      var layer = art.querySelector(".kw-ms-bg-" + row[0]); if (!layer) return;
      anims.push(ctx.animate(layer, [{ transform: row[1] }, { transform: row[2] }], { duration: Math.round(ctx.cfg.duration * row[3]), noBaseDelay: false }));
    });
    var userPaused = false, visible = true, started = false, btn = null, io = null;
    var sync = function () { anims.forEach(function (a) { try { if (started && visible && !userPaused) a.play(); else a.pause(); } catch (e) { /* animation retirée */ } }); };
    var label = function () { if (!btn) return; btn.setAttribute("aria-pressed", String(userPaused)); btn.textContent = userPaused ? "Reprendre l'animation" : "Pause de l'animation"; };
    if (p.pausable !== false && ctx.mode !== "editor" && anims.length) {
      btn = doc.createElement("button"); btn.type = "button"; btn.className = "kw-ms-bg-pause";
      btn.setAttribute("aria-label", "Mettre en pause ou reprendre l'animation du fond");
      btn.addEventListener("click", function () { userPaused = !userPaused; label(); sync(); });
      label(); el.appendChild(btn);
    }
    if (win.IntersectionObserver && ctx.mode !== "editor") {
      io = new win.IntersectionObserver(function (entries) { entries.forEach(function (e) { visible = e.isIntersecting; sync(); }); });
      io.observe(el);
    }
    ctx.onCleanup(function () { if (io) io.disconnect(); if (btn && btn.parentNode) btn.parentNode.removeChild(btn); el.style.removeProperty("--kw-ms-grain"); });
    return {
      // Appelé par le runtime au déclencheur (et par « Lire » dans l'éditeur)
      play: function () { started = true; anims.forEach(function (a) { try { a.cancel(); a.currentTime = 0; } catch (e) { /* ignorée */ } }); sync(); },
    };
  }
  return { PLANS: PLANS, plan: plan, init: init };
});
