// Administration de la boutique : confort d'usage uniquement (aucune donnée, aucune requête).
// 1) barre latérale de la boutique : sélecteur compact sur mobile, rubrique active visible ; 2) étiquettes des cellules pour l'affichage en fiches sur mobile ;
// 3) bouton « occupé » à l'envoi d'un formulaire (évite le double clic, montre que l'action est en cours).
(function () {
  "use strict";
  var side = document.querySelector("[data-bq-side]");
  if (side) {
    var toggle = side.querySelector("[data-bq-toggle]");
    var setOpen = function (open) { side.classList.toggle("is-open", open); if (toggle) toggle.setAttribute("aria-expanded", String(open)); };
    if (toggle) toggle.addEventListener("click", function () { setOpen(!side.classList.contains("is-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && side.classList.contains("is-open")) { setOpen(false); if (toggle) toggle.focus(); } });
    document.addEventListener("click", function (e) { if (side.classList.contains("is-open") && !side.contains(e.target)) setOpen(false); });
    // Grand écran : la rubrique active reste visible si la liste défile
    var list = side.querySelector(".bq-side-nav"), cur = side.querySelector('[aria-current="page"]');
    if (list && cur && list.scrollHeight > list.clientHeight) cur.scrollIntoView({ block: "nearest" });
  }
  Array.prototype.forEach.call(document.querySelectorAll(".mk-shop table.mk-table"), function (table) {
    table.classList.add("mk-datatable");
    var heads = Array.prototype.map.call(table.querySelectorAll("thead th"), function (th) { return (th.textContent || "").trim(); });
    // En-tête aligné comme sa colonne : si toutes les cellules d'une colonne sont numériques (classe mk-num), l'en-tête l'est aussi
    Array.prototype.forEach.call(table.querySelectorAll("thead th"), function (th, i) {
      var cells = Array.prototype.map.call(table.querySelectorAll("tbody tr"), function (tr) { return tr.children[i]; }).filter(function (c) { return c && c.tagName === "TD"; });
      if (cells.length && cells.every(function (c) { return c.classList.contains("mk-num"); })) th.classList.add("mk-num");
    });
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
