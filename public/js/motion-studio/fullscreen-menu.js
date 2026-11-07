// Motion Studio (lot S) — module « fullscreen-menu » : menu plein écran animé.
// Le serveur écrit la liste de liens (affichée telle quelle sans JavaScript). Ce module montre le bouton d'ouverture, transforme la liste en panneau plein écran
// (rôle « dialog », aria-modal), l'ouvre avec l'effet choisi (fondu, descente, glissement, cercle) et fait arriver les liens en cascade.
// Accessibilité : Échap ferme, Tab / Maj+Tab restent dans le panneau (focus piégé), le focus revient au bouton, défilement de la page bloqué pendant l'ouverture,
// aria-expanded sur le bouton. Mouvement réduit : mêmes ouverture / fermeture, instantanées. Éditeur : liste affichée (le panneau se teste sur la page publiée).
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("fullscreen-menu", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  // Images-clés d'ouverture du panneau ; (x, y) = centre du bouton pour l'effet « cercle »
  function panelFrames(preset, x, y) {
    if (preset === "fade") return [{ opacity: 0 }, { opacity: 1 }];
    if (preset === "slide-right") return [{ transform: "translateX(-100%)" }, { transform: NONE }];
    if (preset === "circle") return [{ clipPath: "circle(0px at " + x + "px " + y + "px)" }, { clipPath: "circle(150vmax at " + x + "px " + y + "px)" }];
    return [{ transform: "translateY(-100%)" }, { transform: NONE }];
  }
  var FOCUSABLE = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

  function init(ctx) {
    var el = ctx.el, win = ctx.win, doc = ctx.doc, cfg = ctx.cfg;
    if (ctx.mode === "editor") return {};
    var toggle = el.querySelector(".kw-ms-fm-toggle"), panel = el.querySelector("[data-ms-panel]"), closeBtn = el.querySelector(".kw-ms-fm-close");
    var items = Array.prototype.slice.call(el.querySelectorAll(".kw-ms-fm-item"));
    if (!toggle || !panel || !closeBtn || !items.length) return {};
    var easing = win.KWMS && win.KWMS.easingCss ? win.KWMS.easingCss(cfg.easing) : "ease", canAnimate = !ctx.reduced && typeof panel.animate === "function";
    var open = false, anims = [], html = doc.documentElement;
    toggle.hidden = false; closeBtn.hidden = false;
    toggle.setAttribute("aria-haspopup", "dialog");
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", panel.getAttribute("data-ms-label") || "Menu");
    el.classList.add("kw-ms-live");

    var cancelAnims = function () { anims.splice(0).forEach(function (a) { try { a.cancel(); } catch (e) { /* déjà retirée */ } }); };
    function openMenu() {
      if (open) return;
      open = true; cancelAnims();
      el.classList.add("is-open"); html.classList.add("kw-ms-lock"); toggle.setAttribute("aria-expanded", "true");
      if (canAnimate) {
        var r = toggle.getBoundingClientRect();
        anims.push(panel.animate(panelFrames(cfg.preset, Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)), { duration: cfg.duration, delay: cfg.delay, easing: easing, fill: "backwards" }));
        items.forEach(function (li, i) { anims.push(li.animate([{ opacity: 0, transform: "translateY(36px)" }, { opacity: 1, transform: NONE }], { duration: cfg.duration, delay: cfg.delay + Math.round(cfg.duration * 0.35) + i * cfg.stagger, easing: easing, fill: "backwards" })); });
      }
      closeBtn.focus();
    }
    function closeMenu(restoreFocus) {
      if (!open) return;
      open = false; cancelAnims();
      var finish = function () { if (open) return; el.classList.remove("is-open"); html.classList.remove("kw-ms-lock"); cancelAnims(); };
      toggle.setAttribute("aria-expanded", "false");
      if (canAnimate && el.isConnected) {
        var r = toggle.getBoundingClientRect(), a = panel.animate(panelFrames(cfg.preset, Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)).reverse(), { duration: Math.round(cfg.duration * 0.7), easing: easing, fill: "forwards" });
        anims.push(a); a.onfinish = finish; a.oncancel = function () { /* rouvert pendant la fermeture */ };
      } else finish();
      if (restoreFocus !== false) toggle.focus();
    }
    var onToggle = function () { if (open) closeMenu(); else openMenu(); };
    var onClose = function () { closeMenu(); };
    var onKey = function (e) {
      if (!open) return;
      if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
      if (e.key !== "Tab") return;
      var f = Array.prototype.filter.call(panel.querySelectorAll(FOCUSABLE), function (x) { return x.offsetParent !== null || x === doc.activeElement; });
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1], act = doc.activeElement;
      if (!panel.contains(act)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && act === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
    };
    var onLink = function (e) { if (e.target && e.target.closest && e.target.closest("a[href]")) closeMenu(false); };
    toggle.addEventListener("click", onToggle); closeBtn.addEventListener("click", onClose);
    doc.addEventListener("keydown", onKey, true); panel.addEventListener("click", onLink);
    ctx.onCleanup(function () {
      toggle.removeEventListener("click", onToggle); closeBtn.removeEventListener("click", onClose);
      doc.removeEventListener("keydown", onKey, true); panel.removeEventListener("click", onLink);
      cancelAnims(); open = false;
      el.classList.remove("is-open", "kw-ms-live"); html.classList.remove("kw-ms-lock");
      toggle.hidden = true; closeBtn.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.removeAttribute("aria-haspopup");
      panel.removeAttribute("role"); panel.removeAttribute("aria-modal"); panel.removeAttribute("aria-label");
    });
    return {};
  }
  return { panelFrames: panelFrames, init: init };
});
