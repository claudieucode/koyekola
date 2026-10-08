// Liste des pages du CMS : sélection multiple et actions groupées (la liste elle-même est rendue par le serveur).
(function () {
  var form = document.querySelector("[data-cms-bulk]");
  if (!form) return;
  var rows = Array.prototype.slice.call(document.querySelectorAll("[data-cms-row]"));
  var all = document.querySelector("[data-cms-select-all]");
  var select = form.querySelector("select[name=action]");
  var apply = form.querySelector("button[type=submit]");
  var count = form.querySelector("[data-cms-bulk-count]");
  function refresh() {
    var n = rows.filter(function (r) { return r.checked; }).length;
    select.disabled = n === 0;
    apply.disabled = n === 0 || !select.value;
    count.textContent = n ? n + " page" + (n > 1 ? "s" : "") + " sélectionnée" + (n > 1 ? "s" : "") : "";
    if (all) { all.checked = n > 0 && n === rows.length; all.indeterminate = n > 0 && n < rows.length; }
  }
  if (all) all.addEventListener("change", function () { rows.forEach(function (r) { r.checked = all.checked; }); refresh(); });
  rows.forEach(function (r) { r.addEventListener("change", refresh); });
  select.addEventListener("change", refresh);
  form.addEventListener("submit", function (e) {
    var label = { corbeille: "Mettre les pages sélectionnées à la corbeille ? Elles passeront hors ligne ; vous pourrez les restaurer.", supprimer: "Supprimer définitivement les pages sélectionnées, avec leurs statistiques et leurs versions ? Cette action est irréversible." }[select.value];
    if (label && !window.confirm(label)) e.preventDefault();
  });
  refresh();
})();
