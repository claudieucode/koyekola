// Motion Studio (lot S) — module « steps » : Chronologie animée et Étapes de processus (même mécanique d'apparition, deux gabarits).
// Le serveur écrit TOUTES les étapes (lisibles sans JavaScript, ligne pleine, pastilles remplies). Ce module :
//  - crée une animation par partie à faire apparaître ([data-ms-reveal] : carte, pastille, texte ; [data-ms-draw] : trait qui se trace) ;
//  - quand le runtime déclenche (play), fait apparaître chaque étape QUAND ELLE ENTRE dans la fenêtre (cascade entre étapes visibles en même temps) ;
//  - chronologie : la ligne se remplit selon le défilement (transform: scaleY) et les repères s'allument au passage.
// Mouvement réduit : rien n'est transformé. Éditeur : état final visible (ligne pleine).
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("steps", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none", clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var PRESETS = {
    "fade-up": [{ opacity: 0, transform: "translateY(26px)" }, { opacity: 1, transform: NONE }],
    fade: [{ opacity: 0 }, { opacity: 1 }],
    slide: [{ opacity: 0, transform: "translateX(-34px)" }, { opacity: 1, transform: NONE }],
    scale: [{ opacity: 0, transform: "scale(.9)" }, { opacity: 1, transform: NONE }],
    pop: [{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: NONE }],
  };
  // Part (0 à 1) de la ligne à remplir : la « tête » est à `head` px du haut de la fenêtre ; la ligne va de lineTop à lineTop + lineH
  function fillRatio(lineTop, lineH, head) { return lineH > 0 ? clamp((head - lineTop) / lineH, 0, 1) : 1; }

  function init(ctx) {
    if (ctx.reduced) return {};
    var el = ctx.el, win = ctx.win, cfg = ctx.cfg, kind = el.getAttribute("data-kw-ms-kind") === "process" ? "process" : "timeline";
    var steps = Array.prototype.slice.call(el.querySelectorAll("[data-ms-step]"));
    if (!steps.length) return {};
    var frames = PRESETS[cfg.preset] || PRESETS[kind === "process" ? "pop" : "fade-up"];
    var scrub = cfg.trigger === "scroll", n = steps.length;
    var horizontal = kind === "process" && el.classList.contains("is-row") && win.matchMedia && win.matchMedia("(min-width: 760px)").matches;
    var groups = []; // { el, anims: [{ a, extra }] }
    steps.forEach(function (st, i) {
      var g = { el: st, anims: [] }, base = scrub ? ctx.stagger(i, n) : 0, add = function (target, kf, extra, dur) { var a = ctx.animate(target, kf, { delay: base + extra, duration: dur }); g.anims.push({ a: a, extra: extra }); };
      if (kind === "timeline") {
        var card = st.querySelector("[data-ms-reveal]"), dot = st.querySelector("[data-ms-dot]");
        if (card) add(card, frames, 0);
        if (dot) add(dot, PRESETS.pop, 0, Math.min(cfg.duration, 450));
      } else {
        var badge = st.querySelector("[data-ms-badge]"), body = st.querySelector(".kw-ms-pr-body"), link = st.querySelector("[data-ms-draw]");
        if (badge) add(badge, frames, 0, Math.min(cfg.duration, 500));
        if (body) add(body, PRESETS["fade-up"], 140);
        if (link) add(link, [{ transform: horizontal ? "scaleX(0)" : "scaleY(0)" }, { transform: NONE }], 320, cfg.duration);
      }
      groups.push(g);
    });

    // Apparition étape par étape : chaque étape joue quand elle entre dans la fenêtre ; celles qui entrent ensemble s'enchaînent (cascade)
    var io = null;
    var start = function (batch) {
      batch.forEach(function (g, k) { g.anims.forEach(function (x) { try { x.a.effect.updateTiming({ delay: cfg.delay + x.extra + k * cfg.stagger }); x.a.play(); } catch (e) { /* retirée */ } }); });
    };
    var inst = {
      play: function () {
        if (io) io.disconnect();
        groups.forEach(function (g) { g.anims.forEach(function (x) { try { x.a.cancel(); x.a.pause(); x.a.currentTime = 0; } catch (e) { /* retirée */ } }); });
        if (scrub) return;
        if (!win.IntersectionObserver) { start(groups); return; }
        io = new win.IntersectionObserver(function (entries) {
          var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return groups[steps.indexOf(e.target)]; }).filter(Boolean).sort(function (a, b) { return steps.indexOf(a.el) - steps.indexOf(b.el); });
          batch.forEach(function (g) { io.unobserve(g.el); });
          if (batch.length) start(batch);
        }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
        steps.forEach(function (s) { io.observe(s); });
      },
    };
    ctx.onCleanup(function () { if (io) io.disconnect(); });

    // Chronologie : ligne qui se remplit au défilement, repères allumés au passage (état final dans l'éditeur)
    if (kind === "timeline") {
      var line = el.querySelector(".kw-ms-tl-line"), fill = el.querySelector("[data-ms-fill]"), dots = Array.prototype.slice.call(el.querySelectorAll("[data-ms-dot]"));
      el.classList.add("kw-ms-live");
      if (ctx.mode === "editor") { dots.forEach(function (d) { d.classList.add("is-reached"); }); }
      else if (line && fill) {
        var raf = 0;
        var update = function () {
          raf = 0;
          var r = line.getBoundingClientRect(), head = (win.innerHeight || 1) * 0.6, ratio = fillRatio(r.top, r.height, head);
          fill.style.transform = "scaleY(" + ratio.toFixed(4) + ")";
          dots.forEach(function (d) { var b = d.getBoundingClientRect(); d.classList.toggle("is-reached", b.top + b.height / 2 <= head); });
        };
        var queue = function () { if (!raf) raf = win.requestAnimationFrame(update); };
        win.addEventListener("scroll", queue, { passive: true }); win.addEventListener("resize", queue);
        update();
        ctx.onCleanup(function () { win.removeEventListener("scroll", queue); win.removeEventListener("resize", queue); if (raf) win.cancelAnimationFrame(raf); });
      }
      ctx.onCleanup(function () { el.classList.remove("kw-ms-live"); if (fill) fill.style.transform = ""; dots.forEach(function (d) { d.classList.remove("is-reached"); }); });
    } else if (el.classList.contains("is-row")) {
      // La largeur de l'écran change le sens du trait (horizontal / vertical) : on reconstruit en gardant l'état « déjà joué »
      ctx.onResize(function () { ctx.rebuild(); });
    }
    return inst;
  }
  return { PRESETS: PRESETS, fillRatio: fillRatio, init: init };
});
