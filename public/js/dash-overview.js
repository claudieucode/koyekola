// Vue d'ensemble : au survol ou au focus d'une barre du graphique, la ligne de lecture indique le jour, le nombre de ventes et le montant (texte déjà présent dans la page,
// jamais recalculé ici). Sans ce script, chaque barre garde son libellé accessible (aria-label) : aucune information n'en dépend.
(function () {
  var chart = document.querySelector("[data-ov-chart]");
  var readout = document.querySelector("[data-ov-readout]");
  if (!chart || !readout) return;
  var fallback = readout.getAttribute("data-default") || "";
  var show = function (bar) { readout.textContent = bar ? bar.getAttribute("data-label") : fallback; readout.classList.toggle("is-live", Boolean(bar)); };
  chart.addEventListener("pointerover", function (e) { var bar = e.target.closest(".ov-bar"); if (bar && !bar.classList.contains("is-zero")) show(bar); });
  chart.addEventListener("pointerleave", function () { show(null); });
  chart.addEventListener("focusin", function (e) { var bar = e.target.closest(".ov-bar"); if (bar) show(bar); });
  chart.addEventListener("focusout", function () { show(null); });
  // Un seul arrêt de tabulation pour tout le graphique ; les flèches parcourent les jours avec ventes (début et fin avec Origine et Fin)
  chart.addEventListener("keydown", function (e) {
    var keys = { ArrowLeft: -1, ArrowRight: 1, Home: "first", End: "last" }; if (!(e.key in keys)) return;
    var bars = Array.prototype.slice.call(chart.querySelectorAll(".ov-bar[tabindex]")); var at = bars.indexOf(document.activeElement); if (at < 0) return;
    var next = keys[e.key] === "first" ? 0 : keys[e.key] === "last" ? bars.length - 1 : Math.max(0, Math.min(bars.length - 1, at + keys[e.key]));
    e.preventDefault(); bars.forEach(function (b) { b.setAttribute("tabindex", "-1"); }); bars[next].setAttribute("tabindex", "0"); bars[next].focus();
  });
})();
