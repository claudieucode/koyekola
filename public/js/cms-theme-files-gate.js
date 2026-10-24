/* Avertissement avant l'éditeur de fichiers des thèmes : la boîte devient modale (focus piégé, Échap = retour en sécurité). Sans JavaScript, elle reste affichée dans la page.
   Rien n'est mémorisé : la confirmation est enregistrée côté serveur, à usage unique. */
(function () {
  "use strict";
  var dlg = document.querySelector("[data-tf-gate]");
  if (!dlg) return;
  var form = dlg.querySelector("[data-tf-gate-form]"), go = dlg.querySelector("[data-tf-gate-continue]"), back = dlg.querySelector("[data-tf-gate-back]");
  var leave = function () { location.href = dlg.getAttribute("data-tf-back") || back.getAttribute("href"); };
  var busy = false;
  form.addEventListener("submit", function (e) { if (busy) { e.preventDefault(); return; } busy = true; go.disabled = true; go.setAttribute("aria-busy", "true"); back.setAttribute("aria-disabled", "true"); });
  back.addEventListener("click", function (e) { if (busy) e.preventDefault(); });
  if (typeof dlg.showModal === "function") {
    dlg.removeAttribute("open"); dlg.showModal();
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); if (!busy) leave(); }); // Échap : annule l'accès, ne confirme jamais
    back.focus(); // focus sur l'action sûre
  }
})();
