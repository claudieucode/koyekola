// KOLAKISA CMS → Paramètres (palier 14) : suivi des modifications non enregistrées et état d'enregistrement.
// L'enregistrement est un vrai envoi de formulaire : « Enregistré » n'apparaît qu'après la réponse du serveur (message du CMS au rechargement).
(function () {
  var form = document.querySelector("[data-st-form]");
  var sel = document.querySelector("[data-tools-site]");
  if (sel) sel.addEventListener("change", function () { if (dirty && !window.confirm("Des modifications ne sont pas enregistrées. Changer de périmètre les abandonne. Continuer ?")) return; dirty = false; sel.form.submit(); });
  var dirty = false;
  if (!form) return;
  var state = form.querySelector("[data-st-state]");
  var save = form.querySelector("[data-st-save]");
  var snapshot = function () { return Array.prototype.map.call(form.elements, function (el) { return el.name ? el.name + "=" + (el.type === "checkbox" ? el.checked : el.value) : ""; }).join("&"); };
  var initial = snapshot();
  var refresh = function () { dirty = snapshot() !== initial; if (state) state.textContent = dirty ? "Modifications non enregistrées" : ""; };
  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  form.addEventListener("submit", function (e) {
    var submitter = e.submitter;
    if (submitter && submitter.hasAttribute("data-st-reset") && !window.confirm("Restaurer les valeurs par défaut de ce groupe ? Les valeurs actuelles seront remplacées.")) { e.preventDefault(); return; }
    dirty = false;
    if (state) state.textContent = "Enregistrement…";
    if (save) save.disabled = true;
  });
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  window.addEventListener("pageshow", function () { if (save) save.disabled = false; });
})();
