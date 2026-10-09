// KOLAKISA CMS → Utilisateurs et rôles : sélection des permissions d'un rôle (tout / rien / par groupe) et compteur. Tout l'enregistrement
// passe par de vrais formulaires ; ce script ne fait que cocher des cases.
(function () {
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = document.querySelector("[data-us-roleform]");
  if (form) {
    var boxes = function () { return $$("[data-us-perm]", form).filter(function (b) { return !b.disabled; }); };
    var count = $$("[data-us-count]", form)[0] || document.querySelector("[data-us-count]");
    var refresh = function () { if (count) { var all = $$("[data-us-perm]", form); count.textContent = all.filter(function (b) { return b.checked; }).length + " permission(s) cochée(s) sur " + all.length; } };
    $$("[data-us-all]", form).forEach(function (b) { b.addEventListener("click", function () { var on = b.getAttribute("data-us-all") === "1"; boxes().forEach(function (x) { x.checked = on; }); refresh(); }); });
    $$("[data-us-group-all]", form).forEach(function (b) { b.addEventListener("click", function () { var on = b.getAttribute("data-us-group-all") === "1"; $$("[data-us-perm]", b.closest("[data-us-group]")).filter(function (x) { return !x.disabled; }).forEach(function (x) { x.checked = on; }); refresh(); }); });
    form.addEventListener("change", refresh);
    refresh();
  }
  $$("[data-us-autosubmit]").forEach(function (s) { s.addEventListener("change", function () { s.form.submit(); }); });
})();
