// Motion Studio (lot S) — module « portfolio-grid » : filtres animés d'une grille de projets.
// Le serveur écrit toutes les cartes (et des boutons de filtre cachés). Ce module affiche les filtres et filtre par catégorie : les cartes qui partent disparaissent en
// fondu, puis celles qui restent glissent à leur nouvelle place (technique FLIP : mesure avant / après puis transform) et les nouvelles entrent avec l'effet choisi.
// Mouvement réduit : les filtres fonctionnent, sans animation. Les boutons portent aria-pressed ; une zone « status » annonce le nombre de projets affichés.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("portfolio-grid", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  var ENTER = {
    scale: [{ opacity: 0, transform: "scale(.85)" }, { opacity: 1, transform: NONE }],
    fade: [{ opacity: 0 }, { opacity: 1 }],
    rise: [{ opacity: 0, transform: "translateY(28px)" }, { opacity: 1, transform: NONE }],
  };
  // Cartes visibles pour une catégorie ("" = toutes), dans l'ordre d'origine
  function select(cats, cat) { return cats.map(function (c, i) { return !cat || c === cat ? i : -1; }).filter(function (i) { return i >= 0; }); }
  var count = function (k) { return k + (k > 1 ? " projets affichés" : " projet affiché"); };

  function init(ctx) {
    var el = ctx.el, win = ctx.win, cfg = ctx.cfg;
    var bar = el.querySelector("[data-ms-filters]"), grid = el.querySelector("[data-ms-grid]"), status = el.querySelector("[data-ms-status]");
    var items = Array.prototype.slice.call(el.querySelectorAll("[data-ms-item]")), buttons = bar ? Array.prototype.slice.call(bar.querySelectorAll("[data-ms-filter]")) : [];
    if (!bar || !grid || buttons.length < 2 || items.length < 2) return {};
    var cats = items.map(function (it) { return it.getAttribute("data-ms-cat") || ""; });
    var animate = !ctx.reduced && typeof items[0].animate === "function";
    var easing = win.KWMS && win.KWMS.easingCss ? win.KWMS.easingCss(cfg.easing) : "ease";
    var enterFrames = ENTER[cfg.preset] || ENTER.scale;
    var current = "", seq = 0, pending = [], shown = items.map(function () { return true; });
    bar.hidden = false; el.classList.add("kw-ms-live");

    function finalize() { pending.splice(0).forEach(function (a) { try { a.cancel(); } catch (e) { /* retirée */ } }); }
    function apply(cat) {
      var token = ++seq; finalize();
      current = cat;
      buttons.forEach(function (b) { var on = b.getAttribute("data-ms-filter") === cat; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      var keep = select(cats, cat), want = items.map(function (it, i) { return keep.indexOf(i) >= 0; });
      if (status) status.textContent = count(keep.length);
      items.forEach(function (it, i) { it.hidden = !shown[i]; }); // fin immédiate d'un filtre précédent interrompu
      if (!animate) { items.forEach(function (it, i) { it.hidden = !want[i]; }); shown = want; return; }
      var first = items.map(function (it, i) { return shown[i] ? it.getBoundingClientRect() : null; });
      var leaving = items.filter(function (it, i) { return shown[i] && !want[i]; });
      var out = leaving.map(function (it) { return it.animate(enterFrames.slice().reverse(), { duration: Math.round(cfg.duration * 0.45), easing: easing, fill: "forwards" }); });
      pending.push.apply(pending, out);
      Promise.all(out.map(function (a) { return a.finished.catch(function () { /* annulée */ }); })).then(function () {
        if (token !== seq) return;
        finalize();
        var wasShown = shown; shown = want;
        items.forEach(function (it, i) { it.hidden = !want[i]; });
        var k = 0;
        items.forEach(function (it, i) {
          if (!want[i]) return;
          if (!wasShown[i]) { pending.push(it.animate(enterFrames, { duration: cfg.duration, delay: (k++) * cfg.stagger, easing: easing, fill: "backwards" })); return; }
          var f = first[i], l = it.getBoundingClientRect();
          if (!f) return;
          var dx = f.left - l.left, dy = f.top - l.top;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) pending.push(it.animate([{ transform: "translate(" + Math.round(dx) + "px," + Math.round(dy) + "px)" }, { transform: NONE }], { duration: cfg.duration, easing: easing }));
        });
      });
    }
    var handlers = buttons.map(function (b) { var fn = function () { if (b.getAttribute("data-ms-filter") !== current) apply(b.getAttribute("data-ms-filter")); }; b.addEventListener("click", fn); return fn; });
    ctx.onCleanup(function () {
      seq++; finalize();
      buttons.forEach(function (b, i) { b.removeEventListener("click", handlers[i]); b.classList.toggle("is-on", i === 0); b.setAttribute("aria-pressed", i === 0 ? "true" : "false"); });
      items.forEach(function (it) { it.hidden = false; });
      bar.hidden = true; el.classList.remove("kw-ms-live"); if (status) status.textContent = "";
    });
    return {};
  }
  return { ENTER: ENTER, select: select, count: count, init: init };
});
