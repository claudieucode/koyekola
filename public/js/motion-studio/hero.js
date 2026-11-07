// Motion Studio (lot S) — module « hero » : Hero animé orchestré.
// Le serveur écrit le hero COMPLET (visible sans JavaScript, fond fixe). Ce module : (1) fait entrer en séquence l'étiquette, le titre, le sous-titre, les boutons
// puis le visuel (animations Web Animations créées par le runtime : déclencheur, délai, durée, courbe, cascade viennent des réglages) ; (2) anime le fond (halos qui
// dérivent ou dégradé qui tourne) en boucle LENTE avec un bouton Pause (boucle > 5 s). Mouvement réduit : rien n'est transformé, rien ne bouge.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("hero", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  // Texte / visuel : images-clés par effet (opacity, transform, filter uniquement)
  var PRESETS = {
    "fade-up": { t: [{ opacity: 0, transform: "translateY(28px)" }, { opacity: 1, transform: NONE }], v: [{ opacity: 0, transform: "translateY(36px) scale(.97)" }, { opacity: 1, transform: NONE }] },
    fade: { t: [{ opacity: 0 }, { opacity: 1 }], v: [{ opacity: 0 }, { opacity: 1 }] },
    blur: { t: [{ opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0)" }], v: [{ opacity: 0, filter: "blur(16px)" }, { opacity: 1, filter: "blur(0)" }] },
    scale: { t: [{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: NONE }], v: [{ opacity: 0, transform: "scale(.88)" }, { opacity: 1, transform: NONE }] },
    slide: { t: [{ opacity: 0, transform: "translateX(-36px)" }, { opacity: 1, transform: NONE }], v: [{ opacity: 0, transform: "translateX(48px)" }, { opacity: 1, transform: NONE }] },
  };
  // Fond : durée d'un aller (s) selon la vitesse choisie ; jamais en dessous de 12 s (pas de mouvement vif)
  var BG_SECONDS = { slow: 28, normal: 16 };
  var orbFrames = function (i) {
    var k = [[8, 5], [-6, 7], [5, -6]][i % 3];
    return [{ transform: "translate3d(0,0,0) scale(1)" }, { transform: "translate3d(" + k[0] + "vmax," + k[1] + "vmax,0) scale(1.12)" }, { transform: "translate3d(" + (-k[1]) + "vmax," + k[0] + "vmax,0) scale(.95)" }, { transform: "translate3d(0,0,0) scale(1)" }];
  };

  function init(ctx) {
    var el = ctx.el, doc = ctx.doc, win = ctx.win;
    if (ctx.reduced) return {};
    var preset = PRESETS[ctx.cfg.preset] || PRESETS["fade-up"];
    var parts = Array.prototype.slice.call(el.querySelectorAll("[data-ms-seq]"));
    parts.forEach(function (p, i) { ctx.animate(p, p.hasAttribute("data-ms-visual") ? preset.v : preset.t, { delay: ctx.stagger(i, parts.length) }); });

    // ---- fond animé léger, avec pause ----
    var kind = el.getAttribute("data-kw-ms-bg"), orbs = Array.prototype.slice.call(el.querySelectorAll(".kw-ms-hr-orb"));
    if (kind && kind !== "none" && orbs.length && win.Element && typeof orbs[0].animate === "function") {
      var base = BG_SECONDS[el.getAttribute("data-kw-ms-bgspeed")] || BG_SECONDS.slow, anims = [];
      if (kind === "gradient") anims.push(orbs[0].animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: base * 2000, iterations: Infinity, easing: "linear" }));
      else orbs.forEach(function (o, i) { anims.push(o.animate(orbFrames(i), { duration: base * 1000 * (1 + i * 0.25), iterations: Infinity, easing: "ease-in-out" })); });
      var userPaused = false, visible = true;
      var sync = function () { anims.forEach(function (a) { try { if (userPaused || !visible) a.pause(); else a.play(); } catch (e) { /* animation retirée */ } }); };
      var btn = doc.createElement("button");
      btn.type = "button"; btn.className = "kw-ms-hr-pause"; btn.textContent = "Mettre le fond animé en pause";
      btn.addEventListener("click", function () { userPaused = !userPaused; btn.textContent = userPaused ? "Reprendre le fond animé" : "Mettre le fond animé en pause"; sync(); });
      el.appendChild(btn);
      var io = null;
      if (win.IntersectionObserver) { io = new win.IntersectionObserver(function (es) { visible = es[es.length - 1].isIntersecting; sync(); }); io.observe(el); }
      ctx.onCleanup(function () { if (io) io.disconnect(); anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* déjà retirée */ } }); if (btn.parentNode) btn.parentNode.removeChild(btn); });
    }
    return {};
  }
  return { PRESETS: PRESETS, BG_SECONDS: BG_SECONDS, orbFrames: orbFrames, init: init };
});
