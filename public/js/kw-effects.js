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
  // ---- Défilement « de → à » (scrollFx) : une valeur de départ, une valeur d'arrivée, sur une plage de la fenêtre ----
  // t brut : 0 quand le haut de l'élément touche le bas de la fenêtre, 1 quand son bas quitte le haut ; la plage start–end (en %) le remet à 0–1
  function fxProgress(rect, vh, fx) {
    var span = vh + rect.height;
    if (span <= 0) return 0;
    var raw = clamp((vh - rect.top) / span, 0, 1) * 100;
    var s = fx.start == null ? 0 : fx.start, e = fx.end == null ? 100 : fx.end;
    if (e <= s) e = s + 1;
    var t = clamp((raw - s) / (e - s), 0, 1);
    return fx.invert ? 1 - t : t;
  }
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  // Valeurs d'un jeu « de → à » pour une progression t ∈ [0, 1] (seuls les effets présents sont calculés)
  function sfxValues(fx, t) {
    var v = {};
    if (fx.translateX) v.x = round(lerp(fx.translateX.from, fx.translateX.to, t), 2);
    if (fx.translateY) v.y = round(lerp(fx.translateY.from, fx.translateY.to, t), 2);
    if (fx.rotate) v.rotate = round(lerp(fx.rotate.from, fx.rotate.to, t), 2);
    if (fx.rotateX) v.rotateX = round(lerp(fx.rotateX.from, fx.rotateX.to, t), 2);
    if (fx.scale) v.scale = round(lerp(fx.scale.from, fx.scale.to, t), 4);
    if (fx.opacity) v.opacity = round(lerp(fx.opacity.from, fx.opacity.to, t), 3);
    if (fx.blur) v.blur = round(lerp(fx.blur.from, fx.blur.to, t), 2);
    return v;
  }
  // Effet de souris « amplitudes » (mouseFx) ; nx, ny ∈ [-1, 1]
  function mfxValues(m, nx, ny) {
    var v = {}, mag = Math.min(1, Math.hypot(nx, ny));
    if (m.translateX) v.x = round(nx * m.translateX, 2);
    if (m.translateY) v.y = round(ny * m.translateY, 2);
    if (m.rotateX) v.rotateX = round(-ny * m.rotateX, 2);
    if (m.rotateY) v.rotateY = round(nx * m.rotateY, 2);
    if (m.rotateZ) v.rotateZ = round(nx * m.rotateZ, 2);
    if (m.scale) v.scale = round(1 + (m.scale / 100) * mag, 4);
    return v;
  }
  // Rotations composées : plusieurs rotations (axe + angle) deviennent UNE seule propriété CSS « rotate » (quaternions), sans qu'aucune n'en écrase une autre
  function qAxis(ax, ay, az, deg) { var len = Math.hypot(ax, ay, az) || 1, h = deg * Math.PI / 360, s = Math.sin(h) / len; return [Math.cos(h), ax * s, ay * s, az * s]; }
  function qMul(a, b) { return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]]; }
  function composeRotations(list) {
    var q = [1, 0, 0, 0];
    list.forEach(function (r) { if (r[3]) q = qMul(q, qAxis(r[0], r[1], r[2], r[3])); });
    var w = clamp(q[0], -1, 1), ang = 2 * Math.acos(w) * 180 / Math.PI, sn = Math.sqrt(1 - w * w);
    if (sn < 1e-6 || ang < 1e-3) return "0deg";
    return round(q[1] / sn, 4) + " " + round(q[2] / sn, 4) + " " + round(q[3] / sn, 4) + " " + round(ang, 2) + "deg";
  }
  var parse = function (el, name) { try { var v = JSON.parse(el.getAttribute(name)); return v && typeof v === "object" ? v : null; } catch (e) { return null; } };

  function create(win) {
    var doc = win.document;
    var mm = function (q) { return win.matchMedia ? win.matchMedia(q) : { matches: false, addEventListener: function () {}, removeEventListener: function () {} }; };
    var reduceQ = mm("(prefers-reduced-motion: reduce)"), hoverQ = mm("(hover: hover) and (pointer: fine)");
    var records = [];
    var nodes = doc.querySelectorAll("[data-kw-scroll], [data-kw-mouse], [data-kw-sfx], [data-kw-mfx]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      records.push({
        el: el, scroll: parse(el, "data-kw-scroll"), mouse: parse(el, "data-kw-mouse"), sfx: parse(el, "data-kw-sfx"), mfx: parse(el, "data-kw-mfx"), t: 0, held: false,
        off: (el.getAttribute("data-kw-fx-off") || "").split(/\s+/).filter(Boolean), always: el.hasAttribute("data-kw-motion-always"),
        visible: !win.IntersectionObserver, p: 0, cur: { x: 0, y: 0 }, base: { filter: el.style.filter, perspective: null }, applied: false,
      });
    }
    var target = { x: 0, y: 0 }, raf = 0, destroyed = false, io = null, listening = false;
    var active = function (r, kind) { return (!reduceQ.matches || r.always) && r.off.indexOf(breakpointOf(win.innerWidth)) < 0 && (kind !== "mouse" || hoverQ.matches); };

    // Parent qui possède une boîte : l'enveloppe .kw-layout d'une Section libre est transparente (display: contents) et ne peut porter ni perspective ni dimensions
    function boxParent(el) { var p = el.parentElement; while (p && el.ownerDocument.defaultView.getComputedStyle(p).display === "contents") p = p.parentElement; return p; }
    function clear(r) {
      if (!r.applied) return;
      var st = r.el.style;
      ["translate", "scale", "rotate", "opacity"].forEach(function (k) { st.removeProperty(k); });
      st.filter = r.base.filter;
      if (r.base.perspective !== null && boxParent(r.el)) boxParent(r.el).style.perspective = r.base.perspective;
      r.applied = false;
    }
    function render(r) {
      // Un élément qui attend son animation d'entrée ne bouge pas encore (sinon il apparaîtrait avant elle)
      if (r.el.hasAttribute("data-kw-anim") && !r.el.classList.contains("is-in")) return;
      if (r.sfx || r.mfx) { renderFx(r); return; }
      var st = r.el.style, tx = 0, ty = 0, sv = null, mv = null, any = false;
      if (r.scroll && active(r, "scroll")) { sv = scrollValues(r.scroll, r.p); tx += sv.x; ty += sv.y; any = true; }
      if (r.mouse && active(r, "mouse")) { mv = mouseValues(r.mouse, r.cur.x, r.cur.y); if (!mv.tilt) { tx += mv.x; ty += mv.y; } any = true; }
      if (!any) { clear(r); return; }
      r.applied = true;
      if (tx || ty) st.translate = tx + "px " + ty + "px"; else st.removeProperty("translate");
      if (sv && sv.scale !== undefined) st.scale = String(sv.scale); else st.removeProperty("scale");
      if (mv && mv.tilt) {
        var t = mv.tilt;
        if (r.base.perspective === null && boxParent(r.el)) { var bp0 = boxParent(r.el); r.base.perspective = bp0.style.perspective; if (!r.base.perspective) bp0.style.perspective = "900px"; }
        st.rotate = t.angle ? t.ax + " " + t.ay + " 0 " + t.angle + "deg" : "0deg";
      } else if (sv && sv.rotate !== undefined) st.rotate = sv.rotate + "deg"; else st.removeProperty("rotate");
      if (sv && sv.opacity !== undefined) st.opacity = String(sv.opacity); else st.removeProperty("opacity");
      st.filter = sv && sv.blur ? (r.base.filter && r.base.filter !== "none" ? r.base.filter + " " : "") + "blur(" + sv.blur + "px)" : r.base.filter;
    }

    // Composition complète (effets « de → à », amplitudes de souris, et les réglages d'origine) : translate = somme, scale = produit,
    // rotations = quaternions, opacité = produit, flou = somme ; chaque propriété CSS n'est écrite qu'UNE fois par ce calcul central
    function renderFx(r) {
      var st = r.el.style, tx = 0, ty = 0, sc = 1, op = null, blur = 0, rots = [], any = false, tilt3d = 0;
      var live = active(r, "scroll"), liveM = active(r, "mouse");
      if (r.scroll && live) { var sv = scrollValues(r.scroll, r.p); tx += sv.x; ty += sv.y; if (sv.scale !== undefined) sc *= sv.scale; if (sv.rotate !== undefined) rots.push([0, 0, 1, sv.rotate]); if (sv.opacity !== undefined) op = (op === null ? 1 : op) * sv.opacity; if (sv.blur) blur += sv.blur; any = true; }
      if (r.sfx && live) { var fv = sfxValues(r.sfx, r.t); if (fv.x) tx += fv.x; if (fv.y) ty += fv.y; if (fv.scale !== undefined) sc *= fv.scale; if (fv.rotate !== undefined) rots.push([0, 0, 1, fv.rotate]); if (fv.rotateX !== undefined) { rots.push([1, 0, 0, fv.rotateX]); tilt3d = Math.max(tilt3d, r.sfx.perspective || 1000); } if (fv.opacity !== undefined) op = (op === null ? 1 : op) * fv.opacity; if (fv.blur) blur += fv.blur; any = true; }
      if (r.mouse && liveM) { var mv = mouseValues(r.mouse, r.cur.x, r.cur.y); if (mv.tilt) { rots.push([mv.tilt.ax, mv.tilt.ay, 0, mv.tilt.angle]); tilt3d = Math.max(tilt3d, 900); } else { tx += mv.x; ty += mv.y; } any = true; }
      if (r.mfx && liveM) { var gv = mfxValues(r.mfx, r.cur.x, r.cur.y); if (gv.x) tx += gv.x; if (gv.y) ty += gv.y; if (gv.scale !== undefined) sc *= gv.scale; if (gv.rotateX !== undefined) { rots.push([1, 0, 0, gv.rotateX]); tilt3d = Math.max(tilt3d, r.mfx.perspective || 1000); } if (gv.rotateY !== undefined) { rots.push([0, 1, 0, gv.rotateY]); tilt3d = Math.max(tilt3d, r.mfx.perspective || 1000); } if (gv.rotateZ !== undefined) rots.push([0, 0, 1, gv.rotateZ]); any = true; }
      if (!any) { clear(r); return; }
      r.applied = true;
      if (tx || ty) st.translate = round(tx, 2) + "px " + round(ty, 2) + "px"; else st.removeProperty("translate");
      if (sc !== 1) st.scale = String(round(sc, 4)); else st.removeProperty("scale");
      if (rots.some(function (q) { return q[3]; })) st.rotate = composeRotations(rots); else st.removeProperty("rotate");
      if (tilt3d && boxParent(r.el)) { if (r.base.perspective === null) { var bp1 = boxParent(r.el); r.base.perspective = bp1.style.perspective; if (!r.base.perspective) bp1.style.perspective = tilt3d + "px"; } }
      if (op !== null) st.opacity = String(round(op, 3)); else st.removeProperty("opacity");
      st.filter = blur ? (r.base.filter && r.base.filter !== "none" ? r.base.filter + " " : "") + "blur(" + round(blur, 2) + "px)" : r.base.filter;
    }

    // --- défilement : un seul écouteur, un seul rAF par image ---
    var scrollQueued = false, lastY = win.pageYOffset || 0;
    function updateScroll() {
      scrollQueued = false;
      if (destroyed) return;
      var vh = win.innerHeight || doc.documentElement.clientHeight || 0;
      var sy = win.pageYOffset || 0, delta = sy - lastY;
      for (var k = 0; k < records.length; k++) {
        var r = records[k];
        if ((!r.scroll && !r.sfx) || !r.visible) continue;
        var rect = r.el.getBoundingClientRect();
        if (r.scroll) r.p = progressOf(rect, vh);
        if (r.sfx) {
          // Sens du défilement : « vers le bas » ou « vers le haut » seulement — dans l'autre sens, la valeur reste où elle est
          var dir = r.sfx.dir || "both", blocked = r.held && delta && ((dir === "down" && delta < 0) || (dir === "up" && delta > 0));
          if (!blocked) { r.t = fxProgress(rect, vh, r.sfx); r.held = true; }
        }
        render(r);
      }
      lastY = sy;
    }
    var queueScroll = function () { if (!scrollQueued && !destroyed) { scrollQueued = true; win.requestAnimationFrame(updateScroll); } };

    // --- souris : on ne boucle QUE tant que l'élément n'a pas rejoint sa cible (lissage), puis on s'arrête ---
    function frame() {
      raf = 0;
      if (destroyed) return;
      var moving = false;
      for (var k = 0; k < records.length; k++) {
        var r = records[k];
        if ((!r.mouse && !r.mfx) || !r.visible) continue;
        var live = active(r, "mouse");
        var gx = live ? target.x : 0, gy = live ? target.y : 0;
        var ease = r.mfx && r.mfx.speed ? clamp(r.mfx.speed / 100, 0.02, 1) : 0.18;
        r.cur.x += (gx - r.cur.x) * ease; r.cur.y += (gy - r.cur.y) * ease;
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

    var hasScroll = records.some(function (r) { return r.scroll || r.sfx; }), hasMouse = records.some(function (r) { return r.mouse || r.mfx; });
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
      if (!win.document.querySelector("[data-kw-scroll], [data-kw-mouse], [data-kw-sfx], [data-kw-mfx]")) return;
      win.kwEffectsInstance = create(win);
      win.addEventListener("pagehide", function () { if (win.kwEffectsInstance) win.kwEffectsInstance.destroy(); });
    };
    if (win.document.readyState === "loading") win.document.addEventListener("DOMContentLoaded", start); else start();
  }

  return { breakpointOf: breakpointOf, progressOf: progressOf, scrollValues: scrollValues, mouseValues: mouseValues, fxProgress: fxProgress, sfxValues: sfxValues, mfxValues: mfxValues, composeRotations: composeRotations, create: create, autostart: autostart };
});
