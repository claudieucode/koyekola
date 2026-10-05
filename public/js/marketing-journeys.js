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
