/* Petit Nid — apparition douce des étapes du guide. Aucune dépendance. Sans ce script (ou si l'utilisateur préfère moins de mouvement), toutes les étapes sont visibles d'emblée. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "petit-nid") return;
  if (body.getAttribute("data-pk-apparition") === "off" || body.getAttribute("data-pk-motion") === "off") return;
  if (!window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  var steps = document.querySelectorAll(".pn-st");
  if (!steps.length) return;
  body.classList.add("pn-js");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("pn-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
  Array.prototype.forEach.call(steps, function (s) { io.observe(s); });
})();
