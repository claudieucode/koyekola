// Éditeur de la page « À propos » : boutons d'ajout de parties (titre seulement), compteurs de caractères, « texte par défaut », alerte avant de quitter avec des modifications non enregistrées.
// Le formulaire fonctionne aussi sans ce script (champ texte + Enregistrer).
(function () {
  "use strict";
  var form = document.querySelector("[data-page-form]");
  if (!form) return;
  var area = form.querySelector("[data-page-content]"), desc = form.querySelector("[data-page-desc]");
  var count = form.querySelector("[data-page-count]"), dcount = form.querySelector("[data-page-desc-count]");
  var dirty = false, submitting = false, initial = area.value + "\u0000" + desc.value;
  var refresh = function () { count.textContent = String(area.value.length); dcount.textContent = String(desc.value.length); dirty = (area.value + "\u0000" + desc.value) !== initial; };
  area.addEventListener("input", refresh); desc.addEventListener("input", refresh); refresh();
  // ajoute le modèle à la position du curseur (ou à la fin), sur une nouvelle ligne
  form.querySelectorAll("[data-ins]").forEach(function (b) {
    b.addEventListener("click", function () {
      var ins = b.getAttribute("data-ins"), v = area.value, pos = area.selectionStart == null ? v.length : area.selectionStart;
      var head = v.slice(0, pos), tail = v.slice(pos);
      var sep = head && !/\n\n$/.test(head) ? (/\n$/.test(head) ? "\n" : "\n\n") : "";
      if (v.length + sep.length + ins.length > Number(area.getAttribute("maxlength"))) return;
      area.value = head + sep + ins + tail;
      var at = (head + sep + ins).length; area.focus(); area.setSelectionRange(at, at); refresh();
    });
  });
  var def = form.querySelector("[data-page-default]");
  // Boutons qui demandent confirmation avant d'envoyer leur formulaire (ex. « Revenir au texte simple »)
  Array.prototype.forEach.call(document.querySelectorAll("[data-confirm-text]:not([data-page-default])"), function (b) { b.addEventListener("click", function (e) { if (!window.confirm(b.getAttribute("data-confirm-text"))) e.preventDefault(); }); });
  if (def) def.addEventListener("click", function () { if (window.confirm(def.getAttribute("data-confirm-text"))) { area.value = ""; refresh(); area.focus(); } });
  form.addEventListener("submit", function () { submitting = true; });
  window.addEventListener("beforeunload", function (e) { if (dirty && !submitting) { e.preventDefault(); e.returnValue = ""; } });
})();
