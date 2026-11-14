// Administration de la boutique : confort d'usage uniquement (aucune donnée, aucune requête).
// 1) onglet actif visible + bords estompés quand la barre défile ; 2) étiquettes des cellules pour l'affichage en fiches sur mobile ;
// 3) bouton « occupé » à l'envoi d'un formulaire (évite le double clic, montre que l'action est en cours).
(function () {
  "use strict";
  var nav = document.querySelector("[data-bq-tabs]");
  if (nav) {
    var edges = function () {
      var max = nav.scrollWidth - nav.clientWidth;
      nav.classList.toggle("has-more-start", nav.scrollLeft > 4);
      nav.classList.toggle("has-more-end", nav.scrollLeft < max - 4);
    };
    var cur = nav.querySelector('[aria-current="page"]');
    if (cur && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2);
    nav.addEventListener("scroll", edges, { passive: true });
    window.addEventListener("resize", edges);
    edges();
  }
  Array.prototype.forEach.call(document.querySelectorAll(".mk-shop table.mk-table"), function (table) {
    table.classList.add("mk-datatable");
    var heads = Array.prototype.map.call(table.querySelectorAll("thead th"), function (th) { return (th.textContent || "").trim(); });
    Array.prototype.forEach.call(table.querySelectorAll("tbody tr"), function (tr) {
      Array.prototype.forEach.call(tr.children, function (cell, i) { if (cell.tagName === "TD" && heads[i] && !cell.hasAttribute("data-label")) cell.setAttribute("data-label", heads[i]); });
    });
  });
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form || !form.closest || !form.closest(".mk-shop") || e.defaultPrevented) return;
    var btn = e.submitter || form.querySelector('button[type="submit"]');
    if (btn && !btn.hasAttribute("data-mk-confirm")) { btn.classList.add("is-busy"); setTimeout(function () { btn.classList.remove("is-busy"); }, 8000); }
  });
})();
