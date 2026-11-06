// Motion Studio : module « switch » (interrupteurs et cases animés). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
// Les vraies cases <input type="checkbox"> et leur animation CSS sont écrites par le serveur (elles marchent sans ce module). Ce module : règle la vitesse et la courbe
// (variables CSS --ms-dur / --ms-ease, effet « Doux / Rebond / Sec »), émet l'événement « kwms:change » à chaque changement et, si demandé, mémorise les choix
// sur l'appareil du visiteur (localStorage, jamais envoyé nulle part ; sans stockage disponible, tout marche sans mémoire).
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("switch", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var key = function (el, win) { var m = /kw-n-([a-z0-9]+)/.exec(el.className || ""); return m ? "kwms-sw:" + (win.location ? win.location.pathname : "") + ":" + m[1] : null; };
  function timing(cfg, KW) {
    var d = cfg.duration, ease = KW && KW.easingCss ? KW.easingCss(cfg.easing) : "ease";
    if (cfg.preset === "spring") return { dur: d, ease: KW && KW.easingCss ? KW.easingCss("spring") : ease };
    if (cfg.preset === "snap") return { dur: Math.max(50, Math.round(d / 2)), ease: "ease-out" };
    return { dur: d, ease: ease };
  }
  function init(ctx) {
    var el = ctx.el, win = ctx.win;
    var inputs = Array.prototype.slice.call(el.querySelectorAll(".kw-ms-sw-input"));
    var t = timing(ctx.cfg, win.KWMS);
    el.style.setProperty("--ms-dur", (ctx.reduced ? 0 : t.dur) + "ms"); el.style.setProperty("--ms-ease", t.ease);
    var k = ctx.mode === "editor" ? null : key(el, win), store = null;
    if (k) { try { store = win.localStorage; store.getItem(k); } catch (e) { store = null; } }
    var remember = el.hasAttribute("data-kw-ms-remember");
    if (store && remember) {
      try { var saved = JSON.parse(store.getItem(k) || "null"); if (Array.isArray(saved)) inputs.forEach(function (i, n) { if (typeof saved[n] === "boolean") i.checked = saved[n]; }); } catch (e) { /* mémoire illisible : choix d'origine */ }
    }
    var onChange = function (e) {
      var i = inputs.indexOf(e.target); if (i < 0) return;
      if (store && remember) { try { store.setItem(k, JSON.stringify(inputs.map(function (x) { return x.checked; }))); } catch (x) { /* stockage plein ou refusé */ } }
      var lab = e.target.closest ? e.target.closest("label") : null, l = lab ? lab.querySelector(".kw-ms-sw-label") : null, ev;
      try { ev = new win.CustomEvent("kwms:change", { bubbles: true, detail: { index: i, checked: e.target.checked, label: l ? l.textContent : "" } }); } catch (x) { ev = null; }
      if (ev) el.dispatchEvent(ev);
    };
    el.addEventListener("change", onChange);
    return { destroy: function () { el.removeEventListener("change", onChange); el.style.removeProperty("--ms-dur"); el.style.removeProperty("--ms-ease"); } };
  }
  return { timing: timing, key: key, init: init };
});
