// KOLAKISA — Motion Studio, lot 3 : défilement fluide OPTIONNEL (réglage de la page, désactivé par défaut). Implémentation maison, sans bibliothèque.
//
// Principe : la molette (et seulement elle) est lissée. Le défilement reste le VRAI défilement du navigateur (window.scrollTo) : `position: sticky`, la barre de
// défilement, le clavier, le tactile et les ancres natives continuent de fonctionner. Si la position change par un autre moyen (barre, clavier, saut d'ancre,
// retour arrière), le lissage s'aligne sur la nouvelle position au lieu de lutter contre elle.
//  - jamais actif en mouvement réduit (le runtime ne le lance pas, et une bascule en cours de visite l'arrête) ;
//  - laisse la main aux zones qui défilent seules (liste, textarea, carte…), au zoom (Ctrl + molette), au défilement horizontal, à une page verrouillée (fenêtre ouverte) ;
//  - ancres de la même page (#section) : défilement animé en tenant compte de scroll-padding-top / scroll-margin-top (en-tête collant), adresse et focus mis à jour.
// UMD : fonctions pures testables sous Node.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.KWMSSmooth = api; if (root.KWMS && root.KWMS.register) root.KWMS.register("smooth-scroll", function () { return api; }); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  // Intensité 1 (très douce, rapide) à 10 (très lente, très fluide) → part du chemin restant parcourue par image à 60 images / s
  var strengthK = function (n) { n = clamp(Math.round(Number(n) || 5), 1, 10); return 0.34 - (n - 1) * 0.03; }; // 0.34 … 0.07
  // Un pas de lissage indépendant de la fréquence d'écran : dt en ms
  function lerpStep(cur, target, dt, k) {
    var f = 1 - Math.pow(1 - k, clamp(dt, 1, 64) / 16.667);
    var next = cur + (target - cur) * f;
    return Math.abs(target - next) < 0.5 ? target : next;
  }
  // Variation de défilement demandée par un événement molette, en pixels
  function wheelPixels(e, viewport) { return e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * viewport : e.deltaY; }
  // Position d'arrivée d'une ancre : haut de l'élément moins le décalage réservé (scroll-padding-top de la page + scroll-margin-top de l'élément)
  function anchorTop(rectTop, scrollY, padding, margin, max) { return clamp(Math.round(rectTop + scrollY - padding - margin), 0, Math.max(0, max)); }

  function create(win, cfg) {
    cfg = cfg || {};
    var doc = win.document, root = doc.documentElement, k = strengthK(cfg.strength), anchors = cfg.anchors !== false;
    var target = win.scrollY, cur = win.scrollY, raf = 0, last = 0, dead = false, pending = null;
    var maxY = function () { return Math.max(0, root.scrollHeight - win.innerHeight); };
    var rAF = function (fn) { return win.requestAnimationFrame(fn); };

    function done() {
      raf = 0;
      if (pending) { var p = pending; pending = null; try { if (p.hash) win.history.pushState(null, "", p.hash); p.el.setAttribute("tabindex", p.el.getAttribute("tabindex") === null ? "-1" : p.el.getAttribute("tabindex")); p.el.focus({ preventScroll: true }); } catch (e) { /* adresse ou focus non modifiables */ } }
    }
    function tick(t) {
      if (dead) { raf = 0; return; }
      var dt = last ? t - last : 16.667; last = t;
      cur = lerpStep(cur, target, dt, k);
      win.scrollTo({ top: cur, left: win.scrollX, behavior: "instant" }); // explicitement instantané : un `scroll-behavior: smooth` du site ne doit pas se cumuler
      if (cur === target) { last = 0; done(); return; }
      raf = rAF(tick);
    }
    var kick = function () { if (!raf && !dead) { last = 0; raf = rAF(tick); } };

    // Zone qui défile d'elle-même sous le pointeur (et peut encore défiler dans ce sens) : on ne la dérange pas
    function scrollableUnder(el, dy) {
      for (var n = el; n && n !== doc.body && n !== root && n.nodeType === 1; n = n.parentElement) {
        var oy = win.getComputedStyle(n).overflowY;
        if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1) {
          if ((dy < 0 && n.scrollTop > 0) || (dy > 0 && n.scrollTop + n.clientHeight < n.scrollHeight - 1)) return true;
        }
      }
      return false;
    }
    function onWheel(e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || !e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (win.getComputedStyle(root).overflowY === "hidden" || win.getComputedStyle(doc.body).overflowY === "hidden") return; // page verrouillée (fenêtre ouverte)
      if (scrollableUnder(e.target, e.deltaY)) return;
      var dy = wheelPixels(e, win.innerHeight);
      if ((dy < 0 && target <= 0 && cur <= 0) || (dy > 0 && target >= maxY() && cur >= maxY())) return; // en butée : le navigateur peut enchaîner (chaînage de défilement)
      e.preventDefault();
      pending = null;
      target = clamp(target + dy, 0, maxY());
      kick();
    }
    // Position changée par autre chose que nous (barre de défilement, clavier, saut d'ancre, retour arrière) : on s'aligne
    function onScroll() {
      if (Math.abs(win.scrollY - cur) > 2) { cur = target = win.scrollY; if (raf) { win.cancelAnimationFrame(raf); raf = 0; } pending = null; }
    }
    function onClick(e) {
      if (!anchors || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || a.target && a.target !== "_self" || a.hasAttribute("download")) return;
      var href = a.getAttribute("href") || "";
      if (href.charAt(0) !== "#" || href.length < 2) return;
      var id; try { id = decodeURIComponent(href.slice(1)); } catch (x) { return; }
      var el = doc.getElementById(id);
      if (!el) return;
      e.preventDefault();
      var cs = win.getComputedStyle(root), pad = parseFloat(cs.scrollPaddingTop) || 0, mar = parseFloat(win.getComputedStyle(el).scrollMarginTop) || 0;
      cur = win.scrollY; // départ = position réelle
      target = anchorTop(el.getBoundingClientRect().top, win.scrollY, pad, mar, maxY());
      pending = { el: el, hash: href };
      if (target === cur) done(); else kick();
    }
    var onResize = function () { target = clamp(target, 0, maxY()); };
    win.addEventListener("wheel", onWheel, { passive: false });
    win.addEventListener("scroll", onScroll, { passive: true });
    win.addEventListener("resize", onResize);
    doc.addEventListener("click", onClick);
    root.setAttribute("data-kw-smooth", "on");
    return {
      destroy: function () {
        dead = true; if (raf) win.cancelAnimationFrame(raf); raf = 0;
        win.removeEventListener("wheel", onWheel, { passive: false }); win.removeEventListener("scroll", onScroll); win.removeEventListener("resize", onResize); doc.removeEventListener("click", onClick);
        root.removeAttribute("data-kw-smooth");
      },
      target: function () { return target; },
    };
  }

  return { strengthK: strengthK, lerpStep: lerpStep, wheelPixels: wheelPixels, anchorTop: anchorTop, create: create };
});
