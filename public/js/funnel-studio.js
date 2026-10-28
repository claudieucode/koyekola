// Funnel Studio : recherche dans la liste des tunnels (filtre d'affichage seulement : aucune donnée écrite, aucune requête).
(function () {
  "use strict";
  var input = document.querySelector("[data-fs-search]");
  var list = document.querySelector("[data-fs-list]");
  if (!input || !list) return;
  var cards = Array.prototype.slice.call(list.querySelectorAll(".fs-card"));
  var none = document.querySelector("[data-fs-nomatch]");
  var live = document.querySelector("[data-fs-count]");
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); };
  var names = cards.map(function (c) { return norm(c.getAttribute("data-fs-name")); });
  var frame = 0;
  function apply() {
    var q = norm(input.value), shown = 0;
    cards.forEach(function (c, i) { var ok = !q || names[i].indexOf(q) !== -1; c.hidden = !ok; if (ok) shown++; });
    if (none) none.hidden = shown !== 0;
    if (live) live.textContent = q ? shown + (shown > 1 ? " tunnels affichés" : " tunnel affiché") : "";
  }
  input.addEventListener("input", function () { cancelAnimationFrame(frame); frame = requestAnimationFrame(apply); });
  input.addEventListener("keydown", function (e) { if (e.key === "Escape" && input.value) { input.value = ""; apply(); } });
})();
