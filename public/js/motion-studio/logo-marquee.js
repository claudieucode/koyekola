// Motion Studio (lot S) — module « logo-marquee » : bande de logos qui défile en boucle.
// Le serveur écrit la liste de logos (grille qui passe à la ligne, sans JavaScript). Ce module copie la liste autant de fois qu'il faut pour remplir la largeur (copies inertes
// et cachées des lecteurs d'écran, jamais focalisables), puis anime la piste en continu (translateX, linéaire). Boucle > 5 s : bouton Pause ; pause aussi au survol / au
// focus (option), hors de la fenêtre et onglet masqué. Mouvement réduit : grille statique. destroy() retire les copies.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("logo-marquee", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  // Nombre de copies à ajouter pour que la piste (liste + copies) couvre la largeur visible + un tour complet
  function copiesNeeded(viewW, listW) { return listW > 0 ? Math.max(1, Math.ceil(viewW / listW)) : 1; }
  // Durée (ms) d'un tour de largeur listW à `speed` px par seconde
  function lapMs(listW, speed) { return Math.round((listW / Math.max(1, speed)) * 1000); }

  function init(ctx) {
    var el = ctx.el, win = ctx.win, doc = ctx.doc, prm = ctx.cfg.params || {};
    if (ctx.reduced) return {};
    var view = el.querySelector("[data-ms-view]"), track = el.querySelector("[data-ms-track]"), list = el.querySelector("[data-ms-list]");
    if (!view || !track || !list || list.children.length < 2 || typeof track.animate !== "function") return {};
    var speed = Math.min(300, Math.max(10, Number(prm.speed) || 60)), dir = prm.direction === "right" ? 1 : -1, pauseHover = prm.pauseHover !== false;
    var dead = false, anim = null, clones = [], btn = null, io = null, pending = 0;
    var imgs = Array.prototype.slice.call(list.querySelectorAll("img"));
    imgs.forEach(function (im) { if (im.loading === "lazy") im.loading = "eager"; });
    var waiting = imgs.filter(function (im) { return !im.complete; });
    var state = { user: false, hover: false, focus: false, away: false, hidden: false };
    var sync = function () { if (!anim) return; try { if (state.user || state.hover || state.focus || state.away || state.hidden) anim.pause(); else anim.play(); } catch (e) { /* retirée */ } };

    function build() {
      if (dead) return;
      el.classList.add("kw-ms-live");
      var w = list.getBoundingClientRect().width, vw = view.clientWidth;
      if (!w) return;
      var c = copiesNeeded(vw, w);
      for (var i = 0; i < c; i++) {
        var cl = list.cloneNode(true);
        cl.removeAttribute("data-ms-list"); cl.setAttribute("aria-hidden", "true"); cl.setAttribute("inert", "");
        Array.prototype.forEach.call(cl.querySelectorAll("a, button"), function (a) { a.setAttribute("tabindex", "-1"); });
        track.appendChild(cl); clones.push(cl);
      }
      var frames = dir < 0 ? [{ transform: "translateX(0)" }, { transform: "translateX(" + -w + "px)" }] : [{ transform: "translateX(" + -w + "px)" }, { transform: "translateX(0)" }];
      anim = track.animate(frames, { duration: lapMs(w, speed), iterations: Infinity, easing: "linear" });
      btn = doc.createElement("button"); btn.type = "button"; btn.className = "kw-ms-lm-pause"; btn.textContent = "Mettre le défilement des logos en pause";
      btn.addEventListener("click", function () { state.user = !state.user; btn.textContent = state.user ? "Relancer le défilement des logos" : "Mettre le défilement des logos en pause"; sync(); });
      el.appendChild(btn);
      sync();
    }
    var go = function () { pending = 0; build(); };
    // Les largeurs des logos dépendent du chargement des images : on attend (3 s au plus) avant de mesurer
    if (waiting.length) {
      var left = waiting.length, t = win.setTimeout(function () { if (!pending) return; go(); }, 3000);
      pending = 1;
      var one = function () { left--; if (left <= 0 && pending) { win.clearTimeout(t); go(); } };
      waiting.forEach(function (im) { im.addEventListener("load", one); im.addEventListener("error", one); });
      ctx.onCleanup(function () { win.clearTimeout(t); waiting.forEach(function (im) { im.removeEventListener("load", one); im.removeEventListener("error", one); }); });
    } else build();

    var enter = function () { if (pauseHover) { state.hover = true; sync(); } }, leave = function () { state.hover = false; sync(); };
    var fin = function (e) { if (pauseHover && e.target !== btn) { state.focus = true; sync(); } }, fout = function () { state.focus = false; sync(); };
    var vis = function () { state.hidden = Boolean(doc.hidden); sync(); };
    view.addEventListener("mouseenter", enter); view.addEventListener("mouseleave", leave); el.addEventListener("focusin", fin); el.addEventListener("focusout", fout); doc.addEventListener("visibilitychange", vis);
    if (win.IntersectionObserver) { io = new win.IntersectionObserver(function (es) { state.away = !es[es.length - 1].isIntersecting; sync(); }); io.observe(el); }
    ctx.onResize(function () { ctx.rebuild(); });
    ctx.onCleanup(function () {
      dead = true; if (io) io.disconnect();
      view.removeEventListener("mouseenter", enter); view.removeEventListener("mouseleave", leave); el.removeEventListener("focusin", fin); el.removeEventListener("focusout", fout); doc.removeEventListener("visibilitychange", vis);
      if (anim) { try { anim.cancel(); } catch (e) { /* retirée */ } }
      clones.forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); });
      if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
      el.classList.remove("kw-ms-live");
    });
    return {};
  }
  return { copiesNeeded: copiesNeeded, lapMs: lapMs, init: init };
});
