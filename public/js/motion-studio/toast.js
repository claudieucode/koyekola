// Motion Studio : module « toast » (notification animée). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
// Sans JavaScript (et dans l'éditeur) le message reste affiché en place. Ici : le message statique est retiré de la page, puis la vraie notification flottante est créée
// dans une zone aria-live (role=status, role=alert pour une erreur), à la position choisie, au clic sur un bouton (créé ici), après un délai ou au chargement.
// Fermable (bouton Fermer ; Échap), disparition automatique en pause pendant le survol et le focus. Mouvement réduit : apparition et disparition sans animation.
// destroy() ferme la notification et restitue le message statique.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("toast", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  var PLACES = ["bottom-right", "bottom-left", "bottom-center", "top-right", "top-left", "top-center"];
  // Images-clés d'entrée selon l'effet et la moitié de l'écran (le haut glisse vers le bas)
  function frames(preset, place) {
    var top = /^top/.test(place), side = /left$/.test(place) ? -1 : /right$/.test(place) ? 1 : 0;
    if (preset === "fade") return [{ opacity: 0 }, { opacity: 1 }];
    if (preset === "pop") return [{ opacity: 0, transform: "scale(.85)" }, { opacity: 1, transform: NONE }];
    return [{ opacity: 0, transform: side ? "translateX(" + 32 * side + "px)" : "translateY(" + (top ? -24 : 24) + "px)" }, { opacity: 1, transform: NONE }];
  }
  function init(ctx) {
    var el = ctx.el, doc = ctx.doc, win = ctx.win;
    var stat = el.querySelector(".kw-ms-toast-static");
    if (!stat || ctx.mode === "editor") return {};
    var launch = el.getAttribute("data-kw-ms-launch") || "click", after = Math.max(1, Number(el.getAttribute("data-kw-ms-after")) || 5);
    var hide = Math.max(0, Number(el.getAttribute("data-kw-ms-hide")) || 0), place = PLACES.indexOf(el.getAttribute("data-kw-ms-place")) >= 0 ? el.getAttribute("data-kw-ms-place") : "bottom-right";
    var title = (stat.querySelector(".kw-ms-toast-title") || {}).textContent || "", msg = (stat.querySelector(".kw-ms-toast-msg") || {}).textContent || "";
    var tone = (stat.className.match(/kw-ms-tone-([a-z]+)/) || [])[1] || "info", isErr = tone === "error";
    var button = null, region = null, toast = null, timer = 0, startTimer = 0, remaining = 0, startedAt = 0, closing = null, destroyed = false;
    stat.hidden = true;

    function ensureRegion() {
      if (region && region.isConnected) return region;
      region = doc.createElement("div"); region.className = "kw-ms-toast-region kw-ms-d is-" + place;
      region.setAttribute("aria-live", isErr ? "assertive" : "polite"); region.setAttribute("aria-atomic", "false");
      doc.body.appendChild(region); return region;
    }
    function clear() { win.clearTimeout(timer); timer = 0; }
    function arm(ms) { clear(); if (!ms) return; remaining = ms; startedAt = Date.now(); timer = win.setTimeout(function () { close(); }, ms); }
    function close(instant) {
      if (!toast || closing) return;
      clear();
      var t = toast, done = function () { if (t.parentNode) t.parentNode.removeChild(t); if (toast === t) toast = null; closing = null; if (button && !destroyed) button.disabled = false; };
      if (instant || ctx.reduced || typeof t.animate !== "function") { done(); return; }
      var f = frames(ctx.cfg.preset, place).slice().reverse();
      closing = t.animate(f, { duration: Math.max(120, ctx.cfg.duration * 0.7), easing: "ease-in", fill: "forwards" });
      closing.onfinish = done; closing.oncancel = done;
    }
    function show() {
      if (destroyed) return;
      if (toast) { arm(hide * 1000); return; } // déjà visible : on prolonge seulement
      var r = ensureRegion(); toast = doc.createElement("div");
      toast.className = "kw-ms-toast kw-ms-tone-" + tone; toast.setAttribute("role", isErr ? "alert" : "status");
      var tx = doc.createElement("div"); tx.className = "kw-ms-toast-text";
      if (title) { var s = doc.createElement("strong"); s.className = "kw-ms-toast-title"; s.textContent = title; tx.appendChild(s); }
      var m = doc.createElement("span"); m.className = "kw-ms-toast-msg"; m.textContent = msg; tx.appendChild(m);
      var x = doc.createElement("button"); x.type = "button"; x.className = "kw-ms-toast-close"; x.setAttribute("aria-label", "Fermer la notification"); x.textContent = "×";
      x.addEventListener("click", function () { close(); });
      toast.appendChild(tx); toast.appendChild(x);
      toast.addEventListener("mouseenter", function () { if (timer) { clear(); remaining -= Date.now() - startedAt; } });
      toast.addEventListener("mouseleave", function () { if (hide && !timer && !closing) arm(Math.max(1500, remaining)); });
      toast.addEventListener("focusin", function () { if (timer) { clear(); remaining -= Date.now() - startedAt; } });
      toast.addEventListener("focusout", function () { if (hide && !timer && !closing && toast && !toast.contains(doc.activeElement)) arm(Math.max(1500, remaining)); });
      r.appendChild(toast);
      if (button) button.disabled = false;
      if (!ctx.reduced && typeof toast.animate === "function") toast.animate(frames(ctx.cfg.preset, place), { duration: ctx.cfg.duration, easing: win.KWMS && win.KWMS.easingCss ? win.KWMS.easingCss(ctx.cfg.easing) : "ease-out" });
      arm(hide * 1000);
    }
    var onKey = function (e) { if (e.key === "Escape" && toast) close(); };
    doc.addEventListener("keydown", onKey);

    if (launch === "click") {
      button = doc.createElement("button"); button.type = "button"; button.className = "kw-button kw-btn-primary kw-ms-toast-btn";
      button.textContent = el.getAttribute("data-kw-ms-btn") || "Afficher la notification"; button.addEventListener("click", show);
      el.insertBefore(button, stat);
    } else if (launch === "delay") startTimer = win.setTimeout(show, after * 1000);
    else if (doc.readyState === "complete") startTimer = win.setTimeout(show, 50);
    else win.addEventListener("load", function () { startTimer = win.setTimeout(show, 50); }, { once: true });

    return {
      show: show, close: close,
      destroy: function () {
        destroyed = true; win.clearTimeout(startTimer); clear(); doc.removeEventListener("keydown", onKey);
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
        if (region && region.parentNode) region.parentNode.removeChild(region);
        if (button && button.parentNode) button.parentNode.removeChild(button);
        stat.hidden = false;
      },
    };
  }
  return { frames: frames, PLACES: PLACES, init: init };
});
