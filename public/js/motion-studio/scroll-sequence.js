// Motion Studio (lot S) — module « scroll-sequence » : séquence d'images au défilement, dessinée sur un canvas.
// Le serveur écrit la PREMIÈRE image (repli sans JavaScript, sans canvas ou en mouvement réduit) et la liste des adresses dans data-kw-ms-opts.
// Chargement différé : seule la première image est chargée au départ ; les autres le sont (3 à la fois) quand la section approche de la fenêtre, et l'image voulue est
// demandée en priorité. Tant qu'une image n'est pas arrivée, la plus proche déjà chargée est affichée. Si la première image échoue, la page garde l'image du serveur.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("scroll-sequence", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  function pinProgress(top, height, vh) { var span = height - vh; return span > 0 ? clamp(-top / span, 0, 1) : 0; }
  function frameAt(p, n) { return n <= 1 ? 0 : clamp(Math.round(p * (n - 1)), 0, n - 1); }
  // Indice chargé le plus proche de i (le plus petit en cas d'égalité) ; -1 si aucun
  function nearestLoaded(loaded, i) {
    for (var d = 0; d < loaded.length; d++) { if (loaded[i - d]) return i - d; if (loaded[i + d]) return i + d; }
    return -1;
  }
  // Rectangle de dessin d'une image iw×ih dans une zone w×h : « contain » (entière) ou « cover » (remplit, rogne)
  function fitRect(iw, ih, w, h, mode) {
    if (!iw || !ih || !w || !h) return { x: 0, y: 0, w: w, h: h };
    var s = mode === "cover" ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
    return { x: (w - iw * s) / 2, y: (h - ih * s) / 2, w: iw * s, h: ih * s };
  }
  var SAFE = /^(\/(?!\/)|https:\/\/)[^\s<>"'`\\]+$/;

  function init(ctx) {
    var el = ctx.el, win = ctx.win, doc = ctx.doc, prm = ctx.cfg.params || {};
    if (ctx.reduced) return {};
    var urls = (Array.isArray(ctx.opts.frames) ? ctx.opts.frames : []).filter(function (u) { return typeof u === "string" && SAFE.test(u); });
    var stage = el.querySelector(".kw-ms-sq-stage"), canvas = el.querySelector(".kw-ms-sq-canvas");
    var n = urls.length, g = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    if (n < 2 || !stage || !g || typeof win.Image !== "function") return {};
    var length = clamp(Number(prm.length) || 300, 100, 800), mode = el.classList.contains("is-cover") ? "cover" : "contain";
    el.style.setProperty("--kw-ms-sq-h", 100 + length + "vh");
    el.classList.add("kw-ms-live");

    var imgs = [], loaded = [], busy = 0, dead = false, started = false, shown = false, lastDrawn = -1, lastKey = "", raf = 0;
    for (var k = 0; k < n; k++) { imgs.push(null); loaded.push(false); }
    function load(i) {
      if (imgs[i] || dead) return;
      var im = new win.Image(); imgs[i] = im; busy++;
      var done = function (ok) { busy--; if (ok) loaded[i] = true; if (i === 0 && ok) update(true); else if (ok && i === want) update(true); pump(); };
      im.onload = function () { done(true); }; im.onerror = function () { done(false); };
      im.decoding = "async"; im.src = urls[i];
    }
    function pump() { if (!started) return; for (var i = 0; i < n && busy < 3; i++) if (!imgs[i]) load(i); }
    var want = 0;
    function draw(i) {
      var im = imgs[i], dpr = Math.min(2, win.devicePixelRatio || 1), w = stage.clientWidth, h = stage.clientHeight;
      if (!im || !w || !h) return;
      var cw = Math.round(w * dpr), ch = Math.round(h * dpr);
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; lastKey = ""; }
      var r = fitRect(im.naturalWidth, im.naturalHeight, cw, ch, mode);
      g.clearRect(0, 0, cw, ch); g.drawImage(im, r.x, r.y, r.w, r.h);
      if (!shown) { shown = true; canvas.hidden = false; el.classList.add("is-canvas"); }
      lastDrawn = i; lastKey = i + "|" + cw + "x" + ch;
    }
    function update(force) {
      raf = 0;
      var r = el.getBoundingClientRect(), p = pinProgress(r.top, r.height, win.innerHeight || 1);
      want = frameAt(p, n);
      if (!loaded[want]) load(want);
      var use = nearestLoaded(loaded, want);
      if (use < 0) return; // rien de chargé : l'image du serveur reste affichée
      var key = use + "|" + Math.round(stage.clientWidth * Math.min(2, win.devicePixelRatio || 1)) + "x" + Math.round(stage.clientHeight * Math.min(2, win.devicePixelRatio || 1));
      if (force || key !== lastKey) draw(use);
    }
    var queue = function () { if (!raf) raf = win.requestAnimationFrame(function () { update(false); }); };
    win.addEventListener("scroll", queue, { passive: true }); win.addEventListener("resize", queue);
    load(0);
    // Chargement différé : le reste de la séquence seulement quand la section approche (deux fenêtres avant / après)
    var io = null, start = function () { if (started) return; started = true; pump(); };
    if (win.IntersectionObserver) { io = new win.IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { start(); io.disconnect(); } }, { rootMargin: "200% 0px 200% 0px" }); io.observe(el); }
    else start();
    ctx.onCleanup(function () {
      dead = true; win.removeEventListener("scroll", queue); win.removeEventListener("resize", queue); if (raf) win.cancelAnimationFrame(raf); if (io) io.disconnect();
      imgs.forEach(function (im) { if (im) { im.onload = im.onerror = null; } });
      canvas.hidden = true; el.classList.remove("kw-ms-live", "is-canvas"); el.style.removeProperty("--kw-ms-sq-h");
    });
    return {};
  }
  return { pinProgress: pinProgress, frameAt: frameAt, nearestLoaded: nearestLoaded, fitRect: fitRect, init: init };
});
