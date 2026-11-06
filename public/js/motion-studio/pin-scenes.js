// Motion Studio (lot S) — module « pin-scenes » : section épinglée à scènes.
// Le serveur écrit les scènes l'une sous l'autre (lisible sans JavaScript). Ce module ajoute kw-ms-live (CSS : la scène reste collée, `position: sticky`, sur une hauteur
// = 100 % de la fenêtre + durée de défilement × nombre de scènes) puis choisit la scène selon la progression du défilement. Points cliquables (boutons) et barre d'avancement.
// Mouvement réduit, fenêtre très basse : scènes l'une sous l'autre, rien n'est épinglé.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("pin-scenes", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  // Progression (0 à 1) d'une section épinglée : 0 quand son haut touche le haut de la fenêtre, 1 quand son bas touche le bas de la fenêtre
  function pinProgress(top, height, vh) { var span = height - vh; return span > 0 ? clamp(-top / span, 0, 1) : 0; }
  function sceneIndex(p, n) { return clamp(Math.floor(p * n), 0, n - 1); }
  // Hauteur de la section (en % de la fenêtre) : une fenêtre pour la scène collée + `length` % par scène
  var heightPct = function (n, length) { return 100 + n * length; };

  function init(ctx) {
    var el = ctx.el, win = ctx.win, doc = ctx.doc, cfg = ctx.cfg, prm = cfg.params || {};
    if (ctx.reduced) return {};
    var scenes = Array.prototype.slice.call(el.querySelectorAll("[data-ms-scene]")), n = scenes.length;
    var stage = el.querySelector(".kw-ms-pn-stage");
    if (n < 2 || !stage || (win.innerHeight || 0) < 440) return {};
    var length = clamp(Number(prm.length) || 100, 40, 300);
    el.style.setProperty("--kw-ms-pn-h", heightPct(n, length) + "vh");
    el.style.setProperty("--kw-ms-dur", cfg.duration + "ms");
    el.style.setProperty("--kw-ms-ease", win.KWMS && win.KWMS.easingCss ? win.KWMS.easingCss(cfg.easing) : "ease");
    el.setAttribute("data-kw-ms-scene", cfg.preset || "fade");
    el.classList.add("kw-ms-live");

    var nav = null, dots = [], fill = null, bar = null;
    if (el.classList.contains("has-nav")) {
      nav = doc.createElement("nav"); nav.className = "kw-ms-pn-nav"; nav.setAttribute("aria-label", "Scènes");
      scenes.forEach(function (s, i) {
        var t = s.querySelector(".kw-ms-pn-title"), b = doc.createElement("button");
        b.type = "button"; b.className = "kw-ms-pn-dot"; b.setAttribute("aria-label", "Scène " + (i + 1) + " sur " + n + (t ? " : " + t.textContent : ""));
        b.addEventListener("click", function () { goTo(i); });
        nav.appendChild(b); dots.push(b);
      });
      bar = doc.createElement("div"); bar.className = "kw-ms-pn-bar"; bar.setAttribute("aria-hidden", "true");
      fill = doc.createElement("span"); fill.className = "kw-ms-pn-fill"; bar.appendChild(fill);
      stage.appendChild(nav); stage.appendChild(bar);
    }
    // Aller à une scène : défilement de la page jusqu'au milieu de la plage de cette scène
    function goTo(i) {
      var r = el.getBoundingClientRect(), vh = win.innerHeight || 1, y = (win.pageYOffset || 0) + r.top + ((i + 0.5) / n) * (r.height - vh);
      win.scrollTo(0, Math.round(y));
    }
    var cur = -1, raf = 0;
    var update = function () {
      raf = 0;
      var r = el.getBoundingClientRect(), p = pinProgress(r.top, r.height, win.innerHeight || 1), i = sceneIndex(p, n);
      if (fill) fill.style.transform = "scaleX(" + p.toFixed(4) + ")";
      if (i === cur) return;
      cur = i;
      scenes.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
      dots.forEach(function (d, k) { if (k === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
    };
    var queue = function () { if (!raf) raf = win.requestAnimationFrame(update); };
    win.addEventListener("scroll", queue, { passive: true }); win.addEventListener("resize", queue);
    update();
    ctx.onCleanup(function () {
      win.removeEventListener("scroll", queue); win.removeEventListener("resize", queue); if (raf) win.cancelAnimationFrame(raf);
      if (nav && nav.parentNode) nav.parentNode.removeChild(nav);
      if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
      el.classList.remove("kw-ms-live"); el.removeAttribute("data-kw-ms-scene");
      ["--kw-ms-pn-h", "--kw-ms-dur", "--kw-ms-ease"].forEach(function (k) { el.style.removeProperty(k); });
      scenes.forEach(function (s, k) { s.classList.toggle("is-active", k === 0); });
    });
    return {};
  }
  return { pinProgress: pinProgress, sceneIndex: sceneIndex, heightPct: heightPct, init: init };
});
