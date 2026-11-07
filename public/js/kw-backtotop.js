// Retour en haut (widget « backtotop » du pied de page). Sans ce script le lien « # » remonte quand même et reste visible.
// Avec : le bouton fixé n'apparaît qu'après un défilement (seuil réglé dans le widget), le défilement est fluide SAUF si la personne demande moins de mouvement,
// et le focus clavier revient au début de la page (le lien reste atteignable et utilisable au clavier : c'est un vrai lien).
(function () {
  if (window.__kwBackToTop) return;
  window.__kwBackToTop = true;
  var boxes = [].slice.call(document.querySelectorAll("[data-kw-btt]"));
  if (!boxes.length) return;
  var reduced = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function update() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    boxes.forEach(function (box) {
      var limit = parseInt(box.getAttribute("data-kw-btt"), 10) || 0;
      box.classList.toggle("is-visible", y > limit);
    });
  }
  boxes.forEach(function (box) {
    box.classList.add("is-armed");
    var link = box.querySelector("a");
    if (!link) return;
    link.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: reduced.matches ? "auto" : "smooth" });
      var target = document.querySelector("main, [role=main]") || document.body;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      try { target.focus({ preventScroll: true }); } catch (err) { /* focus indisponible : sans importance */ }
    });
  });
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; update(); });
  }, { passive: true });
  update();
})();
