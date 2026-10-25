// Blog de Mon espace : le choix du tri s'applique dès qu'il change (le bouton « Rechercher » reste disponible sans ce script).
document.querySelectorAll("select[data-autosubmit]").forEach(function (select) {
  select.addEventListener("change", function () { if (select.form) select.form.submit(); });
});
