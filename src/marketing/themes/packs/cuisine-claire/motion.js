// Cuisine claire — apparition des guides et traits de cotation qui se dessinent. Aucune dépendance. Sans ce script (ou avec « prefers-reduced-motion » ou le réglage « Animations : aucune »), tout est affiché d'emblée.
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "cuisine-claire") return;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (calm || body.getAttribute("data-pk-motion") === "off" || body.getAttribute("data-pk-cotes") === "off" || !("IntersectionObserver" in window)) return;
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-cc-reveal]"));
  if (!items.length) return;
  body.classList.add("cc-js");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("cc-in"); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  items.forEach(function (el) { io.observe(el); });
})();
