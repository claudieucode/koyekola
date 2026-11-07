/* Carré de Soie — vue du motif en plein écran : zoom réel (boutons, ctrl + molette, double clic, touches + − 0), glissement, Échap pour fermer. Sans ce script, la vue s'ouvre et se ferme
   quand même (balise details) et la « Loupe ×3 » agrandit en CSS. Aucune dépendance. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "carre-soie") return;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduceMotion) document.body.classList.add("pk-calme"); // respecte « moins d'animations » : le CSS du thème coupe aussi ses animations
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var MIN = 1, MAX = 8;
  body.classList.add("cs-js");

  all("details[data-cs-motif]").forEach(function (box) {
    var stage = box.querySelector(".cs-stage"), canvas = box.querySelector(".cs-canvas"), level = box.querySelector("[data-cs-level]"), sum = box.querySelector(".cs-sum");
    if (!stage || !canvas) return;
    var z = 1;

    function apply(next, cx, cy) {
      next = Math.max(MIN, Math.min(MAX, Math.round(next * 100) / 100));
      if (next === z) return;
      // garde le point regardé (centre de l'écran, ou le curseur) au même endroit
      var w0 = stage.scrollWidth, h0 = stage.scrollHeight;
      var ox = cx == null ? stage.clientWidth / 2 : cx, oy = cy == null ? stage.clientHeight / 2 : cy;
      var px = (stage.scrollLeft + ox) / w0, py = (stage.scrollTop + oy) / h0;
      z = next;
      canvas.style.setProperty("--cs-z", String(z));
      stage.scrollLeft = px * stage.scrollWidth - ox;
      stage.scrollTop = py * stage.scrollHeight - oy;
      if (level) level.textContent = Math.round(z * 100) + " %";
    }
    function reset() { z = 0; apply(1); stage.scrollLeft = 0; stage.scrollTop = 0; }

    all("[data-cs-z]", box).forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var d = a.getAttribute("data-cs-z");
        if (d === "0") reset(); else apply(z * (d === "1" ? 1.5 : 1 / 1.5));
      });
    });
    // pincement du pavé tactile (ctrl + molette) : zoom sur le curseur ; la molette seule fait défiler
    stage.addEventListener("wheel", function (e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      var r = stage.getBoundingClientRect();
      apply(z * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    canvas.addEventListener("dblclick", function (e) {
      var r = stage.getBoundingClientRect();
      if (z > 1) reset(); else apply(3, e.clientX - r.left, e.clientY - r.top);
    });
    // glisser pour se déplacer (souris)
    var drag = null;
    stage.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, l: stage.scrollLeft, t: stage.scrollTop };
      stage.classList.add("cs-drag");
    });
    window.addEventListener("pointermove", function (e) { if (drag) { stage.scrollLeft = drag.l - (e.clientX - drag.x); stage.scrollTop = drag.t - (e.clientY - drag.y); } });
    window.addEventListener("pointerup", function () { drag = null; stage.classList.remove("cs-drag"); });

    box.addEventListener("toggle", function () {
      if (box.open) {
        all("details[data-cs-motif]").forEach(function (o) { if (o !== box && o.open) o.open = false; });
        reset();
        stage.setAttribute("tabindex", "-1");
        stage.focus({ preventScroll: true });
      } else if (sum && document.activeElement && box.contains(document.activeElement)) { sum.focus({ preventScroll: true }); }
    });
    box.addEventListener("keydown", function (e) {
      if (!box.open) return;
      if (e.key === "Escape") { e.preventDefault(); box.open = false; if (sum) sum.focus(); }
      else if (e.key === "+" || e.key === "=") apply(z * 1.5);
      else if (e.key === "-" || e.key === "_") apply(z / 1.5);
      else if (e.key === "0") reset();
    });
  });
})();
