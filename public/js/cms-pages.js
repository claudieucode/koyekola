// Listes du CMS (pages, articles) : sélection multiple et actions groupées (la liste elle-même est rendue par le serveur).
// Le nom de l'élément se lit dans data-cms-noun (« page » par défaut, « article » pour les articles).
(function () {
  var form = document.querySelector("[data-cms-bulk]");
  if (!form) return;
  var noun = form.getAttribute("data-cms-noun") || "page";
  var rows = Array.prototype.slice.call(document.querySelectorAll("[data-cms-row]"));
  var all = document.querySelector("[data-cms-select-all]");
  var select = form.querySelector("select[name=action]");
  var apply = form.querySelector("button[type=submit]");
  var count = form.querySelector("[data-cms-bulk-count]");
  function refresh() {
    var n = rows.filter(function (r) { return r.checked; }).length;
    select.disabled = n === 0;
    apply.disabled = n === 0 || !select.value;
    count.textContent = n ? n + " " + noun + (n > 1 ? "s" : "") + " sélectionné" + (noun === "page" ? "e" : "") + (n > 1 ? "s" : "") : "";
    if (all) { all.checked = n > 0 && n === rows.length; all.indeterminate = n > 0 && n < rows.length; }
  }
  if (all) all.addEventListener("change", function () { rows.forEach(function (r) { r.checked = all.checked; }); refresh(); });
  rows.forEach(function (r) { r.addEventListener("change", refresh); });
  select.addEventListener("change", refresh);
  var confirmed = false;
  form.addEventListener("submit", function (e) {
    if (confirmed) return;
    var many = rows.filter(function (r) { return r.checked; }).length;
    var plural = many > 1 ? noun + "s" : noun;
    var texts = {
      corbeille: { title: "Mettre à la corbeille ?", text: many + " " + plural + " " + (many > 1 ? "passeront" : "passera") + " hors ligne ; vous pourrez " + (many > 1 ? "les" : "le") + " restaurer.", ok: "Mettre à la corbeille" },
      supprimer: { title: "Supprimer définitivement ?", text: many + " " + plural + " " + (many > 1 ? "seront supprimés" : "sera supprimé") + " pour de bon, avec " + (many > 1 ? "leurs" : "ses") + " statistiques et versions. Cette action est irréversible.", ok: "Supprimer" },
    }[select.value];
    if (texts && form.hasAttribute("data-cms-terms")) texts = { title: "Supprimer la sélection ?", text: many + " " + plural + " " + (many > 1 ? "seront supprimées" : "sera supprimée") + ". Aucun article n'est supprimé ; les termes utilisés sont refusés.", ok: "Supprimer" };
    if (!texts) return;
    e.preventDefault();
    var go = function () { confirmed = true; form.submit(); };
    if (window.mkConfirm) window.mkConfirm(texts, go); else if (window.confirm(texts.text)) go();
  });
  refresh();
})();
