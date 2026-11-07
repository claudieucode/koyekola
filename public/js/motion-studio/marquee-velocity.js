// Motion Studio, lot « t » — module « marquee-velocity » : bande de textes dont la vitesse suit celle du défilement de la page.
// Vitesse de base constante (px/s) + un supplément proportionnel à la vitesse de défilement ; le sens peut s'inverser quand on remonte ; légère inclinaison.
// Seul `transform` bouge (une boucle requestAnimationFrame par bande, arrêtée hors écran, au survol / au focus et par le bouton « Pause »).
// Sans JavaScript ou en mouvement réduit : les textes sont écrits en liste qui passe à la ligne (rien ne défile, rien ne déborde).
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("marquee-velocity", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var num = function (v, d) { return typeof v === "number" && isFinite(v) ? v : d; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  // Vitesse instantanée (px/s) = base + |vitesse de défilement| × facteur / 10 (la vitesse de défilement est plafonnée à 3000 px/s)
  function speedOf(base, scrollVel, factor) { return base + Math.min(Math.abs(scrollVel), 3000) * Math.max(0, factor) / 10; }
  // Sens effectif : +1 vers la droite, -1 vers la gauche ; on remonte la page (vitesse < -30 px/s) → sens inversé si demandé
  function directionOf(dir, scrollVel, reverseOnUp) { return reverseOnUp && scrollVel < -30 ? -dir : dir; }
  // Position bouclée dans ]-largeur, 0] (largeur d'un groupe)
  function wrap(x, w) { if (!(w > 0)) return 0; var r = x % w; return r > 0 ? r - w : (r || 0); }
  function skewOf(scrollVel) { return clamp(scrollVel / 200, -8, 8); }

  function init(ctx) {
    if (ctx.reduced) return {};
    var el = ctx.el, doc = ctx.doc, win = ctx.win, P = ctx.cfg.params;
    var list = el.querySelector(".kw-ms-mvel-list");
    if (!list) return {};
    var saved = []; while (el.firstChild) saved.push(el.removeChild(el.firstChild));
    var restore = function () {
      el.classList.remove("kw-ms-mvel-live");
      while (el.firstChild) el.removeChild(el.firstChild);
      saved.forEach(function (n) { el.appendChild(n); });
    };
    var view = doc.createElement("div"); view.className = "kw-ms-mvel-view";
    var track = doc.createElement("div"); track.className = "kw-ms-mvel-track";
    var g1 = doc.createElement("div"); g1.className = "kw-ms-mvel-group"; g1.appendChild(list);
    track.appendChild(g1); view.appendChild(track); el.appendChild(view);
    el.classList.add("kw-ms-mvel-live");

    var gw = g1.getBoundingClientRect().width, vw = view.getBoundingClientRect().width;
    if (!(gw > 0)) { restore(); return {}; }
    var copies = clamp(Math.ceil(vw / gw) + 1, 2, 12);
    for (var k = 1; k < copies; k++) {
      var c = g1.cloneNode(true); c.setAttribute("aria-hidden", "true");
      [].forEach.call(c.querySelectorAll("a, button, [tabindex]"), function (f) { f.setAttribute("tabindex", "-1"); });
      track.appendChild(c);
    }

    var base = clamp(num(P.speed, 60), 5, 600), factor = clamp(num(P.velocity, 3), 0, 10), dir = P.direction === "right" ? 1 : -1;
    var reverse = P.reverse !== false, skew = P.skew !== false, pauseHover = P.pauseHover !== false;
    var x = 0, vel = 0, lastY = win.pageYOffset || 0, lastT = 0, raf = 0, running = false, inView = true, hover = false, userPaused = false, io = null;
    var write = function (sk) { track.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)" + (skew && Math.abs(sk) > 0.05 ? " skewX(" + (-sk).toFixed(2) + "deg)" : ""); };
    var idle = function () { return !running || !inView || hover || userPaused; };
    function tick(t) {
      raf = 0;
      if (idle()) { lastT = 0; return; }
      var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016; lastT = t;
      var y = win.pageYOffset || 0, raw = (y - lastY) / Math.max(dt, 0.001); lastY = y;
      vel += (raw - vel) * Math.min(1, dt * 8);
      x = wrap(x + directionOf(dir, vel, reverse) * speedOf(base, vel, factor) * dt, gw);
      write(vel);
      raf = win.requestAnimationFrame(tick);
    }
    var kick = function () { if (!raf && !idle()) raf = win.requestAnimationFrame(tick); };
    var start = function () { running = true; lastY = win.pageYOffset || 0; kick(); };
    var stop = function () { running = false; if (raf) win.cancelAnimationFrame(raf); raf = 0; lastT = 0; };
    if (win.IntersectionObserver) { io = new win.IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; kick(); }); }); io.observe(el); }
    var on = function (type, fn) { el.addEventListener(type, fn); ctx.onCleanup(function () { el.removeEventListener(type, fn); }); };
    if (pauseHover) { on("mouseenter", function () { hover = true; }); on("mouseleave", function () { hover = false; kick(); }); on("focusin", function () { hover = true; }); on("focusout", function () { hover = false; kick(); }); }
    ctx.onCleanup(function () { stop(); if (io) io.disconnect(); });
    ctx.onResize(function () { ctx.rebuild(); });

    // Page publiée : la bande tourne dès qu'elle est prête (le déclencheur du runtime la relance sans effet). Éditeur : à la demande (lire / pause / arrêter).
    if (ctx.mode === "public") {
      start();
      var b = doc.createElement("button"); b.type = "button"; b.className = "kw-ms-tpause"; b.textContent = "Mettre en pause le défilement"; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { userPaused = !userPaused; b.setAttribute("aria-pressed", userPaused ? "true" : "false"); b.textContent = userPaused ? "Reprendre le défilement" : "Mettre en pause le défilement"; kick(); });
      if (el.parentNode) el.parentNode.insertBefore(b, el.nextSibling);
      ctx.onCleanup(function () { if (b.parentNode) b.parentNode.removeChild(b); });
    }
    return {
      play: function () { userPaused = false; start(); },
      pause: function () { userPaused = true; },
      stop: function () { stop(); x = 0; track.style.transform = ""; },
      destroy: restore,
    };
  }
  return { speedOf: speedOf, directionOf: directionOf, wrap: wrap, skewOf: skewOf, init: init };
});
