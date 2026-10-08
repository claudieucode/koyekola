// KOLAKISA — effets de DÉFILEMENT et de SOURIS des pages (page publiée et aperçu ; jamais dans le canevas de l'éditeur).
// Les valeurs viennent des attributs data-kw-scroll / data-kw-mouse / data-kw-fx-off écrits par le serveur à partir du document.
//  - défilement : l'effet suit la position réelle de l'élément dans la fenêtre (pas une animation au chargement) ;
//  - souris : l'élément suit le curseur (déplacement) ou s'incline en 3D ; seulement sur un appareil à pointeur précis avec survol ;
//  - respecte « réduire les animations » (aucun effet) et les écrans où l'effet est coupé (data-kw-fx-off) ;
//  - propriétés CSS INDÉPENDANTES (translate, scale, rotate) : elles ne remplacent jamais la « transform » de l'élément ;
//  - performance : un seul écouteur de défilement, un seul de souris, rAF seulement quand quelque chose bouge, tout est retiré par destroy().
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else { var api = factory(); root.kwEffects = api; if (root.document) api.autostart(root); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var BP = { mobile: 767, tablet: 1023 };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var round = function (v, d) { var k = Math.pow(10, d || 0); return Math.round(v * k) / k + 0; }; // « + 0 » : jamais de -0
  var breakpointOf = function (width) { return width <= BP.mobile ? "mobile" : width <= BP.tablet ? "tablet" : "desktop"; };

  // Progression de l'élément dans la fenêtre : -1 quand il entre par le bas, 0 au centre, +1 quand il sort par le haut
  function progressOf(rect, vh) {
    var half = vh / 2 + rect.height / 2;
    return half > 0 ? clamp((rect.top + rect.height / 2 - vh / 2) / half, -1, 1) : 0;
  }
  // Valeurs CSS d'un jeu d'effets de défilement pour une progression p
  function scrollValues(fx, p) {
    var v = { x: 0, y: 0 };
    if (fx.x) v.x = round(fx.x * p, 1);
    if (fx.y) v.y = round(fx.y * p, 1);
    if (fx.scale) v.scale = round(1 + (fx.scale / 100) * p, 3);
    if (fx.rotate) v.rotate = round(fx.rotate * p, 1);
    if (fx.opacity) v.opacity = round(1 - (fx.opacity / 100) * Math.abs(p), 3);
    if (fx.blur) v.blur = round(fx.blur * Math.abs(p), 2);
    return v;
  }
  // Valeurs d'un effet de souris ; nx, ny ∈ [-1, 1] (position du curseur par rapport au centre de la fenêtre)
  function mouseValues(mouse, nx, ny) {
    var s = mouse.strength || 30;
    if (mouse.mode === "tilt") {
      var mag = Math.min(1, Math.hypot(nx, ny));
      return { tilt: { ax: round(ny, 3), ay: round(-nx, 3), angle: round(s * 0.2 * mag, 2) } };
    }
    var sign = mouse.invert ? 1 : -1; // par défaut l'élément s'éloigne du curseur (profondeur)
    return { x: round(sign * nx * s * 0.5, 1), y: round(sign * ny * s * 0.5, 1) };
  }
  var parse = function (el, name) { try { var v = JSON.parse(el.getAttribute(name)); return v && typeof v === "object" ? v : null; } catch (e) { return null; } };

  function create(win) {
    var doc = win.document;
    var mm = function (q) { return win.matchMedia ? win.matchMedia(q) : { matches: false, addEventListener: function () {}, removeEventListener: function () {} }; };
    var reduceQ = mm("(prefers-reduced-motion: reduce)"), hoverQ = mm("(hover: hover) and (pointer: fine)");
    var records = [];
    var nodes = doc.querySelectorAll("[data-kw-scroll], [data-kw-mouse]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      records.push({
        el: el, scroll: parse(el, "data-kw-scroll"), mouse: parse(el, "data-kw-mouse"),
        off: (el.getAttribute("data-kw-fx-off") || "").split(/\s+/).filter(Boolean), always: el.hasAttribute("data-kw-motion-always"),
        visible: !win.IntersectionObserver, p: 0, cur: { x: 0, y: 0 }, base: { filter: el.style.filter, perspective: null }, applied: false,
      });
    }
    var target = { x: 0, y: 0 }, raf = 0, destroyed = false, io = null, listening = false;
    var active = function (r, kind) { return (!reduceQ.matches || r.always) && r.off.indexOf(breakpointOf(win.innerWidth)) < 0 && (kind !== "mouse" || hoverQ.matches); };

    function clear(r) {
      if (!r.applied) return;
      var st = r.el.style;
      ["translate", "scale", "rotate", "opacity"].forEach(function (k) { st.removeProperty(k); });
      st.filter = r.base.filter;
      if (r.base.perspective !== null && r.el.parentElement) r.el.parentElement.style.perspective = r.base.perspective;
      r.applied = false;
    }
    function render(r) {
      // Un élément qui attend son animation d'entrée ne bouge pas encore (sinon il apparaîtrait avant elle)
      if (r.el.hasAttribute("data-kw-anim") && !r.el.classList.contains("is-in")) return;
      var st = r.el.style, tx = 0, ty = 0, sv = null, mv = null, any = false;
      if (r.scroll && active(r, "scroll")) { sv = scrollValues(r.scroll, r.p); tx += sv.x; ty += sv.y; any = true; }
      if (r.mouse && active(r, "mouse")) { mv = mouseValues(r.mouse, r.cur.x, r.cur.y); if (!mv.tilt) { tx += mv.x; ty += mv.y; } any = true; }
      if (!any) { clear(r); return; }
      r.applied = true;
      if (tx || ty) st.translate = tx + "px " + ty + "px"; else st.removeProperty("translate");
      if (sv && sv.scale !== undefined) st.scale = String(sv.scale); else st.removeProperty("scale");
      if (mv && mv.tilt) {
        var t = mv.tilt;
        if (r.base.perspective === null && r.el.parentElement) { r.base.perspective = r.el.parentElement.style.perspective; if (!r.base.perspective) r.el.parentElement.style.perspective = "900px"; }
        st.rotate = t.angle ? t.ax + " " + t.ay + " 0 " + t.angle + "deg" : "0deg";
      } else if (sv && sv.rotate !== undefined) st.rotate = sv.rotate + "deg"; else st.removeProperty("rotate");
      if (sv && sv.opacity !== undefined) st.opacity = String(sv.opacity); else st.removeProperty("opacity");
      st.filter = sv && sv.blur ? (r.base.filter && r.base.filter !== "none" ? r.base.filter + " " : "") + "blur(" + sv.blur + "px)" : r.base.filter;
    }

    // --- défilement : un seul écouteur, un seul rAF par image ---
    var scrollQueued = false;
    function updateScroll() {
      scrollQueued = false;
      if (destroyed) return;
      var vh = win.innerHeight || doc.documentElement.clientHeight || 0;
      for (var k = 0; k < records.length; k++) {
        var r = records[k];
        if (!r.scroll || !r.visible) continue;
        r.p = progressOf(r.el.getBoundingClientRect(), vh);
        render(r);
      }
    }
    var queueScroll = function () { if (!scrollQueued && !destroyed) { scrollQueued = true; win.requestAnimationFrame(updateScroll); } };

    // --- souris : on ne boucle QUE tant que l'élément n'a pas rejoint sa cible (lissage), puis on s'arrête ---
    function frame() {
      raf = 0;
      if (destroyed) return;
      var moving = false;
      for (var k = 0; k < records.length; k++) {
        var r = records[k];
        if (!r.mouse || !r.visible) continue;
        var live = active(r, "mouse");
        var gx = live ? target.x : 0, gy = live ? target.y : 0;
        r.cur.x += (gx - r.cur.x) * 0.18; r.cur.y += (gy - r.cur.y) * 0.18;
        if (Math.abs(gx - r.cur.x) < 0.002 && Math.abs(gy - r.cur.y) < 0.002) { r.cur.x = gx; r.cur.y = gy; } else moving = true;
        render(r);
      }
      if (moving) raf = win.requestAnimationFrame(frame);
    }
    var wake = function () { if (!raf && !destroyed) raf = win.requestAnimationFrame(frame); };
    function onPointer(e) {
      var w = win.innerWidth || 1, h = win.innerHeight || 1;
      target.x = clamp((e.clientX / w) * 2 - 1, -1, 1); target.y = clamp((e.clientY / h) * 2 - 1, -1, 1);
      wake();
    }
    function onLeave() { target.x = 0; target.y = 0; wake(); }
    function onResize() { queueScroll(); wake(); }

    var hasScroll = records.some(function (r) { return r.scroll; }), hasMouse = records.some(function (r) { return r.mouse; });
    if (win.IntersectionObserver && records.length) {
      io = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (en) { var r = records.find(function (x) { return x.el === en.target; }); if (r) { r.visible = en.isIntersecting; if (en.isIntersecting) { queueScroll(); wake(); } } });
      }, { rootMargin: "50px 0px" });
      records.forEach(function (r) { io.observe(r.el); });
    }
    if (hasScroll) win.addEventListener("scroll", queueScroll, { passive: true });
    if (hasMouse) { doc.addEventListener("pointermove", onPointer, { passive: true }); doc.documentElement.addEventListener("mouseleave", onLeave); }
    if (records.length) win.addEventListener("resize", onResize, { passive: true });
    var onMedia = function () { records.forEach(function (r) { if (!active(r, "scroll") && !active(r, "mouse")) clear(r); }); queueScroll(); wake(); };
    [reduceQ, hoverQ].forEach(function (q) { if (q.addEventListener) q.addEventListener("change", onMedia); });
    listening = true;
    if (records.length) queueScroll();

    return {
      records: records, update: function () { queueScroll(); wake(); },
      // Retire tout : écouteurs, observateur, images en attente et styles posés (appelé aussi avant de quitter la page)
      destroy: function () {
        if (destroyed) return; destroyed = true;
        if (listening) {
          win.removeEventListener("scroll", queueScroll); win.removeEventListener("resize", onResize);
          doc.removeEventListener("pointermove", onPointer); doc.documentElement.removeEventListener("mouseleave", onLeave);
          [reduceQ, hoverQ].forEach(function (q) { if (q.removeEventListener) q.removeEventListener("change", onMedia); });
        }
        if (io) io.disconnect();
        if (raf && win.cancelAnimationFrame) win.cancelAnimationFrame(raf);
        records.forEach(clear);
      },
    };
  }

  // Démarrage automatique sur la page publiée et dans l'aperçu ; jamais dans le canevas de l'éditeur
  function autostart(win) {
    var start = function () {
      if (win.document.body && win.document.body.hasAttribute("data-kw-builder")) return;
      if (!win.document.querySelector("[data-kw-scroll], [data-kw-mouse]")) return;
      win.kwEffectsInstance = create(win);
      win.addEventListener("pagehide", function () { if (win.kwEffectsInstance) win.kwEffectsInstance.destroy(); });
    };
    if (win.document.readyState === "loading") win.document.addEventListener("DOMContentLoaded", start); else start();
  }

  return { breakpointOf: breakpointOf, progressOf: progressOf, scrollValues: scrollValues, mouseValues: mouseValues, create: create, autostart: autostart };
});
