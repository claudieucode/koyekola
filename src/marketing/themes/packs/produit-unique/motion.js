/* Produit unique — deux améliorations facultatives, sans dépendance ; la page fonctionne entièrement sans script.
   1. Les liens « Acheter » (attribut data-pu-fiche) pointent par défaut vers /boutique ; s'il y a sur la page la carte du produit vedette (widget boutique réel), ils sont redirigés vers SA vraie fiche.
   2. Les éléments des chapitres se dévoilent au défilement (sauf si l'animation est réduite ou coupée). Rien n'est mémorisé, rien n'est envoyé. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "produit-unique") return;
  var card = document.querySelector(".kw-pg-card a[href*='/produit/'], .sh-card a[href*='/produit/']");
  if (card) {
    var href = card.getAttribute("href");
    Array.prototype.forEach.call(document.querySelectorAll("a[data-pu-fiche]"), function (a) { a.setAttribute("href", href); });
  }
  var mode = body.getAttribute("data-pk-motion");
  var calme = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = document.querySelectorAll(".pu-rv");
  if (!items.length || calme || mode === "off" || mode === "calm" || !("IntersectionObserver" in window)) return;
  body.classList.add("pu-js");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("pu-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  Array.prototype.forEach.call(items, function (el) { io.observe(el); });
})();
