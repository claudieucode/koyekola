// Motion Studio : module « tabs » (onglets avec transition). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
// Le serveur écrit tous les panneaux (titre + texte) : sans JavaScript on lit tout. Ce module construit le motif ARIA des onglets (tablist / tab / tabpanel, flèches, Début, Fin,
// roving tabindex, activation au focus), un indicateur qui glisse (transform) et la transition du panneau (opacity / transform). Il est FONCTIONNEL même en mouvement réduit
// (alors sans animation). destroy() restitue les panneaux d'origine.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("tabs", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  var PRESETS = {
    fade: function () { return [{ opacity: 0 }, { opacity: 1 }]; },
    slide: function (dir) { return [{ opacity: 0, transform: "translateX(" + 24 * dir + "px)" }, { opacity: 1, transform: NONE }]; },
    rise: function () { return [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: NONE }]; },
    scale: function () { return [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: NONE }]; },
  };
  // Onglet voisin selon la touche (null si la touche n'est pas gérée)
  function nextIndex(key, i, n, vertical) {
    var prev = vertical ? "ArrowUp" : "ArrowLeft", next = vertical ? "ArrowDown" : "ArrowRight";
    if (key === next) return (i + 1) % n;
    if (key === prev) return (i - 1 + n) % n;
    if (key === "Home") return 0;
    if (key === "End") return n - 1;
    return null;
  }
  function init(ctx) {
    var el = ctx.el, doc = ctx.doc;
    var wrap = el.querySelector(".kw-ms-tabs-panels");
    var panels = wrap ? Array.prototype.slice.call(wrap.querySelectorAll(".kw-ms-tabs-panel")) : [];
    if (panels.length < 2) return {};
    var vertical = el.classList.contains("is-vertical"), uid = "kwt" + Math.random().toString(36).slice(2, 8);
    var list = doc.createElement("div"); list.className = "kw-ms-tabs-list"; list.setAttribute("role", "tablist"); list.setAttribute("aria-label", el.getAttribute("data-kw-ms-label") || "Onglets");
    if (vertical) list.setAttribute("aria-orientation", "vertical");
    var ind = doc.createElement("span"); ind.className = "kw-ms-tabs-ind"; ind.setAttribute("aria-hidden", "true"); list.appendChild(ind);
    var tabs = panels.map(function (pn, i) {
      var h = pn.querySelector(".kw-ms-tabs-title"), b = doc.createElement("button");
      b.type = "button"; b.className = "kw-ms-tabs-tab"; b.id = uid + "-t" + i; b.setAttribute("role", "tab"); b.setAttribute("aria-controls", uid + "-p" + i); b.textContent = h ? h.textContent : "Onglet " + (i + 1);
      list.appendChild(b);
      pn.id = uid + "-p"; pn.id = uid + "-p" + i; pn.setAttribute("role", "tabpanel"); pn.setAttribute("aria-labelledby", b.id); pn.setAttribute("tabindex", "0");
      if (h) h.hidden = true;
      return b;
    });
    el.insertBefore(list, wrap); el.classList.add("is-ready");
    var cur = -1, anim = null, animate = !ctx.reduced && typeof panels[0].animate === "function";
    var place = function (i, tween) {
      var t = tabs[i]; if (!t || !ind) return;
      var to = vertical ? "translateY(" + t.offsetTop + "px) scaleY(" + t.offsetHeight + ")" : "translateX(" + t.offsetLeft + "px) scaleX(" + t.offsetWidth + ")";
      if (tween && animate && ind.style.transform) ind.animate([{ transform: ind.style.transform }, { transform: to }], { duration: Math.min(400, ctx.cfg.duration + 80), easing: "cubic-bezier(.2,.7,.2,1)" });
      ind.style.transform = to;
    };
    function select(i, opts) {
      opts = opts || {};
      if (i === cur || !panels[i]) return;
      var dir = cur < 0 || i > cur ? 1 : -1, old = cur; cur = i;
      tabs.forEach(function (t, k) { t.setAttribute("aria-selected", k === i ? "true" : "false"); t.tabIndex = k === i ? 0 : -1; panels[k].hidden = k !== i; });
      place(i, old >= 0);
      if (opts.focus) tabs[i].focus();
      if (animate && old >= 0) {
        if (anim) anim.cancel();
        var mk = PRESETS[ctx.cfg.preset] || PRESETS.slide;
        anim = panels[i].animate(mk(vertical ? dir : dir), { duration: ctx.cfg.duration, easing: ctx.win.KWMS && ctx.win.KWMS.easingCss ? ctx.win.KWMS.easingCss(ctx.cfg.easing) : "ease-out" });
        anim.onfinish = function () { anim = null; };
      }
    }
    var onClick = function (e) { var k = tabs.indexOf(e.currentTarget); if (k >= 0) select(k); };
    var onKey = function (e) {
      var k = tabs.indexOf(e.currentTarget), nx = nextIndex(e.key, k, tabs.length, vertical);
      if (nx === null) return;
      e.preventDefault(); select(nx, { focus: true });
    };
    tabs.forEach(function (t) { t.addEventListener("click", onClick); t.addEventListener("keydown", onKey); });
    select(Math.max(0, Math.min(panels.length - 1, (Number(el.getAttribute("data-kw-ms-start")) || 1) - 1)));
    var onWin = function () { place(cur, false); };
    ctx.win.addEventListener("resize", onWin);
    if (doc.fonts && doc.fonts.ready) { var live = true; doc.fonts.ready.then(function () { if (live) place(cur, false); }); ctx.onCleanup(function () { live = false; }); }
    ctx.onCleanup(function () { ctx.win.removeEventListener("resize", onWin); tabs.forEach(function (t) { t.removeEventListener("click", onClick); t.removeEventListener("keydown", onKey); }); });
    return {
      select: select,
      destroy: function () {
        if (anim) anim.cancel();
        if (list.parentNode) list.parentNode.removeChild(list);
        panels.forEach(function (pn) { pn.hidden = false; pn.removeAttribute("role"); pn.removeAttribute("aria-labelledby"); pn.removeAttribute("tabindex"); pn.removeAttribute("id"); var h = pn.querySelector(".kw-ms-tabs-title"); if (h) h.hidden = false; });
        el.classList.remove("is-ready");
      },
    };
  }
  return { PRESETS: PRESETS, nextIndex: nextIndex, init: init };
});
