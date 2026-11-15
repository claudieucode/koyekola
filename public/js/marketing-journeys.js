// Bibliothèque de parcours : recherche instantanée et filtres appliqués sans bouton. Amélioration progressive : sans
// JavaScript, le formulaire (méthode GET) et le bouton « Filtrer » font exactement la même chose, côté serveur.
(function () {
  "use strict";
  var form = document.querySelector("[data-journey-filters]");
  if (!form) return;
  var search = form.querySelector('input[name="q"]');
  var KEY = "mkJourneySearchFocus";
  var timer = null;

  function submit() {
    try { if (document.activeElement === search) sessionStorage.setItem(KEY, "1"); } catch (e) { /* stockage indisponible : sans effet */ }
    form.submit();
  }

  // Après le rechargement provoqué par la frappe, le curseur revient dans le champ (à la fin du texte)
  try {
    if (sessionStorage.getItem(KEY) === "1" && search) {
      sessionStorage.removeItem(KEY);
      search.focus();
      var end = search.value.length;
      search.setSelectionRange(end, end);
    }
  } catch (e) { /* ignoré */ }

  if (search) {
    search.addEventListener("input", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(submit, 350);
    });
  }
  form.querySelectorAll("select").forEach(function (select) { select.addEventListener("change", submit); });
})();

// Fiche d'un parcours : bascule ordinateur / mobile de l'aperçu réel des e-mails (largeur du cadre seulement, aucun rechargement)
(function () {
  "use strict";
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-jp-view]"); if (!b) return;
    var mobile = b.getAttribute("data-jp-view") === "mobile";
    document.querySelectorAll("[data-jp-view]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    document.querySelectorAll("[data-jp-stage]").forEach(function (s) { s.classList.toggle("is-mobile", mobile); });
  });
})();
