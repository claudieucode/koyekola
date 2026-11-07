/* Deuxième Vie — les barres de l'échelle d'état se remplissent une fois, quand la fiche entre à l'écran. Aucune dépendance, aucun stockage.
   Sans script (ou avec « réduire les animations »), les barres sont déjà pleines : l'information ne dépend jamais de l'animation. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "deuxieme-vie") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (body.getAttribute("data-pk-remplissage") === "off") return;
  var cibles = document.querySelectorAll("[data-dv-etat]");
  if (!cibles.length || !("IntersectionObserver" in window)) return;
  body.classList.add("dv-js");
  var obs = new IntersectionObserver(function (items) {
    items.forEach(function (it) { if (it.isIntersecting) { it.target.classList.add("dv-vu"); obs.unobserve(it.target); } });
  }, { threshold: 0.25 });
  Array.prototype.forEach.call(cibles, function (n) { obs.observe(n); });
})();
