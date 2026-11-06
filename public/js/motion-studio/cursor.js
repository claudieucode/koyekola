// Motion Studio — module « cursor » : curseur personnalisé (point et/ou anneau) qui suit la souris sur toute la page, avec inertie ; grossit sur les liens et boutons.
// Souris seulement : désactivé sur écran tactile (pas de survol), avec « réduire les animations » et dans l'éditeur. Un seul curseur par page.
// Le curseur du système reste visible (sauf si la personne choisit de le masquer). destroy() retire tout ce que le module a ajouté.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("cursor", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var num = function (v, d, a, b) { var n = Number(v); return isFinite(n) && v !== "" && v !== null && v !== undefined ? clamp(n, a, b) : d; };
  var INTERACTIVE = "a[href], button, [role=button], summary, label, select, input, textarea";
  function settings(o) {
    o = o || {};
    return { look: ["dot-ring", "ring", "dot"].indexOf(o.look) >= 0 ? o.look : "dot-ring", size: num(o.size, 36, 16, 96), grow: num(o.grow, 1.6, 1, 3), inertia: num(o.inertia, 70, 0, 90), blend: o.blend === true, hideNative: o.hideNative === true };
  }
  // Part du chemin parcourue à chaque image : 0 d'inertie = suivi immédiat (1) ; jamais moins de 0,06 (le curseur finit toujours par arriver)
  function follow(inertia) { return clamp(1 - inertia / 100, 0.06, 1); }
  function finePointer(win) { return Boolean(win.matchMedia && win.matchMedia("(hover: hover) and (pointer: fine)").matches); }

  function init(ctx) {
    var win = ctx.win, doc = ctx.doc;
    if (ctx.mode === "editor" || ctx.reduced || !finePointer(win) || win.__kwMsCursor) return {};
    var s = settings(ctx.opts), k = follow(s.inertia);
    win.__kwMsCursor = true;
    var root = doc.createElement("div"); root.className = "kw-ms-cursor is-hidden" + (s.blend ? " is-blend" : ""); root.setAttribute("aria-hidden", "true");
    var ring = null, dot = null;
    if (s.look !== "dot") { ring = doc.createElement("span"); ring.className = "kw-ms-cursor-ring"; ring.style.setProperty("--kw-ms-cs", s.size + "px"); root.appendChild(ring); }
    if (s.look !== "ring") { dot = doc.createElement("span"); dot.className = "kw-ms-cursor-dot"; root.appendChild(dot); }
    doc.body.appendChild(root);
    if (s.hideNative) doc.documentElement.classList.add("kw-ms-nocursor");
    var x = 0, y = 0, rx = 0, ry = 0, raf = 0, grown = false, down = false, seen = false;
    var paint = function () {
      raf = 0;
      rx += (x - rx) * k; ry += (y - ry) * k;
      var done = Math.abs(x - rx) < 0.3 && Math.abs(y - ry) < 0.3;
      if (done) { rx = x; ry = y; }
      if (ring) ring.style.transform = "translate3d(" + (rx - s.size / 2) + "px," + (ry - s.size / 2) + "px,0) scale(" + (grown ? s.grow : 1) * (down ? 0.85 : 1) + ")";
      if (dot) dot.style.transform = "translate3d(" + (x - 3) + "px," + (y - 3) + "px,0)";
      if (!done) raf = win.requestAnimationFrame(paint);
    };
    var kick = function () { if (!raf) raf = win.requestAnimationFrame(paint); };
    var move = function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; rx = x; ry = y; root.classList.remove("is-hidden"); }
      var t = e.target && e.target.closest ? e.target.closest(INTERACTIVE) : null;
      var g = Boolean(t); if (g !== grown) { grown = g; root.classList.toggle("is-grown", g); }
      kick();
    };
    var leave = function () { root.classList.add("is-hidden"); seen = false; };
    var press = function (e) { if (e.pointerType && e.pointerType !== "mouse") return; down = true; kick(); };
    var release = function () { down = false; kick(); };
    win.addEventListener("pointermove", move, { passive: true }); win.addEventListener("pointerdown", press, { passive: true }); win.addEventListener("pointerup", release, { passive: true });
    doc.documentElement.addEventListener("pointerleave", leave);
    ctx.onCleanup(function () {
      win.removeEventListener("pointermove", move); win.removeEventListener("pointerdown", press); win.removeEventListener("pointerup", release);
      doc.documentElement.removeEventListener("pointerleave", leave);
      if (raf) win.cancelAnimationFrame(raf);
      if (root.parentNode) root.parentNode.removeChild(root);
      doc.documentElement.classList.remove("kw-ms-nocursor");
      win.__kwMsCursor = false;
    });
    return {};
  }
  return { settings: settings, follow: follow, init: init };
});
