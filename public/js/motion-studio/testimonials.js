// Motion Studio (lot S) — module « testimonials » : carrousel de témoignages animé.
// Le serveur écrit tous les témoignages l'un sous l'autre (lisibles sans JavaScript). Ce module n'en montre qu'un à la fois (les autres : aria-hidden + inert),
// ajoute flèches, points (boutons) et, si demandé, la lecture automatique avec un bouton Pause (boucle > 5 s). Transitions Web Animations (fondu, glissement, netteté).
// Lecture automatique : arrêtée au survol, au focus, onglet masqué, ou par le bouton. Flèches gauche / droite au clavier, glisser au doigt. Mouvement réduit : aucun carrousel.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("testimonials", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  // Images-clés [sortie, entrée] ; dir = +1 (suivant) ou -1 (précédent)
  function transition(preset, dir) {
    var d = dir < 0 ? -1 : 1;
    if (preset === "fade") return [[{ opacity: 1 }, { opacity: 0 }], [{ opacity: 0 }, { opacity: 1 }]];
    if (preset === "blur") return [[{ opacity: 1, filter: "blur(0)" }, { opacity: 0, filter: "blur(8px)" }], [{ opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0)" }]];
    return [[{ opacity: 1, transform: NONE }, { opacity: 0, transform: "translateX(" + -48 * d + "px)" }], [{ opacity: 0, transform: "translateX(" + 48 * d + "px)" }, { opacity: 1, transform: NONE }]];
  }
  var wrap = function (i, n) { return ((i % n) + n) % n; };

  function init(ctx) {
    var el = ctx.el, win = ctx.win, doc = ctx.doc, cfg = ctx.cfg, prm = cfg.params || {};
    if (ctx.reduced) return {};
    var list = el.querySelector("[data-ms-list]"), slides = Array.prototype.slice.call(el.querySelectorAll("[data-ms-slide]")), n = slides.length;
    if (!list || n < 2 || typeof slides[0].animate !== "function") return {};
    var easing = win.KWMS && win.KWMS.easingCss ? win.KWMS.easingCss(cfg.easing) : "ease";
    var autoplay = Boolean(prm.autoplay) && ctx.mode !== "editor", interval = Math.min(20, Math.max(3, Number(prm.interval) || 6)) * 1000;
    var cur = 0, timer = 0, hover = false, focus = false, userPaused = false, anims = [], made = [];
    var mk = function (tag, cls, attrs, text) { var x = doc.createElement(tag); if (cls) x.className = cls; Object.keys(attrs || {}).forEach(function (k) { x.setAttribute(k, attrs[k]); }); if (text) x.textContent = text; made.push(x); return x; };

    var controls = mk("div", "kw-ms-ts-controls"), prev = null, next = null, dots = [], pause = null;
    if (el.classList.contains("has-arrows")) {
      prev = mk("button", "kw-ms-ts-btn", { type: "button", "aria-label": "Témoignage précédent" }); prev.appendChild(mk("span", "", { "aria-hidden": "true" }, "‹"));
      next = mk("button", "kw-ms-ts-btn", { type: "button", "aria-label": "Témoignage suivant" }); next.appendChild(mk("span", "", { "aria-hidden": "true" }, "›"));
    }
    if (prev) controls.appendChild(prev);
    if (el.classList.contains("has-dots")) {
      var dl = mk("div", "kw-ms-ts-dots");
      slides.forEach(function (s, i) { var b = mk("button", "kw-ms-ts-dot", { type: "button", "aria-label": "Aller au témoignage " + (i + 1) + " sur " + n }); b.addEventListener("click", function () { go(i); }); dl.appendChild(b); dots.push(b); });
      controls.appendChild(dl);
    }
    if (next) controls.appendChild(next);
    if (autoplay) { pause = mk("button", "kw-ms-ts-btn is-text", { type: "button" }, "Pause"); controls.appendChild(pause); }
    if (controls.childNodes.length) el.appendChild(controls);

    var setAria = function () { slides.forEach(function (s, i) { var on = i === cur; if (on) { s.removeAttribute("aria-hidden"); s.removeAttribute("inert"); } else { s.setAttribute("aria-hidden", "true"); s.setAttribute("inert", ""); } }); dots.forEach(function (d, i) { if (i === cur) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); }); };
    var live = function () { list.setAttribute("aria-live", autoplay && !userPaused ? "off" : "polite"); };
    var settle = function () { anims.splice(0).forEach(function (a) { try { a.cancel(); } catch (e) { /* retirée */ } }); slides.forEach(function (s, i) { s.classList.remove("is-leaving"); s.classList.toggle("is-active", i === cur); }); };
    function go(i, dir) {
      i = wrap(i, n);
      if (i === cur) return;
      var from = slides[cur], to = slides[i], d = dir || (i > cur ? 1 : -1);
      settle(); cur = i;
      from.classList.add("is-leaving"); from.classList.remove("is-active"); to.classList.add("is-active");
      var t = transition(cfg.preset, d), o = { duration: cfg.duration, easing: easing };
      var out = from.animate(t[0], Object.assign({ fill: "forwards" }, o)), inn = to.animate(t[1], Object.assign({ fill: "backwards" }, o));
      anims.push(out, inn); out.onfinish = function () { if (slides[cur] === to) settle(); };
      setAria(); schedule();
    }
    function schedule() {
      win.clearTimeout(timer);
      if (autoplay && !userPaused && !hover && !focus && !doc.hidden) timer = win.setTimeout(function () { go(cur + 1, 1); }, interval);
    }
    slides.forEach(function (s, i) { s.classList.toggle("is-active", i === 0); });
    el.classList.add("kw-ms-live"); setAria(); live();

    var onPrev = function () { go(cur - 1, -1); }, onNext = function () { go(cur + 1, 1); };
    if (prev) prev.addEventListener("click", onPrev);
    if (next) next.addEventListener("click", onNext);
    var onPause = function () { userPaused = !userPaused; pause.textContent = userPaused ? "Lecture" : "Pause"; live(); schedule(); };
    if (pause) pause.addEventListener("click", onPause);
    var onKey = function (e) { if (e.key === "ArrowRight") { e.preventDefault(); onNext(); } else if (e.key === "ArrowLeft") { e.preventDefault(); onPrev(); } };
    var onEnter = function () { hover = true; schedule(); }, onLeave = function () { hover = false; schedule(); };
    var onFin = function () { focus = true; schedule(); }, onFout = function (e) { if (!el.contains(e.relatedTarget)) { focus = false; schedule(); } };
    var onVis = function () { schedule(); };
    var x0 = null;
    var onDown = function (e) { x0 = e.clientX; }, onUp = function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) { if (dx < 0) onNext(); else onPrev(); } };
    el.addEventListener("keydown", onKey); el.addEventListener("mouseenter", onEnter); el.addEventListener("mouseleave", onLeave);
    el.addEventListener("focusin", onFin); el.addEventListener("focusout", onFout); doc.addEventListener("visibilitychange", onVis);
    list.addEventListener("pointerdown", onDown); list.addEventListener("pointerup", onUp); list.addEventListener("pointercancel", function () { x0 = null; });
    schedule();
    ctx.onCleanup(function () {
      win.clearTimeout(timer); settle();
      el.removeEventListener("keydown", onKey); el.removeEventListener("mouseenter", onEnter); el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("focusin", onFin); el.removeEventListener("focusout", onFout); doc.removeEventListener("visibilitychange", onVis);
      list.removeEventListener("pointerdown", onDown); list.removeEventListener("pointerup", onUp);
      made.forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
      slides.forEach(function (s) { s.removeAttribute("aria-hidden"); s.removeAttribute("inert"); s.classList.remove("is-active", "is-leaving"); });
      list.removeAttribute("aria-live"); el.classList.remove("kw-ms-live");
    });
    return {};
  }
  return { transition: transition, wrap: wrap, init: init };
});
